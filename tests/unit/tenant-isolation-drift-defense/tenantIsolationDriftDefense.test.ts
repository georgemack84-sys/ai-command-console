import { describe, expect, it } from "vitest";
import {
  defendTenantIsolationDrift,
  getTenantIsolationDriftFoundation,
  replayTenantIsolationDriftDefense,
} from "@/services/tenant-isolation-drift-defense";
import type {
  TenantIsolationDriftFailure,
  TenantIsolationDriftScenario,
  TenantIsolationDriftStatus,
} from "@/types/tenant-isolation-drift-defense";

describe("Mission Control Phase 10.12.10 Tenant Isolation Drift Defense", () => {
  it("publishes the tenant isolation drift defense contract", () => {
    const foundation = getTenantIsolationDriftFoundation();

    expect(foundation.tenant_isolation_drift_defense_version).toBe("tenant-isolation-drift-defense/v1");
    expect(foundation.api_surface.defend_tenant_isolation).toBe("POST /tenant-isolation-drift-defense/defend");
    expect(foundation.api_surface.retrieve_baseline).toBe("POST /tenant-isolation-drift-defense/baseline");
    expect(foundation.api_surface.retrieve_boundary).toBe("POST /tenant-isolation-drift-defense/boundary");
    expect(foundation.api_surface.retrieve_leakage).toBe("POST /tenant-isolation-drift-defense/leakage");
    expect(foundation.api_surface.retrieve_learning).toBe("POST /tenant-isolation-drift-defense/learning");
    expect(foundation.api_surface.retrieve_policy).toBe("POST /tenant-isolation-drift-defense/policy");
    expect(foundation.api_surface.retrieve_optimization).toBe("POST /tenant-isolation-drift-defense/optimization");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /tenant-isolation-drift-defense/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.tenant_sharing_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.defense_identifier).toBe("TenantIsolationDriftDefense");
    expect(foundation.result.status).toBe("PASS");
  });

  it("defends deterministically with stable replay and integrity hashes", () => {
    const first = defendTenantIsolationDrift();
    const second = defendTenantIsolationDrift();

    expect(first.baseline.integrity_hash).toBe(second.baseline.integrity_hash);
    expect(first.boundary_report.integrity_hash).toBe(second.boundary_report.integrity_hash);
    expect(first.leakage_report.integrity_hash).toBe(second.leakage_report.integrity_hash);
    expect(first.learning_report.integrity_hash).toBe(second.learning_report.integrity_hash);
    expect(first.policy_report.integrity_hash).toBe(second.policy_report.integrity_hash);
    expect(first.optimization_report.integrity_hash).toBe(second.optimization_report.integrity_hash);
    expect(first.integrity_score_report.integrity_hash).toBe(second.integrity_score_report.integrity_hash);
    expect(first.isolation_assessment.integrity_hash).toBe(second.isolation_assessment.integrity_hash);
    expect(first.contamination_assessment.integrity_hash).toBe(second.contamination_assessment.integrity_hash);
    expect(first.drift_record.integrity_hash).toBe(second.drift_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayTenantIsolationDriftDefense(first)).toBe(true);
  });

  it("maintains the authoritative tenant isolation baseline", () => {
    const baseline = defendTenantIsolationDrift().baseline;

    expect(baseline.baseline_id).toBe("tenant_isolation_drift_baseline_v1");
    expect(baseline.tenant_model_version).toBe("tenant-model/v1");
    expect(baseline.tenant_namespace).toBe("tenant://mission-control/isolated");
    expect(baseline.isolation_policies).toEqual(expect.arrayContaining(["tenant_local_learning_only", "tenant_local_evidence_only", "fail_closed_unknown_tenant"]));
    expect(baseline.approved_sharing_rules).toContain("certified_platform_capability_only");
    expect(baseline.governance_requirements).toContain("governance_review_for_boundary_change");
    expect(baseline.constitutional_requirements).toContain("tenant_isolation_nonnegotiable");
    expect(baseline.platform_capabilities).toContain("platform_telemetry_aggregation:certified");
    expect(baseline.approval_reference).toBe("governance-approval:tenant-isolation-drift-baseline:v1");
    expect(baseline.effective_date).toBe("2026-07-11");
    expect(baseline.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("produces baseline reports, assessment, contamination summary, and ledger evidence", () => {
    const result = defendTenantIsolationDrift();

    expect(result.boundary_report.isolation_verification_assessment).toContain("passed");
    expect(result.leakage_report.leakage_detected).toBe(false);
    expect(result.learning_report.cross_tenant_learning_assessment).toContain("tenant-local");
    expect(result.policy_report.governance_boundary_assessment).toContain("isolated");
    expect(result.optimization_report.optimization_boundary_assessment).toContain("tenant-scoped");
    expect(result.integrity_score_report.tenant_isolation_integrity_score).toBe(0.99);
    expect(result.isolation_assessment.isolation_drift_detected).toBe(false);
    expect(result.isolation_assessment.containment_actions).toEqual(["monitor_tenant_isolation"]);
    expect(result.contamination_assessment.contamination_scope).toBe("none");
    expect(result.drift_record.drift_id).toMatch(/^tenant_isolation_drift_/);
    expect(result.drift_record.tenant_model_version).toBe("tenant-model/v1");
    expect(result.drift_record.drift_category).toBe("NO_TENANT_ISOLATION_DRIFT");
    expect(result.drift_record.severity).toBe("INFORMATIONAL");
    expect(result.drift_record.recommended_response).toBe("MONITOR");
    expect(result.drift_record.containment_required).toBe(false);
    expect(result.drift_record.replay_refs).toContain("replay:tenant-isolation-drift-defense");
    expect(result.drift_record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("enforces invariant guarantees without mutating production behavior", () => {
    const result = defendTenantIsolationDrift();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.evidence_backed).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_production_behavior).toBe(false);
    expect(result.authorizes_tenant_sharing).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_BOUNDARY_CHANGE", "UNAUTHORIZED_BOUNDARY_CHANGE", "REQUIRES_GOVERNANCE_REVIEW"],
    ["UNKNOWN_TENANT_OWNERSHIP", "UNKNOWN_TENANT_OWNERSHIP", "FAIL_CLOSED"],
    ["MIXED_TENANT_LINEAGE", "MIXED_TENANT_LINEAGE", "DRIFT_DETECTED"],
    ["UNAUTHORIZED_TENANT_ACCESS", "UNAUTHORIZED_TENANT_ACCESS", "FAIL_CLOSED"],
    ["INVALID_NAMESPACE", "INVALID_NAMESPACE_ASSIGNMENT", "FAIL_CLOSED"],
    ["AMBIGUOUS_OWNERSHIP", "AMBIGUOUS_TENANT_OWNERSHIP", "DRIFT_DETECTED"],
    ["TENANT_CONTAMINATION", "TENANT_CONTAMINATION_DETECTED", "BLOCKED"],
    ["ADAPTATION_LEAKAGE", "ADAPTATION_LEAKAGE_DETECTED", "BLOCKED"],
    ["SHARED_LEARNING", "SHARED_LEARNING_DETECTED", "BLOCKED"],
    ["UNAUTHORIZED_REUSE", "UNAUTHORIZED_REUSE_DETECTED", "REQUIRES_GOVERNANCE_REVIEW"],
    ["POLICY_CROSSOVER", "POLICY_CROSSOVER_DETECTED", "BLOCKED"],
    ["CROSS_TENANT_OPTIMIZATION", "CROSS_TENANT_OPTIMIZATION_DETECTED", "BLOCKED"],
    ["EVIDENCE_INFLUENCE", "CROSS_TENANT_EVIDENCE_INFLUENCE", "BLOCKED"],
    ["SHARED_RECOMMENDATION", "SHARED_RECOMMENDATION_BEHAVIOR", "DRIFT_DETECTED"],
    ["REPLAY_CONTAMINATION", "REPLAY_CONTAMINATION_DETECTED", "BLOCKED"],
    ["SIMULATION_CONTAMINATION", "SIMULATION_CONTAMINATION_DETECTED", "DRIFT_DETECTED"],
    ["CONFIGURATION_CROSSOVER", "CONFIGURATION_CROSSOVER_DETECTED", "DRIFT_DETECTED"],
    ["NAMESPACE_DRIFT", "NAMESPACE_DRIFT_DETECTED", "DRIFT_DETECTED"],
    ["SHARED_ADAPTATION", "SHARED_ADAPTATION_DETECTED", "DRIFT_DETECTED"],
    ["RECOMMENDATION_CONTAMINATION", "RECOMMENDATION_CONTAMINATION", "DRIFT_DETECTED"],
    ["INHERITED_OPTIMIZATION", "INHERITED_OPTIMIZATION_DETECTED", "DRIFT_DETECTED"],
    ["PROPOSAL_REUSE", "CROSS_TENANT_PROPOSAL_REUSE", "DRIFT_DETECTED"],
    ["TRANSFERRED_BEHAVIOR", "TRANSFERRED_BEHAVIOR_DETECTED", "DRIFT_DETECTED"],
    ["RECOMMENDATION_INHERITANCE", "RECOMMENDATION_INHERITANCE_DETECTED", "DRIFT_DETECTED"],
    ["CONFIDENCE_TRANSFER", "CONFIDENCE_TRANSFER_DETECTED", "DRIFT_DETECTED"],
    ["RISK_MODEL_SHARING", "RISK_MODEL_SHARING_DETECTED", "DRIFT_DETECTED"],
    ["HISTORICAL_LEARNING_CONTAMINATION", "HISTORICAL_LEARNING_CONTAMINATION", "DRIFT_DETECTED"],
    ["GOVERNANCE_CONTAMINATION", "GOVERNANCE_CONTAMINATION", "DRIFT_DETECTED"],
    ["SHARED_APPROVAL_LOGIC", "SHARED_APPROVAL_LOGIC", "DRIFT_DETECTED"],
    ["GOVERNANCE_INFLUENCE", "CROSS_TENANT_GOVERNANCE_INFLUENCE", "DRIFT_DETECTED"],
    ["OPTIMIZATION_INHERITANCE", "OPTIMIZATION_INHERITANCE_DETECTED", "DRIFT_DETECTED"],
    ["OPTIMIZATION_REUSE", "OPTIMIZATION_REUSE_DETECTED", "DRIFT_DETECTED"],
    ["SHARED_OPTIMIZATION_OBJECTIVES", "SHARED_OPTIMIZATION_OBJECTIVES", "DRIFT_DETECTED"],
    ["SHARED_ADAPTIVE_STATE", "SHARED_ADAPTIVE_STATE", "BLOCKED"],
    ["LINEAGE_CONTAMINATION", "CROSS_TENANT_LINEAGE_CONTAMINATION", "BLOCKED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_ISOLATION_ASSESSMENT", "DRIFT_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_ISOLATION_EVIDENCE", "DRIFT_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_TENANT_BEHAVIOR", "FAIL_CLOSED"],
  ] as readonly [TenantIsolationDriftScenario, TenantIsolationDriftFailure, TenantIsolationDriftStatus][])(
    "maps %s to %s with %s status",
    (scenario, failure, status) => {
      const result = defendTenantIsolationDrift({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.status).toBe(status);
      expect(result.isolation_assessment.detected_violations).toContain(failure);
      expect(result.drift_record.drift_category).toBe(failure);
      expect(replayTenantIsolationDriftDefense(result)).toBe(true);
    },
  );

  it("automatically blocks cross-tenant learning, evidence, replay, policy, and optimization violations", () => {
    const learning = defendTenantIsolationDrift({ scenario: "SHARED_LEARNING" });
    const evidence = defendTenantIsolationDrift({ scenario: "EVIDENCE_INFLUENCE" });
    const replay = defendTenantIsolationDrift({ scenario: "REPLAY_CONTAMINATION" });
    const policy = defendTenantIsolationDrift({ scenario: "POLICY_CROSSOVER" });
    const optimization = defendTenantIsolationDrift({ scenario: "CROSS_TENANT_OPTIMIZATION" });

    expect(learning.learning_report.automatic_blocks).toContain("block_cross_tenant_learning");
    expect(evidence.isolation_assessment.containment_actions).toContain("block_evidence_sharing");
    expect(replay.isolation_assessment.containment_actions).toContain("block_replay_contamination");
    expect(policy.policy_report.automatic_blocks).toContain("block_policy_crossover");
    expect(optimization.optimization_report.automatic_blocks).toContain("block_optimization_reuse");
    expect(optimization.drift_record.containment_required).toBe(true);
  });

  it("degrades guarantees for corresponding isolation failures", () => {
    expect(defendTenantIsolationDrift({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    const evidence = defendTenantIsolationDrift({ scenario: "NONREPLAYABLE_EVIDENCE" });
    expect(evidence.replayable).toBe(false);
    expect(evidence.evidence_backed).toBe(false);
    expect(defendTenantIsolationDrift({ scenario: "GOVERNANCE_CONTAMINATION" }).governance_preserved).toBe(false);
    expect(defendTenantIsolationDrift({ scenario: "TENANT_CONTAMINATION" }).constitutional_preserved).toBe(false);
    expect(defendTenantIsolationDrift({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("fails replay when tenant isolation evidence is tampered", () => {
    const result = defendTenantIsolationDrift({ scenario: "SHARED_LEARNING" });
    const tampered = {
      ...result,
      isolation_assessment: {
        ...result.isolation_assessment,
        containment_actions: ["allow_cross_tenant_learning"],
      },
    };

    expect(replayTenantIsolationDriftDefense(result)).toBe(true);
    expect(replayTenantIsolationDriftDefense(tampered)).toBe(false);
  });
});
