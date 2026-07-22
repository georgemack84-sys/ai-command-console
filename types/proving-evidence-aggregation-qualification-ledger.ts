export type EvidenceOutcome = "PASS" | "PASS_WITH_OBSERVATIONS" | "CONDITIONAL_PASS" | "REQUIRES_REVIEW" | "FAIL" | "FAIL_CLOSED";
export type EvidenceCategory = "SIMULATION" | "REPLAY" | "VALIDATION" | "REGRESSION" | "BENCHMARK" | "EXERCISE" | "INTEGRATION" | "PERFORMANCE" | "RESILIENCE" | "RECOVERY" | "ADVERSARIAL" | "CERTIFICATION" | "QUALIFICATION" | "GOVERNANCE" | "LINEAGE";
export type AggregationDimension = "SCENARIO" | "EXPERIMENT" | "BENCHMARK" | "ENVIRONMENT" | "MISSION" | "TENANT" | "CERTIFICATION" | "QUALIFICATION";
export type EvidenceFailure =
  | "P6_14_CONTINUOUS_VALIDATION_INVALID"
  | "EVIDENCE_COLLECTION_FRAMEWORK_MISSING"
  | "EVIDENCE_SOURCE_MISSING"
  | "EVIDENCE_VALIDATION_ENGINE_MISSING"
  | "EVIDENCE_INTEGRITY_INVALID"
  | "EVIDENCE_COMPLETENESS_INVALID"
  | "EVIDENCE_SIGNATURE_INVALID"
  | "EVIDENCE_TIMESTAMP_INVALID"
  | "EVIDENCE_PROVENANCE_INVALID"
  | "REPLAY_REFERENCE_MISSING"
  | "CONSTITUTIONAL_COMPLIANCE_INVALID"
  | "EVIDENCE_AGGREGATION_ENGINE_MISSING"
  | "AGGREGATION_DIMENSION_MISSING"
  | "LINEAGE_ENGINE_MISSING"
  | "LINEAGE_GRAPH_INCOMPLETE"
  | "IMMUTABLE_LEDGER_MISSING"
  | "LEDGER_APPEND_ONLY_VIOLATED"
  | "LEDGER_CRYPTOGRAPHIC_VERIFICATION_FAILED"
  | "QUALIFICATION_EVIDENCE_MANAGER_MISSING"
  | "QUALIFICATION_PACKAGE_INCOMPLETE"
  | "EVIDENCE_REGISTRY_MISSING"
  | "REGISTRY_INDEX_INCOMPLETE"
  | "REPLAY_ASSOCIATION_MISSING"
  | "FEDERATED_EVIDENCE_GRAPH_MISSING"
  | "CROSS_PROGRAM_EVIDENCE_MISSING"
  | "AUDIT_TRACEABILITY_INCOMPLETE"
  | "EVIDENCE_GOVERNANCE_POLICY_MISSING"
  | "RETENTION_POLICY_MISSING"
  | "EVIDENCE_AUTHORITY_VIOLATED"
  | "QUALIFICATION_LEDGER_DECISION_MISSING"
  | "FAIL_CLOSED_NOT_ENFORCED";
export type EvidenceScenario = "BASELINE" | "PASS_WITH_OBSERVATIONS" | "CONDITIONAL_FOLLOWUP" | EvidenceFailure;
export type EvidenceInput = Readonly<{ scenario?: EvidenceScenario; seed?: string }>;
export type EvidenceCollection = Readonly<{ collection_id: string; categories: readonly EvidenceCategory[]; simulation: boolean; replay: boolean; adversarial: boolean; resilience: boolean; scalability: boolean; benchmarking: boolean; interoperability: boolean; operational_exercise: boolean; certification_rehearsal: boolean; continuous_validation: boolean; regression_validation: boolean; qualification: boolean; integrity_hash: string }>;
export type EvidenceValidationEngine = Readonly<{ engine_id: string; integrity: boolean; completeness: boolean; signatures: boolean; timestamps: boolean; provenance: boolean; replay_references: boolean; lineage_references: boolean; constitutional_compliance: boolean; governance_compliance: boolean; integrity_hash: string }>;
export type AggregatedEvidencePackage = Readonly<{ package_id: string; dimensions: readonly AggregationDimension[]; scenario: boolean; experiment: boolean; benchmark: boolean; environment: boolean; mission: boolean; tenant: boolean; certification: boolean; qualification: boolean; qualification_ready: boolean; integrity_hash: string }>;
export type EvidenceLineageGraph = Readonly<{ graph_id: string; origin_tracked: boolean; producing_phase_tracked: boolean; producing_service_tracked: boolean; execution_tracked: boolean; replay_tracked: boolean; simulation_tracked: boolean; benchmark_tracked: boolean; validation_tracked: boolean; qualification_tracked: boolean; complete: boolean; integrity_hash: string }>;
export type ProvingEvidenceLedger = Readonly<{ ledger_id: string; records: readonly string[]; append_only: boolean; immutable: boolean; cryptographically_verifiable: boolean; replay_linked: boolean; audit_complete: boolean; integrity_hash: string }>;
export type QualificationEvidence = Readonly<{ qualification_id: string; objectives: readonly string[]; proving_reports: readonly string[]; benchmark_reports: readonly string[]; replay_reports: readonly string[]; validation_reports: readonly string[]; simulation_reports: readonly string[]; governance_reports: readonly string[]; package_complete: boolean; integrity_hash: string }>;
export type EvidenceRegistry = Readonly<{ registry_id: string; evidence_ids: readonly string[]; scenario_index: boolean; benchmark_index: boolean; simulation_index: boolean; replay_index: boolean; environment_index: boolean; qualification_index: boolean; certification_index: boolean; searchable: boolean; integrity_hash: string }>;
export type ReplayEvidenceReferences = Readonly<{ reference_id: string; replay_identifiers: readonly string[]; execution_lineage: boolean; replay_certification: boolean; divergence_references: boolean; deterministic_replay_preserved: boolean; integrity_hash: string }>;
export type FederatedEvidenceGraph = Readonly<{ federation_id: string; program_1_capability: boolean; program_2_infrastructure: boolean; program_3_autonomy: boolean; program_4_application: boolean; program_5_trust: boolean; cross_program_exchange: boolean; integrity_hash: string }>;
export type AuditTraceabilityReport = Readonly<{ audit_id: string; who: boolean; what: boolean; when: boolean; where: boolean; why: boolean; lineage: boolean; signatures: boolean; approvals: boolean; immutable_history: boolean; integrity_hash: string }>;
export type EvidenceGovernancePolicy = Readonly<{ policy_id: string; retention: boolean; immutability: boolean; archival: boolean; supersession: boolean; restoration: boolean; discovery: boolean; evidence_authority: boolean; enforced: boolean; integrity_hash: string }>;
export type QualificationLedgerDecision = Readonly<{ decision_id: string; outcome: EvidenceOutcome; qualification_package_authorized: boolean; program_qualification_supply_authorized: boolean; certification_evidence_authorized: boolean; fail_closed: boolean; rationale: readonly string[]; integrity_hash: string }>;
export type EvidenceLedgerGates = Readonly<{ gate_id: string; collection_gate: boolean; validation_gate: boolean; aggregation_gate: boolean; lineage_gate: boolean; ledger_gate: boolean; registry_gate: boolean; replay_gate: boolean; federation_gate: boolean; qualification_gate: boolean; audit_gate: boolean; governance_gate: boolean; passed: boolean; integrity_hash: string }>;
export type EvidenceReadiness = Readonly<{ readiness_id: string; outcome: EvidenceOutcome; phase_ready: boolean; collection_ready: boolean; validation_ready: boolean; aggregation_ready: boolean; lineage_ready: boolean; ledger_ready: boolean; registry_ready: boolean; replay_ready: boolean; federation_ready: boolean; qualification_ready: boolean; audit_ready: boolean; governance_ready: boolean; gates_passed: boolean; failures: readonly EvidenceFailure[]; integrity_hash: string }>;
export type EvidenceLedgerResult = Readonly<{ phase_version: "proving-evidence-aggregation-qualification-ledger/v6.15"; phase_identifier: "ProvingEvidenceAggregationQualificationLedger"; continuous_validation_ref: "proving-continuous-proving-regression-validation/v6.14"; collection: EvidenceCollection; validation_engine: EvidenceValidationEngine; aggregated_package: AggregatedEvidencePackage; lineage_graph: EvidenceLineageGraph; ledger: ProvingEvidenceLedger; qualification_evidence: QualificationEvidence; registry: EvidenceRegistry; replay_references: ReplayEvidenceReferences; federated_graph: FederatedEvidenceGraph; audit_report: AuditTraceabilityReport; governance_policy: EvidenceGovernancePolicy; decision: QualificationLedgerDecision; gates: EvidenceLedgerGates; readiness: EvidenceReadiness; replay_hash: string; integrity_hash: string }>;
export type EvidenceLedgerValidation = Readonly<{ valid: boolean; outcome: EvidenceOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; collection_valid: boolean; validation_engine_valid: boolean; aggregation_valid: boolean; lineage_valid: boolean; ledger_valid: boolean; qualification_valid: boolean; registry_valid: boolean; replay_references_valid: boolean; federation_valid: boolean; audit_valid: boolean; governance_valid: boolean; decision_valid: boolean; gates_valid: boolean; readiness_valid: boolean; failures: readonly EvidenceFailure[]; integrity_hash: string }>;
export type EvidenceLedgerBundle = Readonly<{ doctrine: Readonly<{ version: "proving-evidence-aggregation-qualification-ledger/v6.15"; owns_proving_evidence: true; owns_qualification_evidence: true; owns_evidence_aggregation: true; owns_lineage: true; owns_immutable_ledger: true }>; result: EvidenceLedgerResult; validation: EvidenceLedgerValidation }>;
