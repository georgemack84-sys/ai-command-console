import { readFileSync } from "node:fs";
import path from "node:path";

import {
  buildStepTraceView,
  projectDependencyGraph,
  projectForensics,
  projectGovernanceOverlay,
  projectReplayView,
  projectTimeline,
  projectValidationView,
} from "@/services/step-trace-viewer";
import { buildValidationFixture } from "@/tests/validation-core/helpers";

export function buildStepTraceFixture(overrides: Partial<{
  includeGovernance: boolean;
  includeReplay: boolean;
  includeForensics: boolean;
  includeEvidence: boolean;
  executionId: string;
  traceId: string;
}> = {}) {
  const validationFixture = buildValidationFixture();
  const request = {
    treaty: validationFixture.context.treaty,
    validation: validationFixture.output,
    executionId: overrides.executionId,
    traceId: overrides.traceId,
    includeGovernance: overrides.includeGovernance,
    includeReplay: overrides.includeReplay,
    includeForensics: overrides.includeForensics,
    includeEvidence: overrides.includeEvidence,
  };

  return {
    validationFixture,
    request,
    view: buildStepTraceView(request),
  };
}

export function loadStepTraceViewerSources() {
  const root = path.resolve("services", "step-trace-viewer");
  return [
    "index.ts",
    "traceProjectionEngine.ts",
    "timelineProjection.ts",
    "dependencyProjection.ts",
    "governanceOverlay.ts",
    "validationProjection.ts",
    "replayProjection.ts",
    "forensicProjection.ts",
    "stateProjection.ts",
    "evidenceNavigator.ts",
    "traceViewAssembler.ts",
    "traceViewHasher.ts",
    "traceViewerGuards.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}

export {
  projectDependencyGraph,
  projectForensics,
  projectGovernanceOverlay,
  projectReplayView,
  projectTimeline,
  projectValidationView,
};
