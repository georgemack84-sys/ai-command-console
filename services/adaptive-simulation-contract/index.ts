import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyAdaptationProposalEngine, replayAdaptationProposalCertification } from "@/services/adaptation-proposal-certification-gate";
import type { AdaptationProposalCertificationScenario } from "@/types/adaptation-proposal-certification-gate";
import type {
  AdaptiveSimulationBoundary,
  AdaptiveSimulationContractApiSurface,
  AdaptiveSimulationContractFailure,
  AdaptiveSimulationContractFoundation,
  AdaptiveSimulationContractInput,
  AdaptiveSimulationContractMetrics,
  AdaptiveSimulationContractResult,
  AdaptiveSimulationContractScenario,
  AdaptiveSimulationContractStatus,
  AdaptiveSimulationInputContract,
  AdaptiveSimulationLifecycleRequirement,
  AdaptiveSimulationLifecycleState,
  AdaptiveSimulationOutputContract,
  AdaptiveSimulationScope,
} from "@/types/adaptive-simulation-contract";

const CONTRACT_VERSION = "adaptive-simulation-contract/v1" as const;
const CONTRACT_IDENTIFIER = "AdaptiveSimulationContract" as const;
const CONTRACT_SEMVER = "1.0" as const;

const LIFECYCLE_STATES: readonly AdaptiveSimulationLifecycleState[] = Object.freeze([
  "PROPOSAL_RECEIVED",
  "VALIDATION_READY",
  "SIMULATION_PREPARATION",
  "SIMULATION_RUNNING",
  "RESULT_ANALYSIS",
  "REPLAY_VALIDATION",
  "DIVERGENCE_ANALYSIS",
  "CERTIFICATION_RECOMMENDATION",
  "COMPLETE",
]);

const SCOPES: readonly AdaptiveSimulationScope[] = Object.freeze([
  "HISTORICAL_REPLAY",
  "COUNTERFACTUAL_REPLAY",
  "ADAPTATION_VALIDATION",
  "PROPOSAL_COMPARISON",
  "GOVERNANCE_VALIDATION",
  "RISK_SIMULATION",
  "CONFIDENCE_SIMULATION",
  "MISSION_SIMULATION",
  "ROLLBACK_SIMULATION",
  "ADVERSARIAL_SIMULATION",
]);

type Scenario = NonNullable<AdaptiveSimulationContractInput["scenario"]>;

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

function buildApiSurface(): AdaptiveSimulationContractApiSurface {
  const base: Omit<AdaptiveSimulationContractApiSurface, "integrity_hash"> = {
    api_id: "adaptive_simulation_contract_api",
    establish_contract: "POST /adaptive-simulation-contract/establish",
    retrieve_lifecycle: "POST /adaptive-simulation-contract/lifecycle",
    retrieve_boundaries: "POST /adaptive-simulation-contract/boundaries",
    retrieve_io_contract: "POST /adaptive-simulation-contract/io",
    retrieve_metrics: "POST /adaptive-simulation-contract/metrics",
    replay_contract: "POST /adaptive-simulation-contract/replay",
    inspect_contract: "POST /adaptive-simulation-contract/inspect",
    retrieve_contract: "GET /adaptive-simulation-contract/contract",
    production_mutation_supported: false,
    historical_evidence_mutation_supported: false,
    governance_override_supported: false,
    authority_expansion_supported: false,
    autonomous_decision_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certificationScenarioFor(scenario: Scenario): AdaptationProposalCertificationScenario {
  const map: Partial<Record<AdaptiveSimulationContractScenario, AdaptationProposalCertificationScenario>> = {
    CERTIFICATION_FAIL: "INTEGRITY_FAILURE",
    CERTIFICATION_CONDITIONAL: "CONDITIONAL_DOCUMENTATION",
    NONDETERMINISTIC: "NONDETERMINISTIC_GENERATION",
    REPLAY_UNAVAILABLE: "REPLAY_FAILURE",
    GOVERNANCE_UNSATISFIED: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_UNSATISFIED: "CONSTITUTIONAL_FAILURE",
    AUTHORITY_UNSATISFIED: "AUTHORITY_FAILURE",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION",
    GOVERNANCE_BYPASS: "GOVERNANCE_FAILURE",
    AUTHORITY_EXPANSION: "AUTHORITY_FAILURE",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptiveSimulationContractFailure | undefined {
  const map: Partial<Record<AdaptiveSimulationContractScenario, AdaptiveSimulationContractFailure>> = {
    CERTIFICATION_UNAVAILABLE: "PROPOSAL_CERTIFICATION_UNAVAILABLE",
    CERTIFICATION_FAIL: "PROPOSAL_NOT_CERTIFIED",
    CERTIFICATION_CONDITIONAL: "PROPOSAL_NOT_CERTIFIED",
    NONDETERMINISTIC: "DETERMINISM_REQUIREMENT_UNSATISFIED",
    REPLAY_UNAVAILABLE: "REPLAY_REQUIREMENT_UNSATISFIED",
    GOVERNANCE_UNSATISFIED: "GOVERNANCE_REQUIREMENT_UNSATISFIED",
    CONSTITUTIONAL_UNSATISFIED: "CONSTITUTIONAL_REQUIREMENT_UNSATISFIED",
    AUTHORITY_UNSATISFIED: "AUTHORITY_REQUIREMENT_UNSATISFIED",
    OPERATOR_AUTHORITY_UNSATISFIED: "OPERATOR_AUTHORITY_REQUIREMENT_UNSATISFIED",
    TENANT_VIOLATION: "TENANT_ISOLATION_UNSATISFIED",
    ROLLBACK_UNSATISFIED: "ROLLBACK_VALIDATION_UNSATISFIED",
    EVIDENCE_IMMUTABILITY_FAILURE: "IMMUTABLE_EVIDENCE_REQUIREMENT_UNSATISFIED",
    UNEXPLAINED_DIVERGENCE: "EXPLAINABILITY_REQUIREMENT_UNSATISFIED",
    INCOMPLETE_AUDIT_TRAIL: "AUDIT_TRAIL_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_REQUIREMENT_UNSATISFIED",
    INTEGRITY_VERIFICATION_FAILURE: "INTEGRITY_VERIFICATION_UNSATISFIED",
    SIMULATION_STATE_CORRUPTION: "SIMULATION_STATE_CORRUPTION_DETECTED",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION_ATTEMPT",
    HISTORICAL_EVIDENCE_MUTATION: "HISTORICAL_EVIDENCE_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPT",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION_ATTEMPT",
    AUTONOMOUS_DECISION: "AUTONOMOUS_DECISION_ATTEMPT",
    RISK_CONFIDENCE_MUTATION: "RISK_CONFIDENCE_MUTATION_ATTEMPT",
    TENANT_STATE_MUTATION: "TENANT_STATE_MUTATION_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromCertification(certificationReplayable: boolean, outcome: string, certificationFailures: readonly string[]): readonly AdaptiveSimulationContractFailure[] {
  const failures: AdaptiveSimulationContractFailure[] = [];
  if (outcome !== "PASS") failures.push("PROPOSAL_NOT_CERTIFIED");
  if (!certificationReplayable || certificationFailures.includes("REPLAY_RECONSTRUCTION_FAILED")) failures.push("REPLAY_REQUIREMENT_UNSATISFIED");
  if (certificationFailures.includes("NONDETERMINISTIC_PROPOSAL_GENERATION")) failures.push("DETERMINISM_REQUIREMENT_UNSATISFIED");
  if (certificationFailures.includes("GOVERNANCE_VALIDATION_FAILED")) failures.push("GOVERNANCE_REQUIREMENT_UNSATISFIED");
  if (certificationFailures.includes("CONSTITUTIONAL_VALIDATION_FAILED")) failures.push("CONSTITUTIONAL_REQUIREMENT_UNSATISFIED");
  if (certificationFailures.includes("AUTHORITY_BOUNDARY_VIOLATED")) failures.push("AUTHORITY_REQUIREMENT_UNSATISFIED");
  if (certificationFailures.includes("TENANT_ISOLATION_FAILED")) failures.push("TENANT_ISOLATION_UNSATISFIED");
  if (certificationFailures.includes("DIRECT_PRODUCTION_MUTATION_POSSIBLE")) failures.push("PRODUCTION_MUTATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, certificationReplayable: boolean, outcome: string, certificationFailures: readonly string[]): readonly AdaptiveSimulationContractFailure[] {
  const failures: AdaptiveSimulationContractFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromCertification(certificationReplayable, outcome, certificationFailures));
  return freezeArray([...new Set(failures)]);
}

function requirementFor(state: AdaptiveSimulationLifecycleState): readonly string[] {
  const map: Record<AdaptiveSimulationLifecycleState, readonly string[]> = {
    PROPOSAL_RECEIVED: ["proposal_exists", "proposal_certified_valid", "proposal_immutable", "proposal_hash_verified"],
    VALIDATION_READY: ["proposal_integrity_verified", "tenant_validated", "governance_validated", "constitutional_validated", "replay_available", "baseline_available"],
    SIMULATION_PREPARATION: ["deterministic_seed_prepared", "historical_evidence_resolved", "replay_datasets_resolved", "baseline_behaviors_loaded", "simulation_parameters_locked", "governance_policies_loaded", "operator_workflows_loaded", "tenant_context_locked"],
    SIMULATION_RUNNING: ["deterministic_execution", "isolated_execution", "replay_capture", "evidence_capture", "timing_capture", "event_capture"],
    RESULT_ANALYSIS: ["improvement_analysis", "degradation_analysis", "risk_change_analysis", "confidence_change_analysis", "governance_effect_analysis", "operator_effect_analysis"],
    REPLAY_VALIDATION: ["replay_bundle_complete", "identical_outputs_verified", "identical_event_ordering_verified", "identical_evidence_verified", "identical_recommendations_verified", "identical_explanations_verified", "identical_metrics_verified"],
    DIVERGENCE_ANALYSIS: ["expected_divergence_classified", "beneficial_divergence_classified", "harmful_divergence_classified", "governance_critical_divergence_classified", "unexplained_divergence_rejected", "nondeterministic_divergence_rejected"],
    CERTIFICATION_RECOMMENDATION: ["pass_supported", "conditional_pass_supported", "fail_supported", "more_evidence_supported", "operator_review_supported", "governance_review_supported", "recommendation_advisory_only", "no_implementation_authority"],
    COMPLETE: ["immutable_replay_recorded", "immutable_evidence_recorded", "immutable_divergence_recorded", "immutable_metrics_recorded", "immutable_audit_recorded", "immutable_certification_recommendation_recorded"],
  };
  return freezeArray(map[state]);
}

function nextStatesFor(state: AdaptiveSimulationLifecycleState): readonly AdaptiveSimulationLifecycleState[] {
  const index = LIFECYCLE_STATES.indexOf(state);
  return index >= 0 && index < LIFECYCLE_STATES.length - 1 ? freezeArray([LIFECYCLE_STATES[index + 1]]) : freezeArray([]);
}

function lifecycleRequirementFor(state: AdaptiveSimulationLifecycleState): AdaptiveSimulationLifecycleRequirement {
  const base: Omit<AdaptiveSimulationLifecycleRequirement, "integrity_hash"> = {
    state,
    requirements: requirementFor(state),
    allowed_next_states: nextStatesFor(state),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function boundaryFor(name: string, rationale: string): AdaptiveSimulationBoundary {
  const base: Omit<AdaptiveSimulationBoundary, "integrity_hash"> = {
    boundary_id: `adaptive_simulation_boundary_${hash(name).slice(0, 14)}`,
    name,
    prohibited: true,
    rationale,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildBoundaries(): readonly AdaptiveSimulationBoundary[] {
  return freezeArray([
    boundaryFor("modify_production_recommendations", "simulation evaluates proposals but cannot change production recommendations"),
    boundaryFor("update_production_models", "simulation evidence cannot update models"),
    boundaryFor("change_historical_records", "historical evidence remains immutable"),
    boundaryFor("change_governance_policy", "governance supremacy is preserved"),
    boundaryFor("approve_reject_or_deploy_proposals", "simulation only produces evidence and cannot approve, reject, or deploy proposals"),
    boundaryFor("change_constitutional_policy", "constitutional policy is preserved"),
    boundaryFor("update_confidence", "confidence changes may be simulated but not applied"),
    boundaryFor("modify_risk_calculations", "risk changes may be simulated but not applied"),
    boundaryFor("change_tenant_state", "tenant isolation prohibits tenant state mutation"),
    boundaryFor("autonomous_decision", "simulation produces evidence only"),
    boundaryFor("authority_expansion", "simulation cannot expand authority"),
  ]);
}

function buildInputContract(): AdaptiveSimulationInputContract {
  const base: Omit<AdaptiveSimulationInputContract, "integrity_hash"> = {
    input_contract_id: "adaptive_simulation_input_contract",
    required_inputs: freezeArray(["proposal_identifier", "proposal_version", "proposal_hash", "certified_adaptation_proposal", "historical_evidence", "historical_outcomes", "recommendation_history", "operator_history", "replay_timeline", "decision_graph", "recommendation_graph", "governance_graph", "active_policies", "constitutional_rules", "authority_rules", "approval_requirements", "tenant_identifier", "tenant_policies", "tenant_configuration", "tenant_isolation_metadata", "simulation_type", "deterministic_seed", "execution_parameters", "simulation_scope", "baseline_behavior", "rollback_plan"]),
    proposal_certification_required: true,
    deterministic_seed_required: true,
    baseline_required: true,
    governance_policy_required: true,
    rollback_plan_required: true,
    tenant_context_required: true,
    replay_timeline_required: true,
    decision_graph_required: true,
    recommendation_graph_required: true,
    governance_graph_required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildOutputContract(): AdaptiveSimulationOutputContract {
  const base: Omit<AdaptiveSimulationOutputContract, "integrity_hash"> = {
    output_contract_id: "adaptive_simulation_output_contract",
    required_outputs: freezeArray(["simulation_record", "replay_package", "evidence_bundle", "divergence_report", "impact_analysis", "governance_assessment", "operator_assessment", "rollback_assessment", "certification_recommendation", "audit_package"]),
    immutable_evidence_required: true,
    replay_bundle_required: true,
    explainability_required: true,
    certification_recommendation_required: true,
    audit_package_required: true,
    impact_analysis_required: true,
    rollback_assessment_required: true,
    production_mutation_supported: false,
    autonomous_decision_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function metricsFor(
  lifecycle: readonly AdaptiveSimulationLifecycleRequirement[],
  scopes: readonly AdaptiveSimulationScope[],
  boundaries: readonly AdaptiveSimulationBoundary[],
  input: AdaptiveSimulationInputContract,
  output: AdaptiveSimulationOutputContract,
  failures: readonly AdaptiveSimulationContractFailure[],
): AdaptiveSimulationContractMetrics {
  const base: Omit<AdaptiveSimulationContractMetrics, "integrity_hash"> = {
    lifecycle_states_defined: lifecycle.length,
    simulation_scopes_defined: scopes.length,
    input_requirements_defined: input.required_inputs.length,
    output_requirements_defined: output.required_outputs.length,
    prohibited_boundaries_defined: boundaries.length,
    determinism_guaranteed: !failures.includes("DETERMINISM_REQUIREMENT_UNSATISFIED"),
    replayability_guaranteed: !failures.includes("REPLAY_REQUIREMENT_UNSATISFIED"),
    governance_preserved: !failures.includes("GOVERNANCE_REQUIREMENT_UNSATISFIED") && !failures.includes("GOVERNANCE_BYPASS_ATTEMPT"),
    constitutional_governance_preserved: !failures.includes("CONSTITUTIONAL_REQUIREMENT_UNSATISFIED"),
    authority_preserved: !failures.includes("AUTHORITY_REQUIREMENT_UNSATISFIED") && !failures.includes("AUTHORITY_EXPANSION_ATTEMPT"),
    tenant_isolation_preserved: !failures.includes("TENANT_ISOLATION_UNSATISFIED") && !failures.includes("TENANT_STATE_MUTATION_ATTEMPT"),
    advisory_only_preserved: !failures.includes("AUTONOMOUS_DECISION_ATTEMPT") && !failures.includes("PRODUCTION_MUTATION_ATTEMPT"),
    explainability_guaranteed: !failures.includes("EXPLAINABILITY_REQUIREMENT_UNSATISFIED"),
    audit_complete: !failures.includes("AUDIT_TRAIL_INCOMPLETE"),
    evidence_complete: !failures.includes("EVIDENCE_REQUIREMENT_UNSATISFIED") && !failures.includes("IMMUTABLE_EVIDENCE_REQUIREMENT_UNSATISFIED"),
    integrity_verified: !failures.includes("INTEGRITY_VERIFICATION_UNSATISFIED") && !failures.includes("SIMULATION_STATE_CORRUPTION_DETECTED"),
    rollback_validated: !failures.includes("ROLLBACK_VALIDATION_UNSATISFIED"),
    validation_failures: failures,
    deterministic_replay_success: failures.length === 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function statusFor(failures: readonly AdaptiveSimulationContractFailure[]): AdaptiveSimulationContractStatus {
  return failures.length ? "FAIL_CLOSED" : "AUTHORITATIVE";
}

function resultReplayHash(result: Omit<AdaptiveSimulationContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_hash: result.certification_result.integrity_hash,
    lifecycle_hashes: result.lifecycle.map((item) => item.integrity_hash),
    boundaries: result.boundaries.map((item) => item.integrity_hash),
    input_hash: result.input_contract.integrity_hash,
    output_hash: result.output_contract.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.contract_status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptiveSimulationContractResult, "integrity_hash">): string {
  return hash({
    version: result.adaptive_simulation_contract_version,
    contract_identifier: result.contract_identifier,
    contract_semver: result.contract_semver,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishAdaptiveSimulationContract(input: AdaptiveSimulationContractInput = {}): AdaptiveSimulationContractResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const certification_result = input.certification_result ?? certifyAdaptationProposalEngine({ scenario: certificationScenarioFor(scenario) });
  const failures = collectFailures(scenario, replayAdaptationProposalCertification(certification_result), certification_result.certification_outcome, certification_result.failures);
  const lifecycle = freezeArray(LIFECYCLE_STATES.map(lifecycleRequirementFor));
  const boundaries = buildBoundaries();
  const input_contract = buildInputContract();
  const output_contract = buildOutputContract();
  const metrics = metricsFor(lifecycle, SCOPES, boundaries, input_contract, output_contract, failures);
  const base: Omit<AdaptiveSimulationContractResult, "integrity_hash" | "replay_hash"> = {
    adaptive_simulation_contract_version: CONTRACT_VERSION,
    contract_identifier: CONTRACT_IDENTIFIER,
    contract_status: statusFor(failures),
    contract_semver: CONTRACT_SEMVER,
    api_surface,
    certification_result,
    lifecycle,
    supported_scopes: SCOPES,
    boundaries,
    input_contract,
    output_contract,
    metrics,
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationProposalCertification(certification_result),
    explainable: failures.length === 0,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_UNSATISFIED") && certification_result.tenant_isolated,
    governance_preserved: metrics.governance_preserved,
    constitutional_governance_preserved: metrics.constitutional_governance_preserved,
    operator_authority_preserved: !failures.includes("OPERATOR_AUTHORITY_REQUIREMENT_UNSATISFIED"),
    advisory_only: true,
    modifies_production_behavior: false,
    modifies_historical_evidence: false,
    updates_production_models: false,
    updates_confidence: false,
    modifies_risk_calculations: false,
    changes_tenant_state: false,
    authorizes_implementation: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptiveSimulationContract(result: AdaptiveSimulationContractResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    result.lifecycle.every(verifyHashedRecord) &&
    result.boundaries.every(verifyHashedRecord) &&
    verifyHashedRecord(result.input_contract) &&
    verifyHashedRecord(result.output_contract) &&
    verifyHashedRecord(result.metrics) &&
    replayAdaptationProposalCertification(result.certification_result) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getAdaptiveSimulationContractFoundation(): AdaptiveSimulationContractFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptive_simulation_contract_version: CONTRACT_VERSION,
    lifecycle_states: LIFECYCLE_STATES,
    supported_scopes: SCOPES,
    api_surface,
    result: establishAdaptiveSimulationContract(),
  });
}

export const AdaptiveSimulationContract = Object.freeze({
  establish: establishAdaptiveSimulationContract,
  replay: replayAdaptiveSimulationContract,
});
