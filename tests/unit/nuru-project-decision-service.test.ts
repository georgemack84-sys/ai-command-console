import { describe, expect, it } from "vitest";
import { type ProjectDecision, type VaultAuditEvent, type VaultRecord, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruProjectDecisionService, type ProjectDecisionStore } from "@/src/server/services/nuru-project-decision-service";

const at = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const candidate = { schemaVersion: vaultSchemaVersion, id: "candidate-architecture", kind: "CANDIDATE" as const, classification: "PUBLIC" as const, createdAt: at, correlationId, evidenceIds: ["evidence-architecture"], interpretation: "Nuru must keep candidate knowledge separate from canonical knowledge.", confidence: 0.9, producedBy: "nuru.fixture", status: "APPROVED" as const };
const approval = { schemaVersion: vaultSchemaVersion, id: "governance-architecture", kind: "GOVERNANCE_DECISION" as const, classification: "PUBLIC" as const, createdAt: at, correlationId, candidateId: candidate.id, outcome: "APPROVED" as const, decidedBy: "human:owner", decidedAt: at, rationale: "The invariant protects the canonical boundary.", requiredHumanReview: true, humanApprovalId: "approval-architecture" };

function memory(): ProjectDecisionStore & { records: VaultRecord[] } {
  const records: VaultRecord[] = [candidate, approval];
  return { records, readVaultRecords: async () => records, appendProjectDecision: async (record: ProjectDecision, superseded: ProjectDecision | undefined, audit: VaultAuditEvent) => { if (superseded) records.push(superseded); records.push(record, audit); } };
}

const input = { project: "NURU", question: "Can candidates write canonical knowledge directly?", decision: "No. Candidates require an approved governance decision before becoming durable canonical knowledge.", rationale: "Candidates are evidence-bound proposals, not authority.", alternatives: ["Allow agent direct writes"], candidateId: candidate.id, governanceDecisionId: approval.id };

describe("Nuru project decision service", () => {
  it("records a project architecture decision only from human-approved candidate provenance", async () => {
    const store = memory();
    const record = await NuruProjectDecisionService.record(input, store);
    expect(record).toMatchObject({ project: "NURU", version: 1, status: "CURRENT", candidateId: candidate.id, governanceDecisionId: approval.id });
    await expect(NuruProjectDecisionService.listCurrent("NURU", store)).resolves.toEqual([expect.objectContaining({ id: record.id, decision: input.decision })]);
  });

  it("preserves the former decision as a superseded version", async () => {
    const store = memory();
    const first = await NuruProjectDecisionService.record(input, store);
    const successor = await NuruProjectDecisionService.record({ ...input, decision: "No. Only a human-approved candidate may become canonical.", supersedesDecisionId: first.id }, store);
    expect(successor).toMatchObject({ version: 2, status: "CURRENT" });
    expect(store.records).toEqual(expect.arrayContaining([expect.objectContaining({ id: first.id, status: "SUPERSEDED", supersededById: successor.id })]));
  });

  it("refuses to manufacture project memory without a matching governance approval", async () => {
    await expect(NuruProjectDecisionService.record({ ...input, governanceDecisionId: "missing" }, memory())).rejects.toMatchObject({ code: "GOVERNANCE_DECISION_NOT_FOUND" });
  });

  it("offers only candidates with retained human governance approval to the operator", async () => {
    await expect(NuruProjectDecisionService.listEligibleApprovals(memory())).resolves.toEqual([expect.objectContaining({ candidate: expect.objectContaining({ id: candidate.id }), governanceDecisionId: approval.id })]);
  });
});
