import { describe, expect, it } from "vitest";
import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  toTruthIntegrityOperatorVisibilityReport,
  toTruthIntegrityVerificationLedgerRecord,
  verifyTruthIntegrity,
} from "@/services/mission-control";
import type {
  TruthIntegrityVerificationOptions,
  TruthIntegrityVerificationRequest,
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

describe("Mission Control Phase 6I.4 Integrity Verification Service", () => {
  it("valid record verifies successfully", () => {
    const result = verifyTruthIntegrity(request(), [record()]);
    expect(result.verification_state).toBe("VERIFIED");
    expect(result.certification_decision).toBe("CERTIFIABLE");
  });

  it("invalid request returns INVALID", () => {
    const result = verifyTruthIntegrity(request({ verification_request_id: "" }), [record()]);
    expect(result.verification_state).toBe("INVALID");
    expect(result.certification_decision).toBe("CERTIFICATION_BLOCKED");
  });

  it("missing tenant ID fails closed", () => {
    const result = verifyTruthIntegrity(request({ tenant_id: "" }), [record()]);
    expect(result.verification_state).toBe("INVALID");
  });

  it("cross-tenant target fails verification", () => {
    const result = verifyTruthIntegrity(request(), [record({ tenant_id: "tenant_beta" })]);
    expect(result.checks.tenant_boundary_check.status).toBe("FAIL");
    expect(result.verification_state).toBe("FAILED");
  });

  it("schema-valid record passes schema check", () => {
    expect(verifyTruthIntegrity(request(), [record()]).checks.schema_check.status).toBe("PASS");
  });

  it("schema-invalid record fails schema check", () => {
    expect(verifyTruthIntegrity(request(), [record({ protected_record_id: "" })]).checks.schema_check.status).toBe("FAIL");
  });

  it("canonical hash match passes", () => {
    expect(verifyTruthIntegrity(request(), [record()]).checks.hash_check.status).toBe("PASS");
  });

  it("canonical hash mismatch fails", () => {
    const result = verifyTruthIntegrity(request(), [record({ payload: { ...payload(), value: "mutated" } })]);
    expect(result.checks.hash_check.status).toBe("FAIL");
    expect(result.verification_state).toBe("FAILED");
  });

  it("parent hash mismatch fails", () => {
    const result = verifyTruthIntegrity(request(), [record({ parent_hash: "wrong_parent_hash" })]);
    expect(result.checks.chain_check.status).toBe("FAIL");
  });

  it("chain continuity verified", () => {
    expect(verifyTruthIntegrity(request({ scope: "CHAIN_SEGMENT", target_chain_id: "chain_001" }), [record()]).checks.chain_check.status).toBe("PASS");
  });

  it("chain break blocks certification", () => {
    const result = verifyTruthIntegrity(request(), [record({ parent_hash: "wrong_parent_hash" })]);
    expect(result.certification_blocked).toBe(true);
  });

  it("tamper finding blocks certification", () => {
    const result = verifyTruthIntegrity(request(), [record({ payload: { ...payload(), value: "mutated" } })]);
    expect(result.checks.tamper_check.status).toBe("FAIL");
    expect(result.certification_blocked).toBe(true);
  });

  it("record deletion fails verification", () => {
    const result = verifyTruthIntegrity(request(), [record({ missing: true })]);
    expect(result.verification_state).toBe("INCOMPLETE");
    expect(result.certification_blocked).toBe(true);
  });

  it("record insertion fails verification", () => {
    expect(verifyTruthIntegrity(request(), [record({ inserted: true })]).verification_state).toBe("FAILED");
  });

  it("record reordering fails verification", () => {
    expect(verifyTruthIntegrity(request(), [record({ sequence: 2, expected_sequence: 1 })]).verification_state).toBe("FAILED");
  });

  it("duplicate record fails verification", () => {
    expect(verifyTruthIntegrity(request(), [record({ duplicate: true })]).verification_state).toBe("FAILED");
  });

  it("lineage-valid scope passes", () => {
    expect(verifyTruthIntegrity(request({ scope: "LINEAGE_GRAPH", lineage_graph_id: "lineage_graph_001" }), [record()]).checks.lineage_check.status).toBe("PASS");
  });

  it("lineage drift fails verification", () => {
    expect(verifyTruthIntegrity(request(), [record({ lineage_refs: ["lineage_other"] })]).checks.lineage_check.status).toBe("FAIL");
  });

  it("evidence-valid scope passes", () => {
    expect(verifyTruthIntegrity(request({ scope: "EVIDENCE_BUNDLE", evidence_bundle_id: "evidence_bundle_001" }), [record()]).checks.evidence_check.status).toBe("PASS");
  });

  it("evidence drift fails verification", () => {
    expect(verifyTruthIntegrity(request(), [record({ evidence_refs: ["evidence_other"] })]).checks.evidence_check.status).toBe("FAIL");
  });

  it("replay-valid bundle passes", () => {
    expect(verifyTruthIntegrity(request({ scope: "REPLAY_BUNDLE", replay_bundle_id: "replay_001" }), [record()]).checks.replay_check.status).toBe("PASS");
  });

  it("replay mismatch fails verification", () => {
    expect(verifyTruthIntegrity(request(), [record({ replay_refs: ["replay_other"] })]).checks.replay_check.status).toBe("FAIL");
  });

  it("governance-valid scope passes", () => {
    expect(verifyTruthIntegrity(request({ scope: "GOVERNANCE_SCOPE", governance_scope_id: "governance_001" }), [record()]).checks.governance_check.status).toBe("PASS");
  });

  it("governance drift blocks certification", () => {
    const result = verifyTruthIntegrity(request(), [record({ governance_refs: ["governance_other"] })]);
    expect(result.checks.governance_check.status).toBe("FAIL");
    expect(result.certification_blocked).toBe(true);
  });

  it("tenant boundary drift triggers escalation", () => {
    const result = verifyTruthIntegrity(request(), [record({ tenant_id: "tenant_beta" })]);
    expect(result.escalation_required).toBe(true);
  });

  it("archive-valid package passes", () => {
    expect(verifyTruthIntegrity(request({ scope: "ARCHIVE_PACKAGE", archive_package_id: "archive_001" }), [record({ protected_record_type: "ARCHIVAL_RECORD", archival_hash: payloadHash(), archive_manifest_present: true })]).checks.archive_check.status).toBe("PASS");
  });

  it("archive mismatch fails verification", () => {
    expect(verifyTruthIntegrity(request({ scope: "ARCHIVE_PACKAGE", archive_package_id: "archive_001" }), [record({ protected_record_type: "ARCHIVAL_RECORD", archival_hash: "archive_wrong_hash" })]).checks.archive_check.status).toBe("FAIL");
  });

  it("index mismatch produces degraded state", () => {
    const result = verifyTruthIntegrity(request(), [record({ index_record_hash: "index_wrong_hash" })]);
    expect(result.checks.index_check.status).toBe("WARN");
    expect(result.verification_state).toBe("DEGRADED");
  });

  it("index mismatch hiding governance failure fails", () => {
    const result = verifyTruthIntegrity(request(), [record({ index_record_hash: "index_wrong_hash", governance_status: "GOVERNANCE_VIOLATED" })]);
    expect(result.checks.index_check.status).toBe("FAIL");
    expect(result.verification_state).toBe("FAILED");
  });

  it("unverifiable state blocks certification", () => {
    const result = verifyTruthIntegrity(request(), [record({ expected_hash: undefined, stored_hash: undefined })]);
    expect(result.verification_state).toBe("UNVERIFIABLE");
    expect(result.certification_blocked).toBe(true);
  });

  it("verification result recorded append-only", () => {
    const result = verifyTruthIntegrity(request(), [record()]);
    const ledger = toTruthIntegrityVerificationLedgerRecord(result);
    expect(result.appendOnly).toBe(true);
    expect(ledger.verification_result_id).toBe(result.verification_result_id);
  });

  it("verification result hash reproducible", () => {
    expect(verifyTruthIntegrity(request(), [record()]).result_hash).toBe(verifyTruthIntegrity(request(), [record()]).result_hash);
  });

  it("operator visibility report generated", () => {
    const report = toTruthIntegrityOperatorVisibilityReport(verifyTruthIntegrity(request(), [record()]));
    expect(report.summary).toContain("VERIFIED");
    expect(report.certification_decision).toBe("CERTIFIABLE");
  });

  it("escalation generated for critical failure", () => {
    const result = verifyTruthIntegrity(request(), [record({ parent_hash: "wrong_parent_hash" })]);
    expect(result.escalation_required).toBe(true);
    expect(result.operator_review_required).toBe(true);
  });

  it("certification adapter returns correct decision", () => {
    expect(verifyTruthIntegrity(request(), [record()]).certification_decision).toBe("CERTIFIABLE");
    expect(verifyTruthIntegrity(request({ options: options({ include_archive_validation: false }) }), [record()]).certification_decision).toBe("CONDITIONAL_CERTIFICATION");
    expect(verifyTruthIntegrity(request(), [record({ payload: { ...payload(), value: "mutated" } })]).certification_decision).toBe("NOT_CERTIFIABLE");
  });

  it("verification behavior is deterministic", () => {
    const first = verifyTruthIntegrity(request(), [record()]);
    const second = verifyTruthIntegrity(request(), [record()]);
    expect(first).toEqual(second);
  });

  it("fast mode skips optional checks and is partially verified", () => {
    const result = verifyTruthIntegrity(request({ mode: "FAST", options: options({ include_chain_validation: false, include_tamper_detection: false, include_replay_validation: false, include_archive_validation: false }) }), [record()]);
    expect(result.verification_state).toBe("PARTIALLY_VERIFIED");
  });

  it("source mutation remains forbidden", () => {
    expect(verifyTruthIntegrity(request(), [record()]).sourceMutationAllowed).toBe(false);
  });
});
