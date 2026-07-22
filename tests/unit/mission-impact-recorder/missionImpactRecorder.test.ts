import { describe, expect, it } from "vitest";
import {
  MISSION_IMPACT_CHECKS,
  MISSION_IMPACT_LIFECYCLE,
  MISSION_IMPACT_TYPES,
  computeMissionImpactRecordHash,
  getMissionImpactRecorderFoundation,
  replayMissionImpactRecorder,
  runMissionImpactRecorder,
} from "@/services/mission-impact-recorder";
import type { MissionImpactFailure, MissionImpactRecorderInput } from "@/types/mission-impact-recorder";

describe("Mission Control Phase 10.1.6 Mission Impact Recorder", () => {
  it("publishes the mission impact recorder foundation", () => {
    const foundation = getMissionImpactRecorderFoundation();

    expect(foundation.mission_impact_recorder_version).toBe("mission-impact-recorder/v1");
    expect(foundation.checks).toEqual(MISSION_IMPACT_CHECKS);
    expect(foundation.supported_classifications).toEqual(MISSION_IMPACT_TYPES);
    expect(foundation.lifecycle).toEqual(MISSION_IMPACT_LIFECYCLE);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("records observed mission impacts without analysis, attribution, or prediction", () => {
    const result = runMissionImpactRecorder();

    expect(result.observational_only).toBe(true);
    expect(result.permits_analysis).toBe(false);
    expect(result.permits_attribution).toBe(false);
    expect(result.permits_prediction).toBe(false);
    expect(result.analysis.causal_reasoning_absent).toBe(true);
    expect(result.analysis.predictive_content_absent).toBe(true);
  });

  it("creates deterministic impact record hashes and replay output", () => {
    const result = runMissionImpactRecorder();

    expect(computeMissionImpactRecordHash(result.impact_record)).toBe(result.impact_record.integrity_hash);
    expect(replayMissionImpactRecorder(result)).toBe(true);
  });

  it.each([
    ["OBJECTIVE_COMPLETED", "OBJECTIVE_COMPLETED"],
    ["OBJECTIVE_PARTIALLY_COMPLETED", "OBJECTIVE_PARTIALLY_COMPLETED"],
    ["OBJECTIVE_NOT_COMPLETED", "OBJECTIVE_NOT_COMPLETED"],
    ["MISSION_IMPROVED", "MISSION_IMPROVED"],
    ["MISSION_DEGRADED", "MISSION_DEGRADED"],
    ["SIDE_EFFECT_OBSERVED", "SIDE_EFFECT_OBSERVED"],
    ["UNEXPECTED_OUTCOME", "UNEXPECTED_OUTCOME"],
    ["NO_OBSERVABLE_CHANGE", "NO_OBSERVABLE_CHANGE"],
    ["INSUFFICIENT_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
  ] as const)("classifies %s deterministically", (scenario, impactType) => {
    const result = runMissionImpactRecorder({ scenario });

    expect(result.classification.impact_type).toBe(impactType);
    expect(result.impact_record.impact_type).toBe(impactType);
  });

  it("captures objectives achieved, objectives missed, side effects, degradation, improvements, and unexpected outcomes", () => {
    expect(runMissionImpactRecorder({ scenario: "OBJECTIVE_COMPLETED" }).impact_record.achieved_objectives.length).toBeGreaterThan(0);
    expect(runMissionImpactRecorder({ scenario: "OBJECTIVE_NOT_COMPLETED" }).impact_record.missed_objectives.length).toBeGreaterThan(0);
    expect(runMissionImpactRecorder({ scenario: "SIDE_EFFECT_OBSERVED" }).impact_record.observed_side_effects.length).toBeGreaterThan(0);
    expect(runMissionImpactRecorder({ scenario: "MISSION_DEGRADED" }).impact_record.mission_degradation.length).toBeGreaterThan(0);
    expect(runMissionImpactRecorder({ scenario: "MISSION_IMPROVED" }).impact_record.operational_improvements.length).toBeGreaterThan(0);
    expect(runMissionImpactRecorder({ scenario: "UNEXPECTED_OUTCOME" }).impact_record.unexpected_outcomes.length).toBeGreaterThan(0);
  });

  it("preserves evidence, governance, and replay lineage on impact records", () => {
    const result = runMissionImpactRecorder();

    expect(result.impact_record.supporting_evidence_refs.length).toBeGreaterThan(0);
    expect(result.impact_record.governance_refs.length).toBeGreaterThan(0);
    expect(result.impact_record.replay_refs.length).toBeGreaterThan(0);
  });

  it("records immutable append-only impact ledger entries", () => {
    const result = runMissionImpactRecorder();

    expect(result.impact_ledger).toHaveLength(1);
    expect(result.impact_ledger[0].append_only).toBe(true);
    expect(result.impact_ledger[0].deleted).toBe(false);
    expect(result.impact_ledger[0].lifecycle_state).toBe("REPLAYABLE");
  });

  it("generates deterministic replay reports", () => {
    const result = runMissionImpactRecorder();

    expect(result.replay_report.impact_record_hash).toBe(result.impact_record.integrity_hash);
    expect(result.replay_report.analysis_hash).toBe(result.analysis.integrity_hash);
    expect(result.replay_report.classification_hash).toBe(result.classification.integrity_hash);
    expect(result.replay_report.replay_reconstruction_identical).toBe(true);
  });

  it("keeps observability metrics advisory-only", () => {
    const result = runMissionImpactRecorder();

    expect(result.metrics.mission_impacts_recorded).toBe(1);
    expect(result.metrics.impact_classifications_by_type).toEqual([result.impact_record.impact_type]);
    expect(result.metrics.replay_reconstruction_success_rate).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it.each([
    ["INFERRED_IMPACT", "INFERRED_MISSION_IMPACT_ACCEPTED"],
    ["UNSUPPORTED_CLASSIFICATION", "UNSUPPORTED_IMPACT_CLASSIFICATION_ACCEPTED"],
    ["MISSING_EVIDENCE", "EVIDENCE_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MODIFIED_AFTER_RECORDING", "IMPACT_RECORD_MODIFIED_AFTER_RECORDING"],
    ["DIVERGENT_IMPACT", "IDENTICAL_EVIDENCE_PRODUCED_DIFFERENT_IMPACT"],
    ["NONDETERMINISTIC_CLASSIFICATION", "NONDETERMINISTIC_CLASSIFICATION_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VALIDATION_FAILED"],
    ["ORPHAN_IMPACT", "ORPHAN_MISSION_IMPACT_ACCEPTED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_CONSTRAINTS_BYPASSED"],
    ["PREDICTIVE_BEHAVIOR", "PREDICTIVE_MISSION_BEHAVIOR_ACCEPTED"],
    ["CAUSAL_ATTRIBUTION", "CAUSAL_ATTRIBUTION_ACCEPTED"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION_REJECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_MISSION_IMPACT_BEHAVIOR"],
  ] as readonly [NonNullable<MissionImpactRecorderInput["scenario"]>, MissionImpactFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runMissionImpactRecorder({ scenario });

    expect(result.validation.validation_status).not.toBe("VALID");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.observational_only).toBe(true);
  });

  it("maps insufficient evidence to the insufficient-evidence validation state", () => {
    const result = runMissionImpactRecorder({ scenario: "INSUFFICIENT_EVIDENCE" });

    expect(result.validation.validation_status).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.validation.failures).toContain("COMPLETENESS_VALIDATION_NOT_PASSED");
  });

  it("fails closed when the role lacks impact recorder visibility", () => {
    const result = runMissionImpactRecorder({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects mission impact recorder tampering during replay", () => {
    const result = runMissionImpactRecorder();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayMissionImpactRecorder(tampered)).toBe(false);
  });
});
