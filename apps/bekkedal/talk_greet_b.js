/* Bekkedal — how the last four say hello. The other half of BEK_GREET; the shape is
 * explained at the top of talk_greet_a.js and greet.js is what picks from it. */

export const GREET_B = {
  marit: {
    first: {
      morning: [
        { no: 'God morgen, vennen min. Dugg på gresset, og du kom likevel.', en: 'Good morning, my dear. Dew on the grass, and you came anyway.' },
        ['Come and sit on the step. It is warm by ten.'],
        { no: 'Morgen. Blomstene har våknet. Jeg har ikke bestemt meg ennå.', en: 'Morning. The flowers are awake. I have not made up my mind yet.' }
      ],
      day: [
        'Hello. The bells are quiet, so you will have to make do with me.',
        { no: 'Hei. Kom, la meg se på deg.', en: 'Hello. Come, let me look at you.' },
        ['Afternoon, dear. Mind the grave stones, they have been here longer than the path.']
      ],
      evening: [
        { no: 'Kveld. Kom inn. Døren har ikke vært låst på tretti år.', en: 'Evening. Come in. That door has not been locked in thirty years.' },
        'The light is lovely on the wall now. Stay for it.'
      ],
      night: [
        'You walk about in the dark like a young person. Mind your step.'
      ]
    },
    close: [
      { no: 'Der er du, vennen min. Jeg laget for mye te. Det gjør jeg alltid.', en: 'There you are, my dear. I made too much tea. I always do.', m: 'warm' },
      ['I was just thinking of you.', 'It is a nice surprise when that works.'],
      { no: 'Jeg kjente skrittene dine på stien. Det er lenge siden jeg har kjent noens skritt.', en: 'I knew your step on the path. It is a long time since I knew anybody’s step.', m: 'warm' }
    ],
    again: [
      'Hello again, dear.',
      'Back so soon? Good. An old woman likes to be bothered.',
      { no: 'Har du glemt noe? Nei. Du ville snakke. Sett deg.', en: 'Did you forget something? No. You wanted to talk. Sit.' },
      ['Again! Come, I have just remembered something I wanted to tell you.']
    ],
    away: {
      few: [
        '{n} days! I began talking to the flowers about you.',
        { no: '{n} dager, vennen min. Jeg la merke til at stien ble litt grønnere.', en: '{n} days, my dear. I noticed the path was getting a little greener.' }
      ],
      many: [
        ['{n} days. The meadow has changed since you were last here.', 'You will have to catch up.'],
        { no: '{n} dager. Jeg har hatt for mye tid til å tenke, og det er aldri bra.', en: '{n} days. I have had too much time to think, and that is never good.' }
      ],
      long: [
        [{ no: '{n} dager, vennen min. I min alder er det en årstid.', en: '{n} days, my dear. At my age that is a season.', m: 'troubled' },
         { no: 'Kom her og la meg se på deg.', en: 'Come here and let me look at you.', m: 'warm' }]
      ]
    }
  },

  sigrid: {
    first: {
      morning: [
        'Morning. Mind the goats. They will eat your bootlaces.',
        { no: 'Morgen. Jeg melker. Snakk om du vil, men ikke i veien.', en: 'Morning. I am milking. Talk if you like, but not in the way.' },
        ['Morning. The cheese is on the shelf and the weather is on the hill.']
      ],
      day: [
        'Hello. The goats are on my last nerve, but you are welcome.',
        { no: 'Hei. Du ser ut som du trenger å sette deg.', en: 'Hello. You look like you need a sit.' },
        ['Afternoon. If you came for the view, you are too late. I stood in it.']
      ],
      evening: [
        'Evening. The goats are in. I am almost done being useful.',
        { no: 'Kveld. Nå kan jeg snakke. Det er bare ikke så mye å si.', en: 'Evening. Now I can talk. There is just not much to say.' }
      ],
      night: [
        'Late. I am nearly asleep on my feet. Be quick, then.'
      ]
    },
    close: [
      { no: 'Hei, du. Jeg sparte deg enden av osten. Enden er det beste.', en: 'Hello, you. I saved you the end of the cheese. The end is the best bit.', m: 'warm' },
      ['There you are. I was about to complain about you to the goats.'],
      { no: 'Jeg hørte deg på stien. Bjella på sekken din skurrer.', en: 'I heard you on the track. The buckle on your bag squeaks.', m: 'warm' }
    ],
    again: [
      'You again. Good. The goats were getting the better of me.',
      'Back? Hold this.',
      { no: 'Hei igjen. Nei, jeg har ikke mer ost. Ja, jeg lyver.', en: 'Hello again. No, I have no more cheese. Yes, I am lying.' },
      ['Forgot something? Or did you only miss the smell?']
    ],
    away: {
      few: [
        '{n} days. The goats asked after you. I told them to mind their own business.',
        { no: '{n} dager. Jeg trodde fjellet hadde tatt deg.', en: '{n} days. I thought the mountain had got you.' }
      ],
      many: [
        ['{n} days. The kettle has gone off the boil and back more times than I can say.'],
        { no: '{n} dager. Du skylder meg en forklaring og en kopp kaffe.', en: '{n} days. You owe me an explanation and a cup of coffee.' }
      ],
      long: [
        [{ no: '{n} dager. Jeg har dekket til to og tatt bort det ene igjen, hver kveld.', en: '{n} days. I have laid a place for two and taken the second one away again every night.', m: 'troubled' },
         { no: 'Sett deg. Ikke si noe på en stund.', en: 'Sit down. Do not say anything for a while.', m: 'warm' }]
      ]
    }
  },

  gunnar: {
    first: {
      morning: [
        'Morning. The light is thin up here. It will do.',
        { no: 'Morgen. Klart nok til å se langt.', en: 'Morning. Clear enough to see far.' },
        ['Morning. Something crossed in the night. I will tell you what, if you ask.']
      ],
      day: [
        { no: 'Hei. Du gikk hele veien.', en: 'Hello. You walked all the way.' },
        'Hello. I counted two herds this morning. Do not tell anyone, they do not care.',
        ['Afternoon. The wind has dropped. That does not last.']
      ],
      evening: [
        'Evening. Dusk is the time. Stand there.',
        { no: 'Kveld. Snart krysser de. Ikke snakk for høyt.', en: 'Evening. Soon they cross. Do not talk too loud.' }
      ],
      night: [
        'Night. Stay low. Something is crossing.'
      ]
    },
    close: [
      { no: 'Du kom opp. Bra. Kjelen er varm.', en: 'You came up. Good. The kettle is hot.', m: 'warm' },
      ['I thought it might be you.', 'Your boots sound different on the stone from everybody else’s.'],
      { no: 'Jeg skrev ikke at du ville komme. Jeg håpet bare.', en: 'I did not write down that you would come. I only hoped.', m: 'warm' }
    ],
    again: [
      'Back. Fine.',
      'Still here. So am I.',
      { no: 'Hei igjen. Ingenting har krysset siden sist.', en: 'Hello again. Nothing has crossed since last time.' },
      ['You again. Good.', 'Stand there. You block the wind.']
    ],
    away: {
      few: [
        '{n} days. I wrote it in the book. I do not know why I am telling you.',
        { no: '{n} dager. Jeg la merke til at det ble stille.', en: '{n} days. I noticed it got quiet.' }
      ],
      many: [
        ['{n} days. I counted them. It is what I do.'],
        { no: '{n} dager. En flokk kom og dro i mellomtiden. Du gikk glipp av den.', en: '{n} days. A herd came and went in the meantime. You missed it.' }
      ],
      long: [
        [{ no: '{n} dager. Jeg trodde du hadde gitt opp heiene.', en: '{n} days. I thought you had given up on the heights.', m: 'troubled' },
         { no: 'Fint å ta feil. Kom. Se.', en: 'Good to be wrong. Come. Look.', m: 'warm' }]
      ]
    }
  },

  lars: {
    first: {
      morning: [
        'Morning. Or what is left of it. It is always the same down here.',
        { no: 'Morgen. Hodet først, takk.', en: 'Morning. Mind your head, please.' },
        ['Morning above, I suppose. Down here it is the same hour as ever.']
      ],
      day: [
        { no: 'Hei. Lykten tent? Bra.', en: 'Hello. Lantern lit? Good.' },
        'Hello. Mind the roof. It has opinions.',
        ['Afternoon. Or so I am told. Come in out of it.']
      ],
      evening: [
        'Evening. Up there, I mean. Here it is the usual dark.',
        { no: 'Kveld. Gå opp mens lykten din ennå har olje.', en: 'Evening. Go up while your lantern still has oil.' }
      ],
      night: [
        'Late. You should not be down here. Neither should I.'
      ]
    },
    close: [
      { no: 'Der er du. Jeg holdt den tørre enden av gruveåpningen for deg.', en: 'There you are. I kept the dry end of the adit for you.', m: 'warm' },
      ['Hello.', 'You came down for no reason again. I like that.'],
      { no: 'Jeg hørte hakka di. Du slår rettere nå.', en: 'I heard your pick. You swing straighter now.', m: 'warm' }
    ],
    again: [
      'Back? The mountain has not moved. I checked.',
      'Hello again. Stand there. The roof is better there.',
      { no: 'Deg igjen. Jeg skulle akkurat snakke med veggen.', en: 'You again. I was just about to talk to the wall.' },
      ['Hello. Yes, still dark. No, I am not complaining.']
    ],
    away: {
      few: [
        '{n} days. I propped the roof twice in that time. It held, in case you wondered.',
        { no: '{n} dager. Jeg la merke til at det ble færre lyder i gruva.', en: '{n} days. I noticed there were fewer sounds in the mine.' }
      ],
      many: [
        ['{n} days. I kept the lantern oil for you. Do not waste it.'],
        { no: '{n} dager. Fjellet snakker ikke. Jeg gjorde det, litt, mens du var borte.', en: '{n} days. The mountain does not talk. I did, a little, while you were gone.' }
      ],
      long: [
        [{ no: '{n} dager. Jeg tenkte fjellet hadde tatt deg. Det ville vært det første det tok med vilje.', en: '{n} days. I thought the mountain had got you. It would be the first thing it ever took on purpose.', m: 'troubled' },
         { no: 'Kom inn. Sett deg. Jeg skal bare stå her et øyeblikk.', en: 'Come in. Sit. I will only stand here a moment.', m: 'warm' }]
      ]
    }
  }
};
