import type { BoundaryCertificationReport } from "@/types/boundary-certification-gate";

export type ReplayType = "EXECUTION" | "PLANNING" | "DECISION" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "INTERVENTION" | "GOVERNANCE" | "FORENSIC" | "CERTIFICATION";
export type ReplayScope = "ENTIRE_MISSION" | "MISSION_PHASE" | "WORKFLOW" | "TASK" | "DECISION" | "PLANNING_SESSION" | "DELEGATION" | "RUNTIME_WINDOW" | "SUPERVISION_EVENT" | "INTERVENTION" | "GOVERNANCE_REVIEW" | "FORENSIC_INVESTIGATION";
export type ReplayLifecycleState = "REGISTERED" | "VALIDATING" | "COLLECTING_ARTIFACTS" | "VERIFYING_INTEGRITY" | "RECONSTRUCTING" | "VERIFYING_ORDER" | "VALIDATING_GOVERNANCE" | "CALCULATING_CONFIDENCE" | "COMPLETED" | "ARTIFACT_MISSING" | "HASH_FAILURE" | "ORDER_MISMATCH" | "GOVERNANCE_FAILURE" | "LINEAGE_FAILURE" | "REPLAY_INVALID" | "REPLAY_ABORTED";
export type ReplayConfidenceLevel = "EXACT" | "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type ReplayContractScenario =
  | "BASELINE"
  | "ARTIFACT_MISSING"
  | "HASH_FAILURE"
  | "ORDER_MISMATCH"
  | "GOVERNANCE_FAILURE"
  | "LINEAGE_FAILURE"
  | "TENANT_VIOLATION"
  | "LOW_CONFIDENCE"
  | "DUPLICATE_IDENTITY"
  | "CONSTITUTION_MISMATCH"
  | "AUTHORITY_MISSING"
  | "HASH_MISMATCH";

export type ReplayValidationFailure =
  | "REPLAY_ID_NOT_UNIQUE"
  | "REQUIRED_ARTIFACT_MISSING"
  | "HASH_VALIDATION_FAILED"
  | "ORDERING_MISMATCH"
  | "GOVERNANCE_REFERENCE_INVALID"
  | "CONSTITUTION_REFERENCE_CHANGED"
  | "AUTHORITY_CHAIN_MISSING"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_VIOLATION"
  | "CONFIDENCE_BELOW_THRESHOLD"
  | "INTEGRITY_HASH_MISMATCH";

export type ReplayIdentity = Readonly<{
  replay_id: string;
  replay_version: "replay-contract/v8G.1";
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  workflow_id: string;
  plan_id: string;
  session_id: string;
  replay_type: ReplayType;
  replay_scope: ReplayScope;
  replay_status: ReplayLifecycleState;
  created_timestamp: string;
  completed_timestamp: string;
  requested_by: string;
  requested_reason: string;
  parent_replay: string | null;
  child_replays: readonly string[];
  lineage_reference: string;
  truth_reference: string;
  integrity_hash: string;
  contract_version: "replay-contract/v8G.1";
}>;

export type ReplayReferences = Readonly<{
  mission_reference: string;
  workflow_reference: string;
  execution_reference: string;
  planning_reference: string;
  decision_reference: string;
  delegation_reference: string;
  orchestration_reference: string;
  supervision_reference: string;
  intervention_reference: string;
  governance_reference: string;
  truth_reference: string;
  integrity_reference: string;
  replay_reference: string;
  lineage_reference: string;
}>;

export type ReplayArtifactManifest = Readonly<{
  manifest_id: string;
  identity_artifacts: readonly string[];
  planning_artifacts: readonly string[];
  execution_artifacts: readonly string[];
  decision_artifacts: readonly string[];
  delegation_artifacts: readonly string[];
  orchestration_artifacts: readonly string[];
  runtime_artifacts: readonly string[];
  governance_artifacts: readonly string[];
  truth_ledger_artifacts: readonly string[];
  integrity_artifacts: readonly string[];
  missing_artifacts: readonly string[];
  completeness: "COMPLETE" | "INCOMPLETE";
  manifest_hash: string;
}>;

export type ReplayOrderingGuarantee = Readonly<{
  ordering_id: string;
  preserved_order: readonly string[];
  deterministic_sequence_numbers: readonly number[];
  dependency_ordering_hash: string;
  checkpoint_ordering_hash: string;
  state_transition_ordering_hash: string;
  causality_hash: string;
  ordering_state: "MATCH" | "MISMATCH";
  ordering_hash: string;
}>;

export type ReplayIntegrityRecord = Readonly<{
  integrity_id: string;
  planning_hash: string;
  decision_hash: string;
  orchestration_hash: string;
  delegation_hash: string;
  supervision_hash: string;
  execution_hash: string;
  intervention_hash: string;
  replay_hash: string;
  mission_hash: string;
  truth_ledger_hash: string;
  verification_state: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type ReplayConfidenceAssessment = Readonly<{
  confidence_id: string;
  artifact_completeness: number;
  ordering_consistency: number;
  evidence_completeness: number;
  integrity_validation: number;
  governance_consistency: number;
  dependency_completeness: number;
  hash_verification: number;
  replay_determinism: number;
  confidence_score: number;
  confidence_level: ReplayConfidenceLevel;
  confidence_hash: string;
}>;

export type ReplayGovernanceReferences = Readonly<{
  constitution_version: string;
  policy_version: string;
  authority_reference: string;
  approval_reference: string;
  risk_reference: string;
  compliance_reference: string;
  boundary_reference: string;
  governance_state: "VALID" | "INVALID";
  operator_reference: string;
  governance_hash: string;
}>;

export type ReplayValidationResult = Readonly<{
  validation_id: string;
  replay_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly ReplayValidationFailure[];
  identity_unique: boolean;
  artifacts_complete: boolean;
  hashes_valid: boolean;
  ordering_exact: boolean;
  governance_valid: boolean;
  constitution_unchanged: boolean;
  authority_chain_preserved: boolean;
  lineage_complete: boolean;
  tenant_isolated: boolean;
  confidence_certifiable: boolean;
  certification_ready: boolean;
  validation_hash: string;
}>;

export type ReplayContractPackage = Readonly<{
  package_id: string;
  contract_version: "replay-contract/v8G.1";
  source_boundary_certification: BoundaryCertificationReport;
  replay_identity: ReplayIdentity;
  references: ReplayReferences;
  artifact_manifest: ReplayArtifactManifest;
  ordering: ReplayOrderingGuarantee;
  integrity_record: ReplayIntegrityRecord;
  confidence: ReplayConfidenceAssessment;
  governance: ReplayGovernanceReferences;
  validation: ReplayValidationResult;
  immutable: true;
  speculative_replay_permitted: false;
  package_hash: string;
}>;

export type ReplayContractVisibilitySurface = Readonly<{
  replay_id: string;
  replay_status: ReplayLifecycleState;
  replay_type: ReplayType;
  replay_scope: ReplayScope;
  confidence_level: ReplayConfidenceLevel;
  confidence_score: number;
  validation_state: "PASS" | "FAIL";
  failures: readonly ReplayValidationFailure[];
  artifact_completeness: "COMPLETE" | "INCOMPLETE";
  ordering_state: "MATCH" | "MISMATCH";
  integrity_state: "PASS" | "FAIL";
  governance_state: "VALID" | "INVALID";
  certification_ready: boolean;
}>;

export type ReplayContractFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    contract_version: "replay-contract/v8G.1";
    replay_types: readonly ReplayType[];
    replay_scopes: readonly ReplayScope[];
    lifecycle_states: readonly ReplayLifecycleState[];
    confidence_levels: readonly ReplayConfidenceLevel[];
  }>;
  package: ReplayContractPackage;
  visibility: ReplayContractVisibilitySurface;
}>;
