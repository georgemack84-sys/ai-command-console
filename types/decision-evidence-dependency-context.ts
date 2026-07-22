import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";
import type { AuthorityOperatorContextPackage } from "@/types/decision-authority-operator-context";

export type EvidenceKind = "PRIMARY" | "SUPPORTING" | "CONFLICTING" | "OBSERVATION" | "FINDING";
export type EvidenceQuality = "CERTIFIED" | "PARTIAL" | "STALE" | "INVALID";
export type DependencyStatus = "CLEAR" | "BLOCKED" | "WAITING" | "CIRCULAR" | "INCOMPLETE";

export type EvidenceDependencyResolutionState =
  | "PENDING"
  | "EVIDENCE_REGISTRY_RESOLVED"
  | "PRIMARY_EVIDENCE_RESOLVED"
  | "SUPPORTING_EVIDENCE_RESOLVED"
  | "CONFLICTS_DETECTED"
  | "OBSERVATIONS_RESOLVED"
  | "FINDINGS_RESOLVED"
  | "DEPENDENCIES_RESOLVED"
  | "PREREQUISITES_RESOLVED"
  | "BLOCKERS_RESOLVED"
  | "RECOMMENDATIONS_RESOLVED"
  | "LINEAGE_BUILT"
  | "GRAPH_BUILT"
  | "PASSED"
  | "FAILED_EVIDENCE"
  | "FAILED_DEPENDENCY"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type EvidenceDependencyFailureReason =
  | "PRIMARY_EVIDENCE_MISSING"
  | "EVIDENCE_AUTHENTICITY_UNVERIFIED"
  | "EVIDENCE_PROVENANCE_INCOMPLETE"
  | "SUPPORTING_EVIDENCE_UNLINKED"
  | "OBSERVATION_INVALID"
  | "FINDING_UNREPRODUCIBLE"
  | "DEPENDENCY_GRAPH_INVALID"
  | "CIRCULAR_DEPENDENCY_DETECTED"
  | "REQUIRED_PREREQUISITE_UNRESOLVED"
  | "BLOCKING_DECISION_UNRESOLVED"
  | "LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_EVIDENCE"
  | "INTEGRITY_VERIFICATION_FAILED";

export type EvidenceExplainability = Readonly<{
  source_subsystem: string;
  source_record: string;
  origin_timestamp: string;
  resolver_version: "evidence-dependency-context-resolver/v1";
  supporting_evidence: readonly string[];
  conflicting_evidence: readonly string[];
  dependency_rationale: string;
  lineage_path: readonly string[];
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceRecord = Readonly<{
  evidence_id: string;
  evidence_kind: EvidenceKind;
  tenant_id: string;
  mission_id: string;
  source_subsystem: string;
  source_record: string;
  certified: boolean;
  provenance_complete: boolean;
  collection_timestamp: string;
  validation_timestamp: string;
  last_verification: string;
  expiration_policy: string;
  content_hash: string;
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceContext = Readonly<{
  evidence_context_id: string;
  decision_candidate_id: string;
  primary_evidence: readonly EvidenceRecord[];
  supporting_evidence: readonly EvidenceRecord[];
  conflicting_evidence: readonly EvidenceRecord[];
  observations: readonly EvidenceRecord[];
  findings: readonly EvidenceRecord[];
  evidence_quality: EvidenceQuality;
  evidence_confidence: number;
  evidence_freshness: "CURRENT" | "STALE" | "EXPIRED";
  evidence_lineage: readonly string[];
  evidence_provenance: readonly string[];
  validation_state: EvidenceDependencyResolutionState;
  explainability: EvidenceExplainability;
  integrity_hash: string;
}>;

export type DependencyGraphNode = Readonly<{
  node_id: string;
  node_type: "MISSION_INPUT" | "EVIDENCE_RECORD" | "OBSERVATION" | "FINDING" | "PREREQUISITE" | "BLOCKER" | "RECOMMENDATION" | "CURRENT_DECISION";
  refs: readonly string[];
}>;

export type DependencyGraphEdge = Readonly<{
  from: string;
  to: string;
  relation: "SUPPORTS" | "DERIVES" | "REQUIRES" | "BLOCKS" | "RELATES_TO";
}>;

export type DependencyContext = Readonly<{
  dependency_context_id: string;
  decision_candidate_id: string;
  prerequisite_decisions: readonly string[];
  blocking_decisions: readonly string[];
  dependent_decisions: readonly string[];
  related_recommendations: readonly string[];
  dependency_graph: Readonly<{
    nodes: readonly DependencyGraphNode[];
    edges: readonly DependencyGraphEdge[];
    acyclic: boolean;
  }>;
  dependency_lineage: readonly string[];
  dependency_status: DependencyStatus;
  validation_state: EvidenceDependencyResolutionState;
  explainability: EvidenceExplainability;
  integrity_hash: string;
}>;

export type EvidenceLineageGraph = Readonly<{
  graph_id: string;
  evidence_origins: readonly string[];
  transformations: readonly string[];
  referencing_decisions: readonly string[];
  replay_artifacts: readonly string[];
  historical_usage: readonly string[];
  integrity_hash: string;
}>;

export type EvidenceDependencyContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  mission_tenant_package?: MissionTenantContextPackage;
  authority_operator_package?: AuthorityOperatorContextPackage;
  resolver_version: "evidence-dependency-context-resolver/v1";
}>;

export type EvidenceDependencyValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: EvidenceDependencyResolutionState;
  failure_reason?: EvidenceDependencyFailureReason;
  failure_reasons: readonly EvidenceDependencyFailureReason[];
  checks: Readonly<{
    primary_evidence_exists: boolean;
    authenticity_verified: boolean;
    provenance_complete: boolean;
    supporting_evidence_linked: boolean;
    conflicts_identified: boolean;
    observations_valid: boolean;
    findings_reproducible: boolean;
    prerequisites_satisfied: boolean;
    blocking_decisions_identified: boolean;
    related_recommendations_resolved: boolean;
    dependency_graph_valid: boolean;
    circular_dependencies_absent: boolean;
    lineage_complete: boolean;
    tenant_isolated: boolean;
    integrity_verified: boolean;
  }>;
}>;

export type EvidenceDependencyContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  evidence_context: EvidenceContext;
  dependency_context: DependencyContext;
  evidence_domain: DecisionContextDomain;
  dependency_domain: DecisionContextDomain;
  lineage_graph: EvidenceLineageGraph;
  validation: EvidenceDependencyValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type EvidenceDependencyReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: EvidenceDependencyResolutionState;
  failures: readonly EvidenceDependencyFailureReason[];
  integrity_hash: string;
}>;

export type EvidenceDependencyObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  evidence_failures: number;
  dependency_failures: number;
  conflict_count: number;
  isolation_failures: number;
  integrity_failures: number;
  replay_success_rate: number;
}>;
