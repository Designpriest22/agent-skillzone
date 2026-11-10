# Run The Capital

An Abuja street beat 'em up for TCM: 14 fighters, five districts × three substages, CAPITAL STATUS ranks,
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
