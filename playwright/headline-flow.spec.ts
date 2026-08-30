import { expect, test, type Page } from "@playwright/test";

async function loginWithDemoAccount(page: Page) {
  const response = await page.request.post("/api/auth/dev-login", { timeout: 5_000 });
  test.skip(response.status() === 401 || response.status() === 503, "Demo auth is required for Headline Flow UI coverage.");
  expect(response.ok()).toBeTruthy();
}

async function loadFixtureBriefing(page: Page) {
  await loginWithDemoAccount(page);
  await page.goto("/headline-flow", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/headline flow/i);
  await expect(page.getByText(/^headline flow$/i).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/Checking live readiness|Live (ready|degraded|not ready)/i).first()).toBeVisible();

  await page.getByRole("button", { name: "Fixture", exact: true }).click();
  await expect(page.getByRole("heading", { name: /city approves overnight cooling centers/i })).toBeVisible();
  await expect(page.getByTestId("headline-flow-queue").getByText(/stories in your briefing/i)).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(
      async () =>
        page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1),
      { timeout: 10_000 },
    )
    .toBe(true);
}

test.describe("Headline Flow 1.0 acceptance", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test("loads as a standalone briefing console with fixture stories", async ({ page }) => {
    await loadFixtureBriefing(page);

    await expect(page.getByText(/ai command console/i)).toHaveCount(0);
    await expect(page.locator("h2")).toBeVisible();
    await expect(page.getByText("What changed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tell me more", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "View Full Briefing Queue", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps the briefing visual system intact across hero, queue, and fallback states", async ({ page }, testInfo) => {
    await loadFixtureBriefing(page);

    const hero = page.getByTestId("headline-flow-hero-visual");
    const queue = page.getByTestId("headline-flow-queue");
    await expect(hero).toBeVisible();
    await expect(queue).toBeVisible();
    await expect(hero.getByText(/article image from|topic visual fallback/i)).toBeVisible();
    await expect(hero.getByText(/Live|Today|Past 48h/).first()).toBeVisible();
    await expect(queue.getByText("Up Next", { exact: true })).toBeVisible();
    await expect(queue.getByText(/Article|Topic/).first()).toBeVisible();
    await expect(queue.getByText(/Live|Today|Past 48h/).first()).toBeVisible();

    const heroBox = await hero.boundingBox();
    const queueBox = await queue.boundingBox();
    expect(heroBox?.width ?? 0).toBeGreaterThan(testInfo.project.name.includes("mobile") ? 300 : 420);
    expect(heroBox?.height ?? 0).toBeGreaterThan(testInfo.project.name.includes("mobile") ? 240 : 330);
    expect(queueBox?.height ?? 0).toBeGreaterThan(220);

    await page.screenshot({
      path: testInfo.outputPath(`headline-flow-${testInfo.project.name}-article-state.png`),
      fullPage: false,
    });

    await page.getByRole("button", { name: "Next story", exact: true }).first().click();
    await expect(page.locator("h2")).toContainText(/chipmaker/i);
    await expect(hero.getByText("Topic visual fallback", { exact: true })).toBeVisible();
    await expect(hero.getByText(/Live|Today|Past 48h/).first()).toBeVisible();
    await expect(hero.getByText("Markets desk", { exact: true })).toBeVisible();
    if (!testInfo.project.name.includes("mobile")) {
      await expect(hero.getByText("Economic signal", { exact: true })).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);

    await page.screenshot({
      path: testInfo.outputPath(`headline-flow-${testInfo.project.name}-fallback-state.png`),
      fullPage: false,
    });
  });

  test("exposes accessible navigation, selection state, and drawer controls", async ({ page }) => {
    await loadFixtureBriefing(page);

    const skipLink = page.getByRole("link", { name: "Skip to current story", exact: true });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#headline-flow-current-story")).toBeFocused();

    const viewNav = page.getByRole("navigation", { name: "Headline Flow views", exact: true });
    await expect(viewNav).toBeVisible();
    await expect(viewNav.getByRole("button", { name: "Flow", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Fixture", exact: true })).toHaveAttribute("aria-pressed", "true");
    const queue = page.getByTestId("headline-flow-queue");
    await expect(queue.getByRole("button", { name: /select story 2:/i }).first()).toBeVisible();

    await page.getByRole("button", { name: "Technology", exact: true }).click();
    await expect(page.getByRole("button", { name: "Technology", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("progressbar", { name: "Narration progress", exact: true })).toHaveAttribute("aria-valuenow", /\d+/);

    await page.getByRole("button", { name: "Tell me more", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Story details", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("tablist", { name: "Story detail sections", exact: true })).toBeVisible();
    await expect(dialog.getByRole("tab", { name: "Timeline", exact: true })).toHaveAttribute("aria-selected", "true");
    await dialog.getByRole("tab", { name: "Sources", exact: true }).click();
    await expect(dialog.getByRole("tab", { name: "Sources", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "headline-flow-detail-tab-sources");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Story details", exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("supports queue navigation, saved stories, detail drawer, and diagnostics", async ({ page }) => {
    await loadFixtureBriefing(page);

    const initialHeadline = await page.locator("h2").innerText();
    await page.getByRole("button", { name: "Next story", exact: true }).first().click();
    await expect.poll(async () => page.locator("h2").innerText()).not.toBe(initialHeadline);

    const saveButton = page.locator("section").getByRole("button", { name: /save this|saved/i }).first();
    if ((await saveButton.innerText()).match(/save this/i)) {
      await saveButton.click();
    }
    await expect(page.locator("section").getByRole("button", { name: "Saved", exact: true })).toBeVisible();

    await page.getByRole("navigation").getByRole("button", { name: "Saved", exact: true }).click();
    await expect(page.getByText("Saved Stories", { exact: true })).toBeVisible();
    await expect(page.getByText("Event Library", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Muted", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Resolved", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Detail", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Tell me more", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Story details", exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("tab", { name: "Timeline", exact: true })).toBeVisible();
    await expect(dialog.getByText("Continuity", { exact: true })).toBeVisible();
    await expect(dialog.getByText(/event status/i)).toBeVisible();

    await dialog.getByRole("tab", { name: "Overview", exact: true }).click();
    await expect(dialog.getByText("Event controls", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: /save event|unsave event/i }).click();
    await expect(dialog.getByText("Event preference updated.", { exact: true })).toBeVisible();

    await expect(dialog.getByRole("tab", { name: "Sources", exact: true })).toBeVisible();
    await dialog.getByRole("tab", { name: "Sources", exact: true }).click();
    await expect(dialog.locator('a[aria-label^="Open "]').first()).toBeVisible();

    await dialog.getByRole("tab", { name: "Why", exact: true }).click();
    await expect(dialog.getByText("Why it matters", { exact: true })).toBeVisible();

    await dialog.getByRole("tab", { name: "Diagnostics", exact: true }).click();
    await expect(dialog.getByText("Topic coverage", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Ranking audit", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Story score", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Interaction analytics", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "24h", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "7d", exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "all", exact: true })).toBeVisible();
    await expect(dialog.getByText(/Retention:/)).toBeVisible();
    await expect(dialog.getByText("Images", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Links", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Parsed", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Resolved", { exact: true })).toBeVisible();

    await dialog.getByRole("button", { name: "Close story details", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Story details", exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
});
