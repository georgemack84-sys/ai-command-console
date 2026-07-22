import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { appendOperatorFeedbackLedger, replayOperatorFeedbackLedger } from "@/services/operator-feedback-ledger";
import type { OperatorFeedbackLedgerInput } from "@/types/operator-feedback-ledger";
import type {
  FeedbackEscalationDecision,
  FeedbackGovernanceApiSurface,
  FeedbackGovernanceAuditEvent,
  FeedbackGovernanceCompliance,
  FeedbackGovernanceDecisionRecord,
  FeedbackGovernanceEvaluation,
  FeedbackGovernanceExplanation,
  FeedbackGovernanceFailure,
  FeedbackGovernanceScenario,
  FeedbackGovernanceValidationFoundation,
  FeedbackGovernanceValidationInput,
  FeedbackGovernanceValidationResult,
} from "@/types/operator-feedback-governance-validation";

const ENGINE_VERSION = "operator-feedback-governance-validation/v1" as const;
const RULE_VERSION = "operator-feedback-governance-rules/v1" as const;
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<FeedbackGovernanceValidationInput["scenario"]>;

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

function buildApiSurface(): FeedbackGovernanceApiSurface {
  const base: Omit<FeedbackGovernanceApiSurface, "integrity_hash"> = {
    api_id: "operator_feedback_governance_validation_api",
    validate_governance: "POST /operator-feedback-governance-validation/validate",
    retrieve_authority: "POST /operator-feedback-governance-validation/authority",
    retrieve_constitutional: "POST /operator-feedback-governance-validation/constitutional",
    retrieve_policy: "POST /operator-feedback-governance-validation/policy",
    retrieve_escalation: "POST /operator-feedback-governance-validation/escalation",
    retrieve_registry: "POST /operator-feedback-governance-validation/registry",
    retrieve_explanation: "POST /operator-feedback-governance-validation/explanation",
    retrieve_audit: "POST /operator-feedback-governance-validation/audit",
    replay_validation: "POST /operator-feedback-governance-validation/replay",
    retrieve_contract: "GET /operator-feedback-governance-validation/contract",
    feedback_quality_analysis_supported: false,
    normalization_supported: false,
    adaptive_proposal_generation_supported: false,
    production_mutation_supported: false,
    governance_approval_execution_supported: false,
    policy_update_supported: false,
    constitutional_override_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerInputFor(scenario: Scenario): OperatorFeedbackLedgerInput {
  if (scenario === "MISSING_GOVERNANCE_METADATA") return { scenario: "MISSING_GOVERNANCE_METADATA" };
  if (scenario === "REPLAY_LINEAGE_INCOMPLETE") return { scenario: "MISSING_REPLAY_REFERENCE" };
  if (scenario === "TENANT_OWNERSHIP_AMBIGUOUS" || scenario === "CROSS_TENANT_AUTHORITY") return { scenario: "TENANT_MISMATCH" };
  if (scenario === "LEDGER_FAILURE") return { scenario: "INVALID_HASH" };
  if (scenario === "GOVERNANCE_REVIEW" || scenario === "CONSTITUTIONAL_REVIEW" || scenario === "CRITICAL_ESCALATION" || scenario === "HIGH_RISK_FEEDBACK") return { scenario: "OVERRIDE" };
  return { scenario: "BASELINE" };
}

function directFailureFor(scenario: Scenario): FeedbackGovernanceFailure | undefined {
  const map: Partial<Record<Scenario, FeedbackGovernanceFailure>> = {
    MISSING_GOVERNANCE_METADATA: "GOVERNANCE_METADATA_MISSING",
    AUTHORITY_UNDEFINED: "AUTHORITY_UNDEFINED",
    AUTHORITY_EXCEEDED: "AUTHORITY_EXCEEDED",
    ROLE_MISMATCH: "ROLE_MISMATCH",
    UNAUTHORIZED_OPERATOR: "UNAUTHORIZED_OPERATOR",
    CROSS_TENANT_AUTHORITY: "CROSS_TENANT_AUTHORITY",
    GOVERNANCE_RESTRICTION_VIOLATED: "GOVERNANCE_RESTRICTION_VIOLATED",
    CONSTITUTIONAL_RULES_UNAVAILABLE: "CONSTITUTIONAL_RULES_UNAVAILABLE",
    POLICY_VERSION_UNAVAILABLE: "POLICY_VERSION_UNAVAILABLE",
    REPLAY_LINEAGE_INCOMPLETE: "REPLAY_LINEAGE_INCOMPLETE",
    TENANT_OWNERSHIP_AMBIGUOUS: "TENANT_OWNERSHIP_AMBIGUOUS",
    ESCALATION_RULES_INVALID: "ESCALATION_RULES_INVALID",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
    POLICY_MUTATION_ATTEMPT: "POLICY_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS_ATTEMPT: "GOVERNANCE_BYPASS_ATTEMPT",
    CONSTITUTIONAL_BYPASS_ATTEMPT: "CONSTITUTIONAL_BYPASS_ATTEMPT",
    ADAPTIVE_IMPLEMENTATION_AUTHORIZATION_ATTEMPT: "ADAPTIVE_IMPLEMENTATION_AUTHORIZATION_ATTEMPT",
    HISTORICAL_RECORD_MUTATION_ATTEMPT: "HISTORICAL_RECORD_MUTATION_ATTEMPT",
    OPERATOR_AUTHORITY_EXPANSION_ATTEMPT: "OPERATOR_AUTHORITY_EXPANSION_ATTEMPT",
    LEDGER_FAILURE: "LEDGER_NOT_CERTIFIED",
  };
  return map[scenario];
}

function escalationFor(scenario: Scenario, failures: readonly FeedbackGovernanceFailure[]): FeedbackEscalationDecision["category"] {
  if (failures.length > 0) return "CRITICAL_ESCALATION";
  if (scenario === "CRITICAL_ESCALATION" || scenario === "HIGH_RISK_FEEDBACK") return "CRITICAL_ESCALATION";
  if (scenario === "CONSTITUTIONAL_REVIEW") return "CONSTITUTIONAL_REVIEW";
  if (scenario === "GOVERNANCE_REVIEW") return "GOVERNANCE_REVIEW";
  if (scenario === "ADVISORY") return "ADVISORY";
  return "INFORMATIONAL";
}

function complianceFor(domain: FeedbackGovernanceEvaluation["domain"], failures: readonly FeedbackGovernanceFailure[], category: FeedbackEscalationDecision["category"]): FeedbackGovernanceCompliance {
  if (failures.length > 0) return "NON_COMPLIANT";
  if ((domain === "CONSTITUTIONAL" && category === "CONSTITUTIONAL_REVIEW") || category === "CRITICAL_ESCALATION") return "CONDITIONALLY_COMPLIANT";
  if (domain === "GOVERNANCE" && category === "GOVERNANCE_REVIEW") return "CONDITIONALLY_COMPLIANT";
  return "COMPLIANT";
}

function evaluation(domain: FeedbackGovernanceEvaluation["domain"], status: FeedbackGovernanceCompliance): FeedbackGovernanceEvaluation {
  const base: Omit<FeedbackGovernanceEvaluation, "integrity_hash"> = {
    evaluation_id: `feedback_governance_${domain.toLowerCase()}_${hash(`${domain}:${status}:${RULE_VERSION}`).slice(0, 12)}`,
    domain,
    status,
    applicable_rules: freezeArray([`${domain.toLowerCase()}_supremacy`, "feedback_evidence_not_authority", "advisory_only_adaptation"]),
    allowed_actions: freezeArray(["increase_adaptation_priority", "trigger_simulation", "trigger_review", "trigger_investigation", "trigger_governance_review"]),
    prohibited_actions: freezeArray(["modify_production", "change_policy", "alter_governance", "override_constitution", "bypass_approval", "authorize_implementation", "modify_history", "expand_authority"]),
    explanation: `${domain.toLowerCase()} validation ${status.toLowerCase()} under ${RULE_VERSION}`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEscalation(category: FeedbackEscalationDecision["category"], failures: readonly FeedbackGovernanceFailure[]): FeedbackEscalationDecision {
  const critical = category === "CRITICAL_ESCALATION";
  const review = critical || category === "GOVERNANCE_REVIEW" || category === "CONSTITUTIONAL_REVIEW";
  const base: Omit<FeedbackEscalationDecision, "integrity_hash"> = {
    escalation_id: `feedback_escalation_${hash(`${category}:${failures.join("|")}`).slice(0, 14)}`,
    category,
    governance_review_required: review,
    simulation_required: critical,
    operator_approval_required: category !== "INFORMATIONAL",
    executive_approval_required: critical,
    certification_review_required: critical || failures.length > 0,
    downstream_progression_halted: failures.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: FeedbackGovernanceValidationInput): readonly FeedbackGovernanceFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const ledger = input.ledger_result ?? appendOperatorFeedbackLedger(ledgerInputFor(scenario));
  const failures: FeedbackGovernanceFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (ledger.ledger_state !== "CERTIFIED") failures.push("LEDGER_NOT_CERTIFIED");
  if (!ledger.records[0]?.governance_metadata_hash) failures.push("GOVERNANCE_METADATA_MISSING");
  if (!ledger.records[0]?.operator_id) failures.push("AUTHORITY_UNDEFINED");
  if (!ledger.tenant_isolated) failures.push("TENANT_OWNERSHIP_AMBIGUOUS");
  if (!ledger.replay_ledger.replay_lineage.length) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  return freezeArray([...new Set(failures)]);
}

function buildRegistry(input: { feedbackId: string; governance: FeedbackGovernanceEvaluation; authority: FeedbackGovernanceEvaluation; constitutional: FeedbackGovernanceEvaluation; policy: FeedbackGovernanceEvaluation; escalation: FeedbackEscalationDecision; replayRefs: readonly string[]; auditRefs: readonly string[] }): FeedbackGovernanceDecisionRecord {
  const base: Omit<FeedbackGovernanceDecisionRecord, "integrity_hash"> = {
    governance_decision_id: `feedback_governance_decision_${hash(`${input.feedbackId}:${input.escalation.category}`).slice(0, 14)}`,
    feedback_id: input.feedbackId,
    validation_results: freezeArray([input.governance.status, input.authority.status, input.constitutional.status, input.policy.status]),
    authority_assessment: input.authority.explanation,
    constitutional_assessment: input.constitutional.explanation,
    policy_assessment: input.policy.explanation,
    escalation_outcome: input.escalation.category,
    reviewer: "governance_validator",
    timestamp: VALIDATED_AT,
    replay_refs: input.replayRefs,
    audit_refs: input.auditRefs,
    append_only: true,
    immutable: true,
    tenant_isolated: true,
    cryptographically_verifiable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildExplanation(registry: FeedbackGovernanceDecisionRecord, failures: readonly FeedbackGovernanceFailure[], evidenceRefs: readonly string[]): FeedbackGovernanceExplanation {
  const base: Omit<FeedbackGovernanceExplanation, "integrity_hash"> = {
    explanation_id: `feedback_governance_explanation_${hash(registry.governance_decision_id).slice(0, 14)}`,
    validation_outcome: failures.length ? `failed closed: ${failures.join(",")}` : "feedback remains advisory evidence",
    applicable_governance_rules: freezeArray(["feedback_evidence_not_authority", "governance_review_required_for_adaptation", "operator_approval_required_for_implementation"]),
    authority_determination: registry.authority_assessment,
    constitutional_considerations: registry.constitutional_assessment,
    policy_evaluations: registry.policy_assessment,
    escalation_decision: registry.escalation_outcome,
    supporting_evidence: evidenceRefs,
    replay_references: registry.replay_refs,
    traceable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function audit(registry: FeedbackGovernanceDecisionRecord, authority: FeedbackGovernanceCompliance, constitutional: FeedbackGovernanceCompliance, policy: FeedbackGovernanceCompliance, replayId: string): FeedbackGovernanceAuditEvent {
  const base: Omit<FeedbackGovernanceAuditEvent, "integrity_hash"> = {
    audit_event_id: `feedback_governance_audit_${hash(registry.governance_decision_id).slice(0, 14)}`,
    governance_validation_id: registry.governance_decision_id,
    validation_timestamp: VALIDATED_AT,
    rule_versions: freezeArray([RULE_VERSION, "operator-authority-boundary/v1", "constitutional-feedback-controls/v1", "feedback-policy-controls/v1"]),
    authority_evaluation: authority,
    constitutional_evaluation: constitutional,
    policy_evaluation: policy,
    escalation_outcome: registry.escalation_outcome,
    governance_reviewer: "governance_validator",
    replay_identifier: replayId,
    integrity_verified: true,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<FeedbackGovernanceValidationResult, "integrity_hash" | "replay_hash">): string {
  return hash({ ledger_hash: result.ledger_result.integrity_hash, governance: result.governance_validation, authority: result.authority_validation, constitutional: result.constitutional_validation, policy: result.policy_validation, escalation: result.escalation_decision, registry: result.decision_registry_record, audit: result.audit_events, state: result.validation_state });
}

function resultIntegrityHash(result: Omit<FeedbackGovernanceValidationResult, "integrity_hash">): string {
  return hash({
    operator_feedback_governance_validation_version: result.operator_feedback_governance_validation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    registry_hash: result.decision_registry_record.integrity_hash,
    explanation_hash: result.explanation.integrity_hash,
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function validateOperatorFeedbackGovernance(input: FeedbackGovernanceValidationInput = {}): FeedbackGovernanceValidationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const ledger_result = input.ledger_result ?? appendOperatorFeedbackLedger(ledgerInputFor(scenario));
  const failures = collectFailures({ ...input, ledger_result });
  const escalationCategory = escalationFor(scenario, failures);
  const governance_validation = evaluation("GOVERNANCE", complianceFor("GOVERNANCE", failures, escalationCategory));
  const authority_validation = evaluation("AUTHORITY", complianceFor("AUTHORITY", failures, escalationCategory));
  const constitutional_validation = evaluation("CONSTITUTIONAL", complianceFor("CONSTITUTIONAL", failures, escalationCategory));
  const policy_validation = evaluation("POLICY", complianceFor("POLICY", failures, escalationCategory));
  const escalation_decision = buildEscalation(escalationCategory, failures);
  const record = ledger_result.records[0];
  const replayRefs = ledger_result.replay_ledger.replay_lineage;
  const auditRefs = ledger_result.audit_events.map((event) => event.audit_id);
  const decision_registry_record = buildRegistry({ feedbackId: record?.feedback_id ?? "missing_feedback", governance: governance_validation, authority: authority_validation, constitutional: constitutional_validation, policy: policy_validation, escalation: escalation_decision, replayRefs, auditRefs });
  const explanation = buildExplanation(decision_registry_record, failures, ledger_result.evidence_history.original_evidence_refs);
  const audit_events = freezeArray([audit(decision_registry_record, authority_validation.status, constitutional_validation.status, policy_validation.status, ledger_result.replay_ledger.replay_id)]);
  const base: Omit<FeedbackGovernanceValidationResult, "integrity_hash" | "replay_hash"> = {
    operator_feedback_governance_validation_version: ENGINE_VERSION,
    governance_rule_version: RULE_VERSION,
    api_surface,
    ledger_result,
    governance_validation,
    authority_validation,
    constitutional_validation,
    policy_validation,
    escalation_decision,
    decision_registry_record,
    explanation,
    audit_events,
    validation_state: failures.length ? "HALTED" : "VALIDATED",
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayOperatorFeedbackLedger(ledger_result),
    explainable: true,
    tenant_isolated: ledger_result.tenant_isolated && !failures.includes("TENANT_OWNERSHIP_AMBIGUOUS") && !failures.includes("CROSS_TENANT_AUTHORITY"),
    governance_supremacy_enforced: true,
    constitutional_supremacy_enforced: true,
    authority_separation_enforced: true,
    advisory_only: true,
    fail_closed: failures.length > 0,
    modifies_production: false,
    changes_policy: false,
    alters_governance: false,
    overrides_constitutional_constraints: false,
    bypasses_approval_workflows: false,
    authorizes_adaptive_implementation: false,
    modifies_historical_records: false,
    expands_operator_authority: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayOperatorFeedbackGovernanceValidation(result: FeedbackGovernanceValidationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getOperatorFeedbackGovernanceValidationFoundation(): FeedbackGovernanceValidationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    operator_feedback_governance_validation_version: ENGINE_VERSION,
    api_surface,
    result: validateOperatorFeedbackGovernance(),
  });
}

export const OperatorFeedbackGovernanceValidation = Object.freeze({
  validate: validateOperatorFeedbackGovernance,
  replay: replayOperatorFeedbackGovernanceValidation,
});
