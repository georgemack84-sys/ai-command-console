import { hashCertificationValue } from "./certificationHashEngine";
import type { DecisionReadinessEvidence, DecisionReadinessCertificationInput } from "./types/decisionReadinessCertificationTypes";

export function buildCertificationEvidence(input: {
  certificationInput: DecisionReadinessCertificationInput;
  reasons: readonly string[];
}): DecisionReadinessEvidence {
  const evidenceRefs = Object.freeze([
    input.certificationInput.deterministicReplayResult.result.replayId,
    input.certificationInput.decisionAuditEpisodeResult.episode.episodeId,
    input.certificationInput.constitutionalTransitionResult.transition.transitionId,
    input.certificationInput.operatorAuthorityResult.action.actionId,
    input.certificationInput.hiddenExecutionDetectionResult.report.reportId,
    input.certificationInput.proposalIntegrityResult.proposal.proposalId,
  ]);
  return Object.freeze({
    evidenceId: hashCertificationValue("decision-readiness-evidence-id", {
      certificationId: input.certificationInput.certificationId,
    }),
    recommendationSystemId: input.certificationInput.recommendationSystemId,
    evidenceRefs,
    reasons: Object.freeze([...input.reasons]),
    evidenceHash: hashCertificationValue("decision-readiness-evidence", {
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}
