import type { AutonomyAuthorityScope } from "@/types/autonomy-contract";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";
import type { ConstitutionalDecisionRecord } from "@/types/autonomy-constitutional-constraints";

export type GovernanceInterfaceDirection = "RECEIVE" | "PUBLISH";
export type GovernanceInterfaceSource =
  | "GOVERNANCE_INTELLIGENCE"
  | "POLICY_INTELLIGENCE"
  | "RISK_INTELLIGENCE"
  | "COMPLIANCE_INTELLIGENCE"
  | "RECOMMENDATION_INTELLIGENCE"
  | "ESCALATION_INTELLIGENCE"
  | "LINEAGE_INTELLIGENCE"
  | "REPLAY_FRAMEWORK"
  | "TRUTH_LEDGER"
  | "VISIBILITY_FRAMEWORK"
  | "INTEGRITY_FRAMEWORK"
  | "CONTROLLED_AUTONOMY";
export type GovernanceInterfaceMessageType =
  | "POLICY_UPDATE"
  | "AUTHORITY_GRANT"
  | "RISK_UPDATE"
  | "GOVERNANCE_STATE"
  | "COMPLIANCE_ALERT"
  | "RECOMMENDATION"
  | "ESCALATION"
  | "REPLAY_REFERENCE"
  | "LINEAGE_UPDATE"
  | "AUTONOMY_STATE"
  | "AUTHORITY_USAGE"
  | "EXECUTION_INTENT"
  | "EVIDENCE"
  | "REPLAY_DATA"
  | "LIFECYCLE_EVENT";
export type GovernanceInterfaceDecisionState = "ACCEPTED" | "REJECTED";
export type GovernanceInterfaceValidationState = "PASS" | "FAIL";
export type GovernanceInterfaceScenario =
  | "BASELINE"
  | "PUBLISH_BASELINE"
  | "UNAUTHORIZED_EXECUTION"
  | "PRIVILEGE_ESCALATION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_VIOLATION"
  | "HIDDEN_TRAFFIC"
  | "UNDOCUMENTED_COMMUNICATION"
  | "REPLAY_OMISSION"
  | "MISSING_LINEAGE"
  | "INVALID_SCHEMA_VERSION"
  | "INTEGRITY_FAILURE"
  | "CROSS_TENANT"
  | "MALFORMED_MESSAGE";

export type GovernanceInterfaceFailureReason =
  | "SCHEMA_INVALID"
  | "INVALID_SCHEMA_VERSION"
  | "TENANT_OWNERSHIP_INVALID"
  | "GOVERNANCE_UNAUTHORIZED"
  | "CONSTITUTIONAL_VIOLATION"
  | "POLICY_INCOMPATIBLE"
  | "AUTHORITY_SCOPE_INVALID"
  | "REPLAY_REGISTRATION_MISSING"
  | "LINEAGE_REGISTRATION_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HIDDEN_INTERFACE_TRAFFIC"
  | "UNDOCUMENTED_COMMUNICATION"
  | "UNAUTHORIZED_EXECUTION_REQUEST"
  | "PRIVILEGE_ESCALATION"
  | "MALFORMED_INTERFACE_MESSAGE"
  | "TRUTH_LEDGER_REGISTRATION_MISSING"
  | "FAIL_CLOSED";

export type GovernanceInterfacePayload = Readonly<{
  summary: string;
  data_classification: "GOVERNANCE" | "POLICY" | "RISK" | "COMPLIANCE" | "RECOMMENDATION" | "ESCALATION" | "LINEAGE" | "REPLAY" | "EVIDENCE" | "LIFECYCLE";
  references: readonly string[];
}>;

export type GovernanceInterfaceTransaction = Readonly<{
  transaction_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  direction: GovernanceInterfaceDirection;
  source_interface: GovernanceInterfaceSource;
  destination_interface: GovernanceInterfaceSource;
  message_type: GovernanceInterfaceMessageType;
  message_version: "governance-interface/v8A.6";
  request_payload: GovernanceInterfacePayload;
  response_payload: GovernanceInterfacePayload;
  governance_profile: string;
  authority_scope: AutonomyAuthorityScope;
  replay_reference: string;
  lineage_reference: string;
  truth_ledger_reference: string;
  constitutional_decision: ConstitutionalDecisionRecord;
  hidden_route: boolean;
  integrity_hash: string;
  timestamp: string;
}>;

export type GovernanceInterfaceValidationResult = Readonly<{
  validation_id: string;
  transaction_id: string;
  validation_state: GovernanceInterfaceValidationState;
  decision: GovernanceInterfaceDecisionState;
  failures: readonly GovernanceInterfaceFailureReason[];
  schema_validated: boolean;
  tenant_validated: boolean;
  governance_authorized: boolean;
  constitutionally_compliant: boolean;
  policy_compatible: boolean;
  authority_validated: boolean;
  replay_registered: boolean;
  lineage_registered: boolean;
  truth_ledger_registered: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  validation_hash: string;
}>;

export type GovernanceInterfaceAuditLedger = Readonly<{
  ledger_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  transactions: readonly GovernanceInterfaceTransaction[];
  accepted_transactions: readonly GovernanceInterfaceTransaction[];
  rejected_transactions: readonly GovernanceInterfaceTransaction[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  truth_ledger_references: readonly string[];
  ledger_hash: string;
}>;

export type GovernanceInterfaceReplayResult = Readonly<{
  replay_id: string;
  autonomy_id: string;
  transaction_ids: readonly string[];
  reconstructed_decisions: readonly GovernanceInterfaceDecisionState[];
  source_interfaces: readonly GovernanceInterfaceSource[];
  destination_interfaces: readonly GovernanceInterfaceSource[];
  replay_references: readonly string[];
  validation_state: GovernanceInterfaceValidationState;
  failure_reason: GovernanceInterfaceFailureReason | null;
  replay_hash: string;
}>;

export type GovernanceInterfaceVisibilitySurface = Readonly<{
  autonomy_id: string;
  interface_activity: readonly GovernanceInterfaceTransaction[];
  governance_interactions: readonly GovernanceInterfaceSource[];
  policy_exchanges: readonly GovernanceInterfaceTransaction[];
  authority_decisions: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  execution_intent: readonly GovernanceInterfaceTransaction[];
  evidence_flow: readonly string[];
  lifecycle_events: readonly GovernanceInterfaceTransaction[];
  interface_health: "HEALTHY" | "DEGRADED" | "BLOCKED";
  integrity_status: "VALID" | "INVALID";
  hidden_transactions_visible: false;
}>;

export type GovernanceInterfacesFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  receive_transaction: GovernanceInterfaceTransaction;
  publish_transaction: GovernanceInterfaceTransaction;
  receive_validation: GovernanceInterfaceValidationResult;
  publish_validation: GovernanceInterfaceValidationResult;
  ledger: GovernanceInterfaceAuditLedger;
  replay: GovernanceInterfaceReplayResult;
  visibility: GovernanceInterfaceVisibilitySurface;
}>;
