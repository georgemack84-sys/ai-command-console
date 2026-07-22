import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { presentForecastImpact } from "@/services/forecast-impact-presentation";
import type { ForecastImpactPresentationResult } from "@/types/forecast-impact-presentation";
import type {
  ApprovalRequirementRecord,
  ComplianceStatusReport,
  ComplianceSummaryLedgerEntry,
  AuthorityRequirementRecord,
  ConstitutionalStatusRecord,
  GovernanceAuthoritySummary,
  GovernanceAuthoritySummaryFailureReason,
  GovernanceAuthoritySummaryFoundation,
  GovernanceAuthoritySummaryInput,
  GovernanceAuthoritySummaryObservability,
  GovernanceAuthoritySummaryReplay,
  GovernanceAuthoritySummaryResult,
  GovernanceAuthoritySummaryState,
  GovernanceAuthoritySummaryValidation,
  GovernanceStatusRecord,
} from "@/types/governance-authority-summary";

const SUMMARY_VERSION = "governance-authority-summary/v1" as const;
const AUTHORIZED_COMPONENT = "governance-authority-summary";
const NOW = "2026-07-04T01:14:00.000Z";

export const GOVERNANCE_AUTHORITY_SUMMARY_STATES: readonly GovernanceAuthoritySummaryState[] = Object.freeze(["INITIALIZED", "GENERATING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter((value) => value.length > 0))].sort());
}

function summaryHash(record: Omit<GovernanceAuthoritySummary, "integrity_hash"> | GovernanceAuthoritySummary): string {
  return hashWithoutIntegrity(record);
}

export function computeGovernanceAuthoritySummaryHash(record: Omit<GovernanceAuthoritySummary, "integrity_hash"> | GovernanceAuthoritySummary): string {
  return summaryHash(record);
}

function governanceHash(record: Omit<GovernanceStatusRecord, "integrity_hash"> | GovernanceStatusRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeGovernanceStatusRecordHash(record: Omit<GovernanceStatusRecord, "integrity_hash"> | GovernanceStatusRecord): string {
  return governanceHash(record);
}

function constitutionalHash(record: Omit<ConstitutionalStatusRecord, "integrity_hash"> | ConstitutionalStatusRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeConstitutionalStatusRecordHash(record: Omit<ConstitutionalStatusRecord, "integrity_hash"> | ConstitutionalStatusRecord): string {
  return constitutionalHash(record);
}

function authorityHash(record: Omit<AuthorityRequirementRecord, "integrity_hash"> | AuthorityRequirementRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeAuthorityRequirementRecordHash(record: Omit<AuthorityRequirementRecord, "integrity_hash"> | AuthorityRequirementRecord): string {
  return authorityHash(record);
}

function approvalHash(record: Omit<ApprovalRequirementRecord, "integrity_hash"> | ApprovalRequirementRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeApprovalRequirementRecordHash(record: Omit<ApprovalRequirementRecord, "integrity_hash"> | ApprovalRequirementRecord): string {
  return approvalHash(record);
}

function reportHash(record: Omit<ComplianceStatusReport, "integrity_hash"> | ComplianceStatusReport): string {
  return hashWithoutIntegrity(record);
}

export function computeComplianceStatusReportHash(record: Omit<ComplianceStatusReport, "integrity_hash"> | ComplianceStatusReport): string {
  return reportHash(record);
}

function validationHash(record: Omit<GovernanceAuthoritySummaryValidation, "integrity_hash"> | GovernanceAuthoritySummaryValidation): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<ComplianceSummaryLedgerEntry, "ledger_integrity_hash"> | ComplianceSummaryLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function certification(forecast: ForecastImpactPresentationResult) {
  return forecast.evidence_result.package_build_result.certification_result;
}

export function renderGovernanceStatus(forecast: ForecastImpactPresentationResult = presentForecastImpact()): GovernanceStatusRecord {
  const pkg = forecast.evidence_result.package_build_result.package;
  const gate = certification(forecast);
  const base: Omit<GovernanceStatusRecord, "integrity_hash"> = {
    governance_record_id: `governance_status_${pkg.package_id}`,
    package_id: pkg.package_id,
    policy_checks: normalize(gate.certification_tests.filter((test) => test.category === "Governance Validation").map((test) => test.test_name)),
    governance_result: gate.gate_status,
    review_required: pkg.approval_requirements.length > 0,
    governance_restrictions: normalize([pkg.governance_summary, gate.final_report.governance_summary]),
  };
  return Object.freeze({ ...base, integrity_hash: governanceHash(base) });
}

export function renderConstitutionalStatus(forecast: ForecastImpactPresentationResult = presentForecastImpact()): ConstitutionalStatusRecord {
  const pkg = forecast.evidence_result.package_build_result.package;
  const gate = certification(forecast);
  const failed = gate.certification_tests.filter((test) => test.category === "Constitutional Validation" && test.actual !== "PASS");
  const base: Omit<ConstitutionalStatusRecord, "integrity_hash"> = {
    constitutional_record_id: `constitutional_status_${pkg.package_id}`,
    package_id: pkg.package_id,
    constitutional_checks: normalize(gate.certification_tests.filter((test) => test.category === "Constitutional Validation").map((test) => test.test_name)),
    validation_result: gate.gate_status,
    violations: Object.freeze(failed.map((test) => test.rationale)),
    fail_closed_required: gate.fail_closed || failed.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: constitutionalHash(base) });
}

export function renderAuthorityRequirements(forecast: ForecastImpactPresentationResult = presentForecastImpact()): AuthorityRequirementRecord {
  const pkg = forecast.evidence_result.package_build_result.package;
  const gate = certification(forecast);
  const base: Omit<AuthorityRequirementRecord, "integrity_hash"> = {
    authority_record_id: `authority_requirements_${pkg.package_id}`,
    package_id: pkg.package_id,
    required_authority_level: pkg.authority_summary,
    operator_required: pkg.operator_required_action !== "REVIEW_ONLY",
    governance_review_required: pkg.approval_requirements.some((item) => item.toLowerCase().includes("governance")),
    certification_required: gate.evidence_package.production_readiness !== "READY" || gate.gate_status !== "PASS",
    authority_limitations: normalize([pkg.authority_summary, gate.final_report.enforcement_summary]),
  };
  return Object.freeze({ ...base, integrity_hash: authorityHash(base) });
}

export function generateApprovalRequirements(forecast: ForecastImpactPresentationResult = presentForecastImpact()): ApprovalRequirementRecord {
  const pkg = forecast.evidence_result.package_build_result.package;
  const gate = certification(forecast);
  const approvers = normalize(pkg.approval_requirements.length > 0 ? pkg.approval_requirements : ["operator review"]);
  const blockers = normalize([
    ...gate.final_report.failed_tests,
    ...gate.failures,
    ...(forecast.fail_closed ? forecast.failures : []),
  ]);
  const base: Omit<ApprovalRequirementRecord, "integrity_hash"> = {
    approval_record_id: `approval_requirements_${pkg.package_id}`,
    package_id: pkg.package_id,
    required_approvers: approvers,
    approval_sequence: Object.freeze(["operator review", ...approvers, "certification record review"]),
    escalation_required: blockers.length > 0 || pkg.operator_required_action === "ESCALATE_REVIEW",
    approval_blockers: blockers,
  };
  return Object.freeze({ ...base, integrity_hash: approvalHash(base) });
}

export function createGovernanceAuthoritySummary(
  forecast: ForecastImpactPresentationResult = presentForecastImpact(),
  governance: GovernanceStatusRecord = renderGovernanceStatus(forecast),
  constitutional: ConstitutionalStatusRecord = renderConstitutionalStatus(forecast),
  authority: AuthorityRequirementRecord = renderAuthorityRequirements(forecast),
  approval: ApprovalRequirementRecord = generateApprovalRequirements(forecast),
): GovernanceAuthoritySummary {
  const pkg = forecast.evidence_result.package_build_result.package;
  const base: Omit<GovernanceAuthoritySummary, "integrity_hash"> = {
    summary_id: `governance_authority_summary_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    governance_status: `${governance.governance_result}: ${governance.governance_restrictions.join("; ")}`,
    constitutional_status: `${constitutional.validation_result}: ${pkg.constitutional_summary}`,
    authority_requirements: authority.authority_limitations,
    approval_requirements: approval.approval_sequence,
    operator_responsibilities: Object.freeze([pkg.operator_required_action, pkg.authority_summary]),
    restrictions: normalize([...governance.governance_restrictions, ...authority.authority_limitations]),
    blockers: approval.approval_blockers,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: summaryHash(base) });
}

export function createComplianceStatusReport(
  summary: GovernanceAuthoritySummary = createGovernanceAuthoritySummary(),
  authority: AuthorityRequirementRecord = renderAuthorityRequirements(),
  approval: ApprovalRequirementRecord = generateApprovalRequirements(),
): ComplianceStatusReport {
  const base: Omit<ComplianceStatusReport, "integrity_hash"> = {
    report_id: `compliance_status_${summary.summary_id}`,
    package_id: summary.package_id,
    governance_status: summary.governance_status,
    constitutional_status: summary.constitutional_status,
    authority_status: authority.certification_required ? "CERTIFICATION_REQUIRED" : "AUTHORITY_VISIBLE",
    approval_status: approval.escalation_required ? "ESCALATION_REQUIRED" : "APPROVAL_PATH_READY",
    restrictions: summary.restrictions,
    blockers: summary.blockers,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function summaryFailures(input: {
  forecast: ForecastImpactPresentationResult;
  summary: GovernanceAuthoritySummary;
  governance: GovernanceStatusRecord;
  constitutional: ConstitutionalStatusRecord;
  authority: AuthorityRequirementRecord;
  approval: ApprovalRequirementRecord;
  report: ComplianceStatusReport;
  authorized: boolean;
}): readonly GovernanceAuthoritySummaryFailureReason[] {
  const failures: GovernanceAuthoritySummaryFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_GOVERNANCE_AUTHORITY_SUMMARY_ACCESS");
  if (input.forecast.presentation_status !== "PASS") failures.push("FORECAST_PRESENTATION_INVALID");
  if (certification(input.forecast).gate_status !== "PASS") failures.push("CERTIFICATION_INVALID");
  if (!input.summary.governance_status || input.governance.policy_checks.length === 0) failures.push("GOVERNANCE_STATUS_MISSING");
  if (!input.summary.constitutional_status || input.constitutional.constitutional_checks.length === 0) failures.push("CONSTITUTIONAL_STATUS_MISSING");
  if (input.summary.authority_requirements.length === 0 || !input.authority.required_authority_level) failures.push("AUTHORITY_REQUIREMENTS_MISSING");
  if (input.summary.approval_requirements.length === 0 || input.approval.required_approvers.length === 0) failures.push("APPROVAL_REQUIREMENTS_INCOMPLETE");
  if (input.summary.restrictions.length === 0 || input.report.restrictions.length === 0) failures.push("RESTRICTIONS_OMITTED");
  if (input.summary.blockers.length !== input.report.blockers.length) failures.push("BLOCKERS_HIDDEN");
  if (!input.summary.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.summary.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.summary.tenant_id !== input.forecast.presentation.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.summary.advisory_only || !input.forecast.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    summaryHash(input.summary) !== input.summary.integrity_hash
    || governanceHash(input.governance) !== input.governance.integrity_hash
    || constitutionalHash(input.constitutional) !== input.constitutional.integrity_hash
    || authorityHash(input.authority) !== input.authority.integrity_hash
    || approvalHash(input.approval) !== input.approval.integrity_hash
    || reportHash(input.report) !== input.report.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as GovernanceAuthoritySummaryFailureReason[]);
}

function buildValidation(summary: GovernanceAuthoritySummary, failures: readonly GovernanceAuthoritySummaryFailureReason[]): GovernanceAuthoritySummaryValidation {
  const has = (failure: GovernanceAuthoritySummaryFailureReason) => failures.includes(failure);
  const base: Omit<GovernanceAuthoritySummaryValidation, "integrity_hash"> = {
    validation_id: `governance_authority_validation_${summary.summary_id}`,
    package_id: summary.package_id,
    governance_status_present: !has("GOVERNANCE_STATUS_MISSING"),
    constitutional_status_present: !has("CONSTITUTIONAL_STATUS_MISSING"),
    authority_requirements_present: !has("AUTHORITY_REQUIREMENTS_MISSING"),
    approval_requirements_present: !has("APPROVAL_REQUIREMENTS_INCOMPLETE"),
    restrictions_documented: !has("RESTRICTIONS_OMITTED"),
    blockers_documented: !has("BLOCKERS_HIDDEN"),
    replay_present: !has("REPLAY_REFERENCE_MISSING") && !has("REPLAY_DIVERGENCE"),
    lineage_present: !has("LINEAGE_REFERENCE_MISSING"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    tenant_valid: !has("TENANT_MISMATCH"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(summary: GovernanceAuthoritySummary, validation: GovernanceAuthoritySummaryValidation): readonly ComplianceSummaryLedgerEntry[] {
  const base: Omit<ComplianceSummaryLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `compliance_summary_ledger_${summary.summary_id}`,
    summary_id: summary.summary_id,
    package_id: summary.package_id,
    orchestration_id: summary.orchestration_id,
    tenant_id: summary.tenant_id,
    governance_status: summary.governance_status,
    constitutional_status: summary.constitutional_status,
    authority_requirements: summary.authority_requirements,
    approval_requirements: summary.approval_requirements,
    replay_ref: summary.replay_ref,
    lineage_ref: summary.lineage_ref,
    integrity_hash: summary.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<GovernanceAuthoritySummaryResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    forecast_result: result.forecast_result,
    summary: result.summary,
    governance_record: result.governance_record,
    constitutional_record: result.constitutional_record,
    authority_record: result.authority_record,
    approval_record: result.approval_record,
    compliance_report: result.compliance_report,
    validation: result.validation,
    compliance_ledger: result.compliance_ledger,
    failures: result.failures,
  });
}

export function summarizeGovernanceAuthority(input: GovernanceAuthoritySummaryInput = {}): GovernanceAuthoritySummaryResult {
  const forecast_result = input.forecast_result ?? presentForecastImpact();
  const governance_record = input.governance_record ?? renderGovernanceStatus(forecast_result);
  const constitutional_record = input.constitutional_record ?? renderConstitutionalStatus(forecast_result);
  const authority_record = input.authority_record ?? renderAuthorityRequirements(forecast_result);
  const approval_record = input.approval_record ?? generateApprovalRequirements(forecast_result);
  const summary = input.summary ?? createGovernanceAuthoritySummary(forecast_result, governance_record, constitutional_record, authority_record, approval_record);
  const compliance_report = input.compliance_report ?? createComplianceStatusReport(summary, authority_record, approval_record);
  const initialFailures = summaryFailures({
    forecast: forecast_result,
    summary,
    governance: governance_record,
    constitutional: constitutional_record,
    authority: authority_record,
    approval: approval_record,
    report: compliance_report,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(summary, initialFailures);
  const ledger = writeLedger(summary, validation);
  const ledgerFailures: readonly GovernanceAuthoritySummaryFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as GovernanceAuthoritySummaryFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(summary, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(summary, finalValidation);
  const base: Omit<GovernanceAuthoritySummaryResult, "integrity_hash" | "replay_hash"> = {
    summary_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    forecast_result,
    summary,
    governance_record,
    constitutional_record,
    authority_record,
    approval_record,
    compliance_report,
    validation: finalValidation,
    compliance_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly GovernanceAuthoritySummaryFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(summary, replayFailures);
    const replayBase: Omit<GovernanceAuthoritySummaryResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      summary_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      compliance_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayGovernanceAuthoritySummary(result: GovernanceAuthoritySummaryResult): GovernanceAuthoritySummaryReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && summaryHash(result.summary) === result.summary.integrity_hash
    && governanceHash(result.governance_record) === result.governance_record.integrity_hash
    && constitutionalHash(result.constitutional_record) === result.constitutional_record.integrity_hash
    && authorityHash(result.authority_record) === result.authority_record.integrity_hash
    && approvalHash(result.approval_record) === result.approval_record.integrity_hash
    && reportHash(result.compliance_report) === result.compliance_report.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.compliance_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: GovernanceAuthoritySummaryFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<GovernanceAuthoritySummaryReplay, "integrity_hash"> = {
    replay_id: "replay_governance_authority_summary",
    replay_valid,
    summary_id: result.summary.summary_id,
    package_id: result.summary.package_id,
    governance_status: result.summary.governance_status,
    constitutional_status: result.summary.constitutional_status,
    authority_requirements: result.summary.authority_requirements,
    approval_requirements: result.summary.approval_requirements,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildGovernanceAuthoritySummaryObservability(result: GovernanceAuthoritySummaryResult): GovernanceAuthoritySummaryObservability {
  return Object.freeze({
    governance_summaries_generated: result.validation.governance_status_present ? 1 : 0,
    constitutional_summaries_generated: result.validation.constitutional_status_present ? 1 : 0,
    authority_summaries_generated: result.validation.authority_requirements_present ? 1 : 0,
    approval_paths_generated: result.validation.approval_requirements_present ? 1 : 0,
    compliance_blockers_surfaced: result.summary.blockers.length,
    validation_failures: result.failures.length,
    fail_closed_activations: result.fail_closed ? 1 : 0,
    replay_reproducibility: replayGovernanceAuthoritySummary(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
  });
}

export function getGovernanceAuthoritySummaryFoundation(): GovernanceAuthoritySummaryFoundation {
  const result = summarizeGovernanceAuthority();
  const replay = replayGovernanceAuthoritySummary(result);
  return Object.freeze({
    summary_version: SUMMARY_VERSION,
    summary_states: GOVERNANCE_AUTHORITY_SUMMARY_STATES,
    result,
    replay,
    observability: buildGovernanceAuthoritySummaryObservability(result),
  });
}

export const GovernanceAuthoritySummaryService = Object.freeze({
  summarize: summarizeGovernanceAuthority,
  replay: replayGovernanceAuthoritySummary,
});
