/* Dungeon Sweeper's soundtrack: which tune is playing where you are.
 *
 * The tunes are in `score.js` (five dungeon-synth songs for the studio's real instruments). Nothing rotates through them: the place
 * decides (`PLACE_TUNE`): the title has its gate, the map and the benches the crossway, the rooms of the first act the moss, a guardian
 * the Hollow One, and the Underdeep its own. Each place's pool is that one tune, so the director (apps/director.js) only changes tune
 * when the place does, on a bar line, and otherwise loops the tune it has.
 *
 * `createSweeperMusic(A)` wants A.studio() (ctx.studio) and A.playing() (the screen is on, MUS is up, the window is alive); it hands
 * back the director's object with `setPlace(name)` to say where the game is, and `sync()`, `rotStep()` and `stop()` every frame. */
import { createDirector } from '../director.js';
import { song as scoreOf, PLACE_TUNE } from './score.js';

export function createSweeperMusic(A) {
  let place = 'gate';
  const Song = createDirector({
    channel: 'sweeper', first: PLACE_TUNE.gate, minLoops: 2,
    studio: A.studio, playing: A.playing, score: scoreOf,
    pool: () => [PLACE_TUNE[place]]
  });
  /* the place is a name from PLACE_TUNE; an unknown one is ignored, so the tune keeps going rather than falling silent */
  Song.setPlace = p => { if (PLACE_TUNE[p]) place = p; };
  Song.place = () => place;
  return Song;
}
