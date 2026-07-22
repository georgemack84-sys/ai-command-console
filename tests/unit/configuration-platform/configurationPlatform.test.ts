import { describe, expect, it } from "vitest";
import { getConfigurationPlatformBundle, replayConfigurationPlatform, runConfigurationPlatform, validateConfigurationPlatform } from "@/services/configuration-platform";
import type { ConfigurationPlatformFailure } from "@/types/configuration-platform";

const CONDITIONAL_FAILURES: readonly ConfigurationPlatformFailure[] = [
  "REGISTRY_RECONCILIATION_INCOMPLETE",
  "OBSERVABILITY_QUALIFICATION_INVALID",
  "CONFIGURATION_ARCHITECTURE_MISSING",
  "CONFIGURATION_DOMAIN_REGISTRY_MISSING",
  "CONFIGURATION_SERVICE_MISSING",
  "CONFIGURATION_STORAGE_UNAVAILABLE",
  "CONFIGURATION_VERSION_HISTORY_MISSING",
  "RUNTIME_CONFIGURATION_MISSING",
  "RUNTIME_REFRESH_UNCONTROLLED",
  "FEATURE_FLAG_PLATFORM_MISSING",
  "ROLLOUT_POLICY_INVALID",
  "ENVIRONMENT_PROFILES_MISSING",
  "PROFILE_INHERITANCE_NON_DETERMINISTIC",
  "CONFIGURATION_VALIDATION_MISSING",
  "SCHEMA_VALIDATION_FAILED",
  "CONTRACT_VALIDATION_FAILED",
  "DEPENDENCY_VALIDATION_FAILED",
  "CONFLICT_DETECTION_FAILED",
  "CONFIGURATION_EVIDENCE_MISSING",
  "CONFIGURATION_LINEAGE_MISSING",
];

const FAIL_CLOSED_FAILURES: readonly ConfigurationPlatformFailure[] = [
  "W1_4A_REGISTRY_CORE_INVALID",
  "W1_1A_IDENTITY_CORE_INVALID",
  "W1_2A_STORAGE_CORE_INVALID",
  "W1_3A_MESSAGING_CORE_INVALID",
  "SECURITY_CORE_INVALID",
  "RUNTIME_RESOLUTION_NON_DETERMINISTIC",
  "FEATURE_FLAG_EVALUATION_NON_DETERMINISTIC",
  "ENVIRONMENT_ISOLATION_FAILED",
  "AUTHORIZATION_VALIDATION_FAILED",
  "CONFIGURATION_EVIDENCE_NOT_IMMUTABLE",
  "CONFIGURATION_REPLAY_INVALID",
];

describe("W1.5 Configuration Platform", () => {
  it("publishes configuration-platform doctrine and validates baseline", () => {
    const bundle = getConfigurationPlatformBundle();

    expect(bundle.doctrine.version).toBe("configuration-platform/w1.5");
    expect(bundle.doctrine.owns_configuration_service).toBe(true);
    expect(bundle.doctrine.owns_runtime_configuration).toBe(true);
    expect(bundle.doctrine.owns_feature_flags).toBe(true);
    expect(bundle.doctrine.owns_environment_profiles).toBe(true);
    expect(bundle.doctrine.owns_configuration_validation).toBe(true);
    expect(bundle.doctrine.owns_configuration_evidence).toBe(true);
    expect(bundle.doctrine.exit_state).toBe("CONFIGURATION_PLATFORM_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic configuration qualification with core predecessor references", () => {
    const first = runConfigurationPlatform();
    const second = runConfigurationPlatform();

    expect(first.phase_identifier).toBe("ConfigurationPlatform");
    expect(first.registry_core_ref).toBe("registry-core/w1.4a");
    expect(first.identity_core_ref).toBe("identity-core/w1.1a");
    expect(first.storage_core_ref).toBe("storage-core/w1.2a");
    expect(first.messaging_core_ref).toBe("messaging-core/w1.3a");
    expect(first.environment_profiles.profiles).toHaveLength(5);
    expect(first.evidence.records).toHaveLength(6);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateConfigurationPlatform(first).valid).toBe(true);
    expect(replayConfigurationPlatform(first)).toBe(true);
  });

  it("qualifies architecture, service, runtime configuration, and feature flags", () => {
    const result = runConfigurationPlatform();

    expect(result.architecture.domains_defined).toBe(true);
    expect(result.architecture.inheritance_rules).toBe(true);
    expect(result.architecture.override_rules).toBe(true);
    expect(result.architecture.deterministic_resolution_model).toBe(true);
    expect(result.configuration_service.configuration_storage).toBe(true);
    expect(result.configuration_service.tenant_isolation).toBe(true);
    expect(result.configuration_service.immutable_history).toBe(true);
    expect(result.runtime_configuration.deterministic_resolution).toBe(true);
    expect(result.runtime_configuration.immutable_snapshots).toBe(true);
    expect(result.runtime_configuration.reproducible).toBe(true);
    expect(result.feature_flags.rollout_policies).toBe(true);
    expect(result.feature_flags.tenant_targeting).toBe(true);
    expect(result.feature_flags.deterministic_evaluation).toBe(true);
  });

  it("qualifies environment profiles, validation, evidence, and readiness", () => {
    const result = runConfigurationPlatform();

    expect(result.environment_profiles.profiles).toEqual(["development", "integration", "testing", "staging", "production"]);
    expect(result.environment_profiles.environment_isolation).toBe(true);
    expect(result.environment_profiles.deterministic_inheritance).toBe(true);
    expect(result.validation.schema_validation).toBe(true);
    expect(result.validation.contract_validation).toBe(true);
    expect(result.validation.dependency_validation).toBe(true);
    expect(result.validation.authorization_validation).toBe(true);
    expect(result.validation.passed).toBe(true);
    expect(result.evidence.configuration_lineage).toBe(true);
    expect(result.evidence.immutable_audit).toBe(true);
    expect(result.evidence.replayable).toBe(true);
    expect(result.qualification.qualified).toBe(true);
    expect(result.readiness.decision).toBe("CONFIGURATION_PLATFORM_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(CONDITIONAL_FAILURES)("marks configuration platform conditionally qualified for remediable deficiency %s", (failure) => {
    const result = runConfigurationPlatform({ scenario: failure });
    const validation = validateConfigurationPlatform(result);

    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("marks configuration platform not qualified when qualification fails", () => {
    const result = runConfigurationPlatform({ scenario: "CONFIGURATION_QUALIFICATION_FAILED" });

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateConfigurationPlatform(result).valid).toBe(false);
  });

  it.each(FAIL_CLOSED_FAILURES)("fails closed for critical configuration defect %s", (failure) => {
    const result = runConfigurationPlatform({ scenario: failure });

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateConfigurationPlatform(result).valid).toBe(false);
  });

  it("keeps qualified-with-observations and conditional follow-up outside full qualification", () => {
    const observed = runConfigurationPlatform({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const conditional = runConfigurationPlatform({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.phase_ready).toBe(false);
    expect(validateConfigurationPlatform(observed).valid).toBe(false);
    expect(conditional.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(conditional.readiness.phase_ready).toBe(false);
  });
});
