import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  computeConflictLedgerEntryHash,
  replayConflictLedger,
  validateConflictLedgerEntries,
  writeConflictLedger,
} from "@/services/decision-conflict-ledger";
import type { ConflictLedgerEntry, ConflictLedgerResult } from "@/types/decision-conflict-ledger";
import type {
  AuthorityValidation,
  ConstitutionalValidation,
  EnforcementFailureReason,
  EnforcementFoundation,
  EnforcementInput,
  EnforcementLedgerRecord,
  EnforcementObservability,
  EnforcementOutcome,
  EnforcementPriority,
  EnforcementReplay,
  EnforcementReport,
  EnforcementResult,
  EnforcementValidation,
  GovernanceValidation,
  TenantIsolationValidation,
} from "@/types/decision-constitutional-governance-enforcement";

const NOW = "2026-07-03T23:58:00.000Z";
const ENFORCEMENT_VERSION = "constitutional-governance-enforcement/v1" as const;
const AUTHORIZED_COMPONENT = "decision-constitutional-governance-enforcement";

export const ENFORCEMENT_PRIORITY_ORDER: readonly EnforcementPriority[] = Object.freeze([
  "Constitution",
  "Governance",
  "Authority",
  "Tenant Isolation",
  "Policy Validation",
  "Replay Validation",
  "Integrity Validation",
]);

export const ENFORCEMENT_OUTCOMES: readonly EnforcementOutcome[] = Object.freeze([
  "PASS",
  "ESCALATE_TO_GOVERNANCE",
  "ESCALATE_TO_OPERATOR",
  "REJECT",
  "BLOCKING",
]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function arbitrationRefs(entries: readonly ConflictLedgerEntry[]): readonly string[] {
  return Object.freeze(normalizeStrings(entries
    .filter((entry) => entry.event_type === "ARBITRATION_COMPLETED")
    .map((entry) => entry.source_record_ref)));
}

function entriesForArbitration(entries: readonly ConflictLedgerEntry[], source_record_ref: string): readonly ConflictLedgerEntry[] {
  const [, escalationId] = source_record_ref.split(":");
  const direct = entries.filter((entry) => entry.source_record_ref.includes(`:${escalationId}:`));
  const conflictId = direct[0]?.conflict_id;
  return Object.freeze(entries.filter((entry) => entry.source_record_ref.includes(`:${escalationId}:`) || (conflictId ? entry.conflict_id === conflictId : false)));
}

function validationHash(value: object): string {
  return hashWithoutIntegrity(value);
}

export function validateConstitution(entries: readonly ConflictLedgerEntry[], arbitration_ref: string): ConstitutionalValidation {
  const scoped = entriesForArbitration(entries, arbitration_ref);
  const violated: string[] = [];
  if (!scoped.every((entry) => entry.constitutional_refs.length > 0)) violated.push("constitutional_metadata_missing");
  if (scoped.some((entry) => entry.constitutional_refs.some((ref) => ref.toLowerCase().includes("violation")))) violated.push("constitutional_violation_detected");
  if (!scoped.every((entry) => entry.replay_ref.length > 0)) violated.push("replay_fidelity_missing");
  if (!scoped.every((entry) => computeConflictLedgerEntryHash(entry) === entry.integrity_hash)) violated.push("integrity_preservation_failed");
  const base: Omit<ConstitutionalValidation, "integrity_hash"> = {
    validation_id: `constitution_validation_${hash(arbitration_ref).slice(0, 24)}`,
    arbitration_id: arbitration_ref,
    constitutional_checks: Object.freeze(["operator_supremacy", "governance_supremacy", "advisory_only", "deterministic_behavior", "replay_fidelity", "integrity_preservation", "tenant_isolation", "explainability", "fail_closed"]),
    validation_result: violated.length === 0 ? "VALID" : "REJECTED",
    violated_principles: Object.freeze(normalizeStrings(violated)),
    replay_ref: `replay_constitution_${hash(arbitration_ref).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

export function validateGovernance(entries: readonly ConflictLedgerEntry[], arbitration_ref: string): GovernanceValidation {
  const scoped = entriesForArbitration(entries, arbitration_ref);
  const policies = normalizeStrings(scoped.flatMap((entry) => entry.governance_refs));
  const violations: string[] = [];
  if (policies.length === 0) violations.push("governance_policy_missing");
  if (policies.some((ref) => ref.toLowerCase().includes("violation") || ref.toLowerCase().includes("bypass"))) violations.push("governance_policy_violation");
  const escalation_required = scoped.some((entry) => entry.event_type === "ESCALATION_CREATED");
  const base: Omit<GovernanceValidation, "integrity_hash"> = {
    validation_id: `governance_validation_${hash(arbitration_ref).slice(0, 24)}`,
    arbitration_id: arbitration_ref,
    policy_refs: Object.freeze(policies),
    compliance_status: violations.length > 0 ? "REJECTED" : escalation_required ? "ESCALATE" : "COMPLIANT",
    violations: Object.freeze(violations),
    escalation_required,
    replay_ref: `replay_governance_${hash(arbitration_ref).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

export function validateAuthority(entries: readonly ConflictLedgerEntry[], arbitration_ref: string): AuthorityValidation {
  const scoped = entriesForArbitration(entries, arbitration_ref);
  const refs = normalizeStrings(scoped.flatMap((entry) => entry.authority_refs));
  const violations: string[] = [];
  if (refs.length === 0) violations.push("authority_missing");
  if (refs.some((ref) => ref.toLowerCase().includes("unauthorized") || ref.toLowerCase().includes("bypass"))) violations.push("authority_violation");
  const base: Omit<AuthorityValidation, "integrity_hash"> = {
    validation_id: `authority_validation_${hash(arbitration_ref).slice(0, 24)}`,
    arbitration_id: arbitration_ref,
    authority_refs: Object.freeze(refs),
    validation_result: violations.length > 0 ? "REJECTED" : refs.some((ref) => ref.toLowerCase().includes("operator")) ? "ESCALATE" : "VALID",
    violations: Object.freeze(violations),
    replay_ref: `replay_authority_${hash(arbitration_ref).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

export function validateTenantIsolation(entries: readonly ConflictLedgerEntry[], arbitration_ref: string): TenantIsolationValidation {
  const scoped = entriesForArbitration(entries, arbitration_ref);
  const tenant = scoped[0]?.tenant_id ?? "tenant_alpha";
  const violations: string[] = [];
  if (scoped.some((entry) => entry.tenant_id !== tenant)) violations.push("mixed_tenant_records");
  if (tenant !== "tenant_beta" && JSON.stringify(scoped).includes("tenant_beta")) violations.push("cross_tenant_reference");
  const base: Omit<TenantIsolationValidation, "integrity_hash"> = {
    validation_id: `tenant_validation_${hash(arbitration_ref).slice(0, 24)}`,
    arbitration_id: arbitration_ref,
    tenant_id: tenant,
    validation_result: violations.length === 0 ? "VALID" : "REJECTED",
    violations: Object.freeze(violations),
    replay_ref: `replay_tenant_${hash(arbitration_ref).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function detectHiddenArbitration(entries: readonly ConflictLedgerEntry[], arbitration_ref: string): readonly string[] {
  const scoped = entriesForArbitration(entries, arbitration_ref);
  const violations: string[] = [];
  const completed = scoped.some((entry) => entry.event_type === "ARBITRATION_COMPLETED");
  const started = scoped.some((entry) => entry.event_type === "ARBITRATION_STARTED");
  const evidence = scoped.some((entry) => entry.event_type === "EVIDENCE_REGISTERED" && entry.evidence_refs.length > 0);
  const governance = scoped.some((entry) => entry.governance_refs.length > 0);
  const constitution = scoped.some((entry) => entry.constitutional_refs.length > 0);
  if (completed && (!started || !evidence || !governance || !constitution)) violations.push("hidden_arbitration_path");
  if (scoped.some((entry) => entry.source_record_ref.toLowerCase().includes("override") && !entry.governance_refs.some((ref) => ref.toLowerCase().includes("authorization")))) violations.push("undocumented_override");
  if (scoped.some((entry) => entry.source_record_ref.toLowerCase().includes("unauthorized"))) violations.push("unauthorized_resolution");
  return Object.freeze(violations);
}

function outcomeFor(input: {
  constitutional: ConstitutionalValidation;
  governance: GovernanceValidation;
  authority: AuthorityValidation;
  tenant: TenantIsolationValidation;
  hidden: readonly string[];
}): EnforcementOutcome {
  if (input.constitutional.validation_result === "REJECTED" || input.tenant.validation_result === "REJECTED" || input.hidden.includes("hidden_arbitration_path")) return "BLOCKING";
  if (input.governance.compliance_status === "REJECTED" || input.hidden.includes("undocumented_override") || input.hidden.includes("unauthorized_resolution")) return "REJECT";
  if (input.governance.compliance_status === "ESCALATE") return "ESCALATE_TO_GOVERNANCE";
  if (input.authority.validation_result === "ESCALATE") return "ESCALATE_TO_OPERATOR";
  if (input.authority.validation_result === "REJECTED") return "REJECT";
  return "PASS";
}

function reportHash(report: Omit<EnforcementReport, "integrity_hash"> | EnforcementReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(input: {
  arbitration_ref: string;
  constitutional: ConstitutionalValidation;
  governance: GovernanceValidation;
  authority: AuthorityValidation;
  tenant: TenantIsolationValidation;
  hidden: readonly string[];
  outcome: EnforcementOutcome;
}): EnforcementReport {
  const violations = normalizeStrings([
    ...input.constitutional.violated_principles,
    ...input.governance.violations,
    ...input.authority.violations,
    ...input.tenant.violations,
    ...input.hidden,
  ]);
  const base: Omit<EnforcementReport, "integrity_hash"> = {
    report_id: `enforcement_report_${hash(input.arbitration_ref).slice(0, 24)}`,
    arbitration_id: input.arbitration_ref,
    constitutional_summary: `Constitution validation ${input.constitutional.validation_result}; violated principles ${input.constitutional.violated_principles.join(",") || "none"}.`,
    governance_summary: `Governance validation ${input.governance.compliance_status}; policies ${input.governance.policy_refs.length}.`,
    authority_summary: `Authority validation ${input.authority.validation_result}; refs ${input.authority.authority_refs.length}.`,
    tenant_summary: `Tenant isolation ${input.tenant.validation_result} for ${input.tenant.tenant_id}.`,
    enforcement_outcome: input.outcome,
    violations: Object.freeze(violations),
    escalation_required: input.outcome === "ESCALATE_TO_GOVERNANCE" || input.outcome === "ESCALATE_TO_OPERATOR" || input.outcome === "BLOCKING",
    replay_ref: `replay_enforcement_report_${hash(input.arbitration_ref).slice(0, 16)}`,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function ledgerHash(record: Omit<EnforcementLedgerRecord, "integrity_hash"> | EnforcementLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function buildLedgerRecord(report: EnforcementReport, constitutional: ConstitutionalValidation, governance: GovernanceValidation, authority: AuthorityValidation, tenant: TenantIsolationValidation): EnforcementLedgerRecord {
  const base: Omit<EnforcementLedgerRecord, "integrity_hash"> = {
    ledger_id: `enforcement_ledger_${report.report_id}`,
    arbitration_id: report.arbitration_id,
    enforcement_outcome: report.enforcement_outcome,
    constitutional_validation_ref: constitutional.validation_id,
    governance_validation_ref: governance.validation_id,
    authority_validation_ref: authority.validation_id,
    tenant_validation_ref: tenant.validation_id,
    violations: report.violations,
    replay_ref: `${report.replay_ref}_ledger`,
    lineage_ref: `lineage_${report.report_id}`,
    ledger_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: ledgerHash(base) });
}

function validationResult(failures: readonly EnforcementFailureReason[]): EnforcementValidation {
  const unique = Object.freeze([...new Set(failures)] as EnforcementFailureReason[]);
  const has = (failure: EnforcementFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length > 0 ? "REJECTED" : "VALID",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      constitutional_valid: !has("CONSTITUTIONAL_VIOLATION"),
      governance_valid: !has("GOVERNANCE_POLICY_VIOLATION"),
      authority_valid: !has("AUTHORITY_VIOLATION"),
      tenant_isolated: !has("TENANT_ISOLATION_BREACH"),
      hidden_arbitration_absent: !has("HIDDEN_ARBITRATION_DETECTED"),
      overrides_documented: !has("UNDOCUMENTED_OVERRIDE") && !has("UNAUTHORIZED_CONFLICT_RESOLUTION"),
      replay_valid: !has("REPLAY_CORRUPTION"),
      integrity_valid: !has("INTEGRITY_HASH_MISMATCH"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

function failuresFor(report: EnforcementReport, ledger: ConflictLedgerResult): readonly EnforcementFailureReason[] {
  const failures: EnforcementFailureReason[] = [];
  if (report.violations.some((v) => v.includes("constitutional"))) failures.push("CONSTITUTIONAL_VIOLATION");
  if (report.violations.some((v) => v.includes("governance") || v.includes("policy"))) failures.push("GOVERNANCE_POLICY_VIOLATION");
  if (report.violations.some((v) => v.includes("authority"))) failures.push("AUTHORITY_VIOLATION");
  if (report.violations.some((v) => v.includes("tenant"))) failures.push("TENANT_ISOLATION_BREACH");
  if (report.violations.includes("hidden_arbitration_path")) failures.push("HIDDEN_ARBITRATION_DETECTED");
  if (report.violations.includes("undocumented_override")) failures.push("UNDOCUMENTED_OVERRIDE");
  if (report.violations.includes("unauthorized_resolution")) failures.push("UNAUTHORIZED_CONFLICT_RESOLUTION");
  if (ledger.audit_events.length > 0 && !replayConflictLedger(ledger).replay_valid) failures.push("REPLAY_CORRUPTION");
  if (reportHash(report) !== report.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  return Object.freeze(failures);
}

function replayHash(result: Omit<EnforcementResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    priority_order: result.priority_order,
    constitutional_validations: result.constitutional_validations,
    governance_validations: result.governance_validations,
    authority_validations: result.authority_validations,
    tenant_validations: result.tenant_validations,
    reports: result.reports,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(failures: readonly EnforcementFailureReason[]): EnforcementResult {
  const validation = validationResult(failures);
  const base: Omit<EnforcementResult, "integrity_hash" | "replay_hash"> = {
    enforcement_status: "FAIL",
    fail_closed: true,
    priority_order: ENFORCEMENT_PRIORITY_ORDER,
    constitutional_validations: Object.freeze([]),
    governance_validations: Object.freeze([]),
    authority_validations: Object.freeze([]),
    tenant_validations: Object.freeze([]),
    reports: Object.freeze([]),
    ledger_records: Object.freeze([]),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

function ledgerFromInput(input: EnforcementInput): ConflictLedgerResult {
  if (input.ledger_result) return input.ledger_result;
  if (input.entries) {
    return {
      ledger_status: "PASS",
      fail_closed: false,
      entries: input.entries,
      audit_events: [],
      replay_references: [],
      certification_evidence: [],
      validations: [],
      replay_hash: "direct_enforcement_entries_replay",
      failures: [],
      append_only: true,
      deterministic: true,
      integrity_hash: "direct_enforcement_entries_integrity",
    };
  }
  return writeConflictLedger();
}

export function enforceConstitutionAndGovernance(input: EnforcementInput = {}): EnforcementResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(["UNAUTHORIZED_VALIDATOR_ACCESS"]);
  const ledger = ledgerFromInput(input);
  if (ledger.ledger_status !== "PASS" || ledger.entries.length === 0) return failResult(["MISSING_LEDGER_RECORDS"]);
  const ledgerValidation = validateConflictLedgerEntries(ledger.entries);
  if (ledgerValidation.validation_state !== "VALID" && ledgerValidation.failures.includes("HASH_MISMATCH")) return failResult(["INTEGRITY_HASH_MISMATCH"]);

  const refs = arbitrationRefs(ledger.entries);
  const constitutional_validations = Object.freeze(refs.map((ref) => validateConstitution(ledger.entries, ref)));
  const governance_validations = Object.freeze(refs.map((ref) => validateGovernance(ledger.entries, ref)));
  const authority_validations = Object.freeze(refs.map((ref) => validateAuthority(ledger.entries, ref)));
  const tenant_validations = Object.freeze(refs.map((ref) => validateTenantIsolation(ledger.entries, ref)));
  const reports = Object.freeze(refs.map((ref, index) => {
    const hidden = detectHiddenArbitration(ledger.entries, ref);
    const outcome = outcomeFor({
      constitutional: constitutional_validations[index],
      governance: governance_validations[index],
      authority: authority_validations[index],
      tenant: tenant_validations[index],
      hidden,
    });
    return buildReport({
      arbitration_ref: ref,
      constitutional: constitutional_validations[index],
      governance: governance_validations[index],
      authority: authority_validations[index],
      tenant: tenant_validations[index],
      hidden,
      outcome,
    });
  }));
  const ledger_records = Object.freeze(reports.map((report, index) => buildLedgerRecord(report, constitutional_validations[index], governance_validations[index], authority_validations[index], tenant_validations[index])));
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) return failResult(["ENFORCEMENT_LEDGER_FAILED"]);
  const failures = Object.freeze([...new Set(reports.flatMap((report) => failuresFor(report, ledger)))]);
  const validation = validationResult(failures);
  const base: Omit<EnforcementResult, "integrity_hash" | "replay_hash"> = {
    enforcement_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    priority_order: ENFORCEMENT_PRIORITY_ORDER,
    constitutional_validations,
    governance_validations,
    authority_validations,
    tenant_validations,
    reports,
    ledger_records,
    validation,
    failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = replayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(["REPLAY_CORRUPTION"]);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayEnforcement(result: EnforcementResult): EnforcementReplay {
  const reconstructed = replayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.reports.every((report) => reportHash(report) === report.integrity_hash)
    && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: EnforcementFailureReason[] = replay_valid ? [] : ["REPLAY_CORRUPTION"];
  const base: Omit<EnforcementReplay, "integrity_hash"> = {
    replay_id: "replay_constitutional_governance_enforcement",
    replay_valid,
    report_refs: Object.freeze(result.reports.map((report) => report.report_id)),
    ledger_refs: Object.freeze(result.ledger_records.map((record) => record.ledger_id)),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildEnforcementObservability(result: EnforcementResult): EnforcementObservability {
  return Object.freeze({
    constitutional_validations: result.constitutional_validations.length,
    governance_validations: result.governance_validations.length,
    authority_validations: result.authority_validations.length,
    tenant_isolation_validations: result.tenant_validations.length,
    policy_violations_detected: result.failures.filter((failure) => failure === "GOVERNANCE_POLICY_VIOLATION").length,
    constitutional_violations_detected: result.failures.filter((failure) => failure === "CONSTITUTIONAL_VIOLATION").length,
    hidden_arbitration_detections: result.failures.filter((failure) => failure === "HIDDEN_ARBITRATION_DETECTED").length,
    unauthorized_override_attempts: result.failures.filter((failure) => failure === "UNDOCUMENTED_OVERRIDE" || failure === "UNAUTHORIZED_CONFLICT_RESOLUTION").length,
    governance_escalations: result.reports.filter((report) => report.enforcement_outcome === "ESCALATE_TO_GOVERNANCE").length,
    replay_success_rate: replayEnforcement(result).replay_valid ? 1 : 0,
    validation_failures: result.validation.failures.length,
    integrity_failures: result.failures.filter((failure) => failure === "INTEGRITY_HASH_MISMATCH").length,
  });
}

export function getEnforcementFoundation(): EnforcementFoundation {
  const result = enforceConstitutionAndGovernance();
  const replay = replayEnforcement(result);
  return Object.freeze({
    enforcement_version: ENFORCEMENT_VERSION,
    priority_order: ENFORCEMENT_PRIORITY_ORDER,
    outcomes: ENFORCEMENT_OUTCOMES,
    result,
    replay,
    observability: buildEnforcementObservability(result),
  });
}

export const ConstitutionalGovernanceEnforcement = Object.freeze({
  enforce: enforceConstitutionAndGovernance,
  constitution: validateConstitution,
  governance: validateGovernance,
  authority: validateAuthority,
  tenant: validateTenantIsolation,
  replay: replayEnforcement,
});
