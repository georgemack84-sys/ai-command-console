export type ConflictDomain = "Planning" | "Delegation" | "Authority" | "Communication" | "Resources" | "Governance" | "Execution" | "Shared State" | "Dependencies" | "Tenants";
export type ConflictCategory = "PLANNING" | "AUTHORITY" | "OWNERSHIP" | "RESOURCE" | "GOVERNANCE" | "DEPENDENCY" | "COMMUNICATION" | "TENANT" | "RUNTIME" | "INTEGRITY";
export type ConflictSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ResolutionStrategy = "IGNORE" | "RETRY" | "REPLAN" | "REASSIGN" | "RESOLVE_DEPENDENCY" | "REQUEST_GOVERNANCE_REVIEW" | "REQUEST_OPERATOR_APPROVAL" | "ROLLBACK" | "TERMINATE_COORDINATION";
export type EscalationTarget = "Coordinator Agent" | "Governance Advisor" | "Runtime Supervisor" | "Integrity Auditor" | "Operator" | "Certification Authority";
export type ConflictState = "MONITORING" | "CONFLICT_DETECTED" | "CLASSIFYING" | "CORRELATING" | "SEVERITY_ASSESSMENT" | "RESOLUTION_GENERATED" | "ESCALATION_PENDING" | "OPERATOR_REVIEW" | "RESOLVED" | "FAILED" | "CERTIFIED";
export type ConflictScenario = "BASELINE" | "PLANNING_CONFLICT" | "UNDETECTED_PLANNING_CONFLICT" | "AUTHORITY_OVERLAP" | "UNDETECTED_AUTHORITY_OVERLAP" | "OWNERSHIP_CONFLICT" | "DUPLICATE_OWNERSHIP_UNDETECTED" | "RESOURCE_CONFLICT" | "UNDETECTED_RESOURCE_CONFLICT" | "GOVERNANCE_CONFLICT" | "GOVERNANCE_CONFLICT_MISSED" | "DEPENDENCY_CONFLICT" | "DEPENDENCY_CONFLICT_MISSED" | "TENANT_BOUNDARY_CONFLICT" | "CROSS_TENANT_CONFLICT_MISSED" | "INCONSISTENT_SEVERITY" | "ROUTING_FAILURE" | "GOVERNANCE_ESCALATION_BYPASS" | "REPLAY_INCONSISTENCY" | "INTEGRITY_FAILURE";
export type ConflictFailure = "UNDETECTED_PLANNING_CONFLICT" | "UNDETECTED_AUTHORITY_OVERLAP" | "DUPLICATE_OWNERSHIP_UNDETECTED" | "UNDETECTED_RESOURCE_CONFLICT" | "GOVERNANCE_CONFLICT_MISSED" | "DEPENDENCY_CONFLICT_MISSED" | "CROSS_TENANT_CONFLICT_MISSED" | "INCONSISTENT_SEVERITY_ASSIGNMENT" | "CONFLICT_ROUTING_FAILED" | "GOVERNANCE_ESCALATION_BYPASSED" | "REPLAY_INCONSISTENCY_DETECTED" | "INTEGRITY_VERIFICATION_FAILED";

export type CoordinationConflictContract = Readonly<{
  coordination_conflict_contract_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  governance_context_id: string;
  authority_context_id: string;
  conflict_detection_policy: readonly string[];
  severity_policy: readonly ConflictSeverity[];
  escalation_policy: readonly EscalationTarget[];
  resolution_policy: readonly ResolutionStrategy[];
  replay_policy: readonly string[];
  created_timestamp: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConflictRecord = Readonly<{
  conflict_id: string;
  coordination_session_id: string;
  mission_id: string;
  conflict_category: ConflictCategory;
  severity: ConflictSeverity;
  affected_agents: readonly string[];
  affected_resources: readonly string[];
  conflict_description: string;
  evidence_references: readonly string[];
  governance_reference: string;
  authority_reference: string;
  recommended_resolution: ResolutionStrategy;
  escalation_required: boolean;
  timestamp: string;
  integrity_hash: string;
}>;

export type ConflictGraph = Readonly<{
  graph_id: string;
  conflict_nodes: readonly string[];
  dependency_nodes: readonly string[];
  authority_nodes: readonly string[];
  governance_nodes: readonly string[];
  resource_nodes: readonly string[];
  resolution_nodes: readonly string[];
  integrity_hash: string;
}>;

export type ConflictTimeline = Readonly<{
  timeline_id: string;
  conflict_id: string;
  detected_timestamp: string;
  affected_events: readonly string[];
  resolution_events: readonly string[];
  verification_status: "VERIFIED" | "FAILED";
}>;

export type SeverityScore = Readonly<{
  operational_impact: number;
  governance_impact: number;
  authority_impact: number;
  mission_risk: number;
  replay_impact: number;
  certification_impact: number;
  severity: ConflictSeverity;
}>;

export type EscalationRecommendation = Readonly<{
  conflict_id: string;
  escalation_target: EscalationTarget;
  urgency: ConflictSeverity;
  blocking_conditions: readonly string[];
  required_approvals: readonly string[];
  expected_resolution_sequence: readonly string[];
  governance_validated: boolean;
}>;

export type ConflictEvidence = Readonly<{
  conflict_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  conflict_records: readonly ConflictRecord[];
  planning_evidence: readonly string[];
  authority_evidence: readonly string[];
  resource_evidence: readonly string[];
  governance_evidence: readonly string[];
  dependency_evidence: readonly string[];
  tenant_evidence: readonly string[];
  resolution_recommendations: readonly ResolutionStrategy[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type ConflictEvent = Readonly<{
  event_id: string;
  coordination_session_id: string;
  conflict_id: string;
  conflict_category: ConflictCategory;
  severity: ConflictSeverity;
  affected_agents: readonly string[];
  event_state: ConflictState;
  resolution_status: "ADVISORY_ONLY" | "ROUTING_FAILED";
  timestamp: string;
  integrity_signature: string;
}>;

export type CoordinationConflictAnalysis = Readonly<{
  contract: CoordinationConflictContract;
  monitored_domains: readonly ConflictDomain[];
  conflicts: readonly ConflictRecord[];
  conflict_graph: ConflictGraph;
  timelines: readonly ConflictTimeline[];
  severity_scores: readonly SeverityScore[];
  escalation_recommendations: readonly EscalationRecommendation[];
  events: readonly ConflictEvent[];
  evidence: ConflictEvidence;
  state: ConflictState;
  version: "coordination-conflict-detection/v8ALT.7.8";
  contract_hash: string;
}>;

export type ConflictInput = Readonly<{
  scenario?: ConflictScenario;
  tenant_id?: string;
  mission_id?: string;
  analysis?: CoordinationConflictAnalysis;
}>;

export type ConflictValidationResult = Readonly<{
  coordination_conflict_contract_id: string | null;
  valid: boolean;
  contract_valid: boolean;
  planning_conflicts_detected: boolean;
  authority_conflicts_detected: boolean;
  ownership_conflicts_detected: boolean;
  resource_conflicts_detected: boolean;
  governance_conflicts_detected: boolean;
  dependency_conflicts_detected: boolean;
  tenant_conflicts_detected: boolean;
  classification_deterministic: boolean;
  severity_deterministic: boolean;
  correlation_reproducible: boolean;
  resolution_reproducible: boolean;
  operator_escalation_generated: boolean;
  governance_escalation_enforced: boolean;
  replay_references_preserved: boolean;
  integrity_verified: boolean;
  operator_visible: boolean;
  fail_closed: boolean;
  failures: readonly ConflictFailure[];
  validation_hash: string;
}>;

export type ConflictObservabilitySurface = Readonly<{
  coordination_conflict_contract_id: string;
  tenant_id: string;
  mission_id: string;
  monitored_domain_count: number;
  conflict_count: number;
  critical_count: number;
  state: ConflictState;
  contract_hash: string;
}>;

export type CoordinationConflictDetectionBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "coordination-conflict-detection/v8ALT.7.8";
    final_state: "COORDINATION_CONFLICT_DETECTION_CERTIFIED";
    domains: readonly ConflictDomain[];
    categories: readonly ConflictCategory[];
    severities: readonly ConflictSeverity[];
    resolutions: readonly ResolutionStrategy[];
    escalation_targets: readonly EscalationTarget[];
    principles: readonly string[];
  }>;
  analysis: CoordinationConflictAnalysis;
  validation: ConflictValidationResult;
  observability: ConflictObservabilitySurface;
}>;
