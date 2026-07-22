import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { normalizeFeedback, replayFeedbackNormalization } from "@/services/feedback-normalization-engine";
import { analyzeOverrideLearning, replayOverrideLearningAnalysis } from "@/services/override-learning-analyzer";
import { analyzeRejectionLearning, replayRejectionLearningAnalysis } from "@/services/rejection-learning-analyzer";
import type { FeedbackNormalizationEngineInput } from "@/types/feedback-normalization-engine";
import type {
  CorrelationGraph,
  CorrelationGraphEdge,
  CorrelationGraphNode,
  CorrelationLifecycleStage,
  CorrelationOutcomeCategory,
  FeedbackEvidenceCorrelationApiSurface,
  FeedbackEvidenceCorrelationAuditEvent,
  FeedbackEvidenceCorrelationExplanation,
  FeedbackEvidenceCorrelationFailure,
  FeedbackEvidenceCorrelationFoundation,
  FeedbackEvidenceCorrelationInput,
  FeedbackEvidenceCorrelationResult,
  FeedbackEvidenceCorrelationScenario,
  LifecycleCorrelation,
  LineageRegistryRecord,
  RecommendationCorrelationStatus,
} from "@/types/feedback-evidence-correlation";

const ENGINE_VERSION = "feedback-evidence-correlation/v1" as const;
const RULE_VERSION = "feedback-evidence-correlation-rules/v1" as const;
const GRAPH_VERSION = "feedback-correlation-graph/v1" as const;
const LINEAGE_VERSION = "feedback-evidence-lineage/v1" as const;
const CORRELATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<FeedbackEvidenceCorrelationInput["scenario"]>;

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

function buildApiSurface(): FeedbackEvidenceCorrelationApiSurface {
  const base: Omit<FeedbackEvidenceCorrelationApiSurface, "integrity_hash"> = {
    api_id: "feedback_evidence_correlation_api",
    correlate_feedback_evidence: "POST /feedback-evidence-correlation/correlate",
    retrieve_graph: "POST /feedback-evidence-correlation/graph",
    retrieve_lineage: "POST /feedback-evidence-correlation/lineage",
    retrieve_decision_correlation: "POST /feedback-evidence-correlation/decision",
    retrieve_recommendation_correlation: "POST /feedback-evidence-correlation/recommendation",
    retrieve_outcome_correlation: "POST /feedback-evidence-correlation/outcome",
    retrieve_simulation_correlation: "POST /feedback-evidence-correlation/simulation",
    retrieve_replay_correlation: "POST /feedback-evidence-correlation/replay",
    retrieve_pattern_correlation: "POST /feedback-evidence-correlation/patterns",
    retrieve_explanation: "POST /feedback-evidence-correlation/explanation",
    retrieve_audit: "POST /feedback-evidence-correlation/audit",
    retrieve_contract: "GET /feedback-evidence-correlation/contract",
    normalization_supported: false,
    recommendation_analysis_supported: false,
    adaptive_proposal_generation_supported: false,
    production_mutation_supported: false,
    simulation_execution_supported: false,
    governance_override_supported: false,
    historical_evidence_mutation_supported: false,
    evidence_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function normalizationInputFor(scenario: Scenario): FeedbackNormalizationEngineInput {
  if (scenario === "REJECTION_FEEDBACK" || scenario === "PATTERN_REJECTION") return { scenario: "REJECTION" };
  if (scenario === "APPROVAL_FEEDBACK") return { scenario: "APPROVAL" };
  if (scenario === "NORMALIZATION_REJECTED") return { scenario: "UNSUPPORTED_FEEDBACK_CLASSIFICATION" };
  if (scenario === "MISSING_REPLAY_LINEAGE") return { scenario: "REPLAY_REFERENCE_MISSING" };
  if (scenario === "MISSING_GOVERNANCE_METADATA") return { scenario: "GOVERNANCE_METADATA_OMISSION" };
  if (scenario === "CROSS_TENANT") return { scenario: "CROSS_TENANT_REFERENCE" };
  return { scenario: "OVERRIDE" };
}

function statusFor(scenario: Scenario, normalizedType: string | undefined): RecommendationCorrelationStatus {
  if (normalizedType === "REJECTION_FEEDBACK") return "REJECTED";
  if (normalizedType === "OVERRIDE_FEEDBACK") return scenario === "PATTERN_OVERRIDE" ? "MODIFIED" : "OVERRIDDEN";
  if (normalizedType === "APPROVAL_FEEDBACK") return "ACCEPTED";
  if (scenario === "PARTIAL_SUCCESS") return "DEFERRED";
  return "MODIFIED";
}

function outcomeFor(scenario: Scenario): CorrelationOutcomeCategory {
  const map: Partial<Record<Scenario, CorrelationOutcomeCategory>> = {
    SUCCESSFUL_EXECUTION: "SUCCESSFUL_EXECUTION",
    PARTIAL_SUCCESS: "PARTIAL_SUCCESS",
    UNSUCCESSFUL_EXECUTION: "UNSUCCESSFUL_EXECUTION",
    AVOIDED_FAILURE: "AVOIDED_FAILURE",
    UNEXPECTED_OUTCOME: "UNEXPECTED_OUTCOME",
    MISSION_IMPROVEMENT: "MISSION_IMPROVEMENT",
    MISSION_DEGRADATION: "MISSION_DEGRADATION",
  };
  return map[scenario] ?? "MISSION_IMPROVEMENT";
}

function directFailureFor(scenario: Scenario): FeedbackEvidenceCorrelationFailure | undefined {
  const map: Partial<Record<Scenario, FeedbackEvidenceCorrelationFailure>> = {
    MISSING_FEEDBACK_REFERENCE: "FEEDBACK_REFERENCE_MISSING",
    MISSING_DECISION: "DECISION_UNAVAILABLE",
    MISSING_RECOMMENDATION: "RECOMMENDATION_UNAVAILABLE",
    MISSING_OUTCOME: "OUTCOME_UNAVAILABLE",
    MISSING_REPLAY_LINEAGE: "REPLAY_LINEAGE_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_UNAVAILABLE",
    MISSING_GOVERNANCE_METADATA: "GOVERNANCE_METADATA_INCOMPLETE",
    INVALID_RULE_VERSION: "CORRELATION_RULE_VERSION_INVALID",
    NORMALIZATION_REJECTED: "NORMALIZED_FEEDBACK_REJECTED",
    CROSS_TENANT: "TENANT_ISOLATION_FAILED",
    INTEGRITY_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
    ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT: "ADAPTIVE_PROPOSAL_GENERATION_ATTEMPT",
  };
  return map[scenario];
}

function node(seed: string, node_type: CorrelationGraphNode["node_type"], artifact_ref: string, tenant_id: string): CorrelationGraphNode {
  const base: Omit<CorrelationGraphNode, "integrity_hash"> = {
    node_id: `correlation_node_${hash(`${seed}:${node_type}:${artifact_ref}`).slice(0, 14)}`,
    node_type,
    artifact_ref,
    tenant_id,
    immutable: true,
    versioned: true,
    replayable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function edge(seed: string, edge_type: CorrelationGraphEdge["edge_type"], from: CorrelationGraphNode, to: CorrelationGraphNode): CorrelationGraphEdge {
  const base: Omit<CorrelationGraphEdge, "integrity_hash"> = {
    edge_id: `correlation_edge_${hash(`${seed}:${edge_type}:${from.node_id}:${to.node_id}`).slice(0, 14)}`,
    edge_type,
    from_node_id: from.node_id,
    to_node_id: to.node_id,
    deterministic_rule: RULE_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLifecycle(input: {
  seed: string;
  feedbackRef: string;
  decisionRef: string;
  recommendationRef: string;
  outcomeRef: string;
  simulationRef: string;
  replayRef: string;
  adaptiveProposalRef: string;
  status: RecommendationCorrelationStatus;
  outcome: CorrelationOutcomeCategory;
  scenario: Scenario;
}): LifecycleCorrelation {
  const base: Omit<LifecycleCorrelation, "integrity_hash"> = {
    correlation_id: `feedback_correlation_${hash(`${input.seed}:${RULE_VERSION}`).slice(0, 14)}`,
    feedback_ref: input.feedbackRef,
    decision_ref: input.decisionRef,
    recommendation_ref: input.recommendationRef,
    outcome_ref: input.outcomeRef,
    simulation_ref: input.simulationRef,
    replay_ref: input.replayRef,
    adaptive_proposal_ref: input.adaptiveProposalRef,
    recommendation_status: input.status,
    outcome_category: input.outcome,
    prediction_accuracy: input.scenario === "SIMULATION_VARIANCE" ? 0.58 : 0.87,
    scenario_coverage: input.scenario === "SIMULATION_VARIANCE" ? 0.64 : 0.91,
    variance_magnitude: input.scenario === "SIMULATION_VARIANCE" ? 0.42 : 0.09,
    simulation_usefulness: input.scenario === "SIMULATION_VARIANCE" ? 0.72 : 0.88,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildGraph(seed: string, tenantId: string, lifecycle: LifecycleCorrelation, evidenceRefs: readonly string[], governanceRefs: readonly string[], patternRefs: readonly string[], operatorRef: string, missionRef: string): CorrelationGraph {
  const feedback = node(seed, "FEEDBACK", lifecycle.feedback_ref, tenantId);
  const operator = node(seed, "OPERATOR", operatorRef, tenantId);
  const mission = node(seed, "MISSION", missionRef, tenantId);
  const decision = node(seed, "DECISION", lifecycle.decision_ref, tenantId);
  const recommendation = node(seed, "RECOMMENDATION", lifecycle.recommendation_ref, tenantId);
  const outcome = node(seed, "OUTCOME", lifecycle.outcome_ref, tenantId);
  const simulation = node(seed, "SIMULATION", lifecycle.simulation_ref, tenantId);
  const replay = node(seed, "REPLAY", lifecycle.replay_ref, tenantId);
  const proposal = node(seed, "ADAPTIVE_PROPOSAL", lifecycle.adaptive_proposal_ref, tenantId);
  const confidence = node(seed, "CONFIDENCE_ASSESSMENT", `confidence_${lifecycle.correlation_id}`, tenantId);
  const evidenceNodes = evidenceRefs.map((ref) => node(seed, "EVIDENCE", ref, tenantId));
  const governanceNodes = governanceRefs.map((ref) => node(seed, "GOVERNANCE_REVIEW", ref, tenantId));
  const patternNodes = patternRefs.map((ref) => node(seed, "PATTERN", ref, tenantId));
  const nodes = freezeArray([feedback, operator, mission, decision, recommendation, outcome, simulation, replay, proposal, confidence, ...evidenceNodes, ...governanceNodes, ...patternNodes]);
  const edges = freezeArray([
    edge(seed, "GENERATED_BY", feedback, operator),
    edge(seed, "REFERENCED_BY", feedback, mission),
    edge(seed, "INFLUENCED", feedback, decision),
    edge(seed, "CONTRIBUTED_TO", decision, recommendation),
    edge(seed, "RESULTED_IN", recommendation, outcome),
    edge(seed, "SIMULATED_BY", recommendation, simulation),
    edge(seed, "REPLAYED_BY", feedback, replay),
    edge(seed, "REFERENCED_BY", proposal, feedback),
    edge(seed, "VALIDATED_BY", recommendation, confidence),
    ...evidenceNodes.map((evidenceNode) => edge(seed, "SUPPORTED_BY", feedback, evidenceNode)),
    ...governanceNodes.map((governanceNode) => edge(seed, "REVIEWED_BY", feedback, governanceNode)),
    ...patternNodes.map((patternNode) => edge(seed, "CONTRIBUTED_TO", feedback, patternNode)),
  ]);
  const base: Omit<CorrelationGraph, "integrity_hash"> = {
    graph_id: `feedback_correlation_graph_${hash(`${seed}:${nodes.length}:${edges.length}`).slice(0, 14)}`,
    graph_version: GRAPH_VERSION,
    nodes,
    edges,
    immutable: true,
    append_only: true,
    deterministic: true,
    replayable: true,
    tenant_isolated: true,
    explainable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineage(lifecycle: LifecycleCorrelation, evidenceRefs: readonly string[], governanceRefs: readonly string[]): LineageRegistryRecord {
  const base: Omit<LineageRegistryRecord, "integrity_hash"> = {
    lineage_id: `feedback_lineage_${hash(lifecycle.correlation_id).slice(0, 14)}`,
    feedback_id: lifecycle.feedback_ref,
    decision_id: lifecycle.decision_ref,
    recommendation_id: lifecycle.recommendation_ref,
    evidence_refs: evidenceRefs,
    outcome_refs: freezeArray([lifecycle.outcome_ref]),
    simulation_refs: freezeArray([lifecycle.simulation_ref]),
    replay_refs: freezeArray([lifecycle.replay_ref]),
    adaptive_proposal_refs: freezeArray([lifecycle.adaptive_proposal_ref]),
    governance_refs: governanceRefs,
    created_timestamp: CORRELATED_AT,
    schema_version: LINEAGE_VERSION,
    append_only: true,
    immutable: true,
    cryptographically_verifiable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: FeedbackEvidenceCorrelationInput): readonly FeedbackEvidenceCorrelationFailure[] {
  const scenario = input.scenario ?? "BASELINE";
  const normalization = input.normalization_result ?? normalizeFeedback(normalizationInputFor(scenario));
  const normalized = normalization.normalized_record;
  const failures: FeedbackEvidenceCorrelationFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (normalization.normalization_state !== "NORMALIZED" || !normalized) failures.push("NORMALIZED_FEEDBACK_REJECTED");
  if (!normalization.tenant_isolated) failures.push("TENANT_ISOLATION_FAILED");
  if (!replayFeedbackNormalization(normalization)) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (!normalized?.original_feedback_id) failures.push("FEEDBACK_REFERENCE_MISSING");
  if (!normalization.intake_result.feedback_record.decision_id || scenario === "MISSING_DECISION") failures.push("DECISION_UNAVAILABLE");
  if (!normalization.intake_result.feedback_record.decision_package_id || scenario === "MISSING_RECOMMENDATION") failures.push("RECOMMENDATION_UNAVAILABLE");
  if (scenario === "MISSING_OUTCOME") failures.push("OUTCOME_UNAVAILABLE");
  if (scenario === "MISSING_EVIDENCE" || (normalized && normalized.preserved_evidence_refs.length === 0)) failures.push("EVIDENCE_UNAVAILABLE");
  if (scenario === "MISSING_REPLAY_LINEAGE" || (normalized && normalized.preserved_replay_refs.length === 0)) failures.push("REPLAY_LINEAGE_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE_METADATA" || (normalized && !normalized.governance_metadata_hash)) failures.push("GOVERNANCE_METADATA_INCOMPLETE");
  return freezeArray([...new Set(failures)]);
}

function buildExplanation(stage: CorrelationLifecycleStage, lifecycle: LifecycleCorrelation | null, lineage: LineageRegistryRecord | null, failures: readonly FeedbackEvidenceCorrelationFailure[]): FeedbackEvidenceCorrelationExplanation {
  const base: Omit<FeedbackEvidenceCorrelationExplanation, "integrity_hash"> = {
    explanation_id: `feedback_correlation_explanation_${hash(`${stage}:${lifecycle?.correlation_id ?? "none"}`).slice(0, 14)}`,
    why_feedback_was_submitted: lifecycle ? `feedback correlated as ${lifecycle.recommendation_status.toLowerCase()} recommendation evidence` : "feedback could not be correlated",
    lifecycle_point: stage,
    authenticated_operator: lifecycle ? "operator_001" : "unknown",
    supporting_evidence_refs: lineage?.evidence_refs ?? freezeArray([]),
    operational_outcome: lifecycle?.outcome_category ?? "not_correlated",
    future_relevance: lifecycle ? "may support future adaptive proposals after governance review" : failures.join(","),
    governance_context: lineage?.governance_refs.length ? "governance metadata preserved" : "governance metadata unavailable",
    replay_lineage: lineage?.replay_refs ?? freezeArray([]),
    traceable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function auditEvent(seed: string, event_type: FeedbackEvidenceCorrelationAuditEvent["event_type"], outcome: string): FeedbackEvidenceCorrelationAuditEvent {
  const base: Omit<FeedbackEvidenceCorrelationAuditEvent, "integrity_hash"> = {
    audit_event_id: `feedback_correlation_audit_${hash(`${seed}:${event_type}`).slice(0, 14)}`,
    event_type,
    outcome,
    recorded_at: CORRELATED_AT,
    append_only: true,
    immutable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAudit(seed: string, lifecycle: LifecycleCorrelation | null, graph: CorrelationGraph | null, failures: readonly FeedbackEvidenceCorrelationFailure[]): readonly FeedbackEvidenceCorrelationAuditEvent[] {
  return freezeArray([
    auditEvent(seed, "CORRELATION", lifecycle ? lifecycle.correlation_id : "not_correlated"),
    auditEvent(seed, "DECISION_LINK", lifecycle?.decision_ref ?? "none"),
    auditEvent(seed, "RECOMMENDATION_LINK", lifecycle?.recommendation_ref ?? "none"),
    auditEvent(seed, "OUTCOME_LINK", lifecycle?.outcome_ref ?? "none"),
    auditEvent(seed, "SIMULATION_LINK", lifecycle?.simulation_ref ?? "none"),
    auditEvent(seed, "REPLAY_LINK", lifecycle?.replay_ref ?? "none"),
    auditEvent(seed, "PATTERN_LINK", graph ? "patterns_linked" : "none"),
    auditEvent(seed, "GRAPH_BUILD", graph?.graph_id ?? "not_built"),
    auditEvent(seed, "LINEAGE_REGISTRY", lifecycle ? "append_only_recorded" : "not_recorded"),
    ...(failures.length ? [auditEvent(seed, "REJECTION", failures.join("|"))] : []),
  ]);
}

function resultReplayHash(result: Omit<FeedbackEvidenceCorrelationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    normalization_hash: result.normalization_result.integrity_hash,
    override_hash: result.override_learning_result?.integrity_hash ?? "none",
    rejection_hash: result.rejection_learning_result?.integrity_hash ?? "none",
    lifecycle: result.lifecycle_correlation,
    graph: result.graph,
    lineage: result.lineage_registry_record,
    explanation: result.explanation,
    audit: result.audit_events,
    state: result.correlation_state,
  });
}

function resultIntegrityHash(result: Omit<FeedbackEvidenceCorrelationResult, "integrity_hash">): string {
  return hash({
    feedback_evidence_correlation_version: result.feedback_evidence_correlation_version,
    correlation_rule_version: result.correlation_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    lifecycle_hash: result.lifecycle_correlation?.integrity_hash ?? "none",
    graph_hash: result.graph?.integrity_hash ?? "none",
    lineage_hash: result.lineage_registry_record?.integrity_hash ?? "none",
    explanation_hash: result.explanation.integrity_hash,
    audit_hashes: result.audit_events.map((event) => event.integrity_hash),
    replay_hash: result.replay_hash,
  });
}

export function correlateFeedbackEvidence(input: FeedbackEvidenceCorrelationInput = {}): FeedbackEvidenceCorrelationResult {
  const api_surface = buildApiSurface();
  const scenario = input.scenario ?? "BASELINE";
  const normalization_result = input.normalization_result ?? normalizeFeedback(normalizationInputFor(scenario));
  const normalized = normalization_result.normalized_record;
  const override_learning_result = input.override_learning_result ?? (normalized?.canonical_feedback_type === "OVERRIDE_FEEDBACK" ? analyzeOverrideLearning({ normalization_result }) : null);
  const rejection_learning_result = input.rejection_learning_result ?? (normalized?.canonical_feedback_type === "REJECTION_FEEDBACK" ? analyzeRejectionLearning({ normalization_result }) : null);
  const failures = collectFailures({ ...input, normalization_result });
  const feedbackRecord = normalization_result.intake_result.feedback_record;
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : normalized?.preserved_evidence_refs ?? freezeArray([]);
  const replayRefs = scenario === "MISSING_REPLAY_LINEAGE" ? freezeArray([]) : normalized?.preserved_replay_refs ?? freezeArray([]);
  const governanceRefs = scenario === "MISSING_GOVERNANCE_METADATA" ? freezeArray([]) : feedbackRecord.governance_metadata.policy_refs;
  const patternRefs = freezeArray([
    ...(override_learning_result?.pattern_record ? [override_learning_result.pattern_record.pattern_id] : []),
    ...(rejection_learning_result?.pattern_registry.map((record) => record.pattern_id) ?? []),
  ]);
  const status = statusFor(scenario, normalized?.canonical_feedback_type);
  const outcome = outcomeFor(scenario);
  const lifecycle_correlation = failures.length || !normalized ? null : buildLifecycle({
    seed: normalized.normalized_feedback_id,
    feedbackRef: normalized.original_feedback_id,
    decisionRef: feedbackRecord.decision_id,
    recommendationRef: feedbackRecord.decision_package_id,
    outcomeRef: `outcome_${hash(`${feedbackRecord.mission_id}:${outcome}`).slice(0, 12)}`,
    simulationRef: `simulation_${hash(`${feedbackRecord.decision_id}:${scenario}`).slice(0, 12)}`,
    replayRef: replayRefs[0] ?? normalization_result.replay_hash,
    adaptiveProposalRef: `adaptive_proposal_evidence_${hash(normalized.normalized_feedback_id).slice(0, 12)}`,
    status,
    outcome,
    scenario,
  });
  const lineage_registry_record = lifecycle_correlation ? buildLineage(lifecycle_correlation, evidenceRefs, governanceRefs) : null;
  const graph = lifecycle_correlation ? buildGraph(normalized?.normalized_feedback_id ?? normalization_result.integrity_hash, feedbackRecord.tenant_id, lifecycle_correlation, evidenceRefs, governanceRefs, patternRefs, feedbackRecord.operator_id, feedbackRecord.mission_id) : null;
  const explanation = buildExplanation("FEEDBACK", lifecycle_correlation, lineage_registry_record, failures);
  const audit_events = buildAudit(normalized?.normalized_feedback_id ?? normalization_result.integrity_hash, lifecycle_correlation, graph, failures);
  const replayableDependencies = replayFeedbackNormalization(normalization_result) && (!override_learning_result || replayOverrideLearningAnalysis(override_learning_result)) && (!rejection_learning_result || replayRejectionLearningAnalysis(rejection_learning_result));
  const base: Omit<FeedbackEvidenceCorrelationResult, "integrity_hash" | "replay_hash"> = {
    feedback_evidence_correlation_version: ENGINE_VERSION,
    correlation_rule_version: RULE_VERSION,
    api_surface,
    normalization_result,
    override_learning_result,
    rejection_learning_result,
    lifecycle_correlation,
    graph,
    lineage_registry_record,
    explanation,
    audit_events,
    correlation_state: failures.length ? "REJECTED" : "CORRELATED",
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayableDependencies,
    explainable: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_FAILED"),
    evidence_lineage_complete: !failures.includes("EVIDENCE_UNAVAILABLE"),
    replay_lineage_complete: !failures.includes("REPLAY_LINEAGE_INCOMPLETE"),
    adaptive_proposal_traceable: Boolean(lineage_registry_record?.adaptive_proposal_refs.length),
    evidence_only: true,
    immutable_lineage: true,
    append_only_audit: true,
    modifies_recommendations: false,
    generates_adaptive_proposals: false,
    executes_simulations: false,
    overrides_governance: false,
    alters_historical_evidence: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayFeedbackEvidenceCorrelation(result: FeedbackEvidenceCorrelationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getFeedbackEvidenceCorrelationFoundation(): FeedbackEvidenceCorrelationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    feedback_evidence_correlation_version: ENGINE_VERSION,
    api_surface,
    result: correlateFeedbackEvidence(),
  });
}

export const FeedbackEvidenceCorrelation = Object.freeze({
  correlate: correlateFeedbackEvidence,
  replay: replayFeedbackEvidenceCorrelation,
});
