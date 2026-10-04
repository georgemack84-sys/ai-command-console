import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "../../playwright/helpers/auth";

test("a governor can submit a curator pipeline proposal and approve it from the review queue", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(!(await hasDatabaseAccess(page)), "Database-backed Nuru curation is required.");
  const suffix = crypto.randomUUID(); const title = `Governed curator boundary ${suffix}`;
  await loginAsShowcaseAdmin(page, "/nuru/review");
  const headers = { origin: new URL(page.url()).origin };
  const submission = await page.request.post("/api/nuru/agents", { headers, data: { title, content: `Nuru governance policy requires the curator pipeline to retain proposals for human review before any durable archival action. ${suffix}`, project: "Nuru", source: { sourceType: "HUMAN_INPUT", origin: "Nuru E2E governor", authority: "OWNER" } } });
  expect(submission.status(), await submission.text()).toBe(201);
  const created = await submission.json() as { data: { status: string; proposal: { id: string; itemId: string }; queue: { id: string } } };
  expect(created.data).toMatchObject({ status: "HUMAN_REVIEW_REQUIRED", proposal: { id: expect.any(String) }, queue: { id: expect.any(String) } });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Nuru Review" })).toBeVisible();
  const card = page.getByRole("heading", { name: title }).locator("xpath=ancestor::article[1]");
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Proposal approved.")).toBeVisible();
  await expect(page.getByRole("heading", { name: title })).toHaveCount(0);
  const queue = await page.request.get("/api/nuru/agents");
  expect(queue.status(), await queue.text()).toBe(200);
  expect((await queue.json() as { data: Array<{ id: string; status: string; item: { id: string; status: string } }> }).data.find(proposal => proposal.id === created.data.proposal.id)).toMatchObject({ status: "APPROVED", item: { id: created.data.proposal.itemId, status: "ARCHIVED" } });
});
