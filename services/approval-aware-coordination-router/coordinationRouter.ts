import type {
  ApprovalAwareRoutingInput,
  ApprovalAwareRoutingResult,
  CoordinationRoutingDecision,
  RoutingLineageEntry,
} from "@/types/approval-aware-coordination-router";
import { buildRoutingAuthorityContract } from "./constitutionalRoutingAuthority";
import { enforceRoutingBoundary } from "./routingBoundaryEnforcer";
import { guardRoutingContainment } from "./routingContainmentGuard";
import { validateApprovalDependency } from "./approvalDependencyValidator";
import { validateRoutingTransition } from "./transitionValidator";
import { buildReplayRoutingLog } from "./replayRoutingLog";
import { appendRoutingLineage } from "./routingLineageEngine";
import { hashRoutingValue } from "./routingHashSerializer";

function decideRouting(input: {
  routingInput: ApprovalAwareRoutingInput;
  reasons: readonly string[];
  target: ApprovalAwareRoutingResult["target"];
}): CoordinationRoutingDecision {
  if (input.routingInput.containmentState === "frozen" || input.reasons.includes("containment:unknown")) {
    return "route_frozen";
  }
  if (input.reasons.length > 0 && input.routingInput.containmentState === "restricted") {
    return "route_escalated";
  }
  if (input.reasons.length > 0) {
    return "route_blocked";
  }
  return "route_allowed";
}

export function routeApprovalAwareCoordination(input: ApprovalAwareRoutingInput): ApprovalAwareRoutingResult {
  const authorityContract = buildRoutingAuthorityContract();
  const boundaryErrors = enforceRoutingBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const containmentErrors = guardRoutingContainment(input);
  const approvalErrors = validateApprovalDependency(input);
  const transition = validateRoutingTransition(input);

  const blockedReasons = Object.freeze([
    ...boundaryErrors,
    ...containmentErrors,
    ...approvalErrors,
    ...transition.reasons,
    ...(input.priorRoutingLineageIds.includes(input.coordinationId)
      ? ["routing:recursive-lineage"]
      : []),
  ]);

  const decision = decideRouting({
    routingInput: input,
    reasons: blockedReasons,
    target: transition.target,
  });

  const target =
    decision === "route_frozen" ? "coordination_hold"
    : decision === "route_escalated" ? "human_review"
    : transition.target;

  const replayLog = buildReplayRoutingLog({
    routingInput: input,
    target,
    blockedReasons,
  });

  const provisionalHash = hashRoutingValue("approval-aware-routing-result-provisional", {
    proposalId: input.proposalId,
    coordinationId: input.coordinationId,
    decision,
    target,
    blockedReasons,
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
  });

  const lineageEntry: RoutingLineageEntry = Object.freeze({
    lineageRecordId: hashRoutingValue("approval-aware-routing-lineage-entry-id", {
      coordinationId: input.coordinationId,
      proposalId: input.proposalId,
      timestamp: input.timestamp,
      provisionalHash,
    }),
    coordinationId: input.coordinationId,
    proposalId: input.proposalId,
    decision,
    target,
    containmentState: input.containmentState,
    blockedReasons,
    createdAt: input.timestamp,
    deterministicHash: provisionalHash,
  });

  const lineage = appendRoutingLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });

  const resultBase = Object.freeze({
    decision,
    allowed: decision === "route_allowed",
    target,
    blockedReasons: [...blockedReasons],
    lineageRecordId: lineageEntry.lineageRecordId,
    replayLogId: replayLog.replayLogId,
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    authorityContract,
    lineage,
    replayLog,
    warnings: Object.freeze([
      "Approval-aware coordination routing remains constitutional, static, and non-executing.",
    ]),
    errors: blockedReasons,
    derivedOnly: true as const,
  });

  return Object.freeze({
    ...resultBase,
    deterministicHash: hashRoutingValue("approval-aware-routing-result", resultBase),
  });
}
