import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  RiskAdaptationApiSurface,
  RiskAdaptationContract,
  RiskAdaptationFailure,
  RiskAdaptationFoundation,
  RiskAdaptationFoundationResult,
  RiskAdaptationInput,
  RiskAdaptationLifecycle,
  RiskAdaptationLifecycleState,
  RiskAdaptationValidation,
  RiskRecommendationPipeline,
  RiskReplayFramework,
  RiskAdaptationRecommendationType,
} from "@/types/risk-adaptation-engine-foundation";

const RISK_ADAPTATION_VERSION = "risk-adaptation-engine-foundation/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<RiskAdaptationInput["scenario"]>;

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

function buildApiSurface(): RiskAdaptationApiSurface {
  const base: Omit<RiskAdaptationApiSurface, "integrity_hash"> = {
    api_id: "risk_adaptation_engine_foundation_api",
    analyze_foundation: "POST /risk-adaptation-engine-foundation/analyze",
    retrieve_lifecycle: "POST /risk-adaptation-engine-foundation/lifecycle",
    retrieve_pipeline: "POST /risk-adaptation-engine-foundation/pipeline",
    retrieve_validation: "POST /risk-adaptation-engine-foundation/validation",
    retrieve_state_machine: "POST /risk-adaptation-engine-foundation/state-machine",
    retrieve_replay_framework: "POST /risk-adaptation-engine-foundation/replay-framework",
    retrieve_recommendations: "POST /risk-adaptation-engine-foundation/recommendations",
    retrieve_governance: "POST /risk-adaptation-engine-foundation/governance",
    retrieve_observability: "POST /risk-adaptation-engine-foundation/observability",
    replay_analysis: "POST /risk-adaptation-engine-foundation/replay",
    retrieve_contract: "GET /risk-adaptation-engine-foundation/contract",
    update_supported: false,
    delete_supported: false,
    production_risk_mutation_supported: false,
    automatic_risk_update_supported: false,
    governance_bypass_supported: false,
    simulation_bypass_supported: false,
    operator_bypass_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function recommendationFor(scenario: Scenario): RiskAdaptationRecommendationType {
  const map: Partial<Record<Scenario, RiskAdaptationRecommendationType>> = {
    SEVERITY: "SEVERITY_ADJUSTMENT",
    PROBABILITY: "PROBABILITY_ADJUSTMENT",
    ESCALATION: "ESCALATION_REFINEMENT",
    ROLLBACK: "ROLLBACK_REFINEMENT",
    GOVERNANCE: "GOVERNANCE_ESCALATION",
    MONITORING: "ADDITIONAL_MONITORING",
    EVIDENCE: "EVIDENCE_IMPROVEMENT",
    CLASSIFICATION: "RISK_CLASSIFICATION_REFINEMENT",
    DOCUMENTATION: "DOCUMENTATION_IMPROVEMENT",
    SIMULATION: "SIMULATION_REQUIREMENT",
  };
  return map[scenario] ?? "SEVERITY_ADJUSTMENT";
}

function stateForScenario(scenario: Scenario): RiskAdaptationLifecycleState {
  if (scenario === "APPROVED") return "APPROVED";
  if (scenario === "REJECTED") return "REJECTED";
  if (scenario === "CERTIFIED") return "CERTIFIED";
  if (scenario === "MISSING_EVIDENCE") return "OBSERVED";
  return "VALIDATED";
}

function buildContract(scenario: Scenario): RiskAdaptationContract {
  const recommendation = recommendationFor(scenario);
  const base: Omit<RiskAdaptationContract, "integrity_hash"> = {
    adaptation_id: scenario === "MISSING_SCHEMA" ? "" : `risk_adaptation_${hash(`${scenario}:${recommendation}`).slice(0, 16)}`,
    recommendation_id: `risk_recommendation_${hash(recommendation).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_risk_adaptation",
    risk_domain: "MISSION_RISK",
    recommendation_type: recommendation,
    adaptation_reason: `Historical risk gap supports ${recommendation}.`,
    historical_assessment_refs: freezeArray(["risk_assessment_ref_1", "risk_assessment_ref_2"]),
    actual_outcome_refs: freezeArray(["actual_outcome_ref_1"]),
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["risk_evidence_ref_1"]),
    risk_gap_summary: "Predicted risk diverged from observed mission outcome under governed review.",
    recommended_adjustment: `Recommend governed ${recommendation.toLowerCase()} for future simulation.`,
    governance_status: scenario === "MISSING_GOVERNANCE" ? "PENDING_REVIEW" : "REQUIRED",
    simulation_status: scenario === "MISSING_SIMULATION" ? "PENDING" : "REQUIRED",
    operator_status: "OPERATOR_REVIEW_REQUIRED",
    constitutional_refs: scenario === "MISSING_CONSTITUTIONAL" ? freezeArray([]) : freezeArray(["constitutional_ref_risk_adaptation_1"]),
    authority_refs: scenario === "MISSING_AUTHORITY" ? freezeArray([]) : freezeArray(["authority_ref_risk_adaptation_1"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_risk_adaptation_1"]),
    lineage_refs: scenario === "BROKEN_LINEAGE" ? freezeArray([]) : freezeArray(["lineage_ref_risk_adaptation_1"]),
    created_at: CREATED_AT,
    immutable: true,
    advisory_only: true,
    mutates_production_risk_model: false,
    updates_severity: false,
    updates_probability: false,
    changes_governance_thresholds: false,
    bypasses_simulation: false,
    bypasses_operator_approval: false,
    mutates_historical_records: false,
  };
  const contract = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...contract, integrity_hash: hash({ tampered: contract.adaptation_id }) });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...contract, mutates_production_risk_model: true as false });
  if (scenario === "SEVERITY_UPDATE") return Object.freeze({ ...contract, updates_severity: true as false });
  if (scenario === "PROBABILITY_UPDATE") return Object.freeze({ ...contract, updates_probability: true as false });
  if (scenario === "GOVERNANCE_THRESHOLD_UPDATE") return Object.freeze({ ...contract, changes_governance_thresholds: true as false });
  if (scenario === "SIMULATION_BYPASS") return Object.freeze({ ...contract, bypasses_simulation: true as false });
  if (scenario === "OPERATOR_BYPASS") return Object.freeze({ ...contract, bypasses_operator_approval: true as false });
  if (scenario === "HISTORICAL_RECORD_MUTATION") return Object.freeze({ ...contract, mutates_historical_records: true as false });
  return contract;
}

function buildLifecycle(scenario: Scenario): RiskAdaptationLifecycle {
  const current_state = stateForScenario(scenario);
  const allowed = scenario === "INVALID_TRANSITION"
    ? freezeArray(["APPROVED", "PROPOSED"] as const)
    : freezeArray(["OBSERVED", "EVIDENCE_COLLECTED", "COMPARED", "GAP_DETECTED", "PROPOSED", "VALIDATED", "GOVERNANCE_REVIEW", "SIMULATION", "OPERATOR_REVIEW", "APPROVED"] as const);
  const base: Omit<RiskAdaptationLifecycle, "integrity_hash"> = {
    lifecycle_id: `risk_adaptation_lifecycle_${hash(current_state).slice(0, 14)}`,
    current_state,
    allowed_transitions: allowed,
    rejected_terminal: current_state === "REJECTED",
    no_backward_transitions: scenario !== "INVALID_TRANSITION",
    replay_only_reconstruction: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPipeline(recommendation: RiskAdaptationRecommendationType): RiskRecommendationPipeline {
  const base: Omit<RiskRecommendationPipeline, "integrity_hash"> = {
    pipeline_id: `risk_recommendation_pipeline_${hash(recommendation).slice(0, 14)}`,
    stages: freezeArray(["Historical Assessments", "Outcome Analysis", "Risk Accuracy Evaluation", "Gap Detection", "Pattern Detection", "Evidence Attribution", "Recommendation Generation", "Validation", "Governance", "Simulation", "Operator Review"]),
    recommendation_type: recommendation,
    deterministic: true,
    replayable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayFramework(scenario: Scenario): RiskReplayFramework {
  const refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_risk_foundation_framework_1"]);
  const base: Omit<RiskReplayFramework, "integrity_hash"> = {
    replay_framework_id: "risk_adaptation_replay_framework",
    replay_includes: freezeArray(["originating_assessments", "historical_outcomes", "supporting_evidence", "detected_gaps", "recommendation_generation", "validation_decisions", "governance_evaluations", "simulation_execution", "operator_decisions", "certification_lineage"]),
    reproduces_identical_recommendation: scenario !== "NONDETERMINISTIC",
    reproduces_identical_evidence: true,
    reproduces_identical_validation: true,
    reproduces_identical_governance: true,
    reproduces_identical_simulation: scenario !== "SIMULATION_BYPASS",
    replay_refs: refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(contract: RiskAdaptationContract, lifecycle: RiskAdaptationLifecycle, replay: RiskReplayFramework, scenario: Scenario): readonly RiskAdaptationFailure[] {
  const failures: RiskAdaptationFailure[] = [];
  if (scenario === "MISSING_SCHEMA" || !contract.adaptation_id) failures.push("SCHEMA_INVALID");
  if (scenario === "MISSING_EVIDENCE" || contract.supporting_evidence_refs.length === 0) failures.push("EVIDENCE_MISSING");
  if (scenario === "MISSING_REPLAY" || contract.replay_refs.length === 0 || replay.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_METADATA_MISSING");
  if (scenario === "MISSING_CONSTITUTIONAL" || contract.constitutional_refs.length === 0) failures.push("CONSTITUTIONAL_METADATA_MISSING");
  if (scenario === "MISSING_AUTHORITY" || contract.authority_refs.length === 0) failures.push("AUTHORITY_METADATA_MISSING");
  if (scenario === "MISSING_SIMULATION" || contract.simulation_status !== "REQUIRED") failures.push("SIMULATION_REQUIREMENT_MISSING");
  if (scenario === "BROKEN_LINEAGE" || contract.lineage_refs.length === 0) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "CROSS_TENANT" || contract.tenant_id !== "tenant_mission_control") failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || hashWithoutIntegrity(contract) !== contract.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "INVALID_TRANSITION" || !lifecycle.no_backward_transitions) failures.push("INVALID_STATE_TRANSITION");
  if (scenario === "PRODUCTION_MUTATION" || contract.mutates_production_risk_model) failures.push("PRODUCTION_RISK_MODEL_MUTATION_DETECTED");
  if (scenario === "SEVERITY_UPDATE" || contract.updates_severity) failures.push("AUTOMATIC_SEVERITY_UPDATE_DETECTED");
  if (scenario === "PROBABILITY_UPDATE" || contract.updates_probability) failures.push("AUTOMATIC_PROBABILITY_UPDATE_DETECTED");
  if (scenario === "GOVERNANCE_THRESHOLD_UPDATE" || contract.changes_governance_thresholds) failures.push("GOVERNANCE_THRESHOLD_MUTATION_DETECTED");
  if (scenario === "SIMULATION_BYPASS" || contract.bypasses_simulation) failures.push("SIMULATION_BYPASS_DETECTED");
  if (scenario === "OPERATOR_BYPASS" || contract.bypasses_operator_approval) failures.push("OPERATOR_BYPASS_DETECTED");
  if (scenario === "HISTORICAL_RECORD_MUTATION" || contract.mutates_historical_records) failures.push("HISTORICAL_RECORD_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC" || !replay.reproduces_identical_recommendation) failures.push("NONDETERMINISTIC_RECOMMENDATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly RiskAdaptationFailure[]): RiskAdaptationValidation["state"] {
  if (failures.includes("REPLAY_REFERENCES_MISSING")) return "PENDING_REPLAY";
  if (failures.includes("INVALID_STATE_TRANSITION")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(contract: RiskAdaptationContract, lifecycle: RiskAdaptationLifecycle, replay: RiskReplayFramework, failures: readonly RiskAdaptationFailure[]): RiskAdaptationValidation {
  const integrityVerified = hashWithoutIntegrity(contract) === contract.integrity_hash && hashWithoutIntegrity(lifecycle) === lifecycle.integrity_hash && hashWithoutIntegrity(replay) === replay.integrity_hash;
  const base: Omit<RiskAdaptationValidation, "integrity_hash"> = {
    validation_id: "risk_adaptation_foundation_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && integrityVerified,
    failures,
    schema_valid: !failures.includes("SCHEMA_INVALID"),
    evidence_complete: !failures.includes("EVIDENCE_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_METADATA_MISSING"),
    constitutional_complete: !failures.includes("CONSTITUTIONAL_METADATA_MISSING"),
    authority_complete: !failures.includes("AUTHORITY_METADATA_MISSING"),
    simulation_required: !failures.includes("SIMULATION_REQUIREMENT_MISSING"),
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_RECOMMENDATION"),
    immutable_history: contract.immutable,
    advisory_only: contract.advisory_only,
    no_production_mutation: !failures.includes("PRODUCTION_RISK_MODEL_MUTATION_DETECTED"),
    no_automatic_risk_update: !failures.includes("AUTOMATIC_SEVERITY_UPDATE_DETECTED") && !failures.includes("AUTOMATIC_PROBABILITY_UPDATE_DETECTED"),
    no_governance_bypass: !failures.includes("GOVERNANCE_THRESHOLD_MUTATION_DETECTED") && !failures.includes("GOVERNANCE_METADATA_MISSING"),
    no_simulation_bypass: !failures.includes("SIMULATION_BYPASS_DETECTED"),
    no_operator_bypass: !failures.includes("OPERATOR_BYPASS_DETECTED"),
    no_historical_record_mutation: !failures.includes("HISTORICAL_RECORD_MUTATION_DETECTED"),
    integrity_verified: integrityVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RiskAdaptationFoundationResult, "integrity_hash" | "replay_hash">): string {
  return hash({ contract: result.contract, lifecycle: result.lifecycle, pipeline: result.pipeline, replay_framework: result.replay_framework, validation: result.validation });
}

function resultIntegrityHash(result: Omit<RiskAdaptationFoundationResult, "integrity_hash">): string {
  return hash({
    risk_adaptation_engine_foundation_version: result.risk_adaptation_engine_foundation_version,
    api_surface_hash: result.api_surface.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    lifecycle_hash: result.lifecycle.integrity_hash,
    pipeline_hash: result.pipeline.integrity_hash,
    replay_framework_hash: result.replay_framework.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function analyzeRiskAdaptationFoundation(input: RiskAdaptationInput = {}): RiskAdaptationFoundationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const contract = buildContract(scenario);
  const lifecycle = buildLifecycle(scenario);
  const pipeline = buildPipeline(contract.recommendation_type);
  const replay_framework = buildReplayFramework(scenario);
  const failures = collectFailures(contract, lifecycle, replay_framework, scenario);
  const validation = buildValidation(contract, lifecycle, replay_framework, failures);
  const base: Omit<RiskAdaptationFoundationResult, "integrity_hash" | "replay_hash"> = {
    risk_adaptation_engine_foundation_version: RISK_ADAPTATION_VERSION,
    api_surface,
    contract,
    lifecycle,
    pipeline,
    replay_framework,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    production_mutation_supported: false,
    automatic_risk_update_supported: false,
    governance_bypass_supported: false,
    simulation_bypass_supported: false,
    operator_bypass_supported: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRiskAdaptationFoundation(result: RiskAdaptationFoundationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getRiskAdaptationFoundation(): RiskAdaptationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    risk_adaptation_engine_foundation_version: RISK_ADAPTATION_VERSION,
    api_surface,
    result: analyzeRiskAdaptationFoundation(),
  });
}

export const RiskAdaptationEngineFoundation = Object.freeze({
  analyze: analyzeRiskAdaptationFoundation,
  replay: replayRiskAdaptationFoundation,
});
