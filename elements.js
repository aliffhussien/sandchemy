// ============================================================
// SANDCHEMY — DATA FILE
// This is the ONLY file you need to touch for weekly updates.
// Add a new element to ELEMENTS, add its reactions to REACTIONS,
// and the engine picks it up automatically. Never edit game.js
// for new content.
// ============================================================

const E = {
  EMPTY: 0,
  WALL: 1,
  SAND: 2,
  WATER: 3,
  FIRE: 4,
  LAVA: 5,
  ICE: 6,
  SEED: 7,
  STEAM: 8,
  OBSIDIAN: 9,
  GLASS: 10,
  MUD: 11,
  PLANT: 12,
  ASH: 13,
  DIRT: 14,
  STONE: 15,
  // ---- Phase 2.6: new elements (see SCIENCE.md "New elements") ----
  GOLD: 16,
  MOLTEN_GOLD: 17,
  IRON: 18,
  RUST: 19,
  LEAD: 20,
  MOLTEN_LEAD: 21,
  MERCURY: 22,
  FROZEN_MERCURY: 23,
  OXYGEN: 24,
  HYDROGEN: 25,
  NEON: 26,
  GLOWING_NEON: 27,
  LIGHTNING: 28,
  SALT: 29,
  SALTWATER: 30,
  OIL: 31,
  // ---- Phase 7: Lantern and Wood ----
  WOOD: 32,
  STRING: 33,
  WICK: 34,
  LANTERN: 35,
  LIT_LANTERN: 36,
  // ---- Phase 8: Biology/Evolution ----
  AMINO_ACID: 37,
  MICROBE: 38,
  ALGAE: 39,
  // ---- Phase 9: Weather ----
  CLOUD: 40,
  SNOW: 41,
  ACID_RAIN: 42,
  // ---- Phase 10: Electricity/Tech ----
  COPPER: 43,
  BATTERY: 44,
  SPARK: 45,
  // ---- Extras ----
  VOLCANO: 46,
  
  // ---- School Science ----
  BAKING_SODA: 47,
  VINEGAR: 48,
  FOAM: 49,
  
  // ---- Phase 2: Autonomous Life ----
  FISH: 50,
  BUG: 51,
  
  // ---- Phase 3: Nuclear Physics ----
  URANIUM: 52,
  RADIATION: 53,
  NUCLEAR_WASTE: 54
};

// type: how the engine moves it
//   powder = falls, piles up      liquid = falls + spreads sideways
//   gas    = rises                static = stays put
//   fire   = burns out over time  plant  = static but slowly grows upward
// starter: shown in the palette from the beginning
// (non-starter, non-hidden elements must be DISCOVERED through reactions)
//
// ---- Temperature fields (all optional) — see SCIENCE.md for sources ----
// Real °C, ambient room temperature is 25°C (see AMBIENT in game.js).
// heatEmit:   this element radiates heat (positive) or cold (negative, i.e.
//             below ambient) to its neighbors every tick — a neighbor never
//             feels less than this. It also seeds this element's OWN
//             starting temperature when freshly placed or loaded (see
//             restingTemp() in game.js), but its actual temperature is
//             emergent from there: a lone hot cell surrounded by open air
//             genuinely cools over time (that's how Lava crusts to Stone).
// meltsAt/meltsTo, boilsAt/boilsTo, freezesAt/freezesTo:
//             once this cell's own temperature crosses the threshold, it
//             converts to the paired id. These fire from RADIANT heat/cold
//             (through the air, at a short distance) — separate from the
//             instant touch REACTIONS below, which still fire on direct
//             contact (e.g. water splashed straight onto a flame).
//             freezesAt also covers liquid → solid generally, so Lava's
//             real solidus point (below which it's rock, not melt) reuses
//             the exact same mechanism as Water freezing to Ice.
// ignitesAt:  same idea, but always converts to Fire (no separate "to" id
//             needed — igniting always means catching fire).
// burnsToAsh: if true, this element leaves Ash behind when the fire it
//             ignited into eventually burns out (see game.js fire aging).
// density:    kg/m³, real values. Decides what sinks/floats: a powder only
//             sinks through a liquid it lands on if it's denser than that
//             liquid (see game.js) — this is what lets Ice float on Water
//             (and, since Phase 2.6, Gold sink through Lava, and Oil float
//             on Water while everything denser than Water still sinks).
// revertsTo/revertsAfter (gas only): after `revertsAfter` frames (default
//             300), a gas cell converts back to `revertsTo` — e.g. Steam
//             condenses back to Water, Glowing Neon's glow fades back to
//             plain Neon. Generic version of a mechanic that used to be
//             hardcoded to Steam specifically (see game.js).
// particle:   (Phase 3, purely cosmetic — read by effects.js, ignored by
//             game.js entirely) what ambient particle this element sheds:
//             'spark' (drifts up, e.g. Fire), 'smoke' (drifts up, e.g.
//             Lava), 'bubble' (only spawns once this cell's own temp is
//             close to its `boilsAt`, so it reads as "about to boil" not
//             "always bubbling"), or 'dust' (one-shot puff the moment this
//             cell stops falling — a landing event, not continuous). Glow
//             needs no separate field: any element with a positive
//             `heatEmit` glows automatically in effects.js.
const ELEMENTS = {
  [E.EMPTY]:    { name: 'Empty',    color: [13, 15, 26],    hidden: true, density: 1.2 },
  [E.WALL]:     { name: 'Wall',     emoji: '🧱', color: [92, 96, 112],  type: 'static', starter: true },
  [E.SAND]:     { name: 'Sand',     emoji: '⏳', color: [226, 194, 104], type: 'powder', starter: true, density: 1600, particle: 'dust' },
  [E.WATER]:    { name: 'Water',    emoji: '💧', color: [58, 128, 209],  type: 'liquid', starter: true, dispersion: 4, particle: 'bubble',
                  density: 1000, boilsAt: 100, boilsTo: E.STEAM, freezesAt: 0, freezesTo: E.ICE },
  [E.FIRE]:     { name: 'Fire',     emoji: '🔥', color: [255, 120, 40],  type: 'fire',   starter: true, heatEmit: 900, particle: 'spark' },
  [E.LAVA]:     { name: 'Lava',     emoji: '🌋', color: [226, 88, 34],   type: 'liquid', starter: true, dispersion: 1, viscous: true, particle: 'smoke',
                  density: 2750, heatEmit: 1150, freezesAt: 950, freezesTo: E.STONE },
  // Ice's heatEmit is -40, not the literal 0°C SCIENCE.md lists ("ice sits
  // at its melting point") — sitting EXACTLY at its own melt threshold with
  // ambient air at 25° means even a sliver of diffusion pushes it over
  // instantly (empirically confirmed: it melted the same frame it was
  // placed). -40 gives it real headroom below 0 so it survives a normal
  // scene for a while and a lava/fire source still measurably speeds up its
  // melting, without flash-melting the instant it's placed. See PLAN.md
  // Phase 2.5 notes for the empirical tuning behind this number.
  [E.ICE]:      { name: 'Ice',      emoji: '🧊', color: [174, 227, 245], type: 'powder', starter: true,
                  density: 917, heatEmit: -40, meltsAt: 0, meltsTo: E.WATER },
  [E.SEED]:     { name: 'Seed',     emoji: '🌰', color: [122, 82, 48],   type: 'powder', starter: true, density: 600, ignitesAt: 300 },
  [E.DIRT]:     { name: 'Dirt',     emoji: '🟫', color: [96, 66, 40],    type: 'powder', starter: true, density: 1300 },

  // ---- Phase 2.6 starters: metals, gases, lightning, salt, oil ----
  // (see SCIENCE.md "New elements" for the why behind each pick)
  [E.GOLD]:     { name: 'Gold',     emoji: '🟡', color: [212, 175, 55],  type: 'powder', starter: true,
                  density: 19300, meltsAt: 1064, meltsTo: E.MOLTEN_GOLD },
  [E.IRON]:     { name: 'Iron',     emoji: '⚙️', color: [130, 130, 140], type: 'powder', starter: true,
                  density: 7870 },   // no meltsAt on purpose — Lava (1150°) genuinely can't melt Iron (1538°)
  [E.LEAD]:     { name: 'Lead',     emoji: '⬛', color: [85, 90, 98],    type: 'powder', starter: true,
                  density: 11340, meltsAt: 327, meltsTo: E.MOLTEN_LEAD },
  [E.MERCURY]:  { name: 'Mercury',  emoji: '☿️', color: [196, 196, 206], type: 'liquid', starter: true,
                  density: 13534, freezesAt: -39, freezesTo: E.FROZEN_MERCURY }, // liquid metal at room temp — no starter needs its own heatEmit here, ambient (25°) already sits safely above -39°
  [E.OXYGEN]:   { name: 'Oxygen',   emoji: '🅾️', color: [200, 225, 255], type: 'gas', starter: true, density: 1.43 },
  [E.HYDROGEN]: { name: 'Hydrogen', emoji: '🎈', color: [230, 240, 255], type: 'gas', starter: true, density: 0.09 },
  [E.NEON]:     { name: 'Neon',     emoji: '💡', color: [225, 225, 235], type: 'gas', starter: true, density: 0.90 },
  // Lightning is a brief, overwhelming spark — reuses Fire's aging/burnout
  // logic (it's gone after a couple frames) with a huge heatEmit so its
  // radiant touch is unmistakable, but its OWN stored reading isn't load-
  // bearing (nothing checks Lightning's own temp) so no headroom fix needed.
  [E.LIGHTNING]: { name: 'Lightning', emoji: '⚡', color: [230, 240, 255], type: 'fire', starter: true, heatEmit: 30000 },
  [E.SALT]:     { name: 'Salt',     emoji: '🧂', color: [240, 240, 235], type: 'powder', starter: true, density: 2170 },
  [E.OIL]:      { name: 'Oil',      emoji: '🛢️', color: [40, 35, 30],    type: 'liquid', starter: true,
                  density: 900, ignitesAt: 250 },

  // ---- Discoverable elements (the fun part) ----
  // As of Phase 7, all elements are shown in the palette (starter: true) 
  // to allow the user to see everything up front.
  [E.STEAM]:    { name: 'Steam',    emoji: '💨', color: [200, 212, 224], type: 'gas', starter: true, density: 0.6,
                  revertsTo: E.CLOUD, revertsAfter: 300 },
  [E.OBSIDIAN]: { name: 'Obsidian', emoji: '🖤', color: [43, 34, 61],    type: 'static', starter: true, density: 2400 },
  [E.GLASS]:    { name: 'Glass',    emoji: '🔮', color: [186, 227, 222], type: 'static', starter: true, density: 2500 },
  [E.MUD]:      { name: 'Mud',      emoji: '🟤', color: [107, 74, 43],   type: 'powder', starter: true, slow: true, density: 1800 },
  [E.PLANT]:    { name: 'Plant',    emoji: '🌿', color: [63, 163, 77],   type: 'plant', starter: true, density: 600, ignitesAt: 300, burnsToAsh: true },
  [E.ASH]:      { name: 'Ash',      emoji: '🌫️', color: [158, 158, 158], type: 'powder', starter: true, density: 600 },
  [E.STONE]:    { name: 'Stone',    emoji: '🪨', color: [120, 118, 112], type: 'static', starter: true, density: 2900 },
  // Molten Gold/Lead need a heatEmit above their own freezesAt, same fix as
  // Ice's -40 in Phase 2.5: freshly PAINTING a discovered molten metal would
  // otherwise default to ambient (25°) — below their solidus — and instant-
  // freeze back to the solid on the very first tick.
  [E.MOLTEN_GOLD]: { name: 'Molten Gold', emoji: '🔶', color: [255, 196, 64], type: 'liquid', starter: true,
                     density: 19300, heatEmit: 1100, freezesAt: 1064, freezesTo: E.GOLD },
  [E.RUST]:     { name: 'Rust',     emoji: '🟠', color: [150, 80, 40],   type: 'powder', starter: true, density: 5250 },
  [E.MOLTEN_LEAD]: { name: 'Molten Lead', emoji: '🔴', color: [210, 90, 60], type: 'liquid', starter: true,
                     density: 11340, heatEmit: 400, freezesAt: 327, freezesTo: E.LEAD },
  // Same headroom fix, other direction: Frozen Mercury painted fresh would
  // default to ambient (25°) — above its own -39° melt point — and instant-
  // melt back to liquid Mercury immediately without this.
  [E.FROZEN_MERCURY]: { name: 'Frozen Mercury', emoji: '⚪', color: [170, 170, 182], type: 'powder', starter: true,
                        density: 13534, heatEmit: -60, meltsAt: -39, meltsTo: E.MERCURY },
  [E.GLOWING_NEON]: { name: 'Glowing Neon', emoji: '✨', color: [255, 90, 60], type: 'gas', starter: true,
                      density: 0.90, revertsTo: E.NEON, revertsAfter: 150 },
  [E.SALTWATER]: { name: 'Salt Water', emoji: '🌊', color: [50, 140, 170], type: 'liquid', starter: true, dispersion: 4, particle: 'bubble',
                   density: 1025, boilsAt: 100, boilsTo: E.STEAM, freezesAt: -10, freezesTo: E.ICE },
  
  // ---- Phase 7: Lantern Crafting Chain ----
  [E.WOOD]:     { name: 'Wood',     emoji: '🪵', color: [133, 94, 66],   type: 'static', starter: true, density: 600, ignitesAt: 300, burnsToAsh: true },
  [E.STRING]:   { name: 'String',   emoji: '🧵', color: [240, 240, 240], type: 'powder', starter: true, density: 300, ignitesAt: 250, burnsToAsh: true },
  [E.WICK]:     { name: 'Wick',     emoji: '🕯️', color: [210, 210, 180], type: 'static', starter: true, density: 400, ignitesAt: 150, burnsToAsh: true },
  [E.LANTERN]:  { name: 'Lantern',  emoji: '🪔', color: [140, 130, 120], type: 'static', starter: true, density: 2500 },
  // Lit lantern stays static and emits heat forever without burning out
  [E.LIT_LANTERN]: { name: 'Lit Lantern', emoji: '🏮', color: [255, 120, 60], type: 'static', starter: true, density: 1000, heatEmit: 600, particle: 'spark' },
  
  // ---- Phases 8, 9, 10 Elements ----
  [E.AMINO_ACID]: { name: 'Amino Acid', emoji: '🧬', color: [170, 80, 200], type: 'liquid', starter: true, density: 1050 },
  [E.MICROBE]:    { name: 'Microbe',    emoji: '🦠', color: [140, 200, 120], type: 'powder', starter: true, density: 1000, slow: true },
  [E.ALGAE]:      { name: 'Algae',      emoji: '🦠', color: [80, 180, 100],  type: 'plant',  starter: true, density: 600 },
  
  [E.CLOUD]:      { name: 'Cloud',      emoji: '☁️', color: [230, 240, 250], type: 'gas',    starter: true, density: 0.4, revertsTo: E.WATER, revertsAfter: 600 },
  [E.SNOW]:       { name: 'Snow',       emoji: '❄️', color: [240, 250, 255], type: 'powder', starter: true, density: 200, heatEmit: -20, meltsAt: 5, meltsTo: E.WATER },
  [E.ACID_RAIN]:  { name: 'Acid Rain',  emoji: '🌧️', color: [160, 255, 120], type: 'liquid', starter: true, density: 1025 },
  
  [E.COPPER]:     { name: 'Copper',     emoji: '🟧', color: [184, 115, 51],  type: 'static', starter: true, density: 8960, meltsAt: 1085 },
  [E.BATTERY]:    { name: 'Battery',    emoji: '🔋', color: [60, 60, 70],    type: 'static', starter: true, density: 3000 },
  [E.SPARK]:      { name: 'Spark',      emoji: '⚡', color: [255, 255, 100], type: 'gas',    starter: true, density: 0, revertsTo: E.EMPTY, revertsAfter: 5, heatEmit: 5000 },
  
  [E.VOLCANO]:    { name: 'Magma Vent', emoji: '🌋', color: [100, 30, 20],   type: 'static', starter: true, density: 3000, heatEmit: 1200 },

  [E.BAKING_SODA]: { name: 'Baking Soda', type: 'powder', emoji: '🧂', color: [240, 240, 240], density: 2200, starter: true },
  [E.VINEGAR]: { name: 'Vinegar', type: 'liquid', emoji: '🧪', color: [200, 220, 210], density: 1050, boilsAt: 100, boilsTo: E.STEAM, freezesAt: -2, freezesTo: E.ICE, starter: true },
  [E.FOAM]: { name: 'Foam', type: 'gas', emoji: '🫧', color: [230, 230, 240], density: 100, starter: false },

  [E.FISH]: { name: 'Fish', type: 'creature', habitat: E.WATER, emoji: '🐟', color: [255, 120, 50], diesAt: 40, diesTo: E.ASH, starter: true },
  [E.BUG]: { name: 'Bug', type: 'creature', habitat: E.EMPTY, emoji: '🐜', color: [80, 50, 20], diesAt: 55, diesTo: E.ASH, starter: true },

  [E.URANIUM]: { name: 'Uranium', type: 'static', emoji: '☢️', color: [50, 150, 50], density: 19050, heatEmit: 300, meltsAt: 1132, meltsTo: E.LAVA, starter: true },
  [E.RADIATION]: { name: 'Radiation', type: 'gas', emoji: '❇️', color: [100, 255, 100], density: 0, starter: false },
  [E.NUCLEAR_WASTE]: { name: 'Nuclear Waste', type: 'liquid', emoji: '🧪', color: [20, 80, 20], density: 3000, heatEmit: 80, starter: false }
};

// When element `a` touches element `b`:
//   a becomes `aTo`, b becomes `bTo` (chance = prob, default 1).
// burnt: mark the new fire cell so it leaves ASH when it dies.
// wets: cosmetic-only reaction — no id change, just darkens `a`'s look
//   (see the `wets` handling in game.js's applyReaction).
// minTemp: this reaction only fires once `a` has itself soaked up at least
//   this much heat (see game.js) — e.g. sand only turns to glass once IT is
//   hot enough, which only happens pressed against a big/deep lava mass,
//   not a thin, fast-cooling trickle.
// refuels: cosmetic/lifespan-only reaction — no id change, just resets `a`'s
//   age to 0 (see game.js's applyReaction) — used by Oxygen keeping Fire
//   burning longer instead of changing what either cell IS.
// why: one real-world sentence justifying the recipe (for the journal, later).
const REACTIONS = [
  { a: E.WATER, b: E.LAVA,  aTo: E.STEAM, bTo: E.OBSIDIAN,
    why: 'Water quenches lava instantly — the flash steam is real, and fast-cooled lava freezes into glassy Obsidian before it can crystallize.' },
  { a: E.WATER, b: E.FIRE,  aTo: E.STEAM, bTo: E.EMPTY,
    why: 'Water absorbs a flame’s heat and flashes to steam, smothering the fire.' },
  // Sand+Lava→Glass is GONE as of Phase 2.6 — SCIENCE.md flagged it as the
  // game's least defensible recipe (glass needs ~1700°, lava only reaches
  // ~1150–1200°, so lava genuinely cannot melt sand into glass) and named
  // Lightning as the intended real fix. Sand+Lightning→Glass below replaces
  // it: lightning is ~30,000° and striking sand really does fuse it into
  // glass tubes (fulgurite). See SCIENCE.md's "What's still fake" section.
  { a: E.SAND,  b: E.WATER, wets: true,
    why: 'Wet sand just looks darker — it doesn’t become a new substance.' },
  { a: E.DIRT,  b: E.WATER, aTo: E.MUD,   bTo: E.EMPTY, prob: 0.06,
    why: 'Soil that absorbs water becomes mud — the water is soaked in, not left behind.' },
  { a: E.SEED,  b: E.MUD,   aTo: E.PLANT, bTo: E.MUD,   prob: 0.03,
    why: 'Seeds germinate in moist soil, never in open water or dry dirt alone.' },
  { a: E.SEED,  b: E.FIRE,  aTo: E.FIRE,  bTo: E.FIRE,
    why: 'A dry seed touching flame combusts instantly — too small to leave any ash behind.' },
  { a: E.PLANT, b: E.FIRE,  aTo: E.FIRE,  bTo: E.FIRE,  burnt: true,
    why: 'Plant matter is wood and cellulose — it burns, and burning organic matter leaves ash.' },
  { a: E.PLANT, b: E.LAVA,  aTo: E.FIRE,  bTo: E.LAVA,  burnt: true,
    why: 'Molten rock is far past wood’s ignition point — contact is instant combustion.' },
  { a: E.ICE,   b: E.FIRE,  aTo: E.WATER, bTo: E.EMPTY,
    why: 'Direct flame overwhelms a small block of ice fast enough to melt it and snuff itself out in one contact.' },
  { a: E.ICE,   b: E.LAVA,  aTo: E.WATER, bTo: E.OBSIDIAN,
    why: 'Ice quenches lava on contact just like water does — same chemistry, colder starting point.' },
  { a: E.WATER, b: E.ICE,   aTo: E.ICE,   bTo: E.ICE,   prob: 0.0015,
    why: 'Water in direct, sustained contact with ice can slowly freeze onto it — real, just slow, so it’s capped low.' },

  // ---- Phase 2.6 reactions (see SCIENCE.md "New elements") ----
  { a: E.SAND,     b: E.LIGHTNING, aTo: E.GLASS,   bTo: E.EMPTY,
    why: 'Lightning is ~30,000° — sand struck by real lightning fuses into glass tubes called fulgurite. This is the accurate replacement for the old Sand+Lava recipe.' },
  { a: E.NEON,     b: E.LIGHTNING, aTo: E.GLOWING_NEON, bTo: E.EMPTY,
    why: 'A neon sign is exactly this: an electric discharge exciting neon gas, which glows orange-red in response.' },
  { a: E.IRON,     b: E.WATER, aTo: E.RUST, bTo: E.WATER, prob: 0.02,
    why: 'Iron rusts wherever it meets water and air — slow, real oxidation. (The ambient air supplies the oxygen; this engine only models two-body contact, so a separate Oxygen cell isn’t required for rust specifically — see PLAN.md.)' },
  { a: E.SALT,     b: E.WATER, aTo: E.SALTWATER, bTo: E.EMPTY, prob: 0.15,
    why: 'Salt dissolves completely into water — no separate grains left behind, just salt water.' },
  { a: E.SALTWATER, b: E.ICE,  aTo: E.WATER, bTo: E.WATER, prob: 0.3,
    why: 'Salt water melts ice on contact — literally why roads get salted before winter storms.' },
  { a: E.OIL,      b: E.FIRE,  aTo: E.FIRE,  bTo: E.FIRE,
    why: 'Oil ignites readily and burns hard once lit — a classic fire hazard for exactly this reason.' },
  { a: E.HYDROGEN, b: E.FIRE,  aTo: E.WATER, bTo: E.FIRE,
    why: 'Hydrogen burns explosively in air given any spark, and the product of that combustion is genuinely water (2H₂ + O₂ → 2H₂O) — this engine assumes ambient oxygen rather than requiring a separate Oxygen cell, same simplification as Iron rusting above.' },
  { a: E.FIRE,     b: E.OXYGEN, refuels: true,
    why: 'Fire needs oxygen to keep burning — more of it nearby means a fire lasts longer instead of starving out.' },
  
  // ---- Phase 7 reactions (Lantern and Rust Smelting) ----
  { a: E.PLANT,   b: E.STONE,   aTo: E.STRING, bTo: E.STONE,  prob: 0.05,
    why: 'Stone tools can be used to mash plant fibers into coarse string.' },
  { a: E.STRING,  b: E.OIL,     aTo: E.WICK,   bTo: E.EMPTY,  prob: 0.1,
    why: 'String absorbs oil readily to become a flammable wick.' },
  { a: E.WICK,    b: E.STONE,   aTo: E.LANTERN,bTo: E.EMPTY,  prob: 0.1,
    why: 'Placing a wick into a hollowed stone base creates a simple unlit lantern.' },
  { a: E.LANTERN, b: E.FIRE,    aTo: E.LIT_LANTERN, bTo: E.EMPTY, prob: 1.0,
    why: 'Lighting the wick turns the lantern on.' },
  { a: E.LIT_LANTERN, b: E.WATER, aTo: E.LANTERN, bTo: E.STEAM, prob: 1.0,
    why: 'Water quenches the lit lantern, turning it back into an unlit lantern.' },
  
  // Phase 8: Biology
  { a: E.WATER,   b: E.LIGHTNING, aTo: E.AMINO_ACID, bTo: E.EMPTY, prob: 0.05,
    why: 'Miller-Urey experiment: Lightning strikes forming organic compounds in the primordial soup.' },
  { a: E.AMINO_ACID, b: E.WATER,  aTo: E.MICROBE, bTo: E.WATER, prob: 0.02,
    why: 'Amino acids self-assemble into basic single-celled life over time.' },
  { a: E.MICROBE, b: E.OXYGEN,    aTo: E.ALGAE,   bTo: E.WATER, prob: 0.02,
    why: 'Microbes evolve into photosynthetic algae in the presence of oxygen.' },
  { a: E.ALGAE,   b: E.DIRT,      aTo: E.PLANT,   bTo: E.DIRT,  prob: 0.05,
    why: 'Algae colonizing land evolves into complex plant life.' },
  { a: E.ALGAE,   b: E.WATER,     aTo: E.ALGAE,   bTo: E.ALGAE, prob: 0.05,
    why: 'Algae blooms rapidly reproduce in water.' },

  // Phase 9: Weather
  { a: E.CLOUD,   b: E.ICE,       aTo: E.SNOW,      bTo: E.ICE, prob: 0.2,
    why: 'Clouds freezing at high altitudes precipitate as snow.' },
  { a: E.CLOUD,   b: E.ASH,       aTo: E.ACID_RAIN, bTo: E.EMPTY, prob: 0.1,
    why: 'Particulate pollution mixes with atmospheric water to form acid rain.' },
  { a: E.ACID_RAIN, b: E.STONE,   aTo: E.EMPTY,     bTo: E.EMPTY, prob: 0.05,
    why: 'Acid rain dissolves limestone and solid rock.' },
  { a: E.ACID_RAIN, b: E.PLANT,   aTo: E.EMPTY,     bTo: E.EMPTY, prob: 0.5,
    why: 'Acid rain is highly toxic and kills vegetation.' },
  
  // Phase 10: Electricity
  { a: E.BATTERY, b: E.COPPER,    aTo: E.BATTERY,   bTo: E.SPARK, prob: 0.5,
    why: 'A battery introduces an electric charge into a conductive medium.' },
  { a: E.SPARK,   b: E.COPPER,    aTo: E.SPARK,     bTo: E.SPARK, prob: 0.8,
    why: 'Electric charge travels along the conductive copper wire.' },
  { a: E.SPARK,   b: E.NEON,      aTo: E.EMPTY,     bTo: E.GLOWING_NEON, prob: 1.0,
    why: 'A low-voltage spark is enough to excite neon gas into glowing.' },
  { a: E.SPARK,   b: E.WATER,     aTo: E.EMPTY,     bTo: E.LIGHTNING, prob: 0.1,
    why: 'Electricity discharging into water creates a massive, dangerous short-circuit.' },

  { a: E.VOLCANO, b: E.STONE,     aTo: E.VOLCANO,   bTo: E.LAVA, prob: 0.05,
    why: 'Deep magma vents melt surrounding rock into fresh, flowing lava, causing eruptions.' },
  { a: E.VOLCANO, b: E.DIRT,      aTo: E.VOLCANO,   bTo: E.LAVA, prob: 0.05,
    why: 'Deep magma vents incinerate soil into fresh, flowing lava, causing eruptions.' },

  { a: E.VINEGAR, b: E.BAKING_SODA, aTo: E.FOAM, bTo: E.FOAM, why: 'Acid-base reaction produces CO2 gas (foam)!' },

  // Phase 2: Autonomous Life Reactions
  { a: E.FISH, b: E.ALGAE, aTo: E.FISH, bTo: E.FISH, prob: 0.1, why: 'Fish eat algae to survive and reproduce.' },
  { a: E.BUG, b: E.PLANT, aTo: E.BUG, bTo: E.BUG, prob: 0.05, why: 'Bugs eat plants and multiply.' },

  // Phase 3: Nuclear Physics Reactions
  { a: E.URANIUM, b: E.EMPTY, aTo: E.URANIUM, bTo: E.RADIATION, prob: 0.02, why: 'Uranium decays into invisible radiation.' },
  { a: E.RADIATION, b: E.LEAD, aTo: E.EMPTY, bTo: E.LEAD, why: 'Lead shields against radiation.' },
  { a: E.RADIATION, b: E.FISH, aTo: E.EMPTY, bTo: E.ASH, why: 'Radiation is lethal to living creatures.' },
  { a: E.RADIATION, b: E.BUG, aTo: E.EMPTY, bTo: E.ASH, why: 'Radiation is lethal to living creatures.' },
  { a: E.URANIUM, b: E.WATER, aTo: E.URANIUM, bTo: E.STEAM, prob: 0.5, why: 'Uranium generates intense heat, boiling water immediately.' },

  { a: E.RUST,     b: E.ASH,   aTo: E.IRON,   bTo: E.EMPTY, minTemp: 1000,
    why: 'Smelting: Carbon (in ash) mixed with iron oxide (rust) at high temperatures strips the oxygen, yielding pure iron and completing the cycle.' }
];
