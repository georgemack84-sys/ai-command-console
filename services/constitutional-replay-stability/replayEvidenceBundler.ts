import type { ConstitutionalReplayStabilityInput, ReplayStabilityEvidence } from "./replayStateTypes";
import { buildReplayStabilityEvidence } from "./replayLineageAuditor";

export function bundleReplayEvidence(input: {
  replayInput: ConstitutionalReplayStabilityInput;
  reasons: readonly string[];
}): ReplayStabilityEvidence {
  const boundary = input.replayInput.constitutionalAuthorityBoundaryResult;
  return buildReplayStabilityEvidence({
    replayId: input.replayInput.replayId,
    authorityEvidenceId: boundary.evidence.evidenceId,
    evidenceRefs: Object.freeze([
      boundary.evidence.evidenceId,
      boundary.record.boundaryId,
      boundary.lineageValidation.lineageId,
      boundary.revocation.revocationId,
    ]),
    reasons: input.reasons,
  });
}
