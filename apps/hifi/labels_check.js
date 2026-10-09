/* node apps/hifi/labels_check.js -- pictures to discs (pure Node): by name, to the album, folder, disc or artist they are called after; a number in front is not part of the name;
   Japanese and Korean names match too; pictures that match nothing are left, not guessed; one each in order; and which picture in a folder is its cover. */
import { score, norm, match, inOrder, natural, pickCover, isImage, NEEDS } from './labels.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
ok(norm('04 - Lithium.PNG') === 'lithium' && norm('Nevermind.jpg') === 'nevermind' && norm('  The_Dark-Side (of) the Moon!.jpeg ') === 'the dark side of the moon', 'a name is read without its extension, its track number or its punctuation');
ok(norm('ＮＥＶＥＲＭＩＮＤ') === 'nevermind' && norm('Café') === 'cafe', 'and without its width or its accents');
ok(score('Nevermind', 'nevermind.jpg') === 1, 'the same name is a perfect match');
ok(score('Dark Side of the Moon', 'The Dark Side of the Moon') > 0.8, 'a name inside another is a close match: ' + score('Dark Side of the Moon', 'The Dark Side of the Moon'));
ok(score('Abbey Road', 'Road to Abbey') > 0.5 && score('Abbey Road', 'Thriller') === 0, 'words in common count, and nothing in common is nothing');
ok(score('夜に駆ける', '夜に駆ける.png') === 1 && score('YOASOBI', 'yoasobi.jpg') === 1, 'Japanese and Latin names match themselves');
ok(score('봄날', '봄날 (Spring Day).jpg') > 0.6, 'Korean inside a longer name');
ok(score('', 'x') === 0 && score('a', 'b') === 0, 'nothing matches nothing');

const groups = [{ id: 'a1', kind: 'album', name: 'Nevermind' }, { id: 'a2', kind: 'album', name: 'In Utero' }, { id: 'f1', kind: 'folder', name: 'GRUNGE' }, { id: 't1', kind: 'track', name: 'Lithium' }, { id: 'r1', kind: 'artist', name: 'Nirvana' }, { id: 'a3', kind: 'album', name: '夜に駆ける' }];
const images = [{ name: 'Nevermind.jpg' }, { name: 'in-utero.PNG' }, { name: 'grunge.png' }, { name: '04 - Lithium.png' }, { name: 'nirvana.jpg' }, { name: 'IMG_2231.jpg' }, { name: '夜に駆ける.png' }];
const m = match(images, groups);
ok(m.map(x => x.group && x.group.id).join() === 'a1,a2,f1,t1,r1,,a3'.replace(',,', ',,'), 'every picture goes to what it is called: ' + m.map(x => x.group && x.group.id));
ok(m[5].group === null && m[5].score < NEEDS, 'a picture called IMG_2231 matches nothing and is left');
ok(match([{ name: 'nirvana.jpg' }], [{ id: 'x', kind: 'track', name: 'Nirvana' }, { id: 'y', kind: 'artist', name: 'Nirvana' }])[0].group.id === 'x', 'a tie goes to the more specific group');
ok(match([], groups).length === 0 && match(images, []).every(x => x.group === null), 'no pictures, or nothing to put them on');

/* one each */
const four = [{ name: 'cover 10.png' }, { name: 'cover 2.png' }, { name: 'cover 1.png' }];
const o = inOrder(four, [11, 22, 33]);
ok(o.map(x => four[x.image].name + '>' + x.track).join() === 'cover 1.png>11,cover 2.png>22,cover 10.png>33', 'pictures in number order onto discs in the order given: ' + o.map(x => four[x.image].name + '>' + x.track));
ok(inOrder(four, [1]).length === 1 && inOrder([], [1, 2]).length === 0, 'as many as there are of the fewer');
ok(['a2', 'a10', 'a1'].sort(natural).join() === 'a1,a2,a10', 'numbers count as numbers');

/* the cover of a folder */
ok(pickCover(['01.jpg', 'Cover.jpg', 'back.jpg']) === 1 && pickCover(['folder.png']) === 0 && pickCover(['front.jpg', 'cover.jpg']) === 0 && pickCover(['a.jpg', 'b.jpg']) === -1 && pickCover([]) === -1, 'the cover is the one called cover, front or folder; a lone picture is the cover; two unnamed ones are not');
ok(pickCover(['Album Art Small.jpg', 'x.jpg']) === 0 && pickCover(['scan_back.png', 'artwork.png']) === 1, 'album art and artwork count');
ok(isImage({ name: 'a.JPG' }) && isImage({ name: 'x', type: 'image/png' }) && !isImage({ name: 'a.mp3' }) && !isImage({ name: 'a.flac', type: 'audio/flac' }), 'what is a picture');
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
