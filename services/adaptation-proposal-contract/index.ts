import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { certifyOperatorFeedbackIntegration, replayOperatorFeedbackCertificationGate } from "@/services/operator-feedback-certification-gate";
import type {
  AdaptationProposal,
  AdaptationProposalAnalysis,
  AdaptationProposalApiSurface,
  AdaptationProposalApprovalRequirements,
  AdaptationProposalCertificationRequirements,
  AdaptationProposalContractFoundation,
  AdaptationProposalContractInput,
  AdaptationProposalContractResult,
  AdaptationProposalFailure,
  AdaptationProposalLifecycleState,
  AdaptationProposalRollbackPlan,
  AdaptationProposalScenario,
  AdaptationType,
  AdaptationProposalValidationReport,
} from "@/types/adaptation-proposal-contract";

const CONTRACT_VERSION = "adaptation-proposal-contract/v1" as const;
const SCHEMA_VERSION = "adaptation-proposal-schema/v1" as const;
const PROPOSAL_VERSION = "adaptation-proposal/v1" as const;
const CREATED_AT = "2026-07-10T00:00:00.000Z";

const SCHEMA_FIELDS = Object.freeze([
  "proposal_id",
  "proposal_version",
  "tenant_id",
  "proposal_creation_timestamp",
  "proposal_generator_version",
  "contract_version",
  "proposal_uuid",
  "proposal_namespace",
  "mission_scope",
  "adaptation_type",
  "proposal_summary",
  "proposed_change",
  "reason_for_change",
  "supporting_outcome_refs",
  "supporting_pattern_refs",
  "supporting_feedback_refs",
  "supporting_evidence_refs",
  "expected_benefit",
  "expected_risk",
  "confidence_score",
  "risk_score",
  "governance_impact",
  "constitutional_impact",
  "authority_impact",
  "operator_impact",
  "simulation_required",
  "replay_required",
  "approval_required",
  "certification_required",
  "rollback_plan_required",
  "proposal_state",
  "replay_refs",
  "lineage_refs",
  "integrity_hash",
]);

const LEGAL_STATES: readonly AdaptationProposalLifecycleState[] = Object.freeze([
  "DRAFT",
  "VALIDATED",
  "REQUIRES_SIMULATION",
  "REQUIRES_GOVERNANCE_REVIEW",
  "REQUIRES_OPERATOR_REVIEW",
  "APPROVED_FOR_CERTIFICATION",
  "CERTIFIED",
  "REJECTED",
  "SUPPRESSED",
  "ROLLED_BACK",
  "ARCHIVED",
]);

type Scenario = NonNullable<AdaptationProposalContractInput["scenario"]>;

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

function buildApiSurface(): AdaptationProposalApiSurface {
  const base: Omit<AdaptationProposalApiSurface, "integrity_hash"> = {
    api_id: "adaptation_proposal_contract_api",
    validate_proposal: "POST /adaptation-proposal-contract/validate",
    retrieve_proposal: "POST /adaptation-proposal-contract/proposal",
    retrieve_schema: "GET /adaptation-proposal-contract/schema",
    retrieve_contract: "GET /adaptation-proposal-contract/contract",
    replay_validation: "POST /adaptation-proposal-contract/replay",
    inspect_contract: "POST /adaptation-proposal-contract/inspect",
    proposal_mutation_supported: false,
    production_mutation_supported: false,
    policy_mutation_supported: false,
    recommendation_deployment_supported: false,
    model_retraining_supported: false,
    governance_change_supported: false,
    confidence_calibration_supported: false,
    risk_calibration_supported: false,
    strategy_mutation_supported: false,
    evidence_modification_supported: false,
    operator_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function adaptationTypeFor(scenario: Scenario): AdaptationType {
  if (scenario === "CONFIDENCE") return "CONFIDENCE_CALIBRATION";
  if (scenario === "RISK") return "RISK_RECALIBRATION";
  if (scenario === "GOVERNANCE") return "GOVERNANCE_REFINEMENT";
  if (scenario === "EVIDENCE_REQUIREMENT") return "EVIDENCE_REQUIREMENT";
  if (scenario === "SIMULATION_REQUIREMENT") return "SIMULATION_REQUIREMENT";
  if (scenario === "OPERATOR_WORKFLOW") return "OPERATOR_WORKFLOW";
  return "STRATEGY_IMPROVEMENT";
}

function analysis(kind: string, scenario: Scenario, missing: boolean): AdaptationProposalAnalysis {
  const base: Omit<AdaptationProposalAnalysis, "integrity_hash"> = {
    analysis_id: `adaptation_proposal_${kind}_${hash(`${kind}:${scenario}`).slice(0, 12)}`,
    summary: missing ? "" : `${kind} analysis is mandatory, evidence-backed, and replayable.`,
    impacts: missing ? freezeArray([]) : freezeArray([`${kind}_mission_impact`, `${kind}_operator_impact`, `${kind}_governance_impact`]),
    constraints: missing ? freezeArray([]) : freezeArray(["advisory_only", "simulation_first", "approval_required"]),
    required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function approvalRequirements(highRisk: boolean): AdaptationProposalApprovalRequirements {
  const base: Omit<AdaptationProposalApprovalRequirements, "integrity_hash"> = {
    operator_approval_required: true,
    governance_approval_required: true,
    certification_approval_required: true,
    executive_governance_required: highRisk,
    allowed_approvers: highRisk ? freezeArray(["operator", "governance", "certification", "executive_governance"]) : freezeArray(["operator", "governance", "certification"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certificationRequirements(evidenceRefs: readonly string[]): AdaptationProposalCertificationRequirements {
  const base: Omit<AdaptationProposalCertificationRequirements, "integrity_hash"> = {
    certification_gate: "operator-feedback-certification-gate/v1",
    required_evidence: evidenceRefs,
    replay_validation_required: true,
    simulation_validation_required: true,
    governance_approval_required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rollbackPlan(evidenceRefs: readonly string[], replayRefs: readonly string[]): AdaptationProposalRollbackPlan {
  const base: Omit<AdaptationProposalRollbackPlan, "integrity_hash"> = {
    rollback_plan_id: `adaptation_rollback_${hash(evidenceRefs).slice(0, 14)}`,
    rollback_strategy: "restore previous certified recommendation behavior after governance-approved rollback",
    rollback_scope: "proposal_only_no_production_mutation",
    rollback_prerequisites: freezeArray(["certification_replay", "governance_review", "operator_notification"]),
    rollback_evidence_refs: evidenceRefs,
    rollback_replay_refs: replayRefs,
    required: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function directFailureFor(scenario: Scenario): AdaptationProposalFailure | undefined {
  const map: Partial<Record<AdaptationProposalScenario, AdaptationProposalFailure>> = {
    MISSING_PROPOSAL_ID: "PROPOSAL_ID_MISSING",
    MISSING_TENANT: "TENANT_MISSING",
    MISSING_ADAPTATION_TYPE: "ADAPTATION_TYPE_MISSING",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    MISSING_GOVERNANCE_ANALYSIS: "GOVERNANCE_ANALYSIS_MISSING",
    MISSING_CONSTITUTIONAL_ANALYSIS: "CONSTITUTIONAL_ANALYSIS_MISSING",
    MISSING_AUTHORITY_ANALYSIS: "AUTHORITY_ANALYSIS_MISSING",
    MISSING_BENEFIT_ANALYSIS: "BENEFIT_ANALYSIS_MISSING",
    MISSING_RISK_ANALYSIS: "RISK_ANALYSIS_MISSING",
    MISSING_OPERATOR_IMPACT: "OPERATOR_IMPACT_MISSING",
    INVALID_LIFECYCLE_STATE: "LIFECYCLE_STATE_INVALID",
    INVALID_INTEGRITY_HASH: "INTEGRITY_HASH_INVALID",
    CROSS_TENANT_REFERENCE: "CROSS_TENANT_REFERENCE_DETECTED",
    SCHEMA_VERSION_MISMATCH: "SCHEMA_VERSION_MISMATCH",
    LINEAGE_INCOMPLETE: "PROPOSAL_LINEAGE_INCOMPLETE",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_GUARANTEE_VIOLATED",
    PRODUCTION_MUTATION_ATTEMPT: "PRODUCTION_MUTATION_ATTEMPT",
    POLICY_MUTATION_ATTEMPT: "POLICY_MUTATION_ATTEMPT",
    RECOMMENDATION_DEPLOYMENT_ATTEMPT: "RECOMMENDATION_DEPLOYMENT_ATTEMPT",
    MODEL_RETRAINING_ATTEMPT: "MODEL_RETRAINING_ATTEMPT",
    GOVERNANCE_CHANGE_ATTEMPT: "GOVERNANCE_CHANGE_ATTEMPT",
    CONFIDENCE_CALIBRATION_ATTEMPT: "CONFIDENCE_CALIBRATION_ATTEMPT",
    RISK_CALIBRATION_ATTEMPT: "RISK_CALIBRATION_ATTEMPT",
    STRATEGY_MUTATION_ATTEMPT: "STRATEGY_MUTATION_ATTEMPT",
    EVIDENCE_MODIFICATION_ATTEMPT: "EVIDENCE_MODIFICATION_ATTEMPT",
    OPERATOR_BYPASS_ATTEMPT: "OPERATOR_BYPASS_ATTEMPT",
  };
  return map[scenario];
}

function buildProposal(input: AdaptationProposalContractInput, scenario: Scenario): AdaptationProposal {
  const certification = input.certification_result ?? certifyOperatorFeedbackIntegration();
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : certification.evidence_package.evidence_refs;
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : certification.evidence_package.replay_refs;
  const feedbackRefs = freezeArray([certification.contract_result.record.feedback_id, ...certification.ledger_result.records.map((record) => record.feedback_id)].filter(Boolean));
  const outcomeRefs = freezeArray(certification.ledger_result.evidence_history.telemetry_refs);
  const highRisk = ["RISK", "GOVERNANCE", "PRODUCTION_MUTATION_ATTEMPT", "POLICY_MUTATION_ATTEMPT", "GOVERNANCE_CHANGE_ATTEMPT"].includes(scenario);
  const tenantId = scenario === "MISSING_TENANT" ? "" : certification.contract_result.record.tenant_id;
  const proposal_id = scenario === "MISSING_PROPOSAL_ID" ? "" : `adaptation_proposal_${hash(`${tenantId}:${adaptationTypeFor(scenario)}:${evidenceRefs.join("|")}`).slice(0, 16)}`;
  const base: Omit<AdaptationProposal, "integrity_hash"> = {
    proposal_id,
    proposal_version: PROPOSAL_VERSION,
    tenant_id: tenantId,
    proposal_creation_timestamp: CREATED_AT,
    proposal_generator_version: CONTRACT_VERSION,
    contract_version: scenario === "SCHEMA_VERSION_MISMATCH" ? "adaptation-proposal-contract/v999" as "adaptation-proposal-contract/v1" : CONTRACT_VERSION,
    proposal_uuid: `uuid_${hash(proposal_id || scenario).slice(0, 20)}`,
    proposal_namespace: scenario === "CROSS_TENANT_REFERENCE" ? "tenant_foreign/adaptation" : `${tenantId}/adaptation`,
    mission_scope: certification.contract_result.record.mission_id,
    workflow_scope: "adaptive_intelligence_review",
    recommendation_scope: certification.contract_result.record.decision_package_id,
    capability_scope: "operator_feedback_informed_adaptation",
    strategy_scope: "mission_control_phase_10",
    confidence_scope: "advisory_confidence_assessment",
    risk_scope: "simulation_first_risk_review",
    evidence_scope: "immutable_feedback_and_outcome_evidence",
    governance_scope: "governance_review_required",
    operator_visibility_scope: "operator_review_required",
    adaptation_type: scenario === "MISSING_ADAPTATION_TYPE" ? "" as AdaptationType : adaptationTypeFor(scenario),
    proposal_summary: "Improve adaptive intelligence using certified operator feedback evidence.",
    proposed_change: "Create a simulation-first advisory proposal for future governance review.",
    reason_for_change: "Certified feedback, replay, and analytics indicate measurable improvement potential.",
    supporting_outcome_refs: outcomeRefs,
    supporting_pattern_refs: freezeArray(["operator_feedback_pattern_001", "recurring_adaptation_signal_001"]),
    supporting_feedback_refs: feedbackRefs,
    supporting_evidence_refs: evidenceRefs,
    supporting_recommendation_history_refs: freezeArray([certification.contract_result.record.decision_package_id]),
    supporting_replay_history_refs: replayRefs,
    supporting_simulation_history_refs: freezeArray(["simulation_history_adaptation_contract_001"]),
    expected_benefit: analysis("benefit", scenario, scenario === "MISSING_BENEFIT_ANALYSIS"),
    expected_risk: analysis("risk", scenario, scenario === "MISSING_RISK_ANALYSIS"),
    confidence_score: 0.84,
    risk_score: highRisk ? 0.78 : 0.34,
    governance_impact: analysis("governance", scenario, scenario === "MISSING_GOVERNANCE_ANALYSIS"),
    constitutional_impact: analysis("constitutional", scenario, scenario === "MISSING_CONSTITUTIONAL_ANALYSIS"),
    authority_impact: analysis("authority", scenario, scenario === "MISSING_AUTHORITY_ANALYSIS"),
    operator_impact: analysis("operator", scenario, scenario === "MISSING_OPERATOR_IMPACT"),
    simulation_required: true,
    replay_required: true,
    approval_required: true,
    certification_required: true,
    rollback_plan_required: true,
    approval_requirements: approvalRequirements(highRisk),
    certification_requirements: certificationRequirements(evidenceRefs),
    rollback_plan: rollbackPlan(evidenceRefs, replayRefs),
    proposal_state: scenario === "INVALID_LIFECYCLE_STATE" ? "IMPLEMENTED" as AdaptationProposalLifecycleState : highRisk ? "REQUIRES_SIMULATION" : "DRAFT",
    replay_refs: replayRefs,
    lineage_refs: scenario === "LINEAGE_INCOMPLETE" ? freezeArray([]) : freezeArray([certification.evidence_package.package_id, certification.ledger_result.certification_lineage.certification_id, certification.analytics_result.replay_explorer.explorer_id]),
    advisory_only: true,
    mutates_production: false,
    mutates_policy: false,
    deploys_recommendations: false,
    retrains_models: false,
    changes_governance: false,
    calibrates_confidence: false,
    calibrates_risk: false,
    mutates_strategy: false,
    modifies_evidence: false,
    bypasses_operator: false,
  };
  const merged = Object.freeze({ ...base, ...input.proposal }) as Omit<AdaptationProposal, "integrity_hash">;
  const proposal = Object.freeze({ ...merged, integrity_hash: hashWithoutIntegrity(merged) });
  if (scenario === "INVALID_INTEGRITY_HASH") return Object.freeze({ ...proposal, integrity_hash: "invalid_adaptation_proposal_hash" });
  if (scenario === "PRODUCTION_MUTATION_ATTEMPT") return Object.freeze({ ...proposal, mutates_production: true as false });
  if (scenario === "POLICY_MUTATION_ATTEMPT") return Object.freeze({ ...proposal, mutates_policy: true as false });
  if (scenario === "RECOMMENDATION_DEPLOYMENT_ATTEMPT") return Object.freeze({ ...proposal, deploys_recommendations: true as false });
  if (scenario === "MODEL_RETRAINING_ATTEMPT") return Object.freeze({ ...proposal, retrains_models: true as false });
  if (scenario === "GOVERNANCE_CHANGE_ATTEMPT") return Object.freeze({ ...proposal, changes_governance: true as false });
  if (scenario === "CONFIDENCE_CALIBRATION_ATTEMPT") return Object.freeze({ ...proposal, calibrates_confidence: true as false });
  if (scenario === "RISK_CALIBRATION_ATTEMPT") return Object.freeze({ ...proposal, calibrates_risk: true as false });
  if (scenario === "STRATEGY_MUTATION_ATTEMPT") return Object.freeze({ ...proposal, mutates_strategy: true as false });
  if (scenario === "EVIDENCE_MODIFICATION_ATTEMPT") return Object.freeze({ ...proposal, modifies_evidence: true as false });
  if (scenario === "OPERATOR_BYPASS_ATTEMPT") return Object.freeze({ ...proposal, bypasses_operator: true as false });
  if (scenario === "ADVISORY_ONLY_VIOLATION") return Object.freeze({ ...proposal, advisory_only: false as true });
  return proposal;
}

function collectFailures(proposal: AdaptationProposal, certificationReplayValid: boolean, scenario: Scenario): readonly AdaptationProposalFailure[] {
  const failures: AdaptationProposalFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  if (!proposal.proposal_id) failures.push("PROPOSAL_ID_MISSING");
  if (!proposal.tenant_id) failures.push("TENANT_MISSING");
  if (!proposal.adaptation_type) failures.push("ADAPTATION_TYPE_MISSING");
  if (!proposal.supporting_evidence_refs.length) failures.push("EVIDENCE_MISSING");
  if (!proposal.replay_refs.length || !proposal.supporting_replay_history_refs.length || !certificationReplayValid) failures.push("REPLAY_REFERENCES_MISSING");
  if (!proposal.governance_impact.summary || !proposal.governance_impact.impacts.length) failures.push("GOVERNANCE_ANALYSIS_MISSING");
  if (!proposal.constitutional_impact.summary || !proposal.constitutional_impact.impacts.length) failures.push("CONSTITUTIONAL_ANALYSIS_MISSING");
  if (!proposal.authority_impact.summary || !proposal.authority_impact.impacts.length) failures.push("AUTHORITY_ANALYSIS_MISSING");
  if (!proposal.expected_benefit.summary || !proposal.expected_benefit.impacts.length) failures.push("BENEFIT_ANALYSIS_MISSING");
  if (!proposal.expected_risk.summary || !proposal.expected_risk.impacts.length) failures.push("RISK_ANALYSIS_MISSING");
  if (!proposal.operator_impact.summary || !proposal.operator_impact.impacts.length) failures.push("OPERATOR_IMPACT_MISSING");
  if (!LEGAL_STATES.includes(proposal.proposal_state)) failures.push("LIFECYCLE_STATE_INVALID");
  if (proposal.integrity_hash !== hashWithoutIntegrity(proposal)) failures.push("INTEGRITY_HASH_INVALID");
  if (proposal.proposal_namespace && !proposal.proposal_namespace.startsWith(`${proposal.tenant_id}/`)) failures.push("CROSS_TENANT_REFERENCE_DETECTED");
  if (scenario === "INVALID_INTEGRITY_HASH") failures.push("PROPOSAL_HASH_MISMATCH");
  if (proposal.contract_version !== CONTRACT_VERSION || proposal.proposal_version !== PROPOSAL_VERSION) failures.push("SCHEMA_VERSION_MISMATCH");
  if (!proposal.lineage_refs.length || !proposal.supporting_feedback_refs.length || !proposal.supporting_outcome_refs.length) failures.push("PROPOSAL_LINEAGE_INCOMPLETE");
  if (!proposal.advisory_only) failures.push("ADVISORY_ONLY_GUARANTEE_VIOLATED");
  if (proposal.mutates_production) failures.push("PRODUCTION_MUTATION_ATTEMPT");
  if (proposal.mutates_policy) failures.push("POLICY_MUTATION_ATTEMPT");
  if (proposal.deploys_recommendations) failures.push("RECOMMENDATION_DEPLOYMENT_ATTEMPT");
  if (proposal.retrains_models) failures.push("MODEL_RETRAINING_ATTEMPT");
  if (proposal.changes_governance) failures.push("GOVERNANCE_CHANGE_ATTEMPT");
  if (proposal.calibrates_confidence) failures.push("CONFIDENCE_CALIBRATION_ATTEMPT");
  if (proposal.calibrates_risk) failures.push("RISK_CALIBRATION_ATTEMPT");
  if (proposal.mutates_strategy) failures.push("STRATEGY_MUTATION_ATTEMPT");
  if (proposal.modifies_evidence) failures.push("EVIDENCE_MODIFICATION_ATTEMPT");
  if (proposal.bypasses_operator) failures.push("OPERATOR_BYPASS_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(proposal: AdaptationProposal, failures: readonly AdaptationProposalFailure[]): AdaptationProposalValidationReport {
  const has = (failure: AdaptationProposalFailure) => failures.includes(failure);
  const base: Omit<AdaptationProposalValidationReport, "integrity_hash"> = {
    validation_id: `adaptation_proposal_validation_${hash(proposal.proposal_id || "missing").slice(0, 14)}`,
    state: failures.length ? "FAILED" : "CERTIFIED",
    certified: failures.length === 0,
    failures,
    identity_valid: !has("PROPOSAL_ID_MISSING") && !has("TENANT_MISSING") && !has("SCHEMA_VERSION_MISMATCH"),
    scope_valid: Boolean(proposal.mission_scope && proposal.workflow_scope && proposal.capability_scope),
    intent_valid: !has("ADAPTATION_TYPE_MISSING") && Boolean(proposal.proposal_summary && proposal.proposed_change && proposal.reason_for_change),
    evidence_complete: !has("EVIDENCE_MISSING"),
    benefit_complete: !has("BENEFIT_ANALYSIS_MISSING"),
    risk_complete: !has("RISK_ANALYSIS_MISSING"),
    governance_complete: !has("GOVERNANCE_ANALYSIS_MISSING"),
    constitutional_complete: !has("CONSTITUTIONAL_ANALYSIS_MISSING"),
    authority_complete: !has("AUTHORITY_ANALYSIS_MISSING"),
    operator_impact_complete: !has("OPERATOR_IMPACT_MISSING"),
    simulation_required: proposal.simulation_required,
    replay_complete: !has("REPLAY_REFERENCES_MISSING"),
    approval_required: proposal.approval_required,
    certification_required: proposal.certification_required,
    rollback_complete: proposal.rollback_plan_required && proposal.rollback_plan.rollback_evidence_refs.length > 0 && proposal.rollback_plan.rollback_replay_refs.length > 0,
    lifecycle_state_valid: !has("LIFECYCLE_STATE_INVALID"),
    integrity_verified: !has("INTEGRITY_HASH_INVALID") && !has("PROPOSAL_HASH_MISMATCH"),
    tenant_isolated: !has("CROSS_TENANT_REFERENCE_DETECTED"),
    advisory_only_enforced: !failures.some((failure) => failure.endsWith("_ATTEMPT") || failure === "ADVISORY_ONLY_GUARANTEE_VIOLATED"),
    fail_closed: failures.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptationProposalContractResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    certification_hash: result.certification_result.integrity_hash,
    proposal: result.proposal,
    validation: result.validation_report,
    state: result.validation_state,
  });
}

function resultIntegrityHash(result: Omit<AdaptationProposalContractResult, "integrity_hash">): string {
  return hash({
    contract_version: result.adaptation_proposal_contract_version,
    schema_version: result.schema_version,
    api_surface_hash: result.api_surface.integrity_hash,
    proposal_hash: result.proposal.integrity_hash,
    validation_hash: result.validation_report.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateAdaptationProposalContract(input: AdaptationProposalContractInput = {}): AdaptationProposalContractResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const certification_result = input.certification_result ?? certifyOperatorFeedbackIntegration();
  const proposal = buildProposal({ ...input, certification_result }, scenario);
  const certificationReplayValid = replayOperatorFeedbackCertificationGate(certification_result);
  const failures = collectFailures(proposal, certificationReplayValid, scenario);
  const validation_report = buildValidation(proposal, failures);
  const base: Omit<AdaptationProposalContractResult, "integrity_hash" | "replay_hash"> = {
    adaptation_proposal_contract_version: CONTRACT_VERSION,
    schema_version: SCHEMA_VERSION,
    api_surface,
    certification_result,
    proposal,
    validation_report,
    validation_state: validation_report.state,
    failures,
    deterministic: true,
    replayable: failures.length === 0 && certificationReplayValid,
    explainable: Boolean(proposal.reason_for_change && proposal.expected_benefit.summary && proposal.expected_risk.summary),
    evidence_backed: proposal.supporting_evidence_refs.length > 0,
    governance_enforced: validation_report.governance_complete && validation_report.certification_required && validation_report.approval_required,
    constitutional_compliant: validation_report.constitutional_complete,
    tenant_isolated: validation_report.tenant_isolated,
    advisory_only: true,
    fail_closed: failures.length > 0,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationProposalContract(result: AdaptationProposalContractResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAdaptationProposalContractFoundation(): AdaptationProposalContractFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_proposal_contract_version: CONTRACT_VERSION,
    schema_fields: SCHEMA_FIELDS,
    legal_lifecycle_states: LEGAL_STATES,
    api_surface,
    result: validateAdaptationProposalContract(),
  });
}

export const AdaptationProposalContract = Object.freeze({
  validate: validateAdaptationProposalContract,
  replay: replayAdaptationProposalContract,
});
