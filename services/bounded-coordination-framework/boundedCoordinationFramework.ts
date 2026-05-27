import type {
  BoundedCoordinationFrameworkRecord,
  CoordinationCeiling,
  CoordinationFrameworkError,
  CoordinationTopologyGraph,
} from "@/types/bounded-coordination-framework";
import type { AutonomyAuditEpisode } from "@/types/autonomy-audit-episode-model";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { validateCoordinationTopologySchema, validateCoordinationNode } from "./coordinationTopologySchemas";
import { deriveEffectiveCoordinationCeiling } from "./coordinationCeilingEngine";
import { validateCoordinationTopology } from "./coordinationTopologyValidator";
import { validateDelegationBoundaries } from "./delegationBoundaryValidator";
import { bindOrchestrationIsolation } from "./orchestrationIsolationBinder";
import { bindCoordinationReplay } from "./coordinationReplayBinder";
import { deriveCoordinationContainment } from "./coordinationContainmentEngine";
import { appendCoordinationLineage } from "./coordinationLineageLedger";
import { guardCoordinationContainmentInput } from "./coordinationContainmentGuards";
import { hashCoordinationValue } from "./coordinationGraphHasher";

export type BoundedCoordinationFrameworkInput = Readonly<{
  graph: CoordinationTopologyGraph;
  requestedCeiling: CoordinationCeiling;
  auditEpisode: AutonomyAuditEpisode;
  governanceView: ConstitutionalGovernanceView;
  overrideContract: OverrideContractRecord;
  replay: ReplayReconstructionResult;
  generatedAt: string;
  existingLineage?: import("@/types/bounded-coordination-framework").CoordinationLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export function buildBoundedCoordinationFramework(input: BoundedCoordinationFrameworkInput): BoundedCoordinationFrameworkRecord {
  const schemaErrors = [
    ...validateCoordinationTopologySchema(input.graph),
    ...input.graph.nodes.flatMap((node) => validateCoordinationNode(node)),
  ];
  const guardErrors = guardCoordinationContainmentInput({
    auditEpisode: input.auditEpisode,
    governanceView: input.governanceView,
    overrideContract: input.overrideContract,
    metadata: input.metadata,
  });
  const effectiveCeiling = deriveEffectiveCoordinationCeiling({
    requested: input.requestedCeiling,
    auditEpisode: input.auditEpisode,
  });
  const topologyResult = validateCoordinationTopology({
    graph: input.graph,
    ceiling: effectiveCeiling,
  });
  const boundaryResult = validateDelegationBoundaries({
    graph: input.graph,
    ceiling: effectiveCeiling,
  });
  const isolationResult = bindOrchestrationIsolation({
    graph: input.graph,
    governanceView: input.governanceView,
    overrideContract: input.overrideContract,
    createdAt: input.generatedAt,
  });
  const replayResult = bindCoordinationReplay({
    graph: input.graph,
    auditEpisode: input.auditEpisode,
    governanceView: input.governanceView,
    overrideContract: input.overrideContract,
    replay: input.replay,
  });
  const containmentResult = deriveCoordinationContainment({
    effectiveCeiling,
    boundaries: boundaryResult.boundaries,
    isolation: isolationResult.isolation,
    auditEpisode: input.auditEpisode,
    createdAt: input.generatedAt,
  });
  const errors: CoordinationFrameworkError[] = [
    ...schemaErrors,
    ...guardErrors,
    ...topologyResult.errors,
    ...boundaryResult.errors,
    ...isolationResult.errors,
    ...replayResult.errors,
    ...containmentResult.errors,
  ];

  const lineageHash = hashCoordinationValue("coordination-lineage-hash", {
    graph: input.graph.nodes,
    auditEpisodeHash: input.auditEpisode.episodeHash,
    overrideLineage: input.overrideContract.lineage.entries,
    replayHash: input.replay.reconstructionHash,
  });
  const graphHash = hashCoordinationValue("coordination-topology-graph", {
    graph: input.graph,
    effectiveCeiling,
    topologyStats: topologyResult.stats,
    boundaries: boundaryResult.boundaries,
    isolation: isolationResult.isolation,
    replay: replayResult.replayBinding,
    containment: containmentResult.containment,
    errors,
  });
  const lineage = appendCoordinationLineage({
    existing: input.existingLineage,
    graphId: input.graph.graphId,
    graphHash,
    replayHash: replayResult.replayBinding.reconstructionHash,
    lineageHash,
    createdAt: input.generatedAt,
  });

  const topology = Object.freeze({
    ...input.graph,
    graphHash,
    lineageHash,
    derivedOnly: true as const,
  });

  return Object.freeze({
    frameworkId: hashCoordinationValue("bounded-coordination-framework-id", {
      graphId: input.graph.graphId,
      generatedAt: input.generatedAt,
      lineageHash,
    }),
    topology,
    effectiveCeiling,
    containment: containmentResult.containment,
    isolation: isolationResult.isolation,
    replayBinding: replayResult.replayBinding,
    lineage,
    warnings: Object.freeze([
      ...input.auditEpisode.warnings,
      ...(input.auditEpisode.observation.cautionState === "frozen-recommended"
        ? ["Coordination topology remains structurally frozen by constitutional recommendation only."]
        : []),
    ]),
    errors: Object.freeze(errors),
    frameworkHash: hashCoordinationValue("bounded-coordination-framework", {
      topology,
      effectiveCeiling,
      containment: containmentResult.containment,
      isolation: isolationResult.isolation,
      replayBinding: replayResult.replayBinding,
      lineage,
      errors,
    }),
    derivedOnly: true,
  });
}
