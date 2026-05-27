import { hashPayloadDeterministically } from "@/services/contracts/payloadHasher";
import type { PlanEvidenceReference } from "./replay-audit-types";

export function buildEvidenceReference(input: Omit<PlanEvidenceReference, never>) {
  const reference: PlanEvidenceReference = {
    referenceVersion: input.referenceVersion,
    planId: input.planId,
    planHash: input.planHash,
    normalizedPlanHash: input.normalizedPlanHash,
    executionTruthHash: input.executionTruthHash,
    executionCompatibilityHash: input.executionCompatibilityHash,
    compatibilitySnapshotHash: input.compatibilitySnapshotHash,
    replaySnapshotHash: input.replaySnapshotHash,
    replayProofHash: input.replayProofHash,
    auditArtifactHash: input.auditArtifactHash,
    ledgerEventHashes: [...input.ledgerEventHashes],
  };
  return {
    reference,
    referenceHash: hashPayloadDeterministically(reference),
  };
}
