import type {
  RecommendationIntegrityError,
  RecommendationIntegrityInput,
  RecommendationViolation,
  RecommendationWeakness,
} from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "./deterministicRecommendationHasher";

function error(
  code: RecommendationIntegrityError["code"],
  message: string,
  path?: string,
): RecommendationIntegrityError {
  return Object.freeze({ code, message, path });
}

export function validateRecommendationGovernanceBinding(input: RecommendationIntegrityInput): {
  governanceLinked: boolean;
  errors: readonly RecommendationIntegrityError[];
  violations: readonly RecommendationViolation[];
  weaknesses: readonly RecommendationWeakness[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const governanceLinked =
    input.attackResult.record.governanceSnapshotId === input.attackResult.record.governanceSnapshotId
    && !serialized.includes("bypassgovernance")
    && !serialized.includes("detachgovernance")
    && !serialized.includes("substitutegovernance");
  if (governanceLinked) {
    return Object.freeze({
      governanceLinked: true,
      errors: Object.freeze([]),
      violations: Object.freeze([]),
      weaknesses: Object.freeze([]),
    });
  }
  return Object.freeze({
    governanceLinked: false,
    errors: Object.freeze([
      error(
        "RECOMMENDATION_GOVERNANCE_LINKAGE_MISSING",
        "Recommendation governance binding was missing, stale, or substituted.",
        "metadata",
      ),
    ]),
    violations: Object.freeze([
      Object.freeze({
        violationId: hashRecommendationIntegrityValue("governance-violation-id", input.recommendationId),
        recommendationId: input.recommendationId,
        coordinationId: input.attackResult.record.coordinationId,
        domain: "governance",
        severity: "critical",
        createdAt: input.createdAt,
        deterministicHash: hashRecommendationIntegrityValue("governance-violation", serialized),
      }),
    ]),
    weaknesses: Object.freeze([
      Object.freeze({
        weaknessId: hashRecommendationIntegrityValue("governance-weakness-id", input.recommendationId),
        recommendationId: input.recommendationId,
        classification: "RECOMMENDATION_GOVERNANCE_RISK",
        severity: "CONSTITUTIONAL_BLOCKER",
        rationale: "Governance linkage was incomplete or detached.",
        advisoryOnly: true as const,
        deterministicHash: hashRecommendationIntegrityValue("governance-weakness", serialized),
      }),
    ]),
  });
}
