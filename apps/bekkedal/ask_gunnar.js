/* Bekkedal — what you can say to Gunnar. He watches the plateau and counts what crosses it. Few words; each of them warm underneath. See asks.js. */
import { topic, echo, said } from './asks.js';

const N = 'gunnar';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_GUNNAR = {
  topics: [
    topic('count', 'What are you counting?',
      ['Whatever crosses. Herds, mostly. Weather. A fox, now and then, who has a limp and a very dignified way of walking.'],
      'Does it matter, counting?', [
        ['It matters to me.', ['[He glances at you.] Then it matters to two of us.'], 'matters', { fr: 1, mood: 'warm' }],
        ['It sounds peaceful.', ['It is. Numbers do not argue.'], 'peaceful'],
        ['What does it come to?', ['Four herds a year, usually. Five, this year. [A pause.] The fifth was in the wrong month.'], 'comes']]),
    topic('fox', 'Tell me about the fox.',
      ['A vixen, grey at the muzzle. She comes at dawn and sits on the cairn and looks at the valley like an old woman at a window.', 'I leave an egg on the stone. I do not say so to anyone.'],
      'May I leave one too?', [
        ['[Nod.] May I leave one?', ['[He almost smiles.] If you like. Not a boiled one. She has opinions.'], 'egg', { fr: 1, mood: 'warm' }],
        ['I will not tell.', ['No. I knew you would not.'], 'wontell', { fr: 1 }],
        ['Is she tame?', ['She is nothing of the kind. She tolerates me. It is better.'], 'tame']]),
    topic('wind', 'It is very windy up here.',
      ['Always. You stop hearing it. Then one day it stops, and the silence is so loud you go out to see what is wrong.'],
      'Does it keep you awake?', [
        ['I would not sleep a wink.', ['You would learn. The body is quick.'], 'sleep'],
        ['I like it.', ['Do you? [He looks sideways.] Not many do.'], 'like', { fr: 1 }],
        ['It sounds lonely.', ['It is. It is also very good company, in its way.'], 'lonely', { fr: 1, mood: 'warm' }]]),
    topic('herd', 'When does the herd come?',
      ['June, if the snow lets them. I hear them before I see them. A sound like rain on a tin roof, only it is hooves and bells.', 'I stand up every time. I do not know why. It is not as if they need me to.'],
      'Do you wave?', [
        ['I would wave.', ['[He lifts a hand, awkward.] I do. A little. When no one is watching.'], 'wave', { fr: 2, mood: 'warm' }],
        ['I would shout hello.', ['Sigrid does. Loudly. I admire it.'], 'shout'],
        ['I would watch quietly.', ['Yes. [A nod.] That is what I do.'], 'quiet', { fr: 1 }]],
      { when: S => S.fr.gunnar >= 2 }),
    topic('numbers', 'Do you write the numbers down?',
      ['Every night. Eighteen years of them in my head and a book that is mostly blank, because I do not trust paper.'],
      'Would you let me keep the book?', [
        ['[Gently.] I could keep it for you.', ['[A long silence.] ...That would be a thing. I will think. I will think.'], 'keep', { fr: 2, mood: 'warm' }],
        ['You should write them down.', ['I know. I know I should.'], 'should', { fr: 1 }],
        ['It is fine to remember.', ['[He nods.] Thank you. That is kinder than the truth.'], 'remember']],
      { when: S => S.fr.gunnar >= 4 }),
    topic('book', 'About the book...',
      ['[He takes a thin, cloth-bound book from his coat and turns it over, twice.] Four herds, a hundred and ten sheep, one fox. It is not much. It is mine.'],
      'May I take it down to Astrid?', [
        ['She keeps the valley\'s ledger.', ['[He is quiet.] ...She does. A shelf of her own. All right. Take it. Carefully.'], 'astrid', { fr: 2, mood: 'warm' }],
        ['Keep it close, then.', ['I will. [He tucks it back.] Thank you for asking first.'], 'close', { fr: 1 }],
        ['I will copy it here.', ['[He holds out a pencil.] There. Sit on the cairn.'], 'copy', { fr: 1 }]],
      { follow: true, when: S => said(S, N, 'numbers', 'keep') }),
    topic('snow', 'It is cold up here.',
      ['It is. The snow comes early and stays late. I keep a stove, a sack of flour and a very long list of things I am not going to complain about.'],
      'Shall I bring you something?', [
        ['A wool blanket.', ['[He nods.] The grey ones are warmest. Sigrid knows.'], 'blanket', { fr: 1 }],
        ['Hot soup.', ['Marit\'s? [He almost lights up.] If it is not too much trouble.'], 'soup', { fr: 1, mood: 'warm' }],
        ['I will leave you in peace.', ['Thank you. I do like the peace. I like being asked more.'], 'peace']],
      { when: S => S.season === VINTER || S.season === HOST }),
    topic('stars', 'The stars are bright up here.',
      ['They are. I know eleven of them by name. The rest I call by what they look like. That one is a ladle.'],
      'Which is my star?', [
        ['The ladle!', ['[A rare laugh.] The ladle. Yes. Good choice. Dependable.'], 'ladle', { fr: 1, mood: 'warm' }],
        ['You choose.', ['[He looks up for a long time.] The small one by the chimney. It never moves. You would like that.'], 'small', { fr: 1 }],
        ['I know none of them.', ['Then I will teach you. One a night. Sit down.'], 'none', { fr: 1 }]],
      { when: S => S.weather === 'klar' && S.min >= 20 * 60 }),
    topic('visit', 'Do you get many visitors?',
      ['Three a year. A priest, a goatherd, and you.', 'I am not complaining. It is the right number.'],
      'Would you like more?', [
        ['I will come more often.', ['[A pause.] ...I would not mind. I would not say so, but I would not mind.'], 'more', { fr: 2, mood: 'warm' }],
        ['Three is a good number.', ['It is. [He nods, relieved.] Thank you for understanding.'], 'three'],
        ['I will bring a friend.', ['Ah. [He considers.] Warn me first. I will tidy the stove.'], 'friend', { fr: 1 }]]),
    topic('rain', 'Rain on the plateau.',
      ['It is a good rain. It comes in sideways and finds every seam. I sit inside with a pipe and I let it be right.'],
      'Do you read when it rains?', [
        ['I would read.', ['I have three books. All of them I have read twice. The best is a book on weather. I enjoy being correct.'], 'read'],
        ['I would sleep.', ['That, too. Rain is the best lullaby there is.'], 'sleep', { fr: 1 }],
        ['I would go for a walk.', ['[He looks at you with unexpected respect.] You are mad. I like it.'], 'walk', { fr: 1 }]],
      { when: S => S.weather === 'regn' })
  ],
  echoes: [
    echo('I left the egg on the stone this morning. She took it. [He says it quietly, almost shy.]', S => said(S, N, 'fox', 'egg'), 'warm'),
    echo('I did not tell anyone about the fox. Not even the fox.', S => said(S, N, 'fox', 'wontell')),
    echo('I waved at the herd in June. Sigrid saw. She waved back so hard I thought she would fall off the track.', S => said(S, N, 'herd', 'wave'), 'warm'),
    echo('The book is written up. The numbers are on paper now, and somebody I trust has the second copy. I sleep better.', S => said(S, N, 'book', 'astrid', 'copy'), 'warm'),
    echo('You said I could keep remembering. I do. Most nights. It is easier for knowing it is not wrong.', S => said(S, N, 'numbers', 'remember')),
    echo('The ladle. I have thought of you every time I looked at it. It is a good star, and nobody else has asked for it.', S => said(S, N, 'stars', 'ladle'), 'warm'),
    echo('I got the eleven stars out of the book last night. I taught myself a twelfth. It is the small one by the chimney. I will keep it for you.', S => said(S, N, 'stars', 'small'), 'warm'),
    echo('I told you three visitors is the right number. Four, I have found, is also acceptable.', S => said(S, N, 'visit', 'more'), 'warm'),
    echo('I tidied the stove. You said you would bring a friend. I am prepared.', S => said(S, N, 'visit', 'friend'))
  ]
};
