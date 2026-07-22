import type { ReplayDivergenceResult } from "@/types/replay-divergence-detection-engine";

export type AssuranceAuditStatus = "COMPLETE" | "INCOMPLETE" | "INVALID";
export type AssuranceIntegrityOutcome = "VERIFIED" | "MODIFIED" | "MISSING" | "INVALID" | "UNVERIFIABLE";
export type AssuranceCompletenessOutcome = "COMPLETE" | "INCOMPLETE" | "INVALID";

export type AssuranceAuditFailure =
  | "LINEAGE_MISSING"
  | "LINEAGE_MUTATED"
  | "ARTIFACT_HASH_MODIFIED"
  | "EVIDENCE_HASH_MISSING"
  | "DEPENDENCY_INTEGRITY_INVALID"
  | "REPLAY_TRACE_MISSING"
  | "DIVERGENCE_REFERENCE_MISSING"
  | "CERTIFICATION_REFERENCE_MISSING"
  | "AMENDMENT_REFERENCE_MISSING"
  | "LEDGER_MUTATION_ATTEMPT"
  | "PROVENANCE_CHAIN_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "AUDIT_COMPLETENESS_INCOMPLETE";

export type AssuranceAuditScenario = "BASELINE" | AssuranceAuditFailure;
export type AssuranceAuditInput = Readonly<{ scenario?: AssuranceAuditScenario; tenant_id?: string; replay_divergence?: ReplayDivergenceResult }>;

export type AssuranceAuditContract = Readonly<{
  audit_id: string;
  assessment_id: string;
  certification_id: string;
  tenant_id: string;
  mission_scope: string;
  assurance_engine_ref: string;
  evaluation_record_ref: string;
  dependency_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  divergence_refs: readonly string[];
  certification_decision_ref: string;
  amendment_refs: readonly string[];
  lineage_root: string;
  audit_status: AssuranceAuditStatus;
  created_timestamp: string;
  completed_timestamp: string;
  integrity_hash: string;
}>;

export type AssuranceLineageNode = Readonly<{
  node_id: string;
  artifact_ref: string;
  origin_ref: string;
  parent_refs: readonly string[];
  sequence: number;
  immutable: boolean;
  integrity_hash: string;
}>;

export type AssuranceLineageEdge = Readonly<{
  edge_id: string;
  source_ref: string;
  target_ref: string;
  relationship:
    | "EXECUTES_BEFORE"
    | "DEPENDS_ON"
    | "DERIVES_EVIDENCE"
    | "QUALIFIES_EVIDENCE"
    | "BINDS_POLICY"
    | "REVIEWS_GOVERNANCE"
    | "REVIEWS_OPERATOR"
    | "AGGREGATES_CERTIFICATION"
    | "REPLAYS"
    | "PRESERVES_DIVERGENCE"
    | "REFERENCES_AMENDMENT";
  append_only: boolean;
  integrity_hash: string;
}>;

export type AssuranceLineageGraph = Readonly<{
  lineage_graph_id: string;
  lineage_root: string;
  nodes: readonly AssuranceLineageNode[];
  edges: readonly AssuranceLineageEdge[];
  complete: boolean;
  deterministic: boolean;
  replayable: boolean;
  immutable: boolean;
  append_only: boolean;
  historical_lineage_preserved: boolean;
  integrity_hash: string;
}>;

export type AssuranceIntegrityValidation = Readonly<{
  validation_id: string;
  artifact_hashes: AssuranceIntegrityOutcome;
  evidence_hashes: AssuranceIntegrityOutcome;
  lineage_integrity: AssuranceIntegrityOutcome;
  dependency_integrity: AssuranceIntegrityOutcome;
  replay_integrity: AssuranceIntegrityOutcome;
  certification_integrity: AssuranceIntegrityOutcome;
  amendment_integrity: AssuranceIntegrityOutcome;
  ledger_integrity: AssuranceIntegrityOutcome;
  mandatory_before_certification: true;
  constitutional_assurance_event: boolean;
  deterministic: boolean;
  failures: readonly AssuranceAuditFailure[];
  integrity_hash: string;
}>;

export type ImmutableAssuranceAuditLedgerEntry = Readonly<{
  ledger_entry_id: string;
  audit_id: string;
  event_type:
    | "ASSURANCE_EXECUTED"
    | "EVALUATION_RESULT_RECORDED"
    | "DEPENDENCY_EVALUATED"
    | "EVIDENCE_QUALIFIED"
    | "REPLAY_EXECUTED"
    | "DIVERGENCE_EVALUATED"
    | "CERTIFICATION_DECIDED"
    | "GOVERNANCE_REVIEWED"
    | "OPERATOR_REVIEWED"
    | "AMENDMENT_REFERENCED";
  artifact_ref: string;
  evidence_refs: readonly string[];
  correction_of_ref: string | null;
  sequence: number;
  event_timestamp: string;
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReplayTraceRegistryEntry = Readonly<{
  replay_trace_id: string;
  originating_assessment_id: string;
  replay_identity: string;
  replay_ordering: readonly string[];
  replay_inputs: readonly string[];
  replay_outputs: readonly string[];
  replay_dependencies: readonly string[];
  replay_evidence: readonly string[];
  replay_divergence_classifications: readonly string[];
  replay_certification_outcome: string;
  immutable: boolean;
  explainable: boolean;
  integrity_hash: string;
}>;

export type AmendmentReferenceRegistryEntry = Readonly<{
  amendment_reference_id: string;
  constitutional_amendment_refs: readonly string[];
  governance_amendment_refs: readonly string[];
  policy_amendment_refs: readonly string[];
  implementation_version_refs: readonly string[];
  certification_applicability: string;
  supersession_refs: readonly string[];
  historical_applicability_preserved: boolean;
  constitutional_provenance_explicit: boolean;
  integrity_hash: string;
}>;

export type AssuranceProvenanceChain = Readonly<{
  provenance_id: string;
  artifact_ref: string;
  originating_assessment: string;
  originating_assurance_engine: string;
  originating_evidence: readonly string[];
  originating_dependencies: readonly string[];
  originating_governance_approvals: readonly string[];
  originating_certification_decision: string;
  originating_replay: readonly string[];
  originating_amendment_version: readonly string[];
  canonical: boolean;
  complete: boolean;
  immutable: boolean;
  replayable: boolean;
  integrity_hash: string;
}>;

export type LineageReplayResult = Readonly<{
  lineage_replay_id: string;
  reconstructed_ordering: readonly string[];
  reconstructed_dependencies: readonly string[];
  reconstructed_evidence_consumption: readonly string[];
  reconstructed_replay_history: readonly string[];
  reconstructed_certification_aggregation: readonly string[];
  reconstructed_divergence_history: readonly string[];
  reconstructed_amendment_applicability: readonly string[];
  reconstructed_integrity_history: readonly string[];
  identical_to_original: boolean;
  missing_lineage_detected: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type AuditCompletenessValidation = Readonly<{
  completeness_validation_id: string;
  lineage_complete: boolean;
  dependency_complete: boolean;
  evidence_complete: boolean;
  replay_complete: boolean;
  divergence_complete: boolean;
  certification_complete: boolean;
  amendment_complete: boolean;
  integrity_complete: boolean;
  outcome: AssuranceCompletenessOutcome;
  certification_prohibited: boolean;
  deterministic: boolean;
  replayable: boolean;
  failures: readonly AssuranceAuditFailure[];
  integrity_hash: string;
}>;

export type AssuranceAuditCertification = Readonly<{
  certification_id: string;
  outcome: "PASS" | "NON_PASSING";
  certification_authorized: boolean;
  reasoning: string;
  failures: readonly AssuranceAuditFailure[];
  integrity_hash: string;
}>;

export type AssuranceAuditLineageIntegrityResult = Readonly<{
  phase_version: "assurance-audit-lineage-integrity/v13.7";
  phase_identifier: "AssuranceAuditLineageIntegrity";
  audit_contract: AssuranceAuditContract;
  lineage_graph: AssuranceLineageGraph;
  integrity_validation: AssuranceIntegrityValidation;
  audit_ledger: readonly ImmutableAssuranceAuditLedgerEntry[];
  replay_trace_registry: readonly ReplayTraceRegistryEntry[];
  amendment_reference_registry: readonly AmendmentReferenceRegistryEntry[];
  provenance_service: readonly AssuranceProvenanceChain[];
  lineage_replay: LineageReplayResult;
  completeness_validation: AuditCompletenessValidation;
  certification: AssuranceAuditCertification;
  replay_divergence: ReplayDivergenceResult;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AssuranceAuditLineageIntegrityValidation = Readonly<{
  valid: boolean;
  outcome: "PASS" | "NON_PASSING";
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  lineage_valid: boolean;
  ledger_valid: boolean;
  completeness_valid: boolean;
  failures: readonly AssuranceAuditFailure[];
  integrity_hash: string;
}>;

export type AssuranceAuditLineageIntegrityBundle = Readonly<{
  doctrine: Readonly<{
    version: "assurance-audit-lineage-integrity/v13.7";
    immutable_lineage_required: true;
    integrity_verification_required: true;
    audit_ledger_append_only: true;
    replay_trace_required: true;
    amendment_traceability_required: true;
    provenance_replay_required: true;
    completeness_required_before_certification: true;
  }>;
  result: AssuranceAuditLineageIntegrityResult;
  validation: AssuranceAuditLineageIntegrityValidation;
}>;
