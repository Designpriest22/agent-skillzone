/* Prohub Reel Engine — browser runtime.
 * One paused GSAP timeline per reel, a cue sheet everything reads from, and a post pass computed analytically from
 * time (camera shake, punch-ins, flash frames, chromatic aberration, glitch, grain). Deterministic: no Math.random,
 * no clocks. The renderer calls window.seek(t) for every (sub)frame.
 */
(function () {
  const W = 1080, H = 1920;
  const E = (window.ENGINE = { W, H, events: [], spots: [], cues: {}, canvases: [], updaters: [] });

  // ---------- deterministic randomness
  E.rng = function (seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  E.noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i) * (1 - u) + hash(i + 1) * u) * 2 - 1; };

  // ---------- tempo grid + cue sheet
  E.setTempo = (bpm, offset = 0) => { E.bpm = bpm; E.offset = offset; };
  E.beat = (n) => E.offset + (n * 60) / E.bpm;
  E.bar = (n) => E.beat(n * 4);
  E.cue = (name, t) => { E.cues[name] = +t.toFixed(4); return t; };

  // ---------- sound spotting: the picture says where sounds go; the score/SFX pass reads window.ENGINE.spots
  // id: "kit:<sfx-kit id>" | "meta:<file stem>" | "syn:<designed sound>"; meets: the frame the sound's sync point meets
  E.spot = (t, id, o = {}) => { E.spots.push({ t: +t.toFixed(4), id, gain: o.gain ?? 0, rate: o.rate ?? 1, pan: o.pan ?? 0, len: o.len, note: o.note }); };

  // ---------- post events
  E.shake = (t, amp = 18, dur = 0.35, freq = 26) => E.events.push({ k: "shake", t, amp, dur, freq });
  E.punch = (t, amt = 0.06, dur = 0.3) => E.events.push({ k: "punch", t, amt, dur });
  E.flash = (t, dur = 0.08, color = "#fff", peak = 0.9) => E.events.push({ k: "flash", t, dur, color, peak });
  E.ca = (t, px = 14, dur = 0.25) => E.events.push({ k: "ca", t, px, dur });
  E.glitch = (t, dur = 0.2, amt = 1) => E.events.push({ k: "glitch", t, dur, amt });
  E.roll = (t, deg = 4, dur = 0.5) => E.events.push({ k: "roll", t, deg, dur });

  // ---------- DOM helpers
  E.$ = (sel, root = document) => root.querySelector(sel);
  E.el = (html, parent) => { const d = document.createElement("div"); d.innerHTML = html.trim(); const n = d.firstElementChild; (parent || E.layer).appendChild(n); return n; };
  E.chars = (node) => { const text = node.textContent; node.textContent = ""; const out = []; for (const ch of text) { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch === " " ? " " : ch; node.appendChild(s); out.push(s); } return out; };
  E.words = (node) => { const text = node.textContent.trim().split(/\s+/); node.textContent = ""; return text.map((w, i) => { const s = document.createElement("span"); s.className = "wd"; s.textContent = w; node.appendChild(s); if (i < text.length - 1) node.appendChild(document.createTextNode(" ")); return s; }); };
  E.canvas = (draw, opts = {}) => { const c = document.createElement("canvas"); const s = opts.scale ?? 1; c.width = W * s; c.height = H * s; c.className = "fxc " + (opts.cls || ""); c.style.zIndex = opts.z ?? 5; (opts.parent || E.layer).appendChild(c); const ctx = c.getContext("2d"); E.canvases.push({ c, ctx, draw, s }); return c; };
  E.onUpdate = (fn) => E.updaters.push(fn);
  // show(): hold an element visible only within [a, b) — scene management without display toggles
  E.show = (node, a, b) => { E.updaters.push((t) => { node.style.opacity = t >= a && t < b ? "" : "0"; node.style.pointerEvents = "none"; }); };

  // ---------- post pass
  const env = (t, e, len) => { const x = (t - e.t) / len; return x < 0 || x > 1 ? 0 : x; };
  const decay = (x) => Math.pow(1 - x, 2.2);
  let grain = null;
  function buildGrain() {
    const tiles = []; const r = E.rng(77);
    for (let k = 0; k < 6; k++) { const c = document.createElement("canvas"); c.width = 360; c.height = 640; const x = c.getContext("2d"); const id = x.createImageData(360, 640); for (let i = 0; i < id.data.length; i += 4) { const v = (r() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); tiles.push(c); }
    return tiles;
  }
  E.post = { grain: 0.06, vignette: 0.45, grainBlend: "overlay" };
  function applyPost(t) {
    let sx = 0, sy = 0, rot = 0, sc = 1, ca = 0, glitch = 0, flash = 0, flashColor = "#fff";
    for (const e of E.events) {
      if (t < e.t) continue;
      if (e.k === "shake") { const x = env(t, e, e.dur); if (x) { const d = decay(x) * e.amp; sx += E.noise1((t - e.t) * e.freq + e.t * 13) * d; sy += E.noise1((t - e.t) * e.freq + 91 + e.t * 7) * d; rot += E.noise1((t - e.t) * e.freq * 0.7 + 37) * d * 0.04; } }
      else if (e.k === "punch") { const x = env(t, e, e.dur); if (x) sc += e.amt * decay(x); }
      else if (e.k === "flash") { const x = env(t, e, e.dur); if (x) { flash = Math.max(flash, e.peak * (1 - x)); flashColor = e.color; } }
      else if (e.k === "ca") { const x = env(t, e, e.dur); if (x) ca = Math.max(ca, e.px * decay(x)); }
      else if (e.k === "glitch") { const x = env(t, e, e.dur); if (x) glitch = Math.max(glitch, e.amt * (1 - x)); }
      else if (e.k === "roll") { const x = env(t, e, e.dur); if (x) rot += e.deg * Math.sin(x * Math.PI) * (1 - x); }
    }
    const cam = E.cam;
    let gx = 0, skew = 0;
    if (glitch > 0) { const f = Math.floor(t * 30); gx = (hash(f * 3.1) * 2 - 1) * 40 * glitch; skew = (hash(f * 7.7) * 2 - 1) * 8 * glitch; ca = Math.max(ca, 18 * glitch); }
    cam.style.transform = `translate(${sx + gx}px,${sy}px) rotate(${rot}deg) scale(${sc}) skewX(${skew}deg)`;
    cam.style.filter = ca > 0.5 ? `drop-shadow(${ca}px 0 0 rgba(255,40,80,.65)) drop-shadow(${-ca}px 0 0 rgba(0,210,255,.65))` : "none";
    E.flashEl.style.opacity = flash.toFixed(3); E.flashEl.style.background = flashColor;
    if (E.post.grain > 0) { const f = Math.floor(t * 24); const c = E.grainEl; const g = c.getContext("2d"); g.drawImage(grain[f % grain.length], -((f * 37) % 120), -((f * 53) % 200), 360 + 120, 640 + 200); c.style.opacity = E.post.grain; }
    E.vigEl.style.opacity = E.post.vignette;
  }

  E.init = function (opts) {
    E.duration = opts.duration; E.fps = opts.fps || 30; E.name = opts.name;
    const stage = document.getElementById("stage");
    E.cam = E.el(`<div id="cam"></div>`, stage);
    E.layer = E.cam;
    E.grainEl = E.el(`<canvas id="grain" width="360" height="640"></canvas>`, stage); E.grainEl.style.mixBlendMode = E.post.grainBlend;
    E.vigEl = E.el(`<div id="vig"></div>`, stage);
    E.flashEl = E.el(`<div id="flash"></div>`, stage);
    grain = buildGrain();
    E.tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
    return E.tl;
  };

  window.seek = function (t) {
    E.tl.seek(Math.min(t, E.tl.duration()), false);
    for (const u of E.updaters) u(t);
    for (const k of E.canvases) { k.ctx.setTransform(k.s, 0, 0, k.s, 0, 0); k.ctx.clearRect(0, 0, W, H); k.draw(k.ctx, t); }
    applyPost(t);
  };
  window.ready = document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => r(true))));
})();
