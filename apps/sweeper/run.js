/* One room: the rules of play, driven by clicks and keys. Drawing is in
   run_draw.js; the board's own rules are in board.js. This file decides what
   a click means, what a larva costs, and what a spell does. */
import { mk, lay, open, each, around, chordTargets, blocked, hiddenSafe, won as boardWon, flagsUsed } from './board.js';
import { CHARM, SPELLS, maxMasks } from './data.js';

export function createRun(env) {
  const node = env.node || null;                 /* null = a classic game */
  const lv = env.lv || node;
  const camp = env.camp || null;                 /* the campaign save, or null */
  const has = id => !!(camp && camp.equipped.indexOf(id) >= 0);
  const S = {
    env, node, lv, camp, has, classic: !camp,
    b: mk(lv.c, lv.r, lv.m), mod: node ? node.mod : null,
    hpMax: camp ? maxMasks(camp.shards) : 0, hp: camp ? camp.hp : 0, blue: 0,
    soul: camp ? camp.soul : 0, shell: false, opened: 0, womb: 0,
    started: false, t0: 0, endT: 0, over: false, won: false, dead: false, overAt: 0,
    target: null, hover: -1, held: false, msg: [], parts: [], floats: [], shake: 0, flash: 0, fogAt: 0,
    pay: null, tile: 20, bx: 0, by: 0, face: 'neutral'
  };
  if (has('lifeblood')) S.blue = 2;

  S.layout = () => {
    S.tile = Math.max(12, Math.floor(Math.min(930 / lv.c, 480 / lv.r)));
    S.bx = Math.round((960 - S.tile * lv.c) / 2);
    S.by = Math.round(84 + (500 - S.tile * lv.r) / 2);
  };
  S.layout();
  S.idxAt = (lx, ly) => {
    const x = Math.floor((lx - S.bx) / S.tile), y = Math.floor((ly - S.by) / S.tile);
    return x < 0 || y < 0 || x >= lv.c || y >= lv.r ? -1 : y * lv.c + x;
  };
  S.say = (t, c) => { S.msg.push({ t, c: c || '#e8e2d4', at: performance.now() }); if (S.msg.length > 3) S.msg.shift(); };
  const cell = i => ({ x: S.bx + (i % lv.c) * S.tile + S.tile / 2, y: S.by + Math.floor(i / lv.c) * S.tile + S.tile / 2 });
  const pop = (i, n, c) => {
    const p = cell(i);
    for (let k = 0; k < n; k++) S.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 110, life: 0.5 + Math.random() * 0.4, c });
  };
  const float = (i, txt, c) => { const p = cell(i); S.floats.push({ txt, x: p.x, y: p.y - 6, t: 0, c }); };
  S.pop = pop;

  /* ---- soul, masks ----------------------------------------------------- */
  const gainSoul = n => { if (camp) S.soul = Math.min(99, S.soul + Math.round(n)); };
  const focusCost = () => has('deep') ? 44 : has('quick') ? 22 : 33;
  const diveRad = () => has('shaman') ? 2 : 1;

  function hurt(i) {
    const b = S.b, now = performance.now();
    b.def[i] = true; b.rev[i] = now; b.flag[i] = false;
    pop(i, 14, '#c8354a');
    env.snd.chitter(0);
    if (S.classic) { lose(i); return; }
    const dmg = S.node.boss ? 2 : 1;
    if (has('stalwart') && !S.shell) {
      S.shell = true; S.say('THE SHELL HOLDS.', '#9fe0ff'); float(i, 'SHELL', '#9fe0ff');
    } else {
      let d = dmg;
      if (S.blue) { const t = Math.min(S.blue, d); S.blue -= t; d -= t; }
      S.hp -= d; S.shake = 1; S.flash = 1; env.snd.err();
      float(i, '-' + dmg, '#ff6070'); S.say('A LARVA HATCHES. -' + dmg + ' MASK' + (dmg > 1 ? 'S' : ''), '#ff8090');
      if (has('grubsong')) { gainSoul(33); float(i, '+33 SOUL', '#cfe6ff'); }
    }
    if (has('thorns')) each(b, i, j => { if (b.mine[j] && !b.def[j] && !b.flag[j] && !b.rev[j]) { b.flag[j] = true; pop(j, 4, '#7fe09a'); } });
    if (S.hp <= 0) { die(); return; }
    checkWin();
  }

  function die() {
    S.over = true; S.dead = true; S.overAt = performance.now(); S.endT = Date.now();
    env.snd.err();
  }
  function lose(i) {
    const Sw = window.Sweeper;
    S.over = true; S.won = false; S.face = 'cracked'; S.endT = Date.now(); S.overAt = performance.now();
    S.shake = 1; env.snd.err();
    if (Sw) { Sw.st.played++; Sw.st.streak = 0; Sw.save(); }
    S.hatch = performance.now();
  }

  function checkWin() {
    if (S.over || !boardWon(S.b)) return;
    S.over = true; S.won = true; S.face = 'serene'; S.endT = Date.now(); S.overAt = performance.now();
    const secs = (S.endT - S.t0) / 1000;
    env.snd.chime();
    env.onWin(S, secs);
  }

  /* ---- opening ---------------------------------------------------------- */
  function openAt(i, silent) {
    const b = S.b, got = open(b, i, performance.now(), 14);
    if (!got.length) return 0;
    S.opened += got.length;
    gainSoul(Math.min(14, 2 + got.length * 0.7) * (has('catcher') ? 1.5 : 1));
    got.slice(0, 14).forEach(j => pop(j, 1, '#8794aa'));
    if (!silent) env.snd.dig();
    if (has('womb')) {
      S.womb += got.length;
      while (S.womb >= 15) {
        S.womb -= 15;
        const m = [];
        for (let k = 0; k < b.n; k++) if (b.mine[k] && !b.flag[k] && !b.def[k] && !b.rev[k]) m.push(k);
        if (m.length) { const k = m[Math.floor(Math.random() * m.length)]; b.flag[k] = true; float(k, 'HATCHLING', '#ffd68c'); pop(k, 6, '#ffd68c'); }
      }
    }
    return got.length;
  }

  function clickOpen(i) {
    const b = S.b;
    if (b.rev[i]) {                                /* a number: clear spores, or chord */
      if (b.fog[i]) { b.fog[i] = false; env.snd.click(); pop(i, 6, '#c58bff'); return; }
      const t = chordTargets(b, i);
      if (!t) { env.snd.click(); return; }
      const bad = t.filter(j => b.mine[j]);
      t.filter(j => !b.mine[j]).forEach(j => { if (blocked(b, j) !== 'web') openAt(j, true); });
      env.snd.dig();
      bad.forEach(j => { if (!S.over) hurt(j); });
      checkWin();
      return;
    }
    const why = blocked(b, i);
    if (why === 'flag') return;
    if (why === 'web') { env.snd.click(); S.say('WEBBED: OPEN A NEIGHBOUR FIRST.', '#cfd8e0'); S.shake = 0.3; return; }
    if (b.thorn[i]) { b.thorn[i] = 0; env.snd.pin(); pop(i, 8, '#7fe09a'); S.say('THE BRAMBLE IS CUT.', '#9fd8a8'); return; }
    if (b.mine[i]) { hurt(i); return; }
    openAt(i);
    checkWin();
  }

  /* ---- spells ------------------------------------------------------------ */
  function cast(kind, i) {
    const b = S.b;
    if (b.rev[i] || b.def[i]) { S.say('NOTHING TO DO THERE.'); return; }
    const cost = SPELLS[kind].cost;
    if (S.soul < cost) { S.say('NOT ENOUGH SOUL.', '#ff9090'); return; }
    S.soul -= cost; S.target = null;
    env.snd.tone && env.snd.tone(kind === 'scry' ? 880 : 220, 220, { type: 'sine', to: kind === 'scry' ? 1760 : 80, vol: 0.05 });
    if (kind === 'scry') {
      if (b.mine[i]) { b.flag[i] = true; S.say('A LARVA, SEEN AND MARKED.', '#cfe6ff'); pop(i, 10, '#cfe6ff'); }
      else { b.flag[i] = false; b.thorn[i] = 0; b.web[i] = false; openAt(i); S.say('SAFE GROUND.', '#cfe6ff'); }
    } else {
      around(b, i, diveRad()).forEach(j => {
        if (b.rev[j] || b.def[j]) return;
        if (b.mine[j]) { b.flag[j] = true; pop(j, 5, '#cfe6ff'); }
        else { b.thorn[j] = 0; b.web[j] = false; openAt(j, true); }
      });
      S.shake = 0.7; S.say('THE DIVE LANDS.', '#cfe6ff');
    }
    checkWin();
  }
  function focus() {
    const c = focusCost();
    if (S.hp >= S.hpMax) { S.say('YOU ARE WHOLE.'); return; }
    if (S.soul < c) { S.say('NOT ENOUGH SOUL.', '#ff9090'); return; }
    S.soul -= c; S.hp = Math.min(S.hpMax, S.hp + (has('deep') ? 2 : 1));
    env.snd.chime(); S.say('A MASK MENDS.', '#f2efe4'); S.flash = -1;
  }

  /* ---- input --------------------------------------------------------------- */
  S.mouse = (type, ev, lx, ly) => {
    if (type === 'move') { S.hover = S.idxAt(lx, ly); return; }
    if (type === 'up') { S.held = false; return; }
    if (S.over || type !== 'down') return;
    const i = S.idxAt(lx, ly);
    if (i < 0) return;
    if (S.target) {
      if (ev.button === 2) { S.target = null; return; }
      if (!S.started) return;
      cast(S.target, i); return;
    }
    if (ev.button === 2) {
      if (S.b.rev[i] || S.b.def[i]) return;
      S.b.flag[i] = !S.b.flag[i]; env.snd.pin(); return;
    }
    if (ev.button !== 0) return;
    S.held = true;
    if (!S.started) {
      S.started = true; S.t0 = Date.now(); S.fogAt = performance.now() + 9000;
      lay(S.b, i, S.mod);
    }
    clickOpen(i);
  };
  S.key = ev => {
    const k = ev.key.toLowerCase();
    if (S.over) return false;
    if (!camp) return false;
    if (k === 'f') { if (S.started) focus(); else S.say('OPEN A TILE FIRST.'); return true; }
    if (k === 'q' || k === 'e') {
      if (!S.started) { S.say('OPEN A TILE FIRST.'); return true; }
      const kind = k === 'q' ? 'scry' : 'dive';
      S.target = S.target === kind ? null : kind;
      if (S.target) S.say(SPELLS[kind].name + ': CHOOSE A TILE. RIGHT-CLICK CANCELS.', '#cfe6ff');
      return true;
    }
    return false;
  };

  /* spores settle every so often on a number that is already open */
  S.tick = now => {
    if (S.over || !S.started || S.mod !== 'spore' || now < S.fogAt) return;
    S.fogAt = now + 8000 + Math.random() * 3000;
    const b = S.b, c = [];
    for (let i = 0; i < b.n; i++) if (b.rev[i] && now > b.rev[i] + 1500 && b.cells[i] && !b.fog[i] && !b.def[i]) c.push(i);
    if (c.length) { const i = c[Math.floor(Math.random() * c.length)]; b.fog[i] = true; pop(i, 5, '#c58bff'); }
  };
  S.left = () => Math.max(0, lv.m - flagsUsed(S.b) - S.b.def.filter(Boolean).length);
  S.hidden = () => hiddenSafe(S.b);
  S.focusCost = focusCost; S.diveRad = diveRad;
  return S;
}
