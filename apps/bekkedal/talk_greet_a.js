/* Bekkedal — how the first four say hello. Half of BEK_GREET; talk_greet_b.js
 * is the other half and greet.js is what picks from them.
 *
 * What an NPC says before they say anything else, in their own voice:
 *   first  — the first time you speak to them on a given day, by the hour
 *   close  — the same, once they like you (friendship 6 or more); it replaces the plain one half the time
 *   again  — the second and later times in one day
 *   away   — when you have not spoken to them for a good while: `few` (4+ days), `many` (9+), `long` (16+)
 *
 * An entry is one line or an array of lines. A line is a string, or { no, en, m } where `m` is the
 * face for it ('warm' or 'troubled'). `{n}` in `away` is the number of days. Said to the player,
 * from the speaker, in the first person: nothing in here is about somebody who is not in the room.
 */

export const GREET_A = {
  astrid: {
    first: {
      morning: [
        { no: 'God morgen! Kaffen er på.', en: 'Good morning! The coffee is on.' },
        { no: 'Tidlig oppe. Bra. Da rekker du før kundene.', en: 'Up early. Good. You beat the rush.' },
        ['Morning. Mind the step, there is frost on it still.']
      ],
      day: [
        { no: 'Hei, du! Kom inn, kom inn.', en: 'Hello, you! Come in, come in.' },
        { no: 'Der er du. Jeg lurte på når du ville dukke opp.', en: 'There you are. I wondered when you would turn up.' },
        ['Afternoon. The ledger is behaving, for once. Do not look at it, you will frighten it.']
      ],
      evening: [
        { no: 'God kveld. Jeg skulle akkurat stenge.', en: 'Good evening. I was just about to close.' },
        ['Late shift for both of us, then.']
      ],
      night: [
        { no: 'Så sent? Kom inn før lampen går, da.', en: 'This late? Come in before the lamp goes, then.' }
      ]
    },
    close: [
      { no: 'Hei, du. Det er godt å se deg.', en: 'Hello, you. It is good to see you.', m: 'warm' },
      { no: 'Jeg sparte deg den gode enden av brødet.', en: 'I saved you the good end of the loaf.', m: 'warm' },
      [{ no: 'Å, endelig noen jeg ikke trenger å late som for.', en: 'Oh, finally somebody I do not have to be polite for.', m: 'warm' }]
    ],
    again: [
      { no: 'Hei igjen!', en: 'Hello again!' },
      'Back already? Did you forget something?',
      { no: 'Nei, nå skjønner jeg det. Du savner meg.', en: 'No — now I see it. You miss me.', m: 'warm' },
      'Twice in one day. People will talk. I will start it.'
    ],
    away: {
      few: [
        { no: '{n} dager! Jeg begynte å lure på om skorsteinen din ryker ennå.', en: '{n} days! I was starting to wonder whether your chimney still smokes.' },
        ['{n} days. There was a gap in my week and I did not like it.']
      ],
      many: [
        ['{n} days and not a word. I very nearly sent somebody to look for you.'],
        { no: '{n} dager. Jeg har holdt kaffen varm så lenge at den er blitt noe annet.', en: '{n} days. I have kept the coffee warm so long it has become something else.' }
      ],
      long: [
        [{ no: 'Er det virkelig deg? {n} dager. Jeg hadde begynt å snakke om deg i fortid.', en: 'Is it really you? {n} days. I had started to talk about you in the past tense.', m: 'troubled' },
         { no: 'Kom inn. Fortell meg alt. Jeg skal late som jeg ikke har ventet.', en: 'Come in. Tell me everything. I will pretend I have not been waiting.', m: 'warm' }]
      ]
    }
  },

  hakon: {
    first: {
      morning: [
        ['Mm.', { no: 'Morgen.', en: 'Morning.' }],
        'Early. Good. The light is straight at this hour.',
        { no: 'Morgen. Jeg har allerede sagd opp en planke. Se.', en: 'Morning. I have already cut a plank. Look.' }
      ],
      day: [
        { no: 'Hei. Mm.', en: 'Hello. Mm.' },
        'Come to watch or come to carry?',
        ['Mm. You. Good. Mind the shavings.']
      ],
      evening: [
        'The light is going. I am putting things away.',
        { no: 'Kveld. Ikke stå i linjen til sagen.', en: 'Evening. Do not stand in the line of the saw.' }
      ],
      night: [
        ['Mm. Late.', 'Whatever it is, it keeps till the morning.']
      ]
    },
    close: [
      { no: 'Der er du. Jeg holdt krakken ledig.', en: 'There you are. I kept the stool free.', m: 'warm' },
      ['Mm. Good to see you.', 'I mean it. Do not tell anyone.'],
      { no: 'Jeg lurte på om det var deg. Skrittene dine har en rytme nå.', en: 'I wondered if it was you. Your steps have a rhythm to them now.', m: 'warm' }
    ],
    again: [
      'Mm. Again.',
      'Forgot something?',
      { no: 'Du er tilbake. Mm.', en: 'You are back. Mm.' },
      ['Hold this end.', 'No, the other end. Good.']
    ],
    away: {
      few: [
        'Mm. {n} days. I noticed.',
        { no: '{n} dager. Jeg trodde du hadde funnet noen som er bedre med hammer.', en: '{n} days. I thought you had found somebody better with a hammer.' }
      ],
      many: [
        ['{n} days.', 'A job takes less than that. It seems a friendship takes more.'],
        { no: '{n} dager. Jeg sluttet å spare avkapp til deg. Spøk. Jeg sparte det.', en: '{n} days. I stopped saving the offcuts for you. Joke. I saved them.' }
      ],
      long: [
        [{ no: '{n} dager. Jeg har høvlet en planke for hver, så du ser hvor lenge det var.', en: '{n} days. I planed one plank for each, so you can see how long it was.' },
         { no: 'Ikke si noe. Bare ta dem.', en: 'Do not say anything. Just take them.', m: 'troubled' }]
      ]
    }
  },

  ingrid: {
    first: {
      morning: [
        { no: 'God morgen. Fisken er våken. Det er du også.', en: 'Good morning. The fish are awake. So are you.' },
        ['First light. You made it.'],
        'Quiet this morning. Even the water is holding its breath.'
      ],
      day: [
        'Hello. Quiet today. The lake and me.',
        { no: 'Hei. Pass på snøret, jeg har nettopp ryddet det.', en: 'Hi. Mind the line, I have just cleared it.' },
        ['Hello. Sit if you like. Do not talk if you do not want to.']
      ],
      evening: [
        'Evening. They turn about now. Stay if you like.',
        { no: 'Kveld. Det er nå det begynner.', en: 'Evening. This is when it starts.' }
      ],
      night: [
        'You walk late. So do I. Come and sit.'
      ]
    },
    close: [
      { no: 'Der er du. Jeg holdt plassen din på brygga.', en: 'There you are. I kept your place on the pier.', m: 'warm' },
      ['Hello, you.', 'I was just about to count the day and I would rather count you in.'],
      { no: 'Du har lært å gå stille. Jeg hørte deg ikke komme.', en: 'You have learned to walk quietly. I did not hear you come.', m: 'warm' }
    ],
    again: [
      'You again. The lake has not changed in the last hour.',
      'Hello again. Nothing is biting, if that is what you came to ask.',
      { no: 'Hei igjen. Stå stille, så snakker vi.', en: 'Hello again. Stand still, and we will talk.' },
      ['Back. Good. Hold the net.']
    ],
    away: {
      few: [
        '{n} days. The lake noticed. I told it you were busy.',
        { no: '{n} dager. Jeg ble ikke bekymret. Jeg la bare merke til det, flere ganger.', en: '{n} days. I was not worried. I only noticed, several times.' }
      ],
      many: [
        ['{n} days. I counted. You know that I count.'],
        { no: '{n} dager. Brygga har ikke vært den samme uten deg.', en: '{n} days. The pier has not been the same without you.' }
      ],
      long: [
        [{ no: '{n} dager er mer enn jeg setter i boken uten en note.', en: '{n} days is more than I write in the book without a note.' },
         { no: 'Hvor har du vært? Ikke svar nå. Sett deg.', en: 'Where have you been? Do not answer yet. Sit.', m: 'troubled' }]
      ]
    }
  },

  olav: {
    first: {
      morning: [
        'Morning. The tide is wrong. It always is.',
        { no: 'Morgen. Båten lekker. Det gjør ingenting. Det har hun alltid gjort.', en: 'Morning. The boat leaks. No matter. She always has.' },
        ['Mm. Morning. Mind the plank.']
      ],
      day: [
        'Hello. Come to look at the water, or at the boat?',
        { no: 'Hei, hei. Samme vann, samme meg.', en: 'Hello, hello. Same water, same me.' },
        ['Afternoon. Watch your feet, the planks are wet.']
      ],
      evening: [
        'Evening. Light on the water. It is the one free thing out here.',
        { no: 'Kveld. Nå ser sjøen snill ut. Ikke stol på det.', en: 'Evening. The sea looks kind now. Do not trust it.' }
      ],
      night: [
        'Late. The water does not sleep either.'
      ]
    },
    close: [
      { no: 'Der er hun som ror. Sett deg. Jeg skal ikke snakke lenge.', en: 'There is the one who rows. Sit. I will not talk long.', m: 'warm' },
      ['Good to see you.', 'Do not tell the boat I said so.'],
      { no: 'Jeg så årene dine på vannet før jeg så deg. Det var hyggelig.', en: 'I saw your oar strokes on the water before I saw you. That was nice.', m: 'warm' }
    ],
    again: [
      'Back? The sea is where you left it.',
      'Again. Good. Hold this rope.',
      { no: 'Du igjen. Sjøen sier hei.', en: 'You again. The sea says hello.' },
      ['Hello. Yes, still leaking. No, I am not worried.']
    ],
    away: {
      few: [
        '{n} days. I thought you had gone down with the boat.',
        { no: '{n} dager. Jeg tenkte nesten at du hadde ro-t forbi munningen uten meg.', en: '{n} days. I half thought you had rowed past the mouth without me.' }
      ],
      many: [
        ['{n} days. I patched the plank you stand on, in case.'],
        { no: '{n} dager. Sjøen har fått mer av meg enn du, og den takker aldri.', en: '{n} days. The sea has had more of me than you have, and it never says thanks.' }
      ],
      long: [
        [{ no: '{n} dager. Jeg satt her og så på horisonten og skjønte at jeg så etter deg.', en: '{n} days. I sat here looking at the horizon and realised I was looking for you.', m: 'troubled' },
         { no: 'Sett deg. Båten holder.', en: 'Sit. The boat will hold.', m: 'warm' }]
      ]
    }
  }
};
