/**
 * Relay client — talks the JSON store-and-forward protocol to the inbox Durable
 * Object. Two modes:
 *   - inbox owner (auth set): authenticates (Ed25519 sig over the DO's nonce),
 *     then receives queued + live messages, each acked so the DO can delete it.
 *   - sender (no auth): just pushes ciphertext to a peer's inbox.
 * Auto-reconnects with a small backoff. Only ever carries ciphertext.
 */
import { bytesToB64, b64ToBytes } from './bytes';
import type { Bytes } from '../crypto';

export type RelayStatus = 'connecting' | 'open' | 'closed';

export interface RelayOptions {
  onStatus?: (s: RelayStatus) => void;
  /** Owner only: a queued/live ciphertext arrived; ack it once handled. */
  onCipher?: (bytes: Uint8Array<ArrayBuffer>, ackId: number) => void;
  /** Present => authenticate as this inbox's owner. */
  auth?: { signPub: Bytes; sign: (nonce: Bytes) => Promise<Bytes> };
}

export class RelayClient {
  private ws: WebSocket | null = null;
  private closedByUs = false;
  status: RelayStatus = 'closed';

  constructor(
    private roomId: string,
    private opts: RelayOptions,
  ) {}

  connect(): void {
    this.closedByUs = false;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/api/relay?room=${encodeURIComponent(this.roomId)}`;
    this.setStatus('connecting');

    const ws = new WebSocket(url);
    ws.onopen = () => {
      this.setStatus('open');
      if (this.opts.auth) ws.send(JSON.stringify({ t: 'hello' }));
    };
    ws.onmessage = (ev) => void this.onMessage(ev);
    ws.onclose = () => {
      this.setStatus('closed');
      if (!this.closedByUs) setTimeout(() => this.connect(), 1500);
    };
    ws.onerror = () => ws.close();
    this.ws = ws;
  }

  private async onMessage(ev: MessageEvent): Promise<void> {
    if (typeof ev.data !== 'string') return;
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (m.t === 'challenge' && this.opts.auth && typeof m.nonce === 'string') {
      const sig = await this.opts.auth.sign(b64ToBytes(m.nonce));
      this.ws?.send(
        JSON.stringify({ t: 'auth', signPub: bytesToB64(this.opts.auth.signPub), sig: bytesToB64(sig) }),
      );
    } else if (m.t === 'msg' && typeof m.b64 === 'string' && typeof m.id === 'number') {
      this.opts.onCipher?.(b64ToBytes(m.b64), m.id);
    }
  }

  /** Sender: push a ciphertext to this (peer's) inbox. */
  send(bytes: Bytes): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'send', b64: bytesToB64(bytes) }));
    }
  }

  /** Owner: confirm a delivered message so the DO drops it from the queue. */
  ack(id: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'ack', id }));
    }
  }

  close(): void {
    this.closedByUs = true;
    this.ws?.close();
  }

  private setStatus(s: RelayStatus): void {
    this.status = s;
    this.opts.onStatus?.(s);
  }
}
