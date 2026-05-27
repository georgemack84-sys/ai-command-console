import type { CoordinationFreezeRecord, FreshnessError } from "@/types/freshness";
import { createFreshnessError } from "@/services/freshness/freshnessGuards";

export function validateFreezeContainment(input: {
  freeze: CoordinationFreezeRecord;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly FreshnessError[] {
  const errors: FreshnessError[] = [];
  if (input.metadata?.["resumeOnClear"] === true || input.metadata?.["pauseToken"] !== undefined) {
    errors.push(createFreshnessError(
      "FRESHNESS_PAUSE_RESUME_REJECTED",
      "Freeze containment must not expose pause or resume semantics.",
      "metadata",
    ));
  }
  if (input.freeze.frozen && input.freeze.terminalContainment !== true) {
    errors.push(createFreshnessError(
      "UNSAFE_CONTINUITY_REJECTED",
      "Frozen coordination must remain terminal containment.",
      "freeze.terminalContainment",
    ));
  }
  return Object.freeze(errors);
}
