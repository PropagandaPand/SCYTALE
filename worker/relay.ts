/**
 * RelayRoom — a Durable Object that relays end-to-end-encrypted messages
 * between the participants of one conversation.
 *
 * THREAT MODEL: this object is a dumb ciphertext mailbox. It sees the WebSocket
 * frames but every payload is already sealed by the sender's Double Ratchet
 * (coming in Etappe 3–4). It never holds keys and never sees plaintext. Its
 * only knowledge is metadata — who is connected to which room, and when — which
 * is exactly the surface we harden later (sealed sender).
 *
 * Uses the WebSocket Hibernation API: idle connections are evicted from memory
 * (and stop billing) while staying open, then rehydrate on the next frame.
 */
import { DurableObject } from 'cloudflare:workers';

export interface Env {
  RELAY: DurableObjectNamespace<RelayRoom>;
  ASSETS: Fetcher;
}

export class RelayRoom extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Erwartet WebSocket-Upgrade.', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Hibernatable accept — the runtime, not our code, keeps the socket alive.
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  // Broadcast each ciphertext frame to every OTHER peer in the room.
  // (Precise per-recipient addressing + offline mailbox lands with D1 later.)
  webSocketMessage(sender: WebSocket, message: ArrayBuffer | string): void {
    for (const peer of this.ctx.getWebSockets()) {
      if (peer !== sender) {
        try {
          peer.send(message);
        } catch {
          // peer is going away; the close handler will clean it up
        }
      }
    }
  }

  webSocketClose(ws: WebSocket, code: number, _reason: string, wasClean: boolean): void {
    try {
      ws.close(code, wasClean ? 'bye' : 'abnormal');
    } catch {
      /* already closed */
    }
  }

  webSocketError(ws: WebSocket): void {
    try {
      ws.close(1011, 'error');
    } catch {
      /* already closed */
    }
  }
}
