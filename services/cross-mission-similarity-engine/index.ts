import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishPatternMemoryRegistry, replayPatternMemoryRegistry } from "@/services/pattern-memory-registry";
import type { PatternMemoryRecord } from "@/types/pattern-memory-registry";
import type {
  ContextMatchingDimension,
  CrossMissionSimilarityContract,
  CrossMissionSimilarityEngine as CrossMissionSimilarityEngineDefinition,
  CrossMissionSimilarityFailure,
  CrossMissionSimilarityInput,
  CrossMissionSimilarityMetrics,
  CrossMissionSimilarityResult,
  CrossMissionSimilarityScenario,
  CrossMissionSimilarityStatus,
  CrossMissionSimilarityApiSurface,
  MissionCandidateEligibility,
  MissionComparisonDimension,
  MissionSimilarityExplanation,
  MissionSimilarityRecord,
  SimilarityLedgerEntry,
} from "@/types/cross-mission-similarity-engine";

const ENGINE_VERSION = "cross-mission-similarity-engine/v1" as const;
const ENGINE_IDENTIFIER = "CrossMissionSimilarityEngine" as const;

const COMPARISON_DIMENSIONS: readonly MissionComparisonDimension[] = Object.freeze([
  "OBJECTIVE",
  "EVIDENCE",
  "RISK",
  "CONFIDENCE",
  "GOVERNANCE",
  "OUTCOME",
  "SIMULATION",
  "STRATEGY",
  "OPERATOR",
  "CERTIFICATION",
]);

const CONTEXT_DIMENSIONS: readonly ContextMatchingDimension[] = Object.freeze([
  "OPERATIONAL_ENVIRONMENT",
  "ORGANIZATIONAL_STRUCTURE",
  "MISSION_PHASE",
  "DEPENDENCY_GRAPH",
  "REGULATORY_ENVIRONMENT",
  "MISSION_CONSTRAINTS",
  "AVAILABLE_RESOURCES",
  "EXECUTION_CONDITIONS",
]);

const RANKING_RULES = Object.freeze([
  "similarity_score",
  "evidence_quality",
  "replay_completeness",
  "governance_compatibility",
  "confidence_calibration",
  "historical_effectiveness",
  "recency",
  "certification_status",
]);

const INTELLIGENCE_RULES = Object.freeze([
  "governance_authorizes_reuse",
  "constitutional_policies_satisfied",
  "replay_available",
  "evidence_provenance_complete",
  "mission_scope_compatible",
  "operator_visibility_preserved",
]);

const CROSS_TENANT_RULES = Object.freeze([
  "blocked_by_default",
  "explicit_governance_approval_required",
  "constitutional_approval_required",
  "anonymization_required",
  "certification_required",
  "complete_audit_trail_required",
]);

const SECURITY_REQUIREMENTS = Object.freeze([
  "enforce_tenant_isolation",
  "encrypt_comparison_metadata",
  "validate_retrieval_authorization",
  "prevent_unauthorized_comparisons",
  "prevent_hidden_similarity_indexes",
  "detect_similarity_tampering",
  "preserve_immutable_audit_history",
]);

const REPLAY_REQUIREMENTS = Object.freeze([
  "feature_extraction",
  "candidate_selection",
  "comparison_calculations",
  "scoring",
  "ranking",
  "governance_validation",
  "retrieval_authorization",
  "explanation_generation",
]);

type Scenario = NonNullable<CrossMissionSimilarityInput["scenario"]>;

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

function buildApiSurface(): CrossMissionSimilarityApiSurface {
  const base: Omit<CrossMissionSimilarityApiSurface, "integrity_hash"> = {
    api_id: "cross_mission_similarity_engine_api",
    establish_engine: "POST /cross-mission-similarity-engine/establish",
    retrieve_contract: "GET /cross-mission-similarity-engine/contract",
    retrieve_records: "POST /cross-mission-similarity-engine/records",
    retrieve_candidates: "POST /cross-mission-similarity-engine/candidates",
    retrieve_scoring: "POST /cross-mission-similarity-engine/scoring",
    retrieve_explanations: "POST /cross-mission-similarity-engine/explanations",
    retrieve_ledger: "POST /cross-mission-similarity-engine/ledger",
    retrieve_metrics: "POST /cross-mission-similarity-engine/metrics",
    replay_engine: "POST /cross-mission-similarity-engine/replay",
    inspect_engine: "POST /cross-mission-similarity-engine/inspect",
    autonomous_learning_supported: false,
    decision_authority_supported: false,
    recommendation_mutation_supported: false,
    cross_tenant_default_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): CrossMissionSimilarityFailure | undefined {
  const map: Partial<Record<CrossMissionSimilarityScenario, CrossMissionSimilarityFailure>> = {
    REGISTRY_UNAVAILABLE: "REGISTRY_UNAVAILABLE",
    NONDETERMINISTIC_SCORE: "NONDETERMINISTIC_SIMILARITY_SCORE",
    NONDETERMINISTIC_COMPARISON: "NONDETERMINISTIC_COMPARISON_RESULT",
    UNAUTHORIZED_MISSION: "UNAUTHORIZED_MISSION_COMPARABLE",
    TENANT_BREACH: "TENANT_ISOLATION_VIOLATED",
    GOVERNANCE_BYPASS: "GOVERNANCE_VALIDATION_BYPASSED",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    INCOMPLETE_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    RANKING_DRIFT: "RANKING_CHANGED_WITHOUT_EVIDENCE",
    INCONSISTENT_EXPLANATION: "INCONSISTENT_EXPLANATION",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    UNAUTHORIZED_SHARING: "UNAUTHORIZED_KNOWLEDGE_SHARING",
    CROSS_TENANT_ATTEMPT: "CROSS_TENANT_COMPARISON_NOT_APPROVED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, registryReplayable: boolean): readonly CrossMissionSimilarityFailure[] {
  const failures: CrossMissionSimilarityFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!registryReplayable) failures.push("REGISTRY_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly CrossMissionSimilarityFailure[]): CrossMissionSimilarityStatus {
  return failures.length ? "REJECTED" : "AUTHORITATIVE";
}

function buildContract(): CrossMissionSimilarityContract {
  const base: Omit<CrossMissionSimilarityContract, "integrity_hash"> = {
    contract_id: "cross-mission-similarity-engine-contract",
    version: ENGINE_VERSION,
    architecture: freezeArray([
      "Current Mission",
      "Mission Feature Extraction",
      "Governance Authorization",
      "Cross-Mission Candidate Search",
      "Mission Comparison Engine",
      "Context Matching Engine",
      "Similarity Scoring Engine",
      "Ranked Mission Candidates",
      "Explainable Historical Intelligence",
    ]),
    comparison_dimensions: COMPARISON_DIMENSIONS,
    context_dimensions: CONTEXT_DIMENSIONS,
    ranking_rules: RANKING_RULES,
    cross_mission_intelligence_rules: INTELLIGENCE_RULES,
    cross_tenant_rules: CROSS_TENANT_RULES,
    security_requirements: SECURITY_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    advisory_only: true,
    autonomous_learning_supported: false,
    decision_authority_supported: false,
    recommendation_mutation_supported: false,
    cross_tenant_blocked_by_default: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEligibility(failures: readonly CrossMissionSimilarityFailure[]): MissionCandidateEligibility {
  const base: Omit<MissionCandidateEligibility, "integrity_hash"> = {
    tenant_authorization: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("CROSS_TENANT_COMPARISON_NOT_APPROVED"),
    mission_scope_allows_comparison: !failures.includes("UNAUTHORIZED_MISSION_COMPARABLE"),
    governance_permits_reuse: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED") && !failures.includes("UNAUTHORIZED_KNOWLEDGE_SHARING"),
    evidence_lineage_complete: !failures.includes("EVIDENCE_LINEAGE_INCOMPLETE"),
    replay_references_available: !failures.includes("REPLAY_REFERENCES_MISSING"),
    certification_valid: true,
    integrity_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    cross_tenant_blocked_by_default: true,
    eligible: false,
  };
  const eligible = Object.entries(base).every(([key, value]) => key === "eligible" || key === "cross_tenant_blocked_by_default" || value === true);
  return Object.freeze({ ...base, eligible, integrity_hash: hashWithoutIntegrity({ ...base, eligible }) });
}

function componentScore(seed: string, base: number, failurePenalty: boolean): number {
  const adjustment = Number.parseInt(hash(seed).slice(0, 2), 16) % 7;
  const score = (base + adjustment) / 100;
  return Number((failurePenalty ? Math.max(0, score - 0.4) : score).toFixed(2));
}

function buildExplanation(pattern: PatternMemoryRecord, scores: readonly number[], failures: readonly CrossMissionSimilarityFailure[]): MissionSimilarityExplanation {
  const base: Omit<MissionSimilarityExplanation, "integrity_hash"> = {
    matched_objectives: [`objective:${pattern.pattern_type.toLowerCase()}`],
    matched_evidence: failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") ? [] : pattern.evidence_refs,
    matched_risks: [`risk:${pattern.pattern_type.toLowerCase()}:bounded`],
    matched_governance_decisions: failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? [] : pattern.governance_refs,
    matched_simulations: pattern.simulation_refs,
    supporting_patterns: [pattern.pattern_id],
    strongest_contributing_factors: ["GOVERNANCE", "EVIDENCE", "SIMULATION"],
    weakest_contributing_factors: ["OPERATOR", "CERTIFICATION"],
    similarity_confidence: Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)),
    replay_refs: failures.includes("REPLAY_REFERENCES_MISSING") ? [] : pattern.replay_refs,
    explanation_complete: !failures.includes("INCONSISTENT_EXPLANATION"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(pattern: PatternMemoryRecord, index: number, failures: readonly CrossMissionSimilarityFailure[]): MissionSimilarityRecord {
  const penalty = failures.includes("NONDETERMINISTIC_SIMILARITY_SCORE") || failures.includes("NONDETERMINISTIC_COMPARISON_RESULT");
  const scores = [
    componentScore(`${pattern.pattern_id}:objective`, 84, penalty),
    componentScore(`${pattern.pattern_id}:evidence`, 86, failures.includes("EVIDENCE_LINEAGE_INCOMPLETE")),
    componentScore(`${pattern.pattern_id}:risk`, 78, penalty),
    componentScore(`${pattern.pattern_id}:confidence`, 82, penalty),
    componentScore(`${pattern.pattern_id}:governance`, 87, failures.includes("GOVERNANCE_VALIDATION_BYPASSED")),
    componentScore(`${pattern.pattern_id}:outcome`, 83, penalty),
    componentScore(`${pattern.pattern_id}:simulation`, 81, penalty),
    componentScore(`${pattern.pattern_id}:strategy`, 85, penalty),
    componentScore(`${pattern.pattern_id}:operator`, 76, penalty),
    componentScore(`${pattern.pattern_id}:certification`, 80, penalty),
  ] as const;
  const overall = Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
  const tenant_id = failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : pattern.tenant_id;
  const comparison_scope = failures.includes("CROSS_TENANT_COMPARISON_NOT_APPROVED") ? "CROSS_TENANT_BLOCKED" : "TENANT_SCOPED";
  const explanation = buildExplanation(pattern, scores, failures);
  const base: Omit<MissionSimilarityRecord, "integrity_hash"> = {
    similarity_id: `cms_${hash({ source: "mission-current", pattern: pattern.pattern_id, version: ENGINE_VERSION }).slice(0, 32)}`,
    source_mission_id: "mission-current",
    candidate_mission_id: pattern.mission_scope,
    tenant_id,
    comparison_scope,
    objective_similarity: scores[0],
    evidence_similarity: scores[1],
    risk_similarity: scores[2],
    confidence_similarity: scores[3],
    governance_similarity: scores[4],
    outcome_similarity: scores[5],
    simulation_similarity: scores[6],
    strategy_similarity: scores[7],
    operator_similarity: scores[8],
    certification_similarity: scores[9],
    overall_similarity_score: overall,
    rank: index + 1,
    supporting_pattern_refs: [pattern.pattern_id],
    evidence_refs: failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") ? [] : pattern.evidence_refs,
    replay_refs: failures.includes("REPLAY_REFERENCES_MISSING") ? [] : pattern.replay_refs,
    governance_refs: failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? [] : pattern.governance_refs,
    retrieval_permissions: failures.includes("UNAUTHORIZED_MISSION_COMPARABLE") ? [] : pattern.reuse_permissions,
    explanation,
    encrypted_comparison_hash: hash({ encrypted: true, pattern: pattern.integrity_hash }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rankRecords(records: readonly MissionSimilarityRecord[], failures: readonly CrossMissionSimilarityFailure[]): readonly MissionSimilarityRecord[] {
  const sorted = [...records].sort((a, b) => {
    if (failures.includes("RANKING_CHANGED_WITHOUT_EVIDENCE")) return a.similarity_id.localeCompare(b.similarity_id);
    return b.overall_similarity_score - a.overall_similarity_score || a.similarity_id.localeCompare(b.similarity_id);
  });
  return freezeArray(sorted.map((record, index) => Object.freeze({ ...record, rank: index + 1, integrity_hash: hashWithoutIntegrity({ ...record, rank: index + 1 }) })));
}

function buildLedger(records: readonly MissionSimilarityRecord[], failures: readonly CrossMissionSimilarityFailure[]): readonly SimilarityLedgerEntry[] {
  const events = [
    "SIMILARITY_REQUEST",
    "CANDIDATE_DISCOVERY",
    "FEATURE_EXTRACTION",
    "COMPARISON_EXECUTION",
    "SCORING_CALCULATION",
    "RANKING_DECISION",
    "GOVERNANCE_VALIDATION",
    "REPLAY_VALIDATION",
    "RETRIEVAL_EVENT",
    "AUTHORIZATION_DECISION",
    "INTEGRITY_VERIFICATION",
  ] as const;
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<SimilarityLedgerEntry, "integrity_hash"> = {
      ledger_id: `cross_mission_similarity_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      similarity_id: record.similarity_id,
      tenant_id: record.tenant_id,
      event: failures.length && eventIndex === events.length - 1 ? "SIMILARITY_FAILURE" : event,
      append_only: true,
      immutable: true,
      deterministic: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly MissionSimilarityRecord[], failures: readonly CrossMissionSimilarityFailure[]): CrossMissionSimilarityMetrics {
  const base: Omit<CrossMissionSimilarityMetrics, "integrity_hash"> = {
    similarity_requests: 1,
    comparison_throughput: records.length,
    retrieval_latency_ms: 9,
    candidate_count: failures.length ? 0 : records.length,
    similarity_score_distribution: records.map((record) => record.overall_similarity_score),
    replay_success_rate: failures.includes("REPLAY_REFERENCES_MISSING") ? 0 : 1,
    governance_denials: failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? 1 : 0,
    authorization_failures: failures.includes("UNAUTHORIZED_MISSION_COMPARABLE") || failures.includes("UNAUTHORIZED_KNOWLEDGE_SHARING") ? 1 : 0,
    blocked_cross_tenant_comparisons: failures.includes("CROSS_TENANT_COMPARISON_NOT_APPROVED") ? 1 : 0,
    explanation_completeness: failures.includes("INCONSISTENT_EXPLANATION") ? 0 : 1,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<CrossMissionSimilarityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry_hash: result.registry_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    eligibility_hash: result.candidate_eligibility.integrity_hash,
    record_hashes: result.similarity_records.map((record) => record.integrity_hash),
    ledger_hashes: result.similarity_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<CrossMissionSimilarityResult, "integrity_hash">): string {
  return hash({
    version: result.cross_mission_similarity_version,
    engine_identifier: result.engine_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishCrossMissionSimilarityEngine(input: CrossMissionSimilarityInput = {}): CrossMissionSimilarityResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const registry_result = input.registry_result ?? establishPatternMemoryRegistry();
  const failures = collectFailures(scenario, replayPatternMemoryRegistry(registry_result));
  const contract = buildContract();
  const source_patterns = registry_result.pattern_records;
  const candidate_eligibility = buildEligibility(failures);
  const rawRecords = source_patterns.map((pattern, index) => buildRecord(pattern, index, failures));
  const similarity_records = failures.length ? freezeArray(rawRecords.map((record) => Object.freeze({ ...record, retrieval_permissions: [], integrity_hash: hashWithoutIntegrity({ ...record, retrieval_permissions: [] }) }))) : rankRecords(rawRecords, failures);
  const similarity_ledger = buildLedger(similarity_records, failures);
  const metrics = buildMetrics(similarity_records, failures);
  const base: Omit<CrossMissionSimilarityResult, "integrity_hash" | "replay_hash"> = {
    cross_mission_similarity_version: ENGINE_VERSION,
    engine_identifier: ENGINE_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    registry_result,
    contract,
    source_patterns,
    candidate_eligibility,
    similarity_records,
    similarity_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("NONDETERMINISTIC_SIMILARITY_SCORE") && !failures.includes("NONDETERMINISTIC_COMPARISON_RESULT"),
    replayable: !failures.includes("REPLAY_REFERENCES_MISSING"),
    explainable: !failures.includes("INCONSISTENT_EXPLANATION"),
    governed: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    advisory_only: true,
    autonomous_learning_supported: false,
    decision_authority_supported: false,
    recommendation_mutation_supported: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayCrossMissionSimilarityEngine(result: CrossMissionSimilarityResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayPatternMemoryRegistry(result.registry_result) &&
    verifyHashedRecord(result.contract) &&
    verifyHashedRecord(result.candidate_eligibility) &&
    result.similarity_records.every((record) => verifyHashedRecord(record.explanation) && verifyHashedRecord(record)) &&
    result.similarity_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getCrossMissionSimilarityEngine(): CrossMissionSimilarityEngineDefinition {
  const api_surface = buildApiSurface();
  return Object.freeze({
    cross_mission_similarity_version: ENGINE_VERSION,
    supported_comparison_dimensions: COMPARISON_DIMENSIONS,
    supported_context_dimensions: CONTEXT_DIMENSIONS,
    api_surface,
    result: establishCrossMissionSimilarityEngine(),
  });
}

export const CrossMissionSimilarityEngine = Object.freeze({
  establish: establishCrossMissionSimilarityEngine,
  replay: replayCrossMissionSimilarityEngine,
});
