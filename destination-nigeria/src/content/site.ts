export const site = {
  name: "Destination Nigeria",
  tagline: "Experience. Invest. Explore.",
  title: "Destination Nigeria | Experience. Invest. Explore.",
  description:
    "Discover Nigeria's destinations, culture, landscapes and travel experiences. Explore tourism opportunities, plan your journey and connect with Nigeria's growing tourism ecosystem.",
  locale: "en_NG",
  lang: "en-NG",
};

/** Absolute site origin. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export const primaryNav = [
  { href: "/discover", label: "Discover Nigeria" },
  { href: "/destinations", label: "Destinations" },
  { href: "/experiences", label: "Experiences" },
  { href: "/plan", label: "Plan Your Trip" },
  { href: "/invest", label: "Invest in Tourism" },
  { href: "/national-tourism-week", label: "National Tourism Week" },
  { href: "/about", label: "About" },
] as const;

export const footerNav = {
  explore: [
    { href: "/destinations", label: "All destinations" },
    { href: "/states", label: "States of Nigeria" },
    { href: "/experiences", label: "Experiences" },
    { href: "/stories", label: "Stories from Nigeria" },
    { href: "/offers", label: "Offers & bookings" },
  ],
  plan: [
    { href: "/plan", label: "Plan your trip" },
    { href: "/plan#itinerary", label: "Itinerary builder" },
    { href: "/plan#before-you-go", label: "Entry, health & advice" },
    { href: "/search", label: "Search" },
  ],
  work: [
    { href: "/invest", label: "Invest in tourism" },
    { href: "/invest#enquiry", label: "Investment enquiries" },
    { href: "/partners", label: "Partnerships" },
    { href: "/partners#enquiry", label: "Partnership enquiries" },
    { href: "/national-tourism-week", label: "National Tourism Week" },
    { href: "/media", label: "Media & press" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy policy" },
    { href: "/cookies", label: "Cookies & storage" },
    { href: "/accessibility", label: "Accessibility" },
    { href: "/terms", label: "Terms of use" },
  ],
};
