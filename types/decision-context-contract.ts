import type { DecisionCandidate } from "@/types/decision-input-normalization";

export type DecisionContextSchemaVersion = "9.3.1";
export type DecisionContextLifecycleState = "DRAFT" | "UNDER_CONSTRUCTION" | "VALIDATED" | "CERTIFIED" | "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type DecisionContextValidationState = "UNVALIDATED" | "VALID" | "INVALID" | "REJECTED" | "CERTIFIED";

export type DecisionContextDomainName =
  | "mission_context"
  | "tenant_context"
  | "operator_context"
  | "evidence_context"
  | "dependency_context"
  | "risk_context"
  | "confidence_context"
  | "governance_context"
  | "constitutional_context"
  | "runtime_context"
  | "recovery_context"
  | "forecast_context"
  | "historical_context"
  | "replay_context";

export type DecisionContextFailureReason =
  | "CONTEXT_MISSING"
  | "SCHEMA_VERSION_MISMATCH"
  | "IDENTITY_MISMATCH"
  | "REQUIRED_FIELD_MISSING"
  | "MANDATORY_DOMAIN_MISSING"
  | "DOMAIN_EXPLAINABILITY_MISSING"
  | "COMPLETENESS_INVALID"
  | "GOVERNANCE_UNAVAILABLE"
  | "CONSTITUTIONAL_UNAVAILABLE"
  | "REPLAY_UNAVAILABLE"
  | "INTEGRITY_MISMATCH"
  | "TENANT_ISOLATION_VIOLATION"
  | "AUTHORITY_UNDEFINED"
  | "ADVISORY_ONLY_VIOLATION"
  | "INVALID_LIFECYCLE_TRANSITION"
  | "NONDETERMINISTIC_SERIALIZATION";

export type DecisionContextDomain = Readonly<{
  domain_name: DecisionContextDomainName;
  required: boolean;
  status: "COMPLETE" | "MISSING" | "UNAVAILABLE";
  source_subsystem: string;
  originating_record: string;
  resolver: string;
  supporting_evidence: readonly string[];
  confidence: number;
  governance_rationale: string;
  constitutional_rationale: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ContextIdentity = Readonly<{
  context_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  schema_version: DecisionContextSchemaVersion;
  context_version: number;
  integrity_hash: string;
}>;

export type DecisionContextIntegrity = Readonly<{
  integrity_hash: string;
  schema_hash: string;
  domain_hashes: Readonly<Record<DecisionContextDomainName, string>>;
  replay_hash: string;
  validation_hash: string;
}>;

export type DecisionContext = Readonly<{
  context_id: string;
  context_version: number;
  schema_version: DecisionContextSchemaVersion;
  decision_candidate_id: string;
  mission_context: DecisionContextDomain;
  tenant_context: DecisionContextDomain;
  operator_context: DecisionContextDomain;
  evidence_context: DecisionContextDomain;
  dependency_context: DecisionContextDomain;
  risk_context: DecisionContextDomain;
  confidence_context: DecisionContextDomain;
  governance_context: DecisionContextDomain;
  constitutional_context: DecisionContextDomain;
  runtime_context: DecisionContextDomain;
  recovery_context: DecisionContextDomain;
  forecast_context: DecisionContextDomain;
  historical_context: DecisionContextDomain;
  replay_context: DecisionContextDomain;
  missing_context: readonly DecisionContextDomainName[];
  context_completeness_score: number;
  lifecycle_state: DecisionContextLifecycleState;
  validation_state: DecisionContextValidationState;
  created_timestamp: string;
  created_by: string;
  identity: ContextIdentity;
  integrity: DecisionContextIntegrity;
  integrity_hash: string;
}>;

export type DecisionContextValidationResult = Readonly<{
  validation_state: DecisionContextValidationState;
  failures: readonly DecisionContextFailureReason[];
  checks: Readonly<{
    schema_valid: boolean;
    identity_valid: boolean;
    required_fields_present: boolean;
    domains_valid: boolean;
    completeness_valid: boolean;
    governance_valid: boolean;
    constitutional_valid: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only: boolean;
  }>;
}>;

export type DecisionContextLifecycleTransition = Readonly<{
  transition_id: string;
  context_id: string;
  from_state: DecisionContextLifecycleState;
  to_state: DecisionContextLifecycleState;
  transition_valid: boolean;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type DecisionContextReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  context_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_validation_state: DecisionContextValidationState;
  reconstructed_completeness_score: number;
  failures: readonly DecisionContextFailureReason[];
  integrity_hash: string;
}>;

export type DecisionContextObservability = Readonly<{
  contexts_created: number;
  validation_failures: number;
  mandatory_domain_failures: number;
  governance_failures: number;
  constitutional_failures: number;
  replay_failures: number;
  integrity_failures: number;
  tenant_isolation_failures: number;
  average_completeness_score: number;
  lifecycle_distribution: Readonly<Record<DecisionContextLifecycleState, number>>;
}>;

export type DecisionContextBuildInput = Readonly<{
  candidate?: DecisionCandidate;
  context_version?: number;
  lifecycle_state?: DecisionContextLifecycleState;
  validation_state?: DecisionContextValidationState;
  missing_context?: readonly DecisionContextDomainName[];
  domain_overrides?: Partial<Record<DecisionContextDomainName, Partial<DecisionContextDomain>>>;
  schema_version?: DecisionContextSchemaVersion;
  created_by?: string;
}>;
