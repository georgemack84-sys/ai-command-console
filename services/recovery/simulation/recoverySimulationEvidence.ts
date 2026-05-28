import { hashPayloadDeterministically } from "../../contracts/payloadHasher";
import type { RecoverySimulationOutcome, RecoverySimulationRequest, RecoverySimulationScenario } from "./recoverySimulationTypes";

export function buildRecoverySimulationEvidence({
  request,
  scenario,
  replay,
  continuity,
  governance,
  outcome,
  timestamp,
}: {
  request: Pick<RecoverySimulationRequest, "simulationId" | "executionId" | "scenarioType" | "dryRun" | "createdAt">;
  scenario: Pick<RecoverySimulationScenario, "type" | "recoveryAction" | "expectedWarnings" | "expectedDisputes">;
  replay: {
    replayDeterministic: boolean;
    divergenceDetected: boolean;
    confidence: number;
    evidenceIds: string[];
    warnings: string[];
    disputes: string[];
  };
  continuity: {
    validated: boolean;
    survivabilityScore: number;
    warnings: string[];
    disputes: string[];
  };
  governance: {
    ok: boolean;
    warnings: string[];
    disputes: string[];
  };
  outcome: RecoverySimulationOutcome;
  timestamp: string;
}) {
  const bundle = {
    request,
    scenario,
    replay,
    continuity,
    governance,
    finalOutcome: outcome,
    timestamp,
  };
  const evidenceId = `simulation_evidence_${hashPayloadDeterministically(bundle)}`;
  return {
    evidenceIds: [evidenceId],
    bundle,
  };
}
