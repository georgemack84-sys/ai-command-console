import { test } from "@playwright/test";
import { loginAsShowcaseAdmin } from "./helpers/auth";

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
      if (route.slug === "dashboard" || route.slug === "console" || route.slug === "briefs" || route.slug === "reports") {
        await loginAsShowcaseAdmin(page, route.path);
      }
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      if (route.slug === "console") {
        await page.getByText(/operations console/i).waitFor();
      }
      await page.screenshot({
        path: testInfo.outputPath(`${route.slug}.png`),
        fullPage: false,
      });
    });
  }
});
