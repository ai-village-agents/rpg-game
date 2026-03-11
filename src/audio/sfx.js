// Procedural WebAudio SFX manager with Node-safe shim
// No external assets. Safe no-ops under Node/CI.
export const DEFAULT_CATEGORIES = ['ui','map','combat'];
function clamp01(v) {
  v = Number.isFinite(v) ? v : 0;
  if (v < 0) return 0; if (v > 1) return 1; return v;
}
function isBrowserEnv() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
function getAudioContextCtor() {
  if (!isBrowserEnv()) return null;
  return window.AudioContext || window.webkitAudioContext || null;
}
function nowSafe(ctx) {
  try { return ctx.currentTime || 0; } catch { return 0; }
}
function inferCategory(name) {
  if (!name || typeof name !== 'string') return 'ui';
  const [prefix] = name.split('_');
  if (DEFAULT_CATEGORIES.includes(prefix)) return prefix;
  return 'ui';
}
const REGISTRY = (() => {
  // Each entry is a function (ctxApi, when=0) that schedules the sound.
  // ctxApi: { scheduleTone, scheduleNoise, getCatGain }
  return {
    // UI
    ui_click(api, t=0) {
      api.scheduleTone({ type:'square', freqStart: 520, duration: 0.06, gain: 0.25 }, t);
    },
  ui_confirm(api, t=0) {
    api.scheduleTone({ type:'sine', freqStart: 600, freqEnd: 720, duration: 0.09, gain: 0.22 }, t);
    api.scheduleTone({ type:'sine', freqStart: 720, freqEnd: 840, duration: 0.10, gain: 0.20 }, t+0.09);
  },
ui_achievement(api, t=0) {
  api.scheduleTone({ type:'sine', freqStart: 660, freqEnd: 820, duration: 0.12, gain: 0.22 }, t);
  api.scheduleTone({ type:'triangle', freqStart: 880, freqEnd: 1040, duration: 0.14, gain: 0.20 }, t+0.10);
  api.scheduleTone({ type:'sine', freqStart: 1040, freqEnd: 1280, duration: 0.16, gain: 0.18 }, t+0.22);
},
ui_cancel(api, t=0) {
  api.scheduleTone({ type:'triangle', freqStart: 520, freqEnd: 380, duration: 0.09, gain: 0.22 }, t);
  api.scheduleTone({ type:'triangle', freqStart: 380, freqEnd: 320, duration: 0.10, gain: 0.20 }, t+0.08);
},
// Map
map_step(api, t=0) {
  api.scheduleNoise({ duration: 0.035, gain: 0.18 }, t);
},
map_blocked(api, t=0) {
  api.scheduleTone({ type:'sine', freqStart: 160, duration: 0.10, gain: 0.22 }, t);
  api.scheduleNoise({ duration: 0.05, gain: 0.10 }, t);
},
// Combat
combat_attack(api, t=0) {
  api.scheduleTone({ type:'square', freqStart: 420, freqEnd: 540, duration: 0.09, gain: 0.25 }, t);
},
combat_hit(api, t=0) {
  api.scheduleNoise({ duration: 0.06, gain: 0.22 }, t);
  api.scheduleTone({ type:'triangle', freqStart: 320, duration: 0.07, gain: 0.15 }, t+0.02);
},
combat_crit(api, t=0) {
  api.scheduleTone({ type:'sine', freqStart: 700, freqEnd: 880, duration: 0.08, gain: 0.22 }, t);
  api.scheduleTone({ type:'sine', freqStart: 880, freqEnd: 1040, duration: 0.10, gain: 0.20 }, t+0.07);
},
combat_heal(api, t=0) {
  api.scheduleTone({ type:'sine', freqStart: 520, freqEnd: 760, duration: 0.20, gain: 0.16 }, t);
},
combat_item(api, t=0) {
  api.scheduleTone({ type:'triangle', freqStart: 600, freqEnd: 740, duration: 0.08, gain: 0.20 }, t);
},
combat_victory(api, t=0) {
  api.scheduleTone({ type:'triangle', freqStart: 660, duration: 0.12, gain: 0.20 }, t);
  api.scheduleTone({ type:'triangle', freqStart: 880, duration: 0.16, gain: 0.18 }, t+0.12);
},
combat_defeat(api, t=0) {
  api.scheduleTone({ type:'sine', freqStart: 420, freqEnd: 220, duration: 0.30, gain: 0.18 }, t);
  api.scheduleNoise({ duration: 0.10, gain: 0.08 }, t+0.05);
}
};
})();
export function createSfx(options = {}) {
  const CtxCtor = getAudioContextCtor();
  // Shared state (even for shim)
  let masterVol = typeof options.masterVolume === 'number' ? clamp01(options.masterVolume) : 1;
  const catVols = {};
  for (const c of DEFAULT_CATEGORIES) catVols[c] = 1;
  if (options.categories) {
    for (const [k,v] of Object.entries(options.categories)) {
      if (k in catVols) catVols[k] = clamp01(v);
    }
}
let muted = !!options.muted;
// Node/CI shim path
if (!CtxCtor) {
  const shim = {
    async init() { return false; },
    play(name, _opts) { return false; },
    mute(on) { muted = !!on; },
    setMasterVolume(v){ masterVol = clamp01(v); },
    setCategoryVolume(cat, v){ if (cat in catVols) catVols[cat] = clamp01(v); },
    stopAll(){},
    dispose(){},
    isEnabled(){ return false; },
    getVolumes(){ return { master: masterVol, categories: { ...catVols }, muted }; },
    getRegistry(){ return { ...REGISTRY }; },
    hasSound(name){ return !!REGISTRY[name]; }
  };
return shim;
}
// Browser/WebAudio path
let ctx = null;
let dst = null;
let masterGain = null;
const catGains = new Map();
const active = new Set();
let enabled = false;
let noiseBuffer = null;
function ensureNoiseBuffer() {
  if (noiseBuffer) return noiseBuffer;
  if (!ctx) return null;
  const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * 1.0)), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i=0;i<data.length;i++) data[i] = (Math.random()*2 - 1) * 0.6; // white noise
  noiseBuffer = buffer;
  return noiseBuffer;
}
function makeEnvGain(startTime, duration, peak=1) {
  const g = ctx.createGain();
  const t0 = Math.max(0, startTime);
  const a = 0.005, d = 0.03, r = 0.06; // short ADSR defaults
  const tAttack = t0 + a;
  const tDecay = tAttack + d;
  const tRelease = t0 + Math.max(0.02, duration);
  // Avoid zero in exp ramps; use linear ramps for safety across browsers
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), tAttack);
  g.gain.linearRampToValueAtTime(Math.max(0.0002, peak*0.75), tDecay);
  g.gain.linearRampToValueAtTime(0.0001, tRelease);
  return { node: g, stopTime: tRelease };
}
function scheduleTone({ type='sine', freqStart=440, freqEnd=null, duration=0.1, gain=0.2 }, when=0, category='ui') {
  if (!enabled) return;
  const t0 = nowSafe(ctx) + Math.max(0, when);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freqStart), t0);
  if (freqEnd && Number.isFinite(freqEnd)) {
    osc.frequency.linearRampToValueAtTime(Math.max(1, freqEnd), t0 + Math.max(0.01, duration));
  }
const { node: env, stopTime } = makeEnvGain(t0, Math.max(0.02, duration), Math.max(0.0002, gain));
const cat = catGains.get(category) || masterGain;
osc.connect(g);
g.connect(env);
env.connect(cat);
const src = { stop: () => { try { osc.stop(); } catch {} } };
active.add(src);
osc.onended = () => active.delete(src);
try { osc.start(t0); osc.stop(stopTime); } catch {}
}
function scheduleNoise({ duration=0.06, gain=0.18 }, when=0, category='ui') {
  if (!enabled) return;
  ensureNoiseBuffer();
  const t0 = nowSafe(ctx) + Math.max(0, when);
  const bufSrc = ctx.createBufferSource();
  bufSrc.buffer = noiseBuffer;
  const g = ctx.createGain();
  const { node: env, stopTime } = makeEnvGain(t0, Math.max(0.02, duration), Math.max(0.0002, gain));
  const cat = catGains.get(category) || masterGain;
  bufSrc.connect(g);
  g.connect(env);
  env.connect(cat);
  const src = { stop: () => { try { bufSrc.stop(); } catch {} } };
  active.add(src);
  bufSrc.onended = () => active.delete(src);
  try { bufSrc.start(t0); bufSrc.stop(stopTime); } catch {}
}
function applyVolumes() {
  if (!enabled) return;
  const base = muted ? 0 : masterVol;
  masterGain.gain.setTargetAtTime(Math.max(0.0001, base), nowSafe(ctx), 0.01);
  for (const [cat, g] of catGains) {
    const v = muted ? 0 : (masterVol * (catVols[cat] ?? 1));
    g.gain.setTargetAtTime(Math.max(0.0001, v), nowSafe(ctx), 0.01);
  }
}
function buildGraph() {
  ctx = new CtxCtor();
  dst = ctx.destination;
  masterGain = ctx.createGain();
  masterGain.connect(dst);
  for (const c of DEFAULT_CATEGORIES) {
    const cg = ctx.createGain();
    cg.connect(masterGain);
    catGains.set(c, cg);
  }
enabled = true;
applyVolumes();
}
function categoryGainFor(name) {
  const cat = inferCategory(name);
  return { category: cat, gainNode: catGains.get(cat) || masterGain };
}
function play(name, opts={}) {
  if (!enabled) return false;
  const fn = REGISTRY[name];
  if (!fn) return false;
  const { category } = categoryGainFor(name);
  const api = {
    scheduleTone: (p, t=0) => scheduleTone(p, t, category),
    scheduleNoise: (p, t=0) => scheduleNoise(p, t, category),
    getCatGain: () => catGains.get(category)
  };
try { fn(api, 0); return true; } catch { return false; }
}
return {
  async init() {
    if (enabled) return true;
    try { buildGraph(); return true; } catch { return false; }
  },
play,
mute(on){ muted = !!on; applyVolumes(); },
setMasterVolume(v){ masterVol = clamp01(v); applyVolumes(); },
setCategoryVolume(cat, v){ if (catGains.has(cat) || DEFAULT_CATEGORIES.includes(cat)) { catVols[cat] = clamp01(v); applyVolumes(); } },
stopAll(){ for (const s of Array.from(active)) { try { s.stop(); } catch {} active.delete(s); } },
dispose(){ try { this.stopAll(); } catch {} try { if (ctx && ctx.close) ctx.close(); } catch {} enabled = false; ctx=null; },
isEnabled(){ return !!enabled; },
getVolumes(){ return { master: masterVol, categories: { ...catVols }, muted }; },
getRegistry(){ return { ...REGISTRY }; },
hasSound(name){ return !!REGISTRY[name]; }
};
}
