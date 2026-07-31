import * as S from './.bundle/entry.js';

let pass = 0;
let fail = 0;
const ok = (name, condition) => {
  if (condition) {
    pass++;
    console.log('  ok  ', name);
  } else {
    fail++;
    console.log('  FAIL', name);
  }
};
const rejectsKind = async (operation, kind) => {
  try {
    await operation();
    return false;
  } catch (error) {
    return !kind || error?.kind === kind;
  }
};

console.log('\n[Offizieller Admin-Account: Root-Vertrauen und Bootstrap]');

ok('ungefüllter Release-Vertrauensanker hält die Funktion vor der Offline-Aktivierung fail-closed',
  S.officialAccountConfigured() === false);

const now = Date.now();
const root = await S.generateIdentity();
const admin = await S.generateIdentity();
const prekeys = await S.createFreshPreKeyState(admin);
const bundle = S.currentBundle(admin, prekeys);
const bundleToken = await S.encodeBundle(bundle);

const unsigned = (overrides = {}) => ({
  schema: S.OFFICIAL_ACCOUNT_MANIFEST_SCHEMA,
  sequence: 1,
  rootKeyId: S.OFFICIAL_ACCOUNT_ROOT_KEY_ID,
  alias: S.OFFICIAL_ACCOUNT_ALIAS,
  role: S.OFFICIAL_ACCOUNT_ROLE,
  displayName: S.OFFICIAL_ACCOUNT_DISPLAY_NAME,
  badge: S.OFFICIAL_ACCOUNT_BADGE,
  status: 'active',
  masterPub: S.base64urlEncode(admin.master.publicKey),
  bundle: bundleToken,
  deviceList: null,
  deviceEpoch: admin.epoch,
  deviceListVersion: 0,
  notBefore: now - 60_000,
  notAfter: now + 30 * 24 * 60 * 60 * 1000,
  revokedMasters: [],
  ...overrides,
});

const signed = async (body, signingRoot = root) => ({
  ...body,
  signature: S.base64urlEncode(
    await S.sign(
      S.officialAccountSigningBytes(body),
      signingRoot.master.privateKey,
    ),
  ),
});

const manifest = await signed(unsigned());
const trusted = await S.verifyOfficialAccountDocument(manifest, {
  rootPublicKey: root.master.publicKey,
  now,
});

ok('gültiges Root-Manifest bindet den exakten Admin-Master und Bootstrap',
  trusted.current === true &&
  trusted.manifest.displayName === 'ThePhantomPuppet' &&
  trusted.manifest.badge === 'ADMIN' &&
  trusted.bundle?.oneTimePreKey === undefined &&
  trusted.masterPub.every((byte, index) => byte === admin.master.publicKey[index]));
ok('Badge wird nur aus aktivem Trust-Dokument plus bytegleichem Contact-Master abgeleitet',
  S.isOfficialAdminContact({ peerMasterPub: admin.master.publicKey }, trusted) &&
  !S.isOfficialAdminContact({ peerMasterPub: root.master.publicKey }, trusted) &&
  !S.isOfficialAdminContact({ peerMasterPub: admin.master.publicKey }, null));
const realDateNow = Date.now;
let expiredDuringOpenTabDropsBadge = false;
try {
  Date.now = () => manifest.notAfter + 11 * 60 * 1000;
  expiredDuringOpenTabDropsBadge = !S.isOfficialAdminContact(
    { peerMasterPub: admin.master.publicKey },
    trusted,
  );
} finally {
  Date.now = realDateNow;
}
ok('lang laufender Tab entfernt den Badge nach Ablauf ohne Reload',
  expiredDuringOpenTabDropsBadge);
ok('dauerhafter Alias wird allein und in einem normalen Share-Text erkannt',
  S.extractOfficialAccountAlias('SKYTALE-SUPPORT') === 'SKYTALE-SUPPORT' &&
  S.extractOfficialAccountAlias('Support: skytale – support\nDanke') === 'SKYTALE-SUPPORT' &&
  S.extractOfficialAccountAlias('SKYTALE-SUPPORTER') === null);
ok('kanonisches JSON und Digest sind für denselben Stand stabil',
  S.canonicalOfficialAccountManifestJson(manifest) ===
    S.canonicalOfficialAccountManifestJson({ ...manifest }) &&
  trusted.digest === await S.officialAccountManifestDigest(manifest));

const forgedRoot = await S.generateIdentity();
ok('ein anderer Root-Key kann den ADMIN-Stand nicht autorisieren',
  await rejectsKind(() => S.verifyOfficialAccountDocument(manifest, {
    rootPublicKey: forgedRoot.master.publicKey,
    now,
  }), 'signature'));

for (const [field, value] of [
  ['displayName', 'ThePhantomPuppet.'],
  ['badge', 'ADMIN '],
  ['role', 'support'],
  ['alias', 'SKYTALE-ADMIN'],
  ['masterPub', S.base64urlEncode(root.master.publicKey)],
  ['sequence', 2],
]) {
  ok(`Manipulation an ${field} wird trotz alter Signatur verworfen`,
    await rejectsKind(() => S.verifyOfficialAccountDocument(
      { ...manifest, [field]: value },
      { rootPublicKey: root.master.publicKey, now },
    )));
}

ok('unbekannte Felder und nicht-kanonische Schlüsselcodierung werden strukturell abgewiesen',
  await rejectsKind(() => S.verifyOfficialAccountDocument(
    { ...manifest, admin: true },
    { rootPublicKey: root.master.publicKey, now },
  ), 'format') &&
  await rejectsKind(() => S.verifyOfficialAccountDocument(
    { ...manifest, masterPub: manifest.masterPub + '=' },
    { rootPublicKey: root.master.publicKey, now },
  ), 'format'));

const expired = await signed(unsigned({ notBefore: now - 2 * 24 * 60 * 60 * 1000, notAfter: now - 11 * 60 * 1000 }));
const future = await signed(unsigned({ notBefore: now + 11 * 60 * 1000, notAfter: now + 12 * 60 * 1000 }));
ok('abgelaufene und noch nicht gültige Root-Manifeste liefern keinen Badge',
  await rejectsKind(() => S.verifyOfficialAccountDocument(expired, {
    rootPublicKey: root.master.publicKey,
    now,
  }), 'not-current') &&
  await rejectsKind(() => S.verifyOfficialAccountDocument(future, {
    rootPublicKey: root.master.publicKey,
    now,
  }), 'not-current'));

const revoked = await signed(unsigned({ status: 'revoked', sequence: 2 }));
const trustedRevocation = await S.verifyOfficialAccountDocument(revoked, {
  rootPublicKey: root.master.publicKey,
  floor: trusted,
  now,
});
ok('höherer root-signierter Widerruf wird als Trust-Floor behalten, aber nie als ADMIN gerendert',
  trustedRevocation.sequence === 2 &&
  trustedRevocation.current === true &&
  trustedRevocation.bundle === null &&
  !S.isOfficialAdminContact({ peerMasterPub: admin.master.publicKey }, trustedRevocation) &&
  S.isRevokedOfficialAdminContact(
    { peerMasterPub: admin.master.publicKey },
    trustedRevocation,
  ));
ok('kleinere Sequenz wird nach einem gesehenen Widerruf als Rollback abgewiesen',
  await rejectsKind(() => S.verifyOfficialAccountDocument(manifest, {
    rootPublicKey: root.master.publicKey,
    floor: trustedRevocation,
    now,
  }), 'rollback'));

const equivocation = await signed(unsigned({ sequence: 2, notAfter: now + 31 * 24 * 60 * 60 * 1000 }));
ok('abweichendes, gültig signiertes Dokument derselben Sequenz wird als Equivocation abgewiesen',
  await rejectsKind(() => S.verifyOfficialAccountDocument(equivocation, {
    rootPublicKey: root.master.publicKey,
    floor: trustedRevocation,
    now,
  }), 'rollback'));
ok('Release-Floor sperrt ältere, ansonsten gültige Manifestsequenzen',
  await rejectsKind(() => S.verifyOfficialAccountDocument(manifest, {
    rootPublicKey: root.master.publicKey,
    minimumSequence: 2,
    now,
  }), 'rollback'));

const opkBundle = { ...bundle, oneTimePreKey: { id: 7, pub: new Uint8Array(32) } };
const opkToken = await S.encodeBundle(opkBundle);
const opkManifest = await signed(unsigned({ bundle: opkToken }));
ok('dauerhafter offizieller Alias lehnt verbrauchbaren One-Time-Prekey ab',
  await rejectsKind(() => S.verifyOfficialAccountDocument(opkManifest, {
    rootPublicKey: root.master.publicKey,
    now,
  }), 'format'));

const entry = {
  signPub: admin.sign.publicKey,
  dhPub: admin.dh.publicKey,
  deviceCert: admin.deviceCert,
  signedPreKey: S.ownSpkPublic(prekeys),
};
const deviceList = await S.signDeviceList(
  admin.master.privateKey,
  admin.master.publicKey,
  admin.epoch,
  1,
  [entry],
);
const encodedList = await S.encodeDeviceList(deviceList);
const withList = await signed(unsigned({
  sequence: 3,
  deviceList: S.base64urlEncode(encodedList),
  deviceListVersion: 1,
}));
const trustedWithList = await S.verifyOfficialAccountDocument(withList, {
  rootPublicKey: root.master.publicKey,
  now,
});
ok('root-gebundene master-signierte DeviceList wird vollständig angenommen',
  trustedWithList.deviceList?.version === 1 &&
  trustedWithList.deviceList.devices.length === 1);

const otherDevice = await S.generateIdentity();
const mismatchedList = await S.signDeviceList(
  admin.master.privateKey,
  admin.master.publicKey,
  admin.epoch,
  2,
  [{
    signPub: otherDevice.sign.publicKey,
    dhPub: otherDevice.dh.publicKey,
    deviceCert: otherDevice.deviceCert,
    signedPreKey: S.ownSpkPublic(await S.createFreshPreKeyState(otherDevice)),
  }],
);
const mismatchedManifest = await signed(unsigned({
  sequence: 4,
  deviceList: S.base64urlEncode(await S.encodeDeviceList(mismatchedList)),
  deviceListVersion: 2,
}));
ok('selbst root-signierte Beschreibung wird verworfen, wenn Bootstrap-Gerät und DeviceList abweichen',
  await rejectsKind(() => S.verifyOfficialAccountDocument(mismatchedManifest, {
    rootPublicKey: root.master.publicKey,
    now,
  }), 'signature'));

let request;
const fetched = await S.resolveOfficialAccount('Bitte SKYTALE-SUPPORT verbinden', {
  rootPublicKey: root.master.publicKey,
  now,
  fetcher: async (input, init) => {
    request = { input, init };
    return new Response(JSON.stringify(manifest), {
      headers: { 'content-type': 'application/json' },
    });
  },
});
ok('Resolver nutzt eine relative same-origin GET-Route ohne Credentials oder Referrer',
  request?.input === '/api/official-accounts/skytale-support' &&
  request?.init?.method === 'GET' &&
  request?.init?.credentials === 'omit' &&
  request?.init?.referrerPolicy === 'no-referrer' &&
  fetched.digest === trusted.digest);

const tooLarge = 'x'.repeat(96 * 1024 + 1);
ok('überlange Directory-Antwort wird vor JSON- und Signaturarbeit abgebrochen',
  await rejectsKind(() => S.resolveOfficialAccount('SKYTALE-SUPPORT', {
    rootPublicKey: root.master.publicKey,
    now,
    fetcher: async () => new Response(tooLarge, {
      headers: { 'content-type': 'application/json' },
    }),
  }), 'unavailable'));

// --- Fix A: die signierte revokedMasters-Liste (Carry-forward / Back-fill) ---
const foreign = await S.generateIdentity();
const foreign2 = await S.generateIdentity();
const foreignB64 = S.base64urlEncode(foreign.master.publicKey);
const ownB64 = S.base64urlEncode(admin.master.publicKey);
const byteCmp = (a, b) => {
  for (let i = 0; i < 32; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};
const sortedPair = [foreign.master.publicKey, foreign2.master.publicKey]
  .slice()
  .sort(byteCmp)
  .map(S.base64urlEncode);

const declaringDoc = await signed(unsigned({ sequence: 3, revokedMasters: [foreignB64] }));
const declaring = await S.verifyOfficialAccountDocument(declaringDoc, {
  rootPublicKey: root.master.publicKey,
  now,
});
const plain = await S.verifyOfficialAccountDocument(
  await signed(unsigned({ sequence: 3 })),
  { rootPublicKey: root.master.publicKey, now },
);
ok('aktives Manifest tombstoned einen signiert deklarierten Fremd-Master (Back-fill ohne je den revoked-Head zu sehen)',
  S.isRevokedOfficialAdminContact({ peerMasterPub: foreign.master.publicKey }, declaring) &&
  declaring.revokedMasterPubs.some(
    (pub) => pub.length === 32 && pub.every((b, i) => b === foreign.master.publicKey[i]),
  ) &&
  // Negativkontrolle: dasselbe Manifest OHNE Deklaration tombstoned nicht
  !S.isRevokedOfficialAdminContact({ peerMasterPub: foreign.master.publicKey }, plain) &&
  // ein deklarierter (widerrufener) Fremd-Master erhält niemals den AKTIVEN Badge
  !S.isOfficialAdminContact({ peerMasterPub: foreign.master.publicKey }, declaring));

const rejectsList = async (revokedMasters) =>
  rejectsKind(
    () =>
      signed(unsigned({ sequence: 3, revokedMasters })).then((doc) =>
        S.verifyOfficialAccountDocument(doc, { rootPublicKey: root.master.publicKey, now }),
      ),
    'format',
  );
ok('signierte Widerrufsliste erzwingt Kanonik: dedup, aufsteigend, kein Eigen-Master, exakt 32 Byte',
  (await rejectsList([foreignB64, foreignB64])) &&
  (await rejectsList(sortedPair.slice().reverse())) &&
  (await rejectsList([ownB64])) &&
  (await rejectsList(['AAAA'])) &&
  // Negativkontrolle: eine korrekt sortierte, gültige Liste wird akzeptiert
  !(await rejectsList(sortedPair)));

ok('die signierte Widerrufsliste gehört zum Transcript (Manipulation bricht die Signatur)',
  (await rejectsKind(
    () =>
      S.verifyOfficialAccountDocument(
        { ...declaringDoc, revokedMasters: [] },
        { rootPublicKey: root.master.publicKey, now },
      ),
    'signature',
  )) &&
  (await S.verifyOfficialAccountDocument(declaringDoc, {
    rootPublicKey: root.master.publicKey,
    now,
  })).sequence === 3);

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
