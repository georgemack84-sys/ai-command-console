import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { registerGovernanceLineage } from "@/services/governance-lineage";
import { reconstructPolicyLineage } from "@/services/policy-lineage-reconstruction";
import type {
  DecisionContributionLevel,
  DecisionInfluenceAnalysis,
  DecisionInfluenceConfidence,
  DecisionInfluenceEngineInput,
  DecisionInfluenceEngineResult,
  DecisionInfluenceErrorCode,
  DecisionInfluenceFailureReason,
  DecisionInfluenceGraphEdge,
  DecisionInfluenceObservabilitySurface,
  DecisionInfluenceRecord,
  DecisionInfluenceRelationshipType,
  DecisionInfluenceReplayRefs,
  DecisionInfluenceReplayResult,
  DecisionInfluenceScenario,
  DecisionInfluenceSourceType,
  DecisionInfluenceState,
  DecisionInfluenceValidationFailure,
  DecisionInfluenceValidationResult,
} from "@/types/decision-influence-analysis";

const NOW = "2026-06-26T19:00:00.000Z";
const SCHEMA_VERSION = "decision-influence-analysis/v7G.3" as const;
const STATES: readonly DecisionInfluenceState[] = Object.freeze(["DISCOVERED", "ANALYZED", "RESOLVED", "VALIDATED", "CERTIFIED", "ARCHIVED"]);
const RELATIONSHIPS: readonly DecisionInfluenceRelationshipType[] = Object.freeze(["SUPPORTED_BY", "REQUIRED_BY", "CONSTRAINED_BY", "INFLUENCED_BY", "VALIDATED_BY", "ESCALATED_BY", "OVERRIDDEN_BY", "SUPERSEDED_BY", "DERIVED_FROM", "DEPENDENT_ON", "CORRELATED_WITH"]);
const PRECEDENCE: readonly DecisionInfluenceSourceType[] = Object.freeze(["CONSTITUTION", "AUTHORITY", "POLICY", "COMPLIANCE", "RISK", "EVIDENCE", "RECOMMENDATION", "ESCALATION"]);
const ERROR_CODES: Readonly<Record<DecisionInfluenceFailureReason, DecisionInfluenceErrorCode>> = Object.freeze({
  MISSING_INFLUENCE_IDENTIFIER: "DIA-001",
  SOURCE_REFERENCE_NOT_FOUND: "DIA-002",
  TARGET_REFERENCE_NOT_FOUND: "DIA-003",
  INVALID_RELATIONSHIP_TYPE: "DIA-004",
  DEPENDENCY_GRAPH_INCOMPLETE: "DIA-005",
  CIRCULAR_DEPENDENCY_DETECTED: "DIA-006",
  CONSTITUTIONAL_PRECEDENCE_VIOLATION: "DIA-007",
  HIDDEN_INFLUENCE_DETECTED: "DIA-008",
  CONTRIBUTION_CALCULATION_FAILED: "DIA-009",
  CONFLICT_RESOLUTION_INCOMPLETE: "DIA-010",
  REPLAY_RECONSTRUCTION_MISMATCH: "DIA-011",
  CROSS_TENANT_INFLUENCE_DETECTED: "DIA-012",
  IMMUTABLE_INFLUENCE_MODIFIED: "DIA-013",
  CONFIDENCE_CALCULATION_MISMATCH: "DIA-014",
  DECISION_INFLUENCE_VALIDATION_FAILED: "DIA-015",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function failure(reason: DecisionInfluenceFailureReason, field_path: string, message: string): DecisionInfluenceValidationFailure {
  return Object.freeze({ error_code: ERROR_CODES[reason], reason, field_path, message, fail_closed: true });
}

function confidenceLevel(score: number): DecisionInfluenceConfidence["confidence_level"] {
  if (score >= 95) return "CERTIFICATION_READY";
  if (score >= 85) return "HIGH";
  if (score >= 65) return "MODERATE";
  return "LOW";
}

function contributionLevel(source_type: DecisionInfluenceSourceType, score: number): DecisionContributionLevel {
  if (source_type === "CONSTITUTION" || score >= 94) return "MANDATORY";
  if (score >= 88) return "PRIMARY";
  if (score >= 78) return "SECONDARY";
  if (score >= 60) return "SUPPORTING";
  return "INFORMATIONAL";
}

function influence(input: Omit<DecisionInfluenceRecord, "influence_hash">): DecisionInfluenceRecord {
  return Object.freeze({ ...input, influence_hash: hashValue("decision-influence-record", input) });
}

function buildInfluenceId(source_type: DecisionInfluenceSourceType, source_identifier: string, decision_id: string): string {
  return `DIA-INF-${hashValue("decision-influence-id", { source_type, source_identifier, decision_id }).slice(0, 10).toUpperCase()}`;
}

function record(source_type: DecisionInfluenceSourceType, source_identifier: string, source_version: string, target_identifier: string, relationship_type: DecisionInfluenceRelationshipType, score: number, weight: number, tenant_id: string, mission_id: string, decision_id: string, justification: string): DecisionInfluenceRecord {
  return influence({
    influence_id: buildInfluenceId(source_type, source_identifier, decision_id),
    tenant_id,
    mission_id,
    decision_id,
    source_type,
    source_identifier,
    source_version,
    target_identifier,
    relationship_type,
    contribution_level: contributionLevel(source_type, score),
    confidence_score: score,
    weight,
    justification,
    timestamp: NOW,
    replay_reference: `replay_${tenant_id}_${decision_id}_${source_type.toLowerCase()}`,
    truth_reference: `truth_${tenant_id}_${source_identifier}`,
  });
}

export function calculateInfluenceContributions(influences: readonly DecisionInfluenceRecord[]): readonly DecisionInfluenceRecord[] {
  return Object.freeze([...influences].sort((a, b) => PRECEDENCE.indexOf(a.source_type) - PRECEDENCE.indexOf(b.source_type) || b.weight - a.weight || a.source_identifier.localeCompare(b.source_identifier)));
}

function edge(input: Omit<DecisionInfluenceGraphEdge, "edge_hash">): DecisionInfluenceGraphEdge {
  return Object.freeze({ ...input, evidence_refs: uniq(input.evidence_refs), edge_hash: hashValue("decision-influence-edge", input) });
}

export function buildInfluenceGraph(influences: readonly DecisionInfluenceRecord[]): readonly DecisionInfluenceGraphEdge[] {
  const ordered = calculateInfluenceContributions(influences);
  return Object.freeze(ordered.slice(0, -1).map((item, index) => {
    const target = ordered[index + 1]!;
    return edge({
      edge_id: `DIA-EDGE-${index}-${item.influence_id}`,
      source_influence_id: item.influence_id,
      target_influence_id: target.influence_id,
      relationship_type: target.relationship_type,
      dependency_type: index === 0 ? "PRECEDENCE" : index > 2 ? "TRANSITIVE" : "DIRECT",
      evidence_refs: [item.truth_reference, target.truth_reference],
    });
  }));
}

export function resolveInfluenceDependencies(analysisOrInfluences: DecisionInfluenceAnalysis | readonly DecisionInfluenceRecord[]): readonly DecisionInfluenceGraphEdge[] {
  if ("dependencies" in analysisOrInfluences) return analysisOrInfluences.dependencies;
  return buildInfluenceGraph(analysisOrInfluences).filter((item) => item.dependency_type !== "CONFLICT");
}

export function detectInfluenceConflicts(influences: readonly DecisionInfluenceRecord[], scenario: DecisionInfluenceScenario = "BASELINE") {
  const risk = influences.find((item) => item.source_type === "RISK");
  const compliance = influences.find((item) => item.source_type === "COMPLIANCE");
  if (!risk || !compliance) return Object.freeze([]);
  const source = {
    conflict_id: `DIA-CONFLICT-${hashValue("decision-influence-conflict-id", { risk: risk.influence_id, compliance: compliance.influence_id }).slice(0, 10).toUpperCase()}`,
    conflict_type: "RISK_CONFLICT" as const,
    source_influence_id: risk.influence_id,
    target_influence_id: compliance.influence_id,
    resolution_state: scenario === "UNRESOLVED_CONFLICT" ? "UNRESOLVED" as const : "RESOLVED" as const,
    resolution_reason: "Risk and compliance influences are both preserved; constitutional precedence and operator review resolve ordering without mutating the conclusion.",
    constitutional_resolution_applied: true,
  };
  return Object.freeze([{ ...source, conflict_hash: hashValue("decision-influence-conflict", source) }]);
}

function expectedConfidence(influences: readonly DecisionInfluenceRecord[]): DecisionInfluenceConfidence {
  const weighted = influences.reduce((sum, item) => sum + item.confidence_score * item.weight, 0);
  const total = influences.reduce((sum, item) => sum + item.weight, 0) || 1;
  const score = Math.round(weighted / total);
  const source = {
    confidence_score: score,
    confidence_level: confidenceLevel(score),
    confidence_method: "WEIGHTED_INFLUENCE_CONFIDENCE_V1" as const,
    supporting_references: uniq(influences.map((item) => item.truth_reference)),
    validation_status: "REPRODUCIBLE" as const,
  };
  return Object.freeze({ ...source, confidence_hash: hashValue("decision-influence-confidence", source) });
}

function replayRefs(source: Omit<DecisionInfluenceAnalysis, "replay_refs" | "analysis_hash">): DecisionInfluenceReplayRefs {
  const influence_graph_hash = hashValue("decision-influence-graph", source.influence_graph);
  const dependency_graph_hash = hashValue("decision-influence-dependencies", source.dependencies);
  const contribution_hash = hashValue("decision-influence-contributions", source.influences.map((item) => ({ id: item.influence_id, level: item.contribution_level, weight: item.weight })));
  const conflict_resolution_hash = hashValue("decision-influence-conflicts", source.conflicts);
  const confidence_hash = source.confidence.confidence_hash;
  const governance_conclusion_hash = hashValue("decision-influence-conclusion", { decision_id: source.decision_id, governance_conclusion_ref: source.governance_conclusion_ref });
  return Object.freeze({
    replay_id: `DIA-REPLAY-${hashValue("decision-influence-replay-id", source.analysis_id).slice(0, 10).toUpperCase()}`,
    influence_graph_hash,
    dependency_graph_hash,
    contribution_hash,
    conflict_resolution_hash,
    confidence_hash,
    governance_conclusion_hash,
    analysis_output_hash: hashValue("decision-influence-output", { influence_graph_hash, dependency_graph_hash, contribution_hash, conflict_resolution_hash, confidence_hash, governance_conclusion_hash }),
  });
}

export function computeDecisionInfluenceHash(analysis: Omit<DecisionInfluenceAnalysis, "analysis_hash"> | DecisionInfluenceAnalysis): string {
  const { analysis_hash: _hash, ...source } = analysis as DecisionInfluenceAnalysis;
  return hashValue("decision-influence-analysis", source);
}

export function analyzeDecisionInfluence(input: DecisionInfluenceEngineInput = {}): DecisionInfluenceAnalysis {
  const scenario = input.scenario ?? "BASELINE";
  const governance = input.governance_lineage ?? registerGovernanceLineage();
  const policy = input.policy_lineage ?? reconstructPolicyLineage({ tenant_id: input.tenant_id ?? governance.tenant_id, mission_id: input.mission_id ?? governance.mission_id, governance_conclusion_ref: governance.governance_object.object_identifier });
  const tenant_id = input.tenant_id ?? governance.tenant_id;
  const mission_id = input.mission_id ?? governance.mission_id;
  const decision_id = input.decision_id ?? `decision_${tenant_id}_7g3`;
  const target = scenario === "MISSING_TARGET" ? "" : governance.governance_object.object_identifier || decision_id;
  const baseInfluences = [
    record("CONSTITUTION", governance.references.constitutional_rule_ids[0] ?? `constitution_${tenant_id}_operator_supremacy`, "v1.0.0", target, "CONSTRAINED_BY", 98, 0.2, tenant_id, mission_id, decision_id, "Constitutional precedence constrains the governance conclusion first."),
    record("AUTHORITY", governance.references.authority_ids[0] ?? `authority_${tenant_id}_operator_review`, "v1.0.0", target, "REQUIRED_BY", 94, 0.14, tenant_id, mission_id, decision_id, "Operator and governance authority determine review requirements."),
    record("POLICY", policy.root_policy.policy_id, policy.root_policy.policy_version, target, "DEPENDENT_ON", 96, 0.18, tenant_id, mission_id, decision_id, "Policy lineage provides the deterministic policy basis."),
    record("COMPLIANCE", governance.references.compliance_ids[0] ?? `compliance_${tenant_id}_lineage_evaluation`, "v1.0.0", target, "VALIDATED_BY", 90, 0.12, tenant_id, mission_id, decision_id, "Compliance findings validate constraints."),
    record("RISK", governance.references.risk_ids[0] ?? `risk_${tenant_id}_governance_lineage`, "v1.0.0", target, "INFLUENCED_BY", 88, 0.12, tenant_id, mission_id, decision_id, "Risk posture influences priority and confidence."),
    record("EVIDENCE", governance.references.evidence_ids[0] ?? `evidence_${tenant_id}_lineage_observation`, "v1.0.0", target, "SUPPORTED_BY", 92, 0.1, tenant_id, mission_id, decision_id, "Evidence supports the reconstructed conclusion."),
    record("RECOMMENDATION", governance.references.recommendation_ids[0] ?? `recommendation_${tenant_id}_7f_advisory`, "v1.0.0", target, "DERIVED_FROM", 86, 0.08, tenant_id, mission_id, decision_id, "Recommendation history contributes downstream reasoning."),
    record("ESCALATION", governance.references.escalation_ids[0] ?? `escalation_${tenant_id}_7f_certified`, "v1.0.0", target, "ESCALATED_BY", 84, 0.06, tenant_id, mission_id, decision_id, "Escalation review explains routing and severity."),
  ];
  let influences = calculateInfluenceContributions(baseInfluences);
  if (scenario === "MISSING_INFLUENCE_ID") influences = Object.freeze([{ ...influences[0]!, influence_id: "" }, ...influences.slice(1)]);
  if (scenario === "MISSING_SOURCE") influences = Object.freeze([{ ...influences[0]!, source_identifier: "" }, ...influences.slice(1)]);
  if (scenario === "INVALID_RELATIONSHIP") influences = Object.freeze([{ ...influences[0]!, relationship_type: "UNKNOWN" as DecisionInfluenceRelationshipType }, ...influences.slice(1)]);
  if (scenario === "CROSS_TENANT") influences = Object.freeze([{ ...influences[0]!, tenant_id: "tenant_beta", source_identifier: "constitution_tenant_beta_operator_supremacy" }, ...influences.slice(1)]);
  if (scenario === "CONTRIBUTION_FAILED") influences = Object.freeze([{ ...influences[0]!, contribution_level: "INFORMATIONAL", weight: 0 }, ...influences.slice(1)]);
  if (scenario === "HIDDEN_INFLUENCE") influences = Object.freeze([]);
  const influence_graph = scenario === "DEPENDENCY_INCOMPLETE" ? Object.freeze([]) : buildInfluenceGraph(influences);
  const dependencies = scenario === "CIRCULAR_DEPENDENCY" && influence_graph[0] ? Object.freeze([edge({ ...influence_graph[0], source_influence_id: influence_graph[0].target_influence_id, target_influence_id: influence_graph[0].target_influence_id })]) : influence_graph;
  const conflicts = detectInfluenceConflicts(influences, scenario);
  const confidence = scenario === "CONFIDENCE_MISMATCH" ? Object.freeze({ ...expectedConfidence(influences), confidence_score: 1, validation_status: "MISMATCH" as const }) : expectedConfidence(influences);
  const analysis_id = scenario === "MISSING_INFLUENCE_ID" ? "" : `DIA-7G3-${hashValue("decision-influence-analysis-id", { tenant_id, mission_id, decision_id, scenario }).slice(0, 10).toUpperCase()}`;
  const source: Omit<DecisionInfluenceAnalysis, "replay_refs" | "analysis_hash"> = {
    analysis_id,
    schema_version: SCHEMA_VERSION,
    tenant_id,
    mission_id,
    decision_id,
    governance_conclusion_ref: target,
    influences,
    influence_graph,
    dependencies,
    conflicts,
    constitutional_precedence: scenario === "PRECEDENCE_VIOLATION" ? Object.freeze(["EVIDENCE", "CONSTITUTION", "AUTHORITY", "POLICY", "COMPLIANCE", "RISK", "RECOMMENDATION", "ESCALATION"]) : PRECEDENCE,
    confidence,
    source_governance_lineage_id: governance.governance_lineage_id,
    source_policy_reconstruction_id: policy.reconstruction_id,
    source_truth_records: uniq([governance.replay_metadata.truth_record_reference, ...policy.source_truth_records]),
    explanation: Object.freeze({
      summary: "Decision influence analysis reconstructs constitutional, authority, policy, compliance, risk, evidence, recommendation, and escalation inputs for the governance conclusion.",
      policy_basis: policy.policy_history.map((item) => item.policy_id),
      evidence_basis: governance.references.evidence_ids,
      risk_basis: governance.references.risk_ids,
      compliance_basis: governance.references.compliance_ids,
      authority_basis: governance.references.authority_ids,
      escalation_basis: governance.references.escalation_ids,
      explanation_hash: hashValue("decision-influence-explanation", { decision_id, target, policy: policy.policy_history.map((item) => item.policy_id) }),
    }),
    state: "ANALYZED",
    advisory_boundary: Object.freeze({ advisory_only: true, mutates_decision: false, resolves_conflicts_autonomously: false, execution_authority: false }),
    created_timestamp: NOW,
  };
  const refs = replayRefs(source);
  const withReplay = Object.freeze({ ...source, replay_refs: scenario === "REPLAY_MISMATCH" ? Object.freeze({ ...refs, analysis_output_hash: "tampered" }) : refs });
  const analysis = Object.freeze({ ...withReplay, analysis_hash: computeDecisionInfluenceHash(withReplay) });
  if (scenario === "IMMUTABLE_MUTATION") return Object.freeze({ ...analysis, created_timestamp: "2026-06-27T00:00:00.000Z" });
  return analysis;
}

export function validateDecisionInfluenceAnalysis(analysis: Partial<DecisionInfluenceAnalysis> | undefined): DecisionInfluenceValidationResult {
  const errors: DecisionInfluenceValidationFailure[] = [];
  if (!analysis?.analysis_id || analysis.influences?.some((item) => !item.influence_id)) errors.push(failure("MISSING_INFLUENCE_IDENTIFIER", "influences.influence_id", "influence identifier is required"));
  if (!analysis?.influences?.length || analysis.influences.some((item) => !item.source_identifier)) errors.push(failure("SOURCE_REFERENCE_NOT_FOUND", "influences.source_identifier", "source reference is required"));
  if (!analysis?.decision_id || analysis.influences?.some((item) => !item.target_identifier)) errors.push(failure("TARGET_REFERENCE_NOT_FOUND", "decision_id", "decision and target identifiers are required"));
  if (analysis?.influences?.some((item) => !RELATIONSHIPS.includes(item.relationship_type))) errors.push(failure("INVALID_RELATIONSHIP_TYPE", "influences.relationship_type", "relationship type is unsupported"));
  if (!analysis?.dependencies?.length || !analysis.influence_graph?.length) errors.push(failure("DEPENDENCY_GRAPH_INCOMPLETE", "dependencies", "dependency graph is required"));
  if (analysis?.dependencies?.some((item) => item.source_influence_id === item.target_influence_id)) errors.push(failure("CIRCULAR_DEPENDENCY_DETECTED", "dependencies", "circular dependency detected"));
  if (canonicalizeConfidenceToString(analysis?.constitutional_precedence ?? []) !== canonicalizeConfidenceToString(PRECEDENCE)) errors.push(failure("CONSTITUTIONAL_PRECEDENCE_VIOLATION", "constitutional_precedence", "constitutional precedence must be evaluated first"));
  if (!analysis?.influences?.length) errors.push(failure("HIDDEN_INFLUENCE_DETECTED", "influences", "hidden influence is not allowed"));
  if (analysis?.influences?.some((item) => !item.contribution_level || item.weight <= 0 || item.confidence_score <= 0)) errors.push(failure("CONTRIBUTION_CALCULATION_FAILED", "influences.contribution_level", "contribution level, weight, and confidence are required"));
  if (analysis?.conflicts?.some((item) => item.resolution_state !== "RESOLVED" || !item.resolution_reason)) errors.push(failure("CONFLICT_RESOLUTION_INCOMPLETE", "conflicts", "conflicts must be resolved and documented"));
  if (!analysis?.replay_refs?.replay_id || !analysis.replay_refs.analysis_output_hash) errors.push(failure("REPLAY_RECONSTRUCTION_MISMATCH", "replay_refs", "replay metadata is required"));
  if (analysis?.replay_refs && analysis.replay_refs.analysis_output_hash !== hashValue("decision-influence-output", {
    influence_graph_hash: analysis.replay_refs.influence_graph_hash,
    dependency_graph_hash: analysis.replay_refs.dependency_graph_hash,
    contribution_hash: analysis.replay_refs.contribution_hash,
    conflict_resolution_hash: analysis.replay_refs.conflict_resolution_hash,
    confidence_hash: analysis.replay_refs.confidence_hash,
    governance_conclusion_hash: analysis.replay_refs.governance_conclusion_hash,
  })) errors.push(failure("REPLAY_RECONSTRUCTION_MISMATCH", "replay_refs.analysis_output_hash", "replay output hash mismatch"));
  if (analysis?.influences?.some((item) => item.tenant_id !== analysis.tenant_id || item.source_identifier.includes("tenant_beta"))) errors.push(failure("CROSS_TENANT_INFLUENCE_DETECTED", "tenant_id", "cross-tenant influence detected"));
  if (analysis?.created_timestamp && analysis.created_timestamp !== NOW) errors.push(failure("IMMUTABLE_INFLUENCE_MODIFIED", "created_timestamp", "immutable influence timestamp mutation detected"));
  if (analysis?.confidence && (analysis.confidence.validation_status !== "REPRODUCIBLE" || expectedConfidence(analysis.influences ?? []).confidence_hash !== analysis.confidence.confidence_hash)) errors.push(failure("CONFIDENCE_CALCULATION_MISMATCH", "confidence", "confidence calculation mismatch"));
  if (analysis?.advisory_boundary && (analysis.advisory_boundary.advisory_only !== true || analysis.advisory_boundary.mutates_decision !== false || analysis.advisory_boundary.resolves_conflicts_autonomously !== false || analysis.advisory_boundary.execution_authority !== false)) errors.push(failure("DECISION_INFLUENCE_VALIDATION_FAILED", "advisory_boundary", "decision influence analysis must remain advisory-only"));
  if (analysis?.analysis_hash && computeDecisionInfluenceHash(analysis as DecisionInfluenceAnalysis) !== analysis.analysis_hash) errors.push(failure("IMMUTABLE_INFLUENCE_MODIFIED", "analysis_hash", "analysis hash mismatch"));
  const validation_state: DecisionInfluenceValidationResult["validation_state"] = errors.some((error) => error.reason === "CROSS_TENANT_INFLUENCE_DETECTED")
    ? "TENANT_SCOPE_VIOLATION"
    : errors.some((error) => error.reason === "REPLAY_RECONSTRUCTION_MISMATCH")
      ? "REPLAY_MISMATCH"
      : errors.some((error) => ["HIDDEN_INFLUENCE_DETECTED", "IMMUTABLE_INFLUENCE_MODIFIED", "CONFIDENCE_CALCULATION_MISMATCH", "CONSTITUTIONAL_PRECEDENCE_VIOLATION"].includes(error.reason))
        ? "CERTIFICATION_BLOCKED"
        : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    analysis_id: analysis?.analysis_id,
    validation_state,
    validator_version: "DECISION-INFLUENCE-VALIDATOR-V1",
    checks: Object.freeze({
      identity_valid: !errors.some((error) => error.reason === "MISSING_INFLUENCE_IDENTIFIER"),
      sources_present: !errors.some((error) => error.reason === "SOURCE_REFERENCE_NOT_FOUND"),
      targets_present: !errors.some((error) => error.reason === "TARGET_REFERENCE_NOT_FOUND"),
      relationships_valid: !errors.some((error) => error.reason === "INVALID_RELATIONSHIP_TYPE"),
      dependencies_complete: !errors.some((error) => error.reason === "DEPENDENCY_GRAPH_INCOMPLETE"),
      no_circular_dependencies: !errors.some((error) => error.reason === "CIRCULAR_DEPENDENCY_DETECTED"),
      constitutional_precedence_enforced: !errors.some((error) => error.reason === "CONSTITUTIONAL_PRECEDENCE_VIOLATION"),
      influence_visible: !errors.some((error) => error.reason === "HIDDEN_INFLUENCE_DETECTED"),
      contributions_reproducible: !errors.some((error) => error.reason === "CONTRIBUTION_CALCULATION_FAILED"),
      conflicts_resolved: !errors.some((error) => error.reason === "CONFLICT_RESOLUTION_INCOMPLETE"),
      replay_ready: !errors.some((error) => error.reason === "REPLAY_RECONSTRUCTION_MISMATCH"),
      tenant_isolated: !errors.some((error) => error.reason === "CROSS_TENANT_INFLUENCE_DETECTED"),
      immutable: !errors.some((error) => error.reason === "IMMUTABLE_INFLUENCE_MODIFIED"),
      confidence_reproducible: !errors.some((error) => error.reason === "CONFIDENCE_CALCULATION_MISMATCH"),
      advisory_only_enforced: !errors.some((error) => error.field_path === "advisory_boundary"),
      hash_valid: !errors.some((error) => error.field_path === "analysis_hash"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function verifyInfluenceReplay(analysis: DecisionInfluenceAnalysis): DecisionInfluenceReplayResult {
  const validation = validateDecisionInfluenceAnalysis(analysis);
  const reconstructed_hash = computeDecisionInfluenceHash(analysis);
  const reproduced = validation.validation_state === "VALID" && reconstructed_hash === analysis.analysis_hash;
  return Object.freeze({
    replay_id: analysis.replay_refs.replay_id,
    replay_state: reproduced ? "REPRODUCED" : analysis.replay_refs.replay_id ? "MISMATCH" : "INCOMPLETE",
    reconstructed_hash,
    expected_hash: analysis.analysis_hash,
    analysis_id: analysis.analysis_id,
    failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "REPLAY_RECONSTRUCTION_MISMATCH",
  });
}

export function explainDecisionInfluence(analysis: DecisionInfluenceAnalysis = analyzeDecisionInfluence()) {
  return Object.freeze({
    analysis_id: analysis.analysis_id,
    decision_id: analysis.decision_id,
    summary: analysis.explanation.summary,
    mandatory_influences: analysis.influences.filter((item) => item.contribution_level === "MANDATORY").map((item) => item.source_identifier),
    policy_basis: analysis.explanation.policy_basis,
    evidence_basis: analysis.explanation.evidence_basis,
    risk_basis: analysis.explanation.risk_basis,
    compliance_basis: analysis.explanation.compliance_basis,
    authority_basis: analysis.explanation.authority_basis,
    escalation_basis: analysis.explanation.escalation_basis,
    confidence_basis: `${analysis.confidence.confidence_level} via ${analysis.confidence.confidence_method}`,
    explanation_hash: analysis.explanation.explanation_hash,
  });
}

export function runDecisionInfluenceAnalysis(input: DecisionInfluenceEngineInput = {}): DecisionInfluenceEngineResult {
  const analysis = analyzeDecisionInfluence(input);
  const validation = validateDecisionInfluenceAnalysis(analysis);
  const replay = verifyInfluenceReplay(analysis);
  return Object.freeze({ engine_id: hashValue("decision-influence-engine", analysis.analysis_hash), analysis, validation, replay });
}

export function buildDecisionInfluenceObservabilitySurface(input: DecisionInfluenceEngineInput = {}): DecisionInfluenceObservabilitySurface {
  const result = runDecisionInfluenceAnalysis(input);
  return Object.freeze({
    analysis_id: result.analysis.analysis_id,
    decision_id: result.analysis.decision_id,
    influence_count: result.analysis.influences.length,
    dependency_count: result.analysis.dependencies.length,
    conflict_count: result.analysis.conflicts.length,
    mandatory_influences: Object.freeze(result.analysis.influences.filter((item) => item.contribution_level === "MANDATORY").map((item) => item.source_identifier)),
    replay_state: result.replay.replay_state,
    validation_failures: Object.freeze(result.validation.errors.map((error) => error.reason)),
    explanation_summary: result.analysis.explanation.summary,
    advisory_only_notice: "Decision influence analysis is advisory-only; it reconstructs reasoning without mutating decisions, resolving conflicts autonomously, or executing actions.",
  });
}

export function getDecisionInfluenceContract() {
  const result = runDecisionInfluenceAnalysis();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: Object.freeze(["deterministic", "explainable", "replayable", "evidence-first", "constitution-aware", "policy-aware", "advisory-only", "immutable-lineage", "no-hidden-reasoning", "fail-closed"]),
      supported_relationships: RELATIONSHIPS,
      supported_states: STATES,
      constitutional_precedence: PRECEDENCE,
      schema_version: SCHEMA_VERSION,
    }),
    analysis: result.analysis,
    validation: result.validation,
    replay: result.replay,
  });
}
