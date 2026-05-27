export type ConstraintExplanationItem = Readonly<{
  constraint: string;
  reason: string;
  evidenceHash?: string;
}>;

export type ConstraintExplanationView = Readonly<{
  blockingConstraints: readonly ConstraintExplanationItem[];
  deniedCapabilities: readonly string[];
  missingApprovalConstraints: boolean;
  governanceMismatchConstraints: boolean;
  replayMismatchConstraints: boolean;
}>;
