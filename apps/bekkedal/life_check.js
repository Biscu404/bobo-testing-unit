/* Bekkedal life check — `node apps/bekkedal/life_check.js`
 *
 * `schedule_check.js` holds where everybody is meant to be; this holds what they do between those places (life.js), and
 * what a gift looks like once it is theirs (looks.js). Over a simulated year, every NPC, every ten minutes of every day:
 *
 *   - every chore station is a real tile, reachable on foot from its post, and nobody's station is anybody else's;
 *   - they are about for most of the working day (the hours an NPC is not on any map are asleep or an errand, and the
 *     errands are some days and not others, and never a shopkeeper's);
 *   - nobody stands on a solid tile, and no two stand on one;
 *   - nobody jumps: from one game minute to the next, on one map, an NPC is at most one tile from where they were (except
 *     where schedule.js changes post by design, a festival or a story flag);
 *   - they actually do the chores: a good share of the working day is away from the post tile, and every station is used;
 *   - and the whole thing is a pure function of the day and the minute (the same question twice, the same answer).
 *
 * Then the gifts: a gift is only seen if the person did not dislike it, the sweater is on in the cold and some of the warm
 * days, a thing in the hand is shown when the hand is free, and a record never holds more than two garments. */
import { BEK_NPCS, BEK_MAPS, BEK_SOLID, BEK_ITEMS, BEK_SEASONS } from './data.js';
import { lifeFor, errandOf, wayOut, hash } from './life.js';
import { activePost, bfsPath, walkable } from './schedule.js';
import { isFestivalDay, seasonOf } from './seasons.js';
import { CHORES, BED, ERRANDS, LOOKS, ACT_TOOL, CALLS, CHORE_ODDS, SLOT_MIN, HOMES } from './life_data.js';
import { noteGift, lookNow } from './looks.js';
import { createLooks } from './actors_look.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(66) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const ctxFor = day => ({ weather: ['klar', 'regn', 'klar', 'klar'][day % 4], flag: {}, act2Unlocked: false });

console.log('-- the stations --');
{
  const bad = [], seen = new Map(), clash = [];
  BEK_NPCS.forEach(n => {
    const chores = CHORES[n.id] || {};
    Object.keys(chores).forEach(postId => {
      const post = (n.posts || []).filter(p => p.id === postId)[0];
      if (!post) { bad.push(n.id + '/' + postId + ': no such post'); return; }
      chores[postId].forEach(st => {
        const k = post.map + ':' + st.x + ',' + st.y;
        if (!walkable(post.map, st.x, st.y)) bad.push(n.id + '/' + st.id + ' is not walkable');
        else if (!bfsPath(post.map, post.x, post.y, st.x, st.y)) bad.push(n.id + '/' + st.id + ' cannot be reached from its post');
        if (!ACT_TOOL[st.act]) bad.push(n.id + '/' + st.id + ': act ' + st.act + ' has no entry in ACT_TOOL');
        if (![0, 1, 2, 3].includes(st.face)) bad.push(n.id + '/' + st.id + ': bad facing');
        if (seen.has(k)) clash.push(n.id + '/' + st.id + ' and ' + seen.get(k));
        seen.set(k, n.id + '/' + st.id);
      });
    });
  });
  ok(!bad.length, 'every station is a real tile, on foot from its post, with a verb that has a hand', bad.slice(0, 3).join('; '));
  /* and nobody's station is anybody's post, or another station */
  const posts = new Set();
  BEK_NPCS.forEach(n => (n.posts || []).forEach(p => posts.add(p.map + ':' + p.x + ',' + p.y)));
  const onPost = [...seen.keys()].filter(k => posts.has(k));
  ok(!clash.length && !onPost.length, 'no station is another one, or anybody\'s post', clash.concat(onPost).slice(0, 3).join('; '));
  ok(BEK_NPCS.filter(n => n.posts && n.id !== 'bjorn').every(n => CHORES[n.id]), 'every one of the eight has something to do', BEK_NPCS.filter(n => n.posts && !CHORES[n.id]).map(n => n.id).join(','));
}

console.log('\n-- a year of days --');
const DAYS = 112, STEP = 10;
const stat = {}, solidHits = [], sharers = [], jumps = [], impure = [];
let asleepOutside = 0, errandOnFestival = 0, shopErrands = 0, errandDays = 0, errandChecks = 0;
const npcs = BEK_NPCS.filter(n => n.posts);
npcs.forEach(n => { stat[n.id] = { work: 0, avail: 0, away: 0, off: 0, atStation: 0, used: new Set(), errandDays: 0, asleep: 0 }; });
for (let day = 1; day <= DAYS; day++) {
  const ctx = ctxFor(day), fest = isFestivalDay(day);
  const prev = {};
  for (let min = 0; min < 1440; min += 1) {
    const here = new Map();
    for (const n of npcs) {
      const L = lifeFor(n, day, min, ctx);
      if (min % 97 === 0) { const L2 = lifeFor(n, day, min, ctx); if (JSON.stringify(L) !== JSON.stringify(L2)) impure.push(n.id + '@' + day + ':' + min); }
      const post = activePost(n, day, min, ctx), st = stat[n.id];
      const working = !fest && post.id !== 'home' && !post.weather && !post.flag && !post.season && !post.festival;
      if (working) { st.work++; if (L.map) st.avail++; else st.away++; }
      if (L.away === 'asleep') { st.asleep++; if (post.festival) asleepOutside++; const bed = BED[n.id] || BED.default; const m = min; const inb = bed[0] < bed[1] ? (m >= bed[0] && m < bed[1]) : (m >= bed[0] || m < bed[1]); if (!inb) asleepOutside++; }
      if (L.away === 'errand') { if (fest) errandOnFestival++; if (!ERRANDS[n.id] || !ERRANDS[n.id].odds) shopErrands++; }
      if (!L.map) { delete prev[n.id]; continue; }
      if (!walkable(L.map, L.x, L.y) && BEK_SOLID.indexOf(BEK_MAPS[L.map].rows[L.y].charAt(L.x)) >= 0) solidHits.push(n.id + '@' + L.map + ':' + L.x + ',' + L.y + ' day ' + day + ' ' + min);
      if (!L.walking && min % STEP === 0) {
        const k = L.map + ':' + L.x + ',' + L.y;
        if (here.has(k)) sharers.push(n.id + '+' + here.get(k) + '@' + k + ' day ' + day + ' ' + min);
        here.set(k, n.id);
      }
      if (working && !L.walking && L.act) { st.atStation++; st.used.add(L.act + '@' + L.x + ',' + L.y); }
      const p = prev[n.id];
      if (p && p.map === L.map && p.post === post.id && !post.festival && Math.max(Math.abs(p.x - L.x), Math.abs(p.y - L.y)) > 1) jumps.push(n.id + ' ' + p.x + ',' + p.y + '>' + L.x + ',' + L.y + ' day ' + day + ' ' + min + ' (' + post.id + ')');
      prev[n.id] = { map: L.map, x: L.x, y: L.y, post: post.id };
    }
  }
}
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
ok(!impure.length, 'the same day and minute always give the same answer', impure.slice(0, 2).join('; '));
ok(!solidHits.length, 'nobody ever stands in a wall', solidHits.slice(0, 3).join('; '));
ok(!sharers.length, 'and nobody ever stands where somebody else does', sharers.slice(0, 3).join('; '));
ok(!jumps.length, 'nobody jumps: a minute on, an NPC is at most a tile from where they were', jumps.slice(0, 3).join('; ') + (jumps.length > 3 ? ' (+' + (jumps.length - 3) + ' more)' : ''));
ok(asleepOutside === 0, 'asleep means in bed hours, and never while a festival is on');
ok(errandOnFestival === 0 && shopErrands === 0, 'nobody is on an errand on a festival, and no shopkeeper ever is');
npcs.forEach(n => {
  const st = stat[n.id], avail = pct(st.avail, st.work);
  ok(avail >= 80 && avail <= 100, n.id + ' is about for most of the working day', avail + '% of ' + st.work + ' working minutes (' + st.away + ' away)');
});
const away = npcs.filter(n => ERRANDS[n.id] && ERRANDS[n.id].odds > 0);
ok(away.every(n => stat[n.id].away > 0), 'and the ones who go out on errands do', away.map(n => n.id + ' ' + pct(stat[n.id].away, stat[n.id].work) + '%').join(' '));
npcs.filter(n => CHORES[n.id]).forEach(n => {
  const st = stat[n.id], share = pct(st.atStation, st.avail), want = Object.keys(CHORES[n.id]).reduce((a, p) => a + CHORES[n.id][p].length, 0);
  ok(share >= 20 && share <= 60, n.id + ' spends a fair part of the day at a chore', share + '% at a station, ' + st.used.size + ' of ' + want + ' used');
  ok(st.used.size >= Math.min(want, 2), n.id + ' uses more than one of the stations');
});

console.log('\n-- the asleep, and how it begins and ends --');
{
  const bad = [];
  npcs.forEach(n => {
    const bed = BED[n.id] || BED.default;
    const a = lifeFor(n, 3, bed[0] - 5, ctxFor(3)), b = lifeFor(n, 3, bed[0] + 5, ctxFor(3)), c = lifeFor(n, 3, bed[1] + 5, ctxFor(3));
    if (!a.map) bad.push(n.id + ' is already gone five minutes before bed');
    if (b.map) bad.push(n.id + ' is still about five minutes after bed time');
    if (!c.map && c.away === 'asleep') bad.push(n.id + ' is still asleep five minutes after waking');
  });
  ok(!bad.length, 'they go to bed at their hour and are up at theirs', bad.slice(0, 3).join('; '));
  const night = npcs.filter(n => lifeFor(n, 3, 3 * 60, ctxFor(3)).map).map(n => n.id);
  ok(night.length === 0, 'at three in the morning nobody is on the road', night.join(','));
}

console.log('\n-- nobody appears or vanishes: every change of place is a door, a seam or the edge of a map --');
{
  /* Walk every minute of a spread of days (festival days and ordinary ones, with Håkon's pen built and without, in rain and in winter) and
     look at every pair of minutes. Two places are joined if they are one tile apart on a map (or two: the pace is brisk on a long road),
     or the first is a tile of an exit whose far side is the second; and somebody vanishes only at a door (the tile in front of one, through
     it), a way off the map, and appears only at one. */
  const bad = [], seenKind = { door: 0, seam: 0, vanish: 0, appear: 0 };
  const exitsAt = (map, x, y) => (BEK_MAPS[map].exits || []).filter(e => e.x === x && e.y === y);
  const isDoorFront = (n, L) => { const h = HOMES[n.id] && HOMES[n.id][L.map]; return !!h && h.x === L.x && h.y + 1 === L.y; };
  const isWay = (L) => !!exitsAt(L.map, L.x, L.y).length || (BEK_MAPS[L.map].door && BEK_MAPS[L.map].door.x === L.x && BEK_MAPS[L.map].door.y + 1 === L.y);
  const days = []; for (let d = 1; d <= 112; d += 1) if (isFestivalDay(d) || d % 9 === 3) days.push(d);
  for (const day of days) for (const flags of [{}, { barn: 1 }]) {
    const ctx = { weather: ['klar', 'regn', 'klar', 'take'][day % 4], flag: flags, act2Unlocked: false };
    for (const n of npcs) {
      let prev = null;
      for (let min = 0; min < 1440; min++) {
        const L = lifeFor(n, day, min, ctx);
        if (prev) {
          const a = prev, b = L;
          if (a.map && b.map && a.map === b.map) { if (Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) > 2) bad.push(n.id + ' jumps ' + a.x + ',' + a.y + '>' + b.x + ',' + b.y + ' on ' + a.map + ' day ' + day + ' ' + min); }
          else if (a.map && b.map) { const e = exitsAt(a.map, a.x, a.y).filter(x => x.to === b.map && x.tx === b.x && x.ty === b.y)[0]; seenKind.seam++; if (!e) bad.push(n.id + ' changes map ' + a.map + '>' + b.map + ' without a seam, day ' + day + ' ' + min); }
          else if (a.map && !b.map) { seenKind.vanish++; if (!(isDoorFront(n, a) || isWay(a))) bad.push(n.id + ' vanishes in the open at ' + a.map + ':' + a.x + ',' + a.y + ' day ' + day + ' ' + min + ' (' + b.away + ')'); }
          else if (!a.map && b.map) { seenKind.appear++; if (!(isDoorFront(n, b) || isWay(b))) bad.push(n.id + ' appears in the open at ' + b.map + ':' + b.x + ',' + b.y + ' day ' + day + ' ' + min); }
        }
        prev = L;
      }
    }
  }
  ok(!bad.length, 'every change of place is made at a door, a seam or the edge of a map', bad.slice(0, 4).join('; ') + (bad.length > 4 ? ' (+' + (bad.length - 4) + ' more)' : ''));
  ok(seenKind.seam > 20 && seenKind.vanish > 20 && seenKind.appear > 20, 'and it happens, over those days', JSON.stringify(seenKind));
  /* the doors themselves */
  const dbad = [];
  Object.keys(HOMES).forEach(id => Object.keys(HOMES[id]).forEach(map => { const h = HOMES[id][map]; if (BEK_MAPS[map].rows[h.y].charAt(h.x) !== 'D' || !walkable(map, h.x, h.y + 1)) dbad.push(id + '@' + map); }));
  ok(!dbad.length, 'every home door is a door with a tile in front of it', dbad.join(','));
  const fade = [];
  npcs.forEach(n => { const bed = BED[n.id] || BED.default, a = lifeFor(n, 3, bed[0] - 1, ctxFor(3)); if (HOMES[n.id] && HOMES[n.id][a.map] && !(a.enter > 0.5)) fade.push(n.id); });
  ok(!fade.length, 'somebody with a door is going through it the minute before they sleep', fade.join(','));
}

console.log('\n-- where an errand goes --');
{
  const bad = [];
  npcs.filter(n => ERRANDS[n.id] && ERRANDS[n.id].odds).forEach(n => {
    n.posts.filter(p => p.id !== 'home' && !p.weather && !p.season && !p.flag && !p.festival).forEach(p => {
      const out = wayOut(p.map, { x: p.x, y: p.y });
      if (!out) bad.push(n.id + '/' + p.id + ' has no way off ' + p.map);
      else if (!bfsPath(p.map, p.x, p.y, out.x, out.y)) bad.push(n.id + ' cannot walk to the way out of ' + p.map);
    });
  });
  ok(!bad.length, 'everyone who goes out has somewhere to go out by, and can walk to it', bad.join('; '));
  let seen = 0, long = 0;
  for (let day = 1; day <= DAYS; day++) npcs.forEach(n => { const p = activePost(n, day, 12 * 60, ctxFor(day)); const e = errandOf(n, day, p); if (e) { seen++; if (e.n * SLOT_MIN > 300) long++; } });
  ok(seen > 40 && long === 0, 'some days there is an errand and none is longer than five hours', seen + ' errands in ' + DAYS + ' days');
}

console.log('\n-- the calls, and the looks --');
ok(CALLS.length >= 4 && CALLS.every(c => c.no && c.en && c.en === c.en.toUpperCase()), 'there are calls to shout, in both languages');
{
  /* every item in LOOKS is a real item; every glyph is one that can be drawn; every verb that carries an item carries a real one */
  const drawn = new Set(createLooks(() => ({ fillRect() {}, set fillStyle(v) {} }), i => i).glyphs);
  const badItem = Object.keys(LOOKS).filter(id => !BEK_ITEMS[id]);
  drawn.add('knit');                             /* the sweater is the one garment person() draws as part of the body */
  const badGlyph = Object.keys(LOOKS).filter(id => !drawn.has(LOOKS[id].wear || LOOKS[id].hold));
  const badAct = Object.keys(ACT_TOOL).filter(a => ACT_TOOL[a].item && !BEK_ITEMS[ACT_TOOL[a].item]);
  ok(!badItem.length && !badGlyph.length && !badAct.length, 'every look is a real item drawn with a real glyph', badItem.concat(badGlyph, badAct).join(','));
}
{
  let r = noteGift(null, 'ullgenser', 'neutral');
  ok(r && r.wear.length === 1 && r.wear[0].glyph === 'knit' && r.hold === null, 'a sweater, however it was taken, is worn');
  ok(noteGift(null, 'kaffe', 'disliked') === null, 'and a gift that was disliked is never seen');
  ok(noteGift(null, 'potet', 'loved') === null, 'nor an item with no look');
  r = noteGift(r, 'ull', 'liked'); r = noteGift(r, 'krystall', 'loved');
  ok(r.wear.length === 2 && r.wear.every(w => w.glyph !== 'knit'), 'two garments at most: the oldest is given back');
  r = noteGift(r, 'bukett', 'loved'); r = noteGift(r, 'kaffe', 'liked');
  ok(r.hold === 'kaffe', 'one thing in the hand: the last');
  const n = BEK_NPCS[0], winter = BEK_SEASONS.filter(s => s.id === 'vinter')[0].id;
  const knit = noteGift(null, 'ullgenser', 'neutral');
  let wornCold = 0, wornWarm = 0, N = 0;
  for (let d = 1; d <= 28; d++) for (let m = 6 * 60; m < 20 * 60; m += 180) { N++; if (lookNow(n, knit, d, m, 'vinter', 0.3, null)) wornCold++; if (lookNow(n, knit, d, m, 'sommer', 0, null)) wornWarm++; }
  ok(wornCold === N, 'the sweater is on in the cold, always', wornCold + ' of ' + N);
  ok(wornWarm > N * 0.25 && wornWarm < N * 0.85, 'and on some of the warm days, not all', wornWarm + ' of ' + N);
  const cup = noteGift(null, 'kaffe', 'loved');
  let idleShown = 0, workShown = 0, M = 0;
  for (let d = 1; d <= 28; d++) for (let m = 6 * 60; m < 20 * 60; m += 120) { M++; const a = lookNow(n, cup, d, m, 'sommer', 0, 'sit'), b = lookNow(n, cup, d, m, 'sommer', 0, 'hammer'); if (a && a.hold) idleShown++; if (b && b.hold) workShown++; }
  ok(idleShown > M * 0.6 && workShown === 0, 'a cup is in the hand on a break and never while hammering', idleShown + ' of ' + M + ' idle, ' + workShown + ' working');
  const lamp = noteGift(null, 'lykt', 'liked');
  ok(!lookNow(n, lamp, 3, 12 * 60, 'sommer', 0.0, null), 'a lantern is only carried when it is dark');
  ok(lookNow(n, lamp, 3, 23 * 60, 'sommer', 0.7, 'sit') && lookNow(n, lamp, 3, 23 * 60, 'sommer', 0.7, 'sit').hold, 'and is in the hand after dark, at rest');
}

console.log('\n' + (fails ? fails + ' of ' + checks + ' life checks FAILED' : 'All ' + checks + ' life checks pass.'));
process.exit(fails ? 1 : 0);
