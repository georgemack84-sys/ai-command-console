import type { ConflictAdmissionGateResult } from "../../types/learning-constitution/conflictAdmission";
import type { ProvenanceLedger } from "../../types/learning-constitution/provenance";

const unresolved = new Set(["DETECTED", "UNDER_ANALYSIS", "RESOLUTION_PROPOSED", "AWAITING_CLARIFICATION", "AWAITING_APPROVAL", "ESCALATED", "DEFERRED"]);

/** Fail-closed gate between candidate approval and durable progression. */
export class ConflictAdmissionGate {
  constructor(private readonly ledger: ProvenanceLedger) {}
  async evaluate(candidateId: string): Promise<ConflictAdmissionGateResult> {
    const blockingConflictIds = (await this.ledger.getAll())
      .filter((record) => record.recordType === "CONFLICT" && record.candidateKnowledgeId === candidateId && unresolved.has(record.status))
      .map((record) => record.id);
    return blockingConflictIds.length
      ? { decision: "BLOCK", blockingConflictIds, reasonCode: "UNRESOLVED_MATERIAL_CONFLICT", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false }
      : { decision: "ALLOW", blockingConflictIds: [], reasonCode: "NO_BLOCKING_CONFLICT", persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
  }
}
