import type { KnowledgeAuditEvent } from "../../types/learning-constitution/durableKnowledge";
import type {
  KnowledgeQualityMetricsDependencies,
  KnowledgeQualityMetricsReport,
  KnowledgeQualityMetricsRequest,
  KnowledgeQualityMetricsService as KnowledgeQualityMetricsServiceContract,
} from "../../types/learning-constitution/knowledgeQualityMetrics";
import type { KnowledgeScopeReference } from "../../types/learning-constitution/knowledgeScope";

export const KNOWLEDGE_QUALITY_METRICS_SERVICE_ID = "phase-0-knowledge-quality-metrics-service";

type MetricsDependencies = KnowledgeQualityMetricsDependencies & Readonly<{ now?: () => string }>;

const scopeIdentity = (scope: KnowledgeScopeReference): string =>
  "id" in scope ? `${scope.type}:${scope.id}` : scope.type;

const withinWindow = (timestamp: string, request: KnowledgeQualityMetricsRequest): boolean => {
  const value = Date.parse(timestamp);
  const from = request.from ? Date.parse(request.from) : undefined;
  const to = request.to ? Date.parse(request.to) : undefined;
  return Number.isFinite(value) &&
    (from === undefined || value >= from) &&
    (to === undefined || value <= to);
};

const countEvents = (events: readonly KnowledgeAuditEvent[], eventType: KnowledgeAuditEvent["eventType"]): number =>
  events.filter((event) => event.eventType === eventType).length;

export class KnowledgeQualityMetricsService implements KnowledgeQualityMetricsServiceContract {
  private readonly now: () => string;

  constructor(private readonly dependencies: MetricsDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  async report(request: KnowledgeQualityMetricsRequest): Promise<KnowledgeQualityMetricsReport> {
    const [allRecords, allEvents, allWorkItems] = await Promise.all([
      this.dependencies.knowledgeRepository.findAll(),
      this.dependencies.auditEvents(),
      this.dependencies.reviewWorkItems(),
    ]);
    const records = allRecords.filter((record) =>
      (!request.scope || scopeIdentity(record.scope) === scopeIdentity(request.scope)) &&
      withinWindow(record.createdAt, request));
    const recordIds = new Set(records.map((record) => record.knowledgeId));
    const events = allEvents.filter((event) => {
      const relatedKnowledgeId = event.eventType === "KNOWLEDGE_SUPERSEDED" ? event.priorKnowledgeId
        : event.eventType === "KNOWLEDGE_EXCEPTION_REGISTERED" ? event.baseKnowledgeId
          : event.eventType === "GOVERNANCE_REVIEW_PROPOSED" || event.eventType === "GOVERNANCE_REVIEW_DECIDED" || event.eventType === "OPERATIONAL_POLICY_ACTIVATED" || event.eventType === "OPERATIONAL_POLICY_ROLLED_BACK" ? undefined
            : "knowledgeId" in event ? event.knowledgeId : undefined;
      return relatedKnowledgeId !== undefined && recordIds.has(relatedKnowledgeId) && withinWindow(event.occurredAt, request);
    });
    const workItems = allWorkItems.filter((item) =>
      recordIds.has(item.knowledgeId) && withinWindow(item.createdAt, request));
    const overdueQueued = workItems.filter((item) =>
      item.state === "QUEUED" && item.freshness.status === "OVERDUE");
    const recordsMissingProvenance = records.filter((record) =>
      !record.provenance.observationId || !record.provenance.sourceId || !record.provenance.observedAt).length;
    const recordsMissingVersion = records.filter((record) =>
      !record.policyVersion || !record.constitutionVersion).length;
    const alerts = [] as KnowledgeQualityMetricsReport["alerts"][number][];
    if (records.length === 0 && events.length === 0 && workItems.length === 0) {
      alerts.push({
        code: "INSUFFICIENT_DATA",
        message: "No quality data matches the requested scope and time window.",
        recommendation: "Collect governed activity before interpreting quality trends.",
      });
    }
    if (request.maxOverdueWorkItems !== undefined && overdueQueued.length > request.maxOverdueWorkItems) {
      alerts.push({
        code: "OVERDUE_REVIEW_BACKLOG_EXCEEDED",
        message: `Overdue review backlog is ${overdueQueued.length}; threshold is ${request.maxOverdueWorkItems}.`,
        recommendation: "Prioritize explicit revalidation of overdue knowledge work items.",
      });
    }
    const scopeKey = request.scope ? scopeIdentity(request.scope) : "ALL";
    return {
      reportId: `quality:${scopeKey}:${request.from ?? "BEGINNING"}:${request.to ?? this.now()}`,
      generatedAt: this.now(),
      request,
      metrics: {
        totalKnowledgeRecords: records.length,
        activeKnowledgeRecords: records.filter((record) => record.lifecycleState === "ACTIVE").length,
        supersededKnowledgeRecords: records.filter((record) => record.lifecycleState === "SUPERSEDED").length,
        archivedKnowledgeRecords: records.filter((record) => record.lifecycleState === "ARCHIVED").length,
        quarantinedKnowledgeRecords: records.filter((record) => record.lifecycleState === "QUARANTINED").length,
        admittedEvents: countEvents(events, "KNOWLEDGE_ADMITTED"),
        supersessionEvents: countEvents(events, "KNOWLEDGE_SUPERSEDED"),
        exceptionEvents: countEvents(events, "KNOWLEDGE_EXCEPTION_REGISTERED"),
        archivedEvents: countEvents(events, "KNOWLEDGE_ARCHIVED"),
        quarantinedEvents: countEvents(events, "KNOWLEDGE_QUARANTINED"),
        revalidatedEvents: countEvents(events, "KNOWLEDGE_REVALIDATED"),
        reviewFailedEvents: countEvents(events, "KNOWLEDGE_REVIEW_FAILED"),
        queuedReviewWorkItems: workItems.filter((item) => item.state === "QUEUED").length,
        completedReviewWorkItems: workItems.filter((item) => item.state === "COMPLETED").length,
        overdueQueuedReviewWorkItems: overdueQueued.length,
        recordsMissingProvenance,
        recordsMissingVersion,
      },
      sourceCounts: { knowledgeRecords: records.length, auditEvents: events.length, reviewWorkItems: workItems.length },
      alerts,
      status: alerts.some((alert) => alert.code === "INSUFFICIENT_DATA") ? "INSUFFICIENT_DATA" : "COMPLETE",
      persistenceEffect: "NONE",
      authorityEffect: "UNCHANGED",
      executionPermissionGranted: false,
    };
  }
}
