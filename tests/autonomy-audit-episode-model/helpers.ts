import { readFileSync } from "node:fs";
import path from "node:path";

import { buildAutonomyAuditEpisode } from "@/services/autonomy-audit-episode-model";
import type { AutonomyAuditEpisodeInput } from "@/services/autonomy-audit-episode-model";
import type { OverrideEvent } from "@/types/human-override-contract";
import type { RuntimeObservationSnapshot } from "@/types/monitoring-trigger-model";
import { buildMonitoringTriggerFixture } from "@/tests/monitoring-trigger-model/helpers";

export function buildAutonomyAuditEpisodeFixture(overrides: Partial<{
  metadata: Readonly<Record<string, unknown>>;
  runtimeObservation: RuntimeObservationSnapshot;
  confidenceScore: number;
  previousConfidenceScore: number;
  autonomyLevel: "A0" | "A1" | "A2" | "A3" | "A4" | "A5" | "A6";
  actionId: string;
  currentState: "draft" | "validated" | "governance_review" | "approved" | "denied" | "prepared_handoff" | "archived" | "revoked";
  requestedTransition: "validate" | "submit_governance_review" | "approve" | "deny" | "prepare_handoff" | "archive" | "revoke";
  events: readonly OverrideEvent[];
}> = {}) {
  const monitoringFixture = buildMonitoringTriggerFixture({
    metadata: overrides.metadata,
    runtimeObservation: overrides.runtimeObservation,
    confidenceScore: overrides.confidenceScore,
    previousConfidenceScore: overrides.previousConfidenceScore,
    autonomyLevel: overrides.autonomyLevel,
    actionId: overrides.actionId,
    currentState: overrides.currentState,
    requestedTransition: overrides.requestedTransition,
    events: overrides.events,
  });

  const input: AutonomyAuditEpisodeInput = Object.freeze({
    monitoringModel: monitoringFixture.model,
    proposal: monitoringFixture.input.proposal,
    approvalGraph: monitoringFixture.input.approvalGraph,
    overrideContract: monitoringFixture.input.overrideContract,
    governanceView: monitoringFixture.input.governanceView,
    replay: monitoringFixture.input.replay,
    generatedAt: "2026-05-16T16:20:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    monitoringFixture,
    input,
    episode: buildAutonomyAuditEpisode(input),
  };
}

export function loadAutonomyAuditEpisodeSources() {
  const root = path.resolve("services", "autonomy-audit-episode-model");
  return [
    "index.ts",
    "autonomyAuditEpisodeEngine.ts",
    "auditEpisodeLedger.ts",
    "auditEpisodeHasher.ts",
    "auditEpisodeSerializer.ts",
    "auditEpisodeNormalizer.ts",
    "observationBindingLayer.ts",
    "interpretationReconstructionEngine.ts",
    "recommendationLineageEngine.ts",
    "riskAnalysisReconstruction.ts",
    "approvalRequirementBinder.ts",
    "operatorInteractionLedger.ts",
    "outcomeReconstructionEngine.ts",
    "auditReplayBinder.ts",
    "auditEpisodeGuards.ts",
    "auditEpisodeSchemas.ts",
    "auditEpisodeErrors.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
