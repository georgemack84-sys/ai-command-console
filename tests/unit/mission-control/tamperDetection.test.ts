import { describe, expect, it } from "vitest";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runTruthTamperScan } from "@/services/mission-control";
import type {
  TruthTamperProtectedRecord,
  TruthTamperScanRequest,
  TruthTamperType,
} from "@/services/mission-control";

function payload() {
  return { id: "truth_001", value: "original", nested: { a: 1, b: 2 } };
}

function payloadHash(value = payload()): string {
  return hashConfidenceValue("mission-control-tamper-record-canonical-hash", canonicalizeConfidenceToString(value));
}

function request(overrides: Partial<TruthTamperScanRequest> = {}): TruthTamperScanRequest {
  return {
    scan_id: "tamper_scan_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    scope: "FULL_INTEGRITY_SCAN",
    include_replay_check: true,
    include_lineage_check: true,
    include_evidence_check: true,
    include_governance_check: true,
    include_tenant_boundary_check: true,
    requested_by: "SYSTEM",
    requested_at: "2026-06-24T00:00:00.000Z",
    ...overrides,
  };
}

function record(overrides: Partial<TruthTamperProtectedRecord> = {}): TruthTamperProtectedRecord {
  return {
    protected_record_type: "TRUTH_RECORD",
    protected_record_id: "truth_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    chain_id: "chain_001",
    sequence: 1,
    expected_sequence: 1,
    parent_hash: "parent_hash_001",
    expected_parent_hash: "parent_hash_001",
    payload: payload(),
    stored_hash: payloadHash(),
    expected_hash: payloadHash(),
    evidence_refs: ["evidence_001"],
    expected_evidence_refs: ["evidence_001"],
    replay_refs: ["replay_001"],
    expected_replay_refs: ["replay_001"],
    lineage_refs: ["lineage_001"],
    expected_lineage_refs: ["lineage_001"],
    governance_refs: ["governance_001"],
    expected_governance_refs: ["governance_001"],
    recommendation_refs: ["rec_001"],
    expected_recommendation_refs: ["rec_001"],
    lifecycle_state: "ACTIVE",
    expected_lifecycle_state: "ACTIVE",
    replay_status: "REPLAY_VALID",
    governance_status: "GOVERNANCE_VALID",
    ...overrides,
  };
}

function expectTamper(overrides: Partial<TruthTamperProtectedRecord>, tamperType: TruthTamperType) {
  const result = runTruthTamperScan(request(), [record(overrides)]);
  expect(result.findings.map((finding) => finding.tamper_type)).toContain(tamperType);
  return result;
}

describe("Mission Control Phase 6I.3 Tamper Detection", () => {
  it("unchanged record validates clean", () => {
    const result = runTruthTamperScan(request(), [record()]);
    expect(result.detection_state).toBe("CLEAN");
    expect(result.certification_blocked).toBe(false);
  });

  it("changed content detected", () => {
    const result = expectTamper({ payload: { ...payload(), value: "mutated" } }, "CONTENT_MUTATION");
    expect(result.detection_state).toBe("TAMPERED");
  });

  it("changed metadata detected through lifecycle supersession", () => {
    const result = expectTamper({ lifecycle_state: "SUPERSEDED", supersession_authorized: false }, "UNAUTHORIZED_SUPERSESSION");
    expect(result.escalation_required).toBe(true);
  });

  it("changed evidence reference detected", () => {
    expectTamper({ evidence_refs: ["evidence_other"] }, "EVIDENCE_REFERENCE_DRIFT");
  });

  it("changed replay reference detected", () => {
    const result = expectTamper({ replay_refs: ["replay_other"] }, "REPLAY_DIVERGENCE");
    expect(result.findings.some((finding) => finding.replay_status === "REPLAY_MISMATCH")).toBe(true);
  });

  it("changed governance reference detected", () => {
    const result = expectTamper({ governance_refs: ["governance_other"] }, "GOVERNANCE_REFERENCE_DRIFT");
    expect(result.findings.some((finding) => finding.governance_status === "GOVERNANCE_VIOLATED")).toBe(true);
  });

  it("record hash mismatch detected", () => {
    expectTamper({ stored_hash: "stored_hash_changed" }, "HASH_MISMATCH");
  });

  it("parent hash mismatch detected", () => {
    const result = expectTamper({ parent_hash: "wrong_parent_hash" }, "CHAIN_BREAK");
    expect(result.findings.some((finding) => finding.severity === "CRITICAL")).toBe(true);
  });

  it("broken chain detected", () => {
    expectTamper({ expected_parent_hash: "expected_parent", parent_hash: "observed_parent" }, "CHAIN_BREAK");
  });

  it("deleted record detected", () => {
    expectTamper({ missing: true }, "RECORD_DELETION");
  });

  it("inserted record detected", () => {
    expectTamper({ inserted: true, protected_record_id: "truth_inserted" }, "RECORD_INSERTION");
  });

  it("reordered record detected", () => {
    expectTamper({ sequence: 3, expected_sequence: 2 }, "CHAIN_REORDERING");
  });

  it("duplicate record detected", () => {
    expectTamper({ duplicate: true }, "DUPLICATE_RECORD");
  });

  it("lineage drift detected", () => {
    expectTamper({ lineage_refs: ["lineage_other"] }, "LINEAGE_DRIFT");
  });

  it("replay divergence detected", () => {
    expectTamper({ replay_status: "REPLAY_MISMATCH", replay_refs: ["replay_other"] }, "REPLAY_DIVERGENCE");
  });

  it("tenant boundary drift detected", () => {
    const result = expectTamper({ tenant_id: "tenant_beta" }, "TENANT_BOUNDARY_DRIFT");
    expect(result.escalation_required).toBe(true);
  });

  it("unauthorized supersession detected", () => {
    expectTamper({ unauthorized_supersession: true }, "UNAUTHORIZED_SUPERSESSION");
  });

  it("unauthorized write detected", () => {
    expectTamper({ unauthorized_write: true }, "UNAUTHORIZED_WRITE");
  });

  it("archive mismatch detected", () => {
    expectTamper({ protected_record_type: "ARCHIVAL_RECORD", archival_hash: "archive_wrong_hash" }, "ARCHIVAL_MISMATCH");
  });

  it("archive manifest missing is incomplete", () => {
    const result = runTruthTamperScan(request(), [record({ protected_record_type: "ARCHIVAL_RECORD", archive_manifest_present: false })]);
    expect(result.findings.map((finding) => finding.detection_state)).toContain("INCOMPLETE");
  });

  it("index mismatch detected as suspect", () => {
    const result = expectTamper({ index_record_hash: "index_wrong_hash" }, "INDEX_MISMATCH");
    expect(result.findings.some((finding) => finding.detection_state === "SUSPECT")).toBe(true);
  });

  it("unverifiable record fails closed", () => {
    const result = runTruthTamperScan(request(), [record({ stored_hash: undefined, expected_hash: undefined })]);
    expect(result.findings.map((finding) => finding.detection_state)).toContain("UNVERIFIABLE");
    expect(result.certification_blocked).toBe(true);
  });

  it("invalid scan request fails closed", () => {
    const result = runTruthTamperScan(request({ scan_id: "" }), [record()]);
    expect(result.detection_state).toBe("INVALID");
  });

  it("canonicalization failure is invalid", () => {
    const result = runTruthTamperScan(request(), [record({ canonicalization_failed: true })]);
    expect(result.detection_state).toBe("INVALID");
  });

  it("unknown integrity state is unverifiable", () => {
    const result = runTruthTamperScan(request(), [record({ unknown_integrity_state: true })]);
    expect(result.findings.map((finding) => finding.detection_state)).toContain("UNVERIFIABLE");
  });

  it("tampered record blocks certification", () => {
    const result = expectTamper({ payload: { ...payload(), value: "mutated" } }, "CONTENT_MUTATION");
    expect(result.certification_blocked).toBe(true);
  });

  it("clean record remains certifiable", () => {
    const result = runTruthTamperScan(request(), [record()]);
    expect(result.certification_blocked).toBe(false);
  });

  it("tamper finding recorded append-only", () => {
    const result = expectTamper({ payload: { ...payload(), value: "mutated" } }, "CONTENT_MUTATION");
    expect(result.appendOnly).toBe(true);
    expect(result.ledger_records[0].finding_record_id).toContain("tamper_finding_record");
  });

  it("critical tamper triggers escalation", () => {
    const result = expectTamper({ parent_hash: "wrong_parent_hash" }, "CHAIN_BREAK");
    expect(result.escalation_required).toBe(true);
    expect(result.operator_review_required).toBe(true);
  });

  it("tamper scan is deterministic", () => {
    const first = runTruthTamperScan(request(), [record()]);
    const second = runTruthTamperScan(request(), [record()]);
    expect(first.scan_hash).toBe(second.scan_hash);
  });

  it("reordered object keys do not alter clean scan", () => {
    const result = runTruthTamperScan(request(), [record({ payload: { nested: { b: 2, a: 1 }, value: "original", id: "truth_001" } })]);
    expect(result.detection_state).toBe("CLEAN");
  });

  it("source mutation is forbidden by result contract", () => {
    const result = runTruthTamperScan(request(), [record()]);
    expect(result.sourceMutationAllowed).toBe(false);
  });
});
