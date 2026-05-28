import type {
  ApprovalDependency,
  ConstitutionalReadinessCertification,
  ConstitutionalReadinessError,
  ConstitutionalReadinessLevel,
  ReadinessAutonomyState,
  ReadinessContainment,
  ReadinessDrift,
  ReadinessLineageLedger,
  ReadinessValidation,
  SafeActionProposal,
} from "@/types/constitutional-autonomy-readiness-gate";
import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { SafeActionProfile } from "@/types/safe-action-catalog";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import type { MonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { BoundedCoordinationFrameworkRecord } from "@/types/bounded-coordination-framework";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { guardReadinessInput } from "./readinessGuards";
import { validateReadinessReplay } from "./readinessReplayValidator";
import { validateReadinessGovernance } from "./readinessGovernanceValidator";
import { validateReadinessApproval } from "./readinessApprovalValidator";
import { validateReadinessOverride } from "./readinessOverrideValidator";
import { validateReadinessConfidence } from "./readinessConfidenceValidator";
import { validateReadinessTopology } from "./readinessTopologyValidator";
import { detectHiddenExecution } from "./hiddenExecutionDetector";
import { validateRuntimeBoundary } from "./runtimeBoundaryValidator";
import { inspectReadinessContainment } from "./readinessContainmentInspector";
import { detectReadinessDrift } from "./readinessDriftDetector";
import { bindReadinessReplay } from "./readinessReplayBinder";
import { buildReadinessCertification } from "./readinessCertificationEngine";
import { appendReadinessLineage } from "./readinessLineageLedger";
import { validateReadinessCertification, validateReadinessTimestamp, validateReadinessValidation } from "./readinessSchemas";
import { createReadinessError } from "./readinessErrors";
import { hashReadinessValue } from "./readinessHasher";

export type ConstitutionalAutonomyReadinessGateInput = Readonly<{
  governanceView: ConstitutionalGovernanceView;
  readinessProfile: AutonomyReadinessProfile;
  safeActionProfile: SafeActionProfile;
  proposal: ProposalRecord;
  approvalGraph: ApprovalDependencyGraph;
  overrideContract: OverrideContractRecord;
  monitoringModel: MonitoringTriggerModel;
  auditEpisode: AutonomyAuditEpisode;
  coordinationFramework: BoundedCoordinationFrameworkRecord;
  escalation: ConstitutionalEscalationRecord;
  replay: ReplayReconstructionResult;
  generatedAt: string;
  existingLineage?: ReadinessLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalAutonomyReadinessGateRecord = Readonly<{
  certification: ConstitutionalReadinessCertification;
  validation: ReadinessValidation;
  containment: ReadinessContainment;
  drift: ReadinessDrift;
  replayBinding: import("@/types/constitutional-autonomy-readiness-gate").ConstitutionalReadinessReplayBinding;
  lineage: ReadinessLineageLedger;
  proposalView: SafeActionProposal;
  approvalView: readonly ApprovalDependency[];
  warnings: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
  readinessHash: string;
  derivedOnly: true;
}>;

function deriveReadinessState(input: {
  readinessProfile: AutonomyReadinessProfile;
  proposal: ProposalRecord;
  overrideContract: OverrideContractRecord;
  governanceValid: boolean;
}): ReadinessAutonomyState {
  if (input.overrideContract.killSwitch || input.overrideContract.freezeState.active) {
    return "paused";
  }
  if (!input.governanceValid || input.proposal.lifecycleDecision === "DENY") {
    return "denied";
  }
  if (input.proposal.resultingState === "archived") {
    return "archived";
  }
  if (input.proposal.revocation.status === "revoked") {
    return "revoked";
  }
  switch (input.readinessProfile.derivedState) {
    case "observe_only":
      return "observe";
    case "recommendation_only":
      return "recommend";
    case "planning_only":
    case "simulation_only":
      return "prepare";
    default:
      return "escalate";
  }
}

function deriveReadinessLevel(input: {
  replayValid: boolean;
  governanceValid: boolean;
  approvalValid: boolean;
  overrideValid: boolean;
  escalationValid: boolean;
  containmentValid: boolean;
  confidenceValid: boolean;
  hiddenExecutionAbsent: boolean;
  driftDetected: boolean;
}): ConstitutionalReadinessLevel {
  if (!input.replayValid) {
    return "CR0_UNVERIFIED";
  }
  if (!input.governanceValid) {
    return "CR1_REPLAY_VALID";
  }
  if (!input.approvalValid) {
    return "CR2_GOVERNANCE_VALID";
  }
  if (!input.overrideValid) {
    return "CR3_APPROVAL_VALID";
  }
  if (!input.escalationValid) {
    return "CR4_OVERRIDE_VALID";
  }
  if (!input.containmentValid || !input.hiddenExecutionAbsent || !input.confidenceValid || input.driftDetected) {
    return "CR5_ESCALATION_VALID";
  }
  return "CR7_CONSTITUTIONALLY_READY";
}

export function buildConstitutionalAutonomyReadinessGate(
  input: ConstitutionalAutonomyReadinessGateInput,
): ConstitutionalAutonomyReadinessGateRecord {
  const guardErrors = guardReadinessInput(input);
  const replayCheck = validateReadinessReplay(input);
  const governanceCheck = validateReadinessGovernance(input.governanceView);
  const approvalCheck = validateReadinessApproval({
    proposal: input.proposal,
    approvalGraph: input.approvalGraph,
  });
  const overrideCheck = validateReadinessOverride(input.overrideContract);
  const confidenceCheck = validateReadinessConfidence(input.monitoringModel);
  const topologyCheck = validateReadinessTopology(input.coordinationFramework);
  const hiddenExecutionCheck = detectHiddenExecution({
    metadata: input.metadata,
    extraEvidence: input.monitoringModel.warnings,
  });
  const runtimeBoundaryCheck = validateRuntimeBoundary(input.monitoringModel);
  const drift = detectReadinessDrift({
    readinessProfile: input.readinessProfile,
    safeActionProfile: input.safeActionProfile,
    proposal: input.proposal,
    escalation: input.escalation,
    createdAt: input.generatedAt,
  });
  const replayBindingResult = bindReadinessReplay(input);
  const containment = inspectReadinessContainment({
    coordinationFramework: input.coordinationFramework,
    hiddenExecutionDetected: hiddenExecutionCheck.hiddenExecutionDetected,
    runtimeBoundarySafe: runtimeBoundaryCheck.runtimeBoundarySafe,
    createdAt: input.generatedAt,
  });

  const escalationValid =
    input.escalation.recommendation.executable === false
    && input.escalation.derivedOnly
    && input.escalation.replayBinding.valid
    && input.escalation.errors.length === 0;
  const readinessLevel = deriveReadinessLevel({
    replayValid: replayCheck.replayValid && replayBindingResult.replayBinding.valid,
    governanceValid: governanceCheck.governanceValid,
    approvalValid: approvalCheck.approvalValid,
    overrideValid: overrideCheck.overrideValid,
    escalationValid,
    containmentValid: containment.boundedCoordination && containment.overrideSupremacyPreserved && containment.runtimeBoundarySafe && containment.nonExecutingArchitecture && topologyCheck.topologyValid,
    confidenceValid: confidenceCheck.confidenceValid,
    hiddenExecutionAbsent: !hiddenExecutionCheck.hiddenExecutionDetected,
    driftDetected: drift.driftDetected,
  });

  const validation: ReadinessValidation = Object.freeze({
    validationId: hashReadinessValue("readiness-validation-id", {
      proposalId: input.proposal.proposalId,
      generatedAt: input.generatedAt,
    }),
    readinessLevel,
    autonomyState: deriveReadinessState({
      readinessProfile: input.readinessProfile,
      proposal: input.proposal,
      overrideContract: input.overrideContract,
      governanceValid: governanceCheck.governanceValid,
    }),
    replayValid: replayCheck.replayValid && replayBindingResult.replayBinding.valid,
    governanceValid: governanceCheck.governanceValid,
    approvalValid: approvalCheck.approvalValid,
    overrideValid: overrideCheck.overrideValid,
    escalationValid,
    containmentValid: containment.boundedCoordination && containment.overrideSupremacyPreserved && containment.runtimeBoundarySafe && containment.nonExecutingArchitecture && topologyCheck.topologyValid,
    confidenceValid: confidenceCheck.confidenceValid,
    hiddenExecutionAbsent: !hiddenExecutionCheck.hiddenExecutionDetected,
    driftDetected: drift.driftDetected,
    reasons: Object.freeze([
      ...replayCheck.reasons,
      ...governanceCheck.reasons,
      ...approvalCheck.reasons,
      ...overrideCheck.reasons,
      ...confidenceCheck.reasons,
      ...topologyCheck.reasons,
      ...containment.reasons,
      ...(drift.driftDetected ? ["Readiness drift detected across constitutional hashes."] : ["No readiness drift detected."]),
    ]),
    createdAt: input.generatedAt,
  });

  const certification = buildReadinessCertification({
    validation,
    createdAt: input.generatedAt,
  });
  const lineageHash = hashReadinessValue("readiness-lineage-hash", {
    readinessHash: input.readinessProfile.readinessHash,
    proposalHash: input.proposal.proposalHash,
    escalationHash: input.escalation.escalationHash,
    replayBinding: replayBindingResult.replayBinding,
  });
  const provisionalReadinessHash = hashReadinessValue("readiness-provisional", {
    certification,
    validation,
    containment,
    drift,
    replayBinding: replayBindingResult.replayBinding,
  });
  const lineage = appendReadinessLineage({
    existing: input.existingLineage,
    certificationId: certification.certificationId,
    readinessHash: provisionalReadinessHash,
    replayHash: replayBindingResult.replayBinding.reconstructionHash,
    lineageHash,
    createdAt: input.generatedAt,
  });

  const errors: ConstitutionalReadinessError[] = [
    ...guardErrors,
    ...replayCheck.errors,
    ...governanceCheck.errors,
    ...approvalCheck.errors,
    ...overrideCheck.errors,
    ...confidenceCheck.errors,
    ...topologyCheck.errors,
    ...hiddenExecutionCheck.errors,
    ...runtimeBoundaryCheck.errors,
    ...replayBindingResult.errors,
    ...(drift.driftDetected
      ? [createReadinessError("AUTONOMY_READINESS_DRIFT", "Readiness hash drift detected across the constitutional stack.", "drift")]
      : []),
    ...validateReadinessValidation(validation),
    ...validateReadinessCertification(certification),
    ...validateReadinessTimestamp(input.generatedAt, "generatedAt"),
  ];

  const proposalView: SafeActionProposal = Object.freeze({
    proposalId: input.proposal.proposalId,
    autonomyLevel: input.readinessProfile.autonomyLevel as "A0" | "A1" | "A2",
    actionType: input.safeActionProfile.definition.id,
    riskLevel: input.safeActionProfile.riskClass,
    confidenceScore: input.monitoringModel.confidenceEscalation.currentConfidenceScore,
    approvalRequired: !input.proposal.approval.valid,
    governanceBindings: Object.freeze([input.proposal.governanceBinding.governanceDecisionHash]),
    replaySnapshotId: input.proposal.replayBinding.replaySnapshotHash,
    createdAt: input.proposal.createdAt,
  });
  const approvalView: readonly ApprovalDependency[] = Object.freeze(
    input.approvalGraph.nodes.map((node) => Object.freeze({
      dependencyId: node.approvalId,
      proposalId: node.proposalId,
      requiredApprovalType: node.dependencyType,
      status:
        node.approvalState === "required" ? "pending"
        : node.approvalState === "satisfied" ? "approved"
        : node.approvalState === "expired" ? "denied"
        : node.approvalState === "blocked" ? "denied"
        : node.approvalState,
      expiresAt: node.timeWindow.validUntil,
    })),
  );

  const readinessHash = hashReadinessValue("constitutional-autonomy-readiness-gate", {
    certification,
    validation,
    containment,
    drift,
    replayBinding: replayBindingResult.replayBinding,
    lineage,
    errors,
  });

  return Object.freeze({
    certification,
    validation,
    containment,
    drift,
    replayBinding: replayBindingResult.replayBinding,
    lineage,
    proposalView,
    approvalView,
    warnings: Object.freeze([
      ...input.readinessProfile.warnings,
      ...input.safeActionProfile.warnings,
      ...input.proposal.warnings,
      ...input.approvalGraph.warnings,
      ...input.overrideContract.warnings,
      ...input.monitoringModel.warnings,
      ...input.auditEpisode.warnings,
      ...input.coordinationFramework.warnings,
      ...input.escalation.warnings,
      ...(readinessLevel !== "CR7_CONSTITUTIONALLY_READY"
        ? ["Readiness certification is declarative only and does not grant operational authority."]
        : []),
    ]),
    errors: Object.freeze(errors),
    readinessHash,
    derivedOnly: true,
  });
}
