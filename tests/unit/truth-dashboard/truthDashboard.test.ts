import { describe, expect, it } from "vitest";
import {
  assertTruthDashboardActionBlocked,
  buildTruthDashboardContract,
  buildTruthDashboardRecordDetail,
  buildTruthDashboardSeedRecords,
  buildTruthDashboardView,
  createTruthDashboardAuditEvent,
  queryTruthDashboardRecords,
} from "@/services/truth-dashboard";
import type { TruthDashboardQuery } from "@/types/truth-dashboard";

function contract(access_level: "READ_ONLY" | "RESTRICTED_READ" = "RESTRICTED_READ") {
  return buildTruthDashboardContract({
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    mission_ids: ["mission_query_layer"],
    access_level,
  });
}

function query(overrides: Partial<TruthDashboardQuery> = {}): TruthDashboardQuery {
  return {
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    query_type: "HISTORICAL_RECONSTRUCTION",
    filters: { mission_id: "mission_query_layer" },
    governance_context: {
      access_level: "RESTRICTED_READ",
      restricted_access_allowed: true,
    },
    ...overrides,
  };
}

describe("Mission Control Phase 6K.1 Truth Dashboard", () => {
  it("creates a read-only dashboard contract", () => {
    const result = contract();
    expect(result.governance.mutation_blocked).toBe(true);
    expect(result.displays.recommendations).toBe(true);
    expect(result.replay.replay_refs_visible).toBe(true);
    expect(result.integrity.integrity_state_visible).toBe(true);
  });

  it("builds dashboard data model records", () => {
    const records = buildTruthDashboardSeedRecords();
    expect(records[0].truth_record_id).toBe("truth_rec_001");
    expect(records[0].evidence_refs).toContain("evidence_query_contract_tests");
  });

  it("enforces tenant scope", () => {
    const records = queryTruthDashboardRecords(contract(), query());
    expect(records.every((record) => record.tenant_id === "tenant_alpha")).toBe(true);
    expect(records.some((record) => record.truth_record_id === "truth_rec_beta")).toBe(false);
  });

  it("fails closed for operator mismatch", () => {
    const records = queryTruthDashboardRecords(contract(), query({ operator_id: "other_operator" }));
    expect(records).toEqual([]);
  });

  it("fails closed for access-level mismatch", () => {
    const records = queryTruthDashboardRecords(contract("READ_ONLY"), query());
    expect(records).toEqual([]);
  });

  it("returns deterministic query ordering", () => {
    const first = queryTruthDashboardRecords(contract(), query()).map((record) => record.truth_record_id);
    const second = queryTruthDashboardRecords(contract(), query()).map((record) => record.truth_record_id);
    expect(first).toEqual(second);
  });

  it("filters by search text", () => {
    const records = queryTruthDashboardRecords(contract(), query({ filters: { mission_id: "mission_query_layer", search_text: "lineage path" } }));
    expect(records.map((record) => record.truth_record_id)).toEqual(["truth_rec_004"]);
  });

  it("filters by record type", () => {
    const records = queryTruthDashboardRecords(contract(), query({ filters: { mission_id: "mission_query_layer", event_type: "DECISION" } }));
    expect(records).toHaveLength(1);
    expect(records[0].event_type).toBe("DECISION");
  });

  it("filters by integrity state", () => {
    const records = queryTruthDashboardRecords(contract(), query({ filters: { mission_id: "mission_query_layer", integrity_state: "CORRUPTED" } }));
    expect(records[0].integrity_state).toBe("CORRUPTED");
  });

  it("redacts restricted records for restricted read", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_003");
    expect(detail.access_result).toBe("REDACTED");
    expect(detail.record.title).toBe("Restricted truth record");
    expect(detail.record.evidence_refs).toEqual([]);
  });

  it("denies restricted records for read-only access", () => {
    const detail = buildTruthDashboardRecordDetail(contract("READ_ONLY"), "truth_rec_003");
    expect(detail.access_result).toBe("DENIED");
  });

  it("fails closed for cross-tenant detail access", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_beta");
    expect(detail.access_result).toBe("FAILED_CLOSED");
    expect(detail.warnings).toContain("Record access failed closed.");
  });

  it("displays recommendation context", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_001");
    expect(detail.recommendation?.authority_boundary).toBe("ADVISORY_ONLY");
    expect(detail.recommendation?.supporting_evidence_refs).toContain("evidence_query_contract_tests");
  });

  it("displays decision context", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_002");
    expect(detail.decision?.decision_state).toBe("ESCALATED");
    expect(detail.decision?.governance_result.policy_checked).toBe(true);
  });

  it("displays evidence context", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_003");
    expect(detail.evidence?.evidence_state).toBe("RESTRICTED");
    expect(detail.evidence?.integrity_state).toBe("CORRUPTED");
  });

  it("displays lineage context", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_004");
    expect(detail.lineage.lineage_state).toBe("COMPLETE");
    expect(detail.lineage.replay_lineage_refs).toContain("replay_cert_6j5_000001");
  });

  it("displays replay references", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_001");
    expect(detail.replay_links[0].replay_state).toBe("REPRODUCED");
  });

  it("displays degraded integrity warning", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_002");
    expect(detail.warnings).toContain("Integrity is degraded; verify before relying on this record.");
  });

  it("displays corrupted integrity trust block", () => {
    const detail = buildTruthDashboardRecordDetail(contract(), "truth_rec_003");
    expect(detail.warnings).toContain("Integrity is corrupted; trusted interpretation is blocked.");
  });

  it("records append-only dashboard audit events", () => {
    const event = createTruthDashboardAuditEvent({
      contract: contract(),
      event_type: "truth_record_viewed",
      access_result: "ALLOWED",
      truth_record_id: "truth_rec_001",
    });
    expect(event.appendOnly).toBe(true);
    expect(event.sourceMutationAllowed).toBe(false);
  });

  it("builds a dashboard view with explicit guardrails", () => {
    const view = buildTruthDashboardView();
    expect(view.readOnly).toBe(true);
    expect(view.mutationAllowed).toBe(false);
    expect(view.approvalAllowed).toBe(false);
    expect(view.executionAllowed).toBe(false);
    expect(view.guardrails).toContain("tenant isolation");
  });

  it("records dashboard view audit activity", () => {
    expect(buildTruthDashboardView().audit_events[0].event_type).toBe("dashboard_view_opened");
  });

  it("exposes available filters", () => {
    const view = buildTruthDashboardView();
    expect(view.available_filters.record_types).toContain("RECOMMENDATION");
    expect(view.available_filters.integrity_states).toContain("DEGRADED");
  });

  it.each([
    "MUTATE_RECORD",
    "APPROVE_RECOMMENDATION",
    "EXECUTE_DECISION",
    "MODIFY_EVIDENCE",
    "REWRITE_LINEAGE",
    "OVERRIDE_GOVERNANCE",
  ] as const)("blocks prohibited dashboard action %s", (action) => {
    expect(() => assertTruthDashboardActionBlocked(action)).toThrow("Truth Dashboard is read-only");
  });
});
