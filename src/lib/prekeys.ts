/**
 * Prekey service — generates and persists the device's prekeys (private halves
 * sealed in the vault), and exposes the public bundle plus lookups the
 * responder side needs to complete an incoming X3DH.
 */
import {
  generateSignedPreKey,
  generateOneTimePreKeys,
  buildBundle,
  verify,
  b64encode,
  b64decode,
  seal,
  open,
  utf8,
  type Bytes,
  type IdentityKeys,
  type KeyPair,
  type SignedPreKey,
  type OneTimePreKey,
  type PreKeyBundle,
} from '../crypto';
import { loadRecord, saveRecord } from './db';

const KEY = 'prekeys';
const AAD = utf8.encode('scytale:prekeys:v1');
const OPK_BATCH = 100;

export interface PreKeyState {
  signedPreKey: SignedPreKey;
  oneTimePreKeys: OneTimePreKey[];
  nextSpkId: number;
  nextOpkId: number;
}

// --- (de)serialisation via base64 JSON (plaintext only ever passed to seal) ---

interface KpWire {
  pub: string;
  priv: string;
}
interface PreKeyWire {
  v: 1;
  nextSpkId: number;
  nextOpkId: number;
  signedPreKey: { id: number; createdAt: number; signature: string; keyPair: KpWire };
  oneTimePreKeys: Array<{ id: number; keyPair: KpWire }>;
}

async function kpWire(kp: KeyPair): Promise<KpWire> {
  return { pub: await b64encode(kp.publicKey), priv: await b64encode(kp.privateKey) };
}
async function kpFrom(w: KpWire): Promise<KeyPair> {
  return { publicKey: await b64decode(w.pub), privateKey: await b64decode(w.priv) };
}

async function serialize(st: PreKeyState): Promise<Bytes> {
  const wire: PreKeyWire = {
    v: 1,
    nextSpkId: st.nextSpkId,
    nextOpkId: st.nextOpkId,
    signedPreKey: {
      id: st.signedPreKey.id,
      createdAt: st.signedPreKey.createdAt,
      signature: await b64encode(st.signedPreKey.signature),
      keyPair: await kpWire(st.signedPreKey.keyPair),
    },
    oneTimePreKeys: await Promise.all(
      st.oneTimePreKeys.map(async (o) => ({ id: o.id, keyPair: await kpWire(o.keyPair) })),
    ),
  };
  return utf8.encode(JSON.stringify(wire));
}

async function deserialize(bytes: Bytes): Promise<PreKeyState> {
  const wire = JSON.parse(utf8.decode(bytes)) as PreKeyWire;
  return {
    nextSpkId: wire.nextSpkId,
    nextOpkId: wire.nextOpkId,
    signedPreKey: {
      id: wire.signedPreKey.id,
      createdAt: wire.signedPreKey.createdAt,
      signature: await b64decode(wire.signedPreKey.signature),
      keyPair: await kpFrom(wire.signedPreKey.keyPair),
    },
    oneTimePreKeys: await Promise.all(
      wire.oneTimePreKeys.map(async (o) => ({ id: o.id, keyPair: await kpFrom(o.keyPair) })),
    ),
  };
}

export async function loadOrCreatePreKeys(dek: CryptoKey, identity: IdentityKeys): Promise<PreKeyState> {
  const rec = await loadRecord(KEY);
  if (rec) {
    const st = await deserialize(await open(dek, rec, AAD));
    // The signed prekey must verify against the CURRENT device sign key. If the
    // identity was regenerated (e.g. the multi-device format break), a stale
    // prekey signed by the old key would fail X3DH ("Signed-Prekey-Signatur
    // ungültig") — detect that and regenerate instead.
    if (await verify(st.signedPreKey.keyPair.publicKey, st.signedPreKey.signature, identity.sign.publicKey)) {
      return st;
    }
  }

  const signedPreKey = await generateSignedPreKey(identity, 1);
  const oneTimePreKeys = await generateOneTimePreKeys(1, OPK_BATCH);
  const st: PreKeyState = {
    signedPreKey,
    oneTimePreKeys,
    nextSpkId: 2,
    nextOpkId: OPK_BATCH + 1,
  };
  await savePreKeys(dek, st);
  return st;
}

export async function savePreKeys(dek: CryptoKey, st: PreKeyState): Promise<void> {
  await saveRecord(KEY, await seal(dek, await serialize(st), AAD));
}

/** Public bundle to hand out — includes the first available one-time prekey. */
export function currentBundle(identity: IdentityKeys, st: PreKeyState): PreKeyBundle {
  return buildBundle(identity, st.signedPreKey, st.oneTimePreKeys[0]);
}

export function findSignedPreKey(st: PreKeyState, id: number): SignedPreKey | undefined {
  return st.signedPreKey.id === id ? st.signedPreKey : undefined;
}

/** Remove and return a one-time prekey by id — it must never be reused. */
export function consumeOneTimePreKey(st: PreKeyState, id: number): OneTimePreKey | undefined {
  const idx = st.oneTimePreKeys.findIndex((o) => o.id === id);
  if (idx === -1) return undefined;
  return st.oneTimePreKeys.splice(idx, 1)[0];
}
