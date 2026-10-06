/* A deck: how a game plays its score. It plays one song at a time on the game's own channel
   (so the taskbar mixer's slider for that game, and the MUS knob, set how loud) and, when
   told to play another, lets the old one fade out underneath while the new one fades in.
   A track can carry a `layer` name, and layers() switches layers on and off while the song
   plays: that is how a score gets bigger when a fight starts. */
/* mute and unmute a song's layered tracks; true if anything changed */
function setLayers(song, map) {
  let changed = false;
  song.tracks.forEach(t => {
    if (t.layer == null || !(t.layer in map)) return;
    const mute = !map[t.layer];
    if (!!t.mute !== mute) { t.mute = mute; changed = true; }
  });
  return changed;
}

export function makeDeck(S, channel) {
  let cur = null, song = null, token = 0;
  /* a score nobody plays by hand: notes are queued well ahead of the clock, so a long frame cannot make them bunch up */
  const AHEAD = 0.5;
  const deck = {
    get song() { return song; },
    get player() { return cur; },
    get playing() { return !!cur; },
    /* load a song's instruments now, so that playing it later does not wait */
    preload(s) { return S.preload(s); },
    /* play a copy of `s` (the game's own tune is never touched, whatever layers do to the copy); resolves to the
       player, or null if a newer request overtook it or there is no sound. o.layers is the set of layers to start with.
       o.at is a time on the audio clock to begin at, and the old song's fade then begins there too;
       o.fade is how long they cross. */
    async play(s, o) {
      o = o || {};
      const mine = ++token;
      await S.preload(s);
      if (mine !== token) return null;
      const copy = JSON.parse(JSON.stringify(s));
      if (o.layers) setLayers(copy, o.layers);
      const fade = o.fade == null ? 1.4 : o.fade, old = cur;
      const p = S.play(copy, { channel, loop: o.loop !== false, loopFrom: o.loopFrom, loopTo: o.loopTo, from: o.from,
                               fadeIn: old ? (o.fadeIn != null ? o.fadeIn : fade) : (o.fadeIn || 0), limit: o.limit,
                               startAt: o.at, ahead: o.ahead || AHEAD });
      if (!p) return null;
      cur = p; song = copy;
      /* o.keepOld: the old song is finishing its own pass (see segue) and must not be stopped from here */
      if (old && !o.keepOld) old.stop(o.oldFade != null ? o.oldFade : fade, o.at);
      return p;
    },
    /* Begin `s` where the song now playing ends: it is let play out its pass (no more looping) and the new one starts on
       the very next sample after, so a change of tune lands on a downbeat instead of cutting a phrase in half.
       Falls back to a short crossfade on the bar line when there is not enough of the pass left to arrange that.
       Resolves to the new player, or null. */
    async segue(s, o) {
      o = o || {};
      const old = cur;
      if (!old || !S.ensure()) return deck.play(s, o);
      await S.preload(s);
      const rest = old.remaining();
      if (cur !== old) return null;
      const ctx = S.audioContext();
      if (rest > 0.9 && !o.now) {
        old.setLoop(false);
        return deck.play(s, Object.assign({}, o, { at: ctx.currentTime + rest, fadeIn: 0, keepOld: true }));
      }
      return deck.play(s, Object.assign({}, o, { at: ctx.currentTime + old.toBar(), fade: o.fade == null ? 1.2 : o.fade }));
    },
    /* switch layers: { drums: true, lead: false, ... }. Tracks with no layer are always on. */
    layers(map) { if (cur && song && setLayers(song, map)) cur.refresh(); },
    stop(fade) {
      token++;
      if (cur) { cur.stop(fade == null ? 0.8 : fade); cur = null; song = null; }
    }
  };
  return deck;
}
