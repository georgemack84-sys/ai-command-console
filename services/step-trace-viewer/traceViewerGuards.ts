import type { TraceViewerError } from "@/types/step-trace-viewer";

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

export function detectTraceViewerMutationViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly TraceViewerError[] } {
  const errors: TraceViewerError[] = [];
  for (const source of input.sourceTexts) {
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push({
          code: "TRACE_VIEWER_MUTATION_FORBIDDEN",
          message: "forbidden import or mutating treaty usage detected",
          path: source.path,
        });
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push({
          code: "TRACE_VIEWER_MUTATION_FORBIDDEN",
          message: "forbidden execution or scheduling behavior detected",
          path: source.path,
        });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
