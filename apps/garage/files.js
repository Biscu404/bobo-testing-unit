/* Keeping songs and fetching them: save (quietly over the same file, or under a new name),
   open (yours, the demos, or a MIDI file from outside), and the question that stands between
   you and losing what you were doing. */
import { el, btn, modal, confirmBox } from './ui.js';
import { demoSongs } from './songs.js';

const DIR = '::/Home/Songs';

export function makeFiles(api) {
  const G = api.G, ctx = api.ctx, L = api.lang;
  const announce = () => { ['::/Home/Songs', '::/Home'].forEach(d => window.dispatchEvent(new CustomEvent('vfs-changed', { detail: { dir: d } }))); };
  const fileFor = title => DIR + '/' + (title.replace(/[^A-Z0-9 _-]/gi, '').trim().replace(/\s+/g, '_').toUpperCase() || 'SONG') + '.SONG';

  async function write(path) {
    await ctx.fs.write(path, { type: 'song', content: L.serialize(G.song) });
    G.path = path; G.dirty = false; announce(); api.changed('saved');
    api.toast('SAVED: ' + path); api.trophy.saved();
  }
  /* asNew: always ask for a name. Otherwise the song already has a file, and that is what is written. */
  function save(asNew, then) {
    if (G.path && !asNew) { write(G.path).then(() => then && then()); return; }
    ctx.ask(asNew ? 'SAVE AS...' : 'NAME YOUR SONG', G.song.title, async v => {
      v = (v || '').trim();
      if (!v) return;
      G.song.title = v.toUpperCase().slice(0, 24);
      await write(fileFor(G.song.title));
      if (then) then();
    });
  }
  /* run `next`, after asking about whatever has not been saved */
  function guard(next) {
    if (!G.dirty) { next(); return; }
    confirmBox(api.root, 'UNSAVED CHANGES', 'THE SONG HAS CHANGES THAT HAVE NOT BEEN SAVED. WHAT NOW?', [
      ['SAVE FIRST', 'g-go', () => save(false, next)], ['DISCARD THEM', '', next], ['CANCEL', '', null]]);
  }
  const newSong = () => guard(() => api.startSong(api.fresh()));

  function importMidi() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.mid,.midi,audio/midi';
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        const song = api.studio.midi.fromMidi(new Uint8Array(await f.arrayBuffer()), f.name);
        api.startSong(song); api.trophy.imported(); api.toast('IMPORTED ' + song.tracks.length + ' TRACK' + (song.tracks.length === 1 ? '' : 'S') + ' FROM ' + f.name.toUpperCase() + '. SAVE IT TO KEEP IT.'); G.dirty = true;
      } catch (e) { api.toast(e.message); }
    });
    inp.click();
  }

  async function openSongs() {
    const m = modal(api.root, 'OPEN A SONG', 'g-small');
    const mine = (await ctx.fs.list(DIR)).filter(f => /\.SONG$/i.test(f.name));
    m.body.appendChild(btn('IMPORT A MIDI FILE...', 'g-go', () => { m.close(); guard(importMidi); }, 'READ A .MID FROM YOUR COMPUTER'));
    m.body.appendChild(el('div', 'g-famhead', 'MY SONGS'));
    if (!mine.length) m.body.appendChild(el('div', 'g-p g-dim', 'NONE YET. PRESS SAVE TO KEEP ONE.'));
    mine.forEach(f => m.body.appendChild(btn(f.name.replace(/\.SONG$/i, ''), 'g-line', () => {
      m.close();
      guard(async () => {
        const rec = await ctx.fs.read(DIR + '/' + f.name);
        try { api.startSong(L.deserialize(rec.content), DIR + '/' + f.name); } catch (e) { api.toast('THAT SONG WOULD NOT OPEN.'); }
      });
    })));
    m.body.appendChild(el('div', 'g-famhead', 'DEMO SONGS'));
    demoSongs(L).forEach(d => m.body.appendChild(btn(d.title + '   ' + d.bpm + ' BPM', 'g-line', () => { m.close(); guard(() => api.startSong(JSON.parse(JSON.stringify(d)))); })));
  }
  return { save, guard, newSong, openSongs, importMidi, write };
}
