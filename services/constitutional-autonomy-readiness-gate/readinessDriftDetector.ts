import type { ReadinessDrift } from "@/types/constitutional-autonomy-readiness-gate";
import type { AutonomyReadinessProfile } from "@/types/autonomy-readiness";
import type { SafeActionProfile } from "@/types/safe-action-catalog";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { ConstitutionalEscalationRecord } from "@/services/constitutional-escalation-layer";
import { hashReadinessValue } from "./readinessHasher";

export function detectReadinessDrift(input: {
  readinessProfile: AutonomyReadinessProfile;
  safeActionProfile: SafeActionProfile;
  proposal: ProposalRecord;
  escalation: ConstitutionalEscalationRecord;
  createdAt: string;
}): ReadinessDrift {
  const mismatches = Object.freeze([
    ...(input.safeActionProfile.evidence.readinessHash !== input.readinessProfile.readinessHash
      ? ["safe-action-readiness-hash-mismatch"]
      : []),
    ...(input.proposal.replayBinding.readinessHash !== input.readinessProfile.readinessHash
      ? ["proposal-readiness-hash-mismatch"]
      : []),
    ...(input.safeActionProfile.evidence.governanceHash !== input.readinessProfile.governanceBinding.governanceDecisionHash
      ? ["safe-action-governance-hash-mismatch"]
      : []),
  ]);

  return Object.freeze({
    driftId: hashReadinessValue("readiness-drift-id", {
      readinessHash: input.readinessProfile.readinessHash,
      proposalHash: input.proposal.proposalHash,
      createdAt: input.createdAt,
    }),
    driftDetected: mismatches.length > 0,
    mismatches,
    evidenceRefs: Object.freeze([
      input.readinessProfile.readinessHash,
      input.safeActionProfile.safeActionHash,
      input.proposal.proposalHash,
      input.escalation.escalationHash,
    ]),
    createdAt: input.createdAt,
  });
}
