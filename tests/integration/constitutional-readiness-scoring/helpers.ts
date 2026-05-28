import { buildConstitutionalReadinessScoring } from "@/services/constitutional-readiness-scoring/constitutionalReadinessEngine";
import type {
  ConstitutionalReadinessInput,
  ReadinessLedgerEntry,
  ReadinessLineageLedger,
} from "@/services/constitutional-readiness-scoring/readinessStateTypes";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

export function buildConstitutionalReadinessScoringFixture(
  overrides: Partial<ConstitutionalReadinessInput> = {},
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
  const constitutionalRuntimeSimulationResult = overrides.constitutionalRuntimeSimulationResult
    ?? buildConstitutionalRuntimeSimulationFixture({
      constitutionalAuthorityBoundaryResult,
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
      antiEmergenceResult,
      runtimeAdmissibilityResult,
      constitutionalTelemetryResult,
    }).result;

  const baseInput = {
    readinessId: "constitutional-readiness-scoring-1",
    constitutionalAuthorityBoundaryResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeAdmissibilityResult,
    constitutionalTelemetryResult,
    constitutionalRuntimeSimulationResult,
    deterministicSeed: "constitutional-readiness-scoring-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T05:00:00.000Z",
  } satisfies ConstitutionalReadinessInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConstitutionalReadinessInput;

  return Object.freeze({
    input,
    result: buildConstitutionalReadinessScoring({
      ...input,
      existingLineage: overrides.existingLineage as ReadinessLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ReadinessLedgerEntry[] | undefined,
    }),
  });
}
