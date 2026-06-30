import { describe, expect, it } from "vitest";
import {
  buildGovernanceCorrelationObservabilitySurface,
  computeGovernanceCorrelationHash,
  correlateGovernanceLedgers,
  getGovernanceCrossLedgerCorrelationContract,
  validateGovernanceCorrelation,
} from "@/services/governance-cross-ledger-correlation";
import type { GovernanceCorrelationErrorState, GovernanceCorrelationScenario } from "@/types/governance-cross-ledger-correlation";

describe("Mission Control Phase 7J.4 Cross-Ledger Governance Correlation", () => {
  it("defines deterministic cross-ledger correlation doctrine", () => {
    const contract = getGovernanceCrossLedgerCorrelationContract();

    expect(contract.doctrine.schema_version).toBe("governance-cross-ledger-correlation/v7J.4");
    expect(contract.doctrine.graph_version).toBe("governance-relationship-graph/v7J.4");
    expect(contract.doctrine.principles).toContain("lineage-preserving");
    expect(contract.doctrine.correlated_ledgers).toContain("TRUTH_LEDGER");
    expect(contract.doctrine.correlated_ledgers).toContain("LINEAGE_LEDGER");
    expect(contract.doctrine.relationship_types).toContain("RECONSTRUCTED_BY");
    expect(contract.doctrine.error_states).toContain("REPLAY_CORRELATION_FAILED");
  });

  it("correlates governance ledgers into an evidence-backed graph", () => {
    const response = correlateGovernanceLedgers();

    expect(response.phase_version).toBe("7J.4");
    expect(response.correlation_state).toBe("CORRELATIONS_GENERATED");
    expect(response.read_only).toBe(true);
    expect(response.correlations.length).toBeGreaterThanOrEqual(8);
    expect(response.relationship_graph?.nodes.length).toBeGreaterThan(0);
    expect(response.relationship_graph?.edges.length).toBe(response.correlations.length);
    expect(response.replay_correlation?.replay_consistent).toBe(true);
    expect(response.validation.evidence_complete).toBe(true);
    expect(response.validation.lineage_verified).toBe(true);
    expect(response.validation.hash_verified).toBe(true);
  });

  it("generates expected deterministic governance relationship types", () => {
    const response = correlateGovernanceLedgers();
    const relationships = response.correlations.map((correlation) => correlation.relationship_type);

    expect(relationships).toContain("INFLUENCES");
    expect(relationships).toContain("SUPPORTS");
    expect(relationships).toContain("ESCALATES");
    expect(relationships).toContain("VALIDATES");
    expect(relationships).toContain("RECONSTRUCTED_BY");
    expect(relationships).toContain("PARENT_OF");
  });

  it("repeats identical correlations with identical graph and response hashes", () => {
    const first = correlateGovernanceLedgers();
    const second = correlateGovernanceLedgers();

    expect(second.correlation_hash).toBe(first.correlation_hash);
    expect(computeGovernanceCorrelationHash(first)).toBe(first.correlation_hash);
    expect(second.relationship_graph?.graph_hash).toBe(first.relationship_graph?.graph_hash);
    expect(second.correlations.map((correlation) => correlation.correlation_hash)).toEqual(first.correlations.map((correlation) => correlation.correlation_hash));
  });

  it("validates replay dependency correlation against historical reconstruction", () => {
    const response = correlateGovernanceLedgers();

    expect(response.replay_correlation?.historical_reconstruction_hash).toBe(response.historical_response.reconstruction_hash);
    expect(response.replay_correlation?.correlated_replay_refs.length).toBeGreaterThan(0);
    expect(response.replay_correlation?.replay_dependency_graph_hash).toBe(response.relationship_graph?.graph_hash);
    expect(validateGovernanceCorrelation().valid).toBe(true);
  });

  it.each([
    "CORRELATION_NOT_FOUND",
    "LEDGER_REFERENCE_INVALID",
    "RELATIONSHIP_INCONSISTENT",
    "EVIDENCE_MISSING",
    "LINEAGE_BROKEN",
    "REPLAY_CORRELATION_FAILED",
    "HASH_MISMATCH",
    "TENANT_ISOLATION_VIOLATION",
    "CONSTITUTIONAL_VIOLATION",
  ] as readonly GovernanceCorrelationScenario[])("maps %s deterministically", (scenario) => {
    const response = correlateGovernanceLedgers({ scenario });
    const validation = validateGovernanceCorrelation({ scenario });

    expect(response.correlation_state).toBe(scenario);
    expect(validation.valid).toBe(false);
    expect(response.failures.length).toBeGreaterThan(0);
    expect(response.correlation_hash).toBeNull();
  });

  it("exposes operator observability for correlation failures", () => {
    const surface = buildGovernanceCorrelationObservabilitySurface({ scenario: "EVIDENCE_MISSING" });

    expect(surface.correlation_state).toBe("EVIDENCE_MISSING");
    expect(surface.errors).toContain("EVIDENCE_MISSING" satisfies GovernanceCorrelationErrorState);
    expect(surface.correlation_count).toBeGreaterThan(0);
    expect(surface.correlation_hash).toBeNull();
  });
});
