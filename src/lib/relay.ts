/**
 * Relay client — talks the JSON store-and-forward protocol to the inbox Durable
 * Object. Two modes:
 *   - inbox owner (auth set): authenticates (Ed25519 sig over the DO's nonce),
 *     then receives queued + live messages, each acked so the DO can delete it.
 *   - sender (no auth): just pushes ciphertext to a peer's inbox.
 * Auto-reconnects with a small backoff. Only ever carries ciphertext.
 *
 * iOS PWAs freeze in the background and silently kill the socket while leaving
 * readyState === OPEN (a "zombie"). We defend with (a) an app-level ping/pong
 * heartbeat that reconnects when a pong doesn't come back, and (b) reconnect(),
 * which the UI calls when the app returns to the foreground.
 */
import { bytesToB64, b64ToBytes } from './bytes';
import type { Bytes } from '../crypto';
import type { PushSub } from './push';

export type RelayStatus = 'connecting' | 'open' | 'closed';

const PING_EVERY_MS = 25_000;
const PONG_GRACE_MS = 8_000;

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
  private outbox: string[] = [];
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private pushSub: PushSub | null = null; // owner inbox: re-registered after each auth
  status: RelayStatus = 'closed';

  constructor(
    private roomId: string,
    private opts: RelayOptions,
  ) {}

  connect(): void {
    this.closedByUs = false;
    // Don't stack a second socket on top of a live/connecting one.
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/api/relay?room=${encodeURIComponent(this.roomId)}`;
    this.setStatus('connecting');

    const ws = new WebSocket(url);
    ws.onopen = () => {
      if (this.ws !== ws) return; // superseded by a newer socket
      this.setStatus('open');
      if (this.opts.auth) ws.send(JSON.stringify({ t: 'hello' }));
      // Flush anything queued while we were connecting / reconnecting.
      const pending = this.outbox;
      this.outbox = [];
      for (const frame of pending) ws.send(frame);
      this.startHeartbeat();
    };
    ws.onmessage = (ev) => {
      if (this.ws !== ws) return;
      void this.onMessage(ev);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return; // an old, replaced socket closing — ignore
      this.stopHeartbeat();
      this.setStatus('closed');
      if (!this.closedByUs) setTimeout(() => this.connect(), 1500);
    };
    ws.onerror = () => ws.close();
    this.ws = ws;
  }

  /** Force an immediate reconnect. Called when the app returns to the
   *  foreground: iOS kills backgrounded sockets but readyState can still read
   *  OPEN, so we can't trust it — tear down and rebuild unconditionally. */
  reconnect(): void {
    if (this.closedByUs) return;
    const old = this.ws;
    this.ws = null; // detach so the old socket's handlers become no-ops
    try {
      old?.close();
    } catch {
      /* already gone */
    }
    this.stopHeartbeat();
    this.connect();
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeat = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) return;
      this.ws.send(JSON.stringify({ t: 'ping' }));
      // No pong in time => the socket is dead (typical after iOS resume).
      if (!this.pongTimer) this.pongTimer = setTimeout(() => this.reconnect(), PONG_GRACE_MS);
    }, PING_EVERY_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
    if (this.pongTimer) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private async onMessage(ev: MessageEvent): Promise<void> {
    if (typeof ev.data !== 'string') return;
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (m.t === 'pong') {
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
        this.pongTimer = null;
      }
    } else if (m.t === 'challenge' && this.opts.auth && typeof m.nonce === 'string') {
      const sig = await this.opts.auth.sign(b64ToBytes(m.nonce));
      this.ws?.send(
        JSON.stringify({ t: 'auth', signPub: bytesToB64(this.opts.auth.signPub), sig: bytesToB64(sig) }),
      );
      // Re-register our push subscription now that this socket is authed as owner
      // (the DO only accepts it from an authenticated owner). Ordered after auth.
      if (this.pushSub) this.ws?.send(JSON.stringify({ t: 'subscribe', sub: this.pushSub }));
    } else if (m.t === 'msg' && typeof m.b64 === 'string' && typeof m.id === 'number') {
      this.opts.onCipher?.(b64ToBytes(m.b64), m.id);
    }
  }

  /** Sender: push a ciphertext to this (peer's) inbox. Queued until the socket
   *  is open, so a message sent right after connect() isn't silently dropped. */
  send(bytes: Bytes): void {
    const frame = JSON.stringify({ t: 'send', b64: bytesToB64(bytes) });
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame);
    else this.outbox.push(frame);
  }

  /** Owner: register (or clear) the Web Push subscription for this inbox. Sent
   *  after auth on (re)connect; if already open we push it immediately too. */
  setPush(sub: PushSub | null): void {
    this.pushSub = sub;
    if (sub && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'subscribe', sub }));
    }
  }

  /** Owner: tell the DO to forget a push endpoint (user disabled notifications). */
  unsubscribePush(endpoint: string): void {
    this.pushSub = null;
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'unsubscribe', endpoint }));
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
    this.stopHeartbeat();
    this.ws?.close();
  }

  private setStatus(s: RelayStatus): void {
    this.status = s;
    this.opts.onStatus?.(s);
  }
}
