import { describe, expect, it } from "vitest";
import {
  getHistoricalReplayTestHarnessFoundation,
  replayHistoricalReplayValidation,
  validateHistoricalReplay,
} from "@/services/historical-replay-test-harness";
import type {
  HistoricalReplayDataSource,
  HistoricalReplayFailure,
  HistoricalReplayScenario,
  HistoricalReplayScope,
} from "@/types/historical-replay-test-harness";

describe("Mission Control Phase 10.11.2 Historical Replay Test Harness", () => {
  const expectedScopes: readonly HistoricalReplayScope[] = [
    "PREVIOUS_MISSIONS",
    "PREVIOUS_DECISIONS",
    "PREVIOUS_RECOMMENDATIONS",
    "OPERATOR_ACTIONS",
    "GOVERNANCE_REVIEWS",
    "APPROVAL_WORKFLOWS",
    "ROLLBACK_EVENTS",
    "CONFIDENCE_EVOLUTION",
    "RISK_EVOLUTION",
  ];

  const expectedSources: readonly HistoricalReplayDataSource[] = [
    "TRUTH_LEDGER",
    "RECOMMENDATION_LEDGER",
    "DECISION_GRAPH",
    "GOVERNANCE_LEDGER",
    "REPLAY_LEDGER",
    "RISK_HISTORY",
    "CONFIDENCE_HISTORY",
    "MISSION_TIMELINE",
    "OPERATOR_ACTIVITY_LEDGER",
    "APPROVAL_LEDGER",
    "ROLLBACK_LEDGER",
  ];

  it("publishes the historical replay harness contract", () => {
    const foundation = getHistoricalReplayTestHarnessFoundation();

    expect(foundation.historical_replay_test_harness_version).toBe("historical-replay-test-harness/v1");
    expect(foundation.supported_scopes).toEqual(expectedScopes);
    expect(foundation.authorized_data_sources).toEqual(expectedSources);
    expect(foundation.api_surface.validate_replay).toBe("POST /historical-replay-test-harness/validate");
    expect(foundation.api_surface.retrieve_contract).toBe("GET /historical-replay-test-harness/contract");
    expect(foundation.api_surface.synthetic_data_supported).toBe(false);
    expect(foundation.api_surface.production_mutation_supported).toBe(false);
    expect(foundation.api_surface.approval_or_deployment_supported).toBe(false);
    expect(foundation.api_surface.advisory_only).toBe(true);
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.result.harness_identifier).toBe("HistoricalReplayTestHarness");
    expect(foundation.result.outcome).toBe("PASS");
  });

  it("validates historical replay deterministically", () => {
    const first = validateHistoricalReplay();
    const second = validateHistoricalReplay();

    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.validation_checks.map((check) => check.integrity_hash)).toEqual(second.validation_checks.map((check) => check.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.baseline_replay_package_hash).toBe(second.baseline_replay_package_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayHistoricalReplayValidation(first)).toBe(true);
  });

  it("passes only when historical execution is exactly reproduced", () => {
    const result = validateHistoricalReplay();

    expect(result.outcome).toBe("PASS");
    expect(result.failures).toEqual([]);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.validation.replay_matches_history).toBe(true);
    expect(result.validation.recommendation_consistent).toBe(true);
    expect(result.validation.governance_preserved).toBe(true);
    expect(result.validation.operator_preserved).toBe(true);
    expect(result.validation.evidence_consistent).toBe(true);
    expect(result.validation.confidence_consistent).toBe(true);
    expect(result.validation.risk_consistent).toBe(true);
  });

  it("validates every required historical replay scope", () => {
    const checks = validateHistoricalReplay().validation_checks;

    expect(checks.map((check) => check.scope)).toEqual(expectedScopes);
    expect(checks.find((check) => check.scope === "PREVIOUS_MISSIONS")?.replayed_elements).toContain("mission_state_transitions");
    expect(checks.find((check) => check.scope === "PREVIOUS_DECISIONS")?.validation_requirements).toContain("identical_decision_ordering");
    expect(checks.find((check) => check.scope === "PREVIOUS_RECOMMENDATIONS")?.validation_requirements).toContain("recommendation_ranking_consistent");
    expect(checks.find((check) => check.scope === "OPERATOR_ACTIONS")?.validation_requirements).toContain("identical_authority_preservation");
    expect(checks.find((check) => check.scope === "GOVERNANCE_REVIEWS")?.validation_requirements).toContain("constitutional_behavior_unchanged");
    expect(checks.find((check) => check.scope === "APPROVAL_WORKFLOWS")?.validation_requirements).toContain("identical_approval_sequence");
    expect(checks.find((check) => check.scope === "ROLLBACK_EVENTS")?.validation_requirements).toContain("rollback_integrity_verified");
    expect(checks.find((check) => check.scope === "CONFIDENCE_EVOLUTION")?.validation_requirements).toContain("identical_confidence_trajectory");
    expect(checks.find((check) => check.scope === "RISK_EVOLUTION")?.validation_requirements).toContain("identical_mitigation_guidance");
    expect(checks.every((check) => check.passed)).toBe(true);
  });

  it("uses only authorized historical ledger sources", () => {
    const result = validateHistoricalReplay();

    expect(result.authorized_data_sources).toEqual(expectedSources);
    expect(result.synthetic_data_introduced).toBe(false);
    expect(result.metrics.data_sources_authorized).toBe(11);
  });

  it("preserves advisory-only boundaries and never mutates history or production", () => {
    const result = validateHistoricalReplay();

    expect(result.advisory_only).toBe(true);
    expect(result.immutable_historical_records_preserved).toBe(true);
    expect(result.modifies_history).toBe(false);
    expect(result.modifies_production_behavior).toBe(false);
    expect(result.approves_or_deploys_proposal).toBe(false);
    expect(result.adaptive_simulation_contract.advisory_only).toBe(true);
    expect(result.adaptive_simulation_contract.modifies_historical_evidence).toBe(false);
  });

  it("publishes baseline replay package, integrity, determinism, metrics, and ledger evidence", () => {
    const result = validateHistoricalReplay();

    expect(result.baseline_replay_package_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.replay_integrity_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.replay_determinism_report_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.simulation_validation_ledger_entry_hash).toMatch(/[a-f0-9]{64}/);
    expect(result.metrics.replay_scopes_validated).toBe(9);
    expect(result.metrics.validation_checks_passed).toBe(9);
    expect(result.metrics.validation_checks_total).toBe(9);
    expect(result.metrics.deterministic_replay_rate).toBe(1);
    expect(result.metrics.replay_match_rate).toBe(1);
    expect(result.metrics.recommendation_consistency_rate).toBe(1);
    expect(result.metrics.evidence_consistency_rate).toBe(1);
    expect(result.metrics.governance_preservation_rate).toBe(1);
    expect(result.metrics.operator_preservation_rate).toBe(1);
    expect(result.metrics.confidence_consistency_rate).toBe(1);
    expect(result.metrics.risk_consistency_rate).toBe(1);
  });

  it("supports conditional pass only for reporting improvements without behavior drift", () => {
    const result = validateHistoricalReplay({ scenario: "CONDITIONAL_REPORTING" });

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual([]);
    expect(result.deterministic).toBe(true);
    expect(result.validation.replay_matches_history).toBe(true);
    expect(result.validation.recommendation_consistent).toBe(true);
    expect(result.validation.governance_preserved).toBe(true);
  });

  it.each([
    ["NONDETERMINISTIC", "NONDETERMINISTIC_REPLAY", "FAIL"],
    ["REPLAY_DIFFERENCE", "REPLAY_DIFFERS_FROM_HISTORY", "FAIL"],
    ["RECOMMENDATION_INCONSISTENCY", "RECOMMENDATION_INCONSISTENCY", "FAIL"],
    ["EVIDENCE_MISMATCH", "EVIDENCE_MISMATCH", "FAIL"],
    ["GOVERNANCE_CHANGE", "GOVERNANCE_BEHAVIOR_CHANGED", "REQUIRES_GOVERNANCE_REVIEW"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "REQUIRES_GOVERNANCE_REVIEW"],
    ["OPERATOR_WORKFLOW_CHANGE", "OPERATOR_WORKFLOW_CHANGED", "FAIL"],
    ["APPROVAL_SEQUENCE_CHANGE", "APPROVAL_SEQUENCE_CHANGED", "FAIL"],
    ["REPLAY_HASH_MISMATCH", "REPLAY_HASH_MISMATCH", "FAIL"],
    ["MISSING_HISTORICAL_EVIDENCE", "MISSING_HISTORICAL_EVIDENCE", "REQUIRES_MORE_EVIDENCE"],
    ["ROLLBACK_INCONSISTENCY", "ROLLBACK_INCONSISTENCY", "FAIL"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH", "FAIL"],
    ["REPLAY_CORRUPTION", "REPLAY_CORRUPTION", "FAIL"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILURE", "FAIL"],
    ["SYNTHETIC_DATA", "SYNTHETIC_DATA_INTRODUCED", "FAIL"],
    ["PRODUCTION_MUTATION", "PRODUCTION_MUTATION_ATTEMPT", "FAIL"],
    ["APPROVAL_OR_DEPLOYMENT", "APPROVAL_OR_DEPLOYMENT_ATTEMPT", "FAIL"],
  ] as const)("fails historical replay for %s", (scenario: HistoricalReplayScenario, failure: HistoricalReplayFailure, outcome) => {
    const result = validateHistoricalReplay({ scenario });

    expect(result.outcome).toBe(outcome);
    expect(result.failures).toContain(failure);
    expect(result.replayable).toBe(false);
    expect(replayHistoricalReplayValidation(result)).toBe(true);
  });

  it("detects nested replay tampering", () => {
    const result = validateHistoricalReplay();
    const tampered = {
      ...result,
      validation: {
        ...result.validation,
        replay_matches_history: false,
      },
    };

    expect(replayHistoricalReplayValidation(tampered)).toBe(false);
  });
});
