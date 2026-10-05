import { z } from "zod";
import { type SourceIngestionMethod, type SourceRegistryRecord, assertSourceMayBeAcquired, sourceIngestionMethods } from "@/src/nuru/source-intelligence";
import { dataClassifications, type VaultEvidence, type VaultRecord, type VaultSource } from "@/src/nuru/vault-contracts";
import { NuruVaultCandidateAdmissionService, type VaultCandidateAdmissionStore } from "@/src/server/services/nuru-vault-candidate-admission-service";
import { NuruVaultIntegrityService } from "@/src/server/services/nuru-vault-integrity-service";

const contentSchema = z.string().min(1).max(5_000_000);
export const vaultSourceIntakeSchema = z.object({
  sourceRegistryId: z.string().trim().min(1),
  acquisitionMethod: z.enum(sourceIngestionMethods),
  sourceContent: contentSchema,
  sourceClassification: z.enum(dataClassifications),
  evidence: z.object({ locator: z.string().trim().min(1).max(2_000), content: contentSchema, classification: z.enum(dataClassifications).optional() }),
  candidate: z.object({ interpretation: z.string().trim().min(1).max(10_000), confidence: z.number().min(0).max(1), classification: z.enum(dataClassifications).optional() }),
});

export interface VaultSourceRegistryReader {
  get(id: string): Promise<SourceRegistryRecord | null>;
}

export interface VaultSourceIntakeStore extends VaultCandidateAdmissionStore {
  appendRecord(record: VaultRecord): Promise<void>;
}

export class VaultSourceIntakeError extends Error {
  constructor(public readonly code: "SOURCE_NOT_FOUND" | "WORKSPACE_MISMATCH", message: string) {
    super(message);
    this.name = "VaultSourceIntakeError";
  }
}

const authorityBySourceClass: Record<SourceRegistryRecord["authorityClass"], "LOW" | "MODERATE" | "HIGH" | "OWNER"> = { PRIMARY: "HIGH", SECONDARY: "MODERATE", COMMUNITY: "LOW", UNKNOWN: "LOW" };

function authorityFor(source: SourceRegistryRecord) {
  return authorityBySourceClass[source.authorityClass];
}

/** Converts approved Source Intelligence material into governed Vault records. */
export const NuruVaultSourceIntakeService = {
  async intake(rawRequest: z.input<typeof vaultSourceIntakeSchema>, input: { workspaceId: string; actor: string; correlationId: string }, registry: VaultSourceRegistryReader, store: VaultSourceIntakeStore) {
    const request = vaultSourceIntakeSchema.parse(rawRequest);
    const registeredSource = await registry.get(request.sourceRegistryId);
    if (!registeredSource) throw new VaultSourceIntakeError("SOURCE_NOT_FOUND", "The selected source registry record does not exist.");
    if (registeredSource.workspaceId !== input.workspaceId) throw new VaultSourceIntakeError("WORKSPACE_MISMATCH", "The selected source belongs to another workspace.");
    assertSourceMayBeAcquired(registeredSource, request.acquisitionMethod as SourceIngestionMethod);

    const createdAt = new Date().toISOString();
    const authority = authorityFor(registeredSource);
    const policy = { version: `nsi:${registeredSource.id}`, allowedOrigins: [registeredSource.name], allowedAuthorities: [authority] };
    const source: VaultSource = NuruVaultIntegrityService.captureSource({ schemaVersion: "nuru.vault/v1", id: `source:${crypto.randomUUID()}`, kind: "SOURCE", classification: request.sourceClassification, createdAt, correlationId: input.correlationId, origin: registeredSource.name, authority, policyVersion: policy.version, retrievedAt: createdAt, contentHash: "sha256:derived", content: request.sourceContent }, policy);
    const evidence: VaultEvidence = NuruVaultIntegrityService.captureEvidence({ schemaVersion: source.schemaVersion, id: `evidence:${crypto.randomUUID()}`, kind: "EVIDENCE", classification: request.evidence.classification ?? source.classification, createdAt, correlationId: input.correlationId, sourceId: source.id, locator: request.evidence.locator, capturedAt: createdAt, contentHash: "sha256:derived", content: request.evidence.content }, source);
    const candidate = NuruVaultIntegrityService.validateCandidateProvenance({ schemaVersion: source.schemaVersion, id: `candidate:${crypto.randomUUID()}`, kind: "CANDIDATE", classification: request.candidate.classification ?? evidence.classification, createdAt, correlationId: input.correlationId, evidenceIds: [evidence.id], interpretation: request.candidate.interpretation, confidence: request.candidate.confidence, producedBy: input.actor, status: "PROPOSED" }, [evidence]);

    await store.appendRecord(source);
    await store.appendRecord(evidence);
    const admission = await NuruVaultCandidateAdmissionService.admit({ candidate, evidence: [evidence], submittedBy: { id: input.actor, kind: "HUMAN" } }, store);
    return { source, evidence, ...admission };
  },
};
