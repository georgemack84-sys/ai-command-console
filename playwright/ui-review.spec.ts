import { test, type Page } from "@playwright/test";

async function signUpAndAuthenticate(page: Page) {
  const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await page.request.post("/api/auth/signup", {
    data: {
      name: `Playwright ${seed}`,
      email: `playwright-${seed}@example.com`,
      password: "playwright-password",
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to authenticate test user for ${page.url() || "requested route"}`);
  }
}

const routes = [
  { slug: "home", path: "/" },
  { slug: "dashboard", path: "/dashboard" },
  { slug: "console", path: "/console" },
  { slug: "briefs", path: "/briefs" },
  { slug: "reports", path: "/reports" },
  { slug: "auth", path: "/auth" },
];

test.describe("desktop visual review captures", () => {
  for (const route of routes) {
    test(`capture ${route.slug}`, async ({ page }, testInfo) => {
      if (route.slug === "briefs" || route.slug === "reports") {
        await signUpAndAuthenticate(page);
      }
      await page.goto(route.path, { waitUntil: route.slug === "console" ? "domcontentloaded" : "networkidle" });
      if (route.slug === "console") {
        await page.getByText(/operations console/i).waitFor();
      }
      await page.screenshot({
        path: testInfo.outputPath(`${route.slug}.png`),
        fullPage: true,
      });
    });
  }
});
