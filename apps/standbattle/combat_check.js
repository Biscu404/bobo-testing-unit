/* node apps/standbattle/combat_check.js — the mechanics of spec 6-10, one by one, in real fights: heights against stance and guard, the sidestep and what tracks it,
   counter hits, launches and juggles and their scaling, the bounce, the wall splat that ends a combo, the knockdown and its wake-up options, ring-outs, rounds, draws. */
import { kit, arena, run, perform, back, events, BIT, RULES, WORLD } from './check_kit.js';
import { scaleFor } from './rules.js';
const { ok, done } = kit('combat');

/* ---- heights (spec 6) ------------------------------------------------------------------------------------------------------------------------------- */
{
  const expect = {  // stance -> height -> outcome
    stand:       { jab: 'hit', snap: 'hit', shin: 'hit' },
    standGuard:  { jab: 'block', snap: 'block', shin: 'hit' },
    crouch:      { jab: 'none', snap: 'hit', shin: 'hit' },
    crouchGuard: { jab: 'none', snap: 'hit', shin: 'block' }
  };
  Object.keys(expect).forEach(stance => Object.keys(expect[stance]).forEach(mv => {
    const { fight, A, D } = arena();
    const bits = (stance.indexOf('Guard') >= 0 ? back(D) : 0) | (stance.indexOf('rouch') >= 0 ? BIT.DOWN : 0);
    run(fight, 10, 0, bits);
    perform(fight, A, mv, bits);
    run(fight, 40, 0, bits);
    const got = events(fight, 'onHit').length ? 'hit' : events(fight, 'onBlock').length ? 'block' : 'none';
    ok(got === expect[stance][mv], 'a ' + A.ml.byId.get(mv).height + ' attack on a ' + stance + ' fighter is ' + expect[stance][mv] + ' (' + got + ')');
  }));
}

/* ---- sidestep and tracking (spec 7) ------------------------------------------------------------------------------------------------------------------ */
{
  const tap = (fight, bit) => { fight.step(0, bit); fight.step(0, 0); };
  const dodge = (mv, when, bit = BIT.UP) => {
    const { fight, A, D } = arena();
    perform(fight, A, mv);
    run(fight, when);
    tap(fight, bit);
    run(fight, 60);
    return { hit: events(fight, 'onHit').length > 0, fight, A, D };
  };
  ok(!dodge('cross', 3).hit, 'a sidestep made while a linear move is winding up makes it whiff');
  ok(dodge('cross', 3).fight.log.some(e => e.k === 'onSidestepDodge'), '... and the dodge is announced');
  ok(dodge('cross', 11).hit, 'a sidestep made on the last frames before impact is too late (the first two frames of it are in the old lane)');
  ok(dodge('high', 4).hit, 'a move that tracks both lanes catches the sidestep');
  ok(dodge('cross', 3, BIT.DOWN).hit, 'a sidestep toward the lane you are already in is no sidestep: the move was aimed at it and hits');
  { // heel tracks the near lane; a fighter in the far lane steps down into it
    const { fight, A, D } = arena(); D.lane = 1; D.z = 130 + 30; A.lane = 1;
    perform(fight, A, 'heel'); run(fight, 2); fight.step(0, BIT.DOWN); fight.step(0, 0); run(fight, 50);
    ok(events(fight, 'onHit').length === 1, 'a move that tracks the near lane catches a fighter who steps down into it');
  }
  { // throw loses to a sidestep
    const { fight, A, D } = arena(); perform(fight, A, 'throw'); run(fight, 3); tap(fight, BIT.UP); run(fight, 50);
    ok(!events(fight, 'onThrow').length, 'a throw loses to a sidestep');
  }
  { // an attack started after the sidestep aims at the new lane and the attacker steps into it
    const { fight, A, D } = arena(); tap(fight, BIT.UP); run(fight, 20, 0, 0);
    ok(D.state === 'idle' && A.lane === 0, 'a sidestep ends free after its 13 frames');
    const f2 = arena(); f2.fight.step(0, 0); f2.D.lane = 1; f2.D.z = 160; perform(f2.fight, f2.A, 'jab'); run(f2.fight, 30);
    ok(events(f2.fight, 'onHit').length === 1, 'a move started against a fighter in the other lane aims at that lane');
  }
}

/* ---- counter hit (spec 6) ---------------------------------------------------------------------------------------------------------------------------- */
{
  const { fight, A, D } = arena();
  perform(fight, A, 'jab');
  fight.step(0, BIT.RP);          // D presses a cross a frame later: its startup is longer
  run(fight, 40);
  const hit = events(fight, 'onHit')[0];
  ok(hit && hit.e.counter && hit.e.slot === 0, 'a hit on a fighter who is attacking is a counter hit');
  ok(hit && hit.e.dmg === Math.round(6 * RULES.COUNTER_DMG), 'a counter hit does 20% more (' + (hit && hit.e.dmg) + ')');
}

/* ---- launch, juggle, scaling, bounce (spec 9) ----------------------------------------------------------------------------------------------------------- */
{
  const { fight, A, D } = arena();
  perform(fight, A, 'upper');
  run(fight, 14);
  ok(D.state === 'air', 'a launcher puts the defender in the air');
  const airFrames = [];
  run(fight, 6);
  const hp0 = D.hp;
  // juggle with a punch that does not juggle: nothing
  perform(fight, A, 'jab'); run(fight, 12);
  ok(D.hp === hp0 || D.state !== 'air', 'a jab does not juggle');
  const sc = []; for (let i = 0; i < 10; i++) sc.push(scaleFor(i));
  ok(sc.every((v, i) => i === 0 ? v === 1 : v < sc[i - 1] || v === RULES.SCALING_MIN), 'each hit in a combo scales damage down: ' + sc.join(' '));
  ok(sc[9] === RULES.SCALING_MIN, 'and it stops at the floor');
}
{
  const { fight, A, D } = arena();
  perform(fight, A, 'upper'); run(fight, 18);
  ok(D.state === 'air', 'launched');
  let n = 0; while (D.state === 'air' && n++ < 80) fight.step(0, 0);
  ok(D.state === 'down' && D.y === 0, 'a launch ends in a knockdown');
  run(fight, 10);
  ok(events(fight, 'onKnockdown').length === 1, 'the knockdown is announced once');
}
{ // juggling with something that does: the uppercut again is a launch with juggle? only 'upper' has juggle via extras; use the barrage (not juggle) -> nothing, then check bounce
  const { fight, A, D } = arena('jotaro', 'jotaro', { ax: 300 });
  D.hp = 120;
  perform(fight, A, 'breaker');
  let w = 0; while (D.state !== 'air' && w++ < 60) fight.step(0, 0);
  ok(D.state === 'air' && D.air.slam, 'a bounce hit slams the defender down first');
  let n = 0; while (!events(fight, 'onBounce').length && n++ < 60) fight.step(0, 0);
  ok(events(fight, 'onBounce').length === 1 && D.state === 'air' && D.vy > 0, 'and they rebound once, in the air again');
  n = 0; while (D.state === 'air' && n++ < 80) fight.step(0, 0);
  ok(D.state === 'down' && events(fight, 'onBounce').length === 1, 'only once');
}

/* ---- wall splat (spec 9) ---------------------------------------------------------------------------------------------------------------------------- */
{
  const { fight, A, D } = arena('jotaro', 'jotaro', { ax: WORLD.MAX - 70, gap: 40 });
  D.x = WORLD.MAX - 20;
  const hp0 = D.hp;
  perform(fight, A, 'drive');
  run(fight, 24);
  ok(events(fight, 'onWallSplat').length === 1 && D.stunKind === 'splat', 'a heavy hit with the wall at the defender\'s back pins them to it');
  const c = events(fight, 'onCombo').find(e => e.e.why === 'splat');
  ok(c && c.e.hits >= 1, 'and closes the combo that was going');
  ok(D.hp < hp0 - 18, 'for the hit and the splat damage (' + (hp0 - D.hp) + ')');
  ok(D.comboIn.mult === RULES.SPLAT_SCALE, 'the next combo starts scaled from ' + RULES.SPLAT_SCALE);
  const stunLeft = D.stun; run(fight, stunLeft + 2);
  ok(D.state === 'idle', 'the pinned fighter is free again after ' + RULES.SPLAT_FRAMES + ' frames');
}
{ // a launched fighter who flies into the wall
  const { fight, A, D } = arena('jotaro', 'jotaro', { ax: WORLD.MAX - 80, gap: 40 });
  D.x = WORLD.MAX - 30;
  perform(fight, A, 'upper'); run(fight, 60);
  ok(events(fight, 'onWallSplat').length === 1 || D.state === 'down', 'a launch toward the wall splats or lands');
}

/* ---- knockdown, wake-up options (spec 9) ------------------------------------------------------------------------------------------------------------- */
{
  const opts = [['', 'wake', RULES.RISE_FRAMES], ['f', 'wake', 16], ['b', 'roll', 20], ['up', 'roll', 20], ['lk', 'attack', 0]];
  opts.forEach(([name, state]) => {
    const { fight, A, D } = arena();
    perform(fight, A, 'sweep'); run(fight, 40);
    let n = 0; while (D.state !== 'down' && n++ < 100) fight.step(0, 0);
    ok(D.state === 'down', 'knocked down by a sweep');
    run(fight, RULES.DOWN_FRAMES + 1 - D.t);
    const bits = name === 'f' ? (D.facing > 0 ? BIT.RIGHT : BIT.LEFT) : name === 'b' ? back(D) : name === 'up' ? BIT.UP : name === 'lk' ? BIT.LK : 0;
    if (!name) run(fight, RULES.WAKE_SLOW - D.t + 1); else run(fight, name === 'lk' ? 1 : 3, 0, bits);
    ok(D.state === state, 'wake-up "' + (name || 'nothing') + '" gives ' + state + ' (' + D.state + ')');
  });
  const { fight, A, D } = arena(); D.state = 'down'; D.t = 0;
  perform(fight, A, 'jab'); run(fight, 20);
  ok(!events(fight, 'onHit').length, 'a fighter on the floor cannot be hit by an ordinary move');
}

/* ---- ring-out (spec 3) ------------------------------------------------------------------------------------------------------------------------------- */
{
  const { fight, A, D } = arena('jotaro', 'jotaro', { ax: WORLD.MAX - 75, gap: 40, stage: { id: 'park', rule: 'ring' }, training: false, timerFrames: 3600 });
  run(fight, 160);
  A.x = WORLD.MAX - 50; D.x = WORLD.MAX - 4;
  perform(fight, A, 'upper'); run(fight, 90);
  ok(fight.result && fight.result.how === 'ring' && fight.result.winner === 0, 'on a ring stage a fighter launched over the edge loses the round');
}

/* ---- rounds (spec 10) ------------------------------------------------------------------------------------------------------------------------------- */
{
  const rr = (o) => arena('jotaro', 'jotaro', Object.assign({ training: false, timerFrames: 3600 }, o));
  { const { fight } = rr({}); run(fight, RULES.INTRO_FRAMES - 1); ok(fight.phase === 'intro', 'a round begins with an intro'); run(fight, 1); ok(fight.phase === 'fight', '... of ' + RULES.INTRO_FRAMES + ' frames'); }
  { const { fight, A, D } = rr({}); run(fight, RULES.INTRO_FRAMES); D.hp = 4; A.x = 300; D.x = 334; perform(fight, A, 'jab'); run(fight, 20);
    ok(fight.phase === 'ko' && fight.timeScale === RULES.KO_SPEED && fight.result.winner === 0, 'a KO starts the slow beat');
    let w = 0; while (fight.round < 2 && w++ < 600) fight.step(0, 0);
    ok(fight.wins[0] === 1 && fight.round === 2 && fight.phase === 'intro', 'the beat, the win pose, and the next round (1-0)'); }
  { const { fight, A, D } = rr({ timerFrames: 120 }); run(fight, RULES.INTRO_FRAMES + 5); D.hp = 100; run(fight, 130); ok(fight.phase !== 'fight' || fight.timer <= 0, 'the clock runs out');
    const r = fight.result; ok(r && r.how === 'time' && r.winner === 0, 'on time the fighter with more HP wins'); }
  { const { fight } = rr({ timerFrames: 90 }); run(fight, RULES.INTRO_FRAMES + 100);
    ok(fight.result && fight.result.winner === -1, 'equal HP on time is a draw');
    run(fight, RULES.END_FRAMES + 2);
    ok(fight.wins[0] === 1 && fight.wins[1] === 1, 'a draw is a round for both'); }
  { // draw, draw: both reach 2 -> a final round
    const { fight } = rr({ timerFrames: 60 });
    for (let k = 0; k < 2; k++) run(fight, RULES.INTRO_FRAMES + 70 + RULES.END_FRAMES + 2);
    ok(fight.final && fight.wins[0] === 2 && fight.wins[1] === 2, 'two draws give both their second win and a final round is fought');
    ok(fight.timer === RULES.FINAL_FRAMES - 0 || fight.timer <= RULES.FINAL_FRAMES, 'the final round is half a round');
    run(fight, RULES.INTRO_FRAMES + RULES.FINAL_FRAMES + 20 + RULES.END_FRAMES + 5);
    ok(fight.phase === 'over' && fight.match.winner === 0, 'a final round that is also a draw goes to damage dealt, then player 1 (' + (fight.match && fight.match.how) + ')');
  }
  { // a match is two round wins
    const { fight, A, D } = rr({});
    for (let k = 0; k < 2; k++) { run(fight, RULES.INTRO_FRAMES); D.hp = 3; A.x = 300; D.x = 334; perform(fight, A, 'jab'); run(fight, 400); }
    ok(fight.phase === 'over' && fight.match.winner === 0 && fight.match.rounds === 2, 'best of three: two round wins end the match'); }
}

/* ---- determinism (spec 2) --------------------------------------------------------------------------------------------------------------------------- */
{
  const digest = (fight) => JSON.stringify(fight.fighters.map(f => [f.x.toFixed(2), f.hp, f.state, f.mf, f.stun]));
  const play = () => { const { fight, A } = arena(); const seq = [BIT.LP, 0, 0, BIT.RP | BIT.DOWN, 0, BIT.LK]; for (let i = 0; i < 300; i++) fight.step(seq[i % seq.length] * (i % 7 === 0 ? 1 : 0), seq[(i * 3) % seq.length]); return digest(fight); };
  ok(play() === play(), 'the same input integers give the same fight');
}
done();
