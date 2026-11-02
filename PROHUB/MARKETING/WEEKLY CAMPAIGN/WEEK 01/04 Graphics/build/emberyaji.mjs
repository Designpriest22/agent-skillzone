// "Ember & Yaji" — a FICTIONAL Abuja suya brand, designed by Prohub as a capability showcase for Day 3.
// It is labelled as fictional everywhere it appears. Boards are 1000×1000 HTML compositions.
export const EY = { char: "#17110E", ember: "#F0542A", yaji: "#B5532A", smoke: "#EFE4D2", pepper: "#2E1D16", glow: "#FF8A3D" };

/** Symbol: a skewer whose three pieces stack into a flame. */
export const eySymbol = (h = 200, fg = EY.ember, stick = EY.smoke) => `
<svg viewBox="0 0 120 200" style="height:${h}px;width:auto;display:block" xmlns="http://www.w3.org/2000/svg">
  <rect x="57" y="20" width="6" height="176" rx="3" fill="${stick}"/>
  <path d="M60 4 C76 26 84 40 78 58 C74 70 66 74 60 74 C54 74 46 70 42 58 C36 40 44 26 60 4Z" fill="${fg}"/>
  <rect x="30" y="84" width="60" height="34" rx="14" fill="${fg}"/>
  <rect x="22" y="126" width="76" height="38" rx="16" fill="${fg}"/>
</svg>`;

export const eyWord = (size = 120, fg = EY.smoke, amp = EY.ember) =>
  `<span style="font-family:'Anton';font-size:${size}px;letter-spacing:.01em;line-height:.9;color:${fg};white-space:nowrap">EMBER <span style="color:${amp}">&amp;</span> YAJI</span>`;

const box = (bg, inner, extra = "") => `<div style="position:relative;width:1000px;height:1000px;background:${bg};overflow:hidden;${extra}">${inner}</div>`;
const tag = (t, c = "rgba(239,228,210,.55)") => `<div style="position:absolute;left:44px;bottom:36px;font-family:'Mono';font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:${c}">${t}</div>`;

export const boards = {
  before: () => box("#FFE14D", `
    <div style="position:absolute;left:40px;top:40px;right:40px;font:900 118px Georgia,serif;color:#D00000;transform:rotate(-3deg);line-height:.95">SWEET SUYA<br>AVAILABLE!!!</div>
    <div style="position:absolute;left:60px;top:360px;font:italic 700 56px 'Times New Roman',serif;color:#1B4FD8">Hot &amp; Spicy • Fresh • Affordable</div>
    <div style="position:absolute;right:50px;top:440px;width:250px;height:250px;border-radius:50%;background:#00A651;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;font:800 46px 'Montserrat';transform:rotate(14deg)">COME<br>AND<br>TASTE!!</div>
    <div style="position:absolute;left:60px;top:520px;font:400 64px 'Anton';color:#7A1FA2">BEEF • CHICKEN • KIDNEY</div>
    <div style="position:absolute;left:60px;top:640px;font:700 44px 'Courier New',monospace;color:#000">CALL: 0800 000 0000<br>OR 0800 000 0001</div>
    <div style="position:absolute;left:60px;bottom:90px;font:800 italic 48px 'Montserrat';color:#E85D04">Opposite the filling station!!</div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:56px;background:#D00000"></div>`),
  logo: () => box(EY.char, `
    <div style="position:absolute;left:0;right:0;top:170px;display:flex;justify-content:center">${eySymbol(300)}</div>
    <div style="position:absolute;left:0;right:0;top:530px;text-align:center">${eyWord(150)}</div>
    <div style="position:absolute;left:0;right:0;top:700px;text-align:center;font-family:'Montserrat';font-weight:700;font-size:34px;letter-spacing:.32em;color:${EY.yaji}">ABUJA · LIT AFTER DARK</div>
    ${tag("Primary lock-up")}`),
  palette: () => box(EY.smoke, `
    <div style="position:absolute;left:44px;top:44px;font-family:'Anton';font-size:84px;color:${EY.char}">COLOUR &amp; TYPE</div>
    <div style="position:absolute;left:44px;right:44px;top:170px;display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:300px 200px;gap:16px">
      ${[["Charcoal", EY.char, "#17110E", "span 2"], ["Ember", EY.ember, "#F0542A"], ["Yaji", EY.yaji, "#B5532A"], ["Pepper", EY.pepper, "#2E1D16"], ["Smoke", "#FFFFFF", "#EFE4D2"]].map(([n, c, hx, rs], i) => `
      <div style="background:${c};border-radius:14px;padding:22px;display:flex;flex-direction:column;justify-content:flex-end;color:${i === 4 ? EY.char : EY.smoke};${rs ? `grid-row:${rs}` : ""};${i === 4 ? "border:2px solid #d9cbb4" : ""}">
        <div style="font-family:'Montserrat';font-weight:800;font-size:36px">${n}</div><div style="font-family:'Mono';font-size:20px;opacity:.7">${hx}</div></div>`).join("")}
    </div>
    <div style="position:absolute;left:44px;right:44px;top:720px;display:flex;justify-content:space-between;align-items:flex-end;color:${EY.char}">
      <div><div style="font-family:'Anton';font-size:150px;line-height:.9">Aa</div><div style="font-family:'Mono';font-size:20px;letter-spacing:.1em">ANTON — SIGNAGE</div></div>
      <div><div style="font-family:'Montserrat';font-weight:700;font-size:150px;line-height:.9;letter-spacing:-.04em">Aa</div><div style="font-family:'Mono';font-size:20px;letter-spacing:.1em">MONTSERRAT — MENUS</div></div>
    </div>`),
  packaging: () => box(EY.yaji, `
    <div style="position:absolute;left:120px;top:150px;width:420px;height:640px;background:${EY.smoke};border-radius:10px 10px 18px 18px;box-shadow:0 50px 60px -30px rgba(0,0,0,.6);transform:rotate(-5deg)">
      <div style="position:absolute;left:0;right:0;top:0;height:70px;background:repeating-linear-gradient(90deg,${EY.char} 0 14px,transparent 14px 28px);opacity:.9;border-radius:10px 10px 0 0"></div>
      <div style="position:absolute;left:0;right:0;top:170px;display:flex;justify-content:center">${eySymbol(170, EY.ember, EY.char)}</div>
      <div style="position:absolute;left:0;right:0;top:390px;text-align:center">${eyWord(58, EY.char)}</div>
      <div style="position:absolute;left:0;right:0;bottom:56px;text-align:center;font-family:'Montserrat';font-weight:700;font-size:22px;letter-spacing:.25em;color:${EY.yaji}">WRAPPED HOT · EATEN FAST</div></div>
    <div style="position:absolute;right:90px;top:430px;width:330px;height:330px;border-radius:50%;background:${EY.char};display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(10deg);box-shadow:0 40px 50px -25px rgba(0,0,0,.6)">
      <div style="font-family:'Anton';font-size:64px;color:${EY.ember};line-height:1">EXTRA</div><div style="font-family:'Anton';font-size:64px;color:${EY.smoke};line-height:1">YAJI</div>
      <div style="font-family:'Mono';font-size:18px;color:${EY.smoke};opacity:.6;margin-top:10px;letter-spacing:.15em">SEAL STICKER</div></div>
    ${tag("Wrap + seal sticker", "rgba(239,228,210,.75)")}`),
  menu: () => box(EY.char, `
    <div style="position:absolute;left:60px;right:60px;top:60px;display:flex;justify-content:space-between;align-items:center">${eyWord(64)}${eySymbol(84)}</div>
    <div style="position:absolute;left:60px;right:60px;top:180px;height:3px;background:${EY.ember}"></div>
    <div style="position:absolute;left:60px;right:60px;top:220px;display:flex;flex-direction:column;gap:34px">
      ${[["The Original", "Beef, yaji, raw onion, tomato", 2], ["Kidney Run", "For people who know", 3], ["Chicken, No Wahala", "Thigh meat, milder heat", 1], ["Asun After 10", "Smoked goat, pepper, only late", 4], ["The Whole Wrap", "Everything above. Bring friends.", 3]].map(([n, d, heat]) => `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px dashed rgba(239,228,210,.25);padding-bottom:22px">
        <div><div style="font-family:'Anton';font-size:58px;color:${EY.smoke};line-height:1">${n.toUpperCase()}</div><div style="font-family:'Montserrat';font-weight:500;font-size:26px;color:rgba(239,228,210,.6);margin-top:8px">${d}</div></div>
        <div style="display:flex;gap:8px">${[1, 2, 3, 4].map((k) => `<span style="width:20px;height:20px;border-radius:50%;background:${k <= heat ? EY.ember : "rgba(239,228,210,.15)"}"></span>`).join("")}</div></div>`).join("")}
    </div>
    ${tag("Menu board — heat in embers")}`),
  sign: () => box("#0A0706", `
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 45% at 50% 46%,rgba(240,84,42,.35),transparent 70%)"></div>
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 2px,transparent 2px 70px),repeating-linear-gradient(90deg,rgba(255,255,255,.02) 0 2px,transparent 2px 140px)"></div>
    <div style="position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center;filter:drop-shadow(0 0 18px ${EY.glow}) drop-shadow(0 0 40px ${EY.ember})">${eySymbol(220, "#FFB27A", "#FFE3CF")}</div>
    <div style="position:absolute;left:0;right:0;top:540px;text-align:center;text-shadow:0 0 12px ${EY.glow},0 0 34px ${EY.ember},0 0 70px ${EY.ember}">${eyWord(130, "#FFE3CF", "#FFB27A")}</div>
    <div style="position:absolute;left:0;right:0;top:700px;text-align:center;font-family:'Montserrat';font-weight:700;font-size:34px;letter-spacing:.4em;color:#FFB27A;text-shadow:0 0 14px ${EY.ember}">LIT AFTER DARK</div>
    ${tag("Storefront sign")}`),
  social: () => {
    const tiles = [
      `<div style="background:${EY.ember};display:flex;align-items:center;justify-content:center">${eySymbol(170, EY.char, EY.smoke)}</div>`,
      `<div style="background:${EY.char};display:flex;align-items:center;justify-content:center;padding:20px;text-align:center"><span style="font-family:'Anton';font-size:58px;line-height:.95;color:${EY.smoke}">OPEN<br><span style="color:${EY.ember}">TILL 2AM</span><br>FRI–SAT</span></div>`,
      `<div style="background:${EY.smoke};display:flex;align-items:flex-end;padding:22px"><span style="font-family:'Montserrat';font-weight:800;font-size:40px;line-height:1;color:${EY.char};letter-spacing:-.03em">Rate your heat: 1 to 4 embers.</span></div>`,
      `<div style="background:${EY.yaji};display:flex;align-items:center;justify-content:center"><span style="font-family:'Anton';font-size:92px;color:${EY.smoke}">ASUN</span></div>`,
      `<div style="background:#0A0706;display:flex;align-items:center;justify-content:center;text-shadow:0 0 18px ${EY.ember}">${eyWord(44, "#FFE3CF", "#FFB27A")}</div>`,
      `<div style="background:${EY.char};padding:22px;display:flex;flex-direction:column;justify-content:space-between"><span style="font-family:'Mono';font-size:18px;color:${EY.ember};letter-spacing:.12em">FRIDAY</span><span style="font-family:'Montserrat';font-weight:700;font-size:34px;color:${EY.smoke};line-height:1.1">Tag who’s paying tonight.</span></div>`,
      `<div style="background:${EY.pepper};display:flex;align-items:center;justify-content:center"><span style="font-family:'Anton';font-size:66px;color:${EY.ember};text-align:center;line-height:.95">EXTRA<br>YAJI?</span></div>`,
      `<div style="background:${EY.smoke};display:flex;align-items:center;justify-content:center">${eySymbol(150, EY.yaji, EY.char)}</div>`,
      `<div style="background:${EY.ember};padding:22px;display:flex;align-items:flex-end"><span style="font-family:'Anton';font-size:60px;color:${EY.char};line-height:.95">THE<br>KIDNEY<br>RUN</span></div>`,
    ];
    return box("#F7F3EC", `
      <div style="position:absolute;left:44px;top:40px;display:flex;align-items:center;gap:18px"><div style="width:74px;height:74px;border-radius:50%;background:${EY.char};display:flex;align-items:center;justify-content:center">${eySymbol(52)}</div>
        <div><div style="font-family:'Inter';font-weight:700;font-size:30px;color:#111">emberandyaji</div><div style="font-family:'Inter';font-size:24px;color:#777">Late-night suya · Abuja</div></div></div>
      <div style="position:absolute;left:44px;right:44px;top:150px;bottom:44px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${tiles.map((t) => t.replace('<div style="', '<div style="overflow:hidden;')).join("")}</div>`);
  },
};

/** Scale a 1000×1000 board into a slot of `size` px. */
export const fit = (board, size, radius = 18) =>
  `<div style="width:${size}px;height:${size}px;overflow:hidden;border-radius:${radius}px;position:relative;flex:none"><div style="transform:scale(${size / 1000});transform-origin:0 0;width:1000px;height:1000px">${board}</div></div>`;
