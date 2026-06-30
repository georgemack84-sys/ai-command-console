export type TruthLedgerCompletionDecisionState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type TruthLedgerVerificationState = "VERIFIED" | "WARNING" | "FAILED";
export type TruthLedgerSubsystem = "PERSISTENCE" | "EVIDENCE" | "LINEAGE" | "REPLAY" | "INTEGRITY" | "VISIBILITY";
export type TruthLedgerFuturePhase = "PHASE_7" | "PHASE_8" | "PHASE_9" | "PHASE_10" | "PHASE_11" | "PHASE_12" | "PHASE_13";

export type TruthLedgerReadinessCheck = Readonly<{
  check_id: string;
  subsystem: TruthLedgerSubsystem;
  name: string;
  state: TruthLedgerVerificationState;
  evidence_refs: readonly string[];
}>;

export type TruthLedgerRequirementVerification = Readonly<{
  requirement_id: string;
  requirement: "persistence operational" | "evidence retained" | "lineage reproducible" | "replay deterministic" | "integrity verified" | "visibility complete" | "tenant isolation enforced" | "certification suite passes";
  state: TruthLedgerVerificationState;
  evidence_refs: readonly string[];
}>;

export type TruthLedgerEcosystemDependency = Readonly<{
  phase: TruthLedgerFuturePhase;
  readiness_state: TruthLedgerVerificationState;
  checks: readonly Readonly<{ name: string; state: TruthLedgerVerificationState; evidence_refs: readonly string[] }>[];
}>;

export type TruthLedgerFinalReview = Readonly<{
  review_id: string;
  category: "PERSISTENCE" | "EVIDENCE" | "LINEAGE" | "REPLAY" | "INTEGRITY" | "VISIBILITY" | "ISOLATION";
  state: TruthLedgerVerificationState;
  summary: string;
  evidence_refs: readonly string[];
}>;

export type TruthLedgerCompletionDecision = Readonly<{
  decision_id: string;
  decision_state: TruthLedgerCompletionDecisionState;
  outcome: "Truth Ledger certified for production deployment." | "Truth Ledger may proceed with monitored restrictions." | "Phase 6 remains incomplete until remediation.";
  critical_findings: readonly string[];
  restrictions: readonly string[];
  generated_at: string;
}>;

export type Phase6CompletionReport = Readonly<{
  report_id: string;
  generated_at: string;
  decision_state: TruthLedgerCompletionDecisionState;
  readiness_checks: readonly TruthLedgerReadinessCheck[];
  requirements: readonly TruthLedgerRequirementVerification[];
  dependencies: readonly TruthLedgerEcosystemDependency[];
  reviews: readonly TruthLedgerFinalReview[];
  certification_suite_ref: string;
  historical_baseline_ref: string;
  phase_7_authorization_ref: string;
}>;

export type TruthLedgerCertificationRecord = Readonly<{
  record_id: string;
  phase: "6M";
  certification_suite_ref: string;
  completion_report_ref: string;
  decision_state: TruthLedgerCompletionDecisionState;
  appendOnly: true;
  mutationAllowed: false;
}>;

export type HistoricalTruthBaseline = Readonly<{
  baseline_id: string;
  ledger_version: string;
  schema_version: string;
  replay_hashes: readonly string[];
  integrity_hashes: readonly string[];
  certified_capabilities: readonly string[];
  generated_at: string;
}>;

export type Phase7AuthorizationPackage = Readonly<{
  authorization_id: string;
  authorized: boolean;
  phase: "PHASE_7";
  dependency_refs: readonly string[];
  restrictions: readonly string[];
  rationale: string;
}>;

export type TruthLedgerCompletionGateResult = Readonly<{
  completion_gate_id: string;
  tenant_id: string;
  mission_id: string;
  decision: TruthLedgerCompletionDecision;
  report: Phase6CompletionReport;
  certification_record: TruthLedgerCertificationRecord;
  readiness_assessment: readonly TruthLedgerReadinessCheck[];
  requirement_verifications: readonly TruthLedgerRequirementVerification[];
  ecosystem_dependencies: readonly TruthLedgerEcosystemDependency[];
  final_reviews: readonly TruthLedgerFinalReview[];
  historical_baseline: HistoricalTruthBaseline;
  phase_7_authorization: Phase7AuthorizationPackage;
  generated_at: string;
}>;

export type TruthLedgerCompletionGateView = Readonly<{
  result: TruthLedgerCompletionGateResult;
  guardrails: readonly string[];
  generated_at: string;
}>;
