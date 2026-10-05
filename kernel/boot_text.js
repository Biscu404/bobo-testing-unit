/* What rolls up the screen during the last three seconds of the long boot
   (the one the machine does after eight hours away). Edit this file, nothing
   else: each entry is [style, text].  Styles:
     'h'  a heading, yellow        'y'  yellow          'c'  cyan
     'w'  white                    ''   the normal green
   Keep it to roughly a dozen lines: it is on screen for three seconds, and
   the last line is the one the crawl stops on. */
export const BIRTHDAY_TEXT = [
  ['h', '[ WHAT THIS MACHINE IS FOR ]'],
  ['',  'Lorem ipsum dolor sit amet, consectetur'],
  ['',  'adipiscing elit, sed do eiusmod tempor'],
  ['',  'incididunt ut labore et dolore magna aliqua.'],
  ['',  ''],
  ['h', '[ WHERE IT CAME FROM ]'],
  ['',  'Ut enim ad minim veniam, quis nostrud'],
  ['',  'exercitation ullamco laboris nisi ut aliquip'],
  ['',  'ex ea commodo consequat.'],
  ['',  ''],
  ['c', 'THIS IS A HAPPY BIRTHDAY GIFT FOR BOERU.'],
  ['',  ''],
  ['y', 'HAPPY BIRTHDAY, BOERU.']
];
