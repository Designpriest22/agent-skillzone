/** Remappable keyboard controls plus the virtual gamepad state. Produces one input mask per tick. */
import { B } from "../sim/input";

export type Action = "left" | "right" | "up" | "down" | "attack" | "jump" | "special" | "grab" | "dodge" | "ult" | "equip" | "pause";

export const ACTION_BITS: Record<Exclude<Action, "pause">, number> = {
  left: B.LEFT, right: B.RIGHT, up: B.UP, down: B.DOWN, attack: B.ATTACK, jump: B.JUMP,
  special: B.SPECIAL, grab: B.GRAB, dodge: B.DODGE, ult: B.ULT, equip: B.EQUIP,
};

export const ACTION_LABELS: Record<Action, string> = {
  left: "Move left", right: "Move right", up: "Move up", down: "Move down", attack: "Attack", jump: "Jump",
  special: "Special", grab: "Grab / interact", dodge: "Dodge (with direction) / Block (hold)", ult: "Ultimate", equip: "Equipment", pause: "Pause",
};

export const DEFAULT_KEYS: Record<Action, string[]> = {
  left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"], up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"],
  attack: ["KeyJ"], jump: ["KeyK"], special: ["KeyL"], grab: ["KeyU"], dodge: ["KeyI"], ult: ["Space"], equip: ["KeyQ"], pause: ["Escape", "KeyP"],
};

const STORE_KEY = "rtc.keys.v1";

export function loadKeys(): Record<Action, string[]> {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...DEFAULT_KEYS, ...JSON.parse(raw) };
  } catch { /* storage blocked */ }
  return { ...DEFAULT_KEYS };
}
export function saveKeys(k: Record<Action, string[]>) { try { localStorage.setItem(STORE_KEY, JSON.stringify(k)); } catch { /* storage blocked */ } }

export function keyLabel(code: string) {
  return code.replace(/^Key/, "").replace(/^Digit/, "").replace("Arrow", "").replace("Space", "Space").replace("Escape", "Esc");
}

export class Controls {
  private down = new Set<string>();
  touch = 0;
  onPause: (() => void) | null = null;
  constructor(public keys: Record<Action, string[]>) {}

  private onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    const isGame = (Object.keys(this.keys) as Action[]).some((a) => this.keys[a].includes(e.code));
    if (!isGame) return;
    e.preventDefault();
    if (e.type === "keydown") {
      if (this.keys.pause.includes(e.code) && !e.repeat) this.onPause?.();
      this.down.add(e.code);
    } else this.down.delete(e.code);
  };
  private onBlur = () => { this.down.clear(); this.touch = 0; };

  attach() { window.addEventListener("keydown", this.onKey); window.addEventListener("keyup", this.onKey); window.addEventListener("blur", this.onBlur); }
  detach() { window.removeEventListener("keydown", this.onKey); window.removeEventListener("keyup", this.onKey); window.removeEventListener("blur", this.onBlur); }

  mask(): number {
    let m = this.touch;
    for (const [action, bit] of Object.entries(ACTION_BITS)) if (this.keys[action as Action].some((k) => this.down.has(k))) m |= bit;
    if (m & B.LEFT && m & B.RIGHT) m &= ~(B.LEFT | B.RIGHT);
    if (m & B.UP && m & B.DOWN) m &= ~(B.UP | B.DOWN);
    return m;
  }
}
