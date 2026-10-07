/* AfterEgypt's sound, as one thing the game talks to: it says what happened and the sound does what that means. The sim never hears of it
 * (it only keeps a list of what happened in a step, `run.ev`), and `index.js` only calls these:
 *
 *   menu()  warm(id)             the screen that asks for a way: the title tune; load a way's instruments before it is asked for
 *   takeoff(L)                   the ship goes: the way's tune from bar one, and the sound of leaving
 *   events(run)                  after every step of the sim: a coin, an ankh, a doorway, a gust, a locust, a blow... as sound
 *   frame(dt, run, mode)         every frame: the layers ride the sky (danger.js), the stinger is counted out, the ship's air follows it
 *   finish(how)                  the flight is over: how = { won, first, unlocked }
 *   relevel()                    the mixer slider moved (the music follows it by itself, being on a studio channel; the effects are ours)
 *   stop()                       the window is closing: nothing is left playing
 * Whether anything is heard at all is the machine's: the power switch, the MUS knob (music) and the SFX knob (effects).
 */
import { createAfterMusic } from './music.js';
import { createSfx, machineHost } from './sfx.js';

export function createAudio(ctx, host) {
  let alive = true, lastY = null;
  const crt = () => window.CRT || {};
  const music = createAfterMusic({ studio: () => ctx.studio, playing: () => alive && !!crt().on && crt().mus > 0 });
  const sfx = createSfx(host || machineHost());

  const A = {
    music, sfx,
    menu() { if (alive) music.menu(); },
    warm(id) { if (alive) music.warm(['title', id, 'clear', 'death', 'unlock']); },
    takeoff(L) { if (!alive) return; lastY = null; music.run(L.id); sfx.launch(); },
    events(run) {
      if (!alive) return;
      for (const e of run.ev) {
        if (e === 'coin') sfx.coin(run.t);
        else if (e === 'ankh') sfx.ankh();
        else if (e === 'shield') sfx.shield();
        else if (e === 'dead') sfx.crash(run.info.cause);
        else if (e === 'gust') sfx.gustWarn();
        else if (e === 'gust-on') sfx.gustBlow(run.gust ? run.gust.dir : 1);
        else if (e === 'locust') sfx.locust(run.info.locust.v);
        else if (e === 'gap' || e === 'graze') sfx.gap(run.info.gap.cy, run.info.gap.close, run.t);
      }
    },
    frame(dt, run, mode) {
      if (!alive) return;
      music.sync();
      music.step(dt, mode === 'run' ? run : null);
      if (mode === 'run') {
        const v = lastY == null ? 0 : Math.abs(run.y - lastY);
        lastY = run.y;
        sfx.fly(Math.min(1, v / 6));
      } else { lastY = null; sfx.still(); }
    },
    finish(how) {
      if (!alive) return;
      sfx.still();
      if (how.won) {
        music.end(how.unlocked ? 'unlock' : 'clear');
        sfx.win();
        if (how.first) sfx.bonus();
        if (how.unlocked) sfx.unlock();
      } else {
        music.end('death');
        sfx.death();
      }
    },
    relevel() { if (alive) sfx.synth.relevel(); },
    stop() { alive = false; music.stop(); sfx.stop(); }
  };
  return A;
}
