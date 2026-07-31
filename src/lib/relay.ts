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
const CONFIRMED_SEND_TIMEOUT_MS = 12_000;

function requestId(): string {
  const words = crypto.getRandomValues(new Uint32Array(4));
  return [...words].map((word) => word.toString(16).padStart(8, '0')).join('');
}

export interface RelayOptions {
  onStatus?: (s: RelayStatus) => void;
  /** Owner only: a queued/live ciphertext arrived; ack it once handled. */
  onCipher?: (bytes: Uint8Array<ArrayBuffer>, ackId: number) => void;
  /** Sender: the relay durably queued a send (delivery to the mailbox). */
  onAck?: (mid: string | null) => void;
  /** Sender: the relay rejected a send. `reason` is 'full' | 'toolarge' | other. */
  onNack?: (mid: string | null, reason?: string) => void;
  /** Present => authenticate as this inbox's owner. */
  auth?: { signPub: Bytes; sign: (nonce: Bytes) => Promise<Bytes> };
}

/**
 * Reserve a relay room for its authenticated owner before constructing that
 * owner's client. A sender-only socket may already occupy the room (notably the
 * hidden self-contact during boot); it must never shadow owner authentication.
 * Returns false only when `owner` already owns the exact slot.
 */
export function prepareOwnerRelaySlot<T extends { close(): void }>(
  room: string,
  relays: Map<string, T>,
  sendRooms: Map<string, string>,
  owner: T | null,
): boolean {
  const existing = relays.get(room);
  if (existing === owner) return false;
  if (!existing) return true;
  existing.close();
  relays.delete(room);
  for (const [contactRoom, relayRoom] of sendRooms) {
    if (relayRoom === room) sendRooms.delete(contactRoom);
  }
  return true;
}

export class RelayClient {
  private ws: WebSocket | null = null;
  private closedByUs = false;
  private outbox: string[] = [];
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private pushSub: PushSub | null = null; // owner inbox: re-registered after each auth
  private ownerAuthed = false;
  private authWaiters = new Set<(ok: boolean) => void>();
  private unsubscribeWaiters = new Map<
    string,
    { resolve: (ok: boolean) => void; timer: ReturnType<typeof setTimeout> }
  >();
  private sendWaiters = new Map<
    string,
    {
      resolve: () => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
      frame: string;
    }
  >();
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
      this.ownerAuthed = false;
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
      this.ownerAuthed = false;
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
      const parsed: unknown = JSON.parse(ev.data);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return;
      m = parsed as Record<string, unknown>;
    } catch {
      return;
    }
    if (m.t === 'pong') {
      if (this.pongTimer) {
        clearTimeout(this.pongTimer);
        this.pongTimer = null;
      }
    } else if (m.t === 'sent') {
      const mid = typeof m.mid === 'string' ? m.mid : null;
      if (mid) {
        const waiter = this.sendWaiters.get(mid);
        if (waiter) {
          clearTimeout(waiter.timer);
          this.sendWaiters.delete(mid);
          waiter.resolve();
        }
      }
      this.opts.onAck?.(mid);
    } else if (m.t === 'nack') {
      const mid = typeof m.mid === 'string' ? m.mid : null;
      const reason = typeof m.reason === 'string' ? m.reason : undefined;
      if (mid) {
        const waiter = this.sendWaiters.get(mid);
        if (waiter) {
          clearTimeout(waiter.timer);
          this.sendWaiters.delete(mid);
          waiter.reject(new Error(`Relay hat die Zustellung abgelehnt${reason ? ` (${reason})` : ''}.`));
        }
      }
      this.opts.onNack?.(mid, reason);
    } else if (m.t === 'authed' && this.opts.auth) {
      this.ownerAuthed = true;
      for (const resolve of this.authWaiters) resolve(true);
      this.authWaiters.clear();
      // New servers explicitly acknowledge auth. Re-send idempotently here so a
      // subscription can never race ahead of the authenticated state.
      if (this.pushSub) this.ws?.send(JSON.stringify({ t: 'subscribe', sub: this.pushSub }));
    } else if (m.t === 'unsubscribed' && typeof m.rid === 'string') {
      const waiter = this.unsubscribeWaiters.get(m.rid);
      if (waiter) {
        clearTimeout(waiter.timer);
        this.unsubscribeWaiters.delete(m.rid);
        waiter.resolve(true);
      }
    } else if (m.t === 'challenge' && this.opts.auth && typeof m.nonce === 'string') {
      try {
        const nonce = b64ToBytes(m.nonce);
        const sig = await this.opts.auth.sign(nonce);
        this.ws?.send(
          JSON.stringify({ t: 'auth', signPub: bytesToB64(this.opts.auth.signPub), sig: bytesToB64(sig) }),
        );
        // Legacy servers do not emit `authed`; ordered WebSocket frames still
        // make this safe, while new servers send an idempotent second subscribe.
        if (this.pushSub) this.ws?.send(JSON.stringify({ t: 'subscribe', sub: this.pushSub }));
      } catch {
        this.ws?.close(1007, 'invalid auth challenge');
      }
    } else if (
      m.t === 'msg' &&
      typeof m.b64 === 'string' &&
      typeof m.id === 'number' &&
      Number.isSafeInteger(m.id) &&
      m.id > 0
    ) {
      try {
        this.opts.onCipher?.(b64ToBytes(m.b64), m.id);
      } catch {
        // Purge malformed legacy rows. New relay versions reject non-canonical
        // base64 before INSERT, but an old poisoned row must not block the inbox.
        this.ack(m.id);
      }
    }
  }

  /** Sender: push a ciphertext to this (peer's) inbox. Queued until the socket
   *  is open, so a message sent right after connect() isn't silently dropped.
   *  `mid` (optional) lets a relay nack be matched back to this message.
   *  `silent` marks a non-user-visible frame (profile/devlist/sync/recall/…): it is
   *  delivered normally but must never trigger a wake-up push (no phantom "Neue
   *  Nachricht"). Backward-compatible — the flag is only sent when true. */
  send(bytes: Bytes, mid?: string, silent = false): void {
    const frame = JSON.stringify(silent ? { t: 'send', b64: bytesToB64(bytes), mid, silent: true } : { t: 'send', b64: bytesToB64(bytes), mid });
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame);
    else this.outbox.push(frame);
  }

  /** Resolve only after the relay confirms its durable mailbox INSERT. A caller
   * can keep a sealed retry intent until this promise succeeds, avoiding false
   * "done" state on disconnect/nack/timeout. */
  sendConfirmed(
    bytes: Bytes,
    silent = false,
    timeoutMs = CONFIRMED_SEND_TIMEOUT_MS,
  ): Promise<void> {
    const mid = requestId();
    const frame = JSON.stringify(
      silent
        ? { t: 'send', b64: bytesToB64(bytes), mid, silent: true }
        : { t: 'send', b64: bytesToB64(bytes), mid },
    );
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.sendWaiters.delete(mid);
        // If it never left the local outbox, do not send it unexpectedly after
        // the caller has moved to its durable retry path.
        const queued = this.outbox.indexOf(frame);
        if (queued >= 0) this.outbox.splice(queued, 1);
        reject(new Error('Keine dauerhafte Relay-Bestätigung erhalten.'));
      }, Math.max(1, timeoutMs));
      this.sendWaiters.set(mid, { resolve, reject, timer, frame });
      if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(frame);
      else this.outbox.push(frame);
    });
  }

  /** Owner: register (or clear) the Web Push subscription for this inbox. Sent
   *  after auth on (re)connect; if already open we push it immediately too. */
  setPush(sub: PushSub | null): void {
    this.pushSub = sub;
    if (sub && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'subscribe', sub }));
    }
  }

  private waitForOwnerAuth(ms: number): Promise<boolean> {
    if (this.ownerAuthed) return Promise.resolve(true);
    if (!this.opts.auth) return Promise.resolve(false);
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        this.authWaiters.delete(finish);
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), ms);
      this.authWaiters.add(finish);
    });
  }

  /** Owner: tell the DO to forget a push endpoint and wait for its durable DELETE.
   *  The boolean distinguishes a confirmed removal from an offline/best-effort one. */
  async unsubscribePush(endpoint: string): Promise<boolean> {
    this.pushSub = null;
    if (!(await this.waitForOwnerAuth(2500)) || this.ws?.readyState !== WebSocket.OPEN) return false;
    const words = crypto.getRandomValues(new Uint32Array(4));
    const rid = [...words].map((word) => word.toString(16).padStart(8, '0')).join('');
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.unsubscribeWaiters.delete(rid);
        resolve(false);
      }, 2500);
      this.unsubscribeWaiters.set(rid, { resolve, timer });
      try {
        this.ws?.send(JSON.stringify({ t: 'unsubscribe', endpoint, rid }));
      } catch {
        clearTimeout(timer);
        this.unsubscribeWaiters.delete(rid);
        resolve(false);
      }
    });
  }

  /** Owner: confirm a delivered message so the DO drops it from the queue. */
  ack(id: number): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ t: 'ack', id }));
    }
  }

  close(): void {
    this.closedByUs = true;
    this.ownerAuthed = false;
    for (const resolve of this.authWaiters) resolve(false);
    this.authWaiters.clear();
    for (const [rid, waiter] of this.unsubscribeWaiters) {
      clearTimeout(waiter.timer);
      this.unsubscribeWaiters.delete(rid);
      waiter.resolve(false);
    }
    for (const [mid, waiter] of this.sendWaiters) {
      clearTimeout(waiter.timer);
      this.sendWaiters.delete(mid);
      waiter.reject(new Error('Relay-Verbindung geschlossen.'));
    }
    this.stopHeartbeat();
    this.ws?.close();
  }

  private setStatus(s: RelayStatus): void {
    this.status = s;
    this.opts.onStatus?.(s);
  }
}
