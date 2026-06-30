import type { AutonomyQueryContract, AutonomyQueryValidationIssue, AutonomyQueryValidationResult } from "@/types/autonomy-query-contract";
import type { AutonomySearchResponse } from "@/types/autonomy-search-engine";

export type SupervisionInterventionBoundaryLookupType =
  | "SUPERVISION"
  | "INTERVENTION"
  | "BOUNDARY"
  | "SUPERVISION_INTERVENTION_BOUNDARY"
  | "RUNTIME_VIOLATION"
  | "BOUNDARY_REJECTION"
  | "HISTORICAL_RECONSTRUCTION";

export type RuntimeHealthLevel = "OPTIMAL" | "HEALTHY" | "STABLE" | "DEGRADED" | "HIGH_RISK" | "CRITICAL";
export type SupervisionType = "DRIFT_MONITORING" | "POLICY_VIOLATION" | "CONSTITUTIONAL_VALIDATION" | "EXECUTION_HEALTH" | "RUNTIME_CONFIDENCE" | "RECOMMENDATION_VALIDITY";
export type InterventionType = "PAUSE" | "ROLLBACK" | "ESCALATION" | "CONTAINMENT" | "OPERATOR_REVIEW";
export type BoundaryType = "AUTHORITY" | "GOVERNANCE" | "EXECUTION_LIMIT" | "TENANT_ISOLATION" | "CONSTITUTIONAL_COMPLIANCE" | "REJECTED_AUTHORITY_ESCALATION" | "REJECTED_HIDDEN_EXECUTION" | "REJECTED_GOVERNANCE_BYPASS";

export type SupervisionInterventionBoundaryLookupErrorState =
  | "INVALID_LOOKUP"
  | "SUPERVISION_RECORD_NOT_FOUND"
  | "INTERVENTION_RECORD_NOT_FOUND"
  | "BOUNDARY_EVENT_NOT_FOUND"
  | "MISSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "INVALID_BOUNDARY_REFERENCE"
  | "INVALID_POLICY_REFERENCE"
  | "INVALID_CONSTITUTION_REFERENCE"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE";

export type SupervisionInterventionBoundaryLookupState = "LOOKUP_RETURNED" | "NO_RESULTS" | SupervisionInterventionBoundaryLookupErrorState;

export type SupervisionInterventionBoundaryLookupScenario =
  | "BASELINE"
  | "SUPERVISION_LOOKUP"
  | "INTERVENTION_LOOKUP"
  | "BOUNDARY_LOOKUP"
  | "RUNTIME_VIOLATION_SEARCH"
  | "BOUNDARY_REJECTION_VIEW"
  | "HISTORICAL_RECONSTRUCTION"
  | "SUPERVISION_RECORD_NOT_FOUND"
  | "INTERVENTION_RECORD_NOT_FOUND"
  | "BOUNDARY_EVENT_NOT_FOUND"
  | "MISSION_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TENANT_SCOPE_VIOLATION"
  | "MISSION_SCOPE_VIOLATION"
  | "INVALID_BOUNDARY_REFERENCE"
  | "INVALID_POLICY_REFERENCE"
  | "INVALID_CONSTITUTION_REFERENCE"
  | "REPLAY_REFERENCE_INVALID"
  | "LINEAGE_REFERENCE_INVALID"
  | "ORDERING_FAILURE"
  | "VALIDATION_FAILURE"
  | "MUTATION_ATTEMPT";

export type DriftEvent = Readonly<{
  drift_type: "EXECUTION" | "PLANNING" | "ORCHESTRATION" | "CONFIDENCE" | "RUNTIME_ANOMALY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detection_timestamp: string;
  affected_execution: string;
  recommendation_reference: string;
}>;

export type SupervisionLookupRecord = Readonly<{
  supervision_event_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  supervision_type: SupervisionType;
  runtime_health: RuntimeHealthLevel;
  confidence: Readonly<{ score: number; trend: "IMPROVING" | "STABLE" | "DEGRADING"; degradation: number; contributors: readonly string[]; uncertainty_analysis: string }>;
  drift_status: Readonly<{ detected: boolean; severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; events: readonly DriftEvent[] }>;
  policy_validation: Readonly<{ status: "PASS" | "VIOLATION"; policy_reference: string; evidence: readonly string[]; governance_outcome: string }>;
  constitutional_validation: Readonly<{ status: "PASS" | "VIOLATION"; principle: string; evidence: readonly string[]; authority_decision: string }>;
  recommendation_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  event_timestamp: string;
  autonomy_event_sequence: number;
  supervision_hash: string;
}>;

export type InterventionLookupRecord = Readonly<{
  intervention_id: string;
  tenant_id: string;
  mission_id: string;
  intervention_type: InterventionType;
  recommendation_reason: string;
  triggering_condition: string;
  affected_workflow: string;
  supporting_evidence: readonly string[];
  governance_validation: Readonly<{ status: "APPROVED" | "REJECTED"; governance_reference: string; policy_reference: string }>;
  authority_validation: Readonly<{ required_authority: string; validation_result: "APPROVED" | "OPERATOR_REQUIRED" | "REJECTED"; operator_required: boolean }>;
  checkpoint_reference: string | null;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  advisory_only: true;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  created_timestamp: string;
  autonomy_event_sequence: number;
  intervention_hash: string;
}>;

export type BoundaryLookupRecord = Readonly<{
  boundary_event_id: string;
  tenant_id: string;
  mission_id: string;
  boundary_type: BoundaryType;
  evaluation_result: "APPROVED" | "DENIED" | "ENFORCED" | "REJECTED";
  requested_authority: string | null;
  granted_authority: string | null;
  denied_authority: string | null;
  rejection_reason: string | null;
  policy_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  tenant_isolation_status: "IN_SCOPE" | "VIOLATION_REJECTED";
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  event_timestamp: string;
  autonomy_event_sequence: number;
  boundary_hash: string;
}>;

export type RuntimeViolationSearchRecord = Readonly<{
  violation_id: string;
  violation_type: "DRIFT" | "POLICY" | "CONSTITUTIONAL" | "CONFIDENCE_DEGRADATION" | "EXECUTION_ANOMALY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  affected_execution: string;
  associated_intervention: string;
  evidence_references: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  violation_hash: string;
}>;

export type BoundaryRejectionView = Readonly<{
  rejection_view_id: string;
  rejected_authority_requests: readonly string[];
  blocked_executions: readonly string[];
  governance_denials: readonly string[];
  constitutional_enforcements: readonly string[];
  tenant_isolation_events: readonly string[];
  hidden_execution_detections: readonly string[];
  audit_evidence: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  rejection_hash: string;
}>;

export type SupervisionInterventionBoundaryLookupAuditRecord = Readonly<{
  audit_id: string;
  lookup_id: string;
  operator_id: string;
  tenant_id: string;
  mission_id: string;
  lookup_type: SupervisionInterventionBoundaryLookupType;
  target_reference: string;
  authorization_result: "APPROVED" | "REJECTED";
  returned_record_count: number;
  result_hash: string;
  replay_reference: string;
  lineage_reference: string;
  audit_timestamp: string;
  append_only: true;
  audit_hash: string;
}>;

export type SupervisionInterventionBoundaryLookupResponse = Readonly<{
  phase_version: "8I.5";
  schema_version: "supervision-intervention-boundary-lookup/v8I.5";
  lookup_id: string;
  lookup_type: SupervisionInterventionBoundaryLookupType;
  lookup_state: SupervisionInterventionBoundaryLookupState;
  tenant_id: string;
  mission_id: string;
  target_reference: string;
  query_contract: AutonomyQueryContract;
  query_validation: AutonomyQueryValidationResult;
  search_response: AutonomySearchResponse;
  supervision_records: readonly SupervisionLookupRecord[];
  intervention_records: readonly InterventionLookupRecord[];
  boundary_records: readonly BoundaryLookupRecord[];
  violation_records: readonly RuntimeViolationSearchRecord[];
  boundary_rejection_view: BoundaryRejectionView | null;
  audit_record: SupervisionInterventionBoundaryLookupAuditRecord;
  failures: readonly AutonomyQueryValidationIssue[];
  replay_reference: string;
  lineage_reference: string;
  result_hash: string | null;
  read_only: true;
  advisory_only_notice: "Supervision, intervention, and boundary lookup is deterministic, read-only, replayable, and audit-backed.";
}>;

export type SupervisionInterventionBoundaryLookupInput = Readonly<{
  scenario?: SupervisionInterventionBoundaryLookupScenario;
  lookup_type?: SupervisionInterventionBoundaryLookupType;
  query_contract?: AutonomyQueryContract;
  target_reference?: string;
}>;

export type SupervisionInterventionBoundaryLookupObservabilitySurface = Readonly<{
  lookup_id: string;
  lookup_type: SupervisionInterventionBoundaryLookupType;
  lookup_state: SupervisionInterventionBoundaryLookupState;
  tenant_id: string;
  mission_id: string;
  supervision_records: number;
  intervention_records: number;
  boundary_records: number;
  violation_records: number;
  has_boundary_rejection_view: boolean;
  errors: readonly SupervisionInterventionBoundaryLookupErrorState[];
  result_hash: string | null;
  audit_hash: string;
}>;
