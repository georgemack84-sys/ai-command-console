import { describe, expect, it } from "vitest";
import {
  OUTCOME_OBSERVATION_CHECKS,
  OUTCOME_OBSERVATION_LIFECYCLE,
  computeOutcomeObservationEngineHash,
  getOutcomeObservationEngineFoundation,
  replayOutcomeObservationEngine,
  runOutcomeObservationEngine,
} from "@/services/outcome-observation-engine";
import type { OutcomeObservationEngineInput, OutcomeObservationFailure } from "@/types/outcome-observation-engine";

describe("Mission Control Phase 10.1.3 Outcome Observation Engine", () => {
  it("publishes the outcome observation engine foundation", () => {
    const foundation = getOutcomeObservationEngineFoundation();

    expect(foundation.observation_engine_version).toBe("outcome-observation-engine/v1");
    expect(foundation.checks).toEqual(OUTCOME_OBSERVATION_CHECKS);
    expect(foundation.lifecycle).toEqual(OUTCOME_OBSERVATION_LIFECYCLE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("builds a canonical evidence-backed observation", () => {
    const result = runOutcomeObservationEngine();

    expect(result.builder.validation_result).toBe("PASS");
    expect(result.builder.outcome_identity_assembled).toBe(true);
    expect(result.builder.evidence_refs_assembled).toBe(true);
    expect(result.builder.governance_refs_assembled).toBe(true);
    expect(result.builder.replay_metadata_assembled).toBe(true);
  });

  it("creates deterministic observation integrity hashes", () => {
    const result = runOutcomeObservationEngine();

    expect(computeOutcomeObservationEngineHash(result.observation_record)).toBe(result.observation_record.integrity_hash);
    expect(replayOutcomeObservationEngine(result)).toBe(true);
  });

  it.each([
    ["BASELINE", "SUCCESSFUL"],
    ["PARTIAL_SUCCESS", "PARTIALLY_SUCCESSFUL"],
    ["FAILED_OUTCOME", "FAILED"],
    ["OVERRIDE", "OVERRIDDEN"],
    ["ESCALATION", "ESCALATED"],
    ["ROLLBACK", "ROLLBACK_REQUIRED"],
    ["UNKNOWN", "UNKNOWN"],
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
  ] as const)("resolves %s classification deterministically", (scenario, outcomeType) => {
    const result = runOutcomeObservationEngine({ scenario });

    expect(result.observation_record.outcome_type).toBe(outcomeType);
    expect(result.resolver.outcome_type).toBe(outcomeType);
  });

  it("captures observed results, operator decisions, governance effects, execution status, mission changes, and impacts", () => {
    const result = runOutcomeObservationEngine();

    expect(result.audit_report.observed_results_captured).toBe(true);
    expect(result.audit_report.operator_decisions_captured).toBe(true);
    expect(result.audit_report.governance_effects_captured).toBe(true);
    expect(result.audit_report.execution_status_captured).toBe(true);
    expect(result.audit_report.mission_changes_captured).toBe(true);
    expect(result.audit_report.actual_impacts_captured).toBe(true);
  });

  it("generates complete replay metadata", () => {
    const result = runOutcomeObservationEngine();

    expect(result.replay_metadata.decision_refs.length).toBeGreaterThan(0);
    expect(result.replay_metadata.evidence_refs.length).toBeGreaterThan(0);
    expect(result.replay_metadata.governance_refs.length).toBeGreaterThan(0);
    expect(result.replay_metadata.operator_refs.length).toBeGreaterThan(0);
    expect(result.replay_metadata.intake_refs.length).toBeGreaterThan(0);
    expect(result.replay_metadata.observation_sequence).toEqual(OUTCOME_OBSERVATION_LIFECYCLE);
  });

  it("records immutable observation ledger entries", () => {
    const result = runOutcomeObservationEngine();

    expect(result.observation_ledger).toHaveLength(1);
    expect(result.observation_ledger[0].append_only).toBe(true);
    expect(result.observation_ledger[0].deleted).toBe(false);
    expect(result.observation_ledger[0].lifecycle_state).toBe("REPLAYABLE");
  });

  it("keeps the engine observational-only without analysis, prediction, or recommendation", () => {
    const result = runOutcomeObservationEngine();

    expect(result.observational_only).toBe(true);
    expect(result.permits_analysis).toBe(false);
    expect(result.permits_prediction).toBe(false);
    expect(result.permits_recommendation).toBe(false);
    expect(result.audit_report.analysis_logic_absent).toBe(true);
  });

  it("reports advisory-only metrics", () => {
    const result = runOutcomeObservationEngine();

    expect(result.metrics.observations_created).toBe(1);
    expect(result.metrics.observations_rejected).toBe(0);
    expect(result.metrics.replay_success_rate).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it.each([
    ["INVALID_INTAKE", "INTAKE_NOT_VALIDATED"],
    ["DIVERGENT_OBSERVATION", "IDENTICAL_EVIDENCE_PRODUCED_DIVERGENT_OBSERVATION"],
    ["INFERRED_OUTCOME", "INFERRED_OUTCOME_ACCEPTED"],
    ["PREDICTIVE_INFORMATION", "PREDICTIVE_INFORMATION_ACCEPTED"],
    ["UNSUPPORTED_CLASSIFICATION", "UNSUPPORTED_OUTCOME_CLASSIFICATION_ACCEPTED"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["DUPLICATE_OBSERVATION", "DUPLICATE_OBSERVATION_GENERATED"],
    ["NONDETERMINISTIC_SERIALIZATION", "NONDETERMINISTIC_SERIALIZATION_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH_DETECTED"],
    ["MUTATED_AFTER_RECORDING", "OBSERVATION_MUTATED_AFTER_RECORDING"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_CONSTRAINTS_BYPASSED"],
    ["MISSING_REQUIRED_FIELD", "REQUIRED_FIELD_MISSING"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION_REJECTED"],
    ["ANALYSIS_ATTEMPTED", "ANALYSIS_ATTEMPTED"],
    ["FAIL_OPEN", "FAIL_OPEN_OBSERVATION_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeObservationEngineInput["scenario"]>, OutcomeObservationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeObservationEngine({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.metrics.observations_rejected).toBe(1);
    expect(result.permits_analysis).toBe(false);
  });

  it("fails closed when the role lacks observation visibility", () => {
    const result = runOutcomeObservationEngine({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects observation engine tampering", () => {
    const result = runOutcomeObservationEngine();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeObservationEngine(tampered)).toBe(false);
  });
});
