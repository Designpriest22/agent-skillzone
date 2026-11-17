/**
 * Idempotent seed: language registry, dialects, curriculum, tutors, achievements,
 * plans and feature flags. Safe to re-run; it upserts by natural keys and never
 * touches learner data. Content edited in /admin after seeding is preserved unless
 * --force-content is passed.
 */
import postgres from "postgres";
import { loadEnv } from "./load-env";
import { LANGUAGES } from "../content/languages";
import { TUTORS, ACHIEVEMENTS, PLANS, FEATURE_FLAGS } from "../content/catalog";
import { COURSES } from "../content/curriculum";
import { LEARNING_PATH } from "../content/types";
import { buildActivity } from "../src/lib/content/build-activity";

loadEnv();

export async function seed(url: string, opts: { forceContent?: boolean; quiet?: boolean } = {}) {
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  const log = (m: string) => !opts.quiet && console.log(m);
  try {
    await sql.begin(async (tx) => {
      for (const [i, l] of LANGUAGES.entries()) {
        await tx`
          insert into languages ${tx({
            code: l.code,
            name: l.name,
            native_name: l.native_name,
            iso_639_1: l.iso_639_1,
            iso_639_3: l.iso_639_3,
            family: l.family,
            countries: l.countries,
            region_group: l.region_group,
            writing_systems: l.writing_systems,
            modality: l.modality ?? "spoken",
            orthography_notes: l.orthography_notes ?? "",
            dialect_notes: l.dialect_notes ?? "",
            register_notes: l.register_notes ?? "",
            catalogue_status: l.catalogue_status,
            content_status: l.content_status ?? "none",
            tutor_status: l.tutor_status ?? "unavailable",
            speech_notes: l.speech_notes ?? "",
            supported_levels: l.supported_levels ?? [],
            human_reviewer_status: l.human_reviewer_status ?? "none",
            limitations: l.limitations ?? "",
            is_explanation_language: l.is_explanation_language ?? false,
            sort_order: i,
          })}
          on conflict (code) do nothing`;
      }
      log(`Languages: ${LANGUAGES.length}`);

      for (const [i, t] of TUTORS.entries()) {
        await tx`
          insert into tutors ${tx({ ...t, sort_order: i, voice: tx.json(t.voice) } as never)}
          on conflict (id) do nothing`;
      }
      for (const [i, a] of ACHIEVEMENTS.entries()) {
        await tx`insert into achievements ${tx({ ...a, sort_order: i })}
          on conflict (code) do update set name = excluded.name, description = excluded.description, icon = excluded.icon`;
      }
      for (const p of PLANS) {
        await tx`insert into plans ${tx({ ...p, limits: tx.json(p.limits) } as never)} on conflict (code) do nothing`;
      }
      for (const f of FEATURE_FLAGS) {
        await tx`insert into feature_flags ${tx(f)} on conflict (key) do nothing`;
      }

      for (const course of COURSES) {
        const [dialect] = await tx`
          insert into dialects (language_code, name, region, notes, is_default)
          values (${course.language}, ${course.dialect.name}, ${course.dialect.region}, ${course.dialect.notes}, true)
          on conflict (language_code, name) do update set region = excluded.region, notes = excluded.notes
          returning id`;
        const existing = await tx`select id from courses where slug = ${course.slug}`;
        if (existing.length && !opts.forceContent) {
          log(`Course ${course.slug} exists; skipping content (use --force-content to overwrite).`);
          continue;
        }
        if (existing.length) await tx`delete from courses where slug = ${course.slug}`;

        const vocabIds = new Map<string, string>();
        for (const v of course.vocab) {
          const [row] = await tx`
            insert into vocabulary ${tx({
              language_code: course.language,
              source_language_code: course.source,
              dialect_id: dialect!.id,
              kind: v.kind,
              text: v.text,
              translation: v.translation,
              literal_meaning: v.literal ?? "",
              part_of_speech: v.pos ?? "",
              example_target: v.exampleTarget ?? "",
              example_translation: v.exampleTranslation ?? "",
              register: v.register ?? "neutral",
              context_note: v.context ?? "",
              topic: v.topic,
              confidence: v.confidence,
              source: course.sourceNote,
              review_status: "editorial_draft",
            })}
            on conflict (language_code, source_language_code, text, translation)
              do update set context_note = excluded.context_note
            returning id`;
          vocabIds.set(v.key, row!.id as string);
        }
        const resolve = (key: string) => {
          const id = vocabIds.get(key);
          if (!id) throw new Error(`Unknown vocab key "${key}" in ${course.slug}`);
          return id;
        };

        const [courseRow] = await tx`
          insert into courses (slug, language_code, source_language_code, dialect_id, title, description, status)
          values (${course.slug}, ${course.language}, ${course.source}, ${dialect!.id}, ${course.title}, ${course.description}, 'published')
          returning id`;

        for (const [ci, pathEntry] of LEARNING_PATH.entries()) {
          const authored = course.chapters.find((c) => c.slug === pathEntry.slug);
          const [chapter] = await tx`
            insert into chapters (course_id, slug, title, topic, description, level_label, sort_order, status)
            values (${courseRow!.id}, ${pathEntry.slug}, ${authored?.title ?? pathEntry.title}, ${pathEntry.topic},
                    ${authored?.description ?? ""}, ${authored?.level ?? "Planned"}, ${ci},
                    ${authored ? "published" : "draft"})
            returning id`;
          if (!authored) continue;
          for (const [li, lesson] of authored.lessons.entries()) {
            const [lessonRow] = await tx`
              insert into lessons (chapter_id, slug, title, summary, estimated_minutes, sort_order, is_sample, status, review_status)
              values (${chapter!.id}, ${lesson.slug}, ${lesson.title}, ${lesson.summary}, ${lesson.minutes}, ${li},
                      ${lesson.isSample ?? false}, 'published', 'editorial_draft')
              returning id`;
            for (const key of lesson.vocab) {
              await tx`insert into lesson_vocabulary (lesson_id, vocab_id) values (${lessonRow!.id}, ${resolve(key)}) on conflict do nothing`;
            }
            const vocabText = new Map(course.vocab.map((v) => [v.key, v]));
            for (const [ai, activity] of lesson.activities.entries()) {
              const built = buildActivity(activity, {
                resolve,
                textOf: (k) => vocabText.get(k)!.text,
                seed: `${course.slug}/${lesson.slug}/${ai}`,
              });
              await tx`
                insert into lesson_activities (lesson_id, sort_order, type, payload, answer)
                values (${lessonRow!.id}, ${ai}, ${activity.type}, ${tx.json(built.payload as never)},
                        ${built.answer === null ? null : tx.json(built.answer as never)})`;
            }
            for (const note of lesson.culturalNotes ?? []) {
              await tx`
                insert into cultural_notes (language_code, lesson_id, title, body, region, source, review_status)
                values (${course.language}, ${lessonRow!.id}, ${note.title}, ${note.body}, ${course.dialect.region},
                        ${course.sourceNote}, 'editorial_draft')`;
            }
          }
        }
        log(`Seeded course ${course.slug}: ${course.vocab.length} vocabulary items.`);
      }
    });
  } finally {
    await sql.end();
  }
}

if (process.argv[1]?.endsWith("seed.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  seed(url, { forceContent: process.argv.includes("--force-content") }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
