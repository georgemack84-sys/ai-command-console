import { readFileSync } from "node:fs";
import path from "node:path";
import type { IntentCorrelationError } from "@/types/intent-correlation-engine";
import { createCorrelationError } from "./correlationErrors";

const FORBIDDEN_SOURCE_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|dispatch|child_process)["']\)/i,
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\borchestrate[A-Z]?\w*\s*\(/,
  /\bsetInterval\s*\(/,
  /\bsetTimeout\s*\(/,
  /\bworkflow[A-Z]?\w*\s*\(/,
];

const FORBIDDEN_METADATA_PATTERN = /execute|dispatch|schedule|activate|workflow|runtime|queue|worker|process|lock|retry|approve|authoritychain|dependencyactivation|orchestration/i;

export function guardCorrelationInput(metadata?: Readonly<Record<string, unknown>>): readonly IntentCorrelationError[] {
  return Object.freeze(
    metadata && Object.keys(metadata).some((key) => FORBIDDEN_METADATA_PATTERN.test(key))
      ? [createCorrelationError("PHASE_4_6B_CORRELATION_EXECUTION_LEAKAGE_REJECTED", "Forbidden runtime, execution, or orchestration metadata detected.", "metadata")]
      : [],
  );
}

export function assertCorrelationSourcesAreReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_SOURCE_PATTERNS.filter((pattern) => pattern.test(content)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern.toString()}`,
    ),
  );
}

export function loadCorrelationSources() {
  const files = [
    "intentCorrelationEngine.ts",
    "correlationSchemas.ts",
    "correlationTypes.ts",
    "proposalRelationshipMapper.ts",
    "recommendationClusterModel.ts",
    "confidenceLineageGraph.ts",
    "escalationCorrelationGraph.ts",
    "approvalRelationshipTracker.ts",
    "correlationReplayBinder.ts",
    "correlationReplayReconstruction.ts",
    "correlationReplayView.ts",
    "correlationContainmentValidator.ts",
    "correlationTopologyInspector.ts",
    "correlationDeterminismValidator.ts",
    "correlationBoundaryGuards.ts",
    "correlationLineageLedger.ts",
    "correlationNormalizer.ts",
    "correlationSerializer.ts",
    "correlationHasher.ts",
    "correlationAuditEvents.ts",
    "correlationErrors.ts",
    "index.ts",
  ];

  return files.map((file) => {
    const filePath = path.resolve("services", "intent-correlation-engine", file);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
