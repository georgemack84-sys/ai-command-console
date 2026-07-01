import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceStateAuditLog,
  buildGovernanceStateObservabilitySurface,
  computeGovernanceStatePackageHash,
  getGovernanceStateReconstructionContract,
  reconstructGovernanceState,
  validateGovernanceStatePackage,
} from "@/services/governance-state-reconstruction";
import type { GovernanceStateReconstructionScenario } from "@/types/governance-state-reconstruction";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7H.3 Governance State Reconstruction", () => {
  it("defines state reconstruction doctrine and produces a replay-ready baseline state", () => {
    const contract = getGovernanceStateReconstructionContract();
    expect(contract.doctrine.principles).toContain("hidden-state-free");
    expect(contract.doctrine.execution_order).toContain("CERTIFICATION_VALIDATION");
    expect(contract.package.schema_version).toBe("governance-state-reconstruction/v7H.3");
    expect(contract.validation.validation_state).toBe("VALID");
    expect(contract.validation.replay_ready).toBe(true);
    expect(contract.observability.replay_ready).toBe(true);
  });

  it("reconstructs every governance subsystem state in deterministic order", () => {
    const pkg = reconstructGovernanceState();
    expect(pkg.execution_order).toEqual([
      "INITIALIZED",
      "POLICY_EVALUATION",
      "COMPLIANCE_ANALYSIS",
      "RISK_ANALYSIS",
      "RECOMMENDATION_GENERATION",
      "ESCALATION_EVALUATION",
      "EXPLAINABILITY_GENERATION",
      "CONFIDENCE_CALCULATION",
      "CERTIFICATION_VALIDATION",
      "COMPLETED",
    ]);
    expect(pkg.transitions).toHaveLength(10);
    expect(pkg.execution_state.progress).toBe("COMPLETED");
    expect(pkg.policy_state.integrity_status).toBe("VERIFIED");
    expect(pkg.confidence_state.confidence_value).toBe("0.9700");
  });

  it("preserves hashes, integrity, lineage, and audit state", () => {
    const pkg = reconstructGovernanceState();
    expect(computeGovernanceStatePackageHash(pkg)).toBe(pkg.state_package_hash);
    expect(pkg.integrity_results.every((item) => item.hash_verified && item.ordering_verified && item.lineage_verified && item.confidence_verified && item.tenant_verified)).toBe(true);
    expect(pkg.lineage_state.restored_values).toContain("causality_graph");
    const audit = buildGovernanceStateAuditLog(pkg);
    expect(audit[0].integrity_verification).toBe("VERIFIED");
    expect(audit[0].reconstructed_states).toContain("CONFIDENCE");
  });

  it("fails closed when the replay input package is invalid", () => {
    const pkg = reconstructGovernanceState({ scenario: "INPUT_PACKAGE_INVALID" });
    const validation = validateGovernanceStatePackage(pkg);
    expect(pkg.status).toBe("FAILED");
    expect(pkg.failures).toContain("INPUT_PACKAGE_INVALID");
    expect(validation.validation_state).toBe("INVALID");
  });

  it("fails closed for every state reconstruction failure condition", () => {
    const scenarios: readonly Exclude<GovernanceStateReconstructionScenario, "BASELINE" | "INPUT_PACKAGE_INVALID">[] = [
      "GOVERNANCE_STATE_MISSING",
      "EXECUTION_ORDERING_DIFFERS",
      "POLICY_STATE_INCOMPLETE",
      "COMPLIANCE_STATE_INCONSISTENT",
      "RISK_CALCULATION_MISMATCH",
      "RECOMMENDATION_STATE_MISSING",
      "ESCALATION_STATE_UNRESOLVED",
      "EXPLAINABILITY_CHAIN_INCOMPLETE",
      "CONFIDENCE_MISMATCH",
      "LINEAGE_DISCONTINUITY",
      "REPLAY_VERSION_MISMATCH",
      "CONSTITUTIONAL_MISMATCH",
      "AUTHORITY_MISMATCH",
      "INTEGRITY_FAILURE",
      "TENANT_MISMATCH",
      "HIDDEN_STATE_DETECTED",
    ];
    for (const scenario of scenarios) {
      const pkg = reconstructGovernanceState({ scenario });
      const validation = validateGovernanceStatePackage(pkg);
      expect(pkg.status, scenario).toBe("FAILED");
      expect(validation.validation_state, scenario).toBe("INVALID");
      expect(validation.errors.length, scenario).toBeGreaterThan(0);
      expect(validation.replay_ready, scenario).toBe(false);
    }
  }, 300000);

  it("exposes operator observability for replay-ready state", () => {
    const surface = buildGovernanceStateObservabilitySurface();
    expect(surface.replay_ready).toBe(true);
    expect(surface.state_count).toBe(10);
    expect(surface.transition_count).toBe(10);
    expect(surface.integrity_failed).toBe(0);
    expect(surface.advisory_only_notice).toContain("hidden memory");
  });
});
