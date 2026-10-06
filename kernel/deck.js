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
  const deck = {
    get song() { return song; },
    get playing() { return !!cur; },
    /* play a copy of `s` (the game's own tune is never touched, whatever layers do to the copy); resolves to the
       player, or null if a newer request overtook it or there is no sound. o.layers is the set of layers to start with. */
    async play(s, o) {
      o = o || {};
      const mine = ++token;
      await S.preload(s);
      if (mine !== token) return null;
      const copy = JSON.parse(JSON.stringify(s));
      if (o.layers) setLayers(copy, o.layers);
      const fade = o.fade == null ? 1.4 : o.fade, old = cur;
      const p = S.play(copy, { channel, loop: o.loop !== false, loopFrom: o.loopFrom, loopTo: o.loopTo, from: o.from, fadeIn: old ? fade : (o.fadeIn || 0), limit: o.limit });
      if (!p) return null;
      cur = p; song = copy;
      if (old) old.stop(fade);
      return p;
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
