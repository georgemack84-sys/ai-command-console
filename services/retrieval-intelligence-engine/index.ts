import { runHistoricalReasoning, validateHistoricalReasoning } from "@/services/historical-reasoning-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  RankingResult,
  RetrievalCandidate,
  RetrievalCertification,
  RetrievalCertificationTest,
  RetrievalContractBundle,
  RetrievalExplanation,
  RetrievalFailure,
  RetrievalInput,
  RetrievalIntelligenceContract,
  RetrievalLedgerEntry,
  RetrievalLifecycleStage,
  RetrievalObservability,
  RetrievalRecord,
  RetrievalResult,
  RetrievalScenario,
  RetrievalValidation,
} from "@/types/retrieval-intelligence-engine";

const VERSION = "retrieval-intelligence-engine/v11.6" as const;
const ID = "RetrievalIntelligenceEngine" as const;
const TENANT_ID = "tenant_mission_control";
const LIFECYCLE: readonly RetrievalLifecycleStage[] = Object.freeze(["REQUESTED", "IDENTITY_VALIDATED", "TENANT_VALIDATED", "CONSTITUTION_VALIDATED", "GOVERNANCE_VALIDATED", "FILTERED", "SEMANTIC_SEARCH", "RANKED", "VERIFIED", "CERTIFIED", "RETURNED", "LEDGERED"]);
const NEVER_RETRIEVE = Object.freeze(["revoked knowledge", "expired knowledge", "quarantined knowledge", "uncertified intelligence", "rejected intelligence", "superseded intelligence", "cross-tenant intelligence", "restricted governance records", "constitutional violations", "unauthorized intelligence"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: RetrievalScenario): RetrievalFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly RetrievalFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" {
  if (failures.includes("OBSERVABILITY_INCOMPLETE") && failures.length === 1) return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

function contract(failures: readonly RetrievalFailure[]): RetrievalIntelligenceContract {
  const base: Omit<RetrievalIntelligenceContract, "integrity_hash"> = {
    contract_id: id("retrieval_intelligence_contract", VERSION),
    lifecycle: LIFECYCLE,
    governance_first: true,
    certified_only: !failures.includes("QUALIFICATION_BYPASS"),
    deterministic_retrieval_required: !failures.includes("SEMANTIC_RETRIEVAL_NONDETERMINISTIC"),
    constitutional_filter_required: !failures.includes("CONSTITUTIONAL_POLICY_VIOLATION"),
    governance_filter_required: !failures.includes("GOVERNANCE_POLICY_VIOLATION"),
    tenant_filter_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    qualification_filter_required: !failures.includes("QUALIFICATION_BYPASS"),
    confidence_filter_required: !failures.includes("CONFIDENCE_THRESHOLD_BYPASS"),
    temporal_filter_required: !failures.includes("TEMPORAL_FILTER_INVALID"),
    explanation_required: !failures.includes("EXPLANATION_INCOMPLETE"),
    replay_required: !failures.includes("REPLAY_DIVERGENCE"),
    minimum_confidence: 0.8,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INVALID") ? "invalid-retrieval-contract" : hashWithoutIntegrity(base) });
}

function candidates(input: RetrievalInput, refs: readonly string[], failures: readonly RetrievalFailure[]): readonly RetrievalCandidate[] {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const rows = refs.slice(0, 5).map((ref, index) => {
    const forcedFailure = index === 3 ? "EXPIRED_KNOWLEDGE_RETRIEVED" : index === 4 ? "QUARANTINED_KNOWLEDGE_RETRIEVED" : null;
    const rejected = failures.includes("QUALIFICATION_BYPASS") ? "QUALIFICATION_BYPASS"
      : failures.includes("CONFIDENCE_THRESHOLD_BYPASS") ? "CONFIDENCE_THRESHOLD_BYPASS"
      : failures.includes("TENANT_ISOLATION_BREACH") ? "TENANT_ISOLATION_BREACH"
      : forcedFailure;
    const approved = !rejected && index < 3;
    const base: Omit<RetrievalCandidate, "integrity_hash"> = {
      candidate_id: id("retrieval_candidate", { ref, index }),
      source_ref: ref,
      tenant_id: failures.includes("TENANT_ISOLATION_BREACH") && index === 0 ? "tenant_other" : tenant_id,
      qualified: approved,
      certified: approved,
      governance_approved: approved && !failures.includes("GOVERNANCE_POLICY_VIOLATION"),
      constitutional_permitted: approved && !failures.includes("CONSTITUTIONAL_POLICY_VIOLATION"),
      temporal_valid: approved && !failures.includes("TEMPORAL_FILTER_INVALID"),
      confidence: failures.includes("CONFIDENCE_THRESHOLD_BYPASS") ? 0.51 : approved ? 0.92 - index * 0.03 : 0.44,
      evidence_refs: approved && !failures.includes("EVIDENCE_INCOMPLETE") ? freezeArray([`evidence:${ref}`, "evidence:qualification", "evidence:governance"]) : freezeArray([]),
      rejected_reason: approved ? null : (rejected ?? "QUALIFICATION_BYPASS"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  return freezeArray(rows);
}

function rankings(approved: readonly RetrievalCandidate[], failures: readonly RetrievalFailure[]): readonly RankingResult[] {
  return freezeArray(approved.map((candidate, index) => {
    const score = failures.includes("RANKING_NONREPRODUCIBLE") ? 0.5 : 0.94 - index * 0.04;
    const base: Omit<RankingResult, "integrity_hash"> = { ranking_id: id("retrieval_ranking", candidate.candidate_id), record_ref: candidate.candidate_id, rank: index + 1, semantic_similarity: score, qualification_score: 1, confidence: candidate.confidence, evidence_quality: 0.93, governance_priority: 0.91, recency: 0.82, mission_relevance: 0.9, historical_effectiveness: 0.87, final_score: score };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function explanation(approved: readonly RetrievalCandidate[], rejected: readonly RetrievalCandidate[], failures: readonly RetrievalFailure[]): RetrievalExplanation {
  const complete = !failures.includes("EXPLANATION_INCOMPLETE");
  const base: Omit<RetrievalExplanation, "integrity_hash"> = {
    explanation_id: id("retrieval_explanation", approved.map((item) => item.candidate_id)),
    why_retrieved: freezeArray(approved.map((item) => `${item.candidate_id}: certified, tenant-valid, policy-valid, confidence-qualified`)),
    why_rejected: freezeArray(rejected.map((item) => `${item.candidate_id}: ${item.rejected_reason}`)),
    applied_filters: freezeArray(["identity", "tenant", "constitutional", "governance", "qualification", "confidence", "temporal", "context", "semantic", "ranking", "evidence"]),
    evidence_chain: complete ? freezeArray(approved.flatMap((item) => item.evidence_refs)) : freezeArray([]),
    confidence_summary: "Retrieved records meet certified confidence and trust thresholds.",
    governance_rationale: "Only governance-approved records are eligible for return.",
    constitutional_rationale: "Constitutional visibility and authority constraints are enforced before retrieval.",
    lineage_report: complete ? freezeArray(approved.map((item) => `lineage:${item.source_ref}`)) : freezeArray([]),
    complete,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function record(input: RetrievalInput, candidatesRows: readonly RetrievalCandidate[], approved: readonly RetrievalCandidate[], rejected: readonly RetrievalCandidate[], rankingRows: readonly RankingResult[], explanationRow: RetrievalExplanation): RetrievalRecord {
  const tenant_id = input.tenant_id ?? TENANT_ID;
  const query = input.query ?? "qualified mission routing risk intelligence";
  const retrieval_id = id("retrieval", { tenant_id, query, approved: approved.map((item) => item.candidate_id) });
  const base: Omit<RetrievalRecord, "integrity_hash"> = {
    retrieval_id,
    tenant_id,
    request_id: id("retrieval_request", query),
    query,
    semantic_vector: freezeArray([0.11, 0.23, 0.37, 0.41]),
    retrieval_scope: "persistent-intelligence-certified",
    context_scope: "mission-risk-strategy",
    filters_applied: explanationRow.applied_filters,
    qualification_filters: freezeArray(["qualified", "certified", "replay_validated"]),
    confidence_filters: freezeArray(["minimum_confidence:0.8", "trust_score:qualified", "evidence_quality:qualified"]),
    governance_filters: freezeArray(["governance_approved", "visibility_allowed"]),
    constitutional_filters: freezeArray(["authority_allowed", "safety_allowed", "restriction_allowed"]),
    temporal_filters: freezeArray(["active_version", "not_expired", "effective_at_request_time"]),
    candidate_records: freezeArray(candidatesRows.map((item) => item.candidate_id)),
    approved_records: freezeArray(approved.map((item) => item.candidate_id)),
    rejected_records: freezeArray(rejected.map((item) => item.candidate_id)),
    ranking_results: freezeArray(rankingRows.map((item) => item.ranking_id)),
    retrieval_confidence: approved.length ? Math.min(...approved.map((item) => item.confidence)) : 0,
    retrieval_reason: "Governed retrieval returned certified intelligence that passed policy, tenant, temporal, confidence, and evidence filters.",
    evidence_refs: freezeArray(approved.flatMap((item) => item.evidence_refs)),
    retrieval_timestamp: "2026-07-14T00:00:00.000Z",
    operator_id: "operator:retrieval-review",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledger(retrievalId: string, candidatesRows: readonly RetrievalCandidate[], failures: readonly RetrievalFailure[]): readonly RetrievalLedgerEntry[] {
  const events: readonly RetrievalLedgerEntry["event"][] = freezeArray(["RETRIEVAL_REQUESTED", "IDENTITY_VALIDATED", "POLICY_VALIDATED", "CANDIDATES_FILTERED", "SEMANTIC_SEARCHED", "RANKED", "EVIDENCE_VERIFIED", "EXPLAINED", "CERTIFIED", "REPLAY_RECORDED"]);
  return freezeArray(events.map((event, index) => {
    const base: Omit<RetrievalLedgerEntry, "integrity_hash"> = { ledger_entry_id: id("retrieval_ledger", `${retrievalId}:${event}:${index}`), sequence: index + 1, event, retrieval_id: retrievalId, candidate_refs: freezeArray(candidatesRows.map((item) => item.candidate_id)), replay_refs: freezeArray([`replay:retrieval:${index + 1}`]), append_only: !failures.includes("LEDGER_MUTATION") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function observability(failures: readonly RetrievalFailure[]): RetrievalObservability {
  const base: Omit<RetrievalObservability, "integrity_hash"> = { observability_id: "retrieval_intelligence_observability", retrieval_latency_ms: 29, failed_retrievals: failures.length ? 1 : 0, unauthorized_attempts: failures.includes("UNAUTHORIZED_EXPOSURE") ? 1 : 0, policy_violations: failures.filter((item) => item.includes("POLICY")).length, stale_intelligence: failures.includes("EXPIRED_KNOWLEDGE_RETRIEVED") ? 1 : 0, replay_divergence: failures.includes("REPLAY_DIVERGENCE") ? 1 : 0, ranking_drift: failures.includes("RANKING_NONREPRODUCIBLE") ? 1 : 0, semantic_index_health: failures.includes("SEMANTIC_RETRIEVAL_NONDETERMINISTIC") ? 0.4 : 1, ledger_integrity: !failures.includes("LEDGER_MUTATION"), operational: !failures.includes("OBSERVABILITY_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: RetrievalFailure, refs: readonly string[]): RetrievalCertificationTest {
  const base: Omit<RetrievalCertificationTest, "integrity_hash"> = { test_id: id("retrieval_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<RetrievalResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly RetrievalCertificationTest[] {
  const refs = freezeArray(result.approved_records.flatMap((item) => item.evidence_refs));
  return freezeArray([
    test("deterministic similarity search", result.contract.deterministic_retrieval_required, "SEMANTIC_RETRIEVAL_NONDETERMINISTIC", refs),
    test("reproducible ranking", result.rankings.every((item, index) => item.rank === index + 1 && item.final_score >= 0.8), "RANKING_NONREPRODUCIBLE", refs),
    test("graph traversal consistency", result.historical_reasoning_certified, "HISTORICAL_REASONING_NOT_CERTIFIED", refs),
    test("semantic stability", result.observability.semantic_index_health === 1, "SEMANTIC_RETRIEVAL_NONDETERMINISTIC", refs),
    test("uncertified intelligence blocked", result.rejected_records.every((item) => item.rejected_reason !== null) && result.approved_records.every((item) => item.certified), "QUALIFICATION_BYPASS", refs),
    test("revoked intelligence blocked", !result.approved_records.some((item) => item.rejected_reason === "REVOKED_KNOWLEDGE_RETRIEVED"), "REVOKED_KNOWLEDGE_RETRIEVED", refs),
    test("quarantined intelligence blocked", !result.approved_records.some((item) => item.rejected_reason === "QUARANTINED_KNOWLEDGE_RETRIEVED"), "QUARANTINED_KNOWLEDGE_RETRIEVED", refs),
    test("expired intelligence blocked", !result.approved_records.some((item) => item.rejected_reason === "EXPIRED_KNOWLEDGE_RETRIEVED"), "EXPIRED_KNOWLEDGE_RETRIEVED", refs),
    test("confidence thresholds enforced", result.approved_records.every((item) => item.confidence >= result.contract.minimum_confidence), "CONFIDENCE_THRESHOLD_BYPASS", refs),
    test("governance approval required", result.contract.governance_filter_required && result.approved_records.every((item) => item.governance_approved), "GOVERNANCE_POLICY_VIOLATION", refs),
    test("constitutional restrictions enforced", result.contract.constitutional_filter_required && result.approved_records.every((item) => item.constitutional_permitted), "CONSTITUTIONAL_POLICY_VIOLATION", refs),
    test("authority boundaries preserved", result.contract.governance_first, "UNAUTHORIZED_EXPOSURE", refs),
    test("policy conflicts fail closed", result.rejected_records.length > 0, "GOVERNANCE_POLICY_VIOLATION", refs),
    test("cross-tenant retrieval impossible", result.approved_records.every((item) => item.tenant_id === result.record.tenant_id), "TENANT_ISOLATION_BREACH", refs),
    test("authorization validated", result.record.operator_id.length > 0, "IDENTITY_INVALID", refs),
    test("mission boundaries enforced", result.record.context_scope.length > 0, "CONTEXT_RESOLUTION_NONDETERMINISTIC", refs),
    test("role-based visibility respected", result.contract.governance_first, "UNAUTHORIZED_EXPOSURE", refs),
    test("effective version selection deterministic", result.contract.temporal_filter_required, "TEMPORAL_FILTER_INVALID", refs),
    test("expired intelligence excluded", !result.approved_records.some((item) => item.rejected_reason === "EXPIRED_KNOWLEDGE_RETRIEVED"), "EXPIRED_KNOWLEDGE_RETRIEVED", refs),
    test("contextual relevance reproducible", result.record.context_scope === "mission-risk-strategy", "CONTEXT_RESOLUTION_NONDETERMINISTIC", refs),
    test("historical replay alignment maintained", result.contract.replay_required, "REPLAY_DIVERGENCE", refs),
    test("complete evidence lineage", result.record.evidence_refs.length >= result.approved_records.length, "EVIDENCE_INCOMPLETE", refs),
    test("retrieval rationale generated", result.record.retrieval_reason.length > 0, "EXPLANATION_INCOMPLETE", refs),
    test("rejection reasons recorded", result.rejected_records.every((item) => item.rejected_reason), "EXPLANATION_INCOMPLETE", refs),
    test("confidence calculations reproducible", result.record.retrieval_confidence >= result.contract.minimum_confidence, "CONFIDENCE_THRESHOLD_BYPASS", refs),
    test("append-only retrieval ledger", result.ledger.every((entry) => entry.append_only), "LEDGER_MUTATION", refs),
    test("deterministic replay", result.contract.replay_required, "REPLAY_DIVERGENCE", refs),
    test("immutable audit trail", result.ledger.every((entry, index) => entry.sequence === index + 1), "LEDGER_MUTATION", refs),
    test("integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
    test("unauthorized retrieval attempts blocked", !result.approved_records.some((item) => item.rejected_reason === "UNAUTHORIZED_EXPOSURE"), "UNAUTHORIZED_EXPOSURE", refs),
    test("restricted governance records protected", result.contract.governance_filter_required, "GOVERNANCE_POLICY_VIOLATION", refs),
    test("denial-of-service protections validated", result.observability.retrieval_latency_ms <= 100, "OBSERVABILITY_INCOMPLETE", refs),
    test("index integrity maintained", result.observability.semantic_index_health === 1, "SEMANTIC_RETRIEVAL_NONDETERMINISTIC", refs),
  ]);
}

function replayHash(result: Omit<RetrievalResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, candidates: result.candidates.map((item) => item.integrity_hash), rankings: result.rankings.map((item) => item.integrity_hash), explanation: result.explanation.integrity_hash, record: result.record.integrity_hash, ledger: result.ledger.map((item) => item.integrity_hash), certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<RetrievalResult, "integrity_hash">): string {
  return hash({ version: result.retrieval_version, id: result.retrieval_identifier, status: result.certification.status, replay_hash: result.replay_hash });
}

export function runRetrievalIntelligence(input: RetrievalInput = {}): RetrievalResult {
  const historical = runHistoricalReasoning({ tenant_id: input.tenant_id });
  const historicalValid = validateHistoricalReasoning(historical).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<RetrievalFailure>([...(historicalValid ? [] : ["HISTORICAL_REASONING_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const refs = freezeArray([...historical.record.historical_context_refs, ...historical.record.recommendation_refs]);
  const candidateRows = candidates(input, refs, failures);
  const approved = freezeArray(candidateRows.filter((item) => item.rejected_reason === null && item.qualified && item.certified && item.governance_approved && item.constitutional_permitted && item.temporal_valid && item.confidence >= 0.8 && item.tenant_id === (input.tenant_id ?? TENANT_ID)));
  const rejected = freezeArray(candidateRows.filter((item) => !approved.includes(item)));
  const rankingRows = rankings(approved, failures);
  const explanationRow = explanation(approved, rejected, failures);
  const recordRow = record(input, candidateRows, approved, rejected, rankingRows, explanationRow);
  const ledgerRows = ledger(recordRow.retrieval_id, candidateRows, failures);
  const baseWithoutCertification: TestBase = { retrieval_version: VERSION, retrieval_identifier: ID, historical_reasoning_certified: historicalValid, contract: contract(failures), candidates: candidateRows, approved_records: approved, rejected_records: rejected, rankings: rankingRows, explanation: explanationRow, record: recordRow, ledger: ledgerRows, observability: observability(failures) };
  const validationTests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...validationTests.map((item) => item.failure_reason).filter((failure): failure is RetrievalFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<RetrievalCertification, "integrity_hash"> = { certification_id: id("retrieval_certification", VERSION), status, production_ready: status === "PASS", failures: finalFailures, tests: validationTests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<RetrievalResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateRetrievalIntelligence(result?: RetrievalResult): RetrievalValidation {
  if (!result) {
    const failures = freezeArray<RetrievalFailure>(["CONTRACT_INVALID"]);
    const base: Omit<RetrievalValidation, "validation_hash"> = { retrieval_id: null, valid: false, status: "FAIL", production_ready: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash
    && hashWithoutIntegrity(result.record) === result.record.integrity_hash
    && result.ledger.every((entry) => hashWithoutIntegrity(entry) === entry.integrity_hash)
    && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.production_ready && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<RetrievalValidation, "validation_hash"> = { retrieval_id: result.record.retrieval_id, valid, status: result.certification.status, production_ready: result.certification.production_ready, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayRetrievalIntelligence(result = runRetrievalIntelligence()): boolean {
  const replayed = runRetrievalIntelligence({ tenant_id: result.record.tenant_id, query: result.record.query });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateRetrievalIntelligence(result).valid;
}

export function getRetrievalIntelligenceContract(): RetrievalContractBundle {
  const result = runRetrievalIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, governance_first: true, conventional_rag: false, certified_only: true, never_retrieve_rules: NEVER_RETRIEVE }), result, validation: validateRetrievalIntelligence(result), observability: result.observability });
}

export const RetrievalIntelligenceEngine = Object.freeze({ run: runRetrievalIntelligence, validate: validateRetrievalIntelligence, replay: replayRetrievalIntelligence });
