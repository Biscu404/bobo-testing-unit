#!/usr/bin/env node
/* Draws the app icon: a CRT in the machine's own VGA16 colours, nearest-neighbour
   scaled so it stays hard-edged at every size. Writes build/icon.png (512) and
   build/icon.ico (16/32/48/256, PNG-compressed entries). Re-run after editing the grid. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';

const C = { '.': 0x000000, g: 0xAAAAAA, d: 0x555555, b: 0x0000AA, y: 0xFFFF55, l: 0x55FF55, w: 0xFFFFFF };
const N = 32, grid = Array.from({ length: N }, () => Array(N).fill('g'));
const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y][x] = c; };
rect(0, 0, 31, 0, 'w'); rect(0, 0, 0, 31, 'w');           /* lit top/left edge of the bezel */
rect(31, 1, 31, 31, 'd'); rect(1, 31, 31, 31, 'd');        /* shaded bottom/right */
rect(2, 2, 29, 27, 'd');                                   /* screen recess */
rect(3, 3, 28, 26, 'b');                                   /* the blue screen */
rect(15, 6, 16, 22, 'y'); rect(10, 10, 21, 11, 'y');       /* the cross */
rect(3, 3, 28, 3, 'b');
rect(24, 29, 25, 29, 'l'); rect(5, 29, 12, 29, 'd');       /* LED + vent */

const render = (size) => {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const c = C[grid[Math.min(N - 1, Math.floor(y * N / size))][Math.min(N - 1, Math.floor(x * N / size))]];
    const i = (y * size + x) * 4;
    png.data[i] = c >> 16; png.data[i + 1] = (c >> 8) & 255; png.data[i + 2] = c & 255; png.data[i + 3] = 255;
  }
  return PNG.sync.write(png);
};

mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', render(512));
const sizes = [16, 32, 48, 256], imgs = sizes.map(render);
const head = Buffer.alloc(6 + 16 * sizes.length);
head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
let off = head.length;
sizes.forEach((s, i) => {
  const o = 6 + 16 * i;
  head[o] = s === 256 ? 0 : s; head[o + 1] = s === 256 ? 0 : s;
  head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6);
  head.writeUInt32LE(imgs[i].length, o + 8); head.writeUInt32LE(off, o + 12);
  off += imgs[i].length;
});
writeFileSync('build/icon.ico', Buffer.concat([head, ...imgs]));
console.log('wrote build/icon.png and build/icon.ico');
