import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runGovernanceQueryCertification } from "@/services/governance-query-certification";
import type {
  GovernanceDashboardAction,
  GovernanceDashboardEscalation,
  GovernanceDashboardInput,
  GovernanceDashboardMetric,
  GovernanceDashboardNotification,
  GovernanceDashboardObservabilitySurface,
  GovernanceDashboardRecommendation,
  GovernanceDashboardState,
  GovernanceDashboardTenantSummary,
  GovernanceDashboardTrendPoint,
  GovernanceDashboardView,
  GovernanceDashboardWidget,
  GovernanceDashboardWidgetType,
} from "@/types/governance-dashboard";

const NOW = "2026-06-27T15:00:00.000Z";
const SCHEMA_VERSION = "governance-dashboard/v7K.1" as const;
const WIDGET_ORDER: readonly GovernanceDashboardWidgetType[] = [
  "GOVERNANCE_HEALTH",
  "COMPLIANCE_SCORE",
  "RISK_SCORE",
  "RECOMMENDATIONS",
  "ESCALATIONS",
  "POLICY_COMPLIANCE",
  "CONSTITUTIONAL_COMPLIANCE",
  "AUTHORITY_COMPLIANCE",
  "GOVERNANCE_TRENDS",
  "ALERTS",
  "REPLAY_STATUS",
  "INTEGRITY_STATUS",
  "CERTIFICATION_STATUS",
  "MISSION_HEALTH",
  "TENANT_HEALTH",
  "HISTORICAL_TIMELINE",
] as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function stateFromScore(score: number): GovernanceDashboardState {
  if (score >= 90) return "HEALTHY";
  if (score >= 75) return "WATCH";
  if (score >= 50) return "DEGRADED";
  return "BLOCKED";
}

function metric(label: string, value: string | number, score: number, explanation: string, evidence_refs: readonly string[]): GovernanceDashboardMetric {
  return Object.freeze({ label, value, state: stateFromScore(score), explanation, evidence_refs: freezeArray(evidence_refs) });
}

function recommendation(certificationId: string): GovernanceDashboardRecommendation {
  return Object.freeze({
    recommendation_id: "rec:7k1:governance-dashboard:read-only",
    recommendation_type: "VISIBILITY_GUARDRAIL",
    priority: "HIGH",
    confidence: 0.94,
    status: "CERTIFIED",
    supporting_evidence: freezeArray(["evidence:7j5:certification-report", "evidence:7j4:relationship-graph"]),
    policy_refs: freezeArray(["policy:tenant-isolation", "policy:advisory-only-dashboard"]),
    risk_refs: freezeArray(["risk:dashboard:execution-authority"]),
    compliance_refs: freezeArray(["compliance:constitutional-read-only"]),
    lineage_refs: freezeArray([`lineage:${certificationId}:dashboard`]),
    advisory_disclaimer: "Advisory-only. Execution authority is not available from the dashboard.",
  });
}

function escalation(status: string): GovernanceDashboardEscalation {
  return Object.freeze({
    escalation_id: "esc:7k1:certification-watch",
    severity: status === "PASS" ? "INFO" : status === "CONDITIONAL_PASS" ? "MEDIUM" : "CRITICAL",
    trigger_reason: status === "PASS" ? "Governance query framework certified." : "Certification requires operator visibility.",
    routing_destination: "governance-operations",
    resolution_status: status === "PASS" ? "RESOLVED" : "MONITORING",
    confidence: status === "PASS" ? 0.96 : 0.78,
    required_operator_actions: freezeArray(status === "PASS" ? ["Monitor certified dashboard signals."] : ["Review certification issues before dependency enablement."]),
  });
}

function notification(status: string): GovernanceDashboardNotification {
  return Object.freeze({
    notification_id: "note:7k1:certification",
    priority: status === "PASS" ? "INFORMATIONAL" : "CRITICAL",
    type: status === "PASS" ? "NEW_RECOMMENDATION" : "CERTIFICATION_FAILURE",
    message: status === "PASS" ? "Governance Query & Search is certified for dashboard visibility." : "Governance certification is not PASS; dashboard remains observational.",
    evidence_refs: freezeArray(["evidence:7j5:query-certification"]),
    created_at: NOW,
  });
}

function trend(status: "PASS" | "CONDITIONAL_PASS" | "FAIL", offset: number): GovernanceDashboardTrendPoint {
  return Object.freeze({
    timestamp: `2026-06-${String(24 + offset).padStart(2, "0")}T15:00:00.000Z`,
    governance_health: status === "PASS" ? 91 + offset : 72 - offset,
    compliance_score: status === "PASS" ? 93 : 76,
    risk_score: status === "PASS" ? 18 - offset : 44 + offset,
    recommendation_volume: 4 + offset,
    escalation_frequency: status === "PASS" ? 1 : 3,
    replay_success: status === "PASS" ? 100 : 82,
    certification_status: status,
  });
}

function widget(type: GovernanceDashboardWidgetType, order: number, value: string | number, state: GovernanceDashboardState, certificationRef: string): GovernanceDashboardWidget {
  const source = {
    widget_id: `GDW-7K1-${String(order).padStart(2, "0")}`,
    type,
    title: type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
    value,
    state,
    order,
    replay_ref: "replay:governance-dashboard:7k1",
    certification_ref: certificationRef,
    immutable_timestamp: NOW,
  };
  return Object.freeze({ ...source, widget_hash: hashValue("governance-dashboard-widget", source) });
}

export function buildGovernanceDashboardView(input: GovernanceDashboardInput = {}): GovernanceDashboardView {
  const certification = runGovernanceQueryCertification({ scenario: input.certification_status === "FAIL" ? "HASH_MISMATCH" : input.certification_status === "CONDITIONAL_PASS" ? "MINOR_PERFORMANCE_OPTIMIZATION" : "BASELINE" });
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const mission_id = input.mission_id ?? "mission_governance_001";
  const operator_id = input.operator_id ?? "operator_console";
  const healthScore = certification.status === "PASS" ? 94 : certification.status === "CONDITIONAL_PASS" ? 78 : 42;
  const governanceStatus = stateFromScore(healthScore);
  const mission_summary = Object.freeze({
    tenant_id,
    mission_id,
    mission_state: certification.status === "FAIL" ? "BLOCKED" as const : "ACTIVE" as const,
    mission_lifecycle: certification.status === "PASS" ? "CERTIFIED" as const : "WATCH" as const,
    governance_status: governanceStatus,
    governance_health_score: healthScore,
    active_governance_issues: certification.report.tests_failed,
    overall_confidence: certification.status === "PASS" ? 0.95 : 0.72,
    replay_available: Boolean(certification.historical_response?.replay_validation?.replay_valid),
    certification_status: certification.status,
    last_governance_evaluation: NOW,
  });
  const tenant_summary: GovernanceDashboardTenantSummary = Object.freeze({
    tenant_id,
    active_missions: 4,
    certified_missions: certification.status === "PASS" ? 4 : 3,
    pending_governance_reviews: certification.status === "PASS" ? 0 : 1,
    tenant_compliance_score: certification.status === "PASS" ? 93 : 76,
    aggregate_governance_risk: certification.status === "PASS" ? 18 : 44,
    active_escalations: certification.status === "PASS" ? 1 : 3,
    replay_coverage: certification.status === "PASS" ? 100 : 82,
    integrity_status: certification.status === "FAIL" ? "DEGRADED" : "VALID",
  });
  const evidenceRefs = freezeArray(["evidence:7j5:query-certification", "evidence:7j4:cross-ledger-correlation"]);
  const governance_summary = freezeArray([
    metric("Governance health", healthScore, healthScore, "Certified governance posture from Phase 7J outputs.", evidenceRefs),
    metric("Governance confidence", `${Math.round(mission_summary.overall_confidence * 100)}%`, healthScore, "Confidence is derived from certification, replay, and correlation visibility.", evidenceRefs),
    metric("Replay readiness", certification.historical_response?.replay_validation?.replay_valid ? "Ready" : "Review", healthScore, "Replay availability is surfaced without granting replay mutation.", evidenceRefs),
  ]);
  const compliance = freezeArray([
    metric("Overall compliance", tenant_summary.tenant_compliance_score, tenant_summary.tenant_compliance_score, "Compliance view is certified and tenant-scoped.", evidenceRefs),
    metric("Constitutional compliance", certification.report.security_validation ? "Verified" : "Blocked", certification.report.security_validation ? 96 : 40, "Constitutional boundary checks come from the certification gate.", evidenceRefs),
    metric("Authority compliance", "Read-only", 98, "Dashboard does not expose approval or execution authority.", evidenceRefs),
  ]);
  const risks = freezeArray([
    metric("Governance risk", tenant_summary.aggregate_governance_risk, 100 - tenant_summary.aggregate_governance_risk, "Risk score is observational and tied to certified query health.", evidenceRefs),
    metric("Emerging risks", certification.status === "PASS" ? 1 : 3, certification.status === "PASS" ? 90 : 67, "Risk trend signals are visible for operator review.", evidenceRefs),
  ]);
  const recommendations = freezeArray([recommendation(certification.certification_id)]);
  const escalations = freezeArray([escalation(certification.status)]);
  const historical_trends = freezeArray([trend(certification.status, 0), trend(certification.status, 1), trend(certification.status, 2)]);
  const notifications = freezeArray([notification(certification.status)]);
  const replay_status = Object.freeze({
    state: certification.historical_response?.replay_validation?.replay_valid ? "VERIFIED" as const : "PENDING" as const,
    replay_hash: certification.historical_response?.replay_validation?.validation_hash ?? "replay:pending",
    last_replay_timestamp: NOW,
    reconstruction_status: certification.historical_response?.reconstruction_state === "SNAPSHOT_RECONSTRUCTED" ? "COMPLETE" as const : "PARTIAL" as const,
    replay_consistency: certification.historical_response?.replay_validation?.replay_valid === true,
  });
  const certification_status = Object.freeze({
    state: certification.status,
    certification_id: certification.certification_id,
    certification_hash: certification.report.certification_hash,
    outstanding_issues: freezeArray(certification.tests.filter((test) => test.actual === "FAIL").map((test) => test.name).sort()),
  });
  const widgets = freezeArray(WIDGET_ORDER.map((type, index) => {
    const value = type === "GOVERNANCE_HEALTH" || type === "MISSION_HEALTH" ? healthScore :
      type === "COMPLIANCE_SCORE" ? tenant_summary.tenant_compliance_score :
      type === "RISK_SCORE" ? tenant_summary.aggregate_governance_risk :
      type === "RECOMMENDATIONS" ? recommendations.length :
      type === "ESCALATIONS" ? escalations.length :
      type === "CERTIFICATION_STATUS" ? certification.status :
      type === "REPLAY_STATUS" ? replay_status.state :
      type === "TENANT_HEALTH" ? tenant_summary.certified_missions :
      type === "ALERTS" ? notifications.length :
      type === "HISTORICAL_TIMELINE" ? historical_trends.length :
      "Visible";
    return widget(type, index + 1, value, type === "RISK_SCORE" ? stateFromScore(100 - tenant_summary.aggregate_governance_risk) : governanceStatus, certification.certification_id);
  }));
  const source = {
    dashboard_id: `GD-7K1-${hashValue("governance-dashboard-id", { tenant_id, mission_id, operator_id }).slice(0, 10).toUpperCase()}`,
    schema_version: SCHEMA_VERSION,
    tenant_id,
    mission_id,
    operator_id,
    read_only: true as const,
    advisory_only: true as const,
    mutation_allowed: false as const,
    approval_allowed: false as const,
    execution_allowed: false as const,
    tenant_isolated: true,
    authorization_enforced: true,
    deterministic_ordering: WIDGET_ORDER,
    mission_summary,
    tenant_summary,
    governance_summary,
    recommendations,
    compliance,
    risks,
    escalations,
    historical_trends,
    notifications,
    replay_status,
    certification_status,
    widgets,
  };
  return Object.freeze({ ...source, dashboard_hash: hashValue("governance-dashboard-view", source) });
}

export function buildGovernanceDashboardObservabilitySurface(input: GovernanceDashboardInput = {}): GovernanceDashboardObservabilitySurface {
  const view = buildGovernanceDashboardView(input);
  return Object.freeze({
    dashboard_id: view.dashboard_id,
    tenant_id: view.tenant_id,
    mission_id: view.mission_id,
    widget_count: view.widgets.length,
    notification_count: view.notifications.length,
    governance_status: view.mission_summary.governance_status,
    certification_status: view.certification_status.state,
    read_only: true,
    dashboard_hash: view.dashboard_hash,
  });
}

export function assertGovernanceDashboardActionBlocked(action: GovernanceDashboardAction): never {
  throw new Error(`Governance Dashboard is read-only; ${action} is not permitted.`);
}

export function getGovernanceDashboardContract() {
  const view = buildGovernanceDashboardView();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["read-only", "advisory-only", "deterministic", "replayable", "explainable", "constitution-protected", "tenant-isolated", "immutable-references", "audit-friendly", "operator-centered"]),
      schema_version: SCHEMA_VERSION,
      widgets: WIDGET_ORDER,
      prohibited_actions: freezeArray(["MODIFY_POLICY", "APPROVE_RECOMMENDATION", "EXECUTE_RECOMMENDATION", "OVERRIDE_GOVERNANCE", "ALTER_REPLAY", "MODIFY_INTEGRITY"] as const),
    }),
    view,
    observability: buildGovernanceDashboardObservabilitySurface(),
  });
}
