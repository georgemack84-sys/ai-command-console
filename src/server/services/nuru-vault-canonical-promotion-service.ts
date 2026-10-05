import { z } from "zod";
import { type CanonicalRecord, type GovernanceDecision, type VaultAuditEvent, type VaultCandidate, canonicalRecordSchema, governanceDecisionSchema, vaultAuditEventSchema, vaultCandidateSchema } from "@/src/nuru/vault-contracts";

const promotionRequestSchema = z.object({
  candidate: vaultCandidateSchema,
  decision: governanceDecisionSchema,
  canonicalRecordId: z.string().trim().min(1).max(160),
});

const supersessionRequestSchema = promotionRequestSchema.extend({
  currentRecord: canonicalRecordSchema,
});

export interface VaultCanonicalStore {
  appendPromotion(decision: GovernanceDecision, record: CanonicalRecord, auditEvent: VaultAuditEvent): Promise<void>;
  /** Persists the successor and an immutable supersession snapshot without deleting the former record. */
  appendSupersession(decision: GovernanceDecision, previous: CanonicalRecord, supersededSnapshot: CanonicalRecord, successor: CanonicalRecord, auditEvent: VaultAuditEvent): Promise<void>;
}

export class VaultCanonicalPromotionError extends Error {
  constructor(public readonly code: "DECISION_NOT_APPROVED" | "DECISION_CANDIDATE_MISMATCH" | "INVALID_CURRENT_RECORD" | "SELF_SUPERSESSION", message: string) {
    super(message);
    this.name = "VaultCanonicalPromotionError";
  }
}

function assertApprovedDecision(candidate: VaultCandidate, decision: GovernanceDecision) {
  if (decision.outcome !== "APPROVED") {
    throw new VaultCanonicalPromotionError("DECISION_NOT_APPROVED", "Only an approved governance decision can promote a canonical record.");
  }
  if (decision.candidateId !== candidate.id) {
    throw new VaultCanonicalPromotionError("DECISION_CANDIDATE_MISMATCH", "The governance decision must reference the candidate being promoted.");
  }
}

function promotionAudit(record: CanonicalRecord, eventType: "CANONICAL_PROMOTED" | "RECORD_SUPERSEDED", reason: string): VaultAuditEvent {
  return vaultAuditEventSchema.parse({
    schemaVersion: record.schemaVersion,
    id: `audit:${record.id}:${eventType.toLowerCase()}`,
    kind: "AUDIT_EVENT",
    classification: record.classification,
    createdAt: record.createdAt,
    correlationId: record.correlationId,
    eventType,
    actor: "nuru.vault.governance.v1",
    resourceId: record.id,
    occurredAt: record.createdAt,
    reason,
  });
}

/** The only BP-004 path from a governance decision to a canonical Vault record. */
export const NuruVaultCanonicalPromotionService = {
  async promote(rawRequest: z.input<typeof promotionRequestSchema>, store: VaultCanonicalStore): Promise<{ record: CanonicalRecord; auditEvent: VaultAuditEvent }> {
    const request = promotionRequestSchema.parse(rawRequest);
    assertApprovedDecision(request.candidate, request.decision);
    const record = canonicalRecordSchema.parse({
      schemaVersion: request.candidate.schemaVersion,
      id: request.canonicalRecordId,
      kind: "CANONICAL_RECORD",
      classification: request.candidate.classification,
      createdAt: request.decision.decidedAt,
      correlationId: request.candidate.correlationId,
      candidateId: request.candidate.id,
      governanceDecisionId: request.decision.id,
      version: 1,
      status: "CURRENT",
    });
    const auditEvent = promotionAudit(record, "CANONICAL_PROMOTED", "Promoted after an approved governance decision with retained human approval evidence.");
    await store.appendPromotion(request.decision, record, auditEvent);
    return { record, auditEvent };
  },

  async supersede(rawRequest: z.input<typeof supersessionRequestSchema>, store: VaultCanonicalStore): Promise<{ supersededRecord: CanonicalRecord; successor: CanonicalRecord; auditEvent: VaultAuditEvent }> {
    const request = supersessionRequestSchema.parse(rawRequest);
    assertApprovedDecision(request.candidate, request.decision);
    if (request.currentRecord.status !== "CURRENT") {
      throw new VaultCanonicalPromotionError("INVALID_CURRENT_RECORD", "Only a current canonical record can be superseded.");
    }
    if (request.currentRecord.id === request.canonicalRecordId) {
      throw new VaultCanonicalPromotionError("SELF_SUPERSESSION", "A canonical record cannot supersede itself.");
    }
    const successor = canonicalRecordSchema.parse({
      schemaVersion: request.candidate.schemaVersion,
      id: request.canonicalRecordId,
      kind: "CANONICAL_RECORD",
      classification: request.candidate.classification,
      createdAt: request.decision.decidedAt,
      correlationId: request.candidate.correlationId,
      candidateId: request.candidate.id,
      governanceDecisionId: request.decision.id,
      version: request.currentRecord.version + 1,
      status: "CURRENT",
    });
    const supersededRecord = canonicalRecordSchema.parse({ ...request.currentRecord, status: "SUPERSEDED", supersededById: successor.id });
    const auditEvent = promotionAudit(successor, "RECORD_SUPERSEDED", `Superseded canonical record ${request.currentRecord.id} after an approved governance decision.`);
    await store.appendSupersession(request.decision, request.currentRecord, supersededRecord, successor, auditEvent);
    return { supersededRecord, successor, auditEvent };
  },
};
