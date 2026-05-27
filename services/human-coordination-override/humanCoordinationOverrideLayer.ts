import type {
  HumanCoordinationOverrideInput,
  HumanCoordinationOverrideResult,
  OverrideLineageEntry,
} from "@/types/human-coordination-override";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";
import { buildHumanCoordinationOverrideAuthorityContract, validateOverrideBoundary } from "./overrideBoundaryValidator";
import { validateOverrideAuthorization } from "./overrideAuthorizationValidator";
import { validateOverrideConsistency } from "./overrideConsistencyValidator";
import { validateOverrideGovernance } from "@/services/governance-override/overrideGovernanceValidator";
import { shouldFreezeOverride } from "@/services/governance-override/overrideFreezeCoordinator";
import { shouldTriggerOverrideReview } from "@/services/governance-override/overrideReviewTrigger";
import { inspectReplayVisibility } from "@/services/replay-visibility/replayVisibilityInspector";
import { inspectCoordinationLineage } from "@/services/replay-visibility/coordinationLineageInspector";
import { inspectEscalationRationale } from "@/services/replay-visibility/escalationRationaleInspector";
import { buildOverrideEvidence } from "@/services/override-lineage/overrideEvidenceBuilder";
import { buildOverrideAuditEvents } from "@/services/override-lineage/overrideAuditLog";
import { appendOverrideReplayLedger } from "@/services/override-lineage/overrideReplayLedger";
import { appendOverrideLineage } from "@/services/override-lineage/overrideLineageEngine";
import { resolvePausedOverrideState } from "./coordinationPauseEngine";
import { resolveFrozenOverrideState } from "./orchestrationFreezeEngine";

export function buildHumanCoordinationOverride(
  input: HumanCoordinationOverrideInput,
): HumanCoordinationOverrideResult {
  const authorityContract = buildHumanCoordinationOverrideAuthorityContract();
  const authorizationErrors = validateOverrideAuthorization(input.operator);
  const boundaryErrors = validateOverrideBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const governanceErrors = validateOverrideGovernance(input);
  const consistencyErrors = validateOverrideConsistency(input);
  const allErrors = Object.freeze([
    ...authorizationErrors,
    ...boundaryErrors,
    ...governanceErrors,
    ...consistencyErrors,
  ]);
  const freezeRequired = shouldFreezeOverride({
    overrideInput: input,
    errorCodes: allErrors.map((item) => item.code),
  });
  const reviewRequired = shouldTriggerOverrideReview({
    overrideInput: input,
    freezeRequired,
    errorCount: allErrors.length,
  });
  const replayInspection = inspectReplayVisibility(input.coordinationReplay);
  const coordinationInspection = inspectCoordinationLineage(input.coordinationRecord);
  const escalationInspection = inspectEscalationRationale(input.escalationResult);
  const reasons = Object.freeze([
    ...allErrors.map((item) => item.code),
    ...(reviewRequired ? ["override:review-required"] : []),
    ...(freezeRequired ? ["override:freeze-required"] : []),
  ]);
  const evidence = buildOverrideEvidence({
    overrideInput: input,
    replayInspection,
    coordinationInspection,
    escalationInspection,
    reasons,
  });
  const overrideState = freezeRequired
    ? resolveFrozenOverrideState({ overrideType: input.overrideType, forceFreeze: true })
    : input.overrideType === "pause"
      ? resolvePausedOverrideState()
      : resolveFrozenOverrideState({ overrideType: input.overrideType, forceFreeze: false });
  const replaySafe = replayInspection.replayDeterministic && !allErrors.some((item) => item.code.includes("REPLAY"));
  const lineageEntry: OverrideLineageEntry = Object.freeze({
    overrideId: input.overrideId,
    coordinationId: input.coordinationRecord.coordinationId,
    overrideType: input.overrideType,
    initiatedBy: input.operator.operatorId,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    reason: input.reason,
    createdAt: input.createdAt,
    overrideState,
    deterministicHash: hashCoordinationReplayValue("human-override-lineage-entry", {
      overrideId: input.overrideId,
      overrideType: input.overrideType,
      overrideState,
      coordinationId: input.coordinationRecord.coordinationId,
      createdAt: input.createdAt,
    }),
    replaySafe,
    failClosed: freezeRequired || allErrors.length > 0,
  });
  const lineage = appendOverrideLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditEvents = buildOverrideAuditEvents(input, evidence);
  const replayLedger = appendOverrideReplayLedger({
    existing: input.existingReplayLedger,
    scope: "human-coordination-override",
    payload: Object.freeze({
      overrideId: input.overrideId,
      coordinationId: input.coordinationRecord.coordinationId,
      overrideType: input.overrideType,
      overrideState,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
    }),
  });
  const record = Object.freeze({
    overrideId: input.overrideId,
    coordinationId: input.coordinationRecord.coordinationId,
    overrideType: input.overrideType,
    overrideState: freezeRequired && allErrors.length > 0 ? "fail_closed" : overrideState,
    initiatedBy: input.operator.operatorId,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    reason: input.reason,
    createdAt: input.createdAt,
    replaySafe,
    failClosed: freezeRequired || allErrors.length > 0,
  });
  const base = Object.freeze({
    record,
    authorityContract,
    lineage,
    replayLedger,
    auditEvents,
    evidence,
    replayInspection,
    coordinationInspection,
    escalationInspection,
    warnings: Object.freeze([
      "Human coordination override remains supervisory, interruptive, immutable, and non-executing.",
    ]),
    errors: allErrors,
    derivedOnly: true as const,
  });
  return Object.freeze({
    ...base,
    deterministicHash: hashCoordinationReplayValue("human-coordination-override-result", base),
  });
}

export const enforceHumanCoordinationOverride = buildHumanCoordinationOverride;
