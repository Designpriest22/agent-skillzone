import "server-only";
import { db } from "../db";
import type { ClientActivity, ReviewQuestion } from "./activity-types";
import { seededShuffle } from "./normalize";

/** Public catalogue and curriculum reads (published content only). */

export interface LanguageRow {
  code: string;
  name: string;
  native_name: string;
  iso_639_1: string | null;
  iso_639_3: string | null;
  family: string;
  countries: string[];
  region_group: string;
  writing_systems: string[];
  modality: string;
  orthography_notes: string;
  dialect_notes: string;
  register_notes: string;
  catalogue_status: "roadmap" | "in_development" | "beta" | "available";
  content_status: string;
  stt_status: string;
  tts_status: string;
  tutor_status: string;
  speech_notes: string;
  supported_levels: string[];
  human_reviewer_status: string;
  limitations: string;
  is_explanation_language: boolean;
}

export async function listLanguages(): Promise<LanguageRow[]> {
  return (await db()`select * from languages order by sort_order, name`) as unknown as LanguageRow[];
}

export async function getLanguage(code: string): Promise<LanguageRow | null> {
  const [row] = await db()`select * from languages where code = ${code}`;
  return (row as LanguageRow | undefined) ?? null;
}

export async function learnableLanguages(): Promise<LanguageRow[]> {
  return (await db()`
    select l.* from languages l
    where l.catalogue_status in ('beta', 'available')
      and exists (select 1 from courses c where c.language_code = l.code and c.status = 'published')
    order by l.sort_order`) as unknown as LanguageRow[];
}

export async function getCourseForLanguage(code: string) {
  const [course] = await db()`
    select c.id, c.slug, c.title, c.description, c.language_code, d.name as dialect_name, d.notes as dialect_notes
    from courses c left join dialects d on d.id = c.dialect_id
    where c.language_code = ${code} and c.status = 'published'
    order by c.sort_order limit 1`;
  if (!course) return null;
  const chapters = await db()`
    select ch.id, ch.slug, ch.title, ch.topic, ch.description, ch.level_label, ch.status, ch.sort_order,
      coalesce(json_agg(json_build_object(
        'id', l.id, 'slug', l.slug, 'title', l.title, 'summary', l.summary,
        'minutes', l.estimated_minutes, 'isSample', l.is_sample, 'reviewStatus', l.review_status
      ) order by l.sort_order) filter (where l.id is not null), '[]') as lessons
    from chapters ch
    left join lessons l on l.chapter_id = ch.id and l.status = 'published'
    where ch.course_id = ${course.id} and ch.status in ('published', 'draft')
    group by ch.id
    order by ch.sort_order`;
  const c = course as unknown as {
    id: string;
    slug: string;
    title: string;
    description: string;
    language_code: string;
    dialect_name: string | null;
    dialect_notes: string | null;
  };
  return {
    ...c,
    chapters: chapters as unknown as {
      id: string;
      slug: string;
      title: string;
      topic: string;
      description: string;
      level_label: string;
      status: "published" | "draft";
      lessons: {
        id: string;
        slug: string;
        title: string;
        summary: string;
        minutes: number;
        isSample: boolean;
        reviewStatus: string;
      }[];
    }[],
  };
}

export async function getSampleLessonId(code: string): Promise<string | null> {
  const [row] = await db()`
    select l.id from lessons l join chapters ch on ch.id = l.chapter_id join courses c on c.id = ch.course_id
    where c.language_code = ${code} and l.is_sample and l.status = 'published' and c.status = 'published'
    order by ch.sort_order, l.sort_order limit 1`;
  return row?.id ?? null;
}

export interface LessonForPlayer {
  id: string;
  title: string;
  summary: string;
  isSample: boolean;
  reviewStatus: string;
  xpReward: number;
  language: { code: string; name: string; native_name: string };
  chapterTitle: string;
  nextLessonId: string | null;
  activities: ClientActivity[];
  vocabulary: {
    id: string;
    text: string;
    translation: string;
    literal_meaning: string;
    register: string;
    context_note: string;
    review_status: string;
  }[];
  culturalNotes: { id: string; title: string; body: string; review_status: string }[];
}

/** Loads a lesson for the player. Answers are never selected. */
export async function getLessonForPlayer(
  lessonId: string,
  reviewPool: ReviewPool,
): Promise<LessonForPlayer | null> {
  const [lesson] = await db()`
    select l.id, l.title, l.summary, l.is_sample, l.review_status, l.xp_reward, l.sort_order, l.chapter_id,
      ch.title as chapter_title, ch.sort_order as chapter_order, ch.course_id,
      lang.code, lang.name, lang.native_name
    from lessons l
    join chapters ch on ch.id = l.chapter_id
    join courses c on c.id = ch.course_id
    join languages lang on lang.code = c.language_code
    where l.id = ${lessonId} and l.status = 'published' and c.status = 'published'`;
  if (!lesson) return null;

  const rows = await db()`
    select a.id, a.type, a.payload, aa.storage_path as audio_path, aa.review_status as audio_status
    from lesson_activities a
    left join vocabulary v on a.type = 'listening' and v.id = (a.payload->>'vocabId')::uuid
    left join audio_assets aa on aa.id = v.audio_asset_id and aa.review_status = 'verified'
    where a.lesson_id = ${lessonId}
    order by a.sort_order`;

  const activities: ClientActivity[] = [];
  for (const r of rows) {
    if (r.type === "listening") {
      activities.push({
        id: r.id,
        type: "listening",
        payload: r.payload,
        audioUrl: r.audio_path ? `/api/audio/${encodeURIComponent(r.audio_path)}` : null,
      });
    } else if (r.type === "review") {
      activities.push({
        id: r.id,
        type: "review",
        payload: r.payload,
        questions: await buildReviewQuestions(lesson.code, lessonId, r.payload.count, reviewPool, r.id),
      });
    } else {
      activities.push({ id: r.id, type: r.type, payload: r.payload } as ClientActivity);
    }
  }

  const vocabulary = await db()`
    select v.id, v.text, v.translation, v.literal_meaning, v.register, v.context_note, v.review_status
    from lesson_vocabulary lv join vocabulary v on v.id = lv.vocab_id
    where lv.lesson_id = ${lessonId} and v.review_status <> 'rejected'
    order by v.created_at`;
  const culturalNotes = await db()`
    select id, title, body, review_status from cultural_notes where lesson_id = ${lessonId} and review_status <> 'rejected'`;
  const [next] = await db()`
    select l.id from lessons l join chapters ch on ch.id = l.chapter_id
    where ch.course_id = ${lesson.course_id} and l.status = 'published' and ch.status = 'published'
      and (ch.sort_order, l.sort_order) > (${lesson.chapter_order}, ${lesson.sort_order})
    order by ch.sort_order, l.sort_order limit 1`;

  return {
    id: lesson.id,
    title: lesson.title,
    summary: lesson.summary,
    isSample: lesson.is_sample,
    reviewStatus: lesson.review_status,
    xpReward: lesson.xp_reward,
    language: { code: lesson.code, name: lesson.name, native_name: lesson.native_name },
    chapterTitle: lesson.chapter_title,
    nextLessonId: next?.id ?? null,
    activities,
    vocabulary: vocabulary as unknown as LessonForPlayer["vocabulary"],
    culturalNotes: culturalNotes as unknown as LessonForPlayer["culturalNotes"],
  };
}

/**
 * Where review questions come from: a signed-in learner's due items, or (for guests
 * and new learners) vocabulary from earlier lessons in the course.
 */
export type ReviewPool = { kind: "user"; userId: string } | { kind: "guest" };

async function buildReviewQuestions(
  language: string,
  lessonId: string,
  count: number,
  pool: ReviewPool,
  seed: string,
): Promise<ReviewQuestion[]> {
  let items: { id: string; text: string; translation: string }[] = [];
  if (pool.kind === "user") {
    items = (await db()`
      select v.id, v.text, v.translation from user_vocabulary uv join vocabulary v on v.id = uv.vocab_id
      where uv.user_id = ${pool.userId} and v.language_code = ${language} and v.review_status <> 'rejected'
        and uv.vocab_id not in (select vocab_id from lesson_vocabulary where lesson_id = ${lessonId})
      order by uv.due_at asc limit ${count}`) as unknown as typeof items;
  }
  if (items.length < count) {
    const have = items.map((i) => i.id);
    const more = (await db()`
      select v.id, v.text, v.translation
      from lesson_vocabulary lv
      join lessons l on l.id = lv.lesson_id
      join chapters ch on ch.id = l.chapter_id
      join vocabulary v on v.id = lv.vocab_id
      join lessons cur on cur.id = ${lessonId}
      join chapters curch on curch.id = cur.chapter_id
      where ch.course_id = curch.course_id and l.status = 'published' and v.review_status <> 'rejected'
        and (ch.sort_order, l.sort_order) < (curch.sort_order, cur.sort_order)
        and not (v.id = any(${have}::uuid[]))
      order by md5(v.id::text || ${seed}) limit ${count - items.length}`) as unknown as typeof items;
    items = [...items, ...more];
  }
  if (!items.length) return [];
  const distractorRows = await db()`
    select translation from vocabulary where language_code = ${language} and review_status <> 'rejected'
    order by md5(id::text || ${seed}) limit 12`;
  const distractors = distractorRows.map((r) => r.translation as string);
  return items.map((item) => {
    const wrong = [...new Set(distractors.filter((d) => d !== item.translation))].slice(0, 3);
    return {
      vocabId: item.id,
      prompt: item.text,
      options: seededShuffle([item.translation, ...wrong], `${seed}/${item.id}`),
    };
  });
}
