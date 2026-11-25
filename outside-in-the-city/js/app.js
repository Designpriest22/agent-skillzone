/* ============================================================================
   OUTSIDE IN THE CITY — Studio bootstrap
   Drives preview, live editing, nav and exports for the campaign graphics AND
   the flyers (each flyer in post 1080x1350 + story 1080x1920).
   ========================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const state = { current: 'g01', kind: 'graphic', flyerSize: 'post', scale: 1 };

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function busy(on, label) {
    const b = $('#busy'); if (label) b.querySelector('.b').textContent = label;
    b.classList.toggle('show', !!on);
  }
  function pngFromSvg(svg, filename, scale) {
    const d = oicSvgDims(svg);
    return oicEnsureFonts().then(() => oicSvgToPng(svg, d.w, d.h, scale || 2)).then(b => oicDownloadBlob(b, filename));
  }

  function currentSvg() {
    return state.kind === 'flyer' ? oicRenderFlyer(state.current, state.flyerSize) : oicRenderGraphic(state.current);
  }
  function currentSize() {
    return state.kind === 'flyer' ? OIC_FLYER_SIZES[state.flyerSize] : { w: 1080, h: 1350 };
  }
  function renderStage() {
    $('#frame').innerHTML = currentSvg();
    const S = currentSize();
    $('#capTitle').textContent = state.kind === 'flyer'
      ? OIC_FLYERS[state.current].title + ' · ' + (state.flyerSize === 'post' ? 'Post' : 'Story')
      : OIC_GRAPHICS[state.current].title;
    $('#capDims').textContent = S.w + ' × ' + S.h + (state.kind === 'flyer'
      ? (state.flyerSize === 'post' ? ' · Post 4:5' : ' · Story 9:16') : ' · Instagram 4:5');
    $('#frame').style.maxWidth = (state.kind === 'flyer' && state.flyerSize === 'story') ? '380px' : '520px';
  }
  function renderThumb(kind, id) {
    const el = document.querySelector(`.navitem[data-kind="${kind}"][data-id2="${id}"] .tn`);
    if (el) el.innerHTML = kind === 'flyer' ? oicRenderFlyer(id, 'post') : oicRenderGraphic(id);
  }
  function item(kind, id, n, t) {
    const active = (state.kind === kind && state.current === id) ? ' active' : '';
    return `<div class="navitem${active}" data-kind="${kind}" data-id2="${id}">
      <div class="tn"></div><div class="meta"><div class="n">${n}</div><div class="t">${t}</div></div></div>`;
  }
  function renderNav() {
    $('#nav').innerHTML = Object.keys(OIC_GRAPHICS).map((id, i) => item('graphic', id, 'N° 0' + (i + 1), OIC_GRAPHICS[id].title)).join('');
    $('#navFlyers').innerHTML = Object.keys(OIC_FLYERS).map(id => item('flyer', id, 'FLYER', OIC_FLYERS[id].title)).join('');
    Object.keys(OIC_GRAPHICS).forEach(id => renderThumb('graphic', id));
    Object.keys(OIC_FLYERS).forEach(id => renderThumb('flyer', id));
    document.querySelectorAll('.navitem').forEach(it => it.addEventListener('click', () => select(it.dataset.kind, it.dataset.id2)));
  }
  function setActive() {
    document.querySelectorAll('.navitem').forEach(n =>
      n.classList.toggle('active', n.dataset.kind === state.kind && n.dataset.id2 === state.current));
  }
  let _deb;
  function refresh() { clearTimeout(_deb); _deb = setTimeout(() => { renderStage(); renderThumb(state.kind, state.current); }, 50); }

  function buildEditor() {
    const panel = $('#panel');
    if (state.kind === 'flyer') {
      panel.innerHTML = `<h3>Edit flyer</h3><div class="ptitle">${OIC_FLYERS[state.current].title}</div>` +
        `<div class="fld"><label>Format</label><div class="seg" id="flySize">` +
        `<button data-sz="post"${state.flyerSize === 'post' ? ' class="on"' : ''}>Post · 4:5</button>` +
        `<button data-sz="story"${state.flyerSize === 'story' ? ' class="on"' : ''}>Story · 9:16</button></div></div>`;
      const fields = document.createElement('div'); panel.appendChild(fields);
      oicBuildFlyerEditor(state.current, fields, refresh);
      panel.querySelectorAll('#flySize button').forEach(b => b.addEventListener('click', () => {
        state.flyerSize = b.dataset.sz;
        panel.querySelectorAll('#flySize button').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); renderStage();
      }));
    } else {
      oicBuildEditor(state.current, panel, refresh);
    }
  }
  function select(kind, id) { state.kind = kind; state.current = id; setActive(); renderStage(); buildEditor(); }

  function wire() {
    $('#expPng').addEventListener('click', () => {
      busy(true, 'Rendering PNG');
      const pr = state.kind === 'flyer'
        ? oicExportFlyerPng(state.current, state.flyerSize, state.scale)
        : oicExportGraphicPng(state.current, state.scale);
      pr.then(() => { busy(false); toast('Exported ' + currentSize().w + '×' + currentSize().h); })
        .catch(e => { busy(false); toast('Export failed'); console.error(e); });
    });
    $('#expZip').addEventListener('click', () => {
      busy(true, 'Building campaign ZIP');
      oicExportAllZip(state.scale, (i, n) => busy(true, 'Rendering ' + i + '/' + n))
        .then(() => { busy(false); toast('Exported campaign + flyers + logo (ZIP)'); })
        .catch(e => { busy(false); toast('ZIP failed'); console.error(e); });
    });
    $('#reset').addEventListener('click', () => {
      if (!confirm('Reset all copy, destinations, flyers and photos to defaults?')) return;
      oicResetData(); renderNav(); select(state.kind, state.current); toast('Reset to defaults');
    });
    $('#scale').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.scale = parseInt(b.dataset.s, 10);
      $('#scale').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    }));
    $('#logoSvg').addEventListener('click', () => {
      const v = $('#logoVar').value; v === 'symbol' ? oicExportSymbolSvg('primary') : oicExportLogoSvg(v); toast('Logo SVG exported');
    });
    $('#logoPng').addEventListener('click', () => {
      const v = $('#logoVar').value;
      const svg = v === 'symbol' ? oicSymbolSVG({ theme: 'primary' }) : oicLogomarkSVG(v);
      busy(true, 'Rendering logo'); pngFromSvg(svg, 'OITC_logo_' + v + '.png', 2).then(() => { busy(false); toast('Logo PNG exported'); });
    });
    $('#wallSvg').addEventListener('click', () => { oicExportWallpaperSvg($('#wallVar').value); toast('Wallpaper SVG exported'); });
    $('#wallPng').addEventListener('click', () => {
      busy(true, 'Rendering wallpaper'); oicExportWallpaper($('#wallVar').value).then(() => { busy(false); toast('Wallpaper PNG exported'); });
    });
  }

  function boot() {
    oicInjectFonts();
    (document.fonts ? document.fonts.load('800 48px "Schibsted Grotesk"').then(() => document.fonts.ready) : Promise.resolve())
      .then(() => { renderNav(); select('graphic', 'g01'); wire(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
