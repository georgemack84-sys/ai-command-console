import type {
  RuntimeAdmissibilityInput,
  RuntimeSimulationSignal,
} from "./runtimeAdmissibilityStateTypes";
import { hashRuntimeCertificationValue } from "./runtimeCertificationHashingEngine";

function buildSignal(
  domain: RuntimeSimulationSignal["domain"],
  triggered: boolean,
  severity: RuntimeSimulationSignal["severity"],
  reason: string,
): RuntimeSimulationSignal {
  return Object.freeze({
    domain,
    triggered,
    severity,
    reason,
    deterministicHash: hashRuntimeCertificationValue("runtime-admissibility-signal", {
      domain,
      triggered,
      severity,
      reason,
    }),
  });
}

export function runRuntimeAdmissibilitySimulation(
  input: RuntimeAdmissibilityInput,
): readonly RuntimeSimulationSignal[] {
  const coverage = new Set(input.observabilitySnapshot.coverageDomains);
  return Object.freeze([
    buildSignal("governance", input.runtimeTopology.governanceSnapshotId !== input.constitutionalReplayResult.record.governanceSnapshotId, "critical", "Runtime topology diverged from historical governance binding."),
    buildSignal("rollback", input.rollbackSnapshot.checkpointState !== "checkpoint:stable", input.rollbackSnapshot.checkpointState ? "high" : "critical", "Rollback checkpoint did not remain stably reconstructable."),
    buildSignal("observability", coverage.size < 8, coverage.size < 6 ? "critical" : "moderate", "Observability coverage is incomplete for constitutional admissibility."),
    buildSignal("approval", input.constitutionalReplayResult.replayState.approvalState !== "stable", "high", "Approval lineage is not stably replay reconstructable."),
    buildSignal("escalation", input.escalationDeterminismResult.record.oversightState !== "stable", "high", "Escalation determinism indicates amplified oversight."),
    buildSignal("override", input.humanSupremacyResult.record.enforcementState !== "ENFORCED", "critical", "Human supremacy enforcement is no longer cleanly enforced."),
    buildSignal("containment", input.antiEmergenceResult.record.classification !== "contained", "critical", "Containment classification is no longer fully contained."),
    buildSignal("anti_emergence", input.runtimeTopology.hiddenOrchestrationDetected || input.runtimeTopology.synthesizedOrchestrationDetected, "critical", "Runtime topology exhibits orchestration emergence markers."),
    buildSignal("topology", input.runtimeTopology.recursiveCoordinationDetected || input.runtimeTopology.invisibleSchedulingDetected, "critical", "Runtime topology contains recursive or scheduling semantics."),
    buildSignal("replay", !input.constitutionalReplayResult.record.replayDeterministic, "critical", "Replay determinism is no longer preserved."),
  ]);
}
