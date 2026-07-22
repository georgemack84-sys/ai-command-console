import { resolveAuthorityAndApprovals } from "@/services/authority-approval-requirement-resolver";
import { validateCertificationAndReplay } from "@/services/certification-replay-requirement-validator";
import { validateConstitutionalDecision } from "@/services/constitutional-decision-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { createGovernanceDecisionRecord, GOVERNANCE_ENFORCEMENT_STATES, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { validateGovernancePolicy } from "@/services/governance-policy-validation-engine";
import { verifyIntegrityAndImmutableLineage } from "@/services/integrity-immutable-lineage-verification";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type { AuthorityApprovalResolverResult } from "@/types/authority-approval-requirement-resolver";
import type { CertificationReplayValidatorResult } from "@/types/certification-replay-requirement-validator";
import type { ConstitutionalDecisionValidationResult } from "@/types/constitutional-decision-validator";
import type { GovernanceDecisionContractValidation, GovernanceDecisionRecord, GovernanceEnforcementState } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";
import type { IntegrityLineageVerifierResult } from "@/types/integrity-immutable-lineage-verification";
import type { TenantIsolationValidatorResult } from "@/types/tenant-isolation-validator";
import type {
  EnforcementBlockingCondition,
  EnforcementDecisionReport,
  EnforcementEvaluationRecord,
  EnforcementLedgerRecord,
  EnforcementValidationSnapshot,
  FailClosedEnforcementFoundation,
  FailClosedEnforcementInput,
  FailClosedEnforcementObservability,
  FailClosedEnforcementReplay,
  FailClosedEnforcementResult,
  FailClosedEnforcementValidation,
  FailClosedRule,
} from "@/types/fail-closed-enforcement-engine";

const ENGINE_VERSION = "fail-closed-enforcement-engine/v1" as const;
const AUTHORIZED_COMPONENT = "fail-closed-enforcement-engine";
const NOW = "2026-07-04T00:42:00.000Z";

export const FAIL_CLOSED_RULE_REGISTRY: readonly FailClosedRule[] = Object.freeze([
  "GOVERNANCE_EVIDENCE_MISSING",
  "CONSTITUTIONAL_EVIDENCE_MISSING",
  "AUTHORITY_UNRESOLVED",
  "REPLAY_UNAVAILABLE",
  "CERTIFICATION_MISSING",
  "INTEGRITY_MISMATCH",
  "LINEAGE_INCOMPLETE",
  "TENANT_VIOLATION",
  "UNKNOWN_VALIDATION_STATE",
  "REPLAY_DIVERGENCE",
  "HASH_MISMATCH",
].map((condition) => Object.freeze({
  rule_id: `fail_closed_${condition.toLowerCase()}`,
  blocking_condition: condition as EnforcementBlockingCondition,
  enforcement_outcome: "FAIL_CLOSED",
  mandatory: true,
})));

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

function snapshot(input: Omit<EnforcementValidationSnapshot, "integrity_hash">): EnforcementValidationSnapshot {
  return Object.freeze({ ...input, integrity_hash: hashWithoutIntegrity(input) });
}

function buildSnapshots(input: {
  decision: GovernanceDecisionRecord;
  governance: GovernanceDecisionContractValidation;
  policy: GovernancePolicyValidationResult;
  constitutional: ConstitutionalDecisionValidationResult;
  authority: AuthorityApprovalResolverResult;
  tenant: TenantIsolationValidatorResult;
  certification: CertificationReplayValidatorResult;
  integrity: IntegrityLineageVerifierResult;
}): readonly EnforcementValidationSnapshot[] {
  return Object.freeze([
    snapshot({
      validation_ref: `governance_contract_${input.decision.governance_decision_id}`,
      validation_type: "governance",
      validation_result: input.governance.validation_state,
      fail_closed: input.governance.fail_closed,
      evidence_refs: input.decision.evidence_refs,
      replay_refs: input.decision.replay_refs,
      ledger_refs: [],
    }),
    snapshot({
      validation_ref: input.policy.evidence.validation_id,
      validation_type: "governance_policy",
      validation_result: input.policy.evidence.validation_state,
      fail_closed: input.policy.fail_closed,
      evidence_refs: input.policy.policy_rules.flatMap((rule) => [...rule.required_evidence]),
      replay_refs: [input.policy.evidence.replay_ref, ...input.policy.ledger_records.flatMap((record) => [...record.replay_refs])],
      ledger_refs: input.policy.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.constitutional.evidence_report.report_id,
      validation_type: "constitutional",
      validation_result: input.constitutional.evidence_report.validation_result,
      fail_closed: input.constitutional.fail_closed,
      evidence_refs: input.constitutional.evidence_report.evidence_refs,
      replay_refs: [input.constitutional.evidence_report.replay_ref, ...input.constitutional.ledger_records.flatMap((record) => [...record.replay_refs])],
      ledger_refs: input.constitutional.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.authority.evidence_report.report_id,
      validation_type: "authority",
      validation_result: input.authority.evidence_report.authority_outcome,
      fail_closed: input.authority.fail_closed,
      evidence_refs: input.authority.evidence_report.evidence_refs,
      replay_refs: [input.authority.evidence_report.replay_ref, ...input.authority.ledger_records.flatMap((record) => [...record.replay_refs])],
      ledger_refs: input.authority.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.tenant.evidence_report.report_id,
      validation_type: "tenant",
      validation_result: input.tenant.tenant_isolation_status,
      fail_closed: input.tenant.fail_closed,
      evidence_refs: input.tenant.evidence_report.evidence_refs,
      replay_refs: [input.tenant.evidence_report.replay_ref, ...input.tenant.ledger_records.flatMap((record) => [...record.replay_refs])],
      ledger_refs: input.tenant.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.certification.evidence_package.package_id,
      validation_type: "certification",
      validation_result: input.certification.evidence_package.validation_outcome,
      fail_closed: input.certification.fail_closed,
      evidence_refs: input.certification.evidence_package.evidence_refs,
      replay_refs: [input.certification.evidence_package.replay_ref, input.certification.replay_report.report_id],
      ledger_refs: input.certification.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.certification.replay_report.report_id,
      validation_type: "replay",
      validation_result: input.certification.replay_report.reconstruction_status,
      fail_closed: input.certification.fail_closed,
      evidence_refs: input.certification.evidence_package.evidence_refs,
      replay_refs: input.certification.replay_report.replay_references,
      ledger_refs: input.certification.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.integrity.evidence_report.report_id,
      validation_type: "integrity",
      validation_result: input.integrity.validation_outcome,
      fail_closed: input.integrity.fail_closed,
      evidence_refs: input.integrity.evidence_report.evidence_refs,
      replay_refs: [input.integrity.evidence_report.replay_ref],
      ledger_refs: input.integrity.ledger_records.map((record) => record.ledger_id),
    }),
    snapshot({
      validation_ref: input.integrity.verification_record.integrity_verification_id,
      validation_type: "lineage",
      validation_result: input.integrity.validation.checks.lineage_complete ? "COMPLETE" : "INCOMPLETE",
      fail_closed: input.integrity.fail_closed,
      evidence_refs: input.integrity.evidence_report.evidence_refs,
      replay_refs: [input.integrity.verification_record.replay_ref],
      ledger_refs: input.integrity.ledger_records.map((record) => record.ledger_id),
    }),
  ]);
}

function collectApprovals(policy: GovernancePolicyValidationResult, authority: AuthorityApprovalResolverResult): readonly string[] {
  return normalize([
    ...policy.policy_rules.flatMap((rule) => rule.required_approvals),
    ...authority.evidence_report.approval_chain,
    ...authority.authority_assignments.flatMap((assignment) => [...assignment.approval_requirements]),
  ]);
}

function collectEscalations(policy: GovernancePolicyValidationResult, authority: AuthorityApprovalResolverResult, constitutional: ConstitutionalDecisionValidationResult): readonly string[] {
  return normalize([
    ...policy.evidence.escalation_requirements,
    ...authority.evidence_report.escalation_results,
    ...constitutional.evidence_report.constitutional_conflicts.map((conflict) => `constitutional:${conflict}`),
  ]);
}

function collectEvidence(snapshots: readonly EnforcementValidationSnapshot[]): readonly string[] {
  return normalize(snapshots.flatMap((item) => [...item.evidence_refs]));
}

function failClosedConditions(input: {
  governance: GovernanceDecisionContractValidation;
  policy: GovernancePolicyValidationResult;
  constitutional: ConstitutionalDecisionValidationResult;
  authority: AuthorityApprovalResolverResult;
  tenant: TenantIsolationValidatorResult;
  certification: CertificationReplayValidatorResult;
  integrity: IntegrityLineageVerifierResult;
  snapshots: readonly EnforcementValidationSnapshot[];
  existingIds: readonly string[];
  evaluationId: string;
  authorized: boolean;
}): readonly EnforcementBlockingCondition[] {
  const failures: EnforcementBlockingCondition[] = [];
  if (!input.authorized) failures.push("UNAUTHORIZED_FAIL_CLOSED_ENFORCEMENT_ACCESS");
  if (input.existingIds.includes(input.evaluationId)) failures.push("DUPLICATE_ENFORCEMENT_EVALUATION");
  if (input.governance.validation_state !== "VALID") failures.push("GOVERNANCE_VALIDATION_FAILED");
  const policyEvidenceRefs = input.policy.policy_rules.flatMap((rule) => [...rule.required_evidence]);
  if (!input.governance.checks.references_resolved || !input.policy.validation.checks.evidence_complete || policyEvidenceRefs.length === 0) failures.push("GOVERNANCE_EVIDENCE_MISSING");
  if (input.policy.policy_validation_status !== "PASS" || input.policy.evidence.validation_state === "VIOLATION") failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (input.policy.evidence.validation_state === "UNKNOWN") failures.push("UNKNOWN_VALIDATION_STATE");
  if (input.constitutional.constitutional_validation_status !== "PASS" || input.constitutional.evidence_report.validation_result === "VIOLATION") failures.push("CONSTITUTIONAL_VIOLATION");
  if (input.constitutional.evidence_report.evidence_refs.length === 0) failures.push("CONSTITUTIONAL_EVIDENCE_MISSING");
  if (input.constitutional.evidence_report.validation_result === "UNKNOWN") failures.push("UNKNOWN_VALIDATION_STATE");
  if (input.authority.authority_resolution_status !== "PASS" || input.authority.evidence_report.authority_outcome === "UNAUTHORIZED") failures.push("AUTHORITY_UNRESOLVED");
  if (input.authority.evidence_report.authority_outcome === "OPERATOR_REQUIRED" || input.authority.evidence_report.authority_outcome === "GOVERNANCE_REQUIRED" || input.authority.evidence_report.authority_outcome === "CERTIFICATION_REQUIRED") failures.push("AUTHORITY_UNRESOLVED");
  if (input.tenant.tenant_isolation_status !== "PASS" || input.tenant.evidence_report.isolation_result === "VIOLATION" || input.tenant.evidence_report.isolation_result === "UNKNOWN") failures.push("TENANT_VIOLATION");
  if (input.certification.certification_replay_status !== "PASS" || input.certification.evidence_package.validation_outcome === "MISSING") failures.push("CERTIFICATION_MISSING");
  if (input.certification.evidence_package.validation_outcome === "INVALID") failures.push("HASH_MISMATCH");
  if (input.certification.replay_report.reconstruction_status !== "RECONSTRUCTED") failures.push("REPLAY_UNAVAILABLE");
  if (input.certification.failures.includes("REPLAY_DIVERGENCE")) failures.push("REPLAY_DIVERGENCE");
  if (input.integrity.integrity_lineage_status !== "PASS" || input.integrity.validation_outcome === "CORRUPTED") failures.push("INTEGRITY_MISMATCH");
  if (input.integrity.validation_outcome === "UNKNOWN") failures.push("UNKNOWN_VALIDATION_STATE");
  if (!input.integrity.validation.checks.lineage_complete) failures.push("LINEAGE_INCOMPLETE");
  if (input.integrity.failures.includes("HASH_MISMATCH")) failures.push("HASH_MISMATCH");
  if (input.snapshots.some((item) => !item.integrity_hash || hashWithoutIntegrity(item) !== item.integrity_hash)) failures.push("CORRUPTED_VALIDATION_METADATA");
  if (input.snapshots.some((item) => item.replay_refs.length === 0)) failures.push("REPLAY_UNAVAILABLE");
  return Object.freeze([...new Set(failures)] as EnforcementBlockingCondition[]);
}

function chooseOutcome(failures: readonly EnforcementBlockingCondition[], approvals: readonly string[], escalations: readonly string[]): GovernanceEnforcementState {
  if (failures.length > 0) return "FAIL_CLOSED";
  if (escalations.length > 0) return "ESCALATE";
  if (approvals.some((approval) => approval.includes("operator"))) return "ALLOW_WITH_OPERATOR_APPROVAL";
  if (approvals.some((approval) => approval.includes("governance"))) return "ALLOW_WITH_GOVERNANCE_REVIEW";
  return "ALLOW";
}

function validationResult(failures: readonly EnforcementBlockingCondition[]): FailClosedEnforcementValidation {
  const unique = Object.freeze([...new Set(failures)] as EnforcementBlockingCondition[]);
  const has = (failure: EnforcementBlockingCondition) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "FAILED_CLOSED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      governance_complete: !has("GOVERNANCE_EVIDENCE_MISSING") && !has("GOVERNANCE_VALIDATION_FAILED"),
      constitutional_complete: !has("CONSTITUTIONAL_EVIDENCE_MISSING") && !has("CONSTITUTIONAL_VIOLATION"),
      authority_complete: !has("AUTHORITY_UNRESOLVED"),
      tenant_complete: !has("TENANT_VIOLATION"),
      certification_complete: !has("CERTIFICATION_MISSING"),
      replay_complete: !has("REPLAY_UNAVAILABLE") && !has("REPLAY_DIVERGENCE"),
      integrity_complete: !has("INTEGRITY_MISMATCH") && !has("HASH_MISMATCH"),
      lineage_complete: !has("LINEAGE_INCOMPLETE"),
      approvals_valid: !has("INVALID_APPROVAL_REFERENCE"),
      metadata_intact: !has("CORRUPTED_VALIDATION_METADATA") && !has("DUPLICATE_ENFORCEMENT_EVALUATION"),
    }),
  });
}

function evaluationHash(record: Omit<EnforcementEvaluationRecord, "integrity_hash"> | EnforcementEvaluationRecord): string {
  return hashWithoutIntegrity(record);
}

function buildEvaluationRecord(input: {
  decision: GovernanceDecisionRecord;
  governance: GovernanceDecisionContractValidation;
  constitutional: ConstitutionalDecisionValidationResult;
  authority: AuthorityApprovalResolverResult;
  tenant: TenantIsolationValidatorResult;
  certification: CertificationReplayValidatorResult;
  integrity: IntegrityLineageVerifierResult;
  outcome: GovernanceEnforcementState;
  blockers: readonly EnforcementBlockingCondition[];
  approvals: readonly string[];
  escalations: readonly string[];
  evidenceRefs: readonly string[];
}): EnforcementEvaluationRecord {
  const base: Omit<EnforcementEvaluationRecord, "integrity_hash"> = {
    enforcement_evaluation_id: `enforcement_evaluation_${input.decision.governance_decision_id}`,
    governance_decision_id: input.decision.governance_decision_id,
    mission_id: input.decision.mission_id,
    tenant_id: input.decision.tenant_id,
    governance_result: input.governance.validation_state,
    constitutional_result: input.constitutional.evidence_report.validation_result,
    authority_result: input.authority.evidence_report.authority_outcome,
    tenant_result: input.tenant.evidence_report.isolation_result,
    certification_result: input.certification.evidence_package.validation_outcome,
    replay_result: input.certification.replay_report.reconstruction_status,
    integrity_result: input.integrity.validation_outcome,
    lineage_result: input.integrity.validation.checks.lineage_complete ? "COMPLETE" : "INCOMPLETE",
    enforcement_outcome: input.outcome,
    blocking_conditions: input.blockers,
    escalation_requirements: input.escalations,
    approval_requirements: input.approvals,
    evidence_refs: input.evidenceRefs,
    replay_ref: `replay_fail_closed_enforcement_${input.decision.governance_decision_id}`,
    created_at: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: evaluationHash(base) });
}

function reportHash(report: Omit<EnforcementDecisionReport, "integrity_hash"> | EnforcementDecisionReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(record: EnforcementEvaluationRecord, snapshots: readonly EnforcementValidationSnapshot[]): EnforcementDecisionReport {
  const base: Omit<EnforcementDecisionReport, "integrity_hash"> = {
    report_id: `enforcement_decision_report_${record.governance_decision_id}`,
    governance_decision_id: record.governance_decision_id,
    validation_summary: snapshots,
    blocking_conditions: record.blocking_conditions,
    approval_requirements: record.approval_requirements,
    escalation_requirements: record.escalation_requirements,
    enforcement_outcome: record.enforcement_outcome,
    enforcement_rationale: record.blocking_conditions.length > 0
      ? record.blocking_conditions.map((condition) => `fail_closed:${condition}`)
      : [`allow:${record.enforcement_outcome}`],
    evidence_refs: record.evidence_refs,
    replay_ref: record.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function ledgerHash(record: Omit<EnforcementLedgerRecord, "integrity_hash"> | EnforcementLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(record: EnforcementEvaluationRecord, report: EnforcementDecisionReport): readonly EnforcementLedgerRecord[] {
  const base: Omit<EnforcementLedgerRecord, "integrity_hash"> = {
    ledger_id: `enforcement_ledger_${record.governance_decision_id}`,
    governance_decision_id: record.governance_decision_id,
    enforcement_outcome: record.enforcement_outcome,
    validation_results: report.validation_summary.map((item) => `${item.validation_type}:${item.validation_result}`),
    blocking_conditions: record.blocking_conditions,
    approval_requirements: record.approval_requirements,
    escalation_requirements: record.escalation_requirements,
    evidence_refs: report.evidence_refs,
    replay_refs: [report.replay_ref],
    created_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function resultReplayHash(result: Omit<FailClosedEnforcementResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_decision: result.governance_decision,
    governance_validation: result.governance_validation,
    governance_policy_result: result.governance_policy_result,
    constitutional_result: result.constitutional_result,
    authority_result: result.authority_result,
    tenant_result: result.tenant_result,
    certification_replay_result: result.certification_replay_result,
    integrity_lineage_result: result.integrity_lineage_result,
    evaluation_record: result.evaluation_record,
    decision_report: result.decision_report,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

export function evaluateFailClosedEnforcement(input: FailClosedEnforcementInput = {}): FailClosedEnforcementResult {
  const decision = input.governance_decision ?? createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
  const governance_validation = input.governance_validation ?? validateGovernanceDecisionRecord(decision);
  const governance_policy_result = input.governance_policy_result ?? validateGovernancePolicy({ governance_decision: decision });
  const constitutional_result = input.constitutional_result ?? validateConstitutionalDecision({ governance_decision: decision, governance_policy_result });
  const authority_result = input.authority_result ?? resolveAuthorityAndApprovals({ governance_decision: decision, governance_policy_result, constitutional_result });
  const tenant_result = input.tenant_result ?? validateTenantIsolation({ governance_decision: decision, governance_policy_result, constitutional_result, authority_result });
  const certification_replay_result = input.certification_replay_result ?? validateCertificationAndReplay({ governance_decision: decision, governance_policy_result, constitutional_result, authority_result, tenant_result });
  const integrity_lineage_result = input.integrity_lineage_result ?? verifyIntegrityAndImmutableLineage({ governance_decision: decision, certification_replay_result });
  const snapshots = buildSnapshots({
    decision,
    governance: governance_validation,
    policy: governance_policy_result,
    constitutional: constitutional_result,
    authority: authority_result,
    tenant: tenant_result,
    certification: certification_replay_result,
    integrity: integrity_lineage_result,
  });
  const evaluationId = `enforcement_evaluation_${decision.governance_decision_id}`;
  const blockers = failClosedConditions({
    governance: governance_validation,
    policy: governance_policy_result,
    constitutional: constitutional_result,
    authority: authority_result,
    tenant: tenant_result,
    certification: certification_replay_result,
    integrity: integrity_lineage_result,
    snapshots,
    existingIds: input.existing_enforcement_evaluation_ids ?? [],
    evaluationId,
    authorized: !input.authorized_component || input.authorized_component === AUTHORIZED_COMPONENT,
  });
  const approval_requirements = collectApprovals(governance_policy_result, authority_result);
  const escalation_requirements = collectEscalations(governance_policy_result, authority_result, constitutional_result);
  const evidence_refs = collectEvidence(snapshots);
  const outcome = chooseOutcome(blockers, approval_requirements, escalation_requirements);
  const evaluation_record = buildEvaluationRecord({
    decision,
    governance: governance_validation,
    constitutional: constitutional_result,
    authority: authority_result,
    tenant: tenant_result,
    certification: certification_replay_result,
    integrity: integrity_lineage_result,
    outcome,
    blockers,
    approvals: approval_requirements,
    escalations: escalation_requirements,
    evidenceRefs: evidence_refs,
  });
  const decision_report = buildReport(evaluation_record, snapshots);
  const ledger_records = writeLedger(evaluation_record, decision_report);
  const ledgerFailures: readonly EnforcementBlockingCondition[] = ledger_records.every((record) => ledgerHash(record) === record.integrity_hash) ? [] : ["CORRUPTED_VALIDATION_METADATA"];
  const validation = validationResult([...blockers, ...ledgerFailures]);
  const finalOutcome = chooseOutcome(validation.failures, approval_requirements, escalation_requirements);
  const finalRecord = finalOutcome === outcome ? evaluation_record : buildEvaluationRecord({
    decision,
    governance: governance_validation,
    constitutional: constitutional_result,
    authority: authority_result,
    tenant: tenant_result,
    certification: certification_replay_result,
    integrity: integrity_lineage_result,
    outcome: finalOutcome,
    blockers: validation.failures,
    approvals: approval_requirements,
    escalations: escalation_requirements,
    evidenceRefs: evidence_refs,
  });
  const finalReport = finalOutcome === outcome ? decision_report : buildReport(finalRecord, snapshots);
  const finalLedger = finalOutcome === outcome ? ledger_records : writeLedger(finalRecord, finalReport);
  const base: Omit<FailClosedEnforcementResult, "integrity_hash" | "replay_hash"> = {
    enforcement_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    governance_decision: decision,
    governance_validation,
    governance_policy_result,
    constitutional_result,
    authority_result,
    tenant_result,
    certification_replay_result,
    integrity_lineage_result,
    rule_registry: FAIL_CLOSED_RULE_REGISTRY,
    evaluation_record: finalRecord,
    decision_report: finalReport,
    ledger_records: finalLedger,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) {
    const replayValidation = validationResult(["REPLAY_DIVERGENCE"]);
    const replayRecord = buildEvaluationRecord({
      decision,
      governance: governance_validation,
      constitutional: constitutional_result,
      authority: authority_result,
      tenant: tenant_result,
      certification: certification_replay_result,
      integrity: integrity_lineage_result,
      outcome: "FAIL_CLOSED",
      blockers: replayValidation.failures,
      approvals: approval_requirements,
      escalations: escalation_requirements,
      evidenceRefs: evidence_refs,
    });
    const replayReport = buildReport(replayRecord, snapshots);
    const replayBase: Omit<FailClosedEnforcementResult, "integrity_hash" | "replay_hash"> = {
      ...base,
      enforcement_status: "FAIL",
      fail_closed: true,
      evaluation_record: replayRecord,
      decision_report: replayReport,
      ledger_records: Object.freeze([]),
      validation: replayValidation,
      failures: replayValidation.failures,
    };
    const mismatchHash = resultReplayHash(replayBase);
    return Object.freeze({ ...replayBase, replay_hash: mismatchHash, integrity_hash: hashWithoutIntegrity({ ...replayBase, replay_hash: mismatchHash }) });
  }
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayFailClosedEnforcement(result: FailClosedEnforcementResult): FailClosedEnforcementReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.decision_report.validation_summary.every((item) => hashWithoutIntegrity(item) === item.integrity_hash)
    && evaluationHash(result.evaluation_record) === result.evaluation_record.integrity_hash
    && reportHash(result.decision_report) === result.decision_report.integrity_hash
    && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: EnforcementBlockingCondition[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<FailClosedEnforcementReplay, "integrity_hash"> = {
    replay_id: "replay_fail_closed_enforcement_engine",
    replay_valid,
    governance_decision_id: result.governance_decision.governance_decision_id,
    enforcement_outcome: result.evaluation_record.enforcement_outcome,
    blocking_conditions: result.evaluation_record.blocking_conditions,
    approval_requirements: result.evaluation_record.approval_requirements,
    escalation_requirements: result.evaluation_record.escalation_requirements,
    report_ref: result.decision_report.report_id,
    ledger_refs: result.ledger_records.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildFailClosedEnforcementObservability(result: FailClosedEnforcementResult): FailClosedEnforcementObservability {
  return Object.freeze({
    enforcement_evaluation_events: 1,
    fail_closed_events: result.evaluation_record.enforcement_outcome === "FAIL_CLOSED" ? 1 : 0,
    blocking_condition_events: result.evaluation_record.blocking_conditions.length,
    approval_requirement_events: result.evaluation_record.approval_requirements.length,
    escalation_events: result.evaluation_record.escalation_requirements.length,
    enforcement_outcome_events: 1,
    replay_verification_events: replayFailClosedEnforcement(result).replay_valid ? 1 : 0,
    ledger_append_events: result.ledger_records.length,
  });
}

export function getFailClosedEnforcementFoundation(): FailClosedEnforcementFoundation {
  const result = evaluateFailClosedEnforcement();
  const replay = replayFailClosedEnforcement(result);
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    enforcement_outcomes: GOVERNANCE_ENFORCEMENT_STATES,
    rule_registry: FAIL_CLOSED_RULE_REGISTRY,
    result,
    replay,
    observability: buildFailClosedEnforcementObservability(result),
  });
}

export const FailClosedEnforcementEngine = Object.freeze({
  evaluate: evaluateFailClosedEnforcement,
  replay: replayFailClosedEnforcement,
});
