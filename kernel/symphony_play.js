/* When the symphony plays, and how it leaves. The style meter asks for it the moment it reads
   HAPPY BIRTHDAY and lets it go when the meter does: it is faded out, not cut, and if the meter
   comes back to the top while it is still fading it simply starts again from the unwrapping, under
   the tail of the old one. Played through the studio on a channel of its own, so only the MUS knob
   sets how loud. After the first bar of the drop it loops from there, so a meter that is kept
   at the top for five minutes gets the drop and the theme and the climax again, not silence. */
import { Studio } from './studio.js';
import { symphony, LOOP_FROM_BAR } from './symphony.js';

export const Symphony = {
  on: false, ready: null, token: 0, fading: null,
  /* fetch the instruments now, so that the first bar is there on the very beat the meter gets to the top */
  warm() {
    if (!this.ready) this.ready = Studio.preload(symphony(Studio.lang)).catch(() => null);
    return this.ready;
  },
  async start() {
    if (this.on) return;
    this.on = true;
    clearTimeout(this.fading);
    const mine = ++this.token;
    if (window.Music && window.Music.duck) window.Music.duck(true);
    await this.warm();
    if (!this.on || mine !== this.token) return;
    try { await Studio.deck('style').play(symphony(Studio.lang), { loop: true, loopFrom: (LOOP_FROM_BAR - 1) * 4, fade: 3, limit: -7 }); }
    catch (e) { /* no sound on this machine */ }
  },
  /* the meter has gone: let it fade out over `secs` */
  fadeOut(secs) {
    if (!this.on) return;
    this.on = false; this.token++;
    Studio.deck('style').stop(secs);
    this.fading = setTimeout(() => { if (!this.on && window.Music && window.Music.duck) window.Music.duck(false); }, secs * 1000);
  },
  stop() {
    if (!this.on && !Studio.deck('style').playing) return;
    this.on = false; this.token++;
    clearTimeout(this.fading);
    Studio.deck('style').stop(0.05);
    if (window.Music && window.Music.duck) window.Music.duck(false);
  }
};
