import { describe, expect, it } from "vitest";
import { generateReplayAnalyticsExplainability } from "@/services/decision-replay-analytics-explainability";
import {
  REPLAY_AUDIT_CERTIFICATION_STATES,
  computeReplayAuditCertificationTestHash,
  createAuditCertificationValidator,
  createIntegrityCertificationValidator,
  createReplayAuditCertificationEvidencePackage,
  createReplayAuditCertificationTests,
  createReplayCertificationValidator,
  getReplayAuditCertificationFoundation,
  replayReplayAuditCertification,
  runReplayAuditCertificationGate,
} from "@/services/decision-replay-audit-certification-gate";

const foundation = getReplayAuditCertificationFoundation();
const baseAnalytics = foundation.result.analytics_result;

describe("Mission Control Phase 9.10.10 Replay & Audit Certification Gate", () => {
  it("publishes the replay and audit certification foundation", () => {
    expect(foundation.certification_version).toBe("decision-replay-audit-certification-gate/v1");
    expect(foundation.certification_states).toEqual(REPLAY_AUDIT_CERTIFICATION_STATES);
    expect(foundation.result.certification_status).toBe("PASS");
    expect(foundation.result.phase_advancement_allowed).toBe(true);
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("certifies the complete Phase 9.10 replay and audit chain deterministically", () => {
    const first = runReplayAuditCertificationGate({ analytics_result: baseAnalytics });
    const second = runReplayAuditCertificationGate({ analytics_result: baseAnalytics });

    expect(second).toEqual(first);
    expect(first.certification_tests).toHaveLength(25);
    expect(first.certification_tests.every((test) => test.passed)).toBe(true);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.fail_closed).toBe(false);
  });

  it("produces replay, audit, integrity, evidence, report, record, and ledger artifacts", () => {
    const result = runReplayAuditCertificationGate({ analytics_result: baseAnalytics });

    expect(result.replay_validator.replay_outputs_identical).toBe(true);
    expect(result.audit_validator.audit_complete).toBe(true);
    expect(result.integrity_validator.integrity_verified).toBe(true);
    expect(result.evidence_package.replay_refs.length).toBeGreaterThan(0);
    expect(result.evidence_package.snapshot_refs).toHaveLength(10);
    expect(result.certification_report.certification_outcome).toBe("PASS");
    expect(result.certification_record.passed_tests).toBe(25);
    expect(result.certification_ledger[0]?.append_only).toBe(true);
  });

  it("allows conditional pass only for non-critical presentation gaps and blocks phase advancement", () => {
    const result = runReplayAuditCertificationGate({
      analytics_result: baseAnalytics,
      conditional_gaps: ["REPORTING_GAP", "DASHBOARD_PRESENTATION_GAP"],
    });

    expect(result.certification_status).toBe("CONDITIONAL_PASS");
    expect(result.failures).toEqual([]);
    expect(result.validation.validation_status).toBe("CONDITIONAL");
    expect(result.phase_advancement_allowed).toBe(false);
    expect(result.fail_closed).toBe(true);
  });

  it("fails closed for certification test failures", () => {
    const tests = createReplayAuditCertificationTests(baseAnalytics);
    const failingTest = {
      ...tests[0]!,
      actual: "FAIL" as const,
      passed: false,
      integrity_hash: computeReplayAuditCertificationTestHash({ ...tests[0]!, actual: "FAIL" as const, passed: false }),
    };
    const result = runReplayAuditCertificationGate({
      analytics_result: baseAnalytics,
      certification_tests: [failingTest, ...tests.slice(1)],
    });

    expect(result.certification_status).toBe("FAIL");
    expect(result.fail_closed).toBe(true);
    expect(result.phase_advancement_allowed).toBe(false);
    expect(result.failures).toContain("CERTIFICATION_TEST_FAILURE");
  });

  it("fails closed for replay, snapshot, trace, audit, integrity, governance, constitutional, and tenant gaps", () => {
    const replay = createReplayCertificationValidator(baseAnalytics);
    const audit = createAuditCertificationValidator(baseAnalytics);
    const integrity = createIntegrityCertificationValidator(baseAnalytics);
    const result = runReplayAuditCertificationGate({
      analytics_result: baseAnalytics,
      replay_validator: {
        ...replay,
        replay_contract_valid: false,
        replay_deterministic: false,
        replay_outputs_identical: false,
        snapshot_complete: false,
        trace_complete: false,
        replay_lineage_complete: false,
        integrity_hash: "tampered",
      },
      audit_validator: {
        ...audit,
        audit_complete: false,
        evidence_traceable: false,
        governance_documented: false,
        constitutional_documented: false,
        integrity_hash: "tampered",
      },
      integrity_validator: {
        ...integrity,
        integrity_verified: false,
        hashes_reproducible: false,
        ledger_consistent: false,
        tenant_isolation_valid: false,
        integrity_hash: "tampered",
      },
    });

    expect(result.failures).toEqual(expect.arrayContaining([
      "REPLAY_CONTRACT_INVALID",
      "REPLAY_NONDETERMINISTIC",
      "REPLAY_MISMATCH",
      "SNAPSHOT_MISSING",
      "TRACE_MISSING",
      "AUDIT_INCOMPLETE",
      "INTEGRITY_MISMATCH",
      "GOVERNANCE_VIOLATION",
      "CONSTITUTIONAL_VIOLATION",
      "IMMUTABLE_LEDGER_MUTATION",
      "EVIDENCE_INCOMPLETE",
      "REPLAY_LINEAGE_BROKEN",
      "TENANT_BOUNDARY_VIOLATION",
      "CERTIFICATION_HASH_MISMATCH",
    ]));
  });

  it("fails closed for incomplete evidence packages and immutable ledger mutation", () => {
    const evidence = createReplayAuditCertificationEvidencePackage(baseAnalytics);
    const result = runReplayAuditCertificationGate({
      analytics_result: baseAnalytics,
      evidence_package: {
        ...evidence,
        operator_refs: [],
        integrity_hash: "tampered",
      },
      certification_ledger: [{
        ledger_entry_id: "tampered_ledger",
        certification_id: evidence.certification_id,
        sequence: 1,
        certification_record_hash: "tampered",
        evidence_package_hash: "tampered",
        certification_report_hash: "tampered",
        append_only: true,
        deleted: true as false,
        integrity_hash: "tampered",
      }],
    });

    expect(result.failures).toEqual(expect.arrayContaining([
      "OPERATOR_INCONSISTENCY",
      "EVIDENCE_INCOMPLETE",
      "CERTIFICATION_EVIDENCE_INCOMPLETE",
      "IMMUTABLE_LEDGER_MUTATION",
      "CERTIFICATION_HASH_MISMATCH",
    ]));
  });

  it("fails closed when upstream analytics inherits ledger integrity, lineage, tenant, or unsupported version failures", () => {
    const integrityFailure = runReplayAuditCertificationGate({
      analytics_result: generateReplayAnalyticsExplainability({ scenario: "LEDGER_HASH_MISMATCH" }),
    });
    const lineageFailure = runReplayAuditCertificationGate({
      analytics_result: generateReplayAnalyticsExplainability({ scenario: "LEDGER_LINEAGE_GAP" }),
    });
    const tenantFailure = runReplayAuditCertificationGate({
      analytics_result: generateReplayAnalyticsExplainability({ scenario: "CROSS_TENANT" }),
    });
    const versionFailure = runReplayAuditCertificationGate({
      analytics_result: generateReplayAnalyticsExplainability({ scenario: "UNSUPPORTED_METRIC_VERSION" }),
    });

    expect(integrityFailure.failures).toContain("INTEGRITY_MISMATCH");
    expect(lineageFailure.failures).toContain("REPLAY_LINEAGE_BROKEN");
    expect(tenantFailure.failures).toContain("TENANT_BOUNDARY_VIOLATION");
    expect(versionFailure.failures).toContain("CERTIFICATION_TEST_FAILURE");
    expect(versionFailure.certification_status).toBe("FAIL");
  });

  it("rejects unknown certification outcomes", () => {
    const result = runReplayAuditCertificationGate({
      analytics_result: baseAnalytics,
      force_unknown_outcome: true,
    });

    expect(result.certification_status).toBe("FAIL");
    expect(result.failures).toContain("UNKNOWN_CERTIFICATION_OUTCOME");
    expect(result.phase_advancement_allowed).toBe(false);
  });

  it("replays certification deterministically and detects replay divergence", () => {
    const valid = runReplayAuditCertificationGate({ analytics_result: baseAnalytics });
    const replay = replayReplayAuditCertification(valid);
    const mismatch = runReplayAuditCertificationGate({
      analytics_result: baseAnalytics,
      replay_expected_hash: `${valid.replay_hash}_wrong`,
    });
    const tamperedReplay = replayReplayAuditCertification({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.certification_status).toBe("PASS");
    expect(mismatch.failures).toContain("CERTIFICATION_REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("CERTIFICATION_REPLAY_DIVERGENCE");
  });
});
