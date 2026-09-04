import { describe, expect, it } from "vitest";

import {
  InMemoryOperationalPolicyRepository,
  OperationalPolicyEffectivenessService,
} from "@/services/learning-constitution";
import type { KnowledgeQualityMetricsReport, OperationalPolicyVersion } from "@/types/learning-constitution";

const provenance = {
  observationId: "observation-001", sourceId: "governance", sourceType: "SYSTEM_CONFIGURATION" as const,
  originatingActorId: "governor-001", observedAt: "2026-09-01T00:00:00.000Z",
};
const report = (id: string, metrics: Partial<KnowledgeQualityMetricsReport["metrics"]> = {}, status: KnowledgeQualityMetricsReport["status"] = "COMPLETE"): KnowledgeQualityMetricsReport => ({
  reportId: id, generatedAt: "2026-09-01T00:00:00.000Z", request: { scope: { type: "PROJECT", id: "project-alpha" } },
  metrics: {
    totalKnowledgeRecords: 1, activeKnowledgeRecords: 1, supersededKnowledgeRecords: 0, archivedKnowledgeRecords: 0, quarantinedKnowledgeRecords: 0,
    admittedEvents: 0, supersessionEvents: 0, exceptionEvents: 0, archivedEvents: 0, quarantinedEvents: 0, revalidatedEvents: 0, reviewFailedEvents: 0,
    queuedReviewWorkItems: 0, completedReviewWorkItems: 0, overdueQueuedReviewWorkItems: 0, recordsMissingProvenance: 0, recordsMissingVersion: 0, ...metrics,
  }, sourceCounts: { knowledgeRecords: 1, auditEvents: 0, reviewWorkItems: 0 }, alerts: [], status,
  persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
});
const policy: OperationalPolicyVersion = {
  policyId: "review-interval-policy", version: "2.0.0", scopeKey: "PROJECT:project-alpha", contentHash: "sha256:abc",
  impactAnalysis: "impact", migrationPlan: "migration", rollbackPlan: "rollback", effectiveAt: "2026-09-01T00:00:00.000Z", activatedAt: "2026-09-01T00:00:00.000Z",
  activatedBy: "activator", proposalId: "proposal", constitutionVersion: "1.0.0", provenance,
};

describe("operational policy effectiveness", () => {
  it("compares active policy metrics and remains read-only", async () => {
    const repository = new InMemoryOperationalPolicyRepository();
    await repository.activate(policy);
    const service = new OperationalPolicyEffectivenessService({ policyRepository: repository });
    const healthy = await service.assess({ policyId: policy.policyId, scopeKey: policy.scopeKey, policyVersion: policy.version, baselineReport: report("baseline"), currentReport: report("current") });
    const regression = await service.assess({
      policyId: policy.policyId, scopeKey: policy.scopeKey, policyVersion: policy.version, baselineReport: report("baseline"),
      currentReport: report("current", { overdueQueuedReviewWorkItems: 2, reviewFailedEvents: 1 }),
    });
    expect(healthy).toMatchObject({ status: "HEALTHY", recommendation: "CONTINUE_OBSERVATION", persistenceEffect: "NONE", authorityEffect: "UNCHANGED" });
    expect(regression).toMatchObject({ status: "REGRESSION_DETECTED", recommendation: "CONSIDER_ROLLBACK" });
    expect(await repository.getActive(policy.policyId, policy.scopeKey)).toMatchObject({ version: "2.0.0" });
  });

  it("fails closed for inactive policy versions and insufficient data", async () => {
    const repository = new InMemoryOperationalPolicyRepository();
    await repository.activate(policy);
    const service = new OperationalPolicyEffectivenessService({ policyRepository: repository });
    const inactive = await service.assess({ policyId: policy.policyId, scopeKey: policy.scopeKey, policyVersion: "1.0.0", baselineReport: report("base"), currentReport: report("current") });
    const insufficient = await service.assess({ policyId: policy.policyId, scopeKey: policy.scopeKey, policyVersion: policy.version, baselineReport: report("base", {}, "INSUFFICIENT_DATA"), currentReport: report("current") });
    expect(inactive).toMatchObject({ status: "POLICY_NOT_ACTIVE", recommendation: "NONE" });
    expect(insufficient).toMatchObject({ status: "INSUFFICIENT_DATA", recommendation: "NONE" });
  });
});
