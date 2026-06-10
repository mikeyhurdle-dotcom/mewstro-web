import { defineConfig, devices } from "@playwright/test";

/**
 * Student-portal smoke tests. Point PORTAL_BASE_URL at a preview deploy
 * to run against Vercel; defaults to a local production build.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.PORTAL_BASE_URL ?? "http://localhost:3199",
    ...devices["Pixel 7"],
  },
  webServer: process.env.PORTAL_BASE_URL
    ? undefined
    : {
        command: "npm start -- -p 3199",
        url: "http://localhost:3199/practice/sign-in",
        reuseExistingServer: true,
        timeout: 30_000,
      },
});
