import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveTransparencyReport,
  ConfidenceRiskVisibilityValidation,
  DashboardVisibilityValidation,
  DriftVisibilityValidation,
  ExplainabilityVisibilityValidation,
  GovernanceVisibilityValidation,
  MemoryVisibilityValidation,
  OperatorVisibilityApiSurface,
  OperatorVisibilityCertificationRecord,
  OperatorVisibilityCertificationReport,
  OperatorVisibilityCertificationTest,
  OperatorVisibilityContract,
  OperatorVisibilityFailure,
  OperatorVisibilityInput,
  OperatorVisibilityObservability,
  OperatorVisibilityResult,
  OperatorVisibilityScenario,
  OperatorVisibilityValidationResult,
  OperatorVisibilityWidget,
  ProposalVisibilityValidation,
  SimulationVisibilityValidation,
  VisibilityRestrictionValidation,
} from "@/types/operator-visibility-certification";

const VERSION = "operator-visibility-certification/v10.15.7" as const;
const ID = "OperatorVisibilityCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly OperatorVisibilityWidget[] = Object.freeze(["Visibility Certification", "Proposal Visibility", "Simulation Visibility", "Drift Visibility", "Governance Visibility", "Confidence Risk Visibility", "Memory Visibility", "Dashboard Visibility", "Explainability", "Visibility Restrictions", "Transparency Report"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failed(failures: readonly OperatorVisibilityFailure[], values: readonly OperatorVisibilityFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }
function failureForScenario(scenario: OperatorVisibilityScenario): OperatorVisibilityFailure | undefined {
  const map: Partial<Record<OperatorVisibilityScenario, OperatorVisibilityFailure>> = {
    HIDDEN_BEHAVIOR: "HIDDEN_ADAPTIVE_BEHAVIOR",
    HIDDEN_PROPOSAL: "HIDDEN_PROPOSAL_GENERATION",
    HIDDEN_SIMULATION: "HIDDEN_SIMULATION_EXECUTION",
    UNDISCLOSED_DRIFT: "UNDISCLOSED_DRIFT_EVENT",
    HIDDEN_GOVERNANCE: "HIDDEN_GOVERNANCE_DECISION",
    UNEXPLAINED_CONFIDENCE: "UNEXPLAINED_CONFIDENCE_ADJUSTMENT",
    UNEXPLAINED_RISK: "UNEXPLAINED_RISK_ADJUSTMENT",
    HIDDEN_MEMORY: "HIDDEN_ADAPTIVE_MEMORY_USAGE",
    DASHBOARD_OMISSION: "DASHBOARD_OMISSION",
    INCOMPLETE_EXPLAINABILITY: "INCOMPLETE_EXPLAINABILITY",
    MISSING_EVIDENCE_REFS: "MISSING_EVIDENCE_REFERENCES",
    MISSING_REPLAY_REFS: "MISSING_REPLAY_REFERENCES",
    INCOMPLETE_GOVERNANCE_LINEAGE: "INCOMPLETE_GOVERNANCE_LINEAGE",
    TENANT_VISIBILITY_BREACH: "TENANT_VISIBILITY_BREACH",
    UNAUTHORIZED_DISCLOSURE: "UNAUTHORIZED_INFORMATION_DISCLOSURE",
    DASHBOARD_RENDERING_INCONSISTENT: "INCONSISTENT_DASHBOARD_RENDERING",
    STALE_DASHBOARD_STATE: "STALE_DASHBOARD_STATE",
    INCOMPLETE_AUDIT_VISIBILITY: "INCOMPLETE_AUDIT_VISIBILITY",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}
function apiSurface(): OperatorVisibilityApiSurface {
  const base: Omit<OperatorVisibilityApiSurface, "integrity_hash"> = { api_id: "operator_visibility_certification_api", retrieve_dashboard: "POST /operator-visibility-certification/dashboard", retrieve_contract: "GET /operator-visibility-certification/contract", retrieve_sections: freezeArray(["certification", "proposal", "simulation", "drift", "governance", "confidence-risk", "memory", "dashboard-visibility", "explainability", "restriction", "report", "transparency"]), validate_certification: "POST /operator-visibility-certification/validate", inspect_certification: "POST /operator-visibility-certification/inspect", mutation_supported: false, hidden_behavior_supported: false, unauthorized_disclosure_supported: false, visibility_override_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function record(input: OperatorVisibilityInput, failures: readonly OperatorVisibilityFailure[]): OperatorVisibilityCertificationRecord {
  const base: Omit<OperatorVisibilityCertificationRecord, "integrity_hash"> = { certification_id: id("operator_visibility_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, proposal_visibility_status: failed(failures, ["HIDDEN_PROPOSAL_GENERATION", "MISSING_EVIDENCE_REFERENCES"]) ? "FAIL" : "PASS", simulation_visibility_status: failures.includes("HIDDEN_SIMULATION_EXECUTION") ? "FAIL" : "PASS", drift_visibility_status: failures.includes("UNDISCLOSED_DRIFT_EVENT") ? "FAIL" : "PASS", governance_visibility_status: failed(failures, ["HIDDEN_GOVERNANCE_DECISION", "INCOMPLETE_GOVERNANCE_LINEAGE"]) ? "FAIL" : "PASS", confidence_visibility_status: failures.includes("UNEXPLAINED_CONFIDENCE_ADJUSTMENT") ? "FAIL" : "PASS", risk_visibility_status: failures.includes("UNEXPLAINED_RISK_ADJUSTMENT") ? "FAIL" : "PASS", memory_visibility_status: failures.includes("HIDDEN_ADAPTIVE_MEMORY_USAGE") ? "FAIL" : "PASS", dashboard_visibility_status: failed(failures, ["DASHBOARD_OMISSION", "INCONSISTENT_DASHBOARD_RENDERING", "STALE_DASHBOARD_STATE"]) ? "FAIL" : "PASS", explainability_status: failed(failures, ["INCOMPLETE_EXPLAINABILITY", "MISSING_EVIDENCE_REFERENCES", "MISSING_REPLAY_REFERENCES", "INCOMPLETE_AUDIT_VISIBILITY"]) ? "FAIL" : "PASS", visibility_restriction_status: failed(failures, ["TENANT_VISIBILITY_BREACH", "UNAUTHORIZED_INFORMATION_DISCLOSURE"]) ? "FAIL" : "PASS", hidden_behavior_detected: failed(failures, ["HIDDEN_ADAPTIVE_BEHAVIOR", "HIDDEN_PROPOSAL_GENERATION", "HIDDEN_SIMULATION_EXECUTION", "HIDDEN_GOVERNANCE_DECISION", "HIDDEN_ADAPTIVE_MEMORY_USAGE"]), findings: failures, evidence_refs: failures.includes("MISSING_EVIDENCE_REFERENCES") ? freezeArray([]) : freezeArray(["evidence:operator-visibility:canonical"]), governance_refs: failures.includes("INCOMPLETE_GOVERNANCE_LINEAGE") ? freezeArray([]) : freezeArray(["governance:operator-visibility:1"]), constitutional_refs: freezeArray(["constitutional:operator-visibility:1"]), replay_refs: failures.includes("MISSING_REPLAY_REFERENCES") ? freezeArray([]) : freezeArray(["replay:operator-visibility:1"]), dashboard_refs: failures.includes("DASHBOARD_OMISSION") ? freezeArray([]) : freezeArray(["dashboard:operator-visibility:1"]), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}
function proposal(failures: readonly OperatorVisibilityFailure[]): ProposalVisibilityValidation {
  const base: Omit<ProposalVisibilityValidation, "integrity_hash"> = { validation_id: "proposal_visibility_validation", generation_visible: !failures.includes("HIDDEN_PROPOSAL_GENERATION"), prioritization_visible: true, suppression_visible: true, evidence_visible: !failures.includes("MISSING_EVIDENCE_REFERENCES"), rationale_visible: !failures.includes("INCOMPLETE_EXPLAINABILITY"), lineage_complete: !failures.includes("MISSING_REPLAY_REFERENCES"), certification_status_visible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function simulation(failures: readonly OperatorVisibilityFailure[]): SimulationVisibilityValidation {
  const ok = !failures.includes("HIDDEN_SIMULATION_EXECUTION");
  const base: Omit<SimulationVisibilityValidation, "integrity_hash"> = { validation_id: "simulation_visibility_validation", execution_visible: ok, scenario_configuration_visible: ok, counterfactual_analysis_visible: ok, assumptions_visible: ok, evidence_visible: ok && !failures.includes("MISSING_EVIDENCE_REFERENCES"), outcomes_visible: ok, comparisons_visible: ok, certification_visible: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function drift(failures: readonly OperatorVisibilityFailure[]): DriftVisibilityValidation {
  const ok = !failures.includes("UNDISCLOSED_DRIFT_EVENT");
  const base: Omit<DriftVisibilityValidation, "integrity_hash"> = { validation_id: "drift_visibility_validation", behavioral_drift_visible: ok, governance_drift_visible: ok, authority_drift_visible: ok, confidence_drift_visible: ok, risk_drift_visible: ok, replay_drift_visible: ok, memory_drift_visible: ok, strategic_drift_visible: ok, classification_severity_evidence_visible: ok, containment_status_visible: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function governance(failures: readonly OperatorVisibilityFailure[]): GovernanceVisibilityValidation {
  const ok = !failures.includes("HIDDEN_GOVERNANCE_DECISION");
  const base: Omit<GovernanceVisibilityValidation, "integrity_hash"> = { validation_id: "governance_visibility_validation", governance_decisions_visible: ok, policy_decisions_visible: ok, approval_workflows_visible: ok, constitutional_reviews_visible: ok, escalation_paths_visible: ok, exception_handling_visible: ok, rationale_visible: ok && !failures.includes("INCOMPLETE_EXPLAINABILITY"), lineage_complete: !failures.includes("INCOMPLETE_GOVERNANCE_LINEAGE"), replayable: !failures.includes("MISSING_REPLAY_REFERENCES") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function confidenceRisk(failures: readonly OperatorVisibilityFailure[]): ConfidenceRiskVisibilityValidation {
  const base: Omit<ConfidenceRiskVisibilityValidation, "integrity_hash"> = { validation_id: "confidence_risk_visibility_validation", confidence_changes_visible: !failures.includes("UNEXPLAINED_CONFIDENCE_ADJUSTMENT"), confidence_rationale_complete: !failures.includes("UNEXPLAINED_CONFIDENCE_ADJUSTMENT"), confidence_replay_available: !failures.includes("MISSING_REPLAY_REFERENCES"), confidence_impact_visible: !failures.includes("UNEXPLAINED_CONFIDENCE_ADJUSTMENT"), risk_adjustments_visible: !failures.includes("UNEXPLAINED_RISK_ADJUSTMENT"), risk_rationale_complete: !failures.includes("UNEXPLAINED_RISK_ADJUSTMENT"), risk_replay_available: !failures.includes("MISSING_REPLAY_REFERENCES"), mitigation_changes_visible: !failures.includes("UNEXPLAINED_RISK_ADJUSTMENT"), prioritization_changes_visible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function memory(failures: readonly OperatorVisibilityFailure[]): MemoryVisibilityValidation {
  const ok = !failures.includes("HIDDEN_ADAPTIVE_MEMORY_USAGE");
  const base: Omit<MemoryVisibilityValidation, "integrity_hash"> = { validation_id: "memory_visibility_validation", qualification_visible: ok, retrieval_visible: ok, reuse_visible: ok, expiration_visible: ok, promotion_visible: ok, governance_visible: ok, lineage_complete: ok && !failures.includes("MISSING_REPLAY_REFERENCES"), replay_available: !failures.includes("MISSING_REPLAY_REFERENCES"), tenant_isolated: !failures.includes("TENANT_VISIBILITY_BREACH") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function dashboard(failures: readonly OperatorVisibilityFailure[]): DashboardVisibilityValidation {
  const complete = !failures.includes("DASHBOARD_OMISSION");
  const base: Omit<DashboardVisibilityValidation, "integrity_hash"> = { validation_id: "dashboard_visibility_validation", rendering_complete: complete, reflects_certified_ledger_state: !failures.includes("STALE_DASHBOARD_STATE"), proposals_visible: complete, simulations_visible: complete, replays_visible: complete, governance_activity_visible: complete, certification_status_visible: complete, confidence_risk_trends_visible: complete, memory_visible: complete, drift_monitoring_visible: complete, approvals_visible: complete, evidence_inspection_available: !failures.includes("MISSING_EVIDENCE_REFERENCES"), lineage_visualization_available: !failures.includes("MISSING_REPLAY_REFERENCES"), rendering_consistent: !failures.includes("INCONSISTENT_DASHBOARD_RENDERING"), state_fresh: !failures.includes("STALE_DASHBOARD_STATE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function explainability(failures: readonly OperatorVisibilityFailure[]): ExplainabilityVisibilityValidation {
  const complete = !failures.includes("INCOMPLETE_EXPLAINABILITY");
  const base: Omit<ExplainabilityVisibilityValidation, "integrity_hash"> = { validation_id: "explainability_visibility_validation", explainability_complete: complete, evidence_refs_available: !failures.includes("MISSING_EVIDENCE_REFERENCES"), governance_refs_available: !failures.includes("INCOMPLETE_GOVERNANCE_LINEAGE"), constitutional_refs_available: true, replay_refs_available: !failures.includes("MISSING_REPLAY_REFERENCES"), confidence_explanation_available: !failures.includes("UNEXPLAINED_CONFIDENCE_ADJUSTMENT"), risk_explanation_available: !failures.includes("UNEXPLAINED_RISK_ADJUSTMENT"), simulation_explanation_available: complete, certification_status_available: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function restriction(failures: readonly OperatorVisibilityFailure[]): VisibilityRestrictionValidation {
  const base: Omit<VisibilityRestrictionValidation, "integrity_hash"> = { validation_id: "visibility_restriction_validation", tenant_isolation_preserved: !failures.includes("TENANT_VISIBILITY_BREACH"), role_based_visibility_enforced: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE"), constitutional_restrictions_enforced: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE"), governance_restrictions_enforced: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE"), evidence_classification_enforced: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE"), mission_confidentiality_preserved: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE"), certification_access_policies_enforced: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE"), unauthorized_disclosure_absent: !failures.includes("UNAUTHORIZED_INFORMATION_DISCLOSURE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function report(record: OperatorVisibilityCertificationRecord): OperatorVisibilityCertificationReport {
  const base: Omit<OperatorVisibilityCertificationReport, "integrity_hash"> = { report_id: "operator_visibility_certification_report", certification_outcome: record.certification_status, proposal_visibility_assessment: record.proposal_visibility_status, simulation_visibility_assessment: record.simulation_visibility_status, drift_transparency_analysis: record.drift_visibility_status, governance_visibility_result: record.governance_visibility_status, confidence_risk_visibility_analysis: record.confidence_visibility_status === "PASS" && record.risk_visibility_status === "PASS" ? "PASS" : "FAIL", adaptive_memory_transparency_assessment: record.memory_visibility_status, dashboard_validation: record.dashboard_visibility_status, explainability_evaluation: record.explainability_status, access_control_verification: record.visibility_restriction_status, findings: record.findings, remediation_actions: record.findings.map((f) => `remediate:${f}`), production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function transparency(record: OperatorVisibilityCertificationRecord): AdaptiveTransparencyReport {
  const base: Omit<AdaptiveTransparencyReport, "integrity_hash"> = { report_id: "adaptive_transparency_report", end_to_end_visibility_coverage: record.certification_status === "CERTIFIED" ? "PASS" : "FAIL", dashboard_completeness: record.dashboard_visibility_status, evidence_inspection_capability: record.evidence_refs.length > 0, replay_navigation_support: record.replay_refs.length > 0, governance_constitutional_transparency: record.governance_refs.length > 0 && record.constitutional_refs.length > 0, memory_transparency: record.memory_visibility_status === "PASS", operator_awareness_score: record.certification_status === "CERTIFIED" ? 1 : 0.97, tenant_isolation_validated: record.visibility_restriction_status === "PASS", certification_evidence_refs: freezeArray([...record.evidence_refs, ...record.governance_refs, ...record.constitutional_refs, ...record.replay_refs, ...record.dashboard_refs]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function test(name: string, passed: boolean, failure: OperatorVisibilityFailure, refs: readonly string[]): OperatorVisibilityCertificationTest {
  const base: Omit<OperatorVisibilityCertificationTest, "integrity_hash"> = { test_id: id("operator_visibility_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<OperatorVisibilityResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly OperatorVisibilityCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Proposal visibility complete", result.proposal_visibility.generation_visible, "HIDDEN_PROPOSAL_GENERATION", refs),
    test("Proposal rationale visible", result.proposal_visibility.rationale_visible, "INCOMPLETE_EXPLAINABILITY", refs),
    test("Proposal lineage complete", result.proposal_visibility.lineage_complete, "MISSING_REPLAY_REFERENCES", refs),
    test("Simulation visibility complete", result.simulation_visibility.execution_visible, "HIDDEN_SIMULATION_EXECUTION", refs),
    test("Simulation assumptions visible", result.simulation_visibility.assumptions_visible, "HIDDEN_SIMULATION_EXECUTION", refs),
    test("Simulation outcomes visible", result.simulation_visibility.outcomes_visible, "HIDDEN_SIMULATION_EXECUTION", refs),
    test("Drift visibility complete", result.drift_visibility.behavioral_drift_visible, "UNDISCLOSED_DRIFT_EVENT", refs),
    test("Governance decisions visible", result.governance_visibility.governance_decisions_visible, "HIDDEN_GOVERNANCE_DECISION", refs),
    test("Governance rationale visible", result.governance_visibility.rationale_visible, "INCOMPLETE_EXPLAINABILITY", refs),
    test("Constitutional reviews visible", result.governance_visibility.constitutional_reviews_visible, "HIDDEN_GOVERNANCE_DECISION", refs),
    test("Confidence changes visible", result.confidence_risk_visibility.confidence_changes_visible, "UNEXPLAINED_CONFIDENCE_ADJUSTMENT", refs),
    test("Confidence rationale complete", result.confidence_risk_visibility.confidence_rationale_complete, "UNEXPLAINED_CONFIDENCE_ADJUSTMENT", refs),
    test("Risk adjustments visible", result.confidence_risk_visibility.risk_adjustments_visible, "UNEXPLAINED_RISK_ADJUSTMENT", refs),
    test("Risk rationale complete", result.confidence_risk_visibility.risk_rationale_complete, "UNEXPLAINED_RISK_ADJUSTMENT", refs),
    test("Adaptive memory usage visible", result.memory_visibility.reuse_visible, "HIDDEN_ADAPTIVE_MEMORY_USAGE", refs),
    test("Memory lineage complete", result.memory_visibility.lineage_complete, "MISSING_REPLAY_REFERENCES", refs),
    test("Dashboard rendering complete", result.dashboard_visibility.rendering_complete, "DASHBOARD_OMISSION", refs),
    test("Dashboard reflects certified ledger state", result.dashboard_visibility.reflects_certified_ledger_state, "STALE_DASHBOARD_STATE", refs),
    test("Explainability complete", result.explainability_visibility.explainability_complete, "INCOMPLETE_EXPLAINABILITY", refs),
    test("Evidence inspection available", result.dashboard_visibility.evidence_inspection_available, "MISSING_EVIDENCE_REFERENCES", refs),
    test("Replay navigation available", result.dashboard_visibility.lineage_visualization_available, "MISSING_REPLAY_REFERENCES", refs),
    test("Hidden adaptive behavior absent", !result.record.hidden_behavior_detected, "HIDDEN_ADAPTIVE_BEHAVIOR", refs),
    test("Tenant isolation preserved", result.visibility_restriction.tenant_isolation_preserved, "TENANT_VISIBILITY_BREACH", refs),
    test("Role-based visibility enforced", result.visibility_restriction.role_based_visibility_enforced, "UNAUTHORIZED_INFORMATION_DISCLOSURE", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}
function replayHash(result: Omit<OperatorVisibilityResult, "replay_hash" | "integrity_hash">): string { return hash({ record: result.record.integrity_hash, proposal: result.proposal_visibility.integrity_hash, simulation: result.simulation_visibility.integrity_hash, drift: result.drift_visibility.integrity_hash, governance: result.governance_visibility.integrity_hash, dashboard: result.dashboard_visibility.integrity_hash, failures: result.failures }); }
function integrityHash(result: Omit<OperatorVisibilityResult, "integrity_hash">): string { return hash({ version: result.operator_visibility_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }
export function certifyOperatorVisibility(input: OperatorVisibilityInput = {}): OperatorVisibilityResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as OperatorVisibilityFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { operator_visibility_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, proposal_visibility: proposal(initialFailures), simulation_visibility: simulation(initialFailures), drift_visibility: drift(initialFailures), governance_visibility: governance(initialFailures), confidence_risk_visibility: confidenceRisk(initialFailures), memory_visibility: memory(initialFailures), dashboard_visibility: dashboard(initialFailures), explainability_visibility: explainability(initialFailures), visibility_restriction: restriction(initialFailures), certification_report: report(rec), transparency_report: transparency(rec), widgets: WIDGETS, visible: initialFailures.length === 0, explainable: rec.explainability_status === "PASS", replayable: rec.replay_refs.length > 0, tenant_safe: rec.visibility_restriction_status === "PASS", production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is OperatorVisibilityFailure => Boolean(f))])]);
  const base: Omit<OperatorVisibilityResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", visible: failures.length === 0, explainable: !failed(failures, ["INCOMPLETE_EXPLAINABILITY", "MISSING_EVIDENCE_REFERENCES", "MISSING_REPLAY_REFERENCES"]), replayable: !failures.includes("MISSING_REPLAY_REFERENCES"), tenant_safe: !failed(failures, ["TENANT_VISIBILITY_BREACH", "UNAUTHORIZED_INFORMATION_DISCLOSURE"]), production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}
export function validateOperatorVisibilityCertification(result?: OperatorVisibilityResult): OperatorVisibilityValidationResult {
  if (!result) {
    const failures = freezeArray<OperatorVisibilityFailure>(["HIDDEN_ADAPTIVE_BEHAVIOR"]);
    const base: Omit<OperatorVisibilityValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.visible && result.explainable && result.replayable && result.tenant_safe && result.production_ready && replay_hash_valid && integrity_hash_valid;
  const base: Omit<OperatorVisibilityValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayOperatorVisibilityCertification(result: OperatorVisibilityResult): boolean { return validateOperatorVisibilityCertification(result).valid; }
export function buildOperatorVisibilityObservability(result = certifyOperatorVisibility()): OperatorVisibilityObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, visible: result.visible, explainable: result.explainable, replayable: result.replayable, tenant_safe: result.tenant_safe, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getOperatorVisibilityContract(): OperatorVisibilityContract {
  const result = certifyOperatorVisibility();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, complete_visibility_required: true, hidden_behavior_prohibited: true, explainability_required: true, replay_navigation_required: true, tenant_safe_visibility_required: true, role_based_visibility_required: true }), result, validation: validateOperatorVisibilityCertification(result), observability: buildOperatorVisibilityObservability(result) });
}
export const OperatorVisibilityCertification = Object.freeze({ certify: certifyOperatorVisibility, validate: validateOperatorVisibilityCertification, replay: replayOperatorVisibilityCertification });
