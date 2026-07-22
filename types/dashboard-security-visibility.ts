import type { DashboardRole } from "@/types/adaptive-dashboard-foundation";

export type DashboardSecurityStatus = "AUTHORITATIVE" | "REJECTED";
export type DashboardSecurityValidationOutcome = "VALID" | "INVALID";
export type VisibilityClassification = "PUBLIC_WITHIN_TENANT" | "TENANT_RESTRICTED" | "MISSION_RESTRICTED" | "ROLE_RESTRICTED" | "GOVERNANCE_RESTRICTED" | "CONSTITUTIONALLY_RESTRICTED" | "OPERATOR_CONFIDENTIAL" | "AUDIT_RESTRICTED" | "CERTIFICATION_RESTRICTED" | "INVESTIGATION_RESTRICTED" | "EVIDENCE_RESTRICTED" | "SECURITY_SENSITIVE" | "SYSTEM_INTERNAL";
export type VisibilityOutcome = "ALLOW" | "ALLOW_WITH_REDACTION" | "ALLOW_METADATA_ONLY" | "ALLOW_AGGREGATE_ONLY" | "DENY" | "ESCALATION_REQUIRED" | "POLICY_CONFLICT" | "AUTHORIZATION_UNVERIFIABLE";
export type DashboardPermission = "VIEW_DASHBOARD" | "VIEW_SUMMARY" | "VIEW_RECORD" | "VIEW_RESTRICTED_FIELD" | "VIEW_EVIDENCE" | "VIEW_OPERATOR_IDENTITY" | "VIEW_GOVERNANCE_RECORD" | "VIEW_AUDIT_RECORD" | "VIEW_CERTIFICATION_RECORD" | "VIEW_INVESTIGATION_RECORD" | "OPEN_REPLAY" | "TRAVERSE_LINEAGE" | "EXPORT_DATA" | "RECORD_DECISION";
export type MissionScopeType = "SINGLE_MISSION" | "MISSION_GROUP" | "PROGRAM_SCOPE" | "TENANT_PORTFOLIO" | "CROSS_MISSION_AUTHORIZED" | "SYSTEM_WIDE_AUTHORIZED";
export type FieldAction = "VISIBLE" | "MASKED" | "REDACTED" | "OMITTED" | "METADATA_ONLY" | "AGGREGATED_ONLY";
export type GovernanceVisibilityState = "FULL" | "REDACTED" | "SUMMARY_ONLY" | "STATUS_ONLY" | "DENIED";
export type EvidenceVisibilityOutcome = "FULL_ACCESS" | "REDACTED_ACCESS" | "SUMMARY_ACCESS" | "REFERENCE_ONLY" | "ACCESS_DENIED";
export type OperatorPrivacyMode = "IDENTIFIED" | "PSEUDONYMIZED" | "ROLE_LEVEL" | "TEAM_LEVEL" | "AGGREGATED" | "HIDDEN";
export type InvestigationConcealmentMode = "FULLY_HIDDEN" | "EXISTENCE_HIDDEN" | "STATUS_ONLY" | "RESTRICTED_SUMMARY" | "FULL_AUTHORIZED_ACCESS";
export type CertificationVisibilityLevel = "STATUS_ONLY" | "SUMMARY" | "FINDINGS_REDACTED" | "FULL_CERTIFICATION_RECORD" | "CERTIFICATION_EVIDENCE_ACCESS" | "DENIED";
export type RedactionMethod = "FULL_REDACTION" | "PARTIAL_MASKING" | "TOKEN_REPLACEMENT" | "PSEUDONYMIZATION" | "SUMMARY_SUBSTITUTION" | "METADATA_ONLY" | "RECORD_OMISSION" | "PROTECTED_PLACEHOLDER";
export type DashboardSecurityAlertSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type DashboardSecurityWidget = "Security Contract" | "Visibility Policy" | "Tenant Isolation" | "Role Permissions" | "Mission Visibility" | "Field Access" | "Constitutional Guard" | "Governance Guard" | "Evidence Guard" | "Operator Privacy" | "Investigation Concealment" | "Audit Visibility" | "Certification Visibility" | "Replay Lineage Guard" | "Secure Search" | "Secure Aggregation" | "Redaction Masking" | "Export Security" | "Cache Session Isolation" | "Security Ledger" | "Security Alerts";

export type DashboardSecurityScenario =
  | "BASELINE" | "IDENTITY_UNVERIFIED" | "ROLE_UNRESOLVED" | "AUTHORITY_MISSING" | "TENANT_MISSING" | "TENANT_CONFLICT" | "MISSION_UNRESOLVED" | "POLICY_UNAVAILABLE" | "FIELD_CLASSIFICATION_MISSING" | "EVIDENCE_CLASSIFICATION_MISSING" | "OPERATOR_PRIVACY_MISSING" | "INVESTIGATION_UNKNOWN" | "CERTIFICATION_CLASSIFICATION_UNKNOWN" | "REPLAY_AUTH_UNVERIFIED" | "REDACTION_FAILURE" | "CACHE_SCOPE_UNVERIFIED" | "INTEGRITY_FAILURE" | "CROSS_TENANT_SEARCH" | "CROSS_TENANT_REPLAY" | "CROSS_TENANT_EXPORT" | "UNAUTHORIZED_FIELD" | "SMALL_COHORT" | "SEARCH_INFERENCE" | "AGGREGATION_LEAK" | "HIDDEN_INVESTIGATION_EXPOSURE" | "EXPORT_UNAUTHORIZED" | "ROLE_SELF_ESCALATION" | "METADATA_LEAK";

export type DashboardSecurityFailure =
  | "IDENTITY_UNVERIFIED" | "ROLE_UNRESOLVED" | "AUTHORITY_SCOPE_MISSING" | "TENANT_CONTEXT_MISSING" | "TENANT_OWNERSHIP_CONFLICT" | "MISSION_SCOPE_UNRESOLVED" | "POLICY_VERSION_UNAVAILABLE" | "FIELD_CLASSIFICATION_MISSING" | "EVIDENCE_CLASSIFICATION_MISSING" | "OPERATOR_PRIVACY_CLASSIFICATION_MISSING" | "INVESTIGATION_STATUS_UNKNOWN" | "CERTIFICATION_CLASSIFICATION_UNKNOWN" | "REPLAY_AUTHORIZATION_UNVERIFIED" | "REDACTION_FAILED" | "CACHE_SCOPE_UNVERIFIED" | "INTEGRITY_VALIDATION_FAILED" | "CROSS_TENANT_SEARCH_BLOCKED" | "CROSS_TENANT_REPLAY_BLOCKED" | "CROSS_TENANT_EXPORT_BLOCKED" | "UNAUTHORIZED_FIELD_ACCESS_DENIED" | "SMALL_COHORT_SUPPRESSED" | "SEARCH_INFERENCE_BLOCKED" | "AGGREGATION_PRIVACY_BLOCKED" | "HIDDEN_INVESTIGATION_CONCEALED" | "EXPORT_AUTHORIZATION_DENIED" | "ROLE_SELF_ESCALATION_BLOCKED" | "METADATA_LEAKAGE_BLOCKED";

export type DashboardVisibilityDecision = Readonly<{
  visibility_decision_id: string;
  actor_id: string;
  actor_role_refs: readonly DashboardRole[];
  authority_scope_refs: readonly string[];
  tenant_id: string;
  mission_scope: string;
  dashboard_view: string;
  requested_record_refs: readonly string[];
  requested_field_refs: readonly string[];
  requested_action: DashboardPermission;
  purpose_code: string;
  applicable_policy_refs: readonly string[];
  constitutional_rule_refs: readonly string[];
  governance_rule_refs: readonly string[];
  evidence_classification: VisibilityClassification;
  operator_privacy_classification: VisibilityClassification;
  investigation_classification: VisibilityClassification;
  certification_classification: VisibilityClassification;
  authorization_result: VisibilityOutcome;
  visible_fields: readonly string[];
  redacted_fields: readonly string[];
  denied_fields: readonly string[];
  denial_reasons: readonly DashboardSecurityFailure[];
  redaction_method: RedactionMethod;
  replay_access_status: VisibilityOutcome;
  export_access_status: VisibilityOutcome;
  decision_timestamp: string;
  policy_version: string;
  integrity_hash: string;
}>;

export type DashboardSecurityContractView = Readonly<{ contract_id: string; dashboard_views: readonly string[]; allowed_roles: readonly DashboardRole[]; prohibited_roles: readonly string[]; classifications: readonly VisibilityClassification[]; replay_requirements: readonly string[]; export_restrictions: readonly string[]; valid: boolean; render_allowed_without_contract: false; integrity_hash: string }>;
export type TenantIsolationView = Readonly<{ view_id: string; tenant_validated_before_retrieval: boolean; tenant_partitioned_surfaces: readonly string[]; cross_tenant_counts_hidden: boolean; cache_keys_tenant_scoped: boolean; replay_sessions_tenant_scoped: boolean; violation_detected: boolean; integrity_hash: string }>;
export type RolePermissionView = Readonly<{ view_id: string; resolved_role: DashboardRole | "UNRESOLVED"; permissions: readonly DashboardPermission[]; denied_permissions: readonly DashboardPermission[]; admin_unrestricted_visibility: false; audit_read_only: boolean; permission_version: string; integrity_hash: string }>;
export type MissionVisibilityView = Readonly<{ view_id: string; mission_scope_type: MissionScopeType; mission_verified: boolean; cross_mission_authorized: boolean; restricted_mission_names_redacted: boolean; historical_restrictions_preserved: boolean; integrity_hash: string }>;
export type FieldAccessView = Readonly<{ view_id: string; field_actions: readonly string[]; hidden_client_payloads_prevented: boolean; deterministic_redaction: boolean; unauthorized_fields_excluded_from_aggregates: boolean; integrity_hash: string }>;
export type GuardSurface = Readonly<{ guard_id: string; constitutional_visibility: GovernanceVisibilityState; governance_visibility: GovernanceVisibilityState; evidence_visibility: EvidenceVisibilityOutcome; operator_privacy_mode: OperatorPrivacyMode; investigation_concealment: InvestigationConcealmentMode; audit_visibility: GovernanceVisibilityState; certification_visibility: CertificationVisibilityLevel; replay_lineage_authorized_per_node: boolean; integrity_hash: string }>;
export type SearchAggregationSurface = Readonly<{ surface_id: string; search_authorized_only: boolean; autocomplete_suppressed: boolean; hit_counts_safe: boolean; facets_authorized: boolean; pagination_totals_safe: boolean; aggregate_excludes_unauthorized: boolean; small_cohorts_suppressed: boolean; deterministic_rounding: boolean; integrity_hash: string }>;
export type RedactionExportCacheSurface = Readonly<{ surface_id: string; redaction_method: RedactionMethod; client_side_masking_reversible: false; metadata_sanitized: boolean; export_requires_separate_authorization: boolean; export_tenant_scoped: boolean; cache_keys_tenant_role_mission_scoped: boolean; permission_changes_invalidate_cache: boolean; integrity_hash: string }>;
export type SecurityDecisionLedger = Readonly<{ ledger_id: string; decisions: readonly string[]; append_only: true; immutable: true; tenant_isolated: boolean; replayable: boolean; hash_verified: boolean; authorized_audit_visible: boolean; integrity_hash: string }>;
export type DashboardSecurityAlertCenter = Readonly<{ alert_id: string; alerts: readonly DashboardSecurityFailure[]; highest_severity: DashboardSecurityAlertSeverity; critical_alerts_visible: boolean; user_safe_message: string; integrity_hash: string }>;
export type DashboardSecurityMetrics = Readonly<{ denied_requests: number; redacted_responses: number; tenant_mismatches: number; mission_scope_mismatches: number; replay_access_denials: number; export_attempt_denials: number; hidden_investigation_attempts: number; certification_access_denials: number; operator_identity_access_denials: number; search_suppressions: number; aggregation_suppressions: number; integrity_verification_failures: number; integrity_hash: string }>;
export type DashboardSecurityValidationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: DashboardSecurityFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;

export type DashboardSecurityApiSurface = Readonly<{ api_id: string; retrieve_dashboard: string; retrieve_contract: string; retrieve_sections: readonly string[]; validate_security: string; inspect_security: string; mutation_supported: false; client_side_enforcement_only: false; export_without_authorization_supported: false; replay_bypass_supported: false; lineage_bypass_supported: false; unrestricted_admin_supported: false; integrity_hash: string }>;
export type DashboardSecurityInput = Readonly<{ scenario?: DashboardSecurityScenario; actor_id?: string; role?: DashboardRole; tenant_id?: string; mission_scope?: string; requested_action?: DashboardPermission; requested_fields?: readonly string[]; purpose_code?: string }>;
export type DashboardSecurityResult = Readonly<{ dashboard_security_version: "dashboard-security-visibility/v10.14.10"; security_identifier: "DashboardSecurityVisibility"; status: DashboardSecurityStatus; api_surface: DashboardSecurityApiSurface; decision: DashboardVisibilityDecision; security_contract: DashboardSecurityContractView; tenant_isolation: TenantIsolationView; role_permissions: RolePermissionView; mission_visibility: MissionVisibilityView; field_access: FieldAccessView; guard_surface: GuardSurface; search_aggregation: SearchAggregationSurface; redaction_export_cache: RedactionExportCacheSurface; security_ledger: SecurityDecisionLedger; alert_center: DashboardSecurityAlertCenter; widgets: readonly DashboardSecurityWidget[]; metrics: DashboardSecurityMetrics; validation_tests: readonly DashboardSecurityValidationTest[]; validation_outcome: DashboardSecurityValidationOutcome; failures: readonly DashboardSecurityFailure[]; deterministic: boolean; fail_closed: boolean; tenant_isolated: boolean; server_side_enforced: boolean; replay_hash: string; integrity_hash: string }>;
export type DashboardSecurityValidationResult = Readonly<{ security_id: string | null; valid: boolean; validation_outcome: DashboardSecurityValidationOutcome; failures: readonly DashboardSecurityFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; fail_closed: boolean; validation_hash: string }>;
export type DashboardSecurityObservabilitySurface = Readonly<{ security_id: string; status: DashboardSecurityStatus; validation_outcome: DashboardSecurityValidationOutcome; decisions: number; failed_tests: number; failures: readonly DashboardSecurityFailure[]; tenant_isolated: boolean; server_side_enforced: boolean; fail_closed: boolean; integrity_hash: string }>;
export type DashboardSecurityContract = Readonly<{ doctrine: Readonly<{ version: "dashboard-security-visibility/v10.14.10"; widgets: readonly DashboardSecurityWidget[]; classifications: readonly VisibilityClassification[]; visibility_outcomes: readonly VisibilityOutcome[]; permissions: readonly DashboardPermission[]; mission_scopes: readonly MissionScopeType[]; field_actions: readonly FieldAction[]; redaction_methods: readonly RedactionMethod[]; required_integrations: readonly string[]; deny_by_default: true; server_side_enforced: true }>; result: DashboardSecurityResult; validation: DashboardSecurityValidationResult; observability: DashboardSecurityObservabilitySurface }>;
