// DAY 1 — Brand positioning: "Cover your logo."
import { C, swoosh, logo } from "./brand.mjs";
import { frame } from "./layout.mjs";

export const FOLDER = "Day 01 - Cover Your Logo";

/** A shopping bag with a strip of tape over the logo — the whole idea in one object. */
function bag({ w = 560, bagColor = C.ink, foldColor = "rgba(255,255,255,.035)", handle = C.ink, tapeText = "" } = {}) {
  const h = Math.round(w * 1.06);
  return `
  <div class="bagwrap" style="position:relative;width:${w}px;height:${h + Math.round(w * 0.36)}px">
    <div style="position:absolute;left:${w * 0.24}px;top:0;width:${w * 0.52}px;height:${w * 0.62}px;border:${w * 0.03}px solid ${handle};border-bottom:none;border-radius:${w * 0.3}px ${w * 0.3}px 0 0"></div>
    <div style="position:absolute;left:0;bottom:0;width:${w}px;height:${h}px;background:${bagColor};border-radius:6px 6px 10px 10px;
      box-shadow:0 60px 80px -40px rgba(0,0,0,.45), inset 0 ${w * 0.1}px 0 ${foldColor}">
      <div style="position:absolute;left:${w * 0.06}px;right:${w * 0.06}px;top:${w * 0.1}px;height:2px;background:${foldColor}"></div>
    </div>
    <div class="tape" style="position:absolute;left:${-w * 0.09}px;width:${w * 1.18}px;bottom:${h * 0.42}px;height:${w * 0.24}px;background:${C.orange};
      transform:rotate(-7deg);box-shadow:0 10px 24px rgba(0,0,0,.25);
      clip-path:polygon(0 6%,2% 0,98% 0,100% 8%,98.5% 22%,100% 38%,98.4% 55%,100% 72%,98.6% 88%,99.6% 100%,1.4% 100%,0 90%,1.6% 74%,0 58%,1.5% 41%,0 24%);
      display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(0,0,0,.035) 0 3px,transparent 3px 9px)"></div>
      ${tapeText ? `<span class="mono" style="font-size:${w * 0.045}px;font-weight:700;letter-spacing:.3em;color:${C.ink};opacity:.75">${tapeText}</span>` : ""}
    </div>
  </div>`;
}

export function assets() {
  return [
    // Feed 4:5 — Instagram / Facebook main post
    {
      name: "D1-01_feed_4x5_cover-your-logo",
      ...frame({
        size: "portrait", tone: "paper",
        top: [undefined, "01 / 07 — The logo test"],
        body: `
        <div class="h" style="position:absolute;left:76px;top:150px;font-size:158px">Cover<br>your logo.</div>
        <div style="position:absolute;right:104px;top:486px">${bag({ w: 400 })}</div>
        <div class="mono" style="position:absolute;left:78px;top:560px;font-size:20px;color:${C.muteDark};line-height:1.7;width:300px">Fig. 1<br>Your brand,<br>minus the logo.</div>
        <div style="position:absolute;left:76px;bottom:150px">
          <div class="h7" style="font-size:66px;line-height:1.02">Would anyone still<br>know it’s <span class="o">you</span>?</div>
        </div>`,
      }),
    },
    // Square 1:1 — LinkedIn / Facebook
    {
      name: "D1-02_square_1x1_cover-your-logo",
      ...frame({
        size: "square", tone: "ink",
        top: [undefined, "01 / 07 — The logo test"],
        body: `
        <div class="h" style="position:absolute;left:76px;top:150px;font-size:128px">Cover<br>your<br>logo.</div>
        <div style="position:absolute;right:96px;top:170px">${bag({ w: 400, bagColor: C.paper, foldColor: "rgba(0,0,0,.06)", handle: C.paper })}</div>
        <div class="h7" style="position:absolute;left:76px;bottom:140px;font-size:50px;line-height:1.05">Would anyone still<br>know it’s <span class="o">you</span>?</div>`,
      }),
    },
    // Story 1 — the thumb test (poll sticker goes in the clear space below)
    {
      name: "D1-03_story_9x16_thumb-test",
      ...frame({
        size: "story", tone: "ink", m: 84,
        top: [undefined, "The thumb test"],
        bot: ["Prohub", "Reply with your answer"],
        body: `
        <div class="h" style="position:absolute;left:84px;right:84px;top:250px;font-size:112px">Put your thumb on the circle.</div>
        <div style="position:absolute;left:50%;top:760px;transform:translateX(-50%);width:380px;height:380px;border-radius:50%;border:5px dashed ${C.orange};display:flex;align-items:center;justify-content:center">
          <span class="mono" style="font-size:26px;color:${C.orange};letter-spacing:.3em">Logo</span></div>
        <div class="h7" style="position:absolute;left:84px;right:84px;top:1240px;font-size:58px;line-height:1.08">Now picture your last post.<br><span class="mu">Is it still obviously you?</span></div>`,
      }),
    },
    // Story 2 — what should be left when the logo is gone
    {
      name: "D1-04_story_9x16_three-things",
      ...frame({
        size: "story", tone: "paper", m: 84,
        top: [undefined, "Brand memory 101"],
        bot: ["Prohub", "DM ‘OBVIOUS’"],
        body: `
        <div class="h7" style="position:absolute;left:84px;right:84px;top:230px;font-size:60px;line-height:1.08">Three things customers should recognise <span style="text-decoration:underline;text-decoration-color:${C.orange};text-decoration-thickness:8px;text-underline-offset:10px">before</span> they read your name.</div>
        <div style="position:absolute;left:84px;right:84px;top:640px;display:flex;flex-direction:column;gap:26px">
          ${[["A colour", "you own", C.orange], ["A shape", "you repeat", C.ink], ["A voice", "that sounds like you", C.paper2]].map(([a, b, bg], i) => `
          <div style="display:flex;align-items:center;gap:34px;padding:34px 38px;border-radius:22px;background:${i === 1 ? C.ink : i === 0 ? C.orange : C.white};color:${i === 1 ? C.white : C.ink}">
            <span class="mono" style="font-size:24px;opacity:.6">0${i + 1}</span>
            <span class="h" style="font-size:72px;letter-spacing:-0.04em">${a}</span>
            <span class="b" style="font-size:34px;margin-left:auto;opacity:.75;text-align:right">${b}</span></div>`).join("")}
        </div>
        <div class="b" style="position:absolute;left:84px;right:84px;top:1330px;font-size:40px;color:${C.muteDark}">If your logo is the only thing doing the work, every post starts from zero.</div>`,
      }),
    },
    // Story 3 — reel promo / end card
    {
      name: "D1-05_story_9x16_reel-teaser",
      ...frame({
        size: "story", tone: "orange", m: 84, grain: false,
        top: [undefined, "New on the feed"],
        bot: ["Prohub Creative Solutions", "Abuja · Lagos"],
        body: `
        <div class="h" style="position:absolute;left:84px;right:84px;top:300px;font-size:196px;line-height:.88;color:${C.ink}">Make<br>it<br>obvious.</div>
        <div class="b" style="position:absolute;left:84px;right:84px;top:1080px;font-size:46px;color:${C.ink};font-weight:600">The brands people remember aren’t louder. They’re easier to recognise.</div>
        <div style="position:absolute;left:84px;bottom:220px">${logo({ h: 74, tone: "dark", accent: C.white })}</div>`,
      }),
    },
  ];
}
