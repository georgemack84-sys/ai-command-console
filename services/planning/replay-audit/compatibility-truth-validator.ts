import { serializeDeterministically } from "../normalization/deterministic-serializer";
import { createReplayAuditFailure } from "./replay-audit-errors";
import type { ReplayAuditInput, ReplayAuditFailure } from "./replay-audit-types";

function compareKeys<T extends string>(actual: Iterable<T>, expected: Iterable<T>) {
  const actualList = [...actual].sort();
  const expectedList = [...expected].sort();
  return actualList.length === expectedList.length
    && actualList.every((value, index) => value === expectedList[index]);
}

export function validateCompatibilityTruth(
  input: ReplayAuditInput,
  compatibilitySnapshotHash: string,
): readonly ReplayAuditFailure[] {
  const failures: ReplayAuditFailure[] = [];
  const contract = input.executionCompatibilityContract;

  if (input.expectedExecutionTruthHash && input.expectedExecutionTruthHash !== input.executionTruthPackage.executionTruthHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_COMPATIBILITY_HASH_DRIFT",
      "Expected execution truth hash does not match the provided execution truth package.",
      "expectedExecutionTruthHash",
    ));
  }

  if (input.expectedExecutionCompatibilityHash && input.expectedExecutionCompatibilityHash !== contract.executionCompatibilityHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_COMPATIBILITY_HASH_DRIFT",
      "Expected execution compatibility hash does not match the provided compatibility contract.",
      "expectedExecutionCompatibilityHash",
    ));
  }

  if (contract.executionTruthHash !== input.executionTruthPackage.executionTruthHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_COMPATIBILITY_TRUTH_VIOLATION",
      "Compatibility contract does not preserve the upstream execution truth hash.",
      "executionCompatibilityContract.executionTruthHash",
    ));
  }

  if (contract.compatibilitySnapshot.executionTruthHash !== contract.executionTruthHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_COMPATIBILITY_SNAPSHOT_MISMATCH",
      "Compatibility snapshot execution truth hash diverged from the compatibility contract.",
      "compatibilitySnapshot.executionTruthHash",
    ));
  }

  if (contract.compatibilitySnapshot.planId !== input.normalizedPlan.planId) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_COMPATIBILITY_SNAPSHOT_MISMATCH",
      "Compatibility snapshot planId diverged from normalized plan identity.",
      "compatibilitySnapshot.planId",
    ));
  }

  const approvalStepIds = contract.approvalContracts.map((contractEntry) => contractEntry.stepId);
  const scopeBoundaryStepIds = Object.keys(contract.compatibilitySnapshot.scopeBoundaries);
  if (!compareKeys(approvalStepIds, scopeBoundaryStepIds)) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_APPROVAL_CONTRACT_REHYDRATION_DETECTED",
      "Approval contracts and compatibility snapshot scope boundaries no longer align.",
      "compatibilitySnapshot.scopeBoundaries",
    ));
  }

  const rollbackStepIds = contract.rollbackContracts.map((contractEntry) => contractEntry.stepId);
  const rollbackOrderStepIds = Object.keys(contract.compatibilitySnapshot.rollbackOrder);
  if (!compareKeys(rollbackStepIds, rollbackOrderStepIds)) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_ROLLBACK_CONTRACT_REGENERATION_DETECTED",
      "Rollback contracts and compatibility snapshot rollback order no longer align.",
      "compatibilitySnapshot.rollbackOrder",
    ));
  }

  const authorityMatches = serializeDeterministically(contract.compatibilitySnapshot.authorityGraph)
    === serializeDeterministically(contract.authorityGraph);
  if (!authorityMatches) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_AUTHORITY_GRAPH_DIVERGENCE",
      "Authority graph diverged from the compatibility snapshot.",
      "compatibilitySnapshot.authorityGraph",
    ));
  }

  const escalationMatches = serializeDeterministically(contract.compatibilitySnapshot.escalationGraph)
    === serializeDeterministically(contract.escalationGraph);
  if (!escalationMatches) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_ESCALATION_GRAPH_DIVERGENCE",
      "Escalation graph diverged from the compatibility snapshot.",
      "compatibilitySnapshot.escalationGraph",
    ));
  }

  if (!compatibilitySnapshotHash) {
    failures.push(createReplayAuditFailure(
      "PHASE4_2H_COMPATIBILITY_SNAPSHOT_MISMATCH",
      "Compatibility snapshot hash could not be derived deterministically.",
      "compatibilitySnapshotHash",
    ));
  }

  return failures;
}
