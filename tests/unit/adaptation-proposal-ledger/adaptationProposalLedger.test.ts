import { describe, expect, it } from "vitest";
import {
  commitAdaptationProposalLedger,
  getAdaptationProposalLedgerFoundation,
  replayAdaptationProposalLedger,
} from "@/services/adaptation-proposal-ledger";
import type {
  AdaptationProposalLedgerEventType,
  AdaptationProposalLedgerFailure,
  AdaptationProposalLedgerScenario,
} from "@/types/adaptation-proposal-ledger";

describe("Mission Control Phase 10.10.8 Adaptation Proposal Ledger", () => {
  const expectedEvents: readonly AdaptationProposalLedgerEventType[] = [
    "PROPOSAL_CREATED",
    "PROPOSAL_VALIDATED",
    "PROPOSAL_SCORED",
    "PROPOSAL_PRIORITIZED",
    "PROPOSAL_SUPPRESSED",
    "PROPOSAL_CONSOLIDATED",
    "SIMULATION_ROUTED",
    "GOVERNANCE_REVIEWED",
    "OPERATOR_REVIEWED",
    "CERTIFICATION_ROUTED",
    "APPROVAL_RECORDED",
    "REJECTION_RECORDED",
    "ROLLBACK_PLANNED",
    "ARCHIVED",
  ];

  it("publishes the adaptation proposal ledger contract", () => {
    const foundation = getAdaptationProposalLedgerFoundation();

    expect(foundation.adaptation_proposal_ledger_version).toBe("adaptation-proposal-ledger/v1");
    expect(foundation.api_surface.commit_ledger).toBe("POST /adaptation-proposal-ledger/commit");
    expect(foundation.api_surface.query_ledger).toBe("POST /adaptation-proposal-ledger/query");
    expect(foundation.api_surface.history_rewrite_supported).toBe(false);
    expect(foundation.api_surface.implementation_authorization_supported).toBe(false);
    expect(foundation.supported_event_types).toEqual(expectedEvents);
    expect(foundation.result.ledger_state).toBe("COMMITTED");
  });

  it("commits ledger entries deterministically", () => {
    const first = commitAdaptationProposalLedger({ scenario: "DUPLICATE_CONSOLIDATION" });
    const second = commitAdaptationProposalLedger({ scenario: "DUPLICATE_CONSOLIDATION" });

    expect(first.ledger_entries.map((entry) => entry.entry_hash)).toEqual(second.ledger_entries.map((entry) => entry.entry_hash));
    expect(first.query_index.integrity_hash).toBe(second.query_index.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("records the complete proposal lifecycle", () => {
    const result = commitAdaptationProposalLedger();
    const events = result.ledger_entries.map((entry) => entry.event_type);

    expect(events).toEqual(expectedEvents);
    expect(result.metrics.ledger_entries_committed).toBe(expectedEvents.length);
    expectedEvents.forEach((eventType) => {
      expect(result.metrics.proposal_lifecycle_events[eventType]).toBe(1);
    });
  });

  it("enforces append-only hash-chain continuity", () => {
    const entries = commitAdaptationProposalLedger({ scenario: "OVERLAPPING_CONSOLIDATION" }).ledger_entries;

    expect(entries[0]?.previous_ledger_hash).toBe("GENESIS");
    entries.forEach((entry, index) => {
      expect(entry.event_sequence_number).toBe(index + 1);
      expect(entry.immutable).toBe(true);
      expect(entry.append_only).toBe(true);
      if (index > 0) expect(entry.previous_ledger_hash).toBe(entries[index - 1]?.entry_hash);
    });
  });

  it("preserves proposal, replay, and lineage references on every entry", () => {
    const entries = commitAdaptationProposalLedger().ledger_entries;

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.proposal_id)).toBe(true);
    expect(entries.every((entry) => entry.replay_reference)).toBe(true);
    expect(entries.every((entry) => entry.lineage_reference)).toBe(true);
    expect(entries.every((entry) => entry.proposal_integrity_hash)).toBe(true);
    expect(entries.every((entry) => entry.lineage_integrity_hash)).toBe(true);
    expect(entries.every((entry) => entry.tenant_id === "tenant_current")).toBe(true);
  });

  it("publishes deterministic tenant-isolated query indexes", () => {
    const result = commitAdaptationProposalLedger({ scenario: "CONFLICTING_RELATIONSHIP" });
    const index = result.query_index;

    expect(index.tenant_isolated).toBe(true);
    expect(index.deterministic).toBe(true);
    expect(index.proposal_ids.length).toBe(1);
    expect(index.tenant_ids).toEqual(["tenant_current"]);
    expect(index.event_types).toEqual(expectedEvents);
    expect(index.replay_identifiers.length).toBe(1);
    expect(index.lineage_identifiers.length).toBe(1);
    expect(index.time_range.start).toBe("2026-07-10T00:00:01.000Z");
  });

  it("publishes ledger integrity metrics", () => {
    const result = commitAdaptationProposalLedger();

    expect(result.metrics.hash_verification_success).toBe(true);
    expect(result.metrics.replay_reconstruction_success).toBe(true);
    expect(result.metrics.lineage_completeness).toBe(true);
    expect(result.metrics.append_latency_ms).toBe(0);
    expect(result.metrics.archival_events).toBe(1);
    expect(result.metrics.tenant_isolation_violations).toBe(0);
    expect(result.metrics.deterministic_replay_success).toBe(true);
  });

  it("keeps the ledger advisory-only and non-mutating", () => {
    const result = commitAdaptationProposalLedger();

    expect(result.advisory_only).toBe(true);
    expect(result.modifies_proposals).toBe(false);
    expect(result.rewrites_history).toBe(false);
    expect(result.removes_historical_entries).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
    expect(result.changes_production_behavior).toBe(false);
    expect(result.append_only).toBe(true);
    expect(result.immutable_storage_verified).toBe(true);
  });

  it.each([
    ["PROPOSAL_VALIDATION_FAILURE", "PROPOSAL_VALIDATION_FAILED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HASH_FAILURE", "HASH_VERIFICATION_FAILED"],
    ["SEQUENCE_BREAK", "SEQUENCE_CONTINUITY_BROKEN"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_LINEAGE", "LINEAGE_REFERENCES_MISSING"],
    ["DUPLICATE_EVENT", "DUPLICATE_EVENT_IDENTIFIER"],
    ["NONDETERMINISTIC_ORDERING", "DETERMINISTIC_ORDERING_NOT_GUARANTEED"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["EVENT_AUTHENTICITY_FAILURE", "EVENT_AUTHENTICITY_FAILED"],
    ["PROPOSAL_MUTATION_ATTEMPT", "PROPOSAL_CONTENT_MUTATION_ATTEMPT"],
    ["HISTORY_REWRITE_ATTEMPT", "HISTORY_REWRITE_ATTEMPT"],
    ["ENTRY_REMOVAL_ATTEMPT", "HISTORICAL_ENTRY_REMOVAL_ATTEMPT"],
    ["INTEGRITY_BYPASS", "INTEGRITY_BYPASS_ATTEMPT"],
    ["REPLAY_BYPASS", "REPLAY_RECORDING_BYPASS_ATTEMPT"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_HISTORY_BYPASS_ATTEMPT"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_HISTORY_BYPASS_ATTEMPT"],
    ["CROSS_TENANT_RECORD", "CROSS_TENANT_RECORD_ATTEMPT"],
    ["IMPLEMENTATION_ATTEMPT", "IMPLEMENTATION_AUTHORIZATION_ATTEMPT"],
  ] as readonly [AdaptationProposalLedgerScenario, AdaptationProposalLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = commitAdaptationProposalLedger({ scenario });

    expect(result.ledger_state).toBe("FAIL_CLOSED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.validation_failures).toContain(failure);
    expect(result.ledger_entries).toEqual([]);
    expect(result.modifies_proposals).toBe(false);
    expect(result.authorizes_implementation).toBe(false);
  });

  it("replays the ledger and detects tampering", () => {
    const result = commitAdaptationProposalLedger({ scenario: "DUPLICATE_CONSOLIDATION" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayAdaptationProposalLedger(result)).toBe(true);
    expect(replayAdaptationProposalLedger(tampered)).toBe(false);
  });
});
