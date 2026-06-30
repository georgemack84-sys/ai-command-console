import { describe, expect, it } from "vitest";
import {
  createTruthLedgerSearchAuditRecord,
  createTruthLedgerSearchReplayMetadata,
  searchTruthLedger,
} from "@/services/mission-control";
import type {
  TruthLedgerQueryContract,
  TruthLedgerSearchIndexRecord,
  TruthLedgerSearchRequest,
} from "@/services/mission-control";

function contract(overrides: Partial<TruthLedgerQueryContract> = {}): TruthLedgerQueryContract {
  return {
    query_id: "query_6j2_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    operator_id: "operator_17",
    requester_type: "OPERATOR",
    query_type: "RECOMMENDATION_LOOKUP",
    query_scope: {
      tenant_scope: {
        tenant_id: "tenant_alpha",
        allow_cross_tenant: false,
      },
      mission_scope: {
        mission_id: "mission_042",
      },
    },
    requested_records: {
      truth_record_ids: ["truth_rec_204"],
      integrity_states: ["VALID"],
    },
    requested_views: ["SUMMARY", "EVIDENCE_VIEW", "GOVERNANCE_VIEW", "REPLAY_VIEW", "INTEGRITY_VIEW"],
    authority_context: {
      authority_id: "auth_778",
      operator_role: "MISSION_SUPERVISOR",
      permissions: [
        "truth.recommendation.read",
        "truth.decision.read",
        "truth.evidence.read",
        "truth.governance.read",
        "truth.replay.read",
        "truth.integrity.read",
      ],
      authority_scope: ["tenant_alpha", "mission_042"],
      authority_verified: true,
      verification_ref: "authority_check_778",
    },
    governance_context: {
      governance_policy_refs: ["policy_truth_read_v1"],
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
      replay_ref: "search_replay_7001",
    },
    redaction_policy: {
      redaction_required: false,
      redaction_level: "NONE",
      restricted_fields: [],
      reason: "Authorized search.",
    },
    pagination_policy: {
      limit: 50,
      deterministic_cursor_required: true,
    },
    ordering_policy: {
      order_by: "created_at",
      direction: "ASC",
      tie_breaker: "truth_record_id",
    },
    created_at: "2026-06-24T11:00:00.000Z",
    expires_at: "2026-06-24T11:15:00.000Z",
    query_reason: "Operator reviewing search context.",
    ...overrides,
  };
}

function request(overrides: Partial<TruthLedgerSearchRequest> = {}): TruthLedgerSearchRequest {
  return {
    search_id: "search_6j2_001",
    query_contract_ref: "query_6j2_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    lookup_type: "RECOMMENDATION_LOOKUP",
    search_mode: "COMBINED_SEARCH",
    search_terms: ["scope", "risk"],
    filters: {
      recommendation_states: ["SUPPORTED"],
      integrity_states: ["VALID"],
    },
    requested_views: ["SUMMARY_VIEW", "EVIDENCE_VIEW", "GOVERNANCE_VIEW", "REPLAY_VIEW", "INTEGRITY_VIEW"],
    authority_context_ref: "authority_check_778",
    governance_context_ref: "governance_eval_332",
    integrity_requirements_ref: "integrity_req_991",
    replay_requirements_ref: "replay_req_115",
    ordering_policy: {
      order_by: "created_at",
      direction: "ASC",
      tie_breakers: ["truth_record_id"],
    },
    pagination_policy: {
      limit: 50,
      deterministic_cursor_required: true,
      max_limit: 100,
    },
    created_at: "2026-06-24T11:00:01.000Z",
    ...overrides,
  };
}

function recommendation(overrides: Partial<TruthLedgerSearchIndexRecord> = {}): TruthLedgerSearchIndexRecord {
  return {
    index_record_id: "idx_rec_204",
    index_version: "search-index/v1",
    truth_record_id: "truth_rec_204",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    record_type: "RECOMMENDATION_CREATED",
    lookup_type: "RECOMMENDATION_LOOKUP",
    searchable_fields: ["Tighten mission scope due to elevated risk."],
    searchable_tokens: ["tighten", "mission", "scope", "risk"],
    relationship_refs: ["evidence_881", "decision_340"],
    lineage_refs: ["lineage_901"],
    governance_refs: ["gov_117"],
    replay_refs: ["replay_612"],
    integrity_state: "VALID",
    lifecycle_state: "ACTIVE",
    created_at: "2026-06-24T10:00:00.000Z",
    indexed_at: "2026-06-24T10:00:01.000Z",
    source_record_hash: "source_hash_rec_204",
    index_record_hash: "index_hash_rec_204",
    recommendation_id: "rec_204",
    recommendation_state: "SUPPORTED",
    recommendation_summary: "Tighten mission scope due to elevated risk and reduced confidence.",
    recommendation_type: "MISSION_SCOPE",
    supporting_evidence_refs: ["evidence_881", "evidence_882"],
    conflicting_evidence_refs: ["evidence_883"],
    risk_refs: ["risk_504"],
    confidence_refs: ["confidence_733"],
    decision_refs: ["decision_340"],
    ...overrides,
  };
}

function decision(overrides: Partial<TruthLedgerSearchIndexRecord> = {}): TruthLedgerSearchIndexRecord {
  return recommendation({
    index_record_id: "idx_decision_340",
    truth_record_id: "truth_decision_340",
    record_type: "GOVERNANCE_APPROVED",
    lookup_type: "DECISION_LOOKUP",
    searchable_fields: ["Decision approved mission scope tightening."],
    searchable_tokens: ["decision", "approved", "mission", "scope"],
    decision_id: "decision_340",
    decision_state: "APPROVED",
    decision_summary: "Approved mission scope tightening.",
    decision_rationale_refs: ["rationale_001"],
    recommendation_refs: ["rec_204"],
    evidence_refs: ["evidence_881"],
    operator_refs: ["operator_17"],
    ...overrides,
  });
}

function evidence(overrides: Partial<TruthLedgerSearchIndexRecord> = {}): TruthLedgerSearchIndexRecord {
  return recommendation({
    index_record_id: "idx_evidence_881",
    truth_record_id: "truth_evidence_881",
    record_type: "OBSERVATION_CREATED",
    lookup_type: "EVIDENCE_LOOKUP",
    searchable_fields: ["Risk signal supports mission scope tightening."],
    searchable_tokens: ["risk", "signal", "supports", "scope"],
    evidence_id: "evidence_881",
    evidence_type: "SIGNAL",
    evidence_state: "VERIFIED",
    evidence_summary: "Risk signal supports mission scope tightening.",
    evidence_source_ref: "source_991",
    supports_record_refs: ["rec_204"],
    conflicts_with_record_refs: ["rec_999"],
    depends_on_record_refs: ["signal_001"],
    influenced_record_refs: ["decision_340"],
    ...overrides,
  });
}

describe("Mission Control Phase 6J.2 Search Engine", () => {
  it("valid recommendation lookup passes", () => {
    const response = searchTruthLedger(contract(), request(), [recommendation()]);
    expect(response.result_state).toBe("COMPLETE");
    expect(response.result_count).toBe(1);
  });

  it("valid decision lookup passes", () => {
    const c = contract({ query_type: "TRUTH_RECORD_LOOKUP" });
    const r = request({ lookup_type: "DECISION_LOOKUP", search_terms: ["decision"], filters: { decision_states: ["APPROVED"] } });
    expect(searchTruthLedger(c, r, [decision()]).result_state).toBe("COMPLETE");
  });

  it("valid evidence lookup passes", () => {
    const c = contract({ query_type: "EVIDENCE_LOOKUP" });
    const r = request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: { evidence_states: ["VERIFIED"] } });
    expect(searchTruthLedger(c, r, [evidence()]).result_state).toBe("COMPLETE");
  });

  it("search without Query Contract fails", () => {
    expect(searchTruthLedger(undefined, request(), [recommendation()]).result_state).toBe("INVALID_QUERY");
  });

  it("search without tenant scope fails", () => {
    const response = searchTruthLedger(contract({ query_scope: {} as TruthLedgerQueryContract["query_scope"] }), request(), [recommendation()]);
    expect(response.result_state).toBe("INVALID_QUERY");
  });

  it("unsupported lookup type fails", () => {
    const response = searchTruthLedger(contract(), request({ lookup_type: "UNKNOWN" as TruthLedgerSearchRequest["lookup_type"] }), [recommendation()]);
    expect(response.result_state).toBe("INVALID_QUERY");
  });

  it("recommendation lookup returns evidence refs", () => {
    const result = searchTruthLedger(contract(), request(), [recommendation()]).results[0];
    expect("supporting_evidence_refs" in result ? result.supporting_evidence_refs : []).toContain("evidence_881");
  });

  it("recommendation lookup returns governance refs", () => {
    const result = searchTruthLedger(contract(), request(), [recommendation()]).results[0];
    expect(result.governance_refs).toContain("gov_117");
  });

  it("recommendation lookup returns replay refs", () => {
    const result = searchTruthLedger(contract(), request(), [recommendation()]).results[0];
    expect(result.replay_refs).toContain("replay_612");
  });

  it("decision lookup returns recommendation refs", () => {
    const result = searchTruthLedger(contract({ query_type: "TRUTH_RECORD_LOOKUP" }), request({ lookup_type: "DECISION_LOOKUP", search_terms: ["decision"], filters: {} }), [decision()]).results[0];
    expect("recommendation_refs" in result ? result.recommendation_refs : []).toContain("rec_204");
  });

  it("decision lookup returns evidence refs", () => {
    const result = searchTruthLedger(contract({ query_type: "TRUTH_RECORD_LOOKUP" }), request({ lookup_type: "DECISION_LOOKUP", search_terms: ["decision"], filters: {} }), [decision()]).results[0];
    expect("evidence_refs" in result ? result.evidence_refs : []).toContain("evidence_881");
  });

  it("decision lookup returns governance refs", () => {
    const result = searchTruthLedger(contract({ query_type: "TRUTH_RECORD_LOOKUP" }), request({ lookup_type: "DECISION_LOOKUP", search_terms: ["decision"], filters: {} }), [decision()]).results[0];
    expect(result.governance_refs).toContain("gov_117");
  });

  it("evidence lookup returns support relationships", () => {
    const result = searchTruthLedger(contract({ query_type: "EVIDENCE_LOOKUP" }), request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: {} }), [evidence()]).results[0];
    expect("supports_record_refs" in result ? result.supports_record_refs : []).toContain("rec_204");
  });

  it("evidence lookup returns conflict relationships", () => {
    const result = searchTruthLedger(contract({ query_type: "EVIDENCE_LOOKUP" }), request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: {} }), [evidence()]).results[0];
    expect("conflicts_with_record_refs" in result ? result.conflicts_with_record_refs : []).toContain("rec_999");
  });

  it("evidence lookup returns integrity state", () => {
    const result = searchTruthLedger(contract({ query_type: "EVIDENCE_LOOKUP" }), request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: {} }), [evidence()]).results[0];
    expect(result.integrity_state).toBe("VALID");
  });

  it("unauthorized recommendation lookup fails", () => {
    const c = contract({ authority_context: { ...contract().authority_context, permissions: [] } });
    expect(searchTruthLedger(c, request(), [recommendation()]).result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("unauthorized decision lookup fails", () => {
    const c = contract({ query_type: "TRUTH_RECORD_LOOKUP", authority_context: { ...contract().authority_context, permissions: ["truth.recommendation.read"] } });
    expect(searchTruthLedger(c, request({ lookup_type: "DECISION_LOOKUP", search_terms: ["decision"], filters: {} }), [decision()]).result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("unauthorized evidence lookup fails", () => {
    const c = contract({ query_type: "EVIDENCE_LOOKUP", authority_context: { ...contract().authority_context, permissions: ["truth.recommendation.read"] } });
    expect(searchTruthLedger(c, request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: {} }), [evidence()]).result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("cross-tenant search without authorization fails", () => {
    const response = searchTruthLedger(contract(), request({ tenant_id: "tenant_beta" }), [recommendation({ tenant_id: "tenant_beta" })]);
    expect(response.result_state).toBe("INVALID_QUERY");
  });

  it("restricted evidence returned without redaction fails", () => {
    const response = searchTruthLedger(contract({ query_type: "EVIDENCE_LOOKUP" }), request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: {} }), [evidence({ restricted: true, restricted_fields: ["evidence_source_ref"] })]);
    expect(response.result_state).toBe("DENIED");
  });

  it("corrupted evidence returned as trusted fails", () => {
    const response = searchTruthLedger(contract({ query_type: "EVIDENCE_LOOKUP" }), request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], filters: {} }), [evidence({ integrity_state: "CORRUPTED" })]);
    expect(response.result_state).toBe("INTEGRITY_BLOCKED");
  });

  it("degraded evidence returned without warning fails", () => {
    const response = searchTruthLedger(contract({ query_type: "EVIDENCE_LOOKUP", integrity_requirements: { ...contract().integrity_requirements, minimum_integrity_state: "DEGRADED" } }), request({ lookup_type: "EVIDENCE_LOOKUP", search_terms: ["signal"], requested_views: ["SUMMARY_VIEW"], filters: {} }), [evidence({ integrity_state: "DEGRADED" })]);
    expect(response.result_state).toBe("INTEGRITY_BLOCKED");
  });

  it("nondeterministic ordering fails", () => {
    const response = searchTruthLedger(contract(), request({ ordering_policy: { order_by: "created_at", direction: "ASC", tie_breakers: [] } }), [recommendation()]);
    expect(response.result_state).toBe("INVALID_QUERY");
  });

  it("deterministic ordering with tie breaker passes", () => {
    const response = searchTruthLedger(contract(), request(), [
      recommendation({ truth_record_id: "truth_rec_205", recommendation_id: "rec_205" }),
      recommendation(),
    ]);
    expect(response.result_state).toBe("COMPLETE");
    expect(response.results[0].truth_record_id).toBe("truth_rec_204");
  });

  it("replay-required search without replay metadata fails", () => {
    const c = contract({ replay_requirements: { ...contract().replay_requirements, replay_ref: undefined } });
    expect(searchTruthLedger(c, request(), [recommendation()]).result_state).toBe("REPLAY_REQUIRED");
  });

  it("search result hash generated", () => {
    expect(searchTruthLedger(contract(), request(), [recommendation()]).result_hash).toBeTruthy();
  });

  it("search audit record generated", () => {
    const c = contract();
    const r = request();
    const response = searchTruthLedger(c, r, [recommendation()]);
    const audit = createTruthLedgerSearchAuditRecord(c, r, response);
    const replay = createTruthLedgerSearchReplayMetadata(r, response);
    expect(audit.result_hash).toBe(response.result_hash);
    expect(replay.filter_hash).toBeTruthy();
  });

  it("query attempts mutation fails", () => {
    const response = searchTruthLedger(contract(), request(), [recommendation()], { mutation_attempted: true });
    expect(response.result_state).toBe("INVALID_QUERY");
    expect(response.sourceMutationAllowed).toBe(false);
  });
});
