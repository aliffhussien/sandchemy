// ============================================================
// SANDCHEMY — ELEMENT LAB (Phase 5)
// 100% custom sandbox features. Runs synchronously before game.js
// to inject custom elements, then binds UI on DOMContentLoaded.
// ============================================================

// --- 1. SYNCHRONOUS BOOT INJECTION ---
const customElementsData = JSON.parse(localStorage.getItem('sandchemy.custom_elements') || '[]');
let nextCustomId = 100; // Start high to avoid conflicts with built-ins

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
}

// First pass: create all custom elements so they exist in ELEMENTS
for (const ce of customElementsData) {
  const id = nextCustomId++;
  const constName = ce.name.toUpperCase().replace(/\s+/g, '_');
  E[constName] = id;
  
  let density = 1500;
  if (ce.type === 'gas') density = 1;
  else if (ce.type === 'liquid') density = 1000;
  else if (ce.type === 'static') density = 2500;
  if (ce.density !== undefined && ce.density !== null) density = Number(ce.density);

  ELEMENTS[id] = {
    name: ce.name,
    emoji: ce.emoji,
    color: ce.colorArray || hexToRgb(ce.color),
    type: ce.type,
    starter: true, // Always available in palette
    density: density,
    isCustom: true
  };
  
  // Inject advanced physics
  if (ce.heatEmit !== undefined) ELEMENTS[id].heatEmit = ce.heatEmit;
  if (ce.ignitesAt !== undefined) ELEMENTS[id].ignitesAt = ce.ignitesAt;
  
  if (ce.meltsAt !== undefined) {
    ELEMENTS[id].meltsAt = ce.meltsAt;
    if (ce.meltsTo) {
       const toId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.meltsTo);
       if (toId) ELEMENTS[id].meltsTo = Number(toId);
    }
  }
  if (ce.freezesAt !== undefined) {
    ELEMENTS[id].freezesAt = ce.freezesAt;
    if (ce.freezesTo) {
       const toId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.freezesTo);
       if (toId) ELEMENTS[id].freezesTo = Number(toId);
    }
  }
  if (ce.boilsAt !== undefined) {
    ELEMENTS[id].boilsAt = ce.boilsAt;
    if (ce.boilsTo) {
       const toId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.boilsTo);
       if (toId) ELEMENTS[id].boilsTo = Number(toId);
    }
  }
}

// Second pass: wire up reactions (now that all IDs are established)
// Because we push to REACTIONS before game.js runs, game.js will naturally 
// include these when building the RULES map!
for (const ce of customElementsData) {
  const aId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.name);
  if (!aId || !ce.reactions) continue;
  
  for (const r of ce.reactions) {
    const bId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === r.with);
    const aToId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === r.aTo);
    const bToId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === r.bTo);
    
    if (bId !== undefined) {
      REACTIONS.push({
        a: Number(aId),
        b: Number(bId),
        aTo: aToId !== undefined ? Number(aToId) : E.EMPTY,
        bTo: bToId !== undefined ? Number(bToId) : E.EMPTY,
        why: 'Custom reaction.'
      });
    }
  }
}

// --- 2. RUNTIME UI ---
window.addEventListener('DOMContentLoaded', () => {
  // Elements
  const labBtn = document.getElementById('labBtn');
  const labModal = document.getElementById('labModal');
  const closeLabBtn = document.getElementById('closeLabBtn');
  
  const tabElements = document.getElementById('tabElements');
  const tabWorlds = document.getElementById('tabWorlds');
  const paneElements = document.getElementById('paneElements');
  const paneWorlds = document.getElementById('paneWorlds');
  
  const createElementForm = document.getElementById('createElementForm');
  const reactionsList = document.getElementById('reactionsList');
  const addReactionBtn = document.getElementById('addReactionBtn');
  const customElementsList = document.getElementById('customElementsList');
  
  const worldsList = document.getElementById('worldsList');
  const worldNameInput = document.getElementById('worldNameInput');
  const saveWorldBtn = document.getElementById('saveWorldBtn');
  
  // Modal Toggle
  labBtn.addEventListener('click', () => {
    labModal.classList.remove('hidden');
    refreshCustomElementsList();
    refreshWorldsList();
    populateReactionDropdowns();
  });
  closeLabBtn.addEventListener('click', () => labModal.classList.add('hidden'));
  
  });

  // --- CUSTOM ELEMENTS LOGIC ---
  let reactionCount = 0;
  
  function getElementOptionsHtml() {
    return Object.keys(ELEMENTS)
      .map(id => ELEMENTS[id])
      .filter(el => !el.hidden)
      .map(el => `<option value="${el.name}">${el.emoji} ${el.name}</option>`)
      .join('');
  }
  
  function populateReactionDropdowns() {
    const selects = reactionsList.querySelectorAll('select');
    const options = getElementOptionsHtml();
    selects.forEach(select => {
      const val = select.value;
      select.innerHTML = options;
      if (val) select.value = val; // Try to restore selection
    });
    
    // Also populate physics dropdowns
    const physOptions = '<option value="">None</option>' + options;
    ['ceMeltsTo', 'ceFreezesTo', 'ceBoilsTo'].forEach(id => {
      const sel = document.getElementById(id);
      if (sel) {
        const val = sel.value;
        sel.innerHTML = physOptions;
        if (val) sel.value = val;
      }
    });
  }

  addReactionBtn.addEventListener('click', () => {
    if (reactionCount >= 3) return;
    reactionCount++;
    const row = document.createElement('div');
    row.className = 'reaction-row';
    row.innerHTML = `
      <div>
        <span>Touching</span>
        <select class="r-with" required>${getElementOptionsHtml()}</select>
      </div>
      <div>
        <span>It Becomes</span>
        <select class="r-ato" required>${getElementOptionsHtml()}</select>
        <span>Other Becomes</span>
        <select class="r-bto" required>${getElementOptionsHtml()}</select>
        <button type="button" class="remove-reaction-btn">Remove</button>
      </div>
    `;
    row.querySelector('.remove-reaction-btn').addEventListener('click', () => {
      row.remove();
      reactionCount--;
      if (reactionCount < 3) addReactionBtn.style.display = 'block';
    });
    reactionsList.appendChild(row);
    
    if (reactionCount >= 3) addReactionBtn.style.display = 'none';
  });

  createElementForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('ceName').value.trim();
    if (customElementsData.some(ce => ce.name === name) || Object.values(ELEMENTS).some(el => el.name === name)) {
      alert("An element with this name already exists!");
      return;
    }
    
    const ce = {
      name: name,
      emoji: document.getElementById('ceEmoji').value.trim() || '🧪',
      color: document.getElementById('ceColor').value,
      type: document.getElementById('ceType').value,
      reactions: []
    };
    
    // Capture advanced physics
    const dVal = document.getElementById('ceDensity').value;
    if (dVal !== '') ce.density = Number(dVal);
    const hVal = document.getElementById('ceHeatEmit').value;
    if (hVal !== '') ce.heatEmit = Number(hVal);
    const iVal = document.getElementById('ceIgnitesAt').value;
    if (iVal !== '') ce.ignitesAt = Number(iVal);
    
    const mVal = document.getElementById('ceMeltsAt').value;
    if (mVal !== '') { ce.meltsAt = Number(mVal); ce.meltsTo = document.getElementById('ceMeltsTo').value; }
    
    const fVal = document.getElementById('ceFreezesAt').value;
    if (fVal !== '') { ce.freezesAt = Number(fVal); ce.freezesTo = document.getElementById('ceFreezesTo').value; }
    
    const bVal = document.getElementById('ceBoilsAt').value;
    if (bVal !== '') { ce.boilsAt = Number(bVal); ce.boilsTo = document.getElementById('ceBoilsTo').value; }

    
    const rows = reactionsList.querySelectorAll('.reaction-row');
    rows.forEach(row => {
      ce.reactions.push({
        with: row.querySelector('.r-with').value,
        aTo: row.querySelector('.r-ato').value,
        bTo: row.querySelector('.r-bto').value
      });
    });
    
    // Save to localStorage
    customElementsData.push(ce);
    localStorage.setItem('sandchemy.custom_elements', JSON.stringify(customElementsData));
    
    // Inject at runtime
    const id = nextCustomId++;
    const constName = ce.name.toUpperCase().replace(/\s+/g, '_');
    E[constName] = id;
    
    let density = 1500;
    if (ce.type === 'gas') density = 1;
    else if (ce.type === 'liquid') density = 1000;
    else if (ce.type === 'static') density = 2500;
    if (ce.density !== undefined && ce.density !== null) density = Number(ce.density);
    
    ELEMENTS[id] = {
      name: ce.name,
      emoji: ce.emoji,
      color: hexToRgb(ce.color),
      type: ce.type,
      starter: true,
      density: density,
      isCustom: true
    };
    
    if (ce.heatEmit !== undefined) ELEMENTS[id].heatEmit = ce.heatEmit;
    if (ce.ignitesAt !== undefined) ELEMENTS[id].ignitesAt = ce.ignitesAt;
    
    if (ce.meltsAt !== undefined) {
      ELEMENTS[id].meltsAt = ce.meltsAt;
      if (ce.meltsTo) {
         const toId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.meltsTo);
         if (toId) ELEMENTS[id].meltsTo = Number(toId);
      }
    }
    if (ce.freezesAt !== undefined) {
      ELEMENTS[id].freezesAt = ce.freezesAt;
      if (ce.freezesTo) {
         const toId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.freezesTo);
         if (toId) ELEMENTS[id].freezesTo = Number(toId);
      }
    }
    if (ce.boilsAt !== undefined) {
      ELEMENTS[id].boilsAt = ce.boilsAt;
      if (ce.boilsTo) {
         const toId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === ce.boilsTo);
         if (toId) ELEMENTS[id].boilsTo = Number(toId);
      }
    }
    
    for (const r of ce.reactions) {
      const bId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === r.with);
      const aToId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === r.aTo);
      const bToId = Object.keys(ELEMENTS).find(k => ELEMENTS[k].name === r.bTo);
      
      if (bId !== undefined) {
        const rule = {
          a: id,
          b: Number(bId),
          aTo: aToId !== undefined ? Number(aToId) : E.EMPTY,
          bTo: bToId !== undefined ? Number(bToId) : E.EMPTY,
          why: 'Custom reaction.'
        };
        REACTIONS.push(rule);
        // Update game.js RULES map dynamically!
        RULES.set(rule.a * 256 + rule.b, rule);
      }
    }
    
    // Refresh UI
    buildPalette();
    createElementForm.reset();
    reactionsList.innerHTML = '';
    reactionCount = 0;
    addReactionBtn.style.display = 'block';
    refreshCustomElementsList();
    populateReactionDropdowns();
    
    showToast(`✨ Created custom element: ${ce.emoji} ${ce.name}`);
  });

  function refreshCustomElementsList() {
    customElementsList.innerHTML = '';
    customElementsData.forEach((ce, index) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${ce.emoji} ${ce.name}</span> <div class="item-actions">
        <button class="export-btn" data-idx="${index}">Export</button>
        <button class="delete-btn" data-idx="${index}">Delete</button>
      </div>`;
      customElementsList.appendChild(li);
    });
    
    customElementsList.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ce = customElementsData[e.target.dataset.idx];
        const code = "element:" + btoa(encodeURIComponent(JSON.stringify(ce)));
        navigator.clipboard.writeText(code).then(() => {
          showToast("📋 Code copied to clipboard!");
        });
      });
    });
    
    customElementsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!confirm("Delete this element? (Requires page reload to fully clear from game)")) return;
        customElementsData.splice(e.target.dataset.idx, 1);
        localStorage.setItem('sandchemy.custom_elements', JSON.stringify(customElementsData));
        location.reload();
      });
    });
  }

  document.getElementById('importElementBtn').addEventListener('click', () => {
    const input = document.getElementById('importElementData');
    const code = input.value.trim();
    if (!code.startsWith('element:')) { alert("Invalid element code!"); return; }
    try {
      const jsonStr = decodeURIComponent(atob(code.substring(8)));
      const ce = JSON.parse(jsonStr);
      if (customElementsData.some(existing => existing.name === ce.name)) {
        alert("Element with this name already exists!");
        return;
      }
      customElementsData.push(ce);
      localStorage.setItem('sandchemy.custom_elements', JSON.stringify(customElementsData));
      input.value = '';
      showToast(`✨ Imported ${ce.emoji} ${ce.name}! Reloading...`);
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      alert("Failed to parse element code.");
    }
  });


  // --- WORLDS LOGIC ---
  function getSavedWorlds() {
    try { return JSON.parse(localStorage.getItem('sandchemy.worlds') || '{}'); } 
    catch (e) { return {}; }
  }
  
  function saveWorlds(worlds) {
    localStorage.setItem('sandchemy.worlds', JSON.stringify(worlds));
  }
  
  function getGridRLE() {
    let out = [], run = 1;
    for (let i = 1; i <= grid.length; i++) {
      if (i < grid.length && grid[i] === grid[i - 1]) { run++; continue; }
      out.push(run + ',' + grid[i - 1]);
      run = 1;
    }
    return out.join(';');
  }
  
  function loadGridRLE(data) {
    let i = 0;
    for (const pair of data.split(';')) {
      const [count, id] = pair.split(',').map(Number);
      for (let c = 0; c < count && i < grid.length; c++, i++) grid[i] = id;
    }
    // Reset temperatures correctly for loaded elements
    for (let j = 0; j < grid.length; j++) {
       // restingTemp is global from game.js
       temp[j] = typeof restingTemp === 'function' ? restingTemp(grid[j]) : 25; 
    }
  }

  saveWorldBtn.addEventListener('click', () => {
    const name = worldNameInput.value.trim();
    if (!name) return;
    const worlds = getSavedWorlds();
    worlds[name] = getGridRLE();
    saveWorlds(worlds);
    worldNameInput.value = '';
    refreshWorldsList();
    showToast(`💾 Saved world: ${name}`);
  });
  
  function refreshWorldsList() {
    worldsList.innerHTML = '';
    const worlds = getSavedWorlds();
    for (const name in worlds) {
      const li = document.createElement('li');
      li.innerHTML = `<span>${name}</span> <div class="item-actions">
        <button class="load-btn" data-name="${name}">Load</button>
        <button class="export-btn" data-name="${name}">Export</button>
        <button class="delete-btn" data-name="${name}">Delete</button>
      </div>`;
      worldsList.appendChild(li);
    }
    
    worldsList.querySelectorAll('.load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.target.dataset.name;
        const worlds = getSavedWorlds();
        loadGridRLE(worlds[name]);
        labModal.classList.add('hidden');
        showToast(`📂 Loaded world: ${name}`);
      });
    });
    
    worldsList.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const name = e.target.dataset.name;
        const worlds = getSavedWorlds();
        const payload = JSON.stringify({ name: name, data: worlds[name] });
        const code = "world:" + btoa(payload);
        navigator.clipboard.writeText(code).then(() => {
          showToast("📋 Code copied to clipboard!");
        });
      });
    });
    
    worldsList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!confirm("Delete this world?")) return;
        const name = e.target.dataset.name;
        const worlds = getSavedWorlds();
        delete worlds[name];
        saveWorlds(worlds);
        refreshWorldsList();
      });
    });
  }

  document.getElementById('importWorldBtn').addEventListener('click', () => {
    const input = document.getElementById('importWorldData');
    const code = input.value.trim();
    if (!code.startsWith('world:')) { alert("Invalid world code!"); return; }
    try {
      const jsonStr = atob(code.substring(6));
      const payload = JSON.parse(jsonStr);
      const worlds = getSavedWorlds();
      worlds[payload.name] = payload.data;
      saveWorlds(worlds);
      input.value = '';
      refreshWorldsList();
      showToast(`✨ Imported world: ${payload.name}`);
    } catch (e) {
      alert("Failed to parse world code.");
    }
  });

  // --- Scenarios ---
  const PREBUILT_SCENARIOS = [
    {
      name: "🌋 Volcano Eruption",
      desc: "A hollow stone mountain loaded with Magma Vents. Drop stone in or watch it melt the base.",
      data: "7828,0;1,15;3,0;1,15;174,0;2,15;3,0;2,15;172,0;2,15;5,0;2,15;170,0;3,15;5,0;3,15;168,0;4,15;5,0;4,15;166,0;5,15;5,0;5,15;164,0;6,15;5,0;6,15;162,0;6,15;7,0;6,15;160,0;7,15;7,0;7,15;158,0;8,15;7,0;8,15;156,0;9,15;7,0;9,15;154,0;10,15;7,0;10,15;152,0;10,15;9,0;10,15;150,0;11,15;9,0;11,15;148,0;12,15;9,0;12,15;146,0;13,15;9,0;13,15;144,0;14,15;9,0;14,15;142,0;14,15;11,0;14,15;140,0;15,15;11,0;15,15;138,0;16,15;11,0;16,15;136,0;17,15;11,0;17,15;134,0;18,15;11,0;18,15;132,0;19,15;11,0;19,15;130,0;20,15;11,0;20,15;128,0;21,15;11,0;21,15;126,0;22,15;11,0;22,15;124,0;23,15;11,0;23,15;122,0;24,15;11,0;24,15;120,0;25,15;11,0;25,15;118,0;26,15;11,0;26,15;116,0;27,15;11,0;27,15;114,0;28,15;11,0;28,15;112,0;29,15;11,0;29,15;110,0;30,15;11,0;30,15;108,0;31,15;11,0;31,15;106,0;32,15;11,0;32,15;104,0;33,15;11,0;33,15;102,0;34,15;11,0;34,15;100,0;35,15;11,0;35,15;98,0;36,15;11,0;36,15;96,0;37,15;11,0;37,15;94,0;38,15;11,0;38,15;92,0;39,15;11,0;39,15;90,0;40,15;11,0;40,15;88,0;41,15;11,0;41,15;86,0;42,15;11,0;42,15;84,0;43,15;11,0;43,15;82,0;44,15;11,0;44,15;80,0;45,15;11,0;45,15;78,0;46,15;11,0;46,15;76,0;47,15;11,0;47,15;74,0;48,15;11,0;48,15;72,0;49,15;11,0;49,15;70,0;50,15;11,0;50,15;68,0;51,15;11,0;51,15;66,0;52,15;11,46;52,15;64,0;53,15;11,46;53,15;31,0;3600,15"
    },
    {
      name: "🌧️ The Water Cycle",
      desc: "A pool of water over a heat source. Watch it evaporate to steam, form clouds, and rain down.",
      data: "18000,0;60,15;61,0;119,15;61,0;119,15;61,0;119,15;61,0;119,15;61,0;119,15;61,0;119,15;61,18;119,15;61,18;119,15;61,18;119,15;61,18;1039,15;21,19;159,15;21,19;159,15;21,19;159,15;21,19;159,15;21,19;79,15"
    },
    {
      name: "🧪 School Science Fair",
      desc: "A small dirt mound ready for the classic Baking Soda and Vinegar acid-base reaction.",
      data: "14481,0;19,33;160,0;21,33;158,0;23,33;156,0;25,33;154,0;27,33;152,0;9,33;11,0;9,33;150,0;10,33;11,0;10,33;148,0;11,33;11,0;11,33;146,0;12,33;11,0;12,33;144,0;13,33;11,0;13,33;142,0;14,33;11,0;14,33;140,0;15,33;11,0;15,33;138,0;16,33;11,0;16,33;136,0;17,33;11,0;17,33;134,0;18,33;11,0;18,33;132,0;19,33;11,0;19,33;130,0;20,33;11,0;20,33;128,0;21,33;11,0;21,33;126,0;22,33;11,0;22,33;124,0;23,33;11,0;23,33;122,0;24,33;11,0;24,33;120,0;25,33;11,0;25,33;118,0;26,33;11,0;26,33;116,0;27,33;11,0;27,33;114,0;28,33;11,0;28,33;112,0;69,33;110,0;71,33;108,0;73,33;106,0;75,33;104,0;77,33;51,0;1800,33"
    }
  ];

  function buildScenarios() {
    const grid = document.getElementById('scenariosGrid');
    if (!grid) return;
    grid.innerHTML = '';
    PREBUILT_SCENARIOS.forEach(scenario => {
      const card = document.createElement('div');
      card.className = 'scenario-card';
      card.innerHTML = `
        <h4>${scenario.name}</h4>
        <p>${scenario.desc}</p>
        <button class="primary-btn">Load Scenario</button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        if (confirm("This will overwrite your current sandbox. Load scenario?")) {
          localStorage.setItem('sandchemy.world', scenario.data);
          location.reload();
        }
      });
      grid.appendChild(card);
    });
  }
  buildScenarios();

});

// Auto-load a Volcano for the user exactly once
if (!localStorage.getItem('sandchemy.volcano_loaded')) {
  localStorage.setItem('sandchemy.world', '7828,0;1,15;3,0;1,15;174,0;2,15;3,0;2,15;172,0;2,15;5,0;2,15;170,0;3,15;5,0;3,15;168,0;4,15;5,0;4,15;166,0;5,15;5,0;5,15;164,0;6,15;5,0;6,15;162,0;6,15;7,0;6,15;160,0;7,15;7,0;7,15;158,0;8,15;7,0;8,15;156,0;9,15;7,0;9,15;154,0;10,15;7,0;10,15;152,0;10,15;9,0;10,15;150,0;11,15;9,0;11,15;148,0;12,15;9,0;12,15;146,0;13,15;9,0;13,15;144,0;14,15;9,0;14,15;142,0;14,15;11,0;14,15;140,0;15,15;11,0;15,15;138,0;16,15;11,0;16,15;136,0;17,15;11,0;17,15;134,0;18,15;11,0;18,15;132,0;19,15;11,0;19,15;130,0;20,15;11,0;20,15;128,0;21,15;11,0;21,15;126,0;22,15;11,0;22,15;124,0;23,15;11,0;23,15;122,0;24,15;11,0;24,15;120,0;25,15;11,0;25,15;118,0;26,15;11,0;26,15;116,0;27,15;11,0;27,15;114,0;28,15;11,0;28,15;112,0;29,15;11,0;29,15;110,0;30,15;11,0;30,15;108,0;31,15;11,0;31,15;106,0;32,15;11,0;32,15;104,0;33,15;11,0;33,15;102,0;34,15;11,0;34,15;100,0;35,15;11,0;35,15;98,0;36,15;11,0;36,15;96,0;37,15;11,0;37,15;94,0;38,15;11,0;38,15;92,0;39,15;11,0;39,15;90,0;40,15;11,0;40,15;88,0;41,15;11,0;41,15;86,0;42,15;11,0;42,15;84,0;43,15;11,0;43,15;82,0;44,15;11,0;44,15;80,0;45,15;11,0;45,15;78,0;46,15;11,0;46,15;76,0;47,15;11,0;47,15;74,0;48,15;11,0;48,15;72,0;49,15;11,0;49,15;70,0;50,15;11,0;50,15;68,0;51,15;11,0;51,15;66,0;52,15;11,46;52,15;64,0;53,15;11,46;53,15;31,0;3600,15');
  localStorage.setItem('sandchemy.volcano_loaded', 'true');
  if (typeof window !== 'undefined' && window.location) window.location.reload();
}
