import { test, expect } from "@playwright/test";

/**
 * The teacher-promise smoke flow: a brand-new Android student follows
 * the shared invite link, signs up, joins the studio, logs a practice
 * session, and sees it on Today + the leaderboard.
 *
 * Each run creates a fresh account (e2e+<ts>@mewstro-test address);
 * test rows are cleaned out of Supabase afterwards (see 8/8 notes).
 */
const INVITE_CODE = "MEWSTROTEST";
const STUDIO_NAME = "Mewstro (Test)";

test("invite link → sign up → join studio → log session → today + leaderboard", async ({
  page,
}) => {
  const stamp = Date.now();
  const email = `mewstro.portal.e2e.${stamp}@gmail.com`;
  const password = `E2E-pass-${stamp}!`;
  const displayName = `E2E Student ${stamp}`;

  // 1. Teacher's link, signed out → bounced to sign-in with return path.
  await page.goto(`/practice?code=${INVITE_CODE}`);
  await expect(page).toHaveURL(/\/practice\/sign-in\?next=/);

  // Clear the site-wide cookie-consent dialog so it can't intercept taps.
  await page
    .getByRole("dialog", { name: "Cookie preferences" })
    .getByRole("button", { name: "Accept" })
    .click();

  // 2. New student → sign-up, code rides along in ?next=.
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/practice\/sign-up\?next=/);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password (8+ characters)").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  // 3. Onboarding: display name.
  await expect(
    page.getByRole("heading", { name: "What should we call you?" }),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Your name").fill(displayName);
  await page.getByRole("button", { name: "Continue" }).click();

  // 4. Join step: invite code prefilled from the link.
  await expect(
    page.getByRole("heading", { name: "Join your teacher's studio" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Invite code")).toHaveValue(INVITE_CODE);
  await page.getByRole("button", { name: "Find Studio" }).click();

  // 5. Confirm step shows the studio, one tap to join.
  await expect(page.getByText(`Join Mikey (Test)'s Studio?`)).toBeVisible();
  await page.getByRole("button", { name: "Join Studio" }).click();

  // 6. Privacy explainer — visibility defaults ON.
  await expect(page.getByRole("heading", { name: "You're in!" })).toBeVisible();
  await expect(page.getByText(`Welcome to ${STUDIO_NAME}.`)).toBeVisible();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "Got it" }).click();

  // 7. Today screen, signed in, studio joined.
  await expect(page.getByRole("heading", { name: `Hi E2E` })).toBeVisible({
    timeout: 15_000,
  });

  // 8. Timer: start → finish → save.
  await page.getByRole("link", { name: "Start practising" }).click();
  await expect(page).toHaveURL(/\/practice\/timer/);
  await page.getByRole("button", { name: "Start practising" }).click();
  await expect(page.getByText("0:0", { exact: false }).first()).toBeVisible();
  await page.waitForTimeout(2_000);
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByPlaceholder("Notes (optional)").fill("Playwright smoke run");
  await page.getByRole("button", { name: "Save session" }).click();
  await expect(page.getByText("in the books!")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();

  // 9. Today reflects the session: 1-day streak + weekly minutes.
  await expect(page.getByText("1 🔥")).toBeVisible({ timeout: 15_000 });

  // 10. Leaderboard shows the student's own highlighted row.
  await page.getByRole("link", { name: "Leaderboard" }).click();
  await expect(
    page.getByText(`${STUDIO_NAME} · This Week`),
  ).toBeVisible();
  await expect(page.getByText(displayName)).toBeVisible();
  await expect(page.getByText("you", { exact: true })).toBeVisible();

  // 11. Sign out via settings, sign back in — session round-trip.
  await page.getByRole("link", { name: "Today" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/practice\/sign-in/);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: `Hi E2E` })).toBeVisible({
    timeout: 15_000,
  });
});
