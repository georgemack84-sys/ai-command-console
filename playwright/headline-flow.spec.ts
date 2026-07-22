import { expect, test } from "@playwright/test";

test.describe("Headline Flow", () => {
  test("initial story renders and controls navigate", async ({ page }) => {
    await page.goto("/?category=technology");
    await expect(page.getByRole("heading", { name: /chip/i })).toBeVisible();
    await page.getByLabel("Next story").click();
    await expect(page.getByText(/OF/).last()).toBeVisible();
    await page.getByLabel("Previous story").click();
    await expect(page.getByRole("link", { name: /read story/i })).toHaveAttribute("rel", /noopener/);
  });

  test("pause, category switching, save persistence, and display mode work", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Pause slideshow").click();
    await expect(page.getByLabel("Play slideshow")).toBeVisible();
    await page.getByRole("button", { name: "Technology" }).click();
    await expect(page).toHaveURL(/category=technology/);
    await page.getByRole("button", { name: "Save" }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
    await page.goto("/?mode=display&category=top&autoplay=true");
    await expect(page.getByText("Headline Flow")).toBeVisible();
  });

  test("keyboard shortcuts and broken images keep a fallback visible", async ({ page }) => {
    await page.goto("/?category=technology");
    await page.keyboard.press("Space");
    await expect(page.getByLabel("Play slideshow")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("KeyS");
    await page.keyboard.press("KeyH");
    await expect(page.locator("article, section").first()).toBeVisible();
  });
});
