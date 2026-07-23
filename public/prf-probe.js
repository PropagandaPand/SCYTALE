/*
 * SCYTALE WebAuthn/PRF capability probe (temporary test aid — not part of the app).
 *
 * Answers ONE question empirically, on THIS device in THIS context: can we get a
 * stable, biometric-gated 32-byte secret out of Face ID / Touch ID via the WebAuthn
 * PRF extension? That secret is what a real "unlock with Face ID" would wrap the DEK
 * with. Run it once as a normal Safari tab and once as the installed Home-Screen PWA
 * (open it via the "PRF-Test" link on the unlock screen) — the standalone context is
 * the one that historically breaks on iOS, so that run is the one that matters.
 *
 * Loaded as an external same-origin script so the app's strict CSP (script-src 'self')
 * doesn't block it.
 */
(() => {
  const logEl = document.getElementById('log');
  const runBtn = document.getElementById('run');

  function line(text, cls) {
    const d = document.createElement('div');
    d.className = 'row' + (cls ? ' ' + cls : '');
    d.textContent = text;
    logEl.appendChild(d);
    return d;
  }

  function hex(buf, n) {
    const b = new Uint8Array(buf);
    const len = n ? Math.min(n, b.length) : b.length;
    let s = '';
    for (let i = 0; i < len; i += 1) s += b[i].toString(16).padStart(2, '0');
    return s + (n && b.length > n ? '…' : '');
  }

  function reportEnvironment() {
    const dm = matchMedia('(display-mode: standalone)').matches;
    const iosStandalone = 'standalone' in navigator ? navigator.standalone : undefined;
    const standalone = dm || iosStandalone === true;
    line('Kontext: ' + (standalone ? 'STANDALONE (Home-Screen-PWA)' : 'Browser-Tab'), standalone ? 'ok' : 'warn');
    line('  display-mode: standalone = ' + dm + '  ·  navigator.standalone = ' + String(iosStandalone));
    line('  Origin: ' + location.origin + '  ·  secure context = ' + window.isSecureContext, window.isSecureContext ? '' : 'fail');
    line('  UA: ' + navigator.userAgent);
    const hasWebAuthn = typeof PublicKeyCredential !== 'undefined';
    line('WebAuthn (PublicKeyCredential) vorhanden: ' + hasWebAuthn, hasWebAuthn ? 'ok' : 'fail');
  }

  async function probe() {
    runBtn.disabled = true;
    try {
      if (typeof PublicKeyCredential === 'undefined') {
        line('❌ WebAuthn ist hier gar nicht verfügbar — Abbruch.', 'fail');
        return;
      }

      let uvpaa = false;
      try {
        uvpaa = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (_) {
        /* treated as false below */
      }
      line('Platform-Authenticator (Face ID/Touch ID) verfügbar: ' + uvpaa, uvpaa ? 'ok' : 'fail');
      if (!uvpaa) {
        line('❌ Kein Platform-Authenticator in diesem Kontext — kein Face ID/Touch ID.', 'fail');
        return;
      }

      // 1) Register a throwaway platform credential that ENABLES the PRF extension.
      line('1) Lege Test-Passkey mit PRF an … jetzt Face ID/Touch ID bestätigen.', 'muted');
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'SCYTALE PRF-Test' }, // rp.id defaults to this exact origin
          user: {
            id: crypto.getRandomValues(new Uint8Array(16)),
            name: 'scytale-prf-probe',
            displayName: 'SCYTALE PRF-Test',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          extensions: { prf: {} },
        },
      });
      line('✅ Passkey angelegt.', 'ok');

      const createExt = cred.getClientExtensionResults();
      const enabledAtCreate = !!(createExt.prf && createExt.prf.enabled);
      line('  prf.enabled bei create(): ' + (createExt.prf ? String(createExt.prf.enabled) : 'kein prf-Objekt') +
        (enabledAtCreate ? '' : '  (Safari meldet das oft erst bei get() — kein Beinbruch)'), enabledAtCreate ? 'ok' : 'warn');

      // 2) Evaluate the PRF at assertion time — this is the real test.
      const salt = new TextEncoder().encode('scytale:prf:probe:v1'); // fixed input → output must be reproducible
      const evaluate = async () => {
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            allowCredentials: [{ id: cred.rawId, type: 'public-key' }],
            userVerification: 'required',
            timeout: 60000,
            extensions: { prf: { eval: { first: salt } } },
          },
        });
        const ext = assertion.getClientExtensionResults();
        return ext.prf && ext.prf.results ? ext.prf.results.first : null;
      };

      line('2) Werte PRF aus (Assertion) … jetzt erneut Face ID/Touch ID bestätigen.', 'muted');
      const out1 = await evaluate();
      if (!out1) {
        line('❌ PRF liefert in diesem Kontext KEIN Ergebnis → hier nicht nutzbar.', 'fail');
        verdict(false);
        return;
      }
      line('✅ PRF-Ausgabe erhalten: ' + hex(out1, 8) + ' … (' + new Uint8Array(out1).byteLength + ' Bytes)', 'ok');

      // 3) A derived key must be reproducible — same salt must give the same bytes.
      line('3) Prüfe Reproduzierbarkeit (zweite Auswertung) …', 'muted');
      const out2 = await evaluate();
      const stable = !!out2 && hex(out1) === hex(out2);
      line(stable ? '✅ PRF-Ausgabe ist STABIL (reproduzierbar).' : '❌ PRF-Ausgabe NICHT stabil → als Schlüssel unbrauchbar.', stable ? 'ok' : 'fail');

      verdict(!!out1 && stable);
      line('Hinweis: Der Test-Passkey „SCYTALE PRF-Test“ kann in iOS-Einstellungen › Passwörter wieder gelöscht werden.', 'muted');
    } catch (e) {
      const name = e && e.name ? e.name + ' — ' : '';
      const msg = e && e.message ? e.message : String(e);
      line('❌ Fehler: ' + name + msg, 'fail');
      line('  (NotAllowedError = abgebrochen/Timeout; NotSupportedError = PRF/Authenticator fehlt hier.)', 'muted');
    } finally {
      runBtn.disabled = false;
    }
  }

  function verdict(ok) {
    line('', '');
    line(ok
      ? '🟢 ERGEBNIS: Face ID/Touch ID via WebAuthn-PRF funktioniert in DIESEM Kontext.'
      : '🔴 ERGEBNIS: PRF hier nicht brauchbar — die Passphrase bleibt der Weg.',
      ok ? 'verdict ok' : 'verdict fail');
  }

  reportEnvironment();
  runBtn.addEventListener('click', () => void probe());
})();
