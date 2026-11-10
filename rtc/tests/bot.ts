/** A simple scripted player used by the sim tests and the smoke test. */
import { Sim, type Actor } from "../src/game/sim/sim";
import { B } from "../src/game/sim/input";

export function botMask(sim: Sim): number {
  const p = sim.player;
  const foes = sim.actors.filter((a) => a.team === 1 && a.st !== "dead" && a.st !== "booth");
  let m = 0;
  if (sim.tick % 2 === 0) {
    const k = sim.pickups.find((q) => q.alive && Math.abs(q.x - p.x) < 30 && Math.abs(q.y - p.y) < 18);
    if (k) return B.GRAB;
  }
  const target = foes.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0] as Actor | undefined;
  if (!target) {
    const prop = sim.props.find((q) => q.alive && q.x > p.x - 40 && q.x < p.x + 300);
    if (prop && Math.abs(prop.x - p.x) < 50 && Math.abs(prop.y - p.y) < 14) {
      const turn = prop.x < p.x && p.face === 1 ? B.LEFT : prop.x > p.x && p.face === -1 ? B.RIGHT : 0;
      if (Math.abs(prop.x - p.x) < 8) return B.LEFT;
      return turn | (sim.tick % 6 < 2 ? B.ATTACK : 0);
    }
    const ty = prop ? prop.y : 460;
    m |= B.RIGHT;
    if (p.y < ty - 4) m |= B.DOWN; else if (p.y > ty + 4) m |= B.UP;
    return m;
  }
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  if (Math.abs(dx) > 46) m |= dx > 0 ? B.RIGHT : B.LEFT;
  else if (Math.abs(dx) < 24) m |= dx > 0 ? B.LEFT : B.RIGHT;
  if (dy > 6) m |= B.DOWN; else if (dy < -6) m |= B.UP;
  if (Math.abs(dx) < 70 && Math.abs(dy) < 14) {
    if ((p.face === 1) !== (dx > 0)) m |= dx > 0 ? B.RIGHT : B.LEFT;
    if (sim.tick % 5 === 0) m |= B.ATTACK;
  }
  if (sim.special >= 60 && foes.length >= 2 && sim.tick % 20 === 0) m |= B.SPECIAL;
  if (sim.ult >= 100) m |= B.ULT;
  if (sim.hazardWarn && sim.hazardWarn.kind === "traffic" && Math.abs(sim.hazardWarn.y - p.y) < 30) m = (m & ~(B.UP | B.DOWN)) | (p.y > 460 ? B.UP : B.DOWN);
  if (sim.tiles.phase && sim.tick % 3 === 0) m |= B.JUMP;
  return m;
}

export function playBot(substage: string, fighter: string, seed: number, maxTicks = 60 * 60 * 8) {
  const sim = new Sim({ seed, substage, fighter, equipment: "firstaid", recordEvents: false });
  const log: number[] = [];
  while (!sim.ended && sim.tick < maxTicks) {
    const m = botMask(sim);
    log.push(m);
    sim.step(m);
  }
  return { sim, log, result: sim.result() };
}
