/** Synthesised SFX and an afrobeats loop (kick, clap, shaker, talking drum). Nothing to download. */
let ac: AudioContext | null = null;
let master: GainNode | null = null;
let musicTimer = 0;
let step = 0;
let nextT = 0;
let volume = 0.7;

function ctx() {
  if (ac) return ac;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ac = new AC();
  master = ac.createGain(); master.gain.value = volume;
  const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
  return ac;
}

function tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number) {
  const a = ac!, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master!); o.start(t); o.stop(t + dur + 0.05);
}
function noise(t: number, dur: number, peak: number, freq: number, type: BiquadFilterType = "bandpass") {
  const a = ac!, b = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = b;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(); g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master!); s.start(t);
}

export function sfx(name: string) {
  if (!ctx() || volume <= 0) return;
  const t = ac!.currentTime + 0.005;
  switch (name) {
    case "hit": noise(t, 0.08, 0.5, 900); tone("sine", 170, 60, t, 0.1, 0.4); break;
    case "bighit": noise(t, 0.16, 0.7, 500); tone("sine", 120, 40, t, 0.2, 0.6); break;
    case "swing": noise(t, 0.06, 0.12, 2500, "highpass"); break;
    case "heavy": noise(t, 0.1, 0.18, 1600, "highpass"); break;
    case "jump": tone("sine", 260, 520, t, 0.12, 0.15); break;
    case "land": noise(t, 0.05, 0.15, 300, "lowpass"); break;
    case "block": tone("triangle", 1800, 1200, t, 0.08, 0.12); break;
    case "ko": tone("triangle", 600, 140, t, 0.3, 0.16); break;
    case "pickup": [660, 880, 1100].forEach((f, i) => tone("sine", f, f, t + i * 0.05, 0.1, 0.14)); break;
    case "break": noise(t, 0.2, 0.35, 1800, "highpass"); break;
    case "ability": tone("sine", 140, 40, t, 0.7, 0.6); noise(t, 0.3, 0.3, 700); break;
    case "horn": [0, 0.25].forEach((d) => tone("square", 330, 300, t + d, 0.2, 0.08)); break;
    case "wave": tone("square", 520, 520, t, 0.08, 0.06); tone("square", 780, 780, t + 0.1, 0.12, 0.06); break;
    case "go": [523, 659, 784].forEach((f, i) => tone("triangle", f, f, t + i * 0.08, 0.15, 0.14)); break;
    case "nope": tone("square", 160, 120, t, 0.18, 0.08); break;
    case "lights": tone("sawtooth", 200, 900, t, 0.6, 0.06); break;
    default: break;
  }
}

export function startMusic(night: boolean) {
  if (!ctx()) return;
  if (ac!.state === "suspended") void ac!.resume();
  stopMusic();
  const spb = 60 / (night ? 112 : 104) / 4;
  step = 0; nextT = ac!.currentTime + 0.1;
  const K = [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0];
  const R = [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
  const bass = [45, 45, 41, 43];
  musicTimer = window.setInterval(() => {
    if (!ac || volume <= 0) return;
    while (nextT < ac.currentTime + 0.15) {
      const st = step % 16, bar = Math.floor(step / 16);
      if (K[st]) tone("sine", 150, 42, nextT, 0.28, 0.5);
      if (st === 4 || st === 12) noise(nextT, 0.14, 0.18, 1500);
      if (R[st]) tone("triangle", 900, 880, nextT, 0.05, 0.06);
      noise(nextT, st % 2 ? 0.06 : 0.03, st % 2 ? 0.06 : 0.03, 7000, "highpass");
      if (st === 0 || st === 6 || st === 10) { const n = bass[bar % 4]!; tone("triangle", 440 * Math.pow(2, (n - 69) / 12), 440 * Math.pow(2, (n - 69) / 12), nextT, 0.22, 0.2); }
      if (bar % 2 === 1 && (st === 12 || st === 14)) tone("sine", st === 14 ? 140 : 240, st === 14 ? 240 : 115, nextT, 0.2, 0.22);
      nextT += spb; step++;
    }
  }, 25);
}

export function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = 0; } }
export function setVolume(v: number) { volume = v; if (master) master.gain.value = v; try { localStorage.setItem("rtc.volume", String(v)); } catch { /* storage blocked */ } }
export function loadVolume() { try { const v = localStorage.getItem("rtc.volume"); if (v !== null) volume = Number(v); } catch { /* storage blocked */ } return volume; }
