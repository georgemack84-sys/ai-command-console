import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { explainAdaptationProposals, replayProposalExplanations } from "@/services/proposal-explainability-engine";
import type { ProposalExplainabilityScenario } from "@/types/proposal-explainability-engine";
import type {
  ProposalValidationApiSurface,
  ProposalValidationCategory,
  ProposalValidationCheck,
  ProposalValidationFailure,
  ProposalValidationFoundation,
  ProposalValidationInput,
  ProposalValidationMetrics,
  ProposalValidationOutcome,
  ProposalValidationReport,
  ProposalValidationResult,
  ProposalValidationScenario,
  ProposalValidationState,
} from "@/types/proposal-validation-integrity-engine";

const ENGINE_VERSION = "proposal-validation-integrity-engine/v1" as const;
const RULE_VERSION = "proposal-validation-integrity-rules/v1" as const;
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";

const CATEGORIES: readonly ProposalValidationCategory[] = Object.freeze([
  "IDENTITY",
  "REFERENCES",
  "EVIDENCE",
  "REPLAY",
  "INTEGRITY",
  "TENANT_ISOLATION",
  "SCORING",
  "LINEAGE",
  "SIMULATION_ROUTING",
  "APPROVAL_ROUTING",
  "ROLLBACK_AVAILABILITY",
]);

const OUTCOMES: readonly ProposalValidationOutcome[] = Object.freeze(["VALID", "INVALID", "INCOMPLETE", "CONFLICTING", "REQUIRES_REVIEW"]);

type Scenario = NonNullable<ProposalValidationInput["scenario"]>;

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

function buildApiSurface(): ProposalValidationApiSurface {
  const base: Omit<ProposalValidationApiSurface, "integrity_hash"> = {
    api_id: "proposal_validation_integrity_engine_api",
    validate_proposals: "POST /proposal-validation-integrity-engine/validate",
    retrieve_reports: "POST /proposal-validation-integrity-engine/reports",
    retrieve_checks: "POST /proposal-validation-integrity-engine/checks",
    retrieve_metrics: "POST /proposal-validation-integrity-engine/metrics",
    replay_validation: "POST /proposal-validation-integrity-engine/replay",
    inspect_validation: "POST /proposal-validation-integrity-engine/inspect",
    retrieve_contract: "GET /proposal-validation-integrity-engine/contract",
    proposal_mutation_supported: false,
    score_mutation_supported: false,
    validation_fabrication_supported: false,
    governance_bypass_supported: false,
    implementation_authorization_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function explainabilityScenarioFor(scenario: Scenario): ProposalExplainabilityScenario {
  const map: Partial<Record<ProposalValidationScenario, ProposalExplainabilityScenario>> = {
    CONTRACT_INVALID: "PROPOSAL_VALIDATION_FAILURE",
    MISSING_REFERENCES: "MISSING_EVIDENCE",
    EVIDENCE_FAILURE: "MISSING_EVIDENCE",
    REPLAY_FAILURE: "MISSING_REPLAY",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    LINEAGE_INCOMPLETE: "MISSING_EVIDENCE",
    SIMULATION_ROUTING_INVALID: "MISSING_SIMULATION",
    APPROVAL_ROUTING_INVALID: "MISSING_GOVERNANCE",
    ROLLBACK_MISSING: "MISSING_ROLLBACK",
    NONDETERMINISTIC_VALIDATION: "NONDETERMINISTIC_EXPLANATION",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_MUTATION_ATTEMPT",
    SCORE_MUTATION_ATTEMPT: "SCORE_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS: "HIDE_GOVERNANCE",
    REPLAY_BYPASS: "MISSING_REPLAY",
    INTEGRITY_BYPASS: "INTEGRITY_FAILURE",
    TENANT_BYPASS: "TENANT_VIOLATION",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): ProposalValidationFailure | undefined {
  const map: Partial<Record<ProposalValidationScenario, ProposalValidationFailure>> = {
    CONTRACT_INVALID: "PROPOSAL_CONTRACT_INVALID",
    IDENTITY_INVALID: "PROPOSAL_IDENTITY_INVALID",
    MISSING_REFERENCES: "REQUIRED_REFERENCES_MISSING",
    EVIDENCE_FAILURE: "EVIDENCE_VERIFICATION_FAILED",
    REPLAY_FAILURE: "REPLAY_VERIFICATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    SCORING_INCONSISTENT: "PROPOSAL_SCORING_INCONSISTENT",
    LINEAGE_INCOMPLETE: "PROPOSAL_LINEAGE_INCOMPLETE",
    SIMULATION_ROUTING_INVALID: "SIMULATION_ROUTING_INVALID",
    APPROVAL_ROUTING_INVALID: "APPROVAL_ROUTING_INVALID",
    ROLLBACK_MISSING: "ROLLBACK_REQUIREMENTS_MISSING",
    NONDETERMINISTIC_VALIDATION: "DETERMINISTIC_VALIDATION_NOT_GUARANTEED",
    CONTRADICTORY_REFERENCES: "CONTRADICTORY_REFERENCES_DETECTED",
    INCONSISTENT_ROUTING: "INCONSISTENT_ROUTING_DETECTED",
    CONFLICTING_LINEAGE: "CONFLICTING_LINEAGE_DETECTED",
    AMBIGUOUS_EVIDENCE: "AMBIGUOUS_EVIDENCE_REQUIRES_REVIEW",
    EXCEPTIONAL_GOVERNANCE: "EXCEPTIONAL_GOVERNANCE_REVIEW_REQUIRED",
    CERTIFICATION_QUESTION: "UNRESOLVED_CERTIFICATION_QUESTION",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    SCORE_MUTATION_ATTEMPT: "PROPOSAL_SCORE_MUTATION_ATTEMPT",
    FABRICATED_VALIDATION: "VALIDATION_RESULT_FABRICATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPT",
    REPLAY_BYPASS: "REPLAY_BYPASS_ATTEMPT",
    INTEGRITY_BYPASS: "INTEGRITY_BYPASS_ATTEMPT",
    TENANT_BYPASS: "TENANT_ISOLATION_BYPASS_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_AUTHORIZATION_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromExplainability(explainabilityReplayable: boolean, explainabilityFailures: readonly string[]): readonly ProposalValidationFailure[] {
  const failures: ProposalValidationFailure[] = [];
  if (explainabilityFailures.includes("PROPOSAL_VALIDATION_FAILED")) failures.push("PROPOSAL_CONTRACT_INVALID");
  if (explainabilityFailures.includes("EVIDENCE_REFERENCES_INCOMPLETE")) failures.push("EVIDENCE_VERIFICATION_FAILED");
  if (!explainabilityReplayable || explainabilityFailures.includes("REPLAY_REFERENCES_MISSING")) failures.push("REPLAY_VERIFICATION_FAILED");
  if (explainabilityFailures.includes("GOVERNANCE_ANALYSIS_UNAVAILABLE")) failures.push("APPROVAL_ROUTING_INVALID");
  if (explainabilityFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (explainabilityFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (explainabilityFailures.includes("DETERMINISTIC_EXPLANATION_NOT_GUARANTEED")) failures.push("DETERMINISTIC_VALIDATION_NOT_GUARANTEED");
  if (explainabilityFailures.includes("SIMULATION_REQUIREMENTS_UNAVAILABLE")) failures.push("SIMULATION_ROUTING_INVALID");
  if (explainabilityFailures.includes("ROLLBACK_REQUIREMENTS_UNAVAILABLE")) failures.push("ROLLBACK_REQUIREMENTS_MISSING");
  if (explainabilityFailures.includes("PROPOSAL_CONTENT_MUTATION_ATTEMPT")) failures.push("PROPOSAL_CONTENT_MUTATION_ATTEMPT");
  if (explainabilityFailures.includes("PROPOSAL_SCORE_MUTATION_ATTEMPT")) failures.push("PROPOSAL_SCORE_MUTATION_ATTEMPT");
  if (explainabilityFailures.includes("PROPOSAL_APPROVAL_ATTEMPT")) failures.push("GOVERNANCE_BYPASS_ATTEMPT");
  if (explainabilityFailures.includes("IMPLEMENTATION_AUTHORIZATION_ATTEMPT")) failures.push("IMPLEMENTATION_AUTHORIZATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, explainabilityReplayable: boolean, explainabilityFailures: readonly string[]): readonly ProposalValidationFailure[] {
  const failures: ProposalValidationFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromExplainability(explainabilityReplayable, explainabilityFailures));
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(failures: readonly ProposalValidationFailure[]): ProposalValidationOutcome {
  if (failures.length === 0) return "VALID";
  if (failures.some((failure) => ["REQUIRED_REFERENCES_MISSING", "EVIDENCE_VERIFICATION_FAILED", "ROLLBACK_REQUIREMENTS_MISSING", "PROPOSAL_LINEAGE_INCOMPLETE"].includes(failure))) return "INCOMPLETE";
  if (failures.some((failure) => ["CONTRADICTORY_REFERENCES_DETECTED", "INCONSISTENT_ROUTING_DETECTED", "CONFLICTING_LINEAGE_DETECTED"].includes(failure))) return "CONFLICTING";
  if (failures.some((failure) => ["AMBIGUOUS_EVIDENCE_REQUIRES_REVIEW", "EXCEPTIONAL_GOVERNANCE_REVIEW_REQUIRED", "UNRESOLVED_CERTIFICATION_QUESTION"].includes(failure))) return "REQUIRES_REVIEW";
  return "INVALID";
}

function categoryFailure(category: ProposalValidationCategory, failures: readonly ProposalValidationFailure[]): ProposalValidationFailure | undefined {
  const map: Record<ProposalValidationCategory, readonly ProposalValidationFailure[]> = {
    IDENTITY: ["PROPOSAL_CONTRACT_INVALID", "PROPOSAL_IDENTITY_INVALID"],
    REFERENCES: ["REQUIRED_REFERENCES_MISSING", "CONTRADICTORY_REFERENCES_DETECTED"],
    EVIDENCE: ["EVIDENCE_VERIFICATION_FAILED", "AMBIGUOUS_EVIDENCE_REQUIRES_REVIEW"],
    REPLAY: ["REPLAY_VERIFICATION_FAILED", "REPLAY_BYPASS_ATTEMPT"],
    INTEGRITY: ["INTEGRITY_VERIFICATION_FAILED", "INTEGRITY_BYPASS_ATTEMPT"],
    TENANT_ISOLATION: ["TENANT_ISOLATION_VIOLATED", "TENANT_ISOLATION_BYPASS_ATTEMPT"],
    SCORING: ["PROPOSAL_SCORING_INCONSISTENT", "PROPOSAL_SCORE_MUTATION_ATTEMPT"],
    LINEAGE: ["PROPOSAL_LINEAGE_INCOMPLETE", "CONFLICTING_LINEAGE_DETECTED"],
    SIMULATION_ROUTING: ["SIMULATION_ROUTING_INVALID", "INCONSISTENT_ROUTING_DETECTED"],
    APPROVAL_ROUTING: ["APPROVAL_ROUTING_INVALID", "GOVERNANCE_BYPASS_ATTEMPT", "EXCEPTIONAL_GOVERNANCE_REVIEW_REQUIRED"],
    ROLLBACK_AVAILABILITY: ["ROLLBACK_REQUIREMENTS_MISSING"],
  };
  return map[category].find((failure) => failures.includes(failure));
}

function checkFor(category: ProposalValidationCategory, proposalId: string, evidenceRefs: readonly string[], replayRefs: readonly string[], failures: readonly ProposalValidationFailure[]): ProposalValidationCheck {
  const failure = categoryFailure(category, failures);
  const base: Omit<ProposalValidationCheck, "integrity_hash"> = {
    check_id: `proposal_validation_check_${hash(`${proposalId}:${category}`).slice(0, 14)}`,
    category,
    check_name: `${category.toLowerCase()}_validation`,
    passed: !failure && !failures.some((item) => ["DETERMINISTIC_VALIDATION_NOT_GUARANTEED", "VALIDATION_RESULT_FABRICATION_ATTEMPT", "IMPLEMENTATION_AUTHORIZATION_ATTEMPT"].includes(item)),
    evidence_references: evidenceRefs,
    replay_references: replayRefs,
    remediation: failure ? `remediate_${failure.toLowerCase()}` : "no_remediation_required",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function reportFor(proposalId: string, outcome: ProposalValidationOutcome, failures: readonly ProposalValidationFailure[], replayRefs: readonly string[]): ProposalValidationReport {
  const evidenceRefs = freezeArray([`evidence:${proposalId}`, `lineage:${proposalId}`, `explanation:${proposalId}`]);
  const checks = freezeArray(CATEGORIES.map((category) => checkFor(category, proposalId, evidenceRefs, replayRefs, failures)));
  const failedChecks = freezeArray(checks.filter((check) => !check.passed));
  const base: Omit<ProposalValidationReport, "integrity_hash"> = {
    validation_id: `proposal_validation_${hash(`${proposalId}:${outcome}:${failures.join("|")}`).slice(0, 14)}`,
    proposal_id: proposalId,
    validation_timestamp: VALIDATED_AT,
    engine_version: ENGINE_VERSION,
    validation_outcome: outcome,
    completed_checks: checks,
    failed_checks: failedChecks,
    warnings: outcome === "REQUIRES_REVIEW" ? freezeArray(["manual_review_required_before_progression"]) : freezeArray([]),
    integrity_verification: !failures.includes("INTEGRITY_VERIFICATION_FAILED") && !failures.includes("INTEGRITY_BYPASS_ATTEMPT"),
    replay_verification: !failures.includes("REPLAY_VERIFICATION_FAILED") && !failures.includes("REPLAY_BYPASS_ATTEMPT"),
    tenant_isolation_verification: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("TENANT_ISOLATION_BYPASS_ATTEMPT"),
    recommended_remediation: failures.length ? freezeArray(failures.map((failure) => `remediate_${failure.toLowerCase()}`)) : freezeArray(["proposal_ready_for_downstream_workflow_without_implementation_authority"]),
    may_progress_to_governance_review: outcome === "VALID" && failedChecks.length === 0,
    advisory_only: true,
    modifies_proposal: false,
    modifies_scores: false,
    authorizes_implementation: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function outcomeCounts(reports: readonly ProposalValidationReport[]): Readonly<Record<ProposalValidationOutcome, number>> {
  const counts = OUTCOMES.reduce((acc, outcome) => ({ ...acc, [outcome]: 0 }), {} as Record<ProposalValidationOutcome, number>);
  reports.forEach((report) => {
    counts[report.validation_outcome] += 1;
  });
  return Object.freeze(counts);
}

function metricsFor(reports: readonly ProposalValidationReport[], failures: readonly ProposalValidationFailure[]): ProposalValidationMetrics {
  const validated = reports.length;
  const successes = reports.filter((report) => report.validation_outcome === "VALID").length;
  const base: Omit<ProposalValidationMetrics, "integrity_hash"> = {
    proposals_validated: validated,
    validation_success_rate: validated ? Number((successes / validated).toFixed(4)) : 0,
    validation_failures: failures.length,
    validation_outcomes: outcomeCounts(reports),
    integrity_verification_failures: failures.filter((failure) => ["INTEGRITY_VERIFICATION_FAILED", "INTEGRITY_BYPASS_ATTEMPT"].includes(failure)).length,
    replay_verification_failures: failures.filter((failure) => ["REPLAY_VERIFICATION_FAILED", "REPLAY_BYPASS_ATTEMPT"].includes(failure)).length,
    tenant_isolation_violations: failures.filter((failure) => ["TENANT_ISOLATION_VIOLATED", "TENANT_ISOLATION_BYPASS_ATTEMPT"].includes(failure)).length,
    reference_validation_failures: failures.filter((failure) => ["REQUIRED_REFERENCES_MISSING", "CONTRADICTORY_REFERENCES_DETECTED"].includes(failure)).length,
    simulation_routing_failures: failures.includes("SIMULATION_ROUTING_INVALID") ? 1 : 0,
    approval_routing_failures: failures.includes("APPROVAL_ROUTING_INVALID") || failures.includes("GOVERNANCE_BYPASS_ATTEMPT") ? 1 : 0,
    rollback_readiness_failures: failures.includes("ROLLBACK_REQUIREMENTS_MISSING") ? 1 : 0,
    validation_latency_ms: 0,
    deterministic_replay_success: failures.length === 0,
    validation_failure_reasons: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly ProposalValidationFailure[]): ProposalValidationState {
  return failures.length ? "FAIL_CLOSED" : "VALIDATED";
}

function resultReplayHash(result: Omit<ProposalValidationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    explainability_hash: result.explainability_result.integrity_hash,
    report_hashes: result.validation_reports.map((report) => report.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.validation_state,
    outcome: result.validation_outcome,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ProposalValidationResult, "integrity_hash">): string {
  return hash({
    version: result.proposal_validation_integrity_engine_version,
    rule_version: result.validation_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function validateProposalIntegrity(input: ProposalValidationInput = {}): ProposalValidationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const explainability_result = input.explainability_result ?? explainAdaptationProposals({ scenario: explainabilityScenarioFor(scenario) });
  const failures = collectFailures(scenario, replayProposalExplanations(explainability_result), explainability_result.failures);
  const outcome = outcomeFor(failures);
  const proposalIds = explainability_result.explanations.length ? explainability_result.explanations.map((explanation) => explanation.proposal_id) : ["proposal_unavailable"];
  const replayRefs = uniqueSorted(explainability_result.explanations.flatMap((explanation) => explanation.replay_references));
  const validation_reports = failures.length === 0 || ["INCOMPLETE", "CONFLICTING", "REQUIRES_REVIEW"].includes(outcome)
    ? freezeArray(proposalIds.map((proposalId) => reportFor(proposalId, outcome, failures, replayRefs.length ? replayRefs : [explainability_result.replay_hash])))
    : freezeArray<ProposalValidationReport>([]);
  const metrics = metricsFor(validation_reports, failures);
  const base: Omit<ProposalValidationResult, "integrity_hash" | "replay_hash"> = {
    proposal_validation_integrity_engine_version: ENGINE_VERSION,
    validation_rule_version: RULE_VERSION,
    api_surface,
    explainability_result,
    validation_reports,
    metrics,
    validation_state: stateFor(failures),
    validation_outcome: outcome,
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayProposalExplanations(explainability_result),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("TENANT_ISOLATION_BYPASS_ATTEMPT") && explainability_result.tenant_isolated,
    proposal_contents_unchanged: true,
    advisory_only: true,
    modifies_proposals: false,
    modifies_scores: false,
    changes_governance_decisions: false,
    authorizes_implementation: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayProposalValidation(result: ProposalValidationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getProposalValidationFoundation(): ProposalValidationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    proposal_validation_integrity_engine_version: ENGINE_VERSION,
    supported_categories: CATEGORIES,
    supported_outcomes: OUTCOMES,
    api_surface,
    result: validateProposalIntegrity(),
  });
}

export const ProposalValidationIntegrityEngine = Object.freeze({
  validate: validateProposalIntegrity,
  replay: replayProposalValidation,
});
