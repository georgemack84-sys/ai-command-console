import { buildConstitutionalCertification } from "@/services/constitutional-certification/constitutionalCertificationEngine";
import type {
  CertificationLedgerEntry,
  CertificationLineageLedger,
  ConstitutionalCertificationInput,
} from "@/services/constitutional-certification/certificationStateTypes";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

export function buildConstitutionalCertificationFixture(
  overrides: Partial<ConstitutionalCertificationInput> = {},
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
  const constitutionalReadinessResult = overrides.constitutionalReadinessResult
    ?? buildConstitutionalReadinessScoringFixture({
      constitutionalAuthorityBoundaryResult,
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
      antiEmergenceResult,
      runtimeAdmissibilityResult,
      constitutionalTelemetryResult,
      constitutionalRuntimeSimulationResult,
    }).result;

  const baseInput = {
    certificationId: "constitutional-certification-1",
    constitutionalReadinessResult,
    constitutionalAuthorityBoundaryResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeAdmissibilityResult,
    constitutionalTelemetryResult,
    constitutionalRuntimeSimulationResult,
    deterministicSeed: "constitutional-certification-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T07:00:00.000Z",
  } satisfies ConstitutionalCertificationInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as ConstitutionalCertificationInput;

  return Object.freeze({
    input,
    result: buildConstitutionalCertification({
      ...input,
      existingLineage: overrides.existingLineage as CertificationLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly CertificationLedgerEntry[] | undefined,
    }),
  });
}
