/* Which shelf a disc belongs on (pure: Node runs it in genre_check.js). The tag says what the file's own maker thought; when it says nothing, the words in the title, the
   album and the artist are read for the few things they give away (a soundtrack, a remix, a lo-fi tape). A disc nothing can place is left where it is, and the
   count of those is told, not hidden. Folder names are the machine's capitals, and the same genre always lands in the same folder, whatever the tag's spelling. */

/* in the order they are tried: the narrower before the broader, so "Heavy Metal" is not Rock and "J-Pop" is not Pop */
export const FAMILIES = [
  { name: 'J-POP', tint: 'cyan', re: /\bj[- ]?(pop|rock|idol)|city pop|shibuya|enka|kayokyoku|vocaloid|utaite|visual kei/ },
  { name: 'K-POP', tint: 'cyan', re: /\bk[- ]?(pop|rap|indie|rock|hip)|korean|trot\b/ },
  { name: 'SOUNDTRACKS', tint: 'green', re: /soundtrack|\bost\b|film score|movie|anime|video game|\bgame\b|chiptune|8[- ]?bit|musical|show ?tunes|score\b|trailer|cinematic/ },
  { name: 'METAL', tint: 'red', re: /metal|thrash|grindcore|deathcore|doom|sludge|hardcore/ },
  { name: 'PUNK', tint: 'red', re: /punk|ska[- ]punk|oi!/ },
  { name: 'ROCK', tint: 'red', re: /rock|grunge|indie|alternative|alt\.|britpop|shoegaze|emo\b|post[- ]|math|garage|psychedel|new wave|blues rock/ },
  { name: 'HIP-HOP', tint: 'amber', re: /hip[- ]?hop|\brap\b|trap\b|drill|grime|boom bap|phonk/ },
  { name: 'R&B & SOUL', tint: 'amber', re: /r ?& ?b|\brnb\b|soul|funk|motown|disco|neo[- ]soul|gospel/ },
  { name: 'ELECTRONIC', tint: 'cyan', re: /electro|techno|house|trance|\bedm\b|dubstep|drum ?(and|&|n) ?bass|\bdnb\b|\bidm\b|synth|wave\b|rave|jungle|breakbeat|trip[- ]hop|downtempo|ambient|industrial|dance|club|eurodance|goa|vapor|dub\b/ },
  { name: 'CHILL', tint: 'white', re: /lo[- ]?fi|chill|study|relax|sleep|meditat|new age|easy listening|lounge|bossa/ },
  { name: 'JAZZ & BLUES', tint: 'amber', re: /jazz|blues|bebop|big band|swing|fusion|bossanova/ },
  { name: 'CLASSICAL', tint: 'white', re: /classical|orchestr|opera|symphon|baroque|chamber|sonata|concerto|choral|piano solo|romantic era|requiem/ },
  { name: 'FOLK & COUNTRY', tint: 'green', re: /folk|country|bluegrass|acoustic|singer[- ]songwriter|celtic|americana|western|roots/ },
  { name: 'WORLD & REGGAE', tint: 'green', re: /reggae|ska\b|\bdub\b|latin|salsa|world|afro|flamenco|samba|tango|ethnic|tribal|polka|cumbia|bhangra/ },
  { name: 'POP', tint: 'amber', re: /pop|top 40|teen|bubblegum|schlager/ },
  { name: 'SPOKEN', tint: 'white', re: /podcast|audiobook|speech|spoken|comedy|humou?r|radio|interview|lecture/ }
];

const fold = s => String(s || '').normalize('NFKC').toLowerCase();

/* a genre tag, or any words, read as a family; null when nothing in them is known */
export function familyOf(words) {
  const w = fold(words);
  if (!w.trim()) return null;
  return FAMILIES.find(f => f.re.test(w)) || null;
}

/* words that give a disc away when it carries no genre */
const HINTS = [
  [/soundtrack|\bost\b|original score|theme from|\bopening\b|\bending\b/, 'SOUNDTRACKS'],
  [/lo-?fi|chillhop|chill beats/, 'CHILL'],
  [/remix|club mix|extended mix|\bvip\b|bootleg|nightcore|\bedit\)/, 'ELECTRONIC'],
  [/symphony|concerto|sonata|\bop\. ?\d|nocturne|prelude|etude|requiem/, 'CLASSICAL'],
  [/podcast|audiobook|chapter \d|episode \d/, 'SPOKEN']
];

/* where one disc belongs: { name, tint, why } with why = 'tag' | 'words', or null */
export function guess(t) {
  const g = familyOf(t.genre);
  if (g) return { name: g.name, tint: g.tint, why: 'tag' };
  const hay = fold([t.name, t.album, t.artist, t.file].join(' | '));
  for (const [re, name] of HINTS) if (re.test(hay)) { const f = FAMILIES.find(x => x.name === name); return { name, tint: f ? f.tint : 'white', why: 'words' }; }
  return null;
}

/* the whole job for a set of discs (their indices into `list`): { moves: [{ i, name, tint, why }], folders: [{ name, tint, count }], left: [i] } */
export function plan(list, idxs) {
  const moves = [], left = [], by = new Map();
  idxs.forEach(i => {
    const t = list[i]; if (!t) return;
    const g = guess(t);
    if (!g) { left.push(i); return; }
    moves.push({ i, name: g.name, tint: g.tint, why: g.why });
    const f = by.get(g.name) || { name: g.name, tint: g.tint, count: 0 }; f.count++; by.set(g.name, f);
  });
  return { moves, folders: [...by.values()].sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1)), left };
}
