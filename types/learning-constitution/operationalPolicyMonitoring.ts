import type { OperationalPolicyRepository, OperationalPolicyVersion } from "./operationalPolicy";
import type { KnowledgeQualityMetricsReport } from "./knowledgeQualityMetrics";

export type OperationalPolicyEffectivenessRequest = Readonly<{
  policyId: string;
  scopeKey: string;
  policyVersion: string;
  baselineReport: KnowledgeQualityMetricsReport;
  currentReport: KnowledgeQualityMetricsReport;
}>;

export const OPERATIONAL_POLICY_EFFECTIVENESS_STATUSES = [
  "HEALTHY",
  "INCONCLUSIVE",
  "REGRESSION_DETECTED",
  "INSUFFICIENT_DATA",
  "POLICY_NOT_ACTIVE",
] as const;
export type OperationalPolicyEffectivenessStatus = (typeof OPERATIONAL_POLICY_EFFECTIVENESS_STATUSES)[number];

export type OperationalPolicyEffectivenessAssessment = Readonly<{
  policyVersion?: OperationalPolicyVersion;
  status: OperationalPolicyEffectivenessStatus;
  baselineReportId: string;
  currentReportId: string;
  metricDeltas: Readonly<{
    overdueQueuedReviewWorkItems: number;
    reviewFailedEvents: number;
    quarantinedKnowledgeRecords: number;
  }>;
  recommendation: "CONTINUE_OBSERVATION" | "OPEN_GOVERNANCE_REVIEW" | "CONSIDER_ROLLBACK" | "NONE";
  reasonCode: "POLICY_EFFECT_HEALTHY" | "POLICY_EFFECT_INCONCLUSIVE" | "POLICY_REGRESSION_DETECTED" | "MONITORING_INSUFFICIENT_DATA" | "POLICY_VERSION_NOT_ACTIVE";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type OperationalPolicyEffectivenessDependencies = Readonly<{ policyRepository: OperationalPolicyRepository }>;

export interface OperationalPolicyEffectivenessService {
  assess(request: OperationalPolicyEffectivenessRequest): Promise<OperationalPolicyEffectivenessAssessment>;
}
