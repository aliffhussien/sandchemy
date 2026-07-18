// ============================================================
// SANDCHEMY — AUDIO SYSTEM (Phase 6)
// Pure Web Audio procedural sounds, 100% data-driven.
// Connects to game.js state without modifying it.
// ============================================================

let actx = null;
let masterGain = null;
let isMuted = localStorage.getItem('sandchemy.mute') === 'true';

// Loopers
let fireNoiseNode = null;
let fireGainNode = null;
let sizzleNoiseNode = null;
let sizzleGainNode = null;

// Target volumes (smoothed in update loop)
let targetFireVol = 0;
let targetSizzleVol = 0;

function initAudio() {
  if (actx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  
  actx = new AudioContext();
  masterGain = actx.createGain();
  masterGain.gain.value = isMuted ? 0 : 0.5; // keep it subtle
  masterGain.connect(actx.destination);
  
  // Fire loop (low rumbling noise)
  const fireBuffer = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const fData = fireBuffer.getChannelData(0);
  for (let i = 0; i < fData.length; i++) fData[i] = (Math.random() * 2 - 1) * 0.3;
  fireNoiseNode = actx.createBufferSource();
  fireNoiseNode.buffer = fireBuffer;
  fireNoiseNode.loop = true;
  
  const fireFilter = actx.createBiquadFilter();
  fireFilter.type = 'lowpass';
  fireFilter.frequency.value = 400; // Deep rumble
  
  fireGainNode = actx.createGain();
  fireGainNode.gain.value = 0;
  
  fireNoiseNode.connect(fireFilter);
  fireFilter.connect(fireGainNode);
  fireGainNode.connect(masterGain);
  fireNoiseNode.start();
  
  // Sizzle loop (high hiss)
  const sizzleBuffer = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
  const sData = sizzleBuffer.getChannelData(0);
  for (let i = 0; i < sData.length; i++) sData[i] = (Math.random() * 2 - 1) * 0.5;
  sizzleNoiseNode = actx.createBufferSource();
  sizzleNoiseNode.buffer = sizzleBuffer;
  sizzleNoiseNode.loop = true;
  
  const sizzleFilter = actx.createBiquadFilter();
  sizzleFilter.type = 'bandpass';
  sizzleFilter.frequency.value = 3000;
  
  sizzleGainNode = actx.createGain();
  sizzleGainNode.gain.value = 0;
  
  sizzleNoiseNode.connect(sizzleFilter);
  sizzleFilter.connect(sizzleGainNode);
  sizzleGainNode.connect(masterGain);
  sizzleNoiseNode.start();

  console.log("Audio Engine Initialized.");
}

// Master Mute
function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('sandchemy.mute', isMuted);
  if (masterGain) masterGain.gain.setValueAtTime(isMuted ? 0 : 0.5, actx.currentTime);
  const btn = document.getElementById('muteBtn');
  if (btn) btn.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Mute';
}

// Ensure mute button matches state on load
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('muteBtn');
  if (btn) {
    btn.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Mute';
    btn.addEventListener('click', toggleMute);
  }
  
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('⚠️ WARNING: This will permanently wipe all your saved worlds, discovered elements, and custom elements! Are you absolutely sure?')) {
        localStorage.clear();
        location.reload();
      }
    });
  }
  
  // Init audio on first click anywhere
  document.body.addEventListener('pointerdown', initAudio, { once: true });
});

// Patter (one-shot short tick for sand landing)
function playPatter() {
  if (!actx || isMuted) return;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(2000 + Math.random() * 500, actx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, actx.currentTime + 0.05);
  
  gain.gain.setValueAtTime(0, actx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, actx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(actx.currentTime + 0.06);
}

// Discovery Chime (happy FM sequence)
function playDiscoveryChime() {
  if (!actx || isMuted) return;
  
  const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
  notes.forEach((freq, i) => {
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, actx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.2, actx.currentTime + i * 0.1 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + i * 0.1 + 0.5);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(actx.currentTime + i * 0.1);
    osc.stop(actx.currentTime + i * 0.1 + 0.6);
  });
}

// Hook into game.js `showToast` to play discovery chime
// In JS, if showToast is global, we can monkey patch it.
let patchedDiscover = false;
function patchDiscover() {
  if (patchedDiscover || typeof showToast !== 'function') return;
  const origShowToast = showToast;
  window.showToast = function(msg) {
    if (msg.includes('✨ New discovery:')) {
      playDiscoveryChime();
    }
    origShowToast(msg);
  };
  patchedDiscover = true;
}

// We run an audio loop attached to requestAnimationFrame to smooth volumes
// based on grid contents. 
let lastAudioUpdate = 0;
function updateAudioLoop(time) {
  if (actx && fireGainNode && sizzleGainNode && !isMuted) {
    // Only scan 10 times a second max to save CPU
    if (time - lastAudioUpdate > 100) {
      lastAudioUpdate = time;
      
      let fCount = 0;
      let sCount = 0;
      
      // In a real scenario, we might scan the grid, but game.js or effects.js
      // might already have lists. Let's just do a fast sample of the grid.
      // Sizzle is produced by Steam or Smoke, Fire by Fire/Lava.
      if (typeof grid !== 'undefined' && typeof E !== 'undefined') {
        const FIRE = E.FIRE, LAVA = E.LAVA, STEAM = E.STEAM, SMOKE = E.SMOKE;
        // Sample every 7th pixel to approximate counts extremely fast
        for (let i = 0; i < grid.length; i += 7) {
          const id = grid[i];
          if (id === FIRE || id === LAVA) fCount++;
          if (id === STEAM || id === SMOKE) sCount++;
        }
      }
      
      // Max out fire at ~50 sampled cells, sizzle at ~30
      targetFireVol = Math.min(1.0, fCount / 50) * 0.4;
      targetSizzleVol = Math.min(1.0, sCount / 30) * 0.3;
    }
    
    // Smooth transition
    const currF = fireGainNode.gain.value;
    const currS = sizzleGainNode.gain.value;
    fireGainNode.gain.value = currF + (targetFireVol - currF) * 0.1;
    sizzleGainNode.gain.value = currS + (targetSizzleVol - currS) * 0.1;
  }
  
  if (!patchedDiscover) patchDiscover();
  
  requestAnimationFrame(updateAudioLoop);
}

// Start audio loop
requestAnimationFrame(updateAudioLoop);

// To get patter on sand landing, we can patch effects.js particles
// Wait, `effects.js` pushes a dust particle. Can we patch `particles.push`?
// `particles` is a global array.
let patchedParticles = false;
function patchParticlesForPatter() {
  if (patchedParticles || typeof particles === 'undefined') return;
  const origPush = particles.push;
  particles.push = function(...args) {
    const res = origPush.apply(this, args);
    // Dust is color [200, 180, 150] (sand) or similar.
    // Actually, any particle spawning might be enough to trigger a patter/sizzle tick
    // Let's just play patter if it's a dust particle (velocity mostly horizontal)
    if (args[0] && args[0].life > 0) {
       // Only trigger patter occasionally to prevent audio overload
       if (Math.random() < 0.1) playPatter();
    }
    return res;
  };
  patchedParticles = true;
}

// Try patching every frame until particles is defined
const initPatchLoop = setInterval(() => {
  if (typeof particles !== 'undefined') {
    patchParticlesForPatter();
    clearInterval(initPatchLoop);
  }
}, 500);

