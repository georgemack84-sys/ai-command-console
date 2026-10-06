import { describe, expect, it } from "vitest";
import { type CanonicalRecord, type GovernanceDecision, type VaultAuditEvent, type VaultCandidate, type VaultEvidence, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultCandidateAdmissionService, type VaultCandidateAdmissionStore } from "@/src/server/services/nuru-vault-candidate-admission-service";
import { NuruVaultCanonicalPromotionService, type VaultCanonicalStore } from "@/src/server/services/nuru-vault-canonical-promotion-service";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";

const createdAt = "2026-10-06T12:00:00.000Z";
const correlationId = "a1e8ed55-2545-4a96-b8f8-d9fce0e3d266";
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };
const evidence: VaultEvidence = { ...envelope, id: "evidence-governance", kind: "EVIDENCE", sourceId: "source-governance", locator: "fixture://governance#1", capturedAt: createdAt, contentHash: `sha256:${"a".repeat(64)}` };
const candidate: VaultCandidate = { ...envelope, id: "candidate-governance", kind: "CANDIDATE", evidenceIds: [evidence.id], interpretation: "A governed qualification candidate.", confidence: 0.9, producedBy: "nuru.discovery.v1", status: "PROPOSED" };
const decision: GovernanceDecision = { ...envelope, id: "decision-governance", kind: "GOVERNANCE_DECISION", candidateId: candidate.id, outcome: "APPROVED", decidedBy: "nuru.governance.v1", decidedAt: createdAt, rationale: "Human approval and policy qualification passed.", requiredHumanReview: true, humanApprovalId: "approval-governance" };

function stores() {
  const candidates: VaultCandidate[] = []; const auditEvents: VaultAuditEvent[] = []; const canonical: CanonicalRecord[] = [];
  const admission: VaultCandidateAdmissionStore = { appendCandidate: async (item) => { candidates.push(item); }, appendAuditEvent: async (item) => { auditEvents.push(item); } };
  const promotion: VaultCanonicalStore = { appendPromotion: async (_decision, record, audit) => { canonical.push(record); auditEvents.push(audit); }, appendSupersession: async () => { throw new Error("Not used in this qualification."); } };
  return { candidates, auditEvents, canonical, admission, promotion };
}

describe("NRQ-13 governance qualification", () => {
  it("requires policy, human approval, governed admission, and governance promotion before canonical creation", async () => {
    const missingHumanApproval = NuruGovernanceGate.evaluate({ proposalId: "proposal-1", recommendation: "ACCEPT", qualityStatus: "PASS", confidence: 0.9, evidenceQuality: "STRONG", sourceAuthority: "HIGH", requiredReview: true, humanApproved: false, correlationId });
    expect(missingHumanApproval.outcome).toBe("HUMAN_REVIEW_REQUIRED");
    const approved = NuruGovernanceGate.evaluate({ proposalId: "proposal-1", recommendation: "ACCEPT", qualityStatus: "PASS", confidence: 0.9, evidenceQuality: "STRONG", sourceAuthority: "HIGH", requiredReview: true, humanApproved: true, correlationId });
    expect(approved).toMatchObject({ outcome: "APPROVED", authorizedAction: "ARCHIVE" });

    const memory = stores();
    await NuruVaultCandidateAdmissionService.admit({ candidate, evidence: [evidence], submittedBy: { id: "nuru.discovery.v1", kind: "AGENT" } }, memory.admission);
    const result = await NuruVaultCanonicalPromotionService.promote({ candidate, decision, canonicalRecordId: "canonical-governance" }, memory.promotion);
    expect(memory.candidates).toEqual([candidate]);
    expect(memory.canonical).toEqual([result.record]);
    expect(memory.auditEvents.map((event) => event.eventType)).toEqual(["CANDIDATE_PROPOSED", "CANONICAL_PROMOTED"]);
  });

  it("prevents held, agent-issued, or non-proposed paths from creating canonical knowledge", async () => {
    const memory = stores();
    await expect(NuruVaultCanonicalPromotionService.promote({ candidate, decision: { ...decision, outcome: "HOLD" }, canonicalRecordId: "canonical-held" }, memory.promotion)).rejects.toMatchObject({ code: "DECISION_NOT_APPROVED" });
    await expect(NuruVaultCanonicalPromotionService.promote({ candidate, decision: { ...decision, decidedBy: "nuru.discovery.v1" }, canonicalRecordId: "canonical-agent" }, memory.promotion)).rejects.toMatchObject({ code: "DECISION_NOT_GOVERNANCE" });
    await expect(NuruVaultCanonicalPromotionService.promote({ candidate: { ...candidate, status: "APPROVED" }, decision, canonicalRecordId: "canonical-lifecycle" }, memory.promotion)).rejects.toMatchObject({ code: "CANDIDATE_NOT_PROPOSED" });
    expect(memory.canonical).toEqual([]);
    expect(memory.auditEvents).toEqual([]);
  });
});
