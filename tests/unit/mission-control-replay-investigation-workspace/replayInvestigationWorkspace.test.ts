import { describe, expect, it } from "vitest";
import {
  buildReplayInvestigationWorkspaceObservabilitySurface,
  computeReplayInvestigationWorkspaceHash,
  getReplayInvestigationWorkspaceContract,
  runReplayInvestigationWorkspace,
  validateReplayInvestigationWorkspace,
} from "@/services/mission-control-replay-investigation-workspace";
import type { ReplayInvestigationFailure, ReplayInvestigationScenario } from "@/types/mission-control-replay-investigation-workspace";

describe("Mission Control Phase 8J.4 Replay Investigation Workspace", () => {
  it("defines investigation workspace doctrine and controlled modes", () => {
    const contract = getReplayInvestigationWorkspaceContract();

    expect(contract.doctrine.schema_version).toBe("mission-control-replay-investigation-workspace/v8J.4");
    expect(contract.doctrine.principles).toContain("deterministic-replay");
    expect(contract.doctrine.principles).toContain("immutable-history");
    expect(contract.doctrine.replay_types).toEqual(["PLANNING_REPLAY", "EXECUTION_REPLAY", "DELEGATION_REPLAY", "ORCHESTRATION_REPLAY", "SUPERVISION_REPLAY", "INTERVENTION_REPLAY"]);
    expect(contract.doctrine.replay_modes).toEqual(["LIVE", "HISTORICAL", "STEP_BY_STEP", "CHECKPOINT", "FORENSIC", "COMPARISON"]);
    expect(contract.doctrine.integrity_hash_types).toContain("LINEAGE_HASH");
    expect(contract.doctrine.search_categories).toContain("ROLLBACK");
    expect(contract.doctrine.no_history_mutation).toBe(true);
    expect(contract.doctrine.no_execution_authority).toBe(true);
  });

  it("builds a valid deterministic replay investigation workspace", () => {
    const report = runReplayInvestigationWorkspace();
    const validation = validateReplayInvestigationWorkspace(report);

    expect(report.phase_version).toBe("8J.4");
    expect(report.validation_outcome).toBe("VALID");
    expect(report.replay_sessions.length).toBe(6);
    expect(report.integrity_records.length).toBe(6);
    expect(report.lineage_records.length).toBe(7);
    expect(report.timeline.length).toBe(11);
    expect(report.comparisons.length).toBe(6);
    expect(report.searches.length).toBe(12);
    expect(report.evidence_records.length).toBe(6);
    expect(report.audit_exports.length).toBe(6);
    expect(report.validation_tests.length).toBe(40);
    expect(report.validation_tests.every((test) => test.passed)).toBe(true);
    expect(report.advisory_only).toBe(true);
    expect(report.history_mutation_allowed).toBe(false);
    expect(report.execution_authority_granted).toBe(false);
    expect(validation.valid).toBe(true);
  });

  it("visualizes replay, integrity, lineage, timeline, evidence, and audit surfaces", () => {
    const report = runReplayInvestigationWorkspace({ replay_mode: "STEP_BY_STEP", investigation_mode: "COMPARATIVE_ANALYSIS" });

    expect(report.replay_sessions.map((item) => item.replay_type)).toContain("INTERVENTION_REPLAY");
    expect(report.replay_sessions.every((item) => item.controls.includes("JUMP_TO_DECISION"))).toBe(true);
    expect(report.integrity_records.map((item) => item.hash_type)).toEqual(["EXECUTION_HASH", "REPLAY_HASH", "PLANNING_HASH", "SUPERVISION_HASH", "DECISION_HASH", "LINEAGE_HASH"]);
    expect(report.integrity_records.every((item) => item.verification_status === "VERIFIED")).toBe(true);
    expect(report.lineage_records.map((item) => item.relationship_type)).toContain("SUPERVISION");
    expect(report.timeline.map((item) => item.event_type)).toContain("INTERVENTION_OCCURRED");
    expect(report.timeline.some((item) => item.checkpoint_reference)).toBe(true);
    expect(report.timeline.some((item) => item.rollback_reference)).toBe(true);
    expect(report.investigation_console.comparison_mode).toBe(true);
    expect(report.evidence_records.every((item) => item.verification_status === "VERIFIED")).toBe(true);
    expect(report.audit_exports.every((item) => item.report_checksum)).toBe(true);
  });

  it("preserves replay references, integrity hashes, evidence references, and tenant isolation", () => {
    const report = runReplayInvestigationWorkspace();

    expect(report.replay_sessions.every((item) => item.replay_reference && item.lineage_reference && item.integrity_hash)).toBe(true);
    expect(report.integrity_records.every((item) => item.hash_value && item.replay_reference && item.lineage_reference)).toBe(true);
    expect(report.timeline.every((item, index) => item.sequence_number === index + 1)).toBe(true);
    expect(report.timeline.every((item) => item.replay_reference && item.lineage_reference && item.integrity_hash)).toBe(true);
    expect(report.searches.every((item) => item.deterministic_order)).toBe(true);
    expect(report.audit_exports.every((item) => item.replay_references.length > 0 && item.evidence_references.length > 0 && item.governance_references.length > 0)).toBe(true);
    expect(report.replay_sessions.every((item) => item.tenant_id === report.tenant_id)).toBe(true);
    expect(report.lineage_records.every((item) => item.tenant_id === report.tenant_id)).toBe(true);
  });

  it("repeats identical workspaces with identical hashes", () => {
    const first = runReplayInvestigationWorkspace({ replay_mode: "FORENSIC", investigation_mode: "GOVERNANCE_REVIEW" });
    const second = runReplayInvestigationWorkspace({ replay_mode: "FORENSIC", investigation_mode: "GOVERNANCE_REVIEW" });

    expect(second.workspace_hash).toBe(first.workspace_hash);
    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.replay_sessions.map((item) => item.replay_hash)).toEqual(first.replay_sessions.map((item) => item.replay_hash));
    expect(second.timeline.map((item) => item.timeline_hash)).toEqual(first.timeline.map((item) => item.timeline_hash));
    expect(first.workspace_hash).toBe(computeReplayInvestigationWorkspaceHash(first));
  });

  it.each([
    ["REPLAY_DIVERGENCE", "REPLAY_RECONSTRUCTION_DIVERGED"],
    ["INTEGRITY_UNVERIFIED", "INTEGRITY_HASH_UNVERIFIED"],
    ["LINEAGE_GAP", "LINEAGE_RELATIONSHIP_MISSING"],
    ["NONDETERMINISTIC_TIMELINE", "TIMELINE_ORDER_NONDETERMINISTIC"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["GOVERNANCE_HISTORY_GAP", "GOVERNANCE_HISTORY_UNRECONSTRUCTABLE"],
    ["INCONSISTENT_COMPARISON", "HISTORICAL_COMPARISON_INCONSISTENT"],
    ["NONDETERMINISTIC_SEARCH", "SEARCH_RESULTS_NONDETERMINISTIC"],
    ["CROSS_TENANT_HISTORY", "CROSS_TENANT_HISTORY_EXPOSED"],
    ["HISTORY_MUTATION_ATTEMPT", "HISTORICAL_DATA_MUTATION_ATTEMPTED"],
    ["MISSING_REPLAY_REFERENCE", "REPLAY_REFERENCE_MISSING"],
    ["INTEGRITY_VERIFICATION_FAILED", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_HISTORICAL_STATE", "HIDDEN_HISTORICAL_STATE_VISIBLE"],
    ["UNAUTHORIZED_INVESTIGATION_ACCESS", "UNAUTHORIZED_INVESTIGATION_ACCESS"],
  ] as readonly [ReplayInvestigationScenario, ReplayInvestigationFailure][])(
    "invalidates %s with %s",
    (scenario, failure) => {
      const report = runReplayInvestigationWorkspace({ scenario });
      const validation = validateReplayInvestigationWorkspace(report);

      expect(report.validation_outcome).not.toBe("VALID");
      expect(report.failures).toContain(failure);
      expect(report.validation_tests.map((test) => test.failure_reason)).toContain(failure);
      expect(validation.valid).toBe(false);
    },
  );

  it("exposes investigation observability for operator inspection", () => {
    const surface = buildReplayInvestigationWorkspaceObservabilitySurface(runReplayInvestigationWorkspace({ scenario: "INCOMPLETE_EVIDENCE" }));

    expect(surface.validation_outcome).toBe("INVALID");
    expect(surface.failures).toContain("EVIDENCE_INCOMPLETE");
    expect(surface.replay_sessions).toBe(6);
    expect(surface.timeline_events).toBe(11);
    expect(surface.searches).toBe(12);
    expect(surface.failed_tests).toBeGreaterThan(0);
    expect(surface.history_mutation_allowed).toBe(false);
    expect(surface.execution_authority_granted).toBe(false);
  });
});
