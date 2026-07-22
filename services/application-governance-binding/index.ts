import { runApplicationEvidenceSourceGovernance, validateApplicationEvidenceSourceGovernance } from "@/services/application-evidence-source-governance";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationGovernanceBindingResult,
  ApplicationGovernanceBundle,
  ApplicationGovernanceFailure,
  ApplicationGovernanceInput,
  ApplicationGovernanceOutcome,
  ApplicationGovernanceScenario,
  ApplicationGovernanceValidation,
  GovernancePathStep,
} from "@/types/application-governance-binding";

const VERSION = "application-governance-binding/v4.8" as const;
const IDENTIFIER = "ApplicationGovernanceBinding" as const;
const GOVERNANCE_SEQUENCE: readonly GovernancePathStep[] = Object.freeze(["APPLICATION_REQUEST", "APPLICATION_GOVERNANCE_BINDING", "CAF_AUTHORITY_GATE", "CAF_POLICY_GATE", "CAF_SAFETY_GATE", "APPROVAL_ROUTING", "EXECUTION_DECISION"]);
let baselineEvidenceGovernance: ReturnType<typeof runApplicationEvidenceSourceGovernance> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}
function nested<T extends object>(value: T): T & { integrity_hash: string } {
  return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string };
}
function has(failures: readonly ApplicationGovernanceFailure[], failure: ApplicationGovernanceFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationGovernanceScenario): ApplicationGovernanceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationGovernanceFailure[]): ApplicationGovernanceOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineEvidenceGovernance() { baselineEvidenceGovernance ??= runApplicationEvidenceSourceGovernance(); return baselineEvidenceGovernance; }

function resultReplayHash(result: Omit<ApplicationGovernanceBindingResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    binding: result.constitutional_binding.integrity_hash,
    authority: result.authority_binding.integrity_hash,
    governance: result.governance_binding.integrity_hash,
    approval: result.approval_routing.integrity_hash,
    policy: result.policy_compliance.integrity_hash,
    safety: result.safety_compliance.integrity_hash,
    evidence: result.governance_evidence.integrity_hash,
    compliance: result.compliance_report.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationGovernanceBindingResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationGovernanceBinding(input: ApplicationGovernanceInput = {}): ApplicationGovernanceBindingResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationGovernanceFailure>(direct ? [direct] : []);
  const evidenceGovernance = getBaselineEvidenceGovernance();
  const dependencyFailures = freezeArray<ApplicationGovernanceFailure>([
    ...(!validateApplicationEvidenceSourceGovernance(evidenceGovernance).valid || has(scenarioFailures, "P4_7_EVIDENCE_GOVERNANCE_INVALID") ? ["P4_7_EVIDENCE_GOVERNANCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_GOVERNANCE_SERVICES_INVALID") ? ["CCI_GOVERNANCE_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_GOVERNANCE_REGISTRY_INVALID") ? ["CCI_GOVERNANCE_REGISTRY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_EVIDENCE_SERVICES_INVALID") ? ["CCI_EVIDENCE_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_IDENTITY_SERVICES_INVALID") ? ["CCI_IDENTITY_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_AUDIT_SERVICES_INVALID") ? ["CCI_AUDIT_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_AUTHORITY_GATE_INVALID") ? ["CAF_AUTHORITY_GATE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_POLICY_GATE_INVALID") ? ["CAF_POLICY_GATE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_SAFETY_GATE_INVALID") ? ["CAF_SAFETY_GATE_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_AUTHORITY_MATRIX_INVALID") ? ["CAF_AUTHORITY_MATRIX_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_WARNING_FRAMEWORK_INVALID") ? ["CAF_WARNING_FRAMEWORK_INVALID" as const] : []),
    ...(has(scenarioFailures, "CAF_GOVERNANCE_EVIDENCE_INVALID") ? ["CAF_GOVERNANCE_EVIDENCE_INVALID" as const] : []),
    ...(has(scenarioFailures, "PROGRAM_1_CONSTITUTIONAL_BASELINE_INVALID") ? ["PROGRAM_1_CONSTITUTIONAL_BASELINE_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const applicationId = evidenceGovernance.evidence_index.application_id;
  const constitutional_binding = nested({
    binding_id: has(failures, "CONSTITUTIONAL_BINDING_MISSING") ? "" : "P4.8-CONSTITUTIONAL-BINDING-001",
    application_id: applicationId,
    authority_hierarchy: freezeArray(["Civitas Constitution", "Program Constitutional Contracts", "Tenant Constitutional Contracts", "CAF Authority Matrix", "Application Governance"]),
    governance_sequence: has(failures, "CONSTITUTIONAL_GOVERNANCE_BYPASS_ALLOWED") ? freezeArray(["APPLICATION_REQUEST", "EXECUTION_DECISION"] as const) : GOVERNANCE_SEQUENCE,
    constitutional_inheritance: !has(failures, "CONSTITUTIONAL_BINDING_MISSING"),
    governance_inheritance: !has(failures, "GOVERNANCE_INHERITANCE_NON_DETERMINISTIC"),
    authority_inheritance: !has(failures, "AUTHORITY_INHERITANCE_INVALID"),
    contracts_validated: !has(failures, "GOVERNANCE_CONTRACT_INVALID"),
    deterministic: !has(failures, "GOVERNANCE_INHERITANCE_NON_DETERMINISTIC"),
    independent_governance_defined: has(failures, "INDEPENDENT_GOVERNANCE_MODEL_DEFINED"),
  });
  const authority_binding = nested({
    registry_id: "P4.8-AUTHORITY-BINDING-REGISTRY-001",
    inherited_authority_refs: freezeArray(["Program 1 Authority Specifications", "Program 3 CAF Authority Matrix"]),
    authority_ceilings: freezeArray(["application-may-restrict-only", "tenant-ceiling", "caf-authority-ceiling"]),
    tenant_restrictions: freezeArray(["tenant-contract-required", input.tenant_id ?? "tenant:qualified:primary"]),
    application_restrictions: freezeArray(["no-authority-expansion", "approval-required-for-governed-actions"]),
    authority_validation: !has(failures, "AUTHORITY_INHERITANCE_INVALID") && !has(failures, "CAF_AUTHORITY_MATRIX_INVALID"),
    authority_expansion_impossible: !has(failures, "AUTHORITY_EXPANSION_ALLOWED"),
  });
  const governance_binding = nested({
    registry_id: "P4.8-GOVERNANCE-REGISTRY-001",
    governance_contract_refs: has(failures, "GOVERNANCE_CONTRACT_INVALID") ? freezeArray([]) : freezeArray(["contract:p4.8:governance-binding"]),
    governance_attachment_refs: has(failures, "GOVERNANCE_NOT_ATTACHED") ? freezeArray([]) : freezeArray(["attachment:p4.8:application-to-caf"]),
    governance_lifecycle_refs: freezeArray(["lifecycle:p4.8:binding"]),
    governance_attached: !has(failures, "GOVERNANCE_NOT_ATTACHED"),
    governance_validated: !has(failures, "GOVERNANCE_CONTRACT_INVALID"),
    duplicates_governance_engine: has(failures, "GOVERNANCE_ENGINE_DUPLICATED"),
  });
  const approval_routing = nested({
    routing_id: "P4.8-APPROVAL-ROUTING-001",
    caf_authority_gate_ref: has(failures, "CAF_AUTHORITY_GATE_NOT_BOUND") ? "" : "Program 3 - CAF Authority Gate",
    approval_delegation_refs: freezeArray(["delegation:caf-authority-gate", "delegation:tenant-authority"]),
    routing_rules: freezeArray(["authority-gate-first", "policy-gate-second", "safety-gate-third", "approval-routing-before-decision"]),
    approval_lineage_refs: has(failures, "APPROVAL_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:p4.8:approval"]),
    deterministic: !has(failures, "APPROVAL_ROUTING_NON_DETERMINISTIC"),
    reproducible: !has(failures, "APPROVAL_ROUTING_NON_DETERMINISTIC"),
  });
  const policy_compliance = nested({
    compliance_id: "P4.8-POLICY-COMPLIANCE-001",
    caf_policy_gate_ref: has(failures, "CAF_POLICY_GATE_NOT_BOUND") ? "" : "Program 3 - CAF Policy Gate",
    policy_binding_refs: freezeArray(["binding:p4.8:policy"]),
    inherited_policy_refs: has(failures, "POLICY_INHERITANCE_INVALID") ? freezeArray([]) : freezeArray(["Program 1 Governance Specifications", "CAF Policy Gate"]),
    policy_evaluation_contract_refs: freezeArray(["contract:p4.8:policy-evaluation-consumer"]),
    policies_inherited: !has(failures, "POLICY_INHERITANCE_INVALID"),
    validation_complete: !has(failures, "CAF_POLICY_GATE_INVALID"),
    duplicates_policy_engine: has(failures, "POLICY_ENGINE_DUPLICATED") || has(failures, "POLICY_EVALUATION_DUPLICATED"),
  });
  const safety_compliance = nested({
    compliance_id: "P4.8-SAFETY-COMPLIANCE-001",
    caf_safety_gate_ref: has(failures, "CAF_SAFETY_GATE_NOT_BOUND") ? "" : "Program 3 - CAF Safety Gate",
    safety_binding_refs: freezeArray(["binding:p4.8:safety"]),
    safety_governance_refs: freezeArray(["CAF Safety Gate", "CAF Warning Framework"]),
    safety_evidence_refs: has(failures, "SAFETY_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray(["lineage:p4.8:safety"]),
    safety_enforcement_inherited: !has(failures, "CAF_SAFETY_GATE_INVALID"),
    safety_lineage_complete: !has(failures, "SAFETY_LINEAGE_INCOMPLETE"),
    duplicates_safety_engine: has(failures, "SAFETY_ENGINE_DUPLICATED") || has(failures, "SAFETY_EVALUATION_DUPLICATED"),
  });
  const governance_evidence = nested({
    evidence_id: "P4.8-GOVERNANCE-EVIDENCE-001",
    authority_compliance_refs: has(failures, "GOVERNANCE_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([authority_binding.registry_id]),
    policy_compliance_refs: has(failures, "GOVERNANCE_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([policy_compliance.compliance_id]),
    safety_compliance_refs: has(failures, "GOVERNANCE_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray([safety_compliance.compliance_id]),
    approval_lineage_refs: has(failures, "GOVERNANCE_EVIDENCE_MISSING") ? freezeArray([]) : approval_routing.approval_lineage_refs,
    governance_lineage_refs: has(failures, "GOVERNANCE_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([constitutional_binding.binding_id, governance_binding.registry_id, evidenceGovernance.certification.certification_id]),
    reproducible: true,
    complete: !has(failures, "GOVERNANCE_EVIDENCE_MISSING"),
  });
  const compliance_report = nested({
    report_id: has(failures, "COMPLIANCE_REPORT_MISSING") ? "" : "P4.8-COMPLIANCE-REPORT-001",
    compliance_record_id: has(failures, "COMPLIANCE_RECORD_MISSING") ? "" : "P4.8-COMPLIANCE-RECORD-001",
    inherited_authority_summary: "Application authority is bounded by constitutional hierarchy and CAF authority matrix.",
    policy_compliance_summary: "Application policy compliance is inherited through CAF Policy Gate binding.",
    safety_compliance_summary: "Application safety compliance is inherited through CAF Safety Gate binding.",
    approval_history_refs: approval_routing.approval_lineage_refs,
    governance_lineage_refs: governance_evidence.governance_lineage_refs,
    reproducible: true,
    generated: !has(failures, "COMPLIANCE_REPORT_MISSING"),
  });
  const noOutOfScope = !has(failures, "GOVERNANCE_ENGINE_DUPLICATED") && !has(failures, "POLICY_ENGINE_DUPLICATED") && !has(failures, "SAFETY_ENGINE_DUPLICATED") && !has(failures, "AUTHORITY_EVALUATION_DUPLICATED") && !has(failures, "POLICY_EVALUATION_DUPLICATED") && !has(failures, "SAFETY_EVALUATION_DUPLICATED") && !has(failures, "EXECUTION_ADMISSION_ATTEMPTED") && !has(failures, "RUNTIME_GOVERNANCE_ATTEMPTED") && !has(failures, "CERTIFICATION_ATTEMPTED") && !has(failures, "EVIDENCE_STORAGE_ATTEMPTED") && !has(failures, "AUDIT_INFRASTRUCTURE_ATTEMPTED");
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(constitutional_binding.binding_id.length === 0 ? ["CONSTITUTIONAL_BINDING_MISSING" as const] : []),
    ...(!constitutional_binding.deterministic ? ["GOVERNANCE_INHERITANCE_NON_DETERMINISTIC" as const] : []),
    ...(!authority_binding.authority_validation ? ["AUTHORITY_INHERITANCE_INVALID" as const] : []),
    ...(!authority_binding.authority_expansion_impossible ? ["AUTHORITY_EXPANSION_ALLOWED" as const] : []),
    ...(constitutional_binding.independent_governance_defined ? ["INDEPENDENT_GOVERNANCE_MODEL_DEFINED" as const] : []),
    ...(governance_binding.duplicates_governance_engine ? ["GOVERNANCE_ENGINE_DUPLICATED" as const] : []),
    ...(policy_compliance.duplicates_policy_engine ? ["POLICY_ENGINE_DUPLICATED" as const] : []),
    ...(safety_compliance.duplicates_safety_engine ? ["SAFETY_ENGINE_DUPLICATED" as const] : []),
    ...(!governance_binding.governance_attached ? ["GOVERNANCE_NOT_ATTACHED" as const] : []),
    ...(!governance_binding.governance_validated ? ["GOVERNANCE_CONTRACT_INVALID" as const] : []),
    ...(!approval_routing.deterministic ? ["APPROVAL_ROUTING_NON_DETERMINISTIC" as const] : []),
    ...(approval_routing.approval_lineage_refs.length === 0 ? ["APPROVAL_LINEAGE_INCOMPLETE" as const] : []),
    ...(approval_routing.caf_authority_gate_ref.length === 0 ? ["CAF_AUTHORITY_GATE_NOT_BOUND" as const] : []),
    ...(policy_compliance.caf_policy_gate_ref.length === 0 ? ["CAF_POLICY_GATE_NOT_BOUND" as const] : []),
    ...(safety_compliance.caf_safety_gate_ref.length === 0 ? ["CAF_SAFETY_GATE_NOT_BOUND" as const] : []),
    ...(!policy_compliance.policies_inherited ? ["POLICY_INHERITANCE_INVALID" as const] : []),
    ...(!safety_compliance.safety_lineage_complete ? ["SAFETY_LINEAGE_INCOMPLETE" as const] : []),
    ...(!governance_evidence.complete ? ["GOVERNANCE_EVIDENCE_MISSING" as const] : []),
    ...(governance_evidence.governance_lineage_refs.length === 0 ? ["GOVERNANCE_LINEAGE_INCOMPLETE" as const] : []),
    ...(compliance_report.report_id.length === 0 ? ["COMPLIANCE_REPORT_MISSING" as const] : []),
    ...(compliance_report.compliance_record_id.length === 0 ? ["COMPLIANCE_RECORD_MISSING" as const] : []),
    ...(constitutional_binding.governance_sequence.length !== GOVERNANCE_SEQUENCE.length ? ["CONSTITUTIONAL_GOVERNANCE_BYPASS_ALLOWED" as const] : []),
    ...(!noOutOfScope ? ["RUNTIME_GOVERNANCE_ATTEMPTED" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.8-GOVERNANCE-BINDING-CERTIFICATION-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    applications_constitutionally_bound: constitutional_binding.binding_id.length > 0 && constitutional_binding.constitutional_inheritance,
    governance_inheritance_deterministic: constitutional_binding.deterministic,
    authority_inheritance_validated: authority_binding.authority_validation,
    approval_routing_operational: approval_routing.deterministic && approval_routing.reproducible && approval_routing.approval_lineage_refs.length > 0,
    caf_authority_gate_bound: approval_routing.caf_authority_gate_ref.length > 0,
    caf_policy_gate_bound: policy_compliance.caf_policy_gate_ref.length > 0,
    caf_safety_gate_bound: safety_compliance.caf_safety_gate_ref.length > 0,
    governance_lineage_reproducible: governance_evidence.reproducible && governance_evidence.governance_lineage_refs.length > 0,
    compliance_evidence_complete: governance_evidence.complete && compliance_report.generated,
    no_governance_bypass: constitutional_binding.governance_sequence.length === GOVERNANCE_SEQUENCE.length,
    no_authority_elevation: authority_binding.authority_expansion_impossible,
    no_out_of_scope_ownership: noOutOfScope,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationGovernanceBindingResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    evidence_governance_ref: "application-evidence-source-governance/v4.7",
    cci_governance_services_ref: "Program 2 - CCI Governance Services",
    caf_authority_gate_ref: "Program 3 - CAF Authority Gate",
    caf_policy_gate_ref: "Program 3 - CAF Policy Gate",
    caf_safety_gate_ref: "Program 3 - CAF Safety Gate",
    constitutional_binding,
    authority_binding,
    governance_binding,
    approval_routing,
    policy_compliance,
    safety_compliance,
    governance_evidence,
    compliance_report,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationGovernanceBinding(result?: ApplicationGovernanceBindingResult): ApplicationGovernanceValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, binding_valid: false, authority_valid: false, governance_valid: false, approval_valid: false, policy_valid: false, safety_valid: false, evidence_valid: false, compliance_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const binding_valid = verifyHashedRecord(result.constitutional_binding) && result.constitutional_binding.binding_id.length > 0 && result.constitutional_binding.deterministic && !result.constitutional_binding.independent_governance_defined && result.constitutional_binding.governance_sequence.length === GOVERNANCE_SEQUENCE.length;
  const authority_valid = verifyHashedRecord(result.authority_binding) && result.authority_binding.authority_validation && result.authority_binding.authority_expansion_impossible;
  const governance_valid = verifyHashedRecord(result.governance_binding) && result.governance_binding.governance_attached && result.governance_binding.governance_validated && !result.governance_binding.duplicates_governance_engine;
  const approval_valid = verifyHashedRecord(result.approval_routing) && result.approval_routing.caf_authority_gate_ref.length > 0 && result.approval_routing.deterministic && result.approval_routing.approval_lineage_refs.length > 0;
  const policy_valid = verifyHashedRecord(result.policy_compliance) && result.policy_compliance.caf_policy_gate_ref.length > 0 && result.policy_compliance.policies_inherited && !result.policy_compliance.duplicates_policy_engine;
  const safety_valid = verifyHashedRecord(result.safety_compliance) && result.safety_compliance.caf_safety_gate_ref.length > 0 && result.safety_compliance.safety_enforcement_inherited && result.safety_compliance.safety_lineage_complete && !result.safety_compliance.duplicates_safety_engine;
  const evidence_valid = verifyHashedRecord(result.governance_evidence) && result.governance_evidence.complete && result.governance_evidence.governance_lineage_refs.length > 0;
  const compliance_valid = verifyHashedRecord(result.compliance_report) && result.compliance_report.generated && result.compliance_report.compliance_record_id.length > 0;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && binding_valid && authority_valid && governance_valid && approval_valid && policy_valid && safety_valid && evidence_valid && compliance_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, binding_valid, authority_valid, governance_valid, approval_valid, policy_valid, safety_valid, evidence_valid, compliance_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationGovernanceBinding(result = runApplicationGovernanceBinding()): boolean {
  const replayed = runApplicationGovernanceBinding();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationGovernanceBinding(result).valid;
}

export function getApplicationGovernanceBindingBundle(): ApplicationGovernanceBundle {
  const result = runApplicationGovernanceBinding();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_governance: true,
      owns_constitutional_binding: true,
      owns_authority_inheritance: true,
      owns_approval_routing: true,
      implements_governance_engines: false,
      implements_policy_engines: false,
      implements_safety_engines: false,
      performs_authority_evaluation: false,
      performs_policy_evaluation: false,
      performs_safety_evaluation: false,
      owns_runtime_governance: false,
      owns_certification: false,
      owns_evidence_storage: false,
    }),
    result,
    validation: validateApplicationGovernanceBinding(result),
  });
}

export const ApplicationGovernanceBindingService = Object.freeze({
  run: runApplicationGovernanceBinding,
  validate: validateApplicationGovernanceBinding,
  replay: replayApplicationGovernanceBinding,
});
