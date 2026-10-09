/* node apps/hifi/shelf_check.js -- the shelf as data (pure Node): folders of your own, moving several discs at once, putting them in the order you want, sorting the shelf, albums,
   picking with Ctrl and Shift, and finding the playing disc again after all of it. The pressed discs never move. */
import * as S from './shelf.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const mk = () => [
  { name: 'HYMN', builtin: true, folder: 'LOBBY MUSIC' }, { name: 'zebra', artist: 'Z', album: 'Stripes', no: 2, dur: 100, added: 5, plays: 0 }, { name: 'Apple', artist: 'B', album: 'Fruit', no: 1, dur: 300, added: 1, plays: 9 },
  { name: 'DUNE', builtin: true, folder: 'MAGEN' }, { name: 'mango', artist: 'B', album: 'Fruit', no: 2, dur: 200, added: 3, plays: 2 }, { name: '夜に駆ける', artist: 'YOASOBI', album: '', no: null, dur: 260, added: 4, plays: 5 }, { name: 'Zed', artist: 'Z', album: 'Stripes', no: 1, dur: 90, added: 2, plays: 1 }
];
const names = l => l.map(t => t.name).join(',');

/* folders */
ok(S.cleanDir('  my  /  rock\\mix ') === 'MY ROCK MIX', 'a folder name is tidied and put in capitals: ' + S.cleanDir('  my  /  rock\\mix '));
ok(S.cleanDir('x'.repeat(80)).length === S.DIR_MAX, 'and kept short');
ok(S.cleanDir('夜の曲') === '夜の曲', 'Japanese is a folder name');
const dirs = [{ name: 'ROCK', tint: 'red' }];
ok(S.dirError('', dirs, []) !== '' && S.dirError('rock', dirs, []) !== '' && S.dirError('Magen', dirs, ['MAGEN']) !== '' && S.dirError('shelf', dirs, []) !== '' && S.dirError('Jazz', dirs, ['MAGEN']) === '', 'a folder name must be new and not the shelf\'s own');
let L = mk();
ok(S.moveToDir(L, [0, 1, 2, 5], { name: 'ROCK', tint: 'red' }) === 3, 'three of four move: the pressed disc stays');
ok(L[0].folder === 'LOBBY MUSIC' && L[1].folder === 'ROCK' && L[1].folderTint === 'red', 'a disc knows its folder and its colour');
ok(S.moveToDir(L, [1], { name: 'ROCK', tint: 'red' }) === 0, 'putting a disc where it is moves nothing');
ok(S.moveToDir(L, [1, 2], null) === 2 && L[1].folder === null, 'discs go back on the shelf');
S.moveToDir(L, [1, 2], { name: 'A', tint: 'cyan' }); ok(S.dropDir(L, 'A') === 2 && L[1].folder === null, 'a folder that goes puts its discs back on the shelf');
S.renameDir(L, 'ROCK', 'GUITARS'); ok(L[5].folder === 'GUITARS', 'a renamed folder keeps its discs');

/* reorder */
L = mk(); let r = S.reorder(L, [6], 1);
ok(names(L) === 'HYMN,Zed,zebra,DUNE,Apple,mango,夜に駆ける', 'one disc moved to before another (the pressed discs keep their places): ' + names(L));
ok(r.map.get(6) === 1 && r.map.get(1) === 2 && r.map.get(2) === 4 && r.map.get(0) === 0 && r.map.get(3) === 3, 'the map says where everything went, and the pressed discs are where they were');
L = mk(); r = S.reorder(L, [2, 6], 5);
ok(names(L) === 'HYMN,zebra,mango,DUNE,Apple,Zed,夜に駆ける', 'two picked discs travel together, in the order they had: ' + names(L));
L = mk(); S.reorder(L, [1, 4], L.length);
ok(names(L) === 'HYMN,Apple,夜に駆ける,DUNE,Zed,zebra,mango', 'to the end: ' + names(L));
L = mk(); S.reorder(L, [0], 3); ok(names(L) === names(mk()), 'a pressed disc cannot be moved');
L = mk(); S.reorder(L, [2], 2); ok(names(L) === names(mk()), 'putting a disc before itself changes nothing');
L = mk(); r = S.shift(L, [4], -1); ok(names(L) === 'HYMN,zebra,mango,DUNE,Apple,夜に駆ける,Zed', 'one up past a pressed disc: ' + names(L));
L = mk(); S.shift(L, [1], -1); ok(names(L) === names(mk()), 'the first disc cannot go up');
L = mk(); S.shift(L, [6], 1); ok(names(L) === names(mk()), 'the last disc cannot go down');
L = mk(); S.shift(L, [1, 2], 1); ok(names(L) === 'HYMN,mango,zebra,DUNE,Apple,夜に駆ける,Zed', 'two together go down as a block: ' + names(L));
L = mk(); S.toEnd(L, [2], true); ok(names(L) === 'HYMN,Apple,zebra,DUNE,mango,夜に駆ける,Zed', 'to the top: ' + names(L));

/* nothing is lost or doubled by any of it */
{
  let seed = 7; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let t = 0; t < 300; t++) {
    const L = Array.from({ length: 12 }, (_, i) => ({ name: 'd' + i, builtin: i % 5 === 0, folder: i % 5 === 0 ? 'G' : null }));
    const was = L.map(x => x.name).join(), pins = L.map((x, i) => (x.builtin ? i : -1)).join();
    const pickN = () => Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => Math.floor(rnd() * 12));
    const op = Math.floor(rnd() * 3);
    const r = op === 0 ? S.reorder(L, pickN(), Math.floor(rnd() * 13)) : op === 1 ? S.shift(L, pickN(), rnd() < 0.5 ? -1 : 1) : S.sortUser(L, 'name', rnd() < 0.5);
    ok(L.length === 12 && new Set(L.map(x => x.name)).size === 12 && [...r.map.keys()].length === 12 && new Set(r.map.values()).size === 12, 'op ' + op + ': nothing lost or doubled (' + was + ' -> ' + L.map(x => x.name).join() + ')');
    ok(L.map((x, i) => (x.builtin ? i : -1)).join() === pins, 'op ' + op + ': the pressed discs did not move');
    ok([...r.map.entries()].every(([a, b]) => L[b].name === 'd' + a), 'op ' + op + ': the map is true');
  }
}

/* sort */
L = mk(); S.sortUser(L, 'name', false);
ok(names(L) === 'HYMN,Apple,mango,DUNE,zebra,Zed,夜に駆ける', 'by name, ignoring case, pressed discs pinned: ' + names(L));
L = mk(); S.sortUser(L, 'plays', false); ok(L[1].name === 'Apple', 'most played first');
L = mk(); S.sortUser(L, 'added', true); ok(L[1].name === 'zebra', 'newest first when it is turned over');
L = mk(); S.sortUser(L, 'album', false); ok(L[1].name === '夜に駆ける' && L[2].name === 'Apple', 'by album then track number: ' + names(L));

/* albums */
L = mk(); const al = S.albums(L, [...L.keys()]);
ok(al.map(a => a.name).join() === 'Fruit,LOBBY MUSIC,MAGEN,Stripes,NO ALBUM', 'albums are grouped by tag, a pressed game by its folder, and the loose ones last: ' + al.map(a => a.name));
const fruit = al.find(a => a.name === 'Fruit'); ok(fruit.idx.map(i => L[i].name).join() === 'Apple,mango' && fruit.artist === 'B', 'an album lists its tracks in track order');
ok(al.find(a => a.name === 'Stripes').idx.map(i => L[i].name).join() === 'Zed,zebra', 'track 1 before track 2');
ok(al.find(a => a.name === 'Stripes').artist === 'Z', 'one artist names the album');
{ const M = [{ name: 'a', artist: 'X', album: 'Mix', no: 1 }, { name: 'b', artist: 'Y', album: 'mix', no: 2 }]; ok(S.albums(M, [0, 1]).length === 1 && S.albums(M, [0, 1])[0].artist === 'VARIOUS ARTISTS', 'the same album in two cases is one album with various artists'); }

/* search */
ok(S.matches({ name: 'ＲＯＣＫ Song', artist: 'x' }, 'rock') && S.matches({ name: 'Café', artist: '' }, 'cafe') && S.matches({ name: '夜に駆ける', artist: 'YOASOBI' }, '駆ける') && S.matches({ name: 'a', artist: 'b', album: 'Stripes' }, 'stripes a'), 'search ignores width, case and accents and takes several words');
ok(!S.matches({ name: 'a', artist: 'b' }, 'zzz') && S.matches({ name: 'a' }, ''), 'and finds nothing that is not there');

/* picking */
let pk = S.emptyPick(); const order = [4, 3, 2, 1, 0];
pk = S.pick(pk, 3, {}, order); ok(S.sorted(pk).join() === '3', 'a click picks one');
pk = S.pick(pk, 1, { shift: true }, order); ok(S.sorted(pk).join() === '1,2,3', 'shift picks the range between, by what is on screen');
pk = S.pick(pk, 0, { ctrl: true }, order); ok(S.sorted(pk).join() === '0,1,2,3', 'ctrl adds one');
pk = S.pick(pk, 2, { ctrl: true }, order); ok(S.sorted(pk).join() === '0,1,3', 'ctrl on a picked one takes it away');
pk = S.pick(pk, 4, {}, order); ok(S.sorted(pk).join() === '4', 'a plain click starts again');
pk = S.pick(S.emptyPick(), 2, { shift: true }, order); ok(S.sorted(pk).join() === '2', 'shift with nothing picked picks the one');
{ const f = S.follow({ set: new Set([1, 2]), anchor: 1 }, new Map([[1, 5], [2, 6]])); ok(S.sorted(f).join() === '5,6' && f.anchor === 5, 'the pick follows the discs'); }
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
