import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";

export type QuerySecurityProtectedService =
  | "PLAN_LOOKUP"
  | "EXECUTION_LOOKUP"
  | "DELEGATION_LOOKUP"
  | "ORCHESTRATION_LOOKUP"
  | "SUPERVISION_LOOKUP"
  | "INTERVENTION_LOOKUP"
  | "BOUNDARY_LOOKUP"
  | "REPLAY_QUERY"
  | "HISTORICAL_RECONSTRUCTION"
  | "LINEAGE_SEARCH"
  | "CROSS_REFERENCE_SEARCH";

export type QueryOperatorRole = "SYSTEM_ADMIN" | "TENANT_ADMIN" | "MISSION_OPERATOR" | "MISSION_OBSERVER" | "GOVERNANCE_OFFICER" | "AUDITOR" | "SECURITY_OFFICER";
export type QueryOperation = "SEARCH" | "LOOKUP" | "RECONSTRUCT" | "INSPECT" | "TRACE" | "VIEW" | "VERIFY" | "CREATE" | "UPDATE" | "DELETE" | "PATCH" | "EXECUTE" | "APPROVE" | "ROLLBACK" | "RESUME" | "PAUSE" | "REROUTE" | "REASSIGN" | "MODIFY_LINEAGE" | "MODIFY_REPLAY" | "MODIFY_INTEGRITY";

export type QuerySecurityDecisionState =
  | "AUTHORIZED"
  | "DENIED"
  | "MISSION_SCOPE_VIOLATION"
  | "TENANT_SCOPE_VIOLATION"
  | "ROLE_VIOLATION"
  | "POLICY_REJECTED"
  | "GOVERNANCE_REJECTED"
  | "CONSTITUTION_REJECTED"
  | "READ_ONLY_VIOLATION";

export type QuerySecurityErrorState =
  | "UNAUTHORIZED"
  | "AUTHENTICATION_FAILED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "ROLE_VIOLATION"
  | "READ_ONLY_VIOLATION"
  | "POLICY_REJECTED"
  | "GOVERNANCE_REJECTED"
  | "CONSTITUTION_REJECTED"
  | "CROSS_TENANT_ACCESS"
  | "QUERY_MUTATION_ATTEMPT"
  | "REPLAY_TAMPERING_DETECTED"
  | "INVALID_SECURITY_CONTEXT";

export type QuerySecurityScenario =
  | "BASELINE"
  | "AUTHENTICATION_FAILED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "ROLE_VIOLATION"
  | "READ_ONLY_VIOLATION"
  | "POLICY_REJECTED"
  | "GOVERNANCE_REJECTED"
  | "CONSTITUTION_REJECTED"
  | "CROSS_TENANT_ACCESS"
  | "QUERY_MUTATION_ATTEMPT"
  | "REPLAY_TAMPERING_DETECTED"
  | "INVALID_SECURITY_CONTEXT";

export type QuerySecurityState = "SECURITY_APPROVED" | QuerySecurityErrorState;

export type QueryAuthorizationRecord = Readonly<{
  authorization_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  role: QueryOperatorRole;
  requested_scope: QuerySecurityProtectedService;
  authorization_result: QuerySecurityDecisionState;
  governance_reference: string;
  policy_reference: string;
  replay_reference: string;
  authorization_timestamp: string;
  authorization_hash: string;
}>;

export type TenantIsolationResult = Readonly<{
  tenant_filter_id: string;
  tenant_exists: boolean;
  tenant_active: boolean;
  tenant_matches_request: boolean;
  tenant_matches_target_records: boolean;
  tenant_matches_replay: boolean;
  tenant_matches_lineage: boolean;
  tenant_matches_integrity: boolean;
  cross_tenant_detected: boolean;
  isolation_hash: string;
}>;

export type ReadOnlyEnforcementResult = Readonly<{
  enforcement_id: string;
  requested_operation: QueryOperation;
  operation_allowed: boolean;
  prohibited_operation_detected: boolean;
  immutable_record_protection: "ENFORCED" | "VIOLATED";
  enforcement_hash: string;
}>;

export type QuerySecurityRecord = Readonly<{
  security_event_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  query_id: string;
  requested_operation: QueryOperation;
  security_decision: QuerySecurityDecisionState;
  rejection_reason: string | null;
  policy_reference: string;
  governance_reference: string;
  replay_reference: string;
  integrity_hash: string;
  security_timestamp: string;
  security_hash: string;
}>;

export type QuerySecurityAuditRecord = Readonly<{
  audit_id: string;
  query_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  role: QueryOperatorRole;
  requested_scope: QuerySecurityProtectedService;
  authorization_result: QuerySecurityDecisionState;
  records_returned: number;
  result_hash: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type QuerySecurityTenantIsolationResponse = Readonly<{
  phase_version: "8I.9";
  schema_version: "query-security-tenant-isolation/v8I.9";
  security_validation_id: string;
  security_state: QuerySecurityState;
  protected_service: QuerySecurityProtectedService;
  requested_operation: QueryOperation;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  role: QueryOperatorRole;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  authorization_record: QueryAuthorizationRecord;
  tenant_isolation: TenantIsolationResult;
  read_only_enforcement: ReadOnlyEnforcementResult;
  security_record: QuerySecurityRecord;
  audit_record: QuerySecurityAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  result_hash: string | null;
  read_only: true;
  fail_closed: true;
}>;

export type QuerySecurityTenantIsolationInput = Readonly<{
  scenario?: QuerySecurityScenario;
  protected_service?: QuerySecurityProtectedService;
  requested_operation?: QueryOperation;
  role?: QueryOperatorRole;
  query_contract?: AutonomyQueryContract;
  records_returned?: number;
}>;

export type QuerySecurityTenantIsolationObservabilitySurface = Readonly<{
  security_validation_id: string;
  security_state: QuerySecurityState;
  protected_service: QuerySecurityProtectedService;
  requested_operation: QueryOperation;
  tenant_id: string;
  mission_id: string;
  authorization_result: QuerySecurityDecisionState;
  cross_tenant_detected: boolean;
  read_only_enforced: boolean;
  errors: readonly QuerySecurityErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
