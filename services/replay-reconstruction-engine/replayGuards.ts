import type { ReplayReconstructionInput, ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";

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

export function detectReplayMutationViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (const source of input.sourceTexts) {
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`REPLAY_MUTATION_FORBIDDEN:${source.path}`);
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`REPLAY_MUTATION_FORBIDDEN:${source.path}`);
      }
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function guardReplayInput(input: ReplayReconstructionInput): readonly string[] {
  const errors: string[] = [];
  if (!input.treaty?.manifest?.replaySnapshotHash || !input.treaty?.manifest?.replayBindingHash) {
    errors.push("REPLAY_SNAPSHOT_MISSING");
  }
  if (!input.validation?.result || !input.validation?.timeline) {
    errors.push("REPLAY_RECONSTRUCTION_FAILED");
  }
  return Object.freeze(errors);
}

export function mapReplayStatus(input: ReplayReconstructionResult): ReplayReconstructionResult["status"] {
  if (input.errors.includes("REPLAY_SNAPSHOT_MISSING") || input.errors.includes("REPLAY_RECONSTRUCTION_FAILED")) {
    return "UNINSPECTABLE";
  }
  if (!input.integrity.valid || !input.lineage.valid) {
    return "INVALID";
  }
  if (input.drift.driftDetected) {
    return "DRIFT_DETECTED";
  }
  return "RECONSTRUCTED";
}
