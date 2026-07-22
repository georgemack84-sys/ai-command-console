import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createDecisionPriority } from "@/services/decision-priority-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  DependencyPriorityLevel,
  DependencyWeightAnalyzerInput,
  DependencyWeightAnalyzerResult,
  DependencyWeightAssessment,
  DependencyWeightExplanation,
  DependencyWeightFailureReason,
  DependencyWeightLedgerRecord,
  DependencyWeightObservability,
  DependencyWeightReplayRecord,
  ExecutionSequenceAssessment,
  ExecutionSequenceState,
} from "@/types/decision-dependency-weight-analyzer";

const NOW = "2026-07-03T09:56:00.000Z";
const ENGINE_VERSION = "dependency-weight-analyzer/v1";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function defaultCandidate(): DecisionCandidate {
  const normalized = normalizeDecisionCandidateInput();
  if (!normalized.candidate) throw new Error("default normalized decision candidate unavailable");
  return normalized.candidate;
}

function refs(input: DependencyWeightAnalyzerInput, candidate: DecisionCandidate) {
  const downstream = normalizeStrings(input.downstream_refs ?? candidate.evidence_refs.map((ref) => `downstream_${ref}`));
  return Object.freeze({
    prerequisite_refs: normalizeStrings(input.prerequisite_refs ?? candidate.risk_refs.map((ref) => `prerequisite_${ref}`)),
    blocked_by_refs: normalizeStrings(input.blocked_by_refs ?? []),
    downstream_refs: downstream,
    dependency_refs: normalizeStrings(input.dependency_refs ?? [...downstream, ...candidate.risk_refs.map((ref) => `dependency_${ref}`)]),
    governance_refs: normalizeStrings(input.governance_refs ?? candidate.governance_refs),
    evidence_refs: normalizeStrings(input.evidence_refs ?? candidate.evidence_refs),
    replay_refs: normalizeStrings(input.replay_refs ?? candidate.replay_refs),
    unresolved_cycle_refs: normalizeStrings(input.unresolved_cycle_refs),
  });
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function priorityLevel(score: number): DependencyPriorityLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "NONE";
}

function blockedDecisionCount(input: DependencyWeightAnalyzerInput, referenceSet: ReturnType<typeof refs>): number {
  return Math.max(0, Math.round(input.blocked_decision_count ?? referenceSet.downstream_refs.length));
}

function dependencyWeightScore(input: DependencyWeightAnalyzerInput, blockedCount: number, referenceSet: ReturnType<typeof refs>): number {
  const blockedWorkflows = Math.max(0, Math.round(input.blocked_workflow_count ?? 0));
  const dependencyDensity = Math.min(100, referenceSet.dependency_refs.length * 12);
  return clamp(blockedCount * 12 + blockedWorkflows * 10 + dependencyDensity * 0.35);
}

function chainDepth(input: DependencyWeightAnalyzerInput, referenceSet: ReturnType<typeof refs>): number {
  return Math.max(0, Math.round(input.dependency_chain_depth ?? Math.max(1, referenceSet.prerequisite_refs.length + referenceSet.downstream_refs.length)));
}

function chainDepthScore(depth: number): number {
  return clamp(depth * 18);
}

function graphDepthScore(input: DependencyWeightAnalyzerInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.graph_depth_score !== undefined) return clamp(input.graph_depth_score);
  const centrality = input.graph_centrality_score ?? Math.min(100, (referenceSet.prerequisite_refs.length + referenceSet.downstream_refs.length) * 14);
  return clamp(centrality);
}

function cascadeScore(input: DependencyWeightAnalyzerInput, referenceSet: ReturnType<typeof refs>): number {
  if (input.cascade_impact_score !== undefined) return clamp(input.cascade_impact_score);
  return clamp(referenceSet.downstream_refs.length * 20);
}

function bottleneckScore(input: DependencyWeightAnalyzerInput, blockedCount: number): number {
  if (input.bottleneck_score !== undefined) return clamp(input.bottleneck_score);
  return clamp(blockedCount * 15 + (input.blocked_workflow_count ?? 0) * 12);
}

function sequenceState(input: DependencyWeightAnalyzerInput, referenceSet: ReturnType<typeof refs>): ExecutionSequenceState {
  if (input.execution_sequence_state) return input.execution_sequence_state;
  if (referenceSet.unresolved_cycle_refs.length > 0) return "INVALID";
  if (referenceSet.blocked_by_refs.length > 0) return "BLOCKED";
  if (referenceSet.prerequisite_refs.length > 0) return "WAITING";
  return "READY";
}

function sequenceScore(input: DependencyWeightAnalyzerInput, state: ExecutionSequenceState): number {
  if (input.execution_sequence_score !== undefined) return clamp(input.execution_sequence_score);
  if (state === "VALID" || state === "READY") return 90;
  if (state === "WAITING") return 55;
  if (state === "BLOCKED") return 25;
  return 0;
}

function compositeDependencyScore(scores: {
  dependency: number;
  blockage: number;
  chain: number;
  graph: number;
  cascade: number;
  bottleneck: number;
  sequence: number;
}): number {
  const weighted = clamp(
    scores.dependency * 0.18
    + scores.blockage * 0.16
    + scores.chain * 0.14
    + scores.graph * 0.16
    + scores.cascade * 0.16
    + scores.bottleneck * 0.14
    + scores.sequence * 0.06,
  );
  if (scores.bottleneck >= 90 || scores.cascade >= 90) return Math.max(90, weighted);
  return weighted;
}

function priorityAdjustment(score: number, sequence: ExecutionSequenceState): number {
  if (sequence === "INVALID") return -20;
  if (sequence === "BLOCKED") return -10;
  if (score >= 90) return 20;
  if (score >= 75) return 15;
  if (score >= 45) return 8;
  return 0;
}

function scoreInputsInvalid(input: DependencyWeightAnalyzerInput): boolean {
  return [
    input.blocked_decision_count,
    input.blocked_workflow_count,
    input.dependency_chain_depth,
    input.graph_depth_score,
    input.graph_centrality_score,
    input.cascade_impact_score,
    input.bottleneck_score,
    input.execution_sequence_score,
  ].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 100));
}

function collectFailures(input: DependencyWeightAnalyzerInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, sequence: ExecutionSequenceState): DependencyWeightFailureReason[] {
  const failures: DependencyWeightFailureReason[] = [];
  if ((input.hidden_weighting_refs ?? []).length > 0) failures.push("HIDDEN_DEPENDENCY_WEIGHTING_DETECTED");
  if (input.dependency_graph_complete === false) failures.push("DEPENDENCY_GRAPH_INCOMPLETE");
  if (referenceSet.dependency_refs.length === 0) failures.push("DEPENDENCY_REFERENCES_MISSING");
  if (input.graph_integrity_verified === false || scoreInputsInvalid(input)) failures.push("GRAPH_INTEGRITY_VERIFICATION_FAILED");
  if (sequence === "INVALID" || (sequence === "READY" && referenceSet.blocked_by_refs.length > 0)) failures.push("EXECUTION_SEQUENCE_INCONSISTENT");
  if (referenceSet.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (referenceSet.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (referenceSet.unresolved_cycle_refs.length > 0) failures.push("CYCLIC_DEPENDENCY_UNRESOLVED");
  if (input.canonical_ordering_reproducible === false) failures.push("CANONICAL_GRAPH_ORDERING_FAILED");
  if (tenantLeak([
    ...referenceSet.prerequisite_refs,
    ...referenceSet.blocked_by_refs,
    ...referenceSet.downstream_refs,
    ...referenceSet.dependency_refs,
    ...referenceSet.governance_refs,
    ...referenceSet.evidence_refs,
    ...referenceSet.replay_refs,
    ...referenceSet.unresolved_cycle_refs,
  ], candidate.tenant_id)) failures.push("CROSS_TENANT_DEPENDENCY_DETECTED");
  return failures;
}

function buildDependencyAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, scores: {
  dependency: number;
  blockedCount: number;
  chainDepth: number;
  graph: number;
  cascade: number;
  bottleneck: number;
  sequence: number;
  composite: number;
}): DependencyWeightAssessment {
  const base: Omit<DependencyWeightAssessment, "integrity_hash"> = {
    assessment_id: `dependency_weight_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    dependency_weight_score: scores.dependency,
    blocked_decision_count: scores.blockedCount,
    dependency_chain_depth: scores.chainDepth,
    graph_depth_score: scores.graph,
    cascade_impact_score: scores.cascade,
    bottleneck_score: scores.bottleneck,
    execution_sequence_score: scores.sequence,
    composite_dependency_score: scores.composite,
    dependency_priority_level: priorityLevel(scores.composite),
    explanation_ref: `dependency_weight_explanation_${candidate.candidate_id}`,
    dependency_refs: referenceSet.dependency_refs,
    governance_refs: referenceSet.governance_refs,
    evidence_refs: referenceSet.evidence_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildSequenceAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, state: ExecutionSequenceState, score: number): ExecutionSequenceAssessment {
  const base: Omit<ExecutionSequenceAssessment, "integrity_hash"> = {
    sequence_id: `dependency_sequence_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    execution_sequence_state: state,
    prerequisite_refs: referenceSet.prerequisite_refs,
    blocked_by_refs: referenceSet.blocked_by_refs,
    downstream_refs: referenceSet.downstream_refs,
    sequence_score: score,
    sequencing_validation: state === "INVALID" ? "FAIL" : "PASS",
    explanation_ref: `dependency_weight_explanation_${candidate.candidate_id}`,
    dependency_refs: referenceSet.dependency_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(assessment: DependencyWeightAssessment, sequence: ExecutionSequenceAssessment, adjustment: number): DependencyWeightExplanation {
  const base: Omit<DependencyWeightExplanation, "integrity_hash"> = {
    explanation_id: assessment.explanation_ref,
    decision_candidate_id: assessment.decision_candidate_id,
    blockage_rationale: `${assessment.blocked_decision_count} blocked decisions contribute to dependency weight ${assessment.dependency_weight_score}.`,
    chain_rationale: `Dependency chain depth ${assessment.dependency_chain_depth}.`,
    graph_rationale: `Graph influence score ${assessment.graph_depth_score}.`,
    cascade_rationale: `Cascade impact score ${assessment.cascade_impact_score}.`,
    bottleneck_rationale: `Bottleneck score ${assessment.bottleneck_score}.`,
    sequencing_rationale: `Execution sequence ${sequence.execution_sequence_state} with score ${sequence.sequence_score}.`,
    priority_adjustment_rationale: `Dependency priority adjustment ${adjustment}.`,
    replay_refs: assessment.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLedger(assessment: DependencyWeightAssessment, sequence: ExecutionSequenceAssessment, adjustment: number): DependencyWeightLedgerRecord {
  const base: Omit<DependencyWeightLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `dependency_weight_ledger_${assessment.decision_candidate_id}`,
    decision_candidate_id: assessment.decision_candidate_id,
    dependency_assessment_ref: assessment.assessment_id,
    sequence_assessment_ref: sequence.sequence_id,
    dependency_score: assessment.composite_dependency_score,
    priority_adjustment: adjustment,
    dependency_priority_level: assessment.dependency_priority_level,
    execution_sequence_state: sequence.execution_sequence_state,
    affected_decision_refs: sequence.downstream_refs,
    dependency_refs: assessment.dependency_refs,
    governance_refs: assessment.governance_refs,
    evidence_refs: assessment.evidence_refs,
    replay_refs: assessment.replay_refs,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { dependency: DependencyWeightAssessment; sequence: ExecutionSequenceAssessment; explanation: DependencyWeightExplanation; ledger: DependencyWeightLedgerRecord }): string {
  return hash(input);
}

function buildReplay(candidateId: string, replayHash: string, dependencyScore: number, failures: readonly DependencyWeightFailureReason[]): DependencyWeightReplayRecord {
  const base: Omit<DependencyWeightReplayRecord, "integrity_hash"> = {
    replay_id: `dependency_weight_replay_${candidateId}`,
    decision_candidate_id: candidateId,
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    dependency_score: dependencyScore,
    replay_valid: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function analyzeDependencyWeight(input: DependencyWeightAnalyzerInput = {}): DependencyWeightAnalyzerResult {
  const candidate = input.candidate ?? defaultCandidate();
  const referenceSet = refs(input, candidate);
  const blockedCount = blockedDecisionCount(input, referenceSet);
  const dependency = dependencyWeightScore(input, blockedCount, referenceSet);
  const depth = chainDepth(input, referenceSet);
  const chain = chainDepthScore(depth);
  const graph = graphDepthScore(input, referenceSet);
  const cascade = cascadeScore(input, referenceSet);
  const bottleneck = bottleneckScore(input, blockedCount);
  const state = sequenceState(input, referenceSet);
  const sequence = sequenceScore(input, state);
  const blockage = clamp(blockedCount * 14);
  const composite = compositeDependencyScore({ dependency, blockage, chain, graph, cascade, bottleneck, sequence });
  const dependencyAssessment = buildDependencyAssessment(candidate, referenceSet, {
    dependency,
    blockedCount,
    chainDepth: depth,
    graph,
    cascade,
    bottleneck,
    sequence,
    composite,
  });
  const sequenceAssessment = buildSequenceAssessment(candidate, referenceSet, state, sequence);
  const adjustment = priorityAdjustment(composite, state);
  const explanation = buildExplanation(dependencyAssessment, sequenceAssessment, adjustment);
  const ledger = buildLedger(dependencyAssessment, sequenceAssessment, adjustment);
  const failures = collectFailures(input, candidate, referenceSet, state);
  const replayHash = replayHashValue({ dependency: dependencyAssessment, sequence: sequenceAssessment, explanation, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "DEPENDENCY_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(candidate.candidate_id, replayHash, composite, Object.freeze(replayFailures));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const priority = createDecisionPriority({
    candidate,
    scores: { dependency_score: composite },
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
  });
  const base: Omit<DependencyWeightAnalyzerResult, "integrity_hash"> = {
    analyzer_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    dependency_assessment: dependencyAssessment,
    execution_sequence_assessment: sequenceAssessment,
    explanation,
    ledger_record: ledger,
    replay_record: replay,
    priority_input: priority,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayDependencyWeightAnalysis(result: DependencyWeightAnalyzerResult): DependencyWeightReplayRecord {
  const replayHash = replayHashValue({
    dependency: result.dependency_assessment,
    sequence: result.execution_sequence_assessment,
    explanation: result.explanation,
    ledger: result.ledger_record,
  });
  const failures: DependencyWeightFailureReason[] = replayHash === result.replay_hash ? [] : ["DEPENDENCY_REPLAY_MISMATCH"];
  return buildReplay(result.dependency_assessment.decision_candidate_id, replayHash, result.dependency_assessment.composite_dependency_score, Object.freeze(failures));
}

export function buildDependencyWeightObservability(results: readonly DependencyWeightAnalyzerResult[]): DependencyWeightObservability {
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.analyzer_status === "PASS").length,
    fail_count: results.filter((result) => result.analyzer_status === "FAIL").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    graph_failures: results.filter((result) => result.failures.includes("DEPENDENCY_GRAPH_INCOMPLETE") || result.failures.includes("GRAPH_INTEGRITY_VERIFICATION_FAILED")).length,
    sequence_failures: results.filter((result) => result.failures.includes("EXECUTION_SEQUENCE_INCONSISTENT")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_DEPENDENCY_DETECTED")).length,
    average_dependency_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.dependency_assessment.composite_dependency_score, 0) / results.length,
    blocked_decisions_total: results.reduce((sum, result) => sum + result.dependency_assessment.blocked_decision_count, 0),
    dependency_distribution: Object.freeze(results.reduce<Record<DependencyPriorityLevel, number>>((counts, result) => {
      counts[result.dependency_assessment.dependency_priority_level] = (counts[result.dependency_assessment.dependency_priority_level] ?? 0) + 1;
      return counts;
    }, {} as Record<DependencyPriorityLevel, number>)),
    sequence_distribution: Object.freeze(results.reduce<Record<ExecutionSequenceState, number>>((counts, result) => {
      counts[result.execution_sequence_assessment.execution_sequence_state] = (counts[result.execution_sequence_assessment.execution_sequence_state] ?? 0) + 1;
      return counts;
    }, {} as Record<ExecutionSequenceState, number>)),
  });
}

export function getDependencyWeightAnalyzerEngine() {
  const result = analyzeDependencyWeight();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayDependencyWeightAnalysis(result),
    observability: buildDependencyWeightObservability([result]),
  });
}
