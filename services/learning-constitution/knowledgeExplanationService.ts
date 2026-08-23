import type {
  KnowledgeAuditLedger,
  KnowledgeRetrievalRepository,
} from "../../types/learning-constitution/durableKnowledge";
import type { KnowledgeFreshnessEvaluator } from "../../types/learning-constitution/knowledgeFreshness";
import type {
  KnowledgeExplanationRequest,
  KnowledgeExplanationResult,
  KnowledgeExplanationService as KnowledgeExplanationServiceContract,
} from "../../types/learning-constitution/knowledgeExplanation";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";

export const KNOWLEDGE_EXPLANATION_SERVICE_ID = "phase-0-knowledge-explanation-service";

type Dependencies = Readonly<{
  repository: KnowledgeRetrievalRepository;
  auditLedger: KnowledgeAuditLedger;
  freshnessEvaluator?: KnowledgeFreshnessEvaluator;
}>;

const result = (values: Omit<KnowledgeExplanationResult, "persistenceEffect" | "authorityEffect" | "executionPermissionGranted">): KnowledgeExplanationResult => ({
  ...values, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

export class KnowledgeExplanationService implements KnowledgeExplanationServiceContract {
  constructor(private readonly dependencies: Dependencies) {}

  async explain(request: KnowledgeExplanationRequest): Promise<KnowledgeExplanationResult> {
    try {
      const record = await this.dependencies.repository.getById(request.knowledgeId);
      if (!record) return result({ status: "NOT_FOUND", reasonCode: "KNOWLEDGE_NOT_FOUND" });
      if (request.scope && evaluateScopeCompatibility(record.scope, request.scope).outcome !== "COMPATIBLE") {
        return result({ status: "OUT_OF_SCOPE", reasonCode: "KNOWLEDGE_OUT_OF_SCOPE" });
      }
      const [auditEvents, latestReview, supersession, exception, exceptionsToThisKnowledge] = await Promise.all([
        this.dependencies.auditLedger.findByKnowledgeId(record.knowledgeId),
        this.dependencies.repository.findLatestReviewByKnowledgeId(record.knowledgeId),
        this.dependencies.repository.findSupersessionByReplacementId(record.knowledgeId),
        this.dependencies.repository.findExceptionByKnowledgeId(record.knowledgeId),
        this.dependencies.repository.findExceptionsByBaseKnowledgeId(record.knowledgeId),
      ]);
      const orderedEvents = [...auditEvents].sort((left, right) =>
        left.occurredAt.localeCompare(right.occurredAt) || left.eventId.localeCompare(right.eventId));
      const hasAdmission = orderedEvents.some((event) => event.eventType === "KNOWLEDGE_ADMITTED");
      return result({
        status: hasAdmission ? "COMPLETE" : "INCOMPLETE_HISTORY",
        reasonCode: hasAdmission ? "KNOWLEDGE_HISTORY_EXPLAINED" : "ADMISSION_HISTORY_MISSING",
        trace: {
          knowledgeRecord: record,
          auditEvents: orderedEvents,
          latestReview,
          freshness: this.dependencies.freshnessEvaluator?.assess(record, latestReview),
          supersession,
          exception,
          exceptionsToThisKnowledge,
        },
      });
    } catch {
      return result({ status: "EXPLANATION_FAILED", reasonCode: "EXPLANATION_FAILED" });
    }
  }
}
