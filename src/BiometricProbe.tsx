import { useEffect, useRef, useState } from 'react';

/*
 * Temporary WebAuthn/PRF capability probe, rendered INSIDE the app (not a separate
 * page) so a standalone PWA — which has no address bar and whose service worker can
 * swallow a navigation to a stray .html — can reach it reliably. It runs in the exact
 * origin + display-mode context the real biometric unlock would, so its verdict is
 * representative.
 *
 * The one question: does Face ID / Touch ID, via the WebAuthn PRF extension, yield a
 * STABLE 32-byte secret here? That secret is what a real unlock would wrap the DEK
 * with. Remove this component once biometrics is decided.
 */

type Kind = '' | 'ok' | 'fail' | 'warn' | 'muted' | 'verdict-ok' | 'verdict-fail';
type Row = { text: string; kind: Kind };

// PRF extension shapes aren't in every lib.dom version — keep the casts local.
type PrfOutputs = { enabled?: boolean; results?: { first?: ArrayBuffer } };

function hex(buf: ArrayBuffer, n?: number): string {
  const b = new Uint8Array(buf);
  const len = n ? Math.min(n, b.length) : b.length;
  let s = '';
  for (let i = 0; i < len; i += 1) s += b[i].toString(16).padStart(2, '0');
  return s + (n && b.length > n ? '…' : '');
}

export function BiometricProbe({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const push = (text: string, kind: Kind = '') => setRows((r) => [...r, { text, kind }]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const dm = matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = 'standalone' in navigator ? (navigator as unknown as { standalone?: boolean }).standalone : undefined;
    const standalone = dm || iosStandalone === true;
    push(`Kontext: ${standalone ? 'STANDALONE (Home-Screen-PWA)' : 'Browser-Tab'}`, standalone ? 'ok' : 'warn');
    push(`  display-mode standalone = ${dm}  ·  navigator.standalone = ${String(iosStandalone)}`, 'muted');
    push(`  Origin ${location.origin}  ·  secure = ${window.isSecureContext}`, window.isSecureContext ? 'muted' : 'fail');
    const has = typeof PublicKeyCredential !== 'undefined';
    push(`WebAuthn vorhanden: ${has}`, has ? 'ok' : 'fail');
  }, []);

  async function run() {
    setBusy(true);
    try {
      if (typeof PublicKeyCredential === 'undefined') {
        push('❌ WebAuthn ist hier nicht verfügbar — Abbruch.', 'fail');
        return;
      }
      let uvpaa = false;
      try {
        uvpaa = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch {
        /* false */
      }
      push(`Platform-Authenticator (Face ID/Touch ID): ${uvpaa}`, uvpaa ? 'ok' : 'fail');
      if (!uvpaa) {
        push('❌ Kein Platform-Authenticator in diesem Kontext.', 'fail');
        verdict(false);
        return;
      }

      // 1) Register a throwaway platform credential that enables PRF.
      push('1) Lege Test-Passkey mit PRF an … Face ID/Touch ID bestätigen.', 'muted');
      const createOpts = {
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'SCYTALE PRF-Test' }, // rp.id defaults to this origin
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'scytale-prf-probe',
            displayName: 'SCYTALE PRF-Test',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          extensions: { prf: {} },
        },
      } as unknown as CredentialCreationOptions;
      const cred = (await navigator.credentials.create(createOpts)) as PublicKeyCredential | null;
      if (!cred) {
        push('❌ Kein Credential erzeugt.', 'fail');
        verdict(false);
        return;
      }
      push('✅ Passkey angelegt.', 'ok');
      const cExt = cred.getClientExtensionResults() as { prf?: PrfOutputs };
      const enabled = !!cExt.prf?.enabled;
      push(`  prf.enabled bei create(): ${cExt.prf ? String(cExt.prf.enabled) : 'kein prf-Objekt'}${enabled ? '' : '  (Safari meldet das oft erst bei get())'}`, enabled ? 'ok' : 'warn');

      // 2) Evaluate PRF at assertion time — the real test.
      const salt = new TextEncoder().encode('scytale:prf:probe:v1');
      const evaluate = async (): Promise<ArrayBuffer | null> => {
        const getOpts = {
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: [{ id: cred.rawId, type: 'public-key' }],
            userVerification: 'required',
            timeout: 60000,
            extensions: { prf: { eval: { first: salt } } },
          },
        } as unknown as CredentialRequestOptions;
        const assertion = (await navigator.credentials.get(getOpts)) as PublicKeyCredential | null;
        const ext = assertion?.getClientExtensionResults() as { prf?: PrfOutputs } | undefined;
        return ext?.prf?.results?.first ?? null;
      };

      push('2) Werte PRF aus … Face ID/Touch ID bestätigen.', 'muted');
      const out1 = await evaluate();
      if (!out1) {
        push('❌ PRF liefert in diesem Kontext KEIN Ergebnis → hier nicht nutzbar.', 'fail');
        verdict(false);
        return;
      }
      push(`✅ PRF-Ausgabe: ${hex(out1, 8)} (${new Uint8Array(out1).byteLength} Bytes)`, 'ok');

      // 3) Must be reproducible to derive a key.
      push('3) Prüfe Reproduzierbarkeit …', 'muted');
      const out2 = await evaluate();
      const stable = !!out2 && hex(out1) === hex(out2);
      push(stable ? '✅ PRF-Ausgabe ist STABIL (reproduzierbar).' : '❌ PRF-Ausgabe NICHT stabil → unbrauchbar.', stable ? 'ok' : 'fail');
      verdict(!!out1 && stable);
      push('Hinweis: Test-Passkey „SCYTALE PRF-Test“ in iOS-Einstellungen › Passwörter löschbar.', 'muted');
    } catch (e) {
      const err = e as { name?: string; message?: string };
      push(`❌ Fehler: ${err.name ? err.name + ' — ' : ''}${err.message ?? String(e)}`, 'fail');
      push('  (NotAllowedError = abgebrochen/Timeout · NotSupportedError = PRF/Authenticator fehlt hier)', 'muted');
    } finally {
      setBusy(false);
    }
  }

  function verdict(ok: boolean) {
    push('', '');
    push(
      ok
        ? '🟢 ERGEBNIS: Face ID/Touch ID via WebAuthn-PRF funktioniert in DIESEM Kontext.'
        : '🔴 ERGEBNIS: PRF hier nicht brauchbar — Passphrase bleibt der Weg.',
      ok ? 'verdict-ok' : 'verdict-fail',
    );
  }

  return (
    <div className="probe">
      <div className="probe-head">
        <div>
          <div className="probe-title">WebAuthn / PRF-Test</div>
          <div className="probe-sub">Liefert Face ID/Touch ID hier ein stabiles Schlüsselgeheimnis?</div>
        </div>
        <button className="probe-x" onClick={onClose} aria-label="Schließen">
          ×
        </button>
      </div>
      <button className="btn btn-primary btn-tall" onClick={() => void run()} disabled={busy}>
        {busy ? 'läuft …' : 'Test starten'}
      </button>
      <div className="probe-log">
        {rows.map((r, i) => (
          <div key={i} className={`probe-row ${r.kind}`}>
            {r.text}
          </div>
        ))}
      </div>
    </div>
  );
}
