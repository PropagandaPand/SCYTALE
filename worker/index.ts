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
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
].join('; ');

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

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    applySecurityHeaders(headers);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};

export { RelayRoom };
