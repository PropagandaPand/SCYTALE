/**
 * Relay client — a thin WebSocket wrapper around the Durable Object room.
 * It only ever carries ciphertext envelopes; it neither knows nor needs keys.
 * Auto-reconnects with a small backoff.
 */
import type { Bytes } from '../crypto';

export type RelayStatus = 'connecting' | 'open' | 'closed';

export class RelayClient {
  private ws: WebSocket | null = null;
  private closedByUs = false;
  status: RelayStatus = 'closed';

  constructor(
    private roomId: string,
    private onCipher: (bytes: Bytes) => void,
    private onStatus?: (s: RelayStatus) => void,
  ) {}

  connect(): void {
    this.closedByUs = false;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/api/relay?room=${encodeURIComponent(this.roomId)}`;
    this.setStatus('connecting');

    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => this.setStatus('open');
    ws.onmessage = (ev) => {
      if (ev.data instanceof ArrayBuffer && ev.data.byteLength > 0) {
        this.onCipher(new Uint8Array(ev.data));
      }
    };
    ws.onclose = () => {
      this.setStatus('closed');
      if (!this.closedByUs) setTimeout(() => this.connect(), 1500);
    };
    ws.onerror = () => ws.close();
    this.ws = ws;
  }

  send(bytes: Bytes): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(bytes);
  }

  close(): void {
    this.closedByUs = true;
    this.ws?.close();
  }

  private setStatus(s: RelayStatus): void {
    this.status = s;
    this.onStatus?.(s);
  }
}
