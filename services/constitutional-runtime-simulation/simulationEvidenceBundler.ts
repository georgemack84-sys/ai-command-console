import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationEvidence,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function bundleSimulationEvidence(input: {
  simulationInput: ConstitutionalRuntimeSimulationInput;
  reasons: readonly string[];
}): SimulationEvidence {
  const replay = input.simulationInput.constitutionalReplayResult;
  const telemetry = input.simulationInput.constitutionalTelemetryResult;
  const runtime = input.simulationInput.runtimeAdmissibilityResult;
  const evidenceRefs = Object.freeze([
    replay.evidence.evidenceId,
    telemetry.evidence.evidenceId,
    runtime.evidence.evidenceId,
    input.simulationInput.humanSupremacyResult.evidence.evidenceId,
    input.simulationInput.escalationDeterminismResult.evidence.evidenceId,
    input.simulationInput.antiEmergenceResult.evidence.evidenceId,
  ].sort());
  const reasons = Object.freeze([...input.reasons].sort());
  return Object.freeze({
    evidenceId: hashSimulationValue("constitutional-runtime-simulation-evidence-id", input.simulationInput.simulationId),
    simulationId: input.simulationInput.simulationId,
    replayEvidenceId: replay.evidence.evidenceId,
    telemetryEvidenceId: telemetry.evidence.evidenceId,
    runtimeEvidenceId: runtime.evidence.evidenceId,
    evidenceRefs,
    reasons,
    evidenceHash: hashSimulationValue("constitutional-runtime-simulation-evidence", {
      simulationId: input.simulationInput.simulationId,
      evidenceRefs,
      reasons,
    }),
  });
}
