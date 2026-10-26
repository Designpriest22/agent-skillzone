# Analytics specification

## Approach

- Provider: **Plausible** (cookieless, no personal data). Any equivalent provider can be swapped in by editing `src/lib/analytics.ts` and the consent script in `src/components/Consent.tsx`.
- Off by default. Analytics loads only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set **and** the visitor chooses "Allow analytics" in the consent banner or on `/cookies`. With no provider configured, no banner appears.
- The Content-Security-Policy allows the analytics origin only when configured (`next.config.ts`).
- Event properties never contain names, emails, free text or other personal data.

## Implemented events

All events are sent through `track()` in `src/lib/analytics.ts`.

| Event | Fired when | Properties | Source |
| --- | --- | --- | --- |
| `destination_search` | A search of 3+ characters settles in the explorer, or a hero search is submitted | `length`, `source` (hero) | `DestinationExplorer.tsx`, `HeroSearch.tsx` |
| `destination_filter` | Category, region or state filter changes | `filter`, `value` | `DestinationExplorer.tsx` |
| `destination_view` | A destination page is viewed | `destination`, `state` | `destinations/[slug]/page.tsx` via `TrackView` |
| `trip_shortlist_add` | A destination is saved (not on removal) | `destination` | `ShortlistButton.tsx` |
| `itinerary_export` | Download, print or copy share link | `format` (txt, print, link), `stops` | `ItineraryBuilder.tsx` |
| `investment_enquiry_start` | First focus in the investment form | — | `EnquiryForms.tsx` |
| `investment_enquiry_submit` | The server confirms delivery | — | `EnquiryForms.tsx` |
| `partner_enquiry_submit` | The server confirms delivery | — | `EnquiryForms.tsx` |
| `newsletter_signup` | The server confirms delivery | — | `NewsletterForm.tsx` |
| `booking_link_click` | A verified offer's booking link is clicked | `offer` | `BookingLink.tsx` (active once offers exist) |
| `national_tourism_week_interest` | NTW newsletter sign-up is delivered, or a partnership enquiry with interest "ntw" is submitted | — | `NewsletterForm.tsx`, `EnquiryForms.tsx` |

Submit events fire only after confirmed delivery (`code: "delivered"`), never on failed or unconfigured submissions.

## Set-up

1. Create the site in Plausible with the production domain.
2. Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (and `NEXT_PUBLIC_PLAUSIBLE_SRC` if self-hosting) and redeploy.
3. In Plausible → Settings → Goals, add a **custom event goal** for each event above.
4. Add **custom properties** `destination`, `state`, `filter`, `value`, `format`, `stops`, `offer` and `source` to break goals down.
5. Suggested funnels: `destination_view` → `trip_shortlist_add` → `itinerary_export`; landing on `/invest` → `investment_enquiry_start` → `investment_enquiry_submit`.
6. Link Google Search Console to Plausible for query data alongside traffic.

## Conversion goals

Primary: `investment_enquiry_submit`, `partner_enquiry_submit`, `newsletter_signup`. Secondary: `itinerary_export`, `trip_shortlist_add`, `booking_link_click`, `national_tourism_week_interest`.
