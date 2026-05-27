import type { BoundedOrchestrationInput, BoundedOrchestrationRecord, BoundedOrchestrationChronologyEntry } from "@/types/bounded-orchestration-framework";
import { buildBoundedOrchestrationAuthorityContract, enforceBoundedOrchestrationBoundary, enforceGovernanceBoundary } from "./governanceBoundaryEnforcer";
import { inheritOrchestrationContainmentState } from "./orchestrationContainmentGuard";
import { buildBoundedOrchestrationTopology, validateBoundedOrchestrationTopology } from "./orchestrationTopologyValidator";
import { guardBoundedOrchestrationTransition } from "./orchestrationTransitionGuard";
import { detectRecursiveDelegation } from "./recursiveDelegationDetector";
import { assessOrchestrationIsolation } from "./orchestrationIsolationValidator";
import { validateBoundedOrchestration } from "./orchestrationValidator";
import { resolveBoundedOrchestrationState } from "./orchestrationFreezeEngine";
import { validateOrchestrationCeiling } from "./orchestrationCeilingValidator";
import { hashOrchestrationValue } from "./orchestrationHashEngine";
import { appendOrchestrationChronology } from "./orchestrationLineageEngine";
import { assembleOrchestrationReplay } from "./orchestrationReplayAssembler";

export function buildBoundedOrchestrationRecord(input: BoundedOrchestrationInput): BoundedOrchestrationRecord {
  const authorityContract = buildBoundedOrchestrationAuthorityContract();
  const boundaryErrors = enforceBoundedOrchestrationBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const topology = buildBoundedOrchestrationTopology(input);
  const topologyErrors = validateBoundedOrchestrationTopology(topology);
  const transitionErrors = guardBoundedOrchestrationTransition({
    routingResult: input.routingResult,
    metadata: input.metadata,
  });
  const delegation = detectRecursiveDelegation(input);
  const isolation = assessOrchestrationIsolation(input);
  const governanceErrors = enforceGovernanceBoundary(input);
  const validation = validateBoundedOrchestration({
    orchestrationInput: input,
    topology,
    topologyErrors,
    boundaryErrors,
    governanceErrors,
    transitionErrors,
    delegation,
    isolation,
  });
  const containmentState = inheritOrchestrationContainmentState(input.containmentValidation.containmentState);
  const ceiling = validateOrchestrationCeiling(containmentState);
  const orchestrationState = resolveBoundedOrchestrationState({
    containmentState,
    failClosed: validation.failClosed,
    valid: validation.valid,
  });
  const chronologyEntry: BoundedOrchestrationChronologyEntry = Object.freeze({
    entryId: hashOrchestrationValue("chronology-entry", {
      orchestrationId: input.orchestrationId,
      coordinationId: input.coordinationRecord.coordinationId,
      createdAt: input.createdAt,
    }),
    orchestrationId: input.orchestrationId,
    coordinationId: input.coordinationRecord.coordinationId,
    containmentState,
    ceiling,
    orchestrationState,
    topologyHash: hashOrchestrationValue("topology-hash", topology),
    createdAt: input.createdAt,
  });
  const chronology = appendOrchestrationChronology({
    existing: input.existingChronology,
    entry: chronologyEntry,
  });
  const replay = assembleOrchestrationReplay({
    orchestrationInput: input,
    chronologyEntries: chronology.entries,
  });
  const deterministicHash = hashOrchestrationValue("record", {
    orchestrationId: input.orchestrationId,
    coordinationId: input.coordinationRecord.coordinationId,
    topology,
    validation,
    chronology,
    replay,
  });

  return Object.freeze({
    orchestrationId: input.orchestrationId,
    coordinationId: input.coordinationRecord.coordinationId,
    proposalId: input.coordinationRecord.proposalId,
    governanceSnapshotId: input.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.coordinationRecord.escalationSnapshotId,
    containmentState: input.containmentValidation.containmentState,
    orchestrationState,
    ceiling,
    authorityContract,
    topology,
    containment: Object.freeze({
      inheritedState: input.containmentValidation.containmentState,
      ceilingLevel: ceiling,
    }),
    isolation: Object.freeze({
      isolated: isolation.isolated,
      governanceScopeId: isolation.scope.governanceSnapshotId,
      replayScopeId: isolation.scope.replaySnapshotId,
      approvalScopeId: isolation.scope.approvalScopeHash,
      escalationScopeId: isolation.scope.escalationSnapshotId,
      containmentScopeId: isolation.scope.containmentState,
      coordinationScopeId: isolation.scope.coordinationId,
      missionScopeId: isolation.scope.missionId,
      leakage: isolation.leakedScopes,
    }),
    state: orchestrationState,
    validation,
    replay,
    chronology,
    lineage: chronology,
    deterministicHash,
    warnings: Object.freeze([
      "Bounded orchestration remains a containment-only visibility layer and cannot execute or continue workflows.",
    ]),
    errors: validation.errors,
    createdAt: input.createdAt,
    derivedOnly: true as const,
  });
}

export const buildOrchestrationBoundaryRecord = buildBoundedOrchestrationRecord;
