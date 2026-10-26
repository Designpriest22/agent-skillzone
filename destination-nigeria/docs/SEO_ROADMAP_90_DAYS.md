# 90-day SEO roadmap

Week 0 is the launch date. Objectives are measurable but not traffic promises; set numeric targets from the baseline gathered in phase 1.

## Phase 1 — Foundations (days 1–30)

| # | Action | Owner | Depends on | Done when |
| --- | --- | --- | --- | --- |
| 1 | Set `NEXT_PUBLIC_SITE_URL` to the production domain; confirm canonicals and the sitemap use it | Developer | Domain | Canonicals and sitemap show the production host |
| 2 | Verify the domain in Google Search Console (DNS TXT, or `GOOGLE_SITE_VERIFICATION`) and Bing Webmaster Tools; submit `/sitemap.xml` | Developer | Domain access | Sitemap status "Success" |
| 3 | Validate structured data on 5 URL types (Rich Results Test, Schema validator) | SEO | Live site | Zero errors |
| 4 | Configure consent-gated analytics and the events in `ANALYTICS.md` | Developer | Plausible account | Events visible in the dashboard |
| 5 | Validate keyword clusters with Keyword Planner and (when connected) Ahrefs; record volumes and difficulty in this file | SEO | Tool access | Cluster table has data |
| 6 | Editorial review of the 7 launch stories; set `reviewStatus: "reviewed"` and the reviewer | Editor | Named reviewers | All stories reviewed |
| 7 | Begin state verification of the 31 destination entries (priority: featured ones) | Content and state partners | Partner contacts | First 8 marked verified |

**Objectives:** 100% of sitemap URLs discovered; core pages indexed; analytics baseline running; zero structured-data errors.

## Phase 2 — Depth and authority (days 31–60)

| # | Action | Notes |
| --- | --- | --- |
| 8 | Publish 6 cluster articles: waterfalls guide, national parks guide, festival guide (evergreen, no invented dates), Lagos weekend itinerary, Abuja weekend itinerary, regional food guide | Each links to at least 3 destinations and one next step |
| 9 | Add licensed, location-verified photography to the featured destinations (see `ASSETS.md`) | Improves image search, CTR and engagement |
| 10 | Expand thin state pages to at least 3 verified destinations each, or keep them unpublished | Avoid doorway pages |
| 11 | Digital PR: brief state tourism boards, Nigerian travel media and diaspora outlets on the platform and National Tourism Week | Earn links from `.gov.ng`, media and institutions |
| 12 | Review Search Console queries; add FAQ sections to pages where real questions appear | Plain HTML FAQ; use FAQ schema only if eligible |

**Objectives:** first non-brand impressions in each priority cluster; at least 5 referring domains from relevant organisations; story pages indexed.

## Phase 3 — Conversion and campaign (days 61–90)

| # | Action | Notes |
| --- | --- | --- |
| 13 | When National Tourism Week dates are confirmed: add Event schema, the dated programme and a registration link; publish weekly campaign posts (8-week calendar) | Only with confirmed details |
| 14 | Publish the first verified offers with Hotel/LocalBusiness schema where eligible; track `booking_link_click` | Needs verified providers |
| 15 | Publish approved investment opportunity summaries; add internal links from state pages | Needs approvals |
| 16 | Improve CTR on pages with high impressions and low CTR (title and description tests) | Search Console data |
| 17 | Quarterly content audit: refresh last-checked dates and resource links; prune or merge underperforming pages | `npm run content:check` |

**Objectives:** measurable organic-to-enquiry conversions (`investment_enquiry_submit`, `partner_enquiry_submit`, `newsletter_signup`); growth in non-brand clicks compared with the phase 1 baseline.

## Dependencies outside the codebase

Production domain and DNS access · Search Console and analytics accounts · keyword tool access · named editorial reviewers · state tourism contacts for verification · licensed photography · confirmed National Tourism Week details · approved investment opportunities · verified offer providers.
