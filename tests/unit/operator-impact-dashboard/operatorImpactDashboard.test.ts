import { describe, expect, it } from "vitest";

import {
  buildOperatorImpactDashboard,
  getOperatorImpactDashboardContract,
  replayOperatorImpactDashboard,
  validateOperatorImpactDashboard,
} from "../../../services/operator-impact-dashboard";
import type {
  OperatorImpactDashboardFailure,
  OperatorImpactDashboardScenario,
} from "../../../types/operator-impact-dashboard";

const failureScenarios: ReadonlyArray<readonly [OperatorImpactDashboardScenario, OperatorImpactDashboardFailure]> = [
  ["FOUNDATION_UNAVAILABLE", "DASHBOARD_FOUNDATION_UNAVAILABLE"],
  ["MISSING_TENANT", "TENANT_CONTEXT_UNAVAILABLE"],
  ["MISSION_SCOPE_UNVERIFIED", "MISSION_SCOPE_UNVERIFIED"],
  ["UNAUTHORIZED_IDENTITY_ACCESS", "OPERATOR_VISIBILITY_UNAUTHORIZED"],
  ["MISSING_PRIVACY_CLASSIFICATION", "PRIVACY_CLASSIFICATION_MISSING"],
  ["SPARSE_COHORT", "MINIMUM_COHORT_SIZE_VIOLATED"],
  ["AUTHORITY_CONTEXT_MISSING", "AUTHORITY_CONTEXT_UNAVAILABLE"],
  ["RECOMMENDATION_VERSION_UNRESOLVED", "RECOMMENDATION_VERSION_UNRESOLVED"],
  ["MISSING_EVIDENCE", "EVIDENCE_REFERENCE_INCOMPLETE"],
  ["REPLAY_INTEGRITY_FAILURE", "REPLAY_INTEGRITY_FAILED"],
  ["TENANT_LEAK", "TENANT_ISOLATION_VIOLATED"],
  ["INCOMPARABLE_POPULATIONS", "COMPARISON_POPULATIONS_NOT_COMPARABLE"],
  ["NONDETERMINISTIC_CALCULATION", "CALCULATION_NONDETERMINISTIC"],
  ["RESTRICTED_FIELD_LEAK", "RESTRICTED_FIELD_EXPOSED"],
  ["HIDDEN_OPERATOR_PROFILING", "HIDDEN_OPERATOR_PROFILING_DETECTED"],
  ["OPERATOR_RANKING", "UNSUPPORTED_OPERATOR_RANKING"],
  ["COMPOSITE_SCORE", "COMPOSITE_OPERATOR_SCORE_DETECTED"],
  ["AUTHORITY_REDUCTION_EXPOSED", "AUTHORITY_REDUCTION_EXPOSED"],
  ["WORKLOAD_REASSIGNMENT_EXPOSED", "WORKLOAD_REASSIGNMENT_EXPOSED"],
  ["DISCIPLINARY_ACTION_EXPOSED", "DISCIPLINARY_ACTION_EXPOSED"],
  ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
];

describe("operator impact dashboard", () => {
  it("publishes the operator impact dashboard contract", () => {
    const contract = getOperatorImpactDashboardContract();

    expect(contract.doctrine.version).toBe("operator-impact-dashboard/v10.14.4.8");
    expect(contract.doctrine.read_only).toBe(true);
    expect(contract.doctrine.advisory_only).toBe(true);
    expect(contract.doctrine.operator_scopes).toEqual(
      expect.arrayContaining(["INDIVIDUAL_OPERATOR", "PSEUDONYMIZED_COHORT", "SYSTEM_WIDE_AGGREGATE"]),
    );
    expect(contract.doctrine.pattern_categories).toEqual(
      expect.arrayContaining(["RECURRING_OVERRIDE", "POSSIBLE_TRAINING_GAP", "POSSIBLE_RECOMMENDATION_QUALITY_GAP"]),
    );
    expect(contract.doctrine.override_categories).toContain("RECOMMENDATION_NOT_USABLE");
    expect(contract.doctrine.approval_behavior_categories).toContain("EVIDENCE_SENSITIVE_APPROVAL");
    expect(contract.doctrine.latency_categories).toContain("HIGH_EVIDENCE_DELAY");
    expect(contract.doctrine.consistency_states).toContain("CONTEXTUALLY_VARIABLE");
    expect(contract.doctrine.workload_states).toContain("MODERATELY_CONCENTRATED");
    expect(contract.doctrine.required_data_sources).toEqual(
      expect.arrayContaining(["Pattern Intelligence Engine", "Operator Approval Workflow", "Identity and Authorization Service"]),
    );
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministically and replays without drift", () => {
    const first = buildOperatorImpactDashboard();
    const second = buildOperatorImpactDashboard();

    expect(first.status).toBe("AUTHORITATIVE");
    expect(first.validation_outcome).toBe("VALID");
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateOperatorImpactDashboard(first).valid).toBe(true);
    expect(replayOperatorImpactDashboard(first)).toBe(true);
  });

  it("exposes operator impact sections with context before judgment", () => {
    const result = buildOperatorImpactDashboard();

    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.operator_scope_type).toBe("PSEUDONYMIZED_COHORT");
    expect(result.affected_operator_view.identity_minimized).toBe(true);
    expect(result.trend_explorer.contextual_change_markers).toEqual(
      expect.arrayContaining(["policy:v1", "recommendation-engine:v3"]),
    );
    expect(result.override_pattern_view.volume_used_as_operator_quality_measure).toBe(false);
    expect(result.approval_behavior_view.rationale_preserved).toBe(true);
    expect(result.review_latency_view.upstream_delay_not_attributed_to_operator).toBe(true);
    expect(result.consistency_view.different_context_not_marked_inconsistent).toBe(true);
    expect(result.workload_distribution_view.complexity_adjusted).toBe(true);
    expect(result.context_panel.alternative_explanations).toContain("poor recommendation quality");
    expect(result.context_panel.misconduct_inferred).toBe(false);
  });

  it("prohibits ranking, scoring, punishment, authority changes, and reassignment", () => {
    const result = buildOperatorImpactDashboard();

    expect(result.comparison_workspace.unsupported_ranking_present).toBe(false);
    expect(result.comparison_workspace.composite_operator_score_present).toBe(false);
    expect(result.api_surface.authority_reduction_supported).toBe(false);
    expect(result.api_surface.workload_reassignment_supported).toBe(false);
    expect(result.api_surface.disciplinary_action_supported).toBe(false);
    expect(result.api_surface.production_modification_supported).toBe(false);
    expect(result.alert_center.behavioral_alerts_punitive).toBe(false);
    expect(result.workload_distribution_view.automatic_reassignment_supported).toBe(false);
    expect(result.write_authority_granted).toBe(false);
  });

  it("audits identity-level access with stable privacy decisions", () => {
    const result = buildOperatorImpactDashboard({ identity_level_requested: true, role: "AUDITOR" });

    expect(result.records[0]?.operator_scope_type).toBe("INDIVIDUAL_OPERATOR");
    expect(result.records[0]?.privacy_classification).toBe("IDENTITY_VISIBLE_AUTHORIZED");
    expect(result.audit_records[0]?.identity_level_requested).toBe(true);
    expect(result.audit_records[0]?.append_only).toBe(true);
    expect(result.audit_records[0]?.authorization_result).toBe("ALLOWED");
    expect(validateOperatorImpactDashboard(result).valid).toBe(true);
  });

  it("surfaces observability and validation evidence", () => {
    const result = buildOperatorImpactDashboard();

    expect(result.validation_tests).toHaveLength(21);
    expect(result.metrics.broken_evidence_references).toBe(0);
    expect(result.metrics.privacy_control_failures).toBe(0);
    expect(result.metrics.tenant_isolation_failures).toBe(0);
    expect(result.metrics.nondeterministic_trend_results).toBe(0);
  });

  it.each(failureScenarios)("fails closed for %s", (scenario, failure) => {
    const result = buildOperatorImpactDashboard({ scenario });
    const validation = validateOperatorImpactDashboard(result);

    expect(result.status).toBe("REJECTED");
    expect(result.validation_outcome).toBe("INVALID");
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayOperatorImpactDashboard(result)).toBe(false);
  });

  it("detects tampering through integrity and replay checks", () => {
    const result = buildOperatorImpactDashboard();
    const tampered = {
      ...result,
      records: [
        {
          ...result.records[0]!,
          tenant_id: "tenant-other",
        },
      ],
    };

    expect(validateOperatorImpactDashboard(tampered).integrity_hash_valid).toBe(false);
    expect(replayOperatorImpactDashboard(tampered)).toBe(false);
  });
});
