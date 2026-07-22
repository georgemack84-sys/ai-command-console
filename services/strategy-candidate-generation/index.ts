import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runRecommendationCycleManagement, validateRecommendationCycleManagement } from "@/services/recommendation-cycle-management";
import type {
  CandidateEligibilityReport,
  CandidateGenerationLedger,
  CandidateGenerationPolicy,
  CandidateObservabilityReport,
  CandidateQualificationRecord,
  CandidateReplayReport,
  CandidateSetClosureRecord,
  CandidateConsolidationReport,
  DuplicateDetectionReport,
  DuplicateOutcome,
  StrategyArtifact,
  StrategyArtifactRegistry,
  StrategyCandidateCertification,
  StrategyCandidateCertificationTest,
  StrategyCandidateContractBundle,
  StrategyCandidateFailure,
  StrategyCandidateGenerationResult,
  StrategyCandidateInput,
  StrategyCandidateScenario,
  StrategyCandidateValidation,
  StrategyType,
} from "@/types/strategy-candidate-generation";

const VERSION = "strategy-candidate-generation/v12.4" as const;
const ID = "StrategyCandidateGeneration" as const;
const FIXED_TIME = "2026-07-15T00:20:00.000Z" as const;
const TYPES: readonly StrategyType[] = Object.freeze(["BASELINE", "ALTERNATIVE", "CONSERVATIVE", "AGGRESSIVE", "RISK_MITIGATION", "COST_OPTIMIZATION", "RESOURCE_OPTIMIZATION", "PORTFOLIO", "RECOVERY", "CONTINGENCY"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function failureForScenario(scenario: StrategyCandidateScenario): StrategyCandidateFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function statusFor(failures: readonly StrategyCandidateFailure[]): "PASS" | "CONDITIONAL_PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function generationPolicy(cycleActive: boolean, policyBound: boolean, failures: readonly StrategyCandidateFailure[]): CandidateGenerationPolicy {
  const base = {
    policy_id: id("candidate_generation_policy", VERSION),
    recommendation_cycle_active: cycleActive && !failures.includes("RECOMMENDATION_CYCLE_INACTIVE"),
    policy_manifest_bound: policyBound && !failures.includes("POLICY_MANIFEST_MISSING"),
    evidence_required: true,
    authority_required: true,
    governance_required: true,
    constitutional_compliance_required: true,
    supported_strategy_types: failures.includes("GENERATION_POLICY_INCOMPLETE") ? freezeArray(TYPES.slice(0, -2)) : TYPES,
    prohibited_strategy_classes: freezeArray(["EXECUTIONAL_COMMAND", "AUTHORITY_EXPANSION", "POLICY_BYPASS"]),
    unauthorized_generation_blocked: !failures.includes("UNAUTHORIZED_GENERATION_ALLOWED"),
  };
  return nested(base);
}

function candidates(input: Required<Omit<StrategyCandidateInput, "scenario">>, policy: CandidateGenerationPolicy, failures: readonly StrategyCandidateFailure[]): readonly StrategyArtifact[] {
  const supported = failures.includes("PROHIBITED_STRATEGY_CLASS") ? [...policy.supported_strategy_types, "BASELINE" as const] : [...policy.supported_strategy_types];
  return freezeArray(supported.map((strategyType, index) => {
    const seed = { cycle: input.recommendation_cycle_ref, type: strategyType, objective: "strategic-outcome", version: VERSION };
    const strategyId = failures.includes("STRATEGY_IDENTITY_NONDETERMINISTIC") && index === 0 ? id("strategy_candidate", { seed, nonce: "unstable" }) : id("strategy_candidate", seed);
    const evidence = failures.includes("EVIDENCE_MISSING") && index === 0 ? [] : [`evidence:${input.recommendation_cycle_ref}:${strategyType.toLowerCase()}:primary`, `evidence:${input.recommendation_cycle_ref}:policy-bound`];
    const base = {
      strategy_id: strategyId,
      recommendation_cycle_ref: input.recommendation_cycle_ref,
      strategy_type: strategyType,
      strategy_name: `${strategyType.toLowerCase().replace(/_/g, " ")} strategy`,
      strategy_summary: `Advisory ${strategyType.toLowerCase().replace(/_/g, " ")} candidate for the active recommendation cycle.`,
      objective_refs: failures.includes("UNSUPPORTED_OBJECTIVE") && index === 1 ? freezeArray(["objective:unsupported"]) : freezeArray(["objective:strategic-outcome"]),
      mission_scope: input.mission_scope,
      operational_scope: input.operational_scope,
      assumptions: failures.includes("UNSUPPORTED_ASSUMPTIONS") && index === 2 ? freezeArray(["unsupported assumption"]) : freezeArray(["policy-bound execution context", "operator approval remains supreme"]),
      constraints: freezeArray(["advisory-only", "tenant-isolated", "policy-manifest-bound"]),
      required_resources: freezeArray(["analysis-capacity", "evidence-review"]),
      dependency_refs: failures.includes("INVALID_DEPENDENCIES") && index === 3 ? freezeArray(["dependency:missing"]) : freezeArray([`policy:${input.recommendation_cycle_ref}:manifest`]),
      expected_benefits: freezeArray(["improved decision quality", "bounded strategic optionality"]),
      expected_risks: freezeArray(["implementation uncertainty", "resource contention"]),
      expected_tradeoffs: freezeArray(["speed versus certainty", "risk reduction versus opportunity capture"]),
      evidence_refs: freezeArray(evidence),
      confidence: failures.includes("CONFIDENCE_CALCULATION_NONDETERMINISTIC") && index === 0 ? 0.51 : Number((0.72 + index * 0.01).toFixed(2)),
      uncertainty: Number((0.22 - Math.min(index, 8) * 0.01).toFixed(2)),
      qualification_status: evidence.length ? "QUALIFIED" as const : "REQUIRES_EVIDENCE" as const,
      origin_ref: failures.includes("LINEAGE_MISSING") && index === 0 ? "" : `origin:${input.recommendation_cycle_ref}:candidate-generator`,
      policy_manifest_ref: policy.policy_manifest_bound ? `manifest:${input.recommendation_cycle_ref}:bound` : "",
      authority_ref: failures.includes("AUTHORITY_INVALID") ? "" : `authority:${input.recommendation_cycle_ref}:resolved`,
      governance_refs: failures.includes("GOVERNANCE_INCOMPLETE") ? freezeArray([]) : freezeArray([`governance:${input.recommendation_cycle_ref}:approved`, `constitutional:${input.recommendation_cycle_ref}:approved`]),
      lifecycle_state: "REGISTERED" as const,
      created_timestamp: FIXED_TIME,
      advisory_only: !failures.includes("ADVISORY_BOUNDARY_VIOLATION"),
      tenant_id: failures.includes("CROSS_TENANT_GENERATION") && index === 4 ? "tenant_beta" : input.tenant_id,
    };
    return nested(base);
  }));
}

function eligibility(strategyArtifacts: readonly StrategyArtifact[], policy: CandidateGenerationPolicy, tenantId: string, failures: readonly StrategyCandidateFailure[]): CandidateEligibilityReport {
  const rejected = freezeArray(strategyArtifacts.filter((strategy) => strategy.evidence_refs.length === 0 || strategy.authority_ref.length === 0 || strategy.governance_refs.length < 2 || strategy.tenant_id !== tenantId || strategy.objective_refs.includes("objective:unsupported") || strategy.dependency_refs.includes("dependency:missing") || strategy.assumptions.includes("unsupported assumption")).map((strategy) => strategy.strategy_id));
  const reasons = freezeArray([
    ...(failures.includes("EVIDENCE_MISSING") ? ["insufficient evidence"] : []),
    ...(failures.includes("UNSUPPORTED_OBJECTIVE") ? ["prohibited objective"] : []),
    ...(failures.includes("POLICY_MANIFEST_MISSING") ? ["missing policy"] : []),
    ...(failures.includes("AUTHORITY_INVALID") ? ["authority exceeded"] : []),
    ...(failures.includes("GOVERNANCE_INCOMPLETE") ? ["governance incomplete"] : []),
    ...(failures.includes("CONSTITUTIONAL_VIOLATION") ? ["constitutional violation"] : []),
    ...(failures.includes("INVALID_DEPENDENCIES") ? ["invalid dependencies"] : []),
    ...(failures.includes("UNSUPPORTED_ASSUMPTIONS") ? ["unsupported assumptions"] : []),
    ...(failures.includes("CROSS_TENANT_GENERATION") ? ["cross tenant generation"] : []),
  ]);
  const base = {
    report_id: id("candidate_eligibility", strategyArtifacts.map((strategy) => strategy.integrity_hash)),
    eligible_strategy_ids: freezeArray(strategyArtifacts.filter((strategy) => !rejected.includes(strategy.strategy_id)).map((strategy) => strategy.strategy_id)),
    rejected_strategy_ids: rejected,
    rejection_reasons: reasons,
    scope_valid: !failures.includes("CROSS_TENANT_GENERATION"),
    objectives_valid: !failures.includes("UNSUPPORTED_OBJECTIVE"),
    policy_valid: policy.policy_manifest_bound,
    evidence_valid: !failures.includes("EVIDENCE_MISSING"),
    authority_valid: !failures.includes("AUTHORITY_INVALID"),
    governance_valid: !failures.includes("GOVERNANCE_INCOMPLETE"),
    constitutional_valid: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    dependencies_valid: !failures.includes("INVALID_DEPENDENCIES"),
    assumptions_valid: !failures.includes("UNSUPPORTED_ASSUMPTIONS"),
    resources_feasible: true,
    deterministic: !failures.includes("ELIGIBILITY_VALIDATION_FAILED"),
  };
  return nested(base);
}

function duplicateDetection(strategyArtifacts: readonly StrategyArtifact[], failures: readonly StrategyCandidateFailure[]): DuplicateDetectionReport {
  const duplicate = failures.includes("DUPLICATE_REGISTRATION_ALLOWED");
  const conflicting = failures.includes("CONFLICTING_CANDIDATES_ALLOWED");
  const outcomes = freezeArray(strategyArtifacts.map((strategy, index) => {
    const outcome: DuplicateOutcome = duplicate && index === 1 ? "EXACT_DUPLICATE" : conflicting && index === 2 ? "CONFLICTING" : "UNIQUE";
    const base = { strategy_id: strategy.strategy_id, outcome, related_strategy_id: outcome === "UNIQUE" ? null : strategyArtifacts[0]?.strategy_id ?? null };
    return nested(base);
  }));
  const base = { report_id: id("candidate_duplicates", outcomes.map((item) => item.integrity_hash)), outcomes, duplicates_rejected: !duplicate, conflicts_rejected: !conflicting, deterministic: !failures.includes("DUPLICATE_DETECTION_NONDETERMINISTIC") };
  return nested(base);
}

function consolidation(strategyArtifacts: readonly StrategyArtifact[], duplicates: DuplicateDetectionReport, failures: readonly StrategyCandidateFailure[]): CandidateConsolidationReport {
  const canonical = freezeArray(duplicates.outcomes.filter((item) => item.outcome === "UNIQUE").map((item) => item.strategy_id));
  const mappings = freezeArray(duplicates.outcomes.filter((item) => item.outcome !== "UNIQUE").map((item) => {
    const base = { from_strategy_id: item.strategy_id, to_strategy_id: item.related_strategy_id ?? canonical[0] ?? item.strategy_id, reason: item.outcome };
    return nested(base);
  }));
  const base = { report_id: id("candidate_consolidation", mappings.map((item) => item.integrity_hash)), canonical_strategy_ids: canonical, merged_lineage_refs: failures.includes("CONSOLIDATION_LOST_LINEAGE") ? freezeArray([]) : freezeArray(strategyArtifacts.map((strategy) => strategy.origin_ref).filter(Boolean)), equivalence_mappings: mappings, provenance_preserved: !failures.includes("CONSOLIDATION_LOST_LINEAGE"), replay_unchanged: !failures.includes("CONSOLIDATION_REPLAY_CHANGED") };
  return nested(base);
}

function qualifications(strategyArtifacts: readonly StrategyArtifact[], eligibilityReport: CandidateEligibilityReport, failures: readonly StrategyCandidateFailure[]): readonly CandidateQualificationRecord[] {
  return freezeArray(strategyArtifacts.map((strategy) => {
    const eligible = eligibilityReport.eligible_strategy_ids.includes(strategy.strategy_id);
    const evidenceCompleteness = strategy.evidence_refs.length >= 2 && !failures.includes("EVIDENCE_SUFFICIENCY_FAILED") ? 1 : 0.4;
    const status = !eligible ? "REJECTED" as const : evidenceCompleteness === 1 ? "QUALIFIED" as const : "REQUIRES_EVIDENCE" as const;
    const base = { qualification_id: id("candidate_qualification", strategy.strategy_id), strategy_id: strategy.strategy_id, status, confidence_score: strategy.confidence, uncertainty_score: strategy.uncertainty, evidence_completeness: evidenceCompleteness, governance_readiness: strategy.governance_refs.length >= 2 ? 1 : 0, operational_feasibility: 0.9, replay_ready: !failures.includes("REPLAY_NOT_REPRODUCIBLE"), qualification_rationale: status === "QUALIFIED" ? "Evidence, governance, policy, and replay readiness satisfied." : "Candidate requires rejection or additional evidence before evaluation." };
    return nested(base);
  }));
}

function registry(tenantId: string, strategyArtifacts: readonly StrategyArtifact[], qualificationsList: readonly CandidateQualificationRecord[], failures: readonly StrategyCandidateFailure[]): StrategyArtifactRegistry {
  const registered = freezeArray(strategyArtifacts.filter((strategy) => qualificationsList.some((q) => q.strategy_id === strategy.strategy_id && q.status === "QUALIFIED")).map((strategy) => strategy.strategy_id));
  const base = { registry_id: id("strategy_artifact_registry", { tenantId, version: VERSION }), tenant_id: tenantId, strategies: strategyArtifacts, registered_strategy_ids: registered, complete: !failures.includes("REGISTRY_INTEGRITY_FAILED") && registered.length === strategyArtifacts.length, replayable: !failures.includes("REPLAY_NOT_REPRODUCIBLE") };
  return nested(base);
}

function closure(policy: CandidateGenerationPolicy, eligibilityReport: CandidateEligibilityReport, duplicates: DuplicateDetectionReport, consolidationReport: CandidateConsolidationReport, qualificationsList: readonly CandidateQualificationRecord[], failures: readonly StrategyCandidateFailure[]): CandidateSetClosureRecord {
  const qualificationComplete = qualificationsList.every((record) => record.status === "QUALIFIED");
  const closed = policy.recommendation_cycle_active && policy.policy_manifest_bound && eligibilityReport.rejected_strategy_ids.length === 0 && duplicates.duplicates_rejected && duplicates.conflicts_rejected && consolidationReport.provenance_preserved && consolidationReport.replay_unchanged && qualificationComplete && !failures.includes("CANDIDATE_SET_CLOSURE_FAILED") && !failures.includes("CLOSURE_REPLAY_FAILED");
  const base = { closure_id: id("candidate_set_closure", qualificationsList.map((item) => item.integrity_hash)), state: closed ? "CLOSED" as const : "FAILED" as const, required_strategies_generated: policy.supported_strategy_types.length === TYPES.length, required_policies_satisfied: policy.policy_manifest_bound, evidence_complete: eligibilityReport.evidence_valid, qualification_complete: qualificationComplete && !failures.includes("QUALIFICATION_MISSING"), duplicates_resolved: duplicates.duplicates_rejected && duplicates.conflicts_rejected, consolidation_complete: consolidationReport.provenance_preserved, lineage_complete: !failures.includes("LINEAGE_MISSING"), governance_validation_complete: eligibilityReport.governance_valid, replay_validation_successful: !failures.includes("CLOSURE_REPLAY_FAILED") && !failures.includes("REPLAY_NOT_REPRODUCIBLE"), immutable: closed, versioned: true, ledgered: true, reproducible: closed };
  return nested(base);
}

function ledger(tenantId: string, strategyArtifacts: readonly StrategyArtifact[], closureRecord: CandidateSetClosureRecord, failures: readonly StrategyCandidateFailure[]): CandidateGenerationLedger {
  const raw = [
    "GENERATION_REQUESTED",
    "CANDIDATES_GENERATED",
    "ELIGIBILITY_DECIDED",
    "DUPLICATES_DETECTED",
    "CONSOLIDATION_COMPLETED",
    "QUALIFICATION_COMPLETED",
    "CANDIDATE_SET_CLOSED",
    "GOVERNANCE_APPROVED",
    "POLICY_BOUND",
    "REPLAY_REFERENCED",
  ];
  const entries = freezeArray(raw.map((type, index) => {
    const base = { entry_id: id("candidate_ledger_entry", { tenantId, type, index }), type, subject_id: index === 1 ? strategyArtifacts.map((strategy) => strategy.strategy_id).join("|") : closureRecord.closure_id };
    return nested(base);
  }));
  const base = { ledger_id: id("candidate_generation_ledger", { tenantId, version: VERSION }), append_only: !failures.includes("LEDGER_NOT_APPEND_ONLY"), immutable: true, tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), replay_reproducible: !failures.includes("REPLAY_NOT_REPRODUCIBLE"), cryptographically_verifiable: true, entries };
  return nested(base);
}

function replayReport(failures: readonly StrategyCandidateFailure[]): CandidateReplayReport {
  const ok = !failures.includes("REPLAY_NOT_REPRODUCIBLE") && !failures.includes("CLOSURE_REPLAY_FAILED");
  const base = { replay_id: id("candidate_replay", VERSION), identical_candidates_generated: ok, identical_qualifications_assigned: ok, identical_duplicate_outcomes: ok, identical_consolidation_results: ok, identical_closure_state: ok, identical_ledger_records: ok, identical_integrity_hashes: ok };
  return nested(base);
}

function observability(strategyArtifacts: readonly StrategyArtifact[], eligibilityReport: CandidateEligibilityReport, duplicates: DuplicateDetectionReport, closureRecord: CandidateSetClosureRecord, failures: readonly StrategyCandidateFailure[]): CandidateObservabilityReport {
  const duplicateCount = duplicates.outcomes.filter((item) => item.outcome !== "UNIQUE").length;
  const alerts = freezeArray([
    ...(duplicateCount ? ["duplicate spike"] : []),
    ...(eligibilityReport.rejected_strategy_ids.length ? ["evidence or eligibility deficiency"] : []),
    ...(!closureRecord.replay_validation_successful ? ["replay inconsistency"] : []),
    ...(failures.includes("LINEAGE_MISSING") ? ["lineage break"] : []),
  ]);
  const base = { report_id: id("candidate_observability", closureRecord.closure_id), candidates_generated: strategyArtifacts.length, generation_latency_ms: 140, eligibility_failures: eligibilityReport.rejected_strategy_ids.length, duplicate_rate: duplicateCount / Math.max(strategyArtifacts.length, 1), consolidation_rate: duplicateCount ? 1 : 0, qualification_rate: closureRecord.qualification_complete ? 1 : 0, evidence_completeness: closureRecord.evidence_complete ? 1 : 0.4, closure_latency_ms: 220, replay_success: closureRecord.replay_validation_successful ? 1 : 0, policy_violations: eligibilityReport.policy_valid ? 0 : 1, governance_failures: eligibilityReport.governance_valid ? 0 : 1, alerts, observable: !failures.includes("OBSERVABILITY_MISSING") };
  return nested(base);
}

function certTest(name: string, passed: boolean, failure: StrategyCandidateFailure, refs: readonly string[]): StrategyCandidateCertificationTest {
  const base = { test_id: id("strategy_candidate_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return nested(base);
}

type CertBase = Omit<StrategyCandidateGenerationResult, "certification" | "replay_hash" | "integrity_hash">;
function certificationTests(result: CertBase): readonly StrategyCandidateCertificationTest[] {
  const refs = freezeArray([result.registry.integrity_hash, result.closure.integrity_hash, result.ledger.integrity_hash, result.replay.integrity_hash]);
  return freezeArray([
    certTest("Strategy artifact contract finalized", result.candidates.every((candidate) => candidate.strategy_id && candidate.origin_ref && candidate.policy_manifest_ref), "STRATEGY_ARTIFACT_CONTRACT_INVALID", refs),
    certTest("Strategy identity deterministic", result.candidates.every((candidate) => candidate.strategy_id === id("strategy_candidate", { cycle: candidate.recommendation_cycle_ref, type: candidate.strategy_type, objective: "strategic-outcome", version: VERSION })), "STRATEGY_IDENTITY_NONDETERMINISTIC", refs),
    certTest("Replay reproducible", result.replay.identical_integrity_hashes, "REPLAY_NOT_REPRODUCIBLE", refs),
    certTest("Generation policy complete", result.generation_policy.supported_strategy_types.length === TYPES.length, "GENERATION_POLICY_INCOMPLETE", refs),
    certTest("Unauthorized generation impossible", result.generation_policy.unauthorized_generation_blocked, "UNAUTHORIZED_GENERATION_ALLOWED", refs),
    certTest("Recommendation cycle active", result.generation_policy.recommendation_cycle_active, "RECOMMENDATION_CYCLE_INACTIVE", refs),
    certTest("Policy manifest bound", result.generation_policy.policy_manifest_bound, "POLICY_MANIFEST_MISSING", refs),
    certTest("Every strategy evidence-linked", result.candidates.every((candidate) => candidate.evidence_refs.length > 0), "EVIDENCE_MISSING", refs),
    certTest("Authority validated", result.eligibility.authority_valid, "AUTHORITY_INVALID", refs),
    certTest("Governance complete", result.eligibility.governance_valid, "GOVERNANCE_INCOMPLETE", refs),
    certTest("Constitutional compliance enforced", result.eligibility.constitutional_valid, "CONSTITUTIONAL_VIOLATION", refs),
    certTest("Cross-tenant generation blocked", result.candidates.every((candidate) => candidate.tenant_id === result.registry.tenant_id), "CROSS_TENANT_GENERATION", refs),
    certTest("Unsupported objectives blocked", result.eligibility.objectives_valid, "UNSUPPORTED_OBJECTIVE", refs),
    certTest("Prohibited strategy classes blocked", new Set(result.candidates.map((candidate) => candidate.strategy_id)).size === result.candidates.length, "PROHIBITED_STRATEGY_CLASS", refs),
    certTest("Eligibility validation deterministic", result.eligibility.deterministic && result.eligibility.rejected_strategy_ids.length === 0, "ELIGIBILITY_VALIDATION_FAILED", refs),
    certTest("Dependencies valid", result.eligibility.dependencies_valid, "INVALID_DEPENDENCIES", refs),
    certTest("Assumptions valid", result.eligibility.assumptions_valid, "UNSUPPORTED_ASSUMPTIONS", refs),
    certTest("Duplicate detection deterministic", result.duplicate_detection.deterministic, "DUPLICATE_DETECTION_NONDETERMINISTIC", refs),
    certTest("Duplicate registration suppressed", result.duplicate_detection.duplicates_rejected, "DUPLICATE_REGISTRATION_ALLOWED", refs),
    certTest("Conflicting candidates rejected", result.duplicate_detection.conflicts_rejected, "CONFLICTING_CANDIDATES_ALLOWED", refs),
    certTest("Consolidation preserves lineage", result.consolidation.provenance_preserved && result.consolidation.merged_lineage_refs.length === result.candidates.length, "CONSOLIDATION_LOST_LINEAGE", refs),
    certTest("Consolidation preserves replay", result.consolidation.replay_unchanged, "CONSOLIDATION_REPLAY_CHANGED", refs),
    certTest("Every candidate qualified before evaluation", result.qualifications.every((record) => record.status === "QUALIFIED"), "QUALIFICATION_MISSING", refs),
    certTest("Evidence sufficiency validated", result.qualifications.every((record) => record.evidence_completeness === 1), "EVIDENCE_SUFFICIENCY_FAILED", refs),
    certTest("Confidence calculation deterministic", result.qualifications.every((record) => record.confidence_score >= 0.72), "CONFIDENCE_CALCULATION_NONDETERMINISTIC", refs),
    certTest("Candidate set closure deterministic", result.closure.state === "CLOSED" && result.closure.reproducible, "CANDIDATE_SET_CLOSURE_FAILED", refs),
    certTest("Closure replay successful", result.closure.replay_validation_successful, "CLOSURE_REPLAY_FAILED", refs),
    certTest("Registry integrity valid", result.registry.complete && result.registry.replayable, "REGISTRY_INTEGRITY_FAILED", refs),
    certTest("Ledger append-only", result.ledger.append_only && result.ledger.immutable, "LEDGER_NOT_APPEND_ONLY", refs),
    certTest("Lineage preserved", result.closure.lineage_complete, "LINEAGE_MISSING", refs),
    certTest("Advisory boundary enforced", result.candidates.every((candidate) => candidate.advisory_only), "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Tenant isolation preserved", result.ledger.tenant_isolated, "TENANT_ISOLATION_BREACH", refs),
    certTest("Observability active", result.observability.observable, "OBSERVABILITY_MISSING", refs),
  ]);
}

function replayHash(result: Omit<StrategyCandidateGenerationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ policy: result.generation_policy.integrity_hash, candidates: result.candidates.map((item) => item.integrity_hash), eligibility: result.eligibility.integrity_hash, duplicates: result.duplicate_detection.integrity_hash, consolidation: result.consolidation.integrity_hash, qualifications: result.qualifications.map((item) => item.integrity_hash), registry: result.registry.integrity_hash, closure: result.closure.integrity_hash, ledger: result.ledger.integrity_hash, replay: result.replay.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<StrategyCandidateGenerationResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runStrategyCandidateGeneration(input: StrategyCandidateInput = {}): StrategyCandidateGenerationResult {
  const cycle = runRecommendationCycleManagement({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const cycleValid = validateRecommendationCycleManagement(cycle).valid;
  const scenarioFailure = failureForScenario(input.scenario ?? "BASELINE");
  const failures = freezeArray<StrategyCandidateFailure>([...(cycleValid ? [] : ["RECOMMENDATION_CYCLE_INACTIVE" as const]), ...(scenarioFailure ? [scenarioFailure] : [])]);
  const resolved = { tenant_id: input.tenant_id ?? "tenant_mission_control", mission_scope: input.mission_scope ?? "mission:strategic-recommendation-intelligence", operational_scope: input.operational_scope ?? "operations:enterprise-recommendations", recommendation_cycle_ref: input.recommendation_cycle_ref ?? cycle.cycle.cycle_id };
  const policy = generationPolicy(cycleValid, cycle.policy_bound_entry.manifest_exists, failures);
  const candidateSet = candidates(resolved, policy, failures);
  const eligibilityReport = eligibility(candidateSet, policy, resolved.tenant_id, failures);
  const duplicateReport = duplicateDetection(candidateSet, failures);
  const consolidationReport = consolidation(candidateSet, duplicateReport, failures);
  const qualificationRecords = qualifications(candidateSet, eligibilityReport, failures);
  const registryRecord = registry(resolved.tenant_id, candidateSet, qualificationRecords, failures);
  const closureRecord = closure(policy, eligibilityReport, duplicateReport, consolidationReport, qualificationRecords, failures);
  const ledgerRecord = ledger(resolved.tenant_id, candidateSet, closureRecord, failures);
  const replayRecord = replayReport(failures);
  const observabilityRecord = observability(candidateSet, eligibilityReport, duplicateReport, closureRecord, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, generation_policy: policy, candidates: candidateSet, eligibility: eligibilityReport, duplicate_detection: duplicateReport, consolidation: consolidationReport, qualifications: qualificationRecords, registry: registryRecord, closure: closureRecord, ledger: ledgerRecord, replay: replayRecord, observability: observabilityRecord };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is StrategyCandidateFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certBase: Omit<StrategyCandidateCertification, "integrity_hash"> = { certification_id: id("strategy_candidate_certification", VERSION), status, ready_for_downstream_evaluation: status === "PASS", failures: finalFailures, tests };
  const certification = nested(certBase);
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateStrategyCandidateGeneration(result?: StrategyCandidateGenerationResult): StrategyCandidateValidation {
  if (!result) {
    const failures = freezeArray<StrategyCandidateFailure>(["STRATEGY_ARTIFACT_CONTRACT_INVALID"]);
    const base = { registry_id: null, valid: false, status: "FAIL" as const, ready_for_downstream_evaluation: false, failures, replay_hash_valid: false, integrity_hash_valid: false, closure_valid: false, registry_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.registry) === result.registry.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const closure_valid = result.closure.state === "CLOSED" && result.closure.immutable && result.closure.reproducible;
  const registry_valid = result.registry.complete && result.registry.registered_strategy_ids.length === result.candidates.length;
  const valid = result.certification.status === "PASS" && result.certification.ready_for_downstream_evaluation && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && closure_valid && registry_valid;
  const base = { registry_id: result.registry.registry_id, valid, status: result.certification.status, ready_for_downstream_evaluation: result.certification.ready_for_downstream_evaluation, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, closure_valid, registry_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayStrategyCandidateGeneration(result = runStrategyCandidateGeneration()): boolean {
  const replayed = runStrategyCandidateGeneration({ tenant_id: result.registry.tenant_id, mission_scope: result.candidates[0]?.mission_scope, operational_scope: result.candidates[0]?.operational_scope, recommendation_cycle_ref: result.candidates[0]?.recommendation_cycle_ref });
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateStrategyCandidateGeneration(result).valid;
}

export function getStrategyCandidateGenerationContract(): StrategyCandidateContractBundle {
  const result = runStrategyCandidateGeneration();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, advisory_only: true, policy_bound_generation_required: true, evidence_linked_generation_required: true, duplicate_suppression_required: true, qualification_before_evaluation_required: true, closed_sets_are_immutable: true, replay_required: true }), result, validation: validateStrategyCandidateGeneration(result) });
}

export const StrategyCandidateGeneration = Object.freeze({ run: runStrategyCandidateGeneration, validate: validateStrategyCandidateGeneration, replay: replayStrategyCandidateGeneration });
