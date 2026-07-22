import type { DecisionContext, DecisionContextDomainName } from "@/types/decision-context-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { ContextCompletenessGapPackage } from "@/types/decision-context-completeness-gap";

export type ContextAssuranceState = "UNVALIDATED" | "VALIDATING" | "VALID" | "CERTIFIED" | "INVALID" | "REJECTED" | "FAIL_CLOSED";

export type ContextAssuranceFailureReason =
  | "INTEGRITY_HASH_MISMATCH"
  | "SCHEMA_VALIDATION_FAILED"
  | "RESOLVER_INCONSISTENCY_DETECTED"
  | "SOURCE_ATTRIBUTION_INCOMPLETE"
  | "EXPLAINABILITY_INCOMPLETE"
  | "REPLAY_VALIDATION_FAILED"
  | "GOVERNANCE_VALIDATION_INCOMPLETE"
  | "CONSTITUTIONAL_VALIDATION_INCOMPLETE"
  | "CROSS_TENANT_REFERENCE_DETECTED"
  | "ADVISORY_ONLY_VIOLATION";

export type ContextValidation = Readonly<{
  validation_id: string;
  decision_candidate_id: string;
  schema_validation: "PASS" | "FAIL";
  integrity_validation: "PASS" | "FAIL";
  resolver_validation: "PASS" | "FAIL";
  attribution_validation: "PASS" | "FAIL";
  explainability_validation: "PASS" | "FAIL";
  replay_validation: "PASS" | "FAIL";
  validation_state: ContextAssuranceState;
  validation_timestamp: string;
  integrity_hash: string;
}>;

export type ContextIntegrity = Readonly<{
  integrity_id: string;
  decision_candidate_id: string;
  context_hash: string;
  domain_hashes: Readonly<Record<DecisionContextDomainName, string>>;
  resolver_hashes: Readonly<Record<string, string>>;
  lineage_hash: string;
  replay_hash: string;
  validation_hash: string;
  integrity_state: "VALID" | "INVALID";
  integrity_hash: string;
}>;

export type ContextExplanation = Readonly<{
  explanation_id: string;
  decision_candidate_id: string;
  mission_explanation: string;
  authority_explanation: string;
  evidence_explanation: string;
  dependency_explanation: string;
  risk_explanation: string;
  confidence_explanation: string;
  governance_explanation: string;
  constitutional_explanation: string;
  runtime_explanation: string;
  recovery_explanation: string;
  forecast_explanation: string;
  historical_explanation: string;
  replay_explanation: string;
  validation_summary: string;
  integrity_hash: string;
}>;

export type ContextValidationEvidence = Readonly<{
  evidence_id: string;
  validation_id: string;
  schema_evidence: readonly string[];
  integrity_evidence: readonly string[];
  resolver_evidence: readonly string[];
  attribution_evidence: readonly string[];
  explainability_evidence: readonly string[];
  replay_evidence: readonly string[];
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type ContextIntegrityValidationRequest = Readonly<{
  validation_id: string;
  candidate: DecisionCandidate;
  decision_context?: DecisionContext;
  completeness_package?: ContextCompletenessGapPackage;
  framework_version: "context-integrity-validation-explainability/v1";
}>;

export type ContextIntegrityValidationReport = Readonly<{
  validation_id: string;
  candidate_id: string;
  context_validation: ContextValidation;
  context_integrity: ContextIntegrity;
  context_explanation: ContextExplanation;
  validation_evidence: ContextValidationEvidence;
  failure_reason?: ContextAssuranceFailureReason;
  failure_reasons: readonly ContextAssuranceFailureReason[];
  checks: Readonly<{
    schema_compliant: boolean;
    integrity_reproducible: boolean;
    resolvers_consistent: boolean;
    source_attribution_complete: boolean;
    explainability_complete: boolean;
    replay_valid: boolean;
    governance_complete: boolean;
    constitutional_complete: boolean;
    tenant_isolated: boolean;
    advisory_only: boolean;
  }>;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type ContextIntegrityValidationReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  validation_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: ContextAssuranceState;
  failures: readonly ContextAssuranceFailureReason[];
  integrity_hash: string;
}>;

export type ContextIntegrityValidationObservability = Readonly<{
  validation_attempts: number;
  certified_contexts: number;
  failed_contexts: number;
  schema_failures: number;
  integrity_failures: number;
  resolver_failures: number;
  attribution_failures: number;
  explainability_failures: number;
  replay_failures: number;
  isolation_failures: number;
  replay_success_rate: number;
}>;
