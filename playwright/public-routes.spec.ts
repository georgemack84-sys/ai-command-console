import { expect, test, type Page } from "@playwright/test";

async function signUpAndAuthenticate(page: Page) {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await page.request.post("/api/auth/signup", {
    data: {
      name: `Playwright ${seed}`,
      email: `playwright-${seed}@example.com`,
      password: "playwright-password",
    },
  });
  expect(response.ok()).toBeTruthy();
}

test("auth page shows the account entry flow", async ({ page }) => {
  await page.goto("/auth");
  await expect(page.getByText(/sign in to access the ai command console/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /log in/i }).first()).toBeVisible();
});

test("console page shows the live command workspace", async ({ page }) => {
  await page.goto("/console");
  await expect(page.getByText(/operations console/i)).toBeVisible();
  await expect(page.getByText(/command desk/i)).toBeVisible();
  await expect(page.getByText(/live briefing/i)).toBeVisible();
});

test("briefs page keeps the premium research intake structure", async ({ page }) => {
  await signUpAndAuthenticate(page);
  await page.goto("/briefs");
  await expect(page.getByText(/create a new brief/i)).toBeVisible();
  await expect(page.getByText(/tracked briefs/i)).toBeVisible();
  await expect(page.getByText(/research desk direction/i)).toBeVisible();
});

test("reports page keeps the editorial workflow structure", async ({ page }) => {
  await signUpAndAuthenticate(page);
  await page.goto("/reports");
  await expect(page.getByText(/create a report/i)).toBeVisible();
  await expect(page.getByText(/tracked reports/i)).toBeVisible();
  await expect(page.getByText(/ready to publish/i)).toBeVisible();
});

test("auth and console pages avoid horizontal overflow", async ({ page }) => {
  for (const route of ["/auth", "/console", "/briefs", "/reports"]) {
    if (route === "/briefs" || route === "/reports") {
      await signUpAndAuthenticate(page);
    }
    await page.goto(route, { waitUntil: route === "/console" ? "domcontentloaded" : "networkidle" });
    if (route === "/console") {
      await page.getByText(/operations console/i).waitFor();
      await page.waitForTimeout(250);
    }
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(widths.scroll).toBe(widths.viewport);
  }
});
