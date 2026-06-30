import { describe, expect, it } from "vitest";
import {
  correlateCrossLedgerRecords,
  createCrossLedgerCorrelationAuditRecord,
  createCrossLedgerCorrelationReplayMetadata,
} from "@/services/mission-control";
import type {
  TruthCrossLedgerCorrelationIndexRecord,
  TruthCrossLedgerCorrelationQuery,
  TruthCrossLedgerIndexedRelationship,
  TruthLedgerQueryContract,
} from "@/services/mission-control";

function contract(overrides: Partial<TruthLedgerQueryContract> = {}): TruthLedgerQueryContract {
  return {
    query_id: "query_6j4_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    operator_id: "operator_17",
    requester_type: "OPERATOR",
    query_type: "RELATIONSHIP_QUERY",
    query_scope: { tenant_scope: { tenant_id: "tenant_alpha", allow_cross_tenant: false }, mission_scope: { mission_id: "mission_042" } },
    requested_records: { truth_record_ids: ["truth_rec_204"], integrity_states: ["VALID"] },
    requested_views: ["SUMMARY", "GOVERNANCE_VIEW", "REPLAY_VIEW", "INTEGRITY_VIEW", "CERTIFICATION_VIEW"],
    authority_context: {
      authority_id: "auth_778",
      operator_role: "MISSION_SUPERVISOR",
      permissions: [
        "truth.crossledger.read",
        "truth.ledger.recommendation.read",
        "truth.ledger.decision.read",
        "truth.ledger.evidence.read",
        "truth.ledger.governance.read",
        "truth.ledger.replay.read",
        "truth.ledger.integrity.read",
        "truth.ledger.certification.read",
        "truth.ledger.lineage.read",
        "truth.ledger.audit.read",
        "truth.governance.read",
        "truth.replay.read",
        "truth.integrity.read",
        "truth.certification.read",
      ],
      authority_scope: ["tenant_alpha", "mission_042"],
      authority_verified: true,
      verification_ref: "authority_check_778",
    },
    governance_context: {
      governance_policy_refs: ["policy_cross_ledger_v1"],
      constitutional_rules_applied: ["tenant_isolation"],
      restrictions: [],
      escalation_required: false,
      fail_closed_required: true,
    },
    integrity_requirements: { require_hash_validation: true, require_chain_validation: true, require_tamper_check: true, minimum_integrity_state: "VALID" },
    replay_requirements: { replay_required: true, deterministic_order_required: true, include_query_hash: true, include_result_hash: true, replay_ref: "replay_corr_7001" },
    redaction_policy: { redaction_required: false, redaction_level: "NONE", restricted_fields: [], reason: "Authorized cross-ledger correlation." },
    pagination_policy: { limit: 100, deterministic_cursor_required: true },
    ordering_policy: { order_by: "created_at", direction: "ASC", tie_breaker: "truth_record_id" },
    created_at: "2026-06-24T13:00:00.000Z",
    expires_at: "2026-06-24T13:15:00.000Z",
    query_reason: "Operator correlating recommendation, decision, evidence, and governance context.",
    ...overrides,
  };
}

function query(overrides: Partial<TruthCrossLedgerCorrelationQuery> = {}): TruthCrossLedgerCorrelationQuery {
  return {
    correlation_query_id: "corr_6j4_001",
    query_contract_ref: "query_6j4_001",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    operator_id: "operator_17",
    correlation_type: "FULL_CONTEXT_CORRELATION",
    source_ledger: "RECOMMENDATION_LEDGER",
    target_ledgers: ["DECISION_LEDGER", "EVIDENCE_LEDGER", "GOVERNANCE_LEDGER", "REPLAY_LEDGER", "INTEGRITY_LEDGER", "CERTIFICATION_LEDGER", "LINEAGE_LEDGER"],
    seed_records: [{ ledger_type: "RECOMMENDATION_LEDGER", record_id: "rec_204", truth_record_id: "truth_rec_204", tenant_id: "tenant_alpha", mission_id: "mission_042" }],
    correlation_basis_allowed: ["DIRECT_REFERENCE", "PARENT_CHILD_LINEAGE", "SHARED_EVIDENCE", "SHARED_GOVERNANCE_RULE", "SHARED_REPLAY_REF", "SHARED_INTEGRITY_CHAIN", "SHARED_CERTIFICATION_REF", "TEMPORAL_OVERLAP", "MISSION_CONTEXT"],
    relationship_types_allowed: ["SUPPORTED_BY", "CONTRADICTED_BY", "DECIDED_FROM", "GOVERNED_BY", "RESTRICTED_BY", "REPLAYED_BY", "VERIFIED_BY", "CERTIFIED_BY", "DERIVED_FROM", "ASSOCIATED_WITH"],
    traversal_policy: {
      max_hops: 3,
      max_nodes: 100,
      max_edges: 200,
      allow_cycles: false,
      detect_cycles: true,
      stop_at_restricted_node: true,
      stop_at_corrupted_node: true,
      allowed_ledgers: ["RECOMMENDATION_LEDGER", "DECISION_LEDGER", "EVIDENCE_LEDGER", "GOVERNANCE_LEDGER", "REPLAY_LEDGER", "INTEGRITY_LEDGER", "CERTIFICATION_LEDGER", "LINEAGE_LEDGER"],
      blocked_ledgers: [],
      allowed_relationship_types: ["SUPPORTED_BY", "CONTRADICTED_BY", "DECIDED_FROM", "GOVERNED_BY", "RESTRICTED_BY", "REPLAYED_BY", "VERIFIED_BY", "CERTIFIED_BY", "DERIVED_FROM", "ASSOCIATED_WITH"],
    },
    temporal_policy: { temporal_mode: "CURRENT_LEDGER_STATE", include_late_arriving_records: false },
    existence_disclosure_policy: {
      allow_restricted_node_placeholder: false,
      allow_restricted_edge_placeholder: false,
      allow_restricted_counts: false,
      allow_restricted_ledger_type: false,
      disclosure_reason: "No disclosure without redaction.",
    },
    include_direct_correlations: true,
    include_indirect_correlations: true,
    include_candidate_correlations: false,
    include_conflicts: true,
    include_gaps: true,
    include_redacted_placeholders: false,
    requested_views: ["GRAPH_VIEW", "EVIDENCE_VIEW", "DECISION_VIEW", "GOVERNANCE_VIEW", "REPLAY_VIEW", "INTEGRITY_VIEW"],
    authority_context_ref: "authority_check_778",
    governance_context_ref: "governance_eval_332",
    integrity_requirements_ref: "integrity_check_991",
    replay_requirements_ref: "replay_req_115",
    redaction_policy_ref: "redaction_policy_441",
    ordering_policy: { node_order_by: "ledger_type", edge_order_by: "source_record_id", direction: "ASC", tie_breakers: ["record_id", "edge_id"] },
    created_at: "2026-06-24T13:00:01.000Z",
    ...overrides,
  };
}

function rel(overrides: Partial<TruthCrossLedgerIndexedRelationship>): TruthCrossLedgerIndexedRelationship {
  return {
    target_ledger: "DECISION_LEDGER",
    target_record_id: "decision_340",
    target_truth_record_id: "truth_decision_340",
    relationship_type: "DECIDED_FROM",
    correlation_basis: ["DIRECT_REFERENCE", "PARENT_CHILD_LINEAGE"],
    correlation_strength: "VERIFIED",
    direction: "FORWARD",
    evidence_refs: ["evidence_881"],
    governance_refs: ["gov_117"],
    replay_refs: ["replay_612"],
    lineage_refs: ["lineage_901"],
    integrity_refs: ["integrity_991"],
    ...overrides,
  };
}

function rec(overrides: Partial<TruthCrossLedgerCorrelationIndexRecord> = {}): TruthCrossLedgerCorrelationIndexRecord {
  return {
    correlation_index_id: "corr_idx_rec_204",
    index_version: "cross-ledger-index/v1",
    ledger_type: "RECOMMENDATION_LEDGER",
    record_id: "rec_204",
    truth_record_id: "truth_rec_204",
    tenant_id: "tenant_alpha",
    mission_id: "mission_042",
    record_type: "RECOMMENDATION_CREATED",
    lifecycle_state: "ACTIVE",
    summary: "Scope tightening recommendation due to elevated risk.",
    created_at: "2026-06-20T14:12:00.000Z",
    recorded_at: "2026-06-20T14:12:00.000Z",
    verified_at: "2026-06-20T14:13:00.000Z",
    source_record_hash: "source_rec_204",
    index_record_hash: "index_rec_204",
    integrity_state: "VALID",
    relationships: [
      rel({}),
      rel({ target_ledger: "EVIDENCE_LEDGER", target_record_id: "evidence_881", target_truth_record_id: "truth_evidence_881", relationship_type: "SUPPORTED_BY", correlation_basis: ["DIRECT_REFERENCE", "SHARED_EVIDENCE"] }),
      rel({ target_ledger: "GOVERNANCE_LEDGER", target_record_id: "gov_117", relationship_type: "GOVERNED_BY", correlation_basis: ["DIRECT_REFERENCE", "SHARED_GOVERNANCE_RULE"] }),
      rel({ target_ledger: "REPLAY_LEDGER", target_record_id: "replay_612", relationship_type: "REPLAYED_BY", correlation_basis: ["DIRECT_REFERENCE", "SHARED_REPLAY_REF"] }),
      rel({ target_ledger: "INTEGRITY_LEDGER", target_record_id: "integrity_991", relationship_type: "VERIFIED_BY", correlation_basis: ["DIRECT_REFERENCE", "SHARED_INTEGRITY_CHAIN"] }),
      rel({ target_ledger: "CERTIFICATION_LEDGER", target_record_id: "cert_441", relationship_type: "CERTIFIED_BY", correlation_basis: ["DIRECT_REFERENCE", "SHARED_CERTIFICATION_REF"] }),
    ],
    ...overrides,
  };
}

function node(ledger_type: TruthCrossLedgerCorrelationIndexRecord["ledger_type"], record_id: string, overrides: Partial<TruthCrossLedgerCorrelationIndexRecord> = {}): TruthCrossLedgerCorrelationIndexRecord {
  return rec({
    correlation_index_id: `corr_idx_${record_id}`,
    ledger_type,
    record_id,
    truth_record_id: `truth_${record_id}`,
    record_type: ledger_type === "EVIDENCE_LEDGER" ? "OBSERVATION_CREATED" : ledger_type === "DECISION_LEDGER" ? "GOVERNANCE_APPROVED" : "GOVERNANCE_ESCALATED",
    summary: `${ledger_type} ${record_id}`,
    relationships: [],
    ...overrides,
  });
}

const graph = () => [
  rec(),
  node("DECISION_LEDGER", "decision_340"),
  node("EVIDENCE_LEDGER", "evidence_881"),
  node("GOVERNANCE_LEDGER", "gov_117"),
  node("REPLAY_LEDGER", "replay_612"),
  node("INTEGRITY_LEDGER", "integrity_991"),
  node("CERTIFICATION_LEDGER", "cert_441"),
];

describe("Mission Control Phase 6J.4 Cross-Ledger Correlation Queries", () => {
  it("valid recommendation-to-decision correlation passes", () => {
    const response = correlateCrossLedgerRecords(contract(), query({ correlation_type: "RECOMMENDATION_TO_DECISION", target_ledgers: ["DECISION_LEDGER"] }), graph());
    expect(response.result_state).toBe("CORRELATED");
    expect(response.edges.some((edge) => edge.target_record_id === "decision_340")).toBe(true);
  });

  it("valid recommendation-to-evidence correlation passes", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ correlation_type: "RECOMMENDATION_TO_EVIDENCE", target_ledgers: ["EVIDENCE_LEDGER"] }), graph()).edges.some((edge) => edge.target_record_id === "evidence_881")).toBe(true);
  });

  it("valid decision-to-evidence correlation passes", () => {
    const decision = node("DECISION_LEDGER", "decision_340", { relationships: [rel({ target_ledger: "EVIDENCE_LEDGER", target_record_id: "evidence_881", relationship_type: "SUPPORTED_BY" })] });
    const q = query({ correlation_type: "DECISION_TO_EVIDENCE", source_ledger: "DECISION_LEDGER", seed_records: [{ ledger_type: "DECISION_LEDGER", record_id: "decision_340", tenant_id: "tenant_alpha" }], target_ledgers: ["EVIDENCE_LEDGER"] });
    expect(correlateCrossLedgerRecords(contract(), q, [decision, node("EVIDENCE_LEDGER", "evidence_881")]).result_state).toBe("CORRELATED");
  });

  it("valid decision-to-governance correlation passes", () => {
    const q = query({ correlation_type: "DECISION_TO_GOVERNANCE", target_ledgers: ["GOVERNANCE_LEDGER"] });
    expect(correlateCrossLedgerRecords(contract(), q, graph()).edges.some((edge) => edge.relationship_type === "GOVERNED_BY")).toBe(true);
  });

  it("valid decision-to-replay correlation passes", () => {
    const q = query({ correlation_type: "DECISION_TO_REPLAY", target_ledgers: ["REPLAY_LEDGER"] });
    expect(correlateCrossLedgerRecords(contract(), q, graph()).edges.some((edge) => edge.relationship_type === "REPLAYED_BY")).toBe(true);
  });

  it("valid evidence-to-integrity correlation passes", () => {
    const evidence = node("EVIDENCE_LEDGER", "evidence_881", { relationships: [rel({ target_ledger: "INTEGRITY_LEDGER", target_record_id: "integrity_991", relationship_type: "VERIFIED_BY" })] });
    const q = query({ correlation_type: "EVIDENCE_TO_INTEGRITY", source_ledger: "EVIDENCE_LEDGER", seed_records: [{ ledger_type: "EVIDENCE_LEDGER", record_id: "evidence_881", tenant_id: "tenant_alpha" }], target_ledgers: ["INTEGRITY_LEDGER"] });
    expect(correlateCrossLedgerRecords(contract(), q, [evidence, node("INTEGRITY_LEDGER", "integrity_991")]).result_state).toBe("CORRELATED");
  });

  it("valid certification-to-evidence correlation passes", () => {
    const cert = node("CERTIFICATION_LEDGER", "cert_441", { relationships: [rel({ target_ledger: "EVIDENCE_LEDGER", target_record_id: "evidence_881", relationship_type: "CERTIFIED_BY" })] });
    const q = query({ correlation_type: "CERTIFICATION_TO_EVIDENCE", source_ledger: "CERTIFICATION_LEDGER", seed_records: [{ ledger_type: "CERTIFICATION_LEDGER", record_id: "cert_441", tenant_id: "tenant_alpha" }], target_ledgers: ["EVIDENCE_LEDGER"] });
    expect(correlateCrossLedgerRecords(contract(), q, [cert, node("EVIDENCE_LEDGER", "evidence_881")]).result_state).toBe("CORRELATED");
  });

  it("valid mission cross-ledger context query passes", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ correlation_type: "MISSION_CROSS_LEDGER_CONTEXT" }), graph()).correlated_ledgers).toContain("RECOMMENDATION_LEDGER");
  });

  it("correlation without Query Contract fails", () => {
    expect(correlateCrossLedgerRecords(undefined, query(), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("correlation without tenant scope fails", () => {
    expect(correlateCrossLedgerRecords(contract({ query_scope: {} as TruthLedgerQueryContract["query_scope"] }), query(), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("invalid source ledger fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ source_ledger: "BAD_LEDGER" as TruthCrossLedgerCorrelationQuery["source_ledger"] }), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("invalid target ledger fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ target_ledgers: ["BAD_LEDGER" as TruthCrossLedgerCorrelationQuery["target_ledgers"][number]] }), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("missing seed record fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ seed_records: [] }), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("unsupported correlation type fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ correlation_type: "BAD" as TruthCrossLedgerCorrelationQuery["correlation_type"] }), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("unauthorized source ledger access fails", () => {
    const c = contract({ authority_context: { ...contract().authority_context, permissions: ["truth.crossledger.read"] } });
    expect(correlateCrossLedgerRecords(c, query(), graph()).result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("unauthorized target ledger access fails", () => {
    const c = contract({ authority_context: { ...contract().authority_context, permissions: contract().authority_context.permissions.filter((p) => p !== "truth.ledger.evidence.read") } });
    expect(correlateCrossLedgerRecords(c, query(), graph()).result_state).toBe("AUTHORITY_BLOCKED");
  });

  it("cross-tenant correlation without authorization fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ tenant_id: "tenant_beta" }), [rec({ tenant_id: "tenant_beta" })]).result_state).toBe("INVALID_QUERY");
  });

  it("restricted node returned raw fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ restricted: true })]).result_state).toBe("GOVERNANCE_BLOCKED");
  });

  it("restricted edge returned raw fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ relationships: [rel({ restricted: true })] }), node("DECISION_LEDGER", "decision_340")]).result_state).toBe("GOVERNANCE_BLOCKED");
  });

  it("restricted relationship returned as placeholder when authorized passes", () => {
    const c = contract({ redaction_policy: { redaction_required: true, redaction_level: "PARTIAL", restricted_fields: ["edge"], reason: "Restricted relation." } });
    const q = query({ include_redacted_placeholders: true, existence_disclosure_policy: { ...query().existence_disclosure_policy, allow_restricted_edge_placeholder: true, disclosure_reason: "Allowed placeholder." } });
    const response = correlateCrossLedgerRecords(c, q, [rec({ relationships: [rel({ restricted: true })] }), node("DECISION_LEDGER", "decision_340")]);
    expect(response.result_state).toBe("REDACTED");
    expect(response.edges[0].visibility_state).toBe("REDACTED_EDGE");
  });

  it("restricted relationship hidden when disclosure denied passes", () => {
    const c = contract({ redaction_policy: { redaction_required: true, redaction_level: "PARTIAL", restricted_fields: ["edge"], reason: "Restricted relation." } });
    const response = correlateCrossLedgerRecords(c, query(), [rec({ relationships: [rel({ restricted: true })] }), node("DECISION_LEDGER", "decision_340")]);
    expect(response.edges.length).toBe(0);
  });

  it("direct reference marked verified", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), graph()).edges[0].verified).toBe(true);
  });

  it("temporal overlap marked verified fails", () => {
    const response = correlateCrossLedgerRecords(contract(), query({ include_candidate_correlations: true }), [rec({ relationships: [rel({ correlation_basis: ["TEMPORAL_OVERLAP"], correlation_strength: "VERIFIED" })] }), node("DECISION_LEDGER", "decision_340")]);
    expect(response.result_state).toBe("CONFLICT_DETECTED");
  });

  it("temporal overlap marked candidate passes", () => {
    const response = correlateCrossLedgerRecords(contract(), query({ include_candidate_correlations: true }), [rec({ relationships: [rel({ correlation_basis: ["TEMPORAL_OVERLAP"], correlation_strength: "CANDIDATE" })] }), node("DECISION_LEDGER", "decision_340")]);
    expect(response.result_state).toBe("CANDIDATE_ONLY");
  });

  it("candidate edge used for certification fails", () => {
    const response = correlateCrossLedgerRecords(contract(), query({ include_candidate_correlations: true, requested_views: ["CERTIFICATION_VIEW", "GRAPH_VIEW"] }), [rec({ relationships: [rel({ correlation_strength: "CANDIDATE", candidate_for_certification: true })] }), node("DECISION_LEDGER", "decision_340")]);
    expect(response.result_state).toBe("CONFLICT_DETECTED");
  });

  it("corrupted source record used as proof fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ integrity_state: "CORRUPTED" })]).result_state).toBe("INTEGRITY_BLOCKED");
  });

  it("corrupted target record used as proof fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec(), node("DECISION_LEDGER", "decision_340", { integrity_state: "CORRUPTED" })]).result_state).toBe("INTEGRITY_BLOCKED");
  });

  it("degraded record returned with warning or restriction passes", () => {
    const c = contract({ integrity_requirements: { ...contract().integrity_requirements, minimum_integrity_state: "DEGRADED" } });
    const response = correlateCrossLedgerRecords(c, query(), [rec({ integrity_state: "DEGRADED" }), ...graph().slice(1)]);
    expect(response.result_state).toBe("PARTIAL");
    expect(response.warnings.some((warning) => warning.includes("integrity-degraded"))).toBe(true);
  });

  it("broken reference detected as gap", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ relationships: [rel({ target_record_id: "missing_decision" })] })]).result_state).toBe("GAP_DETECTED");
  });

  it("missing evidence detected as gap", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ relationships: [rel({ target_ledger: "EVIDENCE_LEDGER", target_record_id: "missing_evidence", relationship_type: "SUPPORTED_BY", missing_target: true })] })]).result_state).toBe("GAP_DETECTED");
  });

  it("conflicting evidence detected", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ include_conflicts: true }), [rec({ relationships: [rel({ target_ledger: "EVIDENCE_LEDGER", target_record_id: "evidence_bad", relationship_type: "CONTRADICTED_BY", correlation_strength: "CONFLICTING" })] })]).result_state).toBe("CONFLICT_DETECTED");
  });

  it("conflicting governance state detected", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ relationships: [rel({ target_ledger: "GOVERNANCE_LEDGER", target_record_id: "gov_bad", relationship_type: "RESTRICTED_BY", conflicting: true, governance_refs: ["gov_bad"] })] })]).result_state).toBe("CONFLICT_DETECTED");
  });

  it("broken lineage detected", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), [rec({ relationships: [rel({ broken_lineage: true })] }), node("DECISION_LEDGER", "decision_340")]).gaps.some((gap) => gap.gap_type === "BROKEN_LINEAGE")).toBe(true);
  });

  it("max traversal depth enforced", () => {
    const response = correlateCrossLedgerRecords(contract(), query({ traversal_policy: { ...query().traversal_policy, max_hops: 0 } }), graph());
    expect(response.nodes.length).toBe(1);
  });

  it("traversal cycle detected", () => {
    const decision = node("DECISION_LEDGER", "decision_340", { relationships: [rel({ target_ledger: "RECOMMENDATION_LEDGER", target_record_id: "rec_204", relationship_type: "ASSOCIATED_WITH" })] });
    const response = correlateCrossLedgerRecords(contract(), query(), [rec(), decision]);
    expect(response.gaps.some((gap) => gap.gap_type === "CYCLE_DETECTED")).toBe(true);
  });

  it("nondeterministic graph ordering fails", () => {
    expect(correlateCrossLedgerRecords(contract(), query({ ordering_policy: { node_order_by: "ledger_type", edge_order_by: "source_record_id", direction: "ASC", tie_breakers: [] } }), graph()).result_state).toBe("INVALID_QUERY");
  });

  it("deterministic node ordering passes", () => {
    const ledgers = correlateCrossLedgerRecords(contract(), query(), graph()).nodes.map((node) => node.ledger_type);
    expect(ledgers).toEqual([...ledgers].sort());
  });

  it("deterministic edge ordering passes", () => {
    const edges = correlateCrossLedgerRecords(contract(), query(), graph()).edges;
    expect(edges.map((edge) => edge.edge_id)).toEqual([...edges.map((edge) => edge.edge_id)].sort());
  });

  it("historical correlation excludes future evidence", () => {
    const future = node("EVIDENCE_LEDGER", "evidence_future", { recorded_at: "2026-06-21T00:00:00.000Z", late_arriving: true });
    const response = correlateCrossLedgerRecords(contract(), query({ temporal_policy: { temporal_mode: "KNOWN_AS_OF", as_of_time: "2026-06-20T00:00:00.000Z", include_late_arriving_records: false } }), [rec(), future]);
    expect(response.nodes.some((node) => node.record_id === "evidence_future")).toBe(false);
  });

  it("late-arriving record flagged when included", () => {
    const future = node("EVIDENCE_LEDGER", "evidence_future", { late_arriving: true, recorded_at: "2026-06-21T00:00:00.000Z" });
    const response = correlateCrossLedgerRecords(contract(), query({ temporal_policy: { temporal_mode: "KNOWN_AS_OF", as_of_time: "2026-06-20T00:00:00.000Z", include_late_arriving_records: true } }), [rec({ relationships: [rel({ target_ledger: "EVIDENCE_LEDGER", target_record_id: "evidence_future", relationship_type: "SUPPORTED_BY" })] }), future]);
    expect(response.warnings.some((warning) => warning.includes("Late-arriving"))).toBe(true);
  });

  it("correlation hash generated", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), graph()).correlation_hash).toBeTruthy();
  });

  it("same query produces same correlation hash", () => {
    expect(correlateCrossLedgerRecords(contract(), query(), graph()).correlation_hash).toBe(correlateCrossLedgerRecords(contract(), query(), graph()).correlation_hash);
  });

  it("correlation audit record generated", () => {
    const c = contract();
    const q = query();
    const response = correlateCrossLedgerRecords(c, q, graph());
    const audit = createCrossLedgerCorrelationAuditRecord(c, q, response);
    const replay = createCrossLedgerCorrelationReplayMetadata(q, response);
    expect(audit.correlation_hash).toBe(response.correlation_hash);
    expect(replay.seed_record_hash).toBeTruthy();
  });

  it("correlation attempts mutation fails", () => {
    const response = correlateCrossLedgerRecords(contract(), query(), graph(), { mutation_attempted: true });
    expect(response.result_state).toBe("INVALID_QUERY");
    expect(response.sourceMutationAllowed).toBe(false);
  });
});
