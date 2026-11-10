// node render20.mjs [filter]   v2 sponsor spots: 13 sponsors x 3 formats, 20 s, cut to the supplied track.
// Per sponsor: cue sheet -> SFX layer (audio.py, sfxOnly) -> mixed under "Final (Baba Nla)" 20 s edit -> two-pass loudnorm -14 LUFS / -1 dBTP.
// Per job: frames rendered in headless Chromium -> H.264 High 4.2 / AAC 192k -> encoded true-peak check.
import { createRequire } from 'node:module'; import { spawn, execFileSync } from 'node:child_process';
import path from 'node:path'; import fs from 'node:fs';
import { serve } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const WORK = path.join(dir, 'out', '_work', 'v2'); fs.mkdirSync(WORK, { recursive: true });
const SONG = process.env.SONG || path.join(dir, 'out/DELIVERY/LOLFEST_WIZKID_CAMPAIGN/07-PROJECT-FILES-ASSETS/music/Final-Baba-Nla_edit_20s.wav');
export const SPN = { hennessy: '01-Hennessy', heineken: '02-Heineken', 'coca-cola': '03-Coca-Cola', desperados: '04-Desperados', best: '05-BEST', axe: '06-AXE', 'lords-gin': '07-Lords-London-Dry-Gin',
  'transcorp-hotels': '08-Transcorp-Hotels', 'vodi-group': '09-Vodi-Group', 'united-nigeria': '10-United-Nigeria-Airlines', trace: '11-TRACE-Plus', 'square-meter': '12-Square-Meter-Spaces', 'nova-flair': '13-Nova-Flair', 'blue-poppy': '14-Blue-Poppy' };
export const SPF = { reels: ['Vertical 9x16', '1080x1920_9x16_Stories-Reels-TikTok'], feed: ['Portrait 4x5', '1080x1350_4x5_Feed'], square: ['Square 1x1', '1080x1080_1x1_Square'] };
export const jobs = [];
for (const [s, n] of Object.entries(SPN)) for (const [f, [, tag]] of Object.entries(SPF))
  jobs.push({ id: `${s}-${f}`, s, q: `s=${s}&f=${f}`, file: `${n}/LOLFEST_x_${n.slice(3)}_20s_${tag}.mp4` });
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const filter = process.argv[2]; const todo = jobs.filter(j => !filter || j.id.includes(filter));
  const srv = await serve(dir); const browser = await chromium.launch(); const audio = new Map();
  const mkAudio = async (page, s) => {
    const cues = await page.evaluate(() => window.cues()); const cj = path.join(WORK, `${s}.cues.json`); fs.writeFileSync(cj, JSON.stringify(cues, null, 1));
    const sfx = path.join(WORK, `${s}.sfx.wav`), mix = path.join(WORK, `${s}.mix.wav`), wav = path.join(WORK, `${s}.wav`);
    execFileSync('python3', [path.join(dir, 'audio.py'), cj, sfx], { stdio: 'inherit' });
    // song carries the spot; SFX sit ~10 dB under it on the cuts and hits
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', SONG, '-i', sfx, '-filter_complex', '[0:a]aresample=48000,atrim=0:20[a];[1:a]aresample=48000,volume=0.32[b];[a][b]amix=inputs=2:duration=first:normalize=0,afade=t=out:st=19.4:d=0.6', '-c:a', 'pcm_s24le', mix]);
    const js = JSON.parse(execFileSync('sh', ['-c', `ffmpeg -hide_banner -i '${mix}' -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p'`], { encoding: 'utf8' }));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mix, '-af', `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true,aresample=48000,alimiter=limit=0.8:attack=2:release=60:level=false`, '-c:a', 'pcm_s16le', wav]);
    return wav;
  };
  async function run(j) {
    const page = await browser.newPage(); page.on('pageerror', e => console.error(`[${j.id}] page error`, e.message));
    await page.goto(`${srv.url}/ad20.html?render=1&${j.q}`); await page.evaluate(() => window.ready);
    const { FPS, DUR, W, H } = await page.evaluate(() => window.meta);
    if (!audio.has(j.s)) audio.set(j.s, mkAudio(page, j.s));
    const wav = await audio.get(j.s);
    const out = path.join(WORK, j.file); fs.mkdirSync(path.dirname(out), { recursive: true });
    const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
      '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-profile:v', 'high', '-level', '4.2',
      '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now(), n = FPS * DUR;
    for (let f = 0; f < n; f++) {
      const b64 = await page.evaluate(f => window.grab(f), f);
      if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 125 === 0) console.log(`[${j.id}] ${f}/${n} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg ' + c))));
    const tp = Number((execFileSync('sh', ['-c', `ffmpeg -hide_banner -i '${out}' -af ebur128=peak=true -f null - 2>&1 | grep -A20 Summary | grep 'Peak:' | tail -1`], { encoding: 'utf8' }).match(/-?[\d.]+/) || [0])[0]);
    if (tp > -1.0) { const tmp = out.replace('.mp4', '.trim.mp4'), g = (-1.3 - tp).toFixed(2);
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', out, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-af', `volume=${g}dB`, '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', tmp]);
      fs.renameSync(tmp, out); console.log(`[${j.id}] true peak ${tp} -> trimmed ${g} dB`); }
    await page.close(); console.log(`[${j.id}] done ${W}x${H} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  const CONC = Number(process.env.CONC || 4), queue = [...todo];
  await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) await run(queue.shift()); }));
  await browser.close(); srv.close(); console.log('all renders done');
}
