# SEO strategy

Goal: make Destination Nigeria a credible discovery and information platform for Nigerian travel, culture, tourism investment and National Tourism Week. It should earn visibility through useful, accurate pages rather than volume.

## 1. Keyword research: method and limits

**What was done.** Search-results analysis for the core themes (October 2026). For "things to do / places to visit in Nigeria", results are dominated by blogs and affiliate guides (for example Awajis, TravelTriangle, MyGlobalViewpoint and Afrokonnect) plus Lonely Planet. No official national tourism hub ranks prominently for the head terms. That is the opportunity: an authoritative, maintained, source-linked hub can compete on trust signals that most ranking pages lack.

**What was not possible.** The keyword-volume and competitor tools in this workspace (Ahrefs, Similarweb, Supermetrics) failed to connect, so **no search-volume, difficulty or click-through figures are claimed**. Validate the clusters below before committing editorial budget:

1. Google Keyword Planner (Nigeria, United Kingdom, United States, Ghana, South Africa and Canada for the diaspora): volumes and seasonality.
2. Google Search Console, once live (from week 2): real queries, impressions and positions.
3. Ahrefs or Semrush (when connected): difficulty, the SERP feature mix, competing URLs.
4. Google Trends: seasonality of festival and holiday terms (for example December, Easter and Sallah periods).

## 2. Keyword clusters and target pages

Intent: I = informational, N = navigational, C = commercial, T = transactional.

| Cluster | Example queries (to validate) | Intent | Target page(s) |
| --- | --- | --- | --- |
| National discovery | explore Nigeria, visit Nigeria, tourism in Nigeria, Nigeria travel guide | I/N | `/`, `/discover` |
| Places and things to do | places to visit in Nigeria, things to do in Nigeria, Nigerian holiday destinations, tourist attractions in Nigeria | I | `/destinations`, `/experiences` |
| State discovery | places to visit in Lagos / Cross River / Osun…, tourist attractions in [state] | I | `/states/[state]` (only states with real content) |
| Named attractions | Olumo Rock, Erin-Ijesha waterfall, Obudu Mountain Resort, Yankari, Zuma Rock, Osun-Osogbo grove | I | `/destinations/[slug]` |
| Nature | waterfalls in Nigeria, national parks in Nigeria, highlands, hiking in Nigeria | I | `/experiences/nature-and-adventure` + guide articles |
| Heritage | UNESCO sites in Nigeria, cultural heritage sites in Nigeria, Benin bronzes Benin City, Badagry slave route | I | `/experiences/arts-culture-and-heritage`, destination pages |
| Food | Nigerian food tourism, what to eat in Nigeria, Nigerian dishes by region | I | `/experiences/food-and-culinary-travel`, food guide |
| Festivals | festivals in Nigeria, Calabar Carnival, Argungu festival, Osun-Osogbo festival, durbar festival | I | festival destination pages; a dated calendar once dates are confirmed |
| Weekend getaways | weekend getaways from Lagos / Abuja | I/C | future itinerary articles |
| Trip planning | Nigeria itinerary, travel tips for Nigeria, is a visa required for Nigeria, Nigeria e-visa, yellow fever Nigeria | I | `/plan`, first-trip guide (links to official sources) |
| Packages | Nigeria tour packages, hotels in Obudu, Lagos tours | C/T | `/offers` (once verified listings exist) |
| Investment | tourism investment opportunities in Nigeria, hospitality investment Nigeria, tourism business opportunities Nigeria | I/C | `/invest`, investment articles |
| Partnerships | tourism partnerships Nigeria, destination development Nigeria | I | `/partners` |
| National Tourism Week | Destination Nigeria National Tourism Week, Nigerian tourism events, tourism conference Nigeria | N/I | `/national-tourism-week` |

**Terminology.** Use the names Nigerians and visitors actually search: state names with "State", local names alongside English ones (Olumirin / Erin-Ijesha), "Sallah durbar", "jollof", "suya", "adire". Write for domestic, diaspora and international readers in plain British-Nigerian English.

## 3. Page templates and metadata

Every indexable page has a unique `<title>`, meta description, canonical URL, Open Graph and Twitter cards (`pageMetadata()` in `src/lib/seo.ts`), one `h1`, a logical heading order and breadcrumbs.

| Template | Title pattern | Notes |
| --- | --- | --- |
| Home | Destination Nigeria \| Experience. Invest. Explore. | Brief's recommended title and description used verbatim |
| Destinations index | Places to visit in Nigeria: destinations by state and experience | ItemList JSON-LD |
| Destination | {Name}, {State} | TouristAttraction (or Place for festivals), BreadcrumbList, sources, last-checked date |
| State | Places to visit in {State} | Generated only for states with destinations (no thin pages); ItemList |
| Experience | {Experience} in Nigeria | ItemList |
| Plan | Plan your trip to Nigeria: itinerary builder, entry and travel advice | Official sources with dates |
| Invest | Tourism investment opportunities in Nigeria | No figures until approved |
| Story | {Headline} | Article JSON-LD, author, dates, review status |
| NTW | National Tourism Week | No Event schema until real dates exist |

Not indexed: `/search` (noindex header and meta), `/api/*`, `/search-index.json`. Filter URLs on `/destinations?…` canonicalise to `/destinations`. On preview deployments, `SITE_INDEXING=off` blocks all crawling.

## 4. Technical SEO checklist (implemented)

- [x] XML sitemap (`/sitemap.xml`) with `lastmod` from content dates and image entries
- [x] `robots.txt` with sitemap reference
- [x] Canonical URLs on every page (absolute, from `NEXT_PUBLIC_SITE_URL`)
- [x] Open Graph and Twitter cards with a 1200×630 image per page (`/og/*.png`)
- [x] `lang="en-NG"`, `og:locale en_NG`
- [x] Semantic HTML landmarks, crawlable `<a href>` navigation, breadcrumbs
- [x] 301/308 redirects for friendly URLs (`next.config.ts`) and real 404s for unknown slugs (`dynamicParams = false`)
- [x] Custom 404 and error pages
- [x] Structured data: Organization, WebSite plus SearchAction, BreadcrumbList, ItemList, TouristAttraction/Place, Article
- [x] No fake ratings, reviews, opening hours, prices or coordinates in markup
- [x] Fast static pages, no render-blocking third-party scripts, CLS 0 (see audit)
- [x] Web app manifest, theme colour, icon

**Validate before launch:** run five representative URLs through Google's Rich Results Test and the Schema.org validator (validator.schema.org) once deployed.

## 5. Structured data rules

| Type | Used on | Rule |
| --- | --- | --- |
| Organization, WebSite | Every page | Only verified identity fields. Add `sameAs` when social profiles are confirmed |
| BreadcrumbList | Interior pages | Mirrors visible breadcrumbs |
| ItemList | Collections | Lists real destinations only |
| TouristAttraction / Place | Destination pages | Name, description, region and country only. Add `geo`, `openingHoursSpecification` or `isAccessibleForFree` only when verified by the operator |
| Article | Stories | Author is the editorial team. Add `reviewedBy` when review is complete |
| Event | Not used yet | Add to `/national-tourism-week` and festival pages only with confirmed dates, venue, organiser and status |
| Hotel / LocalBusiness | Not used yet | Only for verified listings on `/offers` or future business pages |

## 6. Content strategy

**Clusters (pillar → supporting pages):**

1. Destination and state guides: `/destinations`, state pages, destination pages, "weekend from Lagos/Abuja" guides
2. Cultural heritage: heritage experience page, the two World Heritage Sites, Benin bronze casting, Badagry
3. Food and culinary travel: food experience page, regional food guide, market guides
4. Nature and adventure: highlands guide, waterfalls guide, national parks guide
5. Festivals and events: festival guides; a dated calendar only from confirmed organiser dates
6. Trip planning and responsible travel: first-trip framework, responsible travel guide, entry and health hub
7. Tourism investment and hospitality development: readiness article, state opportunity spotlights (when approved)
8. Community-led tourism: community experience page, operator spotlights (with consent)
9. National Tourism Week updates: programme page plus news posts during the 8-week campaign

**Publishing template** (enforced by `storySchema`): title, dek, category, author, reviewer, review status, published date, updated date, reading time, related destinations, source list. Sensitive topics (safety, entry, health, transport) must link to an authoritative source and show a last-checked date.

**Quality rules:** no thin pages, no near-duplicate state pages, no auto-generated text, no superlatives that can't be sourced, and never describe a destination as risk-free.

## 7. International and local SEO

- One English site serving Nigerian, diaspora and international audiences. No country-variant duplicates.
- Add multilingual versions (for example Hausa, Yoruba, Igbo or French) only with professional translation, editorial review and `hreflang`.
- For Nigerian local search, state pages and destination pages carry state, LGA or locality and the state capital in visible text.

## 8. Conversion-focused internal linking

Every cluster has a next step:

| From | Next step |
| --- | --- |
| Destination | Save to trip → Plan; nearby destinations; experience; stories; "help us verify" (operators) |
| State | Destinations; advisories; showcase form (state authorities) |
| Story | Destinations in the story → shortlist |
| Invest | Investor enquiry; partnership form; newsletter (investment interest) |
| NTW | Register interest; partnership form (organisations) |
| Offers | Booking link (tracked), or list an offer |

## 9. Measurement plan

| Metric | Source | Cadence |
| --- | --- | --- |
| Organic impressions, clicks, CTR, average position by cluster | Search Console (filter query regex per cluster) | Weekly |
| Indexed pages vs sitemap | Search Console → Pages | Weekly in the first 90 days |
| Organic landing-page engagement | Plausible (landing page × source = Google) | Monthly |
| Destination discovery interactions | `destination_search`, `destination_filter`, `destination_view` | Monthly |
| Qualified investment and partner enquiries | `investment_enquiry_submit`, `partner_enquiry_submit` plus CRM qualification | Monthly |
| Newsletter registrations | `newsletter_signup` | Monthly |
| Verified booking-link clicks | `booking_link_click` | Monthly, once offers exist |
| Editorial performance | Clicks and engagement per story URL | Monthly |

No rankings or traffic outcomes are promised. Targets should be set after 4–6 weeks of Search Console baseline data.
