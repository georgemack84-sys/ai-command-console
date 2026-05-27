import type {
  BoundedHandoffContractRecord,
  LifecycleComputation,
  LifecycleTransitionRequest,
  LifecycleTransitionRecord,
} from "@/types/lifecycle";
import { resolveLifecycleStateTransition } from "./lifecycleStateMachine";
import { validateLifecycleStateRequest } from "./lifecycleStateValidator";
import { validateLifecycleBoundaryContract } from "@/services/governance/lifecycleBoundaryValidator";
import { validateGovernanceTransitionRequest } from "@/services/governance/governanceTransitionValidator";
import { buildLifecycleReplayBinding } from "./lifecycleReplayBuilder";
import { validateLifecycleReplayIntegrity } from "./lifecycleReplayIntegrityValidator";
import { guardLifecycleRequest, validateLifecycleSourceBoundary } from "./lifecycleBoundaryGuards";
import { validateLifecycleContainment } from "./lifecycleContainmentValidator";
import { inspectLifecycleDeterminism } from "./transitionDeterminismInspector";
import { appendLifecycleLedger } from "./lifecycleAppendOnlyLedger";
import { buildLifecycleAuditEvents } from "./lifecycleAuditLineage";
import { buildBoundedHandoffContract } from "./boundedHandoffContract";
import { buildBoundedCoordinationGate } from "@/services/coordination/boundedCoordinationGate";
import { buildLifecycleHash } from "./lifecycleHasher";

export function orchestrateBoundedIntentLifecycle(request: LifecycleTransitionRequest): LifecycleComputation {
  const guardErrors = guardLifecycleRequest(request);
  const stateErrors = validateLifecycleStateRequest(request);
  const boundaryErrors = validateLifecycleBoundaryContract(request.boundary);
  const governanceErrors = validateGovernanceTransitionRequest(request);
  const coordinationGate = buildBoundedCoordinationGate({
    currentState: request.currentState,
    nextState: request.nextState,
    coordinationRecord: request.coordinationRecord,
  });
  const replay = buildLifecycleReplayBinding(request);
  const replayErrors = validateLifecycleReplayIntegrity({
    request,
    replayBinding: replay.replayBinding,
  });
  const containmentErrors = validateLifecycleContainment(request);

  const preTransitionErrors = [
    ...guardErrors,
    ...stateErrors,
    ...boundaryErrors,
    ...governanceErrors,
    ...coordinationGate.errors,
    ...replay.errors,
    ...replayErrors,
    ...containmentErrors,
  ];
  const transition = resolveLifecycleStateTransition(request, preTransitionErrors.length > 0);
  const lifecycleHash = buildLifecycleHash("bounded-intent-lifecycle-provisional", {
    proposalId: request.proposal.proposalId,
    currentState: request.currentState,
    nextState: transition.resultingState,
    replayBinding: replay.replayBinding,
  });
  const lineage = appendLifecycleLedger({
    existing: request.existingLineage,
    transitionId: lifecycleHash,
    fromState: request.currentState,
    toState: transition.resultingState,
    proposalId: request.proposal.proposalId,
    replayHash: replay.replayBinding.reconstructionHash,
    createdAt: request.createdAt,
  });
  const handoff: BoundedHandoffContractRecord | undefined = transition.resultingState === "bounded_handoff"
    ? buildBoundedHandoffContract({
      request,
      replayBinding: replay.replayBinding,
      lineage,
    })
    : undefined;

  const provisionalRecord: LifecycleTransitionRecord = Object.freeze({
    transitionId: lifecycleHash,
    proposalId: request.proposal.proposalId,
    currentState: request.currentState,
    requestedState: request.nextState,
    resultingState: transition.resultingState,
    governanceDecision: preTransitionErrors.length === 0 && transition.errors.length === 0 ? "ALLOW" : "DENY",
    boundary: request.boundary,
    replayBinding: replay.replayBinding,
    coordinationGate,
    handoff,
    createdAt: request.createdAt,
    lifecycleHash: "",
    immutable: true,
  });
  const sourceBoundaryErrors = validateLifecycleSourceBoundary(provisionalRecord);
  const auditEvents = buildLifecycleAuditEvents({
    record: provisionalRecord,
    createdAt: request.createdAt,
  });
  const recordHash = buildLifecycleHash("bounded-intent-lifecycle-record", {
    provisionalRecord,
    lineage,
    auditEvents,
  });
  const record: LifecycleTransitionRecord = Object.freeze({
    ...provisionalRecord,
    lifecycleHash: recordHash,
  });
  const determinismErrors = inspectLifecycleDeterminism(record);
  const errors = Object.freeze([
    ...preTransitionErrors,
    ...transition.errors,
    ...sourceBoundaryErrors,
    ...determinismErrors,
  ]);

  return Object.freeze({
    record,
    lineage,
    auditEvents,
    warnings: Object.freeze([
      ...request.proposal.warnings,
      ...request.readinessGate.warnings,
      ...request.escalation.warnings,
      ...request.coordinationRecord.warnings,
      ...(request.correlationComputation.result.relationships.length > 0
        ? ["Correlation inputs remained visibility-only and did not authorize lifecycle movement."]
        : []),
    ]),
    errors,
  });
}
