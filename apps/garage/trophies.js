/* THE GARAGE's trophies (docs/achievements/toys.md). The Garage has no score and no fail state: a trophy here celebrates a thing somebody chose to make, never a count of notes or minutes.
   Data only; trophy_calls.js reads the song at the moments that matter (a save, an export, an edit) and says what it holds. Events: note, magic, band, rec-take { notes }, save-song
   { bars, beats, drums, bass, chords, lead, families, pack, keyed, outOfKey, byEar }, export { kind, peak }, desk, grown, course { tour, genres, genresTotal }. Counter lessons. Set midi. */
import { t, rule } from '../trophy_kit.js';
const on = rule.on;
export const LESSONS = 8;
export const FAMILIES_NEEDED = 5;

export const TROPHIES = [
  t('gr_note', 'FIRST NOTE', 'B', 'P', 'Put a note in the roll.', on('note')),
  t('gr_l1', 'STUDENT', 'B', 'P', 'Finish a lesson in THE BASICS.', rule.stat('lessons', 1)),
  t('gr_l4', 'SECOND CHAIR', 'S', 'P', 'Finish four lessons.', rule.stat('lessons', 4)),
  t('gr_l8', 'GRADUATE', 'G', 'P', 'Finish all eight lessons.', rule.stat('lessons', LESSONS)),
  t('gr_song', 'A SONG OF YOUR OWN', 'B', 'P', 'Save a song to ::/Home/Songs.', on('save-song')),
  t('gr_band', 'BAND IN A BOX', 'B', 'P', 'Use BAND IN A BOX.', on('band')),
  t('gr_four', 'FOUR PIECES', 'S', 'S', 'Save a song that has drums, bass, chords and a lead.', on('save-song', p => p.drums && p.bass && p.chords && p.lead)),
  t('gr_magic', 'NO WRONG NOTES', 'B', 'E', 'Play four notes of a phrase with MAGIC NOTES on.', on('magic')),
  t('gr_ear', 'BY EAR', 'S', 'S', 'Save an 8-bar tune of eight or more notes put in by hand with MAGIC NOTES off, every one of them in the key.', on('save-song', p => p.byEar)),
  t('gr_take', 'LIVE TAKE', 'B', 'P', 'Record 16 or more notes in one take with REC on the keys.', on('rec-take', p => p.notes >= 16)),
  t('gr_bounce', 'BOUNCE', 'B', 'P', 'Export a WAV.', on('export', p => p.kind === 'wav')),
  t('gr_hot', 'HOT BUT CLEAN', 'S', 'S', 'Bounce a song with a peak between -1.1 and -0.1 dBFS and no clipping (PEAK AT -1 dB does it).', on('export', p => p.kind === 'wav' && p.peak <= -0.1 && p.peak >= -1.1)),
  t('gr_stems', 'STEMS', 'B', 'P', 'Export a WAV for every track.', on('export', p => p.kind === 'stems')),
  t('gr_there', 'THERE AND BACK', 'S', 'C', 'Export a MIDI file, then import it again.', rule.sets('midi', 2)),
  t('gr_desk', 'ON THE DESK', 'S', 'S', 'On one track, use EQ, compressor, drive and room together.', on('desk')),
  t('gr_fam', 'FIVE FAMILIES', 'S', 'C', 'Save a song using instruments from five of the ten families.', on('save-song', p => p.families >= FAMILIES_NEEDED)),
  t('gr_pack', 'UNPACKED', 'S', 'C', 'Save a song that uses an instrument from a pack you bought at Dave\'s.', on('save-song', p => p.pack)),
  t('gr_loop', 'COPY, PASTE, COMPOSE', 'S', 'C', 'Grow an 8-bar idea into a song of 32 bars or more with the segment tools.', on('grown')),
  t('gr_waltz', 'THREE QUARTERS', 'B', 'C', 'Save a song in 3 beats to the bar.', on('save-song', p => p.beats === 3)),
  /* the second tutorial: the Studio Course (course.js) */
  t('gr_tour', 'THE WHOLE DESK, EXPLAINED', 'S', 'P', 'Finish every chapter of the Studio Course tour.', on('course', p => p.tour)),
  t('gr_genre1', 'IN THE STYLE OF', 'S', 'C', 'Write a whole song in a genre of the Studio Course.', on('course', p => p.genres >= 1)),
  t('gr_genreall', 'EVERY STYLE IN THE HOUSE', 'G', 'C', 'Write a song in every genre of the Studio Course.', on('course', p => p.genresTotal > 0 && p.genres >= p.genresTotal))
];

/* the lessons' ticks, and the songs already saved */
export function backfill(read) {
  const stars = read('app_garage_stars'), ids = [];
  const n = Array.isArray(stars) ? stars.filter(Boolean).length : 0;
  if (n >= 1) ids.push('gr_l1'); if (n >= 4) ids.push('gr_l4'); if (n >= LESSONS) ids.push('gr_l8');
  return ids;
}
