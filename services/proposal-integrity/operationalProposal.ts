import type { ScopeBoundary } from "./scopeBoundary";

export interface OperationalProposal {
  proposalId: string;
  proposalType: string;
  createdAt: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  approvalDependencyIds: string[];
  confidenceScore: number;
  riskClassification: string;
  scopeBoundaries: ScopeBoundary[];
  recommendationLineageHash: string;
  proposalHash: string;
  replayHash: string;
  auditHash: string;
  executionAuthorized: false;
  advisoryOnly: true;
  executable: false;
  orchestrationAllowed: false;
  runtimeMutationAllowed: false;
  authorityMutationAllowed: false;
  governanceMutationAllowed: false;
  schedulerRegistrationAllowed: false;
  operatorReviewRequired: true;
}
