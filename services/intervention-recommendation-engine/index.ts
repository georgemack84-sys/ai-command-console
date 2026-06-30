import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildDriftHealthPackage } from "@/services/drift-health-intelligence";
import type { DriftHealthPackage, DriftHealthScenario } from "@/types/drift-health-intelligence";
import type {
  InterventionRecommendation,
  InterventionRecommendationCategory,
  InterventionRecommendationDashboardSurface,
  InterventionRecommendationEvidence,
  InterventionRecommendationFailureReason,
  InterventionRecommendationFramework,
  InterventionRecommendationMetadata,
  InterventionRecommendationPackage,
  InterventionRecommendationPriority,
  InterventionRecommendationReplayResult,
  InterventionRecommendationScenario,
  InterventionRecommendationSeverity,
  InterventionRecommendationState,
  InterventionRecommendationValidationResult,
} from "@/types/intervention-recommendation-engine";

const NOW = "2026-06-30T00:00:00.000Z";
const ENGINE_VERSION = "intervention-recommendation-engine/v8E.D" as const;
const PIPELINE = Object.freeze(["Runtime Alert Received", "Evidence Collection", "Impact Analysis", "Authority Validation", "Recommendation Generation", "Governance Validation", "Evidence Packaging", "Recommendation Published"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function driftScenarioFor(scenario: InterventionRecommendationScenario): DriftHealthScenario {
  if (scenario === "POLICY_INCONSISTENCY" || scenario === "GOVERNANCE_UNCERTAINTY" || scenario === "GOVERNANCE_BYPASS") return "POLICY_DRIFT";
  if (scenario === "CONFIDENCE_DEGRADATION" || scenario === "RECOMMENDATION_INSTABILITY" || scenario === "CONFIDENCE_RESTORATION_UNJUSTIFIED") return "CONFIDENCE_DEGRADATION";
  if (scenario === "EXECUTION_INSTABILITY" || scenario === "CRITICAL_EXECUTION_DRIFT" || scenario === "MINOR_EXECUTION_DRIFT") return "WORKFLOW_DEVIATION";
  if (scenario === "CHECKPOINT_FAILURE") return "CHECKPOINT_VIOLATION";
  if (scenario === "DEPENDENCY_FAILURE") return "DEPENDENCY_FAILURE";
  if (scenario === "SEVERE_WORKFLOW_CORRUPTION" || scenario === "UNRECOVERABLE_DEGRADATION" || scenario === "ROLLBACK_BOUNDARY_VIOLATION") return "CONSTITUTIONAL_DRIFT";
  if (scenario === "MISSING_SUPPORTING_EVIDENCE" || scenario === "EVIDENCE_REVIEW_INCOMPLETE" || scenario === "POLICY_REFERENCES_MISSING" || scenario === "CONSTITUTIONAL_REFERENCES_MISSING") return "EVIDENCE_INCOMPLETE";
  if (scenario === "REPLAY_MISMATCH") return "REPLAY_MISMATCH";
  if (scenario === "TENANT_VIOLATION") return "TENANT_VIOLATION";
  if (scenario === "HIDDEN_LOGIC") return "HIDDEN_ANALYSIS";
  if (scenario === "HASH_MISMATCH") return "HASH_MISMATCH";
  return "BASELINE";
}

function scenarioFailure(scenario: InterventionRecommendationScenario): InterventionRecommendationFailureReason | null {
  const map: Partial<Record<InterventionRecommendationScenario, InterventionRecommendationFailureReason>> = {
    NONDETERMINISTIC_RECOMMENDATION: "RECOMMENDATION_NONDETERMINISTIC",
    MISSING_SUPPORTING_EVIDENCE: "SUPPORTING_EVIDENCE_MISSING",
    GOVERNANCE_REVIEW_INCOMPLETE: "GOVERNANCE_REVIEW_INCOMPLETE",
    EVIDENCE_REVIEW_INCOMPLETE: "EVIDENCE_REVIEW_OMITS_OBSERVATIONS",
    UNSAFE_PAUSE: "PAUSE_RECOMMENDATION_UNSAFE",
    ROLLBACK_BOUNDARY_VIOLATION: "ROLLBACK_BOUNDARY_VIOLATION",
    CONFIDENCE_RESTORATION_UNJUSTIFIED: "CONFIDENCE_RESTORATION_UNJUSTIFIED",
    POLICY_REFERENCES_MISSING: "POLICY_REFERENCES_MISSING",
    CONSTITUTIONAL_REFERENCES_MISSING: "CONSTITUTIONAL_REFERENCES_MISSING",
    AUTHORITY_UNDEFINED: "AUTHORITY_REQUIREMENTS_UNDEFINED",
    REPLAY_MISMATCH: "REPLAY_RECONSTRUCTION_MISMATCH",
    LINEAGE_INCOMPLETE: "LINEAGE_INCOMPLETE",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    HIDDEN_LOGIC: "HIDDEN_RECOMMENDATION_LOGIC",
    AUTONOMOUS_INTERVENTION: "AUTONOMOUS_INTERVENTION_ATTEMPTED",
    GOVERNANCE_BYPASS: "GOVERNANCE_OR_OPERATOR_BYPASS",
    HASH_MISMATCH: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario] ?? null;
}

function categoryFor(scenario: InterventionRecommendationScenario, drift: DriftHealthPackage): InterventionRecommendationCategory {
  if (["EXECUTION_INSTABILITY", "CHECKPOINT_FAILURE", "DEPENDENCY_FAILURE", "UNSAFE_PAUSE"].includes(scenario)) return "PAUSE";
  if (["CRITICAL_EXECUTION_DRIFT", "SEVERE_WORKFLOW_CORRUPTION", "UNRECOVERABLE_DEGRADATION", "ROLLBACK_BOUNDARY_VIOLATION"].includes(scenario)) return "ROLLBACK";
  if (["CONFIDENCE_DEGRADATION", "RECOMMENDATION_INSTABILITY", "GOVERNANCE_UNCERTAINTY", "CONFIDENCE_RESTORATION_UNJUSTIFIED"].includes(scenario)) return "CONFIDENCE";
  if (drift.drift_intelligence.severity === "CRITICAL") return "ROLLBACK";
  if (drift.health_assessment.degradation_trend === "COLLAPSED") return "CONFIDENCE";
  return "INTERVENTION";
}

function typeFor(category: InterventionRecommendationCategory, scenario: InterventionRecommendationScenario): string {
  if (category === "PAUSE") return scenario === "CHECKPOINT_FAILURE" ? "CHECKPOINT_PAUSE" : scenario === "DEPENDENCY_FAILURE" ? "DEPENDENCY_PAUSE" : "TEMPORARY_EXECUTION_PAUSE";
  if (category === "ROLLBACK") return scenario === "SEVERE_WORKFLOW_CORRUPTION" ? "WORKFLOW_ROLLBACK" : scenario === "UNRECOVERABLE_DEGRADATION" ? "RECOVERY_RECOMMENDATION" : "CHECKPOINT_ROLLBACK";
  if (category === "CONFIDENCE") return scenario === "RECOMMENDATION_INSTABILITY" ? "REGENERATE_RECOMMENDATION" : scenario === "GOVERNANCE_UNCERTAINTY" ? "REVALIDATE_GOVERNANCE" : "COLLECT_ADDITIONAL_EVIDENCE";
  if (scenario === "POLICY_INCONSISTENCY") return "GOVERNANCE_REVIEW";
  if (scenario === "EVIDENCE_UNCERTAINTY") return "EVIDENCE_REVIEW";
  return "OPERATOR_REVIEW";
}

function severityFor(drift: DriftHealthPackage): InterventionRecommendationSeverity {
  const severity = drift.drift_intelligence.severity;
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "HIGH") return "HIGH";
  if (severity === "MEDIUM") return "MEDIUM";
  if (severity === "LOW") return "LOW";
  return "INFORMATIONAL";
}

function priorityFor(severity: InterventionRecommendationSeverity): InterventionRecommendationPriority {
  if (severity === "CRITICAL") return "IMMEDIATE";
  if (severity === "HIGH") return "URGENT";
  if (severity === "MEDIUM") return "HIGH";
  if (severity === "LOW") return "NORMAL";
  return "LOW";
}

function recommendationHashSource(recommendation: Omit<InterventionRecommendation, "integrity_hash"> | InterventionRecommendation) {
  return {
    recommendation_id: recommendation.recommendation_id,
    supervision_id: recommendation.supervision_id,
    execution_id: recommendation.execution_id,
    mission_id: recommendation.mission_id,
    tenant_id: recommendation.tenant_id,
    recommendation_category: recommendation.recommendation_category,
    recommendation_type: recommendation.recommendation_type,
    severity: recommendation.severity,
    priority: recommendation.priority,
    recommended_action: recommendation.recommended_action,
    justification: recommendation.justification,
    expected_outcome: recommendation.expected_outcome,
    authority_required: recommendation.authority_required,
    operator_required: recommendation.operator_required,
    timestamp: recommendation.timestamp,
    replay_reference: recommendation.replay_reference,
    lineage_reference: recommendation.lineage_reference,
  };
}

export function computeInterventionRecommendationHash(recommendation: Omit<InterventionRecommendation, "integrity_hash"> | InterventionRecommendation): string {
  return hashValue("intervention-recommendation", recommendationHashSource(recommendation));
}

function buildRecommendation(pkg: DriftHealthPackage, scenario: InterventionRecommendationScenario): InterventionRecommendation {
  const category = categoryFor(scenario, pkg);
  const severity = severityFor(pkg);
  const recType = typeFor(category, scenario);
  const recommended_action = `${recType}: ${category === "ROLLBACK" ? "recommend governed rollback path" : category === "PAUSE" ? "recommend governed pause" : category === "CONFIDENCE" ? "recommend confidence restoration" : "recommend operator review"}`;
  const source = {
    recommendation_id: id("IREC", "intervention-recommendation-id", { drift: pkg.drift_intelligence.drift_id, scenario }),
    supervision_id: pkg.source_observation_package.source_supervision_contract.supervision_id,
    execution_id: pkg.drift_intelligence.execution_id,
    mission_id: pkg.drift_intelligence.mission_id,
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_beta" : pkg.drift_intelligence.tenant_id,
    recommendation_category: category,
    recommendation_type: recType,
    severity,
    priority: priorityFor(severity),
    recommended_action,
    justification: `Generated from ${pkg.drift_intelligence.drift_type} with ${pkg.health_assessment.runtime_health} runtime health.`,
    expected_outcome: "Operator-governed review reduces runtime risk without autonomous intervention.",
    authority_required: freezeArray(scenario === "AUTHORITY_UNDEFINED" ? [] : ["operator:mission-control", "governance:runtime-supervision"]),
    operator_required: scenario !== "AUTONOMOUS_INTERVENTION",
    timestamp: NOW,
    replay_reference: scenario === "REPLAY_MISMATCH" ? "" : pkg.drift_intelligence.replay_reference,
    lineage_reference: scenario === "LINEAGE_INCOMPLETE" ? "" : pkg.drift_intelligence.lineage_reference,
  };
  return Object.freeze({ ...source, integrity_hash: scenario === "HASH_MISMATCH" ? "tampered-intervention-recommendation" : computeInterventionRecommendationHash(source) });
}

function evidenceHashSource(evidence: Omit<InterventionRecommendationEvidence, "integrity_hash"> | InterventionRecommendationEvidence) {
  return {
    evidence_id: evidence.evidence_id,
    recommendation_id: evidence.recommendation_id,
    supporting_observations: evidence.supporting_observations,
    drift_assessments: evidence.drift_assessments,
    health_assessments: evidence.health_assessments,
    confidence_assessments: evidence.confidence_assessments,
    governance_assessments: evidence.governance_assessments,
    evidence_quality: evidence.evidence_quality,
    timestamp: evidence.timestamp,
  };
}

export function computeInterventionEvidenceHash(evidence: Omit<InterventionRecommendationEvidence, "integrity_hash"> | InterventionRecommendationEvidence): string {
  return hashValue("intervention-recommendation-evidence", evidenceHashSource(evidence));
}

function buildEvidence(recommendation: InterventionRecommendation, pkg: DriftHealthPackage, scenario: InterventionRecommendationScenario): InterventionRecommendationEvidence {
  const missing = scenario === "MISSING_SUPPORTING_EVIDENCE" || scenario === "EVIDENCE_REVIEW_INCOMPLETE";
  const source = {
    evidence_id: id("IRE", "intervention-recommendation-evidence-id", recommendation.recommendation_id),
    recommendation_id: recommendation.recommendation_id,
    supporting_observations: freezeArray(missing ? [] : pkg.drift_evidence.supporting_observations),
    drift_assessments: freezeArray([pkg.drift_intelligence.integrity_hash]),
    health_assessments: freezeArray([pkg.health_assessment.integrity_hash]),
    confidence_assessments: freezeArray(scenario === "CONFIDENCE_RESTORATION_UNJUSTIFIED" ? [] : [String(pkg.drift_intelligence.confidence)]),
    governance_assessments: freezeArray(scenario === "GOVERNANCE_REVIEW_INCOMPLETE" ? [] : [pkg.supervision_alert.governance_state]),
    evidence_quality: missing ? "INSUFFICIENT" as const : pkg.validation.validation_state === "PASS" ? "COMPLETE" as const : "PARTIAL" as const,
    timestamp: NOW,
  };
  return Object.freeze({ ...source, integrity_hash: computeInterventionEvidenceHash(source) });
}

function metadataHashSource(metadata: Omit<InterventionRecommendationMetadata, "integrity_hash"> | InterventionRecommendationMetadata) {
  return {
    metadata_id: metadata.metadata_id,
    evidence: metadata.evidence,
    confidence: metadata.confidence,
    explanation: metadata.explanation,
    policy_references: metadata.policy_references,
    constitutional_references: metadata.constitutional_references,
    authority_references: metadata.authority_references,
    replay_references: metadata.replay_references,
    lineage_reference: metadata.lineage_reference,
  };
}

export function computeInterventionMetadataHash(metadata: Omit<InterventionRecommendationMetadata, "integrity_hash"> | InterventionRecommendationMetadata): string {
  return hashValue("intervention-recommendation-metadata", metadataHashSource(metadata));
}

function buildMetadata(recommendation: InterventionRecommendation, evidence: InterventionRecommendationEvidence, pkg: DriftHealthPackage, scenario: InterventionRecommendationScenario): InterventionRecommendationMetadata {
  const observation = pkg.source_observation_package;
  const contract = observation.source_supervision_contract;
  const policyReferences = observation.runtime_evidence.policy_references.length ? observation.runtime_evidence.policy_references : contract.monitoring_policies.governance_policy_refs;
  const constitutionalReferences = observation.runtime_evidence.constitutional_references.length ? observation.runtime_evidence.constitutional_references : contract.monitoring_policies.constitutional_policy_refs;
  const authorityReferences = observation.runtime_evidence.authority_references.length ? observation.runtime_evidence.authority_references : [contract.monitored_execution.approved_authority];
  const source = {
    metadata_id: id("IRM", "intervention-recommendation-metadata-id", recommendation.recommendation_id),
    evidence: evidence.integrity_hash,
    confidence: pkg.drift_intelligence.confidence,
    explanation: freezeArray(scenario === "CONFIDENCE_RESTORATION_UNJUSTIFIED" ? [] : [recommendation.justification, recommendation.expected_outcome, "Risks of ignoring recommendation include drift escalation and reduced replay confidence."]),
    policy_references: freezeArray(scenario === "POLICY_REFERENCES_MISSING" ? [] : policyReferences),
    constitutional_references: freezeArray(scenario === "CONSTITUTIONAL_REFERENCES_MISSING" ? [] : constitutionalReferences),
    authority_references: freezeArray(scenario === "AUTHORITY_UNDEFINED" ? [] : authorityReferences),
    replay_references: freezeArray(scenario === "REPLAY_MISMATCH" ? [] : [recommendation.replay_reference, pkg.replay.replay_hash]),
    lineage_reference: scenario === "LINEAGE_INCOMPLETE" ? "" : recommendation.lineage_reference,
  };
  return Object.freeze({ ...source, integrity_hash: computeInterventionMetadataHash(source) });
}

function collectFailures(pkg: DriftHealthPackage, recommendation: InterventionRecommendation, evidence: InterventionRecommendationEvidence, metadata: InterventionRecommendationMetadata, scenario: InterventionRecommendationScenario): readonly InterventionRecommendationFailureReason[] {
  const failures: InterventionRecommendationFailureReason[] = [];
  const scenarioReason = scenarioFailure(scenario);
  if (scenarioReason) failures.push(scenarioReason);
  if (scenario === "MINOR_EXECUTION_DRIFT" && recommendation.recommendation_type !== "OPERATOR_REVIEW") failures.push("OPERATOR_REVIEW_NOT_GENERATED");
  if (!evidence.supporting_observations.length) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (recommendation.recommendation_type === "GOVERNANCE_REVIEW" && !evidence.governance_assessments.length) failures.push("GOVERNANCE_REVIEW_INCOMPLETE");
  if (recommendation.recommendation_type === "EVIDENCE_REVIEW" && !evidence.supporting_observations.length) failures.push("EVIDENCE_REVIEW_OMITS_OBSERVATIONS");
  if (recommendation.recommendation_category === "PAUSE" && scenario === "UNSAFE_PAUSE") failures.push("PAUSE_RECOMMENDATION_UNSAFE");
  if (recommendation.recommendation_category === "ROLLBACK" && scenario === "ROLLBACK_BOUNDARY_VIOLATION") failures.push("ROLLBACK_BOUNDARY_VIOLATION");
  if (recommendation.recommendation_category === "CONFIDENCE" && !metadata.explanation.length) failures.push("CONFIDENCE_RESTORATION_UNJUSTIFIED");
  if (!metadata.policy_references.length) failures.push("POLICY_REFERENCES_MISSING");
  if (!metadata.constitutional_references.length) failures.push("CONSTITUTIONAL_REFERENCES_MISSING");
  if (!recommendation.authority_required.length || !metadata.authority_references.length) failures.push("AUTHORITY_REQUIREMENTS_UNDEFINED");
  if (!recommendation.replay_reference || !metadata.replay_references.length) failures.push("REPLAY_RECONSTRUCTION_MISMATCH");
  if (!recommendation.lineage_reference || !metadata.lineage_reference) failures.push("LINEAGE_INCOMPLETE");
  if (recommendation.tenant_id !== pkg.drift_intelligence.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (scenario === "HIDDEN_LOGIC") failures.push("HIDDEN_RECOMMENDATION_LOGIC");
  if (scenario === "AUTONOMOUS_INTERVENTION" || !recommendation.operator_required) failures.push("AUTONOMOUS_INTERVENTION_ATTEMPTED");
  if (scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_OR_OPERATOR_BYPASS");
  if (computeInterventionRecommendationHash(recommendation) !== recommendation.integrity_hash || computeInterventionEvidenceHash(evidence) !== evidence.integrity_hash || computeInterventionMetadataHash(metadata) !== metadata.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "NONDETERMINISTIC_RECOMMENDATION") failures.push("RECOMMENDATION_NONDETERMINISTIC");
  return unique(failures);
}

function validatePackage(pkgBase: Omit<InterventionRecommendationPackage, "validation" | "replay" | "package_hash">, scenario: InterventionRecommendationScenario): InterventionRecommendationValidationResult {
  const failures = collectFailures(pkgBase.source_drift_health_package, pkgBase.recommendation, pkgBase.recommendation_evidence, pkgBase.recommendation_metadata, scenario);
  const has = (failure: InterventionRecommendationFailureReason) => failures.includes(failure);
  const validation_state = failures.length ? "FAIL" as const : "PASS" as const;
  const source = { package_id: pkgBase.package_id, validation_state, failures };
  return Object.freeze({
    validation_id: id("IRV", "intervention-recommendation-validation-id", source),
    package_id: pkgBase.package_id,
    validation_state,
    failures,
    evidence_exists: !has("SUPPORTING_EVIDENCE_MISSING"),
    deterministic: !has("RECOMMENDATION_NONDETERMINISTIC"),
    reproducible: !has("RECOMMENDATION_NONDETERMINISTIC"),
    authority_identified: !has("AUTHORITY_REQUIREMENTS_UNDEFINED"),
    policy_references_complete: !has("POLICY_REFERENCES_MISSING"),
    constitutional_references_complete: !has("CONSTITUTIONAL_REFERENCES_MISSING"),
    replay_ready: !has("REPLAY_RECONSTRUCTION_MISMATCH"),
    lineage_preserved: !has("LINEAGE_INCOMPLETE"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("AUTONOMOUS_INTERVENTION_ATTEMPTED") && !has("GOVERNANCE_OR_OPERATOR_BYPASS"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    ready_for_publication: validation_state === "PASS",
    validation_hash: hashValue("intervention-recommendation-validation", source),
  });
}

function replayPackage(pkgBase: Omit<InterventionRecommendationPackage, "replay" | "package_hash">, scenario: InterventionRecommendationScenario): InterventionRecommendationReplayResult {
  const source = {
    replay_id: id("IRR", "intervention-recommendation-replay-id", pkgBase.package_id),
    package_id: pkgBase.package_id,
    reconstructed_pipeline: freezeArray(PIPELINE),
    reconstructed_recommendation_hash: scenario === "REPLAY_MISMATCH" ? "mismatched-intervention-replay" : pkgBase.recommendation.integrity_hash,
    reconstructed_evidence_hash: pkgBase.recommendation_evidence.integrity_hash,
    reconstructed_metadata_hash: pkgBase.recommendation_metadata.integrity_hash,
    validation_state: pkgBase.validation.validation_state,
    failure_reason: pkgBase.validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("intervention-recommendation-replay", source) });
}

function packageHashSource(pkg: Omit<InterventionRecommendationPackage, "package_hash">) {
  return {
    package_id: pkg.package_id,
    engine_version: pkg.engine_version,
    drift_package_id: pkg.source_drift_health_package.package_id,
    recommendation_hash: pkg.recommendation.integrity_hash,
    evidence_hash: pkg.recommendation_evidence.integrity_hash,
    metadata_hash: pkg.recommendation_metadata.integrity_hash,
    validation_hash: pkg.validation.validation_hash,
    replay_hash: pkg.replay.replay_hash,
    advisory_only: pkg.advisory_only,
  };
}

export function buildInterventionRecommendationPackage(input: { scenario?: InterventionRecommendationScenario; driftHealthPackage?: DriftHealthPackage } = {}): InterventionRecommendationPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_drift_health_package = input.driftHealthPackage ?? buildDriftHealthPackage({ scenario: driftScenarioFor(scenario) });
  const recommendation = buildRecommendation(source_drift_health_package, scenario);
  const recommendation_evidence = buildEvidence(recommendation, source_drift_health_package, scenario);
  const recommendation_metadata = buildMetadata(recommendation, recommendation_evidence, source_drift_health_package, scenario);
  const package_id = id("IRP", "intervention-recommendation-package-id", { drift: source_drift_health_package.package_id, scenario });
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_drift_health_package,
    recommendation_state: "PUBLISHED" as InterventionRecommendationState,
    recommendation,
    recommendation_evidence,
    recommendation_metadata,
    advisory_only: true as const,
    execution_performed: false as const,
    rollback_performed: false as const,
    pause_performed: false as const,
    authority_granted: false as const,
    governance_bypassed: false as const,
    hidden_logic_used: false as const,
  };
  const validation = validatePackage(base, scenario);
  const withValidation = { ...base, validation };
  const replay = replayPackage(withValidation, scenario);
  const full = { ...withValidation, replay };
  return Object.freeze({ ...full, package_hash: hashValue("intervention-recommendation-package", packageHashSource(full)) });
}

export function buildInterventionRecommendationDashboardSurface(pkg = buildInterventionRecommendationPackage()): InterventionRecommendationDashboardSurface {
  return Object.freeze({
    package_id: pkg.package_id,
    recommendation_id: pkg.recommendation.recommendation_id,
    execution_id: pkg.recommendation.execution_id,
    category: pkg.recommendation.recommendation_category,
    severity: pkg.recommendation.severity,
    priority: pkg.recommendation.priority,
    recommended_action: pkg.recommendation.recommended_action,
    operator_required: pkg.recommendation.operator_required,
    validation_state: pkg.validation.validation_state,
    failures: pkg.validation.failures,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getInterventionRecommendationFramework(): InterventionRecommendationFramework {
  const pkg = buildInterventionRecommendationPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["advisory-only-recommendations", "no-execution-authority", "operator-supremacy", "governance-approval-enforced", "constitutional-compliance", "deterministic-generation", "replayable-logic", "evidence-backed", "tenant-isolated", "fail-closed-authority"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["GENERATED", "VALIDATING", "AUTHORIZED", "PUBLISHED", "ACKNOWLEDGED", "REJECTED", "SUPERSEDED", "ARCHIVED"] as const),
      categories: freezeArray(["INTERVENTION", "PAUSE", "ROLLBACK", "CONFIDENCE"] as const),
      priorities: freezeArray(["LOW", "NORMAL", "HIGH", "URGENT", "IMMEDIATE"] as const),
    }),
    package: pkg,
    dashboard: buildInterventionRecommendationDashboardSurface(pkg),
  });
}
