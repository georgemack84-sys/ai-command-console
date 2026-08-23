import type { ConflictMetrics } from "../../types/learning-constitution/conflictMetrics";
import type { ProvenanceLedger } from "../../types/learning-constitution/provenance";

const unresolved = new Set(["DETECTED", "UNDER_ANALYSIS", "RESOLUTION_PROPOSED", "AWAITING_CLARIFICATION", "AWAITING_APPROVAL", "ESCALATED", "DEFERRED"]);

/** Derives observability from the ledger; no counter is mutable or self-reported. */
export class ConflictMetricsService {
  constructor(private readonly ledger: ProvenanceLedger) {}
  async measure(): Promise<ConflictMetrics> {
    const records = await this.ledger.getAll();
    const resolutions = records.filter((record) => record.recordType === "CONFLICT_RESOLUTION");
    const resolvedIds = new Set(resolutions.map((record) => record.conflictId));
    const conflicts = records.filter((record) => record.recordType === "CONFLICT");
    return {
      conflictsDetected: conflicts.length,
      conflictsResolved: resolvedIds.size,
      conflictsPending: conflicts.filter((record) => unresolved.has(record.status) && !resolvedIds.has(record.id)).length,
      conflictsEscalated: records.filter((record) => record.recordType === "CONFLICT_ESCALATION").length,
      clarificationsRequested: records.filter((record) => record.recordType === "CONFLICT_CLARIFICATION_REQUEST").length,
      candidatesRejected: records.filter((record) => record.recordType === "HUMAN_APPROVAL" && record.decision === "REJECTED").length,
      itemsSuperseded: resolutions.filter((record) => record.resolutionType === "SUPERSEDE").length,
      exceptionsCreated: resolutions.filter((record) => record.resolutionType === "CREATE_EXCEPTION").length,
      scopeNarrowings: resolutions.filter((record) => record.resolutionType === "NARROW_SCOPE").length,
      mergesCompleted: resolutions.filter((record) => record.resolutionType === "MERGE").length,
      humanResolutions: resolutions.filter((record) => record.executedBy.actorType === "HUMAN").length,
      persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
    };
  }
}
