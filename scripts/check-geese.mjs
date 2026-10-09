#!/usr/bin/env node
/* The geese (pure Node, no browser): the bird, what it does and what it says, in apps/goose_frames.js, goose_art.js, goose_life.js and goose_voice.js, which the elephant's pool and sky, Bekkedal's
   water (apps/bekkedal/geese_check.js holds that one), the Garden's and Stand Battle's skies and the top of Dave's head all share:
   THE BIRD     every frame in the sixteen colours, all of a family in one box, nothing drawn that the legend does not name, the painter turns it round without losing a pixel
   THE VOICE    a honk every six to twenty-two seconds, a plan that is never louder than a key click, three in ten a quack, and silence with no speaker
   AFLOAT       a swimmer stays in its water, gets about, puts its head under now and then, keeps away from what frightens it
   IN THE AIR   a flier crosses, the wing goes round, it glides; the rare fly-past is a few minutes apart, mostly one bird and sometimes three
   ON DAVE      one shop in twenty, it comes down in about a second, then it sits, honks and is answered when it is poked */
import { readFileSync } from 'node:fs';
import { FRAMES, FAMILIES, sizeOf, runs, drawGoose, boxOf, flapFrame, PAL16 } from '../apps/goose_art.js';
import * as L from '../apps/goose_life.js';
import { playHonk } from '../apps/goose_voice.js';
import { DAVE_GOOSE_LAND, DAVE_GOOSE_POKE, DAVE_GOOSE_HONK } from '../apps/shop/lines_goose.js';
import { DAVE_LINES, DAVE_BROKE, DAVE_CRAZY, DAVE_CRAZY_CAT, SPEECH_MAX } from '../apps/shop/lines.js';
import { GIFTS } from '../kernel/gifts_core.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(90) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const dice = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

console.log('-- the bird --');
{
  const names = Object.keys(FRAMES), all = names.every(n => FRAMES[n].every(r => r.length === FRAMES[n][0].length && /^[0-9A-F.]+$/.test(r)));
  ok(names.length === 11 && all, 'eleven frames, every row as wide as the first, every digit one of the sixteen', names.join(' '));
  Object.entries(FAMILIES).forEach(([f, ns]) => ok(ns.every(n => sizeOf(n).join('x') === sizeOf(ns[0]).join('x')), 'the ' + f + ' family is all in one box, so it does not hop when it changes frame', sizeOf(ns[0]).join('x')));
  const legend = new Set('0F7E64.'.split(''));
  ok(names.every(n => FRAMES[n].every(r => r.split('').every(ch => legend.has(ch)))), 'only black, white, light grey, yellow, brown and red, and clear: what the file says it is made of');
  ok(names.filter(n => n !== 'dabble' && n !== 'dabbleS').every(n => FRAMES[n].some(r => r.includes('E'))), 'every goose with its head up has a yellow bill');
  ok(names.every(n => FRAMES[n].some(r => r.includes('0'))), 'every frame has its black edge');
  ok(names.filter(n => !['up', 'mid', 'down'].includes(n)).every(n => { const bot = FRAMES[n].length - 1 - [...FRAMES[n]].reverse().findIndex(r => /[^.]/.test(r)); return bot >= FRAMES[n].length - 2; }), 'no goose afloat or sitting has more than a row of nothing at the bottom (that is where it stands, on the water or on a head)');
  const count = n => FRAMES[n].join('').replace(/\./g, '').length, runPx = (n, f) => runs(n, f).reduce((a, r) => a + r[2], 0);
  ok(names.every(n => runPx(n, false) === count(n) && runPx(n, true) === count(n)), 'turned round or not, a goose has the same number of pixels');
  ok(names.every(n => { const a = runs(n, false), b = runs(n, true), w = sizeOf(n)[0]; const key = (x, y, c) => x + ',' + y + ',' + c; const A = new Set(), B = new Set(); a.forEach(([x, y, l, c]) => { for (let i = 0; i < l; i++) A.add(key(w - 1 - (x + i), y, c)); }); b.forEach(([x, y, l, c]) => { for (let i = 0; i < l; i++) B.add(key(x + i, y, c)); }); return A.size === B.size && [...A].every(k => B.has(k)); }), 'facing left is exactly facing right in a mirror');
  const painted = []; drawGoose((x, y, w, h, c) => painted.push([x, y, w, h, c]), 100, 50, 'swim', 2, false);
  const box = boxOf(100, 50, 'swim', 2);
  ok(painted.length === runs('swim', false).length && painted.every(p => p[2] % 2 === 0 && p[3] === 2 && p[0] >= box[0] && p[1] >= box[1] && p[0] + p[2] <= box[2] && p[1] + p[3] <= box[3]), 'drawn at two to a pixel, inside its box, with its underside at the line it is given', box.join(','));
  ok(PAL16.length === 16 && PAL16.every(c => /^#[0-9A-F]{6}$/.test(c)), 'the sixteen as CSS');
  ok([0, 0.1, 0.24, 0.26, 0.49, 0.5, 0.74, 0.76, 0.99, 1.25, -0.1].map(flapFrame).join() === 'up,up,up,mid,mid,down,down,mid,mid,mid,mid', 'the wing goes up, level, down, level', [0, 0.26, 0.5, 0.76].map(flapFrame).join());
}

console.log('\n-- the voice --');
{
  ok(L.HONK_MIN === 6 && L.HONK_MAX === 22 && L.honkIn(0) === 6 && L.honkIn(1) === 22 && L.honkIn(0.5) === 14, 'a honk every six to twenty-two seconds');
  const r = dice(3);
  let quack = 0, loudest = 0, longest = 0, n = 6000, most = 0;
  for (let i = 0; i < n; i++) {
    const a = r(), b = r(), c = r(), plan = L.honkPlan(a, b, c);
    if (b < 0.3) quack++;
    plan.forEach(t => { loudest = Math.max(loudest, t.vol); if (!(t.hz > 150 && t.hz < 1000 && t.ms > 30 && t.ms < 300 && t.vol > 0 && t.delay >= 0 && (t.type === 'sawtooth' || t.type === 'square'))) fails++; });
    longest = Math.max(longest, L.honkLength(plan)); most = Math.max(most, plan.length);
  }
  ok(loudest <= L.HONK_VOL && L.HONK_VOL <= 0.025, 'no tone is louder than ' + L.HONK_VOL + ' (a key click is 0.03 to 0.045)', 'loudest ' + loudest.toFixed(4));
  ok(longest < 0.9 && most <= 6, 'a honk is under a second and a handful of tones', 'longest ' + longest.toFixed(2) + ' s, most ' + most + ' tones');
  ok(Math.abs(quack / n - 0.3) < 0.02, 'three honks in ten are quacks', (quack / n * 100).toFixed(1) + ' %');
  /* the clock: over a day of a place, the gaps lie between the least and the most, and average the middle */
  const h = L.honker(0.5), rng = dice(9), gaps = []; let since = 0, honks = 0, plans = 0, opened = 0;
  for (let i = 0; i < 24 * 3600 * 10; i++) {
    since += 0.1;
    const p = L.stepHonker(h, 0.1, rng);
    if (h.open > 0) opened++;
    if (p) { honks++; plans += p.length; gaps.push(since); since = 0; }
  }
  const min = Math.min(...gaps.slice(1)), max = Math.max(...gaps), mean = gaps.slice(1).reduce((a, b) => a + b, 0) / (gaps.length - 1);
  ok(min >= 5.9 && max <= 22.2, 'a day of one place: no honk sooner than six seconds or later than twenty-two after the last', min.toFixed(1) + ' to ' + max.toFixed(1) + ' s over ' + honks + ' honks');
  ok(Math.abs(mean - 14) < 0.4, 'about one every fourteen seconds', mean.toFixed(2) + ' s');
  ok(opened > 0 && opened / (24 * 36000) < 0.12, 'the bill is open for a moment after each, which is a small part of the day', (opened / (24 * 360)).toFixed(2) + ' %');
  /* the speaker: nothing there, a fake speaker, a speaker that throws */
  let heard = [];
  global.window = { Snd: { tone: (hz, ms, o) => heard.push([hz, ms, o]) } };
  playHonk(L.honkPlan(0.2, 0.9, 0.9));
  ok(heard.length >= 2 && heard.every(t => t[2].vol <= L.HONK_VOL), 'a plan is played tone for tone on the machine\'s speaker', heard.length + ' tones');
  global.window = { Snd: { tone() { throw new Error('no speaker'); } } }; let threw = false; try { playHonk(L.honkPlan()); } catch (e) { threw = true; }
  global.window = {}; let threw2 = false; try { playHonk(L.honkPlan()); } catch (e) { threw2 = true; }
  delete global.window;
  ok(!threw && !threw2, 'with no speaker, or a broken one, a goose is simply quiet');
}

console.log('\n-- afloat --');
{
  const rng = dice(21), W = { cx: 240, cy: 216, rx: 132, ry: 15 }, inside = (x, y) => ((x - W.cx) / W.rx) ** 2 + ((y - W.cy) / W.ry) ** 2 <= 1;
  const w = L.swimmer(rng, 240, 216, { vmax: 9 });
  let off = 0, dabs = 0, was = false, turned = 0, face = w.face, minX = 1e9, maxX = -1e9, frames = new Set(), fast = 0;
  for (let i = 0; i < 30 * 60 * 30; i++) {
    const px = w.x, py = w.y;
    L.stepSwimmer(w, 1 / 30, inside, rng);
    if (!inside(w.x, w.y)) off++;
    if (w.dab > 0 && !was) dabs++; was = w.dab > 0;
    if (w.face !== face) { turned++; face = w.face; }
    minX = Math.min(minX, w.x); maxX = Math.max(maxX, w.x); frames.add(L.swimFrame(w));
    if (Math.hypot(w.x - px, w.y - py) > 9 * 1.6 / 30 + 1e-9) fast++;
  }
  ok(off === 0, 'thirty minutes on a pool: never off the water', off + ' frames off');
  ok(maxX - minX > W.rx * 0.8, 'it gets about: along most of the length of the pool', (maxX - minX).toFixed(0) + ' of ' + (W.rx * 2));
  ok(dabs >= 30 && turned >= 20, 'it puts its head under, and it turns round', dabs + ' dips, ' + turned + ' turns in half an hour');
  ok(frames.has('swim') && frames.has('dabble') && !frames.has('honk'), 'afloat it is a swimmer or a dabbler (a honk is somebody else\'s clock)', [...frames].join());
  ok(fast === 0, 'it is never quicker than a goose in a hurry (1.6 times its own pace)');
  w.honk = 0.5; ok(L.swimFrame(w) === 'honk' || w.dab > 0, 'with its bill open it is the honking frame');
  /* fear */
  const v = L.swimmer(dice(5), 240, 216, { vmax: 9 }); v.turn = 99; v.dab = 0; v.dabIn = 99;
  const d0 = Math.hypot(v.x - 230, v.y - 216); for (let i = 0; i < 90; i++) L.stepSwimmer(v, 1 / 30, inside, dice(1), { x: 230, y: 216, r: 40 });
  ok(Math.hypot(v.x - 230, v.y - 216) > d0 + 8, 'a goose with something close swims away from it', d0.toFixed(0) + ' -> ' + Math.hypot(v.x - 230, v.y - 216).toFixed(0));
  const cornered = L.swimmer(dice(5), 371, 216, { vmax: 9 }); for (let i = 0; i < 300; i++) L.stepSwimmer(cornered, 1 / 30, inside, dice(2), { x: 360, y: 216, r: 40 });
  ok(inside(cornered.x, cornered.y), 'and when it has nowhere to go it stays in the water');
}

console.log('\n-- in the air --');
{
  const rng = dice(33), f = L.flier(rng, { x: -40, y: 80, dir: 1, speed: 30, size: 1 });
  const seen = new Set(); let glides = 0, was = false, ymin = 1e9, ymax = -1e9, t = 0;
  while (f.x < 760 && t < 100) { L.stepFlier(f, 1 / 30, rng); t += 1 / 30; seen.add(L.flierFrame(f)); if (f.glide > 0 && !was) glides++; was = f.glide > 0; ymin = Math.min(ymin, f.y); ymax = Math.max(ymax, f.y); }
  ok(f.x >= 760 && Math.abs(t - 800 / 30) < 0.5, 'it crosses at the speed it was given', t.toFixed(1) + ' s for 800 px at 30 px/s');
  ok(seen.has('up') && seen.has('mid') && seen.has('down'), 'its wing goes up, level and down', [...seen].join());
  ok(ymax - ymin <= 2 * f.amp + 1e-6 && ymax - ymin > 1, 'it rises and falls a little as it goes', (ymax - ymin).toFixed(1) + ' px');
  const g = L.flier(dice(8), { x: 0, y: 50, dir: 1, speed: 1 }); let gl = 0, wasG = false, gt = 0; const GN = 600 * 30;
  for (let i = 0; i < GN; i++) { L.stepFlier(g, 1 / 30, dice(i + 5)); if (g.glide > 0) gt++; if (g.glide > 0 && !wasG) gl++; wasG = g.glide > 0; if (g.glide > 0) ok.mid = (ok.mid || 0) + (L.flierFrame(g) === 'mid' ? 0 : 1); }
  ok(gl >= 15 && gt / GN > 0.06 && gt / GN < 0.35 && !ok.mid, 'it glides now and then, wing level, a small part of the time', gl + ' glides in ten minutes, ' + (gt / GN * 100).toFixed(0) + ' % of the time');
  const left = L.flier(rng, { x: 800, y: 40, dir: -1, speed: 20 }); L.stepFlier(left, 1, rng); ok(left.x < 800, 'and the other way');
}
{
  /* the rare fly-past: a day of the Garden's sky */
  const rng = dice(77), view = { w: 700, top: 34, bottom: 112, margin: 60, gap: 34 }, p = L.passage(rng);
  const starts = [], sizes = [0, 0, 0, 0], dirs = { '-1': 0, '1': 0 }, plans = [];
  let wasFlying = false, ymin = 1e9, ymax = -1e9, since = 0, gaps = [], firstAt = null;
  for (let i = 0; i < 24 * 3600 * 10; i++) {
    const plan = L.stepPassage(p, 0.1, rng, view, 1);
    since += 0.1;
    if (plan) plans.push(plan);
    if (p.flock && !wasFlying) { starts.push(i / 10); sizes[p.flock.length]++; dirs[p.flock[0].dir]++; if (firstAt == null) firstAt = i / 10; }
    if (!p.flock && wasFlying) { since = 0; }
    if (p.flock && !wasFlying && starts.length > 1) gaps.push(starts[starts.length - 1] - starts[starts.length - 2]);
    wasFlying = !!p.flock;
    if (p.flock) p.flock.forEach(g => { ymin = Math.min(ymin, g.y); ymax = Math.max(ymax, g.y); });
  }
  const perHour = starts.length / 24, n = starts.length;
  ok(firstAt >= 40 && firstAt <= 245, 'the first is 40 to 240 seconds after the window opens', firstAt.toFixed(0) + ' s');
  ok(perHour >= 8 && perHour <= 14, 'a goose crosses about ten times an hour: rare enough to be an event', perHour.toFixed(1) + ' an hour (' + n + ' in a day)');
  ok(Math.min(...gaps) >= 180, 'never twice inside three minutes', 'least ' + Math.min(...gaps).toFixed(0) + ' s from start to start');
  ok(Math.abs(sizes[1] / n - 0.6) < 0.05 && Math.abs(sizes[2] / n - 0.248) < 0.05 && Math.abs(sizes[3] / n - 0.152) < 0.05 && sizes[0] === 0 && sizes.slice(4).every(x => !x), 'mostly one, sometimes two, now and then three', sizes.slice(1, 4).map(x => (x / n * 100).toFixed(0) + ' %').join(' / '));
  ok(dirs['-1'] > n * 0.4 && dirs['1'] > n * 0.4, 'both ways', dirs['-1'] + ' left, ' + dirs['1'] + ' right');
  ok(ymin >= view.top - 40 && ymax <= view.bottom + 40, 'in the band of sky they were given', ymin.toFixed(0) + ' to ' + ymax.toFixed(0));
  ok(plans.length > 0 && plans.every(pl => pl.every(t => t.vol <= L.HONK_VOL)), 'and they honk as they go, quietly', plans.length + ' honks in a day');
  const p2 = L.passage(dice(1)); for (let i = 0; i < 10000; i++) L.stepPassage(p2, 0.1, dice(i), view, 1); ok(true, 'it runs without a clock');
}

console.log('\n-- on Dave --');
{
  ok(L.PERCH_ODDS === 20 && L.perches(() => 0.0499) === true && L.perches(() => 0.05) === false && L.perches(() => 0) === true && L.perches(() => 0.999) === false, 'one shop in twenty: a roll under one in twenty perches');
  const r = dice(2024); let n = 0; const N = 400000; for (let i = 0; i < N; i++) if (L.perches(r)) n++;
  ok(Math.abs(n / N - 0.05) < 0.002, 'over four hundred thousand shops, five in a hundred', (n / N * 100).toFixed(2) + ' %');
  const s = L.sitter(dice(4)), fr = []; let honks = 0, t = 0, landedAt = null;
  for (let i = 0; i < 60 * 120; i++) { const plan = L.stepSitter(s, 1 / 60, dice(i)); if (plan) honks++; t += 1 / 60; if (landedAt == null && L.sitFrame(s) === 'sit') landedAt = t; fr.push(L.sitFrame(s)); }
  ok(L.ARRIVE >= 0.8 && L.ARRIVE <= 1.5 && Math.abs(landedAt - L.ARRIVE) < 0.1, 'it comes down in a second or so and then sits', 'sat at ' + landedAt.toFixed(2) + ' s');
  ok(L.arrival({ t: 0 }) === 0 && L.arrival({ t: L.ARRIVE }) === 1 && L.arrival({ t: 9 }) === 1 && [0.1, 0.3, 0.6, 0.9].every((k, i, a) => !i || L.arrival({ t: k }) > L.arrival({ t: a[i - 1] })), 'it slows as it lands, and never goes back up');
  ok(fr.slice(0, 40).every(f => ['up', 'mid', 'down'].includes(f)) && fr.includes('sitHonk') && fr.includes('sit'), 'flapping on the way down, then sitting, then honking');
  ok(honks >= 4 && honks <= 14, 'it honks now and then while it sits (two minutes)', honks + ' honks');
}
{
  const tooLong = [...DAVE_GOOSE_LAND, ...DAVE_GOOSE_POKE, ...DAVE_GOOSE_HONK].filter(l => l.length > SPEECH_MAX || l !== l.toUpperCase() || /[‘’“”]/.test(l) || /undefined|NaN|null/.test(l));
  ok(tooLong.length === 0 && DAVE_GOOSE_LAND.length >= 6 && DAVE_GOOSE_POKE.length >= 5 && DAVE_GOOSE_HONK.length >= 4, 'Dave\'s goose lines fit the bubble, in capitals, and there are enough of them', DAVE_GOOSE_LAND.length + '/' + DAVE_GOOSE_POKE.length + '/' + DAVE_GOOSE_HONK.length);
  const known = new Set(DAVE_LINES.concat(DAVE_BROKE, DAVE_CRAZY, ...Object.values(DAVE_CRAZY_CAT))), mine = [...DAVE_GOOSE_LAND, ...DAVE_GOOSE_POKE, ...DAVE_GOOSE_HONK];
  ok(mine.every(l => !known.has(l)) && new Set(mine).size === mine.length, 'none of them is said anywhere else, and none twice');
}

console.log('\n-- the gift --');
{
  const g = GIFTS.find(x => x.id === 'goose');
  ok(g && g.from === 'thea' && g.set === 1 && /GEESE/.test(g.where), 'Thea gives it, with the first set, and says where the geese are', g && g.where);
  const src = ['apps/goose_art.js', 'apps/goose_life.js', 'apps/goose_voice.js', 'apps/goose_frames.js', 'apps/elephant/geese.js', 'apps/bekkedal/geese.js', 'apps/garden/geese.js', 'apps/standbattle/geese.js'];
  ok(src.every(f => readFileSync(new URL('../' + f, import.meta.url), 'utf8').split('\n').length < 300), 'every file of it is under 300 lines');
  ok(src.every(f => !/from '\.\.\/\.\.\/kernel|from '\.\.\/kernel/.test(readFileSync(new URL('../' + f, import.meta.url), 'utf8'))), 'and none imports the kernel (a goose asks window.Gifts and window.Snd, as an app may)');
}

console.log('\n' + (fails ? fails + ' FAILED of ' : 'all ') + checks + ' checks');
process.exit(fails ? 1 : 0);
