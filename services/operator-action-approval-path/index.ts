import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { summarizeGovernanceAuthority } from "@/services/governance-authority-summary";
import type { GovernanceAuthoritySummaryResult } from "@/types/governance-authority-summary";
import type {
  ApprovalPathRecord,
  CertificationRequirementRecord,
  DecisionActionSummary,
  EscalationWorkflowRecord,
  OperatorActionApprovalFailureReason,
  OperatorActionApprovalFoundation,
  OperatorActionApprovalInput,
  OperatorActionApprovalObservability,
  OperatorActionApprovalReplay,
  OperatorActionApprovalResult,
  OperatorActionRecord,
  OperatorActionType,
  OperatorActionWorkflow,
  OperatorWorkflowLedgerEntry,
  OperatorWorkflowState,
  OperatorWorkflowValidationResult,
} from "@/types/operator-action-approval-path";

const WORKFLOW_VERSION = "operator-action-approval-path/v1" as const;
const AUTHORIZED_COMPONENT = "operator-action-approval-path";
const NOW = "2026-07-04T01:16:00.000Z";

export const OPERATOR_WORKFLOW_STATES: readonly OperatorWorkflowState[] = Object.freeze(["INITIALIZED", "GENERATING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);
export const SUPPORTED_OPERATOR_ACTIONS: readonly OperatorActionType[] = Object.freeze(["approve", "reject", "defer", "escalate", "request_simulation", "request_evidence", "certify"]);

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

function actionHash(record: Omit<OperatorActionRecord, "integrity_hash"> | OperatorActionRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorActionRecordHash(record: Omit<OperatorActionRecord, "integrity_hash"> | OperatorActionRecord): string {
  return actionHash(record);
}

function approvalHash(record: Omit<ApprovalPathRecord, "integrity_hash"> | ApprovalPathRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeApprovalPathRecordHash(record: Omit<ApprovalPathRecord, "integrity_hash"> | ApprovalPathRecord): string {
  return approvalHash(record);
}

function escalationHash(record: Omit<EscalationWorkflowRecord, "integrity_hash"> | EscalationWorkflowRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeEscalationWorkflowRecordHash(record: Omit<EscalationWorkflowRecord, "integrity_hash"> | EscalationWorkflowRecord): string {
  return escalationHash(record);
}

function certificationHash(record: Omit<CertificationRequirementRecord, "integrity_hash"> | CertificationRequirementRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeCertificationRequirementRecordHash(record: Omit<CertificationRequirementRecord, "integrity_hash"> | CertificationRequirementRecord): string {
  return certificationHash(record);
}

function summaryHash(record: Omit<DecisionActionSummary, "integrity_hash"> | DecisionActionSummary): string {
  return hashWithoutIntegrity(record);
}

export function computeDecisionActionSummaryHash(record: Omit<DecisionActionSummary, "integrity_hash"> | DecisionActionSummary): string {
  return summaryHash(record);
}

function workflowHash(record: Omit<OperatorActionWorkflow, "integrity_hash"> | OperatorActionWorkflow): string {
  return hashWithoutIntegrity(record);
}

export function computeOperatorActionWorkflowHash(record: Omit<OperatorActionWorkflow, "integrity_hash"> | OperatorActionWorkflow): string {
  return workflowHash(record);
}

function validationHash(record: Omit<OperatorWorkflowValidationResult, "integrity_hash"> | OperatorWorkflowValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<OperatorWorkflowLedgerEntry, "ledger_integrity_hash"> | OperatorWorkflowLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

function actionAvailable(type: OperatorActionType, compliance: GovernanceAuthoritySummaryResult): boolean {
  if (compliance.summary_status !== "PASS" || compliance.fail_closed) return type === "defer" || type === "escalate" || type === "request_evidence";
  if (compliance.summary.blockers.length > 0) return type === "defer" || type === "escalate" || type === "request_evidence";
  if (compliance.authority_record.certification_required) return type === "defer" || type === "escalate" || type === "request_evidence" || type === "certify";
  return type !== "certify";
}

export function generateOperatorActions(compliance: GovernanceAuthoritySummaryResult = summarizeGovernanceAuthority()): readonly OperatorActionRecord[] {
  const pkg = compliance.forecast_result.evidence_result.package_build_result.package;
  const records = SUPPORTED_OPERATOR_ACTIONS.map((action_type) => {
    const base: Omit<OperatorActionRecord, "integrity_hash"> = {
      action_id: `operator_action_${action_type}_${pkg.package_id}`,
      package_id: pkg.package_id,
      action_type,
      authority_required: compliance.authority_record.required_authority_level,
      governance_required: compliance.governance_record.review_required,
      constitutional_constraints: compliance.summary.restrictions,
      action_available: actionAvailable(action_type, compliance),
    };
    return Object.freeze({ ...base, integrity_hash: actionHash(base) });
  });
  return Object.freeze(records);
}

export function generateApprovalPath(compliance: GovernanceAuthoritySummaryResult = summarizeGovernanceAuthority()): ApprovalPathRecord {
  const pkg = compliance.forecast_result.evidence_result.package_build_result.package;
  const gate = compliance.forecast_result.evidence_result.package_build_result.certification_result;
  const governanceReviews = normalize([
    ...compliance.governance_record.policy_checks,
    ...(compliance.governance_record.review_required ? ["governance review"] : []),
  ]);
  const certificationReviews = normalize(gate.certification_tests.filter((test) => test.actual === "PASS").map((test) => test.category));
  const base: Omit<ApprovalPathRecord, "integrity_hash"> = {
    approval_path_id: `approval_path_${pkg.package_id}`,
    package_id: pkg.package_id,
    approval_sequence: compliance.approval_record.approval_sequence,
    required_approvers: compliance.approval_record.required_approvers,
    governance_reviews: governanceReviews,
    certification_reviews: certificationReviews,
    completion_requirements: normalize(["operator acknowledgement", ...compliance.summary.approval_requirements, "replay and lineage retained"]),
  };
  return Object.freeze({ ...base, integrity_hash: approvalHash(base) });
}

export function generateEscalationWorkflow(compliance: GovernanceAuthoritySummaryResult = summarizeGovernanceAuthority()): EscalationWorkflowRecord {
  const pkg = compliance.forecast_result.evidence_result.package_build_result.package;
  const conditions = normalize([
    ...compliance.summary.blockers,
    ...(compliance.approval_record.escalation_required ? ["approval escalation required"] : []),
    ...(compliance.authority_record.governance_review_required ? ["governance escalation"] : []),
    ...(compliance.constitutional_record.fail_closed_required ? ["constitutional escalation"] : []),
  ]);
  const targets = normalize([
    ...(compliance.authority_record.governance_review_required ? ["governance reviewer"] : []),
    ...(compliance.constitutional_record.fail_closed_required ? ["constitutional reviewer"] : []),
    ...(compliance.authority_record.certification_required ? ["certification authority"] : []),
    "mission operator",
  ]);
  const base: Omit<EscalationWorkflowRecord, "integrity_hash"> = {
    escalation_id: `escalation_workflow_${pkg.package_id}`,
    package_id: pkg.package_id,
    escalation_conditions: conditions.length > 0 ? conditions : Object.freeze(["no escalation currently required"]),
    escalation_targets: targets,
    escalation_order: Object.freeze(["operator review", ...targets, "record escalation outcome"]),
    escalation_summary: conditions.length > 0 ? `Escalate on ${conditions.join("; ")}.` : "No escalation currently required.",
  };
  return Object.freeze({ ...base, integrity_hash: escalationHash(base) });
}

export function generateCertificationRequirements(compliance: GovernanceAuthoritySummaryResult = summarizeGovernanceAuthority()): CertificationRequirementRecord {
  const pkg = compliance.forecast_result.evidence_result.package_build_result.package;
  const gate = compliance.forecast_result.evidence_result.package_build_result.certification_result;
  const categories = normalize(gate.certification_tests.map((test) => test.category));
  const blockers = normalize([...compliance.approval_record.approval_blockers, ...gate.failures]);
  const base: Omit<CertificationRequirementRecord, "integrity_hash"> = {
    certification_record_id: `certification_requirements_${pkg.package_id}`,
    package_id: pkg.package_id,
    required_certifications: categories,
    certification_order: Object.freeze(["governance certification", "constitutional certification", "authority certification", "replay certification", "integrity certification", "production readiness certification"]),
    certification_blockers: blockers,
    certification_summary: gate.evidence_package.production_readiness === "READY" ? "Production readiness certification is complete." : "Certification remains required before approval can progress.",
  };
  return Object.freeze({ ...base, integrity_hash: certificationHash(base) });
}

export function createDecisionActionSummary(
  compliance: GovernanceAuthoritySummaryResult = summarizeGovernanceAuthority(),
  actions: readonly OperatorActionRecord[] = generateOperatorActions(compliance),
  approvalPath: ApprovalPathRecord = generateApprovalPath(compliance),
  escalation: EscalationWorkflowRecord = generateEscalationWorkflow(compliance),
  certification: CertificationRequirementRecord = generateCertificationRequirements(compliance),
): DecisionActionSummary {
  const base: Omit<DecisionActionSummary, "integrity_hash"> = {
    action_summary_id: `decision_action_summary_${compliance.summary.package_id}`,
    package_id: compliance.summary.package_id,
    available_action_types: Object.freeze(actions.filter((action) => action.action_available).map((action) => action.action_type)),
    required_approvals: approvalPath.required_approvers,
    escalation_conditions: escalation.escalation_conditions,
    certification_requirements: certification.required_certifications,
    authority_limitations: compliance.summary.authority_requirements,
  };
  return Object.freeze({ ...base, integrity_hash: summaryHash(base) });
}

export function createOperatorActionWorkflow(
  compliance: GovernanceAuthoritySummaryResult = summarizeGovernanceAuthority(),
  actions: readonly OperatorActionRecord[] = generateOperatorActions(compliance),
  approvalPath: ApprovalPathRecord = generateApprovalPath(compliance),
  escalation: EscalationWorkflowRecord = generateEscalationWorkflow(compliance),
  certification: CertificationRequirementRecord = generateCertificationRequirements(compliance),
  actionSummary: DecisionActionSummary = createDecisionActionSummary(compliance, actions, approvalPath, escalation, certification),
): OperatorActionWorkflow {
  const pkg = compliance.forecast_result.evidence_result.package_build_result.package;
  const base: Omit<OperatorActionWorkflow, "integrity_hash"> = {
    workflow_id: `operator_action_workflow_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    available_actions: actions,
    approval_path: approvalPath,
    escalation_path: escalation,
    certification_requirements: certification,
    operator_summary: `Available actions: ${actionSummary.available_action_types.join(", ")}. Approvals: ${approvalPath.required_approvers.join(", ")}.`,
    replay_ref: compliance.summary.replay_ref,
    lineage_ref: compliance.summary.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: workflowHash(base) });
}

function workflowFailures(input: {
  compliance: GovernanceAuthoritySummaryResult;
  workflow: OperatorActionWorkflow;
  actions: readonly OperatorActionRecord[];
  approvalPath: ApprovalPathRecord;
  escalation: EscalationWorkflowRecord;
  certification: CertificationRequirementRecord;
  actionSummary: DecisionActionSummary;
  authorized: boolean;
}): readonly OperatorActionApprovalFailureReason[] {
  const failures: OperatorActionApprovalFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_OPERATOR_WORKFLOW_ACCESS");
  if (input.compliance.summary_status !== "PASS") failures.push("COMPLIANCE_SUMMARY_INVALID");
  if (input.actions.length === 0 || !input.actions.some((action) => action.action_available)) failures.push("OPERATOR_ACTIONS_UNAVAILABLE");
  if (input.approvalPath.approval_sequence.length === 0 || input.approvalPath.required_approvers.length === 0 || input.approvalPath.completion_requirements.length === 0) failures.push("APPROVAL_PATH_INCOMPLETE");
  if (input.escalation.escalation_conditions.length === 0 || input.escalation.escalation_targets.length === 0 || input.escalation.escalation_order.length === 0) failures.push("ESCALATION_WORKFLOW_MISSING");
  if (input.certification.required_certifications.length === 0 || input.certification.certification_order.length === 0) failures.push("CERTIFICATION_REQUIREMENTS_ABSENT");
  if (!input.actions.every((action) => action.authority_required.length > 0) || input.actionSummary.authority_limitations.length === 0) failures.push("AUTHORITY_VALIDATION_MISSING");
  if (input.approvalPath.governance_reviews.length === 0 || !input.compliance.summary.governance_status) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (!input.workflow.replay_ref) failures.push("REPLAY_REFERENCE_MISSING");
  if (!input.workflow.lineage_ref) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.workflow.tenant_id !== input.compliance.summary.tenant_id) failures.push("TENANT_MISMATCH");
  if (!input.workflow.advisory_only || !input.compliance.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (input.actions.some((action) => action.action_type === "approve" && action.action_available && (input.compliance.summary.blockers.length > 0 || input.compliance.authority_record.certification_required))) failures.push("UNAUTHORIZED_ACTION_EXPOSED");
  if (
    workflowHash(input.workflow) !== input.workflow.integrity_hash
    || input.actions.some((action) => actionHash(action) !== action.integrity_hash)
    || approvalHash(input.approvalPath) !== input.approvalPath.integrity_hash
    || escalationHash(input.escalation) !== input.escalation.integrity_hash
    || certificationHash(input.certification) !== input.certification.integrity_hash
    || summaryHash(input.actionSummary) !== input.actionSummary.integrity_hash
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as OperatorActionApprovalFailureReason[]);
}

function buildValidation(workflow: OperatorActionWorkflow, failures: readonly OperatorActionApprovalFailureReason[]): OperatorWorkflowValidationResult {
  const has = (failure: OperatorActionApprovalFailureReason) => failures.includes(failure);
  const base: Omit<OperatorWorkflowValidationResult, "integrity_hash"> = {
    validation_id: `operator_workflow_validation_${workflow.workflow_id}`,
    package_id: workflow.package_id,
    operator_actions_generated: !has("OPERATOR_ACTIONS_UNAVAILABLE") && !has("UNAUTHORIZED_ACTION_EXPOSED"),
    approval_path_complete: !has("APPROVAL_PATH_INCOMPLETE"),
    escalation_workflow_complete: !has("ESCALATION_WORKFLOW_MISSING"),
    certification_requirements_complete: !has("CERTIFICATION_REQUIREMENTS_ABSENT"),
    authority_boundaries_enforced: !has("AUTHORITY_VALIDATION_MISSING") && !has("UNAUTHORIZED_ACTION_EXPOSED"),
    governance_validation_present: !has("GOVERNANCE_VALIDATION_MISSING"),
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

function writeLedger(workflow: OperatorActionWorkflow, validation: OperatorWorkflowValidationResult): readonly OperatorWorkflowLedgerEntry[] {
  const base: Omit<OperatorWorkflowLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `operator_workflow_ledger_${workflow.workflow_id}`,
    workflow_id: workflow.workflow_id,
    package_id: workflow.package_id,
    orchestration_id: workflow.orchestration_id,
    generation_timestamp: NOW,
    operator_actions: Object.freeze(workflow.available_actions.filter((action) => action.action_available).map((action) => action.action_type)),
    approval_workflow: workflow.approval_path.approval_sequence,
    escalation_workflow: workflow.escalation_path.escalation_order,
    certification_requirements: workflow.certification_requirements.required_certifications,
    replay_ref: workflow.replay_ref,
    lineage_ref: workflow.lineage_ref,
    integrity_hash: workflow.integrity_hash,
    validation_status: validation.validation_status,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<OperatorActionApprovalResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    compliance_result: result.compliance_result,
    workflow: result.workflow,
    action_records: result.action_records,
    approval_path: result.approval_path,
    escalation_workflow: result.escalation_workflow,
    certification_requirements: result.certification_requirements,
    action_summary: result.action_summary,
    validation: result.validation,
    workflow_ledger: result.workflow_ledger,
    failures: result.failures,
  });
}

export function generateOperatorActionApprovalPath(input: OperatorActionApprovalInput = {}): OperatorActionApprovalResult {
  const compliance_result = input.compliance_result ?? summarizeGovernanceAuthority();
  const action_records = input.action_records ?? generateOperatorActions(compliance_result);
  const approval_path = input.approval_path ?? generateApprovalPath(compliance_result);
  const escalation_workflow = input.escalation_workflow ?? generateEscalationWorkflow(compliance_result);
  const certification_requirements = input.certification_requirements ?? generateCertificationRequirements(compliance_result);
  const action_summary = input.action_summary ?? createDecisionActionSummary(compliance_result, action_records, approval_path, escalation_workflow, certification_requirements);
  const workflow = input.workflow ?? createOperatorActionWorkflow(compliance_result, action_records, approval_path, escalation_workflow, certification_requirements, action_summary);
  const initialFailures = workflowFailures({
    compliance: compliance_result,
    workflow,
    actions: action_records,
    approvalPath: approval_path,
    escalation: escalation_workflow,
    certification: certification_requirements,
    actionSummary: action_summary,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const validation = buildValidation(workflow, initialFailures);
  const ledger = writeLedger(workflow, validation);
  const ledgerFailures: readonly OperatorActionApprovalFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...initialFailures, ...ledgerFailures])] as OperatorActionApprovalFailureReason[]);
  const finalValidation = finalFailures.length === initialFailures.length ? validation : buildValidation(workflow, finalFailures);
  const finalLedger = finalValidation === validation ? ledger : writeLedger(workflow, finalValidation);
  const base: Omit<OperatorActionApprovalResult, "integrity_hash" | "replay_hash"> = {
    workflow_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    compliance_result,
    workflow,
    action_records,
    approval_path,
    escalation_workflow,
    certification_requirements,
    action_summary,
    validation: finalValidation,
    workflow_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly OperatorActionApprovalFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(workflow, replayFailures);
    const replayBase: Omit<OperatorActionApprovalResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      workflow_status: "FAIL",
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

export function replayOperatorActionApprovalPath(result: OperatorActionApprovalResult): OperatorActionApprovalReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && workflowHash(result.workflow) === result.workflow.integrity_hash
    && result.action_records.every((action) => actionHash(action) === action.integrity_hash)
    && approvalHash(result.approval_path) === result.approval_path.integrity_hash
    && escalationHash(result.escalation_workflow) === result.escalation_workflow.integrity_hash
    && certificationHash(result.certification_requirements) === result.certification_requirements.integrity_hash
    && summaryHash(result.action_summary) === result.action_summary.integrity_hash
    && validationHash(result.validation) === result.validation.integrity_hash
    && result.workflow_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: OperatorActionApprovalFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<OperatorActionApprovalReplay, "integrity_hash"> = {
    replay_id: "replay_operator_action_approval_path",
    replay_valid,
    workflow_id: result.workflow.workflow_id,
    package_id: result.workflow.package_id,
    action_types: result.workflow.available_actions.filter((action) => action.action_available).map((action) => action.action_type),
    approval_sequence: result.approval_path.approval_sequence,
    certification_requirements: result.certification_requirements.required_certifications,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildOperatorActionApprovalObservability(result: OperatorActionApprovalResult): OperatorActionApprovalObservability {
  const completeChecks = [
    result.validation.operator_actions_generated,
    result.validation.approval_path_complete,
    result.validation.escalation_workflow_complete,
    result.validation.certification_requirements_complete,
    result.validation.authority_boundaries_enforced,
    result.validation.governance_validation_present,
    result.validation.replay_present,
    result.validation.lineage_present,
    result.validation.integrity_valid,
    result.validation.tenant_valid,
  ].filter(Boolean).length;
  return Object.freeze({
    operator_workflows_generated: result.workflow_status === "PASS" ? 1 : 0,
    operator_actions_generated: result.action_records.filter((action) => action.action_available).length,
    approval_paths_generated: result.validation.approval_path_complete ? 1 : 0,
    escalation_workflows_generated: result.validation.escalation_workflow_complete ? 1 : 0,
    certification_requirements_generated: result.certification_requirements.required_certifications.length,
    workflow_completeness: Number((completeChecks / 10).toFixed(2)),
    validation_failures: result.failures.length,
    replay_reproducibility: replayOperatorActionApprovalPath(result).replay_valid ? 1 : 0,
    integrity_verification_success: result.validation.integrity_valid ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getOperatorActionApprovalFoundation(): OperatorActionApprovalFoundation {
  const result = generateOperatorActionApprovalPath();
  const replay = replayOperatorActionApprovalPath(result);
  return Object.freeze({
    workflow_version: WORKFLOW_VERSION,
    workflow_states: OPERATOR_WORKFLOW_STATES,
    supported_actions: SUPPORTED_OPERATOR_ACTIONS,
    result,
    replay,
    observability: buildOperatorActionApprovalObservability(result),
  });
}

export const OperatorActionApprovalPath = Object.freeze({
  generate: generateOperatorActionApprovalPath,
  replay: replayOperatorActionApprovalPath,
});
