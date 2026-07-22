import type { GovernanceMemoryControlResult, MemoryGovernanceRecord } from "@/types/governance-aware-memory-control";

export type TenantIsolationStatus = "AUTHORITATIVE" | "REJECTED";

export type IsolationDecision = "AUTHORIZED" | "BLOCKED" | "REQUIRES_CROSS_TENANT_APPROVAL";

export type IsolationValidator =
  | "IDENTITY_AUTHENTICATION"
  | "TENANT_VALIDATION"
  | "PRIVACY_BOUNDARY_VALIDATION"
  | "SEGMENTATION_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "CROSS_TENANT_GUARD"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VERIFICATION";

export type TenantIsolationFailure =
  | "GOVERNANCE_CONTROL_UNAVAILABLE"
  | "TENANT_MEMORY_LEAK"
  | "UNAUTHORIZED_RETRIEVAL_SUCCEEDED"
  | "UNAUTHORIZED_INDEXING_OCCURRED"
  | "HIDDEN_SHARING_DETECTED"
  | "PRIVILEGE_ESCALATION_SUCCEEDED"
  | "GOVERNANCE_VALIDATION_BYPASSED"
  | "CONSTITUTIONAL_PROTECTION_VIOLATED"
  | "REPLAY_VALIDATION_OMITTED"
  | "SEGMENTATION_COMPROMISED"
  | "DETERMINISTIC_ISOLATION_FAILED"
  | "PRIVACY_BOUNDARY_VIOLATED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_ACCESS_NOT_APPROVED";

export type TenantIsolationScenario =
  | "BASELINE"
  | "GOVERNANCE_CONTROL_UNAVAILABLE"
  | "TENANT_MEMORY_LEAK"
  | "UNAUTHORIZED_RETRIEVAL"
  | "UNAUTHORIZED_INDEXING"
  | "HIDDEN_SHARING"
  | "PRIVILEGE_ESCALATION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_OMITTED"
  | "SEGMENTATION_FAILURE"
  | "NONDETERMINISTIC_ISOLATION"
  | "PRIVACY_VIOLATION"
  | "INCOMPLETE_EVIDENCE"
  | "CROSS_TENANT_ATTEMPT";

export type IsolationValidationReport = Readonly<{
  validator: IsolationValidator;
  valid: boolean;
  deterministic: boolean;
  replayable: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type TenantSegment = Readonly<{
  segment_id: string;
  tenant_id: string;
  organization_id: string;
  mission_id: string;
  operational_domain: string;
  governance_scope: string;
  classification_level: "TENANT_PRIVATE";
  encrypted_partition_hash: string;
  independently_indexed: true;
  independently_replayable: true;
  independently_governed: true;
  integrity_hash: string;
}>;

export type TenantIsolationRecord = Readonly<{
  isolation_id: string;
  requester_id: "TenantIsolationEngine";
  requester_tenant: string;
  target_tenant: string;
  memory_id: string;
  mission_id: string;
  authorization_status: IsolationDecision;
  identity_authentication: IsolationValidationReport;
  tenant_validation: IsolationValidationReport;
  privacy_validation: IsolationValidationReport;
  segmentation_validation: IsolationValidationReport;
  governance_validation: IsolationValidationReport;
  cross_tenant_policy: IsolationValidationReport;
  replay_validation: IsolationValidationReport;
  integrity_validation: IsolationValidationReport;
  final_decision: IsolationDecision;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  segment: TenantSegment;
  source_governance_hash: string;
  integrity_hash: string;
}>;

export type IsolationLedgerEntry = Readonly<{
  ledger_id: string;
  isolation_id: string;
  memory_id: string;
  tenant_id: string;
  event:
    | "ACCESS_REQUEST"
    | "TENANT_VALIDATION"
    | "PRIVACY_VALIDATION"
    | "SEGMENTATION_VALIDATION"
    | "GOVERNANCE_APPROVAL"
    | "REPLAY_VALIDATION"
    | "AUTHORIZATION_DECISION"
    | "BLOCKED_REQUEST"
    | "CROSS_TENANT_ATTEMPT"
    | "INTEGRITY_VERIFICATION";
  append_only: true;
  immutable: true;
  deterministic: true;
  replayable: true;
  tenant_isolated: boolean;
  cryptographically_verified: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationContract = Readonly<{
  contract_id: "tenant-isolation-privacy-enforcement-contract";
  version: "tenant-isolation-privacy-enforcement/v1";
  architecture: readonly string[];
  validators: readonly IsolationValidator[];
  decisions: readonly IsolationDecision[];
  isolation_rules: readonly string[];
  automatic_rejection_rules: readonly string[];
  isolation_guarantees: readonly string[];
  privacy_guarantees: readonly string[];
  security_requirements: readonly string[];
  replay_requirements: readonly string[];
  isolation_by_default: true;
  zero_implicit_sharing: true;
  privacy_before_intelligence: true;
  cross_tenant_blocked_by_default: true;
  integrity_hash: string;
}>;

export type TenantIsolationMetrics = Readonly<{
  access_requests: number;
  authorization_approvals: number;
  authorization_denials: number;
  blocked_cross_tenant_requests: number;
  privacy_violations: number;
  segmentation_failures: number;
  privilege_escalation_attempts: number;
  hidden_sharing_attempts: number;
  replay_validation_failures: number;
  isolation_latency_ms: number;
  failures: readonly TenantIsolationFailure[];
  integrity_hash: string;
}>;

export type TenantIsolationApiSurface = Readonly<{
  api_id: string;
  establish_enforcement: "POST /tenant-isolation-privacy-enforcement/establish";
  retrieve_contract: "GET /tenant-isolation-privacy-enforcement/contract";
  retrieve_records: "POST /tenant-isolation-privacy-enforcement/records";
  retrieve_privacy: "POST /tenant-isolation-privacy-enforcement/privacy";
  retrieve_segmentation: "POST /tenant-isolation-privacy-enforcement/segmentation";
  retrieve_cross_tenant: "POST /tenant-isolation-privacy-enforcement/cross-tenant";
  retrieve_ledger: "POST /tenant-isolation-privacy-enforcement/ledger";
  retrieve_metrics: "POST /tenant-isolation-privacy-enforcement/metrics";
  replay_enforcement: "POST /tenant-isolation-privacy-enforcement/replay";
  inspect_enforcement: "POST /tenant-isolation-privacy-enforcement/inspect";
  implicit_sharing_supported: false;
  cross_tenant_default_supported: false;
  privilege_escalation_supported: false;
  integrity_hash: string;
}>;

export type TenantIsolationInput = Readonly<{
  scenario?: TenantIsolationScenario;
  governance_result?: GovernanceMemoryControlResult;
}>;

export type TenantIsolationResult = Readonly<{
  tenant_isolation_version: "tenant-isolation-privacy-enforcement/v1";
  enforcement_identifier: "TenantIsolationPrivacyEnforcement";
  status: TenantIsolationStatus;
  api_surface: TenantIsolationApiSurface;
  governance_result: GovernanceMemoryControlResult;
  contract: TenantIsolationContract;
  source_governance_records: readonly MemoryGovernanceRecord[];
  isolation_records: readonly TenantIsolationRecord[];
  segments: readonly TenantSegment[];
  isolation_ledger: readonly IsolationLedgerEntry[];
  metrics: TenantIsolationMetrics;
  failures: readonly TenantIsolationFailure[];
  deterministic: boolean;
  replayable: boolean;
  privacy_preserved: boolean;
  tenant_isolated: boolean;
  segmentation_enforced: boolean;
  cross_tenant_blocked_by_default: true;
  zero_implicit_sharing: true;
  replay_hash: string;
  integrity_hash: string;
}>;

export type TenantIsolationEnforcement = Readonly<{
  tenant_isolation_version: "tenant-isolation-privacy-enforcement/v1";
  supported_validators: readonly IsolationValidator[];
  supported_decisions: readonly IsolationDecision[];
  api_surface: TenantIsolationApiSurface;
  result: TenantIsolationResult;
}>;
