import { describe, expect, it } from "vitest";

import {
  certifyAdaptiveLedger,
  getAdaptiveLedgerContract,
  replayAdaptiveLedgerCertification,
  validateAdaptiveLedgerCertification,
} from "../../../services/adaptive-ledger-certification";
import type { AdaptiveLedgerFailure, AdaptiveLedgerScenario } from "../../../types/adaptive-ledger-certification";

const failureScenarios: ReadonlyArray<readonly [AdaptiveLedgerScenario, AdaptiveLedgerFailure]> = [
  ["LEDGER_MUTATION", "LEDGER_MUTATION_DETECTED"],
  ["RECORD_DELETION", "RECORD_DELETION_DETECTED"],
  ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_VIOLATION"],
  ["INTEGRITY_HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ["BROKEN_HASH_CHAIN", "BROKEN_HASH_CHAIN"],
  ["REPLAY_REFERENCE_OMISSION", "REPLAY_REFERENCE_OMITTED"],
  ["EVIDENCE_LINKAGE_GAP", "EVIDENCE_LINKAGE_GAP"],
  ["GOVERNANCE_LINEAGE_GAP", "GOVERNANCE_LINEAGE_GAP"],
  ["CONSTITUTIONAL_LINEAGE_GAP", "CONSTITUTIONAL_LINEAGE_GAP"],
  ["ORPHANED_ENTRIES", "ORPHANED_LEDGER_ENTRIES"],
  ["REPLAY_RECONSTRUCTION_FAILURE", "REPLAY_RECONSTRUCTION_FAILED"],
  ["CROSS_TENANT_LEDGER_ACCESS", "CROSS_TENANT_LEDGER_ACCESS"],
  ["TENANT_ISOLATION_BREACH", "TENANT_ISOLATION_BREACH"],
  ["LIFECYCLE_INCONSISTENCY", "LIFECYCLE_INCONSISTENCY"],
  ["NONDETERMINISTIC_SEQUENCING", "NONDETERMINISTIC_SEQUENCING"],
  ["INCOMPLETE_AUDIT_HISTORY", "INCOMPLETE_AUDIT_HISTORY"],
  ["TAMPER_DETECTION_FAILURE", "TAMPER_DETECTION_FAILED"],
];

describe("adaptive ledger certification", () => {
  it("publishes the adaptive ledger doctrine", () => {
    const contract = getAdaptiveLedgerContract();

    expect(contract.doctrine.version).toBe("adaptive-ledger-certification/v10.15.8");
    expect(contract.doctrine.append_only_required).toBe(true);
    expect(contract.doctrine.immutable_required).toBe(true);
    expect(contract.doctrine.replay_required).toBe(true);
    expect(contract.doctrine.integrity_required).toBe(true);
    expect(contract.doctrine.tenant_isolation_required).toBe(true);
    expect(contract.doctrine.evidence_linkage_required).toBe(true);
    expect(contract.doctrine.ledgers).toEqual(expect.arrayContaining(["OutcomeObservationLedger", "AdaptiveMemoryLedger", "AdaptiveCertificationLedger"]));
    expect(contract.validation.valid).toBe(true);
  });

  it("certifies the ledger ecosystem deterministically", () => {
    const first = certifyAdaptiveLedger();
    const second = certifyAdaptiveLedger();

    expect(first.status).toBe("PASS");
    expect(first.record.certification_status).toBe("CERTIFIED");
    expect(first.append_only).toBe(true);
    expect(first.immutable).toBe(true);
    expect(first.replayable).toBe(true);
    expect(first.integrity_protected).toBe(true);
    expect(first.tenant_isolated).toBe(true);
    expect(first.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateAdaptiveLedgerCertification(first).valid).toBe(true);
    expect(replayAdaptiveLedgerCertification(first)).toBe(true);
  });

  it("validates ledger entry schema, integrity, replay, lineage, isolation, and lifecycle", () => {
    const result = certifyAdaptiveLedger();

    expect(result.certified_entry_schema.append_only_status).toBe("PASS");
    expect(result.certified_entry_schema.evidence_refs.length).toBeGreaterThan(0);
    expect(result.integrity_validation.updates_prohibited).toBe(true);
    expect(result.integrity_validation.hash_chain_continuity_verified).toBe(true);
    expect(result.replay_lineage_validation.event_ordering_deterministic).toBe(true);
    expect(result.replay_lineage_validation.replay_equivalence_maintained).toBe(true);
    expect(result.evidence_lineage_validation.truth_ledger_refs_valid).toBe(true);
    expect(result.tenant_isolation_validation.cross_tenant_access_blocked).toBe(true);
    expect(result.lifecycle_validation.orphaned_entries_absent).toBe(true);
    expect(result.lifecycle_validation.audit_continuity_verified).toBe(true);
  });

  it("emits complete ledger certification and integrity lineage reports", () => {
    const result = certifyAdaptiveLedger();

    expect(result.certification_report.production_readiness_recommendation).toBe("READY");
    expect(result.certification_report.append_only_assessment).toBe("PASS");
    expect(result.integrity_lineage_report.ledger_inventory).toHaveLength(15);
    expect(result.integrity_lineage_report.hash_chain_continuity).toBe("PASS");
    expect(result.integrity_lineage_report.audit_readiness).toBe("PASS");
    expect(result.integrity_lineage_report.certification_evidence_refs.length).toBeGreaterThan(15);
    expect(result.validation_tests).toHaveLength(24);
  });

  it.each(failureScenarios)("fails certification for %s", (scenario, failure) => {
    const result = certifyAdaptiveLedger({ scenario });
    const validation = validateAdaptiveLedgerCertification(result);

    expect(result.status).toBe("FAIL");
    expect(result.record.certification_status).toBe("REJECTED");
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(replayAdaptiveLedgerCertification(result)).toBe(false);
  });

  it("detects tampering through integrity checks", () => {
    const result = certifyAdaptiveLedger();
    const tampered = {
      ...result,
      record: {
        ...result.record,
        append_only_status: "FAIL" as const,
      },
    };

    expect(validateAdaptiveLedgerCertification(tampered).integrity_hash_valid).toBe(false);
    expect(replayAdaptiveLedgerCertification(tampered)).toBe(false);
  });
});
