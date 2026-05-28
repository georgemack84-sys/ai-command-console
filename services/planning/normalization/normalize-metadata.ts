import type { CanonicalPlan } from "../contracts/plan-types";
import type { CanonicalPlanMetadata, NormalizationEvent } from "./normalization-types";

export function normalizePlanMetadata(plan: CanonicalPlan): {
  metadata: CanonicalPlanMetadata;
  events: NormalizationEvent[];
} {
  const metadata: CanonicalPlanMetadata = {
    plannerVersion: plan.metadata.plannerVersion,
    generatedBy: plan.metadata.generatedBy,
    createdAt: plan.createdAt,
    extensions: {},
  };

  return {
    metadata,
    events: [{
      eventId: `metadata:${plan.planId}`,
      path: "metadata",
      action: "METADATA_CANONICALIZED",
      before: plan.metadata,
      after: metadata,
      reason: "Plan metadata is canonicalized into a stable normalization metadata shape.",
    }],
  };
}

