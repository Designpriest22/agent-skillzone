// DAY 6 — Engagement & community: "The Free Brand Read."
import { C, logo, swoosh } from "./brand.mjs";
import { frame } from "./layout.mjs";

export const FOLDER = "Day 06 - Free Brand Read";

const steps = [["Drop your handle", "Comment your business’s Instagram handle below."], ["We pick five", "Different industries, Abuja and Lagos first."], ["You get three notes", "What’s working. What isn’t. What we’d change first."]];

export function assets() {
  return [
    {
      name: "D6-01_feed_4x5_brand-read",
      ...frame({
        size: "portrait", tone: "ink", top: [undefined, "06 / 07 — Community"],
        bot: ["Comments close Sunday, 9 pm", "Reads on our Stories"],
        body: `
        <div class="mono o" style="position:absolute;left:76px;top:160px;font-size:24px">Free Brand Read</div>
        <div class="h" style="position:absolute;left:76px;right:76px;top:210px;font-size:150px">Drop your<br>handle.</div>
        ${swoosh({ w: 170, style: "position:absolute;right:96px;top:370px;transform:rotate(4deg)" })}
        <div class="h7" style="position:absolute;left:76px;right:76px;top:540px;font-size:48px;color:#D8D5CF">We’ll pick five businesses and read their brand — honestly, for free.</div>
        <div style="position:absolute;left:76px;right:76px;top:740px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
          ${steps.map(([t, d], i) => `<div style="border:2px solid ${C.line};border-radius:22px;padding:28px;height:400px;display:flex;flex-direction:column;justify-content:space-between;background:${i === 2 ? C.orange : "transparent"};color:${i === 2 ? C.ink : C.white}">
            <span style="font-family:'Archivo';font-size:64px;line-height:.9;color:${i === 2 ? C.ink : C.orange}">${i + 1}</span>
            <div><div class="h7" style="font-size:38px">${t}</div><div class="b" style="font-size:24px;margin-top:12px;opacity:.75">${d}</div></div></div>`).join("")}
        </div>`,
      }),
    },
    {
      name: "D6-02_square_1x1_brand-read",
      ...frame({
        size: "square", tone: "paper", top: [undefined, "06 / 07 — Community"], bot: ["Prohub Creative Solutions", "Comment below"],
        body: `
        <div class="mono" style="position:absolute;left:76px;top:150px;font-size:24px;color:${C.muteDark}">Free Brand Read</div>
        <div class="h" style="position:absolute;left:76px;right:76px;top:200px;font-size:120px">Drop your<br>handle.</div>
        <div class="h7" style="position:absolute;left:76px;right:200px;top:500px;font-size:46px">Five businesses get three honest notes on their brand. Free.</div>
        <div class="b" style="position:absolute;left:76px;right:76px;top:760px;font-size:30px;color:${C.muteDark}">What’s working · what isn’t · what we’d change first</div>
        ${swoosh({ w: 150, style: "position:absolute;right:90px;top:300px;transform:rotate(-6deg)" })}`,
      }),
    },
    {
      name: "D6-03_story_9x16_how-it-works",
      ...frame({
        size: "story", tone: "ink", m: 84, top: [undefined, "Free Brand Read"], bot: ["Prohub", "Link to the post below"],
        body: `
        <div class="h" style="position:absolute;left:84px;right:84px;top:240px;font-size:140px">Want an honest read on your brand?</div>
        <div style="position:absolute;left:84px;right:84px;top:820px;display:flex;flex-direction:column;gap:22px">
          ${steps.map(([t, d], i) => `<div style="display:flex;gap:28px;align-items:flex-start;padding:30px;border-radius:22px;background:${C.ink2};border:2px solid ${C.line}">
            <span style="font-family:'Archivo';font-size:60px;line-height:.9;color:${C.orange}">${i + 1}</span>
            <div><div class="h7" style="font-size:46px">${t}</div><div class="b" style="font-size:30px;color:${C.mute};margin-top:8px">${d}</div></div></div>`).join("")}
        </div>`,
      }),
    },
    {
      name: "D6-04_story_9x16_poll",
      ...frame({
        size: "story", tone: "paper", m: 84, top: [undefined, "Hot take"], bot: ["Prohub", "Vote below"],
        body: `
        <div class="mono" style="position:absolute;left:84px;top:260px;font-size:26px;color:${C.muteDark}">Which costs a business more?</div>
        <div class="h" style="position:absolute;left:84px;right:84px;top:330px;font-size:132px">An ugly logo<br><span style="color:${C.orange}">or</span> a dead Instagram page?</div>`,
      }),
    },
    {
      name: "D6-05_story_9x16_question-box",
      ...frame({
        size: "story", tone: "orange", m: 84, grain: false, top: [undefined, "Tell us"], bot: ["Prohub", "Answers stay private"],
        body: `
        <div class="h" style="position:absolute;left:84px;right:84px;top:300px;font-size:124px;color:${C.ink}">What’s the most frustrating part of marketing your business?</div>`,
      }),
    },
    {
      name: "D6-06_story_9x16_reads-template",
      ...frame({
        size: "story", tone: "ink", m: 84, top: [undefined, "Brand Read 0_ / 05"], bot: ["Prohub — Free Brand Read", "Shared with permission"],
        body: `
        <div class="mono o" style="position:absolute;left:84px;top:220px;font-size:26px">@handle · industry · city</div>
        <div style="position:absolute;left:84px;right:84px;top:290px;height:640px;border-radius:24px;border:3px dashed ${C.line};display:flex;align-items:center;justify-content:center">
          <span class="mono" style="font-size:24px;color:${C.mute}">Screenshot of their profile</span></div>
        <div style="position:absolute;left:84px;right:84px;top:990px;display:flex;flex-direction:column;gap:20px">
          ${[["Working", "…"], ["Not working", "…"], ["Change first", "…"]].map(([k, v], i) => `<div style="padding:26px 30px;border-radius:20px;background:${i === 2 ? C.orange : C.ink2};color:${i === 2 ? C.ink : C.white}">
            <div class="mono" style="font-size:20px;opacity:.7">${k}</div><div class="h7" style="font-size:40px;margin-top:8px">${v}</div></div>`).join("")}
        </div>`,
      }),
    },
  ];
}
