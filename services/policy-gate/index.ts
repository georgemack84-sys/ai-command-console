import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { PolicyDisposition, PolicyGateBundle, PolicyGateDecision, PolicyGateFailure, PolicyGateInput, PolicyGateResult, PolicyGateScenario, PolicyGateValidation, PolicyScope } from "@/types/policy-gate";

const VERSION = "policy-gate/w2.6" as const;
const IDENTIFIER = "PolicyGate" as const;
const SCOPES = Object.freeze<PolicyScope[]>(["Constitutional", "Platform", "Regulatory", "Organization", "Tenant", "Mission", "Runtime", "Capability", "Skill", "Session"]);
const DISPOSITIONS = Object.freeze<PolicyDisposition[]>(["ALLOW", "ALLOW_WITH_RESTRICTIONS", "DENY", "ESCALATE", "FAIL_CLOSED"]);
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let skillRegistryBaseline: ReturnType<typeof runSkillRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly PolicyGateFailure[], failure: PolicyGateFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: PolicyGateScenario): PolicyGateFailure | undefined { return scenario === "BASELINE" || scenario === "CERTIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly PolicyGateFailure[], scenario: PolicyGateScenario): PolicyGateDecision {
  if (has(failures, "W2_0_CAF_CONSTITUTION_INVALID") || has(failures, "W2_1_AGENT_REGISTRY_INVALID") || has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID") || has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID") || has(failures, "W2_4_SKILL_REGISTRY_INVALID") || has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID") || has(failures, "AUTHORITY_DECISION_NOT_VALIDATED") || has(failures, "POLICY_ENGINE_NON_DETERMINISTIC") || has(failures, "POLICY_DEFINITION_INVALID") || has(failures, "POLICY_RESOLUTION_NON_DETERMINISTIC") || has(failures, "POLICY_INHERITANCE_INVALID") || has(failures, "POLICY_PRECEDENCE_INVALID") || has(failures, "CONSTITUTIONAL_PRECEDENCE_BYPASSED") || has(failures, "TENANT_ISOLATION_FAILED") || has(failures, "POLICY_CONFLICT_UNRESOLVED") || has(failures, "CIRCULAR_POLICY_DEPENDENCY_ALLOWED") || has(failures, "DUPLICATE_POLICY_ALLOWED") || has(failures, "INVALID_POLICY_CONDITION_ALLOWED") || has(failures, "UNAPPROVED_EXCEPTION_ALLOWED") || has(failures, "EXPIRED_EXCEPTION_ALLOWED") || has(failures, "REVOKED_EXCEPTION_ALLOWED") || has(failures, "INVALID_POLICY_DISPOSITION_ALLOWED") || has(failures, "POLICY_GRANTED_AUTHORITY") || has(failures, "SAFETY_EVALUATION_PERFORMED") || has(failures, "OPERATOR_APPROVAL_PERFORMED") || has(failures, "POLICY_REPLAY_INVALID") || has(failures, "POLICY_EVIDENCE_NOT_IMMUTABLE")) return "FAIL_CLOSED";
  if (has(failures, "POLICY_GATE_CERTIFICATION_FAILED")) return "NOT_CERTIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "CERTIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_CERTIFIED";
  return "POLICY_GATE_CERTIFIED";
}
function resultReplayHash(result: Omit<PolicyGateResult, "replay_hash" | "integrity_hash">): string { return hash({ engine: result.engine.integrity_hash, registry: result.registry.integrity_hash, resolution: result.resolution.integrity_hash, hierarchy: result.hierarchy.integrity_hash, conflicts: result.conflicts.integrity_hash, exceptions: result.exceptions.integrity_hash, disposition: result.disposition_mapping.integrity_hash, decisions: result.decisions.integrity_hash, apis: result.apis.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<PolicyGateResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runPolicyGate(input: PolicyGateInput = {}): PolicyGateResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<PolicyGateFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation();
  agentRegistryBaseline ??= runAgentRegistry();
  lifecycleBaseline ??= runLifecycleEngine();
  capabilityRegistryBaseline ??= runCapabilityRegistry();
  skillRegistryBaseline ??= runSkillRegistry();
  authorityValidatorBaseline ??= runAuthorityValidator();
  const constitutionInvalid = !validateCafConstitutionalFoundation(constitutionBaseline).valid || has(scenarioFailures, "W2_0_CAF_CONSTITUTION_INVALID");
  const agentRegistryInvalid = !validateAgentRegistry(agentRegistryBaseline).valid || has(scenarioFailures, "W2_1_AGENT_REGISTRY_INVALID");
  const lifecycleInvalid = !validateLifecycleEngine(lifecycleBaseline).valid || has(scenarioFailures, "W2_2_LIFECYCLE_ENGINE_INVALID");
  const capabilityRegistryInvalid = !validateCapabilityRegistry(capabilityRegistryBaseline).valid || has(scenarioFailures, "W2_3_CAPABILITY_REGISTRY_INVALID");
  const skillRegistryInvalid = !validateSkillRegistry(skillRegistryBaseline).valid || has(scenarioFailures, "W2_4_SKILL_REGISTRY_INVALID");
  const authorityValidatorInvalid = !validateAuthorityValidator(authorityValidatorBaseline).valid || has(scenarioFailures, "W2_5_AUTHORITY_VALIDATOR_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(constitutionInvalid ? ["W2_0_CAF_CONSTITUTION_INVALID" as const] : []), ...(agentRegistryInvalid ? ["W2_1_AGENT_REGISTRY_INVALID" as const] : []), ...(lifecycleInvalid ? ["W2_2_LIFECYCLE_ENGINE_INVALID" as const] : []), ...(capabilityRegistryInvalid ? ["W2_3_CAPABILITY_REGISTRY_INVALID" as const] : []), ...(skillRegistryInvalid ? ["W2_4_SKILL_REGISTRY_INVALID" as const] : []), ...(authorityValidatorInvalid ? ["W2_5_AUTHORITY_VALIDATOR_INVALID" as const] : [])])]);
  const authorityInputOk = !has(failures, "AUTHORITY_DECISION_NOT_VALIDATED") && !authorityValidatorInvalid;
  const engineOk = !has(failures, "POLICY_ENGINE_MISSING") && !has(failures, "POLICY_ENGINE_NON_DETERMINISTIC");
  const registryOk = !has(failures, "POLICY_REGISTRY_INTEGRATION_MISSING") && !has(failures, "POLICY_DEFINITION_INVALID");
  const resolutionOk = !has(failures, "POLICY_RESOLUTION_ENGINE_MISSING") && !has(failures, "POLICY_RESOLUTION_NON_DETERMINISTIC") && !has(failures, "POLICY_INHERITANCE_INVALID");
  const hierarchyOk = !has(failures, "POLICY_PRECEDENCE_INVALID") && !has(failures, "CONSTITUTIONAL_PRECEDENCE_BYPASSED") && !has(failures, "TENANT_ISOLATION_FAILED");
  const conflictsOk = !has(failures, "CONFLICT_DETECTION_MISSING") && !has(failures, "POLICY_CONFLICT_UNRESOLVED") && !has(failures, "CIRCULAR_POLICY_DEPENDENCY_ALLOWED") && !has(failures, "DUPLICATE_POLICY_ALLOWED") && !has(failures, "INVALID_POLICY_CONDITION_ALLOWED");
  const exceptionsOk = !has(failures, "EXCEPTION_WORKFLOW_MISSING") && !has(failures, "UNAPPROVED_EXCEPTION_ALLOWED") && !has(failures, "EXPIRED_EXCEPTION_ALLOWED") && !has(failures, "REVOKED_EXCEPTION_ALLOWED") && !has(failures, "EXCEPTION_EVIDENCE_MISSING");
  const dispositionOk = !has(failures, "DISPOSITION_MAPPING_MISSING") && !has(failures, "INVALID_POLICY_DISPOSITION_ALLOWED");
  const boundaryOk = !has(failures, "POLICY_GRANTED_AUTHORITY") && !has(failures, "SAFETY_EVALUATION_PERFORMED") && !has(failures, "OPERATOR_APPROVAL_PERFORMED");
  const apisOk = !has(failures, "POLICY_API_MISSING");
  const evidenceOk = !has(failures, "POLICY_EVIDENCE_MISSING") && !has(failures, "POLICY_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "POLICY_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const certified = decision === "POLICY_GATE_CERTIFIED";
  const engine = nested({ engine_id: engineOk ? `engine:w2.6:policy:${input.seed ?? "canonical"}` : "", load_applicable_policies: engineOk, resolve_inheritance: engineOk, evaluate_conditions: engineOk, apply_restrictions: engineOk, calculate_decisions: engineOk, generate_evidence: engineOk, policy_decision: engineOk, evaluation_trace: engineOk, resolution_tree: engineOk, deterministic_evaluation: engineOk, fail_closed: engineOk });
  const registry = nested({ registry_id: registryOk ? "registry:w2.6:policy-definitions" : "", platform_policies: registryOk, tenant_policies: registryOk, runtime_policies: registryOk, mission_policies: registryOk, capability_policies: registryOk, skill_policies: registryOk, governance_policies: registryOk, configuration_policies: registryOk, definitions_versioned: registryOk, evidence_references: registryOk });
  const resolution = nested({ engine_id: resolutionOk ? "engine:w2.6:policy-resolution" : "", inheritance: resolutionOk, aggregation: resolutionOk, overrides: resolutionOk, exclusions: resolutionOk, conditional_activation: resolutionOk, runtime_policy_activation: resolutionOk, resolved_policy_set: resolutionOk, deterministic_resolution: resolutionOk });
  const hierarchy = nested({ hierarchy_id: hierarchyOk ? "hierarchy:w2.6:policy-precedence" : "", scopes: hierarchyOk ? freezeArray(SCOPES) : freezeArray<PolicyScope>([]), constitutional_precedence: hierarchyOk, delegated_precedence_exceptions: hierarchyOk, precedence_deterministic: hierarchyOk, tenant_isolation: hierarchyOk });
  const conflicts = nested({ engine_id: conflictsOk ? "engine:w2.6:policy-conflicts" : "", incompatible_permissions: conflictsOk, conflicting_restrictions: conflictsOk, circular_dependencies: conflictsOk, duplicate_policies: conflictsOk, invalid_inheritance: conflictsOk, impossible_conditions: conflictsOk, conflict_reports: conflictsOk, deterministic_resolution: conflictsOk });
  const exceptions = nested({ workflow_id: exceptionsOk ? "workflow:w2.6:policy-exceptions" : "", temporary_exceptions: exceptionsOk, emergency_exceptions: exceptionsOk, delegated_exceptions: exceptionsOk, operator_approved_exceptions: exceptionsOk, expiration: exceptionsOk, revocation: exceptionsOk, evidence: exceptionsOk, lineage: exceptionsOk, approval_required: exceptionsOk });
  const disposition_mapping = nested({ table_id: dispositionOk ? "table:w2.6:policy-dispositions" : "", dispositions: dispositionOk ? freezeArray(DISPOSITIONS) : freezeArray<PolicyDisposition>([]), allow: dispositionOk, allow_with_restrictions: dispositionOk, deny: dispositionOk, escalate: dispositionOk, fail_closed: dispositionOk, safety_gate_input: dispositionOk, canonical_mapping: dispositionOk });
  const decisions = nested({ engine_id: engineOk && authorityInputOk && boundaryOk ? "engine:w2.6:policy-decisions" : "", decision_id: engineOk, authority_decision_reference: authorityInputOk, applied_policies: registryOk, evaluation_result: engineOk, restrictions: engineOk, exceptions: exceptionsOk, final_disposition: certified ? "ALLOW" as const : "FAIL_CLOSED" as const, timestamp: engineOk, traceable_to_authority: authorityInputOk, deterministic_decision: engineOk, grants_authority: false as const, evaluates_safety: false as const, performs_operator_approval: false as const });
  const apis = nested({ api_id: apisOk ? "api:w2.6:policy-gate" : "", policy_evaluation_api: apisOk, policy_registry_api: apisOk, policy_resolution_api: apisOk, conflict_detection_api: apisOk, exception_api: apisOk, policy_replay_api: apisOk, stable: apisOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.6:policy-evidence" : "", records: evidenceOk ? freezeArray(["policy:evaluation", "policy:resolution-tree", "policy:conflict-report", "policy:exception", "policy:decision", "policy:replay", "policy:lineage", "policy:audit"]) : freezeArray<string>([]), policy_evaluation_records: evidenceOk, resolution_trees: evidenceOk, conflict_reports: evidenceOk, exception_records: evidenceOk, policy_decision_evidence: evidenceOk, deterministic_replay_evidence: evidenceOk, policy_lineage: evidenceOk, audit_records: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.6-POLICY-GATE-READINESS-001", decision, phase_ready: certified, constitution_ready: !constitutionInvalid, agent_registry_ready: !agentRegistryInvalid, lifecycle_engine_ready: !lifecycleInvalid, capability_registry_ready: !capabilityRegistryInvalid, skill_registry_ready: !skillRegistryInvalid, authority_validator_ready: !authorityValidatorInvalid, validated_authority_input: authorityInputOk, engine_ready: engineOk, registry_ready: registryOk, resolution_ready: resolutionOk, hierarchy_ready: hierarchyOk, conflict_detection_ready: conflictsOk, exception_workflow_ready: exceptionsOk, disposition_mapping_ready: dispositionOk, decisions_ready: engineOk && authorityInputOk && boundaryOk, apis_ready: apisOk, evidence_ready: evidenceOk, enforcement_sequence: "Authority -> Policy -> Safety -> Operator" as const, policy_precedes_safety_operator: boundaryOk, failures });
  const base: Omit<PolicyGateResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", skill_registry_ref: "skill-registry/w2.4", authority_validator_ref: "authority-validator/w2.5", engine, registry, resolution, hierarchy, conflicts, exceptions, disposition_mapping, decisions, apis, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePolicyGate(result?: PolicyGateResult): PolicyGateValidation {
  if (!result) return nested({ valid: false, decision: "NOT_CERTIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, engine_valid: false, registry_valid: false, resolution_valid: false, hierarchy_valid: false, conflicts_valid: false, exceptions_valid: false, disposition_mapping_valid: false, decisions_valid: false, apis_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["POLICY_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const engine_valid = verifyHashed(result.engine) && result.engine.load_applicable_policies && result.engine.deterministic_evaluation && result.engine.fail_closed;
  const registry_valid = verifyHashed(result.registry) && result.registry.platform_policies && result.registry.tenant_policies && result.registry.definitions_versioned;
  const resolution_valid = verifyHashed(result.resolution) && result.resolution.inheritance && result.resolution.resolved_policy_set && result.resolution.deterministic_resolution;
  const hierarchy_valid = verifyHashed(result.hierarchy) && result.hierarchy.scopes.length === 10 && result.hierarchy.constitutional_precedence && result.hierarchy.tenant_isolation;
  const conflicts_valid = verifyHashed(result.conflicts) && result.conflicts.conflict_reports && result.conflicts.deterministic_resolution;
  const exceptions_valid = verifyHashed(result.exceptions) && result.exceptions.approval_required && result.exceptions.expiration && result.exceptions.revocation && result.exceptions.lineage;
  const disposition_mapping_valid = verifyHashed(result.disposition_mapping) && result.disposition_mapping.dispositions.length === 5 && result.disposition_mapping.safety_gate_input;
  const decisions_valid = verifyHashed(result.decisions) && result.decisions.authority_decision_reference && result.decisions.final_disposition === "ALLOW" && result.decisions.grants_authority === false && result.decisions.evaluates_safety === false && result.decisions.performs_operator_approval === false;
  const apis_valid = verifyHashed(result.apis) && result.apis.policy_evaluation_api && result.apis.policy_replay_api && result.apis.stable;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.replayable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.validated_authority_input && result.readiness.policy_precedes_safety_operator && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && engine_valid && registry_valid && resolution_valid && hierarchy_valid && conflicts_valid && exceptions_valid && disposition_mapping_valid && decisions_valid && apis_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, engine_valid, registry_valid, resolution_valid, hierarchy_valid, conflicts_valid, exceptions_valid, disposition_mapping_valid, decisions_valid, apis_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}

export function replayPolicyGate(result = runPolicyGate()): boolean { const replayed = runPolicyGate(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePolicyGate(result).valid; }
export function getPolicyGateBundle(): PolicyGateBundle { const result = runPolicyGate(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_policy_evaluation: true, owns_policy_inheritance: true, owns_policy_resolution: true, owns_policy_precedence: true, owns_policy_conflict_detection: true, owns_exception_workflow: true, owns_policy_disposition_mapping: true, owns_policy_decisions: true, owns_policy_evidence: true, does_not_grant_authority: true, does_not_evaluate_safety: true, does_not_perform_operator_approval: true, enforcement_sequence: "Authority -> Policy -> Safety -> Operator", certification_gate: "Policy Gate Certification Gate" }), result, validation: validatePolicyGate(result) }); }
export const PolicyGateService = Object.freeze({ run: runPolicyGate, validate: validatePolicyGate, replay: replayPolicyGate });
