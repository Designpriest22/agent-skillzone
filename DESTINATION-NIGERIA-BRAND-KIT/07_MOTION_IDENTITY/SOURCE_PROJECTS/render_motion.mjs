// Renders the Destination Nigeria motion compositions to video.
//   node render_motion.mjs              → all jobs
//   node render_motion.mjs A_dark E     → jobs whose name starts with any argument
//   node render_motion.mjs --snap A_cinematic-logo-reveal.html "theme=dark" 1.5 3.2 6.9   → still frames
// Requires Playwright + Chromium and ffmpeg (libx264, libvpx-vp9, prores_ks, libopus).
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');

const here = path.dirname(new URL(import.meta.url).pathname);
const KIT = path.resolve(here, '..', '..');
const OUT = path.join(KIT, '07_MOTION_IDENTITY');
const SON = path.join(KIT, '08_SONIC_IDENTITY');
const TMP = path.join(process.env.TMPDIR || '/tmp', 'dn-frames');

const JOBS = [
  // name, composition, query, w, h, outputs, audio
  { name: 'A_cinematic-reveal_dark_1920x1080', comp: 'A_cinematic-logo-reveal.html', q: 'theme=dark', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'webm', 'gif', 'png'], audio: 'DN_sonic-logo_primary_6-5s.wav' },
  { name: 'A_cinematic-reveal_light_1920x1080', comp: 'A_cinematic-logo-reveal.html', q: 'theme=light', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'webm', 'gif', 'png'], audio: 'DN_sonic-logo_primary_6-5s.wav' },
  { name: 'A_cinematic-reveal_reversed_ALPHA_1920x1080', comp: 'A_cinematic-logo-reveal.html', q: 'theme=dark&transparent=1', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mov', 'webm-alpha', 'png'], alpha: true },
  { name: 'A_cinematic-reveal_fullcolour_ALPHA_1920x1080', comp: 'A_cinematic-logo-reveal.html', q: 'theme=light&transparent=1', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mov', 'webm-alpha'], alpha: true },
  { name: 'B_minimal-reveal_light_1920x1080', comp: 'B_minimal-digital-reveal.html', q: 'theme=light', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'webm', 'gif', 'png'], audio: 'DN_sonic-sting_2-5s.wav' },
  { name: 'B_minimal-reveal_dark_1920x1080', comp: 'B_minimal-digital-reveal.html', q: 'theme=dark', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'webm', 'gif'], audio: 'DN_sonic-sting_2-5s.wav' },
  { name: 'B_minimal-reveal_light_1080x1080', comp: 'B_minimal-digital-reveal.html', q: 'theme=light&w=1080&h=1080', w: 1080, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'gif'], audio: 'DN_sonic-sting_2-5s.wav' },
  { name: 'B_minimal-reveal_dark_1080x1920', comp: 'B_minimal-digital-reveal.html', q: 'theme=dark&w=1080&h=1920', w: 1080, h: 1920, dir: 'LOGO_INTROS', out: ['mp4'], audio: 'DN_sonic-sting_2-5s.wav' },
  { name: 'B_minimal-reveal_fullcolour_ALPHA_1920x1080', comp: 'B_minimal-digital-reveal.html', q: 'theme=light&transparent=1', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mov', 'webm-alpha'], alpha: true },
  { name: 'C_presentation-opener_1920x1080', comp: 'C_presentation-opener.html', q: '', w: 1920, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'webm', 'gif', 'png'], audio: 'C' },
  { name: 'D_brand-loop_1920x1080', comp: 'D_seamless-brand-loop.html', q: 'logo=0', w: 1920, h: 1080, dir: 'LOOPS', out: ['mp4', 'webm', 'png', 'gif-short'] },
  { name: 'D_brand-loop_with-logo_1920x1080', comp: 'D_seamless-brand-loop.html', q: 'logo=1', w: 1920, h: 1080, dir: 'LOOPS', out: ['mp4'] },
  { name: 'D_brand-loop_1080x1920', comp: 'D_seamless-brand-loop.html', q: 'logo=0&w=1080&h=1920', w: 1080, h: 1920, dir: 'LOOPS', out: ['mp4'] },
  { name: 'E_symbol_on-ivory_1080x1080', comp: 'E_symbol-animation.html', q: 'theme=light', w: 1080, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'gif', 'png'] },
  { name: 'E_symbol_on-forest_1080x1080', comp: 'E_symbol-animation.html', q: 'theme=dark', w: 1080, h: 1080, dir: 'LOGO_INTROS', out: ['mp4', 'webm', 'gif'], audio: 'DN_sonic-sting_2-5s.wav' },
  { name: 'F_brand-intro-25s_16x9_1920x1080', comp: 'F_brand-intro-25s.html', q: 'w=1920&h=1080', w: 1920, h: 1080, dir: 'BRAND_INTRO_25s', out: ['mp4', 'webm', 'png'], audio: 'DN_sonic-brand-intro_25s.wav' },
  { name: 'F_brand-intro-25s_1x1_1080x1080', comp: 'F_brand-intro-25s.html', q: 'w=1080&h=1080', w: 1080, h: 1080, dir: 'BRAND_INTRO_25s', out: ['mp4', 'png'], audio: 'DN_sonic-brand-intro_25s.wav' },
  { name: 'F_brand-intro-25s_4x5_1080x1350', comp: 'F_brand-intro-25s.html', q: 'w=1080&h=1350', w: 1080, h: 1350, dir: 'BRAND_INTRO_25s', out: ['mp4', 'png'], audio: 'DN_sonic-brand-intro_25s.wav' },
  { name: 'F_brand-intro-25s_9x16_1080x1920', comp: 'F_brand-intro-25s.html', q: 'w=1080&h=1920', w: 1080, h: 1920, dir: 'BRAND_INTRO_25s', out: ['mp4', 'png'], audio: 'DN_sonic-brand-intro_25s.wav' },
  { name: 'E_symbol_ALPHA_1080x1080', comp: 'E_symbol-animation.html', q: 'transparent=1', w: 1080, h: 1080, dir: 'LOGO_INTROS', out: ['mov', 'webm-alpha', 'png'], alpha: true },
];

function ff(args) {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + args.join(' '));
}

async function openComp(browser, comp, query, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page error]', e.message));
  await page.goto('file://' + path.join(here, comp) + '?' + query);
  await page.waitForFunction(() => window.ready === true);
  return page;
}

async function render(browser, j) {
  const page = await openComp(browser, j.comp, j.q, j.w, j.h);
  const { DURATION, FPS } = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));
  const frames = Math.round(DURATION * FPS);
  const dir = path.join(TMP, j.name);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  // opaque jobs capture JPEG q95 intermediates (PNG encoding of film grain is ~8x slower); alpha jobs keep PNG
  const ext = j.alpha ? 'png' : 'jpg';
  for (let f = 0; f < frames; f++) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    await page.screenshot(j.alpha ? { path: path.join(dir, `f${String(f).padStart(5, '0')}.png`), omitBackground: true }
      : { path: path.join(dir, `f${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 95 });
  }
  await page.evaluate(t => window.renderAt(t), (frames - 1) / FPS);
  await page.screenshot({ path: path.join(dir, 'final.png'), omitBackground: !!j.alpha });
  await page.close();
  const seq = ['-framerate', String(FPS), '-i', path.join(dir, `f%05d.${ext}`)];
  const od = path.join(OUT, j.dir); fs.mkdirSync(od, { recursive: true });
  const base = path.join(od, 'DN_motion_' + j.name);
  let audio = [];
  if (j.audio === 'C') {
    // opener: sonic logo enters as the logo resolves, over a low bed that fades out
    const mix = path.join(dir, 'mix.wav');
    ff(['-i', path.join(SON, 'DN_sonic-intro-bed_30s_seamless-loop.wav'), '-i', path.join(SON, 'DN_sonic-logo_primary_6-5s.wav'),
      '-filter_complex', `[0]atrim=0:${DURATION},volume=0.35,afade=t=in:d=1.2,afade=t=out:st=${DURATION - 2}:d=2[b];[1]adelay=1500|1500,apad[l];[b][l]amix=inputs=2:normalize=0,atrim=0:${DURATION}[o]`,
      '-map', '[o]', '-c:a', 'pcm_s24le', mix]);
    audio = ['-i', mix];
  } else if (j.audio) audio = ['-i', path.join(SON, j.audio)];
  const aPad = audio.length ? ['-af', `apad,atrim=0:${DURATION},afade=t=out:st=${(DURATION - 0.25).toFixed(2)}:d=0.25`] : [];
  for (const o of j.out) {
    if (o === 'mp4') ff([...seq, ...audio, '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', ...aPad, ...(audio.length ? ['-c:a', 'aac', '-b:a', '256k'] : []),
      '-t', String(DURATION), '-movflags', '+faststart', base + '.mp4']);
    if (o === 'webm') ff([...seq, ...audio, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-pix_fmt', 'yuv420p', ...aPad,
      ...(audio.length ? ['-c:a', 'libopus', '-b:a', '160k'] : []), '-t', String(DURATION), base + '.webm']);
    if (o === 'webm-alpha') ff([...seq, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0', '-b:v', '0', '-crf', '28', '-row-mt', '1', base + '.webm']);
    // Lossless QuickTime PNG with alpha (AE, Premiere, Resolve, FCP). For ProRes 4444 instead:
    // ffmpeg -i <file>_alpha-PNG.mov -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le out.mov
    if (o === 'mov') ff([...seq, '-c:v', 'png', '-pix_fmt', 'rgba', base + '_alpha-PNG.mov']);
    if (o === 'gif' || o === 'gif-short') {
      const w = Math.min(640, j.w), t = o === 'gif-short' ? ['-t', '6'] : [];
      ff([...seq, ...t, '-vf', `fps=15,scale=${w}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a`, base + '_preview.gif']);
    }
    if (o === 'png') fs.copyFileSync(path.join(dir, 'final.png'), base + '_final-frame.png');
  }
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('✓', j.name, `${frames} frames`);
}

const args = process.argv.slice(2);
const browser = await chromium.launch();
if (args[0] === '--snap') {
  const [, comp, query, ...times] = args;
  const m = /w=(\d+)/.exec(query), n = /h=(\d+)/.exec(query);
  const page = await openComp(browser, comp, query, m ? +m[1] : 1920, n ? +n[1] : 1080);
  fs.mkdirSync(path.join(TMP, 'snaps'), { recursive: true });
  for (const t of times) {
    await page.evaluate(t => window.renderAt(t), +t);
    const p = path.join(TMP, 'snaps', `${comp.split('_')[0]}_${t}.png`);
    await page.screenshot({ path: p }); console.log(p);
  }
} else {
  for (const j of JOBS.filter(j => !args.length || args.some(a => j.name.startsWith(a)))) await render(browser, j);
}
await browser.close();
