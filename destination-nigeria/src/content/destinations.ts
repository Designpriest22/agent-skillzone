import type { Destination, Source } from "./schema";

/**
 * Initial destination portfolio.
 *
 * Every entry is a well-documented public place, written from reference sources
 * and marked `status: "reference"`. None has yet been reviewed by a state tourism
 * authority or site operator, so the site never presents opening hours, fees,
 * transport, safety or booking details as fact. Editors upgrade an entry to
 * `status: "verified"` (with `verifiedBy`) once an authority confirms it.
 */

const CHECKED = "2026-10-26";

/** Wikipedia search link: resolves to the article and never 404s if a title changes. */
const wiki = (title: string): Source => ({
  label: `Wikipedia: ${title}`,
  url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}`,
});

const unescoWhc = (id: number, name: string): Source => ({
  label: `UNESCO World Heritage Centre: ${name}`,
  url: `https://whc.unesco.org/en/list/${id}/`,
});

const unescoNigeria: Source = {
  label: "UNESCO World Heritage Centre: Nigeria (inscribed and Tentative List properties)",
  url: "https://whc.unesco.org/en/statesparties/ng/",
};

const ref = (...sources: Source[]) => ({ status: "reference" as const, lastChecked: CHECKED, sources });

const confirmLocally = { label: "Visiting arrangements", value: "Confirm access, opening times and any fees with the site operator or state tourism office before travelling." };

export const destinations: Destination[] = [
  // ——— South West ———
  {
    slug: "osun-osogbo-sacred-grove",
    name: "Osun-Osogbo Sacred Grove",
    state: "osun",
    locality: "Osogbo",
    categories: ["culture-heritage", "nature-adventure", "festivals-events"],
    summary:
      "A forest on the banks of the Osun River, sacred to the Yoruba deity Osun and inscribed as a UNESCO World Heritage Site in 2005.",
    intro: [
      "On the edge of Osogbo, a stretch of high forest follows the meandering Osun River. It is one of the last areas of primary high forest in southern Nigeria and a sacred place: the home of Osun, the Yoruba deity associated with water and fertility.",
      "Shrines, sanctuaries and sculpture fill the grove. Many of the works were created from the 1950s onward by the Austrian-born artist Susanne Wenger and the New Sacred Art movement, working with local artists and custodians. The grove is the setting for the annual Osun-Osogbo Festival.",
    ],
    highlights: [
      "UNESCO World Heritage Site (inscribed 2005)",
      "Sculpture and shrines of the New Sacred Art movement",
      "Riverside forest walks with local guides",
      "Annual Osun-Osogbo Festival",
    ],
    practical: [
      { label: "Designation", value: "UNESCO World Heritage Site, inscribed 2005." },
      { label: "Festival", value: "The Osun-Osogbo Festival is held each year. Confirm dates with the organisers or the Osun State tourism authority." },
      { label: "Respect", value: "This is an active sacred site. Follow your guide's instructions on photography and access to shrines." },
    ],
    plate: { scene: "grove", tod: "day", seed: 11 },
    featured: true,
    verification: ref(unescoWhc(1118, "Osun-Osogbo Sacred Grove"), wiki("Osun-Osogbo Sacred Grove")),
  },
  {
    slug: "olumo-rock",
    name: "Olumo Rock",
    state: "ogun",
    locality: "Abeokuta",
    categories: ["nature-adventure", "culture-heritage", "family"],
    summary: "A granite outcrop above Abeokuta that sheltered the Egba people in the nineteenth century, with wide views over the city.",
    intro: [
      "Olumo Rock rises from the centre of Abeokuta, the capital of Ogun State. In the nineteenth century its caves and crevices served as a refuge for the Egba people during a period of regional warfare, and the city grew up around it.",
      "Today the rock is one of the South West's best-known landmarks. Visitors climb through historic shelters and shrines to a summit with views across Abeokuta's rooftops and the Ogun River. The city is also a centre of adire, the indigo resist-dyed textile.",
    ],
    highlights: ["Summit views over Abeokuta", "Historic refuge caves and shrines", "Abeokuta's adire textile tradition nearby"],
    practical: [confirmLocally],
    plate: { scene: "inselberg", tod: "dusk", seed: 21 },
    featured: true,
    verification: ref(wiki("Olumo Rock")),
  },
  {
    slug: "erin-ijesha-waterfalls",
    name: "Erin-Ijesha Waterfalls",
    state: "osun",
    locality: "Erin-Ijesha",
    categories: ["nature-adventure", "family"],
    summary: "A tiered waterfall, also called Olumirin, falling through forested hills near Erin-Ijesha.",
    intro: [
      "Known locally as Olumirin, the Erin-Ijesha Waterfalls step down a forested hillside in a series of levels. The lower pool is reached easily; the upper levels involve a steeper climb on rough paths.",
      "The falls are among the most visited natural attractions in Osun State and pair naturally with a visit to Osogbo.",
    ],
    highlights: ["Multi-level waterfall", "Forest hiking to upper tiers", "Plunge pool at the base"],
    practical: [confirmLocally, { label: "Terrain", value: "Upper tiers involve steep, uneven and wet paths. Wear grippy footwear." }],
    plate: { scene: "waterfall", tod: "day", seed: 31 },
    featured: true,
    verification: ref(wiki("Erin-Ijesha Waterfalls")),
  },
  {
    slug: "idanre-hills",
    name: "Idanre Hills",
    state: "ondo",
    locality: "Oke-Idanre",
    categories: ["nature-adventure", "culture-heritage"],
    summary: "A highland settlement among granite hills, reached by a long stairway and listed on UNESCO's Tentative List.",
    intro: [
      "The old town of Oke-Idanre sits high among granite inselbergs in Ondo State. A long flight of steps climbs from the modern town to the hilltop settlement, which includes the old palace, shrines, burial grounds and traditional houses.",
      "The landscape's combination of dramatic geology and cultural history placed it on Nigeria's Tentative List for World Heritage status.",
    ],
    highlights: ["Stairway climb to the old hilltop town", "Granite inselberg scenery", "Palace and cultural sites of Oke-Idanre"],
    practical: [
      { label: "Designation", value: "On Nigeria's UNESCO World Heritage Tentative List." },
      { label: "Terrain", value: "The ascent is a long climb on steps. Allow time and carry water." },
    ],
    plate: { scene: "inselberg", tod: "dawn", seed: 41 },
    featured: true,
    verification: ref(unescoNigeria, wiki("Idanre Hill")),
  },
  {
    slug: "ikogosi-warm-springs",
    name: "Ikogosi Warm Springs",
    state: "ekiti",
    locality: "Ikogosi",
    categories: ["nature-adventure", "hospitality-relaxation", "family"],
    summary: "Where a warm spring and a cold spring meet in a wooded valley in Ekiti State.",
    intro: [
      "At Ikogosi, a warm spring and a cold spring emerge close together and flow into the same stream, a natural curiosity set in wooded hills.",
      "The site has been developed as a resort with accommodation and leisure facilities, making it a calm base for exploring Ekiti's hill country.",
    ],
    highlights: ["Confluence of warm and cold springs", "Wooded valley walks", "Resort setting"],
    practical: [confirmLocally],
    plate: { scene: "grove", tod: "dawn", seed: 51 },
    verification: ref(wiki("Ikogosi Warm Springs")),
  },
  {
    slug: "lekki-conservation-centre",
    name: "Lekki Conservation Centre",
    state: "lagos",
    locality: "Lekki, Lagos",
    categories: ["nature-adventure", "family", "cities-urban"],
    summary: "A protected wetland and forest reserve in Lagos run by the Nigerian Conservation Foundation, known for its canopy walkway.",
    intro: [
      "Minutes from the busy Lekki-Epe corridor, the Lekki Conservation Centre protects a patch of the coastal wetlands and forest that once covered the peninsula. Boardwalks cross swamp forest and savanna where monkeys, monitor lizards and birds are regularly seen.",
      "The centre's canopy walkway takes visitors high above the forest floor. It is operated by the Nigerian Conservation Foundation as an education and conservation site.",
    ],
    highlights: ["Canopy walkway above the forest", "Boardwalk nature trail", "Easy half-day trip within Lagos"],
    practical: [confirmLocally],
    plate: { scene: "rainforest", tod: "day", seed: 61 },
    featured: true,
    verification: ref(wiki("Lekki Conservation Centre")),
  },
  {
    slug: "badagry-heritage",
    name: "Badagry heritage trail",
    state: "lagos",
    locality: "Badagry",
    categories: ["culture-heritage"],
    summary: "A coastal town whose museums and historic sites tell the story of the Atlantic slave trade and early missionary history.",
    intro: [
      "Badagry, on the lagoon west of Lagos, was a port in the Atlantic slave trade. Sites associated with that history, including museums and the coastal route known as the Point of No Return, are now places of remembrance and learning.",
      "The town also holds sites linked to the arrival of Christian missionaries in the nineteenth century. Many visitors, including members of the African diaspora, come to Badagry for reflection rather than leisure.",
    ],
    highlights: ["Slave trade history museums and memorials", "The Point of No Return", "Lagoon and coastal landscape"],
    practical: [confirmLocally, { label: "Visiting with care", value: "These are sites of memory. Local guides provide historical context; follow their guidance on conduct and photography." }],
    plate: { scene: "coast", tod: "dawn", seed: 71 },
    verification: ref(wiki("Badagry")),
  },
  {
    slug: "freedom-park-lagos",
    name: "Freedom Park, Lagos Island",
    state: "lagos",
    locality: "Lagos Island",
    categories: ["cities-urban", "culture-heritage", "festivals-events"],
    summary: "A cultural park on the site of a colonial-era prison on Lagos Island, used for performances, exhibitions and festivals.",
    intro: [
      "Freedom Park was created on the site of the former Broad Street Prison, a colonial-era jail on Lagos Island. The design keeps traces of the prison's history while turning the space into a venue for theatre, music, exhibitions and public events.",
      "It is a useful starting point for exploring Lagos Island's older districts, galleries and the National Museum at Onikan.",
    ],
    highlights: ["Arts and live performance venue", "Colonial prison history", "Gateway to Lagos Island's heritage"],
    practical: [confirmLocally, { label: "Events", value: "Programmes change frequently. Check the venue's own listings for current events." }],
    plate: { scene: "city", tod: "night", seed: 81 },
    verification: ref(wiki("Freedom Park, Lagos")),
  },
  {
    slug: "lagos-food-and-creative-scene",
    name: "Lagos food, music and creative scene",
    state: "lagos",
    locality: "Lagos",
    categories: ["food-culinary", "cities-urban", "festivals-events", "business-investment"],
    summary: "West Africa's largest city and the engine of Nigeria's music, fashion, film and restaurant culture.",
    intro: [
      "Lagos is where much of Nigeria's creative economy is made and performed: music, film, fashion, visual art and design. Galleries, live music venues and restaurants cluster on the Island, Ikoyi, Victoria Island and Lekki, while the mainland has its own markets, street food and nightlife.",
      "For food, Lagos is a meeting point for the whole country: suya grilled over open flames, jollof rice, pepper soup, amala with ewedu and gbegiri, and regional dishes from every zone.",
    ],
    highlights: ["Restaurants and street food from every region", "Live music and nightlife", "Galleries, fashion and design studios"],
    practical: [{ label: "Planning", value: "Lagos traffic is heavy. Group activities by area and allow generous travel time between districts." }],
    plate: { scene: "city", tod: "dusk", seed: 91 },
    featured: true,
    verification: ref(wiki("Lagos")),
  },
  {
    slug: "ojude-oba-festival",
    name: "Ojude Oba festival",
    state: "ogun",
    locality: "Ijebu-Ode",
    categories: ["festivals-events", "culture-heritage"],
    summary: "A celebration in Ijebu-Ode where age-grade groups and horsemen in rich regalia pay homage to the Awujale.",
    intro: [
      "Ojude Oba, which means the king's forecourt, is held in Ijebu-Ode shortly after Eid al-Adha. Age-grade societies (regberegbe), families and horsemen parade in coordinated, elaborate dress to pay homage to the Awujale of Ijebuland.",
      "The festival has become one of the most photographed cultural events in the South West and a showcase for Nigerian textiles and fashion.",
    ],
    highlights: ["Age-grade processions in coordinated dress", "Horsemen and regalia", "Textile and fashion showcase"],
    practical: [{ label: "Dates", value: "Timing follows the Islamic calendar. Confirm the year's date with organisers or the Ogun State tourism authority." }],
    plate: { scene: "festival", tod: "day", seed: 101 },
    verification: ref(wiki("Ojude Oba festival")),
  },

  // ——— South South ———
  {
    slug: "obudu-mountain-resort",
    name: "Obudu Mountain Resort",
    state: "cross-river",
    locality: "Obanliku",
    categories: ["nature-adventure", "hospitality-relaxation", "family"],
    summary: "A highland resort on the Obudu Plateau near the Cameroon border, with a cooler climate, grassland ridges and forest valleys.",
    intro: [
      "Formerly known as the Obudu Cattle Ranch, the resort sits on the Obudu Plateau in the far north-east of Cross River State. The altitude brings a noticeably cooler climate, rolling grassland and mist that settles in the valleys.",
      "Walking trails lead to forest, streams and viewpoints. The resort has been one of Nigeria's best-known highland retreats for decades.",
    ],
    highlights: ["Cool highland climate on the Obudu Plateau", "Grassland ridges and forest valleys", "Walking trails and viewpoints"],
    practical: [confirmLocally, { label: "Getting there", value: "The resort is a long road journey from Calabar. Check current road and access conditions before travelling." }],
    plate: { scene: "highland", tod: "dawn", seed: 111 },
    featured: true,
    verification: ref(wiki("Obudu Mountain Resort")),
  },
  {
    slug: "calabar-carnival",
    name: "Calabar Carnival and Efik food culture",
    state: "cross-river",
    locality: "Calabar",
    categories: ["festivals-events", "food-culinary", "cities-urban"],
    summary: "A December street carnival in Calabar, a city also known for Efik cooking such as edikang ikong and afang soup.",
    intro: [
      "Each December, Calabar hosts a carnival of costumed bands, music and street parades as part of the state's festive season programme. It has become one of Nigeria's largest public celebrations.",
      "Calabar's Efik kitchen is a destination in its own right: vegetable-rich soups such as edikang ikong and afang, and seafood from the Cross River estuary.",
    ],
    highlights: ["Costumed carnival bands in December", "Efik cuisine", "Gateway to Cross River's parks and highlands"],
    practical: [{ label: "Dates", value: "The carnival takes place in December. Confirm the programme with the Cross River State organisers." }],
    plate: { scene: "festival", tod: "night", seed: 121 },
    featured: true,
    verification: ref(wiki("Calabar Carnival")),
  },
  {
    slug: "cross-river-national-park",
    name: "Cross River National Park",
    state: "cross-river",
    categories: ["nature-adventure"],
    summary: "Tropical rainforest in two divisions, Oban and Okwangwo, protecting some of Nigeria's richest biodiversity.",
    intro: [
      "Cross River National Park protects large areas of tropical rainforest in two separate divisions, Oban and Okwangwo, along the border with Cameroon.",
      "The forest is important for primates and birdlife. Visits are best arranged with experienced local operators and park authorities.",
    ],
    highlights: ["Tropical rainforest", "Primate and bird habitat", "Guided forest trekking"],
    practical: [{ label: "Access", value: "Visits require planning with park authorities and experienced guides." }],
    plate: { scene: "rainforest", tod: "dawn", seed: 131 },
    verification: ref(wiki("Cross River National Park")),
  },
  {
    slug: "benin-city-heritage",
    name: "Benin City heritage and bronze casting",
    state: "edo",
    locality: "Benin City",
    categories: ["culture-heritage", "cities-urban"],
    summary: "The historic seat of the Benin Kingdom, where the bronze casters' guild still works on Igun Street.",
    intro: [
      "Benin City was the capital of the Benin Kingdom, whose court artists produced the cast brass and bronze works known worldwide as the Benin Bronzes. The tradition continues on Igun Street, home to the guild of bronze casters.",
      "Remains of the city's ancient earthworks, the Benin moats (Iya), and the palace of the Oba are central to the city's history.",
    ],
    highlights: ["Bronze casters' workshops on Igun Street", "The Benin moats", "Palace and royal history"],
    practical: [{ label: "Respect", value: "Palace areas and ceremonies have protocols. Visit with a local guide and ask before photographing people or workshops." }],
    plate: { scene: "earthen", tod: "dusk", seed: 141 },
    verification: ref(wiki("Benin City"), wiki("Benin Bronzes")),
  },
  {
    slug: "ibeno-beach",
    name: "Ibeno Beach",
    state: "akwa-ibom",
    locality: "Ibeno",
    categories: ["hospitality-relaxation", "nature-adventure"],
    summary: "A long sandy Atlantic beach in Akwa Ibom State, near the mouth of the Qua Iboe River.",
    intro: [
      "Ibeno Beach stretches along Akwa Ibom's Atlantic coast near the mouth of the Qua Iboe River. It is a popular local escape for wide sand, ocean air and fresh seafood.",
      "Akwa Ibom's food culture, including afang and other vegetable soups, makes the state a rewarding stop for culinary travellers.",
    ],
    highlights: ["Long sandy Atlantic beach", "Seafood and Ibibio cuisine", "Coastal sunsets"],
    practical: [{ label: "Swimming", value: "Atlantic currents can be strong. Swim only where local guidance says it is safe." }],
    plate: { scene: "coast", tod: "dusk", seed: 151 },
    verification: ref(wiki("Ibeno")),
  },

  // ——— South East ———
  {
    slug: "ogbunike-caves",
    name: "Ogbunike Caves",
    state: "anambra",
    locality: "Ogbunike",
    categories: ["nature-adventure", "culture-heritage"],
    summary: "A sacred cave system in a forested valley, reached by a long stairway and listed on UNESCO's Tentative List.",
    intro: [
      "The Ogbunike Caves lie in a forested valley in Anambra State. A long stairway descends to a network of chambers and tunnels with streams running through them.",
      "The caves are regarded as sacred and are celebrated in an annual local festival. Visitors traditionally remove their shoes before entering.",
    ],
    highlights: ["Cave chambers and tunnels", "Forested valley setting", "Cultural and spiritual significance"],
    practical: [
      { label: "Designation", value: "On Nigeria's UNESCO World Heritage Tentative List." },
      { label: "Custom", value: "Visitors traditionally remove footwear inside the caves." },
    ],
    plate: { scene: "grove", tod: "dusk", seed: 161 },
    verification: ref(unescoNigeria, wiki("Ogbunike Caves")),
  },
  {
    slug: "ngwo-pine-forest",
    name: "Ngwo Pine Forest",
    state: "enugu",
    locality: "Ngwo",
    categories: ["nature-adventure", "family"],
    summary: "A pine plantation on the Enugu escarpment with a small waterfall and cave below.",
    intro: [
      "On the escarpment above Enugu, the Ngwo Pine Forest is a planted woodland of tall pines, unusual in this part of Nigeria. Paths lead down to a stream, a small waterfall and a cave.",
      "It is a short trip from Enugu city and combines well with the Awhum Waterfall further north.",
    ],
    highlights: ["Pine woodland on the escarpment", "Stream, small waterfall and cave", "Short trip from Enugu"],
    practical: [confirmLocally],
    plate: { scene: "highland", tod: "day", seed: 171 },
    verification: ref(wiki("Ngwo")),
  },
  {
    slug: "oguta-lake",
    name: "Oguta Lake",
    state: "imo",
    locality: "Oguta",
    categories: ["nature-adventure", "hospitality-relaxation"],
    summary: "Imo State's largest natural lake, where its waters meet the Urashi River.",
    intro: [
      "Oguta Lake is the largest natural lake in Imo State. At one end its clear waters meet the browner Urashi River, a visible confluence that local guides point out from the water.",
      "The lake is used for boating and leisure, and the surrounding town has a long history as a river trading port.",
    ],
    highlights: ["Boat trips on the lake", "Confluence with the Urashi River", "Lakeside leisure"],
    practical: [confirmLocally],
    plate: { scene: "lake", tod: "dusk", seed: 181 },
    verification: ref(wiki("Oguta Lake")),
  },

  // ——— North Central ———
  {
    slug: "zuma-rock",
    name: "Zuma Rock",
    state: "niger",
    locality: "near Madalla",
    categories: ["nature-adventure", "culture-heritage"],
    summary: "A vast granite monolith beside the Abuja–Kaduna road, among the most recognisable landmarks in Nigeria.",
    intro: [
      "Zuma Rock rises abruptly from the plain near Madalla in Niger State, just outside the Federal Capital Territory. Most travellers see it from the Abuja–Kaduna road, where its sheer, streaked faces dominate the horizon.",
      "The rock holds cultural significance for the Gbagyi (Gwari) people, and appears on the 100 naira note.",
    ],
    highlights: ["Iconic granite monolith", "Roadside viewpoints near Abuja", "Gbagyi cultural significance"],
    practical: [{ label: "Viewing", value: "Most visitors view the rock from the roadside area. Climbing is not a standard visitor activity." }],
    plate: { scene: "inselberg", tod: "day", seed: 191 },
    featured: true,
    verification: ref(wiki("Zuma Rock")),
  },
  {
    slug: "gurara-falls",
    name: "Gurara Falls",
    state: "niger",
    categories: ["nature-adventure"],
    summary: "A broad waterfall on the Gurara River, at its fullest during and after the rainy season.",
    intro: [
      "Gurara Falls spreads across a wide rock shelf on the Gurara River in Niger State. The volume of water changes sharply with the seasons, from a broad curtain in the rainy months to separate channels in the dry season.",
    ],
    highlights: ["Wide curtain waterfall", "Seasonal river landscape", "Rock shelf viewpoints"],
    practical: [confirmLocally, { label: "Season", value: "Water levels vary greatly by season." }],
    plate: { scene: "waterfall", tod: "dusk", seed: 201 },
    verification: ref(wiki("Gurara Falls")),
  },
  {
    slug: "abuja-capital-city",
    name: "Abuja, the capital",
    state: "fct",
    locality: "Abuja",
    categories: ["cities-urban", "business-investment", "family"],
    summary: "Nigeria's planned capital: granite hills, parks, lakes, landmark architecture and a growing conference economy.",
    intro: [
      "Abuja became Nigeria's capital in 1991. Planned from scratch, it is framed by granite hills, with Aso Rock rising behind the government district.",
      "Visitors come for conferences and government business, and stay for parks such as Millennium Park, Jabi Lake, landmark religious architecture and a growing restaurant and arts scene.",
    ],
    highlights: ["Millennium Park and Jabi Lake", "Aso Rock and the central district", "Conference and business travel"],
    practical: [confirmLocally],
    plate: { scene: "city", tod: "day", seed: 211 },
    verification: ref(wiki("Abuja")),
  },
  {
    slug: "jos-plateau",
    name: "Jos Plateau",
    state: "plateau",
    locality: "Jos",
    categories: ["nature-adventure", "culture-heritage"],
    summary: "A high plateau of boulder-strewn hills and a cooler climate, with the National Museum in Jos.",
    intro: [
      "The Jos Plateau rises well above the surrounding plains, giving the city of Jos a cooler climate than most of Nigeria. The landscape is famous for its piled granite boulders and rocky hills, including the Shere Hills.",
      "The National Museum in Jos holds important collections, including terracottas of the ancient Nok culture.",
    ],
    highlights: ["Granite boulder landscapes", "Cooler highland climate", "National Museum, Jos"],
    practical: [confirmLocally],
    plate: { scene: "boulders", tod: "dawn", seed: 221 },
    verification: ref(wiki("Jos Plateau")),
  },
  {
    slug: "kainji-lake-national-park",
    name: "Kainji Lake National Park",
    state: "niger",
    categories: ["nature-adventure"],
    summary: "Savanna woodland and a reservoir landscape in western Nigeria, across Niger and Kwara states.",
    intro: [
      "Kainji Lake National Park takes in savanna woodland beside the Kainji Reservoir on the Niger River. It spans parts of Niger and Kwara states and protects a range of savanna wildlife and birdlife.",
    ],
    highlights: ["Savanna woodland", "Reservoir and river landscape", "Birdlife"],
    practical: [{ label: "Access", value: "Arrange visits with park authorities and experienced local guides." }],
    plate: { scene: "savanna", tod: "dusk", seed: 231 },
    verification: ref(wiki("Kainji Lake National Park")),
  },
  {
    slug: "farin-ruwa-falls",
    name: "Farin Ruwa Falls",
    state: "nasarawa",
    categories: ["nature-adventure"],
    summary: "A tall cascade in the hills of Nasarawa State whose name means white water in Hausa.",
    intro: [
      "Farin Ruwa (white water) drops from a high escarpment in the hills of Nasarawa State, creating a long white ribbon of falling water, especially in the rainy season.",
    ],
    highlights: ["Tall escarpment waterfall", "Hill country of Nasarawa"],
    practical: [confirmLocally],
    plate: { scene: "waterfall", tod: "dawn", seed: 241 },
    verification: ref(wiki("Farin Ruwa Falls")),
  },

  // ——— North East ———
  {
    slug: "yankari-national-park",
    name: "Yankari National Park",
    state: "bauchi",
    categories: ["nature-adventure", "family", "hospitality-relaxation"],
    summary: "Savanna wildlife, including elephants, and the clear, warm water of the Wikki Warm Spring.",
    intro: [
      "Yankari is one of Nigeria's best-known wildlife areas: open savanna and woodland in Bauchi State that supports elephants, antelope, primates and many bird species.",
      "At its centre, the Wikki Warm Spring feeds a clear, warm pool that has long been a favourite with visitors.",
    ],
    highlights: ["Savanna wildlife viewing", "Wikki Warm Spring", "Birdlife"],
    practical: [{ label: "Access", value: "Arrange visits through park authorities and check current official travel advice for Bauchi State." }],
    plate: { scene: "savanna", tod: "dawn", seed: 251 },
    featured: true,
    verification: ref(wiki("Yankari National Park")),
  },
  {
    slug: "sukur-cultural-landscape",
    name: "Sukur Cultural Landscape",
    state: "adamawa",
    locality: "Madagali",
    categories: ["culture-heritage", "nature-adventure"],
    summary: "A hilltop settlement of terraced fields, stone walls and the chief's palace, inscribed as a World Heritage Site in 1999.",
    intro: [
      "High in the Mandara Mountains, Sukur is a cultural landscape of terraced fields, dry-stone walls, sacred sites and the palace of the Hidi, the traditional ruler. It was Africa's first cultural landscape to be inscribed on the World Heritage List.",
      "Access is remote and depends on current security conditions. Read official travel advice before considering a visit.",
    ],
    highlights: ["UNESCO World Heritage Site (inscribed 1999)", "Terraced agricultural landscape", "Hidi's palace and stone architecture"],
    practical: [
      { label: "Designation", value: "UNESCO World Heritage Site, inscribed 1999." },
      { label: "Access", value: "Remote. Several governments currently advise against travel to parts of Adamawa State. Read current official advice first." },
    ],
    plate: { scene: "terraces", tod: "dusk", seed: 261 },
    verification: ref(unescoWhc(938, "Sukur Cultural Landscape"), wiki("Sukur Cultural Landscape")),
  },
  {
    slug: "gashaka-gumti-national-park",
    name: "Gashaka-Gumti National Park",
    state: "taraba",
    categories: ["nature-adventure"],
    summary: "Nigeria's largest national park, rising to Chappal Waddi, the country's highest peak, on the Cameroon border.",
    intro: [
      "Gashaka-Gumti spans montane grassland, forest and savanna across Taraba and Adamawa states, up to the Cameroon border. It includes Chappal Waddi, Nigeria's highest mountain.",
      "The park is important for chimpanzees and other primates, and is on Nigeria's Tentative List for World Heritage status.",
    ],
    highlights: ["Nigeria's largest national park", "Chappal Waddi, the highest peak", "Chimpanzee habitat"],
    practical: [
      { label: "Designation", value: "On Nigeria's UNESCO World Heritage Tentative List." },
      { label: "Access", value: "Remote, and subject to current official travel advice for Taraba State." },
    ],
    plate: { scene: "highland", tod: "dusk", seed: 271 },
    verification: ref({ label: "UNESCO Tentative List: Gashaka-Gumti National Park", url: "https://whc.unesco.org/en/tentativelists/6918/" }, wiki("Gashaka Gumti National Park")),
  },
  {
    slug: "mambilla-plateau",
    name: "Mambilla Plateau",
    state: "taraba",
    categories: ["nature-adventure", "hospitality-relaxation"],
    summary: "A high, cool plateau of rolling grassland and tea plantations in southern Taraba State.",
    intro: [
      "The Mambilla Plateau lifts southern Taraba State into a temperate climate unusual for Nigeria. Its rolling grassland supports cattle herding and tea cultivation.",
    ],
    highlights: ["Temperate highland climate", "Tea plantations", "Rolling grassland scenery"],
    practical: [{ label: "Access", value: "Remote, and subject to current official travel advice for Taraba State." }],
    plate: { scene: "highland", tod: "day", seed: 281 },
    verification: ref(wiki("Mambilla Plateau")),
  },

  // ——— North West ———
  {
    slug: "kano-old-city",
    name: "Kano old city and dye pits",
    state: "kano",
    locality: "Kano",
    categories: ["culture-heritage", "cities-urban", "food-culinary"],
    summary: "Earthen architecture, the Kofar Mata indigo dye pits and the markets of one of West Africa's oldest trading cities.",
    intro: [
      "Kano was a major terminus of trans-Saharan trade for centuries. Its old city holds remains of the ancient city walls, the Emir's palace and earthen buildings, some decorated with relief patterns.",
      "At Kofar Mata, dyers still work in pits of indigo, a craft that has been practised in Kano for centuries. Kurmi Market and the city's food stalls, from suya to fura da nono, complete the picture.",
    ],
    highlights: ["Kofar Mata indigo dye pits", "Old city walls and earthen architecture", "Kurmi Market"],
    practical: [{ label: "Before you go", value: "Read current official travel advice for Kano State before planning a visit." }],
    plate: { scene: "dyepits", tod: "day", seed: 291 },
    featured: true,
    verification: ref(wiki("Kofar Mata Dye Pit"), wiki("Kano")),
  },
  {
    slug: "kano-durbar",
    name: "Sallah Durbar",
    state: "kano",
    locality: "Kano",
    categories: ["festivals-events", "culture-heritage"],
    summary: "Mounted processions of horsemen in ceremonial dress, held in northern cities at the Eid festivals.",
    intro: [
      "Durbar festivals are held in several northern cities, including Kano, Katsina and Zaria, to mark the Eid celebrations (Sallah). Horsemen in ceremonial robes and decorated harnesses ride in procession to salute the Emir.",
      "The tradition is linked to the historic cavalry of the northern emirates.",
    ],
    highlights: ["Horsemen in ceremonial dress", "Procession to salute the Emir", "Drumming and praise singing"],
    practical: [{ label: "Dates", value: "Durbars follow the Islamic calendar. Confirm the programme with emirate and state authorities, and read current official travel advice." }],
    plate: { scene: "earthen", tod: "day", seed: 301 },
    verification: ref(wiki("Durbar festival")),
  },
  {
    slug: "argungu-fishing-festival",
    name: "Argungu fishing festival",
    state: "kebbi",
    locality: "Argungu",
    categories: ["festivals-events", "culture-heritage"],
    summary: "A historic fishing and cultural festival on the Matan Fada River, on UNESCO's intangible cultural heritage list since 2016.",
    intro: [
      "The Argungu International Fishing and Cultural Festival takes place by the Matan Fada River in Kebbi State. Its climax is a mass fishing competition, alongside canoe racing, wild duck catching, wrestling and music.",
      "UNESCO inscribed the festival on the Representative List of the Intangible Cultural Heritage of Humanity in 2016. It has not been held every year; check whether an edition is scheduled.",
    ],
    highlights: ["Mass hand-fishing competition", "Canoe racing and water sports", "UNESCO intangible cultural heritage (2016)"],
    practical: [{ label: "Dates", value: "Editions have usually fallen between late February and March, but the festival is not held every year. Confirm with Kebbi State authorities." }],
    plate: { scene: "lake", tod: "day", seed: 311 },
    verification: ref(
      { label: "UNESCO Intangible Cultural Heritage: Argungu festival", url: "https://ich.unesco.org/en/RL/argungu-international-fishing-and-cultural-festival-00901" },
    ),
  },
];

export const destinationBySlug = new Map(destinations.map((d) => [d.slug, d]));

export function getDestination(slug: string): Destination | undefined {
  return destinationBySlug.get(slug);
}

export function destinationsInState(stateSlug: string): Destination[] {
  return destinations.filter((d) => d.state === stateSlug);
}
