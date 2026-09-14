import { expect, test } from "@playwright/test";

const discoveries = [
  { id: "apollo-guidance-computer", kind: "Near certain", title: "Apollo Guidance Computer", meta: "Documentary · Engineering", score: 92, image: "apollo" },
  { id: "semiconductor-wars", kind: "Adjacent", title: "The Semiconductor Wars", meta: "Article · Technology", score: 81, image: "chip" },
  { id: "japanese-craftsmanship", kind: "Serendipity", title: "The Art of Japanese Craftsmanship", meta: "Video · Culture", score: 67, image: "japan" },
  { id: "octopus-intelligence", kind: "Wildcard", title: "The Secret Intelligence of Octopuses", meta: "Article · Nature", score: 58, image: "ocean" },
];

test("a visitor can search and save a Nuru discovery", async ({ page }, testInfo) => {
  await page.route("**/api/nuru/dashboard", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { discoveries, preferences: { savedDiscoveryIds: [], dismissedDiscoveryIds: [], noticeFeedback: null, affinities: {} } },
      }),
    });
  });

  await page.route("**/api/nuru/actions", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ type: "save-discovery", discoveryId: "billion-dollar-spy" });
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: { preferences: { savedDiscoveryIds: ["billion-dollar-spy"], dismissedDiscoveryIds: [], noticeFeedback: null, affinities: {} } },
      }),
    });
  });

  await page.goto("/nuru", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: /I found 7 things for you/i })).toBeVisible();
  if (testInfo.project.name === "desktop-chromium") {
    await page.getByLabel("Search discoveries").fill("semiconductor");
    await expect(page.getByRole("link", { name: /The Semiconductor Wars/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Apollo Guidance Computer/i })).toBeHidden();
  }

  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByRole("button", { name: /^Saved$/ })).toBeVisible();
});
