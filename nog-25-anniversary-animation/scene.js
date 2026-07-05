// NOG Energy Week — 25th Anniversary logo reveal
// Pure function of time: renderAtTime(t) sets every visual property deterministically
// so the same timestamp always produces the same frame (safe to seek for video capture).

var TOTAL_DURATION = 15.0;

// ---------- easing ----------
function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function prog(t, a, b) { return clamp01((t - a) / (b - a)); }
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInCubic(x) { return x * x * x; }
function easeInOutSine(x) { return -(Math.cos(Math.PI * x) - 1) / 2; }
function easeOutBack(x) {
  var c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function easeOutExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
function lerp(a, b, x) { return a + (b - a) * x; }

// ---------- build the 7-blade gold aperture icon (deterministic SVG) ----------
var ICON_R = 95;
function polar(r, deg) {
  var rad = deg * Math.PI / 180;
  return (r * Math.cos(rad)).toFixed(2) + " " + (r * Math.sin(rad)).toFixed(2);
}
function bladePath(R) {
  // wide overlapping "shutter" blade (~75deg span) so 7 of them, spaced 51.43deg apart,
  // interlock with no gaps — matches the solid faceted aperture silhouette of the reference logo.
  var c1 = polar(R * 0.38, 6);
  var c2 = polar(R * 0.88, -42);
  var tip = polar(R * 1.02, -75);
  var c3 = polar(R * 0.95, -96);
  var c4 = polar(R * 0.55, -106);
  return "M 0 0 C " + c1 + ", " + c2 + ", " + tip + " C " + c3 + ", " + c4 + ", 0 0 Z";
}
(function buildIcon() {
  var svg = document.getElementById("icon");
  var NS = "http://www.w3.org/2000/svg";
  var defs = document.createElementNS(NS, "defs");

  var gLight = document.createElementNS(NS, "linearGradient");
  gLight.setAttribute("id", "gLight");
  gLight.setAttribute("x1", "0%"); gLight.setAttribute("y1", "0%");
  gLight.setAttribute("x2", "100%"); gLight.setAttribute("y2", "100%");
  [["0%", "#fff6d6"], ["45%", "#eec052"], ["100%", "#a9791f"]].forEach(function (s) {
    var stop = document.createElementNS(NS, "stop");
    stop.setAttribute("offset", s[0]); stop.setAttribute("stop-color", s[1]);
    gLight.appendChild(stop);
  });

  var gDark = document.createElementNS(NS, "linearGradient");
  gDark.setAttribute("id", "gDark");
  gDark.setAttribute("x1", "0%"); gDark.setAttribute("y1", "0%");
  gDark.setAttribute("x2", "100%"); gDark.setAttribute("y2", "100%");
  [["0%", "#e8bd58"], ["50%", "#b3822a"], ["100%", "#6e4c14"]].forEach(function (s) {
    var stop = document.createElementNS(NS, "stop");
    stop.setAttribute("offset", s[0]); stop.setAttribute("stop-color", s[1]);
    gDark.appendChild(stop);
  });

  defs.appendChild(gLight);
  defs.appendChild(gDark);
  svg.appendChild(defs);

  var group = document.createElementNS(NS, "g");
  group.setAttribute("id", "bladeGroup");
  var n = 7;
  for (var i = 0; i < n; i++) {
    var angle = i * (360 / n);
    var g = document.createElementNS(NS, "g");
    g.setAttribute("transform", "rotate(" + angle + ")");
    g.setAttribute("class", "blade");
    g.setAttribute("data-i", i);

    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", bladePath(ICON_R));
    path.setAttribute("fill", i % 2 === 0 ? "url(#gLight)" : "url(#gDark)");
    path.setAttribute("stroke", "rgba(60,38,6,0.35)");
    path.setAttribute("stroke-width", "0.6");

    g.appendChild(path);
    group.appendChild(g);
  }
  svg.appendChild(group);
})();

// ---------- build gathering fragments (scene 1) — deterministic golden-angle spiral ----------
(function buildFragments() {
  var host = document.getElementById("fragments");
  var n = 22;
  for (var i = 0; i < n; i++) {
    var el = document.createElement("div");
    el.className = "frag";
    el.id = "frag" + i;
    host.appendChild(el);
  }
})();

// ---------- ambient sparks (deterministic golden-angle placement) ----------
(function buildSparks() {
  var host = document.getElementById("ambient");
  var n = 40;
  var golden = 137.508;
  for (var i = 0; i < n; i++) {
    var el = document.createElement("div");
    el.className = "spark";
    var a = (i * golden) % 360;
    var rad = 40 + (i * 53) % 640;
    var cx = 750 + rad * Math.cos(a * Math.PI / 180);
    var cy = 600 + rad * 0.62 * Math.sin(a * Math.PI / 180);
    var size = 3 + (i % 5);
    el.style.left = cx + "px";
    el.style.top = cy + "px";
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.dataset.phase = ((i * 0.61) % 1).toFixed(3);
    host.appendChild(el);
  }
})();

// fragment target angles (golden-angle spiral, deterministic)
var FRAG_N = 22;
var fragData = [];
(function () {
  var golden = 137.508;
  for (var i = 0; i < FRAG_N; i++) {
    var startAngle = (i * golden) % 360;
    var startRadius = 260 + (i * 37) % 260;
    var endAngle = (i * (360 / FRAG_N)) * 1.0;
    fragData.push({
      sx: startRadius * Math.cos(startAngle * Math.PI / 180),
      sy: startRadius * Math.sin(startAngle * Math.PI / 180) * 0.75,
      rot: (i * 47) % 360,
      delay: (i % 7) * 0.03
    });
  }
})();

// ---------- caption content per scene ----------
var CAPTIONS = [
  { start: 0.0, end: 2.6, l1: "Darkness.", l2: "Fragments of energy begin to gather." },
  { start: 2.2, end: 5.4, l1: "The energy takes shape.", l2: "A symbol is born." },
  { start: 4.9, end: 7.8, l1: "NOG emerges.", l2: "Built on power. Driven by purpose." },
  { start: 7.5, end: 10.3, l1: "Energy Week.", l2: "A platform for impact and innovation." },
  { start: 10.0, end: 12.6, l1: "25 Years.", l2: "A legacy of excellence." },
  { start: 12.3, end: 15.0, l1: "NOG Energy Week — 25th Anniversary.", l2: "Powering the future. Together." }
];

var els = {};
["fragments", "iconWrap", "iconGlow", "iconRing", "wordmark", "streak", "energyWeek",
  "barLeft", "twentyfive", "anniversaryBox", "anniversaryTxt", "reflection", "shine",
  "beam", "captionLine1", "captionLine2"].forEach(function (id) { els[id] = document.getElementById(id); });

function setOpacity(el, v) { el.style.opacity = v; }
function setTransform(el, str) { el.style.transform = str; }

function renderAtTime(t) {
  t = Math.max(0, Math.min(TOTAL_DURATION, t));

  // ---------- ambient sparks: gentle deterministic twinkle ----------
  var sparks = document.getElementById("ambient").children;
  for (var i = 0; i < sparks.length; i++) {
    var el = sparks[i];
    var phase = parseFloat(el.dataset.phase);
    var tw = 0.5 + 0.5 * Math.sin((t * 0.6 + phase * 10));
    var fadeIn = easeOutCubic(prog(t, 0, 3));
    el.style.opacity = (0.15 + 0.55 * tw) * fadeIn * 0.7;
  }

  // ================= SCENE 1 — darkness -> fragments gather =================
  var p1 = prog(t, 0.0, 2.6);
  var beamP = easeOutCubic(prog(t, 0.0, 1.2)) * (1 - easeInCubic(prog(t, 1.8, 2.8)));
  els.beam.style.opacity = beamP * 0.8;

  var fragEls = els.fragments.children;
  for (var i = 0; i < fragEls.length; i++) {
    var d = fragData[i];
    var fp = clamp01((p1 * 1.15) - d.delay);
    var appear = easeOutCubic(clamp01(fp / 0.5));
    var travel = easeInOutSine(clamp01(fp));
    var fadeOut = 1 - easeInCubic(prog(t, 2.1, 2.7));
    var x = lerp(d.sx, 0, travel);
    var y = lerp(d.sy, -30, travel);
    var rot = lerp(d.rot, 0, travel);
    var scale = lerp(1, 0.15, travel) * appear;
    fragEls[i].style.opacity = appear * fadeOut;
    fragEls[i].style.transform = "translate(" + x + "px," + y + "px) rotate(" + rot + "deg) scale(" + scale + ")";
  }

  // ================= SCENE 2 — icon assembles & settles =================
  var p2 = prog(t, 2.2, 5.4);
  var iconAppear = easeOutBack(prog(t, 2.3, 4.0));
  var iconSpin = lerp(320, 0, easeOutCubic(prog(t, 2.3, 4.6)));
  var iconScale = lerp(0.35, 1, easeOutBack(prog(t, 2.3, 4.2)));
  els.iconWrap.style.opacity = clamp01(iconAppear * 2);
  els.iconWrap.style.transform = "scale(" + Math.max(0.001, iconScale) + ") rotate(" + iconSpin + "deg)";

  var glowPulse = easeOutCubic(prog(t, 2.6, 3.6)) * (1 - 0.4 * easeInOutSine(prog(t, 3.6, 5.4)));
  els.iconGlow.style.opacity = glowPulse * 0.9;

  // ================= SCENE 3 — NOG wordmark slides in with streak =================
  var wmAppear = easeOutExpo(prog(t, 4.9, 6.0));
  var wmX = lerp(140, 0, easeOutCubic(prog(t, 4.9, 6.1)));
  els.wordmark.style.opacity = wmAppear;
  els.wordmark.style.transform = "translateX(" + wmX + "px)";

  var streakX = lerp(-200, 900, easeOutCubic(prog(t, 4.9, 5.9)));
  var streakFade = easeOutCubic(prog(t, 4.9, 5.2)) * (1 - easeInCubic(prog(t, 5.5, 6.0)));
  els.streak.style.opacity = streakFade;
  els.streak.style.transform = "translateX(" + streakX + "px)";

  // ================= SCENE 4 — ENERGY WEEK + 25 =================
  var ewAppear = easeOutCubic(prog(t, 7.5, 8.6));
  var ewY = lerp(24, 0, ewAppear);
  els.energyWeek.style.opacity = ewAppear;
  els.energyWeek.style.transform = "translateY(" + ewY + "px)";

  var barAppear = easeOutCubic(prog(t, 7.7, 8.3));
  els.barLeft.style.opacity = barAppear;
  els.barLeft.style.transform = "scaleY(" + barAppear + ")";
  els.barLeft.style.transformOrigin = "top";

  var tfAppear = easeOutBack(prog(t, 8.0, 9.3));
  var tfY = lerp(50, 0, easeOutCubic(prog(t, 8.0, 9.3)));
  els.twentyfive.style.opacity = clamp01(tfAppear * 2);
  els.twentyfive.style.transform = "translateY(" + tfY + "px)";

  // ================= SCENE 5 — ANNIVERSARY badge + reflection =================
  var boxAppear = easeOutCubic(prog(t, 10.0, 10.9));
  els.anniversaryBox.style.opacity = boxAppear;
  els.anniversaryBox.style.transform = "scaleX(" + boxAppear + ")";
  els.anniversaryBox.style.transformOrigin = "left";

  var txtAppear = easeOutCubic(prog(t, 10.4, 11.1));
  els.anniversaryTxt.style.opacity = txtAppear;

  var reflAppear = easeOutCubic(prog(t, 10.2, 12.0));
  els.reflection.style.opacity = reflAppear * 0.28;

  // ================= SCENE 6 — final hold + shine sweep =================
  var shineX = lerp(260, 1420, easeInOutSine(prog(t, 12.6, 14.4)));
  var shineFade = easeOutCubic(prog(t, 12.6, 13.0)) * (1 - easeInCubic(prog(t, 14.0, 14.6)));
  els.shine.style.opacity = shineFade * 0.6;
  els.shine.style.left = shineX + "px";

  // subtle continuous breathing glow across the whole final lockup
  var finalGlow = 1 + 0.015 * Math.sin(t * 1.3);
  document.getElementById("stage").style.filter = "brightness(" + finalGlow.toFixed(4) + ")";

  // ---------- captions ----------
  for (var c = 0; c < CAPTIONS.length; c++) {
    var cap = CAPTIONS[c];
    if (t >= cap.start && t <= cap.end) {
      var fadeIn = easeOutCubic(prog(t, cap.start, cap.start + 0.5));
      var fadeOut = 1 - easeInCubic(prog(t, cap.end - 0.5, cap.end));
      var o = Math.min(fadeIn, fadeOut);
      els.captionLine1.textContent = cap.l1;
      els.captionLine2.textContent = cap.l2;
      els.captionLine1.style.opacity = o;
      els.captionLine2.style.opacity = o;
    }
  }
}

window.renderAtTime = renderAtTime;
window.TOTAL_DURATION = TOTAL_DURATION;

// live preview loop (browser playback only — capture script calls renderAtTime directly
// and sets window.__PAUSE_LOOP = true first, so seeking isn't clobbered by rAF)
window.__PAUSE_LOOP = false;
var __start = null;
function __loop(now) {
  if (!window.__PAUSE_LOOP) {
    if (__start === null) __start = now;
    var t = ((now - __start) / 1000) % TOTAL_DURATION;
    renderAtTime(t);
  }
  requestAnimationFrame(__loop);
}
requestAnimationFrame(__loop);
