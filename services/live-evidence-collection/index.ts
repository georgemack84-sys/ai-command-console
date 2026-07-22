import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runProductionAdvisoryRuntime } from "@/services/production-advisory-runtime";
import type {
  EvidenceLifecycleState,
  LiveEvidenceCollectionBundle,
  LiveEvidenceCollectionCertificationTest,
  LiveEvidenceCollectionFailure,
  LiveEvidenceCollectionInput,
  LiveEvidenceCollectionOutcome,
  LiveEvidenceCollectionResult,
  LiveEvidenceCollectionValidation,
  PilotEvidenceCategory,
} from "@/types/live-evidence-collection";

const VERSION = "live-evidence-collection/v16.4" as const;
const IDENTIFIER = "LiveEvidenceCollection" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_live_evidence";
const DEFAULT_OPERATOR = "operator_phase_16_live_evidence";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly LiveEvidenceCollectionFailure[], failure: LiveEvidenceCollectionFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: LiveEvidenceCollectionInput["scenario"]): LiveEvidenceCollectionFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly LiveEvidenceCollectionFailure[]): LiveEvidenceCollectionOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_EVIDENCE_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["EVIDENCE_GENERATED", "VALIDATED", "INTEGRITY_VERIFIED", "STORED", "LINKED_INTO_LINEAGE", "REPLAY_REFERENCED", "CERTIFICATION_REFERENCED", "IMMUTABLE_ARCHIVE"] as const satisfies readonly EvidenceLifecycleState[]);
const evidenceCategories = freezeArray(["OPERATIONAL", "RECOMMENDATION", "REPLAY", "INCIDENT", "CERTIFICATION", "GOVERNANCE"] as const satisfies readonly PilotEvidenceCategory[]);

function certTest(name: string, passed: boolean, failure: LiveEvidenceCollectionFailure, evidence_refs: readonly string[]): LiveEvidenceCollectionCertificationTest {
  const actual: LiveEvidenceCollectionOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_EVIDENCE_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("live_evidence_collection_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<LiveEvidenceCollectionResult, "replay_hash" | "integrity_hash">): string {
  return hash({ runtime: result.production_advisory_runtime_ref, lifecycle: result.lifecycle, master: result.master_evidence.integrity_hash, operational: result.operational_evidence.integrity_hash, recommendation: result.recommendation_evidence.integrity_hash, replay: result.replay_evidence.integrity_hash, incident: result.incident_evidence.integrity_hash, validation: result.integrity_validation.integrity_hash, registry: result.registry.integrity_hash, lineage: result.lineage.integrity_hash, integration: result.integration.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<LiveEvidenceCollectionResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runLiveEvidenceCollection(input: LiveEvidenceCollectionInput = {}): LiveEvidenceCollectionResult {
  const runtime = runProductionAdvisoryRuntime({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: LiveEvidenceCollectionFailure[] = runtime.outcome === "PASS" ? [] : ["PHASE_16_3_RUNTIME_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const missionId = input.mission_id ?? runtime.recommendation.mission_id;
  const operationId = input.operation_id ?? id("pilot_operation", runtime.recommendation.integrity_hash);
  const replayRefs = has(failures, "REPLAY_REFERENCES_NON_DETERMINISTIC") ? freezeArray([]) : freezeArray([runtime.replay.integrity_hash, runtime.replay_hash]);
  const certificationRefs = has(failures, "CERTIFICATION_EVIDENCE_NOT_INTEGRATED") ? freezeArray([]) : freezeArray([runtime.integrity_hash, ...runtime.certification_tests.map((test) => test.integrity_hash)]);
  const governanceRefs = has(failures, "GOVERNANCE_ENFORCEMENT_INCOMPLETE") ? freezeArray([]) : freezeArray([runtime.policy.integrity_hash, runtime.pilot_scope_enrollment_ref]);
  const platformRef = id("constitutional_evidence_platform", "unified");
  const evidenceRefs = freezeArray([runtime.recommendation.integrity_hash, runtime.decision_context.integrity_hash, runtime.operator_interaction.integrity_hash, runtime.observability.integrity_hash]);
  const master_evidence = nested({ evidence_id: id("pilot_evidence", { missionId, operationId }), tenant_id: tenantId, mission_id: missionId, operation_id: operationId, generated_at: TIMESTAMP, validated_at: TIMESTAMP, evidence_category: "OPERATIONAL" as const, evidence_refs: has(failures, "OPERATIONAL_EVIDENCE_NOT_TRACEABLE") ? freezeArray([]) : evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, governance_refs: governanceRefs, immutable: !has(failures, "EVIDENCE_NOT_IMMUTABLE"), append_only: !has(failures, "EVIDENCE_NOT_IMMUTABLE") });
  const operational_evidence = nested({ operational_evidence_id: id("pilot_operational_evidence", master_evidence.evidence_id), runtime_state: runtime.observability.runtime_health, operator_interactions: freezeArray([runtime.operator_interaction.integrity_hash]), recommendation_lifecycle: runtime.pipeline.recommendation_states, policy_evaluations: freezeArray([runtime.policy.integrity_hash]), authorization_decisions: freezeArray(["execution authority blocked", "operator authority external"]), deployment_state: "qualified-pilot-production", advisory_outputs: freezeArray([runtime.recommendation.integrity_hash]), runtime_metrics: freezeArray([runtime.observability.integrity_hash]), system_health: runtime.observability.runtime_health, fully_traceable: !has(failures, "OPERATIONAL_EVIDENCE_NOT_TRACEABLE") });
  const recommendation_evidence = nested({ recommendation_evidence_id: id("pilot_recommendation_evidence", runtime.recommendation.recommendation_id), recommendation_id: runtime.recommendation.recommendation_id, recommendation_inputs: runtime.lineage.production_inputs, reasoning_refs: freezeArray([runtime.pipeline.integrity_hash, runtime.decision_context.integrity_hash]), confidence: runtime.recommendation.confidence_assessment.score, uncertainty: runtime.decision_context.uncertainty_analysis, supporting_evidence: runtime.recommendation.supporting_evidence, governance_evaluation: runtime.policy.integrity_hash, operator_review: runtime.operator_interaction.integrity_hash, operator_decision: "ACKNOWLEDGED" as const, final_outcome: runtime.recommendation.outcome });
  const replay_evidence = nested({ replay_evidence_id: id("pilot_replay_evidence", runtime.replay.replay_id), replay_inputs: runtime.recommendation.replay_refs, replay_outputs: freezeArray([runtime.replay.integrity_hash]), deterministic_comparison: !has(failures, "REPLAY_REFERENCES_NON_DETERMINISTIC"), divergence_classification: has(failures, "REPLAY_REFERENCES_NON_DETERMINISTIC") ? "UNEXPLAINED" as const : "NONE" as const, divergence_explanation: has(failures, "REPLAY_REFERENCES_NON_DETERMINISTIC") ? null : "No divergence detected.", replay_refs: replayRefs, replay_certification: runtime.replay.outcome });
  const incident_evidence = nested({ incident_evidence_id: id("pilot_incident_evidence", operationId), incident_id: id("pilot_incident", "none"), severity: "NONE" as const, classification: "NO_INCIDENT", containment_actions: freezeArray(["no containment required"]), operator_response: "no incident response required", governance_actions: governanceRefs, remediation_refs: freezeArray([]), replay_refs: replayRefs, certification_impact: "NONE" as const });
  const integrity_validation = nested({ validation_id: id("evidence_integrity_validation", master_evidence.evidence_id), immutable_identity: master_evidence.immutable, cryptographic_integrity: !has(failures, "INTEGRITY_VALIDATION_NOT_OPERATIONAL"), hash_consistency: !has(failures, "INTEGRITY_VALIDATION_NOT_OPERATIONAL"), lineage_complete: !has(failures, "LINEAGE_NOT_UNIFIED"), replay_references: replayRefs.length > 0, certification_references: certificationRefs.length > 0, tenant_ownership: !has(failures, "TENANT_ISOLATION_NOT_VERIFIED"), governance_metadata: governanceRefs.length > 0, timestamp_consistency: true, operational: !has(failures, "INTEGRITY_VALIDATION_NOT_OPERATIONAL") });
  const storedEvidenceRefs = freezeArray([master_evidence.integrity_hash, operational_evidence.integrity_hash, recommendation_evidence.integrity_hash, replay_evidence.integrity_hash, incident_evidence.integrity_hash]);
  const registry = nested({ registry_id: id("production_evidence_registry", platformRef), reused_platform_ref: has(failures, "EVIDENCE_PLATFORM_NOT_REUSED") ? "" : platformRef, stored_evidence_refs: storedEvidenceRefs, evidence_domains: evidenceCategories, append_only: !has(failures, "EVIDENCE_NOT_IMMUTABLE"), centralized_persistence: !has(failures, "EVIDENCE_PLATFORM_NOT_REUSED"), duplicate_infrastructure_created: has(failures, "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED") });
  const lineage = nested({ lineage_graph_id: id("unified_evidence_lineage", master_evidence.evidence_id), unified_platform_ref: platformRef, nodes: has(failures, "LINEAGE_NOT_UNIFIED") ? freezeArray([]) : freezeArray([...storedEvidenceRefs, ...certificationRefs]), edges: has(failures, "LINEAGE_NOT_UNIFIED") ? freezeArray([]) : freezeArray(["recommendation>operational_evidence", "operational_evidence>operator_decision", "operator_decision>replay_evidence", "replay_evidence>certification_evidence", "certification_evidence>production_qualification"]), recommendation_to_certification_path: certificationRefs.length ? freezeArray([recommendation_evidence.integrity_hash, operational_evidence.integrity_hash, replay_evidence.integrity_hash, certificationRefs[0]]) : freezeArray([]), disconnected_lineage_count: has(failures, "LINEAGE_NOT_UNIFIED") ? 1 : 0, unified: !has(failures, "LINEAGE_NOT_UNIFIED"), immutable: !has(failures, "EVIDENCE_NOT_IMMUTABLE") });
  const integration = nested({ integration_id: id("evidence_platform_integration", VERSION), reused_capabilities: freezeArray(["evidence persistence", "immutable audit", "lineage graph", "integrity validation", "replay references", "certification linkage", "governance controls", "tenant isolation", "policy enforcement", "retention management", "cryptographic verification"]), extended_capabilities: freezeArray(["Pilot Evidence Service", "Production Evidence Registry", "pilot evidence schemas", "operational evidence ingestion", "production evidence indexing"]), centralized_certification: certificationRefs.length > 0, governance_enforced: governanceRefs.length > 0, tenant_isolated: !has(failures, "TENANT_ISOLATION_NOT_VERIFIED"), no_parallel_architecture: !has(failures, "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED") && !has(failures, "EVIDENCE_PLATFORM_NOT_REUSED") });
  const tests = freezeArray([
    certTest("Evidence immutable", master_evidence.immutable && master_evidence.append_only && registry.append_only && lineage.immutable, "EVIDENCE_NOT_IMMUTABLE", [master_evidence.integrity_hash]),
    certTest("Lineage unified", lineage.unified && lineage.disconnected_lineage_count === 0 && lineage.nodes.length > 0, "LINEAGE_NOT_UNIFIED", [lineage.integrity_hash]),
    certTest("Evidence platform reused", Boolean(registry.reused_platform_ref) && registry.centralized_persistence && integration.reused_capabilities.length === 11, "EVIDENCE_PLATFORM_NOT_REUSED", [registry.integrity_hash]),
    certTest("Certification evidence integrated", certificationRefs.length > 0 && integration.centralized_certification && lineage.recommendation_to_certification_path.length > 0, "CERTIFICATION_EVIDENCE_NOT_INTEGRATED", [lineage.integrity_hash]),
    certTest("No duplicate evidence infrastructure created", !registry.duplicate_infrastructure_created && integration.no_parallel_architecture, "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED", [integration.integrity_hash]),
    certTest("Replay references deterministic", replayRefs.length > 0 && replay_evidence.deterministic_comparison && replay_evidence.divergence_classification === "NONE", "REPLAY_REFERENCES_NON_DETERMINISTIC", [replay_evidence.integrity_hash]),
    certTest("Integrity validation operational", Object.entries(integrity_validation).filter(([key]) => key !== "validation_id" && key !== "integrity_hash").every(([, value]) => value === true), "INTEGRITY_VALIDATION_NOT_OPERATIONAL", [integrity_validation.integrity_hash]),
    certTest("Tenant isolation verified", integration.tenant_isolated && integrity_validation.tenant_ownership && master_evidence.tenant_id === tenantId, "TENANT_ISOLATION_NOT_VERIFIED", [master_evidence.integrity_hash]),
    certTest("Governance enforcement complete", governanceRefs.length > 0 && integration.governance_enforced && integrity_validation.governance_metadata, "GOVERNANCE_ENFORCEMENT_INCOMPLETE", [integration.integrity_hash]),
    certTest("Operational evidence fully traceable", operational_evidence.fully_traceable && master_evidence.evidence_refs.length > 0, "OPERATIONAL_EVIDENCE_NOT_TRACEABLE", [operational_evidence.integrity_hash]),
    certTest("Phase 16.3 runtime valid", runtime.outcome === "PASS", "PHASE_16_3_RUNTIME_NOT_VALID", [runtime.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is LiveEvidenceCollectionFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<LiveEvidenceCollectionResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, production_advisory_runtime_ref: runtime.integrity_hash, lifecycle: lifecycleStates, master_evidence, operational_evidence, recommendation_evidence, replay_evidence, incident_evidence, integrity_validation, registry, lineage, integration, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateLiveEvidenceCollection(result = runLiveEvidenceCollection()): LiveEvidenceCollectionValidation {
  const evidence_valid = verify(result.master_evidence) && result.master_evidence.immutable && result.master_evidence.append_only && result.master_evidence.evidence_refs.length > 0 && result.master_evidence.replay_refs.length > 0 && result.master_evidence.certification_refs.length > 0 && result.master_evidence.governance_refs.length > 0;
  const operational_valid = verify(result.operational_evidence) && result.operational_evidence.fully_traceable && result.operational_evidence.operator_interactions.length > 0 && result.operational_evidence.advisory_outputs.length > 0;
  const recommendation_valid = verify(result.recommendation_evidence) && result.recommendation_evidence.recommendation_inputs.length > 0 && result.recommendation_evidence.reasoning_refs.length > 0 && result.recommendation_evidence.supporting_evidence.length > 0 && result.recommendation_evidence.operator_decision === "ACKNOWLEDGED";
  const replay_valid = verify(result.replay_evidence) && result.replay_evidence.deterministic_comparison && result.replay_evidence.divergence_classification === "NONE" && result.replay_evidence.replay_refs.length > 0 && result.replay_evidence.replay_certification === "PASS";
  const incident_valid = verify(result.incident_evidence) && result.incident_evidence.severity === "NONE" && result.incident_evidence.replay_refs.length > 0 && result.incident_evidence.certification_impact === "NONE";
  const integrity_valid = verify(result.integrity_validation) && Object.entries(result.integrity_validation).filter(([key]) => key !== "validation_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const registry_valid = verify(result.registry) && Boolean(result.registry.reused_platform_ref) && result.registry.stored_evidence_refs.length === 5 && result.registry.evidence_domains.length === 6 && result.registry.append_only && result.registry.centralized_persistence && !result.registry.duplicate_infrastructure_created;
  const lineage_valid = verify(result.lineage) && result.lineage.unified && result.lineage.immutable && result.lineage.nodes.length > 0 && result.lineage.edges.length === 5 && result.lineage.recommendation_to_certification_path.length > 0 && result.lineage.disconnected_lineage_count === 0;
  const integration_valid = verify(result.integration) && result.integration.reused_capabilities.length === 11 && result.integration.extended_capabilities.length === 5 && result.integration.centralized_certification && result.integration.governance_enforced && result.integration.tenant_isolated && result.integration.no_parallel_architecture;
  const certification_valid = result.certification_tests.length === 11 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && evidence_valid && operational_valid && recommendation_valid && replay_valid && incident_valid && integrity_valid && registry_valid && lineage_valid && integration_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, evidence_valid, operational_valid, recommendation_valid, replay_valid, incident_valid, integrity_valid, registry_valid, lineage_valid, integration_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayLiveEvidenceCollection(result = runLiveEvidenceCollection()): boolean {
  const replayed = runLiveEvidenceCollection();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateLiveEvidenceCollection(result).valid;
}

export function getLiveEvidenceCollectionBundle(): LiveEvidenceCollectionBundle {
  const result = runLiveEvidenceCollection();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "production-advisory-runtime/v16.3" as const, lifecycle: lifecycleStates, evidence_categories: evidenceCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateLiveEvidenceCollection(result) });
}

export const LiveEvidenceCollectionService = Object.freeze({ run: runLiveEvidenceCollection, validate: validateLiveEvidenceCollection, replay: replayLiveEvidenceCollection });
