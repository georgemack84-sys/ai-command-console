import { describe, expect, it } from "vitest";
import { type VaultRecord, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultTimelineService } from "@/src/server/services/nuru-vault-timeline-service";

const at = "2026-09-30T12:00:00.000Z"; const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const ledger: VaultRecord[] = [
  { schemaVersion: vaultSchemaVersion, id: "source-1", kind: "SOURCE", classification: "PUBLIC", createdAt: at, correlationId, origin: "Fixture source", authority: "HIGH", policyVersion: "policy-1", retrievedAt: at, contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  { schemaVersion: vaultSchemaVersion, id: "evidence-1", kind: "EVIDENCE", classification: "PUBLIC", createdAt: at, correlationId, sourceId: "source-1", locator: "fixture://source-1#claim", capturedAt: at, contentHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
  { schemaVersion: vaultSchemaVersion, id: "candidate-1", kind: "CANDIDATE", classification: "PUBLIC", createdAt: at, correlationId, evidenceIds: ["evidence-1"], interpretation: "Fixture interpretation", confidence: 0.8, producedBy: "nuru.discovery.v1", status: "PROPOSED" },
  { schemaVersion: vaultSchemaVersion, id: "decision-1", kind: "GOVERNANCE_DECISION", classification: "PUBLIC", createdAt: at, correlationId, candidateId: "candidate-1", outcome: "APPROVED", decidedBy: "human:owner", decidedAt: at, rationale: "Retained evidence was reviewed.", requiredHumanReview: true, humanApprovalId: "approval-1" },
  { schemaVersion: vaultSchemaVersion, id: "canonical-1", kind: "CANONICAL_RECORD", classification: "PUBLIC", createdAt: at, correlationId, candidateId: "candidate-1", governanceDecisionId: "decision-1", version: 1, status: "CURRENT" },
  { schemaVersion: vaultSchemaVersion, id: "audit-1", kind: "AUDIT_EVENT", classification: "PUBLIC", createdAt: at, correlationId, eventType: "CANONICAL_PROMOTED", actor: "nuru.vault.governance.v1", resourceId: "canonical-1", occurredAt: at, reason: "Promotion recorded." },
];

describe("Nuru Vault timeline", () => {
  it("filters cross-record events by correlation, classification, and event type", async () => {
    const events = await NuruVaultTimelineService.search({ correlationId, classification: "PUBLIC", eventType: "DECISION_RECORDED" }, { readVaultRecords: async () => ledger });
    expect(events).toEqual([expect.objectContaining({ id: "decision-1", type: "DECISION_RECORDED", correlationId })]);
  });

  it("follows retained evidence links when filtering events by source", async () => {
    const events = await NuruVaultTimelineService.search({ sourceId: "source-1" }, { readVaultRecords: async () => ledger });
    expect(events.map((event) => event.type)).toEqual(expect.arrayContaining(["SOURCE_CAPTURED", "EVIDENCE_CAPTURED", "CANDIDATE_PROPOSED", "DECISION_RECORDED", "CANONICAL_PROMOTED"]));
    expect(events).toEqual(expect.arrayContaining([expect.objectContaining({ id: "canonical-1", sourceOrigins: ["Fixture source"] })]));
  });

  it("lists retained sources by human-readable origin for explorer selection", async () => {
    await expect(NuruVaultTimelineService.listSources({ readVaultRecords: async () => ledger })).resolves.toEqual([expect.objectContaining({ id: "source-1", origin: "Fixture source", authority: "HIGH" })]);
  });

  it("reconstructs source, evidence, candidate, human decision, and promotion from the immutable ledger", async () => {
    const result = await NuruVaultTimelineService.forCanonicalRecord("canonical-1", { readVaultRecords: async () => ledger });
    expect(result).toMatchObject({ canonicalRecord: { id: "canonical-1", status: "CURRENT" }, correlationId });
    expect(result.events.map((event) => event.type)).toEqual(expect.arrayContaining(["SOURCE_CAPTURED", "EVIDENCE_CAPTURED", "CANDIDATE_PROPOSED", "DECISION_RECORDED", "CANONICAL_PROMOTED"]));
  });
});
