import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_REPLAY_CHECKS,
  ADAPTIVE_REPLAY_TYPES,
  computeAdaptiveReplayHash,
  getAdaptiveReplayTraceabilityFoundation,
  replayAdaptiveReplayTraceabilityContract,
  runAdaptiveReplayTraceabilityContract,
} from "@/services/adaptive-replay-traceability-contract";
import type { AdaptiveReplayFailure, AdaptiveReplayTraceabilityInput } from "@/types/adaptive-replay-traceability-contract";

describe("Mission Control Phase 10.0.6 Replay & Traceability Contract", () => {
  it("publishes the adaptive replay traceability foundation", () => {
    const foundation = getAdaptiveReplayTraceabilityFoundation();

    expect(foundation.replay_contract_version).toBe("adaptive-replay-traceability-contract/v1");
    expect(foundation.checks).toEqual(ADAPTIVE_REPLAY_CHECKS);
    expect(foundation.replay_types).toEqual(ADAPTIVE_REPLAY_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("creates an integrity-protected replay record", () => {
    const result = runAdaptiveReplayTraceabilityContract();

    expect(computeAdaptiveReplayHash(result.replay_record)).toBe(result.replay_record.integrity_hash);
    expect(result.replay_record.replay_id).toBe("adaptive_replay_traceability_001");
    expect(result.replay_record.replay_type).toBe("FULL_LIFECYCLE_REPLAY");
    expect(result.replay_record.deterministic_verified).toBe(true);
  });

  it("captures complete input, processing, and output lineage", () => {
    const result = runAdaptiveReplayTraceabilityContract();

    expect(result.lineage_contract.input_lineage.length).toBeGreaterThan(0);
    expect(result.lineage_contract.processing_lineage.length).toBeGreaterThan(0);
    expect(result.lineage_contract.output_lineage.length).toBeGreaterThan(0);
    expect(result.lineage_contract.every_output_has_input).toBe(true);
    expect(result.lineage_contract.reasoning_path_complete).toBe(true);
  });

  it("verifies deterministic replay reconstruction", () => {
    const result = runAdaptiveReplayTraceabilityContract();

    expect(result.verification.verification_result).toBe("PASS");
    expect(result.certification_report.certification_decision).toBe("PASS");
    expect(result.validation.deterministic_reconstruction).toBe(true);
    expect(result.traceability_complete).toBe(true);
  });

  it("records immutable traceability ledger entries", () => {
    const result = runAdaptiveReplayTraceabilityContract();

    expect(result.traceability_ledger.map((entry) => entry.sequence_number)).toEqual([1]);
    expect(result.traceability_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
    expect(result.certification_report.audit_ready).toBe(true);
  });

  it("remains replayable, advisory-only, and non-mutating", () => {
    const result = runAdaptiveReplayTraceabilityContract();

    expect(replayAdaptiveReplayTraceabilityContract(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.permits_execution).toBe(false);
    expect(result.mutates_history).toBe(false);
  });

  it.each([
    ["AUTHORITY_INVALID", "AUTHORITY_BINDING_INVALID"],
    ["MISSING_REPLAY_ID", "REPLAY_IDENTIFIER_MISSING"],
    ["MISSING_INPUT_LINEAGE", "INPUT_LINEAGE_INCOMPLETE"],
    ["MISSING_OUTPUT_LINEAGE", "OUTPUT_LINEAGE_INCOMPLETE"],
    ["MISSING_PROCESSING_LINEAGE", "PROCESSING_LINEAGE_INCOMPLETE"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_OPERATOR", "OPERATOR_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REFERENCES_MISSING"],
    ["MISSING_REPLAY_STEPS", "REPLAY_STEPS_MISSING"],
    ["DETERMINISM_MISMATCH", "DETERMINISTIC_RECONSTRUCTION_DIFFERED"],
    ["REPLAY_RESULT_MISMATCH", "REPLAY_RESULT_MISMATCH"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["HIDDEN_PROCESSING", "HIDDEN_ADAPTIVE_PROCESSING"],
    ["UNDOCUMENTED_REASONING", "UNDOCUMENTED_REASONING"],
    ["REPLAY_BYPASS", "REPLAY_BYPASS"],
    ["EVIDENCE_SUBSTITUTION", "EVIDENCE_SUBSTITUTION"],
    ["SIMULATION_OMISSION", "SIMULATION_OMISSION"],
    ["GOVERNANCE_OMISSION", "GOVERNANCE_OMISSION"],
    ["OPERATOR_OMISSION", "OPERATOR_OMISSION"],
    ["CERTIFICATION_OMISSION", "CERTIFICATION_OMISSION"],
    ["HISTORICAL_MUTATION", "HISTORICAL_RECORD_MUTATION"],
    ["FAIL_OPEN", "FAIL_OPEN_REPLAY_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<AdaptiveReplayTraceabilityInput["scenario"]>, AdaptiveReplayFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptiveReplayTraceabilityContract({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.traceability_complete).toBe(false);
    expect(result.permits_execution).toBe(false);
  });

  it("fails closed when the role lacks replay traceability visibility", () => {
    const result = runAdaptiveReplayTraceabilityContract({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay traceability tampering", () => {
    const result = runAdaptiveReplayTraceabilityContract();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptiveReplayTraceabilityContract(tampered)).toBe(false);
  });
});
