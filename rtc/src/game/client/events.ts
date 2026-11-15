/**
 * The analytics tracking plan, shared by the browser tracker and the server's ingest validation.
 * snake_case, object_action, past tense. Keep it small: every event answers a named question.
 */
import { z } from "zod";

const id = z.string().regex(/^[A-Za-z0-9_]{1,24}$/);
const n = z.number().finite().min(0).max(1e9);

export const EVENT_SCHEMAS = {
  /** Q: how many people play, from where (channel), on what device? */
  session_started: z.object({ source: z.string().max(40).regex(/^[a-z0-9_.-]*$/), returning: z.boolean() }),
  /** Q: which screens hold attention? */
  screen_viewed: z.object({ screen: id }),
  /** Q: which fighters do players pick, and do locked ones tempt them? */
  fighter_selected: z.object({ fighter: id, owned: z.boolean() }),
  /** Q: where do runs start and how often (activation)? */
  run_started: z.object({ substage: id, fighter: id, signed_in: z.boolean() }),
  /** Q: where do players fail, quit or shine (difficulty curve)? */
  run_finished: z.object({ substage: id, fighter: id, cleared: z.boolean(), rating: z.string().max(2), score: n, max_combo: n, kos: n, duration_s: n }),
  run_quit: z.object({ substage: id, fighter: id, duration_s: n }),
  /** Q: does play convert to profiles (signup funnel)? */
  signup_completed: z.object({ home_area: id, fighter: id }),
  /** Q: is the store interesting, and through which payment path? */
  store_purchase_started: z.object({ item: z.string().max(40), method: z.enum(["cash", "naira"]) }),
  /** Q: do festival tie-ins and sharing drive engagement? */
  event_card_clicked: z.object({ event: id }),
  profile_shared: z.object({ method: z.enum(["native", "copy"]) }),
} as const;

export type EventName = keyof typeof EVENT_SCHEMAS;
export type EventProps<N extends EventName> = z.infer<(typeof EVENT_SCHEMAS)[N]>;
export const EVENT_NAMES = Object.keys(EVENT_SCHEMAS) as EventName[];
