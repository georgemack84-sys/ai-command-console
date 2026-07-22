import type { MemoryQualificationRecord, MemoryQualificationResult } from "@/types/memory-qualification-validation";

export type GovernanceMemoryControlStatus = "AUTHORITATIVE" | "REJECTED";

export type MemoryReuseDecision =
  | "APPROVED"
  | "DENIED"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_OPERATOR_APPROVAL"
  | "REQUIRES_CERTIFICATION";

export type GovernanceControlValidator =
  | "IDENTITY_VALIDATION"
  | "AUTHORITY_VALIDATION"
  | "CONSTITUTIONAL_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "MISSION_AUTHORIZATION"
  | "REPLAY_VALIDATION"
  | "REUSE_POLICY_EVALUATION"
  | "INTEGRITY_VERIFICATION";

export type GovernanceMemoryControlFailure =
  | "QUALIFICATION_UNAVAILABLE"
  | "UNAUTHORIZED_MEMORY_REUSED"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "CONSTITUTIONAL_PROTECTION_VIOLATED"
  | "AUTHORITY_INCORRECTLY_GRANTED"
  | "REPLAY_VALIDATION_OMITTED"
  | "MISSION_AUTHORIZATION_IGNORED"
  | "TENANT_ISOLATION_VIOLATED"
  | "REUSE_POLICY_CIRCUMVENTED"
  | "NONDETERMINISTIC_GOVERNANCE_DECISION"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_REUSE_NOT_APPROVED"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "CERTIFICATION_REQUIRED";

export type GovernanceMemoryControlScenario =
  | "BASELINE"
  | "QUALIFICATION_UNAVAILABLE"
  | "UNAUTHORIZED_REUSE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "REPLAY_OMITTED"
  | "MISSION_AUTH_IGNORED"
  | "TENANT_BREACH"
  | "POLICY_CIRCUMVENTION"
  | "NONDETERMINISTIC_DECISION"
  | "INTEGRITY_FAILURE"
  | "CROSS_TENANT_REUSE"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "CERTIFICATION_REQUIRED";

export type GovernanceValidationReport = Readonly<{
  validator: GovernanceControlValidator;
  valid: boolean;
  deterministic: boolean;
  replayable: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionExplanation = Readonly<{
  authority_evaluation: string;
  constitutional_validation: string;
  governance_outcome: string;
  mission_authorization: string;
  replay_status: string;
  reuse_policy_evaluation: string;
  rationale: string;
  explanation_complete: boolean;
  integrity_hash: string;
}>;

export type MemoryGovernanceRecord = Readonly<{
  governance_id: string;
  memory_id: string;
  tenant_id: string;
  mission_id: string;
  requester: "MemoryGovernanceValidator";
  identity_validation: GovernanceValidationReport;
  authority_validation: GovernanceValidationReport;
  constitutional_validation: GovernanceValidationReport;
  governance_validation: GovernanceValidationReport;
  mission_authorization: GovernanceValidationReport;
  replay_validation: GovernanceValidationReport;
  reuse_policy_result: GovernanceValidationReport;
  integrity_validation: GovernanceValidationReport;
  final_decision: MemoryReuseDecision;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  explanation: GovernanceDecisionExplanation;
  source_qualification_hash: string;
  integrity_hash: string;
}>;

export type GovernanceMemoryLedgerEntry = Readonly<{
  ledger_id: string;
  governance_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "REUSE_REQUEST"
    | "IDENTITY_VALIDATION"
    | "AUTHORITY_VALIDATION"
    | "CONSTITUTIONAL_VALIDATION"
    | "GOVERNANCE_APPROVAL"
    | "MISSION_AUTHORIZATION"
    | "REPLAY_VALIDATION"
    | "REUSE_POLICY_DECISION"
    | "FINAL_DECISION"
    | "INTEGRITY_VERIFICATION";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type GovernanceMemoryControlContract = Readonly<{
  contract_id: "governance-aware-memory-control-contract";
  version: "governance-aware-memory-control/v1";
  architecture: readonly string[];
  validators: readonly GovernanceControlValidator[];
  decision_outcomes: readonly MemoryReuseDecision[];
  reuse_authorization_rules: readonly string[];
  automatic_rejection_rules: readonly string[];
  cross_mission_rules: readonly string[];
  cross_tenant_rules: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  governance_before_memory: true;
  constitution_supreme: true;
  memory_grants_authority: false;
  cross_tenant_blocked_by_default: true;
  integrity_hash: string;
}>;

export type GovernanceMemoryControlMetrics = Readonly<{
  reuse_requests: number;
  approvals: number;
  denials: number;
  governance_escalations: number;
  constitutional_violations: number;
  authority_failures: number;
  replay_failures: number;
  mission_authorization_failures: number;
  blocked_cross_tenant_requests: number;
  decision_latency_ms: number;
  failures: readonly GovernanceMemoryControlFailure[];
  integrity_hash: string;
}>;

export type GovernanceMemoryControlApiSurface = Readonly<{
  api_id: string;
  establish_control: "POST /governance-aware-memory-control/establish";
  retrieve_contract: "GET /governance-aware-memory-control/contract";
  retrieve_records: "POST /governance-aware-memory-control/records";
  retrieve_authority: "POST /governance-aware-memory-control/authority";
  retrieve_constitutional: "POST /governance-aware-memory-control/constitutional";
  retrieve_reuse_policy: "POST /governance-aware-memory-control/reuse-policy";
  retrieve_ledger: "POST /governance-aware-memory-control/ledger";
  retrieve_metrics: "POST /governance-aware-memory-control/metrics";
  replay_control: "POST /governance-aware-memory-control/replay";
  inspect_control: "POST /governance-aware-memory-control/inspect";
  governance_bypass_supported: false;
  authority_expansion_supported: false;
  cross_tenant_default_supported: false;
  integrity_hash: string;
}>;

export type GovernanceMemoryControlInput = Readonly<{
  scenario?: GovernanceMemoryControlScenario;
  qualification_result?: MemoryQualificationResult;
}>;

export type GovernanceMemoryControlResult = Readonly<{
  governance_memory_control_version: "governance-aware-memory-control/v1";
  control_identifier: "GovernanceAwareMemoryControl";
  status: GovernanceMemoryControlStatus;
  api_surface: GovernanceMemoryControlApiSurface;
  qualification_result: MemoryQualificationResult;
  contract: GovernanceMemoryControlContract;
  source_qualification_records: readonly MemoryQualificationRecord[];
  governance_records: readonly MemoryGovernanceRecord[];
  governance_ledger: readonly GovernanceMemoryLedgerEntry[];
  metrics: GovernanceMemoryControlMetrics;
  failures: readonly GovernanceMemoryControlFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  governance_enforced: boolean;
  constitutional_protections_preserved: boolean;
  authority_boundaries_preserved: boolean;
  cross_tenant_blocked_by_default: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type GovernanceMemoryControl = Readonly<{
  governance_memory_control_version: "governance-aware-memory-control/v1";
  supported_validators: readonly GovernanceControlValidator[];
  supported_decisions: readonly MemoryReuseDecision[];
  api_surface: GovernanceMemoryControlApiSurface;
  result: GovernanceMemoryControlResult;
}>;
