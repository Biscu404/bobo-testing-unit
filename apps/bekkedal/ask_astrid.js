/* Bekkedal — what you can say to Astrid, and what she keeps of it. See asks.js for the shape and `.claude/rules/bekkedal-content.md`
 * for the voice: she keeps the shop, counts everything twice, and is kinder than she lets the ledger show. */
import { topic, echo, said } from './asks.js';

const A = 'astrid';
const VAR = 0, SOMMER = 1, HOST = 2, VINTER = 3;

export const ASK_ASTRID = {
  topics: [
    topic('shop', 'How is the shop doing?',
      ['Quiet most days. Loud on Saturdays, when the whole valley remembers it needs nails.', 'I do not mind. A quiet shop is a shop where nothing has gone wrong.'],
      'Do you ever get a day off?', [
        ['I could mind it for an hour.', ['[Her shoulders drop an inch.]', 'Would you? Do not tell anyone I asked.'], 'offer', { fr: 1, mood: 'warm' }],
        ['That sounds peaceful.', ['It is. Do not tell the customers.'], 'calm'],
        ['Business is business.', ['Spoken like my grandmother. [She taps the counter, pleased.]'], 'brisk']]),
    topic('shop2', 'About that hour behind the counter...',
      ['[She slides the ledger across.] If you meant it, look at the second column. I have been staring at it for a week.'],
      'What do you make of it?', [
        ['[Study it.] Less salt, more lanterns.', ['Less salt. More lanterns. Hm. You may be right. [She writes it down.]'], 'lanterns', { fr: 1 }],
        ['It looks fine to me.', ['Fine is a word I have not used about a column in years. Thank you.'], 'fine'],
        ['[Hand it back.] Not my place.', ['No. No, of course. It was kind of you to look.'], 'back']],
      { follow: true, when: S => said(S, A, 'shop', 'offer'), mood: 'warm' }),
    topic('rain', 'Is it going to rain?',
      ['My knee says so. It has been right since I was thirty and I resent it every time.'],
      'Do you trust it over the sky?', [
        ['The sky is only the sky.', ['[She laughs.] Exactly. The knee knows things.'], 'knee'],
        ['I trust you.', ['That is the nicest thing anyone has said to my knee.'], 'trust', { fr: 1 }],
        ['Neither. I carry a hat.', ['A hat. Sensible. Take a dry one from the hook if you like.'], 'hat']],
      { when: S => S.weather !== 'regn' }),
    topic('wet', 'Wet one today.',
      ['It is. Nobody comes in, they all stand under their own eaves and wave.', 'I like it. The whole valley sounds like a drum.'],
      'Do you mind the rain?', [
        ['Not at all. The plots drink it.', ['Good farmer. Bad for business, good for the beans.'], 'farmer'],
        ['I would rather it stopped.', ['Then do what I do. Make coffee and stop wishing.'], 'coffee'],
        ['[Shake the water off.] Sorry about the floor.', ['It has had worse. Wipe your boots and stay a while.'], 'floor', { fr: 1 }]],
      { when: S => S.weather === 'regn' }),
    topic('book', 'What is in the order book?',
      ['Forty names on the order. Twenty-nine of them live here.', 'I keep ordering for the valley my grandmother knew. It is a habit and a small lie.'],
      'What would you tell the wholesaler?', [
        ['Order what the valley needs.', ['[She is quiet a moment.] That is the sensible thing, and I find it hard.'], 'honest', { fr: 1 }],
        ['Keep the lie. It is a kind one.', ['Hm. Kindness costs about eleven kroner a crate. I will think about it.'], 'kind'],
        ['Change the wholesaler.', ['I have thought of it. They have my grandmother\'s signature on file. Hm.'], 'switch']],
      { when: S => S.fr.astrid >= 2 }),
    topic('book2', 'Did you change the order?',
      ['[She taps the book.] I did. Smaller. True. It looks strange on the page, like a man with his hair cut.'],
      'How does it feel?', [
        ['Lighter, I hope.', ['Lighter. Yes. [She breathes out.] Thank you for asking it that way.'], 'light', { fr: 1, mood: 'warm' }],
        ['Brave.', ['[A short laugh.] Brave. Nobody has called a ledger brave before.'], 'brave'],
        ['Like the right size.', ['Exactly the right size. Like a coat that fits.'], 'fit']],
      { follow: true, when: S => said(S, A, 'book', 'honest') && S.fr.astrid >= 6 }),
    topic('lanterns', 'Who buys your lanterns?',
      ['Lars makes them and will not take a krone. I put them out and write the price anyway.', 'Everyone pays him in kind. Cheese, mostly. He is insufferable about cheese.'],
      'Should I take him some thanks?', [
        ['[Nod.] I will take him something.', ['Good. Not cheese. [She smiles.] He has enough cheese.'], 'thanks', { fr: 1 }],
        ['He seems happy as he is.', ['He is. That is the maddening part.'], 'happy'],
        ['You tell him.', ['I have. For eleven years. [She sighs, fondly.]'], 'you']]),
    topic('coffee', 'Could I have a coffee?',
      ['[She is already pouring.] You are the only one who asks. Everyone else just stands there looking at the pot.'],
      'Milk?', [
        ['Black, please.', ['Black. Like the nights here. [She hands it over.]'], 'black'],
        ['A little milk.', ['A little milk. Like the mornings. [She hands it over.]'], 'milk'],
        ['Surprise me.', ['[She puts in exactly one sugar, with ceremony.] There.'], 'sugar', { fr: 1 }]]),
    topic('coffee2', 'The usual, please.',
      ['[She is already reaching for the cup.] The usual it is.'],
      'Anything else?', [
        ['Just the company.', ['That I can do. [She leans on the counter.]'], 'company', { fr: 1 }],
        ['How is your knee?', ['Better for being asked. Worse for the rain.'], 'knee'],
        ['Nothing. Thank you.', ['Always. [She nods.]'], 'thanks']],
      { follow: true, when: S => said(S, A, 'coffee') && S.fr.astrid >= 4 }),
    topic('grandmother', 'Tell me about your grandmother.',
      ['She ran this counter for fifty years and never once raised her voice. She raised her eyebrow. It was worse.', 'She left me the shop and a key to the loft, and I did not use either of them properly for years.'],
      'What was she like?', [
        ['Sounds like you.', ['[She looks away, pleased.] I wish. She was better.'], 'like', { fr: 1, mood: 'warm' }],
        ['Sounds terrifying.', ['She was. Everybody loved her anyway. That is the trick.'], 'terrifying'],
        ['Sounds lonely.', ['[A pause.] It was quiet. Not the same thing. Not quite.'], 'lonely']],
      { when: S => S.fr.astrid >= 3 }),
    topic('stay', 'Do you ever want to leave?',
      ['Every spring, for about a week. Then the seed comes in and I forget why.', 'There is a ferry that goes to the city. I know its timetable. I do not take it.'],
      'What keeps you?', [
        ['The valley.', ['The valley. And the people in it who need nails.'], 'valley'],
        ['The shop.', ['The shop. And the people in it who need company.'], 'shop'],
        ['Maybe nothing. Maybe that is allowed.', ['[She laughs, startled.] It is. I had not thought it was.'], 'allowed', { fr: 1 }]],
      { when: S => S.fr.astrid >= 5 }),
    topic('winter', 'How do you manage in winter?',
      ['I lay in salt and flour in October and tell myself I am prepared. Then the cart is late.', 'The trick is a full stove and a short list of things you cannot live without.'],
      'What is on your short list?', [
        ['Coffee.', ['Coffee. [She nods gravely.] You will go far.'], 'coffee'],
        ['Company.', ['Company. [Softly.] Yes. That too.'], 'company', { fr: 1 }],
        ['Salt.', ['Salt. Practical. I am keeping you.'], 'salt']],
      { when: S => S.season === HOST || S.season === VINTER }),
    topic('summer', 'It is lovely out today.',
      ['It is. I have the door propped open and I am telling myself I might sit outside at four.', 'I will not. But it is a good thought to have.'],
      'Shall I keep the counter while you sit?', [
        ['Please, go and sit.', ['[She hesitates.] ...Ten minutes. Do not sell anything for less than the sticker says.'], 'sit', { fr: 1 }],
        ['Come and sit with me.', ['[She laughs.] The shop would never forgive me. Another day.'], 'with'],
        ['Maybe tomorrow.', ['Maybe tomorrow. It is what I always say.'], 'tomorrow']],
      { when: S => S.season === SOMMER && S.weather === 'klar' }),
    topic('letters', 'Do you get many letters?',
      ['One a month, from a cousin in the city who thinks I should sell up. I answer every one and change nothing.'],
      'What do you write back?', [
        ['That you are staying.', ['Yes. In better words than that. [She smiles.]'], 'staying'],
        ['That the valley is lovely.', ['I say that too. It is true. It has never persuaded her.'], 'lovely'],
        ['That you are busy.', ['That is the one I use most. [A small shrug.]'], 'busy']],
      { when: S => S.fr.astrid >= 4 })
  ],
  echoes: [
    echo('[She sets a cup down before you ask.] You like it black. I remember.', S => said(S, A, 'coffee', 'black'), 'warm'),
    echo('I put a little milk by the pot for you. Do not tell the others I keep it.', S => said(S, A, 'coffee', 'milk'), 'warm'),
    echo('Less salt, more lanterns. It worked, you know. The lanterns went in a week.', S => said(S, A, 'shop2', 'lanterns'), 'warm'),
    echo('You did not look at the second column, and I did not mind. Some things are mine to count.', S => said(S, A, 'shop2', 'back')),
    echo('I changed the order, you know. Smaller. True. I keep looking at it as if it will change back.', S => said(S, A, 'book', 'honest')),
    echo('I have not changed the wholesaler. But I think about it every Thursday, when the invoice comes.', S => said(S, A, 'book', 'switch')),
    echo('Ten minutes outside in the sun, and nobody stole a thing. I have you to thank for it.', S => said(S, A, 'summer', 'sit'), 'warm'),
    echo('I still say my knee is a better forecaster than the sky. You only said you trusted me. It was kind.', S => said(S, A, 'rain', 'trust')),
    echo('Allowed, you said. I have been trying out the word. It fits better than I thought.', S => said(S, A, 'stay', 'allowed'), 'warm'),
    echo('I think of what you said about my grandmother. That she was quiet. It is a good word for her.', S => said(S, A, 'grandmother', 'lonely'))
  ]
};
