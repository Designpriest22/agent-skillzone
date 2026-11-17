# 04 · MD review (Adaeze): checked against the brief

| Brief requirement | Result |
|---|---|
| Redesign the client's 4-page newspaper | ✔ Same 4-page, 4:5 structure: Cover · Live Experience · Festival Essentials · Word Search |
| Add the sponsor logos | ✔ All 13 official sponsor logos, taken from the official flyer, on page 3 |
| More creative word puzzle with festival and Wizkid words | ✔ 19 words (8 hits, 4 albums, 7 festival words) in 8 directions. One worked example. The leftover letters hide a secret ticket message. |
| Sell the event | ✔ wizkid.tix.africa on every page: cover CTA band and Ticket Office box, classifieds, PSA step 1, facts row, puzzle answer and footer |
| Facts correct | ✔ Wizkid · Sunday 13 December 2026 (weekday checked) · Eagle Square, Abuja · wizkid.tix.africa |
| No unsupported claims | ✔ Removed: "six years in the making", "Vol. 19 No. 190", unverified `lolmusicfest.com`, the lorem-ipsum advert. No prices, scarcity, prizes or handles. |
| Platform size | ✔ 1080 × 1350 PNGs, plus PDF |

**Verdict:** approved for internal progression.

**L2 approval needed before publishing:**
1. The client confirms the festival experience copy on page 2 (LED visuals, hospitality zones and so on). It comes from their template, and we have not verified it.
2. The client confirms they have rights to the Wizkid photos they supplied.
3. The client confirms the sponsor list is still current.

**Open note:** the live Prohub OS agents were not run for this job. That needs an Anthropic API key and the database. The team stages above follow Prohub's documented workflow (`prohub-os/docs/AGENTS.md`) and each agent's quality bar.

---

# Revision 2 (3 Nov 2026): Live Experience, Live Feed, essentials vectors, partners

**Owner request:**
- Draw vector illustrations of the globally recommended festival essentials.
- Build out the sponsors area.
- Make Live Experience more exciting, with a current feed.

| Change | Check |
|---|---|
| **Page 3, Packing List:** 8 hand-drawn SVG essentials (ticket, photo ID, power bank, comfy shoes, water, card & cash, earplugs, light jacket for harmattan) with one-line tips. There is a note to check the organiser's entry and bag rules, because we don't know them. | ✔ Generic guidance only; no invented venue policies |
| **Page 3, Partners:** one tile per logo, auto-cut from the official flyer strip (`tools/split_sponsors.py`). The 14th cell is "+ YOU → wizkid.tix.africa". There are no sponsor tiers, since tiers would be invented. | ✔ All 13 logos unaltered |
| **Page 2:** spotlight-beam art, a countdown starburst computed from the issue date (40 days on 3 Nov 2026), a 6-icon "What fans can expect" strip, **The Live Feed** news timeline, and Jogodo added to the playlist. | ✔ |
| **Page 4:** JOGODO added to the hunt (20 words). The secret message is unchanged and the generator re-verified it. | ✔ |

**Live Feed facts.** Only items that several independent reports agree on were used:
- Wizkid headlines Live Out Loud at Eagle Square, Abuja, on Sunday 13 December 2026, announced in mid-October 2026. Sources: [notJustOk](https://notjustok.com/news/wizkid-confirms-2-concert-dates-and-venue-for-2026/), [The Rio Times](https://www.riotimesonline.com/wizkid-abuja-eagle-square-concert-2026/), [DancehallMag](https://www.dancehallmag.com/2026/10/14/news/wizkid-confirms-december-headline-shows-in-abuja-and-lagos-for-detty-december.html), [Voice of Nigeria](https://von.gov.ng/wizkid-announces-lagos-abuja-december-homecoming-concerts/)
- His Lagos show is on 18 December (Detty December Fest), so Abuja comes first. The other event is not named in the paper. Source: [Billboard](https://www.billboard.com/music/music-news/wizkid-headline-detty-december-festival-2026-afrobeats-1236315290/)
- "Jogodo" with Asake is the lead single of their joint EP *Real, Vol. 1* (January 2026). Sources: [The Source](https://thesource.com/2026/01/23/wizkid-asake-real-vol-1-ep-release/), [Arise](https://www.arise.tv/wizkid-and-asake-drop-surprise-single-jogodo-ahead-of-joint-ep-real-vol-1)

**Left out on purpose:**
- Ticket price and gate times: each came from a single source.
- Chart claims for "Jogodo": the sources were inconsistent.

**Time-sensitive:** the countdown and "Updated" date come from `ISSUE` in `index.html`. Change it and rebuild before posting on a later date.

**Removed to make room:** the "How to Pull Up" PSA box (its first step now lives on the ticket tile) and the "Global Rise of Afrobeats" article.

---

# Revision 3 (3 Nov 2026)
- The page 2 list is renamed **Learn the Lyrics**. The cover index and Live Feed item are updated to match.
- Festival Essentials: **Card only**, with a new icon (contactless card, cash crossed out) and the tip "Only card is accepted for food, drinks and merch." Per the owner, this replaces "Card & cash".
- Exported to **PowerPoint** (`out/live-out-loud-times.pptx`). The slides are images of the pages, so their text can't be edited in PowerPoint; the text of each page is in the speaker notes. Edits go through `index.html`, followed by a rebuild.

---

# Revision 4 (3 Nov 2026)
- The page 2 photo (Wizkid in a chair) is replaced with the owner-supplied satellite view of **Eagle Square**. It gets the same B&W halftone treatment as the other photos, an orange venue pin redrawn over the original (whose red would be lost in greyscale), and a "You are here · 13.12.26" tag.
- **Attribution kept:** the Google mark stays in frame, with the caption credit "Imagery: Google". Google Maps/Earth imagery may be used in marketing material only with attribution. Before running it as a paid ad, check Google's permission guidelines for maps imagery.
