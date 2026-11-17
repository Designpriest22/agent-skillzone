# Manual QA checklist

Automated tests cover logic, data isolation and the main journeys in desktop Chromium plus a Pixel 7 viewport. These checks need humans, real devices and real provider keys.

Record device, OS, browser, network and result for each run.

## Devices
- [ ] Low/mid-range Android (2–3 GB RAM), Chrome — the primary target
- [ ] Android, Opera Mini / Opera (data-saver) — pages degrade gracefully
- [ ] iPhone, Safari (iOS 17+) — MediaRecorder `audio/mp4`, autoplay rules
- [ ] iPad, Safari
- [ ] Desktop Chrome, Firefox, Safari, Edge

## Microphone & permissions
- [ ] The microphone is never requested before the learner taps the mic button
- [ ] Voice-consent card appears first; declining keeps typing working
- [ ] Browser permission prompt → **Allow**: "Listening…" state with Spark pulse; recording stops after a pause
- [ ] **Block**: clear message explaining how to re-enable; typing still works
- [ ] No microphone attached: "couldn't find a microphone" message
- [ ] Another app using the mic (call in progress): graceful failure
- [ ] Revoking consent in Settings → Privacy hides voice input until re-consented
- [ ] Experimental language: transcription appears in the text box for confirmation, not auto-sent

## Audio playback
- [ ] Tutor voice plays after a reply when available; "Speaking…" state shown
- [ ] Mute stops current audio and prevents further playback
- [ ] Tapping the mic while the tutor speaks stops the audio (barge-in)
- [ ] Replay button works; iOS plays after a user gesture
- [ ] TTS failure: notice shown, replies continue as text, voice switched off
- [ ] Contributor recording plays back before submission; reviewers can play it in the queue

## Per-language speech (with real keys) — repeat for yo, ig, ha, pcm
- [ ] Follow LANGUAGE_QUALITY.md evaluation protocol; record WER/CER and listener ratings
- [ ] Confirm statuses in Admin → Languages match results
- [ ] Confirm learner-facing labels match statuses on `/languages/<code>` and in the speaking room

## AI tutor (with real key) — per language
- [ ] Greeting arrives within ~3–5 s on 4G
- [ ] Replies respect mode, difficulty, correction frequency, target-language %, translation toggle
- [ ] Corrections are plausible; native reviewer rates 20 turns per language
- [ ] Tutor flags uncertainty instead of inventing idioms; says it's AI when asked
- [ ] Summary sections are populated and don't invent things that didn't happen
- [ ] Refusal/decline path shows the neutral message

## Poor networks (Chrome DevTools throttling + real 3G)
- [ ] Landing page usable on "Slow 3G" within acceptable time
- [ ] A lesson opened once loads offline (airplane mode) from the service worker
- [ ] Sending a tutor message offline: offline indicator, message kept in the box, resend works after reconnecting
- [ ] Transcription upload failure shows the typed fallback message

## Responsive & accessibility
- [ ] 320 px, 360 px, 390 px, 768 px, 1024 px, 1440 px widths: no horizontal scroll, bottom nav on mobile, sidebar on desktop
- [ ] Keyboard-only: every control reachable, visible focus ring, dialogs trap and return focus
- [ ] Screen reader (TalkBack, VoiceOver): speaking-room state changes announced; tone lines have text labels; badges readable
- [ ] 200% zoom and large system font: no clipped text
- [ ] Reduced motion: tone-line draw and pulses disabled
- [ ] Dark mode: contrast acceptable on all pages
- [ ] Yoruba/Igbo/Hausa characters render correctly (stacked tone marks, under-dots, hooked letters) on Android system fonts and iOS

## Payments (Paystack test mode)
- [ ] Checkout opens Paystack; test card success → returns to `/billing/return` → plan active only after webhook
- [ ] Failed card → no plan change
- [ ] Webhook replay → no duplicate subscription
- [ ] Cancel renewal → status "non-renewing", access until period end
- [ ] Account deletion with active plan disables renewal (or warns)

## Accounts & privacy
- [ ] Verification email arrives and link confirms; expired link handled
- [ ] Password reset email arrives; link single-use; other sessions signed out
- [ ] Google sign-in (new user + existing email) works; age band asked in onboarding
- [ ] Data export downloads complete JSON
- [ ] Account deletion removes data; sign-in no longer possible
