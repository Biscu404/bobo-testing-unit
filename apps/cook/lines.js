/* What Jesse says, beyond the pools in data.js (CK_KID): a lot more of every kind of thing, and three new kinds.
   - intro_N: one line when you sit down at bench N for the first time (small box, goes by itself).
   - win_LN:  after a bench is won, once he has said how it went, one more thing about THAT bench, tied to what the story
              has just told you (the box waits for a click, like the first: nothing he says on a win goes by itself).
   - reset_a, undo_a, ruin_many: the things he says about your habits.
   `kidPool(tag)` is the old pool and the new one together; `node apps/cook/cook_check.js` holds them (lengths, no repeats, every
   bench has its lines). He calls the person at the bench Mr. White now and then: it is Walt's bench, and he is the only one who does. */
import { CK_KID } from './data.js';

export const KID_MORE = {
  ruin_X: [
    'Okay, that one is on the floor. That is, like, forty thousand dollars of the floor.',
    'Red. It was red. I am just saying there was a lot of red.',
    'Mr. White is going to see that. He is going to see that and make a face.',
    'The thing about a puddle is, it was a batch like two seconds ago.',
    'You did that on purpose to see what would happen. Admit it. That is science.',
    'Whoa. Okay. Do not breathe that.',
    'We just lost a whole batch to one square. One. Square.',
    'It is fine. It is fine, it is fine, it is fine. Reset.'
  ],
  ruin_sweep: [
    'It got you. It always gets you. It is a very patient thing.',
    'You can see it coming. You can literally see it coming.',
    'One pour, one column. I have said that. I said it out loud.',
    'It does not care that you were almost there.',
    'Okay, so that is where it goes. I will write it on my hand.'
  ],
  ruin_many: [
    'That is, what, three? Three. You can reset. Nobody is keeping score. Okay, I am.',
    'Maybe look at the whole bench before you pour? Like a map? That is just a thought.',
    'You are getting closer. I mean that. The red squares are getting closer to you too.'
  ],
  wall: [
    'That is a wall. We have been over the wall.',
    'Glass does not do that. Glass does not give.',
    'You hit it so hard the flask felt it.',
    'Okay but now we know exactly where the wall is.',
    'The bottle did what it could. It was not enough.'
  ],
  first_mirror: [
    'Yo, it is a mirror! Left is right! Right is left! This is the worst day.',
    'Everything backwards, huh. Like when you turn a shirt inside out.'
  ],
  first_double: [
    'Twice as far. Twice! That is a, that is an upgrade. Just one though.'
  ],
  first_solvent: [
    'Solvent. It wipes everything. Mirror, double, all of it. Clean slate, yo.'
  ],
  first_hot: [
    'Hot hot hot. That is the wax going. Do not touch the wax.',
    'The burner. Okay. Heat opens the wax, and closes the frost. Got it.'
  ],
  first_cold: [
    'Cold. The wax sets and the frost lets you through. It is a trade.',
    'Okay, cold is good for the frost. Hot is good for the wax. Never both.'
  ],
  first_stage: [
    'That is one. It is keeping count. I can hear it keeping count.',
    'Stage one. The flask is a stickler.'
  ],
  reveal: [
    'Huh. So that is what the jar does. Good to know. Terrible way to find out.',
    'We should have a rule where we label things. I am making that a rule.',
    'Now it has a name. It cost us a pour to give it one.',
    'The unmarked ones are always the ones that go sideways. Always.'
  ],
  win_par: [
    'That is the best it can be done. That is the exact best. I counted.',
    'Perfect. That is, like, a perfect cook. I do not even know what to say.',
    'Not a drop wasted. Mr. White would be proud, if he said things like that.',
    'Ninety-nine point one. I can feel it. You can feel it, right?',
    'Minimum pours. I am putting that on the wall.'
  ],
  win_over: [
    'It is done. It does not have to be pretty. Mine never are.',
    'We took the long way and we got there. That counts. That totally counts.',
    'There was probably a shorter way. Do not tell me. Actually, tell me.',
    'It works. That is the main thing. It works!',
    'Not the cleanest. But it is blue where it needs to be blue.'
  ],
  win_first: [
    'First try! You just looked at it and did it! What!',
    'Is that even legal? First try? Show me the board again.',
    'You did not even blink. I blinked. I missed it.',
    'No resets. No ruins. That is the dream, that is the whole dream.'
  ],
  stuck1: [
    'You could just pour one. See what happens. It is only a pour.',
    'The first one is always the hardest. Pick a bottle. Any bottle.'
  ],
  stuck2: [
    'Hover on a bottle and it draws you the line. Before you pour. Free.',
    'The dotted line is the whole game. Look at the dotted line.'
  ],
  stuck3: [
    'Start at the flask and work backwards. Where does the last pour have to come from?',
    'Maybe the answer is two pours that look like a mistake. That happens.',
    'Every bottle goes somewhere. You are just picking the order.'
  ],
  idle: [
    'I am just going to be over here. Not watching. Totally not watching.',
    'You can think as long as you want. I will stand here and look at the beaker.',
    'You know what the best part of this is? Nobody is shooting at us.',
    'Take your time. Seriously. I brought snacks.',
    'There is a bug on the bench. I am not going to say anything. It is there.',
    'Yeah. So, how is your day? Good? Good.',
    'I like this part. The thinking part. Where nothing explodes.',
    'Sometimes I look at a bench like this for an hour and then it is just obvious.'
  ],
  reset_a: [
    'Starting over. Fresh bench. I like a fresh bench.',
    'Reset. Yeah. We learned something. I do not know what, but something.',
    'Okay, again. This time with feeling.',
    'Clean slate. That is also, like, a metaphor.'
  ],
  undo_a: [
    'Take-backs. I did not know we had take-backs.',
    'One pour back. It is like it never happened.',
    'Undo is just a polite word for oops.'
  ],
  /* sitting down at a bench for the first time: what is new about it, in his words */
  intro_1: ['Okay. So you pour the acetone and the lye, and it ends up in the flask. That is, that is chemistry. Right?'],
  intro_2: ['Now there is stuff in the way. It is all glass. Do not break the glass, Mr. White will lose it.'],
  intro_3: ['See the red? Red is bad. Red is the blow-up kind. Do not go in the red.'],
  intro_4: ['Yo, the shelf is backwards. Every bottle pours the wrong way. That plate flips it back. I think.'],
  intro_5: ['It is BLUE. It is blue, why is it blue? Whatever, it sells. Watch the double plate: it throws twice as far.'],
  intro_6: ['Heat makes the wax go. Cold makes the frost go. The flask is behind both. So we need a heater and a cooler. Respect.'],
  intro_7: ['One of these has no label. We pour it to find out. That is a terrible way to do chemistry. We are doing it.'],
  intro_8: ['It moves one column every time you pour. So we do not stand where it is going. That is the whole lesson.'],
  intro_9: ['Three stops, in order. One, two, three. It is a recipe. It is a recipe that eats your pours.'],
  intro_10: ['This is it. Everything at once. You, me, and two bottles with no labels. Let us do it right.'],
  intro_11: ['Nobody is left to cook it for. We are doing it anyway. Come on.'],
  /* after a bench is won, once he has said how it went: one more thing, about THAT bench and what the story just told you */
  win_L1: ['That is a real batch. In a real desert. I am just going to sit with that for a second.', 'Is it supposed to be that clean? It looks clean. It is pretty, kind of.'],
  win_L2: ['Not a flask broken. I am counting that for both of us.', 'Do not tell anybody where the glass came from. Okay? Okay.'],
  win_L3: ['You went around the red. Nobody died. That is better than the last time I saw anybody do a test.', 'Tuco would have loved this. Tuco would have hated us. Both.'],
  win_L4: ['The mirror turned you around and you still found the flask. That is a skill. That is on a resume.', 'Left, right, left. I got dizzy just watching.'],
  win_L5: ['It is BLUE, Mr. White. Everybody is going to want it. That is a problem and also the best news ever.', 'Gus is going to notice. Is that a good thing? I do not know. I kind of have a bad feeling.'],
  win_L6: ['Hot, then cold. We are, like, a thermostat now.', 'The wax went and the frost held. That was a real piece of work.'],
  win_L7: ['So we found out what was in the jar the dumb way. But we found out.', 'I am going to write labels on everything. In marker. In capital letters.'],
  win_L8: ['It missed you by one column. I had my eyes closed the whole time.', 'You made that look easy. It is not easy. Tell me it is not easy.'],
  win_L9: ['One, two, three. That is a real process. That is, like, an empire.', 'Three stages in order. We did that. We, we did that.'],
  win_L10: ['That was everything we had. Everything. I need to sit down.', 'One last time. Okay. That was it. That was a good one. Maybe the best.'],
  win_L11: ['Knock knock. Yeah. Okay. That was the one.', 'Nobody was left to cook it for, and you did it anyway. I am not crying. It is the fumes.']
};

/* the old pool and the new one together, in one list */
export const kidPool = tag => (CK_KID[tag] || []).concat(KID_MORE[tag] || []);
export const KID_TAGS = () => Array.from(new Set(Object.keys(CK_KID).concat(Object.keys(KID_MORE))));
