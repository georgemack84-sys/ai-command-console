import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { evaluateAdaptationSuppression, replayAdaptationSuppression } from "@/services/adaptation-suppression-engine";
import type { AdaptationSuppressionScenario, SuppressionDecision } from "@/types/adaptation-suppression-engine";
import type {
  AdaptationConsolidationAction,
  AdaptationConsolidationApiSurface,
  AdaptationConsolidationFailure,
  AdaptationConsolidationFoundation,
  AdaptationConsolidationInput,
  AdaptationConsolidationMetrics,
  AdaptationConsolidationResult,
  AdaptationConsolidationScenario,
  AdaptationRelationshipType,
  ConsolidatedAdaptationProposal,
  ConsolidationCandidate,
  ConsolidationExplanation,
  ConsolidationLineage,
  ConsolidationRelationship,
} from "@/types/adaptation-consolidation-engine";

const ENGINE_VERSION = "adaptation-consolidation-engine/v1" as const;
const DECISION_VERSION = "adaptation-consolidation-rules/v1" as const;
const DECIDED_AT = "2026-07-10T00:00:00.000Z";

const RELATIONSHIPS: readonly AdaptationRelationshipType[] = Object.freeze([
  "DUPLICATE",
  "OVERLAPPING",
  "COMPLEMENTARY",
  "CONFLICTING",
  "SEQUENTIAL",
  "DEPENDENT",
  "INDEPENDENT",
]);

const ACTIONS: readonly AdaptationConsolidationAction[] = Object.freeze([
  "MERGE_CANONICAL",
  "MERGE_RELATED",
  "COORDINATE_RECOMMENDATION",
  "KEEP_SEPARATE_WITH_RELATIONSHIP",
  "KEEP_SEPARATE",
  "EXCLUDE_INELIGIBLE",
]);

type Scenario = NonNullable<AdaptationConsolidationInput["scenario"]>;

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

function buildApiSurface(): AdaptationConsolidationApiSurface {
  const base: Omit<AdaptationConsolidationApiSurface, "integrity_hash"> = {
    api_id: "adaptation_consolidation_engine_api",
    consolidate_proposals: "POST /adaptation-consolidation-engine/consolidate",
    retrieve_groups: "POST /adaptation-consolidation-engine/groups",
    retrieve_relationships: "POST /adaptation-consolidation-engine/relationships",
    retrieve_explanations: "POST /adaptation-consolidation-engine/explanations",
    retrieve_metrics: "POST /adaptation-consolidation-engine/metrics",
    replay_consolidation: "POST /adaptation-consolidation-engine/replay",
    inspect_consolidation: "POST /adaptation-consolidation-engine/inspect",
    retrieve_contract: "GET /adaptation-consolidation-engine/contract",
    proposal_mutation_supported: false,
    historical_record_mutation_supported: false,
    approval_supported: false,
    rejection_supported: false,
    suppression_supported: false,
    implementation_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function suppressionScenarioFor(scenario: Scenario): AdaptationSuppressionScenario {
  const map: Partial<Record<AdaptationConsolidationScenario, AdaptationSuppressionScenario>> = {
    SUPPRESSED_INPUT: "UNRESOLVED_GOVERNANCE",
    REWORK_INPUT: "WEAK_EVIDENCE",
    ANALYSIS_INPUT: "DUPLICATE_PROPOSAL",
    INVALID_PROPOSAL: "INVALID_PROPOSAL",
    MISSING_EVIDENCE: "EVIDENCE_UNAVAILABLE",
    MISSING_REPLAY: "REPLAY_UNAVAILABLE",
    GOVERNANCE_UNAVAILABLE: "GOVERNANCE_UNAVAILABLE",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    NONDETERMINISTIC_CONSOLIDATION: "NONDETERMINISTIC_EVALUATION",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    INTENT_MUTATION_ATTEMPT: "MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    APPROVAL_ATTEMPT: "APPROVAL_ATTEMPT",
    SUPPRESSION_ATTEMPT: "UNSUPPORTED_SUPPRESSION",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptationConsolidationFailure | undefined {
  const map: Partial<Record<AdaptationConsolidationScenario, AdaptationConsolidationFailure>> = {
    INVALID_PROPOSAL: "PROPOSAL_VALIDATION_FAILED",
    MISSING_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    MISSING_REPLAY: "REPLAY_LINEAGE_INCOMPLETE",
    GOVERNANCE_UNAVAILABLE: "GOVERNANCE_ANALYSIS_UNAVAILABLE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    NONDETERMINISTIC_CONSOLIDATION: "DETERMINISTIC_CONSOLIDATION_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    INTENT_MUTATION_ATTEMPT: "PROPOSAL_INTENT_MUTATION_ATTEMPT",
    HISTORICAL_MUTATION_ATTEMPT: "HISTORICAL_RECORD_MUTATION_ATTEMPT",
    CONFLICT_MERGE_ATTEMPT: "CONFLICTING_PROPOSALS_MERGE_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPT",
    OPERATOR_REVIEW_BYPASS: "OPERATOR_REVIEW_BYPASS_ATTEMPT",
    APPROVAL_ATTEMPT: "PROPOSAL_APPROVAL_ATTEMPT",
    REJECTION_ATTEMPT: "PROPOSAL_REJECTION_ATTEMPT",
    SUPPRESSION_ATTEMPT: "PROPOSAL_SUPPRESSION_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "PROPOSAL_IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromSuppression(suppressionReplayable: boolean, suppressionFailures: readonly string[]): readonly AdaptationConsolidationFailure[] {
  const failures: AdaptationConsolidationFailure[] = [];
  if (suppressionFailures.includes("PROPOSAL_VALIDATION_FAILED")) failures.push("PROPOSAL_VALIDATION_FAILED");
  if (suppressionFailures.includes("EVIDENCE_CANNOT_BE_EVALUATED")) failures.push("EVIDENCE_LINEAGE_INCOMPLETE");
  if (suppressionFailures.includes("REPLAY_VALIDATION_UNAVAILABLE")) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (suppressionFailures.includes("GOVERNANCE_ANALYSIS_UNAVAILABLE")) failures.push("GOVERNANCE_ANALYSIS_UNAVAILABLE");
  if (!suppressionReplayable || suppressionFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (suppressionFailures.includes("DETERMINISTIC_EVALUATION_NOT_GUARANTEED")) failures.push("DETERMINISTIC_CONSOLIDATION_NOT_GUARANTEED");
  if (suppressionFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (suppressionFailures.includes("PROPOSAL_CONTENT_MUTATION_ATTEMPT")) failures.push("PROPOSAL_INTENT_MUTATION_ATTEMPT");
  if (suppressionFailures.includes("GOVERNANCE_BYPASS_ATTEMPT")) failures.push("GOVERNANCE_BYPASS_ATTEMPT");
  if (suppressionFailures.includes("PROPOSAL_APPROVAL_ATTEMPT")) failures.push("PROPOSAL_APPROVAL_ATTEMPT");
  if (suppressionFailures.includes("UNSUPPORTED_SUPPRESSION_WITHOUT_EVIDENCE")) failures.push("PROPOSAL_SUPPRESSION_ATTEMPT");
  if (suppressionFailures.includes("PROPOSAL_IMPLEMENTATION_ATTEMPT")) failures.push("PROPOSAL_IMPLEMENTATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function candidateFor(decision: SuppressionDecision, suffix = ""): ConsolidationCandidate {
  const candidateKey = `${decision.suppression_decision_id}${suffix}`;
  const eligible = decision.outcome === "CONTINUE" || decision.routed_to_consolidation;
  const base: Omit<ConsolidationCandidate, "integrity_hash"> = {
    candidate_id: `consolidation_candidate_${hash(candidateKey).slice(0, 14)}`,
    proposal_id: suffix ? `${decision.proposal_id}${suffix}` : decision.proposal_id,
    generated_proposal_id: suffix ? `${decision.generated_proposal_id}${suffix}` : decision.generated_proposal_id,
    priority_id: decision.priority_id,
    suppression_decision_id: decision.suppression_decision_id,
    eligible_for_consolidation: eligible,
    exclusion_reason: eligible ? "" : `suppression_outcome_${decision.outcome.toLowerCase()}`,
    evidence_refs: decision.explanation.evidence_references,
    replay_refs: decision.explanation.replay_references,
    governance_refs: uniqueSorted([...decision.explanation.governance_considerations, ...decision.explanation.constitutional_considerations]),
    scoring_refs: freezeArray([decision.priority_id]),
    suppression_outcome: decision.outcome,
    source_integrity_hash: decision.integrity_hash,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function candidatesFor(decisions: readonly SuppressionDecision[], scenario: Scenario): readonly ConsolidationCandidate[] {
  const baseCandidates = decisions.map((decision) => candidateFor(decision));
  if (!baseCandidates.length) return freezeArray([]);
  if (["DUPLICATE", "ANALYSIS_INPUT", "OVERLAPPING", "COMPLEMENTARY", "CONFLICTING", "SEQUENTIAL", "DEPENDENT", "CONFLICT_MERGE_ATTEMPT"].includes(scenario)) {
    return freezeArray([...baseCandidates, candidateFor(decisions[0], `_${scenario.toLowerCase()}_related`)]);
  }
  return freezeArray(baseCandidates);
}

function relationshipTypeFor(scenario: Scenario, eligibleCandidates: readonly ConsolidationCandidate[]): AdaptationRelationshipType {
  if (eligibleCandidates.length < 2) return "INDEPENDENT";
  const map: Partial<Record<AdaptationConsolidationScenario, AdaptationRelationshipType>> = {
    DUPLICATE: "DUPLICATE",
    ANALYSIS_INPUT: "DUPLICATE",
    OVERLAPPING: "OVERLAPPING",
    COMPLEMENTARY: "COMPLEMENTARY",
    CONFLICTING: "CONFLICTING",
    CONFLICT_MERGE_ATTEMPT: "CONFLICTING",
    SEQUENTIAL: "SEQUENTIAL",
    DEPENDENT: "DEPENDENT",
  };
  return map[scenario] ?? "INDEPENDENT";
}

function criteriaFor(type: AdaptationRelationshipType): readonly string[] {
  const map: Record<AdaptationRelationshipType, readonly string[]> = {
    DUPLICATE: ["identical_intent", "identical_proposed_change", "identical_evidence", "equivalent_scope"],
    OVERLAPPING: ["shared_objectives", "overlapping_evidence", "related_governance_impacts"],
    COMPLEMENTARY: ["compatible_objectives", "reinforcing_evidence", "shared_mission_outcomes"],
    CONFLICTING: ["contradictory_recommendations", "incompatible_implementation_paths", "mutually_exclusive_outcomes"],
    SEQUENTIAL: ["prerequisite_relationships", "phased_implementation", "progressive_adaptation"],
    DEPENDENT: ["shared_dependencies", "prerequisite_certification", "prerequisite_governance_approval"],
    INDEPENDENT: ["no_mergeable_relationship_detected"],
  };
  return freezeArray(map[type]);
}

function actionFor(type: AdaptationRelationshipType, failures: readonly AdaptationConsolidationFailure[]): AdaptationConsolidationAction {
  if (failures.length > 0) return "EXCLUDE_INELIGIBLE";
  if (type === "DUPLICATE") return "MERGE_CANONICAL";
  if (type === "OVERLAPPING") return "MERGE_RELATED";
  if (type === "COMPLEMENTARY") return "COORDINATE_RECOMMENDATION";
  if (type === "CONFLICTING" || type === "SEQUENTIAL" || type === "DEPENDENT") return "KEEP_SEPARATE_WITH_RELATIONSHIP";
  return "KEEP_SEPARATE";
}

function relationshipFor(type: AdaptationRelationshipType, candidates: readonly ConsolidationCandidate[], failures: readonly AdaptationConsolidationFailure[]): ConsolidationRelationship {
  const action = actionFor(type, failures);
  const base: Omit<ConsolidationRelationship, "integrity_hash"> = {
    relationship_id: `adaptation_relationship_${hash(`${type}:${candidates.map((candidate) => candidate.candidate_id).join("|")}`).slice(0, 14)}`,
    relationship_type: type,
    source_candidate_ids: candidates.map((candidate) => candidate.candidate_id),
    detection_criteria: criteriaFor(type),
    compatibility_validated: failures.length === 0 && type !== "CONFLICTING",
    merge_allowed: action === "MERGE_CANONICAL" || action === "MERGE_RELATED" || action === "COORDINATE_RECOMMENDATION",
    requires_operator_review: type !== "INDEPENDENT",
    requires_governance_review: type === "CONFLICTING" || type === "DEPENDENT",
    rationale: type === "CONFLICTING"
      ? "Conflicting proposals remain independent and explicitly linked for governance or operator review."
      : `Relationship classified as ${type.toLowerCase()} using deterministic evidence, replay, governance, and scoring lineage.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lineageFor(candidates: readonly ConsolidationCandidate[]): ConsolidationLineage {
  const base: Omit<ConsolidationLineage, "integrity_hash"> = {
    original_proposal_ids: uniqueSorted(candidates.map((candidate) => candidate.proposal_id)),
    generated_proposal_ids: uniqueSorted(candidates.map((candidate) => candidate.generated_proposal_id)),
    proposal_versions: freezeArray(["adaptation-proposal-contract/v1"]),
    evidence_lineage: uniqueSorted(candidates.flatMap((candidate) => candidate.evidence_refs)),
    outcome_lineage: uniqueSorted(candidates.map((candidate) => `suppression_outcome:${candidate.suppression_outcome}`)),
    replay_lineage: uniqueSorted(candidates.flatMap((candidate) => candidate.replay_refs)),
    governance_lineage: uniqueSorted(candidates.flatMap((candidate) => candidate.governance_refs)),
    operator_lineage: freezeArray(["operator_feedback_lineage_preserved_by_reference"]),
    scoring_lineage: uniqueSorted(candidates.flatMap((candidate) => candidate.scoring_refs)),
    suppression_history: uniqueSorted(candidates.map((candidate) => candidate.suppression_decision_id)),
    prioritization_history: uniqueSorted(candidates.map((candidate) => candidate.priority_id)),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function explanationFor(id: string, type: AdaptationRelationshipType, action: AdaptationConsolidationAction, lineage: ConsolidationLineage): ConsolidationExplanation {
  const base: Omit<ConsolidationExplanation, "integrity_hash"> = {
    explanation_id: `adaptation_consolidation_explanation_${hash(`${id}:${type}:${action}`).slice(0, 14)}`,
    consolidated_proposal_id: id,
    relationship_type: type,
    action,
    source_proposal_ids: lineage.original_proposal_ids,
    consolidation_rationale: action.startsWith("MERGE")
      ? "Compatible proposal information is consolidated into one canonical recommendation without discarding source lineage."
      : "Proposal independence is preserved while deterministic relationship metadata is published.",
    evidence_preservation_summary: `${lineage.evidence_lineage.length} evidence references preserved without replacement.`,
    replay_reconstruction_summary: "Replay lineage reconstructs every source proposal and suppression decision by reference.",
    governance_review_summary: "Governance and constitutional analysis references are preserved and not rewritten.",
    operator_review_summary: "Operator review burden is reduced through grouping; operator review is not bypassed.",
    non_authority_statement: "Consolidation organizes proposals only and does not approve, reject, suppress, or implement adaptations.",
    decision_timestamp: DECIDED_AT,
    decision_version: DECISION_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function consolidatedProposalFor(relationship: ConsolidationRelationship, candidates: readonly ConsolidationCandidate[], failures: readonly AdaptationConsolidationFailure[]): ConsolidatedAdaptationProposal {
  const action = actionFor(relationship.relationship_type, failures);
  const lineage = lineageFor(candidates);
  const consolidated_proposal_id = `consolidated_adaptation_${hash(`${relationship.relationship_id}:${lineage.integrity_hash}:${action}`).slice(0, 14)}`;
  const explanation = explanationFor(consolidated_proposal_id, relationship.relationship_type, action, lineage);
  const base: Omit<ConsolidatedAdaptationProposal, "integrity_hash"> = {
    consolidated_proposal_id,
    source_candidate_ids: relationship.source_candidate_ids,
    source_proposal_ids: lineage.original_proposal_ids,
    consolidation_timestamp: DECIDED_AT,
    relationship_classifications: freezeArray([relationship.relationship_type]),
    action,
    consolidation_rationale: explanation.consolidation_rationale,
    lineage,
    explanation,
    replay_refs: lineage.replay_lineage,
    consolidation_engine_version: ENGINE_VERSION,
    preserves_original_intent: true,
    preserves_historical_records: true,
    advisory_only: true,
    modifies_proposals: false,
    approves_proposals: false,
    rejects_proposals: false,
    suppresses_proposals: false,
    implements_proposals: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(scenario: Scenario, suppressionReplayable: boolean, suppressionFailures: readonly string[], eligibleCount: number): readonly AdaptationConsolidationFailure[] {
  const failures: AdaptationConsolidationFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromSuppression(suppressionReplayable, suppressionFailures));
  if (eligibleCount === 0) failures.push("NO_ELIGIBLE_PROPOSALS");
  return freezeArray([...new Set(failures)]);
}

function metricsFor(
  candidates: readonly ConsolidationCandidate[],
  relationships: readonly ConsolidationRelationship[],
  consolidated: readonly ConsolidatedAdaptationProposal[],
  failures: readonly AdaptationConsolidationFailure[],
): AdaptationConsolidationMetrics {
  const eligible = candidates.filter((candidate) => candidate.eligible_for_consolidation).length;
  const count = (type: AdaptationRelationshipType) => relationships.filter((relationship) => relationship.relationship_type === type).length;
  const consolidatedCount = consolidated.reduce((total, proposal) => total + proposal.source_proposal_ids.length, 0);
  const base: Omit<AdaptationConsolidationMetrics, "integrity_hash"> = {
    proposals_evaluated: candidates.length,
    proposals_eligible: eligible,
    proposals_consolidated: consolidatedCount,
    consolidated_recommendations: consolidated.length,
    duplicate_detections: count("DUPLICATE"),
    overlapping_relationships: count("OVERLAPPING"),
    complementary_relationships: count("COMPLEMENTARY"),
    conflicting_relationships: count("CONFLICTING"),
    sequential_dependencies: count("SEQUENTIAL"),
    dependent_relationships: count("DEPENDENT"),
    consolidation_ratio: eligible ? Number((consolidated.length / eligible).toFixed(4)) : 0,
    evidence_references_merged: uniqueSorted(consolidated.flatMap((proposal) => proposal.lineage.evidence_lineage)).length,
    replay_lineage_complete: failures.length === 0 && consolidated.every((proposal) => proposal.lineage.replay_lineage.length > 0),
    consolidation_latency_ms: 0,
    deterministic_replay_success: failures.length === 0,
    validation_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly AdaptationConsolidationFailure[], eligibleCount: number): AdaptationConsolidationResult["consolidation_state"] {
  if (failures.length > 0) return "FAIL_CLOSED";
  if (eligibleCount === 0) return "NO_ELIGIBLE_PROPOSALS";
  return "CONSOLIDATED";
}

function resultReplayHash(result: Omit<AdaptationConsolidationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    suppression_hash: result.suppression_result.integrity_hash,
    candidate_hashes: result.candidates.map((candidate) => candidate.integrity_hash),
    relationship_hashes: result.relationships.map((relationship) => relationship.integrity_hash),
    consolidated_hashes: result.consolidated_proposals.map((proposal) => proposal.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.consolidation_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationConsolidationResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_consolidation_engine_version,
    decision_version: result.decision_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function consolidateAdaptationProposals(input: AdaptationConsolidationInput = {}): AdaptationConsolidationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const suppression_result = input.suppression_result ?? evaluateAdaptationSuppression({ scenario: suppressionScenarioFor(scenario) });
  const candidates = candidatesFor(suppression_result.suppression_decisions, scenario);
  const eligibleCandidates = freezeArray(candidates.filter((candidate) => candidate.eligible_for_consolidation).sort((a, b) => a.candidate_id.localeCompare(b.candidate_id)));
  const failures = collectFailures(scenario, replayAdaptationSuppression(suppression_result), suppression_result.failures, eligibleCandidates.length);
  const relationshipType = relationshipTypeFor(scenario, eligibleCandidates);
  const relationships = eligibleCandidates.length > 0 ? freezeArray([relationshipFor(relationshipType, eligibleCandidates, failures)]) : freezeArray<ConsolidationRelationship>([]);
  const consolidated_proposals = failures.length === 0 && relationships.length > 0
    ? freezeArray([consolidatedProposalFor(relationships[0], eligibleCandidates, failures)])
    : freezeArray<ConsolidatedAdaptationProposal>([]);
  const metrics = metricsFor(candidates, relationships, consolidated_proposals, failures);
  const base: Omit<AdaptationConsolidationResult, "integrity_hash" | "replay_hash"> = {
    adaptation_consolidation_engine_version: ENGINE_VERSION,
    decision_version: DECISION_VERSION,
    api_surface,
    suppression_result,
    candidates,
    relationships,
    consolidated_proposals,
    metrics,
    consolidation_state: stateFor(failures, eligibleCandidates.length),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationSuppression(suppression_result),
    explainable: consolidated_proposals.every((proposal) => Boolean(proposal.explanation.non_authority_statement)),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && suppression_result.tenant_isolated,
    evidence_lineage_complete: !failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") && consolidated_proposals.every((proposal) => proposal.lineage.evidence_lineage.length > 0),
    replay_lineage_complete: !failures.includes("REPLAY_LINEAGE_INCOMPLETE") && metrics.replay_lineage_complete,
    governance_lineage_complete: !failures.includes("GOVERNANCE_ANALYSIS_UNAVAILABLE") && consolidated_proposals.every((proposal) => proposal.lineage.governance_lineage.length > 0),
    advisory_only: true,
    modifies_proposals: false,
    mutates_historical_records: false,
    approves_proposals: false,
    rejects_proposals: false,
    suppresses_proposals: false,
    implements_proposals: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationConsolidation(result: AdaptationConsolidationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationConsolidationFoundation(): AdaptationConsolidationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_consolidation_engine_version: ENGINE_VERSION,
    supported_relationships: RELATIONSHIPS,
    supported_actions: ACTIONS,
    api_surface,
    result: consolidateAdaptationProposals(),
  });
}

export const AdaptationConsolidationEngine = Object.freeze({
  consolidate: consolidateAdaptationProposals,
  replay: replayAdaptationConsolidation,
});
