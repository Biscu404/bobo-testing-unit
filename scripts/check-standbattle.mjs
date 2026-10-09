#!/usr/bin/env node
/* Stand Battle Arena, played through the real window with the real keys (the pure checks in apps/standbattle prove the rules; this proves the screens join up):
     title -> menu -> select -> versus screen -> a fight in which the keys move and hit; pause -> quit to the menu (the run is abandoned);
     training; versus 2P (both players pick, then the place, and player 2's arrow keys move player 2); a second player who joins an arcade run on their keys;
     the move list, records and options; a fight at the real frame rate; closing the window leaves nothing running.
   SCREENS=<dir> saves a picture of each screen there. Run:
     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-standbattle.mjs */
import { launchTarget } from './lib/target.mjs';
import { mkdirSync } from 'node:fs';

const SHOTS = process.env.SCREENS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1400, height: 900 } });
const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 160)); });
let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} - ${m}`); if (!c) fails++; };

await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => typeof window.powerOn === 'function'); await page.evaluate(() => window.powerOn());
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });
await page.evaluate(() => import('/kernel/wm.js').then(m => m.openWindow('standbattle')));
await page.waitForSelector('canvas.sbcanvas', { state: 'visible', timeout: 15000 });

/* the app object itself, held as a handle: a function given to A runs in the page with the app as its argument (the page's CSP forbids eval, so nothing is built from a string) */
const appH = await page.evaluateHandle(() => import('/apps/standbattle/index.js').then(m => m.default._app));
const A = fn => appH.evaluate(fn);
const scene = () => A(app => app.sceneName);
const waitScene = async (name, ms = 12000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await scene() === name) return true; await page.waitForTimeout(60); } return false; };
const key = async (code, hold = 70) => { await page.keyboard.down(code); await page.waitForTimeout(hold); await page.keyboard.up(code); await page.waitForTimeout(60); };
const shot = async name => { if (SHOTS) await page.locator('canvas.sbcanvas').screenshot({ path: SHOTS + '/' + name + '.png' }); };
const focus = () => page.focus('canvas.sbcanvas');
const fighters = () => A(app => app.fight ? { phase: app.fight.phase, tick: app.fight.tick, x: app.fight.fighters.map(f => Math.round(f.x)), state: app.fight.fighters.map(f => f.state), hp: app.fight.fighters.map(f => f.hp), moves: app.fight.fighters.map(f => f.stats.hits + f.stats.whiffs + f.stats.blocks), round: app.fight.round } : null);
const intoFight = async () => { for (let i = 0; i < 12 && await scene() !== 'fight'; i++) { await key('Enter'); await page.waitForTimeout(250); } return waitScene('fight', 4000); };
const untilFighting = async () => { const t0 = Date.now(); while (Date.now() - t0 < 9000) { const f = await fighters(); if (f && f.phase === 'fight') return true; await page.waitForTimeout(100); } return false; };

await focus();
ok(await waitScene('title', 8000), 'the app opens on its title');
await shot('01-title');
await key('Enter');
ok(await waitScene('menu', 3000), 'any key leaves the title for the menu');
await shot('02-menu');

/* ---- arcade: select, versus screen, a fight ---- */
await key('Enter');
ok(await waitScene('select', 3000), 'ARCADE goes to the character select');
await shot('03-select');
await key('Enter');
ok(await waitScene('vs', 3000), 'choosing a fighter shows the versus screen');
await shot('04-vs');
ok(await intoFight(), 'the versus screen leads to the fight');
ok(await untilFighting(), 'the round intro ends and the fight begins');
await shot('05-fight');
{
  const a = await fighters();
  await page.keyboard.down('KeyD'); await page.waitForTimeout(700); await page.keyboard.up('KeyD');
  const b = await fighters();
  ok(b.x[0] > a.x[0] + 10 || b.state[0] !== 'idle', 'holding D walks player 1 forward (' + a.x[0] + ' -> ' + b.x[0] + ')');
  for (let i = 0; i < 6; i++) { await key('KeyU', 50); await page.waitForTimeout(250); await key('KeyJ', 50); await page.waitForTimeout(250); }
  const c = await fighters();
  ok(c.moves[0] > b.moves[0] || c.hp[1] < b.hp[1], 'LP and LK swing: the fight counted the swings (' + b.moves[0] + ' -> ' + c.moves[0] + ')');
  /* the sim runs at 60 ticks a second of real time while the round is live */
  const t0 = await fighters(), w0 = Date.now();
  const fps = await page.evaluate(() => new Promise(res => { let n = 0; const t = performance.now(); (function f(ts) { n++; if (ts - t >= 2000) res(Math.round(n * 1000 / (ts - t))); else requestAnimationFrame(f); })(t); }));
  const t1 = await fighters(), secs = (Date.now() - w0) / 1000;
  ok(fps >= 30, 'the fight draws at ' + fps + ' frames a second (a floor of 30: Xvfb draws in software)');
  const rate = t1 && t0 && t1.round === t0.round && t1.phase === 'fight' ? (t1.tick - t0.tick) / secs : null;
  ok(rate == null || (rate > 50 && rate < 70), 'the fight steps at the sim\'s 60 ticks a second (' + (rate == null ? 'the round changed during the measure, skipped' : rate.toFixed(1)) + ')');
}
await key('Escape');
await page.waitForTimeout(200);
await shot('06-pause');
await key('ArrowDown'); await key('Enter');
ok(await waitScene('menu', 3000), 'PAUSE, QUIT TO MENU leaves the fight for the menu');
ok(await A(app => app.session === null && app.fight === null), 'the abandoned run is gone, no fight is left running');

/* ---- training ---- */
for (let i = 0; i < 5; i++) await key('ArrowDown');
await key('Enter');
ok(await waitScene('select', 3000), 'TRAINING goes to the select');
await key('Enter'); await key('Enter');
ok(await waitScene('training', 4000), 'TRAINING: pick yours, pick the opponent, and the training room opens');
await page.waitForTimeout(600);
await key('KeyU'); await page.waitForTimeout(400);
await shot('07-training');
await key('Tab'); await page.waitForTimeout(200);
await shot('08-training-menu');
await key('Tab');
await key('Escape'); await page.waitForTimeout(150); await key('Escape');
await page.evaluate(() => 0);
await A(app => app.go('menu'));

/* ---- versus 2P: both players pick, then the place ---- */
await key('ArrowDown');
await key('Enter');
ok(await waitScene('select', 3000), 'VERSUS goes to the select');
await key('ArrowRight');
await key('KeyU');                                    /* player 1: LP is "OK" */
await key('KeyK');                                    /* player 2: LP is "OK" */
await shot('09-versus-stage');
await key('Enter');
ok(await intoFight(), 'VERSUS: both pick, player 1 picks the place, the fight begins');
ok(await untilFighting(), 'the versus fight goes live');
{
  const a = await fighters();
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(700); await page.keyboard.up('ArrowLeft');
  const b = await fighters();
  ok(b.x[1] < a.x[1] - 10 || b.state[1] !== 'idle' || b.x[1] !== a.x[1], 'player 2\'s arrow keys move player 2 (' + a.x[1] + ' -> ' + b.x[1] + ')');
  ok(Math.abs(b.x[0] - a.x[0]) <= 20, 'and player 1 stays where they were: the second player\'s keys are not player 1\'s (' + a.x[0] + ' -> ' + b.x[0] + ')');
}
await shot('10-versus-fight');
await A(app => { app.dev.single = true; app.go('menu'); });

/* ---- a second player joins an arcade run ---- */
await key('Enter');
ok(await waitScene('select', 3000), 'ARCADE goes to the select again');
await key('KeyK');
ok(await A(app => app.sceneName === 'select' && app.dev.single === false), 'a second player who presses a button on their keys joins in');
await shot('11-pickup');
await A(app => { app.dev.single = true; app.go('menu'); });

/* ---- the other screens ---- */
for (const [n, label] of [[6, 'movelist'], [7, 'records'], [8, 'options']]) {
  await A(app => app.go('menu'));
  for (let i = 0; i < n; i++) await key('ArrowDown');
  await key('Enter');
  ok(await waitScene(label, 3000), label.toUpperCase() + ' opens');
  await page.waitForTimeout(250);
  await shot('12-' + label);
  await key('Escape');
  ok(await waitScene(label === 'movelist' ? 'menu' : 'menu', 3000), label.toUpperCase() + ' goes back to the menu');
}

/* ---- closing the window ---- */
const wins = () => page.evaluate(() => document.querySelectorAll('.win').length);
const before = await wins();
await page.evaluate(() => { const ws = [...document.querySelectorAll('.win')], w = ws[ws.length - 1]; w.querySelector('.x').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true })); });
await page.waitForTimeout(500);
ok(await wins() === before - 1, 'the window closes');
ok(await page.evaluate(async () => (await import('/apps/standbattle/index.js')).default._app == null), 'and the app is let go');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.slice(0, 4).join(' | ') : ''));
await t.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nStand Battle: every screen joins up.');
process.exit(fails ? 1 : 0);
