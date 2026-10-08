/* The Studio Course, part one, chapters 7 and 8: working on a stretch of song (the segment strip), and keeping, bringing back and
   sharing a song (BAND IN A BOX, BARS and TRIM, SAVE, OPEN, EXPORT, help). See course_tour_a.js for what a step is. */
import { notesOf, noteCount } from './course_util.js';

const range = (C, a, b) => !!C.G.range && Math.abs(C.G.range.a - a) <= 1 && Math.abs(C.G.range.b - b) <= 1;

export const CH_C = [
  { id: 'segments', title: 'A STRETCH OF SONG', blurb: 'Pick bars across every track: loop, copy, repeat, clear, remove, gap.', needsPractice: true, fresh: true, steps: [
    { id: 'pick', say: ['Drag along the ruler and you pick a STRETCH of the song: the same bars in every track at once, shaded blue. Double-click the ruler to pick a whole bar. A strip of buttons appears under the toolbar, and the same copy, cut, paste and duplicate you used on notes now work on bars.'],
      goals: [['Drag along the ruler to pick bars 3 and 4.', C => range(C, 8, 16)]], target: ['zone:ruler'], hint: 'Bar 3 starts at the 3 on the ruler. Drag from the 3 to the 5; the edges of the blue snap to the grid.' },
    { id: 'loop', say: ['LOOP IT plays only the picked stretch, round and round: the way to practise one hard part, or to hear a change as you make it. (The LOOP button in the top bar does the same.)'],
      goals: [['Press LOOP IT in the strip.', C => C.used('loopRange') && C.G.loop], ['Press PLAY and hear the stretch repeat.', C => !!C.api.player()], ['Stop, and switch LOOP off.', C => !C.api.player() && !C.G.loop]], seq: true, target: ['btn:LOOP IT'] },
    { id: 'paste', say: ['COPY takes the stretch; PASTE lays it over the song at the yellow cursor, replacing what is there; PASTE+PUSH makes room first, moving everything after the cursor later. DUPLICATE copies the stretch straight after itself, and x4 repeats it four times in all.'],
      goals: [['Press COPY in the strip.', C => C.used('copy')], ['Click the ruler at the start of bar 5, then press PASTE+PUSH: the song gets longer.', C => C.calls('paste').some(a => a[0] === true) && C.song.bars > C.start.bars]], seq: true, target: ['btn:COPY', 'btn:PASTE+PUSH'], hint: 'PASTE+PUSH is the second paste button in the strip.' },
    { id: 'dup', say: ['DUPLICATE and x4 are how a four-bar idea becomes a song. After DUPLICATE the new copy is picked, so you can press it again, and again.'],
      goals: [['Press DUPLICATE.', C => C.used('duplicate')], ['Press x4.', C => C.used('repeat')]], seq: true, target: ['btn:DUPLICATE', 'btn:x4'] },
    { id: 'clear', fresh: true, say: ['Three buttons make a hole. CLEAR empties the stretch and leaves the silence in the song. REMOVE takes the notes and the time out together and closes the gap. ADD GAP does the opposite: it inserts as much silence as the stretch is long, pushing everything later.', 'Each one can be undone, so try them all (and press UNDO between).'],
      goals: [['Pick a stretch and press CLEAR.', C => C.calls('del').some(a => !a[0]) && C.G.range], ['Press REMOVE.', C => C.calls('del').some(a => a[0] === true)], ['Press ADD GAP.', C => C.used('gap')]], seq: false, target: ['btn:CLEAR', 'btn:REMOVE', 'btn:ADD GAP'], hint: 'You will need to pick a stretch again after REMOVE, which drops the pick.' },
    { id: 'only', fresh: true, say: ['THIS TRACK ONLY is a tick in the strip: the stretch commands act on the selected track instead of all of them. It is how you silence one instrument for four bars, or copy only the drums.'],
      goals: [['Pick bars 3 and 4, tick THIS TRACK ONLY.', C => !!C.G.range && C.G.segOnly], ['Select the DRUMS card and press CLEAR: only the drums are emptied.', C => { const d = C.track('p_drm'), w = C.was('p_drm'); return !!d && !!w && (d.hits || []).length < (w.hits || []).length && notesOf(C.track('p_bas')).length === notesOf(C.was('p_bas')).length; }]], seq: true, target: ['css:.g-onlybox', 'btn:CLEAR'] },
    { id: 'drop', say: ['The ✕ at the end of the strip (or Esc) drops the pick. The song itself stays exactly as it is.'],
      goals: [['Press ✕ in the strip, or Esc.', C => !C.G.range]], target: ['btn:✕'] }
  ] },

  { id: 'files', title: 'BAND, BARS AND FILES', blurb: 'BAND IN A BOX, trimming, saving, opening, exporting.', needsPractice: true, fresh: true, steps: [
    { id: 'band', say: ['BAND IN A BOX writes the rhythm section for you: drums, bass and chords in the key of your song, in the style and with the chord run you choose. It replaces any old DRUMS, BASS, CHORDS and PAD tracks, leaves your tune alone, and CTRL+Z takes it back.'],
      goals: [['Press BAND IN A BOX, choose ROCK as the style, and press ADD THE BAND.', C => C.used('band') && C.song.tracks.some(t => !C.was(t.id))]], target: ['btn:BAND IN A BOX'], hint: 'Pick a STYLE, then a CHORDS row, then ADD THE BAND.' },
    { id: 'bars', say: ['BARS is how long the song is. It grows by itself when you write past the end, but you can set it by hand. TRIM cuts the song off where the last note ends, so you never export four bars of silence.'],
      goals: [['Set BARS to 16.', C => C.song.bars === 16], ['Press TRIM: the song ends where the music does.', C => C.used('trim') && C.song.bars < 16]], seq: true, target: ['css:.g-barbox', 'btn:TRIM'] },
    { id: 'save', say: ['SAVE keeps the song in HOME/SONGS: name it once, and after that SAVE (CTRL+S) writes over the same file. SAVE AS keeps it under a new name. NEW starts an empty song, and OPEN brings one back: MY SONGS, the demos, or a MIDI file from outside.'],
      goals: [['Press SAVE and name the song.', C => !!C.G.path && !C.G.dirty], ['Press SAVE AS and give it another name.', C => C.calls('save').some(a => a[0] === true)], ['Press OPEN and look at MY SONGS, then close it.', C => C.used('openSongs')]], seq: true, target: ['btn:SAVE', 'btn:SAVE AS', 'btn:OPEN'], hint: 'The keys: CTRL+S, and CTRL+O for OPEN.' },
    { id: 'export', say: ['EXPORT bakes the song into a file. A WAV is the finished sound (16 or 24 bit, with the whole song, the picked stretch or the loop, and a tail so the ROOM can ring out), STEMS is one WAV per track so you can mix elsewhere, and MIDI is the notes and the tempo, for another program to play with different sounds. The dialog tells you the peak and loudness it came out at.'],
      goals: [['Press EXPORT and look at the choices (you do not have to save anything).', C => C.used('exportDialog')]], target: ['btn:EXPORT'] },
    { id: 'help', say: ['Two last things. The ? button (or F1) is the cheat sheet of every key. And LEARN is THE BASICS: the eight short lessons that teach music itself, which are worth doing if the words in this course (key, scale, chord, tempo) are new.'],
      goals: [['Press ? to see the keys, then close it.', C => C.used('help')]], target: ['btn:?', 'btn:LEARN'] },
    { id: 'done', manual: true, say: ['That is every button in the Garage. The next chapter is where it all pays off: you choose a style, and the course helps you write a whole song in it.'], target: [] }
  ] }
];
void noteCount;
