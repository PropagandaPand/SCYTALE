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
  decodeLinkGrant,
  verifyLinkGrant,
  generateSasEphemeral,
  linkingSas,
  sealPayload,
  SEALED_LINK_OFFER,
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
  getSodium,
  PROTOCOL_VERSION,
  type Bytes,
} from '../crypto';
import { installLinkedIdentity } from './identity';
import {
  issueAndSaveLinkGrant,
  loadOrCreateOwnDeviceList,
} from './devices';
import {
  clearPendingLinkGrantAndRecover,
} from './linkIntent';
import type { ConfirmedNewDeviceLinkIntent } from './linkRecovery';

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
      protocolVersion: request.protocolVersion,
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

function sameSignedPreKey(a: SignedPreKeyPublic, b: SignedPreKeyPublic): boolean {
  return (
    a.id === b.id &&
    bytesEqual(a.pub, b.pub) &&
    bytesEqual(a.signature, b.signature)
  );
}

async function reconstructNewLinkSession(
  intent: ConfirmedNewDeviceLinkIntent,
  id: IdentityKeys,
  currentSpk: SignedPreKeyPublic | null,
  requireCurrentGeneration = true,
): Promise<LinkSession> {
  const request = await decodeLinkRequest(intent.requestToken);
  const offer = decodeLinkOffer(intent.offerBytes);
  if (
    (await encodeLinkRequest(request)) !== intent.requestToken ||
    !bytesEqual(encodeLinkOffer(offer), intent.offerBytes)
  ) {
    throw new Error('Gespeichertes Kopplungs-Transcript ist nicht kanonisch.');
  }
  if (
    !bytesEqual(request.deviceSignPub, id.sign.publicKey) ||
    !bytesEqual(request.deviceDhPub, id.dh.publicKey) ||
    (currentSpk !== null && !sameSignedPreKey(request.signedPreKey, currentSpk))
  ) {
    throw new Error('Gespeicherte Kopplung gehört nicht zu aktueller Geräte-Identität/SPK.');
  }
  const sodium = await getSodium();
  const derivedEphPub = new Uint8Array(
    sodium.crypto_scalarmult_base(intent.sasEphPrivate),
  );
  if (!bytesEqual(derivedEphPub, request.sasEphPub)) {
    throw new Error('Gespeichertes SAS-Ephemeral-Keypair ist inkohärent.');
  }
  const isPreInstallIdentity = bytesEqual(id.master.publicKey, intent.preLinkMasterPub);
  const isCommittedLinkedIdentity =
    !!id.previousMasterPub &&
    bytesEqual(id.previousMasterPub, intent.preLinkMasterPub) &&
    bytesEqual(id.master.publicKey, offer.masterPub) &&
    id.epoch === offer.epoch;
  if (requireCurrentGeneration && !isPreInstallIdentity && !isCommittedLinkedIdentity) {
    throw new Error('Gespeicherte Kopplung passt zu keiner zulässigen Identity-Generation.');
  }
  const myEph: KeyPair = {
    publicKey: request.sasEphPub,
    privateKey: intent.sasEphPrivate,
  };
  const sas = await linkingSas({
    role: 'new',
    myEph,
    request,
    offer: { ...offer, masterPub: offer.masterPub as MasterPub },
  });
  return {
    role: 'new',
    myEph,
    sas,
    request,
    offer,
    approvedMasterPub: offer.masterPub,
    peerSignPub: request.deviceSignPub,
    peerDhPub: request.deviceDhPub,
  };
}

/**
 * Material for the encrypted recovery record. Only callable for the exact
 * immutable transcript already confirmed through confirmLinkSession().
 */
export async function createConfirmedNewDeviceLinkIntent(
  session: LinkSession,
  id: IdentityKeys,
  currentSpk: SignedPreKeyPublic,
  createdAt = Date.now(),
): Promise<ConfirmedNewDeviceLinkIntent> {
  requireConfirmed(session, 'new');
  if (!session.offer) throw new Error('Kopplungs-Angebot fehlt.');
  const intent: ConfirmedNewDeviceLinkIntent = {
    createdAt,
    preLinkMasterPub: id.master.publicKey,
    sasEphPrivate: session.myEph.privateKey,
    requestToken: await encodeLinkRequest(session.request),
    offerBytes: encodeLinkOffer(session.offer),
  };
  const reconstructed = await reconstructNewLinkSession(intent, id, currentSpk);
  // Recompute, then compare the entire immutable snapshot — never persist a
  // caller-supplied `confirmed` bit or saved SAS display value.
  if (confirmationSnapshot(reconstructed) !== confirmationSnapshot(session)) {
    throw new Error('Bestätigte Kopplungs-Session weicht vom rekonstruierten Transcript ab.');
  }
  return intent;
}

/**
 * Boot recovery: strictly decode the transcript, bind it to current local
 * identity/SPK, prove the X25519 keypair, recompute the SAS, and only then
 * recreate the in-memory confirmation capability.
 */
export async function restoreConfirmedNewDeviceLinkSession(
  intent: ConfirmedNewDeviceLinkIntent,
  id: IdentityKeys,
  currentSpk: SignedPreKeyPublic,
): Promise<LinkSession> {
  const session = await reconstructNewLinkSession(intent, id, currentSpk);
  return confirmLinkSession(session);
}

/**
 * Reconstruct a rejection-only transcript. Unlike active recovery this does
 * not create a confirmation capability, so completeLinkOnN remains impossible.
 * Current SPK/master generation may legitimately have moved on after discard;
 * the immutable request still binds the unchanged device sign/DH keys.
 */
export async function restoreDiscardedNewDeviceLinkSession(
  intent: ConfirmedNewDeviceLinkIntent,
  id: IdentityKeys,
): Promise<LinkSession> {
  return reconstructNewLinkSession(intent, id, null, false);
}

async function verifyNewDeviceLinkGrantTranscript(
  id: IdentityKeys,
  session: LinkSession,
  grant: LinkGrant,
): Promise<boolean> {
  if (session.role !== 'new') return false;
  return (
    !!session.approvedMasterPub &&
    !!session.offer &&
    bytesEqual(session.approvedMasterPub, grant.masterPub) &&
    session.offer.epoch === grant.epoch &&
    (await verifyLinkGrant(
      grant,
      id.sign.publicKey,
      id.dh.publicKey,
      session.request.signedPreKey,
      session.request,
      session.offer,
    ))
  );
}

export async function verifyConfirmedNewDeviceLinkGrant(
  id: IdentityKeys,
  session: LinkSession,
  grant: LinkGrant,
): Promise<boolean> {
  requireConfirmed(session, 'new');
  return verifyNewDeviceLinkGrantTranscript(id, session, grant);
}

export async function verifyDiscardedNewDeviceLinkGrant(
  id: IdentityKeys,
  session: LinkSession,
  grant: LinkGrant,
): Promise<boolean> {
  // Deliberately does not call requireConfirmed: a discarded transcript may
  // reject/retire its own late credential, never install it.
  return verifyNewDeviceLinkGrantTranscript(id, session, grant);
}

/**
 * Select only relay rows that cryptographically belong to this exact confirmed
 * N-side transcript. This is deliberately a selector, not an ACK operation:
 * an explicit local discard may retire its own already-queued credential, but
 * must not consume anonymous sibling rows from another/fake attempt.
 */
export async function confirmedLinkGrantRows(
  id: IdentityKeys,
  session: LinkSession,
  pending: ReadonlyMap<number, Bytes>,
): Promise<number[]> {
  requireConfirmed(session, 'new');
  const matching: number[] = [];
  for (const [ackId, payload] of pending) {
    try {
      const grant = await decodeLinkGrant(payload);
      if (await verifyConfirmedNewDeviceLinkGrant(id, session, grant)) matching.push(ackId);
    } catch {
      // Anonymous malformed/foreign candidates are intentionally not selected.
    }
  }
  return matching;
}

/** A retry after the atomic identity/list commit must not install the grant a
 * second time and overwrite previousMasterPub. It still verifies the complete
 * confirmed transcript before accepting the durable identity as its result. */
export async function confirmedLinkGrantAlreadyInstalled(
  id: IdentityKeys,
  session: LinkSession,
  grant: LinkGrant,
): Promise<boolean> {
  if (!(await verifyConfirmedNewDeviceLinkGrant(id, session, grant))) return false;
  return (
    bytesEqual(id.master.publicKey, grant.masterPub) &&
    id.epoch === grant.epoch &&
    bytesEqual(id.deviceCert, grant.deviceCert)
  );
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
    protocolVersion: PROTOCOL_VERSION,
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
export class LinkGrantDeliveryPendingError extends Error {
  readonly committedList: DeviceList;
  readonly pendingTarget: Bytes;

  constructor(committedList: DeviceList, pendingTarget: Bytes, cause?: unknown) {
    super('Gerät wurde dauerhaft autorisiert, aber der Kopplungs-Nachweis ist noch nicht bestätigt zugestellt.');
    this.name = 'LinkGrantDeliveryPendingError';
    this.committedList = committedList;
    this.pendingTarget = new Uint8Array(pendingTarget);
    (this as { cause?: unknown }).cause = cause;
  }
}

export class LinkGrantDeliveryCancelledError extends Error {
  readonly currentList: DeviceList;
  readonly discardedCorruptReplacement: boolean;

  constructor(currentList: DeviceList, discardedCorruptReplacement: boolean) {
    super('Die ausstehende Kopplung wurde parallel beendet oder widerrufen.');
    this.name = 'LinkGrantDeliveryCancelledError';
    this.currentList = currentList;
    this.discardedCorruptReplacement = discardedCorruptReplacement;
  }
}

export async function completeLinkOnP(
  dek: CryptoKey,
  id: IdentityKeys,
  session: LinkSession,
  send: (recipientSignPub: Bytes, sealedPayload: Bytes) => Promise<void>,
  publishCommitted?: (list: DeviceList) => Promise<void> | void,
): Promise<DeviceList> {
  requireConfirmed(session, 'primary');
  if (
    !session.offer ||
    !bytesEqual(session.offer.masterPub, id.master.publicKey) ||
    session.offer.epoch !== id.epoch
  ) {
    throw new Error('Die Hauptidentität hat sich seit der SAS-Bestätigung geändert — Kopplung neu starten.');
  }

  const { newList, sealedPayload, pendingRecord } = await issueAndSaveLinkGrant(
    dek,
    id,
    session.request,
    session.offer,
  );
  try {
    // Publish the authoritative post-CAS snapshot before N can receive the
    // credential and immediately send a bootreq. If this local barrier fails,
    // retain the exact delivery intent and do not expose the Grant yet.
    await publishCommitted?.(newList);
    await send(session.peerSignPub, sealedPayload);
    const cleanup = await clearPendingLinkGrantAndRecover(dek, pendingRecord);
    if (cleanup.status !== 'cleared') {
      // A cancel/replacement won the CAS while this receipt was in flight.
      // Reconcile against current durable authority; never report/gossip A's
      // now-stale list and never hide a successor Pending B.
      const currentList = await loadOrCreateOwnDeviceList(dek, id);
      if (!currentList) throw new Error('Aktuelle Geräteliste nach Kopplungs-Race nicht verfügbar.');
      if (cleanup.status === 'replaced') {
        throw new LinkGrantDeliveryPendingError(
          currentList,
          cleanup.pending.recipientSignPub,
          new Error('Eine neuere ausstehende Kopplung hat den Receipt-Cleanup überholt.'),
        );
      }
      throw new LinkGrantDeliveryCancelledError(
        currentList,
        cleanup.status === 'discarded-corrupt',
      );
    }
  } catch (cause) {
    if (
      cause instanceof LinkGrantDeliveryPendingError ||
      cause instanceof LinkGrantDeliveryCancelledError
    ) {
      throw cause;
    }
    throw new LinkGrantDeliveryPendingError(
      newList,
      session.request.deviceSignPub,
      cause,
    );
  }
  return newList;
}

/** Abort from either side. Exists so the UI has one obvious, total exit. */
export function abortLink(session: LinkSession | null): null {
  void session; // nothing persisted — dropping the reference IS the rollback
  return null;
}
