export type SafetyGateDecision = "SAFETY_GATE_VERIFIED" | "CONDITIONALLY_VERIFIED" | "NOT_VERIFIED" | "FAIL_CLOSED";
export type SafetyDisposition = "ALLOW" | "ALLOW_WITH_WARNING" | "REQUIRE_OPERATOR_APPROVAL" | "BLOCK" | "EMERGENCY_STOP";
export type SafetyGateFailure =
  | "W2_0_CAF_CONSTITUTION_INVALID"
  | "W2_1_AGENT_REGISTRY_INVALID"
  | "W2_2_LIFECYCLE_ENGINE_INVALID"
  | "W2_3_CAPABILITY_REGISTRY_INVALID"
  | "W2_4_SKILL_REGISTRY_INVALID"
  | "W2_5_AUTHORITY_VALIDATOR_INVALID"
  | "W2_6_POLICY_GATE_INVALID"
  | "AUTHORITY_POLICY_INPUT_NOT_VALIDATED"
  | "SAFETY_RULE_ENGINE_MISSING"
  | "SAFETY_RULES_MUTABLE"
  | "PROHIBITED_ACTION_ALLOWED"
  | "TENANT_SAFETY_BOUNDARY_BYPASSED"
  | "RUNTIME_SAFETY_ENGINE_MISSING"
  | "SAFETY_EVALUATION_NON_DETERMINISTIC"
  | "EXECUTION_BYPASSED_SAFETY_GATE"
  | "FAIL_SAFE_EXECUTION_DISABLED"
  | "EMERGENCY_STOP_CONTROLLER_MISSING"
  | "EMERGENCY_STOP_NOT_IMMEDIATE"
  | "RUNTIME_ISOLATION_FAILED"
  | "AGENT_SUSPENSION_FAILED"
  | "SAFETY_MONITORING_MISSING"
  | "UNSAFE_BEHAVIOR_UNDETECTED"
  | "POLICY_BYPASS_UNDETECTED"
  | "AUTHORITY_VIOLATION_UNDETECTED"
  | "DISPOSITION_MAPPING_MISSING"
  | "INVALID_SAFETY_DISPOSITION_ALLOWED"
  | "OPERATOR_GUIDANCE_MISSING"
  | "SAFETY_REGISTRY_MISSING"
  | "SAFETY_REGISTRY_INTEGRITY_FAILED"
  | "SAFETY_API_MISSING"
  | "SAFETY_EVIDENCE_MISSING"
  | "SAFETY_EVIDENCE_NOT_IMMUTABLE"
  | "SAFETY_REPLAY_INVALID"
  | "SAFETY_GATE_VERIFICATION_FAILED";
export type SafetyGateScenario = "BASELINE" | "VERIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | SafetyGateFailure;
export type SafetyGateInput = Readonly<{ scenario?: SafetyGateScenario; seed?: string }>;
export type SafetyRuleEngine = Readonly<{ engine_id: string; constitutional_rules: boolean; runtime_rules: boolean; capability_constraints: boolean; skill_constraints: boolean; execution_restrictions: boolean; prohibited_action_rules: boolean; escalation_rules: boolean; tenant_boundaries: boolean; rule_library: boolean; rule_evaluation_service: boolean; immutable_rules: boolean; integrity_hash: string }>;
export type RuntimeSafetyEngine = Readonly<{ engine_id: string; pre_execution_validation: boolean; runtime_verification: boolean; continuous_checking: boolean; action_approval: boolean; action_denial: boolean; warning_generation: boolean; deterministic_evaluation: boolean; fail_safe_execution: boolean; bypass_prevention: boolean; integrity_hash: string }>;
export type EmergencyStopController = Readonly<{ controller_id: string; immediate_execution_stop: boolean; workflow_termination: boolean; agent_suspension: boolean; runtime_isolation: boolean; capability_disablement: boolean; tenant_emergency_stop: boolean; global_emergency_stop: boolean; deterministic_shutdown: boolean; integrity_hash: string }>;
export type SafetyMonitoring = Readonly<{ monitor_id: string; unsafe_behavior: boolean; repeated_violations: boolean; execution_anomalies: boolean; safety_degradation: boolean; dangerous_workflows: boolean; runaway_execution: boolean; policy_bypass_attempts: boolean; authority_violations: boolean; watchdog: boolean; alerts: boolean; continuous: boolean; integrity_hash: string }>;
export type SafetyDispositionMapping = Readonly<{ table_id: string; dispositions: readonly SafetyDisposition[]; rationale: boolean; violated_rule: boolean; evidence_references: boolean; operator_guidance: boolean; remediation_recommendation: boolean; canonical_mapping: boolean; integrity_hash: string }>;
export type SafetyRegistry = Readonly<{ registry_id: string; safety_rules: boolean; rule_versions: boolean; safety_profiles: boolean; execution_constraints: boolean; monitoring_rules: boolean; emergency_procedures: boolean; disposition_mappings: boolean; safety_evidence_references: boolean; registry_integrity: boolean; integrity_hash: string }>;
export type SafetyGateApis = Readonly<{ api_id: string; safety_evaluation_api: boolean; rule_registry_api: boolean; emergency_stop_api: boolean; monitoring_api: boolean; disposition_api: boolean; evidence_api: boolean; replay_api: boolean; stable: boolean; integrity_hash: string }>;
export type SafetyEvidence = Readonly<{ ledger_id: string; records: readonly string[]; evaluated_rules: boolean; decision_outcome: boolean; triggering_conditions: boolean; execution_context: boolean; runtime_state: boolean; operator_interactions: boolean; emergency_actions: boolean; timestamps: boolean; cryptographic_signatures: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type SafetyGateReadiness = Readonly<{ readiness_id: string; decision: SafetyGateDecision; phase_ready: boolean; constitution_ready: boolean; agent_registry_ready: boolean; lifecycle_engine_ready: boolean; capability_registry_ready: boolean; skill_registry_ready: boolean; authority_validator_ready: boolean; policy_gate_ready: boolean; validated_authority_policy_input: boolean; rules_ready: boolean; runtime_ready: boolean; emergency_stop_ready: boolean; monitoring_ready: boolean; disposition_mapping_ready: boolean; registry_ready: boolean; apis_ready: boolean; evidence_ready: boolean; execution_bypass_prevented: boolean; enforcement_sequence: "Authority -> Policy -> Safety -> Operator"; safety_precedes_operator_runtime: boolean; failures: readonly SafetyGateFailure[]; integrity_hash: string }>;
export type SafetyGateResult = Readonly<{ phase_version: "safety-gate/w2.7"; phase_identifier: "SafetyGate"; caf_constitution_ref: "caf-constitutional-foundation/w2.0"; agent_registry_ref: "agent-registry/w2.1"; lifecycle_engine_ref: "lifecycle-engine/w2.2"; capability_registry_ref: "capability-registry/w2.3"; skill_registry_ref: "skill-registry/w2.4"; authority_validator_ref: "authority-validator/w2.5"; policy_gate_ref: "policy-gate/w2.6"; rules: SafetyRuleEngine; runtime: RuntimeSafetyEngine; emergency_stop: EmergencyStopController; monitoring: SafetyMonitoring; disposition_mapping: SafetyDispositionMapping; registry: SafetyRegistry; apis: SafetyGateApis; evidence: SafetyEvidence; readiness: SafetyGateReadiness; replay_hash: string; integrity_hash: string }>;
export type SafetyGateValidation = Readonly<{ valid: boolean; decision: SafetyGateDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; rules_valid: boolean; runtime_valid: boolean; emergency_stop_valid: boolean; monitoring_valid: boolean; disposition_mapping_valid: boolean; registry_valid: boolean; apis_valid: boolean; evidence_valid: boolean; readiness_valid: boolean; failures: readonly SafetyGateFailure[]; integrity_hash: string }>;
export type SafetyGateBundle = Readonly<{ doctrine: Readonly<{ version: "safety-gate/w2.7"; owns_safety_rules: true; owns_runtime_safety: true; owns_emergency_stop: true; owns_safety_monitoring: true; owns_safety_dispositions: true; owns_safety_registry: true; owns_safety_evidence: true; fail_closed: true; enforcement_sequence: "Authority -> Policy -> Safety -> Operator"; verification_gate: "Safety Gate Verification Gate" }>; result: SafetyGateResult; validation: SafetyGateValidation }>;
