import { describe, expect, it } from "vitest";

import { buildConstitutionalResilienceEngine } from "@/services/resilience/constitutionalResilienceEngine";

const executiveModel = {
  governancePressure: {
    governanceIntegrity: 0.72,
    escalationPressure: 0.44,
    approvalBacklog: 0.2,
    containmentPressure: 0.8,
    survivabilityPressure: 0.66,
    autonomyPressure: 0.33,
    operationalRisk: 0.58,
    constitutionalStability: 0.64,
  },
  survivabilityCard: {
    survivabilityState: "DEGRADED",
    continuityConfidence: 0.61,
    collapseProbability: 0.42,
    stabilizationConfidence: 0.55,
    degradationVelocity: 0.63,
    strategicThreatLevel: 0.57,
    emergencyControlsActive: false,
  },
  strategicForecast: {
    forecastId: "forecast-1",
    survivabilityProjection: 0.59,
    degradationTrend: 0.62,
    collapseRisk: 0.43,
    stabilizationProbability: 0.54,
    projectedContainmentLoad: 0.74,
    governanceStressProjection: 0.41,
    uncertaintyLevel: 0.22,
    generatedAt: 100,
  },
  escalation: {
    escalationTimeline: ["escalation:1"],
    escalationRequired: true,
    escalationSaturation: 0.52,
    emergencyAutonomyFreeze: false,
    constitutionalFreezeVisible: false,
  },
  constraints: {
    governanceSafe: true,
    blockedReasons: [],
  },
  controlPlane: {
    governance: { constitutionalState: "RESTRICTED", governanceConfidence: 0.71, violations: [] },
    continuity: { survivabilityScore: 0.63, collapseRisk: 0.4, survivable: true },
    sovereignty: { governanceIntegrity: 0.72, survivabilityConfidence: 0.64, containmentEffectiveness: 0.71, systemicRisk: 0.38, escalationPressure: 0.44 },
    survivability: {
      assessment: {
        survivabilityState: "DEGRADED",
        constitutionalIntegrity: 0.73,
        governanceContinuity: 0.68,
        operationalViability: 0.61,
        containmentEffectiveness: 0.71,
        auditPreservationConfidence: 0.84,
        escalationPressure: 0.44,
        systemicInstability: 0.58,
        recoverabilityConfidence: 0.57,
        isolatedDomains: ["replay"],
        failingDomains: ["coordination"],
        survivableDomains: ["governance"],
        emergencyControlsRequired: false,
        operatorInterventionRequired: true,
        constitutionalRiskDetected: false,
        createdAt: 100,
      },
      containment: {
        containmentState: "CONTAINED",
        recommendedAction: "CONTAIN",
        systemicInstability: 0.58,
        governanceCollapseRisk: 0.3,
        survivabilityConfidence: 0.57,
        containmentEffectiveness: 0.71,
        escalationPressure: 0.44,
        operationalDivergenceRisk: 0.4,
        dependencyCollapseRisk: 0.47,
        constitutionalConflictSpreadRisk: 0.3,
        tenantSurvivabilityRisk: 0.41,
        isolatedDomains: ["replay"],
        quarantinedDomains: [],
        degradedDomains: ["coordination"],
        containmentRequired: true,
        operatorInterventionRequired: true,
        emergencyStabilizationRequired: false,
        createdAt: 100,
      },
      degradation: {
        degradationMode: "SURVIVABILITY_MODE",
        autonomyLevel: "ADVISORY_ONLY",
      },
      blockedReasons: [],
      protocols: { protocols: ["preserve_audit_lineage"] },
      emergencyStabilization: { required: false, blockedReasons: [], bypassAllowed: false, stabilizationState: "STABLE" },
    },
    supervision: {
      supervisionState: "FROZEN",
      supervisedExecutionAllowed: false,
      stabilizationRecommended: true,
      escalationRequired: true,
      containmentRequired: true,
      operationalRisk: 0.58,
      supervisionConfidence: 0.61,
    },
    enforcement: {
      executable: false,
      enforcementState: "EXECUTION_SUPPRESSED",
      blockedReasons: ["approval_required"],
      containmentApplied: true,
      escalationTriggered: true,
      emergencyLockActive: false,
      enforcementConfidence: 0.73,
    },
    replayReview: { reviewState: "VERIFIED", divergenceCount: 0, blockedReasons: [] },
    disputeReview: { unresolvedDisputes: [] },
    reviewEscalation: { escalationChain: ["escalation:1"], escalationRequired: true },
    dashboard: { auditHistory: [{ id: "audit-1" }], degradedSystems: ["coordination"], pendingApprovals: [{ id: "approval-1" }] },
  },
  audit: { auditId: "executive-audit-1" },
} as const;

describe("buildConstitutionalResilienceEngine", () => {
  it("derives deterministic resilience and containment outputs", () => {
    const first = buildConstitutionalResilienceEngine({ executiveModel, nowMs: 100 });
    const second = buildConstitutionalResilienceEngine({ executiveModel, nowMs: 100 });

    expect(first).toEqual(second);
    expect(first.assessment.readinessCompatible).toBe(true);
    expect(first.audit.advisoryOnly).toBe(true);
  });

  it("fails closed when executive governance is blocked", () => {
    const result = buildConstitutionalResilienceEngine({
      executiveModel: {
        ...executiveModel,
        constraints: {
          governanceSafe: false,
          blockedReasons: ["executive_disputed_truth_present"],
        },
      },
      nowMs: 100,
    });

    expect(result.assessment.resilienceState).toBe("FROZEN");
    expect(result.continuity.mode).toBe("GOVERNANCE_PROTECTED");
    expect(result.blockedReasons).toContain("executive_disputed_truth_present");
  });
});
