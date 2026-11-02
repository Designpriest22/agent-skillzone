// DAY 4 — Problem / solution: "You might not have a marketing problem."
import { C, swoosh, logo } from "./brand.mjs";
import { frame } from "./layout.mjs";

export const FOLDER = "Day 04 - Positioning Problem";
const N = 6;
const s = (i, tone, label, body, bot) => ({
  name: `D4-0${i}_carousel_4x5_${label}`,
  ...frame({ size: "portrait", tone, grain: tone !== "orange", top: [undefined, "04 / 07 — Diagnosis"], bot: bot ?? [i === 1 ? "Swipe →" : "Prohub — Make it obvious", `0${i} / 0${N}`], body }),
});

// A "boost" results card: views up, sales flat — the symptom everyone recognises.
const boostCard = () => `
  <div style="background:${C.ink2};border:2px solid ${C.line};border-radius:26px;padding:38px 42px;width:100%">
    <div class="mono" style="font-size:20px;color:${C.mute}">Boosted post · 7 days</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:26px">
      ${[["Reach", "48,210", "▲"], ["Likes", "1,906", "▲"], ["Sales", "2", "—"]].map(([k, v, a], i) => `
      <div style="padding:22px;border-radius:18px;background:${i === 2 ? C.orange : "#202023"};color:${i === 2 ? C.ink : C.white}">
        <div class="mono" style="font-size:18px;opacity:.7">${k}</div>
        <div class="h" style="font-size:66px;margin-top:10px">${v}</div>
        <div class="mono" style="font-size:22px;margin-top:6px">${a}</div></div>`).join("")}
    </div>
    <svg viewBox="0 0 600 120" style="width:100%;margin-top:26px;display:block"><polyline fill="none" stroke="${C.mute}" stroke-width="4" points="0,110 80,96 160,90 240,70 320,58 400,40 480,28 600,10"/>
      <polyline fill="none" stroke="${C.orange}" stroke-width="6" points="0,104 80,104 160,103 240,104 320,103 400,104 480,103 600,103"/></svg>
    <div style="display:flex;gap:30px" class="mono"><span style="font-size:18px;color:${C.mute}">— Reach</span><span style="font-size:18px;color:${C.orange}">— Sales</span></div>
  </div>`;

export function assets() {
  const out = [
    s(1, "ink", "cover", `
      <div class="h" style="position:absolute;left:76px;right:76px;top:170px;font-size:104px">You might not have a marketing problem.</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:560px;font-size:104px;color:${C.orange}">You might have a positioning problem.</div>
      <div class="b" style="position:absolute;left:76px;right:76px;bottom:150px;font-size:34px;color:${C.mute}">Here’s how to tell the difference — and why it matters before you spend another naira on ads.</div>`),
    s(2, "ink", "symptom", `
      <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">The symptom</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:210px;font-size:84px">Views went up. Sales didn’t.</div>
      <div style="position:absolute;left:76px;right:76px;top:470px">${boostCard()}</div>
      <div class="b" style="position:absolute;left:76px;right:76px;bottom:150px;font-size:30px;color:#C9C6C0">Illustrative numbers. If they feel familiar, keep swiping.</div>`),
    s(3, "paper", "amplify", `
      <div class="h" style="position:absolute;left:76px;right:76px;top:180px;font-size:118px">Ads don’t fix unclear.</div>
      <div style="position:absolute;left:76px;top:470px;display:flex;align-items:center;gap:30px">
        <div class="h" style="font-size:118px;color:${C.orange}">They amplify it.</div></div>
      <div class="b" style="position:absolute;left:76px;right:150px;top:720px;font-size:40px;color:${C.muteDark}">If people can’t tell why you over the next option, more reach just means more people deciding you’re not for them — faster.</div>`),
    s(4, "ink", "three-questions", `
      <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">The fix</div>
      <div class="h7" style="position:absolute;left:76px;right:76px;top:210px;font-size:60px">Positioning answers three questions before a customer has to ask.</div>
      <div style="position:absolute;left:76px;right:76px;top:470px;display:flex;flex-direction:column">
        ${[["Who exactly is this for?", "Not “everyone”. A person you could describe."], ["Why you, not the next option?", "One reason a customer could repeat to a friend."], ["Why now?", "What changes for them the day they choose you."]].map(([q, a], i) => `
        <div style="display:flex;gap:30px;padding:30px 0;border-top:2px solid ${C.line}">
          <div style="font-family:'Archivo';font-size:72px;line-height:.9;color:${C.orange};width:80px">${i + 1}</div>
          <div><div class="h7" style="font-size:50px">${q}</div><div class="b" style="font-size:30px;color:${C.mute};margin-top:10px">${a}</div></div></div>`).join("")}
      </div>`),
    s(5, "ink", "trust", `
      <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">Why it matters more here</div>
      <div class="h" style="position:absolute;left:76px;top:200px;font-family:'Archivo';font-size:380px;line-height:.85;letter-spacing:-.06em;color:${C.orange}">84%</div>
      <div class="h7" style="position:absolute;left:76px;right:76px;top:560px;font-size:56px">of Nigerian adults surveyed ran into a scam in the past year.</div>
      <div class="b" style="position:absolute;left:76px;right:76px;top:760px;font-size:38px;color:#C9C6C0">Your customers arrive suspicious. Clarity is how you get trusted. Looking credible isn’t vanity — it’s conversion.</div>
      <div class="mono" style="position:absolute;left:76px;right:76px;bottom:150px;font-size:17px;color:${C.mute};text-transform:none;letter-spacing:.02em">Source: GASA, State of Scams in Nigeria 2026 (survey of 1,180 adults).</div>`),
    s(6, "orange", "cta", `
      <div class="h" style="position:absolute;left:76px;right:76px;top:170px;font-size:128px;color:${C.ink}">Fix the position. Then spend.</div>
      <div class="h7" style="position:absolute;left:76px;right:120px;top:640px;font-size:52px;color:${C.ink}">Comment your one-line answer to “Why you?”</div>
      <div class="b" style="position:absolute;left:76px;right:140px;top:800px;font-size:40px;color:${C.ink};font-weight:600;opacity:.82">We’ll reply with how a customer actually hears it.</div>
      <div style="position:absolute;left:76px;bottom:150px">${logo({ h: 70, tone: "dark", accent: C.white })}</div>`, ["Strategy before spend", `06 / 06`]),
  ];

  // Square single for LinkedIn / Facebook
  out.push({
    name: "D4-07_square_1x1_linkedin",
    ...frame({
      size: "square", tone: "ink", top: [undefined, "04 / 07 — Diagnosis"],
      body: `
      <div class="h" style="position:absolute;left:76px;right:76px;top:150px;font-size:84px">Ads don’t fix unclear.</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:250px;font-size:84px;color:${C.orange}">They amplify it.</div>
      <div style="position:absolute;left:76px;right:76px;top:430px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        ${["Who is it for?", "Why you?", "Why now?"].map((q, i) => `<div style="border:2px solid ${C.line};border-radius:20px;padding:26px;height:250px;display:flex;flex-direction:column;justify-content:space-between"><span style="font-family:'Archivo';font-size:56px;color:${C.orange}">${i + 1}</span><span class="h7" style="font-size:40px">${q}</span></div>`).join("")}
      </div>
      <div class="b" style="position:absolute;left:76px;right:76px;bottom:130px;font-size:30px;color:#C9C6C0">If your brand can’t answer these in three seconds, a bigger budget won’t either.</div>`,
    }),
  });
  // Stories
  out.push({
    name: "D4-08_story_9x16_question",
    ...frame({
      size: "story", tone: "ink", m: 84, top: [undefined, "Your turn"], bot: ["Prohub", "Answer below"],
      body: `
      <div class="mono o" style="position:absolute;left:84px;top:260px;font-size:26px">One line. No fluff.</div>
      <div class="h" style="position:absolute;left:84px;right:84px;top:320px;font-size:150px">Why should someone choose you?</div>
      <div class="b" style="position:absolute;left:84px;right:84px;top:1500px;font-size:36px;color:${C.mute}">We’ll reply to the best ones with how a customer hears it.</div>`,
    }),
  });
  out.push({
    name: "D4-09_story_9x16_poll",
    ...frame({
      size: "story", tone: "paper", m: 84, top: [undefined, "Be honest"], bot: ["Prohub", "Vote below"],
      body: `
      <div class="h" style="position:absolute;left:84px;right:84px;top:300px;font-size:120px">Have you ever boosted a post and sold nothing?</div>
      ${swoosh({ w: 240, style: "position:absolute;left:84px;top:1000px;transform:rotate(-8deg)" })}
      <div class="b" style="position:absolute;left:84px;right:84px;top:1500px;font-size:36px;color:${C.muteDark}">No judgement. It’s usually the message, not the money.</div>`,
    }),
  });
  return out;
}
