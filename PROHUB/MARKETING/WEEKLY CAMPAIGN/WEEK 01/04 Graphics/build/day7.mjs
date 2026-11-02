// DAY 7 — Conversion: "December is booked in November."
import { C, logo, naira, swoosh } from "./brand.mjs";
import { frame } from "./layout.mjs";

export const FOLDER = "Day 07 - December Is Booked in November";
const src = `<span class="mono" style="font-size:17px;text-transform:none;letter-spacing:.02em">Source: MO Africa, The Economics of Euphoria: Lagos’ Detty December 2025 (consumer spending), via Nairametrics.</span>`;

export function assets() {
  return [
    {
      name: "D7-01_feed_4x5_december",
      ...frame({
        size: "portrait", tone: "ink", top: [undefined, "07 / 07 — Ready?"], bot: ["DM ‘DECEMBER’", "Abuja · Lagos"],
        body: `
        <div style="position:absolute;left:86px;top:160px;font-family:'Montserrat';font-weight:800;font-size:232px;line-height:.85;letter-spacing:-.06em;color:${C.orange};white-space:nowrap">${naira()}396bn</div>
        <div class="h7" style="position:absolute;left:76px;right:76px;top:390px;font-size:44px;color:#D8D5CF">spent in Lagos during Detty December 2025.</div>
        <div class="h" style="position:absolute;left:76px;right:76px;top:540px;font-size:118px">December is booked in November.</div>
        <div class="b" style="position:absolute;left:76px;right:76px;top:930px;font-size:36px;color:#C9C6C0">Customers decide fast in December. They choose the brand that already looks ready.</div>
        <div style="position:absolute;left:76px;right:76px;bottom:120px;color:${C.mute}">${src}</div>`,
      }),
    },
    {
      name: "D7-02_feed_4x5_offer",
      ...frame({
        size: "portrait", tone: "orange", grain: false, top: [undefined, "07 / 07 — Ready?"], bot: ["Prohub Creative Solutions", "Abuja · Lagos"],
        body: `
        <div class="mono" style="position:absolute;left:76px;top:160px;font-size:24px;color:${C.ink}">This week only</div>
        <div class="h" style="position:absolute;left:76px;right:76px;top:210px;font-size:96px;color:${C.ink}">20 minutes. Your brand. Our honest direction.</div>
        <div style="position:absolute;left:76px;right:76px;top:640px;display:flex;flex-direction:column;gap:18px">
          ${["Where your brand is leaking customers", "What to fix before December — and what can wait", "A clear next step, with or without us"].map((t) => `<div class="b" style="font-size:34px;font-weight:600;color:${C.ink};display:flex;gap:18px;align-items:center"><span style="width:16px;height:16px;background:${C.ink};border-radius:50%;flex:none"></span>${t}</div>`).join("")}
        </div>
        <div class="h7" style="position:absolute;left:76px;right:76px;top:950px;font-size:46px;line-height:1.25;color:${C.ink}">Book a Brand Direction Call.<br> DM <span style="background:${C.ink};color:${C.orange};padding:0 16px;border-radius:10px">DECEMBER</span></div>
        <div style="position:absolute;left:76px;bottom:150px">${logo({ h: 64, tone: "dark", accent: C.white })}</div>`,
      }),
    },
    {
      name: "D7-03_square_1x1_linkedin",
      ...frame({
        size: "square", tone: "ink", top: [undefined, "07 / 07 — Ready?"], bot: ["Prohub Creative Solutions", "Abuja · Lagos"],
        body: `
        <div style="position:absolute;left:86px;top:130px;font-family:'Montserrat';font-weight:800;font-size:220px;line-height:.85;letter-spacing:-.06em;color:${C.orange};white-space:nowrap">${naira()}396bn</div>
        <div class="h7" style="position:absolute;left:76px;right:76px;top:350px;font-size:38px;color:#D8D5CF">spent in Lagos during Detty December 2025.</div>
        <div class="h" style="position:absolute;left:76px;right:76px;top:470px;font-size:96px">Q1 is planned in Q4.</div>
        <div class="b" style="position:absolute;left:76px;right:76px;top:700px;font-size:32px;color:#C9C6C0">Festive campaigns, year-end events, January launches — the brands that win them are briefed now.</div>
        <div style="position:absolute;left:76px;right:76px;bottom:110px;color:${C.mute}">${src}</div>`,
      }),
    },
    {
      name: "D7-04_story_9x16_countdown",
      ...frame({
        size: "story", tone: "ink", m: 84, top: [undefined, "Countdown"], bot: ["Prohub", "DM ‘DECEMBER’"],
        body: `
        <div class="mono o" style="position:absolute;left:84px;top:260px;font-size:26px">From today</div>
        <div style="position:absolute;left:78px;top:300px;font-family:'Archivo';font-size:560px;line-height:.85;letter-spacing:-.06em;color:${C.orange}">33</div>
        <div class="h" style="position:absolute;left:84px;right:84px;top:820px;font-size:110px">days to Detty December Fest.</div>
        <div class="b" style="position:absolute;left:84px;right:84px;top:1120px;font-size:38px;color:#C9C6C0">Events, menus, campaigns and launches that look ready get chosen first. Is yours ready?</div>`,
      }),
    },
    {
      name: "D7-05_story_9x16_checklist",
      ...frame({
        size: "story", tone: "paper", m: 84, top: [undefined, "December-ready?"], bot: ["Prohub", "Tap to book"],
        body: `
        <div class="h" style="position:absolute;left:84px;right:84px;top:240px;font-size:110px">Is your brand December-ready?</div>
        <div style="position:absolute;left:84px;right:84px;top:620px;display:flex;flex-direction:column;gap:22px">
          ${["Your page says what you sell, where, for whom", "Your flyers and posts look like one brand", "Your link in bio actually works", "You have video, not just stills", "Someone answers DMs within the hour"].map((t) => `<div style="display:flex;gap:24px;align-items:center;padding:24px 28px;border-radius:18px;background:${C.white}">
            <span style="width:44px;height:44px;border:4px solid ${C.ink};border-radius:10px;flex:none"></span><span class="h7" style="font-size:38px">${t}</span></div>`).join("")}
        </div>
        <div class="b" style="position:absolute;left:84px;right:84px;top:1460px;font-size:38px;color:${C.muteDark}">Missing two or more? Book a 20-minute Brand Direction Call.</div>`,
      }),
    },
    {
      name: "D7-06_story_9x16_book",
      ...frame({
        size: "story", tone: "orange", m: 84, grain: false, top: [undefined, "Last call this week"], bot: ["Prohub Creative Solutions", "Abuja · Lagos"],
        body: `
        <div class="h" style="position:absolute;left:84px;right:84px;top:300px;font-size:170px;color:${C.ink}">Let’s make it obvious.</div>
        <div class="h7" style="position:absolute;left:84px;right:84px;top:920px;font-size:58px;color:${C.ink}">DM <span style="background:${C.ink};color:${C.orange};padding:0 16px;border-radius:10px">DECEMBER</span> to book your Brand Direction Call.</div>
        <div style="position:absolute;left:84px;bottom:200px">${logo({ h: 74, tone: "dark", accent: C.white })}</div>`,
      }),
    },
  ];
}
