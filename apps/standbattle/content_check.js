/* node apps/standbattle/content_check.js — the content of the game is valid, all of it at once: the roster and every movelist (the rows build, the ids are unique, strings have their parents, each
   fighter has the shape the spec asks of a fighter), the ladder, the CPU's profiles (they hold only the numbers the spec allows), the save, the high-score table, the keymaps, the stages, the
   hook names the code fires, and the pay and score tables. It lists every problem it finds, not the first. */
import { readdirSync, readFileSync } from 'node:fs';
import { ROSTER, PLAYABLE, movelistOf, defOf } from './roster.js';
import { validateMove } from './moves.js';
import { STYLES } from './anim_styles.js';
import { ladderFor, LADDER_LENGTH } from './ladder.js';
import { TIERS, HUMAN, ladderProfile } from './ai_profiles.js';
import { STAGES, STAGE_IDS } from './stages.js';
import { SCENES as BG } from './background.js';
import { EVENT_HOOKS } from './hooks.js';
import { defaultMeta, createSaveStore } from './save.js';
import { qualifies, insert, sortTable, rankOf, cleanInitials } from './hiscore.js';
import { DEFAULT_KEYMAP, SHARED_KEYMAP, createDevices, buttonsOf } from './input.js';
import { scoreMatch, createSession, TIER_MULT, CONTINUES } from './session.js';
import { matchSun, clearSun, BASE } from './pay.js';
import { RULES } from './rules.js';
const problems = [];
const bad = (m) => problems.push(m);
let n = 0;
const ok = (c, m) => { n++; if (!c) bad(m); };

/* ---- the roster and the movelists ---- */
ok(PLAYABLE.length === 5, 'five playable fighters (' + PLAYABLE.length + ')');
Object.keys(ROSTER).forEach(id => {
  const d = ROSTER[id], ml = movelistOf(id), L = ml.list, tag = id;
  ok(d.name === d.name.toUpperCase() && d.short && d.stand && d.blurb.length === 4, tag + ': a name in capitals, a short name, a Stand and a four-line note');
  ok(!('hp' in d) && !('damage' in d) && !('dmgMult' in d) && !('speed' in d), tag + ': no stat of its own beyond how fast it walks (a fighter is the same fighter whoever plays it)');
  ok(d.walk.f >= 0.9 && d.walk.f <= 1.1 && d.walk.b >= 0.9 && d.walk.b <= 1.1, tag + ': walks within 10% of the others');
  L.forEach(m => validateMove(m).forEach(bad));
  L.forEach(m => { ok(STYLES[m.anim], tag + '.' + m.id + ': an animation style that exists (' + m.anim + ')'); ok(m.name === m.name.toUpperCase() && m.name.length <= 24, tag + '.' + m.id + ': a name in capitals of at most 24 characters'); });
  L.forEach(m => { if (m.cmd.kind === 'chain') ok(ml.byId.has(m.cmd.parent), tag + '.' + m.id + ': its string starts from a move that exists (' + m.cmd.parent + ')'); });
  ok(L.length >= 25 && L.length <= 34, tag + ': about 25 moves, give or take its throws and risers (' + L.length + ')');
  const has = f => L.some(f);
  ['h', 'm', 'l'].forEach(h => ok(has(m => m.h === h), tag + ': has a ' + h + ' move'));
  ok(L.filter(m => m.h === 't' && !m.special).length === 3 && ['LP', 'RP', 'ANY'].every(b => L.some(m => m.h === 't' && m.throw.brk === b)), tag + ': three throws on the buttons, broken by LP, by RP and by either');
  ok(L.filter(m => m.stance === 'down').length === 2, tag + ': two kicks from the floor');
  ok(has(m => m.reaction === 'launch') && has(m => m.reaction === 'down') && has(m => m.reaction === 'bounce'), tag + ': a launch, a knockdown and a bounce');
  ok(has(m => m.cmd.kind === 'chain') && has(m => m.cmd.kind === 'dash'), tag + ': a string and a dash attack');
  ok(['qcf', 'qcb', 'ch'].every(k => has(m => m.cmd.motion === k)), tag + ': a move for each of the quarter-circle forward, the quarter-circle back and the charge');
  ok(has(m => m.juggle) && has(m => m.hits.length > 1) || id === 'angelo', tag + ': moves that juggle, and a multi-hit special');
  ok(has(m => m.ch === 'launch'), tag + ': a move that launches on a counter hit');
  ok(has(m => m.splat), tag + ': a move that splats against the wall');
  const strikes = L.filter(m => m.h !== 't' && m.stance === 'stand'), trackers = strikes.filter(m => m.track !== 'none');
  ok(trackers.length / strikes.length >= 0.12 && trackers.length / strikes.length <= 0.4, tag + ': about one move in four tracks a sidestep (' + trackers.length + ' of ' + strikes.length + ')');
  ok(strikes.some(m => m.track === 'near') || strikes.some(m => m.track === 'far'), tag + ': a move that tracks only one lane');
  ok(L.some(m => m.startup === 10), tag + ': an i10');
  ok(!L.some(m => m.cmd.kind !== 'chain' && m.startup < 10), tag + ': nothing faster than i10');
});
const kira = movelistOf('kira'), boss = movelistOf('boss');
ok(ROSTER.boss.boss && !ROSTER.boss.playable && boss.list.length === kira.list.length + 2 && ['sha', 'btd'].every(i => boss.byId.has(i) && !kira.byId.has(i)), 'the boss is Kira with two moves more and nothing else more (no health, no damage)');
ok(PLAYABLE.every(id => ROSTER[id].playable && !ROSTER[id].boss), 'only the five are playable');
ok(movelistOf('angelo').list.some(m => m.proj) && boss.list.some(m => m.proj && m.proj.homing) && kira.list.some(m => m.status && m.status.id === 'bomb') && kira.list.some(m => m.detonate), 'projectiles, the bomb and its detonation, the homing bomb: all in the data');
ok(movelistOf('angelo').list.some(m => m.status && m.status.id === 'drown' && m.h === 't'), 'Angelo\'s grab starts the drowning');

/* ---- the ladder ---- */
PLAYABLE.forEach(id => {
  const L = ladderFor(id);
  ok(L.length === LADDER_LENGTH && L[L.length - 1].boss && L[L.length - 1].stage === 'store', id + ': a ladder of six that ends with the boss at the store');
  ok(L.filter(r => r.id === id && r.mirror).length === 1 && L.filter(r => r.id === id).length === 1, id + ': meets itself once, as the mirror');
  ok(L.filter(r => r.mirror).length === 1 && L.every(r => ROSTER[r.id]), id + ': one mirror, and everyone it meets exists');
  ok(new Set(L.slice(0, 4).map(r => r.id)).size === 4, id + ': the four others, each once, first');
  ok(L.every(r => STAGES[r.stage]), id + ': every stage is a stage');
});

/* ---- the CPU's numbers ---- */
const ALLOWED = ['reaction', 'error', 'punish', 'tech', 'step', 'combo', 'aggro', 'think'].sort().join();
['easy', 'normal', 'hard'].forEach(t => ok(Object.keys(TIERS[t]).sort().join() === ALLOWED, t + ': a profile of exactly the numbers the spec lists, none for health, damage or speed'));
ok(Object.keys(HUMAN).sort().join() === ALLOWED, 'the budget bot is the same program with a person\'s numbers');
ok(TIERS.easy.reaction > TIERS.normal.reaction && TIERS.normal.reaction > TIERS.hard.reaction && TIERS.easy.error > TIERS.normal.error && TIERS.normal.error > TIERS.hard.error && TIERS.easy.punish < TIERS.normal.punish && TIERS.normal.punish < TIERS.hard.punish && TIERS.easy.tech < TIERS.hard.tech && TIERS.easy.combo < TIERS.hard.combo, 'the tiers are ordered on every number');
ok(HUMAN.reaction < TIERS.normal.reaction && HUMAN.reaction >= TIERS.hard.reaction && HUMAN.combo <= 3, 'a person\'s pace is between NORMAL and the top of HARD and routes at most three hits');
['easy', 'normal', 'hard'].forEach(t => {
  const first = ladderProfile(t, 0, 6), last = ladderProfile(t, 5, 6);
  let mono = true; for (let k = 1; k < 6; k++) { const p = ladderProfile(t, k - 1, 6), q = ladderProfile(t, k, 6); if (q.reaction > p.reaction || q.error > p.error + 1e-9 || q.punish < p.punish - 1e-9) mono = false; }
  ok(first.reaction === TIERS[t].reaction && last.reaction <= first.reaction && last.error < first.error && last.punish > first.punish && mono, t + ': a ladder starts at its tier and climbs to a stronger CPU at the boss, never easing on the way');
});
ok(ladderProfile('easy', 5, 6).reaction === TIERS.normal.reaction && ladderProfile('normal', 5, 6).reaction <= TIERS.normal.reaction && ladderProfile('normal', 5, 6).reaction >= TIERS.hard.reaction && ladderProfile('hard', 5, 6).reaction < TIERS.hard.reaction, 'EASY ends where NORMAL begins, NORMAL ends between NORMAL and HARD, and HARD goes beyond itself');

/* ---- the save, the table, the keys, the stages ---- */
(async () => {
  const mem = {}; const ctx = { load: async k => mem[k], save: async (k, v) => { mem[k] = v; } };
  mem.meta = { version: 1, data: { shakeEnabled: false, cleared: true } }; mem.run = { version: 1, data: { nodeIndex: 2 } };
  const m = await createSaveStore(ctx).loadMeta();
  ok(m.shakeEnabled === false && m.cleared.jotaro && mem.run === null && mem.meta.version === 2, 'save v1 migrates to v2, keeps the shake setting, and the old run checkpoint is removed');
  mem.meta = { version: 2, data: { hiscores: new Array(14).fill({ initials: 'AAA', score: 5 }), difficulty: 'nightmare', survival: 7 } };
  const m2 = await createSaveStore(ctx).loadMeta();
  ok(m2.hiscores.length === 10 && m2.difficulty === 'normal' && typeof m2.survival === 'object', 'a damaged save is tidied: ten scores at most, a tier that exists, records that are records');
  mem.meta = 'garbage'; ok((await createSaveStore(ctx).loadMeta()).difficulty === 'normal', 'an unreadable save gives the defaults');
  ok(JSON.stringify(Object.keys(defaultMeta()).sort()) === JSON.stringify(['cleared', 'difficulty', 'hiscores', 'initials', 'keymap', 'lastChar', 'played', 'shakeEnabled', 'survival', 'timeattack', 'training'].sort()), 'the default save has the fields the spec lists');
  finish();
})();
{
  let t = [];
  for (let i = 1; i <= 12; i++) t = insert(t, { initials: 'A' + i, score: i * 100 }).table;
  ok(t.length === 10 && t[0].score === 1200 && t[9].score === 300, 'the table keeps the best ten, best first');
  ok(qualifies(t, 350) && !qualifies(t, 200) && !qualifies(t, 0) && rankOf(t, 1300) === 0, 'a score qualifies if it beats the tenth; a zero never does');
  ok(cleanInitials('ab') === 'ABA' && cleanInitials('x!y?z') === 'XYZ' && cleanInitials('') === 'AAA', 'initials are three capital letters');
}
{
  const dup = (map) => { const keys = Object.keys(map.p1).concat(Object.keys(map.p2)); return keys.length !== new Set(keys).size; };
  ok(!dup(DEFAULT_KEYMAP) && Object.keys(DEFAULT_KEYMAP.p1).length === 8 && Object.keys(DEFAULT_KEYMAP.p2).length === 8, 'the default keys: eight for each player and no key twice');
  const d = createDevices(); d.bindKey('p1', 'LP', 'KeyK'); d.bindKey('p2', 'RP', 'KeyI');
  ok(d.keyFor('p1', 'LP') === 'KeyK' && d.keyFor('p1', 'RK') === null && d.keyFor('p2', 'RP') === 'KeyI' && d.keyFor('p1', 'RP') === null && d.keyFor('p1', 'LK') === 'KeyJ', 'rebinding takes a key from whoever had it');
  d.reset(); ok(d.keyFor('p1', 'LP') === 'KeyU', 'DEFAULTS puts them back');
  d.keyDown('KeyU'); ok(d.bits(0) === 16, 'a key down is a bit'); d.keyUp('KeyU'); d.single = false; d.keyDown('Numpad4'); ok(d.bits(1) === 16 && d.bits(0) === 0, 'in a two-player game each side of the keyboard is its own player');
  d.share(); ok(d.keyFor('p1', 'LP') === 'KeyF' && d.keyFor('p2', 'LP') === 'KeyK', 'SHARED KEYBOARD is the old one-hand-each split');
  ok(createDevices(SHARED_KEYMAP).keyFor('p1', 'LP') === 'KeyU', 'a save that holds exactly the old defaults was never changed by its owner: it gets the new ones');
  ok(createDevices({ p1: Object.assign({}, SHARED_KEYMAP.p1, { KeyF: 'RP', KeyG: 'LP' }) }).keyFor('p1', 'LP') === 'KeyG', 'a save the owner did change is kept');
  /* The default is for two hands: the left steers, the right fights; the four buttons are a block (hands over feet, left over left) under the right hand's index and middle fingers */
  const LEFT = new Set('QWERTASDFGZXCVB'), RIGHT = new Set('YUIOPHJKLNM'), key = c => c.replace(/^Key/, ''), at = a => key(Object.keys(DEFAULT_KEYMAP.p1).find(k => DEFAULT_KEYMAP.p1[k] === a));
  ok(['left', 'right', 'up', 'down'].every(a => LEFT.has(at(a))), 'the left hand steers (' + ['left', 'right', 'up', 'down'].map(at).join(' ') + ')');
  ok(['LP', 'RP', 'LK', 'RK'].every(a => RIGHT.has(at(a))), 'the right hand fights (' + buttonsOf(DEFAULT_KEYMAP, 'p1') + ')');
  const ROWS = ['QWERTYUIOP', 'ASDFGHJKL;', 'ZXCVBNM,./'], OFF = [0, 0.25, 0.75], pos = k => { const r = ROWS.findIndex(x => x.includes(k)); return { r, x: ROWS[r].indexOf(k) + OFF[r] }; };
  const [lp, rp, lk, rk] = ['LP', 'RP', 'LK', 'RK'].map(a => pos(at(a)));
  ok(lp.r === rp.r && lk.r === rk.r && lk.r === lp.r + 1 && rp.x - lp.x === 1 && rk.x - lk.x === 1 && Math.abs(lk.x - lp.x) <= 0.5, 'the buttons are a two-by-two block: punches over kicks, left over left');
  ok(buttonsOf(DEFAULT_KEYMAP, 'p1') === 'U I J K' && buttonsOf(DEFAULT_KEYMAP, 'p2') === 'NP4 NP5 NP1 NP2', 'the buttons read back as the player would say them');
}
ok(STAGE_IDS.length === 4 && STAGE_IDS.every(i => BG[i]) && STAGE_IDS.some(i => STAGES[i].rule === 'ring') && STAGE_IDS.some(i => STAGES[i].rule === 'walls'), 'four stages, each a place the background can draw, both rules in use');

/* ---- the hooks the code fires are hooks that exist ---- */
{
  const dir = new URL('.', import.meta.url).pathname, fired = new Set();
  readdirSync(dir).filter(f => f.endsWith('.js') && !/_check|check_kit/.test(f)).forEach(f => { const s = readFileSync(dir + f, 'utf8'); (s.match(/fire\('(on[A-Za-z]+)'/g) || []).forEach(x => fired.add(x.slice(6, -1))); });
  const missing = [...fired].filter(h => EVENT_HOOKS.indexOf(h) < 0);
  ok(missing.length === 0, 'every hook the code fires is registered' + (missing.length ? ': ' + missing.join(', ') : ''));
  const heard = new Set(); readdirSync(dir).filter(f => f.endsWith('.js') && !/_check|check_kit/.test(f)).forEach(f => { (readFileSync(dir + f, 'utf8').match(/\.on\('(on[A-Za-z]+)'/g) || []).forEach(x => heard.add(x.slice(5, -1))); });
  const deaf = [...heard].filter(h => EVENT_HOOKS.indexOf(h) < 0); ok(deaf.length === 0, 'every hook something listens for is registered' + (deaf.length ? ': ' + deaf.join(', ') : ''));
}

/* ---- the score and the pay ---- */
{
  const mk = (wins, hp, ring, combo) => ({ history: wins.map(w => ({ winner: w, hp: [hp, 0], how: ring ? 'ring' : 'ko', clock: 1800 })), stats: [{ maxCombo: combo }, {}] });
  const two = scoreMatch(mk([0, 0], 120, false, 0), 'normal'), one = scoreMatch(mk([0, 1, 0], 60, false, 0), 'normal');
  ok(two > one && two > 2000 && scoreMatch(mk([0, 0], 120, false, 0), 'hard') === two * 2 && scoreMatch(mk([0, 0], 120, false, 0), 'easy') === two / 2, 'a cleaner, quicker win scores more, and the tier multiplies it (x0.5, x1, x2)');
  ok(scoreMatch(mk([0, 0], 120, false, 8), 'normal') === two + 250 && scoreMatch(mk([0, 0], 120, true, 0), 'normal') > two, 'a long combo and a ring-out add to it');
  ok(CONTINUES.easy === 7 && CONTINUES.normal === 5 && CONTINUES.hard === 3 && TIER_MULT.hard === 2, 'seven, five and three continues');
  const ladder = [0, 1, 2, 3, 4, 5, 6].reduce((s, i) => s + matchSun('arcade', 'normal', i, true, 0), 0);
  ok(ladder === 1330 && ladder + clearSun('arcade', 'normal') === 2330, 'a ladder pays 1,330 and its clear 1,000 more (' + ladder + ')');
  ok(matchSun('arcade', 'normal', 0, false, 0) === 0 && matchSun('versus', 'normal', 0, true, 0) === 0, 'nothing is paid for a loss or for two people fighting each other');
  ok(clearSun('arcade', 'hard') === 2 * clearSun('arcade', 'normal') && clearSun('arcade', 'easy') * 2 === clearSun('arcade', 'normal'), 'the tier is the pay multiplier too');
}
function finish() {
  problems.forEach(p => console.log('FAIL - ' + p));
  console.log(problems.length ? problems.length + ' problems in ' + n + ' checks' : 'All ' + n + ' content checks pass: ' + Object.keys(ROSTER).length + ' fighters, ' + Object.keys(ROSTER).reduce((s, i) => s + movelistOf(i).list.length, 0) + ' moves.');
  process.exit(problems.length ? 1 : 0);
}
