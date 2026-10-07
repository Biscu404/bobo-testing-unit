# Catalogue 3 of 4: the Elephant, the Crayon, the Garage, The Stack, Notes, and the small tools

Legend as in `games-1.md`. These apps have no score and no fail state on purpose (the README says the Crayon and the Elephant "are not keeping
score"). So **the rule for this file is stricter than for the games: a trophy here may only celebrate something the person chose to do, never
make them do it.** No counters of strokes, minutes or clicks; no tier gets harder by repetition alone; every trophy is a thing you would be pleased
to have made or found. They pay SUN like any other, but the cards are quieter (no sparkle; the toast is the plain one).

---

## The Elephant (and the elephant on the desktop)

**Mechanics found.** One friend, five places that change every 80 s (the sunflower field, the oasis, the mountain field, up in the clouds, the steps of
the third temple), each with its own tune; 200 sayings in a shuffled bag so none repeats until all are heard; a wardrobe of twelve things in five slots
(head, face, neck, body, feet) and FREE RANGE (2,500 SUN), after which `kernel/pet.js` lets him out onto the desktop: he walks, sleeps (sooner after 23:00,
wakes if the pointer comes close), talks (some lines read the desk), can be picked up, pushes your icons a cell (PUT THE LAST ICON BACK undoes it), says goodbye
before lying down, and opens his own window when called in with none open. **Existing achievements: none.**

**Events.** `talk{ heard, bagSize }` (the bag already knows), `place{ i }`, `wear{ slot, id }`, `own{ id }`, and from `Pet.onChange`: `out`, `home`,
`pushed-icon`, `put-back`, `sleep{ late }`, `woken-by-pointer`, `picked-up`, `door`. State is already in `templeos.pet.v1`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| el_hello | HEY THERE FRIEND | Press the button once. | P | B | - | talk |
| el_25 | A GOOD LISTENER | Hear 25 different things he has to say. | P | B | - | stat heard |
| el_100 | AN OLD FRIEND | Hear 100 different things. | P | S | - | stat heard |
| el_200 | TWO HUNDRED THINGS | Hear the whole bag, all 200, before any is repeated. | P | G | - | stat heard |
| el_places | FIVE PLACES | See all five places he lives in. | E | B | - | set places |
| el_dressed | DRESSED FOR IT | Put something on him. | P | B | - | wear |
| el_gent | THE GENTLEMAN | Top hat, monocle and bow tie, all at once. | C | B | - | wear state |
| el_five | FROM HAT TO BOOTS | Wear something in every one of the five slots at once. | C | S | - | wear state |
| el_wardrobe | THE WHOLE WARDROBE | Own all twelve things. | P | G | - | poll Cos |
| el_out | GO OUTSIDE | Let him out of his window onto the desktop. | P | B | - | out |
| el_helping | HE WAS ONLY HELPING | Let him push one of your icons, then put it back from his menu. | E | B | - | put-back |
| el_goodnight | SLEEP WELL, BIG GUY | Let him say goodbye and lie down to sleep. | E | B | - | sleep |
| el_sorry | SORRY!* | (hint) *He sleeps lightly.* Wake him by walking the pointer up to him. | E | B | - | woken-by-pointer |
| el_pickup | PUT ME DOWN, KIDDO | Pick him up and drop him somewhere else on the desktop. | C | B | - | picked-up |
| el_door | HE KNOWS THE DOOR | Call him in with no window open, and watch him open his own and walk in. | E | S | - | door |

Notes. `el_200` is the one count here, and it is allowed because the bag *is* the app: it hands out the sayings without repeats, so the number is
"how many different ones have you heard", never "how many times have you pressed". Hearing 200 of them is about ten minutes of leaving the window open.

---

## Crayon (DRAW.EXE)

**Mechanics found.** Seven colours and a wheel, a noisy nib (slow = dense, a flick = a scratch), fill, undo, eight brushes and four layers from Dave,
drawings saved as real files in MY DRAWINGS with thumbnails and re-opened editable, PNG export, and "set this as the background" from a sheet.
**Existing achievements: none.**

**Events.** `stroke{ brush, layer, colour }`, `fill`, `save{ name }`, `reopen{ name }`, `export-png`, `set-bg`. Per-sheet sets (`brushesUsed`, `layersUsed`,
`coloursUsed`) live on the sheet object and reset on NEW SHEET; the trophy checks them at `save()` and `exportPng()`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| cr_first | FIRST MARK | Draw a line. | P | B | - | stroke |
| cr_keep | KEEP IT | Save a drawing to MY DRAWINGS. | P | B | - | save |
| cr_second | SECOND DRAFT | Re-open a saved drawing and save it again. | C | B | - | reopen + save |
| cr_png | SHOW IT OFF | Export a drawing as a PNG. | P | B | - | export-png |
| cr_gal3 | A FEW ON THE WALL | Have three saved drawings. | P | B | - | stat saved |
| cr_gal10 | A SMALL GALLERY | Have ten saved drawings. | P | S | - | stat saved |
| cr_box | THE WHOLE BOX | Use all seven colours and a wheel colour on one sheet. | C | B | - | save{coloursUsed} |
| cr_layers | LAYER CAKE | Draw on every layer of one sheet. | C | S | - | save{layersUsed} |
| cr_riot | A RIOT OF BRUSHES | Use all eight of Dave's extra brushes on a single sheet. | C | G | - | save{brushesUsed} |
| cr_wall | WALLPAPER ARTIST | Set a drawing of your own as the desktop background. | C | S | - | set-bg |

---

## The Garage

**Mechanics found.** 49 instruments in ten families (KEYS, MALLETS, GUITARS, BASS, STRINGS, WINDS, SYNTH, VOICES, FUN, DRUMS), the first 30 free and
19 in Dave's packs; a piano roll with draw/select/erase, MAGIC NOTES (only the key's rows), segments across tracks, undo 80 deep; transport with loop,
count-in, click, tapped tempo, swing, beats per bar and REC on the keys; a desk per track (3-band EQ, compressor, drive, room, echo) and a master limiter;
BAND IN A BOX; eight interactive lessons ("THE BASICS", ticks kept in `ctx.save('stars')`); save to `::/Home/Songs`, export a WAV (16/24 bit, with a report
of peak and loudness), stems, or a MIDI file, and import MIDI. **Existing achievements: none** (the lesson ticks are the only record).

**Events.** `note-add`, `lesson-done{ i }` (the ticks array is already there), `band`, `rec-take{ notes }`, `save-song{ summary }`, `export{ kind, peak, clip }`
from `export.js`, `import-midi`, `segment-op{ op }` from `actions.js`, `mixer{ track, eq, comp, drive, room }`. `summary` is computed once at save:
`{ bars, beats, tracks, families[], insts[], packInsts[], keyedNotes, outOfKey, hasDrums, hasBass, hasChords, hasLead }`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| gr_note | FIRST NOTE | Put a note in the roll. | P | B | - | note-add |
| gr_l1 | STUDENT | Finish a lesson in THE BASICS. | P | B | - | lesson-done |
| gr_l4 | SECOND CHAIR | Finish four lessons. | P | S | - | stat lessons |
| gr_l8 | GRADUATE | Finish all eight lessons. | P | G | - | stat lessons |
| gr_song | A SONG OF YOUR OWN | Save a song to ::/Home/Songs. | P | B | - | save-song |
| gr_band | BAND IN A BOX | Use BAND IN A BOX. | P | B | - | band |
| gr_four | FOUR PIECES | Save a song that has drums, bass, chords and a lead. | S | S | - | save-song |
| gr_magic | NO WRONG NOTES | Write a phrase with MAGIC NOTES on. | E | B | - | note-add{magic} |
| gr_ear | BY EAR | Save an 8-bar melody in the key with MAGIC NOTES off, every note in key. | S | S | - | save-song{outOfKey:0} |
| gr_take | LIVE TAKE | Record 16 or more notes in one take with REC on the keys. | P | B | - | rec-take |
| gr_bounce | BOUNCE | Export a WAV. | P | B | - | export{wav} |
| gr_hot | HOT BUT CLEAN | Bounce a song with a peak between -1.0 and -0.1 dBFS and no clipping. | S | S | tune | export{peak} |
| gr_stems | STEMS | Export a WAV for every track. | P | B | - | export{stems} |
| gr_there | THERE AND BACK | Export a MIDI file, then import it again. | C | S | - | export{midi} + import-midi |
| gr_desk | ON THE DESK | On one track, use EQ, compressor, drive and room together. | S | S | - | mixer |
| gr_fam | FIVE FAMILIES | Save a song using instruments from five of the ten families. | C | S | - | save-song |
| gr_pack | UNPACKED | Save a song that uses an instrument from a pack you bought at Dave's. | C | S | - | save-song{packInsts} |
| gr_loop | COPY, PASTE, COMPOSE | Grow an 8-bar idea into a 32-bar song with the segment tools. | C | S | - | segment-op x3, bars>=32 |
| gr_waltz | THREE QUARTERS | Save a song in 3 beats to the bar. | C | B | - | save-song{beats:3} |

---

## The Stack (hi-fi)

**Mechanics found.** A rack with a disc library of folders: the lobby's four variants (HYMN, MELLOW, DYNAMIC, GLITCH) and one per scored app, plus a STYLE METER
folder that appears after the meter reaches HAPPY BIRTHDAY; EQ presets on digits 1-9; discs are pressed the first time they are played; files can be dropped in.
**Existing achievements: none.**

**Events.** `play{ disc, folder }`, `ended{ disc }`, `eq-preset{ n }`, `drop{ file }`, `folder-open{ id }`; the lobby variant change from the mixer panel is
`variant{ name }`.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| hf_spin | SPIN IT | Play a disc. | P | B | - | play |
| hf_side | A WHOLE SIDE | Listen to one disc to the end. | P | B | - | ended |
| hf_crates | DIG THE CRATES | Open every folder in the library. | E | S | - | set folders |
| hf_eq | NINE CURVES | Try all nine EQ presets. | E | S | - | set presets |
| hf_moods | FOUR MOODS | Hear the lobby tune as HYMN, MELLOW, DYNAMIC and GLITCH. | E | S | - | set variants |
| hf_own | YOUR RECORD | Drop in a track of your own and play it. | C | B | - | drop + play |
| hf_top | FROM THE TOP | Play the STYLE METER disc. | E | S | - | play{folder:'style'} |

---

## Notes

**Mechanics found.** A vault of pages that point at each other: `[[Another Note]]` makes a link, a link to a note that does not exist is drawn red ("a promise"),
BACKLINKS lists who points at a page, and GRAPH draws every note as a box and every link as a line with a spring layout. Saved on a half-second debounce.
**Existing achievements: none.**

**Events.** `save{ title }` (the existing `save()` debounce), `links{ from, to[], exists[] }` computed from `linksOf`, `graph-open`, `backlinks-open{ n }`.
Graph facts are pure functions over the notes array (`graphEdges()` already exists), so they are cheap and testable.

| ID | Name | How | K | T | Proof | Trigger |
|---|---|---|---|---|---|---|
| nt_first | DEAR DIARY | Write a note. | P | B | - | save |
| nt_promise | A PROMISE | Link to a note that does not exist yet. | E | B | - | links{red} |
| nt_kept | PROMISE KEPT | Write the note that a red link was waiting for. | C | B | - | save after red link |
| nt_back | WHO POINTS HERE | Open BACKLINKS on a note that has at least three. | E | B | - | backlinks-open |
| nt_graph | FROM ABOVE | Open the GRAPH and let it settle. | E | B | - | graph-open |
| nt_web | A SMALL WEB | Have ten notes joined by at least fifteen links. | P | S | - | poll graph |
| nt_ring | A CLOSED CIRCLE | Link three notes in a ring: A to B to C and back to A. | C | S | - | poll graph |
| nt_hub | THE HUB | Have one note that eight others link to. | C | S | - | poll graph |
| nt_orphans | NO ORPHANS | Have at least eight notes where every one is linked to or from another. | S | S | - | poll graph |

---

## Small tools

| ID | App | Name | How | K | T | Trigger |
|---|---|---|---|---|---|---|
| tl_oracle | God tools | THE ORACLE SPEAKS | Ask God for a word, a drawing and a song, all three. | E | B | GodWord, GodDoodle, GodSong |
| tl_seven | Terminal / HolyC | SEVEN WORDS | Ask for seven words at once: GodWord(7). | E | B | GodWord{n:7} |
| tl_defrag | Defrag | EVERYTHING IN ORDER | Let DEFRAG run to the end. | P | B | defrag-done |
| tl_kill | Tasks | END TASK | Kill a window from TASKS. | E | B | kill |
| tl_adam | Tasks | ADAM CANNOT BE KILLED* | Try to end Adam and Seth. (The rows need to answer: a one-line toast, "ADAM CANNOT BE KILLED.") | J | B | kill{adam} |
| tl_readonly | CMOS | SAVE AND EXIT | Press F10 in CMOS. (Its footer promises "F10: Save & Exit" and the window has no key handler yet; give it one that answers "NOTHING TO SAVE. GOD IS PRESENT.") | J | B | cmos-f10 |
