export type ApprovalExplanationView = Readonly<{
  approvalsRequired: readonly string[];
  approvalsReceived: readonly string[];
  approvalsMissing: readonly string[];
  approvalLineage: readonly string[];
  policyEvidenceRefs: readonly string[];
  governanceEvidenceRefs: readonly string[];
  incomplete: boolean;
}>;
