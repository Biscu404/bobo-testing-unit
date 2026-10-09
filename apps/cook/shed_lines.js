/* What Jesse says in the shed (the owner's blueprint opens it): the shed itself, the things in it, and whatever you say to him. He is the Jesse of El Camino now, a year and a long road on, but he still
   talks like the show: yo, dude, tight, sketchy, whatever, seriously, and bitch, which is how he says almost everything, kindly or not. The bench keeps the old pools (data.js, lines.js) and is
   quieter on purpose; this one is not. The words of the puzzle are in shed_lines_play.js.
   No contractions, no curly quotes and nothing longer than 150 characters, the same as the bench: node apps/cook/shed_check.js holds the pools. */
export const HUB = {
  /* the very first time the door opens: a short run of things, one click each */
  hub_first: [
    'Yo. You came. Okay. Come in, bitch, shut the door, mind the floor. It is a floor in the sense that it is under us.',
    'This is the shed. It is mine now. I got it in a deal I will not explain. It has a roof, which is a lot, honestly.',
    'The thing on the wall is what you drew me. A blueprint. Nobody ever drew me a blueprint. Now I have to build it.',
    'The plan is simple. Parts go in the shed. Neighbors do not see. The tax guy does not see. Nobody gets hurt. Tight.'
  ],
  hub: [
    'Yo, look who it is. Sit down, bitch. Not on the blue crate. The blue crate is load bearing.',
    'Back again. Good. I was talking to the radio. The radio is a terrible listener.',
    'There you are. I put the kettle on, which is a lie, there is no kettle. Hi.',
    'Okay, so the neighbors have been, like, extra today. Welcome back, bitch.',
    'Door is open, shed is warm. Well. Shed is a shed. Come in.',
    'I was just thinking about you. I was thinking: where is the other guy with the blueprint. And here you are.'
  ],
  idle_hub: [
    'I can do this all day. Sit here. Not talk. It is, like, a skill.',
    'You okay? You are very quiet. It is fine. I am quiet too sometimes. Mostly I am not.',
    'Click on something, bitch. The radio has opinions. The plant has regrets.',
    'The blueprint is right there. It is not going to build itself. Well, it might. Do not tell it.',
    'Hello? Is this thing on? Am I talking to myself again? That is, like, step one.',
    'I made tea once. It was bad. I am telling you in case you were hoping for tea.'
  ],
  /* clicking him */
  talk: [
    'Yo. You know what is crazy? Nobody asked me anything for like a year. Now it is all questions, bitch.',
    'Alaska is mostly just white. Like, everything. I kept looking for a color. Any color. A bush.',
    'I drove here with a hundred bucks and a bad idea. This is the bad idea. Pull up a crate, bitch.',
    'People think the hard part is the science. The hard part is the neighbors, bitch. The neighbors never sleep.',
    'You ever have a car that just feels like yours? The El Camino feels like mine. Do not tell Skinny Pete.',
    'I am trying to be a better guy. That includes, uh, not blowing up the street. Day one, still going.',
    'Nobody is blowing up anything. It is a fountain. A very, very loud fountain, bitch. Write that down.',
    'Mr. White would hate this shed. He would also fix the shelves. That is the thing about him.',
    'Sit down, bitch. The shed does not bite. The gnome might.',
    'I used to think freedom was money. Turns out freedom is a door that opens from the inside. Weird.',
    'I had a plant once. Different plant, different life. It died. Everything dies, bitch, but it is okay.',
    'Badger says the van guy is legit. Badger also says he saw a ghost in a Denny. Take it how you want.',
    'Do not look at the radio. The radio is a whole mood.',
    'If anybody asks, we are doing a community garden. Tight. Very green. Very, very green, bitch.',
    'I do not even like parts. I like when parts turn into a thing. That is the whole deal, bitch.',
    'You know what is sketchy? Everything. Everything is sketchy. That is how you know it is working.',
    'I made a list in my head of people I owe. It is a long list. It is mostly hugs, bitch.',
    'Mrs. Pickles has been at that window forever. I think she is part of the house now.',
    'The tax guy has a briefcase. Nobody knows what is in it. I think it is just more briefcases.',
    'I want to build one thing that does not hurt anybody. This is that thing. Probably. Seriously, bitch.',
    'Thanks for the blueprint. Seriously. Who even draws a blueprint? You, bitch. You do.',
    'I slept in a car for a week once. Now I have a shed. I am basically a landlord.',
    'Be careful, okay? Not careful careful. Normal careful. Like, look both ways, bitch.',
    'The gnome is not a threat. The gnome is a tool. Respect the gnome.',
    'Cold is fine. Cold is honest. It is the hot that lies to you, bitch.',
    'If you hear a honk, that is not me. That is the goose. I am not a goose guy. Okay, I am a goose guy.',
    'I used to say yeah, science. Now I just say yeah. It is shorter. It is also, like, growth, bitch.',
    'You are good at this. Like, weirdly good. Do not tell the neighbors.',
    'A wise man once said: do not stand in the red. That was me. Just now. Hi.',
    'Everybody wants a big thing. The big thing is a lot of small things, bitch. You carry one at a time.',
    'I keep waiting for something to go wrong. Then I remember it is a garden. It is just a garden.',
    'Tell me the truth. Is the shed sketchy? It is sketchy. I knew it. Do not lie to me, bitch.',
    'I miss my friends. Is that weird? I miss my friends and my bad habits and, like, a few of the good ones.',
    'My aunt says do something with your hands. This is me doing something with my hands. Hi, Aunt, bitch.',
    'It is the wiring. It is always the wiring. I do not even know what that means.',
    'I am not saying luck is real. I am saying I found a spoon today. Draw your own conclusions, bitch.',
    'One time I got lost in a parking garage for two hours. This is the same energy.',
    'You want the secret? There is no secret. You show up and carry the spoon, bitch.',
    'Do you ever just stand in a shed and think, how did I get here? Same. Every day. Good shed though.',
    'I like the quiet. The quiet used to scare me. Now it is like a roommate who never touches my stuff.',
    'Okay but real talk, thank you. For showing up. That is a big thing, bitch. Do not make it weird.',
    'Why is every bad idea easier with a friend? Asking for me. Asking for a me.',
    'I do not need anybody to say I am good. But if you want to, bitch, I would not stop you.',
    'If you see the van, do not buy anything with a face on it. That is the whole rule.',
    'I used to be scared of what was behind me. Now I watch the road. It is a better view, bitch.'
  ],
  /* the things on the walls */
  blueprint: [
    'That is the plan. It is blue. It has lines. It might be upside down. Do not say anything.',
    'Okay, bitch, you want a level? Pick one. They get worse. That is how plans work.',
    'The blueprint says the Thing goes in the shed. It does not say how. That is the fun part.',
    'I looked at this thing for an hour and I understood one square. It was the shed. Good start, bitch.'
  ],
  radio: [
    'That is the radio. It gets one station. It is just a guy saying numbers. I love him.',
    'Do not touch the dial. The dial is, like, emotionally connected to the shed.',
    'Yeah, bitch! Turn it up! No. Not that much. The neighbors. Down, down, down.',
    'It plays one song. Always the same one. I know all the words. There are no words.',
    'It is not broken. It is just very sure of itself.',
    'There was a song on it in Alaska. I do not remember the name. I remember the road.'
  ],
  calendar: [
    'The calendar stopped at a day I do not want to talk about. I have not turned it. Do not turn it.',
    'It says the month with a picture of a lake. I have never seen that lake. I would like to.',
    'Every day on there is a circle. I do not know why I circled them. Do not ask, bitch.',
    'Somebody drew a smile on the fifteenth. It was me. I was having a good day.'
  ],
  keys: [
    'The keys to the car. The car is outside. The car is the only thing in my life that always starts.',
    'Yo, do not touch the keys. I am not mad. I am superstitious. It is a legal thing, bitch.',
    'One key for the car and one key for nothing. I keep the one for nothing. It is my favorite.',
    'I could leave anytime. That is the keys saying it. I just choose the shed, bitch. Today.'
  ],
  plant: [
    'That is Gary. He is a plant. He is doing his best and so am I, bitch.',
    'Do not water Gary. Gary has been watered. Gary is just dramatic.',
    'I talk to Gary. He does not talk back, which makes him my best friend.',
    'Gary and I have an understanding. I do not look at him when he droops.'
  ]
};
