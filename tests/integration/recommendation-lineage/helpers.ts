import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildConstitutionalRuntimeSimulationFixture } from "@/tests/integration/constitutional-runtime-simulation/helpers";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";
import { buildDecisionIntentBoundaryFixture } from "@/tests/integration/decision-intent-boundary/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildRecommendationLineage } from "@/services/recommendation-lineage/recommendationLineageEngine";
import type {
  RecommendationLineageInput,
  RecommendationLineageLedger,
  RecommendationLineageLedgerEntry,
} from "@/services/recommendation-lineage/recommendationLineageStateTypes";

export function buildRecommendationLineageFixture(
  overrides: Partial<RecommendationLineageInput> = {},
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
  const antiEmergenceResult = buildAntiEmergenceFixture({
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
  const constitutionalTelemetryResult = buildConstitutionalTelemetryFixture({
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeAdmissibilityResult,
  }).result;
  const constitutionalRuntimeSimulationResult = buildConstitutionalRuntimeSimulationFixture({
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
  const decisionIntentBoundaryResult = overrides.decisionIntentBoundaryResult
    ?? buildDecisionIntentBoundaryFixture({
      constitutionalCertificationResult,
      constitutionalReadinessResult,
      constitutionalReplayResult,
      humanSupremacyResult,
      escalationDeterminismResult,
      antiEmergenceResult,
      runtimeAdmissibilityResult,
      constitutionalTelemetryResult,
      constitutionalRuntimeSimulationResult,
    }).result;

  const baseInput = {
    recommendationId: "recommendation-lineage-1",
    lineageId: "lineage-1",
    evidenceSnapshots: Object.freeze([
      {
        snapshotId: "evidence-snapshot-1",
        evidenceHash: "evidence-hash-1",
        provenanceRef: "source:1",
        sourceVersion: "v1",
        acquiredAt: "2026-05-19T08:59:00.000Z",
      },
      {
        snapshotId: "evidence-snapshot-2",
        evidenceHash: "evidence-hash-2",
        provenanceRef: "source:2",
        sourceVersion: "v1",
        acquiredAt: "2026-05-19T08:59:30.000Z",
      },
    ]),
    scoringSnapshot: Object.freeze({
      scoringSnapshotId: "scoring-snapshot-1",
      scoringFactors: Object.freeze(["readiness", "containment"]),
      scoringWeights: Object.freeze({ readiness: 0.6, containment: 0.4 }),
      arbitrationDecisions: Object.freeze(["prefer containment"]),
      thresholdDecisions: Object.freeze(["review threshold crossed"]),
      rankingLogic: Object.freeze(["stable-order"]),
      confidenceReasoning: Object.freeze(["upstream readiness certified"]),
      uncertaintyFactors: Object.freeze(["operator review retained"]),
    }),
    policySnapshot: Object.freeze({
      policySnapshotId: "policy-snapshot-1",
      applicablePolicies: Object.freeze(["policy-a"]),
      inheritedPolicies: Object.freeze(["policy-root"]),
      overriddenPolicies: Object.freeze([]),
      conflictPolicies: Object.freeze([]),
    }),
    approvalSnapshot: Object.freeze({
      approvalSnapshotId: "approval-snapshot-1",
      approvalDependencies: Object.freeze(["approval-a"]),
      escalationApprovals: Object.freeze(["escalation-approval-a"]),
      approvalRevocations: Object.freeze([]),
      overrideHistory: Object.freeze(["override-a"]),
      operatorInterventions: Object.freeze(["operator-reviewed"]),
    }),
    constitutionalCertificationResult,
    constitutionalReadinessResult,
    runtimeAdmissibilityResult,
    constitutionalReplayResult,
    decisionIntentBoundaryResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    deterministicSeed: "recommendation-lineage-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T10:00:00.000Z",
  } satisfies RecommendationLineageInput;

  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RecommendationLineageInput;

  return Object.freeze({
    input,
    result: buildRecommendationLineage({
      ...input,
      existingLineage: overrides.existingLineage as RecommendationLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly RecommendationLineageLedgerEntry[] | undefined,
    }),
  });
}
