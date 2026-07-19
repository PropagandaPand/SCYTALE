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

// Content-Security-Policy: lock the app to its own origin. No external scripts,
// styles, fonts, images, or network destinations — so even a successful XSS
// can't exfiltrate a key to an attacker's server. 'wasm-unsafe-eval' is the
// narrow allowance WebAssembly (libsodium, hash-wasm) needs.
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
  headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=(), usb=()');
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

    const res = await env.ASSETS.fetch(request);
    const headers = new Headers(res.headers);
    applySecurityHeaders(headers);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};

export { RelayRoom };
