import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceInputAuditLog,
  buildGovernanceInputObservabilitySurface,
  computeGovernanceInputPackageHash,
  getGovernanceInputReconstructionContract,
  reconstructGovernanceInputs,
  resolveTruthLedgerInputs,
  validateGovernanceInputPackage,
} from "@/services/governance-input-reconstruction";
import type { GovernanceInputReconstructionScenario } from "@/types/governance-input-reconstruction";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7H.2 Governance Input Reconstruction", () => {
  it("defines input reconstruction doctrine and produces a replay-ready baseline package", () => {
    const contract = getGovernanceInputReconstructionContract();
    expect(contract.doctrine.principles).toContain("immutable-source-only");
    expect(contract.doctrine.input_categories).toContain("EVIDENCE");
    expect(contract.package.schema_version).toBe("governance-input-reconstruction/v7H.2");
    expect(contract.validation.validation_state).toBe("VALID");
    expect(contract.validation.replay_ready).toBe(true);
    expect(contract.observability.replay_ready).toBe(true);
  });

  it("reconstructs every required governance input context from immutable sources", () => {
    const pkg = reconstructGovernanceInputs();
    expect(pkg.governance_context.records.length).toBeGreaterThan(0);
    expect(pkg.constitutional_context.records.length).toBeGreaterThan(0);
    expect(pkg.policy_context.records.length).toBeGreaterThan(0);
    expect(pkg.compliance_context.records.length).toBeGreaterThan(0);
    expect(pkg.risk_context.records.length).toBeGreaterThan(0);
    expect(pkg.recommendation_context.records.length).toBeGreaterThan(0);
    expect(pkg.escalation_context.records.length).toBeGreaterThan(0);
    expect(pkg.evidence_context.records.length).toBeGreaterThan(0);
    expect(pkg.lineage_context.records.length).toBeGreaterThan(0);
    expect(pkg.configuration_context.records.length).toBeGreaterThan(0);
    expect(pkg.integrity_results.every((item) => item.hash_verified && item.tenant_verified)).toBe(true);
  });

  it("preserves deterministic parameters and historical Truth Ledger references", () => {
    const pkg = reconstructGovernanceInputs();
    expect(pkg.deterministic_parameters.live_data_policy).toBe("PROHIBITED");
    expect(pkg.deterministic_parameters.source_policy).toBe("IMMUTABLE_LEDGER_ONLY");
    expect(pkg.deterministic_parameters.timestamp_policy).toBe("PRESERVE_HISTORICAL_TIMESTAMPS");
    expect(resolveTruthLedgerInputs(pkg).length).toBeGreaterThan(0);
    expect(computeGovernanceInputPackageHash(pkg)).toBe(pkg.input_package_hash);
  });

  it("records deterministic audit entries for reconstruction", () => {
    const pkg = reconstructGovernanceInputs();
    const audit = buildGovernanceInputAuditLog(pkg);
    expect(audit.length).toBe(1);
    expect(audit[0].integrity_status).toBe("VERIFIED");
    expect(audit[0].reconstructed_artifacts).toContain("governance_context");
  });

  it("rejects a missing replay contract", () => {
    const pkg = reconstructGovernanceInputs({ scenario: "MISSING_CONTRACT" });
    const validation = validateGovernanceInputPackage(pkg);
    expect(pkg.state).toBe("FAILED");
    expect(pkg.failures).toContain("REPLAY_CONTRACT_MISSING");
    expect(validation.validation_state).toBe("INVALID");
  });

  it("fails closed for incomplete, mutable, or inconsistent reconstructed inputs", () => {
    const scenarios: readonly Exclude<GovernanceInputReconstructionScenario, "BASELINE" | "MISSING_CONTRACT">[] = [
      "GOVERNANCE_RECORDS_MISSING",
      "EVIDENCE_MISSING",
      "POLICY_VERSION_UNAVAILABLE",
      "COMPLIANCE_INCOMPLETE",
      "RISK_LINEAGE_BROKEN",
      "RECOMMENDATION_LINEAGE_MISSING",
      "ESCALATION_UNRESOLVED",
      "CONFIG_UNAVAILABLE",
      "REPLAY_HASH_INVALID",
      "TENANT_MISMATCH",
      "AUTHORITY_MISMATCH",
      "CONSTITUTIONAL_MISMATCH",
      "INTEGRITY_FAILURE",
      "LIVE_SOURCE_DETECTED",
      "NON_DETERMINISTIC_ORDER",
    ];
    for (const scenario of scenarios) {
      const pkg = reconstructGovernanceInputs({ scenario });
      const validation = validateGovernanceInputPackage(pkg);
      expect(pkg.state, scenario).toBe("FAILED");
      expect(validation.validation_state, scenario).toBe("INVALID");
      expect(validation.errors.length, scenario).toBeGreaterThan(0);
      expect(validation.replay_ready, scenario).toBe(false);
    }
  }, 240000);

  it("exposes operator observability for reconstructed replay inputs", () => {
    const surface = buildGovernanceInputObservabilitySurface();
    expect(surface.replay_ready).toBe(true);
    expect(surface.context_count).toBe(10);
    expect(surface.record_count).toBeGreaterThan(0);
    expect(surface.integrity_failed).toBe(0);
    expect(surface.advisory_only_notice).toContain("immutable ledgers");
  });
});
