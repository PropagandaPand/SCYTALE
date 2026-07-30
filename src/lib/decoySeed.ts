/**
 * Decoy account seeding. When a duress word is armed, the fresh decoy vault is seeded with a few
 * believable, mundane fake contacts + chat histories (localized to the app language) so the decoy
 * looks lived-in when it is opened under coercion.
 *
 * The fake contacts are explicitly local-only. They retain normal canonical
 * identity/room invariants, but Messenger never opens a relay for them and text
 * sends become local echoes. This explicit boundary avoids confusing a
 * legitimate temporarily send-blocked roster contact with a decoy contact.
 * See SECURITY.md "Duress → decoy".
 */
import {
  asMasterPub,
  generateIdentity,
  identityFingerprint,
  seal,
  serializeIdentity,
  utf8,
  type SealedRecord,
} from '../crypto';
import { getLang } from './i18n';
import { computeMasterRoomId, type Contact } from './session';
import { sealContactRecord, sealContactIndexRecord } from './store';
import { sealRoomRecords, type ChatMessage } from './messages';
// Type-only import (erased at build) — the ~100-per-language content pool is pulled in via a dynamic
// import() inside buildDecoySeedRecords so it lands in its OWN chunk and never bloats the app-start
// bundle; it is only ever needed while ARMING a duress word.
import { type DecoyContactSeed } from './decoyContent';

// loadOrCreateIdentity reads this exact slot/AAD on first open. Provisioning the
// identity together with the seed lets every fake contact use the same canonical
// master-room derivation as an ordinary contact from the very first write.
const IDENTITY_KEY = 'identity';
const IDENTITY_AAD = utf8.encode('scytale:identity:v1');

function hex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}
const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n)) as Uint8Array<ArrayBuffer>;
const randomId = () => hex(randomBytes(16)); // 32 hex chars — same shape as a real roomId / mid

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Each arming shows a fresh, non-deterministic handful of chats drawn from the large pool, so two
// armings never look identical and the decoy carries no fixed, recognisable fingerprint.
const DECOY_MIN_CHATS = 7;
const DECOY_MAX_CHATS = 15;

/** Uniform random integer in [min, max]. */
function randomIntInclusive(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** Fisher–Yates: `count` distinct entries chosen uniformly at random (does not mutate `items`). */
function sample<T>(items: readonly T[], count: number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(count, a.length));
}

/**
 * Build the sealed IndexedDB records that seed a fresh decoy with fake contacts + chats. A random
 * 7–15 conversations are drawn from the ~100-entry pool for the current app language, so each arming
 * looks different. Returns `[recordKey, SealedRecord]` pairs for the 'records' store; the caller
 * (createDecoyVaultInDb) writes them into 'scytale-decoy' in the same provisioning transaction.
 * Best-effort: with no content pool at all it returns [] and the decoy is simply armed empty.
 */
export async function buildDecoySeedRecords(decoyDek: CryptoKey): Promise<Array<[string, SealedRecord]>> {
  // Dynamic import: keeps the large content module in its own lazily-loaded chunk (see import note).
  const { DECOY_CONTENT } = await import('./decoyContent');
  // Always the currently set app language; fall back to en, then to any available pool.
  const fullPool: DecoyContactSeed[] =
    DECOY_CONTENT[getLang()] ?? DECOY_CONTENT.en ?? Object.values(DECOY_CONTENT)[0] ?? [];
  if (fullPool.length === 0) return [];
  // Draw a fresh random 7–15 of the ~100-entry pool for this arming (clamped to the pool size).
  const pool = sample(fullPool, randomIntInclusive(DECOY_MIN_CHATS, DECOY_MAX_CHATS));

  const out: Array<[string, SealedRecord]> = [];
  const ids: string[] = [];
  const now = Date.now();
  const ownIdentity = await generateIdentity();
  const ownMaster = asMasterPub(ownIdentity.master.publicKey);
  out.push([
    IDENTITY_KEY,
    await seal(decoyDek, await serializeIdentity(ownIdentity), IDENTITY_AAD),
  ]);

  // Lay the conversations out over the recent past: contact 0 is the most recent (its last message a
  // couple of hours ago), each further contact older, messages a few minutes apart within a chat —
  // so the chat list sorts and reads like a real, lived-in account.
  for (let ci = 0; ci < pool.length; ci++) {
    const entry = pool[ci];
    if (!entry?.messages?.length) continue;
    // Valid peer keys plus the real master-room derivation avoid a decrypted
    // seed having an impossible key/room relationship that ordinary contacts
    // could never produce.
    const peerIdentity = await generateIdentity();
    const peerMaster = asMasterPub(peerIdentity.master.publicKey);
    const roomId = await computeMasterRoomId(ownMaster, peerMaster);
    ids.push(roomId);

    const contact: Contact = {
      roomId,
      peerMasterPub: peerMaster,
      peerEpoch: peerIdentity.epoch,
      peerSignPub: peerIdentity.sign.publicKey,
      peerDhPub: peerIdentity.dh.publicKey,
      peerFingerprint: await identityFingerprint(peerMaster, peerMaster),
      peerName: entry.name,
      ownMasterPub: ownMaster,
      regime: 'master',
      verified: true,
      localOnly: true,
      sessions: new Map(), // INERT: no session, no bundle (see file header)
    };
    out.push(await sealContactRecord(decoyDek, contact));

    const endTs = now - ci * (DAY / 2) - HOUR - Math.floor(Math.random() * HOUR);
    const n = entry.messages.length;
    // Work backwards cumulatively. Multiplying each position by a separately
    // random gap can make adjacent timestamps run backwards.
    const timestamps = new Array<number>(n);
    let cursor = endTs;
    for (let i = n - 1; i >= 0; i--) {
      timestamps[i] = cursor;
      cursor -= 2 * MINUTE + Math.floor(Math.random() * 8 * MINUTE);
    }
    const msgs: ChatMessage[] = entry.messages.map((m, i) => ({
      mine: !!m.mine,
      ts: timestamps[i],
      text: m.text,
      mid: randomId(),
      // A sent message shows the delivered ✓✓ with no wire round-trip; received ones render plain.
      ...(m.mine ? { status: 'sent' as const } : {}),
    }));
    out.push(...(await sealRoomRecords(decoyDek, roomId, msgs)));
  }

  out.push(await sealContactIndexRecord(decoyDek, ids));
  return out;
}
