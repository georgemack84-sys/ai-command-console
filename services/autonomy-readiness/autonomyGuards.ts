import type { AutonomyReadinessInput } from "@/types/autonomy-readiness";

const BANNED_IMPORT_PATTERNS = [
  /from\s+["'][^"']*([/\\](worker|queue|scheduler|child_process|adapter|jobRunner|dispatch|executionEngine|orchestrator)([/\\]|["']))/i,
  /require\(["'][^"']*([/\\](worker|queue|scheduler|child_process|adapter|jobRunner|dispatch|executionEngine|orchestrator)([/\\]|["']))\)/i,
  /from\s+["'][^"']*(shellExecution|shellCommand)["']/i,
  /require\(["'][^"']*(shellExecution|shellCommand)["']\)/i,
] as const;

const BANNED_CALL_PATTERNS = [
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bexecFile\s*\(/,
  /\bfork\s*\(/,
  /\benqueue\w*\s*\(/i,
  /\bdispatch\w*\s*\(/i,
  /\bschedule\w*\s*\(/i,
  /\brunAutonomous\w*\s*\(/,
  /\brun.*Orchestrator\s*\(/,
  /\bapply[A-Z]\w*\s*\(/,
  /\bapprove[A-Z]\w*\s*\(/,
  /\bexecute[A-Z]\w*\s*\(/,
  /\bdispatch[A-Z]\w*\s*\(/,
  /\bretry[A-Z]\w*\s*\(/,
  /\borchestrate[A-Z]\w*\s*\(/,
  /\bselfAuthoriz\w*\s*\(/i,
] as const;

export function detectAutonomyReadinessViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (const source of input.sourceTexts) {
    if (source.path.endsWith("autonomyGuards.ts")) {
      continue;
    }
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`AUTONOMY_ORCHESTRATION_FORBIDDEN:${source.path}`);
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`AUTONOMY_EXECUTION_FORBIDDEN:${source.path}`);
      }
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function guardAutonomyReadinessInput(input: Partial<AutonomyReadinessInput>) {
  const errors: string[] = [];
  if (!input.governanceView) {
    errors.push("AUTONOMY_GOVERNANCE_UNBOUND");
  }
  if (!input.source?.replay) {
    errors.push("AUTONOMY_REPLAY_UNBOUND");
  }
  if (!input.source?.snapshots?.length) {
    errors.push("AUTONOMY_SNAPSHOT_UNBOUND");
  }
  return Object.freeze(errors);
}
