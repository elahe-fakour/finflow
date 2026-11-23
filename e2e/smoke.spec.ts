import { expect, test } from "@playwright/test";

test("redirects a signed-out visitor to the sign-in page", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login\?reason=session-expired$/u);
  await expect(page.getByRole("heading", { name: "Welcome to FinFlow" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email address" })).toBeVisible();
});
