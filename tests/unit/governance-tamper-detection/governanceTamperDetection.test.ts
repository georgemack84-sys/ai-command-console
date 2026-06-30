import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceTamperObservabilitySurface,
  classifyGovernanceTamperReason,
  getGovernanceTamperDetectionContract,
  runGovernanceTamperDetection,
} from "@/services/governance-tamper-detection";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type { GovernanceTamperDetectionReason, GovernanceTamperScenario } from "@/types/governance-tamper-detection";

vi.setConfig({ testTimeout: 15000 });

describe("Mission Control Phase 7I.3 Governance Tamper Detection", () => {
  it("defines the tamper detection doctrine and monitoring contract", () => {
    const contract = getGovernanceTamperDetectionContract();

    expect(contract.doctrine.schema_version).toBe("governance-tamper-detection/v7I.3");
    expect(contract.doctrine.principles).toContain("continuous-integrity-monitoring");
    expect(contract.doctrine.principles).toContain("hash-tamper-detection");
    expect(contract.doctrine.principles).toContain("tenant-boundary-detection");
    expect(contract.doctrine.principles).toContain("fail-closed-response");
  });

  it("monitors a valid governance hash chain without active tamper", () => {
    const report = runGovernanceTamperDetection();

    expect(report.phase_version).toBe("7I.3");
    expect(report.integrity_state).toBe("VALID");
    expect(report.monitoring_state).toBe("MONITORING");
    expect(report.violations).toEqual([]);
    expect(report.truth_ledger_events).toEqual([]);
    expect(report.response.downstream_blocked).toBe(false);
    expect(report.observation.observation_hash).toBeTruthy();
  });

  it.each([
    ["HASH_MISMATCH", "HASH_MISMATCH", "CORRUPTED"],
    ["MISSING_CHAIN_LINK", "MISSING_CHAIN_LINK", "CORRUPTED"],
    ["DUPLICATE_CHAIN_POSITION", "DUPLICATE_CHAIN_POSITION", "CORRUPTED"],
    ["PREVIOUS_HASH_MISMATCH", "PREVIOUS_HASH_MISMATCH", "CORRUPTED"],
    ["ROOT_HASH_MISMATCH", "ROOT_HASH_MISMATCH", "CORRUPTED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH", "CORRUPTED"],
    ["PARENT_RECORD_MISSING", "PARENT_RECORD_MISSING", "CORRUPTED"],
    ["ROOT_LINEAGE_MISSING", "ROOT_LINEAGE_MISSING", "CORRUPTED"],
    ["IMMUTABLE_IDENTITY_MODIFIED", "IMMUTABLE_IDENTITY_MODIFIED", "CORRUPTED"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE", "CORRUPTED"],
    ["UNSUPPORTED_HASH_VERSION", "UNSUPPORTED_HASH_VERSION", "DEGRADED"],
    ["VERIFICATION_DELAY", "VERIFICATION_DELAY", "DEGRADED"],
    ["MISSING_OPTIONAL_METADATA", "MISSING_OPTIONAL_METADATA", "DEGRADED"],
    ["UNAUTHORIZED_INSERTION", "UNAUTHORIZED_INSERTION", "CORRUPTED"],
    ["UNAUTHORIZED_DELETION", "MISSING_CHAIN_LINK", "CORRUPTED"],
    ["CHAIN_REORDERING", "CHAIN_REORDERING", "CORRUPTED"],
    ["UNKNOWN_INTEGRITY_STATE", "UNKNOWN_INTEGRITY_STATE", "CORRUPTED"],
  ] as readonly [GovernanceTamperScenario, GovernanceTamperDetectionReason, GovernanceIntegrityState][])(
    "classifies %s as %s",
    (scenario, reason, expectedState) => {
      const report = runGovernanceTamperDetection({ scenario });

      expect(classifyGovernanceTamperReason(reason)).toBe(expectedState);
      expect(report.integrity_state).toBe(expectedState);
      expect(report.violations.map((violation) => violation.reason)).toContain(reason);
      expect(report.truth_ledger_events.length).toBe(report.violations.length);
      expect(report.response.operator_notification_required).toBe(true);
      expect(report.response.downstream_blocked).toBe(expectedState === "CORRUPTED");
    },
  );

  it("records explainable Truth Ledger events for confirmed corruption", () => {
    const report = runGovernanceTamperDetection({ scenario: "PREVIOUS_HASH_MISMATCH" });

    expect(report.truth_ledger_events).toHaveLength(report.violations.length);
    expect(report.truth_ledger_events[0].append_only).toBe(true);
    expect(report.truth_ledger_events[0].chain_id).toBe(report.source_chain.chain_id);
    expect(report.truth_ledger_events[0].violation_ids).toContain(report.violations[0].violation_id);
    expect(report.response.response_actions).toContain("BLOCK_DOWNSTREAM_GOVERNANCE_USE");
    expect(report.response.response_actions).toContain("WRITE_TRUTH_LEDGER_EVENT");
  });

  it("exposes operator diagnostics for degraded monitoring", () => {
    const surface = buildGovernanceTamperObservabilitySurface({ scenario: "VERIFICATION_DELAY" });

    expect(surface.integrity_state).toBe("DEGRADED");
    expect(surface.monitoring_state).toBe("DEGRADED");
    expect(surface.violations).toContain("VERIFICATION_DELAY");
    expect(surface.downstream_blocked).toBe(false);
    expect(surface.truth_ledger_events).toBe(surface.violation_count);
    expect(surface.latest_observation_hash).toBeTruthy();
    expect(surface.advisory_only_notice).toContain("does not grant autonomous execution authority");
  });
});
