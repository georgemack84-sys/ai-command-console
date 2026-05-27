import { readFileSync } from "node:fs";
import path from "node:path";

const FORBIDDEN_IMPORT_PATTERNS = [
  "worker",
  "queue",
  "scheduler",
  "dispatch",
  "child_process",
  "shell",
  "spawn(",
  "exec(",
  "approval commit",
] as const;

export function assertSafeActionSourceIsReadOnly(content: string): readonly string[] {
  return Object.freeze(
    FORBIDDEN_IMPORT_PATTERNS.filter((pattern) => content.toLowerCase().includes(pattern)).map(
      (pattern) => `Forbidden runtime capability detected: ${pattern}`,
    ),
  );
}

export function loadSafeActionSources() {
  const files = [
    ["services", "safe-action-catalog", "index.ts"],
    ["services", "safe-action-catalog", "safeActionRegistry.ts"],
    ["services", "safe-action-catalog", "safeActionSchemas.ts"],
    ["services", "safe-action-catalog", "safeActionRiskClassifier.ts"],
    ["services", "safe-action-catalog", "safeActionScopeValidator.ts"],
    ["services", "safe-action-catalog", "safeActionGovernanceBinder.ts"],
    ["services", "safe-action-catalog", "safeActionReplayBinder.ts"],
    ["services", "safe-action-catalog", "safeActionDeriver.ts"],
    ["services", "safe-action-catalog", "safeActionHasher.ts"],
    ["services", "safe-action-catalog", "safeActionGuards.ts"],
  ];

  return files.map((segments) => {
    const filePath = path.resolve(...segments);
    return {
      path: filePath,
      content: readFileSync(filePath, "utf8"),
    };
  });
}
