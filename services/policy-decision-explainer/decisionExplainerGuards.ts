import type { PolicyDecisionExplainerError } from "@/types/policy-decision-explainer";

const BANNED_IMPORT_PATTERNS = [
  /from\s+["'][^"']*(worker|queue|scheduler|shell|child_process|adapter|executionEngine|runtimeControl|jobQueue|taskQueue)["']/i,
  /require\(["'][^"']*(worker|queue|scheduler|shell|child_process|adapter|executionEngine|runtimeControl|jobQueue|taskQueue)["']\)/i,
  /\bbuildExecutionTreatyPackage\b/,
  /\bappendExecutionTreatyEvent\b/,
  /\bappendCertificationRevocation\b/,
  /\bappendOperationalTrustEvent\b/,
] as const;

const BANNED_CALL_PATTERNS = [
  /\bspawn\s*\(/,
  /\bexec\s*\(/,
  /\bexecFile\s*\(/,
  /\bfork\s*\(/,
  /\bdispatch\w*\s*\(/i,
  /\brunAdapter\s*\(/,
  /\binvokeAdapter\s*\(/,
  /\benqueue\w*\s*\(/i,
  /\bstartWorker\s*\(/,
  /\bschedule\w*\s*\(/i,
] as const;

export function detectPolicyExplainerMutationViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly PolicyDecisionExplainerError[] } {
  const errors: PolicyDecisionExplainerError[] = [];
  for (const source of input.sourceTexts) {
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push({
          code: "POLICY_MUTATION_FORBIDDEN",
          message: "forbidden import or mutating usage detected",
          path: source.path,
        });
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push({
          code: "POLICY_MUTATION_FORBIDDEN",
          message: "forbidden execution or scheduling behavior detected",
          path: source.path,
        });
      }
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}
