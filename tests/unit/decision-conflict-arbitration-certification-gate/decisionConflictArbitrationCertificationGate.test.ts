import { describe, expect, it } from "vitest";
import {
  CERTIFICATION_REPORT_TYPES,
  certifyDecisionConflictArbitration,
  getDecisionConflictArbitrationCertificationFoundation,
  replayDecisionConflictArbitrationCertification,
} from "@/services/decision-conflict-arbitration-certification-gate";
import { writeConflictLedger, computeConflictLedgerEntryHash } from "@/services/decision-conflict-ledger";
import { enforceConstitutionAndGovernance } from "@/services/decision-constitutional-governance-enforcement";
import { getTradeoffExplanationGeneratorFoundation } from "@/services/decision-tradeoff-explanation-generator";

describe("Mission Control Phase 9.6.10 Decision Conflict Arbitration Certification Gate", () => {
  it("publishes the final Phase 9.6 certification foundation", () => {
    const foundation = getDecisionConflictArbitrationCertificationFoundation();

    expect(foundation.certification_version).toBe("decision-conflict-arbitration-certification-gate/v1");
    expect(foundation.report_types).toEqual(CERTIFICATION_REPORT_TYPES);
    expect(foundation.result.certification_outcome).toBe("PASS");
    expect(foundation.result.production_ready).toBe(true);
    expect(foundation.result.phase_advancement_authorized).toBe(true);
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("executes the certification matrix and produces all required reports", () => {
    const result = certifyDecisionConflictArbitration();

    expect(result.tests.length).toBeGreaterThan(30);
    expect(result.tests.every((test) => test.actual === "PASS")).toBe(true);
    expect(result.reports.map((report) => report.report_type)).toEqual(CERTIFICATION_REPORT_TYPES);
    expect(result.certification_ledger).toHaveLength(1);
    expect(result.certification_ledger[0].production_ready).toBe(true);
  });

  it("publishes certification observability metrics from certification records", () => {
    const result = certifyDecisionConflictArbitration();

    expect(result.observability.tests_executed).toBe(result.tests.length);
    expect(result.observability.tests_passed).toBe(result.tests.length);
    expect(result.observability.tests_failed).toBe(0);
    expect(result.observability.replay_validation_success_rate).toBe(1);
    expect(result.observability.governance_compliance_rate).toBe(1);
    expect(result.observability.constitutional_compliance_rate).toBe(1);
    expect(result.observability.production_readiness_score).toBe(1);
  });

  it("fails closed for unauthorized certification access and replay mismatches", () => {
    const valid = certifyDecisionConflictArbitration();

    expect(certifyDecisionConflictArbitration({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_CERTIFICATION_ACCESS");
    expect(certifyDecisionConflictArbitration({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("fails closed for governance bypass and constitutional violations", () => {
    const ledger = writeConflictLedger();
    const governanceBypass = ledger.entries.map((entry, index) => index === 0 ? { ...entry, governance_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, governance_refs: [] }) } : entry);
    const constitutionalViolation = ledger.entries.map((entry, index) => index === 0 ? { ...entry, constitutional_refs: ["constitutional_violation_operator_bypass"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, constitutional_refs: ["constitutional_violation_operator_bypass"] }) } : entry);

    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, entries: governanceBypass }, enforcement_result: enforceConstitutionAndGovernance({ entries: governanceBypass }) }).failures).toContain("GOVERNANCE_BYPASS");
    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, entries: constitutionalViolation }, enforcement_result: enforceConstitutionAndGovernance({ entries: constitutionalViolation }) }).failures).toContain("CONSTITUTIONAL_VIOLATION");
  });

  it("fails closed for authority boundary, tenant isolation, hidden arbitration, and undocumented override violations", () => {
    const ledger = writeConflictLedger();
    const authority = ledger.entries.map((entry, index) => index === 0 ? { ...entry, authority_refs: ["authority_unauthorized"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, authority_refs: ["authority_unauthorized"] }) } : entry);
    const tenant = ledger.entries.map((entry, index) => index === 0 ? { ...entry, evidence_refs: ["evidence_tenant_beta_leak"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, evidence_refs: ["evidence_tenant_beta_leak"] }) } : entry);
    const hidden = ledger.entries.map((entry) => entry.event_type === "EVIDENCE_REGISTERED" ? { ...entry, evidence_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, evidence_refs: [] }) } : entry);
    const override = ledger.entries.map((entry, index) => index === 0 ? { ...entry, source_record_ref: "override_without_authorization", integrity_hash: computeConflictLedgerEntryHash({ ...entry, source_record_ref: "override_without_authorization" }) } : entry);

    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, entries: authority }, enforcement_result: enforceConstitutionAndGovernance({ entries: authority }) }).failures).toContain("AUTHORITY_BOUNDARY_VIOLATION");
    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, entries: tenant }, enforcement_result: enforceConstitutionAndGovernance({ entries: tenant }) }).failures).toContain("TENANT_ISOLATION_FAILURE");
    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, entries: hidden }, enforcement_result: enforceConstitutionAndGovernance({ entries: hidden }) }).failures).toContain("HIDDEN_ARBITRATION");
    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, entries: override }, enforcement_result: enforceConstitutionAndGovernance({ entries: override }) }).failures).toContain("UNDOCUMENTED_OVERRIDE");
  });

  it("fails closed for replay divergence, ledger integrity failure, and incomplete tradeoff explanations", () => {
    const ledger = writeConflictLedger();
    const tamperedLedger = { ...ledger, replay_hash: "tampered" };
    const tradeoff = getTradeoffExplanationGeneratorFoundation().result;
    const missingTradeoffs = { ...tradeoff, explanations: [] };

    expect(certifyDecisionConflictArbitration({ ledger_result: tamperedLedger }).failures).toContain("REPLAY_DIVERGENCE");
    expect(certifyDecisionConflictArbitration({ ledger_result: { ...ledger, ledger_status: "FAIL" } }).failures).toContain("LEDGER_INTEGRITY_FAILURE");
    expect(certifyDecisionConflictArbitration({ tradeoff_result: missingTradeoffs }).failures).toContain("TRADEOFF_EXPLANATION_INCOMPLETE");
  });

  it("replays certification tests, reports, and ledger records deterministically", () => {
    const result = certifyDecisionConflictArbitration();
    const replay = replayDecisionConflictArbitrationCertification(result);
    const tampered = replayDecisionConflictArbitrationCertification({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.certification_ref).toBe(result.certification_id);
    expect(replay.report_refs).toEqual(result.reports.map((report) => report.report_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
