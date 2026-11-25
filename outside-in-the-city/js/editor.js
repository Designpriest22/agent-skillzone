/* ============================================================================
   OUTSIDE IN THE CITY — Editor
   Builds the right-hand editing panel for the selected graphic and binds every
   field live to OIC_DATA. Handles copy, photo replacement, focal point, the
   five weekly destinations, the six services, motif/icon choice.
   ========================================================================== */
(function () {
  const MOTIFS = { mosque: 'Mosque', church: 'Christian Centre', asorock: 'Aso Rock', tower: 'CBD Towers', lake: 'Jabi Lake' };
  const ICONS = { stay: 'Key (stay)', transport: 'Car', dining: 'Fork & knife', entertainment: 'Glass', vip: 'Crown', private: 'Diamond' };

  function get(p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), OIC_DATA); }
  function set(p, v) { const ks = p.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => a[k], OIC_DATA); t[last] = v; }
  function escA(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function escH(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function fText(label, path, hint) {
    return `<div class="fld"><label>${label}</label>` +
      `<input type="text" data-path="${path}" value="${escA(get(path))}">` +
      (hint ? `<div class="hint">${hint}</div>` : '') + `</div>`;
  }
  function fArea(label, path, hint) {
    return `<div class="fld"><label>${label}</label>` +
      `<textarea data-path="${path}">${escH(get(path))}</textarea>` +
      (hint ? `<div class="hint">${hint}</div>` : '') + `</div>`;
  }
  function fSelect(label, path, opts) {
    const cur = get(path);
    const o = Object.keys(opts).map(k => `<option value="${k}"${k === cur ? ' selected' : ''}>${opts[k]}</option>`).join('');
    return `<div class="fld"><label>${label}</label><select data-path="${path}">${o}</select></div>`;
  }
  function fToggle(label, path) {
    const on = get(path) ? ' checked' : '';
    return `<div class="fld"><label class="switch"><input type="checkbox" data-toggle="${path}"${on}> ${label}</label></div>`;
  }
  function fImage(label, base) {
    const img = get(base + '.image');
    const focus = get(base + '.imageFocus') || 50;
    const f = v => (Math.abs(focus - v) < 16 ? ' class="on"' : '');
    return `<div class="fld"><label>${label}</label>` +
      `<div class="imgrow"><span class="thumb" data-thumb="${base}.image" style="background-image:url('${img || ''}')"></span>` +
      `<button class="btn sm" data-imgpick="${base}.image">Replace photo</button>` +
      `<button class="btn sm ghost" data-imgclear="${base}.image">Remove</button></div>` +
      `<div class="imgrow" style="margin-top:8px"><span class="hint" style="margin:0">Focus</span>` +
      `<div class="seg" data-focus="${base}.imageFocus">` +
      `<button data-f="20"${f(20)}>Top</button><button data-f="50"${f(50)}>Center</button><button data-f="80"${f(80)}>Bottom</button></div></div>` +
      `<div class="hint">Optional. Leave empty to keep the Abuja illustration.</div></div>`;
  }

  function schema(id) {
    const d = OIC_DATA[id];
    if (id === 'g01') return fArea('Headline', 'g01.headline') + fArea('Body', 'g01.body') + fImage('Hero photograph', 'g01');
    if (id === 'g02') {
      let h = fArea('Headline', 'g02.headline', 'Use a line break for the stacked line.') + fArea('Body', 'g02.body');
      h += `<h3 style="margin-top:20px">The city index</h3>`;
      d.cells.forEach((c, i) => {
        h += `<div class="card"><div class="ch"><span class="idx">AREA ${i + 1}</span></div>` +
          fText('District', `g02.cells.${i}.area`) +
          fText('Descriptor', `g02.cells.${i}.line`) +
          fSelect('Landmark motif', `g02.cells.${i}.motif`, MOTIFS) +
          fImage('Photograph', `g02.cells.${i}`) + `</div>`;
      });
      return h;
    }
    if (id === 'g03') return fArea('Headline', 'g03.headline') + fText('Secondary (italic accent)', 'g03.secondary') +
      fArea('Body', 'g03.body') + fImage('Hero photograph', 'g03');
    if (id === 'g04') {
      let h = fText('Headline', 'g04.headline') + fText('Subheading', 'g04.subheading') +
        `<div class="note">Weekly list. Each entry uses the district as an honest place-name. Keep “selection pending” on until a specific venue, photograph and description are verified.</div>`;
      d.destinations.forEach((x, i) => {
        h += `<div class="card"><div class="ch"><span class="idx">N° 0${i + 1}</span></div>` +
          fText('Category', `g04.destinations.${i}.category`) +
          fText('Name / district', `g04.destinations.${i}.name`) +
          fArea('Description', `g04.destinations.${i}.note`) +
          fSelect('Landmark motif', `g04.destinations.${i}.motif`, MOTIFS) +
          fImage('Photograph', `g04.destinations.${i}`) +
          fToggle('Selection pending (placeholder)', `g04.destinations.${i}.placeholder`) + `</div>`;
      });
      return h;
    }
    if (id === 'g05') {
      let h = fArea('Headline', 'g05.headline') + fArea('Body', 'g05.body');
      h += `<h3 style="margin-top:20px">Services</h3>`;
      d.services.forEach((x, i) => {
        h += `<div class="card"><div class="ch"><span class="idx">SERVICE ${i + 1}</span></div>` +
          fText('Title', `g05.services.${i}.title`) +
          fText('Note', `g05.services.${i}.note`) +
          fSelect('Icon', `g05.services.${i}.icon`, ICONS) + `</div>`;
      });
      h += fText('Call to action', 'g05.cta');
      return h;
    }
    return '';
  }

  function readFileAsDataURL(file) {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }

  function build(id, container, onChange) {
    const titles = {
      g01: '01 · Brand introduction', g02: '02 · Our Abuja', g03: '03 · The value',
      g04: '04 · The Outside List', g05: '05 · The services'
    };
    container.innerHTML = `<h3>Edit graphic</h3><div class="ptitle">${OIC_GRAPHICS[id].title}</div>` +
      `<div class="hint" style="margin:-10px 0 16px">${titles[id] || ''}</div>` + schema(id);

    // text / textarea
    container.querySelectorAll('[data-path]').forEach(el => {
      const ev = (el.tagName === 'SELECT') ? 'change' : 'input';
      el.addEventListener(ev, () => { set(el.dataset.path, el.value); onChange(); });
    });
    // toggles
    container.querySelectorAll('[data-toggle]').forEach(el => {
      el.addEventListener('change', () => { set(el.dataset.toggle, el.checked); onChange(); });
    });
    // focus segmented
    container.querySelectorAll('[data-focus]').forEach(seg => {
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        set(seg.dataset.focus, parseInt(b.dataset.f, 10));
        seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on'); onChange();
      }));
    });
    // image pick / clear
    container.querySelectorAll('[data-imgpick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
        inp.className = 'hidefile';
        inp.addEventListener('change', async () => {
          if (!inp.files || !inp.files[0]) return;
          const url = await readFileAsDataURL(inp.files[0]);
          set(btn.dataset.imgpick, url);
          const thumb = container.querySelector(`[data-thumb="${CSS.escape(btn.dataset.imgpick)}"]`);
          if (thumb) thumb.style.backgroundImage = `url('${url}')`;
          onChange();
        });
        document.body.appendChild(inp); inp.click(); setTimeout(() => inp.remove(), 60000);
      });
    });
    container.querySelectorAll('[data-imgclear]').forEach(btn => {
      btn.addEventListener('click', () => {
        set(btn.dataset.imgclear, null);
        const thumb = container.querySelector(`[data-thumb="${CSS.escape(btn.dataset.imgclear)}"]`);
        if (thumb) thumb.style.backgroundImage = '';
        onChange();
      });
    });
  }

  window.oicBuildEditor = build;
})();
