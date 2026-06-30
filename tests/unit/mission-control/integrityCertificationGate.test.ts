import { describe, expect, it } from "vitest";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  certifyTruthIntegrity,
  toTruthIntegrityCertificationLedgerRecord,
  toTruthIntegrityCertificationOperatorVisibilityReport,
  verifyTruthIntegrity,
} from "@/services/mission-control";
import type {
  TruthIntegrityCertificationGateInput,
  TruthIntegrityVerificationOptions,
  TruthIntegrityVerificationRequest,
  TruthIntegrityVerificationResult,
  TruthTamperProtectedRecord,
} from "@/services/mission-control";

function payload() {
  return { id: "truth_001", value: "original", nested: { a: 1, b: 2 } };
}

function payloadHash(value = payload()) {
  return hashConfidenceValue("mission-control-tamper-record-canonical-hash", canonicalizeConfidenceToString(value));
}

function options(overrides: Partial<TruthIntegrityVerificationOptions> = {}): TruthIntegrityVerificationOptions {
  return {
    include_schema_validation: true,
    include_hash_validation: true,
    include_chain_validation: true,
    include_tamper_detection: true,
    include_lineage_validation: true,
    include_replay_validation: true,
    include_evidence_validation: true,
    include_governance_validation: true,
    include_tenant_boundary_validation: true,
    include_archive_validation: true,
    include_index_validation: true,
    fail_closed: true,
    ...overrides,
  };
}

function request(overrides: Partial<TruthIntegrityVerificationRequest> = {}): TruthIntegrityVerificationRequest {
  return {
    verification_request_id: "ivreq_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    scope: "SINGLE_RECORD",
    trigger: "ON_CERTIFICATION",
    mode: "CERTIFICATION",
    target_record_id: "truth_001",
    requested_by: "CERTIFICATION_GATE",
    requested_at: "2026-06-24T00:00:00.000Z",
    options: options(),
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
    lifecycle_state: "ACTIVE",
    expected_lifecycle_state: "ACTIVE",
    replay_status: "REPLAY_VALID",
    governance_status: "GOVERNANCE_VALID",
    ...overrides,
  };
}

function gateInput(result: TruthIntegrityVerificationResult, overrides: Partial<TruthIntegrityCertificationGateInput> = {}): TruthIntegrityCertificationGateInput {
  return {
    certification_request_id: "icg_req_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_truth_001",
    certification_scope: "SINGLE_RECORD",
    target_record_ids: ["truth_001"],
    verification_result_ids: [result.verification_result_id],
    requested_by: "CERTIFICATION_GATE",
    requested_at: "2026-06-24T00:00:00.000Z",
    require_full_verification: false,
    allow_degraded_state: true,
    fail_closed: true,
    ...overrides,
  };
}

function verified(overrides: Partial<TruthTamperProtectedRecord> = {}, requestOverrides: Partial<TruthIntegrityVerificationRequest> = {}) {
  return verifyTruthIntegrity(request(requestOverrides), [record(overrides)]);
}

function certify(result: TruthIntegrityVerificationResult, overrides: Partial<TruthIntegrityCertificationGateInput> = {}) {
  return certifyTruthIntegrity(gateInput(result, overrides), [result]);
}

describe("Mission Control Phase 6I.5 Integrity Certification Gate", () => {
  it("fully verified record returns VALID", () => {
    const result = certify(verified());
    expect(result.state).toBe("VALID");
    expect(result.certification_allowed).toBe(true);
  });

  it("fully verified chain returns VALID", () => {
    const verification = verified({}, { scope: "CHAIN_SEGMENT", target_chain_id: "chain_001" });
    const result = certify(verification, { certification_scope: "CHAIN_SEGMENT", target_chain_ids: ["chain_001"], target_record_ids: undefined });
    expect(result.state).toBe("VALID");
  });

  it("fully verified tenant ledger returns VALID", () => {
    const verification = verified({}, { scope: "TENANT_LEDGER", target_record_ids: ["truth_001"] });
    const result = certify(verification, { certification_scope: "TENANT_LEDGER" });
    expect(result.state).toBe("VALID");
  });

  it("optional archive check skipped returns DEGRADED", () => {
    const verification = verified({}, { options: options({ include_archive_validation: false }) });
    const result = certify(verification);
    expect(result.state).toBe("DEGRADED");
    expect(result.degraded_categories).toContain("Archive Integrity");
  });

  it("stale derived index returns DEGRADED", () => {
    const result = certify(verified({ index_record_hash: "stale_hash" }));
    expect(result.state).toBe("DEGRADED");
    expect(result.degraded_categories).toContain("Index Integrity");
  });

  it("non-critical metadata warning returns DEGRADED", () => {
    const result = certify(verified({ index_record_hash: "read_model_lag" }));
    expect(result.state).toBe("DEGRADED");
    expect(result.warnings.some((warning) => warning.includes("Derived index"))).toBe(true);
  });

  it("partial verification returns DEGRADED when allowed", () => {
    const verification = verified({}, { options: options({ include_replay_validation: false }) });
    expect(certify(verification).state).toBe("DEGRADED");
  });

  it("partial verification returns CORRUPTED when full verification required", () => {
    const verification = verified({}, { options: options({ include_archive_validation: false }) });
    const result = certify(verification, { require_full_verification: true });
    expect(result.state).toBe("CORRUPTED");
  });

  it("hash mismatch returns CORRUPTED", () => {
    expect(certify(verified({ payload: { ...payload(), value: "mutated" } })).state).toBe("CORRUPTED");
  });

  it("parent hash mismatch returns CORRUPTED", () => {
    expect(certify(verified({ parent_hash: "wrong_parent" })).state).toBe("CORRUPTED");
  });

  it("chain break returns CORRUPTED", () => {
    const result = certify(verified({ expected_sequence: 1, sequence: 3 }));
    expect(result.failed_categories).toContain("Chain Integrity");
    expect(result.state).toBe("CORRUPTED");
  });

  it("record deletion returns CORRUPTED", () => {
    expect(certify(verified({ missing: true })).state).toBe("CORRUPTED");
  });

  it("record insertion returns CORRUPTED", () => {
    expect(certify(verified({ inserted: true })).state).toBe("CORRUPTED");
  });

  it("record reordering returns CORRUPTED", () => {
    expect(certify(verified({ sequence: 2, expected_sequence: 1 })).state).toBe("CORRUPTED");
  });

  it("duplicate record conflict returns CORRUPTED", () => {
    expect(certify(verified({ duplicate: true })).state).toBe("CORRUPTED");
  });

  it("tamper finding returns CORRUPTED", () => {
    expect(certify(verified(), { tamper_finding_ids: ["tamper_find_001"] }).state).toBe("CORRUPTED");
  });

  it("lineage drift returns CORRUPTED", () => {
    expect(certify(verified({ lineage_refs: ["lineage_other"] })).state).toBe("CORRUPTED");
  });

  it("evidence mutation returns CORRUPTED", () => {
    expect(certify(verified({ evidence_refs: ["evidence_other"] })).state).toBe("CORRUPTED");
  });

  it("replay mismatch returns CORRUPTED", () => {
    expect(certify(verified({ replay_refs: ["replay_other"] })).state).toBe("CORRUPTED");
  });

  it("governance drift returns CORRUPTED", () => {
    expect(certify(verified({ governance_refs: ["governance_other"] })).state).toBe("CORRUPTED");
  });

  it("tenant boundary drift returns CORRUPTED", () => {
    const result = certify(verified({ tenant_id: "tenant_beta" }));
    expect(result.state).toBe("CORRUPTED");
    expect(result.escalation_required).toBe(true);
  });

  it("archive hash mismatch returns CORRUPTED", () => {
    const verification = verified({ protected_record_type: "ARCHIVAL_RECORD", archival_hash: "wrong_archive_hash", archive_manifest_present: true }, { scope: "ARCHIVE_PACKAGE", archive_package_id: "archive_001" });
    expect(certify(verification, { certification_scope: "ARCHIVE_PACKAGE", archive_package_ids: ["archive_001"], target_record_ids: undefined }).state).toBe("CORRUPTED");
  });

  it("missing required verification result returns CORRUPTED", () => {
    const result = certifyTruthIntegrity(gateInput(verified(), { verification_result_ids: ["missing_ivr"] }), []);
    expect(result.state).toBe("CORRUPTED");
    expect(result.failed_categories).toContain("Certification Result Integrity");
  });

  it("unverifiable required state returns CORRUPTED", () => {
    expect(certify(verified({ expected_hash: undefined, stored_hash: undefined })).state).toBe("CORRUPTED");
  });

  it("invalid certification input returns CORRUPTED", () => {
    const result = certify(verified(), { certification_request_id: "", target_record_ids: undefined });
    expect(result.state).toBe("CORRUPTED");
    expect(result.failed_categories).toContain("Contract Integrity");
  });

  it("degraded guardrail blocks serious failure downgrade", () => {
    const result = certify(verified({ payload: { ...payload(), value: "mutated" } }), { allow_degraded_state: true });
    expect(result.state).toBe("CORRUPTED");
    expect(result.conditional_certification_allowed).toBe(false);
  });

  it("certification result written append-only", () => {
    const input = gateInput(verified());
    const result = certifyTruthIntegrity(input, [verified()]);
    const ledger = toTruthIntegrityCertificationLedgerRecord(result, input);
    expect(ledger.appendOnly).toBe(true);
    expect(ledger.sourceMutationAllowed).toBe(false);
    expect(ledger.certification_result_id).toBe(result.certification_result_id);
  });

  it("certification result hash reproducible", () => {
    expect(certify(verified()).result_hash).toBe(certify(verified()).result_hash);
  });

  it("previous certification hash linked", () => {
    const input = gateInput(verified());
    const result = certifyTruthIntegrity(input, [verified()], "previous_hash_001");
    const ledger = toTruthIntegrityCertificationLedgerRecord(result, input, "previous_hash_001");
    expect(ledger.previous_certification_hash).toBe("previous_hash_001");
  });

  it("operator visibility report generated", () => {
    const report = toTruthIntegrityCertificationOperatorVisibilityReport(certify(verified()));
    expect(report.summary).toContain("VALID");
    expect(report.replay_status).toBe("ALLOWED");
  });

  it("governance escalation generated for corrupted state", () => {
    const result = certify(verified({ governance_refs: ["governance_other"] }));
    expect(result.governance_review_required).toBe(true);
    expect(result.escalation_required).toBe(true);
  });

  it("replay permission denied for corrupted state", () => {
    expect(certify(verified({ replay_refs: ["replay_other"] })).replay_allowed).toBe(false);
  });

  it("certification decision replay is deterministic", () => {
    const verification = verified({ index_record_hash: "stale_hash" });
    const first = certify(verification);
    const second = certify(verification);
    expect(first).toEqual(second);
  });
});
