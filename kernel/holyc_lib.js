/* HolyC's library: Print's format, the constants every program may name, and the builtins that need nothing from the machine (the ones that
   do — Beep, Rand, GodWord... — are added by holyc.js, and the lab's stage adds its own). Pure. A builtin is `(args, io) => value`,
   `io` being `{ emit, hooks }`. */
export function hcFormat(fmt, args) {
  let i = 0;
  return String(fmt).replace(/%(-?)(\d*)(?:\.(\d+))?([dsfxXcb%])/g, (m, left, width, prec, k) => {
    if (k === '%') return '%';
    const v = args[i++];
    let s;
    if (k === 'd') s = String(Math.trunc(Number(v) || 0));
    else if (k === 'f') s = Number(v || 0).toFixed(prec === undefined ? 6 : +prec);
    else if (k === 'x') s = (Math.trunc(Number(v) || 0) >>> 0).toString(16);
    else if (k === 'X') s = (Math.trunc(Number(v) || 0) >>> 0).toString(16).toUpperCase();
    else if (k === 'b') s = (Math.trunc(Number(v) || 0) >>> 0).toString(2);
    else if (k === 'c') s = String.fromCharCode(Number(v) || 32);
    else s = String(v == null ? '' : v);
    if (width && s.length < +width) s = left ? s.padEnd(+width) : (k === 'd' && /^\d+$/.test(width) && width[0] === '0' ? s.padStart(+width, '0') : s.padStart(+width));
    return s;
  });
}

/* the sixteen colours of the machine, by the names TempleOS gives them (and the numbers it gives them) */
export const COLORS = ['BLACK', 'BLUE', 'GREEN', 'CYAN', 'RED', 'PURPLE', 'BROWN', 'LTGRAY', 'DKGRAY', 'LTBLUE', 'LTGREEN', 'LTCYAN', 'LTRED', 'LTPURPLE', 'YELLOW', 'WHITE'];
export const CONSTANTS = { TRUE: 1, FALSE: 0, NULL: 0, ON: 1, OFF: 0, PI: Math.PI };
COLORS.forEach((c, i) => { CONSTANTS[c] = i; });

const num = v => Number(v) || 0;
export const PURE = {
  Print: (a, io) => { io.emit(hcFormat(a[0], a.slice(1))); return 0; },
  PutS:  (a, io) => { io.emit(String(a[0])); return 0; },
  Sleep: a => Math.trunc(num(a[0])),                                    /* time does not pass in here */
  StrLen: a => String(a[0] == null ? '' : a[0]).length,
  ToUpper: a => typeof a[0] === 'number' ? String.fromCharCode(a[0]).toUpperCase().charCodeAt(0) : String(a[0] == null ? '' : a[0]).toUpperCase(),
  ToLower: a => String(a[0] == null ? '' : a[0]).toLowerCase(),
  Abs: a => Math.abs(num(a[0])),
  Min: a => Math.min(num(a[0]), num(a[1])),
  Max: a => Math.max(num(a[0]), num(a[1])),
  Sqrt: a => Math.sqrt(num(a[0])),
  Pow: a => Math.pow(num(a[0]), num(a[1])),
  Sin: a => Math.sin(num(a[0])),
  Cos: a => Math.cos(num(a[0])),
  Floor: a => Math.floor(num(a[0])),
  Ceil: a => Math.ceil(num(a[0])),
  Round: a => Math.round(num(a[0])),
  MemSet: (a, io) => { io.emit('MemSet(' + (a[0] == null ? 'SCREEN' : a[0]) + ', ' + (a[1] | 0) + ', ' + (a[2] | 0) + ')\n'); return 0; },
  /* Cd and Dir are the shell's: a program run from the terminal changes the terminal's folder and lists the real one (kernel/holyc_env.js is what they ask);
     run anywhere else they have no folder to change, and say so */
  Cd: (a, io) => {
    const p = a[0] == null ? '::' : String(a[0]);
    if (!io.hooks.cd) { io.emit('Cd("' + p + '")  (NO SHELL HERE TO MOVE)\n'); return 0; }
    const ok = io.hooks.cd(p);
    if (!ok) io.emit('PATH NOT FOUND: ' + p + '\n');
    return ok ? 1 : 0;
  },
  Dir: (a, io) => {
    const names = io.hooks.dirNames ? io.hooks.dirNames(a[0] == null ? undefined : String(a[0])) : [];
    io.emit((names && names.length ? names.join('  ') : '(NOTHING HERE)') + '\n');
    return names ? names.length : 0;
  }
};
