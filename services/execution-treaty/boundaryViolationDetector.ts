import type { ExecutionTreatyFailure } from "./executionTreatyReplayValidator";

const BANNED_IMPORT_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|executor|shell|child_process|adapter)["']/i,
  /require\(["'][^"']*(worker|queue|executor|shell|child_process|adapter)["']\)/i,
] as const;

const BANNED_CALL_PATTERNS = [
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bexecFile\s*\(/,
  /\bfork\s*\(/,
  /\bqueue\w*\s*\(/i,
  /\bstartWorker\s*\(/,
  /\bdispatch\w*\s*\(/i,
  /\brunAdapter\s*\(/,
  /\binvokeAdapter\s*\(/,
] as const;

export function detectExecutionTreatyBoundaryViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
  executionStarted?: boolean;
  dispatchPerformed?: boolean;
}): { valid: boolean; failures: readonly ExecutionTreatyFailure[] } {
  const failures: ExecutionTreatyFailure[] = [];
  for (const source of input.sourceTexts) {
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        failures.push({
          code: "HANDOFF_RUNTIME_AUTHORITY_DETECTED",
          message: "forbidden runtime authority import detected",
          path: source.path,
        });
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        failures.push({
          code: "HANDOFF_EXECUTION_BEHAVIOR_DETECTED",
          message: "forbidden execution behavior detected",
          path: source.path,
        });
      }
    }
  }
  if (input.executionStarted || input.dispatchPerformed) {
    failures.push({
      code: "HANDOFF_EXECUTION_BEHAVIOR_DETECTED",
      message: "manifest leaked execution state",
      path: input.executionStarted ? "executionStarted" : "dispatchPerformed",
    });
  }
  return { valid: failures.length === 0, failures };
}
