import { describe, expect, it } from "vitest";

import { orchestrateRecoveryVerification } from "../../../../services/recovery/verification/recoveryVerificationOrchestrator";
import { createTenantContext } from "../../../../services/tenancy/tenantContext";
import { createSecurityContext } from "../../../../services/security/securityContext";

describe("recovery verification orchestrator", () => {
  it("consumes simulation evidence and certifies aligned recovery truth", async () => {
    const result = await orchestrateRecoveryVerification({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      securityContext: createSecurityContext({
        actorId: "admin-1",
        actorRole: "admin",
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        permissions: ["recovery:verify", "recovery:read"],
        source: "test",
      }),
      evidence: {
        replayVerification: {
          verificationId: "verification-1",
          executionId: "exec-1",
          verified: true,
          verificationState: "VERIFIED",
          confidenceScore: 0.94,
          runtimeIntegrity: true,
          replayIntegrity: true,
          governanceIntegrity: true,
          continuityIntegrity: true,
          disputes: [],
          evidence: ["ledger:present"],
          verifiedAt: "2026-05-08T12:00:00.000Z",
        },
        simulationResult: {
          simulationId: "sim-1",
          executionId: "exec-1",
          scenarioType: "CRASH_RECOVERY",
          state: "COMPLETED",
          outcome: "RECOVERY_VALID",
          dryRun: true,
          productionMutationAllowed: false,
          replayDeterministic: true,
          continuityValidated: true,
          governanceValidated: true,
          divergenceDetected: false,
          survivabilityScore: 88,
          confidence: 0.91,
          evidenceIds: ["simulation_evidence_1"],
          auditEventIds: ["audit_1"],
          warnings: [],
          disputes: [],
          errors: [],
          recommendedAction: "ALLOW_RECOVERY_PATTERN",
          timestamp: "2026-05-08T12:00:00.000Z",
        },
        continuityState: {
          runtimeState: "HEALTHY",
          continuityConfidence: 0.93,
          recoveryEligible: true,
          recoveryReadiness: 0.9,
          degradedDependencies: [],
          activeExecutions: 1,
          staleLocks: 0,
          replayDivergenceDetected: false,
          dependencyStabilityScore: 0.95,
          workerAvailabilityScore: 0.97,
          survivabilityScore: 92,
          updatedAt: "2026-05-08T12:00:00.000Z",
          degradation: {
            status: "stable",
            degraded: false,
            cascadingFailures: false,
            chronicRuntimeDecay: false,
            recoveryLoopDetected: false,
            evidence: [],
          },
        },
        immutableEvidenceValid: true,
      },
      appendAudit: false,
    });

    expect(result.status).toBe("VERIFIED");
    expect(result.certificationDecision).toBe("CERTIFIED");
  });

  it("fails closed when evidence is missing", async () => {
    const result = await orchestrateRecoveryVerification({
      executionId: "exec-1",
      tenantContext: createTenantContext({
        tenantId: "tenant-1",
        workspaceId: "workspace-1",
        source: "test",
      }),
      evidence: {
        replayVerification: null,
        simulationResult: null,
        continuityState: null,
        immutableEvidenceValid: false,
      },
      appendAudit: false,
    });

    expect(result.status).toBe("UNVERIFIABLE");
    expect(result.errors).toContain("RECOVERY_VERIFICATION_EVIDENCE_MISSING");
  });
});
