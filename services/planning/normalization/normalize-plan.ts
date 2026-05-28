import type { CanonicalPlan } from "../contracts/plan-types";
import type { NormalizationEvent } from "./normalization-types";

export function normalizePlanRoot(plan: CanonicalPlan): {
  goal: string;
  events: NormalizationEvent[];
} {
  return {
    goal: plan.mission.objective,
    events: [{
      eventId: `field:${plan.planId}:goal`,
      path: "goal",
      action: "FIELD_RENAMED",
      before: plan.mission.objective,
      after: plan.mission.objective,
      reason: "Mission objective is exposed as normalized goal without semantic rewrite.",
    }],
  };
}

