export type ProductionBoundaryOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ProductionBoundaryDecisionType = "ADVISORY_ONLY" | "AUTHORIZATION_REQUIRED" | "AUTHORIZED" | "DENIED" | "CONTAINED" | "FAIL_CLOSED";
export type ProductionBoundaryLifecycleState = "RECOMMENDATION_CREATED" | "BOUNDARY_VALIDATION" | "AUTHORITY_REQUIRED" | "EXTERNAL_GATEWAY" | "TOKEN_VALIDATION" | "AUTHORIZED" | "EXTERNAL_EXECUTION" | "AUDIT_CAPTURE" | "COMPLETE";
export type ProductionBoundaryFailureState = "VIOLATION_DETECTED" | "KILL_SWITCH" | "CONTAINMENT" | "FORENSICS" | "REPLAY" | "GOVERNANCE_REVIEW";
export type ProductionBoundaryViolationSeverity = "INFO" | "WARNING" | "MAJOR" | "CRITICAL" | "CONSTITUTIONAL";
export type ProductionBoundaryFailure = "DIRECT_EXECUTION_POSSIBLE" | "EXTERNAL_AUTHORIZATION_NOT_REQUIRED" | "OPERATOR_APPROVAL_NOT_AUTHENTICATED" | "AUTHORITY_TOKEN_NOT_CRYPTOGRAPHICALLY_VALIDATED" | "DELEGATION_CHAIN_NOT_VERIFIED" | "CONFIDENCE_GRANTS_AUTHORITY" | "MODEL_OUTPUT_BYPASSES_GOVERNANCE" | "CROSS_TENANT_AUTHORITY_ACCEPTED" | "INVALID_TOKEN_ACCEPTED" | "BOUNDARY_VIOLATION_NOT_DETECTED" | "KILL_SWITCH_NON_DETERMINISTIC" | "CONTAINMENT_EVIDENCE_LOST" | "AUTHORIZATION_REPLAY_NON_DETERMINISTIC" | "AUDIT_EVIDENCE_MUTABLE" | "NON_CONSTITUTIONAL_BOUNDARY_WARNING";
export type ProductionBoundaryScenario = "BASELINE" | ProductionBoundaryFailure;

export type ProductionBoundaryInput = Readonly<{ scenario?: ProductionBoundaryScenario }>;

export type ProductionBoundaryDecision = Readonly<{
  decision_id: string;
  decision: ProductionBoundaryDecisionType;
  advisory_boundary_preserved: boolean;
  execution_capable_response_prevented: boolean;
  constitutional_policy_enforced: boolean;
  production_interfaces_validated: boolean;
  authority_expansion_blocked: boolean;
  deterministic: boolean;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ExternalAuthorizationRecord = Readonly<{
  authorization_id: string;
  execution_request_validated: boolean;
  external_authority_identity_verified: boolean;
  authorization_scope_valid: boolean;
  approval_evidence_valid: boolean;
  not_expired: boolean;
  replay_identity_assigned: boolean;
  mission_control_direct_execution_path: false;
  unauthenticated_requests_refused: boolean;
  integrity_hash: string;
}>;

export type AuthorityValidationRecord = Readonly<{
  validation_id: string;
  token_identity_valid: boolean;
  issuer_valid: boolean;
  cryptographic_signature_valid: boolean;
  not_expired: boolean;
  scope_valid: boolean;
  delegation_chain_verified: boolean;
  not_revoked: boolean;
  tenant_ownership_valid: boolean;
  replay_protection_valid: boolean;
  confidence_substitutes_for_authority: false;
  inference_substitutes_for_authority: false;
  integrity_hash: string;
}>;

export type ProductionBoundaryViolationRecord = Readonly<{
  violation_id: string;
  severity: ProductionBoundaryViolationSeverity;
  attempted_direct_execution: boolean;
  authority_escalation: boolean;
  bypass_attempt: boolean;
  governance_violation: boolean;
  invalid_token: boolean;
  authorization_failure: boolean;
  gateway_failure: boolean;
  replay_failure: boolean;
  containment_refs: readonly string[];
  forensic_refs: readonly string[];
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type BoundaryContainmentRecord = Readonly<{
  containment_id: string;
  execution_blocked: boolean;
  request_isolated: boolean;
  evidence_preserved: boolean;
  governance_notified: boolean;
  authorization_path_frozen: boolean;
  immutable_audit_recorded: boolean;
  replay_capture_initiated: boolean;
  rollback_recommended: boolean;
  never_grants_execution_authority: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type ProductionBoundaryCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionBoundaryOutcome;
  passed: boolean;
  failure_reason: ProductionBoundaryFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionBoundaryEnforcementResult = Readonly<{
  phase_version: "production-boundary-enforcement/v15.6";
  phase_identifier: "ProductionBoundaryEnforcement";
  progressive_delivery_ref: string;
  lifecycle: readonly ProductionBoundaryLifecycleState[];
  failure_path: readonly ProductionBoundaryFailureState[];
  decision: ProductionBoundaryDecision;
  authorization: ExternalAuthorizationRecord;
  authority_validation: AuthorityValidationRecord;
  violations: readonly ProductionBoundaryViolationRecord[];
  containment: BoundaryContainmentRecord;
  certification_tests: readonly ProductionBoundaryCertificationTest[];
  failures: readonly ProductionBoundaryFailure[];
  outcome: ProductionBoundaryOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionBoundaryEnforcementValidation = Readonly<{
  valid: boolean;
  outcome: ProductionBoundaryOutcome;
  decision_valid: boolean;
  authorization_valid: boolean;
  authority_valid: boolean;
  violations_valid: boolean;
  containment_valid: boolean;
  certification_valid: boolean;
  replay_valid: boolean;
  failures: readonly ProductionBoundaryFailure[];
  integrity_hash: string;
}>;

export type ProductionBoundaryEnforcementBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-boundary-enforcement/v15.6";
    upstream_phase: "canary-shadow-progressive-delivery/v15.5";
    lifecycle: readonly ProductionBoundaryLifecycleState[];
    failure_path: readonly ProductionBoundaryFailureState[];
    decisions: readonly ProductionBoundaryDecisionType[];
    severities: readonly ProductionBoundaryViolationSeverity[];
    certification_outcomes: readonly ProductionBoundaryOutcome[];
  }>;
  result: ProductionBoundaryEnforcementResult;
  validation: ProductionBoundaryEnforcementValidation;
}>;
