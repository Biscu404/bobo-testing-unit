/* The Studio Course, part one, chapters 1 to 3: the practice song and the transport; key, scale and MAGIC NOTES; the tracks.
   A step is { id, say: [text | (C) => text], goals: [[text, (C) => bool, { on }?]], seq, hint, target: [...], action: [[label, fn]], manual }.
   A goal that has once been true stays ticked (`seq` makes each wait for the one before). C is the course's view of the Garage:
   C.song (live), C.start (the song as the step began), C.G, C.startG, C.track(id), C.was(id), C.pressed('LABEL') (times a button
   with that text was pressed since the step began), C.used('name') / C.calls('name') (what the Garage was asked to do), C.mem. */
import { notesOf } from './course_util.js';

const sel = (C, id) => C.song.tracks.findIndex(t => t.id === id);

export const CH_A = [
  { id: 'transport', title: 'HEAR IT: THE TRANSPORT', blurb: 'Load a practice song and learn every button on the top bar.', steps: [
    { id: 'load', say: ['Welcome to the studio. This course walks you through every button and control of the Garage, on a practice song of its own: SUNDAY MORNING, four tracks, eight bars. You will take it apart, change it and put it back together, and then write a whole song of your own in the style of your choice.',
      'Your own work is safe: if the song you have open has unsaved changes you will be asked first, and the Garage keeps a draft of it anyway.'],
      goals: [['Load the practice song.', C => C.song.course === 'practice']], action: [['LOAD THE PRACTICE SONG', C => C.loadPractice()]] },
    { id: 'play', say: ['The row of buttons across the top is the transport, the same as on any recorder. Press PLAY (SPACE does the same from anywhere in the Garage). The song starts from the yellow cursor, and the white line that runs across the roll is the playhead.', 'The numbers beside the buttons are the clock: bar and beat, then minutes and seconds.'],
      goals: [['Press PLAY and let it run for three seconds.', C => { if (C.api.player()) { C.mem.t = C.mem.t || Date.now(); return Date.now() - C.mem.t > 3000; } C.mem.t = 0; return false; }], ['Press STOP (the same button, or SPACE).', C => !C.api.player()], ['Press the ⏮ button to go back to the start.', C => C.pressed('⏮') >= 1]],
      seq: true, target: ['btn:PLAY', 'btn:⏮', 'css:.g-pos'], hint: 'PLAY turns into STOP while the music runs.' },
    { id: 'follow', say: ['While the music plays the roll scrolls by itself to keep the playhead in view. FOLLOW switches that off, so you can scroll or zoom about while it plays. (Shift and the wheel scroll sideways; Ctrl and the wheel zoom.)'],
      goals: [['Press FOLLOW to turn it off, then press it again to turn it back on.', C => C.pressed('FOLLOW') >= 2 && C.G.follow]], target: ['btn:FOLLOW'] },
    { id: 'loop', say: ['LOOP plays the whole song round and round, or just a stretch you pick (we will pick one in a later chapter). CLICK is a metronome: the strong click is beat 1 of the bar. COUNT-IN plays one bar of clicks before the music starts, so you can come in on time when you record.'],
      goals: [['Switch LOOP on.', C => C.G.loop], ['Switch CLICK on.', C => C.G.metro], ['Switch COUNT-IN on, press PLAY and hear the bar of clicks before the song.', C => C.G.countIn && !!C.api.player()], ['Switch all three off again, and stop.', C => !C.G.loop && !C.G.metro && !C.G.countIn && !C.api.player()]],
      seq: true, target: ['btn:LOOP', 'btn:CLICK', 'btn:COUNT-IN'], hint: 'Their keys: CTRL+L for LOOP and M for CLICK.' },
    { id: 'tempo', say: ['BPM is the tempo: beats per minute. Type a number into the box and press Enter, or use its arrows. TAP works it out for you: tap it in time with a tune you can hear, and after a few taps the Garage sets the tempo from the gaps between them.'],
      goals: [['Type a tempo at least 10 faster than it was, and press Enter.', C => C.song.bpm >= C.start.bpm + 10], ['Press TAP four times, in time with the music (press PLAY first if you like).', C => C.pressed('TAP') >= 4], ['Put BPM back to 92.', C => C.song.bpm === 92]],
      seq: true, target: ['css:.g-bpmbox', 'btn:TAP'], hint: 'The BPM box is just after the clock. Click it, type, press Enter.' },
    { id: 'beats', say: ['BEATS is how many beats a bar has. Four is normal; three is a waltz; five and seven are odd and exciting. The bar lines move at once. SWING leans every second eighth note late: 0 is dead straight, 50% is a shuffle, the sound of jazz, blues and lo-fi.'],
      goals: [['Set BEATS to 3: watch the bar lines move.', C => C.song.beats === 3], ['Set BEATS back to 4.', C => C.song.beats === 4], ['Set SWING to 50% and press PLAY to hear the lean.', C => (C.song.swing || 0) >= 0.5 && !!C.api.player()], ['Set SWING back to NO SWING and stop.', C => !(C.song.swing > 0) && !C.api.player()]],
      seq: true, target: ['sel:BEATS IN A BAR', 'sel:THE OFF-BEAT'] }
  ] },

  { id: 'key', title: 'KEY, SCALE AND MAGIC NOTES', blurb: 'Why there are no wrong notes, and how to choose them.', needsPractice: true, steps: [
    { id: 'magic', say: ['Music is made from scales: sets of seven or five notes that sound right together. The KEY says which note is home; the SCALE says which notes belong. With MAGIC NOTES on, the roll shows only the rows of that scale, so every note you can click is a good one.'],
      goals: [['Switch MAGIC NOTES off and look at the roll: now every note is there, in and out of the key.', C => !C.G.magic], ['Switch it on again.', C => C.G.magic]], seq: true, target: ['btn:MAGIC NOTES', 'zone:roll'], hint: 'The blue rows of the roll are the key\'s home note.' },
    { id: 'keyscale', say: ['KEY and SCALE are the two selects after BEATS. Changing them does not move the notes you have written: they only change which rows are lit and which notes MAGIC NOTES will let you click. To move the notes themselves you transpose them (a later chapter).'],
      goals: [['Set the KEY to D.', C => C.song.key === 'D'], ['Set the SCALE to MINOR and look at how the rows change.', C => C.song.scale === 'minor'], ['Put them back: KEY C, SCALE MAJOR.', C => C.song.key === 'C' && C.song.scale === 'major']],
      seq: true, target: ['sel:THE KEY', 'sel:THE SCALE'], hint: 'MAJOR sounds bright, MINOR dark, MAGIC 5 has only five notes and nothing in it can clash.' }
  ] },

  { id: 'tracks', title: 'THE TRACKS', blurb: 'One card per instrument: mute, solo, swap, rename, blend.', needsPractice: true, steps: [
    { id: 'select', say: ['The cards down the left are the tracks, one per instrument. Click a card to select it: the roll then shows that track\'s notes, and everything you do (draw, copy, transpose) acts on the selected track. The drum track shows a drum grid instead of piano rows.'],
      goals: [['Select every one of the four tracks, one after the other.', C => { (C.mem.s = C.mem.s || new Set()).add(C.G.sel); return C.mem.s.size >= 4; }]], target: ['css:.g-tracks'] },
    { id: 'muteSolo', say: ['M mutes a track: it goes quiet. S solos it: every other track goes quiet. They are how you hear what one part is really doing, and what the song would be without it.'],
      goals: [['Press M on the DRUMS card, and press PLAY to hear the song without it.', C => !!(C.track('p_drm') || {}).mute && !!C.api.player()], ['Now press S on the MELODY card: only the tune is left.', C => !!(C.track('p_mel') || {}).solo], ['Clear them both (press M and S again) and stop.', C => !C.song.tracks.some(t => t.mute || t.solo) && !C.api.player()]],
      seq: true, target: ['css:.g-card .g-sm'], hint: 'M and S sit at the right end of each card\'s top row.' },
    { id: 'instrument', say: ['The button under a track\'s name is its instrument. Press it to open the picker: every instrument is a card, and pressing a card plays it. The first thirty are free; nineteen more are Dave\'s, and the picker will send you to his shop for them.'],
      goals: [['Select the MELODY card, press its instrument button and choose something other than PIANO.', C => (C.track('p_mel') || {}).inst !== 'piano']], target: ['css:.g-card.sel .g-inst'], hint: 'Press a card to hear it, then USE IT. Double-clicking a card does both.' },
    { id: 'rename', say: ['Double-click a track\'s name to rename it. The little coloured square is its colour in the roll, and the … button opens a menu of things you can do to the whole track: rename it, copy it, move it up or down, change its colour, clear its notes or delete it (and CTRL+Z always brings it back).'],
      goals: [['Rename any track: double-click its name.', C => C.song.tracks.some(t => C.was(t.id) && t.name !== C.was(t.id).name)], ['Open the … menu and choose NEXT COLOUR.', C => C.song.tracks.some(t => C.was(t.id) && t.color !== C.was(t.id).color)]],
      target: ['css:.g-card.sel .g-cname', 'css:.g-card.sel .g-sm:last-child'] },
    { id: 'sliders', say: ['Every card has three sliders for the selected track: VOL is how loud it is, PAN is where it sits between the left and right speakers, and ROOM is how much of the sound bounces back as if it were played in a hall. (Double-click a slider and it jumps back to where it started.)'],
      goals: [['Move a VOL slider by 10 or more.', C => C.song.tracks.some(t => C.was(t.id) && Math.abs((t.vol == null ? 0.8 : t.vol) - (C.was(t.id).vol == null ? 0.8 : C.was(t.id).vol)) >= 0.1)], ['Pan a track at least 30% to one side.', C => C.song.tracks.some(t => Math.abs(t.pan || 0) >= 0.3)], ['Add ROOM to a track: 15 more than it had.', C => C.song.tracks.some(t => C.was(t.id) && (t.reverb == null ? 0.15 : t.reverb) - (C.was(t.id).reverb == null ? 0.15 : C.was(t.id).reverb) >= 0.15)]],
      target: ['css:.g-card.sel'], hint: 'PAN and ROOM show only on the selected card.' },
    { id: 'addDelete', say: ['Every track can be copied and removed, and none of it is permanent: CTRL+Z undoes it all. + TRACK adds a new, empty track with an instrument of your choice, up to sixteen. The … menu\'s MOVE UP and MOVE DOWN change the order of the cards (and so of the strips in the mixer).'],
      goals: [['… menu, DUPLICATE TRACK on any track.', C => C.song.tracks.length === C.start.tracks.length + 1], ['… menu, DELETE TRACK on the copy.', C => C.song.tracks.length === C.start.tracks.length], ['Press + TRACK and add a track (any instrument).', C => C.song.tracks.length === C.start.tracks.length + 1], ['Delete that track too, so the song is as it was.', C => C.song.tracks.length === C.start.tracks.length && C.song.tracks.every(t => C.was(t.id))]],
      seq: true, target: ['btn:+ TRACK', 'css:.g-card.sel .g-sm:last-child'] }
  ] }
];
void notesOf; void sel;
