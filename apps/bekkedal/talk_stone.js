/* Bekkedal — what the two on the far side of the treeline say. One quarter
 * of BEK_TALK; see talk_town.js's header for the shape and the conventions.
 *
 * Gunnar wants the reindeer to keep crossing, and will not say the names of
 * the men he has carried down. Lars wants the vein the old crew was driving
 * for, and will not talk about the level he props shut every spring.
 */

const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;
const idle = S => !S.yst.farm && !S.yst.mine && !S.yst.fish && !S.yst.forage;
/* THE LOFT: how much has been carried into the storehouse on the square —
   read defensively, like every gate in these files. See BEK_LOFT (data.js). */
const loft = S => (S.spine && S.spine.d) ? Object.keys(S.spine.d).length : 0;
const ore = S => (S.bag.jern || 0) + (S.bag.kobber || 0) + (S.bag.solv || 0);

export const STONE_TALK = {
  gunnar: {
    nodes: [
      { id: 'g1', mood: 'troubled',
        lines: ['Few come up onto the vidda on purpose. Fewer twice.'],
        ask: { q: { no: 'Feller du her oppe, eller ser du bare på?', en: 'Do you trap up here, or watch?' }, opts: [
          { t: { no: 'Feller. Et levebrød er et levebrød.', en: 'Trap. A living is a living.' }, set: { fell: 'jakt' }, fr: 2,
            reply: [{ no: 'Honest. Tyttebær grow thick past the tarn. Sell them low, sell them often.', en: 'Honest. Lingonberries grow thick past the tarn. Sell them low, sell them often.' }] },
          { t: { no: 'Ser på. Det er nok å være her.', en: 'Watch. It is enough to be here.' }, set: { fell: 'sjaa' }, fr: 0,
            reply: ['Then you already understand the plateau. Reindeer at dusk, if you are still.'] }
        ] } },
      /* ---- his arc: the crossings ------------------------------------ */
      { id: 'ga1', when: S => S.fr.gunnar >= 2,
        lines: ['Twice, then. I said fewer, not none.',
                { no: 'Jeg fører ikke bok over folk. Bare over dyr.', en: 'I keep no record of people. Only of animals.' }] },
      { id: 'ga2', when: S => S.fr.gunnar >= 4,
        lines: ['Four herds crossed the tarn this year. I counted every one.',
                { no: 'Da jeg kom hit var det elleve. Samme uke, samme drag.', en: 'When I came up here it was eleven. Same week, same line.', m: 'troubled' }] },
      { id: 'ga3', mood: 'troubled', when: S => S.fr.gunnar >= 6,
        lines: ['I do not know why. That is the honest answer and it is no use.',
                { no: 'Ingen spør. Så teller jeg, og tallene blir liggende her oppe.', en: 'Nobody asks. So I count, and the numbers stay up here with me.' }] },
      { id: 'g2', mood: 'warm', when: S => S.fr.gunnar >= 6 && S.flag.fell === 'jakt',
        lines: [{ no: 'Take the wool. The tyttebær are worth more when your hands still work.', en: 'Take the wool. The lingonberries are worth more when your hands still work.' }],
        give: { ull: 2 } },
      { id: 'g3', mood: 'warm', when: S => S.fr.gunnar >= 6 && S.flag.fell === 'sjaa',
        lines: ['Stand at the tarn at dusk. You will see what I stay up here for.'] },
      { id: 'ga4', when: S => S.fr.gunnar >= 8,
        lines: ['I walked down and gave Astrid the numbers. All eighteen years.',
                { no: 'Hun skrev dem av i kassaboken uten å spørre hvorfor.', en: 'She copied them into the ledger without asking why.' },
                'Now they are somewhere that is not only my head.'],
        set: { tall: 1 } },
      { id: 'ga5', mood: 'warm', when: S => S.fr.gunnar >= 10,
        lines: ['A fifth herd came through in the dark. Late. Wrong week.',
                { no: 'Fem. Jeg hadde skrevet fire og måtte stryke det ut.', en: 'Five. I had written four and had to cross it out.' },
                'It is the first number I have been glad to be wrong about.'],
        give: { tyttebar: 4 } }
    ],
    chat: [
      /* THE LOFT */
      { t: [{ no: 'Så det er der det havner. Greit nok. Bedre enn i en sekk. Jeg skulle gjerne sett det, men jeg går ikke ned for noe annet enn mat.', en: 'So that is where it ends up. Fair enough. Better than in a sack. I would like to see it, but I do not go down for anything but food.' }],
        if: S => loft(S) >= 1 },
      { mood: 'troubled', t: ['Wind from the north. There is always wind from the north. Stand behind me, I am wider than you.'] },
      { t: [{ no: 'Røye i tjernet. Tyttebær i lyngen. Vidda gir, hvis du er snill mot den. Jeg prøver å være det, og jeg vil at du skal lære det også.', en: 'Char in the tarn. Lingonberries in the heather. The plateau gives, if you are kind to it. I try to be, and I want you to learn it too.' }] },
      { mood: 'troubled', t: ['You wore the wool. Good. I have buried men who did not. I would not like to add you. I am telling you plainly.'] },
      /* the other half of the same argument Sigrid makes below the treeline */
      { t: ['Down the valley you walk field to field. Up here you set out. I am glad you set out. Most turn round at the tarn.'] },
      { t: ['Half a day is the climb. That half is why it stays empty, and why I notice every person who comes.'] },
      /* ---- weather ---------------------------------------------------- */
      { mood: 'troubled', t: [{ no: 'Regn her oppe er ikke regn. Det er vann som kommer sidelengs. Bli i ly bak steinen her, jeg har lagt tørr ved.', en: 'Rain up here is not rain. It is water arriving sideways. Stay in the lee behind this stone, I have put dry wood by.' }],
        if: S => S.weather === 'regn' },
      { mood: 'troubled', t: [{ no: 'Tåke. Gå tilbake den veien du kom, mens du husker den. Jeg sier det som en som ikke husket.', en: 'Fog. Go back the way you came, while you still remember it. I say it as one who did not.' }],
        if: S => S.weather === 'take' },
      { t: ['Clear. You can see the sea from the cairn. Most never look. Come, I will show you where. It takes a minute and it is worth the minute.'],
        if: S => S.weather === 'klar' },
      /* ---- season ----------------------------------------------------- */
      { t: [{ no: 'Vår. Da krysser de nordover, og snøen holder sporene i to dager. Jeg går ut og leser dem. Vil du være med?', en: 'Spring. They cross north, and the snow keeps the tracks two days. I go out and read them. Will you come?' }],
        if: S => S.season === VAR },
      { t: ['Summer. Everything up here is busy and none of it is loud. That is why I stay. I hope you can hear it too.'], if: S => S.season === SOMMER },
      { t: [{ no: 'Høst. Nå er tyttebærene modne og alt annet gjør seg klart til å slutte. Plukk så mye du kan. Jeg gjør det selv.', en: 'Autumn. The lingonberries ripen and everything else prepares to stop. Pick as many as you can. I do it myself.' }],
        if: S => S.season === HOST },
      { mood: 'troubled', t: ['Winter. If you are up here without wool you are already in trouble, and I have to be the one who deals with it. Please.'],
        if: S => S.season === VINTER },
      /* ---- the hour --------------------------------------------------- */
      { t: [{ no: 'Grålysning. Den beste timen, og den er kort. Jeg er glad du er her for den.', en: 'Grey light. The best hour, and it is short. I am glad you are here for it.' }],
        if: S => S.min < 7 * 60 },
      { mood: 'warm', t: ['Dusk. Stop walking. Stand there. Look at the tarn. Do not talk. After, you can tell me what you saw.'], if: S => S.min >= 19 * 60 },
      /* ---- what you are carrying -------------------------------------- */
      { mood: 'warm', t: [{ no: 'Tyttebær! Du gikk forbi tjernet, altså. Bra. Jeg trodde du ville snu. Jeg tok feil, og det er jeg glad for.', en: 'Lingonberries! So you went past the tarn. Good. I thought you would turn back. I was wrong, and I am glad.' }],
        if: S => (S.bag.tyttebar || 0) > 0 },
      { t: [{ no: 'Malm på vidda. Du har gått gjennom fjellet for å komme hit, og jeg tror ikke du vet hvor imponerende det er.', en: 'Ore on the plateau. You came through the mountain to get here, and I do not think you know how impressive that is.' }],
        if: S => ore(S) > 0 },
      { mood: 'troubled', t: ['No wool. I will say it once more and then I will stop. Do you want me to stop? Then get wool.'],
        if: S => !(S.bag.ullgenser || 0) && !(S.bag.ull || 0) },
      /* ---- what you did yesterday ------------------------------------- */
      { t: ['You foraged yesterday and came up here today. That is a week of walking. I do not say that to everyone.'],
        if: S => S.yst.forage > 0 },
      { t: ['Nothing yesterday? Up here that is a plan, not a failure. Tell me about it, I would like to hear what a plan looks like down there.'], if: idle },
      /* ---- the rest of the valley ------------------------------------- */
      { t: [{ no: 'Det går en bjørn i skogen som feier. Jeg har sett ham. Jeg forklarer det ikke, men jeg synes du skal gå og se selv.', en: 'There is a bear in the wood who sweeps. I have seen him. I do not explain it, but I think you should go and see for yourself.' }],
        if: S => S.disc && S.disc.forest && S.day >= 21 },
      { t: ['Sigrid brings the herd past in June. I hear them before I see them. I stand up, every year, and I do not know why.'],
        if: S => S.disc && S.disc.setra },
      { t: [{ no: 'Lars er under meg akkurat nå. Vi har aldri møttes på fjellet. Jeg tenker på det noen ganger, når jeg står på steinen.', en: 'Lars is underneath me right now. We have never met on the mountain. I think of it sometimes, when I stand on the rock.' }],
        if: S => S.disc && S.disc.gruva },
      /* ---- what he will not talk about --------------------------------- */
      { mood: 'troubled', t: ['Three of them. I carried them down myself. No, I will not say the names. But thank you for being the kind who stays when I say that.'],
        if: S => S.fr.gunnar >= 6 },
      { t: [{ no: 'De ligger i kirkegården på enga. Marit steller gravene. Jeg kan ikke gå dit. Kanskje du kan legge en stein for meg?', en: 'They lie in the churchyard on the meadow. Marit tends the graves. I cannot go there. Maybe you could lay a stone for me?' }],
        if: S => S.fr.gunnar >= 8 },
      { mood: 'warm', t: [{ no: 'Tallene står i en bok nede i bygda nå. Det hjelper mer enn jeg trodde. Jeg sover. Jeg vil bare at du skal vite det.', en: 'The numbers are in a book down in the valley now. That helps more than I expected. I sleep. I only want you to know that.' }],
        if: S => S.flag.tall },
      { t: [{ no: 'Jeg hørte at huset ditt er ferdig. Bra. Nå har du noe å komme tilbake til. Jeg skulle ønske jeg hadde sagt det til meg selv for lenge siden.', en: 'I heard your house is finished. Good. Now you have somewhere to come back to. I wish I had said that to myself long ago.' }],
        if: S => S.act2Unlocked },
      /* ---- the festival, and the rest of the valley -------------------- */
      { t: [{ no: 'Festdag. Jeg går ned. Jeg står i utkanten. Jeg går opp igjen. Hvis du står i utkanten med meg, er det litt bedre.', en: 'Festival day. I go down. I stand at the edge. I come back up. If you stand at the edge with me, it is a little better.' }],
        if: S => !!S.festival },
      { mood: 'warm', t: ['Once a season somebody hands me food and does not ask why I am there. I never know what to say. Maybe it is you next time.'],
        if: S => !!S.festival },
      { t: [{ no: 'Blåbær. De vokser lavere enn tyttebær og smaker mindre. Ta begge deler, og spis dem sammen. Du skjønner forskjellen da.', en: 'Blueberries. They grow lower than lingonberries and taste of less. Take both, and eat them together. You will see the difference.' }],
        if: S => (S.bag.blabar || 0) > 0 },
      { mood: 'warm', t: ['You are wearing the sweater. Sigrid knitted it. I told her the size. I was off by an inch. She has never let me forget it.'],
        if: S => (S.bag.ullgenser || 0) > 0 },
      { t: [{ no: 'Røye i tjernet, om du har stang. Ellers er det bare kaldt vann. Jeg har en ekstra snelle, hvis du vil låne.', en: 'Char in the tarn, if you have a rod. Otherwise it is only cold water. I have a spare reel, if you want to borrow it.' }],
        if: S => !S.tools.stang },
      { t: ['Astrid writes things down. That turns out to matter. I did not think so, years ago. I think so now, and I wish I had told her.'], if: S => S.fr.astrid >= 4 },
      { mood: 'troubled', t: [{ no: 'Olav har sett på havet hver dag i femti år og aldri vært på det. Jeg forstår ham bedre enn jeg viser.', en: 'Olav has looked at the sea every day for fifty years and never been on it. I understand him better than I let on.' }],
        if: S => S.disc && S.disc.fjord },
      { t: ['Marit keeps the graves. I keep the crossings. Somebody has to keep something, and I think you are keeping something too. I just do not know what.'],
        if: S => S.fr.marit >= 4 },
      { mood: 'warm', t: ['You came up here three times. After that I stop counting, and I put the kettle on a little before you usually arrive.'],
        if: S => S.fr.gunnar >= 8 },
      { t: [{ no: 'Vidda skylder deg ingenting. Den gir likevel, om du kan vente. Jeg lærte det sent, og det er det eneste jeg har å gi deg.', en: 'The plateau owes you nothing. It gives anyway, if you can wait. I learned that late, and it is the only thing I have to give you.' }] },
      { mood: 'troubled', t: ['Eighteen years. Three graves. Four herds. Those are all the numbers I have, and I have told them to you. That means something, to me.'],
        if: S => S.fr.gunnar >= 6 },
      { t: [{ no: 'Ingrid teller fisk, jeg teller rein. Vi har aldri snakket sammen. Fortell henne at jeg heier på henne, om du kan finne en måte.', en: 'Ingrid counts fish, I count reindeer. We have never once spoken. Tell her I am cheering for her, if you can find a way.' }],
        if: S => S.fr.ingrid >= 4 },
      /* ---- and the ones that are only to you ----------------------------- */
      { t: ['Sit on the stone. It is warm in the sun and cold in the shade, like most things worth sitting on. I will tell you how the herds move.'] },
      { mood: 'warm', t: ['I did not expect company up here. I find I do not mind it. Do not tell anyone.'],
        if: S => S.fr.gunnar >= 4 }
    ]
  },

  lars: {
    nodes: [
      { id: 'l1', mood: 'troubled',
        lines: ['Watch yourself down there. The good copper is where the ceiling is lowest.'],
        ask: { q: { no: 'Sølv, eller stein?', en: 'Silver, or stone?' }, opts: [
          { t: { no: 'Silver. I came for the sølv.', en: 'Silver. I came for the silver.' }, set: { mine: 'solv' }, fr: 2,
            reply: [{ no: 'Et grådig svar. Jeg liker det. Rike årer glitrer — du vil kjenne dem igjen.', en: 'A greedy answer. I like it. Rich veins glitter — you will know them.' }] },
          { t: { no: 'Stein. Et hus trenger vegger.', en: 'Stone. A house needs walls.' }, set: { mine: 'stein' }, fr: 0,
            reply: [{ no: 'A builder. Good. Every swing gives stein along with the ore.', en: 'A builder. Good. Every swing gives stone along with the ore.' }] }
        ] } },
      { id: 'l2', when: S => !S.tools.hakke,
        lines: [{ no: 'You will need a HAKKE. I sell one for 1500 kr.', en: 'You will need a PICK. I sell one for 1500 kr.' }],
        buy: { label: { no: 'HAKKE — 1500 kr', en: 'PICK — 1500 kr' }, kr: 1500, tool: 'hakke', pickLv: 1,
               ok: ['Swing at the veins, not the walls.'],
               no: ['1500 kr. The ore is not going anywhere.'] } },
      { id: 'l3', when: S => S.tools.hakke && !S.q.jern && S.pickLv < 2,
        lines: [{ no: 'Bring me six jern and I will forge you a STÅLHAKKE.', en: 'Bring me six iron and I will forge you a STEEL PICK.' },
                { no: 'The rich veins — the sølv — need steel to crack.', en: 'The rich veins — the silver — need steel to crack.' }],
        open: 'jern' },
      /* ---- his arc: the closed level --------------------------------- */
      { id: 'la1', when: S => S.fr.lars >= 2,
        lines: ['Mm.',
                { no: 'Du spurte om jeg jobber alene. Jeg jobber alene.', en: 'You asked whether I work alone. I work alone.' },
                'That is an answer, not a complaint.'] },
      { id: 'la2', when: S => S.fr.lars >= 4,
        lines: ['I am not prospecting. Prospecting is for men who do not know.',
                { no: 'Det var ni av oss her. Vi drev mot noe. Så sluttet selskapet.', en: 'There were nine of us here. We were driving for something. Then the company stopped.' }] },
      { id: 'l4', mood: 'warm', when: S => S.fr.lars >= 6 && S.flag.mine === 'stein' && S.pickLv < 2,
        lines: [{ no: 'For a builder, the steel is cheaper. Four jern, not six.', en: 'For a builder, the steel is cheaper. Four iron, not six.' }],
        set: { steelcut: 1 } },
      { id: 'la3', mood: 'troubled', when: S => S.fr.lars >= 6,
        lines: [{ no: 'Det er en synk lenger inne som jeg stemper igjen hver vår.', en: 'There is a level further in that I prop shut every spring.' },
                'Water behind it, or nothing behind it. Both answers cost the same to get.'] },
      { id: 'la4', when: S => S.fr.lars >= 8,
        lines: ['I opened it. Took two days and I told nobody I was doing it.',
                { no: 'Ikke vann. Tørt som en støvel. Åtte meter, og så gråberg.', en: 'No water. Dry as a boot. Eight metres, and then dead rock.', m: 'troubled' }] },
      { id: 'la5', mood: 'warm', when: S => S.fr.lars >= 10,
        lines: ['Stemped it shut again. For good this time, and I slept after.',
                { no: 'Ni mann tok feil. Det er lettere å bære enn å ha rett alene.', en: 'Nine men were wrong. That is easier to carry than being right alone.' },
                'Take the silver. It came out of the drift beside it, which is the joke.'],
        give: { solv: 1 }, set: { synk: 1 } }
    ],
    chat: [
      /* THE LOFT */
      { mood: 'warm', t: [{ no: 'Sølv og kobber og bergkrystall på en hylle, i rekkefølge. Selskapet klarte aldri det. Jeg stod og så på det en time. Takk.', en: 'Silver and copper and rock crystal on a shelf, in order. The company never managed that. I stood and looked at it for an hour. Thank you.' }],
        if: S => loft(S) >= 44 },
      { t: ['Deeper is darker. Darker is richer. I am telling you so you know why I do not come up often.'] },
      { t: [{ no: 'Kobber selger godt i byen. Sølv selger bedre hvor som helst. Jeg skal ikke fortelle deg hva du skal gjøre, men jeg ville sett etter sølv.', en: 'Copper sells well in town. Silver sells better anywhere. I will not tell you what to do, but I would be looking for silver.' }] },
      { t: [{ no: 'Åtte til åtte er jeg ved gruveåpningen. Etter det er jeg lenger inne, og sover. Rop om du trenger meg. Jeg hører deg til slutt.', en: 'Eight to eight I am at the adit. After that I am further in, asleep. Shout if you need me. I will hear you eventually.' }] },
      { t: [{ no: 'De rike årene glitrer. Du trenger stål til dem. Jeg kan lage det, hvis du bare spør pent og tar med jern.', en: 'The rich veins glitter. You need steel for those. I can make it, if you ask nicely and bring iron.' }], if: S => S.pickLv < 2 },
      { mood: 'warm', t: ['Steel in your hands now. The whole mountain is yours. I am a little proud, and a little afraid of what you will do to it.'], if: S => S.pickLv >= 2 },
      /* ---- weather ---------------------------------------------------- */
      { t: [{ no: 'Regner det ute? Det regner alltid her inne. Det heter drypp. Du blir våt uansett, så du kan like gjerne bli.', en: 'Raining out there? It always rains in here. We call it drip. You will get wet either way, so you may as well stay.' }],
        if: S => S.weather === 'regn' && S.map === 'gruva' },
      { t: ['Fog outside. In here it makes no difference at all. That is the point of in here. I am glad you came in out of it.'],
        if: S => S.weather === 'take' && S.map === 'gruva' },
      /* ---- season ----------------------------------------------------- */
      { t: [{ no: 'Vår. Da renner smeltevannet inn og jeg stemper i to uker. Hvis du kan holde en bjelke, er du velkommen.', en: 'Spring. The meltwater comes in and I spend two weeks propping. If you can hold a beam, you are welcome.' }],
        if: S => S.season === VAR },
      { t: ['Summer up there. Eleven degrees down here. It is eleven degrees in February too. You will be glad of that by August.'],
        if: S => S.season === SOMMER },
      { mood: 'troubled', t: [{ no: 'Vinter. Da kommer ingen ned hit, og det går fortere enn du tror. Det er derfor jeg er glad for at du kom.', en: 'Winter. Nobody comes down here then, and it passes faster than you would think. That is why I am glad you came.' }],
        if: S => S.season === VINTER },
      /* ---- the hour --------------------------------------------------- */
      { t: ['Eight o’clock somewhere. Down here that is a rumour. Tell me what it is like up there. I have almost forgotten.'], if: S => S.min < 8 * 60 },
      { mood: 'troubled', t: [{ no: 'Sent. Gå opp mens lykten din ennå har olje, og kom tilbake i morgen. Jeg er her uansett.', en: 'Late. Go up while your lantern still has oil, and come back tomorrow. I am here either way.' }],
        if: S => S.min >= 20 * 60 },
      /* ---- what you are carrying -------------------------------------- */
      { mood: 'warm', t: [{ no: 'Sølv i sekken. Da har du funnet den blanke åren. Ikke si hvor. Men jeg ville gjerne hørt hvordan det føltes da du så den.', en: 'Silver in the bag. So you found the bright vein. Do not say where. But I would like to hear how it felt when you saw it.' }],
        if: S => (S.bag.solv || 0) > 0 },
      { t: [{ no: 'Stein. Håkon betaler for det. Jeg gjør ikke det. Men jeg er glad du bærer den ut, for den ligger i veien min.', en: 'Stone. Håkon pays for that. I do not. But I am glad you carry it out, because it is in my way.' }],
        if: S => (S.bag.stein || 0) >= 5 },
      { mood: 'troubled', t: ['You came down here with a full bag and no room for ore. Think. I would hate for you to walk the whole way for nothing.'],
        if: S => Object.keys(S.bag).filter(k => S.bag[k] > 0).length >= 10 },
      /* ---- what you did yesterday ------------------------------------- */
      { t: ['Two days in a row down here. That is how it starts, and it does not stop. I can tell you, I have been doing it for thirty years.'],
        if: S => S.yst.mine > 0 },
      { t: [{ no: 'Ingenting i går? Fjellet merket det ikke. Det merker aldri noe. Men jeg gjorde det, og jeg skulle ønske jeg ikke hadde.', en: 'Nothing yesterday? The mountain did not notice. It never does. But I did, and I wish I had not.' }], if: idle },
      /* ---- quests open ------------------------------------------------ */
      { t: [{ no: 'Seks jern. Eller fire, om du bygger. Jeg husker hva du svarte, og jeg liker deg bedre for det.', en: 'Six iron. Or four, if you build. I remember what you answered, and I like you better for it.' }],
        if: S => S.q.jern === 'active' },
      /* ---- the rest of the valley ------------------------------------- */
      { t: [{ no: 'Sigrid er søsteren min. Hun gikk oppover. Noen måtte gå innover. Jeg ser henne sjelden. Si ifra om hun spiser.', en: 'Sigrid is my sister. She went upward. Somebody had to go inward. I see her rarely. Tell me if she is eating.' }] },
      { t: ['Ingrid came down and asked what runs out of my mountain. I showed her. Clean. I have never been so glad to be asked a question.'],
        if: S => S.fr.ingrid >= 8 },
      { t: [{ no: 'Astrid selger lyktene mine og tar ingenting for det. Vi krangler om det hver gang jeg kommer opp. Jeg er glad vi har noe å krangle om.', en: 'Astrid sells my lanterns and takes nothing for it. We argue about it every time I come up. I am glad we have something to argue about.' }] },
      /* ---- what he will not talk about --------------------------------- */
      { mood: 'troubled', t: ['Do not go past the third crosscut. I am not explaining that today. It is not you. It is me.'],
        if: S => S.fr.lars >= 6 },
      { t: [{ no: 'Ni navn på lønningslisten. Åtte dro. Regn selv. Jeg ville at du skulle gjøre regnestykket, så jeg slapp å si svaret.', en: 'Nine names on the pay list. Eight left. Do the arithmetic. I wanted you to do the sum, so I would not have to say the answer.' }],
        if: S => S.fr.lars >= 8 },
      { mood: 'warm', t: [{ no: 'Synken er stengt for godt. Jeg går forbi den uten å se på den nå, og jeg tror det er din skyld.', en: 'The level is shut for good. I walk past it without looking now, and I think that is your doing.' }],
        if: S => S.flag.synk },
      { t: [{ no: 'De sier huset ditt står. Halve steinen bar du ut herfra selv. Jeg skulle ønske jeg kunne se det, men jeg er ikke så god ute.', en: 'They tell me your house stands. Half the stone you carried out of here yourself. I wish I could see it, but I am not good outdoors.' }],
        if: S => S.act2Unlocked },
      /* ---- the festival, and the rest of the valley -------------------- */
      { t: [{ no: 'Festdag. Jeg vasker fjeset og går opp. En dag i kvartalet. Du kan ta meg i armen, jeg vet ikke hva jeg gjør med hendene.', en: 'Festival day. I wash my face and go up. One day a quarter. You can take my arm, I do not know what to do with my hands.' }],
        if: S => !!S.festival },
      { mood: 'warm', t: ['Sigrid stands next to me at the fair and neither of us says much. It is the best conversation I have all year.'],
        if: S => !!S.festival },
      { t: [{ no: 'Lykt i sekken? Bra. Uten den er dette bare en tunnel du dør i. Jeg mente det, jeg har sett det.', en: 'Lantern in the bag? Good. Without one this is only a tunnel you die in. I mean that, I have seen it.' }],
        if: S => (S.bag.lykt || 0) > 0 },
      { mood: 'troubled', t: [{ no: 'Olje i lykten? Sjekk nå, ikke om en time. Jeg har båret ut for mange som ikke sjekket. Jeg vil ikke bære deg.', en: 'Oil in that lantern? Check now, not in an hour. I have carried out too many who did not check. I do not want to carry you.' }],
        if: S => S.min >= 16 * 60 },
      { t: [{ no: 'Spiker og tau. Jeg fører begge deler fordi ingen andre gidder. Det er fint å ha noe som folk trenger.', en: 'Nails and rope. I stock both because nobody else can be bothered. It is nice to have something people need.' }] },
      { t: ['Olav needs two rope and will buy one and come back. He always does. Tell him I put the second one aside, so he does not have to walk twice.'],
        if: S => S.q.boat === 'active' },
      { t: [{ no: 'Håkon sier tømmeret mitt er grønt. Håkon har rett. Jeg gjør det likevel, og jeg skal fortelle deg hvorfor en dag.', en: 'Håkon says my timber is green. Håkon is right. I do it anyway, and I will tell you why one day.' }],
        if: S => S.fr.hakon >= 4 },
      { t: ['Gunnar is directly above me and we have not spoken in nine years. I would like to. I just do not know the first sentence.'],
        if: S => S.disc && S.disc.vidda },
      { mood: 'warm', t: [{ no: 'Du kommer ned hit uten grunn nå. Det gjør ingen andre. Jeg setter pris på det mer enn jeg klarer å si.', en: 'You come down here for no reason now. Nobody else does. I appreciate it more than I can say.' }],
        if: S => S.fr.lars >= 8 },
      /* ---- and the ones that are only to you ----------------------------- */
      { t: ['Hold the lantern up. No, higher. See the green streak? That is copper. The old crew walked past it for a year. Dry humour, the mountain has.'] },
      { mood: 'warm', t: ['I am not good at this. Talking. But you keep coming down and I keep not minding. I think that is how it is done.'],
        if: S => S.fr.lars >= 4 }
    ],
    shop: ['spiker', 'tau']
  }
};
