/* Solitaire's score: node apps/solitaire/music_check.js (pure Node) -- sixteen bars, in key, layers really layers, the levels step with the deck. */
import * as L from '../../kernel/songtext.js';
import { IDS, BARS, song, levelsFor } from './score.js';
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };
IDS.forEach(id => {
  const s = song(L, id);
  ok(s.bars === BARS, id + ': sixteen bars');
  const lead = s.tracks[0], last = lead.notes.reduce((a, n) => Math.max(a, n[0] + n[1]), 0);
  ok(Math.abs(last - BARS * 4) < 0.01, id + ': the lead fills the sixteen bars (' + last + ')');
  ok(s.tracks.some(t => t.layer === 'h1') && s.tracks.some(t => t.layer === 'h2'), id + ': both layers');
  ok(s.tracks.filter(t => !t.layer).length >= 3, id + ': the core is a tune alone');
});
ok(levelsFor(0).h1 === 0 && levelsFor(13).h1 === 1 && levelsFor(26).h2 === 1 && levelsFor(12).h1 === 0, 'levels step with the deck');
console.log(bad ? bad + ' FAILED' : 'solitaire music ok');
process.exit(bad ? 1 : 0);
