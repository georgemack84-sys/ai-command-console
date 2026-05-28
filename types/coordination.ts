export type CoordinationPolicyOutcome =
  | "ALLOW"
  | "WARN"
  | "REQUIRE_APPROVAL"
  | "CONTAIN"
  | "ESCALATE"
  | "FREEZE"
  | "DENY";

export type CoordinationConflictState =
  | "NONE"
  | "WARNING"
  | "CONFLICT"
  | "ESCALATED"
  | "FROZEN"
  | "CONTAINED"
  | "DISPUTED"
  | "BLOCKED";

export type CoordinationDomain =
  | "RECOVERY"
  | "CONTINUITY"
  | "ESCALATION"
  | "GOVERNANCE"
  | "SIMULATION"
  | "CONTAINMENT"
  | "SUPERVISION"
  | "STABILIZATION"
  | "SOVEREIGNTY"
  | "REPLAY";

export type MultiSystemCoordinationRecord = {
  coordinationId: string;
  coordinationState:
    | "ACTIVE"
    | "WARNING"
    | "CONFLICT"
    | "ESCALATED"
    | "FROZEN"
    | "CONTAINED"
    | "DISPUTED"
    | "BLOCKED";
  participatingSystems: string[];
  coordinationReasoning: string[];
  dependencyOrdering: string[];
  containmentRequired: boolean;
  constitutionalSafe: boolean;
  approvalRequired: boolean;
  enforcementReferences: string[];
  containmentReferences: string[];
  supervisionReferences: string[];
  sovereigntyReferences: string[];
  auditReferences: string[];
  immutableLineageHash: string;
  timestamp: string;
};
