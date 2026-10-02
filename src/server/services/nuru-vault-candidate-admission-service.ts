import { z } from "zod";
import { type VaultAuditEvent, type VaultCandidate, vaultAuditEventSchema, vaultCandidateSchema, vaultEvidenceSchema } from "@/src/nuru/vault-contracts";
import { NuruVaultIntegrityService, VaultIntegrityError } from "@/src/server/services/nuru-vault-integrity-service";

const submitterSchema = z.object({
  id: z.string().trim().min(1).max(160),
  kind: z.enum(["AGENT", "HUMAN", "SERVICE"]),
});

export const vaultCandidateSubmissionSchema = z.object({
  candidate: vaultCandidateSchema,
  evidence: z.array(vaultEvidenceSchema).min(1),
  submittedBy: submitterSchema,
});

export type VaultCandidateSubmission = z.infer<typeof vaultCandidateSubmissionSchema>;

/** Implemented by a server-side repository; agents receive no instance of this port. */
export interface VaultCandidateAdmissionStore {
  appendCandidate(candidate: VaultCandidate): Promise<void>;
  appendAuditEvent(event: VaultAuditEvent): Promise<void>;
}

export class VaultCandidateAdmissionError extends Error {
  constructor(public readonly code: "INVALID_LIFECYCLE" | "PRODUCER_MISMATCH" | "INTEGRITY_FAILURE", message: string) {
    super(message);
    this.name = "VaultCandidateAdmissionError";
  }
}

/**
 * The only BP-003 write boundary. It accepts a proposal from an agent or human,
 * validates it, then appends durable records under the admission-service identity.
 */
export const NuruVaultCandidateAdmissionService = {
  async admit(rawSubmission: z.input<typeof vaultCandidateSubmissionSchema>, store: VaultCandidateAdmissionStore): Promise<{ candidate: VaultCandidate; auditEvent: VaultAuditEvent }> {
    const submission = vaultCandidateSubmissionSchema.parse(rawSubmission);
    const { candidate, submittedBy, evidence } = submission;
    if (candidate.status !== "PROPOSED") {
      throw new VaultCandidateAdmissionError("INVALID_LIFECYCLE", "Only proposed candidates can enter the Vault admission path.");
    }
    if (candidate.producedBy !== submittedBy.id) {
      throw new VaultCandidateAdmissionError("PRODUCER_MISMATCH", "Candidate attribution must match the submitting identity.");
    }

    let validated: VaultCandidate;
    try {
      validated = NuruVaultIntegrityService.validateCandidateProvenance(candidate, evidence);
    } catch (error) {
      if (error instanceof VaultIntegrityError) {
        throw new VaultCandidateAdmissionError("INTEGRITY_FAILURE", error.message);
      }
      throw error;
    }

    const auditEvent = vaultAuditEventSchema.parse({
      schemaVersion: validated.schemaVersion,
      id: `audit:${validated.id}:admitted`,
      kind: "AUDIT_EVENT",
      classification: validated.classification,
      createdAt: validated.createdAt,
      correlationId: validated.correlationId,
      eventType: "CANDIDATE_PROPOSED",
      actor: "nuru.vault.admission.v1",
      resourceId: validated.id,
      occurredAt: validated.createdAt,
      reason: `Validated candidate proposal submitted by ${submittedBy.kind.toLowerCase()}:${submittedBy.id}.`,
    });

    await store.appendCandidate(validated);
    await store.appendAuditEvent(auditEvent);
    return { candidate: validated, auditEvent };
  },
};
