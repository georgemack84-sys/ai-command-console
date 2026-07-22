import { describe, expect, it } from "vitest";
import {
  appendOperatorFeedbackLedger,
  getOperatorFeedbackLedgerFoundation,
  replayOperatorFeedbackLedger,
} from "@/services/operator-feedback-ledger";
import type { OperatorFeedbackLedgerFailure, OperatorFeedbackLedgerScenario } from "@/types/operator-feedback-ledger";

describe("Mission Control Phase 10.9.7 Operator Feedback Ledger", () => {
  it("publishes the authoritative feedback ledger contract", () => {
    const foundation = getOperatorFeedbackLedgerFoundation();

    expect(foundation.operator_feedback_ledger_version).toBe("operator-feedback-ledger/v1");
    expect(foundation.api_surface.append_record).toBe("POST /operator-feedback-ledger/append");
    expect(foundation.api_surface.update_supported).toBe(false);
    expect(foundation.api_surface.delete_supported).toBe(false);
    expect(foundation.result.authoritative_system_of_record).toBe(true);
    expect(foundation.result.history_only).toBe(true);
  });

  it("appends ledger records deterministically", () => {
    const first = appendOperatorFeedbackLedger({ scenario: "BASELINE" });
    const second = appendOperatorFeedbackLedger({ scenario: "BASELINE" });

    expect(first.records[0]?.ledger_record_id).toBe(second.records[0]?.ledger_record_id);
    expect(first.records[0]?.record_hash).toBe(second.records[0]?.record_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("records the complete feedback lifecycle", () => {
    const result = appendOperatorFeedbackLedger({ scenario: "BASELINE" });
    const record = result.records[0];

    expect(record?.feedback_id).toBeTruthy();
    expect(record?.operator_id).toBeTruthy();
    expect(record?.tenant_id).toBeTruthy();
    expect(record?.mission_id).toBeTruthy();
    expect(record?.decision_id).toBeTruthy();
    expect(record?.decision_package_id).toBeTruthy();
    expect(record?.original_feedback).toBeTruthy();
    expect(record?.normalized_feedback).toBeTruthy();
    expect(record?.governance_metadata_hash).toBeTruthy();
    expect(record?.replay_id).toBeTruthy();
  });

  it.each([
    ["APPROVAL", "approval_history"],
    ["OVERRIDE", "override_history"],
    ["REJECTION", "rejection_history"],
  ] as const)("maintains %s history registry", (scenario, key) => {
    const result = appendOperatorFeedbackLedger({ scenario });

    expect(result[key]).toHaveLength(1);
    expect(result[key][0]?.immutable).toBe(true);
    expect(result[key][0]?.replay_refs.length).toBeGreaterThan(0);
  });

  it("maintains evidence, adaptation, simulation, replay, and certification lineage", () => {
    const result = appendOperatorFeedbackLedger({ scenario: "SIMULATION_USAGE" });

    expect(result.evidence_history.provenance_complete).toBe(true);
    expect(result.adaptation_usage.advisory_only).toBe(true);
    expect(result.simulation_usage.validation_outcome).toBe("VALIDATED");
    expect(result.replay_ledger.byte_identical).toBe(true);
    expect(result.certification_lineage.replayable).toBe(true);
    expect(result.certification_lineage.evidence_package.length).toBeGreaterThan(0);
  });

  it("verifies ledger integrity and tenant ownership", () => {
    const result = appendOperatorFeedbackLedger({ scenario: "BASELINE" });

    expect(result.integrity_report.record_hashes_verified).toBe(true);
    expect(result.integrity_report.chain_integrity_verified).toBe(true);
    expect(result.integrity_report.immutable_identifiers_verified).toBe(true);
    expect(result.integrity_report.replay_references_verified).toBe(true);
    expect(result.integrity_report.schema_versions_verified).toBe(true);
    expect(result.integrity_report.ledger_ordering_verified).toBe(true);
    expect(result.integrity_report.tenant_ownership_verified).toBe(true);
    expect(result.ledger_state).toBe("CERTIFIED");
  });

  it("keeps the ledger history-only and non-mutating", () => {
    const result = appendOperatorFeedbackLedger({ scenario: "ADAPTATION_USAGE" });

    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.generates_adaptive_proposals).toBe(false);
    expect(result.executes_governance_actions).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
  });

  it.each([
    ["INVALID_HASH", "INTEGRITY_HASH_INVALID"],
    ["DUPLICATE_IDENTIFIER", "IMMUTABLE_IDENTIFIER_DUPLICATED"],
    ["TENANT_MISMATCH", "TENANT_MISMATCH"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["INVALID_SCHEMA_VERSION", "SCHEMA_VERSION_INVALID"],
    ["MISSING_GOVERNANCE_METADATA", "GOVERNANCE_METADATA_INCOMPLETE"],
    ["ORDERING_VIOLATION", "ORDERING_VIOLATION_DETECTED"],
    ["MISSING_RECORD", "MISSING_RECORD"],
    ["LEDGER_CORRUPTION", "LEDGER_CORRUPTION_DETECTED"],
    ["CROSS_TENANT_CONTAMINATION", "CROSS_TENANT_CONTAMINATION"],
    ["CORRELATION_REJECTED", "CORRELATION_REJECTED"],
    ["HISTORICAL_RECORD_MODIFICATION", "HISTORICAL_RECORD_MODIFICATION"],
    ["PRODUCTION_MUTATION_ATTEMPT", "PRODUCTION_MUTATION_ATTEMPT"],
    ["ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT", "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT"],
  ] as readonly [OperatorFeedbackLedgerScenario, OperatorFeedbackLedgerFailure][])("rejects %s", (scenario, failure) => {
    const result = appendOperatorFeedbackLedger({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.ledger_state).toBe("FAIL_CLOSED");
    expect(result.integrity_report.governance_alert_required).toBe(true);
    expect(result.integrity_report.certification_review_required).toBe(true);
  });

  it("records full audit coverage", () => {
    const result = appendOperatorFeedbackLedger({ scenario: "BASELINE" });

    expect(result.audit_events.map((event) => event.event_type)).toEqual([
      "LEDGER_APPEND",
      "REPLAY_REGISTERED",
      "HISTORY_REGISTERED",
      "EVIDENCE_REGISTERED",
      "ADAPTATION_USAGE_REGISTERED",
      "SIMULATION_USAGE_REGISTERED",
      "CERTIFICATION_REGISTERED",
      "INTEGRITY_VERIFIED",
    ]);
    expect(result.audit_events.every((event) => event.append_only && event.immutable)).toBe(true);
  });

  it("replays ledger output and detects tampering", () => {
    const result = appendOperatorFeedbackLedger({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOperatorFeedbackLedger(result)).toBe(true);
    expect(replayOperatorFeedbackLedger(tampered)).toBe(false);
  });
});
