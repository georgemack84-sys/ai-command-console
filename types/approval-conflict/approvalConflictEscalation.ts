export type ApprovalConflictEscalationRecord = Readonly<{
  escalationRequired: boolean;
  escalationAmplified: boolean;
  governanceReviewRequired: boolean;
  freezeRequired: boolean;
  escalationHash: string;
}>;
