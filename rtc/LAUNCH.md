# Launch checklist — Run The Capital

Status key: ✅ done in code · 🔲 needs Prohub, TCM or a person

## Product
- ✅ 14 fighters, campaign stages 01–02 (6 substages, 2 bosses) playable; 03–05 shown as "coming soon"
- ✅ Guest play; profiles, ranks, Capital Cash, missions, achievements, leaderboards, store
- ✅ Desktop keyboard (remappable) and mobile virtual gamepad
- ✅ Offline HTML preview: `npm run preview:html` → `exports/run-the-capital-preview.html`
- 🔲 PsychoYP and Obey The Hypeman portraits (need reference photos)
- 🔲 Fighter animation sets to replace the placeholder sprites

## Rights and consent (blocking for public launch)
- 🔲 Written consent from every real artist used as a fighter or on a billboard: Odumodublvck, DJ Romie, PsychoYP, Obey The Hypeman, Wizkid
- 🔲 Odumodublvck "Rise of the Machine" billboard: confirm with Kalacious Entertainment that the poster art may appear in-game
- 🔲 Wizkid "Live Out Loud" billboard: confirm with Wizkid's team and the festival organisers that the poster art may appear in-game
- ✅ Sponsor logos and ticket links are not shown on either billboard

## Infrastructure
- 🔲 Hosting: Vercel (or any Node 22 host). Root directory `rtc`, build `npm run build`, start `npm start`
- 🔲 Postgres 16 (Supabase / Neon). Run `npm run db:migrate` once against it
- 🔲 Set in the host's encrypted env settings: `APP_URL`, `DATABASE_URL`, `SESSION_SECRET` (`openssl rand -hex 32`)
- 🔲 Domain (e.g. game.tcm…) with HTTPS; HSTS header is sent in production
- 🔲 Link from the TCM website to the game URL
- ✅ CI: typecheck, unit tests, migration, build and end-to-end smoke test (`.github/workflows/rtc-ci.yml`)

## Payments (Paystack, at the end)
- 🔲 Add `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` to the host's env settings
- 🔲 Paystack dashboard → Settings → Webhooks: `https://<domain>/api/webhooks/paystack`
- 🔲 One live ₦350 test purchase, then refund it from the dashboard
- ✅ Items are granted only after the signed webhook + server verify confirm amount and NGN currency

## Security and fair play
- ✅ Every run is replayed on the server before rewards; tampered and too-fast runs are rejected
- ✅ Rate limits on auth, runs, store, reactions and reports; same-origin checks on all writes
- ✅ Row-level security on ledgers, inventory and purchases; scrypt passwords; HttpOnly session cookie
- ✅ CSP, HSTS, no geolocation (players pick a home area)
- 🔲 Pick a moderator account: `update users set role = 'moderator' where email = …`

## Day-one checks
- 🔲 `/api/health` returns `{"ok":true}` on the live domain
- 🔲 Sign up, clear 01A, see the run on the leaderboard
- 🔲 Play once on an Android phone and an iPhone in landscape
