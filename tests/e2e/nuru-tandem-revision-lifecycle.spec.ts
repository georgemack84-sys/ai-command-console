import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "../../playwright/helpers/auth";

test("a governor can review a Tandem revision lifecycle from request to approval", async ({ page }) => {
  const databaseReady = await hasDatabaseAccess(page);
  test.skip(!databaseReady, "Database-backed Nuru governance is required for this workflow.");

  const suffix = crypto.randomUUID();
  const originalCandidateId = `e2e-revision-original-${suffix}`;
  const revisedCandidateId = `e2e-revision-revised-${suffix}`;
  const subject = `E2E governed revision ${suffix}`;
  const observedAt = new Date().toISOString();
  const candidate = (candidateId: string, revisionOfCandidateId?: string) => ({
    candidateId,
    revisionOfCandidateId,
    missionId: "tandem-e2e-governed-revision",
    originatingSystem: "Tandem E2E",
    subject,
    proposedClaims: [{ text: "This controlled browser test verifies the governed Tandem revision lifecycle.", confidence: 0.95 }],
    entities: ["Nuru Tandem E2E"],
    evidence: [{ referenceId: `e2e-evidence-${suffix}`, detail: "Controlled browser-test evidence for a governed revision lifecycle." }],
    sources: [{ sourceType: "HUMAN_INPUT", origin: "Nuru Tandem E2E operator", authority: "OWNER" }],
    eventTime: observedAt,
    observedAt,
    significance: "LOW",
    reasonForPreservation: "Exercises the governed revision workflow without changing existing knowledge.",
    provenance: { missionContextPackageIds: [], correlationId: `e2e-${suffix}` },
  });

  await loginAsShowcaseAdmin(page, "/nuru/tandem-candidates");
  const originalResponse = await page.request.post("/api/tandem/knowledge-candidates", { data: candidate(originalCandidateId) });
  expect(originalResponse.ok()).toBeTruthy();
  const original = await originalResponse.json() as { data: { curationProposalId: string } };

  await page.reload({ waitUntil: "domcontentloaded" });
  const originalCard = page.getByText(subject, { exact: true }).locator("xpath=ancestor::li[1]");
  await originalCard.getByLabel("Decision reason").fill("Please provide a distinct revised candidate for the acceptance workflow.");
  await originalCard.getByRole("button", { name: "Request revision" }).click();
  await expect(originalCard).toContainText("REQUEST CHANGES");

  const feedbackResponse = await page.request.get(`/api/tandem/knowledge-candidates/${originalCandidateId}/feedback`);
  expect(feedbackResponse.ok()).toBeTruthy();
  expect((await feedbackResponse.json() as { data: { revisionRequested: boolean } }).data.revisionRequested).toBe(true);

  const revisedResponse = await page.request.post("/api/tandem/knowledge-candidates", { data: candidate(revisedCandidateId, originalCandidateId) });
  expect(revisedResponse.ok()).toBeTruthy();
  await page.reload({ waitUntil: "domcontentloaded" });
  const revisedCard = page.getByText(subject, { exact: true }).first().locator("xpath=ancestor::li[1]");
  await revisedCard.getByLabel("Decision reason").fill("The linked revision satisfies the governed acceptance criteria.");
  await revisedCard.getByRole("button", { name: "Approve" }).click();
  await expect(revisedCard).toContainText("APPROVED");

  await expect(originalCard.getByLabel("Candidate lifecycle")).toContainText("Original submission · REQUEST CHANGES");
  await expect(originalCard.getByLabel("Candidate lifecycle")).toContainText("Revision submitted · APPROVED");
  await expect(originalCard.getByLabel("Candidate lifecycle")).toContainText(`revises ${originalCandidateId}`);
  expect(original.data.curationProposalId).toBeTruthy();
});
