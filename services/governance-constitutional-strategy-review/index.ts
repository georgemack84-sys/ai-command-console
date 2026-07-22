import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { recordStrategyEvolutionLedger, replayStrategyEvolutionLedger } from "@/services/strategy-evolution-ledger";
import type {
  GovernanceConstitutionalStrategyReviewFailure,
  GovernanceConstitutionalStrategyReviewFoundation,
  GovernanceConstitutionalStrategyReviewInput,
  GovernanceConstitutionalStrategyReviewResult,
  StrategyGovernanceReview,
  StrategyReviewApiSurface,
  StrategyReviewOutcome,
  StrategyReviewRegistry,
  StrategyReviewValidation,
} from "@/types/governance-constitutional-strategy-review";

const REVIEW_VERSION = "governance-constitutional-strategy-review/v1" as const;
const REVIEW_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<GovernanceConstitutionalStrategyReviewInput["scenario"]>;

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

function ledgerScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_LEDGER: "UNCERTIFIED_PROPOSAL",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function sourceForScenario(input: GovernanceConstitutionalStrategyReviewInput, scenario: Scenario) {
  return input.ledger_result ?? recordStrategyEvolutionLedger({ scenario: ledgerScenario(scenario) });
}

function buildApiSurface(): StrategyReviewApiSurface {
  const base: Omit<StrategyReviewApiSurface, "integrity_hash"> = {
    api_id: "governance_constitutional_strategy_review_api",
    review_proposal: "POST /governance-constitutional-strategy-review/review",
    retrieve_reviews: "POST /governance-constitutional-strategy-review/reviews",
    retrieve_decision: "POST /governance-constitutional-strategy-review/decision",
    retrieve_governance: "POST /governance-constitutional-strategy-review/governance",
    retrieve_constitutional: "POST /governance-constitutional-strategy-review/constitutional",
    retrieve_authority: "POST /governance-constitutional-strategy-review/authority",
    retrieve_policy: "POST /governance-constitutional-strategy-review/policy",
    retrieve_regulatory: "POST /governance-constitutional-strategy-review/regulatory",
    replay_review: "POST /governance-constitutional-strategy-review/replay",
    retrieve_registry: "POST /governance-constitutional-strategy-review/registry",
    retrieve_contract: "GET /governance-constitutional-strategy-review/contract",
    update_supported: false,
    delete_supported: false,
    direct_approval_supported: false,
    simulation_bypass_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function outcomeForScenario(scenario: Scenario): StrategyReviewOutcome {
  if (scenario === "REVISION_REQUIRED" || scenario === "MISSING_REGULATORY" || scenario === "MISSING_REPLAY") return "REVISION_REQUIRED";
  if (scenario === "GOVERNANCE_REJECTED" || scenario === "MISSING_GOVERNANCE" || scenario === "AUTHORITY_FAIL" || scenario === "POLICY_CONFLICT") return "GOVERNANCE_REJECTED";
  if (scenario === "CONSTITUTIONAL_REJECTED" || scenario === "CONSTITUTIONAL_FAIL" || scenario === "TENANT_ISOLATION_FAIL" || scenario === "ADVISORY_VIOLATION" || scenario === "CROSS_TENANT") return "CONSTITUTIONAL_REJECTED";
  return "APPROVED_FOR_SIMULATION";
}

function buildReview(input: GovernanceConstitutionalStrategyReviewInput, scenario: Scenario): StrategyGovernanceReview {
  const ledger = sourceForScenario(input, scenario);
  const record = ledger.records[0];
  const proposal = ledger.proposal_result.proposals[0];
  const outcome = outcomeForScenario(scenario);
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : record?.governance_decision_refs ?? freezeArray([]);
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : record?.replay_refs ?? freezeArray([]);
  const regulatory = scenario === "MISSING_REGULATORY" ? freezeArray([]) : freezeArray(["No automatic deployment authority introduced", "Audit documentation required before simulation", "Jurisdictional review deferred to governance owner"]);
  const base: Omit<StrategyGovernanceReview, "integrity_hash"> = {
    review_id: `strategy_governance_review_${hash(`${record?.ledger_record_id ?? "missing"}:${scenario}`).slice(0, 16)}`,
    proposal_id: record?.proposal_id ?? proposal?.proposal_id ?? "",
    tenant_id: scenario === "CROSS_TENANT" || scenario === "TENANT_ISOLATION_FAIL" ? `${record?.tenant_id ?? "tenant_mission_control"}:foreign` : record?.tenant_id ?? "tenant_mission_control",
    mission_scope: record?.mission_scope ?? proposal?.mission_scope ?? "mission_scope_unknown",
    governance_compliance: scenario !== "MISSING_GOVERNANCE" && scenario !== "GOVERNANCE_REJECTED" && scenario !== "POLICY_CONFLICT",
    constitutional_compliance: scenario !== "CONSTITUTIONAL_FAIL" && scenario !== "CONSTITUTIONAL_REJECTED" && scenario !== "ADVISORY_VIOLATION" && scenario !== "TENANT_ISOLATION_FAIL" && scenario !== "CROSS_TENANT",
    authority_verification: scenario !== "AUTHORITY_FAIL",
    tenant_isolation_status: scenario !== "TENANT_ISOLATION_FAIL" && scenario !== "CROSS_TENANT",
    advisory_only_validation: scenario !== "ADVISORY_VIOLATION",
    policy_conflict_summary: scenario === "POLICY_CONFLICT" ? "Unresolved governance policy conflict blocks simulation entry." : "No unresolved policy conflict detected.",
    regulatory_implications: regulatory,
    review_outcome: scenario === "NONDETERMINISTIC_OUTCOME" ? "REVISION_REQUIRED" : outcome,
    reviewer_identity: "governance_constitutional_strategy_review_engine",
    supporting_governance_refs: governanceRefs,
    supporting_policy_refs: scenario === "POLICY_CONFLICT" ? freezeArray(["policy_conflict_ref_unresolved_1"]) : freezeArray(["policy_ref_advisory_only", "policy_ref_operator_supremacy", "policy_ref_governance_supremacy"]),
    supporting_replay_refs: replayRefs,
    review_timestamp: REVIEW_TIMESTAMP,
    lifecycle_state: outcome === "REVISION_REQUIRED" ? "RETURNED_FOR_REVISION" : outcome === "APPROVED_FOR_SIMULATION" ? "RECORDED" : "REJECTED",
    simulation_entry_permitted: scenario === "SIMULATION_BYPASS" ? true : outcome === "APPROVED_FOR_SIMULATION",
    mutates_strategy: false,
    direct_approval: false,
  };
  const review = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...review, integrity_hash: hash({ tampered: review.review_id }) });
  return review;
}

function buildReviews(input: GovernanceConstitutionalStrategyReviewInput, scenario: Scenario): readonly StrategyGovernanceReview[] {
  if (scenario === "UNCERTIFIED_LEDGER") return freezeArray([]);
  return freezeArray([buildReview(input, scenario)]);
}

function buildRegistry(reviews: readonly StrategyGovernanceReview[], scenario: Scenario): StrategyReviewRegistry {
  const outcome_index = reviews.reduce((index, review) => {
    return { ...index, [review.review_outcome]: freezeArray([...(index[review.review_outcome] ?? []), review.review_id]) };
  }, {} as Record<StrategyReviewOutcome, readonly string[]>);
  const proposal_index = reviews.reduce((index, review) => {
    return { ...index, [review.proposal_id]: freezeArray([...(index[review.proposal_id] ?? []), review.review_id]) };
  }, {} as Record<string, readonly string[]>);
  const base: Omit<StrategyReviewRegistry, "integrity_hash"> = {
    registry_id: `strategy_review_registry_${hash(reviews.map((review) => review.review_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${reviews[0]?.tenant_id ?? "tenant_mission_control"}:foreign` : reviews[0]?.tenant_id ?? "tenant_mission_control",
    review_refs: reviews.map((review) => review.review_id),
    outcome_index: Object.freeze(outcome_index),
    proposal_index: Object.freeze(proposal_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: GovernanceConstitutionalStrategyReviewInput, reviews: readonly StrategyGovernanceReview[], registry: StrategyReviewRegistry, scenario: Scenario): readonly GovernanceConstitutionalStrategyReviewFailure[] {
  const ledger = sourceForScenario(input, scenario);
  const failures: GovernanceConstitutionalStrategyReviewFailure[] = [];
  if (scenario === "UNCERTIFIED_LEDGER" || !ledger.validation.certified) failures.push("LEDGER_UNCERTIFIED");
  if (scenario === "MISSING_GOVERNANCE" || reviews.some((review) => !review.governance_compliance || !review.supporting_governance_refs.length)) failures.push("GOVERNANCE_COMPLIANCE_INCOMPLETE");
  if (scenario === "CONSTITUTIONAL_FAIL" || scenario === "CONSTITUTIONAL_REJECTED" || reviews.some((review) => !review.constitutional_compliance)) failures.push("CONSTITUTIONAL_COMPLIANCE_FAILED");
  if (scenario === "AUTHORITY_FAIL" || reviews.some((review) => !review.authority_verification)) failures.push("AUTHORITY_VERIFICATION_FAILED");
  if (scenario === "TENANT_ISOLATION_FAIL" || reviews.some((review) => !review.tenant_isolation_status)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "ADVISORY_VIOLATION" || reviews.some((review) => !review.advisory_only_validation || review.mutates_strategy || review.direct_approval)) failures.push("ADVISORY_ONLY_VIOLATED");
  if (scenario === "POLICY_CONFLICT" || reviews.some((review) => review.policy_conflict_summary.includes("Unresolved"))) failures.push("POLICY_CONFLICT_UNRESOLVED");
  if (scenario === "MISSING_REGULATORY" || reviews.some((review) => !review.regulatory_implications.length)) failures.push("REGULATORY_ANALYSIS_MISSING");
  if (scenario === "MISSING_REPLAY" || !replayStrategyEvolutionLedger(ledger) || reviews.some((review) => !review.supporting_replay_refs.length)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (reviews[0]?.tenant_id ?? registry.tenant_id)) failures.push("CROSS_TENANT_PROPOSAL_DETECTED");
  if (scenario === "NONDETERMINISTIC_OUTCOME") failures.push("REVIEW_OUTCOME_NONDETERMINISTIC");
  if (scenario === "HASH_MISMATCH" || reviews.some((review) => hashWithoutIntegrity(review) !== review.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "SIMULATION_BYPASS" || reviews.some((review) => review.simulation_entry_permitted && review.review_outcome !== "APPROVED_FOR_SIMULATION")) failures.push("SIMULATION_BYPASS_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly GovernanceConstitutionalStrategyReviewFailure[]): StrategyReviewValidation["state"] {
  if (failures.includes("REGULATORY_ANALYSIS_MISSING") || failures.includes("REPLAY_REFERENCES_INCOMPLETE") || failures.includes("GOVERNANCE_COMPLIANCE_INCOMPLETE")) return "PENDING_REVIEW";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(input: GovernanceConstitutionalStrategyReviewInput, reviews: readonly StrategyGovernanceReview[], registry: StrategyReviewRegistry, failures: readonly GovernanceConstitutionalStrategyReviewFailure[], scenario: Scenario): StrategyReviewValidation {
  const ledger = sourceForScenario(input, scenario);
  const reviewsVerified = reviews.every((review) => hashWithoutIntegrity(review) === review.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategyReviewValidation, "integrity_hash"> = {
    validation_id: "governance_constitutional_strategy_review_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && reviewsVerified && registryVerified,
    failures,
    ledger_certified: ledger.validation.certified,
    governance_complete: !failures.includes("GOVERNANCE_COMPLIANCE_INCOMPLETE"),
    constitutional_compliant: !failures.includes("CONSTITUTIONAL_COMPLIANCE_FAILED"),
    authority_verified: !failures.includes("AUTHORITY_VERIFICATION_FAILED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("CROSS_TENANT_PROPOSAL_DETECTED"),
    advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATED"),
    policy_conflicts_resolved: !failures.includes("POLICY_CONFLICT_UNRESOLVED"),
    regulatory_complete: !failures.includes("REGULATORY_ANALYSIS_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_INCOMPLETE"),
    outcome_deterministic: !failures.includes("REVIEW_OUTCOME_NONDETERMINISTIC"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    simulation_gate_enforced: !failures.includes("SIMULATION_BYPASS_DETECTED"),
    integrity_verified: reviewsVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<GovernanceConstitutionalStrategyReviewResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    ledger_replay_hash: result.ledger_result.replay_hash,
    reviews: result.reviews,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<GovernanceConstitutionalStrategyReviewResult, "integrity_hash">): string {
  return hash({
    governance_constitutional_strategy_review_version: result.governance_constitutional_strategy_review_version,
    api_surface_hash: result.api_surface.integrity_hash,
    review_hashes: result.reviews.map((review) => review.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function reviewGovernanceConstitutionalStrategy(input: GovernanceConstitutionalStrategyReviewInput = {}): GovernanceConstitutionalStrategyReviewResult {
  const scenario = input.scenario ?? "BASELINE";
  const ledger_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const reviews = buildReviews(input, scenario);
  const registry = buildRegistry(reviews, scenario);
  const validationFailures = collectFailures(input, reviews, registry, scenario);
  const validation = buildValidation(input, reviews, registry, validationFailures, scenario);
  const base: Omit<GovernanceConstitutionalStrategyReviewResult, "integrity_hash" | "replay_hash"> = {
    governance_constitutional_strategy_review_version: REVIEW_VERSION,
    ledger_result,
    api_surface,
    reviews,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    governance_compliant: validation.governance_complete,
    constitutionally_compliant: validation.constitutional_compliant,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: validation.advisory_only,
    simulation_entry_permitted: reviews.some((review) => review.review_outcome === "APPROVED_FOR_SIMULATION") && validation.certified,
    mutates_strategy: false,
    direct_approval: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceConstitutionalStrategyReview(result: GovernanceConstitutionalStrategyReviewResult): boolean {
  return resultReplayHash(result) === result.replay_hash
    && resultIntegrityHash(result) === result.integrity_hash
    && replayStrategyEvolutionLedger(result.ledger_result);
}

export function getGovernanceConstitutionalStrategyReviewFoundation(): GovernanceConstitutionalStrategyReviewFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_constitutional_strategy_review_version: REVIEW_VERSION,
    api_surface,
    result: reviewGovernanceConstitutionalStrategy(),
  });
}

export const GovernanceConstitutionalStrategyReview = Object.freeze({
  review: reviewGovernanceConstitutionalStrategy,
  replay: replayGovernanceConstitutionalStrategyReview,
});
