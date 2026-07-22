import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeConfidenceDegradation } from "@/services/confidence-degradation-analyzer";
import type {
  ConfidenceAdaptationProposal,
  ConfidenceAdaptationProposalApiSurface,
  ConfidenceAdaptationProposalFailure,
  ConfidenceAdaptationProposalFoundation,
  ConfidenceAdaptationProposalInput,
  ConfidenceAdaptationProposalResult,
  ConfidenceAdaptationProposalValidation,
  ConfidenceProposalRegistry,
  ConfidenceProposalRegistryRecord,
  ConfidenceProposalType,
  ProposalBenefitRating,
  ProposalPriorityLevel,
  ProposalPriorityRecord,
  ProposalRiskCategory,
  ProposalValidationState,
} from "@/types/confidence-adaptation-proposal-generator";

const CONFIDENCE_PROPOSAL_VERSION = "confidence-adaptation-proposal-generator/v1" as const;

type Scenario = NonNullable<ConfidenceAdaptationProposalInput["scenario"]>;
type ProposalSample = Readonly<{
  type: ConfidenceProposalType;
  benefit: ProposalBenefitRating;
  risk: ProposalRiskCategory;
  priority: ProposalPriorityLevel;
  gain: number;
  benefitScore: number;
  riskScore: number;
  governanceScore: number;
  missionScore: number;
  evidenceScore: number;
}>;

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

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function buildApiSurface(): ConfidenceAdaptationProposalApiSurface {
  const base: Omit<ConfidenceAdaptationProposalApiSurface, "integrity_hash"> = {
    api_id: "confidence_adaptation_proposal_generator_api",
    generate_proposal: "POST /confidence-adaptation-proposal-generator/analyze",
    retrieve_proposals: "POST /confidence-adaptation-proposal-generator/proposals",
    retrieve_priorities: "POST /confidence-adaptation-proposal-generator/priorities",
    retrieve_registry: "POST /confidence-adaptation-proposal-generator/registry",
    retrieve_benefits: "POST /confidence-adaptation-proposal-generator/benefits",
    retrieve_risks: "POST /confidence-adaptation-proposal-generator/risks",
    retrieve_governance: "POST /confidence-adaptation-proposal-generator/governance",
    retrieve_simulation: "POST /confidence-adaptation-proposal-generator/simulation",
    retrieve_approvals: "POST /confidence-adaptation-proposal-generator/approvals",
    replay_analysis: "POST /confidence-adaptation-proposal-generator/replay",
    retrieve_contract: "GET /confidence-adaptation-proposal-generator/contract",
    update_supported: false,
    delete_supported: false,
    production_confidence_mutation_supported: false,
    model_update_supported: false,
    governance_bypass_supported: false,
    simulation_bypass_supported: false,
    operator_approval_bypass_supported: false,
    historical_record_mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function sampleForScenario(scenario: Scenario): ProposalSample {
  const map: Partial<Record<Scenario, ProposalSample>> = {
    THRESHOLD: { type: "CONFIDENCE_THRESHOLD_ADJUSTMENT", benefit: "SIGNIFICANT", risk: "MODERATE", priority: "HIGH", gain: 0.16, benefitScore: 0.78, riskScore: 0.42, governanceScore: 0.72, missionScore: 0.8, evidenceScore: 0.76 },
    EVIDENCE_WEIGHTING: { type: "EVIDENCE_WEIGHTING_REFINEMENT", benefit: "MAJOR", risk: "HIGH", priority: "HIGH", gain: 0.22, benefitScore: 0.86, riskScore: 0.62, governanceScore: 0.82, missionScore: 0.82, evidenceScore: 0.9 },
    SOURCE_WEIGHTING: { type: "SOURCE_WEIGHTING_ADJUSTMENT", benefit: "SIGNIFICANT", risk: "MODERATE", priority: "MEDIUM", gain: 0.14, benefitScore: 0.74, riskScore: 0.46, governanceScore: 0.7, missionScore: 0.68, evidenceScore: 0.82 },
    UNCERTAINTY_MODELING: { type: "ADDITIONAL_UNCERTAINTY_MODELING", benefit: "MAJOR", risk: "MODERATE", priority: "HIGH", gain: 0.2, benefitScore: 0.84, riskScore: 0.5, governanceScore: 0.8, missionScore: 0.78, evidenceScore: 0.8 },
    MISSION_CALIBRATION: { type: "MISSION_SPECIFIC_CALIBRATION", benefit: "SIGNIFICANT", risk: "LOW", priority: "MEDIUM", gain: 0.12, benefitScore: 0.72, riskScore: 0.3, governanceScore: 0.68, missionScore: 0.86, evidenceScore: 0.74 },
    RISK_AWARE: { type: "RISK_AWARE_CALIBRATION", benefit: "MAJOR", risk: "HIGH", priority: "CRITICAL", gain: 0.24, benefitScore: 0.9, riskScore: 0.68, governanceScore: 0.9, missionScore: 0.92, evidenceScore: 0.84 },
    GOVERNANCE_SENSITIVE: { type: "GOVERNANCE_SENSITIVE_CALIBRATION", benefit: "MODERATE", risk: "LOW", priority: "MEDIUM", gain: 0.1, benefitScore: 0.62, riskScore: 0.28, governanceScore: 0.88, missionScore: 0.66, evidenceScore: 0.72 },
    OPERATOR_VISIBILITY: { type: "OPERATOR_VISIBILITY_IMPROVEMENT", benefit: "MODERATE", risk: "VERY_LOW", priority: "LOW", gain: 0.07, benefitScore: 0.54, riskScore: 0.14, governanceScore: 0.58, missionScore: 0.5, evidenceScore: 0.7 },
    LOW_PRIORITY: { type: "OPERATOR_VISIBILITY_IMPROVEMENT", benefit: "MINIMAL", risk: "VERY_LOW", priority: "LOW", gain: 0.03, benefitScore: 0.32, riskScore: 0.1, governanceScore: 0.42, missionScore: 0.34, evidenceScore: 0.6 },
    MEDIUM_PRIORITY: { type: "SOURCE_WEIGHTING_ADJUSTMENT", benefit: "MODERATE", risk: "LOW", priority: "MEDIUM", gain: 0.11, benefitScore: 0.62, riskScore: 0.28, governanceScore: 0.64, missionScore: 0.65, evidenceScore: 0.72 },
    HIGH_PRIORITY: { type: "CONFIDENCE_THRESHOLD_ADJUSTMENT", benefit: "SIGNIFICANT", risk: "MODERATE", priority: "HIGH", gain: 0.18, benefitScore: 0.8, riskScore: 0.44, governanceScore: 0.76, missionScore: 0.82, evidenceScore: 0.82 },
    CRITICAL_PRIORITY: { type: "RISK_AWARE_CALIBRATION", benefit: "TRANSFORMATIONAL", risk: "CRITICAL", priority: "CRITICAL", gain: 0.32, benefitScore: 0.97, riskScore: 0.86, governanceScore: 0.98, missionScore: 0.96, evidenceScore: 0.9 },
  };
  return map[scenario] ?? map.THRESHOLD!;
}

function buildProposal(sample: ProposalSample, scenario: Scenario, degradationRef: string): ConfidenceAdaptationProposal {
  const supporting_evidence_refs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([degradationRef, "evidence_ref_confidence_adaptation_1"]);
  const supporting_outcome_refs = scenario === "MISSING_OUTCOME" ? freezeArray([]) : freezeArray(["outcome_validation_ref_confidence_adaptation_1"]);
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_adaptation_proposal_1", degradationRef]);
  const governance_refs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray(["governance_ref_confidence_adaptation_proposal_1"]);
  const approval_requirements = scenario === "MISSING_OPERATOR_APPROVAL" ? freezeArray([]) : freezeArray(["governance_board_approval", "operator_explicit_approval"]);
  const base: Omit<ConfidenceAdaptationProposal, "integrity_hash"> = {
    proposal_id: `confidence_adaptation_proposal_${hash(`${scenario}:${sample.type}:${sample.priority}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : "tenant_mission_control",
    mission_scope: "mission_scope_confidence_adaptation",
    proposal_type: sample.type,
    current_calibration: "Current certified confidence calibration remains unchanged pending governed proposal review.",
    observed_problem: `Validated degradation finding ${degradationRef} indicates ${sample.type} opportunity.`,
    supporting_evidence_refs,
    supporting_outcome_refs,
    proposed_calibration_change: `Evaluate ${sample.type.toLowerCase()} through simulation before future certification.`,
    expected_improvement: sample.benefit,
    expected_confidence_gain: sample.gain,
    potential_risks: freezeArray([`${sample.risk} operational risk if implemented without simulation.`, "Calibration regression risk requires rollback planning."]),
    risk_category: sample.risk,
    governance_implications: freezeArray(["Governance review required.", "Simulation and replay validation required before approval."]),
    simulation_required: scenario !== "MISSING_SIMULATION",
    rollback_strategy: scenario === "MISSING_ROLLBACK" ? "" : "Rollback to last certified confidence calibration and preserve proposal audit trail.",
    approval_requirements,
    governance_refs,
    replay_refs,
    advisory_only: true,
    modifies_production_confidence: false,
    updates_confidence_model: false,
    changes_governance_requirements: false,
    bypasses_simulation: false,
    bypasses_operator_approval: false,
    mutates_historical_records: false,
  };
  const proposal = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...proposal, integrity_hash: hash({ tampered: proposal.proposal_id }) });
  if (scenario === "PRODUCTION_MUTATION") return Object.freeze({ ...proposal, modifies_production_confidence: true as false });
  if (scenario === "MODEL_UPDATE") return Object.freeze({ ...proposal, updates_confidence_model: true as false });
  if (scenario === "GOVERNANCE_BYPASS") return Object.freeze({ ...proposal, changes_governance_requirements: true as false });
  if (scenario === "SIMULATION_BYPASS") return Object.freeze({ ...proposal, bypasses_simulation: true as false });
  if (scenario === "OPERATOR_APPROVAL_BYPASS") return Object.freeze({ ...proposal, bypasses_operator_approval: true as false });
  if (scenario === "HISTORICAL_RECORD_MUTATION") return Object.freeze({ ...proposal, mutates_historical_records: true as false });
  return proposal;
}

function buildPriority(proposal: ConfidenceAdaptationProposal, sample: ProposalSample, scenario: Scenario): ProposalPriorityRecord {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_adaptation_priority_1"]);
  const overall = clamp((sample.benefitScore * 0.3) + ((1 - sample.riskScore) * 0.15) + (sample.governanceScore * 0.2) + (sample.missionScore * 0.2) + (sample.evidenceScore * 0.15));
  const base: Omit<ProposalPriorityRecord, "integrity_hash"> = {
    priority_id: `confidence_adaptation_priority_${hash(proposal.proposal_id).slice(0, 14)}`,
    proposal_id: proposal.proposal_id,
    priority_level: sample.priority,
    benefit_score: sample.benefitScore,
    risk_score: sample.riskScore,
    governance_score: sample.governanceScore,
    mission_impact_score: sample.missionScore,
    evidence_strength_score: sample.evidenceScore,
    overall_priority_score: scenario === "NONDETERMINISTIC" ? clamp(overall - 0.17) : overall,
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistryRecord(proposal: ConfidenceAdaptationProposal, scenario: Scenario): ConfidenceProposalRegistryRecord {
  const replay_refs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray(["replay_ref_confidence_proposal_registry_record_1"]);
  const base: Omit<ConfidenceProposalRegistryRecord, "integrity_hash"> = {
    registry_record_id: `confidence_proposal_registry_record_${hash(proposal.proposal_id).slice(0, 14)}`,
    proposal_id: proposal.proposal_id,
    proposal_version: "v1",
    proposal_status: proposal.simulation_required ? "SIMULATION_REQUIRED" : "REJECTED",
    governance_status: "REQUIRED",
    simulation_status: proposal.simulation_required ? "REQUIRED" : "NOT_RUN",
    approval_status: "OPERATOR_APPROVAL_REQUIRED",
    implementation_status: "NOT_IMPLEMENTED",
    replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(proposals: readonly ConfidenceAdaptationProposal[], priorities: readonly ProposalPriorityRecord[], registryRecords: readonly ConfidenceProposalRegistryRecord[], scenario: Scenario): ConfidenceProposalRegistry {
  const types: ConfidenceProposalType[] = ["CONFIDENCE_THRESHOLD_ADJUSTMENT", "EVIDENCE_WEIGHTING_REFINEMENT", "SOURCE_WEIGHTING_ADJUSTMENT", "ADDITIONAL_UNCERTAINTY_MODELING", "MISSION_SPECIFIC_CALIBRATION", "RISK_AWARE_CALIBRATION", "GOVERNANCE_SENSITIVE_CALIBRATION", "OPERATOR_VISIBILITY_IMPROVEMENT"];
  const prioritiesIndex: ProposalPriorityLevel[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "DEFERRED"];
  const type_index = types.reduce((index, type) => ({ ...index, [type]: freezeArray(proposals.filter((proposal) => proposal.proposal_type === type).map((proposal) => proposal.proposal_id)) }), {} as Record<ConfidenceProposalType, readonly string[]>);
  const priority_index = prioritiesIndex.reduce((index, level) => ({ ...index, [level]: freezeArray(priorities.filter((priority) => priority.priority_level === level).map((priority) => priority.proposal_id)) }), {} as Record<ProposalPriorityLevel, readonly string[]>);
  const base: Omit<ConfidenceProposalRegistry, "integrity_hash"> = {
    registry_id: `confidence_adaptation_proposal_registry_${hash(proposals.map((proposal) => proposal.integrity_hash)).slice(0, 14)}`,
    tenant_id: "tenant_mission_control",
    proposal_refs: proposals.map((proposal) => proposal.proposal_id),
    priority_refs: priorities.map((priority) => priority.priority_id),
    registry_record_refs: registryRecords.map((record) => record.registry_record_id),
    type_index: Object.freeze(type_index),
    priority_index: Object.freeze(priority_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(proposals: readonly ConfidenceAdaptationProposal[], priorities: readonly ProposalPriorityRecord[], records: readonly ConfidenceProposalRegistryRecord[], registry: ConfidenceProposalRegistry, scenario: Scenario): readonly ConfidenceAdaptationProposalFailure[] {
  const failures: ConfidenceAdaptationProposalFailure[] = [];
  if (scenario === "MISSING_EVIDENCE" || proposals.some((proposal) => proposal.supporting_evidence_refs.length === 0)) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "MISSING_OUTCOME" || proposals.some((proposal) => proposal.supporting_outcome_refs.length === 0)) failures.push("OUTCOME_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || proposals.some((proposal) => proposal.replay_refs.length === 0) || priorities.some((priority) => priority.replay_refs.length === 0) || records.some((record) => record.replay_refs.length === 0)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_GOVERNANCE" || proposals.some((proposal) => proposal.governance_refs.length === 0 || proposal.governance_implications.length === 0)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "MISSING_SIMULATION" || proposals.some((proposal) => !proposal.simulation_required)) failures.push("SIMULATION_REQUIREMENT_MISSING");
  if (scenario === "MISSING_OPERATOR_APPROVAL" || proposals.some((proposal) => proposal.approval_requirements.length === 0)) failures.push("OPERATOR_APPROVAL_REQUIREMENT_MISSING");
  if (scenario === "MISSING_ROLLBACK" || proposals.some((proposal) => !proposal.rollback_strategy)) failures.push("ROLLBACK_STRATEGY_MISSING");
  if (scenario === "CROSS_TENANT" || proposals.some((proposal) => proposal.tenant_id !== registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || proposals.some((proposal) => hashWithoutIntegrity(proposal) !== proposal.integrity_hash) || priorities.some((priority) => hashWithoutIntegrity(priority) !== priority.integrity_hash) || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "PRODUCTION_MUTATION" || proposals.some((proposal) => proposal.modifies_production_confidence)) failures.push("PRODUCTION_CONFIDENCE_MUTATION_DETECTED");
  if (scenario === "MODEL_UPDATE" || proposals.some((proposal) => proposal.updates_confidence_model)) failures.push("CONFIDENCE_MODEL_UPDATE_DETECTED");
  if (scenario === "GOVERNANCE_BYPASS" || proposals.some((proposal) => proposal.changes_governance_requirements)) failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (scenario === "SIMULATION_BYPASS" || proposals.some((proposal) => proposal.bypasses_simulation)) failures.push("SIMULATION_BYPASS_DETECTED");
  if (scenario === "OPERATOR_APPROVAL_BYPASS" || proposals.some((proposal) => proposal.bypasses_operator_approval)) failures.push("OPERATOR_APPROVAL_BYPASS_DETECTED");
  if (scenario === "HISTORICAL_RECORD_MUTATION" || proposals.some((proposal) => proposal.mutates_historical_records)) failures.push("HISTORICAL_RECORD_MUTATION_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_PROPOSAL_GENERATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly ConfidenceAdaptationProposalFailure[]): ProposalValidationState {
  if (failures.includes("OUTCOME_VALIDATION_MISSING")) return "REJECTED";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(proposals: readonly ConfidenceAdaptationProposal[], priorities: readonly ProposalPriorityRecord[], records: readonly ConfidenceProposalRegistryRecord[], registry: ConfidenceProposalRegistry, failures: readonly ConfidenceAdaptationProposalFailure[]): ConfidenceAdaptationProposalValidation {
  const proposalsVerified = proposals.every((proposal) => hashWithoutIntegrity(proposal) === proposal.integrity_hash);
  const prioritiesVerified = priorities.every((priority) => hashWithoutIntegrity(priority) === priority.integrity_hash);
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<ConfidenceAdaptationProposalValidation, "integrity_hash"> = {
    validation_id: "confidence_adaptation_proposal_generator_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && proposalsVerified && prioritiesVerified && recordsVerified && registryVerified,
    failures,
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    outcome_validation_complete: !failures.includes("OUTCOME_VALIDATION_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_complete: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    simulation_required: !failures.includes("SIMULATION_REQUIREMENT_MISSING"),
    operator_approval_required: !failures.includes("OPERATOR_APPROVAL_REQUIREMENT_MISSING"),
    rollback_complete: !failures.includes("ROLLBACK_STRATEGY_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    deterministic: !failures.includes("NONDETERMINISTIC_PROPOSAL_GENERATION"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: proposals.every((proposal) => proposal.advisory_only),
    no_production_confidence_mutation: proposals.every((proposal) => !proposal.modifies_production_confidence),
    no_model_update: proposals.every((proposal) => !proposal.updates_confidence_model),
    no_governance_bypass: proposals.every((proposal) => !proposal.changes_governance_requirements),
    no_simulation_bypass: proposals.every((proposal) => !proposal.bypasses_simulation),
    no_operator_approval_bypass: proposals.every((proposal) => !proposal.bypasses_operator_approval),
    no_historical_record_mutation: proposals.every((proposal) => !proposal.mutates_historical_records),
    integrity_verified: proposalsVerified && prioritiesVerified && recordsVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<ConfidenceAdaptationProposalResult, "integrity_hash" | "replay_hash">): string {
  return hash({ proposals: result.proposals, priorities: result.priorities, registry_records: result.registry_records, registry: result.registry, validation: result.validation });
}

function resultIntegrityHash(result: Omit<ConfidenceAdaptationProposalResult, "integrity_hash">): string {
  return hash({
    confidence_adaptation_proposal_generator_version: result.confidence_adaptation_proposal_generator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    proposal_hashes: result.proposals.map((proposal) => proposal.integrity_hash),
    priority_hashes: result.priorities.map((priority) => priority.integrity_hash),
    registry_record_hashes: result.registry_records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function generateConfidenceAdaptationProposal(input: ConfidenceAdaptationProposalInput = {}): ConfidenceAdaptationProposalResult {
  const scenario = input.scenario ?? "BASELINE";
  const degradation = input.degradation_result ?? analyzeConfidenceDegradation();
  const degradationRef = degradation.degradation_records[0]?.degradation_id ?? "confidence_degradation_ref_missing";
  const api_surface = buildApiSurface();
  const sample = sampleForScenario(scenario);
  const proposal = buildProposal(sample, scenario, degradationRef);
  const priority = buildPriority(proposal, sample, scenario);
  const registryRecord = buildRegistryRecord(proposal, scenario);
  const proposals = freezeArray([proposal]);
  const priorities = freezeArray([priority]);
  const registry_records = freezeArray([registryRecord]);
  const registry = buildRegistry(proposals, priorities, registry_records, scenario);
  const failures = collectFailures(proposals, priorities, registry_records, registry, scenario);
  const validation = buildValidation(proposals, priorities, registry_records, registry, failures);
  const base: Omit<ConfidenceAdaptationProposalResult, "integrity_hash" | "replay_hash"> = {
    confidence_adaptation_proposal_generator_version: CONFIDENCE_PROPOSAL_VERSION,
    api_surface,
    proposals,
    priorities,
    registry_records,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_backed: validation.evidence_complete,
    governance_visible: validation.governance_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    modifies_production_confidence: false,
    updates_confidence_model: false,
    changes_governance_requirements: false,
    bypasses_simulation: false,
    bypasses_operator_approval: false,
    mutates_historical_records: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayConfidenceAdaptationProposal(result: ConfidenceAdaptationProposalResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getConfidenceAdaptationProposalFoundation(): ConfidenceAdaptationProposalFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    confidence_adaptation_proposal_generator_version: CONFIDENCE_PROPOSAL_VERSION,
    api_surface,
    result: generateConfidenceAdaptationProposal(),
  });
}

export const ConfidenceAdaptationProposalGenerator = Object.freeze({
  generate: generateConfidenceAdaptationProposal,
  replay: replayConfidenceAdaptationProposal,
});
