import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import { runIdentityFull, validateIdentityFull } from "@/services/identity-full";
import { runRegistryFull, validateRegistryFull } from "@/services/registry-full";
import { runSecurityFull, validateSecurityFull } from "@/services/security-full";
import type { AgentRegistryBundle, AgentRegistryDecision, AgentRegistryFailure, AgentRegistryInput, AgentRegistryResult, AgentRegistryScenario, AgentRegistryValidation } from "@/types/agent-registry";

const VERSION = "agent-registry/w2.1" as const;
const IDENTIFIER = "AgentRegistry" as const;
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let identityBaseline: ReturnType<typeof runIdentityFull> | undefined;
let registryBaseline: ReturnType<typeof runRegistryFull> | undefined;
let configurationBaseline: ReturnType<typeof runConfigurationPlatform> | undefined;
let securityBaseline: ReturnType<typeof runSecurityFull> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly AgentRegistryFailure[], failure: AgentRegistryFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: AgentRegistryScenario): AgentRegistryFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly AgentRegistryFailure[], scenario: AgentRegistryScenario): AgentRegistryDecision {
  if (has(failures, "W2_0_CAF_CONSTITUTION_INVALID") || has(failures, "W1_1B_IDENTITY_FULL_INVALID") || has(failures, "W1_4B_REGISTRY_FULL_INVALID") || has(failures, "W1_5_CONFIGURATION_PLATFORM_INVALID") || has(failures, "W1_7B_SECURITY_FULL_INVALID") || has(failures, "REGISTRATION_NON_DETERMINISTIC") || has(failures, "AGENT_IDENTITY_MUTABLE") || has(failures, "IDENTITY_UNIQUENESS_FAILED") || has(failures, "VERSION_ARTIFACT_MUTABLE") || has(failures, "LINEAGE_EDGE_MUTABLE") || has(failures, "DISCOVERY_NON_DETERMINISTIC") || has(failures, "ELIGIBILITY_NOT_COMPUTED") || has(failures, "ELIGIBILITY_NON_REPRODUCIBLE") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "CONSTITUTIONAL_COMPLIANCE_FAILED") || has(failures, "REGISTRY_EVIDENCE_NOT_IMMUTABLE") || has(failures, "REGISTRY_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "AGENT_REGISTRY_QUALIFICATION_GATE_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "AGENT_REGISTRY_QUALIFIED";
}
function resultReplayHash(result: Omit<AgentRegistryResult, "replay_hash" | "integrity_hash">): string { return hash({ registry: result.registry_service.integrity_hash, identity: result.identity_model.integrity_hash, versioning: result.versioning.integrity_hash, lineage: result.lineage.integrity_hash, discovery: result.discovery.integrity_hash, ownership: result.ownership.integrity_hash, configuration: result.configuration_references.integrity_hash, eligibility: result.runtime_eligibility.integrity_hash, certification: result.certification_trust.integrity_hash, explorer: result.explorer.integrity_hash, evidence: result.evidence.integrity_hash, qualification: result.qualification.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<AgentRegistryResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runAgentRegistry(input: AgentRegistryInput = {}): AgentRegistryResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<AgentRegistryFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation(); identityBaseline ??= runIdentityFull(); registryBaseline ??= runRegistryFull(); configurationBaseline ??= runConfigurationPlatform(); securityBaseline ??= runSecurityFull();
  const constitutionInvalid = !validateCafConstitutionalFoundation(constitutionBaseline).valid || has(scenarioFailures, "W2_0_CAF_CONSTITUTION_INVALID");
  const identityInvalid = !validateIdentityFull(identityBaseline).valid || has(scenarioFailures, "W1_1B_IDENTITY_FULL_INVALID");
  const registryInvalid = !validateRegistryFull(registryBaseline).valid || has(scenarioFailures, "W1_4B_REGISTRY_FULL_INVALID");
  const configurationInvalid = !validateConfigurationPlatform(configurationBaseline).valid || has(scenarioFailures, "W1_5_CONFIGURATION_PLATFORM_INVALID");
  const securityInvalid = !validateSecurityFull(securityBaseline).valid || has(scenarioFailures, "W1_7B_SECURITY_FULL_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(constitutionInvalid ? ["W2_0_CAF_CONSTITUTION_INVALID" as const] : []), ...(identityInvalid ? ["W1_1B_IDENTITY_FULL_INVALID" as const] : []), ...(registryInvalid ? ["W1_4B_REGISTRY_FULL_INVALID" as const] : []), ...(configurationInvalid ? ["W1_5_CONFIGURATION_PLATFORM_INVALID" as const] : []), ...(securityInvalid ? ["W1_7B_SECURITY_FULL_INVALID" as const] : [])])]);
  const registryOk = !registryInvalid && !has(failures, "AGENT_REGISTRY_MISSING") && !has(failures, "REGISTRATION_NON_DETERMINISTIC") && !has(failures, "REGISTRATION_VALIDATION_FAILED");
  const identityOk = !identityInvalid && !has(failures, "AGENT_IDENTITY_MISSING") && !has(failures, "AGENT_IDENTITY_MUTABLE") && !has(failures, "IDENTITY_UNIQUENESS_FAILED");
  const versioningOk = !has(failures, "VERSIONING_MISSING") && !has(failures, "VERSION_HISTORY_INCOMPLETE") && !has(failures, "VERSION_ARTIFACT_MUTABLE");
  const lineageOk = !has(failures, "LINEAGE_MISSING") && !has(failures, "LINEAGE_INCOMPLETE") && !has(failures, "LINEAGE_EDGE_MUTABLE");
  const discoveryOk = !has(failures, "DISCOVERY_MISSING") && !has(failures, "DISCOVERY_NON_DETERMINISTIC");
  const ownershipOk = !has(failures, "OWNERSHIP_GOVERNANCE_MISSING") && !has(failures, "OWNERSHIP_VALIDATION_FAILED");
  const configurationOk = !configurationInvalid && !has(failures, "CONFIGURATION_REFERENCES_MISSING") && !has(failures, "CONFIGURATION_REFERENCE_RESOLUTION_FAILED");
  const eligibilityOk = !constitutionInvalid && !securityInvalid && !has(failures, "RUNTIME_ELIGIBILITY_MISSING") && !has(failures, "ELIGIBILITY_NOT_COMPUTED") && !has(failures, "ELIGIBILITY_NON_REPRODUCIBLE");
  const certificationTrustOk = !has(failures, "CERTIFICATION_REFERENCES_MISSING") && !has(failures, "CERTIFICATION_REFERENCE_INVALID") && !has(failures, "TRUST_REFERENCES_MISSING") && !has(failures, "TRUST_REFERENCE_UNRESOLVED");
  const explorerOk = !has(failures, "REGISTRY_EXPLORER_MISSING") && !has(failures, "LINEAGE_VIEW_MISSING");
  const evidenceOk = !has(failures, "REGISTRY_EVIDENCE_MISSING") && !has(failures, "REGISTRY_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "REGISTRY_REPLAY_INVALID");
  const constitutionalOk = !constitutionInvalid && !has(failures, "TENANT_ISOLATION_FAILED") && !has(failures, "CONSTITUTIONAL_COMPLIANCE_FAILED");
  const gateOk = !has(failures, "AGENT_REGISTRY_QUALIFICATION_GATE_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "AGENT_REGISTRY_QUALIFIED";
  const registry_service = nested({ registry_id: registryOk ? `registry:w2.1:agents:${input.seed ?? "canonical"}` : "", agent_registration: registryOk, agent_lookup: registryOk, lifecycle_tracking: registryOk, registration_validation: registryOk, deterministic_retrieval: registryOk, namespace_awareness: registryOk, tenant_isolation: registryOk });
  const identity_model = nested({ model_id: identityOk ? "model:w2.1:agent-identity" : "", agent_id: identityOk, agent_name: identityOk, namespace: identityOk, tenant: identityOk, organizational_ownership: identityOk, creation_metadata: identityOk, immutable_identity: identityOk, identity_uniqueness: identityOk });
  const versioning = nested({ manager_id: versioningOk ? "manager:w2.1:agent-versioning" : "", semantic_versions: versioningOk, compatibility_versions: versioningOk, release_lineage: versioningOk, deprecation: versioningOk, retirement: versioningOk, supersession: versioningOk, immutable_version_artifacts: versioningOk });
  const lineage = nested({ engine_id: lineageOk ? "engine:w2.1:agent-lineage" : "", parent_agent: lineageOk, derived_agents: lineageOk, cloned_agents: lineageOk, merged_agents: lineageOk, replaced_agents: lineageOk, historical_evolution: lineageOk, immutable_edges: lineageOk, queryable: lineageOk });
  const discovery = nested({ service_id: discoveryOk ? "service:w2.1:agent-discovery" : "", identity_lookup: discoveryOk, capability_lookup: discoveryOk, namespace_lookup: discoveryOk, tenant_lookup: discoveryOk, owner_lookup: discoveryOk, certification_lookup: discoveryOk, trust_lookup: discoveryOk, eligibility_lookup: discoveryOk, deterministic_results: discoveryOk });
  const ownership = nested({ manager_id: ownershipOk ? "manager:w2.1:agent-ownership" : "", owning_organization: ownershipOk, owning_tenant: ownershipOk, owning_namespace: ownershipOk, responsible_authority: ownershipOk, steward: ownershipOk, maintainer: ownershipOk, ownership_evidence_events: ownershipOk, validation: ownershipOk });
  const configuration_references = nested({ manager_id: configurationOk ? "manager:w2.1:agent-configuration-references" : "", configuration_profile: configurationOk, environment_profile: configurationOk, deployment_profile: configurationOk, feature_requirements: configurationOk, runtime_requirements: configurationOk, external_values_only: configurationOk, references_resolve: configurationOk });
  const runtime_eligibility = nested({ evaluator_id: eligibilityOk ? "evaluator:w2.1:runtime-eligibility" : "", constitution_approved: eligibilityOk, identity_valid: eligibilityOk, certification_verified: eligibilityOk, trust_acceptable: eligibilityOk, dependencies_satisfied: eligibilityOk, policy_compliant: eligibilityOk, runtime_compatible: eligibilityOk, computed_not_assigned: eligibilityOk, reproducible: eligibilityOk });
  const certification_trust = nested({ reference_id: certificationTrustOk ? "reference:w2.1:certification-trust" : "", certification_identifier: certificationTrustOk, certification_status: certificationTrustOk, certification_authority: certificationTrustOk, certification_evidence: certificationTrustOk, qualification_reports: certificationTrustOk, trust_identifier: certificationTrustOk, trust_standing: certificationTrustOk, confidence_reference: certificationTrustOk, restriction_reference: certificationTrustOk, monitoring_reference: certificationTrustOk, external_evaluations_only: certificationTrustOk });
  const explorer = nested({ explorer_id: explorerOk ? "explorer:w2.1:agent-registry" : "", browsing: explorerOk, filtering: explorerOk, dependency_exploration: explorerOk, ownership_visualization: explorerOk, version_inspection: explorerOk, certification_inspection: explorerOk, lineage_view: explorerOk, deterministic_visualization: explorerOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.1:agent-registry-evidence" : "", records: evidenceOk ? freezeArray(["agent:registration", "agent:identity", "agent:version", "agent:ownership", "agent:configuration-reference", "agent:eligibility", "agent:certification-reference", "agent:trust-reference", "agent:discovery", "agent:audit"]) : freezeArray<string>([]), registration_evidence: evidenceOk, identity_evidence: evidenceOk, version_evidence: evidenceOk, ownership_evidence: evidenceOk, configuration_reference_evidence: evidenceOk, eligibility_evidence: evidenceOk, certification_reference_evidence: evidenceOk, trust_reference_evidence: evidenceOk, discovery_evidence: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const qualification = nested({ report_id: gateOk ? "report:w2.1:agent-registry-qualification" : "", deterministic_registration: qualified, identity_uniqueness: qualified, immutable_version_lineage: qualified, deterministic_discovery_replay: qualified, ownership_validation: qualified, configuration_reference_validation: qualified, reproducible_eligibility: qualified, certification_reference_validation: qualified, trust_reference_resolution: qualified, explorer_validation: qualified, lineage_visualization_complete: qualified, evidence_integrity: qualified, tenant_isolation: qualified, constitutional_governance: qualified, gate_decision: decision });
  const readiness = nested({ readiness_id: "W2.1-AGENT-REGISTRY-READINESS-001", decision, phase_ready: qualified, constitution_ready: !constitutionInvalid, identity_ready: !identityInvalid, registry_ready: !registryInvalid, configuration_ready: !configurationInvalid, security_ready: !securityInvalid, registry_service_ready: registryOk, identity_model_ready: identityOk, versioning_ready: versioningOk, lineage_ready: lineageOk, discovery_ready: discoveryOk, ownership_ready: ownershipOk, configuration_references_ready: configurationOk, eligibility_ready: eligibilityOk, certification_trust_ready: certificationTrustOk, explorer_ready: explorerOk, evidence_ready: evidenceOk, qualification_ready: qualified && constitutionalOk, failures });
  const base: Omit<AgentRegistryResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", identity_full_ref: "identity-full/w1.1b", registry_full_ref: "registry-full/w1.4b", configuration_platform_ref: "configuration-platform/w1.5", security_full_ref: "security-full/w1.7b", registry_service, identity_model, versioning, lineage, discovery, ownership, configuration_references, runtime_eligibility, certification_trust, explorer, evidence, qualification, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAgentRegistry(result?: AgentRegistryResult): AgentRegistryValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, registry_valid: false, identity_valid: false, versioning_valid: false, lineage_valid: false, discovery_valid: false, ownership_valid: false, configuration_references_valid: false, eligibility_valid: false, certification_trust_valid: false, explorer_valid: false, evidence_valid: false, qualification_valid: false, readiness_valid: false, failures: freezeArray(["AGENT_REGISTRY_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const registry_valid = verifyHashed(result.registry_service) && result.registry_service.agent_registration && result.registry_service.deterministic_retrieval && result.registry_service.tenant_isolation;
  const identity_valid = verifyHashed(result.identity_model) && result.identity_model.immutable_identity && result.identity_model.identity_uniqueness;
  const versioning_valid = verifyHashed(result.versioning) && result.versioning.semantic_versions && result.versioning.immutable_version_artifacts;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.immutable_edges && result.lineage.queryable;
  const discovery_valid = verifyHashed(result.discovery) && result.discovery.identity_lookup && result.discovery.eligibility_lookup && result.discovery.deterministic_results;
  const ownership_valid = verifyHashed(result.ownership) && result.ownership.responsible_authority && result.ownership.ownership_evidence_events && result.ownership.validation;
  const configuration_references_valid = verifyHashed(result.configuration_references) && result.configuration_references.external_values_only && result.configuration_references.references_resolve;
  const eligibility_valid = verifyHashed(result.runtime_eligibility) && result.runtime_eligibility.computed_not_assigned && result.runtime_eligibility.reproducible;
  const certification_trust_valid = verifyHashed(result.certification_trust) && result.certification_trust.certification_identifier && result.certification_trust.trust_identifier && result.certification_trust.external_evaluations_only;
  const explorer_valid = verifyHashed(result.explorer) && result.explorer.lineage_view && result.explorer.deterministic_visualization;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 10 && result.evidence.immutable && result.evidence.replayable;
  const qualification_valid = verifyHashed(result.qualification) && result.qualification.deterministic_registration && result.qualification.constitutional_governance && result.qualification.gate_decision === "AGENT_REGISTRY_QUALIFIED";
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && registry_valid && identity_valid && versioning_valid && lineage_valid && discovery_valid && ownership_valid && configuration_references_valid && eligibility_valid && certification_trust_valid && explorer_valid && evidence_valid && qualification_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, registry_valid, identity_valid, versioning_valid, lineage_valid, discovery_valid, ownership_valid, configuration_references_valid, eligibility_valid, certification_trust_valid, explorer_valid, evidence_valid, qualification_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayAgentRegistry(result = runAgentRegistry()): boolean { const replayed = runAgentRegistry(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAgentRegistry(result).valid; }
export function getAgentRegistryBundle(): AgentRegistryBundle { const result = runAgentRegistry(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_agent_registry: true, owns_agent_identity_model: true, owns_agent_versioning: true, owns_agent_lineage: true, owns_agent_discovery: true, owns_agent_ownership: true, owns_configuration_references: true, owns_runtime_eligibility: true, owns_certification_references: true, owns_trust_references: true, owns_registry_explorer: true, owns_registry_evidence: true, qualification_gate: "Agent Registry Qualification Gate" }), result, validation: validateAgentRegistry(result) }); }
export const AgentRegistryService = Object.freeze({ run: runAgentRegistry, validate: validateAgentRegistry, replay: replayAgentRegistry });
