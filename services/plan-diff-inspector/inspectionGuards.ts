import type { ArtifactDiffView, DependencyDriftView, EvidenceDriftView, GovernanceDriftView, HashIntegrityView, PlanDiffInspectionInput, ReplayDriftView } from "@/types/plan-diff-inspector";

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

export function detectPlanDiffMutationViolations(input: {
  sourceTexts: readonly { path: string; content: string }[];
}): { valid: boolean; errors: readonly string[] } {
  const errors: string[] = [];
  for (const source of input.sourceTexts) {
    for (const pattern of BANNED_IMPORT_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`PLAN_DIFF_MUTATION_FORBIDDEN:${source.path}`);
      }
    }
    for (const pattern of BANNED_CALL_PATTERNS) {
      if (pattern.test(source.content)) {
        errors.push(`PLAN_DIFF_MUTATION_FORBIDDEN:${source.path}`);
      }
    }
  }
  return { valid: errors.length === 0, errors: Object.freeze(errors) };
}

export function guardInspectableInput(input: PlanDiffInspectionInput): readonly string[] {
  const errors: string[] = [];
  if (input.baseArtifact === undefined || input.targetArtifact === undefined) {
    errors.push("PLAN_DIFF_ARTIFACT_MISSING");
  }
  if (input.baseArtifact === null || input.targetArtifact === null) {
    errors.push("PLAN_DIFF_ARTIFACT_UNINSPECTABLE");
  }
  return Object.freeze(errors);
}

export function guardUnknownDrift(input: {
  artifactDiff: ArtifactDiffView;
  governanceDrift: GovernanceDriftView;
  replayDrift: ReplayDriftView;
  dependencyDrift: DependencyDriftView;
  evidenceDrift: EvidenceDriftView;
}): readonly string[] {
  const errors: string[] = [];
  if (input.artifactDiff.driftClass === "UNKNOWN_DRIFT"
    || input.governanceDrift.driftClass === "UNKNOWN_DRIFT"
    || input.replayDrift.driftClass === "UNKNOWN_DRIFT"
    || input.dependencyDrift.driftClass === "UNKNOWN_DRIFT"
    || input.evidenceDrift.driftClass === "UNKNOWN_DRIFT") {
    errors.push("PLAN_DIFF_UNKNOWN_DRIFT");
  }
  return Object.freeze(errors);
}

export function guardHashIntegrity(hashIntegrity: HashIntegrityView): readonly string[] {
  const errors: string[] = [];
  if (hashIntegrity.invalidHashPaths.length > 0) {
    errors.push("PLAN_DIFF_HASH_INVALID");
  }
  if (hashIntegrity.hashMismatch) {
    errors.push("PLAN_DIFF_HASH_MISMATCH");
  }
  return Object.freeze(errors);
}
