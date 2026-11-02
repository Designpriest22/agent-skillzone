import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { CAM, CUES, STORY, SUBS } from "./story";
import { camera, worldTransform } from "./kit/camera";
import { blink, clamp01, eback, eio, eout, lerp, ramp, rnd, wobble } from "./kit/helpers";
import { Face, Glow, StoryDefs } from "./kit/parts";
import { Subtitles } from "./kit/Subtitles";
import { HAND, ROUND } from "./kit/fonts";

// "Fizz": a little red can at a summer picnic. Everyone grabs the shiny blue can first, finds it
// too sweet and puts it down. A hot, tired girl picks up Fizz, the tab pops, and the bubbles make
// her day. A fan-made, playful opinion piece; the cans are drawn generically (no real logos).

type Pt = [number, number];
type Mood = "smile" | "happy" | "o" | "sad" | "none";

const TABLE_Y = 720; // back edge of the picnic table
const FIZZ_REST: Pt = [820, 762];
const FIZZ_HELD: Pt = [800, 612];
const BLUE_REST: Pt = [1120, 762];
const BLUE_LIFT: Pt = [1160, 600];
const KID_START: Pt = [2180, 560];
const GIRL_X = 560;

const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// ---------------------------------------------------------------------------------------------
// Seeded particles (identical on every render)
const CLOUDS = [
  { x: 260, y: 300, s: 1.0, v: 0.12 },
  { x: 980, y: 190, s: 1.25, v: 0.08 },
  { x: 1700, y: 280, s: 0.9, v: 0.1 },
];
const DROPS = Array.from({ length: 8 }, (_, k) => ({ x: -48 + rnd(`dx${k}`) * 96, off: rnd(`do${k}`) * 170, sp: 0.25 + rnd(`ds${k}`) * 0.3, r: 2.5 + rnd(`dr${k}`) * 2.5 }));
const BURST = Array.from({ length: 46 }, (_, k) => ({ vx: (rnd(`bx${k}`) - 0.5) * 520, vy: -(160 + rnd(`by${k}`) * 380), r: 4 + rnd(`br${k}`) * 13, life: 34 + rnd(`bl${k}`) * 40, d: Math.floor(rnd(`bd${k}`) * 6) }));
const STREAM = Array.from({ length: 14 }, (_, k) => ({ x: (rnd(`sx${k}`) - 0.5) * 30, off: rnd(`so${k}`) * 40, r: 2 + rnd(`sr${k}`) * 4 }));
const FROST = Array.from({ length: 12 }, (_, k) => ({ a: rnd(`fa${k}`) * Math.PI * 2, d: 110 + rnd(`fd${k}`) * 90, s: 8 + rnd(`fs${k}`) * 12, t: rnd(`ft${k}`) * 20 }));
const CUBES = Array.from({ length: 6 }, (_, k) => ({ vx: (rnd(`cx${k}`) - 0.5) * 16, vy: -(9 + rnd(`cy${k}`) * 6), d: k * 4, rot: (rnd(`cr${k}`) - 0.5) * 30 }));
const GRASS = Array.from({ length: 70 }, (_, k) => ({ x: -300 + k * 36 + rnd(`gx${k}`) * 20, h: 14 + rnd(`gh${k}`) * 18, s: rnd(`gs${k}`) * 6 }));

// ---------------------------------------------------------------------------------------------
// Small drawing parts

const Sparkle: React.FC<{ x: number; y: number; s: number; o: number; fill?: string; rot?: number }> = ({ x, y, s, o, fill = "#fff", rot = 0 }) => (
  <path transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 10})`} d="M 0,-10 C 1.5,-2 2,-1.5 10,0 C 2,1.5 1.5,2 0,10 C -1.5,2 -2,1.5 -10,0 C -2,-1.5 -1.5,-2 0,-10 Z" fill={fill} opacity={o} />
);

const Cloud: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.92}>
    <circle cx={-80} cy={14} r={34} fill="#ffffff" />
    <circle cx={-38} cy={-8} r={48} fill="#ffffff" />
    <circle cx={20} cy={-26} r={58} fill="#ffffff" />
    <circle cx={74} cy={-2} r={44} fill="#ffffff" />
    <circle cx={112} cy={18} r={30} fill="#ffffff" />
    <rect x={-112} y={10} width={250} height={38} rx={19} fill="#ffffff" />
    <path d="M -100,40 Q 10,56 128,40" stroke="#d9ecfb" strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
  </g>
);

const Heart: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0,12 C -26,-6 -18,-28 0,-16 C 18,-28 26,-6 0,12 Z" fill="#ff5f7e" opacity={o} />
);

// A drink can as a character. (x, y) is the bottom centre; tab 0 = closed, 1 = popped open.
const Can: React.FC<{
  f: number; x: number; y: number; kind: "red" | "blue"; seed: number;
  mood?: Mood; look?: Pt; rot?: number; sq?: number; tab?: number; wink?: number; eyeScale?: number; glintEvery?: number;
}> = ({ f, x, y, kind, seed, mood = "smile", look = [0, 0], rot = 0, sq = 1, tab = 0, wink = 0, eyeScale = 1, glintEvery = 0 }) => {
  const id = `can-${kind}`;
  const o = blink(f, seed);
  const size = 11 * eyeScale, gap = 46;
  const breathe = 1 + 0.012 * wobble(f, seed, 0.8);
  const gp = glintEvery ? ((f + seed * 17) % glintEvery) / 26 : 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${1 / (sq * breathe)} ${sq * breathe})`}>
      <defs>
        <clipPath id={`${id}-clip`}><rect x={-65} y={-224} width={130} height={212} rx={10} /></clipPath>
      </defs>
      {/* bottom rim */}
      <path d="M -63,-18 L 63,-18 Q 61,-2 50,1 L -50,1 Q -61,-2 -63,-18 Z" fill="url(#silver)" />
      {/* body */}
      <rect x={-65} y={-224} width={130} height={212} rx={10} fill={`url(#${kind}Body)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={-46} y={-214} width={15} height={196} rx={7} fill="#fff" opacity={0.28} />
        <rect x={-24} y={-214} width={5} height={196} rx={2.5} fill="#fff" opacity={0.18} />
        {gp < 1 && <rect x={lerp(-160, 120, gp)} y={-260} width={34} height={320} fill="#fff" opacity={0.35 * Math.sin(gp * Math.PI)} transform="rotate(18)" />}
        {kind === "red" && DROPS.map((d, k) => {
          const yy = -205 + ((f * d.sp + d.off) % 175);
          return <ellipse key={k} cx={d.x} cy={yy} rx={d.r * 0.8} ry={d.r} fill="#ffe5e8" opacity={0.55 * (1 - ramp(yy, -60, -25))} />;
        })}
      </g>
      {/* label */}
      {kind === "red" ? (
        <text x={0} y={-62} textAnchor="middle" fontFamily={ROUND} fontWeight={600} fontSize={44} fill="#fff8f2" transform="rotate(-6 0 -74)" letterSpacing={1}>Coke</text>
      ) : (
        <g>
          <rect x={-65} y={-92} width={130} height={20} fill="#dfe8f7" opacity={0.75} />
          <Sparkle x={-28} y={-48} s={11} o={0.9} />
          <Sparkle x={24} y={-38} s={7} o={0.75} />
        </g>
      )}
      {/* eyes on white, so they read on any colour */}
      <g transform="translate(0 -158)">
        {[-1, 1].map((side) => {
          const so = side === 1 ? o * (1 - wink) : o;
          return <ellipse key={side} cx={(side * gap) / 2} cy={-1} rx={size * 1.5} ry={size * 1.7 * Math.max(0.04, so)} fill="#fffdf8" />;
        })}
        <Face f={f} seed={seed} size={size} gap={gap} look={look} open={o} wink={wink} mood={mood} ink={kind === "red" ? "#2a0a0c" : "#0b1636"} />
      </g>
      {/* shoulder and lid */}
      <path d="M -65,-222 Q -62,-240 -54,-247 L 54,-247 Q 62,-240 65,-222 Z" fill="url(#silver)" />
      <ellipse cx={0} cy={-247} rx={54} ry={10} fill="#e3e8ee" stroke="#a9b2bc" strokeWidth={2} />
      <ellipse cx={0} cy={-247} rx={44} ry={7} fill="none" stroke="#c4ccd5" strokeWidth={2} />
      {tab > 0.3 && <ellipse cx={-14} cy={-247} rx={12} ry={4.5} fill="#3b2c2c" />}
      {/* the pull-tab (the story's token) */}
      <g transform={`translate(8 -249) rotate(${-80 * tab}) translate(-8 0)`}>
        <rect x={-26} y={-5} width={34} height={11} rx={5.5} fill="none" stroke="#cfd6de" strokeWidth={4.5} />
        <circle cx={4} cy={0.5} r={3.2} fill="#9aa4ae" />
      </g>
    </g>
  );
};

// An arm with a hand, curving from a shoulder (or the frame edge) to the hand.
const Arm: React.FC<{ from: Pt; ctrl: Pt; hand: Pt; skin: string; sleeve: string; width?: number; flip?: boolean }> = ({ from, ctrl, hand, skin, sleeve, width = 46, flip = false }) => {
  const d = `M ${from[0]},${from[1]} Q ${ctrl[0]},${ctrl[1]} ${hand[0]},${hand[1]}`;
  const t = 0.32; // sleeve covers the first part of the curve
  const sx = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * ctrl[0] + t * t * hand[0];
  const sy = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * ctrl[1] + t * t * hand[1];
  const cx = lerp(from[0], ctrl[0], t), cy = lerp(from[1], ctrl[1], t);
  return (
    <g>
      <path d={d} stroke={skin} strokeWidth={width} fill="none" strokeLinecap="round" />
      <path d={`M ${from[0]},${from[1]} Q ${cx},${cy} ${sx},${sy}`} stroke={sleeve} strokeWidth={width + 12} fill="none" strokeLinecap="round" />
      <g transform={`translate(${hand[0]} ${hand[1]}) scale(${flip ? -1 : 1} 1)`}>
        <ellipse cx={0} cy={0} rx={width * 0.68} ry={width * 0.62} fill={skin} />
        <ellipse cx={-width * 0.42} cy={-width * 0.34} rx={width * 0.26} ry={width * 0.17} fill={skin} transform={`rotate(-30 ${-width * 0.42} ${-width * 0.34})`} />
        {[0, 1, 2].map((k) => <path key={k} d={`M ${width * 0.1},${-width * 0.32 + k * width * 0.24} q ${width * 0.3},${width * 0.04} ${width * 0.44},${width * 0.1}`} stroke="#00000022" strokeWidth={3} fill="none" strokeLinecap="round" />)}
      </g>
    </g>
  );
};

// The girl, from the waist up (the table hides the rest). y is how far she has risen (0 = full height).
const Girl: React.FC<{ f: number; dy: number; joy: number }> = ({ f, dy, joy }) => {
  const skin = "#a8693f";
  const bob = 3 * wobble(f, 5, 0.7);
  const hy = 440 + dy + bob;
  const tired = 1 - joy;
  const o = blink(f, 9);
  return (
    <g>
      {/* torso */}
      <path d={`M ${GIRL_X - 170},${900 + dy} C ${GIRL_X - 172},${640 + dy} ${GIRL_X - 120},${590 + dy + bob} ${GIRL_X},${588 + dy + bob} C ${GIRL_X + 120},${590 + dy + bob} ${GIRL_X + 172},${640 + dy} ${GIRL_X + 170},${900 + dy} Z`} fill="#ffc83d" />
      <path d={`M ${GIRL_X - 170},${900 + dy} C ${GIRL_X - 172},${700 + dy} ${GIRL_X - 150},${650 + dy} ${GIRL_X - 110},${620 + dy + bob} C ${GIRL_X - 130},${680 + dy} ${GIRL_X - 130},${800 + dy} ${GIRL_X - 120},${900 + dy} Z`} fill="#e8a91f" opacity={0.6} />
      <rect x={GIRL_X - 28} y={hy + 60} width={56} height={60} rx={20} fill={skin} />
      <path d={`M ${GIRL_X - 48},${hy + 108} Q ${GIRL_X},${hy + 140} ${GIRL_X + 48},${hy + 108}`} stroke="#ffffff" strokeWidth={10} fill="none" strokeLinecap="round" />
      {/* hair puffs behind */}
      <circle cx={GIRL_X - 98} cy={hy - 92} r={60} fill="#2a1711" />
      <circle cx={GIRL_X + 98} cy={hy - 92} r={60} fill="#2a1711" />
      <circle cx={GIRL_X - 78} cy={hy - 70} r={14} fill="#e8233a" />
      <circle cx={GIRL_X + 78} cy={hy - 70} r={14} fill="#e8233a" />
      {/* head */}
      <circle cx={GIRL_X} cy={hy} r={94} fill={skin} />
      <path d={`M ${GIRL_X - 96},${hy + 6} C ${GIRL_X - 108},${hy - 128} ${GIRL_X + 108},${hy - 128} ${GIRL_X + 96},${hy + 6} C ${GIRL_X + 86},${hy - 26} ${GIRL_X + 60},${hy - 40} ${GIRL_X + 30},${hy - 36} C ${GIRL_X + 10},${hy - 50} ${GIRL_X - 20},${hy - 52} ${GIRL_X - 40},${hy - 34} C ${GIRL_X - 66},${hy - 38} ${GIRL_X - 88},${hy - 24} ${GIRL_X - 96},${hy + 6} Z`} fill="#2a1711" />
      <path d={`M ${GIRL_X - 50},${hy - 84} C ${GIRL_X - 20},${hy - 100} ${GIRL_X + 20},${hy - 100} ${GIRL_X + 44},${hy - 86}`} stroke="#4a2a1e" strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={GIRL_X - 92} cy={hy + 10} rx={14} ry={20} fill={skin} />
      <ellipse cx={GIRL_X + 92} cy={hy + 10} rx={14} ry={20} fill={skin} />
      <g transform={`translate(${GIRL_X} ${hy + 12})`}>
        <Face f={f} seed={9} size={12} gap={56} look={joy > 0.5 ? [0.6, -0.4] : [0.3, 0.6]} open={joy > 0.5 ? o : o * 0.42} mood={joy > 0.5 ? "happy" : "sad"} ink="#24120c" />
        {/* tired brows */}
        <g opacity={tired}>
          <path d="M -40,-21 L -16,-29" stroke="#24120c" strokeWidth={4} strokeLinecap="round" />
          <path d="M 40,-21 L 16,-29" stroke="#24120c" strokeWidth={4} strokeLinecap="round" />
        </g>
      </g>
      {/* sweat drop */}
      <path transform={`translate(${GIRL_X + 64} ${hy - 40 + 10 * ramp((f % 60), 0, 60)})`} d="M 0,-14 C 7,-4 10,2 10,6 A 10,10 0 0 1 -10,6 C -10,2 -7,-4 0,-14 Z" fill="#bfe9ff" opacity={0.9 * tired} />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------

export const Film: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = STORY;
  const cam = camera(f, CAM);
  const fade = Math.max(1 - ramp(f, 0, 10), ramp(f, STORY.durationFrames - 20, STORY.durationFrames - 1));

  // --- beat values -------------------------------------------------------------------------
  const joy = eout(ramp(f, CUES.joy - 4, CUES.joy + 8));
  const heat = eio(ramp(f, CUES.girlRise, CUES.girlRise + 40)) * (1 - eout(ramp(f, CUES.pop, CUES.pop + 14)));
  const cool = eout(ramp(f, CUES.pop, CUES.pop + 20));

  // The kid's hand and the blue can
  const reachT = eio(ramp(f, CUES.reach, CUES.grab));
  const liftT = eio(ramp(f, CUES.lift, CUES.lift + 26));
  const downT = eio(ramp(f, CUES.setDown, CUES.setDown + 22));
  const goneT = eio(ramp(f, CUES.setDown + 24, CUES.handGone));
  const shake = f >= CUES.tooSweet && f < CUES.setDown ? 5 * Math.sin((f - CUES.tooSweet) * 0.7) * (1 - ramp(f, CUES.tooSweet + 20, CUES.setDown)) : 0;
  const blueAt: Pt = f < CUES.setDown ? lerpPt(BLUE_REST, BLUE_LIFT, liftT) : lerpPt(BLUE_LIFT, BLUE_REST, downT);
  const blueLand = f >= CUES.setDown + 22 ? Math.sin(clamp01((f - CUES.setDown - 22) / 10) * Math.PI) * 0.08 : 0;
  const blueGrip: Pt = [blueAt[0] + 58, blueAt[1] - 30];
  const kidHand: Pt = f < CUES.setDown + 24 ? lerpPt(KID_START, blueGrip, reachT) : lerpPt(blueGrip, KID_START, goneT);
  const kidVisible = f >= CUES.reach && f < CUES.handGone;
  const blueMood: Mood = f >= CUES.tooSweet && f < CUES.setDown + 30 ? "o" : f >= CUES.lift && f < CUES.tooSweet ? "happy" : "smile";

  // The girl and Fizz
  const girlDy = (1 - eback(ramp(f, CUES.girlRise, CUES.girlRise + 26))) * 470;
  const fizzT = eio(ramp(f, CUES.fizzLift, CUES.fizzLift + 26));
  const hop = f >= CUES.fizzName && f < CUES.fizzName + 22 ? Math.sin(((f - CUES.fizzName) / 22) * Math.PI) * 36 : 0;
  const popBounce = f >= CUES.pop ? Math.exp(-(f - CUES.pop) / 9) * Math.sin((f - CUES.pop) * 0.9) : 0;
  const fizzAt: Pt = lerpPt(FIZZ_REST, FIZZ_HELD, fizzT);
  fizzAt[1] -= hop;
  const fizzRot = lerp(0, -4, fizzT) + 3 * popBounce;
  const fizzSq = 1 - 0.1 * popBounce + (hop > 0 ? 0.05 * Math.sin(((f - CUES.fizzName) / 22) * Math.PI) : 0);
  const tab = eback(ramp(f, CUES.pop - 2, CUES.pop + 6));
  const tabTop: Pt = [fizzAt[0] - 10, fizzAt[1] - 252 * fizzSq];
  const fizzMood: Mood =
    f >= CUES.pop ? "happy" : f >= CUES.girlReach ? "o" : f >= CUES.fizzSad ? "sad" : f >= CUES.reach ? "o" : f >= CUES.fizzName && f < CUES.fizzName + 40 ? "happy" : "smile";
  const fizzLook: Pt =
    f >= CUES.pop ? [-0.6, -0.4] : f >= CUES.girlRise ? [-0.8, -0.6] : f >= CUES.fizzSad ? [0.2, 0.9] : f >= CUES.reach ? [1, -0.2] : f >= CUES.tabGlint - 4 && f < CUES.reach ? [0, -1] : [0.3, 0];
  const wink = eio(ramp(f, CUES.wink, CUES.wink + 5)) * (1 - eio(ramp(f, CUES.wink + 22, CUES.wink + 28)));

  const girlShoulder: Pt = [GIRL_X + 120, 640 + girlDy];
  const fizzGrip: Pt = [fizzAt[0] - 58, fizzAt[1] - 30];
  const girlHand: Pt =
    f < CUES.girlReach - 10 ? [700, 860] : f < CUES.girlReach ? lerpPt([700, 860], [705, 690], eout(ramp(f, CUES.girlReach - 10, CUES.girlReach))) : f < CUES.fizzLift ? lerpPt([705, 690], fizzGrip, eio(ramp(f, CUES.girlReach, CUES.fizzLift))) : fizzGrip;
  const girlElbow: Pt = [lerp(girlShoulder[0], girlHand[0], 0.5) + 30, Math.max(girlShoulder[1], girlHand[1]) + 50];
  const girlArmFront = f >= CUES.girlReach;

  // --- draw --------------------------------------------------------------------------------
  const par = (k: number) => `translate(${(cam.cx - 960) * k} ${(cam.cy - 540) * k})`;
  const girlArm = <Arm from={girlShoulder} ctrl={girlElbow} hand={girlHand} skin="#a8693f" sleeve="#ffc83d" width={42} />;

  return (
    <AbsoluteFill style={{ backgroundColor: "#8fd0f5" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <StoryDefs />
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5fb9f0" /><stop offset="0.6" stopColor="#a9def7" /><stop offset="1" stopColor="#fff1cf" /></linearGradient>
          <linearGradient id="heat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff9a3c" /><stop offset="1" stopColor="#ffd36b" /></linearGradient>
          <linearGradient id="redBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9c0019" /><stop offset="0.2" stopColor="#df1229" /><stop offset="0.42" stopColor="#ff4655" /><stop offset="0.62" stopColor="#e3142a" /><stop offset="1" stopColor="#8a0016" /></linearGradient>
          <linearGradient id="blueBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0f3478" /><stop offset="0.2" stopColor="#2462d4" /><stop offset="0.42" stopColor="#5d96ff" /><stop offset="0.62" stopColor="#2360d0" /><stop offset="1" stopColor="#0d2f6e" /></linearGradient>
          <linearGradient id="silver" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8e98a3" /><stop offset="0.35" stopColor="#f2f5f8" /><stop offset="0.6" stopColor="#c5cdd5" /><stop offset="1" stopColor="#87919c" /></linearGradient>
          <linearGradient id="tableShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a2a10" stopOpacity="0" /><stop offset="1" stopColor="#5a2a10" stopOpacity="0.3" /></linearGradient>
          <pattern id="gingham" width="84" height="56" patternUnits="userSpaceOnUse" patternTransform="translate(0 720)">
            <rect width="84" height="56" fill="#fff6ee" />
            <rect width="42" height="56" fill="#e8434e" opacity="0.42" />
            <rect width="84" height="28" fill="#e8434e" opacity="0.42" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#sky)" />

        <g transform={worldTransform(cam, width, height)}>
          {/* far layer: sun, clouds, hills (parallax) */}
          <g transform={par(0.5)}>
            <rect x={-600} y={-400} width={3200} height={1100} fill="url(#sky)" />
            <g transform="translate(300 150)">
              <Glow x={0} y={0} r={420 + 40 * heat} opacity={0.85 + 0.15 * heat} />
              <g transform={`rotate(${f * 0.25})`} opacity={0.35}>
                {Array.from({ length: 12 }, (_, k) => <path key={k} transform={`rotate(${k * 30})`} d="M -10,-100 L 0,-150 L 10,-100 Z" fill="#fff3b8" />)}
              </g>
              <circle r={74} fill="#fff4bd" />
              <circle r={60} fill="#ffe98a" />
            </g>
            {CLOUDS.map((c, k) => <Cloud key={k} x={((c.x + f * c.v * 10 + 400) % 2600) - 400} y={c.y} s={c.s} />)}
            <path d="M -700,640 C -300,520 100,560 500,600 C 900,640 1200,520 1600,540 C 2000,560 2300,600 2700,580 L 2700,900 L -700,900 Z" fill="#a6dc8c" />
          </g>
          <g transform={par(0.25)}>
            <path d="M -700,700 C -200,610 300,650 800,680 C 1300,710 1700,630 2200,650 C 2500,660 2700,690 2800,700 L 2800,900 L -700,900 Z" fill="#82c96b" />
            {/* tree */}
            <g transform={`translate(1700 690) rotate(${1.2 * wobble(f, 2, 0.5)})`}>
              <path d="M -18,0 C -14,-80 -20,-150 -10,-210 L 12,-210 C 20,-150 16,-80 20,0 Z" fill="#8a5a36" />
              <circle cx={-60} cy={-250} r={90} fill="#5cae55" />
              <circle cx={60} cy={-270} r={96} fill="#62b85b" />
              <circle cx={0} cy={-340} r={100} fill="#6cc463" />
              <circle cx={-20} cy={-370} r={50} fill="#86d779" opacity={0.6} />
            </g>
            {GRASS.map((g, k) => <path key={k} d={`M ${g.x},712 q ${3 + 2 * Math.sin(f * 0.05 + g.s)},${-g.h * 0.6} ${2 * Math.sin(f * 0.05 + g.s)},${-g.h}`} stroke="#6db95a" strokeWidth={4} fill="none" strokeLinecap="round" />)}
          </g>
          {/* butterfly */}
          {(() => {
            const bx = 1380 + 140 * Math.sin(f * 0.021), by = 430 + 50 * Math.sin(f * 0.043);
            const flap = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.5));
            return (
              <g transform={`translate(${bx} ${by})`}>
                <ellipse cx={-11} cy={0} rx={12 * flap} ry={10} fill="#ff9fc0" />
                <ellipse cx={11} cy={0} rx={12 * flap} ry={10} fill="#ff9fc0" />
                <rect x={-2} y={-8} width={4} height={16} rx={2} fill="#6b3b4a" />
              </g>
            );
          })()}

          {/* the girl rises behind the table */}
          {f >= CUES.girlRise && <Girl f={f} dy={girlDy} joy={joy} />}
          {f >= CUES.girlRise && !girlArmFront && girlArm}

          {/* the picnic table */}
          <rect x={-500} y={TABLE_Y} width={2920} height={500} fill="url(#gingham)" />
          <rect x={-500} y={TABLE_Y} width={2920} height={500} fill="url(#tableShade)" />
          <rect x={-500} y={TABLE_Y - 4} width={2920} height={8} fill="#fffaf3" opacity={0.7} />
          {/* plate with a sandwich */}
          <g transform="translate(380 850)">
            <ellipse rx={130} ry={40} fill="#f4f1ec" />
            <ellipse rx={100} ry={28} fill="#e3ddd4" />
            <path d="M -70,-6 L 60,-30 L 76,6 L -54,22 Z" fill="#f2c27a" />
            <path d="M -66,-12 L 62,-36 L 66,-26 L -62,-2 Z" fill="#7bc95a" />
            <path d="M -70,-20 L 60,-44 L 64,-34 L -66,-10 Z" fill="#f2c27a" />
          </g>
          {/* watermelon slice */}
          <g transform="translate(1530 860) rotate(-8)">
            <path d="M -110,0 A 110,70 0 0 0 110,0 Z" fill="#4c9a3c" />
            <path d="M -98,0 A 98,58 0 0 0 98,0 Z" fill="#ff5b6b" />
            {[-60, -25, 15, 50].map((x, k) => <ellipse key={k} cx={x} cy={18 + (k % 2) * 8} rx={4} ry={7} fill="#2a1a14" />)}
          </g>

          {/* shadows on the table */}
          <ellipse cx={blueAt[0]} cy={BLUE_REST[1] + 2} rx={70 * (1 - 0.4 * (BLUE_REST[1] - blueAt[1]) / 160)} ry={12} fill="#4a1b10" opacity={0.22 * (1 - 0.6 * (BLUE_REST[1] - blueAt[1]) / 160)} />
          {fizzT < 1 && <ellipse cx={FIZZ_REST[0]} cy={FIZZ_REST[1] + 2} rx={70 - 30 * fizzT - hop * 0.4} ry={12} fill="#4a1b10" opacity={0.22 * (1 - fizzT)} />}

          {/* the shiny blue can, and the hand that picks it up */}
          <Can f={f} x={blueAt[0]} y={blueAt[1]} kind="blue" seed={4} mood={blueMood} look={f >= CUES.reach && f < CUES.handGone ? [1, -0.6] : [-0.8, 0]} rot={shake} sq={1 - blueLand} glintEvery={70} />
          {kidVisible && <Arm from={KID_START} ctrl={[lerp(1900, 1500, reachT), lerp(520, 640, reachT) - 80 * liftT * (1 - downT)]} hand={kidHand} skin="#f1c49e" sleeve="#7ac6ff" width={56} flip />}

          {/* sugar cubes: "too sweet" */}
          {CUBES.map((c, k) => {
            const t = f - CUES.tooSweet - c.d;
            if (t < 0 || t > 42) return null;
            const x0 = BLUE_LIFT[0], y0 = BLUE_LIFT[1] - 250;
            return (
              <g key={k} transform={`translate(${x0 + c.vx * t} ${y0 + c.vy * t + 0.55 * t * t}) rotate(${c.rot + t * 6})`} opacity={1 - ramp(t, 30, 42)}>
                <rect x={-13} y={-13} width={26} height={26} rx={5} fill="#ffffff" stroke="#f2b8c8" strokeWidth={3} />
                <circle cx={-4} cy={-4} r={2} fill="#f2b8c8" />
              </g>
            );
          })}

          {/* Fizz */}
          <Can f={f} x={fizzAt[0]} y={fizzAt[1]} kind="red" seed={1} mood={fizzMood} look={fizzLook} rot={fizzRot} sq={fizzSq} tab={tab} wink={wink} eyeScale={f >= CUES.girlReach && f < CUES.pop ? 1.15 : 1} glintEvery={0} />
          {/* the token glints: she's saving her best bubbles */}
          {f >= CUES.tabGlint && f < CUES.tabGlint + 34 && (() => {
            const t = ramp(f, CUES.tabGlint, CUES.tabGlint + 34);
            return (
              <g>
                <Sparkle x={tabTop[0] + 6} y={tabTop[1] - 8} s={22 * Math.sin(t * Math.PI)} o={1} rot={t * 90} />
                {[0, 1].map((k) => <circle key={k} cx={tabTop[0] - 10 + k * 18} cy={tabTop[1] - 10 - 40 * eout(ramp(f, CUES.tabGlint + 4 + k * 6, CUES.tabGlint + 22 + k * 6))} r={6 - k} fill="none" stroke="#ffffff" strokeWidth={2.5} opacity={1 - ramp(f, CUES.tabGlint + 20 + k * 6, CUES.tabGlint + 30 + k * 6)} />)}
              </g>
            );
          })()}
          {f >= CUES.girlRise && girlArmFront && girlArm}

          {/* heat shimmer above the girl */}
          {heat > 0.01 && [0, 1, 2].map((k) => {
            const p = ((f * 1.2 + k * 30) % 90) / 90;
            const x = GIRL_X - 60 + k * 60, y = 290 + girlDy - p * 90;
            return <path key={k} d={`M ${x},${y} q 10,-12 0,-24 q -10,-12 0,-24`} stroke="#fff2c4" strokeWidth={5} fill="none" strokeLinecap="round" opacity={heat * Math.sin(p * Math.PI) * 0.9} />;
          })}

          {/* the pop: rings, a burst of bubbles, then a gentle stream */}
          {f >= CUES.pop && f < CUES.pop + 30 && [0, 1].map((k) => {
            const t = ramp(f, CUES.pop + k * 5, CUES.pop + 24 + k * 5);
            return <circle key={k} cx={tabTop[0]} cy={tabTop[1]} r={20 + 220 * eout(t)} fill="none" stroke="#e6fbff" strokeWidth={8 * (1 - t)} opacity={0.8 * (1 - t)} />;
          })}
          {BURST.map((b, k) => {
            const t = f - CUES.pop - b.d;
            if (t < 0 || t > b.life) return null;
            const p = t / b.life;
            const e = eout(p);
            return <circle key={k} cx={tabTop[0] + b.vx * e + 8 * Math.sin(t * 0.3 + k)} cy={tabTop[1] + b.vy * e} r={b.r * (0.6 + 0.4 * Math.min(1, p * 4))} fill="#ffffff" fillOpacity={0.25} stroke="#ffffff" strokeWidth={2.5} opacity={1 - ramp(p, 0.7, 1)} />;
          })}
          {f >= CUES.pop + 10 && STREAM.map((s, k) => {
            const p = ((f - CUES.pop + s.off) % 40) / 40;
            return <circle key={k} cx={tabTop[0] + s.x + 5 * Math.sin(f * 0.2 + k)} cy={tabTop[1] - 10 - p * 120} r={s.r} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.8 * Math.sin(p * Math.PI)} />;
          })}

          {/* "Crisp, cold": frost sparkles around Fizz */}
          {f >= CUES.frost && FROST.map((s, k) => {
            const tw = 0.5 + 0.5 * Math.sin((f - CUES.frost) * 0.25 + s.t);
            const grow = eback(ramp(f, CUES.frost + k * 2, CUES.frost + 10 + k * 2));
            const fadeOut = 1 - ramp(f, CUES.pullOut + 20, CUES.pullOut + 40);
            return <Sparkle key={k} x={fizzAt[0] + Math.cos(s.a) * s.d * 0.9} y={fizzAt[1] - 130 + Math.sin(s.a) * s.d} s={s.s * grow * (0.6 + 0.4 * tw)} o={fadeOut} fill="#e2f7ff" rot={f} />;
          })}

          {/* "just right": a heart */}
          {f >= CUES.heart && f < CUES.heart + 50 && (
            <Heart x={GIRL_X + 20} y={300 - 60 * eout(ramp(f, CUES.heart, CUES.heart + 50))} s={1.6 * eback(ramp(f, CUES.heart, CUES.heart + 10))} o={1 - ramp(f, CUES.heart + 36, CUES.heart + 50)} />
          )}
        </g>

        {/* heat haze before the pop, crisp cool air after */}
        <rect width={width} height={height} fill="url(#heat)" opacity={0.22 * heat} style={{ mixBlendMode: "multiply" }} />
        <rect width={width} height={height} fill="#e8fbff" opacity={0.07 * cool} style={{ mixBlendMode: "screen" }} />
        {/* the pop flash */}
        <rect width={width} height={height} fill="#ffffff" opacity={f >= CUES.pop && f < CUES.pop + 4 ? 0.26 * (1 - (f - CUES.pop) / 4) : 0} />
        <rect width={width} height={height} fill="url(#vignette)" opacity={0.6} />
        <rect y={height * 0.72} width={width} height={height * 0.28} fill="url(#subScrim)" opacity={eio(ramp(f, 10, 20))} />
      </svg>
      <Subtitles f={f} subs={SUBS} width={width} height={height} />
      {/* honest label: a fan-made opinion piece, not an official ad */}
      <div style={{ position: "absolute", top: height * 0.05, right: width * 0.04, fontFamily: HAND, fontSize: 34, color: "#fff7e6", opacity: eio(ramp(f, CUES.credit, CUES.credit + 12)), textShadow: "0 0 12px rgba(10,14,40,0.8), 0 2px 0 rgba(10,14,40,0.6)" }}>
        a fan-made story, just for fun
      </div>
      {/* The mix from scripts/mix.py already starts the voice at OFFSET (0.5 s), so it plays from frame 0. */}
      {STORY.audio && <Audio src={staticFile(STORY.audio)} />}
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};
