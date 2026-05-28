import { readFileSync } from "node:fs";
import path from "node:path";

import { buildIntentCoordinationGovernanceRecord } from "@/services/intent-coordination-governance-core";
import type {
  CoordinationBoundaryContract,
  CoordinationState,
  CoordinationTransition,
  IntentCoordinationGovernanceInput,
  IntentCoordinationTopology,
  IntentRelationship,
} from "@/services/intent-coordination-governance-core";
import { buildConstitutionalReadinessGateFixture } from "@/tests/constitutional-autonomy-readiness-gate/helpers";

export function buildIntentCoordinationGovernanceFixture(overrides: Partial<{
  topology: IntentCoordinationTopology;
  boundaryContract: CoordinationBoundaryContract;
  metadata: Readonly<Record<string, unknown>>;
  currentState: CoordinationState;
  requestedTransition: CoordinationTransition;
}> = {}) {
  const readinessFixture = buildConstitutionalReadinessGateFixture({
    metadata: overrides.metadata,
  });

  const governanceView = readinessFixture.input.governanceView;
  const proposal = readinessFixture.input.proposal;
  const replay = readinessFixture.input.replay;

  const relationships: readonly IntentRelationship[] = Object.freeze([
    Object.freeze({
      relationshipId: "rel-001",
      parentIntentId: "intent-root",
      childIntentId: "intent-child-1",
      relationshipType: "dependency" as const,
      governanceBindings: Object.freeze([governanceView.constitutionalDecisionHash]),
      replaySafe: true as const,
      executionAuthority: false as const,
    }),
    Object.freeze({
      relationshipId: "rel-002",
      parentIntentId: "intent-child-1",
      childIntentId: "intent-child-2",
      relationshipType: "observation" as const,
      governanceBindings: Object.freeze([governanceView.constitutionalDecisionHash]),
      replaySafe: true as const,
      executionAuthority: false as const,
    }),
  ]);

  const topology: IntentCoordinationTopology = overrides.topology ?? Object.freeze({
    topologyId: "intent-coordination-topology-001",
    topologyType: "linear" as const,
    rootIntentId: "intent-root",
    nodes: Object.freeze([
      Object.freeze({
        intentId: "intent-root",
        proposalId: proposal.proposalId,
        state: overrides.currentState ?? "proposed",
        scopeBindings: Object.freeze([proposal.governanceBinding.governanceDecisionHash]),
        governanceSnapshotHash: governanceView.policy.policySnapshotHash,
        replayHash: replay.reconstructionHash,
        createdAt: "2026-05-17T00:05:00.000Z",
      }),
      Object.freeze({
        intentId: "intent-child-1",
        proposalId: proposal.proposalId,
        state: "validated" as const,
        scopeBindings: Object.freeze([proposal.governanceBinding.policySnapshotHash]),
        governanceSnapshotHash: governanceView.policy.policySnapshotHash,
        replayHash: replay.reconstructionHash,
        createdAt: "2026-05-17T00:05:01.000Z",
      }),
      Object.freeze({
        intentId: "intent-child-2",
        proposalId: proposal.proposalId,
        state: "governed" as const,
        scopeBindings: Object.freeze([proposal.governanceBinding.authorityLineageHash]),
        governanceSnapshotHash: governanceView.policy.policySnapshotHash,
        replayHash: replay.reconstructionHash,
        createdAt: "2026-05-17T00:05:02.000Z",
      }),
    ]),
    relationships,
    topologyHash: "",
    lineageHash: "",
    derivedOnly: true as const,
  });

  const boundaryContract: CoordinationBoundaryContract = overrides.boundaryContract ?? Object.freeze({
    maxRelationshipDepth: 4,
    maxRelationships: 4,
    maxEscalationEdges: 1,
    maxScopeBindings: 4,
    maxDependencyEdges: 2,
    maxContainmentDurationMs: 10_000,
  });

  const input: IntentCoordinationGovernanceInput = Object.freeze({
    coordinationId: "intent-coordination-001",
    currentState: overrides.currentState ?? "proposed",
    requestedTransition: overrides.requestedTransition ?? "validate",
    governanceView,
    readinessGate: readinessFixture.gate,
    proposal,
    boundedCoordination: readinessFixture.escalationFixture.coordinationFixture.framework,
    escalation: readinessFixture.escalationFixture.escalation,
    replay,
    topology,
    boundaryContract,
    createdAt: "2026-05-17T00:06:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    readinessFixture,
    input,
    record: buildIntentCoordinationGovernanceRecord(input),
  };
}

export function loadIntentCoordinationGovernanceSources() {
  const root = path.resolve("services", "intent-coordination-governance-core");
  return [
    "intentCoordinationGovernanceCore.ts",
    "coordinationGovernanceSchema.ts",
    "coordinationStateEngine.ts",
    "coordinationBoundaryValidator.ts",
    "coordinationRelationshipValidator.ts",
    "coordinationLifecycleValidator.ts",
    "coordinationReplayBinder.ts",
    "coordinationReplayReconstruction.ts",
    "coordinationReplayValidator.ts",
    "coordinationTopologyValidator.ts",
    "escalationGovernanceModel.ts",
    "escalationContainmentValidator.ts",
    "coordinationContainmentInspector.ts",
    "coordinationLineageLedger.ts",
    "coordinationHasher.ts",
    "coordinationSerializer.ts",
    "coordinationNormalizer.ts",
    "coordinationDriftDetector.ts",
    "coordinationGuards.ts",
    "coordinationSchemas.ts",
    "coordinationErrors.ts",
    "coordinationAuditEvents.ts",
    "coordinationTransitionValidator.ts",
    "coordinationReadinessBinder.ts",
    "coordinationDependencyValidator.ts",
    "index.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
