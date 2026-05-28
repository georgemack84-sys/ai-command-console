import type { PolicyDecisionExplanation, PolicyDecisionExplanationRequest, PolicyDecisionExplainerError } from "@/types/policy-decision-explainer";
import { hashPolicyDecisionExplanationValue } from "./decisionExplanationHasher";
import { assemblePolicyDecisionExplanation } from "./decisionExplanationAssembler";

function buildUnsupportedSourceExplanation(request: PolicyDecisionExplanationRequest, message: string): PolicyDecisionExplanation {
  const errors: readonly PolicyDecisionExplainerError[] = Object.freeze([{
    code: "POLICY_UNSUPPORTED_SOURCE_ARTIFACT",
    message,
    path: "treatyEvidence",
  }]);
  const explanationHash = hashPolicyDecisionExplanationValue("policy-decision-unsupported-source", {
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
      failClosedReason: "POLICY_UNSUPPORTED_SOURCE_ARTIFACT",
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

export function buildPolicyDecisionExplanation(
  request: PolicyDecisionExplanationRequest,
): PolicyDecisionExplanation {
  if (!request?.decisionId || !request.executionId) {
    return buildUnsupportedSourceExplanation(request, "policy decision explanation requires identifiers");
  }

  try {
    const explanation = assemblePolicyDecisionExplanation(request);
    const expectedHash = hashPolicyDecisionExplanationValue("policy-decision-explanation", {
      decisionId: explanation.decisionId,
      executionId: explanation.executionId,
      finalDecision: explanation.finalDecision,
      policyActivations: explanation.policyActivations,
      governanceReasoning: explanation.governanceReasoning,
      riskExplanation: explanation.riskExplanation,
      approvalExplanation: explanation.approvalExplanation,
      constraintExplanation: explanation.constraintExplanation,
      enforcementExplanation: explanation.enforcementExplanation,
      replayExplanation: explanation.replayExplanation,
      evidenceRefs: explanation.evidenceRefs,
      warnings: explanation.warnings,
      errors: explanation.errors,
    });

    if (expectedHash !== explanation.explanationHash) {
      return Object.freeze({
        ...explanation,
        errors: Object.freeze([
          ...explanation.errors,
          {
            code: "POLICY_EXPLANATION_HASH_INVALID" as const,
            message: "policy explanation hash mismatch detected",
            path: "explanationHash",
            expected: expectedHash,
            actual: explanation.explanationHash,
          },
        ]),
      });
    }

    return explanation;
  } catch (error) {
    return buildUnsupportedSourceExplanation(
      request,
      error instanceof Error ? error.message : "unsupported source artifact",
    );
  }
}
