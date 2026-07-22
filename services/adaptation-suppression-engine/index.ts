import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { prioritizeAdaptationProposals, replayAdaptationPrioritization } from "@/services/adaptation-prioritization-engine";
import type { AdaptationPrioritizationScenario, PrioritizedAdaptationProposal } from "@/types/adaptation-prioritization-engine";
import type {
  AdaptationSuppressionApiSurface,
  AdaptationSuppressionFailure,
  AdaptationSuppressionFoundation,
  AdaptationSuppressionInput,
  AdaptationSuppressionMetrics,
  AdaptationSuppressionOutcome,
  AdaptationSuppressionResult,
  AdaptationSuppressionRule,
  AdaptationSuppressionScenario,
  AdaptationSuppressionState,
  SuppressionDecision,
  SuppressionExplanation,
} from "@/types/adaptation-suppression-engine";

const ENGINE_VERSION = "adaptation-suppression-engine/v1" as const;
const DECISION_VERSION = "adaptation-suppression-rules/v1" as const;
const DECIDED_AT = "2026-07-10T00:00:00.000Z";

const RULES: readonly AdaptationSuppressionRule[] = Object.freeze([
  "WEAK_EVIDENCE",
  "UNCLEAR_BENEFIT",
  "EXCESSIVE_RISK",
  "INCOMPLETE_REPLAY",
  "UNRESOLVED_GOVERNANCE",
  "UNRESOLVED_AUTHORITY",
  "DUPLICATE_PROPOSAL",
  "CERTIFICATION_CONFLICT",
  "RESTRICTED_LEARNING_DOMAIN",
  "REDUCED_EXPLAINABILITY",
  "INCREASED_OPERATOR_CONFUSION",
  "ROLLBACK_UNAVAILABLE",
]);

const OUTCOMES: readonly AdaptationSuppressionOutcome[] = Object.freeze(["SUPPRESSED", "REQUIRES_REWORK", "RETURN_FOR_ANALYSIS", "CONTINUE"]);

type Scenario = NonNullable<AdaptationSuppressionInput["scenario"]>;

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

function buildApiSurface(): AdaptationSuppressionApiSurface {
  const base: Omit<AdaptationSuppressionApiSurface, "integrity_hash"> = {
    api_id: "adaptation_suppression_engine_api",
    evaluate_suppression: "POST /adaptation-suppression-engine/evaluate",
    retrieve_decisions: "POST /adaptation-suppression-engine/decisions",
    retrieve_explanations: "POST /adaptation-suppression-engine/explanations",
    retrieve_metrics: "POST /adaptation-suppression-engine/metrics",
    replay_suppression: "POST /adaptation-suppression-engine/replay",
    inspect_suppression: "POST /adaptation-suppression-engine/inspect",
    retrieve_contract: "GET /adaptation-suppression-engine/contract",
    proposal_content_mutation_supported: false,
    deficiency_fabrication_supported: false,
    approval_supported: false,
    rejection_supported: false,
    implementation_supported: false,
    prioritization_supported: false,
    production_mutation_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function prioritizationScenarioFor(scenario: Scenario): AdaptationPrioritizationScenario {
  const map: Partial<Record<AdaptationSuppressionScenario, AdaptationPrioritizationScenario>> = {
    INVALID_PROPOSAL: "INVALID_PROPOSAL",
    EVIDENCE_UNAVAILABLE: "MISSING_EVIDENCE",
    GOVERNANCE_UNAVAILABLE: "GOVERNANCE_MISSING",
    CONSTITUTIONAL_UNAVAILABLE: "CONSTITUTIONAL_MISSING",
    REPLAY_UNAVAILABLE: "MISSING_REPLAY",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    NONDETERMINISTIC_EVALUATION: "ORDERING_FAILURE",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    MUTATION_ATTEMPT: "MUTATION_ATTEMPT",
    APPROVAL_ATTEMPT: "APPROVAL_ATTEMPT",
    PRIORITIZATION_ATTEMPT: "SUPPRESSION_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "MUTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptationSuppressionFailure | undefined {
  const map: Partial<Record<AdaptationSuppressionScenario, AdaptationSuppressionFailure>> = {
    INVALID_PROPOSAL: "PROPOSAL_VALIDATION_FAILED",
    EVIDENCE_UNAVAILABLE: "EVIDENCE_CANNOT_BE_EVALUATED",
    GOVERNANCE_UNAVAILABLE: "GOVERNANCE_ANALYSIS_UNAVAILABLE",
    CONSTITUTIONAL_UNAVAILABLE: "CONSTITUTIONAL_ANALYSIS_UNAVAILABLE",
    REPLAY_UNAVAILABLE: "REPLAY_VALIDATION_UNAVAILABLE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    NONDETERMINISTIC_EVALUATION: "DETERMINISTIC_EVALUATION_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    FABRICATED_DEFICIENCY: "DEFICIENCY_FABRICATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPT",
    CONSTITUTIONAL_BYPASS: "CONSTITUTIONAL_BYPASS_ATTEMPT",
    UNSUPPORTED_SUPPRESSION: "UNSUPPORTED_SUPPRESSION_WITHOUT_EVIDENCE",
    APPROVAL_ATTEMPT: "PROPOSAL_APPROVAL_ATTEMPT",
    PRIORITIZATION_ATTEMPT: "PROPOSAL_PRIORITIZATION_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "PROPOSAL_IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario];
}

function rulesFor(candidate: PrioritizedAdaptationProposal, scenario: Scenario): readonly AdaptationSuppressionRule[] {
  const rules: AdaptationSuppressionRule[] = [];
  const factor = (name: string) => candidate.factor_scores.find((score) => score.factor === name)?.score ?? 0;
  if (scenario === "WEAK_EVIDENCE" || factor("EVIDENCE_STRENGTH") < 45 || candidate.evidence_refs.length === 0) rules.push("WEAK_EVIDENCE");
  if (scenario === "UNCLEAR_BENEFIT" || factor("EXPECTED_BENEFIT") < 42) rules.push("UNCLEAR_BENEFIT");
  if (scenario === "EXCESSIVE_RISK" || candidate.priority_level === "DEFERRED" && factor("GOVERNANCE_IMPACT") > 70) rules.push("EXCESSIVE_RISK");
  if (scenario === "INCOMPLETE_REPLAY" || candidate.replay_refs.length === 0) rules.push("INCOMPLETE_REPLAY");
  if (scenario === "UNRESOLVED_GOVERNANCE" || candidate.explanation.governance_considerations.length === 0) rules.push("UNRESOLVED_GOVERNANCE");
  if (scenario === "UNRESOLVED_AUTHORITY") rules.push("UNRESOLVED_AUTHORITY");
  if (scenario === "DUPLICATE_PROPOSAL") rules.push("DUPLICATE_PROPOSAL");
  if (scenario === "CERTIFICATION_CONFLICT") rules.push("CERTIFICATION_CONFLICT");
  if (scenario === "RESTRICTED_LEARNING_DOMAIN") rules.push("RESTRICTED_LEARNING_DOMAIN");
  if (scenario === "REDUCED_EXPLAINABILITY") rules.push("REDUCED_EXPLAINABILITY");
  if (scenario === "INCREASED_OPERATOR_CONFUSION") rules.push("INCREASED_OPERATOR_CONFUSION");
  if (scenario === "ROLLBACK_UNAVAILABLE") rules.push("ROLLBACK_UNAVAILABLE");
  return freezeArray([...new Set(rules)]);
}

function outcomeFor(rules: readonly AdaptationSuppressionRule[], failures: readonly AdaptationSuppressionFailure[]): AdaptationSuppressionOutcome {
  if (failures.length > 0) return "SUPPRESSED";
  if (rules.some((rule) => ["UNRESOLVED_GOVERNANCE", "UNRESOLVED_AUTHORITY", "CERTIFICATION_CONFLICT", "RESTRICTED_LEARNING_DOMAIN", "INCOMPLETE_REPLAY"].includes(rule))) return "SUPPRESSED";
  if (rules.includes("DUPLICATE_PROPOSAL")) return "RETURN_FOR_ANALYSIS";
  if (rules.some((rule) => ["WEAK_EVIDENCE", "UNCLEAR_BENEFIT", "REDUCED_EXPLAINABILITY", "INCREASED_OPERATOR_CONFUSION", "ROLLBACK_UNAVAILABLE", "EXCESSIVE_RISK"].includes(rule))) return "REQUIRES_REWORK";
  return "CONTINUE";
}

function remediationFor(rules: readonly AdaptationSuppressionRule[]): readonly string[] {
  if (rules.length === 0) return freezeArray(["continue_to_downstream_simulation_without_approval_implication"]);
  return freezeArray(rules.map((rule) => `remediate_${rule.toLowerCase()}`));
}

function explanationFor(candidate: PrioritizedAdaptationProposal, outcome: AdaptationSuppressionOutcome, rules: readonly AdaptationSuppressionRule[]): SuppressionExplanation {
  const base: Omit<SuppressionExplanation, "integrity_hash"> = {
    explanation_id: `adaptation_suppression_explanation_${hash(`${candidate.priority_id}:${outcome}:${rules.join("|")}`).slice(0, 14)}`,
    proposal_id: candidate.proposal_id,
    suppression_outcome: outcome,
    triggering_conditions: rules.length ? rules.map((rule) => `${rule}_triggered`) : freezeArray(["all_suppression_checks_passed"]),
    violated_rules: rules,
    evidence_references: candidate.evidence_refs,
    governance_considerations: candidate.explanation.governance_considerations,
    constitutional_considerations: candidate.explanation.constitutional_considerations,
    operator_impact: rules.includes("INCREASED_OPERATOR_CONFUSION") ? "operator clarity risk requires rework" : "operator review context preserved",
    replay_references: candidate.replay_refs,
    remediation_guidance: remediationFor(rules),
    decision_timestamp: DECIDED_AT,
    decision_version: DECISION_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function decisionFor(candidate: PrioritizedAdaptationProposal, scenario: Scenario, failures: readonly AdaptationSuppressionFailure[]): SuppressionDecision {
  const rules = rulesFor(candidate, scenario);
  const outcome = outcomeFor(rules, failures);
  const base: Omit<SuppressionDecision, "integrity_hash"> = {
    suppression_decision_id: `adaptation_suppression_${hash(`${candidate.priority_id}:${outcome}`).slice(0, 14)}`,
    proposal_id: candidate.proposal_id,
    generated_proposal_id: candidate.generated_proposal_id,
    priority_id: candidate.priority_id,
    outcome,
    triggered_rules: rules,
    rationale: outcome === "CONTINUE" ? "Proposal satisfies deterministic suppression checks; continuation is not approval." : `Progression blocked by ${rules.join(",") || "fail_closed_validation"}.`,
    explanation: explanationFor(candidate, outcome, rules),
    duplicate_of: rules.includes("DUPLICATE_PROPOSAL") ? `duplicate_${candidate.proposal_id}` : "",
    can_continue_downstream: outcome === "CONTINUE",
    routed_to_consolidation: outcome === "RETURN_FOR_ANALYSIS" && rules.includes("DUPLICATE_PROPOSAL"),
    fail_closed: outcome === "SUPPRESSED" || failures.length > 0,
    advisory_only: true,
    modifies_proposal: false,
    deletes_proposal: false,
    approves_proposal: false,
    rejects_proposal: false,
    implements_proposal: false,
    prioritizes_proposal: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(scenario: Scenario, prioritizationReplayable: boolean, prioritizationFailures: readonly string[]): readonly AdaptationSuppressionFailure[] {
  const failures: AdaptationSuppressionFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (prioritizationFailures.includes("PROPOSAL_VALIDATION_FAILED")) failures.push("PROPOSAL_VALIDATION_FAILED");
  if (prioritizationFailures.includes("EVIDENCE_INCOMPLETE")) failures.push("EVIDENCE_CANNOT_BE_EVALUATED");
  if (prioritizationFailures.includes("GOVERNANCE_ANALYSIS_MISSING")) failures.push("GOVERNANCE_ANALYSIS_UNAVAILABLE");
  if (prioritizationFailures.includes("CONSTITUTIONAL_ANALYSIS_MISSING")) failures.push("CONSTITUTIONAL_ANALYSIS_UNAVAILABLE");
  if (prioritizationFailures.includes("REPLAY_REFERENCES_INCOMPLETE")) failures.push("REPLAY_VALIDATION_UNAVAILABLE");
  if (!prioritizationReplayable || prioritizationFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (prioritizationFailures.includes("DETERMINISTIC_ORDERING_NOT_GUARANTEED")) failures.push("DETERMINISTIC_EVALUATION_NOT_GUARANTEED");
  if (prioritizationFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_VIOLATED");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly AdaptationSuppressionFailure[]): AdaptationSuppressionState {
  return failures.length ? "FAIL_CLOSED" : "EVALUATED";
}

function reasonCounts(decisions: readonly SuppressionDecision[]): Readonly<Record<AdaptationSuppressionRule, number>> {
  const base = RULES.reduce((acc, rule) => ({ ...acc, [rule]: 0 }), {} as Record<AdaptationSuppressionRule, number>);
  decisions.forEach((decision) => {
    decision.triggered_rules.forEach((rule) => {
      base[rule] += 1;
    });
  });
  return Object.freeze(base);
}

function metricsFor(decisions: readonly SuppressionDecision[], failures: readonly AdaptationSuppressionFailure[]): AdaptationSuppressionMetrics {
  const reasons = reasonCounts(decisions);
  const suppressed = decisions.filter((decision) => decision.outcome === "SUPPRESSED").length;
  const base: Omit<AdaptationSuppressionMetrics, "integrity_hash"> = {
    proposals_evaluated: decisions.length,
    proposals_suppressed: suppressed,
    suppression_rate: decisions.length ? Number((suppressed / decisions.length).toFixed(4)) : 0,
    suppression_reasons: reasons,
    duplicate_detections: reasons.DUPLICATE_PROPOSAL,
    governance_related_suppressions: reasons.UNRESOLVED_GOVERNANCE + reasons.CERTIFICATION_CONFLICT + reasons.RESTRICTED_LEARNING_DOMAIN,
    constitutional_suppressions: reasons.RESTRICTED_LEARNING_DOMAIN,
    replay_failures: reasons.INCOMPLETE_REPLAY,
    rollback_deficiencies: reasons.ROLLBACK_UNAVAILABLE,
    operator_safety_suppressions: reasons.INCREASED_OPERATOR_CONFUSION,
    explainability_suppressions: reasons.REDUCED_EXPLAINABILITY,
    evaluation_latency_ms: 0,
    deterministic_replay_success: failures.length === 0,
    validation_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationSuppressionResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    prioritization_hash: result.prioritization_result.integrity_hash,
    decision_hashes: result.suppression_decisions.map((decision) => decision.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.suppression_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationSuppressionResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_suppression_engine_version,
    decision_version: result.decision_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function evaluateAdaptationSuppression(input: AdaptationSuppressionInput = {}): AdaptationSuppressionResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const prioritization_result = input.prioritization_result ?? prioritizeAdaptationProposals({ scenario: prioritizationScenarioFor(scenario) });
  const failures = collectFailures(scenario, replayAdaptationPrioritization(prioritization_result), prioritization_result.failures);
  const suppression_decisions = freezeArray(prioritization_result.prioritized_proposals.map((candidate) => decisionFor(candidate, scenario, failures)));
  const metrics = metricsFor(suppression_decisions, failures);
  const base: Omit<AdaptationSuppressionResult, "integrity_hash" | "replay_hash"> = {
    adaptation_suppression_engine_version: ENGINE_VERSION,
    decision_version: DECISION_VERSION,
    api_surface,
    prioritization_result,
    suppression_decisions,
    metrics,
    suppression_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationPrioritization(prioritization_result),
    explainable: suppression_decisions.every((decision) => Boolean(decision.explanation.remediation_guidance.length)),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && prioritization_result.tenant_isolated,
    evidence_evaluated: !failures.includes("EVIDENCE_CANNOT_BE_EVALUATED"),
    governance_enforced: !failures.includes("GOVERNANCE_ANALYSIS_UNAVAILABLE") && !failures.includes("GOVERNANCE_BYPASS_ATTEMPT"),
    constitutional_enforced: !failures.includes("CONSTITUTIONAL_ANALYSIS_UNAVAILABLE") && !failures.includes("CONSTITUTIONAL_BYPASS_ATTEMPT"),
    advisory_only: true,
    modifies_proposals: false,
    deletes_proposals: false,
    approves_proposals: false,
    rejects_proposals: false,
    implements_proposals: false,
    prioritizes_proposals: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationSuppression(result: AdaptationSuppressionResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationSuppressionFoundation(): AdaptationSuppressionFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_suppression_engine_version: ENGINE_VERSION,
    supported_rules: RULES,
    supported_outcomes: OUTCOMES,
    api_surface,
    result: evaluateAdaptationSuppression(),
  });
}

export const AdaptationSuppressionEngine = Object.freeze({
  evaluate: evaluateAdaptationSuppression,
  replay: replayAdaptationSuppression,
});
