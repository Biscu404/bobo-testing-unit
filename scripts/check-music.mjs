#!/usr/bin/env node
/* The instruments and the studio: every instrument in assets/instruments/ loads and decodes,
   every one makes sound when asked for a scale (rendered offline, so no speaker is needed), held
   instruments carry usable loop points, the drum kit has all its pieces, the song notation round
   trips, every bundled song renders, the real-time player starts and stops cleanly, and the
   Garage opens and closes without an error.

     xvfb-run -a -s "-screen 0 1920x1080x24" node scripts/check-music.mjs */
import { launchTarget } from './lib/target.mjs';

const t = await launchTarget();
const page = await t.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });

await page.goto(t.url, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { if (window.powerOn) window.powerOn(); });
await page.waitForSelector('#bootcursor', { state: 'attached', timeout: 30000 });
await page.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: '~', code: 'Backquote', bubbles: true, cancelable: true })));
await page.waitForSelector('#shell', { state: 'visible', timeout: 15000 });
await page.waitForTimeout(500);

let fails = 0;
const ok = (cond, msg) => { if (!cond) fails++; console.log((cond ? 'PASS' : 'FAIL') + ' - ' + msg); };

const r = await page.evaluate(async () => {
  const { Studio } = await import('/kernel/studio.js');
  const L = Studio.lang, Ins = Studio.ins;
  const { demoSongs } = await import('/apps/garage/songs.js');
  const out = { bad: [], quiet: [], clip: [], noloop: [], notes: [], kit: [], songs: [], text: {} };
  const man = await Ins.index();
  out.count = man.instruments.length;
  out.kit = (man.drums && man.drums.hits || []).map(h => h.key);
  const peak = buf => { let p = 0, first = -1; const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > p) p = a; if (first < 0 && a > 0.002) first = i; } return { p, first: first < 0 ? -1 : first / buf.sampleRate }; };
  for (const meta of man.instruments) {
    try {
      const bank = await Ins.load(meta.id);
      if (bank.items.length < 4) out.bad.push(meta.id + ': only ' + bank.items.length + ' samples');
      if (meta.kind === 'hold') meta.samples.forEach(s => { if (!s.loop || s.loop[1] - s.loop[0] < 0.3) out.noloop.push(meta.id + ' ' + s.midi); });
      const lo = meta.samples[0].midi, hi = meta.samples[meta.samples.length - 1].midi, mid = Math.round((lo + hi) / 2);
      const song = L.newSong({ bpm: 120, bars: 2 });
      const tr = L.newTrack({ inst: meta.id, reverb: 0 });
      [0, 2, 4, 5, 7, 9, 11, 12].forEach((d, i) => tr.notes.push([i * 0.5, 0.5, Math.max(lo, Math.min(hi, mid - 6 + d)), 0.8]));
      song.tracks.push(tr);
      const pk = peak(await Studio.render(song, { level: 1 }));
      if (pk.p < 0.02) out.quiet.push(meta.id + ' peak ' + pk.p.toFixed(3));
      if (pk.p > 1.0) out.clip.push(meta.id + ' peak ' + pk.p.toFixed(2));
      if (pk.first < 0 || pk.first > 0.2) out.bad.push(meta.id + ': first sound at ' + pk.first);
    } catch (e) { out.bad.push(meta.id + ': ' + e.message); }
  }
  for (const s of demoSongs(L)) {
    try {
      const pk = peak(await Studio.render(s, { level: 1 }));
      out.songs.push([s.title, +pk.p.toFixed(2)]);
    } catch (e) { out.bad.push('song ' + s.title + ': ' + e.message); }
  }
  /* the notation */
  const n = L.parseNotes('C4:q E4 G4:h | C4+E4+G4:w r:q F#3:e!60');
  out.text.notes = n.length === 7 && n[2][1] === 2 && n[3][2] === 60 && n[6][2] === 54;
  out.text.dotted = L.parseNotes('C4:q.')[0][1] === 1.5;
  out.text.chord = JSON.stringify(L.chordNotes('Am', 60)) === '[57,60,64]';
  const song = L.buildSong({ title: 'T', bpm: 90, key: 'C', scale: 'major', bars: 2, tracks: [{ name: 'M', inst: 'piano', notes: 'C4:q D4 E4' }, { name: 'D', drums: { kick: 'x...', snare: '..x.' } }] });
  out.text.round = JSON.stringify(L.deserialize(L.serialize(song)).tracks.map(t => t.notes.length + ':' + (t.hits || []).length)) === JSON.stringify(song.tracks.map(t => t.notes.length + ':' + (t.hits || []).length));
  out.text.prog = JSON.stringify(L.progression('C', 'major', 'pop', 4)) === '["C","G","Am","F"]';
  /* the live player */
  const p = Studio.play(song, { loop: true });
  await new Promise(r => setTimeout(r, 700));
  const b1 = p.beat();
  await new Promise(r => setTimeout(r, 500));
  out.playerMoves = p.beat() > b1;
  p.stop();
  out.followAfter = Studio.follow;

  /* the studio's newer parts: a player that can be sought, looped and faded, and a long render in stretches */
  const q = Studio.play(song, { channel: 'check', loop: true, loopFrom: 1, loopTo: 3, from: 2 });
  await new Promise(r => setTimeout(r, 300));
  q.seek(1); await new Promise(r => setTimeout(r, 250));
  out.seek = q.beat() >= 0.9 && q.beat() < 3.2;
  q.fade(0.3, 0.2); await new Promise(r => setTimeout(r, 350));
  out.fade = Math.abs(q.mix.master.gain.value - 0.3) < 0.08;
  q.stop(0.1);
  const long = L.buildSong({ title: 'L', bpm: 240, key: 'C', scale: 'major', bars: 40, tracks: [{ name: 'M', inst: 'piano', notes: 'C4:q E4 G4 C5', reverb: 0.1 }] });
  const lb = await Studio.render(long, { level: 1, tail: 2 });
  out.chunked = Math.abs(lb.duration - (160 * 60 / 240 + 2)) < 0.05 && peak(lb).p > 0.02;
  /* the games' scores, and the symphony */
  const mods = { bekkedal: await import('/apps/bekkedal/score.js'), elephant: await import('/apps/elephant/score.js') };
  const sb = await import('/apps/standbattle/score.js');
  const songs = [].concat(mods.bekkedal.IDS.map(i => mods.bekkedal.song(L, i)), mods.elephant.IDS.map(i => mods.elephant.song(L, i)), [sb.song(L)]);
  const badNote = n => !(n[1] > 0 && n[0] >= 0 && n[2] >= 24 && n[2] <= 108 && n[3] > 0 && n[3] <= 1.0001);
  out.scores = songs.map(sg => sg.title + ':' + sg.tracks.filter(t => (t.notes || []).some(badNote)).length).filter(x => !/:0$/.test(x));
  out.scoreCount = songs.length;
  out.layers = [...new Set(sb.song(L).tracks.map(t => t.layer))].sort().join();
  const sy = await import('/kernel/symphony.js'), sym = sy.symphony(L), harp = sym.tracks.find(t => t.name === 'HARP').notes;
  out.sym = { bars: sym.bars, secs: sy.SECONDS, tracks: sym.tracks.length, opening: harp.slice(0, 7).map(n => n[2]).join(), badNotes: sym.tracks.reduce((a, t) => a + (t.notes || []).filter(badNote).length, 0) };
  const sb0 = await Studio.render(sym, { level: 0.5, from: 0, to: 32, tail: 1 });
  out.symStart = peak(sb0).p;
  return out;
});
ok(r.count >= 20, `at least twenty real instruments (${r.count}) and a drum kit of ${r.kit.length} pieces`);
ok(['kick', 'snare', 'hat', 'openhat', 'crash', 'clap'].every(k => r.kit.includes(k)), 'the kit has kick, snare, hats, crash and clap');
ok(!r.bad.length, 'every instrument decodes and sounds at once' + (r.bad.length ? ': ' + r.bad.join('; ') : ''));
ok(!r.quiet.length, 'none is silent' + (r.quiet.length ? ': ' + r.quiet.join('; ') : ''));
ok(!r.clip.length, 'none clips' + (r.clip.length ? ': ' + r.clip.join('; ') : ''));
ok(!r.noloop.length, 'every held instrument has a usable loop' + (r.noloop.length ? ': ' + r.noloop.slice(0, 4).join('; ') : ''));
ok(r.songs.length >= 5 && r.songs.every(s => s[1] > 0.05), `the bundled songs all render (${r.songs.map(s => s[0]).join(', ')})`);
ok(r.text.notes && r.text.dotted && r.text.chord && r.text.round && r.text.prog, 'the song notation parses, chords and progressions are right, songs round-trip');
ok(r.playerMoves && r.followAfter === 0, 'the real-time player runs, its playhead moves, and it lets go of everything when stopped');
ok(r.seek && r.fade, 'a player can be sought to a beat while it plays and faded on its own');
ok(r.chunked, 'a long song is rendered in stretches and comes out the right length');
ok(r.scoreCount === 11 && !r.scores.length, `the games' eleven songs for real instruments are all valid${r.scores.length ? ': ' + r.scores.join(', ') : ''}`);
ok(r.layers.includes('combat') && r.layers.includes('explore') && r.layers.includes('tension'), "Stand Battle's score carries its three layers");
ok(r.sym.bars === 100 && Math.abs(r.sym.secs - 150) < 0.5 && r.sym.tracks >= 12 && r.sym.badNotes === 0, `the symphony is a hundred bars, two and a half minutes, and sound all through (${r.sym.tracks} tracks)`);
ok(r.sym.opening === '72,76,79,84,88,91,96' && r.symStart > 0.05, 'and it opens on the notes of the delete sound (C E G C E G C) and is audible');

/* the app */
await page.evaluate(async () => { const wm = await import('/kernel/wm.js'); await wm.openWindow('garage'); });
await page.waitForSelector('.garage .g-grid', { timeout: 8000 });
await page.waitForTimeout(500);
const app = await page.evaluate(() => ({ tracks: document.querySelectorAll('.g-card').length, learn: !!document.querySelector('.g-learn'), keys: document.querySelectorAll('.g-wk').length }));
ok(app.tracks >= 1 && app.learn && app.keys >= 14, 'the Garage opens with a track, a keyboard and the LEARN button');
/* the first launch greets you; close the greeting like a person would */
if (await page.$('.g-modal')) await page.click('.g-modal .g-boxfoot .g-btn:last-child');
await page.click('.g-learn');
await page.waitForSelector('.g-lessons .l-item');
ok((await page.$$('.g-lessons .l-item')).length === 8, 'LEARN offers eight lessons');
ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors[0] : ''));
await t.close();
console.log(fails ? fails + ' check(s) FAILED' : 'ALL MUSIC CHECKS PASS');
process.exit(fails ? 1 : 0);
