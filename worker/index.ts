/**
 * Cloudflare Worker entry point.
 *
 *  - `/api/relay?room=<id>`  -> routes the WebSocket to the room's Durable Object
 *  - everything else         -> served from the precached PWA static assets,
 *                               wrapped in strict security headers
 *
 * One deploy serves both the app and its relay. No plaintext ever transits here.
 */
import { RelayActorGuard, RelayRoom, type Env } from './relay';
import { BlobQuota } from './blob-quota';

type AppEnv = Env & {
  BLOB_QUOTA: DurableObjectNamespace<BlobQuota>;
};

// Content-Security-Policy: lock active content and direct network destinations
// to this origin. This substantially narrows injection/exfiltration paths, but
// same-origin APIs remain security boundaries and are validated independently.
// 'wasm-unsafe-eval' is the narrow allowance WebAssembly (libsodium, hash-wasm)
// needs. There is no third-party analytics or other client-side destination.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  // blob: is needed for object-URL media: decrypted photos/videos are shown via
  // URL.createObjectURL (they never touch the network). Same-origin only, no host widened.
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
].join('; ');

// Ceilings for the R2 blob path. The wire format adds one 12-byte IV and one
// 16-byte GCM tag per 1 MiB plaintext chunk.
const MAX_PLAINTEXT_BLOB = 1024 * 1024 * 1024;
const BLOB_CHUNK = 1024 * 1024;
const BLOB_FRAME_OVERHEAD = 28;
const MAX_PART = 32 * 1024 * 1024; // a single multipart part
const MAX_PARTS = 256;
const BUG_BODY_MAX = 8 * 1024;
const COMPLETE_BODY_MAX = 64 * 1024;
const UPLOAD_ID_MAX = 512;
const ETAG_RE = /^[A-Za-z0-9"_-]{1,256}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const OBJECT_KEY_RE = /^[a-f0-9]{32}$/;
const ROOM_RE = /^[a-f0-9]{64}$/;
// Both origins are intentionally supported production entry points. The
// workers.dev hostname must remain available for already-installed PWAs and is
// held to the same HTTPS/header policy as the custom domain.
const PROD_HOSTS = new Set(['skytale.chat', 'scytale.illogical.workers.dev']);

/** Enforce the declared part size against the REAL streamed bytes. The quota
 *  coordinator reserves this exact amount before R2 accepts any data. */
function exactBody(
  body: ReadableStream<Uint8Array>,
  expected: number,
  max: number,
): ReadableStream<Uint8Array> {
  if (!Number.isSafeInteger(expected) || expected < 1 || expected > max) {
    throw new Error('part size mismatch');
  }
  // R2 requires streamed PUT values to have a known length. FixedLengthStream
  // both preserves that runtime metadata and errors on short/long bodies.
  return body.pipeThrough(new FixedLengthStream(expected));
}

function expectedCipherBytes(plaintextBytes: number): number {
  return plaintextBytes + Math.max(1, Math.ceil(plaintextBytes / BLOB_CHUNK)) * BLOB_FRAME_OVERHEAD;
}

function b64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function newUploadToken(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(32)));
}

function bearerToken(request: Request): string | null {
  const value = request.headers.get('authorization');
  if (!value?.startsWith('Bearer ')) return null;
  const token = value.slice(7);
  return TOKEN_RE.test(token) ? token : null;
}

function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === url.origin;
  } catch {
    return false;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function validUploadId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= UPLOAD_ID_MAX &&
    /^[\x21-\x7e]+$/.test(value)
  );
}

function trustedWebhook(value: string | undefined): string | null {
  if (!value || value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.hash ||
      url.href !== value
    ) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

async function actorHash(request: Request): Promise<string> {
  // CF-Connecting-IP is injected by Cloudflare. Never trust X-Real-IP here:
  // clients can set it themselves. A missing production header collapses to one
  // conservative shared actor instead of accepting a spoofable identity.
  const actor = request.headers.get('cf-connecting-ip') ?? 'missing-cf-actor';
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`scytale-abuse:v1:${actor}`)),
  );
  let out = '';
  for (const byte of digest) out += byte.toString(16).padStart(2, '0');
  return out;
}

async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new Error('content-type');
  const declared = request.headers.get('content-length');
  if (declared !== null) {
    const length = Number(declared);
    if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes) throw new Error('body-size');
  }
  if (!request.body) throw new Error('body-empty');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.length) continue;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel('body too large').catch(() => undefined);
      throw new Error('body-size');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function rateLimited(): Response {
  return new Response('Too many requests', {
    status: 429,
    headers: { 'retry-after': '60', 'cache-control': 'no-store' },
  });
}

async function allowRate(limiter: RateLimit, key: string): Promise<boolean> {
  return (await limiter.limit({ key })).success;
}

/**
 * A Durable Object RPC response can be lost after its transaction committed.
 * Retry the exact idempotent receipt before treating the result as ambiguous.
 */
async function commitBlobQuota(
  quota: DurableObjectStub<BlobQuota>,
  objectKey: string,
  uploadId: string,
  token: string,
  operation: number,
  bytes: number,
): Promise<boolean | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await quota.commit(objectKey, uploadId, token, operation, bytes);
    } catch {
      /* retry the durable receipt once */
    }
  }
  return null;
}

function applySecurityHeaders(headers: Headers, url: URL): void {
  headers.set('Content-Security-Policy', CSP);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  // Camera (QR scanner) + microphone (voice messages), same-origin only; rest off.
  headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()');
  if (url.protocol === 'https:' && PROD_HOSTS.has(url.hostname)) {
    // Deliberately scope HSTS to the two audited production hosts.
    // includeSubDomains/preload would be inappropriate for either parent domain.
    headers.set('Strict-Transport-Security', 'max-age=63072000');
  }
}

function secureResponse(response: Response, url: URL): Response {
  const headers = new Headers(response.headers);
  applySecurityHeaders(headers, url);
  if (url.pathname === '/sw.js' || url.pathname === '/manifest.webmanifest') {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(value: unknown, url: URL, status = 200): Response {
  return secureResponse(
    new Response(JSON.stringify(value), {
      status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    }),
    url,
  );
}

export default {
  async fetch(request: Request, env: AppEnv): Promise<Response> {
    const url = new URL(request.url);

    // Repository-controlled HTTPS enforcement. The Cloudflare zone should additionally
    // enable Always Use HTTPS, but this keeps the application fail-closed after deploy.
    if (PROD_HOSTS.has(url.hostname) && url.protocol !== 'https:') {
      url.protocol = 'https:';
      return new Response(null, {
        status: 308,
        headers: {
          location: url.toString(),
          'cache-control': 'public, max-age=86400',
        },
      });
    }

    if (url.pathname === '/api/relay') {
      const room = url.searchParams.get('room');
      if (!room || !ROOM_RE.test(room)) return secureResponse(new Response('Ungültige Inbox.', { status: 400 }), url);
      if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
        return secureResponse(new Response('WebSocket-Upgrade erforderlich.', { status: 426 }), url);
      }
      const origin = request.headers.get('origin');
      if (origin && !sameOrigin(request, url)) {
        return secureResponse(new Response('Origin nicht erlaubt.', { status: 403 }), url);
      }
      const actor = await actorHash(request);
      const [roomAllowed, actorAllowed] = await Promise.all([
        allowRate(env.RELAY_RATE, `room:${room}`),
        allowRate(env.RELAY_RATE, `actor:${actor}`),
      ]);
      if (!roomAllowed || !actorAllowed) return secureResponse(rateLimited(), url);

      // idFromName is deterministic: both peers with the same room id reach the
      // same Durable Object instance, wherever in the world they connect from.
      const stub = env.RELAY.getByName(room);
      const relayHeaders = new Headers(request.headers);
      // Explicitly overwrite any client-supplied value. The DO rejects requests
      // that did not pass through this Worker and therefore lack this header.
      relayHeaders.set('x-scytale-relay-actor', actor);
      return stub.fetch(new Request(request, { headers: relayHeaders }));
    }

    // Bug reports: the client POSTs a short JSON report to its OWN origin (allowed by
    // `connect-src 'self'`), and the Worker forwards it server-side (no CSP) to an
    // optional webhook and/or the logs. NO end-to-end content ever passes through the
    // client here — only a description and non-sensitive diagnostics the user opted in.
    if (url.pathname === '/api/bug') {
      if (request.method !== 'POST') return secureResponse(new Response('Method not allowed', { status: 405 }), url);
      if (!sameOrigin(request, url)) return secureResponse(new Response('Origin nicht erlaubt.', { status: 403 }), url);
      if (!(await allowRate(env.BUG_RATE, await actorHash(request)))) return secureResponse(rateLimited(), url);
      let body: { category?: unknown; message?: unknown; diagnostics?: unknown };
      try {
        const parsed = await readJsonLimited(request, BUG_BODY_MAX);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('schema');
        body = parsed as typeof body;
      } catch {
        return secureResponse(new Response('Bad request', { status: 400 }), url);
      }
      const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
      const category = clip(body.category, 40);
      const message = clip(body.message, 4000);
      const diagnostics = clip(body.diagnostics, 1500);
      if (!message.trim()) return secureResponse(new Response('Empty', { status: 400 }), url);
      const subject = `🐞 SKYTALE bug report${category ? ` [${category}]` : ''}`;
      const text = `${subject}\n\n${message}${diagnostics ? `\n\n— diagnostics —\n${diagnostics}` : ''}`;
      console.log('bug-report', JSON.stringify({ category, len: message.length, hasDiag: !!diagnostics }));
      try {
        if (env.RESEND_API_KEY && env.BUG_FROM && env.BUG_TO) {
          // Resend transactional email API.
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
            body: JSON.stringify({ from: env.BUG_FROM, to: [env.BUG_TO], subject, text }),
            redirect: 'manual',
            signal: AbortSignal.timeout(8000),
          });
        } else {
          const webhook = trustedWebhook(env.BUG_WEBHOOK_URL);
          if (!webhook) {
            return secureResponse(
              new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }),
              url,
            );
          }
          // `content` works for Discord incoming webhooks, `text` for Slack — send both.
          await fetch(webhook, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ content: text.slice(0, 1900), text: text.slice(0, 3500) }),
            redirect: 'manual',
            signal: AbortSignal.timeout(8000),
          });
        }
      } catch {
        /* sink down — the console.log above still captured it */
      }
      return secureResponse(new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }), url);
    }

    // Large encrypted attachments (videos, up to ~1 GB) live in R2, uploaded via
    // multipart so the client never holds the whole file in memory. The client
    // uploads/downloads CIPHERTEXT ONLY through this same-origin endpoint (so CSP
    // connect-src 'self' holds); the per-file key never leaves the E2E envelope, so the
    // Worker + R2 are zero-knowledge. Key charset is hex (server-generated, unguessable).
    if (url.pathname.startsWith('/api/blob')) {
      if (!env.BLOBS) return secureResponse(new Response('R2 not configured', { status: 503 }), url);
      const mutation =
        url.pathname === '/api/blob/create' ||
        url.pathname === '/api/blob/part' ||
        url.pathname === '/api/blob/complete' ||
        url.pathname === '/api/blob/abort';
      const actor = await actorHash(request);
      if (mutation) {
        if (!sameOrigin(request, url)) {
          return secureResponse(new Response('Origin nicht erlaubt.', { status: 403 }), url);
        }
        if (!(await allowRate(env.UPLOAD_RATE, `write:${actor}`))) {
          return secureResponse(rateLimited(), url);
        }
      }
      const quota = env.BLOB_QUOTA.getByName('global');

      // Begin a multipart upload and reserve its exact encrypted size in a
      // strongly-consistent coordinator before exposing any upload capability.
      if (request.method === 'POST' && url.pathname === '/api/blob/create') {
        const plaintextBytes = Number(url.searchParams.get('size') ?? '');
        if (
          !Number.isSafeInteger(plaintextBytes) ||
          plaintextBytes < 1 ||
          plaintextBytes > MAX_PLAINTEXT_BLOB
        ) {
          return secureResponse(new Response('Bad size', { status: 413 }), url);
        }
        const key = crypto.randomUUID().replaceAll('-', '');
        const token = newUploadToken();
        const upload = await env.BLOBS.createMultipartUpload(key);
        let reservation;
        try {
          reservation = await quota.reserve(
            key,
            upload.uploadId,
            token,
            actor,
            expectedCipherBytes(plaintextBytes),
          );
        } catch {
          await upload.abort().catch(() => undefined);
          return secureResponse(new Response('Quota unavailable', { status: 503 }), url);
        }
        if (!reservation.ok) {
          await upload.abort().catch(() => undefined);
          if (reservation.reason === 'actor_limit') return secureResponse(rateLimited(), url);
          if (reservation.reason === 'unavailable') {
            return secureResponse(new Response('Quota unavailable', { status: 503 }), url);
          }
          return jsonResponse({ error: 'storage_full' }, url, 507);
        }
        return jsonResponse(
          { key, uploadId: upload.uploadId, token, expiresAt: reservation.expiresAt },
          url,
        );
      }

      // Claim the exact body length before streaming. A forged Content-Length or
      // `bytes` query cannot exceed the reservation because the stream is checked too.
      if (request.method === 'PUT' && url.pathname === '/api/blob/part') {
        const key = url.searchParams.get('key') ?? '';
        const uploadId = url.searchParams.get('upload');
        const partNumber = Number(url.searchParams.get('n') ?? '');
        const bytes = Number(url.searchParams.get('bytes') ?? '');
        const token = bearerToken(request);
        const contentType = request.headers.get('content-type')?.split(';', 1)[0].toLowerCase();
        const declaredLength = request.headers.get('content-length');
        if (
          !OBJECT_KEY_RE.test(key) ||
          !validUploadId(uploadId) ||
          !Number.isSafeInteger(partNumber) ||
          partNumber < 1 ||
          partNumber > MAX_PARTS ||
          !Number.isSafeInteger(bytes) ||
          bytes < 1 ||
          bytes > MAX_PART ||
          !token ||
          !request.body ||
          contentType !== 'application/octet-stream' ||
          (declaredLength !== null && Number(declaredLength) !== bytes)
        ) {
          return secureResponse(new Response('Bad request', { status: 400 }), url);
        }
        if (!(await quota.reservePart(key, uploadId, token, partNumber, bytes))) {
          return secureResponse(new Response('Upload capability rejected', { status: 409 }), url);
        }
        const upload = env.BLOBS.resumeMultipartUpload(key, uploadId);
        try {
          const part = await upload.uploadPart(partNumber, exactBody(request.body, bytes, MAX_PART));
          return jsonResponse({ etag: part.etag }, url);
        } catch {
          if (await quota.claimAbort(key, uploadId, token).catch(() => false)) {
            try {
              await upload.abort();
              await quota.release(key, uploadId, token);
            } catch {
              await quota.deferAbort(key, uploadId, token).catch(() => false);
            }
          }
          return secureResponse(new Response('Part size mismatch or upload failed', { status: 413 }), url);
        }
      }

      // Only the bearer that created the upload may complete it. Registered parts
      // must be exactly 1..N and the final R2 size must equal the preclaimed bytes.
      if (request.method === 'POST' && url.pathname === '/api/blob/complete') {
        const token = bearerToken(request);
        let body: unknown;
        try {
          body = await readJsonLimited(request, COMPLETE_BODY_MAX);
        } catch {
          return secureResponse(new Response('Bad request', { status: 400 }), url);
        }
        if (
          !token ||
          !isPlainRecord(body) ||
          Object.keys(body).some((key) => key !== 'key' && key !== 'upload' && key !== 'parts') ||
          !OBJECT_KEY_RE.test(typeof body.key === 'string' ? body.key : '') ||
          !validUploadId(body.upload) ||
          !Array.isArray(body.parts) ||
          body.parts.length < 1 ||
          body.parts.length > MAX_PARTS ||
          body.parts.some(
            (part, index) =>
              !isPlainRecord(part) ||
              Object.keys(part).some((key) => key !== 'n' && key !== 'etag') ||
              !Number.isSafeInteger(part.n) ||
              part.n !== index + 1 ||
              typeof part.etag !== 'string' ||
              !ETAG_RE.test(part.etag),
          )
        ) {
          return secureResponse(new Response('Bad request', { status: 400 }), url);
        }
        const key = body.key as string;
        const uploadId = body.upload as string;
        const parts = body.parts as { n: number; etag: string }[];
        const claim = await quota.claimComplete(
          key,
          uploadId,
          token,
          parts.map((part) => part.n),
        );
        if (claim === null) {
          return secureResponse(new Response('Upload capability rejected', { status: 409 }), url);
        }
        const { reservedBytes: reserved, operation } = claim;
        const upload = env.BLOBS.resumeMultipartUpload(key, uploadId);
        let completed: R2Object;
        try {
          completed = await upload.complete(
            parts.map((part) => ({ partNumber: part.n, etag: part.etag })),
          );
        } catch {
          // A completion response can be lost after R2 committed it. Reconcile that
          // case before reopening the reservation for an ordinary retry.
          let existing: R2Object | null | undefined;
          try {
            existing = await env.BLOBS.head(key);
          } catch {
            existing = undefined;
          }
          if (existing && existing.size === reserved) {
            const committed = await commitBlobQuota(
              quota,
              key,
              uploadId,
              token,
              operation,
              existing.size,
            );
            if (committed === true) {
              return secureResponse(
                new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }),
                url,
              );
            }
            if (committed === null) {
              return secureResponse(new Response('Upload accounting unavailable', { status: 503 }), url);
            }
          }
          if (existing === null) {
            await quota.restoreActive(key, uploadId, token, operation).catch(() => false);
          } else {
            // Head failure, mismatched object, or accounting failure is
            // ambiguous. Keep the reservation charged and let the DO settle it.
            await quota
              .deferCompletionCleanup(key, uploadId, token, operation)
              .catch(() => false);
          }
          return secureResponse(new Response('Upload completion failed', { status: 409 }), url);
        }
        if (completed.size !== reserved) {
          try {
            await env.BLOBS.delete(key);
            await quota.release(key, uploadId, token);
          } catch {
            await quota
              .deferCompletionCleanup(key, uploadId, token, operation)
              .catch(() => false);
          }
          return secureResponse(new Response('Wrong completed size', { status: 413 }), url);
        }
        const committed = await commitBlobQuota(
          quota,
          key,
          uploadId,
          token,
          operation,
          completed.size,
        );
        if (committed === null) {
          // Never delete on an ambiguous RPC result: the first call may have
          // committed both the receipt and accounting before its response was lost.
          return secureResponse(new Response('Upload accounting unavailable', { status: 503 }), url);
        }
        if (!committed) {
          try {
            await env.BLOBS.delete(key);
            await quota.release(key, uploadId, token);
          } catch {
            await quota
              .deferCompletionCleanup(key, uploadId, token, operation)
              .catch(() => false);
          }
          return secureResponse(new Response('Upload accounting failed', { status: 409 }), url);
        }
        return secureResponse(
          new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }),
          url,
        );
      }

      // Abort is authenticated and serialized against completion.
      if (request.method === 'POST' && url.pathname === '/api/blob/abort') {
        const token = bearerToken(request);
        let body: unknown;
        try {
          body = await readJsonLimited(request, COMPLETE_BODY_MAX);
        } catch {
          return secureResponse(new Response('Bad request', { status: 400 }), url);
        }
        if (
          !token ||
          !isPlainRecord(body) ||
          Object.keys(body).some((key) => key !== 'key' && key !== 'upload') ||
          !OBJECT_KEY_RE.test(typeof body.key === 'string' ? body.key : '') ||
          !validUploadId(body.upload)
        ) {
          return secureResponse(new Response('Bad request', { status: 400 }), url);
        }
        const key = body.key as string;
        const uploadId = body.upload as string;
        if (!(await quota.claimAbort(key, uploadId, token))) {
          return secureResponse(new Response('Upload capability rejected', { status: 409 }), url);
        }
        try {
          await env.BLOBS.resumeMultipartUpload(key, uploadId).abort();
          await quota.release(key, uploadId, token);
        } catch {
          await quota.deferAbort(key, uploadId, token).catch(() => false);
          return secureResponse(new Response('Abort failed', { status: 502 }), url);
        }
        return secureResponse(
          new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } }),
          url,
        );
      }

      // GET /api/blob/<key> → stream the ciphertext back (the client decrypts as it reads).
      if (request.method === 'GET' && url.pathname.startsWith('/api/blob/')) {
        const key = url.pathname.slice('/api/blob/'.length);
        // 16..64 keeps already-issued capability URLs readable; new uploads are exactly 32.
        if (!/^[a-f0-9]{16,64}$/.test(key)) {
          return secureResponse(new Response('Bad key', { status: 400 }), url);
        }
        if (!(await allowRate(env.UPLOAD_RATE, `read:${actor}`))) {
          return secureResponse(rateLimited(), url);
        }
        const obj = await env.BLOBS.get(key);
        if (!obj) return secureResponse(new Response('Not found', { status: 404 }), url);
        const h = new Headers();
        h.set('content-type', 'application/octet-stream');
        h.set('content-length', String(obj.size));
        h.set('cache-control', 'private, no-store');
        return secureResponse(new Response(obj.body, { status: 200, headers: h }), url);
      }
      // No client DELETE: an unauthenticated delete lets any key-holder wipe a blob out from
      // under a co-recipient. Objects are reclaimed by the R2 lifecycle TTL instead.
      return secureResponse(
        new Response('Method not allowed', { status: 405, headers: { allow: 'GET, POST, PUT' } }),
        url,
      );
    }

    return secureResponse(await env.ASSETS.fetch(request), url);
  },
} satisfies ExportedHandler<AppEnv>;

export { BlobQuota, RelayActorGuard, RelayRoom };
