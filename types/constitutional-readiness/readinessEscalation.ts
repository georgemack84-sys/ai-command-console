export type EscalationReadinessRecord = Readonly<{
  readinessId: string;
  escalationFailureRate: number;
  escalationStable: boolean;
  verificationHash: string;
}>;
