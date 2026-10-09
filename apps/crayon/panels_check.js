/* node apps/crayon/panels_check.js -- the Crayon's panels (pure Node: no window).
   THE LAYOUT   where four panels stand beside the sheet on desktops of several sizes: on the right if there is room, else on the left, else over the sheet's edge; never off the
                desktop, never on one another
   THE MEMORY   a remembered place is kept where the title bar can still be reached
   THE SESSION  picking a colour with the eraser in hand puts the crayon back; every listener hears of a change; one that left hears nothing */
import { arrange, clampAt, GAP } from './panels_layout.js';
import { createSession, SIZES } from './session.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(78) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

const DEFS = [
  { id: 'colour', w: 180, h: 232, col: 0 }, { id: 'sheet', w: 204, h: 122, col: 0 },
  { id: 'tools', w: 232, h: 286, col: 1 }, { id: 'layers', w: 232, h: 224, col: 1 }
];
const rect = (d, at) => ({ x: at.x, y: at.y, w: d.w, h: d.h });
const apart = (a, b) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;

console.log('-- the layout --');
const deskA = { w: 1340, h: 760 }, sheet = { x: 120, y: 30, w: 712, h: 556 };
const cases = [
  ['a wide desktop', deskA, sheet, 'right'],
  ['a narrower one: the sheet at the right', { w: 1250, h: 700 }, { x: 500, y: 30, w: 712, h: 556 }, 'left'],
  ['a small one: nowhere beside the sheet', { w: 900, h: 600 }, { x: 100, y: 20, w: 712, h: 556 }, 'over'],
  ['a tall sheet low on the desktop', deskA, { x: 120, y: 400, w: 712, h: 340 }, 'right']
];
for (const [label, desk, owner, side] of cases) {
  const at = arrange(DEFS, owner, desk), rs = DEFS.map(d => rect(d, at[d.id]));
  ok(rs.every(r => r.x >= 0 && r.y >= 0 && r.x + r.w <= desk.w && r.y + r.h <= desk.h), label + ': every panel is on the desktop', JSON.stringify(at));
  let clear = true; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) if (!apart(rs[i], rs[j])) clear = false;
  ok(clear, label + ': no two panels on one another');
  const left = Math.min(...rs.map(r => r.x)), right = Math.max(...rs.map(r => r.x + r.w));
  const where = left >= owner.x + owner.w ? 'right' : right <= owner.x ? 'left' : 'over';
  ok(where === side, label + ': ' + side + ' of the sheet', where);
  ok(at.colour.x === at.sheet.x || at.colour.x < at.tools.x, label + ': the colour and the sheet panels share a column, the tools and the layers the other', '');
}

console.log('\n-- the memory --');
{
  const c = clampAt({ x: 5000, y: 5000 }, { w: 232 }, deskA);
  ok(c.x <= deskA.w - 120 && c.y <= deskA.h - 30, 'a place far past the desktop is brought back to where the title bar can be reached', JSON.stringify(c));
  const d = clampAt({ x: -40, y: -9 }, { w: 232 }, deskA);
  ok(d.x === 0 && d.y === 0, 'a place left of the desktop or above it is brought to the edge');
  const e = clampAt({ x: 300, y: 200 }, { w: 232 }, deskA);
  ok(e.x === 300 && e.y === 200, 'a place on the desktop is left alone');
  const f = clampAt({}, { w: 232 }, deskA);
  ok(Number.isFinite(f.x) && Number.isFinite(f.y), 'a damaged memory is a place all the same');
}

console.log('\n-- the session --');
{
  const pal = [{ n: 'A', c: '#aaaaaa' }, { n: 'B', c: '#bbbbbb' }, { n: 'C', c: '#cccccc' }, { n: 'D', c: '#dddddd' }];
  const s = createSession(pal), heard = [];
  const off = s.on(w => heard.push(w));
  s.setTool('eraser'); s.pickSwatch(1);
  ok(s.tool === 'crayon' && s.hex === '#bbbbbb' && s.swatch === 1, 'a colour picked with the eraser in hand puts the crayon back');
  ok(heard.join() === 'tool,colour,tool', 'every listener hears the tool, then the colour', heard.join());
  s.setTool('marker'); s.pickWheel(120, 0.5, 0.8, '#40cc40');
  ok(s.tool === 'marker' && s.swatch === -1 && s.wheel.on && s.hex === '#40cc40', 'a colour from the wheel keeps the tool and is no swatch');
  s.pickSwatch(0);
  ok(!s.wheel.on && s.swatch === 0, 'a swatch switches the wheel off');
  s.setSize(2);
  ok(s.nib() === SIZES[2] && heard.includes('size'), 'the size is heard and gives its nib');
  off(); const n = heard.length; s.setTool('pencil');
  ok(heard.length === n, 'a listener that left hears nothing more');
  const bad = createSession(pal); bad.on(() => { throw new Error('a panel that is gone'); }); let thrown = false;
  try { bad.setTool('fill'); } catch (e) { thrown = true; }
  ok(!thrown, 'a listener that throws does not stop the others being told');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\ncrayon panels: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
