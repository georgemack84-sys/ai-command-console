import { describe, expect, it } from "vitest";
import {
  assertReplayViewerActionBlocked,
  buildReplayViewerContract,
  buildReplayViewerDetail,
  buildReplayViewerSeedRecords,
  buildReplayViewerView,
  createReplayViewerAuditEvent,
  queryReplayViewerRecords,
} from "@/services/replay-viewer";
import type { ReplayViewerQuery } from "@/types/replay-viewer";

function contract(access_level: "READ_ONLY" | "RESTRICTED_READ" = "RESTRICTED_READ") {
  return buildReplayViewerContract({
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    mission_ids: ["mission_query_layer"],
    access_level,
  });
}

function query(overrides: Partial<ReplayViewerQuery> = {}): ReplayViewerQuery {
  return {
    tenant_id: "tenant_alpha",
    operator_id: "operator_console",
    filters: { mission_id: "mission_query_layer" },
    governance_context: { access_level: "RESTRICTED_READ", restricted_access_allowed: true },
    ...overrides,
  };
}

describe("Mission Control Phase 6K.2 Replay Viewer", () => {
  it("creates a replay viewer contract", () => {
    const result = contract();
    expect(result.governance.replay_mutation_blocked).toBe(true);
    expect(result.displays.output_verification).toBe(true);
    expect(result.audit.viewer_access_audited).toBe(true);
  });

  it("builds replay viewer records", () => {
    const records = buildReplayViewerSeedRecords();
    expect(records[0].replay_id).toBe("replay_cert_6j5_000001");
    expect(records[0].references.evidence_refs).toContain("evidence_query_contract_tests");
  });

  it("enforces tenant scope", () => {
    const records = queryReplayViewerRecords(contract(), query());
    expect(records.every((record) => record.tenant_id === "tenant_alpha")).toBe(true);
    expect(records.some((record) => record.replay_id === "replay_beta_001")).toBe(false);
  });

  it("fails closed for operator mismatch", () => {
    expect(queryReplayViewerRecords(contract(), query({ operator_id: "other" }))).toEqual([]);
  });

  it("fails closed for access-level mismatch", () => {
    expect(queryReplayViewerRecords(contract("READ_ONLY"), query())).toEqual([]);
  });

  it("returns deterministic replay ordering", () => {
    const first = queryReplayViewerRecords(contract(), query()).map((record) => record.replay_id);
    const second = queryReplayViewerRecords(contract(), query()).map((record) => record.replay_id);
    expect(first).toEqual(second);
  });

  it("filters by replay state", () => {
    const records = queryReplayViewerRecords(contract(), query({ filters: { mission_id: "mission_query_layer", replay_state: "MISMATCH" } }));
    expect(records.map((record) => record.replay_id)).toEqual(["replay_mismatch_001"]);
  });

  it("filters by search text", () => {
    const records = queryReplayViewerRecords(contract(), query({ filters: { mission_id: "mission_query_layer", search_text: "incomplete" } }));
    expect(records[0].replay_state).toBe("INCOMPLETE");
  });

  it("redacts restricted replay artifacts for restricted read", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_restricted_bundle");
    expect(detail.access_result).toBe("REDACTED");
    expect(detail.record.replay_summary.title).toBe("Restricted replay artifact");
    expect(detail.input_reconstruction.restricted_inputs).toContain("input_restricted_evidence");
  });

  it("denies restricted replay artifacts for read-only access", () => {
    const detail = buildReplayViewerDetail(contract("READ_ONLY"), "replay_restricted_bundle");
    expect(detail.access_result).toBe("DENIED");
  });

  it("fails closed for cross-tenant replay access", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_beta_001");
    expect(detail.access_result).toBe("FAILED_CLOSED");
    expect(detail.record.replay_state).toBe("NOT_AVAILABLE");
  });

  it("displays replay summary", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_cert_6j5_000001");
    expect(detail.summary.replay_state).toBe("REPRODUCED");
    expect(detail.summary.deterministic).toBe(true);
  });

  it("displays input reconstruction", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_cert_6j5_000001");
    expect(detail.input_reconstruction.input_state).toBe("RECONSTRUCTED");
    expect(detail.input_reconstruction.inputs.length).toBeGreaterThan(0);
  });

  it("displays state reconstruction", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_dashboard_view_001");
    expect(detail.state_reconstruction.reconstructed_state.governance_state).toBe("POLICY_CHECKED");
  });

  it("displays output verification", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_cert_6j5_000001");
    expect(detail.output_verification.verification_state).toBe("MATCH");
  });

  it("displays determinism gate", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_mismatch_001");
    expect(detail.determinism.determinism_state).toBe("NONDETERMINISTIC");
    expect(detail.determinism.nondeterministic_refs).toContain("lineage.child_refs");
  });

  it("displays replay timeline", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_cert_6j5_000001");
    expect(detail.timeline.map((event) => event.stage)).toContain("OUTPUT_VERIFICATION");
  });

  it("displays replay diff", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_mismatch_001");
    expect(detail.diff.diff_state).toBe("DIFF_PRESENT");
    expect(detail.diff.field_mismatches[0].mismatch_type).toBe("ORDERING_MISMATCH");
  });

  it("displays evidence lineage context", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_cert_6j5_000001");
    expect(detail.evidence_refs).toContain("evidence_query_contract_tests");
    expect(detail.lineage_refs).toContain("lineage_6j_001");
  });

  it("displays governance replay context", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_cert_6j5_000001");
    expect(detail.governance_refs).toContain("gov_cert_6j5");
  });

  it("marks reproduced replay correctly", () => {
    expect(buildReplayViewerDetail(contract(), "replay_cert_6j5_000001").record.replay_state).toBe("REPRODUCED");
  });

  it("marks mismatch replay correctly", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_mismatch_001");
    expect(detail.record.replay_state).toBe("MISMATCH");
    expect(detail.warnings).toContain("Replay mismatch warning.");
  });

  it("marks incomplete replay correctly", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_dashboard_view_001");
    expect(detail.incomplete_replay.incomplete_reasons[0].reason_type).toBe("MISSING_EVIDENCE");
  });

  it("marks invalid replay correctly", () => {
    const detail = buildReplayViewerDetail(contract(), "replay_restricted_bundle");
    expect(detail.invalid_replay.trusted_interpretation_blocked).toBe(true);
    expect(detail.warnings).toContain("Invalid replay warning; trusted interpretation is blocked.");
  });

  it("shows corrupted replay warning", () => {
    expect(buildReplayViewerDetail(contract(), "replay_restricted_bundle").warnings).toContain("Corrupted replay warning.");
  });

  it("records append-only audit events", () => {
    const event = createReplayViewerAuditEvent({
      contract: contract(),
      event_type: "REPLAY_RECORD_VIEWED",
      access_result: "ALLOWED",
      replay_id: "replay_cert_6j5_000001",
    });
    expect(event.appendOnly).toBe(true);
    expect(event.sourceMutationAllowed).toBe(false);
  });

  it("builds a view with guardrails", () => {
    const view = buildReplayViewerView();
    expect(view.readOnly).toBe(true);
    expect(view.replayMutationAllowed).toBe(false);
    expect(view.truthRecordMutationAllowed).toBe(false);
    expect(view.guardrails).toContain("no governance override");
  });

  it("exposes available filters", () => {
    const view = buildReplayViewerView();
    expect(view.available_filters.replay_states).toContain("MISMATCH");
    expect(view.available_filters.target_types).toContain("DECISION");
  });

  it.each([
    "MUTATE_REPLAY",
    "MUTATE_TRUTH_RECORD",
    "MODIFY_EVIDENCE",
    "REWRITE_LINEAGE",
    "OVERRIDE_GOVERNANCE",
    "APPROVE_RECOMMENDATION",
    "EXECUTE_DECISION",
    "RERUN_REPLAY",
  ] as const)("blocks prohibited replay viewer action %s", (action) => {
    expect(() => assertReplayViewerActionBlocked(action)).toThrow("Replay Viewer is read-only");
  });
});
