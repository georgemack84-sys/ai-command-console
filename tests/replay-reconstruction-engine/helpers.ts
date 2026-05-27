import { readFileSync } from "node:fs";
import path from "node:path";

import {
  bindReplayRuntime,
  buildReplayReconstruction,
  classifyReplayDrift,
  projectReplayComparison,
  projectReplayIntegrity,
  projectReplayLineage,
} from "@/services/replay-reconstruction-engine";
import { buildPolicyDecisionFixture } from "@/tests/policy-decision-explainer/helpers";
import { buildPlanDiffArtifacts } from "@/tests/plan-diff-inspector/helpers";

export function buildReplayFixture(overrides: Partial<{
  comparisonArtifact: unknown;
  environmentId: string;
}> = {}) {
  const policyFixture = buildPolicyDecisionFixture();
  const artifacts = buildPlanDiffArtifacts();
  const input = {
    treaty: policyFixture.traceFixture.validationFixture.context.treaty,
    validation: policyFixture.traceFixture.validationFixture.output,
    traceView: policyFixture.traceFixture.view,
    policyExplanation: policyFixture.explanation,
    comparisonArtifact: overrides.comparisonArtifact ?? artifacts.targetArtifact,
    environmentId: overrides.environmentId,
  } as const;

  return {
    policyFixture,
    artifacts,
    input,
    replay: buildReplayReconstruction(input),
  };
}

export function loadReplayReconstructionSources() {
  const root = path.resolve("services", "replay-reconstruction-engine");
  return [
    "index.ts",
    "replayReconstructionEngine.ts",
    "replaySnapshotResolver.ts",
    "replayRuntimeBinder.ts",
    "replayLineageProjection.ts",
    "replayDeterminismVerifier.ts",
    "replayIntegrityProjection.ts",
    "replayComparisonProjection.ts",
    "replayDriftClassifier.ts",
    "replayVisualizationAssembler.ts",
    "replayHasher.ts",
    "replayGuards.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}

export {
  bindReplayRuntime,
  classifyReplayDrift,
  projectReplayComparison,
  projectReplayIntegrity,
  projectReplayLineage,
};
