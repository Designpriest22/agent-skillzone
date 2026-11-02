// @assets {"before":"05 Videos/media/EY-board_before.jpg","sign":"05 Videos/media/EY-board_sign.jpg","logo":"05 Videos/media/EY-board_logo.jpg","palette":"05 Videos/media/EY-board_palette.jpg","pack":"05 Videos/media/EY-board_packaging.jpg","menu":"05 Videos/media/EY-board_menu.jpg","social":"05 Videos/media/EY-board_social.jpg"}
// DAY 3 — "We rebranded a suya spot that doesn't exist."  Style bible: EMBER — charcoal night, rising embers, heat
// haze, cold fluorescent "before" shredded into embers, neon ignition, a montage cut on log-drum hits.
// Amapiano score, 112.5 BPM (16 frames/beat), F minor.
(function () {
  const E = ENGINE, { W, H } = E;
  E.setTempo(112.5, 0);
  const b = E.beat, DUR = b(39);
  const tl = E.init({ name: "D3-ember-and-yaji", duration: DUR, fps: 30 });
  E.post.grain = 0.09; E.post.vignette = 0.7;
  const EMB = "#F0542A", GLOW = "#FF8A3D", SMOKE = "#EFE4D2", CHAR = "#120C0A", O = "#FD8D18";
  window.MUSIC = { bpm: 112.5, key: "F minor", style: "amapiano", sections: [
    { name: "night", from: 0, to: 6 }, { name: "before", from: 6, to: 10 }, { name: "insight", from: 10, to: 16 },
    { name: "ignite", from: 16, to: 19 }, { name: "montage", from: 19, to: 30 }, { name: "cta", from: 30, to: 34 }, { name: "logo", from: 34, to: 39 } ] };

  const css = document.createElement("style");
  css.textContent = `
  .ant{font-family:Anton;letter-spacing:.01em;line-height:.92;color:${SMOKE};text-transform:uppercase}
  .h{font-family:Montserrat;font-weight:800;letter-spacing:-.045em;line-height:.95;color:${SMOKE}}
  .mono{font-family:Mono;letter-spacing:.16em;text-transform:uppercase;color:rgba(239,228,210,.6)}
  .board{width:880px;height:880px;border-radius:26px;overflow:hidden;box-shadow:0 60px 120px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.06)}
  .board img{width:100%;height:100%;display:block}
  .glow{text-shadow:0 0 18px ${GLOW},0 0 50px ${EMB},0 0 110px ${EMB}}`;
  document.head.appendChild(css);
  // heat-haze filter (seed boils at 12 fps)
  E.el(`<svg width="0" height="0" style="position:absolute"><filter id="haze"><feTurbulence id="hzt" type="fractalNoise" baseFrequency="0.006 0.035" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="14"/></filter></svg>`);
  E.onUpdate((t) => E.$("#hzt").setAttribute("seed", String(Math.floor(t * 12) % 40)));

  E.el(`<div style="left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(ellipse 90% 55% at 50% 100%,#3a160c 0%,${CHAR} 60%,#070504 100%)"></div>`);
  const grillGlow = E.el(`<div style="left:-200px;top:1100px;width:1480px;height:1100px;background:radial-gradient(ellipse at 50% 70%,rgba(255,110,40,.55),rgba(240,84,42,.15) 45%,transparent 70%);mix-blend-mode:screen"></div>`);
  E.onUpdate((t) => { grillGlow.style.opacity = (0.55 + 0.25 * (E.noise1(t * 3.1) * 0.5 + 0.5) + 0.15 * E.noise1(t * 11)).toFixed(3); });

  // ───────── embers (deterministic particle field)
  const P = []; const r = E.rng(9);
  for (let i = 0; i < 170; i++) P.push({ x: r() * W, sp: 90 + r() * 260, ph: r() * 4000, wob: 20 + r() * 60, wf: 0.5 + r() * 2, s: 1.5 + r() * 4.5, fl: r() * 50 });
  let emberBoost = () => 1;
  E.canvas((c, t) => {
    c.globalCompositeOperation = "lighter";
    const k = emberBoost(t);
    for (const p of P) {
      const y = H + 60 - ((t * p.sp * k + p.ph) % (H + 260));
      const x = p.x + Math.sin(t * p.wf + p.ph) * p.wob;
      const life = 1 - (H + 60 - y) / (H + 260);
      const a = Math.max(0, life) * (0.55 + 0.45 * Math.sin(t * 9 + p.fl)) * Math.min(1, k);
      const g = c.createRadialGradient(x, y, 0, x, y, p.s * 3);
      g.addColorStop(0, `rgba(255,220,150,${a})`); g.addColorStop(0.4, `rgba(255,120,40,${a * 0.7})`); g.addColorStop(1, "rgba(240,84,42,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, p.s * 3, 0, 7); c.fill();
    }
  }, { z: 6 });

  // ───────── SHOT 1 · night: the hook types itself in fire
  const s1 = E.el(`<div class="scene"></div>`); E.show(s1, 0, b(6));
  const tag = E.el(`<div class="mono" style="left:0;width:${W}px;top:520px;text-align:center;font-size:28px">Fictional brand · real process</div>`, s1);
  tl.fromTo(tag, { opacity: 0, letterSpacing: "0.5em" }, { opacity: 1, letterSpacing: "0.16em", duration: 0.8, ease: "power2.out" }, 0.1);
  const l1 = E.el(`<div class="ant glow" style="left:70px;width:940px;top:640px;font-size:150px;text-align:center;filter:url(#haze)">We rebranded a suya spot</div>`, s1);
  const l2 = E.el(`<div class="h" style="left:70px;width:940px;top:1180px;font-size:92px;text-align:center;color:${O}">that doesn’t exist.</div>`, s1);
  const lc = E.chars(l1);
  lc.forEach((ch, i) => { tl.fromTo(ch, { opacity: 0, y: 30, scale: 1.4, color: "#fff4d6" }, { opacity: 1, y: 0, scale: 1, color: SMOKE, duration: 0.25, ease: "power2.out" }, 0.25 + i * 0.035); });
  E.spot(0.2, "syn:match-strike", { gain: -2 });
  E.spot(0.25, "syn:fire-whoosh", { gain: -6 });
  tl.fromTo(l2, { opacity: 0, y: 60, filter: "blur(16px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.35, ease: "expo.out" }, b(3));
  E.spot(b(3), "kit:boom-hit-soft", { gain: -4 });
  E.cue("hook", 0.25); E.cue("doesnt_exist", b(3));
  tl.to([l1, l2, tag], { opacity: 0, y: -60, duration: 0.25, ease: "power2.in" }, b(5.6));

  // ───────── SHOT 2 · before: cold fluorescent flicker, glitch, shredded into embers
  const s2 = E.el(`<div class="scene" style="background:#0b0d10"></div>`); E.show(s2, b(6), b(10));
  const lab = E.el(`<div class="mono" style="left:100px;top:420px;font-size:30px;color:#9fb4c8">Before</div>`, s2);
  const strips = [];
  const N = 8, BW = 880, BX = 100, BY = 520;
  for (let i = 0; i < N; i++) {
    const st = E.el(`<div style="left:${BX + i * (BW / N)}px;top:${BY}px;width:${BW / N + 1}px;height:880px;background:url(${IMG.before}) ${-i * (BW / N)}px 0/${BW}px ${BW}px;transform-origin:50% 0%"></div>`, s2);
    strips.push(st);
  }
  const cold = E.el(`<div style="left:0;top:0;width:${W}px;height:${H}px;background:rgba(170,210,255,.12);mix-blend-mode:screen"></div>`, s2);
  E.onUpdate((t) => { if (t >= b(6) && t < b(8)) { const f = Math.floor(t * 30); cold.style.opacity = (Math.sin(f * 12.9898) * 43758.5453 % 1 + 1) % 1 > 0.25 ? "1" : "0.2"; } });
  E.spot(b(6), "syn:fluoro-buzz", { gain: -8 });
  E.glitch(b(6), 0.25, 1); E.spot(b(6), "kit:digital-glitch-clear", { gain: -6 });
  const bq = E.el(`<div class="h" style="left:100px;width:880px;top:1450px;font-size:70px;color:#c9d6e2">Great suya. Forgettable brand.</div>`, s2);
  tl.fromTo(bq, { opacity: 0 }, { opacity: 1, duration: 0.2 }, b(6.5));
  // shred: strips fall and burn
  strips.forEach((st, i) => {
    const t = b(8.5) + i * 0.03;
    tl.to(st, { y: 1300 + (i % 3) * 200, rotation: (i % 2 ? 1 : -1) * (12 + i * 3), filter: "sepia(1) saturate(4) hue-rotate(-20deg) brightness(1.6)", opacity: 0, duration: 0.9, ease: "power2.in" }, t);
  });
  tl.to([bq, lab], { opacity: 0, duration: 0.2 }, b(8.5));
  E.spot(b(8.5), "meta:PAPRRip_PaperTear_OS_01", { gain: -2 }); E.spot(b(8.6), "syn:fire-whoosh", { gain: -3 });
  E.shake(b(8.5), 16, 0.4); E.cue("shred", b(8.5));
  emberBoost = (t) => (t > b(8.5) && t < b(10.5) ? 1 + 2.5 * Math.exp(-(t - b(8.5)) * 1.5) : 1);

  // ───────── SHOT 3 · insight over the grill (sizzle)
  const s3 = E.el(`<div class="scene"></div>`); E.show(s3, b(10), b(16));
  const i1 = E.el(`<div class="h" style="left:80px;width:920px;top:600px;font-size:96px">Suya is bought at night, by the light of the grill.</div>`, s3);
  const iw = E.words(i1);
  iw.forEach((w, k) => tl.fromTo(w, { opacity: 0, y: 40, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.3 }, b(10) + k * 0.11));
  E.spot(b(10), "syn:sizzle", { gain: -7, len: b(16) - b(10) });
  const i2 = E.el(`<div class="ant glow" style="left:80px;width:920px;top:1180px;font-size:150px;color:#FFE3CF;filter:url(#haze)">So the brand should glow.</div>`, s3);
  tl.fromTo(i2, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.45, ease: "expo.out" }, b(13));
  E.spot(b(13), "kit:shimmer-medium-bright", { gain: -6 }); E.spot(b(13), "kit:boom-hit-medium", { gain: -8 });
  E.cue("insight", b(10)); E.cue("glow", b(13));
  tl.to(s3, { scale: 1.12, duration: b(6), ease: "none", transformOrigin: "50% 60%" }, b(10));

  // ───────── SHOT 4 · neon ignition
  const s4 = E.el(`<div class="scene" style="background:#050302"></div>`); E.show(s4, b(16), b(19));
  const sign = E.el(`<div class="board" style="left:100px;top:520px"><img src="${IMG.sign}"></div>`, s4);
  E.onUpdate((t) => { if (t < b(16) || t >= b(19)) return; const x = t - b(16); const f = Math.floor(x * 30); const on = x > 0.9 || [0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1][f] === 1; sign.style.filter = on ? "brightness(1)" : "brightness(.12)"; });
  tl.fromTo(sign, { scale: 0.92 }, { scale: 1.06, duration: b(3), ease: "none" }, b(16));
  E.spot(b(16), "syn:neon-buzz", { gain: -6 }); E.cue("ignite", b(16));
  E.flash(b(16) + 0.9, 0.12, "#FF8A3D", 0.35);

  // ───────── SHOT 5 · montage — each board enters with its own camera move, cut on the log drum
  const boards = [["logo", "Identity"], ["palette", "Colour & type"], ["pack", "Packaging"], ["menu", "Menu board"], ["social", "Social"]];
  const step = 1.6; // beats per board
  boards.forEach(([k, label], i) => {
    const a = b(19 + i * step), z = b(19 + (i + 1) * step) + (i === boards.length - 1 ? b(3 - step) : 0);
    const sc = E.el(`<div class="scene" style="background:radial-gradient(ellipse 80% 60% at 50% 45%,#2a120a,${CHAR} 70%)"></div>`); E.show(sc, a, z);
    const bd = E.el(`<div class="board" style="left:100px;top:470px"><img src="${IMG[k]}"></div>`, sc);
    const cap = E.el(`<div class="mono" style="left:100px;top:1400px;font-size:30px;color:${GLOW}">0${i + 1} — ${label}</div>`, sc);
    const move = [
      [{ scale: 1.5, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.5, ease: "expo.out" }, "kit:move-zoom-out"],
      [{ rotationY: -95, transformPerspective: 1400 }, { rotationY: 0, duration: 0.45, ease: "back.out(1.4)" }, "kit:appear-flip-quick"],
      [{ x: 1400, skewX: -18 }, { x: 0, skewX: 0, duration: 0.22, ease: "expo.out" }, "kit:whoosh-fast-hard"],
      [{ y: 1500, rotation: 8 }, { y: 0, rotation: 0, duration: 0.32, ease: "expo.out" }, "kit:swish-hard"],
      [{ scale: 0.25, rotation: 200 }, { scale: 1, rotation: 0, duration: 0.5, ease: "expo.out" }, "kit:move-spin"],
    ][i];
    tl.fromTo(bd, move[0], move[1], a);
    tl.fromTo(cap, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.3 }, a + 0.15);
    tl.to(bd, { scale: "+=0.05", duration: z - a, ease: "none" }, a + 0.5);
    E.spot(a, move[2], { gain: -3 }); E.punch(a, 0.03, 0.2);
    if (i === 2) E.ca(a, 16, 0.2);
  });
  E.cue("montage", b(19));

  // ───────── SHOT 6 · split: same suya, different story
  const s6 = E.el(`<div class="scene" style="background:#000"></div>`); E.el(`<div class="mono" style="left:40px;top:620px;font-size:26px;color:#9fb4c8">Before</div>`, s6); E.el(`<div class="mono" style="left:560px;top:620px;font-size:26px;color:${GLOW}">After</div>`, s6); E.show(s6, b(27), b(30));
  const left = E.el(`<div style="left:0;top:0;width:540px;height:${H}px;overflow:hidden"><img src="${IMG.before}" style="position:absolute;left:20px;top:690px;width:510px;height:510px;border-radius:14px;filter:saturate(.6) brightness(.8)"></div>`, s6);
  const right = E.el(`<div style="left:540px;top:0;width:540px;height:${H}px;overflow:hidden"><img src="${IMG.sign}" style="position:absolute;left:10px;top:690px;width:510px;height:510px;border-radius:14px"></div>`, s6);
  tl.fromTo(left, { y: -H }, { y: 0, duration: 0.3, ease: "expo.out" }, b(27));
  tl.fromTo(right, { y: H }, { y: 0, duration: 0.3, ease: "expo.out" }, b(27));
  const t6a = E.el(`<div class="h" style="left:40px;top:1260px;font-size:66px;color:#fff">Same suya.</div>`, s6);
  const t6b = E.el(`<div class="h glow" style="left:560px;top:1260px;width:500px;font-size:66px;color:#FFE3CF">Different story.</div>`, s6);
  tl.fromTo(t6a, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, b(27.5));
  tl.fromTo(t6b, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, b(28.5));
  E.spot(b(27), "kit:reverse-whoosh-short-strong", { gain: -4 }); E.spot(b(27.05), "kit:impact-medium-soft", { gain: -6 });
  E.cue("split", b(27));

  // ───────── SHOT 7 · CTA
  const s7 = E.el(`<div class="scene" style="background:${O}"></div>`); E.show(s7, b(30), b(34));
  const c1 = E.el(`<div class="h" style="left:70px;width:940px;top:640px;font-size:132px;color:${CHAR}">Imagine what we’d do with a real one.</div>`, s7);
  tl.fromTo(s7, { clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(120% at 50% 50%)", duration: 0.4, ease: "expo.inOut" }, b(30) - 0.1);
  E.words(c1).forEach((w, k) => tl.fromTo(w, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.28, ease: "back.out(2)" }, b(30) + k * 0.09));
  E.spot(b(30) - 0.1, "kit:transform-grow", { gain: -5 }); E.cue("cta", b(30));

  // ───────── SHOT 8 · logo end (log-drum sonic logo) + DM SHOWCASE
  const s8 = E.el(`<div class="scene" style="background:#0C0C0D"></div>`); E.show(s8, b(34), DUR + 1);
  const lg = E.el(`<div style="left:140px;top:780px;width:800px">${LOGO_SVG.replace('width="2775" height="1217"', 'width="800" height="351"')}</div>`, s8);
  tl.fromTo(lg, { opacity: 0, scale: 1.2, filter: "blur(20px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.5, ease: "expo.out" }, b(34.5) - 0.1);
  const dm = E.el(`<div class="mono" style="left:0;width:${W}px;top:1240px;text-align:center;font-size:40px;color:${O};letter-spacing:.3em">DM ‘SHOWCASE’</div>`, s8);
  tl.fromTo(dm, { opacity: 0 }, { opacity: 1, duration: 0.3 }, b(36));
  E.spot(b(34.5), "syn:sonic-logo"); E.cue("logo_end", b(34.5));
  E.flash(b(34.5), 0.12, "#FF8A3D", 0.4);

  tl.set({}, {}, DUR);
})();
