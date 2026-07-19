/**
 * Cloudflare Worker entry point.
 *
 *  - `/api/relay?room=<id>`  -> routes the WebSocket to the room's Durable Object
 *  - everything else         -> served from the precached PWA static assets
 *
 * One deploy serves both the app and its relay. No plaintext ever transits here.
 */
import { RelayRoom, type Env } from './relay';

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

    return env.ASSETS.fetch(request);
  },
};

export { RelayRoom };
