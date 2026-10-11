// Procedural Web Audio sound effects (no files needed)
let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
let VOL = 0.8, MUS = 0.5;
export function setVolumes(v, m) { VOL = v; MUS = m; if (master) { sfxBus.gain.value = 0.55 * VOL; musicBus.gain.value = 0.22 * MUS * Math.max(0.0001, VOL > 0 ? 1 : 0); } }

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master); musicBus = ctx.createGain(); musicBus.connect(master); setVolumes(VOL, MUS);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; }
  resumeMusicIfPending();
}

function out(vol, pan) {
  const g = ctx.createGain(); g.gain.value = vol;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p); p.connect(sfxBus);
  } else g.connect(sfxBus);
  return g;
}
function noise(dest, t0, dur, type, freq, q, attack, peak) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(dest);
  s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
}
function tone(dest, t0, dur, type, f0, f1, peak) {
  const o = ctx.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
}

export function sfx(name, vol = 1, pan = 0) {
  if (!ctx || vol < 0.02) return;
  const t = ctx.currentTime;
  const o = out(vol, pan);
  switch (name) {
    case 'ar': noise(o, t, 0.22, 'lowpass', 2600, 0.7, 0.002, 0.9); tone(o, t, 0.1, 'sine', 160, 45, 0.7); break;
    case 'smg': noise(o, t, 0.12, 'lowpass', 3400, 0.7, 0.002, 0.6); tone(o, t, 0.06, 'square', 220, 80, 0.15); break;
    case 'shotgun': noise(o, t, 0.45, 'lowpass', 1500, 0.6, 0.003, 1.2); tone(o, t, 0.2, 'sine', 110, 35, 1.0); break;
    case 'sniper': noise(o, t, 0.08, 'highpass', 3000, 0.7, 0.001, 0.9); noise(o, t, 0.8, 'lowpass', 900, 0.5, 0.005, 1.1); tone(o, t, 0.35, 'sine', 90, 30, 1.0); break;
    case 'pick': noise(o, t, 0.12, 'bandpass', 700, 1.5, 0.002, 0.9); tone(o, t, 0.08, 'triangle', 260, 140, 0.3); break;
    case 'swing': noise(o, t, 0.15, 'bandpass', 1800, 2.0, 0.04, 0.25); break;
    case 'hit': tone(o, t, 0.06, 'square', 1500, 1500, 0.12); break;
    case 'head': tone(o, t, 0.09, 'square', 2400, 2400, 0.14); tone(o, t + 0.03, 0.08, 'sine', 3200, 3200, 0.12); break;
    case 'shieldhit': tone(o, t, 0.08, 'triangle', 900, 1400, 0.2); break;
    case 'build': tone(o, t, 0.09, 'triangle', 320, 180, 0.4); noise(o, t, 0.07, 'bandpass', 2000, 1.0, 0.002, 0.3); break;
    case 'break': noise(o, t, 0.35, 'lowpass', 1200, 0.8, 0.003, 0.9); tone(o, t, 0.2, 'sawtooth', 140, 50, 0.25); break;
    case 'reload': tone(o, t, 0.05, 'square', 600, 400, 0.12); tone(o, t + 0.35, 0.05, 'square', 800, 500, 0.14); break;
    case 'pickup': tone(o, t, 0.16, 'sine', 420, 980, 0.3); break;
    case 'chest': [523, 659, 784, 1046].forEach((f, i) => tone(o, t + i * 0.07, 0.25, 'triangle', f, f, 0.25)); break;
    case 'hurt': noise(o, t, 0.2, 'lowpass', 600, 0.8, 0.005, 0.6); break;
    case 'elim': [392, 523, 659].forEach((f, i) => tone(o, t + i * 0.05, 0.4, 'triangle', f, f, 0.22)); break;
    case 'jump': tone(o, t, 0.12, 'sine', 240, 420, 0.12); break;
    case 'glide': noise(o, t, 0.6, 'bandpass', 500, 0.6, 0.15, 0.25); break;
    case 'heal': tone(o, t, 0.4, 'sine', 500, 900, 0.2); tone(o, t + 0.1, 0.4, 'sine', 700, 1200, 0.15); break;
    case 'storm': noise(o, t, 0.5, 'lowpass', 300, 0.5, 0.1, 0.5); tone(o, t, 0.5, 'sawtooth', 70, 60, 0.08); break;
    case 'warn': tone(o, t, 0.3, 'square', 660, 660, 0.12); tone(o, t + 0.35, 0.3, 'square', 660, 660, 0.12); break;
    case 'victory': [523, 659, 784, 1046, 1318].forEach((f, i) => tone(o, t + i * 0.12, 0.6, 'triangle', f, f, 0.25)); break;
    case 'step': noise(o, t, 0.07, 'lowpass', 500, 0.8, 0.003, 0.5); break;
    case 'step_grass': noise(o, t, 0.08, 'bandpass', 1400, 0.6, 0.004, 0.35); break;
    case 'step_sand': noise(o, t, 0.12, 'highpass', 2200, 0.5, 0.01, 0.25); break;
    case 'step_snow': noise(o, t, 0.14, 'bandpass', 900, 1.4, 0.02, 0.45); noise(o, t + 0.03, 0.06, 'highpass', 3000, 0.7, 0.004, 0.12); break;
    case 'step_wood': tone(o, t, 0.06, 'triangle', 190, 120, 0.35); noise(o, t, 0.05, 'bandpass', 700, 2, 0.002, 0.3); break;
    case 'step_stone': tone(o, t, 0.04, 'square', 420, 300, 0.08); noise(o, t, 0.05, 'highpass', 1800, 1, 0.002, 0.35); break;
    case 'step_metal': tone(o, t, 0.12, 'triangle', 820, 760, 0.12); tone(o, t, 0.1, 'sine', 1240, 1180, 0.06); break;
    case 'step_water': noise(o, t, 0.22, 'bandpass', 600, 0.8, 0.03, 0.5); break;
    case 'equip': tone(o, t, 0.05, 'square', 500, 700, 0.07); noise(o, t + 0.04, 0.06, 'bandpass', 2500, 2, 0.002, 0.25); break;
    case 'edit': tone(o, t, 0.06, 'sine', 1200, 1500, 0.12); break;
    case 'editok': tone(o, t, 0.08, 'triangle', 600, 900, 0.2); noise(o, t, 0.1, 'bandpass', 1500, 1.5, 0.003, 0.3); break;
    case 'boing': tone(o, t, 0.45, 'sine', 180, 720, 0.45); tone(o, t, 0.3, 'triangle', 90, 300, 0.2); break;
    case 'whoosh': noise(o, t, 1.2, 'bandpass', 700, 0.5, 0.25, 0.6); break;
    case 'chute': noise(o, t, 0.3, 'lowpass', 900, 0.6, 0.01, 0.5); tone(o, t, 0.2, 'sine', 160, 120, 0.15); break;
    case 'horn': tone(o, t, 0.35, 'square', 330, 330, 0.12); tone(o, t, 0.35, 'square', 415, 415, 0.1); break;
    case 'engine': tone(o, t, 0.16, 'sawtooth', 60 + vol * 0, 70, 0.12); break;
    case 'hum': tone(o, t, 0.6, 'sine', 523, 523, 0.06); tone(o, t + 0.15, 0.6, 'sine', 784, 784, 0.04); tone(o, t + 0.3, 0.5, 'sine', 1046, 1046, 0.03); break;
    case 'land': noise(o, t, 0.18, 'lowpass', 700, 0.8, 0.004, 0.7); break;
    case 'drive': noise(o, t, 0.25, 'lowpass', 220, 1.2, 0.02, 0.6); break;
    case 'crit': tone(o, t, 0.12, 'sine', 900, 1800, 0.35); noise(o, t, 0.1, 'bandpass', 1200, 2, 0.002, 0.6); break;
    case 'click': tone(o, t, 0.04, 'square', 900, 900, 0.08); break;
  }
}

// ---------------------------------------------------------------------------
// Procedural music (lobby loop, victory fanfare, battle bus theme)
// ---------------------------------------------------------------------------
let musTimer = null, musStep = 0, musName = null;
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  lobby: { bpm: 112, prog: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], lead: [76, 0, 74, 72, 0, 72, 74, 76, 0, 79, 76, 74, 72, 0, 69, 0], bass: true, steps: 16 },
  victory: { bpm: 132, prog: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], lead: [72, 76, 79, 84, 0, 79, 84, 0, 77, 81, 84, 0, 79, 83, 86, 88], bass: true, steps: 16, once: 3 },
  bus: { bpm: 100, prog: [[50, 57, 62], [48, 55, 60], [46, 53, 58], [45, 52, 57]], lead: [0, 0, 69, 0, 0, 0, 67, 0, 0, 0, 65, 0, 64, 0, 0, 0], bass: true, steps: 16 },
};
function mtone(t, f, dur, type, peak) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
}
export function playMusic(name) {
  if (!ctx) { musName = name; return; }
  if (musName === name && musTimer) return;
  stopMusic(); musName = name; musStep = 0;
  const S = SONGS[name]; if (!S) return;
  const stepDur = 60 / S.bpm / 2; let next = ctx.currentTime + 0.1, bars = 0;
  musTimer = setInterval(() => {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.25) {
      const bar = Math.floor(musStep / S.steps) % S.prog.length, st = musStep % S.steps, ch = S.prog[bar];
      if (st === 0) { ch.forEach((n) => mtone(next, NOTE(n), stepDur * 7, 'triangle', 0.12)); bars++; if (S.once && bars > S.once * S.prog.length) { stopMusic(); return; } }
      if (S.bass && st % 4 === 0) mtone(next, NOTE(ch[0] - 12), stepDur * 1.6, 'sine', 0.3);
      if (st % 4 === 2) { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000; const g = ctx.createGain(); g.gain.setValueAtTime(0.12, next); g.gain.exponentialRampToValueAtTime(0.0001, next + 0.05); s.connect(f); f.connect(g); g.connect(musicBus); s.start(next); s.stop(next + 0.08); }
      const l = S.lead[st]; if (l) mtone(next, NOTE(l), stepDur * 1.5, 'square', 0.035);
      musStep++; next += stepDur;
    }
  }, 60);
}
export function stopMusic() { if (musTimer) clearInterval(musTimer); musTimer = null; musName = null; }
export function resumeMusicIfPending() { if (ctx && musName && !musTimer) { const n = musName; musName = null; playMusic(n); } }
