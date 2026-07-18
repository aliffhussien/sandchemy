# Sandchemy — Master Plan to "Perfect Custom Sandbox"

> **For any Claude/Cowork session picking this up:** read this file + README.md
> first. Do ONE phase per session, in order. Do not start a phase until the
> previous one is done and verified in the browser. Keep the golden rule:
> content = data in `elements.js`, engine = `game.js`. Never break that split.
>
> **Preview gotcha (macOS):** the preview server cannot read ~/Documents.
> After editing, rsync this folder to the session scratchpad and serve from
> there (see the `sandchemy` entry pattern in `Documents/.claude/launch.json`).

> **Phase 7 (7a/7b/7c/7d) AND Phase 8 (panelized layout) are both fully
> shipped (19 Jul 2026), live-verified.** All of Phase 7's sub-phases plus
> Phase 8 were built in one continuous session at Cat's explicit request to
> push through despite the "one phase per session" rule below — every
> sub-phase/phase was still verified live in the browser before moving to
> the next, and flagged open decisions (7c's, then Phase 8's) were still
> asked rather than guessed. **Next up: pick a new Phase from here, or
> start a fresh weekly content update (new elements via `elements.js` only,
> per README's own maintenance model).** The old sub-phase kickoff prompt
> below is kept for reference/history:
>
> ```
> Read PLAN.md and README.md in this repo (Sandchemy — a falling-sand
> physics sandbox, plain HTML/CSS/JS, no build step, no server, no
> framework). I'm picking up Phase 7<a|b|c|d> exactly as scoped in PLAN.md's
> "Phase 7" section — read that section in full before writing any code,
> it has the concrete open decisions, file list, and done-when criteria for
> this specific sub-phase. Ask me anything flagged there as an open decision
> before you build, rather than guessing. Follow this repo's standing rules:
> one phase per session, verify live in a browser before calling it done
> (not just headless), never touch elements.js's content/engine split
> unnecessarily, and update PLAN.md + README.md with what actually shipped
> (with today's date) when you're done, the same way every prior phase in
> PLAN.md is documented.
> ```

**Vision (Aliff's words):** perfect, 100% custom sandbox. Logically smart —
reactions should feel real. Visuals so good it feels alive ("3D feel").
Weekly small updates, never overwhelming, easy to maintain, zero servers,
zero data leaving the device.

**Honest scoping decision (agreed 17 Jul 2026):** NO true 3D rewrite — that
would mean a new engine and permanent complexity. Instead: real physics +
lighting + particles on the existing 2D engine ("2.5D"). This is how Noita
and Terraria feel alive. If after Phase 4 Aliff still wants true 3D, that is
a NEW project, not an update to this one.

---

## Phase 1 — Fix the chemistry (make every reaction defensible)

Goal: every recipe in the game can be explained in one sentence of real logic.

- Add **Dirt** 🟫 as a starter element (powder, dark brown).
- Fix mud: `Dirt + Water → Mud` (real). Remove `Sand + Water → Mud`;
  sand + water now just darkens the sand color slightly (wet look, no new element).
- Seeds only sprout on Mud or Dirt (+ water nearby), not in plain water.
- Add `Water + Ice → Ice` at very low probability (water slowly freezes when
  touching ice) — cap it so it can't snowball across the whole map.
- Add **Stone** 🪨 (discoverable): lava that touches air long enough cools to
  Stone; lava quenched by water still makes Obsidian (fast cooling = glassy —
  real volcanology).
- Update journal totals automatically (already data-driven — verify only).

Files: `elements.js` only (plus README changelog).
Done when: all new/changed recipes verified in browser; old saves still load.

**Note (done 17 Jul 2026):** two tiny *generic* engine hooks had to go into
`game.js` too — the engine's touch-reaction system can't react with an EMPTY
(air) cell, and had no way to change a cell's look without changing its id.
Added: `coolsTo`/`coolChance` (any element can slowly turn into another when
touching open air — used by Lava→Stone) and a `wets: true` reaction flag
(cosmetic-only, just darkens a cell, no id change — used by Sand+Water).
Both are reusable data-driven hooks, not element-specific hardcoding, so the
golden rule (content lives in `elements.js`) still holds. Seed sprouting
needed zero engine changes: Dirt only becomes Mud when water is nearby, and
Seed+Mud is the only sprout rule left, so "dirt + water nearby" sprouting
happens automatically through Mud.

**Browser verification (done 17 Jul 2026, follow-up session):** the session
that made the Phase 1 changes couldn't drive an actual browser (no Chrome
extension connected), so it verified with a headless engine harness only.
A follow-up session with working browser tools loaded the real page fresh,
cleared localStorage, and painted every scenario directly onto the live grid:
Dirt+Water→Mud confirmed, Sand+Water confirmed wet-look-only (28 wet cells,
0 spurious Mud), a seed sitting in plain water never sprouted, the same seed
touching Mud sprouted into a full plant, Lava sealed touching open air cooled
to Stone ("Lava + Air"), Lava+Water still produced Obsidian, and Sand+Lava
still produced Glass. Zero console errors at any point. Reloaded the page
afterward — all 7 discoveries and the world state restored correctly from
localStorage. Phase 1 is now verified end-to-end, not just headlessly.

## Phase 2 — Temperature layer (the realism engine)

Goal: reactions driven by HEAT, not just touch. This is the one sanctioned
engine upgrade — do it carefully, keep it simple.

- One extra array: `temp` (per-cell temperature, coarse integer).
- Hot elements (fire, lava) emit heat to neighbors; heat diffuses and decays.
- Element data gains optional fields in `elements.js`:
  `heatEmit`, `meltsAt → id`, `freezesAt → id`, `boilsAt → id`, `ignitesAt`.
- Convert existing touch-reactions that are really heat effects
  (ice melting, water boiling, plant igniting) to temperature rules.
  Keep true chemical reactions (water+lava→obsidian) as touch rules.
- Payoffs that must work: lava melts ice from a short distance; a wall
  between fire and ice protects the ice; glass forms only where lava is
  hottest; water near many fires slowly boils.
- Performance budget: still 60fps on MacBook Neo (fanless!) — if not, halve
  the temperature update rate (every 2nd frame) before optimizing anything else.

Files: `game.js` (one-time), `elements.js` (data fields).
Done when: the 4 payoff scenarios above verified in browser; fps still smooth.

**Status: all 4 payoffs verified LIVE in browser, no open items.** 3/4 were
confirmed in the first browser follow-up; the 4th (ice-melt-at-distance)
needed the Phase 2.1 tuning fix, and a second browser follow-up confirmed
that fix live too — see the verification notes below. Phase 2 is closed.

**Design notes (done 17 Jul 2026):**
- Kept ALL existing touch reactions (Water+Fire, Ice+Fire, Ice+Lava, Plant+Fire,
  Plant+Lava) exactly as they were, instead of literally "converting" them.
  Reasoning: touch = instant contact chemistry (dousing a flame, quenching
  lava — dramatic, already verified in Phase 1), temperature = NEW radiant
  physics for things that AREN'T touching (a short distance away). `step()`
  runs `updateTemperature()` last, after all touch reactions, so direct
  contact always gets first say and nothing that worked before regressed.
- `heatEmit` elements (Fire, Lava, cold Ice) always radiate their full heat
  to neighbors regardless of their own stored temperature — this is what
  lets a wall fully block conduction (walls are simply excluded from the
  neighbor average) while letting heat reach genuinely open, unwalled air.
- `minTemp` on the Sand+Lava→Glass reaction checks the SAND side's own
  temperature, not lava's — sand has to actually soak up enough heat itself
  (multiple lava faces, i.e. a real pool) before it glasses; one thin lava
  droplet touching it once isn't enough. This is the "hottest lava" payoff.
- Verified headlessly by running the real `elements.js` + `game.js` through
  a Node harness (24 checks — 7 Phase 1 regressions + 15 new Phase 2 checks
  covering all 4 required payoffs, plus a busy-grid performance sanity pass
  at ~6ms/frame in Node, well within a 60fps/16ms budget even before
  accounting for the browser being faster). No browser session was available
  this session (Chrome extension not connected) — a follow-up session should
  do a live visual pass the way Phase 1's follow-up did, and tick that off
  here if anything looks different from the headless numbers.

**Browser verification (done 17 Jul 2026, follow-up session) — 3/4 confirmed, 1 needs tuning:**

- ✅ **Wall blocks heat** — confirmed cleanly. Lava basin held at ~88° next
  to a wall; ice on the far side stayed at its own untouched baseline (-10°)
  the entire time. Wall temp always reads 0 (excluded from the neighbor
  average, exactly as designed).
- ✅ **Water boils near several fires without touching** — confirmed. A
  water pool ringed by fire on all 4 sides (3-4 cell gap, never touching)
  fully boiled away; journal recorded "Water + Heat", proving it went
  through the new radiant path, not the old touch reaction.
- ✅ **Sand only glasses against a real lava mass** — confirmed. A deep
  15-cell-tall sand-on-lava mass produced Glass; a single sand cell resting
  on a thin lava trickle did not.
- ⚠️ **Lava melts ice from a short distance — only works at ~1-cell gap,
  stalls beyond that, even for a tiny 3-cell ice sample** (not just large
  ice masses). Root cause has two compounding parts:
  1. **Open-air averaging is steep.** Each empty cell's new temp is an
     average of itself and up to 4 neighbors; with 1 hot neighbor and ~3
     ambient ones, temp drops roughly 4x per cell of gap crossed. Ice melts
     at t≥3, so in practice the source has to be almost adjacent.
  2. **Phase 1 and Phase 2 fight each other here.** The lava face exposed to
     the gap cools to Stone via Phase 1's `coolsTo` rule, and Stone has no
     `heatEmit` — so the effective heat source physically recedes from the
     gap over time, on top of the averaging problem above.
  The reason water-boil passed and ice-melt didn't isn't randomness — it's
  geometry: the water was surrounded by fire from 4 directions (heat arrives
  from every side, beating the per-cell averaging), while the ice was only
  heated from one face. **The engine handles enclosed/surrounding heat well
  and underperforms on one-directional radiant heat at range.** Confirmed
  reproducible: identical result across multiple retries and 10+ second
  waits (steady state, not "just needs more time"). Verified with `temp[]`
  readings directly, not just visual guessing — see scratch notes below if
  a future session wants the exact numbers.
- Performance re-confirmed live in-browser too, separately from the Node
  numbers above: 60fps sustained on a maximally busy full-grid scene (30%
  lava / 20% water / 10% ice / 5% fire all reacting at once). Zero console
  errors under that stress or at any other point in this verification pass.

**Phase 2.1 follow-up — DONE (17 Jul 2026):** fixed the ice-melt-at-distance
stall.

- `TEMP_DIFFUSE`: 0.5 → **0.9**. `TEMP_DECAY`: 0.996 → **0.999**. Root cause
  #1 (open-air averaging too steep) turned out to plateau once diffuse
  crosses ~0.85 — below that, a 3x3 lava pool's open face left ice at only
  temp 2 two cells away (meltsAt is 3, so it missed by one). Above ~0.85 the
  same setup reaches temp 12 at 2 cells — comfortably past threshold. Tried
  push past 1.0 too; no further gain, so settled mid-plateau rather than at
  the edge.
- Lava `coolChance`: 0.01 → **0.003**. Root cause #2 (exposed face crusting
  to heat-dead Stone) was real: at the old rate, melting a 2-cell-away ice
  target succeeded in only 5/8 trials (the face would sometimes turn to
  Stone before enough heat got across). At 0.003 it hit 8/8 across repeated
  trials. Lava still solidifies over time (roughly 3x slower now) — it just
  doesn't race the melt.
- **Re-verified everything, not just the fix**, per the warning below this
  note: all 4 Phase 2 payoffs plus every Phase 1 regression, headlessly
  against the real engine (22 checks, all passing) — wall-block, glass-needs-
  2-lava-faces, water-boils-near-many-fires, and the new 2-cell ice-melt all
  hold simultaneously with the same three constants. No threshold values
  (`meltsAt`, `boilsAt`, `freezesAt`, `ignitesAt`, `minTemp`) needed to
  change — only the two global diffusion constants and Lava's `coolChance`.
- Reach is now genuinely ~2 cells, not unlimited — a 3-cell gap stays at
  temp 0 in testing. That's an honest "short distance," matching the
  payoff's own wording; going further would need a different mechanism
  (multi-step diffusion per frame, or a longer-range kernel) and isn't
  worth the added complexity for what's still a stylized, sped-up sim.
**Phase 2.1 live browser verification — DONE (17 Jul 2026):** a follow-up
session with working browser tools closed the last open item.

- Rebuilt the exact scenario that failed before: lava, a genuine 2-cell air
  gap, ice — walled on every other side so nothing could physically flow
  across and invalidate the test. Paused the sim and stepped it manually.
- **Heat crossed the gap on its own**: the air cell in the gap reached ~48°,
  the ice face reached 6° — past its 3° melt point — with `lavaEnteredGap:
  false` confirmed the whole time. This is genuine radiant heat, not a
  touch reaction sneaking through.
- Melting started right on cue, then **stalled after ~135 cells** — but this
  turned out to be correct emergent behavior, not a bug: the melted ice
  becomes Water, that Water touches the Lava right next to it, and the
  existing instant touch rule (Water + Lava → Steam + Obsidian) quenches
  that patch of Lava into Obsidian immediately. Obsidian has no `heatEmit`,
  so it forms a real insulating crust and the melt front self-arrests —
  exactly the way a real lava flow crusts over where it meets water or wet
  ground. Documented as intended behavior, not something to "fix" — it's
  the kind of one-sentence-of-real-logic result Phase 1's whole premise was
  chasing.
- Zero console errors throughout. Sandbox reset clean afterward.
- **Phase 2 has no open items left.** Both browser follow-ups (this one and
  the earlier one) plus the headless harnesses all agree.

## Phase 2.5 — Real-world numbers (see SCIENCE.md)

Goal: replace every invented constant with a real, sourced one. Same engine,
same behaviour shape — accurate values. Full reference table, sources, and
the task list live in **SCIENCE.md**. Read that file, not this summary.

Short version: temperatures become real °C (water 0/100, lava 1150, wood
ignites at 300, ambient 25); every element gains a real density, which makes
ice float on water the way it actually does; lava turns to stone by dropping
below its real solidus (950°C) instead of a random dice-roll. Explicitly
NOT a physics-engine rewrite — that was considered and rejected in SCIENCE.md
for being too fragile to maintain safely.

Files: `elements.js` (most), `game.js` (density/float + a safety clamp).
Done when: every number matches SCIENCE.md; verified in browser; old saves load.

**Status: done and verified live in a browser (18 Jul 2026), following up on
the headless pass.** See "Live browser verification" note below the design
notes — no open items left.

**What changed, matching SCIENCE.md's task list:**
- Every temperature in `elements.js` is now real °C: Water freezes at 0 /
  boils at 100, Fire emits 900, Lava emits 1150, Plant/Seed ignite at 300,
  ambient is 25 (`AMBIENT` in `game.js`).
- Every element got a real `density` (kg/m³) from SCIENCE.md's table.
- Ice is `type: 'powder'` now (was `'static'`) and the powder "sink through
  liquids" check in `game.js` gained a real density comparison
  (`el.density > belowEl.density`) instead of a flat 25% coin-flip — this is
  what makes Ice float on Water while Sand still sinks through it.
- Lava's old `coolsTo`/`coolChance` dice-roll is gone entirely, replaced by a
  real solidus: `freezesAt: 950 → Stone`, reusing the exact same generic
  threshold mechanism Water already uses to freeze into Ice. One less special
  case in the engine, not one more.
- Added a `SRC_COLD` sentinel alongside the existing `SRC_HEAT` one, so the
  journal reads "Stone (Lava + Cold)" instead of the confusing "+ Heat" for
  a cooling-driven conversion.
- Added the guardrail clamp SCIENCE.md required: `TEMP_MIN`/`TEMP_MAX` on
  every cell's temperature every tick, so one bad constant in a future weekly
  update can look wrong, not crash the sim or overflow the buffer.
- Every `REACTIONS` entry got a one-sentence `why:` field — real-world
  justification, ready for the journal to show later.

**Three real engine bugs found and fixed empirically (not in SCIENCE.md's
task list — discovered by actually running the numbers, not just plugging
them in):**
1. **Integer truncation stalls threshold crossings.** `temp`/`tempNext` were
   `Int16Array`. The new real-°C scale needs slow diffusion (sub-1-degree-
   per-frame is normal for good pacing), and an integer buffer throws away
   that fractional progress every single frame — a cell can get permanently
   stuck exactly AT a threshold instead of ever crossing it. Caught this
   because Ice stalled dead at exactly 0° forever in testing. Fixed by
   switching both arrays to `Float32Array`.
2. **Moving cells left their temperature behind.** `trySwapOrMove` (and the
   new density-sink swap) moved `grid`/`age`/`meta` but never `temp` — so a
   falling Ice cell would instantly inherit whatever temperature was sitting
   in the ambient air cell it moved into, putting it on the wrong side of
   its own melt threshold the instant it moved, regardless of its real
   temperature a frame earlier. Only surfaced now because Ice actually moves
   as of this phase (it didn't in Phase 1/2/2.1). Fixed: temperature now
   travels with the substance on every move/swap.
3. **`wets` permanently blocked movement.** Sand+Water's cosmetic reaction
   returned `true` (consuming the cell's turn) every frame once touching —
   meaning Sand resting on Water could never reach the density-sink check
   and would float forever instead of sinking. Fixed by having it return
   `false` (still applies the cosmetic darkening, just doesn't block the
   cell's turn anymore).
- These were caught by building the same kind of controlled Node-vm test
  scenarios as Phase 2.1 (walled rooms, pinned/anchored cells so nothing can
  physically drift and invalidate a "not touching" test) and watching the
  actual numbers, not by reading the code and assuming it worked.

**One deliberate, documented deviation from SCIENCE.md's literal table:**
Ice's `heatEmit` is **-40**, not the literal 0°C the table lists ("ice sits
at its melting point"). Sitting exactly AT its own melt threshold with
ambient at 25° means even a sliver of diffusion pushes it over instantly —
confirmed empirically (it melted the same frame it was placed, at every
diffusion rate tried). -40 gives it real headroom: it survives a normal
scene for dozens of frames, and a lava/fire source measurably speeds up its
melting (confirmed: ~5-8% faster near lava through a real, non-touching gap
than sitting in plain air), without flash-melting on placement.

**A real, honest side-effect worth knowing about, not hidden:** because
ambient (25°) is now realistically ABOVE Ice's melting point (0°), Ice is no
longer eternal once placed — it slowly melts even in plain open air over
time, the way real ice actually does at room temperature. Under the old
invented 0-ambient scale this couldn't happen (ambient sat below the melt
threshold, so decay pulled temperature away from melting, not toward it).
This is physically correct and turns Ice from "permanent building material"
into more of a "use it before it melts" resource — a real behavior-shape
change from Phase 1/2/2.1, not a bug, and one Aliff should know about before
calling this "same behaviour shape, real values" the way SCIENCE.md framed
the goal. Lava proximity still meaningfully speeds this up, so the "melts
faster near heat" payoff holds — it's the "melts even with no heat" part
that's new.

**Constants landed on, via the same empirical sweep-and-measure methodology
as Phase 2.1** (Node-vm scenarios, walled/pinned so nothing can physically
touch and invalidate a radiant-only test): `TEMP_DIFFUSE` **0.02**,
`TEMP_DECAY` **0.995** (both much smaller than Phase 2.1's 0.9/0.999 — the
new scale's numbers are ~15-40x bigger, so much gentler per-frame pulls are
needed for comparable pacing). Sand+Lava's `minTemp` **400** (a thin lava
trickle peaks around 184° before its own exposed face crusts to Stone and
stops radiating; a real lava pool blows past 400° and keeps climbing for as
long as it stays a pool — 400 cleanly separates the two, same design intent
as before: sand needs a real mass, not a trickle).

**Verified headlessly (18 Jul 2026), 27/27 checks, against the real
unmodified `elements.js` + `game.js`:** all 6 Phase 1 regressions; wall
fully blocks radiant heat; Sand+Lava minTemp correctly separates a real pool
(glasses) from a thin trickle (never does); water boils radiantly near fire
without touching; ice melts from a real, walled, non-touching gap near lava
(and does so measurably faster than plain ambient exposure); Water's
freezesAt/boilsAt match 0/100 and ambient is 25; Ice floats on a water pool
instead of sinking through it while Sand sinks through the same pool to the
bottom; Lava crusts to Stone via the real solidus rule (not the old
coolChance) and the discovery reads "+ Cold"; an intentionally-absurd
constant doesn't crash the sim, produce NaN, or escape the clamp range; and
an old-format save (grid ids only, no temp data — exactly what
pre-Phase-2.5 saves look like) loads and runs without crashing, with Ice
surviving its first tick instead of instant-melting.

**Live browser verification — DONE (18 Jul 2026):** a follow-up session with
working browser tools closed this out.

- **Density/buoyancy confirmed, but only after ruling out a false alarm.**
  First attempt (an unwalled water rectangle) showed Ice sinking in lockstep
  with Sand — looked exactly like a broken density check. Root-caused with
  `Math.random` pinned and `trySwapOrMove` instrumented: the water body had
  no containing walls, so it was draining/spreading into open space on its
  own, and Ice was legitimately free-falling through the real vacancies that
  created — not a density bug, a test-setup bug. Rebuilt with a fully walled
  container: Sand correctly sinks to the floor; Ice, with melting pinned off
  to isolate pure buoyancy, sits stably on the water surface indefinitely and
  never sinks through it. The density comparison itself is sound.
- **In realistic (non-pinned) conditions, Ice melts before a player can
  really watch it float** — confirmed, not contradicted, by this test: Ice
  dropped from above warms from -40° to -4° just falling through open air
  (~40 frames, diffusion pulling it toward the 25° ambient every frame it's
  airborne), then crosses its 0° melt point within another ~10 frames of
  touching water. Total survival from placement to melt: roughly 50 frames,
  under a second at 60fps. This matches the "dozens of frames" the headless
  pass predicted — not a new problem, but worth being explicit: a player who
  drops Ice into a water pool will see it sink slightly and vanish quickly
  rather than clearly float. The buoyancy code is correct; the *visibility*
  of that payoff is what's marginal. If Ice feels like it never gets to show
  off floating, the fix is tuning (colder `heatEmit`, e.g. -60 to -80, or a
  smaller `TEMP_DIFFUSE` specifically for airborne cells), not a redesign —
  flagged here for whoever picks up Phase 3 polish or revisits pacing.
- **Lava solidus confirmed**: a 300-cell lava pool exposed to open air had
  218 cells cross 950° into Stone within 600 frames while 82 stayed molten —
  the crust forms first and insulates the interior, the same way a real lava
  flow behaves.
- **Old-save compatibility confirmed**: wrote a save containing only grid
  ids (no temp array, exactly what every pre-Phase-2.5 save looks like),
  reloaded through the real boot sequence, and every cell — Water, Lava, Ice
  alike — correctly seeded its resting temperature (25°, 1150°, -40°) with
  zero errors across 30 simulated frames.
- Zero console errors at any point in this pass. Sandbox reset clean afterward.
- **Phase 2.5 has no open items left.**

## Phase 2.6 — New elements: metals, gases, lightning, salt, oil

Goal: earn eleven new elements against SCIENCE.md's filter ("does something
you can SEE that nothing already in the game does"). Full shortlist, sources,
and rationale live in **SCIENCE.md**'s "New elements" section.

**Status: done and verified (18 Jul 2026), headlessly + a real bug fixed.**
Live browser verification did not happen this session — the Chrome extension
was not connected (same limitation Phase 1/2 hit before their browser
follow-ups). Headless verification against the real, unmodified engine is
thorough (49/49 checks, run 10x in a row for reliability, zero flakes) and
covers every payoff below with actual grid/temp state, not just code reading
— but a live pass (paint each new element, watch it react, reload, confirm
old saves) is still the honest next step before this is 100% closed the way
Phase 1/2/2.5 eventually were. Noting this here rather than skipping it.

**What shipped, matching SCIENCE.md's shortlist, all in one session rather
than split across metals/gases/lightning:**
- **Metals** — Gold (melts at 1064°, Lava reaches ~1150° so it *can* melt
  it), Iron (melts at 1538°, Lava genuinely *cannot* — the deliberate
  contrast with Gold), Lead (melts at 327°, an ordinary Fire is enough),
  Mercury (liquid at room temperature, freezes solid at -39° near Ice).
- **Gases** — Oxygen (keeps Fire burning longer via a new `refuels`
  mechanic instead of Fire just aging out on a fixed clock), Hydrogen
  (rises instantly, Hydrogen + Fire → Water — genuine 2H₂+O₂ chemistry,
  simplified to a two-body touch reaction), Neon (inert until Lightning
  hits it, then glows as Glowing Neon and fades back after a timer — same
  mechanic Steam already used to condense back to Water, generalized).
- **Lightning** — ~30,000°C, briefly overwhelming, fuses Sand into Glass
  (real fulgurite chemistry) and excites Neon.
- **Salt** — dissolves into Water to make Salt Water; Salt Water melts Ice
  (the actual reason roads get salted before winter storms).
- **Oil** — density 900, floats on Water; ignites hard on contact with Fire.
- **Rust** — what Iron slowly becomes near Water (2%/frame touch chance).

**The one deliberate removal:** Sand + Lava → Glass is gone. SCIENCE.md
flagged it as the game's least defensible recipe (glass needs ~1700°, Lava
tops out around 1150-1200°, so Lava genuinely cannot glass sand) and named
Lightning as the intended real fix. Sand + Lightning → Glass replaces it —
instant, no `minTemp` gate needed, because 30,000° clears any reasonable
threshold immediately. Confirmed via regression that Sand sitting on a real
lava pool for 150 frames never becomes Glass anymore.

**Engine changes — two small, generic, precedented hooks, both in `game.js`,
neither element-specific:**
1. **`refuels: true`** (new REACTIONS flag, same shape as the existing
   `wets` flag) — resets a cell's `age` to 0 without changing its id. Used
   by Fire+Oxygen so Oxygen extends a fire's burn duration instead of Fire
   aging out on a fixed clock alone. Returns `false` like `wets` does, so
   touching Fire doesn't freeze Oxygen in place and block it from rising
   away like a normal gas.
2. **`revertsTo`/`revertsAfter` generalized** — this used to be a
   Steam-only hardcoded mechanic ("after 300 frames, Steam becomes Water").
   Pulled into a generic per-element pair of fields so Glowing Neon's glow
   can fade back to plain Neon the same way, and any future gas can reuse
   it. Steam's own behavior is unchanged (still 300 frames back to Water).
- `TEMP_MAX` raised 5000 → **35000** to give Lightning's 30,000° `heatEmit`
  headroom inside the guardrail clamp instead of getting silently clipped.

**One real engine bug found and fixed (not a design gap — an actual latent
bug, likely present since Phase 1):** touch reactions changed a cell's id
via `aTo`/`bTo` but never reset its `temp[]`. Concretely: cold Ice (-40°)
touching Lava correctly converts to Water via the touch rule, but kept its
old -40° reading — which is below Water's own 0° freezing point, so on the
very same frame's subsequent `updateTemperature()` pass (which runs after
all touch reactions inside `step()`), that brand-new Water cell immediately
re-froze back to Ice, invisibly, before any check or the player could ever
see the intermediate Water state. Found while debugging why Salt Water +
Ice wasn't reliably melting the Ice side. Confirmed via direct `applyReaction`
invocation (with `Math.random` pinned) that the conversion logic itself was
correct in isolation — the bug was specifically the missing temp reset.
**Fixed** by setting `temp[ci] = restingTemp(rule.aTo)` and same for `cj`
in the conversion block, reusing the exact `restingTemp()` helper Phase 2.5
already established for painting/loading/moving. This is the same
"identity change resets to a sensible resting temperature" principle
extended to the one remaining code path that didn't have it yet — and it
retroactively fixes the same latent risk for the pre-existing Ice+Lava and
Ice+Fire touch reactions too, not just the new Salt Water one.

**Two design findings from testing, not bugs — worth knowing for future
elements:**
- **A small lava pool can fail to melt Gold even though "lava can melt
  gold" is true in general.** Gold has no `heatEmit` of its own (nothing
  needs it to), so submerged in a small pool it acts as a local heat sink —
  its immediate Lava neighbors can cool below their own 950° solidus via
  mutual diffusion and convert to heat-dead Stone, isolating Gold from
  further heat before it reaches 1064°. A large/deep pool (9x9 in testing)
  has enough thermal mass to push through regardless. Not fixed — this is
  correct emergent behavior in the same family as the Phase 2.1 "melt front
  crusts over and self-arrests" finding, and the regression test now uses a
  large pool to reflect a "real lava mass," matching SCIENCE.md's own
  phrasing.
- **Mercury only freezes on direct contact with Ice, not from a short
  distance the way Lava melts Ice.** Mercury's freeze gap (25° ambient to
  -39°, a 64° span) is far smaller in absolute terms than Lava's melt gap
  (25° to 1064°+, over 1000°). The same diffuse/decay constants that carry
  Lava's huge differential meaningfully through a multi-cell gap don't move
  Mercury's much smaller one far enough before ambient decay wins. Matches
  SCIENCE.md's own modest phrasing for Mercury ("chill it with ice," not
  "from a distance") — not a bug, just a smaller effective reach.

**Verified headlessly, 49/49 checks, against the real unmodified `elements.js`
+ `game.js`, run 10 times in a row with zero flakes:** every Phase 1/2/2.1/2.5
regression still holds; Sand+Lava is gone and Sand+Lightning→Glass fires
instantly; Gold melts in a large lava mass while Iron (no `meltsAt` at all)
never does; Lead melts via ordinary Fire; Mercury freezes touching Ice;
Oxygen measurably extends Fire's lifespan; Hydrogen+Fire→Water; Neon+
Lightning→Glowing Neon, which fades back to Neon within its timer; Salt
dissolves into Salt Water, which melts Ice on contact; Oil floats on Water
and ignites on contact with Fire; Iron rusts near Water; the guardrail clamp
holds with the new 35000 ceiling and comfortably fits Lightning's heatEmit;
the touch-reaction temp-reset fix holds (Ice+Lava becomes Water and stays
Water, no same-frame refreeze flicker); and a save containing only pre-2.6
element ids (0-15) still loads and runs with zero errors.

**One test-suite bug found and fixed along the way (not an engine bug):** a
handful of the new regression blocks called `step()` without first seeding
`temp[]` via `initTemp()`, defaulting the whole grid to temp 0. For most
tests this didn't matter, but the Salt Water + Ice test sat two elements
right near zero-adjacent thresholds (Salt Water freezes at -10°, Ice melts
at 0°) — starting from an uninitialized 0° created a genuine race between
the touch reaction and Ice's own radiant cold pulling Salt Water below its
freeze point first, making the test fail roughly 4 times out of 5. Fixed by
adding `initTemp(sb)` to every Phase 2.6 test block for consistency with the
rest of the suite; 10 consecutive full-suite runs afterward all passed
49/49 with no failures.

**Live browser verification — DONE (18 Jul 2026):** a follow-up session with
working browser tools closed this out. Every headline payoff confirmed:

- **Gold vs Iron** — same lava pool (~1150°): Gold fully melted to Molten
  Gold, Iron stayed solid Iron through 400 frames. The core payoff, working
  exactly as designed.
- **Lead** melts readily given real sustained contact with heat (confirmed
  in a sealed lava pocket — reached 1000°+ and melted well past its 327°
  point). **Oxygen** confirmed genuinely extending Fire's life: an
  oxygen-packed fire was still burning at frame 50 while an identical,
  unfed control fire (same box, no oxygen) had already died by frame 40.
- **Hydrogen + Fire → Water** confirmed frame-by-frame, and it chains into
  something genuinely charming: the instant the new Water appears next to
  the still-burning Fire, the *existing* Water+Fire→Steam rule fires on it
  immediately after — real emergent complexity from two simple rules
  composing, not a special case written for Hydrogen.
- **Mercury**: liquid at rest at room temperature (confirmed), freezes solid
  when properly sealed against Ice (confirmed). **Oil** floats on Water
  indefinitely once the test container is actually sealed (see below).
  **Salt Water melting Ice**, **Salt dissolving into Water**, and **Iron
  rusting near Water** all confirmed via aggregate element counts.
  **Glowing Neon** fades back to plain Neon at exactly frame 151
  (`revertsAfter: 150`, so age must exceed it) — timer confirmed exact.
- Zero console errors at any point. Sandbox reset clean afterward.

**A methodology finding worth keeping, not a bug in the game:** the first
attempt at several of these tests (Oil-floats, Mercury-freezes,
Salt-Water-melts-Ice) gave results that looked like real bugs — Oil sinking
straight through water, Mercury sinking in lockstep with Ice, Salt Water and
Ice sitting side by side for 10 frames without ever reacting. Every single
one turned out to be the same root cause: **an unsealed test container lets
things drift, drain, or fall away from each other before the interaction can
be observed** — not a flaw in the density, reaction, or temperature code.
The falling-sand engine processes rows in an alternating left-right/
right-left sweep each frame, so two adjacent *mobile* cells (both still
falling, neither landed yet) can occasionally "dodge" a same-frame reaction
check if one moves away a half-step before the sweep reaches the other —
confirmed harmless once both cells settle, since the check just retries
every subsequent frame. **Any future browser test of a new reaction or
density interaction should fully wall the test container on all sides
(floor + both walls, sized tight to the contents) before concluding anything
from the result** — this cost real time to re-discover three times in this
one pass alone.

## Phase 2.7 — Acid (optional, no fixed slot, see SCIENCE.md)

Goal: answer Aliff's "make Erase feel less like magic delete" idea properly —
not by touching the Erase button (it stays; every sandbox needs a plain way
to clear the canvas), but by adding one real substance that destroys things
through genuine chemistry. Full spec, the two reactions, and the two
deliberate non-reactions (Gold and Glass both resist Acid, for real reasons)
are in **SCIENCE.md**'s "Acid" section — read that, not this summary.

Short version: Acid (liquid, density 1840) dissolves Iron and releases real
Hydrogen gas (which can then drift to a flame and become Water — chains
into Phase 2.6's existing Hydrogen for free), and slowly dissolves Stone.
It deliberately does nothing to Gold (mirrors the Gold/Iron Lava contrast
from Phase 2.6 with a completely different mechanism — same conclusion) or
Glass (true of ordinary acids). Zero engine changes — `elements.js` only.

This is a content-only addition with no dependencies, so it doesn't need a
fixed place in the queue — do it whenever, including squeezed into the same
session as a weekly content update later. Not blocking Phase 3.

Files: `elements.js` only.
Done when: Acid+Iron→Hydrogen confirmed in browser (sealed test container —
see the methodology note above), Acid+Stone slow-dissolves, Acid on Gold/
Glass does nothing, old saves still load.

## Phase 3 — Visual juice (feels alive)

Goal: same simulation, dramatically better feel. No libraries — canvas only.

- **Glow:** hot cells brighten neighbors (lava lights up a cave). Cheap
  method: second low-res canvas with radial gradients, `screen` blend.
- **Particles:** small short-lived sparks above fire, bubbles in boiling
  water, drifting smoke wisps, dust when sand lands. One simple particle
  array, max ~200 alive, data-driven per element (`particle:` field).
- **Heat shimmer** above lava/fire (slight sine-wave row offset when drawing).
- **Wet look:** water gets subtle animated highlight lines; wet sand darker.
- Keep ALL of this in a separate `effects.js` so the sim stays untouched and
  effects can be toggled off (add a ✨ button — also the fps escape hatch).

Files: new `effects.js`, small hooks in `game.js`, `index.html`.
Done when: side-by-side screenshot (effects on/off) shows clear upgrade; fps smooth.

**Status: implemented, headlessly integration-tested, AND live-verified in a
real browser (18 Jul 2026). No open items.** See the live verification note
below the architecture section for what was actually seen.

**What shipped, matching every bullet in the goal above:**
- **Glow** — reuses the existing `heatEmit` field directly (no new
  elements.js field needed): any element with positive `heatEmit` (Fire,
  Lava, Lightning, Molten Gold, Molten Lead) bathes its own cell in a soft
  additive radial-gradient bloom, brightness scaled to `heatEmit` and
  clamped so Lightning's 30,000° doesn't blow out any harder than Lava's
  1150°. Drawn with `globalCompositeOperation: 'lighter'` so overlapping
  hot cells brighten further instead of just overwriting.
- **Particles** — one flat array, hard-capped at 200 so a busy scene can
  never spiral into a slideshow. Four kinds, all data-driven via a new
  `particle:` field in elements.js (Fire→spark, Lava→smoke, Water/Salt
  Water→bubble, Sand→dust), matching the plan's "sparks above fire, bubbles
  in boiling water, drifting smoke wisps, dust when sand lands" exactly:
  - `spark`/`smoke` emit continuously at low probability from matching cells.
  - `bubble` only spawns once a cell's own temperature is within 15° of its
    `boilsAt` — reads as "about to boil," not "always fizzing," reusing the
    existing `boilsAt` field instead of adding a new one.
  - `dust` is edge-triggered: a new `wasFalling` tracking array (owned by
    effects.js, not game.js) detects the exact frame a powder transitions
    from airborne to resting (via the existing `moved` array — no new
    engine state needed) and fires one puff, not a continuous stream.
- **Heat shimmer** — implemented as a cheap classic 2D fake rather than true
  per-pixel distortion: each frame, the row directly above any sufficiently
  hot row gets redrawn (copied straight from the MAIN canvas via
  `drawImage`) onto the effects overlay, offset sideways by a small sine
  wave, at partial opacity. Reads as wavering heat haze without ever
  touching game.js's own `render()` pixel loop.
- **Wet look** — water's exposed surface (cells with open air directly
  above) gets an occasional animated highlight pixel, sine-timed per column
  so it reads as light glinting off moving water rather than a static
  sparkle. (Wet-sand-darker already existed from Phase 1 in game.js's own
  `render()` and was left untouched — this only adds the water-highlight
  half of the "wet look" bullet.)

**Architecture — kept almost entirely out of game.js, matching the plan's
explicit instruction to keep the sim untouched:**
- `game.js` gained exactly **one guarded line** in `loop()`:
  `if (typeof renderEffects === 'function') renderEffects();` — right after
  the existing `render()` call. If effects.js isn't loaded at all, the sim
  runs byte-for-byte identical to before Phase 3.
- Everything else lives in the new `effects.js`, drawing to its OWN overlay
  `<canvas id="fx">` stacked exactly on top of `#world` (absolutely
  positioned, `pointer-events: none` so all input still goes to the sim
  canvas beneath it). `index.html` and `style.css` gained the wrapper div
  and the new canvas/button; no existing element was restructured.
- `elements.js` gained one new optional field (`particle:`) — pure data,
  same golden-rule shape as every other Phase 2/2.5/2.6 field.
- A new ✨ **Effects** button toggles the whole overlay off (clearing it
  cleanly, not freezing on a stale frame) and persists the choice to
  localStorage — this doubles as the fps escape hatch the plan asked for:
  if a scene ever gets too busy, turning effects off makes the sim itself
  completely unaffected (it was never touched to begin with).
- All four cosmetic layers (glow, wet-look highlight, particle spawns,
  landing-dust detection) share a **single** `grid.length` scan per frame
  instead of four separate ones, keeping the added cost to roughly one more
  full-grid pass on top of what the sim already does every frame.

**Verification — headless integration test (18 Jul 2026), run 5x with zero
flakes, plus honest limits:**
- Physics regression suite re-run in full first: **49/49 checks still pass**
  — proof the one-line hook didn't change sim behavior at all.
- Built a new integration harness (`visual_harness.js`, sibling to the
  existing `harness.js`) that runs the REAL, unmodified `elements.js` +
  `game.js` + `effects.js` together against a fake DOM with a fake — but
  API-complete-enough — Canvas2D context (`fillRect`, `createRadialGradient`,
  `drawImage`, `clearRect`, with every numeric argument checked for
  NaN/Infinity). Drove a busy scene (Fire, Lava, Water pushed to 95° near
  its 100° boil point, a falling Sand grain, a Wall, all at once) through
  300 frames and confirmed: it never throws; the glow path actually draws
  radial gradients; particle spawns actually draw pixels; the shimmer path
  actually redraws rows; the particle count never exceeds the 200 budget;
  and no NaN/Infinity ever reaches a canvas call. 7/7 checks, 5 consecutive
  runs, no flakes.
- **This proves the code runs correctly end-to-end against a real Canvas2D
  surface (same API a real browser exposes) — it does NOT prove it looks
  good.** A fake context has no pixels to actually look at. The plan's own
  "Done when" bar is a side-by-side screenshot showing a clear visual
  upgrade — that specific check needs real eyes on a real browser, and the
  Chrome extension wasn't connected this session (same gap Phase 2.6 hit;
  confirmed via repeated retries, not a one-off). **Flagging this here
  explicitly rather than skipping it or quietly calling Phase 3 fully done.**
- No `canvas`/`jsdom` npm packages were available to render an actual PNG
  for visual inspection either — the sandbox's npm registry access returned
  403 Forbidden for both. The integration-harness approach above was the
  strongest verification available without those.

**Live browser verification — DONE (18 Jul 2026):** a follow-up session with
working browser tools closed this out.

- Painted a busy scene (a Lava pool with Fire on top, a Water pool ringed by
  Fire and pre-heated to 90° so bubbles would show, a falling Sand column)
  and screenshotted it with effects on: a soft orange bloom visibly bleeds
  out past the hard pixel edges of Lava/Fire, exactly like a real glow
  rather than a blocky mess.
- Read the `#fx` overlay canvas's actual pixel data directly (not just eyes
  on a screenshot): 821 non-transparent pixels, max alpha 255, 12 particles
  alive at the time of the check — objective proof the layer is genuinely
  drawing, not just present in the DOM.
- Toggled the ✨ Effects button off: the overlay canvas dropped to exactly 0
  non-transparent pixels (confirms it clears cleanly, no stale frame left
  behind) and the button label correctly read "✨ Effects (off)". A second
  screenshot with effects off shows visibly flatter, sharper edges around
  the same Lava/Stone area — a clear, real side-by-side difference, which
  was the plan's own "Done when" bar.
- Toggled back on, then confirmed painting still works correctly with the
  overlay in place (`pointer-events: none` doing its job — a simulated
  pointerdown on the world canvas painted Sand as expected, proving clicks
  aren't being swallowed by `#fx`).
- Measured real frame rate in the browser during the busy scene with effects
  on: **60.4fps sustained** over a 1.5s sample — matches the plan's
  performance budget with margin to spare.
- Zero console errors at any point. Sandbox reset clean afterward.
- **Phase 3 has no open items left.**

## Phase 4 — Depth ("3D feel", honestly 2.5D)

Goal: the scene reads as having depth without any engine change.

- **Edge shading:** cells with empty space above-left get a light edge,
  below-right a dark edge (fake bevel — instant depth for piles and walls).
- **Ambient light cycle:** slow day/night tint of the whole scene; lava/fire
  glow matters more at night. (Tie to real clock — calm-app bonus.)
- **Background layer:** subtle distant parallax backdrop (cave wall / sky)
  behind the sim instead of flat dark.
- Optional stretch IF fps allows: 1-bounce cheap "reflection" on still water.

Files: `effects.js`, `style.css`.
Done when: screenshots day vs night look distinct; piles look rounded, not flat.

**Status: implemented, headlessly integration-tested, AND live-verified in a
real browser (18 Jul 2026). No open items.** See the live verification note
below for what was actually confirmed, and one real test-environment gotcha
it surfaced (not a bug in the game).

**What shipped, matching every required bullet:**
- **Edge shading (bevel)** — any cell that isn't gas/fire (so: powder,
  liquid, static, plant, and Wall — "piles and walls" from the plan) checks
  its up-left and down-right diagonal neighbors. Open space up-left draws a
  light highlight tint on that cell (additive `lighter`); open space
  down-right draws a dark shadow tint (`source-over`). Implemented as a flat
  per-cell tint rather than a sub-pixel line — the sim only ever renders at
  180×120 before the browser's own pixelated upscaling, so a thinner line
  would just read as the same flat tint anyway once scaled up; the flat
  version is cheaper and reads correctly across a whole pile's silhouette
  either way (this is the same shading trick block-based games use per-face
  at low resolution).
- **Ambient light cycle** — a smooth 0→1 "night factor" read straight from
  the player's real clock every frame (`new Date()`, cosine curve peaking
  at true midnight, bottoming at true noon — genuinely tied to local time,
  not a fake in-game clock). Drives a single full-canvas semi-transparent
  dark wash drawn FIRST each frame, before glow — so hot elements' additive
  bloom punches back through the wash and reads as relatively brighter at
  night, without their actual color ever changing. This is the literal
  payoff PLAN.md asked for ("lava/fire glow matters more at night").
- **Background layer (parallax)** — a vertical cave-ceiling-to-floor
  gradient plus 5 soft, distant silhouette blobs that drift sideways and
  wrap around, painted into whatever the sim leaves EMPTY. The backdrop
  also ages with the same night factor as the foreground wash, so
  background and foreground never look like two different times of day.
  **Deliberately painted per-empty-cell on the #fx overlay, not on a canvas
  behind `#world`** — `#world`'s EMPTY cells render fully opaque (matching
  the page background, by original v1 design), so a true "canvas behind the
  sim" backdrop would need those cells to become transparent, which is a
  `game.js` `render()` change. That's off-limits this phase (physics/engine
  untouched, per the session's own instruction), so the backdrop is instead
  painted as an opaque per-cell overwrite on the SAME overlay canvas that
  already draws glow/particles/shading — visually identical result (empty
  space shows backdrop instead of flat navy), zero engine files touched.
- **Reflection stretch goal — deliberately skipped.** The plan explicitly
  marks "1-bounce cheap reflection on still water" as optional, gated on
  "IF fps allows." Given the priority order (`easy maintain > fun > fancy`)
  and that three solid required features already ship this session, adding
  a fourth speculative one wasn't worth the complexity. Not forgotten —
  cut deliberately, and flagged here rather than silently dropped.

**Performance note:** edge shading and the backdrop both fold into the SAME
single `grid.length` scan Phase 3 already runs every frame (no new full-grid
passes added) — the backdrop specifically replaces what used to be an
instant `continue` for EMPTY cells with one cheap per-cell paint, so the
total work is still one pass over the grid, now with slightly more of that
pass actually doing something. The night wash is one single full-canvas
`fillRect` call, not per-cell. Still gated by the same ✨ Effects toggle as
Phase 3 — turning effects off skips all of Phase 4 too, so it remains the
fps escape hatch the plan asked for.

**Verification — headless, all pre-existing suites still pass, plus a new
Phase-4-specific integration check (18 Jul 2026), run 5x with zero flakes:**
- Physics regression suite: **49/49 checks still pass**, unchanged — Phase 4
  touched zero physics/engine files (`elements.js` and `game.js` were not
  edited at all this session, confirmed by diff-free status).
- Phase 3's `visual_harness.js` integration suite: **7/7 still pass** —
  proves the existing glow/particle/shimmer paths weren't disturbed by the
  new code sharing their scan loop.
- New `phase4_check.js` (sibling harness, same real-code-fake-Canvas2D
  approach as Phase 3's): pins the fake clock to true midday and true
  midnight in turn (via a `Date` override injected into the vm context,
  same trick used to override tunable constants elsewhere in this test
  suite) and confirms: `nightFactor()` reads ~0 at 13:00 and ~1 at 00:05;
  the backdrop actually paints thousands of empty-cell pixels in a mostly-
  air scene; edge shading actually draws both the white highlight and black
  shadow tint styles against a sand pile's exposed corners; the night wash
  actually fires as a full-canvas fill at midnight; glow still fires
  correctly at night (Lava doesn't stop radiating just because the clock
  changed); no NaN/Infinity ever reaches a canvas draw call; and a
  pre-Phase-4 save still loads and runs cleanly through the full
  render+effects path. **10/10 checks, 5 consecutive runs, no flakes.**
- **This proves the code runs correctly end-to-end against a real Canvas2D
  surface and produces sane values at both ends of the day/night cycle — it
  does NOT prove it looks good.** The plan's own "Done when" bar (day vs
  night screenshots look distinct, piles look rounded not flat) needs real
  eyes on a real browser. Chrome extension wasn't connected this session
  (retried at the start of verification, same as every other phase that hit
  this gap) — flagging explicitly rather than quietly calling Phase 4 fully
  closed.
- `canvas`/`jsdom` for an actual rendered PNG were tried again and are still
  unavailable (npm registry access returns 403 Forbidden in this sandbox,
  same as Phase 3) — the integration-harness approach above remains the
  strongest verification available without real browser access.

**Live browser verification — DONE (18 Jul 2026):** a follow-up session with
working browser tools closed this out.

- **A real gotcha caught immediately: the shared browser tab wasn't as clean
  as expected.** A plain `localStorage.clear(); location.reload();` — the
  exact reset pattern used at the end of every previous phase's
  verification — did NOT produce an empty world this time. The tab still
  had hundreds of leftover cells (Hydrogen, Neon, Gold, Stone, ...) from
  earlier Phase 2.6 testing. Root cause: `game.js`'s own
  `beforeunload` handler calls `saveWorld()` during page teardown, and that
  fires with whatever was still in memory at that instant — clearing
  storage first doesn't stop the outgoing page from writing it right back
  on its way out. Separately, a `painting` flag got stuck `true` from an
  earlier simulated pointer event and kept depositing Sand on every
  subsequent step. Neither is a Sandchemy bug a real player would ever hit
  (nobody scripts fake pointer events at their own canvas) — it's purely an
  artifact of reusing one long-lived automated test tab across many phases.
  Fixed for good this session: explicitly null out `onbeforeunload`, force
  `painting = false`, and directly zero the grid/temp arrays before saving,
  rather than trusting clear+reload alone. **Worth remembering for any
  future automated verification session that reuses this same tab.**
- **Backdrop gradient and blobs confirmed via direct pixel sampling**
  (more reliable than eyeballing a compressed 180×120 screenshot stretched
  to 720px): top-row pixels read cooler/darker `[8,12,30]` vs bottom-row
  `[18,20,26]`, matching the coded "dark ceiling → warmer floor" gradient
  exactly; a blob-center pixel read `[5,10,27]` against a same-row
  non-blob pixel at `[9,13,29]` — a `(-4,-3,-2)` delta, matching the blob
  darkening code exactly. Real, present, deliberately subtle by design.
- **Day/night cycle confirmed exact**, not just plausible: faking the
  system clock to 00:00 and 12:00 in turn, `nightFactor()` returned exactly
  `1` and `0` respectively, and the two resulting frames produced
  measurably different pixel colors at the same world coordinate.
- **Edge shading confirmed applying real, different values** to light-edge
  vs dark-edge vs interior cells of an actual sand pile (poured naturally
  through the real brush code, not hand-placed) — an interior cell's
  effects-layer contribution measured far dimmer than an edge cell's.
  **Honest limitation found:** at the game's native 180×120 resolution
  displayed at typical screenshot size, this bevel is real but visually
  subtle — a naturally-poured sand pile reads as a mostly flat-colored
  triangle to the eye in a screenshot, even though the underlying pixels
  measurably differ. Zooming the canvas up for a closer look didn't land
  cleanly in this pass (viewport/scroll math got fiddly and wasn't worth
  fighting further once the pixel-level proof was already solid). If
  Aliff, playing at full brush size on a real screen, feels piles still
  read as flat, the fix is a tuning pass (raise the highlight/shadow alpha
  from 0.10/0.16 to something bolder) — not a redesign.
- Confirmed a core physics reaction (Water+Lava→Steam+Obsidian) still fires
  correctly with the effects layer active, and zero console errors
  throughout. Sandbox fully reset and saved clean afterward.
- **Phase 4 has no open items left**, with one tuning note flagged above
  for whoever next wants to make the bevel punchier.

## Phase 4.6 — Material textures (per-element visual identity)

**Origin (19 Jul 2026):** Aliff noticed Wall, Stone, Wood, Battery, and
similar solid elements all look identical besides color — flat fill, same
generic noise, no sense of what material they actually are. Goal: give each
material a distinct, logical texture that reads as "what it actually is,"
without touching physics. Confirmed with Aliff explicitly: **Stone stays
`type: 'static'`** (a big solidified mass is realistically fixed — real
rock/cooled lava doesn't crumble on its own) — this phase is rendering only,
the exact same shape as Phase 3/4's work, not a physics change.

**The mechanism (reuses the proven Phase 3 pattern — data field + effects.js
overlay, zero `game.js` changes):**
- New optional `texture:` field in `elements.js`, same shape as the existing
  `particle:` field. One line per element, pure data.
- One new pass in `effects.js`, folded into the SAME per-frame grid scan
  Phase 3/4 already run — no new full-grid loop, no new performance cost.
- Every texture pattern is **seeded from cell position (x,y), not
  `Math.random()` per frame** — a given physical spot keeps the same look
  every frame. Random-per-frame would read as flickering static, not a
  material; position-seeded reads as a stable, real texture.

**Texture types for this pass:**
- `rocky` (Stone, Obsidian, Lead, Uranium): cells grouped into coarse
  ~3×3 clusters, each cluster gets its own slight shade offset — reads as
  "made of distinct pebbles/chunks" even though the underlying cell is one
  static mass. This is specifically what answers Aliff's "batu jatuh
  sebiji-sebiji" instinct: painted Stone should immediately look like a
  scatter of rock chunks, not a smooth grey disc, even though it doesn't
  fall or move after being placed.
- `grain` (Wood, Lantern): thin horizontal streaks, warm brown variation —
  wood grain.
- `metallic` (Iron, Copper, Gold, Battery, Mercury): a diagonal
  highlight/sheen streak — reads as reflective metal.
- `brick` (Wall): a mortar-line grid — Wall is a built structure, not a
  natural rock, so it should read differently from Stone even though both
  are grey and static.
- `crystal` (Glass, Salt): small faceted sparkle points.

**Scope for this pass, deliberately tight:** Wall, Stone, Wood, Battery,
Iron, Copper, Lead, Gold, Obsidian, Glass — the solid/static/metal elements
that currently look flattest and most identical. Liquids (Water, Lava, Oil)
and powders (Sand, Dirt) are skipped — they already have their own
animation/noise from Phase 1–3 and aren't the complaint here. More materials
can get textures later in ordinary weekly updates; this pass doesn't need to
cover everything at once.

Files: `elements.js` (texture field per element), `effects.js` (one new
rendering pass folded into the existing scan). `game.js` untouched — same
guarantee as every Phase 3/4 change.
Done when: Stone visibly reads as chunky/rocky (not a flat disc) immediately
after painting; Wood shows grain; metals show sheen; Wall reads differently
from Stone despite being a similar grey; fps stays smooth in a busy scene;
old saves still load (this is pure rendering, so they trivially should).

**Status: implemented and verified headlessly (19 Jul 2026). Live browser
verification deliberately skipped this session — Aliff explicitly said to
skip it, not a tooling gap like prior phases hit.**

**What shipped, matching the tight 10-element scope above exactly:** added
`texture:` to Wall (`brick`), Stone (`rocky`), Wood (`grain`), Battery/Iron/
Copper/Lead/Gold (`metallic`), Obsidian (`rocky`), Glass (`crystal`) — one
line each in `elements.js`, pure data, no other fields touched. **One
intentional deviation from this section's own earlier "Texture types" draft
list, worth flagging honestly:** that draft put Lead under `rocky` (grouped
with Stone/Obsidian/Uranium) and also mentioned Lantern, Mercury, Salt, and
Uranium getting textures. The actual build follows the narrower **"Scope for
this pass"** paragraph instead (which explicitly lists only the 10 elements
above, with Lead alongside the other metals) — that scope paragraph is more
specific and was confirmed as the real instruction for this session, so it
wins over the earlier draft list a few paragraphs up. Lantern/Mercury/Salt/
Uranium got no texture this pass; they're fair game for a future weekly
update using the same mechanism.

`effects.js` gained two new pieces, both folded into the SAME per-frame
`grid.length` scan `scanAndEmit()` already runs for glow/particles/shading —
no new full-grid loop, per the plan's own performance rule:
- `texHash(x, y, seed)` — a small deterministic integer hash (no
  `Math.random` anywhere in it). Same `(x, y, seed)` in always produces the
  same float out.
- `drawTexture(x, y, el)` — a switch on `el.texture` with one case per
  pattern: `rocky` (coarse ~3×3 clusters via `texHash` on the cluster
  coordinate, each cluster gets one stable shade offset — reads as distinct
  pebbles/chunks), `grain` (short position-seeded horizontal streak
  segments, not one line across the whole grid, so a big Wood mass reads as
  separate planks), `metallic` (a repeating diagonal band purely from
  `x - y` — no hash needed, the geometry itself is the stable pattern),
  `brick` (a real alternating-row mortar grid — a running bond, distinct
  from Stone's organic chunks), `crystal` (sparse `texHash`-picked sparkle
  points). Called once per non-empty cell, right after the existing edge-
  shading block and before Wall's early-continue (so Wall's own `brick`
  texture still renders — Wall has nothing else to draw after that point
  anyway).
- **The seeding rule was verified, not just written:** neither function
  contains `Math.random`, and calling `drawTexture` on the same `(x, y)`
  repeatedly — including with the game's `frame` counter forced to wildly
  different values (1 vs 9999) — produces byte-identical canvas calls every
  time. Different cells do produce different output, confirming it's a real
  pattern, not a no-op. This is the specific property the plan called out as
  critical (position-seeded, not frame-seeded, so it doesn't flicker like
  static).

**`game.js` untouched — confirmed by `git diff --stat -- game.js` returning
empty, not just "I didn't mean to edit it."** Stone's `type` is still
literally `'static'` in the shipped file. This was a rendering-only phase
exactly as scoped.

**Verified headlessly (19 Jul 2026), 34/34 checks, run 5x with zero flakes,
against the real unmodified `elements.js` + `lab.js` + `game.js` +
`effects.js`:** all 10 elements carry exactly the right `texture` value and
no others picked one up by accident; Stone's `type` is still `'static'`;
`texHash`/`drawTexture` contain no `Math.random`; every one of the 10
texture patterns is byte-identical across 5 repeated calls at a fixed cell;
Stone's texture is identical at `frame=1` vs `frame=9999`; texture output
genuinely varies across different cells; a 180-frame busy scene covering all
10 textured elements plus Lava/Water/Fire/Sand runs `step()`+`render()`+
`renderEffects()` with zero exceptions and zero NaN/Infinity/undefined ever
reaching a canvas call (3.5M+ calls checked); `game.js` has zero diff against
git; the Water+Lava→Steam+Obsidian touch reaction still fires unchanged;
Sand still falls and settles at the floor (isolated from lab.js's pre-
existing "auto-load a Volcano once" starter-world feature, which the harness
had to explicitly clear first — not a Phase 4.6 bug, a pre-existing feature
the test needed to account for); and a save/load round trip still preserves
textured elements correctly, confirming textures are purely derived from
position at render time, never stored in the save format, so old saves
trivially still work.

**A harness-design gotcha worth recording, not a game bug:** the first pass
of the Sand-falls-through-open-air regression check failed — Sand appeared
to stop at row 97 instead of reaching near the floor. Root cause: `lab.js`
auto-seeds a "🌋 Volcano Eruption" starter world into `localStorage` the
first time `sandchemy.volcano_loaded` isn't set (a real, pre-existing Phase-5
feature, not something this session touched), and the headless harness's
fresh in-memory `localStorage` mock never has that key set, so every fresh
`boot()` call replays the volcano auto-load — meaning the grid already had
real Stone/Lava terrain in it before the test painted its own Sand grain.
Fixed by explicitly clearing `grid`/`age`/`meta`/`temp` right after `boot()`
in that one test, before painting — the same "fully sealed/clean test
container" discipline Phase 2.6's methodology notes already called out, just
a localStorage-flavored version of it instead of a physical-wall one.

**No browser pass this session — by explicit instruction, not a gap.**
Every prior phase's live-verification note in this file exists because the
Chrome extension wasn't connected; this one is different — Aliff was asked
whether to attempt it and said to skip it. Flagging the distinction so a
future session doesn't mistake this for an outstanding gap the way the
Chrome-unavailable cases were. If a live pass is wanted later, the fast path
is: paint one cell of each of the 10 elements, screenshot with ✨ Effects on,
and confirm Stone reads chunky, Wood shows streaks, the metals show a
diagonal sheen, Wall's mortar grid is visible and distinct from Stone, and
Glass sparkles — then toggle Effects off and confirm the flat pre-texture
look returns cleanly, the same side-by-side pattern Phase 3/4 used.

**Live browser verification — DONE (19 Jul 2026):** a follow-up session
picked up the skipped browser pass.

- Painted Wall, Stone, Obsidian, Wood, Iron, Gold, and Glass as big side-by-
  side blocks and screenshotted them: **all seven read as visibly distinct
  materials**, not seven colored rectangles. Iron and Gold show a clean
  repeating diagonal sheen; Glass shows scattered sparkle points; Stone and
  Wall are both grey but clearly different textures from each other.
- One false alarm chased and resolved during this pass, worth recording:
  Iron and Gold appeared to "fall" out of their painted position between
  screenshots. Root cause was a test artifact, not a bug — real time (and
  thousands of frames) elapsed across the many tool round-trips, and Iron/
  Gold are correctly `type: 'powder'` (Phase 2.6's real, intentional design —
  dense metal grit sinks and piles, verified back in that phase). Pausing the
  sim immediately after painting and re-screenshotting confirmed this. Wall
  and Stone, both genuinely `static`, never moved.
- Isolated `drawTexture()` directly (calling it against a cleared corner of
  the real `#fx` canvas, bypassing glow/edge-shading/backdrop noise from the
  full scene) to get an unambiguous signal: **Wall produces an exact
  running-brick-bond grid** (mortar lines at the coded 6×3 spacing, with the
  alternating row offset visible in the raw alpha map) and **Wood produces
  segmented streak clusters**, both matching the design exactly, not just
  "looks textured" from a screenshot.
- Reconfirmed a core physics reaction (Water+Lava→Steam+Obsidian) still
  fires correctly with textures active, and sustained **60.2fps** in a busy
  scene (four large textured blocks + a row of fire). Zero console errors
  throughout. Sandbox reset and saved clean afterward.
- **Phase 4.6 has no open items left.**

## Phase 5 — 100% custom sandbox (Aliff's "customed" wish) (DONE)

Goal: the player shapes the game itself. This is the signature feature.

- **Element Lab 🧪:** in-app panel where the player creates their OWN element:
  pick emoji, name, color, movement type (powder/liquid/gas/static), and up to
  3 reactions with existing elements from dropdowns. Saved to localStorage,
  loaded into the same ELEMENTS/REACTIONS tables at boot — the engine already
  treats content as data, so this needs zero engine changes. Custom elements
  get a small badge in the palette.
- **Multiple worlds:** save/load named sandboxes (localStorage, simple list UI).
- **Share as text:** export/import a world OR a custom element as a compact
  text code (base64 RLE — same trick as the save system) for WhatsApp sharing.
  No server involved, keeps the zero-leak promise.

Files: new `lab.js`, `index.html`, `style.css`. Engine untouched.
Done when: custom element works; export/import works; old saves still load.

**Status: Done (18 Jul 2026).**
Implemented synchronously injecting custom elements from `localStorage` into `ELEMENTS` and `REACTIONS` before `game.js` boot, allowing completely custom simulation without any engine changes. Added modal UI for Element Lab, creating elements, and managing/importing/exporting worlds and elements via Base64 payload text codes.

**Note (this session went well beyond the Element Lab spec above):** the
scope actually shipped this session — a "creature" simulation type (Fish,
Bug), a nuclear physics set (Uranium, Radiation, Nuclear Waste), electricity
(Copper, Battery, Spark), weather (Cloud, Snow, Acid Rain), an abiogenesis
chain (Amino Acid, Microbe, Algae), a crafting chain (Wood/String/Wick/
Lantern), a Sensor Probe tool, a "startup" framing (About page, privacy
policy, pitch deck outline), and a git repo with commits — was authorized
directly by Aliff outside this plan's normal one-phase-one-session flow, not
scope creep by the implementing session. Flagging here only so this file
stays an honest map of what's actually in the codebase; none of the added
elements were run through SCIENCE.md's usual filter, so treat their `why`
justifications (where present) as unverified.

**Two real bugs found and fixed by a live-verification follow-up (19 Jul
2026), not part of the original implementation:**
1. **`style.css` silently lost ~85% of its rules.** The very first `canvas {
   }` rule (predating this session) was never closed before a Phase 3
   comment and a new `.canvas-wrap` rule got appended inside it — invalid
   CSS that made the parser drop everything after that point. Confirmed via
   `document.styleSheets[0].cssRules.length`: 15 rules loaded instead of the
   90+ the file actually defines. Effect: the toolbar buttons and the entire
   Element Lab modal rendered as bare, unstyled browser-default HTML — no
   dark theme, no overlay, no layout — even though the CSS for all of it was
   correctly written and just never reached. Fixed by adding the one missing
   `}`. Rule count after fix: 91.
2. **`lab.js` had a stray extra `});` (line 123 of the pre-fix file)**
   closing the `DOMContentLoaded` callback three lines after it opened,
   leaving the entire rest of the file — every tab, the create-element form,
   worlds, import/export, literally all of Phase 5's actual functionality —
   outside that callback as orphaned top-level code, AND creating a mismatched
   brace that surfaced as a `SyntaxError: Unexpected token '}'` at the true
   end of the file. A syntax error in a classic script means the whole file
   fails to execute — confirmed nothing in `lab.js` ran at all (not even its
   synchronous custom-element boot injection) until this was fixed. This
   made the Element Lab **completely non-functional**: the Lab button did
   nothing, with no console error, because no listener was ever attached to
   it. Fixed by deleting the stray line; `node -c lab.js` confirms valid
   syntax now.
   - Caught this specific class of bug the same way Phase 2.5/2.6 caught
     engine bugs: by actually clicking the button and getting a null result,
     not by reading the code and assuming it worked.
3. **A related methodology trap, not a code bug:** after fixing both files,
   the Lab button *still* appeared broken on the first re-test — a plain
   `location.reload()` was silently serving a browser-cached pre-fix copy of
   `lab.js` (confirmed: `typeof nextCustomId` was `undefined` on the page,
   meaning the script tag never actually ran the new file). A hard
   cache-busted navigation (`navigate` with `force: true` and a `?v=` query
   string) resolved it. Worth remembering for any future session verifying a
   JS file change in this same long-lived browser tab — a soft reload is not
   always enough to prove a fix landed.

**Live browser verification — DONE (19 Jul 2026), after both fixes:**
- Element Lab modal opens correctly (`labModal` classList becomes `modal`,
  matches the intended full-screen dark overlay design) and closes via ×.
- Created a real custom element (🟢 Slime, liquid) through the actual UI
  form — confirmed it registered a new `E.SLIME` id, appeared correctly in
  the "Your Elements" list with Export/Delete controls, and was saved to
  `localStorage.sandchemy.custom_elements`.
- Reloaded the page (keeping localStorage this time) — Slime **survived and
  appeared in the main palette**, confirming the full create → persist →
  play loop actually works end to end.
- Painted Slime into the live sandbox and ran 200 frames + render + effects
  with zero errors.
- Separately stress-tested the full 54-element roster (every element type
  placed at once, 500 frames) plus a data-integrity sweep of every
  `meltsTo`/`boilsTo`/`freezesTo`/`diesTo`/`revertsTo`/reaction reference —
  zero dangling references, zero runtime errors. The underlying simulation
  itself (separate from the two UI bugs above) is sound.
- **One design note, not a bug, worth a decision from Aliff:** 51 of the 54
  non-hidden elements are now flagged `starter: true` (only Foam, Radiation,
  and Nuclear Waste still require discovery), so the palette shows nearly
  everything immediately and the Discovery Journal — the mechanic this
  game's own README still describes as its core hook — currently has almost
  nothing left to discover. Not fixed here since it's a content/design call,
  not a defect; flagged for whenever Aliff wants to revisit it.
- Sandbox fully reset and saved clean afterward.

## Phase 6 — Sound & final polish (DONE)

- Web Audio (synthesized, no audio files): soft sizzle (water+lava), fire
  crackle, sand patter, discovery chime. Master mute button, default ON but quiet.
- Mobile/touch pass: bigger chips, pinch nothing (keep it simple), test on iPhone.
- Performance pass + a "Reset everything" in a small settings panel
  (with confirm — wipes localStorage).
- Update README + vault note (`claudesidian/01_Projects/Sandchemy.md`) to
  status "feature-complete"; weekly updates after this are new elements only.

**Status: Done (18 Jul 2026).**
Added `audio.js` which dynamically synthesizes a fire rumble, sizzle loop, and discovery chime using Web Audio API completely decoupled from `game.js`. Added a Reset Everything and Mute button to the toolbar, and enlarged palette chips for optimal mobile tap-targets. Forced `user-scalable=no`.

## Phase 7 — UI polish, shortcuts, installability & onboarding (7a DONE, 7b–7d SCOPED)

**Origin (19 Jul 2026):** Aliff asked for four things in one message: a more
compact/minimalist UI, game-like keyboard shortcuts, a PWA install prompt on
every device, and a strong first-run onboarding. Per this project's own
standing rule #1 (*"One phase = one session = one outcome. Never mix
phases"*), this is bundled too wide for a single session — it's really 4
mostly-independent workstreams that touch different files with different
risk profiles. **This section only scopes the work; nothing below has been
built yet.** Recommended split, in this order (each is its own session):

- **7a — PWA installability** (lowest risk, purely additive, no existing UI
  touched)
- **7b — Keyboard shortcuts** (additive, one new small JS file + a cheatsheet
  overlay)
- **7c — UI redesign** (highest risk — touches `index.html`/`style.css`
  directly, the same file that silently lost 85% of its rules once before,
  see Phase 5's bug note above; needs the most careful before/after visual
  verification)
- **7d — Onboarding** (do last — it should teach the *shipped* 7b shortcuts
  and 7c layout, not a moving target)

If Aliff wants to collapse two of these into one session anyway, 7a+7b pair
naturally (both purely additive, zero layout risk). 7c should stay solo.

### 7a. PWA installability

**Goal:** the app can be "installed" (Add to Home Screen / desktop app) on
Android, iOS, and desktop Chrome/Edge, with a subtle, dismissible, in-app
floating prompt — not the browser's own inconsistent native banner, since
iOS Safari never fires `beforeinstallprompt` at all.

- New `manifest.webmanifest` — name, short_name, `display: standalone`,
  `theme_color`/`background_color` matching the existing dark UI, and an
  `icons` array.
- **Open decision, blocks this sub-phase:** there is no real icon artwork in
  this repo today — the app currently only uses the ⚗️ emoji as its visual
  identity (see `<h1>⚗️ Sandchemy</h1>` in `index.html`). Two options: (a)
  render the ⚗️ emoji to PNG at the required sizes as a placeholder (192×192,
  512×512, plus a maskable variant with safe-area padding, plus a 180×180
  `apple-touch-icon`), or (b) Aliff supplies real art first. Needs a decision
  before implementation, not a judgment call to make silently.
- A minimal service worker (cache the static shell: html/css/js) — required
  for Chrome/Android's install criteria; iOS install doesn't need one but it
  doesn't hurt.
- Custom floating "Install Sandchemy" pill/button: listens for
  `beforeinstallprompt` on Chrome/Android/desktop (prevents the default
  banner, shows our own subtle UI instead, calls `.prompt()` on click);
  on iOS Safari (no such event exists) shows a small "Add to Home Screen via
  Share → Add to Home Screen" tip instead, since that's the only install path
  there. Dismissible, and once dismissed stays dismissed (localStorage flag)
  so it's not nagging.
- Files: new `manifest.webmanifest`, new `sw.js`, new icon PNGs (or an SVG
  source + generated sizes), `index.html` (link tags + install button markup
  + a small inline script), `style.css` (prompt styling).
- Done when: Chrome DevTools' Lighthouse/Application panel reports the app
  is installable, the custom prompt appears once per device and stays
  dismissed after being closed, install actually works on at least one real
  Android/Chrome device or emulator, and the existing zero-server/zero-leak
  promise still holds (service worker only caches static assets already
  shipped in the repo — no new network calls, no analytics).

**Status: DONE, live-verified in a real browser (19 Jul 2026).**

**Icon decision (asked, not guessed):** Aliff was asked how to source the
missing icon artwork (render the ⚗️ emoji vs. supply real art first) and,
after a follow-up, asked for a **Phosphor `flask` icon** instead of either
original option — a proper vector glyph rather than an emoji screenshot.
Went with that: pulled the real SVG from the `@phosphor-icons/core` npm
package (`assets/fill/flask-fill.svg`), recolored it to the app's existing
gold accent (`#ffd76b`), and rasterized it with ImageMagick onto a rounded
dark-navy card matching `style.css`'s own background gradient
(`#14172a` → `#0d0f1a`) — same visual language as the rest of the app, not
a generic placeholder. `generate_icons.py` (new, one-off dev script, same
category as the existing `generate_volcano.js`/`generate_scenarios.js` —
not loaded by `index.html`, kept only so icons can be regenerated later if
the theme colors ever change) produces all four required sizes into a new
`icons/` folder: `icon-192.png`, `icon-512.png` (both content-filled at
62%, rounded corners), `icon-512-maskable.png` (content shrunk to 42% and
un-rounded, so it survives Android's aggressive circular/squircle safe-zone
cropping per the maskable-icon spec), and `apple-touch-icon.png` (180×180,
opaque, un-rounded — iOS applies its own corner rounding and doesn't
respect transparency).

**What shipped, matching every bullet above:**
- `manifest.webmanifest` — name/short_name "Sandchemy", `display:
  standalone`, `background_color`/`theme_color` both `#0d0f1a` (matching
  `body`'s existing background in `style.css` exactly), `start_url`/`scope`
  both relative (`./`) so it works regardless of what path the app is
  hosted under, and the three icons above (`any` purpose for the two plain
  ones, `maskable` for the third).
- `sw.js` — a minimal, deliberately narrow service worker. Caches exactly
  the static shell `index.html` needs to run fully offline
  (`style.css`, `elements.js`, `lab.js`, `game.js`, `effects.js`, `audio.js`,
  the manifest, all four icons) on install, cleans up any old-versioned
  cache on activate, and serves cache-first with a network fallback that
  also opportunistically caches anything not in the original shell list.
  Deliberately does NOT cache `about.html`/`privacy-policy.html` (secondary
  pages, not part of the play loop) or the `generate_*.js` dev scripts (not
  loaded by `index.html` at runtime). Zero new network calls, zero
  third-party requests, zero analytics — only ever touches files already
  shipped in this repo, so the zero-server/zero-leak promise holds exactly
  as it did before.
- `index.html` — added the manifest link, `theme-color` meta, favicon,
  apple-touch-icon, and the `apple-mobile-web-app-*` meta tags iOS reads.
  Added a floating `#installPrompt` pill (hidden by default) plus a small
  inline script (not a new file — kept this self-contained rather than
  adding a 6th `<script src>` for ~70 lines of install-affordance chrome)
  that: listens for `beforeinstallprompt` on Chrome/Android/desktop,
  `preventDefault()`s the browser's own inconsistent native banner, shows
  our pill with a real "Install" button wired to `.prompt()`; on iOS Safari
  (detected via UA sniffing since `beforeinstallprompt` never fires there)
  swaps the pill's text to a manual "tap Share → Add to Home Screen" tip and
  hides the button entirely, since that's the only install path iOS has;
  and registers `sw.js` behind a `'serviceWorker' in navigator` feature
  check so it's a silent no-op anywhere unsupported. Dismissing the pill (×
  button) sets a `localStorage` flag (`sandchemy.pwa_install_dismissed`) so
  it never shows again on that device — confirmed by direct test, not
  assumed.
- `style.css` — new `.install-prompt` rules: a dark card with a gold border
  (same `#14172a`/`#ffd76b` language as `.toast`), fixed to the bottom-right
  corner rather than top-center (persistent chrome, not a transient
  notification), with a narrow-viewport media query that stretches it
  edge-to-edge on mobile instead of clipping.
- **Engine untouched** — `elements.js` and `game.js` were not opened for
  editing at all this session; this is pure add-on chrome, the same
  "rendering/layout only, engine never touched" guarantee every prior
  Phase 3/4/4.6 visual phase kept.

**A real environment gotcha worth recording, not a game bug:** this
session's sandboxed tool environment could run a local static file server,
but that sandbox's network is isolated from Aliff's actual Mac — the real
connected Chrome browser couldn't reach `localhost` inside the sandbox, and
`file://` URLs were blocked outright by the browser extension's own safety
rules. Neither gap was something to route around from inside the sandbox
(no way to start a server on Aliff's actual machine without terminal access,
which was itself restricted to click-only, no typing). Resolved simply: **Aliff
ran `python3 -m http.server 8721` from the project folder on his own Mac**,
after which the already-connected real Chrome could reach
`http://localhost:8721` normally. Worth remembering for any future session
hitting the same wall — the fix is a one-line ask, not a workaround.

**Live browser verification — DONE (19 Jul 2026):**
- Manifest fetched and parsed directly (`fetch(manifestLink).json()`):
  valid JSON, correct `name`/`display: standalone`/`theme_color`, and all
  three icon entries present with the right `purpose` values.
- Service worker confirmed actually registered and active
  (`navigator.serviceWorker.getRegistrations()` → 1 registration, `active`
  truthy, scope `http://localhost:8721/`) — not just present in source.
- Cache contents read directly via the Cache API: all expected shell files
  present (`index.html`, `style.css`, all 5 JS files, the manifest, all 4
  icon PNGs) — genuine proof the install/cache step actually ran, not
  inferred from no errors.
- **Chrome's own install-eligibility engine approved the site for real**:
  `beforeinstallprompt` fired unprompted on load and our custom pill
  appeared ("📲 Install Sandchemy for quick access" with a working Install
  button) — this is Chrome's live installability check passing, a stronger
  signal than a static Lighthouse audit would have been.
- Dismiss button confirmed working: pill hides immediately, `localStorage`
  flag (`sandchemy.pwa_install_dismissed`) set to `"1"`; reloaded the page
  fresh afterward and confirmed the pill correctly stayed hidden — the
  "stays dismissed" requirement verified across an actual reload, not
  assumed from reading the code.
- Existing functionality reconfirmed unaffected: dispatched a real
  pointer down/move/up sequence on the `#world` canvas (paints normally,
  `grid` still globally reachable and populated, zero errors thrown) and
  the palette/journal/toolbar all rendered pixel-identical to before this
  phase.
- Zero console errors at any point across two full fresh loads (only the
  expected "Audio Engine Initialized" log). Sandbox `localStorage` cleared
  afterward to leave a clean slate.
- **A real install was deliberately NOT performed** — asked Aliff directly
  whether to click through an actual OS-level install (which would add a
  real, permanent Sandchemy app with the placeholder flask icon to his
  Mac), and he chose to skip it since `beforeinstallprompt` firing was
  already Chrome's own definitive proof of installability. Flagging this
  explicitly as a deliberate scope choice, not a gap — everything the
  "Done when" bar asks for was otherwise confirmed live, and this is the
  one checkbox (a literal completed install) intentionally left for Aliff
  to do himself whenever he actually wants the app on his machine.
- **7a has no open items left.**

### 7b. Keyboard shortcuts ("logically smart")

**Goal:** power users can drive the whole toolbar without a mouse, using
bindings that match existing conventions from games/creative tools rather
than inventing new ones. Proposed scheme (starting point for the
implementing session, not final — sanity-check against whatever the browser
already reserves, e.g. Cmd+W closes the tab):

| Key | Action |
|---|---|
| `Space` | Pause / resume |
| `[` / `]` | Brush size down / up |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Shift+Z` (or `Ctrl+Y`) | Redo |
| `1`–`9`, `0` | Quick-select the first 10 palette elements, in palette order |
| `E` | Toggle Effects |
| `P` | Toggle Sensor Probe |
| `L` | Open/close Lab |
| `M` | Mute/unmute |
| `Escape` | Close whatever modal is open |
| `?` | Show/hide a shortcut cheatsheet overlay |

- A cheatsheet overlay (small modal, same visual language as the existing
  Lab modal) is part of this sub-phase, not optional — shortcuts nobody can
  discover don't count as onboarding-friendly.
- Must not fire while a text `<input>`/`<textarea>` inside the Lab modal has
  focus (e.g. typing "L" into the element-name field shouldn't toggle the
  Lab).
- Files: likely a new small `shortcuts.js` (one `keydown` listener, a
  lookup table, the cheatsheet modal), `index.html` (cheatsheet markup),
  `style.css`. `game.js`/`effects.js` untouched — shortcuts should just call
  the same functions the existing buttons already call.
- Done when: every binding above works, none fire while typing in a form
  field, `?` toggles a real cheatsheet, and existing mouse/touch controls
  are completely unchanged (this is additive, not a replacement).

**Status: DONE, live-verified in a real browser (19 Jul 2026).**

**What shipped, matching the proposed scheme exactly:** new `shortcuts.js`
— one `document.addEventListener('keydown', ...)`, a lookup table, and the
cheatsheet modal's open/close wiring. Every binding calls the exact same
function its matching button already calls (`clickIfPresent('undoBtn')`
etc. — literally `.click()` on the real button), per the plan's own
instruction, so nothing here reimplements game/lab/effects/audio logic.
Brush `[`/`]` is the one exception (no button exists for it) — it directly
nudges `#brush`'s value and dispatches a real `input` event, the same event
a manual drag already produces. `1`–`9`/`0` click the Nth chip in `#palette`
in DOM order, so `buildPalette()` in game.js stays the single source of
truth for palette contents. A new `⌨️ Shortcuts` toolbar button was added
(not in the original file list, but directly serves the plan's own
"shortcuts nobody can discover don't count as onboarding-friendly" line)
opening the same cheatsheet the `?` key toggles.

**Two real bugs found during live verification, both fixed, neither
guessed from reading the code:**
1. **Closing a modal via Escape left focus behind, silently blocking every
   later shortcut.** Both modals hide via a CSS class (`opacity`/
   `pointer-events`), not `display: none` — so a text field focused right
   before Escape (e.g. mid-typing in the Lab's emoji field) stayed
   `document.activeElement` even after the modal visually closed. The next
   keypress (tested with `Ctrl/Cmd+Z`) then silently hit the typing guard
   and did nothing, with zero console error to explain why. Found by
   testing the realistic sequence (type into Lab → Escape → try another
   shortcut), not by reading the code and assuming it worked. Fixed: the
   Escape handler now blurs `document.activeElement` if it's a typing
   target right after closing.
2. **Escape itself was originally blocked by its own typing guard**,
   contradicting the plan's implicit expectation that Escape is the
   universal cancel gesture — first-draft code put the typing-target check
   before the Escape case, so pressing Escape mid-form did nothing. Fixed
   by special-casing Escape to run before (i.e. regardless of) the typing
   guard, since it never inserts a character and is safe to fire from
   anywhere.

**Live browser verification — every binding individually confirmed with
real keyboard events, not assumed from the switch statement reading
correctly:** `Space` toggles `paused`/pauseBtn text; `]`/`[` move `#brush`'s
value 4→5→4 and `brushSize` follows; `2` and `3` select palette chip index 1
and 2 respectively (Sand, then Water) confirming palette-order mapping, not
a coincidence; `E` toggles `fxBtn` text/active class; `P` toggles
`probeActive` + the sensor HUD's visibility; `M` toggles the mute button;
`?` opens a real cheatsheet screenshot-confirmed with all 11 rows legible;
`Escape` closes the cheatsheet, and separately closes the Lab modal even
mid-typing (post-fix); `L` opens the Lab, and typing `"L"` into the Lab's
own emoji field types the letter without toggling the Lab (guard confirmed
holding); `Ctrl+Z`/`Ctrl+Shift+Z` move a real painted stroke between
`undoStack`/`redoStack` (1→0→1, confirmed via the actual global arrays, not
just "no error thrown"). Zero console errors throughout. `localStorage`
cleared afterward.

**A real, separate infrastructure bug found and fixed while verifying
this phase (in `sw.js`, from 7a) — not a 7b bug, but caught by 7b's own
testing:** 7a's service worker cached shortcuts.js on first load. Every
subsequent edit to that file kept getting silently ignored — the browser
kept serving the stale first version forever, since a cache-first strategy
never even asks the network once something's cached. This directly
contradicts the project's own "How to update weekly" maintenance model
(README), which assumes a returning player sees the latest edited files.
Rewrote `sw.js`'s fetch handler from cache-first to **network-first, cache
as offline-only fallback** — online, every request always goes to the
network and refreshes the cache; the cache is only ever read when the
network genuinely fails. A second, subtler layer of the same bug surfaced
immediately after: even the rewritten network-first `fetch(req)` call was
still being satisfied from the *browser's own HTTP cache* (a separate layer
from the Service Worker Cache API), because a plain `fetch()` respects
normal HTTP caching semantics unless told otherwise. Fixed by fetching with
`{ cache: 'reload' }`, which forces a genuine network round-trip every
time. Both fixes are now in the shipped `sw.js`, with the full reasoning
left as comments in the file itself so a future session doesn't have to
rediscover this.

### 7c. UI redesign — compact & minimalist

**Goal:** Aliff's ask was "compact, better structured, minimalist... make
sure it is like a game" — read as: reduce visual clutter, group the current
9-button toolbar (Undo/Redo/Probe/Pause/Clear/Effects/Lab/Mute/Reset) into a
tighter, more game-HUD-like layout rather than a flat row of text-labelled
buttons, while keeping every existing feature reachable.

**Concrete open decisions this sub-phase needs from Aliff before/while
building (do not silently invent these):**
- Icon-only toolbar buttons (relying on `title=` tooltips, already present
  on every button) vs. keeping some text labels — icon-only is more compact
  but less discoverable for first-time non-technical users, which cuts
  against the onboarding goal in 7d.
- Whether secondary/destructive actions (Reset, Clear) should move into a
  collapsed "⚙" menu to reduce accidental clicks, versus staying inline.
  Reset is already a factory-wipe with a confirm dialog — moving it behind
  one more tap is probably worth it either way.
- Mobile layout: the journal `<aside>` currently sits beside the play area
  in a two-column `<main>` — needs an explicit stacked/collapsed treatment
  on narrow screens if it doesn't already have one (check `style.css` media
  queries before assuming).
- This sub-phase's `style.css` edit MUST re-verify the file parses/loads
  fully afterward (`document.styleSheets[0].cssRules.length` sanity check)
  — see the Phase 5 bug note above where one unclosed brace silently dropped
  85% of the stylesheet with zero console error. Compare rule count
  before/after, don't just eyeball the browser.
- Files: `index.html`, `style.css` only. No engine or data files touched —
  same "rendering/layout only" guarantee every prior visual phase kept.
- Done when: every existing button/control still works exactly as before
  (functional regression check, not just "looks nicer"), toolbar is
  visually tighter, `cssRules.length` is sane before and after, live browser
  screenshot comparison (before/after) shown as proof, and mobile viewport
  checked, not just desktop.

**Status: DONE, live-verified in a real browser (19 Jul 2026).**

**Open decisions, asked before building (not guessed):**
- Icon-only toolbar buttons — Aliff picked **icon-only** over keeping text
  labels or a hybrid.
- Clear/Reset placement — Aliff picked **collapse into a ⚙ menu**.
- A third item was found and flagged mid-question, not in the original
  three: the canvas can genuinely overflow/distort on narrow phone screens
  right now (see the bug below) — Aliff confirmed **yes, fix it** as part
  of this pass, since it's directly inside 7c's own "mobile layout" bullet.

**What shipped:**
- **Icon-only toolbar** — every button kept its original `id` (every other
  JS file looks these up directly) and its original `title=` tooltip; only
  the visible word was dropped, with a new `aria-label` added so the
  accessible name doesn't regress along with the visible text. New
  `.icon-btn` class gives each button a fixed 40×40 square footprint so the
  row reads as a tidy strip instead of ragged pills.
- **⚙ gear menu** — `clearBtn`/`resetBtn` moved (same ids, same click
  listeners already in `game.js`/`audio.js`, untouched) into a small
  collapsed popover behind a new `⚙` button, closing on an outside click.
  Pure UI chrome, no new logic — a small inline script in `index.html`
  toggles a `hidden` class, nothing more.
- **Canvas overflow/distortion, fixed** — merged what used to be two
  separate `canvas { }` rules in `style.css` into one, replacing a literal
  `height: 480px` with `aspect-ratio: 3 / 2`. See the bug writeup below for
  why this mattered.

**A real, measurable bug found and fixed, not just a style tweak:** before
this phase, `style.css` had two `canvas { }` rules — the second (Phase 3)
set `width: 720px; height: 480px;` without repeating `max-width: 100%` from
the first (v1) rule. Same-specificity cascade meant `max-width: 100%` (only
ever set once) kept correctly capping the WIDTH on narrow screens, but
`height: auto` from the first rule got overridden to a literal `480px` by
the second — so on any viewport under 720px wide, the canvas box shrank in
width while staying pinned to a fixed 480px height, silently distorting the
aspect ratio. Measured directly, not eyeballed: at a ~570px test viewport,
the rendered box was 537×480 (aspect 1.119) against a true 720×480 bitmap
(aspect 1.500) — a real, quantifiable stretch. After the fix, the same
viewport measured exactly 1.500 aspect, matching the bitmap precisely.

**Live browser verification:**
- `document.styleSheets[0].cssRules.length`: **104 before → 110 after** —
  a small, explainable increase (new `.icon-btn`/`.gear-menu`/
  `.gear-popover` rules, minus one from merging the two canvas rules into
  one), not the kind of drastic drop Phase 5's unclosed-brace bug produced.
  Confirms the stylesheet parses fully both before and after, per the
  standing instruction to compare counts rather than eyeball it.
- Canvas aspect ratio confirmed exactly `1.500` post-fix at the same
  viewport that measured `1.119` pre-fix.
- Toolbar screenshotted before and after: a visibly tighter row of uniform
  icon squares plus a `⌨️`/`⚙` pair on a second row, replacing nine
  differently-sized text pills.
- ⚙ popover confirmed opening (Clear/Reset visible) and closing on an
  outside click (`classList.contains('hidden')` true after).
- Functional regression: a real mouse click on the Probe button (now
  icon-only, moved from its old DOM position) correctly toggled
  `probeActive` and the sensor HUD — confirming the id-based wiring survived
  the visual restructuring untouched.
- Mobile viewport checked at the narrowest width this session's tooling
  would actually produce (the resize tool floored out around 500px
  regardless of a smaller request) — zero horizontal overflow
  (`document.body.scrollWidth` never exceeded `window.innerWidth`), canvas
  scaled down cleanly, palette/journal stacked without clipping.
- Zero console errors throughout. `localStorage` cleared afterward.

**One deliberate, justified exception to this sub-phase's own "index.html,
style.css only" file list — three one-line label-string edits, not
logic changes:** true icon-only isn't achievable for `pauseBtn`/`fxBtn`/
`muteBtn` purely from HTML/CSS, because `game.js`/`effects.js`/`audio.js`
each directly overwrite that button's `textContent`/`innerHTML` with a full
word (`'▶️ Resume'`, `'✨ Effects (off)'`, `'🔇 Unmute'`) every time its
state toggles — any HTML-only icon-only markup would get clobbered back to
full text on the very first click. Fixed with the smallest possible touch:
changed exactly the three assigned strings to icon-only variants (state
still fully visible — the play/pause/mute glyphs change themselves, and
Effects relies on the pre-existing `.active` gold-border class, the same
pattern `probeBtn`/chips already used). The underlying pause/effects/mute
*logic* above and below each of those lines is byte-for-byte unchanged.
This mirrors Phase 1's own precedent ("two tiny generic engine hooks had to
go into game.js") — a small, necessary, clearly-flagged exception rather
than silently violating the stated file scope or leaving the toolbar
half icon-only against Aliff's actual answer.

### 7d. Onboarding

**Goal:** a first-time, non-technical visitor understands what to do within
seconds, without reading anything. Today the only onboarding is a static
hint line ("Tip: try pouring water on lava… 👀") — good tone, but easy to
miss and not sequenced.

**Proposed default** (lightweight, matching the project's own priority order
of *no leak > easy maintain > fun > fancy* — i.e. don't build a heavy
tutorial engine for this): a short, dismissible, localStorage-gated
first-visit sequence — 2–3 tooltip-style callouts pointing at the palette,
the canvas, and the Discovery Journal in turn ("① pick an element → ② paint
it here → ③ combos get logged here automatically"), plus surfacing the `?`
shortcut cheatsheet (from 7b) as the natural "learn more" exit. Should
compose with 7b/7c rather than duplicate them — no separate help system.

- Files: likely folds into `index.html`/`style.css` plus a small script
  (either its own file or appended to `lab.js`'s boot sequence). No engine
  changes.
- Done when: a fresh browser profile (cleared localStorage) sees the
  sequence once, dismissing it (or completing it) sets a flag so it never
  shows again, and it visually matches 7c's finished layout (build this
  sub-phase last, per the ordering note above).

**Status: DONE, live-verified in a real browser (19 Jul 2026).**

**What shipped, matching the proposed default exactly:** new `onboarding.js`
— a 3-step sequence (① palette → ② canvas → ③ Discovery Journal), gated on
a single `localStorage` flag (`sandchemy.onboarding_seen`). Each step dims
the page with a translucent backdrop, draws a gold highlight ring around
the real target element (`#palette` / `.canvas-wrap` / `.journal` — the
exact same elements 7c's finished layout already renders, so this
automatically matches whatever 7c shipped rather than needing its own
separate styling), and shows a small card with Skip/Next. The last step
composes directly with 7b instead of duplicating it: its "Show keyboard
shortcuts" button finishes onboarding and then clicks the real
`shortcutsBtn` — the same "click the real button" pattern `shortcuts.js`
itself established, not a second cheatsheet implementation. Card position
is measured against the real target's `getBoundingClientRect()` every step
(clamped to stay on-screen, flips above the target if there's no room
below), and a brief 400ms boot delay lets the palette/journal finish their
own render pass first so the very first tooltip isn't measured against
elements still settling into place.

**Live browser verification:**
- Fresh profile (`localStorage.clear()` then reload) shows step ①
  correctly: `#palette` gets the gold ring, the card reads "① Pick an
  element" with the right copy, first dot active.
- Clicking Next advanced through step ② (`.canvas-wrap` highlighted, card
  repositioned and auto-scrolled into view) and step ③ (`.journal`
  highlighted, "Show keyboard shortcuts" button present, dots showing 3/3).
- Clicking "Show keyboard shortcuts" on the last step confirmed BOTH
  effects at once: `sandchemy.onboarding_seen` became `"1"`, the backdrop/
  card were removed from the DOM, AND the real Shortcuts cheatsheet modal
  opened — screenshotted showing all 11 real bindings, not a placeholder.
- Reloaded with the flag now set: onboarding did **not** reappear,
  confirming the "shows once" requirement across an actual reload, not just
  read from the code.
- Separately tested the Skip path on another fresh profile (cleared
  `localStorage` again): clicking Skip on step ① immediately set the same
  flag and removed the backdrop/highlight — confirming Skip and
  Next-through-to-completion both correctly gate the sequence, not just the
  happy path.
- Zero console errors across the whole flow (fresh load, all 3 steps, both
  the Skip and the complete-via-shortcuts exit paths, and the reload
  check). `localStorage` cleared afterward.
- `sw.js`'s `SHELL_FILES` list updated to include `shortcuts.js` and
  `onboarding.js` (previously missing since 7a predates both files) — they
  were already getting opportunistically cached on first fetch either way,
  but adding them to the initial install list keeps the "everything
  index.html needs to run fully offline" guarantee complete and explicit
  rather than relying on the opportunistic path alone.

**Phase 7 is now fully shipped — all four sub-phases (7a/7b/7c/7d) done and
live-verified.**

**Status: 7a DONE and live-verified (19 Jul 2026, see its own Status note
above); 7b, 7c, 7d still SCOPED ONLY — no code written for those yet.** This
section exists so a future session (this one or a fresh Cowork session) can
pick up any of 7b–7d independently with full context, without re-deriving
the open decisions above from scratch. See the kickoff prompt near the top
of this file for how to hand this off.

## Phase 8 — Panelized layout (palette tabs, 3-column HUD)

**Origin (19 Jul 2026):** Aliff asked to "polish the UI better... maybe we
split into panel so [it's] not so cluttered, more structured, organized,
user friendly" — the palette had grown to 54 elements in one long flat wall
above the canvas, which was the actual root of the clutter complaint, not
the toolbar (already addressed in 7c).

**Open decisions, asked before building (not guessed):**
- Palette organization — Aliff picked **tabs by category** (Basics, Metals,
  Gases, Chemistry, Electric, Weather, Life, Crafting) over a single
  scrollable list with section headers or leaving it flat.
- Overall layout shape — Aliff picked a **3-column HUD** (palette sidebar /
  canvas+toolbar center stage / journal sidebar) over a smaller change that
  just added the journal as a sidebar next to an unchanged top-stacked
  palette.
- A follow-up instruction mid-session asked explicitly for the responsive
  behavior to be "logically smart, compacted, minimalist" on small
  screens — treated as a first-class requirement throughout, not an
  afterthought bolted on at the end (see the mobile verification below).

**What shipped:**
- **`elements.js`** gained one new pure-data field, `category:`, on all 54
  non-hidden elements (same shape as the existing `texture:`/`particle:`
  fields — no engine meaning, just grouping data) plus a new `CATEGORIES`
  array (id/label/icon per tab, in display order). Counts: Basics 16,
  Metals 8, Gases 4, Electric 7 (folds Lightning/Copper/Battery/Spark in
  with Uranium/Radiation/Nuclear Waste — "high-energy/tech" as one tab
  rather than two near-empty ones), Chemistry 6, Crafting 5, Life 5,
  Weather 3 — verified summing to exactly 54, nothing missed.
- **`game.js`'s `buildPalette()`** (existing UI-building code, not
  physics — same section of the file `renderJournal()`/`showToast()`
  already lived in) now renders a row of category tab buttons plus only
  the chips belonging to the active tab. Erase is deliberately NOT part of
  any tab — it's a tool, not a substance — so it's now a permanently
  pinned chip (`#eraseChip` in `index.html`) that stays reachable
  regardless of which tab is open. When a newly-discovered element belongs
  to a different tab than the one currently open, `buildPalette()` now
  auto-switches to it first, so the existing "new-chip" pop animation is
  actually visible instead of firing silently on a hidden tab.
- **`index.html`** restructured `<main>` into three sibling panels instead
  of the palette sitting stacked above the canvas inside one column: a new
  `.palette-panel` (tabs + scrollable chip list + pinned Erase), the
  existing `.play-area` (canvas+toolbar+hint, unchanged internally, just
  promoted to a sibling panel), and the existing `.journal` (unchanged
  internally). All three share a new `.panel` class for consistent card
  chrome.
- **`style.css`**: new `.game-layout` CSS grid (`260px 1fr 280px` on wide
  viewports) replacing the old flex-wrap `main`; a bounded-height
  `.palette-panel` (600px desktop / 320px mobile) with its OWN internal
  scroll on just the chip list — tabs and the pinned Erase chip stay fixed,
  only the middle scrolls, so the panel reads as a contained list rather
  than an ever-growing wall. A `max-width: 900px` media query collapses
  the grid to a single column, stacking panels in the same
  pick-then-paint-then-discover order they're already in in the DOM
  (palette → stage → journal).
- `document.styleSheets[0].cssRules.length`: **122 before → 130 after**
  (122 was itself already up from 7c's own 110, due to 7d's onboarding CSS
  landing in between — not a regression, just this session's actual
  starting point). A sane, explainable +8, confirmed parsing fully both
  sides.

**One real, intentional behavior change worth flagging honestly, found
during verification, not treated as a bug:** 7b's `1`–`9`/`0` quick-select
shortcuts pick the Nth chip in `#palette` DOM order — since `#palette` now
only ever contains the ACTIVE tab's chips instead of all 54, those
shortcuts are now tab-relative ("first 10 elements in whatever tab is
open") rather than globally first-10-overall. Confirmed via a live test:
with the Chemistry tab open, pressing `2` correctly selected Salt Water
(that tab's 2nd chip), not whatever used to be globally 2nd. This is a
sensible, expected side effect of categorizing the palette, not a
regression — updated the cheatsheet's own copy (`index.html`) to say
"the current tab" instead of "the palette" so it stays accurate.

**Live browser verification (19 Jul 2026):**
- Tab switching confirmed via direct clicks: Basics → Metals correctly
  swapped the visible chip list from 16 items to exactly the 8 metals,
  active-tab styling moved with it.
- A real mouse click on a Metals-tab chip (Gold) correctly set
  `currentElement` to Gold's id, and painting it onto the live canvas
  placed real Gold cells in `grid` (37 cells from one brush stroke) —
  confirms the id-based wiring survived the DOM restructuring.
- Discovery auto-tab-switch confirmed by directly triggering a real
  discovery (`discover(E.FOAM, ...)`, Foam being one of only 3 elements in
  the whole roster that isn't `starter: true`): `currentCategory` switched
  to `'chemistry'` on its own, the Chemistry tab visibly became active, and
  the new-chip pop class landed on the correct chip — the exact payoff this
  feature was built for, confirmed live rather than assumed from the code.
- Erase chip confirmed pinned and reachable at the bottom of the palette
  panel regardless of which tab is open or how long that tab's list is.
- Gear menu (Clear/Reset) reconfirmed still opening correctly after the
  layout restructuring.
- **Mobile responsiveness checked thoroughly, matching the mid-session
  instruction to treat it as first-class:** at a 375px request (this
  session's tooling floors out around 500px regardless of a narrower ask,
  same limitation hit in 7c), the grid correctly collapsed to one column,
  panels stacked in DOM order (palette → stage → journal), the palette's
  own tabs wrapped cleanly into two rows, its chip list stayed bounded with
  its own internal scrollbar rather than pushing the page layout around,
  and `document.body.scrollWidth` never exceeded `window.innerWidth` at
  any width tested — zero horizontal overflow.
- Zero console errors across every check in this pass (fresh loads, tab
  switching, painting, discovery, gear menu, mobile resize).
  `localStorage` cleared afterward.
- **Phase 8 has no open items left.**

---

## Standing rules for every phase

1. One phase = one session = one outcome. Never mix phases.
2. Verify in the browser before calling it done (paint, react, reload, check save).
3. Old saves must keep working after every phase. If a save format must change,
   migrate it in code — never wipe the player's world or journal.
4. If a phase idea makes the code harder to maintain, cut the idea, not the
   maintainability. Aliff's priority order: no leak > easy maintain > fun > fancy.
5. After each phase: update README changelog + tick the phase here with the date.

## Progress

- [x] v1 core sandbox + discovery journal — 17 Jul 2026
- [x] Phase 1 — chemistry fixes — 17 Jul 2026
- [x] Phase 2 — temperature layer — 17 Jul 2026 (Phase 2.1 tuning fix applied;
  all 4 payoffs pass headlessly AND ice-melt-at-2-cells now confirmed live in a
  browser too — heat crossed a real 2-cell air gap and melted ice before any
  contact; see Phase 2.1 note in README. Phase 2 fully verified, no open items.)
- [x] Phase 2.5 — real-world numbers — 18 Jul 2026 (verified headlessly,
  27/27 checks, AND live in a browser: buoyancy/density confirmed sound after
  ruling out a false alarm from an unwalled test container, Lava solidus
  confirmed crusting-first, old saves confirmed loading safely. One tuning
  note flagged, not a bug: Ice melts within ~1 second of placement even with
  no heat source, so it rarely gets to visibly "float" before it's gone —
  see the live verification note above. Phase 2.5 fully verified, no open items.)
- [x] Phase 2.6 — new elements: metals, gases, lightning, salt, oil — 18 Jul
  2026 (11 new elements, all against SCIENCE.md's filter; Sand+Lava→Glass
  removed and replaced with the real Sand+Lightning→Glass; one real engine
  bug found and fixed — touch reactions weren't resetting `temp[]`, causing
  an invisible same-frame self-reversal; verified headlessly (49/49, 10x with
  zero flakes) AND live in a browser — every headline payoff confirmed
  (Gold/Iron split, Oxygen-extends-Fire, Hydrogen+Fire→Water chaining into
  the existing Water+Fire rule, Mercury, Oil, Salt Water, Rust, Glowing Neon's
  exact-frame reversion). Surfaced a useful non-bug methodology finding about
  testing mobile-cell reactions in unsealed containers — see note above.
  Phase 2.6 fully verified, no open items.)
- [ ] Phase 2.7 — Acid (optional, no fixed slot — see SCIENCE.md "Acid")
- [x] Phase 3 — visual juice — 18 Jul 2026 (glow, particles, heat shimmer,
  wet-look water highlight, all in a new `effects.js` on its own overlay
  canvas; game.js only gained one guarded hook line, still 49/49 physics
  regressions passing unchanged. Headless integration-tested (7/7, 5x, zero
  flakes) AND live-verified in a browser: real glow bloom visible around
  Lava/Fire, effects-off toggle drops to 0 non-transparent pixels and shows
  a clear flatter/sharper side-by-side difference, painting still works with
  the overlay in place, 60.4fps sustained in a busy scene. Phase 3 fully
  verified, no open items.)
- [x] Phase 4 — depth / 2.5D — 18 Jul 2026 (edge shading/bevel for piles and
  walls, a day/night ambient wash tied to the real clock, and a parallax
  cave/sky backdrop — all folded into effects.js's existing overlay canvas
  and single per-frame grid scan, zero changes to elements.js/game.js.
  Physics regression 49/49 unchanged, Phase 3's visual suite 7/7 unchanged,
  plus a new Phase 4 integration check 10/10 — all run 5x with zero flakes.
  Reflection stretch goal deliberately skipped (explicitly optional in the
  plan). Live-verified in a browser: backdrop gradient/blobs and day-night
  cycle confirmed exact via pixel sampling, edge shading confirmed applying
  real (if subtle at normal screenshot size — tuning note left for later)
  values, physics unaffected. Also surfaced and fixed a test-tab hygiene
  issue (stuck `painting` flag + `beforeunload` re-save race) unrelated to
  the game itself. Phase 4 fully verified, no open items.)
- [x] Phase 4.6 — Material textures — 19 Jul 2026 (Wall/brick, Stone+
  Obsidian/rocky, Wood/grain, Battery+Iron+Copper+Lead+Gold/metallic,
  Glass/crystal; new `texture:` field in elements.js, one `drawTexture()`
  pass folded into effects.js's existing per-frame scan, `game.js` untouched
  — confirmed via `git diff`, Stone still `type: 'static'`. Every pattern
  seeded from cell (x,y) via a `Math.random()`-free hash, verified
  byte-identical across repeated calls and across wildly different `frame`
  values. Verified headlessly, 34/34 checks, 5x with zero flakes — texture
  scope, determinism, a 3.5M-call busy-scene NaN/Infinity sweep, and physics
  regressions (Water+Lava, Sand falling, save/load) all hold. Live-verified
  in a browser too: all 7 materials read as visibly distinct, Wall's brick
  grid and Wood's grain confirmed exact via isolated `drawTexture()` calls,
  60.2fps in a busy textured scene, zero console errors. Phase 4.6 fully
  verified, no open items.)
- [x] Phase 5 — Element Lab + custom worlds + share codes
- [x] Phase 6 — sound + polish
- [x] Phase 7a — PWA installability — 19 Jul 2026 (manifest.webmanifest, sw.js
  shell caching, gold Phosphor-flask icon set, dismissible install pill;
  `beforeinstallprompt` confirmed firing in a real browser, dismiss-persists
  across reload, zero console errors. `elements.js`/`game.js` untouched.)
- [ ] Phase 7b — keyboard shortcuts — SCOPED, not started
- [ ] Phase 7c — UI redesign (compact/minimalist) — SCOPED, not started
- [ ] Phase 7d — onboarding — SCOPED, not started
  - [x] 7a — PWA installability — 19 Jul 2026 (manifest.webmanifest, a
    minimal shell-caching sw.js, a Phosphor-flask icon set generated to
    match the app's own dark/gold theme, and a dismissible floating install
    pill that handles both the Chrome/Android beforeinstallprompt flow and
    iOS Safari's manual "Add to Home Screen" path. elements.js/game.js
    untouched. Live-verified in a real browser: manifest parses correctly,
    service worker registered+active+caching the exact shell files,
    Chrome's own beforeinstallprompt fired confirming real installability,
    dismiss-and-stays-dismissed confirmed across an actual reload, existing
    paint/sim/UI unaffected, zero console errors. An actual OS-level install
    was deliberately left undone — asked Aliff, who chose to skip it since
    beforeinstallprompt firing was already Chrome's own proof; everything
    else in the "Done when" bar was confirmed live. No open items.)
  - [x] 7b — Keyboard shortcuts — 19 Jul 2026 (new shortcuts.js: one
    keydown listener + lookup table, every binding calling the same
    function its matching button already calls; new ⌨️ Shortcuts button +
    cheatsheet modal. Found and fixed two real bugs live: Escape closing a
    modal left stale focus behind and silently blocked every later
    shortcut (fixed with a blur), and Escape was itself originally blocked
    by its own typing guard (fixed by special-casing it to run first).
    Also found and fixed a real infrastructure bug in 7a's sw.js while
    testing this phase: cache-first meant edited JS files got silently
    stuck on their first-ever cached version forever — rewritten to
    network-first with `cache: 'reload'` to force genuine network
    round-trips. Every binding individually confirmed live with real
    keyboard events. No open items.)
  - [x] 7c — UI redesign — 19 Jul 2026 (icon-only toolbar + a collapsed ⚙
    menu for Clear/Reset, both per Aliff's own answers to the flagged open
    decisions; found and fixed a real canvas aspect-ratio bug along the
    way — two conflicting canvas{} rules were silently stretching the
    canvas on any viewport under 720px wide, measured at 1.119 vs the true
    1.500 aspect, fixed via `aspect-ratio` and confirmed exactly 1.500
    after. cssRules.length 104→110 (sane, stylesheet parses fully both
    sides). One justified 3-line exception to the "index.html/style.css
    only" file scope: pauseBtn/fxBtn/muteBtn's label strings live in
    game.js/effects.js/audio.js, so true icon-only needed those three
    exact strings changed to icon-only (logic untouched) — same precedent
    as Phase 1's own small justified engine exceptions. No open items.)
  - [x] 7d — Onboarding — 19 Jul 2026 (new onboarding.js: 3-step
    localStorage-gated sequence — palette → canvas → journal — highlighting
    the real elements 7c already styled, ending by clicking the real 7b
    Shortcuts button rather than duplicating the cheatsheet. Live-verified:
    fresh profile shows it once, both the Skip path and the
    complete-via-shortcuts path correctly set the flag and never show it
    again on reload, zero console errors. No open items.)
- [x] Phase 8 — Panelized layout (palette category tabs + 3-column HUD) —
  19 Jul 2026 (new `category:` field on all 54 elements + `CATEGORIES` in
  elements.js; game.js's buildPalette() now renders tabs + a pinned Erase
  chip instead of one flat 54-chip wall, auto-switching tabs when a new
  discovery lands elsewhere; index.html/style.css restructured into a
  3-panel `.game-layout` grid (palette/stage/journal), collapsing to one
  stacked column under 900px. cssRules 122→130, sane. Live-verified: tab
  switching, painting after a tab-restructured click, discovery auto-tab-
  switch, pinned Erase, gear menu, and mobile stacking/scroll all confirmed
  with zero console errors. One intentional, documented behavior change:
  7b's 1-9/0 shortcuts are now tab-relative instead of palette-global.
  No open items.)
