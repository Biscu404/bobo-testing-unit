/* Bekkedal — what you can say to Marit. She keeps the herb garden and the churchyard and the soup pot, and is kinder than she is soft. See asks.js. */
import { topic, echo, said } from './asks.js';

const M = 'marit';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_MARIT = {
  topics: [
    topic('herbs', 'What are you growing?',
      ['Thyme, sage, lovage, chives. And a bed of things I do not know the names of that came up by themselves and have been very well behaved.'],
      'May I smell them?', [
        ['[Lean in.] Oh, the thyme!', ['[She beams.] Rub a leaf between finger and thumb. Go on. That is the real smell.'], 'thyme', { fr: 1, mood: 'warm' }],
        ['Which is the best?', ['Sage. The leaves feel like a cat\'s ear. I will not say more.'], 'sage'],
        ['I would kill them.', ['You would not. They are tougher than they look. So, I find, are you.'], 'kill', { fr: 1 }]]),
    topic('soup', 'Something smells wonderful.',
      ['Barley and root soup, with lovage. There is always a pot. Somebody always turns up. That is the arithmetic of a pot.'],
      'May I have a bowl?', [
        ['Please. If there is enough.', ['There is always enough. [She is already ladling.]'], 'please', { fr: 1, mood: 'warm' }],
        ['I will not trouble you.', ['It is no trouble. Do not argue with a woman holding a ladle.'], 'trouble'],
        ['I brought something for it.', ['[She peers.] Carrots! Marvellous. In they go.'], 'brought', { fr: 1 }]]),
    topic('church', 'What is the church like inside?',
      ['Dark, and smelling of tar and beeswax. The beam is new now. Håkon put it up with the care of a man hanging a child\'s drawing.', 'I light the candles on Sundays. Whether or not anyone comes.'],
      'Do you pray?', [
        ['[Quietly.] Do you?', ['In my way. I mostly talk. It has not complained.'], 'talk', { fr: 1 }],
        ['I should come on Sunday.', ['You would be welcome. Sit at the back. The bench is kind.'], 'sunday', { fr: 1, mood: 'warm' }],
        ['It is not for me.', ['No matter. The herbs do not ask either.'], 'notme']]),
    topic('graves', 'You tend the churchyard.',
      ['Every week. Forty-three graves. I know them all. I say good morning. [She looks at you.] You think that is odd.'],
      'Is it odd?', [
        ['It is lovely.', ['[Her eyes shine.] Thank you. Most people avoid it.'], 'lovely', { fr: 1, mood: 'warm' }],
        ['A little. In a good way.', ['[She laughs.] The best way to be odd.'], 'odd'],
        ['Who is the oldest?', ['A man named Ketil, 1411. I bring him a sprig of rosemary on his birthday. I made the birthday up.'], 'oldest']],
      { when: S => S.fr.marit >= 3 }),
    topic('stone', 'Is there a grave without a name?',
      ['One. A small one by the north wall. Nobody knows who. I put a flower on it each spring and I call it Little One.', 'Gunnar asks after it sometimes. He cannot come down. He thinks it is his.'],
      'Could I carry a stone up to Gunnar?', [
        ['[Nod.] I will carry him one.', ['[She is silent a moment.] That would mean the world. Take this. [She hands you a smooth grey stone.]'], 'stone', { fr: 2, mood: 'warm' }],
        ['I will think about it.', ['Do. There is no hurry. Little One has patience.'], 'think'],
        ['That is not mine to do.', ['No. [Gently.] It is not. Forgive me for asking.'], 'notmine']],
      { when: S => S.fr.marit >= 6 }),
    topic('flowers', 'What flower is that?',
      ['Which? [She follows your gaze.] That is a harebell. They grow in stony places and look like nothing until they are everywhere.'],
      'May I pick one?', [
        ['Only if you say yes.', ['Yes. One. For somebody who needs it.'], 'one', { fr: 1 }],
        ['I will leave them.', ['Good. They are shy. Come back at midsummer.'], 'leave'],
        ['I would like to give it to someone.', ['[She smiles, knowing.] Then take two. And tell me who.'], 'give', { fr: 1, mood: 'warm' }]],
      { when: S => S.season === SOMMER || S.season === VAR }),
    topic('rain', 'The beds will like this.',
      ['They will. I stand at the door and listen to the plants drinking. It sounds exactly like silence.'],
      'Do you dislike the dry days?', [
        ['A little.', ['A little. They are all very thirsty, and I carry buckets, and I mutter.'], 'little'],
        ['I like dry days too.', ['So do I. For other reasons. You may stay on the bench.'], 'dry', { fr: 1 }],
        ['I will bring a bucket.', ['[She is delighted.] There is one by the gate. I will make tea.'], 'bucket', { fr: 1 }]],
      { when: S => S.weather === 'regn' }),
    topic('husband', 'Do you live alone?',
      ['Since the church bell and the winter of the big snow. He is in the churchyard. By the elder tree. He likes the elder.'],
      'I am sorry.', [
        ['[Quietly.] What was he like?', ['Tall, stubborn, bad at singing, very good at mending a roof. He would have liked you.'], 'like', { fr: 1, mood: 'warm' }],
        ['That must be hard.', ['It is a thing you carry. It gets lighter if you carry it carefully.'], 'hard', { fr: 1 }],
        ['[Say nothing. Stand beside her.]', ['[She leans, very slightly, on your arm.] Thank you.'], 'beside', { fr: 2, mood: 'warm' }]],
      { when: S => S.fr.marit >= 5 }),
    topic('bees', 'Do you keep bees?',
      ['Two hives, and they keep me. They are in a mood today. Do not wave your hat.'],
      'Do they sting?', [
        ['[Back away.] I will keep my hat down.', ['A wise creature. They are only afraid of ones who flap.'], 'hat'],
        ['May I see?', ['From here. Slowly. [She hums softly to them.] There. See? They like a hum.'], 'see', { fr: 1 }],
        ['I will buy some honey.', ['Take it. I do not sell it. I give it to people who stand still.'], 'honey', { fr: 1 }]],
      { when: S => S.season === SOMMER && S.weather !== 'regn' }),
    topic('stew', 'Teach me something to cook.',
      ['Boiled potatoes with butter and dill. It sounds like nothing. It is the food of the whole valley.'],
      'What is the secret?', [
        ['The butter.', ['[She laughs.] The butter, and the salt, and not walking away from the pot.'], 'butter'],
        ['The dill.', ['The dill. Fresh. Never dried. You will see.'], 'dill', { fr: 1 }],
        ['Patience.', ['Patience is also the secret to bread, to roofs, and to people.'], 'patience', { fr: 1, mood: 'warm' }]]),
    topic('dill', 'I tried your potatoes.',
      ['[She leans forward.] And?'],
      'How were they?', [
        ['Perfect, I think.', ['[Delighted.] Of course they were. I taught you.'], 'perfect', { fr: 1, mood: 'warm' }],
        ['Burnt. A little.', ['A little burnt is a little loved. Try again.'], 'burnt'],
        ['I forgot the dill.', ['Oh, dear. [She laughs.] Then you have learned it the right way.'], 'forgot']],
      { follow: true, when: S => said(S, M, 'stew', 'dill', 'butter', 'patience') })
  ],
  echoes: [
    echo('Rub the leaf between finger and thumb, you said you would. I like to think you still do.', S => said(S, M, 'herbs', 'thyme'), 'warm'),
    echo('I put a bowl by the door for you. It is only barley. It is always enough.', S => said(S, M, 'soup', 'please'), 'warm'),
    echo('You said the churchyard was lovely. I walked there afterwards and tried to see it as you did. It helped.', S => said(S, M, 'graves', 'lovely'), 'warm'),
    echo('If you do carry a stone up to Gunnar, tell him it is from the north wall. He will know which one.', S => said(S, M, 'stone', 'stone'), 'warm'),
    echo('Little One has fresh flowers. You did not know that I put them by. It is a small secret and now it is yours.', S => said(S, M, 'stone', 'think', 'notmine')),
    echo('Forty-three graves. I said good morning to all of them. Ketil, 1411, says good morning back, I like to think.', S => said(S, M, 'graves', 'oldest')),
    echo('You stood beside me. I remember it. It is the best thing anyone has done in the churchyard in years.', S => said(S, M, 'husband', 'beside'), 'warm'),
    echo('I made too much soup. The pot knew you were coming.', S => said(S, M, 'soup', 'brought'), 'warm'),
    echo('Two harebells, for whoever it was. I hope they are glad of it.', S => said(S, M, 'flowers', 'give'), 'warm')
  ]
};
