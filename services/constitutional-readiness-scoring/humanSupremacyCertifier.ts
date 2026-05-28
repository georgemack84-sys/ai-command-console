import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  HumanSupremacyCertificationRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function certifyHumanSupremacy(input: ConstitutionalReadinessInput): {
  record: HumanSupremacyCertificationRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const supremacyPreserved =
    input.humanSupremacyResult.record.governanceBound
    && input.humanSupremacyResult.record.replaySafe
    && input.humanSupremacyResult.record.enforcementState !== "INVALID"
    && input.humanSupremacyResult.record.enforcementState !== "DISPUTED";
  const score = supremacyPreserved ? 1 : 0.1;

  const errors: ConstitutionalReadinessError[] = [];
  if (!supremacyPreserved) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_SUPREMACY_BROKEN",
      message: "Human supremacy guarantees degraded below constitutional minimums.",
      path: "humanSupremacyResult.record.enforcementState",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      supremacyId: input.humanSupremacyResult.record.supremacyId,
      supremacyPreserved,
      operatorReviewRequired: true as const,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-human-supremacy", {
        supremacyId: input.humanSupremacyResult.record.supremacyId,
        supremacyPreserved,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
