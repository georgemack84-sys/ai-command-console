import { describe, expect, it } from "vitest";

import {
  getPhase12CertificationGateContract,
  replayPhase12CertificationGate,
  runPhase12CertificationGate,
  validatePhase12CertificationGate,
} from "../../../services/phase-12-certification-gate";
import type { Phase12CertificationScenario } from "../../../types/phase-12-certification-gate";

describe("phase 12 certification gate", () => {
  it("creates a deterministic production certification decision", () => {
    const first = runPhase12CertificationGate();
    const second = runPhase12CertificationGate();

    expect(first.decision.outcome).toBe("PASS");
    expect(first.decision.production_promotion_allowed).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validatePhase12CertificationGate(first).valid).toBe(true);
    expect(replayPhase12CertificationGate(first)).toBe(true);
  });

  it("publishes final certification doctrine", () => {
    const bundle = getPhase12CertificationGateContract();

    expect(bundle.doctrine.final_certification_authority).toBe(true);
    expect(bundle.doctrine.pass_required_for_production).toBe(true);
    expect(bundle.doctrine.conditional_pass_blocks_production).toBe(true);
    expect(bundle.doctrine.immutable_certification_ledger_required).toBe(true);
    expect(bundle.doctrine.continuous_certification_required).toBe(true);
  });

  it("registers the complete certification matrix and evidence", () => {
    const result = runPhase12CertificationGate();

    expect(result.test_registry.complete).toBe(true);
    expect(result.test_registry.tests).toHaveLength(54);
    expect(result.test_results).toHaveLength(54);
    expect(result.test_results.every((test) => test.passed)).toBe(true);
    expect(result.evidence_registry.complete).toBe(true);
    expect(result.evidence_registry.evidence).toHaveLength(12);
  });

  it("certifies every strategic intelligence domain", () => {
    const result = runPhase12CertificationGate();

    expect(result.determinism.passed).toBe(true);
    expect(result.constitutional_governance.passed).toBe(true);
    expect(result.artifacts.passed).toBe(true);
    expect(result.recommendation_intelligence.passed).toBe(true);
    expect(result.replay_lineage_integrity.passed).toBe(true);
    expect(result.security_tenant.passed).toBe(true);
    expect(result.operations.passed).toBe(true);
  });

  it("finalizes production readiness, ledger, and continuous certification", () => {
    const result = runPhase12CertificationGate();

    expect(result.production_readiness.production_ready).toBe(true);
    expect(result.production_readiness.deployment_allowed).toBe(true);
    expect(result.ledger.append_only).toBe(true);
    expect(result.ledger.entries).toHaveLength(5);
    expect(result.continuous_certification.certified).toBe(true);
    expect(result.continuous_certification.recertification_required).toBe(false);
  });

  it("blocks production for critical certification failures", () => {
    const scenarios: readonly Phase12CertificationScenario[] = [
      "CONTRACT_INVALID",
      "DETERMINISM_FAILURE",
      "CONSTITUTIONAL_FAILURE",
      "GOVERNANCE_FAILURE",
      "AUTHORITY_FAILURE",
      "POLICY_FAILURE",
      "ARTIFACT_FAILURE",
      "LIFECYCLE_FAILURE",
      "RECOMMENDATION_FAILURE",
      "OBSERVATION_FAILURE",
      "REPLAY_FAILURE",
      "LINEAGE_FAILURE",
      "INTEGRITY_FAILURE",
      "EXPLAINABILITY_FAILURE",
      "SECURITY_FAILURE",
      "TENANT_FAILURE",
      "OPERATIONS_FAILURE",
      "LEDGER_FAILURE",
      "PRODUCTION_READINESS_FAILURE",
    ];

    for (const scenario of scenarios) {
      const result = runPhase12CertificationGate({ scenario });

      expect(result.decision.outcome).toBe("FAIL");
      expect(result.decision.production_promotion_allowed).toBe(false);
      expect(result.decision.critical_failures).toContain(scenario);
      expect(result.production_readiness.production_ready).toBe(false);
      expect(validatePhase12CertificationGate(result).valid).toBe(false);
    }
  });
});
