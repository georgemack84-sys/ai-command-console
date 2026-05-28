import type { FreshnessError } from "@/types/freshness";
import { createFreshnessError } from "@/services/freshness/freshnessGuards";

export function evaluateIntegrityCheckpoint(input: {
  lifecycleImmutable: boolean;
  readinessDerivedOnly: boolean;
  escalationDerivedOnly: boolean;
}): readonly FreshnessError[] {
  const errors: FreshnessError[] = [];
  if (!input.lifecycleImmutable || !input.readinessDerivedOnly || !input.escalationDerivedOnly) {
    errors.push(createFreshnessError(
      "UNSAFE_CONTINUITY_REJECTED",
      "Integrity checkpoint failed immutable or derived-only verification.",
      "checkpoint",
    ));
  }
  return Object.freeze(errors);
}
