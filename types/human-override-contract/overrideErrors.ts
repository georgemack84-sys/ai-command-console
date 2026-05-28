export type OverrideContractErrorCode =
  | "OVERRIDE_AUTHORITY_INVALID"
  | "OVERRIDE_SCOPE_INVALID"
  | "OVERRIDE_REPLAY_MISMATCH"
  | "OVERRIDE_CHAIN_BROKEN"
  | "OVERRIDE_FREEZE_ACTIVE"
  | "OVERRIDE_KILL_SWITCH_ACTIVE"
  | "OVERRIDE_ESCALATION_INVALID"
  | "OVERRIDE_PROPAGATION_FAILED"
  | "OVERRIDE_GOVERNANCE_MISSING"
  | "OVERRIDE_ORDERING_CONFLICT";

export type OverrideContractError = Readonly<{
  code: OverrideContractErrorCode;
  message: string;
  path?: string;
}>;
