import { describe, expect, it } from "vitest";
import {
  IMMUTABLE_LEDGER_TYPES,
  commitImmutableDecisionLedger,
  computeImmutableLedgerRecordHash,
  getImmutableDecisionLedgerFoundation,
  queryImmutableDecisionLedger,
} from "@/services/immutable-decision-ledger";

describe("Mission Control Phase 9.10.8 Immutable Decision Ledger", () => {
  it("publishes the immutable decision ledger foundation", () => {
    const foundation = getImmutableDecisionLedgerFoundation();

    expect(foundation.ledger_version).toBe("immutable-decision-ledger/v1");
    expect(foundation.ledger_types).toEqual(IMMUTABLE_LEDGER_TYPES);
    expect(foundation.result.certification_ready).toBe(true);
  });

  it("commits every required ledger record type", () => {
    const result = commitImmutableDecisionLedger();

    expect(result.records.map((record) => record.ledger_type)).toEqual(IMMUTABLE_LEDGER_TYPES);
    expect(result.commits.every((commit) => commit.commit_status === "COMMITTED")).toBe(true);
    expect(result.records.every((record) => record.lifecycle_state === "COMMITTED")).toBe(true);
  });

  it("enforces deterministic ordering, lineage, and reproducible hashes", () => {
    const first = commitImmutableDecisionLedger();
    const second = commitImmutableDecisionLedger();

    expect(second).toEqual(first);
    expect(first.records.every((record, index) => record.commit_sequence === index + 1)).toBe(true);
    expect(first.records.slice(1).every((record) => record.parent_record_refs.length === 1)).toBe(true);
    expect(first.records.every((record) => computeImmutableLedgerRecordHash(record) === record.integrity_hash)).toBe(true);
  });

  it("provides deterministic read-only query results", () => {
    const result = commitImmutableDecisionLedger();
    const replay = queryImmutableDecisionLedger(result.records, "REPLAY_HISTORY");
    const audit = queryImmutableDecisionLedger(result.records, "AUDIT_HISTORY");
    const integrity = queryImmutableDecisionLedger(result.records, "INTEGRITY_HISTORY");
    const certification = queryImmutableDecisionLedger(result.records, "CERTIFICATION_EVIDENCE");

    expect(replay.matching_records).toHaveLength(3);
    expect(audit.matching_records[0]?.ledger_type).toBe("AUDIT_REPORT");
    expect(integrity.matching_records[0]?.ledger_type).toBe("INTEGRITY_VERIFICATION");
    expect(certification.matching_records[0]?.ledger_type).toBe("CERTIFICATION_EVIDENCE");
    expect(replay.read_only).toBe(true);
  });

  it("preserves append-only, read-only, advisory, and non-mutating boundaries", () => {
    const result = commitImmutableDecisionLedger();

    expect(result.append_only).toBe(true);
    expect(result.read_only_queries).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_history).toBe(false);
  });

  it.each([
    ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_VIOLATION"],
    ["MODIFICATION_ATTEMPT", "RECORD_MODIFICATION_ATTEMPT"],
    ["DELETION_ATTEMPT", "RECORD_DELETION_ATTEMPT"],
    ["REPLACEMENT_ATTEMPT", "RECORD_REPLACEMENT_ATTEMPT"],
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["BROKEN_LINEAGE", "LINEAGE_BROKEN"],
    ["DUPLICATE_RECORD", "DUPLICATE_RECORD_IDENTITY"],
    ["UNSUPPORTED_TYPE", "UNSUPPORTED_LEDGER_TYPE"],
    ["UNSUPPORTED_SCHEMA", "UNSUPPORTED_SCHEMA_VERSION"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATION"],
    ["INCOMPLETE_VALIDATION", "INCOMPLETE_VALIDATION"],
    ["UNKNOWN_LIFECYCLE", "UNKNOWN_LIFECYCLE_STATE"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const result = commitImmutableDecisionLedger({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.certification_ready).toBe(false);
    expect(result.commits.every((commit) => commit.commit_status === "REJECTED")).toBe(true);
  });
});
