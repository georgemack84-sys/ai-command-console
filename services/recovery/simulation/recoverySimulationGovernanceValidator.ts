import { evaluateReplayGovernance } from "../../replay/replayGovernance";
import { evaluateRecoveryGovernance } from "../governance/recoveryGovernance";
import { getRecoverySimulationScenario } from "./recoveryScenarioLibrary";
import type { SecurityContext } from "../../security/securityTypes";
import type { TenantContext } from "../../tenancy/tenantTypes";
import type { RecoverySimulationScenarioType } from "./recoverySimulationTypes";

export async function validateRecoverySimulationGovernance({
  executionId,
  scenarioType,
  tenantContext,
  securityContext,
  replayValidation,
  approvalState,
}: {
  executionId: string;
  scenarioType: RecoverySimulationScenarioType;
  tenantContext: TenantContext;
  securityContext?: SecurityContext;
  replayValidation:
    | { ok: true; data: { verified: boolean; deterministic: boolean; divergences: Array<{ category: string; severity: string; requiresEscalation: boolean }>; confidence: { score: number; deterministic: boolean; confidenceLevel: string; riskFactors: string[]; verifiedEvidence: string[]; warnings: string[] } } }
    | { ok: false; error: { code: string; message: string; details?: Record<string, unknown> } };
  approvalState: "approved" | "missing" | "expired";
}) {
  if (!securityContext) {
    return {
      ok: false as const,
      error: {
        code: "SIMULATION_SECURITY_CONTEXT_REQUIRED",
        message: "Recovery simulation governance requires a security context.",
      },
      warnings: [] as string[],
      disputes: ["SECURITY_CONTEXT_MISSING"],
    };
  }

  const scenario = getRecoverySimulationScenario(scenarioType);
  const replayGovernance = await evaluateReplayGovernance({
    executionId,
    tenantContext,
    securityContext,
    action: scenario.recoveryAction,
    replayVerification: replayValidation,
    activeRecoveryActions: [],
  });
  if (!replayGovernance.ok) {
    return {
      ok: false as const,
      error: replayGovernance.error,
      warnings: [] as string[],
      disputes: ["REPLAY_GOVERNANCE_BLOCKED"],
    };
  }

  const recoveryGovernance = evaluateRecoveryGovernance({
    action: scenario.recoveryAction,
    replayVerified: replayValidation.ok ? replayValidation.data.verified : false,
    verificationDisputed: replayValidation.ok ? replayValidation.data.divergences.length > 0 : true,
    approvalState,
    conflictingActions: [],
  });
  if (!recoveryGovernance.ok) {
    return {
      ok: false as const,
      error: recoveryGovernance.error,
      warnings: scenario.expectedWarnings,
      disputes: [...scenario.expectedDisputes, recoveryGovernance.error.code],
    };
  }

  return {
    ok: true as const,
    warnings: scenario.expectedWarnings,
    disputes: scenario.expectedDisputes,
    data: {
      replayGovernance: replayGovernance.data,
      recoveryGovernance: recoveryGovernance.data,
    },
  };
}
