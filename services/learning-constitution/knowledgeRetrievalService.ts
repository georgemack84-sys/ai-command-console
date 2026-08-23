import type {
  DurableKnowledgeRecord,
  KnowledgeException,
  KnowledgeRetrievalReasonCode,
  KnowledgeRetrievalRepository,
  KnowledgeRetrievalRequest,
  KnowledgeRetrievalResult,
  KnowledgeRetrievalService as KnowledgeRetrievalServiceContract,
} from "../../types/learning-constitution/durableKnowledge";
import { evaluateScopeCompatibility } from "./conservativeKnowledgeScopeResolver";
import type { KnowledgeFreshnessEvaluator } from "../../types/learning-constitution/knowledgeFreshness";

export const KNOWLEDGE_RETRIEVAL_SERVICE_ID = "phase-0-knowledge-retrieval-service";

type RetrievalDependencies = Readonly<{
  repository: KnowledgeRetrievalRepository;
  freshnessEvaluator?: KnowledgeFreshnessEvaluator;
}>;

const result = (
  status: KnowledgeRetrievalResult["status"],
  reasonCode: KnowledgeRetrievalReasonCode,
  values: Pick<KnowledgeRetrievalResult, "applicableKnowledge" | "baseKnowledge" | "appliedException" | "candidateKnowledge" | "evaluatedExceptionIds" | "review" | "freshness">,
): KnowledgeRetrievalResult => ({
  status,
  reasonCode,
  ...values,
  persistenceEffect: "NONE",
  authorityEffect: "UNCHANGED",
  executionPermissionGranted: false,
});

const normalize = (value: string): string => value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const matchesQuery = (record: DurableKnowledgeRecord, contentQuery?: string): boolean =>
  !contentQuery || normalize(record.content).includes(normalize(contentQuery));

export class KnowledgeRetrievalService implements KnowledgeRetrievalServiceContract {
  constructor(private readonly dependencies: RetrievalDependencies) {}

  async retrieve(request: KnowledgeRetrievalRequest): Promise<KnowledgeRetrievalResult> {
    try {
      const candidates = await this.findCandidates(request);
      if (candidates.status) return candidates.status;
      if (candidates.records.length === 0) {
        return result("NOT_FOUND", "NO_ACTIVE_KNOWLEDGE_MATCH", {
          candidateKnowledge: [],
          evaluatedExceptionIds: [],
        });
      }
      if (candidates.records.length > 1) {
        return result("AMBIGUOUS", "QUERY_AMBIGUOUS", {
          candidateKnowledge: candidates.records,
          evaluatedExceptionIds: [],
        });
      }
      return this.resolveApplicability(candidates.records[0], request, candidates.records);
    } catch {
      return result("RETRIEVAL_FAILED", "RETRIEVAL_FAILED", {
        candidateKnowledge: [],
        evaluatedExceptionIds: [],
      });
    }
  }

  private async findCandidates(request: KnowledgeRetrievalRequest): Promise<Readonly<{
    records: readonly DurableKnowledgeRecord[];
    status?: KnowledgeRetrievalResult;
  }>> {
    if (!request.knowledgeId) {
      const records = await this.dependencies.repository.findActiveByScope(request.scope);
      return { records: records.filter((record) => matchesQuery(record, request.contentQuery)) };
    }

    const record = await this.dependencies.repository.getById(request.knowledgeId);
    if (!record) return { records: [] };
    if (record.lifecycleState !== "ACTIVE") {
      return { records: [], status: result("NOT_FOUND", "KNOWLEDGE_NOT_ACTIVE", {
        candidateKnowledge: [], evaluatedExceptionIds: [],
      }) };
    }
    if (evaluateScopeCompatibility(record.scope, request.scope).outcome !== "COMPATIBLE") {
      return { records: [], status: result("OUT_OF_SCOPE", "KNOWLEDGE_OUT_OF_SCOPE", {
        candidateKnowledge: [], evaluatedExceptionIds: [],
      }) };
    }
    return { records: matchesQuery(record, request.contentQuery) ? [record] : [] };
  }

  private async resolveApplicability(
    base: DurableKnowledgeRecord,
    request: KnowledgeRetrievalRequest,
    candidates: readonly DurableKnowledgeRecord[],
  ): Promise<KnowledgeRetrievalResult> {
    const review = await this.dependencies.repository.findLatestReviewByKnowledgeId(base.knowledgeId);
    const freshness = this.dependencies.freshnessEvaluator?.assess(base, review);
    const relationships = await this.dependencies.repository.findExceptionsByBaseKnowledgeId(base.knowledgeId);
    const activeExceptions = await this.activeExceptions(relationships);
    if (activeExceptions.length === 0) {
      return result("APPLICABLE", "ACTIVE_KNOWLEDGE_APPLIES", {
        applicableKnowledge: base,
        baseKnowledge: base,
        candidateKnowledge: candidates,
        evaluatedExceptionIds: [],
        review,
        freshness,
      });
    }
    const evaluatedExceptionIds = activeExceptions.map(({ relationship }) => relationship.exceptionId);
    if (!request.contextFacts) {
      return result("INSUFFICIENT_CONTEXT", "EXCEPTION_CONTEXT_REQUIRED", {
        baseKnowledge: base,
        candidateKnowledge: candidates,
        evaluatedExceptionIds,
        review,
        freshness,
      });
    }
    const facts = new Set(request.contextFacts.map(normalize));
    const applicable = activeExceptions.filter(({ relationship }) =>
      facts.has(normalize(relationship.applicabilityCondition)));
    if (applicable.length === 0) {
      return result("APPLICABLE", "ACTIVE_KNOWLEDGE_APPLIES", {
        applicableKnowledge: base,
        baseKnowledge: base,
        candidateKnowledge: candidates,
        evaluatedExceptionIds,
        review,
        freshness,
      });
    }
    if (applicable.length > 1) {
      return result("AMBIGUOUS", "QUERY_AMBIGUOUS", {
        baseKnowledge: base,
        candidateKnowledge: candidates,
        evaluatedExceptionIds,
        review,
        freshness,
      });
    }
    return result("APPLICABLE", "ACTIVE_EXCEPTION_APPLIES", {
      applicableKnowledge: applicable[0].record,
      baseKnowledge: base,
      appliedException: applicable[0].relationship,
      candidateKnowledge: candidates,
      evaluatedExceptionIds,
      review,
      freshness,
    });
  }

  private async activeExceptions(
    relationships: readonly KnowledgeException[],
  ): Promise<readonly Readonly<{ relationship: KnowledgeException; record: DurableKnowledgeRecord }>[]> {
    const records = await Promise.all(relationships.map(async (relationship) => ({
      relationship,
      record: await this.dependencies.repository.getById(relationship.exceptionKnowledgeId),
    })));
    return records.filter((item): item is Readonly<{ relationship: KnowledgeException; record: DurableKnowledgeRecord }> =>
      item.record?.lifecycleState === "ACTIVE",
    );
  }
}
