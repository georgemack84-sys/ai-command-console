export type GovernedIntent = {
  governedIntentId: string;
  semanticValid: boolean;
  governanceApproved: boolean;
  plannerEligible: boolean;
  replaySafe: boolean;
  freezeSafe: boolean;
  ambiguityResolved: boolean;
  protectedTargetValidated: boolean;
  unsafeAssumptionsDetected: boolean;
  escalationRequired: boolean;
  clarificationRequired: boolean;
  approvalRequired: boolean;
  containmentRequired: boolean;
  governanceState:
    | "VALID"
    | "WARNING"
    | "AMBIGUOUS"
    | "BLOCKED"
    | "ESCALATED"
    | "RESTRICTED"
    | "FROZEN"
    | "REPLAY_BLOCKED"
    | "DENIED";
  riskLevel: "safe" | "low" | "medium" | "high" | "critical";
  blockedReasons: string[];
  warnings: string[];
  governanceActions: string[];
  escalationTargets: string[];
  allowedTools: string[];
  deniedTools: string[];
  audit: {
    validatedAt: number;
    policyVersion: string;
    validatorVersion: string;
  };
};
