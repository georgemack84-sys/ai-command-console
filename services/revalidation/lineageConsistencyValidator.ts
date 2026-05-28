import type { FreshnessError } from "@/types/freshness";
import { createFreshnessError } from "@/services/freshness/freshnessGuards";

export function validateLineageConsistency(input: {
  lifecycleEntries: number;
  currentLifecycleState: string;
  resultingLifecycleState: string;
  correlationEntries: number;
}): readonly FreshnessError[] {
  const errors: FreshnessError[] = [];
  if (input.lifecycleEntries === 0) {
    errors.push(createFreshnessError(
      "SYNTHETIC_REPLAY_REJECTED",
      "Lifecycle lineage must not be empty during replay revalidation.",
      "lifecycleLineage",
    ));
  }
  if (input.currentLifecycleState !== input.resultingLifecycleState) {
    errors.push(createFreshnessError(
      "UNSAFE_CONTINUITY_REJECTED",
      "Current lifecycle state and immutable resulting state diverged during revalidation.",
      "lifecycleState",
    ));
  }
  if (input.correlationEntries === 0) {
    errors.push(createFreshnessError(
      "SYNTHETIC_REPLAY_REJECTED",
      "Correlation lineage must not be synthesized or omitted during revalidation.",
      "correlationLineage",
    ));
  }
  return Object.freeze(errors);
}
