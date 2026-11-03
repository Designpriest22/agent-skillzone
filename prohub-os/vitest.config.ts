import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://prohub:prohub@localhost:5432/prohub_test",
      ENCRYPTION_KEY: "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=",
      OWNER_EMAIL: "owner@test.local",
      OWNER_PASSWORD: "test-password-123",
      ANTHROPIC_API_KEY: "",
      SMTP_HOST: "",
      NODE_ENV: "test",
    },
    hookTimeout: 60000,
  },
});
