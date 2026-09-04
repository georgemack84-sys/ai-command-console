import type {
  OperationalPolicyEffectivenessAssessment,
  OperationalPolicyEffectivenessDependencies,
  OperationalPolicyEffectivenessRequest,
  OperationalPolicyEffectivenessService as OperationalPolicyEffectivenessServiceContract,
} from "../../types/learning-constitution/operationalPolicyMonitoring";

export const OPERATIONAL_POLICY_EFFECTIVENESS_SERVICE_ID = "phase-0-operational-policy-effectiveness-service";

const assessment = (
  values: Omit<OperationalPolicyEffectivenessAssessment, "persistenceEffect" | "authorityEffect" | "executionPermissionGranted">,
): OperationalPolicyEffectivenessAssessment => ({
  ...values, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});

export class OperationalPolicyEffectivenessService implements OperationalPolicyEffectivenessServiceContract {
  constructor(private readonly dependencies: OperationalPolicyEffectivenessDependencies) {}

  async assess(request: OperationalPolicyEffectivenessRequest): Promise<OperationalPolicyEffectivenessAssessment> {
    const active = await this.dependencies.policyRepository.getActive(request.policyId, request.scopeKey);
    const deltas = {
      overdueQueuedReviewWorkItems: request.currentReport.metrics.overdueQueuedReviewWorkItems - request.baselineReport.metrics.overdueQueuedReviewWorkItems,
      reviewFailedEvents: request.currentReport.metrics.reviewFailedEvents - request.baselineReport.metrics.reviewFailedEvents,
      quarantinedKnowledgeRecords: request.currentReport.metrics.quarantinedKnowledgeRecords - request.baselineReport.metrics.quarantinedKnowledgeRecords,
    };
    const common = { baselineReportId: request.baselineReport.reportId, currentReportId: request.currentReport.reportId, metricDeltas: deltas };
    if (!active || active.version !== request.policyVersion) {
      return assessment({ ...common, status: "POLICY_NOT_ACTIVE", reasonCode: "POLICY_VERSION_NOT_ACTIVE", recommendation: "NONE" });
    }
    if (request.baselineReport.status === "INSUFFICIENT_DATA" || request.currentReport.status === "INSUFFICIENT_DATA") {
      return assessment({ ...common, policyVersion: active, status: "INSUFFICIENT_DATA", reasonCode: "MONITORING_INSUFFICIENT_DATA", recommendation: "NONE" });
    }
    const regressions = Object.values(deltas).filter((delta) => delta > 0).length;
    if (regressions >= 2) {
      return assessment({ ...common, policyVersion: active, status: "REGRESSION_DETECTED", reasonCode: "POLICY_REGRESSION_DETECTED", recommendation: "CONSIDER_ROLLBACK" });
    }
    if (regressions === 1) {
      return assessment({ ...common, policyVersion: active, status: "INCONCLUSIVE", reasonCode: "POLICY_EFFECT_INCONCLUSIVE", recommendation: "OPEN_GOVERNANCE_REVIEW" });
    }
    return assessment({ ...common, policyVersion: active, status: "HEALTHY", reasonCode: "POLICY_EFFECT_HEALTHY", recommendation: "CONTINUE_OBSERVATION" });
  }
}
