/**
 * Page behaviour. Everything here works with reduced motion; the GSAP motion
 * system and the fire/particle effects load only when motion is allowed.
 */
import type { FlameField } from './fx/flames';
import type { SnowToEmber } from './fx/particles';

export interface Fx {
  flames: FlameField | null;
  particles: SnowToEmber | null;
}

const root = document.documentElement;
const motionOk = root.classList.contains('motion-ok');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* Ticket CTAs                                                         */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function trackTicketClick(el: HTMLElement, live: boolean) {
  const detail = { location: el.dataset.ctaLocation ?? 'unknown', live };
  window.dispatchEvent(new CustomEvent('seasonfest:ticket-click', { detail }));
  window.dataLayer?.push({ event: 'ticket_cta_click', ...detail });
}

const modal = document.getElementById('ticket-modal') as HTMLDialogElement | null;

document.addEventListener('click', (e) => {
  const cta = (e.target as Element).closest<HTMLElement>('[data-ticket-cta]');
  if (!cta) return;
  const live = cta.hasAttribute('data-ticket-live');
  trackTicketClick(cta, live);
  if (live || !modal || typeof modal.showModal !== 'function') return;
  e.preventDefault();
  // Close the mobile menu first if the CTA lives inside it.
  const menu = document.getElementById('mobile-menu');
  if (menu?.matches(':popover-open')) menu.hidePopover();
  modal.showModal();
});

if (modal) {
  modal.querySelector('[data-close-modal]')?.addEventListener('click', () => modal.close());
  // Click on the backdrop closes the dialog.
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });
}

/* ------------------------------------------------------------------ */
/* Header state + mobile ticket bar                                    */
/* ------------------------------------------------------------------ */

const header = document.querySelector<HTMLElement>('[data-header]');
const bar = document.querySelector<HTMLElement>('[data-ticket-bar]');
let endZoneVisible = false;

const endIo = new IntersectionObserver(
  (entries) => {
    endZoneVisible = entries.some((en) => en.isIntersecting);
    updateChrome();
  },
  { rootMargin: '0px 0px -10% 0px' },
);
document.querySelectorAll('[data-final], [data-footer], #details').forEach((el) => endIo.observe(el));

let ticking = false;
function updateChrome() {
  ticking = false;
  const y = window.scrollY;
  header?.toggleAttribute('data-scrolled', y > 24);
  if (bar) {
    const show = y > window.innerHeight * 0.85 && !endZoneVisible;
    if (show !== bar.hasAttribute('data-visible')) {
      bar.toggleAttribute('data-visible', show);
      bar.toggleAttribute('inert', !show);
      bar.setAttribute('aria-hidden', String(!show));
    }
  }
}
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateChrome);
    }
  },
  { passive: true },
);
updateChrome();

/* ------------------------------------------------------------------ */
/* Mobile menu (native popover) — close after choosing a section       */
/* ------------------------------------------------------------------ */

const menu = document.getElementById('mobile-menu');
menu?.querySelectorAll('[data-menu-link]').forEach((a) =>
  a.addEventListener('click', () => {
    if (menu.matches(':popover-open')) menu.hidePopover();
  }),
);

/* ------------------------------------------------------------------ */
/* Countdown (days only — the start time isn't confirmed yet)          */
/* ------------------------------------------------------------------ */

const countdown = document.querySelector<HTMLElement>('[data-countdown]');
if (countdown) {
  const eventDate = document.querySelector('time[datetime]')?.getAttribute('datetime');
  if (eventDate) {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const days = Math.round((Date.parse(eventDate) - Date.parse(today)) / 86_400_000);
    let text = '';
    if (days > 1) text = `${days} days to Christmas Eve`;
    else if (days === 1) text = 'Tomorrow. Get ready.';
    else if (days === 0) text = 'It’s SEASON FEST day';
    if (text) {
      countdown.textContent = text;
      countdown.hidden = false;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Map facade — load Google Maps only when asked                       */
/* ------------------------------------------------------------------ */

const map = document.querySelector<HTMLElement>('[data-map]');
const mapBtn = map?.querySelector<HTMLButtonElement>('[data-map-load]');
const mapTpl = map?.querySelector<HTMLTemplateElement>('[data-map-template]');
if (map && mapBtn && mapTpl) {
  mapBtn.hidden = false;
  mapBtn.addEventListener('click', () => {
    const frame = mapTpl.content.firstElementChild?.cloneNode(true) as HTMLIFrameElement | undefined;
    if (!frame) return;
    map.querySelector('.map__facade')?.remove();
    map.append(frame);
    frame.focus();
  });
}

/* ------------------------------------------------------------------ */
/* Fire + particles, then the motion system                            */
/* ------------------------------------------------------------------ */

function lowPower() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory !== undefined && nav.deviceMemory < 2);
}

async function startFx(): Promise<Fx> {
  const fx: Fx = { flames: null, particles: null };
  if (lowPower()) return fx;

  const [{ FlameField }, { SnowToEmber }] = await Promise.all([import('./fx/flames'), import('./fx/particles')]);

  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const flamesCanvas = document.querySelector<HTMLCanvasElement>('[data-flames]');
  const particlesCanvas = document.querySelector<HTMLCanvasElement>('[data-particles]');

  if (flamesCanvas) fx.flames = FlameField.create(flamesCanvas, { heat: 0.32 });
  if (particlesCanvas) fx.particles = new SnowToEmber(particlesCanvas, { heat: 0.3 });
  stage?.classList.add('fx-on');

  if (finePointer && stage && fx.flames) {
    const flames = fx.flames;
    stage.addEventListener(
      'pointermove',
      (e) => {
        const r = stage.getBoundingClientRect();
        flames.setPointer((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / Math.min(r.height, window.innerHeight), true);
      },
      { passive: true },
    );
    stage.addEventListener('pointerleave', () => flames.setPointer(0.5, 0.2, false));
  }

  // Closing section: embers only, started when it comes near.
  const finalSection = document.querySelector<HTMLElement>('[data-final]');
  if (finalSection) {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const fc = finalSection.querySelector<HTMLCanvasElement>('[data-final-flames]');
        const pc = finalSection.querySelector<HTMLCanvasElement>('[data-final-particles]');
        if (fc) FlameField.create(fc, { heat: 0.42 });
        if (pc) new SnowToEmber(pc, { heat: 0.9, snow: false, density: 0.7 });
        finalSection.classList.add('fx-on');
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(finalSection);
  }

  return fx;
}

if (motionOk) {
  // Start the scroll system first so the pinned stage is laid out quickly;
  // the effects attach as soon as their (small) modules arrive.
  const idle = (cb: () => void) =>
    'requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 1200 }) : setTimeout(cb, 300);
  const fxPromise = new Promise<Fx>((resolve) => idle(() => resolve(startFx()))).catch(
    () => ({ flames: null, particles: null }) as Fx,
  );
  import('./motion')
    .then(({ initMotion }) => initMotion(fxPromise, { finePointer }))
    .catch(() => root.classList.remove('motion-ok'));
}
