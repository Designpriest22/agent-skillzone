// DAY 2 — Education carousel: "7 places your brand is quietly losing customers."
import { C, swoosh, logo, mark } from "./brand.mjs";
import { frame } from "./layout.mjs";

export const FOLDER = "Day 02 - Seven Leaks Carousel";
const N = 9;

// ---------- small "evidence" illustrations, one per mistake ----------
const ev = {
  logos: () => {
    const v = [
      `transform:scaleX(1.55)`, `color:#2E7DF6;font-family:Georgia,serif;font-style:italic`,
      `-webkit-text-stroke:3px ${C.ink};color:transparent`, `color:#D62828;text-shadow:6px 6px 0 #F2C230;transform:rotate(-6deg)`,
    ];
    return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;width:100%">${v.map((st, i) => `
      <div style="height:170px;border-radius:18px;background:${C.white};display:flex;align-items:center;justify-content:center;position:relative">
        <span style="font-family:'Montserrat';font-weight:800;font-size:58px;letter-spacing:-.03em;display:inline-block;${st}">Your&nbsp;Co.</span>
        <span class="mono" style="position:absolute;left:16px;bottom:12px;font-size:15px;color:${C.mute}">v${i + 1}_final${i ? "_FINAL" : ""}.png</span></div>`).join("")}</div>`;
  },
  bio: () => `
    <div style="background:${C.white};border-radius:24px;padding:34px 38px;width:100%;color:${C.ink}">
      <div style="display:flex;align-items:center;gap:22px">
        <div style="width:96px;height:96px;border-radius:50%;background:${C.paper2}"></div>
        <div><div class="b" style="font-weight:700;font-size:30px">yourbusiness_official</div>
        <div class="b" style="font-size:24px;color:${C.mute}">Business</div></div></div>
      <div class="b" style="font-size:30px;line-height:1.45;margin-top:22px">Welcome to our page ✦<br>Quality you can trust<br>God’s own business<br>DM for enquiries</div>
      <div class="mono" style="margin-top:22px;font-size:20px;color:${C.orange}">What do you sell? Where? For whom?</div>
    </div>`,
  price: () => `
    <div style="display:flex;flex-direction:column;gap:24px;width:100%">${[["adaeze.k", "How much is this?"], ["tunde_abj", "Price pls"], ["mimi.lagos", "hm. how much"], ["yourbusiness_official", "Check your DM", true]].map(([u, t, me]) => `
      <div style="display:flex;gap:18px;align-items:flex-start;${me ? "margin-left:70px" : ""}">
        <div style="flex:none;width:64px;height:64px;border-radius:50%;background:${me ? C.orange : "#3A3A3E"}"></div>
        <div class="b" style="font-size:36px;line-height:1.3"><b style="font-weight:700">${u}</b> <span style="opacity:.85">${t}</span>
        <div class="mono" style="font-size:19px;color:${C.mute};margin-top:6px">${me ? "Reply · seen by 214, 3 messaged" : "2h · Reply"}</div></div></div>`).join("")}</div>`,
  flyer: () => `
    <div style="width:100%;height:330px;background:#FFF36B;border-radius:6px;position:relative;overflow:hidden;color:#C1121F;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)">
      <div style="position:absolute;left:24px;top:14px;font:900 64px Georgia,serif;transform:rotate(-4deg);color:#1D3FBB">MEGA SALES!!!</div>
      <div style="position:absolute;right:20px;top:24px;width:130px;height:130px;border-radius:50%;background:#E63946;color:#fff;display:flex;align-items:center;justify-content:center;font:800 30px 'Montserrat';transform:rotate(12deg)">50%<br>OFF</div>
      <div style="position:absolute;left:28px;top:112px;font:italic 700 34px 'Times New Roman',serif;color:#2B9348">Quality • Affordable • Durable</div>
      <div style="position:absolute;left:28px;top:166px;font:400 30px 'Anton';letter-spacing:.04em;color:#7B2CBF">CALL: 0800 000 0000 / 0800 111 1111</div>
      <div style="position:absolute;left:28px;top:210px;font:700 26px 'Courier New',monospace;color:#000">WhatsApp: 0800 222 2222</div>
      <div style="position:absolute;left:28px;top:256px;font:800 italic 30px 'Montserrat';color:#F77F00">Order now!! Limited stock!! Don’t miss out!!</div>
    </div>`,
  link: () => `
    <div style="width:100%;background:${C.white};color:${C.ink};border-radius:24px;padding:40px;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center">
      <div style="width:84px;height:84px;border-radius:50%;border:5px solid ${C.ink};display:flex;align-items:center;justify-content:center;font:800 50px 'Montserrat'">!</div>
      <div class="h7" style="font-size:40px">Sorry, this page isn’t available.</div>
      <div class="b" style="font-size:26px;color:${C.mute}">The link you followed may be broken, or the page may have been removed.</div>
      <div class="mono" style="font-size:18px;color:${C.orange};margin-top:6px">← the exact moment they were ready to pay</div>
    </div>`,
  calendar: () => {
    const t = ["Happy Monday", "Good morning, family", "Hump day!", "Thank God it’s Thursday", "TGIF", "Happy weekend", "New week, new blessings"];
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;width:100%">${t.map((x, i) => `
      <div style="aspect-ratio:1;border-radius:14px;background:${C.white};color:${C.ink};padding:16px;display:flex;flex-direction:column;justify-content:space-between">
        <span class="mono" style="font-size:15px;color:${C.mute}">Day ${i + 1}</span><span class="h7" style="font-size:24px;line-height:1.1">${x}</span></div>`).join("")}
      <div style="aspect-ratio:1;border-radius:14px;background:${C.orange};color:${C.ink};padding:16px;display:flex;flex-direction:column;justify-content:space-between">
        <span class="mono" style="font-size:15px">Enquiries</span><span class="h" style="font-size:80px">0</span></div></div>`;
  },
  sameness: () => `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:480px;margin:0 auto">${Array.from({ length: 9 }, (_, i) => i === 4 ? `
      <div style="aspect-ratio:1;border-radius:12px;background:${C.orange};display:flex;align-items:center;justify-content:center">${mark({ h: 84, tone: "dark", accent: C.white })}</div>` : `
      <div style="aspect-ratio:1;border-radius:12px;background:#2A2A2E;padding:16px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px">
        <div style="height:12px;width:80%;background:#4A4A50;border-radius:6px"></div><div style="height:12px;width:55%;background:#4A4A50;border-radius:6px"></div>
        <div class="mono" style="font-size:13px;color:#77777E;margin-top:4px">Quality you can trust</div></div>`).join("")}</div>`,
};

const leaks = [
  { t: "Your logo looks different on every flyer.", n: "Stretched, recoloured, a new version from every designer. Customers read inconsistency as instability.", e: "logos", tone: "paper" },
  { t: "Your bio doesn’t say what you sell.", n: "A stranger gives your profile three seconds. Say what you do, where, and for whom — before the vibes.", e: "bio", tone: "paper" },
  { t: "“Check your DM” for price.", n: "Some people will DM. Many will simply buy from the vendor who answered in public. Show a starting price.", e: "price", tone: "ink" },
  { t: "Nine fonts. Three phone numbers.", n: "When everything shouts, nothing gets read. One message. One number. One action.", e: "flyer", tone: "ink" },
  { t: "Your link in bio goes nowhere.", n: "Dead links, a stale website, a WhatsApp number nobody answers. That’s the moment they were ready to pay.", e: "link", tone: "paper" },
  { t: "You post every day and say nothing.", n: "Greetings fill a calendar. They don’t fill a pipeline. Every post should earn its place.", e: "calendar", tone: "ink" },
  { t: "You look like everyone you compete with.", n: "Same template, same stock photo, same promise. If you’re interchangeable, you get compared on price.", e: "sameness", tone: "ink" },
];

export function assets() {
  const out = [];
  // Slide 1 — cover
  out.push({
    name: "D2-01_carousel_4x5_cover",
    ...frame({
      size: "portrait", tone: "ink",
      top: [undefined, "02 / 07 — Field notes"],
      bot: ["Swipe → count yours", `01 / 0${N}`],
      body: `
      <div class="h" style="position:absolute;left:76px;top:170px;font-family:'Archivo';font-size:420px;line-height:.8;letter-spacing:-.06em;color:${C.orange}">7</div>
      <div class="h" style="position:absolute;left:76px;right:76px;top:540px;font-size:108px">places your brand is quietly losing customers.</div>
      <div class="b" style="position:absolute;left:76px;bottom:150px;font-size:36px;color:${C.mute}">None of them show up in your sales report.</div>`,
    }),
  });
  leaks.forEach((l, i) => {
    const ink = l.tone === "ink";
    out.push({
      name: `D2-0${i + 2}_carousel_4x5_leak-${i + 1}`,
      ...frame({
        size: "portrait", tone: l.tone,
        top: [undefined, `Leak ${String(i + 1).padStart(2, "0")} / 07`],
        bot: ["Prohub — Make it obvious", `0${i + 2} / 0${N}`],
        body: `
        <div style="position:absolute;left:76px;right:76px;top:150px;display:flex;gap:28px;align-items:flex-start">
          <div style="font-family:'Archivo';font-size:120px;line-height:.82;color:${C.orange};letter-spacing:-.05em">${String(i + 1).padStart(2, "0")}</div>
          <div class="h" style="font-size:76px;line-height:.98">${l.t}</div></div>
        <div style="position:absolute;left:76px;right:76px;top:520px;bottom:330px;display:flex;align-items:center">${ev[l.e]()}</div>
        <div class="b" style="position:absolute;left:76px;right:76px;bottom:146px;font-size:34px;color:${ink ? "#C9C6C0" : C.muteDark}">${l.n}</div>`,
      }),
    });
  });
  // Slide 9 — CTA (built for sends: "send this to whoever runs your brand")
  out.push({
    name: "D2-09_carousel_4x5_cta",
    ...frame({
      size: "portrait", tone: "orange", grain: false,
      top: [undefined, "Your score"],
      bot: ["Prohub Creative Solutions", `0${N} / 0${N}`],
      body: `
      <div class="h" style="position:absolute;left:76px;right:76px;top:170px;font-size:128px;color:${C.ink}">Counted three or more?</div>
      <div class="h7" style="position:absolute;left:76px;right:120px;top:640px;font-size:54px;color:${C.ink}">Send this to whoever runs your brand.</div>
      <div class="b" style="position:absolute;left:76px;right:120px;top:790px;font-size:40px;color:${C.ink};font-weight:600;opacity:.82">Or send it to us. We fix all seven. DM <span style="background:${C.ink};color:${C.orange};padding:2px 14px;border-radius:8px">FIX</span> and tell us which ones you spotted.</div>
      <div style="position:absolute;left:76px;bottom:150px">${logo({ h: 70, tone: "dark", accent: C.white })}</div>`,
    }),
  });

  // Stories
  out.push({
    name: "D2-10_story_9x16_quiz",
    ...frame({
      size: "story", tone: "ink", m: 84,
      top: [undefined, "Quick one"], bot: ["Prohub", "New carousel on the feed"],
      body: `
      <div class="mono o" style="position:absolute;left:84px;top:260px;font-size:26px">Be honest</div>
      <div class="h" style="position:absolute;left:84px;right:84px;top:320px;font-size:118px">When did you last check your link in bio?</div>
      <div class="b" style="position:absolute;left:84px;right:84px;top:1460px;font-size:36px;color:${C.mute}">Tap it now. If it doesn’t open, that’s leak #5 — and it’s costing you.</div>`,
    }),
  });
  out.push({
    name: "D2-11_story_9x16_poll",
    ...frame({
      size: "story", tone: "paper", m: 84,
      top: [undefined, "Settle this"], bot: ["Prohub", "Vote below"],
      body: `
      <div class="h" style="position:absolute;left:84px;right:84px;top:300px;font-size:150px">“Check your DM” for price.</div>
      <div class="h7" style="position:absolute;left:84px;right:84px;top:820px;font-size:60px;color:${C.muteDark}">Smart sales tactic or customer repellent?</div>
      ${swoosh({ w: 260, style: "position:absolute;right:84px;top:1080px;transform:rotate(-10deg)" })}`,
    }),
  });
  out.push({
    name: "D2-12_story_9x16_send-it",
    ...frame({
      size: "story", tone: "orange", m: 84, grain: false,
      top: [undefined, "Do someone a favour"], bot: ["Prohub", "DM ‘FIX’"],
      body: `
      <div class="h" style="position:absolute;left:84px;right:84px;top:320px;font-size:138px;color:${C.ink}">Know a business making all seven?</div>
      <div class="h7" style="position:absolute;left:84px;right:84px;top:1000px;font-size:62px;color:${C.ink}">Send them the carousel. They’ll thank you in December.</div>`,
    }),
  });
  return out;
}
