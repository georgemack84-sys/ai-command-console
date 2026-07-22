import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { consolidateAdaptationProposals, replayAdaptationConsolidation } from "@/services/adaptation-consolidation-engine";
import type { AdaptationConsolidationScenario, ConsolidatedAdaptationProposal } from "@/types/adaptation-consolidation-engine";
import type {
  ProposalDependencyGraph,
  ProposalLineageBindingState,
  ProposalLineageRecord,
  ProposalLineageReference,
  ProposalLineageReferenceCategory,
  ProposalLineageReplayApiSurface,
  ProposalLineageReplayFailure,
  ProposalLineageReplayFoundation,
  ProposalLineageReplayInput,
  ProposalLineageReplayMetrics,
  ProposalLineageReplayResult,
  ProposalLineageReplayScenario,
  ProposalReplayGraph,
  ProposalTraceability,
} from "@/types/proposal-lineage-replay-binder";

const BINDER_VERSION = "proposal-lineage-replay-binder/v1" as const;
const BINDING_VERSION = "proposal-lineage-binding-rules/v1" as const;
const REPLAY_VERSION = "proposal-lineage-replay/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

const REFERENCE_CATEGORIES: readonly ProposalLineageReferenceCategory[] = Object.freeze([
  "OUTCOME",
  "RECOMMENDATION",
  "EVIDENCE",
  "SIMULATION",
  "OPERATOR_FEEDBACK",
  "GOVERNANCE_REVIEW",
  "CERTIFICATION_HISTORY",
  "RISK_RECORD",
  "CONFIDENCE_RECORD",
  "SCORING",
  "PRIORITIZATION",
  "SUPPRESSION",
  "CONSOLIDATION",
]);

type Scenario = NonNullable<ProposalLineageReplayInput["scenario"]>;

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

function buildApiSurface(): ProposalLineageReplayApiSurface {
  const base: Omit<ProposalLineageReplayApiSurface, "integrity_hash"> = {
    api_id: "proposal_lineage_replay_binder_api",
    bind_lineage: "POST /proposal-lineage-replay-binder/bind",
    retrieve_records: "POST /proposal-lineage-replay-binder/records",
    retrieve_replay_graphs: "POST /proposal-lineage-replay-binder/replay-graphs",
    retrieve_dependency_graphs: "POST /proposal-lineage-replay-binder/dependency-graphs",
    retrieve_metrics: "POST /proposal-lineage-replay-binder/metrics",
    replay_lineage: "POST /proposal-lineage-replay-binder/replay",
    inspect_lineage: "POST /proposal-lineage-replay-binder/inspect",
    retrieve_contract: "GET /proposal-lineage-replay-binder/contract",
    proposal_mutation_supported: false,
    historical_record_mutation_supported: false,
    lineage_rewrite_supported: false,
    approval_supported: false,
    rejection_supported: false,
    implementation_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function consolidationScenarioFor(scenario: Scenario): AdaptationConsolidationScenario {
  const map: Partial<Record<ProposalLineageReplayScenario, AdaptationConsolidationScenario>> = {
    DUPLICATE_CONSOLIDATION: "DUPLICATE",
    OVERLAPPING_CONSOLIDATION: "OVERLAPPING",
    CONFLICTING_RELATIONSHIP: "CONFLICTING",
    MISSING_REFERENCES: "MISSING_EVIDENCE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    REPLAY_GRAPH_FAILURE: "MISSING_REPLAY",
    MISSING_GOVERNANCE: "GOVERNANCE_UNAVAILABLE",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    DEPENDENCY_INCONSISTENT: "NONDETERMINISTIC_CONSOLIDATION",
    NONDETERMINISTIC_REPLAY: "NONDETERMINISTIC_CONSOLIDATION",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    NO_BINDABLE_PROPOSALS: "SUPPRESSED_INPUT",
    PROPOSAL_MUTATION_ATTEMPT: "INTENT_MUTATION_ATTEMPT",
    HISTORICAL_MUTATION_ATTEMPT: "HISTORICAL_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    APPROVAL_ATTEMPT: "APPROVAL_ATTEMPT",
    REJECTION_ATTEMPT: "REJECTION_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): ProposalLineageReplayFailure | undefined {
  const map: Partial<Record<ProposalLineageReplayScenario, ProposalLineageReplayFailure>> = {
    MISSING_REFERENCES: "REQUIRED_REFERENCES_MISSING",
    MISSING_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    REPLAY_GRAPH_FAILURE: "REPLAY_GRAPH_GENERATION_FAILED",
    MISSING_GOVERNANCE: "GOVERNANCE_HISTORY_INCOMPLETE",
    MISSING_CERTIFICATION: "CERTIFICATION_HISTORY_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    DEPENDENCY_INCONSISTENT: "DEPENDENCY_GRAPH_INCONSISTENT",
    NONDETERMINISTIC_REPLAY: "DETERMINISTIC_REPLAY_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    NO_BINDABLE_PROPOSALS: "NO_BINDABLE_PROPOSALS",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    HISTORICAL_MUTATION_ATTEMPT: "HISTORICAL_RECORD_MUTATION_ATTEMPT",
    LINEAGE_REWRITE_ATTEMPT: "LINEAGE_REWRITE_ATTEMPT",
    IMMUTABLE_OVERWRITE_ATTEMPT: "IMMUTABLE_RECORD_OVERWRITE_ATTEMPT",
    DEPENDENCY_FABRICATION: "DEPENDENCY_FABRICATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_HISTORY_BYPASS_ATTEMPT",
    CERTIFICATION_BYPASS: "CERTIFICATION_HISTORY_BYPASS_ATTEMPT",
    OPERATOR_BYPASS: "OPERATOR_HISTORY_BYPASS_ATTEMPT",
    CROSS_TENANT_LINEAGE: "CROSS_TENANT_LINEAGE_ATTEMPT",
    APPROVAL_ATTEMPT: "PROPOSAL_APPROVAL_ATTEMPT",
    REJECTION_ATTEMPT: "PROPOSAL_REJECTION_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "PROPOSAL_IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromConsolidation(consolidationReplayable: boolean, consolidationFailures: readonly string[]): readonly ProposalLineageReplayFailure[] {
  const failures: ProposalLineageReplayFailure[] = [];
  if (consolidationFailures.includes("NO_ELIGIBLE_PROPOSALS")) failures.push("NO_BINDABLE_PROPOSALS");
  if (consolidationFailures.includes("EVIDENCE_LINEAGE_INCOMPLETE")) failures.push("EVIDENCE_LINEAGE_INCOMPLETE");
  if (consolidationFailures.includes("REPLAY_LINEAGE_INCOMPLETE")) failures.push("REPLAY_GRAPH_GENERATION_FAILED");
  if (consolidationFailures.includes("GOVERNANCE_ANALYSIS_UNAVAILABLE")) failures.push("GOVERNANCE_HISTORY_INCOMPLETE");
  if (!consolidationReplayable || consolidationFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (consolidationFailures.includes("DETERMINISTIC_CONSOLIDATION_NOT_GUARANTEED")) failures.push("DETERMINISTIC_REPLAY_NOT_GUARANTEED");
  if (consolidationFailures.includes("TENANT_ISOLATION_VIOLATED")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (consolidationFailures.includes("PROPOSAL_INTENT_MUTATION_ATTEMPT")) failures.push("PROPOSAL_CONTENT_MUTATION_ATTEMPT");
  if (consolidationFailures.includes("HISTORICAL_RECORD_MUTATION_ATTEMPT")) failures.push("HISTORICAL_RECORD_MUTATION_ATTEMPT");
  if (consolidationFailures.includes("GOVERNANCE_BYPASS_ATTEMPT")) failures.push("GOVERNANCE_HISTORY_BYPASS_ATTEMPT");
  if (consolidationFailures.includes("OPERATOR_REVIEW_BYPASS_ATTEMPT")) failures.push("OPERATOR_HISTORY_BYPASS_ATTEMPT");
  if (consolidationFailures.includes("PROPOSAL_APPROVAL_ATTEMPT")) failures.push("PROPOSAL_APPROVAL_ATTEMPT");
  if (consolidationFailures.includes("PROPOSAL_REJECTION_ATTEMPT")) failures.push("PROPOSAL_REJECTION_ATTEMPT");
  if (consolidationFailures.includes("PROPOSAL_IMPLEMENTATION_ATTEMPT")) failures.push("PROPOSAL_IMPLEMENTATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, consolidationReplayable: boolean, consolidationFailures: readonly string[], proposalCount: number): readonly ProposalLineageReplayFailure[] {
  const failures: ProposalLineageReplayFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromConsolidation(consolidationReplayable, consolidationFailures));
  if (proposalCount === 0) failures.push("NO_BINDABLE_PROPOSALS");
  return freezeArray([...new Set(failures)]);
}

function sourcePhaseFor(category: ProposalLineageReferenceCategory): string {
  const map: Record<ProposalLineageReferenceCategory, string> = {
    OUTCOME: "phase-10.1-through-10.2",
    RECOMMENDATION: "phase-10.3",
    EVIDENCE: "phase-10.9.6-and-10.10.3",
    SIMULATION: "phase-10.11",
    OPERATOR_FEEDBACK: "phase-10.9",
    GOVERNANCE_REVIEW: "phase-10.8-and-10.10.5",
    CERTIFICATION_HISTORY: "phase-10.10.10",
    RISK_RECORD: "phase-10.7",
    CONFIDENCE_RECORD: "phase-10.6",
    SCORING: "phase-10.10.3",
    PRIORITIZATION: "phase-10.10.4",
    SUPPRESSION: "phase-10.10.5",
    CONSOLIDATION: "phase-10.10.6",
  };
  return map[category];
}

function artifactIdsFor(category: ProposalLineageReferenceCategory, proposal: ConsolidatedAdaptationProposal): readonly string[] {
  const lineage = proposal.lineage;
  const map: Record<ProposalLineageReferenceCategory, readonly string[]> = {
    OUTCOME: lineage.outcome_lineage.length ? lineage.outcome_lineage : [`outcome:${proposal.consolidated_proposal_id}`],
    RECOMMENDATION: lineage.original_proposal_ids.map((id) => `recommendation:${id}`),
    EVIDENCE: lineage.evidence_lineage,
    SIMULATION: proposal.replay_refs.map((id) => `simulation:${id}`),
    OPERATOR_FEEDBACK: lineage.operator_lineage,
    GOVERNANCE_REVIEW: lineage.governance_lineage,
    CERTIFICATION_HISTORY: [`certification:pending:${proposal.consolidated_proposal_id}`],
    RISK_RECORD: lineage.original_proposal_ids.map((id) => `risk:${id}`),
    CONFIDENCE_RECORD: lineage.original_proposal_ids.map((id) => `confidence:${id}`),
    SCORING: lineage.scoring_lineage,
    PRIORITIZATION: lineage.prioritization_history,
    SUPPRESSION: lineage.suppression_history,
    CONSOLIDATION: [proposal.consolidated_proposal_id, ...proposal.relationship_classifications.map((relationship) => `relationship:${relationship}`)],
  };
  return uniqueSorted(map[category]);
}

function referenceFor(category: ProposalLineageReferenceCategory, artifactId: string, proposalId: string): ProposalLineageReference {
  const base: Omit<ProposalLineageReference, "integrity_hash"> = {
    reference_id: `proposal_lineage_ref_${hash(`${proposalId}:${category}:${artifactId}`).slice(0, 14)}`,
    category,
    artifact_id: artifactId,
    source_phase: sourcePhaseFor(category),
    immutable: true,
    tenant_scope: "CURRENT_TENANT",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function referencesFor(proposal: ConsolidatedAdaptationProposal): readonly ProposalLineageReference[] {
  return freezeArray(REFERENCE_CATEGORIES.flatMap((category) => artifactIdsFor(category, proposal).map((artifactId) => referenceFor(category, artifactId, proposal.consolidated_proposal_id))));
}

function dependencyGraphFor(proposal: ConsolidatedAdaptationProposal, references: readonly ProposalLineageReference[], graphConsistent: boolean): ProposalDependencyGraph {
  const nodes = uniqueSorted([
    proposal.consolidated_proposal_id,
    ...proposal.source_proposal_ids,
    ...references.map((reference) => reference.reference_id),
  ]);
  const edges = uniqueSorted([
    ...proposal.source_proposal_ids.map((sourceId) => `${sourceId}->${proposal.consolidated_proposal_id}`),
    ...references.map((reference) => `${reference.reference_id}->${proposal.consolidated_proposal_id}`),
  ]);
  const base: Omit<ProposalDependencyGraph, "integrity_hash"> = {
    graph_id: `proposal_dependency_graph_${hash(`${proposal.consolidated_proposal_id}:${nodes.join("|")}`).slice(0, 14)}`,
    proposal_id: proposal.consolidated_proposal_id,
    nodes,
    edges,
    topological_order: nodes,
    graph_consistent: graphConsistent,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayGraphFor(proposal: ConsolidatedAdaptationProposal, references: readonly ProposalLineageReference[], replayComplete: boolean): ProposalReplayGraph {
  const categories = uniqueSorted(references.map((reference) => reference.category));
  const base: Omit<ProposalReplayGraph, "integrity_hash"> = {
    replay_graph_id: `proposal_replay_graph_${hash(`${proposal.consolidated_proposal_id}:${categories.join("|")}`).slice(0, 14)}`,
    proposal_id: proposal.consolidated_proposal_id,
    replay_version: REPLAY_VERSION,
    replay_steps: freezeArray([
      "resolve_proposal_identity",
      "retrieve_originating_artifacts",
      "reconstruct_evidence_lineage",
      "reconstruct_governance_history",
      "reconstruct_scoring_prioritization_suppression",
      "reconstruct_consolidation_decision",
      "verify_byte_identical_replay_hash",
    ]),
    reconstructs_identity: replayComplete,
    reconstructs_inputs: replayComplete,
    reconstructs_evidence: replayComplete && categories.includes("EVIDENCE"),
    reconstructs_analytical_reasoning: replayComplete,
    reconstructs_governance: replayComplete && categories.includes("GOVERNANCE_REVIEW"),
    reconstructs_constitutional: replayComplete && categories.includes("GOVERNANCE_REVIEW"),
    reconstructs_authority: replayComplete && categories.includes("GOVERNANCE_REVIEW"),
    reconstructs_scoring: replayComplete && categories.includes("SCORING"),
    reconstructs_prioritization: replayComplete && categories.includes("PRIORITIZATION"),
    reconstructs_suppression: replayComplete && categories.includes("SUPPRESSION"),
    reconstructs_consolidation: replayComplete && categories.includes("CONSOLIDATION"),
    byte_identical_reconstruction: replayComplete,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function traceabilityFor(references: readonly ProposalLineageReference[], forwardComplete: boolean): ProposalTraceability {
  const presentCategories = new Set(references.map((reference) => reference.category));
  const backward = freezeArray(REFERENCE_CATEGORIES.filter((category) => presentCategories.has(category)));
  const base: Omit<ProposalTraceability, "integrity_hash"> = {
    backward_traceability: backward,
    forward_traceability: freezeArray(["simulation_execution", "governance_review", "certification", "operator_review", "rollback_planning", "future_proposal_evolution"]),
    complete_backward_traceability: REFERENCE_CATEGORIES.every((category) => backward.includes(category)),
    complete_forward_traceability: forwardComplete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recordFor(proposal: ConsolidatedAdaptationProposal, failures: readonly ProposalLineageReplayFailure[], scenario: Scenario): ProposalLineageRecord {
  const references = referencesFor(proposal);
  const dependencyGraph = dependencyGraphFor(proposal, references, !failures.includes("DEPENDENCY_GRAPH_INCONSISTENT"));
  const replayGraph = replayGraphFor(proposal, references, failures.length === 0);
  const traceability = traceabilityFor(references, failures.length === 0);
  const base: Omit<ProposalLineageRecord, "integrity_hash"> = {
    lineage_id: `proposal_lineage_${hash(`${proposal.consolidated_proposal_id}:${proposal.integrity_hash}:${scenario}`).slice(0, 14)}`,
    proposal_id: proposal.source_proposal_ids[0] ?? proposal.consolidated_proposal_id,
    consolidated_proposal_id: proposal.consolidated_proposal_id,
    referenced_artifacts: references,
    dependency_graph: dependencyGraph,
    replay_graph: replayGraph,
    traceability,
    creation_timestamp: CREATED_AT,
    binder_version: BINDER_VERSION,
    immutable: true,
    complete_provenance: failures.length === 0 && traceability.complete_backward_traceability && traceability.complete_forward_traceability,
    replay_reconstructable: failures.length === 0 && replayGraph.byte_identical_reconstruction,
    advisory_only: true,
    modifies_proposal: false,
    mutates_history: false,
    approves_proposal: false,
    rejects_proposal: false,
    implements_proposal: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metricsFor(records: readonly ProposalLineageRecord[], failures: readonly ProposalLineageReplayFailure[]): ProposalLineageReplayMetrics {
  const artifactCount = uniqueSorted(records.flatMap((record) => record.referenced_artifacts.map((reference) => reference.artifact_id))).length;
  const dependencyGraphSize = records.reduce((total, record) => total + record.dependency_graph.nodes.length + record.dependency_graph.edges.length, 0);
  const base: Omit<ProposalLineageReplayMetrics, "integrity_hash"> = {
    proposals_bound: records.length,
    lineage_completeness_rate: records.length ? Number((records.filter((record) => record.complete_provenance).length / records.length).toFixed(4)) : 0,
    replay_completeness_rate: records.length ? Number((records.filter((record) => record.replay_reconstructable).length / records.length).toFixed(4)) : 0,
    dependency_graph_size: dependencyGraphSize,
    historical_artifacts_referenced: artifactCount,
    replay_generation_latency_ms: 0,
    integrity_verification_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    missing_reference_detections: failures.filter((failure) => ["REQUIRED_REFERENCES_MISSING", "EVIDENCE_LINEAGE_INCOMPLETE", "GOVERNANCE_HISTORY_INCOMPLETE", "CERTIFICATION_HISTORY_INCOMPLETE"].includes(failure)).length,
    deterministic_replay_success: failures.length === 0,
    lineage_validation_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly ProposalLineageReplayFailure[]): ProposalLineageBindingState {
  return failures.length ? "FAIL_CLOSED" : "BOUND";
}

function resultReplayHash(result: Omit<ProposalLineageReplayResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    consolidation_hash: result.consolidation_result.integrity_hash,
    lineage_hashes: result.lineage_records.map((record) => record.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    state: result.binding_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ProposalLineageReplayResult, "integrity_hash">): string {
  return hash({
    version: result.proposal_lineage_replay_binder_version,
    binding_version: result.binding_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function bindProposalLineage(input: ProposalLineageReplayInput = {}): ProposalLineageReplayResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const consolidation_result = input.consolidation_result ?? consolidateAdaptationProposals({ scenario: consolidationScenarioFor(scenario) });
  const bindableProposals = freezeArray(consolidation_result.consolidated_proposals);
  const failures = collectFailures(scenario, replayAdaptationConsolidation(consolidation_result), consolidation_result.failures, bindableProposals.length);
  const lineage_records = failures.length === 0 ? freezeArray(bindableProposals.map((proposal) => recordFor(proposal, failures, scenario))) : freezeArray<ProposalLineageRecord>([]);
  const metrics = metricsFor(lineage_records, failures);
  const base: Omit<ProposalLineageReplayResult, "integrity_hash" | "replay_hash"> = {
    proposal_lineage_replay_binder_version: BINDER_VERSION,
    binding_version: BINDING_VERSION,
    api_surface,
    consolidation_result,
    lineage_records,
    metrics,
    binding_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationConsolidation(consolidation_result),
    explainable: lineage_records.every((record) => record.replay_graph.replay_steps.length > 0),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("CROSS_TENANT_LINEAGE_ATTEMPT") && consolidation_result.tenant_isolated,
    lineage_immutable: failures.length === 0 && lineage_records.every((record) => record.immutable),
    backward_traceability_complete: lineage_records.every((record) => record.traceability.complete_backward_traceability),
    forward_traceability_complete: lineage_records.every((record) => record.traceability.complete_forward_traceability),
    advisory_only: true,
    modifies_proposals: false,
    mutates_historical_records: false,
    rewrites_lineage: false,
    approves_proposals: false,
    rejects_proposals: false,
    implements_proposals: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayProposalLineageBinding(result: ProposalLineageReplayResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getProposalLineageReplayFoundation(): ProposalLineageReplayFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    proposal_lineage_replay_binder_version: BINDER_VERSION,
    supported_reference_categories: REFERENCE_CATEGORIES,
    api_surface,
    result: bindProposalLineage(),
  });
}

export const ProposalLineageReplayBinder = Object.freeze({
  bind: bindProposalLineage,
  replay: replayProposalLineageBinding,
});
