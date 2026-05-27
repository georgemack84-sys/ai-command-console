import { describe, expect, it } from "vitest";

import { buildPrioritizationAuditRecords } from "@/services/prioritization/prioritizationAudit";

describe("buildPrioritizationAuditRecords", () => {
  it("preserves decision lineage in audit-ready objects", () => {
    const records = buildPrioritizationAuditRecords([{
      executionId: "exec_1",
      prioritizationScore: 0.91,
      category: "SURVIVABILITY_CRITICAL",
      state: "RANKED",
      operationalCriticality: 0.8,
      survivabilityImpact: 0.9,
      governanceRisk: 0.3,
      replayConfidence: 0.8,
      escalationSeverity: 0.5,
      dependencyImportance: 0.4,
      continuityStability: 0.6,
      tenantImpact: 0.4,
      convergenceConfidence: 0.7,
      divergenceScore: 0.5,
      runtimeDriftSeverity: 0.4,
      staleOwnershipRisk: 0.3,
      orphanedOperationRisk: 0.1,
      replayDivergenceRisk: 0.2,
      constitutionalRisk: 0.4,
      containmentPressure: 0.3,
      recoveryComplexity: 0.4,
      recoveryUrgency: 0.7,
      deterministicRank: 1,
      governanceReviewRequired: false,
      prioritizationReasons: ["survivability_impact_elevated"],
      prioritizationWarnings: [],
      timestamp: "2026-05-09T00:00:00.000Z",
    }]);

    expect(records[0].eventType).toBe("SURVIVABILITY_PRIORITY_ESCALATED");
    expect(records[0].executionId).toBe("exec_1");
  });
});
