import type { CategoryId, StoryCategoryId } from "./schema";

export const categories: Record<CategoryId, { label: string; short: string; blurb: string }> = {
  "nature-adventure": {
    label: "Nature & adventure",
    short: "Nature",
    blurb: "Highlands, waterfalls, rock formations, rainforest and national parks.",
  },
  "culture-heritage": {
    label: "Culture & heritage",
    short: "Heritage",
    blurb: "World Heritage landscapes, historic cities, museums and living traditions.",
  },
  "food-culinary": {
    label: "Food & culinary",
    short: "Food",
    blurb: "Regional kitchens, markets and the dishes that travel with Nigerians everywhere.",
  },
  "festivals-events": {
    label: "Festivals & events",
    short: "Festivals",
    blurb: "Durbars, carnivals, water festivals and sacred celebrations.",
  },
  "cities-urban": {
    label: "Cities & urban life",
    short: "Cities",
    blurb: "Lagos, Abuja, Kano, Benin City and the creative energy of urban Nigeria.",
  },
  "hospitality-relaxation": {
    label: "Hospitality & relaxation",
    short: "Relax",
    blurb: "Resorts, springs, beaches and lakes for slower days.",
  },
  family: {
    label: "Family travel",
    short: "Family",
    blurb: "Parks, wildlife, gentle walks and places that work for all ages.",
  },
  "business-investment": {
    label: "Business & investment",
    short: "Business",
    blurb: "Conference cities and destinations with development potential.",
  },
};

export const storyCategories: Record<StoryCategoryId, string> = {
  "destination-guides": "Destination guides",
  itineraries: "Travel itineraries",
  "culture-heritage": "Culture & heritage",
  "food-culinary": "Food & culinary travel",
  "festivals-events": "Festival & event guides",
  "responsible-tourism": "Responsible tourism",
  "hospitality-business": "Hospitality & travel business",
  "tourism-investment": "Tourism investment",
  "state-spotlights": "State spotlights",
};
