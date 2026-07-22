import { describe, expect, it } from "vitest";
import {
  OUTCOME_INTAKE_CHECKS,
  OUTCOME_INTAKE_SOURCE_TYPES,
  computeOutcomeIntakeHash,
  getDecisionOutcomeIntakeAdapterFoundation,
  replayDecisionOutcomeIntakeAdapter,
  runDecisionOutcomeIntakeAdapter,
} from "@/services/decision-outcome-intake-adapter";
import type { DecisionOutcomeIntakeAdapterInput, OutcomeIntakeFailure, OutcomeIntakeSourceType } from "@/types/decision-outcome-intake-adapter";

describe("Mission Control Phase 10.1.2 Decision Outcome Intake Adapter", () => {
  it("publishes the decision outcome intake adapter foundation", () => {
    const foundation = getDecisionOutcomeIntakeAdapterFoundation();

    expect(foundation.intake_adapter_version).toBe("decision-outcome-intake-adapter/v1");
    expect(foundation.checks).toEqual(OUTCOME_INTAKE_CHECKS);
    expect(foundation.supported_sources).toEqual(OUTCOME_INTAKE_SOURCE_TYPES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it.each(OUTCOME_INTAKE_SOURCE_TYPES)("normalizes %s payloads deterministically", (source_type: OutcomeIntakeSourceType) => {
    const result = runDecisionOutcomeIntakeAdapter({ source_type });

    expect(result.intake_record.source_type).toBe(source_type);
    expect(result.normalization.validation_result).toBe("PASS");
    expect(result.mapping.validation_result).toBe("PASS");
    expect(result.validation.validation_status).toBe("VALID");
  });

  it("creates an integrity-protected intake record", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(computeOutcomeIntakeHash(result.intake_record)).toBe(result.intake_record.integrity_hash);
    expect(result.intake_record.intake_id).toBe("outcome_intake_001");
    expect(result.intake_record.payload_version).toBe("outcome-intake/v1");
  });

  it("maps normalized intake into the canonical outcome observation record", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(result.mapping.canonical_outcome.outcome_id).toBe(result.capture_contract.outcome_record.outcome_id);
    expect(result.mapping.mandatory_contract_fields_populated).toBe(true);
    expect(result.mapping.evidence_refs_resolved).toBe(true);
    expect(result.mapping.governance_refs_resolved).toBe(true);
    expect(result.mapping.replay_refs_resolved).toBe(true);
  });

  it("preserves evidence, governance, replay, and tenant lineage", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(result.normalization.evidence_preserved).toBe(true);
    expect(result.normalization.replay_preserved).toBe(true);
    expect(result.validation.evidence_valid).toBe(true);
    expect(result.validation.governance_valid).toBe(true);
    expect(result.validation.replay_valid).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
  });

  it("routes accepted payloads to the outcome observation engine", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(result.routing.route).toBe("OUTCOME_OBSERVATION_ENGINE");
    expect(result.routing.routed_to_observation_engine).toBe(true);
    expect(result.certification_report.certification_decision).toBe("PASS");
  });

  it("handles identical duplicates deterministically", () => {
    const result = runDecisionOutcomeIntakeAdapter({ scenario: "IDENTICAL_DUPLICATE" });

    expect(result.duplicate_detection.duplicate_detected).toBe(true);
    expect(result.duplicate_detection.deterministic_action).toBe("IGNORE_DUPLICATE");
    expect(result.validation.validation_status).toBe("DUPLICATE");
    expect(result.routing.route).toBe("DUPLICATE_LEDGER");
  });

  it("rejects conflicting duplicates", () => {
    const result = runDecisionOutcomeIntakeAdapter({ scenario: "CONFLICTING_DUPLICATE" });

    expect(result.duplicate_detection.conflicting_payload).toBe(true);
    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("CONFLICTING_PAYLOADS_MERGED");
    expect(result.routing.route).toBe("VALIDATION_REPORT");
  });

  it("records intake audit and advisory-only metrics", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(result.audit_log).toHaveLength(1);
    expect(result.audit_log[0].append_only).toBe(true);
    expect(result.metrics.total_payloads_received).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("keeps the adapter structural-only without analysis or learning", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(result.structural_only).toBe(true);
    expect(result.permits_analysis).toBe(false);
    expect(result.permits_learning).toBe(false);
    expect(result.certification_report.analysis_logic_absent).toBe(true);
  });

  it("replays normalized payloads deterministically", () => {
    const result = runDecisionOutcomeIntakeAdapter();

    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(replayDecisionOutcomeIntakeAdapter(result)).toBe(true);
  });

  it.each([
    ["UNSUPPORTED_SOURCE", "UNSUPPORTED_SOURCE_ACCEPTED"],
    ["INVALID_PAYLOAD", "INVALID_PAYLOAD_ACCEPTED"],
    ["MALFORMED_SCHEMA", "MALFORMED_SCHEMA_ACCEPTED"],
    ["UNAUTHORIZED_SOURCE", "UNAUTHORIZED_SOURCE_ACCEPTED"],
    ["NONDETERMINISTIC_DUPLICATE", "DUPLICATE_HANDLING_NONDETERMINISTIC"],
    ["EVIDENCE_ALTERED", "EVIDENCE_REFERENCES_ALTERED"],
    ["GOVERNANCE_LOST", "GOVERNANCE_METADATA_LOST"],
    ["REPLAY_REMOVED", "REPLAY_REFERENCES_REMOVED"],
    ["TIMESTAMP_MODIFIED", "TIMESTAMP_MODIFIED_INCORRECTLY"],
    ["NORMALIZATION_INCONSISTENT", "NORMALIZATION_INCONSISTENT"],
    ["TENANT_VIOLATION", "TENANT_BOUNDARY_VIOLATED"],
    ["INTEGRITY_BYPASS", "INTEGRITY_VERIFICATION_BYPASSED"],
    ["MISSING_REQUIRED_FIELD", "MISSING_REQUIRED_FIELD"],
    ["INVALID_IDENTIFIER", "INVALID_IDENTIFIER"],
    ["INVALID_TIMESTAMP", "INVALID_TIMESTAMP"],
    ["UNSUPPORTED_SCHEMA_VERSION", "UNSUPPORTED_SCHEMA_VERSION"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE"],
    ["MISSING_REPLAY_REFS", "MISSING_REPLAY_REFERENCES"],
    ["MISSING_GOVERNANCE_REFS", "MISSING_GOVERNANCE_REFERENCES"],
    ["REPLAY_RECONSTRUCTION_FAILED", "REPLAY_RECONSTRUCTION_FAILED"],
    ["ANALYSIS_ATTEMPTED", "ANALYSIS_ATTEMPTED"],
    ["FAIL_OPEN", "FAIL_OPEN_INTAKE_BEHAVIOR"],
  ] as readonly [NonNullable<DecisionOutcomeIntakeAdapterInput["scenario"]>, OutcomeIntakeFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runDecisionOutcomeIntakeAdapter({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.permits_analysis).toBe(false);
    expect(result.permits_learning).toBe(false);
  });

  it("routes unauthorized payloads to governance alert", () => {
    const result = runDecisionOutcomeIntakeAdapter({ scenario: "UNAUTHORIZED_SOURCE" });

    expect(result.routing.route).toBe("GOVERNANCE_ALERT");
    expect(result.routing.routed_to_governance_alert).toBe(true);
    expect(result.metrics.unauthorized_source_attempts).toBe(1);
  });

  it("fails closed when the role lacks intake visibility", () => {
    const result = runDecisionOutcomeIntakeAdapter({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects intake adapter tampering", () => {
    const result = runDecisionOutcomeIntakeAdapter();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayDecisionOutcomeIntakeAdapter(tampered)).toBe(false);
  });
});
