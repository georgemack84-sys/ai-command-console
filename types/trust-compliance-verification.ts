export type TrustComplianceOutcome = "PASS" | "FAIL" | "REQUIRES_GOVERNANCE_REVIEW";
export type ComplianceCategory = "CONSTITUTIONAL" | "POLICY" | "AUTHORITY" | "GOVERNANCE" | "TRUST" | "ALIGNMENT";
export type ComplianceStatus = "COMPLIANT" | "NON_COMPLIANT" | "REQUIRES_REVIEW" | "FAIL_CLOSED";
export type ComplianceFindingKind = "CONSTITUTIONAL_FINDING" | "POLICY_FINDING" | "AUTHORITY_FINDING" | "GOVERNANCE_FINDING" | "TRUST_FINDING" | "ALIGNMENT_FINDING";

export type TrustComplianceFailure =
  | "P5_7_TRUST_EVALUATION_INVALID"
  | "P5_8_ALIGNMENT_VERIFICATION_INVALID"
  | "CONSTITUTIONAL_COMPLIANCE_ENGINE_MISSING"
  | "POLICY_COMPLIANCE_ENGINE_MISSING"
  | "AUTHORITY_COMPLIANCE_ENGINE_MISSING"
  | "COMPLIANCE_RULE_REGISTRY_MISSING"
  | "COMPLIANCE_EVIDENCE_REGISTRY_MISSING"
  | "COMPLIANCE_REPORT_MISSING"
  | "CONSTITUTIONAL_VIOLATION_UNDETECTED"
  | "POLICY_VIOLATION_UNDETECTED"
  | "AUTHORITY_VIOLATION_UNDETECTED"
  | "GOVERNANCE_INHERITANCE_INVALID"
  | "CONSTITUTIONAL_INHERITANCE_INVALID"
  | "AUTHORITY_GATE_NOT_VALIDATED"
  | "POLICY_GATE_NOT_VALIDATED"
  | "COMPLIANCE_NONDETERMINISTIC"
  | "REPLAY_INVALID"
  | "FINDING_NOT_EXPLAINABLE"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "GOVERNING_ARTIFACT_REFS_MISSING"
  | "TENANT_ISOLATION_INVALID"
  | "MISSING_EVIDENCE_NOT_FAIL_CLOSED"
  | "CONFLICTING_EVIDENCE_NOT_FAIL_CLOSED"
  | "STALE_EVIDENCE_NOT_FAIL_CLOSED"
  | "UNVERIFIABLE_EVIDENCE_NOT_FAIL_CLOSED"
  | "CONSTITUTIONAL_POLICY_CREATED"
  | "GOVERNANCE_ACTION_EXECUTED"
  | "AUTHORITY_DECISION_MADE"
  | "POLICY_ENFORCEMENT_EXECUTED"
  | "QUALIFICATION_DECISION_MADE"
  | "GOVERNANCE_REVIEW_REQUIRED";

export type TrustComplianceScenario = "BASELINE" | TrustComplianceFailure;
export type TrustComplianceInput = Readonly<{ scenario?: TrustComplianceScenario; tenant_id?: string; artifact_id?: string }>;
export type ComplianceRuleRegistry = Readonly<{ registry_id: string; categories: readonly ComplianceCategory[]; constitutional_rules: readonly string[]; governance_rules: readonly string[]; authority_rules: readonly string[]; policy_rules: readonly string[]; inheritance_rules: readonly string[]; deterministic: boolean; complete: boolean; integrity_hash: string }>;
export type ComplianceFinding = Readonly<{ finding_id: string; finding_kind: ComplianceFindingKind; category: ComplianceCategory; status: ComplianceStatus; governing_rule_ref: string; evidence_refs: readonly string[]; violation_refs: readonly string[]; explanation: string; tenant_id: string; integrity_hash: string }>;
export type ComplianceEngineResult = Readonly<{ engine_id: string; category: ComplianceCategory; status: ComplianceStatus; findings: readonly ComplianceFinding[]; violations_detected: boolean; evidence_refs: readonly string[]; deterministic: boolean; integrity_hash: string }>;
export type ComplianceEvidenceRegistry = Readonly<{ registry_id: string; evidence_refs: readonly string[]; lineage_refs: readonly string[]; rule_refs: readonly string[]; policy_refs: readonly string[]; constitutional_refs: readonly string[]; authority_refs: readonly string[]; operational: boolean; complete: boolean; integrity_hash: string }>;
export type ComplianceReport = Readonly<{ report_id: string; constitutional_status: ComplianceStatus; policy_status: ComplianceStatus; authority_status: ComplianceStatus; violations: readonly string[]; recommendations: readonly string[]; evidence_refs: readonly string[]; explainable: boolean; deterministic: boolean; integrity_hash: string }>;
export type ComplianceReplayValidation = Readonly<{ replay_id: string; deterministic_evaluation: boolean; identical_findings: boolean; identical_evidence: boolean; identical_policy_selection: boolean; reproducible: boolean; integrity_hash: string }>;
export type ComplianceObservability = Readonly<{ dashboard_id: string; metrics: readonly string[]; monitors_execution: boolean; monitors_latency: boolean; monitors_violations: boolean; monitors_replay_integrity: boolean; monitors_evidence_completeness: boolean; integrity_hash: string }>;
export type ComplianceBoundary = Readonly<{ creates_constitutional_policy: boolean; executes_governance_actions: boolean; makes_authority_decisions: boolean; executes_policy_enforcement: boolean; makes_qualification_decisions: boolean; integrity_hash: string }>;
export type TrustComplianceCertification = Readonly<{ certification_id: string; outcome: TrustComplianceOutcome; phase_ready: boolean; constitutional_engine_implemented: boolean; policy_engine_implemented: boolean; authority_engine_implemented: boolean; rule_registry_complete: boolean; evidence_registry_operational: boolean; reports_deterministic: boolean; replayable: boolean; inheritance_verified: boolean; explainable_lineage_complete: boolean; fail_closed_enforced: boolean; tenant_isolated_constitutional: boolean; boundary_respected: boolean; failures: readonly TrustComplianceFailure[]; integrity_hash: string }>;
export type TrustComplianceResult = Readonly<{ phase_version: "trust-compliance-verification/v5.9"; phase_identifier: "TrustComplianceVerification"; trust_evaluation_engine_ref: "trust-evaluation-engine/v5.7"; alignment_verification_ref: "trust-alignment-verification/v5.8"; rules: ComplianceRuleRegistry; constitutional: ComplianceEngineResult; policy: ComplianceEngineResult; authority: ComplianceEngineResult; evidence: ComplianceEvidenceRegistry; report: ComplianceReport; replay: ComplianceReplayValidation; observability: ComplianceObservability; boundary: ComplianceBoundary; certification: TrustComplianceCertification; replay_hash: string; integrity_hash: string }>;
export type TrustComplianceValidation = Readonly<{ valid: boolean; outcome: TrustComplianceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; rules_valid: boolean; constitutional_valid: boolean; policy_valid: boolean; authority_valid: boolean; evidence_valid: boolean; report_valid: boolean; replay_valid: boolean; observability_valid: boolean; boundary_valid: boolean; certification_valid: boolean; failures: readonly TrustComplianceFailure[]; integrity_hash: string }>;
export type TrustComplianceBundle = Readonly<{ doctrine: Readonly<{ version: "trust-compliance-verification/v5.9"; owns_constitutional_compliance: true; owns_policy_compliance: true; owns_authority_compliance: true; owns_compliance_evidence: true; owns_compliance_reporting: true; creates_constitutional_policy: false; executes_governance_actions: false; makes_authority_decisions: false; executes_policy_enforcement: false; makes_qualification_decisions: false }>; result: TrustComplianceResult; validation: TrustComplianceValidation }>;
