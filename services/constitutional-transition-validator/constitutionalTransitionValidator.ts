import { appendTransitionAuditEntry } from "./transitionAuditLedger";
import { detectTransitionAntiEmergence } from "./antiEmergenceTransitionDetector";
import { validateTransitionApprovals } from "./approvalTransitionValidator";
import { validateTransitionAuthority } from "./authorityTransitionValidator";
import { shouldTransitionFailClosed } from "./constitutionalTransitionFailClosedController";
import { correlateGovernanceTransition } from "./governanceTransitionCorrelator";
import { validateImmutableTransition } from "./immutableTransitionValidator";
import { validateLifecycleTransitionStateMachine } from "./lifecycleTransitionStateMachine";
import { buildOperatorTransitionOverrideLayer } from "./operatorTransitionOverrideLayer";
import { reconstructReplayTransition } from "./replayTransitionReconstructor";
import { buildTransitionFreezeRecord } from "./transitionFreezeEngine";
import { detectTransitionReplayDrift } from "./transitionReplayDriftDetector";
import { appendTransitionLineage, buildTransitionLineageEntry } from "./transitionLineageEngine";
import { validateTransitionCompatibility } from "./transitionCompatibilityEngine";
import { validateSuppressionContinuity } from "./transitionSuppressionContinuityValidator";
import { hashConstitutionalTransitionValue } from "./transitionHashEngine";
import { detectUndocumentedTransition } from "./undocumentedTransitionDetector";
import type {
  ConstitutionalTransition,
  ConstitutionalTransitionError,
  ConstitutionalTransitionInput,
  ConstitutionalTransitionResult,
  ConstitutionalTransitionValidationStage,
} from "./types/constitutionalTransitionTypes";
import { ConstitutionalTransitionErrorCode } from "./types/constitutionalTransitionTypes";

function freezeErrors(items: readonly ConstitutionalTransitionError[]): readonly ConstitutionalTransitionError[] {
  return Object.freeze([...items]);
}

function buildStructuralErrors(input: ConstitutionalTransitionInput): readonly ConstitutionalTransitionError[] {
  const errors: ConstitutionalTransitionError[] = [];
  if (!input.sourceState) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.MISSING_SOURCE_STATE,
      message: "Source state is required.",
      path: "sourceState",
    });
  }
  if (!input.targetState) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.MISSING_TARGET_STATE,
      message: "Target state is required.",
      path: "targetState",
    });
  }
  if (!input.governanceBasisId) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.MISSING_GOVERNANCE_BASIS,
      message: "Governance basis is required.",
      path: "governanceBasisId",
    });
  }
  if (!input.authorityBasisId) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.MISSING_AUTHORITY_BASIS,
      message: "Authority basis is required.",
      path: "authorityBasisId",
    });
  }
  if (!input.replayLineageId || !input.replaySnapshotId) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.MISSING_REPLAY_LINEAGE,
      message: "Replay lineage and replay snapshot are required.",
      path: "replayLineageId",
    });
  }
  if (input.approvalLineageIds.length === 0) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.MISSING_APPROVAL_LINEAGE,
      message: "Approval lineage is required.",
      path: "approvalLineageIds",
    });
  }
  return Object.freeze(errors);
}

function buildOperatorErrors(
  input: ConstitutionalTransitionInput,
  suppressionContinuityValid: boolean,
): readonly ConstitutionalTransitionError[] {
  const errors: ConstitutionalTransitionError[] = [];
  if (!suppressionContinuityValid) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.SUPPRESSION_CONTINUITY_BROKEN,
      message: "Suppression continuity must remain authoritative during transition validation.",
      path: "operatorAuthorityResult.suppression",
    });
  }
  if (!input.overrideCompatible) {
    errors.push({
      code: ConstitutionalTransitionErrorCode.AUTHORITY_ESCALATION_DETECTED,
      message: "Transition is not override-compatible and would weaken operator supremacy.",
      path: "overrideCompatible",
    });
  }
  return Object.freeze(errors);
}

function buildStages(input: {
  stateMachineDeclared: boolean;
  governanceValidated: boolean;
  authorityValid: boolean;
  approvalValidated: boolean;
  replayCertified: boolean;
  suppressionContinuityValid: boolean;
  antiEmergencePassed: boolean;
  frozen: boolean;
}): readonly ConstitutionalTransitionValidationStage[] {
  const stages = [
    {
      stage: "source_target_validation",
      passed: input.stateMachineDeclared,
      reasons: input.stateMachineDeclared ? [] : ["UNDOCUMENTED_TRANSITION"],
    },
    {
      stage: "governance_validation",
      passed: input.governanceValidated,
      reasons: input.governanceValidated ? [] : ["MISSING_GOVERNANCE_BASIS"],
    },
    {
      stage: "authority_validation",
      passed: input.authorityValid,
      reasons: input.authorityValid ? [] : ["AUTHORITY_ESCALATION_DETECTED"],
    },
    {
      stage: "approval_lineage_validation",
      passed: input.approvalValidated,
      reasons: input.approvalValidated ? [] : ["MISSING_APPROVAL_LINEAGE"],
    },
    {
      stage: "replay_validation",
      passed: input.replayCertified,
      reasons: input.replayCertified ? [] : ["REPLAY_DRIFT_DETECTED"],
    },
    {
      stage: "suppression_continuity_validation",
      passed: input.suppressionContinuityValid,
      reasons: input.suppressionContinuityValid ? [] : ["SUPPRESSION_CONTINUITY_BROKEN"],
    },
    {
      stage: "anti_emergence_validation",
      passed: input.antiEmergencePassed,
      reasons: input.antiEmergencePassed ? [] : ["HIDDEN_TRANSITION_DETECTED"],
    },
    {
      stage: "freeze_evaluation",
      passed: !input.frozen,
      reasons: input.frozen ? ["TRANSITION_FROZEN"] : [],
    },
  ] satisfies { stage: string; passed: boolean; reasons: string[] }[];

  return Object.freeze(stages.map((stage) => Object.freeze({
    ...stage,
    reasons: Object.freeze(stage.reasons),
    deterministicHash: hashConstitutionalTransitionValue("constitutional-transition-stage", stage),
  })));
}

export function validateConstitutionalTransition(
  input: ConstitutionalTransitionInput,
): ConstitutionalTransitionResult {
  const stateMachine = validateLifecycleTransitionStateMachine(input);
  const governanceCorrelation = correlateGovernanceTransition(input);
  const approvalRecord = validateTransitionApprovals(input);
  const replayRecord = reconstructReplayTransition(input);
  const authorityRecord = validateTransitionAuthority(input);
  const compatibility = validateTransitionCompatibility(input);
  const overrideLayer = buildOperatorTransitionOverrideLayer(input);
  const suppressionContinuityValid = validateSuppressionContinuity(input);

  const errors = freezeErrors([
    ...buildStructuralErrors(input),
    ...detectUndocumentedTransition(stateMachine),
    ...detectTransitionReplayDrift(input),
    ...buildOperatorErrors(input, suppressionContinuityValid),
    ...detectTransitionAntiEmergence(input),
  ]);
  const freeze = buildTransitionFreezeRecord(errors);

  const transitionBase = {
    transitionId: input.transitionId,
    entityId: input.entityId,
    entityType: input.entityType,
    sourceState: input.sourceState,
    targetState: input.targetState,
    transitionReason: input.transitionReason,
    governanceBasisId: input.governanceBasisId,
    authorityBasisId: input.authorityBasisId,
    replayLineageId: input.replayLineageId,
    approvalLineageIds: [...input.approvalLineageIds],
    auditLineageId: input.auditLineageId,
    policySnapshotId: input.policySnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    operatorVisibilityRequired: input.operatorVisibilityRequired,
    overrideCompatible: compatibility.overrideCompatible,
    replayCertified: replayRecord.replayCertified,
    transitionHash: "",
    replayHash: replayRecord.replayHash,
    governanceHash: governanceCorrelation.governanceHash,
    auditHash: "",
    constitutionalVersion: input.constitutionalVersion,
    executionAuthorized: false as const,
    createdAt: input.createdAt,
  };

  const transitionHash = hashConstitutionalTransitionValue("constitutional-transition-contract", {
    ...transitionBase,
    transitionHash: null,
    auditHash: null,
  });
  const lineageEntry = buildTransitionLineageEntry(input);
  const lineage = appendTransitionLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditHash = hashConstitutionalTransitionValue("constitutional-transition-audit-hash", {
    transitionId: input.transitionId,
    transitionHash,
    lineageHash: lineage.lineageHash,
    replayHash: replayRecord.replayHash,
    governanceHash: governanceCorrelation.governanceHash,
    freezeHash: freeze.freezeHash,
    overrideHash: overrideLayer.deterministicHash,
  });

  const transition: ConstitutionalTransition = Object.freeze({
    ...transitionBase,
    transitionHash,
    auditHash,
  });

  const auditLedger = appendTransitionAuditEntry({
    existing: appendTransitionAuditEntry({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "constitutional.transition.validated",
        transitionId: input.transitionId,
        entityId: input.entityId,
        transitionHash,
        replayHash: replayRecord.replayHash,
      }),
      scope: "constitutional-transition-validator",
    }),
    payload: Object.freeze({
      event: shouldTransitionFailClosed(errors)
        ? "constitutional.transition.failed_closed"
        : "constitutional.transition.certified",
      transitionId: input.transitionId,
      lineageHash: lineage.lineageHash,
      auditHash,
      freezeHash: freeze.freezeHash,
    }),
    scope: "constitutional-transition-validator-audit",
  });

  const immutableErrors = validateImmutableTransition({ lineage, auditLedger });
  const finalErrors = freezeErrors([...errors, ...immutableErrors]);
  const finalFreeze = buildTransitionFreezeRecord(finalErrors);
  const stages = buildStages({
    stateMachineDeclared: stateMachine.declared,
    governanceValidated: governanceCorrelation.governanceValidated,
    authorityValid: authorityRecord.operatorCompatible,
    approvalValidated: approvalRecord.approvalValidated,
    replayCertified: replayRecord.replayCertified && replayRecord.replayDeterministic,
    suppressionContinuityValid,
    antiEmergencePassed: !finalErrors.some((error) =>
      error.code === ConstitutionalTransitionErrorCode.HIDDEN_TRANSITION_DETECTED
      || error.code === ConstitutionalTransitionErrorCode.TRANSITION_SYNTHESIS_DETECTED
      || error.code === ConstitutionalTransitionErrorCode.RECURSIVE_TRANSITION_CHAIN
      || error.code === ConstitutionalTransitionErrorCode.AUTHORITY_ESCALATION_DETECTED),
    frozen: finalFreeze.frozen,
  });

  return Object.freeze({
    transition,
    replayRecord,
    governanceCorrelation,
    authorityRecord,
    approvalRecord,
    compatibility,
    stateMachine,
    stages,
    freeze: finalFreeze,
    lineage,
    auditLedger,
    forensics: Object.freeze({
      exportId: hashConstitutionalTransitionValue("constitutional-transition-export-id", {
        transitionId: input.transitionId,
      }),
      transitionId: input.transitionId,
      transitionHash,
      replayHash: replayRecord.replayHash,
      governanceHash: governanceCorrelation.governanceHash,
      auditHash,
      exportHash: hashConstitutionalTransitionValue("constitutional-transition-export", {
        transitionId: input.transitionId,
        transitionHash,
        replayHash: replayRecord.replayHash,
        governanceHash: governanceCorrelation.governanceHash,
        auditHash,
      }),
    }),
    errors: finalErrors,
    warnings: Object.freeze(
      shouldTransitionFailClosed(finalErrors)
        ? ["Transition validation failed closed rather than infer undocumented lifecycle movement."]
        : ["Transition validated as declarative constitutional evidence without lifecycle execution."],
    ),
    deterministicHash: hashConstitutionalTransitionValue("constitutional-transition-result", {
      transitionHash,
      replayHash: replayRecord.replayHash,
      governanceHash: governanceCorrelation.governanceHash,
      auditHash,
      lineageHash: lineage.lineageHash,
      freezeHash: finalFreeze.freezeHash,
      stageHashes: stages.map((stage) => stage.deterministicHash),
      errorCodes: finalErrors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildConstitutionalTransitionValidator = validateConstitutionalTransition;
