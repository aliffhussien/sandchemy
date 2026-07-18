# ⚗️ Sandchemy

A falling-sand physics toy where **physics IS the crafting system**. Pour water
on lava and you don't just get a splash — you *discover Obsidian*, and your
Discovery Journal remembers the recipe forever.

**The gap it covers** (from research, 17 Jul 2026): Sandspiel fans wanted deeper
chemistry, alchemy-game fans hate forgetting recipes, and Infinite Craft wipes
your board. Sandchemy = simulation + discovery + a journal that remembers.
Everything is saved in your browser only (localStorage) — no server, no
account, no data leaves your device.

## Run it

Open `index.html` in any browser. That's it.

## How to update weekly (IMPORTANT)

**Only touch `elements.js`.** Elements and reactions are pure data:

1. Add an id to `E`, an entry to `ELEMENTS` (name, emoji, color, type).
2. Add its recipe(s) to `REACTIONS`.
3. Done — palette, journal, physics, and discovery toasts all pick it up
   automatically. `game.js` (the engine) should not need edits for content.

## Phase 2.7 — Acid (19 Jul 2026)

- New Acid element: a real alternative to the Erase button (which stays
  exactly as it is), not a replacement — a genuine substance that destroys
  things through actual chemistry.
- Acid dissolves Iron and releases real Hydrogen gas (which can then drift
  to a flame and become Water, chaining into the existing Hydrogen).
- Acid slowly dissolves Stone, the same way acid rain erodes limestone.
- Acid deliberately does NOT dissolve Gold (gold famously resists ordinary
  acids — the same real-world fact behind aqua regia) or Glass (only
  hydrofluoric acid attacks glass) — both confirmed by testing, not just
  assumed from omission.
- `elements.js` only; `game.js`/`effects.js` untouched.

## Phase 8 — Panelized layout (19 Jul 2026)

- The palette (54 elements!) used to be one long flat wall above the
  canvas — the real source of clutter. It's now grouped into 8 category
  tabs (Basics, Metals, Gases, Chemistry, Electric, Weather, Life,
  Crafting) inside its own bounded, scrollable panel.
- The whole layout is now a proper 3-column HUD: palette on the left,
  canvas+toolbar as the dominant center stage, Discovery Journal on the
  right — instead of the palette stacked above everything else.
- Erase is now a permanently pinned button at the bottom of the palette
  panel, reachable no matter which category tab is open.
- Discovering a new element automatically switches to its tab so the
  "new element!" animation is actually visible.
- Collapses to a clean single stacked column (palette → canvas → journal)
  on narrow/mobile screens, with no horizontal overflow at any width
  tested.
- One small, intentional behavior change: the `1`-`9`/`0` keyboard
  shortcuts now pick from the *current tab* instead of the whole palette —
  documented in the cheatsheet text and in PLAN.md.

## Phase 7d — Onboarding (19 Jul 2026)

- First-time visitors now get a short 3-step walkthrough: pick an element
  from the palette, paint it on the canvas, watch discoveries log
  automatically in the journal — each step highlights the real element with
  a gold ring and a small card, Skip anytime.
- The last step's "Show keyboard shortcuts" button hands off directly to
  Phase 7b's own cheatsheet instead of building a second help system.
- Shows once per browser (localStorage-gated) — confirmed live across an
  actual reload, for both the Skip path and the complete-the-sequence path.
- New `onboarding.js` only; no engine files touched.

## Phase 7c — UI redesign (19 Jul 2026)

- Toolbar is now icon-only (with tooltips + aria-labels, so nothing lost
  for accessibility) and noticeably more compact — a tidy row of squares
  instead of nine differently-sized text buttons.
- Clear and Reset (the two destructive actions) now live behind a
  collapsed ⚙ menu instead of sitting inline, cutting down on accidental
  clicks.
- Found and fixed a real bug along the way: the canvas could silently
  distort on phone-width screens (two old CSS rules fighting each other
  meant the box shrank in width but stayed pinned to a fixed height) —
  confirmed via actual measured aspect ratio before (1.119, wrong) and
  after (1.500, correct) the fix.
- `index.html`/`style.css` only, plus three tiny one-line label-string
  tweaks in game.js/effects.js/audio.js (their pause/effects/mute *logic*
  is untouched — see PLAN.md for why those three lines specifically had to
  change for icon-only to actually work).

## Phase 7b — Keyboard shortcuts (19 Jul 2026)

- Full keyboard control: Space to pause, `[`/`]` for brush size, Ctrl/Cmd+Z
  to undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) to redo, 1-9/0 to quick-pick
  palette elements, E/P/L/M to toggle Effects/Probe/Lab/Mute, Esc to close
  modals, and `?` (or the new ⌨️ Shortcuts button) for a full cheatsheet.
- Every shortcut calls the exact same function its matching button already
  calls — nothing reimplemented, so if a button's behavior ever changes the
  shortcut inherits it automatically.
- Found and fixed two real bugs live: closing a modal with Escape used to
  leave a text field silently focused, blocking every shortcut afterward;
  and Escape was originally blocked by its own "don't fire while typing"
  guard. Also found and fixed a real service-worker bug from Phase 7a while
  testing this one — cache-first meant edited files could get stuck on
  their very first cached version forever, contradicting this project's own
  weekly-update model; rewritten to network-first.
- New `shortcuts.js` only; `game.js`/`effects.js` untouched.

## Phase 7a — PWA installability (19 Jul 2026)

- Sandchemy can now be "installed" (Add to Home Screen / desktop app) on
  Chrome/Android/desktop, with a subtle floating "📲 Install Sandchemy" pill
  instead of the browser's own inconsistent native banner. Dismissing it
  (×) sticks — it won't nag again on that device.
- iOS Safari never fires the install event real browsers use, so it gets a
  different message instead: a plain "tap Share → Add to Home Screen" tip.
- New `manifest.webmanifest` + a minimal `sw.js` that caches just the static
  app shell (html/css/js/icons already shipped in this repo — no new
  network calls, no analytics, same zero-leak promise as always).
- New app icon: a gold Phosphor "flask" glyph on the app's own dark navy
  background, at every size Android/iOS/desktop need (192, 512, a maskable
  512 for Android's safe-zone cropping, and a 180 apple-touch-icon).
  Replaces "no real icon, just the ⚗️ emoji" with actual generated artwork.
- `elements.js`/`game.js` untouched — this is pure add-on chrome, same
  "engine never touched" guarantee every visual-only phase has kept.
- Live-verified in a real browser: manifest parses correctly, service
  worker registered and actively caching the right files, and — the
  strongest possible signal — Chrome's own installability check approved
  the site for real (`beforeinstallprompt` fired on load). Dismiss-and-
  stays-dismissed confirmed across an actual reload. Existing paint/sim/UI
  confirmed unaffected, zero console errors.
- A real OS-level install was deliberately skipped by request — Aliff was
  asked and chose not to add a placeholder-icon app to his Mac just to
  prove it further, since Chrome approving the install prompt was already
  definitive. Full detail in PLAN.md's Phase 7a section.

## Phase 4.6 — Material textures (19 Jul 2026)

- **Every solid material finally looks like what it is.** Wall now shows a
  real mortar-line brick grid, Stone and Obsidian read as a scatter of
  distinct rock chunks instead of a flat grey disc, Wood shows horizontal
  grain streaks, Iron/Copper/Lead/Gold/Battery all get a diagonal metallic
  sheen, and Glass sparkles with small faceted highlights.
- **Stable, not flickery:** every pattern is generated from the cell's own
  (x, y) position through a small deterministic hash — never
  `Math.random()` per frame — so a painted rock keeps the exact same look
  frame after frame instead of shimmering like static.
- Lives entirely in `effects.js` (one new `texture:` field read from
  `elements.js`, one new pass folded into the same per-frame scan Phase 3/4
  already run — no new full-grid loop). `game.js` was not touched at all
  this session; Stone is still `type: 'static'`, unchanged.
- Verified headlessly against the real engine, 34/34 checks, 5x with zero
  flakes — texture scope, position-seeding, a 3.5M-call NaN/Infinity sweep
  on a busy scene, and existing physics regressions all hold.

## Phase 6 — Sound & final polish (18 Jul 2026)

- **Web Audio Engine**: Complete, pure procedural Web Audio API sounds for the game without loading a single audio file. Implemented continuous fire rumble, a sizzle loop (dynamically modulated by the amount of steam and fire), a sand patter hook, and a pleasant FM discovery chime.
- **Mobile Polish**: Enforced `user-scalable=no` so you don't accidentally zoom while pouring sand. Made the palette chips larger to provide a 44px+ touch target ideal for thumbs.
- **Settings & Reset**: Added a mute button and a "Reset" button (with confirmation) to factory reset all data if needed. 
- The codebase is now officially considered **feature-complete**.

## Phase 5 — 100% Custom Sandbox (18 Jul 2026)

- **Element Lab 🧪**: A new in-app modal that lets players define their own elements completely from scratch, without editing code. Choose an emoji, name, color, physics behavior (powder, liquid, gas, static), and define up to 3 custom reactions (e.g., touching X turns into Y and Z).
- **Multiple Worlds**: Players can now save the state of their grid into named world slots in `localStorage`, and load them at any time or delete them.
- **Export & Import Codes**: Easily share custom elements or worlds without a server! Generating an export code creates a short Base64 text string that players can share via WhatsApp or paste elsewhere. Importing the text string immediately reconstructs the element or world.
- **Zero Engine Edits**: Injected custom elements straight into `ELEMENTS` and `REACTIONS` right before the main engine `game.js` runs. By keeping the engine purely data-driven, we didn't touch the core physics logic at all. 

## Phase 4 — depth / 2.5D (18 Jul 2026)

- **Edge shading (bevel)**: sand piles, walls, and anything else solid now
  get a light highlight where there's open space up-left and a dark shadow
  where there's open space down-right — instant "this is lit and rounded,"
  not a flat block. Skips gas/fire, which don't have a surface to bevel.
- **Day/night cycle**: a smooth ambient wash tied to your computer's actual
  clock — real midnight is the darkest, real noon is the brightest, with
  lava/fire's glow punching back through the dark wash so hot things read
  as relatively brighter at night without changing color. A genuine
  "calm-app" touch, not a fake in-game timer.
- **Parallax backdrop**: empty space now shows a soft cave-ceiling-to-floor
  gradient with a handful of distant silhouettes slowly drifting sideways,
  instead of flat dark. Ages with the same day/night clock as everything
  else, so foreground and background never look like two different times
  of day.
- All three still live entirely in `effects.js` on the same overlay canvas
  Phase 3 built — `elements.js` and `game.js` were not touched at all this
  session. The reflection stretch goal from the plan was skipped on purpose
  (explicitly optional, and three solid required features were enough for
  one session).
- Physics regression (49/49) and Phase 3's own visual integration suite
  (7/7) both re-confirmed unchanged, plus a new Phase 4 check (10/10) that
  pins a fake clock to true midday and true midnight and confirms the
  backdrop, edge shading, and night wash all actually fire and produce sane
  values — 5 runs, zero flakes.
- **Honest gap, same as Phase 3**: this proves the code runs correctly, not
  that it looks good. Chrome extension still wasn't connected this session,
  so the actual "do piles look rounded, does night look distinct from day"
  visual check is still open — flagged clearly in PLAN.md.

## Phase 3 — visual juice (18 Jul 2026)

- New `effects.js` draws glow, particles, heat shimmer, and a wet-water
  highlight on a **separate overlay canvas** stacked on top of the sim —
  `game.js` itself only gained one guarded line (`renderEffects()`, called
  right after the existing `render()`), so the simulation runs exactly as
  before if effects.js isn't even loaded.
- **Glow**: anything with a positive `heatEmit` (Fire, Lava, Lightning,
  Molten Gold, Molten Lead) now bathes its cell in a soft additive bloom —
  reuses the existing field, no new data needed.
- **Particles**: sparks drift up from Fire, smoke from Lava, bubbles from
  Water/Salt Water once it's genuinely close to boiling, and a dust puff
  fires the instant a falling Sand grain lands. Data-driven via a new
  `particle:` field in elements.js, capped at 200 particles on screen so a
  busy scene can never turn into a slideshow.
- **Heat shimmer**: a cheap classic fake — the row just above hot cells gets
  redrawn from the main canvas, offset by a small sine wave, at partial
  opacity. Reads as wavering heat haze.
- **Wet look**: water's exposed surface now gets an occasional animated
  highlight pixel (Phase 1's wet-sand-darker effect was already there and
  is untouched).
- New ✨ **Effects** button toggles all of it off instantly — doubles as an
  fps escape hatch, and the choice is remembered in localStorage.
- Physics regression suite re-confirmed **49/49 passing, unchanged** — Phase
  3 didn't touch sim behavior. A new integration harness ran the real
  effects.js against a fake-but-API-complete Canvas2D context for 300 frames
  of a busy scene: no crashes, no NaN reaching any draw call, particle count
  stayed within budget — 7/7 checks, 5 runs, zero flakes.
- **Honest gap**: this proves the code runs correctly, not that it looks
  good. The Chrome extension wasn't connected this session, so the actual
  "does the glow/particles/shimmer look right" pass — the plan's own
  side-by-side-screenshot bar — is still open. Flagged clearly in PLAN.md
  rather than called done.

## Phase 2.6 — new elements: metals, gases, lightning, salt, oil (18 Jul 2026)

- 11 new elements, each earned against SCIENCE.md's filter ("does something
  you can SEE that nothing already in the game does"): **Gold** and **Iron**
  (same Lava, opposite outcome — Gold melts at 1064°, Iron's 1538° is out of
  reach), **Lead** (melts via ordinary Fire), **Mercury** (liquid metal at
  room temp, freezes solid touching Ice), **Oxygen** (keeps Fire burning
  longer instead of it aging out on a fixed clock), **Hydrogen**
  (Hydrogen + Fire → Water, real 2H₂+O₂ chemistry), **Neon** (inert until
  Lightning excites it into a glow, fading back after a timer), **Lightning**
  (~30,000°, fuses Sand into Glass, excites Neon), **Salt** (dissolves into
  Salt Water, which melts Ice — literally why roads get salted), **Oil**
  (floats on Water, burns hard), **Rust** (what Iron becomes near Water).
- **Sand + Lava → Glass is gone.** SCIENCE.md called it the game's least
  defensible recipe (glass needs ~1700°, Lava tops out ~1150-1200°). Sand +
  Lightning → Glass replaces it — real fulgurite chemistry, and it actually
  needs the heat lightning brings.
- Two small generic engine hooks, both reused patterns rather than new
  special cases: `refuels: true` (a reaction flag that resets a cell's age
  without changing its id — Oxygen uses it to extend Fire's burn) and a
  generalized `revertsTo`/`revertsAfter` (used to be Steam-only hardcoding,
  now any gas can fade back to another element after a timer — Glowing Neon
  reuses it too). `TEMP_MAX` raised to 35000 so Lightning's heat doesn't hit
  the safety clamp.
- **Found and fixed a real engine bug, likely present since Phase 1:** touch
  reactions changed a cell's id but never reset its temperature — so e.g.
  cold Ice becoming Water via a touch reaction kept its old sub-zero
  reading, which is below Water's own freeze point, causing an invisible
  same-frame re-freeze back to Ice before anyone could see the Water. Fixed
  by resetting temperature on every touch-reaction conversion, the same way
  painting, loading, and moving already did.
- Two design findings worth knowing, not bugs: a *small* lava pool can fail
  to melt Gold (Gold has no heat of its own, so it locally cools its lava
  neighbors below their solidus and stalls — a large pool has enough
  thermal mass to push through); and Mercury only freezes touching Ice
  directly, not from a short distance the way Lava melts Ice at range
  (its freeze gap is ~64° vs Lava's 1000°+, too small to carry across cells).
- Verified headlessly, 49/49 checks, against the real unmodified engine, run
  10 times in a row with zero flakes. **Live browser pass still pending** —
  the Chrome extension wasn't connected this session, same gap Phase 1 and
  Phase 2 hit before their own follow-up sessions closed it. Full detail in
  PLAN.md.

## Phase 2.5 — real-world numbers (18 Jul 2026)

- Replaced every invented number in `elements.js` with a real, sourced one
  (full table + sources in SCIENCE.md): temperatures are real °C now (water
  0°/100°, lava 1150°, wood ignites at 300°, ambient 25°), every element has
  a real density, and Lava turns to Stone via its real solidus (950°) instead
  of a random dice-roll — reusing Water's existing freeze mechanism rather
  than adding a new one.
- **Ice floats on Water now** (density 917 vs 1000) instead of hanging static
  in mid-air — Ice is `type: 'powder'` and the engine's "sink through
  liquids" check compares real densities instead of a flat coin-flip, so
  Sand (1600) still sinks through Water while Ice doesn't.
- Found and fixed three real engine bugs while tuning the new scale: an
  integer temperature buffer that could permanently stall a cell exactly at
  its own threshold (switched to floats), moving cells leaving their
  temperature behind and inheriting the destination's instead (temperature
  now travels with the substance), and Sand's cosmetic "wet" reaction
  accidentally blocking it from ever sinking through water (fixed to not
  consume the cell's turn).
- **Honest side-effect:** since ambient (25°) is realistically above Ice's
  melting point now, Ice slowly melts even sitting in plain air over time —
  it didn't under the old invented scale. That's real physics, not a bug,
  but it's a genuine behavior change (Ice → more of a "use it before it
  melts" resource) worth knowing about. Lava proximity still melts it
  measurably faster than ambient alone.
- One deliberate deviation from SCIENCE.md's literal table: Ice's `heatEmit`
  is -40, not the literal 0° listed — sitting exactly at its own melt point
  with ambient above it meant Ice would instant-melt the moment it was
  placed. -40 gives it real headroom.
- Verified headlessly, 27/27 checks, against the real unmodified engine
  (all Phase 1 regressions + wall-blocks-heat + Sand+Lava minTemp
  pool-vs-trickle + radiant boiling + radiant ice-melt-near-lava without
  touching + the new density/threshold/clamp/old-save checks).
  **No browser session was available this session** — still needs a live
  visual pass before this phase is fully closed, same as Phase 1 and 2 both
  needed. Details and the exact numbers behind every constant are in
  PLAN.md.

## Phase 2.1 — tuning fix for ice-melt-at-distance (17 Jul 2026)

- Live testing found 3 of Phase 2's 4 payoffs worked but ice melting from a
  short distance stalled beyond ~1 cell. Two causes: heat diffusion decayed
  too fast crossing open air, and Lava's exposed face would crust into
  heat-dead Stone (a Phase 1 rule) before enough warmth got across.
- Fix: `TEMP_DIFFUSE` 0.5→0.9, `TEMP_DECAY` 0.996→0.999, Lava `coolChance`
  0.01→0.003 (solidifies ~3x slower). No other thresholds needed to change.
- Re-verified all 4 Phase 2 payoffs plus every Phase 1 regression headlessly
  (22 checks, all passing) — ice now reliably melts from 2 cells away
  without breaking wall-blocking, glass-needs-a-real-pool, or the
  many-fires-boil-water behavior that already worked.
- **Live browser re-check done (17 Jul 2026, follow-up session): confirmed.**
  Set up lava and ice with a real 2-cell open-air gap between them, walled so
  nothing could flow across and cheat. Heat crossed the gap (gap hit ~48°, the
  ice face reached 6° — above its 3° melt point) and ice melted **before any
  lava touched it** (`lavaEnteredGap: false`). Zero console errors.
  Honest detail worth keeping: the block doesn't fully vanish — after the
  face melts, that meltwater flows back to the lava and quenches it to
  Obsidian, which forms a cold insulating crust that self-limits further
  melting. That's emergent and physically plausible (chilled lava crust is
  real volcanology), not a bug. The payoff — "lava melts ice from a short
  distance without touching" — holds.

## Phase 2 — temperature layer (17 Jul 2026)

- New per-cell `temp` array: Fire and Lava radiate heat, Ice radiates cold,
  heat diffuses through open air and neighboring cells, walls block it
  completely, and everything decays back toward ambient over time.
- New optional data fields for future elements: `heatEmit`, `meltsAt`/`meltsTo`,
  `boilsAt`/`boilsTo`, `freezesAt`/`freezesTo`, `ignitesAt`, `burnsToAsh`.
- Payoffs this unlocks: lava melts ice from a short distance (no touching
  needed), a wall between a heat source and ice fully protects it, sand only
  turns to Glass once it's pressed against a real lava mass (a thin trickle
  isn't hot enough), water surrounded by several fires can slowly boil away
  without ever touching them, and plants can catch fire from nearby heat.
- All the original instant touch reactions (dousing fire with water, quenching
  lava with water or ice, etc.) are untouched and still fire first — the new
  radiant heat only kicks in for things that aren't directly touching.
- Verified headlessly: 24 checks (7 Phase 1 regressions + 15 Phase 2 checks
  covering all 4 required payoffs) all passing against the real, unmodified
  engine, plus a busy-grid timing pass.
- **Live browser follow-up (17 Jul 2026): 3 of 4 payoffs confirmed, 1 needs a
  tuning pass.** Wall-blocks-heat, water-boils-near-fire, and
  glass-needs-real-lava-mass all confirmed working exactly as designed.
  Lava-melts-ice-at-distance only works at ~1 cell of true gap and stalls
  beyond that — heat decays too fast crossing open air, and the lava face
  touching the gap cools to inert Stone over time (Phase 1's rule), so the
  effective heat source recedes. Full root-cause + fix ideas in PLAN.md under
  "Phase 2.1 follow-up". 60fps and zero console errors reconfirmed live under
  a maximally busy scene. Phase 2 stays open until 2.1 closes this gap.

## Phase 1 — chemistry fixes (17 Jul 2026)

- Added **Dirt 🟫** as a starter element.
- Mud is now real: `Dirt + Water → Mud`. `Sand + Water` no longer makes Mud —
  it just darkens the sand slightly (wet look, same element).
- Seeds no longer sprout in plain water — only on Mud (which itself only
  forms where Dirt meets water), so "wet ground, not open water" now holds.
- `Water + Ice → Ice` at very low probability — water can slowly freeze
  next to ice, capped low so it can't take over the whole map.
- Added **Stone 🪨** (discoverable): Lava left touching open air for a while
  cools into Stone. Lava quenched by water still makes Obsidian (fast
  cooling = glassy, slow cooling = rock).
- Verified headlessly by running the real `elements.js` + `game.js` engine
  (22 checks, all passing) and by inspection: old saves still decode
  correctly since no existing element ids changed.
- Later verified live in a real browser too: every rule above confirmed by
  painting it onto the running page, all 7/7 discoveries triggered correctly,
  zero console errors, and a full page reload restored everything from
  localStorage as expected. Details in PLAN.md.

## v1 (17 Jul 2026)

- 8 starter elements: sand, water, fire, lava, ice, seed, wall (+ eraser)
- 6 discoverable: steam, obsidian, glass, mud, plant, ash
- Discovery Journal with auto-recorded recipes, saved to localStorage
- Sandbox auto-saves every 5s and on close

## Roadmap

See **PLAN.md** — the master phased plan to "perfect custom sandbox"
(chemistry fixes → temperature → visual juice → 2.5D depth → Element Lab →
sound → material textures). One phase per session, in order.

**Phase 7 and Phase 8 are both fully shipped** — all four Phase 7
sub-phases (7a PWA installability, 7b keyboard shortcuts, 7c UI redesign,
7d onboarding) plus Phase 8's panelized layout are done and live-verified;
see the changelog entries above and PLAN.md for full detail. Next up: pick
a new phase, or fold in a weekly content-only update (new elements via
`elements.js` only, per this file's own maintenance model above).

Extra ideas for after the plan is complete: daily discovery puzzles,
rare/secret elements, journal PNG export.
