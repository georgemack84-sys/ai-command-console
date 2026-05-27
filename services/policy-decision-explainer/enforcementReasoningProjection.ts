import type { StepTraceView } from "@/types/step-trace-viewer";
import type { EnforcementChainStep, EnforcementExplanationView, PolicyDecisionExplainerError } from "@/types/policy-decision-explainer";

export function projectEnforcementReasoning(input: {
  traceView: StepTraceView;
}): { reasoning: EnforcementExplanationView; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const chain: EnforcementChainStep[] = input.traceView.validationView.items.map((item) => Object.freeze({
    step: item.validator,
    status: item.status,
    reason: item.failureCode ?? item.status,
    evidenceHash: item.hash,
  }));

  const blockingPoint = chain.find((item) => item.status !== "passed")?.step;
  if (chain.length === 0) {
    errors.push({
      code: "POLICY_ENFORCEMENT_CHAIN_INVALID",
      message: "enforcement chain is unavailable",
      path: "traceView.validationView.items",
    });
  }

  return {
    reasoning: Object.freeze({
      enforcementChain: Object.freeze(chain),
      enforcementOrder: Object.freeze(chain.map((item) => item.step)),
      blockingPoint,
      finalDecisionSource: blockingPoint ?? "validation.completed",
      failClosedReason: chain.find((item) => item.status !== "passed")?.reason,
    }),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
