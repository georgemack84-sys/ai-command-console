import { readFileSync } from "node:fs";
import path from "node:path";

import { buildGovernanceAwareEscalationRecord } from "@/services/escalation/escalationCoordinationEngine";
import { buildFreshnessFixture } from "@/tests/freshness/helpers";

export function buildGovernanceAwareEscalationFixture(overrides: Partial<{
  createdAt: string;
  metadata: Readonly<Record<string, unknown>>;
}> = {}) {
  const freshnessFixture = buildFreshnessFixture();
  const input = Object.freeze({
    coordinationId: freshnessFixture.lifecycleFixture.request.coordinationRecord.coordinationId,
    freshnessEvaluation: freshnessFixture.evaluation,
    lifecycle: freshnessFixture.lifecycleFixture.computation,
    readinessGate: freshnessFixture.input.readinessGate,
    proposal: freshnessFixture.input.proposal,
    correlationComputation: freshnessFixture.input.correlationComputation,
    coordinationRecord: freshnessFixture.lifecycleFixture.request.coordinationRecord,
    createdAt: overrides.createdAt ?? "2026-05-17T07:00:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    freshnessFixture,
    input,
    record: buildGovernanceAwareEscalationRecord(input),
  };
}

export function loadEscalationSources() {
  const files = [
    path.resolve("services", "escalation", "escalationCoordinationEngine.ts"),
    path.resolve("services", "escalation", "escalationDecisionEngine.ts"),
    path.resolve("services", "escalation", "escalationPropagationManager.ts"),
    path.resolve("services", "escalation", "escalationContainmentEngine.ts"),
    path.resolve("services", "escalation", "escalationLineageBuilder.ts"),
    path.resolve("services", "escalation", "escalationReplayCoordinator.ts"),
    path.resolve("services", "escalation", "escalationGovernanceValidator.ts"),
    path.resolve("services", "escalation", "escalationBoundaryEnforcer.ts"),
    path.resolve("services", "escalation", "escalationNormalizer.ts"),
    path.resolve("services", "escalation", "escalationSerializer.ts"),
    path.resolve("services", "escalation", "escalationHasher.ts"),
    path.resolve("services", "escalation", "escalationAppendOnlyLedger.ts"),
    path.resolve("services", "escalation", "escalationDeterminismInspector.ts"),
    path.resolve("services", "confidence", "confidenceRiskModel.ts"),
    path.resolve("services", "confidence", "confidenceStatePersistence.ts"),
    path.resolve("services", "confidence", "uncertaintyStateCoordinator.ts"),
    path.resolve("services", "confidence", "riskEscalationMapper.ts"),
    path.resolve("services", "freeze", "freezeRecommendationEngine.ts"),
    path.resolve("services", "freeze", "freezePropagationCoordinator.ts"),
    path.resolve("services", "freeze", "coordinationFreezeValidator.ts"),
    path.resolve("services", "pause", "pausePropagationModel.ts"),
    path.resolve("services", "pause", "pauseContainmentCoordinator.ts"),
    path.resolve("services", "pause", "boundedPauseManager.ts"),
    path.resolve("services", "replay", "escalationReplayGraph.ts"),
    path.resolve("services", "replay", "escalationTimelineBuilder.ts"),
    path.resolve("services", "replay", "escalationStateReconstructor.ts"),
  ];
  return files.map((file) => ({ path: file, content: readFileSync(file, "utf8") }));
}
