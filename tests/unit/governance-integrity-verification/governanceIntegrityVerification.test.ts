import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceIntegrityVerificationObservabilitySurface,
  classifyGovernanceIntegrityVerificationFailure,
  getGovernanceIntegrityVerificationContract,
  runGovernanceIntegrityVerification,
} from "@/services/governance-integrity-verification";
import type { GovernanceIntegrityState } from "@/types/governance-integrity-contract";
import type {
  GovernanceIntegrityVerificationFailure,
  GovernanceIntegrityVerificationScenario,
} from "@/types/governance-integrity-verification";

vi.setConfig({ testTimeout: 120000 });

describe("Mission Control Phase 7I.4 Governance Integrity Verification", () => {
  it("defines the verification doctrine and modes", () => {
    const contract = getGovernanceIntegrityVerificationContract();

    expect(contract.doctrine.schema_version).toBe("governance-integrity-verification/v7I.4");
    expect(contract.doctrine.principles).toContain("single-authoritative-integrity-assessment");
    expect(contract.doctrine.principles).toContain("tenant-isolation-verification");
    expect(contract.doctrine.principles).toContain("fail-closed-decision");
    expect(contract.doctrine.verification_modes).toEqual(["CONTINUOUS", "SCHEDULED", "ON_DEMAND"]);
  });

  it("verifies a clean governance chain as trusted and certification ready", () => {
    const report = runGovernanceIntegrityVerification({ mode: "ON_DEMAND" });

    expect(report.phase_version).toBe("7I.4");
    expect(report.integrity_state).toBe("VALID");
    expect(report.downstream_trust_allowed).toBe(true);
    expect(report.certification_ready).toBe(true);
    expect(report.failure_details).toEqual([]);
    expect(report.verification_results.every((item) => item.passed)).toBe(true);
    expect(report.truth_ledger_record.append_only).toBe(true);
    expect(report.report_hash).toBeTruthy();
  });

  it.each([
    ["CONTRACT_SCHEMA_INVALID", "CONTRACT_SCHEMA_INVALID", "CORRUPTED"],
    ["IMMUTABLE_IDENTITY_MODIFIED", "IMMUTABLE_IDENTITY_MODIFIED", "CORRUPTED"],
    ["CONTENT_HASH_MISMATCH", "CONTENT_HASH_MISMATCH", "CORRUPTED"],
    ["PREVIOUS_HASH_MISMATCH", "PREVIOUS_HASH_MISMATCH", "CORRUPTED"],
    ["ROOT_HASH_MISMATCH", "ROOT_HASH_MISMATCH", "CORRUPTED"],
    ["GOVERNANCE_CHAIN_INCOMPLETE", "GOVERNANCE_CHAIN_INCOMPLETE", "CORRUPTED"],
    ["LINEAGE_RECONSTRUCTION_FAILED", "LINEAGE_RECONSTRUCTION_FAILED", "CORRUPTED"],
    ["REPLAY_RECONSTRUCTION_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH", "CORRUPTED"],
    ["CROSS_TENANT_REFERENCE_DETECTED", "CROSS_TENANT_REFERENCE_DETECTED", "CORRUPTED"],
    ["EVIDENCE_LINEAGE_BROKEN", "EVIDENCE_LINEAGE_BROKEN", "CORRUPTED"],
    ["UNSUPPORTED_VERIFICATION_VERSION", "UNSUPPORTED_VERIFICATION_VERSION", "DEGRADED"],
    ["OPTIONAL_METADATA_UNAVAILABLE", "OPTIONAL_METADATA_UNAVAILABLE", "DEGRADED"],
    ["DELAYED_VERIFICATION_EXECUTION", "DELAYED_VERIFICATION_EXECUTION", "DEGRADED"],
    ["UNKNOWN_VERIFICATION_STATE", "UNKNOWN_VERIFICATION_STATE", "CORRUPTED"],
  ] as readonly [GovernanceIntegrityVerificationScenario, GovernanceIntegrityVerificationFailure, GovernanceIntegrityState][])(
    "maps %s to %s",
    (scenario, failure, expectedState) => {
      const report = runGovernanceIntegrityVerification({ scenario });

      expect(classifyGovernanceIntegrityVerificationFailure(failure)).toBe(expectedState);
      expect(report.integrity_state).toBe(expectedState);
      expect(report.failure_details).toContain(failure);
      expect(report.downstream_trust_allowed).toBe(false);
      expect(report.certification_ready).toBe(false);
    },
  );

  it("records explainable verification evidence and Truth Ledger state", () => {
    const report = runGovernanceIntegrityVerification({ scenario: "REPLAY_RECONSTRUCTION_MISMATCH", mode: "SCHEDULED" });

    expect(report.verification_mode).toBe("SCHEDULED");
    expect(report.supporting_evidence).toContain(report.source_chain.chain_execution_hash);
    expect(report.supporting_evidence).toContain(report.tamper_report.report_hash);
    expect(report.replay_references).toContain(report.source_chain.replay_chain.replay_chain_hash);
    expect(report.lineage_references).toContain(report.source_chain.lineage_graph.lineage_hash);
    expect(report.truth_ledger_record.verification_id).toBe(report.verification_id);
    expect(report.truth_ledger_record.result_hashes).toHaveLength(report.verification_results.length);
  });

  it("exposes operator certification readiness diagnostics", () => {
    const surface = buildGovernanceIntegrityVerificationObservabilitySurface({ scenario: "OPTIONAL_METADATA_UNAVAILABLE", mode: "CONTINUOUS" });

    expect(surface.verification_mode).toBe("CONTINUOUS");
    expect(surface.integrity_state).toBe("DEGRADED");
    expect(surface.downstream_trust_allowed).toBe(false);
    expect(surface.certification_ready).toBe(false);
    expect(surface.failure_details).toContain("OPTIONAL_METADATA_UNAVAILABLE");
    expect(surface.truth_ledger_record_id).toMatch(/^GIVL-7I4-/);
    expect(surface.advisory_only_notice).toContain("does not grant autonomous execution authority");
  });
});
