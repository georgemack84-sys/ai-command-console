import { describe, expect, it } from "vitest";
import {
  assertGovernanceReplayViewerActionBlocked,
  buildGovernanceReplayViewerObservabilitySurface,
  buildGovernanceReplayViewerView,
  getGovernanceReplayViewerContract,
} from "@/services/governance-replay-viewer";
import type { GovernanceReplayViewerAction, GovernanceReplayViewerState } from "@/types/governance-replay-viewer";

describe("Mission Control Phase 7K.2 Governance Replay Viewer", () => {
  it("defines read-only replay viewer doctrine", () => {
    const contract = getGovernanceReplayViewerContract();

    expect(contract.doctrine.schema_version).toBe("governance-replay-viewer/v7K.2");
    expect(contract.doctrine.principles).toContain("replay-consistent");
    expect(contract.doctrine.stages).toContain("OUTPUT_VERIFICATION");
    expect(contract.doctrine.states).toEqual(["REPRODUCED", "MISMATCH", "INVALID", "INCOMPLETE"]);
    expect(contract.doctrine.prohibited_actions).toContain("EXECUTE_REPLAY");
  });

  it("builds a complete reproduced governance replay view", () => {
    const view = buildGovernanceReplayViewerView();

    expect(view.schema_version).toBe("governance-replay-viewer/v7K.2");
    expect(view.replay_state).toBe("REPRODUCED");
    expect(view.read_only).toBe(true);
    expect(view.advisory_only).toBe(true);
    expect(view.replay_execution_allowed).toBe(false);
    expect(view.mutation_allowed).toBe(false);
    expect(view.verification.determinism_validated).toBe(true);
    expect(view.comparison.exact_match).toBe(true);
  });

  it("renders every replay section consistently", () => {
    const view = buildGovernanceReplayViewerView();

    expect(view.inputs.length).toBeGreaterThan(0);
    expect(view.outputs.length).toBeGreaterThan(0);
    expect(view.evidence.length).toBeGreaterThan(0);
    expect(view.policies.length).toBeGreaterThan(0);
    expect(view.risks.length).toBeGreaterThan(0);
    expect(view.compliance.length).toBeGreaterThan(0);
    expect(view.recommendations.length).toBeGreaterThan(0);
    expect(view.escalations.length).toBeGreaterThan(0);
  });

  it("keeps timeline ordering deterministic", () => {
    const first = buildGovernanceReplayViewerView();
    const second = buildGovernanceReplayViewerView();

    expect(second.viewer_hash).toBe(first.viewer_hash);
    expect(second.timeline.map((event) => event.stage)).toEqual(first.timeline.map((event) => event.stage));
    expect(first.timeline[0].stage).toBe("REPLAY_INITIALIZATION");
    expect(first.timeline.at(-1)?.stage).toBe("REPLAY_COMPLETION");
  });

  it.each(["MISMATCH", "INVALID", "INCOMPLETE"] as readonly GovernanceReplayViewerState[])("surfaces %s replay problems", (state) => {
    const view = buildGovernanceReplayViewerView({ state });

    expect(view.replay_state).toBe(state);
    expect(view.comparison.exact_match).toBe(false);
    expect(view.comparison.mismatches.length).toBeGreaterThan(0);
    expect(view.hashes.hash_comparison).toBe("MISMATCH");
  });

  it("exposes replay hashes and verification", () => {
    const view = buildGovernanceReplayViewerView();

    expect(view.hashes.replay_hash).toBeTruthy();
    expect(view.hashes.reconstruction_hash).toBeTruthy();
    expect(view.hashes.integrity_chain_hash).toBeTruthy();
    expect(view.verification.validation_rules).toContain("integrity chain is verified");
  });

  it("keeps tenant and authorization scope explicit", () => {
    const view = buildGovernanceReplayViewerView({ tenant_id: "tenant_custom", mission_id: "mission_custom", operator_id: "operator_custom" });

    expect(view.tenant_id).toBe("tenant_custom");
    expect(view.mission_id).toBe("mission_custom");
    expect(view.operator_id).toBe("operator_custom");
    expect(view.tenant_isolated).toBe(true);
    expect(view.authorization_enforced).toBe(true);
  });

  it("exposes observability", () => {
    const surface = buildGovernanceReplayViewerObservabilitySurface({ state: "MISMATCH" });

    expect(surface.replay_state).toBe("MISMATCH");
    expect(surface.timeline_events).toBeGreaterThan(0);
    expect(surface.mismatch_count).toBeGreaterThan(0);
    expect(surface.read_only).toBe(true);
    expect(surface.viewer_hash).toBeTruthy();
  });

  it.each([
    "EXECUTE_REPLAY",
    "MODIFY_REPLAY",
    "MODIFY_EVIDENCE",
    "ALTER_HISTORY",
    "OVERRIDE_GOVERNANCE",
  ] as readonly GovernanceReplayViewerAction[])("blocks prohibited replay viewer action %s", (action) => {
    expect(() => assertGovernanceReplayViewerActionBlocked(action)).toThrow("Governance Replay Viewer is read-only");
  });
});
