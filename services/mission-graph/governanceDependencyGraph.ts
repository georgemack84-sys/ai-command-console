import type { GovernanceDependency, MissionGraphEdge, MissionGraphNode } from "@/types/mission-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { ProposalFreshnessEvaluation } from "@/services/freshness/proposalFreshnessEngine";
import { hashMissionGraphValue } from "./graphHasher";

function buildNodeId(nodeType: MissionGraphNode["nodeType"], missionId: string, sourceReferenceId: string): string {
  return hashMissionGraphValue("mission-graph-node", { nodeType, missionId, sourceReferenceId });
}

function buildEdgeId(sourceNodeId: string, targetNodeId: string, relationshipType: MissionGraphEdge["relationshipType"]): string {
  return hashMissionGraphValue("mission-graph-edge", { sourceNodeId, targetNodeId, relationshipType });
}

export function buildGovernanceDependencyGraph(input: {
  missionId: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  freshnessEvaluation: ProposalFreshnessEvaluation;
  escalationRecord: GovernanceAwareEscalationRecord;
  createdAt: string;
}): Readonly<{
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
  dependencies: readonly GovernanceDependency[];
}> {
  const governanceNodeId = buildNodeId("governance", input.missionId, input.proposal.governanceBinding.policySnapshotHash);
  const validationNodeId = buildNodeId("validation", input.missionId, input.freshnessEvaluation.replayRevalidation.revalidationHash);
  const proposalNodeId = buildNodeId("proposal", input.missionId, input.proposal.proposalId);
  const escalationNodeId = buildNodeId("escalation", input.missionId, input.escalationRecord.decision.escalationId);
  const nodes = Object.freeze([
    Object.freeze({
      nodeId: governanceNodeId,
      nodeType: "governance" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.proposal.governanceBinding.policySnapshotHash,
    }),
    Object.freeze({
      nodeId: validationNodeId,
      nodeType: "validation" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.freshnessEvaluation.replayRevalidation.revalidationHash,
    }),
  ]);
  const edges = Object.freeze([
    Object.freeze({
      edgeId: buildEdgeId(proposalNodeId, governanceNodeId, "validated_by"),
      sourceNodeId: proposalNodeId,
      targetNodeId: governanceNodeId,
      relationshipType: "validated_by" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
    Object.freeze({
      edgeId: buildEdgeId(escalationNodeId, governanceNodeId, "validated_by"),
      sourceNodeId: escalationNodeId,
      targetNodeId: governanceNodeId,
      relationshipType: "validated_by" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
    Object.freeze({
      edgeId: buildEdgeId(validationNodeId, governanceNodeId, "validated_by"),
      sourceNodeId: validationNodeId,
      targetNodeId: governanceNodeId,
      relationshipType: "validated_by" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
  ]);
  const dependencies = Object.freeze([
    Object.freeze({
      dependencyId: hashMissionGraphValue("governance-dependency", {
        governanceNodeId,
        dependentNodeId: proposalNodeId,
      }),
      governanceNodeId,
      dependentNodeId: proposalNodeId,
      governanceSnapshotHash: input.lifecycle.record.replayBinding.governanceSnapshotHash,
      replaySafe: true as const,
      createdAt: input.createdAt,
      dependencyHash: hashMissionGraphValue("governance-dependency-hash", {
        governanceNodeId,
        dependentNodeId: proposalNodeId,
        policySnapshotHash: input.proposal.governanceBinding.policySnapshotHash,
      }),
    }),
    Object.freeze({
      dependencyId: hashMissionGraphValue("governance-dependency", {
        governanceNodeId,
        dependentNodeId: escalationNodeId,
      }),
      governanceNodeId,
      dependentNodeId: escalationNodeId,
      governanceSnapshotHash: input.lifecycle.record.replayBinding.governanceSnapshotHash,
      replaySafe: true as const,
      createdAt: input.createdAt,
      dependencyHash: hashMissionGraphValue("governance-dependency-hash", {
        governanceNodeId,
        dependentNodeId: escalationNodeId,
        policySnapshotHash: input.proposal.governanceBinding.policySnapshotHash,
      }),
    }),
  ]);
  return Object.freeze({ nodes, edges, dependencies });
}
