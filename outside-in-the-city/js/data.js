/* ============================================================================
   OUTSIDE IN THE CITY — Campaign data model
   ----------------------------------------------------------------------------
   Single source of truth for the brand + all five graphics. Copy from the brief
   is reproduced verbatim. Everything else is grounded in the real map of Abuja
   (Maitama, Wuse 2, Asokoro, Jabi, the Central Area and its landmarks) rather
   than generic filler. The weekly list uses the district as an honest,
   verifiable place-name; specific venues stay flagged `placeholder:true` until
   a real, verified name/photograph/description is supplied.
   ========================================================================== */

const OIC_PALETTE = {
  black:   '#080808',
  charcoal:'#171717',
  ivory:   '#F3EFE5',
  gold:    '#C6A46A',
  bronze:  '#8D7048',
  night:   '#0C0D11',
  line:    'rgba(243,239,229,0.14)',
  dim:     'rgba(243,239,229,0.62)'
};

const OIC_BRAND = {
  name: 'OUTSIDE IN THE CITY',
  wordTop: 'OUTSIDE',
  wordBottom: 'IN THE CITY',
  category: 'ABUJA LIFESTYLE & ENTERTAINMENT CONCIERGE',
  endorsementLead: 'BACKED BY',
  endorsement: 'THE CAPITAL MOVEMENT',
  philosophy: 'We don’t just know where the city is going. We know how to get you there.'
};

const OIC_DEFAULT = {
  g01: {
    headline: 'THE CITY HAS A NEW INSIDER.',
    body: 'Abuja is full of experiences. The places, the people, the parties and everything in between. We’re here to make sure you experience the city differently.',
    image: null, imageFocus: 50
  },
  g02: {
    headline: 'ABUJA,\nACCORDING TO US.',
    body: 'The places worth discovering. The experiences worth having. The people worth knowing.',
    /* the city as the brand’s territory — real districts */
    cells: [
      { area: 'MAITAMA',      line: 'Fine dining, quietly',   motif: 'church',  image: null, imageFocus: 50 },
      { area: 'WUSE 2',       line: 'The nights out',          motif: 'tower',   image: null, imageFocus: 50 },
      { area: 'ASOKORO',      line: 'Under Aso Rock',          motif: 'asorock', image: null, imageFocus: 50 },
      { area: 'JABI',         line: 'On the lake',             motif: 'lake',    image: null, imageFocus: 50 },
      { area: 'CENTRAL AREA', line: 'The landmarks',           motif: 'mosque',  image: null, imageFocus: 50 }
    ]
  },
  g03: {
    headline: 'NOT EVERYONE\nKNOWS WHERE\nTO GO.',
    secondary: 'That’s where we come in.',
    body: 'From the right dinner reservation to the city’s biggest nights, from where you stay to how you spend your time. We’ve got the city covered.',
    image: null, imageFocus: 50
  },
  g04: {
    headline: 'THE OUTSIDE LIST',
    subheading: '5 PLACES TO EXPERIENCE ABUJA THIS WEEKEND.',
    /* ----- Editable weekly list. District = honest place; venue stays pending. ----- */
    destinations: [
      { category: 'RESTAURANT', name: 'Maitama',      note: 'The table worth dressing for — fine dining in the embassy quarter.', motif: 'church',  image: null, imageFocus: 50, placeholder: true },
      { category: 'LOUNGE',     name: 'Asokoro',      note: 'Low light and a long view, in the calm end of the city.',            motif: 'asorock', image: null, imageFocus: 50, placeholder: true },
      { category: 'NIGHTLIFE',  name: 'Wuse 2',       note: 'Where the city goes after midnight.',                                motif: 'tower',   image: null, imageFocus: 50, placeholder: true },
      { category: 'CULTURE',    name: 'Central Area', note: 'A show, a session, a moment under the landmarks.',                    motif: 'mosque',  image: null, imageFocus: 50, placeholder: true },
      { category: 'LIFESTYLE',  name: 'Jabi',         note: 'Lakeside, slower, and better for it.',                               motif: 'lake',    image: null, imageFocus: 50, placeholder: true }
    ]
  },
  g05: {
    headline: 'YOUR CITY.\nYOUR WAY.\nOUR CONNECTIONS.',
    body: 'Where you stay. Where you dine. Where you go out. How you get there. One point of contact. Countless ways to experience the city.',
    services: [
      { icon: 'stay',          title: 'ACCOMMODATION',       note: 'Where you stay' },
      { icon: 'transport',     title: 'TRANSPORTATION',      note: 'How you move' },
      { icon: 'dining',        title: 'DINING',              note: 'Where you dine' },
      { icon: 'entertainment', title: 'ENTERTAINMENT',       note: 'Where you go out' },
      { icon: 'vip',           title: 'VIP ACCESS',          note: 'Past the velvet rope' },
      { icon: 'private',       title: 'PRIVATE EXPERIENCES', note: 'Made only for you' }
    ],
    cta: 'LET US MAKE THE CONNECTION.'
  },

  /* ----- Flyers (each renders as Instagram post 1080x1350 + Story 1080x1920) ----- */
  flyers: {
    launch: {
      eyebrow: 'NOW TAKING BOOKINGS',
      headline: 'ABUJA,\nWE’RE OUTSIDE.',
      sub: 'Your lifestyle & entertainment concierge for the city — the places, the people, the nights, handled.',
      cta: 'BOOKINGS NOW OPEN',
      handle: '@ADD YOUR HANDLE'
    },
    services: {
      eyebrow: 'THE SERVICE',
      headline: 'YOUR CITY,\nHANDLED.',
      sub: 'One point of contact. Countless ways to experience Abuja.',
      services: [
        { icon: 'stay',          title: 'ACCOMMODATION' },
        { icon: 'transport',     title: 'TRANSPORTATION' },
        { icon: 'dining',        title: 'DINING' },
        { icon: 'entertainment', title: 'ENTERTAINMENT' },
        { icon: 'vip',           title: 'VIP ACCESS' },
        { icon: 'private',       title: 'PRIVATE EXPERIENCES' }
      ],
      cta: 'LET US MAKE THE CONNECTION.',
      handle: '@ADD YOUR HANDLE'
    },
    event: {
      eyebrow: 'OUTSIDE PRESENTS',
      occasion: 'OCCASION NAME',
      date: 'FRIDAY · 00 MONTH',
      time: '10 PM TILL LATE',
      venue: 'VENUE · MAITAMA',
      dress: 'DRESS: ELEVATED',
      rsvp: 'RSVP @ADD YOUR HANDLE',
      placeholder: true
    }
  }
};

const OIC_DATA = (typeof structuredClone === 'function')
  ? structuredClone(OIC_DEFAULT) : JSON.parse(JSON.stringify(OIC_DEFAULT));

function oicResetData() {
  const fresh = (typeof structuredClone === 'function')
    ? structuredClone(OIC_DEFAULT) : JSON.parse(JSON.stringify(OIC_DEFAULT));
  Object.keys(OIC_DATA).forEach(k => delete OIC_DATA[k]);
  Object.keys(fresh).forEach(k => { OIC_DATA[k] = fresh[k]; });
  return OIC_DATA;
}

if (typeof window !== 'undefined') {
  Object.assign(window, { OIC_PALETTE, OIC_BRAND, OIC_DEFAULT, OIC_DATA, oicResetData });
}
