import type { PolicyAnalysisRecord } from "@/types/policy-analysis";
import type { PolicyDependencyEdge, PolicyDependencyGraph } from "@/types/policy-dependency-graph";

export type PolicyLineageState = "DISCOVERED" | "RESOLVED" | "RECONSTRUCTED" | "VALIDATED" | "CERTIFIED" | "ARCHIVED";

export type PolicyLineageInfluenceLevel = "MANDATORY" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";

export type PolicyLineageRelationshipType = "PARENT" | "CHILD" | "DEPENDENCY" | "INHERITANCE" | "SUPERSESSION" | "CONSTITUTIONAL" | "GOVERNANCE_INFLUENCE";

export type PolicyTimelineEventType = "CREATED" | "MODIFIED" | "ACTIVATED" | "INHERITED" | "SUPERSEDED" | "RETIRED" | "ARCHIVED";

export type PolicyLineageReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE";

export type PolicyLineageValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type PolicyLineageScenario =
  | "BASELINE"
  | "MISSING_POLICY_ID"
  | "DUPLICATE_POLICY"
  | "VERSION_NOT_FOUND"
  | "PARENT_MISSING"
  | "DEPENDENCY_MISSING"
  | "INHERITANCE_INCOMPLETE"
  | "SUPERSESSION_INCONSISTENT"
  | "CONSTITUTION_MISSING"
  | "TIMELINE_GAP"
  | "HIDDEN_INFLUENCE"
  | "CROSS_TENANT"
  | "REPLAY_MISMATCH"
  | "HISTORICAL_MUTATION"
  | "INVALID_TRANSITION";

export type PolicyIdentity = Readonly<{
  policy_id: string;
  policy_version: string;
  tenant_id: string;
  mission_id: string;
  effective_timestamp: string;
  expiration_timestamp: string | null;
  status: "ACTIVE" | "HISTORICAL" | "SUPERSEDED" | "OVERRIDDEN" | "ARCHIVED";
}>;

export type PolicyLineageRelationship = Readonly<{
  relationship_id: string;
  relationship_type: PolicyLineageRelationshipType;
  source_policy_id: string;
  target_policy_id: string;
  source_policy_version: string;
  target_policy_version: string;
  reason: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  relationship_hash: string;
}>;

export type PolicyTimelineEvent = Readonly<{
  event_id: string;
  event_type: PolicyTimelineEventType;
  policy_id: string;
  policy_version: string;
  timestamp: string;
  reason: string;
  truth_record_ref: string;
  evidence_refs: readonly string[];
  event_hash: string;
}>;

export type ConstitutionalResolution = Readonly<{
  constitutional_rule_id: string;
  precedence: "HIGHEST";
  constrains_policy_id: string;
  conflict_detected: boolean;
  override_applied: boolean;
  resolution_reason: string;
  evidence_refs: readonly string[];
  resolution_hash: string;
}>;

export type PolicyInfluenceScore = Readonly<{
  policy_id: string;
  policy_version: string;
  influence_level: PolicyLineageInfluenceLevel;
  influence_score: number;
  factors: readonly string[];
  constitutional_weight: number;
  governance_weight: number;
  replay_refs: readonly string[];
  influence_hash: string;
}>;

export type PolicyLineageReplayRefs = Readonly<{
  replay_id: string;
  policy_history_hash: string;
  dependency_graph_hash: string;
  inheritance_chain_hash: string;
  supersession_chain_hash: string;
  constitutional_resolution_hash: string;
  timeline_hash: string;
  influence_hash: string;
  reconstruction_output_hash: string;
}>;

export type PolicyLineageReconstruction = Readonly<{
  reconstruction_id: string;
  schema_version: "policy-lineage-reconstruction/v7G.2";
  tenant_id: string;
  mission_id: string;
  governance_conclusion_ref: string;
  root_policy: PolicyIdentity;
  policy_history: readonly PolicyIdentity[];
  parent_policies: readonly PolicyIdentity[];
  child_policies: readonly PolicyIdentity[];
  dependency_graph: readonly PolicyLineageRelationship[];
  inheritance_chain: readonly PolicyLineageRelationship[];
  supersession_chain: readonly PolicyLineageRelationship[];
  constitutional_resolutions: readonly ConstitutionalResolution[];
  historical_timeline: readonly PolicyTimelineEvent[];
  influence_scores: readonly PolicyInfluenceScore[];
  source_policy_analyses: readonly string[];
  source_policy_graph_ref: string;
  source_truth_records: readonly string[];
  replay_refs: PolicyLineageReplayRefs;
  state: PolicyLineageState;
  advisory_boundary: Readonly<{
    advisory_only: true;
    mutates_policy: false;
    resolves_conflicts_autonomously: false;
    execution_authority: false;
  }>;
  reconstruction_hash: string;
  created_timestamp: string;
}>;

export type PolicyLineageErrorCode = "PLR-001" | "PLR-002" | "PLR-003" | "PLR-004" | "PLR-005" | "PLR-006" | "PLR-007" | "PLR-008" | "PLR-009" | "PLR-010" | "PLR-011" | "PLR-012" | "PLR-013" | "PLR-014" | "PLR-015";

export type PolicyLineageFailureReason =
  | "MISSING_POLICY_IDENTIFIER"
  | "DUPLICATE_POLICY_IDENTIFIER"
  | "POLICY_VERSION_NOT_FOUND"
  | "PARENT_POLICY_MISSING"
  | "DEPENDENCY_RESOLUTION_FAILED"
  | "INHERITANCE_CHAIN_INCOMPLETE"
  | "SUPERSESSION_INCONSISTENCY"
  | "CONSTITUTIONAL_REFERENCE_MISSING"
  | "TIMELINE_RECONSTRUCTION_FAILED"
  | "HIDDEN_POLICY_INFLUENCE_DETECTED"
  | "CROSS_TENANT_POLICY_REFERENCE"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "HISTORICAL_INTEGRITY_VIOLATION"
  | "INVALID_POLICY_STATE_TRANSITION"
  | "POLICY_LINEAGE_VALIDATION_FAILED";

export type PolicyLineageValidationFailure = Readonly<{
  error_code: PolicyLineageErrorCode;
  reason: PolicyLineageFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type PolicyLineageValidationResult = Readonly<{
  reconstruction_id?: string;
  validation_state: PolicyLineageValidationState;
  validator_version: "POLICY-LINEAGE-RECONSTRUCTION-VALIDATOR-V1";
  checks: Readonly<{
    identity_valid: boolean;
    relationships_complete: boolean;
    timeline_complete: boolean;
    constitutional_resolution_complete: boolean;
    replay_ready: boolean;
    influence_visible: boolean;
    tenant_isolated: boolean;
    state_valid: boolean;
    historical_integrity_preserved: boolean;
    advisory_only_enforced: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly PolicyLineageValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type PolicyLineageReplayResult = Readonly<{
  replay_id: string;
  replay_state: PolicyLineageReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstruction_id: string;
  failure_reason: PolicyLineageFailureReason | null;
}>;

export type PolicyLineageTransitionResult = Readonly<{
  from_state: PolicyLineageState;
  to_state: PolicyLineageState;
  allowed: boolean;
  reason: string;
}>;

export type PolicyLineageEngineInput = Readonly<{
  scenario?: PolicyLineageScenario;
  tenant_id?: string;
  mission_id?: string;
  governance_conclusion_ref?: string;
  policy_analyses?: readonly PolicyAnalysisRecord[];
  policy_graph?: PolicyDependencyGraph;
}>;

export type PolicyLineageEngineResult = Readonly<{
  engine_id: string;
  reconstruction: PolicyLineageReconstruction;
  validation: PolicyLineageValidationResult;
  replay: PolicyLineageReplayResult;
}>;

export type PolicyLineageObservabilitySurface = Readonly<{
  reconstruction_id: string;
  governance_conclusion_ref: string;
  root_policy: PolicyIdentity;
  policy_history_count: number;
  dependency_count: number;
  inheritance_count: number;
  supersession_count: number;
  constitutional_influence_count: number;
  timeline_events: readonly PolicyTimelineEvent[];
  influence_scores: readonly PolicyInfluenceScore[];
  replay_state: PolicyLineageReplayState;
  validation_failures: readonly PolicyLineageFailureReason[];
  advisory_only_notice: string;
}>;
