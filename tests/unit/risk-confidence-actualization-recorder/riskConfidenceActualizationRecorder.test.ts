import { describe, expect, it } from "vitest";
import {
  ACTUALIZATION_CHECKS,
  ACTUALIZATION_LIFECYCLE,
  computeActualizationRecordHash,
  getRiskConfidenceActualizationRecorderFoundation,
  replayRiskConfidenceActualizationRecorder,
  runRiskConfidenceActualizationRecorder,
} from "@/services/risk-confidence-actualization-recorder";
import type { ActualizationFailure, RiskConfidenceActualizationRecorderInput } from "@/types/risk-confidence-actualization-recorder";

describe("Mission Control Phase 10.1.7 Risk & Confidence Actualization Recorder", () => {
  it("publishes the actualization recorder foundation", () => {
    const foundation = getRiskConfidenceActualizationRecorderFoundation();

    expect(foundation.actualization_recorder_version).toBe("risk-confidence-actualization-recorder/v1");
    expect(foundation.checks).toEqual(ACTUALIZATION_CHECKS);
    expect(foundation.lifecycle).toEqual(ACTUALIZATION_LIFECYCLE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("records actualization without recalibrating risk, confidence, or historical predictions", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(result.observational_only).toBe(true);
    expect(result.recalibrates_risk).toBe(false);
    expect(result.recalibrates_confidence).toBe(false);
    expect(result.changes_historical_predictions).toBe(false);
    expect(result.classification.recalibration_absent).toBe(true);
  });

  it("creates deterministic actualization record hashes and replay output", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(computeActualizationRecordHash(result.actualization_record)).toBe(result.actualization_record.integrity_hash);
    expect(replayRiskConfidenceActualizationRecorder(result)).toBe(true);
  });

  it.each([
    ["RISK_MATERIALIZED", "MATERIALIZED"],
    ["RISK_AVOIDED", "AVOIDED"],
    ["RISK_UNDERESTIMATED", "UNDERESTIMATED"],
    ["RISK_OVERESTIMATED", "OVERESTIMATED"],
    ["UNKNOWN", "UNKNOWN"],
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
  ] as const)("records %s risk actualization", (scenario, state) => {
    const result = runRiskConfidenceActualizationRecorder({ scenario });

    expect(result.classification.risk_actualization).toBe(state);
    expect(result.actualization_record.risk_actualization).toBe(state);
  });

  it.each([
    ["CONFIDENCE_ACCURATE", "ACCURATE"],
    ["CONFIDENCE_OPTIMISTIC", "OPTIMISTIC"],
    ["CONFIDENCE_PESSIMISTIC", "PESSIMISTIC"],
    ["CONFIDENCE_INVALID", "INVALID"],
    ["UNKNOWN", "UNKNOWN"],
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
  ] as const)("records %s confidence actualization", (scenario, state) => {
    const result = runRiskConfidenceActualizationRecorder({ scenario });

    expect(result.classification.confidence_actualization).toBe(state);
    expect(result.actualization_record.confidence_actualization).toBe(state);
  });

  it.each([
    ["FORECAST_CORRECT", "CORRECT"],
    ["FORECAST_PARTIAL", "PARTIALLY_CORRECT"],
    ["FORECAST_INCORRECT", "INCORRECT"],
    ["UNKNOWN", "UNKNOWN"],
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
  ] as const)("records %s forecast actualization", (scenario, state) => {
    const result = runRiskConfidenceActualizationRecorder({ scenario });

    expect(result.classification.forecast_actualization).toBe(state);
    expect(result.actualization_record.forecast_actualization).toBe(state);
  });

  it("links original prediction refs to observed outcome refs", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(result.prediction_linkage.original_risk_refs.length).toBeGreaterThan(0);
    expect(result.prediction_linkage.original_confidence_refs.length).toBeGreaterThan(0);
    expect(result.prediction_linkage.original_forecast_refs.length).toBeGreaterThan(0);
    expect(result.prediction_linkage.observed_outcome_refs.length).toBeGreaterThan(0);
  });

  it("preserves evidence, governance, and replay lineage", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(result.actualization_record.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.actualization_record.governance_refs.length).toBeGreaterThan(0);
    expect(result.actualization_record.replay_refs.length).toBeGreaterThan(0);
  });

  it("records append-only actualization ledger entries", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(result.actualization_ledger).toHaveLength(1);
    expect(result.actualization_ledger[0].append_only).toBe(true);
    expect(result.actualization_ledger[0].deleted).toBe(false);
    expect(result.actualization_ledger[0].lifecycle_state).toBe("REPLAYABLE");
  });

  it("publishes advisory-only metrics", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(result.metrics.actualizations_recorded).toBe(1);
    expect(result.metrics.prediction_linkage_success_rate).toBe(1);
    expect(result.metrics.replay_reconstruction_success_rate).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("generates deterministic replay reports", () => {
    const result = runRiskConfidenceActualizationRecorder();

    expect(result.replay_report.linkage_hash).toBe(result.prediction_linkage.integrity_hash);
    expect(result.replay_report.classification_hash).toBe(result.classification.integrity_hash);
    expect(result.replay_report.record_hash).toBe(result.actualization_record.integrity_hash);
    expect(result.replay_report.replay_reconstruction_identical).toBe(true);
  });

  it.each([
    ["MISSING_PREDICTION", "PREDICTION_CANNOT_BE_LINKED"],
    ["MISSING_RISK_REF", "RISK_REFERENCE_MISSING"],
    ["MISSING_CONFIDENCE_REF", "CONFIDENCE_REFERENCE_MISSING"],
    ["MISSING_FORECAST_REF", "FORECAST_REFERENCE_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["INFERRED_COMPARISON", "INFERRED_COMPARISON_ACCEPTED"],
    ["PREDICTION_MODIFIED", "ORIGINAL_PREDICTION_MODIFIED"],
    ["HISTORICAL_CHANGE", "HISTORICAL_PREDICTION_CHANGED"],
    ["DUPLICATE_ACTUALIZATION", "DUPLICATE_ACTUALIZATION_CREATED"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERS"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["NONDETERMINISTIC_CLASSIFICATION", "NONDETERMINISTIC_CLASSIFICATION_DETECTED"],
    ["RECALIBRATION_ATTEMPTED", "RECALIBRATION_ATTEMPTED"],
    ["FAIL_OPEN", "FAIL_OPEN_ACTUALIZATION_BEHAVIOR"],
  ] as readonly [NonNullable<RiskConfidenceActualizationRecorderInput["scenario"]>, ActualizationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runRiskConfidenceActualizationRecorder({ scenario });

    expect(result.validation.validation_status).not.toBe("VALID");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.recalibrates_risk).toBe(false);
    expect(result.changes_historical_predictions).toBe(false);
  });

  it("maps insufficient evidence to the insufficient-evidence validation state", () => {
    const result = runRiskConfidenceActualizationRecorder({ scenario: "INSUFFICIENT_EVIDENCE" });

    expect(result.validation.validation_status).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.actualization_record.risk_actualization).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("fails closed when the role lacks actualization visibility", () => {
    const result = runRiskConfidenceActualizationRecorder({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects actualization recorder tampering during replay", () => {
    const result = runRiskConfidenceActualizationRecorder();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayRiskConfidenceActualizationRecorder(tampered)).toBe(false);
  });
});
