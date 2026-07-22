import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import { runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { CertificationEngineBundle, CertificationEngineDecision, CertificationEngineFailure, CertificationEngineInput, CertificationEngineResult, CertificationEngineScenario, CertificationEngineValidation, CertificationState } from "@/types/certification-engine";

const VERSION = "certification-engine/w2.15" as const;
const IDENTIFIER = "CertificationEngine" as const;
const STATES = Object.freeze<CertificationState[]>(["Draft", "Pending Review", "Under Qualification", "Qualified", "Certified", "Conditionally Certified", "Suspended", "Revoked", "Expired", "Retired"]);
const UPSTREAM_REFS = Object.freeze(["agent-registry/w2.1", "capability-registry/w2.3", "skill-registry/w2.4", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "runtime-orchestrator/w2.10", "delegation-engine/w2.11", "collaboration-engine/w2.12", "evidence-engine/w2.13", "replay-engine/w2.14"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { agent: runAgentRegistry(), capability: runCapabilityRegistry(), skill: runSkillRegistry(), authority: runAuthorityValidator(), policy: runPolicyGate(), safety: runSafetyGate(), planning: runPlanningEngine(), memory: runMemoryEngine(), runtime: runRuntimeOrchestrator(), delegation: runDelegationEngine(), collaboration: runCollaborationEngine(), evidence: runEvidenceEngine(), replay: runReplayEngine() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly CertificationEngineFailure[], failure: CertificationEngineFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: CertificationEngineScenario): CertificationEngineFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly CertificationEngineFailure[], scenario: CertificationEngineScenario): CertificationEngineDecision {
  const conditional = new Set<CertificationEngineFailure>(["CERTIFICATION_SERVICE_MISSING", "CERTIFICATION_APPROVAL_MISSING", "AGENT_CERTIFICATION_MISSING", "CAPABILITY_CERTIFICATION_MISSING", "SKILL_CERTIFICATION_MISSING", "RUNTIME_CERTIFICATION_MISSING", "QUALIFICATION_ENGINE_MISSING", "QUALIFICATION_SCORE_MISSING", "CERTIFICATION_REGISTRY_MISSING", "CERTIFICATION_LIFECYCLE_MISSING", "RECERTIFICATION_MISSING", "CERTIFICATION_EVIDENCE_MISSING", "CERTIFICATION_GOVERNANCE_MISSING", "CERTIFICATION_API_MISSING", "CERTIFICATION_VIEW_MISSING", "QUALIFICATION_REPORT_MISSING", "CERTIFICATION_ENGINE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "CERTIFICATION_ENGINE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "CERTIFICATION_QUALIFIED";
}
function resultReplayHash(result: Omit<CertificationEngineResult, "replay_hash" | "integrity_hash">): string { return hash({ service: result.service.integrity_hash, agent: result.agent_certification.integrity_hash, capability: result.capability_certification.integrity_hash, skill: result.skill_certification.integrity_hash, runtime: result.runtime_certification.integrity_hash, qualification: result.qualification.integrity_hash, registry: result.registry.integrity_hash, lifecycle: result.lifecycle.integrity_hash, evidence: result.evidence_integration.integrity_hash, governance: result.governance.integrity_hash, apis: result.apis.integrity_hash, view: result.view.integrity_hash, reports: result.reports.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<CertificationEngineResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runCertificationEngine(input: CertificationEngineInput = {}): CertificationEngineResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<CertificationEngineFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["W2_1_AGENT_REGISTRY_INVALID", !validateAgentRegistry(baselines.agent).valid],
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
    ["W2_13_EVIDENCE_ENGINE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
    ["W2_14_REPLAY_ENGINE_INVALID", !validateReplayEngine(baselines.replay).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const serviceOk = !has(failures, "CERTIFICATION_SERVICE_MISSING") && !has(failures, "CERTIFICATION_WORKFLOW_NON_DETERMINISTIC") && !has(failures, "CERTIFICATE_NOT_SIGNED") && !has(failures, "CERTIFICATION_APPROVAL_MISSING");
  const agentOk = !has(failures, "AGENT_CERTIFICATION_MISSING") && !has(failures, "AGENT_IDENTITY_VALIDATION_FAILED") && !has(failures, "AGENT_EVIDENCE_INCOMPLETE");
  const capabilityOk = !has(failures, "CAPABILITY_CERTIFICATION_MISSING") && !has(failures, "CAPABILITY_DEPENDENCY_INVALID") && !has(failures, "CAPABILITY_REPLAY_INVALID");
  const skillOk = !has(failures, "SKILL_CERTIFICATION_MISSING") && !has(failures, "SKILL_CONTRACT_INVALID") && !has(failures, "SKILL_VERSION_INCOMPATIBLE") && !has(failures, "SKILL_DETERMINISM_FAILED");
  const runtimeOk = !has(failures, "RUNTIME_CERTIFICATION_MISSING") && !has(failures, "RUNTIME_CONFIGURATION_INVALID") && !has(failures, "RUNTIME_SECURITY_FAILED") && !has(failures, "RUNTIME_OBSERVABILITY_MISSING");
  const qualificationOk = !has(failures, "QUALIFICATION_ENGINE_MISSING") && !has(failures, "QUALIFICATION_DECISION_NON_DETERMINISTIC") && !has(failures, "QUALIFICATION_SCORE_MISSING") && !has(failures, "OPERATIONAL_READINESS_FAILED");
  const registryOk = !has(failures, "CERTIFICATION_REGISTRY_MISSING") && !has(failures, "CERTIFICATION_LINEAGE_MUTABLE") && !has(failures, "CERTIFICATION_VERSIONING_MISSING");
  const lifecycleOk = !has(failures, "CERTIFICATION_LIFECYCLE_MISSING") && !has(failures, "REVOCATION_NOT_ENFORCED") && !has(failures, "EXPIRATION_NOT_ENFORCED") && !has(failures, "RECERTIFICATION_MISSING");
  const evidenceOk = !has(failures, "CERTIFICATION_EVIDENCE_MISSING") && !has(failures, "EVIDENCE_PACKAGE_NOT_LINKED") && !has(failures, "REPLAY_REPORT_NOT_LINKED");
  const governanceOk = !has(failures, "CERTIFICATION_GOVERNANCE_MISSING") && !has(failures, "SEPARATION_OF_DUTIES_FAILED") && !has(failures, "AUDIT_RECORDING_MISSING");
  const apisOk = !has(failures, "CERTIFICATION_API_MISSING");
  const viewOk = !has(failures, "CERTIFICATION_VIEW_MISSING");
  const reportsOk = !has(failures, "QUALIFICATION_REPORT_MISSING");
  const replayOk = !has(failures, "CERTIFICATION_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "CERTIFICATION_QUALIFIED";
  const service = nested({ service_id: serviceOk ? `service:w2.15:certification:${input.seed ?? "canonical"}` : "", certification_requests: serviceOk, orchestration: serviceOk, evaluation_pipeline: serviceOk, evidence_verification: serviceOk, replay_verification: serviceOk, approval_workflow: serviceOk, issuance: serviceOk, renewal: serviceOk, suspension: serviceOk, revocation: serviceOk, signed_certificates: serviceOk, deterministic_workflows: serviceOk });
  const agent_certification = nested({ certificate_id: agentOk ? "certificate:w2.15:agent" : "", identity: agentOk, configuration: agentOk, capabilities: agentOk, authority: agentOk, policy_compliance: agentOk, safety_compliance: agentOk, runtime_behavior: agentOk, planning: agentOk, collaboration: agentOk, delegation: agentOk, replay_determinism: agentOk, evidence_completeness: agentOk });
  const capability_certification = nested({ certificate_id: capabilityOk ? "certificate:w2.15:capability" : "", dependency_validation: capabilityOk, authority_validation: capabilityOk, policy_validation: capabilityOk, safety_validation: capabilityOk, compatibility: capabilityOk, replay_verification: capabilityOk, evidence_validation: capabilityOk });
  const skill_certification = nested({ certificate_id: skillOk ? "certificate:w2.15:skill" : "", interface_contracts: skillOk, version_compatibility: skillOk, dependency_integrity: skillOk, deterministic_execution: skillOk, replay_verification: skillOk, evidence_package: skillOk });
  const runtime_certification = nested({ certificate_id: runtimeOk ? "certificate:w2.15:runtime" : "", runtime_configuration: runtimeOk, orchestration: runtimeOk, context_assembly: runtimeOk, restrictions: runtimeOk, checkpointing: runtimeOk, recovery: runtimeOk, replay_validation: runtimeOk, observability: runtimeOk, security: runtimeOk });
  const qualification = nested({ engine_id: qualificationOk ? "engine:w2.15:qualification" : "", constitutional_compliance: qualificationOk, authority_compliance: qualificationOk, policy_compliance: qualificationOk, safety_compliance: qualificationOk, deterministic_replay: qualificationOk, evidence_completeness: qualificationOk, runtime_stability: qualificationOk, dependency_integrity: qualificationOk, operational_readiness: qualificationOk, qualification_decision: decision, qualification_score: qualified ? 100 : 60, deterministic_decisions: qualificationOk });
  const registry = nested({ registry_id: registryOk ? "registry:w2.15:certification" : "", certificates: registryOk, qualification_history: registryOk, renewal_history: registryOk, revocations: registryOk, suspensions: registryOk, expiration: registryOk, lineage: registryOk, evidence_references: registryOk, immutable_history: registryOk, versioning: registryOk, audit: registryOk });
  const lifecycle = nested({ manager_id: lifecycleOk ? "manager:w2.15:certification-lifecycle" : "", states: lifecycleOk ? freezeArray(STATES) : freezeArray<CertificationState>([]), initial_certification: lifecycleOk, recertification: lifecycleOk, renewal: lifecycleOk, suspension: lifecycleOk, revocation: lifecycleOk, expiration: lifecycleOk, retirement: lifecycleOk, active_certificates: lifecycleOk, pending_reviews: lifecycleOk, failed_certifications: lifecycleOk, superseded_certificates: lifecycleOk });
  const evidence_integration = nested({ integration_id: evidenceOk ? "integration:w2.15:certification-evidence" : "", evidence_packages: evidenceOk, replay_reports: evidenceOk, decision_history: evidenceOk, runtime_history: evidenceOk, safety_reports: evidenceOk, policy_reports: evidenceOk, authority_reports: evidenceOk, certification_evidence_package: evidenceOk, immutable_links: evidenceOk });
  const governance = nested({ governance_id: governanceOk ? "governance:w2.15:certification" : "", constitutional_compliance: governanceOk, governance_enforcement: governanceOk, approval_workflow: governanceOk, operator_review: governanceOk, audit_recording: governanceOk, separation_of_duties: governanceOk, authority_controls: governanceOk, policy_controls: governanceOk, safety_controls: governanceOk });
  const apis = nested({ api_id: apisOk ? "api:w2.15:certification" : "", submit_certification: apisOk, retrieve_certificate: apisOk, retrieve_qualification: apisOk, renew_certificate: apisOk, suspend_certificate: apisOk, revoke_certificate: apisOk, list_certifications: apisOk, run_qualification: apisOk, qualification_status: apisOk, qualification_history: apisOk, qualification_evidence: apisOk, query_certificates: apisOk, search_certificates: apisOk, retrieve_lineage: apisOk, retrieve_evidence: apisOk, retrieve_replay_references: apisOk, stable: apisOk });
  const view = nested({ view_id: viewOk ? "view:w2.15:certification" : "", dashboard: viewOk, qualification_status: viewOk, certificate_lineage: viewOk, renewal_status: viewOk, revocation_history: viewOk, compliance_summaries: viewOk, secure_access: viewOk });
  const reports = nested({ report_id: reportsOk ? "report:w2.15:qualification" : "", qualification_decision: reportsOk, compliance_summary: reportsOk, replay_verification: reportsOk, evidence_completeness: reportsOk, authority_validation: reportsOk, policy_validation: reportsOk, safety_validation: reportsOk, operational_readiness: reportsOk, certification_recommendations: reportsOk, automatic_generation: reportsOk });
  const readiness = nested({ readiness_id: "W2.15-CERTIFICATION-ENGINE-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("W2_")), service_ready: serviceOk, agent_ready: agentOk, capability_ready: capabilityOk, skill_ready: skillOk, runtime_ready: runtimeOk, qualification_ready: qualificationOk, registry_ready: registryOk, lifecycle_ready: lifecycleOk, evidence_ready: evidenceOk, governance_ready: governanceOk, apis_ready: apisOk, view_ready: viewOk, reports_ready: reportsOk, replay_reproducible: replayOk, evidence_linked: evidenceOk, failures });
  const base: Omit<CertificationEngineResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), service, agent_certification, capability_certification, skill_certification, runtime_certification, qualification, registry, lifecycle, evidence_integration, governance, apis, view, reports, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateCertificationEngine(result?: CertificationEngineResult): CertificationEngineValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, service_valid: false, agent_valid: false, capability_valid: false, skill_valid: false, runtime_valid: false, qualification_valid: false, registry_valid: false, lifecycle_valid: false, evidence_valid: false, governance_valid: false, apis_valid: false, view_valid: false, reports_valid: false, readiness_valid: false, failures: freezeArray(["CERTIFICATION_SERVICE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const service_valid = verifyHashed(result.service) && result.service.signed_certificates && result.service.deterministic_workflows;
  const agent_valid = verifyHashed(result.agent_certification) && result.agent_certification.identity && result.agent_certification.replay_determinism && result.agent_certification.evidence_completeness;
  const capability_valid = verifyHashed(result.capability_certification) && result.capability_certification.dependency_validation && result.capability_certification.replay_verification;
  const skill_valid = verifyHashed(result.skill_certification) && result.skill_certification.interface_contracts && result.skill_certification.deterministic_execution;
  const runtime_valid = verifyHashed(result.runtime_certification) && result.runtime_certification.orchestration && result.runtime_certification.security && result.runtime_certification.observability;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.qualification_decision === "CERTIFICATION_QUALIFIED" && result.qualification.qualification_score === 100 && result.qualification.deterministic_decisions;
  const registry_valid = verifyHashed(result.registry) && result.registry.immutable_history && result.registry.versioning && result.registry.audit;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === 10 && result.lifecycle.recertification && result.lifecycle.revocation && result.lifecycle.expiration;
  const evidence_valid = verifyHashed(result.evidence_integration) && result.evidence_integration.evidence_packages && result.evidence_integration.replay_reports && result.evidence_integration.immutable_links;
  const governance_valid = verifyHashed(result.governance) && result.governance.separation_of_duties && result.governance.audit_recording && result.governance.safety_controls;
  const apis_valid = verifyHashed(result.apis) && result.apis.submit_certification && result.apis.run_qualification && result.apis.retrieve_replay_references && result.apis.stable;
  const view_valid = verifyHashed(result.view) && result.view.dashboard && result.view.certificate_lineage && result.view.secure_access;
  const reports_valid = verifyHashed(result.reports) && result.reports.automatic_generation && result.reports.replay_verification && result.reports.operational_readiness;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.evidence_linked && result.readiness.replay_reproducible && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && service_valid && agent_valid && capability_valid && skill_valid && runtime_valid && qualification_valid && registry_valid && lifecycle_valid && evidence_valid && governance_valid && apis_valid && view_valid && reports_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, service_valid, agent_valid, capability_valid, skill_valid, runtime_valid, qualification_valid, registry_valid, lifecycle_valid, evidence_valid, governance_valid, apis_valid, view_valid, reports_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayCertificationEngine(result = runCertificationEngine()): boolean { const replayed = runCertificationEngine(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateCertificationEngine(result).valid; }
export function getCertificationEngineBundle(): CertificationEngineBundle { const result = runCertificationEngine(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_agent_certification: true, owns_capability_certification: true, owns_skill_certification: true, owns_runtime_certification: true, owns_qualification_framework: true, owns_certification_governance: true, owns_certification_evidence: true, owns_certification_lineage: true, owns_certification_lifecycle: true, qualification_gate: "Certification Engine Qualification Gate" }), result, validation: validateCertificationEngine(result) }); }
export const CertificationEngineService = Object.freeze({ run: runCertificationEngine, validate: validateCertificationEngine, replay: replayCertificationEngine });
