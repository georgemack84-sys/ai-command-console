import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createPrediction, validatePrediction } from "@/services/prediction-contract";
import { runHistoricalIntelligence, validateHistoricalIntelligence } from "@/services/historical-intelligence-engine";
import { runPreventativeRecommendations, validatePreventativeRecommendations } from "@/services/preventative-recommendation-engine";
import { runRiskForecasting, validateRiskForecasting } from "@/services/risk-forecasting-engine";
import type {
  KnowledgeRelationship,
  PredictionKnowledgeFailure,
  PredictionKnowledgeInput,
  PredictionKnowledgeObject,
  PredictionKnowledgeObservabilitySurface,
  PredictionKnowledgeRelationshipType,
  PredictionKnowledgeReplayResult,
  PredictionKnowledgeRepository,
  PredictionKnowledgeRepositoryContract,
  PredictionKnowledgeScenario,
  PredictionKnowledgeState,
  PredictionKnowledgeType,
  PredictionKnowledgeValidationResult,
} from "@/types/prediction-knowledge-repository";

const NOW = "2026-07-12T19:00:00.000Z";
const VERSION = "prediction-knowledge-repository/v8ALT.3.5" as const;
const TENANT_ID = "tenant:autonomy:primary";
const knowledgeTypes: readonly PredictionKnowledgeType[] = Object.freeze(["PREDICTION_HISTORY", "PREDICTION_MODEL", "HISTORICAL_ACCURACY", "BEHAVIORAL_INTELLIGENCE", "SCENARIO_INTELLIGENCE", "MITIGATION_KNOWLEDGE", "OPERATOR_INTELLIGENCE", "FORECAST_EVOLUTION", "CONFIDENCE_INTELLIGENCE", "CERTIFICATION_KNOWLEDGE"]);
const lifecycleStates: readonly PredictionKnowledgeState[] = Object.freeze(["REGISTERED", "VALIDATED", "CLASSIFIED", "LINKED", "CERTIFIED", "ACTIVE", "SUPERSEDED", "ARCHIVED"]);
const relationshipTypes: readonly PredictionKnowledgeRelationshipType[] = Object.freeze(["derives_from", "predicts", "validates", "supersedes", "contradicts", "reinforces", "influences", "mitigates", "certifies", "references"]);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function scenarioFailures(scenario: PredictionKnowledgeScenario): readonly PredictionKnowledgeFailure[] {
  const map: Partial<Record<PredictionKnowledgeScenario, PredictionKnowledgeFailure>> = {
    UNAUTHORIZED_MODIFICATION: "UNAUTHORIZED_MODIFICATION_DETECTED",
    KNOWLEDGE_DELETION: "KNOWLEDGE_DELETION_DETECTED",
    RELATIONSHIP_CORRUPTION: "RELATIONSHIP_CORRUPTION_DETECTED",
    CROSS_TENANT_ACCESS: "CROSS_TENANT_ACCESS_DETECTED",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
    LINEAGE_BROKEN: "LINEAGE_REFERENCES_MUTABLE",
    GOVERNANCE_INVALID: "GOVERNANCE_METADATA_MISSING",
    CONSTITUTIONAL_INVALID: "CONSTITUTIONAL_METADATA_MISSING",
    AUTONOMOUS_LEARNING_ATTEMPT: "AUTONOMOUS_LEARNING_DETECTED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function computeObjectHash(object: Omit<PredictionKnowledgeObject, "object_hash"> | PredictionKnowledgeObject): string {
  const { object_hash: _hash, ...source } = object as PredictionKnowledgeObject;
  return hashValue("prediction-knowledge-object", source);
}

function knowledgeObject(input: {
  type: PredictionKnowledgeType;
  tenantId: string;
  missionId: string;
  predictionId: string;
  category: string;
  version: string;
  index: number;
  predictionHistory: readonly string[];
  behaviorProfile: readonly string[];
  forecastEvolution: readonly string[];
  confidenceEvolution: readonly string[];
  scenarioResults: readonly string[];
  mitigationResults: readonly string[];
  operatorDecisions: readonly string[];
  historicalAccuracy: readonly string[];
  modelReference: string;
  relationships: readonly string[];
  governanceMetadata: readonly string[];
  constitutionalMetadata: readonly string[];
  lineageReference: string;
  replayReference: string;
  certificationReference: string;
  explainability: readonly string[];
  failures: readonly PredictionKnowledgeFailure[];
}): PredictionKnowledgeObject {
  const knowledge_id = id("PKO", "prediction-knowledge-object", { type: input.type, prediction: input.predictionId, index: input.index });
  const lineage_reference = input.failures.includes("LINEAGE_REFERENCES_MUTABLE") ? "" : input.lineageReference;
  const replay_reference = input.failures.includes("REPLAY_RECONSTRUCTION_MISMATCH") ? "" : input.replayReference;
  const governance_metadata = input.failures.includes("GOVERNANCE_METADATA_MISSING") ? freezeArray<string>([]) : input.governanceMetadata;
  const constitutional_metadata = input.failures.includes("CONSTITUTIONAL_METADATA_MISSING") ? freezeArray<string>([]) : input.constitutionalMetadata;
  const base = {
    knowledge_id,
    knowledge_type: input.type,
    tenant_id: input.failures.includes("CROSS_TENANT_ACCESS_DETECTED") ? "external-tenant" : input.tenantId,
    mission_id: input.missionId,
    prediction_id: input.predictionId,
    knowledge_category: input.category,
    knowledge_version: input.version,
    knowledge_state: "ACTIVE" as const,
    prediction_history: freezeArray(input.predictionHistory),
    behavior_profile: freezeArray(input.behaviorProfile),
    forecast_evolution: freezeArray(input.forecastEvolution),
    confidence_evolution: freezeArray(input.confidenceEvolution),
    scenario_results: freezeArray(input.scenarioResults),
    mitigation_results: freezeArray(input.mitigationResults),
    operator_decisions: freezeArray(input.operatorDecisions),
    historical_accuracy: freezeArray(input.historicalAccuracy),
    model_reference: input.modelReference,
    knowledge_relationships: freezeArray(input.relationships),
    governance_metadata,
    constitutional_metadata,
    lineage_reference,
    replay_reference,
    certification_reference: input.certificationReference,
    explainability: freezeArray(input.explainability),
    integrity_hash: input.failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("prediction-knowledge-integrity", { knowledge_id, lineage_reference, replay_reference, governance_metadata, constitutional_metadata }),
    created_at: NOW,
    last_certified_at: NOW,
    advisory_only: true as const,
    autonomous_learning_performed: input.failures.includes("AUTONOMOUS_LEARNING_DETECTED"),
    governance_modified: false,
    constitutional_modified: false,
    unauthorized_modified: input.failures.includes("UNAUTHORIZED_MODIFICATION_DETECTED"),
    deleted: input.failures.includes("KNOWLEDGE_DELETION_DETECTED") && input.index === 0,
  };
  return Object.freeze({ ...base, object_hash: computeObjectHash(base as Omit<PredictionKnowledgeObject, "object_hash">) });
}

function relationship(from: string, to: string, relationship_type: PredictionKnowledgeRelationshipType, order: number, corrupt: boolean): KnowledgeRelationship {
  const source = {
    relationship_id: id("PKR", "prediction-knowledge-relationship", { from, to, relationship_type, order }),
    from_knowledge_id: from,
    to_knowledge_id: corrupt && order === 0 ? "missing-knowledge-object" : to,
    relationship_type,
    evidence_reference: `evidence:${from}:${to}`,
    deterministic_order: order,
  };
  return Object.freeze({ ...source, relationship_hash: hashValue("prediction-knowledge-relationship", source) });
}

export function computePredictionKnowledgeRepositoryHash(repository: Omit<PredictionKnowledgeRepository, "repository_hash"> | PredictionKnowledgeRepository): string {
  const { repository_hash: _hash, ...source } = repository as PredictionKnowledgeRepository;
  return hashValue("prediction-knowledge-repository", source);
}

export function runPredictionKnowledgeRepository(input: PredictionKnowledgeInput = {}): PredictionKnowledgeRepository {
  const scenario = input.scenario ?? "BASELINE";
  const failures = scenarioFailures(scenario);
  const tenantId = input.tenant_id ?? TENANT_ID;
  const prediction = input.prediction ?? createPrediction({ tenant_id: tenantId, mission_id: input.mission_id });
  const historical = input.historical_report ?? runHistoricalIntelligence({ tenant_id: tenantId, mission_id: prediction.mission_id });
  const risk = input.risk_report ?? runRiskForecasting({ tenant_id: tenantId, mission_id: prediction.mission_id, historical_report: historical });
  const recommendations = input.recommendation_report ?? runPreventativeRecommendations({ tenant_id: tenantId, mission_id: prediction.mission_id, forecast_report: risk });
  const modelIds = historical.prediction_models.map((model) => model.model_id);
  const forecastIds = risk.forecasts.map((forecast) => forecast.forecast_id);
  const recommendationIds = recommendations.recommendations.map((item) => item.recommendation_id);
  const common = {
    tenantId,
    missionId: prediction.mission_id,
    predictionId: prediction.prediction_id,
    version: VERSION,
    predictionHistory: [prediction.prediction_id, prediction.forecast_state, prediction.prediction_hash],
    behaviorProfile: [historical.trend_summary.trend_id, historical.resource_profile.profile_id, historical.governance_profile.profile_id],
    forecastEvolution: forecastIds,
    confidenceEvolution: risk.repository.confidence_projections.map((value) => value.toFixed(4)),
    scenarioResults: risk.forecasts.flatMap((forecast) => forecast.predicted_conditions),
    mitigationResults: recommendationIds,
    operatorDecisions: recommendations.recommendations.map((item) => `${item.recommendation_id}:approval-required:${item.approval_required}`),
    historicalAccuracy: historical.prediction_models.flatMap((model) => model.validation_results),
    modelReference: modelIds[0] ?? "model:missing",
    relationships: [] as readonly string[],
    governanceMetadata: [prediction.governance_metadata?.governance_hash ?? "", historical.governance_profile.governance_hash, recommendations.repository.repository_hash].filter(Boolean),
    constitutionalMetadata: [prediction.constitutional_metadata?.constitutional_hash ?? "", "operator-supremacy-preserved", "advisory-only"].filter(Boolean),
    lineageReference: prediction.lineage_reference?.lineage_hash ?? historical.lineage_reference,
    replayReference: prediction.replay_reference?.replay_hash ?? historical.replay_reference,
    certificationReference: `certification:${prediction.prediction_id}:${recommendations.report_id}`,
    failures,
  };
  const objects = knowledgeTypes.map((type, index) => knowledgeObject({
    ...common,
    type,
    category: type.toLowerCase(),
    index,
    explainability: [
      "origin preserved from predictive intelligence artifacts",
      "purpose is deterministic institutional memory",
      "evidence, lineage, replay, governance, and certification references are retained",
      "historical significance is represented through model, forecast, behavior, mitigation, and operator references",
      "repository remains advisory-only and does not perform autonomous learning",
    ],
  })).filter((object) => !object.deleted);
  const corruptRelationships = failures.includes("RELATIONSHIP_CORRUPTION_DETECTED");
  const rels = objects.flatMap((object, index) => {
    const next = objects[(index + 1) % objects.length];
    return [
      relationship(object.knowledge_id, prediction.prediction_id, "references", index * 2, corruptRelationships),
      relationship(object.knowledge_id, next.knowledge_id, relationshipTypes[index % relationshipTypes.length], index * 2 + 1, corruptRelationships),
    ];
  }).sort((a, b) => a.deterministic_order - b.deterministic_order || a.relationship_id.localeCompare(b.relationship_id));
  const graphBase = {
    graph_id: id("PKG", "prediction-knowledge-graph", objects.map((object) => object.knowledge_id)),
    tenant_id: failures.includes("CROSS_TENANT_ACCESS_DETECTED") ? "external-tenant" : tenantId,
    nodes: freezeArray([...objects.map((object) => object.knowledge_id), prediction.prediction_id].sort()),
    relationships: freezeArray(rels),
    influence_graph: freezeArray(forecastIds.map((forecastId) => `${forecastId}->${prediction.prediction_id}`).sort()),
    dependency_graph: freezeArray(modelIds.map((modelId) => `${modelId}->${prediction.prediction_id}`).sort()),
    causal_graph: freezeArray(recommendationIds.map((recommendationId) => `${prediction.prediction_id}->${recommendationId}`).sort()),
  };
  const knowledge_graph = Object.freeze({ ...graphBase, graph_hash: hashValue("prediction-knowledge-graph", graphBase) });
  const repositoryBase = {
    repository_id: id("PKREPO", "prediction-knowledge-repository", { prediction: prediction.prediction_hash, recommendations: recommendations.report_hash, scenario }),
    tenant_id: knowledge_graph.tenant_id,
    mission_id: prediction.mission_id,
    knowledge_objects: freezeArray(objects),
    knowledge_graph,
    retrieval_indexes: Object.freeze({
      prediction: freezeArray(objects.filter((object) => object.prediction_id === prediction.prediction_id).map((object) => object.knowledge_id).sort()),
      mission: freezeArray(objects.filter((object) => object.mission_id === prediction.mission_id).map((object) => object.knowledge_id).sort()),
      model: freezeArray(objects.filter((object) => object.model_reference).map((object) => object.knowledge_id).sort()),
      governance: freezeArray(objects.filter((object) => object.governance_metadata.length > 0).map((object) => object.knowledge_id).sort()),
      replay: freezeArray(objects.filter((object) => object.replay_reference).map((object) => object.knowledge_id).sort()),
      certification: freezeArray(objects.filter((object) => object.certification_reference).map((object) => object.knowledge_id).sort()),
    }),
    certification_evidence: freezeArray(objects.map((object) => object.certification_reference).filter(Boolean).sort()),
    replay_artifacts: freezeArray(objects.map((object) => object.replay_reference).filter(Boolean).sort()),
    lineage_references: freezeArray(objects.map((object) => object.lineage_reference).filter(Boolean).sort()),
    integrity_hashes: freezeArray(objects.map((object) => object.integrity_hash).filter(Boolean).sort()),
    append_only: true as const,
  };
  return Object.freeze({ ...repositoryBase, repository_hash: computePredictionKnowledgeRepositoryHash(repositoryBase as Omit<PredictionKnowledgeRepository, "repository_hash">) });
}

export function validatePredictionKnowledgeRepository(repository?: PredictionKnowledgeRepository): PredictionKnowledgeValidationResult {
  if (!repository) {
    const failures = freezeArray<PredictionKnowledgeFailure>(["KNOWLEDGE_REPOSITORY_CONTRACT_INVALID"]);
    const source = { repository_id: null, valid: false, knowledge_repository_contract_valid: false, prediction_history_preserved: false, prediction_models_versioned_deterministically: false, historical_accuracy_reproducible: false, behavior_profiles_preserved: false, scenario_results_reproducible: false, mitigation_results_preserved: false, operator_decisions_traceable: false, forecast_evolution_deterministic: false, confidence_evolution_reproducible: false, prediction_knowledge_graph_complete: false, knowledge_relationships_deterministic: false, replay_artifacts_preserved: false, certification_evidence_complete: false, lineage_references_immutable: false, governance_metadata_preserved: false, constitutional_metadata_preserved: false, integrity_hashes_reproducible: false, deterministic_knowledge_retrieval_verified: false, replay_reconstructs_identical_knowledge_state: false, unauthorized_knowledge_modification_rejected: false, knowledge_deletion_detected: false, knowledge_relationship_corruption_detected: false, cross_tenant_knowledge_access_rejected: false, advisory_only_behavior_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("prediction-knowledge-validation", source) });
  }
  const objectIds = repository.knowledge_objects.map((object) => object.knowledge_id);
  const objectIdSet = new Set([...objectIds, ...repository.knowledge_objects.map((object) => object.prediction_id)]);
  const knowledge_repository_contract_valid = repository.append_only && repository.knowledge_objects.length === knowledgeTypes.length;
  const prediction_history_preserved = repository.knowledge_objects.every((object) => object.prediction_history.length >= 3);
  const prediction_models_versioned_deterministically = repository.knowledge_objects.every((object) => object.model_reference && object.knowledge_version === VERSION);
  const historical_accuracy_reproducible = repository.knowledge_objects.every((object) => object.historical_accuracy.length > 0);
  const behavior_profiles_preserved = repository.knowledge_objects.every((object) => object.behavior_profile.length >= 3);
  const scenario_results_reproducible = repository.knowledge_objects.every((object) => object.scenario_results.length > 0);
  const mitigation_results_preserved = repository.knowledge_objects.every((object) => object.mitigation_results.length > 0);
  const operator_decisions_traceable = repository.knowledge_objects.every((object) => object.operator_decisions.length > 0);
  const forecast_evolution_deterministic = repository.knowledge_objects.every((object) => object.forecast_evolution.length > 0);
  const confidence_evolution_reproducible = repository.knowledge_objects.every((object) => object.confidence_evolution.length > 0);
  const prediction_knowledge_graph_complete = repository.knowledge_graph.nodes.length >= repository.knowledge_objects.length && repository.knowledge_graph.relationships.length >= repository.knowledge_objects.length;
  const relationshipOrder = repository.knowledge_graph.relationships.map((item) => item.deterministic_order);
  const knowledge_relationships_deterministic = relationshipOrder.every((value, index) => index === 0 || value >= relationshipOrder[index - 1]) && repository.knowledge_graph.relationships.every((item) => objectIdSet.has(item.from_knowledge_id) && objectIdSet.has(item.to_knowledge_id));
  const replay_artifacts_preserved = repository.replay_artifacts.length === repository.knowledge_objects.length;
  const certification_evidence_complete = repository.certification_evidence.length === repository.knowledge_objects.length;
  const lineage_references_immutable = repository.lineage_references.length === repository.knowledge_objects.length;
  const governance_metadata_preserved = repository.knowledge_objects.every((object) => object.governance_metadata.length > 0 && !object.governance_modified);
  const constitutional_metadata_preserved = repository.knowledge_objects.every((object) => object.constitutional_metadata.length > 0 && !object.constitutional_modified);
  const integrity_hashes_reproducible = repository.integrity_hashes.length === repository.knowledge_objects.length && computePredictionKnowledgeRepositoryHash(repository) === repository.repository_hash;
  const deterministic_knowledge_retrieval_verified = Object.values(repository.retrieval_indexes).every((ids) => [...ids].every((id) => objectIds.includes(id)) && [...ids].join("|") === [...ids].sort().join("|"));
  const replay_reconstructs_identical_knowledge_state = replayPredictionKnowledgeRepository(repository).deterministic;
  const unauthorized_knowledge_modification_rejected = !repository.knowledge_objects.some((object) => object.unauthorized_modified);
  const knowledge_deletion_detected = repository.knowledge_objects.length === knowledgeTypes.length;
  const knowledge_relationship_corruption_detected = knowledge_relationships_deterministic;
  const cross_tenant_knowledge_access_rejected = repository.tenant_id !== "external-tenant" && repository.knowledge_objects.every((object) => object.tenant_id === repository.tenant_id);
  const advisory_only_behavior_enforced = repository.knowledge_objects.every((object) => object.advisory_only && !object.autonomous_learning_performed);
  const failures = unique([
    ...(!knowledge_repository_contract_valid ? ["KNOWLEDGE_REPOSITORY_CONTRACT_INVALID" as const] : []),
    ...(!prediction_history_preserved ? ["PREDICTION_HISTORY_INCOMPLETE" as const] : []),
    ...(!prediction_models_versioned_deterministically ? ["MODEL_VERSIONING_INVALID" as const] : []),
    ...(!historical_accuracy_reproducible ? ["HISTORICAL_ACCURACY_NOT_REPRODUCIBLE" as const] : []),
    ...(!behavior_profiles_preserved ? ["BEHAVIOR_PROFILES_MISSING" as const] : []),
    ...(!scenario_results_reproducible ? ["SCENARIO_RESULTS_NOT_REPRODUCIBLE" as const] : []),
    ...(!mitigation_results_preserved ? ["MITIGATION_RESULTS_MISSING" as const] : []),
    ...(!operator_decisions_traceable ? ["OPERATOR_DECISIONS_NOT_TRACEABLE" as const] : []),
    ...(!forecast_evolution_deterministic ? ["FORECAST_EVOLUTION_NONDETERMINISTIC" as const] : []),
    ...(!confidence_evolution_reproducible ? ["CONFIDENCE_EVOLUTION_NOT_REPRODUCIBLE" as const] : []),
    ...(!prediction_knowledge_graph_complete ? ["KNOWLEDGE_GRAPH_INCOMPLETE" as const] : []),
    ...(!knowledge_relationships_deterministic ? ["KNOWLEDGE_RELATIONSHIPS_NONDETERMINISTIC" as const, "RELATIONSHIP_CORRUPTION_DETECTED" as const] : []),
    ...(!replay_artifacts_preserved ? ["REPLAY_ARTIFACTS_MISSING" as const] : []),
    ...(!certification_evidence_complete ? ["CERTIFICATION_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!lineage_references_immutable ? ["LINEAGE_REFERENCES_MUTABLE" as const] : []),
    ...(!governance_metadata_preserved ? ["GOVERNANCE_METADATA_MISSING" as const] : []),
    ...(!constitutional_metadata_preserved ? ["CONSTITUTIONAL_METADATA_MISSING" as const] : []),
    ...(!integrity_hashes_reproducible ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!deterministic_knowledge_retrieval_verified ? ["KNOWLEDGE_RETRIEVAL_NONDETERMINISTIC" as const] : []),
    ...(!replay_reconstructs_identical_knowledge_state ? ["REPLAY_RECONSTRUCTION_MISMATCH" as const] : []),
    ...(!unauthorized_knowledge_modification_rejected ? ["UNAUTHORIZED_MODIFICATION_DETECTED" as const] : []),
    ...(!knowledge_deletion_detected ? ["KNOWLEDGE_DELETION_DETECTED" as const] : []),
    ...(!knowledge_relationship_corruption_detected ? ["RELATIONSHIP_CORRUPTION_DETECTED" as const] : []),
    ...(!cross_tenant_knowledge_access_rejected ? ["CROSS_TENANT_ACCESS_DETECTED" as const] : []),
    ...(!advisory_only_behavior_enforced ? ["ADVISORY_ONLY_VIOLATION" as const, "AUTONOMOUS_LEARNING_DETECTED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { repository_id: repository.repository_id, valid, knowledge_repository_contract_valid, prediction_history_preserved, prediction_models_versioned_deterministically, historical_accuracy_reproducible, behavior_profiles_preserved, scenario_results_reproducible, mitigation_results_preserved, operator_decisions_traceable, forecast_evolution_deterministic, confidence_evolution_reproducible, prediction_knowledge_graph_complete, knowledge_relationships_deterministic, replay_artifacts_preserved, certification_evidence_complete, lineage_references_immutable, governance_metadata_preserved, constitutional_metadata_preserved, integrity_hashes_reproducible, deterministic_knowledge_retrieval_verified, replay_reconstructs_identical_knowledge_state, unauthorized_knowledge_modification_rejected, knowledge_deletion_detected, knowledge_relationship_corruption_detected, cross_tenant_knowledge_access_rejected, advisory_only_behavior_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("prediction-knowledge-validation", source) });
}

export function replayPredictionKnowledgeRepository(repository = runPredictionKnowledgeRepository()): PredictionKnowledgeReplayResult {
  const reconstructed_hash = computePredictionKnowledgeRepositoryHash(repository);
  const source = { replay_reference: `replay:${repository.repository_id}`, repository_id: repository.repository_id, deterministic: reconstructed_hash === repository.repository_hash && repository.replay_artifacts.length === repository.knowledge_objects.length, reconstructed_hash, original_hash: repository.repository_hash };
  return Object.freeze({ ...source, replay_result_hash: hashValue("prediction-knowledge-replay", source) });
}

export function buildPredictionKnowledgeObservabilitySurface(repository = runPredictionKnowledgeRepository()): PredictionKnowledgeObservabilitySurface {
  return Object.freeze({
    repository_id: repository.repository_id,
    tenant_id: repository.tenant_id,
    mission_id: repository.mission_id,
    knowledge_object_count: repository.knowledge_objects.length,
    relationship_count: repository.knowledge_graph.relationships.length,
    active_objects: repository.knowledge_objects.filter((object) => object.knowledge_state === "ACTIVE").length,
    certified_objects: repository.certification_evidence.length,
    advisory_only: true,
    repository_hash: repository.repository_hash,
  });
}

export function getPredictionKnowledgeRepositoryContract(): PredictionKnowledgeRepositoryContract {
  const repository = runPredictionKnowledgeRepository();
  const prediction = createPrediction();
  const historical = runHistoricalIntelligence();
  const risk = runRiskForecasting();
  const recommendations = runPreventativeRecommendations();
  const upstreamValid = validatePrediction(prediction).valid && validateHistoricalIntelligence(historical).valid && validateRiskForecasting(risk).valid && validatePreventativeRecommendations(recommendations).valid;
  return Object.freeze({
    doctrine: Object.freeze({
      repository_version: VERSION,
      principles: freezeArray(["immutable-knowledge-preservation", "deterministic-retrieval", "replay-reproducibility", "knowledge-traceability", "governance-first-architecture", "constitutional-compliance", "advisory-only-operation", "version-controlled-knowledge", "tenant-isolation", "certification-readiness", ...(upstreamValid ? ["upstream-predictive-intelligence-certified"] : [])]),
      knowledge_types: knowledgeTypes,
      lifecycle_states: lifecycleStates,
      relationship_types: relationshipTypes,
      autonomous_learning: false,
      advisory_only: true,
    }),
    repository,
    validation: validatePredictionKnowledgeRepository(repository),
    replay: replayPredictionKnowledgeRepository(repository),
    observability: buildPredictionKnowledgeObservabilitySurface(repository),
  });
}
