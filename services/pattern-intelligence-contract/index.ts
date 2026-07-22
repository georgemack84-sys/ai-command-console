import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyRecommendationEffectiveness, replayRecommendationEffectivenessCertification } from "@/services/recommendation-effectiveness-certification-gate";
import type { RecommendationEffectivenessCertificationInput, RecommendationEffectivenessCertificationGateResult } from "@/types/recommendation-effectiveness-certification-gate";
import type {
  ConfidenceRules,
  PatternContract,
  PatternContractApiSurface,
  PatternContractFailure,
  PatternContractFoundation,
  PatternContractInput,
  PatternContractResult,
  PatternContractValidation,
  PatternDetectionSchema,
  PatternEvidenceSource,
  PatternIdentity,
  PatternLifecycleState,
  PatternType,
  RecurrenceWindowRule,
} from "@/types/pattern-intelligence-contract";

const PATTERN_CONTRACT_VERSION = "pattern-intelligence-contract/v1" as const;

export const SUPPORTED_PATTERN_TYPES: readonly PatternType[] = Object.freeze([
  "RECOMMENDATION_FAILURE_PATTERN",
  "RECOMMENDATION_SUCCESS_PATTERN",
  "RISK_UNDERESTIMATION_PATTERN",
  "RISK_OVERESTIMATION_PATTERN",
  "CONFIDENCE_DRIFT_PATTERN",
  "GOVERNANCE_BLOCKER_PATTERN",
  "OPERATOR_OVERRIDE_PATTERN",
  "EVIDENCE_GAP_PATTERN",
  "MISSION_BOTTLENECK_PATTERN",
  "DEPENDENCY_CONFLICT_PATTERN",
  "SIMULATION_ERROR_PATTERN",
  "ROLLBACK_PATTERN",
  "STRATEGIC_OPPORTUNITY_PATTERN",
]);

export const ALLOWED_PATTERN_EVIDENCE_SOURCES: readonly PatternEvidenceSource[] = Object.freeze([
  "DECISION_HISTORY",
  "RECOMMENDATION_HISTORY",
  "OUTCOME_RECORDS",
  "OUTCOME_NORMALIZATION",
  "RECOMMENDATION_EFFECTIVENESS_ANALYSIS",
  "RISK_ACTUALIZATION",
  "CONFIDENCE_ACTUALIZATION",
  "GOVERNANCE_OUTCOMES",
  "OPERATOR_FEEDBACK",
  "SIMULATION_RESULTS",
  "REPLAY_RECORDS",
  "TRUTH_LEDGER",
  "PATTERN_LEDGER",
]);

type Scenario = NonNullable<PatternContractInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): RecommendationEffectivenessCertificationInput["scenario"] {
  const map: Partial<Record<Scenario, RecommendationEffectivenessCertificationInput["scenario"]>> = {
    PHASE_10_3_NOT_CERTIFIED: "PRODUCTION_READINESS_GAP",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
    MISSING_REPLAY: "REPLAY_MISMATCH",
    REPLAY_DIVERGENCE: "REPLAY_MISMATCH",
    HASH_MISMATCH: "INTEGRITY_FAILURE",
    CROSS_TENANT: "CROSS_TENANT",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternContractInput, scenario: Scenario): RecommendationEffectivenessCertificationGateResult {
  if (input.certification) return input.certification;
  return certifyRecommendationEffectiveness({ scenario: sourceScenario(scenario) });
}

function recurrenceRule(): RecurrenceWindowRule {
  return Object.freeze({
    rule_id: "pattern_recurrence_rule_v1",
    minimum_observations: 3,
    recurrence_window_days: 90,
    minimum_frequency: 0.3,
    temporal_consistency_required: true,
    deterministic_grouping: true,
  });
}

function confidenceRules(): ConfidenceRules {
  return Object.freeze({
    evidence_weight: 0.3,
    recurrence_weight: 0.25,
    statistical_weight: 0.2,
    governance_weight: 0.15,
    strategic_weight: 0.1,
    minimum_overall_confidence: 0.65,
    randomness_allowed: false,
  });
}

function buildApiSurface(): PatternContractApiSurface {
  const base: Omit<PatternContractApiSurface, "integrity_hash"> = {
    api_id: "pattern_intelligence_contract_api",
    load_contract: "GET /pattern-intelligence-contract/contract",
    validate_contract: "POST /pattern-intelligence-contract/validate",
    validate_schema: "POST /pattern-intelligence-contract/schema",
    validate_replay: "POST /pattern-intelligence-contract/replay",
    validate_governance: "POST /pattern-intelligence-contract/governance",
    generate_identity: "POST /pattern-intelligence-contract/identity",
    update_supported: false,
    delete_supported: false,
    autonomous_learning_supported: false,
    cross_tenant_learning_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function evidenceSources(input: PatternContractInput, scenario: Scenario): readonly PatternEvidenceSource[] {
  if (scenario === "MISSING_EVIDENCE") return freezeArray([]);
  if (scenario === "UNSUPPORTED_EVIDENCE") return freezeArray(["DECISION_HISTORY", "TRUTH_LEDGER"]);
  return input.evidence_sources ?? freezeArray(["DECISION_HISTORY", "RECOMMENDATION_HISTORY", "OUTCOME_RECORDS", "RECOMMENDATION_EFFECTIVENESS_ANALYSIS", "REPLAY_RECORDS", "TRUTH_LEDGER"]);
}

function buildContract(scenario: Scenario): PatternContract {
  const base: Omit<PatternContract, "integrity_hash"> = {
    contract_id: "pattern_intelligence_contract",
    contract_version: PATTERN_CONTRACT_VERSION,
    contract_status: scenario === "MISSING_EVIDENCE" ? "PENDING_EVIDENCE" : scenario === "FAIL_OPEN" ? "FAILED" : "ACTIVE",
    supported_pattern_types: SUPPORTED_PATTERN_TYPES,
    minimum_support_threshold: 3,
    minimum_recurrence_threshold: 3,
    recurrence_window_rules: recurrenceRule(),
    confidence_rules: confidenceRules(),
    evidence_rules: ALLOWED_PATTERN_EVIDENCE_SOURCES,
    governance_rules: freezeArray(["governance review required", "authority boundaries enforced", "policy compliance required"]),
    constitutional_rules: freezeArray(["advisory-only", "no autonomous learning", "no autonomous execution", "no hidden optimization", "tenant isolation"]),
    replay_requirements: freezeArray(["detection inputs", "recurrence calculations", "confidence calculations", "evidence selection", "governance evaluation", "classification decisions"]),
    replay_validation_rules: freezeArray(["identical identity", "identical evidence", "identical confidence", "identical classification", "identical governance outcome"]),
    operator_visibility_rules: freezeArray(["pattern summaries", "evidence", "recurrence history", "confidence calculations", "governance findings", "explanations", "replay timelines"]),
    explainability_rules: freezeArray(["why detected", "evidence used", "recurrence calculations", "confidence calculations", "governance findings", "strategic significance", "recommended operator action"]),
    tenant_isolation_rules: freezeArray(["tenant evidence isolation", "tenant replay isolation", "cross-tenant learning prohibited"]),
    mission_scope_rules: freezeArray(["mission-scoped grouping", "mission lineage preserved"]),
    advisory_only: true,
    fail_closed: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSchema(pattern_type: PatternType, evidence: readonly PatternEvidenceSource[], scenario: Scenario): PatternDetectionSchema {
  const base: Omit<PatternDetectionSchema, "integrity_hash"> = {
    schema_version: "pattern-detection-schema/v1",
    pattern_type,
    evidence_requirements: scenario === "UNSUPPORTED_EVIDENCE" ? freezeArray([...evidence, "PATTERN_LEDGER"]) : evidence,
    recurrence_requirements: recurrenceRule(),
    confidence_requirements: confidenceRules(),
    governance_requirements: freezeArray(["governance review", "constitutional boundary check", "authority validation"]),
    replay_requirements: freezeArray(["evidence replay", "decision replay", "outcome replay", "confidence replay", "governance replay"]),
    validation_requirements: freezeArray(["evidence sufficiency", "recurrence threshold", "confidence threshold", "tenant isolation", "operator visibility"]),
    explainability_requirements: freezeArray(["existence rationale", "evidence explanation", "confidence explanation", "governance explanation"]),
    integrity_requirements: freezeArray(["immutable identity", "deterministic hash", "lineage verification"]),
  };
  const schema = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...schema, integrity_hash: hash({ tampered: schema.pattern_type }) });
  return schema;
}

function lifecycleState(scenario: Scenario): PatternLifecycleState {
  return scenario === "INVALID_TRANSITION" ? "ACTIVE" : "CANDIDATE";
}

function buildIdentity(certification: RecommendationEffectivenessCertificationGateResult, pattern_type: PatternType, evidence: readonly PatternEvidenceSource[], scenario: Scenario): PatternIdentity {
  const ledger = certification.performance_ledger.performance_record;
  const recurrence = scenario === "LOW_RECURRENCE" ? 2 : 3;
  const confidence = scenario === "CONFIDENCE_FAILURE" ? 0 : 0.82;
  const base: Omit<PatternIdentity, "integrity_hash"> = {
    pattern_id: `pattern_${hash(`${ledger.tenant_id}:${pattern_type}:${evidence.join(":")}:${recurrence}:${certification.replay_hash}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${ledger.tenant_id}:foreign` : ledger.tenant_id,
    pattern_type,
    lifecycle_state: lifecycleState(scenario),
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...ledger.evidence_refs, ...evidence]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : ledger.replay_refs,
    lineage_refs: ledger.lineage_refs,
    recurrence_observations: recurrence,
    confidence_score: confidence,
    immutable: true,
  };
  const identity = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "IDENTITY_MUTATION") return Object.freeze({ ...identity, pattern_id: `${identity.pattern_id}:mutated`, integrity_hash: identity.integrity_hash });
  return identity;
}

function collectFailures(certification: RecommendationEffectivenessCertificationGateResult, contract: PatternContract, schema: PatternDetectionSchema, identity: PatternIdentity, scenario: Scenario): readonly PatternContractFailure[] {
  const failures: PatternContractFailure[] = [];
  if (scenario === "PHASE_10_3_NOT_CERTIFIED" || certification.certification.certification_result !== "PASS") failures.push("PHASE_10_3_CERTIFICATION_REQUIRED");
  if (scenario === "UNSUPPORTED_PATTERN" || !SUPPORTED_PATTERN_TYPES.includes(schema.pattern_type)) failures.push("UNSUPPORTED_PATTERN_TYPE");
  if (scenario === "UNSUPPORTED_EVIDENCE" || schema.evidence_requirements.some((source) => !ALLOWED_PATTERN_EVIDENCE_SOURCES.includes(source))) failures.push("UNSUPPORTED_EVIDENCE_SOURCE");
  if (scenario === "MISSING_EVIDENCE" || !identity.evidence_refs.length) failures.push("MANDATORY_EVIDENCE_MISSING");
  if (scenario === "LOW_RECURRENCE" || identity.recurrence_observations < contract.minimum_recurrence_threshold) failures.push("RECURRENCE_THRESHOLD_NOT_MET");
  if (scenario === "CONFIDENCE_FAILURE" || identity.confidence_score < contract.confidence_rules.minimum_overall_confidence) failures.push("CONFIDENCE_CALCULATION_FAILED");
  if (scenario === "GOVERNANCE_FAILURE") failures.push("GOVERNANCE_REVIEW_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_RULE_VIOLATED");
  if (scenario === "MISSING_REPLAY" || !identity.replay_refs.length) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "REPLAY_DIVERGENCE" || !replayRecommendationEffectivenessCertification(certification)) failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(schema) !== schema.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "CROSS_TENANT" || identity.tenant_id !== certification.certification.tenant_id) failures.push("TENANT_BOUNDARY_VIOLATED");
  if (scenario === "OPERATOR_VISIBILITY_GAP") failures.push("OPERATOR_VISIBILITY_INCOMPLETE");
  if (scenario === "INVALID_TRANSITION") failures.push("INVALID_LIFECYCLE_TRANSITION");
  if (scenario === "IDENTITY_MUTATION" || hashWithoutIntegrity(identity) !== identity.integrity_hash) failures.push("IDENTITY_MUTATION_DETECTED");
  if (scenario === "AUTONOMOUS_LEARNING") failures.push("AUTONOMOUS_LEARNING_DETECTED");
  if (scenario === "HIDDEN_INTELLIGENCE") failures.push("HIDDEN_INTELLIGENCE_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(contract: PatternContract, schema: PatternDetectionSchema, identity: PatternIdentity, failures: readonly PatternContractFailure[]): PatternContractValidation {
  const contractVerified = hashWithoutIntegrity(contract) === contract.integrity_hash;
  const schemaVerified = hashWithoutIntegrity(schema) === schema.integrity_hash;
  const identityVerified = hashWithoutIntegrity(identity) === identity.integrity_hash;
  const base: Omit<PatternContractValidation, "integrity_hash"> = {
    validation_id: "pattern_intelligence_contract_validation",
    valid: failures.length === 0 && contractVerified && schemaVerified && identityVerified,
    failures,
    schema_valid: !failures.includes("UNSUPPORTED_PATTERN_TYPE") && !failures.includes("UNSUPPORTED_EVIDENCE_SOURCE"),
    identity_immutable: !failures.includes("IDENTITY_MUTATION_DETECTED"),
    evidence_sufficient: !failures.includes("MANDATORY_EVIDENCE_MISSING"),
    recurrence_valid: !failures.includes("RECURRENCE_THRESHOLD_NOT_MET"),
    confidence_calculable: !failures.includes("CONFIDENCE_CALCULATION_FAILED"),
    governance_validated: !failures.includes("GOVERNANCE_REVIEW_FAILED") && !failures.includes("CONSTITUTIONAL_RULE_VIOLATED"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_RECONSTRUCTION_FAILED"),
    operator_visible: !failures.includes("OPERATOR_VISIBILITY_INCOMPLETE") && !failures.includes("HIDDEN_INTELLIGENCE_DETECTED"),
    tenant_isolated: !failures.includes("TENANT_BOUNDARY_VIOLATED"),
    advisory_only: contract.advisory_only && !failures.includes("AUTONOMOUS_LEARNING_DETECTED"),
    integrity_verified: contractVerified && schemaVerified && identityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    contract: result.contract,
    schema: result.schema,
    identity: result.identity,
    validation: result.validation,
    certification_replay_hash: result.certification.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<PatternContractResult, "integrity_hash">): string {
  return hash({
    pattern_intelligence_contract_version: result.pattern_intelligence_contract_version,
    api_surface_hash: result.api_surface.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    schema_hash: result.schema.integrity_hash,
    identity_hash: result.identity.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    certification_hash: result.certification.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    governance_first: result.governance_first,
    autonomous_learning: result.autonomous_learning,
    autonomous_execution: result.autonomous_execution,
  });
}

export function validatePatternIntelligenceContract(input: PatternContractInput = {}): PatternContractResult {
  const scenario = input.scenario ?? "BASELINE";
  const certification = sourceForScenario(input, scenario);
  const pattern_type = scenario === "UNSUPPORTED_PATTERN" ? "RECOMMENDATION_FAILURE_PATTERN" : input.pattern_type ?? "RECOMMENDATION_FAILURE_PATTERN";
  const evidence = evidenceSources(input, scenario);
  const api_surface = buildApiSurface();
  const contract = buildContract(scenario);
  const schema = buildSchema(pattern_type, evidence, scenario);
  const identity = buildIdentity(certification, pattern_type, evidence, scenario);
  const failures = collectFailures(certification, contract, schema, identity, scenario);
  const validation = buildValidation(contract, schema, identity, failures);
  const base: Omit<PatternContractResult, "integrity_hash" | "replay_hash"> = {
    pattern_intelligence_contract_version: PATTERN_CONTRACT_VERSION,
    certification,
    api_surface,
    contract,
    schema,
    identity,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    governance_first: true,
    autonomous_learning: false,
    autonomous_execution: false,
    modifies_recommendations: false,
    modifies_priorities: false,
    modifies_confidence: false,
    modifies_governance_policy: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternIntelligenceContract(result: PatternContractResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayRecommendationEffectivenessCertification(result.certification);
}

export function computePatternIdentityHash(identity: Omit<PatternIdentity, "integrity_hash"> | PatternIdentity): string {
  return hashWithoutIntegrity(identity);
}

export function getPatternIntelligenceContractFoundation(): PatternContractFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_intelligence_contract_version: PATTERN_CONTRACT_VERSION,
    supported_pattern_types: SUPPORTED_PATTERN_TYPES,
    evidence_sources: ALLOWED_PATTERN_EVIDENCE_SOURCES,
    api_surface,
    result: validatePatternIntelligenceContract(),
  });
}

export const PatternIntelligenceContract = Object.freeze({
  validate: validatePatternIntelligenceContract,
  replay: replayPatternIntelligenceContract,
});
