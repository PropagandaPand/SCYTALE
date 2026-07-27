export interface ByteStreamReader {
  read(): Promise<ReadableStreamReadResult<Uint8Array<ArrayBuffer>>>;
  cancel(reason?: unknown): Promise<void>;
}

export class ExactStreamLengthError extends Error {
  constructor(public readonly code: 'invalid-length' | 'truncated' | 'trailing-bytes') {
    super(code === 'truncated' ? 'Übertragung unvollständig.' : 'Unerwartete Dateilänge.');
    this.name = 'ExactStreamLengthError';
  }
}

/**
 * Consume exactly `expectedBytes`, then cancel the reader immediately. A server
 * that puts trailing bytes in the same network chunk is rejected; bytes queued
 * after the declared body are never read/accumulated and are aborted by cancel().
 */
export async function consumeExactByteStream(
  reader: ByteStreamReader,
  expectedBytes: number,
  consume: (chunk: Uint8Array<ArrayBuffer>) => void | Promise<void>,
): Promise<void> {
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes < 1) {
    throw new ExactStreamLengthError('invalid-length');
  }

  let seen = 0;
  try {
    while (seen < expectedBytes) {
      const { done, value } = await reader.read();
      if (done) throw new ExactStreamLengthError('truncated');
      if (!value?.length) continue;
      if (value.length > expectedBytes - seen) {
        throw new ExactStreamLengthError('trailing-bytes');
      }
      seen += value.length;
      await consume(value);
    }
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  }

  // Do not issue another read after the authenticated/declared body is complete:
  // this is the resource-safety boundary against an endless trailing stream.
  await reader.cancel('expected ciphertext length consumed').catch(() => undefined);
}
