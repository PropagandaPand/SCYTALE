/**
 * Erst-Sync bootstrap state, sealed with the DEK in the vault.
 *
 * - 'bootstrap-applied': the set of bootstrap ids (`bid`) already imported on THIS
 *   device — the idempotency marker. Written LAST when a bootstrap is applied, so a
 *   crash mid-import just re-runs the (idempotent) merge on re-delivery and then
 *   records the marker → converges without duplicates.
 * - 'bootstrap-request': N's pending PULL request after installGrant. N keeps
 *   re-sending `bootreq{requestId}` to P until a bootstrap arrives (pending=false),
 *   which is how the snapshot survives N not yet having an identity at link time.
 */
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord } from './db';

const APPLIED_KEY = 'bootstrap-applied';
const APPLIED_AAD = utf8.encode('scytale:bootstrap-applied:v1');
const REQUEST_KEY = 'bootstrap-request';
const REQUEST_AAD = utf8.encode('scytale:bootstrap-request:v1');

export async function loadBootstrapApplied(dek: CryptoKey): Promise<Set<string>> {
  const rec = await loadRecord(APPLIED_KEY);
  if (!rec) return new Set();
  try {
    const j = JSON.parse(utf8.decode(await open(dek, rec, APPLIED_AAD))) as { ids?: string[] };
    return new Set(Array.isArray(j.ids) ? j.ids : []);
  } catch {
    return new Set();
  }
}

export async function saveBootstrapApplied(dek: CryptoKey, ids: Set<string>): Promise<void> {
  await saveRecord(APPLIED_KEY, await seal(dek, utf8.encode(JSON.stringify({ ids: [...ids] })), APPLIED_AAD));
}

export interface BootstrapRequest {
  requestId: string;
  pending: boolean;
}

export async function loadBootstrapRequest(dek: CryptoKey): Promise<BootstrapRequest | null> {
  const rec = await loadRecord(REQUEST_KEY);
  if (!rec) return null;
  try {
    return JSON.parse(utf8.decode(await open(dek, rec, REQUEST_AAD))) as BootstrapRequest;
  } catch {
    return null;
  }
}

export async function saveBootstrapRequest(dek: CryptoKey, req: BootstrapRequest): Promise<void> {
  await saveRecord(REQUEST_KEY, await seal(dek, utf8.encode(JSON.stringify(req)), REQUEST_AAD));
}
