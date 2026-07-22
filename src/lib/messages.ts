/**
 * Message-history persistence. The decrypted chat log is sealed with the DEK
 * (AES-256-GCM) before it touches IndexedDB — at rest it's ciphertext, bound
 * per room via AAD. Loaded on unlock so conversations survive lock/reload.
 */
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord, deleteRecord } from './db';

export interface ChatMessage {
  mine: boolean;
  ts: number;
  sender?: string; // display name of the sender, for group messages
  text?: string;
  file?: { name: string; mime: string; dataB64: string };
  mid?: string; // stable E2E/bubble id (Stage 3d: shared across fan-out + self-sync copies)
  // Delivery to the relay (not read-receipt): pending until the DO confirms the
  // SQLite insert, then 'sent'; 'failed' on nack (mailbox full) or ack timeout.
  // Undefined on old/received messages → rendered as delivered.
  status?: 'pending' | 'sent' | 'failed';
  // Stage 3d fan-out: one entry PER target device of the peer. The bubble status is
  // the honest AGGREGATE over these (see aggregateDelivery). `stale` = the device
  // was revoked mid-flight; it drops OUT of the denominator (the current device
  // set), never counted as failed — correct behaviour must not read as an error.
  deliveries?: DeviceDelivery[];
}

export interface DeviceDelivery {
  device: string; // base64 of the peer device's sign key
  deliveryId: string; // per-delivery relay id (ack/nack matches on this)
  status: 'pending' | 'sent' | 'failed' | 'stale';
}

/** Honest aggregate of a fan-out message's per-device deliveries. Denominator is
 *  the CURRENT device set (a `stale` device — revoked in flight — drops out), so a
 *  message the person actually received never shows a permanent partial-failure. */
export function aggregateDelivery(deliveries: DeviceDelivery[]): {
  label: 'pending' | 'sent' | 'partial' | 'failed';
  sent: number;
  total: number;
} {
  const live = deliveries.filter((d) => d.status !== 'stale');
  const total = live.length;
  const sent = live.filter((d) => d.status === 'sent').length;
  // total === 0 means EVERY target device was unreachable (all 'stale') — nothing
  // hit the wire, so the message was NOT delivered. It must render ⚠, never ✓✓.
  if (total === 0) return { label: 'failed', sent: 0, total: 0 };
  if (sent === total) return { label: 'sent', sent, total };
  if (sent > 0) return { label: 'partial', sent, total };
  if (live.every((d) => d.status === 'failed')) return { label: 'failed', sent, total };
  return { label: 'pending', sent, total };
}

/**
 * Dedup predicate for the message log. A message's identity is (mid, DIRECTION):
 * a copy I SENT (mine=true, self-synced from another of my devices) and a copy I
 * RECEIVED (mine=false, a peer's fan-out or a future receive-sync) are DISTINCT
 * streams even when they carry the same mid.
 *
 * Keeping both in ONE mid-only namespace let a malicious authorised peer — who
 * learns my fan-out mid by decrypting its own copy — REFLECT that mid onto my
 * second device and suppress my own sent message (Review fund: Self-Sync-mid-
 * Reflexion). The `mine` flag is assigned LOCALLY from provenance (a peer message
 * always arrives via incomingMessage with mine=false), so a peer cannot forge it
 * to force a cross-direction collision.
 */
export function hasMessage(messages: ChatMessage[], mid: string, mine: boolean): boolean {
  return messages.some((m) => m.mid === mid && m.mine === mine);
}

const aad = (roomId: string) => utf8.encode(`scytale:messages:v1:${roomId}`);
const recordKey = (roomId: string) => `msgs:${roomId}`;

export async function loadMessages(dek: CryptoKey, roomId: string): Promise<ChatMessage[]> {
  const rec = await loadRecord(recordKey(roomId));
  if (!rec) return [];
  try {
    return JSON.parse(utf8.decode(await open(dek, rec, aad(roomId)))) as ChatMessage[];
  } catch {
    return [];
  }
}

export async function saveMessages(
  dek: CryptoKey,
  roomId: string,
  messages: ChatMessage[],
): Promise<void> {
  await saveRecord(recordKey(roomId), await seal(dek, utf8.encode(JSON.stringify(messages)), aad(roomId)));
}

export async function clearMessages(roomId: string): Promise<void> {
  await deleteRecord(recordKey(roomId));
}
