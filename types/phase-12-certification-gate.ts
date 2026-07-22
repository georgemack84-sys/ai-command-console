export type Phase12CertificationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type Phase12CertificationFailure =
  | "CONTRACT_INVALID"
  | "DETERMINISM_FAILURE"
  | "CONSTITUTIONAL_FAILURE"
  | "GOVERNANCE_FAILURE"
  | "AUTHORITY_FAILURE"
  | "POLICY_FAILURE"
  | "ARTIFACT_FAILURE"
  | "LIFECYCLE_FAILURE"
  | "RECOMMENDATION_FAILURE"
  | "OBSERVATION_FAILURE"
  | "REPLAY_FAILURE"
  | "LINEAGE_FAILURE"
  | "INTEGRITY_FAILURE"
  | "EXPLAINABILITY_FAILURE"
  | "SECURITY_FAILURE"
  | "TENANT_FAILURE"
  | "OPERATIONS_FAILURE"
  | "LEDGER_FAILURE"
  | "PRODUCTION_READINESS_FAILURE";
export type Phase12CertificationScenario = "BASELINE" | Phase12CertificationFailure;
export type Phase12CertificationInput = Readonly<{ scenario?: Phase12CertificationScenario; tenant_id?: string }>;

export type Phase12CertificationContract = Readonly<{ contract_id: string; scope: "Strategic Recommendation Intelligence"; authority: "final constitutional certification authority"; lifecycle: "REQUESTED" | "EVIDENCE_BOUND" | "TESTED" | "DECIDED" | "LEDGERED" | "MONITORED"; evidence_required: boolean; replay_required: boolean; production_promotion_requires_pass: true; integrity_hash: string }>;
export type CertificationTestDefinition = Readonly<{ test_id: string; category: string; name: string; expected: "PASS"; critical: boolean; integrity_hash: string }>;
export type CertificationTestRegistry = Readonly<{ registry_id: string; tests: readonly CertificationTestDefinition[]; complete: boolean; categories: readonly string[]; integrity_hash: string }>;
export type CertificationEvidenceRecord = Readonly<{ evidence_id: string; source_phase: string; artifact_ref: string; evidence_type: string; replay_ref: string; integrity_ref: string; accepted: boolean; integrity_hash: string }>;
export type CertificationEvidenceRegistry = Readonly<{ registry_id: string; evidence: readonly CertificationEvidenceRecord[]; complete: boolean; immutable: boolean; replayable: boolean; integrity_hash: string }>;
export type CertificationDomainReport = Readonly<{ report_id: string; domain: string; passed: boolean; score: number; evidence_refs: readonly string[]; failures: readonly Phase12CertificationFailure[]; integrity_hash: string }>;
export type Phase12CertificationTestResult = Readonly<{ test_id: string; name: string; category: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: Phase12CertificationFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type Phase12CertificationDecision = Readonly<{ decision_id: string; outcome: Phase12CertificationOutcome; production_ready: boolean; production_promotion_allowed: boolean; conditions: readonly string[]; critical_failures: readonly Phase12CertificationFailure[]; decision_reason: string; integrity_hash: string }>;
export type Phase12CertificationLedgerEntry = Readonly<{ entry_id: string; sequence: number; event_type: string; decision_ref: string; evidence_refs: readonly string[]; outcome: Phase12CertificationOutcome; previous_hash: string | null; entry_hash: string; integrity_hash: string }>;
export type Phase12CertificationLedger = Readonly<{ ledger_id: string; entries: readonly Phase12CertificationLedgerEntry[]; append_only: boolean; replayable: boolean; tenant_isolated: boolean; integrity_protected: boolean; integrity_hash: string }>;
export type ContinuousCertificationStatus = Readonly<{ monitor_id: string; certified: boolean; drift_detected: boolean; recertification_required: boolean; monitored_signals: readonly string[]; last_certification_outcome: Phase12CertificationOutcome; integrity_hash: string }>;
export type ProductionReadinessReport = Readonly<{ report_id: string; production_ready: boolean; deployment_allowed: boolean; all_required_evidence_supplied: boolean; all_critical_tests_passed: boolean; operationally_observable: boolean; rollback_ready: boolean; integrity_hash: string }>;
export type Phase12CertificationResult = Readonly<{ phase_version: "phase-12-certification-gate/v12.14"; phase_identifier: "Phase12CertificationGate"; contract: Phase12CertificationContract; test_registry: CertificationTestRegistry; evidence_registry: CertificationEvidenceRegistry; determinism: CertificationDomainReport; constitutional_governance: CertificationDomainReport; artifacts: CertificationDomainReport; recommendation_intelligence: CertificationDomainReport; replay_lineage_integrity: CertificationDomainReport; security_tenant: CertificationDomainReport; operations: CertificationDomainReport; production_readiness: ProductionReadinessReport; test_results: readonly Phase12CertificationTestResult[]; decision: Phase12CertificationDecision; ledger: Phase12CertificationLedger; continuous_certification: ContinuousCertificationStatus; replay_hash: string; integrity_hash: string }>;
export type Phase12CertificationValidation = Readonly<{ valid: boolean; outcome: Phase12CertificationOutcome; production_ready: boolean; replay_hash_valid: boolean; integrity_hash_valid: boolean; ledger_valid: boolean; evidence_valid: boolean; tests_valid: boolean; validation_hash: string }>;
export type Phase12CertificationContractBundle = Readonly<{ doctrine: Readonly<{ version: "phase-12-certification-gate/v12.14"; final_certification_authority: true; pass_required_for_production: true; conditional_pass_blocks_production: true; immutable_certification_ledger_required: true; continuous_certification_required: true }>; result: Phase12CertificationResult; validation: Phase12CertificationValidation }>;
