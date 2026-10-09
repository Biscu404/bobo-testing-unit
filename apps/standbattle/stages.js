/* The four places of Morioh (background.js draws them) and what each is as a stage: a wall stage holds the fighters in and pins a launched one
   to the wall; the ring stage has an edge and a launched fighter who goes over it loses the round (spec 3). */
export const STAGES = {
  alley:  { id: 'alley',  name: 'BACK ALLEY',               rule: 'walls' },
  street: { id: 'street', name: 'SHOPPING STREET',          rule: 'walls' },
  park:   { id: 'park',   name: 'BUDOGAOKA PARK',           rule: 'ring' },
  store:  { id: 'store',  name: 'KAMEYU DEPARTMENT STORE',  rule: 'walls' }
};
export const STAGE_IDS = ['alley', 'street', 'park', 'store'];
