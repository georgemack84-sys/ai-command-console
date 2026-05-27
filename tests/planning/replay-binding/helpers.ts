import { buildAdmissionReadiness } from "@/services/planning/admission";
import type { ReplayBindingBuildInput } from "@/services/planning/replay-binding";
import { buildAdmissionFixture } from "@/tests/planning/admission/helpers";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function buildReplayBindingFixture(
  overrides: Partial<ReplayBindingBuildInput> = {},
): ReplayBindingBuildInput {
  const admissionInput = buildAdmissionFixture();
  const admissionReadiness = buildAdmissionReadiness(admissionInput);

  return {
    admissionInput: clone(admissionInput),
    admissionReadiness: clone(admissionReadiness),
    runtimeFingerprintHash: "runtime-fingerprint-hash",
    trustZoneId: admissionReadiness.context.trustZone,
    expectedRuntimeFingerprintHash: "runtime-fingerprint-hash",
    expectedDerivedSimulationHash: admissionReadiness.context.lineage.derivedSimulationHash,
    ...overrides,
  };
}
