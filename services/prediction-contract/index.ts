import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  ForecastLifecycleState,
  PredictionCategory,
  PredictionCheckStatus,
  PredictionContract,
  PredictionContractFailure,
  PredictionContractInput,
  PredictionContractObservabilitySurface,
  PredictionContractScenario,
  PredictionEvidence,
  PredictionEvidenceSource,
  PredictionLifecycleTransitionResult,
  PredictionObject,
  PredictionSeverity,
  PredictionType,
  PredictionValidationResult,
} from "@/types/prediction-contract";

const NOW = "2026-07-09T12:00:00.000Z";
const EXPIRES = "2026-07-09T18:00:00.000Z";
const VERSION = "prediction-contract/v8ALT.3.1" as const;
const TENANT_ID = "tenant:autonomy:primary";
const MISSION_ID = "mission:autonomy:primary";
const EXECUTION_ID = "execution:prediction-contract:primary";

const predictionTypes: readonly PredictionType[] = Object.freeze(["EXECUTION_BOTTLENECK", "RESOURCE_SHORTAGE", "GOVERNANCE_VIOLATION", "CONFIDENCE_COLLAPSE", "REPLAY_INSTABILITY", "INTEGRITY_DEGRADATION", "ORCHESTRATION_CONGESTION", "DEPENDENCY_FAILURE", "RECOVERY_RISK"]);
const lifecycleStates: readonly ForecastLifecycleState[] = Object.freeze(["CREATED", "VALIDATING", "EVIDENCE_ATTACHED", "GOVERNANCE_CHECKED", "CONFIDENCE_PROJECTED", "READY", "PUBLISHED", "EXPIRED", "SUPERSEDED", "REJECTED"]);
const evidenceSources: readonly PredictionEvidenceSource[] = Object.freeze(["EXECUTION_HISTORY", "RUNTIME_ASSURANCE_STATE", "REPLAY_HISTORY", "INTEGRITY_VERIFICATION", "ORCHESTRATION_TELEMETRY", "GOVERNANCE_EVENTS", "CONFIDENCE_TRENDS", "DEPENDENCY_GRAPH_STATE", "RECOVERY_HISTORY", "RESOURCE_UTILIZATION_HISTORY"]);
const transitions: readonly [ForecastLifecycleState, ForecastLifecycleState][] = Object.freeze([
  ["CREATED", "VALIDATING"],
  ["VALIDATING", "EVIDENCE_ATTACHED"],
  ["EVIDENCE_ATTACHED", "GOVERNANCE_CHECKED"],
  ["GOVERNANCE_CHECKED", "CONFIDENCE_PROJECTED"],
  ["CONFIDENCE_PROJECTED", "READY"],
  ["READY", "PUBLISHED"],
  ["PUBLISHED", "EXPIRED"],
  ["PUBLISHED", "SUPERSEDED"],
  ["VALIDATING", "REJECTED"],
  ["GOVERNANCE_CHECKED", "REJECTED"],
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function categoryFor(type: PredictionType): PredictionCategory {
  const map: Record<PredictionType, PredictionCategory> = {
    EXECUTION_BOTTLENECK: "EXECUTION",
    RESOURCE_SHORTAGE: "RESOURCE",
    GOVERNANCE_VIOLATION: "GOVERNANCE",
    CONFIDENCE_COLLAPSE: "CONFIDENCE",
    REPLAY_INSTABILITY: "REPLAY",
    INTEGRITY_DEGRADATION: "INTEGRITY",
    ORCHESTRATION_CONGESTION: "ORCHESTRATION",
    DEPENDENCY_FAILURE: "DEPENDENCY",
    RECOVERY_RISK: "RECOVERY",
  };
  return map[type] ?? "EXECUTION";
}

function scenarioFailures(scenario: PredictionContractScenario): readonly PredictionContractFailure[] {
  const map: Partial<Record<PredictionContractScenario, PredictionContractFailure>> = {
    MISSING_TENANT: "TENANT_ID_MISSING",
    MISSING_MISSION: "MISSION_ID_MISSING",
    UNSUPPORTED_TYPE: "UNSUPPORTED_PREDICTION_TYPE",
    INVALID_TRANSITION: "LIFECYCLE_TRANSITION_INVALID",
    MISSING_EVIDENCE: "EVIDENCE_MISSING",
    MISSING_GOVERNANCE: "GOVERNANCE_METADATA_MISSING",
    BROKEN_LINEAGE: "LINEAGE_REFERENCE_BROKEN",
    MISSING_REPLAY: "REPLAY_REFERENCE_MISSING",
    MISSING_INTEGRITY: "INTEGRITY_HASH_MISSING",
    CROSS_TENANT_REFERENCE: "TENANT_ISOLATION_INVALID",
    NONDETERMINISTIC_CONFIDENCE: "CONFIDENCE_NONDETERMINISTIC",
    AUTONOMOUS_ACTION_REQUESTED: "ADVISORY_ONLY_VIOLATION",
    OPERATOR_APPROVAL_MISSING: "OPERATOR_APPROVAL_MISSING",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function severityFor(probability: number): PredictionSeverity {
  if (probability >= 0.85) return "CRITICAL";
  if (probability >= 0.7) return "HIGH";
  if (probability >= 0.45) return "MEDIUM";
  return "LOW";
}

function evidenceRecord(source_type: PredictionEvidenceSource, predictionId: string, failures: readonly PredictionContractFailure[]): PredictionEvidence {
  const missingIntegrity = failures.includes("INTEGRITY_HASH_MISSING");
  const base = {
    evidence_id: id("PEV", "prediction-evidence", { predictionId, source_type }),
    source_type,
    source_reference: `${source_type.toLowerCase()}:${predictionId}`,
    observation_time: NOW,
    signal_type: source_type.toLowerCase().replace(/_/g, "-"),
    signal_value: "elevated-risk",
    confidence_contribution: failures.includes("CONFIDENCE_NONDETERMINISTIC") ? 0.17 : 0.82,
    risk_contribution: 0.68,
    replay_reference: `replay:${predictionId}:${source_type.toLowerCase()}`,
    integrity_hash: missingIntegrity ? "" : hashValue("prediction-evidence-integrity", { predictionId, source_type }),
  };
  return Object.freeze({ ...base, evidence_hash: hashValue("prediction-evidence", base) });
}

export function validatePredictionLifecycleTransition(from: ForecastLifecycleState, to: ForecastLifecycleState): PredictionLifecycleTransitionResult {
  const valid = transitions.some(([source, target]) => source === from && target === to);
  const base = { from, to, valid, failure: valid ? null : "LIFECYCLE_TRANSITION_INVALID" as const };
  return Object.freeze({ ...base, transition_hash: hashValue("prediction-lifecycle-transition", base) });
}

function transitionCatalog(): readonly PredictionLifecycleTransitionResult[] {
  return freezeArray(transitions.map(([from, to]) => validatePredictionLifecycleTransition(from, to)));
}

export function computePredictionHash(prediction: Omit<PredictionObject, "prediction_hash"> | PredictionObject): string {
  const { prediction_hash: _hash, ...source } = prediction as PredictionObject;
  return hashValue("prediction-object", source);
}

export function createPrediction(input: PredictionContractInput = {}): PredictionObject {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const prediction_type = scenario === "UNSUPPORTED_TYPE" ? "UNSUPPORTED_FORECAST" as PredictionType : input.prediction_type ?? "EXECUTION_BOTTLENECK";
  const tenant_id = scenario === "MISSING_TENANT" ? "" : scenario === "CROSS_TENANT_REFERENCE" ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const mission_id = scenario === "MISSING_MISSION" ? "" : input.mission_id ?? MISSION_ID;
  const execution_id = input.execution_id ?? EXECUTION_ID;
  const prediction_id = id("PRED", "prediction-id", { scenario, tenant_id, mission_id, execution_id, prediction_type });
  const evidence = scenario === "MISSING_EVIDENCE" ? freezeArray<PredictionEvidence>([]) : freezeArray(evidenceSources.map((source) => evidenceRecord(source, prediction_id, failures)));
  const probability = 0.76;
  const projected_confidence = failures.includes("CONFIDENCE_NONDETERMINISTIC") ? 1.4 : Number((evidence.reduce((sum, item) => sum + item.confidence_contribution, 0) / Math.max(1, evidence.length)).toFixed(4));
  const governanceStatus: PredictionCheckStatus = failures.includes("GOVERNANCE_METADATA_MISSING") ? "MISSING" : failures.includes("ADVISORY_ONLY_VIOLATION") ? "FAIL" : "PASS";
  const governanceBase = {
    governance_state: governanceStatus === "PASS" ? "COMPLIANT" as const : "BLOCKED" as const,
    policy_references: freezeArray(["policy:prediction-advisory-only", "policy:operator-approval-required"]),
    authority_scope: "advisory-prediction",
    approval_required: scenario !== "OPERATOR_APPROVAL_MISSING",
    operator_required: scenario !== "OPERATOR_APPROVAL_MISSING",
    constitutional_check: governanceStatus,
    policy_check: governanceStatus,
    boundary_check: governanceStatus,
    tenant_isolation_check: failures.includes("TENANT_ISOLATION_INVALID") ? "FAIL" as const : governanceStatus,
    advisory_only: true as const,
  };
  const constitutionalBase = {
    constitutional_reference: "constitution:operator-supremacy",
    constitutional_check: governanceStatus,
    prohibited_actions: freezeArray(["modify execution", "trigger rollback", "restart execution", "alter governance policy", "bypass authority validation", "escalate privileges"]),
    operator_supremacy_preserved: scenario !== "OPERATOR_APPROVAL_MISSING",
  };
  const lineageBase = {
    parent_prediction_id: null,
    related_predictions: freezeArray([]),
    source_events: freezeArray([`event:${execution_id}:prediction-signal`]),
    source_assurance_records: freezeArray(["assurance:adaptive-runtime"]),
    source_recovery_records: freezeArray(["recovery:latest-certified"]),
    source_integrity_records: freezeArray(["integrity:prediction-inputs"]),
    source_replay_records: freezeArray(["replay:prediction-inputs"]),
  };
  const replayBase = {
    replay_id: id("PRPL", "prediction-replay-id", prediction_id),
    replay_version: "prediction-replay/v8ALT.3.1" as const,
    input_snapshot_hash: hashValue("prediction-input-snapshot", { tenant_id, mission_id, execution_id, evidence: evidence.map((item) => item.evidence_hash) }),
    model_version: "prediction-contract-model/v8ALT.3.1" as const,
    deterministic_seed: hashValue("prediction-deterministic-seed", { prediction_id, prediction_type }).slice(0, 16),
    replay_timestamp: NOW,
    expected_output_hash: hashValue("prediction-expected-output", { prediction_type, probability, projected_confidence }),
  };
  const base = {
    prediction_id,
    mission_id,
    execution_id,
    tenant_id,
    prediction_type,
    prediction_category: categoryFor(prediction_type),
    forecast_state: input.forecast_state ?? (scenario === "INVALID_TRANSITION" ? "CREATED" as const : "PUBLISHED" as const),
    severity: severityFor(probability),
    probability,
    projected_confidence,
    forecast_window: "PT6H",
    predicted_risks: freezeArray(["execution bottleneck likely within forecast window"]),
    risk_factors: freezeArray(["runtime throughput degradation", "dependency queue growth"]),
    trigger_conditions: freezeArray(["task latency exceeds deterministic threshold", "dependency queue saturation rises"]),
    affected_components: freezeArray(["execution-orchestrator", "dependency-scheduler"]),
    preventative_recommendations: freezeArray(["increase operator monitoring", "prepare advisory dependency mitigation"]),
    mitigation_plans: freezeArray(["operator-reviewed throttling plan", "operator-reviewed dependency reroute"]),
    operator_required: scenario !== "OPERATOR_APPROVAL_MISSING",
    evidence,
    governance_metadata: scenario === "MISSING_GOVERNANCE" ? null : Object.freeze({ ...governanceBase, governance_hash: hashValue("prediction-governance", governanceBase) }),
    constitutional_metadata: scenario === "MISSING_GOVERNANCE" ? null : Object.freeze({ ...constitutionalBase, constitutional_hash: hashValue("prediction-constitutional", constitutionalBase) }),
    lineage_reference: scenario === "BROKEN_LINEAGE" ? null : Object.freeze({ ...lineageBase, lineage_hash: hashValue("prediction-lineage", lineageBase) }),
    replay_reference: scenario === "MISSING_REPLAY" ? null : Object.freeze({ ...replayBase, replay_hash: hashValue("prediction-replay", replayBase) }),
    integrity_hash: failures.includes("INTEGRITY_HASH_MISSING") ? "" : hashValue("prediction-integrity", { prediction_id, evidence: evidence.map((item) => item.evidence_hash), tenant_id }),
    created_at: NOW,
    expires_at: EXPIRES,
    advisory_only: true as const,
    autonomous_action_requested: scenario === "AUTONOMOUS_ACTION_REQUESTED",
    execution_modified: false,
    rollback_requested: scenario === "AUTONOMOUS_ACTION_REQUESTED",
    restart_requested: false,
    governance_modified: false,
    authority_bypassed: scenario === "AUTONOMOUS_ACTION_REQUESTED",
  };
  return Object.freeze({ ...base, prediction_hash: computePredictionHash(base as Omit<PredictionObject, "prediction_hash">) });
}

export function validatePrediction(prediction?: PredictionObject): PredictionValidationResult {
  if (!prediction) {
    const failures = freezeArray<PredictionContractFailure>(["PREDICTION_ID_MISSING"]);
    const source = { prediction_id: null, valid: false, identity_valid: false, type_supported: false, lifecycle_valid: false, forecast_window_valid: false, evidence_attached: false, probability_valid: false, confidence_reproducible: false, governance_present: false, replay_present: false, lineage_present: false, integrity_valid: false, tenant_isolated: false, advisory_only: false, operator_approval_required: false, immutable_hash_valid: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("prediction-validation", source) });
  }
  const identity_valid = Boolean(prediction.prediction_id && prediction.tenant_id && prediction.mission_id && prediction.execution_id);
  const type_supported = predictionTypes.includes(prediction.prediction_type);
  const lifecycle_valid = lifecycleStates.includes(prediction.forecast_state) && prediction.forecast_state !== "CREATED";
  const forecast_window_valid = Boolean(prediction.forecast_window && prediction.expires_at);
  const evidence_attached = prediction.evidence.length > 0 && prediction.evidence.every((item) => item.integrity_hash && item.replay_reference);
  const probability_valid = prediction.probability >= 0 && prediction.probability <= 1;
  const confidence_reproducible = prediction.projected_confidence >= 0 && prediction.projected_confidence <= 1;
  const governance_present = Boolean(prediction.governance_metadata && prediction.constitutional_metadata && prediction.governance_metadata.governance_state === "COMPLIANT" && prediction.governance_metadata.advisory_only);
  const replay_present = Boolean(prediction.replay_reference?.replay_id && prediction.replay_reference.expected_output_hash);
  const lineage_present = Boolean(prediction.lineage_reference?.lineage_hash && prediction.lineage_reference.source_events.length);
  const integrity_valid = Boolean(prediction.integrity_hash) && prediction.evidence.every((item) => item.integrity_hash);
  const tenant_isolated = prediction.tenant_id === TENANT_ID || prediction.tenant_id.startsWith("tenant:");
  const advisory_only = prediction.advisory_only && !prediction.autonomous_action_requested && !prediction.execution_modified && !prediction.rollback_requested && !prediction.restart_requested && !prediction.governance_modified && !prediction.authority_bypassed;
  const operator_approval_required = prediction.operator_required && Boolean(prediction.governance_metadata?.approval_required && prediction.governance_metadata.operator_required);
  const immutable_hash_valid = computePredictionHash(prediction) === prediction.prediction_hash;
  const failures = unique([
    ...(!prediction.prediction_id ? ["PREDICTION_ID_MISSING" as const] : []),
    ...(!prediction.tenant_id ? ["TENANT_ID_MISSING" as const] : []),
    ...(!prediction.mission_id ? ["MISSION_ID_MISSING" as const] : []),
    ...(!type_supported ? ["UNSUPPORTED_PREDICTION_TYPE" as const] : []),
    ...(!lifecycle_valid ? ["LIFECYCLE_TRANSITION_INVALID" as const] : []),
    ...(!forecast_window_valid ? ["FORECAST_WINDOW_MISSING" as const] : []),
    ...(!evidence_attached ? ["EVIDENCE_MISSING" as const] : []),
    ...(!probability_valid ? ["PROBABILITY_OUT_OF_BOUNDS" as const] : []),
    ...(!confidence_reproducible ? ["CONFIDENCE_NONDETERMINISTIC" as const] : []),
    ...(!governance_present ? ["GOVERNANCE_METADATA_MISSING" as const] : []),
    ...(!replay_present ? ["REPLAY_REFERENCE_MISSING" as const] : []),
    ...(!lineage_present ? ["LINEAGE_REFERENCE_BROKEN" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_MISSING" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!advisory_only ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
    ...(!operator_approval_required ? ["OPERATOR_APPROVAL_MISSING" as const] : []),
    ...(!immutable_hash_valid ? ["INTEGRITY_HASH_MISSING" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { prediction_id: prediction.prediction_id, valid, identity_valid, type_supported, lifecycle_valid, forecast_window_valid, evidence_attached, probability_valid, confidence_reproducible, governance_present, replay_present, lineage_present, integrity_valid, tenant_isolated, advisory_only, operator_approval_required, immutable_hash_valid, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("prediction-validation", source) });
}

export function buildPredictionObservabilitySurface(prediction = createPrediction()): PredictionContractObservabilitySurface {
  return Object.freeze({
    prediction_id: prediction.prediction_id,
    prediction_type: prediction.prediction_type,
    prediction_category: prediction.prediction_category,
    forecast_state: prediction.forecast_state,
    severity: prediction.severity,
    probability: prediction.probability,
    projected_confidence: prediction.projected_confidence,
    evidence_count: prediction.evidence.length,
    governance_state: prediction.governance_metadata?.governance_state ?? "MISSING",
    replay_present: Boolean(prediction.replay_reference),
    tenant_id: prediction.tenant_id,
    advisory_only: true,
    prediction_hash: prediction.prediction_hash,
  });
}

export function getPredictionContract(): PredictionContract {
  const prediction = createPrediction();
  return Object.freeze({
    doctrine: Object.freeze({
      contract_version: VERSION,
      principles: freezeArray(["deterministic", "validated", "explainable", "replayable", "governance-aware", "tenant-isolated", "advisory-only", "operator-approved-actions", "immutable-evidence", "fail-closed"]),
      prediction_types: predictionTypes,
      lifecycle_states: lifecycleStates,
      evidence_sources: evidenceSources,
      advisory_only: true,
      operator_approval_required: true,
    }),
    lifecycle_transitions: transitionCatalog(),
    prediction,
    validation: validatePrediction(prediction),
    observability: buildPredictionObservabilitySurface(prediction),
  });
}
