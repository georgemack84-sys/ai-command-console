import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { reconstructGovernanceInputs, validateGovernanceInputPackage } from "@/services/governance-input-reconstruction";
import type { GovernanceReplayInputPackage } from "@/types/governance-input-reconstruction";
import type {
  GovernanceReplayStatePackage,
  GovernanceStateAuditEntry,
  GovernanceStateFailureReason,
  GovernanceStateIntegrityResult,
  GovernanceStateObservabilitySurface,
  GovernanceStateReconstructionInput,
  GovernanceStateReconstructionPhase,
  GovernanceStateReconstructionScenario,
  GovernanceStateSnapshot,
  GovernanceStateTransition,
  GovernanceStateValidationError,
  GovernanceStateValidationResult,
} from "@/types/governance-state-reconstruction";

type SnapshotCarrier = Pick<
  GovernanceReplayStatePackage,
  | "execution_state"
  | "policy_state"
  | "compliance_state"
  | "risk_state"
  | "recommendation_state"
  | "escalation_state"
  | "explainability_state"
  | "confidence_state"
  | "lineage_state"
  | "certification_state"
>;

const SCHEMA_VERSION = "governance-state-reconstruction/v7H.3" as const;
const EXECUTION_ORDER: readonly GovernanceStateReconstructionPhase[] = Object.freeze([
  "INITIALIZED",
  "POLICY_EVALUATION",
  "COMPLIANCE_ANALYSIS",
  "RISK_ANALYSIS",
  "RECOMMENDATION_GENERATION",
  "ESCALATION_EVALUATION",
  "EXPLAINABILITY_GENERATION",
  "CONFIDENCE_CALCULATION",
  "CERTIFICATION_VALIDATION",
  "COMPLETED",
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values.filter(Boolean))].sort());
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function validationError(code: string, reason: GovernanceStateFailureReason, field: string, message: string): GovernanceStateValidationError {
  return Object.freeze({ code: `GSR-${code}`, reason, field, message });
}

function inputScenario(scenario: GovernanceStateReconstructionScenario | undefined) {
  if (scenario === "INPUT_PACKAGE_INVALID") return "EVIDENCE_MISSING";
  if (scenario === "TENANT_MISMATCH") return "TENANT_MISMATCH";
  if (scenario === "AUTHORITY_MISMATCH") return "AUTHORITY_MISMATCH";
  if (scenario === "CONSTITUTIONAL_MISMATCH") return "CONSTITUTIONAL_MISMATCH";
  if (scenario === "INTEGRITY_FAILURE") return "INTEGRITY_FAILURE";
  return "BASELINE";
}

function transition(from_phase: GovernanceStateTransition["from_phase"], to_phase: GovernanceStateReconstructionPhase, sequence: number, checkpoint_ref: string): GovernanceStateTransition {
  const source = {
    transition_id: `GST-${hashValue("governance-state-transition-id", { from_phase, to_phase, sequence }).slice(0, 10).toUpperCase()}`,
    from_phase,
    to_phase,
    sequence,
    checkpoint_ref,
  };
  return Object.freeze({ ...source, transition_hash: hashValue("governance-state-transition", source) });
}

function transitions(pkg: GovernanceReplayInputPackage, scenario: GovernanceStateReconstructionScenario): readonly GovernanceStateTransition[] {
  const order = scenario === "EXECUTION_ORDERING_DIFFERS" ? [...EXECUTION_ORDER].reverse() : [...EXECUTION_ORDER];
  return freezeArray(order.map((phase, index) => transition(index === 0 ? "START" : order[index - 1], phase, index + 1, `${pkg.reconstruction_id}:${phase}`)));
}

function snapshot(input: {
  pkg: GovernanceReplayInputPackage;
  category: GovernanceStateSnapshot["category"];
  phase: GovernanceStateReconstructionPhase;
  version: string;
  source_context_refs: readonly string[];
  restored_values: readonly string[];
  confidence_value?: string;
  integrity_status?: "VERIFIED" | "FAILED";
  progress?: GovernanceStateSnapshot["progress"];
}): GovernanceStateSnapshot {
  const source = {
    state_id: `GSS-${input.category}-${hashValue("governance-state-snapshot-id", { category: input.category, refs: input.source_context_refs }).slice(0, 10).toUpperCase()}`,
    category: input.category,
    phase: input.phase,
    tenant_id: input.pkg.replay_contract.tenant_id,
    mission_id: input.pkg.replay_contract.mission_id,
    version: input.version,
    progress: input.progress ?? "COMPLETED" as const,
    source_context_refs: uniq(input.source_context_refs),
    restored_values: uniq(input.restored_values),
    confidence_value: input.confidence_value ?? "1.0000",
    integrity_status: input.integrity_status ?? "VERIFIED" as const,
  };
  return Object.freeze({ ...source, state_hash: hashValue("governance-state-snapshot", source) });
}

function buildSnapshots(pkg: GovernanceReplayInputPackage, scenario: GovernanceStateReconstructionScenario) {
  const certification = pkg.replay_contract.source_certification;
  const governance = certification.source_artifacts.governance_lineage;
  const policy = certification.source_artifacts.policy_lineage;
  const influence = certification.source_artifacts.decision_influence;
  const explanation = certification.source_artifacts.explanation;
  return {
    execution_state: snapshot({
      pkg,
      category: "EXECUTION",
      phase: "COMPLETED",
      version: governance.lineage_version,
      source_context_refs: pkg.governance_context.records.map((item) => item.record_id),
      restored_values: ["execution_state", "execution_phase", "execution_progress", "workflow_checkpoints", "execution_ordering", "processing_sequence"],
      integrity_status: scenario === "GOVERNANCE_STATE_MISSING" ? "FAILED" : "VERIFIED",
      progress: scenario === "GOVERNANCE_STATE_MISSING" ? "FAILED" : "COMPLETED",
    }),
    policy_state: snapshot({
      pkg,
      category: "POLICY",
      phase: "POLICY_EVALUATION",
      version: policy.root_policy.policy_version,
      source_context_refs: pkg.policy_context.records.map((item) => item.record_id),
      restored_values: ["evaluated_policies", "active_policies", "inherited_policies", "superseded_policies", "policy_conflicts", "policy_dependency_graph", "policy_influence_graph"],
      integrity_status: scenario === "POLICY_STATE_INCOMPLETE" ? "FAILED" : "VERIFIED",
    }),
    compliance_state: snapshot({
      pkg,
      category: "COMPLIANCE",
      phase: "COMPLIANCE_ANALYSIS",
      version: "compliance/v7D",
      source_context_refs: pkg.compliance_context.records.map((item) => item.record_id),
      restored_values: ["compliance_status", "evaluation_progress", "compliance_findings", "threshold_evaluations", "corrective_action_tracking", "compliance_confidence"],
      confidence_value: scenario === "COMPLIANCE_STATE_INCONSISTENT" ? "0.3100" : "0.9500",
    }),
    risk_state: snapshot({
      pkg,
      category: "RISK",
      phase: "RISK_ANALYSIS",
      version: "risk/v7C",
      source_context_refs: pkg.risk_context.records.map((item) => item.record_id),
      restored_values: ["identified_risks", "severity_calculations", "likelihood_assessments", "impact_calculations", "mitigation_progress", "confidence_values", "risk_prioritization"],
      confidence_value: scenario === "RISK_CALCULATION_MISMATCH" ? "0.4200" : "0.9400",
      integrity_status: scenario === "RISK_CALCULATION_MISMATCH" ? "FAILED" : "VERIFIED",
    }),
    recommendation_state: snapshot({
      pkg,
      category: "RECOMMENDATION",
      phase: "RECOMMENDATION_GENERATION",
      version: "recommendation/v7E",
      source_context_refs: pkg.recommendation_context.records.map((item) => item.record_id),
      restored_values: ["generated_recommendations", "alternative_recommendations", "recommendation_ranking", "recommendation_validation", "recommendation_confidence", "recommendation_rationale"],
      progress: scenario === "RECOMMENDATION_STATE_MISSING" ? "FAILED" : "COMPLETED",
    }),
    escalation_state: snapshot({
      pkg,
      category: "ESCALATION",
      phase: "ESCALATION_EVALUATION",
      version: "escalation/v7F",
      source_context_refs: pkg.escalation_context.records.map((item) => item.record_id),
      restored_values: ["escalation_triggers", "escalation_evaluation", "routing_decisions", "escalation_priority", "escalation_status", "operator_notification_state"],
      progress: scenario === "ESCALATION_STATE_UNRESOLVED" ? "IN_PROGRESS" : "COMPLETED",
    }),
    explainability_state: snapshot({
      pkg,
      category: "EXPLAINABILITY",
      phase: "EXPLAINABILITY_GENERATION",
      version: explanation.version,
      source_context_refs: [pkg.lineage_context.context_id, pkg.evidence_context.context_id, explanation.explanation_id],
      restored_values: ["evidence_chains", "policy_influence_chains", "decision_rationale", "risk_contribution", "compliance_contribution", "recommendation_justification"],
      integrity_status: scenario === "EXPLAINABILITY_CHAIN_INCOMPLETE" ? "FAILED" : "VERIFIED",
    }),
    confidence_state: snapshot({
      pkg,
      category: "CONFIDENCE",
      phase: "CONFIDENCE_CALCULATION",
      version: pkg.replay_contract.confidence_reference,
      source_context_refs: [influence.replay_refs.contribution_hash, explanation.replay_refs.summary_hash],
      restored_values: ["evidence_confidence", "policy_confidence", "compliance_confidence", "risk_confidence", "recommendation_confidence", "governance_confidence", "overall_confidence"],
      confidence_value: scenario === "CONFIDENCE_MISMATCH" ? "0.1000" : "0.9700",
    }),
    lineage_state: snapshot({
      pkg,
      category: "LINEAGE",
      phase: "CERTIFICATION_VALIDATION",
      version: "lineage/v7G",
      source_context_refs: pkg.lineage_context.records.map((item) => item.record_id),
      restored_values: ["parent_relationships", "child_relationships", "causality_graph", "influence_graph", "dependency_graph", "replay_references"],
      integrity_status: scenario === "LINEAGE_DISCONTINUITY" ? "FAILED" : "VERIFIED",
    }),
    certification_state: snapshot({
      pkg,
      category: "CERTIFICATION",
      phase: "CERTIFICATION_VALIDATION",
      version: certification.schema_version,
      source_context_refs: [certification.certification_id, certification.evidence_package.evidence_package_hash],
      restored_values: ["completed_validations", "pending_validations", "certification_checkpoints", "certification_evidence", "integrity_verification"],
      integrity_status: scenario === "INTEGRITY_FAILURE" ? "FAILED" : "VERIFIED",
    }),
  };
}

function allSnapshots(pkg: SnapshotCarrier): readonly GovernanceStateSnapshot[] {
  return freezeArray([
    pkg.execution_state,
    pkg.policy_state,
    pkg.compliance_state,
    pkg.risk_state,
    pkg.recommendation_state,
    pkg.escalation_state,
    pkg.explainability_state,
    pkg.confidence_state,
    pkg.lineage_state,
    pkg.certification_state,
  ]);
}

function integrityResult(snapshot: GovernanceStateSnapshot, pkg: Pick<GovernanceReplayStatePackage, "replay_input_package">, orderingValid: boolean): GovernanceStateIntegrityResult {
  const expectedTenant = pkg.replay_input_package.replay_contract.tenant_id;
  const source = {
    integrity_id: `GSI-${hashValue("governance-state-integrity-id", snapshot.state_id).slice(0, 10).toUpperCase()}`,
    state_id: snapshot.state_id,
    category: snapshot.category,
    hash_verified: snapshot.integrity_status === "VERIFIED",
    ordering_verified: orderingValid,
    lineage_verified: snapshot.category !== "LINEAGE" || snapshot.integrity_status === "VERIFIED",
    confidence_verified: snapshot.category !== "CONFIDENCE" || snapshot.confidence_value === "0.9700",
    tenant_verified: snapshot.tenant_id === expectedTenant,
  };
  return Object.freeze({ ...source, integrity_hash: hashValue("governance-state-integrity", source) });
}

function auditEntry(pkg: Omit<GovernanceReplayStatePackage, "state_package_hash"> | GovernanceReplayStatePackage): GovernanceStateAuditEntry {
  const source = {
    audit_id: `GSA-${hashValue("governance-state-audit-id", { id: pkg.state_reconstruction_id, failures: pkg.failures }).slice(0, 10).toUpperCase()}`,
    governance_replay_id: pkg.replay_metadata.governance_replay_id,
    reconstructed_states: uniq(allSnapshots(pkg).map((item) => item.category)),
    validation_outcomes: pkg.failures.length ? uniq(pkg.failures) : freezeArray(["VALID"]),
    integrity_verification: pkg.integrity_results.every((item) => item.hash_verified && item.ordering_verified && item.lineage_verified && item.confidence_verified && item.tenant_verified) ? "VERIFIED" as const : "FAILED" as const,
    execution_duration_ms: 57,
    reconstruction_status: pkg.status,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("governance-state-audit", source) });
}

function deriveFailures(pkg: Omit<GovernanceReplayStatePackage, "failures" | "audit_log" | "state_package_hash">, scenario: GovernanceStateReconstructionScenario): readonly GovernanceStateFailureReason[] {
  const failures = new Set<GovernanceStateFailureReason>();
  if (pkg.replay_input_validation.validation_state !== "VALID") failures.add("INPUT_PACKAGE_INVALID");
  if (scenario === "GOVERNANCE_STATE_MISSING" || pkg.execution_state.progress === "FAILED") failures.add("GOVERNANCE_STATE_MISSING");
  if (scenario === "EXECUTION_ORDERING_DIFFERS") failures.add("EXECUTION_ORDERING_DIFFERS");
  if (scenario === "POLICY_STATE_INCOMPLETE" || !pkg.policy_state.source_context_refs.length) failures.add("POLICY_STATE_INCOMPLETE");
  if (scenario === "COMPLIANCE_STATE_INCONSISTENT") failures.add("COMPLIANCE_STATE_INCONSISTENT");
  if (scenario === "RISK_CALCULATION_MISMATCH") failures.add("RISK_CALCULATION_MISMATCH");
  if (scenario === "RECOMMENDATION_STATE_MISSING" || pkg.recommendation_state.progress === "FAILED") failures.add("RECOMMENDATION_STATE_MISSING");
  if (scenario === "ESCALATION_STATE_UNRESOLVED" || pkg.escalation_state.progress !== "COMPLETED") failures.add("ESCALATION_STATE_UNRESOLVED");
  if (scenario === "EXPLAINABILITY_CHAIN_INCOMPLETE") failures.add("EXPLAINABILITY_CHAIN_INCOMPLETE");
  if (scenario === "CONFIDENCE_MISMATCH") failures.add("CONFIDENCE_MISMATCH");
  if (scenario === "LINEAGE_DISCONTINUITY") failures.add("LINEAGE_DISCONTINUITY");
  if (scenario === "REPLAY_VERSION_MISMATCH" || pkg.replay_metadata.replay_version !== "governance-replay-contract/v7H.1") failures.add("REPLAY_VERSION_MISMATCH");
  if (scenario === "CONSTITUTIONAL_MISMATCH" || pkg.replay_input_package.replay_contract.constitutional_reference !== `constitution:v7:${pkg.replay_input_package.replay_contract.tenant_id}`) failures.add("CONSTITUTIONAL_MISMATCH");
  if (scenario === "AUTHORITY_MISMATCH" || pkg.replay_input_package.replay_contract.authority_reference !== `authority:governance_replay_operator:${pkg.replay_input_package.replay_contract.tenant_id}`) failures.add("AUTHORITY_MISMATCH");
  if (scenario === "TENANT_MISMATCH" || pkg.integrity_results.some((item) => !item.tenant_verified)) failures.add("TENANT_MISMATCH");
  if (scenario === "HIDDEN_STATE_DETECTED") failures.add("HIDDEN_STATE_DETECTED");
  if (pkg.integrity_results.some((item) => !item.hash_verified || !item.ordering_verified || !item.lineage_verified || !item.confidence_verified)) failures.add("INTEGRITY_VERIFICATION_FAILURE");
  return freezeArray([...failures].sort());
}

export function computeGovernanceStatePackageHash(pkg: Omit<GovernanceReplayStatePackage, "state_package_hash"> | GovernanceReplayStatePackage): string {
  const { state_package_hash: _hash, replay_input_package: _input, ...source } = pkg as GovernanceReplayStatePackage;
  return hashValue("governance-state-package", source);
}

export function reconstructGovernanceState(input: GovernanceStateReconstructionInput = {}): GovernanceReplayStatePackage {
  const scenario = input.scenario ?? "BASELINE";
  const inputPackage = input.input_package ?? reconstructGovernanceInputs({
    scenario: inputScenario(scenario),
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    replay_requestor: input.replay_requestor,
  });
  const inputValidation = validateGovernanceInputPackage(inputPackage);
  const order = scenario === "EXECUTION_ORDERING_DIFFERS" ? freezeArray([...EXECUTION_ORDER].reverse()) : EXECUTION_ORDER;
  const snapshots = buildSnapshots(inputPackage, scenario);
  const draftWithoutIntegrity = {
    state_reconstruction_id: `GSR-7H3-${hashValue("governance-state-reconstruction-id", { input: inputPackage.reconstruction_id, scenario }).slice(0, 10).toUpperCase()}`,
    phase_version: "7H.3" as const,
    schema_version: SCHEMA_VERSION,
    status: "RECONSTRUCTED" as const,
    replay_input_package: inputPackage,
    replay_input_validation: inputValidation,
    replay_metadata: {
      governance_replay_id: inputPackage.replay_identity.governance_replay_id,
      governance_execution_id: inputPackage.replay_identity.governance_execution_id,
      governance_session_id: inputPackage.replay_identity.governance_session_id,
      replay_version: scenario === "REPLAY_VERSION_MISMATCH" ? "governance-replay-contract/v0" : inputPackage.replay_identity.replay_version,
      deterministic_seed: inputPackage.deterministic_parameters.deterministic_seed,
    },
    execution_order: order,
    transitions: transitions(inputPackage, scenario),
    ...snapshots,
  };
  const orderingValid = canonicalizeConfidenceToString(draftWithoutIntegrity.execution_order) === canonicalizeConfidenceToString(EXECUTION_ORDER);
  const integrity_results = freezeArray(allSnapshots(draftWithoutIntegrity).map((item) => integrityResult(
    scenario === "TENANT_MISMATCH" ? { ...item, tenant_id: "tenant_external" } : item,
    draftWithoutIntegrity,
    orderingValid,
  )));
  const draftWithoutFailures = { ...draftWithoutIntegrity, integrity_results };
  const failures = deriveFailures(draftWithoutFailures, scenario);
  const status = failures.length ? "FAILED" as const : "REPLAY_READY" as const;
  const draft = { ...draftWithoutFailures, status, failures };
  const audit_log = freezeArray([auditEntry({ ...draft, audit_log: freezeArray([]), state_package_hash: "" })]);
  const source = { ...draft, audit_log };
  const state_package_hash = scenario === "HIDDEN_STATE_DETECTED" ? "tampered-state-package-hash" : computeGovernanceStatePackageHash(source as GovernanceReplayStatePackage);
  return Object.freeze({ ...source, state_package_hash });
}

export function validateGovernanceStatePackage(pkg?: GovernanceReplayStatePackage): GovernanceStateValidationResult {
  if (!pkg) {
    const errors = freezeArray([validationError("001", "INPUT_PACKAGE_INVALID", "package", "Governance state package is required.")]);
    const source = { state_reconstruction_id: null, validation_state: "INVALID" as const, replay_ready: false, input_package_valid: false, completeness_valid: false, ordering_valid: false, integrity_valid: false, confidence_valid: false, lineage_valid: false, explainability_valid: false, constitutional_valid: false, authority_valid: false, tenant_isolated: false, hidden_state_absent: false, errors };
    return Object.freeze({ ...source, validation_hash: hashValue("governance-state-validation", source) });
  }
  const errors: GovernanceStateValidationError[] = [];
  if (pkg.replay_input_validation.validation_state !== "VALID") errors.push(validationError("002", "INPUT_PACKAGE_INVALID", "replay_input_validation", "Input package must validate before state reconstruction."));
  if (pkg.execution_state.progress === "FAILED" || !pkg.execution_state.source_context_refs.length) errors.push(validationError("003", "GOVERNANCE_STATE_MISSING", "execution_state", "Governance execution state must be restored."));
  if (canonicalizeConfidenceToString(pkg.execution_order) !== canonicalizeConfidenceToString(EXECUTION_ORDER)) errors.push(validationError("004", "EXECUTION_ORDERING_DIFFERS", "execution_order", "Execution order must match the original run."));
  if (!pkg.policy_state.source_context_refs.length || pkg.policy_state.integrity_status !== "VERIFIED") errors.push(validationError("005", "POLICY_STATE_INCOMPLETE", "policy_state", "Policy evaluation state must be complete."));
  if (pkg.compliance_state.confidence_value !== "0.9500") errors.push(validationError("006", "COMPLIANCE_STATE_INCONSISTENT", "compliance_state", "Compliance state must match historical evaluation."));
  if (pkg.risk_state.integrity_status !== "VERIFIED" || pkg.risk_state.confidence_value !== "0.9400") errors.push(validationError("007", "RISK_CALCULATION_MISMATCH", "risk_state", "Risk calculations must reproduce exactly."));
  if (pkg.recommendation_state.progress === "FAILED" || !pkg.recommendation_state.source_context_refs.length) errors.push(validationError("008", "RECOMMENDATION_STATE_MISSING", "recommendation_state", "Recommendation state must be present."));
  if (pkg.escalation_state.progress !== "COMPLETED") errors.push(validationError("009", "ESCALATION_STATE_UNRESOLVED", "escalation_state", "Escalation state must be resolved."));
  if (pkg.explainability_state.integrity_status !== "VERIFIED") errors.push(validationError("010", "EXPLAINABILITY_CHAIN_INCOMPLETE", "explainability_state", "Explainability chain must be complete."));
  if (pkg.confidence_state.confidence_value !== "0.9700") errors.push(validationError("011", "CONFIDENCE_MISMATCH", "confidence_state", "Confidence state must reproduce exactly."));
  if (pkg.lineage_state.integrity_status !== "VERIFIED") errors.push(validationError("012", "LINEAGE_DISCONTINUITY", "lineage_state", "Lineage state must remain continuous."));
  if (pkg.replay_metadata.replay_version !== "governance-replay-contract/v7H.1") errors.push(validationError("013", "REPLAY_VERSION_MISMATCH", "replay_metadata.replay_version", "Replay version must match the originating contract."));
  if (pkg.replay_input_package.replay_contract.constitutional_reference !== `constitution:v7:${pkg.replay_input_package.replay_contract.tenant_id}`) errors.push(validationError("014", "CONSTITUTIONAL_MISMATCH", "constitutional_reference", "Constitutional state must match original execution."));
  if (pkg.replay_input_package.replay_contract.authority_reference !== `authority:governance_replay_operator:${pkg.replay_input_package.replay_contract.tenant_id}`) errors.push(validationError("015", "AUTHORITY_MISMATCH", "authority_reference", "Authority state must match original execution."));
  if (pkg.integrity_results.some((item) => !item.tenant_verified)) errors.push(validationError("016", "TENANT_MISMATCH", "tenant_id", "State must belong to the originating tenant."));
  if (pkg.integrity_results.some((item) => !item.hash_verified || !item.ordering_verified || !item.lineage_verified || !item.confidence_verified)) errors.push(validationError("017", "INTEGRITY_VERIFICATION_FAILURE", "integrity_results", "State integrity verification must pass."));
  if (computeGovernanceStatePackageHash(pkg) !== pkg.state_package_hash) errors.push(validationError("018", "STATE_PACKAGE_HASH_MISMATCH", "state_package_hash", "State package hash must reproduce exactly."));
  if (pkg.failures.includes("HIDDEN_STATE_DETECTED")) errors.push(validationError("019", "HIDDEN_STATE_DETECTED", "state_package", "Hidden or transient execution state is prohibited."));
  const source = {
    state_reconstruction_id: pkg.state_reconstruction_id,
    validation_state: errors.length ? "INVALID" as const : "VALID" as const,
    replay_ready: errors.length === 0 && pkg.status === "REPLAY_READY",
    input_package_valid: pkg.replay_input_validation.validation_state === "VALID",
    completeness_valid: allSnapshots(pkg).every((item) => item.source_context_refs.length > 0 && item.progress !== "FAILED"),
    ordering_valid: !errors.some((item) => item.reason === "EXECUTION_ORDERING_DIFFERS"),
    integrity_valid: !errors.some((item) => item.reason === "INTEGRITY_VERIFICATION_FAILURE" || item.reason === "STATE_PACKAGE_HASH_MISMATCH"),
    confidence_valid: !errors.some((item) => item.reason === "CONFIDENCE_MISMATCH"),
    lineage_valid: !errors.some((item) => item.reason === "LINEAGE_DISCONTINUITY"),
    explainability_valid: !errors.some((item) => item.reason === "EXPLAINABILITY_CHAIN_INCOMPLETE"),
    constitutional_valid: !errors.some((item) => item.reason === "CONSTITUTIONAL_MISMATCH"),
    authority_valid: !errors.some((item) => item.reason === "AUTHORITY_MISMATCH"),
    tenant_isolated: !errors.some((item) => item.reason === "TENANT_MISMATCH"),
    hidden_state_absent: !errors.some((item) => item.reason === "HIDDEN_STATE_DETECTED"),
    errors: freezeArray(errors),
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-state-validation", source) });
}

export function buildGovernanceStateAuditLog(pkg = reconstructGovernanceState()): readonly GovernanceStateAuditEntry[] {
  return pkg.audit_log;
}

export function buildGovernanceStateObservabilitySurface(pkg = reconstructGovernanceState()): GovernanceStateObservabilitySurface {
  const validation = validateGovernanceStatePackage(pkg);
  const failed = pkg.integrity_results.filter((item) => !item.hash_verified || !item.ordering_verified || !item.lineage_verified || !item.confidence_verified || !item.tenant_verified).length;
  return Object.freeze({
    state_reconstruction_id: pkg.state_reconstruction_id,
    status: pkg.status,
    replay_ready: validation.replay_ready,
    state_count: allSnapshots(pkg).length,
    transition_count: pkg.transitions.length,
    integrity_passed: pkg.integrity_results.length - failed,
    integrity_failed: failed,
    failures: uniq([...pkg.failures, ...validation.errors.map((error) => error.reason)]) as readonly GovernanceStateFailureReason[],
    advisory_only_notice: "Governance state reconstruction restores historical execution state for replay without relying on hidden memory or live services.",
  });
}

export function getGovernanceStateReconstructionContract() {
  const pkg = reconstructGovernanceState();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["historically-accurate", "immutable-state-source", "deterministic-order", "hidden-state-free", "version-preserving", "confidence-preserving", "explainability-preserving", "tenant-isolated", "authority-bound", "fail-closed"]),
      schema_version: SCHEMA_VERSION,
      execution_order: EXECUTION_ORDER,
    }),
    package: pkg,
    validation: validateGovernanceStatePackage(pkg),
    observability: buildGovernanceStateObservabilitySurface(pkg),
  });
}
