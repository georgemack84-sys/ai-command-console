import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyDecisionPackage, replayDecisionPackageCertification } from "@/services/decision-package-certification-gate";
import type { DecisionPackageCertificationGateResult } from "@/types/decision-package-certification-gate";
import type {
  OperatorDecisionWorkflow,
  OperatorWorkflowAuthorityLevel,
  OperatorWorkflowContractFailureReason,
  OperatorWorkflowContractFoundation,
  OperatorWorkflowContractInput,
  OperatorWorkflowContractLedgerEntry,
  OperatorWorkflowContractObservability,
  OperatorWorkflowContractReplay,
  OperatorWorkflowContractResult,
  OperatorWorkflowContractValidation,
  OperatorWorkflowLifecycleState,
  OperatorWorkflowOwnershipDomain,
  WorkflowAuditRecord,
  WorkflowAuthorityContract,
  WorkflowIdentityRecord,
  WorkflowLifecycleContract,
  WorkflowOwnershipRecord,
  WorkflowReplayRegistration,
} from "@/types/operator-workflow-contract";

const CONTRACT_VERSION = "operator-workflow-contract/v1" as const;
const AUTHORIZED_COMPONENT = "operator-workflow-contract";
const NOW = "2026-07-04T01:26:00.000Z";
const DEFAULT_OPERATOR_ID = "operator_primary";

export const OPERATOR_WORKFLOW_LIFECYCLE_STATES: readonly OperatorWorkflowLifecycleState[] = Object.freeze(["PENDING_REVIEW", "IN_REVIEW", "DEFERRED", "ESCALATED", "APPROVED", "REJECTED", "ARCHIVED"]);
export const OPERATOR_WORKFLOW_AUTHORITY_LEVELS: readonly OperatorWorkflowAuthorityLevel[] = Object.freeze(["Observer", "Reviewer", "Operator", "Supervisor", "Governance", "Executive Authority", "System Certification"]);
export const OPERATOR_WORKFLOW_OWNERSHIP_DOMAINS: readonly OperatorWorkflowOwnershipDomain[] = Object.freeze(["Operator", "Governance", "Mission", "Tenant", "Orchestration", "Decision Package"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  delete copy.ledger_integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function workflowHash(record: Omit<OperatorDecisionWorkflow, "integrity_hash"> | OperatorDecisionWorkflow): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorDecisionWorkflowHash(record: Omit<OperatorDecisionWorkflow, "integrity_hash"> | OperatorDecisionWorkflow): string {
  return workflowHash(record);
}

function identityHash(record: Omit<WorkflowIdentityRecord, "integrity_hash"> | WorkflowIdentityRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowIdentityRecordHash(record: Omit<WorkflowIdentityRecord, "integrity_hash"> | WorkflowIdentityRecord): string {
  return identityHash(record);
}

function lifecycleHash(record: Omit<WorkflowLifecycleContract, "integrity_hash"> | WorkflowLifecycleContract): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowLifecycleContractHash(record: Omit<WorkflowLifecycleContract, "integrity_hash"> | WorkflowLifecycleContract): string {
  return lifecycleHash(record);
}

function ownershipHash(record: Omit<WorkflowOwnershipRecord, "integrity_hash"> | WorkflowOwnershipRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowOwnershipRecordHash(record: Omit<WorkflowOwnershipRecord, "integrity_hash"> | WorkflowOwnershipRecord): string {
  return ownershipHash(record);
}

function authorityHash(record: Omit<WorkflowAuthorityContract, "integrity_hash"> | WorkflowAuthorityContract): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowAuthorityContractHash(record: Omit<WorkflowAuthorityContract, "integrity_hash"> | WorkflowAuthorityContract): string {
  return authorityHash(record);
}

function replayRegistrationHash(record: Omit<WorkflowReplayRegistration, "integrity_hash"> | WorkflowReplayRegistration): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowReplayRegistrationHash(record: Omit<WorkflowReplayRegistration, "integrity_hash"> | WorkflowReplayRegistration): string {
  return replayRegistrationHash(record);
}

function auditHash(record: Omit<WorkflowAuditRecord, "integrity_hash"> | WorkflowAuditRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeWorkflowAuditRecordHash(record: Omit<WorkflowAuditRecord, "integrity_hash"> | WorkflowAuditRecord): string {
  return auditHash(record);
}

function validationHash(record: Omit<OperatorWorkflowContractValidation, "integrity_hash"> | OperatorWorkflowContractValidation): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<OperatorWorkflowContractLedgerEntry, "ledger_integrity_hash"> | OperatorWorkflowContractLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function certifiedPackage(certification: DecisionPackageCertificationGateResult) {
  return certification.observability_result.ledger_result.reference_result.workflow_result.compliance_result.forecast_result.evidence_result.package_build_result.package;
}

function workflowId(certification: DecisionPackageCertificationGateResult): string {
  const pkg = certifiedPackage(certification);
  return `operator_workflow_${hash({ package_id: pkg.package_id, orchestration_id: pkg.orchestration_id, tenant_id: pkg.tenant_id }).slice(0, 16)}`;
}

export function createOperatorDecisionWorkflow(certification: DecisionPackageCertificationGateResult = certifyDecisionPackage()): OperatorDecisionWorkflow {
  const pkg = certifiedPackage(certification);
  const base: Omit<OperatorDecisionWorkflow, "integrity_hash"> = {
    workflow_id: workflowId(certification),
    orchestration_id: pkg.orchestration_id,
    package_id: pkg.package_id,
    tenant_id: pkg.tenant_id,
    mission_id: pkg.mission_id,
    operator_id: DEFAULT_OPERATOR_ID,
    workflow_state: "PENDING_REVIEW",
    authority_level: "Operator",
    created_at: NOW,
    replay_ref: certification.certification_record.replay_ref,
    lineage_ref: certification.certification_record.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: workflowHash(base) });
}

export function createWorkflowIdentityRecord(workflow: OperatorDecisionWorkflow = createOperatorDecisionWorkflow()): WorkflowIdentityRecord {
  const base: Omit<WorkflowIdentityRecord, "integrity_hash"> = {
    identity_id: `workflow_identity_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    package_id: workflow.package_id,
    orchestration_id: workflow.orchestration_id,
    tenant_id: workflow.tenant_id,
    lineage_ref: workflow.lineage_ref,
    unique: true,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: identityHash(base) });
}

export function defineWorkflowLifecycle(workflow: OperatorDecisionWorkflow = createOperatorDecisionWorkflow()): WorkflowLifecycleContract {
  const transitions: Readonly<Record<OperatorWorkflowLifecycleState, readonly OperatorWorkflowLifecycleState[]>> = Object.freeze({
    PENDING_REVIEW: Object.freeze(["IN_REVIEW", "DEFERRED", "ESCALATED"] as OperatorWorkflowLifecycleState[]),
    IN_REVIEW: Object.freeze(["APPROVED", "REJECTED", "DEFERRED", "ESCALATED"] as OperatorWorkflowLifecycleState[]),
    DEFERRED: Object.freeze(["IN_REVIEW", "ARCHIVED"] as OperatorWorkflowLifecycleState[]),
    ESCALATED: Object.freeze(["IN_REVIEW", "REJECTED", "ARCHIVED"] as OperatorWorkflowLifecycleState[]),
    APPROVED: Object.freeze(["ARCHIVED"] as OperatorWorkflowLifecycleState[]),
    REJECTED: Object.freeze(["ARCHIVED"] as OperatorWorkflowLifecycleState[]),
    ARCHIVED: Object.freeze([] as OperatorWorkflowLifecycleState[]),
  });
  const base: Omit<WorkflowLifecycleContract, "integrity_hash"> = {
    lifecycle_id: `workflow_lifecycle_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    initial_state: "PENDING_REVIEW",
    terminal_states: Object.freeze(["APPROVED", "REJECTED", "ARCHIVED"]),
    legal_states: OPERATOR_WORKFLOW_LIFECYCLE_STATES,
    legal_transitions: transitions,
    completion_conditions: Object.freeze(["operator disposition recorded", "audit event appended", "replay state reproducible"]),
  };
  return Object.freeze({ ...base, integrity_hash: lifecycleHash(base) });
}

export function assignWorkflowOwnership(workflow: OperatorDecisionWorkflow = createOperatorDecisionWorkflow()): WorkflowOwnershipRecord {
  const base: Omit<WorkflowOwnershipRecord, "integrity_hash"> = {
    ownership_id: `workflow_ownership_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    operator_id: workflow.operator_id,
    ownership_domains: OPERATOR_WORKFLOW_OWNERSHIP_DOMAINS,
    tenant_id: workflow.tenant_id,
    mission_id: workflow.mission_id,
    immutable_owner: true,
  };
  return Object.freeze({ ...base, integrity_hash: ownershipHash(base) });
}

export function defineWorkflowAuthority(certification: DecisionPackageCertificationGateResult = certifyDecisionPackage(), workflow: OperatorDecisionWorkflow = createOperatorDecisionWorkflow(certification)): WorkflowAuthorityContract {
  const restrictions = certification.observability_result.ledger_result.reference_result.workflow_result.compliance_result.summary.restrictions;
  const base: Omit<WorkflowAuthorityContract, "integrity_hash"> = {
    authority_id: `workflow_authority_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    authority_level: workflow.authority_level,
    permitted_authorities: OPERATOR_WORKFLOW_AUTHORITY_LEVELS,
    authority_restrictions: restrictions,
    governance_compliant: certification.compliance_report.governance_compliance === "PASS",
    constitutional_compliant: certification.compliance_report.constitutional_compliance === "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: authorityHash(base) });
}

export function registerWorkflowReplay(certification: DecisionPackageCertificationGateResult = certifyDecisionPackage(), workflow: OperatorDecisionWorkflow = createOperatorDecisionWorkflow(certification)): WorkflowReplayRegistration {
  const replay = replayDecisionPackageCertification(certification);
  const base: Omit<WorkflowReplayRegistration, "integrity_hash"> = {
    replay_registration_id: `workflow_replay_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    replay_ref: workflow.replay_ref,
    replay_complete: workflow.replay_ref.length > 0,
    replay_deterministic: certification.deterministic,
    replay_reproducible: replay.replay_valid,
  };
  return Object.freeze({ ...base, integrity_hash: replayRegistrationHash(base) });
}

export function createWorkflowAuditRecord(workflow: OperatorDecisionWorkflow = createOperatorDecisionWorkflow()): WorkflowAuditRecord {
  const base: Omit<WorkflowAuditRecord, "integrity_hash"> = {
    audit_id: `workflow_audit_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    recorded_events: Object.freeze(["Workflow creation", "Ownership assignment", "Authority assignment", "Lifecycle registration", "Replay registration", "Audit registration", "Integrity validation"]),
    audit_timestamp: NOW,
    append_only: true,
    deleted: false,
  };
  return Object.freeze({ ...base, integrity_hash: auditHash(base) });
}

function failures(input: {
  certification: DecisionPackageCertificationGateResult;
  workflow: OperatorDecisionWorkflow;
  identity: WorkflowIdentityRecord;
  lifecycle: WorkflowLifecycleContract;
  ownership: WorkflowOwnershipRecord;
  authority: WorkflowAuthorityContract;
  replay: WorkflowReplayRegistration;
  audit: WorkflowAuditRecord;
  authorized: boolean;
}): readonly OperatorWorkflowContractFailureReason[] {
  const result: OperatorWorkflowContractFailureReason[] = [];
  if (!input.authorized) result.push("UNAUTHORIZED_WORKFLOW_CONTRACT_ACCESS");
  if (input.certification.gate_status !== "PASS") result.push("CERTIFICATION_GATE_NOT_PASS");
  if (!input.workflow.workflow_id || !input.identity.workflow_id) result.push("WORKFLOW_IDENTITY_MISSING");
  if (!input.identity.unique) result.push("DUPLICATE_WORKFLOW_DETECTED");
  if (!input.ownership.operator_id || !input.ownership.immutable_owner) result.push("OWNERSHIP_INVALID");
  if (!input.authority.authority_level || !input.authority.permitted_authorities.includes(input.authority.authority_level)) result.push("AUTHORITY_UNDEFINED");
  if (!input.lifecycle.legal_states.includes(input.workflow.workflow_state) || input.lifecycle.initial_state !== "PENDING_REVIEW") result.push("LIFECYCLE_INVALID");
  if (!input.replay.replay_ref || !input.replay.replay_complete || !input.replay.replay_reproducible) result.push("REPLAY_UNAVAILABLE");
  if (input.workflow.tenant_id !== input.identity.tenant_id || input.workflow.tenant_id !== input.ownership.tenant_id || input.workflow.tenant_id !== certifiedPackage(input.certification).tenant_id) result.push("TENANT_VALIDATION_FAILED");
  if (!input.workflow.lineage_ref || !input.identity.lineage_ref) result.push("LINEAGE_MISSING");
  if (!input.authority.governance_compliant) result.push("GOVERNANCE_VALIDATION_FAILED");
  if (!input.authority.constitutional_compliant) result.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (!input.workflow.advisory_only || !input.certification.advisory_only) result.push("ADVISORY_ONLY_VIOLATION");
  if (
    workflowHash(input.workflow) !== input.workflow.integrity_hash
    || identityHash(input.identity) !== input.identity.integrity_hash
    || lifecycleHash(input.lifecycle) !== input.lifecycle.integrity_hash
    || ownershipHash(input.ownership) !== input.ownership.integrity_hash
    || authorityHash(input.authority) !== input.authority.integrity_hash
    || replayRegistrationHash(input.replay) !== input.replay.integrity_hash
    || auditHash(input.audit) !== input.audit.integrity_hash
  ) result.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(result)] as OperatorWorkflowContractFailureReason[]);
}

function buildValidation(workflowIdValue: string, currentFailures: readonly OperatorWorkflowContractFailureReason[]): OperatorWorkflowContractValidation {
  const has = (failure: OperatorWorkflowContractFailureReason) => currentFailures.includes(failure);
  const base: Omit<OperatorWorkflowContractValidation, "integrity_hash"> = {
    validation_id: `operator_workflow_contract_validation_${workflowIdValue}`,
    workflow_id: workflowIdValue,
    identity_valid: !has("WORKFLOW_IDENTITY_MISSING") && !has("DUPLICATE_WORKFLOW_DETECTED"),
    lifecycle_valid: !has("LIFECYCLE_INVALID"),
    ownership_valid: !has("OWNERSHIP_INVALID"),
    authority_valid: !has("AUTHORITY_UNDEFINED"),
    replay_valid: !has("REPLAY_UNAVAILABLE") && !has("REPLAY_DIVERGENCE"),
    integrity_valid: !has("INTEGRITY_VERIFICATION_FAILED"),
    tenant_valid: !has("TENANT_VALIDATION_FAILED"),
    governance_valid: !has("GOVERNANCE_VALIDATION_FAILED"),
    constitutional_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED"),
    validation_status: currentFailures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures: currentFailures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

function writeLedger(workflow: OperatorDecisionWorkflow, validation: OperatorWorkflowContractValidation): readonly OperatorWorkflowContractLedgerEntry[] {
  const base: Omit<OperatorWorkflowContractLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `operator_workflow_contract_ledger_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    package_id: workflow.package_id,
    orchestration_id: workflow.orchestration_id,
    tenant_id: workflow.tenant_id,
    mission_id: workflow.mission_id,
    operator_id: workflow.operator_id,
    workflow_state: workflow.workflow_state,
    authority_level: workflow.authority_level,
    replay_ref: workflow.replay_ref,
    lineage_ref: workflow.lineage_ref,
    integrity_hash: workflow.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<OperatorWorkflowContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_result: result.certification_result,
    workflow: result.workflow,
    identity: result.identity,
    lifecycle: result.lifecycle,
    ownership: result.ownership,
    authority: result.authority,
    replay_registration: result.replay_registration,
    audit_record: result.audit_record,
    validation: result.validation,
    workflow_ledger: result.workflow_ledger,
    failures: result.failures,
  });
}

export function createOperatorWorkflowContract(input: OperatorWorkflowContractInput = {}): OperatorWorkflowContractResult {
  const certification_result = input.certification_result ?? certifyDecisionPackage();
  const workflow = input.workflow ?? createOperatorDecisionWorkflow(certification_result);
  const identity = input.identity ?? createWorkflowIdentityRecord(workflow);
  const lifecycle = input.lifecycle ?? defineWorkflowLifecycle(workflow);
  const ownership = input.ownership ?? assignWorkflowOwnership(workflow);
  const authority = input.authority ?? defineWorkflowAuthority(certification_result, workflow);
  const replay_registration = input.replay_registration ?? registerWorkflowReplay(certification_result, workflow);
  const audit_record = input.audit_record ?? createWorkflowAuditRecord(workflow);
  const initialFailures = failures({
    certification: certification_result,
    workflow,
    identity,
    lifecycle,
    ownership,
    authority,
    replay: replay_registration,
    audit: audit_record,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(workflow.workflow_id, initialFailures);
  const ledger = writeLedger(workflow, validation);
  const ledgerFailures: readonly OperatorWorkflowContractFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as OperatorWorkflowContractFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(workflow.workflow_id, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(workflow, finalValidation);
  const base: Omit<OperatorWorkflowContractResult, "integrity_hash" | "replay_hash"> = {
    contract_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    certification_result,
    workflow,
    identity,
    lifecycle,
    ownership,
    authority,
    replay_registration,
    audit_record,
    validation: finalValidation,
    workflow_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly OperatorWorkflowContractFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(workflow.workflow_id, replayFailures);
    const replayBase: Omit<OperatorWorkflowContractResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      contract_status: "FAIL",
      fail_closed: true,
      validation: replayValidation,
      workflow_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayOperatorWorkflowContract(result: OperatorWorkflowContractResult): OperatorWorkflowContractReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && workflowHash(result.workflow) === result.workflow.integrity_hash
    && identityHash(result.identity) === result.identity.integrity_hash
    && lifecycleHash(result.lifecycle) === result.lifecycle.integrity_hash
    && ownershipHash(result.ownership) === result.ownership.integrity_hash
    && authorityHash(result.authority) === result.authority.integrity_hash
    && replayRegistrationHash(result.replay_registration) === result.replay_registration.integrity_hash
    && auditHash(result.audit_record) === result.audit_record.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.workflow_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const replayFailures: OperatorWorkflowContractFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<OperatorWorkflowContractReplay, "integrity_hash"> = {
    replay_id: "replay_operator_workflow_contract",
    replay_valid,
    workflow_id: result.workflow.workflow_id,
    package_id: result.workflow.package_id,
    lifecycle_state: result.workflow.workflow_state,
    authority_level: result.workflow.authority_level,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(replayFailures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildOperatorWorkflowContractObservability(result: OperatorWorkflowContractResult): OperatorWorkflowContractObservability {
  return Object.freeze({
    workflows_created: result.contract_status === "PASS" ? 1 : 0,
    identity_determinism: result.identity.deterministic ? 1 : 0,
    replay_reproducibility: replayOperatorWorkflowContract(result).replay_valid ? 1 : 0,
    authority_validation_accuracy: result.validation.authority_valid ? 1 : 0,
    ownership_consistency: result.validation.ownership_valid ? 1 : 0,
    audit_completeness: result.audit_record.recorded_events.length >= 7 ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    unauthorized_workflow_creation: result.failures.includes("UNAUTHORIZED_WORKFLOW_CONTRACT_ACCESS") ? 1 : 0,
    hidden_lifecycle_transitions: result.validation.lifecycle_valid ? 0 : 1,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getOperatorWorkflowContractFoundation(): OperatorWorkflowContractFoundation {
  const result = createOperatorWorkflowContract();
  const replay = replayOperatorWorkflowContract(result);
  return Object.freeze({
    contract_version: CONTRACT_VERSION,
    lifecycle_states: OPERATOR_WORKFLOW_LIFECYCLE_STATES,
    authority_levels: OPERATOR_WORKFLOW_AUTHORITY_LEVELS,
    result,
    replay,
    observability: buildOperatorWorkflowContractObservability(result),
  });
}

export const OperatorWorkflowContractService = Object.freeze({
  create: createOperatorWorkflowContract,
  replay: replayOperatorWorkflowContract,
});
