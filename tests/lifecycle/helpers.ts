import { readFileSync } from "node:fs";
import path from "node:path";

import { orchestrateBoundedIntentLifecycle } from "@/services/lifecycle/lifecycleTransitionEngine";
import type {
  BoundedIntentLifecycleState,
  LifecycleContainmentBoundary,
  LifecycleLineageLedger,
  LifecycleTransitionRequest,
  LifecycleTransitionRecord,
} from "@/types/lifecycle";
import { buildIntentCorrelationFixture } from "@/tests/intent-correlation-engine/helpers";

function buildBoundary(): LifecycleContainmentBoundary {
  return Object.freeze({
    executionAuthority: false,
    orchestrationAuthority: false,
    schedulingAuthority: false,
    dispatchAuthority: false,
    mutationAuthority: false,
    lifecycleInferenceAuthority: false,
    correlationDrivenTransitions: false,
    approvalStateInheritance: false,
    escalationResolutionInference: false,
    coordinationEligibilityInference: false,
    replayGapInference: false,
    autonomousLifecycleRepair: false,
  });
}

function buildCurrentRecord(proposalId: string, currentState: BoundedIntentLifecycleState): LifecycleTransitionRecord {
  return Object.freeze({
    transitionId: `current-${proposalId}-${currentState}`,
    proposalId,
    currentState,
    requestedState: currentState,
    resultingState: currentState,
    governanceDecision: "ALLOW" as const,
    boundary: buildBoundary(),
    replayBinding: Object.freeze({
      replayBindingId: `binding-${proposalId}`,
      governanceSnapshotHash: "gov-hash",
      readinessCertificationHash: "ready-hash",
      proposalLineageHash: "proposal-lineage-hash",
      escalationLineageHash: "escalation-lineage-hash",
      correlationLineageHash: "correlation-lineage-hash",
      coordinationLineageHash: "coordination-lineage-hash",
      currentLifecycleHash: `current-${proposalId}-${currentState}`,
      replaySnapshotHash: "replay-snapshot-hash",
      reconstructionHash: `reconstruction-${proposalId}-${currentState}`,
      valid: true,
      createdAt: "2026-05-17T06:00:00.000Z",
    }),
    coordinationGate: Object.freeze({
      gateId: `gate-${proposalId}`,
      valid: true,
      coordinationState: "bounded",
      derivedOnly: true as const,
      errors: Object.freeze([]),
    }),
    createdAt: "2026-05-17T06:00:00.000Z",
    lifecycleHash: `current-hash-${proposalId}-${currentState}`,
    immutable: true as const,
  });
}

function buildExistingLineage(record: LifecycleTransitionRecord): LifecycleLineageLedger {
  return Object.freeze({
    ledgerId: `ledger-${record.proposalId}`,
    entries: Object.freeze([
      Object.freeze({
        entryId: `entry-${record.proposalId}`,
        transitionId: record.transitionId,
        proposalId: record.proposalId,
        fromState: record.currentState,
        toState: record.resultingState,
        replayHash: record.replayBinding.reconstructionHash,
        createdAt: record.createdAt,
      }),
    ]),
    lineageHash: `ledger-hash-${record.proposalId}`,
  });
}

export function buildLifecycleFixture(overrides: Partial<{
  currentState: BoundedIntentLifecycleState;
  nextState: BoundedIntentLifecycleState;
  metadata: Readonly<Record<string, unknown>>;
  existingLineage: LifecycleLineageLedger;
}> = {}) {
  const correlationFixture = buildIntentCorrelationFixture();
  const proposal = correlationFixture.input.proposals[0]!;
  const readinessGate = correlationFixture.input.readinessGates[0]!;
  const escalation = correlationFixture.input.escalations[0]!;
  const coordinationRecord = correlationFixture.input.coordinationRecords[0]!;
  const currentState = overrides.currentState ?? "observe";
  const currentRecord = buildCurrentRecord(proposal.proposalId, currentState);

  const request: LifecycleTransitionRequest = Object.freeze({
    proposal,
    readinessGate,
    escalation,
    coordinationRecord,
    correlationComputation: correlationFixture.computation,
    currentRecord,
    currentState,
    nextState: overrides.nextState ?? "interpret",
    governanceValidation: Object.freeze({
      asserted: true as const,
      governanceSnapshotHash: proposal.governanceBinding.policySnapshotHash,
    }),
    replayValidation: Object.freeze({
      asserted: true as const,
      replaySnapshotHash: proposal.replayBinding.replaySnapshotHash,
    }),
    escalationValidation: Object.freeze({
      asserted: true as const,
      escalationId: escalation.recommendation.escalationId,
    }),
    approvalValidation: Object.freeze({
      asserted: true as const,
      approvalState: proposal.approval.valid ? "valid" as const : "invalid" as const,
    }),
    boundary: buildBoundary(),
    createdAt: "2026-05-17T06:05:00.000Z",
    existingLineage: overrides.existingLineage ?? buildExistingLineage(currentRecord),
    metadata: overrides.metadata,
  });

  return {
    correlationFixture,
    request,
    computation: orchestrateBoundedIntentLifecycle(request),
  };
}

export function loadLifecycleSources() {
  const roots = [
    path.resolve("services", "lifecycle"),
    path.resolve("services", "governance"),
    path.resolve("services", "coordination"),
  ];
  const files = [
    path.join(roots[0]!, "lifecycleStateMachine.ts"),
    path.join(roots[0]!, "lifecycleTransitionEngine.ts"),
    path.join(roots[0]!, "lifecycleStateValidator.ts"),
    path.join(roots[0]!, "lifecycleReplayBuilder.ts"),
    path.join(roots[0]!, "lifecycleReplayIntegrityValidator.ts"),
    path.join(roots[0]!, "lifecycleAuditLineage.ts"),
    path.join(roots[0]!, "lifecycleAppendOnlyLedger.ts"),
    path.join(roots[0]!, "lifecycleBoundaryGuards.ts"),
    path.join(roots[0]!, "lifecycleContainmentValidator.ts"),
    path.join(roots[0]!, "transitionDeterminismInspector.ts"),
    path.join(roots[0]!, "boundedHandoffContract.ts"),
    path.join(roots[1]!, "governanceTransitionValidator.ts"),
    path.join(roots[1]!, "lifecycleBoundaryValidator.ts"),
    path.join(roots[2]!, "coordinationTransitionEngine.ts"),
    path.join(roots[2]!, "boundedCoordinationGate.ts"),
  ];

  return files.map((file) => ({
    path: file,
    content: readFileSync(file, "utf8"),
  }));
}
