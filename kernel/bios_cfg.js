/* The BIOS setup's settings (pure: Node runs it in scripts/check-bios.mjs).

   Holding DEL while the machine is powering up opens SETUP (kernel/bios_ui.js), and the CMOS window is the same screen on the desktop. Every item on
   it does something the next power-on can be seen to do: nothing is there for show. The values are kept as an index into the item's list, in
   `templeos.bios.v1`, so a setting that is later given a fourth choice keeps meaning what it meant. */
export const KEY = 'templeos.bios.v1';

export const ITEMS = [
  { id: 'speaker', label: 'POST Speaker', values: ['ENABLED', 'DISABLED'], def: 0,
    help: 'The beeps, the fan and the drive that the machine makes while it counts memory. Disabled, POST is silent.' },
  { id: 'memtest', label: 'Memory Test', values: ['FULL', 'QUICK', 'OFF'], def: 0,
    help: 'FULL counts every K. QUICK counts in big steps. OFF trusts the 640K. A cold start after eight hours always runs the full count, bad block and all.' },
  { id: 'hold', label: 'POST Hold Screen', values: ['OFF', '3 SEC', '6 SEC', '10 SEC'], def: 0, secs: [0, 3, 6, 10],
    help: 'Wait on the BIOS screen before booting, for a hand that is slow to reach DEL. A countdown is shown.' },
  { id: 'reveal', label: 'Tube Warm-Up', values: ['WARM', 'INSTANT'], def: 0,
    help: 'WARM brings the temple up the way a tube does. INSTANT shows it at once.' }
];

export const PAGES = ['MAIN', 'ADVANCED', 'BOOT', 'EXIT'];

export const defaults = () => { const c = {}; ITEMS.forEach(i => { c[i.id] = i.def; }); return c; };

/* whatever was stored, mended into a config that is always whole and in range */
export function mend(raw) {
  const c = defaults();
  if (raw && typeof raw === 'object') ITEMS.forEach(i => { const v = raw[i.id]; if (Number.isInteger(v) && v >= 0 && v < i.values.length) c[i.id] = v; });
  return c;
}

export function load(store) {
  try { return mend(JSON.parse((store || localStorage).getItem(KEY) || 'null')); } catch (e) { return defaults(); }
}
export function save(cfg, store) {
  try { (store || localStorage).setItem(KEY, JSON.stringify(mend(cfg))); return true; } catch (e) { return false; }
}

export const item = id => ITEMS.find(i => i.id === id);
export const valueOf = (cfg, id) => { const it = item(id); return it.values[mend(cfg)[id]]; };
export const same = (a, b) => ITEMS.every(i => mend(a)[i.id] === mend(b)[i.id]);

/* what the next power-on does, read once per boot */
export function post(cfg) {
  const c = mend(cfg);
  return {
    speaker: c.speaker === 0,
    memtest: ['full', 'quick', 'off'][c.memtest],
    holdSecs: item('hold').secs[c.hold],
    warm: c.reveal === 0
  };
}

/* the memory count: how big a step it takes and how long it waits between steps, by setting. A long (cold) boot always counts fully. */
export function memSteps(mode, longBoot) {
  if (longBoot || mode === 'full') return { step: 40, tick: 28 };
  if (mode === 'quick') return { step: 190, tick: 20 };
  return null;
}

/* the line POST prints under the BIOS banner while it holds, and the digits of its countdown */
export const holdLine = left => 'POST HOLD  ' + (left > 0 ? 'BOOTING IN ' + left + '...' : 'BOOTING...');

/* the next value of an item, either way round (the list wraps) */
export function step(cfg, id, dir) {
  const it = item(id), c = mend(cfg), n = it.values.length;
  c[id] = (c[id] + (dir < 0 ? -1 : 1) + n) % n;
  return c;
}
