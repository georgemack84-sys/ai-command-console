export type ApprovalRequirement = Readonly<{
  requirementId: string;
  approvalId: string;
  dependencyType: string;
  approvalState: "required" | "satisfied" | "revoked" | "expired" | "blocked";
  validFrom: string;
  validUntil: string;
  inheritedFrom: readonly string[];
  createdAt: string;
}>;
