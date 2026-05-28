export type ConstitutionalAuditRecord = {
  auditId: string;
  governanceAction: string;
  constitutionalState: string;
  evidence: string[];
  approvals: string[];
  escalationChain: string[];
  coordinationChain?: string[];
  coordinationSystems?: string[];
  operatorVisibility: boolean;
  timestamp: string;
};

export type ExpandedConstitutionalAuditRecord = {
  auditId: string;
  governanceAction:
    | "ALLOW"
    | "WARN"
    | "DENY"
    | "FREEZE"
    | "CONTAIN"
    | "ESCALATE"
    | "REQUIRE_APPROVAL"
    | "COORDINATION_BLOCK"
    | "COORDINATION_STABILIZATION"
    | "EMERGENCY_INTERVENTION";
  constitutionalState:
    | "STABLE"
    | "RESTRICTED"
    | "CONTAINED"
    | "ESCALATED"
    | "DISPUTED"
    | "FROZEN"
    | "EMERGENCY";
  evidence: string[];
  reasoningChain: string[];
  approvals: string[];
  escalationChain: string[];
  coordinationChain: string[];
  coordinationSystems: string[];
  relatedExecutionIds: string[];
  relatedGovernanceIds: string[];
  relatedCoordinationIds: string[];
  sovereigntyState?: string;
  containmentActive: boolean;
  coordinationConflictDetected: boolean;
  operatorVisibility: boolean;
  immutableHash: string;
  replayable: boolean;
  exported: boolean;
  timestamp: string;
};

export type GovernanceReasoning = {
  reasoningId: string;
  constitutionalRules: string[];
  evaluatedConstraints: string[];
  violatedPolicies: string[];
  coordinationConstraints: string[];
  approvalsRequired: boolean;
  escalationRequired: boolean;
  denialReason?: string;
  governanceConfidence: number;
  explanation: string[];
};

export type EvidenceCategory =
  | "EXECUTION_STATE"
  | "CONSTITUTIONAL_DECISION"
  | "APPROVAL_RECORD"
  | "ESCALATION_EVENT"
  | "CONTAINMENT_ACTION"
  | "SOVEREIGNTY_TRANSITION"
  | "RUNTIME_HEALTH"
  | "SUPERVISION_EVENT"
  | "COORDINATION_EVENT"
  | "REPLAY_VALIDATION"
  | "OPERATOR_ACTION";

export type GovernanceDisputeState =
  | "OPEN"
  | "UNDER_REVIEW"
  | "CONSTITUTIONALLY_BLOCKED"
  | "ESCALATED"
  | "RESOLVED"
  | "FROZEN"
  | "INVALIDATED";
