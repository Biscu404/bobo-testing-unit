/* SFX design -- three-layer hit sounds (thump + crack + bark) with pitch jitter, escalating combo pitch and milestone sparkles, a block clang, and (new with the
   arcade rework, because a throw, a splat or a round cannot be read without them) a throw crack, a sidestep whoosh, a wall-splat thud, a counter-hit sting, a round
   bell, a KO boom and a round-end sting. Everything here calls the machine's own Snd (window.Snd), so it inherits the SFX volume knob and the power switch. */

function S() { return window.Snd; }

function jitter() { return 1 + (Math.random() * 0.16 - 0.08); }

function hitImpact(freqBase, vol) {
  const snd = S();
  if (!snd) return;
  const j = jitter();
  snd.tone(70 * j, 70, { type: 'triangle', to: 34, vol: vol * 0.9 });
  snd.noise(28, { freq: 1900 * j, q: 1.6, vol: vol * 0.55 });
  snd.tone(freqBase * j, 45, { type: 'square', vol: vol * 0.5 });
}

function onHit(p) {
  const snd = S();
  if (!snd) return;
  const combo = p.combo || 1, big = p.dmg >= 14 || p.reaction === 'launch' || p.reaction === 'bounce' || p.reaction === 'down';
  const pitch = 260 * Math.pow(1.035, Math.min(combo, 24));
  hitImpact(pitch, big ? 0.075 : p.dmg >= 8 ? 0.06 : 0.05);
  if (p.counter) { snd.tone(980, 70, { type: 'square', vol: 0.045 }); snd.tone(1470, 110, { type: 'square', vol: 0.04, delay: 0.05 }); }
  if (combo > 1 && combo % 4 === 0) [0, 1, 2].forEach(i => snd.tone(1100 + combo * 6 + i * 180, 55, { type: 'sine', vol: 0.03, delay: i * 0.03 }));
  if (p.ko) onKO();
}

function onKO() {
  const snd = S();
  if (!snd) return;
  snd.noise(220, { freq: 420, q: 0.55, vol: 0.1 });
  snd.tone(90, 340, { type: 'sawtooth', to: 28, vol: 0.07 });
  snd.tone(1046, 130, { type: 'triangle', vol: 0.04, delay: 0.12 });
  snd.tone(1568, 160, { type: 'triangle', vol: 0.035, delay: 0.2 });
}

function onBlock() {
  const snd = S();
  if (!snd) return;
  snd.noise(20, { freq: 3000, q: 3.2, vol: 0.05 });
  snd.tone(1300, 80, { type: 'triangle', vol: 0.04 });
  snd.tone(1950, 110, { type: 'sine', vol: 0.022, delay: 0.03 });
}

function onSwing(p) {
  const snd = S();
  if (!snd || !p.move) return;
  const low = p.move.h === 'l', heavy = p.move.dmg >= 12;
  if (p.move.h === 't') return;
  snd.noise(heavy ? 90 : 50, { freq: low ? 700 : heavy ? 1100 : 1700, q: 0.7, vol: heavy ? 0.03 : 0.018, delay: Math.max(0, (p.move.startup - 3) / 60) });
}

function onSidestep() { const snd = S(); if (snd) [1500, 1050, 700].forEach((f, i) => snd.noise(30, { freq: f, q: 0.6, vol: 0.022, delay: i * 0.02 })); }
function onSidestepDodge() { const snd = S(); if (snd) { snd.tone(900, 90, { type: 'sine', to: 400, vol: 0.03 }); } }

function onThrow() {
  const snd = S();
  if (!snd) return;
  snd.noise(30, { freq: 2600, q: 2.4, vol: 0.07 });
  snd.tone(180, 90, { type: 'square', to: 90, vol: 0.06 });
  snd.tone(520, 60, { type: 'square', vol: 0.04, delay: 0.05 });
}
function onThrowBreak() {
  const snd = S();
  if (!snd) return;
  snd.noise(25, { freq: 3400, q: 3.2, vol: 0.07 });
  [1200, 1700, 2300].forEach((f, i) => snd.tone(f, 70, { type: 'triangle', vol: 0.035, delay: i * 0.04 }));
}
function onWallSplat() { const snd = S(); if (snd) { snd.tone(70, 200, { type: 'sine', to: 32, vol: 0.09 }); snd.noise(120, { freq: 500, q: 0.6, vol: 0.08 }); } }
function onKnockdown(p) { const snd = S(); if (snd) { snd.tone(60, 160, { type: 'sine', to: 30, vol: p && p.ko ? 0.09 : 0.06 }); snd.noise(70, { freq: 380, q: 0.7, vol: 0.05 }); } }
function onBounce() { const snd = S(); if (snd) { snd.tone(90, 120, { type: 'sine', to: 40, vol: 0.07 }); snd.noise(50, { freq: 600, q: 0.8, vol: 0.05 }); } }
function onLaunch() { const snd = S(); if (snd) snd.tone(260, 220, { type: 'sine', to: 760, vol: 0.035 }); }
function onRoundStart() { const snd = S(); if (snd) { snd.tone(660, 220, { type: 'triangle', vol: 0.05 }); snd.tone(990, 320, { type: 'triangle', vol: 0.04, delay: 0.02 }); } }
function onFight() { const snd = S(); if (snd) [392, 523, 784].forEach((f, i) => snd.tone(f, 140, { type: 'square', vol: 0.045, delay: i * 0.07 })); }
function onRoundEnd(p) {
  const snd = S();
  if (!snd) return;
  const draw = p.result && p.result.winner < 0;
  (draw ? [440, 440, 330] : [523, 659, 784, 1046]).forEach((f, i) => snd.tone(f, 170, { type: 'triangle', vol: 0.045, delay: i * 0.08 }));
}
function onWake() { const snd = S(); if (snd) snd.noise(40, { freq: 900, q: 0.6, vol: 0.02 }); }
function onDetonate() { const snd = S(); if (snd) { snd.noise(160, { freq: 260, q: 0.5, vol: 0.1 }); snd.tone(70, 260, { type: 'sawtooth', to: 28, vol: 0.07 }); } }
function onProjectile() { const snd = S(); if (snd) snd.tone(700, 140, { type: 'sawtooth', to: 300, vol: 0.03 }); }
function onSpecial() { const snd = S(); if (snd) snd.tone(1400, 40, { type: 'square', vol: 0.025 }); }

export function wireAudio(fight) {
  const d = fight.bus;
  d.on('onHit', onHit); d.on('onBlock', onBlock); d.on('onSwing', onSwing); d.on('onSidestep', onSidestep); d.on('onSidestepDodge', onSidestepDodge);
  d.on('onThrow', onThrow); d.on('onThrowBreak', onThrowBreak); d.on('onWallSplat', onWallSplat); d.on('onKnockdown', onKnockdown); d.on('onBounce', onBounce);
  d.on('onLaunch', onLaunch); d.on('onRoundStart', onRoundStart); d.on('onFight', onFight); d.on('onRoundEnd', onRoundEnd); d.on('onWake', onWake);
  d.on('onDetonate', onDetonate); d.on('onProjectile', onProjectile); d.on('onSpecial', onSpecial);
}

export function sfxVictory() {
  const snd = S(); if (!snd) return;
  [523, 659, 784, 1046].forEach((f, i) => snd.tone(f, 180, { type: 'triangle', vol: 0.05, delay: i * 0.07 }));
}
export function sfxDefeat() {
  const snd = S(); if (!snd) return;
  snd.tone(220, 520, { type: 'sawtooth', to: 55, vol: 0.05 });
}
export function sfxActComplete() {
  const snd = S(); if (!snd) return;
  [523, 659, 784, 1046, 1318].forEach((f, i) => snd.tone(f, 260, { type: 'triangle', vol: 0.05, delay: i * 0.09 }));
}
export function sfxTick(n) { const snd = S(); if (snd) snd.tone(n < 4 ? 880 : 520, 70, { type: 'square', vol: 0.04 }); }
export function sfxMove() { const snd = S(); if (snd && snd.tick) snd.tick(); else if (snd) snd.tone(700, 25, { type: 'square', vol: 0.02 }); }
export function sfxPick() { const snd = S(); if (snd) [660, 990].forEach((f, i) => snd.tone(f, 90, { type: 'triangle', vol: 0.045, delay: i * 0.05 })); }
export function sfxDeny() { const snd = S(); if (snd && snd.deny) snd.deny(); }
