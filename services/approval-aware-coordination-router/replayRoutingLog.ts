import type { ApprovalAwareRoutingInput, CoordinationRouteTarget, RoutingReplayLog } from "@/types/approval-aware-coordination-router";
import { hashRoutingValue } from "./routingHashSerializer";

export function buildReplayRoutingLog(input: {
  routingInput: ApprovalAwareRoutingInput;
  target: CoordinationRouteTarget;
  blockedReasons: readonly string[];
}): RoutingReplayLog {
  const log: RoutingReplayLog = Object.freeze({
    replayLogId: hashRoutingValue("approval-aware-routing-replay-log-id", {
      coordinationId: input.routingInput.coordinationId,
      proposalId: input.routingInput.proposalId,
      timestamp: input.routingInput.timestamp,
    }),
    coordinationId: input.routingInput.coordinationId,
    proposalId: input.routingInput.proposalId,
    approvalId: input.routingInput.approvalState.approvalId,
    governanceSnapshotId: input.routingInput.governanceSnapshotId,
    replaySnapshotId: input.routingInput.replaySnapshotId,
    escalationSnapshotId: input.routingInput.escalationSnapshotId,
    containmentState: input.routingInput.containmentState,
    target: input.target,
    blockedReasons: Object.freeze([...input.blockedReasons]),
    createdAt: input.routingInput.timestamp,
    deterministicHash: "",
  });

  return Object.freeze({
    ...log,
    deterministicHash: hashRoutingValue("approval-aware-routing-replay-log", log),
  });
}
