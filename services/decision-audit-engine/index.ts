import { detectReplayDifferences } from "@/services/decision-replay-difference-detector";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AuditSection,
  CertificationEvidencePackage,
  ComplianceOutcome,
  ComplianceSummary,
  DecisionAuditEngineFoundation,
  DecisionAuditEngineResult,
  DecisionAuditFailure,
  DecisionAuditLedgerEntry,
  DecisionAuditPackage,
  DecisionAuditRecord,
  DecisionAuditState,
  DecisionAuditValidation,
} from "@/types/decision-audit-engine";
import type { ReplayDifferenceDetectorResult } from "@/types/decision-replay-difference-detector";

const AUDIT_VERSION = "decision-audit-engine/v1" as const;
const AUDIT_SCHEMA_VERSION = "decision-audit-schema/v1" as const;

export const DECISION_AUDIT_STATES: readonly DecisionAuditState[] = Object.freeze(["CREATED", "COLLECTING_EVIDENCE", "GENERATING_REPORT", "VALIDATING", "CERTIFICATION_READY", "COMMITTED", "ARCHIVED", "REJECTED"]);
export const DECISION_AUDIT_TERMINAL_STATES: readonly DecisionAuditState[] = Object.freeze(["COMMITTED", "ARCHIVED", "REJECTED"]);

type AuditScenario =
  | "BASELINE"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "MISSING_CONSTITUTIONAL"
  | "MISSING_REPLAY"
  | "MISSING_INTEGRITY"
  | "MISSING_CERTIFICATION_EVIDENCE"
  | "BROKEN_LINEAGE"
  | "INTEGRITY_MISMATCH"
  | "CROSS_TENANT"
  | "UNSUPPORTED_SCHEMA"
  | "REPORT_FAILURE"
  | "AUDIT_VALIDATION_FAILURE";

type AuditInput = Readonly<{
  replay_difference_result?: ReplayDifferenceDetectorResult;
  scenario?: AuditScenario;
}>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function context(result: ReplayDifferenceDetectorResult) {
  const replay = result.replay_result.trace_builder_result.snapshot_capture.replay_contract;
  return {
    replay,
    execution: result.replay_result.execution_record,
    report: result.replay_result.report,
    trace: result.replay_result.trace_builder_result.trace_record,
    snapshots: result.replay_result.trace_builder_result.snapshot_capture.snapshots,
  };
}

function section(
  result: ReplayDifferenceDetectorResult,
  type: AuditSection["section_type"],
  summary: string,
  evidenceRefs: readonly string[],
  lineageRefs?: readonly string[],
): AuditSection {
  const ctx = context(result);
  const base: Omit<AuditSection, "integrity_hash"> = {
    section_id: `audit_section_${type.toLowerCase()}_${ctx.replay.orchestration_id}`,
    section_type: type,
    summary,
    evidence_refs: freezeArray(evidenceRefs),
    lineage_refs: freezeArray(lineageRefs ?? ctx.execution.lineage_refs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSections(result: ReplayDifferenceDetectorResult, scenario: AuditScenario): Omit<DecisionAuditPackage, "compliance_summary" | "certification_evidence" | "integrity_hash"> {
  const ctx = context(result);
  const empty = scenario === "MISSING_EVIDENCE";
  const evidence = empty ? [] : ctx.snapshots.map((snapshot) => snapshot.snapshot_id);
  const lineage = scenario === "BROKEN_LINEAGE" ? [] : ctx.execution.lineage_refs;
  return Object.freeze({
    orchestration_summary: section(result, "ORCHESTRATION_SUMMARY", `Orchestration ${ctx.replay.orchestration_id} completed with replay availability ${result.replay_result.report.certification_ready}.`, evidence, lineage),
    considered_decisions: section(result, "CONSIDERED_DECISIONS", "Primary candidate and normalized candidate were considered.", evidence.filter((ref) => ref.includes("candidate")), lineage),
    rejected_decisions: section(result, "REJECTED_DECISIONS", "Rejected options and alternatives were documented in package and conflict evidence.", evidence.filter((ref) => ref.includes("package") || ref.includes("conflict")), lineage),
    evidence_summary: section(result, "EVIDENCE_SUMMARY", "Snapshot, trace, replay, and diff evidence are linked for certification.", evidence, lineage),
    governance_validation: section(result, "GOVERNANCE_VALIDATION", "Governance policies, authority, approvals, and compliance outcomes are documented.", scenario === "MISSING_GOVERNANCE" ? [] : evidence.filter((ref) => ref.includes("governance")), lineage),
    constitutional_validation: section(result, "CONSTITUTIONAL_VALIDATION", "Constitutional validation, operator supremacy, advisory-only behavior, and tenant isolation are documented.", scenario === "MISSING_CONSTITUTIONAL" ? [] : evidence.filter((ref) => ref.includes("governance")), lineage),
    priority_explanation: section(result, "PRIORITY_EXPLANATION", "Priority score, weighting, confidence, governance, and constitutional weighting are documented.", evidence.filter((ref) => ref.includes("priority")), lineage),
    conflict_resolution: section(result, "CONFLICT_RESOLUTION", "Conflict analysis, arbitration outcome, tradeoffs, and rejected alternatives are documented.", evidence.filter((ref) => ref.includes("conflict")), lineage),
    operator_actions: section(result, "OPERATOR_ACTIONS", "Operator approvals, review paths, comments, escalation, and final action evidence are documented.", evidence.filter((ref) => ref.includes("operator")), lineage),
    final_outcome: section(result, "FINAL_OUTCOME", "Final decision state, governance status, certification outcome, and advisory output are documented.", evidence.filter((ref) => ref.includes("final")), lineage),
    replay_verification: section(result, "REPLAY_VERIFICATION", "Replay equality, divergence status, replay report, and version references are documented.", scenario === "MISSING_REPLAY" ? [] : [ctx.execution.replay_report_ref, result.diff_result.replay_diff_id], lineage),
    integrity_verification: section(result, "INTEGRITY_VERIFICATION", "Artifact, snapshot, trace, replay, ledger, and audit hashes are documented.", scenario === "MISSING_INTEGRITY" ? [] : [ctx.execution.integrity_verification_ref, result.integrity_hash], lineage),
  });
}

function complianceStatus(ok: boolean, blocked: boolean): ComplianceOutcome {
  if (blocked) return "BLOCKED";
  return ok ? "COMPLIANT" : "NON_COMPLIANT";
}

function buildCompliance(result: ReplayDifferenceDetectorResult, auditId: string, evidenceRefs: readonly string[], scenario: AuditScenario): ComplianceSummary {
  const blocked = !result.certification_ready || scenario !== "BASELINE";
  const governance = scenario !== "MISSING_GOVERNANCE" && !result.diff_result.governance_impact_summary;
  const constitutional = scenario !== "MISSING_CONSTITUTIONAL" && !result.diff_result.constitutional_impact_summary;
  const replay = scenario !== "MISSING_REPLAY" && result.replay_result.report.certification_ready;
  const integrity = scenario !== "MISSING_INTEGRITY" && result.dashboard.integrity_status === "VERIFIED";
  const certification = result.certification_ready && scenario !== "MISSING_CERTIFICATION_EVIDENCE";
  const statuses = [
    complianceStatus(governance, scenario === "MISSING_GOVERNANCE"),
    complianceStatus(constitutional, scenario === "MISSING_CONSTITUTIONAL"),
    "COMPLIANT" as ComplianceOutcome,
    complianceStatus(replay, scenario === "MISSING_REPLAY"),
    complianceStatus(integrity, scenario === "MISSING_INTEGRITY"),
    complianceStatus(certification, scenario === "MISSING_CERTIFICATION_EVIDENCE"),
  ];
  const overall: ComplianceOutcome = statuses.includes("BLOCKED") ? "BLOCKED" : statuses.every((status) => status === "COMPLIANT") ? "COMPLIANT" : "NON_COMPLIANT";
  const base: Omit<ComplianceSummary, "integrity_hash"> = {
    compliance_id: `compliance_${auditId}`,
    audit_id: auditId,
    governance_status: statuses[0]!,
    constitutional_status: statuses[1]!,
    authority_status: statuses[2]!,
    replay_status: statuses[3]!,
    integrity_status: statuses[4]!,
    certification_status: statuses[5]!,
    overall_compliance: overall,
    supporting_evidence_refs: freezeArray(evidenceRefs),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertificationEvidence(result: ReplayDifferenceDetectorResult, auditId: string, scenario: AuditScenario): CertificationEvidencePackage {
  const ctx = context(result);
  const ready = result.certification_ready && scenario !== "MISSING_CERTIFICATION_EVIDENCE";
  const base: Omit<CertificationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: `certification_evidence_${auditId}`,
    audit_id: auditId,
    orchestration_refs: freezeArray([ctx.replay.orchestration_id, ctx.trace.trace_id]),
    replay_refs: freezeArray(scenario === "MISSING_REPLAY" ? [] : [ctx.replay.replay_id, ctx.execution.replay_report_ref, result.diff_result.replay_diff_id]),
    governance_refs: freezeArray(scenario === "MISSING_GOVERNANCE" ? [] : ctx.trace.governance_refs.map((ref) => ref.ref_id)),
    constitutional_refs: freezeArray(scenario === "MISSING_CONSTITUTIONAL" ? [] : ctx.trace.constitutional_refs.map((ref) => ref.ref_id)),
    operator_refs: freezeArray(ctx.snapshots.filter((snapshot) => snapshot.snapshot_type === "OPERATOR_ACTION").map((snapshot) => snapshot.snapshot_id)),
    integrity_refs: freezeArray(scenario === "MISSING_INTEGRITY" ? [] : [ctx.execution.integrity_hash, result.integrity_hash]),
    lineage_refs: freezeArray(scenario === "BROKEN_LINEAGE" ? [] : ctx.execution.lineage_refs),
    certification_ready: ready,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function packageHash(pkg: Omit<DecisionAuditPackage, "integrity_hash"> | DecisionAuditPackage): string {
  return hashWithoutIntegrity(pkg);
}

function buildPackage(result: ReplayDifferenceDetectorResult, scenario: AuditScenario): DecisionAuditPackage {
  const ctx = context(result);
  const auditId = `audit_${ctx.replay.orchestration_id}`;
  const sections = buildSections(result, scenario);
  const allEvidence = Object.values(sections).flatMap((sectionValue) => sectionValue.evidence_refs);
  const compliance_summary = buildCompliance(result, auditId, allEvidence, scenario);
  const certification_evidence = buildCertificationEvidence(result, auditId, scenario);
  const base: Omit<DecisionAuditPackage, "integrity_hash"> = {
    ...sections,
    compliance_summary,
    certification_evidence,
  };
  const pkg = Object.freeze({ ...base, integrity_hash: packageHash(base) });
  if (scenario === "INTEGRITY_MISMATCH") return Object.freeze({ ...pkg, integrity_hash: hash({ tampered: auditId }) });
  return pkg;
}

function buildAuditRecord(result: ReplayDifferenceDetectorResult, pkg: DecisionAuditPackage, scenario: AuditScenario): DecisionAuditRecord {
  const ctx = context(result);
  const auditId = `audit_${ctx.replay.orchestration_id}`;
  const base: Omit<DecisionAuditRecord, "integrity_hash"> = {
    audit_id: auditId,
    orchestration_id: ctx.replay.orchestration_id,
    mission_id: ctx.replay.mission_id,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_other" : ctx.replay.tenant_id,
    audit_version: AUDIT_VERSION,
    schema_version: scenario === "UNSUPPORTED_SCHEMA" ? "decision-audit-schema/v999" as typeof AUDIT_SCHEMA_VERSION : AUDIT_SCHEMA_VERSION,
    audit_state: pkg.certification_evidence.certification_ready ? "COMMITTED" : "REJECTED",
    orchestration_summary_ref: pkg.orchestration_summary.section_id,
    considered_decisions_ref: pkg.considered_decisions.section_id,
    rejected_decisions_ref: pkg.rejected_decisions.section_id,
    evidence_summary_ref: pkg.evidence_summary.section_id,
    governance_summary_ref: pkg.governance_validation.section_id,
    constitutional_summary_ref: pkg.constitutional_validation.section_id,
    priority_summary_ref: pkg.priority_explanation.section_id,
    conflict_summary_ref: pkg.conflict_resolution.section_id,
    operator_summary_ref: pkg.operator_actions.section_id,
    final_outcome_ref: pkg.final_outcome.section_id,
    replay_summary_ref: pkg.replay_verification.section_id,
    integrity_summary_ref: pkg.integrity_verification.section_id,
    compliance_summary_ref: pkg.compliance_summary.compliance_id,
    certification_evidence_ref: pkg.certification_evidence.evidence_package_id,
    lineage_refs: pkg.certification_evidence.lineage_refs,
    validation_status: pkg.certification_evidence.certification_ready ? "VALID" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(result: ReplayDifferenceDetectorResult, pkg: DecisionAuditPackage, record: DecisionAuditRecord, scenario: AuditScenario): readonly DecisionAuditFailure[] {
  const failures: DecisionAuditFailure[] = [];
  const sections = [
    pkg.orchestration_summary,
    pkg.considered_decisions,
    pkg.rejected_decisions,
    pkg.evidence_summary,
    pkg.governance_validation,
    pkg.constitutional_validation,
    pkg.priority_explanation,
    pkg.conflict_resolution,
    pkg.operator_actions,
    pkg.final_outcome,
    pkg.replay_verification,
    pkg.integrity_verification,
  ];
  if (sections.some((sectionValue) => !sectionValue.summary || !sectionValue.section_id) || scenario === "REPORT_FAILURE") failures.push("AUDIT_REPORT_INCOMPLETE");
  if (sections.some((sectionValue) => sectionValue.evidence_refs.length === 0) || scenario === "MISSING_EVIDENCE") failures.push("EVIDENCE_MISSING");
  if (pkg.governance_validation.evidence_refs.length === 0 || scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_DOCUMENTATION_MISSING");
  if (pkg.constitutional_validation.evidence_refs.length === 0 || scenario === "MISSING_CONSTITUTIONAL") failures.push("CONSTITUTIONAL_DOCUMENTATION_MISSING");
  if (pkg.replay_verification.evidence_refs.length === 0 || scenario === "MISSING_REPLAY") failures.push("REPLAY_VERIFICATION_MISSING");
  if (pkg.integrity_verification.evidence_refs.length === 0 || scenario === "MISSING_INTEGRITY") failures.push("INTEGRITY_VERIFICATION_MISSING");
  if (!pkg.certification_evidence.certification_ready || scenario === "MISSING_CERTIFICATION_EVIDENCE") failures.push("CERTIFICATION_EVIDENCE_MISSING");
  if (record.lineage_refs.length === 0 || scenario === "BROKEN_LINEAGE") failures.push("LINEAGE_BROKEN");
  if (packageHash(pkg) !== pkg.integrity_hash || scenario === "INTEGRITY_MISMATCH") failures.push("INTEGRITY_MISMATCH");
  if (record.tenant_id !== context(result).replay.tenant_id || scenario === "CROSS_TENANT") failures.push("TENANT_MISMATCH");
  if (record.schema_version !== AUDIT_SCHEMA_VERSION || scenario === "UNSUPPORTED_SCHEMA") failures.push("UNSUPPORTED_SCHEMA");
  if (scenario === "AUDIT_VALIDATION_FAILURE") failures.push("AUDIT_VALIDATION_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(record: DecisionAuditRecord, failures: readonly DecisionAuditFailure[]): DecisionAuditValidation {
  const has = (failure: DecisionAuditFailure) => failures.includes(failure);
  const base: Omit<DecisionAuditValidation, "integrity_hash"> = {
    validation_id: `audit_validation_${record.audit_id}`,
    audit_id: record.audit_id,
    validation_status: failures.length ? "BLOCKED" : "VALID",
    report_complete: !has("AUDIT_REPORT_INCOMPLETE"),
    evidence_traceable: !has("EVIDENCE_MISSING"),
    lineage_complete: !has("LINEAGE_BROKEN"),
    governance_documented: !has("GOVERNANCE_DOCUMENTATION_MISSING"),
    constitutional_documented: !has("CONSTITUTIONAL_DOCUMENTATION_MISSING"),
    replay_verified: !has("REPLAY_VERIFICATION_MISSING"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_MISSING") && !has("INTEGRITY_MISMATCH"),
    certification_evidence_complete: !has("CERTIFICATION_EVIDENCE_MISSING"),
    tenant_ownership_valid: !has("TENANT_MISMATCH"),
    certification_ready: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerHash(entry: Omit<DecisionAuditLedgerEntry, "integrity_hash"> | DecisionAuditLedgerEntry): string {
  return hashWithoutIntegrity(entry);
}

function buildLedger(record: DecisionAuditRecord, pkg: DecisionAuditPackage): readonly DecisionAuditLedgerEntry[] {
  const base: Omit<DecisionAuditLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `audit_ledger_${record.audit_id}`,
    audit_id: record.audit_id,
    sequence: 1,
    audit_record_hash: record.integrity_hash,
    package_hash: pkg.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

export function generateDecisionAudit(input: AuditInput = {}): DecisionAuditEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const replay_difference_result = input.replay_difference_result ?? detectReplayDifferences(
    scenario === "CROSS_TENANT" ? { scenario: "CROSS_TENANT" }
      : scenario === "BROKEN_LINEAGE" ? { scenario: "BROKEN_LINEAGE" }
        : scenario === "INTEGRITY_MISMATCH" ? { scenario: "INTEGRITY_MISMATCH" }
          : {},
  );
  const audit_package = buildPackage(replay_difference_result, scenario);
  const audit_record = buildAuditRecord(replay_difference_result, audit_package, scenario);
  const failures = collectFailures(replay_difference_result, audit_package, audit_record, scenario);
  const validation = buildValidation(audit_record, failures);
  const ledger = buildLedger(audit_record, audit_package);
  const compliance_summary = audit_package.compliance_summary;
  const certification_evidence = audit_package.certification_evidence;
  const base: Omit<DecisionAuditEngineResult, "integrity_hash"> = {
    audit_engine_version: AUDIT_VERSION,
    replay_difference_result,
    audit_package,
    audit_record,
    validation,
    ledger,
    compliance_summary,
    certification_evidence,
    deterministic: true,
    advisory_only: true,
    mutates_orchestration_outcomes: false,
    certification_ready: validation.certification_ready,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function getDecisionAuditEngineFoundation(): DecisionAuditEngineFoundation {
  return Object.freeze({
    audit_engine_version: AUDIT_VERSION,
    audit_states: DECISION_AUDIT_STATES,
    terminal_states: DECISION_AUDIT_TERMINAL_STATES,
    result: generateDecisionAudit(),
  });
}

export const DecisionAuditEngine = Object.freeze({
  generate: generateDecisionAudit,
});
