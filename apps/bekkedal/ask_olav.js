/* Bekkedal — what you can say to Olav. He keeps the boat, tells long stories and lies a little in all of them. See asks.js. */
import { topic, echo, said } from './asks.js';

const O = 'olav';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_OLAV = {
  topics: [
    topic('boat', 'She is a fine boat.',
      ['She is. Built in the year my father fell off the quay, which is how I measure years.', 'She is patched here and here and here, and every patch is a story. Not all of the stories are true.'],
      'Which of them is true?', [
        ['The one about the whale.', ['[He roars with laughter.] Ha! None of the whale ones. Good guess.'], 'whale', { fr: 1 }],
        ['All of them, surely.', ['[He puts a hand on his chest.] You are a generous soul.'], 'all'],
        ['Tell me the true one.', ['[Quietly.] The patch by the oarlock. That one was a rock. That one was a rock.'], 'true', { fr: 1, mood: 'troubled' }]]),
    topic('mouth', 'What is past the mouth of the fjord?',
      ['The sea. Which is a lot of water pretending to be a horizon.', 'I have meant to go for twenty years. The boat is ready. [He pauses.] The boat is always ready.'],
      'What stops you?', [
        ['Fear?', ['[He is quiet.] A little. Mostly habit.'], 'fear', { fr: 1 }],
        ['Nothing, surely. Go.', ['Soon. [He says it the way people always say it.]'], 'go'],
        ['I would come with you.', ['[He looks at you, long.] ...Would you? Truly?'], 'come', { fr: 2, mood: 'warm' }]],
      { when: S => S.fr.olav >= 3 }),
    topic('mouth2', 'Are we going past the mouth?',
      ['[He rubs the back of his neck.] I have been looking at the sky. The sky says maybe. The sky always says maybe.'],
      'Shall we pick a day?', [
        ['Next calm morning.', ['Next calm morning. [He writes it on the doorframe with a stub of chalk.]'], 'calm', { fr: 1, mood: 'warm' }],
        ['When you are ready.', ['I will never be ready. But I will be here.'], 'ready'],
        ['Maybe not this year.', ['No. [Relief and regret in the same breath.] No, maybe not.'], 'notyear']],
      { follow: true, when: S => said(S, O, 'mouth', 'come') }),
    topic('father', 'Was your father a boatman too?',
      ['He was. He rowed the cheese to town and the doctor to the island. He fell off the quay at forty-one and was very surprised about it.'],
      'I am sorry.', [
        ['[Nod.] That sounds hard.', ['It was. It also gave me the boat. Life is that arithmetic.'], 'hard', { fr: 1 }],
        ['Was he a good man?', ['The best at rowing. The second best at cheese. The worst at quays.'], 'good'],
        ['What was he like?', ['Loud. Warm. Wet. [He smiles into the distance.]'], 'like']],
      { when: S => S.fr.olav >= 4 }),
    topic('stories', 'Tell me a story.',
      ['Ha! Sit down. This is the one about the night the lake froze with the boat in it.', 'I got out. The boat stayed. In the morning, there was a heron on it, standing guard, and a pike underneath, looking up.'],
      'Is it true?', [
        ['I believe you.', ['[Delighted.] Then it is at least half true.'], 'believe', { fr: 1 }],
        ['I doubt the heron.', ['The heron is the truest part. The pike is the exaggeration.'], 'heron'],
        ['Tell me another!', ['Another? You are a dangerous audience. Sit.'], 'another', { fr: 1, mood: 'warm' }]]),
    topic('fish', 'Is it any good, fishing from the boat?',
      ['Better than from the pier. The pier is Ingrid\'s. The boat is mine. We have an arrangement and we do not discuss it.'],
      'What is the arrangement?', [
        ['You each keep out of the other\'s way.', ['[He points at you.] You are quick. Yes. Exactly that.'], 'quick', { fr: 1 }],
        ['You like her.', ['I like her. [He looks at the water.] She likes the lake. We both know it.'], 'like'],
        ['It sounds peaceful.', ['It is. We have been at it a long time.'], 'peace']]),
    topic('weather', 'How do you read the weather?',
      ['By the gulls. Gulls inland mean a blow. Gulls low on the water mean calm. Gulls in a row on the quay mean someone has dropped a sandwich.'],
      'Which is it today?', [
        ['A sandwich.', ['[He roars.] Ha! A sandwich! Yes, I think so.'], 'sandwich', { fr: 1 }],
        ['Calm.', ['Calm. [He looks pleased.] You have an eye.'], 'calm'],
        ['I cannot see any gulls.', ['No. [He peers.] That is... a good sign? A bad sign? I will be careful.'], 'none']]),
    topic('rain', 'Terrible rain.',
      ['Wonderful rain! The lake drinks it and gives it back in cold fog. I am a very happy man in the rain.'],
      'Truly?', [
        ['You are a strange man.', ['I am. It is my best quality.'], 'strange'],
        ['I like the rain too.', ['[He beams.] Then you and I will be very wet together.'], 'like', { fr: 1, mood: 'warm' }],
        ['I need a hat.', ['There is one on the hook. It is a good hat. Do not lose it.'], 'hat']],
      { when: S => S.weather === 'regn' }),
    topic('winter', 'Does the boat go out in winter?',
      ['She sleeps. I put her on trestles under a tarp, and I tell her it is only until the thaw. She does not believe me.'],
      'Do you miss it?', [
        ['I would.', ['Every day. [Softly.] But the thaw always comes.'], 'miss', { fr: 1 }],
        ['It sounds restful.', ['It is. I mend rope and listen to the water.'], 'rest'],
        ['Could I help mend rope?', ['[He brightens.] Oh, could you? You would be the first in years.'], 'rope', { fr: 1, mood: 'warm' }]],
      { when: S => S.season === VINTER }),
    topic('quay', 'Do you get many visitors?',
      ['Birds. Weather. The occasional cousin from the city who says "how quaint" and leaves a day early.'],
      'Do you mind the quiet?', [
        ['I like quiet.', ['Good. We will get on. Sit.'], 'like', { fr: 1 }],
        ['I would mind it.', ['I mind it too. Some evenings. Not most.'], 'mind'],
        ['I will visit more.', ['[He looks away, touched.] Do. I will find more stories.'], 'visit', { fr: 1, mood: 'warm' }]]),
    topic('helped', 'Did you keep the chalk mark?',
      ['[He points at the doorframe.] There. I look at it every morning. It gets a little closer each day, or I get a little braver.'],
      'Do you think you will go?', [
        ['I think you will.', ['[A deep breath.] Then so do I.'], 'think', { fr: 1, mood: 'warm' }],
        ['No pressure.', ['No. [He nods.] That helps. It always helps when someone says that.'], 'nopressure'],
        ['I will be there.', ['I know you will. That is the whole of it.'], 'there', { fr: 1 }]],
      { follow: true, when: S => said(S, O, 'mouth2', 'calm') })
  ],
  echoes: [
    echo('The chalk mark is still on the door. I have not rubbed it out. I look at it with a certain nervousness.', S => said(S, O, 'mouth2', 'calm')),
    echo('You offered to come past the mouth with me. Nobody has offered in twenty years. I think about it more than I say.', S => said(S, O, 'mouth', 'come'), 'warm'),
    echo('You said no pressure. That is why I keep thinking about the mouth.', S => said(S, O, 'helped', 'nopressure')),
    echo('The patch by the oarlock. You asked for the true one. Nobody asks. I felt rather seen.', S => said(S, O, 'boat', 'true'), 'warm'),
    echo('A sandwich! The gulls, I mean. I looked again and, yes, a sandwich. You have a gift.', S => said(S, O, 'weather', 'sandwich')),
    echo('Another story, you said. I have been saving one. The one about the pike and the priest. It is not suitable but I think you can bear it.', S => said(S, O, 'stories', 'another'), 'warm'),
    echo('I mended rope all winter thinking of your offer. Come and tie a bowline with me one day.', S => said(S, O, 'winter', 'rope'), 'warm'),
    echo('I told you about my father. I do not tell it often. The telling gets easier with someone who nods.', S => said(S, O, 'father', 'hard'), 'warm')
  ]
};
