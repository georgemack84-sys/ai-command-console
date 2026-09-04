import { createHash } from "node:crypto";

import type { LearningAuditEntry, LearningAuditEvent, LearningAuditLedger, LearningAuditLedgerVerifier as VerifierContract, LearningAuditVerificationResult } from "../../types/learning-constitution/learningAuditLedger";
import { canonicalizeAuditValue } from "./auditIntegrityHash";

const eventHash = (event: LearningAuditEvent, sequence: number, previousHash: string | null): string =>
  createHash("sha256").update(canonicalizeAuditValue({ event, sequence, previousHash }), "utf8").digest("hex");

const invalid = (workspaceId: string, entries: readonly LearningAuditEntry[], sequence: number, violations: readonly string[]): LearningAuditVerificationResult => ({ workspaceId, status: "INVALID", verifiedEntryCount: sequence - 1, brokenAtSequence: sequence, violations, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false });

/** Verifies Phase 10 history independently from event producers and appenders. */
export class AuditLedgerVerifier implements VerifierContract {
  constructor(private readonly ledger: Pick<LearningAuditLedger, "list">) {}

  async verify(workspaceId: string): Promise<LearningAuditVerificationResult> {
    try {
      const entries = await this.ledger.list(workspaceId);
      let previousHash: string | null = null;
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index]!;
        const event = entry.event;
        const violations: string[] = [];
        if (entry.sequence !== index + 1) violations.push("SEQUENCE_DISCONTINUITY");
        if (entry.previousHash !== previousHash) violations.push("PREDECESSOR_HASH_MISMATCH");
        if (event.workspaceId !== workspaceId) violations.push("WORKSPACE_SCOPE_MISMATCH");
        if (!event.eventId.trim() || !event.correlationId.trim() || !event.actor.actorId.trim()) violations.push("REQUIRED_IDENTITY_MISSING");
        if (Number.isNaN(Date.parse(event.occurredAt))) violations.push("TIMESTAMP_INVALID");
        if (event.schemaVersion !== "10.0") violations.push("SCHEMA_INVALID");
        if (entry.eventHash !== eventHash(event, entry.sequence, entry.previousHash)) violations.push("EVENT_HASH_MISMATCH");
        if (violations.length) return invalid(workspaceId, entries, entry.sequence, violations);
        previousHash = entry.eventHash;
      }
      return { workspaceId, status: "VALID", verifiedEntryCount: entries.length, violations: [], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    } catch {
      return { workspaceId, status: "INVALID", verifiedEntryCount: 0, violations: ["VERIFICATION_FAILED"], persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
    }
  }
}
