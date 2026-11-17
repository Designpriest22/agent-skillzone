import { z } from "zod";

/**
 * Activity payloads (shown to the learner) and answers (server-only). Answers are
 * stored in lesson_activities.answer, which the learner database role cannot read.
 */
export const ACTIVITY_TYPES = [
  "listening",
  "translation",
  "word_order",
  "matching",
  "dialogue",
  "recap",
  "review",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const listeningPayload = z.object({
  prompt: z.string(),
  vocabId: z.string().uuid(),
  text: z.string(),
  options: z.array(z.string()).min(2),
  vocabIds: z.array(z.string().uuid()),
});
export const choiceAnswer = z.object({ index: z.number().int().min(0) });

export const translationPayload = z.object({
  prompt: z.string(),
  direction: z.enum(["to_target", "to_source"]),
  hint: z.string().optional(),
  vocabIds: z.array(z.string().uuid()),
});
export const translationAnswer = z.object({ accepted: z.array(z.string()).min(1) });

export const wordOrderPayload = z.object({
  prompt: z.string(),
  tokens: z.array(z.string()).min(2),
  vocabIds: z.array(z.string().uuid()),
});
export const wordOrderAnswer = z.object({ order: z.array(z.string()).min(2) });

export const matchingPayload = z.object({
  prompt: z.string(),
  left: z.array(z.string()).min(2),
  right: z.array(z.string()).min(2),
  vocabIds: z.array(z.string().uuid()),
});
export const matchingAnswer = z.object({ pairs: z.array(z.tuple([z.string(), z.string()])).min(2) });

export const dialoguePayload = z.object({
  setting: z.string(),
  lines: z.array(z.object({ speaker: z.string(), text: z.string(), translation: z.string() })),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  vocabIds: z.array(z.string().uuid()),
});
export const dialogueAnswer = z.object({ index: z.number().int().min(0), explanation: z.string() });

export const recapPayload = z.object({
  title: z.string(),
  points: z.array(z.string()),
  vocabIds: z.array(z.string().uuid()),
});

export const reviewPayload = z.object({ prompt: z.string(), count: z.number().int().min(1).max(10) });

export type ListeningPayload = z.infer<typeof listeningPayload>;
export type TranslationPayload = z.infer<typeof translationPayload>;
export type WordOrderPayload = z.infer<typeof wordOrderPayload>;
export type MatchingPayload = z.infer<typeof matchingPayload>;
export type DialoguePayload = z.infer<typeof dialoguePayload>;
export type RecapPayload = z.infer<typeof recapPayload>;
export type ReviewPayload = z.infer<typeof reviewPayload>;

/** A review question generated at request time from the learner's revision queue. */
export interface ReviewQuestion {
  vocabId: string;
  prompt: string;
  options: string[];
}

export type ClientActivity =
  | { id: string; type: "listening"; payload: ListeningPayload; audioUrl: string | null }
  | { id: string; type: "translation"; payload: TranslationPayload }
  | { id: string; type: "word_order"; payload: WordOrderPayload }
  | { id: string; type: "matching"; payload: MatchingPayload }
  | { id: string; type: "dialogue"; payload: DialoguePayload }
  | { id: string; type: "recap"; payload: RecapPayload }
  | { id: string; type: "review"; payload: ReviewPayload; questions: ReviewQuestion[] };

/** What a learner submits for each activity type. */
export const responseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("listening"), index: z.number().int().min(0).max(20) }),
  z.object({ type: z.literal("dialogue"), index: z.number().int().min(0).max(20) }),
  z.object({ type: z.literal("translation"), text: z.string().max(300) }),
  z.object({ type: z.literal("word_order"), order: z.array(z.string().max(80)).max(30) }),
  z.object({
    type: z.literal("matching"),
    pairs: z.array(z.tuple([z.string().max(120), z.string().max(120)])).max(20),
  }),
  z.object({ type: z.literal("recap") }),
  z.object({
    type: z.literal("review"),
    answers: z.array(z.object({ vocabId: z.string().uuid(), choice: z.string().max(200) })).max(10),
  }),
]);
export type ActivityResponse = z.infer<typeof responseSchema>;

export interface ActivityResult {
  correct: boolean;
  /** Right letters, wrong tone marks / under-dots / hooked letters. */
  nearMiss: boolean;
  score: number; // 0..1
  feedback: string;
  expected?: string;
  /** For review activities: per-item results, to update spaced repetition. */
  items?: { vocabId: string; correct: boolean; expected: string }[];
}
