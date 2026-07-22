import type { AdaptationProposalLedgerResult } from "@/types/adaptation-proposal-ledger";

export type ProposalLifecycleState =
  | "DRAFT"
  | "VALIDATED"
  | "REQUIRES_SIMULATION"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_OPERATOR_REVIEW"
  | "APPROVED_FOR_CERTIFICATION"
  | "CERTIFIED"
  | "REJECTED"
  | "SUPPRESSED"
  | "ROLLED_BACK"
  | "ARCHIVED";

export type ProposalLifecycleTransitionOutcome = "ACCEPTED" | "REJECTED_AUDITED";

export type ProposalLifecycleStateMachineState = "EVALUATED" | "FAIL_CLOSED";

export type ProposalLifecycleFailure =
  | "CURRENT_STATE_INVALID"
  | "DESTINATION_STATE_UNAUTHORIZED"
  | "TRANSITION_PREREQUISITES_INCOMPLETE"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "AUTHORITY_BOUNDARY_VIOLATED"
  | "REPLAY_VERIFICATION_FAILED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "DETERMINISTIC_TRANSITION_NOT_GUARANTEED"
  | "TENANT_ISOLATION_VIOLATED"
  | "LEDGER_HISTORY_UNAVAILABLE"
  | "ARCHIVED_PROPOSAL_REACTIVATION_ATTEMPT"
  | "REJECTED_PROPOSAL_REACTIVATION_ATTEMPT"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "OPERATOR_REVIEW_BYPASS_ATTEMPT"
  | "CERTIFICATION_BYPASS_ATTEMPT"
  | "LIFECYCLE_HISTORY_REWRITE_ATTEMPT"
  | "HISTORICAL_STATE_OVERWRITE_ATTEMPT"
  | "PROPOSAL_CONTENT_MUTATION_ATTEMPT"
  | "PRODUCTION_IMPLEMENTATION_AUTHORIZATION_ATTEMPT"
  | "AUTOMATIC_DEPLOYMENT_ATTEMPT";

export type ProposalLifecycleScenario =
  | "BASELINE"
  | "REJECTION_PATH"
  | "SUPPRESSION_PATH"
  | "ROLLBACK_PATH"
  | "INVALID_CURRENT_STATE"
  | "UNAUTHORIZED_DESTINATION"
  | "PREREQUISITES_INCOMPLETE"
  | "GOVERNANCE_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "AUTHORITY_VIOLATION"
  | "REPLAY_FAILURE"
  | "INTEGRITY_FAILURE"
  | "NONDETERMINISTIC_TRANSITION"
  | "TENANT_VIOLATION"
  | "LEDGER_UNAVAILABLE"
  | "ARCHIVED_REACTIVATION"
  | "REJECTED_REACTIVATION"
  | "GOVERNANCE_BYPASS"
  | "OPERATOR_REVIEW_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "HISTORY_REWRITE_ATTEMPT"
  | "STATE_OVERWRITE_ATTEMPT"
  | "PROPOSAL_MUTATION_ATTEMPT"
  | "IMPLEMENTATION_ATTEMPT"
  | "AUTOMATIC_DEPLOYMENT_ATTEMPT";

export type ProposalLifecycleTransition = Readonly<{
  transition_id: string;
  proposal_id: string;
  source_state: ProposalLifecycleState;
  destination_state: ProposalLifecycleState;
  transition_timestamp: string;
  transition_reason: string;
  initiating_component: string;
  approval_references: readonly string[];
  governance_references: readonly string[];
  replay_reference: string;
  ledger_reference: string;
  allowed_transition: boolean;
  prerequisites_satisfied: boolean;
  governance_validated: boolean;
  constitutional_validated: boolean;
  authority_validated: boolean;
  replay_verified: boolean;
  tenant_isolated: boolean;
  outcome: ProposalLifecycleTransitionOutcome;
  audit_event: boolean;
  advisory_only: true;
  modifies_proposal: false;
  authorizes_implementation: false;
  performs_deployment: false;
  integrity_hash: string;
}>;

export type ProposalLifecycleMetrics = Readonly<{
  proposals_by_state: Readonly<Record<ProposalLifecycleState, number>>;
  transition_frequency: Readonly<Record<string, number>>;
  transition_latency_ms: number;
  rejected_transitions: number;
  suppressed_proposals: number;
  certification_progression: number;
  rollback_frequency: number;
  archival_frequency: number;
  illegal_transition_attempts: number;
  replay_success_rate: number;
  lifecycle_validation_failures: readonly ProposalLifecycleFailure[];
  integrity_hash: string;
}>;

export type ProposalLifecycleApiSurface = Readonly<{
  api_id: string;
  evaluate_lifecycle: "POST /proposal-lifecycle-state-machine/evaluate";
  retrieve_transitions: "POST /proposal-lifecycle-state-machine/transitions";
  retrieve_states: "POST /proposal-lifecycle-state-machine/states";
  retrieve_metrics: "POST /proposal-lifecycle-state-machine/metrics";
  replay_lifecycle: "POST /proposal-lifecycle-state-machine/replay";
  inspect_lifecycle: "POST /proposal-lifecycle-state-machine/inspect";
  retrieve_contract: "GET /proposal-lifecycle-state-machine/contract";
  proposal_mutation_supported: false;
  governance_bypass_supported: false;
  certification_bypass_supported: false;
  implementation_authorization_supported: false;
  automatic_deployment_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type ProposalLifecycleInput = Readonly<{
  scenario?: ProposalLifecycleScenario;
  ledger_result?: AdaptationProposalLedgerResult;
}>;

export type ProposalLifecycleResult = Readonly<{
  proposal_lifecycle_state_machine_version: "proposal-lifecycle-state-machine/v1";
  transition_rule_version: "proposal-lifecycle-transition-rules/v1";
  api_surface: ProposalLifecycleApiSurface;
  ledger_result: AdaptationProposalLedgerResult;
  transitions: readonly ProposalLifecycleTransition[];
  current_states: Readonly<Record<string, ProposalLifecycleState>>;
  allowed_transitions: Readonly<Record<ProposalLifecycleState, readonly ProposalLifecycleState[]>>;
  metrics: ProposalLifecycleMetrics;
  state_machine_state: ProposalLifecycleStateMachineState;
  failures: readonly ProposalLifecycleFailure[];
  deterministic: true;
  replayable: boolean;
  lifecycle_history_immutable: boolean;
  tenant_isolated: boolean;
  governance_enforced: boolean;
  constitutional_enforced: boolean;
  authority_boundaries_enforced: boolean;
  advisory_only: true;
  modifies_proposals: false;
  rewrites_lifecycle_history: false;
  overwrites_historical_states: false;
  authorizes_implementation: false;
  performs_automatic_deployment: false;
  changes_production_behavior: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProposalLifecycleFoundation = Readonly<{
  proposal_lifecycle_state_machine_version: "proposal-lifecycle-state-machine/v1";
  canonical_states: readonly ProposalLifecycleState[];
  allowed_transitions: Readonly<Record<ProposalLifecycleState, readonly ProposalLifecycleState[]>>;
  api_surface: ProposalLifecycleApiSurface;
  result: ProposalLifecycleResult;
}>;
