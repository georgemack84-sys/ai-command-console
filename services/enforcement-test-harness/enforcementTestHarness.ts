import { orchestrateFailureState, type FailureOrchestrationInput, type FailureOrchestrationResult } from "@/services/failure-orchestration";
import {
  type AttackExpectedOutcome,
  type EnforcementHarnessEvidence,
  type EnforcementHarnessResult,
  type EnforcementScenarioDefinition,
} from "./enforcementHarnessTypes";
import { buildForensicTimeline } from "./forensicTimelineBuilder";
import { verifyFailureSnapshotIntegrity } from "./failureSnapshotVerifier";

function deriveActualOutcome(
  scenario: EnforcementScenarioDefinition,
  result: FailureOrchestrationResult,
  snapshotValid: boolean,
): AttackExpectedOutcome {
  if (scenario.category === "forensic") {
    return "FORENSIC_RECONSTRUCTED";
  }
  if (scenario.category === "snapshot" && !snapshotValid) {
    return "SNAPSHOT_REJECTED";
  }
  if (scenario.category === "replay" && result.propagation.containment.some((item) => item.action === "deny_replay")) {
    return "REPLAY_REJECTED";
  }
  if (!result.allowed && result.runtimeMode === "FULL_CONTAINMENT") {
    return "CONTAINED";
  }
  if (!result.allowed) {
    return "DENIED";
  }
  return scenario.expectedOutcome;
}

function buildEvidence(
  result: FailureOrchestrationResult,
  timelineHash?: string,
): EnforcementHarnessEvidence {
  return {
    resultHash: result.decisionHash,
    signalCount: result.signals.length,
    containmentCount: result.propagation.containment.length,
    runtimeMode: result.runtimeMode,
    trustState: result.trustState,
    snapshotHash: result.snapshot.snapshotHash,
    timelineHash,
    details: {
      recoveryAllowed: result.recovery.allowed,
      rehydrationAllowed: result.rehydration.allowed,
      survivabilityHash: result.survivability.survivabilityHash,
    },
  };
}

export function runEnforcementScenario(
  scenario: EnforcementScenarioDefinition,
  baseInput: FailureOrchestrationInput,
): EnforcementHarnessResult {
  const mutatedInput = scenario.mutateInput ? scenario.mutateInput(baseInput) : baseInput;
  const first = orchestrateFailureState(mutatedInput);
  const second = orchestrateFailureState(mutatedInput);
  const deterministic = first.decisionHash === second.decisionHash
    && first.snapshot.snapshotHash === second.snapshot.snapshotHash;
  const snapshotVerification = verifyFailureSnapshotIntegrity(first);
  const timeline = buildForensicTimeline(scenario.scenarioId, mutatedInput, first);
  const actualOutcome = deriveActualOutcome(scenario, first, snapshotVerification.valid);
  const verifiedReplaySafe = scenario.verifyReplaySafe
    ? scenario.verifyReplaySafe(first)
    : !first.allowed || !mutatedInput.replayRequested || first.runtimeMode === "NORMAL";
  const denied = scenario.category === "recovery"
    ? !first.recovery.allowed || !first.rehydration.allowed
    : !first.allowed;
  const contained = first.runtimeMode === "FULL_CONTAINMENT" || first.runtimeMode === "RECOVERY_ONLY";
  const certificationEligible =
    scenario.expectedOutcome === actualOutcome &&
    deterministic &&
    verifiedReplaySafe &&
    (scenario.verifyResult ? scenario.verifyResult(first) : true);

  return {
    scenarioId: scenario.scenarioId,
    category: scenario.category,
    expectedOutcome: scenario.expectedOutcome,
    actualOutcome,
    denied,
    contained,
    deterministic,
    replaySafe: verifiedReplaySafe,
    forensicSnapshotHash: first.snapshot.snapshotHash,
    certificationEligible,
    errorCode: scenario.errorCode ?? snapshotVerification.errorCode,
    evidence: buildEvidence(first, timeline.timelineHash),
  };
}

export function runEnforcementScenarios(
  scenarios: readonly EnforcementScenarioDefinition[],
  baseInput: FailureOrchestrationInput,
): readonly EnforcementHarnessResult[] {
  return scenarios.map((scenario) => runEnforcementScenario(scenario, baseInput));
}
