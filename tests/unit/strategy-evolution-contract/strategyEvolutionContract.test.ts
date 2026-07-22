import { describe, expect, it } from "vitest";
import {
  PROHIBITED_STRATEGY_MUTATIONS,
  STRATEGY_DOMAINS,
  getStrategyEvolutionContractFoundation,
  replayStrategyEvolutionContract,
  validateStrategyEvolutionContract,
} from "@/services/strategy-evolution-contract";
import type { StrategyContractFailure, StrategyContractScenario } from "@/types/strategy-evolution-contract";

describe("Mission Control Phase 10.5.1 Strategy Evolution Contract", () => {
  it("publishes the strategy evolution contract foundation", () => {
    const foundation = getStrategyEvolutionContractFoundation();

    expect(foundation.strategy_evolution_contract_version).toBe("strategy-evolution-contract/v1");
    expect(foundation.api_surface.validate_proposal).toBe("POST /strategy-evolution-contract/validate");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("registers all supported strategy domains and prohibited mutations", () => {
    const result = validateStrategyEvolutionContract();

    expect(result.contract.strategy_domains).toEqual(STRATEGY_DOMAINS);
    expect(result.contract.prohibited_domains).toEqual(PROHIBITED_STRATEGY_MUTATIONS);
    expect(result.contract.strategy_domains).toContain("PRIORITIZATION");
    expect(result.contract.prohibited_domains).toContain("AUTHORITY_EXPANSION");
  });

  it("requires full Pattern Intelligence certification before Strategy Evolution", () => {
    const result = validateStrategyEvolutionContract();

    expect(result.pattern_certification.certification_record.certification_state).toBe("PASS");
    expect(result.validation.pattern_intelligence_certified).toBe(true);
  });

  it("enforces governance, simulation, certification, rollback, replay, and operator approval requirements", () => {
    const result = validateStrategyEvolutionContract();

    expect(result.validation.governance_requirements_complete).toBe(true);
    expect(result.validation.simulation_requirements_complete).toBe(true);
    expect(result.validation.certification_requirements_complete).toBe(true);
    expect(result.validation.rollback_requirements_complete).toBe(true);
    expect(result.validation.replay_requirements_complete).toBe(true);
    expect(result.validation.operator_approval_required).toBe(true);
  });

  it("keeps the contract advisory-only and non-mutating", () => {
    const result = validateStrategyEvolutionContract();

    expect(result.advisory_only).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.autonomous_strategy_mutation).toBe(false);
    expect(result.validation.no_autonomous_strategy_mutation).toBe(true);
  });

  it("creates deterministic integrity and replay output", () => {
    const first = validateStrategyEvolutionContract();
    const second = validateStrategyEvolutionContract();

    expect(first.contract.integrity_hash).toBe(second.contract.integrity_hash);
    expect(first.proposal_envelope.integrity_hash).toBe(second.proposal_envelope.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayStrategyEvolutionContract(first)).toBe(true);
  });

  it("rejects multi-domain proposals unless explicitly approved", () => {
    const result = validateStrategyEvolutionContract({ scenario: "MULTI_DOMAIN_UNAPPROVED" });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain("MULTI_DOMAIN_NOT_APPROVED");
  });

  it.each([
    ["PATTERN_CERTIFICATION_MISSING", "PATTERN_INTELLIGENCE_CERTIFICATION_REQUIRED"],
    ["UNKNOWN_DOMAIN", "UNKNOWN_STRATEGY_DOMAIN"],
    ["MULTI_DOMAIN_UNAPPROVED", "MULTI_DOMAIN_NOT_APPROVED"],
    ["PROHIBITED_MUTATION", "PROHIBITED_STRATEGY_MUTATION"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REQUIREMENTS_MISSING"],
    ["MISSING_SIMULATION", "SIMULATION_REQUIREMENT_ABSENT"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_ROLLBACK", "ROLLBACK_PLAN_ABSENT"],
    ["OPERATOR_APPROVAL_DISABLED", "OPERATOR_APPROVAL_DISABLED"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REQUIREMENT_ABSENT"],
    ["ADVISORY_DISABLED", "ADVISORY_ONLY_DISABLED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_INVALID"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["INVALID_LIFECYCLE", "INVALID_LIFECYCLE_TRANSITION"],
    ["AUTONOMOUS_MUTATION", "AUTONOMOUS_STRATEGY_MUTATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["SIMULATION_BYPASS", "SIMULATION_BYPASS_DETECTED"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_BYPASS_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategyContractScenario, StrategyContractFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateStrategyEvolutionContract({ scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.autonomous_strategy_mutation).toBe(false);
  });

  it("detects strategy contract tampering during replay", () => {
    const result = validateStrategyEvolutionContract();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategyEvolutionContract(tampered)).toBe(false);
  });
});
