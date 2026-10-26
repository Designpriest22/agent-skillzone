# Content guide

All content lives in typed, validated files under `src/content/`. There is no CMS yet (none was connected to this project); the data layer is shaped so one can replace it later without touching page templates (see "Moving to a CMS").

After any edit, run `npm run content:check`. It validates every record against the schemas in `src/content/schema.ts` and checks relationships: states exist, related destinations exist, nothing is "verified" without a verifier, campaign weeks are in order, and every source uses https.

## Content types

| Type | File | Key fields |
| --- | --- | --- |
| States (37) | `states.ts` | `slug`, `name`, `capital`, `zone`, `svgId` (map outline), optional `summary` |
| Destinations | `destinations.ts` | `slug`, `name`, `state`, `locality`, `categories`, `summary` (≤220 characters), `intro[]`, `highlights[]`, `practical[]`, `plate`, `featured`, `verification` |
| Experience themes | `experiences.ts` | `slug`, `name`, `line`, `intro[]`, `categories` (which destinations appear), `plate`, `planningNotes[]` |
| Stories | `stories.ts` | `slug`, `title`, `dek`, `category`, `author`, `reviewer`, `reviewStatus`, `published`, `updated`, `readingMinutes`, `plate`, `relatedDestinations`, `body[]` (blocks: `p`, `h2`, `ul`, `note`), `sources[]` |
| Programme, investment, partners | `platform.ts` | Proposition, objectives, outcomes, campaign weeks, NTW programme and **status** (dates, venue, speakers, registration), invest pathways, opportunity categories, `opportunities[]`, `investmentPack`, `offers[]`, `partners[]`, prospective partner types, `socialLinks[]`, `officialContact` |
| Travel resources | `resources.ts` | Official links by topic, each with `lastChecked` |
| Licensed media | `media.ts` | `heroFilm`, `destinationPhotos` with licence fields |
| Site settings | `site.ts` | Name, metadata defaults, navigation |

## The verification model

Every destination has:

```ts
verification: {
  status: "reference" | "verified",
  verifiedBy?: "Cross River State Tourism Bureau",  // required when verified
  lastChecked: "2026-10-26",
  sources: [{ label, url }],
}
```

- **reference** (all launch entries): written from public reference sources (UNESCO and encyclopaedic references) and shown to visitors as "Reference content · awaiting state verification".
- **verified**: a named authority or operator has confirmed the facts. The page then shows "Verified by …".

Practical information (`practical[]`) must stay generic ("confirm access with the operator") until verified. Never add opening hours, prices, transport schedules, visa rules or safety assurances as fact.

## Adding a destination

1. Copy an existing entry in `destinations.ts`. Choose a unique, lowercase, hyphenated `slug`.
2. Set `state` to a slug from `states.ts`, and choose 1–4 `categories`.
3. Write a `summary` (one sentence, ≤220 characters) and 1–3 `intro` paragraphs. Use original wording, with no unsourced superlatives.
4. Add `highlights` and `practical` notes, and at least one `sources` entry.
5. Choose a `plate`: a `scene` that matches the landscape type, a `tod` (dawn, day, dusk or night) and a new unique `seed`. Preview it at `/plates/{scene}-{tod}-{seed}.svg` in `npm run dev`.
6. Run `npm run content:check`, then `npm run build`. The page, its state page, sitemap entry, map pin, search entry and social card are all generated automatically.

## Publishing other content when it becomes available

| When you have… | Edit |
| --- | --- |
| National Tourism Week dates, venue, speakers, registration, press kit | `ntwStatus` in `platform.ts` (then add Event schema; see `SEO_STRATEGY.md`) |
| An approved investment opportunity | Add to `opportunities[]` (requires `verification` and a contact route) |
| The investment information pack | Put the PDF in `public/downloads/` and set `investmentPack` |
| A verified offer | Add to `offers[]` with provider, terms and `bookingUrl` |
| A confirmed partner | Add to `partners[]`. Set `approvedForLogoUse` and `logo` only with written permission |
| Official social channels or contact details | `socialLinks`, `officialContact` |
| Licensed photography or film | `media.ts` (see `ASSETS.md`) |

## Editorial workflow (stories)

1. **Draft:** write the story in `stories.ts` with `reviewStatus: "awaiting-review"` and `reviewer: null`. The page shows "Awaiting editorial and subject review".
2. **Fact check:** every claim on safety, entry, health, transport, dates or prices links to an authoritative source in `sources[]`.
3. **Review:** a subject reviewer (for example the state tourism authority, or a heritage or health specialist) signs off. Set `reviewer` and `reviewStatus: "reviewed"`, and update `updated`.
4. **Refresh:** re-check sources at least every 6 months, or monthly for travel-advice content. Update `updated` and the resource `lastChecked` dates.

**Style:** sentence case, British-Nigerian spelling, plain active verbs. Name places as locals do. Do not describe any destination as risk-free, and do not invent statistics, partnerships or dates.

## Moving to a CMS

Templates read content only through the exports in `src/content/*` and the schemas in `schema.ts`. To move to a headless CMS (Sanity, Contentful, Payload or Strapi):

1. Model the same types and fields, and reuse the zod schemas to validate CMS responses.
2. Replace each content module's export with a fetch that runs at build time (or with revalidation). Pages are statically generated, so add an on-demand revalidation webhook from the CMS.
3. Keep `plate` as a fallback field when no licensed image is set.
4. Keep the verification and review fields as required CMS fields, with role-based permissions for who can mark content verified.
