import { describe, expect, it } from "vitest";
import {
  appendPatternIntelligenceLedger,
  computePatternLedgerRecordHash,
  getPatternIntelligenceLedgerFoundation,
  replayPatternIntelligenceLedger,
} from "@/services/pattern-intelligence-ledger";
import type { PatternLedgerFailure, PatternLedgerScenario } from "@/types/pattern-intelligence-ledger";

describe("Mission Control Phase 10.4.7 Pattern Intelligence Ledger", () => {
  it("publishes the pattern intelligence ledger foundation", () => {
    const foundation = getPatternIntelligenceLedgerFoundation();

    expect(foundation.pattern_intelligence_ledger_version).toBe("pattern-intelligence-ledger/v1");
    expect(foundation.api_surface.append_pattern_record).toBe("POST /pattern-intelligence-ledger/append");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("appends certified pattern intelligence records deterministically", () => {
    const first = appendPatternIntelligenceLedger();
    const second = appendPatternIntelligenceLedger();

    expect(first.ledger.records[0].ledger_record_id).toBe(second.ledger.records[0].ledger_record_id);
    expect(first.ledger.records[0].append_sequence).toBe(1);
    expect(first.ledger.records[0].previous_record_hash).toBe("GENESIS");
  });

  it("preserves recurrence, evidence, replay, scoring, governance, certification, and lineage references", () => {
    const result = appendPatternIntelligenceLedger();
    const record = result.ledger.records[0];

    expect(record.recurrence_history_refs.length).toBeGreaterThan(0);
    expect(record.evidence_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.scoring_refs.length).toBeGreaterThan(0);
    expect(record.governance_review_refs.length).toBeGreaterThan(0);
    expect(record.certification_refs.length).toBeGreaterThan(0);
    expect(record.lineage_parent_refs.length).toBeGreaterThan(0);
  });

  it("keeps ledger behavior immutable, append-only, advisory-only, and non-mutating", () => {
    const result = appendPatternIntelligenceLedger();
    const record = result.ledger.records[0];

    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_learning).toBe(false);
    expect(result.modifies_governance).toBe(false);
    expect(result.modifies_recommendations).toBe(false);
    expect(result.execution_decision).toBe(false);
    expect(record.update_supported).toBe(false);
    expect(record.delete_supported).toBe(false);
  });

  it("records deterministic lineage and replay indexes", () => {
    const result = appendPatternIntelligenceLedger();
    const record = result.ledger.records[0];

    expect(result.lineage_registry.parent_index[record.ledger_record_id]).toEqual(record.lineage_parent_refs);
    expect(result.replay_index.ledger_sequence).toEqual([1]);
    expect(result.replay_index.pattern_refs).toEqual([record.pattern_id]);
    expect(result.replay_index.replay_refs).toEqual(record.replay_refs);
  });

  it("creates stable ledger record hashes and replay output", () => {
    const result = appendPatternIntelligenceLedger();
    const record = result.ledger.records[0];

    expect(computePatternLedgerRecordHash(record)).toBe(record.integrity_hash);
    expect(replayPatternIntelligenceLedger(result)).toBe(true);
  });

  it("supports supersession by appending lineage children without mutating history", () => {
    const result = appendPatternIntelligenceLedger({ scenario: "SUPERSEDED" });
    const record = result.ledger.records[0];

    expect(record.lifecycle_state).toBe("SUPERSEDED");
    expect(record.lineage_child_refs.length).toBeGreaterThan(0);
    expect(result.validation.certified).toBe(true);
  });

  it("validates ordering, hash chain, lineage, replay, tenant isolation, and explanations", () => {
    const result = appendPatternIntelligenceLedger();

    expect(result.validation.append_ordering_valid).toBe(true);
    expect(result.validation.hash_chain_valid).toBe(true);
    expect(result.validation.lineage_complete).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.explanations_complete).toBe(true);
  });

  it.each([
    ["MISSING_GOVERNANCE_INPUT", "GOVERNANCE_INPUT_MISSING"],
    ["UNCERTIFIED_GOVERNANCE_INPUT", "GOVERNANCE_INPUT_UNCERTIFIED"],
    ["MISSING_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE_REFS", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_REFERENCES_INCOMPLETE"],
    ["MISSING_SCORING", "SCORING_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REFERENCES_MISSING"],
    ["INVALID_APPEND_ORDER", "APPEND_ORDERING_INVALID"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATED"],
    ["REPLAY_DIVERGENCE", "GOVERNANCE_INPUT_UNCERTIFIED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_GENERATION_FAILED"],
    ["HASH_CHAIN_BREAK", "HASH_CHAIN_INVALID"],
    ["RECORD_MUTATION", "RECORD_MUTATION_DETECTED"],
    ["DELETE_OPERATION", "DELETE_OPERATION_DETECTED"],
    ["UPDATE_OPERATION", "UPDATE_OPERATION_DETECTED"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternLedgerScenario, PatternLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = appendPatternIntelligenceLedger({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_learning).toBe(false);
  });

  it("keeps missing evidence pending instead of certified", () => {
    const result = appendPatternIntelligenceLedger({ scenario: "MISSING_EVIDENCE" });

    expect(result.validation.state).toBe("PENDING_EVIDENCE");
    expect(result.validation.evidence_references_complete).toBe(false);
  });

  it("detects ledger tampering during replay", () => {
    const result = appendPatternIntelligenceLedger();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternIntelligenceLedger(tampered)).toBe(false);
  });
});
