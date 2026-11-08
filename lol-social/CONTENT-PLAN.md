# Live Out Loud × Wizkid: feed and story content plan

35 days out (8 Nov → Sun 13 Dec 2026). The one job of every post is to get people to wizkid.tix.africa.

## What the research says (and how this plan uses it)

| Finding | How it's used |
|---|---|
| Carousels get the highest engagement rate (≈0.55%, vs ≈0.52% for Reels and ≈0.37% for single images), and they drive **saves**. [Socialinsider](https://www.socialinsider.io/data-geeks/instagram_benchmarks_2025.pdf) | Info and game posts are carousels: The Facts, the word hunt and the emoji quiz. Each has a reason to save or swipe. |
| Reels drive **shares and comments**, and a strong hook can bring 40–90% of reach from non-followers. [Contentdrips](https://contentdrips.com/blog/2026/06/instagram-reels-vs-carousels-2026-guide/) · [Upgrow](https://upgrow.vercel.app/blog/carousels-vs-reels-drives-more-engagement) | Reach pieces are Reels with the hook in the first second: the countdown, the artist teaser, and "Abuja, are you ready?". |
| Countdown posts keep momentum; urgency posts (sell-through updates) move buyers. [Ticket Fairy](https://www.ticketfairy.com/blog/2025/07/08/social-media-engagement-before-during-and-after-the-festival/) · [Sked Social](https://skedsocial.com/blog/event-marketing-instagram.md) | There's a countdown Reel template, and a "Standard Wave 1 sold out" post. |
| Short artist montages, with the artist tagged, borrow the artist's fan base when reshared. [Tickts](https://tickts.co.uk/blog/instagram-reels-event-promotion-guide) · [Moshville](https://moshville.co.uk/misc/2025/10/how-to-promote-your-music-event-on-instagram-a-complete-guide-for-2025/) | The artist teaser uses real Wizkid footage. Tag him and Starboy. |
| User-generated content and tagging turn buyers into promoters. [Ticket Fairy](https://branded.ticketfairy.com/blog/10-essential-types-of-online-content-to-attract-ticket-buyers-to-your-music-festival) | Tag Your Squad and Festival Bingo exist to be tagged and shared. |
| Poll, quiz and countdown stickers lift story engagement. The often-quoted "+50%" is vendor-reported and unaudited; judge stickers by response rate. [ManyChat](https://manychat.com/blog/instagram-story-polls-low-effort-high-engagement/) · [Socialk](https://socialk.it/en/blog/instagram-story-stickers-engagement) | This-or-That stories leave the centre free for a Poll sticker. |

All of this is vendor research with no lift figures for ticket sales specifically. Measure on the account: saves per carousel, shares per Reel, sticker response rate, and link taps to the ticket page.

## The content (all in `out/`)

**Motion: Reels, 1080×1920, original score**
| # | File | Hook | Caption idea |
|---|---|---|---|
| F01 | `f01-countdown.mp4` (8 s) | A counter rolls from 100 down to **35 days** | "35 days. Abuja, set your alarm. 🎟 link in bio" |
| F02 | `f02-artist-teaser.mp4` (9 s) | Wizkid walk-out, then stage and pyro, then the date card | "Big Wiz. Eagle Square. 13.12. Tag @wizkidayo" |
| F03 | `f03-how-to-buy.mp4` (9 s) | Three steps to a ticket | "It takes a minute. wizkid.tix.africa" |
| F04 | `f04-abuja-are-you-ready.mp4` (8 s) | ABUJA, / ARE / YOU / READY? over the crowd | "Abuja, are you ready? 13 Dec." |

**Still: feed, 1080×1350**
| # | File | Purpose |
|---|---|---|
| F05 | `f05-the-facts-1.png` + `-2.png` (carousel) | The save-worthy reference post: what, who, when, where, tickets |
| F06 | `f06-wave-1-sold-out.png` | Urgency: Standard Wave 1 sold out |
| F07 | `f07-tag-your-squad.png` | Comment driver: "Tag the 4 people you're pulling up with" |
| F08 | `f08-which-era.png` | Comment driver: the six albums with their years |
| F09 | `f09-partners.png` | Partner thank-you; partners are likely to reshare |
| F10 | `f10-save-the-date.png` | Save driver: December 2026 calendar with Sunday 13 circled |

**Games**
| # | File | Format | Mechanic |
|---|---|---|---|
| G1 | `g1-word-hunt.png` then `g1-word-hunt-answers.png` | Feed carousel, or post the answers 48 h later | 20 hidden words. The leftover letters spell GET YOUR TICKET NOW AT WIZKID TIX AFRICA. Ask people to comment the message. |
| G2 | `g2-emoji-quiz.png` + `g2-emoji-quiz-answers.png` | Feed carousel | Six songs as emojis; answers on slide 2 |
| G3 | `g3-this-or-that-1…3.png` | Stories | Add a **Poll** sticker over the "OR" circle |
| G4 | `g4-festival-bingo.png` | Story | Screenshot, tick your squares, reshare and tag. Add a **Countdown** sticker to 13 Dec at the bottom. |

## A 5-week rhythm (suggested)

| Week | Feed | Stories |
|---|---|---|
| 1 (8–14 Nov) | F01 countdown · F05 facts · G1 word hunt | This-or-That 1 · Countdown sticker |
| 2 (15–21 Nov) | F02 artist teaser · F08 which era · G1 answers | This-or-That 2 · reshare comments |
| 3 (22–28 Nov) | F06 wave 1 sold out · F03 how to buy · G2 emoji quiz | Bingo · This-or-That 3 |
| 4 (29 Nov–5 Dec) | F04 Abuja are you ready · F07 tag your squad · F09 partners | Bingo reshares · quiz sticker |
| 5 (6–13 Dec) | Countdown (re-render at 7, 3 and 1 days) · F10 save the date · the event | Daily countdown · gate-day info |

## Before posting
- **Countdown:** it reads 35 days, which is correct on 8 Nov. Change the number in `studio.html` (`f01-countdown`) and re-render on the day you post.
- **Wave 1 sold out:** taken from the organisers' own poster. Post it only while it's true, and don't name a next wave or price until it's confirmed.
- **Gates and prices:** gate times and prices are left out because they couldn't be confirmed from more than one source.
- **Rights:** F02 uses Wizkid footage from the C3 ad. Confirm usage rights with management before posting it or boosting it.
- **Captions:** no handle for the festival account was found in the project. Add it to the captions.

Build: `node render.mjs` (everything), `node render.mjs stills`, or `node render.mjs f01-countdown`.
