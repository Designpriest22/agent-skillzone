/**
 * Motion system (loaded only when the visitor allows motion).
 *
 * Principles
 *  - One pinned moment (the opening stage). Everything else scrolls natively.
 *  - One-shot reveals use IntersectionObserver + CSS transitions (no layout
 *    reads); ScrollTrigger is reserved for scrubbed motion.
 *  - Setup is split into small tasks so the main thread stays responsive.
 *  - Transforms, opacity and clip-path only — no layout-affecting properties.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import type { Fx } from './main';

gsap.registerPlugin(ScrollTrigger, SplitText);

const $ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) => ctx.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document) =>
  Array.from(ctx.querySelectorAll<T>(sel));

/** Yield to the main thread between setup steps. */
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const w = window as Window & { scheduler?: { yield?: () => Promise<void> } };
    if (w.scheduler?.yield) w.scheduler.yield().then(resolve);
    else setTimeout(resolve, 0);
  });

export async function initMotion(fxPromise: Promise<Fx>, opts: { finePointer: boolean }) {
  ScrollTrigger.config({ ignoreMobileResize: true });

  const fx: Fx = { flames: null, particles: null };
  let heat = 0.3;
  fxPromise.then((r) => {
    Object.assign(fx, r);
    fx.flames?.setHeat(heat, true);
    fx.particles?.setHeat(heat, true);
  });

  // Above the fold first; the pinned scene must exist before later triggers.
  stageScene(fx, (h) => (heat = h));
  document.documentElement.classList.add('motion-ready');

  await yieldToMain();
  reveals();
  await yieldToMain();
  splitHeadings();
  await yieldToMain();
  parallax();
  await yieldToMain();
  soundScale();
  galleryFeature();
  galleryRows();
  if (opts.finePointer) {
    magnetic();
    tilt();
  }

  // Re-measure once web fonts settle (line lengths change).
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ------------------------------------------------------------------ */
/* Opening stage: hero → into the heat                                 */
/* ------------------------------------------------------------------ */

function stageScene(fx: Fx, onHeat: (h: number) => void) {
  const pin = $('[data-stage-pin]');
  const hero = $('[data-hero]');
  const heroInner = $('.hero__inner');
  const lights = $('[data-hero-lights]');
  const heat = $('[data-heat]');
  if (!pin || !hero || !heroInner || !heat) return;

  const kicker = $('[data-heat-kicker]', heat);
  const outline = $('.heat__title-outline', heat);
  const fill = $('[data-heat-fill]', heat);
  const beats = $$('[data-beat]', heat);
  const foods = $$('[data-heat-food]', heat);
  const scrim = $('[data-heat-scrim]', heat);
  const cool = $('[data-heat-cool]', heat);

  gsap.set([kicker, outline], { autoAlpha: 0, y: 60 });
  gsap.set(beats, { autoAlpha: 0, y: 24 });
  gsap.set(foods, { y: () => window.innerHeight * 1.2 });

  const mm = gsap.matchMedia();
  mm.add({ small: '(max-width: 767px)', large: '(min-width: 768px)' }, (ctx) => {
    const small = Boolean(ctx.conditions?.small);
    const vh = () => window.innerHeight;

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: small ? '+=115%' : '+=150%',
        scrub: 0.6,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          // Heat climbs from Christmas-night cool to full fire across the scene.
          const h = 0.3 + Math.min(1, self.progress / 0.72) * 0.58;
          onHeat(h);
          fx.flames?.setHeat(h);
          fx.particles?.setHeat(h);
          fx.particles?.setBoost(self.getVelocity() / 2500);
        },
      },
    });

    tl.to(heroInner, { y: () => -vh() * 0.22, scale: 0.88, duration: 0.24, ease: 'power1.in' }, 0)
      .to(hero, { autoAlpha: 0, duration: 0.14, ease: 'power1.in' }, 0.03)
      .to(scrim, { opacity: 1, duration: 0.2 }, 0.2)
      .to(lights, { y: -60, autoAlpha: 0.25, duration: 0.3 }, 0)
      .to(kicker, { autoAlpha: 1, y: 0, duration: 0.14, ease: 'power2.out' }, 0.2)
      .to(outline, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.22)
      .to(fill, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.36, ease: 'power1.inOut' }, 0.36)
      // Food rises through the fire at three depths (starts fully below the fold).
      .fromTo(foods[0] ?? {}, { y: () => vh() * 1.05 }, { y: () => -vh() * 0.45, duration: 0.85 }, 0.12)
      .fromTo(foods[1] ?? {}, { y: () => vh() * 1.1 }, { y: () => -vh() * 0.3, duration: 0.85 }, 0.18)
      .fromTo(foods[2] ?? {}, { y: () => vh() * 1.12 }, { y: () => -vh() * 0.75, duration: 0.85 }, 0.08)
      .to(beats, { autoAlpha: 1, y: 0, duration: 0.1, stagger: 0.09, ease: 'power2.out' }, 0.62)
      .to(cool, { opacity: 1, duration: 0.16, ease: 'power1.in' }, 0.86)
      .to({}, { duration: 0.04 });

    return () => tl.kill();
  });
}

/* ------------------------------------------------------------------ */
/* One-shot reveals: IntersectionObserver + CSS (see global.css)       */
/* ------------------------------------------------------------------ */

function reveals() {
  const els = $$('[data-reveal], [data-clip-reveal]');
  document.documentElement.classList.add('reveal-ready');
  const io = new IntersectionObserver(
    (entries) => {
      let i = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.style.setProperty('--rd', `${Math.min(i++, 5) * 80}ms`);
        el.classList.add('is-in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */
/* Headlines: split just before they arrive, rise line by line         */
/* ------------------------------------------------------------------ */

function splitHeadings() {
  const splits = new Map<Element, SplitText>();

  // Stage 2: play once it's on screen, then restore the original DOM.
  const play = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        play.unobserve(e.target);
        const split = splits.get(e.target);
        if (!split) continue;
        gsap.to(split.lines, {
          yPercent: 0,
          duration: 1.15,
          ease: 'expo.out',
          stagger: 0.09,
          onComplete: () => split.revert(),
        });
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  // Stage 1: split + hide lines while still off-screen.
  const prep = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        prep.unobserve(e.target);
        const split = SplitText.create(e.target as HTMLElement, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          aria: 'none', // lines keep their text in DOM order; nothing to relabel
        });
        gsap.set(split.lines, { yPercent: 125 });
        splits.set(e.target, split);
        play.observe(e.target);
      }
    },
    { rootMargin: '0px 0px 35% 0px' },
  );

  $$('[data-split]').forEach((el) => prep.observe(el));
}

/* ------------------------------------------------------------------ */
/* Scrubbed depth                                                      */
/* ------------------------------------------------------------------ */

function parallax() {
  $$('[data-parallax]').forEach((el) => {
    const s = parseFloat(el.dataset.parallax || '0');
    if (!s) return;
    gsap.fromTo(
      el,
      { y: () => s * window.innerHeight * 0.5 },
      {
        y: () => -s * window.innerHeight * 0.5,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}

function soundScale() {
  const media = $('[data-scale-in]');
  if (!media) return;
  gsap.fromTo(
    media,
    { scale: 1.18 },
    { scale: 1, ease: 'none', scrollTrigger: { trigger: media.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

function galleryFeature() {
  const frame = $('[data-feature-frame]');
  const img = $('[data-feature-img]');
  if (!frame || !img) return;
  gsap
    .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: frame, start: 'top bottom', end: 'top 15%', scrub: 0.5 } })
    .fromTo(frame, { clipPath: 'inset(14% 16% 14% 16%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
    .fromTo(img, { scale: 1.3 }, { scale: 1 }, 0);
}

function galleryRows() {
  $$('[data-gallery-row]').forEach((row) => {
    const track = $('.row__track', row);
    if (!track) return;
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const toLeft = row.dataset.galleryRow === 'left';
    gsap.fromTo(
      track,
      { x: () => (toLeft ? 0 : -dist()) },
      {
        x: () => (toLeft ? -dist() : 0),
        ease: 'none',
        scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true },
      },
    );
  });
}

/* ------------------------------------------------------------------ */
/* Desktop pointer interactions                                        */
/* ------------------------------------------------------------------ */

function magnetic() {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

function tilt() {
  $$('[data-tilt]').forEach((wrap) => {
    const card = wrap.firstElementChild as HTMLElement | null;
    if (!card) return;
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 12);
      rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
    });
    wrap.addEventListener('pointerleave', () => {
      rx(0);
      ry(0);
    });
  });
}
