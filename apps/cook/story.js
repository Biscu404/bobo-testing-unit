/* The story of The Cook, in the order it happened.
   Thirteen chapters and an ending: the plot of Breaking Bad told straight, names and all. They used to be ten, shown one before each
   bench from the second on, which put the batch before the man who was cooking it with Walt and Jane's death after Gus's laundry.
   Now (1) the order is the order of the show, (2) STORY_AT says which cards are read before which bench, so the first three (the
   diagnosis, Jesse, the first batch) are read before the first bench and nobody cooks with a man they have not met, and (3) the
   bench a card sits in front of is the bench it is about where it can be (the ruin before THE RUIN, the blue before THE BLUE).
   A card is four or five lines under 60 characters, so it is read and not skipped. `sc` is the picture behind it (drawn by scene()
   in index.js). `node apps/cook/cook_check.js` holds the lengths, the order and the mapping. */
export const CK_STORY = [
  { sc: 'class', t: 'THE DIAGNOSIS',
    l: ['Walter White teaches high-school chemistry in Albuquerque',
        'and washes cars on the side. He is brilliant and broke.',
        'Then a doctor tells him he has stage 3 lung cancer.',
        'Months to live, a baby on the way, and nothing to leave.'] },
  { sc: 'rv', t: 'JESSE PINKMAN',
    l: ['Riding along on a DEA raid with his brother-in-law Hank,',
        'Walt sees a former student flee the house: Jesse Pinkman,',
        'a small-time meth dealer. Walt tracks him down and offers',
        'a deal: Walt cooks, Jesse sells, and they split the money.'] },
  { sc: 'desert', t: 'THE FIRST BATCH',
    l: ['They cook in a beat-up RV in the New Mexico desert.',
        'Walt\'s meth is 99.1% pure. Nothing else comes close.',
        'Two rival dealers try to kill them. Walt kills both,',
        'and learns what he is capable of.'] },
  { sc: 'glass', t: 'THE GLASSWARE',
    l: ['The RV is no lab. Walt wants proper glassware, so he',
        'takes what he needs from the school chemistry room and',
        'carries it out in a duffel bag. Jesse holds the door and',
        'asks why a man with a job is stealing flasks.'] },
  { sc: 'meet', t: 'HEISENBERG',
    l: ['Their first buyer, the cartel dealer Tuco, beats Jesse up.',
        'Walt walks in alone, says his name is Heisenberg, and',
        'blows up the room with a fake crystal of explosives.',
        'Tuco pays up. Walt has found out he likes being feared.'] },
  { sc: 'badge', t: 'THE BROTHER-IN-LAW',
    l: ['Hank hunts Heisenberg for years, never guessing it is',
        'the man passing him the potatoes at family dinner.',
        'Walt lies to his wife Skyler about everything: the money,',
        'the late nights, the second phone.'] },
  { sc: 'blue', t: 'THE BLUE',
    l: ['The blue meth is the purest on earth. Everyone wants it.',
        'Saul Goodman, a sleazy lawyer, helps them launder cash.',
        'Gus Fring, a chicken-restaurant owner who secretly runs',
        'the drug trade in the Southwest, takes notice.'] },
  { sc: 'car', t: 'JANE',
    l: ['Jesse falls for Jane, his landlord and a recovering addict.',
        'Together they start using again. Jane blackmails Walt',
        'into paying Jesse his share. Then she chokes in her sleep,',
        'and Walt stands there and lets her die.'] },
  { sc: 'lab', t: 'THE LAUNDRY',
    l: ['Gus gives Walt a superlab under an industrial laundry',
        'and $3 million for three months. Real equipment, real',
        'respect. But Gus is already training a replacement,',
        'and he does not mean for Walt to be needed for long.'] },
  { sc: 'blast', t: 'FACE OFF',
    l: ['Walt poisons a child to turn Jesse against Gus. It works.',
        'Then he rigs a bomb to the wheelchair of an old enemy',
        'in a nursing home. Gus steps out of the room, straightens',
        'his tie, and the bomb goes off.'] },
  { sc: 'book', t: 'THE BOOK',
    l: ['Walt retires with $80 million, too much to count.',
        'Skyler launders it through a car wash. Then Hank finds a',
        'book of poems in Walt\'s bathroom, signed by a dead lab',
        'partner, and he knows who Heisenberg is.'] },
  { sc: 'hole', t: 'THE DESERT AGAIN',
    l: ['Jesse learns Walt poisoned a child and goes to burn down',
        'his house. Then he helps Hank corner Walt in the desert.',
        'Walt offers $80 million for Hank\'s life, but the gang he',
        'once hired shoots Hank anyway, takes the money, and',
        'makes Jesse their slave cook.'] },
  { sc: 'empty', t: 'ONE LAST TIME',
    l: ['Dying in hiding, Walt drives back to Albuquerque.',
        'He says goodbye to his family and rigs a machine gun',
        'in his trunk. He kills the gang, frees Jesse, and is shot.',
        'He dies on the floor of a meth lab, touching the steel.'] }
];
export const CK_END = {
  t: '99.1%',
  l: ['Walt finally tells Skyler the truth:',
      '',
      '"I did it for me. I liked it. I was good at it.',
      ' And I was really — I was alive."',
      '',
      'The last batch is the cleanest thing he ever made.']
};
/* which cards are read before which bench (cards are numbered from 0 in CK_STORY; bench 1 is the first) */
export const STORY_AT = { 1: [0, 1, 2], 2: [3], 3: [4], 4: [5], 5: [6], 6: [7], 7: [8], 8: [9], 9: [10], 10: [11, 12] };
/* the cards a bench still owes you, given the ones already read (an index set) */
export const owed = (level, seen) => (STORY_AT[level] || []).filter(i => !seen[i]);
