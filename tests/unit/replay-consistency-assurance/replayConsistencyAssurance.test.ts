import { describe, expect, it } from "vitest";
import {
  buildReplayConsistencyObservabilitySurface,
  compareReplay,
  generateReplayReport,
  getReplayConsistencyAssurance,
  replayCommunication,
  replayDelegation,
  replayPlanning,
  replaySharedState,
  startReplay,
  validateReplayConsistency,
} from "@/services/replay-consistency-assurance";
import type { ReplayConsistencyFailure, ReplayConsistencyScenario } from "@/types/replay-consistency-assurance";

describe("replay consistency assurance", () => {
  it("publishes the 8ALT.7.7 certified doctrine bundle", () => {
    const bundle = getReplayConsistencyAssurance();

    expect(bundle.doctrine.contract_version).toBe("replay-consistency-assurance/v8ALT.7.7");
    expect(bundle.doctrine.final_state).toBe("REPLAY_CONSISTENCY_ASSURANCE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.session.state).toBe("REPRODUCED");
  });

  it("creates a valid immutable replay contract and deterministic session", () => {
    const first = startReplay();
    const second = startReplay();
    const validation = validateReplayConsistency(first);

    expect(first.contract_hash).toBe(second.contract_hash);
    expect(validation.contract_valid).toBe(true);
    expect(first.contract.immutable).toBe(true);
    expect(first.contract.append_only).toBe(true);
  });

  it("reproduces planning, delegation, communication, governance, authority, shared state, and interventions", () => {
    const validation = validateReplayConsistency();

    expect(validation.planning_reproduced).toBe(true);
    expect(validation.delegation_reproduced).toBe(true);
    expect(validation.communication_reproduced).toBe(true);
    expect(validation.governance_reproduced).toBe(true);
    expect(validation.authority_reproduced).toBe(true);
    expect(validation.shared_state_reproduced).toBe(true);
    expect(validation.intervention_reproduced).toBe(true);
  });

  it("exposes replay helpers for core artifact groups", () => {
    expect(replayPlanning()).toHaveLength(1);
    expect(replayDelegation()).toHaveLength(1);
    expect(replayCommunication()).toHaveLength(1);
    expect(replaySharedState()).toHaveLength(1);
  });

  it("preserves ordering, evidence, agent state, integrity, lineage, visibility, and tenant isolation", () => {
    const validation = validateReplayConsistency();

    expect(validation.ordering_deterministic).toBe(true);
    expect(validation.evidence_complete).toBe(true);
    expect(validation.agent_state_identical).toBe(true);
    expect(validation.integrity_verified).toBe(true);
    expect(validation.hash_chain_verified).toBe(true);
    expect(validation.lineage_preserved).toBe(true);
    expect(validation.operator_visible).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
  });

  it.each([
    ["PLANNING_MISMATCH", "PLANNING_REPLAY_MISMATCH_DETECTED"],
    ["DELEGATION_MISMATCH", "DELEGATION_REPLAY_MISMATCH_DETECTED"],
    ["MISSING_COMMUNICATION", "MISSING_COMMUNICATION_DETECTED"],
    ["GOVERNANCE_MISMATCH", "GOVERNANCE_REPLAY_MISMATCH_DETECTED"],
    ["AUTHORITY_MISMATCH", "AUTHORITY_REPLAY_MISMATCH_DETECTED"],
    ["SHARED_STATE_MISMATCH", "SHARED_STATE_REPLAY_MISMATCH_DETECTED"],
    ["INTERVENTION_MISMATCH", "INTERVENTION_REPLAY_MISMATCH_DETECTED"],
    ["ORDERING_MISMATCH", "ORDERING_MISMATCH_DETECTED"],
    ["INCOMPLETE_REPLAY", "INCOMPLETE_REPLAY_DETECTED"],
    ["INCONSISTENT_AGENT_STATE", "INCONSISTENT_AGENT_STATE_RECONSTRUCTION_DETECTED"],
    ["INTEGRITY_FAILURE", "REPLAY_INTEGRITY_VERIFICATION_FAILED"],
    ["CROSS_TENANT_REPLAY", "CROSS_TENANT_REPLAY_CONTAMINATION_DETECTED"],
  ] satisfies [ReplayConsistencyScenario, ReplayConsistencyFailure][])("fails closed for %s", (scenario, failure) => {
    const session = startReplay({ scenario });
    const validation = validateReplayConsistency(session);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("returns mismatch analysis and replay reports without mutation", () => {
    const mismatches = compareReplay({ scenario: "AUTHORITY_MISMATCH" });
    const report = generateReplayReport({ scenario: "AUTHORITY_MISMATCH" });

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({ root_cause: "AUTHORITY_REPLAY_MISMATCH_DETECTED", severity: "CRITICAL" });
    expect(report.validation.failures).toContain("AUTHORITY_REPLAY_MISMATCH_DETECTED");
  });

  it("publishes replay observability", () => {
    const surface = buildReplayConsistencyObservabilitySurface();

    expect(surface.state).toBe("REPRODUCED");
    expect(surface.replay_entry_count).toBe(9);
    expect(surface.agent_trace_count).toBe(4);
    expect(surface.mismatch_count).toBe(0);
    expect(surface.contract_hash).toBeTruthy();
  });
});
