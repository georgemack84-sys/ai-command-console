import { describe, expect, it } from "vitest";
import {
  OUTCOME_CAPTURE_CHECKS,
  computeOutcomeObservationHash,
  getActualResultCaptureContractFoundation,
  replayActualResultCaptureContract,
  runActualResultCaptureContract,
} from "@/services/actual-result-capture-contract";
import type { ActualResultCaptureContractInput, OutcomeCaptureFailure } from "@/types/actual-result-capture-contract";

describe("Mission Control Phase 10.1.1 Actual Result Capture Contract", () => {
  it("publishes the actual result capture foundation", () => {
    const foundation = getActualResultCaptureContractFoundation();

    expect(foundation.outcome_capture_contract_version).toBe("actual-result-capture-contract/v1");
    expect(foundation.checks).toEqual(OUTCOME_CAPTURE_CHECKS);
    expect(foundation.supported_versions.length).toBeGreaterThan(0);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("creates the canonical outcome observation record", () => {
    const result = runActualResultCaptureContract();

    expect(result.outcome_record.contract_version).toBe("actual-result-capture-contract/v1");
    expect(result.outcome_record.schema_version).toBe("outcome-observation/v1.0.0");
    expect(result.outcome_record.outcome_id).toBe("outcome_observation_001");
    expect(result.outcome_record.outcome_type).toBe("SUCCESSFUL");
  });

  it("creates deterministic outcome integrity hashes", () => {
    const result = runActualResultCaptureContract();

    expect(computeOutcomeObservationHash(result.outcome_record)).toBe(result.outcome_record.integrity_hash);
    expect(replayActualResultCaptureContract(result)).toBe(true);
  });

  it("validates schema, identity, evidence, and replay", () => {
    const result = runActualResultCaptureContract();

    expect(result.schema_validation.validation_result).toBe("PASS");
    expect(result.identity_validation.validation_result).toBe("PASS");
    expect(result.evidence_validation.validation_result).toBe("PASS");
    expect(result.replay_validation.validation_result).toBe("PASS");
    expect(result.validation.validation_status).toBe("VALID");
  });

  it("captures structured mission impact, risk, confidence, governance, operator, and rollback observations", () => {
    const result = runActualResultCaptureContract();

    expect(result.outcome_record.mission_impact.objectives_completed.length).toBeGreaterThan(0);
    expect(result.outcome_record.governance_result).toBe("APPROVED");
    expect(result.outcome_record.operator_action_result).toBe("ACCEPTED");
    expect(result.outcome_record.risk_actualization.avoided_risks.length).toBeGreaterThan(0);
    expect(result.outcome_record.confidence_actualization.accurate_confidence.length).toBeGreaterThan(0);
    expect(result.outcome_record.rollback_result).toBe("NOT_REQUIRED");
  });

  it("requires evidence, governance lineage, and replay references", () => {
    const result = runActualResultCaptureContract();

    expect(result.outcome_record.actual_outcome_evidence_refs.length).toBeGreaterThan(0);
    expect(result.outcome_record.governance_refs.length).toBeGreaterThan(0);
    expect(result.outcome_record.replay_refs.length).toBeGreaterThan(0);
    expect(result.validation.evidence_valid).toBe(true);
    expect(result.validation.governance_lineage_present).toBe(true);
    expect(result.validation.replay_valid).toBe(true);
  });

  it("keeps the contract structural-only with no analysis or inference permission", () => {
    const result = runActualResultCaptureContract();

    expect(result.structural_only).toBe(true);
    expect(result.permits_analysis).toBe(false);
    expect(result.permits_inference).toBe(false);
    expect(result.certification_report.analysis_logic_absent).toBe(true);
  });

  it("records validation before immutable observation ledger persistence", () => {
    const result = runActualResultCaptureContract();

    expect(result.observation_ledger).toHaveLength(1);
    expect(result.observation_ledger[0].append_only).toBe(true);
    expect(result.observation_ledger[0].deleted).toBe(false);
    expect(result.validation.validation_before_persistence).toBe(true);
  });

  it("keeps historical schema versions replay-compatible", () => {
    const result = runActualResultCaptureContract();

    expect(result.version_registry.some((version) => version.compatibility_level === "HISTORICAL_REPLAY_COMPATIBLE")).toBe(true);
    expect(result.validation.historical_replay_compatible).toBe(true);
    expect(result.certification_report.version_registry_operational).toBe(true);
  });

  it("certifies the outcome capture contract", () => {
    const result = runActualResultCaptureContract();

    expect(result.certification_report.certification_decision).toBe("PASS");
    expect(result.certification_report.canonical_schema_defined).toBe(true);
    expect(result.certification_report.integrity_hashing_deterministic).toBe(true);
    expect(result.certification_report.historical_replay_compatible).toBe(true);
  });

  it.each([
    ["ARCHITECTURE_NOT_CERTIFIED", "ARCHITECTURE_NOT_CERTIFIED"],
    ["MISSING_REQUIRED_FIELD", "REQUIRED_FIELD_MISSING"],
    ["DUPLICATE_OUTCOME_ID", "DUPLICATE_OUTCOME_ID_ACCEPTED"],
    ["UNSUPPORTED_SCHEMA_VERSION", "UNSUPPORTED_SCHEMA_VERSION_ACCEPTED"],
    ["UNSUPPORTED_CONTRACT_VERSION", "UNSUPPORTED_CONTRACT_VERSION_ACCEPTED"],
    ["INVALID_TIMESTAMP", "INVALID_TIMESTAMP_ACCEPTED"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE_ACCEPTED"],
    ["INVALID_EVIDENCE_REFERENCE", "INVALID_EVIDENCE_REFERENCE_ACCEPTED"],
    ["MISSING_REPLAY_REFS", "MISSING_REPLAY_REFERENCES_ACCEPTED"],
    ["MISSING_GOVERNANCE_REFS", "MISSING_GOVERNANCE_REFERENCES_ACCEPTED"],
    ["NONDETERMINISTIC_SERIALIZATION", "NONDETERMINISTIC_SERIALIZATION_DETECTED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH_DETECTED"],
    ["ORPHAN_OUTCOME", "ORPHAN_OUTCOME_ACCEPTED"],
    ["HISTORICAL_REPLAY_BROKEN", "HISTORICAL_REPLAY_BROKEN_BY_SCHEMA_CHANGE"],
    ["INFERRED_OUTCOME", "INFERRED_OUTCOME_ACCEPTED"],
    ["PREDICTIVE_OUTCOME", "PREDICTIVE_OUTCOME_ACCEPTED"],
    ["RECOMMENDATION_OUTCOME", "RECOMMENDATION_OUTCOME_ACCEPTED"],
    ["IDENTITY_MUTATION", "IDENTITY_MUTATION_ACCEPTED"],
    ["TIMESTAMP_MUTATION", "TIMESTAMP_MUTATION_ACCEPTED"],
    ["VALIDATION_AFTER_PERSISTENCE", "VALIDATION_AFTER_PERSISTENCE"],
    ["FAIL_OPEN", "FAIL_OPEN_OUTCOME_CAPTURE_BEHAVIOR"],
  ] as readonly [NonNullable<ActualResultCaptureContractInput["scenario"]>, OutcomeCaptureFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runActualResultCaptureContract({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.permits_analysis).toBe(false);
    expect(result.permits_inference).toBe(false);
  });

  it("maps missing evidence to INSUFFICIENT_EVIDENCE", () => {
    const result = runActualResultCaptureContract({ scenario: "MISSING_EVIDENCE" });

    expect(result.outcome_record.outcome_type).toBe("INSUFFICIENT_EVIDENCE");
    expect(result.validation.failures).toContain("MISSING_EVIDENCE_ACCEPTED");
  });

  it("fails closed when the role lacks outcome visibility", () => {
    const result = runActualResultCaptureContract({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects result tampering", () => {
    const result = runActualResultCaptureContract();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayActualResultCaptureContract(tampered)).toBe(false);
  });
});
