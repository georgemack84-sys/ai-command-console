import { describe, expect, it } from "vitest";
import { presentForecastImpact } from "@/services/forecast-impact-presentation";
import {
  GOVERNANCE_AUTHORITY_SUMMARY_STATES,
  computeApprovalRequirementRecordHash,
  computeAuthorityRequirementRecordHash,
  computeComplianceStatusReportHash,
  computeConstitutionalStatusRecordHash,
  computeGovernanceAuthoritySummaryHash,
  computeGovernanceStatusRecordHash,
  createComplianceStatusReport,
  createGovernanceAuthoritySummary,
  generateApprovalRequirements,
  getGovernanceAuthoritySummaryFoundation,
  renderAuthorityRequirements,
  renderConstitutionalStatus,
  renderGovernanceStatus,
  replayGovernanceAuthoritySummary,
  summarizeGovernanceAuthority,
} from "@/services/governance-authority-summary";

describe("Mission Control Phase 9.8.7 Governance, Constitutional & Authority Summary", () => {
  it("publishes the governance authority summary foundation", () => {
    const foundation = getGovernanceAuthoritySummaryFoundation();

    expect(foundation.summary_version).toBe("governance-authority-summary/v1");
    expect(foundation.summary_states).toEqual(GOVERNANCE_AUTHORITY_SUMMARY_STATES);
    expect(foundation.result.summary_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("summarizes governance, constitutional, authority, and approval outputs deterministically", () => {
    const first = summarizeGovernanceAuthority();
    const second = summarizeGovernanceAuthority();

    expect(first).toEqual(second);
    expect(first.summary.governance_status).toContain(first.governance_record.governance_result);
    expect(first.summary.constitutional_status).toContain(first.constitutional_record.validation_result);
    expect(first.summary.authority_requirements).toEqual(first.authority_record.authority_limitations);
    expect(first.summary.approval_requirements).toEqual(first.approval_record.approval_sequence);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.compliance_ledger).toHaveLength(1);
  });

  it("preserves restrictions, blockers, operator responsibilities, replay, lineage, and advisory-only status", () => {
    const result = summarizeGovernanceAuthority();

    expect(result.summary.restrictions.length).toBeGreaterThan(0);
    expect(result.summary.blockers).toEqual(result.compliance_report.blockers);
    expect(result.summary.operator_responsibilities).toContain(result.forecast_result.evidence_result.package_build_result.package.operator_required_action);
    expect(result.summary.replay_ref).toBe(result.forecast_result.presentation.replay_ref);
    expect(result.summary.lineage_ref).toBe(result.forecast_result.presentation.lineage_ref);
    expect(result.summary.advisory_only).toBe(true);
  });

  it("fails closed when governance status, constitutional status, authority, approvals, restrictions, or blockers are incomplete", () => {
    const forecast = presentForecastImpact();
    const governance = renderGovernanceStatus(forecast);
    const constitutional = renderConstitutionalStatus(forecast);
    const authority = renderAuthorityRequirements(forecast);
    const approval = generateApprovalRequirements(forecast);
    const summary = createGovernanceAuthoritySummary(forecast, governance, constitutional, authority, approval);
    const report = createComplianceStatusReport(summary, authority, approval);

    expect(summarizeGovernanceAuthority({ governance_record: { ...governance, policy_checks: [], integrity_hash: computeGovernanceStatusRecordHash({ ...governance, policy_checks: [] }) } }).failures).toContain("GOVERNANCE_STATUS_MISSING");
    expect(summarizeGovernanceAuthority({ constitutional_record: { ...constitutional, constitutional_checks: [], integrity_hash: computeConstitutionalStatusRecordHash({ ...constitutional, constitutional_checks: [] }) } }).failures).toContain("CONSTITUTIONAL_STATUS_MISSING");
    expect(summarizeGovernanceAuthority({ authority_record: { ...authority, required_authority_level: "", integrity_hash: computeAuthorityRequirementRecordHash({ ...authority, required_authority_level: "" }) } }).failures).toContain("AUTHORITY_REQUIREMENTS_MISSING");
    expect(summarizeGovernanceAuthority({ approval_record: { ...approval, required_approvers: [], integrity_hash: computeApprovalRequirementRecordHash({ ...approval, required_approvers: [] }) } }).failures).toContain("APPROVAL_REQUIREMENTS_INCOMPLETE");
    expect(summarizeGovernanceAuthority({ summary: { ...summary, restrictions: [], integrity_hash: computeGovernanceAuthoritySummaryHash({ ...summary, restrictions: [] }) } }).failures).toContain("RESTRICTIONS_OMITTED");
    expect(summarizeGovernanceAuthority({ compliance_report: { ...report, blockers: ["hidden-blocker"], integrity_hash: computeComplianceStatusReportHash({ ...report, blockers: ["hidden-blocker"] }) } }).failures).toContain("BLOCKERS_HIDDEN");
  });

  it("rejects replay gaps, lineage gaps, integrity tampering, tenant mismatch, and advisory-only violations", () => {
    const valid = summarizeGovernanceAuthority();
    const summary = valid.summary;

    expect(summarizeGovernanceAuthority({ summary: { ...summary, replay_ref: "", integrity_hash: computeGovernanceAuthoritySummaryHash({ ...summary, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(summarizeGovernanceAuthority({ summary: { ...summary, lineage_ref: "", integrity_hash: computeGovernanceAuthoritySummaryHash({ ...summary, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(summarizeGovernanceAuthority({ summary: { ...summary, governance_status: "tampered" } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(summarizeGovernanceAuthority({ summary: { ...summary, tenant_id: "tenant_beta", integrity_hash: computeGovernanceAuthoritySummaryHash({ ...summary, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(summarizeGovernanceAuthority({ summary: { ...summary, advisory_only: false as true, integrity_hash: computeGovernanceAuthoritySummaryHash({ ...summary, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("detects invalid upstream presentation/certification, unauthorized access, and replay divergence", () => {
    const valid = summarizeGovernanceAuthority();
    const badForecast = { ...valid.forecast_result, presentation_status: "FAIL" as const };
    const badCertification = {
      ...valid.forecast_result,
      evidence_result: {
        ...valid.forecast_result.evidence_result,
        package_build_result: {
          ...valid.forecast_result.evidence_result.package_build_result,
          certification_result: {
            ...valid.forecast_result.evidence_result.package_build_result.certification_result,
            gate_status: "FAIL" as const,
          },
        },
      },
    };

    expect(summarizeGovernanceAuthority({ forecast_result: badForecast }).failures).toContain("FORECAST_PRESENTATION_INVALID");
    expect(summarizeGovernanceAuthority({ forecast_result: badCertification }).failures).toContain("CERTIFICATION_INVALID");
    expect(summarizeGovernanceAuthority({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_GOVERNANCE_AUTHORITY_SUMMARY_ACCESS");
    expect(summarizeGovernanceAuthority({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays governance authority summaries deterministically", () => {
    const result = summarizeGovernanceAuthority();
    const replay = replayGovernanceAuthoritySummary(result);
    const tampered = replayGovernanceAuthoritySummary({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.summary_id).toBe(result.summary.summary_id);
    expect(replay.authority_requirements).toEqual(result.summary.authority_requirements);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
