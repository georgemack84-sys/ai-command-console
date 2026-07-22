import type { PatternReplayResult } from "@/types/pattern-replay-explainability";

export type PatternDashboardState = "REPLAY_INPUT_VALIDATED" | "FILTERS_APPLIED" | "VIEWS_RENDERED" | "EXPLAINABILITY_VERIFIED" | "CERTIFIED" | "FAILED" | "PENDING_EVIDENCE";

export type PatternDashboardFailure =
  | "REPLAY_INPUT_MISSING"
  | "REPLAY_INPUT_UNCERTIFIED"
  | "REPLAY_UNAVAILABLE"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "PATTERN_INTELLIGENCE_INVALID"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_BOUNDARY_VIOLATED"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "EXPLANATION_MISSING"
  | "FILTER_INVALID"
  | "ROLE_ACCESS_DENIED"
  | "HIDDEN_VISUALIZATION_DETECTED"
  | "NONDETERMINISTIC_RENDERING_DETECTED"
  | "AUTONOMOUS_ACTION_DETECTED"
  | "RECOMMENDATION_MUTATION_DETECTED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "PRIORITY_MUTATION_DETECTED"
  | "FAIL_OPEN_BEHAVIOR";

export type PatternDashboardScenario =
  | "BASELINE"
  | "RECOMMENDATION_FAILURE"
  | "RECOMMENDATION_SUCCESS"
  | "RISK_UNDERESTIMATION"
  | "RISK_OVERESTIMATION"
  | "CONFIDENCE_DRIFT"
  | "GOVERNANCE_BLOCKER"
  | "MISSION_BOTTLENECK"
  | "MISSING_REPLAY_INPUT"
  | "UNCERTIFIED_REPLAY_INPUT"
  | "MISSING_REPLAY"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "INVALID_PATTERN_INTELLIGENCE"
  | "HASH_MISMATCH"
  | "CROSS_TENANT"
  | "REPLAY_DIVERGENCE"
  | "MISSING_EXPLANATION"
  | "INVALID_FILTER"
  | "ROLE_DENIED"
  | "HIDDEN_VISUALIZATION"
  | "NONDETERMINISTIC_RENDERING"
  | "AUTONOMOUS_ACTION"
  | "RECOMMENDATION_MUTATION"
  | "GOVERNANCE_MUTATION"
  | "PRIORITY_MUTATION"
  | "FAIL_OPEN";

export type PatternDashboardFilters = Readonly<{
  tenant_id: string;
  mission_scope?: string;
  pattern_type?: string;
  governance_level?: string;
  operator_id: string;
  timeframe: "ALL" | "LAST_30_DAYS" | "LAST_90_DAYS";
  confidence_min?: number;
  confidence_max?: number;
  recurrence_min?: number;
  recurrence_max?: number;
  strategic_importance_min?: number;
  replay_status?: "REPLAY_PASS" | "REPLAY_FAIL";
  deterministic: true;
  integrity_hash: string;
}>;

export type PatternDashboardElement = Readonly<{
  element_id: string;
  pattern_id: string;
  tenant_id: string;
  element_type: "PATTERN_SUMMARY" | "TREND" | "RECOMMENDATION" | "RISK" | "CONFIDENCE" | "GOVERNANCE" | "MISSION" | "EVIDENCE" | "REPLAY";
  title: string;
  summary: string;
  score: number;
  trend_direction: "IMPROVING" | "STABLE" | "DEGRADING";
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  explanation_refs: readonly string[];
  explanation: string;
  replay_available: boolean;
  integrity_hash: string;
}>;

export type PatternDashboardView = Readonly<{
  dashboard_view_id: string;
  tenant_id: string;
  operator_id: string;
  visible_pattern_refs: readonly string[];
  visible_trend_refs: readonly string[];
  visible_governance_refs: readonly string[];
  visible_replay_refs: readonly string[];
  visible_evidence_refs: readonly string[];
  applied_filters: PatternDashboardFilters;
  dashboard_version: "operator-pattern-intelligence-dashboard/v1";
  replay_available: boolean;
  integrity_hash: string;
}>;

export type PatternDashboardExplorer = Readonly<{
  explorer_id: string;
  tenant_id: string;
  view: "RECOMMENDATION" | "RISK" | "CONFIDENCE" | "GOVERNANCE" | "MISSION" | "TREND" | "EVIDENCE" | "REPLAY";
  elements: readonly PatternDashboardElement[];
  explanation_complete: boolean;
  evidence_complete: boolean;
  replay_available: boolean;
  integrity_hash: string;
}>;

export type PatternDashboardApiSurface = Readonly<{
  api_id: string;
  retrieve_dashboard: "POST /operator-pattern-intelligence-dashboard/dashboard";
  retrieve_patterns: "POST /operator-pattern-intelligence-dashboard/patterns";
  retrieve_trends: "POST /operator-pattern-intelligence-dashboard/trends";
  retrieve_recommendations: "POST /operator-pattern-intelligence-dashboard/recommendations";
  retrieve_risk: "POST /operator-pattern-intelligence-dashboard/risk";
  retrieve_confidence: "POST /operator-pattern-intelligence-dashboard/confidence";
  retrieve_governance: "POST /operator-pattern-intelligence-dashboard/governance";
  retrieve_mission: "POST /operator-pattern-intelligence-dashboard/mission";
  retrieve_evidence: "POST /operator-pattern-intelligence-dashboard/evidence";
  retrieve_replay: "POST /operator-pattern-intelligence-dashboard/replay";
  retrieve_contract: "GET /operator-pattern-intelligence-dashboard/contract";
  update_supported: false;
  delete_supported: false;
  autonomous_action_supported: false;
  recommendation_mutation_supported: false;
  governance_mutation_supported: false;
  priority_mutation_supported: false;
  integrity_hash: string;
}>;

export type PatternDashboardValidation = Readonly<{
  validation_id: string;
  state: PatternDashboardState;
  certified: boolean;
  failures: readonly PatternDashboardFailure[];
  replay_input_accepted: boolean;
  replay_available: boolean;
  evidence_complete: boolean;
  governance_referenced: boolean;
  pattern_intelligence_valid: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  replay_divergence_absent: boolean;
  explanations_complete: boolean;
  filters_valid: boolean;
  role_access_granted: boolean;
  no_hidden_visualizations: boolean;
  deterministic_rendering: boolean;
  advisory_only: boolean;
  no_autonomous_actions: boolean;
  no_recommendation_mutation: boolean;
  no_governance_mutation: boolean;
  no_priority_mutation: boolean;
  integrity_hash: string;
}>;

export type PatternDashboardInput = Readonly<{
  replay_result?: PatternReplayResult;
  filters?: Partial<PatternDashboardFilters>;
  scenario?: PatternDashboardScenario;
}>;

export type PatternDashboardResult = Readonly<{
  operator_pattern_intelligence_dashboard_version: "operator-pattern-intelligence-dashboard/v1";
  replay_result: PatternReplayResult;
  api_surface: PatternDashboardApiSurface;
  dashboard_view: PatternDashboardView;
  pattern_elements: readonly PatternDashboardElement[];
  trend_explorer: PatternDashboardExplorer;
  recommendation_viewer: PatternDashboardExplorer;
  risk_dashboard: PatternDashboardExplorer;
  confidence_dashboard: PatternDashboardExplorer;
  governance_view: PatternDashboardExplorer;
  mission_dashboard: PatternDashboardExplorer;
  evidence_explorer: PatternDashboardExplorer;
  replay_explorer: PatternDashboardExplorer;
  validation: PatternDashboardValidation;
  deterministic: true;
  evidence_backed: true;
  replay_everywhere: true;
  explainability_everywhere: true;
  operator_first: true;
  tenant_isolated: true;
  advisory_only: true;
  autonomous_actions: false;
  modifies_recommendations: false;
  modifies_governance: false;
  modifies_priorities: false;
  workflow_execution: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PatternDashboardFoundation = Readonly<{
  operator_pattern_intelligence_dashboard_version: "operator-pattern-intelligence-dashboard/v1";
  api_surface: PatternDashboardApiSurface;
  result: PatternDashboardResult;
}>;
