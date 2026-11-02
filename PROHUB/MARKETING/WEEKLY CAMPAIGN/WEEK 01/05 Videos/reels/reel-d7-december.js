// @assets {}
// DAY 7 — "December is booked in November."  Style bible: FESTIVAL TRAILER — letterboxed trailer open (ticking clock,
// slot-machine figure, braam, festival bokeh, anamorphic flares), a November calendar crossed off and ripped away, then
// the letterbox snaps open on the drop: fireworks, a flip-clock countdown, the offer. Hybrid score: trailer → afrobeats
// (100 BPM, 18 frames/beat, D minor) with sampled nylon-guitar highlife licks.
(function () {
  const E = ENGINE, { W, H } = E;
  E.setTempo(100, 0);
  const b = E.beat, DUR = b(31);
  const tl = E.init({ name: "D7-december-is-booked", duration: DUR, fps: 30 });
  E.post.grain = 0.07; E.post.vignette = 0.55;
  const O = "#FD8D18", GOLD = "#FFC56B", INK = "#07070B", TXT = "#F7F2EA", MAG = "#FF4F8B";
  window.MUSIC = { bpm: 100, key: "D minor", style: "trailer-to-afrobeats", sections: [
    { name: "trailer", from: 0, to: 8 }, { name: "rise", from: 8, to: 16 }, { name: "drop", from: 16, to: 27 }, { name: "logo", from: 27, to: 31 } ] };
  const css = document.createElement("style");
  css.textContent = `
  .h{font-family:Montserrat;font-weight:800;letter-spacing:-.045em;line-height:.95;color:${TXT}}
  .mono{font-family:Mono;letter-spacing:.2em;text-transform:uppercase;color:rgba(247,242,234,.7)}
  .mk{font-family:Marker}
  .digit{position:relative;width:200px;height:300px;overflow:hidden;border-radius:18px;background:linear-gradient(#17171f,#0d0d13);border:2px solid #2a2a34}`;
  document.head.appendChild(css);
  E.el(`<div style="left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(ellipse 80% 50% at 50% 55%,#151530,${INK} 70%)"></div>`);

  // ───────── festival bokeh + fireworks (canvas, deterministic)
  const r = E.rng(21); const BOK = [];
  for (let i = 0; i < 46; i++) BOK.push({ x: r() * W, y: 300 + r() * 1400, s: 20 + r() * 90, c: [O, GOLD, MAG, "#7FB3FF"][i % 4], sp: 6 + r() * 20, ph: r() * 9 });
  const bokehOn = (t) => Math.min(1, Math.max(0, (t - b(3)) / 0.4));
  E.canvas((c, t) => {
    const k = bokehOn(t); if (!k) return; c.globalCompositeOperation = "lighter";
    for (const p of BOK) {
      const x = p.x + Math.sin(t * 0.3 + p.ph) * 40, y = p.y - t * p.sp;
      const a = k * (0.12 + 0.08 * Math.sin(t * 2 + p.ph));
      const g = c.createRadialGradient(x, y, 0, x, y, p.s); g.addColorStop(0, p.c + "00"); g.addColorStop(0.75, p.c); g.addColorStop(1, p.c + "00");
      c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, p.s, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
  }, { z: 2 });
  const BURSTS = [[b(16), 540, 620, O], [b(16.5), 260, 800, GOLD], [b(17), 820, 760, MAG], [b(20), 300, 560, GOLD], [b(20.5), 780, 520, O], [b(23), 540, 480, "#9FD3FF"], [b(27.5), 540, 600, GOLD]];
  const FW = BURSTS.map(([t0, x, y, col], i) => { const rr = E.rng(100 + i); return { t0, x, y, col, ps: Array.from({ length: 90 }, () => { const a = rr() * Math.PI * 2, v = 380 + rr() * 520; return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, tw: rr() * 10 }; }) }; });
  E.canvas((c, t) => {
    c.globalCompositeOperation = "lighter";
    for (const f of FW) {
      const dt = t - f.t0; if (dt < 0 || dt > 2.2) continue;
      const fade = Math.max(0, 1 - dt / 2.2);
      for (const p of f.ps) {
        for (let k = 0; k < 4; k++) { // trail
          const d = Math.max(0, dt - k * 0.03), drag = (1 - Math.exp(-2.2 * d)) / 2.2;
          const x = f.x + p.vx * drag, y = f.y + p.vy * drag + 140 * d * d;
          c.globalAlpha = fade * (1 - k / 4) * (0.6 + 0.4 * Math.sin(t * 30 + p.tw));
          c.fillStyle = k ? f.col : "#fff"; c.beginPath(); c.arc(x, y, k ? 3 : 4, 0, 7); c.fill();
        }
      }
      if (dt < 0.12) { c.globalAlpha = 1 - dt / 0.12; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, 260); g.addColorStop(0, "#fff"); g.addColorStop(1, "#fff0"); c.fillStyle = g; c.beginPath(); c.arc(f.x, f.y, 260, 0, 7); c.fill(); }
    }
    c.globalAlpha = 1;
  }, { z: 8 });
  BURSTS.forEach(([t0], i) => { E.spot(t0, i % 2 ? "syn:firework" : "kit:celebration-fireworks", { gain: i === 0 ? -2 : -8 }); });

  // letterbox — trailer framing until the drop
  const lbT = E.el(`<div style="left:0;top:0;width:${W}px;height:520px;background:#000;z-index:60"></div>`);
  const lbB = E.el(`<div style="left:0;top:1400px;width:${W}px;height:520px;background:#000;z-index:60"></div>`);
  tl.to(lbT, { y: -520, duration: 0.35, ease: "expo.inOut" }, b(16) - 0.15);
  tl.to(lbB, { y: 520, duration: 0.35, ease: "expo.inOut" }, b(16) - 0.15);
  // anamorphic flare across the band on big hits
  const flare = E.el(`<div style="left:-200px;top:950px;width:1480px;height:16px;background:linear-gradient(90deg,transparent,rgba(120,180,255,.0) 10%,rgba(160,200,255,.9) 50%,rgba(120,180,255,0) 90%,transparent);filter:blur(4px);opacity:0;z-index:40;mix-blend-mode:screen"></div>`);
  [b(3), b(16)].forEach((t) => { tl.fromTo(flare, { opacity: 1, scaleX: 0.3 }, { opacity: 0, scaleX: 1.2, duration: 0.9, ease: "power2.out" }, t); });

  // ───────── SHOT 1 · clock + slot-machine figure
  const s1 = E.el(`<div class="scene"></div>`); E.show(s1, 0, b(8));
  const tag = E.el(`<div class="mono" style="left:0;width:${W}px;top:600px;text-align:center;font-size:28px">Lagos · Detty December 2025</div>`, s1);
  tl.fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.1);
  for (let i = 0; i < 3; i++) E.spot(b(i), "syn:tick", { gain: -4 });
  const fig = E.el(`<div style="left:90px;top:720px;width:900px;height:300px;display:flex;align-items:center;justify-content:center;gap:6px"></div>`, s1);
  E.el(`<div class="h" style="position:relative;font-family:Archivo;font-size:250px;color:${O};letter-spacing:-.05em">N<i style="position:absolute;left:-12px;right:-12px;top:38%;height:18px;background:${O}"></i><i style="position:absolute;left:-12px;right:-12px;top:56%;height:18px;background:${O}"></i></div>`, fig);
  [3, 9, 6].forEach((d, i) => {
    const win = E.el(`<div style="position:relative;width:170px;height:300px;overflow:hidden"></div>`, fig);
    const col = E.el(`<div style="position:absolute;left:0;top:0;width:170px">${Array.from({ length: 30 }, (_, k) => `<div style="height:300px;display:flex;align-items:center;justify-content:center;font-family:Archivo;font-size:250px;color:${O}">${k % 10}</div>`).join("")}</div>`, win);
    tl.fromTo(col, { y: 0 }, { y: -(20 + d) * 300, duration: 1.0 + i * 0.25, ease: "power4.out" }, b(1.2));
  });
  E.el(`<div class="h" style="font-family:Archivo;font-size:250px;color:${O};letter-spacing:-.05em">bn</div>`, fig);
  E.spot(b(1.2), "kit:data-countup-medium", { gain: -4 }); E.spot(b(3), "syn:braam", { gain: -2 }); E.spot(b(3), "kit:data-number-land", { gain: -6 });
  E.shake(b(3), 14, 0.5); E.cue("figure", b(3));
  const sub = E.el(`<div class="h" style="left:90px;width:900px;top:1080px;font-size:66px;text-align:center">spent in one festive season.</div>`, s1);
  tl.fromTo(sub, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4 }, b(4));
  const src = E.el(`<div class="mono" style="left:0;width:${W}px;top:1210px;text-align:center;font-size:18px;letter-spacing:.08em;text-transform:none">Source: MO Africa, The Economics of Euphoria (2025)</div>`, s1);
  tl.fromTo(src, { opacity: 0 }, { opacity: 0.8, duration: 0.4 }, b(4.5));

  // ───────── SHOT 2 · customers decide fast — word cuts with camera flashes
  const s2 = E.el(`<div class="scene"></div>`); E.show(s2, b(8), b(12));
  ["Customers", "decide", "fast."].forEach((w, i) => {
    const n = E.el(`<div class="h" style="left:0;width:${W}px;top:820px;font-size:${i === 2 ? 260 : 170}px;text-align:center;${i === 2 ? `color:${O}` : ""}">${w}</div>`, s2);
    const a = b(8 + i * 1.2), z = i < 2 ? b(8 + (i + 1) * 1.2) : b(12);
    E.show(n, a, z);
    tl.fromTo(n, { scale: 1.3 }, { scale: 1, duration: 0.25, ease: "expo.out" }, a);
    E.flash(a, 0.07, "#fff", 0.8); E.spot(a, "kit:mechanical-shutter-light", { gain: -4 });
  });
  E.cue("fast", b(10.4));

  // ───────── SHOT 3 · November crossed off, page ripped → December
  const s3 = E.el(`<div class="scene"></div>`); E.show(s3, b(12), b(16.2));
  const cal = E.el(`<div style="left:140px;top:535px;width:800px;height:820px;transform:scale(.72);transform-origin:50% 0%"></div>`, s3);
  const page = (title, mark, z) => E.el(`<div style="position:absolute;left:0;top:0;width:800px;height:820px;border-radius:20px;background:${TXT};box-shadow:0 40px 80px rgba(0,0,0,.6);z-index:${z};overflow:hidden">
      <div style="height:120px;background:${title === "November" ? "#2b2b33" : O};display:flex;align-items:center;padding:0 40px"><span class="h" style="font-size:64px;color:${title === "November" ? TXT : INK}">${title} 2026</span></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:16px 28px 0;font-family:Mono;font-size:22px;color:#888">${["M","T","W","T","F","S","S"].map((d) => `<div style="padding-left:8px">${d}</div>`).join("")}</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:6px 28px">${Array.from({ length: 42 }, (_, k) => { const d = k - (title === "November" ? 6 : 1) + 1; const ok = d >= 1 && d <= (title === "November" ? 30 : 31); return `<div class="cell" data-d="${ok ? d : ""}" style="height:98px;position:relative;font-family:Montserrat;font-weight:700;font-size:38px;color:#222;padding:8px">${ok ? d : ""}${mark && d === 18 ? `<svg width="120" height="120" viewBox="0 0 120 120" style="position:absolute;left:-14px;top:-6px;overflow:visible"><ellipse class="circ" cx="60" cy="56" rx="54" ry="46" fill="none" stroke="${O}" stroke-width="9" stroke-dasharray="320" stroke-dashoffset="320" transform="rotate(-8 60 56)"/></svg>` : ""}</div>`; }).join("")}</div></div>`, cal);
  const dec = page("December", true, 1);
  const nov = page("November", false, 2);
  const cells = [...nov.querySelectorAll(".cell")].filter((c) => c.dataset.d);
  cells.forEach((c, k) => {
    const x = document.createElement("div");
    x.innerHTML = `<svg width="80" height="80" viewBox="0 0 90 90" style="position:absolute;left:10px;top:8px"><path d="M10 10 L80 80 M80 10 L10 80" stroke="${MAG}" stroke-width="9" stroke-linecap="round"/></svg>`;
    const s = x.firstElementChild; c.appendChild(s); s.style.opacity = "0";
    tl.fromTo(s, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.05 }, b(12.5) + k * 0.045);
  });
  E.spot(b(12.5), "kit:writing-scribble", { gain: -3 }); E.spot(b(12.5) + 0.7, "kit:writing-marker-tick", { gain: -6 });
  const t3 = E.el(`<div class="h" style="left:80px;width:920px;top:1150px;font-size:78px;text-align:center;z-index:5">December is booked<br><span style="color:${O}">in November.</span></div>`, s3);
  tl.fromTo(t3, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35 }, b(12.2));
  // rip
  tl.to(nov, { y: -1400, rotation: -18, duration: 0.5, ease: "power3.in", transformOrigin: "0% 0%" }, b(14.6));
  E.spot(b(14.6), "meta:PAPRRip_PaperTear_OS_01", { gain: 0 }); E.spot(b(14.7), "kit:props-page-turn", { gain: -6 });
  tl.to(dec.querySelector(".circ"), { strokeDashoffset: 0, duration: 0.45, ease: "power2.out" }, b(15.1));
  E.spot(b(15.1), "kit:writing-marker-draw", { gain: -3 });
  E.spot(b(16), "kit:reverse-whoosh-long-strong", { gain: -2 });
  E.cue("rip", b(14.6)); E.cue("drop", b(16));
  tl.to(s3, { scale: 1.7, opacity: 0, duration: 0.3, ease: "power3.in", transformOrigin: "50% 40%" }, b(15.9));

  // ───────── SHOT 4 · drop: fireworks + flip clock to 33
  const s4 = E.el(`<div class="scene"></div>`); E.show(s4, b(16), b(20));
  const clock = E.el(`<div style="left:330px;top:620px;display:flex;gap:20px"></div>`, s4);
  const dA = E.el(`<div class="digit"><div class="h dv" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:Archivo;font-size:240px">3</div></div>`, clock);
  const dB = E.el(`<div class="digit"><div class="h dv" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:Archivo;font-size:240px;color:${O}">6</div></div>`, clock);
  [5, 4, 3].forEach((v, i) => {
    const t = b(17 + i);
    tl.to(dB.querySelector(".dv"), { rotationX: 90, transformPerspective: 800, duration: 0.08, ease: "power2.in" }, t - 0.08);
    tl.set(dB.querySelector(".dv"), { textContent: String(v) }, t);
    tl.fromTo(dB.querySelector(".dv"), { rotationX: -90, transformPerspective: 800 }, { rotationX: 0, duration: 0.14, ease: "back.out(2)", immediateRender: false }, t);
    E.spot(t, "kit:mechanical-latch-light", { gain: -5 });
  });
  const days = E.el(`<div class="h" style="left:80px;width:920px;top:1000px;font-size:96px;text-align:center">days to Detty<br>December Fest.</div>`, s4);
  tl.fromTo(days, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, b(16.3));
  E.shake(b(16), 30, 0.6); E.flash(b(16), 0.18, "#fff", 0.9); E.cue("countdown", b(17));

  // ───────── SHOT 5 · ready to be chosen?
  const s5 = E.el(`<div class="scene"></div>`); E.show(s5, b(20), b(23.5));
  const q = E.el(`<div class="h" style="left:80px;width:920px;top:760px;font-size:140px">Is your brand ready to be <span style="color:${O}">chosen?</span></div>`, s5);
  const qw = E.words(q); qw[qw.length - 1].style.color = O;
  qw.forEach((w, k) => { tl.fromTo(w, { y: 90, opacity: 0, rotation: k % 2 ? 4 : -4 }, { y: 0, opacity: 1, rotation: 0, duration: 0.25, ease: "back.out(2)" }, b(20) + k * b(0.25)); });
  E.spot(b(20), "kit:whoosh-medium-hard", { gain: -6 }); E.cue("ready", b(20));

  // ───────── SHOT 6 · the offer
  const s6 = E.el(`<div class="scene"></div>`); E.show(s6, b(23.5), b(27.5));
  const card = E.el(`<div style="left:80px;top:560px;width:920px;padding:56px;border-radius:40px;background:${O};color:${INK}">
     <div style="font-family:Mono;font-size:26px;letter-spacing:.16em">THIS WEEK</div>
     <div class="h" style="font-size:96px;color:${INK};margin-top:20px">20-minute Brand Direction Call.</div>
     <div class="items" style="margin-top:36px;display:flex;flex-direction:column;gap:16px">${["Where your brand leaks customers", "What to fix before December", "A clear next step"].map((x) => `<div style="font-family:Inter;font-weight:600;font-size:42px;display:flex;gap:18px;align-items:center"><span style="width:44px;height:44px;border-radius:50%;background:${INK};color:${O};display:flex;align-items:center;justify-content:center;font-size:28px">✓</span>${x}</div>`).join("")}</div></div>`, s6);
  tl.fromTo(card, { y: 1500, rotation: 6 }, { y: 0, rotation: 0, duration: 0.45, ease: "expo.out" }, b(23.5));
  E.spot(b(23.5), "kit:swish-hard", { gain: -4 }); E.spot(b(23.5) + 0.3, "kit:impact-medium-soft", { gain: -6 });
  [...card.querySelectorAll(".items > div")].forEach((it, k) => { const t = b(24.6 + k * 0.7); tl.fromTo(it, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.25 }, t); E.spot(t, `kit:tone-step-${k + 2}`, { gain: -8 }); });
  E.cue("offer", b(23.5));

  // ───────── SHOT 7 · CTA + logo (brass sonic logo)
  const s7 = E.el(`<div class="scene"></div>`); E.show(s7, b(27.5), DUR + 1);
  const lg = E.el(`<div style="left:140px;top:640px;width:800px">${LOGO_SVG.replace('width="2775" height="1217"', 'width="800" height="351"')}</div>`, s7);
  tl.fromTo(lg, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.45, ease: "expo.out" }, b(27.5) + 0.12);
  const dm = E.el(`<div style="left:190px;top:1120px;width:700px;height:130px;border-radius:65px;border:4px solid ${O};display:flex;align-items:center;justify-content:center"><span style="font-family:Mono;font-weight:700;font-size:46px;letter-spacing:.14em;color:${TXT}">DM ‘DECEMBER’</span></div>`, s7);
  tl.fromTo(dm, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" }, b(28.6));
  E.spot(b(27.5) + 0.25, "syn:sonic-logo"); E.spot(b(28.6), "kit:pop-large-in", { gain: -8 });
  E.cue("logo_end", b(27.5) + 0.25);
  tl.set({}, {}, DUR);
})();
