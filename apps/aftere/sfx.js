/* AfterEgypt's sound effects: what the run's events sound like. All of it is synthesised (no samples), through `sfx_synth.js`, and all of it
 * is pitched into the music's mode, D hijaz, so a coin or a gap is a note the tune could have played and never clashes with it.
 *
 *   coin     a ping that climbs the mode with every coin of a chain (a second or so apart at most), and a shimmer on top once it is long
 *   ankh     a rising chord of bells: a second chance
 *   shield   the ring breaks: glass, a thud, a falling chime. The hit that the ankh took
 *   crash    stone (a pillar) or a bug and a crack (a locust): the run is over
 *   gap      a doorway passed: a soft pluck on the note of its height, so the way across is a line you are playing; graze, a tick for a close one
 *   gust     a swell of wind through the one-second warning, and then the blow, sweeping up or down the way it pushes
 *   locust   a buzz from the right that rushes at the ship and passes it
 *   launch, win, bonus, unlock, death   the ship leaving, a clear, the first-clear money, a new way, the end
 *   fly      the faint air that follows the ship: louder and higher the faster it is steered
 * Every sound is a function of a few numbers the sim already has (`danger.js` for the music); none of it is random but the noise itself.
 */
import { makeSynth } from './sfx_synth.js';

const HIJAZ = [0, 1, 4, 5, 7, 8, 10];
export const hz = m => 440 * Math.pow(2, (m - 69) / 12);
/* scale degree `i` of hijaz on D from midi `base`, as a midi note */
export const degree = (i, base) => base + 12 * Math.floor(i / 7) + HIJAZ[((i % 7) + 7) % 7];
export const CHAIN_GAP = 150;                         /* frames: a coin this soon after the last one is the same chain */
const W = 320, SHIP_X = 30;                            /* the sky, as sim.js has it (this file does not import the sim) */

export function createSfx(host) {
  const S = makeSynth(host);
  let chain = 0, lastCoin = -9999, lastGap = -9999;
  const tone = o => S.tone(o), noise = o => S.noise(o);

  const fx = {
    synth: S,
    coin(frame) {
      chain = frame - lastCoin <= CHAIN_GAP ? chain + 1 : 0;
      lastCoin = frame;
      const f = hz(degree(Math.min(chain, 13), 74));
      tone({ f, dur: 0.12, type: 'triangle', vol: 0.05 });
      tone({ f: f * 2, dur: 0.18, vol: 0.02, delay: 0.012 });
      noise({ dur: 0.02, f0: 6000, q: 2, vol: 0.012 });
      if (chain >= 6) tone({ f: f * 3, dur: 0.22, vol: 0.012, delay: 0.03 });
      return chain;
    },
    ankh() {
      [74, 81, 86].forEach((m, i) => tone({ f: hz(m), dur: 0.55, type: 'triangle', vol: 0.04, delay: i * 0.05, attack: 0.02 }));
      tone({ f: hz(98), dur: 0.4, vol: 0.016, delay: 0.14 });
      tone({ f: 600, to: 1900, dur: 0.28, vol: 0.02 });
    },
    shield() {
      noise({ dur: 0.14, f0: 6500, f1: 2200, q: 0.7, vol: 0.08 });
      tone({ f: 150, to: 58, dur: 0.14, vol: 0.1 });
      tone({ f: 1500, to: 400, dur: 0.12, type: 'sawtooth', vol: 0.025 });
      tone({ f: hz(81), to: hz(74), dur: 0.35, type: 'triangle', vol: 0.03, delay: 0.04 });
    },
    crash(cause) {
      if (cause === 'locust') {
        noise({ dur: 0.22, f0: 1800, f1: 400, q: 0.8, vol: 0.12 });
        tone({ f: 380, to: 90, dur: 0.22, type: 'sawtooth', vol: 0.05 });
        tone({ f: 120, to: 40, dur: 0.3, vol: 0.14 });
        return;
      }
      noise({ dur: 0.5, f0: 2400, f1: 180, kind: 'lowpass', q: 0.7, vol: 0.22, attack: 0.002 });
      noise({ dur: 0.35, f0: 900, f1: 150, q: 0.8, vol: 0.12, delay: 0.03 });
      tone({ f: 120, to: 34, dur: 0.42, vol: 0.2 });
      tone({ f: 220, to: 60, dur: 0.06, type: 'square', vol: 0.05 });
    },
    gap(cy, clear, frame) {
      /* the nearer the top of the sky, the higher the note: two octaves of the mode from D4 */
      const i = Math.max(0, Math.min(13, Math.round((186 - cy) / 186 * 13)));
      if (clear < 6) {                                  /* a close one: a bright tick on top of the note */
        noise({ dur: 0.05, f0: 4200, q: 3, vol: 0.03 });
        tone({ f: hz(degree(i, 62) + 12), dur: 0.12, type: 'triangle', vol: 0.03 });
        return;
      }
      if (frame - lastGap < 6) return;                  /* never a machine gun, whatever the speed */
      lastGap = frame;
      tone({ f: hz(degree(i, 62)), dur: 0.07, type: 'triangle', vol: 0.017 });
    },
    /* the one second before a gust: wind gathers, rising in pitch and in strength, and stops dead where the blow begins */
    gustWarn() {
      noise({ dur: 1, f0: 220, f1: 1500, q: 1.2, vol: 0.1, env: [[0, 0.02], [0.9, 1], [1, 0.1]] });
      tone({ f: 160, to: 520, dur: 1, vol: 0.022, env: [[0, 0.05], [0.9, 1], [1, 0.05]] });
    },
    /* the gust itself: up (dir -1) it sweeps up, down (dir 1) it sweeps down, and it takes a second to let go */
    gustBlow(dir) {
      const a = dir < 0 ? 500 : 1300, b = dir < 0 ? 1300 : 500;
      noise({ dur: 2.2, f0: a, f1: b, q: 0.9, vol: 0.09, env: [[0, 0], [0.15, 1], [1.5, 0.85], [2.2, 0]] });
      noise({ dur: 2.2, f0: 170, kind: 'lowpass', q: 0.5, vol: 0.07, env: [[0, 0], [0.2, 1], [1.5, 0.8], [2.2, 0]] });
    },
    /* a locust loosed from the right at speed v (pixels a frame): it is on the ship in the time it takes to cross the sky */
    locust(v) {
      const T = Math.max(0.4, ((W + 16 - SHIP_X) / v + 10) / 60);
      S.buzz({ f: 150, to: 205, rate: 58, dur: T, vol: 0.1, pan: 0.9, panTo: -0.45, env: [[0, 0.1], [T * 0.82, 1], [T, 0]] });
    },
    launch() {
      noise({ dur: 0.5, f0: 200, f1: 1600, q: 0.9, vol: 0.06, env: [[0, 0], [0.35, 1], [0.5, 0]] });
      tone({ f: 110, to: 330, dur: 0.45, vol: 0.03 });
    },
    win() {
      [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => tone({ f: hz(degree(i, 74)), dur: 0.32, type: 'triangle', vol: 0.028, delay: i * 0.045 }));
      tone({ f: hz(98), dur: 0.9, vol: 0.016, delay: 0.4 });
    },
    /* the first clear pays: a shower of coins and a ring at the end */
    bonus() {
      for (let i = 0; i < 9; i++) {
        const f = hz(degree(Math.min(i + 2, 12), 74));
        tone({ f, dur: 0.11, type: 'triangle', vol: 0.03, delay: 0.5 + i * 0.055 });
        tone({ f: f * 2, dur: 0.14, vol: 0.012, delay: 0.512 + i * 0.055 });
      }
      tone({ f: hz(98), dur: 0.5, vol: 0.02, delay: 1.05 });
    },
    unlock() {
      noise({ dur: 0.9, f0: 140, f1: 430, kind: 'lowpass', q: 1, vol: 0.1, env: [[0, 0], [0.25, 1], [0.8, 0.7], [0.9, 0]] });
      tone({ f: 70, to: 52, dur: 0.9, type: 'square', vol: 0.018, env: [[0, 0], [0.2, 1], [0.9, 0]] });
      tone({ f: hz(81), dur: 0.5, type: 'triangle', vol: 0.03, delay: 0.6 });
      tone({ f: hz(98), dur: 0.7, type: 'triangle', vol: 0.025, delay: 0.72 });
    },
    death() {
      tone({ f: 98, to: 46, dur: 0.8, type: 'sawtooth', vol: 0.045, delay: 0.08 });
      noise({ dur: 0.8, f0: 700, f1: 90, kind: 'lowpass', q: 0.7, vol: 0.08, delay: 0.12 });
    },
    /* the ship's own air: how fast it is being steered, 0..1 */
    fly(speed) {
      S.loop();
      S.set(420 + speed * 1300, 0.006 + speed * 0.026);
    },
    still() { S.off(); },
    stop() { S.stop(); }
  };
  return fx;
}

/* the host the machine gives it: the audio context behind Snd, the mixer's AFTEREGYPT slider, the power switch and the SFX knob */
export function machineHost() {
  return {
    ctx() { const s = window.Snd; if (!s) return null; try { s.wake(); } catch (e) { return null; } return s.ctx || null; },
    bus() { const s = window.Snd; return (s && s.sfx) || (s && s.ctx && s.ctx.destination); },
    on() { const c = window.CRT; return !!c && !!c.on && c.sfx > 0; },
    level() { return window.Mixer ? window.Mixer.get('aftere') : 1; }
  };
}
