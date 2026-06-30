import { describe, expect, it } from "vitest";
import {
  buildPolicyIntelligenceCertification,
  buildPolicyIntelligenceCertificationDoctrine,
  buildPolicyIntelligenceCertificationObservabilitySurface,
  buildPolicyIntelligenceCertificationReport,
  collectPolicyIntelligenceCertificationSources,
  computePolicyIntelligenceCertificationHash,
  replayPolicyIntelligenceCertification,
  runPolicyIntelligenceCertificationTests,
  validatePolicyIntelligenceCertification,
  writePolicyIntelligenceCertificationLedgerRecord,
} from "@/services/policy-intelligence-certification";
import type { PolicyIntelligenceCertification } from "@/types/policy-intelligence-certification";

function certification(overrides: Partial<PolicyIntelligenceCertification> = {}) {
  return { ...buildPolicyIntelligenceCertification(), ...overrides };
}

describe("Mission Control Phase 7B.5 Policy Intelligence Certification Gate", () => {
  it("defines fail-closed certification doctrine", () => {
    const doctrine = buildPolicyIntelligenceCertificationDoctrine();
    expect(doctrine.principles).toContain("contract-bound");
    expect(doctrine.principles).toContain("operator-explainable");
    expect(doctrine.critical_failure_reasons).toContain("REPLAY_MISMATCH");
    expect(doctrine.certification_categories).toHaveLength(12);
  });

  it("collects all required 7B sources", () => {
    const sources = collectPolicyIntelligenceCertificationSources();
    expect(sources.policy_analysis.policy_analysis_id).toBeTruthy();
    expect(sources.policy_correlations.length).toBeGreaterThan(0);
    expect(sources.policy_graph.policy_graph_id).toBeTruthy();
    expect(sources.policy_impact.policy_impact_id).toBeTruthy();
  });

  it("runs all certification categories", () => {
    const results = runPolicyIntelligenceCertificationTests();
    expect(results).toHaveLength(12);
    expect(results.every((result) => result.actual_result === "PASS")).toBe(true);
    expect(results.map((result) => result.test_category)).toContain("TENANT_IDENTITY_TRUTH_VALIDATION");
  }, 30000);

  it("builds a PASS certification record", () => {
    const record = buildPolicyIntelligenceCertification();
    expect(record.schema_version).toBe("policy-intelligence-certification/v7B.5");
    expect(record.certification_state).toBe("PASS");
    expect(record.lifecycle_state).toBe("CERTIFIED");
    expect(record.validation_failures).toEqual([]);
  }, 30000);

  it("builds a CONDITIONAL_PASS certification record for non-critical findings", () => {
    const record = buildPolicyIntelligenceCertification(collectPolicyIntelligenceCertificationSources(), true);
    expect(record.certification_state).toBe("CONDITIONAL_PASS");
    expect(record.lifecycle_state).toBe("CONDITIONALLY_CERTIFIED");
    expect(record.conditional_findings[0]!.risk_level).toBe("LOW");
  }, 30000);

  it("validates certification records and detects missing contract fields", () => {
    expect(validatePolicyIntelligenceCertification(certification()).validation_state).toBe("PASS");
    expect(validatePolicyIntelligenceCertification(certification({ policy_certification_id: "" })).failures.some((failure) => failure.reason === "MISSING_POLICY_CONTRACT")).toBe(true);
    expect(validatePolicyIntelligenceCertification(certification({ certification_state: "UNKNOWN" as never })).failures.some((failure) => failure.reason === "INVALID_CERTIFICATION_STATE")).toBe(true);
  }, 30000);

  it("detects tenant isolation, truth, replay, identity, and hash failures", () => {
    const record = certification();
    expect(validatePolicyIntelligenceCertification({ ...record, tenant_id: "tenant_beta" }).failures.some((failure) => failure.reason === "TENANT_ISOLATION_FAILURE")).toBe(true);
    expect(validatePolicyIntelligenceCertification({ ...record, truth_record_refs: [] }).failures.some((failure) => failure.reason === "TRUTH_LINEAGE_MISMATCH")).toBe(true);
    expect(validatePolicyIntelligenceCertification({ ...record, replay_refs: { ...record.replay_refs, certification_output_hash: "" } }).failures.some((failure) => failure.reason === "REPLAY_MISMATCH")).toBe(true);
    expect(validatePolicyIntelligenceCertification({ ...record, policy_certification_id: "pic_mutated" }, record).failures.some((failure) => failure.reason === "IDENTIFIER_MUTATION")).toBe(true);
    expect(validatePolicyIntelligenceCertification({ ...record, certification_hash: "tampered" }).failures.some((failure) => failure.reason === "CERTIFICATION_HASH_MISMATCH")).toBe(true);
  }, 30000);

  it("produces stable certification hashes and replay", () => {
    const record = certification();
    expect(computePolicyIntelligenceCertificationHash(record)).toBe(record.certification_hash);
    const replay = replayPolicyIntelligenceCertification(record);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_hash).toBe(record.certification_hash);
  }, 30000);

  it("detects replay mismatch", () => {
    const base = certification();
    const record = { ...base, replay_refs: { ...base.replay_refs, certification_output_hash: "mismatch" } };
    const replay = replayPolicyIntelligenceCertification(record);
    expect(replay.validation_state).toBe("FAIL");
    expect(replay.failure_reason).toBe("CERTIFICATION_HASH_MISMATCH");
  }, 30000);

  it("generates operator certification reports", () => {
    const report = buildPolicyIntelligenceCertificationReport(certification());
    expect(report.certification_state).toBe("PASS");
    expect(report.failed_tests).toBe(0);
    expect(report.exit_readiness_statement).toContain("Phase 7B is ready");
  }, 30000);

  it("writes deterministic Truth Ledger certification records", () => {
    const record = certification();
    const ledger = writePolicyIntelligenceCertificationLedgerRecord(record);
    expect(ledger.event_type).toBe("POLICY_INTELLIGENCE_CERTIFICATION");
    expect(ledger.certification_hash).toBe(record.certification_hash);
    expect(ledger.operator_visibility).toBe("operator_visible");
  }, 30000);

  it("builds operator observability surface", () => {
    const surface = buildPolicyIntelligenceCertificationObservabilitySurface(certification());
    expect(surface.certification_state).toBe("PASS");
    expect(surface.failed_tests).toEqual([]);
    expect(surface.tenant_isolation_status).toBe("PRESERVED");
    expect(surface.governance_compliance_status).toBe("PRESERVED");
  }, 30000);
});
