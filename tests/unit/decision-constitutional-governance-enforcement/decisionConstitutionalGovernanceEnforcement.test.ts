import { describe, expect, it } from "vitest";
import {
  ENFORCEMENT_OUTCOMES,
  ENFORCEMENT_PRIORITY_ORDER,
  buildEnforcementObservability,
  enforceConstitutionAndGovernance,
  getEnforcementFoundation,
  replayEnforcement,
  validateAuthority,
  validateConstitution,
  validateGovernance,
  validateTenantIsolation,
} from "@/services/decision-constitutional-governance-enforcement";
import { computeConflictLedgerEntryHash, writeConflictLedger } from "@/services/decision-conflict-ledger";

describe("Mission Control Phase 9.6.8 Constitutional & Governance Enforcement", () => {
  it("publishes the enforcement foundation with immutable priority order and outcomes", () => {
    const foundation = getEnforcementFoundation();

    expect(foundation.enforcement_version).toBe("constitutional-governance-enforcement/v1");
    expect(foundation.priority_order).toEqual(ENFORCEMENT_PRIORITY_ORDER);
    expect(foundation.outcomes).toEqual(ENFORCEMENT_OUTCOMES);
    expect(foundation.result.enforcement_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("validates constitution, governance, authority, and tenant isolation records", () => {
    const ledger = writeConflictLedger();
    const arbitrationRef = ledger.entries.find((entry) => entry.event_type === "ARBITRATION_COMPLETED")!.source_record_ref;

    expect(validateConstitution(ledger.entries, arbitrationRef).validation_result).toBe("VALID");
    expect(validateGovernance(ledger.entries, arbitrationRef).compliance_status).toMatch(/COMPLIANT|ESCALATE/);
    expect(validateAuthority(ledger.entries, arbitrationRef).validation_result).toMatch(/VALID|ESCALATE/);
    expect(validateTenantIsolation(ledger.entries, arbitrationRef).validation_result).toBe("VALID");
  });

  it("generates enforcement reports and append-only enforcement ledger records", () => {
    const result = enforceConstitutionAndGovernance();

    expect(result.reports.length).toBeGreaterThan(0);
    expect(result.ledger_records).toHaveLength(result.reports.length);
    expect(result.reports.every((report) => report.constitutional_summary.includes("Constitution"))).toBe(true);
    expect(result.reports.every((report) => report.governance_summary.includes("Governance"))).toBe(true);
    expect(result.reports.every((report) => report.integrity_hash.match(/^[a-f0-9]{64}$/))).toBe(true);
  });

  it("detects constitutional, governance, authority, and tenant violations with fail-closed behavior", () => {
    const ledger = writeConflictLedger();
    const constitutional = ledger.entries.map((entry, index) => index === 0 ? { ...entry, constitutional_refs: ["constitutional_violation_operator_bypass"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, constitutional_refs: ["constitutional_violation_operator_bypass"] }) } : entry);
    const governance = ledger.entries.map((entry, index) => index === 0 ? { ...entry, governance_refs: ["governance_policy_bypass"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, governance_refs: ["governance_policy_bypass"] }) } : entry);
    const authority = ledger.entries.map((entry, index) => index === 0 ? { ...entry, authority_refs: ["authority_unauthorized"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, authority_refs: ["authority_unauthorized"] }) } : entry);
    const tenant = ledger.entries.map((entry, index) => index === 0 ? { ...entry, evidence_refs: ["evidence_tenant_beta_leak"], integrity_hash: computeConflictLedgerEntryHash({ ...entry, evidence_refs: ["evidence_tenant_beta_leak"] }) } : entry);

    expect(enforceConstitutionAndGovernance({ entries: constitutional }).failures).toContain("CONSTITUTIONAL_VIOLATION");
    expect(enforceConstitutionAndGovernance({ entries: governance }).failures).toContain("GOVERNANCE_POLICY_VIOLATION");
    expect(enforceConstitutionAndGovernance({ entries: authority }).failures).toContain("AUTHORITY_VIOLATION");
    expect(enforceConstitutionAndGovernance({ entries: tenant }).failures).toContain("TENANT_ISOLATION_BREACH");
  });

  it("detects hidden arbitration, undocumented overrides, and unauthorized resolutions", () => {
    const ledger = writeConflictLedger();
    const hidden = ledger.entries.map((entry) => entry.event_type === "EVIDENCE_REGISTERED" ? { ...entry, evidence_refs: [], integrity_hash: computeConflictLedgerEntryHash({ ...entry, evidence_refs: [] }) } : entry);
    const override = ledger.entries.map((entry, index) => index === 0 ? { ...entry, source_record_ref: "override_without_authorization", integrity_hash: computeConflictLedgerEntryHash({ ...entry, source_record_ref: "override_without_authorization" }) } : entry);
    const unauthorized = ledger.entries.map((entry, index) => index === 0 ? { ...entry, source_record_ref: "unauthorized_resolution", integrity_hash: computeConflictLedgerEntryHash({ ...entry, source_record_ref: "unauthorized_resolution" }) } : entry);

    expect(enforceConstitutionAndGovernance({ entries: hidden }).failures).toContain("HIDDEN_ARBITRATION_DETECTED");
    expect(enforceConstitutionAndGovernance({ entries: override }).failures).toContain("UNDOCUMENTED_OVERRIDE");
    expect(enforceConstitutionAndGovernance({ entries: unauthorized }).failures).toContain("UNAUTHORIZED_CONFLICT_RESOLUTION");
  });

  it("fails closed for unauthorized validator access, replay corruption, integrity mismatch, and missing ledgers", () => {
    const valid = enforceConstitutionAndGovernance();
    const ledger = writeConflictLedger();
    const tampered = ledger.entries.map((entry, index) => index === 0 ? { ...entry, source_component: "tampered" } : entry);

    expect(enforceConstitutionAndGovernance({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_VALIDATOR_ACCESS");
    expect(enforceConstitutionAndGovernance({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_CORRUPTION");
    expect(enforceConstitutionAndGovernance({ entries: tampered }).failures).toContain("INTEGRITY_HASH_MISMATCH");
    expect(enforceConstitutionAndGovernance({ ledger_result: { ...ledger, entries: [] } }).failures).toContain("MISSING_LEDGER_RECORDS");
  });

  it("replays enforcement decisions, reports, and ledger entries deterministically", () => {
    const result = enforceConstitutionAndGovernance();
    const replay = replayEnforcement(result);
    const tampered = replayEnforcement({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.report_refs).toEqual(result.reports.map((report) => report.report_id));
    expect(replay.ledger_refs).toEqual(result.ledger_records.map((record) => record.ledger_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_CORRUPTION");
  });

  it("publishes enforcement observability metrics", () => {
    const result = enforceConstitutionAndGovernance();
    const metrics = buildEnforcementObservability(result);

    expect(metrics.constitutional_validations).toBe(result.constitutional_validations.length);
    expect(metrics.governance_validations).toBe(result.governance_validations.length);
    expect(metrics.authority_validations).toBe(result.authority_validations.length);
    expect(metrics.tenant_isolation_validations).toBe(result.tenant_validations.length);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.integrity_failures).toBe(0);
  });
});
