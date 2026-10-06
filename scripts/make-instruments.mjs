#!/usr/bin/env node
/* Builds assets/instruments/: the real instrument sounds the Garage plays.

   The sounds are samples of real instruments from the FluidR3_GM soundfont
   (Frank Wen, MIT licence: see assets/instruments/LICENSE.txt), fetched from
   the MIDI.js soundfont mirror, plus the drum kit's pieces from the WebAudioFont
   mirror of the same soundfont. For each instrument it keeps a handful of notes
   (one every few semitones: the sampler bends the gap), trims them, finds a
   seamless loop for the ones that are meant to be held (strings, winds, organ,
   choir), measures how loud it is so every instrument can be brought to the same
   level, and packs the lot into one file per instrument plus a manifest.

   This is a build step you run once, with a network and ffmpeg; the app itself
   never touches a network and only ships the result.

     node scripts/make-instruments.mjs [id ...]        (all of them, or just those ids) */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets', 'instruments');
const CACHE = process.env.SF_CACHE || join(ROOT, 'node_modules', '.cache', 'soundfont');
mkdirSync(OUT, { recursive: true }); mkdirSync(CACHE, { recursive: true });
const SR = 32000;

/* id, name, soundfont file, lowest, highest, step (MIDI numbers), 'pluck' dies away by itself, 'hold' is looped, seconds kept, family */
const I = [
  ['piano', 'GRAND PIANO', 'acoustic_grand_piano', 36, 96, 4, 'pluck', 3.0, 'KEYS'],
  ['epiano', 'ELECTRIC PIANO', 'electric_piano_1', 36, 96, 4, 'pluck', 2.6, 'KEYS'],
  ['harpsichord', 'HARPSICHORD', 'harpsichord', 36, 93, 4, 'pluck', 2.0, 'KEYS'],
  ['organ', 'CHURCH ORGAN', 'church_organ', 36, 96, 5, 'hold', 3.0, 'KEYS'],
  ['musicbox', 'MUSIC BOX', 'music_box', 60, 108, 4, 'pluck', 2.4, 'MALLETS'],
  ['marimba', 'MARIMBA', 'marimba', 36, 96, 4, 'pluck', 1.8, 'MALLETS'],
  ['xylophone', 'XYLOPHONE', 'xylophone', 60, 108, 4, 'pluck', 1.2, 'MALLETS'],
  ['vibes', 'VIBRAPHONE', 'vibraphone', 48, 96, 4, 'pluck', 2.8, 'MALLETS'],
  ['glock', 'GLOCKENSPIEL', 'glockenspiel', 72, 108, 4, 'pluck', 2.2, 'MALLETS'],
  ['steeldrum', 'STEEL DRUM', 'steel_drums', 48, 96, 4, 'pluck', 2.0, 'MALLETS'],
  ['kalimba', 'KALIMBA', 'kalimba', 55, 96, 4, 'pluck', 2.0, 'MALLETS'],
  ['nylon', 'NYLON GUITAR', 'acoustic_guitar_nylon', 40, 88, 4, 'pluck', 2.5, 'GUITARS'],
  ['steelgtr', 'STEEL GUITAR', 'acoustic_guitar_steel', 40, 88, 4, 'pluck', 2.5, 'GUITARS'],
  ['eguitar', 'ELECTRIC GUITAR', 'electric_guitar_clean', 40, 88, 4, 'pluck', 2.5, 'GUITARS'],
  ['harp', 'HARP', 'orchestral_harp', 36, 100, 5, 'pluck', 3.0, 'GUITARS'],
  ['pizz', 'PIZZICATO', 'pizzicato_strings', 36, 96, 5, 'pluck', 1.2, 'GUITARS'],
  ['bass', 'ELECTRIC BASS', 'electric_bass_finger', 28, 67, 4, 'pluck', 2.0, 'BASS'],
  ['upright', 'UPRIGHT BASS', 'acoustic_bass', 28, 67, 4, 'pluck', 2.0, 'BASS'],
  ['violin', 'VIOLIN', 'violin', 55, 100, 4, 'hold', 3.0, 'STRINGS'],
  ['cello', 'CELLO', 'cello', 36, 81, 4, 'hold', 3.0, 'STRINGS'],
  ['strings', 'STRING SECTION', 'string_ensemble_1', 36, 96, 5, 'hold', 3.0, 'STRINGS'],
  ['flute', 'FLUTE', 'flute', 60, 96, 4, 'hold', 3.0, 'WINDS'],
  ['clarinet', 'CLARINET', 'clarinet', 50, 91, 4, 'hold', 3.0, 'WINDS'],
  ['trumpet', 'TRUMPET', 'trumpet', 55, 86, 4, 'hold', 3.0, 'WINDS'],
  ['sax', 'SAXOPHONE', 'alto_sax', 49, 81, 4, 'hold', 3.0, 'WINDS'],
  ['ocarina', 'OCARINA', 'ocarina', 60, 96, 5, 'hold', 2.6, 'WINDS'],
  ['choir', 'CHOIR', 'choir_aahs', 48, 84, 4, 'hold', 3.0, 'VOICES'],
  ['bells', 'TUBULAR BELLS', 'tubular_bells', 55, 91, 5, 'pluck', 3.0, 'FUN'],
  ['timpani', 'TIMPANI', 'timpani', 36, 60, 4, 'pluck', 2.0, 'FUN'],
  ['woodblock', 'WOOD BLOCK', 'woodblock', 60, 84, 6, 'pluck', 0.7, 'FUN']
];
/* the kit: key, name, General MIDI note, seconds kept */
const KIT = [['kick', 'KICK', 36, 0.9], ['snare', 'SNARE', 38, 0.8], ['stick', 'STICK', 37, 0.4], ['clap', 'CLAP', 39, 0.7],
  ['hat', 'HI-HAT', 42, 0.35], ['openhat', 'OPEN HAT', 46, 1.1], ['lotom', 'LOW TOM', 41, 1.0], ['midtom', 'MID TOM', 45, 0.9],
  ['hitom', 'HIGH TOM', 48, 0.8], ['crash', 'CRASH', 49, 2.2], ['ride', 'RIDE', 51, 1.8], ['cowbell', 'COWBELL', 56, 0.8],
  ['tamb', 'TAMBOURINE', 54, 0.9], ['shaker', 'SHAKER', 70, 0.5]];

const NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteName = n => NAMES[n % 12] + (Math.floor(n / 12) - 1);

async function fetchText(url, file) {
  const p = join(CACHE, file);
  if (existsSync(p)) return readFileSync(p, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  const t = await res.text();
  writeFileSync(p, t);
  return t;
}
const ff = (args, input) => {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { input, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('ffmpeg: ' + r.stderr.toString());
  return r.stdout;
};
/* mono PCM at SR, as floats */
const pcm = (buf, dur) => {
  const raw = ff(['-i', 'pipe:0', '-t', String(dur), '-ac', '1', '-ar', String(SR), '-f', 'f32le', 'pipe:1'], buf);
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
};
const rms = (x, a, b) => { let s = 0; for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)); };

/* a loop that does not click: a whole number of periods, starting and ending where the wave agrees with itself */
function findLoop(x, midi, dur) {
  const f0 = 440 * Math.pow(2, (midi - 69) / 12), P0 = SR / f0;
  const t0 = Math.floor(SR * 0.9), want = Math.floor(SR * 0.55);
  const lim = Math.min(x.length - SR * 0.4, SR * (dur - 0.45));
  let best = null;
  for (let ls = t0; ls < t0 + SR * 0.25; ls++) {
    if (!(x[ls - 1] <= 0 && x[ls] > 0)) continue;                    /* rising zero crossing */
    for (let le = ls + want - Math.floor(P0 * 3); le < ls + want + Math.floor(P0 * 3); le++) {
      if (le > lim || !(x[le - 1] <= 0 && x[le] > 0)) continue;
      let d = 0;
      for (let i = 0; i < 160; i++) { const e = x[ls + i] - x[le + i]; d += e * e; }
      if (!best || d < best.d) best = { ls, le, d };
    }
  }
  return best && best.d < 0.5 ? [+(best.ls / SR).toFixed(5), +(best.le / SR).toFixed(5)] : null;
}

function encode(buf, dur, fade) {
  return ff(['-i', 'pipe:0', '-t', String(dur), '-af', 'afade=t=out:st=' + (dur - fade).toFixed(3) + ':d=' + fade, '-ac', '1', '-ar', String(SR),
    '-c:a', 'libvorbis', '-q:a', '1', '-f', 'ogg', 'pipe:1'], buf);
}

const only = process.argv.slice(2);
const manifest = { sr: SR, instruments: [] };
const prev = existsSync(join(OUT, 'index.json')) ? JSON.parse(readFileSync(join(OUT, 'index.json'), 'utf8')) : null;
if (prev && only.length) manifest.instruments = prev.instruments.filter(i => !only.includes(i.id));

for (const [id, name, file, lo, hi, step, kind, dur, family] of I) {
  if (only.length && !only.includes(id)) continue;
  process.stdout.write(id.padEnd(12));
  const src = await fetchText('https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/' + file + '-ogg.js', file + '.js');
  const bank = {};
  for (const m of src.matchAll(/"([A-G][b#]?\d)":\s*"data:audio\/ogg;base64,([A-Za-z0-9+/=]+)"/g)) bank[m[1]] = Buffer.from(m[2], 'base64');
  const parts = [], samples = [], levels = [];
  let off = 0;
  for (let n = lo; n <= hi; n += step) {
    const raw = bank[noteName(n)];
    if (!raw) continue;
    const px = pcm(raw, dur);
    levels.push(rms(px, Math.floor(SR * 0.05), Math.floor(SR * 0.6)));
    const loop = kind === 'hold' ? findLoop(px, n, dur) : null;
    const ogg = encode(raw, dur, kind === 'hold' ? 0.3 : Math.min(0.5, dur * 0.3));
    samples.push({ midi: n, off, len: ogg.length, loop });
    parts.push(ogg); off += ogg.length;
  }
  levels.sort((a, b) => a - b);
  const med = levels[Math.floor(levels.length / 2)] || 0.1;
  const gain = +Math.max(0.35, Math.min(4, 0.1 / med)).toFixed(3);
  writeFileSync(join(OUT, id + '.bin'), Buffer.concat(parts));
  manifest.instruments.push({ id, name, family, kind, gain, dur, samples });
  console.log(samples.length + ' notes, ' + (off / 1024).toFixed(0) + ' KB' + (kind === 'hold' ? ', loops ' + samples.filter(s => s.loop).length + '/' + samples.length : ''));
}

if (!only.length || only.includes('drums')) {
  process.stdout.write('drums'.padEnd(12));
  const parts = [], hits = [];
  let off = 0;
  for (const [key, name, note, dur] of KIT) {
    const src = await fetchText('https://surikov.github.io/webaudiofontdata/sound/128' + note + '_0_FluidR3_GM_sf2_file.js', 'drum' + note + '.js');
    const b64 = src.match(/file:'([A-Za-z0-9+/=]+)'/);
    if (!b64) { console.log('no sample for', key); continue; }
    const ogg = encode(Buffer.from(b64[1], 'base64'), dur, Math.min(0.2, dur * 0.4));
    hits.push({ key, name, midi: note, off, len: ogg.length, dur });
    parts.push(ogg); off += ogg.length;
  }
  writeFileSync(join(OUT, 'drums.bin'), Buffer.concat(parts));
  manifest.drums = { id: 'drums', name: 'DRUM KIT', family: 'DRUMS', gain: 1, hits };
  console.log(hits.length + ' pieces, ' + (off / 1024).toFixed(0) + ' KB');
} else if (prev && prev.drums) manifest.drums = prev.drums;

/* keep the manifest in the order above */
manifest.instruments.sort((a, b) => I.findIndex(r => r[0] === a.id) - I.findIndex(r => r[0] === b.id));
writeFileSync(join(OUT, 'index.json'), JSON.stringify(manifest));
console.log('wrote', manifest.instruments.length, 'instruments + drums');
