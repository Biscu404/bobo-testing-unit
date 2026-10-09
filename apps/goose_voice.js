/* The goose's voice: plays one of goose_life.js's plans (`honkPlan`) on the machine's speaker, through Snd.tone, so it is the SFX knob that sets how loud it is and a set that is off, or SFX at 0,
   hears nothing. It is only ever a little louder than a key click (HONK_VOL). An app reaches it without importing the kernel. */
export function playHonk(plan) {
  try {
    const S = typeof window !== 'undefined' && window.Snd;
    if (!S || !S.tone) return;
    plan.forEach(n => S.tone(n.hz, n.ms, { type: n.type, to: n.to, vol: n.vol, delay: n.delay }));
  } catch (e) { /* a goose with no speaker is a quiet goose */ }
}
