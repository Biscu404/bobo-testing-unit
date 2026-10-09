/* What Jesse says while you play the backyard puzzle in the shed: how each board begins, the little things that happen on it, and how it ends. See shed_lines.js for the rest of him.
   No contractions, no curly quotes, nothing longer than 150 characters: node apps/cook/shed_check.js holds it, and holds how often he says bitch. */
export const PLAY = {
  /* sitting down at a board for the first time */
  intro_1: ['Okay, bitch. One spoon, one shed. Walk to it, pick it up, walk back. Arrows or W A S D. Nobody is looking. Yet.'],
  intro_2: ['Hedges. Do not go through the hedges. Two parts and one pair of hands. You carry one at a time, bitch. That is the whole rule.'],
  intro_3: ['That is Mrs. Pickles. See the red? You do not end a move in the red. Push the gnome in her way, bitch. A gnome blocks a look.'],
  intro_4: ['He turns his head, a new way every turn. The little arrow is where he looks next. Wait for it, bitch. Waiting is a move, it is the space bar.'],
  intro_5: ['Two windows, two heads, and they do not agree. Read the arrows, bitch. Move when it is quiet. Not before.'],
  intro_6: ['The tax guy. Briefcase, hat, no sense of humor. Do not end a move next to him. The dots are where he goes next, bitch.'],
  intro_7: ['Cash only. The van guy sells a part for coins. Pick up the coins, then step on the van with your hands empty. That is how he deals, bitch.'],
  intro_8: ['A lemonade stand! Wait on it and it pays a coin. Wait is the space bar. A coin, bitch. Do not tell me lemonade is not a business.'],
  intro_9: ['The whole street. A gnome, two windows, the tax guy, a van. It is a lot. Take it slow, bitch. Slow is fast.'],
  intro_10: ['This is it. Everything we have, one more time. We build the Thing and nobody sees. Come on, bitch. Yeah. Come on.'],
  intro_again: [
    'Again. Fine. Same board, bitch, fresh eyes.',
    'Back at it. I like this one. It is honest.',
    'Okay. This time with feeling, bitch.',
    'You remember where the gnome is. I do not. I never remember the gnome.',
    'One more go. It is only a garden.',
    'Alright. The neighbors have not moved. Neither have I. Go.'
  ],
  step_first: ['Arrows, or W A S D, or click next to you. Space is wait. U undoes, R starts over. Everything else is the garden, bitch.'],
  /* things that happen */
  part: [
    'Got it! That is a part, bitch. Do not drop it.',
    'Yeah! One part. Hands full, go, go, go.',
    'A part! I have no idea what it does. That is the best kind.',
    'Tight. Now back to the shed before anybody looks.',
    'That is a good one. I can feel it being a good one, bitch.',
    'Yo, you actually picked it up. Okay. Walk. Normal walk.',
    'Nobody saw that. Probably. Walk like you are going to the store.'
  ],
  deliver: [
    'In the shed! That is one, bitch.',
    'Yeah! Hand it over. I will put it with the others. The pile. It is a nice pile.',
    'One more for the pile. The pile is happy.',
    'Part in. Nobody saw. Go again, bitch.',
    'Tight. That is how a project works. One thing at a time.',
    'It is in. I put it on the shelf that is on the other shelf. Do not ask.'
  ],
  coin: [
    'Cash! Real cash, bitch. Put it in your pocket, not your mouth.',
    'A coin. A whole coin. We are rich.',
    'Money! The van guy loves that. Pocket it.',
    'Ding. That is the sound of a coin, bitch. I love that sound.'
  ],
  bought: [
    'The van guy came through! Sketchy. Tight. Sketchy. Go, bitch, go.',
    'Bought it! Do not ask where it was. It is a part, it has paperwork, it is fine.',
    'A part, off a van, for coins. That is basically a store. We have a store.',
    'He smiled when he handed it over. I did not like that. Keep walking.'
  ],
  sold: [
    'Lemonade! They paid! A coin for a cup, bitch. I am so proud.',
    'You waited and they paid. That is called a business.',
    'A coin from the stand! It is a little sour. It is a coin. Take it.',
    'People will pay for anything cold. That is the truth about people, bitch.'
  ],
  push: [
    'Push the gnome! Yeah! Right in her way. That is called strategy, bitch.',
    'Gnome pushed. He does not mind. He never minds.',
    'Nice. Now she cannot see past him. The gnome is doing work.',
    'A gnome in the way is a wall that smiles. I would not argue with it.',
    'Careful where he goes. He does not come back out of a corner, bitch.',
    'That is a good gnome. That is a very good gnome.'
  ],
  wait: [
    'Waiting is a move. It is the best move sometimes, bitch.',
    'Hold. Hold. Let them look away. There you go.',
    'Patience. It is the one thing nobody sells in a van.',
    'Do nothing. That is a skill. I am great at it.',
    'Wait for the arrow, bitch. The arrow knows.'
  ],
  undo: [
    'Take-backs. Yeah, take it back. Nobody saw.',
    'One step back. That is like a rewind. Tight.',
    'Undo is just a polite word for oops, bitch.',
    'Back we go. We learned something. I do not know what.'
  ],
  reset: [
    'Fresh board. I like a fresh board, bitch.',
    'Start over. It is fine. Everybody starts over.',
    'Okay, from the top. Clean slate. That is also, like, a metaphor.'
  ],
  /* caught */
  seen: [
    'She SAW you! Bitch, she saw you! Oh, man. Okay. Okay. It is a reset. Breathe.',
    'Red. You were standing in the red! I said the red!',
    'Somebody looked. I felt it. It is a reset, bitch.',
    'Busted. Okay. That is a thing that happens. Take it back.',
    'The neighbors know. The neighbors always know. Again.',
    'Do not stand in the red, bitch! That was the only rule!',
    'I told you the window was open. I did not tell you, I thought it. Same thing. Again.',
    'They looked. Okay. Okay okay okay. U, bitch. Press U.'
  ],
  taxed: [
    'The tax guy! Oh no. Oh no no no. Hide the, uh, everything.',
    'He got close. He got close and he saw the thing. A reset, bitch.',
    'Never get next to the tax guy. That is literally the second rule.',
    'Briefcase to the face. Okay. That is a lot of paperwork. Again.',
    'He is not even mad. That is the scary part. Again, bitch.',
    'The guy has a hat and a plan. Go around the hat, bitch.'
  ],
  cornered: [
    'Oh, you are cornered. Every way out is red. Bitch, press U.',
    'There is nowhere to go. I can see it from here. Take it back.',
    'That is a dead end with a lot of feelings in it. U.'
  ],
  idle: [
    'Take your time. I brought snacks. I did not bring snacks. Take your time.',
    'You can think as long as you want. I will stand here and look at the gnome.',
    'It is the quiet part. I like the quiet part, bitch.',
    'Read the arrows. They tell you everything. They are very honest arrows.',
    'Sometimes I look at a board for an hour and then it is just obvious.',
    'There is a bug on the shelf. I am not going to say anything. It is there.',
    'Look at where they look next, bitch. Then look at where you are.',
    'Do not panic. It is a garden. The worst thing is a neighbor.'
  ],
  stuck: [
    'Try it backwards. Where does the last part have to come from, bitch?',
    'If you cannot go through, make them look elsewhere. That is the gnome. That is what he is for.',
    'Every board has a gap. A turn where nobody looks. Find it. Wait for it.',
    'Hey. If it is too hard, it is okay, bitch. That is just what it is.'
  ],
  /* won */
  win_par: [
    'That is the best it can be done. I counted. I counted twice, bitch.',
    'Perfect! That is, like, a perfect garden. I do not even know what to say.',
    'Minimum moves. Not one wasted. Bitch, that is a professional.',
    'That is par. That is exactly par. I am going to put it on the wall.'
  ],
  win_over: [
    'It is in. It does not have to be pretty. Mine never are, bitch.',
    'We took the long way and we got there. That counts. That totally counts.',
    'There was probably a shorter way. Do not tell me. Actually, tell me.',
    'Not the cleanest. But the part is in the shed, and the shed is happy.'
  ],
  win_first: [
    'First try! You just looked at it and did it! What! Bitch!',
    'No resets, no oops. I would clap but I am holding a spoon.',
    'You did not even blink. I blinked. I missed it, bitch.'
  ],
  win_1: ['One part in the shed. That is how every big thing starts, bitch. With a spoon.', 'See? Walking. Nobody told you it was going to be this easy. It is not going to be this easy.'],
  win_2: ['Two parts, no hedge in the way. Well, a hedge in the way. A lot of hedge. You went around, bitch.', 'You carried them one at a time. That is patience. That is a lot of patience.'],
  win_3: ['The gnome did it. The gnome is a hero. Give the gnome a medal, bitch.', 'Mrs. Pickles is going to look for him later. We should not tell her.'],
  win_4: ['You waited. Hardly anybody waits. You waited and it worked, bitch.', 'He is going to turn his head for the rest of his life. Not our problem.'],
  win_5: ['Two windows and you went through the middle. Like, through the middle! That is nuts.', 'They are going to talk about this at the barbecue. They will not say what, bitch.'],
  win_6: ['The tax guy never saw a thing. He is going to go home and wonder why he is so tired.', 'You walked right around him. Like a pro. Like a, a, a pro, bitch.'],
  win_7: ['A part off a van. That is a real transaction. I feel like a business.', 'The guy gave you a look. I would not shop there again. We are going to shop there again.'],
  win_8: ['You sold lemonade to buy a part. That is a supply chain, bitch. Look at us.', 'Cold drinks, warm money. I want that on a shirt.'],
  win_9: ['The whole street and nobody saw. Not one. Mrs. Pickles is going to retire from the window.', 'You are, like, a ghost with a briefcase, bitch. A ghost with a spoon.'],
  win_10: ['That was everything. Every bit. I need to sit down. I am sitting down.', 'The Thing is whole. It is very quiet. That is the part I do not like. Come here, bitch.'],
  /* the end: the Thing, and what it does, in a row, one click each */
  all: [
    'That is the last part. It is in. It is all in. Okay. Okay. Stand back, bitch. Further.',
    'It is a, uh, garden feature. Like a gazebo. Like a gazebo that goes WHOOMP. Nobody is hurt. Nobody. Look at the sky.',
    'Yeah. Yeah, bitch. That is a fountain. A very loud, very pink fountain. I told you. I told you.',
    'The neighbors are going to complain about the noise. Mrs. Pickles has her coat on. I am going to make tea. There is no kettle. I will find a kettle.'
  ],
  help: [
    'Red means do not end your move there. Dots are where it goes red next. Hedges and gnomes and the shed block a look.',
    'Step onto a part to pick it up and onto the shed to hand it in. Coins go to the van. The stand pays a coin if you wait on it.',
    'Arrows or W A S D to move, space to wait, U to undo, R to start over, H for this, Escape to go back.'
  ]
};
