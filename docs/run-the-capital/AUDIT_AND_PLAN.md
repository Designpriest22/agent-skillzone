# RUN THE CAPITAL — Baseline Audit & Implementation Plan

Status: **Phase 1 (audit) complete. No structural changes made yet.** Decisions marked **[DECISION]** are needed before Phase 2 starts.

---

## 1. What exists today

### 1.1 Hosting and backend
| Area | Finding |
|---|---|
| Site | Static HTML/CSS/JS site for The Capital Movement (7 pages), deployed on cPanel (`thecapitalmovement.com`, source zip `tcmwebsitecpanelv3`). |
| Game location | Section `#play` on `index.html`; standalone build in `exports/run-the-capital-test.html`. |
| Backend / database | **None** for the site or game. |
| Authentication | **None.** |
| Persistence | `localStorage` only: best distance, chosen hero, mute flag (`rtc.*` keys). |
| Payments | **None** in the game. |
| Reusable in repo | `over-sabi/` (separate Next.js 16 app) already has the production patterns we need: Postgres with row-level security, own scrypt/session auth, Zod-validated API routes, **Paystack webhook with HMAC-SHA512 verification**, Playwright/Vitest tests, Vercel + Supabase deploy guide. It is not deployed. |

### 1.2 Game engine (`js/run-the-capital.js`, 156 KB, ~2,500 lines, vanilla JS, Canvas 2D, no build step)
| System | State | Keep? |
|---|---|---|
| Game loop | rAF loop, dt-capped, pauses off-screen/hidden tab. | Keep the pattern. |
| Movement | **3-lane auto-runner**: world scrolls automatically; player only switches lanes and jumps. | **Replace** (brief §7: no auto-run). |
| Combat | Health bar, 3-hit combo, shooting + weapon medallions (S/M/L/F), Ghana Must Go drops, enemy waves that slow the street, backup special that costs health, 2 boss types with telegraphed lane attacks and phases. | Keep rules; port to free movement. |
| Enemies | Vibe Killers (grunt, tout, bouncer) with simple lane-seeking AI. | Keep and extend. |
| Districts | 4 blended lighting zones (Three Arms, Central, Wuse 2, Zuma Rock) on an endless distance loop. | **Replace** with authored stages/substages. |
| Rendering | Procedural vector backgrounds into a 340-line buffer (pixel look); sprite atlases at full res; 33 gradient creations per frame. | Replace art; keep layering idea. |
| Art | Pixel-art sprites (Odumodublvck, DJ Romie, 3 enemies, 2 bosses) generated in an earlier round; everything else procedural. | **Superseded** by the new hand-drawn direction (§3). |
| Audio | Synthesised afrobeats loop + SFX via WebAudio. | Keep. |
| Input | Keyboard (arrows/WASD, Space, X, C, P, M), swipe/tap, small touch pad. | Replace with remappable input layer + virtual gamepad. |
| HUD/menus | DOM overlays (start, pause, game over, hero picker of 6). | Replace with new UI system. |

### 1.3 Technical limitations
1. **Single-file architecture.** One 2,500-line closure; no modules, types, tests or build. Adding 14 fighters, a campaign and online systems on top of it is not maintainable.
2. **Lane model is baked in.** Collision, spawning, sorting, AI and camera all assume 3 discrete lanes and constant forward scroll.
3. **Canvas 2D cost.** Gradients and paths regenerated every frame. Hand-drawn HD animation (14 fighters × ~12 animations) needs GPU batching.
4. **No asset pipeline.** No preloading, no loading states, no atlas/WebP budgeting.
5. **No server.** Scores, unlocks, currency and purchases cannot be trusted; leaderboards are impossible.
6. **Hosting mismatch.** cPanel static hosting cannot run the Node/Postgres backend we already have in `over-sabi`.

### 1.4 Supplied materials reviewed
| Asset | Notes |
|---|---|
| `run_the_capital_transparent.svg` | Authoritative logo. It is an SVG **wrapping a single 1774×887 PNG**, not vectors. Used as-is, never redrawn. For crisp large display we should request the original vector or a 2× PNG from the designer. Tone: tactical (scope crosshair, soldier silhouette, bullet casings) over Abuja landmarks (National Mosque, Aso Rock, City Gate, Millennium Tower). |
| `1–10.png` | Hand-painted weapon icons, 256×256, chunky outlines and speckled highlights on rarity-coloured gradient backgrounds (grey, bronze, blue, violet, magenta, red, green, orange). A strong model for **item and store-card art and a rarity colour system**. |
| Battle Game UI kit (`.ai`/`.fig`, 375×812) | Dark teal panels, pill currency/energy chips, stat rows with +/- steppers, "VS" matchup card, progress bars, bottom tab bar. Good basis for **profile, loadout, matchup and store screens**. |
| Game Dashboard UI kit (`.fig`) | Desktop dashboard layout (Poppins). Not yet inspected in detail (Figma binary); I can open it through the Figma connector if you share it there. |

The art reference pack is weapon-heavy and the logo is shooter-styled, while the brief says the game stays a street fighter. See **[DECISION 4]**.

---

## 2. Target architecture

```
                 thecapitalmovement.com (cPanel, unchanged)
                 └── #play section → "Play Run The Capital" → play.thecapitalmovement.com

play.thecapitalmovement.com  (Vercel, Next.js — same stack as over-sabi)
├── /                       game client (Vite-built TypeScript bundle, PixiJS WebGL)
├── /api/auth/*             signup, login, sessions (ported from over-sabi)
├── /api/profile/*          username, avatar, home area, fighter collection
├── /api/runs               start run → signed run token; finish run → server validates & scores
├── /api/progress/*         XP, Capital Status, unlocks, achievements, missions
├── /api/store/*            catalogue, Paystack initialise, entitlement read
├── /api/webhooks/paystack  HMAC-verified; the ONLY place purchases become "paid"
└── /api/leaderboards/*     reads from Postgres materialised views; realtime via Supabase Realtime
Postgres (Supabase): users, profiles, fighters_owned, runs, run_events, xp_ledger,
cash_ledger, purchases, entitlements, missions, achievements, reports — RLS on all player tables
```

**Game client modules:** `core/` (loop, time, input mapping, asset loader), `render/` (Pixi stage, parallax, camera, VFX), `combat/` (hitboxes, state machines, combos, grabs, block/dodge), `actors/` (fighters, enemies, bosses as data + behaviour), `campaign/` (stages, substages, waves, objectives, ratings), `ui/` (menus, HUD, roster, store, leaderboards), `net/` (API client, run tokens).

**Anti-cheat model (browser game, so "best effort, server-authoritative"):** the server issues a signed run token with seed and stage; the client submits an event log (hits, KOs, pickups, timestamps). The server replays scoring rules, rejects impossible timings/combos/DPS, rate-limits and caps rewards per day, and makes every currency and XP change an append-only ledger row. Purchases are only granted from the verified Paystack webhook (idempotent on reference).

**Performance budget:** 60 fps on a mid-range Android; first playable < 3 MB; per-stage atlases lazy-loaded as WebP (≤ 2048² each); fighter frames authored at 512 px tall and rendered at 256–320 px; one draw-call batch per layer.

---

## 3. Visual direction (draft, to finalise after your remaining references arrive)
- **Characters:** hand-drawn comic style (Streets of Rage 4 lineage): bold ink outlines, flat cel shading with 2–3 tones, strong silhouettes, exaggerated poses, ~1:6 heroic proportions. Each fighter has an idle, walk, jab chain, heavy, jump attack, grab/throw, block, dodge, hurt, knockdown, special, ultimate, victory and defeat animation.
- **Environments:** painted parallax (sky, landmark, mid-city, street, foreground occluders) per substage, with animated life: traffic, keke, suya smoke, generator fumes, neon flicker, harmattan dust.
- **UI:** dark teal panels and pill chips from the Battle Game kit, rarity colours from the weapon icons, the Nigerian green accent, and the logo's orange-to-red fire gradient for highlights. One type system: a condensed display face for names and ranks plus Inter for UI text.
- **VFX:** hit-sparks, impact frames (2-frame freeze), screen shake, speed lines, dust and debris, KO slow-mo, boss title cards.

**Art production route [DECISION 2]:** the sprite pipeline from the last round (image generation → image-to-video → frame extraction) can produce the hand-drawn style, but generated frames are inconsistent across a 14-fighter roster. For professional quality I recommend a **human illustrator for keyframes**, with AI assisting in-betweens and environments. We can still prototype with AI-generated placeholders (≈20 Higgsfield credits per fighter; about 105 credits remain).

---

## 4. Content plan (drafts for your review)

### 4.1 Roster: 14 fighters, 6 archetypes
| # | Fighter | Archetype | Hook | Ultimate |
|---|---|---|---|---|
| 1 | Settings Babe | Technical / trickster | Knows every gathering and has street connections ("settings") everywhere; fights with distraction, decoy phone calls and calling in favours | "Who You Know": a rush of her connections floods the screen |
| 2 | Odogwu Kasala | Heavyweight | Ex-loading-bay foreman from Garki market | Truck-tyre slam |
| 3 | Keke Queen | Fast | Fastest keke rider in Nyanya | Keke drift through enemies |
| 4 | Gate Man Musa | Defensive tank | Estate gateman, master of the bench and the whistle | Gate Lockdown (shield wall) |
| 5 | Mallam Tech | Technical | Phone-repair genius from Wuse market | EMP burst |
| 6 | Agbada Don | Heavyweight / grapple | Aso Rock-adjacent fixer in flowing agbada | Robe whirlwind throw |
| 7 | Suya Spice | Fast / zoning | Night grill master; pepper clouds blind enemies | Yaji storm |
| 8 | DJ Faderhands | Rhythm | Club DJ; timed inputs boost damage | Bass drop shockwave |
| 9 | Corper Ada | Tactical | NYSC corps member, drill-trained | Parade-ground rally (team buff) |
| 10 | Mama Put | Support / heavy | Bukka owner with pots, ladles and pidgin wisdom | Pot-of-everything slam |
| 11 | Okada Ghost | Fast / supernatural | Banned-route rider who appears and vanishes | Phantom ride |
| 12 | Jabi Siren | Technical / water | Lake lifeguard and swimmer | Tide crash |
| 13 | Gwari Warden | Supernatural | Gbagyi heritage guardian drawing on Zuma Rock folklore | Stone guardian summon |
| 14 | Hypeman Ayo | Street / crowd | MC who turns a crowd's energy into power | "Shout Out!" crowd meter |
| + | Guest slots | | Odumodublvck, DJ Romie, PsychoYP, Obey The Hypeman: **only with written artist consent** | |

Each fighter is data (stats, move list, frame data, perks, unlock rule, progression tree) so we can ship them progressively.

**Settings Babe (draft):** a style-forward Abuja connector from Wuse 2 who is always "on set". She fights with personality rather than brute force.
- **Special:** "Plug" — a call-in from a contact.
- **Combo:** a bag swing into a ring-light flash.
- **Dodge:** a phone-call fake-out.
- **Victory line:** "I told you I have settings."

I've written her as competent, funny and well connected, not as a romance or gold-digger cliché. The term isn't documented in the slang glossaries I checked, so please **confirm the meaning you intend**.

### 4.2 Campaign
Five stages × three substages, as in your brief (Wuse II, Aminu Kano, Garki, Area 1, Jabi), plus later stages (Maitama, Asokoro, Gwarinpa, Kubwa, Lugbe, Apo, Nyanya, Zuma Rock). Each substage has an objective, waves, an environmental hazard, three hidden collectibles, an S/A/B/C rating (time, damage taken, combo, style) and replay.

### 4.3 Bosses
Each boss is a named Abuja character with intro, 2–3 phases, readable tells and a weakness:
- **01C** Oga Danfo, a route-tout kingpin
- **03C** Alhaji Market, a market-levy enforcer
- **04C** The Estate Chairman, with security drones
- **05C** Captain Lakeside, a boat-rental pirate

The existing Big Gen and DJ Off-Beat become mid-bosses.

**Aminu Kano (02C) — needs your sign-off.** I won't make women associated with the nightlife scene, or sex workers, into enemies for the player to beat up. That turns a real, vulnerable group into targets. My proposal keeps the nightlife-economy theme:
- **The boss:** "Madam Crescent", a fictional racketeer who runs the Crescent's protection money, bouncers and fake-VIP scams.
- **Phase 1:** she fights from her VIP booth.
- **Phase 2:** she summons her bouncers.
- **Phase 3:** she takes the floor herself in a neon light show.
- **The women of the strip:** non-hostile characters who tip you off to her weak points.

---

## 5. Systems plan

| System | Scope | Data authority |
|---|---|---|
| Controls | A/D/W/S move, J attack, K jump, L special, U grab, I dodge/block, Space ultimate; remappable; virtual gamepad with movable/resizable buttons | Client (settings synced to profile) |
| Combat | Free 2.5D belt movement with depth lanes as a continuous Y; hit/hurt boxes per frame; jab chains, heavy, directional, jump and air combos, grab/throw, block/dodge with i-frames, knockback/wall bounce, finishers, combo multiplier; input buffer of ~6 frames, cancel windows, no long locks | Client simulation; server validates the run log |
| Spawn areas | Home area chosen at signup (Wuse, Garki, Maitama, Asokoro, Jabi, Gwarinpa, Kubwa, Lugbe, Apo, Nyanya), each with its own intro mission and rewards; data-driven so other cities can be added. **No geolocation collected.** | Server profile |
| Capital Status | 8 ranks (Fresh Entry → The Capital), each with a badge and reward; XP from missions, bosses, dailies, combos, secrets, events | Server ledger |
| Capital Cash | Earned in play; ledger with idempotency keys; daily caps | Server ledger |
| Store | Cosmetics, skins, victory animations, convenience boosts at ₦350/₦500/₦650/₦800 via Paystack; clear "purchased" vs "earned" badges; confirmation, history; **no stat-power for sale in ranked modes** | Server, Paystack webhook only |
| Leaderboards | Overall, XP, victories, bosses, combo, stage performance, weekly/monthly, area | Postgres views; Supabase Realtime push |
| Social | Public profiles, reactions, share cards (server-rendered OG images), challenges; report and mute; profanity filter on usernames | Server + moderation queue |
| Modes | Campaign, Boss Rush, Survival, Timed Ops, daily/weekly challenges. Online multiplayer is deferred until it can be done properly (authoritative relay); **no fake online play** | Server |

---

## 6. Phased delivery

| Phase | Deliverable | Ships to players? |
|---|---|---|
| 1 | This audit and plan | — |
| 2a | Scaffold `game/` (Vite + TS + PixiJS), asset loader, input layer, port audio | No (internal) |
| 2b | **Vertical slice:** Stage 01A Wuse II with free movement, new combat core, 2 fighters, new HUD, main menu with your logo | Playable preview link |
| 3 | Combat depth: grabs, block/dodge, specials, ultimates, enemy AI states, 01C boss | Preview |
| 4 | Campaign stages 01–05 with substages, ratings, collectibles, replay | Replaces the current homepage game |
| 5 | Roster framework and all 14 fighters' data; art lands progressively | |
| 6 | Backend: auth, profiles, home areas, XP, Capital Status, stats (port from over-sabi) | Requires hosting decision |
| 7 | Capital Cash, store, Paystack (test mode first, then live keys) | Requires a Paystack account |
| 8 | Leaderboards, share cards, social, moderation, anti-cheat | |
| 9 | Device matrix testing, balancing, load tests, payment and security review | |

The current game stays live on the homepage until the new build surpasses it.

---

## 7. Decisions needed before Phase 2
1. **Hosting/backend:** Vercel + Supabase on a subdomain, reusing the over-sabi stack (recommended), or keep everything on cPanel with PHP/MySQL.
2. **Art production:** commission an illustrator for keyframes (recommended for professional quality), or proceed with AI-generated placeholder art first.
3. **Real artists:** keep Odumodublvck, DJ Romie, PsychoYP and Obey as guest fighters pending consent, or remove them and use only the 14 original fighters.
4. **Firearms:** the logo and reference pack feature guns. Should guns appear as pickups or store items, or should combat stay melee plus non-lethal "street" weapons (bottles, planks, megaphones)?
5. **Aminu Kano boss:** approve the "Madam Crescent" reframing above.
6. **Settings Babe:** confirm the intended meaning of the term.
7. **Paystack:** does TCM already have a Paystack (or Flutterwave) business account?
