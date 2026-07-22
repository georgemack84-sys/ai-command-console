export type StrategicAssuranceCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReplayDivergenceType = "INPUT_DIVERGENCE" | "POLICY_DIVERGENCE" | "MODEL_DIVERGENCE" | "ALGORITHM_DIVERGENCE" | "ORDERING_DIVERGENCE" | "TEMPORAL_DIVERGENCE" | "AUTHORITY_DIVERGENCE" | "OUTPUT_DIVERGENCE" | "NONDETERMINISTIC_DIVERGENCE";
export type StrategicAssuranceFailure =
  | "LINEAGE_GRAPH_INCOMPLETE"
  | "ORPHAN_ARTIFACT"
  | "MULTIPLE_ORIGINS"
  | "CIRCULAR_ORIGIN"
  | "INVALID_ORIGIN"
  | "FULL_REPLAY_MISMATCH"
  | "ARTIFACT_REPLAY_MISMATCH"
  | "DIVERGENCE_UNCLASSIFIED"
  | "HASH_MISMATCH"
  | "MANIFEST_HASH_MISMATCH"
  | "CYCLE_HASH_MISMATCH"
  | "LINEAGE_HASH_MISMATCH"
  | "LEDGER_HASH_MISMATCH"
  | "DUPLICATE_AUTHORITATIVE_STATE"
  | "OWNERSHIP_CONFLICT"
  | "EXPLAINABILITY_INCOMPLETE"
  | "LEDGER_NOT_APPEND_ONLY"
  | "LEDGER_NOT_HASH_LINKED"
  | "CROSS_TENANT_LINEAGE"
  | "GOVERNANCE_BYPASS"
  | "FAIL_CLOSED_NOT_ENFORCED";
export type StrategicAssuranceScenario = "BASELINE" | StrategicAssuranceFailure;
export type StrategicAssuranceInput = Readonly<{ scenario?: StrategicAssuranceScenario; tenant_id?: string }>;

export type ArtifactLineageRecord = Readonly<{ artifact_id: string; artifact_version: string; lifecycle_state: string; origin: string; owner: string; policy_manifest: string; recommendation_cycle: string; integrity_hash_ref: string; integrity_hash: string }>;
export type StrategicLineageGraph = Readonly<{ graph_id: string; nodes: readonly ArtifactLineageRecord[]; edges: readonly Readonly<{ from: string; to: string; relationship: string; integrity_hash: string }>[]; complete: boolean; immutable_history: boolean; tenant_isolated: boolean; integrity_hash: string }>;
export type OriginValidationReport = Readonly<{ report_id: string; origin_exists: boolean; origin_unique: boolean; origin_integrity_valid: boolean; origin_authority_valid: boolean; origin_replayable: boolean; version_compatible: boolean; orphan_artifacts: readonly string[]; multiple_origins: readonly string[]; circular_origins: readonly string[]; integrity_hash: string }>;
export type CycleReplayRecord = Readonly<{ replay_id: string; identical_artifact_set: boolean; identical_ordering: boolean; identical_policy_decisions: boolean; identical_lifecycle_transitions: boolean; identical_governance_decisions: boolean; identical_recommendation_outcome: boolean; certified: boolean; integrity_hash: string }>;
export type ArtifactReplayRecord = Readonly<{ replay_id: string; replayed_artifact_types: readonly string[]; inputs_reconstructed: boolean; evidence_reconstructed: boolean; policies_reconstructed: boolean; algorithms_reconstructed: boolean; lifecycle_reconstructed: boolean; outputs_reconstructed: boolean; certified: boolean; integrity_hash: string }>;
export type ReplayDivergenceRecord = Readonly<{ record_id: string; divergences: readonly ReplayDivergenceType[]; missing_artifacts: readonly string[]; altered_evidence: readonly string[]; changed_models: readonly string[]; changed_policies: readonly string[]; replay_stable: boolean; resolution_action: "certify replay" | "require investigation" | "quarantine replay" | "fail replay" | "governance escalation"; integrity_hash: string }>;
export type StrategicIntegrityReport = Readonly<{ report_id: string; artifact_hashes_reproduced: boolean; manifest_hashes_reproduced: boolean; cycle_hashes_reproduced: boolean; lineage_hashes_reproduced: boolean; ledger_hashes_reproduced: boolean; references_valid: boolean; lifecycle_valid: boolean; ownership_valid: boolean; policy_binding_valid: boolean; evidence_valid: boolean; governance_valid: boolean; integrity_hash: string }>;
export type OwnershipValidationReport = Readonly<{ report_id: string; ownership_unique: boolean; registry_unique: boolean; lifecycle_unique: boolean; recommendation_owner_unique: boolean; comparison_owner_unique: boolean; observation_owner_unique: boolean; duplicate_authority_records: readonly string[]; canonical_owner: string; integrity_hash: string }>;
export type StrategicExplanation = Readonly<{ explanation_id: string; artifact_count: number; why_exists: string; created_by: string; recommendation_cycle: string; policy_manifest: string; governing_authority: string; evidence_summary: string; consumed_artifacts: readonly string[]; produced_artifacts: readonly string[]; lifecycle_summary: string; confidence: number; uncertainty: number; governance_approvals: readonly string[]; replay_certification: string; observation_outcomes: string; human_readable: boolean; complete: boolean; integrity_hash: string }>;
export type StrategicLedgerEntry = Readonly<{ entry_id: string; sequence: number; type: string; subject_id: string; previous_hash: string | null; entry_hash: string; integrity_hash: string }>;
export type StrategicIntelligenceLedger = Readonly<{ ledger_id: string; entries: readonly StrategicLedgerEntry[]; append_only: boolean; immutable: boolean; hash_linked: boolean; tenant_isolated: boolean; governance_protected: boolean; time_ordered: boolean; fully_auditable: boolean; integrity_hash: string }>;
export type StrategicAssuranceObservability = Readonly<{ report_id: string; lineage_nodes: number; replay_success_rate: number; divergence_count: number; integrity_success_rate: number; ownership_conflicts: number; explanations_complete: number; ledger_entries: number; observable: boolean; integrity_hash: string }>;
export type StrategicAssuranceCertificationTest = Readonly<{ test_id: string; name: string; expected: "PASS"; actual: "PASS" | "FAIL"; passed: boolean; failure_reason: StrategicAssuranceFailure | null; evidence_refs: readonly string[]; integrity_hash: string }>;
export type StrategicAssuranceCertification = Readonly<{ certification_id: string; status: StrategicAssuranceCertificationStatus; assurance_certified: boolean; failures: readonly StrategicAssuranceFailure[]; tests: readonly StrategicAssuranceCertificationTest[]; integrity_hash: string }>;

export type StrategicAssuranceResult = Readonly<{ phase_version: "strategic-assurance/v12.11"; phase_identifier: "StrategicAssurance"; lineage_graph: StrategicLineageGraph; origin_validation: OriginValidationReport; cycle_replay: CycleReplayRecord; artifact_replay: ArtifactReplayRecord; divergence: ReplayDivergenceRecord; integrity: StrategicIntegrityReport; ownership: OwnershipValidationReport; explainability: StrategicExplanation; ledger: StrategicIntelligenceLedger; observability: StrategicAssuranceObservability; certification: StrategicAssuranceCertification; replay_hash: string; integrity_hash: string }>;
export type StrategicAssuranceValidation = Readonly<{ graph_id: string | null; valid: boolean; status: StrategicAssuranceCertificationStatus; assurance_certified: boolean; failures: readonly StrategicAssuranceFailure[]; replay_hash_valid: boolean; integrity_hash_valid: boolean; ledger_valid: boolean; explainability_valid: boolean; validation_hash: string }>;
export type StrategicAssuranceContractBundle = Readonly<{ doctrine: Readonly<{ version: "strategic-assurance/v12.11"; one_origin_per_artifact: true; complete_lineage_required: true; deterministic_replay_required: true; hash_integrity_required: true; canonical_ownership_required: true; explainability_required: true; append_only_ledger_required: true }>; result: StrategicAssuranceResult; validation: StrategicAssuranceValidation }>;
