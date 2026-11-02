// DAY 5 — Service selling: "Tell us the problem. We'll tell you the fix."
import { C, logo, mark } from "./brand.mjs";
import { frame } from "./layout.mjs";

export const FOLDER = "Day 05 - Problem to Fix Services";
const N = 8;
export const FIXES = [
  { q: "Nobody remembers our name.", fix: "Brand strategy & identity", gets: ["Positioning & messaging", "Logo & identity system", "Brand guidelines"] },
  { q: "Our flyers look cheap.", fix: "Graphic design", gets: ["Campaign & social creatives", "Print & event collateral", "Pitch decks that close"] },
  { q: "Our page looks abandoned.", fix: "Social media management", gets: ["Monthly content strategy", "Production & publishing", "Community & DM handling"] },
  { q: "People scroll right past us.", fix: "Video production & animation", gets: ["Reels & short-form ads", "Motion graphics", "Brand & event films"] },
  { q: "Our website is a WhatsApp link.", fix: "Website design & development", gets: ["Fast, mobile-first sites", "Landing pages that convert", "SEO & analytics set-up"] },
  { q: "We’re busy, but not growing.", fix: "Digital marketing & strategy", gets: ["Funnel & campaign planning", "Paid ads on Meta, TikTok, Google", "Monthly ROI reporting"] },
];

export function assets() {
  const out = [{
    name: "D5-01_carousel_4x5_cover",
    ...frame({
      size: "portrait", tone: "ink", top: [undefined, "05 / 07 — Services"], bot: ["Swipe →", `01 / 0${N}`],
      body: `
      <div class="h" style="position:absolute;left:76px;right:76px;top:170px;font-size:118px">Tell us the problem.</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:430px;font-size:118px;color:${C.orange}">We’ll tell you the fix.</div>
      <div class="b" style="position:absolute;left:76px;right:76px;bottom:150px;font-size:34px;color:${C.mute}">Everything Prohub does — in the words business owners actually use.</div>`,
    }),
  }];
  FIXES.forEach((f, i) => {
    const tone = i % 2 ? "paper" : "ink";
    const ink = tone === "ink";
    out.push({
      name: `D5-0${i + 2}_carousel_4x5_fix-${i + 1}`,
      ...frame({
        size: "portrait", tone, top: [undefined, `Problem 0${i + 1} / 06`], bot: ["Prohub — Make it obvious", `0${i + 2} / 0${N}`],
        body: `
        <div style="position:absolute;left:76px;top:200px;font-family:'Archivo';font-size:260px;line-height:.8;color:${C.orange}">“</div>
        <div class="h" style="position:absolute;left:76px;right:76px;top:390px;font-size:104px">${f.q}</div>
        <div style="position:absolute;left:76px;right:76px;top:830px;display:flex;align-items:center;gap:22px">
          <span class="mono" style="font-size:22px;color:${ink ? C.mute : C.muteDark}">The fix →</span>
          <span class="h7" style="font-size:40px;background:${C.orange};color:${C.ink};padding:14px 28px;border-radius:999px">${f.fix}</span></div>
        <div style="position:absolute;left:76px;right:76px;top:950px;display:flex;flex-direction:column;gap:14px">
          ${f.gets.map((g) => `<div class="b" style="font-size:34px;display:flex;gap:18px;align-items:center;color:${ink ? "#D8D5CF" : C.ink}"><span style="width:14px;height:14px;border-radius:50%;background:${C.orange};flex:none"></span>${g}</div>`).join("")}
        </div>`,
      }),
    });
  });
  out.push({
    name: "D5-08_carousel_4x5_cta",
    ...frame({
      size: "portrait", tone: "orange", grain: false, top: [undefined, "05 / 07 — Services"], bot: ["DM ‘BUILD’", `08 / 0${N}`],
      body: `
      <div class="h" style="position:absolute;left:76px;right:76px;top:170px;font-size:124px;color:${C.ink}">One brief. One team. One direction.</div>
      <div class="h7" style="position:absolute;left:76px;right:120px;top:680px;font-size:54px;color:${C.ink}">Which problem sounds like you?</div>
      <div class="b" style="position:absolute;left:76px;right:140px;top:830px;font-size:40px;color:${C.ink};font-weight:600;opacity:.82">DM us the slide number. We’ll come back with where we’d start.</div>
      <div style="position:absolute;left:76px;bottom:150px">${logo({ h: 70, tone: "dark", accent: C.white })}</div>`,
    }),
  });

  // Square for Facebook / LinkedIn — the whole menu on one card
  out.push({
    name: "D5-09_square_1x1_menu",
    ...frame({
      size: "square", tone: "ink", top: [undefined, "05 / 07 — Services"],
      body: `
      <div class="h7" style="position:absolute;left:76px;right:76px;top:140px;font-size:56px">You say… <span class="o">we fix.</span></div>
      <div style="position:absolute;left:76px;right:76px;top:250px;display:flex;flex-direction:column">
        ${FIXES.map((f) => `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:19px 0;border-top:2px solid ${C.line}">
          <span class="b" style="font-size:30px;color:#D8D5CF">“${f.q}”</span><span class="h7" style="font-size:28px;color:${C.orange};text-align:right">${f.fix}</span></div>`).join("")}
      </div>`,
    }),
  });
  // Stories
  out.push({
    name: "D5-10_story_9x16_which-one",
    ...frame({
      size: "story", tone: "ink", m: 84, top: [undefined, "Which one is you?"], bot: ["Prohub", "Reply with a number"],
      body: `
      <div style="position:absolute;left:84px;right:84px;top:250px;display:flex;flex-direction:column;gap:30px">
        ${FIXES.map((f, i) => `<div style="display:flex;gap:26px;align-items:center;padding:38px 34px;border-radius:20px;background:${C.ink2};border:2px solid ${C.line}">
          <span style="font-family:'Archivo';font-size:54px;color:${C.orange};width:50px">${i + 1}</span><span class="h7" style="font-size:44px">${f.q}</span></div>`).join("")}
      </div>
      <div class="b" style="position:absolute;left:84px;right:84px;top:1540px;font-size:38px;color:${C.mute}">Reply with your number. We’ll tell you where we’d start.</div>`,
    }),
  });
  out.push({
    name: "D5-11_story_9x16_whatsapp",
    ...frame({
      size: "story", tone: "orange", m: 84, grain: false, top: [undefined, "Rather talk?"], bot: ["Prohub Creative Solutions", "Abuja · Lagos"],
      body: `
      <div class="h" style="position:absolute;left:84px;right:84px;top:300px;font-size:150px;color:${C.ink}">Tell us what you’re building.</div>
      <div class="h7" style="position:absolute;left:84px;right:84px;top:880px;font-size:56px;color:${C.ink}">A real person replies. No bots, no forms, no hard sell.</div>
      <div style="position:absolute;left:84px;bottom:200px">${logo({ h: 74, tone: "dark", accent: C.white })}</div>`,
    }),
  });
  return out;
}
