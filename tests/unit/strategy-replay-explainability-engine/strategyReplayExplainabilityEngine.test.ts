import { describe, expect, it } from "vitest";
import { reviewGovernanceConstitutionalStrategy } from "@/services/governance-constitutional-strategy-review";
import { recordStrategyEvolutionLedger } from "@/services/strategy-evolution-ledger";
import { generateStrategyImprovementProposals } from "@/services/strategy-improvement-proposal-generator";
import { bindStrategySimulation } from "@/services/strategy-simulation-binding-engine";
import {
  getStrategyReplayExplainabilityFoundation,
  replayStrategyEvolutionExplainability,
  replayStrategyReplayExplainability,
} from "@/services/strategy-replay-explainability-engine";
import type {
  StrategyReplayExplainabilityFailure,
  StrategyReplayExplainabilityScenario,
} from "@/types/strategy-replay-explainability-engine";

const proposal_result = generateStrategyImprovementProposals();
const ledger_result = recordStrategyEvolutionLedger({ proposal_result });
const review_result = reviewGovernanceConstitutionalStrategy({ ledger_result });
const simulation_result = bindStrategySimulation({ review_result });

describe("Mission Control Phase 10.5.9 Strategy Replay & Explainability Engine", () => {
  it("publishes the strategy replay explainability foundation", () => {
    const foundation = getStrategyReplayExplainabilityFoundation();

    expect(foundation.strategy_replay_explainability_engine_version).toBe("strategy-replay-explainability-engine/v1");
    expect(foundation.api_surface.replay_strategy).toBe("POST /strategy-replay-explainability-engine/replay");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("reconstructs strategy replay deterministically", () => {
    const first = replayStrategyEvolutionExplainability({ simulation_result });
    const second = replayStrategyEvolutionExplainability({ simulation_result });

    expect(first.replay_records[0].replay_id).toBe(second.replay_records[0].replay_id);
    expect(first.replay_records[0].replay_validation_status).toBe("VALIDATED");
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("supports replay component views", () => {
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "OUTCOME_REPLAY" }).replay_records[0].replay_type).toBe("OUTCOME");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "DECISION_REPLAY" }).replay_records[0].replay_type).toBe("DECISION");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "RECOMMENDATION_REPLAY" }).replay_records[0].replay_type).toBe("RECOMMENDATION");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "PATTERN_REPLAY" }).replay_records[0].replay_type).toBe("PATTERN");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "PROPOSAL_REPLAY" }).replay_records[0].replay_type).toBe("PROPOSAL");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "GOVERNANCE_REPLAY" }).replay_records[0].replay_type).toBe("GOVERNANCE");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "SIMULATION_REPLAY" }).replay_records[0].replay_type).toBe("SIMULATION");
    expect(replayStrategyEvolutionExplainability({ simulation_result, scenario: "OPERATOR_REPLAY" }).replay_records[0].replay_type).toBe("OPERATOR");
  });

  it("reconstructs all required references and explanation fields", () => {
    const record = replayStrategyEvolutionExplainability({ simulation_result }).replay_records[0];

    expect(record.outcome_refs.length).toBeGreaterThan(0);
    expect(record.decision_refs.length).toBeGreaterThan(0);
    expect(record.recommendation_refs.length).toBeGreaterThan(0);
    expect(record.pattern_refs.length).toBeGreaterThan(0);
    expect(record.proposal_refs.length).toBeGreaterThan(0);
    expect(record.governance_refs.length).toBeGreaterThan(0);
    expect(record.simulation_refs.length).toBeGreaterThan(0);
    expect(record.operator_review_refs.length).toBeGreaterThan(0);
    expect(record.evidence_refs.length).toBeGreaterThan(0);
    expect(record.lineage_refs.length).toBeGreaterThan(0);
    expect(record.decision_trace_refs.length).toBeGreaterThan(0);
    expect(record.explainability_summary.length).toBeGreaterThan(0);
  });

  it("keeps replay advisory-only and does not authorize adoption", () => {
    const result = replayStrategyEvolutionExplainability({ simulation_result });
    const record = result.replay_records[0];

    expect(result.advisory_only).toBe(true);
    expect(result.mutates_strategy).toBe(false);
    expect(result.authorizes_adoption).toBe(false);
    expect(record.advisory_only).toBe(true);
    expect(record.mutates_strategy).toBe(false);
  });

  it("records immutable append-only replay registry entries", () => {
    const result = replayStrategyEvolutionExplainability({ simulation_result });
    const record = result.replay_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.replay_refs).toEqual([record.replay_id]);
    expect(result.registry.replay_type_index[record.replay_type]).toEqual([record.replay_id]);
  });

  it("verifies replay explainability reconstruction", () => {
    const result = replayStrategyEvolutionExplainability({ simulation_result });

    expect(replayStrategyReplayExplainability(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_SIMULATION", "SIMULATION_BINDING_UNCERTIFIED"],
    ["MISSING_OUTCOME", "OUTCOME_REPLAY_INCOMPLETE"],
    ["MISSING_DECISION", "DECISION_REPLAY_INCOMPLETE"],
    ["MISSING_RECOMMENDATION", "RECOMMENDATION_REPLAY_MISSING"],
    ["MISSING_PATTERN", "PATTERN_REPLAY_INCOMPLETE"],
    ["MISSING_PROPOSAL", "PROPOSAL_REPLAY_INCOMPLETE"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REPLAY_INCOMPLETE"],
    ["MISSING_SIMULATION", "SIMULATION_REPLAY_INCOMPLETE"],
    ["MISSING_OPERATOR", "OPERATOR_REVIEW_HISTORY_MISSING"],
    ["MISSING_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["NONDETERMINISTIC_RECONSTRUCTION", "REPLAY_RECONSTRUCTION_NONDETERMINISTIC"],
    ["HIDDEN_REASONING", "HIDDEN_REASONING_DETECTED"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["ADVISORY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategyReplayExplainabilityScenario, StrategyReplayExplainabilityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = replayStrategyEvolutionExplainability({ simulation_result, scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.explainable).toBe(false);
    expect(result.authorizes_adoption).toBe(false);
  });

  it("keeps incomplete replay references pending instead of certified", () => {
    const result = replayStrategyEvolutionExplainability({ simulation_result, scenario: "MISSING_OUTCOME" });

    expect(result.validation.state).toBe("PENDING_REPLAY_REFERENCES");
    expect(result.validation.outcome_replay_complete).toBe(false);
  });

  it("detects replay explanation tampering", () => {
    const result = replayStrategyEvolutionExplainability({ simulation_result });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategyReplayExplainability(tampered)).toBe(false);
  });
});
