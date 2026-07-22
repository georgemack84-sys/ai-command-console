import { validateConstitutionalDecision } from "@/services/constitutional-decision-validator";
import { createGovernanceDecisionRecord, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { validateGovernancePolicy } from "@/services/governance-policy-validation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { ConstitutionalDecisionValidationResult } from "@/types/constitutional-decision-validator";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";
import type {
  ApprovalChainEntry,
  AuthorityApprovalFailureReason,
  AuthorityApprovalResolverFoundation,
  AuthorityApprovalResolverInput,
  AuthorityApprovalResolverObservability,
  AuthorityApprovalResolverReplay,
  AuthorityApprovalResolverResult,
  AuthorityApprovalValidation,
  AuthorityAssignment,
  AuthorityDecisionLedgerRecord,
  AuthorityEvaluation,
  AuthorityEvidenceReport,
  AuthorityOutcome,
  AuthorityScope,
  AuthorityType,
  DelegationLevel,
} from "@/types/authority-approval-requirement-resolver";

const RESOLVER_VERSION = "authority-approval-requirement-resolver/v1" as const;
const AUTHORIZED_COMPONENT = "authority-approval-requirement-resolver";
const NOW = "2026-07-04T00:26:00.000Z";

export const AUTHORITY_TYPES: readonly AuthorityType[] = Object.freeze([
  "Operator Authority",
  "Governance Authority",
  "Certification Authority",
  "Mission Authority",
  "Delegated Authority",
  "Emergency Governance Authority",
  "Observation Authority",
  "Recommendation Authority",
  "Simulation Authority",
  "Recovery Authority",
]);
export const AUTHORITY_OUTCOMES: readonly AuthorityOutcome[] = Object.freeze(["AUTHORIZED", "OPERATOR_REQUIRED", "GOVERNANCE_REQUIRED", "CERTIFICATION_REQUIRED", "UNAUTHORIZED"]);
export const AUTHORITY_SCOPES: readonly AuthorityScope[] = Object.freeze(["ADVISORY", "MISSION", "GOVERNANCE", "CERTIFICATION", "OPERATOR", "SIMULATION", "RECOVERY"]);
export const DELEGATION_LEVELS: readonly DelegationLevel[] = Object.freeze(["NONE", "LIMITED", "BOUNDED", "EMERGENCY"]);

const AUTHORITY_PRECEDENCE: Readonly<Record<AuthorityType, number>> = Object.freeze({
  "Emergency Governance Authority": 1,
  "Governance Authority": 2,
  "Certification Authority": 3,
  "Mission Authority": 4,
  "Delegated Authority": 5,
  "Operator Authority": 6,
  "Observation Authority": 7,
  "Recommendation Authority": 7,
  "Simulation Authority": 7,
  "Recovery Authority": 7,
});

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

export function computeAuthorityAssignmentHash(assignment: Omit<AuthorityAssignment, "integrity_hash"> | AuthorityAssignment): string {
  return hashWithoutIntegrity(assignment);
}

function assignment(input: Omit<AuthorityAssignment, "integrity_hash">): AuthorityAssignment {
  return Object.freeze({ ...input, integrity_hash: computeAuthorityAssignmentHash(input) });
}

export function createAuthorityAssignments(decision: GovernanceDecisionRecord = createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" })): readonly AuthorityAssignment[] {
  return Object.freeze([
    assignment({
      authority_assignment_id: "authority_governance_review",
      authority_type: "Governance Authority",
      authority_scope: "GOVERNANCE",
      authority_holder: "governance_board",
      tenant_id: decision.tenant_id,
      mission_id: decision.mission_id,
      delegation_source: "constitutional_authority_registry",
      delegation_level: "NONE",
      delegated_by: "constitution",
      approval_requirements: ["approval_regulatory_governance"],
      certification_requirements: [],
      escalation_requirements: ["governance_escalation"],
      effective_date: "2026-01-01T00:00:00.000Z",
      revoked: false,
      replay_ref: "replay_authority_governance_review",
    }),
    assignment({
      authority_assignment_id: "authority_mission_review",
      authority_type: "Mission Authority",
      authority_scope: "MISSION",
      authority_holder: "mission_owner",
      tenant_id: decision.tenant_id,
      mission_id: decision.mission_id,
      delegation_source: "mission_authority_registry",
      delegation_level: "NONE",
      delegated_by: "mission_governance",
      approval_requirements: ["approval_mission_owner"],
      certification_requirements: [],
      escalation_requirements: ["mission_authority_escalation"],
      effective_date: "2026-01-01T00:00:00.000Z",
      revoked: false,
      replay_ref: "replay_authority_mission_review",
    }),
    assignment({
      authority_assignment_id: "authority_recommendation_advisory",
      authority_type: "Recommendation Authority",
      authority_scope: "ADVISORY",
      authority_holder: "decision_orchestrator",
      tenant_id: decision.tenant_id,
      mission_id: decision.mission_id,
      delegation_source: "constitutional_advisory_authority",
      delegation_level: "LIMITED",
      delegated_by: "governance_board",
      approval_requirements: [],
      certification_requirements: [],
      escalation_requirements: [],
      effective_date: "2026-01-01T00:00:00.000Z",
      revoked: false,
      replay_ref: "replay_authority_recommendation_advisory",
    }),
    assignment({
      authority_assignment_id: "authority_certification_reference",
      authority_type: "Certification Authority",
      authority_scope: "CERTIFICATION",
      authority_holder: "certification_service",
      tenant_id: decision.tenant_id,
      mission_id: decision.mission_id,
      delegation_source: "certification_authority_registry",
      delegation_level: "NONE",
      delegated_by: "governance_board",
      approval_requirements: ["approval_certification_service"],
      certification_requirements: ["certification_phase_9_6_pass"],
      escalation_requirements: ["certification_escalation"],
      effective_date: "2026-01-01T00:00:00.000Z",
      revoked: false,
      replay_ref: "replay_authority_certification_reference",
    }),
  ]);
}

function approvalHash(entry: Omit<ApprovalChainEntry, "integrity_hash"> | ApprovalChainEntry): string {
  return hashWithoutIntegrity(entry);
}

function approval(input: Omit<ApprovalChainEntry, "integrity_hash">): ApprovalChainEntry {
  return Object.freeze({ ...input, integrity_hash: approvalHash(input) });
}

export function createApprovalChain(assignments: readonly AuthorityAssignment[] = createAuthorityAssignments()): readonly ApprovalChainEntry[] {
  const required = normalize(assignments.flatMap((item) => [...item.approval_requirements, ...item.certification_requirements]));
  return Object.freeze(required.map((approvalId, index) => {
    const source = assignments.find((item) => item.approval_requirements.includes(approvalId) || item.certification_requirements.includes(approvalId));
    return approval({
      approval_id: approvalId,
      approval_type: approvalId.includes("certification") ? "certification" : approvalId.includes("mission") ? "mission" : approvalId.includes("regulatory") ? "governance" : "delegated",
      approver_ref: approvalId.includes("mission") ? "mission_owner" : approvalId.includes("certification") ? "certification_service" : "governance_board",
      source_authority_ref: source?.authority_assignment_id ?? "unknown_authority",
      approval_order: index + 1,
      approved: true,
      replay_ref: `replay_${approvalId}`,
    });
  }));
}

function orderedAssignments(assignments: readonly AuthorityAssignment[]): readonly AuthorityAssignment[] {
  return Object.freeze([...assignments].sort((a, b) => (
    AUTHORITY_PRECEDENCE[a.authority_type] - AUTHORITY_PRECEDENCE[b.authority_type]
    || a.authority_assignment_id.localeCompare(b.authority_assignment_id)
  )));
}

function validateAssignments(assignments: readonly AuthorityAssignment[], decision: GovernanceDecisionRecord): readonly AuthorityApprovalFailureReason[] {
  const failures: AuthorityApprovalFailureReason[] = [];
  if (assignments.length === 0) failures.push("MISSING_AUTHORITY_ASSIGNMENTS");
  const ids = assignments.map((item) => item.authority_assignment_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_AUTHORITY_IDENTIFIER");
  const ordered = orderedAssignments(assignments);
  for (let index = 0; index < assignments.length; index += 1) {
    const item = assignments[index];
    if (item.authority_assignment_id !== ordered[index]?.authority_assignment_id) failures.push("UNAUTHORIZED_PRIVILEGE_ESCALATION");
    if (!AUTHORITY_TYPES.includes(item.authority_type) || !AUTHORITY_SCOPES.includes(item.authority_scope) || !DELEGATION_LEVELS.includes(item.delegation_level)) failures.push("INVALID_AUTHORITY_SCOPE");
    if (item.authority_scope === "OPERATOR" && item.authority_type !== "Operator Authority") failures.push("INVALID_AUTHORITY_SCOPE");
    if (item.tenant_id !== decision.tenant_id || item.mission_id !== decision.mission_id) failures.push("INVALID_AUTHORITY_SCOPE");
    if (item.effective_date > NOW || (item.expiration_date && item.expiration_date <= NOW)) failures.push("EXPIRED_AUTHORITY");
    if (item.revoked) failures.push("REVOKED_AUTHORITY");
    if (!item.replay_ref || !item.delegation_source) failures.push("UNRESOLVED_AUTHORITY_REFERENCE");
    if (item.delegation_level !== "NONE" && (!item.delegated_by || item.delegated_by === item.authority_holder)) failures.push("INVALID_DELEGATION");
    if (computeAuthorityAssignmentHash(item) !== item.integrity_hash) failures.push("AUTHORITY_INTEGRITY_MISMATCH");
  }
  return Object.freeze([...new Set(failures)] as AuthorityApprovalFailureReason[]);
}

function circularApproval(chain: readonly ApprovalChainEntry[]): boolean {
  return chain.some((entry) => entry.approver_ref === entry.source_authority_ref)
    || chain.some((entry) => chain.some((other) => (
      entry.approver_ref === other.source_authority_ref
      && entry.source_authority_ref === other.approver_ref
      && entry.approval_id !== other.approval_id
    )));
}

function evaluationHash(evaluation: Omit<AuthorityEvaluation, "integrity_hash"> | AuthorityEvaluation): string {
  return hashWithoutIntegrity(evaluation);
}

export function evaluateAuthorityAssignment(input: {
  assignment: AuthorityAssignment;
  decision: GovernanceDecisionRecord;
  approval_chain: readonly ApprovalChainEntry[];
}): AuthorityEvaluation {
  const scope_valid = input.assignment.tenant_id === input.decision.tenant_id
    && input.assignment.mission_id === input.decision.mission_id
    && input.assignment.authority_scope !== "OPERATOR";
  const mission_valid = input.assignment.mission_id === input.decision.mission_id;
  const tenant_valid = input.assignment.tenant_id === input.decision.tenant_id;
  const active = input.assignment.effective_date <= NOW && !input.assignment.revoked && (!input.assignment.expiration_date || input.assignment.expiration_date > NOW);
  const delegation_valid = input.assignment.delegation_level === "NONE" || (input.assignment.delegated_by.length > 0 && input.assignment.delegated_by !== input.assignment.authority_holder);
  const requiredApprovals = [...input.assignment.approval_requirements, ...input.assignment.certification_requirements];
  const approvals_complete = requiredApprovals.every((approvalId) => input.approval_chain.some((entry) => entry.approval_id === approvalId && entry.approved && entry.source_authority_ref === input.assignment.authority_assignment_id));
  const authority_result: AuthorityEvaluation["authority_result"] = !scope_valid || !mission_valid || !tenant_valid || !active || !delegation_valid
    ? "REJECTED"
    : approvals_complete
      ? "VALID"
      : "CONDITIONAL";
  const escalation_required = authority_result !== "VALID";
  const base: Omit<AuthorityEvaluation, "integrity_hash"> = {
    evaluation_id: `authority_evaluation_${input.decision.governance_decision_id}_${input.assignment.authority_assignment_id}`,
    authority_assignment_id: input.assignment.authority_assignment_id,
    authority_result,
    scope_valid,
    mission_valid,
    tenant_valid,
    active,
    delegation_valid,
    approvals_complete,
    escalation_required,
    rationale: `Authority ${input.assignment.authority_assignment_id} resolved as ${authority_result}; scope=${scope_valid}; active=${active}; approvals=${approvals_complete}.`,
    replay_ref: `${input.assignment.replay_ref}_evaluation`,
  };
  return Object.freeze({ ...base, integrity_hash: evaluationHash(base) });
}

function outcomeFor(evaluations: readonly AuthorityEvaluation[], assignments: readonly AuthorityAssignment[]): AuthorityOutcome {
  if (evaluations.some((item) => item.authority_result === "REJECTED")) return "UNAUTHORIZED";
  const missing = assignments.filter((assignment) => {
    const evaluation = evaluations.find((item) => item.authority_assignment_id === assignment.authority_assignment_id);
    return evaluation?.authority_result === "CONDITIONAL";
  });
  if (missing.some((item) => item.authority_type === "Certification Authority" || item.certification_requirements.length > 0)) return "CERTIFICATION_REQUIRED";
  if (missing.some((item) => item.authority_type === "Governance Authority")) return "GOVERNANCE_REQUIRED";
  if (missing.some((item) => item.authority_type === "Operator Authority")) return "OPERATOR_REQUIRED";
  return missing.length > 0 ? "GOVERNANCE_REQUIRED" : "AUTHORIZED";
}

function reportHash(report: Omit<AuthorityEvidenceReport, "integrity_hash"> | AuthorityEvidenceReport): string {
  return hashWithoutIntegrity(report);
}

function buildReport(decision: GovernanceDecisionRecord, assignments: readonly AuthorityAssignment[], chain: readonly ApprovalChainEntry[], evaluations: readonly AuthorityEvaluation[]): AuthorityEvidenceReport {
  const escalation_results = normalize(assignments.filter((assignment) => evaluations.some((evaluation) => evaluation.authority_assignment_id === assignment.authority_assignment_id && evaluation.escalation_required)).flatMap((assignment) => [...assignment.escalation_requirements]));
  const authority_outcome = outcomeFor(evaluations, assignments);
  const base: Omit<AuthorityEvidenceReport, "integrity_hash"> = {
    report_id: `authority_evidence_${decision.governance_decision_id}`,
    governance_decision_id: decision.governance_decision_id,
    authority_assignments: assignments.map((assignment) => assignment.authority_assignment_id),
    authority_results: evaluations.map((evaluation) => `${evaluation.authority_assignment_id}:${evaluation.authority_result}`),
    mission_authority: evaluations.every((evaluation) => evaluation.mission_valid) ? "VALID" : "REJECTED",
    delegation_results: evaluations.map((evaluation) => `${evaluation.authority_assignment_id}:${evaluation.delegation_valid ? "VALID" : "REJECTED"}`),
    approval_chain: chain.map((entry) => `${entry.approval_order}:${entry.approval_id}:${entry.approved ? "APPROVED" : "REJECTED"}`),
    escalation_results,
    authority_outcome,
    evidence_refs: decision.evidence_refs,
    replay_ref: `replay_authority_evidence_${decision.governance_decision_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function ledgerHash(record: Omit<AuthorityDecisionLedgerRecord, "integrity_hash"> | AuthorityDecisionLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(report: AuthorityEvidenceReport, chain: readonly ApprovalChainEntry[], evaluations: readonly AuthorityEvaluation[]): readonly AuthorityDecisionLedgerRecord[] {
  const base: Omit<AuthorityDecisionLedgerRecord, "integrity_hash"> = {
    ledger_id: `authority_decision_ledger_${report.report_id}`,
    governance_decision_id: report.governance_decision_id,
    authority_assignment_ids: report.authority_assignments,
    approval_results: report.approval_chain,
    delegation_results: report.delegation_results,
    escalation_results: report.escalation_results,
    authority_outcome: report.authority_outcome,
    evidence_refs: report.evidence_refs,
    replay_refs: [report.replay_ref, ...chain.map((entry) => entry.replay_ref), ...evaluations.map((evaluation) => evaluation.replay_ref)],
    created_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function validationResult(failures: readonly AuthorityApprovalFailureReason[]): AuthorityApprovalValidation {
  const unique = Object.freeze([...new Set(failures)] as AuthorityApprovalFailureReason[]);
  const has = (failure: AuthorityApprovalFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.some((failure) => failure !== "MISSING_APPROVALS" && failure !== "AUTHORITY_ESCALATION_REQUIRED"),
    failures: unique,
    checks: Object.freeze({
      contract_valid: !has("GOVERNANCE_CONTRACT_INVALID"),
      constitutional_authority_valid: !has("CONSTITUTIONAL_AUTHORITY_INVALID"),
      authority_present: !has("MISSING_AUTHORITY_ASSIGNMENTS"),
      scope_valid: !has("INVALID_AUTHORITY_SCOPE"),
      authority_active: !has("EXPIRED_AUTHORITY") && !has("REVOKED_AUTHORITY"),
      delegation_valid: !has("INVALID_DELEGATION") && !has("UNAUTHORIZED_PRIVILEGE_ESCALATION"),
      approvals_complete: !has("MISSING_APPROVALS"),
      escalation_resolved: !has("AUTHORITY_ESCALATION_REQUIRED"),
      replay_valid: !has("REPLAY_DIVERGENCE"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

function resultReplayHash(result: Omit<AuthorityApprovalResolverResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_decision: result.governance_decision,
    governance_policy_result: result.governance_policy_result,
    constitutional_result: result.constitutional_result,
    authority_assignments: result.authority_assignments,
    approval_chain: result.approval_chain,
    evaluations: result.evaluations,
    evidence_report: result.evidence_report,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(decision: GovernanceDecisionRecord, failures: readonly AuthorityApprovalFailureReason[], assignments: readonly AuthorityAssignment[] = [], chain: readonly ApprovalChainEntry[] = [], policy?: GovernancePolicyValidationResult, constitutional?: ConstitutionalDecisionValidationResult): AuthorityApprovalResolverResult {
  const validation = validationResult(failures);
  const report = buildReport(decision, assignments, chain, []);
  const base: Omit<AuthorityApprovalResolverResult, "integrity_hash" | "replay_hash"> = {
    authority_resolution_status: "FAIL",
    fail_closed: true,
    governance_decision: decision,
    governance_policy_result: policy,
    constitutional_result: constitutional,
    authority_assignments: assignments,
    approval_chain: chain,
    evaluations: Object.freeze([]),
    evidence_report: report,
    ledger_records: Object.freeze([]),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function resolveAuthorityAndApprovals(input: AuthorityApprovalResolverInput = {}): AuthorityApprovalResolverResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(input.governance_decision ?? createGovernanceDecisionRecord(), ["UNAUTHORIZED_AUTHORITY_RESOLVER_ACCESS"]);
  const decision = input.governance_decision ?? createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
  const policy = input.governance_policy_result ?? validateGovernancePolicy({ governance_decision: decision });
  const constitutional = input.constitutional_result ?? validateConstitutionalDecision({ governance_decision: decision, governance_policy_result: policy });
  const contractValidation = validateGovernanceDecisionRecord(decision);
  const assignments = orderedAssignments(input.authority_assignments ?? createAuthorityAssignments(decision));
  const chain = Object.freeze([...(input.approval_chain ?? createApprovalChain(assignments))].sort((a, b) => a.approval_order - b.approval_order || a.approval_id.localeCompare(b.approval_id)));
  const assignmentFailures = validateAssignments(assignments, decision);
  if (contractValidation.validation_state !== "VALID") return failResult(decision, ["GOVERNANCE_CONTRACT_INVALID"], assignments, chain, policy, constitutional);
  if (constitutional.constitutional_validation_status !== "PASS") return failResult(decision, ["CONSTITUTIONAL_AUTHORITY_INVALID"], assignments, chain, policy, constitutional);
  if (assignmentFailures.length > 0) return failResult(decision, assignmentFailures, assignments, chain, policy, constitutional);
  const required = normalize(input.required_authority_types ?? ["Governance Authority", "Mission Authority", "Recommendation Authority"]);
  const missingRequired = required.filter((type) => !assignments.some((assignment) => assignment.authority_type === type));
  if (missingRequired.length > 0) return failResult(decision, ["MISSING_AUTHORITY_ASSIGNMENTS"], assignments, chain, policy, constitutional);
  const failures: AuthorityApprovalFailureReason[] = [];
  if (chain.some((entry) => approvalHash(entry) !== entry.integrity_hash)) failures.push("AUTHORITY_INTEGRITY_MISMATCH");
  if (circularApproval(chain)) failures.push("CIRCULAR_APPROVAL_CHAIN");
  if (chain.some((entry) => !assignments.some((assignment) => assignment.authority_assignment_id === entry.source_authority_ref))) failures.push("UNRESOLVED_AUTHORITY_REFERENCE");
  const evaluations = Object.freeze(assignments.map((item) => evaluateAuthorityAssignment({ assignment: item, decision, approval_chain: chain })));
  const report = buildReport(decision, assignments, chain, evaluations);
  const ledger_records = writeLedger(report, chain, evaluations);
  if (evaluations.some((evaluation) => evaluation.authority_result === "CONDITIONAL")) failures.push("MISSING_APPROVALS", "AUTHORITY_ESCALATION_REQUIRED");
  if (evaluations.some((evaluation) => evaluation.authority_result === "REJECTED")) failures.push("INVALID_AUTHORITY_SCOPE");
  if (evaluations.some((evaluation) => evaluationHash(evaluation) !== evaluation.integrity_hash) || reportHash(report) !== report.integrity_hash) failures.push("AUTHORITY_INTEGRITY_MISMATCH");
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) failures.push("AUTHORITY_LEDGER_FAILED");
  if (!policy.advisory_only || !constitutional.advisory_only) failures.push("ADVISORY_ONLY_VIOLATION");
  const validation = validationResult(failures);
  const base: Omit<AuthorityApprovalResolverResult, "integrity_hash" | "replay_hash"> = {
    authority_resolution_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    governance_decision: decision,
    governance_policy_result: policy,
    constitutional_result: constitutional,
    authority_assignments: assignments,
    approval_chain: chain,
    evaluations,
    evidence_report: report,
    ledger_records,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(decision, ["REPLAY_DIVERGENCE"], assignments, chain, policy, constitutional);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAuthorityApprovalResolution(result: AuthorityApprovalResolverResult): AuthorityApprovalResolverReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.authority_assignments.every((item) => computeAuthorityAssignmentHash(item) === item.integrity_hash)
    && result.approval_chain.every((entry) => approvalHash(entry) === entry.integrity_hash)
    && result.evaluations.every((evaluation) => evaluationHash(evaluation) === evaluation.integrity_hash)
    && reportHash(result.evidence_report) === result.evidence_report.integrity_hash
    && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: AuthorityApprovalFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<AuthorityApprovalResolverReplay, "integrity_hash"> = {
    replay_id: "replay_authority_approval_requirement_resolver",
    replay_valid,
    governance_decision_id: result.governance_decision.governance_decision_id,
    authority_assignment_refs: result.authority_assignments.map((item) => item.authority_assignment_id),
    approval_refs: result.approval_chain.map((entry) => entry.approval_id),
    evidence_report_ref: result.evidence_report.report_id,
    ledger_refs: result.ledger_records.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildAuthorityApprovalResolverObservability(result: AuthorityApprovalResolverResult): AuthorityApprovalResolverObservability {
  return Object.freeze({
    authority_validation_events: result.evaluations.length,
    approval_resolution_events: result.approval_chain.length,
    delegation_validation_events: result.evaluations.filter((evaluation) => evaluation.delegation_valid).length,
    escalation_events: result.evidence_report.escalation_results.length,
    approval_chain_events: result.approval_chain.length,
    authority_outcome_events: 1,
    replay_verification_events: replayAuthorityApprovalResolution(result).replay_valid ? 1 : 0,
    ledger_append_events: result.ledger_records.length,
  });
}

export function getAuthorityApprovalResolverFoundation(): AuthorityApprovalResolverFoundation {
  const result = resolveAuthorityAndApprovals();
  const replay = replayAuthorityApprovalResolution(result);
  return Object.freeze({
    resolver_version: RESOLVER_VERSION,
    authority_types: AUTHORITY_TYPES,
    authority_outcomes: AUTHORITY_OUTCOMES,
    authority_scopes: AUTHORITY_SCOPES,
    delegation_levels: DELEGATION_LEVELS,
    result,
    replay,
    observability: buildAuthorityApprovalResolverObservability(result),
  });
}

export const AuthorityApprovalRequirementResolver = Object.freeze({
  assignments: createAuthorityAssignments,
  approvals: createApprovalChain,
  evaluate: evaluateAuthorityAssignment,
  resolve: resolveAuthorityAndApprovals,
  replay: replayAuthorityApprovalResolution,
});
