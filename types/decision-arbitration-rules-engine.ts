import type { ConflictCategory } from "@/types/decision-conflict-detection-contract";
import type {
  ConflictClassificationEngineResult,
  ConflictClassificationRecord,
  ConflictClassificationReport,
} from "@/types/decision-conflict-classification-engine";

export type ArbitrationPriorityLevel =
  | "Constitution"
  | "Governance"
  | "Authority"
  | "Safety"
  | "Mission Success"
  | "Forecast"
  | "Optimization";

export type ArbitrationOutcome =
  | "RESOLVED"
  | "ESCALATE_TO_OPERATOR"
  | "ESCALATE_TO_GOVERNANCE"
  | "DEFER"
  | "REJECT"
  | "SPLIT_DECISION"
  | "REQUIRE_SIMULATION"
  | "REQUIRE_CERTIFICATION";

export type ArbitrationRule = Readonly<{
  rule_id: string;
  rule_name: string;
  rule_version: "arbitration-rule/v1";
  priority_level: ArbitrationPriorityLevel;
  evaluation_order: number;
  prerequisites: readonly string[];
  evaluation_logic: string;
  outcome_mapping: readonly ArbitrationOutcome[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  replay_requirements: readonly string[];
  integrity_hash: string;
}>;

export type ArbitrationResult = Readonly<{
  arbitration_id: string;
  conflict_id: string;
  classification_id: string;
  evaluated_candidates: readonly string[];
  rules_applied: readonly string[];
  resolution_priority_path: readonly ArbitrationPriorityLevel[];
  arbitration_outcome: ArbitrationOutcome;
  selected_candidate_refs: readonly string[];
  rejected_candidate_refs: readonly string[];
  escalation_required: boolean;
  governance_summary: string;
  constitutional_summary: string;
  operator_summary: string;
  tradeoff_metadata: readonly string[];
  advisory_only: true;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ArbitrationLedgerRecord = Readonly<{
  ledger_id: string;
  arbitration_id: string;
  conflict_id: string;
  classification_id: string;
  arbitration_outcome: ArbitrationOutcome;
  rules_applied: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  arbitration_timestamp: string;
  integrity_hash: string;
}>;

export type ArbitrationFailureReason =
  | "NO_CLASSIFICATIONS"
  | "MISSING_ARBITRATION_RULES"
  | "INVALID_PRIORITY_ORDERING"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_CONSTITUTIONAL_METADATA"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_HASH_MISMATCH"
  | "UNAUTHORIZED_RULE_EXECUTION"
  | "CROSS_TENANT_CONFLICT"
  | "INVALID_ESCALATION_PATH"
  | "UNSUPPORTED_ARBITRATION_OUTCOME"
  | "ADVISORY_ONLY_VIOLATION"
  | "ARBITRATION_LEDGER_FAILED";

export type ArbitrationValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ArbitrationFailureReason[];
  checks: Readonly<{
    rules_present: boolean;
    priority_order_valid: boolean;
    governance_valid: boolean;
    constitutional_valid: boolean;
    outcome_supported: boolean;
    escalation_valid: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type ArbitrationRulesEngineInput = Readonly<{
  classification_result?: ConflictClassificationEngineResult;
  classifications?: readonly ConflictClassificationRecord[];
  reports?: readonly ConflictClassificationReport[];
  rules?: readonly ArbitrationRule[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ArbitrationRulesEngineResult = Readonly<{
  arbitration_status: "PASS" | "FAIL";
  fail_closed: boolean;
  rules: readonly ArbitrationRule[];
  arbitrations: readonly ArbitrationResult[];
  validations: readonly ArbitrationValidation[];
  ledger_records: readonly ArbitrationLedgerRecord[];
  replay_hash: string;
  failures: readonly ArbitrationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ArbitrationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  arbitration_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ArbitrationFailureReason[];
  integrity_hash: string;
}>;

export type ArbitrationObservability = Readonly<{
  arbitrations_executed: number;
  outcomes_by_type: Readonly<Record<ArbitrationOutcome, number>>;
  rules_executed: number;
  operator_escalations: number;
  governance_escalations: number;
  simulation_requests: number;
  certification_requests: number;
  constitutional_rejections: number;
  governance_rejections: number;
  replay_success_rate: number;
  validation_failures: number;
  integrity_failures: number;
}>;

export type ArbitrationRulesEngineFoundation = Readonly<{
  engine_version: "arbitration-rules-engine/v1";
  priority_hierarchy: readonly ArbitrationPriorityLevel[];
  supported_outcomes: readonly ArbitrationOutcome[];
  result: ArbitrationRulesEngineResult;
  replay: ArbitrationReplay;
  observability: ArbitrationObservability;
}>;
