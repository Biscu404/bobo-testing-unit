/* Stand Battle Arena's props: the four places it is fought in, the six who fight in them (Jotaro and Star Platinum, Kira, the Delinquent, Angelo, Polnareff, Killer Queen in his three
   phases), their portraits, and a move list for each fighter written from the frame data the sim runs on. */
import { prop, doc, fname } from '../prop_kit.js';
import { SCENES, drawBackground } from './background.js';
import { basePose } from './anim.js';
import { drawJotaro } from './sprite_jotaro.js';
import { drawStar, standPose } from './sprite_star.js';
import { drawThug, drawAngelo } from './sprite_enemy.js';
import { drawKillerQueen } from './sprite_boss.js';
import { drawPolnareff } from './sprite_polnareff.js';
import { portrait } from './portraits.js';
import { GROUND_Y } from './constants.js';
import { ROSTER, PLAYABLE, movelistOf } from './roster.js';
import { cmdText, advText } from './cmd_text.js';

export const NAME = 'STAND BATTLE ARENA';
export const FOLDER = 'StandBattleProps';
const figure = (name, fn) => prop(name, 300, 240, g => { g.save(); g.translate(150, 214); fn(g); g.restore(); }, 3, { trim: true });

/* a fighter's moves as a text file: the table the sim, the training screen and the move list all read */
export function movelistText(id) {
  const d = ROSTER[id], L = movelistOf(id).list, pad = (s, n) => String(s).padEnd(n);
  const rows = L.map(m => pad(m.name, 26) + pad(cmdText(m), 26) + pad(m.h.toUpperCase(), 3) + pad('i' + m.startup, 6) + pad(m.active, 4) + pad(m.recovery, 4) + pad(m.launching ? m.reaction.toUpperCase() : advText(m.adv.hit), 7) + pad(m.h === 't' ? '--' : advText(m.adv.block), 5) + m.dmg);
  return d.name + '  (' + d.stand + ')\n' + d.blurb.join('\n') + '\n\n' + pad('MOVE', 26) + pad('COMMAND', 26) + pad('HT', 3) + pad('START', 6) + pad('ACT', 4) + pad('REC', 4) + pad('HIT', 7) + pad('BLK', 5) + 'DMG\n' + rows.join('\n') + '\n';
}

export async function props() {
  const L = [];
  Object.keys(SCENES).forEach(id => L.push(prop('PLACE_' + fname(id), 480, 270, g => drawBackground(g, 480, 270, id, 0, 0, GROUND_Y), 2)));
  L.push(figure('JOTARO_KUJO', g => drawJotaro(g, basePose())));
  L.push(figure('STAR_PLATINUM', g => drawStar(g, standPose(basePose()), 1)));
  L.push(figure('YOSHIKAGE_KIRA', g => drawKillerQueen(g, basePose(), 0, 0)));
  L.push(figure('MORIOH_DELINQUENT', g => drawThug(g, basePose())));
  L.push(figure('ANGELO', g => drawAngelo(g, basePose())));
  L.push(figure('POLNAREFF', g => drawPolnareff(g, basePose())));
  [0, 1, 2].forEach(ph => L.push(figure('KILLER_QUEEN_PHASE_' + (ph + 1), g => drawKillerQueen(g, basePose(), ph, 0))));
  PLAYABLE.concat(['boss']).forEach(id => {
    const who = ROSTER[id].portrait || id;
    L.push(prop('PORTRAIT_' + fname(id), 64, 64, g => portrait(g, 4, 4, 56, who), 3));
    L.push(doc('MOVELIST_' + fname(id) + '.TXT', movelistText(id)));
  });
  L.push(doc('README.TXT', 'STAND BATTLE ARENA: THE PROPS\n\nThe four places of Morioh it is fought in (480 x 270), the six who fight in them at their ease on a 300 x 240 sheet, enlarged\nthree times, a portrait of each, and a move list for every fighter: every move, how it is entered, how fast it starts, how long it\nlasts, and who is ahead after it hits or is blocked. Those numbers are the game: nothing else decides what a move does.\nYou cleared the ladder, and then you went and earned every trophy there is.\n'));
  return L;
}
