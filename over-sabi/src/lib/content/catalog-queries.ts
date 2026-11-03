import "server-only";
import { db } from "../db";

export async function activeTutors() {
  return db()`
    select id, name, language_code, persona, tagline, bio, teaching_approach, correction_style, default_speed, levels, specialties, avatar_key
    from tutors where status = 'active' order by sort_order`;
}
