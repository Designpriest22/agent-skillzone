/**
 * SEASON FEST 2026 — single source of truth for event content.
 *
 * Everything a non-developer may need to update lives in this file:
 * the ticket link, event facts, socials, producers, sponsors, lineup and FAQ.
 *
 * Rules this file follows:
 *  - Only facts confirmed in the supplied deck/artwork (or by the producers'
 *    own published channels) are filled in.
 *  - Anything unconfirmed is `null` or an empty array, and the UI omits it.
 *    Fill a value in and it appears automatically on the next build.
 */

/* ------------------------------------------------------------------ */
/* 1. TICKETS                                                          */
/* ------------------------------------------------------------------ */

/**
 * The official ticket URL.
 *
 * `null` → every GET YOUR TICKET button opens the "tickets drop soon" modal.
 * A URL  → every GET YOUR TICKET button opens the official ticket page.
 *
 * You can also set PUBLIC_TICKET_URL in your hosting environment instead of
 * editing this file; the environment variable wins when both are set.
 */
export const TICKET_URL: string | null = null;

/** Label used by every ticket CTA on the page. Keep it consistent. */
export const TICKET_LABEL = 'Get your ticket';

const envTicketUrl = (import.meta.env.PUBLIC_TICKET_URL as string | undefined)?.trim();

/** Resolved ticket URL used by components. Do not edit — edit TICKET_URL. */
export const ticketUrl: string | null = envTicketUrl || TICKET_URL || null;
export const ticketsLive = ticketUrl !== null;

/* ------------------------------------------------------------------ */
/* 2. EVENT FACTS                                                      */
/* ------------------------------------------------------------------ */

export const EVENT = {
  name: 'SEASON FEST',
  year: 2026,
  fullName: 'SEASON FEST 2026',
  parentBrand: 'MEAT & GREET',
  edition: 'The Christmas Eve edition of MEAT & GREET',
  statement: 'A Christmas Eve gathering with bite.',
  descriptor: 'A Christmas Eve BBQ, music and culture experience.',
  /** ISO date (Africa/Lagos, WAT). Confirmed: deck p.12–13. */
  date: '2026-12-24',
  dateLong: 'Thursday 24 December 2026',
  dateShort: 'Thu 24 Dec 2026',
  dateCompact: '24.12.26',
  weekday: 'Thursday',
  timezone: 'Africa/Lagos',
  /** Awaiting confirmation — leave null until the producers publish times. */
  startTime: null as string | null, // e.g. '16:00'
  endTime: null as string | null, // e.g. '23:59'
  /** Awaiting confirmation. */
  ageRestriction: null as string | null,
  dressCode: null as string | null,
} as const;

export const VENUE = {
  name: 'Harrow Park',
  city: 'Abuja',
  region: 'FCT',
  country: 'NG',
  /**
   * Street address as listed in public Abuja directories (FineLib, Evendo,
   * WakaAbuja). Confirm with the venue/producers before print.
   */
  streetAddress: 'Off Ahmadu Bello Way, behind Abia House',
  district: 'Central Business District',
  /**
   * Map links resolve the venue by name — no coordinates are guessed.
   * Swap for an official pin (e.g. a maps.app.goo.gl share link) when one
   * is published by the venue or producers.
   */
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Harrow+Park%2C+Ahmadu+Bello+Way%2C+Abuja',
  mapsEmbedUrl: 'https://www.google.com/maps?q=Harrow+Park,+Ahmadu+Bello+Way,+Abuja&output=embed',
} as const;

export const venueOneLine = `${VENUE.name}, ${VENUE.city}`;
export const venueFullAddress = `${VENUE.name}, ${VENUE.streetAddress}, ${VENUE.district}, ${VENUE.city}`;

/* ------------------------------------------------------------------ */
/* 3. PRODUCERS, SOCIALS, CONTACT                                      */
/* ------------------------------------------------------------------ */

export interface SocialLink {
  label: string;
  handle: string;
  url: string;
  network: 'instagram' | 'x' | 'tiktok' | 'facebook' | 'youtube';
}

export const PRODUCERS = [
  {
    id: 'tcm',
    name: 'The Capital Movement',
    shortName: 'TCM',
    role: 'Co-producer',
    website: 'https://thecapitalmovement.com',
  },
  {
    id: 'clique',
    name: 'The Clique',
    shortName: 'The Clique',
    role: 'Co-producer',
    /** Awaiting confirmation. */
    website: null as string | null,
  },
] as const;

export const SOCIALS: SocialLink[] = [
  {
    label: 'MEAT & GREET on Instagram',
    handle: '@meatndgreet9ja',
    url: 'https://www.instagram.com/meatndgreet9ja/',
    network: 'instagram',
  },
  {
    label: 'The Capital Movement on Instagram',
    handle: '@thecapitalmovement',
    url: 'https://www.instagram.com/thecapitalmovement/',
    network: 'instagram',
  },
  {
    label: 'The Capital Movement on X',
    handle: '@thecapitalmvmt',
    url: 'https://x.com/thecapitalmvmt',
    network: 'x',
  },
  // Add The Clique's channels here once confirmed.
];

/** Primary channel for ticket and lineup announcements. */
export const ANNOUNCEMENT_CHANNEL = SOCIALS[0];

export const CONTACT = {
  /** Published on thecapitalmovement.com. Used for partnership enquiries. */
  email: 'contact@thecapitalmovement.com' as string | null,
  /** Awaiting confirmation. */
  phone: null as string | null,
};

/* ------------------------------------------------------------------ */
/* 4. LINEUP, SPONSORS, MEDIA PARTNERS (awaiting confirmation)         */
/* ------------------------------------------------------------------ */

export interface Artist {
  name: string;
  role?: 'Headliner' | 'Performer' | 'DJ' | 'Host';
  /** Path under src/assets or public. Optional. */
  image?: string;
}

/** Leave empty until artists are officially announced. */
export const LINEUP: Artist[] = [];

export interface Partner {
  name: string;
  /** Logo file in /public/partners/, e.g. '/partners/brand.svg'. */
  logo: string;
  url?: string;
  tier?: 'Headline sponsor' | 'Sponsor' | 'Media partner';
}

/** Leave empty until sponsorship is confirmed. Never add placeholder logos. */
export const SPONSORS: Partner[] = [];
export const MEDIA_PARTNERS: Partner[] = [];

/* ------------------------------------------------------------------ */
/* 5. THE EXPERIENCE (from deck p.2, p.5 and p.12)                     */
/* ------------------------------------------------------------------ */

export const GENRES = ['Afro-pop', 'Afrobeats', 'Hip-hop', 'Amapiano', 'Trap', 'Urban'];

/* ------------------------------------------------------------------ */
/* 6. FROM THE TIMELINE                                                */
/* ------------------------------------------------------------------ */

/**
 * Real public posts reproduced in the MEAT & GREET deck (p.6–9), posted by
 * guests after/around MEAT & GREET Abuja in March 2023. Words are verbatim;
 * emoji removed and handles omitted. Set SHOW_TIMELINE_QUOTES to false to
 * hide the strip.
 */
export const SHOW_TIMELINE_QUOTES = true;
export const TIMELINE_QUOTES = [
  'Where there is meat there is love, happiness and good vibe',
  "Last night's Meat and Greet was a blast! It was great to put faces to names and make meaningful connections.",
  'Omo this one go be madness',
  "The Meat & Greet was lit. I had fun. Let's do this again.",
  'Eat meat & listen to good music',
  'Joy of the city',
];
export const TIMELINE_SOURCE = 'Real posts from guests around MEAT & GREET Abuja, March 2023.';

/* ------------------------------------------------------------------ */
/* 7. FAQ — only questions we can answer truthfully today              */
/* ------------------------------------------------------------------ */

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ: FaqItem[] = [
  ticketsLive
    ? {
        q: 'Where do I buy tickets?',
        a: 'Tickets are available through the official link. Use any “Get your ticket” button on this page, and only buy from that link.',
      }
    : {
        q: 'When do tickets go on sale?',
        a: `The official ticket link will be announced on ${ANNOUNCEMENT_CHANNEL.handle} and The Capital Movement's channels. When it goes live, every “Get your ticket” button on this page will take you straight to it. Only buy from that official link.`,
      },
  {
    q: 'Who is performing?',
    a: LINEUP.length
      ? `The lineup includes ${LINEUP.map((a) => a.name).join(', ')}.`
      : `The lineup hasn't been announced yet. Follow ${ANNOUNCEMENT_CHANNEL.handle} so you hear it first.`,
  },
  {
    q: "What's on the menu?",
    a: 'Properly grilled BBQ is the centre of it all, with street food, wraps, sandwiches, drinks and more.',
  },
  {
    q: 'Is SEASON FEST the same as MEAT & GREET?',
    a: 'SEASON FEST is the Christmas Eve edition of MEAT & GREET, co-produced by The Capital Movement (TCM) and The Clique. Same fire, with a festive layer on top.',
  },
  {
    q: 'Where exactly is Harrow Park?',
    a: `Harrow Park is ${VENUE.streetAddress.toLowerCase()}, in Abuja's ${VENUE.district}. Open the map for directions.`,
  },
];

/* ------------------------------------------------------------------ */
/* 8. SEO                                                              */
/* ------------------------------------------------------------------ */

export const SEO = {
  title: 'SEASON FEST 2026 · MEAT & GREET Christmas Eve · Harrow Park, Abuja',
  description:
    'SEASON FEST is the Christmas Eve edition of MEAT & GREET: flame-grilled BBQ, music and Abuja’s people at Harrow Park on Thursday 24 December 2026. Produced by TCM × The Clique.',
  ogImage: '/og/season-fest-og.jpg',
  ogImageAlt: 'SEASON FEST — Christmas Eve, 24 December 2026, Harrow Park, Abuja',
  themeColor: '#0b0807',
  locale: 'en_NG',
};

/* ------------------------------------------------------------------ */
/* 9. CALENDAR                                                          */
/* ------------------------------------------------------------------ */

const ymd = EVENT.date.replaceAll('-', '');
const next = new Date(`${EVENT.date}T00:00:00Z`);
next.setUTCDate(next.getUTCDate() + 1);
const ymdNext = next.toISOString().slice(0, 10).replaceAll('-', '');

/** All-day calendar entry — accurate even before set times are announced. */
export const googleCalendarUrl =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  `&text=${encodeURIComponent(EVENT.fullName + ' — ' + EVENT.parentBrand + ' Christmas Eve')}` +
  `&dates=${ymd}/${ymdNext}` +
  `&details=${encodeURIComponent(EVENT.descriptor + ' Produced by TCM × The Clique.')}` +
  `&location=${encodeURIComponent(venueFullAddress)}`;

export const calendarDates = { start: ymd, end: ymdNext };
