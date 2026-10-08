/* Bekkedal — what you can say to Ingrid. She fishes, counts, and says less than she notices. See asks.js. */
import { topic, echo, said } from './asks.js';

const I = 'ingrid';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_INGRID = {
  topics: [
    topic('bite', 'Are they biting?',
      ['Some. They are never quite where you left them yesterday, that is the whole of the sport.'],
      'What is your trick?', [
        ['Patience.', ['[She nods, approving.] Patience. And a good knot.'], 'patience', { fr: 1 }],
        ['Good bait.', ['Bait helps. A cold hand helps more.'], 'bait'],
        ['Luck.', ['Luck is patience wearing a better coat.'], 'luck']]),
    topic('marks', 'What are the marks in your book?',
      ['One for every fish over the pound. Twelve years of them. It is only counting.'],
      'May I see?', [
        ['Yes, if you do not mind.', ['[She hesitates, then opens it a hand\'s width.] There. Do not turn the page.'], 'saw', { fr: 1 }],
        ['It is yours. Keep it.', ['[Her face softens.] Thank you. Not many say that.'], 'keep', { fr: 1, mood: 'warm' }],
        ['What do the marks add up to?', ['Not enough. They never do. That is also the sport.'], 'add']],
      { when: S => S.fr.ingrid >= 2 }),
    topic('marks2', 'Did you add the marks up again?',
      ['I did. Two hundred and nine. It should be over three hundred by now.', 'I stopped fishing the shallows. It does not help.'],
      'Could it be the lake?', [
        ['[Gently.] Could it be the water?', ['It could. I have asked Lars. I have asked the sky. I have not asked the fish.'], 'water', { fr: 1 }],
        ['Could it be you?', ['[A pause.] I would rather it were the lake. The lake cannot be sorry.'], 'you'],
        ['It will come back.', ['[She almost smiles.] It might. That is what I tell it, every morning.'], 'back']],
      { follow: true, when: S => said(S, I, 'marks') && S.fr.ingrid >= 5 }),
    topic('came', 'Did you grow up here?',
      ['I did. I left at nineteen. I came back at forty. The lake was smaller. Or I was bigger.'],
      'Why did you come back?', [
        ['Was it the lake?', ['The lake. The quiet. A person I will not name. [She turns to the water.]'], 'lake'],
        ['You do not have to say.', ['[Relief.] Thank you.'], 'hush', { fr: 1 }],
        ['I am glad you did.', ['[A short, startled smile.] So am I, most mornings.'], 'glad', { fr: 1, mood: 'warm' }]],
      { when: S => S.fr.ingrid >= 3 }),
    topic('pier', 'This is a good pier.',
      ['Olav mends it every spring. He says it is the boat he is really mending, but the pier takes the credit.'],
      'Do you two get on?', [
        ['You seem close.', ['We are old enough to say very little and mean most of it.'], 'close'],
        ['He seems kind.', ['He is. He is also afraid of the mouth of the fjord. Do not tell him I told you.'], 'afraid', { fr: 1 }],
        ['I have not met him properly.', ['Go. He tells better stories than I do. He lies more.'], 'meet']]),
    topic('night', 'Do you fish at night?',
      ['At dusk. After that the lake is not for people. It is for itself. I respect that.'],
      'Does it frighten you?', [
        ['A little. In a good way.', ['That is the right amount.'], 'good', { fr: 1 }],
        ['Not at all.', ['Then you are braver than the herons.'], 'brave'],
        ['I would stay on land.', ['Land is fine. Land has the good chairs.'], 'land']]),
    topic('cold', 'It is bitter out here.',
      ['It is. The ice is thin at the edges and the middle is a lie. Do not walk on it.', 'The char run under it, though. Cold, sweet. Worth the wait.'],
      'Shall I bring you something warm?', [
        ['Tea?', ['[Her eyes light.] Tea. Hot. In a tin cup. That would be the end of me.'], 'tea', { fr: 1, mood: 'warm' }],
        ['Coffee?', ['Coffee would do. Not Astrid\'s. Hers could stand a spoon in it.'], 'coffee'],
        ['I will leave you to it.', ['Good. I will be here. The fish are patient, I am only stubborn.'], 'leave']],
      { when: S => S.season === VINTER }),
    topic('summer', 'The water looks lovely.',
      ['It does. Come midsummer it is warm as milk at the edges, and the dragonflies write on it.'],
      'Do you swim?', [
        ['In summer, yes.', ['[Her eyes crinkle.] You are not so much a farmer as a seal.'], 'swim', { fr: 1 }],
        ['Never learned.', ['Then wade. The shallows are kind.'], 'wade'],
        ['Too cold for me.', ['It is not. But I will not argue with someone who owns a good sweater.'], 'cold']],
      { when: S => S.season === SOMMER }),
    topic('rain', 'Rain does not bother you?',
      ['Fish like it. The surface goes grey and the line goes invisible. I go home with more than I deserve.'],
      'Do you fish in it?', [
        ['I would not dare.', ['Quite right. A wet reel is a lost fish.'], 'dare'],
        ['I love it.', ['Then bring a coat and a good flask. [She nods, approving.]'], 'love', { fr: 1 }],
        ['Only if you are there.', ['[She snorts softly.] I am there. Obviously.'], 'there']],
      { when: S => S.weather === 'regn' }),
    topic('legend', 'Have you ever seen the big one?',
      ['Once. A shadow longer than the boat. It went under the pier and did not come out. I sat there until dark.'],
      'Did you try to catch it?', [
        ['Of course.', ['I did. For three years. [She laughs softly.] It has never forgiven me.'], 'yes', { fr: 1 }],
        ['I would have let it be.', ['That is the better thing. I wish I had thought so then.'], 'letbe', { fr: 1, mood: 'warm' }],
        ['Where was it?', ['Under the pier, to the left. Do not tell the pike.'], 'where']],
      { when: S => S.fr.ingrid >= 4 }),
    topic('food', 'What do you cook with the catch?',
      ['Soup, mostly. Fish, onion, whatever is left of the potatoes. A bay leaf if I am feeling rich.'],
      'Do you cook for yourself?', [
        ['Would you like some company?', ['[A silence, then.] ...On Sunday. If you bring bread.'], 'company', { fr: 1, mood: 'warm' }],
        ['I should learn to cook.', ['Start with soup. Soup forgives.'], 'learn'],
        ['It sounds lovely.', ['It is the same soup. But thank you.'], 'lovely']]),
    topic('bread', 'I brought you some bread.',
      ['[She takes it carefully.] You remembered. [A small, shy smile.] Sit. The soup is still hot.'],
      'May I sit?', [
        ['Gladly.', ['[She ladles two bowls.] Eat. Do not talk. The soup is trying to talk.'], 'gladly', { fr: 2, mood: 'warm' }],
        ['Just for a moment.', ['A moment is plenty. Moments are what I like.'], 'moment', { fr: 1 }],
        ['I have to go.', ['Then go. The bread will keep. So will I.'], 'go']],
      { follow: true, when: S => said(S, I, 'food', 'company') })
  ],
  echoes: [
    echo('I pour tea into the tin cup you mentioned. It is not the same as yours would have been. But it is warm.', S => said(S, I, 'cold', 'tea'), 'warm'),
    echo('You did not turn the page. I noticed. I have noticed it every day since.', S => said(S, I, 'marks', 'saw'), 'warm'),
    echo('You said the book was mine to keep. I have started writing a little more on the margins.', S => said(S, I, 'marks', 'keep'), 'warm'),
    echo('The marks are not climbing. But I keep writing. You said it would come back. I am practising believing you.', S => said(S, I, 'marks2', 'back')),
    echo('I asked the lake. It did not say. But I stood a long time, and that is a kind of answer.', S => said(S, I, 'marks2', 'water')),
    echo('I think of the big one under the pier, most evenings. I am glad you said let it be.', S => said(S, I, 'legend', 'letbe'), 'warm'),
    echo('Olav is still afraid of the mouth. I told you. I should not have, but I am glad I did.', S => said(S, I, 'pier', 'afraid')),
    echo('Sunday soup was a better idea than I expected. Come again when the bread is fresh.', S => said(S, I, 'bread', 'gladly'), 'warm'),
    echo('Patience, and a good knot. You said it back to me and I have been smug about it since.', S => said(S, I, 'bite', 'patience'))
  ]
};
