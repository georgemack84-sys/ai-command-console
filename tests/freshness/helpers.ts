import { readFileSync } from "node:fs";
import path from "node:path";

import { evaluateProposalFreshness } from "@/services/freshness/proposalFreshnessEngine";
import { buildLifecycleFixture } from "@/tests/lifecycle/helpers";

export function buildFreshnessFixture(overrides: Partial<{
  evaluatedAt: string;
  metadata: Readonly<Record<string, unknown>>;
  observedEnvironmentHash?: string;
}> = {}) {
  const lifecycleFixture = buildLifecycleFixture({
    currentState: "review",
    nextState: "approved",
  });

  const input = Object.freeze({
    proposal: Object.freeze({
      ...lifecycleFixture.request.proposal,
      approval: Object.freeze({
        ...lifecycleFixture.request.proposal.approval,
        valid: true,
      }),
    }),
    lifecycle: lifecycleFixture.computation,
    readinessGate: lifecycleFixture.request.readinessGate,
    escalation: lifecycleFixture.request.escalation,
    correlationComputation: lifecycleFixture.request.correlationComputation,
    evaluatedAt: overrides.evaluatedAt ?? "2026-05-17T06:10:00.000Z",
    observedEnvironmentHash: overrides.observedEnvironmentHash,
    metadata: overrides.metadata,
  });

  return {
    lifecycleFixture,
    input,
    evaluation: evaluateProposalFreshness(input),
  };
}

export function loadFreshnessSources() {
  const files = [
    path.resolve("services", "freshness", "proposalFreshnessEngine.ts"),
    path.resolve("services", "freshness", "freshnessWindowManager.ts"),
    path.resolve("services", "freshness", "freshnessPolicyResolver.ts"),
    path.resolve("services", "freshness", "freshnessRevalidationCoordinator.ts"),
    path.resolve("services", "freshness", "freshnessAuditLineage.ts"),
    path.resolve("services", "freshness", "freshnessAppendOnlyLedger.ts"),
    path.resolve("services", "freshness", "freshnessGuards.ts"),
    path.resolve("services", "drift", "coordinationDriftDetector.ts"),
    path.resolve("services", "drift", "telemetryDriftAnalyzer.ts"),
    path.resolve("services", "drift", "governanceDriftMonitor.ts"),
    path.resolve("services", "drift", "environmentDriftEvaluator.ts"),
    path.resolve("services", "drift", "replayMismatchDetector.ts"),
    path.resolve("services", "drift", "policyDriftAnalyzer.ts"),
    path.resolve("services", "drift", "driftDeterminismInspector.ts"),
    path.resolve("services", "classification", "staleIntentClassifier.ts"),
    path.resolve("services", "classification", "coordinationRiskClassifier.ts"),
    path.resolve("services", "classification", "freshnessSeverityResolver.ts"),
    path.resolve("services", "revalidation", "replayRevalidationEngine.ts"),
    path.resolve("services", "revalidation", "deterministicReplayVerifier.ts"),
    path.resolve("services", "revalidation", "lineageConsistencyValidator.ts"),
    path.resolve("services", "revalidation", "integrityCheckpointEvaluator.ts"),
    path.resolve("services", "freeze", "coordinationFreezeEngine.ts"),
    path.resolve("services", "freeze", "freezeEscalationCoordinator.ts"),
    path.resolve("services", "freeze", "unsafeCoordinationBlocker.ts"),
    path.resolve("services", "freeze", "freezeContainmentValidator.ts"),
  ];
  return files.map((file) => ({ path: file, content: readFileSync(file, "utf8") }));
}
