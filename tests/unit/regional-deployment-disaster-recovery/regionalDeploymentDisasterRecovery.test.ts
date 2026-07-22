import { describe, expect, it } from "vitest";
import {
  getRegionalDeploymentDisasterRecoveryBundle,
  replayRegionalDeploymentDisasterRecovery,
  runRegionalDeploymentDisasterRecovery,
  validateRegionalDeploymentDisasterRecovery,
} from "@/services/regional-deployment-disaster-recovery";
import type { RegionalDeploymentDisasterRecoveryFailure } from "@/types/regional-deployment-disaster-recovery";

describe("Mission Control Phase 17.6 Regional Deployment & Disaster Recovery", () => {
  it("publishes regional deployment disaster recovery doctrine", () => {
    const bundle = getRegionalDeploymentDisasterRecoveryBundle();

    expect(bundle.doctrine.version).toBe("regional-deployment-disaster-recovery/v17.6");
    expect(bundle.doctrine.upstream_phase).toBe("global-workload-distribution/v17.5");
    expect(bundle.doctrine.lifecycle_states).toContain("RECOVERY_AUTHORIZED");
    expect(bundle.doctrine.recovery_domains).toHaveLength(10);
    expect(bundle.validation.valid).toBe(true);
  });

  it("governs regional deployment without assigning recovery authority to the manager", () => {
    const result = runRegionalDeploymentDisasterRecovery({ region_id: "us-west-2" });

    expect(result.deployment_manager.deployment_status).toBe("CERTIFIED");
    expect(result.deployment_manager.active_regions).toEqual(["us-west-2"]);
    expect(result.deployment_manager.determines_recovery_authority).toBe(false);
    expect(result.deployment_manager.recovery_readiness).toBe(true);
  });

  it("authorizes recovery only after all constitutional conditions pass", () => {
    const result = runRegionalDeploymentDisasterRecovery();
    const conditions = result.authorization_service.authorization_conditions;

    expect(result.authorization_service.decision).toBe("AUTHORIZE");
    expect(result.authorization_service.authorization_complete).toBe(true);
    expect(conditions.governance_approval_verified).toBe(true);
    expect(conditions.independent_of_timestamp_ordering).toBe(true);
  });

  it("records a normative recovery request with timestamp as evidence", () => {
    const result = runRegionalDeploymentDisasterRecovery({ recovery_strategy: "CONTROLLED_DEGRADATION" });

    expect(result.recovery_request.recovery_strategy).toBe("CONTROLLED_DEGRADATION");
    expect(result.recovery_request.request_timestamp).toBe("2026-07-16T00:00:00.000Z");
    expect(result.recovery_request.authorization_decision_ref).toBeTruthy();
    expect(result.recovery_request.replay_validation_ref).toBeTruthy();
  });

  it("coordinates deterministic disaster recovery across all domains", () => {
    const result = runRegionalDeploymentDisasterRecovery();

    expect(result.recovery_engine.recovery_domains).toHaveLength(10);
    expect(result.recovery_engine.deterministic_execution).toBe(true);
    expect(result.recovery_engine.controlled_degradation).toBe(true);
    expect(result.recovery_engine.restoration_validation).toBe(true);
  });

  it("validates restoration before production return", () => {
    const result = runRegionalDeploymentDisasterRecovery();

    expect(result.validation_service.restoration_allowed).toBe(true);
    expect(result.validation_service.replay_reproducibility).toBe(true);
    expect(result.validation_service.tenant_isolation).toBe(true);
    expect(result.validation_service.certification_readiness).toBe(true);
  });

  it("replays recovery sequencing and authorization exactly", () => {
    const result = runRegionalDeploymentDisasterRecovery();

    expect(result.replay_validator.reconstructs_recovery_sequencing).toBe(true);
    expect(result.replay_validator.reconstructs_authorization_decisions).toBe(true);
    expect(result.replay_validator.reconstructs_recovery_evidence).toBe(true);
    expect(result.replay_validator.reproducible).toBe(true);
  });

  it("records immutable recovery evidence and ledger history", () => {
    const result = runRegionalDeploymentDisasterRecovery();

    expect(result.evidence_manager.integrates_with_constitutional_evidence_platform).toBe(true);
    expect(result.evidence_manager.duplicate_evidence_infrastructure_created).toBe(false);
    expect(result.recovery_ledger).toHaveLength(11);
    expect(result.recovery_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable)).toBe(true);
  });

  it("publishes recovery dashboard from immutable ledger data", () => {
    const result = runRegionalDeploymentDisasterRecovery();

    expect(result.dashboard.derived_from_immutable_ledger).toBe(true);
    expect(result.dashboard.authorization_state_visible).toBe(true);
    expect(result.health_monitor.influences_recovery_authority).toBe(false);
  });

  it("is deterministic and replayable", () => {
    const first = runRegionalDeploymentDisasterRecovery();
    const second = runRegionalDeploymentDisasterRecovery();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateRegionalDeploymentDisasterRecovery(first).valid).toBe(true);
    expect(replayRegionalDeploymentDisasterRecovery(first)).toBe(true);
  });

  it("executes the Phase 17.6 disaster recovery certification gate", () => {
    const result = runRegionalDeploymentDisasterRecovery();

    expect(result.certification_tests).toHaveLength(13);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional recovery warnings", () => {
    const result = runRegionalDeploymentDisasterRecovery({ scenario: "NON_CONSTITUTIONAL_RECOVERY_WARNING" });
    const validation = validateRegionalDeploymentDisasterRecovery(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.disaster_recovery_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("rejects unauthorized recovery execution", () => {
    const result = runRegionalDeploymentDisasterRecovery({ scenario: "UNAUTHORIZED_RECOVERY_EXECUTION" });

    expect(result.outcome).toBe("FAIL");
    expect(result.authorization_service.decision).toBe("REJECT_GOVERNANCE");
    expect(result.authorization_service.unauthorized_execution_prevented).toBe(false);
  });

  it.each([
    "RECOVERY_AUTHORIZATION_NOT_DETERMINISTIC",
    "AUTHORIZATION_CONDITIONS_INCOMPLETE",
    "GOVERNANCE_APPROVAL_NOT_VALIDATED",
    "DEPENDENCY_VALIDATION_FAILED",
    "REPLAY_NOT_REPRODUCIBLE",
    "TENANT_ISOLATION_VIOLATED",
    "EVIDENCE_MUTABLE",
    "RECOVERY_NOT_FULLY_AUDITED",
    "PRODUCTION_RESTORATION_NOT_VALIDATED",
    "CONTROLLED_DEGRADATION_NOT_GOVERNED",
    "RECOVERY_LEDGER_INCOMPLETE",
    "REGIONAL_DEPLOYMENT_INCONSISTENT",
    "CERTIFICATION_EVIDENCE_INCOMPLETE",
    "DISASTER_RECOVERY_NOT_CERTIFIED",
    "RECOVERY_DEPENDS_ON_TIMING",
    "UNAUTHORIZED_RECOVERY_EXECUTION",
    "PHASE_17_5_DISTRIBUTION_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: RegionalDeploymentDisasterRecoveryFailure) => {
    const result = runRegionalDeploymentDisasterRecovery({ scenario });
    const validation = validateRegionalDeploymentDisasterRecovery(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects recovery request tampering", () => {
    const result = runRegionalDeploymentDisasterRecovery();
    const tampered = {
      ...result,
      recovery_request: {
        ...result.recovery_request,
        recovery_target: "unauthorized-region/restored-production",
      },
    };

    expect(validateRegionalDeploymentDisasterRecovery(tampered).valid).toBe(false);
  });
});
