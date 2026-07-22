import {
  createDecisionContract,
  validateDecisionContract as validateDecisionContractFoundation,
} from "@/services/decision-contract";
import {
  createDecisionOrchestrationRecord,
  validateDecisionOrchestrationRecordSchema,
} from "@/services/decision-schema";
import { createDecisionLifecycle, validateLifecycleState, validateStateTransition } from "@/services/decision-lifecycle";
import {
  createComplianceEvaluation,
  validateConstitutionalCompliance,
  validateGovernanceCompliance,
} from "@/services/decision-compliance";
import { createAuthorityBoundaryRecord, validateAuthorityBoundary } from "@/services/decision-authority-boundary";
import {
  createReplayLineageContract,
  validateDecisionLineage,
  validateReplayReferences,
} from "@/services/decision-replay-lineage";
import {
  createDecisionIntegrityEvaluation,
  generateDecisionIntegrityHash,
  validateDecisionIntegrity,
} from "@/services/decision-integrity";
import type {
  DecisionValidationDomain,
  DecisionValidationErrorClass,
  DecisionValidationFailure,
  DecisionValidationInput,
  DecisionValidationObservability,
  DecisionValidationScenario,
  DecisionValidationSeverity,
  DecisionValidationState,
  DomainValidationResult,
  ValidationEvidencePackage,
  ValidationMetadata,
  ValidationReplayResult,
  ValidationReport,
  ValidationRuleRecord,
} from "@/types/decision-validation-engine";

const NOW = "2026-07-02T09:19:00.000Z";
const DOMAINS: readonly DecisionValidationDomain[] = Object.freeze(["SCHEMA", "LIFECYCLE", "GOVERNANCE", "CONSTITUTION", "AUTHORITY", "REPLAY", "LINEAGE", "INTEGRITY"] as const);

const RULES: readonly ValidationRuleRecord[] = Object.freeze(DOMAINS.flatMap((domain, index) => {
  const descriptions: Record<DecisionValidationDomain, readonly (readonly [string, string, DecisionValidationSeverity])[]> = {
    SCHEMA: Object.freeze([["schema-structure", "Contract and orchestration schema must be complete, supported, tenant-scoped, and serializable.", "CRITICAL"] as const]),
    LIFECYCLE: Object.freeze([["lifecycle-state", "Lifecycle state, ordering, transition legality, and replay metadata must be valid.", "ERROR"] as const]),
    GOVERNANCE: Object.freeze([["governance-compliance", "Governance references, policies, evidence, versions, and replay readiness must be compliant.", "CRITICAL"] as const]),
    CONSTITUTION: Object.freeze([["constitutional-compliance", "Constitutional references, supremacy rules, authority constraints, and evidence must be compliant.", "CRITICAL"] as const]),
    AUTHORITY: Object.freeze([["authority-boundary", "Authority hierarchy, escalation path, advisory-only limits, and operator boundaries must be preserved.", "CRITICAL"] as const]),
    REPLAY: Object.freeze([["replay-fidelity", "Replay references, order, versions, and referenced records must be complete and deterministic.", "ERROR"] as const]),
    LINEAGE: Object.freeze([["lineage-integrity", "Lineage must be complete, acyclic, chronological, tenant-scoped, and append-only.", "ERROR"] as const]),
    INTEGRITY: Object.freeze([["integrity-immutability", "Hashes, serialization, ordering, append-only history, and mutation detection must be reproducible.", "CRITICAL"] as const]),
  };
  return descriptions[domain].map(([name, description, severity], offset) => Object.freeze({
    validation_rule_id: `dve_9_1_9_${String(index + 1).padStart(2, "0")}_${name}`,
    validation_domain: domain,
    rule_name: name,
    rule_description: description,
    severity,
    evaluation_order: index + offset + 1,
    fail_closed: true,
    replay_supported: true,
    version: "decision-validation-rule/v1",
    created_at: NOW,
  }));
}));

function uniq<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function scenarioForDomain(domain: DecisionValidationDomain, scenario?: DecisionValidationScenario): string | undefined {
  const map: Partial<Record<DecisionValidationScenario, Partial<Record<DecisionValidationDomain, string>>>> = {
    SCHEMA_INVALID: { SCHEMA: "SCHEMA_INVALID" },
    LIFECYCLE_INVALID: { LIFECYCLE: "LIFECYCLE_INVALID" },
    GOVERNANCE_MISSING: { GOVERNANCE: "GOVERNANCE_MISSING" },
    CONSTITUTIONAL_VIOLATION: { CONSTITUTION: "CONSTITUTIONAL_VIOLATION" },
    AUTHORITY_ESCALATION: { AUTHORITY: "AUTHORITY_ESCALATION" },
    REPLAY_INCONSISTENCY: { REPLAY: "REPLAY_INCONSISTENCY" },
    LINEAGE_CORRUPTION: { LINEAGE: "LINEAGE_CORRUPTION" },
    INTEGRITY_MISMATCH: { INTEGRITY: "INTEGRITY_MISMATCH" },
    UNSUPPORTED_VERSION: { SCHEMA: "UNSUPPORTED_VERSION" },
    TENANT_VIOLATION: { SCHEMA: "TENANT_VIOLATION", LINEAGE: "TENANT_VIOLATION", INTEGRITY: "TENANT_VIOLATION" },
  };
  return scenario ? map[scenario]?.[domain] : undefined;
}

export function classifyValidationError(domain: DecisionValidationDomain, reason: string): DecisionValidationErrorClass {
  const upper = reason.toUpperCase();
  if (upper.includes("TENANT") || upper.includes("MISSION_SCOPE")) return "TENANT_ERROR";
  if (upper.includes("VERSION") || upper.includes("UNSUPPORTED")) return "VERSION_ERROR";
  if (upper.includes("SERIALIZATION") || upper.includes("DETERMINISTIC")) return "SERIALIZATION_ERROR";
  if (upper.includes("INTEGRITY") || upper.includes("HASH") || upper.includes("MUTATION") || upper.includes("APPEND") || upper.includes("OVERWRITE")) return "INTEGRITY_ERROR";
  if (upper.includes("CONSTITUTION")) return "CONSTITUTION_ERROR";
  if (upper.includes("GOVERNANCE") || upper.includes("POLICY")) return "GOVERNANCE_ERROR";
  if (upper.includes("LINEAGE") || upper.includes("PARENT") || upper.includes("CHILD") || upper.includes("CIRCULAR")) return "LINEAGE_ERROR";
  if (upper.includes("REPLAY") || upper.includes("REFERENCE") || upper.includes("ORDER")) return "REPLAY_ERROR";
  if (upper.includes("AUTHORITY") || upper.includes("APPROVAL") || upper.includes("EXECUTION") || upper.includes("ESCALATION") || upper.includes("SELF")) return "AUTHORITY_ERROR";
  if (domain === "SCHEMA") return "SCHEMA_ERROR";
  if (domain === "LIFECYCLE") return "LIFECYCLE_ERROR";
  return "UNKNOWN_ERROR";
}

function severityFor(errorClass: DecisionValidationErrorClass): DecisionValidationSeverity {
  if (["GOVERNANCE_ERROR", "CONSTITUTION_ERROR", "AUTHORITY_ERROR", "INTEGRITY_ERROR", "TENANT_ERROR"].includes(errorClass)) return "CRITICAL";
  if (["SCHEMA_ERROR", "LIFECYCLE_ERROR", "REPLAY_ERROR", "LINEAGE_ERROR", "SERIALIZATION_ERROR", "VERSION_ERROR"].includes(errorClass)) return "ERROR";
  return "WARNING";
}

function failure(domain: DecisionValidationDomain, reason: string): DecisionValidationFailure {
  const error_class = classifyValidationError(domain, reason);
  return Object.freeze({ validation_domain: domain, error_class, severity: severityFor(error_class), reason, fail_closed: true });
}

function domainHash(value: Omit<DomainValidationResult, "integrity_hash">): string {
  return generateDecisionIntegrityHash(value);
}

function domainResult(input: {
  domain: DecisionValidationDomain;
  reasons: readonly string[];
  warnings?: readonly string[];
  evidence_refs?: readonly string[];
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
}): DomainValidationResult {
  const rules = getValidationRules().filter((rule) => rule.validation_domain === input.domain);
  const failures = Object.freeze(input.reasons.map((reason) => failure(input.domain, reason)).sort((a, b) => `${a.error_class}:${a.reason}`.localeCompare(`${b.error_class}:${b.reason}`)));
  const warnings = Object.freeze([...(input.warnings ?? [])].sort());
  const validation_result: DecisionValidationState = failures.length ? "FAIL" : warnings.length ? "CONDITIONAL_PASS" : "PASS";
  const base: Omit<DomainValidationResult, "integrity_hash"> = {
    validation_domain: input.domain,
    validation_result,
    evaluation_order: DOMAINS.indexOf(input.domain) + 1,
    rule_ids: Object.freeze(rules.map((rule) => rule.validation_rule_id).sort()),
    warnings,
    failures,
    evidence_refs: Object.freeze([...(input.evidence_refs ?? [`evidence_${input.domain.toLowerCase()}_validation`])].sort()),
    replay_refs: Object.freeze([...(input.replay_refs ?? [`replay_${input.domain.toLowerCase()}_validation`])].sort()),
    lineage_refs: Object.freeze([...(input.lineage_refs ?? [`lineage_${input.domain.toLowerCase()}_validation`])].sort()),
  };
  return Object.freeze({ ...base, integrity_hash: domainHash(base) });
}

export function validateDomain(domain: DecisionValidationDomain, input: DecisionValidationInput = {}): DomainValidationResult {
  const scenario = scenarioForDomain(domain, input.scenario);
  if (domain === "SCHEMA") {
    const contract = scenario === "UNSUPPORTED_VERSION"
      ? createDecisionContract({ contract_version: "2.0.0" })
      : scenario === "TENANT_VIOLATION"
        ? createDecisionContract({ optional_fields: { advisory_notes: Object.freeze(["tenant_beta leakage"]) } })
        : input.contract ?? createDecisionContract();
    const orchestration = scenario === "SCHEMA_INVALID"
      ? createDecisionOrchestrationRecord({ input: createDecisionOrchestrationRecord().input, references: Object.freeze([]) })
      : input.orchestration_record ?? createDecisionOrchestrationRecord();
    const contractReasons = validateDecisionContractFoundation(contract).errors.map((error) => error.reason);
    const schemaReasons = validateDecisionOrchestrationRecordSchema(orchestration).errors.map((error) => error.reason);
    const warnings = input.scenario === "CONDITIONAL_WARNING" ? Object.freeze(["OPTIONAL_VISUALIZATION_METADATA_MISSING"] as const) : Object.freeze([] as const);
    return domainResult({ domain, reasons: uniq([...contractReasons, ...schemaReasons]), warnings });
  }
  if (domain === "LIFECYCLE") {
    const lifecycle = createDecisionLifecycle();
    const validation = scenario === "LIFECYCLE_INVALID"
      ? validateStateTransition({ lifecycle, next_state: "ORCHESTRATED", transition_reason: "invalid skip", replay_reference: "replay_invalid_skip" })
      : input.lifecycle_transition ? validateStateTransition(input.lifecycle_transition) : validateLifecycleState(lifecycle);
    return domainResult({ domain, reasons: validation.failures });
  }
  if (domain === "GOVERNANCE" || domain === "CONSTITUTION") {
    const complianceScenario = domain === "GOVERNANCE" && scenario === "GOVERNANCE_MISSING" ? "MISSING_GOVERNANCE"
      : domain === "CONSTITUTION" && scenario === "CONSTITUTIONAL_VIOLATION" ? "CONSTITUTIONAL_BYPASS"
        : input.compliance_input?.scenario;
    const evaluation = createComplianceEvaluation({ ...input.compliance_input, scenario: complianceScenario });
    const validation = domain === "GOVERNANCE" ? validateGovernanceCompliance(evaluation) : validateConstitutionalCompliance(evaluation);
    return domainResult({ domain, reasons: validation.failures, replay_refs: evaluation.metadata.replay_refs, lineage_refs: evaluation.metadata.lineage_refs });
  }
  if (domain === "AUTHORITY") {
    const authorityScenario = scenario === "AUTHORITY_ESCALATION" ? "PRIVILEGE_ESCALATION" : input.authority_input?.scenario;
    const record = createAuthorityBoundaryRecord({ ...input.authority_input, scenario: authorityScenario });
    const validation = validateAuthorityBoundary(record, { ...input.authority_input, scenario: authorityScenario });
    return domainResult({ domain, reasons: validation.failures, replay_refs: record.replay_refs, lineage_refs: record.lineage_refs });
  }
  if (domain === "REPLAY" || domain === "LINEAGE") {
    const replayScenario = domain === "REPLAY" && scenario === "REPLAY_INCONSISTENCY" ? "ORDER_FAILURE"
      : domain === "LINEAGE" && scenario === "LINEAGE_CORRUPTION" ? "BROKEN_LINEAGE"
        : input.replay_input?.scenario;
    const contract = createReplayLineageContract({ ...input.replay_input, scenario: replayScenario });
    const validation = domain === "REPLAY" ? validateReplayReferences(contract) : validateDecisionLineage(contract);
    return domainResult({ domain, reasons: validation.failures, replay_refs: contract.replay_references.map((ref) => ref.replay_reference_id), lineage_refs: [contract.lineage.lineage_id] });
  }
  const integrityScenario = scenario === "INTEGRITY_MISMATCH" ? "HASH_MISMATCH" : scenario === "TENANT_VIOLATION" ? "TENANT_VIOLATION" : input.integrity_input?.scenario;
  const evaluation = createDecisionIntegrityEvaluation({ ...input.integrity_input, scenario: integrityScenario });
  const validation = validateDecisionIntegrity(evaluation);
  return domainResult({ domain, reasons: validation.failures, replay_refs: [evaluation.integrity_record.replay_hash], lineage_refs: [evaluation.integrity_record.lineage_hash] });
}

function resultForDomains(domains: readonly DomainValidationResult[]): DecisionValidationState {
  if (domains.some((domain) => domain.validation_result === "FAIL")) return "FAIL";
  if (domains.some((domain) => domain.validation_result === "CONDITIONAL_PASS")) return "CONDITIONAL_PASS";
  return "PASS";
}

function stripReportHash(report: Omit<ValidationReport, "integrity_hash"> | ValidationReport): Record<string, unknown> {
  const copy = { ...(report as ValidationReport) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return copy;
}

function reportHash(report: Omit<ValidationReport, "integrity_hash"> | ValidationReport): string {
  return generateDecisionIntegrityHash(stripReportHash(report));
}

export function generateValidationReport(domainResults: readonly DomainValidationResult[], input: DecisionValidationInput = {}): ValidationReport {
  const schema = domainResults.find((result) => result.validation_domain === "SCHEMA") ?? validateDomain("SCHEMA", input);
  const lifecycle = domainResults.find((result) => result.validation_domain === "LIFECYCLE") ?? validateDomain("LIFECYCLE", input);
  const governance = domainResults.find((result) => result.validation_domain === "GOVERNANCE") ?? validateDomain("GOVERNANCE", input);
  const constitution = domainResults.find((result) => result.validation_domain === "CONSTITUTION") ?? validateDomain("CONSTITUTION", input);
  const authority = domainResults.find((result) => result.validation_domain === "AUTHORITY") ?? validateDomain("AUTHORITY", input);
  const replay = domainResults.find((result) => result.validation_domain === "REPLAY") ?? validateDomain("REPLAY", input);
  const lineage = domainResults.find((result) => result.validation_domain === "LINEAGE") ?? validateDomain("LINEAGE", input);
  const integrity = domainResults.find((result) => result.validation_domain === "INTEGRITY") ?? validateDomain("INTEGRITY", input);
  const ordered = Object.freeze([schema, lifecycle, governance, constitution, authority, replay, lineage, integrity]);
  const baseContract = input.contract ?? createDecisionContract();
  const validation_result = resultForDomains(ordered);
  const failures = Object.freeze(ordered.flatMap((result) => result.failures).sort((a, b) => `${a.validation_domain}:${a.error_class}:${a.reason}`.localeCompare(`${b.validation_domain}:${b.error_class}:${b.reason}`)));
  const warnings = Object.freeze(ordered.flatMap((result) => result.warnings).sort());
  const evidenceBase: Omit<ValidationEvidencePackage, "integrity_hash"> = {
    evidence_package_id: `evidence_validation_${baseContract.orchestration_id}`,
    orchestration_id: baseContract.orchestration_id,
    tenant_id: baseContract.tenant_id,
    mission_id: baseContract.mission_id,
    validation_sequence: DOMAINS,
    rule_ids: Object.freeze(ordered.flatMap((result) => result.rule_ids).sort()),
    evidence_refs: uniq(ordered.flatMap((result) => result.evidence_refs).sort()),
    replay_refs: uniq(ordered.flatMap((result) => result.replay_refs).sort()),
    lineage_refs: uniq(ordered.flatMap((result) => result.lineage_refs).sort()),
  };
  const evidence_package = Object.freeze({ ...evidenceBase, integrity_hash: generateDecisionIntegrityHash(evidenceBase) });
  const metadataBase: Omit<ValidationMetadata, "deterministic_hash"> = {
    validation_id: `validation_${baseContract.orchestration_id}`,
    orchestration_id: baseContract.orchestration_id,
    validation_version: "decision-validation-engine/v1",
    validator_version: "9.1.9",
    validation_duration: 0,
    replay_reference: `replay_validation_${baseContract.orchestration_id}`,
    validation_status: validation_result,
    created_at: NOW,
  };
  const metadata = Object.freeze({ ...metadataBase, deterministic_hash: generateDecisionIntegrityHash(metadataBase) });
  const base: Omit<ValidationReport, "integrity_hash"> = {
    validation_report_id: `validation_report_${baseContract.orchestration_id}`,
    orchestration_id: baseContract.orchestration_id,
    tenant_id: baseContract.tenant_id,
    mission_id: baseContract.mission_id,
    validation_result,
    schema_result: schema,
    lifecycle_result: lifecycle,
    governance_result: governance,
    constitutional_result: constitution,
    authority_result: authority,
    replay_result: replay,
    lineage_result: lineage,
    integrity_result: integrity,
    warnings,
    failures,
    replay_refs: evidence_package.replay_refs,
    lineage_refs: evidence_package.lineage_refs,
    evidence_package,
    metadata,
    advisory_only: true,
    validated_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function validateDecisionContract(input: DecisionValidationInput = {}): ValidationReport {
  const domainResults = DOMAINS.map((domain) => validateDomain(domain, input));
  return generateValidationReport(domainResults, input);
}

export function replayValidation(report: ValidationReport): ValidationReplayResult {
  const reconstructed_hash = reportHash(report);
  return Object.freeze({
    validation_report_id: report.validation_report_id,
    replay_valid: reconstructed_hash === report.integrity_hash,
    reconstructed_result: report.validation_result,
    reconstructed_sequence: DOMAINS,
    reconstructed_failures: report.failures,
    reconstructed_hash,
    expected_hash: report.integrity_hash,
  });
}

export function getValidationRules(): readonly ValidationRuleRecord[] {
  return RULES;
}

export function buildDecisionValidationObservability(reports: readonly ValidationReport[]): DecisionValidationObservability {
  const replayResults = reports.map((report) => replayValidation(report));
  const failures = reports.flatMap((report) => report.failures);
  const byDomain = DOMAINS.reduce<Record<DecisionValidationDomain, number>>((counts, domain) => {
    counts[domain] = failures.filter((failure) => failure.validation_domain === domain).length;
    return counts;
  }, {} as Record<DecisionValidationDomain, number>);
  const errorClasses: readonly DecisionValidationErrorClass[] = Object.freeze(["SCHEMA_ERROR", "LIFECYCLE_ERROR", "GOVERNANCE_ERROR", "CONSTITUTION_ERROR", "AUTHORITY_ERROR", "REPLAY_ERROR", "LINEAGE_ERROR", "INTEGRITY_ERROR", "SERIALIZATION_ERROR", "VERSION_ERROR", "TENANT_ERROR", "UNKNOWN_ERROR"] as const);
  const byError = errorClasses.reduce<Record<DecisionValidationErrorClass, number>>((counts, errorClass) => {
    counts[errorClass] = failures.filter((failure) => failure.error_class === errorClass).length;
    return counts;
  }, {} as Record<DecisionValidationErrorClass, number>);
  return Object.freeze({
    validation_requests: reports.length,
    validation_duration_ms: reports.reduce((sum, report) => sum + report.metadata.validation_duration, 0),
    pass_rate: reports.length === 0 ? 0 : reports.filter((report) => report.validation_result === "PASS").length / reports.length,
    conditional_pass_rate: reports.length === 0 ? 0 : reports.filter((report) => report.validation_result === "CONDITIONAL_PASS").length / reports.length,
    failure_rate: reports.length === 0 ? 0 : reports.filter((report) => report.validation_result === "FAIL").length / reports.length,
    validation_domain_failures: Object.freeze(byDomain),
    error_classifications: Object.freeze(byError),
    replay_mismatches: replayResults.filter((result) => !result.replay_valid).length,
    validation_throughput: reports.length,
    deterministic_replay_success_rate: reports.length === 0 ? 0 : replayResults.filter((result) => result.replay_valid).length / reports.length,
  });
}

export function getDecisionValidationEngine() {
  const report = validateDecisionContract();
  return Object.freeze({
    validation_order: DOMAINS,
    rules: getValidationRules(),
    report,
    replay: replayValidation(report),
    observability: buildDecisionValidationObservability([report]),
  });
}
