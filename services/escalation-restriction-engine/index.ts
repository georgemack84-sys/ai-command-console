import { detectAdaptivePolicyConflicts } from "@/services/adaptive-policy-conflict-detector";
import { validateAuthorityBoundary } from "@/services/authority-boundary-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validateEvidenceCertification } from "@/services/evidence-certification-validator";
import { appendGovernanceAdaptationLedger } from "@/services/governance-adaptation-ledger";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateTenantIsolation } from "@/services/tenant-isolation-validator";
import type {
  EscalationCategory,
  EscalationRestriction,
  EscalationRestrictionApiSurface,
  EscalationRestrictionDecision,
  EscalationRestrictionDecisionState,
  EscalationRestrictionEngineFoundation,
  EscalationRestrictionEngineInput,
  EscalationRestrictionEngineResult,
  EscalationRestrictionFailure,
  EscalationRestrictionLedgerEntry,
  EscalationTrigger,
  ReviewerAssignment,
  ReviewWorkflowStep,
  ValidationContextSummary,
} from "@/types/escalation-restriction-engine";

const ENGINE_VERSION = "escalation-restriction-engine/v1" as const;
const DECISION_TIMESTAMP = "2026-07-10T00:00:00.000Z";
type Scenario = NonNullable<EscalationRestrictionEngineInput["scenario"]>;

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

function buildApiSurface(): EscalationRestrictionApiSurface {
  const base: Omit<EscalationRestrictionApiSurface, "integrity_hash"> = {
    api_id: "escalation_restriction_engine_api",
    determine_escalation: "POST /escalation-restriction-engine/determine",
    retrieve_context: "POST /escalation-restriction-engine/context",
    retrieve_triggers: "POST /escalation-restriction-engine/triggers",
    retrieve_restrictions: "POST /escalation-restriction-engine/restrictions",
    retrieve_workflow: "POST /escalation-restriction-engine/workflow",
    retrieve_reviewers: "POST /escalation-restriction-engine/reviewers",
    retrieve_enforcement: "POST /escalation-restriction-engine/enforcement",
    retrieve_ledger: "POST /escalation-restriction-engine/ledger",
    replay_decision: "POST /escalation-restriction-engine/replay",
    retrieve_contract: "GET /escalation-restriction-engine/contract",
    execution_authorization_supported: false,
    governance_override_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureFor(scenario: Scenario): EscalationRestrictionFailure | undefined {
  const map: Partial<Record<Scenario, EscalationRestrictionFailure>> = {
    RULE_EVALUATION_FAILURE: "ESCALATION_RULES_UNEVALUABLE",
    AUTHORITY_UNDETERMINED: "REVIEW_AUTHORITY_UNDETERMINED",
    AMBIGUOUS_REVIEWERS: "MANDATORY_REVIEWER_ASSIGNMENT_AMBIGUOUS",
    UNRESOLVED_CONSTITUTIONAL_IMPACT: "CONSTITUTIONAL_IMPACT_UNRESOLVED",
    GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL: "GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION_DETECTED",
    AUTHORITY_EXPANSION_ATTEMPT: "AUTHORITY_EXPANSION_DETECTED",
    UNRESOLVED_POLICY_CONFLICTS: "POLICY_CONFLICTS_UNRESOLVED",
    POLICY_CONTRADICTION: "POLICY_CONFLICTS_UNRESOLVED",
    AUDIT_DEGRADATION: "AUDIT_DEGRADATION_UNMITIGATED",
    REPLAY_DEGRADATION: "REPLAY_DEGRADATION_UNRESOLVED",
    TENANT_RISK: "TENANT_ISOLATION_RISK_UNRESOLVED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_RISK_UNRESOLVED",
    OPERATOR_VISIBILITY_REDUCTION: "OPERATOR_VISIBILITY_REDUCED",
    RESTRICTION_ENFORCEMENT_FAILURE: "RESTRICTION_ENFORCEMENT_FAILED",
    NONDETERMINISTIC_WORKFLOW: "REVIEW_WORKFLOW_NONDETERMINISTIC",
    NONDETERMINISTIC_REASONING: "NONDETERMINISTIC_VALIDATION_REASONING",
    NONDETERMINISTIC: "NONDETERMINISTIC_VALIDATION_REASONING",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    RECORDING_FAILURE: "ESCALATION_DECISION_RECORDING_FAILED",
  };
  return map[scenario];
}

function buildContext(input: EscalationRestrictionEngineInput): ValidationContextSummary {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const authority = input.authority_result ?? validateAuthorityBoundary({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional });
  const tenant = input.tenant_result ?? validateTenantIsolation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority });
  const conflict = input.conflict_result ?? detectAdaptivePolicyConflicts({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant });
  const ledger = input.ledger_result ?? appendGovernanceAdaptationLedger({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict });
  const evidence = input.evidence_result ?? validateEvidenceCertification({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance, constitutional_result: constitutional, authority_result: authority, tenant_result: tenant, conflict_result: conflict, ledger_result: ledger });
  const complete = !governance.fail_closed && !constitutional.fail_closed && !authority.fail_closed && !tenant.fail_closed && !conflict.fail_closed && !ledger.fail_closed && !evidence.fail_closed;
  const base: Omit<ValidationContextSummary, "integrity_hash"> = {
    context_id: `escalation_context_${hash(adaptation.contract.adaptation_id).slice(0, 14)}`,
    governance_status: governance.validation.governance_status,
    constitutional_status: constitutional.validation.constitutional_status,
    authority_status: authority.validation.authority_status,
    tenant_status: tenant.validation.isolation_status,
    policy_conflict_status: conflict.analysis.conflict_status,
    evidence_certification_status: evidence.validation_state,
    replay_ready: ledger.replayable && evidence.replayable,
    audit_ready: ledger.audit_ready && evidence.audit_ready,
    dependency_graph: freezeArray([governance.integrity_hash, constitutional.integrity_hash, authority.integrity_hash, tenant.integrity_hash, conflict.integrity_hash, ledger.integrity_hash, evidence.integrity_hash]),
    complete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function trigger(category: EscalationCategory, severity: EscalationTrigger["severity"], rationale: string, refs: readonly string[]): EscalationTrigger {
  const base: Omit<EscalationTrigger, "integrity_hash"> = {
    trigger_id: `escalation_trigger_${hash(`${category}:${rationale}`).slice(0, 14)}`,
    category,
    severity,
    mandatory: severity === "HIGH" || severity === "CRITICAL",
    rationale,
    evidence_refs: refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildTriggers(scenario: Scenario, context: ValidationContextSummary, failures: readonly EscalationRestrictionFailure[]): readonly EscalationTrigger[] {
  const refs = context.dependency_graph;
  const triggers: EscalationTrigger[] = [];
  if (scenario === "OPERATOR_REVIEW_REQUIRED" || scenario === "OPERATOR_VISIBILITY_REDUCTION") triggers.push(trigger("OPERATOR", "HIGH", "Operator review is required before progression.", refs));
  if (scenario === "GOVERNANCE_REVIEW_REQUIRED" || scenario === "GOVERNANCE_MODIFICATION_WITHOUT_APPROVAL") triggers.push(trigger("GOVERNANCE", "CRITICAL", "Governance modification requires governed approval.", refs));
  if (scenario === "CONSTITUTIONAL_REVIEW_REQUIRED" || scenario === "UNRESOLVED_CONSTITUTIONAL_IMPACT") triggers.push(trigger("CONSTITUTIONAL", "CRITICAL", "Constitutional impact requires constitutional review.", refs));
  if (scenario === "MULTI_LEVEL_REVIEW_REQUIRED") {
    triggers.push(trigger("GOVERNANCE", "HIGH", "Governance review required in multi-level workflow.", refs));
    triggers.push(trigger("CONSTITUTIONAL", "CRITICAL", "Constitutional review required in multi-level workflow.", refs));
    triggers.push(trigger("RISK", "HIGH", "Risk authority review required in multi-level workflow.", refs));
  }
  if (scenario === "AUTHORITY_EXPANSION") triggers.push(trigger("AUTHORITY", "CRITICAL", "Authority expansion must be escalated.", refs));
  if (scenario === "UNRESOLVED_POLICY_CONFLICTS" || scenario === "POLICY_CONTRADICTION") triggers.push(trigger("COMPLIANCE", "HIGH", "Policy conflict remains unresolved.", refs));
  if (scenario === "TENANT_RISK" || scenario === "TENANT_ISOLATION_FAILURE") triggers.push(trigger("TENANT_ISOLATION", "CRITICAL", "Tenant isolation risk remains unresolved.", refs));
  if (scenario === "AUDIT_DEGRADATION") triggers.push(trigger("AUDIT", "HIGH", "Audit degradation requires remediation.", refs));
  if (scenario === "REPLAY_DEGRADATION" || scenario === "REPLAY_DIVERGENCE") triggers.push(trigger("REPLAY", "HIGH", "Replay degradation requires remediation.", refs));
  if (scenario === "RESTRICTED") triggers.push(trigger("PRODUCTION_READINESS", "MEDIUM", "Proposal remains restricted until review clears.", refs));
  if (scenario === "REJECTED") triggers.push(trigger("EXECUTIVE_OVERSIGHT", "CRITICAL", "Proposal is rejected under governed routing.", refs));
  failures.forEach((failure) => {
    if (failure === "ESCALATION_RULES_UNEVALUABLE") triggers.push(trigger("GOVERNANCE", "CRITICAL", failure, refs));
    if (failure === "REVIEW_AUTHORITY_UNDETERMINED" || failure === "MANDATORY_REVIEWER_ASSIGNMENT_AMBIGUOUS") triggers.push(trigger("OPERATOR", "CRITICAL", failure, refs));
  });
  return freezeArray(triggers);
}

function restrictionFor(triggerItem: EscalationTrigger): EscalationRestriction {
  const type = triggerItem.severity === "CRITICAL" ? "PROHIBITED" : triggerItem.severity === "HIGH" ? "ADDITIONAL_APPROVALS_REQUIRED" : "TEMPORARY_RESTRICTION";
  const base: Omit<EscalationRestriction, "integrity_hash"> = {
    restriction_id: `restriction_${hash(triggerItem.trigger_id).slice(0, 14)}`,
    restriction_type: type,
    category: triggerItem.category,
    active: true,
    rationale: triggerItem.rationale,
    release_condition: "Governed review resolves the underlying escalation trigger.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function reviewerFor(category: EscalationCategory, sequence: number, primary: boolean): ReviewerAssignment {
  const roleMap: Record<EscalationCategory, string> = {
    CONSTITUTIONAL: "constitutional_authority",
    GOVERNANCE: "governance_authority",
    AUTHORITY: "executive_authority",
    OPERATOR: "operator",
    AUDIT: "compliance_review",
    REPLAY: "architecture_review",
    EVIDENCE: "certification_authority",
    CERTIFICATION: "certification_authority",
    COMPLIANCE: "compliance_review",
    RISK: "risk_authority",
    TENANT_ISOLATION: "security_review",
    SECURITY: "security_review",
    PRIVACY: "security_review",
    TRUST: "governance_authority",
    DOCUMENTATION: "operator",
    ROLLBACK: "architecture_review",
    SIMULATION: "operator",
    PRODUCTION_READINESS: "architecture_review",
    OPERATIONAL_IMPACT: "operator",
    EXECUTIVE_OVERSIGHT: "executive_authority",
  };
  const reviewer_role = roleMap[category];
  const base: Omit<ReviewerAssignment, "integrity_hash"> = {
    reviewer_id: `reviewer_${hash(`${category}:${reviewer_role}:${sequence}`).slice(0, 14)}`,
    reviewer_role,
    category,
    primary,
    sequence,
    required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function workflowFor(reviewer: ReviewerAssignment, previous: readonly ReviewWorkflowStep[]): ReviewWorkflowStep {
  const base: Omit<ReviewWorkflowStep, "integrity_hash"> = {
    step_id: `workflow_${hash(reviewer.reviewer_id).slice(0, 14)}`,
    step_name: `${reviewer.reviewer_role}_review`,
    reviewer_role: reviewer.reviewer_role,
    depends_on: freezeArray(previous.slice(-1).map((step) => step.step_id)),
    blocking: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function finalDecisionFor(scenario: Scenario, failures: readonly EscalationRestrictionFailure[], triggers: readonly EscalationTrigger[]): EscalationRestrictionDecisionState {
  if (failures.length > 0) return "FAIL_CLOSED";
  const map: Partial<Record<Scenario, EscalationRestrictionDecisionState>> = {
    APPROVED_FOR_SIMULATION: "APPROVED_FOR_SIMULATION",
    OPERATOR_REVIEW_REQUIRED: "OPERATOR_REVIEW_REQUIRED",
    GOVERNANCE_REVIEW_REQUIRED: "GOVERNANCE_REVIEW_REQUIRED",
    CONSTITUTIONAL_REVIEW_REQUIRED: "CONSTITUTIONAL_REVIEW_REQUIRED",
    MULTI_LEVEL_REVIEW_REQUIRED: "MULTI_LEVEL_REVIEW_REQUIRED",
    RESTRICTED: "RESTRICTED",
    REJECTED: "REJECTED",
  };
  if (map[scenario]) return map[scenario];
  if (triggers.some((item) => item.category === "CONSTITUTIONAL")) return "CONSTITUTIONAL_REVIEW_REQUIRED";
  if (triggers.length > 1) return "MULTI_LEVEL_REVIEW_REQUIRED";
  if (triggers.some((item) => item.category === "GOVERNANCE")) return "GOVERNANCE_REVIEW_REQUIRED";
  if (triggers.some((item) => item.category === "OPERATOR")) return "OPERATOR_REVIEW_REQUIRED";
  return "APPROVED_FOR_SIMULATION";
}

function collectFailures(input: EscalationRestrictionEngineInput, context: ValidationContextSummary): readonly EscalationRestrictionFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const failures: EscalationRestrictionFailure[] = [];
  const direct = failureFor(scenario);
  if (direct) failures.push(direct);
  if (!context.audit_ready) failures.push("AUDIT_DEGRADATION_UNMITIGATED");
  if (!context.replay_ready) failures.push("REPLAY_DEGRADATION_UNRESOLVED");
  if (input.evidence_result?.fail_closed) failures.push("ESCALATION_RULES_UNEVALUABLE");
  if (input.tenant_result?.fail_closed) failures.push("TENANT_ISOLATION_RISK_UNRESOLVED");
  return freezeArray([...new Set(failures)]);
}

function buildDecision(input: EscalationRestrictionEngineInput): EscalationRestrictionDecision {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: "BASELINE" });
  const context = buildContext(input);
  const failures = collectFailures(input, context);
  const triggers = buildTriggers(scenario, context, failures);
  const restrictions = freezeArray(triggers.map(restrictionFor));
  const categories = freezeArray([...new Set(triggers.map((item) => item.category))]);
  const required_reviewers = freezeArray(categories.map((category, index) => reviewerFor(category, index + 1, index === 0)));
  const review_workflow = freezeArray(required_reviewers.reduce<ReviewWorkflowStep[]>((steps, reviewer) => [...steps, workflowFor(reviewer, steps)], []));
  const final_decision = finalDecisionFor(scenario, failures, triggers);
  const escalation_level = final_decision === "FAIL_CLOSED" ? "FAIL_CLOSED" : final_decision === "MULTI_LEVEL_REVIEW_REQUIRED" ? "MULTI_LEVEL" : final_decision === "CONSTITUTIONAL_REVIEW_REQUIRED" ? "CONSTITUTIONAL" : final_decision === "GOVERNANCE_REVIEW_REQUIRED" ? "GOVERNANCE" : final_decision === "OPERATOR_REVIEW_REQUIRED" ? "OPERATOR" : "NONE";
  const base: Omit<EscalationRestrictionDecision, "integrity_hash"> = {
    decision_id: `escalation_restriction_decision_${hash(`${scenario}:${adaptation.contract.adaptation_id}`).slice(0, 16)}`,
    tenant_id: adaptation.contract.tenant_id,
    proposal_id: adaptation.contract.adaptation_id,
    validation_summary: context,
    escalation_triggers: triggers,
    escalation_level,
    required_reviewers,
    review_workflow,
    restrictions,
    review_dependencies: freezeArray(review_workflow.flatMap((step) => step.depends_on)),
    approval_requirements: freezeArray(required_reviewers.map((reviewer) => reviewer.reviewer_role)),
    simulation_authorization: final_decision === "APPROVED_FOR_SIMULATION" ? "AUTHORIZED_FOR_SIMULATION" : final_decision === "FAIL_CLOSED" || final_decision === "REJECTED" ? "DENIED" : "PENDING_REVIEW",
    final_decision,
    decision_reasoning: freezeArray(failures.length > 0 ? failures.map((failure) => `Fail-closed: ${failure}.`) : triggers.length > 0 ? triggers.map((item) => item.rationale) : ["All prior validations are complete; no mandatory escalation remains."]),
    supporting_evidence: context.dependency_graph,
    replay_reference: `replay_${hash(`${scenario}:${adaptation.contract.adaptation_id}:escalation-restriction`).slice(0, 16)}`,
    validation_timestamp: DECISION_TIMESTAMP,
  };
  const decision = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  return failures.includes("INTEGRITY_VERIFICATION_FAILED") ? Object.freeze({ ...decision, integrity_hash: "tampered_escalation_decision_hash" }) : decision;
}

function integrityFailures(decision: EscalationRestrictionDecision, failures: readonly EscalationRestrictionFailure[]): readonly EscalationRestrictionFailure[] {
  const observed = [...failures];
  if (hashWithoutIntegrity(decision) !== decision.integrity_hash) observed.push("INTEGRITY_VERIFICATION_FAILED");
  if (decision.required_reviewers.length === 0 && !["APPROVED_FOR_SIMULATION", "REJECTED", "FAIL_CLOSED"].includes(decision.final_decision)) observed.push("REVIEW_AUTHORITY_UNDETERMINED");
  if (decision.review_workflow.length !== decision.required_reviewers.length) observed.push("REVIEW_WORKFLOW_NONDETERMINISTIC");
  return freezeArray([...new Set(observed)]);
}

function buildLedgerEntry(decision: EscalationRestrictionDecision, failures: readonly EscalationRestrictionFailure[], replayable: boolean): EscalationRestrictionLedgerEntry {
  const base: Omit<EscalationRestrictionLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `escalation_restriction_ledger_${hash(decision.decision_id).slice(0, 16)}`,
    tenant_id: decision.tenant_id,
    proposal_id: decision.proposal_id,
    decision_id: decision.decision_id,
    final_decision: failures.length > 0 ? "FAIL_CLOSED" : decision.final_decision,
    escalation_triggers: freezeArray(decision.escalation_triggers.map((item) => item.trigger_id)),
    restrictions: freezeArray(decision.restrictions.map((item) => item.restriction_id)),
    required_reviewers: freezeArray(decision.required_reviewers.map((item) => item.reviewer_id)),
    validation_timestamp: decision.validation_timestamp,
    append_only: true,
    immutable: true,
    replayable,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<EscalationRestrictionEngineResult, "integrity_hash" | "replay_hash">): string {
  return hash({ decision: result.decision, reports: [result.escalation_decision_report, result.restriction_assessment, result.review_workflow_specification], ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<EscalationRestrictionEngineResult, "integrity_hash">): string {
  return hash({
    escalation_restriction_engine_version: result.escalation_restriction_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    decision_hash: result.decision.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function determineEscalationRestriction(input: EscalationRestrictionEngineInput = {}): EscalationRestrictionEngineResult {
  const api_surface = buildApiSurface();
  const decision = buildDecision(input);
  const initialFailures = collectFailures(input, decision.validation_summary);
  const failures = integrityFailures(decision, initialFailures);
  const final_decision = failures.length > 0 ? "FAIL_CLOSED" : decision.final_decision;
  const replayable = !failures.includes("REPLAY_DIVERGENCE") && !failures.includes("REPLAY_DEGRADATION_UNRESOLVED") && decision.replay_reference.length > 0;
  const ledger_entry = buildLedgerEntry(decision, failures, replayable);
  const base: Omit<EscalationRestrictionEngineResult, "integrity_hash" | "replay_hash"> = {
    escalation_restriction_engine_version: ENGINE_VERSION,
    api_surface,
    decision: failures.length > 0 && decision.final_decision !== "FAIL_CLOSED" ? Object.freeze({ ...decision, final_decision: "FAIL_CLOSED" as const, simulation_authorization: "DENIED" as const }) : decision,
    escalation_decision_report: freezeArray([final_decision, ...decision.decision_reasoning]),
    escalation_trigger_analysis: freezeArray(decision.escalation_triggers.map((item) => `${item.category}:${item.severity}:${item.rationale}`)),
    restriction_assessment: freezeArray(decision.restrictions.map((item) => `${item.restriction_type}:${item.category}:${item.active}`)),
    review_workflow_specification: freezeArray(decision.review_workflow.map((item) => `${item.step_name}:${item.reviewer_role}`)),
    reviewer_assignment_matrix: freezeArray(decision.required_reviewers.map((item) => `${item.sequence}:${item.reviewer_role}:${item.category}`)),
    escalation_hierarchy: freezeArray(decision.required_reviewers.map((item) => item.reviewer_role)),
    approval_requirements_report: decision.approval_requirements,
    simulation_authorization_decision: final_decision === "APPROVED_FOR_SIMULATION" ? "AUTHORIZED_FOR_SIMULATION" : final_decision === "FAIL_CLOSED" || final_decision === "REJECTED" ? "DENIED" : "PENDING_REVIEW",
    restriction_enforcement_report: freezeArray(decision.restrictions.length > 0 ? decision.restrictions.map((item) => `${item.restriction_id}:enforced`) : ["no_active_restrictions"]),
    failures,
    ledger_entry,
    final_decision,
    fail_closed: final_decision === "FAIL_CLOSED",
    tenant_isolated: !failures.includes("TENANT_ISOLATION_RISK_UNRESOLVED"),
    audit_ready: !failures.includes("AUDIT_DEGRADATION_UNMITIGATED"),
    replayable,
    advisory_only: true,
    human_controlled: true,
    least_authority: true,
    immutable: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayEscalationRestrictionDecision(result: EscalationRestrictionEngineResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getEscalationRestrictionEngineFoundation(): EscalationRestrictionEngineFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    escalation_restriction_engine_version: ENGINE_VERSION,
    api_surface,
    result: determineEscalationRestriction(),
  });
}

export const EscalationRestrictionEngine = Object.freeze({
  determine: determineEscalationRestriction,
  replay: replayEscalationRestrictionDecision,
});
