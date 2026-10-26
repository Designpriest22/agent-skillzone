import type { CategoryId, Plate } from "./schema";

export type Experience = {
  slug: string;
  name: string;
  /** Short line used on cards. */
  line: string;
  intro: string[];
  /** Destination categories that feed this experience page. */
  categories: CategoryId[];
  plate: Plate;
  /** Questions this page answers, used as on-page guidance and for search intent. */
  planningNotes: string[];
};

export const experiences: Experience[] = [
  {
    slug: "nature-and-adventure",
    name: "Nature & adventure",
    line: "Granite domes, highland mist, waterfalls and the savanna at first light.",
    intro: [
      "Nigeria's landscapes run from Atlantic mangroves and rainforest in the south, through the central plateau's granite country, to the savanna and Sahel of the north. Highlands at Obudu, Mambilla and Jos bring cooler air; inselbergs such as Zuma, Olumo and Idanre rise straight out of the plains.",
      "Many natural sites are best visited with local guides who know the paths, seasons and customs. Rainy-season months make waterfalls dramatic and some roads harder.",
    ],
    categories: ["nature-adventure"],
    plate: { scene: "highland", tod: "dawn", seed: 1001 },
    planningNotes: [
      "Rainy season (roughly April to October in the south, shorter in the north) swells waterfalls but can affect road access.",
      "Hire local guides for hikes, caves and parks, and confirm access with park authorities.",
      "Check current official travel advice for each state before you plan.",
    ],
  },
  {
    slug: "arts-culture-and-heritage",
    name: "Arts, culture & heritage",
    line: "Sacred groves, bronze casters, earthen cities and the galleries of Lagos.",
    intro: [
      "Nigeria holds two UNESCO World Heritage Sites, Sukur and the Osun-Osogbo Sacred Grove, and a much larger living heritage: the bronze-casting guild of Benin City, Kano's dye pits, Abeokuta's adire, and a contemporary art scene led from Lagos.",
      "Heritage here is rarely behind glass. Many sites are sacred or ceremonial, so visiting with a knowledgeable guide is both more rewarding and more respectful.",
    ],
    categories: ["culture-heritage"],
    plate: { scene: "earthen", tod: "dusk", seed: 1002 },
    planningNotes: [
      "Ask before photographing people, shrines or ceremonies.",
      "Many heritage sites are managed by communities or traditional institutions; local protocols apply.",
    ],
  },
  {
    slug: "food-and-culinary-travel",
    name: "Food & culinary travel",
    line: "Suya smoke, pepper soup, Efik greens and a nation's argument about jollof.",
    intro: [
      "Every region has its own kitchen. In the north: suya, tuwo with miyan kuka, kilishi and fura da nono. In the South West: amala, ewedu, gbegiri and ofada rice. In the South East and South South: ofe onugbu, oha soup, afang, edikang ikong, banga and fresh seafood.",
      "Markets are the best introduction to a city's food. Go with someone local, eat where it is busy and freshly cooked, and drink bottled or treated water.",
    ],
    categories: ["food-culinary"],
    plate: { scene: "table", tod: "day", seed: 1003 },
    planningNotes: [
      "Drink bottled or treated water and choose freshly cooked food.",
      "Spice levels are often high; ask for less pepper if you prefer.",
    ],
  },
  {
    slug: "festivals-and-live-entertainment",
    name: "Festivals & live entertainment",
    line: "Durbar horsemen, carnival bands, river festivals and Lagos after dark.",
    intro: [
      "Nigeria's calendar is full of festivals, from the Osun-Osogbo Festival and Ojude Oba to the Sallah durbars of the north and the Calabar Carnival in December. Lagos adds a year-round programme of concerts, club nights and the December festive season.",
      "Many festivals follow lunar, religious or traditional calendars, so dates move from year to year. Confirm with organisers before you book travel.",
    ],
    categories: ["festivals-events"],
    plate: { scene: "festival", tod: "night", seed: 1004 },
    planningNotes: [
      "Festival dates often follow lunar or traditional calendars. Confirm each year.",
      "Crowds are large at major events; agree a meeting point and keep valuables secure.",
    ],
  },
  {
    slug: "hospitality-and-leisure",
    name: "Hospitality & leisure",
    line: "Highland resorts, warm springs, lakes and long Atlantic beaches.",
    intro: [
      "For slower travel, Nigeria's resorts and leisure destinations include the Obudu Plateau, Ikogosi Warm Springs, Oguta Lake and Atlantic beaches from Lagos to Akwa Ibom.",
      "Verified accommodation and packages will be listed in the offers directory as providers are confirmed.",
    ],
    categories: ["hospitality-relaxation"],
    plate: { scene: "coast", tod: "dusk", seed: 1005 },
    planningNotes: [
      "Book accommodation directly with providers or established platforms and confirm terms in writing.",
      "Atlantic beaches can have strong currents; follow local swimming guidance.",
    ],
  },
  {
    slug: "community-led-tourism",
    name: "Community-led tourism",
    line: "Locally guided walks, crafts and hosts who keep the benefit at home.",
    intro: [
      "The best experiences are often hosted by the communities that live with a place: guides who know the forest paths, custodians of sacred sites, artisans who teach their craft.",
      "Destination Nigeria aims to make community-led tourism easier to find and fairer to deliver, with clear consent, safety planning and a record of local benefit, as set out in the National Tourism Week community programme.",
    ],
    categories: ["culture-heritage", "nature-adventure"],
    plate: { scene: "terraces", tod: "day", seed: 1006 },
    planningNotes: [
      "Pay guides and hosts fairly and directly where possible.",
      "Ask what is appropriate to photograph and share.",
      "Communities and operators can register interest to be listed once verified.",
    ],
  },
];

export const experienceBySlug = new Map(experiences.map((e) => [e.slug, e]));
