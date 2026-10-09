/* The LAYERS panel: the sheet and the four clear sheets over it (Dave sells them one at a time), which one is drawn on, which are shown, and CLEAR / MERGE DOWN.
   Its own window (panels.js). `env` is what the main window hands it: the stack of layers, what is owned, and the two operations that need an undo step first. */
import { scopedListeners, whenGone } from '../lifecycle.js';
import { MAX_LAYERS } from './layers.js';

export function buildLayers(body, sess, env) {
  const wl = scopedListeners(body);
  const box = document.createElement('div');
  box.className = 'drawtools drawpanel';
  body.appendChild(box);
  const rows = [];
  const list = document.createElement('div');
  list.className = 'drawlayers';
  for (let i = 0; i < MAX_LAYERS; i++) {
    const row = document.createElement('div');
    row.className = 'lyrow';
    const pick = document.createElement('button'); pick.className = 'tl lypick';
    const eye = document.createElement('button'); eye.className = 'tl lyeye'; eye.textContent = 'ON';
    pick.addEventListener('mousedown', ev => {
      ev.stopPropagation();
      const c = env.layerItem(i);
      if (i > 0 && !env.owns(c.id)) { env.toDave('LAYER ' + (i + 1) + ' FOR ' + c.price + ' SUN'); return; }
      env.setLayer(i); env.click();
    });
    eye.addEventListener('mousedown', ev => { ev.stopPropagation(); if (i === 0 || !env.owns(env.layerItem(i).id)) return; env.toggleLayer(i); env.click(); });
    row.appendChild(pick); if (i > 0) row.appendChild(eye);
    list.appendChild(row); rows.push({ pick, eye });
  }
  box.appendChild(list);
  const btn = (label, fn) => { const b = document.createElement('button'); b.className = 'tl'; b.textContent = label; b.addEventListener('mousedown', ev => { ev.stopPropagation(); fn(); }); box.appendChild(b); };
  btn('CLEAR LAYER', () => env.clearLayer());
  btn('MERGE DOWN', () => env.mergeDown());

  const show = () => {
    const L = env.layers();
    rows.forEach((e, i) => {
      const c = env.layerItem(i), have = i === 0 || env.owns(c.id);
      e.pick.textContent = i === 0 ? 'SHEET' : 'LAYER ' + (i + 1);
      e.pick.title = have ? '' : c.blurb + '  --  ' + c.price + ' SUN AT DAVE\'S';
      e.pick.classList.toggle('locked', !have);
      e.pick.classList.toggle('on', !!L && have && L.active === i);
      e.eye.textContent = L && L.visible(i) ? 'ON' : 'OFF';
      e.eye.classList.toggle('locked', !have);
    });
  };
  const off = sess.on(what => { if (what === 'layers') show(); });
  whenGone(box, off);
  wl.on(window, 'cos-changed', () => { if (box.isConnected) show(); });
  show();
}
