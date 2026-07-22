import { describe, expect, it } from "vitest";
import {
  LEDGER_INTEGRITY_CHECKS,
  LEDGER_INTEGRITY_SCOPES,
  computeLedgerRecordHash,
  getLedgerIntegrityCertificationFoundation,
  replayLedgerIntegrityCertification,
  runLedgerIntegrityCertification,
} from "@/services/decision-ledger-integrity-certification";
import type { LedgerIntegrityCertificationFailure, LedgerIntegrityCertificationInput } from "@/types/decision-ledger-integrity-certification";

describe("Mission Control Phase 9.12.8 Ledger & Integrity Certification", () => {
  it("publishes the ledger integrity certification foundation", () => {
    const foundation = getLedgerIntegrityCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-ledger-integrity-certification/v1");
    expect(foundation.scopes).toEqual(LEDGER_INTEGRITY_SCOPES);
    expect(foundation.checks).toEqual(LEDGER_INTEGRITY_CHECKS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("validates immutable append-only ledger records", () => {
    const result = runLedgerIntegrityCertification();

    expect(result.immutability_report.validation_state).toBe("PASS");
    expect(result.immutability_report.ledger_records).toHaveLength(6);
    expect(result.immutability_report.ledger_records.map((record) => record.sequence_number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(result.immutability_report.ledger_records.every((record) => record.append_only && !record.deleted)).toBe(true);
  });

  it("validates reproducible record integrity hashes", () => {
    const result = runLedgerIntegrityCertification();

    expect(result.integrity_report.validation_state).toBe("PASS");
    expect(result.integrity_report.hash_reproducible).toBe(true);
    expect(result.integrity_report.tampering_detection_operational).toBe(true);
    expect(result.immutability_report.ledger_records.every((record) => computeLedgerRecordHash(record) === record.integrity_hash)).toBe(true);
  });

  it("validates lineage, audit completeness, and traceability", () => {
    const result = runLedgerIntegrityCertification();

    expect(result.lineage_report.validation_state).toBe("PASS");
    expect(result.lineage_report.certification_lineage_complete).toBe(true);
    expect(result.audit_report.validation_state).toBe("PASS");
    expect(result.audit_report.event_chronology_complete).toBe(true);
    expect(result.traceability_report.validation_state).toBe("PASS");
    expect(result.traceability_report.replay_traceability_complete).toBe(true);
  });

  it("collects immutable evidence and writes certification ledger entries", () => {
    const result = runLedgerIntegrityCertification();

    expect(result.evidence_package.complete).toBe(true);
    expect(result.evidence_package.immutable).toBe(true);
    expect(result.ledger_certification_ledger.map((entry) => entry.sequence_number)).toEqual([1, 2, 3, 4]);
    expect(result.ledger_certification_ledger.every((entry) => entry.append_only && !entry.deleted)).toBe(true);
  });

  it("approves the ledger certification report for production readiness", () => {
    const result = runLedgerIntegrityCertification();

    expect(result.ledger_report.certification_decision).toBe("PASS");
    expect(result.ledger_report.production_readiness).toBe("READY");
    expect(result.validation.append_only_enforced).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
    expect(result.validation.traceability_complete).toBe(true);
  });

  it("remains replayable and advisory-only", () => {
    const result = runLedgerIntegrityCertification();

    expect(replayLedgerIntegrityCertification(result)).toBe(true);
    expect(result.deterministic).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_ledger_records).toBe(false);
    expect(result.execution_authority_granted).toBe(false);
  });

  it.each([
    ["OPERATOR_INVALID", "OPERATOR_WORKFLOW_CERTIFICATION_INVALID"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION"],
    ["RECORD_DELETION", "RECORD_DELETION"],
    ["RECORD_MODIFICATION", "RECORD_MODIFICATION"],
    ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_VIOLATION"],
    ["HASH_MISMATCH", "HASH_MISMATCH"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILURE"],
    ["TAMPERING_UNDETECTED", "TAMPERING_UNDETECTED"],
    ["MISSING_EVIDENCE_LINEAGE", "MISSING_EVIDENCE_LINEAGE"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE_CHAIN"],
    ["MISSING_AUDIT_RECORDS", "MISSING_AUDIT_RECORDS"],
    ["INCOMPLETE_CHRONOLOGY", "INCOMPLETE_CHRONOLOGY"],
    ["MISSING_TRACEABILITY", "MISSING_TRACEABILITY"],
    ["REPLAY_LINEAGE_CORRUPTION", "REPLAY_LINEAGE_CORRUPTION"],
    ["CERTIFICATION_LINEAGE_CORRUPTION", "CERTIFICATION_LINEAGE_CORRUPTION"],
    ["CROSS_TENANT", "CROSS_TENANT_LEDGER_CONTAMINATION"],
    ["HIDDEN_RECORDS", "HIDDEN_RECORDS"],
    ["UNTRACEABLE_DECISION", "UNTRACEABLE_DECISION"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["INTEGRITY_REPLAY_MISMATCH", "INTEGRITY_REPLAY_MISMATCH"],
    ["FAIL_OPEN", "FAIL_OPEN_LEDGER_BEHAVIOR"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<LedgerIntegrityCertificationInput["scenario"]>, LedgerIntegrityCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runLedgerIntegrityCertification({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.ledger_report.production_readiness).toBe("BLOCKED");
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_ledger_records).toBe(false);
  });

  it("fails closed when the role lacks ledger visibility", () => {
    const result = runLedgerIntegrityCertification({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects ledger certification tampering", () => {
    const result = runLedgerIntegrityCertification();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayLedgerIntegrityCertification(tampered)).toBe(false);
  });
});
