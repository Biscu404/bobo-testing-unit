/* The lab's sounds, all on the machine's own speaker (Snd) and, for the notes a program plays, the studio's piano on its own channel ('holyc': the
   MUS knob and the taskbar mixer's HOLYC.EXE slider set how loud). Everything is quiet and short, and silent at SFX 0 like every other sound here.
   A tick for a key, a rising pair for RUN, a little blip for each line a program prints (never more than six a run), a buzz for an error, a note for each
   goal that ticks (each one a step higher than the last) and a fanfare for a lesson or a puzzle done. */
export function makeSounds(ctx) {
  const Snd = window.Snd, S = ctx && ctx.studio;
  const tone = (f, ms, o) => { try { if (Snd) Snd.tone(f, ms, o); } catch (e) { /* no sound on this machine */ } };
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);
  let liveAlive = true;
  const X = {
    key() { if (Snd) Snd.key(); },
    click() { if (Snd) Snd.click(); },
    run() { tone(660, 40, { vol: 0.03 }); tone(990, 55, { delay: 0.045, vol: 0.03 }); },
    out(i) { if (i < 6) tone(1400 - i * 70, 16, { vol: 0.015, delay: i * 0.03 }); },
    error() { if (Snd) Snd.err(); },
    goal(i) { tone(587 * Math.pow(2, Math.min(i, 5) / 6), 70, { type: 'triangle', vol: 0.045 }); tone(880 * Math.pow(2, Math.min(i, 5) / 6), 90, { type: 'triangle', delay: 0.06, vol: 0.04 }); },
    pass() { tone(1320, 30, { vol: 0.03 }); },
    fail() { tone(220, 70, { type: 'square', vol: 0.02 }); },
    step() { if (Snd) Snd.chirp(); },
    done() { if (Snd) Snd.fanfare(); },
    coin() { if (Snd) Snd.coin(); },
    press() { if (Snd) Snd.press(); },
    beep() { if (Snd) Snd.ok(); },
    type() { if (Snd) Snd.type(); },
    /* a note a program plays, `after` seconds from now: the studio's piano if it will, a plain tone if not */
    note(n, ms, after) {
      const go = () => {
        if (!liveAlive) return;
        try {
          const k = S && S.live ? S.live('piano', Math.max(21, Math.min(108, n)), 0.8, { vol: 0.9, pan: 0, reverb: 0.15 }, 'holyc') : null;
          if (k) { setTimeout(() => k.off(), Math.max(60, ms - 20)); return; }
        } catch (e) { /* fall through to a tone */ }
        tone(hz(n), ms, { type: 'triangle', vol: 0.05 });
      };
      if (after > 0) setTimeout(go, after * 1000); else go();
    },
    preload() { try { if (S && S.ins) S.ins.load('piano').catch(() => {}); } catch (e) { /* nothing */ } },
    stop() { liveAlive = false; }
  };
  return X;
}
