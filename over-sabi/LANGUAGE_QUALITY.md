# Language quality

This document records, per language, what has been verified, what is a draft, and what is untested. It mirrors the statuses stored in the `languages` table (editable in **Admin → Languages**) and shown to learners on each `/languages/<code>` page.

**Bottom line today:** no learning content has been approved by a native-speaker reviewer, no native audio exists, and no speech provider has been tested against real Yoruba, Igbo, Hausa or Pidgin recordings. The product says so everywhere it matters.

## Status vocabulary

| Field | Values | Meaning |
| --- | --- | --- |
| `catalogue_status` | roadmap · in_development · beta · available | Can a learner start a course? *Beta* = content exists but isn't reviewed. *Available* requires `content_status = verified` (enforced). |
| `content_status` | none · draft · in_review · verified | State of the course content overall. |
| `review_status` (per item) | editorial_draft · ai_draft · in_review · verified · disputed · rejected | Per vocabulary item, lesson, cultural note. Shown to learners as badges. |
| `tutor_status` | unavailable · experimental · validated | Quality of AI tutor text in this language. |
| `stt_status` / `tts_status` | unsupported · untested · experimental · validated | Over Sabi's own test result for speech recognition / AI voice. Combined with the vendor's documented language list to decide what learners see (see ARCHITECTURE §6). |

## Launch languages

### Yoruba (`yo`) — Beta
| Item | Status | Notes |
| --- | --- | --- |
| Starter course | 4 lessons, 26 vocabulary items, 2 culture notes; **editorial draft** | Greetings (time of day, Ẹ respect form), introductions, family (age-based sibling terms), numbers 1–5. Full tone marks and under-dots throughout. |
| Native audio | none | Listening activities show text with "No native-speaker recording yet". |
| AI tutor | experimental | Claude can write Yoruba but tone-mark accuracy is not evaluated. Tutor is told to flag uncertainty. |
| STT | untested | Desk research: Google Chirp 3 lists yo-NG (Preview); OpenAI transcription lists Yoruba; ElevenLabs pages we found didn't cover Yoruba. |
| TTS | untested | No provider's Yoruba TTS documented by the vendors we integrated. |
| Known risk areas | — | Number forms (counting vs. attributive) are simplified and flagged in a culture note; dialect variation not covered. |

### Igbo (`ig`) — Beta
| Item | Status | Notes |
| --- | --- | --- |
| Starter course | 4 lessons, 23 items; **editorial draft** | Ọnwụ orthography with ị ọ ụ ṅ; tone not marked (common practice) — reviewers may add tone-marked teaching variants. "Ka ọ dị" given medium confidence. |
| Native audio | none | |
| AI tutor | experimental | |
| STT | untested | ElevenLabs Scribe lists Igbo; its published FLEURS WER for Scribe v1 is 43.4% — too high to grade learners. We did not find Igbo in Whisper's list. |
| TTS | untested | |

### Hausa (`ha`) — Beta
| Item | Status | Notes |
| --- | --- | --- |
| Starter course | 4 lessons, 25 items; **editorial draft** | Boko orthography with ɓ ɗ ƙ and 'y; gender in second person (sunanka/sunanki); respect address (Ranka/Ranki ya daɗe). "Wannan mahaifina ne" given medium confidence. Ajami not taught. |
| Native audio | none | |
| AI tutor | experimental | |
| STT | untested | ElevenLabs Scribe and OpenAI transcription list Hausa (ElevenLabs' published WER figures conflict between pages). |
| TTS | untested | A third-party source claims ElevenLabs v3 Hausa TTS; not confirmed by the vendor. |

### Nigerian Pidgin (`pcm`) — In development
No course. Available as an *explanation language* for tutor feedback (labelled experimental). Needs: an adopted spelling convention, a curriculum written by Pidgin speakers, and speech testing (English models must not be assumed to work).

### Nigerian Sign Language (`nsi`) — Roadmap, separate initiative
A signed language: requires video content created with Deaf signers and a different product design. Not a speech feature; never presented as one.

### Roadmap (52 languages)
Listed with ISO codes where confident (null otherwise) so learners can see direction and contributors can help. No content, no tutor, no speech.

## Content provenance

All seeded items carry `source = "Over Sabi editorial draft of widely documented basic expressions; pending native-speaker review."` They were written from common, well-attested greetings and basic vocabulary, deliberately small, and **not** scraped from any course or dictionary. No AI-generated translations were seeded as authoritative; the `ai_draft` status exists for future AI-assisted drafting and is shown to learners in red.

## How content becomes "verified"

1. A reviewer (role `reviewer`+) opens **Admin → Review queue**, filters by language.
2. For each item: **Approve**, **Request changes**, **Dispute** (records regional disagreement with notes) or **Reject**. Each decision is stored in `content_reviews` and audited.
3. Editors fix items in **Admin → Content**; any edit snapshots the previous version (`content_versions`) and sends the item back to `in_review`.
4. When every item in a lesson is verified, a reviewer verifies the lesson.
5. When the course is verified, an editor sets `content_status = verified`, then `catalogue_status = available`.

Learner reports (**Report a problem** on every activity, word and tutor reply) land in **Admin → Reports** and the overview shows reports per language.

## Speech evaluation protocol (to mark STT/TTS "validated")

Do this per language, per provider, with real keys:

1. **Corpus:** ≥ 100 utterances from ≥ 10 native speakers (mix of gender, age, region), recorded on mid-range Android phones in realistic noise, with consent. Include learner-style speech (slow, accented, partly wrong).
2. **STT metrics:** WER and CER against human transcripts with full orthography; separately score diacritic/tone-mark accuracy. Target for "validated": WER ≤ 15% on native speech and transcripts that native reviewers judge usable for feedback on learner speech. Between 15–30%: keep "experimental" (learner confirms text). Above 30%: "unsupported".
3. **TTS:** 3+ native listeners rate 30 sentences (MOS for naturalness and intelligibility, plus a tone-correctness check). Validate only if intelligible and tones are correct in ≥ 90% of sentences.
4. Record results in **Admin → Languages → Speech test notes**, set statuses, and update this document.
5. **Never** treat an English demo working as evidence for any African language.

## Pronunciation scoring

Not implemented, deliberately. No provider evaluated offers validated pronunciation/tone assessment for these languages. The UI says "Not assessed" and the tutor is instructed not to claim it.
