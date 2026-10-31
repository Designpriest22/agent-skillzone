// node render.mjs [filter]      renders every deliverable (or only jobs whose id contains `filter`)
// Per job: export the spot's cue sheet -> synthesise its soundtrack (audio.py) -> render frames in headless Chromium
// -> H.264 High / AAC, loudness-normalised to -14 LUFS, -1 dBTP.  Derived versions (1080p from 4K masters, platform copies) follow.
import { createRequire } from 'node:module'; import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(dir, 'out'); const WORK = path.join(OUT, '_work'); fs.mkdirSync(WORK, { recursive: true });
const P = 'LOLFEST_WIZKID';
const CON = { c1: 'C1-The-Superstar-Experience', c2: 'C2-The-Festival-Is-Calling', c3: 'C3-The-Big-Wiz-Moment' };
const STO = { s1: ['S1-Typographic-Explosion', 15], s2: ['S2-Festival-Countdown', 15], s3: ['S3-Visual-Experience', 15], s4: ['S4-Wizkid-Takeover', 10], s5: ['S5-Ultimate-Festival-Announcement', 15] };
const FMT = { story: '1080x1920_9x16_IG-FB-Stories', reels: '1080x1920_9x16_Reels-TikTok-SafeZone', feed: '1080x1350_4x5_IG-FB-Feed', square: '1080x1080_1x1_Square-Social',
  master: '3840x2160_16x9_MASTER', bbP: '1080x1920_9x16_Billboard-Portrait', bb4k: '3840x2160_16x9_Billboard-Landscape-MASTER' };
const jobs = [];
for (const [c, name] of Object.entries(CON)) for (const f of ['story', 'reels', 'feed', 'square', 'master', 'bbP', 'bb4k'])
  jobs.push({ id: `${c}-${f}`, page: 'ads.html', q: `c=${c}&f=${f}`, file: `${P}_${name}_20s_${FMT[f]}.mp4`, crf: f === 'master' || f === 'bb4k' ? 16 : 17, cue: c });
for (const [s, [name, d]] of Object.entries(STO))
  jobs.push({ id: `${s}-story`, page: 'stories.html', q: `s=${s}`, file: `${P}_${name}_${d}s_1080x1920_9x16_Story-Reels-TikTok_MASTER.mp4`, crf: 14, cue: s });
// co-branded sponsor spots: 13 sponsors x 3 formats
const SPN = { hennessy: '01-Hennessy', heineken: '02-Heineken', 'coca-cola': '03-Coca-Cola', desperados: '04-Desperados', best: '05-BEST', axe: '06-AXE', 'lords-gin': '07-Lords-London-Dry-Gin',
  'transcorp-hotels': '08-Transcorp-Hotels', 'vodi-group': '09-Vodi-Group', 'united-nigeria': '10-United-Nigeria-Airlines', trace: '11-TRACE-Plus', 'square-meter': '12-Square-Meter-Spaces', 'nova-flair': '13-Nova-Flair' };
const SPF = { reels: '1080x1920_9x16_Stories-Reels-TikTok', feed: '1080x1350_4x5_Feed', square: '1080x1080_1x1_Square' };
for (const [s, n] of Object.entries(SPN)) for (const [f, tag] of Object.entries(SPF))
  jobs.push({ id: `sp-${s}-${f}`, page: 'sponsors.html', q: `s=${s}&f=${f}`, file: `sponsors/${n}/${P}_x_${n.slice(3)}_15s_${tag}.mp4`, crf: 17, cue: `sp-${s}` });
const filter = process.argv[2];
const todo = jobs.filter(j => !filter || j.id.includes(filter));

const srv = await serve(dir); const browser = await chromium.launch();
const audioDone = new Map();
async function run(j) {
  const page = await browser.newPage();
  page.on('pageerror', e => console.error(`[${j.id}] page error`, e.message));
  await page.goto(`${srv.url}/${j.page}?render=1&${j.q}`); await page.evaluate(() => window.ready);
  const { FPS, DUR, W, H } = await page.evaluate(() => window.meta);
  const wav = path.join(WORK, `${j.cue}.wav`);
  if (!audioDone.has(j.cue)) audioDone.set(j.cue, (async () => {
    const cues = await page.evaluate(() => window.cues()); const cj = path.join(WORK, `${j.cue}.cues.json`);
    fs.writeFileSync(cj, JSON.stringify(cues, null, 1));
    const raw = wav.replace('.wav', '.raw.wav');
    execFileSync('python3', [path.join(dir, 'audio.py'), cj, raw], { stdio: 'inherit' });
    // two-pass EBU R128 normalisation: -14 LUFS integrated, -1 dBTP
    const js = JSON.parse(execFileSync('sh', ['-c', `ffmpeg -hide_banner -i '${raw}' -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' }));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-af', `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true,aresample=48000,alimiter=limit=0.8:attack=2:release=60:level=false`, '-c:a', 'pcm_s16le', wav]);
  })());
  await audioDone.get(j.cue);
  const out = path.join(WORK, j.file); fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(j.crf), '-profile:v', 'high', '-level', W > 1920 ? '5.1' : '4.2',
    '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'aac', '-b:a', '192k', '-t', String(DUR), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now(); const n = FPS * DUR;
  for (let f = 0; f < n; f++) {
    const b64 = await page.evaluate(f => window.grab(f), f);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 125 === 0) console.log(`[${j.id}] ${f}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
  // AAC can overshoot the PCM limiter on hard transients: measure the encoded true peak, trim the gain if it is above -1 dBTP
  const tp = Number((execFileSync('sh', ['-c', `ffmpeg -hide_banner -i '${out}' -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep 'Peak:' | tail -1`], { encoding: 'utf8' }).match(/-?[\d.]+/) || [0])[0]);
  if (tp > -1.0) {
    const tmp = out.replace('.mp4', '.trim.mp4'); const g = (-1.3 - tp).toFixed(2);
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', out, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-af', `volume=${g}dB`, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
    fs.renameSync(tmp, out); console.log(`[${j.id}] true peak ${tp} dBTP -> trimmed ${g} dB`);
  }
  await page.close(); console.log(`[${j.id}] done ${W}x${H} in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${j.file}`);
}
const CONC = Number(process.env.CONC || 3); const queue = [...todo];
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) await run(queue.shift()); }));
await browser.close(); srv.close();
console.log('all renders done');
