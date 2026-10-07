/* Bekkedal — what you can say to Lars. He keeps the mine's mouth and the lamps, and talks about rock the way other men talk about weather. See asks.js. */
import { topic, echo, said } from './asks.js';

const L = 'lars';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_LARS = {
  topics: [
    topic('lamp', 'Tell me about the lamps.',
      ['Brass, tin, a wick. I make forty a winter and never sell one. Everyone in the valley has at least one of mine and does not know whose it is.'],
      'Why not sell them?', [
        ['Because it is a gift.', ['[He grunts, pleased.] Because it is a gift. Yes. Do not say it so loudly.'], 'gift', { fr: 1, mood: 'warm' }],
        ['You should charge.', ['I have been told. By Astrid. Weekly.'], 'charge'],
        ['Could I buy one?', ['No. [A short pause.] Take one. Mind the wick.'], 'take', { fr: 1 }]]),
    topic('dark', 'Is it frightening, down there?',
      ['Not the dark. The dark is just where the light has not got yet. It is the quiet that gets under your hat.', 'You hear your own pulse. You hear the mountain thinking.'],
      'What does it think?', [
        ['Slowly.', ['Slowly. [He nods.] Very slowly. Good.'], 'slowly', { fr: 1 }],
        ['About us.', ['[A dry laugh.] About us, I hope kindly.'], 'about'],
        ['It does not think.', ['You are probably right. I still say good morning to it.'], 'notthink', { fr: 1 }]]),
    topic('ore', 'What do you look for in the rock?',
      ['A seam. Iron likes to be in company; copper hides; silver is shy. If you hear a bell in the stone when you strike it, stop.'],
      'Have you ever found anything strange?', [
        ['Tell me.', ['A tooth. A pocket-watch. A very small shoe. I keep them on a shelf. I will not explain the shoe.'], 'tell', { fr: 1 }],
        ['I would have left it.', ['[He nods slowly.] So did I, at first. Then I did not.'], 'left'],
        ['Was it silver?', ['No. It was a hammer. A very old hammer. I think it is mine.'], 'silver']],
      { when: S => S.fr.lars >= 2 }),
    topic('sister', 'You and Sigrid are close.',
      ['She sends cheese. I send lamps. In all the years we have had one proper argument and it was about a goat.', 'I won. She still says she did.'],
      'Who was right?', [
        ['You, surely.', ['[A rumble of laughter.] Thank you. You may stay.'], 'you', { fr: 1, mood: 'warm' }],
        ['Sigrid, I think.', ['[A pause.] ...You may stay anyway.'], 'her'],
        ['The goat.', ['The goat. Yes. The goat won. The goat usually does.'], 'goat', { fr: 1 }]],
      { when: S => S.fr.lars >= 3 }),
    topic('cheese', 'I have a cheese from Sigrid.',
      ['[He puts down his pick.] ...From Sigrid. Ah. [He turns it over with great care.] She wrote nothing?'],
      'Shall I give her a message?', [
        ['That the cheese was a good one.', ['It is. She is. Tell her... that the wick is trimmed. She will understand.'], 'good', { fr: 2, mood: 'warm' }],
        ['That you miss her.', ['[He turns away.] ...You are very direct. Tell her I am well. Tell her the goats are in my mind.'], 'miss', { fr: 2, mood: 'warm' }],
        ['No. You tell her.', ['[A long breath.] Yes. All right. I will write. It will be four words.'], 'write', { fr: 1 }]],
      { follow: true, when: S => said(S, 'sigrid', 'lars', 'carry') }),
    topic('lantern', 'May I borrow a lantern?',
      ['[He is already unhooking one.] It is lit. It will stay lit if you do not do anything clever with it.'],
      'How do I look after it?', [
        ['Keep it upright.', ['Keep it upright. And dry. And do not take it into a high wind unless you are fond of fire.'], 'upright', { fr: 1 }],
        ['Bring it back when I am done?', ['Bring it back if you want to. Or give it to someone. That is how they travel.'], 'back'],
        ['I will name it.', ['[A flicker of a smile.] Do. Mine are all called Wick.'], 'name', { fr: 1, mood: 'warm' }]],
      { when: S => S.fr.lars >= 2 }),
    topic('deep', 'How far down have you been?',
      ['Further than I should. Past the last hoist. There is a place where the air tastes like pennies and the walls hum.', 'I came back up and I did not go again. I think of it as a story I finished.'],
      'Would you take me?', [
        ['I would like to see it.', ['[He studies you a long time.] ...When you have a proper lamp. And a better pick. And a reason.'], 'see', { fr: 1 }],
        ['I will never go.', ['Good. Most sensible people do not.'], 'never'],
        ['What would be the reason?', ['[Gently.] Not money. If it is money, stay up here. It is warmer.'], 'reason', { fr: 1 }]],
      { when: S => S.fr.lars >= 5 }),
    topic('gem', 'Have you seen a crystal?',
      ['Once. Pale blue, the size of a thumb, in a seam below the fifteenth drift. It rang when I put my pick near it. I left it.', 'I have thought about it every week since.'],
      'Why did you leave it?', [
        ['[Softly.] Some things want to stay.', ['[He looks at you.] Yes. That is exactly what I thought.'], 'stay', { fr: 2, mood: 'warm' }],
        ['That seems wasteful.', ['It does. It is. I would still leave it.'], 'wasteful'],
        ['Take me there.', ['No. [A pause.] No. But I will draw you the way.'], 'draw', { fr: 1 }]],
      { when: S => S.fr.lars >= 6 }),
    topic('food', 'Do you eat down there?',
      ['Bread, cheese, a flask of cold tea. Dull and right. The mine does not reward a man for a fine dinner.'],
      'Shall I bring you a hot meal?', [
        ['A proper stew.', ['[A very long pause.] ...I would not refuse. I would not say so loudly.'], 'stew', { fr: 2, mood: 'warm' }],
        ['I will bring cake.', ['Cake. [Startled.] Cake. In a mine. Hm. Good, I will allow it.'], 'cake', { fr: 1 }],
        ['I will leave you to it.', ['[He nods.] Thank you for asking.'], 'leave']]),
    topic('rain', 'It is pouring outside.',
      ['I know. I heard it on the adit. The whole mountain sounds like a drum with a cold.', 'The water finds its way through. Always the same cracks. The mountain remembers.'],
      'Does it ever flood?', [
        ['Is it dangerous?', ['It can be. I check the sump twice a day. Mind your boots.'], 'danger', { fr: 1 }],
        ['It sounds peaceful.', ['It is, when you know where it goes.'], 'peace'],
        ['Shall I help check?', ['[He hands you a lamp.] Left of the ladder. Watch the third step.'], 'help', { fr: 2, mood: 'warm' }]],
      { when: S => S.weather === 'regn' }),
    topic('winter', 'Is it colder in the mine?',
      ['No. Warmer. The mountain keeps its own temperature, whatever the season says. In January I am the warmest man in the valley and the least visited.'],
      'Do you get lonely?', [
        ['I would visit more.', ['[A rumble.] Do. Bring bread.'], 'visit', { fr: 1 }],
        ['It sounds lovely.', ['It is, mostly. A man gets used to being underground.'], 'lovely'],
        ['You have the mountain.', ['I do. It does not say much. It listens, though.'], 'mountain', { fr: 1, mood: 'warm' }]],
      { when: S => S.season === VINTER })
  ],
  echoes: [
    echo('A gift, you said. Nobody has called the lamps that. It is a better word than the one I use.', S => said(S, L, 'lamp', 'gift'), 'warm'),
    echo('The lamp you took. How is it? Wick, I trust. Do not name it anything silly.', S => said(S, L, 'lantern', 'name')),
    echo('A pocket-watch, a tooth, and a very small shoe. They are on the shelf. You looked at them without a word. Thank you.', S => said(S, L, 'ore', 'tell'), 'warm'),
    echo('I wrote to Sigrid. Four words, as promised. She wrote back eleven. I am still reading them.', S => said(S, L, 'cheese', 'write'), 'warm'),
    echo('Sigrid wrote back about the message. She says you are a good carrier. High praise, from her.', S => said(S, L, 'cheese', 'good', 'miss'), 'warm'),
    echo('The crystal, you said, wanted to stay. I took it back to the seam in my mind, and put the dust back over it.', S => said(S, L, 'gem', 'stay'), 'warm'),
    echo('I drew the way to the crystal, if you want it. Do not go alone.', S => said(S, L, 'gem', 'draw')),
    echo('A proper stew, you said. I looked at the pot all evening, thinking of it. I would not refuse one. I would not say so loudly.', S => said(S, L, 'food', 'stew'), 'warm'),
    echo('Left of the ladder, mind the third step. If you ever come to check the sump with me, that is the one that gets people.', S => said(S, L, 'rain', 'help'))
  ]
};
