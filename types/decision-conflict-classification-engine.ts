import type {
  ConflictCategory,
  ConflictRecord,
  ConflictSeverity,
} from "@/types/decision-conflict-detection-contract";
import type { ConflictDetectionEngineResult } from "@/types/decision-conflict-detection-engine";

export type ConflictClassificationImpact = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "BLOCKING";

export type ConflictClassificationRecord = Readonly<{
  classification_id: string;
  conflict_id: string;
  primary_category: ConflictCategory;
  secondary_categories: readonly ConflictCategory[];
  severity: ConflictSeverity;
  severity_score: number;
  severity_reason: string;
  governance_impact: ConflictClassificationImpact;
  constitutional_impact: ConflictClassificationImpact;
  operator_visibility: "STANDARD" | "RECOMMENDED" | "REQUIRED";
  escalation_required: boolean;
  arbitration_ready: boolean;
  advisory_only: true;
  replay_ref: string;
  lineage_ref: string;
  integrity_hash: string;
}>;

export type ConflictClassificationReport = Readonly<{
  report_id: string;
  classification_id: string;
  conflict_id: string;
  originating_decisions: readonly string[];
  primary_category: ConflictCategory;
  secondary_categories: readonly ConflictCategory[];
  severity: ConflictSeverity;
  severity_rationale: string;
  evidence_summary: string;
  governance_summary: string;
  constitutional_evaluation: string;
  escalation_recommendation: string;
  replay_ref: string;
  integrity_verified: boolean;
  integrity_hash: string;
}>;

export type ConflictClassificationLedgerRecord = Readonly<{
  ledger_id: string;
  classification_id: string;
  conflict_id: string;
  primary_category: ConflictCategory;
  severity: ConflictSeverity;
  escalation_required: boolean;
  replay_ref: string;
  lineage_ref: string;
  classification_timestamp: string;
  integrity_hash: string;
}>;

export type ConflictClassificationFailureReason =
  | "NO_CONFLICTS"
  | "UNAUTHORIZED_COMPONENT"
  | "INVALID_PRIMARY_CATEGORY"
  | "CONFLICTING_PRIMARY_CLASSIFICATIONS"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_CONSTITUTIONAL_METADATA"
  | "INVALID_SEVERITY"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_HASH_MISMATCH"
  | "TENANT_BOUNDARY_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "CLASSIFICATION_LEDGER_FAILED";

export type ConflictClassificationValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly ConflictClassificationFailureReason[];
  checks: Readonly<{
    category_valid: boolean;
    severity_valid: boolean;
    governance_valid: boolean;
    constitutional_valid: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    tenant_isolated: boolean;
    advisory_only: boolean;
  }>;
}>;

export type ConflictClassificationEngineInput = Readonly<{
  conflicts?: readonly ConflictRecord[];
  detection_result?: ConflictDetectionEngineResult;
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type ConflictClassificationEngineResult = Readonly<{
  classification_status: "PASS" | "FAIL";
  fail_closed: boolean;
  classifications: readonly ConflictClassificationRecord[];
  reports: readonly ConflictClassificationReport[];
  validations: readonly ConflictClassificationValidation[];
  ledger_records: readonly ConflictClassificationLedgerRecord[];
  replay_hash: string;
  failures: readonly ConflictClassificationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ConflictClassificationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  conflict_refs: readonly string[];
  classification_refs: readonly string[];
  report_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly ConflictClassificationFailureReason[];
  integrity_hash: string;
}>;

export type ConflictClassificationObservability = Readonly<{
  conflicts_classified: number;
  classifications_by_category: Readonly<Record<ConflictCategory, number>>;
  classifications_by_severity: Readonly<Record<ConflictSeverity, number>>;
  constitutional_conflicts: number;
  governance_conflicts: number;
  authority_conflicts: number;
  tenant_conflicts: number;
  certification_conflicts: number;
  replay_success_rate: number;
  validation_failures: number;
  integrity_failures: number;
}>;

export type ConflictClassificationEngineFoundation = Readonly<{
  engine_version: "conflict-classification-engine/v1";
  category_priority: readonly ConflictCategory[];
  result: ConflictClassificationEngineResult;
  replay: ConflictClassificationReplay;
  observability: ConflictClassificationObservability;
}>;
