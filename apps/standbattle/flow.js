/* How the modes join the screens (spec 11): `begin` starts a session, `playFight` makes the fight scene from the session's next fight, `afterFight` takes the finished match, pays and records
   what it earned, and goes where the session says. The scenes know nothing of one another; they only call into here. */

import { createSession } from './session.js';
import { createAI } from './ai.js';
import { profileOf } from './ai_profiles.js';
import { pay, matchSun, clearSun } from './pay.js';
import { qualifies, insert, cleanInitials } from './hiscore.js';
import { wireTrophies, emit, mark } from './trophies_bridge.js';

export function begin(app, cfg) {
  app.session = createSession(Object.assign({ tier: app.meta.difficulty, seed: 'sb-' + Date.now() + '-' + Math.floor(Math.random() * 1e9) }, cfg));
  app.meta.played[cfg.mode] = (app.meta.played[cfg.mode] || 0) + 1;
  app.meta.lastChar = cfg.p1;
  app.saveMeta();
  app.go('vs');
}

export function playFight(app) {
  const S = app.session, cfg = S.fightConfig(), human2 = cfg.humans[1];
  let bridge = null;
  app.go('fight', Object.assign({}, cfg, {
    makeAI: (fight, slot, p) => createAI(fight, slot, p || cfg.profile),
    ais: [null, human2 ? null : cfg.profile],
    onStart: fight => { bridge = wireTrophies(fight, { enemy: S.opponent().id, mode: S.mode, tier: S.tier, mirror: !!S.opponent().mirror, shake: app.meta.shakeEnabled, pad: app.dev.padCount > 0 }); app.bridge = bridge; },
    onEnd: (match, fight) => { if (bridge) bridge.end(); app.bridge = null; afterFight(app, match, fight); },
    onQuit: () => { if (bridge) bridge.end(); app.bridge = null; app.session = null; }
  }));
}

export function afterFight(app, match, fight) {
  const S = app.session, human = match.winner === 0;
  const idx = S.i;
  const out = S.report(match, fight);
  const flawless = match.history.filter(r => r.winner === 0 && r.hp[0] >= fight.fighters[0].maxHp).length;
  const paid = pay(matchSun(S.mode, S.tier, idx, human, flawless), S.mode.toUpperCase() + (human ? ' WIN' : ''));
  if (paid) app.toast('+' + paid + ' SUN');
  if (human) mark('won_with', S.p1);
  S.lastPay = (S.lastPay || 0) + paid;
  if (out.next === 'vs') return app.go('vs');
  if (out.next === 'continue') return app.go('continue');
  if (out.next === 'clear' || out.next === 'over') return finish(app, out.next);
  return app.go('result', { kind: 'match' });
}

/* the end of a ladder, a run or a game: records, the clear bonus, the high-score table */
export function finish(app, how) {
  const S = app.session, meta = app.meta, cleared = how === 'clear' && S.cleared;
  if (S.mode === 'arcade' && cleared) {
    const c = meta.cleared[S.p1] || (meta.cleared[S.p1] = {}); c[S.tier] = true;
    const bonus = pay(clearSun('arcade', S.tier), 'LADDER CLEARED');
    S.lastPay = (S.lastPay || 0) + bonus; if (bonus) app.toast('LADDER CLEARED: +' + bonus + ' SUN');
    mark('cleared', S.p1);
    emit('ladder-clear', { char: S.p1, tier: S.tier, continues: S.continues, secs: S.secs, score: S.score });
  }
  if (S.mode === 'timeattack' && S.cleared) {
    const best = meta.timeattack[S.p1];
    S.newBest = best == null || S.secs < best;
    if (S.newBest) meta.timeattack[S.p1] = Math.round(S.secs * 10) / 10;
    const bonus = pay(clearSun('timeattack', S.tier, S.secs), 'TIME ATTACK'); S.lastPay = (S.lastPay || 0) + bonus; if (bonus) app.toast('+' + bonus + ' SUN');
    emit('timeattack-clear', { char: S.p1, secs: S.secs });
  }
  if (S.mode === 'survival') {
    meta.survival.runs++;
    if (S.wins > meta.survival.best) { meta.survival.best = S.wins; meta.survival.char = S.p1; S.newBest = true; }
    emit('survival-end', { wins: S.wins });
  }
  app.saveMeta();
  if (S.mode === 'arcade' && qualifies(meta.hiscores, S.score)) return app.go('hiscore');
  app.go('result', { kind: how });
}

export function saveScore(app, initials) {
  const S = app.session, meta = app.meta;
  meta.initials = cleanInitials(initials);
  const entry = { initials: meta.initials, score: S.score, char: S.p1, tier: S.tier, stage: S.i, secs: Math.round(S.secs), continues: S.continues, cleared: !!S.cleared };
  const r = insert(meta.hiscores, entry);
  meta.hiscores = r.table; app.saveMeta();
  emit('hiscore', { rank: r.rank });
  return r.rank;
}
