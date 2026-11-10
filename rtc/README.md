# Run The Capital

An Abuja street beat 'em up produced by **Prohub Creative Solutions** in partnership with **The Capital Movement (TCM)**: 14 fighters, five districts, a Romie's Block bonus party stage, CAPITAL STATUS ranks,
Capital Cash, missions, live leaderboards and a cosmetics-only store. Built on the Over Sabi foundation
(Next.js + Postgres + RLS + Paystack).

## How online play stays smooth and fair
- The fight runs **locally** in a deterministic 60 Hz simulation (`src/game/sim`). No network traffic during play.
- `POST /api/runs/start` issues a run id and a server seed. `POST /api/runs/finish` sends the run-length-encoded
  input log; the server **replays it** with the same seed and only pays out if score and outcome match, and the run
  took at least as long in real time as in game time. Rewards are idempotent ledger entries.
- If the network drops at the end of a run, the run is queued in the browser and resubmitted on the next visit.
- Guests can play without an account; their runs are never submitted or ranked.

## Local development
```bash
cp .env.example .env.local        # set SESSION_SECRET (openssl rand -hex 32)
npm install
npm run db:migrate                # needs a local Postgres 16
npm run dev
npm test                          # simulation tests (bot clears stages, beats both bosses)
npx tsx scripts/smoke.ts          # end-to-end API check against a running local server
```

## Deploying (Vercel + Supabase or any Postgres 16)
1. Create the database, run `npm run db:migrate` with `DATABASE_URL` pointing at it.
2. Set `APP_URL`, `DATABASE_URL` and `SESSION_SECRET` in the host's encrypted environment settings.
3. **Paystack (at launch):** add `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`, then set the webhook URL in the
   Paystack dashboard to `https://<domain>/api/webhooks/paystack`. Until the keys exist, Naira checkout returns
   "payments open soon" and nothing is charged. Items are only granted after the signed webhook and a server-side
   verify call confirm amount and currency.

## Before public launch
- Written consent from every real artist in the roster (`realPerson: true` in `src/game/data/roster.ts`).
- Reference photos for PsychoYP and Obey The Hypeman (their art is pending).
- Stages 03–05 are mapped but locked.

## Art and audio
- **One art style for every character.** Every fighter, enemy and boss uses a pixel-art animation set drawn to
  the same template as Odumodublvck's original sheet (run 10 · special 5 · jump/roll 7 · combo 10 frames, ~90 px).
  New sheets were generated from each character's portrait with that sheet as the pose and style reference, then
  keyed and packed with `scripts/art/pack-sheet.py` (`atlas-meta.json` holds cell, anchor and frame counts).
  PsychoYP and Obey The Hypeman stay unplayable ("coming soon") until reference photos and consent arrive.
- **Stages.** Every substage has its own backdrop, floor and colour grade: Wuse plaza (01A), the Night Shift
  blockade (01B), the motor park (01C), the Crescent strip (02A), the nightlife district (02B), **Romie's Block**
  (02R, bonus stage) and Madam Crescent's club (02C).
- **Romie's Block (bonus).** Based on DJ Romie's weekly Monday night party at Papiees Meatro, Jahi (Afrobeats,
  Amapiano, Afro-House). No enemies: smash the party chests and reach the decks. First clear pays +750 XP and
  unlocks the 02C boss fight.
- **Items** (chests, open chest, coin, token, hammer) come from the Prohub item pack, cut out with
  `scripts/art/cutout-icon.py`.
- **Soundtrack.** "Run The Capital" theme, action Afrobeats at 108 BPM (log-drum bass, talking drum, Fela-style
  brass, cinematic taiko and strings), `public/game/audio/theme.mp3`, mastered to −14 LUFS. Falls back to the
  synthesised groove if it can't load.
