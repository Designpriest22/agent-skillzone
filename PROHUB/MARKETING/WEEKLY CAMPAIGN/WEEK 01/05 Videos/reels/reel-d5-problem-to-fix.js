// @assets {}
// DAY 5 — "Tell us the problem. We'll tell you the fix."  Style bible: INBOX — a DM thread floods with owners'
// problems; each bubble transforms into its fix with a different transition; cards assemble into a grid; the CTA is
// typed and sent. UK-garage 2-step score, 128.57 BPM (14 frames/beat), G minor — notification pings tuned to the key.
(function () {
  const E = ENGINE, { W, H } = E;
  E.setTempo(1800 / 14, 0);
  const b = E.beat, DUR = b(49);
  const tl = E.init({ name: "D5-problem-to-fix", duration: DUR, fps: 30 });
  E.post.grain = 0.045; E.post.vignette = 0.35;
  const O = "#FD8D18", INK = "#0C0C0D", UI = "#16161A", BUB = "#26262C", TXT = "#F5F3EF", MUT = "#8E8B86";
  const FIX = [
    ["Nobody remembers our name.", "Brand identity", ["Positioning", "Logo & identity system", "Brand guidelines"], "Abuja · Fashion"],
    ["Our flyers look cheap.", "Graphic design", ["Campaign creatives", "Print & event collateral", "Pitch decks"], "Lagos · Events"],
    ["Our page looks abandoned.", "Social media", ["Content strategy", "Production & publishing", "Community & DMs"], "Lagos · Restaurant"],
    ["People scroll right past us.", "Video & animation", ["Reels & short ads", "Motion graphics", "Brand films"], "Abuja · Real estate"],
    ["Our website is a WhatsApp link.", "Websites", ["Mobile-first sites", "Landing pages", "SEO & analytics"], "Lagos · Startup"],
    ["We’re busy, but not growing.", "Strategy & marketing", ["Funnels & campaigns", "Paid ads", "ROI reporting"], "Abuja · Hotel"],
  ];
  window.MUSIC = { bpm: E.bpm, key: "G minor", style: "uk-garage-2step", sections: [
    { name: "flood", from: 0, to: 6 }, { name: "fixes", from: 6, to: 36 }, { name: "grid", from: 36, to: 40 },
    { name: "type", from: 40, to: 44 }, { name: "logo", from: 44, to: 49 } ] };
  const css = document.createElement("style");
  css.textContent = `
  .h{font-family:Montserrat;font-weight:800;letter-spacing:-.045em;line-height:.95;color:${TXT}}
  .ui{font-family:Inter;color:${TXT}}
  .mono{font-family:Mono;letter-spacing:.14em;text-transform:uppercase}
  .bub{background:${BUB};border-radius:44px 44px 44px 12px;padding:30px 38px;font-family:Inter;font-weight:500;font-size:44px;color:${TXT};line-height:1.25;max-width:760px}
  .card{background:${O};border-radius:40px;color:${INK};box-shadow:0 50px 100px rgba(0,0,0,.5)}`;
  document.head.appendChild(css);
  E.el(`<div style="left:0;top:0;width:${W}px;height:${H}px;background:radial-gradient(ellipse 80% 50% at 50% 40%,#1d1d22,${INK} 70%)"></div>`);
  // phone chrome: status + chat header (persistent)
  const chrome = E.el(`<div style="left:0;top:0;width:${W}px;height:300px;background:linear-gradient(${UI},${UI} 85%,transparent);z-index:20">
     <div class="ui" style="position:absolute;left:60px;top:40px;font-weight:600;font-size:34px">9:41</div>
     <div style="position:absolute;right:60px;top:48px;display:flex;gap:10px">${[18, 24, 30].map((h) => `<i style="display:block;width:10px;height:${h}px;background:${TXT};border-radius:3px;align-self:flex-end"></i>`).join("")}<i style="display:block;width:52px;height:26px;border:3px solid ${TXT};border-radius:8px;margin-left:10px"></i></div>
     <div style="position:absolute;left:60px;top:130px;display:flex;align-items:center;gap:24px"><div style="width:96px;height:96px;border-radius:50%;background:${INK};border:3px solid ${O};display:flex;align-items:center;justify-content:center"><div style="width:58px">${LOGO_SVG.replace('viewBox="0 0 2775 1217"', 'viewBox="100 100 800 1220"').replace('width="2775" height="1217"', 'width="58" height="88"')}</div></div>
       <div><div class="ui" style="font-weight:700;font-size:42px">Prohub</div><div class="ui" style="font-size:28px;color:#4ade80">● Active now</div></div></div></div>`);
  E.show(chrome, 0, b(36));
  const pings = ["G5", "Bb5", "C6", "D6", "F6", "G6"];

  // ───────── SHOT 1 · flood: six problems arrive at once
  const s1 = E.el(`<div class="scene"></div>`); E.show(s1, 0, b(6));
  FIX.forEach(([q, , , who], i) => {
    const y = 340 + i * 232;
    const n = E.el(`<div style="left:60px;top:${y}px"><div class="mono" style="font-size:22px;color:${MUT};margin:0 0 8px 12px">${who}</div><div class="bub" style="font-size:54px">${q}</div></div>`, s1);
    const t = b(i * 0.5);
    tl.fromTo(n, { opacity: 0, y: 60, scale: 0.85, transformOrigin: "0% 100%" }, { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: "back.out(2.4)" }, t);
    E.spot(t, "syn:ping", { note: pings[i], gain: -4 }); E.spot(t, "kit:notification-message-in-soft", { gain: -12 });
  });
  E.spot(b(1), "kit:phone-vibrate-table", { gain: -10 });
  tl.to(s1, { scale: 1.08, filter: "blur(10px) brightness(.45)", duration: 0.4, ease: "power2.inOut" }, b(3.6));
  const sf = E.el(`<div class="h" style="left:60px;width:960px;top:820px;font-size:170px;text-align:center;z-index:30">Sound familiar?</div>`);
  E.show(sf, b(4), b(6));
  tl.fromTo(sf, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: "power4.in" }, b(4) - 0.14);
  E.shake(b(4), 24, 0.35); E.spot(b(4), "kit:cinematic-slam-big", { gain: -5 }); E.cue("flood", 0); E.cue("familiar", b(4));

  // ───────── SHOT 2 · six transformations, five beats each, each with its own transition
  FIX.forEach(([q, fix, gets, who], i) => {
    const a = b(6 + i * 5), mid = b(6 + i * 5 + 2), z = b(6 + (i + 1) * 5);
    const sc = E.el(`<div class="scene"></div>`); E.show(sc, a, z);
    const num = E.el(`<div class="mono" style="left:60px;top:330px;font-size:24px;color:${O}">Problem 0${i + 1} / 06 · ${who}</div>`, sc);
    const bub = E.el(`<div class="bub" style="left:60px;top:560px;max-width:960px;font-size:78px;font-family:Montserrat;font-weight:800;letter-spacing:-.03em;line-height:1.02;padding:46px 54px;border-radius:64px 64px 64px 16px">“${q}”</div>`, sc);
    const card = E.el(`<div class="card" style="left:60px;top:600px;width:960px;height:760px;padding:56px">
        <div class="mono" style="font-size:26px;opacity:.7">The fix →</div>
        <div class="h" style="font-size:118px;color:${INK};margin-top:30px">${fix}</div>
        <div style="margin-top:44px;display:flex;flex-direction:column;gap:18px">${gets.map((g) => `<div class="ui gt" style="font-weight:600;font-size:42px;color:${INK};display:flex;gap:20px;align-items:center"><span style="width:20px;height:20px;border-radius:50%;background:${INK}"></span>${g}</div>`).join("")}</div></div>`, sc);
    const mini = E.el(`<div class="ui" style="left:60px;top:430px;font-size:34px;color:${MUT}">“${q}”</div>`, sc);
    tl.fromTo(bub, { opacity: 0, y: 80, scale: 0.8, transformOrigin: "0% 100%" }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" }, a);
    tl.fromTo(num, { opacity: 0 }, { opacity: 1, duration: 0.2 }, a);
    E.spot(a, "syn:ping", { note: pings[i], gain: -3 });
    const outs = [
      () => { tl.to(bub, { x: -1300, rotation: -8, duration: 0.25, ease: "power3.in" }, mid - 0.1); tl.fromTo(card, { x: 1300, rotation: 8 }, { x: 0, rotation: 0, duration: 0.35, ease: "expo.out" }, mid); return "kit:swipe-medium-firm"; },
      () => { tl.to(bub, { rotationY: 90, transformPerspective: 1600, duration: 0.18, ease: "power2.in" }, mid - 0.18); tl.fromTo(card, { rotationY: -90, transformPerspective: 1600 }, { rotationY: 0, duration: 0.35, ease: "back.out(1.6)" }, mid); return "kit:appear-flip-quick"; },
      () => { tl.to(bub, { scale: 0, opacity: 0, duration: 0.15, ease: "power3.in" }, mid - 0.15); E.glitch(mid - 0.05, 0.18, 1); tl.fromTo(card, { scale: 0.2 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, mid); return "kit:digital-glitch-clear"; },
      () => { tl.to(bub, { y: -1600, duration: 0.25, ease: "power3.in" }, mid - 0.1); tl.fromTo(card, { y: 1600 }, { y: 0, duration: 0.35, ease: "expo.out" }, mid); return "kit:whoosh-medium-hard"; },
      () => { tl.to(bub, { scale: 5, opacity: 0, duration: 0.25, ease: "power3.in", transformOrigin: "50% 50%" }, mid - 0.15); tl.fromTo(card, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "expo.out" }, mid); E.ca(mid, 18, 0.25); return "kit:move-zoom-in"; },
      () => { tl.to(bub, { clipPath: "inset(0 50% 0 50%)", duration: 0.22, ease: "power3.in" }, mid - 0.18); tl.fromTo(card, { clipPath: "inset(0 50% 0 50%)" }, { clipPath: "inset(0 0% 0 0%)", duration: 0.35, ease: "expo.out" }, mid); return "kit:zip-out-hard"; },
    ];
    const sfx = outs[i]();
    tl.fromTo(mini, { opacity: 0 }, { opacity: 1, duration: 0.2 }, mid);
    E.spot(mid - 0.05, sfx, { gain: -3 }); E.spot(mid + 0.12, "kit:impact-light-firm", { gain: -7 }); E.punch(mid, 0.03, 0.2);
    card.querySelectorAll(".gt").forEach((g, k) => { tl.fromTo(g, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.22 }, mid + b(0.6) + k * b(0.5)); E.spot(mid + b(0.6) + k * b(0.5), `kit:tone-step-${k + 1}`, { gain: -10 }); });
    E.cue(`fix${i + 1}`, mid);
  });

  // ───────── SHOT 3 · grid — six fixes, one team
  const s3 = E.el(`<div class="scene"></div>`); E.show(s3, b(36), b(40));
  const head = E.el(`<div class="h" style="left:60px;width:960px;top:330px;font-size:104px">One team.<br><span style="color:${O}">Every fix.</span></div>`, s3);
  tl.fromTo(head, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3 }, b(36));
  FIX.forEach(([, fix], i) => {
    const c = i % 2, r_ = Math.floor(i / 2);
    const tile = E.el(`<div class="card" style="left:${60 + c * 490}px;top:${640 + r_ * 330}px;width:470px;height:310px;padding:30px;border-radius:30px;display:flex;flex-direction:column;justify-content:space-between;${i % 3 === 1 ? `background:${TXT}` : ""}"><span class="mono" style="font-size:20px;opacity:.6">0${i + 1}</span><span class="h" style="font-size:52px;color:${INK}">${fix}</span></div>`, s3);
    const t = b(36.5 + i * 0.25);
    tl.fromTo(tile, { y: 1400, rotation: (i % 2 ? 10 : -10) }, { y: 0, rotation: 0, duration: 0.42, ease: "back.out(1.4)" }, t);
    E.spot(t + 0.25, "kit:pop-medium-in", { gain: -8, rate: 0.9 + i * 0.05 });
  });
  E.cue("grid", b(36));

  // ───────── SHOT 4 · type & send the CTA
  const s4 = E.el(`<div class="scene" style="background:${INK}"></div>`); E.show(s4, b(40), b(44));
  const box = E.el(`<div style="left:60px;top:1240px;width:960px;height:140px;border-radius:70px;background:${BUB};display:flex;align-items:center;padding:0 40px"><span class="ui" id="typed" style="font-size:46px;font-weight:500"></span><span id="caret" style="display:inline-block;width:4px;height:52px;background:${O};margin-left:6px"></span></div>`, s4);
  const send = E.el(`<div style="left:880px;top:1250px;width:120px;height:120px;border-radius:50%;background:${O};display:flex;align-items:center;justify-content:center"><svg width="56" height="56" viewBox="0 0 24 24"><path d="M3 11l18-8-8 18-2-8z" fill="${INK}"/></svg></div>`, s4);
  const msg = "Tell us what you’re building.";
  E.onUpdate((t) => { const a = b(40.4); const n = Math.max(0, Math.min(msg.length, Math.floor((t - a) * 22))); const el = E.$("#typed"); if (el) el.textContent = msg.slice(0, n); const c = E.$("#caret"); if (c) c.style.opacity = Math.floor(t * 3) % 2 ? "1" : "0"; });
  E.spot(b(40.4), "kit:keyboard-typing-steady-medium", { gain: -1 });
  const sent = E.el(`<div class="bub" style="left:200px;top:700px;max-width:820px;background:${O};color:${INK};border-radius:44px 44px 12px 44px;font-family:Montserrat;font-weight:800;font-size:64px">${msg}</div>`, s4);
  const sendT = b(42.4);
  tl.fromTo(sent, { opacity: 0, y: 500, scale: 0.6, transformOrigin: "100% 100%" }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.6)" }, sendT);
  tl.to(box, { opacity: 0.25, duration: 0.2 }, sendT);
  E.spot(sendT - 0.05, "kit:keyboard-return-firm", { gain: -6 }); E.spot(sendT, "kit:notification-message-out-soft", { gain: -4 }); E.spot(sendT, "kit:whoosh-fast-medium", { gain: -8 });
  const dm = E.el(`<div class="mono" style="left:200px;top:1000px;font-size:32px;color:${MUT}">DM ‘BUILD’ · we’ll tell you where we’d start</div>`, s4);
  tl.fromTo(dm, { opacity: 0 }, { opacity: 1, duration: 0.3 }, sendT + 0.4);
  E.cue("type", b(40.4)); E.cue("send", sendT);

  // ───────── SHOT 5 · logo (piano sonic logo)
  const s5 = E.el(`<div class="scene" style="background:${INK}"></div>`); E.show(s5, b(44), DUR + 1);
  const lg = E.el(`<div style="left:140px;top:780px;width:800px">${LOGO_SVG.replace('width="2775" height="1217"', 'width="800" height="351"')}</div>`, s5);
  tl.fromTo(lg, { y: 120, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "expo.out" }, b(44.5) - 0.12);
  const tag = E.el(`<div class="mono" style="left:0;width:${W}px;top:1220px;text-align:center;font-size:30px;color:${MUT}">Brand · Design · Social · Video · Web · Strategy</div>`, s5);
  tl.fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.4 }, b(46));
  E.spot(b(44.5), "syn:sonic-logo"); E.cue("logo_end", b(44.5));
  tl.set({}, {}, DUR);
})();
