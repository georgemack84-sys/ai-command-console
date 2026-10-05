import { expect, test } from "@playwright/test";
import { hasDatabaseAccess, loginAsShowcaseAdmin } from "../../playwright/helpers/auth";

test("a manager can intake, review, retrieve, supersede, and inspect an evidence-bound Vault discovery", async ({ page }) => {
  test.setTimeout(90_000);
  const databaseReady = await hasDatabaseAccess(page);
  test.skip(!databaseReady, "Database-backed Nuru Vault governance is required for this workflow.");

  const suffix = crypto.randomUUID();
  const sourceName = `Vault E2E source ${suffix}`;
  const firstInterpretation = `Initial governed discovery ${suffix}`;
  const successorInterpretation = `Superseding governed discovery ${suffix}`;
  await loginAsShowcaseAdmin(page, "/nuru/vault");
  const sameOriginHeaders = { origin: new URL(page.url()).origin };

  const registered = await page.request.post("/api/nuru/source-registry", { headers: sameOriginHeaders, data: { name: sourceName, category: "DOCUMENTATION", topics: ["vault-e2e"], ingestionMethods: ["MANUAL"], refreshPolicy: "ON_DEMAND" } });
  expect(registered.status(), await registered.text()).toBe(201);
  const sourceId = (await registered.json() as { data: { source: { id: string } } }).data.source.id;
  const approved = await page.request.patch(`/api/nuru/source-registry/${encodeURIComponent(sourceId)}/review`, { headers: sameOriginHeaders, data: { action: "APPROVE", reason: "Approved controlled source for the Vault acceptance workflow." } });
  expect(approved.status(), await approved.text()).toBe(200);

  const intake = async (interpretation: string, locator: string) => {
    const response = await page.request.post("/api/nuru/vault/intake", { headers: sameOriginHeaders, data: { sourceRegistryId: sourceId, acquisitionMethod: "MANUAL", sourceContent: `Controlled source content for ${interpretation}.`, sourceClassification: "PUBLIC", evidence: { locator, content: `Controlled evidence for ${interpretation}.`, classification: "PUBLIC" }, candidate: { interpretation, confidence: 0.91, classification: "PUBLIC" } } });
    expect(response.status()).toBe(201);
    return (await response.json() as { data: { candidate: { id: string } } }).data.candidate.id;
  };
  const approve = async (candidateId: string, rationale: string, supersedesRecordId?: string) => {
    const response = await page.request.post("/api/nuru/vault/review", { headers: sameOriginHeaders, data: { candidateId, rationale, ...(supersedesRecordId ? { supersedesRecordId } : {}) } });
    expect(response.status()).toBe(201);
    return (await response.json() as { data: { record?: { id: string }; successor?: { id: string } } }).data;
  };

  const firstCandidateId = await intake(firstInterpretation, `fixture://vault-e2e/${suffix}/first`);
  const queue = await page.request.get("/api/nuru/vault/review");
  expect(queue.ok()).toBeTruthy();
  expect((await queue.json() as { data: { candidates: Array<{ id: string; evidence: Array<{ locator: string }> }> } }).data.candidates).toEqual(expect.arrayContaining([expect.objectContaining({ id: firstCandidateId, evidence: [expect.objectContaining({ locator: `fixture://vault-e2e/${suffix}/first` })] })]));
  const firstApproval = await approve(firstCandidateId, "The retained source and evidence meet the controlled acceptance criteria.");
  const firstCanonicalId = firstApproval.record?.id;
  expect(firstCanonicalId).toBeTruthy();

  const eligible = await page.request.get("/api/nuru/project-decisions/eligible");
  expect(eligible.ok()).toBeTruthy();
  const approval = (await eligible.json() as { data: { approvals: Array<{ governanceDecisionId: string; candidate: { id: string } }> } }).data.approvals.find((item) => item.candidate.id === firstCandidateId);
  expect(approval).toBeTruthy();
  const projectDecision = await page.request.post("/api/nuru/project-decisions", { headers: sameOriginHeaders, data: { project: "NURU", question: `Lifecycle decision ${suffix}`, decision: "Use governed build packages.", rationale: "E2E governed project-memory proof.", alternatives: [], candidateId: firstCandidateId, governanceDecisionId: approval?.governanceDecisionId } });
  expect(projectDecision.status(), await projectDecision.text()).toBe(201);
  const projectDecisionId = (await projectDecision.json() as { data: { decision: { id: string } } }).data.decision.id;
  const requirement = await page.request.post("/api/nuru/project-requirements", { headers: sameOriginHeaders, data: { project: "NURU", title: `Lifecycle requirement ${suffix}`, description: "Trace the execution lifecycle.", priority: "HIGH", acceptanceCriteria: ["Package can start only after readiness."], projectDecisionId, implementationRefs: [], testRefs: ["tests/e2e/nuru-vault-governed-lifecycle.spec.ts"], implementationStatus: "IN_PROGRESS", candidateId: firstCandidateId, governanceDecisionId: approval?.governanceDecisionId } });
  expect(requirement.status(), await requirement.text()).toBe(201);
  const requirementId = (await requirement.json() as { data: { requirement: { id: string } } }).data.requirement.id;
  const buildPackage = await page.request.post("/api/nuru/codex-build-packages", { headers: sameOriginHeaders, data: { project: "NURU", objective: `Lifecycle package ${suffix}`, requirementIds: [requirementId], expectedFiles: [], interfaces: [], testRefs: ["tests/e2e/nuru-vault-governed-lifecycle.spec.ts"], migrationNotes: [], dependencies: [], exitCriteria: ["Lifecycle passes."], verificationCommands: ["npx vitest run"], candidateId: firstCandidateId, governanceDecisionId: approval?.governanceDecisionId } });
  expect(buildPackage.status(), await buildPackage.text()).toBe(201);
  const buildPackageId = (await buildPackage.json() as { data: { package: { id: string } } }).data.package.id;
  const start = await page.request.post(`/api/nuru/codex-build-packages/${encodeURIComponent(buildPackageId)}/start`, { headers: sameOriginHeaders, data: { branch: `codex/e2e-${suffix}` } });
  expect(start.status(), await start.text()).toBe(201);
  const ledger = await page.request.post("/api/nuru/implementation-ledger", { headers: sameOriginHeaders, data: { buildPackageId, branch: `codex/e2e-${suffix}`, commandsExecuted: ["npx vitest run"], testsExecuted: ["governed lifecycle"], migrationStatus: "NOT_REQUIRED", qualificationStatus: "QUALIFIED", knownLimitations: [], recordedBy: "human:e2e" } });
  expect(ledger.status(), await ledger.text()).toBe(201);

  const successorCandidateId = await intake(successorInterpretation, `fixture://vault-e2e/${suffix}/successor`);
  const successorApproval = await approve(successorCandidateId, "This newer retained evidence replaces the current canonical discovery.", firstCanonicalId);
  const successorCanonicalId = successorApproval.successor?.id;
  expect(successorCanonicalId).toBeTruthy();

  const discoveries = await page.request.get("/api/nuru/vault/discoveries");
  expect(discoveries.ok()).toBeTruthy();
  expect((await discoveries.json() as { data: { discoveries: Array<{ canonicalRecordId: string; interpretation: string; version: number }> } }).data.discoveries).toEqual(expect.arrayContaining([expect.objectContaining({ canonicalRecordId: successorCanonicalId, interpretation: successorInterpretation, version: 2 })]));
  const timeline = await page.request.get(`/api/nuru/vault/timeline/${encodeURIComponent(successorCanonicalId!)}`);
  expect(timeline.ok()).toBeTruthy();
  expect((await timeline.json() as { data: { events: Array<{ type: string }> } }).data.events.map((event) => event.type)).toContain("RECORD_SUPERSEDED");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Nuru Vault" })).toBeVisible();
  const discovery = page.getByText(successorInterpretation, { exact: true }).locator("xpath=ancestor::article[1]");
  await expect(discovery).toBeVisible({ timeout: 30_000 });
  await discovery.getByRole("button", { name: "View trail" }).click();
  await expect(page.getByText(/immutable provenance trail/i)).toBeVisible();
  await expect(page.getByText(/record superseded/i)).toBeVisible();
});
