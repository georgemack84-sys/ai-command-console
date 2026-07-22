import { describe, expect, it } from "vitest";
import {
  buildHistoricalMaturityEvolution,
  buildHistoricalMaturityObservabilitySurface,
  getHistoricalMaturityEvolutionBundle,
  getHistoricalMaturityReport,
  getHistoricalMaturityTrends,
  listHistoricalMaturityLedger,
  listHistoricalMaturityTimeline,
  validateHistoricalMaturityEvolution,
} from "@/services/historical-maturity-evolution";
import type { HistoricalMaturityFailure, HistoricalMaturityScenario } from "@/types/historical-maturity-evolution";

describe("historical maturity evolution", () => {
  it("publishes the immutable advisory-only historical bundle", () => {
    const bundle = getHistoricalMaturityEvolutionBundle();

    expect(bundle.doctrine.engine_version).toBe("historical-maturity-evolution/v8ALT.11.5");
    expect(bundle.doctrine.final_state).toBe("HISTORICAL_MATURITY_EVOLUTION_READY");
    expect(bundle.repository.final_state).toBe("HISTORICAL_MATURITY_EVOLUTION_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.historical_record_modification_authorized).toBe(false);
    expect(bundle.repository.maturity_state_mutation_authorized).toBe(false);
    expect(bundle.repository.production_certification_authorized).toBe(false);
    expect(bundle.repository.execution_behavior_change_authorized).toBe(false);
  });

  it("records classification history without mutating maturity state", () => {
    const repository = buildHistoricalMaturityEvolution();

    expect(repository.ledger).toHaveLength(1);
    expect(repository.ledger[0]?.maturity_level).toBe("LEVEL_5_CERTIFIED_CONSTITUTIONAL_AUTONOMY");
    expect(repository.ledger[0]?.historical_state).toBe("CERTIFIED");
    expect(repository.ledger[0]?.immutable).toBe(true);
    expect(repository.timeline).toHaveLength(7);
    expect(repository.timeline.map((event) => event.event_order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(repository.timeline.some((event) => event.event_type === "MATURITY_PROMOTED")).toBe(true);
    expect(repository.timeline.every((event) => event.advisory_only)).toBe(true);
    expect(repository.maturity_state_mutation_authorized).toBe(false);
  });

  it("tracks the canonical ten domains and runtime through existing domains", () => {
    const repository = buildHistoricalMaturityEvolution();
    const domains = repository.domain_improvements.map((entry) => entry.domain);

    expect(repository.domain_improvements).toHaveLength(10);
    expect(domains).toContain("EXECUTION_INTELLIGENCE");
    expect(domains).toContain("RESILIENCE");
    expect(domains).toContain("VISIBILITY");
    expect(domains).not.toContain("RUNTIME_ASSURANCE");
    expect(repository.domain_improvements.every((entry) => entry.trend === "IMPROVING")).toBe(true);
  });

  it("keeps historical analytics deterministic and exposes slices", () => {
    const first = buildHistoricalMaturityEvolution();
    const second = buildHistoricalMaturityEvolution();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.report.integrity_hash).toBe(first.report.integrity_hash);
    expect(listHistoricalMaturityLedger()).toHaveLength(1);
    expect(listHistoricalMaturityTimeline()).toHaveLength(7);
    expect(getHistoricalMaturityTrends().growth_trend).toBe("IMPROVING");
    expect(getHistoricalMaturityReport().advisory_only).toBe(true);
  });

  it.each([
    ["HISTORICAL_RECORD_MUTATION", "HISTORICAL_RECORD_MODIFIED"],
    ["CHRONOLOGICAL_ORDERING_CHANGE", "CHRONOLOGICAL_ORDERING_CHANGED"],
    ["TREND_REPLAY_MISMATCH", "TREND_REPLAY_MISMATCHED"],
    ["BROKEN_LINEAGE", "HISTORICAL_LINEAGE_BROKEN"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCHED"],
    ["INCONSISTENT_PROMOTION_HISTORY", "PROMOTION_HISTORY_INCONSISTENT"],
    ["INCOMPLETE_REGRESSION_HISTORY", "REGRESSION_HISTORY_INCOMPLETE"],
    ["MISSING_GOVERNANCE_HISTORY", "GOVERNANCE_HISTORY_MISSING"],
    ["MISSING_CONSTITUTIONAL_HISTORY", "CONSTITUTIONAL_HISTORY_MISSING"],
    ["HIDDEN_HISTORICAL_RECORDS", "HIDDEN_HISTORICAL_RECORDS_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [HistoricalMaturityScenario, HistoricalMaturityFailure][])("invalidates %s", (scenario, failure) => {
    const repository = buildHistoricalMaturityEvolution({ scenario });
    const validation = validateHistoricalMaturityEvolution(repository);

    expect(repository.final_state).toBe("HISTORICAL_MATURITY_EVOLUTION_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.maturity_state_mutation_authorized).toBe(false);
    expect(repository.production_certification_authorized).toBe(false);
    expect(repository.execution_behavior_change_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "HISTORICAL_RECORD_MUTATION" })).records_immutable).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "CHRONOLOGICAL_ORDERING_CHANGE" })).chronological_ordering).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "TREND_REPLAY_MISMATCH" })).trend_replay_verified).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "BROKEN_LINEAGE" })).lineage_intact).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "REPLAY_RECONSTRUCTION_MISMATCH" })).replay_verified).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "MISSING_GOVERNANCE_HISTORY" })).governance_history_present).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "MISSING_CONSTITUTIONAL_HISTORY" })).constitutional_history_present).toBe(false);
    expect(validateHistoricalMaturityEvolution(buildHistoricalMaturityEvolution({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without state mutation authority", () => {
    const surface = buildHistoricalMaturityObservabilitySurface(buildHistoricalMaturityEvolution({ scenario: "BROKEN_LINEAGE" }));

    expect(surface.final_state).toBe("HISTORICAL_MATURITY_EVOLUTION_FAILED");
    expect(surface.ledger_count).toBe(1);
    expect(surface.timeline_count).toBe(7);
    expect(surface.domain_improvement_count).toBe(10);
    expect(surface.regression_count).toBe(1);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.maturity_state_mutation_authorized).toBe(false);
  });
});
