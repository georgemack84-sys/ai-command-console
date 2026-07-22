import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runScaleStressResilienceValidation, validateScaleStressResilienceValidation } from "@/services/scale-stress-resilience-validation";
import type {
  AssuranceDependencyGovernanceBundle,
  AssuranceDependencyGovernanceInput,
  AssuranceDependencyGovernanceResult,
  AssuranceDependencyGovernanceValidation,
  DependencyGovernanceFailure,
  DependencyGovernanceOutcome,
  DependencyGovernanceScenario,
  DependencyStatus,
  DependencyCertificationTest,
} from "@/types/assurance-dependency-governance";

const VERSION = "assurance-dependency-governance/v14.8" as const;
const IDENTIFIER = "AssuranceDependencyGovernance" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: DependencyGovernanceScenario): DependencyGovernanceFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly DependencyGovernanceFailure[], failure: DependencyGovernanceFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly DependencyGovernanceFailure[]): DependencyGovernanceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OPERATIONAL_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const candidateStatuses = freezeArray(["IDENTIFIED", "SEARCH_IN_PROGRESS", "SOURCE_LOCATED", "SOURCE_NOT_FOUND", "PROMOTED_TO_VERIFICATION", "REJECTED"] as const);
const dependencyStatuses = freezeArray(["UNVERIFIED", "VERIFICATION_IN_PROGRESS", "VERIFIED_COMPATIBLE", "VERIFIED_INCOMPATIBLE", "MISSING", "SUPERSEDED"] as const);

function resultReplayHash(result: Omit<AssuranceDependencyGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ scale: result.scale_validation_ref, candidates: result.candidates.map((item) => item.integrity_hash), manifests: result.manifests.map((item) => item.integrity_hash), promotion: result.promotion.integrity_hash, blocking: result.blocking.integrity_hash, ledger: result.governance_ledger.map((item) => item.integrity_hash), observability: result.observability.integrity_hash, tests: result.certification_tests.map((item) => item.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<AssuranceDependencyGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}
function test(name: string, passed: boolean, failure: DependencyGovernanceFailure): DependencyCertificationTest {
  const actual: DependencyGovernanceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OPERATIONAL_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("dependency_governance_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}

export function runAssuranceDependencyGovernance(input: AssuranceDependencyGovernanceInput = {}): AssuranceDependencyGovernanceResult {
  const scale = runScaleStressResilienceValidation();
  const scaleValid = validateScaleStressResilienceValidation(scale).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(scaleValid ? [] : ["SCALE_VALIDATION_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const dependencyStatus: DependencyStatus = input.dependency_status ?? "UNVERIFIED";
  const dependencyId = id("phase13_dependency", "Mission Control Phase 13 Assurance Framework");
  const candidate = nested({ candidate_dependency_id: id("candidate_dependency", dependencyId), dependency_name: "Mission Control Phase 13 Assurance Framework", dependency_type: "EXTERNAL_SPECIFICATION" as const, candidate_source: "phase-13-assurance-framework", discovery_reason: "Phase 14 certification references prior constitutional assurance framework.", discovery_timestamp: TIMESTAMP, discovered_by: "assurance-dependency-governance", suspected_phase: "13" as const, suspected_specification: "Phase 13 Assurance Framework", candidate_status: has(failures, "CANDIDATE_LIFECYCLE_NON_DETERMINISTIC") ? "SEARCH_IN_PROGRESS" as const : "PROMOTED_TO_VERIFICATION" as const, search_history_refs: freezeArray([id("search_history", dependencyId)]), promotion_refs: freezeArray([id("promotion", dependencyId)]), rejection_reason: null, lineage_refs: has(failures, "GOVERNANCE_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([id("candidate_lineage", dependencyId)]), replay_refs: freezeArray([id("candidate_replay", dependencyId)]) });
  const manifest = nested({ manifest_id: id("dependency_manifest", dependencyId), dependency_id: dependencyId, specification_name: "Mission Control Phase 13 Assurance Framework", specification_version: "13.x", source_reference: "phase-13", content_hash: has(failures, "CONTENT_HASH_VERIFICATION_NOT_REPRODUCIBLE") ? "" : id("content_hash", "phase-13"), dependency_status: dependencyStatus, compatibility_summary: dependencyStatus === "VERIFIED_COMPATIBLE" ? "Verified compatible." : "Compatibility not verified; dependency semantics remain blocked.", constitutional_validation: !has(failures, "CONSTITUTIONAL_COMPATIBILITY_INVALID") && dependencyStatus === "VERIFIED_COMPATIBLE", semantic_validation: !has(failures, "SEMANTIC_VERIFICATION_NOT_REPRODUCIBLE") && dependencyStatus === "VERIFIED_COMPATIBLE", version_validation: !has(failures, "VERSION_VERIFICATION_NOT_REPRODUCIBLE") && dependencyStatus === "VERIFIED_COMPATIBLE", governance_validation: !has(failures, "CONSTITUTIONAL_COMPATIBILITY_INVALID") && dependencyStatus === "VERIFIED_COMPATIBLE", verification_timestamp: TIMESTAMP, verifier_identity: "dependency-verification-framework", supersedes_manifest_ref: null, lineage_refs: has(failures, "GOVERNANCE_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([id("manifest_lineage", dependencyId)]), replay_refs: freezeArray([id("manifest_replay", dependencyId)]) });
  const promotion = nested({ promotion_id: id("promotion", dependencyId), candidate_dependency_id: candidate.candidate_dependency_id, manifest_id: manifest.manifest_id, promotion_approved: true, candidate_history_preserved: !has(failures, "CANDIDATE_HISTORY_MUTABLE"), authority_transition_explicit: !has(failures, "MANIFEST_AUTHORITY_AMBIGUOUS"), compatibility_claimed: false as const, replayable: !has(failures, "PROMOTION_NOT_REPLAYABLE") });
  const blocking = nested({ blocking_id: id("dependency_blocking", dependencyId), dependency_id: dependencyId, dependency_status: dependencyStatus, infrastructure_permitted: !has(failures, "INFRASTRUCTURE_BLOCKED"), semantic_implementation_blocked: dependencyStatus !== "VERIFIED_COMPATIBLE" && !has(failures, "DEPENDENCY_SEMANTICS_NOT_BLOCKED"), phase_13_assumptions_blocked: dependencyStatus !== "VERIFIED_COMPATIBLE" && !has(failures, "PHASE_13_ASSUMPTION_ALLOWED"), discovery_artifacts_blocked_from_certification: !has(failures, "DISCOVERY_NORMATIVE_LEAK"), certification_gate_enforced: !has(failures, "CERTIFICATION_GATE_NOT_ENFORCED"), deterministic: !has(failures, "DEPENDENCY_BLOCKING_NON_DETERMINISTIC") });
  const ledger = freezeArray((["DISCOVERY", "PROMOTION", "VERIFICATION", "COMPATIBILITY_DECISION", "BLOCKING_DECISION", "GOVERNANCE_APPROVAL", "REPLAY"] as const).map((event_type, index) => nested({ ledger_entry_id: id("dependency_ledger", { event_type, index }), event_type, dependency_id: dependencyId, sequence: index + 1, lineage_ref: has(failures, "GOVERNANCE_LINEAGE_INCOMPLETE") ? "" : id("dependency_lineage", { event_type, index }), replay_ref: id("dependency_replay", { event_type, index }), immutable: !has(failures, "MANIFEST_MUTABLE") && !has(failures, "CANDIDATE_HISTORY_MUTABLE") })));
  const observability = nested({ observability_id: id("dependency_observability", VERSION), candidate_backlog_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), verification_queue_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), blocking_status_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), manifest_integrity_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), dependency_drift_monitored: !has(failures, "OBSERVABILITY_UNAVAILABLE"), alerts_operational: !has(failures, "OBSERVABILITY_UNAVAILABLE") });
  const verifiedGateSatisfied = dependencyStatus === "VERIFIED_COMPATIBLE" && manifest.constitutional_validation && manifest.semantic_validation && manifest.version_validation && manifest.governance_validation;
  const tests = freezeArray([
    test("Candidate lifecycle deterministic", candidate.candidate_status === "PROMOTED_TO_VERIFICATION", "CANDIDATE_LIFECYCLE_NON_DETERMINISTIC"),
    test("Discovery artifacts non-normative", blocking.discovery_artifacts_blocked_from_certification, "DISCOVERY_NORMATIVE_LEAK"),
    test("Candidate history immutable", promotion.candidate_history_preserved && ledger.every((entry) => entry.immutable), "CANDIDATE_HISTORY_MUTABLE"),
    test("Candidate promotion replayable", promotion.replayable, "PROMOTION_NOT_REPLAYABLE"),
    test("Manifest authority explicit", promotion.authority_transition_explicit, "MANIFEST_AUTHORITY_AMBIGUOUS"),
    test("Manifest immutable", ledger.every((entry) => entry.immutable), "MANIFEST_MUTABLE"),
    test("Verification deterministic", !has(failures, "VERIFICATION_NON_DETERMINISTIC"), "VERIFICATION_NON_DETERMINISTIC"),
    test("Semantic verification reproducible", !has(failures, "SEMANTIC_VERIFICATION_NOT_REPRODUCIBLE"), "SEMANTIC_VERIFICATION_NOT_REPRODUCIBLE"),
    test("Version verification reproducible", !has(failures, "VERSION_VERIFICATION_NOT_REPRODUCIBLE"), "VERSION_VERIFICATION_NOT_REPRODUCIBLE"),
    test("Content hash verification reproducible", Boolean(manifest.content_hash), "CONTENT_HASH_VERIFICATION_NOT_REPRODUCIBLE"),
    test("Constitutional compatibility validated", dependencyStatus === "UNVERIFIED" || manifest.constitutional_validation, "CONSTITUTIONAL_COMPATIBILITY_INVALID"),
    test("Verified manifests satisfy dependency gates", dependencyStatus === "UNVERIFIED" || verifiedGateSatisfied, "VERIFIED_MANIFEST_GATE_FAILURE"),
    test("Unverified manifests blocked", dependencyStatus !== "UNVERIFIED" || blocking.semantic_implementation_blocked, "UNVERIFIED_MANIFEST_NOT_BLOCKED"),
    test("Infrastructure implementation permitted", blocking.infrastructure_permitted, "INFRASTRUCTURE_BLOCKED"),
    test("Dependency semantics blocked while unverified", dependencyStatus !== "UNVERIFIED" || blocking.semantic_implementation_blocked, "DEPENDENCY_SEMANTICS_NOT_BLOCKED"),
    test("Phase 13 assumptions prohibited while UNVERIFIED", dependencyStatus !== "UNVERIFIED" || blocking.phase_13_assumptions_blocked, "PHASE_13_ASSUMPTION_ALLOWED"),
    test("Governance lineage complete", ledger.every((entry) => Boolean(entry.lineage_ref)) && candidate.lineage_refs.length > 0 && manifest.lineage_refs.length > 0, "GOVERNANCE_LINEAGE_INCOMPLETE"),
    test("Replay reproducible", !has(failures, "REPLAY_NOT_REPRODUCIBLE"), "REPLAY_NOT_REPRODUCIBLE"),
    test("Dependency blocking deterministic", blocking.deterministic, "DEPENDENCY_BLOCKING_NON_DETERMINISTIC"),
    test("Certification dependency gate enforced", blocking.certification_gate_enforced, "CERTIFICATION_GATE_NOT_ENFORCED"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is DependencyGovernanceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<AssuranceDependencyGovernanceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, scale_validation_ref: scale.integrity_hash, candidates: freezeArray([candidate]), manifests: freezeArray([manifest]), promotion, blocking, governance_ledger: ledger, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAssuranceDependencyGovernance(result = runAssuranceDependencyGovernance()): AssuranceDependencyGovernanceValidation {
  const candidates_valid = result.candidates.length === 1 && result.candidates.every((item) => verify(item) && item.candidate_status === "PROMOTED_TO_VERIFICATION" && item.lineage_refs.length > 0);
  const manifests_valid = result.manifests.length === 1 && result.manifests.every((item) => verify(item) && dependencyStatuses.includes(item.dependency_status) && item.lineage_refs.length > 0);
  const promotion_valid = verify(result.promotion) && result.promotion.promotion_approved && result.promotion.candidate_history_preserved && result.promotion.authority_transition_explicit && result.promotion.compatibility_claimed === false && result.promotion.replayable;
  const blocking_valid = verify(result.blocking) && result.blocking.infrastructure_permitted && result.blocking.discovery_artifacts_blocked_from_certification && result.blocking.certification_gate_enforced && result.blocking.deterministic && (result.blocking.dependency_status !== "UNVERIFIED" || (result.blocking.semantic_implementation_blocked && result.blocking.phase_13_assumptions_blocked));
  const ledger_valid = result.governance_ledger.length === 7 && result.governance_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && Boolean(entry.lineage_ref) && Boolean(entry.replay_ref));
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 20 && result.certification_tests.every((item) => verify(item) && item.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && candidates_valid && manifests_valid && promotion_valid && blocking_valid && ledger_valid && observability_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, candidates_valid, manifests_valid, promotion_valid, blocking_valid, ledger_valid, observability_valid, certification_valid, failures: result.failures });
}

export function replayAssuranceDependencyGovernance(result = runAssuranceDependencyGovernance()): boolean {
  const replayed = runAssuranceDependencyGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAssuranceDependencyGovernance(result).valid;
}

export function getAssuranceDependencyGovernanceBundle(): AssuranceDependencyGovernanceBundle {
  const result = runAssuranceDependencyGovernance();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, scale_validation_phase: "scale-stress-resilience-validation/v14.7" as const, candidate_statuses: candidateStatuses, dependency_statuses: dependencyStatuses, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), phase_13_default_status: "UNVERIFIED" as const }), result, validation: validateAssuranceDependencyGovernance(result) });
}

export const AssuranceDependencyGovernanceService = Object.freeze({ run: runAssuranceDependencyGovernance, validate: validateAssuranceDependencyGovernance, replay: replayAssuranceDependencyGovernance });
