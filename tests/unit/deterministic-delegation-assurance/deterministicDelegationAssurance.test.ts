import { describe, expect, it } from "vitest";
import {
  buildDelegationObservabilitySurface,
  computeFallbackRoute,
  detectDelegationConflicts,
  generateDelegationMap,
  getDeterministicDelegationAssurance,
  replayDelegationAssurance,
  validateCapabilityMatch,
  validateDelegationAssurance,
  validateDelegationAuthority,
  validateDelegationReplay,
} from "@/services/deterministic-delegation-assurance";
import type { DelegationFailure, DelegationScenario } from "@/types/deterministic-delegation-assurance";

describe("deterministic delegation assurance", () => {
  it("publishes the 8ALT.7.3 certified doctrine bundle", () => {
    const bundle = getDeterministicDelegationAssurance();

    expect(bundle.doctrine.contract_version).toBe("deterministic-delegation-assurance/v8ALT.7.3");
    expect(bundle.doctrine.final_state).toBe("DETERMINISTIC_DELEGATION_ASSURANCE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.replay.delegation_replay_status).toBe("REPRODUCIBLE");
  });

  it("produces identical delegation maps for identical inputs", () => {
    const first = generateDelegationMap();
    const second = generateDelegationMap();

    expect(first.contract_hash).toBe(second.contract_hash);
    expect(first.delegation_records.map((record) => `${record.task_id}:${record.assigned_agent}`)).toEqual(second.delegation_records.map((record) => `${record.task_id}:${record.assigned_agent}`));
    expect(validateDelegationAssurance(first).reproducible).toBe(true);
  });

  it("matches capabilities, authority, and ownership deterministically", () => {
    const contract = generateDelegationMap();
    const validation = validateDelegationAssurance(contract);

    expect(validateCapabilityMatch().capability_valid).toBe(true);
    expect(validateDelegationAuthority().authority_valid).toBe(true);
    expect(validation.ownership_unique).toBe(true);
    expect(contract.ownership_ledger).toHaveLength(contract.delegation_records.length);
    expect(contract.delegation_policy).toContain("no-execution-dispatch");
  });

  it("handles blocked tasks and fallback routes deterministically", () => {
    const contract = generateDelegationMap();
    const fallbacks = computeFallbackRoute();
    const validation = validateDelegationAssurance(contract);

    expect(validation.blocked_task_handling_valid).toBe(true);
    expect(validation.fallback_valid).toBe(true);
    expect(contract.blocked_tasks[0]).toMatchObject({ delegated: false, action: "ESCALATE_TO_OPERATOR" });
    expect(fallbacks.every((route) => route.preserves_authority && route.preserves_governance)).toBe(true);
  });

  it("preserves replay references, lineage, integrity, and operator visibility", () => {
    const contract = generateDelegationMap();
    const validation = validateDelegationAssurance(contract);
    const replay = replayDelegationAssurance(contract);

    expect(validateDelegationReplay().replay_valid).toBe(true);
    expect(validation.lineage_preserved).toBe(true);
    expect(validation.integrity_valid).toBe(true);
    expect(validation.tenant_isolated).toBe(true);
    expect(validation.operator_visible).toBe(true);
    expect(replay.reproducibility_score).toBe(1);
  });

  it.each([
    ["REPLAY_MISMATCH", "DELEGATION_REPLAY_MISMATCH"],
    ["NONDETERMINISTIC_ASSIGNMENT", "NONDETERMINISTIC_TASK_ASSIGNMENT_DETECTED"],
    ["CAPABILITY_MISMATCH", "CAPABILITY_MISMATCH_DETECTED"],
    ["DUPLICATE_OWNERSHIP", "DUPLICATE_OWNERSHIP_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_DELEGATION", "UNAUTHORIZED_DELEGATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["BLOCKED_TASK_DELEGATED", "BLOCKED_TASK_INCORRECTLY_DELEGATED"],
    ["FALLBACK_MISMATCH", "FALLBACK_ROUTING_MISMATCH_DETECTED"],
    ["CIRCULAR_DELEGATION", "CIRCULAR_DELEGATION_DETECTED"],
    ["MISSING_ACCOUNTABILITY", "MISSING_ACCOUNTABILITY_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
    ["CROSS_TENANT_DELEGATION", "CROSS_TENANT_DELEGATION_DETECTED"],
    ["HIDDEN_DELEGATION", "HIDDEN_DELEGATION_DETECTED"],
  ] satisfies [DelegationScenario, DelegationFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = generateDelegationMap({ scenario });
    const validation = validateDelegationAssurance(contract);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("returns explainable delegation conflicts", () => {
    const conflicts = detectDelegationConflicts({ scenario: "AUTHORITY_ESCALATION" });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({ conflict_type: "AUTHORITY", severity: "CRITICAL" });
    expect(conflicts[0].authority_review).toBeTruthy();
  });

  it("publishes a delegation observability surface", () => {
    const surface = buildDelegationObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.delegation_count).toBeGreaterThan(0);
    expect(surface.ownership_count).toBe(surface.delegation_count);
    expect(surface.blocked_task_count).toBe(1);
    expect(surface.contract_hash).toBeTruthy();
  });
});
