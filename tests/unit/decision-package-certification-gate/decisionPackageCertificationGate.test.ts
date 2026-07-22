import { describe, expect, it } from "vitest";
import { observeDecisionPackage } from "@/services/decision-package-observability";
import {
  DECISION_PACKAGE_CERTIFICATION_STATES,
  certifyDecisionPackage,
  computeCertificationTestResultHash,
  computeDecisionPackageCertificationRecordHash,
  computeProductionReadinessReportHash,
  createDecisionPackageCertificationTests,
  createProductionReadinessReport,
  getDecisionPackageCertificationGateFoundation,
  replayDecisionPackageCertification,
} from "@/services/decision-package-certification-gate";

describe("Mission Control Phase 9.8.12 Decision Package Certification Gate", () => {
  it("publishes the decision package certification gate foundation", () => {
    const foundation = getDecisionPackageCertificationGateFoundation();

    expect(foundation.gate_version).toBe("decision-package-certification-gate/v1");
    expect(foundation.certification_states).toEqual(DECISION_PACKAGE_CERTIFICATION_STATES);
    expect(foundation.result.gate_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("certifies complete packages deterministically without modifying package artifacts", () => {
    const first = certifyDecisionPackage();
    const second = certifyDecisionPackage();

    expect(first).toEqual(second);
    expect(first.gate_status).toBe("PASS");
    expect(first.certification_record.production_readiness).toBe("READY");
    expect(first.production_readiness.deployment_recommendation).toBe("ALLOW_OPERATOR_PRESENTATION");
    expect(first.observability_result.ledger_result.immutable_package.package_payload).toEqual(first.observability_result.ledger_result.reference_result.package);
    expect(first.certification_ledger).toHaveLength(1);
  });

  it("executes all certification tests and produces validation, compliance, replay, integrity, and readiness reports", () => {
    const result = certifyDecisionPackage();

    expect(result.certification_tests).toHaveLength(23);
    expect(result.certification_tests.every((test) => test.actual_result === "PASS")).toBe(true);
    expect(result.validation.certification_status).toBe("PASS");
    expect(result.compliance_report.governance_compliance).toBe("PASS");
    expect(result.compliance_report.constitutional_compliance).toBe("PASS");
    expect(result.replay_report.replay_reproducible).toBe(true);
    expect(result.integrity_report.ledger_integrity).toBe(true);
    expect(result.production_readiness.readiness_status).toBe("READY");
  });

  it("fails closed when certification tests fail or observability is incomplete", () => {
    const observability = observeDecisionPackage();
    const tests = createDecisionPackageCertificationTests(observability);
    const badRecommendation = {
      ...tests[2]!,
      actual_result: "FAIL" as const,
      validation_status: "REJECTED" as const,
    };
    const badTests = [tests[0]!, tests[1]!, { ...badRecommendation, integrity_hash: computeCertificationTestResultHash(badRecommendation) }, ...tests.slice(3)];
    const badObservability = { ...observability, observability_status: "FAIL" as const };

    expect(certifyDecisionPackage({ certification_tests: badTests }).failures).toContain("RECOMMENDATION_RATIONALE_MISSING");
    expect(certifyDecisionPackage({ observability_result: badObservability }).failures).toContain("OBSERVABILITY_INCOMPLETE");
  });

  it("rejects unauthorized access, replay divergence, tenant mismatch, advisory violation, and tampering", () => {
    const valid = certifyDecisionPackage();
    const record = valid.certification_record;
    const readiness = createProductionReadinessReport(valid.observability_result, []);

    expect(certifyDecisionPackage({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_CERTIFICATION_GATE_ACCESS");
    expect(certifyDecisionPackage({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
    expect(certifyDecisionPackage({ certification_record: { ...record, tenant_id: "tenant_beta", integrity_hash: computeDecisionPackageCertificationRecordHash({ ...record, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_ISOLATION_VIOLATED");
    expect(certifyDecisionPackage({ certification_record: { ...record, advisory_only: false as true, integrity_hash: computeDecisionPackageCertificationRecordHash({ ...record, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_GUARANTEE_VIOLATED");
    expect(certifyDecisionPackage({ production_readiness: { ...readiness, readiness_status: "BLOCKED", integrity_hash: computeProductionReadinessReportHash({ ...readiness, readiness_status: "BLOCKED" }) } }).failures).toContain("UNAUTHORIZED_EXECUTION_BEHAVIOR");
    expect(certifyDecisionPackage({ certification_record: { ...record, production_readiness: "BLOCKED" } }).failures).toContain("INTEGRITY_HASH_UNREPRODUCIBLE");
  });

  it("replays decision package certification deterministically", () => {
    const result = certifyDecisionPackage();
    const replay = replayDecisionPackageCertification(result);
    const tampered = replayDecisionPackageCertification({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.certification_id).toBe(result.certification_record.certification_id);
    expect(replay.certification_outcome).toBe(result.gate_status);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
