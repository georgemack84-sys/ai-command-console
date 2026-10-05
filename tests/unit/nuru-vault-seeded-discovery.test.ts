import { describe, expect, it } from "vitest";
import { type CanonicalRecord, type VaultAuditEvent, type VaultCandidate, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultIntegrityService, type VaultSourcePolicy } from "@/src/server/services/nuru-vault-integrity-service";
import { NuruVaultCandidateAdmissionService, type VaultCandidateAdmissionStore } from "@/src/server/services/nuru-vault-candidate-admission-service";
import { NuruVaultCanonicalPromotionService, type VaultCanonicalStore } from "@/src/server/services/nuru-vault-canonical-promotion-service";
import { NuruVaultCanonicalProjectionService, type VaultCanonicalReadStore } from "@/src/server/services/nuru-vault-canonical-projection-service";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const policy: VaultSourcePolicy = { version: "source-policy/v1", allowedOrigins: ["Nuru seeded fixture library"], allowedAuthorities: ["HIGH"] };
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };

function seededVaultStore() {
  const candidates: VaultCandidate[] = [];
  const records: CanonicalRecord[] = [];
  const audits: VaultAuditEvent[] = [];
  let revision = 0;
  const admissionStore: VaultCandidateAdmissionStore = {
    appendCandidate: async (candidate) => { candidates.push(candidate); revision += 1; },
    appendAuditEvent: async (event) => { audits.push(event); },
  };
  const canonicalStore: VaultCanonicalStore = {
    appendPromotion: async (_decision, record, event) => { records.push(record); revision += 1; audits.push(event); },
    appendSupersession: async (_decision, previous, snapshot, successor, event) => { records.splice(records.indexOf(previous), 1, snapshot, successor); revision += 1; audits.push(event); },
  };
  const readStore: VaultCanonicalReadStore = { readCanonicalState: async () => ({ revision: `fixture-${revision}`, records, candidates }) };
  return { admissionStore, canonicalStore, readStore, audits };
}

describe("Nuru Vault seeded discovery slice", () => {
  it("retrieves an evidence-bound canonical discovery without treating the interpretation as source fact", async () => {
    const store = seededVaultStore();
    const source = NuruVaultIntegrityService.captureSource({ ...envelope, id: "source-gpu-history", kind: "SOURCE", origin: "Nuru seeded fixture library", authority: "HIGH", policyVersion: policy.version, retrievedAt: createdAt, contentHash: "sha256:ignored", content: "A museum essay explains how graphics processors moved from fixed pipelines to programmable architectures." }, policy);
    const evidence = NuruVaultIntegrityService.captureEvidence({ ...envelope, id: "evidence-gpu-history", kind: "EVIDENCE", sourceId: source.id, locator: "fixture://gpu-history#programmable-pipelines", capturedAt: createdAt, contentHash: "sha256:ignored", content: "Graphics processors moved from fixed pipelines to programmable architectures." }, source);
    const candidate: VaultCandidate = { ...envelope, id: "candidate-gpu-history", kind: "CANDIDATE", evidenceIds: [evidence.id], interpretation: "A strong adjacent discovery for someone curious about how technical constraints shape creative tools.", confidence: 0.82, producedBy: "nuru.discovery.v1", status: "PROPOSED" };

    await NuruVaultCandidateAdmissionService.admit({ candidate, evidence: [evidence], submittedBy: { id: "nuru.discovery.v1", kind: "AGENT" } }, store.admissionStore);
    const decision = { ...envelope, id: "decision-gpu-history", kind: "GOVERNANCE_DECISION" as const, candidateId: candidate.id, outcome: "APPROVED" as const, decidedBy: "nuru.governance.v1", decidedAt: createdAt, rationale: "Fixture source policy and evidence chain are complete.", requiredHumanReview: true, humanApprovalId: "approval-gpu-history" };
    await NuruVaultCanonicalPromotionService.promote({ candidate, decision, canonicalRecordId: "canonical-gpu-history" }, store.canonicalStore);
    const projection = await NuruVaultCanonicalProjectionService.rebuild(store.readStore);
    const [discovery] = await NuruVaultCanonicalProjectionService.listDiscoveryView(store.readStore, projection);

    expect(discovery).toMatchObject({ canonicalRecordId: "canonical-gpu-history", candidateId: candidate.id, interpretation: candidate.interpretation });
    expect(candidate.evidenceIds).toEqual([evidence.id]);
    expect(evidence.locator).toBe("fixture://gpu-history#programmable-pipelines");
    expect(discovery.interpretation).toMatch(/adjacent discovery/i);
    expect(store.audits.map((event) => event.eventType)).toEqual(["CANDIDATE_PROPOSED", "CANONICAL_PROMOTED"]);
  });
});
