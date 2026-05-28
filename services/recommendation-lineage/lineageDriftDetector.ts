import type {
  ApprovalLineageRecord,
  EvidenceLineageRecord,
  GovernanceLineageRecord,
  PolicyLineageRecord,
  RecommendationLineageError,
  RecommendationLineageInput,
  ReplayLineageRecord,
  ScoringLineageRecord,
} from "./recommendationLineageStateTypes";
import { detectApprovalDrift } from "./approvalDriftDetector";
import { detectConfidenceDrift } from "./confidenceDriftDetector";
import { detectEvidenceDrift } from "./evidenceDriftDetector";
import { detectGovernanceDrift } from "./governanceDriftDetector";
import { detectReplayDrift } from "./replayDriftDetector";

export function detectLineageDrift(input: {
  lineageInput: RecommendationLineageInput;
  evidenceLineage: EvidenceLineageRecord;
  governanceLineage: GovernanceLineageRecord;
  scoringLineage: ScoringLineageRecord;
  policyLineage: PolicyLineageRecord;
  replayLineage: ReplayLineageRecord;
  approvalLineage: ApprovalLineageRecord;
}): readonly RecommendationLineageError[] {
  const policyErrors = input.lineageInput.metadata?.policyReplacementAttack === true
    || input.policyLineage.conflictPolicies.length > 0
    ? [{
      code: "RECOMMENDATION_LINEAGE_POLICY_SUBSTITUTION" as const,
      message: "Policy replacement or conflict drift was detected.",
      path: "policySnapshot",
    }]
    : [];

  return Object.freeze([
    ...detectEvidenceDrift({
      lineageInput: input.lineageInput,
      record: input.evidenceLineage,
    }),
    ...detectGovernanceDrift({
      lineageInput: input.lineageInput,
      record: input.governanceLineage,
    }),
    ...detectConfidenceDrift({
      lineageInput: input.lineageInput,
      record: input.scoringLineage,
    }),
    ...policyErrors,
    ...detectReplayDrift({
      lineageInput: input.lineageInput,
      record: input.replayLineage,
    }),
    ...detectApprovalDrift({
      lineageInput: input.lineageInput,
      record: input.approvalLineage,
    }),
  ]);
}
