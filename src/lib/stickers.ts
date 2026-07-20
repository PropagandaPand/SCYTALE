/**
 * The user's own sticker set, sealed with the DEK in the vault.
 *
 * Stickers are just small square images the user made from their own photos —
 * nothing is shipped with the app and nothing is fetched from anywhere, so a
 * sticker leaks no more than any other attachment and adds no third party.
 *
 * On the wire a sticker travels as an ordinary image attachment carrying a NAME
 * MARKER (see STICKER_FILENAME). That is deliberate: unframeContent throws on
 * unknown frame types, so introducing a new `kind: 'sticker'` would make
 * stickers vanish silently on any device whose service worker hasn't updated
 * yet. With the marker, an older client renders a perfectly normal image and a
 * current one renders it chrome-free — degradation instead of disappearance.
 */
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord } from './db';

export interface Sticker {
  id: string;
  dataB64: string;
  mime: string;
  ts: number;
}

/** Wire marker. A file attachment with exactly this name is a sticker. */
export const STICKER_FILENAME = 'sticker.scytale';

/** Is this received attachment a sticker? */
export function isSticker(file: { name: string; mime: string }): boolean {
  return file.name === STICKER_FILENAME && file.mime.startsWith('image/');
}

/** Guard against an unbounded vault record — the set lives in one sealed blob. */
export const MAX_STICKERS = 60;

const AAD = utf8.encode('scytale:stickers:v1');

export async function loadStickers(dek: CryptoKey): Promise<Sticker[]> {
  const rec = await loadRecord('stickers');
  if (!rec) return [];
  try {
    const list = JSON.parse(utf8.decode(await open(dek, rec, AAD))) as Sticker[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveStickers(dek: CryptoKey, list: Sticker[]): Promise<void> {
  await saveRecord('stickers', await seal(dek, utf8.encode(JSON.stringify(list)), AAD));
}
