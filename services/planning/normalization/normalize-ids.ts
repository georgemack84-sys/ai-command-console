import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";

import type { CanonicalPlan } from "../contracts/plan-types";
import { createNormalizationError } from "./normalization-errors";
import type { NormalizationEvent, PlanNormalizationError } from "./normalization-types";

export function normalizePlanStepIds(plan: CanonicalPlan): {
  ids: Record<string, string>;
  events: NormalizationEvent[];
  error?: PlanNormalizationError;
} {
  const ids: Record<string, string> = {};
  const seen = new Set<string>();
  const events: NormalizationEvent[] = [];

  for (const [index, step] of plan.steps.entries()) {
    const canonicalId = `step-${String(index + 1).padStart(3, "0")}-${hashPayloadDeterministically({
      planId: plan.planId,
      sourceId: step.stepId,
    }).slice(0, 8)}`;

    if (seen.has(canonicalId)) {
      return {
        ids,
        events,
        error: createNormalizationError(
          "PLAN_NORMALIZATION_ID_COLLISION",
          `Canonical step id collision detected for ${step.stepId}.`,
        ),
      };
    }

    seen.add(canonicalId);
    ids[step.stepId] = canonicalId;
    events.push({
      eventId: `normalize-id:${canonicalId}`,
      path: `steps.${index}.id`,
      action: "ID_NORMALIZED",
      before: step.stepId,
      after: canonicalId,
      reason: "Stable canonical step ids are derived from authored step ids and plan id.",
    });
  }

  return { ids, events };
}

