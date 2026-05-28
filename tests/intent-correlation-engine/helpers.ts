import { readFileSync } from "node:fs";
import path from "node:path";

import { correlateIntentProposals } from "@/services/intent-correlation-engine";
import type { CorrelateIntentProposalsInput } from "@/services/intent-correlation-engine/correlationTypes";
import type { IntentCoordinationGovernanceRecord, IntentCoordinationTopology } from "@/types/intent-coordination-governance-core";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ApprovalDependencyGraph } from "@/types/approval-dependency-graph";
import type { ConstitutionalAutonomyReadinessGateRecord } from "@/services/constitutional-autonomy-readiness-gate";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import { buildIntentCoordinationGovernanceFixture } from "@/tests/intent-coordination-governance-core/helpers";

function cloneProposal(base: ProposalRecord, proposalId: string, title: string): ProposalRecord {
  return Object.freeze({
    ...base,
    proposalId,
    title,
    summary: `${title} summary`,
  });
}

function cloneApprovalGraph(base: ApprovalDependencyGraph, proposalId: string): ApprovalDependencyGraph {
  return Object.freeze({
    ...base,
    proposalId,
    nodes: Object.freeze(base.nodes.map((node) => Object.freeze({ ...node, proposalId }))),
  });
}

function cloneReadinessGate(base: ConstitutionalAutonomyReadinessGateRecord, proposalId: string): ConstitutionalAutonomyReadinessGateRecord {
  return Object.freeze({
    ...base,
    proposalView: Object.freeze({
      ...base.proposalView,
      proposalId,
    }),
  });
}

function cloneEscalation(base: ConstitutionalEscalationRecord, escalationId: string): ConstitutionalEscalationRecord {
  return Object.freeze({
    ...base,
    recommendation: Object.freeze({
      ...base.recommendation,
      escalationId,
    }),
  });
}

function buildTopology(base: IntentCoordinationGovernanceRecord, proposalIds: readonly string[]): IntentCoordinationTopology {
  return Object.freeze({
    ...base.topology,
    rootIntentId: "intent-a",
    nodes: Object.freeze([
      Object.freeze({
        ...base.topology.nodes[0]!,
        intentId: "intent-a",
        proposalId: proposalIds[0]!,
      }),
      Object.freeze({
        ...base.topology.nodes[1]!,
        intentId: "intent-b",
        proposalId: proposalIds[1]!,
      }),
      Object.freeze({
        ...base.topology.nodes[2]!,
        intentId: "intent-c",
        proposalId: proposalIds[2]!,
      }),
    ]),
    relationships: Object.freeze([
      Object.freeze({
        relationshipId: "rel-a-b",
        parentIntentId: "intent-a",
        childIntentId: "intent-b",
        relationshipType: "dependency" as const,
        governanceBindings: base.topology.relationships[0]!.governanceBindings,
        replaySafe: true as const,
        executionAuthority: false as const,
      }),
      Object.freeze({
        relationshipId: "rel-b-c",
        parentIntentId: "intent-b",
        childIntentId: "intent-c",
        relationshipType: "observation" as const,
        governanceBindings: base.topology.relationships[0]!.governanceBindings,
        replaySafe: true as const,
        executionAuthority: false as const,
      }),
    ]),
    topologyHash: "",
    lineageHash: "",
    derivedOnly: true as const,
  });
}

export function buildIntentCorrelationFixture(overrides: Partial<{
  metadata: Readonly<Record<string, unknown>>;
  topology: IntentCoordinationTopology;
}> = {}) {
  const base = buildIntentCoordinationGovernanceFixture();
  const proposalA = cloneProposal(base.input.proposal, "proposal-a", "Proposal A");
  const proposalB = cloneProposal(base.input.proposal, "proposal-b", "Proposal B");
  const proposalC = cloneProposal(base.input.proposal, "proposal-c", "Proposal C");

  const approvalA = cloneApprovalGraph(base.readinessFixture.input.approvalGraph, "proposal-a");
  const approvalB = cloneApprovalGraph(base.readinessFixture.input.approvalGraph, "proposal-b");
  const approvalC = cloneApprovalGraph(base.readinessFixture.input.approvalGraph, "proposal-c");

  const readinessA = cloneReadinessGate(base.input.readinessGate, "proposal-a");
  const readinessB = cloneReadinessGate(base.input.readinessGate, "proposal-b");
  const readinessC = cloneReadinessGate(base.input.readinessGate, "proposal-c");

  const escalationA = cloneEscalation(base.input.escalation, "escalation-a");
  const escalationB = cloneEscalation(base.input.escalation, "escalation-b");
  const escalationC = cloneEscalation(base.input.escalation, "escalation-c");

  const topology = overrides.topology ?? buildTopology(base.record, Object.freeze([proposalA.proposalId, proposalB.proposalId, proposalC.proposalId]));

  const coordinationRecord: IntentCoordinationGovernanceRecord = Object.freeze({
    ...base.record,
    topology,
  });

  const input: CorrelateIntentProposalsInput = Object.freeze({
    coordinationRecords: Object.freeze([coordinationRecord]),
    proposals: Object.freeze([proposalA, proposalB, proposalC]),
    approvalGraphs: Object.freeze([approvalA, approvalB, approvalC]),
    readinessGates: Object.freeze([readinessA, readinessB, readinessC]),
    escalations: Object.freeze([escalationA, escalationB, escalationC]),
    createdAt: "2026-05-17T04:00:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    base,
    input,
    computation: correlateIntentProposals(input),
  };
}

export function loadIntentCorrelationSources() {
  const root = path.resolve("services", "intent-correlation-engine");
  return [
    "intentCorrelationEngine.ts",
    "correlationSchemas.ts",
    "correlationTypes.ts",
    "proposalRelationshipMapper.ts",
    "recommendationClusterModel.ts",
    "confidenceLineageGraph.ts",
    "escalationCorrelationGraph.ts",
    "approvalRelationshipTracker.ts",
    "correlationReplayBinder.ts",
    "correlationReplayReconstruction.ts",
    "correlationReplayView.ts",
    "correlationContainmentValidator.ts",
    "correlationTopologyInspector.ts",
    "correlationDeterminismValidator.ts",
    "correlationBoundaryGuards.ts",
    "correlationLineageLedger.ts",
    "correlationNormalizer.ts",
    "correlationSerializer.ts",
    "correlationHasher.ts",
    "correlationAuditEvents.ts",
    "correlationErrors.ts",
    "index.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
