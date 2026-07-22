export type CafLegionRuntimeDecision = "QUALIFIED" | "CONDITIONALLY_QUALIFIED" | "NOT_QUALIFIED" | "FAIL_CLOSED";
export type CafLegionRuntimeFailure =
  | "W1_1B_IDENTITY_FULL_INVALID"
  | "W1_2B_STORAGE_FULL_INVALID"
  | "W1_3B_MESSAGING_FULL_INVALID"
  | "W1_4B_REGISTRY_FULL_INVALID"
  | "W1_5_CONFIGURATION_PLATFORM_INVALID"
  | "W1_6_OBSERVABILITY_PLATFORM_INVALID"
  | "W1_7B_SECURITY_FULL_INVALID"
  | "RUNTIME_FOUNDATION_MISSING"
  | "RUNTIME_LIFECYCLE_NON_DETERMINISTIC"
  | "RUNTIME_ISOLATION_FAILED"
  | "AGENT_REGISTRY_MISSING"
  | "AGENT_IDENTITY_BINDING_FAILED"
  | "AGENT_DISCOVERY_FAILED"
  | "ORCHESTRATOR_MISSING"
  | "EXECUTION_ROUTING_FAILED"
  | "WORKFLOW_COORDINATION_FAILED"
  | "CAPABILITY_REGISTRY_MISSING"
  | "CAPABILITY_VALIDATION_FAILED"
  | "SKILL_REGISTRY_MISSING"
  | "SKILL_COMPOSITION_FAILED"
  | "PLANNING_ENGINE_MISSING"
  | "PLANNING_NON_DETERMINISTIC"
  | "PLAN_VALIDATION_FAILED"
  | "MEMORY_ENGINE_MISSING"
  | "MEMORY_GOVERNANCE_FAILED"
  | "MEMORY_PERSISTENCE_FAILED"
  | "COLLABORATION_ENGINE_MISSING"
  | "COLLABORATION_GOVERNANCE_FAILED"
  | "DELEGATION_ENGINE_MISSING"
  | "DELEGATION_AUTHORITY_FAILED"
  | "POLICY_GATE_MISSING"
  | "POLICY_ENFORCEMENT_FAILED"
  | "SAFETY_GATE_MISSING"
  | "UNSAFE_ACTION_NOT_BLOCKED"
  | "AUTHORITY_VALIDATOR_MISSING"
  | "AUTHORITY_CHAIN_INVALID"
  | "OPERATOR_CONSOLE_MISSING"
  | "OPERATOR_SUPREMACY_FAILED"
  | "CAF_EVIDENCE_MISSING"
  | "CAF_EVIDENCE_NOT_IMMUTABLE"
  | "CAF_REPLAY_MISSING"
  | "CAF_REPLAY_NON_DETERMINISTIC"
  | "CERTIFICATION_PACKAGE_MISSING"
  | "CAF_RUNTIME_QUALIFICATION_GATE_FAILED";
export type CafLegionRuntimeScenario = "BASELINE" | "QUALIFIED_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | CafLegionRuntimeFailure;
export type CafLegionRuntimeInput = Readonly<{ scenario?: CafLegionRuntimeScenario; seed?: string }>;
export type RuntimeFoundation = Readonly<{ runtime_id: string; runtime_engine: boolean; lifecycle_manager: boolean; runtime_apis: boolean; scheduler: boolean; isolation_framework: boolean; coordination: boolean; deterministic_lifecycle: boolean; integrity_hash: string }>;
export type AgentRegistryRuntime = Readonly<{ registry_id: string; agent_registration: boolean; identity_binding: boolean; metadata_services: boolean; runtime_discovery: boolean; version_tracking: boolean; agent_state: boolean; integrity_hash: string }>;
export type RuntimeOrchestrator = Readonly<{ orchestrator_id: string; agent_scheduling: boolean; execution_control: boolean; workflow_coordination: boolean; dependency_resolution: boolean; runtime_supervision: boolean; execution_routing: boolean; integrity_hash: string }>;
export type CapabilitySkillRegistries = Readonly<{ registry_id: string; capability_registration: boolean; capability_discovery: boolean; capability_versioning: boolean; dependency_mapping: boolean; capability_validation: boolean; skill_registration: boolean; skill_discovery: boolean; skill_composition: boolean; integrity_hash: string }>;
export type PlanningMemoryEngines = Readonly<{ engine_id: string; goal_planning: boolean; task_planning: boolean; mission_planning: boolean; plan_validation: boolean; deterministic_planning: boolean; working_memory: boolean; long_term_memory: boolean; governed_memory: boolean; memory_persistence: boolean; integrity_hash: string }>;
export type CollaborationDelegation = Readonly<{ engine_id: string; team_formation: boolean; shared_context: boolean; task_coordination: boolean; consensus_support: boolean; collaboration_evidence: boolean; task_delegation: boolean; authority_verification: boolean; delegation_audit: boolean; delegation_recovery: boolean; integrity_hash: string }>;
export type RuntimeGovernance = Readonly<{ governance_id: string; policy_evaluation: boolean; policy_enforcement: boolean; policy_traceability: boolean; safety_validation: boolean; unsafe_action_detection: boolean; risk_blocking: boolean; authority_resolution: boolean; authority_verification: boolean; authority_chain_validation: boolean; integrity_hash: string }>;
export type OperatorConsole = Readonly<{ console_id: string; runtime_dashboard: boolean; agent_inspection: boolean; execution_monitoring: boolean; pause: boolean; resume: boolean; cancel: boolean; override_requests: boolean; manual_approval: boolean; operator_supremacy: boolean; integrity_hash: string }>;
export type CafRuntimeEvidence = Readonly<{ ledger_id: string; records: readonly string[]; execution_evidence: boolean; decision_evidence: boolean; planning_evidence: boolean; collaboration_evidence: boolean; safety_evidence: boolean; policy_evidence: boolean; authority_evidence: boolean; immutable: boolean; integrity_hash: string }>;
export type CafRuntimeReplay = Readonly<{ replay_id: string; runtime_replay: boolean; decision_replay: boolean; workflow_replay: boolean; planning_replay: boolean; collaboration_replay: boolean; replay_validation: boolean; deterministic: boolean; integrity_hash: string }>;
export type CafRuntimeCertification = Readonly<{ package_id: string; runtime_certification_evidence: boolean; compliance_reports: boolean; readiness_reports: boolean; certification_package: boolean; functional_qualification: boolean; governance_qualification: boolean; operational_qualification: boolean; security_qualification: boolean; replay_qualification: boolean; gate_decision: CafLegionRuntimeDecision; integrity_hash: string }>;
export type CafLegionRuntimeReadiness = Readonly<{ readiness_id: string; decision: CafLegionRuntimeDecision; phase_ready: boolean; identity_ready: boolean; storage_ready: boolean; messaging_ready: boolean; registry_ready: boolean; configuration_ready: boolean; observability_ready: boolean; security_ready: boolean; runtime_ready: boolean; agent_registry_ready: boolean; orchestrator_ready: boolean; registries_ready: boolean; planning_memory_ready: boolean; collaboration_delegation_ready: boolean; governance_ready: boolean; operator_ready: boolean; evidence_ready: boolean; replay_ready: boolean; certification_ready: boolean; failures: readonly CafLegionRuntimeFailure[]; integrity_hash: string }>;
export type CafLegionRuntimeResult = Readonly<{ phase_version: "caf-legion-runtime/w1.8"; phase_identifier: "CafLegionRuntime"; identity_full_ref: "identity-full/w1.1b"; storage_full_ref: "storage-full/w1.2b"; messaging_full_ref: "messaging-full/w1.3b"; registry_full_ref: "registry-full/w1.4b"; configuration_platform_ref: "configuration-platform/w1.5"; observability_platform_ref: "observability-platform/w1.6"; security_full_ref: "security-full/w1.7b"; runtime_foundation: RuntimeFoundation; agent_registry: AgentRegistryRuntime; orchestrator: RuntimeOrchestrator; capability_skill_registries: CapabilitySkillRegistries; planning_memory: PlanningMemoryEngines; collaboration_delegation: CollaborationDelegation; governance: RuntimeGovernance; operator_console: OperatorConsole; evidence: CafRuntimeEvidence; replay: CafRuntimeReplay; certification: CafRuntimeCertification; readiness: CafLegionRuntimeReadiness; replay_hash: string; integrity_hash: string }>;
export type CafLegionRuntimeValidation = Readonly<{ valid: boolean; decision: CafLegionRuntimeDecision; replay_hash_valid: boolean; integrity_hash_valid: boolean; runtime_valid: boolean; agent_registry_valid: boolean; orchestrator_valid: boolean; registries_valid: boolean; planning_memory_valid: boolean; collaboration_delegation_valid: boolean; governance_valid: boolean; operator_valid: boolean; evidence_valid: boolean; replay_valid: boolean; certification_valid: boolean; readiness_valid: boolean; failures: readonly CafLegionRuntimeFailure[]; integrity_hash: string }>;
export type CafLegionRuntimeBundle = Readonly<{ doctrine: Readonly<{ version: "caf-legion-runtime/w1.8"; owns_agent_runtime: true; owns_agent_registry: true; owns_runtime_orchestrator: true; owns_capability_registry: true; owns_skill_registry: true; owns_planning_engine: true; owns_memory_engine: true; owns_collaboration: true; owns_delegation: true; owns_governance_gates: true; owns_operator_console: true; owns_caf_evidence: true; owns_caf_replay: true; owns_caf_certification: true; qualification_gate: "CAF Runtime Qualification Gate" }>; result: CafLegionRuntimeResult; validation: CafLegionRuntimeValidation }>;
