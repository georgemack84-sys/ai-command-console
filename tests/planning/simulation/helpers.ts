import { validateExecutionCompatibility } from "@/services/planning/execution-compatibility";
import { buildReplayAuditReadiness } from "@/services/planning/replay-audit";
import { buildVersionedReplayReadiness } from "@/services/planning/versioning";
import { buildExecutionCompatibilityFixture } from "@/tests/planning/execution-compatibility/helpers";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function buildSimulationFixture() {
  const compatibilityFixture = buildExecutionCompatibilityFixture();
  const compatibility = validateExecutionCompatibility({
    executionTruthHash: compatibilityFixture.executionTruthPackage.executionTruthHash,
    normalizedPlan: compatibilityFixture.normalizedPlan,
    executionTruth: compatibilityFixture.executionTruthPackage,
    dependencyValidation: compatibilityFixture.dependencyValidation,
  });
  if (!compatibility.ok) {
    throw new Error("Expected simulation compatibility fixture to validate.");
  }

  const replayAuditResult = buildReplayAuditReadiness({
    normalizedPlan: compatibilityFixture.normalizedPlan,
    executionTruthPackage: compatibilityFixture.executionTruthPackage,
    executionCompatibilityContract: compatibility.contract,
  });
  if (replayAuditResult.verdict !== "REPLAY_AUDIT_READY") {
    throw new Error("Expected replay audit fixture to be ready.");
  }

  const versioned = buildVersionedReplayReadiness({
    replayAuditResult,
    executionCompatibilityContract: compatibility.contract,
  });
  if (!versioned.ok || !versioned.artifact) {
    throw new Error("Expected versioned replay readiness fixture to succeed.");
  }

  return {
    normalizedPlan: clone(compatibilityFixture.normalizedPlan),
    executionTruthPackage: clone(compatibilityFixture.executionTruthPackage),
    executionCompatibilityContract: clone(compatibility.contract),
    versionedReplayArtifact: clone(versioned.artifact),
  };
}
