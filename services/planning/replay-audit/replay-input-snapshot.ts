import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import type { ReplayAuditInput, ReplayInputSnapshot } from "./replay-audit-types";

export function derivePlanHash(input: ReplayAuditInput): string {
  return hashPayloadDeterministically({
    planId: input.normalizedPlan.planId,
    schemaVersion: input.normalizedPlan.schemaVersion,
    goal: input.normalizedPlan.goal,
    stepIds: input.normalizedPlan.steps.map((step) => step.id),
    stepHashes: input.normalizedPlan.steps.map((step) => step.hash),
  });
}

export function buildReplayInputSnapshot(
  input: ReplayAuditInput,
  planHash: string,
  compatibilitySnapshotHash: string,
): ReplayInputSnapshot {
  return {
    snapshotVersion: "4.2H",
    planId: input.normalizedPlan.planId,
    planHash,
    normalizedPlanHash: input.normalizedPlan.normalizationHash,
    executionTruthHash: input.executionTruthPackage.executionTruthHash,
    executionCompatibilityHash: input.executionCompatibilityContract.executionCompatibilityHash,
    compatibilitySnapshotHash,
    compatibilitySnapshot: input.executionCompatibilityContract.compatibilitySnapshot,
  };
}
