import type { PlanAuditArtifact } from "./replay-audit-types";

export function buildAuditArtifact(input: {
  planId: string;
  planHash: string;
  normalizedPlanHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  compatibilitySnapshotHash: string;
  replaySnapshotHash: string;
  replayProofHash: string;
}): Omit<PlanAuditArtifact, "artifactHash"> {
  return {
    artifactVersion: "4.2H",
    planId: input.planId,
    planHash: input.planHash,
    normalizedPlanHash: input.normalizedPlanHash,
    executionTruthHash: input.executionTruthHash,
    executionCompatibilityHash: input.executionCompatibilityHash,
    compatibilitySnapshotHash: input.compatibilitySnapshotHash,
    replaySnapshotHash: input.replaySnapshotHash,
    replayProofHash: input.replayProofHash,
  };
}
