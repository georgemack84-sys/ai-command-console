import { describe, expect, it } from "vitest";
import {
  assertIntegrityViewerActionBlocked,
  buildIntegrityStatusDetail,
  buildIntegrityStatusSeedRecords,
  buildIntegrityStatusViewerContract,
  buildIntegrityStatusViewerView,
  createIntegritySummary,
  createIntegrityViewerAuditEvent,
  queryIntegrityStatusRecords,
} from "@/services/integrity-viewer";
import type { IntegrityViewerQuery } from "@/types/integrity-viewer";

function contract(access_level: "READ_ONLY" | "RESTRICTED_READ" = "RESTRICTED_READ") {
  return buildIntegrityStatusViewerContract({
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    mission_ids: ["mission_query_layer"],
    access_level,
  });
}

function query(overrides: Partial<IntegrityViewerQuery> = {}): IntegrityViewerQuery {
  return {
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    filters: { mission_id: "mission_query_layer" },
    governance_context: { access_level: "RESTRICTED_READ", restricted_access_allowed: true },
    ...overrides,
  };
}

describe("Mission Control Phase 6K.4 Integrity Status Viewer", () => {
  it("creates the integrity status viewer contract", () => {
    const result = contract();
    expect(result.governance.mutation_blocked).toBe(true);
    expect(result.governance.hash_repair_blocked).toBe(true);
    expect(result.integrity_visibility.tamper_alerts_visible).toBe(true);
  });

  it("builds seeded integrity records", () => {
    const records = buildIntegrityStatusSeedRecords();
    expect(records[0].target.target_id).toBe("truth_rec_001");
    expect(records.some((record) => record.integrity_state === "CORRUPTED")).toBe(true);
  });

  it("enforces tenant scope", () => {
    const records = queryIntegrityStatusRecords(contract(), query());
    expect(records.every((record) => record.tenant_id === "tenant_alpha")).toBe(true);
    expect(records.some((record) => record.target.target_id === "truth_rec_beta")).toBe(false);
  });

  it("fails closed for operator mismatch", () => {
    expect(queryIntegrityStatusRecords(contract(), query({ operator_id: "other" }))).toEqual([]);
  });

  it("fails closed for access mismatch", () => {
    expect(queryIntegrityStatusRecords(contract("READ_ONLY"), query())).toEqual([]);
  });

  it("returns deterministic ordering", () => {
    const first = queryIntegrityStatusRecords(contract(), query()).map((record) => record.integrity_status_id);
    const second = queryIntegrityStatusRecords(contract(), query()).map((record) => record.integrity_status_id);
    expect(first).toEqual(second);
    expect(first[0]).toBe("integrity_status_001");
  });

  it("filters by integrity state", () => {
    const records = queryIntegrityStatusRecords(contract(), query({ filters: { mission_id: "mission_query_layer", integrity_state: "DEGRADED" } }));
    expect(records).toHaveLength(1);
    expect(records[0].integrity_state).toBe("DEGRADED");
  });

  it("filters by tamper state", () => {
    const records = queryIntegrityStatusRecords(contract(), query({ filters: { mission_id: "mission_query_layer", tamper_detection_state: "CONFIRMED" } }));
    expect(records[0].tamper_detection_state).toBe("CONFIRMED");
  });

  it("filters by search text", () => {
    const records = queryIntegrityStatusRecords(contract(), query({ filters: { mission_id: "mission_query_layer", search_text: "Replay integrity pending" } }));
    expect(records[0].target.target_type).toBe("REPLAY");
  });

  it("redacts restricted integrity records for restricted read", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.access_result).toBe("REDACTED");
    expect(detail.record.title).toBe("Restricted integrity status");
  });

  it("denies restricted integrity records for read-only access", () => {
    expect(buildIntegrityStatusDetail(contract("READ_ONLY"), "evidence_restricted_bundle").access_result).toBe("DENIED");
  });

  it("fails closed for cross-tenant target access", () => {
    const detail = buildIntegrityStatusDetail(contract(), "truth_rec_beta");
    expect(detail.access_result).toBe("FAILED_CLOSED");
    expect(detail.warnings).toContain("Integrity status access failed closed.");
  });

  it("summarizes integrity states", () => {
    const summary = createIntegritySummary(queryIntegrityStatusRecords(contract(), query()));
    expect(summary.valid_count).toBeGreaterThan(0);
    expect(summary.corrupted_count).toBe(1);
    expect(summary.trusted_interpretation_allowed).toBe(false);
  });

  it("displays record integrity checks", () => {
    const detail = buildIntegrityStatusDetail(contract(), "truth_rec_001");
    expect(detail.record_integrity.checks.map((check) => check.check_type)).toContain("HASH_VALID");
  });

  it("flags corrupted record integrity checks", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.record_integrity.checks.some((check) => check.result === "FAIL")).toBe(true);
  });

  it("displays ledger segment warnings", () => {
    const detail = buildIntegrityStatusDetail(contract(), "truth_rec_001");
    expect(detail.ledger_segment.segment_warnings).toContain("BROKEN_HASH_LINK");
    expect(detail.ledger_segment.records).toContain("evidence_restricted_bundle");
  });

  it("displays hash chain status", () => {
    const detail = buildIntegrityStatusDetail(contract(), "truth_rec_001");
    expect(detail.hash_chain.hash_chain_state).toBe("VALID");
  });

  it("displays broken hash warnings", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.hash_chain.hash_chain_state).toBe("BROKEN");
    expect(detail.hash_chain.broken_links.length).toBeGreaterThan(0);
  });

  it("displays suspected tamper alerts", () => {
    const detail = buildIntegrityStatusDetail(contract(), "ledger_002");
    expect(detail.tamper_detection.tamper_detection_state).toBe("SUSPECTED");
    expect(detail.tamper_detection.alerts[0].indicator).toBe("SEQUENCE_ANOMALY");
  });

  it("displays confirmed tamper alerts", () => {
    const detail = buildIntegrityStatusDetail(contract(), "tamper_integrity_status_003");
    expect(detail.tamper_detection.tamper_detection_state).toBe("CONFIRMED");
    expect(detail.tamper_detection.alerts[0].indicator).toBe("HASH_MISMATCH");
  });

  it("displays verification results", () => {
    const detail = buildIntegrityStatusDetail(contract(), "verification_integrity_status_001");
    expect(detail.verification_result.result).toBe("PASS");
    expect(detail.verification_result.service_ref).toBe("integrity_verification_service_6i4");
  });

  it("displays certification gate status", () => {
    const detail = buildIntegrityStatusDetail(contract(), "certification_integrity_status_002");
    expect(detail.certification_gate.certification_state).toBe("CONDITIONAL_PASS");
  });

  it("explains degraded integrity", () => {
    const detail = buildIntegrityStatusDetail(contract(), "ledger_002");
    expect(detail.degraded_analysis?.state).toBe("DEGRADED");
    expect(detail.degraded_analysis?.required_operator_posture).toBe("MONITOR");
  });

  it("explains corrupted integrity", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.corrupted_analysis?.state).toBe("CORRUPTED");
    expect(detail.corrupted_analysis?.required_operator_posture).toBe("FAIL_CLOSED");
  });

  it("displays blast radius", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.blast_radius.severity).toBe("CRITICAL");
    expect(detail.blast_radius.affected_replays).toContain("replay_dashboard_view_001");
  });

  it("displays evidence impact", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.evidence_impact[0].dependency_type).toBe("EVIDENCE");
  });

  it("displays lineage impact", () => {
    const detail = buildIntegrityStatusDetail(contract(), "lineage_query_layer");
    expect(detail.lineage_impact[0].dependency_type).toBe("LINEAGE");
  });

  it("displays replay impact", () => {
    const detail = buildIntegrityStatusDetail(contract(), "replay_dashboard_view_001");
    expect(detail.replay_impact[0].dependency_type).toBe("REPLAY");
  });

  it("displays governance impact", () => {
    const detail = buildIntegrityStatusDetail(contract(), "gov_integrity_fail_closed");
    expect(detail.governance_impact[0].dependency_type).toBe("GOVERNANCE");
  });

  it("displays historical integrity status", () => {
    const detail = buildIntegrityStatusDetail(contract(), "truth_rec_001");
    expect(detail.history.events.length).toBe(2);
    expect(detail.history.events[1].verification_result).toBe("PASS");
  });

  it("allows trusted interpretation for valid records", () => {
    expect(buildIntegrityStatusDetail(contract(), "truth_rec_001").certification_gate.trusted_interpretation_allowed).toBe(true);
  });

  it("warns but keeps bounded visibility for degraded records", () => {
    const detail = buildIntegrityStatusDetail(contract(), "ledger_002");
    expect(detail.warnings).toContain("Degraded integrity status requires operator review.");
    expect(detail.certification_gate.trusted_interpretation_allowed).toBe(true);
  });

  it("blocks trusted interpretation for corrupted records", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.certification_gate.trusted_interpretation_allowed).toBe(false);
    expect(detail.warnings).toContain("Corrupted integrity status blocks trusted interpretation.");
  });

  it("redacts restricted dependency references", () => {
    const detail = buildIntegrityStatusDetail(contract(), "evidence_restricted_bundle");
    expect(detail.record.refs.evidence_refs).toEqual([]);
    expect(detail.record.refs.replay_refs).toEqual([]);
  });

  it("builds viewer guardrails", () => {
    const view = buildIntegrityStatusViewerView();
    expect(view.readOnly).toBe(true);
    expect(view.mutationAllowed).toBe(false);
    expect(view.hashRepairAllowed).toBe(false);
    expect(view.certificationOverrideAllowed).toBe(false);
    expect(view.governanceOverrideAllowed).toBe(false);
  });

  it("exposes filters", () => {
    const view = buildIntegrityStatusViewerView();
    expect(view.available_filters.integrity_states).toContain("CORRUPTED");
    expect(view.available_filters.certification_states).toContain("FAIL");
  });

  it("records append-only audit events", () => {
    const event = createIntegrityViewerAuditEvent({
      contract: contract(),
      event_type: "INTEGRITY_RECORD_VIEWED",
      access_result: "ALLOWED",
      target_ref: "truth_rec_001",
    });
    expect(event.appendOnly).toBe(true);
    expect(event.sourceMutationAllowed).toBe(false);
  });

  it.each([
    "REPAIR_HASH",
    "RECALCULATE_HASH",
    "SUPPRESS_TAMPER_WARNING",
    "MARK_CORRUPTED_VALID",
    "RERUN_CERTIFICATION",
    "OVERRIDE_CERTIFICATION",
    "OVERRIDE_GOVERNANCE",
    "MUTATE_EVIDENCE",
    "REWRITE_LINEAGE",
    "EXECUTE_DECISION",
  ] as const)("blocks prohibited integrity viewer action %s", (action) => {
    expect(() => assertIntegrityViewerActionBlocked(action)).toThrow("Integrity Status Viewer is read-only");
  });

  it("fails closed for missing target refs", () => {
    expect(buildIntegrityStatusDetail(contract(), "missing_target").access_result).toBe("FAILED_CLOSED");
  });
});
