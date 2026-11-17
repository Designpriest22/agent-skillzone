import type { ActivitySeed } from "../../../content/types";
import { seededShuffle } from "./normalize";

interface BuildContext {
  resolve: (vocabKey: string) => string;
  textOf: (vocabKey: string) => string;
  seed: string;
}

/** Shuffle choices and record where the right answer ended up. */
function shuffleChoices(options: string[], answerIndex: number, seed: string) {
  const correct = options[answerIndex]!;
  const shuffled = seededShuffle(options, seed);
  return { options: shuffled, index: shuffled.indexOf(correct) };
}

/** Converts an authored activity into the stored { payload, answer } pair. */
export function buildActivity(a: ActivitySeed, ctx: BuildContext): { payload: unknown; answer: unknown } {
  const ids = (keys?: string[]) => (keys ?? []).map(ctx.resolve);
  switch (a.type) {
    case "listening": {
      const { options, index } = shuffleChoices(a.options, a.answerIndex, ctx.seed);
      return {
        payload: {
          prompt: a.prompt,
          vocabId: ctx.resolve(a.vocab),
          text: ctx.textOf(a.vocab),
          options,
          vocabIds: [ctx.resolve(a.vocab)],
        },
        answer: { index },
      };
    }
    case "dialogue": {
      const { options, index } = shuffleChoices(a.options, a.answerIndex, ctx.seed);
      return {
        payload: { setting: a.setting, lines: a.lines, prompt: a.prompt, options, vocabIds: ids(a.vocab) },
        answer: { index, explanation: a.explanation },
      };
    }
    case "translation":
      return {
        payload: { prompt: a.prompt, direction: a.direction, hint: a.hint, vocabIds: ids(a.vocab) },
        answer: { accepted: a.accepted },
      };
    case "word_order": {
      let tokens = seededShuffle(a.answer, ctx.seed);
      // Make sure the learner never starts from the solved order.
      for (let n = 1; tokens.join("\u0000") === a.answer.join("\u0000") && n < 10; n++) {
        tokens = seededShuffle(a.answer, `${ctx.seed}#${n}`);
      }
      if (tokens.join("\u0000") === a.answer.join("\u0000")) tokens = [...a.answer].reverse();
      return { payload: { prompt: a.prompt, tokens, vocabIds: ids(a.vocab) }, answer: { order: a.answer } };
    }
    case "matching":
      return {
        payload: {
          prompt: a.prompt,
          left: a.pairs.map((p) => p[0]),
          right: seededShuffle(
            a.pairs.map((p) => p[1]),
            ctx.seed,
          ),
          vocabIds: ids(a.vocab),
        },
        answer: { pairs: a.pairs },
      };
    case "recap":
      return { payload: { title: a.title, points: a.points, vocabIds: ids(a.vocab) }, answer: null };
    case "review":
      return { payload: { prompt: a.prompt, count: a.count }, answer: null };
  }
}
