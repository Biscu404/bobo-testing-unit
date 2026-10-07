import { Cos, COS_CATS } from '../../kernel/cos.js';
import { DAVE_LINES, DAVE_BROKE } from './lines.js';
import { drawDave, drawThumb } from './thumbs.js';

/* what a card's button says, and what pressing it does, by what kind of shelf it is on (kernel/cos.js COS_CATS) */
const KIND = {
  look:   { have: 'EQUIP',              eq: 'EQUIPPED' },
  stock:  { have: null,                 eq: 'EQUIPPED' },         /* the pot equipped is the garden's default pot */
  wall:   { have: 'SET AS BACKGROUND',  eq: 'IN USE' },
  unlock: { have: null,                 eq: null }
};
const pick = a => a[Math.floor(Math.random() * a.length)];

export default {
  id: 'shop',
  title: 'CRAZY DAVE\'S  --  EVERYTHING MUST GO SOMEWHERE',
  width: 640,
  height: 480,
  resizable: true,
  /* an app that sends you here can ask for its own shelf: ctx.openWindow('shop', { tab: 'crayon' }) */
  mount(root, ctx, args) {
    let cat = (args && COS_CATS[args.tab]) ? args.tab : 'frame';
    let bubbleEl = null, gridEl = null, footEl = null, daveCv = null;
    let bob = 0, raf = null, talkT = 0;

    const top = document.createElement('div');
    top.className = 'shoptop';
    const dv = document.createElement('div');
    dv.className = 'shopdave';
    daveCv = document.createElement('canvas');
    daveCv.width = 48; daveCv.height = 48;
    dv.appendChild(daveCv);
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'shopbubble';
    top.appendChild(dv);
    top.appendChild(bubbleEl);

    const tabs = document.createElement('div');
    tabs.className = 'shoptabs';
    const keys = Object.keys(COS_CATS);
    keys.forEach(k => {
      const t = document.createElement('div');
      t.className = 'shoptab' + (k === cat ? ' on' : '');
      t.textContent = COS_CATS[k].label;
      t.addEventListener('mousedown', ev => {
        ev.stopPropagation();
        cat = k;
        if (window.Snd) window.Snd.click();
        tabs.querySelectorAll('.shoptab').forEach((n, i) => n.classList.toggle('on', keys[i] === k));
        fill();
      });
      tabs.appendChild(t);
    });

    gridEl = document.createElement('div');
    gridEl.className = 'shopgrid';
    footEl = document.createElement('div');
    footEl.className = 'shopfoot';

    root.className = 'shoproot';
    root.appendChild(top);
    root.appendChild(tabs);
    root.appendChild(gridEl);
    root.appendChild(footEl);

    const say = txt => { if (bubbleEl) bubbleEl.textContent = txt; };
    say(pick(DAVE_LINES));

    function foot() {
      if (!footEl) return;
      footEl.innerHTML = '';
      const l = document.createElement('span');
      l.textContent = 'YOU HAVE ' + window.Economy.balance() + ' SUN';
      const r = document.createElement('span');
      r.className = 'r';
      const n = keys.reduce((a, k) => a + window.Cos.owned(k).length, 0);
      const tot = keys.reduce((a, k) => a + COS_CATS[k].list.length, 0);
      r.textContent = n + ' / ' + tot + ' OWNED';
      footEl.appendChild(l);
      footEl.appendChild(r);
    }

    /* the words on a card's button for this item, now */
    function buttonText(c, owned, eq) {
      if (!owned) return 'BUY';
      const kind = KIND[COS_CATS[c].kind];
      if (eq && kind.eq) return kind.eq;
      if (kind.have) return kind.have;
      return 'IN ' + COS_CATS[c].appName;
    }
    const isEq = (c, id) => {
      const k = COS_CATS[c].kind;
      return (k === 'look' || k === 'stock' || k === 'wall') && c !== 'seed' && window.Cos.equipped(c) === id;
    };

    function fill() {
      if (!gridEl) return;
      window.Cos.hover(null, null);
      gridEl.innerHTML = '';
      const list = COS_CATS[cat].list;
      list.forEach(it => {
        const owned = window.Cos.has(cat, it.id);
        const eq = isEq(cat, it.id);
        const card = document.createElement('div');
        card.className = 'shopcard' + (eq ? ' eq' : owned ? ' owned' : '') +
          (!owned && window.Economy.balance() < it.price ? ' broke' : '');

        const cv = document.createElement('canvas');
        cv.width = 116; cv.height = 60;
        drawThumb(cv, cat, it);

        const nm = document.createElement('div');
        nm.className = 'nm';
        nm.textContent = it.name;

        const pr = document.createElement('div');
        pr.className = 'pr';
        pr.textContent = owned ? 'OWNED' : (it.price === 0 ? 'FREE' : it.price + ' SUN');

        const bt = document.createElement('div');
        bt.className = 'bt';
        bt.textContent = buttonText(cat, owned, eq);

        card.appendChild(cv); card.appendChild(nm); card.appendChild(pr); card.appendChild(bt);
        card.title = it.blurb || '';

        card.addEventListener('mouseenter', () => {
          say(it.blurb || it.name);
          if (cat === 'frame' || cat === 'cursor' || cat === 'scheme') window.Cos.hover(cat, it.id);
        });
        card.addEventListener('mouseleave', () => { window.Cos.hover(null, null); });
        card.addEventListener('mousedown', ev => { ev.stopPropagation(); press(it, owned); });
        gridEl.appendChild(card);
      });
      foot();
    }

    function press(it, owned) {
      const c = COS_CATS[cat];
      if (!owned) {
        if (window.Economy.balance() < it.price) {
          say(pick(DAVE_BROKE));
          if (window.Snd && window.Snd.deny) window.Snd.deny();
          return;
        }
        if (window.Cos.buy(cat, it.id)) {
          if (window.Snd && window.Snd.purchase) window.Snd.purchase();
          say(daveThanks(cat, it));
          if (c.kind === 'look' || c.kind === 'wall') window.Cos.equip(cat, it.id);
          if (cat === 'seed' || cat === 'pot') window.dispatchEvent(new Event('garden-stock-refresh'));
          fill(); foot();
        }
        return;
      }
      if (cat === 'seed') { say('YOU\'VE GOT THOSE. PLANT THEM. THAT\'S THE NEXT BIT.'); if (window.Snd) window.Snd.click(); return; }
      if (c.kind === 'unlock') {
        if (window.Snd) window.Snd.click();
        say(unlockHint(cat, it));
        ctx.openWindow(c.app).catch(() => {});
        return;
      }
      window.Cos.equip(cat, it.id);
      if (window.Snd) window.Snd.click();
      say(c.kind === 'wall' ? 'THERE. YOUR DESKTOP IS A PICTURE NOW. THE FILE IS IN HOME, BACKDROPS.' : 'THERE. LOOK AT YOU.');
      fill();
    }

    function unlockHint(c, it) {
      if (c === 'crayon') return it.kind === 'layer' ? 'OPEN DRAW. THE LAYERS ARE ON THE LEFT, UNDER THE TOOLS.' : 'OPEN DRAW. THE ' + it.name + ' IS ON THE LEFT, UNDER THE OTHER TOOLS.';
      if (c === 'garage') return 'OPEN THE GARAGE, PICK AN INSTRUMENT FOR A TRACK. THEY ARE IN THE PICKER NOW: ' + it.inst.map(i => i.toUpperCase()).join(', ') + '.';
      if (c === 'drink') return 'OPEN THE BOTTLE. THE DRINK BUTTON CHANGES WHAT YOU ARE POURING. ' + (it.strength > 1.5 ? 'GO CAREFULLY.' : '');
      if (it.id === 'pet') return 'OPEN THE ELEPHANT AND PRESS GO OUTSIDE. THEN STAND BACK.';
      return 'OPEN THE ELEPHANT. THE WARDROBE IS THE BUTTON.';
    }

    function daveThanks(c, it) {
      if (it.joke) return 'YOU ACTUALLY BOUGHT IT. I HAVE TO CLOSE THE SHOP. I HAVE TO GO AND LIE DOWN.';
      if (c === 'seed') return 'SEEDS! IN A POT! I\'VE HEARD OF IT!';
      if (c === 'frame') return 'IT\'S ON THE MACHINE ALREADY. DON\'T ASK HOW. ASK LATER.';
      if (c === 'wall') return 'ON THE DESKTOP. AND A COPY IN YOUR FILES, IN CASE YOU GET TIRED OF IT AND WANT IT BACK.';
      if (c === 'drink') return it.strength === 0 ? 'JUICE! GOOD FOR YOU! DISGUSTING!' : 'ONE BOTTLE, FULL. THE BUTTON IS IN THE BOTTLE. DRINK RESPONSIBLY. OR AT ALL.';
      if (c === 'crayon' || c === 'garage') return 'IT\'S IN THE APP ALREADY. I SNUCK IT IN WHILE YOU WERE LOOKING AT THE PRICE.';
      if (c === 'elephant') return it.id === 'pet' ? 'HE\'S OUT. HE\'S OUT! I TOLD HIM NOT TO. HE NEVER LISTENS.' : 'HE LOOKS WONDERFUL. HE ALWAYS DID. NOW IT\'S OFFICIAL.';
      return 'SOLD. NO REFUNDS. NO RECEIPTS. GESTURES ONLY.';
    }

    fill();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      bob += 0.06;
      drawDave(daveCv, bob);
      talkT++;
      if (talkT > 900) { talkT = 0; say(pick(DAVE_LINES)); }
    };
    raf = requestAnimationFrame(loop);

    /* a purchase made somewhere else (the garden's bench, a locked tool in the crayon) turns up here at once */
    this._onEcon = () => fill();
    window.Economy.onChange(this._onEcon);
    this._onCos = () => { if (document.body.contains(root)) fill(); else window.removeEventListener('cos-changed', this._onCos); };
    window.addEventListener('cos-changed', this._onCos);

    /* the loop re-arms itself every frame, so cancel whichever id is current, not the first */
    this._stop = () => cancelAnimationFrame(raf);
  },
  unmount() {
    if (this._stop) { this._stop(); this._stop = null; }
    window.removeEventListener('cos-changed', this._onCos);
    window.Cos.hover(null, null);
  }
};
