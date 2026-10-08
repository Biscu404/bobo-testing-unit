/* Where AfterEgypt tells the trophies what happened (the list is trophies.js). One flight is one tally: the doorways passed under a gust, the ankhs taken, whether the knobs
   stayed where the trophy wants them. A card waits while a flight is on (hold on takeoff, release when it ends or the window goes). None of it can throw into the game. */
import { trophies } from '../trophy_scope.js';
import { GUST_WARN } from './sim.js';

const TR = trophies('aftere');
const guard = f => { try { return f(); } catch (e) { return undefined; } };
const crt = () => guard(() => window.CRT) || {};

export function createCalls() {
  let holding = false, tally = null;
  const free = () => { if (holding) { holding = false; TR.release(); } };
  return {
    takeoff() {
      guard(() => {
        TR.drain();
        tally = { vhold: (crt().vhold == null ? 5 : crt().vhold) !== 5, phos: crt().phos === 2, wind: 0, windTold: false, ankhs: 0 };
        if (!holding) { holding = true; TR.hold(); }
      });
    },
    /* once a step: what the sim says happened, and the knobs */
    step(run) {
      guard(() => {
        if (!tally) return;
        if ((crt().vhold == null ? 5 : crt().vhold) === 5) tally.vhold = false;
        if (crt().phos !== 2) tally.phos = false;
        run.ev.forEach(w => {
          if (w === 'shield') TR.emit('shield', {});
          else if (w === 'ankh') { tally.ankhs++; if (run.shield >= 2) TR.emit('ankh2', {}); }
          else if ((w === 'gap' || w === 'graze') && run.gust && run.gust.t > GUST_WARN) { tally.wind++; if (tally.wind >= 10 && !tally.windTold) { tally.windTold = true; TR.emit('wind10', {}); } }
        });
      });
    },
    /* the flight is over; `chain` is how many ways have now been cleared in order */
    end(L, run, chain) {
      guard(() => {
        const t = tally || {};
        if (!run.won && run.info.cause) TR.mark('causes', run.info.cause);
        if (run.won) TR.max('chain', chain);
        TR.emit('run-end', {
          way: L.id, won: run.won, hits: run.hits, coins: run.coins, coinsSpawned: run.coinsSpawned, grazes: run.grazes, ankhs: t.ankhs || 0, cause: run.info.cause || null,
          pct: run.won ? 100 : Math.min(99, Math.round(run.dist / L.goal * 100)), secs: run.t / 60, vhold: !!t.vhold, phos: !!t.phos
        });
      });
      free();
    },
    stop: free
  };
}
