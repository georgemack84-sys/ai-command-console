import { describe, expect, it } from "vitest";
import { reviewGovernanceConstitutionalStrategy } from "@/services/governance-constitutional-strategy-review";
import { recordStrategyEvolutionLedger } from "@/services/strategy-evolution-ledger";
import { generateStrategyImprovementProposals } from "@/services/strategy-improvement-proposal-generator";
import { bindStrategySimulation } from "@/services/strategy-simulation-binding-engine";
import { replayStrategyEvolutionExplainability } from "@/services/strategy-replay-explainability-engine";
import {
  certifyStrategyEvolution,
  getStrategyEvolutionCertificationFoundation,
  replayStrategyEvolutionCertification,
} from "@/services/strategy-evolution-certification-gate";
import type {
  StrategyEvolutionCertificationFailure,
  StrategyEvolutionCertificationScenario,
} from "@/types/strategy-evolution-certification-gate";

const proposal_result = generateStrategyImprovementProposals();
const ledger_result = recordStrategyEvolutionLedger({ proposal_result });
const review_result = reviewGovernanceConstitutionalStrategy({ ledger_result });
const simulation_result = bindStrategySimulation({ review_result });
const replay_result = replayStrategyEvolutionExplainability({ simulation_result });

describe("Mission Control Phase 10.5.10 Strategy Evolution Certification Gate", () => {
  it("publishes the strategy evolution certification foundation", () => {
    const foundation = getStrategyEvolutionCertificationFoundation();

    expect(foundation.strategy_evolution_certification_gate_version).toBe("strategy-evolution-certification-gate/v1");
    expect(foundation.api_surface.certify_strategy_evolution).toBe("POST /strategy-evolution-certification-gate/certify");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("certifies strategy evolution deterministically with PASS", () => {
    const first = certifyStrategyEvolution({ replay_result });
    const second = certifyStrategyEvolution({ replay_result });

    expect(first.certification_outcome).toBe("PASS");
    expect(first.production_ready).toBe(true);
    expect(first.certification_records[0].certification_id).toBe(second.certification_records[0].certification_id);
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("blocks progression for conditional pass", () => {
    const result = certifyStrategyEvolution({ replay_result, scenario: "CONDITIONAL_PASS" });

    expect(result.certification_outcome).toBe("CONDITIONAL_PASS");
    expect(result.validation.state).toBe("CONDITIONAL");
    expect(result.production_ready).toBe(false);
    expect(result.validation.failures).toContain("NON_FUNCTIONAL_DEFICIENCY_REMAINING");
  });

  it("records all certification status dimensions", () => {
    const record = certifyStrategyEvolution({ replay_result }).certification_records[0];

    expect(record.functional_validation_status).toBe("PASS");
    expect(record.governance_validation_status).toBe("PASS");
    expect(record.constitutional_validation_status).toBe("PASS");
    expect(record.simulation_validation_status).toBe("PASS");
    expect(record.replay_validation_status).toBe("PASS");
    expect(record.explainability_validation_status).toBe("PASS");
    expect(record.integrity_validation_status).toBe("PASS");
    expect(record.production_ready).toBe(true);
  });

  it("keeps certification advisory-only and does not authorize adoption", () => {
    const result = certifyStrategyEvolution({ replay_result });
    const record = result.certification_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_strategy).toBe(false);
    expect(result.authorizes_adoption).toBe(false);
    expect(record.advisory_only_verified).toBe(true);
    expect(record.mutation_blocked).toBe(true);
  });

  it("records immutable append-only certification registry entries", () => {
    const result = certifyStrategyEvolution({ replay_result });
    const record = result.certification_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.certification_refs).toEqual([record.certification_id]);
    expect(result.registry.outcome_index[record.certification_outcome]).toEqual([record.certification_id]);
  });

  it("replays strategy evolution certification", () => {
    const result = certifyStrategyEvolution({ replay_result });

    expect(replayStrategyEvolutionCertification(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_REPLAY", "REPLAY_EXPLAINABILITY_UNCERTIFIED"],
    ["INVALID_CONTRACT", "STRATEGY_EVOLUTION_CONTRACT_INVALID"],
    ["NONDETERMINISTIC_PROPOSAL", "PROPOSAL_GENERATION_NONDETERMINISTIC"],
    ["MISSING_EVIDENCE", "SUPPORTING_EVIDENCE_INCOMPLETE"],
    ["MISSING_PATTERNS", "SUPPORTING_PATTERNS_ABSENT"],
    ["MISSING_OUTCOMES", "SUPPORTING_OUTCOMES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_IMPLICATIONS_MISSING"],
    ["MISSING_CONSTITUTIONAL", "CONSTITUTIONAL_IMPLICATIONS_MISSING"],
    ["MISSING_OPERATOR", "OPERATOR_IMPACT_UNDOCUMENTED"],
    ["SIMULATION_BYPASS", "SIMULATION_REQUIREMENT_BYPASSED"],
    ["APPROVAL_BYPASS", "APPROVAL_REQUIREMENT_BYPASSED"],
    ["CERTIFICATION_BYPASS", "CERTIFICATION_REQUIREMENT_BYPASSED"],
    ["MISSING_ROLLBACK", "ROLLBACK_PLAN_ABSENT"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_INCOMPLETE"],
    ["MISSING_LINEAGE", "PROPOSAL_LINEAGE_INCOMPLETE"],
    ["REPLAY_DIVERGENCE", "REPLAY_RECONSTRUCTION_DIVERGED"],
    ["HIDDEN_REASONING", "HIDDEN_REASONING_DETECTED"],
    ["STRATEGY_MUTATION", "UNAUTHORIZED_STRATEGY_MUTATION_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_REVIEW_BYPASSED"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_REVIEW_BYPASSED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["FAIL_OPEN", "FAIL_CLOSED_BEHAVIOR_NOT_ENFORCED"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
  ] as readonly [StrategyEvolutionCertificationScenario, StrategyEvolutionCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = certifyStrategyEvolution({ replay_result, scenario });

    expect(result.certification_outcome).toBe("FAIL");
    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.production_ready).toBe(false);
    expect(result.authorizes_adoption).toBe(false);
  });

  it("detects certification tampering during replay", () => {
    const result = certifyStrategyEvolution({ replay_result });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategyEvolutionCertification(tampered)).toBe(false);
  });
});
