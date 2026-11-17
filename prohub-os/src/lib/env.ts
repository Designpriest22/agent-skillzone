/** Centralised environment access. Secrets are never hardcoded; see .env.example. */
export const env = {
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "postgres://prohub:prohub@localhost:5432/prohub";
  },
  get appUrl() {
    return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY ?? "";
  },
  get encryptionKey() {
    return process.env.ENCRYPTION_KEY ?? "";
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
  get workerMode(): "embedded" | "standalone" | "cron" {
    const m = process.env.WORKER_MODE ?? "standalone";
    return m === "embedded" || m === "cron" ? m : "standalone";
  },
  get timezone() {
    return process.env.BUSINESS_TIMEZONE ?? "Africa/Lagos";
  },
  get defaultModel() {
    return process.env.DEFAULT_AGENT_MODEL ?? "claude-opus-5-5";
  },
  get llmDisabled() {
    return process.env.LLM_PROVIDER === "mock" || !process.env.ANTHROPIC_API_KEY;
  },
  get isProd() {
    return process.env.NODE_ENV === "production";
  },
};
