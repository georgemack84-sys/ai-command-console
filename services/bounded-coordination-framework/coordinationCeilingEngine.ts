import type { CoordinationCeiling } from "@/types/bounded-coordination-framework";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";

export function deriveEffectiveCoordinationCeiling(input: {
  requested: CoordinationCeiling;
  auditEpisode: AutonomyAuditEpisode;
}): CoordinationCeiling {
  const caution = input.auditEpisode.observation.cautionState;
  if (caution === "frozen-recommended") {
    return Object.freeze({
      maxDepth: Math.min(input.requested.maxDepth, 1),
      maxBranchFactor: Math.min(input.requested.maxBranchFactor, 1),
      maxDelegations: Math.min(input.requested.maxDelegations, 1),
      maxEscalationDepth: Math.min(input.requested.maxEscalationDepth, 0),
      maxWorkflowNodes: Math.min(input.requested.maxWorkflowNodes, 1),
      maxCoordinationDurationMs: Math.min(input.requested.maxCoordinationDurationMs, 1000),
    });
  }
  if (caution === "escalated") {
    return Object.freeze({
      maxDepth: Math.min(input.requested.maxDepth, 2),
      maxBranchFactor: Math.min(input.requested.maxBranchFactor, 2),
      maxDelegations: Math.min(input.requested.maxDelegations, 2),
      maxEscalationDepth: Math.min(input.requested.maxEscalationDepth, 1),
      maxWorkflowNodes: Math.min(input.requested.maxWorkflowNodes, 3),
      maxCoordinationDurationMs: Math.min(input.requested.maxCoordinationDurationMs, 5_000),
    });
  }
  if (caution === "restricted") {
    return Object.freeze({
      maxDepth: Math.min(input.requested.maxDepth, 3),
      maxBranchFactor: Math.min(input.requested.maxBranchFactor, 2),
      maxDelegations: Math.min(input.requested.maxDelegations, 3),
      maxEscalationDepth: Math.min(input.requested.maxEscalationDepth, 1),
      maxWorkflowNodes: Math.min(input.requested.maxWorkflowNodes, 4),
      maxCoordinationDurationMs: Math.min(input.requested.maxCoordinationDurationMs, 10_000),
    });
  }
  return Object.freeze({ ...input.requested });
}
