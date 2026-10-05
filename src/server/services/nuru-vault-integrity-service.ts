import { createHash } from "node:crypto";
import { z } from "zod";
import { type VaultCandidate, type VaultEvidence, type VaultSource, dataClassifications, vaultCandidateSchema, vaultEvidenceSchema, vaultSourceSchema } from "@/src/nuru/vault-contracts";

const classificationOrder = Object.fromEntries(dataClassifications.map((classification, index) => [classification, index])) as Record<(typeof dataClassifications)[number], number>;

const contentSchema = z.string().min(1).max(5_000_000);
export const vaultSourcePolicySchema = z.object({
  version: z.string().trim().min(1).max(80),
  allowedOrigins: z.array(z.string().trim().min(1).max(2_000)).min(1),
  allowedAuthorities: z.array(z.enum(["LOW", "MODERATE", "HIGH", "OWNER"])).min(1),
});

export type VaultSourcePolicy = z.infer<typeof vaultSourcePolicySchema>;

export class VaultIntegrityError extends Error {
  constructor(public readonly code: "POLICY_VERSION_MISMATCH" | "SOURCE_NOT_ALLOWED" | "AUTHORITY_NOT_ALLOWED" | "CLASSIFICATION_DOWNGRADE" | "CORRELATION_MISMATCH" | "MISSING_EVIDENCE", message: string) {
    super(message);
    this.name = "VaultIntegrityError";
  }
}

function hash(content: string) {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

function assertNoClassificationDowngrade(parent: VaultSource | VaultEvidence, child: { classification: (typeof dataClassifications)[number] }) {
  if (classificationOrder[child.classification] < classificationOrder[parent.classification]) {
    throw new VaultIntegrityError("CLASSIFICATION_DOWNGRADE", "Derived Vault records cannot be less restricted than their source evidence.");
  }
}

/** Pure capture boundary: it validates policy and derives content hashes without performing any network or persistence work. */
export const NuruVaultIntegrityService = {
  captureSource(rawSource: z.input<typeof vaultSourceSchema> & { content: string }, rawPolicy: VaultSourcePolicy): VaultSource {
    const policy = vaultSourcePolicySchema.parse(rawPolicy);
    const { content, ...rawRecord } = rawSource;
    const record = vaultSourceSchema.parse({ ...rawRecord, contentHash: hash(contentSchema.parse(content)) });
    if (record.policyVersion !== policy.version) {
      throw new VaultIntegrityError("POLICY_VERSION_MISMATCH", "The source was captured under a policy version other than the active Vault source policy.");
    }
    if (!policy.allowedOrigins.includes(record.origin)) {
      throw new VaultIntegrityError("SOURCE_NOT_ALLOWED", "The source origin is not allowed by the active Vault source policy.");
    }
    if (!policy.allowedAuthorities.includes(record.authority)) {
      throw new VaultIntegrityError("AUTHORITY_NOT_ALLOWED", "The source authority is not allowed by the active Vault source policy.");
    }
    return record;
  },

  captureEvidence(rawEvidence: z.input<typeof vaultEvidenceSchema> & { content: string }, source: VaultSource): VaultEvidence {
    const { content, ...rawRecord } = rawEvidence;
    const record = vaultEvidenceSchema.parse({ ...rawRecord, sourceId: source.id, contentHash: hash(contentSchema.parse(content)) });
    assertNoClassificationDowngrade(source, record);
    if (record.correlationId !== source.correlationId) {
      throw new VaultIntegrityError("CORRELATION_MISMATCH", "Evidence must retain the source capture correlation ID.");
    }
    return record;
  },

  validateCandidateProvenance(rawCandidate: z.input<typeof vaultCandidateSchema>, evidence: readonly VaultEvidence[]): VaultCandidate {
    const candidate = vaultCandidateSchema.parse(rawCandidate);
    const evidenceById = new Map(evidence.map((item) => [item.id, item]));
    for (const evidenceId of candidate.evidenceIds) {
      const item = evidenceById.get(evidenceId);
      if (!item) {
        throw new VaultIntegrityError("MISSING_EVIDENCE", `Candidate references unavailable evidence: ${evidenceId}.`);
      }
      assertNoClassificationDowngrade(item, candidate);
      if (item.correlationId !== candidate.correlationId) {
        throw new VaultIntegrityError("CORRELATION_MISMATCH", "Candidate provenance must retain the evidence correlation ID.");
      }
    }
    return candidate;
  },
};
