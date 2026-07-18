# Sandchemy — Science Foundation

> Companion to PLAN.md. This is the reference dump: every real-world number
> the game should use, where it comes from, and the honest list of what we
> deliberately fake. Slots into the roadmap as **Phase 2.5**, after the
> temperature layer (Phase 2), before visual work (Phase 3).

## The decision behind this doc (17 Jul 2026)

Aliff asked for "100% accurate science, perfect math, perfect foundation."
That splits into two very different projects:

**A. Rewrite the engine into a real physics simulator** — proper heat-transfer
equations, energy conservation, latent heat, an oxygen field for combustion.
Genuinely more accurate. **Rejected.** That kind of solver is numerically
fragile: it stays stable only inside a narrow band of values, so a future
weekly update adding one element with an off constant can silently turn the
whole sim to garbage. That is exactly the "add one feature, break something
else" failure the working agreement exists to prevent, and it trades away
`easy maintain` — which outranks `fancy` in Aliff's own priority order.

**B. Keep the simple engine, replace every invented number with a real,
sourced one.** The engine already does the right *kinds* of things (things
melt, boil, ignite, sink, float). What's fake is only the numbers feeding it.
**This is the plan.** Same behaviour shape, real values, every figure
traceable. A player sees no added complexity; a reviewer can check any number
against a textbook.

So "perfect foundation" here means **every number is traceable to a real
source and behaves sensibly** — not "a rigorous solver."

### The one honest concession: time is sped up

Real ice takes minutes-to-hours to melt; a real lava flow crusts over for
days. At true speed this is a screensaver, not a toy. So the sim runs like a
**time-lapse**: real temperatures and real thresholds, accelerated clock.
This is stated openly rather than hidden — the physics is real, the *pacing*
is not. Everything below assumes that.

---

## Temperature: switch to real °C

Today's scale is invented (`heatEmit: 45`, `boilsAt: 12`, ambient 0). Replace
with actual degrees Celsius, ambient **25°C**. Nothing about how heat spreads
needs to change — only the numbers and the ambient baseline.

| Element | Current (invented) | Real value | Source / note |
|---|---|---|---|
| Water freezes | `-4` | **0°C** | definition |
| Water boils | `12` | **100°C** | at sea level |
| Ice melts | `3` | **0°C** | definition |
| Plant ignites | `6` | **300°C** | wood/cellulose autoignition ≈ 250–350°C |
| Seed ignites | `6` | **300°C** | dry organic matter, same band |
| Fire emits | `45` | **900°C** | wood flame ≈ 800–1100°C |
| Lava emits | `90` | **1150°C** | basalt erupts 1100–1200°C |
| Ice emits (cold) | `-12` | **0°C** | ice sits at its melting point |
| Ambient | `0` | **25°C** | room temperature |

Lava also needs a **solidus ≈ 950°C** — below that it stops being liquid and
becomes rock. That replaces today's `coolChance: 0.01` random dice-roll with
a real reason: *lava turns to stone when it drops below 950°C.*

## Density: real numbers, and one real bug they fix

Densities in kg/m³. These decide what sinks, floats, and rises.

| Element | Density | Note |
|---|---|---|
| Steam | 0.6 | lighter than air → rises |
| Air | 1.2 | reference |
| Ash | 600 | very light, drifts |
| Plant (wood) | 600 | |
| Ice | **917** | **less than water — ice floats** |
| Water | 1000 | reference liquid |
| Dirt (soil) | 1300 | |
| Sand (loose) | 1600 | sinks in water |
| Mud | 1800 | |
| Obsidian | 2400 | |
| Glass | 2500 | |
| Lava (molten basalt) | 2750 | |
| Stone (basalt) | 2900 | |

**The bug this exposes:** ice is currently `type: 'static'` — it just hangs in
mid-air. In reality ice floats *on* water (917 < 1000), which is one of the
most famous facts in everyday physics and the reason lakes freeze top-down.
Making ice float is a small change and an instantly recognisable "oh, that's
right" moment.

## What's already accurate (leave alone)

- **Water + Lava → Obsidian + Steam** — correct. Fast-quenched lava forms
  volcanic glass.
- **Lava cooling slowly in air → Stone** — correct, and the *contrast* with
  the line above is real petrology: fast cooling = glassy, slow = crystalline.
- **Dirt + Water → Mud**, seeds sprouting only on wet ground — correct.
- **Water douses Fire → Steam** — correct.
- **Plant + Fire → Ash** — correct.

## What's still fake, stated plainly

1. ~~**Sand + Lava → Glass.**~~ **Resolved in Phase 2.6.** This recipe is
   gone — Sand + Lightning → Glass replaces it (lightning is ~30,000° and
   striking sand really does fuse it into fulgurite glass). Glass is now
   100% real, not a declared concession.
2. **Steam condensing back to water after a fixed 300 frames** — real
   condensation depends on temperature, not a timer. Low priority; the
   behaviour looks right. (Glowing Neon's glow fading back to plain Neon,
   added in Phase 2.6, reuses this same timer mechanic — same honest caveat.)
3. **No fluid dynamics.** Cellular automata approximate flow; real liquid
   motion needs equations far beyond this engine. Not a goal.
4. **No molecular chemistry.** No molecules, no stoichiometry, no reaction
   rates. Reactions are recipes, not equations. Not a goal.
5. **Hydrogen + Fire → Water, and Iron + Water → Rust, both assume ambient
   oxygen rather than requiring a separate Oxygen cell.** The real chemistry
   needs O₂ as a genuine third participant (2H₂ + O₂ → 2H₂O; iron + water +
   oxygen → rust), but this engine's touch-reaction system is strictly
   two-body (`a` + `b` only) — a real three-way reaction would need an engine
   change, which the Phase 2.5 decision already rejected as too fragile to
   maintain safely. Oxygen still has its own real, standalone payoff instead
   (keeps Fire burning longer via the `refuels` mechanic — a sealed room genuinely
   starves a fire faster than an open one with Oxygen nearby), so it's not
   inert filler, just not a strict prerequisite for these two recipes.

Nothing here is hidden from the player — the Discovery Journal can eventually
carry a short "why this is real" line per recipe, which turns the accuracy
work into visible content instead of invisible plumbing.

## New elements: the filter, and the shortlist (Phase 2.6)

**Status: implemented (18 Jul 2026).** All eleven elements below shipped in
one Phase 2.6 session rather than split across metals/lightning/gases as
suggested below — see PLAN.md for the exact mechanics, deviations, and
verification. This section is kept as-is below as the original design
rationale, not rewritten after the fact.

**Do not add the periodic table.** 118 elements would mean 118 palette chips
and a journal that reads like homework, and most real elements are inert grey
solids that visibly do nothing at room temperature. More elements makes this
game worse, not better — discovery only feels special while it's scarce.

**The filter — an element earns its place only if it does something you can
SEE, that nothing already in the game does.** Gold passes. Argon doesn't.

This phase depends on Phase 2.5: none of the melting points below mean
anything until the game runs on real °C.

### Metals — the point is that lava can melt some and not others

| Element | Density | Melts at | Why it's interesting |
|---|---|---|---|
| **Gold** | 19300 | 1064°C | Lava (1150°C) **can** melt it. Densest thing in the game — sinks through everything, even mercury. Never corrodes, ever. |
| **Iron** | 7870 | 1538°C | Lava **cannot** melt it — the deliberate contrast with gold. Slowly rusts where it meets water + oxygen. |
| **Lead** | 11340 | 327°C | Even an ordinary fire melts it. |
| **Mercury** | 13534 | −39°C | **Liquid metal at room temperature.** Freezes solid if you chill it with ice. |

That gold/iron split is the whole reason to add metals: same lava, two
opposite outcomes, and the player can *discover* which is which.

### Gases — one of these is the best reaction in the game

| Element | Density | Why it's interesting |
|---|---|---|
| **Oxygen** | 1.43 | Fire needs it. More oxygen = fiercer fire; a sealed box starves the fire out. Real, and it makes walls tactical. |
| **Hydrogen** | 0.09 | Lightest thing there is, rises instantly. **Hydrogen + Oxygen + a spark → Water.** That is genuine chemistry (2H₂ + O₂ → 2H₂O) and a fantastic discovery — you *make water out of two gases*. |
| **Neon** | 0.90 | Does nothing at all — until lightning hits it, then it glows orange-red. Exactly how a neon sign works. |

### The rest

| Element | Why it's interesting |
|---|---|
| **Lightning** | ~30,000°C. Fuses sand into glass (**fulgurite** — see concession above), lights up neon, ignites anything. Fixes the game's least accurate recipe. |
| **Salt** | Dissolves into water — and salt water **melts ice**. That's literally why roads get salted in winter. |
| **Oil** | Density 900, so it **floats on water** (real, and instantly recognisable). Burns hard. |
| **Rust** | What iron becomes after enough time with water and oxygen. |

### Why this set and not another

These twelve interlock instead of sitting in isolation: iron needs oxygen and
water to rust, hydrogen needs oxygen and a spark to become water, neon needs
lightning, lightning fixes glass, salt fights ice. Every one of them gives the
player a reason to combine things they already have — which is the actual
engine of the game. A grey lump of titanium gives them nothing.

Suggested order if this gets split: metals first (they reuse the temperature
work directly), then Lightning + Neon + Salt, then the gases last (oxygen
changes how fire behaves everywhere, so it deserves its own session).

## Acid (Phase 2.7 — a real alternative to the Erase button, not a replacement)

**Origin of this idea (18 Jul 2026):** Aliff asked whether removing an
element could feel less like "magic delete" and more like a real process —
something that would visibly impress someone who actually knows chemistry,
without adding real complexity. The Erase tool itself stays exactly as it is
(every falling-sand toy needs a plain way to clear the canvas — that's a
normal utility, not a cheat, and removing it would just make the sandbox
harder to use for no realism gained). Acid is the answer to the *other*
half of the ask: a genuine substance that destroys things through real
chemistry, reusing the exact same data-only pattern every other element in
this game already uses — no new engine code, same as Phase 2.6.

| Property | Value | Why |
|---|---|---|
| Density | 1840 kg/m³ | concentrated sulfuric acid — denser than water, sinks through it |
| Type | liquid | flows and pools like any other liquid in the sim |

**Two reactions, deliberately small:**

1. **Acid + Iron → dissolves, releasing Hydrogen gas.** Real: Fe + 2HCl →
   FeCl₂ + H₂ — iron dissolving in acid genuinely produces hydrogen gas.
   The acid is consumed in the process (that's real too — this is a
   consuming reaction, not a catalyst). This is the reason Acid is worth
   adding at all: it chains directly into the Hydrogen this game already
   has (Phase 2.6) — that released Hydrogen can drift to a flame and become
   Water, the same way any other Hydrogen does. One new substance creates a
   multi-step reaction chain for free, because the pieces were already here.
2. **Acid + Stone → dissolves slowly.** Real: acid rain measurably erodes
   limestone and similar rock over long timescales; here it's just a low
   `prob` so it reads as "wearing away," not instant.

**Two deliberate non-reactions, documented rather than coded (nothing to
write — the absence of a REACTIONS entry between two elements already
means "no effect," so this is free):**

- **Acid does NOT dissolve Gold.** This is the whole point, chemically: gold
  is famous for resisting virtually every common acid — it's *why* aqua
  regia (a specific acid mixture) is famous in the first place, since it's
  one of the only things that can dissolve gold. Anyone who knows this will
  recognize it immediately. It's also a deliberate callback: the Gold/Iron
  contrast in Lava (Phase 2.6) repeats here with a completely different
  mechanism (acid instead of heat) and reaches the *same* conclusion — Gold
  resists, Iron doesn't. That consistency is what "logically smart" looks
  like from the outside.
- **Acid does NOT dissolve Glass.** True for ordinary acids — only
  hydrofluoric acid attacks glass, and that's specific enough to not need
  its own element for a one-line piece of trivia.

**Scope note:** deliberately not adding Acid+Plant, Acid+Wood, or other
organic-dissolving reactions in this pass — the two reactions above already
deliver the "wow" (a chain reaction into existing Hydrogen, and a real,
recognizable non-reaction with Gold). More can always be added later in a
five-minute weekly update; nothing about this design blocks that.

Files: `elements.js` only (one new element, two new reactions, zero engine
changes — same pattern as every other Phase 2.x content addition).
Done when: Acid dissolves Iron and releases Hydrogen (verified in browser),
Acid slowly dissolves Stone, Acid sitting on Gold or Glass does nothing,
and old saves still load.

## Guardrail (must hold, every future update)

**A wrong number must never crash the sim or break an old save.**
Concretely: clamp temperatures to a sane range, treat any missing field as
"this element doesn't do that," and never let one bad constant produce
runaway values. A weekly-update session should be able to type a wrong number
and see something *look* odd — never see the game break.

## Tasks for the Phase 2.5 session

1. Convert every temperature in `elements.js` to real °C, ambient 25°C
   (table above). Re-tune the heat-spread constants so the *pacing* still
   feels good on the new scale — the numbers change, the feel shouldn't.
2. Add `density` to every element (table above).
3. Make ice float on water using density instead of `type: 'static'`.
4. Replace lava's random `coolChance` with the real solidus rule (< 950°C
   → Stone). Keep Water + Lava → Obsidian as an instant-quench rule.
5. Add the guardrail clamp described above.
6. Add a short `why:` line to each entry in `REACTIONS` — one sentence of
   real-world justification, ready for the journal to display later.
7. Verify in a browser: water freezes at 0 and boils at 100, ice floats,
   lava crusts to stone as it cools, and old saves still load.

Files: `elements.js` (most of it), `game.js` (density/float + clamp only).
Done when: every number in `elements.js` matches this doc, and this doc has
no untracked concessions left.
