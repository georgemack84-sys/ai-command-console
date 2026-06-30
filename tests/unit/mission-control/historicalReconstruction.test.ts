import { describe, expect, it } from "vitest";
import {
  createHistoricalReconstructionAuditRecord,
  createHistoricalReconstructionReplayMetadata,
  reconstructHistoricalTruthLedger,
} from "@/services/mission-control";
import type {
  TruthHistoricalIndexRecord,
  TruthHistoricalReconstructionQuery,
  TruthLedgerQueryContract,
} from "@/services/mission-control";

function contract(overrides: Partial<TruthLedgerQueryContract> = {}): TruthLedgerQueryContract {
  return {
    query_id: "query_6j3_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    operator_id: "operator_17",
    requester_type: "OPERATOR",
    query_type: "TIMELINE_QUERY",
    query_scope: {
      tenant_scope: { tenant_id: "tenant_alpha", allow_cross_tenant: false },
      mission_scope: { mission_id: "mission_042" },
    },
    requested_records: { truth_record_ids: ["truth_decision_340"], integrity_states: ["VALID"] },
    requested_views: ["SUMMARY", "GOVERNANCE_VIEW", "REPLAY_VIEW", "INTEGRITY_VIEW"],
    authority_context: {
      authority_id: "auth_778",
      operator_role: "MISSION_SUPERVISOR",
      permissions: [
        "truth.history.record.read",
        "truth.history.mission.read",
        "truth.history.timeline.read",
        "truth.history.decision.read",
        "truth.history.recommendation.read",
        "truth.history.evidence.read",
        "truth.history.governance.read",
        "truth.history.lineage.read",
        "truth.history.diff.read",
        "truth.history.changeset.read",
        "truth.history.incident.read",
        "truth.history.certification.read",
      ],
      authority_scope: ["tenant_alpha", "mission_042"],
      authority_verified: true,
      verification_ref: "authority_check_778",
    },
    governance_context: {
      governance_policy_refs: ["policy_truth_history_v1"],
      constitutional_rules_applied: ["tenant_isolation"],
      restrictions: [],
      escalation_required: false,
      fail_closed_required: true,
    },
    integrity_requirements: {
      require_hash_validation: true,
      require_chain_validation: true,
      require_tamper_check: true,
      minimum_integrity_state: "VALID",
    },
    replay_requirements: {
      replay_required: true,
      deterministic_order_required: true,
      include_query_hash: true,
      include_result_hash: true,
      replay_ref: "replay_hist_7001",
    },
    redaction_policy: {
      redaction_required: false,
      redaction_level: "NONE",
      restricted_fields: [],
      reason: "Authorized historical reconstruction.",
    },
    pagination_policy: { limit: 100, deterministic_cursor_required: true },
    ordering_policy: { order_by: "created_at", direction: "ASC", tie_breaker: "truth_record_id" },
    created_at: "2026-06-24T12:00:00.000Z",
    expires_at: "2026-06-24T12:15:00.000Z",
    query_reason: "Operator reconstructing historical ledger context.",
    ...overrides,
  };
}

function query(overrides: Partial<TruthHistoricalReconstructionQuery> = {}): TruthHistoricalReconstructionQuery {
  return {
    reconstruction_query_id: "hist_6j3_001",
    query_contract_ref: "query_6j3_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    operator_id: "operator_17",
    reconstruction_type: "DECISION_HISTORY",
    temporal_anchor: { anchor_type: "KNOWN_AS_OF", as_of_time: "2026-06-20T15:00:00.000Z" },
    target_records: { decision_ids: ["decision_340"] },
    target_context: {
      include_recommendations: true,
      include_decisions: true,
      include_evidence: true,
      include_governance: true,
      include_risk: true,
      include_confidence: true,
      include_escalations: true,
      include_runtime_events: false,
      include_integrity_events: true,
      include_certification_events: false,
    },
    authority_context_ref: "authority_check_778",
    governance_context_ref: "governance_eval_332",
    integrity_requirements_ref: "integrity_req_991",
    replay_requirements_ref: "replay_req_115",
    include_lineage: true,
    include_evidence: true,
    include_governance: true,
    include_replay_refs: true,
    include_integrity_state: true,
    include_supersession_history: true,
    include_late_arriving_records: false,
    lineage_depth: 3,
    evidence_depth: 2,
    relationship_depth: 3,
    ordering_policy: { order_by: "recorded_at", direction: "ASC", tie_breakers: ["event_sequence", "truth_record_id"] },
    redaction_policy_ref: "redaction_policy_441",
    created_at: "2026-06-24T12:00:01.000Z",
    ...overrides,
  };
}

function record(overrides: Partial<TruthHistoricalIndexRecord> = {}): TruthHistoricalIndexRecord {
  return {
    historical_index_id: "hist_idx_decision_340",
    index_version: "historical-index/v1",
    truth_record_id: "truth_decision_340",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    record_type: "GOVERNANCE_APPROVED",
    recorded_at: "2026-06-20T14:30:00.000Z",
    occurred_at: "2026-06-20T14:25:00.000Z",
    verified_at: "2026-06-20T14:35:00.000Z",
    effective_at: "2026-06-20T14:40:00.000Z",
    valid_from: "2026-06-20T14:30:00.000Z",
    lifecycle_state: "ACTIVE",
    parent_refs: ["truth_rec_204"],
    child_refs: [],
    evidence_refs: ["evidence_881"],
    governance_refs: ["gov_117"],
    replay_refs: ["replay_612"],
    recommendation_refs: ["rec_204"],
    decision_refs: ["decision_340"],
    risk_refs: ["risk_504"],
    confidence_refs: ["confidence_733"],
    escalation_refs: [],
    lineage_refs: ["lineage_901"],
    source_record_hash: "source_hash_decision_340",
    index_record_hash: "index_hash_decision_340",
    integrity_state: "VALID",
    active_version_ref: "decision_340_v1",
    decision_id: "decision_340",
    event_summary: "Decision approved mission scope tightening.",
    event_sequence: 2,
    ...overrides,
  };
}

function recommendation(overrides: Partial<TruthHistoricalIndexRecord> = {}): TruthHistoricalIndexRecord {
  return record({
    historical_index_id: "hist_idx_rec_204",
    truth_record_id: "truth_rec_204",
    record_type: "RECOMMENDATION_CREATED",
    recorded_at: "2026-06-20T14:12:00.000Z",
    occurred_at: "2026-06-20T14:10:00.000Z",
    verified_at: "2026-06-20T14:13:00.000Z",
    parent_refs: [],
    child_refs: ["truth_decision_340"],
    recommendation_id: "rec_204",
    decision_id: undefined,
    decision_refs: ["decision_340"],
    evidence_refs: ["evidence_881", "evidence_882"],
    event_summary: "Recommendation recorded before decision.",
    event_sequence: 1,
    ...overrides,
  });
}

function evidence(overrides: Partial<TruthHistoricalIndexRecord> = {}): TruthHistoricalIndexRecord {
  return record({
    historical_index_id: "hist_idx_evidence_881",
    truth_record_id: "truth_evidence_881",
    record_type: "OBSERVATION_CREATED",
    recorded_at: "2026-06-20T14:05:00.000Z",
    occurred_at: "2026-06-20T14:00:00.000Z",
    verified_at: "2026-06-20T14:06:00.000Z",
    parent_refs: [],
    child_refs: ["truth_rec_204"],
    evidence_refs: [],
    evidence_id: "evidence_881",
    decision_id: undefined,
    recommendation_id: undefined,
    event_summary: "Evidence supports mission scope tightening.",
    event_sequence: 0,
    ...overrides,
  });
}

const index = () => [evidence(), recommendation(), record()];

describe("Mission Control Phase 6J.3 Historical Reconstruction Queries", () => {
  it("valid as-of record reconstruction passes", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "AS_OF_RECORD_STATE", target_records: { truth_record_ids: ["truth_decision_340"] } }), index());
    expect(response.result_state).toBe("RECONSTRUCTED");
    expect(response.reconstructed_records[0].truth_record_id).toBe("truth_decision_340");
  });

  it("valid decision history reconstruction passes", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query(), index()).result_state).toBe("RECONSTRUCTED");
  });

  it("valid recommendation history reconstruction passes", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "RECOMMENDATION_HISTORY", target_records: { recommendation_ids: ["rec_204"] } }), index());
    expect(response.recommendation_history_refs).toContain("rec_204");
  });

  it("valid evidence history reconstruction passes", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "EVIDENCE_HISTORY", target_records: { evidence_ids: ["evidence_881"] } }), index());
    expect(response.evidence_history_refs).toContain("evidence_881");
  });

  it("valid timeline reconstruction passes", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "TIMELINE_RECONSTRUCTION", target_records: {} }), index());
    expect(response.timeline_events.map((item) => item.truth_record_id)).toEqual(["truth_evidence_881", "truth_rec_204", "truth_decision_340"]);
  });

  it("valid between-time diff passes", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "BETWEEN_TIME_DIFF", temporal_anchor: { anchor_type: "BETWEEN_TIMES", start_time: "2026-06-20T14:00:00.000Z", end_time: "2026-06-20T14:20:00.000Z" }, target_records: {} }), index());
    expect(response.result_state).toBe("RECONSTRUCTED");
    expect(response.timeline_events.length).toBe(2);
  });

  it("reconstruction without Query Contract fails", () => {
    expect(reconstructHistoricalTruthLedger(undefined, query(), index()).result_state).toBe("INVALID_QUERY");
  });

  it("reconstruction without tenant scope fails", () => {
    expect(reconstructHistoricalTruthLedger(contract({ query_scope: {} as TruthLedgerQueryContract["query_scope"] }), query(), index()).result_state).toBe("INVALID_QUERY");
  });

  it("reconstruction without temporal anchor fails", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query({ temporal_anchor: {} as TruthHistoricalReconstructionQuery["temporal_anchor"] }), index()).result_state).toBe("INVALID_QUERY");
  });

  it("invalid time window fails", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ temporal_anchor: { anchor_type: "BETWEEN_TIMES", start_time: "2026-06-21T00:00:00.000Z", end_time: "2026-06-20T00:00:00.000Z" } }), index());
    expect(response.result_state).toBe("INVALID_QUERY");
  });

  it("unauthorized historical reconstruction fails", () => {
    const c = contract({ authority_context: { ...contract().authority_context, permissions: [] } });
    expect(reconstructHistoricalTruthLedger(c, query(), index()).result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("cross-tenant reconstruction without authorization fails", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query({ tenant_id: "tenant_beta" }), [record({ tenant_id: "tenant_beta" })]).result_state).toBe("INVALID_QUERY");
  });

  it("restricted historical record returned raw fails", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query(), [record({ restricted: true, restricted_fields: ["decision_rationale"] })]).result_state).toBe("GOVERNANCE_BLOCKED");
  });

  it("restricted historical record returned redacted passes", () => {
    const c = contract({ redaction_policy: { redaction_required: true, redaction_level: "PARTIAL", restricted_fields: ["decision_rationale"], reason: "Restricted history." } });
    const response = reconstructHistoricalTruthLedger(c, query(), [record({ restricted: true, restricted_fields: ["decision_rationale"] })]);
    expect(response.result_state).toBe("REDACTED");
    expect(response.redaction_applied).toBe(true);
  });

  it("late-arriving evidence excluded from KNOWN_AS_OF", () => {
    const late = evidence({ evidence_id: "evidence_late", truth_record_id: "truth_evidence_late", occurred_at: "2026-06-20T13:00:00.000Z", recorded_at: "2026-06-20T16:00:00.000Z" });
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "TIMELINE_RECONSTRUCTION", target_records: {} }), [...index(), late]);
    expect(response.reconstructed_records.some((item) => item.truth_record_id === "truth_evidence_late")).toBe(false);
  });

  it("late-arriving evidence flagged when included", () => {
    const late = evidence({ evidence_id: "evidence_late", truth_record_id: "truth_evidence_late", occurred_at: "2026-06-20T13:00:00.000Z", recorded_at: "2026-06-20T16:00:00.000Z" });
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "TIMELINE_RECONSTRUCTION", target_records: {}, include_late_arriving_records: true }), [...index(), late]);
    expect(response.gaps.some((item) => item.gap_type === "LATE_ARRIVING_RECORD")).toBe(true);
  });

  it("evidence recorded after anchor is not treated as known at anchor", () => {
    const late = evidence({ evidence_id: "evidence_late", truth_record_id: "truth_evidence_late", occurred_at: "2026-06-20T13:00:00.000Z", recorded_at: "2026-06-20T16:00:00.000Z" });
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "EVIDENCE_HISTORY", target_records: { evidence_ids: ["evidence_late"] } }), [late]);
    expect(response.result_state).toBe("EMPTY");
  });

  it("superseded record reconstructed as active before supersession", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ temporal_anchor: { anchor_type: "KNOWN_AS_OF", as_of_time: "2026-06-20T15:00:00.000Z" } }), [record({ valid_to: "2026-06-21T00:00:00.000Z", superseded_by_ref: "decision_340_v2" })]);
    expect(response.reconstructed_records[0].lifecycle_state_as_of_anchor).toBe("ACTIVE");
  });

  it("superseded record reconstructed as superseded after supersession", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ temporal_anchor: { anchor_type: "KNOWN_AS_OF", as_of_time: "2026-06-22T00:00:00.000Z" } }), [record({ valid_to: "2026-06-21T00:00:00.000Z", superseded_by_ref: "decision_340_v2" })]);
    expect(response.reconstructed_records[0].lifecycle_state_as_of_anchor).toBe("SUPERSEDED");
  });

  it("decision history includes recommendation refs", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query(), index()).recommendation_history_refs).toContain("rec_204");
  });

  it("decision history includes evidence refs", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query(), index()).evidence_history_refs).toContain("evidence_881");
  });

  it("decision history includes governance refs", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query(), index()).governance_history_refs).toContain("gov_117");
  });

  it("recommendation history includes support and conflict evidence", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "RECOMMENDATION_HISTORY", target_records: { recommendation_ids: ["rec_204"] } }), [recommendation({ evidence_refs: ["evidence_881"], conflicting_record_refs: ["evidence_conflict"] })]);
    expect(response.evidence_history_refs).toContain("evidence_881");
    expect(response.result_state).toBe("CONFLICT_DETECTED");
  });

  it("evidence history includes integrity state", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query({ reconstruction_type: "EVIDENCE_HISTORY", target_records: { evidence_ids: ["evidence_881"] } }), [evidence()]).reconstructed_records[0].integrity_state_as_of_anchor).toBe("VALID");
  });

  it("missing evidence reference detected", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query(), [record({ missing_evidence_refs: ["evidence_missing"] })]);
    expect(response.result_state).toBe("GAP_DETECTED");
  });

  it("broken lineage detected", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query(), [record({ parent_refs: ["missing_parent"] })]);
    expect(response.gaps.some((item) => item.gap_type === "BROKEN_LINEAGE")).toBe(true);
  });

  it("corrupted hash chain blocked", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query(), [record({ broken_hash_chain: true })]);
    expect(response.result_state).toBe("INTEGRITY_BLOCKED");
  });

  it("degraded integrity returned with warning or restriction", () => {
    const c = contract({ integrity_requirements: { ...contract().integrity_requirements, minimum_integrity_state: "DEGRADED" } });
    const response = reconstructHistoricalTruthLedger(c, query(), [record({ integrity_state: "DEGRADED" })]);
    expect(response.result_state).toBe("PARTIAL");
    expect(response.warnings.some((warning) => warning.includes("integrity-degraded"))).toBe(true);
  });

  it("nondeterministic timeline ordering fails", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query({ ordering_policy: { order_by: "recorded_at", direction: "ASC", tie_breakers: [] } }), index()).result_state).toBe("INVALID_QUERY");
  });

  it("deterministic timeline ordering with tie breaker passes", () => {
    expect(reconstructHistoricalTruthLedger(contract(), query(), index()).timeline_events[0].truth_record_id).toBe("truth_evidence_881");
  });

  it("same query produces same reconstruction hash", () => {
    const first = reconstructHistoricalTruthLedger(contract(), query(), index());
    const second = reconstructHistoricalTruthLedger(contract(), query(), index());
    expect(first.reconstruction_hash).toBe(second.reconstruction_hash);
  });

  it("reconstruction audit record generated", () => {
    const c = contract();
    const q = query();
    const response = reconstructHistoricalTruthLedger(c, q, index());
    const audit = createHistoricalReconstructionAuditRecord(c, q, response);
    const replay = createHistoricalReconstructionReplayMetadata(q, response);
    expect(audit.reconstruction_hash).toBe(response.reconstruction_hash);
    expect(replay.temporal_anchor_hash).toBeTruthy();
  });

  it("reconstruction attempts mutation fails", () => {
    const response = reconstructHistoricalTruthLedger(contract(), query(), index(), { mutation_attempted: true });
    expect(response.result_state).toBe("INVALID_QUERY");
    expect(response.sourceMutationAllowed).toBe(false);
  });
});
