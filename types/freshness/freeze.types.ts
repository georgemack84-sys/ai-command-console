export type CoordinationFreezeRecord = Readonly<{
  freezeId: string;
  proposalId: string;
  frozen: boolean;
  terminalContainment: true;
  visibilityRestricted: boolean;
  escalationRequired: boolean;
  replayQuarantined: boolean;
  reasonCodes: readonly string[];
  freezeHash: string;
  createdAt: string;
}>;
