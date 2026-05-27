export type ApprovalDependency = Readonly<{
  dependencyId: string;
  lineageId: string;
  dependencyState: "stable" | "revoked" | "ambiguous";
  deterministicHash: string;
}>;
