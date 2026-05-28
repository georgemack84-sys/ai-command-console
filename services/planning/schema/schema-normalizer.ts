import { normalizeDeterministicValue } from "@/services/contracts/deterministicJson";

import type { CanonicalPlan } from "../contracts/plan-types";

function sortStrings(values: readonly string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function normalizeCanonicalPlan(plan: CanonicalPlan): CanonicalPlan {
  const cloned = normalizeDeterministicValue(plan);

  return {
    ...cloned,
    context: {
      ...cloned.context,
      sourceIds: sortStrings(cloned.context.sourceIds),
      evidenceRefs: sortStrings(cloned.context.evidenceRefs),
      constraints: sortStrings(cloned.context.constraints),
    },
    approvals: {
      ...cloned.approvals,
      policyRefs: sortStrings(cloned.approvals.policyRefs),
    },
    steps: cloned.steps.map((step) => ({
      ...step,
      dependencies: sortStrings(step.dependencies),
    })),
  };
}

