/**
 * RelayRoom — one Durable Object per inbox (id = SHA-256 of the owner's Ed25519
 * identity key). A store-and-forward mailbox for end-to-end-encrypted messages.
 *
 * THREAT MODEL: still a dumb ciphertext store. Every queued payload is sealed by
 * the sender's Double Ratchet; the DO never holds keys or sees plaintext. It
 * knows only routing metadata (who queues to which inbox, when).
 *
 * Protocol (JSON text frames):
 *   sender  -> {t:'send', b64}            queue a ciphertext for this inbox
 *   owner   -> {t:'hello'}                request an auth challenge
 *   DO      -> {t:'challenge', nonce}
 *   owner   -> {t:'auth', signPub, sig}   Ed25519 sig over the nonce
 *   DO      -> {t:'msg', id, b64}         a queued/live message (only to owner)
 *   owner   -> {t:'ack', id}              delete a delivered message
 *
 * Only a socket that proves it holds the private key for hash(signPub)==inbox
 * receives queued messages — so nobody who merely has your code can drain your
 * queue. Delivery is ack-based, so nothing is lost if the owner is offline.
 */
import { DurableObject } from 'cloudflare:workers';

export interface Env {
  RELAY: DurableObjectNamespace<RelayRoom>;
  ASSETS: Fetcher;
  // Web Push (VAPID). PUBLIC + SUBJECT are plain vars; JWK is a secret holding
  // the EC P-256 private key as a JWK JSON string. Absent => push disabled.
  VAPID_PUBLIC?: string;
  VAPID_SUBJECT?: string;
  VAPID_JWK?: string;
}

interface Att {
  room: string;
  owner: boolean;
  nonce?: string;
}

const enc = new TextEncoder();
const MAX_QUEUE = 1000; // max undelivered messages per inbox (flood guard)

function b64d(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64e(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
function b64url(b: Uint8Array): string {
  return b64e(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function hex(b: Uint8Array): string {
  let s = '';
  for (const x of b) s += x.toString(16).padStart(2, '0');
  return s;
}

export class RelayRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS q (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT)');
    // Push subscriptions for this inbox's owner (only ever written after auth).
    this.ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS subs (endpoint TEXT PRIMARY KEY, sub TEXT)');
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Erwartet WebSocket-Upgrade.', { status: 426 });
    }
    const room = new URL(request.url).searchParams.get('room') ?? '';
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ room, owner: false } satisfies Att);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== 'string') return;
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    const att = (ws.deserializeAttachment() ?? {}) as Att;

    switch (m.t) {
      case 'ping': {
        // App-level heartbeat: lets the client detect a dead (iOS-frozen) socket.
        try {
          ws.send(JSON.stringify({ t: 'pong' }));
        } catch {
          /* going away */
        }
        return;
      }
      case 'hello': {
        const nonce = b64e(crypto.getRandomValues(new Uint8Array(24)));
        ws.serializeAttachment({ ...att, nonce } satisfies Att);
        ws.send(JSON.stringify({ t: 'challenge', nonce }));
        return;
      }
      case 'auth': {
        if (!att.nonce || typeof m.signPub !== 'string' || typeof m.sig !== 'string') return;
        const signPub = b64d(m.signPub);
        const material = new Uint8Array(enc.encode('scytale-inbox:').length + signPub.length);
        material.set(enc.encode('scytale-inbox:'), 0);
        material.set(signPub, enc.encode('scytale-inbox:').length);
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', material));
        if (hex(digest) !== att.room) return; // signPub doesn't match this inbox
        let valid = false;
        try {
          const key = await crypto.subtle.importKey('raw', signPub, { name: 'Ed25519' }, false, ['verify']);
          valid = await crypto.subtle.verify({ name: 'Ed25519' }, key, b64d(m.sig), b64d(att.nonce));
        } catch {
          valid = false;
        }
        if (!valid) return;
        ws.serializeAttachment({ ...att, owner: true } satisfies Att);
        for (const row of this.ctx.storage.sql.exec<{ id: number; body: string }>('SELECT id, body FROM q ORDER BY id')) {
          ws.send(JSON.stringify({ t: 'msg', id: row.id, b64: row.body }));
        }
        return;
      }
      case 'send': {
        if (typeof m.b64 !== 'string') return;
        // Bounded mailbox: anyone who knows an inbox id can queue to it (no
        // sender auth by design), so cap the backlog to stop a flood from
        // growing the DO's storage without limit. Drop when full; it self-heals
        // as the owner drains. (Replays are already rejected by the ratchet.)
        const pending = this.ctx.storage.sql.exec<{ n: number }>('SELECT COUNT(*) AS n FROM q').one().n;
        if (pending >= MAX_QUEUE) return;
        const inserted = this.ctx.storage.sql
          .exec<{ id: number }>('INSERT INTO q (body) VALUES (?) RETURNING id', m.b64)
          .one();
        let ownerOnline = false;
        for (const peer of this.ctx.getWebSockets()) {
          const a = (peer.deserializeAttachment() ?? {}) as Att;
          if (a.owner) {
            ownerOnline = true;
            try {
              peer.send(JSON.stringify({ t: 'msg', id: inserted.id, b64: m.b64 }));
            } catch {
              /* peer going away */
            }
          }
        }
        // Owner not connected => wake their device with a content-free push.
        if (!ownerOnline) this.ctx.waitUntil(this.notifyOwner());
        return;
      }
      case 'ack': {
        if (typeof m.id === 'number') this.ctx.storage.sql.exec('DELETE FROM q WHERE id = ?', m.id);
        return;
      }
      case 'subscribe': {
        // Only an authenticated owner may register a push endpoint for this inbox.
        if (!att.owner || typeof m.sub !== 'object' || m.sub === null) return;
        const sub = m.sub as { endpoint?: unknown };
        if (typeof sub.endpoint !== 'string') return;
        this.ctx.storage.sql.exec(
          'INSERT OR REPLACE INTO subs (endpoint, sub) VALUES (?, ?)',
          sub.endpoint,
          JSON.stringify(m.sub),
        );
        return;
      }
      case 'unsubscribe': {
        if (!att.owner || typeof m.endpoint !== 'string') return;
        this.ctx.storage.sql.exec('DELETE FROM subs WHERE endpoint = ?', m.endpoint);
        return;
      }
    }
  }

  /** Send a content-free VAPID Web Push to every registered subscription. The
   *  payload is empty by design — a bare wake-up that leaks no message content.
   *  Stale endpoints (404/410) are pruned. */
  private async notifyOwner(): Promise<void> {
    const env = this.env;
    if (!env.VAPID_JWK || !env.VAPID_PUBLIC || !env.VAPID_SUBJECT) return;
    const rows = [...this.ctx.storage.sql.exec<{ endpoint: string }>('SELECT endpoint FROM subs')];
    if (rows.length === 0) return;

    let key: CryptoKey;
    try {
      key = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(env.VAPID_JWK),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign'],
      );
    } catch {
      return; // misconfigured secret — fail silently, never break delivery
    }

    for (const { endpoint } of rows) {
      try {
        const aud = new URL(endpoint).origin;
        const header = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
        const payload = b64url(
          enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 43200, sub: env.VAPID_SUBJECT })),
        );
        const signingInput = `${header}.${payload}`;
        const sig = new Uint8Array(
          await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput)),
        );
        const jwt = `${signingInput}.${b64url(sig)}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`,
            TTL: '2419200',
            Urgency: 'high',
          },
        });
        if (res.status === 404 || res.status === 410) {
          this.ctx.storage.sql.exec('DELETE FROM subs WHERE endpoint = ?', endpoint);
        }
      } catch {
        /* one bad endpoint must not stop the rest */
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
