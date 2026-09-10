import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pm-e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4175",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "npm run start --workspace t2w-event-service",
      url: "http://127.0.0.1:3015/health",
      env: { DATABASE_URL: process.env.PM_TEST_DATABASE_URL ?? "", PORT: "3015" },
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4175",
      url: "http://127.0.0.1:4175",
      env: { PM_API_PROXY: "http://127.0.0.1:3015" },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
