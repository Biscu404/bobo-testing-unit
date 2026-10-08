/* Bekkedal — what you can do with the things in a house.
 *
 * Most of a room is to look at. Some of it answers when you face it and press SPACE, in the way the rest of the game does (a bed
 * sleeps, a bench sits, a hearth is raked): a bookcase has something to read, a clock tells the time, a window says what is going
 * on outside, a plant is watered, a stove makes tea. Everything that answers opens a small box with its name on it. None of it is a chore and none of it is a way to make
 * money: the one thing that gives anything back is the tea, which is once a day and small, like the ash. All of it is a *line*
 * with a sound, so a quiet house has a small amount to find in it.
 *
 * `FURN` says which kinds answer and what the HUD tells you SPACE will do (hint.js reads it); `furnitureAct` does it. The glue is
 * handed in (`env`) so this file knows nothing of the engine: it only reads and writes the few fields of the save it names.
 */
const L = (no, en) => ({ no, en });

export const FURN = {
  bookcase:  { act: 'read',   hint: L('SPACE: BLA I BØKENE', 'SPACE: BROWSE THE BOOKS') },
  clock:     { act: 'clock',  hint: L('SPACE: SE PÅ KLOKKA', 'SPACE: LOOK AT THE CLOCK') },
  breast:    { act: 'clock',  hint: L('SPACE: SE PÅ KLOKKA', 'SPACE: LOOK AT THE CLOCK') },
  mirror:    { act: 'mirror', hint: L('SPACE: SE I SPEILET', 'SPACE: LOOK IN THE MIRROR') },
  dresser:   { act: 'mirror', hint: L('SPACE: SE I SPEILET', 'SPACE: LOOK IN THE MIRROR') },
  picture:   { act: 'picture', hint: L('SPACE: SE PÅ BILDET', 'SPACE: LOOK AT THE PICTURE') },
  plant:     { act: 'water',  hint: L('SPACE: VANN BLOMSTEN', 'SPACE: WATER THE PLANT') },
  stove:     { act: 'tea',    hint: L('SPACE: LAG TE', 'SPACE: MAKE TEA') },
  wardrobe:  { act: 'drawer', hint: L('SPACE: ÅPNE SKAPET', 'SPACE: OPEN THE WARDROBE') },
  trunk:     { act: 'drawer', hint: L('SPACE: ÅPNE KISTA', 'SPACE: OPEN THE CHEST') },
  pantry:    { act: 'drawer', hint: L('SPACE: ÅPNE SPEISEN', 'SPACE: OPEN THE LARDER') },
  coatrack:  { act: 'drawer', hint: L('SPACE: SE PÅ KLÆRNE', 'SPACE: LOOK AT THE COATS') },
  desk:      { act: 'desk',   hint: L('SPACE: SE PÅ BREVET', 'SPACE: READ THE LETTER') },
  dtable:    { act: 'table',  hint: L('SPACE: SE PÅ BORDET', 'SPACE: LOOK AT THE TABLE') },
  coffeetable: { act: 'table', hint: L('SPACE: SE PÅ BORDET', 'SPACE: LOOK AT THE TABLE') },
  nightstand: { act: 'stand', hint: L('SPACE: SE PÅ NATTBORDET', 'SPACE: LOOK AT THE BEDSIDE TABLE') },
  coat:      { act: 'drawer', hint: L('SPACE: SE PÅ JAKKA', 'SPACE: LOOK AT THE COAT') },
  firewood:  { act: 'drawer', hint: L('SPACE: SE PÅ VEDEN', 'SPACE: LOOK AT THE WOOD') },
  basket:    { act: 'drawer', hint: L('SPACE: SE I KURVEN', 'SPACE: LOOK IN THE BASKET') },
  boots:     { act: 'drawer', hint: L('SPACE: SE PÅ STØVLENE', 'SPACE: LOOK AT THE BOOTS') },
  broom:     { act: 'drawer', hint: L('SPACE: SE PÅ KOSTEN', 'SPACE: LOOK AT THE BROOM') },
  window:    { act: 'window', hint: L('SPACE: SE UT', 'SPACE: LOOK OUT') }
};

/* the name on the box when a thing answers (what the dialogue box calls it, in the place a person's name would be) */
const NAME = {
  bookcase: L('BOKHYLLA', 'THE BOOKCASE'), clock: L('KLOKKA', 'THE CLOCK'), breast: L('KLOKKA', 'THE CLOCK'), mirror: L('SPEILET', 'THE MIRROR'),
  dresser: L('KOMMODEN', 'THE DRESSER'), picture: L('BILDET', 'THE PICTURE'), plant: L('BLOMSTEN', 'THE PLANT'), stove: L('OVNEN', 'THE STOVE'),
  wardrobe: L('SKAPET', 'THE WARDROBE'), trunk: L('KISTA', 'THE TRUNK'), pantry: L('SPEISEN', 'THE LARDER'), coatrack: L('KLÆRNE', 'THE COATS'),
  desk: L('SKRIVEBORDET', 'THE DESK'), dtable: L('BORDET', 'THE TABLE'), coffeetable: L('BORDET', 'THE TABLE'), nightstand: L('NATTBORDET', 'THE BEDSIDE TABLE'),
  coat: L('JAKKA', 'THE COAT'), firewood: L('VEDEN', 'THE WOOD'), basket: L('KURVEN', 'THE BASKET'), boots: L('STØVLENE', 'THE BOOTS'), broom: L('KOSTEN', 'THE BROOM'),
  window: L('VINDUET', 'THE WINDOW')
};

/* what the things say. A pool is picked by the day and the place, so the same shelf says the same thing on the same day. */
const BOOKS = [
  L('EN BOK OM DALENS VÆR. Første side handler om tålmodighet.', 'A BOOK ABOUT THE VALLEY\'S WEATHER. The first page is about patience.'),
  L('GAMLE OPPSKRIFTER, med fingeravtrykk i margen.', 'OLD RECIPES, with thumbprints in the margins.'),
  L('SALMEBOKA. Noen har lagt en tørket blomst i den.', 'THE HYMNAL. Somebody has pressed a flower in it.'),
  L('EN BOK OM FISK. Tegningene er bedre enn teksten.', 'A BOOK ABOUT FISH. The drawings are better than the text.'),
  L('ET STORT ATLAS. Dalen er en liten prikk helt nederst.', 'A BIG ATLAS. The valley is a small dot near the bottom.'),
  L('DIKT. Du leser ett høyt for deg selv, og det går fint.', 'POEMS. You read one aloud to yourself, and it goes fine.'),
  L('REGNSKAPSBØKER, ført med fin håndskrift.', 'ACCOUNT BOOKS, kept in a fine hand.')
];
const MIRROR = [
  L('DU SER ut som en som har jobbet. Det kler deg.', 'YOU LOOK like somebody who has been working. It suits you.'),
  L('HÅRET STÅR til alle kanter. Du lar det stå.', 'YOUR HAIR goes every way. You let it.'),
  L('ET TRØTT OG GLAD ANSIKT i speilet. Det er et godt par.', 'A TIRED AND HAPPY FACE in the glass. A good pair.')
];
const PICTURES = [
  L('FJORDEN, i sommerlys. Noen har malt den fra minnet.', 'THE FJORD, in summer light. Somebody painted it from memory.'),
  L('EN ENG I BLOMST. Du kjenner igjen stien.', 'A MEADOW IN FLOWER. You recognise the path.'),
  L('ET BRODERT MØNSTER. Hver rute er sydd for hånd.', 'A SAMPLER. Every square is sewn by hand.')
];
const DRAWER = {
  wardrobe: [L('KLÆR I RADER, brettet etter farge.', 'CLOTHES IN ROWS, folded by colour.'), L('Alt lukter sedertre.', 'Everything smells of cedar.')],
  trunk: [L('TEPPER OG LAKEN, pakket med lavendel.', 'BLANKETS AND SHEETS, packed with lavender.'), L('Du lukker lokket forsiktig.', 'You close the lid gently.')],
  pantry: [L('SYLTETØY, SALT FISK, ET BRUNT BRØD.', 'JAM, SALTED FISH, A BROWN LOAF.'), L('Nok til vinteren.', 'Enough for the winter.')],
  coatrack: [L('FEM JAKKER, ÉN HATT.', 'FIVE JACKETS, ONE HAT.'), L('Noen av dem er dine.', 'Some of them are yours.')],
  coat: [L('JAKKA HENGER PÅ EN SPIKER.', 'THE COAT HANGS ON A NAIL.'), L('Den er slitt ved albuene og varm likevel.', 'It is worn at the elbows and warm all the same.')],
  firewood: [L('VED, STABLET TIL VEGGEN.', 'WOOD, STACKED AGAINST THE WALL.'), L('Det er til i kveld. I morgen må du hogge mer.', 'That is for tonight. Tomorrow you will have to chop more.')],
  basket: [L('EN KURV MED LAPPER OG GARN.', 'A BASKET OF PATCHES AND YARN.'), L('Alt her er brukt før.', 'All of it has been used before.')],
  boots: [L('STØVLER VED DØRA, fulle av gårsdagens jord.', 'BOOTS BY THE DOOR, full of yesterday\'s earth.'), L('De passer akkurat.', 'They fit exactly.')],
  broom: [L('EN KOST AV BJØRKERIS.', 'A BROOM OF BIRCH TWIGS.'), L('Gulvet er av bare planker. Det holder seg rent.', 'The floor is bare boards. It stays clean enough.')]
};
/* what the same piece is in the shack: nothing in the shack is more than it needs to be */
const POOR = {
  trunk: [L('ET ULLTEPPE, EN SKJORTE, EN KNIV.', 'A WOOL BLANKET, A SHIRT, A KNIFE.'), L('Det er alt du eier, og det er nok i dag.', 'That is everything you own, and it is enough today.')]
};
const TABLE = {
  farmhouse: [L('TO BRETT PÅ TO BUKKER.', 'TWO BOARDS ON TWO TRESTLES.'), L('Én stol. Du har aldri trengt flere.', 'One chair. You have never needed more.')],
  other: [L('BORDET ER DEKKET.', 'THE TABLE IS LAID.'), L('Det ser ut som noen venter.', 'It looks like somebody is expected.')]
};
const STAND = {
  candle: [L('ET TALGLYS I EN KRUS.', 'A TALLOW CANDLE IN A MUG.'), L('Det brenner ikke nå. Det er nok å vite at det er der.', 'It is not lit. Knowing it is there is enough.')],
  lamp: [L('EN LAMPE MED GRØNN SKJERM.', 'A LAMP WITH A GREEN SHADE.'), L('Den kaster et rolig lys på puta.', 'It throws a calm light on the pillow.')],
  book: [L('EN BOK MED ET BREV SOM BOKMERKE.', 'A BOOK WITH A LETTER FOR A BOOKMARK.'), L('Du er ikke kommet lenger enn side tolv.', 'You have got no further than page twelve.')]
};
const OUT = {
  klar: [L('SOL OVER DALEN. Skyggene er korte.', 'SUN OVER THE VALLEY. The shadows are short.'), L('KLART VÆR. Du ser helt til fjellet.', 'CLEAR WEATHER. You can see all the way to the mountain.')],
  regn: [L('REGN PÅ RUTA. Én dråpe løper forbi de andre.', 'RAIN ON THE PANE. One drop outruns the others.'), L('DET REGNER. Det er godt å være innenfor.', 'IT RAINS. It is good to be inside.')],
  take: [L('TÅKE. Ingenting bak gjerdet finnes.', 'FOG. Nothing past the fence exists.')],
  snø: [L('SNØ. Alt er stille og hvitt.', 'SNOW. Everything is quiet and white.')]
};
const NIGHT = [L('MØRKT. Et lys i et annet vindu, langt borte.', 'DARK. A light in another window, far away.'), L('STJERNER over taket. Det er sent.', 'STARS over the roof. It is late.')];

const pick = (a, S, x, y) => a[Math.abs((S.day || 0) * 7 + (x || 0) * 3 + (y || 0)) % a.length];
const hhmm = m => { const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60); return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0'); };

/* Do it. `prop` is { kind, x, y, ... } off the room's table, `win` true when it is a window; returns whether anything answered.
   env: { S, say(lines, label), sfx, TX, light(): how dark it is out (0..1) } — `S.met` is the daily table that newDay() empties.
   Everything that answers is a small dialogue box: the thing's name on a line of its own, then what it says, a line at a time. */
export function furnitureAct(prop, env, win) {
  const S = env.S, x = prop ? prop.x : 0, y = prop ? prop.y : 0;
  const act = win ? 'window' : prop && FURN[prop.kind] && FURN[prop.kind].act;
  if (!act) return false;
  const kind = win ? 'window' : prop.kind, label = NAME[kind] || null;
  const say = lines => env.say(Array.isArray(lines) ? lines : [lines], label);
  const poor = S.map === 'farmhouse';
  if (act === 'read') { say([pick(BOOKS, S, x, y), L('Du setter den tilbake nøyaktig der den stod.', 'You put it back exactly where it stood.')]); env.sfx.pick(); return true; }
  if (act === 'mirror') { say(pick(MIRROR, S, x, y)); env.sfx.pick(); return true; }
  if (act === 'picture') { say(PICTURES[(prop.p || 0) % PICTURES.length]); env.sfx.pick(); return true; }
  if (act === 'drawer') { say((poor && POOR[kind]) || DRAWER[kind]); env.sfx.pick(); return true; }
  if (act === 'stand') { say(STAND[prop.w] || STAND.candle); env.sfx.pick(); return true; }
  if (act === 'clock') { say(env.TX('KLOKKA GÅR ' + hhmm(S.min) + '. Den er tre minutter for fort, og alltid har vært det.', 'THE CLOCK SAYS ' + hhmm(S.min) + '. It is three minutes fast, and always has been.')); env.sfx.pick(); return true; }
  if (act === 'desk') { say([L('ET BREV, ikke ferdig.', 'A LETTER, not finished.'), L('«Kjære —» står det, og så ingenting mer.', '"Dear —" it says, and nothing after.')]); env.sfx.pick(); return true; }
  if (act === 'table') { say(poor ? TABLE.farmhouse : TABLE.other); env.sfx.pick(); return true; }
  if (act === 'window') {
    const pool = env.light() > 0.55 ? NIGHT : (OUT[S.weather] || OUT.klar);
    say(poor ? [pick(pool, S, x, y), L('Glasset har en sprekk i det ene hjørnet.', 'The glass has a crack in one corner.')] : pick(pool, S, x, y)); env.sfx.pick(); return true;
  }
  if (act === 'water') {                              /* free, like filling the can: once a plant a day, and only if there is water in the can */
    const k = 'pl' + env.S.map + x + ',' + y;
    if (S.met[k]) { say(L('DEN HAR FÅTT DRIKKE I DAG.', 'IT HAS HAD ITS WATER TODAY.')); return true; }
    if (S.water < 1) { say([L('KANNA ER TOM.', 'THE CAN IS EMPTY.'), L('Brønnen er ute i gården.', 'The well is out in the yard.')]); env.sfx.deny && env.sfx.deny(); return true; }
    S.water -= 1; S.met[k] = 1; env.sfx.water(); say([L('DU VANNER BLOMSTEN.', 'YOU WATER THE PLANT.'), L('Den retter seg opp, nesten med en gang.', 'It straightens up, almost at once.')]); return true;
  }
  if (act === 'tea') {                                /* the one thing in a house that gives anything back: a little, once a day */
    if (S.met.te) { say([L('TEKOPPEN ER ALLEREDE TOM.', 'THE CUP IS EMPTY.'), L('Kjelen er varm, men du har fått nok.', 'The kettle is warm, but you have had enough.')]); return true; }
    S.met.te = 1; S.en = Math.min(S.enMax, S.en + 6); env.sfx.sleep();
    say([L('DU LAGER TE OG DRIKKER DET STÅENDE.', 'YOU MAKE TEA AND DRINK IT STANDING.'), L('Det varmer helt ned. +6 ENERGI', 'It warms you right down. +6 ENERGY')]);
    return true;
  }
  return false;
}
