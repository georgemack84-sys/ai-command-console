import type { GovernanceLineageRecord } from "@/types/governance-lineage";
import type { PolicyLineageReconstruction } from "@/types/policy-lineage-reconstruction";

export type DecisionInfluenceSourceType = "CONSTITUTION" | "AUTHORITY" | "POLICY" | "EVIDENCE" | "RISK" | "COMPLIANCE" | "RECOMMENDATION" | "ESCALATION";

export type DecisionInfluenceRelationshipType =
  | "SUPPORTED_BY"
  | "REQUIRED_BY"
  | "CONSTRAINED_BY"
  | "INFLUENCED_BY"
  | "VALIDATED_BY"
  | "ESCALATED_BY"
  | "OVERRIDDEN_BY"
  | "SUPERSEDED_BY"
  | "DERIVED_FROM"
  | "DEPENDENT_ON"
  | "CORRELATED_WITH";

export type DecisionContributionLevel = "MANDATORY" | "PRIMARY" | "SECONDARY" | "SUPPORTING" | "INFORMATIONAL";

export type DecisionInfluenceState = "DISCOVERED" | "ANALYZED" | "RESOLVED" | "VALIDATED" | "CERTIFIED" | "ARCHIVED";

export type DecisionInfluenceReplayState = "REPRODUCED" | "MISMATCH" | "INCOMPLETE";

export type DecisionInfluenceValidationState = "VALID" | "INVALID" | "TENANT_SCOPE_VIOLATION" | "REPLAY_MISMATCH" | "CERTIFICATION_BLOCKED";

export type DecisionInfluenceScenario =
  | "BASELINE"
  | "MISSING_INFLUENCE_ID"
  | "MISSING_SOURCE"
  | "MISSING_TARGET"
  | "INVALID_RELATIONSHIP"
  | "DEPENDENCY_INCOMPLETE"
  | "CIRCULAR_DEPENDENCY"
  | "PRECEDENCE_VIOLATION"
  | "HIDDEN_INFLUENCE"
  | "CONTRIBUTION_FAILED"
  | "UNRESOLVED_CONFLICT"
  | "REPLAY_MISMATCH"
  | "CROSS_TENANT"
  | "IMMUTABLE_MUTATION"
  | "CONFIDENCE_MISMATCH";

export type DecisionInfluenceRecord = Readonly<{
  influence_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  source_type: DecisionInfluenceSourceType;
  source_identifier: string;
  source_version: string;
  target_identifier: string;
  relationship_type: DecisionInfluenceRelationshipType;
  contribution_level: DecisionContributionLevel;
  confidence_score: number;
  weight: number;
  justification: string;
  timestamp: string;
  replay_reference: string;
  truth_reference: string;
  influence_hash: string;
}>;

export type DecisionInfluenceGraphEdge = Readonly<{
  edge_id: string;
  source_influence_id: string;
  target_influence_id: string;
  relationship_type: DecisionInfluenceRelationshipType;
  dependency_type: "DIRECT" | "INDIRECT" | "TRANSITIVE" | "CONFLICT" | "PRECEDENCE";
  evidence_refs: readonly string[];
  edge_hash: string;
}>;

export type DecisionInfluenceConflict = Readonly<{
  conflict_id: string;
  conflict_type: "POLICY_CONFLICT" | "EVIDENCE_CONFLICT" | "RISK_CONFLICT" | "AUTHORITY_CONFLICT" | "COMPLIANCE_CONFLICT" | "RECOMMENDATION_CONFLICT";
  source_influence_id: string;
  target_influence_id: string;
  resolution_state: "RESOLVED" | "UNRESOLVED";
  resolution_reason: string;
  constitutional_resolution_applied: boolean;
  conflict_hash: string;
}>;

export type DecisionInfluenceConfidence = Readonly<{
  confidence_score: number;
  confidence_level: "LOW" | "MODERATE" | "HIGH" | "CERTIFICATION_READY";
  confidence_method: "WEIGHTED_INFLUENCE_CONFIDENCE_V1";
  supporting_references: readonly string[];
  validation_status: "REPRODUCIBLE" | "MISMATCH";
  confidence_hash: string;
}>;

export type DecisionInfluenceReplayRefs = Readonly<{
  replay_id: string;
  influence_graph_hash: string;
  dependency_graph_hash: string;
  contribution_hash: string;
  conflict_resolution_hash: string;
  confidence_hash: string;
  governance_conclusion_hash: string;
  analysis_output_hash: string;
}>;

export type DecisionInfluenceAnalysis = Readonly<{
  analysis_id: string;
  schema_version: "decision-influence-analysis/v7G.3";
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  governance_conclusion_ref: string;
  influences: readonly DecisionInfluenceRecord[];
  influence_graph: readonly DecisionInfluenceGraphEdge[];
  dependencies: readonly DecisionInfluenceGraphEdge[];
  conflicts: readonly DecisionInfluenceConflict[];
  constitutional_precedence: readonly DecisionInfluenceSourceType[];
  confidence: DecisionInfluenceConfidence;
  source_governance_lineage_id: string;
  source_policy_reconstruction_id: string;
  source_truth_records: readonly string[];
  replay_refs: DecisionInfluenceReplayRefs;
  explanation: Readonly<{
    summary: string;
    policy_basis: readonly string[];
    evidence_basis: readonly string[];
    risk_basis: readonly string[];
    compliance_basis: readonly string[];
    authority_basis: readonly string[];
    escalation_basis: readonly string[];
    explanation_hash: string;
  }>;
  state: DecisionInfluenceState;
  advisory_boundary: Readonly<{
    advisory_only: true;
    mutates_decision: false;
    resolves_conflicts_autonomously: false;
    execution_authority: false;
  }>;
  analysis_hash: string;
  created_timestamp: string;
}>;

export type DecisionInfluenceErrorCode = "DIA-001" | "DIA-002" | "DIA-003" | "DIA-004" | "DIA-005" | "DIA-006" | "DIA-007" | "DIA-008" | "DIA-009" | "DIA-010" | "DIA-011" | "DIA-012" | "DIA-013" | "DIA-014" | "DIA-015";

export type DecisionInfluenceFailureReason =
  | "MISSING_INFLUENCE_IDENTIFIER"
  | "SOURCE_REFERENCE_NOT_FOUND"
  | "TARGET_REFERENCE_NOT_FOUND"
  | "INVALID_RELATIONSHIP_TYPE"
  | "DEPENDENCY_GRAPH_INCOMPLETE"
  | "CIRCULAR_DEPENDENCY_DETECTED"
  | "CONSTITUTIONAL_PRECEDENCE_VIOLATION"
  | "HIDDEN_INFLUENCE_DETECTED"
  | "CONTRIBUTION_CALCULATION_FAILED"
  | "CONFLICT_RESOLUTION_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "CROSS_TENANT_INFLUENCE_DETECTED"
  | "IMMUTABLE_INFLUENCE_MODIFIED"
  | "CONFIDENCE_CALCULATION_MISMATCH"
  | "DECISION_INFLUENCE_VALIDATION_FAILED";

export type DecisionInfluenceValidationFailure = Readonly<{
  error_code: DecisionInfluenceErrorCode;
  reason: DecisionInfluenceFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type DecisionInfluenceValidationResult = Readonly<{
  analysis_id?: string;
  validation_state: DecisionInfluenceValidationState;
  validator_version: "DECISION-INFLUENCE-VALIDATOR-V1";
  checks: Readonly<{
    identity_valid: boolean;
    sources_present: boolean;
    targets_present: boolean;
    relationships_valid: boolean;
    dependencies_complete: boolean;
    no_circular_dependencies: boolean;
    constitutional_precedence_enforced: boolean;
    influence_visible: boolean;
    contributions_reproducible: boolean;
    conflicts_resolved: boolean;
    replay_ready: boolean;
    tenant_isolated: boolean;
    immutable: boolean;
    confidence_reproducible: boolean;
    advisory_only_enforced: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly DecisionInfluenceValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type DecisionInfluenceReplayResult = Readonly<{
  replay_id: string;
  replay_state: DecisionInfluenceReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  analysis_id: string;
  failure_reason: DecisionInfluenceFailureReason | null;
}>;

export type DecisionInfluenceEngineInput = Readonly<{
  scenario?: DecisionInfluenceScenario;
  tenant_id?: string;
  mission_id?: string;
  decision_id?: string;
  governance_lineage?: GovernanceLineageRecord;
  policy_lineage?: PolicyLineageReconstruction;
}>;

export type DecisionInfluenceEngineResult = Readonly<{
  engine_id: string;
  analysis: DecisionInfluenceAnalysis;
  validation: DecisionInfluenceValidationResult;
  replay: DecisionInfluenceReplayResult;
}>;

export type DecisionInfluenceObservabilitySurface = Readonly<{
  analysis_id: string;
  decision_id: string;
  influence_count: number;
  dependency_count: number;
  conflict_count: number;
  mandatory_influences: readonly string[];
  replay_state: DecisionInfluenceReplayState;
  validation_failures: readonly DecisionInfluenceFailureReason[];
  explanation_summary: string;
  advisory_only_notice: string;
}>;
