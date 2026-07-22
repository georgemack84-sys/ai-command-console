import type { AutonomyMaturityDomain, AutonomyMaturityLevel } from "@/types/autonomy-maturity-assessment-contract";
import type { HistoricalMaturityRepository } from "@/types/historical-maturity-evolution";

export type ReadinessGapScenario = "BASELINE" | "MISSING_REQUIREMENTS_UNDETECTED" | "INCONSISTENT_ARCHITECTURAL_GAPS" | "WEAK_DOMAINS_MISCLASSIFIED" | "INCOMPLETE_DEPENDENCY_ANALYSIS" | "READINESS_REPLAY_MISMATCH" | "GOVERNANCE_GAPS_MISSED" | "CONSTITUTIONAL_GAPS_MISSED" | "REPLAY_DEFICIENCIES_UNDETECTED" | "CERTIFICATION_BLOCKERS_OMITTED" | "INTEGRITY_VERIFICATION_FAILURE" | "HIDDEN_EVALUATION_LOGIC" | "TENANT_ISOLATION_VIOLATION" | "ADVISORY_ONLY_VIOLATION";
export type ReadinessGapFailure = "MISSING_REQUIREMENTS_NOT_DETECTED" | "ARCHITECTURAL_GAPS_INCONSISTENT" | "WEAK_DOMAINS_INCORRECTLY_CLASSIFIED" | "DEPENDENCY_ANALYSIS_INCOMPLETE" | "READINESS_REPLAY_MISMATCHED" | "GOVERNANCE_GAPS_MISSED" | "CONSTITUTIONAL_GAPS_MISSED" | "REPLAY_DEFICIENCIES_UNDETECTED" | "CERTIFICATION_BLOCKERS_OMITTED" | "INTEGRITY_VERIFICATION_FAILED" | "HIDDEN_EVALUATION_LOGIC_DETECTED" | "TENANT_ISOLATION_VIOLATED" | "ADVISORY_ONLY_BEHAVIOR_COMPROMISED";
export type ReadinessState = "NOT_READY" | "PARTIALLY_READY" | "SUBSTANTIALLY_READY" | "READY_FOR_CERTIFICATION" | "READY_FOR_ADVANCEMENT";
export type GapCategory = "MISSING_REQUIREMENT" | "WEAK_DOMAIN" | "CERTIFICATION_GAP" | "GOVERNANCE_GAP" | "CONSTITUTIONAL_GAP" | "REPLAY_GAP" | "ARCHITECTURAL_GAP";
export type GapSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ImprovementPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ReadinessGapFinding = Readonly<{
  gap_id: string;
  category: GapCategory;
  domain: AutonomyMaturityDomain | "CROSS_DOMAIN";
  severity: GapSeverity;
  description: string;
  dependency_impact: string;
  implementation_guidance: string;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type DependencyNode = Readonly<{
  node_id: string;
  dependency_type: "CAPABILITY" | "GOVERNANCE" | "CONSTITUTIONAL" | "REPLAY" | "CERTIFICATION" | "RUNTIME" | "EXPLAINABILITY";
  domain: AutonomyMaturityDomain | "CROSS_DOMAIN";
  health: "HEALTHY" | "AT_RISK" | "BLOCKED";
  unresolved: boolean;
  integrity_hash: string;
}>;

export type ImprovementPriorityItem = Readonly<{
  priority_id: string;
  priority: ImprovementPriority;
  domain: AutonomyMaturityDomain | "CROSS_DOMAIN";
  maturity_impact: number;
  rationale: string;
  recommendation: string;
  operator_approval_required: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ReadinessAssessmentRecord = Readonly<{
  readiness_id: string;
  assessment_id: string;
  readiness_version: "readiness-gap-analysis-engine/v8ALT.11.6";
  current_maturity_level: AutonomyMaturityLevel;
  target_maturity_level: AutonomyMaturityLevel;
  readiness_score: number;
  readiness_state: ReadinessState;
  advancement_eligibility: "ADVISORY_ELIGIBLE" | "ADVISORY_BLOCKED";
  certification_readiness: "READY_SIGNAL" | "BLOCKED_SIGNAL";
  architecture_ready: boolean;
  governance_ready: boolean;
  constitutional_ready: boolean;
  replay_ready: boolean;
  certification_ready: boolean;
  resilience_ready: boolean;
  operationally_stable: boolean;
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  integrity_hash: string;
}>;

export type ReadinessGapLedgerEntry = Readonly<{
  ledger_id: string;
  readiness_id: string;
  assessment_id: string;
  readiness_score: number;
  readiness_state: ReadinessState;
  missing_requirements: readonly string[];
  weak_domains: readonly string[];
  dependency_graph_version: "dependency-graph/v1";
  improvement_priorities: readonly ImprovementPriority[];
  governance_findings: readonly string[];
  constitutional_findings: readonly string[];
  replay_findings: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  append_only: true;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReadinessGapReport = Readonly<{
  report_id: string;
  readiness_summary: string;
  missing_requirements: readonly ReadinessGapFinding[];
  weak_domains: readonly ReadinessGapFinding[];
  certification_gaps: readonly ReadinessGapFinding[];
  governance_gaps: readonly ReadinessGapFinding[];
  constitutional_gaps: readonly ReadinessGapFinding[];
  replay_gaps: readonly ReadinessGapFinding[];
  dependency_analysis: readonly DependencyNode[];
  improvement_priorities: readonly ImprovementPriorityItem[];
  readiness_explanation: readonly string[];
  advisory_only: true;
  integrity_hash: string;
}>;

export type ReadinessGapAnalysisRepository = Readonly<{
  analysis_id: string;
  final_state: "READINESS_GAP_ANALYSIS_COMPLETE" | "READINESS_GAP_ANALYSIS_FAILED";
  history: HistoricalMaturityRepository;
  record: ReadinessAssessmentRecord;
  gaps: readonly ReadinessGapFinding[];
  dependencies: readonly DependencyNode[];
  priorities: readonly ImprovementPriorityItem[];
  ledger: readonly ReadinessGapLedgerEntry[];
  report: ReadinessGapReport;
  failures: readonly ReadinessGapFailure[];
  advisory_only: true;
  advancement_authorized: false;
  production_certification_authorized: false;
  corrective_action_authorized: false;
  governance_modification_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type ReadinessGapValidationResult = Readonly<{
  analysis_id: string;
  valid: boolean;
  missing_requirements_detected: boolean;
  architectural_gaps_consistent: boolean;
  weak_domains_correctly_classified: boolean;
  dependency_analysis_complete: boolean;
  readiness_replay_verified: boolean;
  governance_gaps_detected: boolean;
  constitutional_gaps_detected: boolean;
  replay_deficiencies_detected: boolean;
  certification_blockers_present: boolean;
  integrity_verified: boolean;
  no_hidden_logic: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  no_action_authority: boolean;
  failures: readonly ReadinessGapFailure[];
  validation_hash: string;
}>;

export type ReadinessGapObservabilitySurface = Readonly<{
  analysis_id: string;
  final_state: string;
  readiness_score: number;
  readiness_state: ReadinessState;
  gap_count: number;
  dependency_count: number;
  priority_count: number;
  ledger_count: number;
  failure_count: number;
  advisory_only: true;
  advancement_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type ReadinessGapInput = Readonly<{ scenario?: ReadinessGapScenario; repository?: ReadinessGapAnalysisRepository; history?: HistoricalMaturityRepository }>;

export type ReadinessGapBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "readiness-gap-analysis-engine/v8ALT.11.6";
    final_state: "READINESS_GAP_ANALYSIS_ENGINE_READY";
    principles: readonly string[];
  }>;
  repository: ReadinessGapAnalysisRepository;
  validation: ReadinessGapValidationResult;
  observability: ReadinessGapObservabilitySurface;
}>;
