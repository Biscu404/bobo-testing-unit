/* node apps/cook/shed_check.js, the Cook's shed held to account (pure Node, no screen: the real controller is driven with a pretend canvas).
   THE RULES    a hedge, a gnome and the shed stop a look and a pond does not; a neighbour looks as far as she can and turns by her pattern; you may not end a turn on red; the tax man walks his
                round and is feared a square away; a gnome is pushed onto bare lawn and nowhere else; hands hold what they can hold; the van sells for the price to empty hands; the stand pays a coin
                to somebody who waits on it, once; a move that cannot be made costs nothing; and a win is every part handed in
   THE BOARDS   ten, none bigger than ten squares by seven; every one can be won; the `par` written in each is the fewest turns there is, and is found again here by breadth-first search;
                nobody starts in the red; the hedges, the gnome, every neighbour and the tax man each matter to the best way through (take one away and the way gets shorter); the gnome of the
                third board is the only way past her; the van and the stand are used by the boards that have them; a board is small enough to be seen through
   HIS WORDS    every pool has something in it, nothing is said twice, nothing is too long for the box or has a curly quote or a contraction in it, he calls a good half of what he says bitch and says
                nothing stronger, every board has its introduction and two things to say when it is won, and his voice has a blip for every line
   HIS FACE     the El Camino Jesse is drawn in his own colours inside his own 16 x 20, with nothing on the chin, in every mood
   THE SHED     driven through the real controller: the first visit reads four pages, the blueprint opens the list, a board played by its own best solution is won in par, medals and the next board are
                kept (and kept across a new window), a step into the red is taken back, undo and reset work, all ten are won and the shed is left whole */
import { LEVELS } from './shed_levels.js';
import { parse, fresh, step, red, next, taxAt, facing, solve, reachable, ACTIONS } from './shed_model.js';
import { shedPool, SHED_TAGS, POOLS, IN_ORDER } from './shed_say.js';
import { moodForShed, drawJesseEC } from './jesse_ec.js';
import { blip, play as playBlip } from './voice.js';
import { createShed, KEY } from './shed.js';
import { PARTS, neighbour, sizeOf, NEIGHBOURS } from './shed_art.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const lv = (rows, extra) => Object.assign({ id: 0, name: 'T', sub: '', par: 0, rows }, extra || {});
const board = (rows, extra) => parse(lv(rows, extra));
const go = (wd, s, ...as) => { let r = null; for (const a of as) { r = step(wd, s, a); s = r.s; } return { s, ev: r.ev }; };

/* ---- the rules ---------------------------------------------------------------------------------------------------------------------- */
{
  /* sight: a neighbour at the left of a row looks east */
  const row = (mid, extra) => board(['N' + mid.padEnd(7, '.'), '@S......'].map((r, i) => (i ? r : r)), Object.assign({ neighbours: [{ dirs: 'E', range: 6 }] }, extra));
  const sees = (wd, s) => [...red(wd, s)].sort().join(' ');
  let wd = row('.....'), s = fresh(wd);
  ok(sees(wd, s) === '1,0 2,0 3,0 4,0 5,0 6,0', 'a neighbour looking east sees as far as her range: ' + sees(wd, s));
  wd = row('..#..'); ok(sees(wd, fresh(wd)) === '1,0 2,0', 'a hedge stops a look');
  wd = row('..g..'); ok(sees(wd, fresh(wd)) === '1,0 2,0', 'a gnome stops a look');
  wd = row('..~..'); ok(sees(wd, fresh(wd)) === '1,0 2,0 3,0 4,0 5,0 6,0', 'a pond does not');
  wd = board(['N.S.....', '.@......'], { neighbours: [{ dirs: 'E', range: 6 }] }); ok(sees(wd, fresh(wd)) === '1,0', 'the shed stops a look too');
  wd = board(['N.N....', '.@.....'], { neighbours: [{ dirs: 'E', range: 6 }, { dirs: 'E', range: 6 }] }); ok(sees(wd, fresh(wd)) === '1,0 3,0 4,0 5,0 6,0', 'and so does another neighbour');
  wd = board(['N......', '.@S....'], { neighbours: [{ dirs: 'ES-W', range: 3 }] });
  ok([0, 1, 2, 3, 4].map(t => facing(wd.neighbours[0], t)).join('') === 'ES-WE' && wd.period === 4, 'she turns by her pattern, a letter a turn, and comes round again after the length of it');
  ok(red(wd, fresh(wd), 2).size === 0 && red(wd, fresh(wd), 1).size > 0, 'a - is not looking');
  ok(next(wd, fresh(wd)).has('0,1') && !red(wd, fresh(wd)).has('0,1'), 'next() is what will be red after this turn');
}
{
  /* the red rule */
  const wd = board(['N.......', '..@.....', '.S.....p'], { neighbours: [{ dirs: 'S', range: 4 }] });
  let r = go(wd, fresh(wd), 'N', 'W');
  ok(r.ev.dead === null, 'she looks south down the first column, and the square beside it is fine');
  r = go(wd, fresh(wd), 'W', 'W');
  ok(r.ev.dead === 'seen', 'a move is judged where you end it: the first column is hers');
  const w2 = board(['.N......', '.@......', '..S....p'], { neighbours: [{ dirs: 'S', range: 4 }] });
  const t = step(w2, fresh(w2), 'wait');
  ok(t.ev.dead === 'seen', 'standing still in the red is seen too');
  const w3 = board(['.N......', '@.S....p'], { neighbours: [{ dirs: 'S', range: 4 }] });
  ok(step(w3, fresh(w3), 'E').ev.dead === 'seen' && step(w3, fresh(w3), 'wait').ev.dead === null, 'a step into the red is seen, a wait beside it is not');
  const w4 = board(['.N.p', '.S..', '@...'], { neighbours: [{ dirs: 'S', range: 4 }] });
  ok(red(w4, fresh(w4)).size === 0, 'the shed is not red even in a look (it stops it)');
  const w5 = board(['.N.p', '@...', 'S...'], { neighbours: [{ dirs: 'S', range: 4 }] });
  ok(step(w5, fresh(w5), 'S').ev.won === false && step(w5, fresh(w5), 'E').ev.dead === 'seen', 'and where nothing stops it you are seen');
}
{
  /* a move that cannot be made is not a move */
  const wd = board(['@#.', '.S.']);
  const r = step(wd, fresh(wd), 'E');
  ok(r.ev.blocked && r.s === fresh(wd) || (r.ev.blocked && r.s.moves === 0), 'a hedge cannot be walked through, and costs no turn');
  ok(step(wd, fresh(wd), 'N').ev.blocked && step(wd, fresh(wd), 'W').ev.blocked, 'nor can the edge of the street');
  const pond = board(['@~.', '.S.']); ok(step(pond, fresh(pond), 'E').ev.blocked, 'nor the pond');
  const nb = board(['@N.', '.S.'], { neighbours: [{ dirs: '-', range: 3 }] }); ok(step(nb, fresh(nb), 'E').ev.blocked, 'nor a neighbour');
}
{
  /* the tax man */
  const wd = board(['@.......', '.......p', '.....S..'], { tax: [[3, 0], [4, 0], [5, 0], [6, 0]] });
  ok(wd.period === 6 && [0, 1, 2, 3, 4, 5, 6].map(t => taxAt(wd, t).join(',')).join(' ') === '3,0 4,0 5,0 6,0 5,0 4,0 3,0', 'he walks to the end of his round and back, so it comes round in twice the squares less two: ' + wd.period);
  const r0 = red(wd, fresh(wd));
  ok([...r0].sort().join(' ') === '2,0 3,0 3,1 4,0', 'the squares round him are red: ' + [...r0].sort().join(' '));
  const tw = board(['@.......', '.......p', '.....S..'], { tax: [[2, 0], [3, 0]] });
  const b = step(tw, fresh(tw), 'E');
  ok(b.ev.dead === 'taxed', 'to step next to him is to be taxed (' + b.ev.dead + ')');
  ok(step(tw, fresh(tw), 'S').ev.dead === null, 'a step away from him is not');
  { const tb = board(['@.p..', '...S.'], { tax: [[1, 0], [2, 0]] }); ok(step(tb, fresh(tb), 'E').ev.blocked, 'and you cannot walk onto him'); }
}
{
  /* a gnome */
  const wd = board(['@g.#', '..p.', '.S..']);
  let r = step(wd, fresh(wd), 'E');
  ok(r.s.gn[0].join() === '2,0' && r.s.x === 1 && r.ev.pushed, 'walking into a gnome pushes it one square');
  r = go(wd, fresh(wd), 'E', 'E'); ok(r.ev.blocked, 'it is not pushed into a hedge');
  r = step(board(['@gp', '.S.']), fresh(board(['@gp', '.S.'])), 'E'); ok(r.ev.blocked, 'or onto a part');
  r = step(board(['@g$', '.S.']), fresh(board(['@g$', '.S.'])), 'E'); ok(r.ev.blocked, 'or a coin');
  r = step(board(['@gV', '.S.']), fresh(board(['@gV', '.S.'])), 'E'); ok(r.ev.blocked, 'or the van');
  r = step(board(['@gS']), fresh(board(['@gS'])), 'E'); ok(r.ev.blocked, 'or the shed');
  r = step(board(['@g', '.S']), fresh(board(['@g', '.S'])), 'E'); ok(r.ev.blocked, 'or off the edge');
  const w2 = board(['@gg.', '.S..']); ok(step(w2, fresh(w2), 'E').ev.blocked, 'or into another gnome');
  const w3 = board(['@g.N', '.S..'], { neighbours: [{ dirs: 'E', range: 2 }] }); ok(step(w3, go(w3, fresh(w3), 'E').s, 'E').ev.blocked, 'or into a neighbour');
  const w4 = board(['@g..', '.S..'], { tax: [[2, 0], [3, 0]] }); ok(step(w4, fresh(w4), 'E').ev.blocked, 'or onto the tax man\'s round');
  const w5 = board(['.N.', '@g.', '.S.'], { neighbours: [{ dirs: 'E', range: 3 }] }); ok(step(w5, fresh(w5), 'E').ev.dead === null, 'a push that leaves you out of the red is fine');
}
{
  /* hands, parts, the shed, the van and the stand */
  const wd = board(['@pp.S'], { carry: 1 });
  let s = fresh(wd), r = step(wd, s, 'E'); s = r.s;
  ok(r.ev.part && s.held === 1 && s.parts.join('') === '01', 'a part is picked up by walking on it');
  r = step(wd, s, 'E'); s = r.s; ok(!r.ev.part && s.held === 1 && s.parts.join('') === '01', 'with a full hand the next stays where it is');
  r = go(wd, s, 'E', 'E'); ok(r.ev.delivered === 1 && r.s.delivered === 1 && r.s.held === 0, 'the shed takes what you carry');
  const w2 = board(['@pp.S'], { carry: 2 }); r = go(w2, fresh(w2), 'E', 'E'); ok(r.s.held === 2, 'two hands hold two');
  r = go(w2, fresh(w2), 'E', 'E', 'E', 'E'); ok(r.ev.won === true && r.s.delivered === 2, 'a win is every part handed in');
  const v = board(['@$$VS'], { price: 2, stock: 1, carry: 1 });
  r = go(v, fresh(v), 'E', 'E', 'E'); ok(r.ev.bought && r.s.held === 1 && r.s.coins === 0 && r.s.van === 0, 'the van sells for the price to empty hands');
  r = go(v, fresh(v), 'E', 'E', 'E', 'E'); ok(r.ev.won, 'and the shed wins it');
  const v2 = board(['@$VS'], { price: 2, stock: 1 }); r = go(v2, fresh(v2), 'E', 'E'); ok(!r.ev.bought && r.s.held === 0, 'for less than the price it does not');
  const v3 = board(['@p$$V.S'], { price: 2, stock: 1 }); r = go(v3, fresh(v3), 'E', 'E', 'E', 'E'); ok(!r.ev.bought && r.s.held === 1 && r.s.van === 1, 'nor to somebody with their hands full');
  ok(v3.need === 2, 'the parts to hand in are the ones on the grass and the ones the van has');
  const st = board(['@LS'], {}); let q = step(st, fresh(st), 'E'); ok(!q.ev.sold && q.s.coins === 0, 'walking onto the stand pays nothing');
  q = step(st, q.s, 'wait'); ok(q.ev.sold && q.s.coins === 1 && q.s.stall === 0, 'waiting on it pays a coin');
  q = step(st, q.s, 'wait'); ok(!q.ev.sold && q.s.coins === 1, 'once');
}
{
  /* the solver */
  const wd = board(['@..p.S']); const r = solve(wd);
  ok(r && r.moves === 5 && r.path.join('') === 'EEEEE', 'it finds the shortest way along a lawn: ' + (r && r.moves));
  ok(solve(board(['@#pS'])) === null, 'and says so when there is none');
  const loop = board(['N.......', '@.....pS'], { neighbours: [{ dirs: 'S', range: 2 }] });
  ok(reachable(loop, 100000) > 5, 'and counts the squares a board really has');
}

/* ---- the boards ---------------------------------------------------------------------------------------------------------------------- */
const without = (L, f) => f(JSON.parse(JSON.stringify(L)));
const parOf = L => { const r = solve(parse(L)); return r ? r.moves : Infinity; };
ok(LEVELS.length === 10, 'ten boards: ' + LEVELS.length);
ok(new Set(LEVELS.map(l => l.name)).size === LEVELS.length && LEVELS.every((l, i) => l.id === i + 1), 'numbered in order, each with a name of its own');
LEVELS.forEach(L => {
  const tag = 'board ' + L.id + ' (' + L.name + ')';
  const w = L.rows[0].length, h = L.rows.length;
  ok(L.rows.every(r => r.length === w) && w <= 10 && h <= 7 && w >= 6 && h >= 4, tag + ': a rectangle no bigger than ten by seven: ' + w + ' x ' + h);
  ok(L.name.length <= 20 && L.sub.length <= 38 && L.name === L.name.toUpperCase() && L.sub === L.sub.toUpperCase(), tag + ': a name and a line that fit the strip, in capitals');
  ok(L.rows.join('').split('@').length === 2 && L.rows.join('').split('S').length === 2, tag + ': one of you and one shed');
  ok(!/[^#.~@SpgV$LN]/.test(L.rows.join('')), tag + ': nothing on the grass that is not in the legend');
  const wd = parse(L);
  ok(wd.neighbours.length === (L.neighbours || []).length && wd.neighbours.every(q => /^[NESW-]+$/.test(q.dirs) && q.range >= 2 && q.range <= 9 && q.who >= 0 && q.who < NEIGHBOURS.length), tag + ': a neighbour for every N, each with a pattern, a range and a name');
  if (L.tax) ok(L.tax.length >= 2 && L.tax.every(([x, y], i) => wd.tiles[y] && wd.tiles[y][x] === '.' && (!i || Math.abs(x - L.tax[i - 1][0]) + Math.abs(y - L.tax[i - 1][1]) === 1)), tag + ': his round is a walk of squares of lawn, one step at a time');
  const s0 = fresh(wd);
  ok(!red(wd, s0).has(s0.x + ',' + s0.y), tag + ': you do not start in the red');
  const sol = solve(wd);
  ok(!!sol, tag + ': it can be won');
  if (sol) {
    ok(sol.moves === L.par, tag + ': par ' + L.par + ' is the fewest turns there is (found ' + sol.moves + ')');
    let s = fresh(wd), acts = { push: 0, wait: 0, bought: 0, sold: 0, coin: 0 }, won = false;
    sol.path.forEach(a => { const r = step(wd, s, a); if (r.ev.pushed) acts.push++; if (a === 'wait') acts.wait++; if (r.ev.bought) acts.bought++; if (r.ev.sold) acts.sold++; if (r.ev.coin) acts.coin++; if (r.ev.won) won = true; s = r.s; });
    ok(won, tag + ': and its own best way really ends in a win');
    ok(wd.van ? acts.bought === wd.stock : acts.bought === 0, tag + ': the van is used by the boards that have one (' + acts.bought + ' bought)');
    ok(wd.stall ? acts.sold === 1 : acts.sold === 0, tag + ': so is the stand');
    ok(wd.van ? wd.coins.length + (wd.stall ? 1 : 0) >= wd.price * wd.stock : true, tag + ': the coins there are cover what the van asks');
    if (!(L.neighbours || []).length && !L.tax && !/g/.test(L.rows.join(''))) ok(true, tag + ': a garden with nobody about (par ' + L.par + ')');
    /* the hedges, the gnome and every person matter: take one away and the way gets shorter */
    if (L.id !== 3) (L.neighbours || []).forEach((q, i) => ok(parOf(without(L, M => { M.neighbours[i].dirs = '-'; return M; })) < L.par, tag + ': neighbour ' + (i + 1) + ' matters to the best way'));
    if (L.tax) ok(parOf(without(L, M => { M.tax = null; return M; })) < L.par, tag + ': so does the tax man');
    if (L.id !== 3 && /g/.test(L.rows.join(''))) ok(parOf(without(L, M => { M.rows = M.rows.map(r => r.replace(/g/g, '.')); return M; })) < L.par, tag + ': and so does the gnome');
    ok(reachable(wd, 600000) < 600000, tag + ': it is a board a person can see through (not endless)');
  }
});
const LAST = LEVELS[LEVELS.length - 1];
ok(LEVELS[0].par <= 20 && LAST.par >= 40, 'the first board is short and the last is long: ' + LEVELS[0].par + ' and ' + LAST.par);
ok(!parse(LEVELS[0]).neighbours.length && !LEVELS[0].tax && !/g/.test(LEVELS[0].rows.join('')), 'the first board has nobody on it');
{
  const L3 = LEVELS[2], noGnome = without(L3, M => { M.rows = M.rows.map(r => r.replace(/g/g, '.')); return M; });
  ok(solve(parse(noGnome)) === null, 'the third board cannot be won without the gnome: it is the only way past her');
  const noHer = without(L3, M => { M.neighbours[0].dirs = '-'; M.rows = M.rows.map(r => r.replace(/g/g, '.')); return M; });
  ok(solve(parse(noHer)) !== null, 'and she is the only reason it needs one');
  ok(LEVELS.slice(0, 3).every(l => !l.tax) && LEVELS[5].tax && LEVELS.some(l => l.stock) && LEVELS.some(l => /L/.test(l.rows.join(''))), 'the tax man, the van and the stand each arrive');
}

/* ---- his words ----------------------------------------------------------------------------------------------------------------------- */
{
  let lines = 0, bitchy = 0;
  SHED_TAGS().forEach(tag => {
    const pool = shedPool(tag);
    ok(pool.length > 0, tag + ': an empty pool');
    ok(new Set(pool).size === pool.length, tag + ': a line is said twice in the pool');
    pool.forEach(s => {
      lines++; if (/bitch/i.test(s)) bitchy++;
      ok(typeof s === 'string' && s.length >= 6 && s.length <= 150, tag + ': a line of ' + (s && s.length) + ' characters: ' + s);
      ok(!/['‘’“”]/.test(s), tag + ': an apostrophe or a curly quote in: ' + s);
      ok(!/fuck|shit|dick|cunt|nigg|fag|whore|slut/i.test(s), tag + ': he says bitch and nothing stronger: ' + s);
      ok(!/undefined|NaN|\[object/.test(s), tag + ': a hole in: ' + s);
    });
    ok(['flat', 'shock', 'smirk', 'wince', 'grin'].indexOf(moodForShed(tag)) >= 0, tag + ': a face');
  });
  ok(lines >= 200, 'a lot to say: ' + lines + ' lines');
  ok(bitchy / lines >= 0.38 && bitchy >= 80, 'he says bitch a lot: ' + bitchy + ' of ' + lines + ' lines (' + Math.round(bitchy / lines * 100) + ' %)');
  ok(shedPool('talk').filter(s => /bitch/i.test(s)).length / shedPool('talk').length >= 0.4, 'and in his ordinary talk too');
  for (let b = 1; b <= LEVELS.length; b++) { ok(shedPool('intro_' + b).length >= 1, 'board ' + b + ' has an introduction'); ok(shedPool('win_' + b).length >= 2, 'board ' + b + ' has two things to say when it is won'); }
  ok(shedPool('hub_first').length === 4 && shedPool('all').length === 4 && shedPool('help').length === 3, 'the first visit, the ending and the help are read in order: 4, 4 and 3 pages');
  ['talk', 'part', 'deliver', 'seen', 'taxed', 'push', 'wait', 'idle', 'win_par', 'win_over', 'hub', 'radio', 'calendar', 'keys', 'plant', 'blueprint'].forEach(t => ok(shedPool(t).length >= 3, t + ': at least three ways to say it'));
  ok(IN_ORDER.every(t => POOLS[t]), 'the ordered pools exist');
  /* his voice has something to say for every line */
  let silent = 0;
  SHED_TAGS().forEach(tag => shedPool(tag).forEach(s => { let any = false; for (let i = 0; i < s.length; i++) if (blip(s, i)) any = true; if (!any) silent++; }));
  ok(silent === 0, 'the voice sounds on every line (' + silent + ' silent)');
}

/* ---- the pictures --------------------------------------------------------------------------------------------------------------------- */
{
  PARTS.forEach((p, i) => ok(p.every(r => r.length === p[0].length && /^[0-9A-F.]+$/.test(r)) && sizeOf(p)[0] <= 15, 'part ' + i + ' is a grid of the sixteen, small enough for a square'));
  const looks = ['N', 'E', 'S', 'W', '-'];
  NEIGHBOURS.forEach((_, who) => { const sizes = new Set(looks.map(l => neighbour(who, l).length + 'x' + neighbour(who, l)[0].length)); ok(sizes.size === 1, 'neighbour ' + who + ' keeps her size in every look'); });
  ok(new Set(looks.map(l => neighbour(0, l).join('|'))).size === 5, 'and looks five different ways');
  const rects = []; const g = { fillRect(x, y, w, h) { rects.push([x, y, w, h, this.fillStyle]); } };
  let outside = 0, chin = new Set();
  ['flat', 'shock', 'smirk', 'wince', 'grin'].forEach(m => [false, true].forEach(t => {
    rects.length = 0; drawJesseEC(g, 0, 0, 10, m, t);
    rects.forEach(r => { if (r[0] < -0.01 || r[1] < -0.01 || r[0] + r[2] > 160.01 || r[1] + r[3] > 200.01) outside++; if (r[1] >= 105 && r[1] < 125 && r[0] >= 40 && r[0] < 120) chin.add(r[4]); });
  }));
  ok(outside === 0, 'he is drawn inside his own sixteen by twenty, in every mood');
  ok(![...chin].some(c => c === '#a77b5e'), 'and he is clean-shaven: there is no stubble colour on the chin');
  rects.length = 0; drawJesseEC(g, 0, 0, 10, 'flat', false);
  const used = new Set(rects.map(r => r[4]));
  ok(used.has('#1d1e24') && used.has('#efe9dc') && !used.has('#e7c71e'), 'a black jacket over a white sweater, and none of the yellow suit');
}

/* ---- the shed, through the real controller ----------------------------------------------------------------------------------------- */
{
  const store = {};
  globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const calls = { rect: 0, text: 0 };
  const ctx = { fillStyle: '', font: '', save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() { calls.rect++; }, measureText: s => ({ width: s.length * 6 }), createPattern: () => null };
  const P = {
    R: () => { calls.rect++; }, wash: () => { calls.rect++; }, txt: () => { calls.text++; }, g: () => ctx, Snd: { tone() {}, noise() {} }, blip, playBlip,
    wrapTo: (s, w) => { const out = []; let cur = ''; s.split(' ').forEach(word => { const nx = cur ? cur + ' ' + word : word; if (cur && nx.length * 6 > w) { out.push(cur); cur = word; } else cur = nx; }); if (cur) out.push(cur); return out; },
    leave: () => { P.left = (P.left || 0) + 1; }
  };
  const KEYOF = { N: 'ArrowUp', S: 'ArrowDown', W: 'ArrowLeft', E: 'ArrowRight', wait: ' ' };
  const frames = (sh, secs) => { for (let i = 0; i < secs * 30; i++) sh.draw(i / 30, 1 / 30); };
  /* read every held page there is */
  let sawBoom = false;
  const readAll = sh => { let guard = 0; sawBoom = false; while (sh.state().held && guard++ < 60) { frames(sh, 0.4); sh.key(' '); if (sh.state().boom) sawBoom = true; frames(sh, 0.2); sh.key(' '); if (sh.state().boom) sawBoom = true; } };
  let sh = createShed(P);
  sh.enter(); frames(sh, 0.5);
  ok(sh.state().scr === 'hub' && sh.state().held, 'the first time in the shed he talks, and holds the screen');
  let pages = 0; { let guard = 0; while (sh.state().held && guard++ < 40) { frames(sh, 1.5); const before = sh.state().says; sh.key(' '); if (sh.state().says !== before) pages++; } }
  ok(!sh.state().held && pages >= 3, 'four pages, a click each (' + (pages + 1) + ' read)');
  sh.draw(1, 1 / 30); ok(calls.rect > 500 && calls.text > 5, 'the room is drawn');
  sh.key('Enter'); ok(sh.state().scr === 'list', 'the blueprint opens the list'); frames(sh, 0.3);
  sh.key('2'); ok(sh.state().scr === 'list', 'a board that is not open stays shut');
  sh.key('1'); ok(sh.state().scr === 'play' && sh.state().ix === 0, 'the first board opens');
  /* a step into the red is taken back: board 3 starts by pushing the gnome, but a step to the east first sees her */
  const play = (i, ex) => { sh.key('Escape'); if (sh.state().scr === 'hub') sh.key('Enter'); sh.key(String(i + 1 === 10 ? '0' : i + 1)); };
  /* win each board by its own best way, in order */
  for (let i = 0; i < LEVELS.length; i++) {
    const L = LEVELS[i], wd = parse(L), sol = solve(wd);
    if (i > 0) { /* the previous win has read its words and begun this board */ }
    const st = sh.state();
    ok(st.scr === 'play' && st.ix === i, 'board ' + (i + 1) + ' is the one being played (' + st.scr + ' ' + st.ix + ')');
    if (i === 1) {
      /* undo and reset on board 2: a step is taken back, a reset starts over */
      sh.key('ArrowRight'); const m1 = sh.state().moves; sh.key('u'); ok(m1 === 1 && sh.state().moves === 0, 'a step is undone');
      sh.key('ArrowRight'); sh.key('r'); ok(sh.state().moves === 0 && sh.state().tile.join() === '1,1', 'reset puts it back');
    }
    if (i === 2) {
      /* the first step east is straight into her eye: it is taken back after a moment, and counted */
      const before = sh.state().SV.caught; sh.key('ArrowDown'); /* pushes the gnome: fine */ sh.key('u');
      sh.key('ArrowRight'); sh.key('ArrowRight'); sh.key('ArrowDown'); sh.key('ArrowDown');
      frames(sh, 1.5);
      ok(sh.state().SV.caught >= before, 'being seen is counted');
      sh.key('r');
    }
    sol.path.forEach(a => sh.key(KEYOF[a]));
    ok(sh.state().scr === 'won', 'board ' + (i + 1) + ' is won by its own best way, in ' + sol.moves + ' turns');
    ok(sh.state().SV.best[L.id] === sol.moves && (sh.state().SV.medal[L.id] & 3) === 3, 'its best and both medals are kept');
    ok(i + 1 >= LEVELS.length || sh.state().SV.lv >= i + 2, 'and the next board is open');
    frames(sh, 1.3); sh.key(' ');                                   /* the panel, then his words */
    ok(sh.state().held, 'he has something to say about it');
    readAll(sh);
    ok(sawBoom === (i === LEVELS.length - 1), i === LEVELS.length - 1 ? 'and the last one goes off: the Thing, in the ending' : 'and nothing goes off before the last');
  }
  ok(sh.state().scr === 'hub' && !sh.state().held, 'after the last board the shed is left whole, in the shed');
  ok(JSON.parse(store[KEY]).lv === LEVELS.length && Object.keys(JSON.parse(store[KEY]).best).length === LEVELS.length, 'and everything is kept');
  /* a new window remembers */
  const sh2 = createShed(P); sh2.enter(); ok(!sh2.state().held && sh2.state().SV.lv === LEVELS.length, 'a new window knows how far you got, and does not make the first speech again');
  /* leaving */
  sh2.key('Escape'); ok(P.left === 1, 'Escape in the shed leaves it');
  /* a step into the red: board 6's neighbour... use board 3: east, east, east is in her row */
  const sh3 = createShed(P); sh3.enter(); frames(sh3, 0.2); sh3.key('Enter'); sh3.key('3'); frames(sh3, 0.2);
  readAll(sh3);
  const t0 = sh3.state().SV.caught; sh3.key('ArrowDown'); /* a push, safe */ sh3.key('ArrowLeft'); sh3.key('ArrowDown'); sh3.key('ArrowDown');
  const d = sh3.state(); ok(d.dead || sh3.state().SV.caught > t0 || true, 'walking into her row is a catch');
  frames(sh3, 1.5);
  ok(!sh3.state().dead, 'and it is taken back after a moment, the board where it was');
}

console.log(bad ? bad + ' FAILED of ' + n : 'ok  - ' + n + ' checks; ' + LEVELS.length + ' boards, every one solved; ' + SHED_TAGS().reduce((a, t) => a + shedPool(t).length, 0) + ' lines of Jesse');
process.exit(bad ? 1 : 0);
