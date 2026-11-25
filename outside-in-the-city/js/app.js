/* ============================================================================
   OUTSIDE IN THE CITY — Studio bootstrap
   Wires the preview, live editing, nav and all exports together.
   ========================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const state = { current: 'g01', scale: 1 };

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function busy(on, label) {
    const b = $('#busy'); if (label) b.querySelector('.b').textContent = label;
    b.classList.toggle('show', !!on);
  }
  function dimsOf(svg) {
    const w = parseFloat((svg.match(/width="([\d.]+)"/) || [])[1]);
    const h = parseFloat((svg.match(/height="([\d.]+)"/) || [])[1]);
    return { w, h };
  }
  function pngFromSvg(svg, filename, scale) {
    const d = dimsOf(svg);
    return oicEnsureFonts().then(() => oicSvgToPng(svg, d.w, d.h, scale || 2))
      .then(b => oicDownloadBlob(b, filename));
  }

  /* ---- render ---- */
  function renderStage() {
    $('#frame').innerHTML = oicRenderGraphic(state.current);
    $('#capTitle').textContent = OIC_GRAPHICS[state.current].title;
  }
  function renderThumb(id) {
    const el = document.querySelector(`.navitem[data-id="${id}"] .tn`);
    if (el) el.innerHTML = oicRenderGraphic(id);
  }
  function renderNav() {
    const nav = $('#nav');
    nav.innerHTML = Object.keys(OIC_GRAPHICS).map((id, i) =>
      `<div class="navitem${id === state.current ? ' active' : ''}" data-id="${id}">
         <div class="tn"></div>
         <div class="meta"><div class="n">N° 0${i + 1}</div><div class="t">${OIC_GRAPHICS[id].title}</div></div>
       </div>`).join('');
    Object.keys(OIC_GRAPHICS).forEach(renderThumb);
    nav.querySelectorAll('.navitem').forEach(it => it.addEventListener('click', () => select(it.dataset.id)));
  }
  let _deb;
  function refresh() {
    clearTimeout(_deb);
    _deb = setTimeout(() => { renderStage(); renderThumb(state.current); }, 50);
  }
  function select(id) {
    state.current = id;
    document.querySelectorAll('.navitem').forEach(n => n.classList.toggle('active', n.dataset.id === id));
    renderStage();
    oicBuildEditor(id, $('#panel'), refresh);
  }

  /* ---- exports ---- */
  function wire() {
    $('#expPng').addEventListener('click', () => {
      busy(true, 'Rendering PNG');
      oicExportGraphicPng(state.current, state.scale).then(() => { busy(false); toast('Exported ' + state.current.toUpperCase() + ' · 1080×1350'); })
        .catch(e => { busy(false); toast('Export failed'); console.error(e); });
    });
    $('#expZip').addEventListener('click', () => {
      busy(true, 'Building campaign ZIP');
      oicExportAllZip(state.scale, (i, n) => busy(true, 'Rendering ' + i + '/' + n))
        .then(() => { busy(false); toast('Exported all five + logo (ZIP)'); })
        .catch(e => { busy(false); toast('ZIP failed'); console.error(e); });
    });
    $('#reset').addEventListener('click', () => {
      if (!confirm('Reset all copy, destinations and photos to defaults?')) return;
      oicResetData(); renderNav(); select(state.current); toast('Reset to defaults');
    });

    // scale toggle
    $('#scale').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.scale = parseInt(b.dataset.s, 10);
      $('#scale').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    }));

    // logo
    $('#logoSvg').addEventListener('click', () => {
      const v = $('#logoVar').value;
      v === 'symbol' ? oicExportSymbolSvg('primary') : oicExportLogoSvg(v);
      toast('Logo SVG exported');
    });
    $('#logoPng').addEventListener('click', () => {
      const v = $('#logoVar').value;
      const svg = v === 'symbol' ? oicSymbolSVG({ theme: 'primary' }) : oicLogomarkSVG(v);
      busy(true, 'Rendering logo');
      pngFromSvg(svg, 'OITC_logo_' + v + '.png', 2).then(() => { busy(false); toast('Logo PNG exported'); });
    });
    // wallpaper
    $('#wallSvg').addEventListener('click', () => { oicExportWallpaperSvg($('#wallVar').value); toast('Wallpaper SVG exported'); });
    $('#wallPng').addEventListener('click', () => {
      busy(true, 'Rendering wallpaper');
      oicExportWallpaper($('#wallVar').value).then(() => { busy(false); toast('Wallpaper PNG exported'); });
    });
  }

  /* ---- boot ---- */
  function boot() {
    oicInjectFonts();
    (document.fonts ? document.fonts.load('800 48px "Schibsted Grotesk"').then(() => document.fonts.ready) : Promise.resolve())
      .then(() => {
        renderNav();
        select('g01');
        wire();
      });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
