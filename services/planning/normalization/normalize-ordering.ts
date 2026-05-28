import type { CanonicalPlan } from "../contracts/plan-types";
import type { NormalizationEvent } from "./normalization-types";

export function preserveValidatedOrdering(plan: CanonicalPlan) {
  const authoredStepOrder = plan.steps.map((step) => step.stepId);
  const events: NormalizationEvent[] = [{
    eventId: `ordering:${plan.planId}`,
    path: "steps",
    action: "ORDER_CANONICALIZED",
    before: authoredStepOrder,
    after: authoredStepOrder,
    reason: "Authored step order from 4.2B is preserved exactly.",
  }];

  return {
    authoredStepOrder,
    events,
  };
}

