/* The scenes of the app, by name. Each is a factory in its own file so a screen is one file and the shell knows none of them. */
import { fightScene } from './scene_fight.js';
import { vsScene } from './scene_vs.js';
import { continueScene } from './scene_continue.js';
import { hiscoreScene } from './scene_hiscore.js';
import { resultScene } from './scene_result.js';
import { titleScene } from './scene_title.js';
import { menuScene, optionsScene, recordsScene } from './scene_menu.js';
import { selectScene } from './scene_select.js';
import { controlsScene } from './scene_controls.js';
import { movelistScene } from './scene_movelist.js';
import { trainingScene } from './scene_training.js';

export const SCENES = {
  title: titleScene, menu: menuScene, options: optionsScene, records: recordsScene, select: selectScene, controls: controlsScene, movelist: movelistScene, training: trainingScene,
  fight: fightScene, vs: vsScene, continue: continueScene, hiscore: hiscoreScene, result: resultScene
};
