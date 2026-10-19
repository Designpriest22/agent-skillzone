import { vi } from "vitest";

// Integration tests run against a dedicated database, never the dev database.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://oversabi:oversabi@localhost:5432/oversabi_test";
process.env.SESSION_SECRET = "test-secret-test-secret-test-secret-123";
process.env.APP_URL = "http://localhost:3000";
process.env.OVERSABI_TEST_PROVIDERS = "1";
process.env.PAYSTACK_SECRET_KEY = "sk_test_dummy_for_signature_tests";
(process.env as Record<string, string>).NODE_ENV = "test";

// Minimal stand-in for Next.js request APIs used by session code.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
  headers: async () => new Headers({ "user-agent": "vitest" }),
}));
vi.mock("next/navigation", () => ({
  redirect: (u: string) => {
    throw new Error(`redirect:${u}`);
  },
}));
