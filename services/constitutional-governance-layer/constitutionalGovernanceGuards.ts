import type { ConstitutionalGovernanceError, ConstitutionalGovernanceInput } from "@/types/constitutional-governance";

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
  /\bapply[A-Z]\w*\s*\(/,
  /\bapprove[A-Z]\w*\s*\(/,
  /\brun[A-Z]\w*Orchestrator\s*\(/,
  /\brunAutonomous\w*\s*\(/,
  /\brunConstitutionalEnforcementRuntime\s*\(/,
] as const;

export function detectConstitutionalGovernanceViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (const source of input.sourceTexts) {
    if (source.path.endsWith("constitutionalGovernanceGuards.ts")) {
      continue;
    }
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`GOVERNANCE_BYPASS_ATTEMPT:${source.path}`);
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`CONSTITUTIONAL_SCOPE_DENIED:${source.path}`);
      }
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function validateConstitutionalGovernanceInput(input: Partial<ConstitutionalGovernanceInput>): readonly ConstitutionalGovernanceError[] {
  const errors: ConstitutionalGovernanceError[] = [];
  if (!input.treaty || !input.validation || !input.traceView || !input.policyExplanation || !input.diffInspection || !input.replay || !input.consoleView) {
    errors.push({
      code: "CONSTITUTIONAL_REPO_CONTEXT_MISSING",
      message: "constitutional governance requires upstream treaty, validation, trace, policy, drift, replay, and console inputs",
      path: "input",
    });
  }
  if (!input.snapshots?.length) {
    errors.push({
      code: "CONSTITUTIONAL_LINEAGE_DISPUTED",
      message: "constitutional governance requires immutable snapshot lineage",
      path: "snapshots",
    });
  }
  return Object.freeze(errors);
}
