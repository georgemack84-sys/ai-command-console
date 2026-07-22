import { describe, expect, it } from "vitest";
import { generateStrategyImprovementProposals } from "@/services/strategy-improvement-proposal-generator";
import {
  getStrategyEvolutionLedgerFoundation,
  recordStrategyEvolutionLedger,
  replayStrategyEvolutionLedger,
} from "@/services/strategy-evolution-ledger";
import type { StrategyEvolutionLedgerFailure, StrategyEvolutionLedgerScenario } from "@/types/strategy-evolution-ledger";

const proposal_result = generateStrategyImprovementProposals();

describe("Mission Control Phase 10.5.6 Strategy Evolution Ledger", () => {
  it("publishes the strategy evolution ledger foundation", () => {
    const foundation = getStrategyEvolutionLedgerFoundation();

    expect(foundation.strategy_evolution_ledger_version).toBe("strategy-evolution-ledger/v1");
    expect(foundation.api_surface.record_proposal).toBe("POST /strategy-evolution-ledger/record");
    expect(foundation.result.validation.state).toBe("CERTIFIED");
  });

  it("records proposal ledger entries deterministically", () => {
    const first = recordStrategyEvolutionLedger({ proposal_result });
    const second = recordStrategyEvolutionLedger({ proposal_result });

    expect(first.records[0].ledger_record_id).toBe(second.records[0].ledger_record_id);
    expect(first.records[0].proposal_version).toBe("v1");
    expect(first.records[0].previous_hash).toBe("GENESIS");
    expect(first.integrity_hash).toBe(second.integrity_hash);
  });

  it("tracks revisions, archived records, and superseded records without deleting history", () => {
    const revision = recordStrategyEvolutionLedger({ proposal_result, scenario: "REVISION" }).records[0];
    const archived = recordStrategyEvolutionLedger({ proposal_result, scenario: "ARCHIVED" }).records[0];
    const superseded = recordStrategyEvolutionLedger({ proposal_result, scenario: "SUPERSEDED" }).records[0];

    expect(revision.proposal_version).toBe("v2");
    expect(revision.parent_version_ref).toContain(":v1");
    expect(archived.lifecycle_state).toBe("ARCHIVED");
    expect(superseded.lifecycle_state).toBe("SUPERSEDED");
    expect(superseded.superseded_by_ref).toContain(":v2");
  });

  it("preserves governance, simulation, certification, replay, rollback, and lineage references", () => {
    const record = recordStrategyEvolutionLedger({ proposal_result }).records[0];

    expect(record.governance_decision_refs.length).toBeGreaterThan(0);
    expect(record.simulation_refs.length).toBeGreaterThan(0);
    expect(record.certification_refs.length).toBeGreaterThan(0);
    expect(record.replay_refs.length).toBeGreaterThan(0);
    expect(record.rollback_refs.length).toBeGreaterThan(0);
    expect(record.lineage_refs.length).toBeGreaterThan(0);
  });

  it("keeps ledger records immutable and append-only", () => {
    const result = recordStrategyEvolutionLedger({ proposal_result });
    const record = result.records[0];

    expect(record.append_only).toBe(true);
    expect(record.immutable).toBe(true);
    expect(record.deleted).toBe(false);
    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.ledger_record_refs).toEqual([record.ledger_record_id]);
  });

  it("replays strategy evolution ledger reconstruction", () => {
    const result = recordStrategyEvolutionLedger({ proposal_result });

    expect(replayStrategyEvolutionLedger(result)).toBe(true);
  });

  it.each([
    ["UNCERTIFIED_PROPOSAL", "PROPOSAL_GENERATOR_UNCERTIFIED"],
    ["MISSING_PROPOSAL_ID", "PROPOSAL_IDENTIFIER_MISSING"],
    ["MISSING_VERSION", "PROPOSAL_VERSION_MISSING"],
    ["VERSION_OVERWRITE", "VERSION_OVERWRITE_ATTEMPTED"],
    ["LEDGER_MUTATION", "LEDGER_MUTATION_ATTEMPTED"],
    ["MISSING_LINEAGE", "LINEAGE_REFERENCE_INCOMPLETE"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_ROLLBACK", "ROLLBACK_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_REFERENCES_INCOMPLETE"],
    ["MISSING_SIMULATION", "SIMULATION_REFERENCES_MISSING"],
    ["MISSING_CERTIFICATION", "CERTIFICATION_REFERENCES_MISSING"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["PREVIOUS_HASH_MISMATCH", "PREVIOUS_HASH_MISMATCH"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["APPEND_ONLY_VIOLATION", "APPEND_ONLY_VIOLATION"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [StrategyEvolutionLedgerScenario, StrategyEvolutionLedgerFailure][])("fails closed for %s", (scenario, failure) => {
    const result = recordStrategyEvolutionLedger({ proposal_result, scenario });

    expect(result.validation.certified).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.immutable).toBe(result.validation.registry_immutable);
  });

  it("keeps missing references pending instead of certified", () => {
    const result = recordStrategyEvolutionLedger({ proposal_result, scenario: "MISSING_REPLAY" });

    expect(result.validation.state).toBe("PENDING_REFERENCES");
    expect(result.validation.replay_complete).toBe(false);
  });

  it("detects ledger tampering during replay", () => {
    const result = recordStrategyEvolutionLedger({ proposal_result });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayStrategyEvolutionLedger(tampered)).toBe(false);
  });
});
