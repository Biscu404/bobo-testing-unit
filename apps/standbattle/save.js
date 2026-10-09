/* Save — the single choke point over ctx.save / ctx.load (spec 16). One blob, 'meta', wrapped as { version, data } and passed through a migration table keyed by the version
   it upgrades FROM. A corrupted or unreadable blob returns the defaults instead of throwing. Version 2 is the arcade rework: the node-map run checkpoint ('run') is gone and removed
   on first load; `meta` holds the settings, the keymap, the high-score table (three initials), the survival and time-attack records, and what has been cleared. */

const META_VERSION = 2;

export function defaultMeta() {
  return {
    shakeEnabled: true, difficulty: 'normal', keymap: null, lastChar: 'jotaro', initials: 'AAA',
    hiscores: [],                              /* [{ initials, score, char, tier, stage, secs, continues, date }], best first, ten at most */
    survival: { best: 0, char: null, runs: 0 },
    timeattack: {},                            /* { fighterId: best seconds } */
    cleared: {},                               /* { fighterId: { easy, normal, hard } } */
    training: { dummy: 'stand', side: 'right', boxes: false },
    played: {}                                 /* { mode: times } */
  };
}

/* META_MIGRATIONS[v] upgrades data from version v to v+1 */
const META_MIGRATIONS = {
  1: d => {
    const m = defaultMeta();
    m.shakeEnabled = !d || d.shakeEnabled !== false;
    if (d && d.cleared) m.cleared = { jotaro: { normal: true } };
    return m;
  }
};

function migrate(entry, migrations, target, fallback) {
  if (!entry || typeof entry !== 'object' || typeof entry.version !== 'number') return fallback;
  let version = entry.version, data = entry.data;
  while (version < target) {
    const step = migrations[version];
    if (!step) return fallback;
    data = step(data);
    version++;
  }
  return data === undefined ? fallback : data;
}

/* whatever a saved value is, make it the shape the game reads */
function tidy(m) {
  const d = defaultMeta();
  const out = Object.assign({}, d, m);
  out.hiscores = Array.isArray(m.hiscores) ? m.hiscores.filter(h => h && typeof h.score === 'number').slice(0, 10) : [];
  ['survival', 'timeattack', 'cleared', 'training', 'played'].forEach(k => { if (!out[k] || typeof out[k] !== 'object') out[k] = d[k]; });
  if (['easy', 'normal', 'hard'].indexOf(out.difficulty) < 0) out.difficulty = 'normal';
  return out;
}

export function createSaveStore(ctx) {
  return {
    async loadMeta() {
      try {
        const entry = await ctx.load('meta');
        if (entry == null) return defaultMeta();
        const old = entry && entry.version < META_VERSION;
        const m = tidy(migrate(entry, META_MIGRATIONS, META_VERSION, defaultMeta()));
        if (old) { try { await ctx.save('run', null); await ctx.save('meta', { version: META_VERSION, data: m }); } catch (e) { /* the next save will do it */ } }
        return m;
      } catch (e) {
        return defaultMeta();
      }
    },
    async saveMeta(data) { await ctx.save('meta', { version: META_VERSION, data }); },
    async clearRun() { await ctx.save('run', null); }
  };
}
