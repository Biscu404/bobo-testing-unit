import { sys } from './trophy_hook.js';
/* up up down down left right left right b a */
const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
                'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiAt = 0;
let edenOpen = false;
export function wireKonami() {
  window.addEventListener('keydown', e => {
    const want = KONAMI[konamiAt];
    const got = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (got === want) {
      konamiAt++;
      if (konamiAt === KONAMI.length) {
        konamiAt = 0;
        sys.emit('konami');
        if (!edenOpen) {
          import('../apps/eden_ext.js').then(m => m.openEden()).catch(console.error);
        }
      }
    } else {
      konamiAt = (got === KONAMI[0]) ? 1 : 0;
    }
  });
}
