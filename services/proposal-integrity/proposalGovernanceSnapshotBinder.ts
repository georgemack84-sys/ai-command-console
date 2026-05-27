import type { ProposalGovernanceBinding, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";
import { hashProposalIntegrityValue } from "./proposalHashEngine";

export function bindProposalGovernanceSnapshot(input: ProposalIntegrityInput): ProposalGovernanceBinding {
  return Object.freeze({
    governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    governanceHash: hashProposalIntegrityValue("proposal-governance-hash", {
      governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
      readinessHash: input.constitutionalReadinessResult.governanceIntegrity.deterministicHash,
    }),
    governanceBound: input.constitutionalCertificationResult.record.governanceBound
      && input.constitutionalReadinessResult.record.governanceBound
      && input.humanSupremacyResult.record.governanceBound,
    policyHash: input.constitutionalCertificationResult.policy.policyHash,
    deterministicHash: hashProposalIntegrityValue("proposal-governance-binding", {
      governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
      governanceBound: input.constitutionalCertificationResult.record.governanceBound,
      policyHash: input.constitutionalCertificationResult.policy.policyHash,
    }),
  });
}
