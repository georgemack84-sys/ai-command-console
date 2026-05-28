export type PolicyActivationState = "activated" | "not-activated" | "unknown";

export type PolicyActivationView = Readonly<{
  policyId: string;
  ruleId: string;
  activationOrder: number;
  activationState: PolicyActivationState;
  activationReason: string;
  evidenceHash?: string;
  missingEvidence: boolean;
  unknownActivationState: boolean;
}>;
