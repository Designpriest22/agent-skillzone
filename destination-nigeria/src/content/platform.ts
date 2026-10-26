import type { Offer, Opportunity, Partner, Source } from "./schema";

/**
 * Programme content drawn from the Destination Nigeria executive concept note.
 * Wording is kept close to the note; nothing here adds dates, venues,
 * institutions or figures the note does not contain.
 */

export const proposition = {
  theme: "Experience. Invest. Explore.",
  purpose:
    "Destination Nigeria is a proposed national tourism development, investment and destination-marketing platform that brings public institutions, states, businesses, communities and creative partners together to improve the visitor journey and strengthen Nigeria's tourism economy.",
  why: [
    "Nigeria has a rich range of landscapes, heritage, festivals, cuisine, creative industries and hospitality businesses. Converting that potential into sustained visits, jobs and investment requires more than promotion.",
    "It depends on coordinated destination management, accessible travel information, reliable visitor services, investment-ready products, skills, infrastructure, security coordination and evidence on what visitors experience.",
  ],
  honesty:
    "Safety and destination perception must be handled with honesty. The platform does not claim that every destination is risk-free. It helps visitors make informed choices, highlights verified experiences and shows how public agencies, operators and communities prepare for and respond to risks.",
};

/** The visitor journey the platform is designed to improve, in order. */
export const visitorJourney = [
  { id: "discovery", label: "Discovery" },
  { id: "planning", label: "Trip planning" },
  { id: "authorization", label: "Travel authorization" },
  { id: "arrival", label: "Arrival" },
  { id: "movement", label: "Movement" },
  { id: "accommodation", label: "Accommodation" },
  { id: "attractions", label: "Attractions" },
  { id: "events", label: "Events" },
  { id: "feedback", label: "Post-visit feedback" },
] as const;

export const objectives = [
  "Increase awareness of bookable domestic tourism experiences and responsible travel options.",
  "Strengthen coordination between federal and state institutions, industry and communities.",
  "Connect tourism opportunities with investors, travel buyers and development partners.",
  "Improve hospitality and visitor-service skills, standards and feedback practices.",
  "Showcase Nigeria's culture and creative economy as gateways to travel and investment.",
  "Agree measurable, mandate-aligned actions that can be reviewed over 12 months.",
];

export const inauguralOutcomes = [
  "A Destination Nigeria 12-month action agenda with named institutional owners.",
  "A curated national portfolio of visitor experiences and state investment opportunities.",
  "A campaign and media toolkit with verified information and image permissions.",
  "A set of industry commitments covering packages, training, access, safety readiness and visitor feedback.",
  "A first-year measurement report and recommendations for the next edition.",
];

/** Eight-week pre-event digital and media campaign, counting down to National Tourism Week. */
export const campaignWeeks = [
  { week: 8, activity: "Online national launch: concept, campaign film, web hub, countdown", leads: "Convener, public partners, media", evidence: "Approved key messages; campaign page" },
  { week: 7, activity: "Discover Nigeria: verified destinations and creator stories", leads: "States, operators, creators", evidence: "Location facts, permissions, booking details" },
  { week: 6, activity: "Schools and universities: talks, essay/creative challenge, virtual tours", leads: "Education institutions, tourism bodies", evidence: "Participation and learning outputs" },
  { week: 5, activity: "Travel offers: hotels, airlines and tour operators publish packages", leads: "Commercial partners", evidence: "Terms, dates, inventory, booking links" },
  { week: 4, activity: "Media and diaspora: interviews, explainers, diaspora conversations", leads: "Media, missions, diaspora groups", evidence: "Reach and audience questions" },
  { week: 3, activity: "Community tourism: locally led tours, clean-up or heritage activity", leads: "Communities, local authorities", evidence: "Consent, safety plan, local benefit record" },
  { week: 2, activity: "Tourism business and investment stories", leads: "Investors, states, associations", evidence: "Project summaries and follow-up contacts" },
  { week: 1, activity: "Countdown, press briefings, access information and programme reminders", leads: "Secretariat, media, host state", evidence: "Final schedule, transport and visitor guidance" },
];

/** Proposed programme areas for the seven-day National Tourism Week. */
export const ntwProgramme = [
  { title: "Destination showcases", text: "States and operators present verified experiences, with location facts, permissions and booking details." },
  { title: "Tourism business exhibition", text: "Hotels, airlines, tour operators and creative businesses meet travel buyers and the public." },
  { title: "State and regional participation", text: "Each zone brings its destinations, investment priorities and visitor-readiness plans." },
  { title: "Investment conversations", text: "Structured sessions connecting approved project summaries with investors and development partners." },
  { title: "Hospitality and visitor-service skills", text: "Training and standards work with hospitality providers and training institutions." },
  { title: "Cultural programming", text: "Performance, film, food, fashion and music as gateways to travel." },
  { title: "Industry commitments", text: "Published commitments on packages, training, access, safety readiness and visitor feedback." },
  { title: "Media and diaspora engagement", text: "Explainers, interviews and conversations with diaspora communities and the travel press." },
  { title: "Community tourism", text: "Locally led tours and heritage activity with consent, a safety plan and a record of local benefit." },
  { title: "12-month action agenda", text: "Agreed actions with named institutional owners, reviewed over the following year." },
];

/** Shown wherever programme logistics would appear. Update when confirmed. */
export const ntwStatus = {
  dates: null as string | null,
  venue: null as string | null,
  hostState: null as string | null,
  registrationUrl: null as string | null,
  speakers: [] as { name: string; role: string }[],
  participants: [] as { name: string; type: string }[],
  pressKitUrl: null as string | null,
};

export const investPathways = [
  { id: "investors", title: "Tourism investors", text: "Discover state priorities and approved project summaries, and request structured follow-up." },
  { id: "states", title: "State tourism authorities", text: "Showcase destinations, prepare investment-ready projects and join the national portfolio." },
  { id: "hospitality", title: "Hospitality operators", text: "List verified accommodation and experiences, and take part in standards and skills work." },
  { id: "transport", title: "Airlines & transport", text: "Connect routes and access improvements to destination campaigns and events." },
  { id: "buyers", title: "Tour operators & travel buyers", text: "Find verified products for packages and itineraries, domestic and international." },
  { id: "training", title: "Hospitality training providers", text: "Partner on visitor-service skills, standards and feedback practices." },
  { id: "development", title: "Development partners", text: "Align programmes with a shared action agenda and measurable outcomes." },
  { id: "creative", title: "Tourism & creative businesses", text: "Bring culture, film, food, fashion and music into the visitor offer." },
] as const;

export const opportunityCategories = [
  { id: "accommodation", label: "Accommodation & resorts" },
  { id: "attractions", label: "Attractions & visitor centres" },
  { id: "eco", label: "Eco-tourism & protected areas" },
  { id: "heritage", label: "Heritage & cultural venues" },
  { id: "mice", label: "Conferences, events & exhibitions" },
  { id: "access", label: "Transport & access" },
  { id: "skills", label: "Skills & training" },
  { id: "digital", label: "Digital & visitor information" },
];

export const opportunityStages: Record<Opportunity["stage"], string> = {
  concept: "Concept",
  feasibility: "Feasibility",
  "seeking-partners": "Seeking partners",
  "in-negotiation": "In negotiation",
};

/** Approved opportunities only. Empty until a state or agency approves publication. */
export const opportunities: Opportunity[] = [];

/** Downloadable investment information pack. Null until an approved document exists. */
export const investmentPack: Source | null = null;

/** Verified offers only (Section J). Empty until providers are verified. */
export const offers: Offer[] = [];

/** Confirmed partners only. Prospective partner types are shown separately. */
export const partners: Partner[] = [];

export const prospectivePartnerTypes = [
  { title: "Government bodies", text: "Federal ministries, departments and agencies with tourism, culture, transport, immigration and security mandates." },
  { title: "State tourism agencies", text: "State ministries and boards responsible for destinations, events and investment promotion." },
  { title: "Tourism businesses", text: "Hotels, resorts, tour operators, transport providers and attractions." },
  { title: "Communities", text: "Traditional institutions, community associations and site custodians." },
  { title: "Media & creators", text: "Broadcasters, publishers, film-makers and creators telling verified stories." },
  { title: "Education institutions", text: "Universities, schools and hospitality training providers." },
  { title: "Development partners", text: "Organisations supporting tourism, culture, skills and inclusive growth." },
];

/** Official social channels. Empty until confirmed by the platform owner. */
export const socialLinks: { label: string; url: string }[] = [];

/** Official contact details. Null until supplied. */
export const officialContact: { email?: string; phone?: string; address?: string } | null = null;
