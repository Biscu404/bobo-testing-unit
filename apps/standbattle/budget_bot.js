/* node apps/standbattle/budget_bot.js [players] — how long the game takes (spec 17). A "player" is a seed: it plays every mode once, on NORMAL, at a human's pace (HUMAN in ai_profiles.js:
   a view of the CPU 18 frames old, one decision in ten wrong, a punish taken about one time in two, no route over three hits), and clears the arcade ladder with each of the five fighters,
   starting a fresh credit after a game over. The time of a fight is the sim's own real-time count (the KO beat at 0.30 speed included); the time of everything that is not a fight is the
   TIMING table, the same numbers the screens use. Prints the table the spec quotes, and exits 1 if the mean is outside the band (110 to 130 minutes: two hours, give or take a tenth).

   Honest limit: the bot is a program with a human's numbers, not a human. The measurement says "the data is shaped for two hours", and that is all it can say. */

import { runArcade, runSurvival, runTimeAttack, runVersus, runCpu } from './headless_harness.js';
import { PLAYABLE } from './roster.js';
import { HUMAN, NOVICE, SKILLED } from './ai_profiles.js';
import { TIMING } from './timing.js';

const BAND = [110, 130];
const MAX_CREDITS = 6;
const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) * (v - m)))); };
const min = s => s / 60;

/* one fighter's ladder, as a person plays it: credits until it is cleared */
export function ladderBlock(char, seed, human, tier) {
  const out = { secs: TIMING.MENU_SECS + TIMING.SELECT_SECS, fightSecs: 0, credits: 0, matches: 0, wins: 0, losses: 0, cleared: false, rounds: 0, firstTry: [], byPos: [] };
  for (let c = 0; c < MAX_CREDITS && !out.cleared; c++) {
    const r = runArcade(char, tier || 'normal', seed + ':' + char + ':c' + c, human);
    out.credits++;
    out.secs += r.fightSecs + r.screens; out.fightSecs += r.fightSecs;
    let pos = 0;
    r.fights.forEach(f => { out.matches++; if (f.won) out.wins++; else out.losses++; out.rounds += f.rounds; (out.byPos[pos] = out.byPos[pos] || [0, 0])[f.won ? 0 : 1]++; if (f.won) pos++; });
    if (c === 0) out.firstTry = r.fights;
    out.cleared = r.cleared;
    if (!r.cleared) out.secs += TIMING.MENU_SECS;
  }
  return out;
}

/* everything else the player sees once */
export function otherModes(seed, human) {
  const parts = {};
  const vs = runVersus('jotaro', 'kira', seed, human), vs2 = runVersus('polnareff', 'delinquent', seed + ':again', human);
  /* two people share one match, then the rematch screen (declined after ten seconds); a second pair of fighters is played for the second pick-up */
  parts.versus2p = TIMING.MENU_SECS + TIMING.SELECT_SECS * 2 + TIMING.VS_SECS + vs.secs + TIMING.RESULT_SECS + 10 + vs2.secs * 0;
  const cpus = ['easy', 'normal'].map((t, i) => runCpu(PLAYABLE[i], PLAYABLE[(i + 2) % PLAYABLE.length], t, seed + ':cpu' + i, human));
  parts.versusCpu = TIMING.MENU_SECS * 2 + TIMING.SELECT_SECS * 2 + cpus.reduce((s, r) => s + r.secs + TIMING.VS_SECS + TIMING.RESULT_SECS, 0);
  let sv = null, svSecs = 0;
  for (let c = 0; c < 2; c++) { sv = runSurvival('kira', 'normal', seed + ':sv' + c, human); svSecs += sv.fightSecs + sv.screens; }
  parts.survival = TIMING.MENU_SECS + TIMING.SELECT_SECS + svSecs;
  let ta = null, taSecs = 0;
  for (let c = 0; c < 2; c++) { ta = runTimeAttack('angelo', 'normal', seed + ':ta' + c, human); taSecs += ta.fightSecs + ta.screens; if (ta.cleared) break; }
  parts.timeAttack = TIMING.MENU_SECS + TIMING.SELECT_SECS + taSecs;
  parts.training = 4 * 60;
  parts.title = 3 * 60; /* the title, the options, the controls sheet, the movelist, the records */
  parts.survivalWins = sv.wins;
  parts.taCleared = ta.cleared;
  return parts;
}

export function budget(players, human, tier) {
  const per = PLAYABLE.map(() => []), totals = [], rest = [], stats = { pos: {}, fightSecs: 0, matches: 0, wins: 0, rounds: 0, cleared1: 0, credits: [], tries: [] };
  for (let p = 0; p < players; p++) {
    let t = 0;
    PLAYABLE.forEach((id, k) => {
      const b = ladderBlock(id, 'budget' + p, human, tier);
      per[k].push(b.secs); t += b.secs;
      b.byPos.forEach((v, q) => { const a = (stats.pos[id] = stats.pos[id] || [])[q] = (stats.pos[id][q] || [0, 0]); a[0] += v[0]; a[1] += v[1]; });
      stats.fightSecs += b.fightSecs; stats.matches += b.matches; stats.wins += b.wins; stats.rounds += b.rounds; stats.credits.push(b.credits);
      if (b.credits === 1) stats.cleared1++;
      for (let q = 0; q < 7; q++) { const tries = b.firstTry.filter((f, i) => i <= q).length; void tries; }
    });
    const o = otherModes('budget' + p, human);
    const other = o.versus2p + o.versusCpu + o.survival + o.timeAttack + o.training + o.title;
    rest.push(other); totals.push(t + other);
    ['versus2p', 'versusCpu', 'survival', 'timeAttack', 'training', 'title'].forEach(k => { stats.parts = stats.parts || {}; stats.parts[k] = (stats.parts[k] || 0) + o[k]; });
    stats.sv = (stats.sv || 0) + o.survivalWins; stats.ta = (stats.ta || 0) + (o.taCleared ? 1 : 0);
  }
  return { per, totals, rest, stats };
}

function report(label, players, human, tier) {
  const r = budget(players, human, tier), n = players * PLAYABLE.length;
  console.log('\n' + label + ': ' + players + ' players, ' + n + ' ladders');
  PLAYABLE.forEach((id, k) => console.log('  ladder ' + id.padEnd(11), min(mean(r.per[k])).toFixed(1).padStart(5), 'min  (sd ' + min(sd(r.per[k])).toFixed(1) + ')'));
  console.log('  five ladders          ', min(mean(r.totals) - mean(r.rest)).toFixed(1).padStart(5), 'min');
  console.log('  everything else       ', min(mean(r.rest)).toFixed(1).padStart(5), 'min   (' + Object.keys(r.stats.parts).map(k => k + ' ' + min(r.stats.parts[k] / players).toFixed(1)).join(', ') + ')');
  console.log('  TOTAL                 ', min(mean(r.totals)).toFixed(1).padStart(5), 'min  (sd ' + min(sd(r.totals)).toFixed(1) + ', range ' + min(Math.min(...r.totals)).toFixed(0) + '-' + min(Math.max(...r.totals)).toFixed(0) + ')');
  console.log('  match win rate        ', (100 * r.stats.wins / r.stats.matches).toFixed(0) + '%', '   rounds per match', (r.stats.rounds / r.stats.matches).toFixed(2), '   ladders cleared on the first credit', (100 * r.stats.cleared1 / n).toFixed(0) + '%', '   credits per ladder', mean(r.stats.credits).toFixed(2));
  console.log('  a match is ' + (r.stats.fightSecs / r.stats.matches).toFixed(0) + ' s of fighting, a round ' + (r.stats.fightSecs / r.stats.rounds).toFixed(0) + ' s, a ladder ' + (r.stats.matches / n).toFixed(1) + ' matches');
  if (process.argv.includes('--detail')) PLAYABLE.forEach(id => console.log('  win rate by fight, ' + id.padEnd(11), r.stats.pos[id].map(v => (Math.round(100 * v[0] / (v[0] + v[1])) + '%').padStart(5)).join('')));
  console.log('  survival wins (first runs)', (r.stats.sv / players).toFixed(1), '   time attack cleared', (100 * r.stats.ta / players).toFixed(0) + '%');
  return mean(r.totals) / 60;
}

if (typeof process !== 'undefined' && import.meta.url === 'file://' + process.argv[1]) {
  const players = +process.argv[2] || 30;
  const total = report('HUMAN (the budget)', players, HUMAN);
  if (process.argv.includes('--all')) {
    const n = Math.max(10, players >> 1);
    report('NOVICE, on EASY', n, NOVICE, 'easy'); report('NOVICE, on NORMAL', n, NOVICE); report('SKILLED, on NORMAL', n, SKILLED); report('SKILLED, on HARD', n, SKILLED, 'hard');
  }
  const ok = total >= BAND[0] && total <= BAND[1];
  console.log('\n' + (ok ? 'The budget holds: ' : 'OUTSIDE THE BAND ' + BAND.join('-') + ': ') + total.toFixed(0) + ' minutes.');
  process.exit(ok ? 0 : 1);
}
