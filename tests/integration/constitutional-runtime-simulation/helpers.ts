import { buildConstitutionalRuntimeSimulation } from "@/services/constitutional-runtime-simulation/constitutionalSimulationEngine";
import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationLedgerEntry,
  SimulationLineageLedger,
} from "@/services/constitutional-runtime-simulation/simulationStateTypes";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

export function buildConstitutionalRuntimeSimulationFixture(
  overrides: Partial<ConstitutionalRuntimeSimulationInput> = {},
) {
  const constitutionalAuthorityBoundaryResult = overrides.constitutionalAuthorityBoundaryResult
    ?? buildConstitutionalAuthorityBoundaryFixture().result;
  const constitutionalReplayResult = overrides.constitutionalReplayResult
    ?? buildConstitutionalReplayStabilityFixture({
      constitutionalAuthorityBoundaryResult,
    }).result;
  const humanSupremacyResult = overrides.humanSupremacyResult
    ?? buildHumanSupremacyEnforcementFixture({
      constitutionalReplayResult,
    }).result;
  const escalationDeterminismResult = overrides.escalationDeterminismResult
    ?? buildEscalationDeterminismFixture({
      constitutionalAuthorityBoundaryResult,
      constitutionalReplayResult,
      humanSupremacyResult,
    }).result;
  const antiEmergenceResult = overrides.antiEmergenceResult
    ?? buildAntiEmergenceFixture({
      constitutionalAuthorityBoundaryResult,
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
    }).result;
  const runtimeAdmissibilityResult = overrides.runtimeAdmissibilityResult
    ?? buildRuntimeAdmissibilityFixture({
      constitutionalAuthorityBoundaryResult,
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
      antiEmergenceResult,
    }).result;
  const constitutionalTelemetryResult = overrides.constitutionalTelemetryResult
    ?? buildConstitutionalTelemetryFixture({
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
      antiEmergenceResult,
      runtimeAdmissibilityResult,
    }).result;

  const baseInput = {
    simulationId: "constitutional-runtime-simulation-1",
    constitutionalAuthorityBoundaryResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeAdmissibilityResult,
    constitutionalTelemetryResult,
    deterministicSeed: "constitutional-runtime-simulation-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T03:00:00.000Z",
  } satisfies ConstitutionalRuntimeSimulationInput;
  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConstitutionalRuntimeSimulationInput;

  return Object.freeze({
    input,
    result: buildConstitutionalRuntimeSimulation({
      ...input,
      existingLineage: overrides.existingLineage as SimulationLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly SimulationLedgerEntry[] | undefined,
    }),
  });
}
