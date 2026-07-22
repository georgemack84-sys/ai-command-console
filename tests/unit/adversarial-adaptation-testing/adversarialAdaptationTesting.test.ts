import { describe, expect, it } from "vitest";
import {
  getAdversarialTestingFoundation,
  replayAdversarialAdaptationTesting,
  runAdversarialAdaptationTests,
} from "@/services/adversarial-adaptation-testing";
import type {
  AdversarialTestFailure,
  AdversarialTestScenario,
  AdversarialTestStatus,
} from "@/types/adversarial-adaptation-testing";

describe("Mission Control Phase 10.12.11 Adversarial Adaptation Testing", () => {
  it("publishes the adversarial adaptation testing contract", () => {
    const foundation = getAdversarialTestingFoundation();

    expect(foundation.adversarial_adaptation_testing_version).toBe("adversarial-adaptation-testing/v1");
    expect(foundation.api_surface.run_adversarial_tests).toBe("POST /adversarial-adaptation-testing/run");
    expect(foundation.api_surface.retrieve_scenario).toBe("POST /adversarial-adaptation-testing/scenario");
    expect(foundation.api_surface.retrieve_simulation).toBe("POST /adversarial-adaptation-testing/simulation");
    expect(foundation.api_surface.retrieve_validation).toBe("POST /adversarial-adaptation-testing/validation");
    expect(foundation.api_surface.retrieve_attack_success).toBe("POST /adversarial-adaptation-testing/attack-success");
    expect(foundation.api_surface.retrieve_coverage).toBe("POST /adversarial-adaptation-testing/coverage");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /adversarial-adaptation-testing/contract");
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.attack_authorization_supported).toBe(false);
    expect(foundation.api_surface.governance_bypass_supported).toBe(false);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.result.testing_identifier).toBe("AdversarialAdaptationTesting");
    expect(foundation.result.status).toBe("PASS");
  });

  it("runs deterministically with stable replay and integrity hashes", () => {
    const first = runAdversarialAdaptationTests();
    const second = runAdversarialAdaptationTests();

    expect(first.scenario_record.integrity_hash).toBe(second.scenario_record.integrity_hash);
    expect(first.simulation_report.integrity_hash).toBe(second.simulation_report.integrity_hash);
    expect(first.defensive_validation_report.integrity_hash).toBe(second.defensive_validation_report.integrity_hash);
    expect(first.attack_success_analysis.integrity_hash).toBe(second.attack_success_analysis.integrity_hash);
    expect(first.defensive_coverage_report.integrity_hash).toBe(second.defensive_coverage_report.integrity_hash);
    expect(first.resilience_score_report.integrity_hash).toBe(second.resilience_score_report.integrity_hash);
    expect(first.adversarial_test_report.integrity_hash).toBe(second.adversarial_test_report.integrity_hash);
    expect(first.adversarial_replay.integrity_hash).toBe(second.adversarial_replay.integrity_hash);
    expect(first.adversarial_test_record.integrity_hash).toBe(second.adversarial_test_record.integrity_hash);
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdversarialAdaptationTesting(first)).toBe(true);
  });

  it("maintains the authoritative adversarial scenario registry", () => {
    const scenario = runAdversarialAdaptationTests().scenario_record;

    expect(scenario.scenario_id).toBe("adversarial_scenario_baseline");
    expect(scenario.scenario_name).toBe("BASELINE");
    expect(scenario.attack_category).toBe("resilience_baseline");
    expect(scenario.expected_defense).toBe("detect_contain_preserve_replay_require_governance_and_certification");
    expect(scenario.governance_requirements).toContain("governance_review_for_scenario_change");
    expect(scenario.constitutional_requirements).toContain("authority_boundaries_preserved");
    expect(scenario.replay_requirements).toContain("identical_defense_reproduction");
    expect(scenario.certification_requirements).toContain("certification_before_production_progression");
    expect(scenario.approval_reference).toBe("governance-approval:adversarial-scenario-registry:v1");
    expect(scenario.version).toBe("adversarial-scenario/v1");
    expect(scenario.integrity_hash).toMatch(/[a-f0-9]{64}/);
  });

  it("produces baseline simulation, validation, coverage, replay, and ledger evidence", () => {
    const result = runAdversarialAdaptationTests();

    expect(result.simulation_report.simulation_environment).toBe("isolated_non_production");
    expect(result.simulation_report.production_mutation).toBe(false);
    expect(result.defensive_validation_report.defensive_behavior_assessment).toContain("matched");
    expect(result.attack_success_analysis.attack_success_score).toBe(0);
    expect(result.attack_success_analysis.residual_risk).toBe("low");
    expect(result.defensive_coverage_report.coverage_gap_analysis).toContain("covered");
    expect(result.resilience_score_report.defensive_coverage_score).toBe(0.98);
    expect(result.adversarial_test_report.detected_attacks).toEqual([]);
    expect(result.adversarial_test_report.containment_actions).toEqual(["monitor_adversarial_resilience"]);
    expect(result.adversarial_replay.forensic_integrity_preserved).toBe(true);
    expect(result.adversarial_test_record.test_id).toMatch(/^adversarial_test_/);
    expect(result.adversarial_test_record.attack_success_score).toBe(0);
    expect(result.adversarial_test_record.severity).toBe("INFORMATIONAL");
    expect(result.adversarial_test_record.recommended_response).toBe("MONITOR");
    expect(result.adversarial_test_record.replay_refs).toContain("replay:adversarial-adaptation-testing");
    expect(result.adversarial_test_record.timestamp).toBe("2026-07-11T00:00:00.000Z");
  });

  it("enforces invariant guarantees without mutating production behavior", () => {
    const result = runAdversarialAdaptationTests();

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
    expect(result.authorizes_attack).toBe(false);
  });

  it.each([
    ["UNAUTHORIZED_SCENARIO_MODIFICATION", "UNAUTHORIZED_SCENARIO_MODIFICATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["POISONED_EVIDENCE", "POISONED_EVIDENCE_ATTACK", "CONTAINED"],
    ["MALICIOUS_FEEDBACK", "MALICIOUS_FEEDBACK_ATTACK", "VULNERABILITY_DETECTED"],
    ["REPLAY_CORRUPTION", "REPLAY_CORRUPTION_ATTACK", "CONTAINED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTACK", "CONTAINED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_ATTACK", "CONTAINED"],
    ["CONFIDENCE_MANIPULATION", "CONFIDENCE_MANIPULATION_ATTACK", "VULNERABILITY_DETECTED"],
    ["STRATEGIC_DECEPTION", "STRATEGIC_DECEPTION_ATTACK", "VULNERABILITY_DETECTED"],
    ["OPTIMIZATION_ATTACK", "OPTIMIZATION_ATTACK", "VULNERABILITY_DETECTED"],
    ["SYNTHETIC_HISTORY", "SYNTHETIC_HISTORY_ATTACK", "VULNERABILITY_DETECTED"],
    ["FALSE_SUCCESS_PATTERNS", "FALSE_SUCCESS_PATTERN_ATTACK", "VULNERABILITY_DETECTED"],
    ["CONFLICTING_EVIDENCE", "CONFLICTING_EVIDENCE_ATTACK", "VULNERABILITY_DETECTED"],
    ["ADVERSARIAL_OPERATORS", "ADVERSARIAL_OPERATOR_ATTACK", "VULNERABILITY_DETECTED"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE_ATTACK", "VULNERABILITY_DETECTED"],
    ["TENANT_CONTAMINATION", "TENANT_CONTAMINATION_ATTACK", "CONTAINED"],
    ["EVIDENCE_LINEAGE_CORRUPTION", "EVIDENCE_LINEAGE_CORRUPTION", "VULNERABILITY_DETECTED"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS_ATTACK", "CONTAINED"],
    ["POLICY_MANIPULATION", "POLICY_MANIPULATION_ATTACK", "VULNERABILITY_DETECTED"],
    ["RECOMMENDATION_MANIPULATION", "RECOMMENDATION_MANIPULATION_ATTACK", "VULNERABILITY_DETECTED"],
    ["OPTIMIZATION_PRESSURE", "OPTIMIZATION_PRESSURE_ATTACK", "VULNERABILITY_DETECTED"],
    ["OPERATOR_COLLUSION", "OPERATOR_COLLUSION_ATTACK", "VULNERABILITY_DETECTED"],
    ["SYNTHETIC_GOVERNANCE_EVENTS", "SYNTHETIC_GOVERNANCE_EVENT", "VULNERABILITY_DETECTED"],
    ["TIMING_ATTACK", "TIMING_ATTACK", "VULNERABILITY_DETECTED"],
    ["DEPENDENCY_CORRUPTION", "DEPENDENCY_CORRUPTION_ATTACK", "VULNERABILITY_DETECTED"],
    ["AUDIT_MANIPULATION", "AUDIT_MANIPULATION_ATTACK", "VULNERABILITY_DETECTED"],
    ["COORDINATED_ATTACK", "COORDINATED_ATTACK", "VULNERABILITY_DETECTED"],
    ["MULTI_STAGE_ADAPTIVE_ATTACK", "MULTI_STAGE_ADAPTIVE_ATTACK", "CONTAINED"],
    ["FAILED_CONTAINMENT", "FAILED_CONTAINMENT", "FAIL_CLOSED"],
    ["INCOMPLETE_DETECTION", "INCOMPLETE_DETECTION", "VULNERABILITY_DETECTED"],
    ["GOVERNANCE_DEGRADATION", "GOVERNANCE_DEGRADATION", "FAIL_CLOSED"],
    ["REPLAY_FAILURE", "REPLAY_FAILURE", "VULNERABILITY_DETECTED"],
    ["AUTHORITY_VIOLATION", "AUTHORITY_VIOLATION", "FAIL_CLOSED"],
    ["CERTIFICATION_FAILURE", "CERTIFICATION_FAILURE", "VULNERABILITY_DETECTED"],
    ["DEFENSIVE_GAP", "DEFENSIVE_GAP", "VULNERABILITY_DETECTED"],
    ["INCOMPLETE_PROTECTION", "INCOMPLETE_PROTECTION", "VULNERABILITY_DETECTED"],
    ["UNCOVERED_ATTACK_VECTOR", "UNCOVERED_ATTACK_VECTOR", "VULNERABILITY_DETECTED"],
    ["MISSING_CONTAINMENT", "MISSING_CONTAINMENT", "VULNERABILITY_DETECTED"],
    ["INADEQUATE_MONITORING", "INADEQUATE_MONITORING", "VULNERABILITY_DETECTED"],
    ["NONDETERMINISTIC", "NONDETERMINISTIC_TEST", "VULNERABILITY_DETECTED"],
    ["NONREPLAYABLE_EVIDENCE", "NONREPLAYABLE_ATTACK_EVIDENCE", "VULNERABILITY_DETECTED"],
    ["TENANT_BREACH", "TENANT_ISOLATION_BREACH", "FAIL_CLOSED"],
    ["UNKNOWN_BEHAVIOR", "UNKNOWN_ATTACK_BEHAVIOR", "FAIL_CLOSED"],
  ] as readonly [AdversarialTestScenario, AdversarialTestFailure, AdversarialTestStatus][])(
    "maps %s to %s with %s status",
    (scenario, failure, status) => {
      const result = runAdversarialAdaptationTests({ scenario });

      expect(result.failures).toContain(failure);
      expect(result.status).toBe(status);
      expect(result.adversarial_test_report.detected_attacks).toContain(failure);
      expect(result.adversarial_test_record.detected_vulnerabilities).toContain(failure);
      expect(replayAdversarialAdaptationTesting(result)).toBe(true);
    },
  );

  it("contains high-risk attacks and preserves forensic replay evidence", () => {
    const evidence = runAdversarialAdaptationTests({ scenario: "POISONED_EVIDENCE" });
    const replay = runAdversarialAdaptationTests({ scenario: "REPLAY_CORRUPTION" });
    const governance = runAdversarialAdaptationTests({ scenario: "GOVERNANCE_BYPASS" });
    const tenant = runAdversarialAdaptationTests({ scenario: "TENANT_CONTAMINATION" });

    expect(evidence.adversarial_test_report.containment_actions).toContain("quarantine_poisoned_evidence");
    expect(replay.adversarial_test_report.replay_impacts).toContain("replay_integrity_review_required");
    expect(governance.adversarial_test_record.recommended_response).toBe("SUPPRESS_ADAPTATION");
    expect(tenant.simulation_report.tenant_safe).toBe(false);
    expect(tenant.adversarial_replay.forensic_integrity_preserved).toBe(true);
  });

  it("degrades guarantees for the corresponding adversarial failure class", () => {
    expect(runAdversarialAdaptationTests({ scenario: "NONDETERMINISTIC" }).deterministic).toBe(false);
    const evidence = runAdversarialAdaptationTests({ scenario: "NONREPLAYABLE_EVIDENCE" });
    expect(evidence.replayable).toBe(false);
    expect(evidence.evidence_backed).toBe(false);
    expect(runAdversarialAdaptationTests({ scenario: "GOVERNANCE_DEGRADATION" }).governance_preserved).toBe(false);
    expect(runAdversarialAdaptationTests({ scenario: "AUTHORITY_ESCALATION" }).constitutional_preserved).toBe(false);
    expect(runAdversarialAdaptationTests({ scenario: "ADVERSARIAL_OPERATORS" }).operator_authority_preserved).toBe(false);
    expect(runAdversarialAdaptationTests({ scenario: "TENANT_BREACH" }).tenant_isolated).toBe(false);
  });

  it("fails replay when adversarial test evidence is tampered", () => {
    const result = runAdversarialAdaptationTests({ scenario: "POISONED_EVIDENCE" });
    const tampered = {
      ...result,
      adversarial_test_report: {
        ...result.adversarial_test_report,
        containment_actions: ["allow_poisoned_evidence"],
      },
    };

    expect(replayAdversarialAdaptationTesting(result)).toBe(true);
    expect(replayAdversarialAdaptationTesting(tampered)).toBe(false);
  });
});
