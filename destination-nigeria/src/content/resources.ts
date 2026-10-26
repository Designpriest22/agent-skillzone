/**
 * Authoritative travel resources. Requirements change: each entry records when
 * it was last checked, and the site always links to the source rather than
 * restating rules as fact. Re-check every entry at least monthly.
 */

export type Resource = {
  id: string;
  topic: "entry" | "health" | "advice" | "accessibility";
  title: string;
  publisher: string;
  url: string;
  note: string;
  lastChecked: string;
};

export const RESOURCES_LAST_CHECKED = "2026-10-26";

export const resources: Resource[] = [
  {
    id: "nis-evisa",
    topic: "entry",
    title: "Nigeria e-Visa applications",
    publisher: "Nigeria Immigration Service",
    url: "https://evisa.immigration.gov.ng",
    note: "Official portal for short-visit e-Visa applications. Visa rules depend on nationality and purpose of travel.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "nis",
    topic: "entry",
    title: "Nigeria Immigration Service",
    publisher: "Nigeria Immigration Service",
    url: "https://immigration.gov.ng",
    note: "Official immigration information, including passports, visas and residence.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "travelhealthpro",
    topic: "health",
    title: "Nigeria: vaccinations and health risks",
    publisher: "TravelHealthPro (UK NaTHNaC)",
    url: "https://travelhealthpro.org.uk/country/165/nigeria",
    note: "Vaccination and health guidance, including yellow fever certificate requirements. Speak to a travel health professional before you go.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "ncdc",
    topic: "health",
    title: "Nigeria Centre for Disease Control and Prevention",
    publisher: "NCDC",
    url: "https://ncdc.gov.ng",
    note: "National public health updates and outbreak information.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "us-state",
    topic: "advice",
    title: "Nigeria travel advisory",
    publisher: "U.S. Department of State",
    url: "https://travel.state.gov/en/international-travel/travel-advisories/nigeria.html",
    note: "State-by-state advisory levels for U.S. citizens.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "uk-fcdo",
    topic: "advice",
    title: "Foreign travel advice: Nigeria",
    publisher: "UK Foreign, Commonwealth & Development Office",
    url: "https://www.gov.uk/foreign-travel-advice/nigeria",
    note: "Safety, entry requirements and regional advice for British nationals.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "au-smartraveller",
    topic: "advice",
    title: "Nigeria travel advice",
    publisher: "Australian Government Smartraveller",
    url: "https://www.smartraveller.gov.au/destinations/africa/nigeria",
    note: "Regional advice levels for Australian travellers.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
  {
    id: "ca-travel",
    topic: "advice",
    title: "Travel advice and advisories for Nigeria",
    publisher: "Government of Canada",
    url: "https://travel.gc.ca/destinations/nigeria",
    note: "Regional risk levels for Canadian travellers.",
    lastChecked: RESOURCES_LAST_CHECKED,
  },
];

export const advisorySummary =
  "Several governments advise against all or non-essential travel to parts of Nigeria, and advice differs by state and changes often. Read current official advice for every state on your route before you plan or book, and check it again before you travel.";
