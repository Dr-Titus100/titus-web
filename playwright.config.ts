import { defineConfig, devices } from "@playwright/test";

// Smoke tests against the built site. Run `npm run build` first, then `npm test`.
// Playwright starts `astro preview` itself, or reuses one already running on port 4321.
const base = (process.env.SITE_BASE ?? "/titus-web").replace(/\/?$/, "/");

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://localhost:4321${base}`, trace: "off" },
  webServer: { command: "npx astro preview --port 4321", url: `http://localhost:4321${base}`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"], viewport: { width: 375, height: 812 } } },
  ],
});
