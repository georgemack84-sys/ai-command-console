import type { DecisionAuthorityInput } from "@/types/decision-authority-boundary";
import type { DecisionComplianceInput } from "@/types/decision-compliance";
import type { DecisionContract } from "@/types/decision-contract";
import type { DecisionIntegrityInput } from "@/types/decision-integrity";
import type { DecisionLifecycleTransitionInput } from "@/types/decision-lifecycle";
import type { ReplayLineageInput } from "@/types/decision-replay-lineage";
import type { DecisionOrchestrationRecord } from "@/types/decision-schema";

export type DecisionValidationDomain =
  | "SCHEMA"
  | "LIFECYCLE"
  | "GOVERNANCE"
  | "CONSTITUTION"
  | "AUTHORITY"
  | "REPLAY"
  | "LINEAGE"
  | "INTEGRITY";

export type DecisionValidationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type DecisionValidationErrorClass =
  | "SCHEMA_ERROR"
  | "LIFECYCLE_ERROR"
  | "GOVERNANCE_ERROR"
  | "CONSTITUTION_ERROR"
  | "AUTHORITY_ERROR"
  | "REPLAY_ERROR"
  | "LINEAGE_ERROR"
  | "INTEGRITY_ERROR"
  | "SERIALIZATION_ERROR"
  | "VERSION_ERROR"
  | "TENANT_ERROR"
  | "UNKNOWN_ERROR";

export type DecisionValidationSeverity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export type DecisionValidationFailure = Readonly<{
  validation_domain: DecisionValidationDomain;
  error_class: DecisionValidationErrorClass;
  severity: DecisionValidationSeverity;
  reason: string;
  fail_closed: true;
}>;

export type ValidationRuleRecord = Readonly<{
  validation_rule_id: string;
  validation_domain: DecisionValidationDomain;
  rule_name: string;
  rule_description: string;
  severity: DecisionValidationSeverity;
  evaluation_order: number;
  fail_closed: true;
  replay_supported: true;
  version: "decision-validation-rule/v1";
  created_at: string;
}>;

export type DomainValidationResult = Readonly<{
  validation_domain: DecisionValidationDomain;
  validation_result: DecisionValidationState;
  evaluation_order: number;
  rule_ids: readonly string[];
  warnings: readonly string[];
  failures: readonly DecisionValidationFailure[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type ValidationMetadata = Readonly<{
  validation_id: string;
  orchestration_id: string;
  validation_version: "decision-validation-engine/v1";
  validator_version: "9.1.9";
  validation_duration: number;
  deterministic_hash: string;
  replay_reference: string;
  validation_status: DecisionValidationState;
  created_at: string;
}>;

export type ValidationEvidencePackage = Readonly<{
  evidence_package_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  validation_sequence: readonly DecisionValidationDomain[];
  rule_ids: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type ValidationReport = Readonly<{
  validation_report_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  validation_result: DecisionValidationState;
  schema_result: DomainValidationResult;
  lifecycle_result: DomainValidationResult;
  governance_result: DomainValidationResult;
  constitutional_result: DomainValidationResult;
  authority_result: DomainValidationResult;
  replay_result: DomainValidationResult;
  lineage_result: DomainValidationResult;
  integrity_result: DomainValidationResult;
  warnings: readonly string[];
  failures: readonly DecisionValidationFailure[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  evidence_package: ValidationEvidencePackage;
  metadata: ValidationMetadata;
  advisory_only: true;
  integrity_hash: string;
  validated_at: string;
}>;

export type ValidationReplayResult = Readonly<{
  validation_report_id: string;
  replay_valid: boolean;
  reconstructed_result: DecisionValidationState;
  reconstructed_sequence: readonly DecisionValidationDomain[];
  reconstructed_failures: readonly DecisionValidationFailure[];
  reconstructed_hash: string;
  expected_hash: string;
}>;

export type DecisionValidationScenario =
  | "BASELINE"
  | "CONDITIONAL_WARNING"
  | "SCHEMA_INVALID"
  | "LIFECYCLE_INVALID"
  | "GOVERNANCE_MISSING"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_ESCALATION"
  | "REPLAY_INCONSISTENCY"
  | "LINEAGE_CORRUPTION"
  | "INTEGRITY_MISMATCH"
  | "UNSUPPORTED_VERSION"
  | "TENANT_VIOLATION";

export type DecisionValidationInput = Readonly<{
  contract?: DecisionContract;
  orchestration_record?: DecisionOrchestrationRecord;
  scenario?: DecisionValidationScenario;
  lifecycle_transition?: DecisionLifecycleTransitionInput;
  authority_input?: DecisionAuthorityInput;
  compliance_input?: DecisionComplianceInput;
  replay_input?: ReplayLineageInput;
  integrity_input?: DecisionIntegrityInput;
}>;

export type DecisionValidationObservability = Readonly<{
  validation_requests: number;
  validation_duration_ms: number;
  pass_rate: number;
  conditional_pass_rate: number;
  failure_rate: number;
  validation_domain_failures: Readonly<Record<DecisionValidationDomain, number>>;
  error_classifications: Readonly<Record<DecisionValidationErrorClass, number>>;
  replay_mismatches: number;
  validation_throughput: number;
  deterministic_replay_success_rate: number;
}>;
