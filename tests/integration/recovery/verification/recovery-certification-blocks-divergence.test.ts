import { describe, expect, it } from "vitest";

import { orchestrateRecoveryVerification } from "../../../../services/recovery/verification/recoveryVerificationOrchestrator";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";

describe("recovery certification blocks divergence", () => {
  it("rejects divergent replay truth", async () => {
    const result = await orchestrateRecoveryVerification({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      evidence: {
        replayVerification: {
          verificationId: "verification-1",
          executionId: "exec-1",
          verified: false,
          verificationState: "FAILED",
          confidenceScore: 0.21,
          runtimeIntegrity: false,
          replayIntegrity: false,
          governanceIntegrity: true,
          continuityIntegrity: false,
          disputes: ["STATE_DIVERGENCE"],
          evidence: ["replay:divergent"],
          verifiedAt: "2026-05-08T12:00:00.000Z",
        },
        simulationResult: {
          simulationId: "sim-1",
          executionId: "exec-1",
          scenarioType: "REPLAY_RECOVERY",
          state: "DISPUTED",
          outcome: "REPLAY_DIVERGENCE_DETECTED",
          dryRun: true,
          productionMutationAllowed: false,
          replayDeterministic: false,
          continuityValidated: false,
          governanceValidated: true,
          divergenceDetected: true,
          survivabilityScore: 15,
          confidence: 0.2,
          evidenceIds: ["evidence-1"],
          auditEventIds: ["audit-1"],
          warnings: [],
          disputes: ["STATE_DIVERGENCE"],
          errors: [],
          recommendedAction: "ESCALATE_TO_GOVERNANCE",
          timestamp: "2026-05-08T12:00:00.000Z",
        },
        continuityState: {
          runtimeState: "CONTINUITY_RISK",
          continuityConfidence: 0.2,
          recoveryEligible: false,
          recoveryReadiness: 0.1,
          degradedDependencies: ["database"],
          activeExecutions: 1,
          staleLocks: 1,
          replayDivergenceDetected: true,
          dependencyStabilityScore: 0.3,
          workerAvailabilityScore: 0.4,
          survivabilityScore: 20,
          updatedAt: "2026-05-08T12:00:00.000Z",
          degradation: {
            status: "cascading",
            degraded: true,
            cascadingFailures: true,
            chronicRuntimeDecay: false,
            recoveryLoopDetected: false,
            evidence: ["replay divergence"],
          },
        },
        immutableEvidenceValid: true,
      },
      appendAudit: false,
    });

    expect(["QUARANTINED", "REJECTED"]).toContain(result.certificationDecision);
  });
});
