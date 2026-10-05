import { describe, expect, it } from "vitest";
import { type VaultAuditEvent, type VaultCandidate, type VaultRecord, vaultSchemaVersion } from "@/src/nuru/vault-contracts";
import { NuruVaultSourceIntakeService, VaultSourceIntakeError, type VaultSourceIntakeStore } from "@/src/server/services/nuru-vault-source-intake-service";

const registrySource = { id: "registry-1", workspaceId: "workspace-1", name: "Nuru fixture publisher", domain: "fixture.test", baseUrl: "https://fixture.test/", category: "DOCUMENTATION" as const, topics: [], authorityClass: "PRIMARY" as const, ingestionMethods: ["MANUAL"] as const, refreshPolicy: "ON_DEMAND" as const, admissionState: "APPROVED" as const, operationalState: "HEALTHY" as const, enabled: true, requiresReview: false };

function memoryStore() {
  const records: VaultRecord[] = [];
  const candidates: VaultCandidate[] = [];
  const audits: VaultAuditEvent[] = [];
  const store: VaultSourceIntakeStore = { appendRecord: async (record) => { records.push(record); }, appendCandidate: async (candidate) => { candidates.push(candidate); }, appendAuditEvent: async (event) => { audits.push(event); } };
  return { records, candidates, audits, store };
}

describe("Nuru Vault source intake", () => {
  it("derives source policy from an approved in-workspace registry record", async () => {
    const memory = memoryStore();
    const result = await NuruVaultSourceIntakeService.intake({ sourceRegistryId: registrySource.id, acquisitionMethod: "MANUAL", sourceContent: "Fixture source content.", sourceClassification: "PUBLIC", evidence: { locator: "fixture://article#1", content: "Fixture evidence content." }, candidate: { interpretation: "An evidence-bound discovery.", confidence: 0.8 } }, { workspaceId: "workspace-1", actor: "human:user-1", correlationId: crypto.randomUUID() }, { get: async () => registrySource }, memory.store);

    expect(result.source).toMatchObject({ schemaVersion: vaultSchemaVersion, origin: registrySource.name, authority: "HIGH", policyVersion: `nsi:${registrySource.id}` });
    expect(memory.records.map((record) => record.kind)).toEqual(["SOURCE", "EVIDENCE"]);
    expect(memory.candidates).toEqual([result.candidate]);
    expect(memory.audits[0]).toMatchObject({ eventType: "CANDIDATE_PROPOSED" });
  });

  it("fails before writes for cross-workspace or unapproved sources", async () => {
    const memory = memoryStore();
    const request = { sourceRegistryId: registrySource.id, acquisitionMethod: "MANUAL" as const, sourceContent: "Fixture", sourceClassification: "PUBLIC" as const, evidence: { locator: "fixture://article#1", content: "Fixture" }, candidate: { interpretation: "Fixture interpretation.", confidence: 0.5 } };
    await expect(NuruVaultSourceIntakeService.intake(request, { workspaceId: "other-workspace", actor: "human:user-1", correlationId: crypto.randomUUID() }, { get: async () => registrySource }, memory.store)).rejects.toBeInstanceOf(VaultSourceIntakeError);
    await expect(NuruVaultSourceIntakeService.intake(request, { workspaceId: "workspace-1", actor: "human:user-1", correlationId: crypto.randomUUID() }, { get: async () => ({ ...registrySource, admissionState: "BLOCKED" as const }) }, memory.store)).rejects.toThrow(/blocked/i);
    expect(memory.records).toHaveLength(0);
    expect(memory.candidates).toHaveLength(0);
  });
});
