import type { State, ZoneId } from "./schema";

export const zones: Record<ZoneId, { name: string; short: string }> = {
  "north-central": { name: "North Central", short: "NC" },
  "north-east": { name: "North East", short: "NE" },
  "north-west": { name: "North West", short: "NW" },
  "south-east": { name: "South East", short: "SE" },
  "south-south": { name: "South South", short: "SS" },
  "south-west": { name: "South West", short: "SW" },
};

/**
 * The 36 states and the Federal Capital Territory, grouped by geopolitical zone.
 * `svgId` matches the outline id in geo/nigeria-states.json (the source dataset
 * spells Nasarawa as "nassarawa").
 */
export const states: State[] = [
  { slug: "abia", name: "Abia", capital: "Umuahia", zone: "south-east", svgId: "abia" },
  { slug: "adamawa", name: "Adamawa", capital: "Yola", zone: "north-east", svgId: "adamawa",
    summary: "Mountain country on the Cameroon border, home to the Sukur Cultural Landscape, one of Nigeria's two World Heritage Sites." },
  { slug: "akwa-ibom", name: "Akwa Ibom", capital: "Uyo", zone: "south-south", svgId: "akwa-ibom",
    summary: "An Atlantic state of long beaches and a celebrated Ibibio and Annang food culture." },
  { slug: "anambra", name: "Anambra", capital: "Awka", zone: "south-east", svgId: "anambra",
    summary: "A commercial heartland of the South East, with the cave system and forest of Ogbunike." },
  { slug: "bauchi", name: "Bauchi", capital: "Bauchi", zone: "north-east", svgId: "bauchi",
    summary: "Savanna state best known to travellers for Yankari National Park and the Wikki Warm Spring." },
  { slug: "bayelsa", name: "Bayelsa", capital: "Yenagoa", zone: "south-south", svgId: "bayelsa" },
  { slug: "benue", name: "Benue", capital: "Makurdi", zone: "north-central", svgId: "benue" },
  { slug: "borno", name: "Borno", capital: "Maiduguri", zone: "north-east", svgId: "borno" },
  { slug: "cross-river", name: "Cross River", capital: "Calabar", zone: "south-south", svgId: "cross-river",
    summary: "From the Obudu Plateau to the rainforest of Cross River National Park and the December carnival in Calabar." },
  { slug: "delta", name: "Delta", capital: "Asaba", zone: "south-south", svgId: "delta" },
  { slug: "ebonyi", name: "Ebonyi", capital: "Abakaliki", zone: "south-east", svgId: "ebonyi" },
  { slug: "edo", name: "Edo", capital: "Benin City", zone: "south-south", svgId: "edo",
    summary: "The historic seat of the Benin Kingdom and its world-renowned bronze-casting tradition." },
  { slug: "ekiti", name: "Ekiti", capital: "Ado-Ekiti", zone: "south-west", svgId: "ekiti",
    summary: "Hill country of the South West, where warm and cold springs meet at Ikogosi." },
  { slug: "enugu", name: "Enugu", capital: "Enugu", zone: "south-east", svgId: "enugu",
    summary: "Escarpment landscapes, the pine forest at Ngwo and the waterfall at Awhum." },
  { slug: "fct", name: "Federal Capital Territory", capital: "Abuja", zone: "north-central", svgId: "fct",
    summary: "Nigeria's planned capital, framed by granite hills, with parks, lakes and a growing conference economy." },
  { slug: "gombe", name: "Gombe", capital: "Gombe", zone: "north-east", svgId: "gombe" },
  { slug: "imo", name: "Imo", capital: "Owerri", zone: "south-east", svgId: "imo",
    summary: "Lakeland and hospitality, centred on Oguta Lake and the city of Owerri." },
  { slug: "jigawa", name: "Jigawa", capital: "Dutse", zone: "north-west", svgId: "jigawa" },
  { slug: "kaduna", name: "Kaduna", capital: "Kaduna", zone: "north-west", svgId: "kaduna" },
  { slug: "kano", name: "Kano", capital: "Kano", zone: "north-west", svgId: "kano",
    summary: "One of West Africa's oldest trading cities: earthen architecture, indigo dye pits, markets and Sallah durbars." },
  { slug: "katsina", name: "Katsina", capital: "Katsina", zone: "north-west", svgId: "katsina" },
  { slug: "kebbi", name: "Kebbi", capital: "Birnin Kebbi", zone: "north-west", svgId: "kebbi",
    summary: "River country of the North West and home of the Argungu fishing festival." },
  { slug: "kogi", name: "Kogi", capital: "Lokoja", zone: "north-central", svgId: "kogi" },
  { slug: "kwara", name: "Kwara", capital: "Ilorin", zone: "north-central", svgId: "kwara" },
  { slug: "lagos", name: "Lagos", capital: "Ikeja", zone: "south-west", svgId: "lagos",
    summary: "Nigeria's commercial capital and creative engine: lagoon city, galleries, food, music and Atlantic heritage at Badagry." },
  { slug: "nasarawa", name: "Nasarawa", capital: "Lafia", zone: "north-central", svgId: "nassarawa",
    summary: "Rolling hills east of Abuja and the tall cascade of Farin Ruwa." },
  { slug: "niger", name: "Niger", capital: "Minna", zone: "north-central", svgId: "niger",
    summary: "Nigeria's largest state by area, home to Zuma Rock, Gurara Falls and part of Kainji Lake National Park." },
  { slug: "ogun", name: "Ogun", capital: "Abeokuta", zone: "south-west", svgId: "ogun",
    summary: "Abeokuta's Olumo Rock, adire textile traditions and the Ojude Oba festival in Ijebu-Ode." },
  { slug: "ondo", name: "Ondo", capital: "Akure", zone: "south-west", svgId: "ondo",
    summary: "The Idanre Hills, a highland settlement on UNESCO's Tentative List." },
  { slug: "osun", name: "Osun", capital: "Osogbo", zone: "south-west", svgId: "osun",
    summary: "The Osun-Osogbo Sacred Grove World Heritage Site and the waterfalls of Erin-Ijesha." },
  { slug: "oyo", name: "Oyo", capital: "Ibadan", zone: "south-west", svgId: "oyo" },
  { slug: "plateau", name: "Plateau", capital: "Jos", zone: "north-central", svgId: "plateau",
    summary: "High plateau country of rock formations and a cooler climate around Jos." },
  { slug: "rivers", name: "Rivers", capital: "Port Harcourt", zone: "south-south", svgId: "rivers" },
  { slug: "sokoto", name: "Sokoto", capital: "Sokoto", zone: "north-west", svgId: "sokoto" },
  { slug: "taraba", name: "Taraba", capital: "Jalingo", zone: "north-east", svgId: "taraba",
    summary: "Gashaka-Gumti National Park, Chappal Waddi and the tea-growing Mambilla Plateau." },
  { slug: "yobe", name: "Yobe", capital: "Damaturu", zone: "north-east", svgId: "yobe" },
  { slug: "zamfara", name: "Zamfara", capital: "Gusau", zone: "north-west", svgId: "zamfara" },
];

export const stateBySlug = new Map(states.map((s) => [s.slug, s]));
export const stateBySvgId = new Map(states.map((s) => [s.svgId, s]));

export function getState(slug: string): State | undefined {
  return stateBySlug.get(slug);
}
