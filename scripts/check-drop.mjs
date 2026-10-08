#!/usr/bin/env node
/* The trophies on the desktop (pure Node): kernel/trophy_drop.js's world. Gravity pulls, the floor holds, a heavy seal bounces less than a cup, bodies stack and do not sink into each
   other, a window's top edge is a platform you land on from above and fall through when it is gone, and everything comes to rest. */
import { stepWorld } from '../kernel/trophy_drop.js';
let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const body = (x, y, w, m, e) => ({ x, y, w, h: w, vx: 0, vy: 0, m, e, sleep: false, rest: 0, drag: false });
const run = (bodies, W, H, plats, secs) => { for (let i = 0; i < secs * 60; i++) stepWorld(bodies, W, H, plats, 1 / 60); };

let a = body(100, 0, 48, 1.4, 0.34);
run([a], 800, 600, [], 6);
ok(Math.abs(a.y + a.h - 600) < 1 && a.sleep, 'a cup dropped from the top comes to rest on the floor and sleeps');

let c = body(100, 100, 48, 1.4, 0.34), s = body(300, 100, 60, 3, 0.14), peakC = 0, peakS = 0;
const bs = [c, s];
for (let i = 0; i < 90; i++) { stepWorld(bs, 800, 600, [], 1 / 60); if (c.vy < 0) peakC = Math.max(peakC, -c.vy); if (s.vy < 0) peakS = Math.max(peakS, -s.vy); }
ok(peakC > peakS, 'a seal bounces less than a cup (' + Math.round(peakC) + ' against ' + Math.round(peakS) + ')');

let low = body(100, 540, 48, 1.4, 0.3), top = body(104, 100, 48, 1.4, 0.3);
run([low, top], 800, 600, [], 6);
ok(top.y + top.h <= low.y + 1 && low.sleep && top.sleep, 'one dropped on another stands on it (top ' + Math.round(top.y + top.h) + ' <= ' + Math.round(low.y) + ')');
ok(Math.abs(low.y + low.h - 600) < 1, 'and the one below is still on the floor');

let w = body(200, 0, 48, 1.4, 0.3);
run([w], 800, 600, [{ x: 100, y: 300, w: 400 }], 3);
ok(Math.abs(w.y + w.h - 300) < 1 && w.sleep, 'a cup lands on the top edge of a window');
w.sleep = false; run([w], 800, 600, [], 3);
ok(Math.abs(w.y + w.h - 600) < 1, 'and when the window goes it falls to the floor');

let u = body(200, 400, 48, 1.4, 0.3);
run([u], 800, 600, [{ x: 100, y: 300, w: 400 }], 3);
ok(Math.abs(u.y + u.h - 600) < 1, 'a cup already under a window is not caught by it (a platform is one-way)');

let t = body(0, 500, 48, 1.4, 0.5); t.vx = 1500; t.vy = -300;
run([t], 800, 600, [], 6);
ok(t.x >= 0 && t.x + t.w <= 800 && t.sleep, 'a thrown cup stays inside the walls and comes to rest');

let ball = body(100, 500, 48, 1, 0.3), heavy = body(0, 552, 60, 3, 0.14); heavy.vx = 900;
const pair = [ball, heavy]; run(pair, 800, 600, [], 5);
ok(Math.abs(ball.x - 100) > 5 && ball.x >= 0, 'a seal sliding into a cup shoves it (it ended at ' + Math.round(ball.x) + ')');

let many = Array.from({ length: 30 }, (_, i) => body(30 + (i % 10) * 70, i * 30, 36 + (i % 3) * 6, 1, 0.3));
run(many, 800, 600, [], 12);
let overlaps = 0; for (let i = 0; i < many.length; i++) for (let j = i + 1; j < many.length; j++) { const A = many[i], B = many[j]; if (Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x) > 3 && Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y) > 3) overlaps++; }
ok(overlaps === 0 && many.every(m => m.sleep), 'thirty trophies fall, pile up, do not sink into each other and all go to sleep (' + overlaps + ' overlaps)');
console.log(bad ? bad + ' FAILED' : 'all ok');
process.exit(bad ? 1 : 0);
