// @assets {}
// DAY 1 — "Cover your logo."  Style bible: CUT & TAPE — warm paper, stop-motion boil (12 fps), orange tape slaps,
// marker annotations, hard cuts on a 120 BPM grid (15 frames/beat). Afro-house score in A minor.
(function () {
  const E = ENGINE, { W, H } = E;
  E.setTempo(120, 0);
  const b = E.beat;
  const DUR = b(38);
  const tl = E.init({ name: "D1-cover-your-logo", duration: DUR, fps: 30 });
  E.post.grain = 0.05; E.post.vignette = 0.28; E.post.grainBlend = "multiply";
  const O = "#FD8D18", INK = "#0C0C0D", PAPER = "#F3EFE8";

  // music map for the score pass (sections in beats)
  window.MUSIC = { bpm: 120, key: "A minor", style: "afro-house", sections: [
    { name: "intro-stutter", from: 0, to: 2 }, { name: "drop", from: 2, to: 9 }, { name: "filtered-question", from: 9, to: 15 },
    { name: "build", from: 15, to: 16 }, { name: "groove", from: 16, to: 25 }, { name: "stop-zero", from: 25, to: 29 },
    { name: "slam", from: 29, to: 32 }, { name: "logo", from: 32, to: 38 } ] };

  const css = document.createElement("style");
  css.textContent = `
  .paper{left:0;top:0;width:${W}px;height:${H}px;background:${PAPER};
    background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1.2px),radial-gradient(rgba(120,90,40,.05) 1px,transparent 1.5px),
    url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='.035' numOctaves='4' seed='3'/><feColorMatrix values='0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(%23f)'/></svg>");
    background-size:7px 7px,13px 13px,400px 400px}
  .scene{left:0;top:0;width:${W}px;height:${H}px;overflow:hidden}
  .h{font-family:Montserrat;font-weight:800;letter-spacing:-.05em;line-height:.88;color:${INK}}
  .tape{background:${O};box-shadow:0 14px 26px rgba(0,0,0,.22);
    clip-path:polygon(0 8%,1.6% 0,98.4% 0,100% 10%,98.8% 26%,100% 42%,98.6% 60%,100% 76%,98.8% 92%,99.6% 100%,1.2% 100%,0 88%,1.4% 70%,0 52%,1.2% 34%,0 18%)}
  .tape:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 3px,transparent 3px 10px),linear-gradient(180deg,rgba(255,255,255,.18),transparent 40%)}
  .mk{font-family:Marker;color:${INK}}
  .mono{font-family:Mono;letter-spacing:.12em;text-transform:uppercase}
  `;
  document.head.appendChild(css);

  E.el(`<div class="paper"></div>`);
  // stop-motion boil: anything with .boil jitters on twos
  E.onUpdate((t) => { const f = Math.floor(t * 12); document.querySelectorAll(".boil").forEach((n, i) => { const r = E.rng(f * 31 + i * 7); n.style.translate = `${(r() - .5) * 3}px ${(r() - .5) * 3}px`; n.style.rotate = `${(r() - .5) * 0.5}deg`; }); });

  // ───────── SHOT 1 · 0–1s · generic-logo stutter (4 invented marks, one per 8th note)
  const s1 = E.el(`<div class="scene"></div>`);
  E.show(s1, 0, b(2));
  const marks = [
    `<svg viewBox="0 0 200 200" width="420"><circle cx="100" cy="100" r="86" fill="#2E5BFF"/><text x="100" y="128" font-family="Georgia" font-size="84" font-style="italic" fill="#fff" text-anchor="middle">Yc</text></svg>`,
    `<svg viewBox="0 0 200 200" width="420"><polygon points="100,8 124,72 192,72 136,112 158,184 100,140 42,184 64,112 8,72 76,72" fill="#E63946"/></svg>`,
    `<svg viewBox="0 0 200 200" width="420"><path d="M20 140 Q100 20 180 90" stroke="#00A86B" stroke-width="26" fill="none" stroke-linecap="round"/><path d="M30 170 Q110 70 170 130" stroke="#F2C230" stroke-width="18" fill="none" stroke-linecap="round"/></svg>`,
    `<svg viewBox="0 0 200 200" width="420"><path d="M100 10 L180 40 L170 130 Q100 190 100 190 Q30 150 30 130 L20 40Z" fill="#6A3FC6"/><text x="100" y="128" font-family="Times New Roman" font-weight="bold" font-size="80" fill="#fff" text-anchor="middle">B</text></svg>`,
  ];
  marks.forEach((svg, i) => {
    const n = E.el(`<div class="boil" style="left:330px;top:${960 - 210}px;width:420px;height:420px">${svg}</div>`, s1);
    const a = b(i * 0.5), z = b(i * 0.5 + 0.5);
    tl.fromTo(n, { scale: 1.25, rotation: (i % 2 ? 6 : -6), opacity: 1 }, { scale: 1, rotation: 0, duration: 0.18, ease: "back.out(3)" }, a);
    tl.set(n, { opacity: 0 }, z);
    tl.set(n, { opacity: 0 }, 0); tl.set(n, { opacity: 1 }, a);
    E.spot(a, "kit:click-mouse-medium", { gain: -2, rate: 1 + i * 0.06 });
  });
  E.el(`<div class="mono" style="left:0;width:${W}px;top:1300px;text-align:center;font-size:30px;color:#6a6660">your logo here</div>`, s1);

  // ───────── SHOT 2 · 1–4.5s · COVER / YOUR / LOGO. slams, then tape rips across LOGO.
  const s2 = E.el(`<div class="scene"></div>`);
  E.show(s2, b(2), b(9));
  const words = ["COVER", "YOUR", "LOGO."];
  const W2 = words.map((w, i) => E.el(`<div class="h" style="left:64px;top:${560 + i * 270}px;font-size:${i === 2 ? 268 : 250}px;font-family:Archivo;letter-spacing:-.045em">${w}</div>`, s2));
  W2.forEach((n, i) => {
    const t = b(2 + i);
    tl.fromTo(n, { scale: 2.6, opacity: 0, transformOrigin: "20% 50%" }, { scale: 1, opacity: 1, duration: 0.16, ease: "power4.in" }, t - 0.16);
    E.shake(t, 26, 0.32); E.punch(t, 0.04, 0.25);
    E.spot(t, i === 2 ? "kit:cinematic-slam-big" : "kit:impact-deep-hard", { gain: i === 2 ? -3 : -4 });
  });
  E.cue("cover", b(2)); E.cue("logo", b(4));
  // tape rip across "LOGO."
  const tape1 = E.el(`<div class="tape" style="left:-60px;top:1100px;width:1200px;height:240px;transform-origin:0% 50%"></div>`, s2);
  tl.fromTo(tape1, { scaleX: 0, rotation: -5 }, { scaleX: 1, rotation: -5, duration: 0.22, ease: "expo.out" }, b(5));
  E.spot(b(5), "kit:props-tape", { gain: 0 }); E.spot(b(5) + 0.02, "kit:impact-light-firm", { gain: -6 });
  E.cue("tape", b(5));
  // marker scribble "still you?" + arrow
  const ann = E.el(`<div style="left:600px;top:400px;width:440px;height:180px">
      <div class="mk" style="font-size:72px;transform:rotate(-7deg);clip-path:inset(0 100% 0 0)" id="still">still you?</div>
      <svg width="300" height="260" viewBox="0 0 300 260" style="position:absolute;left:40px;top:120px;overflow:visible"><path id="arrow1" d="M160 10 C 110 80, 90 150, 70 230 M70 230 L 40 190 M70 230 L 110 205" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="520" stroke-dashoffset="520"/></svg></div>`, s2);
  tl.to(E.$("#still"), { clipPath: "inset(0 0% 0 0)", duration: 0.55, ease: "steps(9)" }, b(6));
  tl.to(E.$("#arrow1"), { strokeDashoffset: 0, duration: 0.4, ease: "steps(7)" }, b(7));
  E.spot(b(6), "kit:writing-marker-write", { gain: -2 }); E.spot(b(7), "kit:writing-marker-draw", { gain: -3 });
  tl.to(s2, { scale: 0.86, duration: b(2), ease: "power1.inOut", transformOrigin: "50% 50%" }, b(7));

  // ───────── SHOT 3 · 4.5–7.5s · the question, word by word on 8ths; read hold
  const s3 = E.el(`<div class="scene" style="background:${INK}"></div>`);
  E.show(s3, b(9), b(15));
  const q = E.el(`<div class="h" style="left:80px;right:80px;top:700px;width:920px;font-size:150px;color:${PAPER};line-height:.95">Would anyone still know it’s you?</div>`, s3);
  const qw = E.words(q);
  qw.forEach((w, i) => {
    const t = b(9 + i * 0.5);
    tl.fromTo(w, { y: 90, opacity: 0, rotation: (i % 2 ? 4 : -4) }, { y: 0, opacity: 1, rotation: 0, duration: 0.24, ease: "back.out(2.2)" }, t);
    E.spot(t, "kit:pop-small-in", { gain: -6, rate: 0.9 + i * 0.04 });
  });
  tl.to(qw[qw.length - 1], { color: O, duration: 0.01 }, b(12));
  E.spot(b(12), "kit:shimmer-short-soft", { gain: -6 });
  E.cue("question", b(9));
  // underline swoosh draws under "you?"
  const ul = E.el(`<svg width="520" height="80" viewBox="0 0 520 80" style="left:470px;top:1262px;overflow:visible"><path d="M10 50 Q 200 10 510 40" stroke="${O}" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="560" stroke-dashoffset="560" id="ul"/></svg>`, s3);
  tl.to(E.$("#ul"), { strokeDashoffset: 0, duration: 0.35, ease: "power2.out" }, b(12.5));
  E.spot(b(12.5), "kit:writing-highlighter", { gain: -5 });
  // build into triptych: the whole card falls away
  tl.to(q, { y: -2200, rotation: -12, duration: 0.45, ease: "power3.in" }, b(14.2));
  E.spot(b(15), "kit:reverse-whoosh-short-strong", { gain: -3 });

  // ───────── SHOT 4 · 7.5–12.5s · COLOUR / SHAPE / VOICE triptych, then grid
  const tri = [
    { label: "A colour", sub: "you own", bg: O, fg: INK },
    { label: "A shape", sub: "you repeat", bg: INK, fg: PAPER },
    { label: "A voice", sub: "that sounds like you", bg: PAPER, fg: INK },
  ];
  const s4 = E.el(`<div class="scene"></div>`);
  E.show(s4, b(15), b(25));
  tri.forEach((c, i) => {
    const a = b(16 + i * 2);
    const card = E.el(`<div class="scene" style="background:${c.bg}"></div>`, s4);
    // full-screen smash in
    tl.fromTo(card, { clipPath: i === 1 ? "circle(0% at 50% 50%)" : i === 0 ? "inset(0 100% 0 0)" : "inset(100% 0 0 0)" }, { clipPath: i === 1 ? "circle(80% at 50% 50%)" : "inset(0 0% 0 0)", duration: 0.28, ease: "expo.out" }, a - 0.12);
    const lab = E.el(`<div class="h" style="left:70px;top:740px;font-size:200px;color:${c.fg}">${c.label}</div>`, card);
    const sub = E.el(`<div style="left:76px;top:960px;font-family:Inter;font-weight:600;font-size:56px;color:${c.fg};opacity:.75">${c.sub}</div>`, card);
    tl.fromTo(lab, { x: -160, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "expo.out" }, a);
    tl.fromTo(sub, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }, a + 0.16);
    if (i === 0) { // a swatch card drops in: the colour you own, by number
      const sw = E.el(`<div style="left:520px;top:1120px;width:440px;height:520px;background:#fff;border-radius:14px;box-shadow:0 30px 60px rgba(0,0,0,.25);transform:rotate(6deg)"><div style="position:absolute;left:24px;right:24px;top:24px;height:340px;background:${O};border-radius:6px"></div><div style="position:absolute;left:28px;bottom:70px;font-family:Montserrat;font-weight:800;font-size:44px;color:${INK}">Prohub Orange</div><div style="position:absolute;left:28px;bottom:30px;font-family:Mono;font-size:28px;color:#777">#FD8D18</div></div>`, card);
      tl.fromTo(sw, { y: 900, rotation: 20 }, { y: 0, rotation: 6, duration: 0.45, ease: "back.out(1.5)" }, a + 0.3);
      E.spot(a + 0.62, "kit:foley-card-touch", { gain: -4 });
    }
    if (i === 1) { // the shape morphs on every beat — circle, square, triangle
      const shp = E.el(`<div style="left:330px;top:1130px;width:420px;height:420px;background:${O};border-radius:50%"></div>`, card);
      tl.to(shp, { borderRadius: "0%", rotation: 45, duration: 0.25, ease: "back.out(2)" }, a + b(1));
      E.spot(a + b(1), "kit:transform-morph", { gain: -5 });
    }
    if (i === 2) { // a voice waveform scribble
      const wave = E.el(`<svg width="900" height="200" viewBox="0 0 900 200" style="left:90px;top:1200px"><path id="wv" d="M0 100 Q 30 20 60 100 T 120 100 T 180 100 Q 210 0 240 100 T 300 100 T 360 100 Q 390 40 420 100 T 480 100 Q 510 170 540 100 T 600 100 T 660 100 Q 690 10 720 100 T 780 100 T 840 100 T 900 100" stroke="${O}" stroke-width="16" stroke-linecap="round" fill="none" stroke-dasharray="1700" stroke-dashoffset="1700"/></svg>`, card);
      tl.to(E.$("#wv"), { strokeDashoffset: 0, duration: 0.6, ease: "none" }, a + 0.1);
    }
    E.spot(a, i === 0 ? "kit:swish-hard" : i === 1 ? "kit:move-zoom-in" : "kit:whoosh-fast-hard", { gain: -2 });
    E.spot(a, "kit:impact-medium-soft", { gain: -6 });
    E.punch(a, 0.035, 0.22);
  });
  E.cue("triptych", b(16));
  // the three collapse into one strip (same way, every time)
  const grid = E.el(`<div class="scene" style="background:${PAPER}"></div>`, s4);
  tl.fromTo(grid, { opacity: 0 }, { opacity: 1, duration: 0.01 }, b(22));
  tri.forEach((c, i) => {
    const tile = E.el(`<div style="left:${70 + i * 320}px;top:640px;width:300px;height:420px;border-radius:18px;background:${i === 2 ? "#fff" : c.bg};border:${i === 2 ? "3px solid " + INK : "0"};display:flex;align-items:flex-end;padding:22px"><div class="h" style="font-size:56px;color:${c.fg}">${c.label.replace("A ", "")}</div></div>`, grid);
    tl.fromTo(tile, { y: 900, rotation: (i - 1) * 14 }, { y: 0, rotation: 0, duration: 0.42, ease: "back.out(1.6)" }, b(22) + i * 0.09);
    E.spot(b(22) + i * 0.09 + 0.2, "kit:foley-card-touch", { gain: -4 });
  });
  const same = E.el(`<div class="mk" style="left:70px;width:940px;top:1140px;font-size:78px;text-align:center;transform:rotate(-2deg)">same way, every time.</div>`, grid);
  tl.fromTo(same, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.6, ease: "steps(10)" }, b(23));
  E.spot(b(23), "kit:writing-marker-write", { gain: -3 });

  // ───────── SHOT 5 · 12.5–14.5s · "Every post starts from zero." — odometer rolls back to 0, music stops
  const s5 = E.el(`<div class="scene" style="background:${INK}"></div>`);
  E.show(s5, b(25), b(29));
  const od = E.el(`<div style="left:140px;top:560px;width:800px;height:420px;display:flex;gap:16px;justify-content:center"></div>`, s5);
  const digits = [8, 4, 7];
  digits.forEach((d, i) => {
    const win = E.el(`<div style="position:relative;width:240px;height:420px;overflow:hidden;border-radius:22px;background:#1b1b1d;border:3px solid #333"></div>`, od);
    const col = E.el(`<div style="position:absolute;left:0;top:0;width:240px">${Array.from({ length: 10 }, (_, k) => `<div style="height:420px;display:flex;align-items:center;justify-content:center;font-family:Archivo;font-size:300px;color:${PAPER}">${9 - k}</div>`).join("")}</div>`, win);
    // column shows (9-k) at index k → digit d is at index 9-d; 0 is at index 9
    tl.fromTo(col, { y: -(9 - d) * 420 }, { y: -9 * 420, duration: 0.9 + i * 0.18, ease: "power3.inOut" }, b(25.5));
  });
  E.spot(b(25.5), "kit:data-decrease-medium", { gain: -2 });
  E.spot(b(25.5) + 1.2, "kit:data-number-land", { gain: -2 });
  const z = E.el(`<div class="h" style="left:80px;right:80px;width:920px;top:1080px;font-size:104px;color:${PAPER};text-align:center">Every post starts from <span style="color:${O}">zero.</span></div>`, s5);
  tl.fromTo(z, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, b(26));
  E.cue("zero", b(25));

  // ───────── SHOT 6 · 14.5–16s · MAKE IT OBVIOUS. tape strips build the backdrop, words stamp
  const s6 = E.el(`<div class="scene"></div>`);
  E.show(s6, b(29), b(32));
  E.el(`<div class="paper"></div>`, s6);
  [[-8, 470], [6, 770], [-4, 1070], [7, 1370]].forEach(([r, y], i) => {
    const tp = E.el(`<div class="tape" style="left:-80px;top:${y}px;width:1240px;height:250px;transform-origin:${i % 2 ? "100%" : "0%"} 50%"></div>`, s6);
    tl.fromTo(tp, { scaleX: 0, rotation: r }, { scaleX: 1, rotation: r, duration: 0.14, ease: "expo.out" }, b(29) + i * b(0.25));
    E.spot(b(29) + i * b(0.25), "kit:props-tape", { gain: -4, rate: 1 + i * 0.05 });
  });
  const lines = [["MAKE", 250, 600], ["IT", 250, 860], ["OBVIOUS.", 178, 1120]];
  lines.forEach(([w, fs, y], i) => {
    const n = E.el(`<div class="h" style="left:64px;top:${y}px;font-family:Archivo;font-size:${fs}px;letter-spacing:-.04em">${w}</div>`, s6);
    const t = b(30 + i * 0.5);
    tl.fromTo(n, { scale: 1.8, opacity: 0, transformOrigin: "0% 50%" }, { scale: 1, opacity: 1, duration: 0.12, ease: "power4.in" }, t - 0.12);
    E.shake(t, 22, 0.3); E.spot(t, "kit:impact-deep-hard", { gain: -5 });
  });
  E.cue("slam", b(29));

  // ───────── SHOT 7 · 16–19s · logo end — swoosh wipes on (sonic logo), DM OBVIOUS sticker
  const s7 = E.el(`<div class="scene" style="background:${INK}"></div>`);
  E.show(s7, b(32), DUR + 1);
  const logo = E.el(`<div style="left:140px;top:770px;width:800px">${LOGO_SVG.replace('width="2775" height="1217"', 'width="800" height="351"')}</div>`, s7);
  tl.fromTo(logo, { clipPath: "inset(0 100% 0 0)", x: -40 }, { clipPath: "inset(0 0% 0 0)", x: 0, duration: 0.5, ease: "expo.out" }, b(32.5));
  const sticker = E.el(`<div class="tape" style="left:300px;top:1240px;width:480px;height:110px;display:flex;align-items:center;justify-content:center;transform:rotate(-4deg)"><span class="mono" style="font-weight:700;font-size:40px;color:${INK};position:relative;z-index:2">DM ‘OBVIOUS’</span></div>`, s7);
  tl.fromTo(sticker, { scale: 2, opacity: 0, rotation: 8 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.2, ease: "power4.in" }, b(34.5) - 0.2);
  E.spot(b(34.5), "kit:props-tape", { gain: -3 });
  E.flash(b(32.5), 0.1, "#FD8D18", 0.5);
  E.cue("logo_end", b(32.5)); E.cue("sticker", b(34.5));
  E.spot(b(32.5), "syn:sonic-logo", { gain: 0 });

  tl.set({}, {}, DUR);
})();
