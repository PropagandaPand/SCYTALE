/**
 * Message-history persistence. The decrypted chat log is sealed with the DEK
 * (AES-256-GCM) before it touches IndexedDB — at rest it's ciphertext, bound
 * per room via AAD. Loaded on unlock so conversations survive lock/reload.
 */
import { seal, open, utf8 } from '../crypto';
import { loadRecord, saveRecord } from './db';

export interface ChatMessage {
  mine: boolean;
  ts: number;
  text?: string;
  file?: { name: string; mime: string; dataB64: string };
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
