/* AfterEgypt's props: each of the five ways, as it looks waiting to be flown and as it looks a few seconds in. */
import { prop, doc } from '../prop_kit.js';
import { LEVELS } from './levels.js';
import { createRun, stepRun, W, H } from './sim.js';
import { draw, makeStars } from './draw.js';

export const NAME = 'AFTEREGYPT';
export const FOLDER = 'AftereProps';
export async function props() {
  const L = [];
  const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const stars = makeStars();
  LEVELS.forEach((lv, i) => {
    const ui = { mode: 'ready', stars: stars, phos: 0.75, pay: null, unlocked: '', best: 0, cleared: false };
    L.push(prop('WAY_' + lv.name.replace(/ /g, '_') + '_READY', W, H, g => { const run = createRun(lv, seeded(11 + i)); draw(g, run, ui); }, 3));
    L.push(prop('WAY_' + lv.name.replace(/ /g, '_') + '_FLYING', W, H, g => {
      const run = createRun(lv, seeded(11 + i)); let n = 0;
      while (n++ < 240 && !run.dead && !run.won) stepRun(run, { aim: run.pillars.length ? run.pillars[0].cy : 100, dir: 0 });
      draw(g, run, Object.assign({}, ui, { mode: 'run' }));
    }, 3));
  });
  L.push(doc('README.TXT', 'AFTEREGYPT: THE PROPS\n\nEach of the five ways, PILGRIM to THE THIRD TEMPLE, as it stands waiting and as it looks a few seconds into a flight.\nThey are the game\'s own frames, 320 x 200, enlarged three times. You flew all five in order without a failed run between.\n'));
  return L;
}
