import type { RecoveryCategory, RecoveryContractFailure, RecoveryRecord, RecoveryRiskLevel, RecoveryValidationStatus } from "@/types/recovery-contract";

export type FailureAnalysisCategory =
  | "EXECUTION"
  | "PLANNING"
  | "ORCHESTRATION"
  | "DEPENDENCY"
  | "SUPERVISION"
  | "INTEGRITY"
  | "CHECKPOINT_CORRUPTION"
  | "RESOURCE_EXHAUSTION"
  | "AUTHORITY_VIOLATION"
  | "GOVERNANCE_VIOLATION";

export type FailureAnalysisSignal =
  | "execution timeout"
  | "stalled execution"
  | "unexpected termination"
  | "sequencing failure"
  | "execution deadlock"
  | "resource starvation"
  | "incomplete execution"
  | "duplicate execution"
  | "invalid plan"
  | "incomplete decomposition"
  | "conflicting objectives"
  | "invalid assumptions"
  | "missing constraints"
  | "planning drift"
  | "planning inconsistency"
  | "scheduling conflict"
  | "workflow interruption"
  | "synchronization failure"
  | "coordination deadlock"
  | "checkpoint failure"
  | "workflow divergence"
  | "orchestration drift"
  | "missing dependency"
  | "circular dependency"
  | "unavailable dependency"
  | "dependency conflict"
  | "invalid dependency version"
  | "dependency timeout"
  | "supervision interruption"
  | "monitoring degradation"
  | "stale supervision"
  | "missing observations"
  | "confidence degradation"
  | "policy monitoring failure"
  | "integrity hash mismatch"
  | "replay mismatch"
  | "lineage corruption"
  | "evidence inconsistency"
  | "audit chain break"
  | "immutable record violation"
  | "corrupted checkpoint"
  | "incomplete checkpoint"
  | "checkpoint lineage break"
  | "inconsistent snapshot"
  | "memory exhaustion"
  | "storage exhaustion"
  | "compute exhaustion"
  | "execution quota exceeded"
  | "runtime resource contention"
  | "privilege escalation"
  | "unauthorized execution"
  | "invalid authority delegation"
  | "operator bypass"
  | "unauthorized approval"
  | "authority scope violation"
  | "constitutional violation"
  | "policy violation"
  | "governance bypass"
  | "tenant isolation violation"
  | "unauthorized decision path"
  | "compliance failure";

export type FailureState = "DETECTED" | "CLASSIFIED" | "ANALYZED" | "CANDIDATES_GENERATED" | "REPLAY_REGISTERED" | "BLOCKED";
export type RootCauseLevel = "PRIMARY" | "SECONDARY" | "CONTRIBUTING" | "ENVIRONMENTAL" | "UNKNOWN";
export type FailureAnalysisConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
export type FailureAnalysisIntegrityStatus = "VERIFIED" | "FAILED" | "UNVERIFIED";
export type FailureAnalysisGovernanceStatus = "COMPLIANT" | "NON_COMPLIANT" | "BLOCKED";
export type FailureAnalysisScenario =
  | "BASELINE_EXECUTION"
  | "PLANNING_FAILURE"
  | "ORCHESTRATION_FAILURE"
  | "DEPENDENCY_FAILURE"
  | "SUPERVISION_FAILURE"
  | "INTEGRITY_FAILURE"
  | "CHECKPOINT_CORRUPTION"
  | "RESOURCE_EXHAUSTION"
  | "AUTHORITY_VIOLATION"
  | "GOVERNANCE_VIOLATION"
  | "LOW_EVIDENCE"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BROKEN"
  | "TENANT_ISOLATION_FAILURE"
  | "AUTONOMOUS_RECOVERY_ATTEMPT"
  | "GOVERNANCE_MUTATION_ATTEMPT"
  | "EVIDENCE_FABRICATION"
  | "HIDDEN_RUNTIME_STATE";

export type FailureAnalysisFailure =
  | "FAILURE_CLASSIFICATION_INVALID"
  | "ROOT_CAUSE_UNDETERMINED"
  | "DEPENDENCY_GRAPH_INCOMPLETE"
  | "LINEAGE_INVALID"
  | "GOVERNANCE_INVALID"
  | "AUTHORITY_INVALID"
  | "INTEGRITY_INVALID"
  | "CONFIDENCE_INSUFFICIENT"
  | "RECOVERY_CANDIDATES_INVALID"
  | "REPLAY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "AUTONOMOUS_RECOVERY_DETECTED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "EVIDENCE_FABRICATION_DETECTED"
  | "HIDDEN_STATE_DETECTED";

export type FailureEvidenceRecord = Readonly<{
  evidence_id: string;
  analysis_id: string;
  category: FailureAnalysisCategory;
  signal: FailureAnalysisSignal;
  source_layer: string;
  description: string;
  immutable: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type RootCauseNode = Readonly<{
  cause_id: string;
  level: RootCauseLevel;
  cause: string;
  evidence_references: readonly string[];
  impacted_components: readonly string[];
  severity: RecoveryRiskLevel;
  cause_hash: string;
}>;

export type DependencyGraphNode = Readonly<{
  node_id: string;
  layer: "EXECUTION" | "PLANNING" | "ORCHESTRATION" | "GOVERNANCE" | "AUTHORITY" | "INTEGRITY";
  dependency_reference: string;
  status: "HEALTHY" | "AFFECTED" | "FAILED" | "BLOCKED";
  impact: RecoveryRiskLevel;
  node_hash: string;
}>;

export type DependencyGraphEdge = Readonly<{
  from: string;
  to: string;
  relationship: "REQUIRES" | "PROPAGATES_TO" | "GOVERNED_BY" | "AUTHORIZED_BY" | "VERIFIED_BY";
  edge_hash: string;
}>;

export type FailureLineage = Readonly<{
  lineage_id: string;
  originating_event: string;
  parent_failure: string | null;
  child_failures: readonly string[];
  propagation_chain: readonly string[];
  recovery_attempts: readonly string[];
  operator_interventions: readonly string[];
  replay_references: readonly string[];
  lineage_hash: string;
}>;

export type FailureConfidenceAssessment = Readonly<{
  confidence_score: number;
  confidence_level: FailureAnalysisConfidenceLevel;
  evidence_completeness: number;
  replay_consistency: number;
  integrity_verification: number;
  dependency_certainty: number;
  governance_certainty: number;
  authority_certainty: number;
  historical_similarity: number;
  runtime_observability: number;
  confidence_hash: string;
}>;

export type RecoveryCandidate = Readonly<{
  candidate_id: string;
  analysis_id: string;
  candidate_type: RecoveryCategory | "DEPENDENCY_REPAIR" | "STAGED_RECOVERY";
  explanation: string;
  confidence: FailureAnalysisConfidenceLevel;
  governance_validation: RecoveryValidationStatus;
  authority_validation: RecoveryValidationStatus;
  expected_outcome: string;
  estimated_recovery_effort: string;
  associated_risks: readonly string[];
  advisory_only: true;
  candidate_hash: string;
}>;

export type FailureAnalysisReplayMetadata = Readonly<{
  replay_reference: string;
  replay_version: "failure-analysis-replay/v8ALT.2.2";
  failure_event: string;
  runtime_state: string;
  evidence_snapshot: string;
  dependency_graph_snapshot: string;
  governance_state: string;
  authority_state: string;
  integrity_status: FailureAnalysisIntegrityStatus;
  confidence_calculation: string;
  recovery_candidate_snapshot: string;
  replay_checksum: string;
  replay_hash: string;
}>;

export type FailureAnalysisObject = Readonly<{
  analysis_id: string;
  recovery_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  failure_category: FailureAnalysisCategory;
  failure_signal: FailureAnalysisSignal;
  failure_state: FailureState;
  root_cause: RootCauseNode;
  contributing_causes: readonly RootCauseNode[];
  dependency_graph: Readonly<{
    nodes: readonly DependencyGraphNode[];
    edges: readonly DependencyGraphEdge[];
    graph_hash: string;
  }>;
  failure_lineage: FailureLineage;
  governance_status: FailureAnalysisGovernanceStatus;
  authority_status: RecoveryValidationStatus;
  integrity_status: FailureAnalysisIntegrityStatus;
  confidence: FailureConfidenceAssessment;
  recovery_candidates: readonly RecoveryCandidate[];
  evidence: readonly FailureEvidenceRecord[];
  replay_reference: FailureAnalysisReplayMetadata;
  linked_recovery_contract: RecoveryRecord;
  timestamp: string;
  advisory_only: true;
  recovery_executed: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  evidence_fabricated: boolean;
  runtime_state_hidden: boolean;
  integrity_hash: string;
  analysis_hash: string;
}>;

export type FailureAnalysisInput = Readonly<{
  scenario?: FailureAnalysisScenario;
  tenant_id?: string;
  mission_id?: string;
  execution_id?: string;
  recovery_id?: string;
}>;

export type FailureAnalysisValidationResult = Readonly<{
  analysis_id: string | null;
  valid: boolean;
  classification_valid: boolean;
  root_cause_valid: boolean;
  dependency_graph_complete: boolean;
  lineage_valid: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  integrity_valid: boolean;
  confidence_valid: boolean;
  recovery_candidates_valid: boolean;
  replay_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly FailureAnalysisFailure[];
  validation_hash: string;
}>;

export type FailureAnalysisReplayResult = Readonly<{
  replay_reference: string;
  analysis_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_checksum: string;
  replay_result_hash: string;
}>;

export type FailureAnalysisObservabilitySurface = Readonly<{
  analysis_id: string;
  recovery_id: string;
  failure_category: FailureAnalysisCategory;
  failure_signal: FailureAnalysisSignal;
  root_cause: string;
  confidence_score: number;
  confidence_level: FailureAnalysisConfidenceLevel;
  governance_status: FailureAnalysisGovernanceStatus;
  authority_status: RecoveryValidationStatus;
  integrity_status: FailureAnalysisIntegrityStatus;
  candidate_count: number;
  replay_valid: boolean;
  tenant_id: string;
  advisory_only: true;
  analysis_hash: string;
}>;

export type FailureAnalysisEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "failure-analysis-engine/v8ALT.2.2";
    principles: readonly string[];
    supported_categories: readonly FailureAnalysisCategory[];
    confidence_levels: readonly FailureAnalysisConfidenceLevel[];
    advisory_only: true;
  }>;
  analysis: FailureAnalysisObject;
  validation: FailureAnalysisValidationResult;
  replay: FailureAnalysisReplayResult;
  observability: FailureAnalysisObservabilitySurface;
  recovery_contract_failures: readonly RecoveryContractFailure[];
}>;
