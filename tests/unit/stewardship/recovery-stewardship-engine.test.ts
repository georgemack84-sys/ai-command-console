import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/stewardship/stewardshipAudit", () => ({
  appendStewardshipAuditEvent: vi.fn(),
}));

import { appendStewardshipAuditEvent } from "@/services/stewardship/stewardshipAudit";
import { evaluateRecoveryStewardship } from "@/services/stewardship/recoveryStewardshipEngine";

describe("evaluateRecoveryStewardship", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("consumes verified truth and stays read-derived by default", async () => {
    const tenantContext = {
      tenantId: "tenant_1",
      workspaceId: "workspace_1",
      source: "test" as const,
      isolationVersion: "3.6G" as const,
    };
    const result = await evaluateRecoveryStewardship({
      executionId: "execution_1",
      tenantContext,
      appendAudit: false,
      verification: {
        verificationId: "verification_1",
        executionId: "execution_1",
        status: "VERIFIED",
        reconciliationState: "RECONCILED",
        certificationDecision: "CERTIFIED",
        verified: true,
        disputed: false,
        divergenceDetected: false,
        requiresOperatorReview: false,
        evidence: ["audit_1"],
        errors: [],
        warnings: [],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      continuityState: {
        runtimeState: "HEALTHY",
        continuityConfidence: 0.94,
        recoveryEligible: true,
        recoveryReadiness: 0.91,
        degradedDependencies: [],
        activeExecutions: 0,
        staleLocks: 0,
        replayDivergenceDetected: false,
        dependencyStabilityScore: 0.92,
        workerAvailabilityScore: 0.9,
        survivabilityScore: 0.9,
        updatedAt: "2026-05-09T00:00:00.000Z",
        degradation: { status: "stable", evidence: [] },
      },
      simulationResult: {
        simulationId: "simulation_1",
        executionId: "execution_1",
        scenarioType: "CRASH_RECOVERY",
        state: "COMPLETED",
        outcome: "RECOVERY_VALID",
        dryRun: true,
        productionMutationAllowed: false,
        replayDeterministic: true,
        continuityValidated: true,
        governanceValidated: true,
        divergenceDetected: false,
        survivabilityScore: 0.88,
        confidence: 0.9,
        evidenceIds: ["evidence_1"],
        auditEventIds: ["audit_1"],
        warnings: [],
        disputes: [],
        errors: [],
        recommendedAction: "ALLOW_RECOVERY_PATTERN",
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      dashboard: {
        runtimeContinuityState: "HEALTHY",
        continuityConfidence: 0.94,
        operationalStability: "stable",
        degradedSystems: [],
        activeRecoveries: [],
        pendingApprovals: [],
        blockedRecoveries: [],
        quarantinedExecutions: [],
        replayVerificationState: "VERIFIED",
        replayDivergenceCount: 0,
        leaseConflicts: [],
        auditHistory: [],
        governanceDisputes: [],
        certificationState: "CERTIFIED",
        simulationOutcomes: [],
        continuityRiskScore: 4,
        stewardship: null,
        operationalStabilityAssessment: null,
        escalationCoordination: null,
        continuityConvergence: null,
        recoveryPrioritization: null,
        generatedAt: "2026-05-09T00:00:00.000Z",
      },
    });

    expect(result.state).toBe("VERIFIED");
    expect(result.auditAppended).toBe(false);
    expect(vi.mocked(appendStewardshipAuditEvent)).not.toHaveBeenCalled();
  });

  it("appends immutable audit events through the existing audit helper only", async () => {
    const tenantContext = {
      tenantId: "tenant_1",
      workspaceId: "workspace_1",
      source: "test" as const,
      isolationVersion: "3.6G" as const,
    };
    await evaluateRecoveryStewardship({
      executionId: "execution_2",
      tenantContext,
      verification: {
        verificationId: "verification_2",
        executionId: "execution_2",
        status: "DIVERGED",
        reconciliationState: "DIVERGED",
        certificationDecision: "QUARANTINED",
        verified: false,
        disputed: false,
        divergenceDetected: true,
        requiresOperatorReview: false,
        evidence: ["audit_2"],
        errors: [],
        warnings: [],
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      continuityState: {
        runtimeState: "QUARANTINED",
        continuityConfidence: 0.2,
        recoveryEligible: false,
        recoveryReadiness: 0.1,
        degradedDependencies: ["database"],
        activeExecutions: 1,
        staleLocks: 1,
        replayDivergenceDetected: true,
        dependencyStabilityScore: 0.3,
        workerAvailabilityScore: 0.3,
        survivabilityScore: 0.15,
        updatedAt: "2026-05-09T00:00:00.000Z",
        degradation: { status: "cascading", evidence: ["database"] },
      },
      simulationResult: {
        simulationId: "simulation_2",
        executionId: "execution_2",
        scenarioType: "REPLAY_RECOVERY",
        state: "DISPUTED",
        outcome: "REPLAY_DIVERGENCE_DETECTED",
        dryRun: true,
        productionMutationAllowed: false,
        replayDeterministic: false,
        continuityValidated: false,
        governanceValidated: true,
        divergenceDetected: true,
        survivabilityScore: 0.1,
        confidence: 0.2,
        evidenceIds: ["evidence_2"],
        auditEventIds: ["audit_2"],
        warnings: [],
        disputes: ["REPLAY_DIVERGENCE"],
        errors: [],
        recommendedAction: "ESCALATE_TO_GOVERNANCE",
        timestamp: "2026-05-09T00:00:00.000Z",
      },
      appendAudit: true,
    });

    expect(vi.mocked(appendStewardshipAuditEvent)).toHaveBeenCalled();
  });
});
