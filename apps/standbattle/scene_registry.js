/* The scenes of the app, by name. Each is a factory in its own file so a screen is one file and the shell knows none of them. */
import { fightScene } from './scene_fight.js';

export const SCENES = { fight: fightScene };
