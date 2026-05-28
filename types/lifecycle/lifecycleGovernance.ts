export type LifecycleValidationAssertion = Readonly<{
  asserted: true;
}>;

export type GovernanceValidationAssertion = LifecycleValidationAssertion & Readonly<{
  governanceSnapshotHash: string;
}>;

export type ReplayValidationAssertion = LifecycleValidationAssertion & Readonly<{
  replaySnapshotHash: string;
}>;

export type EscalationValidationAssertion = LifecycleValidationAssertion & Readonly<{
  escalationId: string;
}>;

export type ApprovalValidationAssertion = LifecycleValidationAssertion & Readonly<{
  approvalState: "valid" | "invalid";
}>;
