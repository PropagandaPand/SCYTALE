/**
 * CipherVault — the lock-screen centerpiece. One element, driven by the vault
 * state machine: the padlock and cipher tracks react to what the crypto is
 * doing (deriving, denied, locked out, device mismatch, unlocked, crypt error).
 */
type LockState = 'idle' | 'busy' | 'deny' | 'locked' | 'unlocking' | 'tamper' | 'fatal';

const CIPHER_A = 'A3 F0 7C 19 5E B2 D8 41 6F 0C 9A E3 22 7B C5 88 1D F4 3E 60 A9 04 D1 7F 2B E6 ';
const CIPHER_B = '5E 12 BC 90 3F A7 6D 08 E1 4C 99 22 FB 07 5A D3 84 1F 6E B0 3C 77 A2 09 CE 41 ';

function metaText(state: LockState): string {
  switch (state) {
    case 'busy':
      return 'Deriving key…';
    case 'unlocking':
      return 'Unlocked';
    case 'deny':
      return 'Access denied';
    case 'locked':
      return 'Locked out';
    case 'tamper':
      return 'Device mismatch';
    case 'fatal':
      return 'Crypt error';
    default:
      return 'Sealed · AES-256-GCM';
  }
}

export function CipherVault({ state }: { state: LockState }) {
  return (
    <div className={`vault-stage ${state}`}>
      <div className="vault-burst" />
      <svg className="lock-svg" viewBox="0 0 128 138" aria-hidden="true">
        <defs>
          <linearGradient id="vaultGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#151d19" />
            <stop offset="1" stopColor="#0a1016" />
          </linearGradient>
        </defs>
        <path className="shackle" d="M40 74 V50 A24 24 0 0 1 88 50 V74" />
        <rect className="lock-body" x="24" y="64" width="80" height="62" rx="13" />
        <circle className="keyhole" cx="64" cy="90" r="7" />
        <rect className="keyhole" x="61" y="94" width="6" height="16" rx="3" />
      </svg>
      <div className="cipher-track">
        <span>{CIPHER_A + CIPHER_A}</span>
      </div>
      <div className="cipher-track rev">
        <span>{CIPHER_B + CIPHER_B}</span>
      </div>
      <div className="vault-meta">{metaText(state)}</div>
    </div>
  );
}
