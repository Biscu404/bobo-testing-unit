/* node apps/hifi/genre_check.js -- sorting discs onto genre shelves (pure Node). The same genre lands on the same shelf however a tag spells it, the narrower family wins over the
   broader, words stand in only when there is no tag, and a disc nothing can place is left (and counted). */
import { familyOf, guess, plan, FAMILIES } from './genre.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const fam = g => { const f = familyOf(g); return f ? f.name : null; };

const CASES = [
  ['Rock', 'ROCK'], ['Classic Rock', 'ROCK'], ['Indie Rock', 'ROCK'], ['Post-Punk', 'PUNK'], ['Grunge', 'ROCK'], ['Alternative', 'ROCK'], ['AlternRock', 'ROCK'], ['Progressive Rock', 'ROCK'],
  ['Heavy Metal', 'METAL'], ['Death Metal', 'METAL'], ['Thrash Metal', 'METAL'], ['Black Metal', 'METAL'], ['Punk', 'PUNK'], ['Punk Rock', 'PUNK'],
  ['Pop', 'POP'], ['Synthpop', 'ELECTRONIC'], ['Pop-Folk', 'FOLK & COUNTRY'], ['Top 40', 'POP'], ['J-Pop', 'J-POP'], ['JPop', 'J-POP'], ['J-Rock', 'J-POP'], ['City Pop', 'J-POP'], ['K-Pop', 'K-POP'], ['KPOP', 'K-POP'],
  ['Hip-Hop', 'HIP-HOP'], ['Hip Hop', 'HIP-HOP'], ['Rap', 'HIP-HOP'], ['Trap', 'HIP-HOP'], ['R&B', 'R&B & SOUL'], ['Soul', 'R&B & SOUL'], ['Funk', 'R&B & SOUL'], ['Disco', 'R&B & SOUL'],
  ['Electronic', 'ELECTRONIC'], ['Techno', 'ELECTRONIC'], ['House', 'ELECTRONIC'], ['Drum & Bass', 'ELECTRONIC'], ['Trance', 'ELECTRONIC'], ['Ambient', 'ELECTRONIC'], ['Eurodance', 'ELECTRONIC'], ['Trip-Hop', 'ELECTRONIC'],
  ['Lo-Fi', 'CHILL'], ['Chillhop', 'CHILL'], ['Jazz', 'JAZZ & BLUES'], ['Blues', 'JAZZ & BLUES'], ['Acid Jazz', 'JAZZ & BLUES'], ['Classical', 'CLASSICAL'], ['Opera', 'CLASSICAL'], ['Symphony', 'CLASSICAL'],
  ['Folk', 'FOLK & COUNTRY'], ['Country', 'FOLK & COUNTRY'], ['Bluegrass', 'FOLK & COUNTRY'], ['Celtic', 'FOLK & COUNTRY'], ['Reggae', 'WORLD & REGGAE'], ['Ska', 'WORLD & REGGAE'], ['Latin', 'WORLD & REGGAE'],
  ['Soundtrack', 'SOUNDTRACKS'], ['Anime', 'SOUNDTRACKS'], ['Game', 'SOUNDTRACKS'], ['Video Game Music', 'SOUNDTRACKS'], ['Musical', 'SOUNDTRACKS'], ['Podcast', 'SPOKEN'], ['Speech', 'SPOKEN'], ['Comedy', 'SPOKEN'],
  ['ロック', null], ['', null], ['Other', null], ['Blorp', null]
];
CASES.forEach(([g, want]) => ok(fam(g) === want, 'genre "' + g + '" is shelved under ' + want + ', not ' + fam(g)));
ok(FAMILIES.every(f => f.name.length <= 18 && f.name === f.name.toUpperCase()), 'every shelf name is short and in capitals');
ok(new Set(FAMILIES.map(f => f.name)).size === FAMILIES.length, 'no two families have the same name');
ok(fam('ＲＯＣＫ') === 'ROCK', 'full-width letters are read as the same letters');

/* words stand in only when there is no genre tag */
ok(guess({ name: 'Opening Theme (TV Size)', genre: '', album: 'Some Anime OST' }).name === 'SOUNDTRACKS', 'an OST in the album is a soundtrack');
ok(guess({ name: 'Rain (lofi remix)', genre: '' }).name === 'CHILL', 'lofi in the title is CHILL (the first hint wins)');
ok(guess({ name: 'Rain (club mix)', genre: '' }).name === 'ELECTRONIC', 'a club mix is electronic');
ok(guess({ name: 'Piano Concerto No. 2', genre: '' }).name === 'CLASSICAL', 'a concerto is classical');
ok(guess({ name: 'Rain (club mix)', genre: 'Jazz' }).name === 'JAZZ & BLUES', 'a tag beats the words in the title');
ok(guess({ name: 'Untitled 3', genre: '', album: '', artist: 'Someone' }) === null, 'nothing to go on is nothing');
ok(guess({ name: '夜に駆ける', genre: '', album: '', artist: 'YOASOBI' }) === null, 'a Japanese title with no tag is left alone (no guessing from the script)');
ok(guess({ name: 'x', genre: 'J-Pop' }).why === 'tag' && guess({ name: 'ost', genre: '' }).why === 'words', 'the reason is told');

/* a whole shelf */
const list = [{ name: 'a', genre: 'Rock' }, { name: 'b', genre: 'Hard Rock' }, { name: 'c', genre: 'Techno' }, { name: 'd', genre: '' }, { name: 'e', genre: 'J-Pop' }, { name: 'f', genre: 'Blorp' }, { name: 'g', genre: 'Rock' }];
const p = plan(list, [0, 1, 2, 3, 4, 5, 6]);
ok(p.moves.length === 5 && p.left.join() === '3,5', 'five placed, the two it cannot place are left: ' + p.left);
ok(p.folders[0].name === 'ROCK' && p.folders[0].count === 3, 'the biggest shelf is first');
ok(plan(list, [3]).moves.length === 0 && plan(list, [99]).left.length === 0, 'an index that is not there is not a disc');
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
