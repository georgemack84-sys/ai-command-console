import type { AgentIdentity } from "@/types/multi-agent-coordination-contract";

export type GovernanceSyncState = "INITIALIZING" | "GOVERNANCE_LOADING" | "POLICY_SYNCHRONIZATION" | "CONSTITUTION_VALIDATION" | "EVIDENCE_VALIDATION" | "DELEGATION_VALIDATION" | "GOVERNANCE_SYNCHRONIZED" | "REPLAY_READY" | "CERTIFIED" | "FAILED";
export type GovernanceCategory = "Constitution" | "Authority" | "Delegation" | "Execution" | "Risk" | "Recovery" | "Security" | "Compliance" | "Integrity" | "Certification";
export type PolicyType = "Authority" | "Execution" | "Delegation" | "Communication" | "Security" | "Recovery" | "Runtime" | "Risk" | "Integrity" | "Certification";
export type EvidenceSource = "Truth Ledger" | "Mission Ledger" | "Planning Ledger" | "Delegation Ledger" | "Runtime Ledger" | "Integrity Ledger" | "Risk Ledger" | "Replay Ledger" | "Certification Ledger";
export type SharedGovernanceScenario = "BASELINE" | "GOVERNANCE_CONTEXT_MISMATCH" | "CONSTITUTIONAL_MISMATCH" | "POLICY_DRIFT" | "REPLAY_MISMATCH" | "MISSING_GOVERNANCE_EVIDENCE" | "DELEGATION_GOVERNANCE_BYPASS" | "GOVERNANCE_BYPASS" | "INCONSISTENT_RULE_INTERPRETATION" | "AUTHORITY_POLICY_MISMATCH" | "HIDDEN_GOVERNANCE_EVALUATION" | "CROSS_TENANT_GOVERNANCE_LEAKAGE" | "INTEGRITY_FAILURE";
export type SharedGovernanceFailure = "GOVERNANCE_CONTEXT_MISMATCH_DETECTED" | "CONSTITUTIONAL_MISMATCH_DETECTED" | "POLICY_DRIFT_DETECTED" | "GOVERNANCE_REPLAY_MISMATCH_DETECTED" | "MISSING_GOVERNANCE_EVIDENCE_DETECTED" | "DELEGATION_BYPASSES_GOVERNANCE" | "GOVERNANCE_BYPASS_DETECTED" | "INCONSISTENT_RULE_INTERPRETATION_DETECTED" | "AUTHORITY_POLICY_MISMATCH_DETECTED" | "HIDDEN_GOVERNANCE_EVALUATION_DETECTED" | "CROSS_TENANT_GOVERNANCE_LEAKAGE_DETECTED" | "INTEGRITY_HASH_INVALID";

export type GovernanceContext = Readonly<{
  governance_context_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  constitution_version: string;
  governance_policy_version: string;
  authority_policy_version: string;
  security_policy_version: string;
  risk_policy_version: string;
  compliance_policy_version: string;
  effective_timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceStateRecord = Readonly<{
  governance_state_id: string;
  governance_context_id: string;
  policy_version: string;
  constitution_version: string;
  authority_version: string;
  validation_status: "VALID" | "INVALID";
  effective_timestamp: string;
  integrity_hash: string;
}>;

export type PolicyAlignmentRecord = Readonly<{
  agent_id: string;
  policy_version: string;
  constitution_version: string;
  authority_version: string;
  compliance_status: "COMPLIANT" | "NON_COMPLIANT";
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionRecord = Readonly<{
  decision_id: string;
  governance_context_id: string;
  policy_reference: string;
  constitutional_reference: string;
  decision_result: "ALLOW_RECOMMENDATION" | "REQUIRE_REVIEW" | "REJECT";
  decision_reason: string;
  confidence_score: number;
  timestamp: string;
  integrity_hash: string;
}>;

export type GovernanceInfluenceGraphNode = Readonly<{
  graph_id: string;
  decision_id: string;
  policy_node: string;
  constitution_node: string;
  authority_node: string;
  evidence_node: string;
  delegation_node: string;
  execution_node: string;
  result_node: string;
  integrity_hash: string;
}>;

export type ConstitutionalComplianceSummary = Readonly<{
  summary_id: string;
  mission_id: string;
  constitutional_rules_checked: readonly string[];
  violations_detected: readonly string[];
  governance_actions: readonly string[];
  compliance_score: number;
  timestamp: string;
}>;

export type SharedGovernanceConflict = Readonly<{
  conflict_id: string;
  conflict_type: SharedGovernanceFailure;
  affected_agents: readonly string[];
  expected_context: string;
  observed_context: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
}>;

export type SharedGovernanceEvidence = Readonly<{
  governance_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  agent_ids: readonly string[];
  governance_context: string;
  policy_evidence: readonly string[];
  constitutional_evidence: readonly string[];
  authority_evidence: readonly string[];
  delegation_evidence: readonly string[];
  truth_ledger_references: readonly string[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type SharedGovernanceEvent = Readonly<{
  event_id: string;
  governance_validation_id: string;
  agent_id: string;
  event_type: string;
  governance_state: GovernanceSyncState;
  previous_state: GovernanceSyncState;
  new_state: GovernanceSyncState;
  policy_reference: string;
  constitution_reference: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type SharedGovernanceContract = Readonly<{
  shared_governance_contract_id: string;
  governance_validation_id: string;
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  participating_agents: readonly AgentIdentity[];
  governance_context: GovernanceContext;
  governance_states: readonly GovernanceStateRecord[];
  constitution_reference: string;
  policy_references: readonly string[];
  authority_references: readonly string[];
  evidence_references: readonly string[];
  delegation_policy: readonly string[];
  replay_policy: readonly string[];
  policy_alignment_matrix: readonly PolicyAlignmentRecord[];
  governance_decisions: readonly GovernanceDecisionRecord[];
  influence_graph: readonly GovernanceInfluenceGraphNode[];
  constitutional_summary: ConstitutionalComplianceSummary;
  conflicts: readonly SharedGovernanceConflict[];
  evidence: SharedGovernanceEvidence;
  events: readonly SharedGovernanceEvent[];
  created_timestamp: string;
  version: "shared-governance-assurance/v8ALT.7.5";
  immutable: true;
  append_only: true;
  operator_visible: boolean;
  integrity_hash: string;
  contract_hash: string;
}>;

export type SharedGovernanceInput = Readonly<{
  scenario?: SharedGovernanceScenario;
  tenant_id?: string;
  mission_id?: string;
  contract?: SharedGovernanceContract;
}>;

export type SharedGovernanceValidationResult = Readonly<{
  shared_governance_contract_id: string | null;
  valid: boolean;
  context_shared: boolean;
  rules_identical: boolean;
  constitutional_valid: boolean;
  policy_consistent: boolean;
  decisions_reproducible: boolean;
  evidence_valid: boolean;
  delegation_governed: boolean;
  authority_policy_synchronized: boolean;
  truth_ledger_preserved: boolean;
  lineage_preserved: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  operator_visible: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  failures: readonly SharedGovernanceFailure[];
  validation_hash: string;
}>;

export type SharedGovernanceReplayResult = Readonly<{
  replay_reference: string;
  shared_governance_contract_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type SharedGovernanceObservabilitySurface = Readonly<{
  shared_governance_contract_id: string;
  governance_validation_id: string;
  tenant_id: string;
  mission_id: string;
  agent_count: number;
  policy_alignment_count: number;
  decision_count: number;
  conflict_count: number;
  state: GovernanceSyncState;
  contract_hash: string;
}>;

export type SharedGovernanceAssuranceBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "shared-governance-assurance/v8ALT.7.5";
    final_state: "SHARED_GOVERNANCE_ASSURANCE_CERTIFIED";
    states: readonly GovernanceSyncState[];
    governance_categories: readonly GovernanceCategory[];
    policy_types: readonly PolicyType[];
    evidence_sources: readonly EvidenceSource[];
    principles: readonly string[];
  }>;
  contract: SharedGovernanceContract;
  validation: SharedGovernanceValidationResult;
  replay: SharedGovernanceReplayResult;
  observability: SharedGovernanceObservabilitySurface;
}>;
