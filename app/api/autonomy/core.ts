import {
  buildConstitutionalGovernanceSeed,
  buildConstitutionalGovernanceView,
} from "@/services/constitutional-governance-layer";
import { deriveAutonomyReadinessProfile } from "@/services/autonomy-readiness";
import { deriveSafeActionProfile } from "@/services/safe-action-catalog";
import { buildProposalLifecycleRecord } from "@/services/proposal-lifecycle-engine";
import { buildApprovalDependencyGraph } from "@/services/approval-dependency-graph";
import { buildOverrideContract } from "@/services/human-override-contract";
import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import { buildAutonomyAuditEpisode } from "@/services/autonomy-audit-episode-model";
import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildConstitutionalEscalation } from "@/services/constitutional-escalation-layer";
import { buildConstitutionalAutonomyReadinessGate } from "@/services/constitutional-autonomy-readiness-gate";
import type { OverrideEvent } from "@/types/human-override-contract";

export function readExecutionId(request: Request) {
  const url = new URL(request.url);
  return String(url.searchParams.get("executionId") || url.searchParams.get("planId") || "mission-execution-001").trim();
}

export function buildAutonomyReadinessApiModel(executionId: string) {
  const generatedAt = "2026-05-16T20:00:00.000Z";
  const governanceInput = buildConstitutionalGovernanceSeed({
    executionId,
    autonomyLevel: "A1",
  });
  const governanceView = buildConstitutionalGovernanceView(governanceInput);
  const readinessProfile = deriveAutonomyReadinessProfile({
    missionId: governanceInput.missionId,
    executionId,
    generatedAt,
    governanceView,
    source: governanceInput,
  });
  const safeActionProfile = deriveSafeActionProfile({
    readinessProfile,
    actionId: "safe-action:recommend",
  });
  const proposal = buildProposalLifecycleRecord({
    proposalId: `proposal:${executionId}`,
    missionId: governanceInput.missionId,
    executionId,
    createdAt: "2026-05-16T19:55:00.000Z",
    updatedAt: generatedAt,
    title: "Constitutional readiness proposal",
    summary: "Derived-only readiness certification proposal.",
    currentState: "approved",
    requestedTransition: "prepare_handoff",
    readinessProfile,
    safeActionProfile,
    governanceView,
    replay: governanceInput.replay,
    snapshots: governanceInput.snapshots,
    approval: Object.freeze({
      approvalId: `approval:${executionId}`,
      status: "approved" as const,
      explicit: true,
      approvers: Object.freeze(["operator-01"]),
      approvedAt: "2026-05-16T19:56:00.000Z",
      expiresAt: "2026-06-16T19:56:00.000Z",
      scopeHash: governanceView.policy.approvalLineageHash,
      governanceDecisionHash: governanceView.constitutionalDecisionHash,
      valid: true,
    }),
    revocation: Object.freeze({
      revocationId: `revocation:${executionId}`,
      status: "active" as const,
      revokedBy: Object.freeze([]),
      replayLineageHash: governanceInput.replay.lineage.replayBindingHash,
      immutable: true as const,
    }),
  });
  const approvalGraph = buildApprovalDependencyGraph({
    proposal,
    governanceView,
    replay: governanceInput.replay,
    snapshots: governanceInput.snapshots,
    generatedAt,
  });
  const overrideEvents: readonly OverrideEvent[] = Object.freeze([
    Object.freeze({
      overrideId: `override:${executionId}:pause`,
      timestamp: "2026-05-16T19:57:00.000Z",
      operatorId: "operator-01",
      operatorRole: "constitutional-operator",
      overrideType: "pause",
      targetType: "proposal",
      targetId: proposal.proposalId,
      reasonCode: "manual_review",
      justification: "Operator paused proposal for bounded review.",
      authoritySnapshotHash: proposal.governanceBinding.authorityLineageHash,
      governanceSnapshotHash: proposal.governanceBinding.policySnapshotHash,
      approvalGraphHash: approvalGraph.graphHash,
      createdAt: "2026-05-16T19:57:00.000Z",
    }),
    Object.freeze({
      overrideId: `override:${executionId}:resume`,
      timestamp: "2026-05-16T19:58:00.000Z",
      operatorId: "operator-01",
      operatorRole: "constitutional-operator",
      overrideType: "resume",
      targetType: "proposal",
      targetId: proposal.proposalId,
      reasonCode: "review_complete",
      justification: "Operator resumed after constitutional review.",
      authoritySnapshotHash: proposal.governanceBinding.authorityLineageHash,
      governanceSnapshotHash: proposal.governanceBinding.policySnapshotHash,
      approvalGraphHash: approvalGraph.graphHash,
      parentOverrideId: `override:${executionId}:pause`,
      createdAt: "2026-05-16T19:58:00.000Z",
    }),
  ]);
  const overrideContract = buildOverrideContract({
    events: overrideEvents,
    proposal,
    approvalGraph,
    governanceView,
    replay: governanceInput.replay,
  });
  const monitoringModel = buildMonitoringTriggerModel({
    proposal,
    approvalGraph,
    overrideContract,
    governanceView,
    replay: governanceInput.replay,
    generatedAt,
    confidenceScore: 0.96,
    previousConfidenceScore: 0.96,
    runtimeObservation: Object.freeze({
      heartbeatState: "healthy" as const,
      leaseState: "stable" as const,
      queueDepth: 0,
      retryRate: 0,
      telemetryTimestamp: generatedAt,
    }),
  });
  const auditEpisode = buildAutonomyAuditEpisode({
    monitoringModel,
    proposal,
    approvalGraph,
    overrideContract,
    governanceView,
    replay: governanceInput.replay,
    generatedAt,
  });
  const authorityBoundaryId = governanceView.authorityBoundaries[0]?.authorityId ?? "authority:replay";
  const coordinationFramework = buildBoundedCoordinationFramework({
    graph: Object.freeze({
      graphId: `coordination:${executionId}`,
      topologyType: "linear" as const,
      rootNodeId: "coord-root",
      nodes: Object.freeze([
        Object.freeze({
          nodeId: "coord-root",
          topologyType: "linear" as const,
          authorityBoundaryId,
          governanceSnapshotId: governanceView.policy.policySnapshotHash,
          replayHash: governanceInput.replay.reconstructionHash,
          createdAt: "2026-05-16T19:59:00.000Z",
          delegatedNodeIds: Object.freeze(["coord-child-1"]),
          escalationDepth: 0,
          estimatedDurationMs: 500,
        }),
        Object.freeze({
          nodeId: "coord-child-1",
          parentNodeId: "coord-root",
          topologyType: "linear" as const,
          authorityBoundaryId,
          governanceSnapshotId: governanceView.policy.policySnapshotHash,
          replayHash: governanceInput.replay.reconstructionHash,
          createdAt: "2026-05-16T19:59:01.000Z",
          delegatedNodeIds: Object.freeze([]),
          escalationDepth: 0,
          estimatedDurationMs: 500,
        }),
      ]),
      graphHash: "",
      lineageHash: "",
      derivedOnly: true as const,
    }),
    requestedCeiling: Object.freeze({
      maxDepth: 3,
      maxBranchFactor: 2,
      maxDelegations: 3,
      maxEscalationDepth: 1,
      maxWorkflowNodes: 4,
      maxCoordinationDurationMs: 10_000,
    }),
    auditEpisode,
    governanceView,
    overrideContract,
    replay: governanceInput.replay,
    generatedAt,
  });
  const escalation = buildConstitutionalEscalation({
    monitoringModel,
    auditEpisode,
    coordinationFramework,
    governanceView,
    overrideContract,
    replay: governanceInput.replay,
    generatedAt,
  });
  const readinessGate = buildConstitutionalAutonomyReadinessGate({
    governanceView,
    readinessProfile,
    safeActionProfile,
    proposal,
    approvalGraph,
    overrideContract,
    monitoringModel,
    auditEpisode,
    coordinationFramework,
    escalation,
    replay: governanceInput.replay,
    generatedAt,
  });

  return Object.freeze({
    governanceInput,
    governanceView,
    readinessProfile,
    safeActionProfile,
    proposal,
    approvalGraph,
    overrideContract,
    monitoringModel,
    auditEpisode,
    coordinationFramework,
    escalation,
    readinessGate,
  });
}
