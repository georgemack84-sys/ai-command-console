import type { ApprovalDependencyNode, ApprovalTimeWindow } from "@/types/approval-dependency-graph";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

export function buildApprovalTimeWindow(input: {
  validFrom: string;
  validUntil: string;
  timestamp: string;
}): ApprovalTimeWindow {
  const expired = input.validUntil < input.timestamp;
  const future = input.validFrom > input.timestamp;
  return Object.freeze({
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    validAtTimestamp: !expired && !future,
    expired,
    future,
    immutableHash: hashApprovalGraphValue("approval-time-window", input),
  });
}

export function extractApprovalTimeWindows(
  nodes: readonly ApprovalDependencyNode[],
  timestamp: string,
): readonly ApprovalTimeWindow[] {
  return Object.freeze(
    nodes.map((node) =>
      buildApprovalTimeWindow({
        validFrom: node.timeWindow.validFrom,
        validUntil: node.timeWindow.validUntil,
        timestamp,
      })),
  );
}
