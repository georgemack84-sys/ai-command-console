import { describe, expect, it } from "vitest";
import {
  getProductionEnvironmentQualificationBundle,
  replayProductionEnvironmentQualification,
  runProductionEnvironmentQualification,
  validateProductionEnvironmentQualification,
} from "@/services/production-environment-qualification";
import type { ProductionEnvironmentFailure } from "@/types/production-environment-qualification";

describe("Mission Control Phase 15.3 Production Environment Qualification", () => {
  it("publishes production environment qualification doctrine", () => {
    const bundle = getProductionEnvironmentQualificationBundle();

    expect(bundle.doctrine.version).toBe("production-environment-qualification/v15.3");
    expect(bundle.doctrine.upstream_phase).toBe("release-artifact-build-integrity/v15.2");
    expect(bundle.doctrine.lifecycle).toEqual(["REGISTERED", "DISCOVERED", "BASELINE_CAPTURED", "VALIDATING", "QUALIFIED", "ATTESTED", "ACTIVE", "MONITORED", "REQUALIFICATION_REQUIRED", "SUPERSEDED", "RETIRED", "ARCHIVED"]);
    expect(bundle.doctrine.drift_categories).toEqual(["NONE", "AUTHORIZED", "UNAUTHORIZED", "SECURITY_CRITICAL", "GOVERNANCE_CRITICAL"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines governed production environment contract and registry", () => {
    const result = runProductionEnvironmentQualification();

    expect(result.contract.qualification_precedes_deployment).toBe(true);
    expect(result.contract.immutable_environment_identity).toBe(true);
    expect(result.contract.synthetic_equivalence_required).toBe(true);
    expect(result.registry).toHaveLength(1);
    expect(result.registry[0].qualification_status).toBe("QUALIFIED");
    expect(result.registry[0].attestation_refs.length).toBeGreaterThan(0);
  });

  it("validates identity, version, qualification, and infrastructure", () => {
    const result = runProductionEnvironmentQualification();

    expect(result.version_governance.immutable_identity).toBe(true);
    expect(result.version_governance.configuration_revisions_create_versions).toBe(true);
    expect(result.qualification.result).toBe("QUALIFIED");
    expect(result.qualification.deployment_ready).toBe(true);
    expect(result.infrastructure_integrity.compute_verified).toBe(true);
    expect(result.infrastructure_integrity.network_boundaries_verified).toBe(true);
    expect(result.infrastructure_integrity.storage_isolation_verified).toBe(true);
    expect(result.infrastructure_integrity.secrets_configuration_verified).toBe(true);
  });

  it("validates drift, tenant isolation, observability, and attestation", () => {
    const result = runProductionEnvironmentQualification();

    expect(result.drift.category).toBe("NONE");
    expect(result.drift.unauthorized_drift_invalidates_qualification).toBe(true);
    expect(result.tenant_isolation.cross_tenant_access_impossible).toBe(true);
    expect(result.observability.metrics_coverage).toBe(true);
    expect(result.observability.replay_capture).toBe(true);
    expect(result.attestation.cryptographically_verifiable).toBe(true);
    expect(result.attestation.immutable).toBe(true);
  });

  it("keeps continuous qualification and lifecycle governance operational", () => {
    const result = runProductionEnvironmentQualification();

    expect(result.continuous_qualification.monitored_controls).toHaveLength(8);
    expect(result.continuous_qualification.continuous_monitoring).toBe(true);
    expect(result.continuous_qualification.requalification_deterministic).toBe(true);
    expect(result.continuous_qualification.unauthorized_environments_blocked).toBe(true);
    expect(result.lifecycle_governance.states).toHaveLength(12);
    expect(result.lifecycle_governance.replay_reproducible).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionEnvironmentQualification();
    const second = runProductionEnvironmentQualification();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionEnvironmentQualification(first).valid).toBe(true);
    expect(replayProductionEnvironmentQualification(first)).toBe(true);
  });

  it("executes the complete Phase 15.3 certification matrix", () => {
    const result = runProductionEnvironmentQualification();

    expect(result.certification_tests).toHaveLength(26);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Production Environment Registry complete",
      "Environment identities unique",
      "Environment versions governed",
      "Identity and version validated",
      "Infrastructure integrity verified",
      "Network boundaries validated",
      "Secrets configuration verified",
      "Storage isolation enforced",
      "Policy deployment verified",
      "Observability coverage complete",
      "Tenant isolation controls validated",
      "Configuration reproducible",
      "Configuration drift detectable",
      "Unauthorized drift invalidates qualification",
      "Environment attestation generated",
      "Attestation cryptographically verifiable",
      "Qualification evidence immutable",
      "Environment lineage preserved",
      "Continuous qualification operational",
      "Requalification deterministic",
      "Unauthorized environments blocked",
      "Only qualified environments eligible for deployment",
      "Replay of qualification reproducible",
      "Governance enforcement deterministic",
      "Phase 14.2 environment model conformity verified",
      "Production readiness requirements satisfied",
    ]);
  });

  it("supports conditional pass for non-constitutional environment warnings", () => {
    const result = runProductionEnvironmentQualification({ scenario: "NON_CONSTITUTIONAL_ENVIRONMENT_WARNING" });
    const validation = validateProductionEnvironmentQualification(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "REGISTRY_INCOMPLETE",
    "ENVIRONMENT_IDENTITIES_NOT_UNIQUE",
    "ENVIRONMENT_VERSIONS_UNGOVERNED",
    "IDENTITY_VERSION_INVALID",
    "INFRASTRUCTURE_INTEGRITY_FAILED",
    "NETWORK_BOUNDARIES_INVALID",
    "SECRETS_CONFIGURATION_INVALID",
    "STORAGE_ISOLATION_FAILED",
    "POLICY_DEPLOYMENT_INVALID",
    "OBSERVABILITY_COVERAGE_INCOMPLETE",
    "TENANT_ISOLATION_CONTROLS_INVALID",
    "CONFIGURATION_NOT_REPRODUCIBLE",
    "DRIFT_NOT_DETECTABLE",
    "UNAUTHORIZED_DRIFT_NOT_INVALIDATING",
    "ATTESTATION_NOT_GENERATED",
    "ATTESTATION_NOT_VERIFIABLE",
    "QUALIFICATION_EVIDENCE_MUTABLE",
    "ENVIRONMENT_LINEAGE_LOST",
    "CONTINUOUS_QUALIFICATION_INOPERABLE",
    "REQUALIFICATION_NON_DETERMINISTIC",
    "UNAUTHORIZED_ENVIRONMENTS_NOT_BLOCKED",
    "UNQUALIFIED_ENVIRONMENT_DEPLOYABLE",
    "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE",
    "GOVERNANCE_ENFORCEMENT_NON_DETERMINISTIC",
    "PHASE14_ENVIRONMENT_MODEL_NONCONFORMANT",
    "PRODUCTION_READINESS_REQUIREMENTS_UNSATISFIED",
  ] as const)("fails certification for %s", (scenario: ProductionEnvironmentFailure) => {
    const result = runProductionEnvironmentQualification({ scenario });
    const validation = validateProductionEnvironmentQualification(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested environment registry tampering", () => {
    const result = runProductionEnvironmentQualification();
    const tampered = {
      ...result,
      registry: [
        {
          ...result.registry[0],
          region: "tampered-region",
        },
      ],
    };

    expect(validateProductionEnvironmentQualification(tampered).valid).toBe(false);
  });
});
