import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateProposalLifecycle, replayProposalLifecycle } from "@/services/proposal-lifecycle-state-machine";
import type { ProposalLifecycleScenario } from "@/types/proposal-lifecycle-state-machine";
import type {
  ProposalExplainabilityApiSurface,
  ProposalExplainabilityFailure,
  ProposalExplainabilityFoundation,
  ProposalExplainabilityInput,
  ProposalExplainabilityMetrics,
  ProposalExplainabilityResult,
  ProposalExplainabilityScenario,
  ProposalExplainabilityState,
  ProposalExplanation,
  ProposalExplanationComponent,
  ProposalExplanationComponentType,
} from "@/types/proposal-explainability-engine";

const ENGINE_VERSION = "proposal-explainability-engine/v1" as const;
const RULE_VERSION = "proposal-explainability-rules/v1" as const;
const EXPLAINED_AT = "2026-07-10T00:00:00.000Z";

const COMPONENTS: readonly ProposalExplanationComponentType[] = Object.freeze([
  "GENERATION_RATIONALE",
  "EVIDENCE_USED",
  "PATTERNS_DETECTED",
  "FEEDBACK_CONSIDERED",
  "EXPECTED_IMPROVEMENTS",
  "EXPECTED_RISKS",
  "GOVERNANCE_EFFECTS",
  "CONSTITUTIONAL_EFFECTS",
  "AUTHORITY_EFFECTS",
  "OPERATOR_EFFECTS",
  "SIMULATION_REQUIREMENTS",
  "CERTIFICATION_REQUIREMENTS",
  "ROLLBACK_REQUIREMENTS",
]);

type Scenario = NonNullable<ProposalExplainabilityInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): ProposalExplainabilityApiSurface {
  const base: Omit<ProposalExplainabilityApiSurface, "integrity_hash"> = {
    api_id: "proposal_explainability_engine_api",
    explain_proposals: "POST /proposal-explainability-engine/explain",
    retrieve_explanations: "POST /proposal-explainability-engine/explanations",
    retrieve_components: "POST /proposal-explainability-engine/components",
    retrieve_metrics: "POST /proposal-explainability-engine/metrics",
    replay_explanations: "POST /proposal-explainability-engine/replay",
    inspect_explainability: "POST /proposal-explainability-engine/inspect",
    retrieve_contract: "GET /proposal-explainability-engine/contract",
    proposal_mutation_supported: false,
    score_mutation_supported: false,
    approval_supported: false,
    implementation_authorization_supported: false,
    reasoning_fabrication_supported: false,
    evidence_omission_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lifecycleScenarioFor(scenario: Scenario): ProposalLifecycleScenario {
  const map: Partial<Record<ProposalExplainabilityScenario, ProposalLifecycleScenario>> = {
    REJECTION_PATH: "REJECTION_PATH",
    SUPPRESSION_PATH: "SUPPRESSION_PATH",
    ROLLBACK_PATH: "ROLLBACK_PATH",
    PROPOSAL_VALIDATION_FAILURE: "INVALID_CURRENT_STATE",
    MISSING_REPLAY: "REPLAY_FAILURE",
    MISSING_GOVERNANCE: "GOVERNANCE_FAILURE",
    MISSING_CONSTITUTIONAL: "CONSTITUTIONAL_FAILURE",
    MISSING_AUTHORITY: "AUTHORITY_VIOLATION",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    NONDETERMINISTIC_EXPLANATION: "NONDETERMINISTIC_TRANSITION",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_MUTATION_ATTEMPT",
    APPROVAL_ATTEMPT: "GOVERNANCE_BYPASS",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): ProposalExplainabilityFailure | undefined {
  const map: Partial<Record<ProposalExplainabilityScenario, ProposalExplainabilityFailure>> = {
    PROPOSAL_VALIDATION_FAILURE: "PROPOSAL_VALIDATION_FAILED",
    MISSING_EVIDENCE: "EVIDENCE_REFERENCES_INCOMPLETE",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_ANALYSIS_UNAVAILABLE",
    MISSING_CONSTITUTIONAL: "CONSTITUTIONAL_ANALYSIS_UNAVAILABLE",
    MISSING_AUTHORITY: "AUTHORITY_ANALYSIS_UNAVAILABLE",
    MISSING_OPERATOR: "OPERATOR_ANALYSIS_UNAVAILABLE",
    MISSING_SIMULATION: "SIMULATION_REQUIREMENTS_UNAVAILABLE",
    MISSING_CERTIFICATION: "CERTIFICATION_REQUIREMENTS_UNAVAILABLE",
    MISSING_ROLLBACK: "ROLLBACK_REQUIREMENTS_UNAVAILABLE",
    IMPACTS_UNEXPLAINED: "REQUIRED_IMPACTS_UNEXPLAINED",
    INCOMPLETE_EXPLANATION: "EXPLANATION_COMPLETENESS_NOT_ACHIEVED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    NONDETERMINISTIC_EXPLANATION: "DETERMINISTIC_EXPLANATION_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    FABRICATED_REASONING: "REASONING_FABRICATION_ATTEMPT",
    OMITTED_EVIDENCE: "SUPPORTING_EVIDENCE_OMISSION_ATTEMPT",
    HIDE_GOVERNANCE: "GOVERNANCE_IMPACT_HIDE_ATTEMPT",
    HIDE_CONSTITUTIONAL: "CONSTITUTIONAL_IMPACT_HIDE_ATTEMPT",
    HIDE_OPERATOR: "OPERATOR_IMPACT_HIDE_ATTEMPT",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    SCORE_MUTATION_ATTEMPT: "PROPOSAL_SCORE_MUTATION_ATTEMPT",
    APPROVAL_ATTEMPT: "PROPOSAL_APPROVAL_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_AUTHORIZATION_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromLifecycle(lifecycleReplayable: boolean, lifecycleFailures: readonly string[]): readonly ProposalExplainabilityFailure[] {
  const failures: ProposalExplainabilityFailure[] = [];
  if (lifecycleFailures.includes("CURRENT_STATE_INVALID")) failures.push("PROPOSAL_VALIDATION_FAILED");
  if (!lifecycleReplayable || lifecycleFailures.includes("REPLAY_VERIFICATION_FAILED")) failures.push("REPLAY_REFERENCES_MISSING");
  if (lifecycleFailures.includes("GOVERNANCE_VALIDATION_FAILED") || lifecycleFailures.includes("GOVERNANCE_BYPASS_ATTEMPT")) failures.push("GOVERNANCE_ANALYSIS_UNAVAILABLE");
  if (lifecycleFailures.includes("CONSTITUTIONAL_VALIDATION_FAILED")) failures.push("CONSTITUTIONAL_ANALYSIS_UNAVAILABLE");
  if (lifecycleFailures.includes("AUTHORITY_BOUNDARY_VIOLATED")) failures.push("AUTHORITY_ANALYSIS_UNAVAILABLE");
  if (lifecycleFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (lifecycleFailures.includes("DETERMINISTIC_TRANSITION_NOT_GUARANTEED")) failures.push("DETERMINISTIC_EXPLANATION_NOT_GUARANTEED");
  if (lifecycleFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (lifecycleFailures.includes("PROPOSAL_CONTENT_MUTATION_ATTEMPT")) failures.push("PROPOSAL_CONTENT_MUTATION_ATTEMPT");
  if (lifecycleFailures.includes("PRODUCTION_IMPLEMENTATION_AUTHORIZATION_ATTEMPT")) failures.push("IMPLEMENTATION_AUTHORIZATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, lifecycleReplayable: boolean, lifecycleFailures: readonly string[]): readonly ProposalExplainabilityFailure[] {
  const failures: ProposalExplainabilityFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromLifecycle(lifecycleReplayable, lifecycleFailures));
  return freezeArray([...new Set(failures)]);
}

function titleFor(type: ProposalExplanationComponentType): string {
  return type.toLowerCase();
}

function narrativeFor(type: ProposalExplanationComponentType, proposalId: string): string {
  const map: Record<ProposalExplanationComponentType, string> = {
    GENERATION_RATIONALE: `Proposal ${proposalId} exists because recorded outcomes, recommendations, and adaptive objectives indicate a reviewable improvement opportunity.`,
    EVIDENCE_USED: "Supporting evidence is attributed through immutable lineage, ledger, and lifecycle replay references.",
    PATTERNS_DETECTED: "Recurring outcome, risk, confidence, and operator-observation patterns are explained by referenced historical records.",
    FEEDBACK_CONSIDERED: "Validated operator approvals, rejections, overrides, and recommendations are considered as advisory influence.",
    EXPECTED_IMPROVEMENTS: "Expected improvements cover mission, recommendation, operator, governance, evidence, and strategic outcomes.",
    EXPECTED_RISKS: "Expected risks cover operational, governance, constitutional, authority, implementation, and operator impacts.",
    GOVERNANCE_EFFECTS: "Governance effects describe policy impacts, routing, escalation requirements, and compliance considerations.",
    CONSTITUTIONAL_EFFECTS: "Constitutional effects describe constraints and safeguards required before downstream advancement.",
    AUTHORITY_EFFECTS: "Authority effects describe boundary checks and prevent unauthorized implementation authority.",
    OPERATOR_EFFECTS: "Operator effects describe visibility, workflow impact, review effort, and decision complexity.",
    SIMULATION_REQUIREMENTS: "Simulation requirements describe objectives, scope, dependencies, expected outcomes, and readiness.",
    CERTIFICATION_REQUIREMENTS: "Certification requirements describe prerequisites, evidence, governance completion, validation scope, and readiness.",
    ROLLBACK_REQUIREMENTS: "Rollback requirements describe strategy, triggers, prerequisites, dependencies, and replay requirements.",
  };
  return map[type];
}

function componentFor(type: ProposalExplanationComponentType, proposalId: string, evidenceRefs: readonly string[], replayRefs: readonly string[], governanceRefs: readonly string[], failures: readonly ProposalExplainabilityFailure[]): ProposalExplanationComponent {
  const blockedBy = new Set<ProposalExplainabilityFailure>(failures);
  const complete = failures.length === 0;
  const base: Omit<ProposalExplanationComponent, "integrity_hash"> = {
    component_id: `proposal_explanation_component_${hash(`${proposalId}:${type}`).slice(0, 14)}`,
    component_type: type,
    title: titleFor(type),
    narrative: narrativeFor(type, proposalId),
    evidence_references: type === "EVIDENCE_USED" || type === "EXPECTED_IMPROVEMENTS" || type === "EXPECTED_RISKS" ? evidenceRefs : freezeArray(evidenceRefs.slice(0, 2)),
    replay_references: replayRefs,
    governance_references: type.includes("GOVERNANCE") || type.includes("CONSTITUTIONAL") || type.includes("AUTHORITY") ? governanceRefs : freezeArray(governanceRefs.slice(0, 2)),
    machine_verifiable_claims: freezeArray([
      `${type.toLowerCase()}_is_traceable`,
      "advisory_only_explanation",
      "no_implementation_authority_granted",
      ...(blockedBy.size ? ["explanation_blocked_by_validation_failure"] : ["explanation_complete"]),
    ]),
    complete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function explanationFor(proposalId: string, replayRefs: readonly string[], governanceRefs: readonly string[], failures: readonly ProposalExplainabilityFailure[]): ProposalExplanation {
  const evidenceRefs = freezeArray([`evidence:${proposalId}`, `lineage:${proposalId}`, `ledger:${proposalId}`]);
  const components = freezeArray(COMPONENTS.map((component) => componentFor(component, proposalId, evidenceRefs, replayRefs, governanceRefs, failures)));
  const complete = failures.length === 0 && components.every((component) => component.complete);
  const base: Omit<ProposalExplanation, "integrity_hash"> = {
    explanation_id: `proposal_explanation_${hash(`${proposalId}:${components.map((component) => component.integrity_hash).join("|")}`).slice(0, 14)}`,
    proposal_id: proposalId,
    proposal_summary: `Proposal ${proposalId} is explained from immutable lifecycle, ledger, lineage, and replay history.`,
    components,
    replay_references: replayRefs,
    explanation_version: ENGINE_VERSION,
    explanation_timestamp: EXPLAINED_AT,
    complete,
    deterministic: true,
    evidence_backed: complete,
    traceable: complete,
    reproducible: complete,
    understandable: complete,
    governance_aware: complete,
    constitutionally_compliant: complete,
    replayable: complete,
    can_advance_to_approval: complete,
    advisory_only: true,
    modifies_proposal: false,
    modifies_scores: false,
    approves_proposal: false,
    authorizes_implementation: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metricsFor(explanations: readonly ProposalExplanation[], failures: readonly ProposalExplainabilityFailure[]): ProposalExplainabilityMetrics {
  const explained = explanations.length;
  const complete = explanations.filter((explanation) => explanation.complete).length;
  const componentCoverage = (type: ProposalExplanationComponentType) => explained ? Number((explanations.filter((explanation) => explanation.components.some((component) => component.component_type === type && component.complete)).length / explained).toFixed(4)) : 0;
  const base: Omit<ProposalExplainabilityMetrics, "integrity_hash"> = {
    proposals_explained: explained,
    explanation_completeness: explained ? Number((complete / explained).toFixed(4)) : 0,
    evidence_attribution_coverage: componentCoverage("EVIDENCE_USED"),
    governance_explanation_coverage: componentCoverage("GOVERNANCE_EFFECTS"),
    operator_explanation_coverage: componentCoverage("OPERATOR_EFFECTS"),
    simulation_explanation_coverage: componentCoverage("SIMULATION_REQUIREMENTS"),
    certification_explanation_coverage: componentCoverage("CERTIFICATION_REQUIREMENTS"),
    rollback_explanation_coverage: componentCoverage("ROLLBACK_REQUIREMENTS"),
    explanation_generation_latency_ms: 0,
    explanation_validation_failures: failures,
    deterministic_replay_success: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly ProposalExplainabilityFailure[]): ProposalExplainabilityState {
  return failures.length ? "FAIL_CLOSED" : "EXPLAINED";
}

function resultReplayHash(result: Omit<ProposalExplainabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    lifecycle_hash: result.lifecycle_result.integrity_hash,
    explanation_hashes: result.explanations.map((explanation) => explanation.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.explainability_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ProposalExplainabilityResult, "integrity_hash">): string {
  return hash({
    version: result.proposal_explainability_engine_version,
    rule_version: result.explanation_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function explainAdaptationProposals(input: ProposalExplainabilityInput = {}): ProposalExplainabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const lifecycle_result = input.lifecycle_result ?? evaluateProposalLifecycle({ scenario: lifecycleScenarioFor(scenario) });
  const failures = collectFailures(scenario, replayProposalLifecycle(lifecycle_result), lifecycle_result.failures);
  const proposalIds = Object.keys(lifecycle_result.current_states);
  const replayRefs = uniqueSorted(lifecycle_result.transitions.map((transition) => transition.replay_reference));
  const governanceRefs = uniqueSorted(lifecycle_result.transitions.flatMap((transition) => transition.governance_references));
  const explanations = failures.length === 0
    ? freezeArray(proposalIds.map((proposalId) => explanationFor(proposalId, replayRefs, governanceRefs, failures)))
    : freezeArray<ProposalExplanation>([]);
  const metrics = metricsFor(explanations, failures);
  const complete = failures.length === 0 && explanations.length > 0 && explanations.every((explanation) => explanation.complete);
  const base: Omit<ProposalExplainabilityResult, "integrity_hash" | "replay_hash"> = {
    proposal_explainability_engine_version: ENGINE_VERSION,
    explanation_rule_version: RULE_VERSION,
    api_surface,
    lifecycle_result,
    explanations,
    metrics,
    explainability_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayProposalLifecycle(lifecycle_result),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && lifecycle_result.tenant_isolated,
    complete,
    evidence_backed: complete,
    governance_aware: complete,
    constitutionally_compliant: complete,
    advisory_only: true,
    modifies_proposals: false,
    modifies_scores: false,
    approves_proposals: false,
    authorizes_implementation: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayProposalExplanations(result: ProposalExplainabilityResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getProposalExplainabilityFoundation(): ProposalExplainabilityFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    proposal_explainability_engine_version: ENGINE_VERSION,
    supported_components: COMPONENTS,
    api_surface,
    result: explainAdaptationProposals(),
  });
}

export const ProposalExplainabilityEngine = Object.freeze({
  explain: explainAdaptationProposals,
  replay: replayProposalExplanations,
});
