import { describe, expect, it } from "vitest";
import {
  establishDriftDefenseArchitecture,
  getDriftDefenseArchitectureFoundation,
  replayDriftDefenseArchitecture,
} from "@/services/drift-defense-architecture";
import type { DriftDefenseFailure, DriftDefenseScenario, DriftSeverity, DriftType } from "@/types/drift-defense-architecture";

describe("Mission Control Phase 10.12.1 Drift Defense Architecture", () => {
  const coreTypes: readonly DriftType[] = [
    "STRATEGIC_DRIFT",
    "CONFIDENCE_DRIFT",
    "RISK_DRIFT",
    "GOVERNANCE_DRIFT",
    "AUTHORITY_DRIFT",
    "REPLAY_DRIFT",
    "EVIDENCE_DRIFT",
    "OPERATOR_FEEDBACK_DRIFT",
    "OPTIMIZATION_DRIFT",
    "TENANT_ISOLATION_DRIFT",
  ];

  const severities: readonly DriftSeverity[] = ["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "CATASTROPHIC"];

  it("publishes the authoritative drift defense architecture contract", () => {
    const foundation = getDriftDefenseArchitectureFoundation();

    expect(foundation.drift_defense_architecture_version).toBe("drift-defense-architecture/v1");
    expect(foundation.supported_severity_levels).toEqual(severities);
    expect(foundation.supported_drift_types).toEqual(expect.arrayContaining(coreTypes));
    expect(foundation.api_surface.establish_architecture).toBe("POST /drift-defense-architecture/establish");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /drift-defense-architecture/contract");
    expect(foundation.api_surface.autonomous_containment_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.cross_tenant_analysis_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.architecture_identifier).toBe("DriftDefenseArchitecture");
    expect(foundation.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministically with stable replay and integrity hashes", () => {
    const first = establishDriftDefenseArchitecture();
    const second = establishDriftDefenseArchitecture();

    expect(first.contract.integrity_hash).toBe(second.contract.integrity_hash);
    expect(first.taxonomy.map((item) => item.integrity_hash)).toEqual(second.taxonomy.map((item) => item.integrity_hash));
    expect(first.response_policies.map((item) => item.integrity_hash)).toEqual(second.response_policies.map((item) => item.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayDriftDefenseArchitecture(first)).toBe(true);
  });

  it("defines the complete drift taxonomy registry", () => {
    const result = establishDriftDefenseArchitecture();

    expect(result.taxonomy).toHaveLength(22);
    expect(result.taxonomy.map((item) => item.name)).toEqual(expect.arrayContaining(coreTypes));
    expect(result.taxonomy.map((item) => item.name)).toContain("BEHAVIORAL_DRIFT");
    expect(result.taxonomy.map((item) => item.name)).toContain("INTEGRITY_DRIFT");
    expect(result.taxonomy.every((item) => item.category_id.startsWith("drift_category_"))).toBe(true);
    expect(result.taxonomy.every((item) => item.supported_responses.length === 8)).toBe(true);
    expect(result.taxonomy.every((item) => item.severity_model.length === 6)).toBe(true);
  });

  it("defines deterministic detection pipeline guarantees", () => {
    const pipeline = establishDriftDefenseArchitecture().detection_pipeline;

    expect(pipeline.stages).toEqual([
      "Evidence Collection",
      "Normalization",
      "Evidence Validation",
      "Feature Extraction",
      "Drift Classification",
      "Severity Calculation",
      "Governance Evaluation",
      "Containment Decision",
      "Replay Recording",
      "Ledger Recording",
      "Operator Notification",
    ]);
    expect(pipeline.deterministic).toBe(true);
    expect(pipeline.explainable).toBe(true);
    expect(pipeline.replayable).toBe(true);
    expect(pipeline.evidence_backed).toBe(true);
    expect(pipeline.governance_aware).toBe(true);
    expect(pipeline.tenant_isolated).toBe(true);
    expect(pipeline.auditable).toBe(true);
  });

  it("defines response policies and containment for every drift type and severity", () => {
    const result = establishDriftDefenseArchitecture();
    const criticalPolicy = result.response_policies.find((item) => item.supported_drift === "GOVERNANCE_DRIFT" && item.supported_severity === "CRITICAL");
    const moderatePolicy = result.response_policies.find((item) => item.supported_drift === "CONFIDENCE_DRIFT" && item.supported_severity === "MODERATE");

    expect(result.response_policies).toHaveLength(132);
    expect(result.containment_levels).toEqual([
      "LEVEL_0_OBSERVE",
      "LEVEL_1_MONITOR",
      "LEVEL_2_RESTRICT_ADAPTATION",
      "LEVEL_3_SUSPEND_PROPOSAL",
      "LEVEL_4_REQUIRE_GOVERNANCE_REVIEW",
      "LEVEL_5_REQUIRE_CERTIFICATION",
      "LEVEL_6_ROLLBACK",
      "LEVEL_7_FAIL_CLOSED",
    ]);
    expect(criticalPolicy?.required_response).toBe("FAIL_CLOSED");
    expect(criticalPolicy?.governance_required).toBe(true);
    expect(criticalPolicy?.certification_required).toBe(true);
    expect(criticalPolicy?.containment_level).toBe("LEVEL_7_FAIL_CLOSED");
    expect(moderatePolicy?.required_response).toBe("REQUIRE_REVIEW");
    expect(moderatePolicy?.simulation_required).toBe(true);
  });

  it("defines escalation, certification, replay, governance, and audit requirements", () => {
    const result = establishDriftDefenseArchitecture();

    expect(result.escalation_triggers).toContain("governance_drift");
    expect(result.escalation_triggers).toContain("unknown_drift");
    expect(result.escalation_destinations).toEqual(["GOVERNANCE_REVIEW", "SIMULATION_VALIDATION", "CERTIFICATION_REVIEW", "OPERATOR_REVIEW", "EXECUTIVE_REVIEW"]);
    expect(result.certification_requirements).toContain("deterministic_detection");
    expect(result.certification_requirements).toContain("tenant_isolation");
    expect(result.replay_requirements).toContain("identical_classification");
    expect(result.replay_requirements).toContain("identical_ledger_entries");
    expect(result.governance_dependencies).toContain("Constitutional Enforcement Engine");
    expect(result.governance_dependencies).toContain("Tenant Isolation Framework");
    expect(result.audit_requirements).toContain("cryptographic_verification");
  });

  it("preserves architecture invariants and remains advisory-only", () => {
    const result = establishDriftDefenseArchitecture();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.explainable).toBe(true);
    expect(result.governance_preserved).toBe(true);
    expect(result.constitutional_preserved).toBe(true);
    expect(result.operator_authority_preserved).toBe(true);
    expect(result.tenant_isolated).toBe(true);
    expect(result.immutable_evidence_required).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.authorizes_production_response).toBe(false);
  });

  it("publishes observability metrics for the architecture", () => {
    const metrics = establishDriftDefenseArchitecture().metrics;

    expect(metrics.supported_drift_types_count).toBe(22);
    expect(metrics.severity_levels_count).toBe(6);
    expect(metrics.response_policies_count).toBe(132);
    expect(metrics.containment_levels_count).toBe(8);
    expect(metrics.escalation_destinations_count).toBe(5);
    expect(metrics.governance_dependencies_count).toBe(10);
    expect(metrics.deterministic_detection_guaranteed).toBe(true);
    expect(metrics.replayability_guaranteed).toBe(true);
    expect(metrics.operator_authority_preserved).toBe(true);
    expect(metrics.tenant_isolation_preserved).toBe(true);
    expect(metrics.fail_closed_enforced).toBe(true);
  });

  it.each([
    ["CERTIFICATION_UNAVAILABLE", "SIMULATION_CERTIFICATION_UNAVAILABLE"],
    ["UNSUPPORTED_DRIFT", "UNSUPPORTED_DRIFT_DEFINITION"],
    ["DUPLICATE_IDENTIFIER", "DUPLICATE_DRIFT_IDENTIFIER"],
    ["CONFLICTING_POLICY", "CONFLICTING_RESPONSE_POLICY"],
    ["MISSING_GOVERNANCE", "MISSING_GOVERNANCE_MAPPING"],
    ["INCOMPLETE_REPLAY", "INCOMPLETE_REPLAY_DEFINITION"],
    ["INVALID_SEVERITY", "INVALID_SEVERITY_MAPPING"],
    ["UNKNOWN_DRIFT", "UNKNOWN_DRIFT_CONDITION"],
    ["AMBIGUOUS_DRIFT", "AMBIGUOUS_DRIFT_CONDITION"],
    ["UNSUPPORTED_CONDITION", "UNSUPPORTED_DRIFT_CONDITION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPT"],
    ["OPERATOR_AUTHORITY_BYPASS", "OPERATOR_AUTHORITY_BYPASS_ATTEMPT"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS_ATTEMPT"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH"],
    ["MISSING_EVIDENCE", "IMMUTABLE_EVIDENCE_MISSING"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_DETECTION"],
    ["NONREPLAYABLE_CONTAINMENT", "NONREPLAYABLE_CONTAINMENT"],
    ["INCOMPLETE_AUDIT", "AUDIT_REQUIREMENT_INCOMPLETE"],
  ] as const)("fails closed for %s", (scenario: DriftDefenseScenario, failure: DriftDefenseFailure) => {
    const result = establishDriftDefenseArchitecture({ scenario });

    expect(result.status).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(replayDriftDefenseArchitecture(result)).toBe(true);
  });

  it("detects nested architecture tampering", () => {
    const result = establishDriftDefenseArchitecture();
    const tampered = {
      ...result,
      contract: {
        ...result.contract,
        supported_drift_types: result.contract.supported_drift_types.slice(1),
      },
    };

    expect(replayDriftDefenseArchitecture(tampered)).toBe(false);
  });
});
