import { readFileSync } from "node:fs";
import path from "node:path";

import { buildMissionCoordinationGraph } from "@/services/mission-graph/missionCoordinationGraphEngine";
import { buildGovernanceAwareEscalationFixture } from "@/tests/escalation/helpers";

export function buildMissionGraphFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
}> = {}) {
  const escalationFixture = buildGovernanceAwareEscalationFixture({
    createdAt: overrides.createdAt,
  });
  const freshnessFixture = escalationFixture.freshnessFixture;
  const freshnessEvaluation = Object.freeze({
    ...freshnessFixture.evaluation,
    state: Object.freeze({
      ...freshnessFixture.evaluation.state,
      freshnessStatus: "fresh" as const,
      replayIntegrity: "verified" as const,
      governanceCompatibility: "compatible" as const,
    }),
    replayRevalidation: Object.freeze({
      ...freshnessFixture.evaluation.replayRevalidation,
      replayIntegrity: "verified" as const,
      replaySafe: true,
    }),
    errors: Object.freeze([]),
  });
  const escalationRecord = Object.freeze({
    ...escalationFixture.record,
    decision: Object.freeze({
      ...escalationFixture.record.decision,
      governanceValidated: true,
      replaySafe: true,
    }),
    errors: Object.freeze([]),
  });
  const input = Object.freeze({
    missionId: freshnessFixture.input.proposal.missionId,
    proposal: freshnessFixture.input.proposal,
    lifecycle: freshnessFixture.lifecycleFixture.computation,
    freshnessEvaluation,
    escalationRecord,
    correlationComputation: freshnessFixture.input.correlationComputation,
    coordinationRecord: freshnessFixture.lifecycleFixture.request.coordinationRecord,
    createdAt: overrides.createdAt ?? "2026-05-17T08:00:00.000Z",
    metadata: overrides.metadata,
  });
  return {
    escalationFixture,
    freshnessFixture,
    input,
    snapshot: buildMissionCoordinationGraph(input),
  };
}

export function loadMissionGraphSources() {
  const files = [
    path.resolve("services", "mission-graph", "missionCoordinationGraphEngine.ts"),
    path.resolve("services", "mission-graph", "proposalLineageTracer.ts"),
    path.resolve("services", "mission-graph", "escalationLineageTracer.ts"),
    path.resolve("services", "mission-graph", "governanceDependencyGraph.ts"),
    path.resolve("services", "mission-graph", "confidenceEvolutionEngine.ts"),
    path.resolve("services", "mission-graph", "replayPathInspector.ts"),
    path.resolve("services", "mission-graph", "lifecycleTopologyEngine.ts"),
    path.resolve("services", "mission-graph", "snapshotLineageReconstructor.ts"),
    path.resolve("services", "mission-graph", "graphConsistencyValidator.ts"),
    path.resolve("services", "mission-graph", "graphNormalizer.ts"),
    path.resolve("services", "mission-graph", "graphSerializer.ts"),
    path.resolve("services", "mission-graph", "graphHasher.ts"),
    path.resolve("services", "mission-graph", "graphAppendOnlyLedger.ts"),
    path.resolve("services", "mission-graph", "graphDeterminismInspector.ts"),
  ];
  return files.map((file) => ({ path: file, content: readFileSync(file, "utf8") }));
}
