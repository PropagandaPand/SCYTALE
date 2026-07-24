/**
 * In-app, jargon-free explainer of what SCYTALE protects and how — reachable from
 * Profile → "So funktioniert der Schutz". Aimed at a non-technical reader: no
 * "hash / Argon2id / Double Ratchet" wording, every idea carried by a metaphor and
 * something the reader can poke at. Six short steps, each with its own little
 * animation or interaction. Pure client-side, no data leaves the component.
 */
import { useState } from 'react';
import {
  IconBack,
  IconChevron,
  IconLock,
  IconKey,
  IconServer,
  IconShield,
  IconDoubleCheck,
  IconEye,
} from './icons';

// Deterministic pseudo-ciphertext for the "what the server sees" demo. Seeded from
// the WHOLE input so a single keystroke reshuffles the entire block — the avalanche
// effect that makes real encryption output look like noise.
function serverGibberish(s: string): string {
  const t = s.slice(0, 40);
  const CS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let h = 2166136261 >>> 0;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  if (t.length === 0) return '';
  const len = Math.min(72, 28 + t.length * 2);
  let a = h || 1;
  let out = '';
  for (let i = 0; i < len; i++) {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    out += CS[((x ^ (x >>> 14)) >>> 0) % 64];
  }
  return out;
}

const STEPS = 6;

export function Explainer({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const next = () => (step < STEPS - 1 ? setStep(step + 1) : onClose());
  const prev = () => (step > 0 ? setStep(step - 1) : onClose());

  return (
    <div className="xpl">
      <div className="xpl-head">
        <button className="back" onClick={onClose} aria-label="Schließen">
          <IconBack />
        </button>
        <div className="xpl-dots">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`xpl-dot${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>
        <div className="xpl-head-spacer" />
      </div>

      <div className="xpl-stage">
        <div className="xpl-card" key={step}>
          {step === 0 && <StepIntro />}
          {step === 1 && <StepE2E />}
          {step === 2 && <StepVault />}
          {step === 3 && <StepRatchet />}
          {step === 4 && <StepMetadata />}
          {step === 5 && <StepVerify />}
        </div>
      </div>

      <div className="xpl-nav">
        <button className="btn btn-ghost xpl-back" onClick={prev}>
          {step === 0 ? 'Später' : 'Zurück'}
        </button>
        <button className="btn btn-primary xpl-next" onClick={next}>
          {step === STEPS - 1 ? 'Fertig' : 'Weiter'}
          {step < STEPS - 1 && <span className="xpl-next-ic"><IconChevron size={15} /></span>}
        </button>
      </div>
    </div>
  );
}

function StepIntro() {
  return (
    <div className="xpl-step xpl-center">
      <div className="xpl-hero">
        <IconShield size={44} filled />
      </div>
      <h2 className="xpl-title">So schützt dich SCYTALE</h2>
      <p className="xpl-lead">
        In fünf kurzen Schritten — ohne Fachbegriffe. Du musst uns nicht blind
        vertrauen: Probier bei jedem Schritt selbst aus, was passiert.
      </p>
      <ul className="xpl-chips">
        <li><IconLock size={13} /> Nur ihr zwei lest mit</li>
        <li><IconKey size={13} /> Der Schlüssel bleibt bei dir</li>
        <li><IconShield size={13} /> Selbst wir sehen nichts</li>
      </ul>
    </div>
  );
}

function StepE2E() {
  const [msg, setMsg] = useState('Treffen wir uns um 8?');
  const cipher = serverGibberish(msg);
  return (
    <div className="xpl-step">
      <span className="xpl-kicker"><IconLock size={12} /> Ende-zu-Ende</span>
      <h2 className="xpl-title">Nur ihr zwei könnt mitlesen</h2>
      <p className="xpl-lead">
        Deine Nachricht wird schon <b>auf deinem Gerät</b> verschlüsselt — bevor sie
        losgeschickt wird. Tipp etwas ein und sieh den Unterschied:
      </p>

      <label className="xpl-input-lbl">Deine Nachricht</label>
      <input
        className="xpl-input"
        value={msg}
        maxLength={40}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Schreib etwas…"
      />

      <div className="xpl-panel ok">
        <div className="xpl-panel-h"><IconEye size={13} /> Dein Kontakt liest</div>
        <div className="xpl-bubble">{msg || <span className="xpl-dim">…</span>}</div>
      </div>

      <div className="xpl-panel bad">
        <div className="xpl-panel-h"><IconServer size={13} /> Der Server sieht nur</div>
        <div className="xpl-cipher">{cipher || <span className="xpl-dim">…</span>}</div>
      </div>

      <p className="xpl-note">
        Der Server transportiert nur einen <b>versiegelten Umschlag</b>. Er hat keinen
        Schlüssel — und wir auch nicht.
      </p>
    </div>
  );
}

function StepVault() {
  const [open, setOpen] = useState(false);
  const tiles = ['Kontakte', 'Nachrichten', 'Bilder', 'Profil'];
  return (
    <div className="xpl-step">
      <span className="xpl-kicker"><IconKey size={12} /> Auf deinem Gerät</span>
      <h2 className="xpl-title">Alles liegt in einem Tresor</h2>
      <p className="xpl-lead">
        Dein Passwort wird auf dem Gerät zu einem <b>Schlüssel</b> — sogar wir kennen
        es nicht. Ist der Tresor zu (App gesperrt oder Handy verloren), sieht ein
        Fremder nur Datensalat. Tipp zum Auf- und Zusperren:
      </p>

      <button className={`xpl-vault${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <span className="xpl-vault-ic">{open ? <IconKey size={22} /> : <IconLock size={22} />}</span>
        <span className="xpl-vault-tx">{open ? 'Tresor offen — tippen zum Sperren' : 'Tresor gesperrt — tippen zum Öffnen'}</span>
      </button>

      <div className="xpl-grid">
        {tiles.map((t, i) => (
          <div className={`xpl-tile${open ? ' open' : ''}`} key={t} style={{ transitionDelay: `${i * 45}ms` }}>
            <span className="xpl-tile-scramble">{open ? t : serverGibberish(t + t).slice(0, 10)}</span>
          </div>
        ))}
      </div>

      <p className="xpl-note">
        Und Raten hilft kaum: jeder einzelne Rateversuch wird <b>absichtlich zäh</b>
        gemacht — Millionen pro Sekunde durchzuprobieren ist unmöglich.
      </p>
    </div>
  );
}

function StepRatchet() {
  const [keyNo, setKeyNo] = useState(1);
  const start = Math.max(1, keyNo - 3);
  const chips = [];
  for (let n = start; n <= keyNo; n++) chips.push(n);
  return (
    <div className="xpl-step">
      <span className="xpl-kicker"><IconKey size={12} /> Frische Schlüssel</span>
      <h2 className="xpl-title">Jede Nachricht kriegt einen neuen Schlüssel</h2>
      <p className="xpl-lead">
        Nach dem Senden wird der Schlüssel <b>sofort weggeworfen</b>. Klaut jemand
        später einen, bleiben alle anderen Nachrichten sicher. Sende ein paar:
      </p>

      <div className="xpl-keys">
        {chips.map((n) => (
          <div key={n} className={`xpl-keychip${n === keyNo ? ' active' : ' spent'}`}>
            <span className="xpl-keychip-ic">{n === keyNo ? <IconKey size={16} /> : <IconLock size={14} />}</span>
            <span className="xpl-keychip-no">#{n}</span>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost xpl-send" onClick={() => setKeyNo((k) => k + 1)}>
        <IconDoubleCheck size={13} /> Nächste Nachricht senden
      </button>

      <p className="xpl-note">
        Schon <b>{keyNo - 1}</b> Schlüssel benutzt und vernichtet. Es geht nur vorwärts —
        zurück zu einem alten Schlüssel führt kein Weg.
      </p>
    </div>
  );
}

function StepMetadata() {
  const sees = ['dass überhaupt etwas ankam', 'wann das war', 'ungefähr wie groß'];
  const blind = ['wer geschrieben hat', 'was drinsteht', 'an wen es ging'];
  return (
    <div className="xpl-step">
      <span className="xpl-kicker"><IconServer size={12} /> Ehrlich bleiben</span>
      <h2 className="xpl-title">Was der Server sieht — und was nicht</h2>
      <p className="xpl-lead">
        Wir versprechen nichts Unmögliches. Dass <i>überhaupt</i> Nachrichten fließen,
        lässt sich nicht ganz verstecken — Inhalt und Absender aber schon.
      </p>

      <div className="xpl-cols">
        <div className="xpl-col bad">
          <div className="xpl-col-h"><IconEye size={13} /> Sieht</div>
          {sees.map((t, i) => (
            <div className="xpl-li" key={t} style={{ animationDelay: `${120 + i * 90}ms` }}>{t}</div>
          ))}
        </div>
        <div className="xpl-col ok">
          <div className="xpl-col-h"><IconShield size={13} /> Sieht nicht</div>
          {blind.map((t, i) => (
            <div className="xpl-li" key={t} style={{ animationDelay: `${300 + i * 90}ms` }}>{t}</div>
          ))}
        </div>
      </div>

      <p className="xpl-note">
        Der Absender ist <b>versiegelt</b>: Selbst wir sehen nicht, wer dir schreibt —
        nur, dass dein Briefkasten ein Päckchen bekommen hat.
      </p>
    </div>
  );
}

function StepVerify() {
  const [matched, setMatched] = useState(false);
  const code = ['48', '32', '90', '15'];
  return (
    <div className="xpl-step xpl-center">
      <span className="xpl-kicker"><IconShield size={12} /> Sicher sein</span>
      <h2 className="xpl-title">Ist es wirklich dein Kontakt?</h2>
      <p className="xpl-lead">
        Einmal kurz eine kleine Zahl vergleichen (oder Emojis) — dann kann sich
        niemand heimlich dazwischenschummeln. Tipp auf „Vergleichen“:
      </p>

      <div className="xpl-devs">
        <div className="xpl-dev">
          <div className="xpl-dev-lbl">Du</div>
          <div className={`xpl-code${matched ? ' match' : ''}`}>
            {code.map((c, i) => (
              <span key={i} style={{ transitionDelay: `${i * 70}ms` }}>{matched ? c : '••'}</span>
            ))}
          </div>
        </div>
        <div className={`xpl-devlink${matched ? ' match' : ''}`}>
          {matched ? <IconShield size={18} filled /> : <IconLock size={16} />}
        </div>
        <div className="xpl-dev">
          <div className="xpl-dev-lbl">Kontakt</div>
          <div className={`xpl-code${matched ? ' match' : ''}`}>
            {code.map((c, i) => (
              <span key={i} style={{ transitionDelay: `${i * 70}ms` }}>{matched ? c : '••'}</span>
            ))}
          </div>
        </div>
      </div>

      {matched ? (
        <div className="xpl-verified"><IconDoubleCheck size={14} /> Stimmt überein — verifiziert</div>
      ) : (
        <button className="btn btn-ghost xpl-compare" onClick={() => setMatched(true)}>
          Vergleichen
        </button>
      )}

      <p className="xpl-note">
        Das machst du in SCYTALE bei jedem Kontakt über <b>Verifizieren</b>. Danach
        weißt du sicher: die Leitung gehört wirklich euch beiden.
      </p>
    </div>
  );
}
