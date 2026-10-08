/* Programs to start the workshop from, and the reference card. The check runs every template and makes sure it neither fails nor is empty. */
export const TEMPLATES = [
  { id: 'blank', name: 'BLANK', code: '// your program\n' },
  { id: 'counter', name: 'COUNTER', code: 'I64 n = 0;\nI64 shown = Label("0");\nColor(shown, YELLOW);\nU0 Add()\n{\n  n++;\n  SetText(shown, n);\n  Beep;\n}\nButton("+1", "Add");\n' },
  { id: 'greeter', name: 'GREETER', code: 'I64 name = Field("YOUR NAME");\nI64 reply = Label("TYPE YOUR NAME AND PRESS THE BUTTON");\nU0 Greet()\n{\n  SetText(reply, "HELLO, " + ToUpper(GetText(name)) + ". THE LORD LOVES YOU.");\n}\nButton("GREET", "Greet");\n' },
  { id: 'dice', name: 'DICE', code: 'I64 shown = Label("-");\nColor(shown, LTGREEN);\nU0 Roll()\n{\n  SetText(shown, RandU16() % 6 + 1);\n  Beep;\n}\nButton("ROLL", "Roll");\n' },
  { id: 'sketch', name: 'SKETCH', code: 'I64 cx = 8; I64 cy = 8; I64 colour = WHITE;\nU0 Show() { Pixel(cx, cy, colour); }\nU0 Left() { if (cx > 0) cx--; Show; }\nU0 Right() { if (cx < 15) cx++; Show; }\nU0 Up() { if (cy > 0) cy--; Show; }\nU0 Down() { if (cy < 15) cy++; Show; }\nU0 Next() { colour = (colour + 1) % 16; Show; }\nButton("LEFT", "Left"); Button("RIGHT", "Right");\nButton("UP", "Up"); Button("DOWN", "Down");\nButton("COLOUR", "Next");\nShow;\n' },
  { id: 'melody', name: 'MELODY', code: '// a tune from a loop: it climbs, and falls back\nfor (I64 i = 0; i < 8; i++)\n  Note(60 + i * 2, 160);\nfor (I64 i = 7; i >= 0; i--)\n  Note(60 + i * 2, 160);\n' },
  { id: 'clock', name: 'CLOCK', code: 'I64 secs = 0;\nI64 shown = Label("0");\nU0 Tick()\n{\n  secs++;\n  SetText(shown, secs);\n}\nEvery(1000, "Tick");\n' }
];

export const REFERENCE = [
  ['PRINT', '"words %d %s\\n", number, words;   Print(...)'],
  ['TYPES', 'I64 whole   F64 fraction   U8 *words   Bool   U0 nothing'],
  ['IF/LOOP', 'if else   for (...)   while   do while   break   continue'],
  ['STAGE', 'Label(text)   Button(text, "Function")   Field(hint)   Bar(max)'],
  ['CHANGE', 'SetText(id, v)  GetText(id)  GetNum(id)  SetBar(id, v)  Color(id, c)'],
  ['BOARD', 'Pixel(x, y, colour)   Fill(colour)   Clear()      16 x 16'],
  ['SOUND', 'Note(60, 300)   Rest(ms)   Beep      60 = middle C'],
  ['TIME', 'Every(1000, "Function")   Stop(id)'],
  ['MATH', 'Abs Min Max Sqrt Pow Floor Ceil Round   Rand()   RandU16()'],
  ['COLOURS', 'BLACK BLUE GREEN CYAN RED PURPLE BROWN LTGRAY DKGRAY LTBLUE LTGREEN LTCYAN LTRED LTPURPLE YELLOW WHITE']
];
