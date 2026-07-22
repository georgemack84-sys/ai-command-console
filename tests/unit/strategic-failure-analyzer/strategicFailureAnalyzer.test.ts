import { describe, expect, it } from "vitest";
import {
  analyzeStrategicFailures,
  getStrategicFailureAnalyzerFoundation,
  replayStrategicFailureAnalysis,
} from "@/services/strategic-failure-analyzer";
import type { StrategicFailureFailure, StrategicFailureScenario } from "@/types/strategic-failure-analyzer";

describe("Mission Control Phase 10.5.3 Strategic Failure Analyzer", () => {
  it("publishes the strategic failure analyzer foundation", () => {
    const foundation = getStrategicFailureAnalyzerFoundation();

    expect(foundation.strategic_failure_analyzer_version).toBe("strategic-failure-analyzer/v1");
    expect(foundation.api_surface.analyze_failures).toBe("POST /strategic-failure-analyzer/analyze");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("identifies recurring strategic failures deterministically", () => {
    const first = analyzeStrategicFailures();
    const second = analyzeStrategicFailures();

    expect(first.failures[0].failure_id).toBe(second.failures[0].failure_id);
    expect(first.failures[0].severity).toBe(second.failures[0].severity);
    expect(first.failures[0].remediation_priority).toBe(second.failures[0].remediation_priority);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("classifies supported strategic failure categories", () => {
    expect(analyzeStrategicFailures({ scenario: "STRATEGY_MISMATCH" }).failures[0].failure_category).toBe("STRATEGY_MISMATCH");
    expect(analyzeStrategicFailures({ scenario: "EVIDENCE_WEAKNESS" }).failures[0].failure_category).toBe("EVIDENCE_WEAKNESS");
    expect(analyzeStrategicFailures({ scenario: "CONFIDENCE_ERROR" }).failures[0].failure_category).toBe("CONFIDENCE_ERROR");
    expect(analyzeStrategicFailures({ scenario: "GOVERNANCE_ROUTING_ISSUE" }).failures[0].failure_category).toBe("GOVERNANCE_ROUTING_ISSUE");
    expect(analyzeStrategicFailures({ scenario: "ESCALATION_DELAY" }).failures[0].failure_category).toBe("ESCALATION_DELAY");
    expect(analyzeStrategicFailures({ scenario: "SIMULATION_GAP" }).failures[0].failure_category).toBe("SIMULATION_GAP");
    expect(analyzeStrategicFailures({ scenario: "PLANNING_FAILURE" }).failures[0].failure_category).toBe("PLANNING_FAILURE");
  });

  it("attaches root cause, evidence, governance, pattern, recommendation, and replay lineage", () => {
    const failure = analyzeStrategicFailures().failures[0];

    expect(failure.root_cause_summary.length).toBeGreaterThan(0);
    expect(failure.supporting_pattern_refs.length).toBeGreaterThan(0);
    expect(failure.supporting_outcome_refs.length).toBeGreaterThan(0);
    expect(failure.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(failure.supporting_recommendation_refs.length).toBeGreaterThan(0);
    expect(failure.supporting_governance_refs.length).toBeGreaterThan(0);
    expect(failure.supporting_replay_refs.length).toBeGreaterThan(0);
  });

  it("classifies severity and remediation priority deterministically", () => {
    const failure = analyzeStrategicFailures({ scenario: "GOVERNANCE_ROUTING_ISSUE" }).failures[0];

    expect(failure.severity).toBe("HIGH");
    expect(failure.governance_impact).toBeGreaterThan(0.8);
    expect(failure.remediation_priority).toBeGreaterThan(0.7);
  });

  it("keeps failures advisory-only and does not execute remediation or generate proposals", () => {
    const result = analyzeStrategicFailures();
    const failure = result.failures[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_strategy).toBe(false);
    expect(result.generates_proposals).toBe(false);
    expect(result.executes_remediation).toBe(false);
    expect(failure.advisory_only).toBe(true);
    expect(failure.mutates_strategy).toBe(false);
  });

  it("records immutable append-only failure registry entries", () => {
    const result = analyzeStrategicFailures();
    const failure = result.failures[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.failure_refs).toEqual([failure.failure_id]);
    expect(result.registry.category_index[failure.failure_category]).toEqual([failure.failure_id]);
    expect(result.registry.severity_index[failure.severity]).toEqual([failure.failure_id]);
  });

  it("replays strategic failure analysis", () => {
    const result = analyzeStrategicFailures();

    expect(replayStrategicFailureAnalysis(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_CONTRACT", "STRATEGY_CONTRACT_UNCERTIFIED"],
    ["NOT_REPRODUCIBLE", "FAILURE_NOT_REPRODUCIBLE"],
    ["MISSING_ROOT_CAUSE", "ROOT_CAUSE_MISSING"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["MISSING_PATTERN_REFS", "PATTERN_REFERENCES_MISSING"],
    ["REPLAY_FAILURE", "REPLAY_VERIFICATION_FAILED"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_INCOMPLETE"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["NONDETERMINISTIC_CLASSIFICATION", "CLASSIFICATION_NONDETERMINISTIC"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["SINGLE_FAILURE", "SINGLE_FAILURE_INSUFFICIENT"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["STRATEGY_MUTATION", "STRATEGY_MUTATION_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategicFailureScenario, StrategicFailureFailure][])("fails closed for %s", (scenario, failure) => {
    const result = analyzeStrategicFailures({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.executes_remediation).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = analyzeStrategicFailures({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_complete).toBe(false);
  });

  it("detects strategic failure tampering during replay", () => {
    const result = analyzeStrategicFailures();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategicFailureAnalysis(tampered)).toBe(false);
  });
});
