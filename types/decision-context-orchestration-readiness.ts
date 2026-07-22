import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { ContextRegistryPackage } from "@/types/decision-context-registry-ledger-replay";

export type OrchestrationReadinessState = "READY" | "CONDITIONALLY_READY" | "NOT_READY" | "BLOCKED";
export type InterfaceCompatibilityStatus = "COMPATIBLE" | "INCOMPATIBLE" | "MISSING" | "UNVERIFIED";
export type IntegrationValidationState = "PASSED" | "FAILED_CONTEXT" | "FAILED_INTERFACE" | "FAILED_GOVERNANCE" | "FAILED_AUTHORITY" | "FAILED_REPLAY" | "FAILED_INTEGRITY" | "FAILED_ISOLATION";

export type OrchestrationReadinessFailureReason =
  | "CONTEXT_INCOMPLETE"
  | "VALIDATION_INCOMPLETE"
  | "CERTIFICATION_INCOMPLETE"
  | "INTERFACE_INCOMPATIBLE"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "AUTHORITY_UNRESOLVED"
  | "REPLAY_UNAVAILABLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "CROSS_TENANT_INTEGRATION";

export type DownstreamInterfaceName =
  | "decision_ranking_engine"
  | "decision_prioritization_engine"
  | "authority_evaluation_engine"
  | "recommendation_engine"
  | "governance_engine"
  | "replay_engine"
  | "certification_framework";

export type OrchestrationReadiness = Readonly<{
  readiness_id: string;
  decision_candidate_id: string;
  context_status: "COMPLETE" | "INCOMPLETE";
  validation_status: "VALIDATED" | "INVALID";
  certification_status: "CERTIFIED" | "UNCERTIFIED";
  interface_status: "COMPATIBLE" | "INCOMPATIBLE";
  integration_status: "INTEGRATED" | "BLOCKED";
  readiness_state: OrchestrationReadinessState;
  readiness_score: number;
  orchestration_eligible: boolean;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type DownstreamIntegrationRegistry = Readonly<{
  registry_id: string;
  decision_candidate_id: string;
  target_component: DownstreamInterfaceName;
  interface_version: string;
  compatibility_status: InterfaceCompatibilityStatus;
  validation_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ContextIntegration = Readonly<{
  integration_id: string;
  decision_candidate_id: string;
  context_package: string;
  downstream_interfaces: readonly DownstreamInterfaceName[];
  interface_mappings: Readonly<Record<DownstreamInterfaceName, string>>;
  integration_dependencies: readonly string[];
  integration_lineage: readonly string[];
  integration_version: "context-orchestration-readiness/v1";
  validation_state: IntegrationValidationState;
  integrity_hash: string;
}>;

export type ReadinessReport = Readonly<{
  report_id: string;
  decision_candidate_id: string;
  readiness_summary: string;
  validation_results: readonly string[];
  certification_results: readonly string[];
  interface_results: readonly string[];
  unresolved_items: readonly string[];
  orchestration_decision: "ALLOW_ORCHESTRATION_ENTRY" | "BLOCK_ORCHESTRATION_ENTRY";
  integrity_hash: string;
}>;

export type OrchestrationEntryPackage = Readonly<{
  entry_package_id: string;
  decision_candidate_id: string;
  decision_context_ref: string;
  validation_report_ref: string;
  integrity_report_ref: string;
  explainability_report_ref: string;
  replay_package_ref: string;
  certification_package_refs: readonly string[];
  governance_package_refs: readonly string[];
  authority_package_refs: readonly string[];
  risk_package_refs: readonly string[];
  confidence_package_refs: readonly string[];
  self_contained: boolean;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OrchestrationReadinessRequest = Readonly<{
  readiness_id: string;
  candidate: DecisionCandidate;
  registry_package?: ContextRegistryPackage;
  interface_overrides?: Partial<Record<DownstreamInterfaceName, InterfaceCompatibilityStatus>>;
  readiness_version: "context-orchestration-readiness/v1";
}>;

export type OrchestrationReadinessValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: IntegrationValidationState;
  failure_reason?: OrchestrationReadinessFailureReason;
  failure_reasons: readonly OrchestrationReadinessFailureReason[];
  checks: Readonly<{
    context_complete: boolean;
    context_validated: boolean;
    context_certified: boolean;
    interfaces_compatible: boolean;
    governance_complete: boolean;
    constitutional_complete: boolean;
    authority_resolved: boolean;
    replay_verified: boolean;
    certification_complete: boolean;
    integration_lineage_preserved: boolean;
    integrity_verified: boolean;
    tenant_isolated: boolean;
  }>;
}>;

export type OrchestrationReadinessPackage = Readonly<{
  readiness_id: string;
  candidate_id: string;
  readiness: OrchestrationReadiness;
  integration: ContextIntegration;
  downstream_registry: readonly DownstreamIntegrationRegistry[];
  readiness_report: ReadinessReport;
  orchestration_entry_package: OrchestrationEntryPackage;
  validation: OrchestrationReadinessValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type OrchestrationReadinessReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  readiness_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: OrchestrationReadinessState;
  failures: readonly OrchestrationReadinessFailureReason[];
  integrity_hash: string;
}>;

export type OrchestrationReadinessObservability = Readonly<{
  readiness_attempts: number;
  ready_count: number;
  blocked_count: number;
  interface_failures: number;
  governance_failures: number;
  authority_failures: number;
  replay_failures: number;
  integrity_failures: number;
  isolation_failures: number;
  average_readiness_score: number;
  replay_success_rate: number;
}>;
