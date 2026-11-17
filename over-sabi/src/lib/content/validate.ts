import {
  choiceAnswer,
  dialogueAnswer,
  matchingAnswer,
  translationAnswer,
  wordOrderAnswer,
  type ActivityResponse,
  type ActivityResult,
  type ActivityType,
} from "./activity-types";
import { compareText, normalizeStrict } from "./normalize";

const NEAR_MISS_FEEDBACK =
  "Almost — the letters are right, but check the tone marks, dots or hooked letters. They change meaning.";

/**
 * Grades a learner response against the stored answer. Pure function — used by the
 * lesson API (signed-in and guest) and covered by unit tests.
 */
export function gradeActivity(
  type: ActivityType,
  storedAnswer: unknown,
  response: ActivityResponse,
  reviewKey?: Map<string, string>,
): ActivityResult {
  if (response.type !== type) {
    return { correct: false, nearMiss: false, score: 0, feedback: "That answer doesn't fit this activity." };
  }
  switch (response.type) {
    case "listening": {
      const answer = choiceAnswer.parse(storedAnswer);
      const correct = response.index === answer.index;
      return {
        correct,
        nearMiss: false,
        score: correct ? 1 : 0,
        feedback: correct ? "Correct." : "Not quite.",
      };
    }
    case "dialogue": {
      const answer = dialogueAnswer.parse(storedAnswer);
      const correct = response.index === answer.index;
      return { correct, nearMiss: false, score: correct ? 1 : 0, feedback: answer.explanation };
    }
    case "translation": {
      const answer = translationAnswer.parse(storedAnswer);
      const match = compareText(response.text, answer.accepted);
      if (match === "exact")
        return {
          correct: true,
          nearMiss: false,
          score: 1,
          feedback: "Correct.",
          expected: answer.accepted[0],
        };
      if (match === "near")
        return {
          correct: false,
          nearMiss: true,
          score: 0.5,
          feedback: NEAR_MISS_FEEDBACK,
          expected: answer.accepted[0],
        };
      return {
        correct: false,
        nearMiss: false,
        score: 0,
        feedback: "Not quite.",
        expected: answer.accepted[0],
      };
    }
    case "word_order": {
      const answer = wordOrderAnswer.parse(storedAnswer);
      const given = response.order.join(" ");
      const match = compareText(given, [answer.order.join(" ")]);
      const expected = answer.order.join(" ");
      if (match === "exact")
        return { correct: true, nearMiss: false, score: 1, feedback: "Correct.", expected };
      return { correct: false, nearMiss: false, score: 0, feedback: "The order isn't right yet.", expected };
    }
    case "matching": {
      const answer = matchingAnswer.parse(storedAnswer);
      const key = new Map(answer.pairs.map(([l, r]) => [normalizeStrict(l), normalizeStrict(r)]));
      const seen = new Set<string>();
      let right = 0;
      for (const [l, r] of response.pairs) {
        const nl = normalizeStrict(l);
        if (seen.has(nl)) continue;
        seen.add(nl);
        if (key.get(nl) === normalizeStrict(r)) right++;
      }
      const correct = right === answer.pairs.length && response.pairs.length === answer.pairs.length;
      return {
        correct,
        nearMiss: false,
        score: right / answer.pairs.length,
        feedback: correct ? "All matched." : `${right} of ${answer.pairs.length} pairs matched.`,
        expected: answer.pairs.map(([l, r]) => `${l} = ${r}`).join(" · "),
      };
    }
    case "recap":
      return { correct: true, nearMiss: false, score: 1, feedback: "Nice work." };
    case "review": {
      const items = response.answers.map((a) => {
        const expected = reviewKey?.get(a.vocabId) ?? "";
        return {
          vocabId: a.vocabId,
          correct: !!expected && normalizeStrict(a.choice) === normalizeStrict(expected),
          expected,
        };
      });
      const right = items.filter((i) => i.correct).length;
      const total = Math.max(items.length, 1);
      return {
        correct: right === items.length,
        nearMiss: false,
        score: right / total,
        feedback: items.length === 0 ? "Nothing to review yet." : `${right} of ${items.length} remembered.`,
        items,
      };
    }
  }
}
