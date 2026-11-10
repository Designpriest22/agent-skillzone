import "server-only";
import { z } from "zod";

/**
 * Server environment. Only DATABASE_URL and SESSION_SECRET are required to run the
 * app; every external integration is optional and reports itself as "not configured"
 * instead of pretending to work.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),

  ANTHROPIC_API_KEY: z.string().optional(),
  TUTOR_MODEL: z.string().default("claude-opus-5-5"),
  TUTOR_EFFORT: z.enum(["low", "medium", "high"]).default("low"),

  SPEECH_PROVIDER: z.enum(["none", "openai", "elevenlabs"]).default("none"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_STT_MODEL: z.string().default("gpt-4o-transcribe"),
  OPENAI_TTS_MODEL: z.string().default("gpt-4o-mini-tts"),
  OPENAI_TTS_VOICE: z.string().default("alloy"),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_STT_MODEL: z.string().default("scribe_v1"),
  ELEVENLABS_TTS_MODEL: z.string().default("eleven_v3"),
  ELEVENLABS_VOICE_ID: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Over Sabi <hello@example.com>"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),

  STORAGE_DRIVER: z.enum(["local", "supabase"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./storage"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("oversabi-audio"),

  CRON_SECRET: z.string().optional(),
  TRANSCRIPT_RETENTION_DAYS: z.coerce.number().int().min(1).max(3650).default(90),

  /** Test-only: enables deterministic in-process AI/speech doubles. Ignored in production. */
  OVERSABI_TEST_PROVIDERS: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function testProvidersEnabled(): boolean {
  const e = env();
  return e.NODE_ENV !== "production" && e.OVERSABI_TEST_PROVIDERS === "1";
}
