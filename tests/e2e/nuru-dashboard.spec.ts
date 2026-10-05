import { expect, test } from "@playwright/test";

const firstCandidate = { id: "hidden-machines", title: "Hidden Machines: A History of Everyday Systems", type: "article", sourceFamily: "example.org", sourceUrl: "https://example.org/hidden-machines", topics: ["systems", "history"], confidence: 0.91 };
const secondCandidate = { id: "signal-gardens", title: "Signal Gardens", type: "documentary", sourceFamily: "example.org", sourceUrl: "https://example.org/signal-gardens", topics: ["ecology", "systems"], confidence: 0.87 };

test("a personal edition can be searched, saved, and revisited", async ({ page }) => {
  let saved = false;
  const edition = { persisted: true, repeated: false, edition: { editionDate: "2026-09-17T00:00:00.000Z", rankingVersion: "personal-edition-v1", items: [
    { position: 1, lane: "FAMILIAR", score: 82, explanation: "A source-backed connection to your stated curiosity.", candidate: firstCandidate },
    { position: 2, lane: "ADJACENT", score: 74, explanation: "A careful step beyond your current interests.", candidate: secondCandidate },
  ] } };

  await page.route("**/api/nuru/discover/personal-edition", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: edition }) }));
  await page.route("**/api/nuru/discover/emerging-interests", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: { hypotheses: [] } }) }));
  await page.route("**/api/nuru/discover/personal-edition/feedback", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ candidateId: firstCandidate.id, action: "SAVE" });
    saved = true;
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: {} }) });
  });
  await page.route("**/api/nuru/discover/personal-edition/saved", async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: { discoveries: saved ? [{ candidate: firstCandidate, savedAt: "2026-09-17T12:00:00.000Z" }] : [] } }) }));

  await page.goto("/nuru", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/nuru\/discover$/);
  await expect(page.getByRole("heading", { name: /What you didn.t know/i })).toBeVisible();
  await page.getByLabel("Search this edition").fill("Signal");
  await expect(page.getByRole("heading", { name: secondCandidate.title })).toBeVisible();
  await page.getByLabel("Search this edition").fill("");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByRole("status")).toContainText("Saved.");
  await page.goto("/nuru/discover/saved", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Saved discoveries" })).toBeVisible();
  await expect(page.getByRole("heading", { name: firstCandidate.title })).toBeVisible();
});

test("a discovery detail separates source facts from Nuru's explanation and records a structured reason", async ({ page }) => {
  const detail = {
    candidate: { ...firstCandidate, description: "A source-backed history of the systems that shape ordinary life." },
    sourceFacts: { sourceFamily: firstCandidate.sourceFamily, sourceUrl: firstCandidate.sourceUrl, topics: firstCandidate.topics, confidence: firstCandidate.confidence },
    nuruInterpretation: { lane: "FAMILIAR", score: 82, explanation: "Connected to your Taste Map through systems." },
    nextDirections: [],
    rabbitHole: [{ candidate: firstCandidate, parentId: null, sharedTopics: [] }],
  };
  await page.route(`**/api/nuru/discover/personal-edition/items/${firstCandidate.id}`, async (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: detail }) }));
  await page.route("**/api/nuru/discover/personal-edition/feedback", async (route) => {
    expect(route.request().postDataJSON()).toMatchObject({ candidateId: firstCandidate.id, action: "SAVE", reasonCode: "PROCESS" });
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true, data: {} }) });
  });

  await page.goto(`/nuru/discover/edition/${firstCandidate.id}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: firstCandidate.title })).toBeVisible();
  await expect(page.getByText("Why Nuru chose this")).toBeVisible();
  await expect(page.getByText("Source facts")).toBeVisible();
  await page.getByRole("button", { name: /^Save$/ }).click();
  await page.getByRole("button", { name: "The process" }).click();
  await expect(page.getByRole("status")).toContainText("Saved as explicit evidence");
});
