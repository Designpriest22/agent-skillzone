/*
 * Destination Nigeria — standalone export runtime.
 *
 * The exported home page is a static snapshot of the Next.js render. This small
 * script restores the interactions that matter offline: welcome screen and sound,
 * hero film, destination filters, shortlist, state map, site search, mobile menu,
 * scroll reveals and destination details (shown in a dialog). Pages that exist
 * only on the full website show a short notice instead of a broken link.
 * Data is injected as window.__DN__ by scripts/export-standalone.ts.
 */
(function () {
  "use strict";
  var D = window.__DN__;
  if (!D) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  // ——— illustration plates (raw SVG → blob URLs, created on demand) ———
  var plateUrls = {};
  function plate(key) {
    if (!plateUrls[key] && D.plates[key]) plateUrls[key] = URL.createObjectURL(new Blob([D.plates[key]], { type: "image/svg+xml" }));
    return plateUrls[key] || "";
  }

  // ——— toast for pages that live on the full site ———
  var toast = document.createElement("div");
  toast.className = "dn-toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  var toastTimer;
  function notify(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 3800);
  }

  // ——— sound ———
  var audio;
  function play() {
    try {
      if (!audio) { audio = new Audio(D.sound); audio.volume = 0.7; }
      audio.currentTime = 0;
      var p = audio.play();
      if (p && p.catch) p.catch(function () {});
    } catch { /* audio unavailable */ }
  }
  function setSound(on, andPlay) {
    store.set("dn:sound", on ? "on" : "off");
    $$(".sound-toggle").forEach(function (b) { b.setAttribute("aria-pressed", on ? "true" : "false"); });
    if (on && andPlay) play();
    if (!on && audio) audio.pause();
  }
  $$(".sound-toggle").forEach(function (b) {
    b.setAttribute("aria-pressed", store.get("dn:sound") === "on" ? "true" : "false");
    b.addEventListener("click", function () { setSound(b.getAttribute("aria-pressed") !== "true", true); });
  });

  // ——— hero film ———
  var hero = $(".hero");
  var film = $(".hero-film");
  var index = 0;
  var paused = reduceMotion;
  var timer;
  var heroVisible = true;
  if (film && D.scenes) {
    var existing = $(".hero-scene", film);
    D.scenes.forEach(function (s, i) {
      if (i === 0 && existing) return;
      var div = document.createElement("div");
      div.className = "hero-scene";
      div.innerHTML = s.svg;
      film.appendChild(div);
    });
  }
  var scenes = film ? $$(".hero-scene", film) : [];
  var ticks = $$(".scene-ticks button");
  var caption = $(".hero-controls p.scene-caption");
  var pauseBtn = $(".hero-controls .icon-btn");
  var PLAY = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg><span class="visually-hidden">Play background film</span>';
  var PAUSE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg><span class="visually-hidden">Pause background film</span>';
  function showScene(i) {
    index = (i + scenes.length) % scenes.length;
    scenes.forEach(function (el, k) { el.classList.toggle("is-active", k === index); });
    ticks.forEach(function (t, k) { if (k === index) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current"); });
    if (caption && D.scenes[index]) caption.textContent = D.scenes[index].caption + " · Illustration";
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused && heroVisible && scenes.length > 1) timer = setTimeout(function () { showScene(index + 1); }, 7000);
  }
  function renderPause() {
    if (!pauseBtn) return;
    pauseBtn.innerHTML = paused ? PLAY : PAUSE;
    pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
    if (hero) hero.classList.toggle("is-paused", paused);
  }
  if (pauseBtn) pauseBtn.addEventListener("click", function () { paused = !paused; renderPause(); schedule(); });
  ticks.forEach(function (t, k) { t.addEventListener("click", function () { showScene(k); }); });
  var describe = $('button[aria-controls="hero-transcript"]');
  var transcript = $("#hero-transcript");
  if (describe && transcript) {
    describe.addEventListener("click", function () {
      var open = transcript.hasAttribute("hidden");
      if (open) transcript.removeAttribute("hidden"); else transcript.setAttribute("hidden", "");
      describe.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) { heroVisible = !!(e[0] && e[0].isIntersecting); schedule(); }, { threshold: 0.05 }).observe(hero);
  }
  renderPause();
  function replayHero() {
    $$(".hero [data-enter]").forEach(function (el) { el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; });
  }

  // ——— welcome ———
  var welcome = $("#dn-welcome");
  function startFilm() { showScene(0); }
  if (welcome && typeof welcome.showModal === "function") {
    welcome.removeAttribute("open");
    var btns = $$("button", welcome);
    var enter = function (withSound) {
      store.set("dn:welcomed", "1");
      setSound(withSound, withSound);
      welcome.close();
      replayHero();
      startFilm();
    };
    if (btns[0]) btns[0].addEventListener("click", function () { enter(true); });
    if (btns[1]) btns[1].addEventListener("click", function () { enter(false); });
    welcome.addEventListener("cancel", function (e) { e.preventDefault(); enter(false); });
    if (store.get("dn:welcomed") !== "1") welcome.showModal(); else startFilm();
  } else {
    startFilm();
  }

  // ——— shortlist ———
  function shortlist() {
    try { var v = JSON.parse(store.get("dn:shortlist:v1") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function isSaved(slug) { return shortlist().some(function (s) { return s.slug === slug; }); }
  function toggleSaved(slug) {
    var list = shortlist();
    var has = list.some(function (s) { return s.slug === slug; });
    list = has ? list.filter(function (s) { return s.slug !== slug; }) : list.concat([{ slug: slug, days: 1, note: "" }]);
    store.set("dn:shortlist:v1", JSON.stringify(list));
    renderBadge();
    return !has;
  }
  function renderBadge() {
    var link = $(".shortlist-count");
    if (!link) return;
    var n = shortlist().length;
    var badge = $("[data-count]", link);
    if (n && !badge) { badge = document.createElement("span"); badge.setAttribute("data-count", ""); badge.setAttribute("aria-hidden", "true"); link.appendChild(badge); }
    if (badge) { if (n) badge.textContent = String(n); else badge.remove(); }
    link.setAttribute("aria-label", "Trip shortlist, " + n + " saved");
  }
  renderBadge();
  function saveButton(d) {
    var saved = isSaved(d.slug);
    return '<button type="button" class="shortlist-btn" aria-pressed="' + saved + '" data-slug="' + d.slug + '" data-name="' + esc(d.name) + '">' +
      '<span class="dot" aria-hidden="true"></span><span aria-hidden="true">' + (saved ? "Saved" : "Save") + "</span>" +
      '<span class="visually-hidden">' + (saved ? "Remove " : "Save ") + esc(d.name) + (saved ? " from" : " to") + " trip shortlist</span></button>";
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".shortlist-btn[data-slug]");
    if (!b) return;
    var added = toggleSaved(b.getAttribute("data-slug"));
    var name = b.getAttribute("data-name");
    b.setAttribute("aria-pressed", added ? "true" : "false");
    b.children[1].textContent = added ? "Saved" : "Save";
    b.children[2].textContent = (added ? "Remove " : "Save ") + name + (added ? " from" : " to") + " trip shortlist";
    notify(added ? name + " saved to your trip shortlist." : name + " removed from your shortlist.");
  });

  // ——— destination explorer ———
  var normalise = function (s) { return String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim(); };
  var section = $("#find-your-nigeria");
  var f = { q: "", cat: "", zone: "", state: "" };
  var qInput = $("#dest-q"), zoneSel = $("#dest-zone"), stateSel = $("#dest-state");
  var grid = section && $(".card-grid", section);
  var count = section && $("p.mono.muted[aria-live]", section);
  var seeAll = section && $('a.btn[href="#find-your-nigeria"], a.btn[data-full-site-path^="/destinations"]', section);
  var showAll = false;
  function filtered() {
    var q = normalise(f.q);
    return D.destinations.filter(function (d) {
      if (f.cat && d.categories.indexOf(f.cat) < 0) return false;
      if (f.zone && d.zone !== f.zone) return false;
      if (f.state && d.state !== f.state) return false;
      if (!q) return true;
      var hay = normalise([d.name, d.summary, d.stateName, d.locality || "", D.zones[d.zone], d.categories.map(function (c) { return D.categories[c].label; }).join(" ")].join(" "));
      return q.split(" ").every(function (t) { return hay.indexOf(t) >= 0; });
    });
  }
  function card(d) {
    return '<article class="dest-card"><div style="position:relative"><div class="plate"><img src="' + plate(d.plateKey) + '" alt="" width="1600" height="1000" loading="lazy" decoding="async"><span class="plate-tag" aria-hidden="true">Illustration</span></div>' +
      '<span class="tag tag--glass card-loc">' + esc(d.stateLabel) + "</span>" + saveButton(d) + "</div>" +
      '<h3><a href="#" data-full-site-path="/destinations/' + d.slug + '">' + esc(d.name) + "</a></h3>" +
      '<p class="summary">' + esc(d.summary) + '</p><div class="card-foot">' +
      d.categories.slice(0, 2).map(function (c) { return '<span class="tag">' + esc(D.categories[c].short) + "</span>"; }).join("") + "</div></article>";
  }
  function renderExplorer() {
    if (!grid) return;
    var list = filtered();
    var limit = showAll ? list.length : 8;
    var empty = $(".dn-empty", section);
    if (list.length === 0) {
      grid.innerHTML = "";
      if (!empty) {
        empty = document.createElement("div");
        empty.className = "empty dn-empty";
        empty.innerHTML = "<p><strong>Nothing matches those filters yet.</strong> The portfolio is growing as states and operators verify new destinations.</p>" +
          '<div class="cluster"><button type="button" class="btn btn--forest btn--sm" data-clear>Clear filters</button></div>';
        grid.parentNode.insertBefore(empty, grid);
      }
    } else {
      if (empty) empty.remove();
      grid.innerHTML = list.slice(0, limit).map(card).join("");
    }
    if (count) count.textContent = (list.length === 0 ? "No destinations match" : list.length + " destination" + (list.length === 1 ? "" : "s")) + (list.length > limit ? " · showing " + limit : "");
    if (seeAll) {
      seeAll.style.display = list.length > limit ? "" : "none";
      seeAll.innerHTML = "See all " + list.length + ' destinations <span class="arrow" aria-hidden="true">→</span>';
    }
    $$('.chip-row[role="group"] .chip', section).forEach(function (c) {
      var v = c.getAttribute("data-cat") || "";
      c.setAttribute("aria-pressed", v === f.cat ? "true" : "false");
    });
  }
  if (section) {
    var chips = $$('.chip-row[role="group"] .chip', section);
    var catKeys = Object.keys(D.categories);
    chips.forEach(function (c, i) {
      c.setAttribute("data-cat", i === 0 ? "" : catKeys[i - 1]);
      c.addEventListener("click", function () { var v = c.getAttribute("data-cat"); f.cat = f.cat === v ? "" : v; renderExplorer(); });
    });
    var qt;
    if (qInput) qInput.addEventListener("input", function () { clearTimeout(qt); qt = setTimeout(function () { f.q = qInput.value; renderExplorer(); }, 200); });
    function fillStates() {
      if (!stateSel) return;
      var opts = D.states.filter(function (s) { return !f.zone || s.zone === f.zone; });
      stateSel.innerHTML = '<option value="">All states</option>' + opts.map(function (s) { return '<option value="' + s.slug + '">' + esc(s.name) + "</option>"; }).join("");
      stateSel.value = f.state;
    }
    if (zoneSel) zoneSel.addEventListener("change", function () {
      f.zone = zoneSel.value;
      var st = D.states.filter(function (s) { return s.slug === f.state; })[0];
      if (st && f.zone && st.zone !== f.zone) f.state = "";
      fillStates();
      renderExplorer();
    });
    if (stateSel) stateSel.addEventListener("change", function () { f.state = stateSel.value; renderExplorer(); });
    if (seeAll) seeAll.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); showAll = true; renderExplorer(); });
    section.addEventListener("click", function (e) {
      if (!e.target.closest("[data-clear]")) return;
      f = { q: "", cat: "", zone: "", state: "" };
      if (qInput) qInput.value = "";
      if (zoneSel) zoneSel.value = "";
      fillStates();
      renderExplorer();
    });
    var filterForm = $("form.filters", section);
    if (filterForm) filterForm.addEventListener("submit", function (e) { e.preventDefault(); });
    renderExplorer();
  }

  // hero search panel → explorer
  var heroSearch = $("form.hero-search");
  if (heroSearch) heroSearch.addEventListener("submit", function (e) {
    e.preventDefault();
    var hq = $("#hero-q"), hc = $("#hero-cat");
    f = { q: hq ? hq.value : "", cat: hc ? hc.value : "", zone: "", state: "" };
    if (qInput) qInput.value = f.q;
    if (zoneSel) zoneSel.value = "";
    showAll = true;
    renderExplorer();
    if (section) section.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  // ——— map ———
  var mapLayout = $(".map-layout");
  if (mapLayout) {
    var svg = $(".map-svg", mapLayout);
    var bySvg = {};
    D.states.forEach(function (s) { bySvg[s.svgId] = s; });
    var sorted = D.states.slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
    var panel = $(".map-panel", mapLayout);
    var live = panel && panel.previousElementSibling && panel.previousElementSibling.getAttribute("aria-live") ? panel.previousElementSibling : null;
    var zoneHi = $$("select", mapLayout)[0];
    var finder = $('input[type="search"]', mapLayout);
    var selected = "osun";
    var label = function (s) { return s.slug === "fct" ? "Federal Capital Territory" : s.name + " State"; };
    function paths() { return $$("path.map-state", svg); }
    function renderMap() {
      paths().forEach(function (p) {
        var s = bySvg[p.getAttribute("data-svg")];
        if (!s) return;
        var sel = s.slug === selected;
        p.classList.toggle("is-selected", sel);
        p.classList.toggle("is-zone", !!(zoneHi && zoneHi.value && s.zone === zoneHi.value && !sel));
        p.setAttribute("aria-pressed", sel ? "true" : "false");
        var pin = p.nextElementSibling;
        if (pin && pin.tagName.toLowerCase() === "circle") pin.setAttribute("r", sel ? "7" : "5");
      });
    }
    function renderPanel(focus) {
      var s = D.states.filter(function (x) { return x.slug === selected; })[0];
      if (!s || !panel) return;
      var ds = D.destinations.filter(function (d) { return d.state === s.slug; });
      panel.innerHTML =
        '<p class="eyebrow" style="color:var(--sage)">' + esc(D.zones[s.zone]) + " · Capital: " + esc(s.capital) + "</p>" +
        '<h3 tabindex="-1">' + esc(label(s)) + "</h3>" +
        (s.summary ? '<p class="muted">' + esc(s.summary) + "</p>" : "") +
        (ds.length
          ? "<ul>" + ds.map(function (d) { return '<li><a href="#" data-full-site-path="/destinations/' + d.slug + '"><img src="' + plate(d.plateKey) + '" alt="" width="64" height="48"><span><strong>' + esc(d.name) + "</strong></span></a></li>"; }).join("") + "</ul>"
          : '<p class="muted">Verified destinations for ' + esc(s.name) + " are in preparation with the state.</p>") +
        '<p class="muted" style="font-size:.8rem;border-top:1px solid var(--line-on-dark);padding-top:.75rem">Initial sample content written from public reference sources, pending state verification. Before planning a trip, read current official travel advice for ' + esc(s.name) + ".</p>";
      if (live) live.textContent = s.name + " selected. " + (ds.length ? ds.length + " destination" + (ds.length === 1 ? "" : "s") + "." : "No published destinations yet.");
      if (focus) $("h3", panel).focus();
    }
    function select(slug, focus) { selected = slug; renderMap(); renderPanel(focus); }
    paths().forEach(function (p) {
      var s = bySvg[p.getAttribute("data-svg")];
      if (!s) return;
      p.addEventListener("click", function () { select(s.slug); });
      p.addEventListener("keydown", function (e) {
        var i = sorted.findIndex(function (x) { return x.slug === s.slug; });
        var next;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = sorted[(i + 1) % sorted.length];
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = sorted[(i - 1 + sorted.length) % sorted.length];
        if (e.key === "Home") next = sorted[0];
        if (e.key === "End") next = sorted[sorted.length - 1];
        if (next) {
          e.preventDefault();
          paths().forEach(function (q) { q.setAttribute("tabindex", "-1"); });
          var target = $('path[data-svg="' + next.svgId + '"]', svg);
          target.setAttribute("tabindex", "0");
          target.focus();
        }
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(s.slug, true); }
      });
    });
    if (zoneHi) zoneHi.addEventListener("change", renderMap);
    if (finder) {
      var list = document.createElement("ul");
      list.className = "chip-row";
      list.style.cssText = "list-style:none;padding:0;margin:.25rem 0 0";
      list.id = "dn-finder-list";
      finder.parentNode.appendChild(list);
      var matches = function () {
        var t = finder.value.trim().toLowerCase();
        return t ? sorted.filter(function (s) { return (s.name + " " + s.capital).toLowerCase().indexOf(t) >= 0; }) : [];
      };
      finder.addEventListener("input", function () {
        var m = matches().slice(0, 8);
        list.innerHTML = m.map(function (s) { return '<li><button type="button" class="chip" data-state="' + s.slug + '">' + esc(s.name) + "</button></li>"; }).join("");
        if (m.length) finder.setAttribute("aria-controls", list.id); else finder.removeAttribute("aria-controls");
      });
      finder.addEventListener("keydown", function (e) {
        var m = matches();
        if (e.key === "Enter" && m[0]) { e.preventDefault(); select(m[0].slug, true); finder.value = ""; list.innerHTML = ""; }
      });
      list.addEventListener("click", function (e) {
        var b = e.target.closest("[data-state]");
        if (!b) return;
        select(b.getAttribute("data-state"), true);
        finder.value = "";
        list.innerHTML = "";
      });
    }
    renderMap();
    renderPanel(false);
  }

  // ——— destination detail dialog (stands in for destination pages) ———
  var detail = document.createElement("dialog");
  detail.className = "search-dialog on-light dn-detail";
  detail.setAttribute("aria-labelledby", "dn-detail-title");
  document.body.appendChild(detail);
  function openDestination(slug) {
    var d = D.destinations.filter(function (x) { return x.slug === slug; })[0];
    if (!d) return false;
    detail.innerHTML =
      '<div class="plate" style="border-radius:0;aspect-ratio:16/7"><img src="' + plate(d.plateKey) + '" alt="Illustration evoking the landscape type of ' + esc(d.name) + '. Not a photograph of the site."><span class="plate-tag" aria-hidden="true">Illustration</span></div>' +
      '<div class="stack" style="padding:1.5rem">' +
      '<p class="eyebrow">' + esc((d.locality ? d.locality + " · " : "") + d.stateLabel + " · " + D.zones[d.zone]) + "</p>" +
      '<h2 id="dn-detail-title" class="display t-2" tabindex="-1">' + esc(d.name) + "</h2>" +
      d.intro.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") +
      '<h3 class="display t-3">Highlights</h3><ul style="margin:0;padding-left:1.2em">' + d.highlights.map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + "</ul>" +
      '<dl class="facts">' + d.practical.map(function (p) { return "<div><dt>" + esc(p.label) + "</dt><dd>" + esc(p.value) + "</dd></div>"; }).join("") + "</dl>" +
      '<p class="mono muted">Reference content · awaiting state verification · last checked ' + esc(d.lastChecked) + "</p>" +
      '<ul style="margin:0;padding-left:1.2em;font-size:.9rem">' + d.sources.map(function (s) { return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + "</a></li>"; }).join("") + "</ul>" +
      '<div class="cluster">' + saveButton(d).replace("shortlist-btn", "shortlist-btn shortlist-btn--light") + '<button type="button" class="btn btn--ghost btn--sm" data-close>Close</button></div></div>';
    if (detail.open) detail.close();
    detail.showModal();
    detail.scrollTop = 0;
    var title = $("#dn-detail-title", detail);
    if (title) title.focus({ preventScroll: true });
    return true;
  }
  detail.addEventListener("click", function (e) { if (e.target === detail || e.target.closest("[data-close]")) detail.close(); });

  // ——— links to pages that exist only on the full site ———
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-full-site-path]");
    if (!a) return;
    e.preventDefault();
    var path = a.getAttribute("data-full-site-path");
    var m = /^\/destinations\/([a-z0-9-]+)/.exec(path);
    if (m && openDestination(m[1])) { var sd = $("dialog.search-dialog[open]:not(.dn-detail)"); if (sd) sd.close(); return; }
    notify("“" + (a.textContent || "This page").trim().slice(0, 60) + "” is a page on the full website. This file is an export of the home page.");
  });

  // ——— site search ———
  var searchDialog = $("dialog.search-dialog:not(.dn-detail)");
  var searchInput = $("#site-search");
  function openSearch() { if (searchDialog && !searchDialog.open) { searchDialog.showModal(); if (searchInput) searchInput.focus(); } }
  $$(".nav-actions .icon-btn").forEach(function (b) { if (/Search/.test(b.textContent)) b.addEventListener("click", openSearch); });
  document.addEventListener("keydown", function (e) {
    var typing = e.target.closest && e.target.closest("input, textarea, select");
    if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openSearch(); }
  });
  if (searchDialog && searchInput) {
    var status = $("#site-search-status");
    var resultsBox = document.createElement("div");
    searchDialog.appendChild(resultsBox);
    $$("p.muted", searchDialog).forEach(function (p) { p.remove(); });
    var closeBtn = $("form button", searchDialog);
    if (closeBtn) closeBtn.addEventListener("click", function () { searchDialog.close(); });
    $("form", searchDialog).addEventListener("submit", function (e) { e.preventDefault(); });
    var score = function (doc, terms) {
      var title = normalise(doc.title), kw = normalise(doc.keywords || ""), text = normalise(doc.text), s = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], ts = 0;
        if (title.indexOf(t) === 0) ts += 12;
        if (new RegExp("\\b" + t).test(title)) ts += 8; else if (title.indexOf(t) >= 0) ts += 4;
        if (new RegExp("\\b" + t).test(kw)) ts += 5;
        if (new RegExp("\\b" + t).test(text)) ts += 2;
        if (!ts) return 0;
        s += ts;
      }
      return s;
    };
    var renderSearch = function () {
      var q = normalise(searchInput.value);
      if (!q) { resultsBox.innerHTML = '<p class="muted" style="padding:1rem 1.25rem">Try “waterfall”, “Lagos”, “festival” or “heritage”.</p>'; if (status) status.textContent = ""; return; }
      var terms = q.split(" ");
      var res = D.index.map(function (d) { return { d: d, s: score(d, terms) }; }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
      if (status) status.textContent = res.length + " result" + (res.length === 1 ? "" : "s");
      resultsBox.innerHTML = res.length
        ? '<ul class="search-results">' + res.map(function (r) { return '<li><a href="#" data-full-site-path="' + esc(r.d.url) + '"><span class="kind">' + esc(r.d.kind) + "</span><strong>" + esc(r.d.title) + "</strong>" + (r.d.text ? '<span class="muted" style="font-size:.875rem">' + esc(r.d.text) + "</span>" : "") + "</a></li>"; }).join("") + "</ul>"
        : '<p class="muted" style="padding:1rem 1.25rem">No matches for “' + esc(searchInput.value) + "”.</p>";
    };
    searchInput.addEventListener("input", renderSearch);
    renderSearch();
  }

  // ——— mobile menu ———
  var menu = $("dialog.menu-sheet");
  var menuBtn = $(".nav-menu-btn");
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", function () { menu.showModal(); });
    $$("a, button", menu).forEach(function (el) {
      el.addEventListener("click", function () {
        if (el.tagName === "BUTTON" && /Search/.test(el.textContent)) { menu.close(); openSearch(); return; }
        menu.close();
      });
    });
  }

  // ——— forms: honest about being offline ———
  $$("form.form-grid").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var box = $('[role="status"]', form);
      var msg = '<div class="status status--info"><span aria-hidden="true">i</span><div><strong>Not sent.</strong> This file is an offline export of the home page, so forms are switched off. They send enquiries on the live website.</div></div>';
      if (box) box.innerHTML = msg; else notify("Forms send enquiries on the live website only.");
    });
  });

  // ——— scroll reveals ———
  var revealEls = $$("[data-reveal], [data-reveal-words]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // header state on scroll
  var header = $(".site-header");
  var onScroll = function () { if (header) header.classList.toggle("is-scrolled", window.scrollY > 24); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
