/**
 * Device-linking flow — the ORDER of operations, in one place.
 *
 * The UI drives this, but must not own the sequencing: every dangerous property
 * of stage 3b is a property of *when* things happen, and a rule that lives in
 * event handlers is one refactor away from being violated silently.
 *
 *   N (new)                                     P (primary, holds masterPriv)
 *   ─────────                                   ────────────────────────────
 *   startLinkOnN()  → QR  ─────────────────────▶ beginLinkOnP(qrToken)
 *                                                  ↓ sends LinkOffer (inert)
 *   offerReceivedOnN(offer)  ◀──────────────────────┘
 *   ↓ shows 7 emoji                                ↓ shows 7 emoji
 *   ══════════ THE USER COMPARES AND CONFIRMS ON BOTH DEVICES ══════════
 *                                                completeLinkOnP()
 *                                                  ↓ issues cert + list, sends
 *   completeLinkOnN(grant)  ◀────────────────────────┘
 *
 * Two invariants this module exists to enforce:
 *
 * 1. NOTHING BEARER-GRADE BEFORE THE HUMAN CONFIRMS. `createLinkGrant` is only
 *    reachable through `completeLinkOnP`, which requires a confirmed SAS. A
 *    device cert cannot be un-issued, so it must not be issued merely to render
 *    a screen.
 *
 * 2. ABORT LEAVES NOTHING. Everything before the confirmation lives in the
 *    session object below and is discarded wholesale. No cert, no list version
 *    bump, no stored state — hence no rollback path that nobody tests.
 */
import {
  decodeLinkRequest,
  encodeLinkRequest,
  encodeLinkOffer,
  decodeLinkOffer,
  encodeLinkGrant,
  verifyLinkGrant,
  generateSasEphemeral,
  linkingSas,
  sealPayload,
  SEALED_LINK_OFFER,
  SEALED_LINK_GRANT,
  isPrimaryDevice,
  type LinkRequest,
  type SignedPreKeyPublic,
  type LinkGrant,
  type LinkOffer,
  type MasterPub,
  type SasResult,
  type KeyPair,
  type IdentityKeys,
  type DeviceList,
  bytesEqual,
  type Bytes,
} from '../crypto';
import { installLinkedIdentity } from './identity';
import { issueAndSaveLinkGrant } from './devices';

/** Everything a linking attempt holds before it commits. Discard = full abort. */
export interface LinkSession {
  role: 'new' | 'primary';
  myEph: KeyPair;
  /** Set once both ephemerals are known. Until then there is nothing to show. */
  sas?: SasResult;
  /** N: our own request (so the QR can be re-rendered). P: the scanned one. */
  request: LinkRequest;
  /** P only: the peer's inbox (sign key routes, dh key seals). */
  peerSignPub: Bytes;
  peerDhPub: Bytes;
  /**
   * N only: the master the emoji were derived over — i.e. the one the human
   * actually approved. The incoming grant must match it, otherwise the user
   * confirmed one identity and would install another.
   */
  approvedMasterPub?: Bytes;
  /** The exact offer used in the canonical SAS transcript. */
  offer?: LinkOffer;
}

/**
 * Opaque confirmation registry bound to an immutable snapshot of the complete
 * transcript. A boolean/WeakSet alone is insufficient: a second offer (or any
 * accidental object mutation) after the user's tap would otherwise inherit the
 * earlier approval.
 */
const confirmedSessions = new WeakMap<LinkSession, string>();

function bytesSnapshot(value: Bytes): string {
  let out = '';
  for (const byte of value) out += byte.toString(16).padStart(2, '0');
  return out;
}

function confirmationSnapshot(session: LinkSession): string {
  if (!session.sas || !session.offer) throw new Error('SAS wurde noch nicht vollständig berechnet.');
  const request = session.request;
  return JSON.stringify({
    role: session.role,
    myEph: bytesSnapshot(session.myEph.publicKey),
    request: {
      sign: bytesSnapshot(request.deviceSignPub),
      dh: bytesSnapshot(request.deviceDhPub),
      eph: bytesSnapshot(request.sasEphPub),
      spkId: request.signedPreKey.id,
      spk: bytesSnapshot(request.signedPreKey.pub),
      spkSig: bytesSnapshot(request.signedPreKey.signature),
    },
    offer: {
      eph: bytesSnapshot(session.offer.sasEphPub),
      master: bytesSnapshot(session.offer.masterPub),
      epoch: session.offer.epoch,
    },
    approvedMaster: session.approvedMasterPub ? bytesSnapshot(session.approvedMasterPub) : null,
    peerSign: bytesSnapshot(session.peerSignPub),
    peerDh: bytesSnapshot(session.peerDhPub),
    sas: { emoji: session.sas.emoji, decimal: session.sas.decimal },
  });
}

export function confirmLinkSession(session: LinkSession): LinkSession {
  confirmedSessions.set(session, confirmationSnapshot(session));
  return session;
}

function requireConfirmed(session: LinkSession, role: LinkSession['role']): void {
  if (session.role !== role) throw new Error('Falsche Rolle für diesen Schritt.');
  const approved = confirmedSessions.get(session);
  if (!approved || approved !== confirmationSnapshot(session)) {
    throw new Error('SAS wurde nicht ausdrücklich bestätigt — Kopplung abgebrochen.');
  }
}

// ── N (new device) ─────────────────────────────────────────────────────────

/**
 * N starts: produce the QR token. Uses OUR OWN device keys — this is the one
 * moment a fresh install advertises itself, and it grants nothing.
 */
export async function startLinkOnN(
  id: IdentityKeys,
  ownSpk: SignedPreKeyPublic,
): Promise<{ session: LinkSession; qrToken: string }> {
  const myEph = await generateSasEphemeral();
  const request: LinkRequest = {
    deviceSignPub: id.sign.publicKey,
    deviceDhPub: id.dh.publicKey,
    sasEphPub: myEph.publicKey,
    signedPreKey: ownSpk,
  };
  return {
    session: { role: 'new', myEph, request, peerSignPub: id.sign.publicKey, peerDhPub: id.dh.publicKey },
    qrToken: await encodeLinkRequest(request),
  };
}

/**
 * N received P's offer: derive the emoji. Nothing is installed here — the offer
 * carries no credential, and the user has not confirmed anything yet.
 *
 * The claimed master comes from the offer itself — it has to, because the emoji
 * are derived over it. N remembers it on the session so the later grant can be
 * checked against the SAME master the human just approved: without that link,
 * the user would confirm one identity and install another.
 */
export async function offerReceivedOnN(session: LinkSession, offerBytes: Bytes): Promise<SasResult> {
  // Decoding lives here, not in the UI: the version-mismatch message ("app too
  // old") is part of the flow's contract, and a second decode site would drift.
  const offer: LinkOffer = decodeLinkOffer(offerBytes);
  if (session.role !== 'new') throw new Error('Falsche Rolle für diese Kopplungs-Antwort.');
  // A new transcript always requires a fresh human comparison.
  confirmedSessions.delete(session);
  session.approvedMasterPub = offer.masterPub;
  session.offer = offer;
  const sas = await linkingSas({
    role: 'new',
    myEph: session.myEph,
    request: session.request,
    offer: { ...offer, masterPub: offer.masterPub as MasterPub },
  });
  session.sas = sas;
  return sas;
}

/**
 * N finishes: verify and install. Called ONLY after the user confirmed the
 * emoji match on both devices.
 *
 * ⚠️ `farewell` runs BEFORE the identity is replaced, and that ordering is the
 * whole reason it is a parameter here rather than something the UI does
 * afterwards. Once `installLinkedIdentity` has run, every existing contact is
 * `staleIdentity` and the send block refuses — a goodbye written after the swap
 * would hit our own barrier and never leave. It must be sent, or deliberately
 * skipped, while the old identity is still ours.
 */
export async function completeLinkOnN(
  dek: CryptoKey,
  id: IdentityKeys,
  session: LinkSession,
  grant: LinkGrant,
  farewell?: () => Promise<void>,
): Promise<IdentityKeys> {
  requireConfirmed(session, 'new');
  // The grant must carry the very master the emoji committed to. verifyLinkGrant
  // alone cannot catch a swap here — it validates everything relative to the
  // master the grant itself asserts.
  if (!session.approvedMasterPub || !bytesEqual(session.approvedMasterPub, grant.masterPub)) {
    throw new Error('Der Kopplungs-Nachweis nennt einen anderen Schlüssel als den bestätigten — abgebrochen.');
  }
  if (!session.offer || grant.epoch !== session.offer.epoch) {
    throw new Error('Der Kopplungs-Nachweis nennt eine andere Epoche als den bestätigten — abgebrochen.');
  }
  // Verify the complete credential before the courtesy farewell mutates any
  // existing ratchet or tells contacts that this identity is leaving.
  if (
    !(await verifyLinkGrant(
      grant,
      id.sign.publicKey,
      id.dh.publicKey,
      session.request.signedPreKey,
      session.request,
      session.offer,
    ))
  ) {
    throw new Error('Kopplungs-Nachweis ungültig — Identität unverändert.');
  }
  if (farewell) {
    try {
      await farewell();
    } catch {
      // A failed goodbye must not block the linking — it is a courtesy, not a
      // security step. Swallowed deliberately, and only here.
    }
  }
  return installLinkedIdentity(
    dek,
    id,
    grant,
    session.request.signedPreKey,
    session.request,
    session.offer,
  );
}

// ── P (primary device) ─────────────────────────────────────────────────────

/**
 * P scanned N's QR: reply with an INERT offer and derive the emoji.
 *
 * Note what does NOT happen here: no cert, no list. If the user aborts at the
 * emoji screen, the only thing that ever left this device is an ephemeral
 * public key, which grants nobody anything.
 */
export async function beginLinkOnP(
  id: IdentityKeys,
  qrToken: string,
  send: (recipientSignPub: Bytes, sealedPayload: Bytes) => Promise<void>,
): Promise<{ session: LinkSession; sas: SasResult }> {
  if (!isPrimaryDevice(id)) {
    throw new Error('Nur das Hauptgerät kann weitere Geräte koppeln — es hält den Master-Schlüssel.');
  }
  const request = await decodeLinkRequest(qrToken);
  const myEph = await generateSasEphemeral();
  const offer: LinkOffer = { sasEphPub: myEph.publicKey, masterPub: id.master.publicKey, epoch: id.epoch };

  // Routed to N's inbox (derived from its sign key), sealed to N's DH key.
  await send(
    request.deviceSignPub,
    await sealPayload(request.deviceDhPub, SEALED_LINK_OFFER, encodeLinkOffer(offer)),
  );

  // Both sides encode the exact same request and offer, including the master N
  // is about to adopt and every key/certification field from N's request.
  const sas = await linkingSas({
    role: 'primary',
    myEph,
    request,
    offer: { ...offer, masterPub: offer.masterPub as MasterPub },
  });
  return {
    session: {
      role: 'primary',
      myEph,
      sas,
      request,
      offer,
      peerSignPub: request.deviceSignPub,
      peerDhPub: request.deviceDhPub,
    },
    sas,
  };
}

/**
 * P finishes: issue the cert, persist the authoritative list, and only THEN send.
 *
 * A credential cannot be recalled once sent. Therefore durable state must describe
 * it before publication. A failed send is retried idempotently from the same list
 * entry/cert; createLinkGrant does not bump the version again.
 */
export async function completeLinkOnP(
  dek: CryptoKey,
  id: IdentityKeys,
  session: LinkSession,
  send: (recipientSignPub: Bytes, sealedPayload: Bytes) => Promise<void>,
): Promise<DeviceList> {
  requireConfirmed(session, 'primary');
  if (
    !session.offer ||
    !bytesEqual(session.offer.masterPub, id.master.publicKey) ||
    session.offer.epoch !== id.epoch
  ) {
    throw new Error('Die Hauptidentität hat sich seit der SAS-Bestätigung geändert — Kopplung neu starten.');
  }

  const { grant, newList } = await issueAndSaveLinkGrant(
    dek,
    id,
    session.request,
    session.offer,
  );
  const sealedGrant = await sealPayload(session.peerDhPub, SEALED_LINK_GRANT, await encodeLinkGrant(grant));
  await send(session.peerSignPub, sealedGrant);
  return newList;
}

/** Abort from either side. Exists so the UI has one obvious, total exit. */
export function abortLink(session: LinkSession | null): null {
  void session; // nothing persisted — dropping the reference IS the rollback
  return null;
}
