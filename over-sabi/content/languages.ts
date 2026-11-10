/**
 * Language registry seed. This is the starting catalogue; after seeding, statuses are
 * managed in /admin/languages. Status fields are deliberately conservative:
 *
 * - catalogue_status "beta" means a learner can start a course whose content is still an
 *   editorial draft awaiting native-speaker review. Nothing is "available" until reviewed.
 * - stt_status / tts_status are "untested" for every language: no speech provider has been
 *   evaluated against real recordings in these languages yet (see LANGUAGE_QUALITY.md).
 * - ISO codes are included only where we are confident of them; unknown ones are null.
 */
export interface LanguageSeed {
  code: string;
  name: string;
  native_name: string;
  iso_639_1: string | null;
  iso_639_3: string | null;
  family: string;
  countries: string[];
  region_group: "nigeria" | "west" | "east_central" | "southern" | "north" | "sign";
  writing_systems: string[];
  modality?: "spoken" | "signed";
  orthography_notes?: string;
  dialect_notes?: string;
  register_notes?: string;
  catalogue_status: "roadmap" | "in_development" | "beta" | "available";
  content_status?: "none" | "draft" | "in_review" | "verified";
  tutor_status?: "unavailable" | "experimental" | "validated";
  speech_notes?: string;
  supported_levels?: string[];
  human_reviewer_status?: "none" | "recruiting" | "active";
  limitations?: string;
  is_explanation_language?: boolean;
}

const SPEECH_RESEARCH_YO =
  "Desk research (Oct 2026): Google Cloud Chirp 3 lists Yoruba (yo-NG) as Preview. OpenAI Whisper-family transcription lists Yoruba. ElevenLabs Scribe language pages did not cover Yoruba in our search. Nigerian vendors (e.g. Spitch) advertise Yoruba STT/TTS. None tested by Over Sabi yet.";
const SPEECH_RESEARCH_IG =
  "Desk research (Oct 2026): ElevenLabs Scribe lists Igbo, with a published FLEURS word error rate of 43.4% for Scribe v1 — too high for reliable feedback. We did not find Igbo in Whisper's published list. Nigerian vendors (e.g. Spitch) advertise Igbo STT/TTS. None tested by Over Sabi yet.";
const SPEECH_RESEARCH_HA =
  "Desk research (Oct 2026): ElevenLabs Scribe lists Hausa (published FLEURS WER figures conflict between pages). OpenAI Whisper-family transcription lists Hausa. Nigerian vendors (e.g. Spitch) advertise Hausa STT/TTS. None tested by Over Sabi yet.";

const roadmap = (
  code: string,
  name: string,
  native_name: string,
  iso1: string | null,
  iso3: string | null,
  family: string,
  countries: string[],
  region_group: LanguageSeed["region_group"],
  writing_systems: string[] = ["Latin"],
  extra: Partial<LanguageSeed> = {},
): LanguageSeed => ({
  code,
  name,
  native_name,
  iso_639_1: iso1,
  iso_639_3: iso3,
  family,
  countries,
  region_group,
  writing_systems,
  catalogue_status: "roadmap",
  limitations:
    "No learning content yet. Listed so learners can register interest; content needs native-speaker contributors.",
  ...extra,
});

export const LANGUAGES: LanguageSeed[] = [
  // ---- Launch languages -------------------------------------------------------
  {
    code: "yo",
    name: "Yoruba",
    native_name: "Yorùbá",
    iso_639_1: "yo",
    iso_639_3: "yor",
    family: "Niger-Congo › Volta-Niger › Yoruboid",
    countries: ["Nigeria", "Benin", "Togo"],
    region_group: "nigeria",
    writing_systems: ["Latin"],
    orthography_notes:
      "Three tones: acute = high (á), grave = low (à), unmarked = mid. Under-dot letters ẹ (open e), ọ (open o), ṣ (“sh”). Tone marks change meaning and are always written in Over Sabi teaching content.",
    dialect_notes:
      "Standard Yoruba is taught. Regional varieties include Ọ̀yọ́, Ìjẹ̀ṣà, Èkìtì, Ẹ̀gbá, Ìjẹ̀bú and others.",
    register_notes:
      "Respect is grammatical: Ẹ/ẹ̀yin and yín are used for elders and groups; o/ìwọ and rẹ for peers and juniors.",
    catalogue_status: "beta",
    content_status: "draft",
    tutor_status: "experimental",
    speech_notes: SPEECH_RESEARCH_YO,
    supported_levels: ["Starter"],
    human_reviewer_status: "recruiting",
    limitations:
      "Starter content is an editorial draft awaiting native-speaker review. No native-speaker audio yet. AI tutor replies in Yoruba are experimental and may contain tone-mark or grammar errors.",
  },
  {
    code: "ig",
    name: "Igbo",
    native_name: "Igbo",
    iso_639_1: "ig",
    iso_639_3: "ibo",
    family: "Niger-Congo › Volta-Niger › Igboid",
    countries: ["Nigeria", "Equatorial Guinea"],
    region_group: "nigeria",
    writing_systems: ["Latin"],
    orthography_notes:
      "Ọnwụ orthography with dotted vowels ị, ọ, ụ and ṅ (velar nasal). Igbo is tonal; tone is usually unmarked in everyday writing but can be marked in teaching material.",
    dialect_notes:
      "Standard Igbo (Igbo Izugbe) is taught. Dialects such as Owerri, Onitsha, Nsukka and Afikpo differ noticeably.",
    register_notes: "Elders are addressed with respectful terms and titles; greetings vary by community.",
    catalogue_status: "beta",
    content_status: "draft",
    tutor_status: "experimental",
    speech_notes: SPEECH_RESEARCH_IG,
    supported_levels: ["Starter"],
    human_reviewer_status: "recruiting",
    limitations:
      "Starter content is an editorial draft awaiting native-speaker review. No native-speaker audio yet. AI tutor replies in Igbo are experimental.",
  },
  {
    code: "ha",
    name: "Hausa",
    native_name: "Hausa",
    iso_639_1: "ha",
    iso_639_3: "hau",
    family: "Afro-Asiatic › Chadic",
    countries: ["Nigeria", "Niger", "Ghana", "Cameroon", "Chad", "Benin"],
    region_group: "nigeria",
    writing_systems: ["Latin (Boko)", "Arabic (Ajami)"],
    orthography_notes:
      "Hooked letters ɓ, ɗ, ƙ and glottalised 'y are separate letters. Tone and vowel length are not marked in everyday writing.",
    dialect_notes:
      "Standard Hausa is based largely on Kano. Sokoto, Katsina and Zaria varieties differ in pronunciation and some words.",
    register_notes:
      "Second-person forms mark gender (-ka to a man, -ki to a woman). Ranka/Ranki ya daɗe is a respectful address.",
    catalogue_status: "beta",
    content_status: "draft",
    tutor_status: "experimental",
    speech_notes: SPEECH_RESEARCH_HA,
    supported_levels: ["Starter"],
    human_reviewer_status: "recruiting",
    limitations:
      "Starter content is an editorial draft awaiting native-speaker review. Ajami script is not yet taught. No native-speaker audio yet.",
  },
  {
    code: "pcm",
    name: "Nigerian Pidgin",
    native_name: "Naijá",
    iso_639_1: null,
    iso_639_3: "pcm",
    family: "English-lexified creole",
    countries: ["Nigeria"],
    region_group: "nigeria",
    writing_systems: ["Latin"],
    orthography_notes:
      "No single standard spelling is universally used; Over Sabi will document the spelling convention it adopts.",
    catalogue_status: "in_development",
    tutor_status: "unavailable",
    speech_notes:
      "Not yet evaluated. English speech models must not be assumed to transcribe Pidgin reliably.",
    human_reviewer_status: "recruiting",
    limitations:
      "Course in development. Pidgin is available as an explanation language for tutor feedback (experimental).",
    is_explanation_language: true,
  },
  {
    code: "en",
    name: "English (Nigerian English explanations)",
    native_name: "English",
    iso_639_1: "en",
    iso_639_3: "eng",
    family: "Indo-European › Germanic",
    countries: ["Nigeria", "Ghana", "Kenya", "South Africa", "Worldwide"],
    region_group: "nigeria",
    writing_systems: ["Latin"],
    catalogue_status: "roadmap",
    limitations: "Used as the explanation language for courses; not offered as a course.",
    is_explanation_language: true,
  },
  {
    code: "nsi",
    name: "Nigerian Sign Language",
    native_name: "Nigerian Sign Language",
    iso_639_1: null,
    iso_639_3: "nsi",
    family: "Sign language",
    countries: ["Nigeria"],
    region_group: "sign",
    writing_systems: [],
    modality: "signed",
    catalogue_status: "roadmap",
    limitations:
      "A separate accessibility initiative. It is a signed language, so it needs video content created with Deaf signers — not speech tools. Research phase only.",
  },
  // ---- More Nigerian languages ----------------------------------------------
  roadmap(
    "bin",
    "Edo (Bini)",
    "Ẹ̀dó",
    null,
    "bin",
    "Niger-Congo › Volta-Niger › Edoid",
    ["Nigeria"],
    "nigeria",
  ),
  roadmap(
    "efi",
    "Efik",
    "Efik",
    null,
    "efi",
    "Niger-Congo › Cross River",
    ["Nigeria", "Cameroon"],
    "nigeria",
  ),
  roadmap("ibb", "Ibibio", "Ibibio", null, "ibb", "Niger-Congo › Cross River", ["Nigeria"], "nigeria"),
  roadmap("tiv", "Tiv", "Tiv", null, "tiv", "Niger-Congo › Bantoid", ["Nigeria", "Cameroon"], "nigeria"),
  roadmap(
    "ff",
    "Fulfulde",
    "Fulfulde",
    "ff",
    "ful",
    "Niger-Congo › Atlantic",
    ["Nigeria", "Cameroon", "Niger", "Guinea", "Senegal", "Mali"],
    "nigeria",
    ["Latin", "Arabic (Ajami)"],
  ),
  roadmap(
    "kr",
    "Kanuri",
    "Kanuri",
    "kr",
    "kau",
    "Nilo-Saharan › Saharan",
    ["Nigeria", "Niger", "Chad", "Cameroon"],
    "nigeria",
    ["Latin", "Arabic (Ajami)"],
  ),
  roadmap("nup", "Nupe", "Nupe", null, "nup", "Niger-Congo › Volta-Niger › Nupoid", ["Nigeria"], "nigeria"),
  roadmap("ijc", "Izon (Ijaw)", "Izon", null, "ijc", "Niger-Congo › Ijoid", ["Nigeria"], "nigeria"),
  roadmap(
    "urh",
    "Urhobo",
    "Urhobo",
    null,
    "urh",
    "Niger-Congo › Volta-Niger › Edoid",
    ["Nigeria"],
    "nigeria",
  ),
  roadmap("iso", "Isoko", "Isoko", null, "iso", "Niger-Congo › Volta-Niger › Edoid", ["Nigeria"], "nigeria"),
  roadmap(
    "its",
    "Itsekiri",
    "Itsekiri",
    null,
    "its",
    "Niger-Congo › Volta-Niger › Yoruboid",
    ["Nigeria"],
    "nigeria",
  ),
  roadmap(
    "igl",
    "Igala",
    "Igala",
    null,
    "igl",
    "Niger-Congo › Volta-Niger › Yoruboid",
    ["Nigeria"],
    "nigeria",
  ),
  roadmap(
    "gbr",
    "Gbagyi (Gwari)",
    "Gbagyi",
    null,
    "gbr",
    "Niger-Congo › Volta-Niger › Nupoid",
    ["Nigeria"],
    "nigeria",
  ),
  roadmap(
    "idu",
    "Idoma",
    "Idoma",
    null,
    "idu",
    "Niger-Congo › Volta-Niger › Idomoid",
    ["Nigeria"],
    "nigeria",
  ),
  roadmap("igb", "Ebira", "Ebira", null, "igb", "Niger-Congo › Volta-Niger › Nupoid", ["Nigeria"], "nigeria"),
  roadmap("anw", "Annang", "Annang", null, "anw", "Niger-Congo › Cross River", ["Nigeria"], "nigeria"),
  roadmap(
    "jukun",
    "Jukun",
    "Jukun",
    null,
    null,
    "Niger-Congo › Jukunoid",
    ["Nigeria", "Cameroon"],
    "nigeria",
    ["Latin"],
    {
      dialect_notes:
        "Jukun is a cluster of related varieties; the target variety must be chosen with community partners.",
    },
  ),
  // ---- West Africa -----------------------------------------------------------
  roadmap("ak", "Twi (Akan)", "Twi", "ak", "aka", "Niger-Congo › Kwa", ["Ghana", "Côte d'Ivoire"], "west"),
  roadmap("ee", "Ewe", "Eʋegbe", "ee", "ewe", "Niger-Congo › Kwa", ["Ghana", "Togo"], "west"),
  roadmap("gaa", "Ga", "Gã", null, "gaa", "Niger-Congo › Kwa", ["Ghana"], "west"),
  roadmap(
    "wo",
    "Wolof",
    "Wolof",
    "wo",
    "wol",
    "Niger-Congo › Atlantic",
    ["Senegal", "The Gambia", "Mauritania"],
    "west",
  ),
  roadmap("bm", "Bambara", "Bamanankan", "bm", "bam", "Niger-Congo › Mande", ["Mali"], "west", [
    "Latin",
    "N'Ko",
  ]),
  roadmap(
    "fuc",
    "Pulaar",
    "Pulaar",
    null,
    "fuc",
    "Niger-Congo › Atlantic",
    ["Senegal", "Mauritania", "The Gambia", "Guinea"],
    "west",
  ),
  roadmap("kri", "Krio", "Krio", null, "kri", "English-lexified creole", ["Sierra Leone"], "west"),
  roadmap("men", "Mende", "Mɛnde", null, "men", "Niger-Congo › Mande", ["Sierra Leone", "Liberia"], "west"),
  roadmap("mos", "Mooré", "Mooré", null, "mos", "Niger-Congo › Gur", ["Burkina Faso"], "west"),
  // ---- East and Central Africa ----------------------------------------------
  roadmap(
    "sw",
    "Swahili",
    "Kiswahili",
    "sw",
    "swa",
    "Niger-Congo › Bantu",
    ["Tanzania", "Kenya", "Uganda", "DR Congo", "Rwanda", "Burundi", "Mozambique"],
    "east_central",
  ),
  roadmap("am", "Amharic", "አማርኛ", "am", "amh", "Afro-Asiatic › Semitic", ["Ethiopia"], "east_central", [
    "Ge'ez (Ethiopic)",
  ]),
  roadmap(
    "om",
    "Oromo",
    "Afaan Oromoo",
    "om",
    "orm",
    "Afro-Asiatic › Cushitic",
    ["Ethiopia", "Kenya"],
    "east_central",
  ),
  roadmap(
    "so",
    "Somali",
    "Soomaali",
    "so",
    "som",
    "Afro-Asiatic › Cushitic",
    ["Somalia", "Ethiopia", "Djibouti", "Kenya"],
    "east_central",
  ),
  roadmap(
    "ti",
    "Tigrinya",
    "ትግርኛ",
    "ti",
    "tir",
    "Afro-Asiatic › Semitic",
    ["Eritrea", "Ethiopia"],
    "east_central",
    ["Ge'ez (Ethiopic)"],
  ),
  roadmap(
    "rw",
    "Kinyarwanda",
    "Ikinyarwanda",
    "rw",
    "kin",
    "Niger-Congo › Bantu",
    ["Rwanda"],
    "east_central",
  ),
  roadmap("rn", "Kirundi", "Ikirundi", "rn", "run", "Niger-Congo › Bantu", ["Burundi"], "east_central"),
  roadmap("lg", "Luganda", "Oluganda", "lg", "lug", "Niger-Congo › Bantu", ["Uganda"], "east_central"),
  roadmap(
    "ln",
    "Lingala",
    "Lingála",
    "ln",
    "lin",
    "Niger-Congo › Bantu",
    ["DR Congo", "Republic of the Congo"],
    "east_central",
  ),
  roadmap("ki", "Kikuyu (Gĩkũyũ)", "Gĩkũyũ", "ki", "kik", "Niger-Congo › Bantu", ["Kenya"], "east_central"),
  roadmap(
    "ny",
    "Chichewa",
    "Chicheŵa",
    "ny",
    "nya",
    "Niger-Congo › Bantu",
    ["Malawi", "Zambia", "Mozambique"],
    "east_central",
  ),
  roadmap(
    "x-mulenge",
    "Kinyamulenge",
    "Kinyamulenge",
    null,
    null,
    "Niger-Congo › Bantu",
    ["DR Congo"],
    "east_central",
    ["Latin"],
    {
      limitations: "Roadmap only; depends on finding verified resources and community partners.",
    },
  ),
  // ---- Southern Africa -------------------------------------------------------
  roadmap(
    "zu",
    "isiZulu",
    "isiZulu",
    "zu",
    "zul",
    "Niger-Congo › Bantu",
    ["South Africa", "Eswatini", "Lesotho"],
    "southern",
  ),
  roadmap("xh", "isiXhosa", "isiXhosa", "xh", "xho", "Niger-Congo › Bantu", ["South Africa"], "southern"),
  roadmap(
    "sn",
    "Shona",
    "chiShona",
    "sn",
    "sna",
    "Niger-Congo › Bantu",
    ["Zimbabwe", "Mozambique"],
    "southern",
  ),
  roadmap(
    "st",
    "Sesotho",
    "Sesotho",
    "st",
    "sot",
    "Niger-Congo › Bantu",
    ["Lesotho", "South Africa"],
    "southern",
  ),
  roadmap(
    "tn",
    "Setswana",
    "Setswana",
    "tn",
    "tsn",
    "Niger-Congo › Bantu",
    ["Botswana", "South Africa"],
    "southern",
  ),
  roadmap(
    "af",
    "Afrikaans",
    "Afrikaans",
    "af",
    "afr",
    "Indo-European › Germanic",
    ["South Africa", "Namibia"],
    "southern",
  ),
  roadmap("nso", "Sepedi", "Sepedi", null, "nso", "Niger-Congo › Bantu", ["South Africa"], "southern"),
  roadmap(
    "ts",
    "Xitsonga",
    "Xitsonga",
    "ts",
    "tso",
    "Niger-Congo › Bantu",
    ["South Africa", "Mozambique"],
    "southern",
  ),
  roadmap(
    "ve",
    "Tshivenda",
    "Tshivenḓa",
    "ve",
    "ven",
    "Niger-Congo › Bantu",
    ["South Africa", "Zimbabwe"],
    "southern",
  ),
  roadmap(
    "ss",
    "siSwati",
    "siSwati",
    "ss",
    "ssw",
    "Niger-Congo › Bantu",
    ["Eswatini", "South Africa"],
    "southern",
  ),
  roadmap(
    "nd",
    "isiNdebele",
    "isiNdebele",
    "nd",
    "nde",
    "Niger-Congo › Bantu",
    ["Zimbabwe"],
    "southern",
    ["Latin"],
    {
      dialect_notes:
        "Northern Ndebele (Zimbabwe, nd) and Southern Ndebele (South Africa, nr) are distinct; the target must be chosen explicitly.",
    },
  ),
  // ---- North Africa and beyond ----------------------------------------------
  roadmap(
    "zgh",
    "Tamazight",
    "ⵜⴰⵎⴰⵣⵉⵖⵜ",
    null,
    "zgh",
    "Afro-Asiatic › Berber",
    ["Morocco", "Algeria", "Libya", "Niger", "Mali"],
    "north",
    ["Tifinagh", "Latin", "Arabic"],
    {
      dialect_notes:
        "Tamazight is a family of varieties (e.g. Tachelhit, Central Atlas, Kabyle, Tamasheq). Standard Moroccan Tamazight (zgh) is listed as a placeholder.",
    },
  ),
  roadmap(
    "mg",
    "Malagasy",
    "Malagasy",
    "mg",
    "mlg",
    "Austronesian › Malayo-Polynesian",
    ["Madagascar"],
    "north",
  ),
];
