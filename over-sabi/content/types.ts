/**
 * Seed-content types. Curriculum lives in version-controlled TypeScript so it can be
 * reviewed in pull requests, then is loaded into the database by `npm run db:seed`.
 * After seeding, the admin dashboard is the source of truth for edits and reviews.
 */
export type Register = "neutral" | "formal" | "informal" | "respectful" | "intimate";
export type Confidence = "low" | "medium" | "high";

export interface VocabSeed {
  key: string;
  kind: "word" | "phrase" | "sentence";
  text: string;
  translation: string;
  literal?: string;
  pos?: string;
  exampleTarget?: string;
  exampleTranslation?: string;
  register?: Register;
  context?: string;
  topic: string;
  confidence: Confidence;
}

export type ActivitySeed =
  | { type: "listening"; vocab: string; prompt: string; options: string[]; answerIndex: number }
  | {
      type: "translation";
      prompt: string;
      direction: "to_target" | "to_source";
      hint?: string;
      accepted: string[];
      vocab?: string[];
    }
  | { type: "word_order"; prompt: string; answer: string[]; vocab?: string[] }
  | { type: "matching"; prompt: string; pairs: [string, string][]; vocab?: string[] }
  | {
      type: "dialogue";
      setting: string;
      lines: { speaker: string; text: string; translation: string }[];
      prompt: string;
      options: string[];
      answerIndex: number;
      explanation: string;
      vocab?: string[];
    }
  | { type: "recap"; title: string; points: string[]; vocab: string[] }
  | { type: "review"; prompt: string; count: number };

export interface LessonSeed {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  isSample?: boolean;
  vocab: string[];
  activities: ActivitySeed[];
  culturalNotes?: { title: string; body: string }[];
}

export interface ChapterSeed {
  slug: string;
  title: string;
  topic: string;
  description: string;
  level: string;
  lessons: LessonSeed[];
}

export interface CourseSeed {
  slug: string;
  language: string;
  source: string;
  title: string;
  description: string;
  dialect: { name: string; region: string; notes: string };
  sourceNote: string;
  vocab: VocabSeed[];
  chapters: ChapterSeed[];
}

/** The full learning path. Only chapters with seeded lessons are published. */
export const LEARNING_PATH: { slug: string; title: string; topic: string }[] = [
  { slug: "greetings", title: "Greetings and introductions", topic: "greetings" },
  { slug: "family", title: "Family and relationships", topic: "family" },
  { slug: "numbers", title: "Numbers, dates and time", topic: "numbers" },
  { slug: "food", title: "Food and ordering meals", topic: "food" },
  { slug: "market", title: "Markets, shopping and bargaining", topic: "market" },
  { slug: "directions", title: "Directions and transport", topic: "directions" },
  { slug: "home", title: "Home and everyday routines", topic: "home" },
  { slug: "friends", title: "Friends and social life", topic: "social" },
  { slug: "feelings", title: "Feelings and opinions", topic: "feelings" },
  { slug: "work", title: "Work and business", topic: "work" },
  { slug: "travel", title: "Travel and hospitality", topic: "travel" },
  { slug: "celebrations", title: "Festivals, weddings and naming ceremonies", topic: "celebrations" },
  { slug: "proverbs", title: "Proverbs, idioms and storytelling", topic: "proverbs" },
  { slug: "culture", title: "Music, entertainment and popular culture", topic: "culture" },
  { slug: "etiquette", title: "Respect, etiquette and social context", topic: "etiquette" },
  {
    slug: "problem-solving",
    title: "Conflict resolution and everyday problem-solving",
    topic: "problem-solving",
  },
  { slug: "advanced", title: "Advanced conversations and storytelling", topic: "advanced" },
];
