import { describe, expect, it } from "vitest";

import {
  buildDashboardSecurityVisibility,
  getDashboardSecurityContract,
  replayDashboardSecurityVisibility,
  validateDashboardSecurityVisibility,
} from "../../../services/dashboard-security-visibility";
import type {
  DashboardSecurityFailure,
  DashboardSecurityScenario,
} from "../../../types/dashboard-security-visibility";

const failureScenarios: ReadonlyArray<readonly [DashboardSecurityScenario, DashboardSecurityFailure]> = [
  ["IDENTITY_UNVERIFIED", "IDENTITY_UNVERIFIED"],
  ["ROLE_UNRESOLVED", "ROLE_UNRESOLVED"],
  ["AUTHORITY_MISSING", "AUTHORITY_SCOPE_MISSING"],
  ["TENANT_MISSING", "TENANT_CONTEXT_MISSING"],
  ["TENANT_CONFLICT", "TENANT_OWNERSHIP_CONFLICT"],
  ["MISSION_UNRESOLVED", "MISSION_SCOPE_UNRESOLVED"],
  ["POLICY_UNAVAILABLE", "POLICY_VERSION_UNAVAILABLE"],
  ["FIELD_CLASSIFICATION_MISSING", "FIELD_CLASSIFICATION_MISSING"],
  ["EVIDENCE_CLASSIFICATION_MISSING", "EVIDENCE_CLASSIFICATION_MISSING"],
  ["OPERATOR_PRIVACY_MISSING", "OPERATOR_PRIVACY_CLASSIFICATION_MISSING"],
  ["INVESTIGATION_UNKNOWN", "INVESTIGATION_STATUS_UNKNOWN"],
  ["CERTIFICATION_CLASSIFICATION_UNKNOWN", "CERTIFICATION_CLASSIFICATION_UNKNOWN"],
  ["REPLAY_AUTH_UNVERIFIED", "REPLAY_AUTHORIZATION_UNVERIFIED"],
  ["REDACTION_FAILURE", "REDACTION_FAILED"],
  ["CACHE_SCOPE_UNVERIFIED", "CACHE_SCOPE_UNVERIFIED"],
  ["INTEGRITY_FAILURE", "INTEGRITY_VALIDATION_FAILED"],
  ["CROSS_TENANT_SEARCH", "CROSS_TENANT_SEARCH_BLOCKED"],
  ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_BLOCKED"],
  ["CROSS_TENANT_EXPORT", "CROSS_TENANT_EXPORT_BLOCKED"],
  ["UNAUTHORIZED_FIELD", "UNAUTHORIZED_FIELD_ACCESS_DENIED"],
  ["SMALL_COHORT", "SMALL_COHORT_SUPPRESSED"],
  ["SEARCH_INFERENCE", "SEARCH_INFERENCE_BLOCKED"],
  ["AGGREGATION_LEAK", "AGGREGATION_PRIVACY_BLOCKED"],
  ["HIDDEN_INVESTIGATION_EXPOSURE", "HIDDEN_INVESTIGATION_CONCEALED"],
  ["EXPORT_UNAUTHORIZED", "EXPORT_AUTHORIZATION_DENIED"],
  ["ROLE_SELF_ESCALATION", "ROLE_SELF_ESCALATION_BLOCKED"],
  ["METADATA_LEAK", "METADATA_LEAKAGE_BLOCKED"],
];

describe("dashboard security visibility", () => {
  it("publishes the common security contract", () => {
    const contract = getDashboardSecurityContract();

    expect(contract.doctrine.version).toBe("dashboard-security-visibility/v10.14.10");
    expect(contract.doctrine.deny_by_default).toBe(true);
    expect(contract.doctrine.server_side_enforced).toBe(true);
    expect(contract.doctrine.classifications).toEqual(expect.arrayContaining(["TENANT_RESTRICTED", "OPERATOR_CONFIDENTIAL", "INVESTIGATION_RESTRICTED", "SECURITY_SENSITIVE"]));
    expect(contract.doctrine.visibility_outcomes).toEqual(expect.arrayContaining(["ALLOW_WITH_REDACTION", "DENY", "AUTHORIZATION_UNVERIFIABLE"]));
    expect(contract.doctrine.permissions).toEqual(expect.arrayContaining(["VIEW_DASHBOARD", "VIEW_RESTRICTED_FIELD", "OPEN_REPLAY", "EXPORT_DATA"]));
    expect(contract.doctrine.field_actions).toEqual(expect.arrayContaining(["VISIBLE", "REDACTED", "OMITTED", "AGGREGATED_ONLY"]));
    expect(contract.doctrine.redaction_methods).toContain("PROTECTED_PLACEHOLDER");
    expect(contract.doctrine.required_integrations).toEqual(expect.arrayContaining(["Identity and Authentication Service", "Tenant Registry", "Evidence Registry", "Export Service"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministically and replays without drift", () => {
    const first = buildDashboardSecurityVisibility();
    const second = buildDashboardSecurityVisibility();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateDashboardSecurityVisibility(first).valid).toBe(true);
    expect(replayDashboardSecurityVisibility(first)).toBe(true);
  });

  it("applies server-side least-privilege visibility and redaction", () => {
    const result = buildDashboardSecurityVisibility();

    expect(result.decision.authorization_result).toBe("ALLOW_WITH_REDACTION");
    expect(result.decision.visible_fields).toEqual(["summary"]);
    expect(result.decision.redacted_fields).toEqual(expect.arrayContaining(["operator_identity", "evidence_payload", "certification_findings"]));
    expect(result.decision.denied_fields).toHaveLength(0);
    expect(result.field_access.hidden_client_payloads_prevented).toBe(true);
    expect(result.field_access.deterministic_redaction).toBe(true);
    expect(result.redaction_export_cache.client_side_masking_reversible).toBe(false);
    expect(result.api_surface.client_side_enforcement_only).toBe(false);
  });

  it("enforces tenant, mission, role, guard, search, export, cache, and ledger controls", () => {
    const result = buildDashboardSecurityVisibility();

    expect(result.tenant_isolation.tenant_validated_before_retrieval).toBe(true);
    expect(result.tenant_isolation.tenant_partitioned_surfaces).toContain("replay");
    expect(result.role_permissions.admin_unrestricted_visibility).toBe(false);
    expect(result.role_permissions.audit_read_only).toBe(true);
    expect(result.mission_visibility.restricted_mission_names_redacted).toBe(true);
    expect(result.guard_surface.evidence_visibility).toBe("REFERENCE_ONLY");
    expect(result.guard_surface.operator_privacy_mode).toBe("PSEUDONYMIZED");
    expect(result.guard_surface.investigation_concealment).toBe("EXISTENCE_HIDDEN");
    expect(result.guard_surface.replay_lineage_authorized_per_node).toBe(true);
    expect(result.search_aggregation.aggregate_excludes_unauthorized).toBe(true);
    expect(result.search_aggregation.small_cohorts_suppressed).toBe(true);
    expect(result.redaction_export_cache.export_requires_separate_authorization).toBe(true);
    expect(result.redaction_export_cache.cache_keys_tenant_role_mission_scoped).toBe(true);
    expect(result.security_ledger.append_only).toBe(true);
    expect(result.security_ledger.hash_verified).toBe(true);
  });

  it("denies unverifiable authorization without unsafe detail leakage", () => {
    const result = buildDashboardSecurityVisibility({ scenario: "IDENTITY_UNVERIFIED" });

    expect(result.decision.authorization_result).toBe("AUTHORIZATION_UNVERIFIABLE");
    expect(result.decision.visible_fields).toHaveLength(0);
    expect(result.alert_center.user_safe_message).toBe("Access denied or restricted by dashboard security policy.");
    expect(result.fail_closed).toBe(true);
    expect(validateDashboardSecurityVisibility(result).valid).toBe(false);
  });

  it("surfaces observability and validation evidence", () => {
    const result = buildDashboardSecurityVisibility();

    expect(result.validation_tests).toHaveLength(27);
    expect(result.metrics.denied_requests).toBe(0);
    expect(result.metrics.redacted_responses).toBe(1);
    expect(result.metrics.tenant_mismatches).toBe(0);
    expect(result.metrics.integrity_verification_failures).toBe(0);
  });

  it.each(failureScenarios)("fails closed for %s", (scenario, failure) => {
    const result = buildDashboardSecurityVisibility({ scenario });
    const validation = validateDashboardSecurityVisibility(result);

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayDashboardSecurityVisibility(result)).toBe(false);
  });

  it("detects tampering through integrity and replay checks", () => {
    const result = buildDashboardSecurityVisibility();
    const tampered = {
      ...result,
      decision: {
        ...result.decision,
        tenant_id: "tenant-other",
      },
    };

    expect(validateDashboardSecurityVisibility(tampered).integrity_hash_valid).toBe(false);
    expect(replayDashboardSecurityVisibility(tampered)).toBe(false);
  });
});
