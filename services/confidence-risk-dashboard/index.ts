import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveDashboardFoundation, replayAdaptiveDashboardFoundation } from "@/services/adaptive-dashboard-foundation";
import type {
  AdaptiveProposalStatusPanel,
  CalibrationRiskAlertCenter,
  CalibrationTimeline,
  ConfidenceAdaptationProposalView,
  ConfidenceCalibrationView,
  ConfidenceDriftView,
  ConfidenceRiskComparisonWorkspace,
  ConfidenceRiskDashboardApiSurface,
  ConfidenceRiskDashboardContract,
  ConfidenceRiskDashboardFailure,
  ConfidenceRiskDashboardInput,
  ConfidenceRiskDashboardObservabilitySurface,
  ConfidenceRiskDashboardRecord,
  ConfidenceRiskDashboardResult,
  ConfidenceRiskDashboardScenario,
  ConfidenceRiskDashboardValidationResult,
  ConfidenceRiskDomain,
  ConfidenceRiskMetrics,
  ConfidenceRiskPermission,
  ConfidenceRiskReplayExplorer,
  ConfidenceRiskValidationTest,
  ConfidenceRiskWidget,
  ConfidenceTrendView,
  EvidenceReliabilityView,
  GovernanceSensitiveRiskCategory,
  GovernanceSensitiveRiskView,
  RiskActualizationExplorer,
  RiskAdaptationView,
  RiskProbabilityView,
  RiskSeverityLevel,
  RiskSeverityView,
} from "@/types/confidence-risk-dashboard";

const VERSION = "confidence-risk-dashboard/v10.14.6" as const;
const DASHBOARD_ID = "ConfidenceRiskDashboard" as const;
const TENANT_ID = "tenant_mission_control";
const WIDGETS: readonly ConfidenceRiskWidget[] = Object.freeze(["Confidence Trend", "Calibration Timeline", "Risk Trend", "Severity Distribution", "Probability Distribution", "Historical Comparison", "Evidence Reliability", "Proposal Status", "Replay Explorer", "Alert Center"]);
const DOMAINS: readonly ConfidenceRiskDomain[] = Object.freeze(["CONFIDENCE_CALIBRATION", "CONFIDENCE_DRIFT", "EVIDENCE_RELIABILITY", "RISK_ADAPTATION", "RISK_SEVERITY", "RISK_PROBABILITY", "RISK_ACTUALIZATION", "GOVERNANCE_SENSITIVE_RISK", "CONFIDENCE_RISK_COMPARISON"]);
const SEVERITY_TAXONOMY: readonly RiskSeverityLevel[] = Object.freeze(["NEGLIGIBLE", "LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL", "CATASTROPHIC"]);

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function id(prefix: string, value: unknown): string {
  return `${prefix}_${hash(value).slice(0, 24)}`;
}

function failureForScenario(scenario: ConfidenceRiskDashboardScenario): ConfidenceRiskDashboardFailure | undefined {
  const map: Partial<Record<ConfidenceRiskDashboardScenario, ConfidenceRiskDashboardFailure>> = {
    FOUNDATION_UNAVAILABLE: "DASHBOARD_FOUNDATION_UNAVAILABLE",
    CONFIDENCE_HIDDEN: "CONFIDENCE_RECORD_HIDDEN",
    RISK_HIDDEN: "RISK_RECORD_HIDDEN",
    NONDETERMINISTIC_RENDERING: "DASHBOARD_RENDERING_NONDETERMINISTIC",
    MISSING_OUTCOME: "OUTCOME_LINK_MISSING",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCE_BROKEN",
    MISSING_GOVERNANCE: "GOVERNANCE_LINEAGE_MISSING",
    MISSING_SIMULATION: "SIMULATION_STATUS_MISSING",
    MISSING_OPERATOR_DECISION: "OPERATOR_DECISION_MISSING",
    MISSING_CERTIFICATION: "CERTIFICATION_STATUS_MISSING",
    MISSING_REPLAY: "REPLAY_READINESS_MISSING",
    MISSING_ROLLBACK: "ROLLBACK_READINESS_MISSING",
    UNSUPPORTED_CONFIDENCE: "UNSUPPORTED_CONFIDENCE_CLAIM",
    UNSUPPORTED_RISK: "UNSUPPORTED_RISK_CLAIM",
    GOVERNANCE_RISK_HIDDEN: "GOVERNANCE_SENSITIVE_RISK_HIDDEN",
    DOMAIN_COLLAPSED: "CONFIDENCE_RISK_DOMAIN_COLLAPSED",
    UNAUTHORIZED_ROLE: "UNAUTHORIZED_DASHBOARD_ACCESS",
    TENANT_LEAK: "TENANT_ISOLATION_VIOLATED",
    RESTRICTED_FIELD_LEAK: "RESTRICTED_FIELD_EXPOSED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    WRITE_AUTHORITY_EXPOSED: "DASHBOARD_WRITE_AUTHORITY_EXPOSED",
  };
  return map[scenario];
}

function apiSurface(): ConfidenceRiskDashboardApiSurface {
  const base: Omit<ConfidenceRiskDashboardApiSurface, "integrity_hash"> = {
    api_id: "confidence_risk_dashboard_api",
    retrieve_dashboard: "POST /confidence-risk-dashboard/dashboard",
    retrieve_contract: "GET /confidence-risk-dashboard/contract",
    retrieve_calibration: "POST /confidence-risk-dashboard/calibration",
    retrieve_trends: "POST /confidence-risk-dashboard/trends",
    retrieve_timeline: "POST /confidence-risk-dashboard/timeline",
    retrieve_drift: "POST /confidence-risk-dashboard/drift",
    retrieve_evidence: "POST /confidence-risk-dashboard/evidence",
    retrieve_confidence_proposals: "POST /confidence-risk-dashboard/confidence-proposals",
    retrieve_risk_adaptation: "POST /confidence-risk-dashboard/risk-adaptation",
    retrieve_severity: "POST /confidence-risk-dashboard/severity",
    retrieve_probability: "POST /confidence-risk-dashboard/probability",
    retrieve_actualization: "POST /confidence-risk-dashboard/actualization",
    retrieve_governance_risk: "POST /confidence-risk-dashboard/governance-risk",
    retrieve_comparison: "POST /confidence-risk-dashboard/comparison",
    retrieve_proposals: "POST /confidence-risk-dashboard/proposals",
    retrieve_replay: "POST /confidence-risk-dashboard/replay",
    retrieve_alerts: "POST /confidence-risk-dashboard/alerts",
    validate_dashboard: "POST /confidence-risk-dashboard/validate",
    inspect_dashboard: "POST /confidence-risk-dashboard/inspect",
    creation_supported: false,
    mutation_supported: false,
    confidence_recalibration_supported: false,
    risk_model_mutation_supported: false,
    threshold_mutation_supported: false,
    proposal_approval_supported: false,
    simulation_bypass_supported: false,
    rollback_execution_supported: false,
    authority_expansion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function records(failures: readonly ConfidenceRiskDashboardFailure[]): readonly ConfidenceRiskDashboardRecord[] {
  const baseRefs = {
    source_record_refs: freezeArray(["source:prediction:confidence-risk:1"]),
    confidence_record_refs: failures.includes("CONFIDENCE_RECORD_HIDDEN") ? freezeArray([]) : freezeArray(["confidence:calibration:1"]),
    risk_record_refs: failures.includes("RISK_RECORD_HIDDEN") ? freezeArray([]) : freezeArray(["risk:actualization:1"]),
    outcome_record_refs: failures.includes("OUTCOME_LINK_MISSING") ? freezeArray([]) : freezeArray(["outcome:mission:1"]),
    evidence_refs: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? freezeArray([]) : freezeArray(["evidence:calibration-risk:1"]),
    adaptation_proposal_refs: freezeArray(["proposal:confidence:1", "proposal:risk:1"]),
    simulation_refs: failures.includes("SIMULATION_STATUS_MISSING") ? freezeArray([]) : freezeArray(["simulation:confidence-risk:1"]),
    governance_refs: failures.includes("GOVERNANCE_LINEAGE_MISSING") ? freezeArray([]) : freezeArray(["governance:confidence-risk:1"]),
    operator_decision_refs: failures.includes("OPERATOR_DECISION_MISSING") ? freezeArray([]) : freezeArray(["operator:review:confidence-risk:1"]),
    certification_refs: failures.includes("CERTIFICATION_STATUS_MISSING") ? freezeArray([]) : freezeArray(["certification:confidence-risk:1"]),
    replay_refs: failures.includes("REPLAY_READINESS_MISSING") ? freezeArray([]) : freezeArray(["replay:confidence-risk:1"]),
    rollback_refs: failures.includes("ROLLBACK_READINESS_MISSING") ? freezeArray([]) : freezeArray(["rollback:confidence-risk:1"]),
  };
  const common = {
    tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : TENANT_ID,
    mission_scope: "mission-control-confidence-risk",
    visible_to_roles: freezeArray(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"] as const),
    restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "operator_private_notes", "governance_sensitive_risk"]),
    current_status: "CERTIFIED" as const,
  };
  const confidenceBase: Omit<ConfidenceRiskDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: id("confidence_risk_record", "confidence"),
    ...common,
    dashboard_view: "Confidence Calibration View",
    intelligence_domain: "CONFIDENCE_CALIBRATION",
    related_domains: freezeArray(["CONFIDENCE_DRIFT", "EVIDENCE_RELIABILITY", "CONFIDENCE_RISK_COMPARISON"]),
    ...baseRefs,
    current_confidence_state: failures.includes("UNSUPPORTED_CONFIDENCE_CLAIM") ? "unsupported" : "predicted=0.84 realized_accuracy=0.80 calibration_error=0.04",
    current_risk_state: "risk preserved as separate domain",
    calibration_status: failures.includes("UNSUPPORTED_CONFIDENCE_CLAIM") ? "evidence insufficient" : "well calibrated",
    drift_status: "UNDER_REVIEW",
    evidence_reliability: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? "INCOMPLETE" : "VERIFIED",
    governance_sensitivity: "NONE",
    summary: failures.includes("CONFIDENCE_RECORD_HIDDEN") ? "" : "Confidence calibration is visible with evidence, outcome, proposal, replay, certification, and rollback lineage.",
    alerts: failures.includes("UNSUPPORTED_CONFIDENCE_CLAIM") ? freezeArray(["unsupported confidence claim"]) : freezeArray(["confidence drift under review"]),
  };
  const riskBase: Omit<ConfidenceRiskDashboardRecord, "integrity_hash"> = {
    dashboard_record_id: id("confidence_risk_record", "risk"),
    ...common,
    dashboard_view: "Risk Adaptation View",
    intelligence_domain: "RISK_ADAPTATION",
    related_domains: freezeArray(["RISK_SEVERITY", "RISK_PROBABILITY", "RISK_ACTUALIZATION", "GOVERNANCE_SENSITIVE_RISK", "CONFIDENCE_RISK_COMPARISON"]),
    ...baseRefs,
    current_confidence_state: "confidence preserved as separate domain",
    current_risk_state: failures.includes("UNSUPPORTED_RISK_CLAIM") ? "unsupported" : "predicted_probability=0.31 observed=false predicted_severity=HIGH realized=MODERATE",
    calibration_status: "well calibrated",
    drift_status: "UNDER_REVIEW",
    evidence_reliability: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? "INCOMPLETE" : "VERIFIED",
    governance_sensitivity: failures.includes("GOVERNANCE_SENSITIVE_RISK_HIDDEN") ? "NONE" : "POLICY_CONFLICT",
    summary: failures.includes("RISK_RECORD_HIDDEN") ? "" : "Risk adaptation is visible with probability, severity, actualization, governance, replay, certification, and rollback lineage.",
    alerts: failures.includes("UNSUPPORTED_RISK_CLAIM") ? freezeArray(["unsupported risk claim"]) : freezeArray(["governance-sensitive risk requires disposition"]),
  };
  const confidence = Object.freeze({ ...confidenceBase, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(confidenceBase) });
  const risk = Object.freeze({ ...riskBase, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(riskBase) });
  return freezeArray([confidence, risk]);
}

function calibrationView(records: readonly ConfidenceRiskDashboardRecord[]): ConfidenceCalibrationView {
  const confidence = records.find((record) => record.intelligence_domain === "CONFIDENCE_CALIBRATION");
  const error = confidence?.current_confidence_state === "unsupported" ? 1 : 0.04;
  const base: Omit<ConfidenceCalibrationView, "integrity_hash"> = { view_id: "confidence_calibration_overview", predicted_confidence: 0.84, realized_outcome: confidence?.outcome_record_refs[0] ?? "", calibration_error: error, confidence_accuracy: Number((1 - error).toFixed(2)), calibration_status: confidence?.calibration_status ?? "calibration not yet measurable", confidence_category: "mission recommendation confidence", affected_mission: confidence?.mission_scope ?? "", evidence_quality: confidence?.evidence_reliability ?? "INCOMPLETE", adaptation_status: confidence?.current_status ?? "EVIDENCE_PENDING", certification_status: confidence?.certification_refs.length ? "CERTIFIED" : "MISSING" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function trendView(failures: readonly ConfidenceRiskDashboardFailure[]): ConfidenceTrendView {
  const base: Omit<ConfidenceTrendView, "integrity_hash"> = { view_id: "confidence_trend_view", confidence_trend: freezeArray(["raw:0.84", "normalized:0.82", "calibrated:0.80"]), calibration_accuracy_trend: freezeArray(["0.80", "0.81"]), overconfidence_trend: freezeArray(["0.04"]), underconfidence_trend: freezeArray(["0.00"]), confidence_variance: failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") ? 0.91 : 0.04, confidence_stability: failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") ? 0.09 : 0.92, distinguishes_raw_normalized_calibrated: true, deterministic: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function timeline(records: readonly ConfidenceRiskDashboardRecord[]): CalibrationTimeline {
  const refs = records.flatMap((record) => [...record.replay_refs, ...record.certification_refs, ...record.rollback_refs]);
  const base: Omit<CalibrationTimeline, "integrity_hash"> = { timeline_id: "calibration_timeline", events: freezeArray(["prediction", "evidence captured", "outcome observed", "calibration calculated", "drift reviewed", "proposal generated", "governance reviewed", "simulation recorded", "operator decision", "certification", "rollback plan"]), preserves_event_ordering: true, preserves_original_values: true, exposes_superseded_and_rejected: true, replay_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function driftView(records: readonly ConfidenceRiskDashboardRecord[]): ConfidenceDriftView {
  const confidence = records[0];
  const base: Omit<ConfidenceDriftView, "integrity_hash"> = { view_id: "confidence_drift_view", severity: "MODERATE", status: confidence?.drift_status ?? "NOT_DETECTED", drift_signals: freezeArray(["overconfidence drift under review", "confidence instability absent"]), affected_missions: confidence ? freezeArray([confidence.mission_scope]) : freezeArray([]), governance_refs: confidence?.governance_refs ?? freezeArray([]), certification_status: confidence?.certification_refs.length ? "CERTIFIED" : "MISSING" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidenceView(records: readonly ConfidenceRiskDashboardRecord[], failures: readonly ConfidenceRiskDashboardFailure[]): EvidenceReliabilityView {
  const evidence = records.flatMap((record) => record.evidence_refs);
  const unsupported = freezeArray([...(failures.includes("UNSUPPORTED_CONFIDENCE_CLAIM") ? ["unsupported confidence"] : []), ...(failures.includes("UNSUPPORTED_RISK_CLAIM") ? ["unsupported risk"] : [])]);
  const base: Omit<EvidenceReliabilityView, "integrity_hash"> = { view_id: "evidence_reliability_view", reliability_state: evidence.length ? "VERIFIED" : "INCOMPLETE", evidence_sources: evidence, completeness: evidence.length ? 1 : 0, freshness: "current certification period", consistency: "consistent", independence: "independent outcome and evidence sources", conflicts: freezeArray([]), missing_evidence: evidence.length ? freezeArray([]) : freezeArray(["evidence references"]), unsupported_claims: unsupported };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function confidenceProposalView(records: readonly ConfidenceRiskDashboardRecord[]): ConfidenceAdaptationProposalView {
  const confidence = records[0];
  const base: Omit<ConfidenceAdaptationProposalView, "integrity_hash"> = { view_id: "confidence_adaptation_proposal_view", proposal_refs: confidence?.adaptation_proposal_refs.filter((ref) => ref.includes("confidence")) ?? freezeArray([]), current_behavior: "calibration error 0.04", proposed_change: "retain evidence-weighted calibration with governance review", affected_category: confidence?.calibration_status ?? "calibration not yet measurable", expected_benefit: "improved calibration stability", expected_risk: "operator review workload", governance_implications: confidence?.governance_refs ?? freezeArray([]), simulation_status: confidence?.simulation_refs.length ? "PASSED" : "MISSING", approval_status: confidence?.operator_decision_refs.length ? "APPROVED" : "MISSING", certification_status: confidence?.certification_refs.length ? "CERTIFIED" : "MISSING", rollback_readiness: confidence?.rollback_refs.length ? "READY" : "MISSING" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function riskAdaptationView(records: readonly ConfidenceRiskDashboardRecord[]): RiskAdaptationView {
  const risk = records.find((record) => record.intelligence_domain === "RISK_ADAPTATION");
  const unsupported = risk?.current_risk_state === "unsupported";
  const base: Omit<RiskAdaptationView, "integrity_hash"> = { view_id: "risk_adaptation_overview", current_risk_assessment: risk?.current_risk_state ?? "", realized_risk: unsupported ? "" : "MODERATE severity, not actualized", assessment_error: unsupported ? 1 : 0.08, affected_risk_category: "governance-sensitive operational risk", probability_accuracy: unsupported ? 0 : 0.92, severity_accuracy: unsupported ? 0 : 0.86, mitigation_effectiveness: unsupported ? 0 : 0.88, residual_risk: unsupported ? "" : "LOW", adaptation_status: risk?.current_status ?? "EVIDENCE_PENDING", governance_sensitivity: risk?.governance_sensitivity ?? "NONE", certification_status: risk?.certification_refs.length ? "CERTIFIED" : "MISSING" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function severityView(): RiskSeverityView {
  const base: Omit<RiskSeverityView, "integrity_hash"> = { view_id: "risk_severity_view", predicted_severity: "HIGH", realized_severity: "MODERATE", severity_variance: "one canonical level lower than predicted", canonical_taxonomy: SEVERITY_TAXONOMY, mapping_rule: "source labels map directly to Mission Control severity taxonomy", mapping_version: "severity-taxonomy/v1" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function probabilityView(failures: readonly ConfidenceRiskDashboardFailure[]): RiskProbabilityView {
  const unsupported = failures.includes("UNSUPPORTED_RISK_CLAIM");
  const base: Omit<RiskProbabilityView, "integrity_hash"> = { view_id: "risk_probability_view", predicted_probability: unsupported ? 0 : 0.31, observed_occurrence: false, probability_error: unsupported ? 1 : 0.31, confidence_interval: unsupported ? "" : "0.24-0.38", evidence_strength: unsupported ? 0 : 0.87, historical_frequency: unsupported ? 0 : 0.28, representation_types: freezeArray(["point estimate", "range estimate", "observed frequency", "simulated frequency"]), unsupported_precision_displayed: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function actualization(records: readonly ConfidenceRiskDashboardRecord[]): RiskActualizationExplorer {
  const risk = records.find((record) => record.intelligence_domain === "RISK_ADAPTATION");
  const base: Omit<RiskActualizationExplorer, "integrity_hash"> = { view_id: "risk_actualization_history", outcome: "LESS_SEVERE_THAN_PREDICTED", chronological_events: freezeArray(["risk prediction", "supporting evidence", "mitigation plan", "operator decision", "governance decision", "actualization check", "residual effects", "adaptive proposal"]), mitigation_effectiveness: 0.88, residual_effects: freezeArray(["residual risk low"]), rollback_outcome: risk?.rollback_refs.length ? "rollback plan available" : "rollback missing", adaptive_proposal_refs: risk?.adaptation_proposal_refs ?? freezeArray([]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function governanceRisk(records: readonly ConfidenceRiskDashboardRecord[], failures: readonly ConfidenceRiskDashboardFailure[]): GovernanceSensitiveRiskView {
  const risk = records.find((record) => record.intelligence_domain === "RISK_ADAPTATION");
  const hidden = failures.includes("GOVERNANCE_SENSITIVE_RISK_HIDDEN");
  const categories: readonly GovernanceSensitiveRiskCategory[] = hidden ? freezeArray<GovernanceSensitiveRiskCategory>([]) : freezeArray<GovernanceSensitiveRiskCategory>(["POLICY_CONFLICT"]);
  const base: Omit<GovernanceSensitiveRiskView, "integrity_hash"> = { view_id: "governance_sensitive_risk_view", categories, required_escalations: hidden ? freezeArray([]) : risk?.governance_refs ?? freezeArray([]), formal_disposition_required: true, hidden_by_aggregation: false, downgraded_by_confidence_only: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function comparison(failures: readonly ConfidenceRiskDashboardFailure[]): ConfidenceRiskComparisonWorkspace {
  const collapsed = failures.includes("CONFIDENCE_RISK_DOMAIN_COLLAPSED");
  const base: Omit<ConfidenceRiskComparisonWorkspace, "integrity_hash"> = { workspace_id: "confidence_risk_comparison_workspace", dimensions: freezeArray(["predicted confidence", "realized accuracy", "predicted risk", "realized risk", "evidence reliability", "mission outcome", "governance impact", "operator decision", "simulation outcome", "certification result"]), separate_confidence_and_risk_scales: collapsed ? false as true : true, unsupported_composite_score: collapsed ? true as false : false, missing_data: freezeArray([]), uncertainty_notes: freezeArray(["confidence accuracy does not prove risk accuracy"]), normalization_methods: freezeArray(["confidence normalized separately from risk probability"]), deterministic: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function proposalPanel(records: readonly ConfidenceRiskDashboardRecord[], failures: readonly ConfidenceRiskDashboardFailure[]): AdaptiveProposalStatusPanel {
  const base: Omit<AdaptiveProposalStatusPanel, "integrity_hash"> = { panel_id: "adaptive_proposal_status_panel", confidence_proposals: records.flatMap((record) => record.adaptation_proposal_refs.filter((ref) => ref.includes("confidence"))), risk_proposals: records.flatMap((record) => record.adaptation_proposal_refs.filter((ref) => ref.includes("risk"))), cross_domain_proposals: freezeArray(["proposal:confidence-risk:comparison:1"]), queue_categories: freezeArray(["confidence proposals", "risk proposals", "cross-domain proposals", "simulation required", "certified", "rollback ready"]), next_required_actions: failures.length ? freezeArray(["resolve dashboard validation failures"]) : freezeArray(["maintain advisory visibility"]), deterministic: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayExplorer(records: readonly ConfidenceRiskDashboardRecord[]): ConfidenceRiskReplayExplorer {
  const refs = records.flatMap((record) => record.replay_refs);
  const base: Omit<ConfidenceRiskReplayExplorer, "integrity_hash"> = { replay_id: "confidence_risk_replay_explorer", replay_scope: freezeArray(["original evidence state", "confidence prediction", "risk prediction", "policy version", "model version", "operator decision", "governance decision", "observed outcome", "calibration result", "risk actualization", "adaptation proposal", "simulation result", "certification decision", "rollback activity"]), event_ordering_verified: refs.length > 0, evidence_lineage_verified: records.every((record) => record.evidence_refs.length > 0), calculation_reproducible: true, decision_lineage_complete: records.every((record) => record.operator_decision_refs.length > 0 && record.governance_refs.length > 0), tenant_context_verified: records.every((record) => record.tenant_id === TENANT_ID), output_hash_verified: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alertCenter(records: readonly ConfidenceRiskDashboardRecord[], failures: readonly ConfidenceRiskDashboardFailure[]): CalibrationRiskAlertCenter {
  const base: Omit<CalibrationRiskAlertCenter, "integrity_hash"> = { alert_id: "calibration_risk_alert_center", confidence_alerts: records.flatMap((record) => record.intelligence_domain === "CONFIDENCE_CALIBRATION" ? record.alerts : []), risk_alerts: records.flatMap((record) => record.intelligence_domain === "RISK_ADAPTATION" ? record.alerts : []), integrity_alerts: failures.filter((failure) => failure.includes("INTEGRITY") || failure.includes("TENANT") || failure.includes("REPLAY")), highest_severity: failures.some((failure) => ["TENANT_ISOLATION_VIOLATED", "INTEGRITY_VERIFICATION_FAILED", "DASHBOARD_WRITE_AUTHORITY_EXPOSED", "GOVERNANCE_SENSITIVE_RISK_HIDDEN"].includes(failure)) ? "CRITICAL" : failures.length ? "HIGH" : "INFORMATIONAL", critical_conditions_visible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function permissions(input: ConfidenceRiskDashboardInput, failures: readonly ConfidenceRiskDashboardFailure[]): readonly ConfidenceRiskPermission[] {
  const role = input.role ?? "OPERATOR";
  const base: Omit<ConfidenceRiskPermission, "integrity_hash"> = { permission_id: `confidence_risk_permission_${role.toLowerCase()}`, role, tenant_id: failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : input.tenant_id ?? TENANT_ID, allowed: !failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS"), restricted_fields: failures.includes("RESTRICTED_FIELD_EXPOSED") ? freezeArray([]) : freezeArray(["restricted_evidence_payload", "operator_private_notes", "governance_sensitive_risk"]), tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"), evidence_authorized: !failures.includes("EVIDENCE_REFERENCE_BROKEN") && !failures.includes("RESTRICTED_FIELD_EXPOSED"), governance_authorized: !failures.includes("GOVERNANCE_LINEAGE_MISSING"), replay_authorized: !failures.includes("REPLAY_READINESS_MISSING"), certification_authorized: !failures.includes("CERTIFICATION_STATUS_MISSING") };
  return freezeArray([Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) })]);
}

function metrics(failures: readonly ConfidenceRiskDashboardFailure[]): ConfidenceRiskMetrics {
  const base: Omit<ConfidenceRiskMetrics, "integrity_hash"> = { dashboard_rendering_latency_ms: 12, confidence_sync_latency_ms: 13, risk_sync_latency_ms: 14, stale_calibration_records: failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") ? 1 : 0, stale_risk_records: failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") ? 1 : 0, missing_outcome_links: failures.includes("OUTCOME_LINK_MISSING") ? 1 : 0, missing_evidence_references: failures.includes("EVIDENCE_REFERENCE_BROKEN") ? 1 : 0, broken_replay_links: failures.includes("REPLAY_READINESS_MISSING") ? 1 : 0, inconsistent_proposal_states: 0, inconsistent_certification_states: failures.includes("CERTIFICATION_STATUS_MISSING") ? 1 : 0, widget_rendering_failures: failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") ? 1 : 0, unauthorized_access_attempts: failures.includes("UNAUTHORIZED_DASHBOARD_ACCESS") ? 1 : 0, tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0, integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0, hidden_state_discrepancies: failures.some((failure) => failure.includes("HIDDEN")) ? 1 : 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: ConfidenceRiskDashboardFailure, evidence_refs: readonly string[]): ConfidenceRiskValidationTest {
  const base: Omit<ConfidenceRiskValidationTest, "integrity_hash"> = { test_id: id("confidence_risk_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidationTests(result: Omit<ConfidenceRiskDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">): readonly ConfidenceRiskValidationTest[] {
  const evidence = [result.dashboard_foundation.integrity_hash, ...result.records.map((record) => record.integrity_hash)];
  return freezeArray([
    validationTest("foundation integration", replayAdaptiveDashboardFoundation(result.dashboard_foundation), "DASHBOARD_FOUNDATION_UNAVAILABLE", evidence),
    validationTest("confidence records visible", result.confidence_visible && result.records.some((record) => record.intelligence_domain === "CONFIDENCE_CALIBRATION" && record.summary), "CONFIDENCE_RECORD_HIDDEN", evidence),
    validationTest("risk records visible", result.risk_visible && result.records.some((record) => record.intelligence_domain === "RISK_ADAPTATION" && record.summary), "RISK_RECORD_HIDDEN", evidence),
    validationTest("deterministic rendering", result.deterministic && result.trend_view.deterministic && result.comparison_workspace.deterministic, "DASHBOARD_RENDERING_NONDETERMINISTIC", evidence),
    validationTest("outcome links visible", result.records.every((record) => record.outcome_record_refs.length > 0), "OUTCOME_LINK_MISSING", evidence),
    validationTest("evidence reliability visible", result.evidence_backed && result.evidence_view.evidence_sources.length > 0, "EVIDENCE_REFERENCE_BROKEN", evidence),
    validationTest("governance lineage visible", result.governance_visible && result.records.every((record) => record.governance_refs.length > 0), "GOVERNANCE_LINEAGE_MISSING", evidence),
    validationTest("simulation status visible", result.records.every((record) => record.simulation_refs.length > 0), "SIMULATION_STATUS_MISSING", evidence),
    validationTest("operator decisions visible", result.records.every((record) => record.operator_decision_refs.length > 0), "OPERATOR_DECISION_MISSING", evidence),
    validationTest("certification status visible", result.records.every((record) => record.certification_refs.length > 0), "CERTIFICATION_STATUS_MISSING", evidence),
    validationTest("replay readiness visible", result.replayable && result.replay_explorer.event_ordering_verified, "REPLAY_READINESS_MISSING", evidence),
    validationTest("rollback readiness visible", result.records.every((record) => record.rollback_refs.length > 0), "ROLLBACK_READINESS_MISSING", evidence),
    validationTest("unsupported confidence claims identified", result.evidence_view.unsupported_claims.every((claim) => claim !== "unsupported confidence"), "UNSUPPORTED_CONFIDENCE_CLAIM", evidence),
    validationTest("unsupported risk claims identified", result.evidence_view.unsupported_claims.every((claim) => claim !== "unsupported risk"), "UNSUPPORTED_RISK_CLAIM", evidence),
    validationTest("governance-sensitive risks visible", result.governance_risk_view.categories.length > 0 && result.governance_risk_view.formal_disposition_required && !result.governance_risk_view.hidden_by_aggregation, "GOVERNANCE_SENSITIVE_RISK_HIDDEN", evidence),
    validationTest("confidence and risk remain separate", result.domains_separate && result.comparison_workspace.separate_confidence_and_risk_scales && !result.comparison_workspace.unsupported_composite_score, "CONFIDENCE_RISK_DOMAIN_COLLAPSED", evidence),
    validationTest("role restrictions enforced", result.permissions.every((permission) => permission.allowed), "UNAUTHORIZED_DASHBOARD_ACCESS", evidence),
    validationTest("tenant isolation enforced", result.tenant_isolated && result.records.every((record) => record.tenant_id === TENANT_ID), "TENANT_ISOLATION_VIOLATED", evidence),
    validationTest("restricted fields protected", result.permissions.every((permission) => permission.restricted_fields.length > 0) && result.records.every((record) => record.restricted_fields.length > 0), "RESTRICTED_FIELD_EXPOSED", evidence),
    validationTest("integrity hashes reproducible", result.records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash), "INTEGRITY_VERIFICATION_FAILED", evidence),
    validationTest("dashboard remains advisory-only", result.read_only && result.advisory_only && !result.write_authority_granted, "DASHBOARD_WRITE_AUTHORITY_EXPOSED", evidence),
  ]);
}

function resultReplayHash(result: Omit<ConfidenceRiskDashboardResult, "replay_hash" | "integrity_hash">): string {
  return hash({ foundation: result.dashboard_foundation.integrity_hash, records: result.records.map((record) => record.integrity_hash), calibration: result.calibration_view.integrity_hash, trend: result.trend_view.integrity_hash, timeline: result.timeline.integrity_hash, drift: result.drift_view.integrity_hash, evidence: result.evidence_view.integrity_hash, confidence_proposal: result.confidence_proposal_view.integrity_hash, risk: result.risk_adaptation_view.integrity_hash, severity: result.severity_view.integrity_hash, probability: result.probability_view.integrity_hash, actualization: result.actualization_explorer.integrity_hash, governance: result.governance_risk_view.integrity_hash, comparison: result.comparison_workspace.integrity_hash, proposals: result.proposal_status_panel.integrity_hash, replay: result.replay_explorer.integrity_hash, alerts: result.alert_center.integrity_hash, failures: result.failures });
}

function resultIntegrityHash(result: Omit<ConfidenceRiskDashboardResult, "integrity_hash">): string {
  return hash({ version: result.confidence_risk_dashboard_version, id: result.dashboard_identifier, api: result.api_surface.integrity_hash, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome });
}

export function buildConfidenceRiskDashboard(input: ConfidenceRiskDashboardInput = {}): ConfidenceRiskDashboardResult {
  const scenario = input.scenario ?? "BASELINE";
  const dashboard_foundation = establishAdaptiveDashboardFoundation();
  const initialFailures = freezeArray([...(failureForScenario(scenario) ? [failureForScenario(scenario) as ConfidenceRiskDashboardFailure] : []), ...(!replayAdaptiveDashboardFoundation(dashboard_foundation) ? ["DASHBOARD_FOUNDATION_UNAVAILABLE" as const] : [])]);
  const api_surface = apiSurface();
  const dashboardRecords = records(initialFailures);
  const calibration_view = calibrationView(dashboardRecords);
  const trend_view = trendView(initialFailures);
  const timelineRecord = timeline(dashboardRecords);
  const drift_view = driftView(dashboardRecords);
  const evidence_view = evidenceView(dashboardRecords, initialFailures);
  const confidence_proposal_view = confidenceProposalView(dashboardRecords);
  const risk_adaptation_view = riskAdaptationView(dashboardRecords);
  const severity_view = severityView();
  const probability_view = probabilityView(initialFailures);
  const actualization_explorer = actualization(dashboardRecords);
  const governance_risk_view = governanceRisk(dashboardRecords, initialFailures);
  const comparison_workspace = comparison(initialFailures);
  const proposal_status_panel = proposalPanel(dashboardRecords, initialFailures);
  const replay_explorer = replayExplorer(dashboardRecords);
  const alert_center = alertCenter(dashboardRecords, initialFailures);
  const permissionRecords = permissions(input, initialFailures);
  const metricsRecord = metrics(initialFailures);
  const baseWithoutValidation: Omit<ConfidenceRiskDashboardResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash"> = {
    confidence_risk_dashboard_version: VERSION,
    dashboard_identifier: DASHBOARD_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    dashboard_foundation,
    records: dashboardRecords,
    calibration_view,
    trend_view,
    timeline: timelineRecord,
    drift_view,
    evidence_view,
    confidence_proposal_view,
    risk_adaptation_view,
    severity_view,
    probability_view,
    actualization_explorer,
    governance_risk_view,
    comparison_workspace,
    proposal_status_panel,
    replay_explorer,
    alert_center,
    permissions: permissionRecords,
    widgets: WIDGETS,
    metrics: metricsRecord,
    deterministic: !initialFailures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC"),
    replayable: !initialFailures.includes("REPLAY_READINESS_MISSING"),
    tenant_isolated: !initialFailures.includes("TENANT_ISOLATION_VIOLATED"),
    evidence_backed: !initialFailures.includes("EVIDENCE_REFERENCE_BROKEN"),
    governance_visible: !initialFailures.includes("GOVERNANCE_LINEAGE_MISSING"),
    confidence_visible: !initialFailures.includes("CONFIDENCE_RECORD_HIDDEN"),
    risk_visible: !initialFailures.includes("RISK_RECORD_HIDDEN"),
    domains_separate: !initialFailures.includes("CONFIDENCE_RISK_DOMAIN_COLLAPSED"),
    read_only: true,
    advisory_only: true,
    write_authority_granted: initialFailures.includes("DASHBOARD_WRITE_AUTHORITY_EXPOSED") ? true as never : false,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is ConfidenceRiskDashboardFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<ConfidenceRiskDashboardResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateConfidenceRiskDashboard(result?: ConfidenceRiskDashboardResult): ConfidenceRiskDashboardValidationResult {
  if (!result) {
    const failures = freezeArray<ConfidenceRiskDashboardFailure>(["DASHBOARD_RENDERING_NONDETERMINISTIC"]);
    const base: Omit<ConfidenceRiskDashboardValidationResult, "validation_hash"> = { dashboard_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, read_only: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash
    && result.records.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.calibration_view) === result.calibration_view.integrity_hash
    && hashWithoutIntegrity(result.trend_view) === result.trend_view.integrity_hash
    && hashWithoutIntegrity(result.timeline) === result.timeline.integrity_hash
    && hashWithoutIntegrity(result.drift_view) === result.drift_view.integrity_hash
    && hashWithoutIntegrity(result.evidence_view) === result.evidence_view.integrity_hash
    && hashWithoutIntegrity(result.confidence_proposal_view) === result.confidence_proposal_view.integrity_hash
    && hashWithoutIntegrity(result.risk_adaptation_view) === result.risk_adaptation_view.integrity_hash
    && hashWithoutIntegrity(result.severity_view) === result.severity_view.integrity_hash
    && hashWithoutIntegrity(result.probability_view) === result.probability_view.integrity_hash
    && hashWithoutIntegrity(result.actualization_explorer) === result.actualization_explorer.integrity_hash
    && hashWithoutIntegrity(result.governance_risk_view) === result.governance_risk_view.integrity_hash
    && hashWithoutIntegrity(result.comparison_workspace) === result.comparison_workspace.integrity_hash
    && hashWithoutIntegrity(result.proposal_status_panel) === result.proposal_status_panel.integrity_hash
    && hashWithoutIntegrity(result.replay_explorer) === result.replay_explorer.integrity_hash
    && hashWithoutIntegrity(result.alert_center) === result.alert_center.integrity_hash
    && result.permissions.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash
    && result.validation_tests.every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const read_only = result.read_only && result.advisory_only && !result.write_authority_granted && !result.api_surface.creation_supported && !result.api_surface.mutation_supported && !result.api_surface.confidence_recalibration_supported && !result.api_surface.risk_model_mutation_supported && !result.api_surface.threshold_mutation_supported && !result.api_surface.proposal_approval_supported && !result.api_surface.simulation_bypass_supported && !result.api_surface.rollback_execution_supported && !result.api_surface.authority_expansion_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && read_only;
  const base: Omit<ConfidenceRiskDashboardValidationResult, "validation_hash"> = { dashboard_id: result.dashboard_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, read_only };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayConfidenceRiskDashboard(result: ConfidenceRiskDashboardResult): boolean {
  return validateConfidenceRiskDashboard(result).valid;
}

export function buildConfidenceRiskDashboardObservabilitySurface(result = buildConfidenceRiskDashboard()): ConfidenceRiskDashboardObservabilitySurface {
  return Object.freeze({ dashboard_id: result.dashboard_identifier, status: result.status, validation_outcome: result.validation_outcome, records: result.records.length, failed_tests: result.validation_tests.filter((test) => !test.passed).length, failures: result.failures, replayable: result.replayable, tenant_isolated: result.tenant_isolated, read_only: result.read_only && result.advisory_only && !result.write_authority_granted, integrity_hash: result.integrity_hash });
}

export function getConfidenceRiskDashboardContract(): ConfidenceRiskDashboardContract {
  const result = buildConfidenceRiskDashboard();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      domains: DOMAINS,
      navigation_dimensions: freezeArray(["mission", "tenant", "recommendation", "strategy", "confidence category", "risk category", "drift category", "evidence reliability", "severity", "probability", "governance sensitivity", "adaptation proposal", "simulation", "operator decision", "certification state", "rollback state", "date range", "model version", "policy version"]),
      required_data_sources: freezeArray(["Confidence Adaptation Engine", "Confidence Adaptation Ledger", "Risk Adaptation Engine", "Risk Adaptation Ledger", "Outcome Observation Engine", "Outcome Normalization Engine", "Recommendation Effectiveness Engine", "Pattern Intelligence Engine", "Strategy Evolution Engine", "Governance-Aware Adaptation Layer", "Operator Feedback Integration", "Adaptation Proposal Engine", "Adaptive Simulation Framework", "Drift Defense System", "Replay Engine", "Rollback Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Certification Ledger", "Evidence Registry", "Governance Engine"]),
      read_only: true,
      advisory_only: true,
    }),
    result,
    validation: validateConfidenceRiskDashboard(result),
    observability: buildConfidenceRiskDashboardObservabilitySurface(result),
  });
}

export const ConfidenceRiskDashboard = Object.freeze({ build: buildConfidenceRiskDashboard, validate: validateConfidenceRiskDashboard, replay: replayConfidenceRiskDashboard });
