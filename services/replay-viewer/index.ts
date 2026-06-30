import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DeterminismGateDisplay,
  FieldMismatch,
  IncompleteReplayDisplay,
  InputReconstructionDisplay,
  InvalidReplayDisplay,
  OutputVerificationDisplay,
  ReplayDiffDisplay,
  ReplayMismatchAnalysis,
  ReplayState,
  ReplaySummaryDisplay,
  ReplayTargetType,
  ReplayTimelineEvent,
  ReplayViewerAuditEvent,
  ReplayViewerContract,
  ReplayViewerDetail,
  ReplayViewerQuery,
  ReplayViewerRecord,
  ReplayViewerView,
  StateReconstructionDisplay,
} from "@/types/replay-viewer";
import type { TruthDashboardAccessLevel, TruthDashboardAccessResult, TruthDashboardIntegrityState } from "@/types/truth-dashboard";

const NOW = "2026-06-24T14:30:00.000Z";

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function freezeRecord(record: ReplayViewerRecord): ReplayViewerRecord {
  return Object.freeze({
    ...record,
    replay_target: Object.freeze({ ...record.replay_target }),
    replay_summary: Object.freeze({ ...record.replay_summary }),
    reconstruction: Object.freeze({ ...record.reconstruction }),
    integrity: Object.freeze({ ...record.integrity }),
    references: Object.freeze({
      input_refs: Object.freeze([...record.references.input_refs]),
      evidence_refs: Object.freeze([...record.references.evidence_refs]),
      lineage_refs: Object.freeze([...record.references.lineage_refs]),
      governance_refs: Object.freeze([...record.references.governance_refs]),
      decision_refs: Object.freeze([...record.references.decision_refs]),
      recommendation_refs: Object.freeze([...record.references.recommendation_refs]),
      replay_refs: Object.freeze([...record.references.replay_refs]),
    }),
    visibility: Object.freeze({
      ...record.visibility,
      hidden_segments: Object.freeze([...record.visibility.hidden_segments]),
    }),
  });
}

export function buildReplayViewerContract(input: Readonly<{
  replay_viewer_id?: string;
  tenant_id: string;
  operator_id: string;
  mission_ids?: readonly string[];
  replay_ids?: readonly string[];
  truth_record_ids?: readonly string[];
  access_level?: TruthDashboardAccessLevel;
}>): ReplayViewerContract {
  return Object.freeze({
    replay_viewer_id: input.replay_viewer_id ?? "replay_viewer_primary",
    tenant_id: input.tenant_id,
    operator_id: input.operator_id,
    scope: Object.freeze({
      mission_ids: input.mission_ids ? Object.freeze([...input.mission_ids]) : undefined,
      truth_record_ids: input.truth_record_ids ? Object.freeze([...input.truth_record_ids]) : undefined,
      replay_ids: input.replay_ids ? Object.freeze([...input.replay_ids]) : undefined,
      access_level: input.access_level ?? "READ_ONLY",
    }),
    displays: Object.freeze({
      replay_summary: true,
      input_reconstruction: true,
      state_reconstruction: true,
      output_verification: true,
      mismatch_analysis: true,
      evidence_context: true,
      lineage_context: true,
      governance_context: true,
      integrity_context: true,
    }),
    governance: Object.freeze({
      tenant_isolation_required: true,
      restricted_records_hidden: input.access_level !== "RESTRICTED_READ",
      redaction_required: true,
      replay_mutation_blocked: true,
      truth_record_mutation_blocked: true,
      authority_escalation_blocked: true,
    }),
    replay: Object.freeze({
      replay_refs_visible: true,
      replay_state_visible: true,
      replay_inputs_visible: true,
      replay_outputs_visible: true,
      determinism_state_visible: true,
    }),
    audit: Object.freeze({
      viewer_access_audited: true,
      restricted_access_audited: true,
      replay_link_access_audited: true,
    }),
  });
}

export function buildReplayViewerSeedRecords(): readonly ReplayViewerRecord[] {
  return Object.freeze([
    freezeRecord({
      replay_id: "replay_cert_6j5_000001",
      truth_record_id: "truth_rec_001",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      replay_state: "REPRODUCED",
      replay_target: { target_type: "RECOMMENDATION", target_id: "rec_6j_contract" },
      replay_summary: {
        title: "Query certification replay reproduced",
        summary: "Inputs, reconstructed state, and output hash matched the original certification result.",
        replay_timestamp: "2026-06-24T12:05:00.000Z",
        replay_engine_version: "mission-control-replay-viewer/v1",
        replay_contract_version: "6H.1",
      },
      reconstruction: {
        input_reconstruction_state: "RECONSTRUCTED",
        state_reconstruction_state: "RECONSTRUCTED",
        output_verification_state: "MATCH",
        determinism_state: "DETERMINISTIC",
      },
      integrity: { integrity_state: "VALID", hash_chain_state: "VALID", tamper_detection_state: "CLEAR" },
      references: {
        input_refs: ["input_query_contract", "input_search_matrix"],
        evidence_refs: ["evidence_query_contract_tests", "evidence_search_tests"],
        lineage_refs: ["lineage_6j_001"],
        governance_refs: ["gov_cert_6j5"],
        decision_refs: ["decision_6j_gate"],
        recommendation_refs: ["rec_6j_contract"],
        replay_refs: ["replay_cert_6j5_000001"],
      },
      visibility: { restricted: false, redacted: false, hidden_segments: [], access_result: "ALLOWED" },
    }),
    freezeRecord({
      replay_id: "replay_dashboard_view_001",
      truth_record_id: "truth_rec_002",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      replay_state: "INCOMPLETE",
      replay_target: { target_type: "DECISION", target_id: "decision_dashboard_read_only" },
      replay_summary: {
        title: "Dashboard decision replay incomplete",
        summary: "Replay reconstructed the decision state but one audit projection dependency was missing.",
        replay_timestamp: "2026-06-24T12:35:00.000Z",
        replay_engine_version: "mission-control-replay-viewer/v1",
        replay_contract_version: "6H.4",
      },
      reconstruction: {
        input_reconstruction_state: "PARTIAL",
        state_reconstruction_state: "RECONSTRUCTED",
        output_verification_state: "NOT_COMPARABLE",
        determinism_state: "PARTIAL",
      },
      integrity: { integrity_state: "DEGRADED", hash_chain_state: "VALID", tamper_detection_state: "CLEAR" },
      references: {
        input_refs: ["input_dashboard_policy"],
        evidence_refs: ["evidence_dashboard_guardrails"],
        lineage_refs: ["lineage_6k_001"],
        governance_refs: ["gov_dashboard_read_only"],
        decision_refs: ["decision_dashboard_read_only"],
        recommendation_refs: ["rec_6j_contract"],
        replay_refs: ["replay_dashboard_view_001"],
      },
      visibility: { restricted: false, redacted: false, hidden_segments: [], access_result: "ALLOWED" },
    }),
    freezeRecord({
      replay_id: "replay_mismatch_001",
      truth_record_id: "truth_rec_004",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      replay_state: "MISMATCH",
      replay_target: { target_type: "TRUTH_RECORD", target_id: "truth_rec_004" },
      replay_summary: {
        title: "Lineage replay mismatch",
        summary: "Replay found a lineage ordering mismatch in a reconstructed child-reference list.",
        replay_timestamp: "2026-06-24T13:05:00.000Z",
        replay_engine_version: "mission-control-replay-viewer/v1",
        replay_contract_version: "6H.5",
      },
      reconstruction: {
        input_reconstruction_state: "RECONSTRUCTED",
        state_reconstruction_state: "PARTIAL",
        output_verification_state: "MISMATCH",
        determinism_state: "NONDETERMINISTIC",
      },
      integrity: { integrity_state: "VALID", hash_chain_state: "VALID", tamper_detection_state: "CLEAR" },
      references: {
        input_refs: ["input_lineage_seed"],
        evidence_refs: ["evidence_query_contract_tests"],
        lineage_refs: ["lineage_6j_001", "lineage_6k_001"],
        governance_refs: ["gov_dashboard_read_only"],
        decision_refs: ["decision_dashboard_read_only"],
        recommendation_refs: ["rec_6j_contract"],
        replay_refs: ["replay_mismatch_001"],
      },
      visibility: { restricted: false, redacted: false, hidden_segments: [], access_result: "ALLOWED" },
    }),
    freezeRecord({
      replay_id: "replay_restricted_bundle",
      truth_record_id: "truth_rec_003",
      tenant_id: "tenant_alpha",
      mission_id: "mission_query_layer",
      replay_state: "INVALID",
      replay_target: { target_type: "EVIDENCE_CHAIN", target_id: "evidence_restricted_bundle" },
      replay_summary: {
        title: "Restricted evidence replay invalid",
        summary: "Replay artifact failed integrity validation and restricted segments were redacted.",
        replay_timestamp: "2026-06-24T12:50:00.000Z",
        replay_engine_version: "mission-control-replay-viewer/v1",
        replay_contract_version: "6H.3",
      },
      reconstruction: {
        input_reconstruction_state: "RESTRICTED",
        state_reconstruction_state: "CORRUPTED",
        output_verification_state: "INVALID",
        determinism_state: "INVALID",
      },
      integrity: { integrity_state: "CORRUPTED", hash_chain_state: "BROKEN", tamper_detection_state: "CONFIRMED" },
      references: {
        input_refs: ["input_restricted_evidence"],
        evidence_refs: ["evidence_restricted_bundle"],
        lineage_refs: ["lineage_evidence_restricted"],
        governance_refs: ["gov_restricted_evidence"],
        decision_refs: ["decision_6j_gate"],
        recommendation_refs: ["rec_6j_contract"],
        replay_refs: ["replay_restricted_bundle"],
      },
      visibility: {
        restricted: true,
        redacted: true,
        hidden_segments: ["input_restricted_evidence", "expected_output.raw"],
        access_result: "REDACTED",
        restriction_reason: "Restricted evidence replay hides raw input and output segments.",
      },
    }),
    freezeRecord({
      replay_id: "replay_beta_001",
      truth_record_id: "truth_rec_beta",
      tenant_id: "tenant_beta",
      mission_id: "mission_external",
      replay_state: "REPRODUCED",
      replay_target: { target_type: "RECOMMENDATION", target_id: "rec_beta" },
      replay_summary: {
        title: "Cross-tenant replay",
        summary: "Must never be visible to tenant alpha.",
        replay_timestamp: "2026-06-24T13:30:00.000Z",
        replay_engine_version: "mission-control-replay-viewer/v1",
        replay_contract_version: "6H.1",
      },
      reconstruction: { input_reconstruction_state: "RECONSTRUCTED", state_reconstruction_state: "RECONSTRUCTED", output_verification_state: "MATCH", determinism_state: "DETERMINISTIC" },
      integrity: { integrity_state: "VALID", hash_chain_state: "VALID", tamper_detection_state: "CLEAR" },
      references: { input_refs: [], evidence_refs: [], lineage_refs: [], governance_refs: [], decision_refs: [], recommendation_refs: ["rec_beta"], replay_refs: ["replay_beta_001"] },
      visibility: { restricted: false, redacted: false, hidden_segments: [], access_result: "ALLOWED" },
    }),
  ]);
}

function redacted(record: ReplayViewerRecord): ReplayViewerRecord {
  if (!record.visibility.restricted) return record;
  return freezeRecord({
    ...record,
    replay_summary: {
      ...record.replay_summary,
      title: "Restricted replay artifact",
      summary: "Replay artifact exists, but restricted input, state, or output segments are redacted.",
    },
    references: {
      ...record.references,
      input_refs: [],
      evidence_refs: [],
      lineage_refs: record.references.lineage_refs,
      replay_refs: record.references.replay_refs,
    },
    visibility: { ...record.visibility, redacted: true, access_result: "REDACTED" },
  });
}

function accessResult(contract: ReplayViewerContract, record: ReplayViewerRecord): TruthDashboardAccessResult {
  if (record.tenant_id !== contract.tenant_id) return "FAILED_CLOSED";
  if (!record.visibility.restricted) return "ALLOWED";
  return contract.scope.access_level === "RESTRICTED_READ" ? "REDACTED" : "DENIED";
}

function inScope(contract: ReplayViewerContract, record: ReplayViewerRecord): boolean {
  if (record.tenant_id !== contract.tenant_id) return false;
  if (contract.scope.mission_ids?.length && (!record.mission_id || !contract.scope.mission_ids.includes(record.mission_id))) return false;
  if (contract.scope.replay_ids?.length && !contract.scope.replay_ids.includes(record.replay_id)) return false;
  if (contract.scope.truth_record_ids?.length && !contract.scope.truth_record_ids.includes(record.truth_record_id)) return false;
  if (contract.scope.time_range) {
    const time = Date.parse(record.replay_summary.replay_timestamp);
    if (time < Date.parse(contract.scope.time_range.from) || time > Date.parse(contract.scope.time_range.to)) return false;
  }
  return true;
}

function matchesQuery(record: ReplayViewerRecord, query: ReplayViewerQuery): boolean {
  if (record.tenant_id !== query.tenant_id) return false;
  if (query.filters.mission_id && record.mission_id !== query.filters.mission_id) return false;
  if (query.filters.replay_id && record.replay_id !== query.filters.replay_id) return false;
  if (query.filters.truth_record_id && record.truth_record_id !== query.filters.truth_record_id) return false;
  if (query.filters.replay_state && record.replay_state !== query.filters.replay_state) return false;
  if (query.filters.target_type && record.replay_target.target_type !== query.filters.target_type) return false;
  if (query.filters.integrity_state && record.integrity.integrity_state !== query.filters.integrity_state) return false;
  if (query.filters.restricted !== undefined && record.visibility.restricted !== query.filters.restricted) return false;
  if (query.filters.search_text) {
    const text = `${record.replay_id} ${record.truth_record_id} ${record.replay_summary.title} ${record.replay_summary.summary} ${record.replay_state}`.toLowerCase();
    if (!text.includes(query.filters.search_text.toLowerCase())) return false;
  }
  return true;
}

export function queryReplayViewerRecords(
  contract: ReplayViewerContract,
  query: ReplayViewerQuery,
  records: readonly ReplayViewerRecord[] = buildReplayViewerSeedRecords(),
): readonly ReplayViewerRecord[] {
  if (query.tenant_id !== contract.tenant_id || query.operator_id !== contract.operator_id) return Object.freeze([]);
  if (query.governance_context.access_level !== contract.scope.access_level) return Object.freeze([]);

  return Object.freeze(records
    .filter((record) => inScope(contract, record) && matchesQuery(record, query))
    .filter((record) => record.visibility.restricted ? query.governance_context.restricted_access_allowed || contract.scope.access_level === "RESTRICTED_READ" : true)
    .map((record) => accessResult(contract, record) === "REDACTED" ? redacted(record) : record)
    .sort((a, b) => a.replay_summary.replay_timestamp.localeCompare(b.replay_summary.replay_timestamp) || a.replay_id.localeCompare(b.replay_id)));
}

const mismatch: FieldMismatch = Object.freeze({
  field_path: "lineage.child_refs[1]",
  expected_value_summary: "decision_dashboard_read_only",
  replay_value_summary: "decision_6j_gate",
  mismatch_type: "ORDERING_MISMATCH",
});

export function createReplaySummaryDisplay(record: ReplayViewerRecord): ReplaySummaryDisplay {
  const hasMismatch = record.replay_state === "MISMATCH";
  const incomplete = record.replay_state === "INCOMPLETE";
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    replay_state: record.replay_state,
    target_type: record.replay_target.target_type,
    target_id: record.replay_target.target_id,
    replay_started_at: record.replay_summary.replay_timestamp,
    replay_completed_at: record.replay_state === "NOT_AVAILABLE" ? undefined : record.replay_summary.replay_timestamp,
    replay_engine_version: record.replay_summary.replay_engine_version,
    replay_contract_version: record.replay_summary.replay_contract_version,
    deterministic: record.reconstruction.determinism_state === "DETERMINISTIC",
    mismatch_count: hasMismatch ? 1 : 0,
    missing_dependency_count: incomplete ? 1 : 0,
    restricted_segment_count: record.visibility.hidden_segments.length,
    integrity_state: record.integrity.integrity_state,
  });
}

export function createInputReconstructionDisplay(record: ReplayViewerRecord): InputReconstructionDisplay {
  const restricted = record.visibility.redacted;
  const corrupted = record.integrity.integrity_state === "CORRUPTED";
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    input_state: record.reconstruction.input_reconstruction_state,
    inputs: Object.freeze(record.references.input_refs.map((input_id) => Object.freeze({
      input_id,
      input_type: input_id.includes("policy") ? "POLICY" as const : input_id.includes("evidence") ? "EVIDENCE" as const : "SYSTEM_INPUT" as const,
      source_ref: input_id,
      integrity_state: corrupted ? "CORRUPTED" as const : record.integrity.integrity_state,
      visibility: restricted ? "REDACTED" as const : "VISIBLE" as const,
      required_for_replay: true,
      present: !record.replay_state.includes("NOT_AVAILABLE"),
    }))),
    missing_inputs: record.replay_state === "INCOMPLETE" ? Object.freeze(["audit_projection_input"]) : Object.freeze([]),
    restricted_inputs: restricted ? record.visibility.hidden_segments : Object.freeze([]),
    corrupted_inputs: corrupted ? Object.freeze(record.references.input_refs) : Object.freeze([]),
  });
}

export function createStateReconstructionDisplay(record: ReplayViewerRecord): StateReconstructionDisplay {
  const corrupted = record.integrity.integrity_state === "CORRUPTED";
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    state_reconstruction_state: record.reconstruction.state_reconstruction_state,
    reconstructed_state: Object.freeze({
      truth_record_state: record.replay_state === "INVALID" ? undefined : "ACTIVE",
      governance_state: record.visibility.redacted ? "REDACTED" : "POLICY_CHECKED",
      authority_state: "VERIFIED",
      policy_state: record.replay_state === "MISMATCH" ? "POSSIBLE_VERSION_DRIFT" : "STABLE",
      mission_state: record.mission_id,
      runtime_state: record.replay_state === "MISMATCH" ? "ORDERING_DRIFT" : "STABLE",
      decision_state: record.references.decision_refs.length ? "LINKED" : undefined,
      recommendation_state: record.references.recommendation_refs.length ? "LINKED" : undefined,
      evidence_state: record.references.evidence_refs.length ? (corrupted ? "CORRUPTED" : "VERIFIED") : "MISSING",
      lineage_state: record.references.lineage_refs.length ? "LINKED" : "MISSING",
    }),
    state_dependencies: Object.freeze([...record.references.governance_refs, ...record.references.lineage_refs].map((dependency_id) => Object.freeze({
      dependency_id,
      dependency_type: dependency_id.startsWith("gov") ? "POLICY" as const : "LINEAGE" as const,
      required: true,
      present: !record.replay_state.includes("NOT_AVAILABLE"),
      integrity_state: record.integrity.integrity_state,
      visibility: record.visibility.redacted ? "REDACTED" as const : "VISIBLE" as const,
    }))),
    missing_state_dependencies: record.replay_state === "INCOMPLETE" ? Object.freeze(["audit_projection_state"]) : Object.freeze([]),
    restricted_state_dependencies: record.visibility.redacted ? record.visibility.hidden_segments : Object.freeze([]),
    corrupted_state_dependencies: corrupted ? Object.freeze([...record.references.governance_refs, ...record.references.lineage_refs]) : Object.freeze([]),
  });
}

export function createOutputVerificationDisplay(record: ReplayViewerRecord): OutputVerificationDisplay {
  const isMismatch = record.replay_state === "MISMATCH";
  const isInvalid = record.replay_state === "INVALID";
  const redactedOutput = record.visibility.redacted;
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    verification_state: record.reconstruction.output_verification_state,
    expected_output: Object.freeze({
      output_ref: `expected_${record.replay_target.target_id}`,
      output_type: record.replay_target.target_type === "DECISION" ? "DECISION" : record.replay_target.target_type === "RECOMMENDATION" ? "RECOMMENDATION" : "TRUTH_RECORD",
      summary: redactedOutput ? "Restricted expected output." : `Expected output for ${record.replay_target.target_id}.`,
      hash: redactedOutput ? undefined : hashValue("replay-viewer-expected-output", record.replay_target),
      redacted: redactedOutput,
    }),
    replay_output: Object.freeze({
      output_ref: isInvalid ? undefined : `replayed_${record.replay_target.target_id}`,
      output_type: record.replay_target.target_type,
      summary: redactedOutput ? "Restricted replay output." : isMismatch ? "Replay output differs in lineage ordering." : `Replay output for ${record.replay_target.target_id}.`,
      hash: redactedOutput || isInvalid ? undefined : hashValue("replay-viewer-replay-output", { target: record.replay_target, mismatch: isMismatch }),
      redacted: redactedOutput,
    }),
    comparison: Object.freeze({
      exact_match: record.reconstruction.output_verification_state === "MATCH",
      semantic_match: !isInvalid && !isMismatch,
      hash_match: record.reconstruction.output_verification_state === "MATCH",
      field_mismatches: isMismatch ? Object.freeze([mismatch]) : Object.freeze([]),
      missing_fields: record.replay_state === "INCOMPLETE" ? Object.freeze(["audit_projection"]) : Object.freeze([]),
      extra_fields: Object.freeze([]),
    }),
  });
}

export function createReplayMismatchAnalysis(record: ReplayViewerRecord): ReplayMismatchAnalysis {
  const state = record.replay_state === "MISMATCH" ? "LINEAGE_MISMATCH" : record.replay_state === "INVALID" ? "INTEGRITY_MISMATCH" : "NO_MISMATCH";
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    mismatch_state: state,
    root_cause_candidates: state === "NO_MISMATCH" ? Object.freeze([]) : Object.freeze([
      Object.freeze({
        cause_type: record.replay_state === "INVALID" ? "HASH_CHAIN_BREAK" as const : "NONDETERMINISTIC_PROCESS" as const,
        confidence: record.replay_state === "INVALID" ? "HIGH" as const : "MEDIUM" as const,
        supporting_refs: record.replay_state === "INVALID" ? record.references.evidence_refs : record.references.lineage_refs,
        summary: record.replay_state === "INVALID" ? "Replay artifact integrity failed validation." : "Lineage ordering changed during replay.",
      }),
    ]),
    first_detected_mismatch: state === "NO_MISMATCH" ? undefined : Object.freeze({
      stage: record.replay_state === "INVALID" ? "INTEGRITY_CHECK" as const : "OUTPUT_VERIFICATION" as const,
      field_path: record.replay_state === "MISMATCH" ? mismatch.field_path : undefined,
      reference_id: record.replay_id,
      summary: record.replay_state === "INVALID" ? "Hash-chain validation failed." : "Replay output comparison found ordering drift.",
    }),
  });
}

export function createIncompleteReplayDisplay(record: ReplayViewerRecord): IncompleteReplayDisplay {
  const incomplete = record.replay_state === "INCOMPLETE";
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    incomplete_reasons: incomplete ? Object.freeze([
      Object.freeze({
        reason_type: "MISSING_EVIDENCE" as const,
        required_for_replay: true,
        reference_id: "audit_projection_input",
        summary: "Required audit projection input was unavailable.",
      }),
    ]) : Object.freeze([]),
    reconstruction_coverage: Object.freeze({
      input_coverage: incomplete ? 0.75 : 1,
      state_coverage: incomplete ? 0.9 : record.replay_state === "INVALID" ? 0.3 : 1,
      output_coverage: incomplete ? 0.5 : record.replay_state === "INVALID" ? 0 : 1,
      evidence_coverage: record.visibility.redacted ? 0.25 : incomplete ? 0.8 : 1,
      lineage_coverage: record.replay_state === "MISMATCH" ? 0.8 : 1,
    }),
  });
}

export function createInvalidReplayDisplay(record: ReplayViewerRecord): InvalidReplayDisplay {
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    invalid_reasons: record.replay_state === "INVALID"
      ? Object.freeze(["Replay artifact failed integrity validation.", "Trusted interpretation is blocked."])
      : Object.freeze([]),
    trusted_interpretation_blocked: record.replay_state === "INVALID" || record.integrity.integrity_state === "CORRUPTED",
    escalation_required: record.replay_state === "INVALID" || record.integrity.tamper_detection_state === "CONFIRMED",
  });
}

export function createDeterminismGateDisplay(record: ReplayViewerRecord): DeterminismGateDisplay {
  const deterministic = record.reconstruction.determinism_state === "DETERMINISTIC";
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    determinism_state: record.reconstruction.determinism_state,
    same_inputs_same_hash: deterministic,
    stable_ordering: deterministic,
    nondeterministic_refs: record.reconstruction.determinism_state === "NONDETERMINISTIC" ? Object.freeze(["lineage.child_refs"]) : Object.freeze([]),
  });
}

export function createReplayTimeline(record: ReplayViewerRecord): readonly ReplayTimelineEvent[] {
  const stages: ReplayTimelineEvent["stage"][] = ["GOVERNANCE_CHECK", "INPUT_RECONSTRUCTION", "STATE_RECONSTRUCTION", "OUTPUT_VERIFICATION", "DETERMINISM_GATE", "INTEGRITY_CHECK"];
  return Object.freeze(stages.map((stage, index) => Object.freeze({
    event_id: `${record.replay_id}_${stage.toLowerCase()}`,
    replay_id: record.replay_id,
    stage,
    state: stage === "OUTPUT_VERIFICATION" ? record.reconstruction.output_verification_state : stage === "DETERMINISM_GATE" ? record.reconstruction.determinism_state : stage === "INTEGRITY_CHECK" ? record.integrity.integrity_state : "COMPLETE",
    timestamp: new Date(Date.parse(record.replay_summary.replay_timestamp) + index * 1000).toISOString(),
    refs: stage === "INPUT_RECONSTRUCTION" ? record.references.input_refs : stage === "GOVERNANCE_CHECK" ? record.references.governance_refs : record.references.replay_refs,
  })));
}

export function createReplayDiffDisplay(record: ReplayViewerRecord): ReplayDiffDisplay {
  return Object.freeze({
    replay_id: record.replay_id,
    truth_record_id: record.truth_record_id,
    diff_state: record.visibility.redacted ? "REDACTED_DIFF" : record.replay_state === "MISMATCH" ? "DIFF_PRESENT" : record.replay_state === "INCOMPLETE" ? "NOT_COMPARABLE" : "NO_DIFF",
    field_mismatches: record.replay_state === "MISMATCH" ? Object.freeze([mismatch]) : Object.freeze([]),
    redacted: record.visibility.redacted,
  });
}

function warnings(record: ReplayViewerRecord): readonly string[] {
  return Object.freeze([
    record.replay_state === "MISMATCH" ? "Replay mismatch warning." : "",
    record.replay_state === "INCOMPLETE" ? "Incomplete replay warning." : "",
    record.replay_state === "INVALID" ? "Invalid replay warning; trusted interpretation is blocked." : "",
    record.integrity.integrity_state === "CORRUPTED" ? "Corrupted replay warning." : "",
    record.visibility.redacted ? "Restricted replay segments are redacted." : "",
    record.references.lineage_refs.length === 0 ? "Broken lineage warning." : "",
  ].filter(Boolean));
}

export function buildReplayViewerDetail(
  contract: ReplayViewerContract,
  replayId: string,
  records: readonly ReplayViewerRecord[] = buildReplayViewerSeedRecords(),
): ReplayViewerDetail {
  const source = records.find((record) => record.replay_id === replayId);
  if (!source || source.tenant_id !== contract.tenant_id) {
    const fallback = records.find((record) => record.tenant_id === contract.tenant_id) ?? records[0];
    const record = freezeRecord({ ...fallback, replay_state: "NOT_AVAILABLE", visibility: { ...fallback.visibility, access_result: "FAILED_CLOSED" } });
    return detailFor(record, "FAILED_CLOSED", ["Replay access failed closed."]);
  }
  const result = accessResult(contract, source);
  if (result === "DENIED") return detailFor(source, "DENIED", ["Replay access denied by governance policy."]);
  const visible = result === "REDACTED" ? redacted(source) : source;
  return detailFor(visible, result, warnings(visible));
}

function detailFor(record: ReplayViewerRecord, access_result: TruthDashboardAccessResult, warningList: readonly string[]): ReplayViewerDetail {
  return Object.freeze({
    record,
    summary: createReplaySummaryDisplay(record),
    input_reconstruction: createInputReconstructionDisplay(record),
    state_reconstruction: createStateReconstructionDisplay(record),
    output_verification: createOutputVerificationDisplay(record),
    mismatch_analysis: createReplayMismatchAnalysis(record),
    incomplete_replay: createIncompleteReplayDisplay(record),
    invalid_replay: createInvalidReplayDisplay(record),
    determinism: createDeterminismGateDisplay(record),
    timeline: createReplayTimeline(record),
    diff: createReplayDiffDisplay(record),
    evidence_refs: record.references.evidence_refs,
    lineage_refs: record.references.lineage_refs,
    governance_refs: record.references.governance_refs,
    warnings: Object.freeze([...warningList]),
    access_result,
  });
}

export function createReplayViewerAuditEvent(input: Readonly<{
  contract: ReplayViewerContract;
  event_type: ReplayViewerAuditEvent["event_type"];
  access_result: TruthDashboardAccessResult;
  replay_id?: string;
  truth_record_id?: string;
  restriction_reason?: string;
  timestamp?: string;
}>): ReplayViewerAuditEvent {
  return Object.freeze({
    audit_event_id: hashValue("mission-control-replay-viewer-audit-event-id", {
      replay_viewer_id: input.contract.replay_viewer_id,
      event_type: input.event_type,
      replay_id: input.replay_id,
      truth_record_id: input.truth_record_id,
      timestamp: input.timestamp ?? NOW,
    }),
    replay_viewer_id: input.contract.replay_viewer_id,
    replay_id: input.replay_id,
    truth_record_id: input.truth_record_id,
    tenant_id: input.contract.tenant_id,
    operator_id: input.contract.operator_id,
    event_type: input.event_type,
    access_result: input.access_result,
    timestamp: input.timestamp ?? NOW,
    governance_context: Object.freeze({
      policy_id: "replay_viewer_read_only_policy",
      access_level: input.contract.scope.access_level,
      restriction_reason: input.restriction_reason,
    }),
    appendOnly: true,
    sourceMutationAllowed: false,
  });
}

export function buildReplayViewerView(input: Readonly<{
  tenant_id?: string;
  operator_id?: string;
  mission_id?: string;
  selected_replay_id?: string;
  access_level?: TruthDashboardAccessLevel;
}> = {}): ReplayViewerView {
  const contract = buildReplayViewerContract({
    tenant_id: input.tenant_id ?? "tenant_alpha",
    operator_id: input.operator_id ?? "operator_console",
    mission_ids: [input.mission_id ?? "mission_query_layer"],
    access_level: input.access_level ?? "RESTRICTED_READ",
  });
  const query: ReplayViewerQuery = {
    tenant_id: contract.tenant_id,
    operator_id: contract.operator_id,
    filters: { mission_id: input.mission_id ?? "mission_query_layer" },
    governance_context: {
      access_level: contract.scope.access_level,
      restricted_access_allowed: contract.scope.access_level === "RESTRICTED_READ",
    },
  };
  const records = queryReplayViewerRecords(contract, query);
  const selected = buildReplayViewerDetail(contract, input.selected_replay_id ?? records[0]?.replay_id ?? "replay_cert_6j5_000001");
  const auditEvents = Object.freeze([
    createReplayViewerAuditEvent({ contract, event_type: "REPLAY_VIEWER_OPENED", access_result: "ALLOWED" }),
    createReplayViewerAuditEvent({
      contract,
      event_type: selected.access_result === "REDACTED" ? "REDACTED_REPLAY_VIEWED" : "REPLAY_RECORD_VIEWED",
      access_result: selected.access_result,
      replay_id: selected.record.replay_id,
      truth_record_id: selected.record.truth_record_id,
      restriction_reason: selected.record.visibility.restriction_reason,
    }),
  ]);
  const restricted = records.some((record) => record.visibility.redacted);
  const degraded = records.some((record) => record.replay_state !== "REPRODUCED" || record.integrity.integrity_state !== "VALID");
  return Object.freeze({
    contract,
    state: records.length === 0 ? "FAIL_CLOSED" : restricted ? "RESTRICTED" : degraded ? "DEGRADED" : "READY",
    records,
    selected_replay: selected,
    audit_events: auditEvents,
    available_filters: Object.freeze({
      replay_states: unique(records.map((record) => record.replay_state)) as readonly ReplayState[],
      target_types: unique(records.map((record) => record.replay_target.target_type)) as readonly ReplayTargetType[],
      integrity_states: unique(records.map((record) => record.integrity.integrity_state)) as readonly TruthDashboardIntegrityState[],
    }),
    guardrails: Object.freeze([
      "read-only reconstruction visibility",
      "tenant isolation",
      "operator access verification",
      "restricted replay redaction",
      "no replay mutation",
      "no truth record mutation",
      "no evidence modification",
      "no lineage rewrite",
      "no governance override",
      "no approval authority",
      "no execution authority",
      "fail-closed behavior",
    ]),
    query_hash: hashValue("mission-control-replay-viewer-query-hash", query),
    generated_at: NOW,
    readOnly: true,
    replayMutationAllowed: false,
    truthRecordMutationAllowed: false,
    approvalAllowed: false,
    executionAllowed: false,
  });
}

export function assertReplayViewerActionBlocked(action: "MUTATE_REPLAY" | "MUTATE_TRUTH_RECORD" | "MODIFY_EVIDENCE" | "REWRITE_LINEAGE" | "OVERRIDE_GOVERNANCE" | "APPROVE_RECOMMENDATION" | "EXECUTE_DECISION" | "RERUN_REPLAY"): never {
  throw new Error(`Replay Viewer is read-only and blocks ${action}.`);
}
