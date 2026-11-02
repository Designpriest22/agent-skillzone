#!/usr/bin/env python3
"""QA a rendered reel or mix: loudness (EBU R128), RMS trace per 0.5 s annotated with the cue sheet, spectrogram,
and 1-fps contact sheets. Adapted from the MIT-licensed `video-by-reference` skill (ishuagrawal/video-by-reference,
scripts/review.py) for Prohub's cue format.
  python3 review.py <file.mp4|wav> --cues <name.cues.json> --out <dir>
"""
import argparse, json, math, os, re, subprocess, array

def run(cmd, binary=False):
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return p if binary else (p.stdout.decode(errors="ignore"), p.stderr.decode(errors="ignore"))

ap = argparse.ArgumentParser(); ap.add_argument("file"); ap.add_argument("--cues"); ap.add_argument("--out", required=True)
a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
name = os.path.splitext(os.path.basename(a.file))[0]
L, warn = [f"# QA — {name}\n"], []
_, err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", a.file, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"])
summ = err[err.rfind("Summary:"):]
g = lambda pat: (lambda m: float(m.group(1)) if m else None)(re.search(pat, summ))
I, LRA, TP = g(r"I:\s+(-?[\d.]+) LUFS"), g(r"LRA:\s+(-?[\d.]+) LU"), g(r"Peak:\s+(-?[\d.]+) dBFS")
L.append(f"- Integrated {I} LUFS · LRA {LRA} LU · true peak {TP} dBTP")
if I is None or abs(I + 14) > 1.0: warn.append(f"integrated {I} LUFS not within -14 ±1")
if TP is not None and TP > -1.0: warn.append(f"true peak {TP} dBTP above -1.0")
raw = run(["ffmpeg", "-v", "error", "-i", a.file, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], binary=True).stdout
x = array.array("h", raw); hop = 8000; trace = []
for i in range(0, len(x), hop):
    seg = x[i:i + hop:4]
    if seg: trace.append(20 * math.log10(math.sqrt(sum(s * s for s in seg) / len(seg)) / 32768 + 1e-9))
cues = json.load(open(a.cues))["cues"] if a.cues else {}
L.append("\n## RMS per 0.5 s (dBFS), annotated with cues")
for i, d in enumerate(trace):
    t = i * 0.5; tag = "".join(f" ←{k}" for k, c in cues.items() if t <= c < t + 0.5)
    L.append(f"{t:6.1f}: {d:6.1f} {'#' * max(0, int((d + 60) / 2))}{tag}")
quiet = [i * 0.5 for i, d in enumerate(trace) if d < -38]
L.append(f"\nQuiet (< -38 dBFS) at: {quiet or 'none'}")
if any(d < -80 for d in trace[:-1]): warn.append("digital silence inside the programme")
flat = sum(1 for i in range(1, len(trace)) if abs(trace[i] - trace[i - 1]) < 0.3) / max(1, len(trace) - 1)
if flat > 0.6: warn.append("trace very flat — mix lacks dynamics")
run(["ffmpeg", "-v", "error", "-y", "-i", a.file, "-lavfi", "showspectrumpic=s=1400x360:legend=1:scale=log:fscale=log:color=intensity", os.path.join(a.out, f"{name}_spectrogram.png")])
if a.file.endswith(".mp4"):
    run(["ffmpeg", "-v", "error", "-y", "-i", a.file, "-vf", "fps=1,scale=216:-2,tile=10x2:padding=4:color=white", "-frames:v", "1", os.path.join(a.out, f"{name}_sheet_1fps.png")])
L.insert(1, "## Warnings\n" + ("\n".join(f"- {w}" for w in warn) or "- none") + "\n")
open(os.path.join(a.out, f"{name}_qa.md"), "w").write("\n".join(L) + "\n")
print("\n".join(L[:4]))
