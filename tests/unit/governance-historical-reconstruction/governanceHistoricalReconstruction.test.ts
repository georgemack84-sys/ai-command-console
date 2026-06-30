import { describe, expect, it } from "vitest";
import {
  buildHistoricalGovernanceReconstructionObservabilitySurface,
  computeHistoricalGovernanceReconstructionHash,
  getHistoricalGovernanceReconstructionContract,
  reconstructHistoricalGovernance,
  validateHistoricalGovernanceReconstruction,
} from "@/services/governance-historical-reconstruction";
import type {
  GovernanceHistoricalReconstructionErrorState,
  GovernanceHistoricalReconstructionScenario,
} from "@/types/governance-historical-reconstruction";

describe("Mission Control Phase 7J.3 Historical Governance Reconstruction", () => {
  it("defines deterministic historical reconstruction doctrine and sources", () => {
    const contract = getHistoricalGovernanceReconstructionContract();

    expect(contract.doctrine.schema_version).toBe("governance-historical-reconstruction/v7J.3");
    expect(contract.doctrine.snapshot_version).toBe("historical-governance-snapshot/v7J.3");
    expect(contract.doctrine.ledger_version).toBe("governance-ledger/v7J.3");
    expect(contract.doctrine.principles).toContain("lineage-preserving");
    expect(contract.doctrine.reconstruction_sources).toContain("Truth Ledger");
    expect(contract.doctrine.error_states).toContain("RECONSTRUCTION_HASH_MISMATCH");
  });

  it("reconstructs an immutable evidence-backed historical snapshot", () => {
    const response = reconstructHistoricalGovernance();

    expect(response.phase_version).toBe("7J.3");
    expect(response.reconstruction_state).toBe("SNAPSHOT_RECONSTRUCTED");
    expect(response.read_only).toBe(true);
    expect(response.query_validation.valid).toBe(true);
    expect(response.snapshot?.snapshot_version).toBe("historical-governance-snapshot/v7J.3");
    expect(response.snapshot?.active_policies.record_count).toBeGreaterThan(0);
    expect(response.snapshot?.recommendations.record_count).toBeGreaterThan(0);
    expect(response.snapshot?.evidence.record_count).toBeGreaterThan(0);
    expect(response.snapshot?.lineage.record_count).toBeGreaterThan(0);
    expect(response.replay_validation?.replay_valid).toBe(true);
  });

  it("repeats identical reconstruction with identical timeline and hashes", () => {
    const first = reconstructHistoricalGovernance();
    const second = reconstructHistoricalGovernance();

    expect(second.reconstruction_hash).toBe(first.reconstruction_hash);
    expect(computeHistoricalGovernanceReconstructionHash(first)).toBe(first.reconstruction_hash);
    expect(second.timeline.map((event) => event.event_hash)).toEqual(first.timeline.map((event) => event.event_hash));
    expect(second.snapshot?.reconstruction_hash).toBe(first.snapshot?.reconstruction_hash);
  });

  it("orders historical timeline by immutable ledger chronology", () => {
    const response = reconstructHistoricalGovernance();

    expect(response.timeline.length).toBe(response.ledger_records.length);
    expect(response.timeline.map((event) => event.ledger_sequence)).toEqual([...response.timeline.map((event) => event.ledger_sequence)].sort((a, b) => a - b));
    expect(response.timeline.every((event) => event.parent_refs.length > 0)).toBe(true);
  });

  it("supports caller-provided historical timestamps", () => {
    const response = reconstructHistoricalGovernance({ historical_timestamp: "2026-06-20T10:00:00.000Z" });

    expect(response.historical_timestamp).toBe("2026-06-20T10:00:00.000Z");
    expect(response.snapshot?.historical_timestamp).toBe("2026-06-20T10:00:00.000Z");
    expect(response.reconstruction_state).toBe("SNAPSHOT_RECONSTRUCTED");
  });

  it.each([
    "TIMESTAMP_NOT_FOUND",
    "LEDGER_RECORDS_INCOMPLETE",
    "POLICY_HISTORY_INCOMPLETE",
    "REPLAY_HASH_MISMATCH",
    "RECONSTRUCTION_HASH_MISMATCH",
    "LINEAGE_INCONSISTENT",
    "VERSION_INCOMPATIBLE",
    "TENANT_ISOLATION_VIOLATION",
    "CONSTITUTIONAL_VIOLATION",
  ] as readonly GovernanceHistoricalReconstructionScenario[])("maps %s deterministically", (scenario) => {
    const response = reconstructHistoricalGovernance({ scenario });
    const validation = validateHistoricalGovernanceReconstruction({ scenario });

    expect(response.reconstruction_state).toBe(scenario);
    expect(validation.valid).toBe(false);
    expect(response.failures.length).toBeGreaterThan(0);
    expect(response.reconstruction_hash).toBeNull();
  });

  it("exposes operator observability for reconstruction failures", () => {
    const surface = buildHistoricalGovernanceReconstructionObservabilitySurface({ scenario: "LINEAGE_INCONSISTENT" });

    expect(surface.reconstruction_state).toBe("LINEAGE_INCONSISTENT");
    expect(surface.errors).toContain("LINEAGE_INCONSISTENT" satisfies GovernanceHistoricalReconstructionErrorState);
    expect(surface.replay_valid).toBe(false);
    expect(surface.reconstruction_hash).toBeNull();
  });
});
