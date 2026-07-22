import type { ReplayDifferenceDetectorResult } from "@/types/decision-replay-difference-detector";

export type DecisionAuditState = "CREATED" | "COLLECTING_EVIDENCE" | "GENERATING_REPORT" | "VALIDATING" | "CERTIFICATION_READY" | "COMMITTED" | "ARCHIVED" | "REJECTED";
export type ComplianceOutcome = "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW" | "BLOCKED";

export type DecisionAuditFailure =
  | "AUDIT_REPORT_INCOMPLETE"
  | "EVIDENCE_MISSING"
  | "GOVERNANCE_DOCUMENTATION_MISSING"
  | "CONSTITUTIONAL_DOCUMENTATION_MISSING"
  | "REPLAY_VERIFICATION_MISSING"
  | "INTEGRITY_VERIFICATION_MISSING"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_MISMATCH"
  | "TENANT_MISMATCH"
  | "UNSUPPORTED_SCHEMA"
  | "REPORT_GENERATION_FAILURE"
  | "AUDIT_VALIDATION_FAILURE";

export type AuditSection = Readonly<{
  section_id: string;
  section_type:
    | "ORCHESTRATION_SUMMARY"
    | "CONSIDERED_DECISIONS"
    | "REJECTED_DECISIONS"
    | "EVIDENCE_SUMMARY"
    | "GOVERNANCE_VALIDATION"
    | "CONSTITUTIONAL_VALIDATION"
    | "PRIORITY_EXPLANATION"
    | "CONFLICT_RESOLUTION"
    | "OPERATOR_ACTIONS"
    | "FINAL_OUTCOME"
    | "REPLAY_VERIFICATION"
    | "INTEGRITY_VERIFICATION";
  summary: string;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type ComplianceSummary = Readonly<{
  compliance_id: string;
  audit_id: string;
  governance_status: ComplianceOutcome;
  constitutional_status: ComplianceOutcome;
  authority_status: ComplianceOutcome;
  replay_status: ComplianceOutcome;
  integrity_status: ComplianceOutcome;
  certification_status: ComplianceOutcome;
  overall_compliance: ComplianceOutcome;
  supporting_evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type CertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  audit_id: string;
  orchestration_refs: readonly string[];
  replay_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  operator_refs: readonly string[];
  integrity_refs: readonly string[];
  lineage_refs: readonly string[];
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type DecisionAuditPackage = Readonly<{
  orchestration_summary: AuditSection;
  considered_decisions: AuditSection;
  rejected_decisions: AuditSection;
  evidence_summary: AuditSection;
  governance_validation: AuditSection;
  constitutional_validation: AuditSection;
  priority_explanation: AuditSection;
  conflict_resolution: AuditSection;
  operator_actions: AuditSection;
  final_outcome: AuditSection;
  replay_verification: AuditSection;
  integrity_verification: AuditSection;
  compliance_summary: ComplianceSummary;
  certification_evidence: CertificationEvidencePackage;
  integrity_hash: string;
}>;

export type DecisionAuditRecord = Readonly<{
  audit_id: string;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  audit_version: "decision-audit-engine/v1";
  schema_version: "decision-audit-schema/v1";
  audit_state: DecisionAuditState;
  orchestration_summary_ref: string;
  considered_decisions_ref: string;
  rejected_decisions_ref: string;
  evidence_summary_ref: string;
  governance_summary_ref: string;
  constitutional_summary_ref: string;
  priority_summary_ref: string;
  conflict_summary_ref: string;
  operator_summary_ref: string;
  final_outcome_ref: string;
  replay_summary_ref: string;
  integrity_summary_ref: string;
  compliance_summary_ref: string;
  certification_evidence_ref: string;
  lineage_refs: readonly string[];
  validation_status: "VALID" | "BLOCKED";
  integrity_hash: string;
}>;

export type DecisionAuditValidation = Readonly<{
  validation_id: string;
  audit_id: string;
  validation_status: "VALID" | "BLOCKED";
  report_complete: boolean;
  evidence_traceable: boolean;
  lineage_complete: boolean;
  governance_documented: boolean;
  constitutional_documented: boolean;
  replay_verified: boolean;
  integrity_verified: boolean;
  certification_evidence_complete: boolean;
  tenant_ownership_valid: boolean;
  certification_ready: boolean;
  failures: readonly DecisionAuditFailure[];
  integrity_hash: string;
}>;

export type DecisionAuditLedgerEntry = Readonly<{
  ledger_entry_id: string;
  audit_id: string;
  sequence: number;
  audit_record_hash: string;
  package_hash: string;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type DecisionAuditEngineResult = Readonly<{
  audit_engine_version: "decision-audit-engine/v1";
  replay_difference_result: ReplayDifferenceDetectorResult;
  audit_package: DecisionAuditPackage;
  audit_record: DecisionAuditRecord;
  validation: DecisionAuditValidation;
  ledger: readonly DecisionAuditLedgerEntry[];
  compliance_summary: ComplianceSummary;
  certification_evidence: CertificationEvidencePackage;
  deterministic: true;
  advisory_only: true;
  mutates_orchestration_outcomes: false;
  certification_ready: boolean;
  integrity_hash: string;
}>;

export type DecisionAuditEngineFoundation = Readonly<{
  audit_engine_version: "decision-audit-engine/v1";
  audit_states: readonly DecisionAuditState[];
  terminal_states: readonly DecisionAuditState[];
  result: DecisionAuditEngineResult;
}>;
