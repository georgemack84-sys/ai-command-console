import { describe, expect, it } from "vitest";
import {
  assertLedgerExplorerActionBlocked,
  buildLedgerExplorerContract,
  buildLedgerExplorerDetail,
  buildLedgerExplorerSeedRecords,
  buildLedgerExplorerView,
  createLedgerExplorerAuditEvent,
  queryLedgerExplorerRecords,
} from "@/services/ledger-explorer";
import type { LedgerExplorerQuery } from "@/types/ledger-explorer";

function contract(access_level: "READ_ONLY" | "RESTRICTED_READ" = "RESTRICTED_READ") {
  return buildLedgerExplorerContract({
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    mission_ids: ["mission_query_layer"],
    access_level,
  });
}

function query(overrides: Partial<LedgerExplorerQuery> = {}): LedgerExplorerQuery {
  return {
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    filters: { mission_id: "mission_query_layer" },
    governance_context: { access_level: "RESTRICTED_READ", restricted_access_allowed: true, cross_ledger_allowed: true },
    ...overrides,
  };
}

describe("Mission Control Phase 6K.3 Ledger Explorer", () => {
  it("creates a ledger explorer contract", () => {
    const result = contract();
    expect(result.governance.mutation_blocked).toBe(true);
    expect(result.navigation_modes.graph_view).toBe(true);
    expect(result.integrity.hash_chain_visible).toBe(true);
  });

  it("builds explorer records", () => {
    const records = buildLedgerExplorerSeedRecords();
    expect(records[0].truth_record_id).toBe("truth_rec_001");
    expect(records[0].ledger_position.current_hash).toBeTruthy();
  });

  it("enforces tenant scope", () => {
    const records = queryLedgerExplorerRecords(contract(), query());
    expect(records.every((record) => record.tenant_id === "tenant_alpha")).toBe(true);
    expect(records.some((record) => record.truth_record_id === "truth_rec_beta")).toBe(false);
  });

  it("fails closed for operator mismatch", () => {
    expect(queryLedgerExplorerRecords(contract(), query({ operator_id: "other" }))).toEqual([]);
  });

  it("fails closed for access mismatch", () => {
    expect(queryLedgerExplorerRecords(contract("READ_ONLY"), query())).toEqual([]);
  });

  it("returns deterministic stable ordering", () => {
    const first = queryLedgerExplorerRecords(contract(), query()).map((record) => record.truth_record_id);
    const second = queryLedgerExplorerRecords(contract(), query()).map((record) => record.truth_record_id);
    expect(first).toEqual(second);
    expect(first[0]).toBe("truth_rec_001");
  });

  it("filters by event type", () => {
    const records = queryLedgerExplorerRecords(contract(), query({ filters: { mission_id: "mission_query_layer", event_type: "DECISION" } }));
    expect(records).toHaveLength(1);
    expect(records[0].event_type).toBe("DECISION");
  });

  it("filters by search text", () => {
    const records = queryLedgerExplorerRecords(contract(), query({ filters: { mission_id: "mission_query_layer", search_text: "runtime query" } }));
    expect(records[0].event_type).toBe("RUNTIME");
  });

  it("redacts restricted records for restricted read", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_003");
    expect(detail.access_result).toBe("REDACTED");
    expect(detail.record.title).toBe("Restricted ledger record");
  });

  it("denies restricted records for read-only access", () => {
    expect(buildLedgerExplorerDetail(contract("READ_ONLY"), "truth_rec_003").access_result).toBe("DENIED");
  });

  it("fails closed for cross-tenant record access", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_beta");
    expect(detail.access_result).toBe("FAILED_CLOSED");
    expect(detail.warnings).toContain("Ledger access failed closed.");
  });

  it("displays record drilldown", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.drilldown.ledger_metadata.sequence_number).toBe(1);
  });

  it("displays timeline view", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.timeline.length).toBeGreaterThan(3);
    expect(detail.timeline[0].truth_record_id).toBe("truth_rec_001");
  });

  it("displays graph view", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.graph.nodes.length).toBeGreaterThan(3);
    expect(detail.graph.edges.some((edge) => edge.relationship_type === "PARENT_OF")).toBe(true);
  });

  it("displays lineage view", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_004");
    expect(detail.record.references.parent_refs).toContain("truth_rec_001");
  });

  it("displays evidence relationships", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.evidence[0].evidence_id).toBe("truth_rec_003");
  });

  it("displays recommendation-decision chains", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_002");
    expect(detail.recommendation_decision.map((item) => item.record_kind)).toContain("DECISION");
  });

  it("displays governance explorer records", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_005");
    expect(detail.governance[0].governance_state).toBe("ESCALATED");
  });

  it("displays runtime event stream", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_006");
    expect(detail.runtime_events[0].event_type).toBe("READ_EVENT");
  });

  it("displays integrity hash-chain view", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_003");
    expect(detail.integrity.hash_chain_state).toBe("BROKEN");
    expect(detail.integrity.warnings).toContain("Broken hash chain warning.");
  });

  it("displays archive and retention state", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.archive.retention_state).toBe("RETAINED");
  });

  it("displays historical reconstruction", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.historical_reconstruction.reconstructed_record_refs).toContain("truth_rec_001");
  });

  it("displays cross-ledger correlations when authorized", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001");
    expect(detail.cross_ledger_correlations.length).toBeGreaterThan(0);
  });

  it("blocks cross-ledger correlations when unauthorized", () => {
    const detail = buildLedgerExplorerDetail(contract(), "truth_rec_001", undefined, false);
    expect(detail.cross_ledger_correlations).toEqual([]);
  });

  it("warns on corrupted records", () => {
    expect(buildLedgerExplorerDetail(contract(), "truth_rec_003").warnings).toContain("Corrupted ledger record warning; trusted interpretation is blocked.");
  });

  it("warns on degraded records", () => {
    expect(buildLedgerExplorerDetail(contract(), "truth_rec_002").warnings).toContain("Degraded ledger record warning.");
  });

  it("shows replay references", () => {
    expect(buildLedgerExplorerDetail(contract(), "truth_rec_001").replay_refs).toContain("replay_cert_6j5_000001");
  });

  it("records append-only audit events", () => {
    const event = createLedgerExplorerAuditEvent({
      contract: contract(),
      event_type: "LEDGER_RECORD_VIEWED",
      access_result: "ALLOWED",
      target_ref: "truth_rec_001",
    });
    expect(event.appendOnly).toBe(true);
    expect(event.sourceMutationAllowed).toBe(false);
  });

  it("builds explorer view guardrails", () => {
    const view = buildLedgerExplorerView();
    expect(view.readOnly).toBe(true);
    expect(view.mutationAllowed).toBe(false);
    expect(view.approvalAllowed).toBe(false);
    expect(view.executionAllowed).toBe(false);
    expect(view.governanceOverrideAllowed).toBe(false);
  });

  it("exposes filters", () => {
    const view = buildLedgerExplorerView();
    expect(view.available_filters.event_types).toContain("RECOMMENDATION");
    expect(view.available_filters.integrity_states).toContain("CORRUPTED");
  });

  it.each([
    "CREATE_RECORD",
    "EDIT_RECORD",
    "DELETE_RECORD",
    "MODIFY_EVIDENCE",
    "REWRITE_LINEAGE",
    "APPROVE_RECOMMENDATION",
    "EXECUTE_DECISION",
    "OVERRIDE_GOVERNANCE",
    "REPAIR_HASH_CHAIN",
  ] as const)("blocks prohibited ledger explorer action %s", (action) => {
    expect(() => assertLedgerExplorerActionBlocked(action)).toThrow("Ledger Explorer is read-only");
  });
});
