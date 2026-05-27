import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { GovernanceReasoningView, PolicyDecisionExplainerError } from "@/types/policy-decision-explainer";

function mapDecision(input: StepTraceView["governanceOverlay"]): GovernanceReasoningView["decision"] {
  if (!input) {
    return "unknown";
  }
  switch (input.decision) {
    case "passed":
      return "approved";
    case "denied":
    case "failed":
      return "denied";
    case "revalidation-required":
      return "requires_review";
    default:
      return "unknown";
  }
}

export function projectGovernanceReasoning(input: {
  traceView: StepTraceView;
  treaty?: ExecutionTreatyPackage;
}): { reasoning: GovernanceReasoningView; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const governance = input.traceView.governanceOverlay;

  if (!governance) {
    errors.push({
      code: "POLICY_REASONING_UNAVAILABLE",
      message: "governance reasoning is unavailable",
      path: "traceView.governanceOverlay",
    });
    return {
      reasoning: Object.freeze({
        decision: "unknown",
        escalationState: "unknown",
        unknownReasoning: true,
      }),
      warnings: Object.freeze(warnings),
      errors: Object.freeze(errors),
    };
  }

  if (!governance.reason) {
    warnings.push("governance reason is missing");
  }

  return {
    reasoning: Object.freeze({
      decisionSource: governance.policyId ?? input.treaty?.manifest.approvalChainHash,
      evaluator: governance.evaluator,
      reason: governance.reason,
      decision: mapDecision(governance),
      escalationState: governance.escalationState,
      governanceEvidenceHash: governance.evidenceHash,
      tracePolicyId: governance.policyId,
      confidenceScore: governance.confidenceScore,
      unknownReasoning: false,
    }),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
