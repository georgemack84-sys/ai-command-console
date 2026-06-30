import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createRecoveryRecord, validateRecoveryContract } from "@/services/recovery-contract";
import type {
  DependencyGraphEdge,
  DependencyGraphNode,
  FailureAnalysisCategory,
  FailureAnalysisConfidenceLevel,
  FailureAnalysisEngineContract,
  FailureAnalysisFailure,
  FailureAnalysisInput,
  FailureAnalysisObject,
  FailureAnalysisObservabilitySurface,
  FailureAnalysisReplayResult,
  FailureAnalysisScenario,
  FailureAnalysisSignal,
  FailureAnalysisValidationResult,
  FailureConfidenceAssessment,
  FailureEvidenceRecord,
  RecoveryCandidate,
  RootCauseNode,
} from "@/types/failure-analysis-engine";
import type { RecoveryCategory, RecoveryRiskLevel, RecoveryValidationStatus } from "@/types/recovery-contract";

const NOW = "2026-07-04T12:00:00.000Z";
const VERSION = "failure-analysis-engine/v8ALT.2.2" as const;
const REPLAY_VERSION = "failure-analysis-replay/v8ALT.2.2" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const EXECUTION_ID = "execution:failure-analysis:primary";

const supportedCategories: readonly FailureAnalysisCategory[] = Object.freeze(["EXECUTION", "PLANNING", "ORCHESTRATION", "DEPENDENCY", "SUPERVISION", "INTEGRITY", "CHECKPOINT_CORRUPTION", "RESOURCE_EXHAUSTION", "AUTHORITY_VIOLATION", "GOVERNANCE_VIOLATION"]);
const confidenceLevels: readonly FailureAnalysisConfidenceLevel[] = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values)].sort());
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

const scenarioProfile: Record<FailureAnalysisScenario, { category: FailureAnalysisCategory; signal: FailureAnalysisSignal; cause: string; candidate: RecoveryCategory | "DEPENDENCY_REPAIR" | "STAGED_RECOVERY"; risk: RecoveryRiskLevel }> = {
  BASELINE_EXECUTION: { category: "EXECUTION", signal: "execution timeout", cause: "Execution exceeded the deterministic runtime threshold.", candidate: "CHECKPOINT_RESTORE", risk: "LOW" },
  PLANNING_FAILURE: { category: "PLANNING", signal: "incomplete decomposition", cause: "Plan decomposition omitted a required execution objective.", candidate: "ALTERNATIVE_PATH", risk: "MEDIUM" },
  ORCHESTRATION_FAILURE: { category: "ORCHESTRATION", signal: "scheduling conflict", cause: "Workflow scheduler produced conflicting execution windows.", candidate: "RETRY", risk: "MEDIUM" },
  DEPENDENCY_FAILURE: { category: "DEPENDENCY", signal: "missing dependency", cause: "Required dependency was unavailable at execution time.", candidate: "DEPENDENCY_REPAIR", risk: "MEDIUM" },
  SUPERVISION_FAILURE: { category: "SUPERVISION", signal: "monitoring degradation", cause: "Runtime supervision lost required observation coverage.", candidate: "MANUAL_INTERVENTION", risk: "HIGH" },
  INTEGRITY_FAILURE: { category: "INTEGRITY", signal: "integrity hash mismatch", cause: "Integrity verification detected a hash mismatch.", candidate: "TERMINATE", risk: "HIGH" },
  CHECKPOINT_CORRUPTION: { category: "CHECKPOINT_CORRUPTION", signal: "corrupted checkpoint", cause: "Checkpoint snapshot failed deterministic validation.", candidate: "ROLLBACK", risk: "HIGH" },
  RESOURCE_EXHAUSTION: { category: "RESOURCE_EXHAUSTION", signal: "memory exhaustion", cause: "Runtime resources were exhausted before task completion.", candidate: "STAGED_RECOVERY", risk: "MEDIUM" },
  AUTHORITY_VIOLATION: { category: "AUTHORITY_VIOLATION", signal: "privilege escalation", cause: "Execution attempted to exceed delegated authority scope.", candidate: "MANUAL_INTERVENTION", risk: "CRITICAL" },
  GOVERNANCE_VIOLATION: { category: "GOVERNANCE_VIOLATION", signal: "governance bypass", cause: "Execution path bypassed required governance validation.", candidate: "ESCALATE", risk: "CRITICAL" },
  LOW_EVIDENCE: { category: "EXECUTION", signal: "stalled execution", cause: "Available evidence is insufficient to fully isolate the stall.", candidate: "MANUAL_INTERVENTION", risk: "HIGH" },
  REPLAY_MISMATCH: { category: "INTEGRITY", signal: "replay mismatch", cause: "Replay reconstruction produced a mismatch.", candidate: "TERMINATE", risk: "HIGH" },
  LINEAGE_BROKEN: { category: "INTEGRITY", signal: "lineage corruption", cause: "Failure lineage reference is incomplete.", candidate: "ESCALATE", risk: "HIGH" },
  TENANT_ISOLATION_FAILURE: { category: "GOVERNANCE_VIOLATION", signal: "tenant isolation violation", cause: "Failure evidence crossed tenant boundaries.", candidate: "TERMINATE", risk: "CRITICAL" },
  AUTONOMOUS_RECOVERY_ATTEMPT: { category: "AUTHORITY_VIOLATION", signal: "unauthorized execution", cause: "Recovery action was attempted without operator approval.", candidate: "MANUAL_INTERVENTION", risk: "CRITICAL" },
  GOVERNANCE_MUTATION_ATTEMPT: { category: "GOVERNANCE_VIOLATION", signal: "policy violation", cause: "Analysis attempted to modify governance policy.", candidate: "ESCALATE", risk: "CRITICAL" },
  EVIDENCE_FABRICATION: { category: "INTEGRITY", signal: "evidence inconsistency", cause: "Evidence provenance could not be verified.", candidate: "TERMINATE", risk: "CRITICAL" },
  HIDDEN_RUNTIME_STATE: { category: "SUPERVISION", signal: "missing observations", cause: "Runtime state was concealed from operator visibility.", candidate: "MANUAL_INTERVENTION", risk: "CRITICAL" },
};

function scenarioFailures(scenario: FailureAnalysisScenario): readonly FailureAnalysisFailure[] {
  const map: Partial<Record<FailureAnalysisScenario, FailureAnalysisFailure>> = {
    LOW_EVIDENCE: "CONFIDENCE_INSUFFICIENT",
    REPLAY_MISMATCH: "REPLAY_INVALID",
    LINEAGE_BROKEN: "LINEAGE_INVALID",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_INVALID",
    AUTONOMOUS_RECOVERY_ATTEMPT: "AUTONOMOUS_RECOVERY_DETECTED",
    GOVERNANCE_MUTATION_ATTEMPT: "GOVERNANCE_MUTATION_DETECTED",
    EVIDENCE_FABRICATION: "EVIDENCE_FABRICATION_DETECTED",
    HIDDEN_RUNTIME_STATE: "HIDDEN_STATE_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function confidenceLevel(score: number): FailureAnalysisConfidenceLevel {
  if (score >= 0.9) return "VERY_HIGH";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.65) return "MEDIUM";
  if (score >= 0.4) return "LOW";
  return "INSUFFICIENT";
}

function evidenceRecord(analysis_id: string, category: FailureAnalysisCategory, signal: FailureAnalysisSignal, source_layer: string, failures: readonly FailureAnalysisFailure[]): FailureEvidenceRecord {
  const fabricated = failures.includes("EVIDENCE_FABRICATION_DETECTED");
  const base = {
    evidence_id: id("FAE", "failure-analysis-evidence", { analysis_id, source_layer, signal }),
    analysis_id,
    category,
    signal,
    source_layer,
    description: `Deterministic ${source_layer.toLowerCase()} evidence for ${signal}.`,
    immutable: !fabricated,
    replay_reference: `replay:${analysis_id}:${source_layer.toLowerCase()}`,
    lineage_reference: `lineage:${analysis_id}:${source_layer.toLowerCase()}`,
    integrity_hash: fabricated ? "" : hashValue("failure-analysis-evidence-integrity", { analysis_id, source_layer, signal }),
  };
  return Object.freeze({ ...base, evidence_hash: hashValue("failure-analysis-evidence", base) });
}

function rootCauseNode(analysis_id: string, profile: typeof scenarioProfile[FailureAnalysisScenario], evidence: readonly FailureEvidenceRecord[]): RootCauseNode {
  const base = {
    cause_id: id("FARC", "failure-analysis-root-cause", { analysis_id, cause: profile.cause }),
    level: "PRIMARY" as const,
    cause: profile.cause,
    evidence_references: freezeArray(evidence.map((item) => item.evidence_id)),
    impacted_components: freezeArray([profile.category.toLowerCase(), "recovery-intelligence"]),
    severity: profile.risk,
  };
  return Object.freeze({ ...base, cause_hash: hashValue("failure-analysis-root-cause", base) });
}

function contributingCauses(analysis_id: string, profile: typeof scenarioProfile[FailureAnalysisScenario], evidence: readonly FailureEvidenceRecord[]): readonly RootCauseNode[] {
  const secondary = {
    cause_id: id("FACC", "failure-analysis-contributing-cause", { analysis_id, category: profile.category }),
    level: "CONTRIBUTING" as const,
    cause: `${profile.category.toLowerCase()} telemetry indicates cascading recovery risk.`,
    evidence_references: freezeArray(evidence.slice(0, 2).map((item) => item.evidence_id)),
    impacted_components: freezeArray(["dependency-graph", "operator-review"]),
    severity: profile.risk,
  };
  return freezeArray([Object.freeze({ ...secondary, cause_hash: hashValue("failure-analysis-contributing-cause", secondary) })]);
}

function dependencyGraph(analysis_id: string, profile: typeof scenarioProfile[FailureAnalysisScenario], failures: readonly FailureAnalysisFailure[]) {
  const layers: readonly DependencyGraphNode["layer"][] = Object.freeze(["EXECUTION", "PLANNING", "ORCHESTRATION", "GOVERNANCE", "AUTHORITY", "INTEGRITY"]);
  const nodes = failures.includes("LINEAGE_INVALID")
    ? freezeArray(layers.slice(0, 3).map((layer) => dependencyNode(analysis_id, layer, profile)))
    : freezeArray(layers.map((layer) => dependencyNode(analysis_id, layer, profile)));
  const edges = freezeArray(nodes.slice(1).map((node, index) => dependencyEdge(nodes[index].node_id, node.node_id, index % 2 === 0 ? "PROPAGATES_TO" : "REQUIRES")));
  return Object.freeze({ nodes, edges, graph_hash: hashValue("failure-analysis-dependency-graph", { nodes: nodes.map((node) => node.node_hash), edges: edges.map((edge) => edge.edge_hash) }) });
}

function dependencyNode(analysis_id: string, layer: DependencyGraphNode["layer"], profile: typeof scenarioProfile[FailureAnalysisScenario]): DependencyGraphNode {
  const failed = layer === profile.category || (profile.category === "RESOURCE_EXHAUSTION" && layer === "EXECUTION") || (profile.category === "CHECKPOINT_CORRUPTION" && layer === "INTEGRITY");
  const base = {
    node_id: id("FADN", "failure-analysis-dependency-node", { analysis_id, layer }),
    layer,
    dependency_reference: `${layer.toLowerCase()}:${analysis_id}`,
    status: failed ? "FAILED" as const : "AFFECTED" as const,
    impact: failed ? profile.risk : "MEDIUM" as RecoveryRiskLevel,
  };
  return Object.freeze({ ...base, node_hash: hashValue("failure-analysis-dependency-node", base) });
}

function dependencyEdge(from: string, to: string, relationship: DependencyGraphEdge["relationship"]): DependencyGraphEdge {
  const base = { from, to, relationship };
  return Object.freeze({ ...base, edge_hash: hashValue("failure-analysis-dependency-edge", base) });
}

function confidenceAssessment(analysis_id: string, failures: readonly FailureAnalysisFailure[]): FailureConfidenceAssessment {
  const evidence_completeness = failures.includes("CONFIDENCE_INSUFFICIENT") || failures.includes("EVIDENCE_FABRICATION_DETECTED") ? 0.35 : 0.96;
  const replay_consistency = failures.includes("REPLAY_INVALID") ? 0.25 : 0.95;
  const integrity_verification = failures.includes("INTEGRITY_INVALID") || failures.includes("EVIDENCE_FABRICATION_DETECTED") ? 0.2 : 0.94;
  const dependency_certainty = failures.includes("LINEAGE_INVALID") || failures.includes("CONFIDENCE_INSUFFICIENT") ? 0.5 : 0.92;
  const governance_certainty = failures.includes("GOVERNANCE_MUTATION_DETECTED") ? 0.25 : 0.93;
  const authority_certainty = failures.includes("AUTONOMOUS_RECOVERY_DETECTED") ? 0.25 : 0.93;
  const historical_similarity = failures.includes("CONFIDENCE_INSUFFICIENT") ? 0.5 : 0.88;
  const runtime_observability = failures.includes("HIDDEN_STATE_DETECTED") ? 0.2 : failures.includes("CONFIDENCE_INSUFFICIENT") ? 0.45 : 0.91;
  const confidence_score = Number(((evidence_completeness + replay_consistency + integrity_verification + dependency_certainty + governance_certainty + authority_certainty + historical_similarity + runtime_observability) / 8).toFixed(4));
  const base = { confidence_score, confidence_level: confidenceLevel(confidence_score), evidence_completeness, replay_consistency, integrity_verification, dependency_certainty, governance_certainty, authority_certainty, historical_similarity, runtime_observability };
  return Object.freeze({ ...base, confidence_hash: hashValue("failure-analysis-confidence", { analysis_id, ...base }) });
}

function recoveryCandidates(analysis_id: string, profile: typeof scenarioProfile[FailureAnalysisScenario], confidence: FailureAnalysisConfidenceLevel, failures: readonly FailureAnalysisFailure[]): readonly RecoveryCandidate[] {
  const governance_validation: RecoveryValidationStatus = failures.includes("GOVERNANCE_MUTATION_DETECTED") ? "INVALID" : "VALID";
  const authority_validation: RecoveryValidationStatus = failures.includes("AUTONOMOUS_RECOVERY_DETECTED") ? "INVALID" : "VALID";
  const candidates = [
    candidate(analysis_id, profile.candidate, profile, confidence, governance_validation, authority_validation),
    candidate(analysis_id, "MANUAL_INTERVENTION", profile, failures.length ? "LOW" : "HIGH", governance_validation, authority_validation),
  ];
  return freezeArray(candidates);
}

function candidate(analysis_id: string, candidate_type: RecoveryCandidate["candidate_type"], profile: typeof scenarioProfile[FailureAnalysisScenario], confidence: FailureAnalysisConfidenceLevel, governance_validation: RecoveryValidationStatus, authority_validation: RecoveryValidationStatus): RecoveryCandidate {
  const base = {
    candidate_id: id("FAC", "failure-analysis-candidate", { analysis_id, candidate_type }),
    analysis_id,
    candidate_type,
    explanation: `${candidate_type.toLowerCase().replace(/_/g, " ")} is advisory for ${profile.signal}.`,
    confidence,
    governance_validation,
    authority_validation,
    expected_outcome: "Operator receives a governance-safe recovery option without autonomous execution.",
    estimated_recovery_effort: profile.risk === "CRITICAL" ? "PT45M" : "PT20M",
    associated_risks: freezeArray(profile.risk === "LOW" ? ["checkpoint validation required"] : [profile.risk.toLowerCase(), "operator approval required"]),
    advisory_only: true as const,
  };
  return Object.freeze({ ...base, candidate_hash: hashValue("failure-analysis-candidate", base) });
}

export function computeFailureAnalysisHash(analysis: Omit<FailureAnalysisObject, "analysis_hash"> | FailureAnalysisObject): string {
  const { analysis_hash: _hash, ...source } = analysis as FailureAnalysisObject;
  return hashValue("failure-analysis-object", source);
}

export function analyzeFailure(input: FailureAnalysisInput = {}): FailureAnalysisObject {
  const scenario = input.scenario ?? "BASELINE_EXECUTION";
  const profile = scenarioProfile[scenario];
  const failures = scenarioFailures(scenario);
  const tenant_id = scenario === "TENANT_ISOLATION_FAILURE" ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const mission_id = input.mission_id ?? MISSION_ID;
  const execution_id = input.execution_id ?? EXECUTION_ID;
  const recovery = createRecoveryRecord({ tenant_id, mission_id, execution_id, scenario: scenario === "AUTONOMOUS_RECOVERY_ATTEMPT" ? "AUTONOMOUS_EXECUTION_ATTEMPT" : scenario === "GOVERNANCE_MUTATION_ATTEMPT" ? "POLICY_MUTATION_ATTEMPT" : scenario === "TENANT_ISOLATION_FAILURE" ? "TENANT_ISOLATION_FAILURE" : "BASELINE" });
  const recovery_id = input.recovery_id ?? recovery.identity.recovery_id;
  const analysis_id = id("FAA", "failure-analysis-id", { scenario, tenant_id, mission_id, execution_id, recovery_id });
  const evidence = scenario === "LOW_EVIDENCE" ? freezeArray([evidenceRecord(analysis_id, profile.category, profile.signal, "EXECUTION", failures)]) : freezeArray(["EXECUTION", "PLANNING", "ORCHESTRATION", "GOVERNANCE", "AUTHORITY", "INTEGRITY"].map((layer) => evidenceRecord(analysis_id, profile.category, profile.signal, layer, failures)));
  const root_cause = rootCauseNode(analysis_id, profile, evidence);
  const dependency_graph = dependencyGraph(analysis_id, profile, failures);
  const confidence = confidenceAssessment(analysis_id, failures);
  const recovery_candidates = failures.includes("HIDDEN_STATE_DETECTED") ? freezeArray<RecoveryCandidate>([]) : recoveryCandidates(analysis_id, profile, confidence.confidence_level, failures);
  const lineageBase = {
    lineage_id: id("FAL", "failure-analysis-lineage", analysis_id),
    originating_event: `event:${execution_id}:${profile.signal}`,
    parent_failure: null,
    child_failures: freezeArray(profile.risk === "LOW" ? [] : [`failure:${analysis_id}:cascade`]),
    propagation_chain: failures.includes("LINEAGE_INVALID") ? freezeArray<string>([]) : freezeArray([`event:${execution_id}`, `failure:${analysis_id}`, `recovery:${recovery_id}`]),
    recovery_attempts: freezeArray([]),
    operator_interventions: freezeArray(["operator-review-required"]),
    replay_references: freezeArray([`replay:${analysis_id}`]),
  };
  const replayChecksum = failures.includes("REPLAY_INVALID") ? "mismatch" : hashValue("failure-analysis-replay-checksum", { analysis_id, evidence: evidence.map((item) => item.evidence_hash), graph: dependency_graph.graph_hash, confidence: confidence.confidence_hash, candidates: recovery_candidates.map((item) => item.candidate_hash) });
  const replayBase = {
    replay_reference: `replay:${analysis_id}`,
    replay_version: REPLAY_VERSION,
    failure_event: hashValue("failure-analysis-event", { execution_id, signal: profile.signal }),
    runtime_state: failures.includes("HIDDEN_STATE_DETECTED") ? "" : hashValue("failure-analysis-runtime-state", { execution_id, category: profile.category }),
    evidence_snapshot: hashValue("failure-analysis-evidence-snapshot", evidence.map((item) => item.evidence_hash)),
    dependency_graph_snapshot: dependency_graph.graph_hash,
    governance_state: hashValue("failure-analysis-governance-state", { tenant_id, scenario }),
    authority_state: hashValue("failure-analysis-authority-state", { tenant_id, scenario }),
    integrity_status: failures.includes("EVIDENCE_FABRICATION_DETECTED") ? "FAILED" as const : "VERIFIED" as const,
    confidence_calculation: confidence.confidence_hash,
    recovery_candidate_snapshot: hashValue("failure-analysis-candidate-snapshot", recovery_candidates.map((item) => item.candidate_hash)),
    replay_checksum: replayChecksum,
  };
  const base = {
    analysis_id,
    recovery_id,
    mission_id,
    execution_id,
    tenant_id,
    failure_category: profile.category,
    failure_signal: profile.signal,
    failure_state: failures.length ? "BLOCKED" as const : "REPLAY_REGISTERED" as const,
    root_cause,
    contributing_causes: contributingCauses(analysis_id, profile, evidence),
    dependency_graph,
    failure_lineage: Object.freeze({ ...lineageBase, lineage_hash: hashValue("failure-analysis-lineage", lineageBase) }),
    governance_status: failures.includes("GOVERNANCE_MUTATION_DETECTED") || scenario === "GOVERNANCE_VIOLATION" ? "BLOCKED" as const : "COMPLIANT" as const,
    authority_status: failures.includes("AUTONOMOUS_RECOVERY_DETECTED") || scenario === "AUTHORITY_VIOLATION" ? "INVALID" as const : "VALID" as const,
    integrity_status: failures.includes("EVIDENCE_FABRICATION_DETECTED") ? "FAILED" as const : "VERIFIED" as const,
    confidence,
    recovery_candidates,
    evidence,
    replay_reference: Object.freeze({ ...replayBase, replay_hash: hashValue("failure-analysis-replay", replayBase) }),
    linked_recovery_contract: recovery,
    timestamp: NOW,
    advisory_only: true as const,
    recovery_executed: scenario === "AUTONOMOUS_RECOVERY_ATTEMPT",
    execution_modified: false,
    governance_modified: scenario === "GOVERNANCE_MUTATION_ATTEMPT",
    evidence_fabricated: scenario === "EVIDENCE_FABRICATION",
    runtime_state_hidden: scenario === "HIDDEN_RUNTIME_STATE",
    integrity_hash: failures.includes("EVIDENCE_FABRICATION_DETECTED") ? "" : hashValue("failure-analysis-integrity", { analysis_id, root: root_cause.cause_hash, lineage: lineageBase, replayChecksum }),
  };
  return Object.freeze({ ...base, analysis_hash: computeFailureAnalysisHash(base as Omit<FailureAnalysisObject, "analysis_hash">) });
}

export function validateFailureAnalysis(analysis?: FailureAnalysisObject): FailureAnalysisValidationResult {
  if (!analysis) {
    const failures = freezeArray<FailureAnalysisFailure>(["FAILURE_CLASSIFICATION_INVALID"]);
    const source = { analysis_id: null, valid: false, classification_valid: false, root_cause_valid: false, dependency_graph_complete: false, lineage_valid: false, governance_valid: false, authority_valid: false, integrity_valid: false, confidence_valid: false, recovery_candidates_valid: false, replay_valid: false, tenant_isolated: false, advisory_only: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("failure-analysis-validation", source) });
  }
  const classification_valid = supportedCategories.includes(analysis.failure_category) && Boolean(analysis.failure_signal);
  const root_cause_valid = analysis.root_cause.level === "PRIMARY" && Boolean(analysis.root_cause.cause && analysis.root_cause.evidence_references.length);
  const dependency_graph_complete = analysis.dependency_graph.nodes.length === 6 && analysis.dependency_graph.edges.length >= 5;
  const lineage_valid = Boolean(analysis.failure_lineage.lineage_hash && analysis.failure_lineage.propagation_chain.length && analysis.failure_lineage.replay_references.length);
  const governance_valid = analysis.governance_status === "COMPLIANT" && !analysis.governance_modified;
  const authority_valid = analysis.authority_status === "VALID";
  const integrity_valid = analysis.integrity_status === "VERIFIED" && Boolean(analysis.integrity_hash) && !analysis.evidence_fabricated;
  const confidence_valid = analysis.confidence.confidence_score >= 0.8 && analysis.confidence.confidence_level !== "LOW" && analysis.confidence.confidence_level !== "INSUFFICIENT";
  const recovery_candidates_valid = analysis.recovery_candidates.length > 0 && analysis.recovery_candidates.every((item) => item.advisory_only && item.governance_validation === "VALID" && item.authority_validation === "VALID");
  const replay_valid = analysis.replay_reference.replay_checksum !== "mismatch" && Boolean(analysis.replay_reference.runtime_state);
  const tenant_isolated = analysis.tenant_id === TENANT_ID || analysis.tenant_id.startsWith("tenant:");
  const advisory_only = analysis.advisory_only && !analysis.recovery_executed && !analysis.execution_modified && !analysis.governance_modified && !analysis.runtime_state_hidden;
  const immutable_hash_valid = computeFailureAnalysisHash(analysis) === analysis.analysis_hash;
  const recoveryValidation = validateRecoveryContract(analysis.linked_recovery_contract);
  const failures = unique([
    ...(!classification_valid ? ["FAILURE_CLASSIFICATION_INVALID" as const] : []),
    ...(!root_cause_valid ? ["ROOT_CAUSE_UNDETERMINED" as const] : []),
    ...(!dependency_graph_complete ? ["DEPENDENCY_GRAPH_INCOMPLETE" as const] : []),
    ...(!lineage_valid ? ["LINEAGE_INVALID" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_INVALID" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!confidence_valid ? ["CONFIDENCE_INSUFFICIENT" as const] : []),
    ...(!recovery_candidates_valid ? ["RECOVERY_CANDIDATES_INVALID" as const] : []),
    ...(!replay_valid ? ["REPLAY_INVALID" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(analysis.recovery_executed ? ["AUTONOMOUS_RECOVERY_DETECTED" as const] : []),
    ...(analysis.governance_modified ? ["GOVERNANCE_MUTATION_DETECTED" as const] : []),
    ...(analysis.evidence_fabricated ? ["EVIDENCE_FABRICATION_DETECTED" as const] : []),
    ...(analysis.runtime_state_hidden ? ["HIDDEN_STATE_DETECTED" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_INVALID" as const] : []),
    ...(!recoveryValidation.valid && recoveryValidation.failures.includes("AUTONOMOUS_EXECUTION_DETECTED") ? ["AUTONOMOUS_RECOVERY_DETECTED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { analysis_id: analysis.analysis_id, valid, classification_valid, root_cause_valid, dependency_graph_complete, lineage_valid, governance_valid, authority_valid, integrity_valid, confidence_valid, recovery_candidates_valid, replay_valid, tenant_isolated, advisory_only, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("failure-analysis-validation", source) });
}

export function replayFailureAnalysis(analysis = analyzeFailure()): FailureAnalysisReplayResult {
  const reconstructed_hash = computeFailureAnalysisHash(analysis);
  const deterministic = reconstructed_hash === analysis.analysis_hash && analysis.replay_reference.replay_checksum !== "mismatch";
  const source = { replay_reference: analysis.replay_reference.replay_reference, analysis_id: analysis.analysis_id, deterministic, reconstructed_hash, original_hash: analysis.analysis_hash, replay_checksum: analysis.replay_reference.replay_checksum };
  return Object.freeze({ ...source, replay_result_hash: hashValue("failure-analysis-replay-result", source) });
}

export function buildFailureAnalysisObservabilitySurface(analysis = analyzeFailure()): FailureAnalysisObservabilitySurface {
  const validation = validateFailureAnalysis(analysis);
  return Object.freeze({
    analysis_id: analysis.analysis_id,
    recovery_id: analysis.recovery_id,
    failure_category: analysis.failure_category,
    failure_signal: analysis.failure_signal,
    root_cause: analysis.root_cause.cause,
    confidence_score: analysis.confidence.confidence_score,
    confidence_level: analysis.confidence.confidence_level,
    governance_status: analysis.governance_status,
    authority_status: analysis.authority_status,
    integrity_status: analysis.integrity_status,
    candidate_count: analysis.recovery_candidates.length,
    replay_valid: validation.replay_valid,
    tenant_id: analysis.tenant_id,
    advisory_only: true,
    analysis_hash: analysis.analysis_hash,
  });
}

export function getFailureAnalysisEngineContract(): FailureAnalysisEngineContract {
  const analysis = analyzeFailure();
  const recoveryValidation = validateRecoveryContract(analysis.linked_recovery_contract);
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-analysis", "advisory-only", "governance-first", "constitutional-compliance", "replay-reproducibility", "explainable-diagnostics", "immutable-evidence", "operator-visible", "tenant-isolated", "fail-closed"]),
      supported_categories: supportedCategories,
      confidence_levels: confidenceLevels,
      advisory_only: true,
    }),
    analysis,
    validation: validateFailureAnalysis(analysis),
    replay: replayFailureAnalysis(analysis),
    observability: buildFailureAnalysisObservabilitySurface(analysis),
    recovery_contract_failures: recoveryValidation.failures,
  });
}
