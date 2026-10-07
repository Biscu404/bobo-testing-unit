/* Bekkedal — what the two by the water say. One quarter of BEK_TALK; see
 * talk_town.js's header for the shape and the conventions.
 *
 * Ingrid wants the lake to still hold what it held, and will not talk about
 * why she came back. Olav wants to take the boat past the mouth once more,
 * and will not talk about the last time he tried.
 */

const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;
const idle = S => !S.yst.farm && !S.yst.mine && !S.yst.fish && !S.yst.forage;
/* THE LOFT: how much has been carried into the storehouse on the square —
   read defensively, like every gate in these files. See BEK_LOFT (data.js). */
const loft = S => (S.spine && S.spine.d) ? Object.keys(S.spine.d).length : 0;

export const WATER_TALK = {
  ingrid: {
    nodes: [
      { id: 'i1',
        lines: [{ no: 'God kveld. Or morning. Out here it is the same.', en: 'Good evening. Or morning. Out here it is the same.' }],
        ask: { q: { no: 'Hvorfor fisker du?', en: 'Why do you fish?' }, opts: [
          { t: { no: 'For roen.', en: 'For the calm.' }, set: { fisk: 'ro' }, fr: 2,
            reply: ['Then stand at the end of the pier, not the middle.',
                    { no: 'The laks lie deep out there. Bring me three sopp', en: 'The salmon lie deep out there. Bring me three mushrooms' },
                    { no: 'and the old stang is yours.', en: 'and the old rod is yours.' }] },
          { t: { no: 'For maten.', en: 'For the food.' }, set: { fisk: 'mat' }, fr: 0,
            reply: ['Sensible. I will keep you fed while you learn.',
                    { no: 'Three sopp from the forest, and you get the stang.', en: 'Three mushrooms from the forest, and you get the rod.' }] }
        ] } },
      { id: 'i2', when: S => S.q.sopp === 'active',
        lines: [{ no: 'Three sopp. The skogen is full of them at dawn.', en: 'Three mushrooms. The forest is full of them at dawn.' }] },
      /* ---- her arc: the tally ---------------------------------------- */
      { id: 'ia1', when: S => S.fr.ingrid >= 2,
        lines: ['You watched me put that one back and said nothing. Good.',
                { no: 'Jeg teller. Det er alt. Ikke spør hva.', en: 'I count. That is all. Do not ask what.' }] },
      { id: 'ia2', when: S => S.fr.ingrid >= 4,
        lines: [{ no: 'Tolv år med streker i en bok. En strek per fisk over pundet.', en: 'Twelve years of marks in a book. One mark per fish over the pound.' },
                'Nobody asked me to. Nobody has read it.'] },
      { id: 'i3', mood: 'warm', when: S => S.fr.ingrid >= 6 && S.flag.fisk === 'ro',
        lines: ['You have learned to wait. That is all fishing is.'] },
      { id: 'i4', mood: 'warm', when: S => S.fr.ingrid >= 6 && S.flag.fisk === 'mat',
        lines: ['Here. You still eat like a man who forgets to.'],
        give: { vaffel: 2 } },
      { id: 'ia3', mood: 'troubled', when: S => S.fr.ingrid >= 6,
        lines: ['This year is short. Two hundred and nine marks by midsummer.',
                { no: 'Det burde vært over tre hundre. Det har vært det hvert år.', en: 'It should be over three hundred. It has been, every year.' },
                'I have stopped fishing the shallows. It has not helped.'] },
      /* the rod's own tier, same shape as Håkon's STÅLØKS node — offered once
         she trusts you with a line at all and stops the moment S.rodLv is 2 */
      { id: 'i4b', when: S => S.tools.stang && S.fr.ingrid >= 5 && S.rodLv < 2,
        lines: [{ no: 'That old stang bends too easy for anything with weight. I have a KARBONSTANG. 2800 kr.',
                   en: 'That old rod bends too easy for anything with weight. I have a CARBON ROD. 2800 kr.' }],
        buy: { label: { no: 'KARBONSTANG — 2800 kr', en: 'CARBON ROD — 2800 kr' }, kr: 2800, rodLv: 2,
               ok: ['Stiffer in the hand. You will feel the difference on the next big one.'],
               no: ['2800 kr. It will still be here.'] } },
      { id: 'i5', when: S => S.fr.ingrid >= 8,
        lines: [{ no: 'Røye run in the cold tarn up on the vidda. Colder, sweeter.', en: 'Char run in the cold tarn up on the plateau. Colder, sweeter.' }] },
      { id: 'ia4', when: S => S.fr.ingrid >= 8,
        lines: ['I walked up to the mine and asked Lars what runs out of it.',
                { no: 'Han viste meg. Rent vann. Det er ikke gruva.', en: 'He showed me. Clean water. It is not the mine.', m: 'troubled' },
                'So it is the lake, or it is me, and I know which I would rather.'] },
      { id: 'ia5', mood: 'warm', when: S => S.fr.ingrid >= 10,
        lines: ['Three hundred and forty by the frost. It came back.',
                { no: 'Vann gjør sånn. Tolv år for å lære en eneste ting.', en: 'Water does that. Twelve years to learn one thing.' },
                'Take the book. You will keep it better than I did.'],
        give: { orret: 2 }, set: { tally: 1 } }
    ],
    chat: [
      /* THE LOFT */
      { mood: 'warm', t: [{ no: 'Du bar en fisk inn på et museum. Jeg likte det. La dem se hva som bor her, og at det fortsatt bor noe.', en: 'You carried a fish into a museum. I liked that. Let them see what lives here, and that something still does.' }],
        if: S => loft(S) >= 1 },
      { t: ['Still biting. Slowly. I do not mind slow. Do you? Tell me honestly.'] },
      { mood: 'troubled', t: ['The empty lot by the water is still empty. Somebody should put a house on it. A lamp in the window would be nice to fish by.'] },
      { t: ['Deep water, deep fish. You chose the calm. Stand at the end of the pier and let it come to you. I will not tell you again.'], if: S => S.flag.fisk === 'ro' },
      { mood: 'troubled', t: [{ no: 'Spis noe som ikke er en potet. Jeg sier det som venn. Jeg har spist ut av en boks i tolv år og vet hva det gjør.', en: 'Eat something that is not a potato. I say it as a friend. I have eaten out of a tin for twelve years and I know what it does.' }], if: S => S.flag.fisk === 'mat' },
      { t: ['I would take you to the fjord myself if I had a boat that floated. Olav is the one to ask. Go on, be nice to him.'], if: S => !S.flag.boat },
      /* ---- weather ---------------------------------------------------- */
      { mood: 'warm', t: ['Rain. The fish sit high and see badly. Good time to be out. Wrap up.'],
        if: S => S.weather === 'regn' },
      { t: [{ no: 'Tåke over vannet. Jeg hører årer jeg ikke ser. Det er rart å høre andre mennesker uten å se dem. Jeg liker det litt.', en: 'Fog on the water. I hear oars I cannot see. It is odd, hearing other people without seeing them. I like it a little.' }],
        if: S => S.weather === 'take' },
      { mood: 'troubled', t: ['Bright and still, and I am sorry — it is the worst water there is. Come back at dusk and I will make it up to you.'],
        if: S => S.weather === 'klar' && S.min > 10 * 60 && S.min < 16 * 60 },
      /* ---- season ----------------------------------------------------- */
      { t: [{ no: 'Vår. Isen slapp for tre uker siden, og de er sultne ennå. Jeg har allerede mistet en line. Pass på din.', en: 'Spring. The ice let go three weeks back and they are hungry still. I have already lost a line. Watch yours.' }],
        if: S => S.season === VAR },
      { t: ['Midsummer, and it never gets dark enough for them to stop. I have not slept properly in a week. I am not complaining.'], if: S => S.season === SOMMER },
      { mood: 'troubled', t: [{ no: 'Høst. Nå går de dypt, og jeg står her likevel. Du kan gå. Jeg skjønner det. Du har en gård.', en: 'Autumn. Now they run deep, and I stand here anyway. You can go. I understand. You have a farm.' }],
        if: S => S.season === HOST },
      { t: [{ no: 'Vinter. Jeg hogger hull i isen. Ikke spør meg om det er verdt det. Spør meg heller om jeg har kaffe.', en: 'Winter. I cut a hole in the ice. Do not ask me whether it is worth it. Ask me whether I have coffee.' }],
        if: S => S.season === VINTER },
      /* ---- the hour --------------------------------------------------- */
      { t: ['First light. The only hour that owes you anything. Be quiet and take it.'], if: S => S.min < 7 * 60 },
      { mood: 'warm', t: [{ no: 'Skumring. Nå snur de. Stå stille i ti minutter og se hva som skjer. Jeg står ved siden av deg.', en: 'Dusk. Now they turn. Stand still for ten minutes and see what happens. I will stand next to you.' }],
        if: S => S.min >= 19 * 60 },
      /* ---- what you are carrying -------------------------------------- */
      { mood: 'warm', t: [{ no: 'En laks! Du sto på enden av brygga, ikke sant? Jeg visste det. Du ser annerledes ut når du har tålmodighet.', en: 'A salmon! You stood at the end of the pier, didn’t you? I knew it. You look different when you have patience.' }],
        if: S => (S.bag.laks || 0) > 0 },
      { t: [{ no: 'Sopp. Nei, behold dem, de er til gryta. Jeg har fått mine. Jeg spiser dem ikke engang, men jeg liker å vite at de finnes.', en: 'Mushrooms. No, keep them, they are for the pot. I have had mine. I do not even eat them, but I like knowing they are there.' }],
        if: S => (S.bag.sopp || 0) > 0 && S.q.sopp !== 'active' },
      { mood: 'troubled', t: ['You are carrying nothing at all. That is a long walk for nothing. Come, sit with me then. It is not nothing if you sit.'],
        if: S => Object.keys(S.bag).filter(k => S.bag[k] > 0).length === 0 },
      /* ---- what you did yesterday ------------------------------------- */
      { mood: 'warm', t: ['You fished yesterday and you are here today. That is how it starts. I should know, I started like that.'],
        if: S => S.yst.fish > 0 },
      { t: ['A day off, I heard. I have had twelve years without one, so I do not know how it is done. Tell me if it is any good.'], if: idle },
      /* ---- quests open ------------------------------------------------ */
      { t: [{ no: 'Fire tømmer og to tau til Olav. Han teller dem, tro meg. Han har telt alt siden før jeg kom.', en: 'Four timber and two rope for Olav. He counts them, believe me. He has counted everything since before I came.' }],
        if: S => S.q.boat === 'active' },
      /* ---- the rest of the valley ------------------------------------- */
      { mood: 'warm', t: ['His boat floats. It has floated for years. It is not the boat that is the trouble, and I think you know that.'],
        if: S => S.flag.boat },
      { t: ['Astrid asks after me twice a week and calls it stocktaking. I let her. I think she needs somebody to count.'] },
      { t: ['Lars comes down to the water once a year and looks at it. I say hello. He does not say much, but he stays.'],
        if: S => S.disc && S.disc.gruva },
      { t: ['Sigrid sends cheese down with whoever is walking. It always arrives. I send a fish back and neither of us mentions it.'],
        if: S => S.disc && S.disc.setra },
      /* ---- what she will not talk about -------------------------------- */
      { mood: 'troubled', t: ['I left here once. I will tell you about it, but not yet. It is a long story, and a good tea one.'],
        if: S => S.fr.ingrid >= 6 },
      { t: ['Twelve years of marks. The first one is dated the week I came back. I look at it when I cannot sleep.'],
        if: S => S.fr.ingrid >= 8 },
      { mood: 'warm', t: [{ no: 'Boken er din nå. Skriv med blyant. Vann tar blekk, og jeg vil at du skal få lov å ombestemme deg.', en: 'The book is yours now. Write in pencil. Water takes ink, and I want you to be allowed to change your mind.' }],
        if: S => S.flag.tally },
      { t: [{ no: 'Du bygde nært nok til at jeg ser lykten din fra brygga. Jeg ser etter den hver kveld nå. Det er ikke vanlig av meg.', en: 'You built close enough that I can see your lamp from the pier. I look for it every evening now. That is not like me.' }],
        if: S => S.act2Unlocked },
      { mood: 'warm', t: ['Two lamps on this shore now. It was one for a long time. I did not know I minded until there were two.'],
        if: S => S.act2Unlocked && S.flag.tally },
      /* ---- the festival, and the rest of the valley -------------------- */
      { t: ['Festival day. I go for an hour, say hello to everyone, and come home. I do not like walking in alone, so I tell myself I am only late.'],
        if: S => !!S.festival },
      { t: ['A whole square full of people. I can manage that once a season. If you see me by the wall, say hello. It helps.'], if: S => !!S.festival },
      { mood: 'warm', t: [{ no: 'Multe i sekken! Nei, de er Sigrids, ikke mine. Jeg har fisk. Jeg tar fisk over bær hver dag, men la meg lukte på dem.', en: 'Cloudberries in the bag! No, those are Sigrid’s, not mine. I have fish. I take fish over berries any day, but let me smell them.' }],
        if: S => (S.bag.multe || 0) > 0 },
      { t: [{ no: 'Poteter til Astrid. Gå nå, før hun stenger for kaffe. Jeg lover å være her når du kommer tilbake.', en: 'Potatoes for Astrid. Go now, before she shuts for coffee. I promise I will be here when you get back.' }],
        if: S => S.q.potet === 'active' },
      { t: ['Håkon offered to rebuild my landing. I told him the old one still floats. He looked hurt, which I did not expect, so I let him bring a plank.'],
        if: S => S.fr.hakon >= 2 },
      { mood: 'troubled', t: [{ no: 'Jeg har ikke sett Marit ved vannet på to år. Hun sier hun husker det. Kanskje du kunne ta henne en fisk og si at jeg spurte?', en: 'I have not seen Marit down by the water in two years. She says she remembers it. Maybe you could take her a fish and say I asked?' }],
        if: S => S.disc && S.disc.enga },
      { t: ['Stand still for ten minutes and the lake forgets you are there. That is the trick. You will be surprised by how it feels to be forgotten.'],
        if: S => S.fr.ingrid >= 4 },
      { mood: 'warm', t: [{ no: 'Du står stille lenger enn du pleide. Jeg legger merke til sånt. Jeg legger merke til deg, tror jeg.', en: 'You stand still longer than you used to. I notice that sort of thing. I notice you, I think.' }],
        if: S => S.fr.ingrid >= 8 },
      { t: ['That rod was old when it was given to me. Take care of it for me. I would be sad if it broke, and I do not like being sad in front of people.'],
        if: S => S.q.sopp === 'done' },
      /* ---- and the ones that are only to you ----------------------------- */
      { t: ['Have you eaten today? Properly? You look like somebody who stood out here and forgot.'] },
      { t: ['Ask me anything about the lake. I know it better than I know most people. I am trying to fix that, a little, with you.'],
        if: S => S.fr.ingrid >= 2 }
    ]
  },

  olav: {
    nodes: [
      { id: 'o1', mood: 'troubled',
        lines: ['The boat leaks. Everything out here leaks, eventually.'],
        ask: { q: { no: 'Fjorden, eller havet?', en: 'The fjord, or the open sea?' }, opts: [
          { t: { no: 'Havet. Jeg vil ha de store.', en: 'The open sea. I want the big ones.' }, set: { sea: 'hav' }, fr: 2,
            reply: [{ no: 'A bold answer. Makrell run in shoals out past the mouth.', en: 'A bold answer. Mackerel run in shoals out past the mouth.' },
                    { no: 'Fix my boat and I will point you at them. Four tømmer, two tau.', en: 'Fix my boat and I will point you at them. Four timber, two rope.' }] },
          { t: { no: 'Fjorden. Rolig vann passer meg.', en: 'The fjord. Calm water suits me.' }, set: { sea: 'fjord' }, fr: 0,
            reply: [{ no: 'Sensible. Torsk sit still and wait, like you.', en: 'Sensible. Cod sit still and wait, like you.' },
                    { no: 'Patch the boat — four tømmer, two tau — and it is yours to borrow.', en: 'Patch the boat — four timber, two rope — and it is yours to borrow.' }] }
        ] } },
      { id: 'o2', when: S => S.q.boat === 'active',
        lines: [{ no: 'Four tømmer, two tau. Astrid sells the tau.', en: 'Four timber, two rope. Astrid sells the rope.' }] },
      /* ---- his arc: past the mouth ----------------------------------- */
      { id: 'oa1', when: S => S.fr.olav >= 2,
        lines: ['You keep looking at the horizon. It is only more of this.',
                { no: 'Munningen er der. Etter den er det ikke fjord lenger.', en: 'The mouth is out there. Past it, it is not a fjord any more.' }] },
      { id: 'o3', when: S => S.flag.boat && S.fr.olav >= 6 && S.flag.sea === 'hav',
        lines: [{ no: 'Cast off the end of the dock. The makrell will find you.', en: 'Cast off the end of the dock. The mackerel will find you.' }] },
      { id: 'o4', mood: 'warm', when: S => S.flag.boat && S.fr.olav >= 6 && S.flag.sea === 'fjord',
        lines: ['Warm soup, for the crossings. You will thank me.'],
        give: { fiskesuppe: 1 } },
      { id: 'oa2', when: S => S.fr.olav >= 4,
        lines: [{ no: 'Denne båten har vært lappet i elleve år. Aldri bygget om.', en: 'This boat has been patched eleven years. Never rebuilt.' },
                'A patch you can do alone. A rebuild you cannot.'] },
      { id: 'oa3', mood: 'troubled', when: S => S.fr.olav >= 6,
        lines: ['I took her out last spring. Got to the mouth.',
                { no: 'Så snudde jeg. Rolig sjø, god vind, ingen grunn.', en: 'Then I turned. Calm sea, fair wind, no reason.' },
                'I rowed back in and told nobody. Now I have told you.'] },
      { id: 'oa4', when: S => S.fr.olav >= 8,
        lines: [{ no: 'Bli med meg ut. Du ror. Jeg sitter i baugen.', en: 'Come out with me. You row. I sit in the bow.' },
                'A man will do at the oar what he will not do at the tiller.'] },
      { id: 'oa5', mood: 'warm', when: S => S.fr.olav >= 10,
        lines: ['We went past the mouth. You saw. There was nothing to it.',
                { no: 'Elleve år for tjue meter åpent vann.', en: 'Eleven years for twenty metres of open water.' },
                'Take the makrell. I have more than I can salt.'],
        give: { makrell: 3 }, set: { munning: 1 } }
    ],
    chat: [
      /* THE LOFT */
      { t: [{ no: 'Loftet fylles. Jeg går forbi og ser inn, og sier ingenting. Men jeg ville gjerne at du visste at jeg ser.', en: 'The loft is filling. I walk past and look in, and say nothing. But I would like you to know that I look.' }],
        if: S => loft(S) >= 24 },
      { mood: 'troubled', t: ['Water finds every gap you leave it. I have spent my life learning that, and I still leave gaps. You will too.'] },
      { t: ['The pier is Ingrid’s. The dock at the fjord is mine. Do not step on either with mud on your boots. She minds, and I mind that she minds.'] },
      { mood: 'warm', t: [{ no: 'Båten flyter nå. Ta den når du vil. Enden av brygga, trykk handling. Jeg sitter her og ser deg gå og tenker at det var en lur avtale.', en: 'The boat floats now. Take it whenever. Pier’s end, press act. I will sit here and watch you go and think it was a clever bargain.' }],
        if: S => S.flag.boat },
      /* ---- weather ---------------------------------------------------- */
      { mood: 'troubled', t: [{ no: 'Regn er ingenting. Vind er noe. I dag er det regn, så kom inn under presenningen og drikk kaffen min.', en: 'Rain is nothing. Wind is something. Today it is rain, so come under the tarp and drink my coffee.' }],
        if: S => S.weather === 'regn' },
      { mood: 'troubled', t: [{ no: 'Tåke. Ingen går ut i tåke. Ikke engang jeg later som. Så nå er det bare meg og deg og en lekk båt.', en: 'Fog. Nobody goes out in fog. Not even I pretend to. So now it is only me and you and a leaky boat.' }],
        if: S => S.weather === 'take' },
      { t: ['Clear and flat. No excuse in that at all. I will go out tomorrow. I have said that for eleven years, you know.'], if: S => S.weather === 'klar' },
      /* ---- season ----------------------------------------------------- */
      { t: [{ no: 'Vår. Smeltevann gjør fjorden brakk helt ut til munningen. Fisken blir forvirret. Det blir jeg også.', en: 'Spring. Meltwater turns the fjord brackish right out to the mouth. The fish get confused. So do I.' }],
        if: S => S.season === VAR },
      { mood: 'warm', t: ['Summer. The mackerel come in so thick you can hear them. Stand on the quay one evening and listen. I will not say a word.'], if: S => S.season === SOMMER },
      { t: [{ no: 'Høst. Da er torsken feit og sjøen begynner å mene noe. Jeg kan kjenne det i hånda.', en: 'Autumn. The cod are fat and the sea begins to mean something. I can feel it in my hand.' }],
        if: S => S.season === HOST },
      { mood: 'troubled', t: ['Winter. She stays on the trestles and I stand and look at her. Come and look with me, it is better with two.'],
        if: S => S.season === VINTER },
      /* ---- the hour --------------------------------------------------- */
      { t: [{ no: 'For tidlig. Tidevannet snur ikke før om to timer. Ta en kopp og vent med meg.', en: 'Too early. The tide does not turn for two hours. Have a cup and wait with me.' }],
        if: S => S.min < 8 * 60 },
      { t: ['Late. Come back when the light is on the water, not under it. And eat first. I mean it.'], if: S => S.min >= 20 * 60 },
      /* ---- what you are carrying -------------------------------------- */
      { mood: 'warm', t: [{ no: 'Torsk! Du satt stille lenge nok. Det er hele kunsten, og du fikk den på første forsøk. Jeg er litt sjalu.', en: 'Cod! You sat still long enough. That is the whole art, and you got it on the first go. I am a little jealous.' }],
        if: S => (S.bag.torsk || 0) > 0 },
      { mood: 'warm', t: [{ no: 'Kveite. Den kom ikke inn i fjorden av seg selv, og ikke du heller. Kom, la meg se på den. Jeg har ikke sett en på mange år.', en: 'Halibut. That did not come into the fjord by itself, and nor did you. Come, let me look at it. I have not seen one in years.' }],
        if: S => (S.bag.kveite || 0) > 0 },
      { t: [{ no: 'Tau i sekken. Det er alltid riktig svar. Jeg har sagt det til alle som vil høre, og du er den første som gjorde noe med det.', en: 'Rope in the bag. That is always the right answer. I have told everybody who would listen, and you are the first who did anything about it.' }],
        if: S => (S.bag.tau || 0) > 0 },
      /* ---- what you did yesterday ------------------------------------- */
      { t: ['You were on the water yesterday. I saw the wake and knew it was not mine. I will admit I was pleased.'],
        if: S => S.yst.fish > 0 },
      { mood: 'troubled', t: ['You did nothing yesterday. So did I. Do not make a habit of us, I am telling you from experience.'], if: idle },
      /* ---- the rest of the valley ------------------------------------- */
      { t: [{ no: 'Ingrid teller fisk i en bok. Hun tror ingen vet det. Jeg har sett henne gjøre det i åtte år, og jeg har aldri sagt noe, og nå har jeg sagt det til deg.', en: 'Ingrid counts fish in a book. She thinks nobody knows. I have watched her do it for eight years and never said anything, and now I have told you.' }] },
      { t: ['Håkon told me to patch it properly or build it again. He is right. That is the trouble with Håkon.'] },
      { t: [{ no: 'Gunnar kom ned en eneste gang og så på sjøen i en time. Jeg ga ham kaffe. Han sa ingenting, og så gikk han opp igjen. Jeg likte ham.', en: 'Gunnar came down once and looked at the sea for an hour. I gave him coffee. He said nothing, and then he walked back up. I liked him.' }],
        if: S => S.disc && S.disc.vidda },
      /* ---- what he will not talk about --------------------------------- */
      { mood: 'troubled', t: ['There were two of us in this boat once. Do not ask me. I am telling you so you do not ask someone else.'], if: S => S.fr.olav >= 6 },
      { t: [{ no: 'Jeg lappet den samme planken tre ganger. Det holdt hver gang. Jeg har aldri forstått hvorfor jeg ikke bare skiftet den.', en: 'I patched the same plank three times. It held every time. I have never understood why I did not just replace it.' }],
        if: S => S.fr.olav >= 8 },
      { mood: 'warm', t: [{ no: 'Munningen er bare vann. Det tok elleve år å finne ut, og jeg ville at du skulle vite det uten å vente.', en: 'The mouth is only water. It took eleven years to find that out, and I wanted you to know without waiting.' }],
        if: S => S.flag.munning },
      { t: [{ no: 'Et hus ved vannet finner sine egne lekkasjer også, med tiden. Sjekk taket, og ikke vent til jeg må si det to ganger.', en: 'A house by the water finds its own leaks eventually too. Check the roof, and do not wait for me to say it twice.' }],
        if: S => S.act2Unlocked },
      /* ---- the festival, and the rest of the valley -------------------- */
      { t: [{ no: 'Festdag. Jeg står bakerst og ser på. Det holder for meg. Kom og stå med meg hvis du vil ha ro.', en: 'Festival day. I stand at the back and watch. That is enough for me. Come and stand with me if you want some peace.' }],
        if: S => !!S.festival },
      { mood: 'warm', t: ['Astrid brings me coffee at the fair and will not take money for it. I do not know how to thank her, so I do not. Do you think she minds?'],
        if: S => !!S.festival },
      { t: [{ no: 'Fiskesuppe varmer lenger enn en genser. Spør Sigrid om oppskriften, hun vil late som hun ikke har en.', en: 'Fish soup keeps you warm longer than a sweater. Ask Sigrid for the recipe, she will pretend she does not have one.' }],
        if: S => (S.bag.fiskesuppe || 0) > 0 },
      { mood: 'troubled', t: ['You have a rod and no boat. Half a fisherman. I can help with the other half, if you will help with mine.'],
        if: S => S.tools.stang && !S.flag.boat },
      { t: [{ no: 'Fire tømmer. Ikke tre. Jeg har prøvd med tre, og båten har aldri tilgitt meg.', en: 'Four timber. Not three. I have tried it with three, and the boat has never forgiven me.' }],
        if: S => S.q.boat === 'active' },
      { t: ['Sigrid sends wool down for the crossings. I never asked her to. I have never said thank you, either, and I think it is too late.'],
        if: S => S.disc && S.disc.setra },
      { mood: 'troubled', t: [{ no: 'Lars går forbi hver høst og ser på båten. Han sier aldri noe. Jeg skulle ønske han ville, bare en gang.', en: 'Lars walks past every autumn and looks at the boat. He never says anything. I wish he would, just once.' }],
        if: S => S.disc && S.disc.gruva },
      { t: ['Marit blessed this boat once. It has leaked ever since. She finds that funny and so, God forgive me, do I.'],
        if: S => S.fr.marit >= 4 },
      { mood: 'warm', t: [{ no: 'Du har rodd nok til at armene dine vet det. Bra. Jeg kan se det på hvordan du holder koppen.', en: 'You have rowed enough that your arms know it. Good. I can tell by how you hold a cup.' }],
        if: S => S.fr.olav >= 8 },
      { t: [{ no: 'Skorsteinen din ryker om morgenen. Jeg ser den fra dokka. Det er noe med å se røyk fra et hus som ikke er mitt.', en: 'Your chimney smokes in the morning. I can see it from the dock. There is something about seeing smoke from a house that is not mine.' }],
        if: S => S.act2Unlocked && S.houseTier > 0 },
      { mood: 'troubled', t: ['A boat is a hole in the water you keep filling with days. I have filled this one with a good many. I would not swap it.'] },
      { t: [{ no: 'Ta med tau uansett hvor du skal. Det er alltid tauet du mangler. Jeg lover deg at jeg ikke tuller.', en: 'Carry rope whatever you are doing. It is always the rope you are short of. I promise I am not joking.' }] },
      /* ---- and the ones that are only to you ----------------------------- */
      { t: ['Do you know how to tie a bowline? Sit. I will show you. It will take ten minutes and I have nowhere to be.'] },
      { mood: 'warm', t: ['I do not talk to many people. I notice that I talk to you. I am not sure what to make of it, and I do not mind.'],
        if: S => S.fr.olav >= 4 }
    ]
  }
};
