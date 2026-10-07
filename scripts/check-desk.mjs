#!/usr/bin/env node
/* Where the desktop puts its icons (pure Node): kernel/desk_grid.js against the cases that made two hundred
   files slow and, once the desk was full, hid them all on one spot. */
import { layout, gridOf, cellOf, nearestFree, ICON_W, ICON_H } from '../kernel/desk_grid.js';

let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const dims = { w: 1280, h: 720 };
const { cols, rows } = gridOf(dims.w, dims.h);
const names = n => Array.from({ length: n }, (_, i) => ({ name: 'F' + i }));
const cellKey = p => { const c = cellOf(p.x, p.y); return c.c + ',' + c.r; };

/* a fresh desk fills down a column, then the next, one icon to a cell */
let out = layout(names(25), {}, [], dims);
ok(new Set([...out.values()].map(cellKey)).size === 25, 'twenty-five new icons take twenty-five different cells');
ok(out.get('F0').x === 8 && out.get('F0').y === 8 && out.get('F1').y === 8 + ICON_H, 'the first icons run down the first column');

/* an icon that has a place keeps it, and a newcomer never bumps it */
const stored = { F3: { x: 8 + 2 * ICON_W, y: 8 + ICON_H } };
out = layout(names(30), stored, [], dims);
ok(cellKey(out.get('F3')) === cellKey(stored.F3), 'a placed icon stays where it was');
ok(new Set([...out.values()].map(cellKey)).size === 30, 'and nobody shares its cell');

/* a position past the edge (the window got smaller) is pulled back inside the grid */
out = layout(names(1), { F0: { x: 9000, y: 9000 } }, [], dims);
const c = cellOf(out.get('F0').x, out.get('F0').y);
ok(c.c === cols - 1 && c.r === rows - 1, 'an icon stored off the edge lands in the last cell');

/* two icons claiming one cell: the first keeps it, the second goes to a neighbour */
out = layout(names(2), { F0: { x: 100, y: 100 }, F1: { x: 100, y: 100 } }, [], dims);
ok(cellKey(out.get('F0')) !== cellKey(out.get('F1')), 'two icons stored on one cell are pulled apart');

/* arrivals (things dropped from a window) go where they were dropped, in order, only for newcomers */
const arrive = [{ x: 8 + 5 * ICON_W, y: 8 + 3 * ICON_H }, { x: 8 + 6 * ICON_W, y: 8 + 3 * ICON_H }];
out = layout([{ name: 'old' }, { name: 'a' }, { name: 'b' }], { old: { x: 8, y: 8 } }, arrive, dims);
ok(cellKey(out.get('a')) === cellKey(arrive[0]) && cellKey(out.get('b')) === cellKey(arrive[1]), 'dropped files land where they were dropped');

/* a full desk, and then some: nothing disappears, nothing shares a point, and it is quick */
const many = cols * rows + 90;
let t0 = process.hrtime.bigint();
out = layout(names(many), {}, [], dims);
let ms = Number(process.hrtime.bigint() - t0) / 1e6;
const pts = new Set([...out.values()].map(p => p.x + ',' + p.y));
ok(out.size === many, many + ' icons on a desk of ' + cols * rows + ' cells are all placed');
ok(pts.size >= cols * rows + 7, 'the ones that do not fit are spread a few pixels apart, not hidden on one point (' + pts.size + ' distinct points)');
ok(ms < 60, 'a full desk is laid out in ' + ms.toFixed(1) + ' ms');

/* it does not get worse with a thousand */
t0 = process.hrtime.bigint();
const big = layout(names(1000), Object.fromEntries(names(500).map((n, i) => [n.name, { x: 8 + (i % cols) * ICON_W, y: 8 + (Math.floor(i / cols) % rows) * ICON_H }])), [], dims);
ms = Number(process.hrtime.bigint() - t0) / 1e6;
ok(big.size === 1000 && ms < 100, 'a thousand icons, half of them stored on top of each other, in ' + ms.toFixed(1) + ' ms');

/* the search itself: the nearest free cell, on the border of the ring, null when there is none */
const taken = new Set(); for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) taken.add(q + ',' + r);
const n = nearestFree(taken, 1, 1, 5, 5);
ok(n && Math.max(Math.abs(n.c - 1), Math.abs(n.r - 1)) === 2, 'the nearest free cell round a taken block is two away');
for (let r = 0; r < 5; r++) for (let q = 0; q < 5; q++) taken.add(q + ',' + r);
ok(nearestFree(taken, 2, 2, 5, 5) === null, 'a full grid answers null');

console.log(bad ? bad + ' FAILED' : 'all ok');
process.exit(bad ? 1 : 0);
