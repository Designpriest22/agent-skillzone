(function () {
  var toggle = document.querySelector('.nav-toggle');
  var mobile = document.querySelector('.nav-mobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = mobile.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.fade-in');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    targets.forEach(function (el) { observer.observe(el); });
  }

  document.querySelectorAll('.stat-value[data-target]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var numEl = el.querySelector('[data-num]');
    var done = false;
    function animateCount() {
      if (done || !numEl) return;
      done = true;
      if (reduced) { numEl.textContent = target.toLocaleString('en-US'); return; }
      var start = performance.now();
      var duration = 1400;
      function tick(now) {
        var progress = Math.min(1, (now - start) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        numEl.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!('IntersectionObserver' in window)) { animateCount(); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(); obs.unobserve(e.target); } });
    }, { threshold: 0.4 });
    obs.observe(el);
  });

  /* Talent directory filter + search (talent.html only) */
  var talentWall = document.querySelector('[data-talent-wall]');
  if (talentWall) {
    var filterBtns = document.querySelectorAll('.talent-filter-btn');
    var searchInput = document.querySelector('.talent-search input');
    var tiles = talentWall.querySelectorAll('.talent-tile');
    var activeFilter = 'all';

    function applyFilters() {
      var q = (searchInput && searchInput.value || '').trim().toLowerCase();
      tiles.forEach(function (tile) {
        var role = tile.getAttribute('data-role') || '';
        var name = (tile.querySelector('.talent-name').textContent || '').toLowerCase();
        var matchesFilter = activeFilter === 'all' || role === activeFilter;
        var matchesSearch = !q || name.indexOf(q) !== -1;
        tile.style.display = (matchesFilter && matchesSearch) ? '' : 'none';
      });
    }
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilter = btn.getAttribute('data-filter');
        applyFilters();
      });
    });
    if (searchInput) searchInput.addEventListener('input', applyFilters);
  }

  /* Contact form: pre-select subject from ?subject= query param, fake-submit feedback */
  var contactForm = document.getElementById('tcm-contact-form');
  if (contactForm) {
    var params = new URLSearchParams(window.location.search);
    var subjectParam = params.get('subject');
    var subjectSelect = document.getElementById('subject');
    if (subjectParam && subjectSelect) {
      var hasOption = Array.prototype.some.call(subjectSelect.options, function (o) { return o.value === subjectParam; });
      if (hasOption) subjectSelect.value = subjectParam;
    }
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      contactForm.innerHTML = '<p style="font-size:1.1rem; font-weight:700;">Thanks — your message is in. The TCM team will reach out shortly.</p>';
    });
  }
})();
