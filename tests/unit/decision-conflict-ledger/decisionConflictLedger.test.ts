import { describe, expect, it } from "vitest";
import {
  CONFLICT_LEDGER_EVENT_TYPES,
  buildConflictLedgerEntries,
  buildConflictLedgerObservability,
  computeConflictLedgerEntryHash,
  getConflictLedgerFoundation,
  replayConflictLedger,
  validateConflictLedgerEntries,
  writeConflictLedger,
} from "@/services/decision-conflict-ledger";
import { runConflictEscalationWorkflow } from "@/services/decision-conflict-escalation-workflow";

describe("Mission Control Phase 9.6.7 Conflict Ledger", () => {
  it("publishes the immutable conflict ledger foundation", () => {
    const foundation = getConflictLedgerFoundation();

    expect(foundation.ledger_version).toBe("conflict-ledger/v1");
    expect(foundation.supported_event_types).toEqual(CONFLICT_LEDGER_EVENT_TYPES);
    expect(foundation.result.ledger_status).toBe("PASS");
    expect(foundation.result.append_only).toBe(true);
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("creates deterministic ledger entries for every supported event type", () => {
    const escalation = runConflictEscalationWorkflow();
    const entries = buildConflictLedgerEntries(escalation);

    expect(entries.length).toBe(escalation.requests.length * CONFLICT_LEDGER_EVENT_TYPES.length);
    expect(entries.slice(0, CONFLICT_LEDGER_EVENT_TYPES.length).map((entry) => entry.event_type)).toEqual(CONFLICT_LEDGER_EVENT_TYPES);
    expect(entries.every((entry) => entry.integrity_hash === computeConflictLedgerEntryHash(entry))).toBe(true);
  });

  it("maintains append-only previous-hash chaining and sequence ordering", () => {
    const entries = buildConflictLedgerEntries();

    expect(entries[0].previous_hash).toBe("GENESIS");
    for (let index = 1; index < entries.length; index += 1) {
      expect(entries[index].previous_hash).toBe(entries[index - 1].integrity_hash);
      expect(entries[index].ledger_sequence).toBe(index + 1);
    }
    expect(validateConflictLedgerEntries(entries).validation_state).toBe("VALID");
  });

  it("writes audit events, replay references, and certification evidence", () => {
    const result = writeConflictLedger();

    expect(result.audit_events).toHaveLength(result.entries.length);
    expect(result.replay_references).toHaveLength(result.entries.length);
    expect(result.certification_evidence.length).toBe(result.entries.filter((entry) => entry.event_type === "CERTIFICATION_REGISTERED").length);
    expect(result.certification_evidence.every((evidence) => evidence.replay_validation === "VALID")).toBe(true);
  });

  it("replays identical ledger contents, audit history, replay index, and certification evidence", () => {
    const result = writeConflictLedger();
    const replay = replayConflictLedger(result);
    const tampered = replayConflictLedger({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.ledger_entry_refs).toEqual(result.entries.map((entry) => entry.ledger_entry_id));
    expect(replay.audit_event_refs).toEqual(result.audit_events.map((event) => event.audit_event_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("HASH_MISMATCH");
  });

  it("fails closed for duplicate entries, sequence violations, hash mismatches, replay omissions, and metadata omissions", () => {
    const entries = buildConflictLedgerEntries();
    const duplicate = [...entries, entries[0]];
    const sequenceViolation = entries.map((entry, index) => index === 1 ? { ...entry, ledger_sequence: 99 } : entry);
    const hashMismatch = entries.map((entry, index) => index === 0 ? { ...entry, source_component: "tampered" } : entry);
    const noReplay = entries.map((entry, index) => index === 0 ? { ...entry, replay_ref: "", integrity_hash: computeConflictLedgerEntryHash({ ...entry, replay_ref: "" }) } : entry);
    const noGovernance = entries.map((entry, index) => index === 0 ? { ...entry, governance_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, governance_refs: [] }) } : entry);
    const noConstitution = entries.map((entry, index) => index === 0 ? { ...entry, constitutional_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, constitutional_refs: [] }) } : entry);

    expect(validateConflictLedgerEntries(duplicate).failures).toContain("DUPLICATE_LEDGER_ENTRY");
    expect(validateConflictLedgerEntries(sequenceViolation).failures).toContain("SEQUENCE_VIOLATION");
    expect(validateConflictLedgerEntries(hashMismatch).failures).toContain("HASH_MISMATCH");
    expect(validateConflictLedgerEntries(noReplay).failures).toContain("REPLAY_REFERENCE_OMITTED");
    expect(validateConflictLedgerEntries(noGovernance).failures).toContain("MISSING_GOVERNANCE_METADATA");
    expect(validateConflictLedgerEntries(noConstitution).failures).toContain("MISSING_CONSTITUTIONAL_METADATA");
  });

  it("fails closed for unauthorized writes, tenant leakage, invalid lineage, and replay mismatches", () => {
    const entries = buildConflictLedgerEntries();
    const unauthorized = writeConflictLedger({ authorized_component: "unknown" });
    const tenantLeak = entries.map((entry, index) => index === 0 ? { ...entry, evidence_refs: ["evidence_tenant_beta_leak"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, evidence_refs: ["evidence_tenant_beta_leak"] }) } : entry);
    const badLineage = entries.map((entry, index) => index === 0 ? { ...entry, lineage_ref: "", integrity_hash: computeConflictLedgerEntryHash({ ...entry, lineage_ref: "" }) } : entry);
    const valid = writeConflictLedger();
    const replayMismatch = writeConflictLedger({ replay_expected_hash: `${valid.replay_hash}_wrong` });

    expect(unauthorized.failures).toContain("UNAUTHORIZED_WRITE");
    expect(validateConflictLedgerEntries(tenantLeak).failures).toContain("CROSS_TENANT_RECORD_ACCESS");
    expect(validateConflictLedgerEntries(badLineage).failures).toContain("INVALID_LINEAGE_REFERENCE");
    expect(replayMismatch.failures).toContain("REPLAY_REFERENCE_OMITTED");
  });

  it("publishes conflict ledger observability metrics", () => {
    const result = writeConflictLedger();
    const metrics = buildConflictLedgerObservability(result);

    expect(metrics.ledger_entries_written).toBe(result.entries.length);
    expect(metrics.audit_events_recorded).toBe(result.audit_events.length);
    expect(metrics.replay_references_created).toBe(result.replay_references.length);
    expect(metrics.certification_records_stored).toBe(result.certification_evidence.length);
    expect(metrics.sequence_validation_failures).toBe(0);
    expect(metrics.integrity_validation_failures).toBe(0);
    expect(metrics.tenant_distribution.tenant_alpha).toBe(result.entries.length);
  });
});
