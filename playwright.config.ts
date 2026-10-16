import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-layout", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 180_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://myem-test.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-placeholder-not-a-secret",
      SUPABASE_SERVICE_ROLE_KEY: "test-placeholder-not-a-secret",
    },
  },
});
