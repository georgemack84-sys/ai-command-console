import type {
  KnowledgeFreshnessAssessment,
  KnowledgeFreshnessEvaluator,
  KnowledgeReviewPolicy,
} from "../../types/learning-constitution/knowledgeFreshness";
import type { DurableKnowledgeRecord, KnowledgeReview } from "../../types/learning-constitution/durableKnowledge";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";

export const KNOWLEDGE_FRESHNESS_SERVICE_ID = "phase-0-knowledge-freshness-service";

type FreshnessDependencies = Readonly<{
  policies: readonly KnowledgeReviewPolicy[];
  now?: () => string;
}>;

const scopeIdentity = (scope: KnowledgeScopeReference): string =>
  "id" in scope ? `${scope.type}:${scope.id}` : scope.type;

const validPolicy = (policy: KnowledgeReviewPolicy): boolean =>
  Boolean(policy.policyId.trim() && policy.policyVersion.trim()) &&
  Number.isFinite(policy.reviewIntervalDays) && policy.reviewIntervalDays > 0 &&
  Number.isFinite(policy.overdueGraceDays) && policy.overdueGraceDays >= 0;

const assessment = (
  record: DurableKnowledgeRecord,
  values: Omit<KnowledgeFreshnessAssessment, "knowledgeId" | "persistenceEffect" | "authorityEffect" | "executionPermissionGranted">,
): KnowledgeFreshnessAssessment => ({
  knowledgeId: record.knowledgeId,
  ...values,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

export class KnowledgeFreshnessService implements KnowledgeFreshnessEvaluator {
  private readonly now: () => string;

  constructor(private readonly dependencies: FreshnessDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  assess(record: DurableKnowledgeRecord, latestReview?: KnowledgeReview): KnowledgeFreshnessAssessment {
    const matching = this.dependencies.policies.filter((policy) =>
      policy.classification === record.classification &&
      (!policy.scope || scopeIdentity(policy.scope) === scopeIdentity(record.scope)));
    const scoped = matching.filter((policy) => policy.scope);
    const candidates = scoped.length > 0 ? scoped : matching;
    if (candidates.length === 0) {
      return assessment(record, {
        status: "NO_REVIEW_POLICY", reasonCode: "NO_MATCHING_REVIEW_POLICY", recommendedAction: "NONE",
      });
    }
    if (candidates.length !== 1 || !validPolicy(candidates[0])) {
      return assessment(record, {
        status: "INVALID_POLICY", reasonCode: "REVIEW_POLICY_INVALID", recommendedAction: "NONE",
      });
    }

    const policy = candidates[0];
    const basisTimestamp = latestReview?.reviewedAt ?? record.createdAt;
    const basisMillis = Date.parse(basisTimestamp);
    const nowMillis = Date.parse(this.now());
    if (!Number.isFinite(basisMillis) || !Number.isFinite(nowMillis)) {
      return assessment(record, {
        status: "INVALID_POLICY", reasonCode: "REVIEW_POLICY_INVALID", recommendedAction: "NONE",
      });
    }
    const dueMillis = basisMillis + policy.reviewIntervalDays * 24 * 60 * 60 * 1000;
    const overdueMillis = dueMillis + policy.overdueGraceDays * 24 * 60 * 60 * 1000;
    const common = {
      basisTimestamp,
      reviewDueAt: new Date(dueMillis).toISOString(),
      selectedPolicyId: policy.policyId,
      selectedPolicyVersion: policy.policyVersion,
      latestReviewId: latestReview?.reviewId,
    };
    if (nowMillis >= overdueMillis) {
      return assessment(record, {
        status: "OVERDUE", reasonCode: "REVIEW_OVERDUE_BY_POLICY",
        recommendedAction: "REVIEW_FOR_QUARANTINE", ...common,
      });
    }
    if (nowMillis >= dueMillis) {
      return assessment(record, {
        status: "REVIEW_DUE", reasonCode: "REVIEW_DUE_BY_POLICY", recommendedAction: "REVALIDATE", ...common,
      });
    }
    return assessment(record, {
      status: "CURRENT", reasonCode: "REVIEW_WINDOW_OPEN", recommendedAction: "NONE", ...common,
    });
  }
}
