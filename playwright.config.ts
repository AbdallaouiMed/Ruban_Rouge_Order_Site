import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the production build (`npm run build` first), at the four widths
 * the site is designed for. Critical flows run at 360 and 1440; layout checks run at all four.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile-360", use: { ...devices["Pixel 5"], viewport: { width: 360, height: 740 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "laptop-1024", use: { viewport: { width: 1024, height: 768 } } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000/fr",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
