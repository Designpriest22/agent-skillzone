/** Enemies, bosses, campaign, home areas, Capital Status ranks, store and missions. */

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  dmg: number;
  reach: number;
  windup: number; // telegraph ticks before the hit lands
  cooldown: number;
  armor: number; // light hits under this damage don't stagger
  ranged?: boolean;
  grabs?: boolean;
  score: number;
  colors: { primary: string; secondary: string; skin: string };
  atlas?: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  grunt: { id: "grunt", name: "Vibe Killer", hp: 40, speed: 1.6, dmg: 8, reach: 42, windup: 22, cooldown: 60, armor: 0, score: 100, colors: { primary: "#3b2a5a", secondary: "#8a4dff", skin: "#4a2b1d" }, atlas: "grunt" },
  runner: { id: "runner", name: "Route Runner", hp: 28, speed: 2.6, dmg: 6, reach: 38, windup: 14, cooldown: 45, armor: 0, score: 120, colors: { primary: "#F2C230", secondary: "#3b2a5a", skin: "#5b3524" }, atlas: "runner" },
  tout: { id: "tout", name: "Flyer Tout", hp: 30, speed: 1.4, dmg: 7, reach: 300, windup: 30, cooldown: 100, armor: 0, ranged: true, score: 140, colors: { primary: "#c2185b", secondary: "#2a2238", skin: "#5b3524" }, atlas: "tout" },
  bouncer: { id: "bouncer", name: "Fake Bouncer", hp: 110, speed: 1.0, dmg: 14, reach: 48, windup: 34, cooldown: 80, armor: 9, grabs: true, score: 300, colors: { primary: "#101012", secondary: "#8a4dff", skin: "#3e2418" }, atlas: "bouncer" },
};

export interface BossDef {
  id: string;
  name: string;
  title: string;
  stage: string;
  hp: number;
  intro: string;
  defeat: string;
  weakness: string;
  phases: string[];
  reward: { cash: number; xp: number; unlock?: string };
  colors: { primary: string; secondary: string; skin: string };
  art?: string;
}

export const BOSSES: Record<string, BossDef> = {
  oga_danfo: {
    id: "oga_danfo",
    name: "Oga Danfo",
    title: "King of the Wuse Park",
    stage: "01C",
    hp: 620,
    intro: "Na my park be this. Everybody dey pay. You too go pay.",
    defeat: "Okay... okay! Free ride for everybody. Just go!",
    weakness: "After a charge he crashes into the barrier and is dazed. Hit him then for double damage.",
    phases: ["Shoulder charges down a lane (watch for the horn)", "Calls touts and blasts the horn shockwave", "Enraged: double charges"],
    reward: { cash: 400, xp: 600, unlock: "gateman" },
    colors: { primary: "#F2C230", secondary: "#14161C", skin: "#3e2418" },
  },
  madam_crescent: {
    id: "madam_crescent",
    name: "Madam Crescent",
    title: "Queen of the Crescent Racket",
    stage: "02C",
    hp: 760,
    intro: "Darling, nobody walks down my Crescent without paying the cover charge.",
    defeat: "Fine. The strip is yours tonight. Tomorrow, we talk business.",
    weakness: "After each neon light show she strikes a pose. That's your window: double damage.",
    phases: [
      "VIP booth: untouchable, throws bottles and sends bouncers until her guards fall",
      "Down on the floor: fan combos and the velvet-rope pull (dodge it)",
      "Neon light show: floor tiles light up; stand on the dark ones, then punish her pose",
    ],
    reward: { cash: 600, xp: 900, unlock: "okadaghost" },
    colors: { primary: "#FF3FA4", secondary: "#FFC93C", skin: "#6a4029" },
  },
};

export type HazardKind = "traffic" | "pulse";
export interface Hazard { kind: HazardKind; every: number; x?: number; w?: number; dmg: number }

export interface Wave {
  at: number; // camera x that triggers the wave
  groups: { kind: string; count: number; side: "L" | "R" | "both" }[];
}

export interface Substage {
  id: string;
  stage: string;
  name: string;
  objective: string;
  bg: string;
  night: boolean;
  length: number;
  par: number; // par time in seconds
  waves: Wave[];
  breakables: { x: number; y: number; kind: "bag" | "crate" | "cooler"; drop: string }[];
  hazards: Hazard[];
  boss?: string;
  unlockedBy?: string;
  /** Bonus party stage: no enemies, smash the party chests and reach the end. */
  bonus?: boolean;
}

export interface Stage { id: string; name: string; district: string; blurb: string; substages: string[]; playable: boolean; mapPos: [number, number] }

export const STAGES: Stage[] = [
  { id: "01", name: "Wuse II", district: "Wuse", blurb: "The Vibe Killers have taken the plaza.", substages: ["01A", "01B", "01C"], playable: true, mapPos: [0.46, 0.36] },
  { id: "02", name: "Aminu Kano", district: "Wuse II", blurb: "The Crescent's nightlife belongs to Madam Crescent.", substages: ["02A", "02B", "02R", "02C"], playable: true, mapPos: [0.6, 0.22] },
  { id: "03", name: "Garki", district: "Garki", blurb: "Market levies and backstreet tolls.", substages: ["03A", "03B", "03C"], playable: false, mapPos: [0.7, 0.62] },
  { id: "04", name: "Area 1", district: "Garki", blurb: "The estate has its own rules.", substages: ["04A", "04B", "04C"], playable: false, mapPos: [0.42, 0.74] },
  { id: "05", name: "Jabi", district: "Jabi", blurb: "Trouble on the waterfront.", substages: ["05A", "05B", "05C"], playable: false, mapPos: [0.22, 0.34] },
];

const G = (kind: string, count: number, side: "L" | "R" | "both" = "R") => ({ kind, count, side });

export const SUBSTAGES: Record<string, Substage> = {
  "01A": {
    id: "01A", stage: "01", name: "The Streets", objective: "Clear the plaza and reach the roundabout.", bg: "wuse", night: false, length: 2200, par: 150,
    waves: [
      { at: 120, groups: [G("grunt", 3)] },
      { at: 700, groups: [G("grunt", 2), G("runner", 2, "L")] },
      { at: 1240, groups: [G("tout", 2), G("grunt", 3, "both")] },
    ],
    breakables: [
      { x: 520, y: 470, kind: "bag", drop: "suya" },
      { x: 980, y: 430, kind: "crate", drop: "pipe" },
      { x: 1500, y: 500, kind: "bag", drop: "token" },
      { x: 1800, y: 440, kind: "cooler", drop: "jollof" },
    ],
    hazards: [],
  },
  "01B": {
    id: "01B", stage: "01", name: "The Night Shift", objective: "Survive the night traffic and break the blockade.", bg: "nightshift", night: true, length: 2400, par: 180,
    waves: [
      { at: 160, groups: [G("runner", 3, "both")] },
      { at: 760, groups: [G("grunt", 3), G("tout", 1)] },
      { at: 1300, groups: [G("bouncer", 1), G("grunt", 2, "L")] },
      { at: 1800, groups: [G("tout", 2), G("runner", 3, "both")] },
    ],
    breakables: [
      { x: 600, y: 500, kind: "crate", drop: "bottle" },
      { x: 1100, y: 430, kind: "bag", drop: "token" },
      { x: 1650, y: 480, kind: "cooler", drop: "jollof" },
      { x: 2100, y: 450, kind: "bag", drop: "cash" },
    ],
    hazards: [{ kind: "traffic", every: 420, dmg: 18 }],
    unlockedBy: "01A",
  },
  "01C": {
    id: "01C", stage: "01", name: "The Final Stop", objective: "Take the motor park from Oga Danfo.", bg: "motorpark", night: true, length: 1500, par: 200,
    waves: [{ at: 140, groups: [G("grunt", 3, "both")] }],
    breakables: [
      { x: 420, y: 470, kind: "bag", drop: "suya" },
      { x: 700, y: 430, kind: "crate", drop: "token" },
    ],
    hazards: [],
    boss: "oga_danfo",
    unlockedBy: "01B",
  },
  "02A": {
    id: "02A", stage: "02", name: "The Strip", objective: "Walk the Crescent past the touts.", bg: "crescent", night: true, length: 2300, par: 170,
    waves: [
      { at: 150, groups: [G("tout", 2), G("grunt", 2)] },
      { at: 820, groups: [G("runner", 3, "both"), G("grunt", 1)] },
      { at: 1400, groups: [G("bouncer", 1), G("tout", 2)] },
    ],
    breakables: [
      { x: 560, y: 460, kind: "cooler", drop: "suya" },
      { x: 1180, y: 500, kind: "bag", drop: "token" },
      { x: 1900, y: 440, kind: "crate", drop: "pipe" },
    ],
    hazards: [{ kind: "traffic", every: 520, dmg: 18 }],
    unlockedBy: "01C",
  },
  "02B": {
    id: "02B", stage: "02", name: "The Nightlife District", objective: "Get past the speakers and the guest list.", bg: "nightlife", night: true, length: 2400, par: 190,
    waves: [
      { at: 160, groups: [G("bouncer", 1), G("grunt", 2, "both")] },
      { at: 900, groups: [G("tout", 3), G("runner", 2, "L")] },
      { at: 1600, groups: [G("bouncer", 2), G("grunt", 2)] },
    ],
    breakables: [
      { x: 700, y: 480, kind: "bag", drop: "token" },
      { x: 1300, y: 440, kind: "cooler", drop: "jollof" },
      { x: 2000, y: 500, kind: "crate", drop: "bottle" },
    ],
    hazards: [{ kind: "pulse", every: 300, x: 1150, w: 220, dmg: 14 }],
    unlockedBy: "02A",
  },
  /**
   * Bonus stage: Romie's Block, DJ Romie's weekly Monday night party (Papiees Meatro, Jahi), Afrobeats into
   * Amapiano into Afro-House. No enemies: dance through the crowd, smash the party chests, reach the decks.
   */
  "02R": {
    id: "02R", stage: "02", name: "Romie's Block", objective: "Bonus stage · Monday night at Romie's Block. Dance through the crowd and grab everything.", bg: "romiesblock", night: true, length: 2600, par: 90,
    waves: [],
    breakables: [
      { x: 360, y: 450, kind: "bag", drop: "cash" }, { x: 560, y: 505, kind: "crate", drop: "cash" },
      { x: 760, y: 430, kind: "cooler", drop: "token" }, { x: 980, y: 480, kind: "bag", drop: "cash" },
      { x: 1180, y: 510, kind: "crate", drop: "suya" }, { x: 1380, y: 440, kind: "bag", drop: "cash" },
      { x: 1580, y: 490, kind: "cooler", drop: "cash" }, { x: 1780, y: 430, kind: "bag", drop: "token" },
      { x: 1980, y: 500, kind: "crate", drop: "cash" }, { x: 2180, y: 455, kind: "bag", drop: "jollof" },
      { x: 2380, y: 485, kind: "cooler", drop: "token" },
    ],
    hazards: [],
    unlockedBy: "02B",
    bonus: true,
  },
  "02C": {
    id: "02C", stage: "02", name: "The Nightlife Boss", objective: "Close down Madam Crescent's racket.", bg: "clubboss", night: true, length: 1400, par: 240,
    waves: [],
    breakables: [
      { x: 300, y: 470, kind: "cooler", drop: "suya" },
      { x: 520, y: 500, kind: "bag", drop: "token" },
    ],
    hazards: [],
    boss: "madam_crescent",
    unlockedBy: "02R",
  },
};

export const SUBSTAGE_ORDER = ["01A", "01B", "01C", "02A", "02B", "02R", "02C"];

/** Home areas. Players pick one at signup; it shapes their intro mission and rewards. No location data is collected. */
export const AREAS = [
  { id: "wuse", name: "Wuse", city: "Abuja", intro: "You step off the bus into Wuse market noise.", bonus: "suya" },
  { id: "garki", name: "Garki", city: "Abuja", intro: "Garki wakes up early, and so do you.", bonus: "cash" },
  { id: "maitama", name: "Maitama", city: "Abuja", intro: "Quiet roads, loud ambitions.", bonus: "cash" },
  { id: "asokoro", name: "Asokoro", city: "Abuja", intro: "The gate opens. You've been expected.", bonus: "jollof" },
  { id: "jabi", name: "Jabi", city: "Abuja", intro: "Morning mist over the lake.", bonus: "suya" },
  { id: "gwarinpa", name: "Gwarinpa", city: "Abuja", intro: "First Avenue, full send.", bonus: "cash" },
  { id: "kubwa", name: "Kubwa", city: "Abuja", intro: "The expressway made you patient. Not today.", bonus: "jollof" },
  { id: "lugbe", name: "Lugbe", city: "Abuja", intro: "Airport road traffic? Small thing.", bonus: "suya" },
  { id: "apo", name: "Apo", city: "Abuja", intro: "Smoke from the grills, fire in your chest.", bonus: "suya" },
  { id: "nyanya", name: "Nyanya", city: "Abuja", intro: "You came in on the first keke.", bonus: "cash" },
] as const;
export const AREA_IDS = AREAS.map((a) => a.id) as unknown as readonly [string, ...string[]];

/** CAPITAL STATUS ranks: XP thresholds and the reward for reaching each. */
export const RANKS = [
  { rank: 1, name: "Fresh Entry", xp: 0, reward: "Starter fighters" },
  { rank: 2, name: "Street Known", xp: 1500, reward: "PsychoYP + Keke Queen" },
  { rank: 3, name: "Area General", xp: 4500, reward: "Obey The Hypeman + Suya Spice" },
  { rank: 4, name: "District Don", xp: 10000, reward: "Jabi Siren + gold name plate" },
  { rank: 5, name: "Capital Enforcer", xp: 20000, reward: "Enforcer victory pose" },
  { rank: 6, name: "Capital Heavyweight", xp: 36000, reward: "Heavyweight profile frame" },
  { rank: 7, name: "Capital Legend", xp: 60000, reward: "Legend skin set" },
  { rank: 8, name: "The Capital", xp: 100000, reward: "The Capital crown badge" },
];

export function rankForXp(xp: number) {
  let r = RANKS[0]!;
  for (const k of RANKS) if (xp >= k.xp) r = k;
  const next = RANKS.find((k) => k.xp > xp) ?? null;
  return { ...r, next };
}

export function levelForXp(xp: number) {
  return Math.floor(Math.sqrt(xp / 120)) + 1;
}

/** Equipment: one slot per run (Q). Tactical, not pay-to-win: unlocked with play. */
export const EQUIPMENT = {
  smoke: { id: "smoke", name: "Smoke Canister", category: "tactical", desc: "Enemies lose track of you for 3s.", cooldown: 900 },
  firstaid: { id: "firstaid", name: "First Aid Pouch", category: "recovery", desc: "Restore 30 health.", cooldown: 1200 },
  whistle: { id: "whistle", name: "Area Whistle", category: "defensive", desc: "Knocks back everyone close.", cooldown: 720 },
  pepper: { id: "pepper", name: "Pepper Spray", category: "offensive", desc: "Stuns enemies in front for 2s.", cooldown: 840 },
} as const;
export type EquipmentId = keyof typeof EQUIPMENT;

export interface StoreItem {
  id: string;
  name: string;
  kind: "skin" | "pose" | "badge" | "frame" | "boost" | "fighter" | "equipment";
  desc: string;
  /** Earned currency price; null when not sold for Capital Cash. */
  cash: number | null;
  /** Naira price in kobo; null when not sold for money. Cosmetics and convenience only. */
  naira: number | null;
  effect?: string;
  duration?: string;
  restriction?: string;
}

export const STORE: StoreItem[] = [
  { id: "skin_odumodu_gold", name: "Odumodublvck: Gold Cap", kind: "skin", desc: "Gold-thread cap and chains.", cash: null, naira: 65000, restriction: "Cosmetic only" },
  { id: "skin_settings_owambe", name: "Settings Babe: Owambe Gele", kind: "skin", desc: "Full aso-ebi with a towering gele.", cash: null, naira: 80000, restriction: "Cosmetic only" },
  { id: "pose_suya_flip", name: "Victory Pose: Suya Flip", kind: "pose", desc: "Flip a skewer, catch it, take a bite.", cash: null, naira: 35000, restriction: "Cosmetic only" },
  { id: "frame_green_white", name: "Green-White Frame", kind: "frame", desc: "Profile frame in the national colours.", cash: 800, naira: null },
  { id: "badge_area_pride", name: "Area Pride Badge", kind: "badge", desc: "Shows your home area on your player card.", cash: 500, naira: null },
  { id: "boost_xp_1h", name: "Hustle Hour", kind: "boost", desc: "+25% XP from campaign runs.", cash: null, naira: 50000, effect: "+25% XP", duration: "1 hour", restriction: "Campaign only; never affects leaderboards or damage" },
  { id: "boost_cash_1h", name: "Big Boy Hour", kind: "boost", desc: "+25% Capital Cash from campaign runs.", cash: 1200, naira: null, effect: "+25% Capital Cash", duration: "1 hour", restriction: "Campaign only" },
  { id: "equip_smoke", name: "Smoke Canister", kind: "equipment", desc: "Tactical equipment: enemies lose track of you for 3s.", cash: 600, naira: null, effect: "Equipment slot item", restriction: "One equipment per run" },
  { id: "equip_whistle", name: "Area Whistle", kind: "equipment", desc: "Defensive equipment: knock back everyone close.", cash: 700, naira: null, effect: "Equipment slot item", restriction: "One equipment per run" },
  { id: "equip_pepper", name: "Pepper Spray", kind: "equipment", desc: "Offensive equipment: stun the enemies in front for 2s.", cash: 900, naira: null, effect: "Equipment slot item", restriction: "One equipment per run" },
  { id: "fighter_mallamtech", name: "Unlock Mallam Tech", kind: "fighter", desc: "The Wuse market gadget fighter.", cash: 1500, naira: null },
  { id: "fighter_mamaput", name: "Unlock Mama Put", kind: "fighter", desc: "The Lugbe bukka tank.", cash: 2000, naira: null },
  { id: "fighter_agbadadon", name: "Unlock Agbada Don", kind: "fighter", desc: "The Maitama grappler.", cash: 2500, naira: null },
];
export const STORE_BY_ID: Record<string, StoreItem> = Object.fromEntries(STORE.map((i) => [i.id, i]));

/** Missions: per-run goals checked against the server-verified result. */
export interface MissionDef { id: string; name: string; desc: string; period: "daily" | "weekly" | "event"; xp: number; cash: number; check: { combo?: number; rating?: string; boss?: boolean; kos?: number; noDamage?: boolean; tokens?: number; substage?: string } }
export const MISSIONS: MissionDef[] = [
  { id: "d_combo20", name: "Chain Reaction", desc: "Land a 20-hit combo.", period: "daily", xp: 250, cash: 120, check: { combo: 20 } },
  { id: "d_rating_a", name: "Clean Work", desc: "Clear any substage with an A rating or better.", period: "daily", xp: 300, cash: 150, check: { rating: "A" } },
  { id: "d_kos25", name: "Street Sweeper", desc: "KO 25 Vibe Killers in one run.", period: "daily", xp: 250, cash: 120, check: { kos: 25 } },
  { id: "d_token", name: "Treasure Hunter", desc: "Find a hidden Capital token.", period: "daily", xp: 200, cash: 100, check: { tokens: 1 } },
  { id: "w_boss", name: "Boss Business", desc: "Defeat a district boss.", period: "weekly", xp: 900, cash: 500, check: { boss: true } },
  { id: "w_combo50", name: "Fifty Bars", desc: "Land a 50-hit combo.", period: "weekly", xp: 1000, cash: 500, check: { combo: 50 } },
  { id: "w_s_rank", name: "Capital Standard", desc: "Earn an S rating.", period: "weekly", xp: 1200, cash: 600, check: { rating: "S" } },
];

/** Limited-time festival events: one extra mission each, claimable once per player while the event runs. */
export interface GameEvent { id: string; name: string; tagline: string; date: string; venue: string; art: string; start: string; end: string; mission: MissionDef }
export const EVENTS: GameEvent[] = [
  {
    id: "liveoutloud", name: "Live Out Loud Music Festival", tagline: "Wizkid live in Abuja", date: "13 Dec", venue: "Eagle Square, Abuja",
    art: "/game/events/liveoutloud.webp", start: "2026-11-01T00:00:00Z", end: "2026-12-13T23:00:00Z",
    mission: { id: "e_liveoutloud", name: "Live Out Loud", desc: "Clear The Strip (02A) with a 25-hit combo before the festival.", period: "event", xp: 1500, cash: 750, check: { substage: "02A", combo: 25 } },
  },
];
export function activeEvents(date: Date): GameEvent[] {
  const t = date.getTime();
  return EVENTS.filter((e) => t >= Date.parse(e.start) && t < Date.parse(e.end));
}

export function activeMissions(date: Date): MissionDef[] {
  const day = Math.floor(date.getTime() / 86400000);
  const week = Math.floor((day + 3) / 7);
  const daily = MISSIONS.filter((m) => m.period === "daily");
  const weekly = MISSIONS.filter((m) => m.period === "weekly");
  return [daily[day % daily.length]!, daily[(day + 1) % daily.length]!, weekly[week % weekly.length]!, ...activeEvents(date).map((e) => e.mission)];
}
export function missionPeriod(m: MissionDef, date: Date): string {
  const day = Math.floor(date.getTime() / 86400000);
  if (m.period === "event") return "event";
  return m.period === "daily" ? `d${day}` : `w${Math.floor((day + 3) / 7)}`;
}

export const ACHIEVEMENTS = [
  { id: "first_blood", name: "Somebody Call the Cops!", desc: "Clear your first substage.", xp: 1000 },
  { id: "combo_30", name: "Thirty Deep", desc: "Land a 30-hit combo.", xp: 500 },
  { id: "danfo_down", name: "Free Ride", desc: "Defeat Oga Danfo.", xp: 800 },
  { id: "crescent_closed", name: "Last Call", desc: "Defeat Madam Crescent.", xp: 1200 },
  { id: "flawless", name: "Untouchable", desc: "Clear a substage without taking damage.", xp: 1000 },
  { id: "collector", name: "Capital Collector", desc: "Find 5 hidden tokens.", xp: 700 },
] as const;
