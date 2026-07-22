import { describe, expect, it } from "vitest";
import {
  OPERATOR_DECISION_WORKFLOW_CERTIFICATION_STATES,
  computeOperatorDecisionWorkflowCertificationTestHash,
  createCertificationTests,
  createGovernanceComplianceReport,
  createIntegrityVerificationReport,
  createProductionReadinessReport,
  createReplayValidationReport,
  createWorkflowCertificationReport,
  getOperatorDecisionWorkflowCertificationFoundation,
  replayOperatorDecisionWorkflowCertification,
  runOperatorDecisionWorkflowCertification,
} from "@/services/operator-decision-workflow-certification-gate";
import { buildOperatorVisibilityDashboard } from "@/services/operator-visibility-dashboard";

const foundation = getOperatorDecisionWorkflowCertificationFoundation();
const baseDashboard = foundation.result.dashboard_result;

describe("Mission Control Phase 9.9.10 Operator Decision Workflow Certification Gate", () => {
  it("publishes the certification gate foundation", () => {
    expect(foundation.certification_version).toBe("operator-decision-workflow-certification-gate/v1");
    expect(foundation.certification_states).toEqual(OPERATOR_DECISION_WORKFLOW_CERTIFICATION_STATES);
    expect(foundation.result.certification_status).toBe("PASS");
    expect(foundation.result.production_ready).toBe(true);
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("certifies the complete 9.9 workflow deterministically", () => {
    const first = runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard });
    const second = runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard });

    expect(first).toEqual(second);
    expect(first.certification_tests).toHaveLength(48);
    expect(first.certification_tests.every((test) => test.passed)).toBe(true);
    expect(first.workflow_report.workflow_ready).toBe(true);
    expect(first.production_readiness_report.production_deployment_allowed).toBe(true);
    expect(first.validation.production_ready).toBe(true);
  });

  it("produces workflow, replay, governance, operator supremacy, integrity, and readiness reports", () => {
    const result = runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard });

    expect(result.workflow_report.certified_components).toContain("WORKFLOW_CONTRACT");
    expect(result.replay_report.replay_certified).toBe(true);
    expect(result.governance_report.governance_compliant).toBe(true);
    expect(result.governance_report.constitutional_compliant).toBe(true);
    expect(result.operator_supremacy_report.operator_authority_preserved).toBe(true);
    expect(result.operator_supremacy_report.autonomous_execution_triggered).toBe(false);
    expect(result.integrity_report.immutable_evidence_preserved).toBe(true);
    expect(result.certification_evidence[0]?.append_only).toBe(true);
  });

  it("fails closed for certification test failures and production readiness blockers", () => {
    const tests = createCertificationTests(baseDashboard);
    const failingTest = { ...tests[0]!, actual: "FAIL" as const, passed: false, integrity_hash: computeOperatorDecisionWorkflowCertificationTestHash({ ...tests[0]!, actual: "FAIL" as const, passed: false }) };
    const certificationTests = [failingTest, ...tests.slice(1)];
    const readiness = createProductionReadinessReport(baseDashboard, certificationTests);
    const result = runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard, certification_tests: certificationTests, production_readiness_report: readiness });

    expect(result.certification_status).toBe("FAIL");
    expect(result.fail_closed).toBe(true);
    expect(result.production_ready).toBe(false);
    expect(result.failures).toContain("CERTIFICATION_TEST_FAILURE");
  });

  it("fails closed for replay, governance, constitutional, tenant, advisory, lineage, and integrity gaps", () => {
    const replayReport = { ...createReplayValidationReport(baseDashboard), replay_certified: false };
    const badReplayReport = { ...replayReport, integrity_hash: "tampered" };
    const governanceReport = { ...createGovernanceComplianceReport(baseDashboard), governance_compliant: false, constitutional_compliant: false, tenant_isolated: false, advisory_only: false };
    const badGovernanceReport = { ...governanceReport, integrity_hash: "tampered" };
    const integrityReport = { ...createIntegrityVerificationReport(baseDashboard), integrity_verified: false, lineage_complete: false, audit_chain_complete: false };
    const badIntegrityReport = { ...integrityReport, integrity_hash: "tampered" };
    const result = runOperatorDecisionWorkflowCertification({
      dashboard_result: baseDashboard,
      replay_report: badReplayReport,
      governance_report: badGovernanceReport,
      integrity_report: badIntegrityReport,
    });

    expect(result.failures).toEqual(expect.arrayContaining([
      "REPLAY_MISMATCHES",
      "MISSING_AUDIT_HISTORY",
      "GOVERNANCE_VIOLATIONS",
      "CONSTITUTIONAL_VIOLATIONS",
      "TENANT_ISOLATION_FAILURES",
      "ADVISORY_ONLY_VIOLATIONS",
      "INTEGRITY_HASH_MISMATCHES",
      "INCOMPLETE_LINEAGE",
    ]));
  });

  it("fails closed when dashboard visibility or upstream workflow certification fails", () => {
    const badDashboard = buildOperatorVisibilityDashboard({ authorized_operator: "" });
    const result = runOperatorDecisionWorkflowCertification({ dashboard_result: badDashboard });

    expect(result.certification_status).toBe("FAIL");
    expect(result.failures).toEqual(expect.arrayContaining(["OPERATOR_VISIBILITY_GAPS", "CERTIFICATION_TEST_FAILURE"]));
    expect(result.production_readiness_report.phase_advancement_allowed).toBe(false);
  });

  it("detects evidence immutability and report integrity tampering", () => {
    const tests = createCertificationTests(baseDashboard);
    const report = createWorkflowCertificationReport(baseDashboard, tests);
    const evidence = [{
      ...runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard }).certification_evidence[0]!,
      deleted: true as false,
    }];
    const result = runOperatorDecisionWorkflowCertification({
      dashboard_result: baseDashboard,
      workflow_report: { ...report, workflow_ready: false },
      certification_evidence: evidence,
    });

    expect(result.failures).toEqual(expect.arrayContaining(["CERTIFICATION_TEST_FAILURE", "EVIDENCE_IMMUTABILITY_FAILURE", "INTEGRITY_HASH_MISMATCHES"]));
  });

  it("replays certification deterministically and detects replay divergence", () => {
    const valid = runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard });
    const replay = replayOperatorDecisionWorkflowCertification(valid);
    const mismatch = runOperatorDecisionWorkflowCertification({ dashboard_result: baseDashboard, replay_expected_hash: `${valid.replay_hash}_wrong` });
    const tamperedReplay = replayOperatorDecisionWorkflowCertification({ ...valid, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.certification_status).toBe("PASS");
    expect(mismatch.failures).toContain("REPLAY_DIVERGENCE");
    expect(tamperedReplay.replay_valid).toBe(false);
    expect(tamperedReplay.failures).toContain("REPLAY_DIVERGENCE");
  });
});
