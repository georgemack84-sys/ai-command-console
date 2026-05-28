import type { ConstitutionalCeilingLevel, ConstitutionalCoordinationState } from "./coordination";

export type ConstitutionalCoordinationErrorCode =
  | "CONSTITUTIONAL_COORDINATION_GOVERNANCE_MISMATCH"
  | "CONSTITUTIONAL_COORDINATION_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_COORDINATION_REPLAY_AMBIGUITY"
  | "CONSTITUTIONAL_COORDINATION_LINEAGE_CORRUPTION"
  | "CONSTITUTIONAL_COORDINATION_AUTHORITY_EXPANSION"
  | "CONSTITUTIONAL_COORDINATION_HIDDEN_ORCHESTRATION"
  | "CONSTITUTIONAL_COORDINATION_RECURSIVE_GROWTH"
  | "CONSTITUTIONAL_COORDINATION_RUNTIME_MUTATION"
  | "CONSTITUTIONAL_COORDINATION_CONTAINMENT_PRECEDENCE"
  | "CONSTITUTIONAL_COORDINATION_STALE_GOVERNANCE"
  | "CONSTITUTIONAL_COORDINATION_UNKNOWN_STATE"
  | "CONSTITUTIONAL_COORDINATION_HASH_MISMATCH";

export type ConstitutionalCoordinationError = Readonly<{
  code: ConstitutionalCoordinationErrorCode;
  message: string;
  path?: string;
}>;

export type ConstitutionalCoordinationValidation = Readonly<{
  validationId: string;
  valid: boolean;
  failClosed: boolean;
  containmentState: import("@/types/coordination-containment").ContainmentState;
  resultingState: ConstitutionalCoordinationState;
  ceilingLevel: ConstitutionalCeilingLevel;
  reasons: readonly string[];
}>;
