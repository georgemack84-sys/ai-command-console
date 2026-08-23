import type { KnowledgeAuditLedger } from "../../types/learning-constitution/durableKnowledge";
import type {
  AuditIntegrityVerificationRequest,
  AuditIntegrityVerificationResult,
  AuditIntegrityVerifier as AuditIntegrityVerifierContract,
} from "../../types/learning-constitution/auditIntegrity";
import { hashAuditEvent } from "./auditIntegrityHash";

export const AUDIT_INTEGRITY_VERIFIER_ID = "phase-0-audit-integrity-verifier";

const result = (values: Omit<AuditIntegrityVerificationResult, "persistenceEffect" | "authorityEffect" | "executionPermissionGranted">): AuditIntegrityVerificationResult => ({
  ...values, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

export class AuditIntegrityVerifier implements AuditIntegrityVerifierContract {
  constructor(private readonly ledger: KnowledgeAuditLedger) {}

  async verify(request: AuditIntegrityVerificationRequest): Promise<AuditIntegrityVerificationResult> {
    try {
      const [entries, events] = await Promise.all([
        this.ledger.findIntegrityEntries(request.auditKey),
        this.ledger.findByKnowledgeId(request.auditKey),
      ]);
      const ordered = [...entries].sort((left, right) => left.sequence - right.sequence);
      if (ordered.length === 0) return result({ auditKey: request.auditKey, status: "INSUFFICIENT_HISTORY", verifiedEntryCount: 0, entries: ordered });
      const eventById = new Map(events.map((event) => [event.eventId, event]));
      let previousHash: string | undefined;
      for (const entry of ordered) {
        if (entry.sequence < 1 || entry.sequence !== ordered.indexOf(entry) + 1 || entry.previousHash !== previousHash) {
          return result({ auditKey: request.auditKey, status: "CHAIN_BROKEN", verifiedEntryCount: entry.sequence - 1, brokenAtSequence: entry.sequence, brokenEventId: entry.eventId, entries: ordered });
        }
        const event = eventById.get(entry.eventId);
        if (!event) return result({ auditKey: request.auditKey, status: "EVENT_MISSING", verifiedEntryCount: entry.sequence - 1, brokenAtSequence: entry.sequence, brokenEventId: entry.eventId, entries: ordered });
        if (hashAuditEvent(event, previousHash) !== entry.eventHash) {
          return result({ auditKey: request.auditKey, status: "HASH_MISMATCH", verifiedEntryCount: entry.sequence - 1, brokenAtSequence: entry.sequence, brokenEventId: entry.eventId, entries: ordered });
        }
        previousHash = entry.eventHash;
      }
      return result({ auditKey: request.auditKey, status: "VALID", verifiedEntryCount: ordered.length, entries: ordered });
    } catch {
      return result({ auditKey: request.auditKey, status: "VERIFICATION_FAILED", verifiedEntryCount: 0, entries: [] });
    }
  }
}
