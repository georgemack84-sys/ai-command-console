import { buildConstitutionalTelemetry } from "@/services/constitutional-telemetry/constitutionalTelemetryEngine";
import type {
  ConstitutionalTelemetryInput,
  TelemetryLedgerEntry,
  TelemetryLineageLedger,
} from "@/services/constitutional-telemetry/telemetryStateTypes";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

export function buildConstitutionalTelemetryFixture(
  overrides: Partial<ConstitutionalTelemetryInput> = {},
) {
  const constitutionalReplayResult = overrides.constitutionalReplayResult
    ?? buildConstitutionalReplayStabilityFixture().result;
  const humanSupremacyResult = overrides.humanSupremacyResult
    ?? buildHumanSupremacyEnforcementFixture({
      constitutionalReplayResult,
    }).result;
  const escalationDeterminismResult = overrides.escalationDeterminismResult
    ?? buildEscalationDeterminismFixture({
      constitutionalReplayResult,
      humanSupremacyResult,
    }).result;
  const antiEmergenceResult = overrides.antiEmergenceResult
    ?? buildAntiEmergenceFixture({
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
    }).result;
  const runtimeAdmissibilityResult = overrides.runtimeAdmissibilityResult
    ?? buildRuntimeAdmissibilityFixture({
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
      antiEmergenceResult,
    }).result;

  const baseInput = {
    telemetryId: "constitutional-telemetry-1",
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeAdmissibilityResult,
    deterministicSeed: "constitutional-telemetry-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T02:00:00.000Z",
  } satisfies ConstitutionalTelemetryInput;
  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConstitutionalTelemetryInput;

  return Object.freeze({
    input,
    result: buildConstitutionalTelemetry({
      ...input,
      existingLineage: overrides.existingLineage as TelemetryLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly TelemetryLedgerEntry[] | undefined,
    }),
  });
}
