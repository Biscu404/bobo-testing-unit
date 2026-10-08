/* Bekkedal — what the two in the square say. One quarter of BEK_TALK;
 * data.js joins the four into one table. Conventions: `.claude/rules/
 * content.md`. A `nodes[]` entry fires once, in array order, so each arc
 * below is stated lowest friendship gate first; `chat[]` is the fallback
 * pool, filtered on `if` every visit.
 *
 * Astrid wants the shop to be worth keeping open, and will not talk about
 * the second name in the ledger. Håkon wants one building that outlasts
 * him, and will not talk about the barn he got wrong.
 */

/* season is an index on S, not an id — see fresh()'s own seasonIndexOf() */
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;
const fish = S => (S.bag.orret || 0) + (S.bag.laks || 0) + (S.bag.torsk || 0) +
                  (S.bag.makrell || 0) + (S.bag.roye || 0) + (S.bag.kveite || 0);
const idle = S => !S.yst.farm && !S.yst.mine && !S.yst.fish && !S.yst.forage;
/* THE LOFT: how much has been carried into the storehouse on the square. Read
   defensively, like every other gate in this file — the state a check hands a
   predicate is not always the state a running game holds. See BEK_LOFT
   (data.js) and spine.js; nothing in BEK_TALK ever writes to it. */
const loft = S => (S.spine && S.spine.d) ? Object.keys(S.spine.d).length : 0;

export const TOWN_TALK = {
  astrid: {
    nodes: [
      { id: 'a1', mood: 'warm',
        lines: [{ no: 'Hei! You are the one who took the old plot.', en: 'Hi! You are the one who took the old plot.' },
                { no: 'Nobody has turned that soil in six years.', en: 'Nobody has turned that soil in six years.', m: 'troubled' }],
        ask: { q: { no: 'Hvorfor kom du til Bekkedal?', en: 'Why did you come to Bekkedal?' }, opts: [
          { t: { no: 'For stillheten.', en: 'For the quiet.' }, set: { why: 'quiet' }, fr: 2,
            reply: ['Then you came to the right valley.',
                    { no: 'Ta disse. Poteter tilgir en nybegynner.', en: 'Take these. Potatoes forgive a beginner.' }],
            give: { potetfro: 6 } },
          { t: { no: 'Jorda var billig.', en: 'Land was cheap.' }, set: { why: 'land' }, fr: 0,
            reply: ['Honest, at least. Ha!',
                    'Cheap land, cheap seed. Here.'],
            give: { potetfro: 8 } }
        ] } },
      { id: 'a2', when: S => S.q.potet === 'active',
        lines: [{ no: 'Five poteter and the board is happy.', en: 'Five potatoes and the board is happy.' }] },
      /* ---- her arc: the order book ---------------------------------- */
      { id: 'aa1', when: S => S.fr.astrid >= 2,
        lines: ['You are reading the order book upside down. Stop.',
                { no: 'Det er tall. Tall er ikke samtale.', en: 'It is numbers. Numbers are not conversation.' }] },
      { id: 'aa2', when: S => S.fr.astrid >= 4,
        lines: [{ no: 'Jeg bestiller for førti. Det bor tjueni her.', en: 'I order for forty. Twenty-nine live here.' },
                'I have done it that way eleven years.',
                { no: 'Fulle kasser får en bygd til å se ut som en bygd.', en: 'Full crates make a village look like a village.', m: 'troubled' }] },
      { id: 'a3', mood: 'warm', when: S => S.fr.astrid >= 6 && S.flag.why === 'quiet',
        lines: ['You still have not complained about the rain.',
                { no: 'That is how I know you meant it. Kaffe, on me.', en: 'That is how I know you meant it. Coffee, on me.' }],
        give: { kaffe: 2 } },
      { id: 'a4', when: S => S.fr.astrid >= 6 && S.flag.why === 'land',
        lines: ['You drive a hard bargain, so I will match it.',
                'Ten percent off, permanently. Do not tell Håkon.'],
        set: { rabatt: 1 } },
      { id: 'aa3', mood: 'troubled', when: S => S.fr.astrid >= 6,
        lines: [{ no: 'Grossisten i byen har satt en nedre grense. Jeg når den ikke.', en: 'The wholesaler in the city has set a minimum. I do not meet it.' },
                { no: 'Så bestiller jeg for en bygd som ikke finnes. Eller så stenger jeg.', en: 'So I order for a village that is not here. Or I close.' }] },
      { id: 'a5', mood: 'warm', when: S => S.fr.astrid >= 8,
        lines: [{ no: 'Jordbær seed came in. Slow, but it pays.', en: 'Strawberry seed came in. Slow, but it pays.' }],
        set: { jordbar: 1 } },
      { id: 'aa4', when: S => S.fr.astrid >= 8,
        lines: ['I sat with the book last night and crossed names out.',
                { no: 'Tjueni navn. Ikke førti. Det er vondt å skrive.', en: 'Twenty-nine names. Not forty. It is a hard thing to write.', m: 'troubled' },
                'The order is smaller now. It is also true.'] },
      { id: 'a6', mood: 'warm', when: S => S.fr.astrid >= 10,
        lines: ['You have made this a real farm. I am glad you stayed.'] },
      { id: 'aa5', mood: 'warm', when: S => S.fr.astrid >= 10,
        lines: [{ no: 'Den nye bestillingen kom. Ingenting til overs, ingenting for lite.', en: 'The new order came. Nothing left over, nothing short.' },
                'And one line at the bottom that is only yours.'],
        give: { lefse: 3 }, set: { astridBok: 1 } },
      /* THE LOFT. Act II has to have closed — the house is the thing that
         should own the early game — and she has to trust you with it, because
         it was her grandmother's. The 6 is BEK_LOFT_FR (data.js), which
         spine.js's spineOpen() reads for the door's own lock; the two are
         stated apart because this file may not import data.js (data.js
         imports this one), and spine_check.js asserts they agree. */
      { id: 'aloft', mood: 'warm', when: S => S.act2Unlocked && S.fr.astrid >= 6,
        lines: [{ no: 'Du har bygget ferdig. Så da spør jeg om noe.', en: 'You have finished building. So now I ask you something.' },
                { no: 'Bygdeloftet ved veien er mormors. Det har stått låst i seks år.', en: 'The loft down the road was my grandmother\u2019s. It has stood locked six years.' },
                { no: 'Hun samlet dalen i det. Alt som vokste, alt som ble fisket, alt som ble hentet ut av fjellet.', en: 'She gathered the valley into it. Everything that grew, everything caught, everything the mountain gave up.' },
                { no: 'Nøkkelen ligger her. Fyll det opp igjen. Trykk L, så husker du hva som mangler.', en: 'Here is the key. Fill it up again. Press L and you will remember what is missing.' }] }
    ],
    chat: [
      { mood: 'warm', t: [{ no: 'Kaffen er på. Sett deg fem minutter. Kundene overlever.', en: 'The coffee is on. Sit for five minutes. The customers will survive.' }] },
      { mood: 'troubled', t: ['My knee says rain by Tuesday. It has not been wrong yet, and I would like it to be, just once.'] },
      { t: ['I stock the lanterns for Lars and he will not take a krone for them. It drives me mad. Do you have one on you?'] },
      { t: ['The road runs west to your gate and east down to the water. I know every door on it by the sound of its latch.'] },
      { t: ['Everything down here is a walk. Only the setra is a journey. I went up once, years ago, and I still have the blister.'] },
      { t: ['Eight to eight I am at the counter. If it rains I stand by the door instead. I like to see who is coming.'] },
      { mood: 'warm', t: ['You came here for the quiet, and I am glad you did not find too much of it. Stay a while, will you?'],
        if: S => S.flag.why === 'quiet' },
      { mood: 'troubled', t: ['You said land was cheap. It is. I wish you would find a few things that were not, and tell me about them.'],
        if: S => S.flag.why === 'land' },
      { t: ['Have you been up to Sigrid at the seter? Ask her for wool before the wind finds you. I mean it, I worry.'],
        if: S => S.disc && S.disc.setra },
      { mood: 'warm', t: ['Håkon came in for nails and said you have been felling. He said it as if it was the best thing he had heard all year. For him, it was.'],
        if: S => S.q.tommer === 'done' },
      { mood: 'warm', t: [{ no: 'Loftet har tak igjen. Jeg tør nesten ikke gå inn. Jeg vil at du skal gå først.', en: 'The loft has a roof again. I can hardly bring myself to go in. I want you to go first.' }],
        if: S => loft(S) >= 8 },
      /* ---- weather ---------------------------------------------------- */
      { mood: 'troubled', t: [{ no: 'Regn. Kneet mitt tok ikke feil. Det gjør det aldri, og jeg hater det.', en: 'Rain. My knee was not wrong. It never is, and I hate that.' }],
        if: S => S.weather === 'regn' },
      { t: ['Rain means the plots are watered for you. I would use the day for something indoors. Have you been in my shop all week? No? Good.'],
        if: S => S.weather === 'regn' },
      { t: [{ no: 'Tåke. Da går ingen forbi, og da selger jeg ingenting. Så jeg kan like godt snakke med deg.', en: 'Fog. Nobody walks past, so I sell nothing. So I may as well talk to you.' }],
        if: S => S.weather === 'take' },
      { t: ['Clear sky. Everybody is out, nobody is buying, and I am stuck behind a counter. Go and enjoy it for me, will you?'],
        if: S => S.weather === 'klar' && S.season === SOMMER },
      /* ---- season ----------------------------------------------------- */
      { t: [{ no: 'Vår. Halve dalen kommer inn for frø og går ut med kaffe. Jeg gjør ikke noe for å hindre det.', en: 'Spring. Half the valley comes in for seed and leaves with coffee. I do nothing to stop it.' }],
        if: S => S.season === VAR },
      { t: [{ no: 'Høst. Nå selger jeg salt og ikke mye annet. Har du saltet nok til vinteren?', en: 'Autumn. Now I sell salt and not much else. Have you salted enough for the winter?' }],
        if: S => S.season === HOST },
      { mood: 'troubled', t: ['Winter. The road ices over and the cart comes when it comes. If you need something, tell me today, not on the day you run out.'],
        if: S => S.season === VINTER },
      /* ---- the hour --------------------------------------------------- */
      { t: ['The shutters are barely up. Give me a moment, and a coffee, and I will be a person.'], if: S => S.min < 8 * 60 },
      { t: [{ no: 'Stengt for lengst. Men døren står åpen for deg, det vet du.', en: 'Shut long ago. But the door stays open for you, you know that.' }],
        if: S => S.min >= 20 * 60 },
      /* ---- what you are carrying -------------------------------------- */
      { t: [{ no: 'Du lukter fisk. Ingrid har lært deg noe, ikke sant? Jeg vet hva hun pleier å kreve for det.', en: 'You smell of fish. Ingrid has taught you something, hasn’t she? I know what she usually asks for it.' }],
        if: S => fish(S) > 0 },
      { mood: 'troubled', t: [{ no: 'Sølv i sekken. Vær så snill, ikke vis det til hvem som helst. Jeg vil ikke høre at noe har skjedd med deg.', en: 'Silver in the bag. Please do not show that to just anyone. I do not want to hear that something happened to you.' }],
        if: S => (S.bag.solv || 0) > 0 },
      { mood: 'warm', t: ['Flowers. Those are not for me, and we both know it. Who are they for? You do not have to say.'],
        if: S => (S.bag.bukett || 0) > 0 || (S.bag.blomst_bla || 0) > 0 },
      /* ---- what you did yesterday ------------------------------------- */
      { t: [{ no: 'Du var i gruva i går. Lykten holdt, ser jeg. Jeg la en til side til deg i tilfelle.', en: 'You were in the mine yesterday. The lantern held, I see. I put another aside for you in case.' }],
        if: S => S.yst.mine > 0 },
      { t: ['You did nothing yesterday. I am not judging. I am noticing. And a little jealous.'], if: idle },
      /* ---- quests open ------------------------------------------------ */
      { t: [{ no: 'Tau til Olav? Det er Lars som fører det nå. Jeg sluttet, og jeg angrer meg ikke engang.', en: 'Rope for Olav? Lars carries that now. I stopped stocking it, and I do not even regret it.' }],
        if: S => S.q.boat === 'active' },
      { t: [{ no: 'Sopp til Ingrid? Gå der skogen er mørkest. Og ta med meg en liten en hjem, hvis du tør å love.', en: 'Mushrooms for Ingrid? Go where the wood is darkest. And bring me a small one home, if you dare promise.' }],
        if: S => S.q.sopp === 'active' },
      /* ---- the rest of the valley ------------------------------------- */
      { t: [{ no: 'Håkon reiser sperrene dine i dag. Han sa "mm" om det. For ham er det en lang tale.', en: 'Håkon is raising your rafters today. He said "mm" about it. For him that is a long speech.' }],
        if: S => S.flag.lot && !S.built },
      { mood: 'troubled', t: ['I have been keeping Marit’s salt for a month and she has not come down for it. Would you take it up when you go? I would go myself, but my knee.'],
        if: S => S.disc && S.disc.enga },
      { t: [{ no: 'Sigrid er nede i dalen nå. Jeg tror hun hater det. Hun sier det aldri, så jeg lar henne få kaffe uten å spørre.', en: 'Sigrid is down in the valley now. I think she hates it. She never says so, so I give her coffee without asking.' }],
        if: S => S.season === VINTER && S.disc && S.disc.setra },
      { mood: 'troubled', t: ['Olav was in for rope. His boat has been patched for years, and I asked him why he does not just rebuild it. He looked at me as if I had said something rude.'],
        if: S => S.disc && S.disc.lake },
      /* ---- what she will not talk about -------------------------------- */
      { mood: 'troubled', t: [{ no: 'Det står to navn i kassaboken. Det er vanskelig å snakke om. Spør meg en annen dag, og jeg skal prøve.', en: 'There are two names in the ledger. It is hard to talk about. Ask me another day and I will try.' }],
        if: S => S.fr.astrid >= 6 },
      { t: ['There is a page in that book I have not turned in years. I keep it because tearing it out would show. I think you understand that.'],
        if: S => S.fr.astrid >= 8 },
      { mood: 'warm', t: [{ no: 'Bestillingen stemmer nå. Jeg har ikke følt det på tretti år. Jeg ville fortelle det til noen, og du var først inn døren.', en: 'The order is right now. I have not felt that in thirty years. I wanted to tell somebody, and you were first through the door.' }],
        if: S => S.flag.astridBok },
      /* the four festival beats — one per season, gated on S.festival the
         same way every other chat line here gates on S.flag/S.fr. See
         BEK_FESTIVALS (data.js) for the day and the map dressing that goes
         with each. */
      { mood: 'warm', t: [{ no: 'Vårblot i dag! Se deg rundt — noen har satt blomster på torget. Jeg tror det var Marit. Hun benekter det.', en: 'Spring Festival today! Look around — someone has put flowers up in the square. I think it was Marit. She denies it.' }],
        if: S => S.festival === 'var' },
      { mood: 'warm', t: [{ no: 'Solsnu i dag! Torget er pyntet for den lyseste natten. Du blir til det blir mørkt, ikke sant? Det blir det aldri helt.', en: 'Midsummer today! The square is dressed for the lightest night. You will stay until it gets dark, won’t you? It never quite does.' }],
        if: S => S.festival === 'sommer' },
      { mood: 'warm', t: [{ no: 'Haustgilde i dag — vi takker for avlingen, før frosten tar den. Har du noe å takke for? Jeg har, i år.', en: 'Harvest Fair today — we give thanks for the crop before the frost takes it. Do you have something to be thankful for? I do, this year.' }],
        if: S => S.festival === 'host' },
      { mood: 'warm', t: [{ no: 'Juleblot i dag. Kaldt ute, men torget er pyntet likevel, og jeg har varm drikke. Kom nærmere disken.', en: 'Midwinter Feast today. Cold out, but the square is dressed all the same, and I have something hot. Come closer to the counter.' }],
        if: S => S.festival === 'vinter' },
      { t: [{ no: 'Alle åtte på ett torg. Det skjer fire ganger i året, og jeg teller hver gang. Jeg tror jeg er den eneste som gjør det.', en: 'All eight of us in one square. It happens four times a year, and I count every time. I think I am the only one who does.' }],
        if: S => !!S.festival },
      /* the tau/spiker Astrid used to carry are Lars's stock too — freeing
         one shop row is what makes room for the sprinkler on this list
         without the shop panel growing past SHOP_ROWS */
      { t: [{ no: 'Sekken din ser tung ut. Jeg har en større. Den bærer mer før ryggen din klager. Vil du ha den?', en: 'Your bag looks heavy. I have a bigger one. It carries more before your back complains. Do you want it?' }],
        if: S => !S.bagTier && S.fr.astrid >= 2,
        buy: { label: { no: 'STØRRE SEKK — 1200 kr', en: 'BIGGER BAG — 1200 kr' }, kr: 1200, bagCapAdd: 40, bagTier: 1,
               ok: ['There. Room to breathe.'],
               no: ['1200 kr. Ask me again later.'] } },
      { t: [{ no: 'Det finnes en enda større sekk, hvis den første ikke var nok. Jeg har sett deg bære. Jeg tror du vil ha den.', en: 'There is a bigger bag still, if the first was not enough. I have watched you carry. I think you will want it.' }],
        if: S => S.bagTier === 1 && S.fr.astrid >= 6,
        buy: { label: { no: 'STOR SEKK — 3400 kr', en: 'BIG BAG — 3400 kr' }, kr: 3400, bagCapAdd: 60, bagTier: 2,
               ok: ['Now you can carry half the valley.'],
               no: ['3400 kr. When you have it.'] } },
      { t: [{ no: 'Du bærer vann hele dagen i den lille kannen. Jeg har sett det. Jeg har en større som vanner tre furer av gangen.', en: 'You carry water all day in that little can. I have seen it. I have a bigger one that waters three furrows at once.' }],
        if: S => !S.kanneLv && S.fr.astrid >= 4,
        buy: { label: { no: 'STOR VANNKANNE — 2600 kr', en: 'BIG WATERING CAN — 2600 kr' }, kr: 2600, kanneLv: 1, waterMaxAdd: 15,
               ok: ['Mind your wrist. It is heavier full.'],
               no: ['2600 kr. Come back when you have it.'] } },
      /* Act II: one late beat per character acknowledging the finished
         house, gated on S.act2Unlocked exactly like the festival lines
         above gate on S.festival — a chat entry, not a node, so it keeps
         resurfacing rather than firing once and being spent. */
      { mood: 'warm', t: ['The house by the water is standing now. Marit says you can see its smoke from the churchyard. This valley needed one more chimney.'],
        if: S => S.act2Unlocked },
      { t: [{ no: 'Tretti navn i boken igjen. Ditt er det nyeste, og jeg skrev det med en penn jeg ellers sparer.', en: 'Thirty names in the book again. Yours is the newest, and I wrote it with the pen I usually save.' }],
        if: S => S.act2Unlocked && S.flag.astridBok },
      /* ---- and the ones that are only to you ----------------------------- */
      { t: ['How are you sleeping out there? Honestly. A farm at night makes noises and nobody tells you which ones to worry about.'] },
      { t: ['Tell me what you are planting this week. I like to know before the seed runs out, not after.'] },
      { mood: 'warm', t: ['You are always welcome to stand by the counter. Do not buy anything. Just stand. It is good for the shop to have somebody in it.'],
        if: S => S.fr.astrid >= 4 }
    ],
    shop: ['potetfro', 'nepefro', 'gulrotfro', 'kalfro', 'jordbarfro', 'rabarbrafro',
           'laukfro', 'purrefro', 'kalrotfro', 'gresskarfro', 'spinatfro', 'gronnkalfro',
           'kaffe', 'vaffel', 'lefse', 'lykt', 'sprinkler', 'jar', 'keg']
  },

  hakon: {
    nodes: [
      { id: 'h1',
        lines: ['Snekkeriet. I build what people can pay for.',
                { no: 'You will want a house eventually. They all do.', en: 'You will want a house eventually. They all do.', m: 'warm' }],
        ask: { q: { no: 'Hvordan skal det bygges?', en: 'How should it be built?' }, opts: [
          { t: { no: 'Fra skogen. Jeg feller det selv.', en: 'From the forest. I will fell it myself.' }, set: { build: 'skog' }, fr: 2,
            reply: ['Good. Timber you carry is timber you respect.',
                    { no: 'Thirty tømmer, twenty stein, and 5000 kr.', en: 'Thirty timber, twenty stone, and 5000 kr.' }] },
          { t: { no: 'Bestill plankene. Jeg betaler.', en: 'Order the planks. I will pay.' }, set: { build: 'kjop' }, fr: 0,
            reply: ['City answer. Fine. It costs what it costs.',
                    { no: 'Twelve tømmer, ten stein, and 6500 kr.', en: 'Twelve timber, ten stone, and 6500 kr.' }] }
        ] } },
      { id: 'h2', when: S => S.q.tommer === 'active',
        lines: [{ no: 'Ten tømmer. The øks is by the stump, as always.', en: 'Ten timber. The axe is by the stump, as always.' }] },
      /* ---- his arc: one thing that outlasts him ---------------------- */
      { id: 'ha1', when: S => S.fr.hakon >= 2,
        lines: ['Mm.',
                { no: 'Du står der fortsatt. Greit.', en: 'You are still standing there. Fine.' },
                'Forty-one jobs in this valley. Thirty-eight of them were repairs.'] },
      { id: 'h3', when: S => S.q.tommer === 'done' && !S.flag.lot,
        lines: [{ no: 'Tomten ved vannet er til salgs. 6000 kr.', en: 'The lot by the water is for sale. 6000 kr.' },
                'Trees on three sides, water on the fourth.',
                'Sign is down there. I will know when you have.'] },
      { id: 'h4', when: S => S.q.tommer === 'done' && S.axeLv < 2,
        lines: [{ no: 'The big gran need a STÅLØKS. I sell one for 3200 kr.', en: 'The big firs need a STEEL AXE. I sell one for 3200 kr.' }],
        buy: { label: { no: 'STÅLØKS — 3200 kr', en: 'STEEL AXE — 3200 kr' }, kr: 3200, axeLv: 2,
               ok: ['Mind the swing. It bites deeper.'],
               no: ['3200 kr. Come back when you have it.'] } },
      { id: 'ha2', when: S => S.fr.hakon >= 4,
        lines: ['Three of them are mine. A shed, a pen, a privy.',
                { no: 'Ingen av dem står om femti år.', en: 'None of the three stand in fifty years.', m: 'troubled' },
                'A man should be able to point at one thing.'] },
      { id: 'ha3', mood: 'troubled', when: S => S.fr.hakon >= 6,
        lines: [{ no: 'Stavkirken oppe på enga. Mønsåsen er råtten i vestre ende.', en: 'The stave church up on the meadow. The ridge beam is rotten at the west end.' },
                'I went up and looked at it once. A long time ago.',
                { no: 'Menigheten hadde ingen penger. Så gikk jeg ned igjen.', en: 'The parish had no money. So I walked back down.' }] },
      { id: 'h5', mood: 'warm', when: S => S.fr.hakon >= 8 && S.flag.build === 'skog',
        lines: ['Five hundred off the house. You did the felling, not me.'],
        set: { rabatt2: 1 } },
      { id: 'ha4', when: S => S.fr.hakon >= 8,
        lines: ['Marit sent word down. She did not ask. She described it.',
                { no: 'Det er en verre måte å be på. Den virker.', en: 'That is a worse way to ask. It works.' },
                'I am going up with a rule and a saw.'] },
      { id: 'ha5', mood: 'warm', when: S => S.fr.hakon >= 10,
        lines: [{ no: 'Mønsåsen er skiftet. Furu, kjerneved, felt om vinteren.', en: 'The ridge beam is changed. Pine, heartwood, felled in winter.' },
                'It will hold four hundred winters. I will see none of them.',
                { no: 'Jeg tok ikke betalt. Ikke spør hvorfor.', en: 'I took no payment. Do not ask why.' }],
        set: { mone: 1 } }
    ],
    chat: [
      { t: ['Mm. Let me see your hands.', 'Good. Calluses where the axe sits. You are doing it right.'] },
      { t: ['Build in summer. Wood moves in autumn and I would not like to watch you chase a door round a frame.'] },
      { t: [{ no: 'Stein kommer ut av gruva sammen med malmen. Ta med begge deler, så slipper du å gå to turer. Jeg har gått for mange.', en: 'Stone comes out of the mine with the ore. Bring both, so you do not walk twice. I have walked too many twice.' }] },
      { mood: 'warm', t: ['You chose to fell it yourself. I think about that. Timber you carry is timber you respect, and I could tell from how you stand.'],
        if: S => S.flag.build === 'skog' },
      { mood: 'troubled', t: ['The planks are ordered. They come when they come. I know that is not what you want to hear. I would not like it either.'],
        if: S => S.flag.build === 'kjop' },
      /* THE LOFT */
      { t: [{ no: 'Jeg gikk inn i loftet og så på laftet. Den som hogg det kunne faget sitt. Jeg ble stående lenge. Du må gå og se.', en: 'I went into the loft and looked at the joints. Whoever cut them knew the trade. I stood there a long time. You should go and look.' }],
        if: S => loft(S) >= 1 },
      /* ---- weather ---------------------------------------------------- */
      { mood: 'troubled', t: [{ no: 'Regn. Da høvler jeg under takskjegget. Kom og stå her, hvis du har lyst. Det er tørt. Du trenger ikke snakke.', en: 'Rain. Then I plane under the eaves. Come and stand here if you like, it is dry. You do not have to talk.' }],
        if: S => S.weather === 'regn' },
      { t: [{ no: 'Tåke. Jeg kan ikke sikte langs en planke i dette. Jeg tar en kaffe i stedet. Vil du ha?', en: 'Fog. I cannot sight down a plank in this. I will have a coffee instead. Want one?' }],
        if: S => S.weather === 'take' },
      /* ---- season ----------------------------------------------------- */
      { t: [{ no: 'Furu felt om vinteren har ingen sevje og vrir seg ikke. Vent til det er kaldt, så kan jeg vise deg.', en: 'Pine felled in winter has no sap and does not twist. Wait till it is cold and I will show you.' }],
        if: S => S.season === VINTER },
      { t: ['Spring wood is wet wood. If you fell it now it warps by autumn. I will tell you if you are about to make that mistake. I made it.'],
        if: S => S.season === VAR },
      { t: [{ no: 'Sommer. Nå tørker det jeg felte i fjor. Det er hele jobben, og jeg er glad i den.', en: 'Summer. Now what I felled last year dries. That is the whole job, and I am fond of it.' }],
        if: S => S.season === SOMMER },
      { t: ['Autumn. Everything I have built is about to get tested by weather. I do not sleep much in October.'],
        if: S => S.season === HOST },
      /* ---- the hour --------------------------------------------------- */
      { t: ['Seven to eight, and the site is where I am. Not the shop. Follow the sawdust.'], if: S => S.min < 9 * 60 },
      { mood: 'troubled', t: [{ no: 'Mørkt. En sag i mørket tar en finger. Gå hjem, du også. Vi snakker i morgen.', en: 'Dark. A saw in the dark takes a finger. Go home, you too. We talk tomorrow.' }],
        if: S => S.min >= 20 * 60 },
      /* ---- what you are carrying -------------------------------------- */
      { mood: 'warm', t: [{ no: 'Du bærer tømmer. Da trenger vi ikke snakke. Sett det ved veggen, jeg tar det.', en: 'You are carrying timber. Then we need not talk. Set it by the wall, I will take it.' }],
        if: S => (S.bag.tommer || 0) > 0 },
      { t: [{ no: 'Stein i sekken og rett rygg. Du lærer. Jeg tror du kommer til å bli en som kan.', en: 'Stone in the bag and a straight back. You are learning. I think you will turn into somebody who can.' }],
        if: S => (S.bag.stein || 0) >= 3 },
      /* ---- what you did yesterday ------------------------------------- */
      { t: ['You felled yesterday. I heard which tree it was. Spruce, wasn’t it? I know the sound.'], if: S => S.yst.forage > 0 && S.q.tommer !== 'active' },
      { mood: 'troubled', t: ['You did nothing yesterday. I have had those days. They add up. Come and hold a plank for me, it helps.'], if: idle },
      /* ---- the rest of the valley ------------------------------------- */
      { t: [{ no: 'Jeg trodde Astrid førte spiker. Nei. Det gjør Lars nå. Jeg glemmer det hver gang og går feil vei. Ikke fortell henne.', en: 'I thought Astrid stocked nails. No. Lars does now. I forget every time and walk the wrong way. Do not tell her.' }] },
      { mood: 'troubled', t: ['Olav was by for planks. I told him to patch the boat properly or build it again. He did not speak to me for two days. I was right, though.'],
        if: S => S.disc && S.disc.lake },
      { t: [{ no: 'Kirken på enga heller. Jeg gikk opp og så på den en gang. Den har hellet i åtte hundre år, og jeg hadde ikke hjerte til å si det til Marit.', en: 'The church on the meadow leans. I went up and looked at it once. It has leaned eight hundred years, and I did not have the heart to tell Marit.' }],
        if: S => S.disc && S.disc.enga },
      { t: ['Lars was by about props. His are green timber. I told him twice. He said "mm." I think he learned that from me.'],
        if: S => S.disc && S.disc.gruva },
      /* ---- what he will not talk about --------------------------------- */
      { mood: 'troubled', t: [{ no: 'Det står et fjøs lenger opp i dalen med mitt navn på. Ikke spør meg. Jeg vil fortelle deg om det en dag, men ikke i dag.', en: 'There is a barn further up the valley with my name on it. Do not ask me. I will tell you about it one day, but not today.' }],
        if: S => S.fr.hakon >= 6 },
      { t: ['I was twenty-three and I was sure. That is all I can tell you. But you asked me, and I am glad.'], if: S => S.fr.hakon >= 8 },
      { mood: 'warm', t: [{ no: 'Åsen ligger, og jeg sover bedre. Åtte hundre vintre til, om ingen roter det til. Takk for at du kom med meg dit.', en: 'The beam is in, and I sleep better. Eight hundred more winters, if nobody meddles. Thank you for coming with me.' }],
        if: S => S.flag.mone },
      { t: [{ no: 'Jorda sør for tomten din ville pløyd rent, om du ville bryte den. Jeg har sett på den. Jeg tror du kan klare det.', en: 'The ground south of your plot would till clean, if you wanted it broken. I have looked at it. I think you can manage it.' }],
        if: S => !S.flag.plot2 && S.q.tommer === 'done',
        buy: { label: { no: 'NYTT JORDE — 3000 kr', en: 'NEW FIELD — 3000 kr' }, kr: 3000, flag: { plot2: 1 },
               ok: ['I will have it cleared by morning.'],
               no: ['3000 kr. The ground will keep.'] } },
      { t: [{ no: 'Det første jordet er fullt og du ser stadig utover. Jeg kan bryte enda lenger ut, hvis du vil.', en: 'The first field is full and you keep looking further out. I can break ground further still, if you want.' }],
        if: S => S.flag.plot2 && !S.flag.plot3,
        buy: { label: { no: 'STØRRE JORDE — 6000 kr', en: 'BIGGER FIELD — 6000 kr' }, kr: 6000, flag: { plot3: 1 },
               ok: ['That is most of the flat ground gone now.'],
               no: ['6000 kr. No rush.'] } },
      { t: ['Somebody’s goats were in your crop last night, I hear. A pen in the corner would keep the animals off what you just cleared.'],
        if: S => S.flag.plot3 && !S.flag.barn,
        buy: { label: { no: 'DYREINNHEGNING — 4000 kr', en: 'ANIMAL PEN — 4000 kr' }, kr: 4000, flag: { barn: 1 },
               ok: ['Fenced and strawed. Sigrid will sell you what goes in it.'],
               no: ['4000 kr. The fence will keep.'] } },
      /* Act II: the pen's second tier — kr-only, so the generic `buy` offer
         fits (unlike the house tier itself, which spends tømmer/stein too
         and stays in hakonBuild()). Gated on S.flag.barn so it only ever
         follows the first pen, and S.act2Unlocked so it cannot outrun the
         house. See BEK_BARN_PLOT2/BEK_BARN_SLOTS2 (data.js). */
      { t: [{ no: 'Nå som du har eget tak, kunne innhegningen også vokse. Jeg vet du har sett på den. Si bare ifra.', en: 'Now that you have a roof of your own, the pen could grow too. I know you have been looking at it. Just say.' }],
        if: S => S.act2Unlocked && S.flag.barn && !S.flag.barn2,
        buy: { label: { no: 'DYREINNHEGNING II — 7000 kr', en: 'ANIMAL PEN II — 7000 kr' }, kr: 7000, flag: { barn2: 1 },
               ok: ['Doubled it. Sigrid will be glad to hear it.'],
               no: ['7000 kr. It will keep.'] } },
      { mood: 'warm', t: [{ no: 'Huset ditt står i vinkel. Jeg sjekket mens du ikke så på. Jeg hadde ikke trengt det, men jeg ville.', en: 'Your house stands square. I checked while you were not looking. I did not need to, but I wanted to.' }],
        if: S => S.act2Unlocked },
      { t: [{ no: 'Førtitre jobber nå. To av dem blir stående. Det er nok, og du var en av dem.', en: 'Forty-three jobs now. Two of them will stand. That is enough, and you were one of them.' }],
        if: S => S.act2Unlocked && S.flag.mone },
      /* ---- and the ones that are only to you ----------------------------- */
      { t: ['Mm. Do you want to know how to tell good timber from bad? Knock on it. Listen. It tells you.'] },
      { mood: 'warm', t: ['I do not say much. I want you to know that is not because I have nothing to say to you.'],
        if: S => S.fr.hakon >= 4 }
    ],
    /* ---- FURNISHING: not `shop` — that field is read unconditionally at
       the end of every conversation (openMenu(), index.js) and would skip
       hakonBuild()'s whole lot/house/tier funnel. This one is opened by
       hakonTilbygg() itself, once there is nothing else left to build —
       a carpenter selling furniture once the house is up. */
    /* gjerde stays craft-only, same as it always was ("not sold anywhere" —
       BEK_ITEMS.gjerde) — everything else here is buyable and craftable both */
    furniture: ['stol', 'bord', 'matte', 'seng', 'hylle', 'kommode', 'lampe', 'lys', 'veggbilde',
                'grind', 'sti', 'blomsterkasse', 'benk', 'fugleskremsel', 'skilt']
  }
};
