import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { generateOperatorActionApprovalPath } from "@/services/operator-action-approval-path";
import type { OperatorActionApprovalResult } from "@/types/operator-action-approval-path";
import type {
  LineageReferenceRecord,
  RecoveryGuidanceRecord,
  ReplayReferenceLedgerEntry,
  ReplayReferenceRecord,
  ReplayValidationResult,
  RollbackPlanRecord,
  RollbackRecoveryPackage,
  RollbackRecoveryReplayCheck,
  RollbackRecoveryReplayFailureReason,
  RollbackRecoveryReplayFoundation,
  RollbackRecoveryReplayInput,
  RollbackRecoveryReplayObservability,
  RollbackRecoveryReplayResult,
  RollbackRecoveryReplayState,
} from "@/types/rollback-recovery-replay-references";

const REFERENCE_VERSION = "rollback-recovery-replay-references/v1" as const;
const AUTHORIZED_COMPONENT = "rollback-recovery-replay-references";
const NOW = "2026-07-04T01:18:00.000Z";

export const ROLLBACK_RECOVERY_REPLAY_STATES: readonly RollbackRecoveryReplayState[] = Object.freeze(["INITIALIZED", "GENERATING", "VALIDATING", "COMPLETE", "VERIFIED", "FAILED", "FAIL_CLOSED"]);

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

function rollbackHash(record: Omit<RollbackPlanRecord, "integrity_hash"> | RollbackPlanRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeRollbackPlanRecordHash(record: Omit<RollbackPlanRecord, "integrity_hash"> | RollbackPlanRecord): string {
  return rollbackHash(record);
}

function recoveryHash(record: Omit<RecoveryGuidanceRecord, "integrity_hash"> | RecoveryGuidanceRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeRecoveryGuidanceRecordHash(record: Omit<RecoveryGuidanceRecord, "integrity_hash"> | RecoveryGuidanceRecord): string {
  return recoveryHash(record);
}

function replayReferenceHash(record: Omit<ReplayReferenceRecord, "integrity_hash"> | ReplayReferenceRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeReplayReferenceRecordHash(record: Omit<ReplayReferenceRecord, "integrity_hash"> | ReplayReferenceRecord): string {
  return replayReferenceHash(record);
}

function lineageHash(record: Omit<LineageReferenceRecord, "integrity_hash"> | LineageReferenceRecord): string {
  return hashWithoutIntegrity(record);
}

export function computeLineageReferenceRecordHash(record: Omit<LineageReferenceRecord, "integrity_hash"> | LineageReferenceRecord): string {
  return lineageHash(record);
}

function packageHash(record: Omit<RollbackRecoveryPackage, "integrity_hash"> | RollbackRecoveryPackage): string {
  return hashWithoutIntegrity(record);
}

export function computeRollbackRecoveryPackageHash(record: Omit<RollbackRecoveryPackage, "integrity_hash"> | RollbackRecoveryPackage): string {
  return packageHash(record);
}

function validationHash(record: Omit<ReplayValidationResult, "integrity_hash"> | ReplayValidationResult): string {
  return hashWithoutIntegrity(record);
}

function ledgerHash(record: Omit<ReplayReferenceLedgerEntry, "ledger_integrity_hash"> | ReplayReferenceLedgerEntry): string {
  return hashWithoutIntegrity(record);
}

export function generateRollbackPlan(workflow: OperatorActionApprovalResult = generateOperatorActionApprovalPath()): RollbackPlanRecord {
  const pkg = workflow.compliance_result.forecast_result.evidence_result.package_build_result.package;
  const base: Omit<RollbackPlanRecord, "integrity_hash"> = {
    rollback_id: `rollback_plan_${pkg.package_id}`,
    package_id: pkg.package_id,
    rollback_steps: Object.freeze(["pause pending approval workflow", pkg.rollback_guidance, "record rollback decision in package lineage"]),
    rollback_prerequisites: normalize(["operator review", ...workflow.approval_path.completion_requirements]),
    rollback_limitations: normalize([...workflow.compliance_result.summary.restrictions, "rollback guidance is advisory-only"]),
    rollback_risks: normalize([pkg.risk_summary, workflow.compliance_result.forecast_result.evidence_result.risk_record.recovery_risk]),
    rollback_summary: pkg.rollback_guidance,
  };
  return Object.freeze({ ...base, integrity_hash: rollbackHash(base) });
}

export function generateRecoveryGuidance(workflow: OperatorActionApprovalResult = generateOperatorActionApprovalPath()): RecoveryGuidanceRecord {
  const pkg = workflow.compliance_result.forecast_result.evidence_result.package_build_result.package;
  const priority = workflow.fail_closed || workflow.compliance_result.fail_closed ? "HIGH" : workflow.certification_requirements.certification_blockers.length > 0 ? "MEDIUM" : "LOW";
  const base: Omit<RecoveryGuidanceRecord, "integrity_hash"> = {
    recovery_id: `recovery_guidance_${pkg.package_id}`,
    package_id: pkg.package_id,
    recovery_recommendations: Object.freeze([pkg.recovery_guidance, workflow.escalation_workflow.escalation_summary]),
    recovery_dependencies: normalize([...workflow.escalation_workflow.escalation_targets, ...workflow.certification_requirements.required_certifications]),
    recovery_constraints: normalize([...workflow.compliance_result.summary.restrictions, ...workflow.certification_requirements.certification_blockers]),
    recovery_priority: priority,
    recovery_summary: pkg.recovery_guidance,
  };
  return Object.freeze({ ...base, integrity_hash: recoveryHash(base) });
}

export function buildReplayReference(workflow: OperatorActionApprovalResult = generateOperatorActionApprovalPath()): ReplayReferenceRecord {
  const pkg = workflow.compliance_result.forecast_result.evidence_result.package_build_result.package;
  const base: Omit<ReplayReferenceRecord, "integrity_hash"> = {
    replay_reference_id: `replay_reference_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_replay: pkg.replay_ref,
    simulation_replay: workflow.compliance_result.forecast_result.replay_hash,
    governance_replay: workflow.compliance_result.replay_hash,
    decision_replay: workflow.replay_hash,
    replay_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: replayReferenceHash(base) });
}

export function buildLineageReference(workflow: OperatorActionApprovalResult = generateOperatorActionApprovalPath()): LineageReferenceRecord {
  const pkg = workflow.compliance_result.forecast_result.evidence_result.package_build_result.package;
  const evidence = workflow.compliance_result.forecast_result.evidence_result;
  const base: Omit<LineageReferenceRecord, "integrity_hash"> = {
    lineage_reference_id: `lineage_reference_${pkg.package_id}`,
    package_id: pkg.package_id,
    parent_decisions: normalize([pkg.orchestration_id, evidence.summary.summary_id, workflow.workflow.workflow_id]),
    child_decisions: normalize([workflow.workflow_ledger[0]?.ledger_id ?? "", workflow.action_summary.action_summary_id]),
    evidence_lineage: evidence.quality_assessment.evidence_sources,
    governance_lineage: normalize([workflow.compliance_result.governance_record.governance_record_id, workflow.compliance_result.constitutional_record.constitutional_record_id, workflow.compliance_result.authority_record.authority_record_id]),
    dependency_lineage: normalize(workflow.compliance_result.forecast_result.dependency_impacts.map((item) => item.dependency_id)),
    lineage_summary: pkg.lineage_ref,
  };
  return Object.freeze({ ...base, integrity_hash: lineageHash(base) });
}

function referenceFailures(input: {
  workflow: OperatorActionApprovalResult;
  rollback: RollbackPlanRecord;
  recovery: RecoveryGuidanceRecord;
  replayReference: ReplayReferenceRecord;
  lineageReference: LineageReferenceRecord;
  package?: RollbackRecoveryPackage;
  authorized: boolean;
}): readonly RollbackRecoveryReplayFailureReason[] {
  const failures: RollbackRecoveryReplayFailureReason[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_ROLLBACK_RECOVERY_ACCESS");
  if (input.workflow.workflow_status !== "PASS") failures.push("OPERATOR_WORKFLOW_INVALID");
  if (input.rollback.rollback_steps.length === 0 || !input.rollback.rollback_summary) failures.push("ROLLBACK_GUIDANCE_MISSING");
  if (input.recovery.recovery_recommendations.length === 0 || !input.recovery.recovery_summary) failures.push("RECOVERY_GUIDANCE_UNAVAILABLE");
  if (!input.replayReference.orchestration_replay || !input.replayReference.governance_replay || !input.replayReference.decision_replay || !input.replayReference.replay_timestamp) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.lineageReference.lineage_summary) failures.push("LINEAGE_REFERENCE_MISSING");
  if (input.lineageReference.parent_decisions.length === 0 || input.lineageReference.evidence_lineage.length === 0 || input.lineageReference.governance_lineage.length === 0 || input.lineageReference.dependency_lineage.length === 0) failures.push("LINEAGE_INCOMPLETE");
  if (input.replayReference.decision_replay !== input.workflow.replay_hash) failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (input.package && input.package.tenant_id !== input.workflow.workflow.tenant_id) failures.push("TENANT_MISMATCH");
  if (input.package && !input.package.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  if (
    rollbackHash(input.rollback) !== input.rollback.integrity_hash
    || recoveryHash(input.recovery) !== input.recovery.integrity_hash
    || replayReferenceHash(input.replayReference) !== input.replayReference.integrity_hash
    || lineageHash(input.lineageReference) !== input.lineageReference.integrity_hash
    || (input.package ? packageHash(input.package) !== input.package.integrity_hash : false)
  ) failures.push("INTEGRITY_VERIFICATION_FAILED");
  return Object.freeze([...new Set(failures)] as RollbackRecoveryReplayFailureReason[]);
}

function buildValidation(packageId: string, failures: readonly RollbackRecoveryReplayFailureReason[]): ReplayValidationResult {
  const has = (failure: RollbackRecoveryReplayFailureReason) => failures.includes(failure);
  const base: Omit<ReplayValidationResult, "integrity_hash"> = {
    validation_id: `replay_validation_${packageId}`,
    package_id: packageId,
    replay_available: !has("REPLAY_REFERENCES_MISSING"),
    replay_complete: !has("REPLAY_REFERENCES_MISSING"),
    replay_reproducible: !has("REPLAY_RECONSTRUCTION_FAILED") && !has("REPLAY_DIVERGENCE"),
    lineage_complete: !has("LINEAGE_INCOMPLETE") && !has("LINEAGE_REFERENCE_MISSING"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"),
    validation_status: failures.length === 0 ? "VALID" : "REJECTED",
    validation_timestamp: NOW,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: validationHash(base) });
}

export function createRollbackRecoveryPackage(
  workflow: OperatorActionApprovalResult = generateOperatorActionApprovalPath(),
  rollback: RollbackPlanRecord = generateRollbackPlan(workflow),
  recovery: RecoveryGuidanceRecord = generateRecoveryGuidance(workflow),
  replayReference: ReplayReferenceRecord = buildReplayReference(workflow),
  lineageReference: LineageReferenceRecord = buildLineageReference(workflow),
  validation: ReplayValidationResult = buildValidation(workflow.workflow.package_id, []),
): RollbackRecoveryPackage {
  const pkg = workflow.compliance_result.forecast_result.evidence_result.package_build_result.package;
  const base: Omit<RollbackRecoveryPackage, "integrity_hash"> = {
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    mission_id: pkg.mission_id,
    tenant_id: pkg.tenant_id,
    rollback_plan: rollback,
    recovery_guidance: recovery,
    replay_reference: replayReference,
    lineage_reference: lineageReference,
    replay_validation: validation,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

function writeLedger(pkg: RollbackRecoveryPackage, validation: ReplayValidationResult): readonly ReplayReferenceLedgerEntry[] {
  const base: Omit<ReplayReferenceLedgerEntry, "ledger_integrity_hash"> = {
    ledger_id: `replay_reference_ledger_${pkg.package_id}`,
    package_id: pkg.package_id,
    orchestration_id: pkg.orchestration_id,
    rollback_plan_id: pkg.rollback_plan.rollback_id,
    recovery_guidance_id: pkg.recovery_guidance.recovery_id,
    replay_reference_id: pkg.replay_reference.replay_reference_id,
    lineage_reference_id: pkg.lineage_reference.lineage_reference_id,
    validation_timestamp: NOW,
    replay_validation_status: validation.validation_status,
    replay_ref: pkg.replay_ref,
    lineage_ref: pkg.lineage_ref,
    integrity_hash: pkg.integrity_hash,
    append_only: true,
    deleted: false,
  };
  return Object.freeze([Object.freeze({ ...base, ledger_integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<RollbackRecoveryReplayResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    workflow_result: result.workflow_result,
    package: result.package,
    rollback_plan: result.rollback_plan,
    recovery_guidance: result.recovery_guidance,
    replay_reference: result.replay_reference,
    lineage_reference: result.lineage_reference,
    replay_validation: result.replay_validation,
    replay_ledger: result.replay_ledger,
    failures: result.failures,
  });
}

export function generateRollbackRecoveryReplayReferences(input: RollbackRecoveryReplayInput = {}): RollbackRecoveryReplayResult {
  const workflow_result = input.workflow_result ?? generateOperatorActionApprovalPath();
  const rollback_plan = input.rollback_plan ?? generateRollbackPlan(workflow_result);
  const recovery_guidance = input.recovery_guidance ?? generateRecoveryGuidance(workflow_result);
  const replay_reference = input.replay_reference ?? buildReplayReference(workflow_result);
  const lineage_reference = input.lineage_reference ?? buildLineageReference(workflow_result);
  const provisionalFailures = referenceFailures({
    workflow: workflow_result,
    rollback: rollback_plan,
    recovery: recovery_guidance,
    replayReference: replay_reference,
    lineageReference: lineage_reference,
    package: undefined,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const provisionalValidation = buildValidation(workflow_result.workflow.package_id, provisionalFailures);
  const packageRecord = input.package ?? createRollbackRecoveryPackage(workflow_result, rollback_plan, recovery_guidance, replay_reference, lineage_reference, provisionalValidation);
  const packageFailures = referenceFailures({
    workflow: workflow_result,
    rollback: rollback_plan,
    recovery: recovery_guidance,
    replayReference: replay_reference,
    lineageReference: lineage_reference,
    package: packageRecord,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const failures = Object.freeze([...new Set([...provisionalFailures, ...packageFailures])] as RollbackRecoveryReplayFailureReason[]);
  const replay_validation = failures.length === provisionalFailures.length ? provisionalValidation : buildValidation(packageRecord.package_id, failures);
  const finalPackage = packageRecord.replay_validation === replay_validation ? packageRecord : createRollbackRecoveryPackage(workflow_result, rollback_plan, recovery_guidance, replay_reference, lineage_reference, replay_validation);
  const ledger = writeLedger(finalPackage, replay_validation);
  const ledgerFailures: readonly RollbackRecoveryReplayFailureReason[] = ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash && entry.append_only && !entry.deleted) ? [] : ["INTEGRITY_VERIFICATION_FAILED"];
  const finalFailures = Object.freeze([...new Set([...failures, ...ledgerFailures])] as RollbackRecoveryReplayFailureReason[]);
  const finalValidation = finalFailures.length === failures.length ? replay_validation : buildValidation(finalPackage.package_id, finalFailures);
  const finalLedger = finalValidation === replay_validation ? ledger : writeLedger(finalPackage, finalValidation);
  const base: Omit<RollbackRecoveryReplayResult, "integrity_hash" | "replay_hash"> = {
    reference_status: finalValidation.validation_status === "VALID" ? "PASS" : "FAIL",
    fail_closed: finalValidation.failures.length > 0,
    workflow_result,
    package: finalPackage,
    rollback_plan,
    recovery_guidance,
    replay_reference,
    lineage_reference,
    replay_validation: finalValidation,
    replay_ledger: finalLedger,
    failures: finalValidation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayFailures: readonly RollbackRecoveryReplayFailureReason[] = Object.freeze(["REPLAY_DIVERGENCE"]);
    const replayValidation = buildValidation(finalPackage.package_id, replayFailures);
    const replayBase: Omit<RollbackRecoveryReplayResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      reference_status: "FAIL",
      fail_closed: true,
      replay_validation: replayValidation,
      replay_ledger: Object.freeze([]),
      failures: replayFailures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayRollbackRecoveryReferences(result: RollbackRecoveryReplayResult): RollbackRecoveryReplayCheck {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && packageHash(result.package) === result.package.integrity_hash
    && rollbackHash(result.rollback_plan) === result.rollback_plan.integrity_hash
    && recoveryHash(result.recovery_guidance) === result.recovery_guidance.integrity_hash
    && replayReferenceHash(result.replay_reference) === result.replay_reference.integrity_hash
    && lineageHash(result.lineage_reference) === result.lineage_reference.integrity_hash
    && validationHash(result.replay_validation) === result.replay_validation.integrity_hash
    && result.replay_ledger.every((entry) => ledgerHash(entry) === entry.ledger_integrity_hash);
  const failures: RollbackRecoveryReplayFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<RollbackRecoveryReplayCheck, "integrity_hash"> = {
    replay_id: "replay_rollback_recovery_references",
    replay_valid,
    package_id: result.package.package_id,
    rollback_plan_id: result.rollback_plan.rollback_id,
    recovery_guidance_id: result.recovery_guidance.recovery_id,
    replay_reference_id: result.replay_reference.replay_reference_id,
    lineage_reference_id: result.lineage_reference.lineage_reference_id,
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildRollbackRecoveryReplayObservability(result: RollbackRecoveryReplayResult): RollbackRecoveryReplayObservability {
  return Object.freeze({
    rollback_plans_generated: result.replay_validation.failures.includes("ROLLBACK_GUIDANCE_MISSING") ? 0 : 1,
    recovery_guides_generated: result.replay_validation.failures.includes("RECOVERY_GUIDANCE_UNAVAILABLE") ? 0 : 1,
    replay_references_attached: result.replay_validation.replay_available ? 1 : 0,
    lineage_references_attached: result.replay_validation.lineage_complete ? 1 : 0,
    replay_validation_success: result.replay_validation.validation_status === "VALID" ? 1 : 0,
    lineage_completeness: result.replay_validation.lineage_complete ? 1 : 0,
    validation_failures: result.failures.length,
    replay_latency_ms: 0,
    integrity_verification_success: result.replay_validation.integrity_verified ? 1 : 0,
    fail_closed_activations: result.fail_closed ? 1 : 0,
  });
}

export function getRollbackRecoveryReplayFoundation(): RollbackRecoveryReplayFoundation {
  const result = generateRollbackRecoveryReplayReferences();
  const replay = replayRollbackRecoveryReferences(result);
  return Object.freeze({
    reference_version: REFERENCE_VERSION,
    reference_states: ROLLBACK_RECOVERY_REPLAY_STATES,
    result,
    replay,
    observability: buildRollbackRecoveryReplayObservability(result),
  });
}

export const RollbackRecoveryReplayReferences = Object.freeze({
  generate: generateRollbackRecoveryReplayReferences,
  replay: replayRollbackRecoveryReferences,
});
