export type ApprovalDependencyState =
  | "required"
  | "satisfied"
  | "revoked"
  | "expired"
  | "blocked";

export type ApprovalDependencyType =
  | "governance_prerequisite"
  | "proposal_approval"
  | "handoff_prerequisite"
  | "inherited_requirement";

export type ApprovalDependencyNode = Readonly<{
  approvalId: string;
  proposalId: string;
  dependencyType: ApprovalDependencyType;
  requiredBefore: readonly string[];
  inheritedFrom: readonly string[];
  approvalState: ApprovalDependencyState;
  timeWindow: Readonly<{
    validFrom: string;
    validUntil: string;
  }>;
  replayBindingHash: string;
  governanceBindingHash: string;
  immutableHash: string;
}>;
