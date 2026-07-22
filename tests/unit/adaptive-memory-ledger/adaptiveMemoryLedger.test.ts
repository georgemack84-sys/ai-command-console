import { describe, expect, it } from "vitest";
import {
  establishAdaptiveMemoryLedger,
  getAdaptiveMemoryLedger,
  replayAdaptiveMemoryLedger,
} from "@/services/adaptive-memory-ledger";
import type { LedgerEventType, LedgerFailure, LedgerScenario } from "@/types/adaptive-memory-ledger";

describe("Mission Control Phase 10.13M Adaptive Memory Ledger", () => {
  const eventTypes: readonly LedgerEventType[] = [
    "MEMORY_CREATION",
    "MEMORY_QUALIFICATION",
    "MEMORY_VALIDATION",
    "MEMORY_INDEXING",
    "MEMORY_RETRIEVAL",
    "MEMORY_REUSE",
    "GOVERNANCE_REVIEW",
    "REPLAY_EXECUTION",
    "SUPERSESSION",
    "EXPIRATION",
    "ARCHIVAL",
    "RESTORATION",
    "CERTIFICATION",
    "SECURITY_EVENT",
    "INTEGRITY_VERIFICATION",
  ];

  it("publishes the authoritative adaptive memory ledger contract", () => {
    const ledger = getAdaptiveMemoryLedger();

    expect(ledger.adaptive_memory_ledger_version).toBe("adaptive-memory-ledger/v1");
    expect(ledger.supported_event_types).toEqual(eventTypes);
    expect(ledger.api_surface.establish_ledger).toBe("POST /adaptive-memory-ledger/establish");
    expect(ledger.api_surface.retrieve_contract).toBe("GET /adaptive-memory-ledger/contract");
    expect(ledger.api_surface.mutation_supported).toBe(false);
    expect(ledger.api_surface.deletion_supported).toBe(false);
    expect(ledger.api_surface.non_append_writes_supported).toBe(false);
    expect(ledger.result.ledger_identifier).toBe("AdaptiveMemoryLedger");
    expect(ledger.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic ledger records, lineage, metrics, and integrity", () => {
    const first = establishAdaptiveMemoryLedger();
    const second = establishAdaptiveMemoryLedger();

    expect(first.ledger_records.map((record) => record.integrity_hash)).toEqual(second.ledger_records.map((record) => record.integrity_hash));
    expect(first.lineage_records.map((record) => record.integrity_hash)).toEqual(second.lineage_records.map((record) => record.integrity_hash));
    expect(first.metrics.integrity_hash).toBe(second.metrics.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayAdaptiveMemoryLedger(first)).toBe(true);
  });

  it("records every adaptive memory event category for each memory record", () => {
    const result = establishAdaptiveMemoryLedger();

    expect(result.ledger_records).toHaveLength(150);
    for (const eventType of eventTypes) {
      expect(result.ledger_records.some((record) => record.event_type === eventType)).toBe(true);
    }
    expect(result.ledger_records.every((record) => record.event_timestamp)).toBe(true);
    expect(result.ledger_records.every((record) => record.tenant_id)).toBe(true);
    expect(result.ledger_records.every((record) => record.mission_id)).toBe(true);
    expect(result.ledger_records.every((record) => record.previous_hash)).toBe(true);
    expect(result.ledger_records.every((record) => record.current_hash)).toBe(true);
  });

  it("maintains append-only immutable hash-chain guarantees", () => {
    const result = establishAdaptiveMemoryLedger();

    expect(result.append_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.hash_chain_valid).toBe(true);
    expect(result.ledger_records[0].previous_hash).toBe("adaptive-memory-ledger-genesis");
    expect(result.ledger_records.slice(1).every((record, index) => record.previous_hash === result.ledger_records[index].current_hash)).toBe(true);
    expect(result.ledger_records.every((record) => record.append_only)).toBe(true);
    expect(result.ledger_records.every((record) => record.immutable)).toBe(true);
    expect(result.ledger_records.every((record) => record.deleted === false)).toBe(true);
  });

  it("preserves complete lineage, governance, replay, and certification references", () => {
    const result = establishAdaptiveMemoryLedger();

    expect(result.lineage_complete).toBe(true);
    expect(result.governance_history_preserved).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.ledger_records.every((record) => record.evidence_refs.length > 0)).toBe(true);
    expect(result.ledger_records.every((record) => record.governance_refs.length > 0)).toBe(true);
    expect(result.ledger_records.every((record) => record.replay_refs.length > 0)).toBe(true);
    expect(result.ledger_records.every((record) => record.lineage_refs.length > 0)).toBe(true);
    expect(result.ledger_records.every((record) => record.certification_refs.length > 0)).toBe(true);
  });

  it("supports forensic, governance, replay, certification, lineage, integrity, and lifecycle audits", () => {
    const audit = establishAdaptiveMemoryLedger().audit_report;

    expect(audit.forensic_reconstruction_supported).toBe(true);
    expect(audit.governance_audit_supported).toBe(true);
    expect(audit.constitutional_audit_supported).toBe(true);
    expect(audit.replay_audit_supported).toBe(true);
    expect(audit.certification_audit_supported).toBe(true);
    expect(audit.lineage_audit_supported).toBe(true);
    expect(audit.integrity_audit_supported).toBe(true);
    expect(audit.lifecycle_audit_supported).toBe(true);
  });

  it("validates ledger integrity and observability metrics", () => {
    const result = establishAdaptiveMemoryLedger();

    expect(result.integrity_validation.ledger_hashes_valid).toBe(true);
    expect(result.integrity_validation.chain_integrity_valid).toBe(true);
    expect(result.integrity_validation.event_ordering_valid).toBe(true);
    expect(result.integrity_validation.lineage_consistent).toBe(true);
    expect(result.integrity_validation.replay_consistent).toBe(true);
    expect(result.integrity_validation.write_consistent).toBe(true);
    expect(result.integrity_validation.cryptographic_verification_valid).toBe(true);
    expect(result.metrics.ledger_writes).toBe(150);
    expect(result.metrics.replay_requests).toBe(10);
    expect(result.metrics.governance_events).toBe(10);
    expect(result.metrics.lifecycle_events).toBe(40);
    expect(result.metrics.security_events).toBe(10);
  });

  it.each([
    ["SECURITY_FRAMEWORK_UNAVAILABLE", "SECURITY_FRAMEWORK_UNAVAILABLE"],
    ["ENTRY_MODIFIED", "LEDGER_ENTRY_MODIFIED"],
    ["ENTRY_DELETED", "LEDGER_ENTRY_DELETED"],
    ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_VIOLATED"],
    ["HASH_CHAIN_BREAK", "HASH_CHAIN_BROKEN"],
    ["INCOMPLETE_LINEAGE", "LINEAGE_INCOMPLETE"],
    ["REPLAY_UNAVAILABLE", "REPLAY_UNAVAILABLE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_HISTORY_MISSING"],
    ["ORDERING_INCONSISTENCY", "EVENT_ORDERING_INCONSISTENT"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_VIOLATED"],
  ] as const)("fails closed for %s", (scenario: LedgerScenario, failure: LedgerFailure) => {
    const result = establishAdaptiveMemoryLedger({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(replayAdaptiveMemoryLedger(result)).toBe(failure === "LEDGER_ENTRY_MODIFIED" || failure === "HASH_CHAIN_BROKEN" ? false : true);
  });

  it("detects mutation, deletion, append-only, replay, lineage, governance, integrity, and tenant failures", () => {
    expect(establishAdaptiveMemoryLedger({ scenario: "ENTRY_MODIFIED" }).immutable).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "ENTRY_DELETED" }).immutable).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "APPEND_ONLY_VIOLATION" }).append_only).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "HASH_CHAIN_BREAK" }).hash_chain_valid).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "INCOMPLETE_LINEAGE" }).lineage_complete).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "REPLAY_UNAVAILABLE" }).replayable).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "MISSING_GOVERNANCE" }).governance_history_preserved).toBe(false);
    expect(establishAdaptiveMemoryLedger({ scenario: "TENANT_ISOLATION_BREACH" }).tenant_isolation_enforced).toBe(false);
  });

  it("detects nested ledger record tampering", () => {
    const result = establishAdaptiveMemoryLedger();
    const tampered = {
      ...result,
      ledger_records: [
        {
          ...result.ledger_records[0],
          event_type: "ARCHIVAL" as const,
        },
        ...result.ledger_records.slice(1),
      ],
    };

    expect(replayAdaptiveMemoryLedger(tampered)).toBe(false);
  });
});
