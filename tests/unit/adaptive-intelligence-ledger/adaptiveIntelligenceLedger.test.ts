import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_LEDGER_CHECKS,
  ADAPTIVE_LEDGER_EVENT_TYPES,
  ADAPTIVE_LEDGER_LIFECYCLE_STATES,
  computeAdaptiveLedgerRecordHash,
  getAdaptiveIntelligenceLedgerFoundation,
  replayAdaptiveIntelligenceLedger,
  runAdaptiveIntelligenceLedger,
} from "@/services/adaptive-intelligence-ledger";
import type { AdaptiveIntelligenceLedgerInput, AdaptiveLedgerFailure } from "@/types/adaptive-intelligence-ledger";

describe("Mission Control Phase 10.0.8 Adaptive Intelligence Ledger", () => {
  it("publishes the adaptive intelligence ledger foundation", () => {
    const foundation = getAdaptiveIntelligenceLedgerFoundation();

    expect(foundation.ledger_version).toBe("adaptive-intelligence-ledger/v1");
    expect(foundation.checks).toEqual(ADAPTIVE_LEDGER_CHECKS);
    expect(foundation.event_types).toEqual(ADAPTIVE_LEDGER_EVENT_TYPES);
    expect(foundation.lifecycle_states).toEqual(ADAPTIVE_LEDGER_LIFECYCLE_STATES);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("records every adaptive lifecycle event", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.records.map((record) => record.event_type)).toEqual(ADAPTIVE_LEDGER_EVENT_TYPES);
    expect(result.records.map((record) => record.lifecycle_state)).toEqual(["PROPOSED", "VALIDATED", "SIMULATED", "GOVERNANCE_REVIEWED", "OPERATOR_APPROVED", "CERTIFIED", "ROLLED_BACK", "REJECTED"]);
    expect(result.certification_report.all_lifecycle_events_recorded).toBe(true);
  });

  it("creates deterministic record hashes and a previous-hash chain", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(computeAdaptiveLedgerRecordHash(result.records[0])).toBe(result.records[0].integrity_hash);
    expect(result.records[0].previous_hash).toBe("GENESIS");
    expect(result.records[1].previous_hash).toBe(result.records[0].integrity_hash);
    expect(result.records[7].previous_hash).toBe(result.records[6].integrity_hash);
  });

  it("confirms append-only ledger writer behavior", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.writer_confirmation.records_appended).toBe(8);
    expect(result.writer_confirmation.assigned_sequences).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result.writer_confirmation.append_only).toBe(true);
    expect(result.writer_confirmation.overwrite_attempted).toBe(false);
  });

  it("preserves deterministic reader ordering and tenant isolation", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.reader_result.records.length).toBe(8);
    expect(result.reader_result.chronological_order_preserved).toBe(true);
    expect(result.reader_result.tenant_isolated).toBe(true);
    expect(result.reader_result.read_authorized).toBe(true);
  });

  it("supports event-type ledger queries", () => {
    const baseline = runAdaptiveIntelligenceLedger();
    const result = runAdaptiveIntelligenceLedger({
      query: {
        query_id: "approval_query",
        tenant_id: baseline.records[0].tenant_id,
        event_type: "OPERATOR_APPROVAL",
      },
    });

    expect(result.reader_result.records).toHaveLength(1);
    expect(result.reader_result.records[0].event_type).toBe("OPERATOR_APPROVAL");
  });

  it("indexes proposal, adaptation, tenant, governance, certification, replay, and hash dimensions", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.index.by_proposal).toContain(result.records[0].proposal_id);
    expect(result.index.by_adaptation).toContain(result.records[0].adaptation_id);
    expect(result.index.by_tenant).toContain(result.records[0].tenant_id);
    expect(result.index.by_governance_ref.length).toBeGreaterThan(0);
    expect(result.index.by_certification_ref.length).toBeGreaterThan(0);
    expect(result.index.by_replay_ref.length).toBeGreaterThan(0);
    expect(result.index.by_integrity_hash).toContain(result.records[0].integrity_hash);
  });

  it("replays the full ledger history deterministically", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.replay_result.records_replayed).toBe(8);
    expect(result.replay_result.identical_history).toBe(true);
    expect(result.replay_result.identical_hash_chain).toBe(true);
    expect(result.replay_result.deterministic_result).toBe("PASS");
    expect(replayAdaptiveIntelligenceLedger(result)).toBe(true);
  });

  it("enforces permanent retention with no deletion, mutation, or history rewrite", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.retention_policy.retention_mode).toBe("PERMANENT");
    expect(result.retention_policy.deletion_permitted).toBe(false);
    expect(result.retention_policy.mutation_permitted).toBe(false);
    expect(result.retention_policy.history_rewrite_permitted).toBe(false);
    expect(result.permits_record_deletion).toBe(false);
    expect(result.permits_overwrite).toBe(false);
    expect(result.mutates_history).toBe(false);
  });

  it("reports ledger observability metrics", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.dashboard.ledger_growth).toBe(8);
    expect(result.dashboard.integrity_validation_status).toBe("PASS");
    expect(result.dashboard.replay_completeness).toBe("PASS");
    expect(result.dashboard.governance_events).toBe(1);
    expect(result.dashboard.approval_history).toBe(1);
    expect(result.dashboard.certification_history).toBe(1);
    expect(result.dashboard.rollback_history).toBe(1);
    expect(result.dashboard.rejection_statistics).toBe(1);
  });

  it("certifies complete auditability and tenant isolation", () => {
    const result = runAdaptiveIntelligenceLedger();

    expect(result.certification_report.certification_decision).toBe("PASS");
    expect(result.certification_report.append_only_compliant).toBe(true);
    expect(result.certification_report.reproducible_hashes).toBe(true);
    expect(result.certification_report.tenant_isolation_complete).toBe(true);
    expect(result.certification_report.auditability_complete).toBe(true);
    expect(result.tenant_isolated).toBe(true);
  });

  it.each([
    ["SCHEMA_INVALID", "SCHEMA_INVALID"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["SEQUENCE_VIOLATION", "SEQUENCE_VIOLATION"],
    ["DUPLICATE_LEDGER_ID", "DUPLICATE_LEDGER_IDENTIFIER"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["LINEAGE_INCOMPLETE", "LINEAGE_INCOMPLETE"],
    ["APPEND_OVERWRITE", "APPEND_OVERWRITE_ATTEMPTED"],
    ["PREVIOUS_HASH_INVALID", "PREVIOUS_HASH_INVALID"],
    ["PARENT_CHILD_INCONSISTENT", "PARENT_CHILD_INCONSISTENT"],
    ["RECORD_MODIFICATION", "RECORD_MODIFICATION_ATTEMPTED"],
    ["RECORD_DELETION", "RECORD_DELETION_ATTEMPTED"],
    ["HISTORY_REWRITE", "HISTORY_REWRITE_ATTEMPTED"],
    ["HASH_TAMPERING", "HASH_TAMPERING"],
    ["HIDDEN_LEDGER_ENTRY", "HIDDEN_LEDGER_ENTRY"],
    ["UNAUTHORIZED_WRITE", "UNAUTHORIZED_WRITE"],
    ["UNAUTHORIZED_READ", "UNAUTHORIZED_READ"],
    ["TENANT_CROSSOVER", "TENANT_CROSSOVER"],
    ["CHAIN_CORRUPTION", "CHAIN_CORRUPTION"],
    ["MISSING_APPROVAL_RECORD", "APPROVAL_RECORD_MISSING"],
    ["MISSING_CERTIFICATION_RECORD", "CERTIFICATION_RECORD_MISSING"],
    ["MISSING_ROLLBACK_REPLAY", "ROLLBACK_REPLAY_MISSING"],
    ["MISSING_REJECTION_RECORD", "REJECTION_RECORD_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_LEDGER_BEHAVIOR"],
  ] as readonly [NonNullable<AdaptiveIntelligenceLedgerInput["scenario"]>, AdaptiveLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runAdaptiveIntelligenceLedger({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.certification_report.certification_decision).toBe("FAIL");
    expect(result.integrity_report.validation_result).toBe("FAIL");
    expect(result.permits_record_deletion).toBe(false);
    expect(result.permits_overwrite).toBe(false);
  });

  it("fails closed when the role cannot read ledger records", () => {
    const result = runAdaptiveIntelligenceLedger({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("UNAUTHORIZED_READ");
    expect(result.reader_result.read_authorized).toBe(false);
  });

  it("detects ledger result tampering", () => {
    const result = runAdaptiveIntelligenceLedger();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptiveIntelligenceLedger(tampered)).toBe(false);
  });
});
