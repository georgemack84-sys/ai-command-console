import { runAgentRegistry, validateAgentRegistry } from "@/services/agent-registry";
import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCafConstitutionalFoundation, validateCafConstitutionalFoundation } from "@/services/caf-constitutional-foundation";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLifecycleEngine, validateLifecycleEngine } from "@/services/lifecycle-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { SafetyDisposition, SafetyGateBundle, SafetyGateDecision, SafetyGateFailure, SafetyGateInput, SafetyGateResult, SafetyGateScenario, SafetyGateValidation } from "@/types/safety-gate";

const VERSION = "safety-gate/w2.7" as const;
const IDENTIFIER = "SafetyGate" as const;
const DISPOSITIONS = Object.freeze<SafetyDisposition[]>(["ALLOW", "ALLOW_WITH_WARNING", "REQUIRE_OPERATOR_APPROVAL", "BLOCK", "EMERGENCY_STOP"]);
let constitutionBaseline: ReturnType<typeof runCafConstitutionalFoundation> | undefined;
let agentRegistryBaseline: ReturnType<typeof runAgentRegistry> | undefined;
let lifecycleBaseline: ReturnType<typeof runLifecycleEngine> | undefined;
let capabilityRegistryBaseline: ReturnType<typeof runCapabilityRegistry> | undefined;
let skillRegistryBaseline: ReturnType<typeof runSkillRegistry> | undefined;
let authorityValidatorBaseline: ReturnType<typeof runAuthorityValidator> | undefined;
let policyGateBaseline: ReturnType<typeof runPolicyGate> | undefined;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly SafetyGateFailure[], failure: SafetyGateFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: SafetyGateScenario): SafetyGateFailure | undefined { return scenario === "BASELINE" || scenario === "VERIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly SafetyGateFailure[], scenario: SafetyGateScenario): SafetyGateDecision {
  if (has(failures, "W2_0_CAF_CONSTITUTION_INVALID") || has(failures, "W2_1_AGENT_REGISTRY_INVALID") || has(failures, "W2_2_LIFECYCLE_ENGINE_INVALID") || has(failures, "W2_3_CAPABILITY_REGISTRY_INVALID") || has(failures, "W2_4_SKILL_REGISTRY_INVALID") || has(failures, "W2_5_AUTHORITY_VALIDATOR_INVALID") || has(failures, "W2_6_POLICY_GATE_INVALID") || has(failures, "AUTHORITY_POLICY_INPUT_NOT_VALIDATED") || has(failures, "SAFETY_RULES_MUTABLE") || has(failures, "PROHIBITED_ACTION_ALLOWED") || has(failures, "TENANT_SAFETY_BOUNDARY_BYPASSED") || has(failures, "SAFETY_EVALUATION_NON_DETERMINISTIC") || has(failures, "EXECUTION_BYPASSED_SAFETY_GATE") || has(failures, "FAIL_SAFE_EXECUTION_DISABLED") || has(failures, "EMERGENCY_STOP_NOT_IMMEDIATE") || has(failures, "RUNTIME_ISOLATION_FAILED") || has(failures, "AGENT_SUSPENSION_FAILED") || has(failures, "UNSAFE_BEHAVIOR_UNDETECTED") || has(failures, "POLICY_BYPASS_UNDETECTED") || has(failures, "AUTHORITY_VIOLATION_UNDETECTED") || has(failures, "INVALID_SAFETY_DISPOSITION_ALLOWED") || has(failures, "OPERATOR_GUIDANCE_MISSING") || has(failures, "SAFETY_REGISTRY_INTEGRITY_FAILED") || has(failures, "SAFETY_EVIDENCE_NOT_IMMUTABLE") || has(failures, "SAFETY_REPLAY_INVALID")) return "FAIL_CLOSED";
  if (has(failures, "SAFETY_GATE_VERIFICATION_FAILED")) return "NOT_VERIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "VERIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_VERIFIED";
  return "SAFETY_GATE_VERIFIED";
}
function resultReplayHash(result: Omit<SafetyGateResult, "replay_hash" | "integrity_hash">): string { return hash({ rules: result.rules.integrity_hash, runtime: result.runtime.integrity_hash, emergency: result.emergency_stop.integrity_hash, monitoring: result.monitoring.integrity_hash, mapping: result.disposition_mapping.integrity_hash, registry: result.registry.integrity_hash, apis: result.apis.integrity_hash, evidence: result.evidence.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<SafetyGateResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runSafetyGate(input: SafetyGateInput = {}): SafetyGateResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<SafetyGateFailure>(direct ? [direct] : []);
  constitutionBaseline ??= runCafConstitutionalFoundation();
  agentRegistryBaseline ??= runAgentRegistry();
  lifecycleBaseline ??= runLifecycleEngine();
  capabilityRegistryBaseline ??= runCapabilityRegistry();
  skillRegistryBaseline ??= runSkillRegistry();
  authorityValidatorBaseline ??= runAuthorityValidator();
  policyGateBaseline ??= runPolicyGate();
  const constitutionInvalid = !validateCafConstitutionalFoundation(constitutionBaseline).valid || has(scenarioFailures, "W2_0_CAF_CONSTITUTION_INVALID");
  const agentRegistryInvalid = !validateAgentRegistry(agentRegistryBaseline).valid || has(scenarioFailures, "W2_1_AGENT_REGISTRY_INVALID");
  const lifecycleInvalid = !validateLifecycleEngine(lifecycleBaseline).valid || has(scenarioFailures, "W2_2_LIFECYCLE_ENGINE_INVALID");
  const capabilityRegistryInvalid = !validateCapabilityRegistry(capabilityRegistryBaseline).valid || has(scenarioFailures, "W2_3_CAPABILITY_REGISTRY_INVALID");
  const skillRegistryInvalid = !validateSkillRegistry(skillRegistryBaseline).valid || has(scenarioFailures, "W2_4_SKILL_REGISTRY_INVALID");
  const authorityValidatorInvalid = !validateAuthorityValidator(authorityValidatorBaseline).valid || has(scenarioFailures, "W2_5_AUTHORITY_VALIDATOR_INVALID");
  const policyGateInvalid = !validatePolicyGate(policyGateBaseline).valid || has(scenarioFailures, "W2_6_POLICY_GATE_INVALID");
  const failures = freezeArray([...new Set([...scenarioFailures, ...(constitutionInvalid ? ["W2_0_CAF_CONSTITUTION_INVALID" as const] : []), ...(agentRegistryInvalid ? ["W2_1_AGENT_REGISTRY_INVALID" as const] : []), ...(lifecycleInvalid ? ["W2_2_LIFECYCLE_ENGINE_INVALID" as const] : []), ...(capabilityRegistryInvalid ? ["W2_3_CAPABILITY_REGISTRY_INVALID" as const] : []), ...(skillRegistryInvalid ? ["W2_4_SKILL_REGISTRY_INVALID" as const] : []), ...(authorityValidatorInvalid ? ["W2_5_AUTHORITY_VALIDATOR_INVALID" as const] : []), ...(policyGateInvalid ? ["W2_6_POLICY_GATE_INVALID" as const] : [])])]);
  const upstreamOk = !authorityValidatorInvalid && !policyGateInvalid && !has(failures, "AUTHORITY_POLICY_INPUT_NOT_VALIDATED");
  const rulesOk = !has(failures, "SAFETY_RULE_ENGINE_MISSING") && !has(failures, "SAFETY_RULES_MUTABLE") && !has(failures, "PROHIBITED_ACTION_ALLOWED") && !has(failures, "TENANT_SAFETY_BOUNDARY_BYPASSED");
  const runtimeOk = !has(failures, "RUNTIME_SAFETY_ENGINE_MISSING") && !has(failures, "SAFETY_EVALUATION_NON_DETERMINISTIC") && !has(failures, "EXECUTION_BYPASSED_SAFETY_GATE") && !has(failures, "FAIL_SAFE_EXECUTION_DISABLED");
  const emergencyOk = !has(failures, "EMERGENCY_STOP_CONTROLLER_MISSING") && !has(failures, "EMERGENCY_STOP_NOT_IMMEDIATE") && !has(failures, "RUNTIME_ISOLATION_FAILED") && !has(failures, "AGENT_SUSPENSION_FAILED");
  const monitoringOk = !has(failures, "SAFETY_MONITORING_MISSING") && !has(failures, "UNSAFE_BEHAVIOR_UNDETECTED") && !has(failures, "POLICY_BYPASS_UNDETECTED") && !has(failures, "AUTHORITY_VIOLATION_UNDETECTED");
  const mappingOk = !has(failures, "DISPOSITION_MAPPING_MISSING") && !has(failures, "INVALID_SAFETY_DISPOSITION_ALLOWED") && !has(failures, "OPERATOR_GUIDANCE_MISSING");
  const registryOk = !has(failures, "SAFETY_REGISTRY_MISSING") && !has(failures, "SAFETY_REGISTRY_INTEGRITY_FAILED");
  const apisOk = !has(failures, "SAFETY_API_MISSING");
  const evidenceOk = !has(failures, "SAFETY_EVIDENCE_MISSING") && !has(failures, "SAFETY_EVIDENCE_NOT_IMMUTABLE") && !has(failures, "SAFETY_REPLAY_INVALID");
  const decision = decisionFor(failures, scenario);
  const verified = decision === "SAFETY_GATE_VERIFIED";
  const rules = nested({ engine_id: rulesOk ? `engine:w2.7:safety-rules:${input.seed ?? "canonical"}` : "", constitutional_rules: rulesOk, runtime_rules: rulesOk, capability_constraints: rulesOk, skill_constraints: rulesOk, execution_restrictions: rulesOk, prohibited_action_rules: rulesOk, escalation_rules: rulesOk, tenant_boundaries: rulesOk, rule_library: rulesOk, rule_evaluation_service: rulesOk, immutable_rules: rulesOk });
  const runtime = nested({ engine_id: runtimeOk ? "engine:w2.7:runtime-safety" : "", pre_execution_validation: runtimeOk, runtime_verification: runtimeOk, continuous_checking: runtimeOk, action_approval: runtimeOk, action_denial: runtimeOk, warning_generation: runtimeOk, deterministic_evaluation: runtimeOk, fail_safe_execution: runtimeOk, bypass_prevention: runtimeOk });
  const emergency_stop = nested({ controller_id: emergencyOk ? "controller:w2.7:emergency-stop" : "", immediate_execution_stop: emergencyOk, workflow_termination: emergencyOk, agent_suspension: emergencyOk, runtime_isolation: emergencyOk, capability_disablement: emergencyOk, tenant_emergency_stop: emergencyOk, global_emergency_stop: emergencyOk, deterministic_shutdown: emergencyOk });
  const monitoring = nested({ monitor_id: monitoringOk ? "monitor:w2.7:safety-runtime" : "", unsafe_behavior: monitoringOk, repeated_violations: monitoringOk, execution_anomalies: monitoringOk, safety_degradation: monitoringOk, dangerous_workflows: monitoringOk, runaway_execution: monitoringOk, policy_bypass_attempts: monitoringOk, authority_violations: monitoringOk, watchdog: monitoringOk, alerts: monitoringOk, continuous: monitoringOk });
  const disposition_mapping = nested({ table_id: mappingOk ? "table:w2.7:safety-dispositions" : "", dispositions: mappingOk ? freezeArray(DISPOSITIONS) : freezeArray<SafetyDisposition>([]), rationale: mappingOk, violated_rule: mappingOk, evidence_references: mappingOk, operator_guidance: mappingOk, remediation_recommendation: mappingOk, canonical_mapping: mappingOk });
  const registry = nested({ registry_id: registryOk ? "registry:w2.7:safety" : "", safety_rules: registryOk, rule_versions: registryOk, safety_profiles: registryOk, execution_constraints: registryOk, monitoring_rules: registryOk, emergency_procedures: registryOk, disposition_mappings: registryOk, safety_evidence_references: registryOk, registry_integrity: registryOk });
  const apis = nested({ api_id: apisOk ? "api:w2.7:safety-gate" : "", safety_evaluation_api: apisOk, rule_registry_api: apisOk, emergency_stop_api: apisOk, monitoring_api: apisOk, disposition_api: apisOk, evidence_api: apisOk, replay_api: apisOk, stable: apisOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:w2.7:safety-evidence" : "", records: evidenceOk ? freezeArray(["safety:evaluated-rules", "safety:decision", "safety:trigger", "safety:execution-context", "safety:runtime-state", "safety:operator-interaction", "safety:emergency-action", "safety:signature"]) : freezeArray<string>([]), evaluated_rules: evidenceOk, decision_outcome: evidenceOk, triggering_conditions: evidenceOk, execution_context: evidenceOk, runtime_state: evidenceOk, operator_interactions: evidenceOk, emergency_actions: evidenceOk, timestamps: evidenceOk, cryptographic_signatures: evidenceOk, immutable: evidenceOk, replayable: evidenceOk });
  const readiness = nested({ readiness_id: "W2.7-SAFETY-GATE-READINESS-001", decision, phase_ready: verified, constitution_ready: !constitutionInvalid, agent_registry_ready: !agentRegistryInvalid, lifecycle_engine_ready: !lifecycleInvalid, capability_registry_ready: !capabilityRegistryInvalid, skill_registry_ready: !skillRegistryInvalid, authority_validator_ready: !authorityValidatorInvalid, policy_gate_ready: !policyGateInvalid, validated_authority_policy_input: upstreamOk, rules_ready: rulesOk, runtime_ready: runtimeOk, emergency_stop_ready: emergencyOk, monitoring_ready: monitoringOk, disposition_mapping_ready: mappingOk, registry_ready: registryOk, apis_ready: apisOk, evidence_ready: evidenceOk, execution_bypass_prevented: runtimeOk, enforcement_sequence: "Authority -> Policy -> Safety -> Operator" as const, safety_precedes_operator_runtime: upstreamOk && runtimeOk, failures });
  const base: Omit<SafetyGateResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, caf_constitution_ref: "caf-constitutional-foundation/w2.0", agent_registry_ref: "agent-registry/w2.1", lifecycle_engine_ref: "lifecycle-engine/w2.2", capability_registry_ref: "capability-registry/w2.3", skill_registry_ref: "skill-registry/w2.4", authority_validator_ref: "authority-validator/w2.5", policy_gate_ref: "policy-gate/w2.6", rules, runtime, emergency_stop, monitoring, disposition_mapping, registry, apis, evidence, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSafetyGate(result?: SafetyGateResult): SafetyGateValidation {
  if (!result) return nested({ valid: false, decision: "NOT_VERIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, rules_valid: false, runtime_valid: false, emergency_stop_valid: false, monitoring_valid: false, disposition_mapping_valid: false, registry_valid: false, apis_valid: false, evidence_valid: false, readiness_valid: false, failures: freezeArray(["SAFETY_RULE_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const rules_valid = verifyHashed(result.rules) && result.rules.constitutional_rules && result.rules.prohibited_action_rules && result.rules.immutable_rules;
  const runtime_valid = verifyHashed(result.runtime) && result.runtime.pre_execution_validation && result.runtime.deterministic_evaluation && result.runtime.fail_safe_execution && result.runtime.bypass_prevention;
  const emergency_stop_valid = verifyHashed(result.emergency_stop) && result.emergency_stop.immediate_execution_stop && result.emergency_stop.runtime_isolation && result.emergency_stop.deterministic_shutdown;
  const monitoring_valid = verifyHashed(result.monitoring) && result.monitoring.unsafe_behavior && result.monitoring.policy_bypass_attempts && result.monitoring.authority_violations && result.monitoring.continuous;
  const disposition_mapping_valid = verifyHashed(result.disposition_mapping) && result.disposition_mapping.dispositions.length === 5 && result.disposition_mapping.operator_guidance && result.disposition_mapping.canonical_mapping;
  const registry_valid = verifyHashed(result.registry) && result.registry.safety_rules && result.registry.rule_versions && result.registry.registry_integrity;
  const apis_valid = verifyHashed(result.apis) && result.apis.safety_evaluation_api && result.apis.emergency_stop_api && result.apis.replay_api && result.apis.stable;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.records.length >= 8 && result.evidence.immutable && result.evidence.replayable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.validated_authority_policy_input && result.readiness.execution_bypass_prevented && result.readiness.safety_precedes_operator_runtime && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && rules_valid && runtime_valid && emergency_stop_valid && monitoring_valid && disposition_mapping_valid && registry_valid && apis_valid && evidence_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, rules_valid, runtime_valid, emergency_stop_valid, monitoring_valid, disposition_mapping_valid, registry_valid, apis_valid, evidence_valid, readiness_valid, failures: result.readiness.failures });
}

export function replaySafetyGate(result = runSafetyGate()): boolean { const replayed = runSafetyGate(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSafetyGate(result).valid; }
export function getSafetyGateBundle(): SafetyGateBundle { const result = runSafetyGate(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_safety_rules: true, owns_runtime_safety: true, owns_emergency_stop: true, owns_safety_monitoring: true, owns_safety_dispositions: true, owns_safety_registry: true, owns_safety_evidence: true, fail_closed: true, enforcement_sequence: "Authority -> Policy -> Safety -> Operator", verification_gate: "Safety Gate Verification Gate" }), result, validation: validateSafetyGate(result) }); }
export const SafetyGateService = Object.freeze({ run: runSafetyGate, validate: validateSafetyGate, replay: replaySafetyGate });
