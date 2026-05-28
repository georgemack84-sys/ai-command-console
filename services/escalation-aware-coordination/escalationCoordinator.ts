import type {
  EscalationAwareCoordinationInput,
  EscalationAwareCoordinationResult,
  EscalationLineageEntry,
} from "@/types/escalation-aware-coordination";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";
import { buildCoordinationRiskProfile } from "@/services/coordination-risk/coordinationRiskEngine";
import { validateEscalationBoundary, buildEscalationAwareAuthorityContract } from "@/services/escalation-validation/escalationBoundaryValidator";
import { validateGovernanceEscalation } from "@/services/governance-escalation/governanceEscalationValidator";
import { validateEscalationReplay } from "@/services/escalation-validation/escalationReplayValidator";
import { validateEscalationConsistency } from "@/services/escalation-validation/escalationConsistencyValidator";
import { shouldTriggerGovernanceReview } from "@/services/governance-escalation/governanceReviewTrigger";
import { shouldFreezeForGovernance } from "@/services/governance-escalation/governanceFreezeCoordinator";
import { classifyEscalationState } from "./escalationStateClassifier";
import { routeEscalation } from "./escalationRouter";
import { appendEscalationLineage } from "./escalationLineageEngine";
import { buildEscalationEvidence } from "@/services/escalation-audit/escalationEvidenceBuilder";
import { appendEscalationReplayLedger } from "@/services/escalation-audit/escalationReplayLedger";

export function buildEscalationAwareCoordination(input: EscalationAwareCoordinationInput): EscalationAwareCoordinationResult {
  const authorityContract = buildEscalationAwareAuthorityContract();
  const boundaryErrors = validateEscalationBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const governanceErrors = validateGovernanceEscalation(input);
  const replayErrors = validateEscalationReplay({
    coordinationReplay: input.coordinationReplay,
    metadata: input.metadata,
  });
  const consistencyErrors = validateEscalationConsistency(input);
  const risk = buildCoordinationRiskProfile(input);
  const allErrors = Object.freeze([
    ...boundaryErrors,
    ...governanceErrors,
    ...replayErrors,
    ...consistencyErrors,
  ]);
  const classification = classifyEscalationState({
    risk,
    errorCodes: allErrors.map((error) => error.code),
  });
  const governanceReview = shouldTriggerGovernanceReview(risk);
  const freezeRequired = shouldFreezeForGovernance({
    risk,
    errorCodes: allErrors.map((error) => error.code),
  });
  const target = freezeRequired
    ? "coordination_hold"
    : governanceReview
      ? routeEscalation({
        escalationState: classification.escalationState,
        escalationReason: classification.escalationReason,
      })
      : "coordination_hold";

  const lineageEntry: EscalationLineageEntry = Object.freeze({
    lineageEntryId: hashCoordinationReplayValue("escalation-lineage-entry-id", {
      escalationId: input.escalationId,
      coordinationId: input.coordinationRecord.coordinationId,
      createdAt: input.createdAt,
    }),
    escalationId: input.escalationId,
    coordinationId: input.coordinationRecord.coordinationId,
    escalationState: classification.escalationState,
    escalationReason: classification.escalationReason,
    createdAt: input.createdAt,
    deterministicHash: hashCoordinationReplayValue("escalation-lineage-entry", {
      escalationState: classification.escalationState,
      escalationReason: classification.escalationReason,
      target,
    }),
  });
  const lineage = appendEscalationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const audit = buildEscalationEvidence({
    escalationInput: input,
    target,
    reasons: allErrors.map((error) => error.code),
  });
  const replayLedger = appendEscalationReplayLedger({
    existing: input.existingReplayLedger,
    payload: Object.freeze({
      escalationId: input.escalationId,
      coordinationId: input.coordinationRecord.coordinationId,
      target,
      lineageHash: lineage.lineageHash,
      auditHash: audit.evidenceHash,
    }),
    scope: "escalation-aware-coordination",
  });
  const record = Object.freeze({
    escalationId: input.escalationId,
    coordinationId: input.coordinationRecord.coordinationId,
    escalationState: freezeRequired
      ? classification.escalationState === "critical" ? "critical" : "frozen"
      : classification.escalationState,
    escalationReason: classification.escalationReason,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    approvalSnapshotId: input.approval.approvalId,
    escalationTimestamp: input.createdAt,
    lineageHash: lineage.lineageHash,
    replaySafe: !allErrors.some((error) => error.code.includes("REPLAY")),
    failClosed: classification.failClosed || freezeRequired,
  });
  const base = Object.freeze({
    record,
    authorityContract,
    target,
    risk,
    lineage,
    audit,
    replayLedger,
    warnings: Object.freeze([
      "Escalation-aware coordination remains oversight-only and cannot execute, orchestrate, or self-resolve.",
    ]),
    errors: allErrors,
    derivedOnly: true as const,
  });
  return Object.freeze({
    ...base,
    deterministicHash: hashCoordinationReplayValue("escalation-aware-coordination-result", base),
  });
}
