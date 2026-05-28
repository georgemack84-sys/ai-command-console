import { buildRuntimeAdmissibility } from "@/services/runtime-admissibility/runtimeAdmissibilityEngine";
import type {
  RuntimeAdmissibilityInput,
  RuntimeCertificationLedgerEntry,
  RuntimeCertificationLineageLedger,
} from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildConstitutionalReplayStabilityFixture } from "@/tests/integration/constitutional-replay-stability/helpers";
import { buildEscalationDeterminismFixture } from "@/tests/integration/escalation-determinism/helpers";
import { buildHumanSupremacyEnforcementFixture } from "@/tests/integration/human-supremacy-enforcement/helpers";

export function buildRuntimeAdmissibilityFixture(
  overrides: Partial<RuntimeAdmissibilityInput> = {},
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

  const baseInput = {
    admissibilityId: "runtime-admissibility-1",
    constitutionalAuthorityBoundaryResult,
    constitutionalReplayResult,
    humanSupremacyResult,
    escalationDeterminismResult,
    antiEmergenceResult,
    runtimeTopology: Object.freeze({
      runtimeId: "runtime-1",
      governanceSnapshotId: constitutionalReplayResult.record.governanceSnapshotId,
      topologyHash: "runtime-topology-hash-1",
      declaredEdges: Object.freeze(["governance->runtime", "runtime->observability"]),
      hiddenOrchestrationDetected: false,
      recursiveCoordinationDetected: false,
      invisibleSchedulingDetected: false,
      hiddenRetryDetected: false,
      authorityExpansionDetected: false,
      runtimeCreatedRuntimesDetected: false,
      synthesizedOrchestrationDetected: false,
      executionMarkersDetected: false,
    }),
    rollbackSnapshot: Object.freeze({
      checkpointId: "checkpoint-1",
      checkpointState: "checkpoint:stable",
      ledgerEvents: Object.freeze([
        Object.freeze({
          eventPayload: Object.freeze({
            checkpointState: "checkpoint:stable",
          }),
        }),
      ]),
      rollbackHash: "rollback-hash-1",
    }),
    observabilitySnapshot: Object.freeze({
      runtimeId: "runtime-1",
      coverageDomains: Object.freeze([
        "runtime",
        "governance",
        "escalation",
        "approval",
        "override",
        "rollback",
        "replay",
        "containment",
      ] as const),
      lineageRefs: Object.freeze([
        constitutionalReplayResult.lineage.lineageHash,
        humanSupremacyResult.lineage.lineageHash,
        escalationDeterminismResult.lineage.lineageHash,
        antiEmergenceResult.lineage.lineageHash,
      ]),
      observabilityHash: "observability-hash-1",
    }),
    deterministicSeed: "runtime-admissibility-seed-1",
    validatorVersionId: "validator-v1",
    createdAt: "2026-05-19T01:00:00.000Z",
  } satisfies RuntimeAdmissibilityInput;
  const input = Object.freeze({
    ...baseInput,
    ...overrides,
  }) as RuntimeAdmissibilityInput;

  return Object.freeze({
    input,
    result: buildRuntimeAdmissibility({
      ...input,
      existingLineage: overrides.existingLineage as RuntimeCertificationLineageLedger | undefined,
      existingReplayLedger: overrides.existingReplayLedger as readonly RuntimeCertificationLedgerEntry[] | undefined,
    }),
  });
}
