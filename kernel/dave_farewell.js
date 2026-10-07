/* What Dave says on the way out. PURE: no DOM, no clock, no Web Audio. The box that says it is kernel/dave_box.js; the voice it says it in
   is kernel/dave_plan.js (what is sounded) and kernel/dave_voice.js (how); `node scripts/check-farewell.mjs` holds all of it to its numbers.

   When the shop window closes, Dave says one line, and which one depends on what was bought from him:
     blink       the window was open for a blink and nothing was bought
     never       nothing bought this visit, and nothing has ever been bought from him (insulted, begging)
     nothing     nothing bought this visit, but there is a history (sulking, and he knows the total)
     little      one or two cheap things
     fair        a fair amount
     lot         a big spender
     everything  every shelf is bare: the whole shop is yours (said whether you have just done it or did it long ago)
   A line is a string, or a function of the visit `v` (below) that gives a string, or '' / null to say it does not apply. */

export const FAREWELL_MAX = 130;          /* characters: four lines of the box */
export const BLINK_MS = 4000;             /* a visit shorter than this, with nothing bought, is a blink */
export const FAIR_SPEND = 600, FAIR_COUNT = 3;
export const LOT_SPEND = 3000, LOT_COUNT = 7;

export const TIERS = ['blink', 'never', 'nothing', 'little', 'fair', 'lot', 'everything'];

/* how he sounds saying it: pitch (1 = his own), wobble (how far the pitch wanders), rate (above 1 is slower) */
export const VOICES = {
  blink:      { pitch: 1.28, wobble: 0.24, rate: 0.85 },
  never:      { pitch: 1.18, wobble: 0.26, rate: 1.0 },
  nothing:    { pitch: 0.86, wobble: 0.12, rate: 1.2 },
  little:     { pitch: 1.0,  wobble: 0.15, rate: 1.0 },
  fair:       { pitch: 1.05, wobble: 0.16, rate: 0.95 },
  lot:        { pitch: 1.16, wobble: 0.2,  rate: 0.85 },
  everything: { pitch: 0.8,  wobble: 0.1,  rate: 1.25 }
};

export const num = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const the = name => (/^THE /.test(name) ? name : 'THE ' + name);

/* The visit, as the lines see it.
     before, after   the owned lists when the shop opened and when it closed:  { frame: ['beige', ...], ... }
     lists           what the shop sells:  { frame: [{ id, name, price }, ...], ... }
     ms              how long the window was open
   gives { bought: [{ cat, id, name, price }], count, spent, top (the dearest thing bought now, or null), lifeSpent (every sun ever left
   at his till, which is the price of everything owned: the starting things are free), owned, total, left, ms } */
export function summarize(before, after, lists, ms) {
  const had = {};
  Object.keys(before || {}).forEach(c => { had[c] = new Set(before[c]); });
  const bought = [];
  let lifeSpent = 0, owned = 0, total = 0;
  Object.keys(lists).forEach(c => {
    const have = new Set((after && after[c]) || []);
    lists[c].forEach(it => {
      total++;
      if (!have.has(it.id)) return;
      owned++;
      lifeSpent += it.price;
      if (!(had[c] && had[c].has(it.id))) bought.push({ cat: c, id: it.id, name: it.name, price: it.price });
    });
  });
  let top = null, spent = 0;
  bought.forEach(b => { spent += b.price; if (!top || b.price > top.price) top = b; });
  return { bought, count: bought.length, spent, top, lifeSpent, owned, total, left: total - owned, ms: ms || 0 };
}

export function tierOf(v) {
  if (v.total > 0 && v.owned >= v.total) return 'everything';
  if (v.count === 0) {
    if (v.ms < BLINK_MS) return 'blink';
    return v.lifeSpent > 0 ? 'nothing' : 'never';
  }
  if (v.spent >= LOT_SPEND || v.count >= LOT_COUNT) return 'lot';
  if (v.spent >= FAIR_SPEND || v.count >= FAIR_COUNT) return 'fair';
  return 'little';
}

export const POOLS = {
  blink: [
    'THAT WAS NOT EVEN A VISIT. THAT WAS A DOOR BEING A DOOR.',
    'THREE SECONDS! I HAD JUST FOUND MY POT! I HAD NOT YET FOUND MY HAT!',
    'HELLO! GOODBYE! WELCOME! WHERE ARE YOU GOING! THE SALE IS PERMANENT!',
    'I HAD A WHOLE SPEECH. IT WAS GOING TO BE GREAT. IT HAD A SECOND HALF.',
    'DID YOU SEE SOMETHING? DID IT LOOK AT YOU? THAT\'S THE SHOP. IT DOES THAT.',
    'WHO LEAVES THAT FAST? A GHOST. A GHOST WITH A BUS TO CATCH.',
    'I BLINKED AND YOU WERE GONE. I WON\'T BLINK AGAIN. EVER. ASK MY EYES.',
    'COME BACK IN AND PRETEND THAT NEVER HAPPENED. I\'LL PRETEND TOO. I\'M GREAT AT IT.'
  ],
  never: [
    'YOU LOOKED AT EVERYTHING AND BOUGHT NOTHING. I\'LL BE IN THE BACK. CRYING. NOT REALLY. YES REALLY.',
    'NOTHING? NOT EVEN A POINTER? I HAVE POINTERS FOR NINETY SUN. NINETY!',
    'PLEASE. ONE FRAME. ANY FRAME. THE POT ON MY HEAD IS GETTING HEAVY AND SO IS THE SILENCE.',
    'FINE. GO. THE SHOP WILL KEEP YOUR SPOT WARM. THE SPOT IS THE FLOOR. IT WILL BE VERY WARM.',
    'I DID NOT PUT A POT ON MY HEAD FOR THIS. OK I DID. BUT NOT FOR THIS.',
    'YOU\'VE NEVER BOUGHT A THING FROM ME. NOT ONE THING! I ASKED MY BROTHER. HE SAYS IT\'S YOU.',
    'COME BACK WITH SUN. OR COME BACK WITH A SANDWICH. I\'LL TAKE EITHER. I AM VERY OPEN.',
    'THAT\'S FINE. I DIDN\'T WANT YOUR SUN ANYWAY. I WANTED YOUR FRIENDSHIP. AND THE SUN.',
    'I\'LL JUST WRAP ALL THIS UP AGAIN. ALONE. IN THE DARK. THE POTS WILL HELP.'
  ],
  nothing: [
    v => 'YOU\'VE LEFT ' + num(v.lifeSpent) + ' SUN WITH ME BEFORE. TODAY, A LOOK. I\'LL TAKE THE LOOK. IT\'S A GOOD LOOK.',
    'NO SUN TODAY? THAT\'S ALL RIGHT. THE POTS CAN WAIT. THE POTS ARE VERY GOOD AT IT.',
    'I SEE. WINDOW SHOPPING. THERE ARE NO WINDOWS. YOU\'RE WALL SHOPPING.',
    v => 'YOU HAVE ' + v.owned + ' OF ' + v.total + ' ALREADY. TODAY YOU\'RE JUST VISITING. HOW DO I FEEL? DIAGONAL.',
    'DON\'T WORRY. I\'M NOT HURT. I\'M ONLY A LITTLE HURT. IN ONE ELBOW.',
    'YOU BROWSED. YOU TOUCHED. YOU LEFT. THAT\'S HOW THE BEAR DOES IT. WE DON\'T TALK ABOUT THE BEAR.',
    'I\'LL KEEP EVERYTHING EXACTLY WHERE IT IS. LIKE A LITTLE MUSEUM. OF YOUR INDECISION.',
    'NEXT TIME BRING A BIGGER POCKET. OR A SECOND POCKET. OR A POCKET FOR THE POCKET.'
  ],
  little: [
    v => v.top ? the(v.top.name) + '! A BEGINNING! A SMALL, QUIET, TWO-FRIEND BEGINNING.' : '',
    v => num(v.spent) + ' SUN! I CAN BUY AT LEAST A SANDWICH WITH THAT. PROBABLY HALF A ONE.',
    'A LITTLE SOMETHING IS A LOT MORE THAN A LITTLE NOTHING. I DID THE MATHS. THE MATHS CRIED.',
    v => v.top ? 'LOOK AFTER ' + the(v.top.name) + '. IT HAS NEVER BEEN ANYBODY\'S BEFORE. EXCEPT MINE. AND THE BEAR\'S.' : '',
    'CHEAP BUT HONEST. LIKE ME. I\'M ONLY ONE OF THOSE.',
    'SMALL SPENDERS HAVE SMALL HANDS AND LARGE HEARTS. I READ THAT ON A DOOR.',
    'YOU TOOK IT AND YOU WENT. LIKE A CAT. A CAT WHO PAYS. MY FAVOURITE KIND.',
    'COME BACK WHEN YOU HAVE MORE SUN AND LESS RESTRAINT.',
    v => v.count === 2 ? 'TWO WHOLE THINGS! I\'D TELL MY MOTHER BUT SHE IS A LAMP.' : ''
  ],
  fair: [
    v => 'YOU SPENT ' + num(v.spent) + ' SUN. THAT\'S A REAL AMOUNT. THAT\'S A NUMBER WITH A SHAPE.',
    'A FAIR HAUL! THE SHOP FEELS LIGHTER. THE TILL FEELS HEAVIER. I FEEL BOTH. IT\'S CONFUSING.',
    v => v.top ? the(v.top.name) + ' IS A GOOD ONE. I\'D SAY THAT TO ANYBODY, BUT I\'M SAYING IT TO YOU.' : '',
    'YOU CAME, YOU SAW, YOU SPENT A FAIR BIT. I\'M PUTTING YOU ON THE WALL. THE WALL IS EMPTY. THANK YOU.',
    v => v.count >= 2 ? num(v.count) + ' THINGS! MY HANDS ARE FULL AND I\'M NOT HOLDING ANYTHING.' : '',
    'THIS IS WHAT A CUSTOMER LOOKS LIKE. I HAD FORGOTTEN. IT\'S SO NICE.',
    'DON\'T TELL THE BEAR YOU PAID. HE\'LL WANT A DISCOUNT. HE HAS NO SUN. HE HAS A BROOM.',
    'WE HAD A DEAL, YOU AND I. YOU SPENT AND I SMILED. THE SMILE WAS FREE.'
  ],
  lot: [
    v => 'YOU SPENT ' + num(v.spent) + ' SUN' + (v.top ? ' ON ' + the(v.top.name) + (v.count > 1 ? ' AND FRIENDS' : '') : '') + '. I NEED A BIGGER SOCK.',
    'WHO ARE YOU. WHO SENT YOU. WHY ARE YOU SO WONDERFUL. DON\'T ANSWER. JUST DON\'T STOP.',
    v => num(v.spent) + ' SUN! I\'M GOING TO BUY A SECOND POT. FOR MY OTHER HEAD.',
    'THE TILL IS SINGING. I DIDN\'T KNOW IT COULD SING. IT\'S ALL I\'VE EVER WANTED.',
    v => v.count >= 2 ? num(v.count) + ' PURCHASES! I\'LL NAME A BIRD AFTER YOU. THE BIRD WILL NOT KNOW. THE BIRD IS OVERJOYED.' : '',
    'I\'M SO HAPPY I COULD EAT A FRAME. I\'M NOT GOING TO. I\'M SAYING I COULD.',
    'FROM NOW ON I\'LL ONLY SELL TO YOU. AND THE BEAR. BUT MOSTLY YOU.',
    'YOUR MONITOR IS GOING TO BE SO FANCY. EVEN THE SCREWS WILL FEEL LOVED.',
    'YOU\'RE NOT A CUSTOMER ANYMORE. YOU\'RE FAMILY. THE KIND THAT PAYS. I\'M CRYING INTO THE POT.'
  ],
  everything: [
    'THERE\'S NOTHING LEFT. YOU BOUGHT THE WHOLE SHOP. I\'M JUST A MAN IN A POT NOW.',
    v => 'EVERYTHING. ALL ' + v.total + ' THINGS. I HAVE NOTHING TO SELL YOU. I HAVE NEVER BEEN SO FREE. OR SO SCARED.',
    'WHAT DO I DO NOW? DO I CLOSE? DO I LIE DOWN? I\'LL DO BOTH. IN THAT ORDER. OR THE OTHER ORDER.',
    v => 'YOU\'VE LEFT ' + num(v.lifeSpent) + ' SUN AT MY TILL. I\'M GOING TO RETIRE. TO THE BACK ROOM.',
    'THE SHELVES ARE EMPTY. THE POTS ARE EMPTY. I\'M EMPTY. IN A GOOD WAY. IT\'S COMPLICATED.',
    'IF YOU NEED ANYTHING, TOO BAD. I MEAN, YOU HAVE IT. YOU HAVE ALL OF IT. ASK YOURSELF.',
    'I\'LL RESTOCK. WITH WHAT? HOPE! HOPE IS NOT FOR SALE. IT\'S AT THE BACK. FREE.',
    'YOU DID IT. THE WHOLE SHOP. MY MOTHER WOULD BE SO PROUD. SHE\'S A LAMP, BUT STILL.',
    v => v.top ? 'AND ' + the(v.top.name) + ' WAS THE LAST ONE. THE LAST ONE! I WANT A MEDAL. FOR YOU. AND ME.' : ''
  ]
};

/* every line that applies to this visit */
export function linesFor(v) {
  const out = [];
  POOLS[tierOf(v)].forEach(e => { const t = typeof e === 'function' ? e(v) : e; if (t) out.push(t); });
  return out;
}

/* One line for this visit, never the one he said last time (`last`, the text), by `rng` (0 <= r < 1). */
export function pickFarewell(v, rng, last) {
  rng = rng || (() => Math.random());
  const tier = tierOf(v);
  const all = linesFor(v);
  const fresh = all.filter(t => t !== last);
  const from = fresh.length ? fresh : all;
  return { tier, text: from[Math.floor(rng() * from.length)], voice: VOICES[tier] };
}
