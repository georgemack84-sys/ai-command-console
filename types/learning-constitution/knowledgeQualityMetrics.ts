import type { KnowledgeAuditEvent, KnowledgeMetricsRepository } from "./durableKnowledge";
import type { KnowledgeScopeReference } from "./knowledgeScope";
import type { KnowledgeReviewWorkItem } from "./knowledgeReviewQueue";

export type KnowledgeQualityMetricsRequest = Readonly<{
  scope?: KnowledgeScopeReference;
  from?: string;
  to?: string;
  maxOverdueWorkItems?: number;
}>;

export type KnowledgeQualityMetrics = Readonly<{
  totalKnowledgeRecords: number;
  activeKnowledgeRecords: number;
  supersededKnowledgeRecords: number;
  archivedKnowledgeRecords: number;
  quarantinedKnowledgeRecords: number;
  admittedEvents: number;
  supersessionEvents: number;
  exceptionEvents: number;
  archivedEvents: number;
  quarantinedEvents: number;
  revalidatedEvents: number;
  reviewFailedEvents: number;
  queuedReviewWorkItems: number;
  completedReviewWorkItems: number;
  overdueQueuedReviewWorkItems: number;
  recordsMissingProvenance: number;
  recordsMissingVersion: number;
}>;

export type KnowledgeQualityAlert = Readonly<{
  code: "OVERDUE_REVIEW_BACKLOG_EXCEEDED" | "INSUFFICIENT_DATA";
  message: string;
  recommendation: string;
}>;

export type KnowledgeQualityMetricsReport = Readonly<{
  reportId: string;
  generatedAt: string;
  request: KnowledgeQualityMetricsRequest;
  metrics: KnowledgeQualityMetrics;
  sourceCounts: Readonly<{ knowledgeRecords: number; auditEvents: number; reviewWorkItems: number }>;
  alerts: readonly KnowledgeQualityAlert[];
  status: "COMPLETE" | "INSUFFICIENT_DATA";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type KnowledgeQualityMetricsDependencies = Readonly<{
  knowledgeRepository: KnowledgeMetricsRepository;
  auditEvents: () => Promise<readonly KnowledgeAuditEvent[]>;
  reviewWorkItems: () => Promise<readonly KnowledgeReviewWorkItem[]>;
}>;

export interface KnowledgeQualityMetricsService {
  report(request: KnowledgeQualityMetricsRequest): Promise<KnowledgeQualityMetricsReport>;
}
