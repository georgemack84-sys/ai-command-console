import type { ExpandedConstitutionalAuditRecord } from "../../types/audit";
import { verifyEvidenceHash } from "./evidenceHashing";

export function validateConstitutionalReplay(input: {
  record: ExpandedConstitutionalAuditRecord;
}) {
  const evidenceComplete =
    input.record.evidence.length > 0
    && input.record.reasoningChain.length > 0
    && input.record.escalationChain.length >= 0
    && input.record.coordinationChain.length >= 0;
  const computedHashValid = verifyEvidenceHash({
    governanceAction: input.record.governanceAction,
    constitutionalState: input.record.constitutionalState,
    evidence: input.record.evidence,
    reasoningChain: input.record.reasoningChain,
    approvals: input.record.approvals,
    escalationChain: input.record.escalationChain,
    coordinationChain: input.record.coordinationChain,
    coordinationSystems: input.record.coordinationSystems,
    relatedExecutionIds: input.record.relatedExecutionIds,
    relatedGovernanceIds: input.record.relatedGovernanceIds,
    relatedCoordinationIds: input.record.relatedCoordinationIds,
    sovereigntyState: input.record.sovereigntyState,
    containmentActive: input.record.containmentActive,
    coordinationConflictDetected: input.record.coordinationConflictDetected,
    operatorVisibility: input.record.operatorVisibility,
    replayable: input.record.replayable,
    exported: input.record.exported,
    timestamp: input.record.timestamp,
  }, input.record.immutableHash);

  return {
    valid: evidenceComplete && computedHashValid,
    blocked: evidenceComplete === false || computedHashValid === false,
    blockedReasons: [
      ...(evidenceComplete ? [] : ["missing_replay_evidence"]),
      ...(computedHashValid ? [] : ["replay_hash_mismatch"]),
    ],
  };
}
