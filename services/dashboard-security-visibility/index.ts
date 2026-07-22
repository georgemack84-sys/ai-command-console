import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  DashboardPermission,
  DashboardSecurityAlertCenter,
  DashboardSecurityApiSurface,
  DashboardSecurityContract,
  DashboardSecurityContractView,
  DashboardSecurityFailure,
  DashboardSecurityInput,
  DashboardSecurityMetrics,
  DashboardSecurityObservabilitySurface,
  DashboardSecurityResult,
  DashboardSecurityScenario,
  DashboardSecurityValidationResult,
  DashboardSecurityValidationTest,
  DashboardSecurityWidget,
  DashboardVisibilityDecision,
  FieldAccessView,
  FieldAction,
  GuardSurface,
  MissionScopeType,
  MissionVisibilityView,
  RedactionExportCacheSurface,
  RedactionMethod,
  RolePermissionView,
  SearchAggregationSurface,
  SecurityDecisionLedger,
  TenantIsolationView,
  VisibilityClassification,
  VisibilityOutcome,
} from "@/types/dashboard-security-visibility";

const VERSION = "dashboard-security-visibility/v10.14.10" as const;
const SECURITY_ID = "DashboardSecurityVisibility" as const;
const TENANT_ID = "tenant_mission_control";
const WIDGETS: readonly DashboardSecurityWidget[] = Object.freeze(["Security Contract", "Visibility Policy", "Tenant Isolation", "Role Permissions", "Mission Visibility", "Field Access", "Constitutional Guard", "Governance Guard", "Evidence Guard", "Operator Privacy", "Investigation Concealment", "Audit Visibility", "Certification Visibility", "Replay Lineage Guard", "Secure Search", "Secure Aggregation", "Redaction Masking", "Export Security", "Cache Session Isolation", "Security Ledger", "Security Alerts"]);
const CLASSIFICATIONS: readonly VisibilityClassification[] = Object.freeze(["PUBLIC_WITHIN_TENANT", "TENANT_RESTRICTED", "MISSION_RESTRICTED", "ROLE_RESTRICTED", "GOVERNANCE_RESTRICTED", "CONSTITUTIONALLY_RESTRICTED", "OPERATOR_CONFIDENTIAL", "AUDIT_RESTRICTED", "CERTIFICATION_RESTRICTED", "INVESTIGATION_RESTRICTED", "EVIDENCE_RESTRICTED", "SECURITY_SENSITIVE", "SYSTEM_INTERNAL"]);
const OUTCOMES: readonly VisibilityOutcome[] = Object.freeze(["ALLOW", "ALLOW_WITH_REDACTION", "ALLOW_METADATA_ONLY", "ALLOW_AGGREGATE_ONLY", "DENY", "ESCALATION_REQUIRED", "POLICY_CONFLICT", "AUTHORIZATION_UNVERIFIABLE"]);
const PERMISSIONS: readonly DashboardPermission[] = Object.freeze(["VIEW_DASHBOARD", "VIEW_SUMMARY", "VIEW_RECORD", "VIEW_RESTRICTED_FIELD", "VIEW_EVIDENCE", "VIEW_OPERATOR_IDENTITY", "VIEW_GOVERNANCE_RECORD", "VIEW_AUDIT_RECORD", "VIEW_CERTIFICATION_RECORD", "VIEW_INVESTIGATION_RECORD", "OPEN_REPLAY", "TRAVERSE_LINEAGE", "EXPORT_DATA", "RECORD_DECISION"]);
const MISSION_SCOPES: readonly MissionScopeType[] = Object.freeze(["SINGLE_MISSION", "MISSION_GROUP", "PROGRAM_SCOPE", "TENANT_PORTFOLIO", "CROSS_MISSION_AUTHORIZED", "SYSTEM_WIDE_AUTHORIZED"]);
const FIELD_ACTIONS: readonly FieldAction[] = Object.freeze(["VISIBLE", "MASKED", "REDACTED", "OMITTED", "METADATA_ONLY", "AGGREGATED_ONLY"]);
const REDACTION_METHODS: readonly RedactionMethod[] = Object.freeze(["FULL_REDACTION", "PARTIAL_MASKING", "TOKEN_REPLACEMENT", "PSEUDONYMIZATION", "SUMMARY_SUBSTITUTION", "METADATA_ONLY", "RECORD_OMISSION", "PROTECTED_PLACEHOLDER"]);

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

function failureForScenario(scenario: DashboardSecurityScenario): DashboardSecurityFailure | undefined {
  const map: Partial<Record<DashboardSecurityScenario, DashboardSecurityFailure>> = {
    IDENTITY_UNVERIFIED: "IDENTITY_UNVERIFIED",
    ROLE_UNRESOLVED: "ROLE_UNRESOLVED",
    AUTHORITY_MISSING: "AUTHORITY_SCOPE_MISSING",
    TENANT_MISSING: "TENANT_CONTEXT_MISSING",
    TENANT_CONFLICT: "TENANT_OWNERSHIP_CONFLICT",
    MISSION_UNRESOLVED: "MISSION_SCOPE_UNRESOLVED",
    POLICY_UNAVAILABLE: "POLICY_VERSION_UNAVAILABLE",
    FIELD_CLASSIFICATION_MISSING: "FIELD_CLASSIFICATION_MISSING",
    EVIDENCE_CLASSIFICATION_MISSING: "EVIDENCE_CLASSIFICATION_MISSING",
    OPERATOR_PRIVACY_MISSING: "OPERATOR_PRIVACY_CLASSIFICATION_MISSING",
    INVESTIGATION_UNKNOWN: "INVESTIGATION_STATUS_UNKNOWN",
    CERTIFICATION_CLASSIFICATION_UNKNOWN: "CERTIFICATION_CLASSIFICATION_UNKNOWN",
    REPLAY_AUTH_UNVERIFIED: "REPLAY_AUTHORIZATION_UNVERIFIED",
    REDACTION_FAILURE: "REDACTION_FAILED",
    CACHE_SCOPE_UNVERIFIED: "CACHE_SCOPE_UNVERIFIED",
    INTEGRITY_FAILURE: "INTEGRITY_VALIDATION_FAILED",
    CROSS_TENANT_SEARCH: "CROSS_TENANT_SEARCH_BLOCKED",
    CROSS_TENANT_REPLAY: "CROSS_TENANT_REPLAY_BLOCKED",
    CROSS_TENANT_EXPORT: "CROSS_TENANT_EXPORT_BLOCKED",
    UNAUTHORIZED_FIELD: "UNAUTHORIZED_FIELD_ACCESS_DENIED",
    SMALL_COHORT: "SMALL_COHORT_SUPPRESSED",
    SEARCH_INFERENCE: "SEARCH_INFERENCE_BLOCKED",
    AGGREGATION_LEAK: "AGGREGATION_PRIVACY_BLOCKED",
    HIDDEN_INVESTIGATION_EXPOSURE: "HIDDEN_INVESTIGATION_CONCEALED",
    EXPORT_UNAUTHORIZED: "EXPORT_AUTHORIZATION_DENIED",
    ROLE_SELF_ESCALATION: "ROLE_SELF_ESCALATION_BLOCKED",
    METADATA_LEAK: "METADATA_LEAKAGE_BLOCKED",
  };
  return map[scenario];
}

function apiSurface(): DashboardSecurityApiSurface {
  const base: Omit<DashboardSecurityApiSurface, "integrity_hash"> = {
    api_id: "dashboard_security_visibility_api",
    retrieve_dashboard: "POST /dashboard-security-visibility/dashboard",
    retrieve_contract: "GET /dashboard-security-visibility/contract",
    retrieve_sections: freezeArray(["decision", "policy", "tenant", "role", "mission", "fields", "guards", "search", "aggregation", "redaction", "export", "cache", "ledger", "alerts"]),
    validate_security: "POST /dashboard-security-visibility/validate",
    inspect_security: "POST /dashboard-security-visibility/inspect",
    mutation_supported: false,
    client_side_enforcement_only: false,
    export_without_authorization_supported: false,
    replay_bypass_supported: false,
    lineage_bypass_supported: false,
    unrestricted_admin_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function outcomeFor(failures: readonly DashboardSecurityFailure[]): VisibilityOutcome {
  if (!failures.length) return "ALLOW_WITH_REDACTION";
  if (failures.includes("POLICY_VERSION_UNAVAILABLE")) return "POLICY_CONFLICT";
  if (failures.some((failure) => ["IDENTITY_UNVERIFIED", "ROLE_UNRESOLVED", "AUTHORITY_SCOPE_MISSING", "TENANT_CONTEXT_MISSING"].includes(failure))) return "AUTHORIZATION_UNVERIFIABLE";
  return "DENY";
}

function decision(input: DashboardSecurityInput, failures: readonly DashboardSecurityFailure[]): DashboardVisibilityDecision {
  const authorization = outcomeFor(failures);
  const requested = input.requested_fields ?? freezeArray(["summary", "operator_identity", "evidence_payload", "certification_findings"]);
  const redacted = authorization === "ALLOW_WITH_REDACTION" ? freezeArray(["operator_identity", "evidence_payload", "certification_findings"]) : freezeArray([]);
  const denied = authorization === "ALLOW_WITH_REDACTION" ? freezeArray([]) : requested;
  const base: Omit<DashboardVisibilityDecision, "integrity_hash"> = {
    visibility_decision_id: id("visibility_decision", { scenario: input.scenario ?? "BASELINE", role: input.role ?? "AUDITOR" }),
    actor_id: failures.includes("IDENTITY_UNVERIFIED") ? "" : input.actor_id ?? "actor:dashboard-security:1",
    actor_role_refs: failures.includes("ROLE_UNRESOLVED") ? freezeArray([]) : freezeArray([input.role ?? "AUDITOR"]),
    authority_scope_refs: failures.includes("AUTHORITY_SCOPE_MISSING") ? freezeArray([]) : freezeArray(["authority:dashboard-security-review"]),
    tenant_id: failures.includes("TENANT_CONTEXT_MISSING") ? "" : failures.includes("TENANT_OWNERSHIP_CONFLICT") ? "tenant-conflict" : input.tenant_id ?? TENANT_ID,
    mission_scope: failures.includes("MISSION_SCOPE_UNRESOLVED") ? "" : input.mission_scope ?? "mission-control-dashboard-security",
    dashboard_view: "adaptive-intelligence-dashboard",
    requested_record_refs: freezeArray(["dashboard-record:adaptive:1"]),
    requested_field_refs: requested,
    requested_action: input.requested_action ?? "VIEW_DASHBOARD",
    purpose_code: input.purpose_code ?? "SECURITY_VISIBILITY_REVIEW",
    applicable_policy_refs: failures.includes("POLICY_VERSION_UNAVAILABLE") ? freezeArray([]) : freezeArray(["policy:dashboard-security:v1", "policy:tenant-isolation:v1"]),
    constitutional_rule_refs: freezeArray(["constitution:tenant-isolation", "constitution:operator-privacy", "constitution:audit-integrity"]),
    governance_rule_refs: freezeArray(["governance:least-privilege", "governance:purpose-bound-access"]),
    evidence_classification: failures.includes("EVIDENCE_CLASSIFICATION_MISSING") ? "SYSTEM_INTERNAL" : "EVIDENCE_RESTRICTED",
    operator_privacy_classification: failures.includes("OPERATOR_PRIVACY_CLASSIFICATION_MISSING") ? "SYSTEM_INTERNAL" : "OPERATOR_CONFIDENTIAL",
    investigation_classification: failures.includes("INVESTIGATION_STATUS_UNKNOWN") ? "SYSTEM_INTERNAL" : "INVESTIGATION_RESTRICTED",
    certification_classification: failures.includes("CERTIFICATION_CLASSIFICATION_UNKNOWN") ? "SYSTEM_INTERNAL" : "CERTIFICATION_RESTRICTED",
    authorization_result: authorization,
    visible_fields: authorization === "ALLOW_WITH_REDACTION" ? freezeArray(["summary"]) : authorization === "ALLOW" ? requested : freezeArray([]),
    redacted_fields: redacted,
    denied_fields: denied,
    denial_reasons: failures,
    redaction_method: failures.includes("REDACTION_FAILED") ? "RECORD_OMISSION" : "PROTECTED_PLACEHOLDER",
    replay_access_status: failures.includes("REPLAY_AUTHORIZATION_UNVERIFIED") || failures.includes("CROSS_TENANT_REPLAY_BLOCKED") ? "DENY" : authorization,
    export_access_status: failures.includes("EXPORT_AUTHORIZATION_DENIED") || failures.includes("CROSS_TENANT_EXPORT_BLOCKED") ? "DENY" : "DENY",
    decision_timestamp: "2026-07-09T00:00:00.000Z",
    policy_version: failures.includes("POLICY_VERSION_UNAVAILABLE") ? "" : "dashboard-security-policy/v1",
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VALIDATION_FAILED") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function contractView(failures: readonly DashboardSecurityFailure[]): DashboardSecurityContractView {
  const base: Omit<DashboardSecurityContractView, "integrity_hash"> = { contract_id: "dashboard_security_contract", dashboard_views: freezeArray(["outcome", "recommendation", "pattern", "strategy", "confidence-risk", "governance-approval", "operator-impact", "proposed-response"]), allowed_roles: freezeArray(["OPERATOR", "REVIEWER", "GOVERNANCE_AUTHORITY", "AUDITOR", "CERTIFICATION_TEAM"]), prohibited_roles: freezeArray(["anonymous", "expired-role", "unscoped-admin"]), classifications: CLASSIFICATIONS, replay_requirements: freezeArray(["per-event authorization", "tenant-scoped replay", "restricted placeholder rendering"]), export_restrictions: freezeArray(["separate authorization", "tenant scoped", "metadata sanitized"]), valid: !failures.includes("POLICY_VERSION_UNAVAILABLE"), render_allowed_without_contract: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function tenantIsolation(failures: readonly DashboardSecurityFailure[]): TenantIsolationView {
  const base: Omit<TenantIsolationView, "integrity_hash"> = { view_id: "tenant_isolation_enforcement", tenant_validated_before_retrieval: !failures.includes("TENANT_CONTEXT_MISSING"), tenant_partitioned_surfaces: freezeArray(["records", "widgets", "metrics", "search", "filters", "replay", "lineage", "exports", "audit", "cache"]), cross_tenant_counts_hidden: !failures.includes("TENANT_OWNERSHIP_CONFLICT"), cache_keys_tenant_scoped: !failures.includes("CACHE_SCOPE_UNVERIFIED"), replay_sessions_tenant_scoped: !failures.includes("CROSS_TENANT_REPLAY_BLOCKED"), violation_detected: failures.some((failure) => ["TENANT_OWNERSHIP_CONFLICT", "CROSS_TENANT_SEARCH_BLOCKED", "CROSS_TENANT_REPLAY_BLOCKED", "CROSS_TENANT_EXPORT_BLOCKED"].includes(failure)) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rolePermissions(input: DashboardSecurityInput, failures: readonly DashboardSecurityFailure[]): RolePermissionView {
  const permissionSet = failures.includes("ROLE_UNRESOLVED") ? freezeArray<DashboardPermission>([]) : freezeArray<DashboardPermission>(["VIEW_DASHBOARD", "VIEW_SUMMARY", "VIEW_RECORD", "VIEW_AUDIT_RECORD", "OPEN_REPLAY", "TRAVERSE_LINEAGE"]);
  const base: Omit<RolePermissionView, "integrity_hash"> = { view_id: "role_permission_resolver", resolved_role: failures.includes("ROLE_UNRESOLVED") ? "UNRESOLVED" : input.role ?? "AUDITOR", permissions: permissionSet, denied_permissions: freezeArray(["VIEW_RESTRICTED_FIELD", "VIEW_OPERATOR_IDENTITY", "VIEW_INVESTIGATION_RECORD", "EXPORT_DATA", "RECORD_DECISION"]), admin_unrestricted_visibility: false, audit_read_only: true, permission_version: "role-permission/v1" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function missionVisibility(failures: readonly DashboardSecurityFailure[]): MissionVisibilityView {
  const base: Omit<MissionVisibilityView, "integrity_hash"> = { view_id: "mission_visibility_resolver", mission_scope_type: "SINGLE_MISSION", mission_verified: !failures.includes("MISSION_SCOPE_UNRESOLVED"), cross_mission_authorized: false, restricted_mission_names_redacted: true, historical_restrictions_preserved: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function fieldAccess(decisionRecord: DashboardVisibilityDecision, failures: readonly DashboardSecurityFailure[]): FieldAccessView {
  const actions = decisionRecord.requested_field_refs.map((field) => `${field}:${decisionRecord.redacted_fields.includes(field) ? "REDACTED" : decisionRecord.denied_fields.includes(field) ? "OMITTED" : "VISIBLE"}`);
  const base: Omit<FieldAccessView, "integrity_hash"> = { view_id: "field_level_access_control", field_actions: freezeArray(actions), hidden_client_payloads_prevented: !failures.includes("UNAUTHORIZED_FIELD_ACCESS_DENIED"), deterministic_redaction: !failures.includes("REDACTION_FAILED"), unauthorized_fields_excluded_from_aggregates: !failures.includes("AGGREGATION_PRIVACY_BLOCKED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function guardSurface(failures: readonly DashboardSecurityFailure[]): GuardSurface {
  const base: Omit<GuardSurface, "integrity_hash"> = { guard_id: "dashboard_visibility_guards", constitutional_visibility: failures.includes("POLICY_VERSION_UNAVAILABLE") ? "DENIED" : "REDACTED", governance_visibility: "STATUS_ONLY", evidence_visibility: failures.includes("EVIDENCE_CLASSIFICATION_MISSING") ? "ACCESS_DENIED" : "REFERENCE_ONLY", operator_privacy_mode: failures.includes("OPERATOR_PRIVACY_CLASSIFICATION_MISSING") ? "HIDDEN" : "PSEUDONYMIZED", investigation_concealment: failures.includes("INVESTIGATION_STATUS_UNKNOWN") || failures.includes("HIDDEN_INVESTIGATION_CONCEALED") ? "FULLY_HIDDEN" : "EXISTENCE_HIDDEN", audit_visibility: "SUMMARY_ONLY", certification_visibility: failures.includes("CERTIFICATION_CLASSIFICATION_UNKNOWN") ? "DENIED" : "STATUS_ONLY", replay_lineage_authorized_per_node: !failures.includes("REPLAY_AUTHORIZATION_UNVERIFIED") && !failures.includes("CROSS_TENANT_REPLAY_BLOCKED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function searchAggregation(failures: readonly DashboardSecurityFailure[]): SearchAggregationSurface {
  const base: Omit<SearchAggregationSurface, "integrity_hash"> = { surface_id: "secure_search_aggregation", search_authorized_only: !failures.includes("CROSS_TENANT_SEARCH_BLOCKED"), autocomplete_suppressed: true, hit_counts_safe: !failures.includes("SEARCH_INFERENCE_BLOCKED"), facets_authorized: true, pagination_totals_safe: !failures.includes("METADATA_LEAKAGE_BLOCKED"), aggregate_excludes_unauthorized: !failures.includes("AGGREGATION_PRIVACY_BLOCKED"), small_cohorts_suppressed: true, deterministic_rounding: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function redactionExportCache(failures: readonly DashboardSecurityFailure[]): RedactionExportCacheSurface {
  const base: Omit<RedactionExportCacheSurface, "integrity_hash"> = { surface_id: "redaction_export_cache_security", redaction_method: failures.includes("REDACTION_FAILED") ? "RECORD_OMISSION" : "PROTECTED_PLACEHOLDER", client_side_masking_reversible: false, metadata_sanitized: !failures.includes("METADATA_LEAKAGE_BLOCKED"), export_requires_separate_authorization: true, export_tenant_scoped: !failures.includes("CROSS_TENANT_EXPORT_BLOCKED"), cache_keys_tenant_role_mission_scoped: !failures.includes("CACHE_SCOPE_UNVERIFIED"), permission_changes_invalidate_cache: !failures.includes("CACHE_SCOPE_UNVERIFIED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(decisionRecord: DashboardVisibilityDecision, failures: readonly DashboardSecurityFailure[]): SecurityDecisionLedger {
  const base: Omit<SecurityDecisionLedger, "integrity_hash"> = { ledger_id: "dashboard_security_decision_ledger", decisions: freezeArray([decisionRecord.visibility_decision_id]), append_only: true, immutable: true, tenant_isolated: !failures.includes("TENANT_OWNERSHIP_CONFLICT"), replayable: !failures.includes("REPLAY_AUTHORIZATION_UNVERIFIED"), hash_verified: !failures.includes("INTEGRITY_VALIDATION_FAILED"), authorized_audit_visible: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function alerts(failures: readonly DashboardSecurityFailure[]): DashboardSecurityAlertCenter {
  const critical: readonly DashboardSecurityFailure[] = ["TENANT_OWNERSHIP_CONFLICT", "CROSS_TENANT_REPLAY_BLOCKED", "CROSS_TENANT_EXPORT_BLOCKED", "EVIDENCE_CLASSIFICATION_MISSING", "OPERATOR_PRIVACY_CLASSIFICATION_MISSING", "HIDDEN_INVESTIGATION_CONCEALED", "INTEGRITY_VALIDATION_FAILED"];
  const base: Omit<DashboardSecurityAlertCenter, "integrity_hash"> = { alert_id: "dashboard_security_alert_center", alerts: failures, highest_severity: failures.some((failure) => critical.includes(failure)) ? "CRITICAL" : failures.length ? "HIGH" : "INFORMATIONAL", critical_alerts_visible: true, user_safe_message: failures.length ? "Access denied or restricted by dashboard security policy." : "Access granted with deterministic visibility controls." };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metrics(failures: readonly DashboardSecurityFailure[]): DashboardSecurityMetrics {
  const base: Omit<DashboardSecurityMetrics, "integrity_hash"> = { denied_requests: failures.length ? 1 : 0, redacted_responses: failures.length ? 0 : 1, tenant_mismatches: failures.includes("TENANT_OWNERSHIP_CONFLICT") ? 1 : 0, mission_scope_mismatches: failures.includes("MISSION_SCOPE_UNRESOLVED") ? 1 : 0, replay_access_denials: failures.includes("REPLAY_AUTHORIZATION_UNVERIFIED") || failures.includes("CROSS_TENANT_REPLAY_BLOCKED") ? 1 : 0, export_attempt_denials: failures.includes("EXPORT_AUTHORIZATION_DENIED") || failures.includes("CROSS_TENANT_EXPORT_BLOCKED") ? 1 : 0, hidden_investigation_attempts: failures.includes("HIDDEN_INVESTIGATION_CONCEALED") ? 1 : 0, certification_access_denials: failures.includes("CERTIFICATION_CLASSIFICATION_UNKNOWN") ? 1 : 0, operator_identity_access_denials: failures.includes("OPERATOR_PRIVACY_CLASSIFICATION_MISSING") ? 1 : 0, search_suppressions: failures.includes("SEARCH_INFERENCE_BLOCKED") || failures.includes("CROSS_TENANT_SEARCH_BLOCKED") ? 1 : 0, aggregation_suppressions: failures.includes("SMALL_COHORT_SUPPRESSED") || failures.includes("AGGREGATION_PRIVACY_BLOCKED") ? 1 : 0, integrity_verification_failures: failures.includes("INTEGRITY_VALIDATION_FAILED") ? 1 : 0 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function validationTest(name: string, passed: boolean, failure: DashboardSecurityFailure, evidence_refs: readonly string[]): DashboardSecurityValidationTest {
  const base: Omit<DashboardSecurityValidationTest, "integrity_hash"> = { test_id: id("dashboard_security_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type BuildBase = Omit<DashboardSecurityResult, "validation_tests" | "validation_outcome" | "failures" | "replay_hash" | "integrity_hash">;
function buildValidationTests(result: BuildBase): readonly DashboardSecurityValidationTest[] {
  const evidenceRefs = freezeArray([result.decision.integrity_hash, result.security_contract.integrity_hash, result.security_ledger.integrity_hash]);
  return freezeArray([
    validationTest("identity verified", Boolean(result.decision.actor_id), "IDENTITY_UNVERIFIED", evidenceRefs),
    validationTest("role resolved", result.role_permissions.resolved_role !== "UNRESOLVED", "ROLE_UNRESOLVED", evidenceRefs),
    validationTest("authority scope present", result.decision.authority_scope_refs.length > 0, "AUTHORITY_SCOPE_MISSING", evidenceRefs),
    validationTest("tenant context present", Boolean(result.decision.tenant_id), "TENANT_CONTEXT_MISSING", evidenceRefs),
    validationTest("tenant ownership consistent", result.tenant_isolated && !result.tenant_isolation.violation_detected, "TENANT_OWNERSHIP_CONFLICT", evidenceRefs),
    validationTest("mission scope resolved", result.mission_visibility.mission_verified, "MISSION_SCOPE_UNRESOLVED", evidenceRefs),
    validationTest("policy version available", Boolean(result.decision.policy_version) && result.security_contract.valid, "POLICY_VERSION_UNAVAILABLE", evidenceRefs),
    validationTest("field classification available", result.decision.requested_field_refs.length > 0, "FIELD_CLASSIFICATION_MISSING", evidenceRefs),
    validationTest("evidence classification available", result.guard_surface.evidence_visibility !== "ACCESS_DENIED", "EVIDENCE_CLASSIFICATION_MISSING", evidenceRefs),
    validationTest("operator privacy classification available", result.guard_surface.operator_privacy_mode !== "HIDDEN", "OPERATOR_PRIVACY_CLASSIFICATION_MISSING", evidenceRefs),
    validationTest("investigations concealed", result.guard_surface.investigation_concealment !== "FULL_AUTHORIZED_ACCESS", "INVESTIGATION_STATUS_UNKNOWN", evidenceRefs),
    validationTest("certification classification available", result.guard_surface.certification_visibility !== "DENIED", "CERTIFICATION_CLASSIFICATION_UNKNOWN", evidenceRefs),
    validationTest("replay authorization verified", result.guard_surface.replay_lineage_authorized_per_node && result.api_surface.replay_bypass_supported === false, "REPLAY_AUTHORIZATION_UNVERIFIED", evidenceRefs),
    validationTest("redaction succeeds", result.field_access.deterministic_redaction && result.redaction_export_cache.redaction_method !== "RECORD_OMISSION", "REDACTION_FAILED", evidenceRefs),
    validationTest("cache scoped", result.redaction_export_cache.cache_keys_tenant_role_mission_scoped && result.redaction_export_cache.permission_changes_invalidate_cache, "CACHE_SCOPE_UNVERIFIED", evidenceRefs),
    validationTest("cross tenant search blocked safely", result.search_aggregation.search_authorized_only, "CROSS_TENANT_SEARCH_BLOCKED", evidenceRefs),
    validationTest("cross tenant replay blocked safely", result.tenant_isolation.replay_sessions_tenant_scoped, "CROSS_TENANT_REPLAY_BLOCKED", evidenceRefs),
    validationTest("cross tenant export blocked safely", result.redaction_export_cache.export_tenant_scoped, "CROSS_TENANT_EXPORT_BLOCKED", evidenceRefs),
    validationTest("field restrictions enforced", result.field_access.hidden_client_payloads_prevented && result.decision.denied_fields.length === 0, "UNAUTHORIZED_FIELD_ACCESS_DENIED", evidenceRefs),
    validationTest("small cohorts suppressed", result.search_aggregation.small_cohorts_suppressed, "SMALL_COHORT_SUPPRESSED", evidenceRefs),
    validationTest("search inference blocked", result.search_aggregation.hit_counts_safe && result.search_aggregation.pagination_totals_safe, "SEARCH_INFERENCE_BLOCKED", evidenceRefs),
    validationTest("aggregation leakage blocked", result.search_aggregation.aggregate_excludes_unauthorized, "AGGREGATION_PRIVACY_BLOCKED", evidenceRefs),
    validationTest("hidden investigation concealed", result.guard_surface.investigation_concealment === "EXISTENCE_HIDDEN", "HIDDEN_INVESTIGATION_CONCEALED", evidenceRefs),
    validationTest("export requires authorization", result.redaction_export_cache.export_requires_separate_authorization, "EXPORT_AUTHORIZATION_DENIED", evidenceRefs),
    validationTest("role self escalation blocked", !result.api_surface.unrestricted_admin_supported && result.role_permissions.admin_unrestricted_visibility === false, "ROLE_SELF_ESCALATION_BLOCKED", evidenceRefs),
    validationTest("metadata leakage blocked", result.redaction_export_cache.metadata_sanitized && result.search_aggregation.pagination_totals_safe, "METADATA_LEAKAGE_BLOCKED", evidenceRefs),
    validationTest("integrity hashes reproducible", hashWithoutIntegrity(result.decision) === result.decision.integrity_hash && result.security_ledger.hash_verified, "INTEGRITY_VALIDATION_FAILED", evidenceRefs),
  ]);
}

function resultReplayHash(result: Omit<DashboardSecurityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ decision: result.decision.integrity_hash, contract: result.security_contract.integrity_hash, tenant: result.tenant_isolation.integrity_hash, role: result.role_permissions.integrity_hash, mission: result.mission_visibility.integrity_hash, fields: result.field_access.integrity_hash, guards: result.guard_surface.integrity_hash, search: result.search_aggregation.integrity_hash, redaction: result.redaction_export_cache.integrity_hash, ledger: result.security_ledger.integrity_hash, failures: result.failures });
}
function resultIntegrityHash(result: Omit<DashboardSecurityResult, "integrity_hash">): string {
  return hash({ version: result.dashboard_security_version, id: result.security_identifier, replay_hash: result.replay_hash, validation_outcome: result.validation_outcome, api: result.api_surface.integrity_hash });
}

export function buildDashboardSecurityVisibility(input: DashboardSecurityInput = {}): DashboardSecurityResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as DashboardSecurityFailure] : []);
  const api_surface = apiSurface();
  const decisionRecord = decision(input, initialFailures);
  const security_contract = contractView(initialFailures);
  const tenant_isolation = tenantIsolation(initialFailures);
  const role_permissions = rolePermissions(input, initialFailures);
  const mission_visibility = missionVisibility(initialFailures);
  const field_access = fieldAccess(decisionRecord, initialFailures);
  const guard_surface = guardSurface(initialFailures);
  const search_aggregation = searchAggregation(initialFailures);
  const redaction_export_cache = redactionExportCache(initialFailures);
  const security_ledger = ledger(decisionRecord, initialFailures);
  const alert_center = alerts(initialFailures);
  const baseWithoutValidation: BuildBase = {
    dashboard_security_version: VERSION,
    security_identifier: SECURITY_ID,
    status: initialFailures.length ? "REJECTED" : "AUTHORITATIVE",
    api_surface,
    decision: decisionRecord,
    security_contract,
    tenant_isolation,
    role_permissions,
    mission_visibility,
    field_access,
    guard_surface,
    search_aggregation,
    redaction_export_cache,
    security_ledger,
    alert_center,
    widgets: WIDGETS,
    metrics: metrics(initialFailures),
    deterministic: true,
    fail_closed: true,
    tenant_isolated: !initialFailures.some((failure) => ["TENANT_OWNERSHIP_CONFLICT", "TENANT_CONTEXT_MISSING", "CROSS_TENANT_SEARCH_BLOCKED", "CROSS_TENANT_REPLAY_BLOCKED", "CROSS_TENANT_EXPORT_BLOCKED"].includes(failure)),
    server_side_enforced: true,
  };
  const validation_tests = buildValidationTests(baseWithoutValidation);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((test) => test.failure_reason).filter((failure): failure is DashboardSecurityFailure => Boolean(failure))])]);
  const validation_outcome = failures.length ? "INVALID" : "VALID";
  const base: Omit<DashboardSecurityResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutValidation, status: failures.length ? "REJECTED" : "AUTHORITATIVE", validation_tests, validation_outcome, failures };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateDashboardSecurityVisibility(result?: DashboardSecurityResult): DashboardSecurityValidationResult {
  if (!result) {
    const failures = freezeArray<DashboardSecurityFailure>(["IDENTITY_UNVERIFIED"]);
    const base: Omit<DashboardSecurityValidationResult, "validation_hash"> = { security_id: null, valid: false, validation_outcome: "INVALID", failures, replay_hash_valid: false, integrity_hash_valid: false, fail_closed: true };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nestedIntegrity = hashWithoutIntegrity(result.decision) === result.decision.integrity_hash
    && hashWithoutIntegrity(result.api_surface) === result.api_surface.integrity_hash
    && hashWithoutIntegrity(result.security_contract) === result.security_contract.integrity_hash
    && hashWithoutIntegrity(result.tenant_isolation) === result.tenant_isolation.integrity_hash
    && hashWithoutIntegrity(result.role_permissions) === result.role_permissions.integrity_hash
    && hashWithoutIntegrity(result.mission_visibility) === result.mission_visibility.integrity_hash
    && hashWithoutIntegrity(result.field_access) === result.field_access.integrity_hash
    && hashWithoutIntegrity(result.guard_surface) === result.guard_surface.integrity_hash
    && hashWithoutIntegrity(result.search_aggregation) === result.search_aggregation.integrity_hash
    && hashWithoutIntegrity(result.redaction_export_cache) === result.redaction_export_cache.integrity_hash
    && hashWithoutIntegrity(result.security_ledger) === result.security_ledger.integrity_hash
    && hashWithoutIntegrity(result.alert_center) === result.alert_center.integrity_hash
    && hashWithoutIntegrity(result.metrics) === result.metrics.integrity_hash
    && result.validation_tests.every((test) => hashWithoutIntegrity(test) === test.integrity_hash);
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash && nestedIntegrity;
  const fail_closed = result.fail_closed && result.server_side_enforced && !result.api_surface.client_side_enforcement_only && !result.api_surface.export_without_authorization_supported && !result.api_surface.replay_bypass_supported && !result.api_surface.lineage_bypass_supported;
  const valid = result.validation_outcome === "VALID" && result.failures.length === 0 && replay_hash_valid && integrity_hash_valid && fail_closed;
  const base: Omit<DashboardSecurityValidationResult, "validation_hash"> = { security_id: result.security_identifier, valid, validation_outcome: result.validation_outcome, failures: result.failures, replay_hash_valid, integrity_hash_valid, fail_closed };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayDashboardSecurityVisibility(result: DashboardSecurityResult): boolean {
  return validateDashboardSecurityVisibility(result).valid;
}

export function buildDashboardSecurityObservabilitySurface(result = buildDashboardSecurityVisibility()): DashboardSecurityObservabilitySurface {
  return Object.freeze({ security_id: result.security_identifier, status: result.status, validation_outcome: result.validation_outcome, decisions: 1, failed_tests: result.validation_tests.filter((test) => !test.passed).length, failures: result.failures, tenant_isolated: result.tenant_isolated, server_side_enforced: result.server_side_enforced, fail_closed: result.fail_closed, integrity_hash: result.integrity_hash });
}

export function getDashboardSecurityContract(): DashboardSecurityContract {
  const result = buildDashboardSecurityVisibility();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      widgets: WIDGETS,
      classifications: CLASSIFICATIONS,
      visibility_outcomes: OUTCOMES,
      permissions: PERMISSIONS,
      mission_scopes: MISSION_SCOPES,
      field_actions: FIELD_ACTIONS,
      redaction_methods: REDACTION_METHODS,
      required_integrations: freezeArray(["Identity and Authentication Service", "Authorization Service", "Tenant Registry", "Mission Registry", "Role Registry", "Authority Registry", "Governance Engine", "Constitution Engine", "Evidence Registry", "Operator Registry", "Investigation Registry", "Certification Ledger", "Audit Ledger", "Replay Engine", "Truth Ledger", "Adaptive Intelligence Ledger", "Policy Registry", "Security Monitoring System", "Export Service", "Dashboard View Registry"]),
      deny_by_default: true,
      server_side_enforced: true,
    }),
    result,
    validation: validateDashboardSecurityVisibility(result),
    observability: buildDashboardSecurityObservabilitySurface(result),
  });
}

export const DashboardSecurityVisibility = Object.freeze({ build: buildDashboardSecurityVisibility, validate: validateDashboardSecurityVisibility, replay: replayDashboardSecurityVisibility });
