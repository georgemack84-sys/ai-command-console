import { describe, expect, it } from "vitest";
import { type VaultAuditEvent, type VaultCandidate, type VaultEvidence, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultCandidateAdmissionService, VaultCandidateAdmissionError, type VaultCandidateAdmissionStore } from "@/src/server/services/nuru-vault-candidate-admission-service";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };
const evidence: VaultEvidence = { ...envelope, id: "evidence-1", kind: "EVIDENCE", sourceId: "source-1", locator: "fixture://source#1", capturedAt: createdAt, contentHash: `sha256:${"a".repeat(64)}` };
const candidate: VaultCandidate = { ...envelope, id: "candidate-1", kind: "CANDIDATE", evidenceIds: [evidence.id], interpretation: "A bounded proposed interpretation.", confidence: 0.8, producedBy: "nuru.discovery.v1", status: "PROPOSED" };

function memoryStore() {
  const candidates: VaultCandidate[] = [];
  const auditEvents: VaultAuditEvent[] = [];
  const store: VaultCandidateAdmissionStore = { appendCandidate: async (item) => { candidates.push(item); }, appendAuditEvent: async (item) => { auditEvents.push(item); } };
  return { candidates, auditEvents, store };
}

describe("Nuru Vault candidate admission", () => {
  it("allows an agent to submit a proposal while the service performs the durable writes", async () => {
    const memory = memoryStore();
    const result = await NuruVaultCandidateAdmissionService.admit({ candidate, evidence: [evidence], submittedBy: { id: "nuru.discovery.v1", kind: "AGENT" } }, memory.store);

    expect(memory.candidates).toEqual([candidate]);
    expect(memory.auditEvents).toHaveLength(1);
    expect(result.auditEvent).toMatchObject({ actor: "nuru.vault.admission.v1", eventType: "CANDIDATE_PROPOSED", resourceId: candidate.id });
  });

  it("fails closed without writes for an invalid lifecycle or spoofed producer", async () => {
    const memory = memoryStore();
    await expect(NuruVaultCandidateAdmissionService.admit({ candidate: { ...candidate, status: "APPROVED" }, evidence: [evidence], submittedBy: { id: "nuru.discovery.v1", kind: "AGENT" } }, memory.store)).rejects.toMatchObject({ code: "INVALID_LIFECYCLE" } satisfies Partial<VaultCandidateAdmissionError>);
    await expect(NuruVaultCandidateAdmissionService.admit({ candidate, evidence: [evidence], submittedBy: { id: "untrusted-agent", kind: "AGENT" } }, memory.store)).rejects.toMatchObject({ code: "PRODUCER_MISMATCH" } satisfies Partial<VaultCandidateAdmissionError>);
    expect(memory.candidates).toHaveLength(0);
    expect(memory.auditEvents).toHaveLength(0);
  });

  it("fails closed without writes when evidence provenance is unavailable", async () => {
    const memory = memoryStore();
    await expect(NuruVaultCandidateAdmissionService.admit({ candidate, evidence: [], submittedBy: { id: "nuru.discovery.v1", kind: "AGENT" } }, memory.store)).rejects.toBeInstanceOf(Error);
    expect(memory.candidates).toHaveLength(0);
    expect(memory.auditEvents).toHaveLength(0);
  });
});
