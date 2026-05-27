import { readFileSync } from "node:fs";
import path from "node:path";

import { enforceCoordinationContainment } from "@/services/coordination-containment/coordinationContainmentEngine";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";
import { enforceHumanSupremacy } from "@/services/human-supremacy/humanSupremacyEngine";

export function buildContainmentFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
}> = {}) {
  const missionFixture = buildMissionGraphFixture({
    createdAt: overrides.createdAt,
  });
  const humanSupremacyRecord = enforceHumanSupremacy(Object.freeze({
    coordinationId: missionFixture.input.coordinationRecord.coordinationId,
    operatorId: "operator-1",
    action: "inspect_replay_lineage" as const,
    overrideType: "replay" as const,
    reason: "Operator inspection only.",
    proposal: missionFixture.input.proposal,
    lifecycle: missionFixture.input.lifecycle,
    freshnessEvaluation: missionFixture.input.freshnessEvaluation,
    escalationRecord: missionFixture.input.escalationRecord,
    missionGraph: missionFixture.snapshot,
    createdAt: overrides.createdAt ?? "2026-05-17T10:00:00.000Z",
  }));
  const input = Object.freeze({
    coordinationId: missionFixture.input.coordinationRecord.coordinationId,
    missionGraph: missionFixture.snapshot,
    escalationRecord: missionFixture.input.escalationRecord,
    humanSupremacyRecord,
    lifecycle: missionFixture.input.lifecycle,
    freshnessEvaluation: missionFixture.input.freshnessEvaluation,
    createdAt: overrides.createdAt ?? "2026-05-17T10:00:00.000Z",
    metadata: overrides.metadata,
  });
  return {
    missionFixture,
    humanSupremacyRecord,
    input,
    record: enforceCoordinationContainment(input),
  };
}

export function loadContainmentSources() {
  const files = [
    path.resolve("services", "coordination-containment", "antiEmergenceValidator.ts"),
    path.resolve("services", "coordination-containment", "hiddenOrchestrationDetector.ts"),
    path.resolve("services", "coordination-containment", "recursiveLoopClassifier.ts"),
    path.resolve("services", "coordination-containment", "authorityExpansionDetector.ts"),
    path.resolve("services", "coordination-containment", "runtimeMutationBlocker.ts"),
    path.resolve("services", "coordination-containment", "coordinationContainmentEngine.ts"),
    path.resolve("services", "coordination-containment", "orchestrationBoundaryEnforcer.ts"),
    path.resolve("services", "coordination-containment", "replayContainmentValidator.ts"),
    path.resolve("services", "coordination-containment", "containmentFreezeManager.ts"),
    path.resolve("services", "coordination-containment", "containmentLedger.ts"),
    path.resolve("services", "coordination-containment", "containmentReplayBuilder.ts"),
    path.resolve("services", "coordination-containment", "containmentHasher.ts"),
    path.resolve("services", "coordination-containment", "containmentSerializer.ts"),
    path.resolve("services", "coordination-containment", "containmentNormalizer.ts"),
  ];
  return files.map((file) => ({ path: file, content: readFileSync(file, "utf8") }));
}
