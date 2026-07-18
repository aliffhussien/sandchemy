// ============================================================
// SANDCHEMY — VISUAL EFFECTS (Phase 3 + Phase 4)
// Purely cosmetic. Reads game.js's existing globals (grid, temp,
// moved, ELEMENTS, E, W, H, frame, canvas, ctx) READ-ONLY — never
// writes to sim state. Draws to its OWN overlay canvas (#fx)
// stacked on top of #world, so game.js's own render() never had
// to change beyond one guarded hook call in loop(). Turning
// effects off (the ✨ button) is also the fps escape hatch if a
// scene ever gets too busy — see PLAN.md Phase 3.
//
// Phase 4 (depth/2.5D) adds three more purely-cosmetic layers to the
// SAME overlay canvas, still zero engine changes: edge shading (bevel),
// a day/night ambient wash tied to the real clock, and a parallax cave/
// sky backdrop painted into whatever the sim leaves EMPTY. See PLAN.md's
// Phase 4 section for the design reasoning (in particular: why the
// backdrop has to be painted per-empty-cell on THIS canvas rather than
// sitting behind #world, since #world's empty cells are opaque and
// touching that is a game.js change, off-limits this phase).
// ============================================================

const fxCanvas = document.getElementById('fx');
const fxCtx = fxCanvas.getContext('2d');
fxCanvas.width = W;
fxCanvas.height = H;
fxCtx.imageSmoothingEnabled = false;

const FX_STORAGE = 'sandchemy.effects';
let effectsOn = localStorage.getItem(FX_STORAGE) !== 'off';

const fxBtn = document.getElementById('fxBtn');
function syncFxBtn() {
  fxBtn.textContent = effectsOn ? '✨ Effects' : '✨ Effects (off)';
  fxBtn.classList.toggle('active', effectsOn);
}
fxBtn.addEventListener('click', () => {
  effectsOn = !effectsOn;
  localStorage.setItem(FX_STORAGE, effectsOn ? 'on' : 'off');
  syncFxBtn();
  if (!effectsOn) fxCtx.clearRect(0, 0, W, H); // leave a clean canvas behind, not a frozen last frame
});
syncFxBtn();

// ---------- particles ----------
// One flat array, hard-capped so a busy scene can never spiral into a
// slideshow — once full, new spawns are just skipped for that frame.
const MAX_PARTICLES = 200;
let particles = [];

// Per-cell "was this powder airborne last frame?" — lets us fire a one-shot
// dust puff exactly on the frame a falling powder comes to rest, instead of
// emitting continuously. Cheap: one Uint8Array, updated in the same pass
// that already scans the whole grid every frame.
const wasFalling = new Uint8Array(W * H);

const PARTICLE_KINDS = {
  spark:  { vx: () => (Math.random() - 0.5) * 0.3, vy: () => -0.35 - Math.random() * 0.4, life: () => 12 + Math.random() * 10, color: [255, 180, 60] },
  bubble: { vx: () => (Math.random() - 0.5) * 0.08, vy: () => -0.15 - Math.random() * 0.1, life: () => 20 + Math.random() * 15, color: [220, 240, 255] },
  smoke:  { vx: () => (Math.random() - 0.5) * 0.15, vy: () => -0.1 - Math.random() * 0.15, life: () => 30 + Math.random() * 20, color: [150, 150, 158] },
  dust:   { vx: () => (Math.random() - 0.5) * 0.5, vy: () => -0.25 - Math.random() * 0.2, life: () => 8 + Math.random() * 6, color: [206, 184, 140] },
};

function spawnParticle(x, y, kind) {
  if (particles.length >= MAX_PARTICLES) return;
  const k = PARTICLE_KINDS[kind];
  if (!k) return;
  particles.push({ x, y, vx: k.vx(), vy: k.vy(), age: 0, life: k.life(), color: k.color });
}

function updateAndDrawParticles() {
  fxCtx.globalCompositeOperation = 'source-over';
  const next = [];
  for (const p of particles) {
    p.age++;
    if (p.age > p.life) continue;
    p.x += p.vx;
    p.y += p.vy;
    p.vx += (Math.random() - 0.5) * 0.04; // gentle wobble so drift doesn't look robotic
    const alpha = (1 - p.age / p.life) * 0.9;
    fxCtx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha.toFixed(2)})`;
    fxCtx.fillRect(p.x, p.y, 1, 1);
    next.push(p);
  }
  particles = next;
}

// ---------- Phase 4: day/night cycle ----------
// A smooth 0 (full day) -> 1 (full night) factor read from the player's
// REAL clock, recomputed fresh every frame (one Date call, one cosine —
// negligible cost). Peaks at true midnight, bottoms out at true noon, so
// it's a genuine "calm-app bonus" tied to actual local time, not a fake
// in-game clock.
function nightFactor() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const theta = (hours / 24) * Math.PI * 2;
  return (1 + Math.cos(theta)) / 2; // theta=0 (midnight) -> 1, theta=π (noon) -> 0
}

// ---------- Phase 4: parallax backdrop ----------
// A handful of soft, distant silhouette blobs that drift sideways slowly
// and wrap around — the classic cheap parallax trick. Fixed rows/radii/
// speeds so the backdrop has a consistent "shape" rather than reshuffling
// every reload, only their x position moves over time.
const BG_BLOBS = [
  { y: 16, r: 13, speed: 0.006, phase: 10 },
  { y: 34, r: 9,  speed: 0.010, phase: 70 },
  { y: 58, r: 15, speed: 0.004, phase: 130 },
  { y: 82, r: 10, speed: 0.008, phase: 30 },
  { y: 104, r: 12, speed: 0.005, phase: 100 },
];

// Only ever called for cells the SIM itself has left EMPTY — this paints
// over that flat, opaque dark-navy fill (see elements.js's EMPTY color)
// with a vertical cave/sky gradient plus the drifting blobs above, so it
// reads as "a backdrop behind the sandbox" instead of flat dark. Deliberately
// per-cell (not a single big gradient fill) because this canvas sits ON TOP
// of #world — a whole-canvas fill would blot out every actual element too;
// see the Phase 4 note in PLAN.md for why the backdrop can't live on a
// canvas behind #world instead without a game.js change.
function drawBackdropCell(x, y, night) {
  const t = y / H;
  let r = 13 + t * 10, g = 15 + t * 9, b = 26 - t * 4; // dark ceiling -> slightly warmer floor
  r -= night * 6; g -= night * 4; b += night * 6; // ages with the same clock as the foreground wash
  for (let bi = 0; bi < BG_BLOBS.length; bi++) {
    const blob = BG_BLOBS[bi];
    const span = W + 2 * blob.r;
    let bx = (blob.phase + frame * blob.speed) % span;
    if (bx < 0) bx += span;
    bx -= blob.r;
    const dx = x - bx, dy = y - blob.y;
    if (dx * dx + dy * dy < blob.r * blob.r) { r -= 4; g -= 3; b -= 2; }
  }
  fxCtx.fillStyle = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  fxCtx.fillRect(x, y, 1, 1);
}

// ---------- Phase 4.6: material textures ----------
// Gives each solid/static/metal element its own distinct surface pattern
// (see PLAN.md Phase 4.6 for the "why" — Wall/Stone/Wood/metals all looked
// identical besides color before this). Purely cosmetic, reads elements.js's
// new `texture:` field, folds into the SAME per-frame grid scan glow/
// particles/shading already use below — no new full-grid loop.
//
// The critical rule: every pattern is seeded from the cell's own (x,y)
// position, NEVER Math.random() per frame. Random-per-frame would repaint a
// different pixel every single frame, which reads as flickering TV static,
// not a stable material — a real rock/plank/metal surface looks the same
// from one frame to the next. texHash() is a small deterministic integer
// hash: same (x, y, seed) in always produces the same float out.
function texHash(x, y, seed) {
  let h = x * 374761393 + y * 668265263 + (seed || 0) * 69069;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 1000) / 1000; // stable float in [0, 1), deterministic per (x,y,seed)
}

function drawTexture(x, y, el) {
  switch (el.texture) {
    case 'rocky': {
      // Coarse ~3x3 clusters, each cluster gets its own stable shade offset
      // (same cluster -> same hash -> same shade, every frame) — reads as a
      // scatter of distinct pebbles/chunks, not a smooth flat disc, even
      // though the underlying cell is one static, immovable mass.
      const cx = (x / 3) | 0, cy = (y / 3) | 0;
      const h = texHash(cx, cy, 37);
      if (h > 0.55) {
        fxCtx.globalCompositeOperation = 'lighter';
        fxCtx.fillStyle = `rgba(255,255,255,${(0.05 + h * 0.10).toFixed(2)})`;
      } else {
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.fillStyle = `rgba(0,0,0,${(0.05 + (0.55 - h) * 0.18).toFixed(2)})`;
      }
      fxCtx.fillRect(x, y, 1, 1);
      break;
    }
    case 'grain': {
      // Thin horizontal streaks, broken into short position-seeded segments
      // (not one line spanning the whole grid) so a big Wood mass reads as
      // distinct planks — warm brown variation, classic wood grain.
      const seg = texHash(x >> 2, y, 11);
      if (seg > 0.72) {
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.fillStyle = 'rgba(50,30,12,0.28)';
        fxCtx.fillRect(x, y, 1, 1);
      } else if (seg < 0.12) {
        fxCtx.globalCompositeOperation = 'lighter';
        fxCtx.fillStyle = 'rgba(200,160,100,0.18)';
        fxCtx.fillRect(x, y, 1, 1);
      }
      break;
    }
    case 'metallic': {
      // Repeating diagonal highlight/shadow band, purely a function of
      // (x - y) — reads as a sheen catching the light across a reflective
      // metal surface. No hash needed here: the geometry itself is the
      // stable, position-seeded pattern.
      const period = 12;
      const pos = (((x - y) % period) + period) % period;
      if (pos < 2) {
        fxCtx.globalCompositeOperation = 'lighter';
        fxCtx.fillStyle = 'rgba(255,255,255,0.22)';
        fxCtx.fillRect(x, y, 1, 1);
      } else if (pos > period - 3) {
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.fillStyle = 'rgba(0,0,0,0.12)';
        fxCtx.fillRect(x, y, 1, 1);
      }
      break;
    }
    case 'brick': {
      // Mortar-line grid with alternating row offset (a real running brick
      // bond) — reads as a BUILT structure, deliberately distinct from
      // Stone's natural rock chunks even though both are similar grey.
      const brickW = 6, brickH = 3;
      const row = (y / brickH) | 0;
      const offsetX = (row % 2) * (brickW >> 1);
      const lx = ((x + offsetX) % brickW + brickW) % brickW;
      const ly = y % brickH;
      if (lx === 0 || ly === 0) {
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.fillStyle = 'rgba(15,15,20,0.35)';
        fxCtx.fillRect(x, y, 1, 1);
      }
      break;
    }
    case 'crystal': {
      // Sparse faceted sparkle points at stable, hash-picked positions.
      const h = texHash(x, y, 91);
      if (h > 0.93) {
        fxCtx.globalCompositeOperation = 'lighter';
        fxCtx.fillStyle = 'rgba(255,255,255,0.55)';
        fxCtx.fillRect(x, y, 1, 1);
      } else if (h < 0.06) {
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.fillStyle = 'rgba(0,0,0,0.15)';
        fxCtx.fillRect(x, y, 1, 1);
      }
      break;
    }
  }
}

// ---------- one fused pass: backdrop + edge shading + glow + wet-look + particle spawns ----------
// All these cosmetic layers read the same per-cell data, so they share a
// single grid.length scan instead of several separate ones — still
// O(W*H), just once.
function scanAndEmit(night) {
  const hotRows = new Set();

  for (let i = 0; i < grid.length; i++) {
    const id = grid[i];
    const x = i % W, y = (i / W) | 0;

    if (id === E.EMPTY) {
      wasFalling[i] = 0;
      fxCtx.globalCompositeOperation = 'source-over';
      drawBackdropCell(x, y, night);
      continue;
    }

    const el = ELEMENTS[id];

    // Phase 4 edge shading (fake bevel): a cell with open space to its
    // upper-left gets a light highlight edge, open space to its lower-right
    // gets a dark shadow edge — instant "this is a lit, rounded pile" read
    // for sand heaps, walls, anything solid. Skipped for gas/fire, which
    // don't have a "surface" to bevel. Applied as a flat per-cell tint
    // rather than a sub-pixel line (the sim only renders at 180x120 before
    // the browser's own pixelated upscaling, so there's no room for a
    // thinner line to read as anything but this same flat tint anyway —
    // cheaper, and it still reads correctly across a whole pile's silhouette).
    if (el.type !== 'gas' && el.type !== 'fire') {
      const upLeftEmpty = x > 0 && y > 0 && grid[i - W - 1] === E.EMPTY;
      const downRightEmpty = x < W - 1 && y < H - 1 && grid[i + W + 1] === E.EMPTY;
      if (upLeftEmpty) {
        fxCtx.globalCompositeOperation = 'lighter';
        fxCtx.fillStyle = 'rgba(255,255,255,0.10)';
        fxCtx.fillRect(x, y, 1, 1);
      } else if (downRightEmpty) {
        fxCtx.globalCompositeOperation = 'source-over';
        fxCtx.fillStyle = 'rgba(0,0,0,0.16)';
        fxCtx.fillRect(x, y, 1, 1);
      }
    }

    // Phase 4.6 material textures — data-driven via elements.js's `texture`
    // field. Placed before the Wall early-continue below so Wall's own
    // `brick` texture still renders (Wall has nothing else to draw after
    // this point anyway — no glow/particle/wet-look fields).
    if (el.texture) drawTexture(x, y, el);

    if (id === E.WALL) { wasFalling[i] = 0; continue; } // walls get shading above, nothing below

    // Glow: reuses the existing heatEmit field directly — no new elements.js
    // field needed. Anything that radiates positive heat (Fire, Lava,
    // Lightning, Molten Gold, Molten Lead, ...) bathes its own cell in a
    // soft additive bloom. heatEmit magnitude sets brightness, clamped so
    // Lightning's 30,000° doesn't blow out any harder than Lava's 1150°.
    if (el.heatEmit && el.heatEmit > 0) {
      if (el.heatEmit > 500) hotRows.add(y); // also feeds the heat-shimmer pass below
      const strength = Math.min(el.heatEmit / 1200, 1);
      const radius = 2.5 + strength * 1.5;
      fxCtx.globalCompositeOperation = 'lighter';
      const grad = fxCtx.createRadialGradient(x + 0.5, y + 0.5, 0, x + 0.5, y + 0.5, radius);
      grad.addColorStop(0, `rgba(255,150,60,${(0.25 * strength).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(255,150,60,0)');
      fxCtx.fillStyle = grad;
      fxCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    // Wet look: water's exposed surface (open air directly above) gets an
    // occasional bright highlight pixel, animated with a per-column sine so
    // it reads as light glinting off moving water, not a static sparkle.
    if ((id === E.WATER || id === E.SALTWATER) && y > 0 && grid[i - W] === E.EMPTY) {
      if (Math.sin(frame * 0.08 + x * 0.5) > 0.85) {
        fxCtx.globalCompositeOperation = 'lighter';
        fxCtx.fillStyle = 'rgba(210,235,255,0.35)';
        fxCtx.fillRect(x, y, 1, 1);
      }
    }

    // Ambient particle emission — data-driven via elements.js's `particle`
    // field. Continuous but low-probability, so it reads as "seasoning,"
    // not noise.
    if (el.particle === 'spark' && Math.random() < 0.06) {
      spawnParticle(x + (Math.random() - 0.5), y - 0.5, 'spark');
    } else if (el.particle === 'smoke' && Math.random() < 0.015) {
      spawnParticle(x + (Math.random() - 0.5), y - 0.5, 'smoke');
    } else if (el.particle === 'bubble' && el.boilsAt !== undefined && temp[i] > el.boilsAt - 15 && Math.random() < 0.04) {
      // Only bubbles once genuinely close to boiling — "about to boil," not
      // "always fizzing," so it stays a real temperature cue.
      spawnParticle(x + (Math.random() - 0.5), y, 'bubble');
    }

    // "Dust when sand lands": edge-triggered on the airborne -> resting
    // transition (was in `moved` last frame, isn't this frame), not
    // continuous — a landing is a one-off event, not an ongoing emission.
    const wasAirborne = wasFalling[i];
    wasFalling[i] = moved[i];
    if (wasAirborne && !moved[i] && el.particle === 'dust' && Math.random() < 0.25) {
      spawnParticle(x, y - 0.5, 'dust');
    }
  }

  // Heat shimmer: a classic cheap 2D heat-haze fake — redraw the row just
  // above each sufficiently hot row, copied straight from the MAIN canvas,
  // offset sideways by a small sine wave, at partial opacity. Reads as
  // wavering air without ever touching game.js's own render() pixel loop
  // or needing any per-pixel distortion math.
  fxCtx.globalCompositeOperation = 'source-over';
  fxCtx.globalAlpha = 0.35;
  for (const y of hotRows) {
    if (y === 0) continue;
    const offset = Math.sin(frame * 0.15 + y) * 0.6;
    fxCtx.drawImage(canvas, 0, y - 1, W, 1, offset, y - 1, W, 1);
  }
  fxCtx.globalAlpha = 1;
}

function renderEffects() {
  if (!effectsOn) return;
  fxCtx.clearRect(0, 0, W, H);

  const night = nightFactor();
  // Whole-scene night wash: one full-canvas fill, drawn first so the
  // additive glow/backdrop colors drawn afterward can still punch back
  // through it — this is what makes lava/fire read as relatively brighter
  // at night without ever changing their actual color.
  if (night > 0.02) {
    fxCtx.globalCompositeOperation = 'source-over';
    fxCtx.fillStyle = `rgba(6,10,28,${(night * 0.4).toFixed(2)})`;
    fxCtx.fillRect(0, 0, W, H);
  }

  scanAndEmit(night);
  updateAndDrawParticles();
}
