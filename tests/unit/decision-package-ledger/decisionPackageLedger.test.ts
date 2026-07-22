import { describe, expect, it } from "vitest";
import { generateRollbackRecoveryReplayReferences } from "@/services/rollback-recovery-replay-references";
import {
  DECISION_PACKAGE_LEDGER_STATES,
  commitDecisionPackageLedger,
  computeDecisionPackageLedgerRecordHash,
  computeImmutablePackageRecordHash,
  computeLedgerIndexRecordHash,
  computeReplayRegistryRecordHash,
  computeVersionHistoryRecordHash,
  createDecisionPackageLedgerRecord,
  createImmutablePackageRecord,
  createLedgerIndexRecord,
  createReplayRegistryRecord,
  createVersionHistoryRecord,
  getDecisionPackageLedgerFoundation,
  replayDecisionPackageLedger,
} from "@/services/decision-package-ledger";

describe("Mission Control Phase 9.8.10 Decision Package Ledger", () => {
  it("publishes the decision package ledger foundation", () => {
    const foundation = getDecisionPackageLedgerFoundation();

    expect(foundation.ledger_version).toBe("decision-package-ledger/v1");
    expect(foundation.ledger_states).toEqual(DECISION_PACKAGE_LEDGER_STATES);
    expect(foundation.result.ledger_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("commits deterministic immutable ledger records without modifying the package", () => {
    const first = commitDecisionPackageLedger();
    const second = commitDecisionPackageLedger();

    expect(first).toEqual(second);
    expect(first.ledger_record.storage_status).toBe("STORED");
    expect(first.immutable_package.immutable_status).toBe("IMMUTABLE");
    expect(first.immutable_package.package_payload).toEqual(first.reference_result.package);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.immutable_ledger_entries).toHaveLength(1);
    expect(first.advisory_only).toBe(true);
  });

  it("indexes package, mission, orchestration, replay, lineage, tenant, version, and timestamp", () => {
    const result = commitDecisionPackageLedger();

    expect(result.ledger_index.package_id).toBe(result.ledger_record.package_id);
    expect(result.ledger_index.mission_id).toBe(result.ledger_record.mission_id);
    expect(result.ledger_index.orchestration_id).toBe(result.ledger_record.orchestration_id);
    expect(result.ledger_index.replay_reference).toBe(result.ledger_record.replay_reference);
    expect(result.ledger_index.lineage_reference).toBe(result.ledger_record.lineage_reference);
    expect(result.ledger_index.tenant_id).toBe(result.ledger_record.tenant_id);
    expect(result.ledger_index.package_version).toBe(result.ledger_record.package_version);
    expect(result.ledger_index.ledger_timestamp).toBe(result.ledger_record.ledger_timestamp);
  });

  it("registers replay references and preserves append-only version history", () => {
    const result = commitDecisionPackageLedger();

    expect(result.replay_registry.replay_reference).toBe(result.ledger_record.replay_reference);
    expect(result.replay_registry.replay_validation_status).toBe("VALID");
    expect(result.version_history.package_versions).toContain(result.ledger_record.package_version);
    expect(result.version_history.append_only).toBe(true);
    expect(result.audit_report.replay_registration_status).toBe("REGISTERED");
    expect(result.audit_report.version_history_status).toBe("UPDATED");
  });

  it("fails closed for package, schema, replay, lineage, append-only, version, and tenant violations", () => {
    const reference = generateRollbackRecoveryReplayReferences();
    const version = createVersionHistoryRecord(reference);
    const ledger = createDecisionPackageLedgerRecord(reference, version);
    const storage = createImmutablePackageRecord(reference);
    const replay = createReplayRegistryRecord(reference);
    const index = createLedgerIndexRecord(ledger);

    expect(commitDecisionPackageLedger({ immutable_package: { ...storage, schema_version: "bad-schema" as "operator-decision-package-schema/v1", integrity_hash: computeImmutablePackageRecordHash({ ...storage, schema_version: "bad-schema" as "operator-decision-package-schema/v1" }) } }).failures).toContain("SCHEMA_INVALID");
    expect(commitDecisionPackageLedger({ replay_registry: { ...replay, replay_reference: "", integrity_hash: computeReplayRegistryRecordHash({ ...replay, replay_reference: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(commitDecisionPackageLedger({ ledger_record: { ...ledger, lineage_reference: "", integrity_hash: computeDecisionPackageLedgerRecordHash({ ...ledger, lineage_reference: "" }) } }).failures).toContain("LINEAGE_INCOMPLETE");
    expect(commitDecisionPackageLedger({ ledger_record: { ...ledger, append_only: false as true, integrity_hash: computeDecisionPackageLedgerRecordHash({ ...ledger, append_only: false as true }) } }).failures).toContain("APPEND_ONLY_VIOLATION");
    expect(commitDecisionPackageLedger({ version_history: { ...version, package_versions: [], integrity_hash: computeVersionHistoryRecordHash({ ...version, package_versions: [] }) } }).failures).toContain("VERSION_HISTORY_INCONSISTENT");
    expect(commitDecisionPackageLedger({ ledger_index: { ...index, tenant_id: "tenant_beta", integrity_hash: computeLedgerIndexRecordHash({ ...index, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
  });

  it("rejects invalid upstream references, unauthorized access, replay divergence, advisory violations, and tampering", () => {
    const valid = commitDecisionPackageLedger();
    const badReference = { ...valid.reference_result, reference_status: "FAIL" as const };
    const badAdvisory = {
      ...valid.reference_result,
      package: {
        ...valid.reference_result.package,
        advisory_only: false as true,
      },
      advisory_only: false as true,
    };

    expect(commitDecisionPackageLedger({ reference_result: badReference }).failures).toContain("REFERENCE_PACKAGE_INVALID");
    expect(commitDecisionPackageLedger({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_LEDGER_ACCESS");
    expect(commitDecisionPackageLedger({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(commitDecisionPackageLedger({ reference_result: badAdvisory }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(commitDecisionPackageLedger({ ledger_record: { ...valid.ledger_record, storage_status: "REJECTED" } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
  });

  it("replays decision package ledger commits deterministically", () => {
    const result = commitDecisionPackageLedger();
    const replay = replayDecisionPackageLedger(result);
    const tampered = replayDecisionPackageLedger({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.ledger_record_id).toBe(result.ledger_record.ledger_record_id);
    expect(replay.version_history_reference).toBe(result.ledger_record.version_history_reference);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
