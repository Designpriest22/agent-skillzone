# Week 01 Lead-Generation & Conversion Strategy

**Owners:** Sales & Marketing Director (strategy, qualification) · Social Media Manager (inbox, tagging) · Client Relationship Manager (follow-up, CRM)
**Principle:** likes and followers are not the goal. The goal is **conversations → qualified prospects → calls → proposals → paid work**. Every number below is counted, not estimated.

---

## 1. Lead capture: how attention becomes a named conversation

| Capture point | Mechanism | Source tag |
|---|---|---|
| Keyword DMs | Each post has its own keyword: **OBVIOUS** (D1), **FIX** (D2), **SHOWCASE** (D3), **BUILD** / slide number (D5), **DECEMBER** (D7) | `wk01-d1` … `wk01-d7` |
| Public comments | Day 4 "Why you?" answers and Day 6 handle drops are public lists of owners who care about their brand | `wk01-d4-comment`, `wk01-d6-handle` |
| Story interactions | Poll votes, quiz answers, question-box replies. Anyone who votes "Honestly… no" or answers a question box gets a soft follow-up DM | `wk01-story-<day>` |
| WhatsApp link | `[WhatsApp link]` in bio and on Story link stickers, using a pre-filled message: *"Hi Prohub, I saw your post about ___"* | `wk01-wa` |
| LinkedIn | Messages and comments on document posts; profile views from decision-makers (weekly export) | `wk01-li` |
| Shares/sends | Sends can't be attributed to individuals, so track the *count* in Insights as a leading indicator | (metric only) |

**Optional, needs approval:** run the Day 7 post as a **Click-to-WhatsApp ad** (Messages objective), Lagos + Abuja, business-owner interests, for 5 days. Budget is set by the owner; agents cannot commit spend (L3).

## 2. First response: within 60 minutes during working hours (8 am–9 pm WAT)

Speed matters more than polish. Scripts are starting points; personalise the first line every time.

**OBVIOUS (Day 1)**
> Hi [name], thanks for running the test! 👀 Quick question so we can be useful: what does your business do, and which city are you in? Send us your handle and we'll tell you the one thing your brand already owns, and the one thing it's missing.

**FIX (Day 2)**
> Hi [name], respect for counting honestly 😄 Which leaks did you spot? Tell us your top two and your handle, and we'll tell you which one we'd fix first and roughly what it involves.

**SHOWCASE (Day 3)**
> Hi [name], glad Ember & Yaji landed! What are you building, and what's the brand problem you'd want solved? If there's a deadline (an opening, a launch, December), tell us that too.

**Comment reply ("Why you?", Day 4)**
> Love this. Here's how a customer might hear it: [one honest sentence]. Want us to sharpen it? Send us a DM.

**BUILD / slide number (Day 5)**
> Hi [name], number [X] is one we fix a lot. Two quick questions: (1) what's the business and city? (2) is there a date you need this sorted by? Then we'll tell you exactly where we'd start.

**Handle drop (Day 6)**, reply to *every* commenter:
> Got it! We're picking five by Sunday 9 pm. Even if you're not one of them, DM us and we'll send you one quick note anyway.

**DECEMBER (Day 7)**
> Hi [name], let's get you December-ready. The Brand Direction Call is 20 minutes on WhatsApp call, Google Meet or Zoom. Which works better, and are mornings or afternoons better this week? Also: what's happening for your business in December?

**Pricing questions:** quote only owner-configured prices. Otherwise:
> Depends on scope. Most of our projects are scoped after a 20-minute call so we don't sell you anything you don't need. Can we book one this week?

## 3. Qualification: 5 questions, 10 points

Ask naturally across the first 2–3 messages. Score in the tracker (`08 Reports/lead-tracker.csv`).

| Signal | 0 | 1 | 2 |
|---|---|---|---|
| **Need** | Vague / just curious | General ("we need branding") | Specific problem + example ("our flyers look cheap and nobody calls") |
| **Timeline** | No timeline | This quarter | Before December / within 30 days |
| **Authority** | Fan / student / employee with no say | Influencer in decision | Owner, founder or marketing lead |
| **Fit** | Outside services or region | Adjacent | Priority segment (SME, hospitality, events, entertainment, corporate, startup, personal brand) in Abuja/Lagos or international |
| **Budget signal** | Expects free work | Unclear | Mentions budget, past agency spend, or asks for a proposal |

- **8–10 = Qualified** → book the Brand Direction Call within 48 h → CRM stage `qualified`, then `meeting_scheduled`
- **5–7 = Nurture** → value follow-up (send the relevant carousel / Brand Read) → stage `responded`
- **0–4 = Community** → thank, keep engaged, no hard follow-up → stage `contacted` or not entered

## 4. Brand Direction Call (20 minutes): the conversion step

1. **(3 min)** Their business, customers, what's happening in December/Q1.
2. **(7 min)** Screen-share their profile/site live: 3 honest observations, using the Day 2 leaks as the checklist.
3. **(5 min)** What to fix before December vs what can wait.
4. **(5 min)** Next step: a scoped proposal (needs approval before sending) or a clear DIY recommendation.

Within 24 h of the call: a WhatsApp summary of the 3 observations and the proposed next step. A proposal goes out only after the owner approves pricing and dates (L2).

## 5. Follow-up cadence (matches the Prohub OS outreach SOP)

| When | Message |
|---|---|
| No reply after first response | **Day +2:** "Hi [name], just checking you saw this. Happy to send our take on your handle whenever you're ready." |
| Still no reply | **Day +5:** share the most relevant asset (e.g., Day 2 carousel for FIX, Day 7 checklist for DECEMBER) with one line of context |
| Still no reply | **Day +9:** close the loop politely, then move to `follow_up_required` → `lost` after 30 days |
| After call, no decision | **+2 days:** recap + one question; **+7 days:** "Is December still the target date?" |

Respect opt-outs. Only message people who contacted Prohub first or publicly invited contact.

## 6. Recording leads in the CRM (Prohub OS)

Each qualified or nurture conversation becomes a lead in Prohub OS (`/os/crm`) with:
- `source`: `instagram` / `facebook` / `linkedin` / `tiktok` / `whatsapp` · `campaign`: `WK01 Make it obvious` · `source_post`: the day tag
- **Verified facts** (what they said, their handle/URL) kept apart from **assumptions**, as the system requires
- Score (0–10) and stage from `new_lead → contacted → responded → qualified → meeting_scheduled → proposal_sent → negotiation → won/lost`

Until the OS is running with a database, record in `08 Reports/lead-tracker.csv`. Columns match the CRM so it can be imported.

## 7. Spotting prospects among engagers

Each evening the Social Media Manager reviews engagers and adds to the tracker anyone who:
- comments with a business handle or a business problem;
- votes "Honestly… no" / "Yes 😩" on a diagnostic poll *and* has a business profile;
- saves or shares the Day 2 or Day 4 carousel *and* follows/visits from a business account (visible only partly in Insights);
- views the Day 7 Reel more than once and visits the profile (Insights → Profile activity).

No scraping and no unsolicited mass DMs. Public engagers may get one friendly, relevant reply, never a pitch on first contact.

## 8. Expected lead-generation opportunities (honest ranges, not promises)

There's no historical Prohub account data in the system, so these are **planning assumptions to replace with real week-1 numbers**:

| Source | Expect | Why |
|---|---|---|
| Day 6 Brand Read handles | Highest raw volume | Free, specific value with a public ask |
| Day 7 DECEMBER DMs | Highest intent | Time-bound offer to segments buying now |
| Day 2 FIX DMs + sends | Good volume, mixed intent | Recognition content travels |
| Day 3 SHOWCASE | Fewer, higher-value (hospitality / F&B) | Shows full-scope capability |
| LinkedIn messages (Days 4, 7) | Few, but corporate-sized | Decision-makers in a less crowded feed |

The measurement framework (`08 Reports/measurement-framework.md`) sets the week-1 targets to beat in week 2.
