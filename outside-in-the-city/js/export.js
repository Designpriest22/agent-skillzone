/* ============================================================================
   OUTSIDE IN THE CITY — Export engine
   ----------------------------------------------------------------------------
   Rasterises the real SVG compositions (NOT the UI) to pixel-exact PNGs,
   bundles the five graphics into a ZIP, and exports the logo as SVG + PNG.
   ========================================================================== */

/* Rasterise an SVG string to a PNG blob at (w*scale) x (h*scale). */
function oicSvgToPng(svg, w, h, scale) {
  scale = scale || 1;
  return new Promise(function (resolve, reject) {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'sync';
    img.onload = function () {
      try {
        const cv = document.createElement('canvas');
        cv.width = Math.round(w * scale);
        cv.height = Math.round(h * scale);
        const ctx = cv.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob returned null')); }, 'image/png');
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('SVG image failed to load')); };
    img.src = url;
  });
}

/* Make sure the brand fonts are decoded before any rasterisation. */
function oicEnsureFonts() {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const want = [
    '400 48px "Schibsted Grotesk"', '500 48px "Schibsted Grotesk"',
    '700 48px "Schibsted Grotesk"', '800 48px "Schibsted Grotesk"',
    'italic 400 48px "Newsreader"', 'italic 500 48px "Newsreader"',
    '700 48px "Bodoni Moda"'
  ];
  return Promise.all(want.map(function (f) { try { return document.fonts.load(f); } catch (e) { return null; } }))
    .then(function () { return document.fonts.ready; });
}

function oicDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
}
function oicDownloadText(text, filename, mime) {
  oicDownloadBlob(new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' }), filename);
}

/* Export a single graphic as PNG. */
function oicExportGraphicPng(id, scale) {
  return oicEnsureFonts().then(function () {
    const svg = oicRenderGraphic(id);
    return oicSvgToPng(svg, OIC_W, OIC_H, scale || 1);
  }).then(function (blob) {
    oicDownloadBlob(blob, 'OITC_' + id + '_1080x1350.png');
    return blob;
  });
}

/* Export all five graphics as a ZIP (+ a README + the primary logo). */
function oicExportAllZip(scale, onProgress) {
  const ids = Object.keys(OIC_GRAPHICS);
  const zip = new JSZip();
  const folder = zip.folder('OUTSIDE_IN_THE_CITY_campaign');
  return oicEnsureFonts().then(function () {
    let chain = Promise.resolve();
    ids.forEach(function (id, i) {
      chain = chain.then(function () {
        if (onProgress) onProgress(i, ids.length, id);
        const svg = oicRenderGraphic(id);
        return oicSvgToPng(svg, OIC_W, OIC_H, scale || 1).then(function (blob) {
          folder.file('OITC_' + id + '_' + (i + 1) + '_1080x1350.png', blob);
          folder.file('source/OITC_' + id + '.svg', svg);
        });
      });
    });
    return chain;
  }).then(function () {
    // logo assets
    folder.file('logo/OITC_logo_primary.svg', oicLogoSVG({ theme: 'primary' }));
    folder.file('logo/OITC_logo_white.svg', oicLogoSVG({ theme: 'white' }));
    folder.file('logo/OITC_logo_black.svg', oicLogoSVG({ theme: 'black' }));
    folder.file('logo/OITC_symbol.svg', oicSymbolSVG({ theme: 'primary' }));
    return oicSvgToPng(oicLogoSVG({ theme: 'primary' }), 1000, 620, 2).then(function (b) {
      folder.file('logo/OITC_logo_primary@2x.png', b);
    });
  }).then(function () {
    folder.file('README.txt', oicCampaignReadme());
    if (onProgress) onProgress(ids.length, ids.length, 'zip');
    return zip.generateAsync({ type: 'blob' });
  }).then(function (blob) {
    oicDownloadBlob(blob, 'OUTSIDE_IN_THE_CITY_campaign.zip');
    return blob;
  });
}

/* Logo exports. */
function oicExportLogoSvg(theme) {
  oicDownloadText(oicLogoSVG({ theme: theme || 'primary' }), 'OITC_logo_' + (theme || 'primary') + '.svg', 'image/svg+xml');
}
function oicExportSymbolSvg(theme) {
  oicDownloadText(oicSymbolSVG({ theme: theme || 'primary' }), 'OITC_symbol_' + (theme || 'primary') + '.svg', 'image/svg+xml');
}
function oicExportLogoPng(theme, scale) {
  return oicEnsureFonts()
    .then(function () { return oicSvgToPng(oicLogoSVG({ theme: theme || 'primary' }), 1000, 620, scale || 2); })
    .then(function (b) { oicDownloadBlob(b, 'OITC_logo_' + (theme || 'primary') + '.png'); });
}

/* Wallpaper exports (logo-only, premium background). */
function oicExportWallpaper(kind) {
  const spec = OIC_WALLPAPERS[kind] || OIC_WALLPAPERS.phone;
  return oicEnsureFonts()
    .then(function () { return oicSvgToPng(oicWallpaperSVG(kind), spec.w, spec.h, 1); })
    .then(function (b) { oicDownloadBlob(b, 'OITC_wallpaper_' + kind + '_' + spec.w + 'x' + spec.h + '.png'); });
}
function oicExportWallpaperSvg(kind) {
  oicDownloadText(oicWallpaperSVG(kind), 'OITC_wallpaper_' + kind + '.svg', 'image/svg+xml');
}

function oicCampaignReadme() {
  return [
    'OUTSIDE IN THE CITY — Abuja Lifestyle & Entertainment Concierge',
    'Backed by The Capital Movement',
    '',
    'This archive contains the five-part launch campaign exported at 1080 x 1350 (Instagram 4:5),',
    'the source SVG for each graphic, and the logo system (primary / white / black / symbol).',
    '',
    'Illustrated imagery is premium placeholder art. Replace with verified photography via the editor.',
    'The five destinations in "THE OUTSIDE LIST" are thematic placeholders — swap in verified names,',
    'photographs and descriptions before publishing.',
    '',
    'Generated by the OUTSIDE IN THE CITY campaign studio.'
  ].join('\n');
}

if (typeof window !== 'undefined') {
  Object.assign(window, {
    oicSvgToPng, oicEnsureFonts, oicDownloadBlob, oicDownloadText,
    oicExportGraphicPng, oicExportAllZip, oicExportLogoSvg, oicExportSymbolSvg,
    oicExportLogoPng, oicExportWallpaper, oicExportWallpaperSvg, oicCampaignReadme
  });
}
