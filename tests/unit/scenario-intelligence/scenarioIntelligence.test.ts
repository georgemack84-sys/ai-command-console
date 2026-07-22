import { describe, expect, it } from "vitest";

import {
  getScenarioIntelligenceContract,
  replayScenarioIntelligence,
  runScenarioIntelligence,
  validateScenarioIntelligence,
} from "../../../services/scenario-intelligence";
import type { ScenarioIntelligenceScenario } from "../../../types/scenario-intelligence";

describe("scenario intelligence", () => {
  it("constructs deterministic certified scenarios", () => {
    const first = runScenarioIntelligence();
    const second = runScenarioIntelligence();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.ready_for_forecast_intelligence).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateScenarioIntelligence(first).valid).toBe(true);
    expect(replayScenarioIntelligence(first)).toBe(true);
  });

  it("publishes scenario intelligence doctrine", () => {
    const bundle = getScenarioIntelligenceContract();

    expect(bundle.doctrine.advisory_only).toBe(true);
    expect(bundle.doctrine.bounded_taxonomy_required).toBe(true);
    expect(bundle.doctrine.explicit_assumptions_required).toBe(true);
    expect(bundle.doctrine.policy_bound_scenarios_required).toBe(true);
    expect(bundle.doctrine.governance_qualification_required).toBe(true);
    expect(bundle.doctrine.coverage_validation_required).toBe(true);
  });

  it("registers bounded taxonomy and policy-bound scenario artifacts", () => {
    const result = runScenarioIntelligence();

    expect(result.taxonomy.scenario_types).toHaveLength(10);
    expect(result.scenarios).toHaveLength(10);
    expect(result.scenarios.every((scenario) => scenario.advisory_only && scenario.policy_manifest_ref && scenario.evidence_refs.length > 0)).toBe(true);
    expect(result.scenarios.every((scenario) => scenario.candidate_strategy_refs.length > 0 && scenario.origin_ref.length > 0)).toBe(true);
  });

  it("tracks explicit assumptions and qualifies scenarios before downstream use", () => {
    const result = runScenarioIntelligence();

    expect(result.assumptions).toHaveLength(10);
    expect(result.assumptions.every((assumption) => assumption.evidence_refs.length > 0 && assumption.governance_approved)).toBe(true);
    expect(result.qualifications).toHaveLength(10);
    expect(result.qualifications.every((record) => record.status === "QUALIFIED")).toBe(true);
  });

  it("validates coverage, closes, ledgers, and replays scenario construction", () => {
    const result = runScenarioIntelligence();

    expect(result.coverage.complete).toBe(true);
    expect(result.coverage.missing_scenario_classes).toHaveLength(0);
    expect(result.closure.state).toBe("CLOSED");
    expect(result.closure.immutable).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.replay.integrity_hashes_reproduced).toBe(true);
  });

  it("runs the phase 12.5 certification suite", () => {
    const result = runScenarioIntelligence();

    expect(result.certification.tests).toHaveLength(30);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for taxonomy, construction, assumptions, coverage, qualification, replay, governance, and integrity violations", () => {
    const scenarios: readonly ScenarioIntelligenceScenario[] = [
      "TAXONOMY_INCOMPLETE",
      "UNKNOWN_SCENARIO_TYPE",
      "DUPLICATE_TAXONOMY_ENTRY",
      "CONSTRUCTION_POLICY_INCOMPLETE",
      "NONDETERMINISTIC_CONSTRUCTION",
      "EVIDENCE_MISSING",
      "ASSUMPTION_MISSING",
      "HIDDEN_ASSUMPTION",
      "UNSUPPORTED_ASSUMPTION",
      "DUPLICATE_ASSUMPTION",
      "CONFLICTING_ASSUMPTION",
      "POLICY_MANIFEST_MISSING",
      "GOVERNANCE_APPROVAL_MISSING",
      "CONSTITUTIONAL_VIOLATION",
      "CROSS_TENANT_INPUT",
      "COVERAGE_INCOMPLETE",
      "DUPLICATE_COVERAGE",
      "UNSUPPORTED_COVERAGE_GAP",
      "QUALIFICATION_NONDETERMINISTIC",
      "REPLAY_NOT_REPRODUCIBLE",
      "INTEGRITY_VALIDATION_FAILED",
      "ORIGIN_INCOMPLETE",
      "LINEAGE_MUTABLE",
      "ADVISORY_BOUNDARY_VIOLATION",
      "LEDGER_NOT_APPEND_ONLY",
      "OBSERVABILITY_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runScenarioIntelligence({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.ready_for_forecast_intelligence).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateScenarioIntelligence(result).valid).toBe(false);
    }
  });
});
