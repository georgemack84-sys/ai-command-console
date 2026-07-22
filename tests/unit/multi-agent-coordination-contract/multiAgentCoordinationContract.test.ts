import { describe, expect, it } from "vitest";
import {
  buildCoordinationObservabilitySurface,
  createCoordinationContract,
  getMultiAgentCoordinationContract,
  registerAgent,
  replayCoordinationContract,
  validateAuthority,
  validateCommunication,
  validateCoordinationContract,
  validateGovernance,
  validateReplay,
} from "@/services/multi-agent-coordination-contract";
import type { CoordinationFailure, CoordinationScenario } from "@/types/multi-agent-coordination-contract";

describe("multi-agent coordination contract", () => {
  it("publishes the certified doctrine bundle", () => {
    const bundle = getMultiAgentCoordinationContract();

    expect(bundle.doctrine.contract_version).toBe("multi-agent-coordination-contract/v8ALT.7.1");
    expect(bundle.doctrine.final_state).toBe("MULTI_AGENT_COORDINATION_CONTRACT_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.replay.deterministic).toBe(true);
  });

  it("creates an immutable append-only contract with deterministic identity surfaces", () => {
    const contract = createCoordinationContract();

    expect(contract.immutable).toBe(true);
    expect(contract.append_only).toBe(true);
    expect(contract.coordination_contract_id).toMatch(/^MACC-/);
    expect(contract.coordination_session_id).toMatch(/^MACS-/);
    expect(contract.participating_agents.length).toBeGreaterThan(5);
    expect(contract.participating_agents.every((agent) => agent.tenant_id === contract.tenant_id)).toBe(true);
    expect(contract.lifecycle_events.every((event) => event.hash)).toBe(true);
    expect(contract.contract_hash).toBeTruthy();
  });

  it("registers only certified tenant-scoped agents in the baseline contract", () => {
    const agents = registerAgent();

    expect(agents.every((agent) => agent.certification_level === "CERTIFIED")).toBe(true);
    expect(agents.every((agent) => agent.status === "ACTIVE")).toBe(true);
    expect(new Set(agents.map((agent) => agent.agent_id)).size).toBe(agents.length);
  });

  it("enforces the communication matrix and blocks executor communication", () => {
    const contract = createCoordinationContract();
    const governanceAdvisor = contract.communication_policy.find((item) => item.source_role === "Governance Advisor");
    const executor = contract.communication_policy.find((item) => item.source_role === "Executor");

    expect(governanceAdvisor).toMatchObject({ target_role: "All", allowed: true, governance_required: true, replay_required: true });
    expect(executor).toMatchObject({ target_role: "All", allowed: false, governance_required: false, replay_required: false });
    expect(validateCommunication().communication_valid).toBe(true);
  });

  it("separates roles from authority and does not grant execution power", () => {
    const contract = createCoordinationContract();

    expect(contract.participating_agents.find((agent) => agent.role === "Executor")).toBeUndefined();
    expect(contract.participating_agents.every((agent) => agent.authority_profile !== "NONE" || agent.role === "Executor")).toBe(true);
    expect(contract.coordination_constraints).toContain("no-execution-authority");
    expect(contract.coordination_constraints).toContain("no-policy-modification");
    expect(validateAuthority().authority_valid).toBe(true);
  });

  it("requires governance, constitutional, and replay bindings", () => {
    expect(validateGovernance().governance_valid).toBe(true);
    expect(validateReplay().replay_valid).toBe(true);

    const contract = createCoordinationContract();
    expect(contract.governance_binding.governance_context_id).toBeTruthy();
    expect(contract.governance_binding.constitution_version).toBeTruthy();
    expect(contract.replay_policy).toContain("deterministic-ordering");
  });

  it("replays deterministically with reproducible hashes", () => {
    const contract = createCoordinationContract();
    const first = replayCoordinationContract(contract);
    const second = replayCoordinationContract(contract);

    expect(first.deterministic).toBe(true);
    expect(first.reconstructed_hash).toBe(second.reconstructed_hash);
    expect(first.replay_result_hash).toBe(second.replay_result_hash);
  });

  it.each([
    ["UNCERTIFIED_AGENT", "UNCERTIFIED_AGENT_DETECTED"],
    ["DUPLICATE_AGENT_IDENTITY", "DUPLICATE_AGENT_IDENTITY_DETECTED"],
    ["MISSION_SCOPE_MISMATCH", "MISSION_SCOPE_MISMATCH_DETECTED"],
    ["ROLE_AMBIGUITY", "ROLE_AMBIGUITY_DETECTED"],
    ["AUTHORITY_OVERLAP", "AUTHORITY_OVERLAP_DETECTED"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ESCALATION_DETECTED"],
    ["UNAUTHORIZED_COMMUNICATION", "UNAUTHORIZED_COMMUNICATION_PERMITTED"],
    ["CIRCULAR_DELEGATION", "CIRCULAR_DELEGATION_DETECTED"],
    ["MISSING_GOVERNANCE_REFERENCE", "GOVERNANCE_REFERENCE_MISSING"],
    ["MISSING_CONSTITUTIONAL_REFERENCE", "CONSTITUTIONAL_REFERENCE_MISSING"],
    ["MISSING_REPLAY_REQUIREMENTS", "REPLAY_REQUIREMENTS_MISSING"],
    ["CROSS_TENANT_PARTICIPATION", "CROSS_TENANT_PARTICIPATION_REJECTED"],
    ["HIDDEN_PARTICIPANT", "HIDDEN_PARTICIPANT_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
  ] satisfies [CoordinationScenario, CoordinationFailure][])("fails closed for %s", (scenario, failure) => {
    const contract = createCoordinationContract({ scenario });
    const validation = validateCoordinationContract(contract);

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("publishes an operator-visible observability surface", () => {
    const surface = buildCoordinationObservabilitySurface();

    expect(surface.state).toBe("CERTIFIED");
    expect(surface.append_only).toBe(true);
    expect(surface.agent_count).toBeGreaterThan(5);
    expect(surface.contract_hash).toBeTruthy();
  });
});
