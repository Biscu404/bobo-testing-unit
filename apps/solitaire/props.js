/* Solitaire's props: the fifty-two cards (four lanes, thirteen ranks), the three backs and the four lane marks. */
import { prop, doc, canvas } from '../prop_kit.js';
import { makeCards, LANES, RANK_TXT, CW, CH } from './cards.js';

export const NAME = 'SOLITAIRE';
export const FOLDER = 'SolitaireProps';
const PAD = 8;
export async function props() {
  const L = [];
  let back = 0;
  const [, g0] = canvas(8, 8);
  const cards = makeCards(g0, { back: () => back, suitMode: () => 4 });
  /* the painter draws on the context it was given: each card is painted through a fresh painter on its own canvas */
  const onto = (g, c) => { const q = makeCards(g, { back: () => back, suitMode: () => 4 }); q.drawCard(c, PAD, PAD - 2, false); };
  LANES.forEach(lane => {
    for (let r = 1; r <= 13; r++) L.push(prop(lane.name + '_' + (RANK_TXT[r] === 'A' ? 'ACE' : RANK_TXT[r] === 'J' ? 'JACK' : RANK_TXT[r] === 'Q' ? 'QUEEN' : RANK_TXT[r] === 'K' ? 'KING' : RANK_TXT[r]), CW + PAD * 2, CH + PAD * 2, g => onto(g, { s: lane.id, r: r, up: true }), 1));
  });
  ['HEXTECH', 'SILK', 'RUNE'].forEach((n, b) => L.push(prop('BACK_' + n, CW + PAD * 2, CH + PAD * 2, g => { back = b; onto(g, { s: 0, r: 1, up: false }); }, 1)));
  LANES.forEach(lane => L.push(prop('LANE_' + lane.name, 40, 40, g => { const q = makeCards(g, { back: () => 0, suitMode: () => 4 }); q.laneIcon(20, 20, 1.6, lane.id, q.laneVis(lane.id).c); }, 3)));
  L.push(doc('README.TXT', 'SOLITAIRE: THE PROPS\n\nThe whole pack, fifty-two cards, drawn as the game draws them: four lanes (MID, BOT, TOP, SUPPORT) of thirteen ranks, with the\nthree champions on the face cards of each. The three card backs, and the four lane marks. Use them anywhere.\n'));
  void cards;
  return L;
}
