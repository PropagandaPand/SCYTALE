/**
 * Zero-knowledge rendezvous for short remote contact codes.
 *
 * One object exists per 256-bit locator. The record is opaque client-side
 * AES-GCM ciphertext: this Worker never sees a contact's public-key bundle.
 * Records are immutable, reusable for reliable retries, and expire after one
 * day without a read extending their lifetime.
 */
import { DurableObject } from 'cloudflare:workers';

const RECORD_KEY = 'record';
export const CONTACT_CODE_TTL_MS = 24 * 60 * 60 * 1000;
const PAYLOAD_CHARS = 427;
const B64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

interface ContactCodeRecord {
  payload: string;
  createdAt: number;
  expiresAt: number;
}

export interface ContactCodePublishResult {
  ok: boolean;
  created: boolean;
  conflict?: boolean;
  expiresAt: number;
}

export interface ContactCodeResolveResult {
  payload: string;
  expiresAt: number;
}

function canonicalOpaquePayload(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length !== PAYLOAD_CHARS ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    return false;
  }
  const remainder = value.length % 4;
  if (remainder === 1) return false;
  const last = B64URL.indexOf(value[value.length - 1]);
  return !(
    (remainder === 2 && (last & 0x0f) !== 0) ||
    (remainder === 3 && (last & 0x03) !== 0)
  );
}

export class ContactCode extends DurableObject<unknown> {
  /**
   * First write wins. Retrying the byte-identical request is idempotent and does
   * not slide expiry; a different ciphertext at the same locator is rejected.
   */
  async publish(payload: string): Promise<ContactCodePublishResult> {
    if (!canonicalOpaquePayload(payload)) {
      return { ok: false, created: false, expiresAt: 0 };
    }
    const now = Date.now();
    return this.ctx.storage.transaction(async (txn) => {
      const existing = await txn.get<ContactCodeRecord>(RECORD_KEY);
      if (existing && existing.expiresAt > now) {
        if (existing.payload !== payload) {
          return {
            ok: false,
            created: false,
            conflict: true,
            expiresAt: existing.expiresAt,
          };
        }
        // Repair a missing alarm after an ambiguous platform/storage failure,
        // but never extend the immutable record's lifetime.
        if ((await txn.getAlarm()) === null) await txn.setAlarm(existing.expiresAt);
        return { ok: true, created: false, expiresAt: existing.expiresAt };
      }

      const record: ContactCodeRecord = {
        payload,
        createdAt: now,
        expiresAt: now + CONTACT_CODE_TTL_MS,
      };
      await txn.put(RECORD_KEY, record);
      await txn.setAlarm(record.expiresAt);
      return { ok: true, created: true, expiresAt: record.expiresAt };
    });
  }

  /** Resolve without recording access metadata or extending the TTL. */
  async resolve(): Promise<ContactCodeResolveResult | null> {
    const record = await this.ctx.storage.get<ContactCodeRecord>(RECORD_KEY);
    if (!record) return null;
    if (record.expiresAt <= Date.now()) {
      await this.ctx.storage.deleteAll();
      return null;
    }
    return { payload: record.payload, expiresAt: record.expiresAt };
  }

  async alarm(): Promise<void> {
    // compatibility_date >= 2026-02-24: deleteAll also clears the alarm and all
    // storage metadata, so expired random lookups do not leave billable shells.
    await this.ctx.storage.deleteAll();
  }
}
