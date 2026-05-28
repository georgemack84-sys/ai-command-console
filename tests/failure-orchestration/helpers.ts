import { orchestrateFailureState, type FailureOrchestrationInput } from "@/services/failure-orchestration";
import { buildZoneAdmissionFixture, evaluateZoneFixture } from "@/tests/isolation-boundary-engine/helpers";

export function buildFailureOrchestrationFixture(
  overrides: Partial<FailureOrchestrationInput> = {},
): FailureOrchestrationInput {
  const zoneInput = buildZoneAdmissionFixture();
  const zoneAdmission = evaluateZoneFixture();

  return {
    snapshot: zoneInput.snapshot,
    trustedSnapshotAdmission: zoneInput.trustedSnapshotAdmission,
    zoneAdmission,
    runtimeValidation: zoneInput.runtimeValidation,
    timestamp: "2026-05-16T00:00:00.000Z",
    replayRequested: false,
    mutationRequested: false,
    escalationRequested: false,
    currentMode: "NORMAL",
    governanceReapproved: false,
    ...overrides,
  };
}

export function evaluateFailureFixture(
  overrides: Partial<FailureOrchestrationInput> = {},
) {
  return orchestrateFailureState(buildFailureOrchestrationFixture(overrides));
}

