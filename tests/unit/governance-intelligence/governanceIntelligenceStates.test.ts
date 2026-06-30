import { describe, expect, it } from "vitest";
import {
  buildGovernanceIntelligenceRecord,
  buildGovernanceIntelligenceStateDoctrine,
  buildGovernanceStateObservabilitySurface,
  computeGovernanceStateHash,
  getAllowedGovernanceStateTransitions,
  getBlockedGovernanceStateTransitions,
  isGovernanceIntelligenceState,
  recordGovernanceStateTransition,
  replayGovernanceStatePath,
} from "@/services/governance-intelligence";
import type { GovernanceIntelligenceRecord, GovernanceIntelligenceState } from "@/types/governance-intelligence";

function record(overrides: Partial<GovernanceIntelligenceRecord> = {}) {
  return buildGovernanceIntelligenceRecord(overrides);
}

function transition(from: GovernanceIntelligenceState, to: GovernanceIntelligenceState, overrides: Partial<GovernanceIntelligenceRecord> = {}) {
  return recordGovernanceStateTransition(record({ intelligence_state: from, ...overrides }), to);
}

describe("Mission Control Phase 7A.2 Governance Intelligence States", () => {
  it("defines explicit state doctrine", () => {
    const doctrine = buildGovernanceIntelligenceStateDoctrine();
    expect(doctrine.principles).toContain("explicit-states");
    expect(doctrine.principles).toContain("ledger-recorded");
    expect(doctrine.blocked_behaviors).toContain("state skipping");
  });

  it.each(["CREATED", "ANALYZING", "CORRELATED", "RECOMMENDING", "ESCALATED", "CERTIFIED", "ARCHIVED"])("recognizes valid state %s", (state) => {
    expect(isGovernanceIntelligenceState(state)).toBe(true);
  });

  it("rejects unknown states", () => {
    expect(isGovernanceIntelligenceState("ACTIVE")).toBe(false);
  });

  it.each([
    ["CREATED", "ANALYZING"],
    ["ANALYZING", "CORRELATED"],
    ["CORRELATED", "RECOMMENDING"],
    ["RECOMMENDING", "ESCALATED"],
    ["RECOMMENDING", "CERTIFIED"],
    ["ESCALATED", "CERTIFIED"],
    ["CERTIFIED", "ARCHIVED"],
  ] as const)("allows %s to %s", (from, to) => {
    const overrides: Partial<GovernanceIntelligenceRecord> = to === "CERTIFIED" || from === "CERTIFIED" ? { certification_status: "PASS" } : {};
    const escalation = to === "ESCALATED" ? { escalation_refs: ["esc_policy_review_7a2"] } : {};
    const result = recordGovernanceStateTransition(record({ intelligence_state: from, ...overrides, ...escalation }), to, {
      escalation_reason: to === "ESCALATED" ? "POLICY_CONFLICT" : undefined,
    });
    expect(result.result.validation_result).toBe("PASS");
    expect(result.result.final_state).toBe(to);
    expect(result.event.ledger_recorded).toBe(true);
  });

  it.each([
    ["CREATED", "CERTIFIED", "STATE_SKIP_DETECTED"],
    ["CREATED", "ARCHIVED", "STATE_SKIP_DETECTED"],
    ["ANALYZING", "ARCHIVED", "STATE_SKIP_DETECTED"],
    ["CORRELATED", "CREATED", "STATE_REGRESSION_DETECTED"],
    ["RECOMMENDING", "CREATED", "STATE_REGRESSION_DETECTED"],
    ["RECOMMENDING", "ARCHIVED", "STATE_SKIP_DETECTED"],
    ["ESCALATED", "RECOMMENDING", "STATE_REGRESSION_DETECTED"],
    ["CERTIFIED", "RECOMMENDING", "CERTIFIED_MUTATION_ATTEMPTED"],
    ["ARCHIVED", "CERTIFIED", "ARCHIVED_REACTIVATION_ATTEMPTED"],
  ] as const)("blocks %s to %s", (from, to, reason) => {
    const result = recordGovernanceStateTransition(record({ intelligence_state: from, certification_status: "PASS" }), to);
    expect(result.result.validation_result).toBe("FAIL");
    expect(result.result.failure_reason).toBe(reason);
    expect(result.result.final_state).toBe(from);
    expect(result.result.recorded_to_ledger).toBe(true);
  });

  it("exposes allowed and blocked transitions", () => {
    expect(getAllowedGovernanceStateTransitions("RECOMMENDING")).toEqual(["ESCALATED", "CERTIFIED"]);
    expect(getBlockedGovernanceStateTransitions("CREATED")).toContain("CERTIFIED");
    expect(getBlockedGovernanceStateTransitions("ARCHIVED")).toEqual(["CREATED", "ANALYZING", "CORRELATED", "RECOMMENDING", "ESCALATED", "CERTIFIED"]);
  });

  it("requires replay references for transition", () => {
    const result = transition("CREATED", "ANALYZING", { replay_refs: [] });
    expect(result.result.validation_result).toBe("FAIL");
    expect(result.result.failure_reason).toBe("REPLAY_REF_MISSING");
  });

  it("requires lineage references for transition", () => {
    const result = transition("CREATED", "ANALYZING", { lineage_refs: [] });
    expect(result.result.failure_reason).toBe("LINEAGE_REF_MISSING");
  });

  it("detects tenant mismatch", () => {
    const result = recordGovernanceStateTransition(record(), "ANALYZING", { expected_tenant_id: "tenant_beta" });
    expect(result.result.failure_reason).toBe("TENANT_MISMATCH");
  });

  it("requires escalation references and reason", () => {
    expect(transition("RECOMMENDING", "ESCALATED").result.failure_reason).toBe("ESCALATION_REF_MISSING");
    const withoutReason = recordGovernanceStateTransition(record({ intelligence_state: "RECOMMENDING", escalation_refs: ["esc_7a2"] }), "ESCALATED");
    expect(withoutReason.result.failure_reason).toBe("ESCALATION_REASON_MISSING");
  });

  it("requires PASS or CONDITIONAL_PASS before certification", () => {
    const result = transition("RECOMMENDING", "CERTIFIED");
    expect(result.result.failure_reason).toBe("CERTIFICATION_STATUS_INVALID");
  });

  it("produces reproducible state hashes", () => {
    expect(computeGovernanceStateHash(record())).toBe(computeGovernanceStateHash(record()));
    expect(computeGovernanceStateHash(record())).not.toBe(computeGovernanceStateHash(record({ intelligence_state: "ANALYZING" })));
  });

  it("produces reproducible transition hashes", () => {
    const first = recordGovernanceStateTransition(record(), "ANALYZING");
    const second = recordGovernanceStateTransition(record(), "ANALYZING");
    expect(first.event.transition_hash).toBe(second.event.transition_hash);
  });

  it("replays the same state path", () => {
    const created = record();
    const analyzing = recordGovernanceStateTransition(created, "ANALYZING");
    const correlated = recordGovernanceStateTransition(analyzing.record, "CORRELATED", { previous_state_hash: analyzing.event.new_state_hash });
    const recommending = recordGovernanceStateTransition(correlated.record, "RECOMMENDING", { previous_state_hash: correlated.event.new_state_hash });
    const replay = replayGovernanceStatePath(created, [analyzing.event, correlated.event, recommending.event]);
    expect(replay.validation_result).toBe("PASS");
    expect(replay.reconstructed_state_path).toEqual(["CREATED", "ANALYZING", "CORRELATED", "RECOMMENDING"]);
    expect(replay.final_reconstructed_state).toBe("RECOMMENDING");
  });

  it("detects replay hash mismatch", () => {
    const created = record();
    const event = recordGovernanceStateTransition(created, "ANALYZING").event;
    const replay = replayGovernanceStatePath(created, [{ ...event, new_state_hash: "tampered_state_hash" }]);
    expect(replay.validation_result).toBe("FAIL");
    expect(replay.failure_reason).toBe("STATE_HASH_MISMATCH");
  });

  it("fails closed when replay history is missing", () => {
    const replay = replayGovernanceStatePath(record(), []);
    expect(replay.validation_result).toBe("FAIL");
    expect(replay.failure_reason).toBe("MISSING_TRANSITION_EVENT");
  });

  it("builds an operator observability surface", () => {
    const created = record();
    const transitionRecord = recordGovernanceStateTransition(created, "ANALYZING");
    const surface = buildGovernanceStateObservabilitySurface(transitionRecord.record, [transitionRecord.event]);
    expect(surface.current_state).toBe("ANALYZING");
    expect(surface.previous_state).toBe("CREATED");
    expect(surface.allowed_next_states).toEqual(["CORRELATED"]);
    expect(surface.transition_history).toHaveLength(1);
    expect(surface.evidence_refs).toEqual(created.evidence_refs);
  });
});
