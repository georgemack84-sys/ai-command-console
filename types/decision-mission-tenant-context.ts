import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";

export type MissionLifecycleState = "PLANNED" | "INITIALIZING" | "ACTIVE" | "MONITORING" | "RECOVERING" | "COMPLETING" | "COMPLETED" | "ARCHIVED";
export type MissionPhase = "Planning" | "Intake" | "Assessment" | "Decision Orchestration" | "Execution Support" | "Supervision" | "Recovery" | "Certification";
export type MissionPriority = "Critical" | "High" | "Normal" | "Low";
export type MissionStatus = "READY" | "DEGRADED" | "BLOCKED" | "COMPLETE";
export type TenantOperationalState = "ACTIVE" | "SUSPENDED" | "INACTIVE" | "ARCHIVED";

export type MissionTenantResolutionState =
  | "PENDING"
  | "MISSION_IDENTITY_RESOLVED"
  | "MISSION_LIFECYCLE_RESOLVED"
  | "MISSION_PHASE_RESOLVED"
  | "MISSION_HEALTH_RESOLVED"
  | "MISSION_PRIORITY_RESOLVED"
  | "MISSION_VALIDATED"
  | "TENANT_IDENTITY_RESOLVED"
  | "TENANT_POLICY_RESOLVED"
  | "TENANT_GOVERNANCE_RESOLVED"
  | "TENANT_BOUNDARY_VALIDATED"
  | "CACHE_RECORDED"
  | "REGISTRY_REFERENCED"
  | "PASSED"
  | "FAILED_MISSION"
  | "FAILED_TENANT"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type MissionTenantFailureReason =
  | "MISSION_NOT_FOUND"
  | "MISSION_IDENTITY_MISMATCH"
  | "INVALID_MISSION_PHASE"
  | "MISSING_MISSION_OBJECTIVE"
  | "MISSING_MISSION_LIFECYCLE"
  | "MISSION_HEALTH_UNAVAILABLE"
  | "MISSION_PRIORITY_UNDEFINED"
  | "TENANT_NOT_FOUND"
  | "TENANT_IDENTITY_MISMATCH"
  | "TENANT_POLICIES_UNAVAILABLE"
  | "TENANT_OWNERSHIP_MISMATCH"
  | "TENANT_BOUNDARY_VIOLATION"
  | "CROSS_TENANT_REFERENCE"
  | "INTEGRITY_VERIFICATION_FAILED";

export type ResolutionExplainability = Readonly<{
  source_subsystem: string;
  source_record: string;
  resolution_timestamp: string;
  resolver_version: "mission-tenant-context-resolver/v1";
  supporting_evidence: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  integrity_verified: boolean;
  replay_reference: string;
  integrity_hash: string;
}>;

export type MissionHealth = Readonly<{
  overall_health_score: number;
  operational_readiness: "READY" | "DEGRADED" | "BLOCKED";
  degraded_services: readonly string[];
  critical_alerts: readonly string[];
  recovery_indicators: readonly string[];
  stability_assessment: "STABLE" | "WATCH" | "UNSTABLE";
  health_confidence: number;
  integrity_hash: string;
}>;

export type MissionContext = Readonly<{
  mission_id: string;
  mission_name: string;
  mission_objective: string;
  mission_phase: MissionPhase;
  mission_lifecycle_state: MissionLifecycleState;
  mission_priority: MissionPriority;
  mission_status: MissionStatus;
  mission_health: MissionHealth;
  mission_owner: string;
  mission_constraints: readonly string[];
  mission_dependencies: readonly string[];
  mission_governance_state: "COMPLIANT" | "REVIEW_REQUIRED" | "BLOCKED";
  mission_start_time: string;
  mission_last_update: string;
  mission_version: string;
  explainability: ResolutionExplainability;
  mission_integrity_hash: string;
}>;

export type TenantContext = Readonly<{
  tenant_id: string;
  tenant_name: string;
  tenant_type: "ENTERPRISE" | "GOVERNANCE" | "SYSTEM";
  tenant_owner: string;
  tenant_policies: readonly string[];
  tenant_governance_profile: string;
  tenant_security_profile: string;
  tenant_isolation_boundary: string;
  tenant_authority_model: "ADVISORY_ONLY" | "OPERATOR_APPROVAL" | "GOVERNANCE_APPROVAL";
  tenant_operational_state: TenantOperationalState;
  tenant_version: string;
  explainability: ResolutionExplainability;
  tenant_integrity_hash: string;
}>;

export type MissionContextCache = Readonly<{
  cache_id: string;
  mission_id: string;
  mission_version: string;
  mission_context: MissionContext;
  integrity_hash: string;
  created_timestamp: string;
}>;

export type TenantContextRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  tenant_profile: TenantContext;
  tenant_policy_refs: readonly string[];
  isolation_boundary: string;
  integrity_hash: string;
}>;

export type MissionTenantContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  expected_tenant_id: string;
  expected_mission_id: string;
  mission_version?: string;
  resolver_version: "mission-tenant-context-resolver/v1";
}>;

export type MissionTenantValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: MissionTenantResolutionState;
  failure_reason?: MissionTenantFailureReason;
  failure_reasons: readonly MissionTenantFailureReason[];
  checks: Readonly<{
    mission_exists: boolean;
    mission_identity_valid: boolean;
    mission_phase_valid: boolean;
    mission_lifecycle_valid: boolean;
    mission_health_available: boolean;
    mission_priority_defined: boolean;
    tenant_exists: boolean;
    tenant_identity_valid: boolean;
    tenant_policies_available: boolean;
    tenant_boundary_valid: boolean;
    mission_belongs_to_tenant: boolean;
    integrity_verified: boolean;
  }>;
}>;

export type MissionTenantContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  mission_context: MissionContext;
  tenant_context: TenantContext;
  mission_domain: DecisionContextDomain;
  tenant_domain: DecisionContextDomain;
  cache_entry: MissionContextCache;
  tenant_registry: TenantContextRegistry;
  validation: MissionTenantValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type MissionTenantReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: MissionTenantResolutionState;
  failures: readonly MissionTenantFailureReason[];
  integrity_hash: string;
}>;

export type MissionTenantObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  mission_failures: number;
  tenant_failures: number;
  isolation_failures: number;
  integrity_failures: number;
  cache_entries_created: number;
  registry_references: number;
  replay_success_rate: number;
}>;
