import { expect, test } from "@playwright/test";

test("a forged legacy cookie cannot enter the teacher dashboard", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "mewstro_teacher_session",
      value: "Mewstro Studio",
      url: "http://localhost:3199",
    },
  ]);

  await page.goto("/teacher");

  await expect(page).toHaveURL(/\/teacher\/login$/);
  await expect(
    page.getByRole("heading", { name: "Teacher dashboard" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Studio password")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Sign in with password" }),
  ).toHaveCount(0);
});
