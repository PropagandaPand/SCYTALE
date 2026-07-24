import { useEffect, useState } from 'react';
import { AudioPlayer } from './AudioPlayer';
import { IconAttach } from './icons';
import { b64ToBytes } from './lib/bytes';
import { getAttachmentBlob } from './lib/attachments';
import { isSticker } from './lib/stickers';
import type { FileRef } from './lib/messages';

/** Resolve a message attachment to a Blob, from either storage format. Returns null
 *  if the referenced attachment is missing (e.g. arrived on this device by initial
 *  sync as a bare reference, or was garbage-collected). `attId` wins over inline. */
export async function resolveFileBlob(dek: CryptoKey, file: FileRef): Promise<Blob | null> {
  if (file.attId) return getAttachmentBlob(dek, file.attId);
  if (file.dataB64 !== undefined) return new Blob([b64ToBytes(file.dataB64)], { type: file.mime });
  return null;
}

/** Full-screen image viewer. Takes a Blob and owns its object URL, so the URL's
 *  lifetime is the viewer's — not tied to a chat bubble that may scroll away. */
export function LightboxImg({ blob, onClose }: { blob: Blob; onClose: () => void }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-label="Bild">
      {url && <img src={url} alt="" />}
      <button className="lightbox-close" onClick={onClose} aria-label="Schließen">
        ×
      </button>
    </div>
  );
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name || 'anhang';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Renders any message attachment: sticker, image, video, audio or a download chip.
 *  Loads the bytes from whichever store format the message uses and manages the
 *  object-URL lifecycle, so a 25 MB video is never a base64 data: URL in the DOM. */
export function Attachment({
  dek,
  file,
  onImageZoom,
  onStickerZoom,
}: {
  dek: CryptoKey;
  file: FileRef;
  onImageZoom: (blob: Blob) => void;
  onStickerZoom: (file: FileRef) => void;
}) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    void (async () => {
      try {
        const b = await resolveFileBlob(dek, file);
        if (!alive) return;
        setBlob(b);
        setState(b ? 'ready' : 'missing');
      } catch {
        if (alive) setState('missing');
      }
    })();
    return () => {
      alive = false;
    };
  }, [dek, file]);

  // One object URL per resolved blob, revoked when it changes or unmounts.
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!blob) {
      setUrl('');
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  if (state === 'missing') {
    return <div className="file-missing">Anhang auf diesem Gerät nicht verfügbar</div>;
  }
  if (state === 'loading' || !url || !blob) {
    return <div className="file-loading" aria-busy="true">Anhang lädt…</div>;
  }

  if (isSticker(file)) {
    return <img className="bubble-sticker" src={url} alt="Sticker" draggable={false} onClick={() => onStickerZoom(file)} />;
  }
  if (file.mime.startsWith('video/')) {
    return <video className="bubble-video" src={url} controls playsInline preload="metadata" />;
  }
  if (file.mime.startsWith('image/')) {
    return <img className="bubble-img" src={url} alt={file.name} draggable={false} onClick={() => onImageZoom(blob)} />;
  }
  if (file.mime.startsWith('audio/')) {
    return <AudioPlayer blob={blob} mime={file.mime} />;
  }
  return (
    <button className="file-chip" onClick={() => downloadBlob(blob, file.name)}>
      <IconAttach size={15} />
      <span className="fn">{file.name}</span>
    </button>
  );
}
