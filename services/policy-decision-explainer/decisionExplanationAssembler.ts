import type { PolicyDecisionExplanation, PolicyDecisionExplanationRequest } from "@/types/policy-decision-explainer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import { hashPolicyDecisionExplanationValue } from "./decisionExplanationHasher";
import { projectApprovalReasoning } from "./approvalReasoningProjection";
import { projectConstraintReasoning } from "./constraintReasoningProjection";
import { projectEnforcementReasoning } from "./enforcementReasoningProjection";
import { projectGovernanceReasoning } from "./governanceReasoningProjection";
import { projectPolicyActivations } from "./policyActivationProjection";
import { projectPolicyReplayReasoning } from "./policyReplayProjection";
import { projectRiskReasoning } from "./riskReasoningProjection";

function asTreatyPackage(value: unknown): ExecutionTreatyPackage | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const candidate = value as Partial<ExecutionTreatyPackage>;
  if (!candidate.manifest || !candidate.evidence || !candidate.hashes) {
    return undefined;
  }
  return candidate as ExecutionTreatyPackage;
}

function deriveFinalDecision(input: {
  strict?: boolean;
  traceStatus: string;
  governanceDecision: string;
  hasErrors: boolean;
  replayMismatch: boolean;
}): PolicyDecisionExplanation["finalDecision"] {
  if (input.strict && input.hasErrors) {
    return "unknown";
  }
  if (input.governanceDecision === "denied") {
    return "denied";
  }
  if (input.governanceDecision === "requires_review") {
    return "requires_review";
  }
  if (input.replayMismatch || input.traceStatus === "disputed") {
    return "escalated";
  }
  if (input.traceStatus === "quarantined" || input.traceStatus === "revalidation-required") {
    return "requires_review";
  }
  if (input.traceStatus === "invalid" || input.traceStatus === "denied") {
    return "denied";
  }
  if (input.traceStatus === "approved") {
    return "approved";
  }
  return "unknown";
}

export function assemblePolicyDecisionExplanation(
  request: PolicyDecisionExplanationRequest,
): PolicyDecisionExplanation {
  if (!request.traceView) {
    const errors = Object.freeze([{
      code: "POLICY_SOURCE_TRACE_MISSING" as const,
      message: "policy decision explanation requires a trace view",
      path: "traceView",
    }]);
    const explanationHash = hashPolicyDecisionExplanationValue("policy-decision-fail-closed", {
      decisionId: request.decisionId,
      executionId: request.executionId,
      errors,
    });
    return Object.freeze({
      decisionId: request.decisionId,
      executionId: request.executionId,
      finalDecision: "unknown",
      policyActivations: Object.freeze([]),
      governanceReasoning: Object.freeze({
        decision: "unknown",
        escalationState: "unknown",
        unknownReasoning: true,
      }),
      riskExplanation: Object.freeze({
        contributors: Object.freeze([]),
        missingRiskEvidence: true,
        riskDrivenEscalation: false,
        unknownRiskState: true,
      }),
      approvalExplanation: Object.freeze({
        approvalsRequired: Object.freeze([]),
        approvalsReceived: Object.freeze([]),
        approvalsMissing: Object.freeze([]),
        approvalLineage: Object.freeze([]),
        policyEvidenceRefs: Object.freeze([]),
        governanceEvidenceRefs: Object.freeze([]),
        incomplete: true,
      }),
      constraintExplanation: Object.freeze({
        blockingConstraints: Object.freeze([]),
        deniedCapabilities: Object.freeze([]),
        missingApprovalConstraints: true,
        governanceMismatchConstraints: false,
        replayMismatchConstraints: false,
      }),
      enforcementExplanation: Object.freeze({
        enforcementChain: Object.freeze([]),
        enforcementOrder: Object.freeze([]),
        finalDecisionSource: "unknown",
        failClosedReason: "POLICY_SOURCE_TRACE_MISSING",
      }),
      replayExplanation: Object.freeze({
        replayMismatch: false,
        governanceReplayWarnings: Object.freeze([]),
        divergenceFlags: Object.freeze([]),
        unavailable: true,
      }),
      evidenceRefs: Object.freeze([]),
      warnings: Object.freeze([]),
      errors,
      explanationHash,
    });
  }

  const treaty = asTreatyPackage(request.treatyEvidence);
  const activation = projectPolicyActivations({
    traceView: request.traceView,
    governanceOverlay: request.traceView.governanceOverlay,
    treaty,
  });
  const governance = projectGovernanceReasoning({
    traceView: request.traceView,
    treaty,
  });
  const risk = projectRiskReasoning({
    traceView: request.traceView,
  });
  const approval = projectApprovalReasoning({
    traceView: request.traceView,
    treaty,
  });
  const constraints = projectConstraintReasoning({
    traceView: request.traceView,
  });
  const enforcement = projectEnforcementReasoning({
    traceView: request.traceView,
  });
  const replay = projectPolicyReplayReasoning({
    traceView: request.traceView,
  });

  const warnings = Object.freeze([
    ...request.traceView.warnings.map((warning) => warning.message),
    ...activation.warnings,
    ...governance.warnings,
    ...risk.warnings,
    ...approval.warnings,
    ...constraints.warnings,
    ...enforcement.warnings,
    ...replay.warnings,
  ].sort((left, right) => left.localeCompare(right)));

  const errors = Object.freeze([
    ...activation.errors,
    ...governance.errors,
    ...risk.errors,
    ...approval.errors,
    ...constraints.errors,
    ...enforcement.errors,
    ...replay.errors,
  ].sort((left, right) => left.code.localeCompare(right.code) || (left.path ?? "").localeCompare(right.path ?? "")));

  const evidenceRefs = Object.freeze(
    [
      request.traceView.sourceTruthHash,
      request.traceView.traceProjectionHash,
      request.traceView.governanceOverlay?.evidenceHash,
      request.traceView.forensicView?.explanationHash,
      request.traceView.replayView?.replayHash,
      treaty?.hashes.treatyHash,
      treaty?.hashes.evidenceHash,
      treaty?.manifest.governanceSnapshotHash,
      treaty?.manifest.approvalChainHash,
      treaty?.manifest.replayBindingHash,
      treaty?.manifest.provenanceHash,
      treaty?.manifest.signatureHash,
      treaty?.evidence.governanceLineageHash,
      treaty?.evidence.replayLineageHash,
      treaty?.evidence.registryLineageHash,
    ]
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => left.localeCompare(right)),
  );

  const finalDecision = deriveFinalDecision({
    strict: request.options?.strict,
    traceStatus: request.traceView.validationView.status,
    governanceDecision: governance.reasoning.decision,
    hasErrors: errors.length > 0,
    replayMismatch: replay.reasoning.replayMismatch,
  });

  const explanationBase = {
    decisionId: request.decisionId,
    executionId: request.executionId,
    finalDecision,
    policyActivations: activation.activations,
    governanceReasoning: governance.reasoning,
    riskExplanation: risk.reasoning,
    approvalExplanation: approval.reasoning,
    constraintExplanation: constraints.reasoning,
    enforcementExplanation: enforcement.reasoning,
    replayExplanation: replay.reasoning,
    evidenceRefs,
    warnings,
    errors,
  };

  return Object.freeze({
    ...explanationBase,
    explanationHash: hashPolicyDecisionExplanationValue("policy-decision-explanation", explanationBase),
  });
}
