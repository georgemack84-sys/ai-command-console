import { runApplicationIdentityTenancyNamespace, validateApplicationIdentityTenancyNamespace } from "@/services/application-identity-tenancy-namespace";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ApplicationLifecycleCertificationBundle,
  ApplicationLifecycleCertificationFailure,
  ApplicationLifecycleCertificationInput,
  ApplicationLifecycleCertificationOutcome,
  ApplicationLifecycleCertificationResult,
  ApplicationLifecycleCertificationScenario,
  ApplicationLifecycleCertificationValidation,
  ApplicationLifecycleState,
} from "@/types/application-lifecycle-certification";

const VERSION = "application-lifecycle-certification/v4.5" as const;
const IDENTIFIER = "ApplicationLifecycleCertification" as const;
const LIFECYCLE: readonly ApplicationLifecycleState[] = Object.freeze(["REGISTERED", "DEVELOPMENT", "VALIDATION", "CERTIFICATION", "ACTIVE", "SUSPENDED", "RETIRED", "ARCHIVED"]);
let baselineIdentity: ReturnType<typeof runApplicationIdentityTenancyNamespace> | undefined;

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
function has(failures: readonly ApplicationLifecycleCertificationFailure[], failure: ApplicationLifecycleCertificationFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: ApplicationLifecycleCertificationScenario): ApplicationLifecycleCertificationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function outcome(failures: readonly ApplicationLifecycleCertificationFailure[]): ApplicationLifecycleCertificationOutcome {
  if (has(failures, "CERTIFICATION_PRUNED")) return "PRUNED";
  return failures.length ? "FAIL" : "PASS";
}
function verifyHashedRecord(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function getBaselineIdentity() { baselineIdentity ??= runApplicationIdentityTenancyNamespace(); return baselineIdentity; }

function resultReplayHash(result: Omit<ApplicationLifecycleCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    lifecycle_model: result.lifecycle_model,
    lifecycle: result.lifecycle_record.integrity_hash,
    lineage: result.version_lineage.integrity_hash,
    framework: result.certification_framework.integrity_hash,
    execution: result.certification_execution.integrity_hash,
    evidence: result.certification_evidence.integrity_hash,
    certificate: result.certificate.integrity_hash,
    governance: result.certification_governance.integrity_hash,
    tenant: result.tenant_qualification.integrity_hash,
    status: result.status_registry.integrity_hash,
    ledgers: result.ledgers.integrity_hash,
    certification: result.certification.integrity_hash,
  });
}
function resultIntegrityHash(result: Omit<ApplicationLifecycleCertificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.certification.outcome, replay_hash: result.replay_hash });
}

export function runApplicationLifecycleCertification(input: ApplicationLifecycleCertificationInput = {}): ApplicationLifecycleCertificationResult {
  const direct = scenarioFailure(input.scenario ?? "BASELINE");
  const scenarioFailures = freezeArray<ApplicationLifecycleCertificationFailure>(direct ? [direct] : []);
  const identity = getBaselineIdentity();
  const dependencyFailures = freezeArray<ApplicationLifecycleCertificationFailure>([
    ...(!validateApplicationIdentityTenancyNamespace(identity).valid || has(scenarioFailures, "P4_4_IDENTITY_INVALID") ? ["P4_4_IDENTITY_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_LIFECYCLE_SERVICES_INVALID") ? ["CCI_LIFECYCLE_SERVICES_INVALID" as const] : []),
    ...(has(scenarioFailures, "CCI_CERTIFICATION_INFRASTRUCTURE_INVALID") ? ["CCI_CERTIFICATION_INFRASTRUCTURE_INVALID" as const] : []),
    ...(has(scenarioFailures, "TQF_TENANT_CONTRACT_INVALID") ? ["TQF_TENANT_CONTRACT_INVALID" as const] : []),
  ]);
  const failures = freezeArray([...new Set([...scenarioFailures, ...dependencyFailures])]);
  const lifecycle_model = has(failures, "LIFECYCLE_MODEL_INCOMPLETE") ? freezeArray(LIFECYCLE.slice(0, 4)) : LIFECYCLE;
  const lifecycle_record = nested({
    application_id: identity.identity_record.application_id,
    application_version: identity.identity_record.identity_version,
    tenant_scope: identity.tenant_integration.tenant_id,
    namespace_id: identity.namespace_record.namespace_id,
    lifecycle_state: "ACTIVE" as const,
    activation_timestamp: "2026-07-17T05:00:00.000Z",
    suspension_timestamp: "",
    retirement_timestamp: "",
    restoration_timestamp: "",
    archive_timestamp: "",
    current_version: "1.0.0",
    previous_version: "0.9.0",
    lineage_refs: has(failures, "VERSION_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([identity.evidence.evidence_id, "lineage:p4.5:lifecycle"]),
    owner_refs: freezeArray([identity.ownership_record.ownership_id]),
    deterministic_transitions: !has(failures, "LIFECYCLE_TRANSITION_NON_DETERMINISTIC"),
    single_governed_lifecycle: !has(failures, "MULTIPLE_LIFECYCLES_DETECTED"),
  });
  const version_lineage = nested({
    lineage_id: "P4.5-VERSION-LINEAGE-001",
    application_id: lifecycle_record.application_id,
    current_version: lifecycle_record.current_version,
    previous_versions: freezeArray([lifecycle_record.previous_version]),
    release_lineage_refs: freezeArray(["release:p4.5:1.0.0"]),
    dependency_lineage_refs: freezeArray(["dependency:p4.4:identity", "dependency:tqf:tenant-contract"]),
    supersession_refs: freezeArray(["supersedes:0.9.0"]),
    rollback_lineage_refs: freezeArray(["rollback:p4.5:1.0.0-to-0.9.0"]),
    immutable: !has(failures, "VERSION_LINEAGE_MUTABLE"),
    complete: !has(failures, "VERSION_LINEAGE_INCOMPLETE"),
  });
  const certification_framework = nested({
    framework_id: "P4.5-CERTIFICATION-FRAMEWORK-001",
    certification_contract_refs: has(failures, "CERTIFICATION_FRAMEWORK_MISSING") ? freezeArray([]) : freezeArray(["contract:p4.5:certification"]),
    qualification_model_ref: "qualification:p4.5:constitutional",
    prerequisite_refs: has(failures, "CERTIFICATION_PREREQUISITES_MISSING") ? freezeArray([]) : freezeArray(["p4.4:identity", "tqf:tenant-contract", "cci:lifecycle", "cci:certification"]),
    workflow_states: freezeArray(["NOT_CERTIFIED", "CERTIFICATION_IN_PROGRESS", "CERTIFIED", "CERTIFICATION_SUSPENDED", "CERTIFICATION_REVOKED", "CERTIFICATION_EXPIRED"] as const),
    implemented: !has(failures, "CERTIFICATION_FRAMEWORK_MISSING"),
    prerequisites_complete: !has(failures, "CERTIFICATION_PREREQUISITES_MISSING"),
  });
  const certification_execution = nested({
    execution_id: "P4.5-CERTIFICATION-EXECUTION-001",
    orchestration_ref: "orchestration:p4.5:qualification",
    evidence_collection_complete: !has(failures, "CERTIFICATION_EVIDENCE_MISSING"),
    dependency_verification_passed: !has(failures, "DEPENDENCY_VERIFICATION_FAILED"),
    policy_validation_passed: !has(failures, "POLICY_VALIDATION_FAILED"),
    governance_validation_passed: !has(failures, "GOVERNANCE_VALIDATION_FAILED"),
    tenant_contract_verification_passed: !has(failures, "TENANT_CONTRACT_COMPATIBILITY_FAILED") && !has(failures, "TQF_TENANT_CONTRACT_INVALID"),
    constitutional_compliance_validated: !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VALIDATED"),
    result: has(failures, "CERTIFICATION_EXECUTION_FAILED") ? "FAIL" as const : "PASS" as const,
  });
  const certification_evidence = nested({
    evidence_id: "P4.5-CERTIFICATION-EVIDENCE-001",
    application_id: lifecycle_record.application_id,
    application_version: lifecycle_record.application_version,
    evidence_type: "APPLICATION_CERTIFICATION" as const,
    verification_results: has(failures, "CERTIFICATION_EVIDENCE_MISSING") ? freezeArray([]) : freezeArray(["constitutional-compliance", "dependency-verification", "policy-validation", "governance-validation", "tenant-compatibility"]),
    dependency_refs: freezeArray(["application-identity-tenancy-namespace/v4.4"]),
    policy_refs: freezeArray(["policy:p4.5:certification"]),
    governance_refs: freezeArray(["governance:p4.5:certification"]),
    tenant_contract_refs: freezeArray([identity.tenant_integration.tenant_contract_reference]),
    lineage_refs: version_lineage.complete ? freezeArray([version_lineage.lineage_id]) : freezeArray([]),
    timestamp: "2026-07-17T05:10:00.000Z",
    immutable: !has(failures, "CERTIFICATION_EVIDENCE_MUTABLE"),
    complete: !has(failures, "CERTIFICATION_EVIDENCE_MISSING"),
  });
  const certification_governance = nested({
    governance_id: "P4.5-CERTIFICATION-GOVERNANCE-001",
    approval_supported: true,
    suspension_supported: !has(failures, "CERTIFICATION_SUSPENSION_UNSUPPORTED"),
    renewal_supported: !has(failures, "CERTIFICATION_RENEWAL_UNSUPPORTED"),
    revocation_supported: !has(failures, "CERTIFICATION_REVOCATION_UNSUPPORTED"),
    expiration_supported: !has(failures, "CERTIFICATION_EXPIRATION_UNSUPPORTED"),
    revocation_invalidates_production: !has(failures, "REVOCATION_DOES_NOT_INVALIDATE_PRODUCTION"),
    expired_requires_requalification: !has(failures, "EXPIRED_CERTIFICATION_REQUALIFICATION_MISSING"),
    decision_auditable: !has(failures, "CERTIFICATION_DECISION_NOT_AUDITABLE"),
  });
  const tenant_qualification = nested({
    report_id: "P4.5-TENANT-COMPATIBILITY-001",
    tenant_contract_validated: certification_execution.tenant_contract_verification_passed,
    namespace_verified: identity.namespace_record.allocation_status === "ALLOCATED",
    ownership_verified: identity.ownership_record.registered,
    dependency_verified: certification_execution.dependency_verification_passed,
    application_eligible: true,
    result: certification_execution.tenant_contract_verification_passed ? "PASS" as const : "FAIL" as const,
  });
  const certificateGenerated = !has(failures, "CERTIFICATE_NOT_GENERATED");
  const certificate = nested({
    certificate_id: certificateGenerated ? "P4.5-APPLICATION-CERTIFICATE-001" : "",
    application_id: lifecycle_record.application_id,
    application_version: lifecycle_record.application_version,
    qualification_scope: "constitutional-application-certification",
    qualification_timestamp: "2026-07-17T05:20:00.000Z",
    qualified_by: "authority:p4.5:certification",
    tenant_scope: lifecycle_record.tenant_scope,
    certificate_status: certificateGenerated ? "CERTIFIED" as const : "NOT_CERTIFIED" as const,
    expiration_date: "2027-07-17",
    evidence_refs: certificateGenerated ? freezeArray([certification_evidence.evidence_id]) : freezeArray([]),
    production_eligible: certificateGenerated,
  });
  const status_registry = nested({
    registry_id: "P4.5-CERTIFICATION-STATUS-REGISTRY-001",
    application_id: lifecycle_record.application_id,
    current_status: certificate.certificate_status,
    effective_date: "2026-07-17",
    expiration_date: certificate.expiration_date,
    certificate_refs: certificateGenerated ? freezeArray([certificate.certificate_id]) : freezeArray([]),
    reason: "initial constitutional certification",
    last_review: "2026-07-17",
    transition_rules: freezeArray(["NOT_CERTIFIED->CERTIFICATION_IN_PROGRESS", "CERTIFICATION_IN_PROGRESS->CERTIFIED", "CERTIFIED->CERTIFICATION_SUSPENDED", "CERTIFIED->CERTIFICATION_EXPIRED", "CERTIFIED->CERTIFICATION_REVOKED", "CERTIFICATION_SUSPENDED->CERTIFIED", "CERTIFICATION_SUSPENDED->CERTIFICATION_REVOKED", "CERTIFICATION_EXPIRED->CERTIFICATION_IN_PROGRESS", "CERTIFICATION_REVOKED->CERTIFICATION_IN_PROGRESS"]),
    lifecycle_synchronized: lifecycle_record.lifecycle_state === "ACTIVE",
    operational: !has(failures, "CERTIFICATION_STATUS_REGISTRY_INVALID"),
  });
  const ledgers = nested({
    certification_ledger_id: "P4.5-CERTIFICATION-LEDGER-001",
    lifecycle_transition_ledger_id: "P4.5-LIFECYCLE-TRANSITION-LEDGER-001",
    certification_action_refs: has(failures, "CERTIFICATION_ACTION_LEDGER_INCOMPLETE") ? freezeArray([]) : freezeArray(["certification:started", "certification:approved", "certificate:issued"]),
    lifecycle_transition_refs: has(failures, "LIFECYCLE_TRANSITION_LEDGER_INCOMPLETE") ? freezeArray([]) : freezeArray(["REGISTERED->DEVELOPMENT", "DEVELOPMENT->VALIDATION", "VALIDATION->CERTIFICATION", "CERTIFICATION->ACTIVE"]),
    audit_refs: freezeArray(["audit:p4.5:lifecycle", "audit:p4.5:certification"]),
    immutable: true,
    complete: !has(failures, "CERTIFICATION_ACTION_LEDGER_INCOMPLETE") && !has(failures, "LIFECYCLE_TRANSITION_LEDGER_INCOMPLETE"),
  });
  const derivedFailures = freezeArray([...new Set([
    ...failures,
    ...(lifecycle_model.length !== LIFECYCLE.length ? ["LIFECYCLE_MODEL_INCOMPLETE" as const] : []),
    ...(!lifecycle_record.single_governed_lifecycle ? ["MULTIPLE_LIFECYCLES_DETECTED" as const] : []),
    ...(has(failures, "LIFECYCLE_TRANSITION_INVALID") ? ["LIFECYCLE_TRANSITION_INVALID" as const] : []),
    ...(!lifecycle_record.deterministic_transitions ? ["LIFECYCLE_TRANSITION_NON_DETERMINISTIC" as const] : []),
    ...(!version_lineage.complete ? ["VERSION_LINEAGE_INCOMPLETE" as const] : []),
    ...(!version_lineage.immutable ? ["VERSION_LINEAGE_MUTABLE" as const] : []),
    ...(!certification_framework.implemented ? ["CERTIFICATION_FRAMEWORK_MISSING" as const] : []),
    ...(certification_execution.result !== "PASS" ? ["CERTIFICATION_EXECUTION_FAILED" as const] : []),
    ...(!certification_framework.prerequisites_complete ? ["CERTIFICATION_PREREQUISITES_MISSING" as const] : []),
    ...(!certification_execution.constitutional_compliance_validated ? ["CONSTITUTIONAL_COMPLIANCE_NOT_VALIDATED" as const] : []),
    ...(!certification_execution.dependency_verification_passed ? ["DEPENDENCY_VERIFICATION_FAILED" as const] : []),
    ...(!certification_execution.policy_validation_passed ? ["POLICY_VALIDATION_FAILED" as const] : []),
    ...(!certification_execution.governance_validation_passed ? ["GOVERNANCE_VALIDATION_FAILED" as const] : []),
    ...(!certification_execution.tenant_contract_verification_passed ? ["TENANT_CONTRACT_COMPATIBILITY_FAILED" as const] : []),
    ...(!certification_evidence.complete ? ["CERTIFICATION_EVIDENCE_MISSING" as const] : []),
    ...(!certification_evidence.immutable ? ["CERTIFICATION_EVIDENCE_MUTABLE" as const] : []),
    ...(!certification_governance.decision_auditable ? ["CERTIFICATION_DECISION_NOT_AUDITABLE" as const] : []),
    ...(!certificateGenerated ? ["CERTIFICATE_NOT_GENERATED" as const] : []),
    ...(!status_registry.operational ? ["CERTIFICATION_STATUS_REGISTRY_INVALID" as const] : []),
    ...(!certification_governance.renewal_supported ? ["CERTIFICATION_RENEWAL_UNSUPPORTED" as const] : []),
    ...(!certification_governance.suspension_supported ? ["CERTIFICATION_SUSPENSION_UNSUPPORTED" as const] : []),
    ...(!certification_governance.revocation_supported ? ["CERTIFICATION_REVOCATION_UNSUPPORTED" as const] : []),
    ...(!certification_governance.expiration_supported ? ["CERTIFICATION_EXPIRATION_UNSUPPORTED" as const] : []),
    ...(!certification_governance.revocation_invalidates_production ? ["REVOCATION_DOES_NOT_INVALIDATE_PRODUCTION" as const] : []),
    ...(!certification_governance.expired_requires_requalification ? ["EXPIRED_CERTIFICATION_REQUALIFICATION_MISSING" as const] : []),
    ...(ledgers.certification_action_refs.length === 0 ? ["CERTIFICATION_ACTION_LEDGER_INCOMPLETE" as const] : []),
    ...(ledgers.lifecycle_transition_refs.length === 0 ? ["LIFECYCLE_TRANSITION_LEDGER_INCOMPLETE" as const] : []),
  ])]);
  const certification = nested({
    certification_id: "P4.5-LIFECYCLE-CERTIFICATION-GATE-001",
    outcome: outcome(derivedFailures),
    phase_ready: outcome(derivedFailures) === "PASS",
    lifecycle_governed: lifecycle_model.length === LIFECYCLE.length && lifecycle_record.single_governed_lifecycle,
    transitions_deterministic: lifecycle_record.deterministic_transitions,
    version_lineage_operational: version_lineage.complete && version_lineage.immutable,
    certification_framework_implemented: certification_framework.implemented && certification_framework.prerequisites_complete,
    certification_execution_operational: certification_execution.result === "PASS",
    certification_governance_enforced: certification_governance.approval_supported && certification_governance.decision_auditable,
    evidence_immutable: certification_evidence.complete && certification_evidence.immutable,
    status_registry_operational: status_registry.operational,
    tenant_contract_validation_integrated: tenant_qualification.result === "PASS",
    certificate_generated: certificateGenerated,
    renewal_suspension_revocation_expiration_supported: certification_governance.renewal_supported && certification_governance.suspension_supported && certification_governance.revocation_supported && certification_governance.expiration_supported,
    traceable_immutable_ledgers: ledgers.complete && ledgers.immutable,
    failures: derivedFailures,
  });
  const base: Omit<ApplicationLifecycleCertificationResult, "replay_hash" | "integrity_hash"> = {
    phase_version: VERSION,
    phase_identifier: IDENTIFIER,
    application_identity_ref: "application-identity-tenancy-namespace/v4.4",
    cci_lifecycle_services_ref: "Program 2 - CCI Lifecycle Services",
    cci_certification_infrastructure_ref: "Program 2 - CCI Certification Infrastructure",
    tqf_tenant_contracts_ref: "Program 1 - Tenant Qualification Framework",
    lifecycle_model,
    lifecycle_record,
    version_lineage,
    certification_framework,
    certification_execution,
    certification_evidence,
    certificate,
    certification_governance,
    tenant_qualification,
    status_registry,
    ledgers,
    certification,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateApplicationLifecycleCertification(result?: ApplicationLifecycleCertificationResult): ApplicationLifecycleCertificationValidation {
  if (!result) return nested({ valid: false, outcome: "FAIL" as const, replay_hash_valid: false, integrity_hash_valid: false, lifecycle_valid: false, lineage_valid: false, framework_valid: false, execution_valid: false, evidence_valid: false, certificate_valid: false, governance_valid: false, tenant_valid: false, status_valid: false, ledgers_valid: false, certification_valid: false, failures: freezeArray(["CERTIFICATION_PRUNED" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const lifecycle_valid = verifyHashedRecord(result.lifecycle_record) && result.lifecycle_model.length === LIFECYCLE.length && result.lifecycle_record.single_governed_lifecycle && result.lifecycle_record.deterministic_transitions;
  const lineage_valid = verifyHashedRecord(result.version_lineage) && result.version_lineage.complete && result.version_lineage.immutable;
  const framework_valid = verifyHashedRecord(result.certification_framework) && result.certification_framework.implemented && result.certification_framework.prerequisites_complete;
  const execution_valid = verifyHashedRecord(result.certification_execution) && result.certification_execution.result === "PASS" && result.certification_execution.constitutional_compliance_validated;
  const evidence_valid = verifyHashedRecord(result.certification_evidence) && result.certification_evidence.complete && result.certification_evidence.immutable;
  const certificate_valid = verifyHashedRecord(result.certificate) && result.certificate.certificate_id.length > 0 && result.certificate.certificate_status === "CERTIFIED" && result.certificate.production_eligible;
  const governance_valid = verifyHashedRecord(result.certification_governance) && result.certification_governance.renewal_supported && result.certification_governance.suspension_supported && result.certification_governance.revocation_supported && result.certification_governance.expiration_supported && result.certification_governance.decision_auditable;
  const tenant_valid = verifyHashedRecord(result.tenant_qualification) && result.tenant_qualification.result === "PASS";
  const status_valid = verifyHashedRecord(result.status_registry) && result.status_registry.operational && result.status_registry.current_status === "CERTIFIED";
  const ledgers_valid = verifyHashedRecord(result.ledgers) && result.ledgers.complete && result.ledgers.immutable;
  const certification_valid = verifyHashedRecord(result.certification) && result.certification.outcome === "PASS" && result.certification.phase_ready && result.certification.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && lifecycle_valid && lineage_valid && framework_valid && execution_valid && evidence_valid && certificate_valid && governance_valid && tenant_valid && status_valid && ledgers_valid && certification_valid;
  return nested({ valid, outcome: result.certification.outcome, replay_hash_valid, integrity_hash_valid, lifecycle_valid, lineage_valid, framework_valid, execution_valid, evidence_valid, certificate_valid, governance_valid, tenant_valid, status_valid, ledgers_valid, certification_valid, failures: result.certification.failures });
}

export function replayApplicationLifecycleCertification(result = runApplicationLifecycleCertification()): boolean {
  const replayed = runApplicationLifecycleCertification();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateApplicationLifecycleCertification(result).valid;
}

export function getApplicationLifecycleCertificationBundle(): ApplicationLifecycleCertificationBundle {
  const result = runApplicationLifecycleCertification();
  return Object.freeze({
    doctrine: Object.freeze({
      version: VERSION,
      owns_application_lifecycle: true,
      owns_application_version_lineage: true,
      owns_lifecycle_governance: true,
      owns_certification_execution: true,
      owns_certification_governance: true,
      owns_certification_evidence: true,
      owns_certification_status_management: true,
      supports_renewal_suspension_revocation_expiration: true,
      production_requires_certification: true,
    }),
    result,
    validation: validateApplicationLifecycleCertification(result),
  });
}

export const ApplicationLifecycleCertificationService = Object.freeze({
  run: runApplicationLifecycleCertification,
  validate: validateApplicationLifecycleCertification,
  replay: replayApplicationLifecycleCertification,
});
