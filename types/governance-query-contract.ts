export type GovernanceQueryType =
  | "POLICY_LOOKUP"
  | "RECOMMENDATION_LOOKUP"
  | "VIOLATION_LOOKUP"
  | "ESCALATION_LOOKUP"
  | "RISK_LOOKUP"
  | "COMPLIANCE_LOOKUP"
  | "EVIDENCE_LOOKUP"
  | "LINEAGE_LOOKUP"
  | "REPLAY_LOOKUP"
  | "GOVERNANCE_TIMELINE"
  | "GOVERNANCE_HISTORY"
  | "CROSS_LEDGER_QUERY";

export type GovernanceQueryTargetObject =
  | "POLICY"
  | "RECOMMENDATION"
  | "EVIDENCE"
  | "COMPLIANCE_EVALUATION"
  | "RISK_ASSESSMENT"
  | "ESCALATION"
  | "GOVERNANCE_DECISION"
  | "AUTHORITY_ASSIGNMENT"
  | "REPLAY_SESSION"
  | "REPLAY_SNAPSHOT"
  | "LINEAGE_CHAIN"
  | "INTEGRITY_RECORD"
  | "CERTIFICATION_RESULT"
  | "TRUTH_RECORD";

export type GovernanceQueryScope =
  | "CONSTITUTION"
  | "POLICY"
  | "AUTHORITY"
  | "RISK"
  | "COMPLIANCE"
  | "ESCALATION"
  | "RECOMMENDATION"
  | "REPLAY"
  | "INTEGRITY"
  | "CERTIFICATION";

export type GovernanceQueryAuthorizationLevel = "READ_ONLY" | "AUDITOR" | "OPERATOR" | "GOVERNANCE" | "SYSTEM" | "CERTIFICATION";

export type GovernanceQueryLifecycleState = "CREATED" | "VALIDATED" | "AUTHORIZED" | "NORMALIZED" | "EXECUTED" | "RESULTS_GENERATED" | "AUDITED" | "ARCHIVED";

export type GovernanceQueryErrorState =
  | "INVALID_QUERY"
  | "INVALID_SCOPE"
  | "INVALID_REPLAY_REFERENCE"
  | "INVALID_LINEAGE_REFERENCE"
  | "UNAUTHORIZED"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "UNSUPPORTED_QUERY"
  | "VALIDATION_FAILED";

export type GovernanceQueryLineageMode = "PARENT_ONLY" | "CHILDREN_ONLY" | "FULL_ANCESTRY" | "FULL_DESCENDANTS" | "ENTIRE_LINEAGE_TREE" | "ROOT_LINEAGE" | "SUPERSESSION_HISTORY";

export type GovernanceQueryReplayScope = Readonly<{
  replay_id: string;
  replay_hash: string;
  truth_record_reference: string;
  ledger_reference: string;
  reconstruction_version: "governance-query-reconstruction/v7J.1";
}>;

export type GovernanceQueryFilters = Readonly<{
  tenant?: string;
  mission?: string;
  policy?: readonly string[];
  authority?: readonly string[];
  severity?: readonly string[];
  confidence?: Readonly<{ min?: number; max?: number }>;
  compliance_state?: readonly string[];
  risk_level?: readonly string[];
  recommendation_type?: readonly string[];
  evidence_type?: readonly string[];
  governance_state?: readonly string[];
  escalation_level?: readonly string[];
  version?: readonly string[];
  lineage_depth?: number;
}>;

export type GovernanceQueryTimeRange = Readonly<{ start: string; end: string }>;

export type GovernanceQueryContract = Readonly<{
  query_id: string;
  tenant_id: string;
  mission_id: string;
  query_type: GovernanceQueryType;
  target_object: GovernanceQueryTargetObject;
  filters: GovernanceQueryFilters;
  time_range: GovernanceQueryTimeRange;
  policy_scope: readonly string[];
  governance_scope: readonly GovernanceQueryScope[];
  authority_scope: readonly GovernanceQueryAuthorizationLevel[];
  lineage_scope: Readonly<{ mode: GovernanceQueryLineageMode; max_depth: number; lineage_reference: string }>;
  replay_scope: GovernanceQueryReplayScope;
  evidence_requirements: readonly string[];
  requested_by: string;
  authorization_level: GovernanceQueryAuthorizationLevel;
  authorization_context: Readonly<{ tenant_membership_verified: boolean; constitutional_authority_verified: boolean; read_only: true; permissions: readonly string[] }>;
  deterministic_ordering: readonly ["TENANT", "MISSION", "GOVERNANCE_TIMESTAMP", "LEDGER_SEQUENCE", "LINEAGE_HIERARCHY", "IMMUTABLE_IDENTIFIER"];
  lifecycle_state: GovernanceQueryLifecycleState;
  query_version: "governance-query/v7J.1";
  contract_version: "governance-query-contract/v7J.1";
  schema_version: "governance-query-schema/v7J.1";
  normalization_version: "governance-query-normalization/v7J.1";
  validation_version: "governance-query-validation/v7J.1";
  created_timestamp: string;
  query_hash: string;
}>;

export type GovernanceQueryContractInput = Readonly<{
  scenario?: GovernanceQueryScenario;
  tenant_id?: string;
  mission_id?: string;
  requested_by?: string;
  query_type?: GovernanceQueryType;
  target_object?: GovernanceQueryTargetObject;
  authorization_level?: GovernanceQueryAuthorizationLevel;
  contract?: GovernanceQueryContract;
}>;

export type GovernanceQueryScenario =
  | "BASELINE"
  | "MISSING_TENANT"
  | "INVALID_MISSION"
  | "AUTHORIZATION_MISSING"
  | "AUTHORIZATION_INSUFFICIENT"
  | "UNSUPPORTED_TARGET"
  | "UNSUPPORTED_QUERY"
  | "INVALID_LINEAGE_REFERENCE"
  | "INVALID_REPLAY_SCOPE"
  | "MUTABLE_FILTERS"
  | "ORDERING_ABSENT"
  | "UNSUPPORTED_CONTRACT_VERSION"
  | "GOVERNANCE_SCOPE_UNDEFINED"
  | "CONSTITUTIONAL_VIOLATION"
  | "TENANT_ISOLATION_VIOLATION";

export type GovernanceQueryValidationIssue = Readonly<{
  state: GovernanceQueryErrorState;
  path: string;
  message: string;
}>;

export type GovernanceQueryValidationResult = Readonly<{
  query_id: string | null;
  valid: boolean;
  lifecycle_state: GovernanceQueryLifecycleState;
  errors: readonly GovernanceQueryValidationIssue[];
  normalized_query_hash: string | null;
  authorization_verified: boolean;
  tenant_isolated: boolean;
  replay_verified: boolean;
  lineage_verified: boolean;
  read_only: boolean;
  validation_hash: string;
}>;

export type GovernanceQueryAuditRecord = Readonly<{
  audit_id: string;
  query_id: string;
  tenant_id: string;
  mission_id: string;
  requested_by: string;
  authorization_level: GovernanceQueryAuthorizationLevel;
  query_type: GovernanceQueryType;
  target_object: GovernanceQueryTargetObject;
  filters: GovernanceQueryFilters;
  execution_timestamp: string;
  result_count: number;
  replay_reference: string;
  lineage_reference: string;
  query_hash: string;
  contract_version: string;
  audit_hash: string;
}>;

export type GovernanceQueryObservabilitySurface = Readonly<{
  query_id: string;
  query_type: GovernanceQueryType;
  target_object: GovernanceQueryTargetObject;
  tenant_id: string;
  mission_id: string;
  valid: boolean;
  errors: readonly GovernanceQueryErrorState[];
  query_hash: string;
  audit_hash: string;
}>;
