import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ConstraintExplanationItem, ConstraintExplanationView, PolicyDecisionExplainerError } from "@/types/policy-decision-explainer";

export function projectConstraintReasoning(input: {
  traceView: StepTraceView;
}): { reasoning: ConstraintExplanationView; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const blockingConstraints: ConstraintExplanationItem[] = input.traceView.validationView.items
    .filter((item) => !item.passed || Boolean(item.failureCode))
    .map((item) => Object.freeze({
      constraint: item.validator,
      reason: item.failureCode ?? item.status,
      evidenceHash: item.hash,
    }));

  if (blockingConstraints.length === 0 && input.traceView.errors.length > 0) {
    errors.push({
      code: "POLICY_CONSTRAINT_UNAVAILABLE",
      message: "constraint explanation is unavailable",
      path: "traceView.validationView.items",
    });
  }

  return {
    reasoning: Object.freeze({
      blockingConstraints: Object.freeze(blockingConstraints),
      deniedCapabilities: Object.freeze(
        input.traceView.validationView.items
          .filter((item) => item.validator === "capability" && !item.passed)
          .flatMap((item) => item.evidence),
      ),
      missingApprovalConstraints: blockingConstraints.some((item) => item.reason.includes("APPROVAL") || item.reason.includes("approval")),
      governanceMismatchConstraints: blockingConstraints.some((item) => item.constraint === "governance"),
      replayMismatchConstraints: blockingConstraints.some((item) => item.constraint === "replay"),
    }),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
