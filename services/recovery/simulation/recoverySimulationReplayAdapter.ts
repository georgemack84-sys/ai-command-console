import { collectReplayEvidence } from "../../replay/replayEvidenceCollector";
import { validateRecoveryReplay } from "../recoveryReplayValidation";
import type { TenantContext } from "../../tenancy/tenantTypes";
import type { RecoverySimulationScenarioType } from "./recoverySimulationTypes";

export async function runRecoverySimulationReplayAdapter({
  executionId,
  scenarioType,
  tenantContext,
  replayInputs = {},
}: {
  executionId: string;
  scenarioType: RecoverySimulationScenarioType;
  tenantContext: TenantContext;
  replayInputs?: Record<string, unknown>;
}) {
  const evidence = collectReplayEvidence({
    executionId,
    tenantContext,
    overrides: replayInputs,
  });
  const verification = validateRecoveryReplay({
    executionId,
    tenantContext,
    ledgerEvents: (replayInputs.ledgerEvents as Record<string, unknown>[] | undefined) || evidence.ledgerEvents,
    historicalState: (replayInputs.historicalState as Record<string, unknown> | null | undefined) || evidence.historicalState,
    continuitySnapshots: (replayInputs.continuitySnapshots as Record<string, unknown>[] | undefined) || evidence.continuitySnapshots,
    auditEvents: (replayInputs.auditEvents as Record<string, unknown>[] | undefined) || evidence.auditEvents,
  });

  if (!verification.ok) {
    return {
      replayDeterministic: false,
      divergenceDetected: true,
      confidence: 0,
      evidenceIds: ["replay:evidence_incomplete"],
      warnings: [scenarioType === "DEGRADED_INFRASTRUCTURE_RECOVERY" ? "infrastructure:degraded" : "replay:verification_failed"],
      disputes: [verification.error.code],
      replayVerification: verification,
      evidence,
    };
  }

  return {
    replayDeterministic: verification.data.deterministic,
    divergenceDetected: verification.data.divergences.length > 0,
    confidence: verification.data.confidence.score / 100,
    evidenceIds: verification.data.confidence.verifiedEvidence.length > 0
      ? verification.data.confidence.verifiedEvidence
      : ["replay:verified"],
    warnings: [
      ...verification.data.confidence.warnings,
      ...(scenarioType === "DEGRADED_INFRASTRUCTURE_RECOVERY" ? ["infrastructure:degraded"] : []),
      ...(scenarioType === "DEPENDENCY_FAILURE_RECOVERY" ? ["dependency:failed"] : []),
    ],
    disputes: verification.data.divergences.map((divergence) => divergence.category),
    replayVerification: verification,
    evidence,
  };
}
