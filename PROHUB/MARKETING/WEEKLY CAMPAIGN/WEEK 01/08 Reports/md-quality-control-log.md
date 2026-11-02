# Managing Director — Quality Control Log (Week 01)

Every asset was rendered, inspected at full size, and judged against the brief's eight questions. Below are **the actual rejections and fixes made during production**, followed by the final scorecard.

## 1. Rejections and fixes

| # | Asset | What failed | Fix | Question failed |
|---|---|---|---|---|
| 1 | D1-01 feed | Bag illustration collided with the closing question; the swoosh accent read as a smudge | Resized and repositioned the bag; replaced the swoosh with an orange "you" | Q4 art direction |
| 2 | D2 leak 3 | Copy claimed "**Most** will buy from the vendor who answered in public". There's no evidence for "most" | Changed to "Many will simply buy…"; enlarged the comment thread for legibility | Q5 / honesty |
| 3 | D2 leak 7 | The 3×3 "sameness" grid overflowed and covered the headline and note | Constrained the grid to 480 px | Q4 |
| 4 | Research / D4 | A scam statistic (51% / 57%) surfaced in a search summary couldn't be traced to a named survey | **Dropped it.** Replaced with GASA *State of Scams in Nigeria 2026* (84%, n = 1,180), cited on the slide | Q3 credibility |
| 5 | D3 Ember & Yaji | A social tile carried a mock customer review ("Worth the Wuse traffic") — fabricated testimonial risk even inside fiction | Replaced with an ordinary post ("Tag who's paying tonight") | Q6 / trust |
| 6 | D3 Ember & Yaji | Early monogram idea "E&Y" would echo a global firm's mark | Used a skewer-flame symbol + full wordmark instead | Q8 distinctiveness / risk |
| 7 | D3 story | Before/after boards overlapped | Resized both to 780 px | Q4 |
| 8 | D5 fix slides | "Digital marketing & creative strategy" pill wrapped onto two lines; lower third empty | Shortened to "Digital marketing & strategy"; rebalanced vertical rhythm | Q4 |
| 9 | D6-01 | "Drop your handle." wrapped into the subline | Set as a deliberate two-line headline; moved swoosh and steps | Q4 |
| 10 | D7-01 / D7-02 | "₦396bn" overflowed the frame; offer headline collided with bullets | Re-set the figure at 232 px no-wrap; reduced headline and spacing | Q4 |
| 11 | Reel D3 | In the bento scene the caption "After: Ember & Yaji." was near-invisible on the ink ground | Switched the scene to the template's white ground and **re-rendered** | Q2 clarity |
| 12 | Reel D7 | Counter dropped the currency prefix (renderer bug) | **Patched `prohub-os/src/video/cinematic.ts`** to support `stat.prefix` | Q2 |
| 13 | Reel D7 | With the prefix, ₦ fell back to a serif glyph and pushed the number off-canvas | Kept the patch; moved "NAIRA" into the label so the number reads "396BN" | Q4 |
| 14 | D4-02 | Fake "boosted post" dashboard could be read as real client data | Added on-slide label "Illustrative numbers" | Q6 / honesty |
| 15 | All CTAs | Risk of one CTA repeated all week | One unique CTA per day; keyword DMs for attribution | Brief §6 |

## 2. Final scorecard (all seven posts)

✅ = passes · ◐ = passes with a condition (listed)

| Question | D1 | D2 | D3 | D4 | D5 | D6 | D7 |
|---|---|---|---|---|---|---|---|
| 1. Would a potential client stop scrolling? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2. Clear single idea? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 3. Demonstrates Prohub expertise? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ ¹ |
| 4. Professionally art-directed? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 5. Copy sounds natural? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6. Clear business objective? | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 7. Could generate a real enquiry? | ✅ | ✅ | ✅ | ◐ ² | ✅ | ✅ | ✅ |
| 8. Distinct from generic agency content? | ✅ | ✅ | ✅ | ✅ | ✅ | ◐ ³ | ✅ |

1. D7 leans on market data more than Prohub's own work. That's acceptable for a conversion post, and the Reel and offer card carry the brand.
2. D4's CTA is a public comment, not a DM. That's deliberate (authority and engagement); conversion comes through the replies.
3. Free audits are common. Ours is differentiated by the public, specific three-note format and the reusable Story template, **if fulfilment is genuinely sharp**.

## 3. Conditions on approval (owner decisions)
See `campaign-report.md` → "What requires your approval". The campaign is **creatively approved by the MD** but **not cleared to publish** until the owner signs off on those items.

## 4. Round 2 — Reels rebuilt after owner feedback

**Owner's verdict on Round 1:** the edit style was repetitive (it looked like earlier Prohub videos), and the same
background track ran under every reel. **Accepted in full.** The MD's fix was process, not polish: a professional
pipeline (see `05 Videos/PRODUCTION-PROCESS.md`), a new edit engine, four style bibles, four original scores and
a designed sound world per film.

| # | Asset | What failed (look-dev / QA) | Fix |
|---|---|---|---|
| 16 | All reels | Layers inside scenes collapsed to the top-left (not absolutely positioned) | Engine CSS: every scene child absolute |
| 17 | D1 | COVER / YOUR / LOGO overflowed the frame; "MAKE IT OBVIOUS" lost its line breaks; voice tile invisible on paper; colour/shape cards top-heavy | Re-set type; three explicit lines; white tile + ink border; swatch card and centred morphing shape |
| 18 | Master bus | Pedalboard limiter added hidden make-up gain, giving −9 LUFS and +4.8 dBTP | Replaced with our own 4× oversampled look-ahead brick-wall and a gain-matching loop |
| 19 | D3 | Night intro 18 dB under the drop (lost on phones); logo too hot | Lifted pads, piano, sizzle; ember-crackle bed; logo −3 dB → intro now 6–8 dB under |
| 20 | D3 / D5 | Swing maths put odd 16ths almost on the next 8th | Corrected swing formula; re-scored |
| 21 | D3 | Split screen cropped the neon sign's name | Both boards shown whole, labelled Before / After |
| 22 | D7 | Headline hidden under the letterbox; "chosen?" lost its orange when split into words; calendar grid missed 30 Nov | Calendar scaled into the band; colour reapplied per word; 6-row grid with weekday header (verified: 1 Nov 2026 is a Sunday, 18 Dec is a Friday) |
| 23 | D3 / D5 delivery | Files too heavy (24 MB); AAC encoding pushed true peak to −0.2 dBTP | Bitrate caps; master ceiling −2.6 dBFS + 17.5 kHz low-pass; AAC `fast` coder (default coder overshot by 2.4 dB) |
| 24 | All reels | Motion-blur fold looked backwards, so the first frame after a hard cut blended in the previous shot | Forward shutter (each output frame averages its own sub-frames); all four re-rendered |

**Round 2 sign-off:** all four Reels pass the eight-question bar, and meet −14.0 LUFS and true peak ≤ −2.2 dBTP on the
delivered files.
