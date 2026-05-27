import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildDecisionIntentBoundary } from "@/services/decision-intent-boundary/decisionIntentBoundaryEngine";
import type {
  DecisionIntentBoundaryInput,
  IntentLedgerEntry,
  IntentLineageLedger,
} from "@/services/decision-intent-boundary/decisionIntentStateTypes";

export function buildDecisionIntentBoundaryFixture(
  overrides: Partial<DecisionIntentBoundaryInput> = {},
) {
  const constitutionalAuthorityBoundaryResult = buildConstitutionalAuthorityBoundaryFixture().result;
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
  const constitutionalCertificationResult = overrides.constitutionalCertificationResult
    ?? buildConstitutionalCertificationFixture({
      constitutionalReadinessResult,
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
    intentId: "decision-intent-boundary-1",
    schemaVersion: "v1",
    intentType: "recommendation",
    summary: "Provide an operator-reviewed recommendation for bounded coordination stabilization.",
    evidenceLineage: Object.freeze(["evidence-1", "evidence-2"]),
    governanceLineage: Object.freeze(["governance-1"]),
    proposalLineage: Object.freeze(["proposal-1"]),
    replayLineage: Object.freeze(["replay-1"]),
    approvalDependencies: Object.freeze(["approval-1"]),
    constitutionalCertificationResult,
    constitutionalReadinessResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeAdmissibilityResult,
    constitutionalTelemetryResult,
    constitutionalRuntimeSimulationResult,
    deterministicSeed: "decision-intent-boundary-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T09:00:00.000Z",
  } satisfies DecisionIntentBoundaryInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as DecisionIntentBoundaryInput;

  return Object.freeze({
    input,
    result: buildDecisionIntentBoundary({
      ...input,
      existingLineage: overrides.existingLineage as IntentLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly IntentLedgerEntry[] | undefined,
    }),
  });
}
