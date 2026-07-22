import { describe, expect, it } from "vitest";
import {
  buildDeterministicOptimizationValidationObservabilitySurface,
  getDeterministicOptimizationValidation,
  listAuthorityValidationRecords,
  listConstitutionalValidationRecords,
  listDeterministicValidationRecords,
  listGovernanceValidationRecords,
  listMissionOutcomeEquivalenceRecords,
  listReplayComparisonRecords,
  listTenantValidationRecords,
  runDeterministicOptimizationValidation,
  validateDeterministicOptimizationValidation,
} from "@/services/deterministic-optimization-validation";
import { runOptimizationImpactAnalysis } from "@/services/optimization-impact-analysis";
import type { DeterministicOptimizationValidationFailure, DeterministicOptimizationValidationScenario } from "@/types/deterministic-optimization-validation";

describe("deterministic optimization validation", () => {
  it("publishes the deterministic validation bundle", () => {
    const bundle = getDeterministicOptimizationValidation();

    expect(bundle.doctrine.contract_version).toBe("deterministic-optimization-validation/v8ALT.8.3");
    expect(bundle.doctrine.final_state).toBe("DETERMINISTIC_OPTIMIZATION_VALIDATED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.ledger.final_state).toBe("DETERMINISTIC_OPTIMIZATION_VALIDATED");
    expect(bundle.ledger.execution_authority).toBe(false);
    expect(bundle.ledger.approval_authority).toBe(false);
    expect(bundle.ledger.automatic_approval).toBe(false);
    expect(bundle.ledger.recommendation_authority).toBe(false);
  });

  it("validates every acceptable impact analysis with complete evidence", () => {
    const impact = runOptimizationImpactAnalysis();
    const ledger = runDeterministicOptimizationValidation({ impact_ledger: impact });

    expect(ledger.validations.length).toBe(impact.analyses.filter((analysis) => analysis.decision_outcome === "ACCEPTABLE").length);
    expect(ledger.deterministic_records.length).toBe(ledger.validations.length);
    expect(ledger.replay_records.length).toBe(ledger.validations.length);
    expect(ledger.governance_records.length).toBe(ledger.validations.length);
    expect(ledger.constitutional_records.length).toBe(ledger.validations.length);
    expect(ledger.authority_records.length).toBe(ledger.validations.length);
    expect(ledger.tenant_records.length).toBe(ledger.validations.length);
    expect(ledger.mission_equivalence_records.length).toBe(ledger.validations.length);
  });

  it("keeps validation separate from approval and recommendation authority", () => {
    const ledger = runDeterministicOptimizationValidation();

    expect(ledger.validations.every((record) => record.advisory_only)).toBe(true);
    expect(ledger.validations.every((record) => !record.execution_authority)).toBe(true);
    expect(ledger.validations.every((record) => !record.approval_authority)).toBe(true);
    expect(ledger.validations.every((record) => !record.automatic_approval)).toBe(true);
    expect(ledger.validations.every((record) => !record.recommendation_authority)).toBe(true);
  });

  it("lists all validation evidence surfaces", () => {
    expect(listDeterministicValidationRecords().length).toBeGreaterThan(0);
    expect(listReplayComparisonRecords().length).toBeGreaterThan(0);
    expect(listGovernanceValidationRecords().length).toBeGreaterThan(0);
    expect(listConstitutionalValidationRecords().length).toBeGreaterThan(0);
    expect(listAuthorityValidationRecords().length).toBeGreaterThan(0);
    expect(listTenantValidationRecords().length).toBeGreaterThan(0);
    expect(listMissionOutcomeEquivalenceRecords().length).toBeGreaterThan(0);
  });

  it.each([
    ["MISSING_IMPACT_LEDGER", "IMPACT_LEDGER_MISSING"],
    ["IMPACT_LEDGER_NOT_READY", "IMPACT_LEDGER_NOT_READY"],
    ["EXECUTION_SEQUENCE_MISMATCH", "EXECUTION_SEQUENCE_MISMATCH_DETECTED"],
    ["STATE_TRANSITION_MISMATCH", "STATE_TRANSITION_MISMATCH_DETECTED"],
    ["DECISION_ORDER_MISMATCH", "DECISION_ORDER_MISMATCH_DETECTED"],
    ["SCHEDULING_MISMATCH", "SCHEDULING_MISMATCH_DETECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_DETECTED"],
    ["REPLAY_LINEAGE_MISMATCH", "REPLAY_LINEAGE_MISMATCH_DETECTED"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_MISMATCH_DETECTED"],
    ["CONSTITUTIONAL_MISMATCH", "CONSTITUTIONAL_MISMATCH_DETECTED"],
    ["AUTHORITY_BOUNDARY_MISMATCH", "AUTHORITY_BOUNDARY_MISMATCH_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILURE_DETECTED"],
    ["MISSION_OUTCOME_MISMATCH", "MISSION_OUTCOME_MISMATCH_DETECTED"],
    ["OPERATOR_VISIBILITY_FAILURE", "OPERATOR_VISIBILITY_FAILURE_DETECTED"],
    ["EXPLAINABILITY_LOSS", "EXPLAINABILITY_LOSS_DETECTED"],
    ["AUTOMATIC_APPROVAL_ATTEMPT", "AUTOMATIC_APPROVAL_ATTEMPTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [DeterministicOptimizationValidationScenario, DeterministicOptimizationValidationFailure][])("fails closed for %s", (scenario, failure) => {
    const impact = scenario === "MISSING_IMPACT_LEDGER" ? null : runOptimizationImpactAnalysis(scenario === "IMPACT_LEDGER_NOT_READY" ? { scenario: "REPLAY_RISK" } : {});
    const ledger = runDeterministicOptimizationValidation({ scenario, impact_ledger: impact });
    const validation = validateDeterministicOptimizationValidation(ledger, impact);

    expect(ledger.final_state).toBe("DETERMINISTIC_OPTIMIZATION_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.ready_for_recommendation_engine).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(ledger.execution_authority).toBe(false);
  });

  it("publishes observability without approval authority", () => {
    const surface = buildDeterministicOptimizationValidationObservabilitySurface();

    expect(surface.final_state).toBe("DETERMINISTIC_OPTIMIZATION_VALIDATED");
    expect(surface.validation_count).toBeGreaterThan(0);
    expect(surface.valid_count).toBeGreaterThan(0);
    expect(surface.failure_count).toBe(0);
    expect(surface.execution_authority).toBe(false);
    expect(surface.approval_authority).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
