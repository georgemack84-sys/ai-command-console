export enum IntentResolutionState {
  RESOLVED = "RESOLVED",
  AMBIGUOUS = "AMBIGUOUS",
  CONTEXT_INSUFFICIENT = "CONTEXT_INSUFFICIENT",
  GOVERNANCE_BLOCKED = "GOVERNANCE_BLOCKED",
  REQUIRES_CLARIFICATION = "REQUIRES_CLARIFICATION",
  REQUIRES_ESCALATION = "REQUIRES_ESCALATION",
  PROTECTED_TARGET = "PROTECTED_TARGET",
  FREEZE_BLOCKED = "FREEZE_BLOCKED",
  REPLAY_BLOCKED = "REPLAY_BLOCKED",
  INVALID = "INVALID",
}

export type ContextualResolution = {
  state: IntentResolutionState;
  contextSufficient: boolean;
  missingContext: string[];
  conflictingContext: string[];
  unsafeAssumptions: string[];
};
