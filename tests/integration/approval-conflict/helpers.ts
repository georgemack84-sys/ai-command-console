import type { RecommendationIntegrityResult } from "@/types/recommendation-integrity";
import { simulateApprovalConflictStress } from "@/services/approval-conflict";
import type {
  ApprovalConflictReplayLedgerEntry,
  ApprovalConflictLineage,
  ApprovalConflictStressInput,
} from "@/types/approval-conflict";

export function buildRecommendationIntegrityFixture(
  overrides: Partial<RecommendationIntegrityResult> = {},
): RecommendationIntegrityResult {
  const base: RecommendationIntegrityResult = Object.freeze({
    record: Object.freeze({
      recommendationId: "recommendation-1",
      coordinationId: "coordination-1",
      attackId: "attack-1",
      recommendationState: "SIMULATED",
      governanceSnapshotId: "governance-1",
      replaySnapshotId: "replay-1",
      escalationSnapshotId: "escalation-1",
      replaySafe: true,
      failClosed: false,
      createdAt: "2026-05-17T12:00:00.000Z",
    }),
    authorityContract: Object.freeze({
      executionAuthority: false,
      orchestrationAuthority: false,
      schedulingAuthority: false,
      runtimeMutationAuthority: false,
      governanceMutationAuthority: false,
      approvalInheritance: false,
      authorityInheritance: false,
      autonomousIntervention: false,
      workflowContinuation: false,
    }),
    weaknesses: Object.freeze([]),
    violations: Object.freeze([]),
    lineage: Object.freeze({
      lineageId: "recommendation-lineage-1",
      entries: Object.freeze([
        Object.freeze({
          entryId: "recommendation-entry-1",
          recommendationId: "recommendation-1",
          coordinationId: "coordination-1",
          recommendationState: "SIMULATED",
          createdAt: "2026-05-17T12:00:00.000Z",
          deterministicHash: "recommendation-entry-hash-1",
        }),
      ]),
      lineageHash: "recommendation-lineage-hash-1",
    }),
    replayLedger: Object.freeze([
      Object.freeze({
        ledgerId: "recommendation-ledger-1",
        previousHash: null,
        entryHash: "recommendation-ledger-hash-1",
        payload: Object.freeze({ recommendationId: "recommendation-1" }),
      }),
    ]),
    evidence: Object.freeze({
      evidenceId: "recommendation-evidence-1",
      recommendationId: "recommendation-1",
      coordinationId: "coordination-1",
      attackId: "attack-1",
      governanceSnapshotId: "governance-1",
      replaySnapshotId: "replay-1",
      escalationSnapshotId: "escalation-1",
      attackLineageId: "attack-lineage-1",
      readinessLineageId: "readiness-lineage-1",
      reasons: Object.freeze([]),
      evidenceHash: "recommendation-evidence-hash-1",
    }),
    integrityInspection: Object.freeze({
      recommendationId: "recommendation-1",
      coordinationId: "coordination-1",
      recommendationState: "SIMULATED",
      inspectionHash: "recommendation-inspection-hash-1",
    }),
    replayInspection: Object.freeze({
      replayId: "recommendation-replay-1",
      replayDeterministic: true,
      replayState: "historical",
      replayLedgerId: "recommendation-ledger-1",
      inspectionHash: "recommendation-replay-inspection-hash-1",
    }),
    governanceInspection: Object.freeze({
      governanceSnapshotId: "governance-1",
      governanceLinked: true,
      inspectionHash: "governance-inspection-hash-1",
    }),
    confidenceInspection: Object.freeze({
      confidenceLinked: true,
      confidenceSafe: true,
      inspectionHash: "confidence-inspection-hash-1",
    }),
    escalationInspection: Object.freeze({
      escalationId: "attack-1",
      escalationState: "elevated",
      escalationLineageId: "escalation-lineage-1",
      inspectionHash: "escalation-inspection-hash-1",
    }),
    authorityDriftInspection: Object.freeze({
      authorityDriftDetected: false,
      hiddenOrchestrationDetected: false,
      inspectionHash: "authority-inspection-hash-1",
    }),
    warnings: Object.freeze([]),
    errors: Object.freeze([]),
    deterministicHash: "recommendation-result-hash-1",
    derivedOnly: true,
  });
  return Object.freeze({
    ...base,
    ...overrides,
  });
}

export function buildApprovalConflictFixture(overrides: Partial<ApprovalConflictStressInput> = {}) {
  const input: ApprovalConflictStressInput = Object.freeze({
    conflictId: "conflict-fixture",
    recommendationResult: buildRecommendationIntegrityFixture(),
    deterministicSeed: "fixture-seed",
    createdAt: "2026-05-17T20:00:00.000Z",
    ...overrides,
  });

  return Object.freeze({
    input,
    result: simulateApprovalConflictStress({
      ...input,
      existingLineage: overrides.existingLineage as ApprovalConflictLineage | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly ApprovalConflictReplayLedgerEntry[] | undefined,
    }),
  });
}
