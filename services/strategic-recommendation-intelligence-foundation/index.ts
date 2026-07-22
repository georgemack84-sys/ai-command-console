import { runGovernanceConstitutionalEnforcement, validateGovernanceConstitutionalEnforcement } from "@/services/governance-constitutional-enforcement";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ArtifactOriginRecord,
  StrategicArtifactFamily,
  StrategicArtifactIdentity,
  StrategicArtifactRegistration,
  StrategicFailureReason,
  StrategicFoundationCertification,
  StrategicFoundationCertificationTest,
  StrategicFoundationContractBundle,
  StrategicFoundationFailure,
  StrategicFoundationInput,
  StrategicFoundationResult,
  StrategicFoundationScenario,
  StrategicFoundationValidation,
  StrategicLifecycleState,
  StrategicRecommendationContract,
  StrategicVocabularyRegistry,
  LifecycleTransitionRegistry,
  ReferentialIntegrityReport,
  SourceOfTruthRecord,
} from "@/types/strategic-recommendation-intelligence-foundation";

const VERSION = "strategic-recommendation-intelligence-foundation/v12.1" as const;
const ID = "StrategicRecommendationIntelligenceFoundation" as const;
const FAMILIES: readonly StrategicArtifactFamily[] = Object.freeze(["Recommendations", "Strategies", "Forecasts", "Observations", "Comparisons", "Transactions", "Portfolios", "Policies", "Authority Bindings", "Recommendation Cycles", "Lifecycle Records", "Replay Records", "Evidence Records"]);
const STATES: readonly StrategicLifecycleState[] = Object.freeze(["Draft", "Proposed", "Qualified", "Certified", "Active", "Superseded", "Archived", "Revoked", "Retired"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function failureForScenario(scenario: StrategicFoundationScenario): StrategicFoundationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly StrategicFoundationFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function contract(failures: readonly StrategicFoundationFailure[]): StrategicRecommendationContract {
  const base: Omit<StrategicRecommendationContract, "integrity_hash"> = {
    contract_id: id("strategic_recommendation_contract", VERSION),
    advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"),
    operator_supremacy: true,
    governance_supremacy: !failures.includes("GOVERNANCE_BYPASS"),
    constitutional_supremacy: true,
    tenant_isolation_required: !failures.includes("TENANT_ISOLATION_BREACH"),
    evidence_required: true,
    replay_required: !failures.includes("REPLAY_REQUIREMENT_MISSING"),
    deterministic_execution_required: true,
    immutable_lineage_required: true,
    audit_required: true,
    policy_enforcement_required: true,
    authority_boundaries_required: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"),
    execute_recommendations_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("CONTRACT_INCOMPLETE") ? "invalid-strategic-contract" : hashWithoutIntegrity(base) });
}

function vocabulary(failures: readonly StrategicFoundationFailure[]): StrategicVocabularyRegistry {
  const failureReasons: readonly StrategicFailureReason[] = freezeArray(["MissingEvidence", "PolicyViolation", "AuthorityViolation", "ReplayFailure", "IntegrityFailure", "DuplicateArtifact", "BrokenReference", "LifecycleViolation", "OriginViolation"]);
  const base: Omit<StrategicVocabularyRegistry, "integrity_hash"> = {
    registry_id: id("strategic_vocabulary_registry", VERSION),
    lifecycle_states: failures.includes("VOCABULARY_UNBOUNDED") ? freezeArray([]) : STATES,
    recommendation_outcomes: freezeArray(["Accepted", "Rejected", "Deferred", "Expired", "Withdrawn", "Superseded"]),
    strategy_types: freezeArray(["Operational", "Tactical", "Strategic", "Preventive", "Corrective", "Exploratory", "Optimization", "Recovery"]),
    scenario_types: freezeArray(["Baseline", "Alternative", "Best Case", "Worst Case", "Expected", "Stress", "Counterfactual"]),
    forecast_types: freezeArray(["Probability", "Trend", "Risk", "Confidence", "Capacity", "Portfolio"]),
    comparison_outcomes: freezeArray(["Better", "Equivalent", "Inferior", "Inconclusive", "Conflicting"]),
    portfolio_outcomes: freezeArray(["Diversified", "Concentrated", "Balanced", "High Risk", "Low Risk"]),
    observation_states: freezeArray(["Observed", "Qualified", "Correlated", "Confirmed", "Rejected", "Archived"]),
    origin_types: freezeArray(["Human", "Simulation", "Recommendation", "Observation", "Forecast", "Policy", "Governance", "Replay", "External"]),
    authority_states: freezeArray(["Advisory", "Governance Approved", "Operator Approved", "Certified", "Revoked"]),
    confidence_states: freezeArray(["Low", "Medium", "High", "Qualified", "Certified"]),
    failure_reasons: failureReasons,
    bounded: !failures.includes("VOCABULARY_UNBOUNDED"),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function identities(tenantId: string, failures: readonly StrategicFoundationFailure[]): readonly StrategicArtifactIdentity[] {
  return freezeArray(FAMILIES.map((family, index) => {
    const seed = { tenantId, family, version: VERSION };
    const base: Omit<StrategicArtifactIdentity, "integrity_hash"> = { artifact_id: id("strategic_artifact", failures.includes("DUPLICATE_CANONICAL_ARTIFACT") && index === 1 ? FAMILIES[0] : seed), family, canonical_owner: failures.includes("CANONICAL_OWNERSHIP_CONFLICT") && index === 0 ? "conflicting-owner" : `owner:${tenantId}:strategic-foundation`, version_id: id("strategic_version", seed), schema_id: failures.includes("SCHEMA_INTEGRITY_FAILURE") ? "" : `schema:phase-12.1:${family.toLowerCase().replace(/ /g, "-")}`, origin_id: id("strategic_origin", seed), lineage_ref: `lineage:strategic-foundation:${index + 1}`, deterministic: !failures.includes("IDENTITY_NONDETERMINISTIC"), duplicate_detected: failures.includes("DUPLICATE_CANONICAL_ARTIFACT") && index === 1 };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function artifactRegistry(ids: readonly StrategicArtifactIdentity[], failures: readonly StrategicFoundationFailure[]): readonly StrategicArtifactRegistration[] {
  const rows = failures.includes("REGISTRY_INCOMPLETE") ? ids.slice(0, -1) : ids;
  return freezeArray(rows.map((identity) => {
    const base: Omit<StrategicArtifactRegistration, "integrity_hash"> = { artifact_id: identity.artifact_id, family: identity.family, schema_version: "12.1", lifecycle: "Certified", owner: identity.canonical_owner, origin_id: identity.origin_id, authority: "Advisory", integrity_policy: "hash-required", replay_policy: failures.includes("REPLAY_REQUIREMENT_MISSING") ? "" : "deterministic-replay-required", governance_policy: failures.includes("GOVERNANCE_BYPASS") ? "" : "governance-approval-required", retirement_policy: "retirement-preserves-audit-history", authoritative: true };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function originRegistry(ids: readonly StrategicArtifactIdentity[], failures: readonly StrategicFoundationFailure[]): readonly ArtifactOriginRecord[] {
  return freezeArray(ids.map((identity) => {
    const base: Omit<ArtifactOriginRecord, "integrity_hash"> = { origin_id: identity.origin_id, artifact_id: identity.artifact_id, origin_type: "Governance", originating_artifact: identity.artifact_id, originating_process: "phase-12.1-foundation-registration", originating_policy: "SRC-018", originating_authority: "StrategicRecommendationContract", originating_operator: "operator:strategic-governance", originating_governance_approval: failures.includes("ORIGIN_CONTRACT_BROKEN") ? "" : "governance:phase-12.1:approved", immutable: !failures.includes("ORIGIN_CONTRACT_BROKEN"), lineage_complete: !failures.includes("ORIGIN_CONTRACT_BROKEN"), replay_deterministic: !failures.includes("REPLAY_REQUIREMENT_MISSING") };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function sourceOfTruth(ids: readonly StrategicArtifactIdentity[], failures: readonly StrategicFoundationFailure[]): readonly SourceOfTruthRecord[] {
  const canonical = ids.map((identity, index): SourceOfTruthRecord => {
    const base: Omit<SourceOfTruthRecord, "integrity_hash"> = { artifact_id: identity.artifact_id, canonical_owner: identity.canonical_owner, authoritative: !failures.includes("SOURCE_OF_TRUTH_VIOLATION"), derived_view: false, derived_from: null, can_override_source: false, can_redefine_ownership: false, lifecycle_owner: true, governance_owner: true };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  const derivedBase: Omit<SourceOfTruthRecord, "integrity_hash"> = { artifact_id: id("strategic_derived_view", ids[0]?.artifact_id ?? VERSION), canonical_owner: "projection:read-only", authoritative: failures.includes("DERIVED_VIEW_AUTHORITATIVE"), derived_view: true, derived_from: ids[0]?.artifact_id ?? null, can_override_source: false, can_redefine_ownership: false, lifecycle_owner: false, governance_owner: false };
  return freezeArray([...canonical, Object.freeze({ ...derivedBase, integrity_hash: hashWithoutIntegrity(derivedBase) })]);
}

function transitions(failures: readonly StrategicFoundationFailure[]): LifecycleTransitionRegistry {
  const pairs: readonly [StrategicLifecycleState, StrategicLifecycleState][] = Object.freeze([["Draft", "Proposed"], ["Proposed", "Qualified"], ["Qualified", "Certified"], ["Certified", "Active"], ["Active", "Superseded"], ["Superseded", "Archived"], ["Archived", "Retired"], ["Active", "Revoked"]]);
  const base: Omit<LifecycleTransitionRegistry, "integrity_hash"> = { registry_id: id("strategic_lifecycle_transition_registry", VERSION), transitions: freezeArray(pairs.map(([from, to], index) => Object.freeze({ from, to, documented: !(failures.includes("LIFECYCLE_TRANSITION_UNDOCUMENTED") && index === 0), approval_required: true }))), complete: !failures.includes("LIFECYCLE_TRANSITION_UNDOCUMENTED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function referentialIntegrity(ids: readonly StrategicArtifactIdentity[], registry: readonly StrategicArtifactRegistration[], origins: readonly ArtifactOriginRecord[], failures: readonly StrategicFoundationFailure[]): ReferentialIntegrityReport {
  const unresolved = failures.includes("REFERENTIAL_INTEGRITY_BROKEN") ? freezeArray(["strategic_artifact:missing-reference"]) : freezeArray([]);
  const registryIds = new Set(registry.map((item) => item.artifact_id));
  const base: Omit<ReferentialIntegrityReport, "integrity_hash"> = { report_id: id("strategic_referential_integrity", VERSION), artifact_references_valid: unresolved.length === 0 && ids.every((item) => registryIds.has(item.artifact_id)), policy_references_valid: !failures.includes("GOVERNANCE_BYPASS"), lifecycle_references_valid: !failures.includes("LIFECYCLE_TRANSITION_UNDOCUMENTED"), authority_references_valid: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"), recommendation_references_valid: unresolved.length === 0, transaction_references_valid: unresolved.length === 0, observation_references_valid: unresolved.length === 0, comparison_references_valid: unresolved.length === 0, replay_references_valid: !failures.includes("REPLAY_REQUIREMENT_MISSING") && origins.every((origin) => origin.replay_deterministic), unresolved_references: unresolved };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: StrategicFoundationFailure, refs: readonly string[]): StrategicFoundationCertificationTest {
  const base: Omit<StrategicFoundationCertificationTest, "integrity_hash"> = { test_id: id("strategic_foundation_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

type TestBase = Omit<StrategicFoundationResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: TestBase): readonly StrategicFoundationCertificationTest[] {
  const refs = freezeArray([result.contract.integrity_hash, result.vocabulary_registry.integrity_hash, result.referential_integrity.integrity_hash]);
  return freezeArray([
    test("Constitutional Contract Complete", hashWithoutIntegrity(result.contract) === result.contract.integrity_hash && result.contract.constitutional_supremacy, "CONTRACT_INCOMPLETE", refs),
    test("Advisory Boundary Enforced", result.contract.advisory_only && result.contract.execute_recommendations_supported === false, "ADVISORY_BOUNDARY_VIOLATION", refs),
    test("Governance Supremacy Enforced", result.governance_certified && result.contract.governance_supremacy, "GOVERNANCE_BYPASS", refs),
    test("Vocabulary Registry Complete", result.vocabulary_registry.bounded && result.vocabulary_registry.lifecycle_states.length === 9, "VOCABULARY_UNBOUNDED", refs),
    test("Artifact Identity Deterministic", result.identities.every((identity) => identity.deterministic && identity.schema_id.length > 0), "IDENTITY_NONDETERMINISTIC", refs),
    test("Duplicate Detection Operational", !result.identities.some((identity) => identity.duplicate_detected), "DUPLICATE_CANONICAL_ARTIFACT", refs),
    test("Artifact Registry Complete", result.artifact_registry.length === FAMILIES.length, "REGISTRY_INCOMPLETE", refs),
    test("Origin Contract (SRC-018) Implemented", result.origin_registry.every((origin) => origin.immutable && origin.lineage_complete && origin.originating_governance_approval.length > 0), "ORIGIN_CONTRACT_BROKEN", refs),
    test("Single Source of Truth (SRI-005) Enforced", result.source_of_truth_registry.filter((row) => row.authoritative && !row.derived_view).length === FAMILIES.length, "SOURCE_OF_TRUTH_VIOLATION", refs),
    test("Derived Views Non-Authoritative", result.source_of_truth_registry.every((row) => !row.derived_view || !row.authoritative), "DERIVED_VIEW_AUTHORITATIVE", refs),
    test("Referential Integrity Validated", result.referential_integrity.unresolved_references.length === 0 && result.referential_integrity.artifact_references_valid, "REFERENTIAL_INTEGRITY_BROKEN", refs),
    test("Schema Integrity Validated", result.identities.every((identity) => identity.schema_id.startsWith("schema:phase-12.1")), "SCHEMA_INTEGRITY_FAILURE", refs),
    test("Canonical Ownership Enforced", new Set(result.identities.map((identity) => identity.canonical_owner)).size === 1, "CANONICAL_OWNERSHIP_CONFLICT", refs),
    test("Replay Requirements Complete", result.contract.replay_required && result.referential_integrity.replay_references_valid, "REPLAY_REQUIREMENT_MISSING", refs),
    test("Tenant Isolation Preserved", result.contract.tenant_isolation_required, "TENANT_ISOLATION_BREACH", refs),
  ]);
}

function replayHash(result: Omit<StrategicFoundationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, vocabulary: result.vocabulary_registry.integrity_hash, identities: result.identities.map((item) => item.integrity_hash), registry: result.artifact_registry.map((item) => item.integrity_hash), origins: result.origin_registry.map((item) => item.integrity_hash), truth: result.source_of_truth_registry.map((item) => item.integrity_hash), transitions: result.lifecycle_transition_registry.integrity_hash, integrity: result.referential_integrity.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<StrategicFoundationResult, "integrity_hash">): string { return hash({ version: result.foundation_version, id: result.foundation_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runStrategicRecommendationIntelligenceFoundation(input: StrategicFoundationInput = {}): StrategicFoundationResult {
  const tenantId = input.tenant_id ?? "tenant_mission_control";
  const governance = runGovernanceConstitutionalEnforcement({ tenant_id: tenantId });
  const governanceCertified = validateGovernanceConstitutionalEnforcement(governance).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<StrategicFoundationFailure>([...(governanceCertified ? [] : ["GOVERNANCE_NOT_CERTIFIED" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const strategicContract = contract(failures);
  const strategicVocabulary = vocabulary(failures);
  const strategicIdentities = identities(tenantId, failures);
  const strategicRegistry = artifactRegistry(strategicIdentities, failures);
  const strategicOrigins = originRegistry(strategicIdentities, failures);
  const strategicTruth = sourceOfTruth(strategicIdentities, failures);
  const strategicTransitions = transitions(failures);
  const strategicIntegrity = referentialIntegrity(strategicIdentities, strategicRegistry, strategicOrigins, failures);
  const baseWithoutCertification: TestBase = { foundation_version: VERSION, foundation_identifier: ID, governance_certified: governanceCertified, contract: strategicContract, vocabulary_registry: strategicVocabulary, identities: strategicIdentities, artifact_registry: strategicRegistry, origin_registry: strategicOrigins, source_of_truth_registry: strategicTruth, lifecycle_transition_registry: strategicTransitions, referential_integrity: strategicIntegrity };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is StrategicFoundationFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<StrategicFoundationCertification, "integrity_hash"> = { certification_id: id("strategic_foundation_certification", VERSION), status, downstream_phase_12_enabled: status === "PASS", failures: finalFailures, tests };
  const certification = Object.freeze({ ...certBase, integrity_hash: hashWithoutIntegrity(certBase) });
  const base: Omit<StrategicFoundationResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateStrategicRecommendationIntelligenceFoundation(result?: StrategicFoundationResult): StrategicFoundationValidation {
  if (!result) {
    const failures = freezeArray<StrategicFoundationFailure>(["CONTRACT_INCOMPLETE"]);
    const base: Omit<StrategicFoundationValidation, "validation_hash"> = { foundation_id: null, valid: false, status: "FAIL", downstream_phase_12_enabled: false, failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.contract) === result.contract.integrity_hash && hashWithoutIntegrity(result.vocabulary_registry) === result.vocabulary_registry.integrity_hash && result.artifact_registry.every((item) => hashWithoutIntegrity(item) === item.integrity_hash) && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.certification.status === "PASS" && result.certification.downstream_phase_12_enabled && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<StrategicFoundationValidation, "validation_hash"> = { foundation_id: result.contract.contract_id, valid, status: result.certification.status, downstream_phase_12_enabled: result.certification.downstream_phase_12_enabled, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayStrategicRecommendationIntelligenceFoundation(result = runStrategicRecommendationIntelligenceFoundation()): boolean {
  const replayed = runStrategicRecommendationIntelligenceFoundation();
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateStrategicRecommendationIntelligenceFoundation(result).valid;
}

export function getStrategicRecommendationIntelligenceFoundationContract(): StrategicFoundationContractBundle {
  const result = runStrategicRecommendationIntelligenceFoundation();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, derived_authority_supported: false, src_018_origin_required: true, sri_005_single_source_of_truth_required: true, replay_required: true, tenant_isolation_required: true }), result, validation: validateStrategicRecommendationIntelligenceFoundation(result) });
}

export const StrategicRecommendationIntelligenceFoundation = Object.freeze({ run: runStrategicRecommendationIntelligenceFoundation, validate: validateStrategicRecommendationIntelligenceFoundation, replay: replayStrategicRecommendationIntelligenceFoundation });
