export type PersistentKnowledgeQualificationState = "REJECTED" | "INSUFFICIENT_EVIDENCE" | "PENDING_REVIEW" | "PENDING_OPERATOR" | "QUALIFIED" | "CERTIFIED";
export type PersistentKnowledgeCertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "REJECTED" | "REQUIRES_MORE_EVIDENCE" | "REQUIRES_GOVERNANCE_REVIEW" | "REQUIRES_OPERATOR_APPROVAL";
export type PersistentKnowledgeType = "OBSERVATION" | "CONCLUSION" | "RECOMMENDATION" | "STRATEGY" | "POLICY" | "PATTERN";
export type OperatorApprovalOutcome = "APPROVED" | "CONDITIONALLY_APPROVED" | "REJECTED" | "REQUIRES_MORE_EVIDENCE" | "ESCALATED";
export type DuplicateStatus = "UNIQUE" | "DUPLICATE_CONSOLIDATED" | "SUPERSEDED" | "CONFLICT_REQUIRES_REVIEW";
export type PersistentKnowledgeQualificationFailure =
  | "FOUNDATION_NOT_CERTIFIED"
  | "QUALIFICATION_CONTRACT_INVALID"
  | "INSUFFICIENT_EVIDENCE"
  | "OVERCONFIDENCE_DETECTED"
  | "TRUST_THRESHOLD_NOT_MET"
  | "REPLAY_DIVERGENCE"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "CONSTITUTIONAL_VIOLATION"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "DUPLICATE_NOT_CONSOLIDATED"
  | "LINEAGE_INCOMPLETE"
  | "TENANT_ISOLATION_BREACH"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "ADVISORY_ONLY_VIOLATION"
  | "LEDGER_MUTATION"
  | "INTEGRITY_HASH_MISMATCH";
export type PersistentKnowledgeQualificationScenario = "BASELINE" | PersistentKnowledgeQualificationFailure;

export type PersistentKnowledgeCandidate = Readonly<{
  knowledge_id: string;
  tenant_id: string;
  mission_scope: string;
  knowledge_type: PersistentKnowledgeType;
  knowledge_version: string;
  summary: string;
  deterministic_origin: boolean;
  advisory_only: boolean;
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationContract = Readonly<{
  contract_id: string;
  lifecycle: readonly ("KNOWLEDGE_CANDIDATE" | "EVIDENCE_QUALIFICATION" | "CONFIDENCE_QUALIFICATION" | "TRUST_QUALIFICATION" | "REPLAY_QUALIFICATION" | "GOVERNANCE_QUALIFICATION" | "CONSTITUTIONAL_QUALIFICATION" | "DUPLICATE_CONSOLIDATION" | "OPERATOR_APPROVAL" | "CERTIFICATION" | "PERSISTENT_KNOWLEDGE")[];
  states: readonly PersistentKnowledgeQualificationState[];
  evidence_gate_required: boolean;
  confidence_gate_required: boolean;
  trust_gate_required: boolean;
  replay_gate_required: boolean;
  governance_gate_required: boolean;
  constitutional_gate_required: boolean;
  duplicate_consolidation_required: boolean;
  operator_approval_required: boolean;
  persistence_without_certification_supported: false;
  integrity_hash: string;
}>;

export type QualificationReport = Readonly<{
  report_id: string;
  score: number;
  passed: boolean;
  findings: readonly string[];
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceQualificationReport = QualificationReport & Readonly<{
  decision: "APPROVED" | "REJECTED" | "REVIEW_REQUIRED";
  policy_refs: readonly string[];
}>;

export type ConstitutionalQualificationReport = QualificationReport & Readonly<{
  qualification: "COMPLIANT" | "VIOLATION";
  invariant_refs: readonly string[];
}>;

export type OperatorApprovalRecord = Readonly<{
  approval_id: string;
  required: boolean;
  outcome: OperatorApprovalOutcome;
  approved_by: string;
  explanation: string;
  evidence_inspected: readonly string[];
  immutable_audit: boolean;
  integrity_hash: string;
}>;

export type DuplicateConsolidationReport = Readonly<{
  consolidation_id: string;
  duplicate_status: DuplicateStatus;
  duplicates_detected: number;
  deterministic_merge: boolean;
  lineage_preserved: boolean;
  consolidated_version_id: string;
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationRecord = Readonly<{
  qualification_id: string;
  knowledge_id: string;
  tenant_id: string;
  mission_scope: string;
  knowledge_type: PersistentKnowledgeType;
  knowledge_version: string;
  qualification_state: PersistentKnowledgeQualificationState;
  evidence_score: number;
  confidence_score: number;
  trust_score: number;
  replay_score: number;
  governance_score: number;
  constitutional_score: number;
  operator_status: OperatorApprovalOutcome;
  duplicate_status: DuplicateStatus;
  certification_status: PersistentKnowledgeCertificationOutcome;
  qualification_timestamp: string;
  qualified_by: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: string;
  qualification_id: string;
  knowledge_id: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: PersistentKnowledgeQualificationFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationObservability = Readonly<{
  observability_id: string;
  throughput_per_hour: number;
  qualification_latency_ms: number;
  evidence_quality_trend: readonly number[];
  confidence_distribution: readonly number[];
  trust_distribution: readonly number[];
  replay_failures: number;
  governance_rejection_rate: number;
  constitutional_violations: number;
  operator_approval_latency_ms: number;
  duplicate_detection_rate: number;
  consolidation_success_rate: number;
  certification_success_rate: number;
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationCertification = Readonly<{
  certification_id: string;
  outcome: PersistentKnowledgeCertificationOutcome;
  eligible_for_persistence: boolean;
  failures: readonly PersistentKnowledgeQualificationFailure[];
  tests: readonly PersistentKnowledgeQualificationTest[];
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationInput = Readonly<{
  scenario?: PersistentKnowledgeQualificationScenario;
  tenant_id?: string;
  mission_scope?: string;
  knowledge_type?: PersistentKnowledgeType;
}>;

export type PersistentKnowledgeQualificationResult = Readonly<{
  qualification_version: "persistent-knowledge-qualification/v11.2";
  qualification_identifier: "PersistentKnowledgeQualification";
  foundation_certified: boolean;
  candidate: PersistentKnowledgeCandidate;
  contract: PersistentKnowledgeQualificationContract;
  evidence: QualificationReport;
  confidence: QualificationReport;
  trust: QualificationReport;
  replay: QualificationReport;
  governance: GovernanceQualificationReport;
  constitutional: ConstitutionalQualificationReport;
  duplicate_consolidation: DuplicateConsolidationReport;
  operator_approval: OperatorApprovalRecord;
  record: PersistentKnowledgeQualificationRecord;
  ledger: readonly PersistentKnowledgeQualificationLedgerEntry[];
  observability: PersistentKnowledgeQualificationObservability;
  certification: PersistentKnowledgeQualificationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type PersistentKnowledgeQualificationValidation = Readonly<{
  qualification_id: string | null;
  valid: boolean;
  outcome: PersistentKnowledgeCertificationOutcome;
  eligible_for_persistence: boolean;
  failures: readonly PersistentKnowledgeQualificationFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type PersistentKnowledgeQualificationContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "persistent-knowledge-qualification/v11.2";
    no_persistence_without_successful_qualification: true;
    qualification_states: readonly PersistentKnowledgeQualificationState[];
    certification_outcomes: readonly PersistentKnowledgeCertificationOutcome[];
    mandatory_human_authority: true;
  }>;
  result: PersistentKnowledgeQualificationResult;
  validation: PersistentKnowledgeQualificationValidation;
  observability: PersistentKnowledgeQualificationObservability;
}>;
