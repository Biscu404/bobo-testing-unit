/* node apps/sweeper/charm_check.js -- GRUBSONG cannot be an engine (pure Node).
   It used to give 33 soul for being hurt, which is what FOCUS costs: take a larva, mend the mask, take another larva, for ever.
   Mending costs 22 soul a mask at the very best, and a larva takes a mask at the least, so a hurt must pay under 22 soul.
   - the number itself, against the cheapest mend there is;
   - a real room played as the loop: hatch a larva, FOCUS whenever the soul is there, again and again, with every mix of the focus charms:
     the masks mended can never reach the masks lost, so the loop ends in the player's death and not in a room that cannot be lost. */
import { createRun } from './run.js';
import { NODES, START, GRUB_SOUL, CHARM, maxMasks } from './data.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
globalThis.window = { Sweeper: { st: { played: 0, streak: 0 }, save() {} } };
const snd = new Proxy({}, { get: () => () => {} });
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const clearedAll = () => { const c = {}; Object.keys(NODES).forEach(id => { c[id] = 10; }); return c; };

/* the arithmetic: no way of mending is cheaper than GRUB_SOUL a mask */
const perMask = { none: 33, quick: 22, deep: 44 / 2, both: 44 / 2 };
Object.entries(perMask).forEach(([k, c]) => ok(GRUB_SOUL < c, 'GRUBSONG pays ' + GRUB_SOUL + ' soul a hurt; focus (' + k + ') mends a mask for ' + c));
ok(GRUB_SOUL > 0 && GRUB_SOUL <= 8, 'GRUBSONG is a small comfort (' + GRUB_SOUL + ')');
ok(CHARM.grubsong.text.indexOf(String(GRUB_SOUL)) >= 0, 'the charm says what it pays');

/* the loop, played */
const MIXES = [['grubsong'], ['grubsong', 'quick'], ['grubsong', 'deep'], ['grubsong', 'quick', 'deep'], ['grubsong', 'quick', 'deep', 'ward', 'catcher']];
['void', 'hollow', 'bone2', 'court'].forEach(id => {
  const node = NODES[id]; if (!node) return;
  MIXES.forEach((eq, mi) => {
    Math.random = seeded(7 + mi);
    const camp = Object.assign(JSON.parse(JSON.stringify(START)), { cleared: clearedAll(), soul: 0, shards: 4, equipped: eq });
    camp.hp = maxMasks(camp.shards);
    const S = createRun({ lv: node, node, camp, snd, onWin: () => {}, shadeGeo: () => 0 });
    const at = i => [S.bx + (i % S.b.c) * S.tile + S.tile / 2, S.by + Math.floor(i / S.b.c) * S.tile + S.tile / 2];
    const click = i => { const [x, y] = at(i); S.mouse('down', { button: 0 }, x, y); S.mouse('up', { button: 0 }, x, y); };
    click(Math.floor(S.b.n / 2));                                   /* the first tile is always safe and lays the board */
    S.soul = 0;
    let hurt = 0, mended = 0, first = true;
    for (let i = 0; i < S.b.n && !S.over && hurt < 400; i++) {
      if (!S.b.mine[i] || S.b.def[i] || S.b.rev[i]) continue;
      const hp0 = S.hp, s0 = S.soul;
      click(i);
      if (S.hp < hp0) {
        hurt += hp0 - S.hp;
        if (first) { first = false; ok(S.soul - s0 === Math.round(GRUB_SOUL * (node.soulK || 1)) || S.soul === 99, id + ' ' + eq + ': a hurt pays ' + (S.soul - s0) + ' soul'); }
      }
      let guard = 0;
      while (!S.over && S.soul >= S.focusCost() && S.hp < S.hpMax && guard++ < 20) { const h = S.hp; S.key({ key: 'f' }); mended += Math.max(0, S.hp - h); }
    }
    ok(mended < hurt || hurt === 0, id + ' [' + eq + ']: ' + mended + ' masks mended for ' + hurt + ' lost - hurting yourself must not pay');
    ok(hurt > 0, id + ' [' + eq + ']: the bot was hurt at all');
  });
});

console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
