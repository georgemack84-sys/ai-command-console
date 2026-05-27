import { detectCertificationAntiEmergence } from "./certificationAntiEmergenceDetector";
import { buildCertificationCompatibility } from "./certificationCompatibilityEngine";
import { validateCertificationDependencies } from "./certificationDependencyValidator";
import { buildCertificationEvidence } from "./certificationEvidenceGenerator";
import { buildCertificationFreeze } from "./certificationFreezeEngine";
import { correlateCertificationGovernance } from "./certificationGovernanceCorrelator";
import { hashCertificationValue } from "./certificationHashEngine";
import { appendCertificationAuditEntry, appendCertificationLineage } from "./certificationLedger";
import { buildCertificationLineageEntry } from "./certificationLineageEngine";
import { DECISION_READINESS_CERTIFICATION_POLICY } from "./certificationPolicyRegistry";
import { reconstructCertificationReplay } from "./certificationReplayReconstructor";
import { detectCertificationReplayDrift } from "./certificationReplayDriftDetector";
import { buildCertificationStateMachine } from "./certificationStateMachine";
import { correlateCertificationTransition } from "./certificationTransitionCorrelator";
import { validateCertificationDeterminism } from "./certificationDeterminismValidator";
import { certifyCapabilityContainment } from "./capabilityContainmentCertifier";
import { validateConstitutionalCertificationInput } from "./constitutionalCertificationValidator";
import { shouldCertificationFailClosed } from "./constitutionalCertificationFailClosedController";
import { shouldReadinessFailClosed } from "./failClosedReadinessEngine";
import { certifyHiddenExecutionPrevention } from "./hiddenExecutionCertifier";
import { certifyImmutableAudit } from "./immutableAuditCertifier";
import { buildOperatorCertificationOverrideLayer } from "./operatorCertificationOverrideLayer";
import { certifyOperatorSupremacy } from "./operatorSupremacyCertifier";
import { auditReplayCertification } from "./replayCertificationAuditor";
import { certifyRecommendationBoundary } from "./recommendationBoundaryCertifier";
import { validateCertificationSuppressionContinuity } from "./certificationSuppressionContinuityValidator";
import { validateTransitionVisibility } from "./transitionVisibilityValidator";
import type {
  DecisionReadinessCertification,
  DecisionReadinessCertificationError,
  DecisionReadinessCertificationInput,
  DecisionReadinessCertificationResult,
  DecisionReadinessCertificationStage,
} from "./types/decisionReadinessCertificationTypes";

function freezeErrors(items: readonly DecisionReadinessCertificationError[]): readonly DecisionReadinessCertificationError[] {
  return Object.freeze([...items]);
}

function buildStages(input: {
  replayPassed: boolean;
  governancePassed: boolean;
  proposalPassed: boolean;
  approvalPassed: boolean;
  transitionPassed: boolean;
  hiddenExecutionPassed: boolean;
  containmentPassed: boolean;
  operatorPassed: boolean;
  auditPassed: boolean;
  failClosed: boolean;
}): readonly DecisionReadinessCertificationStage[] {
  const stages = [
    { stage: "request", passed: true, reasons: [] },
    { stage: "replay_certification", passed: input.replayPassed, reasons: input.replayPassed ? [] : ["DECISION_READINESS_REPLAY_MISMATCH"] },
    { stage: "governance_certification", passed: input.governancePassed, reasons: input.governancePassed ? [] : ["DECISION_READINESS_GOVERNANCE_AMBIGUITY"] },
    { stage: "proposal_lineage_certification", passed: input.proposalPassed, reasons: input.proposalPassed ? [] : ["DECISION_READINESS_MISSING_LINEAGE"] },
    { stage: "approval_replay_certification", passed: input.approvalPassed, reasons: input.approvalPassed ? [] : ["DECISION_READINESS_APPROVAL_INCONSISTENCY"] },
    { stage: "transition_visibility_certification", passed: input.transitionPassed, reasons: input.transitionPassed ? [] : ["DECISION_READINESS_TRANSITION_AMBIGUITY"] },
    { stage: "hidden_execution_certification", passed: input.hiddenExecutionPassed, reasons: input.hiddenExecutionPassed ? [] : ["DECISION_READINESS_HIDDEN_EXECUTION"] },
    { stage: "containment_certification", passed: input.containmentPassed, reasons: input.containmentPassed ? [] : ["DECISION_READINESS_CONTAINMENT_INSTABILITY"] },
    { stage: "operator_supremacy_certification", passed: input.operatorPassed, reasons: input.operatorPassed ? [] : ["DECISION_READINESS_OPERATOR_OVERRIDE_FAILURE"] },
    { stage: "immutable_audit_certification", passed: input.auditPassed, reasons: input.auditPassed ? [] : ["DECISION_READINESS_AUDIT_CORRUPTION"] },
    { stage: "fail_closed_certification", passed: !input.failClosed, reasons: input.failClosed ? ["DECISION_READINESS_FAIL_CLOSED"] : [] },
    { stage: "append_only_evidence_generation", passed: true, reasons: [] },
  ] satisfies { stage: string; passed: boolean; reasons: string[] }[];
  return Object.freeze(stages.map((stage) => Object.freeze({
    ...stage,
    reasons: Object.freeze(stage.reasons),
    deterministicHash: hashCertificationValue("decision-readiness-stage", stage),
  })));
}

export function certifyDecisionReadiness(
  input: DecisionReadinessCertificationInput,
): DecisionReadinessCertificationResult {
  const inputErrors = validateConstitutionalCertificationInput(input);
  const replayErrors = auditReplayCertification(input);
  const governanceRecord = correlateCertificationGovernance(input);
  const dependencyErrors = validateCertificationDependencies(input);
  const transitionErrors = correlateCertificationTransition(input);
  const hiddenExecutionErrors = certifyHiddenExecutionPrevention(input);
  const containment = certifyCapabilityContainment(input);
  const operator = certifyOperatorSupremacy(input);
  const auditErrors = certifyImmutableAudit(input);
  const determinismErrors = validateCertificationDeterminism(input);
  const driftErrors = detectCertificationReplayDrift(input);
  const visibilityErrors = validateTransitionVisibility(input);
  const boundaryErrors = certifyRecommendationBoundary(input);
  const suppressionErrors = validateCertificationSuppressionContinuity(input);
  const antiEmergenceErrors = detectCertificationAntiEmergence(input);
  const replayRecord = reconstructCertificationReplay(input);
  const compatibility = buildCertificationCompatibility(input);
  const stateMachine = buildCertificationStateMachine();
  const overrideLayer = buildOperatorCertificationOverrideLayer(input);

  const errors = freezeErrors([
    ...inputErrors,
    ...replayErrors,
    ...dependencyErrors,
    ...transitionErrors,
    ...hiddenExecutionErrors,
    ...containment.errors,
    ...operator.errors,
    ...auditErrors,
    ...determinismErrors,
    ...driftErrors,
    ...visibilityErrors,
    ...boundaryErrors,
    ...suppressionErrors,
    ...antiEmergenceErrors,
  ]);
  const freeze = buildCertificationFreeze(errors);
  const failClosed = shouldReadinessFailClosed(errors) || shouldCertificationFailClosed(errors);

  const certificationBase = {
    certificationId: input.certificationId,
    recommendationSystemId: input.recommendationSystemId,
    replayDeterminismVerified: replayRecord.replayDeterministic && replayRecord.replayCertified,
    governanceLineageVerified: governanceRecord.governanceLineageVerified,
    proposalLineageVerified: input.proposalIntegrityResult.lineage.lineageHash.length > 0,
    approvalDependencyReplayVerified: input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0,
    operatorSupremacyVerified: operator.record.operatorSupremacyVerified,
    capabilityContainmentVerified: containment.record.capabilityContainmentVerified,
    hiddenExecutionPreventionVerified: containment.record.hiddenExecutionPreventionVerified,
    transitionVisibilityVerified: containment.record.transitionVisibilityVerified,
    immutableAuditabilityVerified: auditErrors.length === 0,
    failClosedEnforcementVerified: true,
    executionAuthorized: false as const,
    certificationHash: "",
    evidenceHash: "",
    certifiedAt: input.certifiedAt,
  };

  const evidence = buildCertificationEvidence({
    certificationInput: input,
    reasons: errors.map((error) => error.code),
  });
  const certificationHash = hashCertificationValue("decision-readiness-certification", {
    ...certificationBase,
    certificationHash: null,
    evidenceHash: evidence.evidenceHash,
    policy: DECISION_READINESS_CERTIFICATION_POLICY,
    stateMachineHash: stateMachine.stateMachineHash,
    overrideHash: overrideLayer.deterministicHash,
  });
  const certification: DecisionReadinessCertification = Object.freeze({
    ...certificationBase,
    certificationHash,
    evidenceHash: evidence.evidenceHash,
  });

  const lineageEntry = buildCertificationLineageEntry(input, !failClosed);
  const lineage = appendCertificationLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditRecord = Object.freeze({
    immutableAuditabilityVerified: auditErrors.length === 0,
    failClosedEnforcementVerified: true,
    auditHash: hashCertificationValue("decision-readiness-audit-record", {
      certificationId: input.certificationId,
      certificationHash,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      freezeHash: freeze.freezeHash,
    }),
  });

  const auditLedger = appendCertificationAuditEntry({
    existing: appendCertificationAuditEntry({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "decision.readiness.certification.requested",
        certificationId: input.certificationId,
        recommendationSystemId: input.recommendationSystemId,
        replayHash: replayRecord.replayHash,
      }),
      scope: "decision-readiness-certification",
    }),
    payload: Object.freeze({
      event: failClosed ? "decision.readiness.certification.frozen" : "decision.readiness.certification.certified",
      certificationId: input.certificationId,
      certificationHash,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      auditHash: auditRecord.auditHash,
    }),
    scope: "decision-readiness-certification-audit",
  });

  const stages = buildStages({
    replayPassed: replayErrors.length === 0 && driftErrors.length === 0 && determinismErrors.length === 0,
    governancePassed: governanceRecord.governanceLineageVerified,
    proposalPassed: input.proposalIntegrityResult.lineage.lineageHash.length > 0,
    approvalPassed: input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0,
    transitionPassed: transitionErrors.length === 0 && visibilityErrors.length === 0,
    hiddenExecutionPassed: hiddenExecutionErrors.length === 0,
    containmentPassed: containment.errors.length === 0 && boundaryErrors.length === 0,
    operatorPassed: operator.errors.length === 0 && suppressionErrors.length === 0 && compatibility.compatible,
    auditPassed: auditErrors.length === 0,
    failClosed,
  });

  return Object.freeze({
    certification,
    replayRecord,
    governanceRecord,
    proposalRecord: Object.freeze({
      proposalId: input.proposalIntegrityResult.proposal.proposalId,
      proposalHash: input.proposalIntegrityResult.proposal.proposalHash,
      proposalLineageVerified: input.proposalIntegrityResult.lineage.lineageHash.length > 0,
      proposalRecordHash: hashCertificationValue("decision-readiness-proposal-record", {
        proposalId: input.proposalIntegrityResult.proposal.proposalId,
        proposalHash: input.proposalIntegrityResult.proposal.proposalHash,
        proposalLineageHash: input.proposalIntegrityResult.lineage.lineageHash,
      }),
    }),
    approvalRecord: Object.freeze({
      approvalDependencyIds: Object.freeze([...input.proposalIntegrityResult.proposal.approvalDependencyIds]),
      approvalDependencyReplayVerified: input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0,
      approvalRecordHash: hashCertificationValue("decision-readiness-approval-record", {
        approvalDependencyIds: input.proposalIntegrityResult.proposal.approvalDependencyIds,
      }),
    }),
    containmentRecord: containment.record,
    operatorRecord: operator.record,
    auditRecord,
    evidence,
    freeze,
    stages,
    lineage,
    auditLedger,
    errors,
    warnings: Object.freeze(
      failClosed
        ? ["Decision readiness certification froze rather than certify under constitutional uncertainty."]
        : ["Decision readiness certification remained non-executing and operator-subordinate."],
    ),
    deterministicHash: hashCertificationValue("decision-readiness-result", {
      certificationHash,
      evidenceHash: evidence.evidenceHash,
      lineageHash: lineage.lineageHash,
      auditHash: auditRecord.auditHash,
      freezeHash: freeze.freezeHash,
      stageHashes: stages.map((stage) => stage.deterministicHash),
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildDecisionReadinessCertificationEngine = certifyDecisionReadiness;
