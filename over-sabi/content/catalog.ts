/** Tutors, achievements, plans and feature flags seeded into the database. */

export interface TutorSeed {
  id: string;
  name: string;
  language_code: string;
  persona: "patient" | "vibe" | "precision" | "culture" | "business" | "heritage";
  tagline: string;
  bio: string;
  teaching_approach: string;
  correction_style: string;
  default_speed: number;
  levels: string[];
  specialties: string[];
  avatar_key: string;
  voice: Record<string, string>;
}

/**
 * Original AI tutor personas. They are fictional, AI-generated characters — not
 * portraits or voices of real people — and every surface that shows them says so.
 */
export const TUTORS: TutorSeed[] = [
  {
    id: "kemi",
    name: "Kẹ́mi",
    language_code: "yo",
    persona: "patient",
    tagline: "Slow and steady. No question is too small.",
    bio: "Kẹ́mi explains every new word twice, celebrates small wins and never rushes you. Built for complete beginners.",
    teaching_approach: "Short sentences, lots of English support, one new idea at a time.",
    correction_style: "Gentle: recasts your sentence correctly and explains only the most important fix.",
    default_speed: 0.85,
    levels: ["beginner", "few_words"],
    specialties: ["Greetings", "Family", "Everyday phrases"],
    avatar_key: "kemi",
    voice: {},
  },
  {
    id: "tunde",
    name: "Túndé",
    language_code: "yo",
    persona: "culture",
    tagline: "The why behind the words.",
    bio: "Túndé loves the context: why you greet an elder differently, where an expression comes from, and what people really mean.",
    teaching_approach: "Conversation built around real situations — visiting family, ceremonies, the market.",
    correction_style: "Balanced: corrects register and respect forms first.",
    default_speed: 1,
    levels: ["few_words", "understand_more", "simple_conversations"],
    specialties: ["Etiquette", "Respect forms", "Celebrations"],
    avatar_key: "tunde",
    voice: {},
  },
  {
    id: "chiamaka",
    name: "Chiamaka",
    language_code: "ig",
    persona: "heritage",
    tagline: "For when Igbo is your family's language and you want it back.",
    bio: "Chiamaka is for learners who grew up hearing Igbo but never spoke it. She builds on what you already understand.",
    teaching_approach: "Starts from phrases you've heard at home and turns listening into speaking.",
    correction_style: "Encouraging: focuses on getting you talking, then polishes.",
    default_speed: 0.95,
    levels: ["beginner", "few_words", "understand_more"],
    specialties: ["Family conversations", "Phone calls home", "Greetings"],
    avatar_key: "chiamaka",
    voice: {},
  },
  {
    id: "obinna",
    name: "Obinna",
    language_code: "ig",
    persona: "vibe",
    tagline: "Easy-going chat, like talking to a friend.",
    bio: "Obinna keeps things casual and fun. Expect informal Igbo, jokes and plenty of back-and-forth.",
    teaching_approach: "Free conversation about your day, music, food and plans.",
    correction_style: "Light: only flags errors that change the meaning.",
    default_speed: 1.05,
    levels: ["few_words", "understand_more", "simple_conversations", "fluency"],
    specialties: ["Social life", "Informal speech", "Food"],
    avatar_key: "obinna",
    voice: {},
  },
  {
    id: "hauwa",
    name: "Hauwa",
    language_code: "ha",
    persona: "precision",
    tagline: "Get the details right.",
    bio: "Hauwa pays attention to grammar, gender agreement and spelling — including ɓ, ɗ and ƙ.",
    teaching_approach: "Structured practice with clear explanations of every pattern.",
    correction_style: "Thorough: points out each error with a short explanation.",
    default_speed: 0.95,
    levels: ["beginner", "few_words", "understand_more", "simple_conversations"],
    specialties: ["Grammar", "Spelling", "Greetings"],
    avatar_key: "hauwa",
    voice: {},
  },
  {
    id: "musa",
    name: "Musa",
    language_code: "ha",
    persona: "business",
    tagline: "Hausa for the market, the office and the deal.",
    bio: "Musa practises the Hausa you need for trade and work: greetings that build trust, prices, negotiation and polite requests.",
    teaching_approach: "Role-play of real professional and market situations.",
    correction_style: "Balanced: prioritises politeness and clarity.",
    default_speed: 1,
    levels: ["few_words", "understand_more", "simple_conversations", "fluency"],
    specialties: ["Markets", "Bargaining", "Work"],
    avatar_key: "musa",
    voice: {},
  },
];

export const ACHIEVEMENTS = [
  { code: "first_lesson", name: "First step", description: "Finished your first lesson.", icon: "step" },
  {
    code: "first_conversation",
    name: "First words out loud",
    description: "Finished your first tutor conversation.",
    icon: "wave",
  },
  {
    code: "streak_3",
    name: "Three days running",
    description: "Practised three days in a row.",
    icon: "flame",
  },
  { code: "streak_7", name: "A full week", description: "Practised seven days in a row.", icon: "flame" },
  {
    code: "words_25",
    name: "Twenty-five words",
    description: "Have 25 words and phrases in your notebook.",
    icon: "book",
  },
  {
    code: "greetings_complete",
    name: "Well greeted",
    description: "Completed a greetings chapter.",
    icon: "hands",
  },
  { code: "review_10", name: "It's sticking", description: "Completed 10 revision cards.", icon: "repeat" },
  {
    code: "contributor",
    name: "Language keeper",
    description: "Had a contribution accepted by reviewers.",
    icon: "seed",
  },
];

/** Plan limits are enforced server-side. Prices are configured per provider in /admin/plans. */
export const PLANS = [
  {
    code: "free",
    name: "Free",
    description: "Start speaking today.",
    features: [
      "Sample and starter lessons",
      "Daily AI tutor practice (limited)",
      "Vocabulary revision",
      "Basic progress tracking",
    ],
    limits: {
      daily_ai_turns: 15,
      max_session_minutes: 10,
      daily_tts_chars: 4000,
      daily_stt_seconds: 300,
      history_days: 30,
    },
    is_public: true,
    is_available: true,
    sort_order: 1,
  },
  {
    code: "plus",
    name: "Over Sabi Plus",
    description: "For learners who practise every day.",
    features: [
      "Longer speaking sessions",
      "Full guided curricula as they are released",
      "All tutors and tutor settings",
      "Full learning history",
      "Personalised revision and detailed insights",
    ],
    limits: {
      daily_ai_turns: 200,
      max_session_minutes: 30,
      daily_tts_chars: 60000,
      daily_stt_seconds: 3600,
      history_days: 3650,
    },
    is_public: true,
    is_available: true,
    sort_order: 2,
  },
  {
    code: "family",
    name: "Over Sabi Family",
    description: "Learn together at home.",
    features: [
      "Multiple learner profiles",
      "Shared family goals",
      "Parent and guardian controls",
      "Family-oriented content",
    ],
    limits: {
      daily_ai_turns: 200,
      max_session_minutes: 30,
      daily_tts_chars: 60000,
      daily_stt_seconds: 3600,
      history_days: 3650,
      seats: 5,
    },
    is_public: true,
    is_available: false,
    sort_order: 3,
  },
  {
    code: "institution",
    name: "Institutions",
    description: "Schools, universities, cultural organisations and employers.",
    features: ["Managed learner groups", "Course assignments", "Progress reporting", "Educator dashboards"],
    limits: {
      daily_ai_turns: 200,
      max_session_minutes: 45,
      daily_tts_chars: 60000,
      daily_stt_seconds: 3600,
      history_days: 3650,
    },
    is_public: true,
    is_available: false,
    sort_order: 4,
  },
];

export const FEATURE_FLAGS = [
  {
    key: "voice_mode",
    enabled: true,
    description: "Allow voice input/output in the speaking room when a speech provider is configured.",
  },
  { key: "leaderboards", enabled: true, description: "Opt-in weekly XP leaderboard (adults only)." },
  {
    key: "contributions",
    enabled: true,
    description: "Let signed-in learners submit corrections and new vocabulary for review.",
  },
  {
    key: "google_oauth",
    enabled: true,
    description: "Show 'Continue with Google' when Google OAuth credentials are configured.",
  },
  {
    key: "checkout",
    enabled: true,
    description: "Allow paid checkout when a payment provider is configured.",
  },
];
