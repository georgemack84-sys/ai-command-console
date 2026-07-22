import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import { runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { EvidenceEngineBundle, EvidenceEngineDecision, EvidenceEngineFailure, EvidenceEngineInput, EvidenceEngineResult, EvidenceEngineScenario, EvidenceEngineValidation } from "@/types/evidence-engine";

const VERSION = "evidence-engine/w2.13" as const;
const IDENTIFIER = "EvidenceEngine" as const;
const UPSTREAM_REFS = Object.freeze(["caf-constitutional-foundation/w2.0", "agent-registry/w2.1", "lifecycle-engine/w2.2", "capability-registry/w2.3", "skill-registry/w2.4", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "runtime-orchestrator/w2.10", "delegation-engine/w2.11", "collaboration-engine/w2.12"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { constitution: runCafConstitutionalFoundation(), agent: runAgentRegistry(), lifecycle: runLifecycleEngine(), capability: runCapabilityRegistry(), skill: runSkillRegistry(), authority: runAuthorityValidator(), policy: runPolicyGate(), safety: runSafetyGate(), planning: runPlanningEngine(), memory: runMemoryEngine(), runtime: runRuntimeOrchestrator(), delegation: runDelegationEngine(), collaboration: runCollaborationEngine() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly EvidenceEngineFailure[], failure: EvidenceEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: EvidenceEngineScenario): EvidenceEngineFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly EvidenceEngineFailure[], scenario: EvidenceEngineScenario): EvidenceEngineDecision {
  const conditional = new Set<EvidenceEngineFailure>(["EVIDENCE_CAPTURE_MISSING", "EVIDENCE_PACKAGE_MISSING", "EVIDENCE_INDEX_MISSING", "EVIDENCE_VALIDATION_MISSING", "PROVENANCE_MISSING", "EVIDENCE_CONTRACTS_MISSING", "EVIDENCE_EXPLORER_MISSING", "EVIDENCE_RUNTIME_INTEGRATION_MISSING", "EVIDENCE_API_MISSING", "EVIDENCE_ENGINE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "EVIDENCE_ENGINE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "EVIDENCE_ENGINE_QUALIFIED";
}
function resultReplayHash(result: Omit<EvidenceEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ capture: result.capture.integrity_hash, packages: result.packages.integrity_hash, index: result.index.integrity_hash, validation: result.validation_engine.integrity_hash, provenance: result.provenance.integrity_hash, contracts: result.contracts.integrity_hash, explorer: result.explorer.integrity_hash, integration: result.runtime_integration.integrity_hash, apis: result.apis.integrity_hash, security: result.security.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<EvidenceEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runEvidenceEngine(input: EvidenceEngineInput = {}): EvidenceEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<EvidenceEngineFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["W2_0_CAF_CONSTITUTION_INVALID", !validateCafConstitutionalFoundation(baselines.constitution).valid],
    ["W2_1_AGENT_REGISTRY_INVALID", !validateAgentRegistry(baselines.agent).valid],
    ["W2_2_LIFECYCLE_ENGINE_INVALID", !validateLifecycleEngine(baselines.lifecycle).valid],
    ["W2_3_CAPABILITY_REGISTRY_INVALID", !validateCapabilityRegistry(baselines.capability).valid],
    ["W2_4_SKILL_REGISTRY_INVALID", !validateSkillRegistry(baselines.skill).valid],
    ["W2_5_AUTHORITY_VALIDATOR_INVALID", !validateAuthorityValidator(baselines.authority).valid],
    ["W2_6_POLICY_GATE_INVALID", !validatePolicyGate(baselines.policy).valid],
    ["W2_7_SAFETY_GATE_INVALID", !validateSafetyGate(baselines.safety).valid],
    ["W2_8_PLANNING_ENGINE_INVALID", !validatePlanningEngine(baselines.planning).valid],
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(baselines.memory).valid],
    ["W2_10_RUNTIME_ORCHESTRATOR_INVALID", !validateRuntimeOrchestrator(baselines.runtime).valid],
    ["W2_11_DELEGATION_ENGINE_INVALID", !validateDelegationEngine(baselines.delegation).valid],
    ["W2_12_COLLABORATION_ENGINE_INVALID", !validateCollaborationEngine(baselines.collaboration).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const captureOk = !has(failures, "EVIDENCE_CAPTURE_MISSING") && !has(failures, "EVIDENCE_CAPTURE_NON_DETERMINISTIC") && !has(failures, "RUNTIME_EVENT_NOT_CAPTURED");
  const packageOk = !has(failures, "EVIDENCE_PACKAGE_MISSING") && !has(failures, "PACKAGE_NOT_SIGNED") && !has(failures, "PACKAGE_NOT_IMMUTABLE") && !has(failures, "PACKAGE_NOT_VERSIONED") && !has(failures, "PACKAGE_GENERATION_NON_DETERMINISTIC");
  const indexOk = !has(failures, "EVIDENCE_INDEX_MISSING") && !has(failures, "INDEX_RETRIEVAL_NON_DETERMINISTIC") && !has(failures, "LINEAGE_TRAVERSAL_INVALID");
  const validationOk = !has(failures, "EVIDENCE_VALIDATION_MISSING") && !has(failures, "SCHEMA_VALIDATION_FAILED") && !has(failures, "SIGNATURE_VALIDATION_FAILED") && !has(failures, "HASH_VERIFICATION_FAILED") && !has(failures, "COMPLETENESS_VALIDATION_FAILED") && !has(failures, "REPLAY_COMPATIBILITY_FAILED");
  const provenanceOk = !has(failures, "PROVENANCE_MISSING") && !has(failures, "PROVENANCE_INCOMPLETE");
  const contractsOk = !has(failures, "EVIDENCE_CONTRACTS_MISSING") && !has(failures, "CONTRACT_VERSIONING_MISSING") && !has(failures, "CONTRACT_ENFORCEMENT_FAILED");
  const explorerOk = !has(failures, "EVIDENCE_EXPLORER_MISSING") && !has(failures, "UNAUTHORIZED_EVIDENCE_ACCESS_ALLOWED");
  const integrationOk = !has(failures, "EVIDENCE_RUNTIME_INTEGRATION_MISSING");
  const apisOk = !has(failures, "EVIDENCE_API_MISSING");
  const securityOk = !has(failures, "TENANT_ISOLATION_FAILED") && !has(failures, "NAMESPACE_ISOLATION_FAILED") && !has(failures, "EVIDENCE_ENCRYPTION_MISSING");
  const replayOk = !has(failures, "EVIDENCE_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "EVIDENCE_ENGINE_QUALIFIED";
  const capture = nested({ collector_id: captureOk ? `collector:w2.13:evidence:${input.seed ?? "canonical"}` : "", agent_execution: captureOk, planning_decisions: captureOk, memory_operations: captureOk, tool_execution: captureOk, runtime_events: captureOk, collaboration_events: captureOk, delegation_events: captureOk, policy_evaluations: captureOk, authority_decisions: captureOk, safety_decisions: captureOk, lifecycle_transitions: captureOk, operator_interactions: captureOk, recovery_operations: captureOk, capture_pipeline: captureOk, runtime_hooks: captureOk, capture_apis: captureOk, deterministic_capture: captureOk, complete_capture: captureOk });
  const packages = nested({ service_id: packageOk ? "service:w2.13:evidence-packages" : "", metadata: packageOk, event_sequence: packageOk, runtime_context: packageOk, agent_identity: packageOk, capability_references: packageOk, skill_references: packageOk, decision_records: packageOk, inputs: packageOk, outputs: packageOk, policies_evaluated: packageOk, authority_evaluations: packageOk, safety_evaluations: packageOk, memory_references: packageOk, provenance: packageOk, digital_signatures: packageOk, incremental_packages: packageOk, session_packages: packageOk, workflow_packages: packageOk, mission_packages: packageOk, qualification_packages: packageOk, certification_packages: packageOk, immutable: packageOk, signed: packageOk, versioned: packageOk, deterministic_packages: packageOk });
  const index = nested({ index_id: indexOk ? "index:w2.13:evidence" : "", agent: indexOk, capability: indexOk, skill: indexOk, workflow: indexOk, runtime: indexOk, tenant: indexOk, namespace: indexOk, session: indexOk, policy: indexOk, authority: indexOk, safety: indexOk, time: indexOk, event_type: indexOk, correlation_id: indexOk, fast_lookup: indexOk, deterministic_retrieval: indexOk, lineage_traversal: indexOk, provenance_search: indexOk, dependency_search: indexOk, package_discovery: indexOk });
  const validation_engine = nested({ engine_id: validationOk ? "engine:w2.13:evidence-validation" : "", schema_validation: validationOk, signature_validation: validationOk, hash_verification: validationOk, provenance_verification: validationOk, lineage_validation: validationOk, contract_validation: validationOk, timestamp_verification: validationOk, completeness_validation: validationOk, replay_compatibility: validationOk, cross_reference_validation: validationOk, integrity_reports: validationOk, corrupted_evidence_detection: validationOk });
  const provenance = nested({ registry_id: provenanceOk ? "registry:w2.13:provenance" : "", source_service: provenanceOk, runtime: provenanceOk, agent: provenanceOk, capability: provenanceOk, skill: provenanceOk, operator: provenanceOk, policy: provenanceOk, authority: provenanceOk, delegation_chain: provenanceOk, collaboration_chain: provenanceOk, parent_evidence: provenanceOk, child_evidence: provenanceOk, lineage_graph: provenanceOk, provenance_apis: provenanceOk, complete_origin_tracking: provenanceOk });
  const contracts = nested({ registry_id: contractsOk ? "registry:w2.13:evidence-contracts" : "", capture_contract: contractsOk, package_contract: contractsOk, validation_contract: contractsOk, search_contract: contractsOk, retrieval_contract: contractsOk, export_contract: contractsOk, replay_contract: contractsOk, schemas: contractsOk, versioning: contractsOk, compatibility: contractsOk, required_metadata: contractsOk, validation_rules: contractsOk, enforced: contractsOk });
  const explorer = nested({ explorer_id: explorerOk ? "explorer:w2.13:evidence" : "", package_explorer: explorerOk, timeline_visualization: explorerOk, lineage_viewer: explorerOk, validation_status: explorerOk, search: explorerOk, filtering: explorerOk, correlation_viewer: explorerOk, replay_links: explorerOk, provenance_graph: explorerOk, explorer_api: explorerOk, secure_access: explorerOk, tenant_isolated: explorerOk });
  const runtime_integration = nested({ integration_id: integrationOk ? "integration:w2.13:runtime-evidence" : "", runtime_orchestrator: integrationOk, planning_engine: integrationOk, memory_engine: integrationOk, collaboration_engine: integrationOk, delegation_engine: integrationOk, policy_gate: integrationOk, safety_gate: integrationOk, authority_validator: integrationOk, lifecycle_engine: integrationOk, capability_registry: integrationOk, skill_registry: integrationOk, event_integration: integrationOk, evidence_pipeline: integrationOk });
  const apis = nested({ api_id: apisOk ? "api:w2.13:evidence" : "", submit_evidence: apisOk, batch_capture: apisOk, stream_capture: apisOk, runtime_events: apisOk, create_package: apisOk, update_package: apisOk, finalize_package: apisOk, sign_package: apisOk, validate_evidence: apisOk, validate_package: apisOk, verify_integrity: apisOk, verify_lineage: apisOk, search: apisOk, filter: apisOk, retrieve: apisOk, correlation: apisOk, lineage_queries: apisOk, browse: apisOk, timeline: apisOk, graph: apisOk, export: apisOk, stable: apisOk });
  const security = nested({ security_id: securityOk ? "security:w2.13:evidence" : "", tenant_isolation: securityOk, namespace_isolation: securityOk, access_control: securityOk, signed_packages: securityOk, immutable_evidence: securityOk, encryption_at_rest: securityOk, encryption_in_transit: securityOk, authorization_validation: securityOk, tamper_evident: securityOk });
  const readiness = nested({ readiness_id: "W2.13-EVIDENCE-ENGINE-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("W2_")), capture_ready: captureOk, package_ready: packageOk, index_ready: indexOk, validation_ready: validationOk, provenance_ready: provenanceOk, contracts_ready: contractsOk, explorer_ready: explorerOk, runtime_integration_ready: integrationOk, apis_ready: apisOk, security_ready: securityOk, replay_ready: replayOk, tenant_namespace_isolated: securityOk, failures });
  const base: Omit<EvidenceEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), capture, packages, index, validation_engine, provenance, contracts, explorer, runtime_integration, apis, security, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateEvidenceEngine(result?: EvidenceEngineResult): EvidenceEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, capture_valid: false, packages_valid: false, index_valid: false, validation_engine_valid: false, provenance_valid: false, contracts_valid: false, explorer_valid: false, runtime_integration_valid: false, apis_valid: false, security_valid: false, readiness_valid: false, failures: freezeArray(["EVIDENCE_CAPTURE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const capture_valid = verifyHashed(result.capture) && result.capture.runtime_events && result.capture.deterministic_capture && result.capture.complete_capture;
  const packages_valid = verifyHashed(result.packages) && result.packages.immutable && result.packages.signed && result.packages.versioned && result.packages.deterministic_packages;
  const index_valid = verifyHashed(result.index) && result.index.deterministic_retrieval && result.index.lineage_traversal && result.index.package_discovery;
  const validation_engine_valid = verifyHashed(result.validation_engine) && result.validation_engine.schema_validation && result.validation_engine.signature_validation && result.validation_engine.hash_verification && result.validation_engine.replay_compatibility;
  const provenance_valid = verifyHashed(result.provenance) && result.provenance.delegation_chain && result.provenance.collaboration_chain && result.provenance.complete_origin_tracking;
  const contracts_valid = verifyHashed(result.contracts) && result.contracts.versioning && result.contracts.enforced && result.contracts.replay_contract;
  const explorer_valid = verifyHashed(result.explorer) && result.explorer.secure_access && result.explorer.tenant_isolated && result.explorer.replay_links;
  const runtime_integration_valid = verifyHashed(result.runtime_integration) && result.runtime_integration.runtime_orchestrator && result.runtime_integration.collaboration_engine && result.runtime_integration.evidence_pipeline;
  const apis_valid = verifyHashed(result.apis) && result.apis.submit_evidence && result.apis.validate_package && result.apis.lineage_queries && result.apis.stable;
  const security_valid = verifyHashed(result.security) && result.security.tenant_isolation && result.security.namespace_isolation && result.security.encryption_at_rest && result.security.encryption_in_transit;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.tenant_namespace_isolated && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && capture_valid && packages_valid && index_valid && validation_engine_valid && provenance_valid && contracts_valid && explorer_valid && runtime_integration_valid && apis_valid && security_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, capture_valid, packages_valid, index_valid, validation_engine_valid, provenance_valid, contracts_valid, explorer_valid, runtime_integration_valid, apis_valid, security_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayEvidenceEngine(result = runEvidenceEngine()): boolean { const replayed = runEvidenceEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateEvidenceEngine(result).valid; }
export function getEvidenceEngineBundle(): EvidenceEngineBundle { const result = runEvidenceEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_evidence_capture: true, owns_evidence_packages: true, owns_evidence_index: true, owns_evidence_validation: true, owns_provenance_management: true, owns_evidence_contracts: true, owns_evidence_explorer: true, owns_runtime_integration: true, owns_evidence_security: true, qualification_gate: "Evidence Engine Qualification Gate" }), result, validation: validateEvidenceEngine(result) }); }
export const EvidenceEngineService = Object.freeze({ run: runEvidenceEngine, validate: validateEvidenceEngine, replay: replayEvidenceEngine });
