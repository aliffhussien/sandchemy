# Sandchemy for Educators

A guide for teachers, lecturers, professors, and schools/colleges considering
Sandchemy as a classroom tool. If you're a student who found this on your own —
welcome too; everything below still applies to you.

**tl;dr:** Sandchemy is a free, browser-based physics/chemistry sandbox where
every reaction is real science, not a scripted effect. No install, no account,
no student data collected, works offline once opened. Open `index.html` (or
your hosted link) on any device with a browser and it just runs.

## Why bring this into a classroom

Physical labs are expensive, hazard-limited, and time-rationed — most schools
can offer only a handful of hands-on sessions per year, and certain reactions
(strong acids, live flame, radioactive materials) are simply off-limits for
younger students. Sandchemy exists to give students unlimited, safe,
zero-cost repetitions of the underlying *logic* of those reactions, so lab
time can be spent on technique and safety rather than re-discovering basic
cause-and-effect for the first time.

It is not a cartoon. Every element's melting point, boiling point, and
density in Sandchemy is a real, sourced number (see the project's own
`SCIENCE.md` reference for the full table and sources) — not invented for
visual effect. Pouring water on lava does not play a canned animation; it
produces Obsidian, because that is genuinely what happens when lava quenches
rapidly. Iron left near Acid dissolves and releases real hydrogen gas, for
the same reason a chemistry textbook says it should. If a result feels too
convenient, it's worth asking students to explain *why* — that question
almost always has a real answer built into the simulation.

## What subjects this fits

- **Chemistry** — states of matter, phase changes, acid/metal reactions,
  combustion, oxidation (rust), simple compound formation (salt water,
  hydrogen + oxygen → water).
- **Physics** — heat transfer (conduction/radiation), density and buoyancy,
  thermal equilibrium, basic electricity (Lightning, Battery, conductivity).
- **Earth & environmental science** — volcanism (Lava, Obsidian, Stone),
  weather cycles (Water, Steam, Ice, Acid Rain), erosion-style reactions.
- **Biology (lightly)** — simple organisms (Fish, Bug) with survival
  thresholds and food-chain-style interactions — useful as a way into
  ecosystem thinking at a very introductory level, not a substitute for a
  real biology curriculum.
- **Nuclear/radiation basics** — Uranium decaying into Radiation, and Lead
  genuinely shielding against it, modelled with zero real-world hazard —
  a safe way to make an otherwise abstract, hard-to-demonstrate topic
  visible and interactive.
- **Computational thinking** — the whole simulation is "if this touches
  that, and both are hot/cold/wet enough, then X happens" — genuinely useful
  as a plain-language introduction to rule-based systems and emergent
  behavior, even outside a science class.

## Tools built specifically for teaching

- **Sensor Probe** — hover any cell to read its live temperature and state.
  Use it the way you'd use a real lab thermometer: ask students to predict a
  reading before they check it.
- **Element Lab** — a no-code tool for defining a custom element (emoji,
  color, physics behavior, up to 3 reactions). Good as an assessment: give
  students a real-world material and ask them to model its behavior
  correctly using the Lab's rules.
- **Prebuilt Scenarios** (e.g. Volcano Eruption) — ready-made starting
  setups so a lesson can begin with something already interesting on
  screen, instead of an empty grid.
- **Discovery Journal** — automatically and permanently logs every new
  combination a student finds. Doubles as a built-in lab notebook: ask
  students to screenshot their journal as evidence of what they discovered
  during a session, or as a simple participation/completion check.
- **Category-tabbed palette** — 56 elements organized into 8 categories
  (Basics, Metals, Gases, Chemistry, Electric, Weather, Life, Crafting),
  so you can point students at a specific tab for a focused lesson instead
  of the whole palette at once.

## Sample lesson ideas

- **States of matter (intro level):** have students freeze Water into Ice,
  melt Ice back into Water, then boil Water into Steam — ask them to use
  the Sensor Probe to log the temperature at each transition and compare it
  to the textbook's stated freezing/boiling points.
- **Acid + metal reactions (secondary chemistry):** place Acid next to Iron
  in a walled-off area, watch it dissolve and release Hydrogen gas, then
  drift that Hydrogen to a Fire source and watch it become Water — a live,
  two-step reaction chain (Fe + 2HCl → FeCl₂ + H₂, then 2H₂ + O₂ → H₂O)
  that a single static diagram can't show as clearly.
- **Why doesn't X react with Y? (critical thinking):** ask students to try
  Acid on Gold and on Glass. Both do nothing — deliberately. Have them
  research and explain *why* real acids don't touch gold (same real-world
  fact behind aqua regia) or ordinary glass (only hydrofluoric acid attacks
  it). The absence of a reaction is itself the lesson.
- **Heat and insulation (physics):** build a Lava pool next to Ice with a
  Wall in between, then without one, and have students explain the
  temperature difference the Sensor Probe reports in each case.
- **Radiation safety (safely, for the first time):** place Uranium, let it
  decay into Radiation, and show that Lead genuinely blocks it while other
  materials don't — a hands-on radiation-shielding concept with zero real
  radioactive material anywhere near a classroom.
- **Design challenge (open-ended, any age):** use the Element Lab to model
  a real substance not yet in the game (e.g. baking soda's exact melting
  point, or a specific rock's density) and defend the choices with a source.

## Getting started (for teachers)

1. Open the app link on your own device first, ideally the same kind your
   students will use (shared lab computer, tablet, or Chromebook).
2. No sign-up, no install, no admin/IT approval needed — it's a single web
   page. If your school firewall blocks new sites by default, this is the
   one line an IT admin needs to see: it makes no outbound network calls
   after the page loads, so it can be safely allow-listed once.
3. Optional: install it as an offline app (Add to Home Screen / desktop
   install prompt) so it works even with an unreliable classroom Wi-Fi
   connection.
4. First-time students get a short, built-in 3-step tutorial automatically
   — you don't need to walk the whole class through the controls yourself.
5. Everything a student does is saved only in their own browser
   (`localStorage`) — nothing is uploaded, so there's no shared-computer
   privacy concern between students, but also no built-in way for a
   student to carry their save to a different computer unless they use the
   Element Lab's own export/import text-code feature.

## Privacy & IT notes (for administrators)

- No account creation, no login, no email collection.
- No backend server — the entire simulation runs client-side, in the
  student's own browser.
- No analytics, tracking, or third-party scripts of any kind.
- No student personal data of any kind is collected, stored remotely, or
  transmitted — there is nothing to have a data-protection conversation
  about, because there is nothing being collected.
- Once loaded, the installed/offline version needs no ongoing internet
  connection at all.

## Want to go further?

If you're piloting Sandchemy in a real classroom, co-designing a
curriculum-aligned worksheet pack, or want a teacher dashboard / LMS-
friendly version for your school or college, we'd like to hear from you —
early educator partners directly shape what gets built next.

**Contact:** cookingwithcattitude@gmail.com

---

*This document is part of the Sandchemy project. For the technical build
log, see `README.md`; for the full development roadmap, see `PLAN.md`; for
the sourced real-world numbers behind every element, see `SCIENCE.md`.*
