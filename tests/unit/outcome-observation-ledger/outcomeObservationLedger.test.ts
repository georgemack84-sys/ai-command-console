import { describe, expect, it } from "vitest";
import {
  OUTCOME_LEDGER_CHECKS,
  OUTCOME_LEDGER_LIFECYCLE,
  computeOutcomeLedgerRecordHash,
  getOutcomeObservationLedgerFoundation,
  replayOutcomeObservationLedger,
  runOutcomeObservationLedger,
} from "@/services/outcome-observation-ledger";
import type { OutcomeLedgerFailure, OutcomeObservationLedgerInput } from "@/types/outcome-observation-ledger";

describe("Mission Control Phase 10.1.9 Outcome Observation Ledger", () => {
  it("publishes the outcome observation ledger foundation", () => {
    const foundation = getOutcomeObservationLedgerFoundation();

    expect(foundation.outcome_observation_ledger_version).toBe("outcome-observation-ledger/v1");
    expect(foundation.checks).toEqual(OUTCOME_LEDGER_CHECKS);
    expect(foundation.lifecycle).toEqual(OUTCOME_LEDGER_LIFECYCLE);
    expect(foundation.api_surface.update_supported).toBe(false);
    expect(foundation.api_surface.delete_supported).toBe(false);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("commits immutable historical records without execution or analytics behavior", () => {
    const result = runOutcomeObservationLedger();

    expect(result.historical_record_only).toBe(true);
    expect(result.execution_engine).toBe(false);
    expect(result.analytics_engine).toBe(false);
    expect(result.ledger_records[0].append_only).toBe(true);
    expect(result.ledger_records[0].deleted).toBe(false);
  });

  it("supports append, read, query, and verify while excluding update and delete", () => {
    const result = runOutcomeObservationLedger();

    expect(result.api_surface.supported_operations).toEqual(["APPEND", "READ", "QUERY", "VERIFY"]);
    expect(result.api_surface.unsupported_operations).toEqual(["UPDATE", "DELETE"]);
    expect(result.update_supported).toBe(false);
    expect(result.delete_supported).toBe(false);
  });

  it("generates stable record hashes and replay output", () => {
    const result = runOutcomeObservationLedger();

    expect(computeOutcomeLedgerRecordHash(result.ledger_records[0])).toBe(result.ledger_records[0].integrity_hash);
    expect(replayOutcomeObservationLedger(result)).toBe(true);
  });

  it("stores observation, evidence, mission impact, governance, operator, replay, and integrity refs", () => {
    const record = runOutcomeObservationLedger().ledger_records[0];

    expect(record.observation_refs.length).toBeGreaterThan(0);
    expect(record.evidence_refs.length).toBeGreaterThan(0);
    expect(record.mission_impact_refs.length).toBeGreaterThan(0);
    expect(record.governance_outcome_refs.length).toBeGreaterThan(0);
    expect(record.operator_action_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.integrity_hash).toBeTruthy();
  });

  it("preserves hash chain continuity from genesis", () => {
    const result = runOutcomeObservationLedger();

    expect(result.ledger_records[0].previous_record_hash).toBe("GENESIS_OUTCOME_OBSERVATION_LEDGER");
    expect(result.validation.hash_chain_valid).toBe(true);
    expect(result.metrics.hash_chain_validation_status).toBe("VALID");
  });

  it.each(["TENANT", "MISSION", "DECISION", "OUTCOME", "OPERATOR", "GOVERNANCE", "REPLAY", "EVIDENCE"] as const)("queries deterministically by %s", (query_domain) => {
    const result = runOutcomeObservationLedger({ query_domain });

    expect(result.query_result.query_domain).toBe(query_domain);
    expect(result.query_result.matched_record_ids.length).toBeGreaterThan(0);
    expect(result.query_result.query_mutated_state).toBe(false);
  });

  it("builds a replay index for deterministic historical reconstruction", () => {
    const result = runOutcomeObservationLedger();

    expect(result.replay_index.by_tenant.length).toBeGreaterThan(0);
    expect(result.replay_index.by_mission.length).toBeGreaterThan(0);
    expect(result.replay_index.by_decision.length).toBeGreaterThan(0);
    expect(result.replay_index.by_outcome.length).toBeGreaterThan(0);
    expect(result.replay_index.by_replay_sequence.length).toBeGreaterThan(0);
    expect(result.replay_report.replay_reconstruction_identical).toBe(true);
  });

  it("publishes advisory-only metrics", () => {
    const result = runOutcomeObservationLedger();

    expect(result.metrics.ledger_records_committed).toBe(1);
    expect(result.metrics.append_operations).toBe(1);
    expect(result.metrics.integrity_verification_success_rate).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("certifies the ledger audit report when storage and replay are valid", () => {
    const result = runOutcomeObservationLedger();

    expect(result.audit_report.outcome_ledger_operational).toBe(true);
    expect(result.audit_report.ledger_api_operational).toBe(true);
    expect(result.audit_report.append_only_verified).toBe(true);
    expect(result.audit_report.update_delete_absent).toBe(true);
    expect(result.audit_report.certification_decision).toBe("PASS");
  });

  it.each([
    ["RECORD_MODIFICATION", "LEDGER_PERMITS_RECORD_MODIFICATION"],
    ["RECORD_DELETION", "LEDGER_PERMITS_RECORD_DELETION"],
    ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_BEHAVIOR_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_NOT_REPRODUCIBLE"],
    ["CHAIN_BROKEN", "HASH_CHAIN_BROKEN"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERS"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["DUPLICATE_SEQUENCE", "DUPLICATE_LEDGER_SEQUENCE_ACCEPTED"],
    ["NONDETERMINISTIC_ORDERING", "LEDGER_ORDERING_NONDETERMINISTIC"],
    ["UNAUTHORIZED_TENANT_ACCESS", "UNAUTHORIZED_TENANT_ACCESS_PERMITTED"],
    ["INTEGRITY_BYPASS", "INTEGRITY_VERIFICATION_BYPASSED"],
    ["INFERRED_OBSERVATION", "INFERRED_OBSERVATION_ACCEPTED"],
    ["QUERY_MUTATION", "QUERY_MUTATED_LEDGER_STATE"],
    ["HISTORICAL_COMPATIBILITY_BROKEN", "HISTORICAL_REPLAY_COMPATIBILITY_BROKEN"],
    ["INVALID_SOURCE", "SOURCE_RECORD_NOT_VALIDATED"],
    ["FAIL_OPEN", "FAIL_OPEN_LEDGER_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeObservationLedgerInput["scenario"]>, OutcomeLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeObservationLedger({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.update_supported).toBe(false);
    expect(result.delete_supported).toBe(false);
  });

  it("fails closed when the role lacks ledger visibility", () => {
    const result = runOutcomeObservationLedger({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects outcome ledger tampering during replay", () => {
    const result = runOutcomeObservationLedger();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeObservationLedger(tampered)).toBe(false);
  });
});
