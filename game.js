// ============================================================
// SANDCHEMY — ENGINE
// You should not need to edit this file for weekly content
// updates. All elements & reactions live in elements.js.
// ============================================================

const W = 180, H = 120;           // simulation grid size
const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;
canvas.style.width = '720px';
ctx.imageSmoothingEnabled = false;

const grid  = new Uint8Array(W * H);   // element id per cell
const age   = new Uint16Array(W * H);  // frames alive (fire/steam/plant)
const meta  = new Uint8Array(W * H);   // 1 = fire that burned plant → leaves ash
const moved = new Uint8Array(W * H);   // prevents double-moves per frame

// per-cell temperature, real °C (see SCIENCE.md). Radiates from heatEmit
// elements, diffuses through neighbors, decays back toward ambient in open
// air. Coarse integers are plenty — this drives *feel*, not precision.
const AMBIENT = 25;           // real room temperature — see SCIENCE.md
// Float32, not an integer array: the new real-°C scale needs slow diffusion
// rates (sub-1-degree-per-frame is normal for realistic pacing), and an
// integer buffer TRUNCATES that fractional progress away every single
// frame — a cell can get permanently stuck exactly at a threshold instead
// of ever crossing it (discovered empirically: Ice stalled dead at exactly
// 0° forever). Floats let fractional heat actually accumulate frame to frame.
const temp     = new Float32Array(W * H);
const tempNext = new Float32Array(W * H);  // scratch buffer, reused every tick
const TEMP_RATE    = 1;       // update every frame; bump to 2 first if fps struggles
const TEMP_DIFFUSE = 0.02;    // how strongly a cell pulls toward its neighbors' average
const TEMP_DECAY   = 0.995;   // open-air cells' passive drift back toward ambient each tick
const TEMP_MIN = -200, TEMP_MAX = 35000;  // guardrail clamp — see SCIENCE.md, must survive a bad constant (raised in Phase 2.6 to fit Lightning's 30,000° heatEmit)
const SRC_HEAT = -1;       // pseudo "b" id for discover(): converted by ambient heat, not touch
const SRC_COLD = -2;       // pseudo "b" id for discover(): converted by ambient cold, not touch

// per-cell static noise for texture
const noise = new Uint8Array(W * H);
for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 20;

const img = ctx.createImageData(W, H);

// fast reaction lookup: key = a*256+b
const RULES = new Map();
for (const r of REACTIONS) {
  RULES.set(r.a * 256 + r.b, r);
}

// ---------- discoveries & persistence (localStorage only) ----------
const STORAGE_DISC = 'sandchemy.discoveries';
const STORAGE_WORLD = 'sandchemy.world';

let discoveries = {};   // id -> { recipe: "Water + Lava" }
try { discoveries = JSON.parse(localStorage.getItem(STORAGE_DISC)) || {}; } catch (e) { discoveries = {}; }

const DISCOVERABLE = Object.keys(ELEMENTS)
  .map(Number)
  .filter(id => !ELEMENTS[id].starter && !ELEMENTS[id].hidden);

function saveDiscoveries() {
  localStorage.setItem(STORAGE_DISC, JSON.stringify(discoveries));
}

function saveWorld() {
  // simple run-length encoding: "count,id;count,id;..."
  let out = [], run = 1;
  for (let i = 1; i <= grid.length; i++) {
    if (i < grid.length && grid[i] === grid[i - 1]) { run++; continue; }
    out.push(run + ',' + grid[i - 1]);
    run = 1;
  }
  localStorage.setItem(STORAGE_WORLD, out.join(';'));
}

function loadWorld() {
  const data = localStorage.getItem(STORAGE_WORLD);
  if (!data) return;
  let i = 0;
  for (const pair of data.split(';')) {
    const [count, id] = pair.split(',').map(Number);
    for (let c = 0; c < count && i < grid.length; c++, i++) grid[i] = id;
  }
}

// A freshly-placed or freshly-loaded cell needs a starting temperature, or
// it defaults to 0 — which is below freezing on the new real-°C scale and
// would instantly freeze/misbehave anything just painted. heatEmit doubles
// as "the temperature this element naturally sits at" (e.g. Lava starts
// molten at 1150, Ice starts right at its own 0° melt point); anything
// without a heatEmit just starts at room temperature.
function restingTemp(id) {
  const h = ELEMENTS[id].heatEmit;
  return h !== undefined ? h : AMBIENT;
}

function discover(id, aId, bId) {
  if (discoveries[id] || ELEMENTS[id].starter || ELEMENTS[id].hidden) return;
  const aName = aId === E.EMPTY ? 'Air' : aId === SRC_HEAT ? 'Heat' : aId === SRC_COLD ? 'Cold' : ELEMENTS[aId].name;
  const bName = bId === E.EMPTY ? 'Air' : bId === SRC_HEAT ? 'Heat' : bId === SRC_COLD ? 'Cold' : ELEMENTS[bId].name;
  const recipe = aName + ' + ' + bName;
  discoveries[id] = { recipe };
  saveDiscoveries();
  showToast('✨ New discovery: ' + ELEMENTS[id].emoji + ' ' + ELEMENTS[id].name + '! (' + recipe + ')');
  buildPalette(id);
  renderJournal(id);
  updateCounter();
}

// ---------- UI: palette, journal, toast ----------
const paletteEl = document.getElementById('palette');
const journalEl = document.getElementById('journalList');
const counterEl = document.getElementById('counter');
const toastEl = document.getElementById('toast');
let toastTimer = null;

let currentElement = E.SAND;
let brushSize = 4;

function buildPalette(newId) {
  paletteEl.innerHTML = '';
  const ids = Object.keys(ELEMENTS).map(Number)
    .filter(id => !ELEMENTS[id].hidden && (ELEMENTS[id].starter || discoveries[id]));
  ids.push(-1); // eraser
  for (const id of ids) {
    const chip = document.createElement('button');
    chip.className = 'chip' + (id === currentElement ? ' active' : '') + (id === newId ? ' new-chip' : '');
    chip.textContent = id === -1 ? '🧽 Erase' : ELEMENTS[id].emoji + ' ' + ELEMENTS[id].name;
    chip.onclick = () => { currentElement = id; buildPalette(); };
    paletteEl.appendChild(chip);
  }
}

function renderJournal(newId) {
  journalEl.innerHTML = '';
  for (const id of DISCOVERABLE) {
    const li = document.createElement('li');
    if (discoveries[id]) {
      if (id === newId) li.className = 'new-entry';
      li.innerHTML = '<span>' + ELEMENTS[id].emoji + ' ' + ELEMENTS[id].name + '</span>' +
        '<span class="recipe">' + discoveries[id].recipe + '</span>';
    } else {
      li.className = 'locked';
      li.innerHTML = '<span>❓ ???</span><span class="recipe">not discovered yet</span>';
    }
    journalEl.appendChild(li);
  }
}

function updateCounter() {
  counterEl.textContent = Object.keys(discoveries).length + ' / ' + DISCOVERABLE.length + ' discovered';
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 3200);
}

// ---------- painting & probe ----------
let painting = false;
let probeActive = false;

let undoStack = [];
let redoStack = [];
const MAX_UNDO = 20;

function saveSnapshot(stack) {
  stack.push({
    grid: new Uint8Array(grid),
    age: new Uint16Array(age),
    meta: new Uint8Array(meta),
    temp: new Float32Array(temp)
  });
  if (stack.length > MAX_UNDO) stack.shift();
}

function restoreSnapshot(snap) {
  grid.set(snap.grid);
  age.set(snap.age);
  meta.set(snap.meta);
  temp.set(snap.temp);
}

function paintAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((clientX - rect.left) / rect.width * W);
  const y = Math.floor((clientY - rect.top) / rect.height * H);
  const r = brushSize;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const px = x + dx, py = y + dy;
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const i = py * W + px;
      if (currentElement === -1) {
        grid[i] = E.EMPTY; age[i] = 0; meta[i] = 0; temp[i] = AMBIENT;
      } else if (grid[i] === E.EMPTY || currentElement === E.EMPTY) {
        // liquids/powders paint sparsely so they flow naturally
        const el = ELEMENTS[currentElement];
        if ((el.type === 'liquid' || el.type === 'powder') && Math.random() < 0.4) continue;
        grid[i] = currentElement; age[i] = 0; meta[i] = 0; temp[i] = restingTemp(currentElement);
      }
    }
  }
}

canvas.addEventListener('pointerdown', e => { 
  saveSnapshot(undoStack);
  redoStack = [];
  painting = true; 
  paintAt(e.clientX, e.clientY); 
});
window.addEventListener('pointermove', e => { 
  if (painting) paintAt(e.clientX, e.clientY); 
  if (probeActive) updateProbe(e.clientX, e.clientY);
});
window.addEventListener('pointerup', () => { painting = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

function updateProbe(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((clientX - rect.left) / rect.width * W);
  const y = Math.floor((clientY - rect.top) / rect.height * H);
  if (x >= 0 && x < W && y >= 0 && y < H) {
    const i = y * W + x;
    const elId = grid[i];
    const el = ELEMENTS[elId];
    document.getElementById('sEl').textContent = elId === E.EMPTY ? 'Empty Space' : (el.emoji + ' ' + el.name);
    document.getElementById('sState').textContent = elId === E.EMPTY ? 'Vacuum' : (el.type.charAt(0).toUpperCase() + el.type.slice(1));
    document.getElementById('sTemp').textContent = temp[i].toFixed(1);
  } else {
    document.getElementById('sEl').textContent = '--';
    document.getElementById('sState').textContent = '--';
    document.getElementById('sTemp').textContent = '--';
  }
}

document.getElementById('brush').addEventListener('input', e => { brushSize = Number(e.target.value); });

document.getElementById('probeBtn').addEventListener('click', e => {
  probeActive = !probeActive;
  e.target.classList.toggle('active', probeActive);
  document.getElementById('sensorHUD').classList.toggle('hidden', !probeActive);
});

let paused = false;
document.getElementById('pauseBtn').addEventListener('click', e => {
  paused = !paused;
  // Phase 7c: icon-only toolbar per Aliff's own call — the play/pause glyph
  // itself already communicates state, same as the browser's own media
  // controls, so the word is dropped but the underlying pause/resume LOGIC
  // above this line is completely untouched (this is a label-string change,
  // not an engine change).
  e.target.textContent = paused ? '▶️' : '⏸';
});
document.getElementById('undoBtn').addEventListener('click', () => {
  if (!undoStack.length) return;
  saveSnapshot(redoStack);
  restoreSnapshot(undoStack.pop());
});
document.getElementById('redoBtn').addEventListener('click', () => {
  if (!redoStack.length) return;
  saveSnapshot(undoStack);
  restoreSnapshot(redoStack.pop());
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Clear the whole sandbox? (Your discoveries are kept.)')) {
    saveSnapshot(undoStack);
    redoStack = [];
    grid.fill(E.EMPTY); age.fill(0); meta.fill(0);
    for (let i = 0; i < grid.length; i++) temp[i] = restingTemp(grid[i]);
    saveWorld();
  }
});

// ---------- physics ----------
let frame = 0;

function inBounds(x, y) { return x >= 0 && x < W && y >= 0 && y < H; }

function trySwapOrMove(i, j) {
  // move cell i into cell j (j must be EMPTY) — or swap if j is a liquid and i is a sinking powder
  // Temperature MUST travel with the substance, not stay pinned to the grid
  // index — otherwise a falling cell instantly inherits whatever temp was
  // left behind at its new position (e.g. leftover ambient air), which can
  // put it on the wrong side of its own melt/boil/freeze threshold the
  // instant it moves, regardless of its real temperature a frame earlier.
  grid[j] = grid[i]; age[j] = age[i]; meta[j] = meta[i]; temp[j] = temp[i];
  grid[i] = E.EMPTY; age[i] = 0; meta[i] = 0; temp[i] = AMBIENT;
  moved[j] = 1;
}

function applyReaction(i, j) {
  const a = grid[i], b = grid[j];
  if (a === E.EMPTY || b === E.EMPTY) return false;
  let rule = RULES.get(a * 256 + b), flipped = false;
  if (!rule) { rule = RULES.get(b * 256 + a); flipped = true; }
  if (!rule) return false;
  if (Math.random() > (rule.prob !== undefined ? rule.prob : 1)) return false;

  const ci = flipped ? j : i;  // the "a" cell
  const cj = flipped ? i : j;  // the "b" cell

  // some reactions only fire once the "a" cell has itself soaked up enough
  // heat — e.g. sand only turns to glass once IT is hot enough, which only
  // happens pressed deep against a big lava mass (many hot neighbors), not
  // brushing one thin, fast-cooling trickle.
  if (rule.minTemp !== undefined && temp[ci] < rule.minTemp) return false;

  if (rule.wets) {
    // cosmetic-only: no id change, just flag the cell as visually wet.
    // Returns false (doesn't consume the cell's turn) so touching water
    // doesn't permanently block movement — Sand is denser than Water and
    // must still be able to sink through it (see the density-sink check in
    // step()); if this returned true, Sand resting on Water would re-fire
    // "wets" every single frame forever and never get a turn to move.
    meta[ci] = 2;
    return false;
  }

  if (rule.refuels) {
    // lifespan-only: no id change, just resets the "a" cell's age — used by
    // Oxygen keeping Fire burning longer instead of turning either cell
    // into something else. Returns false for the same reason as `wets`:
    // touching Fire shouldn't freeze Oxygen in place and block it from
    // rising away like a normal gas.
    age[ci] = 0;
    return false;
  }

  // A touch reaction creates a NEW substance, same as painting or loading —
  // its temperature must reset accordingly (via the same restingTemp()),
  // not keep whatever the OLD substance's temp happened to be. Without
  // this, e.g. cold Ice (-40°) touching Lava becomes Water but keeps -40°,
  // which is below Water's own 0° freezing point — so it would instantly
  // re-freeze back to Ice on the very next temperature tick, the same
  // frame, undoing the reaction the player just watched happen.
  grid[ci] = rule.aTo; age[ci] = 0; meta[ci] = rule.burnt && rule.aTo === E.FIRE ? 1 : 0; temp[ci] = restingTemp(rule.aTo);
  grid[cj] = rule.bTo; age[cj] = 0; meta[cj] = rule.burnt && rule.bTo === E.FIRE ? 1 : 0; temp[cj] = restingTemp(rule.bTo);
  moved[ci] = 1; moved[cj] = 1;
  discover(rule.aTo, rule.a, rule.b);
  discover(rule.bTo, rule.a, rule.b);
  return true;
}

// Radiant heat: diffuses through neighbors (walls block it completely —
// that's what makes a wall protect ice from a fire on the other side) and
// decays back toward ambient. A heatEmit element always CONTRIBUTES at
// least its heatEmit (or at most, if negative/cold) to its neighbors' sums,
// regardless of its own stored temp — so a neighbor always feels the full
// heat, while the emitter's own reading stays purely emergent (this is what
// lets Ice, which is itself a cold emitter, still register hot enough to
// melt when it's the one being overwhelmed by nearby lava).
// Then any cell whose OWN temperature crosses a melts/boils/freezes/ignites
// threshold converts — this is what lets lava melt ice from a short
// distance, or many fires slowly boil water they never actually touch.
function updateTemperature() {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (grid[i] === E.WALL) { tempNext[i] = 0; continue; } // walls never conduct heat
      let sum = 0, count = 0;
      const n0 = y > 0 ? i - W : -1, n1 = y + 1 < H ? i + W : -1;
      const n2 = x > 0 ? i - 1 : -1, n3 = x + 1 < W ? i + 1 : -1;
      for (const ni of [n0, n1, n2, n3]) {
        if (ni < 0 || grid[ni] === E.WALL) continue;
        const nEl = ELEMENTS[grid[ni]];
        let c = temp[ni];
        if (nEl.heatEmit !== undefined) c = nEl.heatEmit > 0 ? Math.max(c, nEl.heatEmit) : Math.min(c, nEl.heatEmit);
        sum += c; count++;
      }
      let t = temp[i];
      if (count > 0) t += TEMP_DIFFUSE * (sum / count - t);
      // Open air actively drifts back toward ambient. Solids/liquids get NO
      // independent ambient pull — they only change temperature through
      // diffusion from actual neighbors ("thermal inertia"). Without this
      // split, Ice (meltsAt: 0, i.e. below ambient 25) would spontaneously
      // melt just from sitting in "ambient" air, which is backwards.
      if (grid[i] === E.EMPTY) t = AMBIENT + (t - AMBIENT) * TEMP_DECAY;
      // Guardrail: a bad constant (weekly content update, typo, whatever)
      // must never send the sim into runaway or NaN values — see SCIENCE.md.
      // Clamp, don't crash.
      if (t < TEMP_MIN) t = TEMP_MIN; else if (t > TEMP_MAX) t = TEMP_MAX;
      tempNext[i] = t;
    }
  }
  temp.set(tempNext);

  for (let i = 0; i < grid.length; i++) {
    const id = grid[i];
    if (id === E.EMPTY || id === E.WALL) continue;
    const el = ELEMENTS[id];
    const t = temp[i];
    // Strict comparisons: sitting exactly AT a threshold is stable (e.g. Ice
    // rests right at its own 0° melt point via restingTemp() — it must
    // exceed 0, not just reach it, or every freshly placed/loaded Ice cell
    // would melt on its very first temperature tick).
    if (el.meltsAt !== undefined && t > el.meltsAt) {
      grid[i] = el.meltsTo; age[i] = 0; meta[i] = 0;
      discover(el.meltsTo, id, SRC_HEAT);
    } else if (el.boilsAt !== undefined && t > el.boilsAt) {
      grid[i] = el.boilsTo; age[i] = 0; meta[i] = 0;
      discover(el.boilsTo, id, SRC_HEAT);
    } else if (el.freezesAt !== undefined && t < el.freezesAt) {
      grid[i] = el.freezesTo; age[i] = 0; meta[i] = 0;
      discover(el.freezesTo, id, SRC_COLD);
    } else if (el.ignitesAt !== undefined && t > el.ignitesAt) {
      grid[i] = E.FIRE; age[i] = 0; meta[i] = el.burnsToAsh ? 1 : 0;
    }
  }
}

function step() {
  moved.fill(0);
  frame++;

  for (let y = H - 1; y >= 0; y--) {
    const ltr = (frame + y) % 2 === 0;
    for (let xi = 0; xi < W; xi++) {
      const x = ltr ? xi : W - 1 - xi;
      const i = y * W + x;
      const id = grid[i];
      if (id === E.EMPTY || moved[i]) continue;

      // reactions: check right and down neighbors (covers every adjacent pair once)
      if (x + 1 < W && applyReaction(i, i + 1)) continue;
      if (y + 1 < H && applyReaction(i, i + W)) continue;

      const el = ELEMENTS[id];
      const below = i + W, dir = Math.random() < 0.5 ? 1 : -1;

      switch (el.type) {
        case 'creature': {
          age[i]++;
          if (el.diesAt !== undefined && temp[i] >= el.diesAt) {
            grid[i] = el.diesTo !== undefined ? el.diesTo : E.ASH;
            age[i] = 0; meta[i] = 0;
            break;
          }
          if (Math.random() < 0.4) {
            const dirs = [1, -1, W, -W];
            for (let k = 0; k < 4; k++) {
              const swp = Math.floor(Math.random() * 4);
              const tmpDir = dirs[k]; dirs[k] = dirs[swp]; dirs[swp] = tmpDir;
            }
            for (const d of dirs) {
              const target = i + d;
              if (d === 1 && x === W - 1) continue;
              if (d === -1 && x === 0) continue;
              if (d === W && y === H - 1) continue;
              if (d === -W && y === 0) continue;
              const targetId = grid[target];
              if (targetId === (el.habitat !== undefined ? el.habitat : E.EMPTY)) {
                grid[i] = targetId; grid[target] = id;
                age[target] = age[i]; age[i] = 0;
                const tt = temp[i]; temp[i] = temp[target]; temp[target] = tt;
                moved[i] = 1; moved[target] = 1;
                break;
              }
            }
          }
          break;
        }
        case 'powder': {
          if (el.slow && Math.random() < 0.4) break;
          if (y + 1 < H) {
            if (grid[below] === E.EMPTY) { trySwapOrMove(i, below); break; }
            // sink through liquids — only if actually denser (real density
            // comparison; this is what lets Ice float on Water instead of
            // sinking through it while Sand still sinks — see SCIENCE.md).
            const belowEl = ELEMENTS[grid[below]];
            if (belowEl.type === 'liquid' && (el.density || 0) > (belowEl.density || 0) && Math.random() < 0.25) {
              const tmp = grid[i]; grid[i] = grid[below]; grid[below] = tmp;
              const tt = temp[i]; temp[i] = temp[below]; temp[below] = tt; // temp travels with the swap too
              moved[i] = 1; moved[below] = 1; break;
            }
            const d1 = below + dir, d2 = below - dir;
            if (inBounds(x + dir, y + 1) && grid[d1] === E.EMPTY) { trySwapOrMove(i, d1); break; }
            if (inBounds(x - dir, y + 1) && grid[d2] === E.EMPTY) { trySwapOrMove(i, d2); break; }
          }
          break;
        }
        case 'liquid': {
          if (el.viscous && Math.random() < 0.6) break;
          if (y + 1 < H && grid[below] === E.EMPTY) { trySwapOrMove(i, below); break; }
          const d1 = below + dir;
          if (y + 1 < H && inBounds(x + dir, y + 1) && grid[d1] === E.EMPTY) { trySwapOrMove(i, d1); break; }
          // spread sideways
          const disp = el.dispersion || 2;
          for (let s = 1; s <= disp; s++) {
            const nx = x + dir * s;
            if (!inBounds(nx, y)) break;
            const ni = y * W + nx;
            if (grid[ni] !== E.EMPTY) break;
            if (s === disp || Math.random() < 0.5) { trySwapOrMove(i, ni); break; }
          }
          break;
        }
        case 'gas': {
          age[i]++;
          // Generic reversion (was hardcoded to Steam→Water specifically;
          // generalized in Phase 2.6 so Glowing Neon's glow can fade back to
          // plain Neon the same way, and any future gas can reuse it too).
          if (el.revertsTo !== undefined && age[i] > (el.revertsAfter || 300)) {
            grid[i] = el.revertsTo; age[i] = 0; break;
          }
          const up = i - W;
          const targets = [];
          if (y > 0 && grid[up] === E.EMPTY) targets.push(up);
          if (y > 0 && inBounds(x + dir, y - 1) && grid[up + dir] === E.EMPTY) targets.push(up + dir);
          if (inBounds(x + dir, y) && grid[i + dir] === E.EMPTY) targets.push(i + dir);
          if (targets.length && Math.random() < 0.8) trySwapOrMove(i, targets[Math.floor(Math.random() * targets.length)]);
          break;
        }
        case 'fire': {
          age[i]++;
          if (age[i] > 20 + (i % 17)) {
            grid[i] = meta[i] ? E.ASH : E.EMPTY;
            if (meta[i]) discover(E.ASH, E.PLANT, E.FIRE);
            age[i] = 0; meta[i] = 0;
          }
          break;
        }
        case 'plant': {
          // slow upward growth, limited by generation stored in age
          if (age[i] < 30 && Math.random() < 0.03) {
            const up = i - W;
            const opts = [];
            if (y > 0 && grid[up] === E.EMPTY) opts.push(up);
            if (y > 0 && inBounds(x + 1, y - 1) && grid[up + 1] === E.EMPTY) opts.push(up + 1);
            if (y > 0 && inBounds(x - 1, y - 1) && grid[up - 1] === E.EMPTY) opts.push(up - 1);
            if (opts.length) {
              const j = opts[Math.floor(Math.random() * opts.length)];
              grid[j] = E.PLANT; age[j] = age[i] + 4 + Math.floor(Math.random() * 6); moved[j] = 1;
              temp[j] = temp[i]; // new growth inherits the parent's temperature, not leftover air temp
            }
          }
          break;
        }
        // static: do nothing
      }
    }
  }

  // Temperature runs LAST: instant touch reactions above (Ice+Lava->Obsidian,
  // Water+Fire->Steam, etc.) always get first say on direct contact for a
  // cell this frame; heat/cold only finishes the job for whatever's left —
  // which is exactly what lets it reach further than touch (melting ice
  // from a short distance, boiling water near many fires) without ever
  // stealing a frame from the touch rules.
  if (frame % TEMP_RATE === 0) updateTemperature();
}

// ---------- rendering ----------
function render() {
  const d = img.data;
  for (let i = 0; i < grid.length; i++) {
    const el = ELEMENTS[grid[i]];
    let [r, g, b] = el.color;
    const n = noise[i];
    r += n; g += n; b += n;
    // animated flicker for hot/flowing things
    if (grid[i] === E.FIRE) { r += Math.random() * 60 - 20; g += Math.random() * 60 - 30; }
    else if (grid[i] === E.LAVA) { r += Math.sin((frame + i) * 0.1) * 18; g += Math.sin((frame + i) * 0.13) * 10; }
    else if (grid[i] === E.WATER) { b += Math.sin((frame * 0.5 + i) * 0.05) * 10; }
    else if (grid[i] === E.SAND && meta[i] === 2) { r -= 35; g -= 28; b -= 15; } // wet sand, darker
    const o = i * 4;
    d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

function loop() {
  if (!paused) step();
  render();
  // Phase 3: optional visual layer (glow/particles/shimmer), entirely in
  // effects.js on its own overlay canvas — this is the ONLY line game.js
  // needed for it. Guarded so the sim runs identically if effects.js isn't
  // loaded at all.
  if (typeof renderEffects === 'function') renderEffects();
  requestAnimationFrame(loop);
}

// ---------- boot ----------
loadWorld();
// Old saves only persist `grid` (element ids), never `temp` — so every cell,
// including whatever an existing save just loaded in, needs its starting
// temperature seeded the same way a freshly-painted cell does. Without this,
// every cell boots at 0 (the typed array's default), well below freezing on
// the real-°C scale, and old saves with Ice/Water/Lava in them would
// misbehave (or outright melt/freeze) on the very first tick.
for (let i = 0; i < grid.length; i++) temp[i] = restingTemp(grid[i]);
buildPalette();
renderJournal();
updateCounter();
setInterval(saveWorld, 5000);
window.addEventListener('beforeunload', saveWorld);
loop();
