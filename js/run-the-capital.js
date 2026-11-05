/* =====================================================================
   RUN THE CAPITAL — Abuja Edition
   A hand-drawn canvas runner for The Capital Movement. No dependencies.

   Run Abuja end to end: golden hour under Aso Rock, dusk over the
   National Mosque and the Ecumenical Centre, Wuse 2 after dark, and
   harmattan haze at Zuma Rock. Every sprite is drawn in code.
   ===================================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('game-stage');
  var canvas = document.getElementById('game-canvas');
  if (!stage || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function $(id) { return document.getElementById(id); }

  /* ------------------------------------------------------------------ utils */
  function load(k, d) { try { var v = localStorage.getItem('rtc.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('rtc.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function C(a, al) { return 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + (al == null ? 1 : al) + ')'; }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rr(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath(); g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  function ell(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); }

  var WHITE = [255, 255, 255], BLACK = [0, 0, 0], CREAM = [236, 229, 214];
  var NG_GREEN = '#008751', GOLD = '#E8C547', RED = '#FF3B3B';

  /* ------------------------------------------------------------------ zones
     Four districts, each with its own light. Colours blend as you run. */
  var ZONE_LEN = 800;
  var ZONES = [
    { key: 'aso', name: 'Three Arms Zone', tag: 'Aso Rock · golden hour', greet: 'Barka da yamma!',
      sky0: '#2b1840', sky1: '#7d3552', sky2: '#e0744a', sky3: '#ffc56e', sun: '#fff0c2',
      hill2: '#8a4a55', hill: '#4b2534', far: '#5c2d40', lit: '#ffb35c', mid: '#2e1826', pave: '#3a2a2c', road: '#221a1e', haze: '#ff9d5c',
      sunY: 0.8, night: 0.05, stars: 0, hazeA: 0.24, windows: 0.08, neon: 0, dust: 0, cloud: 0.7,
      landmarks: ['asorock', 'assembly', 'citygate'], mids: ['block', 'arewa', 'mast', 'block', 'tower'],
      nears: { lamp: 3, palm: 2, flag: 2, billboard: 1, neem: 2, pots: 1 } },
    { key: 'central', name: 'Central Area', tag: 'National Mosque · Ecumenical Centre', greet: 'Ina wuni!',
      sky0: '#0e0c2c', sky1: '#2c1f5a', sky2: '#7a3d78', sky3: '#f08a6c', sun: '#ffd6b8',
      hill2: '#553663', hill: '#2b1c40', far: '#3b2852', lit: '#ffd27a', mid: '#1e1631', pave: '#2a2433', road: '#17141d', haze: '#c0587e',
      sunY: 0.96, night: 0.45, stars: 0.35, hazeA: 0.18, windows: 0.35, neon: 0.2, dust: 0, cloud: 0.45,
      landmarks: ['mosque', 'ecumenical', 'cbd', 'millennium'], mids: ['tower', 'block', 'tower', 'mast', 'block'],
      nears: { lamp: 3, palm: 2, billboard: 2, flag: 1, neem: 1 } },
    { key: 'wuse', name: 'Wuse 2', tag: 'Aminu Kano Crescent · night out', greet: 'Gbas gbos!',
      sky0: '#030309', sky1: '#09081d', sky2: '#170d31', sky3: '#3a1238', sun: '#f3efe0',
      hill2: '#1f1636', hill: '#110b20', far: '#1c1434', lit: '#ffd36b', mid: '#0f0a1c', pave: '#1d1a24', road: '#0f0e14', haze: '#ff2e63',
      sunY: 0.22, night: 1, stars: 1, hazeA: 0.16, windows: 0.62, neon: 1, dust: 0, cloud: 0.1,
      landmarks: ['millennium', 'cbd', 'mosque'], mids: ['tower', 'hotel', 'block', 'tower', 'hotel'],
      nears: { lamp: 3, billboard: 3, suya: 2, palm: 1 } },
    { key: 'zuma', name: 'Zuma Rock', tag: 'Harmattan haze · gateway to the capital', greet: 'Sai Abuja!',
      sky0: '#8a7660', sky1: '#bf9d70', sky2: '#e0bf8d', sky3: '#f4dcae', sun: '#fff6dc',
      hill2: '#c2a27c', hill: '#8e7052', far: '#977758', lit: '#ffe2a4', mid: '#5f4a38', pave: '#5a4a3e', road: '#2f2924', haze: '#ecd2a4',
      sunY: 0.45, night: 0, stars: 0, hazeA: 0.5, windows: 0.03, neon: 0, dust: 1, cloud: 0.2,
      landmarks: ['zuma', 'citygate', 'zuma', 'asorock'], mids: ['arewa', 'arewa', 'mast', 'block'],
      nears: { lamp: 2, neem: 3, pots: 2, suya: 1, billboard: 1 } }
  ];
  var CKEYS = ['sky0', 'sky1', 'sky2', 'sky3', 'sun', 'hill2', 'hill', 'far', 'lit', 'mid', 'pave', 'road', 'haze'];
  var NKEYS = ['sunY', 'night', 'stars', 'hazeA', 'windows', 'neon', 'dust', 'cloud'];
  ZONES.forEach(function (z) { z.c = {}; CKEYS.forEach(function (k) { z.c[k] = hex(z[k]); }); });

  function zoneInfo(d) {
    var f = Math.max(0, d) / ZONE_LEN, i = Math.floor(f), local = f - i;
    return { i: i, a: ZONES[i % 4], b: ZONES[(i + 1) % 4], t: smooth((local - 0.8) / 0.2) };
  }
  function blendZones(a, b, t) {
    var p = {};
    CKEYS.forEach(function (k) { p[k] = mix3(a.c[k], b.c[k], t); });
    NKEYS.forEach(function (k) { p[k] = lerp(a[k], b[k], t); });
    return p;
  }

  /* ------------------------------------------------------------------ cast */
  var FITS = {
    odumodu: { name: 'Odumodublvck', role: 'Power brawler', skin: '#4a2b1d', pants: '#111114', shoe: '#141416', sole: '#C81E1E', top: 'blvck', torso: '#141416', sleeve: '#141416', head: 'okpu', cap: '#C81E1E', chain: true, scale: 1.07,
      hp: 130, melee: 1.6, fireCD: 0.34, shot: '#ff4d4d', special: 'stomp', specialName: 'Capital Stomp', atlas: 'odumodu', spriteH: 104 },
    romie: { name: 'DJ Romie', role: 'Disc slinger', skin: '#3e2418', pants: '#141416', shoe: '#f4f4f4', sole: '#141416', top: 'blvck', torso: '#9a6a3a', sleeve: '#9a6a3a', head: 'cap', cap: '#141416', chain: false,
      hp: 120, melee: 1.3, fireCD: 0.27, shot: '#ffb347', shotKind: 'disc', special: 'wave', specialName: 'Beat Drop', atlas: 'romie', spriteH: 98 },
    psycho: { name: 'PsychoYP', role: 'Trap sharpshooter', skin: '#5b3524', pants: '#1b1b22', shoe: '#f4f4f4', sole: '#9b5cff', top: 'tee', torso: '#f2f2f2', sleeve: '#f2f2f2', head: 'fade', tattoo: true, chain: true,
      hp: 100, melee: 1, fireCD: 0.19, shot: '#b388ff', special: 'wave', specialName: 'YPSZN Wave' },
    ankara: { name: 'Ankara Drip', role: 'All-rounder', skin: '#5b3524', pants: '#17171d', shoe: '#f4f4f4', sole: GOLD, top: 'ankara', head: 'cap', cap: '#C81E1E', chain: true,
      hp: 110, melee: 1.2, fireCD: 0.26, shot: GOLD, special: 'truck', specialName: 'TCM Sound Truck' },
    eagles: { name: 'Super Eagles', role: 'Speed striker', skin: '#4a2b1d', pants: '#f2f2f2', shoe: '#111114', sole: '#00c46a', top: 'eagles', head: 'fade', socks: '#0b7d45',
      hp: 105, melee: 1.2, fireCD: 0.23, shot: '#00e07a', special: 'truck', specialName: 'TCM Sound Truck' },
    riga: { name: 'Babban Riga', role: 'Tank', skin: '#6a4029', pants: '#ece3cf', shoe: '#7a4a28', sole: '#3a2414', top: 'riga', head: 'hula', robe: '#f3ead6', embroid: '#c9a23a',
      hp: 125, melee: 1.35, fireCD: 0.29, shot: '#ffe089', special: 'truck', specialName: 'TCM Sound Truck' }
  };

  // The Vibe Killers: a made-up crew trying to cancel the city's party.
  var FOES = {
    grunt: { name: 'Vibe Killer', hp: 3, speed: 70, reach: 40, dmg: 12, wind: 0.42, cd: 1.1, score: 300,
      look: { skin: '#4a2b1d', pants: '#2a2238', shoe: '#111114', sole: '#7a3cff', top: 'goon', torso: '#3b2a5a', sleeve: '#3b2a5a', head: 'mask', mask: '#8a4dff', atlas: 'grunt', spriteH: 96 } },
    tout: { name: 'Flyer Tout', hp: 2, speed: 90, reach: 0, dmg: 10, wind: 0.5, cd: 1.8, score: 350, ranged: true,
      look: { skin: '#5b3524', pants: '#1d1a24', shoe: '#e8e8e8', sole: '#ff3b6b', top: 'tout', torso: '#c2185b', sleeve: '#c2185b', head: 'mask', mask: '#2a2238', atlas: 'tout', spriteH: 96 } },
    bouncer: { name: 'Fake Bouncer', hp: 8, speed: 45, reach: 46, dmg: 20, wind: 0.6, cd: 1.5, score: 800, heavy: true,
      look: { skin: '#3e2418', pants: '#101012', shoe: '#101012', sole: '#7a3cff', top: 'bouncer', torso: '#101012', sleeve: '#101012', head: 'mask', mask: '#8a4dff', scale: 1.3, atlas: 'bouncer', spriteH: 124 } }
  };

  // Weapon medallions dropped by capsules, bags and bosses.
  var WEAPONS = {
    S: { name: 'Spread Bars', cd: 0.3, dmg: 1, color: '#ffd23f' },
    M: { name: 'Machine Flow', cd: 0.085, dmg: 0.6, color: '#7cc9ff' },
    L: { name: 'Laser Verse', cd: 0.4, dmg: 2.2, color: '#ff3b6b' },
    F: { name: 'Fire Bars', cd: 0.42, dmg: 3, color: '#ff8a1a' }
  };
  var WEAPON_TIME = 18;
  var WKEYS = ['S', 'M', 'L', 'F'];

  // One boss at the end of each district.
  var BOSSES = [
    { kind: 'gen', name: 'Big Gen', sub: 'I Better Pass My Neighbour', hp: 70, shot: 'smoke' },
    { kind: 'tower', name: 'DJ Off-Beat', sub: 'One noise complaint on wheels', hp: 80, shot: 'wave' },
    { kind: 'gen', name: 'Big Gen Mk II', sub: 'Double tank, zero manners', hp: 95, shot: 'smoke', tint: 1 },
    { kind: 'tower', name: 'DJ Off-Beat · Harmattan Remix', sub: 'The drop that never drops', hp: 110, shot: 'wave', tint: 1 }
  ];
  var GLOW = { jollof: '#ff8a3a', cash: '#3ddc84', backup: GOLD, capsule: '#ffffff', wS: '#ffd23f', wM: '#7cc9ff', wL: '#ff3b6b', wF: '#ff8a1a' };

  var OBS = {
    taxi:    { w: 112, h: 56, low: false, vx: 0.3,  say: ['Taxi no send you!', 'Shine your eye!', 'Drop!'] },
    keke:    { w: 74,  h: 60, low: false, vx: 0.14, say: ['Keke don jam you!', 'Na keke o!'] },
    ruwa:    { w: 96,  h: 58, low: false, vx: 0.03, say: ['Mai ruwa! Sorry o!', 'Water don pour!'] },
    cone:    { w: 26,  h: 30, low: true,  vx: 0,    say: ['Shine your eye!', 'Wahala!'] },
    barrier: { w: 56,  h: 30, low: true,  vx: 0,    say: ['Barrier wahala!', 'Kai!'] },
    ram:     { w: 54,  h: 38, low: true,  vx: 0.06, say: ['Sallah ram don butt you!', 'Ram no dey joke!'] },
    gutter:  { w: 58,  h: 6,  low: true,  vx: 0,    say: ['Gutter wahala!', 'Pothole o!'] },
    bag:     { w: 48,  h: 34, low: true,  vx: 0,    say: [], breakable: true }
  };
  var HIGH = ['taxi', 'taxi', 'keke', 'ruwa'];
  var LOW = ['cone', 'barrier', 'ram', 'gutter', 'barrier'];

  var POWERS = {
    shield: { label: 'Agbada Armour', dur: 0,  color: GOLD },
    magnet: { label: 'DJ Magnet',     dur: 9,  color: '#7cc9ff' },
    x2:     { label: 'Owambe x2',     dur: 10, color: '#3ddc84' },
    rush:   { label: 'Gbas Gbos Rush', dur: 5, color: '#00c46a' }
  };

  var CHEERS = ['Oshey!', 'Yawwa!', 'Gbas!', 'E choke!', 'Na so!', 'Omo!', 'Kai!', 'Sharp sharp!', 'Soft life!', 'Odogwu!'];
  var BILLBOARDS = [
    ['WE MOVE', 'CULTURE', 'red'], ['THE CAPITAL', 'MOVEMENT', 'red'], ['SUYA', '24/7 · WUSE', 'green'],
    ['ABUJA NO DEY', 'CARRY LAST', 'green'], ['CAPITAL', 'BLOCK PARTY', 'gold'], ['FESTIVAL', 'OF LIGHTS', 'gold'],
    ['SANNU DA', 'ZUWA', 'green'], ['OYA,', 'MOVE!', 'red'], ['DETTY', 'DECEMBER', 'gold'], ['JABI LAKE', 'THIS WEEKEND', 'green']
  ];
  var RANKS = [
    [0, 'JJC', 'Johnny Just Come. Abuja go teach you sense — oya, try again.'],
    [250, 'Kubwa Commuter', 'You survived the expressway. Respect.'],
    [600, 'Wuse Market Hustler', 'Small small, you dey get there.'],
    [1000, 'Jabi Lake Regular', 'The city is starting to know your face.'],
    [1600, 'Maitama Big Shot', 'Na you dey run the place now.'],
    [2400, 'Asokoro Royalty', 'Gate men salute when you pass.'],
    [3500, 'Oga At The Top', 'Capital no dey carry last. You don move the whole city.']
  ];

  /* ------------------------------------------------------------------ textures */
  var ankaraTex = (function () {
    var c = document.createElement('canvas'); c.width = c.height = 48; var g = c.getContext('2d');
    g.fillStyle = '#e8572a'; g.fillRect(0, 0, 48, 48);
    [[0, 0], [48, 0], [0, 48], [48, 48], [24, 24]].forEach(function (p) {
      g.fillStyle = '#0f7a74'; g.beginPath(); g.moveTo(p[0], p[1] - 15); g.lineTo(p[0] + 15, p[1]); g.lineTo(p[0], p[1] + 15); g.lineTo(p[0] - 15, p[1]); g.closePath(); g.fill();
      g.fillStyle = '#f4c430'; g.beginPath(); g.arc(p[0], p[1], 6.5, 0, 7); g.fill();
      g.fillStyle = '#1b1b22'; g.beginPath(); g.arc(p[0], p[1], 2.6, 0, 7); g.fill();
    });
    g.strokeStyle = '#1b1b22'; g.lineWidth = 2;
    [[24, 0], [0, 24], [48, 24], [24, 48]].forEach(function (p) {
      g.beginPath(); g.arc(p[0], p[1], 7, 0, 7); g.stroke();
      g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(p[0], p[1], 3, 0, 7); g.fill();
    });
    return c;
  })();
  try { stage.style.setProperty('--rtc-ankara', 'url(' + ankaraTex.toDataURL() + ')'); } catch (e) { /* tainted or unsupported */ }

  var roadTex = (function () {
    var c = document.createElement('canvas'); c.width = 256; c.height = 128; var g = c.getContext('2d');
    for (var i = 0; i < 700; i++) {
      var a = Math.random();
      g.fillStyle = a > 0.5 ? 'rgba(255,255,255,' + (0.02 + Math.random() * 0.05) + ')' : 'rgba(0,0,0,' + (0.08 + Math.random() * 0.12) + ')';
      g.fillRect(Math.random() * 256, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 1.5);
    }
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
    for (var j = 0; j < 4; j++) { g.beginPath(); var x = Math.random() * 256, y = Math.random() * 128; g.moveTo(x, y); g.lineTo(x + rand(8, 30), y + rand(-6, 6)); g.lineTo(x + rand(20, 50), y + rand(-8, 8)); g.stroke(); }
    return c;
  })();
  var roadPat = ctx.createPattern(roadTex, 'repeat');

  /* ------------------------------------------------------------------ the runner */
  function shade(hexc, f) { var a = hex(hexc); return C(f < 0 ? mix3(a, BLACK, -f) : mix3(a, WHITE, f)); }

  function limb(g, x0, y0, a1, l1, a2, l2, w, c1, c2) {
    var x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1;
    var x2 = x1 + Math.sin(a2) * l2, y2 = y1 + Math.cos(a2) * l2;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = c1; g.lineWidth = w;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
    if (!c2) { g.lineTo(x2, y2); g.stroke(); }
    else { g.stroke(); g.strokeStyle = c2; g.lineWidth = w * 0.82; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    return [x2, y2];
  }

  function dagi(g, x, y, r, col, lw) {
    g.save(); g.translate(x, y); g.strokeStyle = col; g.lineWidth = lw || 1;
    g.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
    g.rotate(Math.PI / 4); g.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4);
    g.rotate(-Math.PI / 4);
    for (var i = 0; i < 4; i++) { var a = i * Math.PI / 2; g.beginPath(); g.arc(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, r * 0.28, 0, 7); g.stroke(); }
    g.restore();
  }

  /* ------------------------------------------------------------------ sprite atlases
     Generated pixel-art characters (js/rtc-sprites.js). Each atlas is one row per animation,
     frames left to right, facing right; meta gives the cell size, the feet anchor and the
     standing height. Anything without a loaded atlas falls back to the procedural figure. */
  var SPR = {};
  (function loadAtlases() {
    var list = window.RTC_SPRITES || {};
    Object.keys(list).forEach(function (key) {
      var rec = { img: new Image(), meta: list[key].meta, ready: false };
      rec.img.onload = function () { rec.ready = true; };
      rec.img.src = list[key].src;
      SPR[key] = rec;
    });
  })();
  var IMG = {};
  (function loadImages() {
    var list = window.RTC_IMAGES || {};
    Object.keys(list).forEach(function (key) {
      var rec = { img: new Image(), ready: false };
      rec.img.onload = function () { rec.ready = true; if (typeof paintIcons === 'function') paintIcons(document); };
      rec.img.src = list[key];
      IMG[key] = rec;
    });
  })();
  function imgReady(key) { return !!(IMG[key] && IMG[key].ready); }
  function atlasReady(key) { return !!(key && SPR[key] && SPR[key].ready); }
  function drawAtlas(g, key, anim, prog, designH) {
    var r = SPR[key], m = r.meta, a = m.anims[anim] || m.anims.run;
    var f = Math.min(a.n - 1, Math.max(0, Math.floor(prog * a.n)));
    var s = designH / m.height, cw = m.cell[0], ch = m.cell[1];
    var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
    g.drawImage(r.img, f * cw, a.row * ch, cw, ch, -m.anchor[0] * s, -m.anchor[1] * s, cw * s, ch * s);
    g.imageSmoothingEnabled = sm;
  }
  // Picks the animation and frame for a pose. `prog` is 0..1 through a one-shot (jump, shot, punch).
  function drawSpriteFigure(g, key, ph, air, pose, prog, designH) {
    var m = SPR[key].meta, A = m.anims, anim = 'run', t = ((ph / (Math.PI * 2)) % 1 + 1) % 1;
    if (pose === 'shoot' && A.shoot) { anim = 'shoot'; t = prog; }
    else if ((pose === 'punch' || pose === 'kick') && A.combo) { anim = 'combo'; t = pose === 'kick' ? 0.55 + prog * 0.45 : prog * 0.5; }
    else if (pose === 'punch' && A.attack) { anim = 'attack'; t = 0.35 + prog * 0.65; }
    else if (pose === 'wind' && A.attack) { anim = 'attack'; t = 0.05 + Math.min(1, prog) * 0.3; }
    else if (pose === 'stance' || pose === 'hurt') { anim = A.shoot ? 'shoot' : 'run'; t = 0; }
    else if (air && A.jump) { anim = 'jump'; t = prog; }
    drawAtlas(g, key, anim, t, designH);
  }

  // Origin is between the feet; the figure faces +x. Units are design pixels (~72 tall).
  // `look` is a FITS key or a look object. `pose`: run (default), stance, punch, kick, shoot, wind, hurt.
  function drawRunner(g, look, ph, air, t, pose, prog) {
    var F = typeof look === 'string' ? (FITS[look] || FITS.ankara) : look;
    pose = pose || 'run';
    if (atlasReady(F.atlas)) {
      if (pose === 'hurt') { g.save(); g.rotate(-0.18); drawSpriteFigure(g, F.atlas, ph, air, pose, prog || 0, F.spriteH || 84); g.restore(); }
      else drawSpriteFigure(g, F.atlas, ph, air, pose, prog || 0, F.spriteH || 84);
      return;
    }
    g.save();
    if (F.scale) g.scale(F.scale, F.scale);
    var still = pose !== 'run', hurt = pose === 'hurt';
    var lean = hurt ? -0.28 : air ? 0.06 : pose === 'wind' ? -0.12 : still ? 0.05 : 0.15;
    var bob = air || still ? 0 : -Math.abs(Math.cos(ph)) * 3;
    var hx = 0, hy = -34 + bob;
    var sx = hx + Math.sin(lean) * 22, sy = hy - Math.cos(lean) * 22;
    var riga = F.top === 'riga';

    function leg(p, far) {
      var a, bend;
      if (pose === 'kick' && !far) { a = 1.5; bend = 0.05; }
      else if (air) { a = far ? 1.0 : -0.35; bend = far ? 1.7 : 0.9; }
      else if (still) { a = far ? -0.32 : 0.34 + Math.sin(t * 6) * 0.03; bend = 0.35; }
      else { a = Math.sin(p) * 0.85; bend = 0.25 + Math.max(0, Math.cos(p)) * 1.35; }
      var pc = far ? shade(F.pants, -0.3) : F.pants;
      var sockC = F.socks ? (far ? shade(F.socks, -0.3) : F.socks) : null;
      var end = limb(g, hx, hy, a, 17, a - bend, 17, 7, pc, sockC);
      g.save(); g.translate(end[0], end[1]); g.rotate(-(a - bend) * 0.6);
      g.fillStyle = far ? shade(F.shoe, -0.3) : F.shoe; rr(g, -3.5, -3, 12, 5.5, 2.5); g.fill();
      g.fillStyle = F.sole; g.fillRect(-3.5, 1.4, 12, 1.6);
      g.restore();
    }
    function arm(p, far) {
      var a, a2;
      if (!far && (pose === 'punch' || pose === 'shoot')) { a = 1.57; a2 = 1.6; }
      else if (!far && pose === 'wind') { a = -1.0; a2 = 0.5; }
      else if (hurt) { a = far ? -2.6 : 2.5; a2 = a + 0.4; }
      else if (still) { a = far ? 0.9 : 0.7; a2 = a + 1.7; }
      else if (air) { a = far ? -2.4 : 2.2; a2 = a + 0.6; }
      else { a = -Math.sin(p) * 0.85; a2 = a + 1.5; }
      var sleeve = F.sleeve || (F.top === 'eagles' ? '#0b7d45' : riga ? F.robe : '#e8572a');
      if (far) sleeve = shade(sleeve, -0.3);
      var skin = far ? shade(F.skin, -0.25) : F.skin;
      var ex = sx + Math.sin(a) * 12, ey = sy + 2 + Math.cos(a) * 12;
      var end = limb(g, sx, sy + 2, a, 12, a2, 11, riga ? 7 : 5.5, sleeve, skin);
      if (F.tattoo) {
        g.strokeStyle = 'rgba(25,12,10,0.8)'; g.lineWidth = 0.9;
        for (var i = 1; i < 4; i++) {
          var f = i / 4.2, tx = ex + (end[0] - ex) * f, ty = ey + (end[1] - ey) * f;
          g.beginPath(); g.moveTo(tx - Math.cos(a2) * 2, ty + Math.sin(a2) * 2); g.lineTo(tx + Math.cos(a2) * 2, ty - Math.sin(a2) * 2); g.stroke();
        }
      }
      if (!far && pose === 'shoot') {
        g.save(); g.translate(end[0], end[1]); g.rotate(Math.PI / 2 - a2);
        g.fillStyle = '#1a1a1f'; rr(g, -1, -2.2, 9, 4.4, 2); g.fill();
        g.fillStyle = '#b9bcc2'; g.beginPath(); g.arc(9, 0, 3.4, 0, 7); g.fill();
        g.restore();
      }
    }

    arm(ph + Math.PI, true);
    leg(ph + Math.PI, true);
    leg(ph, false);

    // torso
    g.save(); g.translate(hx, hy); g.rotate(lean);
    if (riga) {
      var fl = Math.sin(t * 14) * 3;
      g.fillStyle = F.robe;
      g.beginPath(); g.moveTo(-9, -24); g.lineTo(9, -24); g.lineTo(13, 14); g.quadraticCurveTo(0, 17, -16 - fl, 15); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1; g.stroke();
      g.strokeStyle = F.embroid; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-4, -24); g.lineTo(0, -16); g.lineTo(4, -24); g.stroke();
      dagi(g, 0, -9, 3.6, F.embroid, 1);
      g.beginPath(); g.moveTo(-14 - fl * 0.6, 11); g.lineTo(12, 11); g.stroke();
    } else {
      if (F.top === 'ankara') { var pat = g.createPattern(ankaraTex, 'repeat'); g.fillStyle = pat; }
      else g.fillStyle = F.torso || '#0b8a4a';
      g.save(); g.scale(0.5, 0.5); rr(g, -15, -50, 30, 54, 10); g.fill(); g.restore();
      if (F.top === 'eagles') {
        g.strokeStyle = '#ffffff'; g.lineWidth = 1.4;
        for (var c = 0; c < 3; c++) { g.beginPath(); g.moveTo(-6, -16 + c * 5); g.lineTo(0, -12 + c * 5); g.lineTo(6, -16 + c * 5); g.stroke(); }
        g.fillStyle = '#ffffff'; g.font = '700 6px "Inter Tight", sans-serif'; g.fillText('9', -2, -5);
      } else if (F.top === 'blvck') {
        g.fillStyle = '#C81E1E'; g.fillRect(-7.5, -11, 15, 1.8);
      } else if (F.top === 'goon' || F.top === 'bouncer') {
        g.strokeStyle = F.mask; g.lineWidth = 1.4; g.beginPath(); g.arc(0, -13, 4.2, 0, 7); g.stroke();
        g.beginPath(); g.moveTo(-4, -9); g.lineTo(4, -17); g.stroke();
      } else if (F.top === 'tout') {
        g.fillStyle = '#ffd23f';
        for (var dd = 0; dd < 6; dd++) { g.beginPath(); g.arc(-5 + (dd % 3) * 5, -18 + ((dd / 3) | 0) * 8, 1.3, 0, 7); g.fill(); }
      }
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-7.5, -2, 15, 3);
      if (F.chain) { g.strokeStyle = GOLD; g.lineWidth = 1.3; g.beginPath(); g.arc(1, -22, 5.5, 0.2, Math.PI - 0.2); g.stroke(); g.fillStyle = GOLD; g.beginPath(); g.arc(1, -16, 1.6, 0, 7); g.fill(); }
    }
    g.restore();

    // head
    var hcx = sx + Math.sin(lean) * 9, hcy = sy - Math.cos(lean) * 9;
    g.fillStyle = shade(F.skin, -0.1); g.fillRect(sx - 2, sy - 6, 4.5, 6);
    g.fillStyle = F.skin; g.beginPath(); g.arc(hcx, hcy, 7.6, 0, 7); g.fill();
    g.fillStyle = shade(F.skin, -0.2); g.beginPath(); g.arc(hcx - 2.5, hcy + 0.5, 1.8, 0, 7); g.fill();
    if (F.head === 'cap') {
      g.fillStyle = F.cap; g.beginPath(); g.arc(hcx, hcy - 1.5, 7.8, Math.PI, 0); g.fill();
      rr(g, hcx + 2, hcy - 3.5, 10, 2.6, 1.2); g.fill();
      g.fillStyle = '#fff'; g.fillRect(hcx - 2, hcy - 7, 3, 1.2);
    } else if (F.head === 'hula') {
      g.fillStyle = '#fbf7ee'; rr(g, hcx - 7.6, hcy - 15, 15.2, 12, 3); g.fill();
      g.strokeStyle = '#c0392b'; g.lineWidth = 1; g.beginPath(); g.moveTo(hcx - 7, hcy - 11); g.lineTo(hcx + 7, hcy - 11); g.stroke();
      g.strokeStyle = NG_GREEN; g.beginPath(); g.moveTo(hcx - 7, hcy - 7); g.lineTo(hcx + 7, hcy - 7); g.stroke();
      g.fillStyle = '#c9a23a'; for (var d = -5; d <= 5; d += 3.3) { g.beginPath(); g.arc(hcx + d, hcy - 9, 0.9, 0, 7); g.fill(); }
    } else if (F.head === 'okpu') {
      // red Okpu Agu cap with a patterned band
      g.fillStyle = F.cap;
      g.beginPath(); g.moveTo(hcx - 8.2, hcy - 3); g.lineTo(hcx - 7.6, hcy - 13); g.quadraticCurveTo(hcx, hcy - 18, hcx + 7.6, hcy - 13); g.lineTo(hcx + 8.2, hcy - 3); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.28)'; [[-2, -11, 1.3], [3, -13.5, 1.1], [4.5, -8.6, 1], [-5, -8, 0.9]].forEach(function (s) { g.beginPath(); g.arc(hcx + s[0], hcy + s[1], s[2], 0, 7); g.fill(); });
      g.fillStyle = '#141416'; g.fillRect(hcx - 8.2, hcy - 6, 16.4, 3);
      g.fillStyle = '#f3ead6'; for (var o2 = -6; o2 <= 6; o2 += 3) { g.beginPath(); g.arc(hcx + o2, hcy - 4.5, 0.8, 0, 7); g.fill(); }
    } else if (F.head === 'mask') {
      g.fillStyle = F.mask; g.beginPath(); g.arc(hcx, hcy - 0.5, 8.1, Math.PI * 0.82, Math.PI * 2.18); g.closePath(); g.fill();
    } else {
      g.fillStyle = '#111'; g.beginPath(); g.arc(hcx - 0.5, hcy - 1.5, 7.9, Math.PI * 0.95, Math.PI * 2.05); g.fill();
    }
    if (F.head === 'mask') {
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(hcx + 1.5, hcy - 3.4); g.lineTo(hcx + 8, hcy - 1.6); g.lineTo(hcx + 2, hcy - 0.6); g.closePath(); g.fill();
    } else {
      g.fillStyle = '#0b0b0e'; rr(g, hcx + 1.5, hcy - 2.2, 7.5, 3.4, 1.4); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(hcx + 3, hcy - 1.8, 2.5, 0.9);
    }

    arm(ph, false);
    g.restore();
  }

  /* ------------------------------------------------------------------ icons & items */
  function drawIcon(g, type, t) {
    t = t || 0;
    g.save();
    if (EXTRA_ICONS[type]) { EXTRA_ICONS[type](g, t); g.restore(); return; }
    if (type === 'suya') {
      g.rotate(-0.55);
      g.strokeStyle = '#d8b47a'; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-17, 0); g.lineTo(17, 0); g.stroke();
      for (var i = 0; i < 4; i++) {
        var x = -12 + i * 7.4;
        g.fillStyle = '#6e2c12'; rr(g, x - 3.6, -4.6, 7.2, 9.2, 2.4); g.fill();
        g.fillStyle = '#a24a22'; rr(g, x - 3, -4, 4, 3.6, 1.5); g.fill();
        g.fillStyle = '#e0562a'; g.fillRect(x - 1.5, 0.6, 1.4, 1.4); g.fillRect(x + 1.2, -1.8, 1.2, 1.2);
        g.fillStyle = '#f3b24a'; g.fillRect(x - 0.2, 2.2, 1, 1);
      }
      g.strokeStyle = '#d58fd8'; g.lineWidth = 1.4; g.beginPath(); g.arc(15, 0, 3, 0, 7); g.stroke();
    } else if (type === 'zobo') {
      var gr = g.createLinearGradient(-6, 0, 6, 0); gr.addColorStop(0, '#5b0a20'); gr.addColorStop(0.5, '#a8143c'); gr.addColorStop(1, '#5b0a20');
      g.fillStyle = gr; rr(g, -6.5, -11, 13, 24, 4); g.fill();
      g.fillStyle = '#f2f2f2'; rr(g, -4, -16, 8, 5, 1.5); g.fill();
      g.fillStyle = NG_GREEN; g.fillRect(-6.5, -3, 13, 7);
      g.fillStyle = '#fff'; g.font = '800 5px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.fillText('ZOBO', 0, 2.6);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-4, -9, 1.6, 16);
    } else if (type === 'shield') {
      var ag = g.createLinearGradient(0, -14, 0, 14); ag.addColorStop(0, '#ffe58a'); ag.addColorStop(1, '#b8860b');
      g.fillStyle = ag;
      g.beginPath(); g.moveTo(-5, -13); g.lineTo(5, -13); g.lineTo(18, -6); g.lineTo(16, 13); g.lineTo(-16, 13); g.lineTo(-18, -6); g.closePath(); g.fill();
      g.strokeStyle = '#fff6d0'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-5, -13); g.lineTo(0, -6); g.lineTo(5, -13); g.stroke();
      dagi(g, 0, 3, 4, '#fff6d0', 1.1);
    } else if (type === 'magnet') {
      g.fillStyle = '#1a1a20'; rr(g, -10, -13, 20, 26, 3); g.fill();
      g.strokeStyle = '#3a3a44'; g.lineWidth = 1; g.stroke();
      g.fillStyle = '#5a5a66'; g.beginPath(); g.arc(0, 4, 6.5, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(0, 4, 2.6, 0, 7); g.fill();
      g.fillStyle = '#7cc9ff'; g.beginPath(); g.arc(0, -7, 2.6, 0, 7); g.fill();
      g.strokeStyle = '#7cc9ff'; g.lineWidth = 1.6; g.lineCap = 'round';
      for (var w = 0; w < 2; w++) { var p = (t * 2 + w * 0.5) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.arc(4, 0, 12 + p * 8, -0.6, 0.6); g.stroke(); }
      g.globalAlpha = 1;
    } else if (type === 'x2') {
      g.rotate(-0.12);
      g.fillStyle = '#1f6e43'; rr(g, -15, -6, 30, 16, 2); g.fill();
      g.fillStyle = '#2e8b57'; rr(g, -14, -9, 28, 16, 2); g.fill();
      g.strokeStyle = '#a7e3bf'; g.lineWidth = 1; rr(g, -12, -7, 24, 12, 1.5); g.stroke();
      g.fillStyle = '#fff'; g.font = '900 10px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₦', 0, -0.5);
      g.fillStyle = RED; g.beginPath(); g.arc(13, -10, 6.5, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.font = '900 6.5px "Inter Tight", sans-serif'; g.fillText('x2', 13, -9.6);
    } else if (type === 'rush') {
      g.fillStyle = '#00c46a'; g.strokeStyle = '#ffffff'; g.lineWidth = 1.6; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(3, -15); g.lineTo(-9, 2); g.lineTo(-1, 2); g.lineTo(-4, 15); g.lineTo(9, -3); g.lineTo(1, -3); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }

  /* ------------------------------------------------------------------ obstacles
     Origin is the centre of the footprint on the road; vehicles face left (oncoming). */
  function wheel(g, x, y, r, t) {
    g.fillStyle = '#0d0d10'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = '#b9bcc2'; g.beginPath(); g.arc(x, y, r * 0.45, 0, 7); g.fill();
    g.strokeStyle = '#6b6f76'; g.lineWidth = 1;
    for (var i = 0; i < 3; i++) { var a = -t * 14 + i * 2.09; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); g.stroke(); }
  }
  function beam(g, x, y, len, night) {
    if (night < 0.25) return;
    g.save(); g.globalCompositeOperation = 'lighter';
    var gr = g.createLinearGradient(x, y, x - len, y);
    gr.addColorStop(0, 'rgba(255,236,170,' + (0.4 * night) + ')'); gr.addColorStop(1, 'rgba(255,236,170,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x - len, y - 22); g.lineTo(x - len, y + 14); g.closePath(); g.fill();
    g.restore();
  }

  function drawObstacle(g, type, t, night, seed) {
    if (type === 'taxi') {
      beam(g, -56, -22, 190, night);
      g.fillStyle = 'rgba(0,0,0,0.85)'; g.fillRect(-57, -14, 114, 5);
      var bg = g.createLinearGradient(0, -52, 0, -8); bg.addColorStop(0, '#34b66d'); bg.addColorStop(1, '#0f5c33');
      g.fillStyle = bg;
      g.beginPath(); g.moveTo(-56, -10); g.lineTo(-56, -24); g.quadraticCurveTo(-55, -31, -45, -32); g.lineTo(-30, -34);
      g.lineTo(-18, -51); g.lineTo(22, -51); g.lineTo(37, -34); g.lineTo(51, -32); g.quadraticCurveTo(57, -30, 56, -22); g.lineTo(56, -10); g.closePath(); g.fill();
      g.fillStyle = '#f4f4f0'; g.fillRect(-56, -24, 112, 6);
      g.fillStyle = '#121214';
      for (var i = 0; i < 28; i++) g.fillRect(-56 + i * 4, -24 + (i % 2) * 3, 4, 3);
      g.fillStyle = 'rgba(150,198,230,0.85)';
      g.beginPath(); g.moveTo(-16, -48); g.lineTo(-1, -48); g.lineTo(-1, -35); g.lineTo(-26, -35); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(3, -48); g.lineTo(20, -48); g.lineTo(31, -35); g.lineTo(3, -35); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.moveTo(-12, -47); g.lineTo(-7, -47); g.lineTo(-16, -36); g.lineTo(-20, -36); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(1, -50); g.lineTo(1, -11); g.stroke();
      g.fillStyle = '#ffd23f'; rr(g, -8, -58, 18, 7, 2); g.fill();
      g.fillStyle = '#111'; g.font = '900 5px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.fillText('TAXI', 1, -52.6);
      g.fillStyle = night > 0.3 ? '#fff6c8' : '#f0e6b0'; rr(g, -57, -27, 5, 4, 1.5); g.fill();
      g.fillStyle = '#d4202c'; g.fillRect(53, -28, 3, 5);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '800 4.5px "JetBrains Mono", monospace'; g.fillText('FCT · ABJ', 30, -14);
      wheel(g, -34, -8, 9, t); wheel(g, 34, -8, 9, t);
    } else if (type === 'keke') {
      beam(g, -36, -30, 140, night);
      g.fillStyle = '#f5c518'; rr(g, -30, -62, 64, 7, 3); g.fill();
      g.fillStyle = NG_GREEN; g.fillRect(-30, -56, 64, 2.5);
      g.strokeStyle = '#1b1b1f'; g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(-24, -55); g.lineTo(-26, -40); g.moveTo(31, -55); g.lineTo(31, -24); g.stroke();
      g.fillStyle = 'rgba(160,205,235,0.55)'; g.beginPath(); g.moveTo(-27, -55); g.lineTo(-21, -55); g.lineTo(-24, -42); g.lineTo(-30, -42); g.closePath(); g.fill();
      g.fillStyle = '#f5c518';
      g.beginPath(); g.moveTo(-37, -12); g.lineTo(-35, -34); g.quadraticCurveTo(-32, -44, -22, -44); g.lineTo(-18, -44); g.lineTo(-18, -12); g.closePath(); g.fill();
      rr(g, -20, -40, 56, 28, 4); g.fill();
      g.fillStyle = 'rgba(20,16,24,0.85)'; rr(g, -13, -38, 40, 13, 2); g.fill();
      g.fillStyle = '#3a2a22'; g.beginPath(); g.arc(-4, -32, 4, 0, 7); g.arc(9, -31, 4, 0, 7); g.arc(21, -32, 3.6, 0, 7); g.fill();
      g.fillStyle = NG_GREEN; g.fillRect(-37, -22, 73, 3);
      g.fillStyle = '#2a1d16'; g.beginPath(); g.arc(-16, -47, 4.2, 0, 7); g.fill();
      g.fillStyle = night > 0.3 ? '#fff6c8' : '#f6f0d0'; g.beginPath(); g.arc(-35, -30, 2.6, 0, 7); g.fill();
      g.fillStyle = '#111'; g.font = '800 5px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText('NAPEP', 8, -15);
      wheel(g, -28, -7, 7, t); wheel(g, 24, -8, 8, t);
    } else if (type === 'ruwa') {
      var walk = Math.sin(t * 9);
      g.strokeStyle = '#3d2a1c'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(40, -30); g.lineTo(40 + walk * 6, 0); g.moveTo(40, -30); g.lineTo(40 - walk * 6, 0); g.stroke();
      g.fillStyle = '#7fb3d5'; g.beginPath(); g.moveTo(34, -52); g.lineTo(46, -52); g.lineTo(49, -24); g.lineTo(31, -24); g.closePath(); g.fill();
      g.strokeStyle = '#6a4029'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(35, -46); g.lineTo(24, -36); g.stroke();
      g.fillStyle = '#6a4029'; g.beginPath(); g.arc(39, -58, 6, 0, 7); g.fill();
      g.fillStyle = '#f5f1e6'; rr(g, 33, -66, 12, 6, 2); g.fill();
      g.strokeStyle = '#5a3a1e'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(14, -22); g.lineTo(30, -34); g.stroke();
      g.fillStyle = '#7a4a26'; g.fillRect(-46, -24, 62, 6);
      var cols = ['#f2c230', '#e3b021', '#f2c230', '#2c6db5', '#f2c230'];
      for (var j = 0; j < 5; j++) {
        g.fillStyle = cols[(j + (seed | 0)) % 5]; rr(g, -45 + j * 12, -43, 11, 19, 2.4); g.fill();
        g.fillStyle = '#1b1b1f'; g.fillRect(-42 + j * 12, -46, 4, 3);
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-43 + j * 12, -40, 2, 13);
      }
      for (var k = 0; k < 3; k++) {
        g.fillStyle = cols[(k + 2 + (seed | 0)) % 5]; rr(g, -38 + k * 13, -61, 11, 18, 2.4); g.fill();
        g.fillStyle = '#1b1b1f'; g.fillRect(-35 + k * 13, -64, 4, 3);
      }
      wheel(g, -28, -9, 9, t); wheel(g, 4, -9, 9, t);
    } else if (type === 'cone') {
      g.fillStyle = '#c4430e'; g.fillRect(-13, -3, 26, 3);
      g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(-10, -3); g.lineTo(-3.5, -30); g.lineTo(3.5, -30); g.lineTo(10, -3); g.closePath(); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-7.4, -10); g.lineTo(-5.9, -16); g.lineTo(5.9, -16); g.lineTo(7.4, -10); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(-5, -20); g.lineTo(-4.2, -24); g.lineTo(4.2, -24); g.lineTo(5, -20); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.moveTo(2, -30); g.lineTo(3.5, -30); g.lineTo(10, -3); g.lineTo(5, -3); g.closePath(); g.fill();
    } else if (type === 'barrier') {
      g.save();
      g.beginPath(); g.moveTo(-28, 0); g.lineTo(-28, -6); g.lineTo(-21, -12); g.lineTo(-17, -30); g.lineTo(17, -30); g.lineTo(21, -12); g.lineTo(28, -6); g.lineTo(28, 0); g.closePath();
      g.fillStyle = '#f2c230'; g.fill(); g.clip();
      g.fillStyle = '#141416';
      for (var s = -60; s < 60; s += 14) { g.beginPath(); g.moveTo(s, 0); g.lineTo(s + 7, 0); g.lineTo(s + 37, -32); g.lineTo(s + 30, -32); g.closePath(); g.fill(); }
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(-30, -8, 60, 8);
      g.restore();
      g.fillStyle = RED; g.beginPath(); g.arc(0, -33, 2.4, 0, 7); g.fill();
    } else if (type === 'ram') {
      var st = Math.sin(t * 8);
      g.strokeStyle = '#3a2a22'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-10, -16); g.lineTo(-10 + st * 4, 0); g.moveTo(-4, -16); g.lineTo(-4 - st * 4, 0);
      g.moveTo(10, -16); g.lineTo(10 - st * 4, 0); g.moveTo(16, -16); g.lineTo(16 + st * 4, 0); g.stroke();
      g.fillStyle = '#efe9dc'; ell(g, 3, -24, 19, 11); g.fill();
      g.fillStyle = '#ddd4c2';
      for (var q = 0; q < 7; q++) { g.beginPath(); g.arc(-12 + q * 5, -31 + (q % 2) * 3, 3.4, 0, 7); g.fill(); }
      g.fillStyle = '#efe9dc'; g.beginPath(); g.arc(21, -27, 3, 0, 7); g.fill();
      g.fillStyle = '#3a2a22'; ell(g, -18, -29, 7.5, 5.5, -0.4); g.fill();
      g.strokeStyle = '#c9b48a'; g.lineWidth = 3.4; g.beginPath(); g.arc(-15, -33, 5.5, -0.5, Math.PI * 1.6); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-21, -31, 1.1, 0, 7); g.fill();
      g.fillStyle = NG_GREEN; g.fillRect(-12, -27, 3, 7);
    } else if (type === 'bag') {
      drawBag(g);
    } else if (type === 'gutter') {
      g.fillStyle = '#5b5b62'; ell(g, 0, -1, 30, 7.5); g.fill();
      g.fillStyle = '#050507'; ell(g, 0, -1, 27, 5.6); g.fill();
      g.fillStyle = 'rgba(120,170,200,0.35)'; ell(g, 4, 0, 14, 1.8); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-30, -1); g.lineTo(-38, 2); g.moveTo(28, -2); g.lineTo(36, -5); g.stroke();
    }
  }

  /* ------------------------------------------------------------------ fight art */
  function drawBag(g) {
    g.save(); rr(g, -24, -32, 48, 32, 4); g.clip();
    g.fillStyle = '#f2efe6'; g.fillRect(-24, -32, 48, 32);
    for (var bx = -24; bx < 24; bx += 12) { g.fillStyle = 'rgba(200,30,40,0.75)'; g.fillRect(bx, -32, 5, 32); g.fillStyle = 'rgba(30,70,160,0.65)'; g.fillRect(bx + 6, -32, 3, 32); }
    for (var by = -32; by < 0; by += 10) { g.fillStyle = 'rgba(200,30,40,0.5)'; g.fillRect(-24, by, 48, 4); g.fillStyle = 'rgba(30,70,160,0.45)'; g.fillRect(-24, by + 5, 48, 2); }
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(12, -32, 12, 32);
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; rr(g, -24, -32, 48, 32, 4); g.stroke();
    g.fillStyle = '#2a2a30'; g.fillRect(-20, -33, 40, 2.4);
    g.strokeStyle = '#3a2a22'; g.lineWidth = 2.4;
    g.beginPath(); g.arc(-8, -33, 6, Math.PI, 0); g.stroke(); g.beginPath(); g.arc(8, -33, 6, Math.PI, 0); g.stroke();
  }

  function medallion(g, letter, col) {
    var gr = g.createLinearGradient(0, -14, 0, 14); gr.addColorStop(0, '#ffe58a'); gr.addColorStop(1, '#a8741a');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill();
    g.strokeStyle = '#fff6d0'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 11.5, 0, 7); g.stroke();
    dagi(g, 0, 0, 7.5, 'rgba(120,70,10,0.45)', 1.1);
    g.fillStyle = col; g.strokeStyle = '#2a1a06'; g.lineWidth = 2.4;
    g.font = '900 15px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.strokeText(letter, 0, 1); g.fillText(letter, 0, 1);
  }

  var EXTRA_ICONS = {
    jollof: function (g) {
      g.fillStyle = '#f5f5f0'; ell(g, 0, 6, 17, 6); g.fill();
      g.fillStyle = '#d8d8d0'; ell(g, 0, 6, 13, 4); g.fill();
      g.fillStyle = '#d9501c'; g.beginPath(); g.ellipse(-2, 5, 12, 9, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#f08a3a'; for (var i = 0; i < 12; i++) g.fillRect(-12 + hash(i) * 20, -2 + hash(i + 9) * 6, 1.6, 1);
      g.fillStyle = '#8a4a1e'; ell(g, 8, 0, 6.5, 4.5, -0.4); g.fill();
      g.fillStyle = '#f3ead6'; g.fillRect(12, -5, 4, 2);
      g.fillStyle = '#f2b33a'; ell(g, -9, 4, 4, 2, 0.3); g.fill(); ell(g, -4, 6, 4, 2, -0.2); g.fill();
    },
    cash: function (g) {
      for (var i = 0; i < 3; i++) { g.fillStyle = i % 2 ? '#2e8b57' : '#1f6e43'; rr(g, -14 + i, -8 - i * 3, 28, 14, 2); g.fill(); }
      g.fillStyle = '#c9a23a'; g.fillRect(-3, -15, 6, 16);
      g.fillStyle = '#fff'; g.font = '900 9px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('₦', -8, -8);
    },
    backup: function (g, t) {
      g.fillStyle = '#0b8a4a'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill();
      g.strokeStyle = '#ffffff'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 11.5, 0, 7); g.stroke();
      g.fillStyle = GOLD; g.beginPath();
      for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 9; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
    },
    capsule: function (g, t) {
      var flap = Math.sin(t * 16) * 0.5;
      g.fillStyle = '#ffffff';
      g.save(); g.translate(-8, -2); g.rotate(-0.4 - flap); g.beginPath(); g.ellipse(-8, 0, 11, 4, 0, 0, 7); g.fill(); g.restore();
      g.fillStyle = NG_GREEN;
      g.save(); g.translate(8, -2); g.rotate(0.4 + flap); g.beginPath(); g.ellipse(8, 0, 11, 4, 0, 0, 7); g.fill(); g.restore();
      var gr = g.createLinearGradient(0, -9, 0, 9); gr.addColorStop(0, '#e9ecf0'); gr.addColorStop(1, '#7a7f88');
      g.fillStyle = gr; ell(g, 0, 0, 13, 8.5); g.fill();
      g.fillStyle = RED; g.fillRect(-3, -8.5, 6, 17);
      g.fillStyle = '#fff'; g.font = '900 7px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 0.5);
    }
  };
  WKEYS.forEach(function (k) { EXTRA_ICONS['w' + k] = function (g) { medallion(g, k, WEAPONS[k].color); }; });

  // Bosses face left. Origin is the bottom centre; ~190 wide, ~270 tall.
  function drawBoss(g, def, t, hpf) {
    var tint = def.tint, cracked = hpf < 0.5, key = 'boss_' + def.kind;
    if (imgReady(key)) {
      var im = IMG[key].img, h = 280, w = im.width * h / im.height;
      var bob = def.kind === 'gen' ? Math.abs(Math.sin(t * 3)) * -5 : Math.sin(t * 9) * 1.5;
      var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false;
      if (tint && 'filter' in g) g.filter = def.kind === 'gen' ? 'hue-rotate(250deg) saturate(1.2)' : 'hue-rotate(-70deg) saturate(1.3)';
      g.drawImage(im, -w / 2, -h + bob, w, h);
      if (tint && 'filter' in g) g.filter = 'none';
      if (cracked) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12 + Math.abs(Math.sin(t * 10)) * 0.1; g.drawImage(im, -w / 2, -h + bob, w, h); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
      g.imageSmoothingEnabled = sm;
      return;
    }
    if (def.kind === 'gen') {
      var body = tint ? '#5b2bb0' : '#c8281e', dark = tint ? '#2a1458' : '#6a120d', st = Math.sin(t * 3);
      g.strokeStyle = '#2a2a30'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-46, -78); g.lineTo(-60 + st * 8, -38); g.lineTo(-52 + st * 10, -8);
      g.moveTo(46, -78); g.lineTo(58 - st * 8, -38); g.lineTo(52 - st * 10, -8); g.stroke();
      g.fillStyle = '#18181c'; rr(g, -74 + st * 10, -12, 42, 12, 4); g.fill(); rr(g, 32 - st * 10, -12, 42, 12, 4); g.fill();
      g.fillStyle = '#1b1b20'; rr(g, -98, -206, 196, 132, 12); g.fill();
      var bg = g.createLinearGradient(0, -200, 0, -80); bg.addColorStop(0, body); bg.addColorStop(1, dark);
      g.fillStyle = bg; rr(g, -90, -200, 180, 120, 10); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.14)'; rr(g, -86, -196, 172, 16, 8); g.fill();
      g.fillStyle = '#f2c230'; rr(g, -64, -234, 120, 32, 12); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.18)'; rr(g, 20, -234, 36, 32, 10); g.fill();
      g.fillStyle = '#1b1b20'; g.fillRect(-12, -243, 18, 10);
      g.fillStyle = dark; for (var i = 0; i < 6; i++) g.fillRect(8, -184 + i * 15, 72, 7);
      g.fillStyle = '#202026'; rr(g, -82, -188, 80, 76, 6); g.fill();
      var eye = cracked ? '#ff2a2a' : '#ffd23f';
      g.save(); g.shadowColor = eye; g.shadowBlur = 12; g.fillStyle = eye;
      g.save(); g.translate(-60, -162); g.rotate(0.28); g.fillRect(-12, -4, 24, 8); g.restore();
      g.save(); g.translate(-24, -162); g.rotate(-0.28); g.fillRect(-12, -4, 24, 8); g.restore();
      g.restore();
      g.fillStyle = '#0c0c0e'; rr(g, -68, -140, 52, 16, 4); g.fill();
      g.fillStyle = '#c8ccd1'; for (var j = 0; j < 5; j++) g.fillRect(-64 + j * 10, -138, 6, 12);
      g.fillStyle = '#f5f1e6'; rr(g, -86, -106, 172, 20, 3); g.fill();
      g.fillStyle = '#111'; g.font = '900 9.5px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('I BETTER PASS MY NEIGHBOUR', 0, -95.5);
      g.fillStyle = '#3a3a40'; g.fillRect(70, -266, 12, 64);
      g.fillStyle = '#1b1b20'; g.fillRect(66, -272, 20, 8);
      g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(92, -150); g.quadraticCurveTo(106, -138, 102, -118); g.stroke();
      g.fillStyle = '#e8572a'; rr(g, 96, -120, 12, 6, 2); g.fill();
    } else {
      var c = tint ? '#ff7a1a' : '#b388ff';
      g.fillStyle = '#111'; [-70, -20, 20, 70].forEach(function (x) { g.beginPath(); g.arc(x, -7, 7, 0, 7); g.fill(); });
      for (var s = 0; s < 3; s++) {
        var y0 = -76 - s * 62, pulse = 1 + Math.sin(t * 9 + s) * 0.07, w = 176 - s * 14;
        g.fillStyle = '#141418'; rr(g, -w / 2, y0, w, 60, 6); g.fill();
        g.strokeStyle = '#2c2c34'; g.lineWidth = 2; rr(g, -w / 2 + 3, y0 + 3, w - 6, 54, 5); g.stroke();
        [-1, 1].forEach(function (d) {
          var wx = d * (w / 4 + 2), wy = y0 + 30;
          g.fillStyle = '#2a2a32'; g.beginPath(); g.arc(wx, wy, 24 * pulse, 0, 7); g.fill();
          g.fillStyle = '#0b0b0e'; g.beginPath(); g.arc(wx, wy, 18 * pulse, 0, 7); g.fill();
          g.fillStyle = c; g.beginPath(); g.arc(wx, wy, 5.5, 0, 7); g.fill();
        });
        g.fillStyle = c; g.fillRect(-w / 2 + 6, y0 + 52, w - 12, 2);
      }
      g.fillStyle = '#202026'; rr(g, -78, -222, 156, 24, 4); g.fill();
      g.fillStyle = '#0b0b0e'; ell(g, -38, -222, 28, 6); g.fill(); ell(g, 38, -222, 28, 6); g.fill();
      g.strokeStyle = c; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-38, -222); g.lineTo(-38 + Math.cos(t * 9) * 24, -222 + Math.sin(t * 9) * 5); g.stroke();
      g.fillStyle = '#0b0b10'; rr(g, -42, -272, 84, 48, 6); g.fill();
      g.save(); g.shadowColor = c; g.shadowBlur = 12; g.fillStyle = cracked ? '#ff2a2a' : c;
      g.save(); g.translate(-18, -256); g.rotate(0.3); g.fillRect(-10, -3, 20, 6); g.restore();
      g.save(); g.translate(18, -256); g.rotate(-0.3); g.fillRect(-10, -3, 20, 6); g.restore();
      for (var b = 0; b < 7; b++) { var bh = 3 + Math.abs(Math.sin(t * 12 + b)) * 9; g.fillRect(-27 + b * 8, -232 - bh, 5, bh); }
      g.restore();
      g.strokeStyle = '#1b1b20'; g.lineWidth = 8; g.beginPath(); g.arc(0, -250, 50, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      g.fillStyle = '#1b1b20'; rr(g, -56, -262, 14, 26, 5); g.fill(); rr(g, 42, -262, 14, 26, 5); g.fill();
      g.fillStyle = c; g.font = '900 9px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('OFF-BEAT', 0, -66);
    }
    if (cracked) {
      g.strokeStyle = 'rgba(255,220,120,0.8)'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(-30, -190); g.lineTo(-18, -168); g.lineTo(-26, -150); g.lineTo(-12, -128);
      g.moveTo(40, -150); g.lineTo(28, -130); g.lineTo(36, -112); g.stroke();
    }
  }

  // The TCM backup: faces right, origin bottom centre.
  function drawSoundTruck(g, t) {
    g.fillStyle = '#0b8a4a'; rr(g, 40, -62, 54, 52, 8); g.fill();
    g.fillStyle = 'rgba(160,210,240,0.85)'; rr(g, 60, -56, 28, 20, 3); g.fill();
    g.fillStyle = '#f4f4f0'; g.fillRect(-96, -24, 190, 10);
    g.fillStyle = '#0f0f12'; rr(g, -96, -100, 134, 78, 6); g.fill();
    for (var i = 0; i < 3; i++) {
      var cx = -74 + i * 44, p = 1 + Math.sin(t * 14 + i) * 0.08;
      g.fillStyle = '#2a2a32'; g.beginPath(); g.arc(cx, -64, 17 * p, 0, 7); g.fill();
      g.fillStyle = '#3ddc84'; g.beginPath(); g.arc(cx, -64, 5, 0, 7); g.fill();
    }
    g.fillStyle = '#ffffff'; g.font = '900 11px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TCM SOUND', -28, -32);
    wheel(g, -64, -8, 11, t); wheel(g, 60, -8, 11, t);
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(94, -30, 3.5, 0, 7); g.fill();
  }

  /* ------------------------------------------------------------------ landmarks
     Silhouettes on the far layer. Origin = left edge on the horizon. */
  var LANDW = { asorock: 380, zuma: 232, mosque: 262, ecumenical: 200, millennium: 240, assembly: 280, cbd: 190, citygate: 224 };

  function rockGrad(g, top, p) {
    var gr = g.createLinearGradient(0, top, 0, 0);
    gr.addColorStop(0, C(mix3(p.far, p.sun, 0.22))); gr.addColorStop(0.6, C(p.far)); gr.addColorStop(1, C(mix3(p.far, BLACK, 0.15)));
    return gr;
  }

  function drawLandmark(g, type, p, t, seed) {
    var lit = C(p.lit, 0.25 + p.night * 0.7);
    var body = C(mix3(p.far, CREAM, 0.22 * (1 - p.night * 0.6)));
    var rim = C(p.sun, 0.35 * (1 - p.night * 0.7));
    g.lineJoin = 'round';
    if (type === 'asorock') {
      g.beginPath(); g.moveTo(0, 0);
      g.bezierCurveTo(10, -60, 30, -118, 70, -150); g.bezierCurveTo(100, -178, 150, -196, 200, -200);
      g.bezierCurveTo(250, -204, 290, -186, 318, -150); g.bezierCurveTo(345, -110, 362, -50, 380, 0); g.closePath();
      g.fillStyle = rockGrad(g, -200, p); g.fill();
      g.save(); g.clip();
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.beginPath(); g.moveTo(230, -220); g.bezierCurveTo(270, -150, 250, -60, 280, 0); g.lineTo(400, 0); g.lineTo(400, -220); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.13)'; g.lineWidth = 3;
      for (var i = 0; i < 11; i++) { var x = 30 + i * 32; g.beginPath(); g.moveTo(x, -210); g.bezierCurveTo(x + 8, -140, x - 6, -70, x + 4, 0); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 6;
      for (var j = 0; j < 4; j++) { g.beginPath(); g.moveTo(60 + j * 70, -170 + j * 6); g.bezierCurveTo(70 + j * 70, -120, 60 + j * 70, -60, 66 + j * 70, 0); g.stroke(); }
      g.restore();
      g.strokeStyle = rim; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(14, -60); g.bezierCurveTo(30, -118, 30, -118, 70, -150); g.bezierCurveTo(100, -178, 150, -196, 200, -200); g.bezierCurveTo(250, -204, 290, -186, 318, -150); g.stroke();
    } else if (type === 'zuma') {
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(8, -90, 40, -200, 116, -246); g.bezierCurveTo(192, -200, 224, -90, 232, 0); g.closePath();
      g.fillStyle = rockGrad(g, -246, p); g.fill();
      g.save(); g.clip();
      g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 4;
      for (var k = 0; k < 9; k++) { var zx = 22 + k * 24; g.beginPath(); g.moveTo(zx, -250); g.bezierCurveTo(zx + 6, -160, zx - 4, -80, zx + 2, 0); g.stroke(); }
      g.fillStyle = 'rgba(0,0,0,0.3)';
      ell(g, 88, -168, 11, 5, -0.25); g.fill(); ell(g, 144, -170, 11, 5, 0.25); g.fill();
      g.beginPath(); g.moveTo(113, -160); g.lineTo(104, -118); g.lineTo(124, -112); g.lineTo(120, -160); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.32)'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(86, -90); g.quadraticCurveTo(116, -76, 148, -92); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(170, -260, 80, 260);
      g.restore();
      g.strokeStyle = rim; g.lineWidth = 2.5; g.beginPath(); g.moveTo(12, -80); g.bezierCurveTo(30, -170, 60, -215, 116, -246); g.stroke();
    } else if (type === 'mosque') {
      var gold = g.createLinearGradient(0, -140, 0, -70); gold.addColorStop(0, '#ffe089'); gold.addColorStop(0.5, '#e2a93b'); gold.addColorStop(1, '#8f5d12');
      var mcol = C(mix3(p.far, CREAM, 0.12));
      function minaret(x, h, c) {
        g.fillStyle = c; g.fillRect(x - 5, -h, 10, h);
        g.fillRect(x - 8, -h * 0.62, 16, 4); g.fillRect(x - 7, -h * 0.85, 14, 3);
        g.beginPath(); g.moveTo(x - 5.5, -h); g.lineTo(x, -h - 24); g.lineTo(x + 5.5, -h); g.closePath(); g.fillStyle = gold; g.fill();
        if (p.night > 0.3) { g.fillStyle = lit; g.fillRect(x - 6, -h * 0.62 - 1, 12, 1.5); }
      }
      minaret(62, 160, C(mix3(p.far, BLACK, 0.1))); minaret(200, 160, C(mix3(p.far, BLACK, 0.1)));
      g.fillStyle = mcol; g.fillRect(30, -44, 202, 44);
      g.fillStyle = gold; g.beginPath(); g.moveTo(40, -44); g.bezierCurveTo(40, -64, 72, -64, 72, -44); g.fill();
      g.beginPath(); g.moveTo(190, -44); g.bezierCurveTo(190, -64, 222, -64, 222, -44); g.fill();
      g.fillStyle = lit;
      for (var w = 0; w < 9; w++) { var wx = 44 + w * 20; rr(g, wx, -32, 7, 18, 3.5); g.fill(); }
      g.fillStyle = mcol; g.fillRect(84, -80, 94, 38);
      g.fillStyle = lit; for (var a = 0; a < 5; a++) { rr(g, 92 + a * 17, -72, 6, 14, 3); g.fill(); }
      if (p.night > 0.2) {
        g.save(); g.globalCompositeOperation = 'lighter';
        var gl = g.createRadialGradient(131, -105, 4, 131, -105, 90); gl.addColorStop(0, 'rgba(255,200,90,' + (0.35 * p.night) + ')'); gl.addColorStop(1, 'rgba(255,200,90,0)');
        g.fillStyle = gl; g.fillRect(30, -200, 200, 200); g.restore();
      }
      g.fillStyle = gold; g.beginPath(); g.moveTo(80, -80); g.bezierCurveTo(78, -146, 184, -146, 182, -80); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(120,70,10,0.45)'; g.lineWidth = 1.2;
      for (var r = 0; r < 7; r++) { var rx = 88 + r * 14.3; g.beginPath(); g.moveTo(131, -128); g.quadraticCurveTo(rx - (131 - rx) * 0.1, -110, rx, -80); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(100, -88); g.bezierCurveTo(98, -120, 118, -130, 124, -128); g.bezierCurveTo(112, -118, 108, -104, 108, -88); g.fill();
      g.strokeStyle = '#ffd56a'; g.lineWidth = 2; g.beginPath(); g.moveTo(131, -128); g.lineTo(131, -146); g.stroke();
      g.beginPath(); g.arc(131, -152, 5, 0.6, Math.PI * 2 - 0.6); g.stroke();
      minaret(18, 196, C(p.far)); minaret(244, 196, C(p.far));
    } else if (type === 'ecumenical') {
      g.fillStyle = body; g.fillRect(10, -56, 180, 56);
      function spire(x0, x1, top) {
        g.fillStyle = body; g.beginPath(); g.moveTo(x0, -56); g.lineTo((x0 + x1) / 2, top); g.lineTo(x1, -56); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = 1.2;
        for (var i = 1; i < 4; i++) { var bx = x0 + (x1 - x0) * i / 4; g.beginPath(); g.moveTo(bx, -56); g.lineTo((x0 + x1) / 2, top); g.stroke(); }
      }
      spire(26, 78, -128); spire(122, 174, -128); spire(62, 138, -204);
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 6; g.beginPath(); g.moveTo(100, -204); g.lineTo(100, -56); g.stroke();
      g.strokeStyle = '#e8c547'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(100, -204); g.lineTo(100, -224); g.moveTo(93, -216); g.lineTo(107, -216); g.stroke();
      g.fillStyle = lit;
      for (var e = 0; e < 8; e++) { var ex = 20 + e * 21; g.beginPath(); g.moveTo(ex, -10); g.lineTo(ex, -30); g.lineTo(ex + 4.5, -38); g.lineTo(ex + 9, -30); g.lineTo(ex + 9, -10); g.closePath(); g.fill(); }
      g.fillStyle = C(p.lit, 0.15 + p.night * 0.6); g.beginPath(); g.arc(100, -90, 9, 0, 7); g.fill();
    } else if (type === 'millennium') {
      var conc = C(mix3(p.far, [205, 205, 215], 0.2 * (1 - p.night * 0.5)));
      g.fillStyle = C(mix3(p.far, BLACK, 0.12)); g.beginPath(); g.moveTo(120, 0); g.lineTo(178, -84); g.lineTo(236, 0); g.closePath(); g.fill();
      g.strokeStyle = C(p.lit, 0.12 + p.night * 0.35); g.lineWidth = 1;
      for (var pl = 1; pl < 8; pl++) { var py = -pl * 10.5, half = 58 * (1 - pl / 8); g.beginPath(); g.moveTo(178 - half, py); g.lineTo(178 + half, py); g.stroke(); }
      g.fillStyle = conc;
      rr(g, 37, -272, 14, 272, 7); g.fill(); rr(g, 53, -234, 12, 234, 6); g.fill(); rr(g, 67, -202, 12, 202, 6); g.fill();
      g.strokeStyle = 'rgba(210,220,232,' + (0.35 + p.night * 0.2) + ')'; g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(46, 0); g.bezierCurveTo(30, -40, 14, -80, 10, -122); g.stroke();
      g.beginPath(); g.moveTo(66, 0); g.bezierCurveTo(84, -40, 100, -70, 106, -106); g.stroke();
      g.beginPath(); g.moveTo(54, 0); g.bezierCurveTo(46, -60, 34, -110, 30, -150); g.stroke();
      g.fillStyle = C(mix3(p.far, BLACK, 0.25)); ell(g, 58, -205, 38, 8.5); g.fill();
      g.fillStyle = conc; ell(g, 58, -209, 34, 4); g.fill();
      g.fillStyle = C(p.lit, 0.2 + p.night * 0.8);
      for (var d = 0; d < 11; d++) { var dx = 26 + d * 6.4; g.fillRect(dx, -206, 3, 2.2); }
      if (Math.sin(t * 3) > 0) { g.fillStyle = 'rgba(255,40,40,' + (0.4 + p.night * 0.6) + ')'; g.beginPath(); g.arc(44, -276, 2.6, 0, 7); g.fill(); }
    } else if (type === 'assembly') {
      var cream = C(mix3(p.far, CREAM, 0.3 * (1 - p.night * 0.6)));
      g.fillStyle = cream; g.fillRect(0, -44, 280, 44);
      g.fillStyle = 'rgba(0,0,0,0.14)'; for (var cl = 6; cl < 280; cl += 11) g.fillRect(cl, -38, 3, 36);
      g.fillStyle = C(mix3(p.far, CREAM, 0.38 * (1 - p.night * 0.6))); g.fillRect(-4, -48, 288, 5);
      g.fillStyle = cream; g.fillRect(78, -72, 124, 30);
      g.fillStyle = lit; for (var aw = 0; aw < 6; aw++) g.fillRect(88 + aw * 19, -66, 7, 16);
      var green = g.createLinearGradient(0, -140, 0, -72);
      green.addColorStop(0, C(mix3([84, 200, 140], p.far, 0.2))); green.addColorStop(1, C(mix3([10, 92, 54], p.far, 0.25)));
      g.fillStyle = green; g.beginPath(); g.moveTo(82, -72); g.bezierCurveTo(80, -142, 200, -142, 198, -72); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1.2;
      for (var gr2 = 0; gr2 < 7; gr2++) { var gx = 92 + gr2 * 16; g.beginPath(); g.moveTo(140, -124); g.quadraticCurveTo(gx - (140 - gx) * 0.1, -104, gx, -72); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.moveTo(100, -78); g.bezierCurveTo(100, -112, 122, -124, 130, -122); g.bezierCurveTo(116, -112, 110, -96, 110, -78); g.fill();
      g.fillStyle = cream; g.fillRect(134, -134, 12, 12);
      g.fillStyle = green; g.beginPath(); g.arc(140, -134, 6, Math.PI, 0); g.fill();
      [22, 258].forEach(function (fx) { flagOnPole(g, fx, -48, 46, t, 0.8); });
    } else if (type === 'cbd') {
      var towers = [[0, 40, 150], [44, 36, 206], [84, 46, 172], [134, 52, 128]];
      towers.forEach(function (tw, ti) {
        var gl = g.createLinearGradient(0, -tw[2], 0, 0);
        gl.addColorStop(0, C(mix3(p.far, p.sky2, 0.3))); gl.addColorStop(1, C(mix3(p.far, BLACK, 0.15)));
        g.fillStyle = gl; g.fillRect(tw[0], -tw[2], tw[1], tw[2]);
        g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(tw[0], -tw[2], tw[1] * 0.35, tw[2]);
        for (var yy = 8; yy < tw[2] - 6; yy += 9) for (var xx = 4; xx < tw[1] - 4; xx += 7) {
          var hsh = hash(seed * 31 + ti * 977 + yy * 13 + xx);
          if (hsh < p.windows) { g.fillStyle = C(p.lit, 0.35 + hsh); g.fillRect(tw[0] + xx, -tw[2] + yy, 3.5, 4.5); }
        }
      });
      g.strokeStyle = C(p.far); g.lineWidth = 2; g.beginPath(); g.moveTo(62, -206); g.lineTo(62, -232); g.stroke();
      if (Math.sin(t * 2.6 + 1) > 0) { g.fillStyle = 'rgba(255,40,40,' + (0.35 + p.night * 0.6) + ')'; g.beginPath(); g.arc(62, -233, 2.2, 0, 7); g.fill(); }
    } else if (type === 'citygate') {
      var gc = C(mix3(p.far, CREAM, 0.26 * (1 - p.night * 0.6)));
      g.fillStyle = gc;
      g.beginPath(); g.rect(0, -112, 224, 112);
      function arch(cx, w, h) { g.moveTo(cx - w / 2, 0); g.lineTo(cx - w / 2, -h + w / 2); g.arc(cx, -h + w / 2, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, 0); g.closePath(); }
      arch(112, 62, 90); arch(38, 34, 62); arch(186, 34, 62);
      g.fill('evenodd');
      g.fillStyle = C(mix3(p.far, CREAM, 0.34 * (1 - p.night * 0.6))); g.fillRect(-6, -122, 236, 10);
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(-6, -114, 236, 3);
      g.fillStyle = GOLD; g.beginPath(); g.arc(112, -100, 6, 0, 7); g.fill();
      [30, 112, 194].forEach(function (fx) { flagOnPole(g, fx, -122, 44, t, 1); });
    }
  }

  function flagOnPole(g, x, base, h, t, sc) {
    sc = sc || 1;
    g.strokeStyle = '#c8ccd1'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - h); g.stroke();
    var fw = 24 * sc, fh = 14 * sc, top = base - h + 1;
    for (var s = 0; s < 3; s++) {
      g.fillStyle = s === 1 ? '#ffffff' : NG_GREEN;
      g.beginPath();
      for (var i = 0; i <= 6; i++) {
        var fx = x + (s + i / 6) * fw / 3, wav = Math.sin(t * 5 - (s * 6 + i) * 0.35) * 2 * sc * ((s * 6 + i) / 18);
        if (i === 0) g.moveTo(fx, top + wav); else g.lineTo(fx, top + wav);
      }
      for (var j = 6; j >= 0; j--) {
        var bx = x + (s + j / 6) * fw / 3, wv = Math.sin(t * 5 - (s * 6 + j) * 0.35) * 2 * sc * ((s * 6 + j) / 18);
        g.lineTo(bx, top + fh + wv);
      }
      g.closePath(); g.fill();
    }
  }

  /* ------------------------------------------------------------------ city & roadside */
  function drawBuilding(g, b, p, t) {
    var w = b.w, h = b.h;
    var base = mix3(p.mid, p.far, b.tint);
    var glass = b.type === 'tower' || b.type === 'hotel';
    if (b.type === 'mast') {
      g.strokeStyle = C(mix3(base, WHITE, 0.08)); g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(w / 2 - 12, 0); g.lineTo(w / 2, -h); g.lineTo(w / 2 + 12, 0); g.stroke();
      for (var y = 10; y < h; y += 14) { var hw = 12 * (1 - y / h); g.beginPath(); g.moveTo(w / 2 - hw, -y); g.lineTo(w / 2 + hw * 0.9, -y - 14); g.stroke(); }
      g.fillStyle = C(mix3(base, WHITE, 0.12)); g.fillRect(w / 2 - 5, -h * 0.75, 4, 9); g.fillRect(w / 2 + 2, -h * 0.68, 4, 9);
      if (Math.sin(t * 2.2 + b.seed) > -0.2) { g.fillStyle = 'rgba(255,50,50,' + (0.5 + p.night * 0.5) + ')'; g.beginPath(); g.arc(w / 2, -h - 2, 2.4, 0, 7); g.fill(); }
      return;
    }
    if (b.type === 'arewa') {
      var mud = mix3(base, [168, 104, 58], 0.45 * (1 - p.night * 0.5));
      g.fillStyle = C(mud); g.fillRect(0, -h, w, h);
      g.beginPath(); g.moveTo(-2, -h); g.lineTo(2, -h - 14); g.lineTo(7, -h); g.moveTo(w - 7, -h); g.lineTo(w - 2, -h - 14); g.lineTo(w + 2, -h); g.closePath();
      g.moveTo(w / 2 - 4, -h); g.lineTo(w / 2, -h - 10); g.lineTo(w / 2 + 4, -h); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, -h, w, 3);
      dagi(g, w / 2, -h * 0.62, Math.min(8, h * 0.14), C(mix3(mud, WHITE, 0.45), 0.8), 1.4);
      g.fillStyle = C(mix3(mud, BLACK, 0.55));
      g.beginPath(); g.moveTo(w / 2 - 7, 0); g.lineTo(w / 2 - 7, -16); g.quadraticCurveTo(w / 2, -26, w / 2 + 7, -16); g.lineTo(w / 2 + 7, 0); g.fill();
      if (p.night > 0.3) { g.fillStyle = C(p.lit, 0.5 * p.night); g.fillRect(w / 2 - 5, -12, 10, 12); }
      return;
    }
    if (glass) {
      var gg = g.createLinearGradient(0, -h, w, 0);
      gg.addColorStop(0, C(mix3(base, p.sky2, 0.28))); gg.addColorStop(1, C(mix3(base, BLACK, 0.2)));
      g.fillStyle = gg;
    } else g.fillStyle = C(base);
    g.fillRect(0, -h, w, h);
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, -h, 3, h);
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(w - 5, -h, 5, h);
    var cols = Math.max(1, Math.floor((w - 8) / 9)), rows = Math.max(1, Math.floor((h - 14) / 11));
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var hs = hash(b.seed * 7.13 + r * 31.7 + c * 3.1);
      var wx = 5 + c * 9, wy = -h + 9 + r * 11;
      if (hs < p.windows) { g.fillStyle = C(p.lit, 0.45 + hs * 0.5); g.fillRect(wx, wy, 4.5, 6); }
      else { g.fillStyle = glass ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.25)'; g.fillRect(wx, wy, 4.5, 6); }
    }
    if (b.type === 'block') {
      g.fillStyle = '#0d0d10'; rr(g, w * 0.62, -h - 9, 11, 9, 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(w * 0.62 + 2, -h - 7, 2, 5);
      g.fillStyle = C(mix3(base, WHITE, 0.08)); g.fillRect(-2, -h - 2, w + 4, 3);
    }
    if (b.type === 'tower') { g.fillStyle = C(mix3(base, BLACK, 0.2)); g.fillRect(w * 0.2, -h - 8, w * 0.6, 8); }
    if (b.type === 'hotel') {
      var sign = b.sign, sw = Math.min(w + 10, sign.length * 7 + 12);
      g.fillStyle = 'rgba(8,6,14,0.9)'; rr(g, w / 2 - sw / 2, -h - 18, sw, 14, 3); g.fill();
      var ncol = b.seed % 2 < 1 ? '255,59,107' : '0,220,140';
      g.save();
      if (p.neon > 0.2) { g.shadowColor = 'rgba(' + ncol + ',0.9)'; g.shadowBlur = 10 * p.neon; }
      var flick = p.neon > 0.2 && Math.sin(t * 23 + b.seed * 9) > 0.96 ? 0.35 : 1;
      g.fillStyle = 'rgba(' + ncol + ',' + ((0.35 + 0.65 * p.neon) * flick) + ')';
      g.font = '900 9px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(sign, w / 2, -h - 10.5);
      g.restore();
    }
  }

  function drawNear(g, n, p, t) {
    var night = p.night;
    if (n.type === 'lamp') {
      g.fillStyle = '#3a3c42'; g.fillRect(-2, -118, 4, 118); g.fillRect(-4, -4, 8, 4);
      g.strokeStyle = '#3a3c42'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -112); g.quadraticCurveTo(4, -124, 20, -122); g.stroke();
      g.fillStyle = '#1d1f24'; rr(g, 12, -126, 18, 6, 2); g.fill();
      g.fillStyle = '#24344a'; g.save(); g.translate(-12, -128); g.rotate(-0.35); g.fillRect(0, 0, 16, 3); g.restore();
      g.fillStyle = night > 0.25 ? '#fff4c8' : '#c8ccd1'; g.fillRect(14, -121, 14, 2.5);
      if (night > 0.25) {
        g.save(); g.globalCompositeOperation = 'lighter';
        var lg = g.createRadialGradient(21, -118, 2, 21, -118, 46);
        lg.addColorStop(0, C(p.lit, 0.55 * night)); lg.addColorStop(1, C(p.lit, 0));
        g.fillStyle = lg; g.fillRect(-30, -170, 100, 100);
        var cg = g.createLinearGradient(0, -118, 0, 20);
        cg.addColorStop(0, C(p.lit, 0.16 * night)); cg.addColorStop(1, C(p.lit, 0));
        g.fillStyle = cg; g.beginPath(); g.moveTo(14, -119); g.lineTo(28, -119); g.lineTo(60, 20); g.lineTo(-18, 20); g.closePath(); g.fill();
        g.restore();
      }
      g.fillStyle = NG_GREEN; g.fillRect(-2, -40, 4, 6); g.fillStyle = '#fff'; g.fillRect(-2, -34, 4, 6); g.fillStyle = NG_GREEN; g.fillRect(-2, -28, 4, 6);
    } else if (n.type === 'palm') {
      var sw = Math.sin(t * 1.4 + n.seed) * 0.05;
      g.strokeStyle = C(mix3([92, 70, 48], p.mid, 0.35 + night * 0.3)); g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, -50, 2, -108); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
      for (var s = 8; s < 104; s += 8) { g.beginPath(); g.moveTo(-3, -s); g.lineTo(3, -s - 2); g.stroke(); }
      var leaf = C(mix3([46, 112, 60], p.mid, 0.3 + night * 0.45));
      g.save(); g.translate(2, -108); g.rotate(sw);
      g.fillStyle = leaf;
      for (var f = 0; f < 7; f++) {
        var a = -Math.PI + f * (Math.PI / 6) + 0.05, len = 40 + (f % 2) * 8;
        g.beginPath(); g.moveTo(0, 0);
        g.quadraticCurveTo(Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5 - 14, Math.cos(a) * len, Math.sin(a) * len * 0.6 + 12);
        g.quadraticCurveTo(Math.cos(a) * len * 0.45, Math.sin(a) * len * 0.45 - 4, 0, 0); g.fill();
      }
      g.fillStyle = '#5a3b1c'; g.beginPath(); g.arc(-3, 4, 3.4, 0, 7); g.arc(3, 5, 3.4, 0, 7); g.fill();
      g.restore();
    } else if (n.type === 'neem') {
      g.fillStyle = C(mix3([70, 52, 38], p.mid, 0.4 + night * 0.3)); g.fillRect(-3.5, -46, 7, 46);
      var lc = mix3([52, 104, 52], p.mid, 0.3 + night * 0.45);
      g.fillStyle = C(lc);
      [[0, -66, 28], [-22, -56, 20], [22, -56, 21], [-10, -80, 20], [12, -80, 19]].forEach(function (b) { g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill(); });
      g.fillStyle = C(mix3(lc, p.sun, 0.18 * (1 - night)));
      [[-6, -84, 12], [14, -70, 10]].forEach(function (b) { g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill(); });
    } else if (n.type === 'billboard') {
      var bb = n.text, colr = bb[2] === 'red' ? ['#FF3B3B', '#7a0f0f'] : bb[2] === 'green' ? ['#00a862', '#004d2c'] : ['#f2c94c', '#a8741a'];
      g.fillStyle = '#26272c'; g.fillRect(-46, -70, 5, 70); g.fillRect(41, -70, 5, 70);
      g.fillStyle = '#1b1c20'; g.fillRect(-64, -74, 128, 5);
      var bg = g.createLinearGradient(-62, -130, 62, -74); bg.addColorStop(0, colr[0]); bg.addColorStop(1, colr[1]);
      g.fillStyle = bg; g.fillRect(-62, -132, 124, 58);
      g.fillStyle = 'rgba(0,0,0,0.15)';
      for (var k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-62 + k * 26, -132); g.lineTo(-48 + k * 26, -132); g.lineTo(-62 + k * 26 + 30, -74); g.lineTo(-62 + k * 26 + 16, -74); g.closePath(); g.fill(); }
      g.fillStyle = bb[2] === 'gold' ? '#141416' : '#ffffff';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '900 15px "Inter Tight", sans-serif'; g.fillText(bb[0], 0, -111);
      g.font = '900 12px "Inter Tight", sans-serif'; g.fillText(bb[1], 0, -94);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '700 5.5px "JetBrains Mono", monospace'; g.fillText('TCM · ABUJA', 38, -80);
      if (night > 0.3) {
        g.save(); g.globalCompositeOperation = 'lighter';
        var bl = g.createLinearGradient(0, -74, 0, -132); bl.addColorStop(0, 'rgba(255,240,200,' + (0.28 * night) + ')'); bl.addColorStop(1, 'rgba(255,240,200,0)');
        g.fillStyle = bl; g.fillRect(-62, -132, 124, 58); g.restore();
      }
    } else if (n.type === 'suya') {
      g.fillStyle = '#5a3a22'; g.fillRect(-30, -24, 60, 4); g.fillRect(-26, -20, 4, 20); g.fillRect(22, -20, 4, 20);
      g.fillStyle = '#26262b'; g.fillRect(-24, -34, 48, 10);
      var flick = 0.7 + Math.sin(t * 18 + n.seed) * 0.15 + Math.sin(t * 31) * 0.1;
      var cg2 = g.createLinearGradient(0, -34, 0, -28); cg2.addColorStop(0, 'rgba(255,120,30,' + flick + ')'); cg2.addColorStop(1, 'rgba(200,40,10,0.8)');
      g.fillStyle = cg2; g.fillRect(-22, -34, 44, 4);
      g.strokeStyle = '#d8b47a'; g.lineWidth = 1.2;
      for (var sk = 0; sk < 6; sk++) { g.beginPath(); g.moveTo(-20 + sk * 7, -36); g.lineTo(-14 + sk * 7, -42); g.stroke(); g.fillStyle = '#6e2c12'; g.fillRect(-19 + sk * 7, -41, 4, 3); }
      g.strokeStyle = '#d9d9d9'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(26, -24); g.lineTo(26, -78); g.stroke();
      g.save(); g.beginPath(); g.moveTo(-8, -72); g.quadraticCurveTo(26, -96, 60, -72); g.closePath(); g.clip();
      for (var u = 0; u < 8; u++) { g.fillStyle = u % 2 ? '#ffffff' : NG_GREEN; g.fillRect(-8 + u * 8.6, -98, 8.6, 30); }
      g.restore();
      g.fillStyle = '#141416'; rr(g, -30, -60, 34, 12, 2); g.fill();
      g.fillStyle = '#ffb347'; g.font = '900 6.5px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MAI SUYA', -13, -53.6);
      g.fillStyle = '#3a2a22'; g.beginPath(); g.arc(-36, -46, 5, 0, 7); g.fill();
      g.fillStyle = '#f3ead6'; g.beginPath(); g.moveTo(-42, -40); g.lineTo(-30, -40); g.lineTo(-28, 0); g.lineTo(-44, 0); g.closePath(); g.fill();
      g.fillStyle = '#c0392b'; rr(g, -41, -55, 10, 5, 1.5); g.fill();
      if (night > 0.2) {
        g.save(); g.globalCompositeOperation = 'lighter';
        var sg = g.createRadialGradient(0, -36, 2, 0, -36, 50); sg.addColorStop(0, 'rgba(255,130,40,' + (0.45 * flick) + ')'); sg.addColorStop(1, 'rgba(255,130,40,0)');
        g.fillStyle = sg; g.fillRect(-50, -90, 100, 90); g.restore();
      }
    } else if (n.type === 'pots') {
      g.fillStyle = C(mix3([80, 56, 40], p.mid, 0.3)); g.fillRect(-34, -8, 68, 8);
      [[-18, 26, 22], [10, 32, 28], [30, 18, 16]].forEach(function (pt, i) {
        var cx = pt[0], ph = pt[1], pw = pt[2];
        var pc = mix3([150, 78, 42], p.mid, 0.25 + night * 0.4);
        g.fillStyle = C(pc);
        g.beginPath(); g.moveTo(cx - pw * 0.3, -8 - ph); g.bezierCurveTo(cx - pw * 0.9, -8 - ph * 0.8, cx - pw * 0.8, -8, cx, -8);
        g.bezierCurveTo(cx + pw * 0.8, -8, cx + pw * 0.9, -8 - ph * 0.8, cx + pw * 0.3, -8 - ph); g.closePath(); g.fill();
        g.fillStyle = C(mix3(pc, BLACK, 0.3)); g.fillRect(cx - pw * 0.32, -10 - ph, pw * 0.64, 3);
        g.strokeStyle = C(mix3(pc, WHITE, 0.35), 0.8); g.lineWidth = 0.9;
        g.beginPath();
        for (var z = 0; z < 7; z++) { var zx = cx - pw * 0.42 + z * pw * 0.14; g.lineTo(zx, -8 - ph * 0.55 + (z % 2 ? 3 : -3)); }
        g.stroke();
        g.beginPath(); g.moveTo(cx - pw * 0.4, -8 - ph * 0.32); g.lineTo(cx + pw * 0.4, -8 - ph * 0.32); g.stroke();
        if (i === 1) { g.beginPath(); g.moveTo(cx - 4, -8 - ph * 0.8); g.lineTo(cx + 4, -8 - ph * 0.72); g.moveTo(cx - 2, -8 - ph * 0.84); g.lineTo(cx - 3, -8 - ph * 0.7); g.moveTo(cx + 2, -8 - ph * 0.82); g.lineTo(cx + 3, -8 - ph * 0.7); g.stroke(); }
      });
    } else if (n.type === 'flag') {
      g.fillStyle = '#5a5c62'; g.fillRect(-6, -6, 12, 6);
      flagOnPole(g, 0, -6, 96, t + n.seed, 1.7);
    }
  }

  /* ------------------------------------------------------------------ sound
     A little afrobeats engine: kick, clap, shaker, agogo bell and a gangan
     (talking drum) that bends its pitch. All synthesised, nothing loaded. */
  var Sound = (function () {
    var ac = null, master, music, sfx, noise, timer = 0, nextT = 0, stepN = 0, playing = false;
    var muted = load('muted', false);
    var SPB = 60 / 106 / 4;
    var CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
    var K = [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0];
    var RIM = [0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    var BELL = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0];
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function init() {
      if (ac) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try { ac = new AC(); } catch (e) { return false; }
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.75;
      var comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination);
      music = ac.createGain(); music.gain.value = 0.5; music.connect(master);
      sfx = ac.createGain(); sfx.gain.value = 0.85; sfx.connect(master);
      noise = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      var d = noise.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }
    function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    function osc(type, f0, f1, t, dur, peak, dest, a) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.9);
      env(g, t, a || 0.005, peak, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
    }
    function nz(t, dur, peak, ftype, freq, dest, q) {
      var s = ac.createBufferSource(); s.buffer = noise;
      var f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; if (q) f.Q.value = q;
      var g = ac.createGain(); env(g, t, 0.002, peak, dur);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.05);
    }
    function talk(t, up, dest, peak) { osc('sine', up ? 135 : 240, up ? 240 : 115, t, 0.2, peak || 0.4, dest, 0.004); nz(t, 0.025, 0.08, 'bandpass', 900, dest); }
    function schedule(s, t) {
      var st = s % 16, bar = Math.floor(s / 16), ch = CH[bar % 4];
      if (K[st]) osc('sine', 150, 42, t, 0.3, 0.9, music, 0.002);
      if (st === 4 || st === 12) { nz(t, 0.16, 0.32, 'bandpass', 1500, music, 0.8); nz(t + 0.012, 0.12, 0.22, 'bandpass', 1100, music, 0.8); }
      if (RIM[st]) { osc('triangle', 920, 900, t, 0.05, 0.14, music); nz(t, 0.03, 0.08, 'highpass', 3000, music); }
      nz(t, st % 2 ? 0.07 : 0.035, st % 2 ? 0.11 : 0.05, 'highpass', 6500, music);
      if (BELL[st]) osc('square', st % 4 === 0 ? 1046 : 784, null, t, 0.08, 0.035, music);
      if (st === 0 || st === 3 || st === 6 || st === 10) { var bn = st === 6 ? ch[2] - 12 : st === 10 ? ch[1] : ch[0]; osc('triangle', mtof(bn - 24), null, t, st === 0 ? 0.32 : 0.18, 0.32, music, 0.01); osc('sine', mtof(bn - 24), null, t, 0.3, 0.3, music, 0.01); }
      if ([2, 5, 9, 12, 15].indexOf(st) !== -1) { var n = ch[[2, 5, 9, 12, 15].indexOf(st) % 3]; osc('sine', mtof(n + 12), null, t, 0.24, 0.1, music); osc('triangle', mtof(n + 24), null, t, 0.07, 0.025, music); }
      if (bar % 2 === 1 && (st === 12 || st === 14 || st === 15)) talk(t, st === 14, music, 0.32);
    }
    function tick() { if (!playing) return; while (nextT < ac.currentTime + 0.12) { schedule(stepN, nextT); nextT += SPB; stepN++; } }
    return {
      startMusic: function () {
        if (!init()) return;
        if (ac.state === 'suspended') ac.resume();
        if (playing) return;
        playing = true; stepN = 0; nextT = ac.currentTime + 0.08;
        clearInterval(timer); timer = setInterval(tick, 25);
      },
      stopMusic: function () { playing = false; clearInterval(timer); },
      suspend: function () { if (ac && ac.state === 'running') ac.suspend(); },
      resume: function () { if (ac && ac.state === 'suspended') ac.resume(); },
      muted: function () { return muted; },
      setMuted: function (m) { muted = m; save('muted', m); if (ac) master.gain.setTargetAtTime(m ? 0 : 0.75, ac.currentTime, 0.02); },
      play: function (name) {
        if (!ac || muted) return;
        var t = ac.currentTime + 0.005;
        if (name === 'suya') { osc('triangle', 880, 1320, t, 0.08, 0.18, sfx); osc('sine', 1320, 1760, t + 0.05, 0.1, 0.12, sfx); }
        else if (name === 'zobo') { [784, 988, 1318].forEach(function (f, i) { osc('triangle', f, null, t + i * 0.05, 0.12, 0.16, sfx); }); }
        else if (name === 'jump') { osc('sine', 300, 640, t, 0.14, 0.18, sfx); }
        else if (name === 'lane') { nz(t, 0.06, 0.06, 'bandpass', 2200, sfx, 1.2); }
        else if (name === 'hit') { nz(t, 0.28, 0.5, 'lowpass', 500, sfx); osc('sine', 150, 45, t, 0.3, 0.6, sfx); }
        else if (name === 'smash') { nz(t, 0.18, 0.4, 'bandpass', 900, sfx, 0.7); osc('square', 220, 110, t, 0.12, 0.08, sfx); }
        else if (name === 'power') { [523, 659, 784, 1046].forEach(function (f, i) { osc('triangle', f, null, t + i * 0.06, 0.16, 0.16, sfx); }); }
        else if (name === 'shield') { osc('sine', 660, 330, t, 0.3, 0.25, sfx); nz(t, 0.2, 0.15, 'highpass', 4000, sfx); }
        else if (name === 'mile') { talk(t, false, sfx, 0.5); talk(t + 0.1, true, sfx, 0.5); talk(t + 0.2, false, sfx, 0.5); osc('triangle', 1046, null, t + 0.3, 0.3, 0.12, sfx); }
        else if (name === 'shoot') { osc('square', 1400, 700, t, 0.07, 0.05, sfx); }
        else if (name === 'laser') { osc('sawtooth', 1800, 260, t, 0.18, 0.06, sfx); }
        else if (name === 'fire') { nz(t, 0.2, 0.22, 'lowpass', 900, sfx); osc('sine', 220, 90, t, 0.18, 0.14, sfx); }
        else if (name === 'punch') { nz(t, 0.06, 0.4, 'bandpass', 700, sfx, 1); osc('sine', 160, 70, t, 0.08, 0.35, sfx); }
        else if (name === 'kick') { nz(t, 0.1, 0.5, 'bandpass', 500, sfx, 1); osc('sine', 120, 45, t, 0.14, 0.5, sfx); }
        else if (name === 'ehit') { nz(t, 0.04, 0.2, 'bandpass', 1400, sfx, 1.4); }
        else if (name === 'ko') { osc('triangle', 600, 150, t, 0.25, 0.14, sfx); nz(t, 0.12, 0.25, 'lowpass', 600, sfx); }
        else if (name === 'siren') { for (var i = 0; i < 4; i++) { osc('square', 620, 880, t + i * 0.32, 0.16, 0.05, sfx); osc('square', 880, 620, t + i * 0.32 + 0.16, 0.16, 0.05, sfx); } }
        else if (name === 'boom') { nz(t, 0.7, 0.6, 'lowpass', 350, sfx); osc('sine', 90, 30, t, 0.7, 0.6, sfx); }
        else if (name === 'pop') { nz(t, 0.12, 0.18, 'lowpass', 1200, sfx); }
        else if (name === 'special') { osc('sine', 140, 38, t, 0.9, 0.7, sfx, 0.01); talk(t, true, sfx, 0.5); talk(t + 0.15, false, sfx, 0.5); }
        else if (name === 'break') { nz(t, 0.14, 0.35, 'highpass', 1800, sfx); nz(t + 0.03, 0.1, 0.25, 'bandpass', 600, sfx); }
        else if (name === 'heal') { [660, 880, 1100].forEach(function (f, i) { osc('sine', f, null, t + i * 0.05, 0.12, 0.14, sfx); }); }
        else if (name === 'ting') { osc('triangle', 2600, 1800, t, 0.06, 0.04, sfx); }
        else if (name === 'nope') { osc('square', 160, 120, t, 0.18, 0.08, sfx); }
        else if (name === 'over') { [392, 330, 262, 196].forEach(function (f, i) { osc('triangle', f, f * 0.98, t + i * 0.12, 0.22, 0.18, sfx); }); talk(t + 0.5, false, sfx, 0.4); }
      }
    };
  })();

  /* ------------------------------------------------------------------ DOM */
  var els = {
    dist: $('rtc-dist'), zone: $('rtc-zone'), score: $('rtc-score'), suya: $('rtc-suya'), powers: $('rtc-powers'),
    hero: $('rtc-hero'), hpFill: $('rtc-hp-fill'), hpBox: $('rtc-hp'), specials: $('rtc-special'), weapon: $('rtc-weapon'),
    bossBar: $('rtc-bossbar'), bossName: $('rtc-boss-name'), bossFill: $('rtc-boss-fill'), go: $('rtc-go'),
    fire: $('rtc-fire'), spec: $('rtc-spec'), oKos: $('rtc-o-kos'),
    banner: $('rtc-banner'), start: $('rtc-start'), pause: $('rtc-pause'), over: $('rtc-over'),
    startBtn: $('game-start'), resumeBtn: $('rtc-resume'), againBtn: $('rtc-again'), shareBtn: $('rtc-share'),
    pauseBtn: $('rtc-pause-btn'), muteBtn: $('rtc-mute'), fsBtn: $('rtc-fs'),
    best: $('rtc-best'), rank: $('rtc-rank'), overLine: $('rtc-over-line'), overKicker: $('rtc-over-kicker'),
    oDist: $('rtc-o-dist'), oScore: $('rtc-o-score'), oBest: $('rtc-o-best'),
    up: $('rtc-up'), down: $('rtc-down'), jump: $('rtc-jump'), live: $('rtc-live')
  };

  /* ------------------------------------------------------------------ state */
  var W = 0, H = 0, U = 1, dpr = 1, spdK = 1, Y = {};
  var G = null, P = null, pal = null, vignette = null;
  var far = [], mid = [], near = [], obs = [], items = [], parts = [], pops = [], clouds = [], stars = [];
  var foes = [], shots = [], eshots = [];
  var off = { hill2: 0, hill: 0, road: 0 };
  var state = 'menu', fit = FITS[load('fit', 'odumodu')] ? load('fit', 'odumodu') : 'odumodu';
  var best = load('best', 0), clock = 0, raf = 0, last = 0, inView = true;
  var landI = {};

  function laneY(l) { return Y.road + (Y.roadB - Y.road) * (0.2 + l * 0.31); }
  function laneS(l) { return 0.84 + 0.08 * l; }
  var ENT = 1.2; // cast scale relative to the road
  function entK(l) { return U * laneS(l) * ENT; }
  function playerX() { return Math.max(78 * U, W * 0.2); }
  function mult() { return G.x2 > 0 ? 2 : 1; }

  function layout() {
    Y.hz = H * 0.6; Y.mid = H * 0.615; Y.pave = H * 0.612; Y.near = H * 0.634;
    Y.kerb = H * 0.648; Y.road = H * 0.664; Y.roadB = H * 0.966;
  }

  function resize() {
    var r = stage.getBoundingClientRect();
    var nw = Math.max(280, r.width), nh = Math.max(240, r.height);
    var sx = W ? nw / W : 1;
    W = nw; H = nh; U = H / 460; spdK = clamp(W / (H * 2.0), 0.62, 1.08);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout(); sizeLow(); vignette = null;
    if (sx !== 1) [far, mid, near, obs, items, foes, shots, eshots].forEach(function (arr) { arr.forEach(function (o) { o.x *= sx; }); });
    if (state !== 'run') render();
  }

  function spawnZone() { var z = zoneInfo(G.vdist); return z.t > 0.5 ? z.b : z.a; }

  function pushFar(x) {
    var z = spawnZone(), list = z.landmarks, i = (landI[z.key] || 0) % list.length;
    landI[z.key] = i + 1;
    var sc = rand(0.82, 0.96);
    far.push({ type: list[i], x: x, sc: sc, seed: (Math.random() * 1000) | 0 });
  }
  function pushMid(x) {
    var z = spawnZone(), type = pick(z.mids), b = { type: type, x: x, seed: Math.random() * 1000, tint: rand(0, 0.35) };
    if (type === 'block') { b.w = rand(46, 84); b.h = rand(34, 66); }
    else if (type === 'tower') { b.w = rand(36, 58); b.h = rand(70, 112); }
    else if (type === 'hotel') { b.w = rand(56, 76); b.h = rand(64, 96); b.sign = pick(['WUSE 2', 'LOUNGE', 'TCM', 'SUYA', 'GRILL', 'VIBES']); }
    else if (type === 'arewa') { b.w = rand(58, 96); b.h = rand(32, 52); }
    else { b.w = 30; b.h = rand(96, 130); }
    mid.push(b);
  }
  function pushNear(x) {
    var z = spawnZone(), wts = z.nears, total = 0, k;
    for (k in wts) total += wts[k];
    var r = Math.random() * total, type = 'lamp';
    for (k in wts) { r -= wts[k]; if (r <= 0) { type = k; break; } }
    var widths = { lamp: 34, palm: 70, neem: 80, billboard: 130, suya: 100, pots: 74, flag: 50 };
    near.push({ type: type, x: x, w: widths[type], seed: Math.random() * 100, text: pick(BILLBOARDS) });
  }
  function rightEdge(arr, wfn) { var m = -Infinity; for (var i = 0; i < arr.length; i++) m = Math.max(m, arr[i].x + wfn(arr[i])); return m; }
  function farW(o) { return LANDW[o.type] * o.sc * U; }
  function midW(o) { return o.w * U; }
  function nearW(o) { return o.w * U; }

  function ensureLayers() {
    var re;
    while ((re = rightEdge(far, farW)) < W + 40) pushFar(far.length ? re + rand(10, 110) * U : W * 0.04);
    while ((re = rightEdge(mid, midW)) < W + 40) pushMid(mid.length ? re + rand(8, 70) * U : -30 * U);
    while ((re = rightEdge(near, nearW)) < W + 60) pushNear(near.length ? re + rand(60, 190) * U : 10 * U);
    far = far.filter(function (o) { return o.x + farW(o) > -20; });
    mid = mid.filter(function (o) { return o.x + midW(o) > -20; });
    near = near.filter(function (o) { return o.x + nearW(o) * 1.5 > -60; });
  }

  function buildWorld() {
    far = []; mid = []; near = []; landI = {};
    ensureLayers();
    clouds = []; for (var i = 0; i < 6; i++) clouds.push({ x: Math.random() * 1.3, y: rand(0.08, 0.38), w: rand(110, 240), s: Math.random() * 100 });
    if (!stars.length) for (var j = 0; j < 90; j++) stars.push({ x: Math.random(), y: Math.random() * 0.85, r: rand(0.5, 1.6), p: Math.random() * 7 });
  }

  function freshRun(attract) {
    var hero = FITS[fit];
    G = { t: 0, dist: 0, vdist: attract ? Math.random() * ZONE_LEN * 4 : 0, score: 0, suya: 0, speed: attract ? 210 : 260,
      spawn: 1.1, nextPower: rand(7, 10), inv: 0, shake: 0, flash: 0, combo: 0, comboT: 0, milestone: 500, slow: 1, dieT: 0,
      magnet: 0, x2: 0, rush: 0, shield: false, zone: -1, fw: 1.5, dustT: 0, sprayT: 0, smokeT: 0,
      hero: hero, hp: hero.hp, maxHp: hero.hp, specials: 1, specialT: 0, specialHit: false, weapon: null, weaponT: 0,
      fireCD: 0, fireHeld: false, pose: 'run', poseT: 0, punchN: 0, punchT: 0, kos: 0, boss: null, bossDone: 0, warns: [],
      waveLock: false, waveT: 0, goT: 0, capT: rand(9, 13) };
    P = { lane: 1, laneF: 1, z: 0, vz: 0, ph: 0, buf: 0, trail: [], trailT: 0, spin: 0 };
    obs = []; items = []; parts = []; pops = []; foes = []; shots = []; eshots = [];
    pal = blendZones(zoneInfo(G.vdist).a, zoneInfo(G.vdist).b, zoneInfo(G.vdist).t);
    buildWorld();
  }

  /* ------------------------------------------------------------------ spawning */
  function addObs(type, lane, x) { obs.push({ type: type, lane: lane, x: x, t: Math.random() * 10, seed: (Math.random() * 5) | 0 }); }
  function addItem(type, lane, x, z) { items.push({ type: type, lane: lane, x: x, z: z, t: Math.random() * 6 }); }
  function addLine(lane, x, n) { for (var i = 0; i < n; i++) addItem('suya', lane, x + i * 34 * U, 18); }
  function addArc(lane, x) { for (var i = -2; i <= 2; i++) addItem('suya', lane, x + i * 30 * U, 20 + 78 * (1 - (i * i) / 5)); }

  function spawnPattern(spx) {
    var x0 = W + 90 * U, d = clamp(G.t / 160, 0, 1), r = Math.random(), L = shuffle([0, 1, 2]), extra = 0;
    var free = L[2];
    if (G.t > 12 && Math.random() < 0.18 + d * 0.12) { spawnWave(x0, d); return 1.2; }
    if (r < 0.26) {
      addObs(pick(HIGH), L[0], x0); addLine(L[1], x0 - 30 * U, 5); free = L[2];
      if (G.t > 5 && Math.random() < 0.5) spawnFoe('grunt', L[2], x0 + 170 * U, false);
    } else if (r < 0.48 + d * 0.08) {
      addObs(pick(HIGH), L[0], x0); addObs(pick(HIGH), L[1], x0 + rand(-14, 14) * U);
      addLine(L[2], x0 - 50 * U, 4); if (Math.random() < 0.35) addItem('zobo', L[2], x0 + 110 * U, 22);
      free = L[2]; extra = 0.2;
    } else if (r < 0.76) {
      var n = Math.random() < 0.25 + d * 0.45 ? 3 : Math.random() < 0.5 ? 2 : 1;
      for (var i = 0; i < n; i++) addObs(pick(LOW), L[i], x0 + (i ? rand(-10, 10) * U : 0));
      addArc(L[0], x0); free = n < 3 ? L[2] : L[1];
      if (n < 3 && Math.random() < 0.4) addLine(L[2], x0 - 40 * U, 3);
      else if (n < 3 && Math.random() < 0.5) addObs('bag', L[2], x0 + 60 * U);
    } else if (r < 0.9) {
      var gap = spx * (0.62 - d * 0.12);
      addObs(pick(HIGH), L[0], x0); addObs(pick(LOW), L[1], x0 + gap); addObs(pick(HIGH), L[2], x0 + gap * 2);
      addLine(L[1], x0 - 20 * U, 3); addItem('zobo', L[0], x0 + gap * 1.2, 22);
      free = L[1]; extra = 0.55;
    } else {
      for (var k = 0; k < 9; k++) addItem('suya', [0, 1, 2, 1][k % 4], x0 + k * 40 * U, 18);
      if (Math.random() < 0.5) addItem('zobo', 1, x0 + 380 * U, 22);
      addObs('bag', (Math.random() * 3) | 0, x0 + 440 * U);
      free = -1;
    }
    if (G.t > G.nextPower) {
      var pw = pick(G.shield ? ['magnet', 'x2', 'rush'] : ['shield', 'shield', 'magnet', 'x2', 'rush']);
      addItem(pw, free < 0 ? 1 : free, x0 + 180 * U, 30);
      G.nextPower = G.t + rand(11, 17);
    }
    return lerp(1.3, 0.72, d) + extra;
  }

  /* ------------------------------------------------------------------ fx */
  function emit(o) { if (parts.length < (reduced ? 70 : 340)) parts.push(o); }
  function burst(x, y, n, colors, spd, kind, opt) {
    opt = opt || {};
    for (var i = 0; i < n; i++) {
      var a = opt.up ? -Math.PI / 2 + rand(-1.2, 1.2) : Math.random() * Math.PI * 2, s = spd * rand(0.35, 1) * U;
      emit({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: (opt.g == null ? 500 : opt.g) * U, life: 0, max: rand(0.5, 1) * (opt.life || 1),
        size: rand(1.5, 3.5) * U * (opt.size || 1), color: pick(colors), kind: kind || 'dot', rot: Math.random() * 6, vr: rand(-10, 10), drag: opt.drag || 0.985, scroll: opt.scroll || 0, sky: !!opt.sky });
    }
  }
  function pop(text, x, y, color, big) {
    for (var i = 0; i < pops.length; i++) if (pops[i].life < 0.5 && Math.abs(pops[i].x - x) < 160 * U && Math.abs(pops[i].y - y) < 26 * U) y = pops[i].y - 26 * U;
    pops.push({ text: text, x: x, y: y, life: 0, max: big ? 1.4 : 0.9, color: color || '#fff', big: !!big });
  }

  /* ------------------------------------------------------------------ actions */
  function lane(dir) {
    if (state !== 'run') return;
    var nl = clamp(P.lane + dir, 0, 2);
    if (nl !== P.lane) { P.lane = nl; Sound.play('lane'); }
  }
  function jump() {
    if (state !== 'run') return;
    if (P.z <= 0.01 && P.vz <= 0) {
      P.vz = 600; P.z = 0.01; Sound.play('jump');
      burst(playerX(), laneY(P.laneF), 6, ['rgba(255,255,255,0.4)', C(pal.haze, 0.5)], 90, 'dot', { up: true, g: 300, life: 0.5, scroll: 1 });
    } else P.buf = 0.14;
  }

  /* ------------------------------------------------------------------ combat
     Run-and-gun shooting, flying weapon capsules and district bosses, plus
     brawler-style punch combos, a health bar, enemy waves that hold the
     street, breakable drops and a backup special that costs health when
     you are out of stock. */
  function heal(n) { G.hp = Math.min(G.maxHp, G.hp + n); }
  function damage(n, text) {
    if (G.inv > 0 || G.specialT > 0 || state !== 'run') return false;
    var px = playerX(), k = entK(P.laneF), y = laneY(P.laneF);
    if (G.shield) {
      G.shield = false; G.inv = 1.0;
      burst(px, y - 36 * k, 26, [GOLD, '#fff6d0', '#ffd56a'], 260, 'spark', { g: 0 });
      pop('Agbada save you!', px, y - 90 * k, GOLD, true); Sound.play('shield'); return false;
    }
    G.hp = Math.max(0, G.hp - n); G.inv = 1.1; G.combo = 0;
    if (!reduced) { G.shake = 0.4; G.flash = 0.3; }
    pop(text, px + 20 * U, y - 90 * k, RED, true);
    burst(px + 10 * U, y - 30 * k, 16, ['#ffffff', RED, '#ffd56a', '#c8ccd1'], 260, 'rect', { scroll: 1 });
    Sound.play('hit');
    if (G.hp <= 0) die();
    return true;
  }

  function hit(o) {
    var def = OBS[o.type], k = entK(o.lane), y = laneY(o.lane);
    o.hit = true;
    if (G.rush > 0 || G.specialT > 0) { fling(o); G.score += 150 * mult(); pop('Comot for road!', o.x, y - 70 * k, '#00e07a'); Sound.play('smash'); if (!reduced) G.shake = 0.15; return; }
    if (G.inv > 0) return;
    if (G.shield) fling(o);
    if (damage(22, pick(def.say)) && (o.type === 'ruwa' || o.type === 'gutter')) burst(o.x, y - 20 * k, 16, ['rgba(120,180,230,0.8)', 'rgba(200,230,255,0.8)'], 240, 'dot', { up: true, scroll: 1 });
  }
  function fling(o) { o.fly = { vx: rand(260, 420) * U, vy: -rand(380, 560) * U, vr: rand(-8, 8), r: 0, dy: 0 }; }

  function dropItem(type, ln, x) { items.push({ type: type, lane: Math.round(clamp(ln, 0, 2)), x: x, z: 26, vz: 300, t: 0 }); }
  function breakBag(o) {
    if (o.hit) return;
    o.hit = true; o.gone = true;
    var k = entK(o.lane), y = laneY(o.lane), r = Math.random();
    burst(o.x, y - 18 * k, 22, ['#f2efe6', '#c81e28', '#1e46a0'], 260, 'rect', { up: true, scroll: 1 });
    Sound.play('break');
    dropItem(r < 0.3 ? 'jollof' : r < 0.55 ? 'cash' : r < 0.8 ? 'w' + pick(WKEYS) : r < 0.9 ? 'backup' : 'zobo', o.lane, o.x);
    G.score += 50 * mult();
  }
  function giveWeapon(k) {
    G.weapon = k; G.weaponT = WEAPON_TIME;
    pop(WEAPONS[k].name + '!', W / 2, H * 0.36, WEAPONS[k].color, true); Sound.play('power');
  }

  function spawnFoe(kind, ln, x, wave) {
    var def = FOES[kind], hp = def.hp * (1 + Math.floor((G.bossDone || 0) / 4) * 0.5);
    foes.push({ kind: kind, lane: ln, tl: ln, x: x, z: 0, vz: 0, vx: 0, hp: hp, max: hp, state: 'walk', t: 0, t2: 0, koT: 0,
      cd: rand(0.4, 1), laneCD: rand(0.4, 1.1), ph: Math.random() * 6, flash: 0, poseT: 0, wave: !!wave });
  }
  function spawnWave(x0, d) {
    var n = 2 + Math.round(d * 2 + Math.random());
    for (var i = 0; i < n; i++) {
      var r = Math.random(), kind = d > 0.25 && r < 0.18 ? 'bouncer' : r < 0.45 ? 'tout' : 'grunt';
      spawnFoe(kind, i % 3, x0 + i * 70 * U + rand(0, 40) * U, true);
    }
    G.waveLock = true; G.waveT = 0;
    showMsg('Vibe Killers ahead', 'Fight!', 'Clear the street to keep moving', true, true);
  }

  function meleeTarget() {
    var px = playerX(), reach = 62 * entK(P.laneF), best = null, bd = 1e9;
    foes.forEach(function (f) {
      var dx = f.x - px;
      if (f.state !== 'ko' && f.hp > 0 && Math.abs(f.lane - P.laneF) < 0.5 && dx > -12 * U && dx < reach && dx < bd) { bd = dx; best = f; }
    });
    obs.forEach(function (o) {
      var dx = o.x - px;
      if (OBS[o.type].breakable && !o.hit && Math.abs(o.lane - P.laneF) < 0.5 && dx > -12 * U && dx < reach && dx < bd) { bd = dx; best = o; }
    });
    return best;
  }
  function attack() {
    if (state !== 'run' || G.fireCD > 0 || G.specialT > 0) return;
    var tg = meleeTarget();
    if (tg) punch(tg); else shoot();
  }
  function punch(tg) {
    G.punchN = G.punchT > 0 ? G.punchN % 3 + 1 : 1; G.punchT = 0.55;
    var heavy = G.punchN === 3, k = entK(P.laneF);
    G.pose = heavy ? 'kick' : 'punch'; G.poseT = heavy ? 0.22 : 0.15; G.fireCD = heavy ? 0.3 : 0.15;
    if (tg.type) breakBag(tg);
    else hitFoe(tg, G.hero.melee * (heavy ? 2.2 : 1), heavy ? 'heavy' : 'light');
    burst(playerX() + 34 * k, laneY(P.laneF) - (P.z + 44) * k, heavy ? 12 : 6, ['#ffffff', GOLD, G.hero.shot], 220, 'spark', { g: 0, life: 0.35 });
    Sound.play(heavy ? 'kick' : 'punch');
  }
  function shoot() {
    var w = G.weapon ? WEAPONS[G.weapon] : null, px = playerX(), k = entK(P.laneF);
    var col = w ? w.color : G.hero.shot, z = P.z + 44, x = px + 30 * k;
    G.pose = 'shoot'; G.poseT = 0.2; G.fireCD = w ? w.cd : G.hero.fireCD;
    if (G.weapon === 'L') {
      shots.push({ kind: 'laser', lane: P.laneF, z: z, x: x, life: 0, max: 0.14, color: col });
      foes.forEach(function (f) { if (Math.abs(f.lane - P.laneF) < 0.5 && f.x > px && f.x < W + 20 * U && f.state !== 'ko') hitFoe(f, w.dmg, 'shot'); });
      obs.forEach(function (o) { if (OBS[o.type].breakable && Math.abs(o.lane - P.laneF) < 0.5 && o.x > px && o.x < W) breakBag(o); });
      if (G.boss && !G.boss.dying) bossHit(w.dmg);
      Sound.play('laser');
    } else if (G.weapon === 'S') {
      [-1, 0, 1].forEach(function (d) { shots.push({ kind: 'bar', lane: P.laneF, to: clamp(Math.round(P.laneF) + d, 0, 2), z: z, x: x, vx: 900 * U, dmg: w.dmg, color: col, life: 0, max: 1.4 }); });
      Sound.play('shoot');
    } else {
      var fire = G.weapon === 'F';
      shots.push({ kind: fire ? 'fire' : !w && G.hero.shotKind ? G.hero.shotKind : 'bar', lane: P.laneF, z: z + (G.weapon === 'M' ? rand(-4, 4) : 0), x: x, vx: (fire ? 620 : 960) * U, dmg: w ? w.dmg : 1, color: col, life: 0, max: 1.4 });
      Sound.play(fire ? 'fire' : 'shoot');
    }
    emit({ x: x, y: laneY(P.laneF) - z * k, vx: 0, vy: 0, g: 0, life: 0, max: 0.08, size: 7 * k, color: col, kind: 'dot', drag: 1, scroll: 0 });
  }

  function hitFoe(f, dmg, how) {
    var def = FOES[f.kind], k = entK(f.lane), y = laneY(f.lane);
    if (f.hp <= 0) return;
    f.hp -= dmg; f.flash = 0.12;
    burst(f.x, y - (f.z + 40) * k, 5, ['#ffffff', '#b388ff', GOLD], 160, 'spark', { g: 0, life: 0.3, scroll: 1 });
    if (f.hp <= 0 || (how === 'heavy' && !def.heavy)) {
      f.state = 'ko'; f.vx = (how === 'shot' ? 140 : 320) * U; f.vz = 320; f.z = Math.max(f.z, 1); f.koT = 0;
      if (f.hp <= 0) {
        G.kos++; G.score += def.score * mult();
        if (Math.random() < 0.35) pop(pick(['Oshey!', 'Sit down!', 'Wahala!', 'Commot!', 'Odogwu!', 'Na so!']), f.x, y - 90 * k, '#b388ff');
        if (Math.random() < 0.3) dropItem(pick(['suya', 'suya', 'zobo', 'cash']), f.lane, f.x);
        Sound.play('ko');
      } else Sound.play('ehit');
    } else {
      if (!def.heavy || how === 'heavy') { f.state = 'hit'; f.t2 = 0.22; f.x += (how === 'shot' ? 6 : 16) * U; }
      Sound.play('ehit');
    }
  }

  function updateFoes(dt, spx) {
    var px = playerX();
    for (var i = foes.length - 1; i >= 0; i--) {
      var f = foes[i], def = FOES[f.kind], k = entK(f.lane);
      f.t += dt; if (f.flash > 0) f.flash -= dt; if (f.poseT > 0) f.poseT -= dt; if (f.cd > 0) f.cd -= dt;
      var dx = f.x - px, same = Math.abs(f.lane - P.laneF) < 0.5;
      if (f.state === 'ko') {
        f.x += f.vx * dt - spx * dt; f.vx *= Math.pow(0.08, dt);
        if (f.z > 0 || f.vz > 0) { f.vz -= 1500 * dt; f.z = Math.max(0, f.z + f.vz * dt); if (f.z === 0) f.vz = 0; }
        else { f.koT += dt; if (f.koT > 0.8) { if (f.hp <= 0) { foes.splice(i, 1); continue; } f.state = 'walk'; f.cd = 0.7; } }
      } else if (f.state === 'hit') {
        f.x -= spx * dt; f.t2 -= dt; if (f.t2 <= 0) f.state = 'walk';
      } else {
        f.ph += dt * 9; f.laneCD -= dt;
        if (f.laneCD <= 0 && dx < W * 0.75 && dx > -10 * U) {
          var tl = Math.round(f.lane);
          if (tl !== P.lane) f.tl = tl + (P.lane > tl ? 1 : -1);
          f.laneCD = rand(0.8, 1.5);
        }
        var dl = f.tl - f.lane; if (dl) f.lane += (dl > 0 ? 1 : -1) * Math.min(Math.abs(dl), dt * 2.4);
        if ((G.rush > 0 || G.specialT > 0) && same && Math.abs(dx) < 30 * k) { hitFoe(f, 99, 'heavy'); continue; }
        if (def.ranged) {
          if (dx > W * 0.5) f.x -= (spx * 0.3 + def.speed * U) * dt;
          if (f.state === 'walk' && f.cd <= 0 && dx < W * 0.9 && dx > 60 * U) { f.state = 'wind'; f.t2 = def.wind; }
          else if (f.state === 'wind') {
            f.t2 -= dt;
            if (f.t2 <= 0) {
              f.state = 'walk'; f.cd = def.cd; f.poseT = 0.2;
              eshots.push({ kind: 'flyer', lane: Math.round(f.lane), x: f.x - 20 * k, z: 44, vx: -340 * U, low: false, dmg: def.dmg, t: 0 });
            }
          }
        } else {
          var reach = def.reach * k * (def.look.scale || 1);
          if (same && dx < reach + 4 * U && dx > -14 * U) {
            f.x = Math.max(f.x, px + reach * 0.9);
            if (f.state === 'walk' && f.cd <= 0) { f.state = 'wind'; f.t2 = def.wind; }
          } else if (f.state !== 'wind') f.x -= (spx + def.speed * U) * dt;
          if (f.state === 'wind') {
            f.t2 -= dt;
            if (f.t2 <= 0) {
              f.state = 'walk'; f.cd = def.cd; f.poseT = 0.2;
              if (same && Math.abs(f.x - px) < reach + 16 * U && P.z < 30) damage(def.dmg, pick(['Ouch!', 'Kai!', 'Wahala!', 'Na wa!']));
            }
          }
        }
      }
      if (f.x < -90 * U) foes.splice(i, 1);
    }
  }

  function updateShots(dt) {
    for (var i = shots.length - 1; i >= 0; i--) {
      var s = shots[i]; s.life += dt;
      if (s.kind === 'laser') { if (s.life >= s.max) shots.splice(i, 1); continue; }
      s.x += s.vx * dt;
      if (s.to != null) s.lane += (s.to - s.lane) * Math.min(1, dt * 9);
      var k = entK(s.lane), dead = false, j;
      for (j = 0; j < foes.length && !dead; j++) {
        var f = foes[j];
        if (f.state !== 'ko' && f.hp > 0 && Math.abs(f.lane - s.lane) < 0.5 && Math.abs(f.x - s.x) < 16 * k) { hitFoe(f, s.dmg, 'shot'); dead = true; }
      }
      for (j = 0; j < obs.length && !dead; j++) {
        var o = obs[j], d = OBS[o.type];
        if (o.fly || o.hit || Math.abs(o.lane - s.lane) >= 0.5 || Math.abs(o.x - s.x) > d.w * 0.5 * entK(o.lane)) continue;
        if (d.breakable) { breakBag(o); dead = true; }
        else if (!d.low) { dead = true; burst(s.x, laneY(s.lane) - s.z * k, 4, ['#ffffff', '#c8ccd1'], 140, 'spark', { g: 0, life: 0.25, scroll: 1 }); Sound.play('ting'); }
      }
      for (j = 0; j < items.length && !dead; j++) {
        var it = items[j];
        if (it.type === 'capsule' && !it.taken && Math.abs(it.lane - s.lane) < 0.6 && Math.abs(it.x - s.x) < 22 * k) {
          it.taken = true; dead = true;
          burst(it.x, laneY(it.lane) - it.z * k, 16, ['#ffffff', NG_GREEN, RED], 220, 'spark', { g: 0 });
          dropItem('w' + pick(WKEYS), it.lane, it.x); Sound.play('break');
        }
      }
      if (!dead && G.boss && !G.boss.dying && s.x > G.boss.x - bossHalf()) { bossHit(s.dmg); dead = true; }
      if (dead || s.x > W + 40 * U || s.life > s.max) shots.splice(i, 1);
    }
  }

  function updateEshots(dt, spx) {
    var px = playerX();
    for (var i = eshots.length - 1; i >= 0; i--) {
      var e = eshots[i]; e.t += dt;
      e.x += e.vx * dt - spx * dt * 0.5;
      if (Math.abs(e.lane - P.laneF) < 0.5 && Math.abs(e.x - px) < (e.kind === 'wave' ? 22 : 16) * U * ENT && !(e.low && P.z > 24)) {
        damage(e.dmg, e.kind === 'smoke' ? 'Gen smoke don choke you!' : e.kind === 'wave' ? 'Too loud!' : 'Flyer slap!');
        eshots.splice(i, 1); continue;
      }
      if (e.x < -60 * U) eshots.splice(i, 1);
    }
  }

  function bossScale() { return U * 0.95 * clamp(W / (H * 1.6), 0.55, 1); }
  function bossHalf() { return 92 * bossScale(); }
  function startBoss(i) {
    var def = BOSSES[i % BOSSES.length], hp = def.hp * (1 + Math.floor(i / BOSSES.length) * 0.6), px = playerX();
    G.boss = { def: def, i: i, hp: hp, max: hp, x: W + 170 * U, t: 0, atk: 2.4, n: 0, flash: 0, dying: 0, smokeT: 0 };
    G.waveLock = false;
    obs = obs.filter(function (o) { return o.fly || o.x < px + 40 * U; });
    showMsg('Warning · Boss incoming', def.name, def.sub, true);
    Sound.play('siren');
    if (!reduced) G.shake = 0.3;
  }
  function bossHit(dmg) {
    var b = G.boss;
    if (!b || b.dying) return;
    b.hp -= dmg; b.flash = 0.07; G.score += Math.round(10 * dmg) * mult();
    if (b.hp <= 0) {
      b.hp = 0; b.dying = 2; eshots = []; G.warns = [];
      foes.forEach(function (f) { hitFoe(f, 99, 'heavy'); });
      Sound.play('boom');
    }
  }
  function updateBoss(dt) {
    var b = G.boss, sc = bossScale(), tx = W - 112 * sc;
    b.t += dt; if (b.flash > 0) b.flash -= dt;
    if (b.dying > 0) {
      b.dying -= dt;
      if (Math.random() < dt * 14) { burst(b.x + rand(-80, 80) * sc, Y.roadB - rand(40, 230) * sc, 14, ['#ffd23f', '#ff8a1a', RED, '#ffffff'], 300, 'spark', { g: 200 }); Sound.play('pop'); }
      if (!reduced) G.shake = 0.2;
      if (b.dying <= 0) {
        var bonus = 5000 * (1 + Math.floor(b.i / 4));
        G.boss = null; G.bossDone++; G.score += bonus * mult(); G.specials = Math.min(3, G.specials + 1); heal(G.maxHp * 0.3);
        if (!reduced) burst(W / 2, H * 0.35, 70, [NG_GREEN, '#ffffff', GOLD, RED], 440, 'rect', { g: 380, life: 1.8, drag: 0.98 });
        showMsg('District cleared · +₦' + fmt(bonus), b.def.name + ' don fall!', 'Backup +1 · health restored', false);
        Sound.play('mile');
      }
      return;
    }
    b.x += (tx - b.x) * Math.min(1, dt * 2.2);
    if (b.def.kind === 'gen' && !reduced) {
      b.smokeT -= dt;
      if (b.smokeT <= 0) { b.smokeT = 0.09; emit({ x: b.x + 76 * sc, y: Y.roadB - 272 * sc, vx: rand(-10, 20) * U, vy: -rand(30, 60) * U, g: 0, life: 0, max: 1.6, size: rand(5, 9) * U, color: 'rgba(60,60,66,0.35)', kind: 'smoke', drag: 1, scroll: 0 }); }
    }
    if (Math.abs(b.x - tx) > 6 * U) return;
    var phase2 = b.hp < b.max * 0.5;
    b.atk -= dt;
    if (b.atk <= 0) {
      b.n++;
      if (b.n % 4 === 0) { var l1 = (Math.random() * 3) | 0; spawnFoe('grunt', l1, b.x - 60 * sc, false); spawnFoe('grunt', (l1 + 1 + ((Math.random() * 2) | 0)) % 3, b.x - 40 * sc, false); }
      else {
        var lanes = phase2 ? shuffle([0, 1, 2]).slice(0, 2) : [Math.random() < 0.6 ? P.lane : (Math.random() * 3) | 0];
        lanes.forEach(function (l) { G.warns.push({ lane: l, t: 0.8, max: 0.8, kind: b.def.shot }); });
      }
      if (b.n % 5 === 2 && !G.weapon) dropItem('w' + pick(WKEYS), (Math.random() * 3) | 0, W * 0.55);
      b.atk = (phase2 ? 1.45 : 2.1) / (1 + Math.floor(b.i / 4) * 0.25);
    }
  }
  function updateWarns(dt) {
    for (var i = G.warns.length - 1; i >= 0; i--) {
      var w = G.warns[i]; w.t -= dt;
      if (w.t > 0) continue;
      G.warns.splice(i, 1);
      if (!G.boss || G.boss.dying) continue;
      var smoke = w.kind === 'smoke';
      eshots.push({ kind: w.kind, lane: w.lane, x: G.boss.x - 80 * bossScale(), z: smoke ? 14 : 40, vx: -(smoke ? 420 : 540) * U, low: smoke, dmg: smoke ? 18 : 20, t: 0 });
      Sound.play(smoke ? 'fire' : 'laser');
    }
  }

  function special() {
    if (state !== 'run' || G.specialT > 0) return;
    if (G.specials > 0) G.specials--;
    else if (G.hp > G.maxHp * 0.3) { G.hp -= G.maxHp * 0.2; pop('Backup cost you health', playerX() + 60 * U, H * 0.42, '#ffb3b3'); }
    else { pop('No backup left!', playerX() + 60 * U, H * 0.42, RED); Sound.play('nope'); return; }
    G.specialT = 1.4; G.specialHit = false;
    if (G.hero.special === 'stomp') { P.vz = 640; P.z = 0.01; }
    pop(G.hero.specialName + '!', W / 2, H * 0.3, G.hero.shot, true);
    Sound.play('special');
  }
  function updateSpecial(dt) {
    if (G.specialT <= 0) return;
    G.specialT = Math.max(0, G.specialT - dt);
    if (!G.specialHit && G.specialT < (G.hero.special === 'stomp' ? 0.75 : 0.95)) {
      G.specialHit = true;
      foes.forEach(function (f) { if (f.x < W + 40 * U) hitFoe(f, 10, 'heavy'); });
      eshots = []; G.warns = [];
      obs.forEach(function (o) { if (!o.fly && !o.hit && o.x > 0 && o.x < W) { if (OBS[o.type].breakable) breakBag(o); else { o.hit = true; fling(o); } } });
      if (G.boss && !G.boss.dying) bossHit(G.boss.max * 0.12);
      if (!reduced) G.shake = 0.55;
      Sound.play('boom');
    }
  }

  function collect(it) {
    var y = laneY(it.lane) - it.z * entK(it.lane), m = mult();
    it.taken = true;
    if (it.type === 'suya') {
      G.suya++; G.score += 100 * m; G.combo++; G.comboT = 0.9; heal(2);
      burst(it.x, y, 8, ['#ffb347', '#e0562a', GOLD], 160, 'spark', { g: 0, life: 0.5 });
      Sound.play('suya');
      if (G.combo % 10 === 0) pop(pick(CHEERS) + ' x' + G.combo, it.x, y - 30 * U, GOLD, true);
    } else if (it.type === 'zobo') {
      G.score += 250 * m; burst(it.x, y, 14, ['#a8143c', '#ff4d7a', '#ffffff'], 200, 'spark', { g: 0, life: 0.6 });
      pop('Zobo! +₦' + 250 * m, it.x, y - 20 * U, '#ff6b8f'); Sound.play('zobo'); heal(6);
    } else if (it.type === 'jollof') {
      heal(G.maxHp * 0.4); burst(it.x, y, 16, ['#ff8a3a', '#ffd23f', '#ffffff'], 220, 'spark', { g: 0 });
      pop('Jollof! Health up', it.x, y - 20 * U, '#ff8a3a', true); Sound.play('heal');
    } else if (it.type === 'cash') {
      G.score += 1000 * m; pop('+₦' + fmt(1000 * m), it.x, y - 20 * U, '#3ddc84'); Sound.play('zobo');
    } else if (it.type === 'backup') {
      G.specials = Math.min(3, G.specials + 1); pop('Backup +1', it.x, y - 20 * U, GOLD, true); Sound.play('power');
    } else if (it.type === 'capsule') {
      giveWeapon(pick(WKEYS));
    } else if (it.type.charAt(0) === 'w' && WEAPONS[it.type.charAt(1)]) {
      giveWeapon(it.type.charAt(1));
    } else {
      var pw = POWERS[it.type];
      if (it.type === 'shield') G.shield = true; else G[it.type] = pw.dur;
      G.score += 500 * m;
      burst(it.x, y, 30, [pw.color, '#ffffff', GOLD], 300, 'spark', { g: 0 });
      pop(pw.label + '!', W / 2, H * 0.36, pw.color, true); Sound.play('power');
    }
  }

  /* ------------------------------------------------------------------ flow */
  function startRun() {
    Sound.startMusic();
    freshRun(false);
    state = 'run';
    els.start.hidden = true; els.over.hidden = true; els.pause.hidden = true;
    stage.classList.add('is-running');
    hudCache = {};
    try { stage.focus({ preventScroll: true }); } catch (e) { stage.focus(); }
    last = performance.now(); loop();
  }
  function die() { G.magnet = G.x2 = G.rush = 0; G.shield = false; G.fireHeld = false; G.warns = []; P.trail = []; state = 'dying'; G.dieT = 0; Sound.stopMusic(); Sound.play('over'); stage.classList.remove('is-running'); }
  function rankFor(d) { var r = RANKS[0]; for (var i = 0; i < RANKS.length; i++) if (d >= RANKS[i][0]) r = RANKS[i]; return r; }
  function gameOver() {
    state = 'over';
    var d = Math.floor(G.dist), r = rankFor(d), isBest = d > best;
    if (isBest) { best = d; save('best', best); }
    els.overKicker.textContent = isBest && d > 0 ? 'New personal best · Oshey!' : pick(['E don cast!', 'Wahala dey o!', 'Na wa o!', 'Omo, e reach!']);
    els.rank.textContent = r[1]; els.overLine.textContent = r[2];
    els.oDist.textContent = fmt(d); els.oKos.textContent = fmt(G.kos); els.oScore.textContent = '₦' + fmt(G.score);
    els.oBest.textContent = 'Best: ' + fmt(best) + 'm';
    els.best.textContent = fmt(best);
    els.over.hidden = false;
    els.shareBtn.textContent = 'Share Score';
    if (els.live) els.live.textContent = 'Run over. You moved ' + d + ' metres. Rank: ' + r[1] + '.';
    try { els.againBtn.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
  }
  function pause() {
    if (state !== 'run') return;
    state = 'paused'; els.pause.hidden = false; Sound.suspend(); stage.classList.remove('is-running');
    try { els.resumeBtn.focus({ preventScroll: true }); } catch (e) { /* noop */ }
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'run'; els.pause.hidden = true; Sound.resume(); stage.classList.add('is-running');
    try { stage.focus({ preventScroll: true }); } catch (e) { stage.focus(); }
    last = performance.now(); loop();
  }

  function showBanner(i) {
    var z = ZONES[i % 4], lap = Math.floor(i / 4);
    var kick = i === 0 ? 'Sannu da zuwa · Welcome to Abuja' : (lap ? 'Lap ' + (lap + 1) + ' · ' : '') + 'Now entering';
    els.banner.innerHTML = '<span class="k">' + kick + '</span><span class="n">' + z.name + '</span><span class="g">' + z.tag + ' · <b>' + z.greet + '</b></span>';
    els.banner.classList.remove('is-danger', 'is-small');
    els.banner.classList.remove('show'); void els.banner.offsetWidth; els.banner.classList.add('show');
  }

  function showMsg(kick, name, sub, danger, small) {
    els.banner.innerHTML = '<span class="k">' + kick + '</span><span class="n">' + name + '</span><span class="g">' + sub + '</span>';
    els.banner.classList.toggle('is-danger', !!danger); els.banner.classList.toggle('is-small', !!small);
    els.banner.classList.remove('show'); void els.banner.offsetWidth; els.banner.classList.add('show');
  }

  /* ------------------------------------------------------------------ update */
  function step(dt) {
    clock += dt;
    var run = state === 'run', dying = state === 'dying';
    if (dying) { G.dieT += dt; G.slow = Math.max(0.12, 1 - G.dieT * 1.5); if (G.dieT > 1.0) gameOver(); }
    var sdt = dt * (dying ? G.slow : 1);
    if (run && !G.boss) G.t += sdt;
    var base = run || dying ? 330 + 450 * (1 - Math.exp(-G.t / 90)) : 210;
    var target = base * (G.rush > 0 ? 1.6 : 1);
    if (G.boss) target = 0; else if (G.waveLock) target *= 0.3;
    G.speed += (target - G.speed) * Math.min(1, dt * 2.5);
    var spx = G.speed * U * spdK;
    if (run) { G.dist += sdt * G.speed / 12; G.vdist = G.dist; }
    else if (!dying) G.vdist += dt * 30;

    var zi = zoneInfo(G.vdist);
    pal = blendZones(zi.a, zi.b, zi.t);
    if (run && zi.i !== G.zone) { G.zone = zi.i; showBanner(zi.i); }

    var mv = spx * sdt;
    off.hill2 += mv * 0.025; off.hill += mv * 0.08; off.road += mv;
    far.forEach(function (o) { o.x -= mv * 0.085; });
    mid.forEach(function (o) { o.x -= mv * 0.22; });
    near.forEach(function (o) { o.x -= mv * 0.9; });
    ensureLayers();
    clouds.forEach(function (c) { c.x -= (mv * 0.012 + 3 * U * sdt) / W; if (c.x < -0.4) { c.x = 1.1 + Math.random() * 0.3; c.y = rand(0.08, 0.38); } });

    P.ph += sdt * (7 + G.speed / 55);

    if (run || dying) updateRun(sdt, spx);

    // ambience
    if (!reduced) {
      if (pal.neon > 0.5) { G.fw -= sdt; if (G.fw <= 0) { G.fw = rand(1.2, 2.8); burst(rand(0.15, 0.85) * W, rand(0.1, 0.36) * H, 40, ['#00e07a', '#ffffff', GOLD, RED], 150, 'spark', { g: 50, drag: 0.97, life: 1.5, sky: true }); } }
      if (pal.dust > 0.3) { G.dustT -= sdt; if (G.dustT <= 0) { G.dustT = 0.05; emit({ x: W + 10, y: rand(0.05, 0.95) * H, vx: -rand(40, 110) * U, vy: rand(-8, 8) * U, g: 0, life: 0, max: rand(4, 7), size: rand(0.8, 2.2) * U, color: C(mix3(pal.haze, WHITE, 0.3), 0.6 * pal.dust), kind: 'dot', drag: 1, scroll: 0.6 }); } }
      G.smokeT -= sdt;
      if (G.smokeT <= 0) {
        G.smokeT = 0.12;
        near.forEach(function (n) { if (n.type === 'suya' && n.x > -40 && n.x < W + 40) emit({ x: n.x + rand(-14, 14) * U, y: Y.near - 36 * U, vx: rand(-6, 6) * U, vy: -rand(18, 34) * U, g: 0, life: 0, max: rand(1.4, 2.2), size: rand(4, 7) * U, color: 'rgba(210,210,215,0.16)', kind: 'smoke', drag: 1, scroll: 0.9 }); });
      }
    }
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.life += sdt;
      if (p.life >= p.max) { parts.splice(i, 1); continue; }
      p.vx *= p.drag; p.vy *= p.drag; p.vy += p.g * sdt;
      p.x += p.vx * sdt - mv * p.scroll; p.y += p.vy * sdt; p.rot += p.vr * sdt;
      if (p.kind === 'smoke') p.size += 9 * U * sdt;
    }
    for (var j = pops.length - 1; j >= 0; j--) { var q = pops[j]; q.life += dt; q.y -= 34 * U * dt; if (q.life >= q.max) pops.splice(j, 1); }
  }

  function updateRun(dt, spx) {
    var run = state === 'run';
    if (G.inv > 0) G.inv -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.flash > 0) G.flash -= dt;
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
    if (G.magnet > 0) G.magnet = Math.max(0, G.magnet - dt);
    if (G.x2 > 0) G.x2 = Math.max(0, G.x2 - dt);
    if (G.rush > 0) { G.rush -= dt; if (G.rush <= 0) { G.rush = 0; G.inv = Math.max(G.inv, 0.8); } }
    if (G.poseT > 0) G.poseT -= dt;
    if (G.punchT > 0) G.punchT -= dt;
    if (G.fireCD > 0) G.fireCD -= dt;
    if (G.goT > 0) G.goT -= dt;
    if (G.weaponT > 0) { G.weaponT -= dt; if (G.weaponT <= 0) { G.weaponT = 0; G.weapon = null; } }
    if (run && G.fireHeld) attack();
    updateSpecial(dt);

    var dl = P.lane - P.laneF;
    if (dl) P.laneF += (dl > 0 ? 1 : -1) * Math.min(Math.abs(dl), dt * 9);
    if (P.z > 0 || P.vz > 0) {
      P.vz -= 1900 * dt; P.z += P.vz * dt; P.spin += dt * 13;
      if (P.z <= 0) {
        P.z = 0; P.vz = 0; P.spin = 0;
        burst(playerX(), laneY(P.laneF), 5, ['rgba(255,255,255,0.35)', C(pal.haze, 0.5)], 70, 'dot', { up: true, g: 300, life: 0.4, scroll: 1 });
        if (P.buf > 0) { P.buf = 0; jump(); }
      }
    }
    if (P.buf > 0) P.buf -= dt;

    if (run && !G.boss && !G.waveLock) { G.spawn -= dt; if (G.spawn <= 0) G.spawn = spawnPattern(spx); }
    var zb = zoneInfo(G.dist);
    if (run && !G.boss && G.bossDone === zb.i && G.dist / ZONE_LEN - zb.i > 0.62) startBoss(zb.i);
    if (G.boss) updateBoss(dt);
    updateWarns(dt); updateShots(dt); updateEshots(dt, spx); updateFoes(dt, spx);
    if (G.waveLock) {
      G.waveT += dt;
      if (G.waveT > 25 || !foes.some(function (f) { return f.wave && f.hp > 0; })) {
        G.waveLock = false;
        if (run) { G.goT = 2.2; G.score += 500 * mult(); Sound.play('mile'); }
      }
    }
    G.capT -= dt;
    if (run && G.capT <= 0) { if (!G.weapon) items.push({ type: 'capsule', lane: 1, x: W + 40 * U, z: 64, t: 0 }); G.capT = G.weapon ? 6 : rand(13, 19); }

    var px = playerX();
    for (var i = obs.length - 1; i >= 0; i--) {
      var o = obs[i], def = OBS[o.type], k = entK(o.lane);
      o.t += dt;
      if (o.gone) { obs.splice(i, 1); continue; }
      if (o.fly) {
        o.x += o.fly.vx * dt - spx * dt * 0.3; o.fly.vy += 1500 * U * dt; o.fly.dy += o.fly.vy * dt; o.fly.r += o.fly.vr * dt;
        if (o.fly.dy > H) { obs.splice(i, 1); continue; }
      } else {
        o.x -= spx * (1 + def.vx) * dt;
        if (run && !o.hit && Math.abs(o.lane - P.laneF) < 0.5 && Math.abs(o.x - px) < def.w * 0.5 * k + 10 * U) {
          if (def.low && P.z > def.h * 0.72) {
            if (!o.cleared) { o.cleared = true; if (Math.random() < 0.25) pop(pick(['Gbas!', 'Fly am!', 'Ehen!']), px, laneY(P.laneF) - (P.z + 90) * k, '#fff'); }
          } else if (def.breakable) breakBag(o);
          else hit(o);
        }
      }
      if (o.x < -def.w * U - 120 * U) obs.splice(i, 1);
    }

    var py = laneY(P.laneF);
    for (var j = items.length - 1; j >= 0; j--) {
      var it = items[j];
      it.t += dt;
      if (it.taken) { items.splice(j, 1); continue; }
      if (it.type === 'capsule') { it.x -= (spx * 0.35 + 70 * U) * dt; it.lane = 1 + Math.sin(it.t * 1.2) * 1.05; it.z = 64 + Math.sin(it.t * 3.4) * 8; }
      else it.x -= Math.max(spx, G.boss ? 110 * U : 0) * dt;
      if (it.vz != null) { it.vz -= 900 * dt; it.z += it.vz * dt; if (it.z < 20) { it.z = 20; it.vz = null; } }
      if (G.magnet > 0 && it.x > px - 30 * U && it.x < px + W * 0.55 && (it.type === 'suya' || it.type === 'zobo')) {
        var f = Math.min(1, dt * 7);
        it.x += (px - it.x) * f; it.lane += (P.laneF - it.lane) * f; it.z += (P.z + 34 - it.z) * f;
      }
      if (run && Math.abs(it.lane - P.laneF) < 0.5 && Math.abs(it.x - px) < 26 * U * ENT && it.z > P.z - 14 && it.z < P.z + 84) collect(it);
      if (it.x < -60 * U) items.splice(j, 1);
    }

    if (run && G.dist >= G.milestone) {
      pop(fmt(G.milestone) + 'm · ' + pick(['Yawwa!', 'We move!', 'Oshey!', 'Gbas gbos!']), W / 2, H * 0.3, GOLD, true);
      G.score += 1000 * mult();
      if (!reduced) burst(W / 2, H * 0.3, 60, [NG_GREEN, '#ffffff', GOLD, RED], 420, 'rect', { g: 380, life: 1.6, drag: 0.98 });
      Sound.play('mile'); G.milestone += 500;
    }
    if (G.x2 > 0 && !reduced) { G.sprayT -= dt; if (G.sprayT <= 0) { G.sprayT = 0.07; emit({ x: rand(0, W), y: -10, vx: rand(-30, 30) * U, vy: rand(60, 120) * U, g: 40 * U, life: 0, max: 3, size: 1, color: '#2e8b57', kind: 'note', rot: Math.random() * 6, vr: rand(-4, 4), drag: 0.995, scroll: 0.2 }); } }
    if (G.rush > 0 || P.trail.length) {
      P.trailT -= dt;
      if (P.trailT <= 0) { P.trailT = 0.035; if (G.rush > 0) P.trail.unshift({ y: py - P.z * entK(P.laneF), ph: P.ph, l: P.laneF, z: P.z }); if (P.trail.length > 5 || (G.rush <= 0 && P.trail.length)) P.trail.pop(); }
    }
    if (run && P.z === 0 && Math.random() < dt * 14) emit({ x: px - 6 * U, y: py, vx: -rand(30, 80) * U, vy: -rand(10, 40) * U, g: 120 * U, life: 0, max: 0.45, size: rand(1, 2.4) * U, color: C(mix3(pal.pave, WHITE, 0.3), 0.5), kind: 'dot', drag: 0.98, scroll: 0.5 });
  }

  /* ------------------------------------------------------------------ render */
  function drawSky() {
    var p = pal, g = ctx;
    var sk = g.createLinearGradient(0, 0, 0, Y.hz);
    sk.addColorStop(0, C(p.sky0)); sk.addColorStop(0.38, C(p.sky1)); sk.addColorStop(0.75, C(p.sky2)); sk.addColorStop(1, C(p.sky3));
    g.fillStyle = sk; g.fillRect(0, 0, W, Y.hz + 2);
    if (p.stars > 0.02) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = p.stars * (0.45 + 0.55 * Math.sin(clock * 2 + s.p)) * (1 - s.y * 0.6);
        if (a <= 0.02) continue;
        g.fillStyle = 'rgba(255,250,235,' + a + ')'; g.fillRect(s.x * W, s.y * Y.hz, s.r * U, s.r * U);
      }
    }
    var sx = W * 0.76, sy = p.sunY * Y.hz, sr = (p.night > 0.6 ? 17 : 27) * U;
    var gl = g.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 7);
    gl.addColorStop(0, C(p.sun, 0.5 - p.night * 0.3)); gl.addColorStop(0.3, C(p.sun, 0.14)); gl.addColorStop(1, C(p.sun, 0));
    g.fillStyle = gl; g.fillRect(sx - sr * 7, sy - sr * 7, sr * 14, sr * 14);
    g.fillStyle = C(p.sun, 0.95); g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill();
    if (p.night > 0.6) {
      g.fillStyle = 'rgba(160,150,140,' + ((p.night - 0.6) * 0.5) + ')';
      [[-5, -4, 4], [6, 3, 3], [-2, 7, 2.4], [7, -7, 2]].forEach(function (c) { g.beginPath(); g.arc(sx + c[0] * U, sy + c[1] * U, c[2] * U, 0, 7); g.fill(); });
    }
    if (p.cloud > 0.05) {
      clouds.forEach(function (c) {
        var cx = c.x * W, cy = c.y * Y.hz, cw = c.w * U;
        g.fillStyle = C(mix3(p.sky3, WHITE, 0.35), p.cloud * 0.35);
        ell(g, cx, cy, cw * 0.5, cw * 0.09); g.fill();
        ell(g, cx - cw * 0.12, cy - cw * 0.05, cw * 0.22, cw * 0.08); g.fill();
        ell(g, cx + cw * 0.14, cy - cw * 0.04, cw * 0.18, cw * 0.07); g.fill();
        g.fillStyle = C(p.sun, p.cloud * 0.18); ell(g, cx + cw * 0.05, cy + cw * 0.04, cw * 0.4, cw * 0.03); g.fill();
      });
    }
    if (p.neon > 0.25) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var b = 0; b < 2; b++) {
        var bx = W * (0.28 + b * 0.42), ang = -Math.PI / 2 + Math.sin(clock * 0.45 + b * 2.2) * 0.55, len = H * 1.1;
        var bg = g.createLinearGradient(bx, Y.hz, bx + Math.cos(ang) * len, Y.hz + Math.sin(ang) * len);
        bg.addColorStop(0, 'rgba(' + (b ? '255,80,140' : '120,200,255') + ',' + (0.2 * p.neon) + ')'); bg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = bg; g.beginPath(); g.moveTo(bx, Y.hz);
        g.lineTo(bx + Math.cos(ang - 0.05) * len, Y.hz + Math.sin(ang - 0.05) * len); g.lineTo(bx + Math.cos(ang + 0.05) * len, Y.hz + Math.sin(ang + 0.05) * len); g.closePath(); g.fill();
      }
      g.restore();
    }
  }

  function drawHills(offv, base, amp, col, seed) {
    var g = ctx; g.fillStyle = col; g.beginPath(); g.moveTo(0, Y.mid + 2);
    for (var x = 0; x <= W + 10; x += 10) {
      var wx = (x + offv) / U;
      var h = amp * (0.55 + 0.25 * Math.sin(wx * 0.0042 + seed) + 0.15 * Math.sin(wx * 0.011 + seed * 2) + 0.05 * Math.sin(wx * 0.03));
      g.lineTo(x, base - h * U);
    }
    g.lineTo(W, Y.mid + 2); g.closePath(); g.fill();
  }

  function drawRoad() {
    var g = ctx, p = pal;
    g.fillStyle = C(p.pave); g.fillRect(0, Y.pave, W, Y.kerb - Y.pave + 1);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    var tile = 30 * U, o1 = off.road % tile;
    for (var x = -o1; x < W; x += tile) g.fillRect(x, Y.pave, 1, Y.kerb - Y.pave);
    g.fillStyle = C(mix3(p.pave, WHITE, 0.08)); g.fillRect(0, Y.pave, W, 1.5 * U);
    var per = 40 * U, o2 = off.road % (per * 2);
    for (var k = -o2; k < W; k += per * 2) {
      g.fillStyle = C(mix3([240, 240, 236], p.road, 0.25 + p.night * 0.35)); g.fillRect(k, Y.kerb, per, Y.road - Y.kerb);
      g.fillStyle = '#121214'; g.fillRect(k + per, Y.kerb, per, Y.road - Y.kerb);
    }
    var rg = g.createLinearGradient(0, Y.road, 0, Y.roadB);
    rg.addColorStop(0, C(mix3(p.road, WHITE, 0.06))); rg.addColorStop(1, C(mix3(p.road, BLACK, 0.2)));
    g.fillStyle = rg; g.fillRect(0, Y.road, W, Y.roadB - Y.road);
    g.save(); g.translate(-(off.road % 256), Y.road); g.fillStyle = roadPat; g.fillRect(0, 0, W + 256, Y.roadB - Y.road); g.restore();
    var dashP = 74 * U, o3 = off.road % dashP;
    [0.5, 1.5].forEach(function (b) {
      var y = laneY(b) - 2 * U, s = laneS(b);
      g.fillStyle = 'rgba(245,245,240,' + (0.42 + p.night * 0.15) + ')';
      for (var x = -o3; x < W; x += dashP) g.fillRect(x, y, 38 * U * s, 3 * U * s);
    });
    g.fillStyle = 'rgba(232,197,71,0.55)'; g.fillRect(0, Y.road + 4 * U, W, 2 * U);
    for (var m = -o2; m < W; m += per * 2) {
      g.fillStyle = '#f2c230'; g.fillRect(m, Y.roadB, per, H - Y.roadB);
      g.fillStyle = '#121214'; g.fillRect(m + per, Y.roadB, per, H - Y.roadB);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, Y.roadB, W, 2 * U);
    if (p.night > 0.25) {
      g.save(); g.globalCompositeOperation = 'lighter';
      near.forEach(function (n) {
        if (n.type !== 'lamp' && n.type !== 'suya') return;
        var cx = n.x + (n.type === 'lamp' ? 22 : 0) * U, cy = Y.road + 34 * U, rx = 80 * U;
        var lg = g.createRadialGradient(cx, cy, 2, cx, cy, rx);
        var col = n.type === 'suya' ? [255, 130, 40] : p.lit;
        lg.addColorStop(0, C(col, 0.2 * p.night)); lg.addColorStop(1, C(col, 0));
        g.fillStyle = lg; g.save(); g.translate(cx, cy); g.scale(1, 0.32); g.translate(-cx, -cy); g.fillRect(cx - rx, cy - rx, rx * 2, rx * 2); g.restore();
      });
      g.restore();
    }
  }

  function drawItem(it) {
    var g = ctx, k = entK(it.lane), y = laneY(it.lane), bob = Math.sin(it.t * 4) * 3;
    var iy = y - (it.z + bob) * k;
    g.fillStyle = 'rgba(0,0,0,0.25)'; ell(g, it.x, y, 10 * k, 3 * k); g.fill();
    if (it.type !== 'suya' && it.type !== 'zobo') {
      var pw = POWERS[it.type] || { color: GLOW[it.type] || '#ffffff' }, pulse = 1 + Math.sin(it.t * 6) * 0.08;
      g.save(); g.globalCompositeOperation = 'lighter';
      var gl = g.createRadialGradient(it.x, iy, 2, it.x, iy, 34 * k * pulse);
      gl.addColorStop(0, C(hex(pw.color), 0.55)); gl.addColorStop(1, C(hex(pw.color), 0));
      g.fillStyle = gl; g.fillRect(it.x - 40 * k, iy - 40 * k, 80 * k, 80 * k); g.restore();
      g.save(); g.translate(it.x, iy); g.rotate(it.t * 1.5);
      g.strokeStyle = pw.color; g.lineWidth = 1.6 * k; g.setLineDash([4 * k, 5 * k]);
      g.beginPath(); g.arc(0, 0, 22 * k * pulse, 0, 7); g.stroke(); g.restore();
    } else {
      g.save(); g.globalCompositeOperation = 'lighter';
      var gl2 = g.createRadialGradient(it.x, iy, 1, it.x, iy, 18 * k);
      gl2.addColorStop(0, it.type === 'zobo' ? 'rgba(255,60,110,0.35)' : 'rgba(255,170,60,0.35)'); gl2.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gl2; g.fillRect(it.x - 20 * k, iy - 20 * k, 40 * k, 40 * k); g.restore();
    }
    g.save(); g.translate(it.x, iy); g.scale(k * 0.95, k * 0.95); drawIcon(g, it.type, it.t); g.restore();
  }

  function drawObs(o) {
    var g = ctx, k = entK(o.lane), y = laneY(o.lane), def = OBS[o.type];
    if (!o.fly && o.type !== 'gutter') { g.fillStyle = 'rgba(0,0,0,0.32)'; ell(g, o.x, y + 1 * k, def.w * 0.52 * k, 5 * k); g.fill(); }
    g.save();
    if (o.fly) { g.translate(o.x, y + o.fly.dy); g.rotate(o.fly.r); g.translate(0, -def.h * 0.5 * k); g.scale(k, k); g.translate(0, def.h * 0.5); }
    else { g.translate(o.x, y); g.scale(k, k); }
    drawObstacle(g, o.type, o.t, pal.night, o.seed);
    g.restore();
  }

  function drawPlayer() {
    var g = ctx, px = playerX(), k = entK(P.laneF), y = laneY(P.laneF), air = P.z > 2;
    var sh = clamp(1 - P.z / 160, 0.4, 1);
    g.fillStyle = 'rgba(0,0,0,0.38)'; ell(g, px + 2 * k, y + 1 * k, 17 * k * sh, 4.5 * k * sh); g.fill();
    for (var i = P.trail.length - 1; i >= 0; i--) {
      var tr = P.trail[i];
      g.save(); g.globalAlpha = 0.22 * (1 - i / P.trail.length); g.translate(px - (i + 1) * 13 * U, tr.y); g.scale(entK(tr.l), entK(tr.l));
      drawRunner(g, fit, tr.ph, tr.z > 2, clock); g.restore();
    }
    g.save();
    if (G && G.inv > 0 && state === 'run' && Math.floor(G.inv * 16) % 2 === 0) g.globalAlpha = 0.35;
    g.translate(px, y - P.z * k); g.scale(k, k);
    var pose = G && G.poseT > 0 ? G.pose : G && G.boss && !air ? 'stance' : 'run';
    var sprite = atlasReady(FITS[fit].atlas);
    var prog = G && G.poseT > 0 ? 1 - G.poseT / (G.pose === 'kick' ? 0.22 : G.pose === 'punch' ? 0.15 : 0.2) : clamp((600 - P.vz) / 1200, 0, 1);
    if (air && pose === 'run' && P.spin && !sprite) { g.translate(0, -36); g.rotate(P.spin); g.translate(0, 36); }
    if (G && G.magnet > 0) {
      g.strokeStyle = 'rgba(124,201,255,' + (0.25 + Math.sin(clock * 8) * 0.12) + ')'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(0, -36, 44 + Math.sin(clock * 5) * 4, 0, 7); g.stroke();
    }
    if (G && G.rush > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      var rg = g.createRadialGradient(0, -36, 4, 0, -36, 52); rg.addColorStop(0, 'rgba(0,220,120,0.4)'); rg.addColorStop(1, 'rgba(0,220,120,0)');
      g.fillStyle = rg; g.fillRect(-60, -96, 120, 120); g.restore();
    }
    drawRunner(g, fit, P.ph, air, clock, pose, prog);
    if (G && G.shield) {
      g.save(); g.globalCompositeOperation = 'lighter';
      var sg = g.createRadialGradient(0, -36, 10, 0, -36, 46); sg.addColorStop(0, 'rgba(232,197,71,0)'); sg.addColorStop(0.8, 'rgba(232,197,71,0.22)'); sg.addColorStop(1, 'rgba(232,197,71,0)');
      g.fillStyle = sg; g.fillRect(-50, -90, 100, 100); g.restore();
      g.strokeStyle = 'rgba(232,197,71,0.75)'; g.lineWidth = 1.4; ell(g, 0, -36, 30, 42); g.stroke();
      g.save(); g.translate(0, -88); g.rotate(clock * 1.6); dagi(g, 0, 0, 6, GOLD, 1.4); g.restore();
    }
    g.restore();
  }

  function drawFoe(f) {
    var g = ctx, def = FOES[f.kind], k = entK(f.lane), y = laneY(f.lane), sc = def.look.scale || 1;
    g.fillStyle = 'rgba(0,0,0,0.32)'; ell(g, f.x, y + k, 16 * k * sc, 4.5 * k); g.fill();
    var pose = f.state === 'hit' ? 'hurt' : f.state === 'wind' ? 'wind' : f.poseT > 0 ? 'punch' : 'run';
    g.save();
    if (f.hp <= 0 && f.koT > 0 && Math.floor(f.koT * 20) % 2) g.globalAlpha = 0.3;
    g.translate(f.x, y - f.z * k);
    if (f.state === 'ko') g.rotate(f.z > 0 ? 0.7 : 1.45);
    g.scale(-k, k);
    var fprog = pose === 'punch' ? 1 - f.poseT / 0.2 : pose === 'wind' ? 1 - f.t2 / def.wind : 0;
    drawRunner(g, def.look, f.ph, false, clock, pose, fprog);
    if (f.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; drawRunner(g, def.look, f.ph, false, clock, pose, fprog); }
    g.restore();
    var top = y - (f.z + 86 * sc) * k;
    if (f.state === 'wind') {
      g.fillStyle = RED; g.font = '900 ' + Math.round(16 * k) + 'px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('!', f.x, top - 6 * k);
    }
    if (f.hp > 0 && f.hp < f.max) {
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(f.x - 13 * k, top, 26 * k, 3.5 * k);
      g.fillStyle = '#b388ff'; g.fillRect(f.x - 13 * k, top, 26 * k * (f.hp / f.max), 3.5 * k);
    }
  }

  function drawShot(s) {
    var g = ctx, k = entK(s.lane), y = laneY(s.lane) - s.z * k, c = hex(s.color);
    g.save(); g.globalCompositeOperation = 'lighter';
    if (s.kind === 'laser') {
      var a = 1 - s.life / s.max, x1 = G.boss && !G.boss.dying ? G.boss.x - bossHalf() : W;
      var gr = g.createLinearGradient(0, y - 8 * k, 0, y + 8 * k);
      gr.addColorStop(0, C(c, 0)); gr.addColorStop(0.5, C(c, 0.9 * a)); gr.addColorStop(1, C(c, 0));
      g.fillStyle = gr; g.fillRect(s.x, y - 8 * k, x1 - s.x, 16 * k);
      g.fillStyle = 'rgba(255,255,255,' + a + ')'; g.fillRect(s.x, y - 1.5 * k, x1 - s.x, 3 * k);
    } else if (s.kind === 'fire') {
      var r = 10 * k * (1 + Math.sin(s.life * 30) * 0.15), fy = y + Math.sin(s.life * 18) * 5 * k;
      var fg = g.createRadialGradient(s.x, fy, 1, s.x, fy, r * 1.8);
      fg.addColorStop(0, 'rgba(255,255,220,1)'); fg.addColorStop(0.4, C(c, 0.9)); fg.addColorStop(1, C(c, 0));
      g.fillStyle = fg; g.fillRect(s.x - r * 2, fy - r * 2, r * 4, r * 4);
    } else if (s.kind === 'disc') {
      g.globalCompositeOperation = 'source-over';
      g.save(); g.translate(s.x, y); g.scale(1, 0.55); g.rotate(s.life * 30);
      g.fillStyle = '#0b0b0e'; g.beginPath(); g.arc(0, 0, 9 * k, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 6 * k, 0, 4); g.stroke();
      g.fillStyle = C(c); g.beginPath(); g.arc(0, 0, 3.4 * k, 0, 7); g.fill();
      g.restore();
      g.globalCompositeOperation = 'lighter'; g.fillStyle = C(c, 0.3); rr(g, s.x - 26 * k, y - 3 * k, 22 * k, 6 * k, 3 * k); g.fill();
    } else {
      g.fillStyle = C(c, 0.4); rr(g, s.x - 24 * k, y - 4.5 * k, 32 * k, 9 * k, 4.5 * k); g.fill();
      g.fillStyle = '#ffffff'; rr(g, s.x - 10 * k, y - 2 * k, 15 * k, 4 * k, 2 * k); g.fill();
    }
    g.restore();
  }

  function drawEshot(e) {
    var g = ctx, k = entK(e.lane), y = laneY(e.lane), ey = y - e.z * k;
    g.fillStyle = 'rgba(0,0,0,0.25)'; ell(g, e.x, y, 12 * k, 3 * k); g.fill();
    if (e.kind === 'flyer') {
      g.save(); g.translate(e.x, ey); g.rotate(e.t * 14);
      g.fillStyle = '#f5f1e6'; g.fillRect(-7 * k, -5 * k, 14 * k, 10 * k);
      g.fillStyle = '#8a4dff'; g.fillRect(-7 * k, -5 * k, 14 * k, 3.5 * k);
      g.restore();
    } else if (e.kind === 'smoke') {
      for (var i = 0; i < 5; i++) {
        var a = e.t * 10 + i * 1.26;
        g.fillStyle = i % 2 ? 'rgba(70,70,78,0.85)' : 'rgba(110,110,118,0.8)';
        g.beginPath(); g.arc(e.x + Math.cos(a) * 7 * k, ey - 6 * k + Math.sin(a) * 7 * k, 9 * k, 0, 7); g.fill();
      }
    } else {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (var j = 0; j < 3; j++) {
        g.strokeStyle = 'rgba(' + (G.boss && G.boss.def.tint ? '255,122,26' : '179,136,255') + ',' + (0.9 - j * 0.25) + ')';
        g.lineWidth = (5 - j) * k;
        g.beginPath(); g.arc(e.x + j * 10 * k, ey, 28 * k, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
      }
      g.restore();
    }
  }

  function drawWarns() {
    var g = ctx;
    G.warns.forEach(function (w) {
      var y = laneY(w.lane), k = entK(w.lane), a = 0.18 + 0.18 * Math.sin(clock * 30), x1 = G.boss ? G.boss.x - bossHalf() : W;
      g.fillStyle = 'rgba(255,40,40,' + a + ')'; g.fillRect(0, y - 22 * k, x1, 26 * k);
      g.fillStyle = 'rgba(255,255,255,' + (a + 0.3) + ')';
      for (var x = x1 - 30 * k - ((clock * 300 * U) % (40 * k)); x > 0; x -= 40 * k) {
        g.beginPath(); g.moveTo(x, y - 9 * k); g.lineTo(x - 10 * k, y - 15 * k); g.lineTo(x, y - 21 * k); g.lineTo(x + 4 * k, y - 21 * k); g.lineTo(x - 6 * k, y - 15 * k); g.lineTo(x + 4 * k, y - 9 * k); g.closePath(); g.fill();
      }
    });
  }

  function renderBoss() {
    var b = G.boss, g = ctx, sc = bossScale();
    if (!b) return;
    var hpf = b.hp / b.max;
    g.fillStyle = 'rgba(0,0,0,0.38)'; ell(g, b.x, Y.roadB - 6 * U, 110 * sc, 14 * sc); g.fill();
    g.save();
    if (b.dying > 0) g.globalAlpha = clamp(b.dying / 1.2, 0, 1);
    g.translate(b.x + (b.dying > 0 && !reduced ? rand(-4, 4) * U : 0), Y.roadB - 4 * U); g.scale(sc, sc);
    drawBoss(g, b.def, b.t, hpf);
    if (b.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; drawBoss(g, b.def, b.t, hpf); }
    g.restore();
  }

  function drawSpecial() {
    if (!G.specialT || G.specialT <= 0) return;
    var g = ctx, p = 1 - G.specialT / 1.4, kind = G.hero.special, px = playerX(), py = laneY(P.laneF);
    g.save();
    if (kind === 'truck') {
      var s = U * 1.25, tx = -260 * U + p * (W + 520 * U), ty = Y.roadB - 2 * U;
      g.save(); g.translate(tx, ty); g.scale(s, s); drawSoundTruck(g, clock); g.restore();
      g.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 3; i++) {
        var r = (clock * 2 + i / 3) % 1;
        g.strokeStyle = 'rgba(61,220,132,' + (0.6 * (1 - r)) + ')'; g.lineWidth = 4 * U;
        g.beginPath(); g.arc(tx - 28 * s, ty - 64 * s, (30 + r * 240) * U, -1.3, 1.3); g.stroke();
      }
    } else if (kind === 'stomp') {
      if (G.specialHit) {
        var q = clamp((0.75 - G.specialT) / 0.75, 0, 1);
        for (var j = 0; j < 3; j++) {
          var rad = q * 1.3 - j * 0.12;
          if (rad <= 0) continue;
          g.strokeStyle = 'rgba(255,59,59,' + (0.75 * (1 - q)) + ')'; g.lineWidth = (9 - j * 2) * U;
          ell(g, px, py, rad * W, rad * W * 0.14); g.stroke();
        }
        g.strokeStyle = 'rgba(20,20,24,' + (0.8 * (1 - q)) + ')'; g.lineWidth = 2 * U;
        for (var c = 0; c < 6; c++) { var ang = -0.5 + c * 0.2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(ang) * 140 * U * q, py + Math.sin(ang) * 26 * U * q); g.stroke(); }
      }
    } else if (kind === 'wave') {
      var wx = px + p * W * 1.3, cy = (Y.road + Y.roadB) / 2 - 30 * U, hh = (Y.roadB - Y.road) * 0.95;
      g.globalCompositeOperation = 'lighter';
      for (var n = 0; n < 4; n++) {
        g.strokeStyle = C(hex(G.hero.shot), 0.6 - n * 0.13); g.lineWidth = (12 - n * 2.5) * U;
        g.beginPath(); g.ellipse(wx - n * 28 * U, cy, 44 * U, hh, 0, -Math.PI / 2, Math.PI / 2); g.stroke();
      }
      g.fillStyle = C(hex(G.hero.shot), 0.5); g.font = '900 ' + Math.round(30 * U) + 'px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(fit === 'romie' ? 'DROP' : 'YPSZN', wx - 40 * U, cy);
    }
    g.restore();
  }

  function drawParticle(p) {
    var g = ctx, a = 1 - p.life / p.max;
    if (p.kind === 'smoke') { g.fillStyle = p.color; g.globalAlpha = a; g.beginPath(); g.arc(p.x, p.y, p.size, 0, 7); g.fill(); g.globalAlpha = 1; return; }
    g.globalAlpha = Math.min(1, a * 1.5);
    if (p.kind === 'spark') {
      g.strokeStyle = p.color; g.lineWidth = p.size * 0.7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); g.stroke();
    } else if (p.kind === 'rect') {
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.color; g.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size); g.restore();
    } else if (p.kind === 'note') {
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(Math.cos(p.rot * 2), 1);
      g.fillStyle = '#2e8b57'; g.fillRect(-9 * U, -4.5 * U, 18 * U, 9 * U);
      g.fillStyle = '#a7e3bf'; g.fillRect(-7 * U, -2.5 * U, 4 * U, 5 * U);
      g.restore();
    } else { g.fillStyle = p.color; g.beginPath(); g.arc(p.x, p.y, p.size, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }

  // The world is drawn into a low-resolution buffer (~340 lines, 16-bit console density) and scaled up
  // with nearest-neighbour sampling, so every layer shares one chunky pixel grid. Text pops stay crisp on top.
  var low = document.createElement('canvas'), lowCtx = low.getContext('2d'), mainCtx = ctx, LOW_LINES = 340;
  function sizeLow() {
    var px = Math.max(1, H / LOW_LINES);
    low.width = Math.max(1, Math.round(W / px)); low.height = Math.max(1, Math.round(H / px));
    lowCtx.setTransform(low.width / W, 0, 0, low.height / H, 0, 0);
  }
  function render() {
    if (!G) return;
    var amp = G.shake > 0 && !reduced ? G.shake * 22 * U : 0;
    G.shx = (Math.random() - 0.5) * amp; G.shy = (Math.random() - 0.5) * amp;
    ctx = lowCtx;
    renderScene();
    ctx = mainCtx;
    var g = ctx;
    g.save(); g.imageSmoothingEnabled = false;
    g.drawImage(low, 0, 0, W, H);
    g.imageSmoothingEnabled = true;
    // Actors and effects draw at full resolution so the sprites keep their pixel detail.
    g.save(); g.translate(G.shx, G.shy); renderActors(); g.restore();
    renderPops(g);
    g.restore();
  }
  function renderScene() {
    var g = ctx, p = pal;
    g.save();
    g.translate(G.shx || 0, G.shy || 0);
    drawSky();
    parts.forEach(function (q) { if (q.sky) drawParticle(q); });
    drawHills(off.hill2, Y.hz - 4 * U, 70, C(mix3(p.hill2, p.sky3, 0.25)), 1.3);
    far.forEach(function (o) {
      g.save(); g.translate(o.x, Y.hz + 6 * U); g.scale(U * o.sc, U * o.sc); drawLandmark(g, o.type, p, clock, o.seed); g.restore();
    });
    var hz = g.createLinearGradient(0, Y.hz - 150 * U, 0, Y.mid);
    hz.addColorStop(0, C(p.haze, 0)); hz.addColorStop(1, C(p.haze, p.hazeA * 0.9));
    g.fillStyle = hz; g.fillRect(0, Y.hz - 150 * U, W, Y.mid - Y.hz + 150 * U);
    drawHills(off.hill, Y.mid, 34, C(p.hill), 4.1);
    mid.forEach(function (b) { g.save(); g.translate(b.x, Y.mid); g.scale(U, U); drawBuilding(g, b, p, clock); g.restore(); });
    if (p.neon > 0.2) {
      var ng = g.createLinearGradient(0, Y.hz - 60 * U, 0, Y.mid);
      ng.addColorStop(0, C(p.haze, 0)); ng.addColorStop(1, C(p.haze, 0.12 * p.neon));
      g.fillStyle = ng; g.fillRect(0, Y.hz - 60 * U, W, Y.mid - Y.hz + 60 * U);
    }
    drawRoad();
    near.forEach(function (n) { g.save(); g.translate(n.x, Y.near); g.scale(U, U); drawNear(g, n, p, clock); g.restore(); });
    drawWarns();
    g.restore();
  }
  function renderActors() {
    var g = ctx, p = pal;
    g.save();
    renderBoss();

    var list = [];
    foes.forEach(function (f) { list.push([f.state === 'ko' && f.z > 0 ? f.lane + 0.04 : f.lane, 3, f]); });
    shots.forEach(function (s) { list.push([s.lane + 0.03, 4, s]); });
    eshots.forEach(function (e) { list.push([e.lane + 0.03, 5, e]); });
    obs.forEach(function (o) { list.push([o.fly ? 9 : o.lane, 0, o]); });
    items.forEach(function (it) { list.push([it.lane + 0.01, 1, it]); });
    list.push([P.laneF + 0.02, 2, null]);
    list.sort(function (a, b) { return a[0] - b[0]; });
    list.forEach(function (e) { var t = e[1]; if (t === 0) drawObs(e[2]); else if (t === 1) drawItem(e[2]); else if (t === 2) drawPlayer(); else if (t === 3) drawFoe(e[2]); else if (t === 4) drawShot(e[2]); else drawEshot(e[2]); });
    drawSpecial();

    parts.forEach(function (q) { if (!q.sky) drawParticle(q); });

    if (p.dust > 0.05) { g.fillStyle = C(p.haze, p.dust * 0.14); g.fillRect(0, 0, W, H); }
    if (G.rush > 0 && !reduced) {
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1.5 * U;
      for (var i = 0; i < 14; i++) { var ly = hash(i * 7 + Math.floor(clock * 20)) * H, lx = hash(i * 13 + Math.floor(clock * 20)) * W; g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 90 * U, ly); g.stroke(); }
    }
    if (!vignette) { vignette = g.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.8); vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.5)'); }
    g.fillStyle = vignette; g.fillRect(0, 0, W, H);
    if (G.flash > 0) { g.fillStyle = 'rgba(255,40,40,' + (G.flash * 0.7) + ')'; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  function renderPops(g) {
    pops.forEach(function (q) {
      var a = 1 - q.life / q.max, sc = q.big ? 1 + Math.max(0, 0.3 - q.life) * 1.2 : 1;
      g.font = '900 ' + Math.round((q.big ? 22 : 15) * U) + 'px "Inter Tight", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var hw = g.measureText(q.text.toUpperCase()).width * sc / 2 + 8 * U, qx = hw * 2 > W ? W / 2 : clamp(q.x, hw, W - hw);
      g.save(); g.globalAlpha = Math.min(1, a * 2); g.translate(qx, q.y); g.scale(sc, sc);
      g.lineWidth = 4 * U; g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineJoin = 'round'; g.strokeText(q.text.toUpperCase(), 0, 0);
      g.fillStyle = q.color; g.fillText(q.text.toUpperCase(), 0, 0);
      g.restore();
    });
  }

  /* ------------------------------------------------------------------ HUD */
  var hudCache = {};
  var powerEls = {};
  (function buildPowers() {
    if (!els.powers) return;
    Object.keys(POWERS).forEach(function (key) {
      var d = document.createElement('div'); d.className = 'rtc-pw'; d.hidden = true; d.style.setProperty('--pw', POWERS[key].color);
      d.innerHTML = '<canvas width="40" height="40" data-icon="' + key + '"></canvas><span>' + POWERS[key].label + '</span><i><b></b></i>';
      els.powers.appendChild(d); powerEls[key] = { el: d, bar: d.querySelector('b') };
    });
  })();
  function setText(key, v) { if (hudCache[key] !== v && els[key]) { hudCache[key] = v; els[key].textContent = v; } }
  function updateHud() {
    if (!G) return;
    setText('dist', fmt(G.dist)); setText('score', fmt(G.score)); setText('suya', String(G.suya));
    setText('zone', ZONES[zoneInfo(G.vdist).i % 4].name);
    var hpf = clamp(G.hp / G.maxHp, 0, 1);
    if (hudCache.hp !== Math.round(hpf * 200)) {
      hudCache.hp = Math.round(hpf * 200);
      els.hpFill.style.width = (hpf * 100) + '%';
      els.hpBox.classList.toggle('is-low', hpf < 0.3);
      els.hpBox.setAttribute('aria-valuenow', String(Math.round(hpf * 100)));
    }
    setText('hero', G.hero.name);
    setText('specials', '\u2605 ' + G.specials);
    if (hudCache.weapon !== G.weapon) {
      hudCache.weapon = G.weapon;
      els.weapon.hidden = !G.weapon;
      if (G.weapon) { els.weapon.textContent = G.weapon + ' · ' + WEAPONS[G.weapon].name; els.weapon.style.setProperty('--wc', WEAPONS[G.weapon].color); }
    }
    var bossOn = !!(G.boss && state !== 'menu');
    if (els.bossBar.hidden === bossOn) els.bossBar.hidden = !bossOn;
    if (bossOn) { setText('bossName', G.boss.def.name); els.bossFill.style.width = (G.boss.hp / G.boss.max * 100) + '%'; }
    var goOn = G.goT > 0 && state === 'run';
    if (els.go.hidden === goOn) els.go.hidden = !goOn;
    Object.keys(powerEls).forEach(function (k) {
      var on = k === 'shield' ? G.shield : G[k] > 0, pe = powerEls[k];
      if (pe.el.hidden === on) pe.el.hidden = !on;
      if (on) pe.bar.style.width = (k === 'shield' ? 100 : (G[k] / POWERS[k].dur) * 100) + '%';
    });
  }

  /* ------------------------------------------------------------------ loop */
  function loop() { if (!raf && inView && !document.hidden && state !== 'paused') raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var animating = state === 'run' || state === 'dying' || !reduced;
    if (animating) step(dt);
    render(); updateHud();
    if (state === 'menu') drawFitPreviews();
    if (animating) loop();
  }

  /* ------------------------------------------------------------------ previews & legend */
  var fitBtns = Array.prototype.slice.call(stage.querySelectorAll('.rtc-fit'));
  function drawFitPreviews() {
    fitBtns.forEach(function (b) {
      var c = b.querySelector('canvas'); if (!c) return;
      var g = c.getContext('2d'), pr = Math.min(window.devicePixelRatio || 1, 2), cw = c.clientWidth || 64, ch = c.clientHeight || 72;
      if (c.width !== Math.round(cw * pr)) { c.width = Math.round(cw * pr); c.height = Math.round(ch * pr); }
      g.setTransform(pr, 0, 0, pr, 0, 0); g.clearRect(0, 0, cw, ch);
      var sel = b.getAttribute('data-fit') === fit;
      g.fillStyle = 'rgba(0,0,0,0.35)'; ell(g, cw / 2, ch - 6, 16, 3.5); g.fill();
      g.save(); g.translate(cw / 2, ch - 6); var sc = (ch - 10) / (atlasReady((FITS[b.getAttribute("data-fit")] || {}).atlas) ? 94 : 78); g.scale(sc, sc);
      drawRunner(g, b.getAttribute('data-fit'), sel && !reduced ? clock * 10 : 0.9, false, clock); g.restore();
    });
  }
  function selectFit(k) {
    if (!FITS[k]) return;
    fit = k; save('fit', k);
    fitBtns.forEach(function (b) { b.setAttribute('aria-checked', b.getAttribute('data-fit') === k ? 'true' : 'false'); });
    drawFitPreviews();
  }
  fitBtns.forEach(function (b) { b.addEventListener('click', function () { selectFit(b.getAttribute('data-fit')); }); });
  selectFit(fit);

  function paintIcons(root) {
    Array.prototype.slice.call(root.querySelectorAll('canvas[data-icon]')).forEach(function (c) {
      var type = c.getAttribute('data-icon'), g = c.getContext('2d'), pr = Math.min(window.devicePixelRatio || 1, 2);
      if (!c._cw) { c._cw = c.clientWidth || c.width; c._ch = c.clientHeight || c.height; }
      var cw = c._cw, ch = c._ch;
      c.width = Math.round(cw * pr); c.height = Math.round(ch * pr); g.setTransform(pr, 0, 0, pr, 0, 0); g.clearRect(0, 0, cw, ch);
      g.save();
      if (type.indexOf('foe-') === 0) {
        var fd = FOES[type.slice(4)], s3 = (ch - 4) / (84 * (fd.look.scale || 1));
        g.translate(cw / 2, ch - 2); g.scale(-s3, s3); drawRunner(g, fd.look, 0.8, false, 0, 'punch');
      } else if (type.indexOf('boss-') === 0) {
        c._cw = c._cw;
        var s4 = (ch - 4) / 280; g.translate(cw / 2, ch - 2); g.scale(s4, s4); drawBoss(g, { kind: type.slice(5) }, 0.5, 1);
      } else if (OBS[type]) {
        var def = OBS[type], sc = Math.min((cw - 4) / def.w, (ch - 6) / Math.max(def.h + 6, 30));
        g.translate(cw / 2, ch / 2 + Math.max(def.h, 20) * sc / 2); g.scale(sc, sc);
        drawObstacle(g, type, 0.4, 0, 0);
      } else { g.translate(cw / 2, ch / 2); var s2 = Math.min(cw, ch) / 38; g.scale(s2, s2); drawIcon(g, type, 0.3); }
      g.restore();
    });
  }

  /* ------------------------------------------------------------------ input */
  function inViewport() { var r = stage.getBoundingClientRect(); return r.bottom > 80 && r.top < window.innerHeight - 80; }
  window.addEventListener('keydown', function (e) {
    var k = e.key, tag = e.target && e.target.tagName;
    if (/INPUT|TEXTAREA|SELECT/.test(tag || '')) return;
    if (state === 'run') {
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { lane(-1); e.preventDefault(); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { lane(1); e.preventDefault(); }
      else if (k === ' ' || k === 'Spacebar' || k === 'ArrowRight' || k === 'd' || k === 'D') { jump(); e.preventDefault(); }
      else if (k === 'x' || k === 'X' || k === 'j' || k === 'J') { if (!e.repeat) { G.fireHeld = true; attack(); } e.preventDefault(); }
      else if (k === 'c' || k === 'C' || k === 'k' || k === 'K') { special(); e.preventDefault(); }
      else if (k === 'p' || k === 'P' || k === 'Escape') { pause(); e.preventDefault(); }
      else if (k === 'm' || k === 'M') toggleMute();
    } else if (state === 'paused') {
      if (k === 'p' || k === 'P' || k === 'Escape') { resume(); e.preventDefault(); }
    } else if ((state === 'menu' || state === 'over') && (k === ' ' || k === 'Enter') && inViewport()) {
      if (tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault(); startRun();
    }
  });

  window.addEventListener('keyup', function (e) { if (G && /^[xXjJ]$/.test(e.key)) G.fireHeld = false; });
  window.addEventListener('blur', function () { if (G) G.fireHeld = false; });

  // Touch and mouse: left 40% of the stage jumps, the rest attacks (hold to keep firing); swipe up/down to change lanes.
  var ptr = null;
  stage.addEventListener('pointerdown', function (e) {
    if (state !== 'run' || (e.target.closest && e.target.closest('button, .rtc-overlay'))) return;
    var r = stage.getBoundingClientRect(), fire = e.clientX - r.left > r.width * 0.4;
    ptr = { x: e.clientX, y: e.clientY, id: e.pointerId, used: false, fire: fire };
    if (fire) { G.fireHeld = true; attack(); }
  });
  stage.addEventListener('pointermove', function (e) {
    if (!ptr || ptr.used || e.pointerId !== ptr.id) return;
    var dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) { lane(dy < 0 ? -1 : 1); ptr.used = true; G.fireHeld = false; }
  });
  window.addEventListener('pointerup', function (e) {
    if (!ptr || e.pointerId !== ptr.id) return;
    if (G) G.fireHeld = false;
    if (!ptr.used) { var dy = e.clientY - ptr.y; if (Math.abs(dy) > 24) lane(dy < 0 ? -1 : 1); else if (!ptr.fire) jump(); }
    ptr = null;
  });
  window.addEventListener('pointercancel', function () { ptr = null; if (G) G.fireHeld = false; });
  function padBtn(el, fn) { if (el) el.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); fn(); }); }
  padBtn(els.up, function () { lane(-1); }); padBtn(els.down, function () { lane(1); }); padBtn(els.jump, jump);
  padBtn(els.fire, function () { G.fireHeld = true; attack(); }); padBtn(els.spec, special);
  if (els.fire) ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { els.fire.addEventListener(ev, function () { if (G) G.fireHeld = false; }); });

  var ICON_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function syncMute() { if (!els.muteBtn) return; var m = Sound.muted(); els.muteBtn.innerHTML = m ? ICON_OFF : ICON_ON; els.muteBtn.setAttribute('aria-label', m ? 'Turn sound on' : 'Mute sound'); els.muteBtn.setAttribute('aria-pressed', m ? 'true' : 'false'); }
  function toggleMute() { Sound.setMuted(!Sound.muted()); syncMute(); }
  syncMute();
  if (els.muteBtn) els.muteBtn.addEventListener('click', toggleMute);
  if (els.pauseBtn) els.pauseBtn.addEventListener('click', function () { if (state === 'run') pause(); else if (state === 'paused') resume(); });
  var fsOK = !!(stage.requestFullscreen || stage.webkitRequestFullscreen);
  if (els.fsBtn) {
    if (!fsOK) els.fsBtn.hidden = true;
    els.fsBtn.addEventListener('click', function () {
      var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage);
    });
  }
  els.startBtn.addEventListener('click', startRun);
  if (els.againBtn) els.againBtn.addEventListener('click', startRun);
  if (els.resumeBtn) els.resumeBtn.addEventListener('click', resume);
  if (els.shareBtn) els.shareBtn.addEventListener('click', function () {
    var d = Math.floor(G ? G.dist : 0), r = rankFor(d)[1];
    var url = location.href.split('#')[0] + '#play';
    var text = 'I moved ' + fmt(d) + 'm through Abuja and KO\'d ' + fmt(G ? G.kos : 0) + ' Vibe Killers in Run The Capital by @thecapitalmvmt. Rank: ' + r + '. Oya, beat me!';
    if (navigator.share) { navigator.share({ title: 'Run The Capital', text: text, url: url }).catch(function () { /* dismissed */ }); return; }
    var done = function () { els.shareBtn.textContent = 'Copied!'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text + ' ' + url).then(done, function () { els.shareBtn.textContent = 'Copy failed'; });
  });

  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); else loop(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (!inView) pause(); else { last = performance.now(); loop(); }
    }, { threshold: 0.25 }).observe(stage);
  }
  if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); }).observe(stage);
  else window.addEventListener('resize', resize);

  /* ------------------------------------------------------------------ boot */
  els.best.textContent = fmt(best);
  resize();
  freshRun(true);
  render(); updateHud(); drawFitPreviews();
  paintIcons(document);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintIcons(document); render(); });
  last = performance.now(); loop();
})();
