/* Bekkedal — what you can say to Sigrid. She keeps the setra, the herd and the cheese, and knows each goat by its opinions. See asks.js. */
import { topic, echo, said } from './asks.js';

const G = 'sigrid';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_SIGRID = {
  topics: [
    topic('goats', 'Which goat is which?',
      ['That one is Brunhild, she is in charge. The little one is Pil, she is in everything. The one chewing my sleeve is Knut, and he is, I am sorry, a fool.'],
      'Do you have a favourite?', [
        ['Brunhild.', ['[She nods approvingly.] She would say you have taste.'], 'brunhild', { fr: 1 }],
        ['Pil, obviously.', ['Pil! [She laughs.] You and she will get on. Mind your pockets.'], 'pil', { fr: 1 }],
        ['Knut.', ['Knut? [She stares, then softens.] Everyone should have a fool in their corner.'], 'knut', { fr: 2, mood: 'warm' }]]),
    topic('cheese', 'How do you make the cheese?',
      ['Boil the whey, stir, stir, stir, and do not talk to anyone for six hours. It is the best quiet I know.', 'The brown comes from patience. And a little burnt. Do not tell the guild.'],
      'May I stir?', [
        ['Gladly.', ['[She hands you the paddle.] Slow. Figure of eight. Think of nothing.'], 'stir', { fr: 1, mood: 'warm' }],
        ['I might ruin it.', ['You will not. It is only milk, and it forgives.'], 'ruin'],
        ['I will just taste it.', ['[She hands you a sliver.] There. The end is the best.'], 'taste', { fr: 1 }]]),
    topic('lars', 'Is Lars your brother?',
      ['He is. He lives in the dark and I live in the light and we are the same person at either end of a very long summer.'],
      'Do you see him often?', [
        ['You should visit.', ['I should. It is a long climb down. I send cheese. He sends a lantern. We write nothing.'], 'visit', { fr: 1 }],
        ['He seems fine.', ['He is. He is always fine. That is the worrying part.'], 'fine'],
        ['I could carry something to him.', ['[She brightens.] A cheese. A real one. And tell him I said the goats miss his whistle.'], 'carry', { fr: 2, mood: 'warm' }]],
      { when: S => S.fr.sigrid >= 3 }),
    topic('lars2', 'I brought the cheese to Lars.',
      ['[She leans forward.] And? What did he say?'],
      'What shall I tell her?', [
        ['He said thank you. With his eyebrows.', ['[A burst of laughter.] Yes! That is exactly it! The eyebrows!'], 'eyebrows', { fr: 1, mood: 'warm' }],
        ['He was quiet. But he smiled.', ['[Softly.] Then it was a good cheese.'], 'smiled', { fr: 1 }],
        ['He asked after the goats.', ['Of course he did. He loves them more than me.'], 'goats']],
      { follow: true, when: S => said(S, G, 'lars', 'carry') }),
    topic('herd', 'How many goats do you have?',
      ['Sixty, last count. Sixty-one on a good day, when Knut counts twice.'],
      'Is it hard to keep them all?', [
        ['It sounds exhausting.', ['It is. I am exhausted. It is wonderful.'], 'tired'],
        ['It sounds wonderful.', ['It is. I am exhausted. Same answer.'], 'wonderful', { fr: 1 }],
        ['Do you ever lose any?', ['Never lose. Misplace. Pil is on a rock somewhere, being brave.'], 'lose']]),
    topic('wool', 'Where does the wool come from?',
      ['The sheep on the north slope. I shear them in June and spin all winter, and everybody in the valley wears something I made without knowing it.'],
      'Could I have a hat?', [
        ['A warm one, please.', ['[She is already measuring with her eyes.] Dark grey, thick as a door. Come back when the first frost bites.'], 'hat', { fr: 1 }],
        ['I would knit one myself.', ['Would you? I will teach you. Needles are in the basket. Mind the second row.'], 'knit', { fr: 2, mood: 'warm' }],
        ['I have enough hats.', ['No one has enough hats. But I will not argue.'], 'enough']],
      { when: S => S.fr.sigrid >= 2 }),
    topic('summer', 'The setra looks beautiful.',
      ['It does. Midsummer is the one week the whole mountain smells of cut grass and woodsmoke and I do not mind a single thing.'],
      'Do you stay here all summer?', [
        ['You must love it.', ['I do. I do not tell the valley. They would try to visit.'], 'love', { fr: 1 }],
        ['Is it lonely?', ['Never. Too much company, mostly goats and weather.'], 'lonely'],
        ['Could I stay a night?', ['You could. There is a bench in the shed and a quilt that smells of lanolin. Mind the cat.'], 'stay', { fr: 1, mood: 'warm' }]],
      { when: S => S.season === SOMMER }),
    topic('winter', 'How do you manage in winter?',
      ['I come down to the valley with the herd, and we all squeeze into my winter shed. It is warm. It smells. I would not change it.'],
      'Do the goats mind?', [
        ['They look cosy.', ['They are. Brunhild takes the best spot, always.'], 'cosy'],
        ['I could bring hay.', ['[She nods.] Hay is always welcome. More than gifts.'], 'hay', { fr: 1 }],
        ['I will stay away. The smell.', ['[She laughs.] Honest. I like you more already.'], 'smell']],
      { when: S => S.season === VINTER }),
    topic('rain', 'Wet for the goats.',
      ['They stand under the overhang and complain. Goats hate rain with a purity that is almost admirable.'],
      'Shall I help herd them in?', [
        ['Yes, I will.', ['Thank you. Clap your hands. Not too hard. Pil will bolt.'], 'herd', { fr: 1 }],
        ['I will keep out of the way.', ['Sensible. They bite wet ankles.'], 'out'],
        ['I will bring a towel.', ['A towel for a goat? [She laughs.] It would be the first. Do it.'], 'towel', { fr: 1, mood: 'warm' }]],
      { when: S => S.weather === 'regn' }),
    topic('mountain', 'Is it a long way up?',
      ['Three hours if you hurry, five if you notice things. I always notice things.'],
      'What do you notice?', [
        ['The view.', ['The view, and the way the wind changes at the tree line.'], 'view'],
        ['The flowers.', ['Yes! [She lights up.] The little blue ones. They only open for a day.'], 'flowers', { fr: 1 }],
        ['Birds.', ['Ravens. Two. They have names. I will not tell you what I call them.'], 'birds']]),
    topic('sunday', 'What do you do on Sundays?',
      ['Nothing. On purpose. I sit on the doorstep with a cup, and the goats stand around being critical.'],
      'May I join?', [
        ['Gladly.', ['[She makes room on the step.] Take the left side. The right side has a draught and a goat.'], 'gladly', { fr: 2, mood: 'warm' }],
        ['I should be working.', ['Everyone should. That is why Sunday exists.'], 'working'],
        ['Maybe next week.', ['Next week then. The step does not mind waiting.'], 'next', { fr: 1 }]],
      { when: S => S.fr.sigrid >= 4 })
  ],
  echoes: [
    echo('Knut is a fool, but he is my fool. You said so first. I keep thinking about it, and smile at him.', S => said(S, G, 'goats', 'knut'), 'warm'),
    echo('Brunhild looked at you the way she looks at the ones she approves of. I would take it as a compliment.', S => said(S, G, 'goats', 'brunhild')),
    echo('Pil has stolen another hat. I think it is yours. I will retrieve it. Eventually.', S => said(S, G, 'goats', 'pil')),
    echo('The eyebrows! I laughed all the way to the evening milking, thinking of Lars saying thank you with his eyebrows.', S => said(S, G, 'lars2', 'eyebrows'), 'warm'),
    echo('A cheese for Lars, you said you would take. I will not forget the offer. Lars would say the same, if he said things.', S => said(S, G, 'lars', 'carry'), 'warm'),
    echo('Slow, figure of eight, think of nothing. You were good at it. The cheese came out better than my own.', S => said(S, G, 'cheese', 'stir')),
    echo('The hat is nearly finished. Dark grey. Thick as a door. I added a little blue, secretly, along the edge.', S => said(S, G, 'wool', 'hat'), 'warm'),
    echo('The knitting is going well, I hope? Mind the second row. Everybody forgets the second row.', S => said(S, G, 'wool', 'knit')),
    echo('There is a place on the step for you. Left side. The goat is already complaining.', S => said(S, G, 'sunday', 'gladly'), 'warm')
  ]
};
