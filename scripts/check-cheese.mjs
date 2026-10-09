#!/usr/bin/env node
/* The cheese (pure Node, no browser): the wedge and the pile that grows smaller as it is eaten, and the way an elephant eats a piece of it (apps/cheese_art.js), which both elephants play:
   THE PILE     six wedges at most, each drawn over the one behind it, in the machine's colours, inside its box; the last one down is the first one eaten
   THE EATING   the trunk goes down to the pile, takes a piece, brings it to the mouth, and he chews; it never jumps; it begins and ends with the trunk where it hangs
   THE NUMBERS  a press adds three, a pile holds six, the next piece is some seconds off */
import { WEDGE, SPOTS, PILE_W, PILE_H, MAX_BITES, PER_PRESS, pileRuns, drawPile, EAT_SECS, PICK_AT, CHEW_FROM, eatPose, nextEatIn } from '../apps/cheese_art.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(86) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

console.log('-- the pile --');
ok(WEDGE.length === 9 && WEDGE.every(r => r.length === 14 && /^[0-9A-F.]+$/.test(r)), 'a wedge is fourteen by nine, in the sixteen colours');
ok(MAX_BITES === 6 && SPOTS.length === 6 && PER_PRESS === 3 && PER_PRESS * 2 === MAX_BITES, 'a pile is six wedges and a press puts down three: two presses fill it');
ok(SPOTS.every(([x, y]) => x >= 0 && y >= 0 && x + 14 <= PILE_W && y + 9 <= PILE_H), 'every wedge lies inside the pile\'s box (' + PILE_W + ' by ' + PILE_H + ')');
const area = n => { const cells = new Set(); pileRuns(n).forEach(([x, y, l]) => { for (let i = 0; i < l; i++) cells.add(x + i + ',' + y); }); return cells.size; };
let grows = true, last = 0; for (let n = 0; n <= 6; n++) { const a = area(n); if (n && a <= last) grows = false; last = a; }
ok(area(0) === 0 && grows, 'each wedge more adds to the pile, and none is nothing', [0, 1, 2, 3, 4, 5, 6].map(area).join(' < '));
ok(pileRuns(9).length === pileRuns(6).length && pileRuns(-2).length === 0, 'seven or nine is still six, and less than none is none');
ok(pileRuns(6).every(([x, y, l, c]) => [0, 6, 14, 15].includes(c) && x >= 0 && y >= 0 && x + l <= PILE_W && y < PILE_H), 'only black, brown, yellow and white, and nothing outside the box');
{
  const R = [], put = (x, y, w, h, c) => R.push([x, y, w, h, c]); drawPile(put, 10, 20, 3, 2);
  ok(R.length === pileRuns(3).length && R.every(r => r[2] % 2 === 0 && r[3] === 2) && Math.min(...R.map(r => r[0])) >= 10 && Math.min(...R.map(r => r[1])) >= 20, 'drawn at two pixels to a pixel, from where it was asked');
}
{ /* the first wedge laid is at the bottom and in front; the last is behind it and higher: eating from the top first */
  ok(SPOTS[0][1] > SPOTS[5][1] && SPOTS[5][1] === Math.min(...SPOTS.map(s => s[1])), 'the first wedge is at the bottom, the last on the top, which is eaten first');
}

console.log('\n-- the eating --');
{
  const f = Array.from({ length: 401 }, (_, i) => eatPose(i / 400));
  ok(f[0].lean === 0 && f[0].curl === 0 && !f[0].wedge && !f[0].chew && f[400].lean === 0 && f[400].curl === 0 && !f[400].wedge && !f[400].chew, 'it begins and ends with the trunk hanging as it does, nothing in it, nobody chewing');
  let jump = 0; for (let i = 1; i < f.length; i++) jump = Math.max(jump, Math.abs(f[i].lean - f[i - 1].lean), Math.abs(f[i].curl - f[i - 1].curl));
  ok(jump < 0.06, 'the trunk never jumps (the biggest step in a four-hundredth of it is ' + jump.toFixed(3) + ')');
  const peakLean = f.reduce((b, x, i) => x.lean > f[b].lean ? i : b, 0), peakCurl = f.reduce((b, x, i) => x.curl > f[b].curl ? i : b, 0);
  ok(f[peakLean].lean > 0.99 && f[peakCurl].curl > 0.99 && peakLean < peakCurl, 'it goes all the way down to the pile and all the way up to the mouth, the pile first');
  ok(f[peakLean].k < PICK_AT + 0.02 && f[peakLean].k > 0.2, 'the piece is taken when the trunk is down (at ' + PICK_AT + ')');
  const w = f.filter(x => x.wedge), c = f.filter(x => x.chew);
  ok(w.length > 40 && w.every(x => x.k >= PICK_AT && x.k < CHEW_FROM), 'a piece is in the trunk from the pick to the mouth, and only then');
  ok(c.length > 40 && c.every(x => x.k >= CHEW_FROM) && c.every(x => !x.wedge), 'he chews after it is in his mouth, and not before');
  ok(f.every((x, i) => x.bite === (x.k >= PICK_AT)), 'the pile is a piece smaller from the pick on');
  ok(eatPose(-2).k === 0 && eatPose(7).k === 1 && eatPose(NaN).k !== undefined, 'a time that is nonsense is the start or the end');
  ok(EAT_SECS > 2.5 && EAT_SECS < 5 && PICK_AT > 0.2 && PICK_AT < 0.4 && CHEW_FROM > PICK_AT + 0.3 && CHEW_FROM < 0.9, 'a piece takes ' + EAT_SECS + ' s: taken at ' + PICK_AT + ', chewed from ' + CHEW_FROM);
}

console.log('\n-- the numbers --');
ok([0, 0.5, 0.9999].every(r => { const s = nextEatIn(r); return s >= 6 && s <= 12; }), 'the next piece is six to twelve seconds off, in his window');
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\ncheese: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
