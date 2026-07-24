// Group roster authorization (audit F-02). A group has no group-level signature,
// so an incoming `ginvite`/`gremove` must be authorized against the CURRENT local
// roster: any current member may manage, but non-members and removed members must
// bounce off. These pure helpers (isGroupMember/decideInvite) carry that decision.
import * as S from './.bundle/entry.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok  ', n); } else { fail++; console.log('  FAIL', n); } };

const key = (n) => new Uint8Array(32).fill(n);
const mem = (n, name) => ({ signPub: key(100 + n), dhPub: key(n), name });
const group = (members, extra = {}) => ({ id: 'grp_test', name: 'Team', members, createdAt: 1000, ...extra });

const alice = mem(1, 'Alice');
const bob = mem(2, 'Bob');
const carol = mem(3, 'Carol');
const mallory = mem(9, 'Mallory');

console.log('\n[isGroupMember]');
const g = group([alice, bob]);
ok('Mitglied wird erkannt', S.isGroupMember(g, key(2)) === true);
ok('Nicht-Mitglied wird abgelehnt', S.isGroupMember(g, key(9)) === false);
// NEGATIVE CONTROL: must not blindly return true for a key not in the roster.
ok('Negativkontrolle: kein Blind-True', S.isGroupMember(g, key(9)) !== true);

console.log('\n[decideInvite]');
// A brand-new group is trust-on-first-invite (you are being invited).
const dNew = S.decideInvite(undefined, group([alice, bob]), key(1));
ok('neue Gruppe → accept', dNew.verdict === 'accept');

// An authorized current member may change the roster and rename.
const local = group([alice, bob], { createdAt: 555 });
const incoming = group([alice, bob, carol], { name: 'Team ✦', createdAt: 999 });
const dUpd = S.decideInvite(local, incoming, key(2)); // Bob is a member
ok('autorisiertes Mitglied → update', dUpd.verdict === 'update');
ok('neuer Roster übernommen (Carol dabei)', dUpd.verdict === 'update' && dUpd.group.members.length === 3);
ok('Rename übernommen', dUpd.verdict === 'update' && dUpd.group.name === 'Team ✦');
ok('Merge bewahrt lokales createdAt', dUpd.verdict === 'update' && dUpd.group.createdAt === 555);

// RESURRECTION ATTACK: Mallory was removed (not in the local roster) but still
// holds a pairwise session and knows the group id; she sends a ginvite re-adding
// herself. She is not a current member → rejected, roster is NOT resurrected.
const afterRemoval = group([alice, bob]);
const forged = group([alice, bob, mallory]);
const dRej = S.decideInvite(afterRemoval, forged, key(9)); // sender = Mallory
ok('Resurrection: Ex-Mitglied → reject', dRej.verdict === 'reject');
ok('reject trägt einen Grund', dRej.verdict === 'reject' && typeof dRej.reason === 'string' && dRej.reason.length > 0);

// STRANGER OVERWRITE: a contact who never was in the group tries to rewrite it.
const dStranger = S.decideInvite(local, group([mallory]), key(9));
ok('Fremder kann Gruppe nicht überschreiben', dStranger.verdict === 'reject');

// NEGATIVE CONTROL: an authorized member must NOT be rejected.
ok('Negativkontrolle: Mitglied nicht fälschlich abgewiesen', dUpd.verdict !== 'reject');

console.log(`\n${pass} ok, ${fail} fail`);
process.exit(fail ? 1 : 0);
