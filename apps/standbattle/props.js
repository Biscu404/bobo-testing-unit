/* Stand Battle Arena's props: the four places it is fought in, and the people who fight in them (Jotaro, Star Platinum, a thug, Angelo, Killer Queen), each in his own pose. */
import { prop, doc, fname } from '../prop_kit.js';
import { SCENES, drawBackground } from './background.js';
import { basePose } from './anim.js';
import { drawJotaro } from './sprite_jotaro.js';
import { drawStar, standPose } from './sprite_star.js';
import { drawThug, drawAngelo } from './sprite_enemy.js';
import { drawKillerQueen } from './sprite_boss.js';
import { GROUND_Y } from './constants.js';

export const NAME = 'STAND BATTLE ARENA';
export const FOLDER = 'StandBattleProps';
const figure = (name, fn) => prop(name, 300, 240, g => { g.save(); g.translate(150, 214); fn(g); g.restore(); }, 3, { trim: true });
export async function props() {
  const L = [];
  Object.keys(SCENES).forEach(id => L.push(prop('PLACE_' + fname(id), 480, 270, g => drawBackground(g, 480, 270, id, 0, 0, GROUND_Y), 2)));
  L.push(figure('JOTARO_KUJO', g => drawJotaro(g, basePose())));
  L.push(figure('STAR_PLATINUM', g => drawStar(g, standPose(basePose()), 1)));
  L.push(figure('THUG', g => drawThug(g, basePose())));
  L.push(figure('ANGELO', g => drawAngelo(g, basePose())));
  [0, 1, 2].forEach(ph => L.push(figure('KILLER_QUEEN_PHASE_' + (ph + 1), g => drawKillerQueen(g, basePose(), ph, 0))));
  L.push(doc('README.TXT', 'STAND BATTLE ARENA: THE PROPS\n\nThe four places of Morioh it is fought in (480 x 270), and Jotaro, Star Platinum, a thug, Angelo and Killer Queen\nat their ease on a 300 x 240 sheet, enlarged twice. You cleared Act 1, and then you went and earned every trophy there is.\n'));
  return L;
}
