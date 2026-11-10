import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgres://oversabi:oversabi@localhost:5432/oversabi_e2e";
const PORT = 3100;
const executablePath = fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;

/**
 * End-to-end journeys against a dev server (so the deterministic AI/speech test
 * doubles can be enabled — they are refused in production builds) and a dedicated
 * database that is reset before every run.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: {
      executablePath,
      args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
    },
    permissions: ["microphone"],
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], executablePath } as never,
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], executablePath } as never,
      testMatch: /mobile\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    timeout: 180_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: E2E_DB,
      APP_URL: `http://localhost:${PORT}`,
      SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-1234",
      OVERSABI_TEST_PROVIDERS: "1",
      SPEECH_PROVIDER: "none",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
