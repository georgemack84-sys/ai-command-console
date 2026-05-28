import { readFileSync } from "node:fs";
import path from "node:path";

import { buildMonitoringTriggerModel } from "@/services/monitoring-trigger-model";
import type { MonitoringTriggerEngineInput } from "@/services/monitoring-trigger-model";
import type { OverrideEvent } from "@/types/human-override-contract";
import type { RuntimeObservationSnapshot } from "@/types/monitoring-trigger-model";
import { buildOverrideFixture } from "@/tests/human-override-contract/helpers";

export function buildMonitoringTriggerFixture(overrides: Partial<{
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
  const overrideFixture = buildOverrideFixture({
    metadata: overrides.metadata,
    autonomyLevel: overrides.autonomyLevel,
    actionId: overrides.actionId,
    currentState: overrides.currentState,
    requestedTransition: overrides.requestedTransition,
    events: overrides.events,
  });

  const input: MonitoringTriggerEngineInput = Object.freeze({
    proposal: overrideFixture.input.proposal,
    approvalGraph: overrideFixture.input.approvalGraph,
    overrideContract: overrideFixture.contract,
    governanceView: overrideFixture.input.governanceView,
    replay: overrideFixture.input.replay,
    generatedAt: "2026-05-16T16:15:00.000Z",
    confidenceScore: overrides.confidenceScore ?? 0.82,
    previousConfidenceScore: overrides.previousConfidenceScore ?? 0.91,
    runtimeObservation: overrides.runtimeObservation,
    metadata: overrides.metadata,
  });

  return {
    overrideFixture,
    input,
    model: buildMonitoringTriggerModel(input),
  };
}

export function loadMonitoringTriggerSources() {
  const root = path.resolve("services", "monitoring-trigger-model");
  return [
    "index.ts",
    "monitoringTriggerEngine.ts",
    "triggerLedger.ts",
    "triggerDeriver.ts",
    "triggerCorrelationEngine.ts",
    "confidenceEscalator.ts",
    "driftTriggerEngine.ts",
    "replayTriggerEngine.ts",
    "governanceTriggerEngine.ts",
    "runtimeTriggerObserver.ts",
    "freezeRecommendationEngine.ts",
    "triggerReplayBinder.ts",
    "triggerHasher.ts",
    "triggerSerializer.ts",
    "triggerNormalizer.ts",
    "triggerGuards.ts",
    "triggerSchemas.ts",
    "triggerErrors.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
