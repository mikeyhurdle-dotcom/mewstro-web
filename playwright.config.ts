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
        url: "http://localhost:3199/teacher/login",
        reuseExistingServer: true,
        timeout: 30_000,
        env: {
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ??
            "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_ANON_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "test-anon-key",
          TEACHER_DASHBOARD_PASSWORD_DEMO: "retired-e2e-secret",
        },
      },
});
