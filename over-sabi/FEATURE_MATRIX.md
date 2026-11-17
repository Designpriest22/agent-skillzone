# Reference research & feature matrix

## What could and couldn't be researched

The brief asked for inspection of `https://tooter.live` (`/features`, `/lessons`, `/tutors`, `/about`). From the build environment:

- Direct HTTPS access was refused by the outbound proxy (403), and the web-fetch tool reported that `tooter.live` **did not resolve** (DNS `ENOTFOUND`).
- A web search did not surface the site itself. The closest match was an app-directory listing for *"Tooter: AI Language Tutor"* (MWM app directory, developer listed as Viral Patterns LLC), describing: live AI tutor conversations for speaking practice, role-play scenarios (e.g. ordering food, business networking), feedback on pronunciation, grammar, vocabulary and fluency, adjustable tutor styles, accents, speaking speeds and correction styles, and sessions of 5–30 minutes. Source: <https://mwm.ai/apps/tooter-ai-language-tutor/6763938692>.

Therefore **no product pages, flows or UI of the reference product were inspected**. The matrix below is built from the feature list in the brief (§3), corroborated where possible by that third-party listing, and implemented independently with original design, copy and assets. No private APIs, assets or code were accessed.

## Matrix

| Reference capability | Learner problem | Interaction sequence | Inputs → outputs | Data stored | AI / speech | Error, loading, empty states | Over Sabi implementation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Live conversational tutoring | Nobody to practise speaking with | Choose tutor → start → alternate turns → end | Learner text/voice → tutor reply, translation, corrections | `learning_sessions`, `conversation_turns` | Chat LLM | Provider down → message kept, retry; not configured → guided dialogues; time-up → end prompt | Speaking room (`/speak/session/[id]`), Claude via `ChatProvider` |
| Spoken input & spoken replies | Typing isn't speaking | Tap mic → speak → auto-stop → (confirm) → send; reply played | Audio → transcript; text → audio | Not stored (audio); transcript text | STT, TTS | Permission denied / no mic / STT failure / TTS failure messages; experimental confirmation | `SpeechProvider` (OpenAI, ElevenLabs), consent card, VAD, barge-in |
| Transcripts | Review what was said | Open history → transcript | — | Turns (90-day retention), summary | — | Empty history; expired transcript notice | `/speak/history/[id]` |
| Guided lessons & interactive exercises | Structure for beginners | Lesson → activities → feedback → completion | Answers → graded result | Attempts, progress | — | Skeletons, empty course, incomplete-lesson 409 | Seven activity types, server grading |
| Contextual corrections (grammar, vocab, pronunciation, fluency) | Learn from mistakes without being interrupted | Corrections attached to tutor turn; summary at end | Learner text → structured corrections | `feedback_items` | LLM | "No corrections yet"; pronunciation explicitly "not assessed" | Structured output `corrections[]`; correction frequency setting |
| Tutor personality & speaking pace | Comfort and fit | Tutor picker → settings | Choices → stored settings | `learning_plans.tutor_settings` | Prompt; TTS speed | — | Six original personas, speed slider |
| Correction intensity | Beginners get discouraged | Setting | minimal/balanced/thorough | settings | Prompt | — | ✅ |
| Session duration controls | Fit practice into a day | Setting 5–30 min (plan-capped) | — | settings, `duration_seconds` | — | Timer, time's-up state | ✅ |
| Level adaptation | Too hard / too easy | Onboarding level + mode + difficulty | — | `learning_plans.level` | Prompt | — | ✅ |
| Vocabulary saving & revision | Forgetting | Save from lessons/conversations → review queue | Grade → next due date | `user_vocabulary` (SM-2) | — | "Nothing due" state | Notebook + `/review` |
| Grammar & pronunciation insights | Know what to work on | Progress page | Corrections → grouped insights | `feedback_items` | — | Empty insights; honest pronunciation notice | `/progress` |
| Session history & progress | Motivation and evidence | Dashboard, progress | — | XP, streaks, achievements | — | Empty states | `/home`, `/progress` |
| Personalised study plan & daily practice | Consistency | Onboarding goal → next lesson → reminders | — | plan, notifications | — | — | Daily goal, next-up, cron reminders |

## Over Sabi additions specific to African languages
- Tone-mark-aware answer checking with near-miss feedback; special-character keyboard including combining tone marks.
- Tone contour visualisation derived from written tone marks (never invented).
- Respect/register teaching (Yoruba Ẹ forms, Hausa gendered "your", elder address).
- Per-language quality statuses surfaced to learners; vendor speech claims separated from our validation.
- Native-speaker contribution and review workflow with disputes for dialect variation.
