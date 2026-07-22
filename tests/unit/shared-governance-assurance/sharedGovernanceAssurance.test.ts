import { describe, expect, it } from "vitest";
import {
  buildSharedGovernanceObservabilitySurface,
  generateGovernanceInfluenceGraph,
  getSharedGovernanceAssurance,
  loadSharedGovernanceContext,
  replaySharedGovernance,
  validateConstitutionalContext,
  validateGovernanceEvidence,
  validateGovernanceReplay,
  validatePolicySynchronization,
  validateSharedGovernance,
} from "@/services/shared-governance-assurance";
import type { SharedGovernanceFailure, SharedGovernanceScenario } from "@/types/shared-governance-assurance";

describe("shared governance assurance", () => {
  it("publishes the 8ALT.7.5 certified doctrine bundle", () => {
    const bundle = getSharedGovernanceAssurance();

    expect(bundle.doctrine.contract_version).toBe("shared-governance-assurance/v8ALT.7.5");
    expect(bundle.doctrine.final_state).toBe("SHARED_GOVERNANCE_ASSURANCE_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.replay.deterministic).toBe(true);
  });

  it("establishes a deterministic shared governance context", () => {
    const first = loadSharedGovernanceContext();
    const second = loadSharedGovernanceContext();
    const validation = validateSharedGovernance(first);

    expect(first.contract_hash).toBe(second.contract_hash);
    expect(validation.context_shared).toBe(true);
    expect(validation.rules_identical).toBe(true);
    expect(first.governance_context.integrity_hash).toBeTruthy();
  });

  it("validates policy, constitutional, authority, and delegation synchronization", () => {
    const validation = validateSharedGovernance();

    expect(validatePolicySynchronization().policy_consistent).toBe(true);
    expect(validatePolicySynchronization().authority_policy_synchronized).toBe(true);
    expect(validateConstitutionalContext().constitutional_valid).toBe(true);
    expect(validation.delegation_governed).toBe(true);
  });

  it("preserves common evidence, Truth Ledger references, lineage, replay, and visibility", () => {
    const validation = validateSharedGovernance();
    const evidence = validateGovernanceEvidence();
    const replay = replaySharedGovernance();

    expect(evidence.evidence_valid).toBe(true);
    expect(evidence.truth_ledger_preserved).toBe(true);
    expect(validation.lineage_preserved).toBe(true);
    expect(validateGovernanceReplay().replay_valid).toBe(true);
    expect(validation.operator_visible).toBe(true);
    expect(replay.deterministic).toBe(true);
  });

  it("generates a complete governance influence graph", () => {
    const graph = generateGovernanceInfluenceGraph();

    expect(graph.length).toBe(10);
    expect(graph.every((node) => node.policy_node && node.constitution_node && node.authority_node && node.evidence_node && node.delegation_node)).toBe(true);
  });

  it.each([
    ["GOVERNANCE_CONTEXT_MISMATCH", "GOVERNANCE_CONTEXT_MISMATCH_DETECTED"],
    ["CONSTITUTIONAL_MISMATCH", "CONSTITUTIONAL_MISMATCH_DETECTED"],
    ["POLICY_DRIFT", "POLICY_DRIFT_DETECTED"],
    ["REPLAY_MISMATCH", "GOVERNANCE_REPLAY_MISMATCH_DETECTED"],
    ["MISSING_GOVERNANCE_EVIDENCE", "MISSING_GOVERNANCE_EVIDENCE_DETECTED"],
    ["DELEGATION_GOVERNANCE_BYPASS", "DELEGATION_BYPASSES_GOVERNANCE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["INCONSISTENT_RULE_INTERPRETATION", "INCONSISTENT_RULE_INTERPRETATION_DETECTED"],
    ["AUTHORITY_POLICY_MISMATCH", "AUTHORITY_POLICY_MISMATCH_DETECTED"],
    ["HIDDEN_GOVERNANCE_EVALUATION", "HIDDEN_GOVERNANCE_EVALUATION_DETECTED"],
    ["CROSS_TENANT_GOVERNANCE_LEAKAGE", "CROSS_TENANT_GOVERNANCE_LEAKAGE_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
  ] satisfies [SharedGovernanceScenario, SharedGovernanceFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = loadSharedGovernanceContext({ scenario });
    const validation = validateSharedGovernance(contract);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("publishes a shared governance observability surface", () => {
    const surface = buildSharedGovernanceObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.agent_count).toBeGreaterThan(5);
    expect(surface.policy_alignment_count).toBe(surface.agent_count);
    expect(surface.decision_count).toBe(10);
    expect(surface.contract_hash).toBeTruthy();
  });
});
