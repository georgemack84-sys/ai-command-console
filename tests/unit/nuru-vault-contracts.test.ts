import { describe, expect, it } from "vitest";
import { canonicalRecordSchema, governanceDecisionSchema, projectDecisionSchema, projectRequirementSchema, vaultCandidateSchema, vaultEvidenceSchema, vaultRecordSchema, vaultSchemaVersion, vaultSourceSchema } from "@/src/nuru/vault-contracts";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const hash = `sha256:${"a".repeat(64)}`;
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };

describe("Nuru Vault v1 contracts", () => {
  it("accepts a versioned source-to-evidence-to-candidate chain", () => {
    const source = vaultSourceSchema.parse({ ...envelope, id: "source-1", kind: "SOURCE", origin: "Open Library", authority: "HIGH", policyVersion: "source-policy/v1", retrievedAt: createdAt, contentHash: hash });
    const evidence = vaultEvidenceSchema.parse({ ...envelope, id: "evidence-1", kind: "EVIDENCE", sourceId: source.id, locator: "https://example.test/record/1", capturedAt: createdAt, contentHash: hash });
    const candidate = vaultCandidateSchema.parse({ ...envelope, id: "candidate-1", kind: "CANDIDATE", evidenceIds: [evidence.id], interpretation: "A discovery candidate grounded in captured source material.", confidence: 0.8, producedBy: "nuru.discovery.v1", status: "PROPOSED" });

    expect(vaultRecordSchema.parse(candidate)).toMatchObject({ kind: "CANDIDATE", evidenceIds: ["evidence-1"] });
  });

  it("rejects an unversioned or unprovenanced candidate", () => {
    expect(vaultCandidateSchema.safeParse({ ...envelope, schemaVersion: "nuru.vault/v0", id: "candidate-1", kind: "CANDIDATE", evidenceIds: [], interpretation: "Unsupported", confidence: 0.5, producedBy: "agent", status: "PROPOSED" }).success).toBe(false);
  });

  it("requires recorded human approval for canonical approval", () => {
    expect(governanceDecisionSchema.safeParse({ ...envelope, id: "decision-1", kind: "GOVERNANCE_DECISION", candidateId: "candidate-1", outcome: "APPROVED", decidedBy: "nuru.governance.v1", decidedAt: createdAt, rationale: "Policy passed.", requiredHumanReview: true }).success).toBe(false);
  });

  it("requires a successor when a canonical record is superseded", () => {
    expect(canonicalRecordSchema.safeParse({ ...envelope, id: "record-1", kind: "CANONICAL_RECORD", candidateId: "candidate-1", governanceDecisionId: "decision-1", version: 1, status: "SUPERSEDED" }).success).toBe(false);
    expect(canonicalRecordSchema.safeParse({ ...envelope, id: "record-1", kind: "CANONICAL_RECORD", candidateId: "candidate-1", governanceDecisionId: "decision-1", version: 1, status: "SUPERSEDED", supersededById: "record-2" }).success).toBe(true);
  });

  it("requires a governed successor link when a project decision is superseded", () => {
    expect(projectDecisionSchema.safeParse({ ...envelope, id: "decision-record-1", kind: "PROJECT_DECISION", project: "NURU", question: "Question", decision: "Decision", rationale: "Rationale", alternatives: [], candidateId: "candidate-1", governanceDecisionId: "decision-1", decidedAt: createdAt, version: 1, status: "SUPERSEDED" }).success).toBe(false);
  });

  it("requires acceptance criteria for a traceable project requirement", () => {
    expect(projectRequirementSchema.safeParse({ ...envelope, id: "requirement-1", kind: "PROJECT_REQUIREMENT", project: "NURU", title: "Traceability", description: "Requirement traceability.", priority: "HIGH", acceptanceCriteria: [], projectDecisionId: "project-decision-1", implementationRefs: [], testRefs: [], implementationStatus: "PLANNED", candidateId: "candidate-1", governanceDecisionId: "decision-1", version: 1, status: "CURRENT" }).success).toBe(false);
  });
});
