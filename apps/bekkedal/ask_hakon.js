/* Bekkedal — what you can say to Håkon. He builds, he says very little of it, and what he says he means. See asks.js. */
import { topic, echo, said } from './asks.js';

const H = 'hakon';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_HAKON = {
  topics: [
    topic('wood', 'What is the best wood?',
      ['Pine, felled in winter, left to dry two summers. Anything else is a promise you are making to the next man.'],
      'Do you have a favourite?', [
        ['Pine, then.', ['[He nods once.] Pine.'], 'pine', { fr: 1 }],
        ['Birch, for the look.', ['Birch is for stoves and for people with strong opinions. [A flicker of a smile.]'], 'birch'],
        ['Whatever is to hand.', ['Honest. It is what most of us use. It still lasts, if you are kind to it.'], 'hand']]),
    topic('nails', 'How do you not hit your thumb?',
      ['I do. Less than I did. You stop minding. Then you stop flinching, and that is when you stop hitting it.'],
      'Does it hurt?', [
        ['[Wince.] Sounds like it does.', ['Like being told off by a very small person.'], 'wince'],
        ['I will practise.', ['Practise on scrap. Never on the good board.'], 'practise', { fr: 1 }],
        ['I will hire someone.', ['[A short huff of a laugh.] That works too.'], 'hire']]),
    topic('barn', 'Have you built many barns?',
      ['Eleven. Ten stand. [He is quiet.] One I do not talk about.'],
      'Do you want to talk about it?', [
        ['[Stay silent.]', ['[He looks at his hands for a moment.] Good. Not yet.'], 'silent', { fr: 1 }],
        ['What went wrong?', ['I measured the slope once. Not twice. [He says nothing more.]'], 'ask'],
        ['Everyone gets one wrong.', ['Not everyone is the one holding the ruler. Thank you, all the same.'], 'everyone', { fr: 1 }]],
      { when: S => S.fr.hakon >= 3 }),
    topic('barn2', 'About that barn...',
      ['It was Ole Brekke\'s. The roof took the first snow and the second was too much. Nobody was in it. That is the only reason I can say it aloud.'],
      'Does it help to say it?', [
        ['[Nod.] I am glad you did.', ['[He nods back, once.] So am I. Odd.'], 'glad', { fr: 1, mood: 'warm' }],
        ['You measured twice since.', ['Four times, now. Five on a good day.'], 'four'],
        ['Let it be.', ['I will. It is hard. I will.'], 'letbe']],
      { follow: true, when: S => said(S, H, 'barn', 'silent', 'everyone') && S.fr.hakon >= 6, mood: 'troubled' }),
    topic('church', 'What was it like, the church beam?',
      ['A ridge beam eight hundred years old and rotten at one end. I took it down in four days and put a new one up with a tenth of the speed it deserved.', 'Marit made me soup the whole week. I owe her a barn. She refuses to let me build her one.'],
      'Did you want to do it?', [
        ['You did a good thing.', ['It was only wood. [He looks pleased anyway.]'], 'good', { fr: 1 }],
        ['Marit sounds kind.', ['She is the kindest hard woman I know.'], 'kind'],
        ['Eight hundred years! What if it fell?', ['It will not. I made it not.'], 'fell']],
      { when: S => S.flag.tall || S.fr.hakon >= 6 }),
    topic('tools', 'Which tool matters most?',
      ['The level. It never lies and it never has an opinion.'],
      'Not the hammer?', [
        ['The hammer is for emphasis.', ['[He nearly laughs.] Yes.'], 'emphasis', { fr: 1 }],
        ['The saw?', ['The saw is for being sure. The hammer is for being finished.'], 'saw'],
        ['The eye, then.', ['The eye is the first tool. You grow the rest around it.'], 'eye']]),
    topic('house', 'What makes a good house?',
      ['A dry floor. A chimney that draws. A door that closes in all weather.', 'The rest is decoration, and you can buy decoration at any time.'],
      'And what makes it a home?', [
        ['A person who wants to come back.', ['[A pause.] Yes. That I cannot build.'], 'person', { fr: 1, mood: 'warm' }],
        ['A kettle.', ['A kettle, yes. Good answer. Fit a hook for it.'], 'kettle'],
        ['A window with a view.', ['Face it south. Always south. Even if the view is north.'], 'window']]),
    topic('weather', 'Will the weather hold?',
      ['Look at the smoke. It leans west when it will not.', 'I have not been wrong since the barn. I have been careful since the barn.'],
      'Teach me to read it?', [
        ['Yes, please.', ['Lean west is rain. Straight is fair. Sideways is trouble. That is all of it.'], 'learn', { fr: 1 }],
        ['I will trust your word.', ['Then you will be dry more often than not.'], 'word'],
        ['I carry a hat.', ['[He tips his own, gravely.] So do I.'], 'hat']]),
    topic('walls', 'Do you sleep well?',
      ['Better since the beam. Worse before it. Nothing keeps a man up like a roof he is not sure of.'],
      'What do you do when you cannot sleep?', [
        ['I count things.', ['Rafters. I count rafters. [Faintly.] Eight hundred years of them.'], 'count', { fr: 1 }],
        ['I walk.', ['I walk the house. Touch each wall. Tell it good night.'], 'walk'],
        ['I make tea.', ['Tea is for people with better habits. I make nothing. I lie there.'], 'tea']],
      { when: S => S.fr.hakon >= 4 }),
    topic('help', 'Do you need a hand with anything?',
      ['Always. And never. I like working alone, and I hate working alone.'],
      'Which is it today?', [
        ['I could carry for an hour.', ['[He points at a stack.] Left pile to the right. Mind the corner.'], 'carry', { fr: 1 }],
        ['I will leave you to it.', ['Good. [He means it kindly.]'], 'leave'],
        ['Teach me a joint.', ['Sit. I will show you a half-lap. Not today. Soon.'], 'joint', { fr: 1 }]]),
    topic('joint', 'Shall we do that half-lap?',
      ['[He clears the bench.] Mark the cheek. Saw the line. Chisel to the baseline. Slowly. Always slowly.'],
      'How does mine look?', [
        ['A bit crooked.', ['Crooked. Honest. Try once more.'], 'crooked'],
        ['Fine, I think!', ['It is passable. [He grins.] That is high praise from me.'], 'fine', { fr: 1 }],
        ['I need another go.', ['They all do. Mine took a winter.'], 'again']],
      { follow: true, when: S => said(S, H, 'help', 'joint') }),
    topic('winter', 'How does the winter find you?',
      ['Indoors, mostly, making what the spring will need. Doors. Shelves. Small things that sit well in the hand.'],
      'Could you make me something small?', [
        ['A spoon, perhaps.', ['A spoon. Birch. I will see what the wood wants to be.'], 'spoon', { fr: 1 }],
        ['A stool.', ['A stool. Three legs, never four. Four rock.'], 'stool'],
        ['Nothing. Just curious.', ['Fair. [He goes on planing.]'], 'curious']],
      { when: S => S.season === VINTER }),
    topic('spring', 'It smells of new sawdust in here.',
      ['It does. The first of the year, when the logs come down off the hill. Nothing else smells like it.'],
      'Do you wait for it?', [
        ['I love that smell too.', ['[He looks at you properly.] You do? Most people say it is only wood.'], 'love', { fr: 1, mood: 'warm' }],
        ['Never really noticed.', ['Then I have noticed for both of us.'], 'notice'],
        ['It makes me sneeze.', ['[A snort.] You will get used to it. Or leave.'], 'sneeze']],
      { when: S => S.season === VAR })
  ],
  echoes: [
    echo('Pine. You said pine. I put a good board by for you. Do not tell Astrid.', S => said(S, H, 'wood', 'pine'), 'warm'),
    echo('Birch. Hm. I still say it is for stoves. But I made you a handle out of it.', S => said(S, H, 'wood', 'birch')),
    echo('Sometimes I measure a thing a fifth time and think of you telling me everyone gets one wrong.', S => said(S, H, 'barn', 'everyone'), 'warm'),
    echo('You did not push about the barn. I noticed. I do not forget it.', S => said(S, H, 'barn', 'silent'), 'warm'),
    echo('I have said it aloud once, about Ole\'s barn. The sky stayed where it was. [A faint smile.]', S => said(S, H, 'barn2', 'glad'), 'warm'),
    echo('The smoke leaned west this morning. You will have seen it, now. It is a small thing, being listened to.', S => said(S, H, 'weather', 'learn')),
    echo('Left pile to the right, mind the corner. If you want to carry again, there is always more.', S => said(S, H, 'help', 'carry')),
    echo('A half-lap is a promise between two boards. You made one. I keep it on the shelf.', S => said(S, H, 'joint', 'fine'), 'warm'),
    echo('A kettle hook, south-facing window, a door that closes. That is the answer you gave. It holds up.', S => said(S, H, 'house', 'kettle')),
    echo('A person who wants to come back. I thought about that. I have not made a house yet that was missing only that.', S => said(S, H, 'house', 'person'), 'warm')
  ]
};
