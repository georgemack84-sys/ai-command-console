export type AutonomyQueryType =
  | "PLAN_LOOKUP"
  | "EXECUTION_LOOKUP"
  | "DELEGATION_LOOKUP"
  | "SUPERVISION_LOOKUP"
  | "REPLAY_LOOKUP"
  | "INTERVENTION_LOOKUP"
  | "POLICY_LOOKUP"
  | "HISTORICAL_RECONSTRUCTION"
  | "LINEAGE_SEARCH"
  | "CROSS_REFERENCE_SEARCH";

export type AutonomyQueryScope = "MISSION" | "TENANT" | "OBJECT" | "EXECUTION" | "PLAN" | "REPLAY" | "LINEAGE" | "TIME_WINDOW";
export type AutonomyQueryLifecycleState = "CREATED" | "AUTHORIZED" | "VALIDATED" | "EXECUTING" | "COLLECTING_RESULTS" | "ORDERING_RESULTS" | "RETURNED" | "AUDITED" | "COMPLETED";
export type AutonomyQueryAuthorizationLevel = "READ_ONLY" | "AUDITOR" | "OPERATOR" | "GOVERNANCE" | "SYSTEM" | "CERTIFICATION";

export type AutonomyQueryErrorState =
  | "INVALID_QUERY"
  | "INVALID_SCHEMA"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "OBJECT_NOT_FOUND"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "UNSUPPORTED_QUERY_TYPE"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "GOVERNANCE_REJECTION"
  | "CONSTITUTIONAL_REJECTION";

export type AutonomyQueryTimeRange = Readonly<{
  start_timestamp: string;
  end_timestamp: string;
}>;

export type AutonomyQueryFilters = Readonly<{
  execution_state?: readonly string[];
  confidence?: Readonly<{ min?: number; max?: number }>;
  policy?: readonly string[];
  risk_level?: readonly string[];
  authority?: readonly string[];
  task_type?: readonly string[];
  intervention_type?: readonly string[];
  health_state?: readonly string[];
  tenant_id?: string;
  mission_id?: string;
  include_hidden?: boolean;
}>;

export type AutonomyQueryAuthorizationContext = Readonly<{
  operator_role: AutonomyQueryAuthorizationLevel;
  authority_level: AutonomyQueryAuthorizationLevel;
  governance_permissions: readonly string[];
  tenant_permissions: readonly string[];
  constitutional_validation: boolean;
  read_only: true;
  tenant_membership_verified: boolean;
  mission_access_verified: boolean;
  policy_authorized: boolean;
}>;

export type AutonomyQueryContract = Readonly<{
  autonomy_query_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  query_type: AutonomyQueryType;
  query_scope: AutonomyQueryScope;
  target_reference: string;
  time_range: AutonomyQueryTimeRange;
  filters: AutonomyQueryFilters;
  authorization_context: AutonomyQueryAuthorizationContext;
  replay_reference: string;
  lineage_reference: string;
  created_timestamp: string;
  deterministic_ordering: readonly ["tenant_id", "mission_id", "timestamp", "event_sequence", "immutable_record_id"];
  lifecycle_state: AutonomyQueryLifecycleState;
  query_version: "autonomy-query/v8I.1";
  contract_version: "autonomy-query-contract/v8I.1";
  schema_version: "autonomy-query-schema/v8I.1";
  normalization_version: "autonomy-query-normalization/v8I.1";
  validation_version: "autonomy-query-validation/v8I.1";
  read_only_enforced: true;
  no_execution_permitted: true;
  query_hash: string;
}>;

export type AutonomyQueryScenario =
  | "BASELINE"
  | "MISSING_QUERY_ID"
  | "MISSING_TENANT"
  | "INVALID_MISSION"
  | "MISSING_OPERATOR"
  | "UNSUPPORTED_QUERY_TYPE"
  | "UNAUTHORIZED_OPERATOR"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "OBJECT_NOT_FOUND"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "GOVERNANCE_REJECTION"
  | "CONSTITUTIONAL_REJECTION"
  | "READ_ONLY_VIOLATION"
  | "HIDDEN_STATE_REQUEST"
  | "UNSUPPORTED_CONTRACT_VERSION";

export type AutonomyQueryContractInput = Readonly<{
  scenario?: AutonomyQueryScenario;
  tenant_id?: string;
  mission_id?: string;
  operator_id?: string;
  query_type?: AutonomyQueryType;
  query_scope?: AutonomyQueryScope;
  target_reference?: string;
  authorization_level?: AutonomyQueryAuthorizationLevel;
  contract?: AutonomyQueryContract;
}>;

export type AutonomyQueryValidationIssue = Readonly<{
  state: AutonomyQueryErrorState;
  path: string;
  message: string;
}>;

export type AutonomyQueryValidationResult = Readonly<{
  autonomy_query_id: string | null;
  valid: boolean;
  lifecycle_state: AutonomyQueryLifecycleState;
  errors: readonly AutonomyQueryValidationIssue[];
  normalized_query_hash: string | null;
  authorization_verified: boolean;
  tenant_isolated: boolean;
  mission_scoped: boolean;
  replay_compatible: boolean;
  lineage_compatible: boolean;
  governance_compliant: boolean;
  constitutionally_compliant: boolean;
  read_only: boolean;
  validation_hash: string;
}>;

export type AutonomyQueryAuditRecord = Readonly<{
  query_audit_id: string;
  autonomy_query_id: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  query_type: AutonomyQueryType;
  query_scope: AutonomyQueryScope;
  authorization_result: "APPROVED" | "REJECTED";
  returned_record_count: number;
  execution_duration: string;
  replay_reference: string;
  lineage_reference: string;
  result_hash: string;
  audit_timestamp: string;
  audit_hash: string;
  append_only: true;
}>;

export type AutonomyQueryTypeRegistryEntry = Readonly<{
  query_type: AutonomyQueryType;
  searches: readonly string[];
  returns: string;
  minimum_authority: AutonomyQueryAuthorizationLevel;
}>;

export type AutonomyQueryObservabilitySurface = Readonly<{
  autonomy_query_id: string;
  query_type: AutonomyQueryType;
  query_scope: AutonomyQueryScope;
  tenant_id: string;
  mission_id: string;
  valid: boolean;
  errors: readonly AutonomyQueryErrorState[];
  query_hash: string;
  audit_hash: string;
}>;
