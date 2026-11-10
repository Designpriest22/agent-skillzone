/**
 * The 14-fighter roster. Each fighter is data: stats feed the simulation directly,
 * and specials, ultimates and passives are distinct mechanics, not reskins.
 * Real artists (realPerson: true) need written consent before public launch.
 */

export type Archetype = "street" | "tactical" | "heavyweight" | "fast" | "technical" | "supernatural";

export type AbilityKind =
  | "shockwave" // radial blast around the fighter
  | "projectile" // travelling hit along the depth line
  | "dash" // fighter travels forward hitting everything in the path
  | "buff" // temporary damage / defence boost
  | "pull" // drags enemies in front toward the fighter, then stuns
  | "decoy" // distracts every enemy on screen (they stop attacking)
  | "shield" // timed parry window that reflects damage
  | "summon" // an ally crosses the screen hitting everything
  | "heal" // restores health
  | "slam"; // leap and crash down on a target zone

export interface Ability {
  name: string;
  kind: AbilityKind;
  desc: string;
  cost: number; // special meter (0-100) for specials; ultimates always need a full ultimate meter
  dmg: number;
  range: number;
  /** extra tuning per kind: duration ticks, speed, multiplier */
  ticks?: number;
  mul?: number;
}

export type PassiveId =
  | "heavy_hands" // finishers knock enemies further and break armour
  | "rhythm" // hits landed on the beat (every 30 ticks) deal +25%
  | "slipstream" // dodges are longer and recharge special meter
  | "crowd" // ultimate meter fills 50% faster
  | "connected" // 15% chance a hit makes the enemy "distracted" for 1s
  | "nimble" // +20% walk speed, double jump
  | "gatekeeper" // blocking costs nothing and reflects 25% chip damage
  | "tinker" // thrown weapons and weapons last twice as long
  | "grappler" // throws deal +40% and hit enemies they land on
  | "spice" // every 4th hit leaves a pepper burn (damage over time)
  | "drill" // equipment cooldowns are halved
  | "nourish" // food heals 60% more
  | "phantom" // dodging through an enemy leaves it stunned
  | "tide"; // specials slow enemies caught in them

export interface Fighter {
  id: string;
  name: string;
  realPerson?: boolean;
  archetype: Archetype;
  style: string;
  area: string;
  backstory: string;
  stats: { health: number; strength: number; speed: number; defence: number };
  special: Ability;
  ultimate: Ability;
  signature: string;
  passive: { id: PassiveId; name: string; desc: string };
  unlock: { type: "starter" } | { type: "rank"; rank: number } | { type: "boss"; boss: string } | { type: "cash"; price: number };
  voice: string;
  movement: string;
  colors: { primary: string; secondary: string; skin: string };
  art: { portrait?: string; atlas?: string; pending?: string };
}

export const ROSTER: Fighter[] = [
  {
    id: "odumodu",
    name: "Odumodublvck",
    realPerson: true,
    archetype: "heavyweight",
    style: "Drill-weight brawler. Slow wind-ups, crushing payoffs.",
    area: "Gwarinpa",
    backstory:
      "Came up in the capital's drill scene, where a verse had to hit like a fist. When the Vibe Killers started shutting down shows, he decided the next bars would be delivered in person.",
    stats: { health: 9, strength: 9, speed: 4, defence: 7 },
    special: { name: "Capital Stomp", kind: "shockwave", desc: "Stamps the ground and knocks down everyone close.", cost: 35, dmg: 22, range: 110 },
    ultimate: { name: "Mic Drop", kind: "slam", desc: "Leaps off-screen and drops on the crowd like a bass hit.", cost: 100, dmg: 70, range: 220 },
    signature: "Jab, jab, cross, then a knee that launches.",
    passive: { id: "heavy_hands", name: "Heavy Hands", desc: "Finishers knock enemies further and break armour." },
    unlock: { type: "starter" },
    voice: "low, unhurried, amused",
    movement: "shoulders rolling, chin up, every step planted",
    colors: { primary: "#C81E1E", secondary: "#14161C", skin: "#4a2b1d" },
    art: { portrait: "/game/portraits/odumodu.png", atlas: "odumodu" },
  },
  {
    id: "romie",
    name: "DJ Romie",
    realPerson: true,
    archetype: "technical",
    style: "Rhythm technician. Time your hits to the beat for bonus damage.",
    area: "Wuse",
    backstory:
      "The capital's busiest selector. He has played every rooftop from Maitama to Jabi. When the Vibe Killers pulled the plug on his set, he picked up his crates and went looking for whoever cut the power.",
    stats: { health: 7, strength: 6, speed: 6, defence: 6 },
    special: { name: "Scratch Back", kind: "pull", desc: "Scratches the air and yanks enemies in front of him into a stun.", cost: 30, dmg: 10, range: 260 },
    ultimate: { name: "Beat Drop", kind: "shockwave", desc: "The drop lands. The whole screen takes it.", cost: 100, dmg: 55, range: 999 },
    signature: "Two quick jabs into a spinning vinyl backhand.",
    passive: { id: "rhythm", name: "On The One", desc: "Hits that land on the beat deal 25% more damage." },
    unlock: { type: "starter" },
    voice: "calm, dry, counting bars",
    movement: "nodding to a beat nobody else hears",
    colors: { primary: "#9a6a3a", secondary: "#14161C", skin: "#3e2418" },
    art: { portrait: "/game/portraits/romie.png", atlas: "romie" },
  },
  {
    id: "psycho",
    name: "PsychoYP",
    realPerson: true,
    archetype: "fast",
    style: "Trap-speed striker. Dashes in, out, and back again.",
    area: "Wuse",
    backstory:
      "Leader of the Apex Village crew. He built a scene in the capital when nobody believed one could live there. He treats the Vibe Killers the way he treats doubters: proves them wrong, quickly.",
    stats: { health: 6, strength: 6, speed: 9, defence: 5 },
    special: { name: "Apex Dash", kind: "dash", desc: "Blurs across the street, hitting everything in the lane.", cost: 30, dmg: 18, range: 320 },
    ultimate: { name: "YPSZN", kind: "dash", desc: "A chain of five dashes that ends in a launch.", cost: 100, dmg: 60, range: 400, ticks: 5 },
    signature: "Flicker jab, spin kick, and a dash-cancel back into the chain.",
    passive: { id: "slipstream", name: "Slipstream", desc: "Longer dodges that charge the special meter." },
    unlock: { type: "rank", rank: 2 },
    voice: "quick, low, half-laughing",
    movement: "bouncing on the balls of the feet",
    colors: { primary: "#f2f2f2", secondary: "#9b5cff", skin: "#5b3524" },
    art: { pending: "Needs reference photos" },
  },
  {
    id: "obey",
    name: "Obey The Hypeman",
    realPerson: true,
    archetype: "street",
    style: "Crowd controller. Every hit pumps the crowd; the crowd pumps him.",
    area: "Garki",
    backstory:
      "No event in the capital starts until Obey says so. He can turn a dead room into a riot of joy. The Vibe Killers want silent streets, so he's bringing the noise to them.",
    stats: { health: 7, strength: 7, speed: 6, defence: 6 },
    special: { name: "Hype Up", kind: "buff", desc: "Gets the crowd going: +40% damage for 6 seconds.", cost: 40, dmg: 0, range: 0, ticks: 360, mul: 1.4 },
    ultimate: { name: "Crowd Surge", kind: "summon", desc: "The whole crowd rushes the street with him.", cost: 100, dmg: 50, range: 999 },
    signature: "Hand-clap jab, shoulder bump, and a mic-stand sweep.",
    passive: { id: "crowd", name: "Make Some Noise", desc: "The ultimate meter fills 50% faster." },
    unlock: { type: "rank", rank: 3 },
    voice: "booming, rhythmic, always to the back row",
    movement: "arms out wide, conducting the street",
    colors: { primary: "#FFC93C", secondary: "#14161C", skin: "#4a2b1d" },
    art: { pending: "Needs reference photos" },
  },
  {
    id: "settings",
    name: "Settings Babe",
    archetype: "technical",
    style: "Trickster. Fights with connections, distractions and perfect timing.",
    area: "Wuse",
    backstory:
      "She knows where every gathering is, who is invited, and which gate man owes her a favour. She has 'settings' in every district. When the Vibe Killers crashed her best friend's birthday, she made three calls and found out exactly where they sleep.",
    stats: { health: 6, strength: 5, speed: 8, defence: 6 },
    special: { name: "The Plug", kind: "decoy", desc: "A fake call from 'their oga' freezes every enemy for 2 seconds.", cost: 35, dmg: 0, range: 999, ticks: 120 },
    ultimate: { name: "Who You Know", kind: "summon", desc: "Her whole network turns up and floods the street.", cost: 100, dmg: 55, range: 999 },
    signature: "Bag swing, ring-light flash, heel turn.",
    passive: { id: "connected", name: "Connected", desc: "Hits have a chance to leave enemies distracted." },
    unlock: { type: "starter" },
    voice: "bright, unbothered, always mid-call",
    movement: "hip-led glide, phone never leaves her hand",
    colors: { primary: "#00A862", secondary: "#FFC93C", skin: "#6a4029" },
    art: { portrait: "/game/portraits/settings.png" },
  },
  {
    id: "kekequeen",
    name: "Keke Queen",
    archetype: "fast",
    style: "Speed rushdown with a double jump and drifting dash kicks.",
    area: "Nyanya",
    backstory:
      "The fastest keke rider on the Nyanya road. She can thread three lanes of traffic and still collect her fares. The Vibe Killers seized her keke, so she's walking until she gets it back.",
    stats: { health: 5, strength: 5, speed: 10, defence: 5 },
    special: { name: "Lane Change", kind: "dash", desc: "Drifts across lanes kicking anyone in the way.", cost: 25, dmg: 14, range: 260 },
    ultimate: { name: "Last Bus", kind: "summon", desc: "Her keke roars back across the street, horn blaring.", cost: 100, dmg: 60, range: 999 },
    signature: "Hop kick, double jump, and a stomp landing.",
    passive: { id: "nimble", name: "Nimble", desc: "+20% walk speed and a double jump." },
    unlock: { type: "rank", rank: 2 },
    voice: "fast, loud, haggling",
    movement: "leaning forward like she's always late",
    colors: { primary: "#F2C230", secondary: "#008751", skin: "#5b3524" },
    art: { portrait: "/game/portraits/kekequeen.png" },
  },
  {
    id: "gateman",
    name: "Gate Man Musa",
    archetype: "tactical",
    style: "Defensive wall. Blocks everything, then makes you pay.",
    area: "Asokoro",
    backstory:
      "Twenty years guarding an Asokoro estate gate. He has seen every trick a visitor can try. Nothing gets past Musa without a name, a reason and his permission.",
    stats: { health: 10, strength: 6, speed: 3, defence: 10 },
    special: { name: "Gate Check", kind: "shield", desc: "A parry stance that reflects the next hit with interest.", cost: 25, dmg: 30, range: 60, ticks: 50 },
    ultimate: { name: "Lockdown", kind: "shockwave", desc: "Slams the gate: everyone on screen is knocked flat.", cost: 100, dmg: 45, range: 999 },
    signature: "Whistle jab, baton poke, bench smash.",
    passive: { id: "gatekeeper", name: "Gatekeeper", desc: "Blocking is free and reflects chip damage." },
    unlock: { type: "boss", boss: "oga_danfo" },
    voice: "slow, suspicious, Hausa-inflected",
    movement: "planted feet, hands behind his back",
    colors: { primary: "#3a5a8a", secondary: "#f3ead6", skin: "#6a4029" },
    art: { portrait: "/game/portraits/gateman.png" },
  },
  {
    id: "mallamtech",
    name: "Mallam Tech",
    archetype: "technical",
    style: "Gadget fighter. Weapons last longer; throws are surgical.",
    area: "Wuse",
    backstory:
      "He fixes phones in Wuse market that the manufacturers gave up on. To him, the Vibe Killers' jamming towers are just another device to open up and break.",
    stats: { health: 6, strength: 6, speed: 6, defence: 6 },
    special: { name: "Short Circuit", kind: "projectile", desc: "Throws a sparking power bank that chains between enemies.", cost: 30, dmg: 20, range: 400 },
    ultimate: { name: "EMP", kind: "shockwave", desc: "Overloads every device on screen. Enemies seize up.", cost: 100, dmg: 40, range: 999, ticks: 180 },
    signature: "Screwdriver jab, cable whip, phone-case slap.",
    passive: { id: "tinker", name: "Tinker", desc: "Weapons last twice as long." },
    unlock: { type: "cash", price: 1500 },
    voice: "precise, patient, mildly offended",
    movement: "hunched, peering over his glasses",
    colors: { primary: "#7a7f88", secondary: "#00A862", skin: "#4a2b1d" },
    art: { portrait: "/game/portraits/mallamtech.png" },
  },
  {
    id: "agbadadon",
    name: "Agbada Don",
    archetype: "heavyweight",
    style: "Grappler. Throws are his punches.",
    area: "Maitama",
    backstory:
      "A Maitama fixer who wears more fabric than most tailors own. He settles disputes over pepper soup. When talking fails, the agbada sleeves come up.",
    stats: { health: 9, strength: 8, speed: 3, defence: 8 },
    special: { name: "Sleeve Sweep", kind: "pull", desc: "Gathers enemies in with his sleeves and slams them.", cost: 35, dmg: 24, range: 160 },
    ultimate: { name: "Owambe Spin", kind: "shockwave", desc: "Spins like the dance floor at an owambe, flinging everyone.", cost: 100, dmg: 65, range: 260 },
    signature: "Palm push, sleeve grab, belly-to-belly throw.",
    passive: { id: "grappler", name: "Grappler", desc: "Throws deal 40% more and hit whoever they land on." },
    unlock: { type: "cash", price: 2500 },
    voice: "rich, slow, generous until it isn't",
    movement: "rolling gait, sleeves flowing",
    colors: { primary: "#f3ead6", secondary: "#c9a23a", skin: "#6a4029" },
    art: { portrait: "/game/portraits/agbadadon.png" },
  },
  {
    id: "suyaspice",
    name: "Suya Spice",
    archetype: "fast",
    style: "Zoner. Pepper clouds and skewer flicks keep enemies away.",
    area: "Apo",
    backstory:
      "His suya spot by the Apo roundabout runs all night. Everyone in Abuja has eaten his yaji. He grills with one hand and keeps troublemakers at skewer's length with the other.",
    stats: { health: 6, strength: 6, speed: 8, defence: 5 },
    special: { name: "Yaji Cloud", kind: "projectile", desc: "Throws a pepper cloud that burns and blinds.", cost: 30, dmg: 16, range: 300 },
    ultimate: { name: "Grill Master", kind: "shockwave", desc: "Flips the whole grill: fire and pepper everywhere.", cost: 100, dmg: 55, range: 300 },
    signature: "Skewer jab, tong snap, pepper flick.",
    passive: { id: "spice", name: "Spice", desc: "Every fourth hit leaves a pepper burn." },
    unlock: { type: "rank", rank: 3 },
    voice: "teasing, sing-song, smoky",
    movement: "light on his feet, fanning the air",
    colors: { primary: "#8a1d12", secondary: "#f3b24a", skin: "#5b3524" },
    art: { portrait: "/game/portraits/suyaspice.png" },
  },
  {
    id: "corperada",
    name: "Corper Ada",
    archetype: "tactical",
    style: "Drill-trained all-rounder. Equipment recharges twice as fast.",
    area: "Kubwa",
    backstory:
      "Posted to Abuja for NYSC and already running her estate's security WhatsApp group. She treats every fight like a parade-ground inspection.",
    stats: { health: 7, strength: 6, speed: 7, defence: 7 },
    special: { name: "Fall In!", kind: "buff", desc: "Parade-ground discipline: +40% defence and speed for 6s.", cost: 30, dmg: 0, range: 0, ticks: 360, mul: 1.4 },
    ultimate: { name: "Passing Out Parade", kind: "summon", desc: "A platoon of corpers marches through the street.", cost: 100, dmg: 50, range: 999 },
    signature: "Drill jab, khaki-boot side kick, salute uppercut.",
    passive: { id: "drill", name: "Drill", desc: "Equipment cooldowns are halved." },
    unlock: { type: "starter" },
    voice: "crisp, commanding, secretly funny",
    movement: "marching rhythm, elbows tight",
    colors: { primary: "#c7b98a", secondary: "#00A862", skin: "#5b3524" },
    art: { portrait: "/game/portraits/corperada.png" },
  },
  {
    id: "mamaput",
    name: "Mama Put",
    archetype: "heavyweight",
    style: "Tank and sustain. Food heals her far more than anyone.",
    area: "Lugbe",
    backstory:
      "She feeds half of Lugbe from her bukka. She knows every customer by their order and their debt. A ladle in her hand has ended more fights than the police.",
    stats: { health: 10, strength: 7, speed: 3, defence: 8 },
    special: { name: "Second Helping", kind: "heal", desc: "Eats from the pot: restores 25% health.", cost: 40, dmg: 0, range: 0, mul: 0.25 },
    ultimate: { name: "Pot of Everything", kind: "slam", desc: "Brings the giant pot down on the whole crowd.", cost: 100, dmg: 70, range: 240 },
    signature: "Ladle tap, pot-lid shove, hip check.",
    passive: { id: "nourish", name: "Nourish", desc: "Food heals 60% more." },
    unlock: { type: "cash", price: 2000 },
    voice: "warm, scolding, unstoppable",
    movement: "rolling sway, ladle resting on shoulder",
    colors: { primary: "#d9501c", secondary: "#f3ead6", skin: "#4a2b1d" },
    art: { portrait: "/game/portraits/mamaput.png" },
  },
  {
    id: "okadaghost",
    name: "Okada Ghost",
    archetype: "supernatural",
    style: "Phase-dodger. Ride through enemies and leave them reeling.",
    area: "Lugbe",
    backstory:
      "Okadas were banned from the city centre years ago, but riders on the old routes swear one still comes through at night, fast as rumour, with no engine sound. He has a score to settle with whoever ran him off the road.",
    stats: { health: 5, strength: 7, speed: 9, defence: 4 },
    special: { name: "Phase Ride", kind: "dash", desc: "Rides straight through enemies, invulnerable.", cost: 30, dmg: 18, range: 360 },
    ultimate: { name: "Last Ride", kind: "dash", desc: "A ghost convoy tears down every lane.", cost: 100, dmg: 65, range: 999, ticks: 3 },
    signature: "Helmet butt, exhaust kick, wheelie stomp.",
    passive: { id: "phantom", name: "Phantom", desc: "Dodging through an enemy stuns it." },
    unlock: { type: "boss", boss: "madam_crescent" },
    voice: "echoing, distant, never in a hurry",
    movement: "drifts a hand-width above the ground",
    colors: { primary: "#6fd3ff", secondary: "#14161C", skin: "#2e2a3a" },
    art: { portrait: "/game/portraits/okadaghost.png" },
  },
  {
    id: "jabisiren",
    name: "Jabi Siren",
    archetype: "supernatural",
    style: "Tide controller. Her specials slow anything they touch.",
    area: "Jabi",
    backstory:
      "A Jabi Lake lifeguard who swims the lake at dawn. The fishermen say she talks to the water. When the Vibe Killers started dumping waste in the lake, the water talked back.",
    stats: { health: 6, strength: 6, speed: 7, defence: 6 },
    special: { name: "Undertow", kind: "projectile", desc: "Sends a wave rolling down the lane that slows and drags.", cost: 30, dmg: 16, range: 420 },
    ultimate: { name: "Lake Rising", kind: "shockwave", desc: "The lake floods the street, sweeping everyone away.", cost: 100, dmg: 55, range: 999 },
    signature: "Palm strike, water-whip, rising tide kick.",
    passive: { id: "tide", name: "Tide", desc: "Specials slow enemies caught in them." },
    unlock: { type: "rank", rank: 4 },
    voice: "soft, certain, carrying over water",
    movement: "flowing, weight shifting like waves",
    colors: { primary: "#1e7aa8", secondary: "#e8f5ec", skin: "#4a2b1d" },
    art: { portrait: "/game/portraits/jabisiren.png" },
  },
];

export const FIGHTERS: Record<string, Fighter> = Object.fromEntries(ROSTER.map((f) => [f.id, f]));
export const STARTERS = ROSTER.filter((f) => f.unlock.type === "starter").map((f) => f.id);

/** Simulation numbers derived from the 1-10 stat ratings. */
export function fighterTuning(f: Fighter) {
  const nimble = f.passive.id === "nimble";
  return {
    maxHp: 80 + f.stats.health * 10,
    dmgMul: 0.7 + f.stats.strength * 0.06,
    walk: (1.5 + f.stats.speed * 0.17) * (nimble ? 1.2 : 1),
    defMul: 1.15 - f.stats.defence * 0.05,
    jumpV: 9.5 + f.stats.speed * 0.15,
    airJumps: nimble ? 1 : 0,
  };
}
