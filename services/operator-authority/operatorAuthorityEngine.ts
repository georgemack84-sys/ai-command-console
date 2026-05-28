import type {
  OperatorAuthorityAction,
  OperatorAuthorityError,
  OperatorAuthorityInput,
  OperatorAuthorityLineageEntry,
  OperatorAuthorityResult,
} from "./types/operatorAuthorityTypes";
import { validateOperatorCommand } from "./operatorCommandValidator";
import { validateOperatorSupremacy } from "./operatorSupremacyValidator";
import { validateAuthorityContainmentBoundary } from "./authorityContainmentBoundary";
import { validateOperatorAuthorityFirewall } from "./operatorAuthorityFirewall";
import { buildRecommendationFreezeRecord } from "./recommendationFreezeEngine";
import { buildAuthorityRevocationRecord } from "./authorityRevocationEngine";
import { buildKillSwitchRecord } from "./recommendationKillSwitch";
import { shouldOperatorEscalate } from "./operatorEscalationEngine";
import { buildOverridePropagation } from "./overridePropagationEngine";
import { buildOverrideReplayArtifact } from "./overrideReplayEngine";
import { buildOverrideSnapshot } from "./overrideSnapshotEngine";
import { appendOperatorAuthorityLedger, appendOperatorAuthorityLineage } from "./immutableOperatorAuthorityLog";
import { exportOperatorAuthorityForensics } from "./operatorAuthorityForensics";
import { buildOperatorAuthorityMetrics } from "./operatorAuthorityMetrics";
import { detectOverrideRecovery } from "./overrideRecoveryDetector";
import { detectAuthorityPersistence } from "./authorityPersistenceDetector";
import { detectKillSwitchBypass } from "./killSwitchBypassDetector";
import { detectRecursiveOverride } from "./recursiveOverrideDetector";
import { detectDistributedAuthorityDrift } from "./distributedAuthorityDriftDetector";
import { detectOverrideRetry } from "./overrideRetryDetector";
import { detectOverrideMutation } from "./overrideMutationDetector";
import { detectHiddenAuthorityRestoration } from "./hiddenAuthorityRestorationDetector";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";
import { hashOverrideAuditValue } from "./overrideAuditHashEngine";

function freezeErrors(items: readonly OperatorAuthorityError[]): readonly OperatorAuthorityError[] {
  return Object.freeze([...items]);
}

function buildReplayDriftErrors(input: OperatorAuthorityInput): readonly OperatorAuthorityError[] {
  const replayDriftDetected =
    input.metadata?.replayDrift === true
    || input.metadata?.replayCorruption === true
    || !input.recommendationValidationResult.result.replayValidated
    || !input.constitutionalReplayResult.record.replayDeterministic
    || input.constitutionalReplayResult.record.failClosed;

  return replayDriftDetected
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_REPLAY_DRIFT" as const,
      message: "Replay drift or corruption was detected in operator suppression flow.",
      path: "replay",
    }])
    : Object.freeze([]);
}

function buildGovernanceDriftErrors(input: OperatorAuthorityInput): readonly OperatorAuthorityError[] {
  const governanceDriftDetected =
    input.metadata?.governanceDrift === true
    || input.metadata?.governanceBypass === true
    || !input.recommendationValidationResult.result.governanceValidated
    || !input.constitutionalReplayResult.replayBinding.governanceBound
    || !input.humanSupremacyResult.record.governanceBound
    || !input.escalationDeterminismResult.record.governanceBound;

  return governanceDriftDetected
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_GOVERNANCE_DRIFT" as const,
      message: "Governance drift or governance bypass was detected in operator suppression flow.",
      path: "governance",
    }])
    : Object.freeze([]);
}

export function buildOperatorAuthorityPreservation(
  input: OperatorAuthorityInput,
): OperatorAuthorityResult {
  const commandValidation = validateOperatorCommand(input);
  const supremacyValidation = validateOperatorSupremacy(input);
  const containmentErrors = validateAuthorityContainmentBoundary(input);
  const firewallErrors = validateOperatorAuthorityFirewall(input);
  const recoveryErrors = detectOverrideRecovery(input);
  const persistenceErrors = detectAuthorityPersistence(input);
  const killSwitchBypassErrors = detectKillSwitchBypass(input);
  const recursiveErrors = detectRecursiveOverride(input);
  const distributedErrors = detectDistributedAuthorityDrift(input);
  const retryErrors = detectOverrideRetry(input);
  const mutationErrors = detectOverrideMutation(input);
  const restorationErrors = detectHiddenAuthorityRestoration(input);
  const replayDriftErrors = buildReplayDriftErrors(input);
  const governanceDriftErrors = buildGovernanceDriftErrors(input);

  const propagation = buildOverridePropagation(input);
  const freezeRecord = buildRecommendationFreezeRecord(input);
  const revokeRecord = buildAuthorityRevocationRecord(input);
  const killSwitchRecord = buildKillSwitchRecord(input);
  const escalate = shouldOperatorEscalate(input);
  const suppression = killSwitchRecord.suppressed
    ? killSwitchRecord
    : revokeRecord.suppressed
      ? revokeRecord
      : freezeRecord;

  const actionBase = {
    actionId: input.actionId,
    operatorId: input.operatorId,
    actionType: input.actionType,
    targetIds: [...input.targetIds],
    scopeBoundaryIds: [...input.scopeBoundaryIds],
    governanceSnapshotId: input.recommendationValidationResult.result.governanceSnapshotId,
    replaySnapshotId: input.recommendationValidationResult.result.replaySnapshotId,
    propagatedAt: input.validatedAt,
    propagationCompleted: propagation.propagationCompleted,
    replayHash: "",
    auditHash: "",
    advisoryOnly: true as const,
    executable: false as const,
    executionAuthorized: false as const,
    operatorReviewRequired: true as const,
  };

  const preliminaryErrors = freezeErrors([
    ...commandValidation.errors,
    ...supremacyValidation.errors,
    ...containmentErrors,
    ...firewallErrors,
    ...recoveryErrors,
    ...persistenceErrors,
    ...killSwitchBypassErrors,
    ...recursiveErrors,
    ...distributedErrors,
    ...retryErrors,
    ...mutationErrors,
    ...restorationErrors,
    ...replayDriftErrors,
    ...governanceDriftErrors,
    ...(!propagation.propagationCompleted ? [{
      code: "OPERATOR_AUTHORITY_PROPAGATION_MISMATCH" as const,
      message: "Operator action propagation did not complete deterministically.",
      path: "propagationCompleted",
    }] : []),
  ]);

  const replayHash = buildOverrideReplayArtifact({
    action: Object.freeze({
      ...actionBase,
      replayHash: "",
      auditHash: "",
    }) as OperatorAuthorityAction,
    authorityInput: input,
  });
  const auditHash = hashOverrideAuditValue("operator-authority-action", {
    actionId: input.actionId,
    actionType: input.actionType,
    targetIds: input.targetIds,
    scopeBoundaryIds: input.scopeBoundaryIds,
    propagationHash: propagation.propagationHash,
    recommendationValidationHash: input.recommendationValidationResult.result.validationHash,
  });
  const action: OperatorAuthorityAction = Object.freeze({
    ...actionBase,
    replayHash,
    auditHash,
  });

  const snapshot = buildOverrideSnapshot({
    action,
    propagationHash: propagation.propagationHash,
  });
  const evidenceRefs = Object.freeze([
    input.recommendationValidationResult.result.recommendationId,
    input.recommendationValidationResult.result.validationHash,
    input.recommendationValidationResult.lineage.lineageHash,
    input.humanSupremacyResult.record.supremacyId,
  ]);
  const errors = preliminaryErrors;
  const evidence = Object.freeze({
    evidenceId: hashOverrideAuditValue("operator-authority-evidence-id", {
      actionId: input.actionId,
    }),
    actionId: input.actionId,
    evidenceRefs,
    reasons: Object.freeze(errors.map((error) => error.code)),
    evidenceHash: hashOverrideAuditValue("operator-authority-evidence", {
      actionId: input.actionId,
      evidenceRefs,
      reasons: errors.map((error) => error.code),
    }),
  });
  const lineageEntry: OperatorAuthorityLineageEntry = Object.freeze({
    entryId: hashOverrideReplayValue("operator-authority-lineage-entry-id", {
      actionId: input.actionId,
      validatedAt: input.validatedAt,
    }),
    actionId: input.actionId,
    actionType: input.actionType,
    recommendationId: input.recommendationValidationResult.result.recommendationId,
    propagatedAt: input.validatedAt,
    deterministicHash: hashOverrideReplayValue("operator-authority-lineage-entry", {
      actionId: input.actionId,
      actionType: input.actionType,
      replayHash,
    }),
  });
  const lineage = appendOperatorAuthorityLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditLedger = appendOperatorAuthorityLedger({
    existing: appendOperatorAuthorityLedger({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "operator.authority.action",
        actionId: input.actionId,
        actionType: input.actionType,
        replayHash,
        auditHash,
      }),
      scope: "operator-authority",
    }),
    payload: Object.freeze({
      event: errors.length > 0 ? "operator.authority.failed_closed" : "operator.authority.propagated",
      actionId: input.actionId,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidence.evidenceHash,
      suppressionHash: suppression.suppressionHash,
    }),
    scope: "operator-authority-audit",
  });
  const forensics = exportOperatorAuthorityForensics({
    actionId: input.actionId,
    replayHash,
    auditHash,
    lineageHash: lineage.lineageHash,
  });
  const metrics = buildOperatorAuthorityMetrics({
    actionType: input.actionType,
    propagationCompleted: propagation.propagationCompleted,
    errors,
  });

  const stages = Object.freeze([
    commandValidation.stage,
    supremacyValidation.stage,
    Object.freeze({
      stage: "governance_replay_guard",
      passed: replayDriftErrors.length === 0 && governanceDriftErrors.length === 0,
      reasons: Object.freeze([
        ...replayDriftErrors.map((error) => error.code),
        ...governanceDriftErrors.map((error) => error.code),
      ]),
      deterministicHash: hashOverrideReplayValue("operator-authority-governance-replay-stage", {
        recommendationId: input.recommendationValidationResult.result.recommendationId,
        governanceValidated: input.recommendationValidationResult.result.governanceValidated,
        replayValidated: input.recommendationValidationResult.result.replayValidated,
      }),
    }),
    Object.freeze({
      stage: "suppression_propagation",
      passed: propagation.propagationCompleted,
      reasons: Object.freeze(errors.filter((e) => e.code === "OPERATOR_AUTHORITY_PROPAGATION_MISMATCH").map((e) => e.code)),
      deterministicHash: hashOverrideReplayValue("operator-authority-propagation-stage", propagation),
    }),
  ]);

  return Object.freeze({
    action,
    stages,
    propagation,
    suppression: Object.freeze({
      recommendationId: suppression.recommendationId,
      suppressed: true,
      continuityInvalidated: true,
      suppressionHash: suppression.suppressionHash,
    }),
    snapshot,
    evidence,
    lineage,
    auditLedger,
    forensics,
    metrics,
    errors,
    warnings: Object.freeze(errors.length > 0
      ? ["Operator authority failed closed and invalidated recommendation continuity under uncertainty."]
      : ["Operator authority propagated suppression while remaining permanently non-executable."]),
    deterministicHash: hashOverrideReplayValue("operator-authority-result", {
      actionId: input.actionId,
      replayHash,
      auditHash,
      lineageHash: lineage.lineageHash,
      suppressionHash: suppression.suppressionHash,
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildOperatorAuthorityEngine = buildOperatorAuthorityPreservation;
