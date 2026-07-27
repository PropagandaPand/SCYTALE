/**
 * Cloudflare Worker entry point.
 *
 *  - `/api/relay?room=<id>`  -> routes the WebSocket to the room's Durable Object
 *  - everything else         -> served from the precached PWA static assets,
 *                               wrapped in strict security headers
 *
 * One deploy serves both the app and its relay. No plaintext ever transits here.
 */
import { RelayRoom, type Env } from './relay';

// Content-Security-Policy: lock the app to its own origin. NO external scripts,
// styles, fonts, images OR network destinations — so even a successful XSS can
// neither INJECT code into the key-holding context nor exfiltrate to a foreign
// host. 'wasm-unsafe-eval' is the narrow allowance WebAssembly (libsodium,
// hash-wasm) needs. `connect-src 'self'` is total: the app talks only to its own
// relay (there is no third-party analytics or any other outbound destination).
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

// Ceilings for the R2 blob path (bound abuse from the open upload endpoint). The client
// caps the plaintext at ~1 GB; ciphertext is marginally larger (12+16 B per 1 MiB chunk).
const MAX_BLOB = 1100 * 1024 * 1024; // ~1.05 GB total object
const MAX_PART = 32 * 1024 * 1024; // a single multipart part
// Total-storage brake: stay inside R2's 10 GB free tier. A new upload is refused if it
// would push the bucket past this. No counter to drift — we sum the (near-empty, thanks
// to delete-after-download) bucket live. Bounded overshoot: one in-flight file per race.
const STORAGE_BUDGET = 9 * 1024 * 1024 * 1024; // 9 GB, headroom under the 10 GB free limit

/** Cap a request body to `max` REAL bytes server-side (Content-Length is client-supplied
 *  and unenforced by R2). The stream errors past the cap, which rejects the uploadPart. */
function capBody(body: ReadableStream<Uint8Array>, max: number): ReadableStream<Uint8Array> {
  let seen = 0;
  return body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, ctrl) {
        seen += chunk.byteLength;
        if (seen > max) ctrl.error(new Error('part too large'));
        else ctrl.enqueue(chunk);
      },
    }),
  );
}

/** Live total of stored object bytes (completed objects; in-progress multipart parts are
 *  not counted until complete). Cheap because the bucket only holds in-flight transfers. */
async function bucketBytes(bucket: R2Bucket): Promise<number> {
  let total = 0;
  let cursor: string | undefined;
  do {
    const l = await bucket.list({ cursor, limit: 1000 });
    for (const o of l.objects) total += o.size;
    cursor = l.truncated ? l.cursor : undefined;
  } while (cursor);
  return total;
}

function applySecurityHeaders(headers: Headers): void {
  headers.set('Content-Security-Policy', CSP);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  // Camera (QR scanner) + microphone (voice messages), same-origin only; rest off.
  headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/relay') {
      const room = url.searchParams.get('room');
      if (!room) return new Response('Fehlender room-Parameter.', { status: 400 });

      // idFromName is deterministic: both peers with the same room id reach the
      // same Durable Object instance, wherever in the world they connect from.
      const id = env.RELAY.idFromName(room);
      const stub = env.RELAY.get(id);
      return stub.fetch(request);
    }

    // Bug reports: the client POSTs a short JSON report to its OWN origin (allowed by
    // `connect-src 'self'`), and the Worker forwards it server-side (no CSP) to an
    // optional webhook and/or the logs. NO end-to-end content ever passes through the
    // client here — only a description and non-sensitive diagnostics the user opted in.
    if (url.pathname === '/api/bug') {
      if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
      let body: { category?: unknown; message?: unknown; diagnostics?: unknown };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return new Response('Bad request', { status: 400 });
      }
      const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
      const category = clip(body.category, 40);
      const message = clip(body.message, 4000);
      const diagnostics = clip(body.diagnostics, 1500);
      if (!message.trim()) return new Response('Empty', { status: 400 });
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
          });
        } else if (env.BUG_WEBHOOK_URL) {
          // `content` works for Discord incoming webhooks, `text` for Slack — send both.
          await fetch(env.BUG_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ content: text.slice(0, 1900), text: text.slice(0, 3500) }),
          });
        }
      } catch {
        /* sink down — the console.log above still captured it */
      }
      return new Response(null, { status: 204 });
    }

    // Large encrypted attachments (videos, up to ~1 GB) live in R2, uploaded via
    // multipart so the client never holds the whole file in memory. The client
    // uploads/downloads CIPHERTEXT ONLY through this same-origin endpoint (so CSP
    // connect-src 'self' holds); the per-file key never leaves the E2E envelope, so the
    // Worker + R2 are zero-knowledge. Key charset is hex (server-generated, unguessable).
    if (url.pathname.startsWith('/api/blob')) {
      if (!env.BLOBS) return new Response('R2 not configured', { status: 503 });
      const okKey = (k: string) => /^[a-f0-9]{16,64}$/.test(k);
      const json = (o: unknown, status = 200) =>
        new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json' } });

      // Begin a multipart upload → random key + uploadId. Refuse if this file would
      // push the bucket past the storage budget (the client passes its expected size).
      if (request.method === 'POST' && url.pathname === '/api/blob/create') {
        const want = Number(url.searchParams.get('size') || '0');
        // A real, positive declared size (a size=0 lie previously bypassed the budget check).
        if (!(want > 0) || want > MAX_BLOB) return new Response('Bad size', { status: 413 });
        if ((await bucketBytes(env.BLOBS)) + want > STORAGE_BUDGET) {
          return json({ error: 'storage_full' }, 507); // Insufficient Storage — try again later
        }
        const key = crypto.randomUUID().replace(/-/g, '');
        const mpu = await env.BLOBS.createMultipartUpload(key);
        return json({ key, uploadId: mpu.uploadId });
      }
      // Upload one part. Part number is 1-based; all parts but the last must be ≥5 MiB.
      // The part body is capped to MAX_PART REAL bytes (Content-Length isn't trusted).
      if (request.method === 'PUT' && url.pathname === '/api/blob/part') {
        const key = url.searchParams.get('key') || '';
        const uploadId = url.searchParams.get('upload') || '';
        const n = Number(url.searchParams.get('n') || '0');
        if (!okKey(key) || !uploadId || n < 1 || !request.body) return new Response('Bad request', { status: 400 });
        const mpu = env.BLOBS.resumeMultipartUpload(key, uploadId);
        try {
          const part = await mpu.uploadPart(n, capBody(request.body, MAX_PART));
          return json({ etag: part.etag });
        } catch {
          return new Response('Part too large or upload failed', { status: 413 });
        }
      }
      // Finish → assemble the parts into the final object, then an AUTHORITATIVE budget
      // check on the now-real bucket size (bounds the concurrent-create race: an upload that
      // pushed the bucket over budget is deleted and reported full).
      if (request.method === 'POST' && url.pathname === '/api/blob/complete') {
        const body = (await request.json().catch(() => null)) as { key?: string; upload?: string; parts?: { n: number; etag: string }[] } | null;
        if (!body || !okKey(body.key || '') || !body.upload || !Array.isArray(body.parts)) return new Response('Bad request', { status: 400 });
        if (body.parts.length * MAX_PART > MAX_BLOB) return new Response('Too large', { status: 413 });
        const mpu = env.BLOBS.resumeMultipartUpload(body.key!, body.upload);
        await mpu.complete(body.parts.map((p) => ({ partNumber: p.n, etag: p.etag })));
        if ((await bucketBytes(env.BLOBS)) > STORAGE_BUDGET) {
          await env.BLOBS.delete(body.key!).catch(() => undefined);
          return json({ error: 'storage_full' }, 507);
        }
        return new Response(null, { status: 204 });
      }
      // Abort a failed upload → free the parts.
      if (request.method === 'POST' && url.pathname === '/api/blob/abort') {
        const body = (await request.json().catch(() => null)) as { key?: string; upload?: string } | null;
        if (body && okKey(body.key || '') && body.upload) {
          await env.BLOBS.resumeMultipartUpload(body.key!, body.upload).abort().catch(() => undefined);
        }
        return new Response(null, { status: 204 });
      }
      // GET /api/blob/<key> → stream the ciphertext back (the client decrypts as it reads).
      if (request.method === 'GET' && url.pathname.startsWith('/api/blob/')) {
        const key = url.pathname.slice('/api/blob/'.length);
        if (!okKey(key)) return new Response('Bad key', { status: 400 });
        const obj = await env.BLOBS.get(key);
        if (!obj) return new Response('Not found', { status: 404 });
        const h = new Headers();
        h.set('content-type', 'application/octet-stream');
        h.set('content-length', String(obj.size));
        h.set('cache-control', 'private, no-store');
        return new Response(obj.body, { status: 200, headers: h });
      }
      // No client DELETE: an unauthenticated delete lets any key-holder wipe a blob out from
      // under a co-recipient. Objects are reclaimed by the R2 lifecycle TTL instead.
      return new Response('Method not allowed', { status: 405 });
    }

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    applySecurityHeaders(headers);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};

export { RelayRoom };
