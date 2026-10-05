import { describe, expect, it } from "vitest";
import { type CanonicalRecord, type VaultAuditEvent, type VaultCandidate, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultCanonicalPromotionService, type VaultCanonicalStore } from "@/src/server/services/nuru-vault-canonical-promotion-service";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };
const candidate: VaultCandidate = { ...envelope, id: "candidate-1", kind: "CANDIDATE", evidenceIds: ["evidence-1"], interpretation: "A governed interpretation.", confidence: 0.9, producedBy: "nuru.discovery.v1", status: "PROPOSED" };
const approvedDecision = { ...envelope, id: "decision-1", kind: "GOVERNANCE_DECISION" as const, candidateId: candidate.id, outcome: "APPROVED" as const, decidedBy: "nuru.governance.v1", decidedAt: createdAt, rationale: "Evidence and policy requirements passed.", requiredHumanReview: true, humanApprovalId: "approval-1" };

function memoryStore() {
  const records: CanonicalRecord[] = [];
  const audits: VaultAuditEvent[] = [];
  const supersessions: Array<{ previous: CanonicalRecord; snapshot: CanonicalRecord; successor: CanonicalRecord }> = [];
  const store: VaultCanonicalStore = { appendPromotion: async (_decision, record, event) => { records.push(record); audits.push(event); }, appendSupersession: async (_decision, previous, snapshot, successor, event) => { supersessions.push({ previous, snapshot, successor }); audits.push(event); } };
  return { records, audits, supersessions, store };
}

describe("Nuru Vault canonical promotion", () => {
  it("promotes only an approved decision and creates an append-only audit fact", async () => {
    const memory = memoryStore();
    const result = await NuruVaultCanonicalPromotionService.promote({ candidate, decision: approvedDecision, canonicalRecordId: "canonical-1" }, memory.store);

    expect(result.record).toMatchObject({ status: "CURRENT", version: 1, candidateId: candidate.id });
    expect(memory.records).toEqual([result.record]);
    expect(memory.audits).toEqual([result.auditEvent]);
  });

  it("fails closed before writes when governance has not approved the candidate", async () => {
    const memory = memoryStore();
    await expect(NuruVaultCanonicalPromotionService.promote({ candidate, decision: { ...approvedDecision, outcome: "HOLD" }, canonicalRecordId: "canonical-1" }, memory.store)).rejects.toMatchObject({ code: "DECISION_NOT_APPROVED" });
    expect(memory.records).toHaveLength(0);
    expect(memory.audits).toHaveLength(0);
  });

  it("preserves the former record in a supersession snapshot and defaults the successor to current", async () => {
    const memory = memoryStore();
    const current: CanonicalRecord = { ...envelope, id: "canonical-1", kind: "CANONICAL_RECORD", candidateId: "candidate-old", governanceDecisionId: "decision-old", version: 1, status: "CURRENT" };
    const result = await NuruVaultCanonicalPromotionService.supersede({ candidate, decision: approvedDecision, canonicalRecordId: "canonical-2", currentRecord: current }, memory.store);

    expect(result.supersededRecord).toMatchObject({ id: current.id, status: "SUPERSEDED", supersededById: result.successor.id });
    expect(result.successor).toMatchObject({ id: "canonical-2", status: "CURRENT", version: 2 });
    expect(memory.supersessions).toHaveLength(1);
    expect(memory.audits[0]).toMatchObject({ eventType: "RECORD_SUPERSEDED" });
  });
});
