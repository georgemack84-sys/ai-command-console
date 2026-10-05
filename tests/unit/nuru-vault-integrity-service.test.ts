import { describe, expect, it } from "vitest";
import { NuruVaultIntegrityService, VaultIntegrityError, type VaultSourcePolicy } from "@/src/server/services/nuru-vault-integrity-service";
import { vaultSchemaVersion } from "@/src/nuru/vault-contracts";

const createdAt = "2026-09-30T12:00:00.000Z";
const correlationId = "c8d1df9a-ae91-4ea3-8718-9df8d6e9bc36";
const policy: VaultSourcePolicy = { version: "source-policy/v1", allowedOrigins: ["Nuru fixture library"], allowedAuthorities: ["HIGH", "OWNER"] };
const envelope = { schemaVersion: vaultSchemaVersion, classification: "PUBLIC" as const, createdAt, correlationId };

function captureFixtureSource() {
  return NuruVaultIntegrityService.captureSource({ ...envelope, id: "source-fixture-1", kind: "SOURCE", origin: "Nuru fixture library", authority: "HIGH", policyVersion: policy.version, retrievedAt: createdAt, contentHash: "sha256:ignored", content: "A fixed fixture document for the Vault." }, policy);
}

describe("Nuru Vault integrity service", () => {
  it("captures fixture source and evidence with deterministic content hashes", () => {
    const source = captureFixtureSource();
    const evidence = NuruVaultIntegrityService.captureEvidence({ ...envelope, id: "evidence-fixture-1", kind: "EVIDENCE", sourceId: "incorrect-id", locator: "fixture://document#paragraph-1", capturedAt: createdAt, contentHash: "sha256:ignored", content: "A fixed fixture document for the Vault." }, source);

    expect(source.contentHash).toBe("sha256:a7f75db844cbdfcedeadfa9298f03cfbb638ff1f5021f310c8cbba2523c23431");
    expect(evidence).toMatchObject({ sourceId: source.id, contentHash: source.contentHash });
  });

  it("rejects captures that violate the active source policy", () => {
    expect(() => NuruVaultIntegrityService.captureSource({ ...envelope, id: "source-2", kind: "SOURCE", origin: "Unapproved source", authority: "HIGH", policyVersion: policy.version, retrievedAt: createdAt, contentHash: "sha256:ignored", content: "fixture" }, policy)).toThrow(VaultIntegrityError);
  });

  it("preserves classification and correlation through evidence and candidate provenance", () => {
    const source = captureFixtureSource();
    const evidence = NuruVaultIntegrityService.captureEvidence({ ...envelope, id: "evidence-private", classification: "PRIVATE", kind: "EVIDENCE", sourceId: source.id, locator: "fixture://private", capturedAt: createdAt, contentHash: "sha256:ignored", content: "private fixture" }, source);
    expect(() => NuruVaultIntegrityService.validateCandidateProvenance({ ...envelope, id: "candidate-public", kind: "CANDIDATE", evidenceIds: [evidence.id], interpretation: "A public interpretation.", confidence: 0.6, producedBy: "nuru.fixture", status: "PROPOSED" }, [evidence])).toThrow(/less restricted/i);
    expect(() => NuruVaultIntegrityService.validateCandidateProvenance({ ...envelope, id: "candidate-wrong-correlation", classification: "PRIVATE", correlationId: "e1c2d3f4-7d22-4d7c-90ab-1f1d7ba1f8ab", kind: "CANDIDATE", evidenceIds: [evidence.id], interpretation: "A private interpretation.", confidence: 0.6, producedBy: "nuru.fixture", status: "PROPOSED" }, [evidence])).toThrow(/correlation/i);
  });
});
