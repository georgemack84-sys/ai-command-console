import { describe, expect, it } from "vitest";

import {
  getSkillRegistryBundle,
  replaySkillRegistry,
  runSkillRegistry,
  validateSkillRegistry,
} from "@/services/skill-registry";
import type { SkillRegistryFailure } from "@/types/skill-registry";

const conditionalFailures = [
  "SKILL_REGISTRY_MISSING",
  "SKILL_CAPABILITY_MAPPING_MISSING",
  "SKILL_METADATA_INVALID",
  "PACKAGE_REPOSITORY_MISSING",
  "VERSION_MANAGER_MISSING",
  "VERSION_LINEAGE_MISSING",
  "ROLLBACK_REFERENCES_MISSING",
  "COMPATIBILITY_ENGINE_MISSING",
  "CERTIFICATION_MANAGER_MISSING",
  "CERTIFICATION_EVIDENCE_MISSING",
  "DISCOVERY_ENGINE_MISSING",
  "SKILL_TEST_HARNESS_MISSING",
  "GOVERNANCE_API_MISSING",
  "SKILL_EVIDENCE_MISSING",
] as const satisfies readonly SkillRegistryFailure[];

const failClosedFailures = [
  "W2_0_CAF_CONSTITUTION_INVALID",
  "W2_1_AGENT_REGISTRY_INVALID",
  "W2_2_LIFECYCLE_ENGINE_INVALID",
  "W2_3_CAPABILITY_REGISTRY_INVALID",
  "SKILL_IDENTITY_NOT_UNIQUE",
  "SKILL_OWNER_AMBIGUOUS",
  "UNSIGNED_PACKAGE_ALLOWED",
  "PACKAGE_INTEGRITY_INVALID",
  "PACKAGE_NOT_IMMUTABLE",
  "PACKAGE_NOT_REPRODUCIBLE",
  "DEPRECATED_SKILL_EXECUTABLE",
  "REVOKED_SKILL_EXECUTABLE",
  "RUNTIME_COMPATIBILITY_INVALID",
  "CAPABILITY_COMPATIBILITY_INVALID",
  "AUTHORITY_COMPATIBILITY_INVALID",
  "POLICY_COMPATIBILITY_INVALID",
  "DEPENDENCY_COMPATIBILITY_INVALID",
  "LIFECYCLE_COMPATIBILITY_INVALID",
  "CERTIFICATION_COMPATIBILITY_INVALID",
  "DEPENDENCY_GRAPH_NON_DETERMINISTIC",
  "DEPENDENCY_CYCLE_UNDETECTED",
  "MISSING_DEPENDENCY_ALLOWED",
  "UNCERTIFIED_SKILL_DEPLOYABLE",
  "CERTIFICATION_EXPIRATION_IGNORED",
  "CERTIFICATION_REVOCATION_IGNORED",
  "DISCOVERY_RESULTS_NON_DETERMINISTIC",
  "REPLAY_VALIDATION_MISSING",
  "SECURITY_VALIDATION_MISSING",
  "TENANT_ISOLATION_FAILED",
  "GOVERNANCE_POLICY_NOT_ENFORCED",
  "SKILL_EVIDENCE_NOT_IMMUTABLE",
  "SKILL_REGISTRY_REPLAY_INVALID",
] as const satisfies readonly SkillRegistryFailure[];

describe("Skill Registry W2.4", () => {
  it("publishes the W2.4 operational doctrine and bundle", () => {
    const bundle = getSkillRegistryBundle();

    expect(bundle.doctrine).toMatchObject({
      version: "skill-registry/w2.4",
      owns_skill_registry: true,
      owns_skill_packages: true,
      owns_skill_versioning: true,
      owns_dependency_resolution: true,
      owns_compatibility_validation: true,
      owns_skill_certification: true,
      owns_skill_discovery: true,
      owns_skill_test_harness: true,
      owns_skill_governance_apis: true,
      owns_skill_evidence: true,
      operational_gate: "Skill Registry Operational Gate",
    });
    expect(bundle.result.readiness.decision).toBe("SKILL_REGISTRY_OPERATIONAL");
    expect(bundle.validation.valid).toBe(true);
  });

  it("anchors deterministic skill governance to W2.0 through W2.3", () => {
    const first = runSkillRegistry();
    const second = runSkillRegistry();

    expect(first.caf_constitution_ref).toBe("caf-constitutional-foundation/w2.0");
    expect(first.agent_registry_ref).toBe("agent-registry/w2.1");
    expect(first.lifecycle_engine_ref).toBe("lifecycle-engine/w2.2");
    expect(first.capability_registry_ref).toBe("capability-registry/w2.3");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSkillRegistry(first).valid).toBe(true);
    expect(replaySkillRegistry(first)).toBe(true);
  });

  it("registers skills with owner, capability, runtime, authority, risk, and tenant metadata", () => {
    const result = runSkillRegistry();

    expect(result.registry).toMatchObject({
      authoritative_catalog: true,
      unique_skill_identity: true,
      metadata_indexing: true,
      discovery_indexing: true,
      ownership_binding: true,
      single_owner: true,
      capability_mapping: true,
      runtime_requirements: true,
      supported_agents: true,
      certification_status: true,
      risk_classification: true,
      authority_requirements: true,
      tenant_scope: true,
      lifecycle_state: "Published",
    });
  });

  it("requires immutable signed reproducible packages and deterministic version lineage", () => {
    const result = runSkillRegistry();

    expect(result.packages).toMatchObject({
      executable_logic: true,
      schemas: true,
      manifests: true,
      policies: true,
      configuration: true,
      documentation: true,
      tests: true,
      certification_artifacts: true,
      replay_artifacts: true,
      immutable_packages: true,
      signed_packages: true,
      reproducible_packages: true,
      versioned_packages: true,
      package_integrity: true,
    });
    expect(result.versions).toMatchObject({
      semantic_versions: true,
      immutable_releases: true,
      patch_tracking: true,
      deprecation: true,
      retirement: true,
      compatibility_history: true,
      upgrade_paths: true,
      rollback_references: true,
      release_dates: true,
      lineage: true,
      change_summary: true,
      certification_linkage: true,
    });
  });

  it("validates dependency, compatibility, certification, discovery, and test harness surfaces", () => {
    const result = runSkillRegistry();

    expect(result.dependencies).toMatchObject({
      deterministic_resolution: true,
      dependency_existence: true,
      dependency_versions: true,
      circular_detection: true,
      package_integrity: true,
      capability_availability: true,
      authority_compatibility: true,
      certification_compatibility: true,
      cycle_free: true,
    });
    expect(result.compatibility.outcomes).toEqual(["Compatible", "Compatible with Restrictions", "Upgrade Required", "Incompatible"]);
    expect(result.compatibility).toMatchObject({
      runtime_compatibility: true,
      capability_compatibility: true,
      authority_compatibility: true,
      policy_compatibility: true,
      dependency_compatibility: true,
      package_compatibility: true,
      lifecycle_compatibility: true,
      certification_compatibility: true,
      deterministic_reports: true,
    });
    expect(result.certification).toMatchObject({
      testing_status: true,
      qualification_evidence: true,
      replay_validation: true,
      security_validation: true,
      policy_validation: true,
      authority_validation: true,
      operational_approval: true,
      expiration_tracking: true,
      certification_history: true,
      revocation: true,
      production_blocks_uncertified: true,
    });
    expect(result.discovery).toMatchObject({
      search: true,
      filtering: true,
      capability_lookup: true,
      authority_lookup: true,
      certification_lookup: true,
      version_lookup: true,
      dependency_lookup: true,
      dependency_visualization: true,
      version_comparison: true,
      package_browsing: true,
      lineage_exploration: true,
      deterministic_results: true,
    });
    expect(result.test_harness).toMatchObject({
      unit_execution: true,
      integration_testing: true,
      policy_validation: true,
      authority_validation: true,
      replay_testing: true,
      compatibility_testing: true,
      regression_testing: true,
      certification_testing: true,
      functionality_validated: true,
      certification_readiness: true,
    });
  });

  it("exposes complete governance APIs and immutable skill evidence", () => {
    const result = runSkillRegistry();

    expect(result.governance_apis).toMatchObject({
      register_skill: true,
      update_metadata: true,
      retrieve_skill: true,
      search_skills: true,
      list_versions: true,
      view_dependencies: true,
      upload_package: true,
      retrieve_package: true,
      verify_package: true,
      download_package: true,
      compare_packages: true,
      validate_skill: true,
      validate_runtime: true,
      resolve_dependencies: true,
      compatibility_report: true,
      submit_certification: true,
      retrieve_certification: true,
      revoke_certification: true,
      certification_history: true,
      policy_enforcement: true,
      runtime_deployment_eligibility: true,
    });
    expect(result.evidence.records).toHaveLength(10);
    expect(result.evidence).toMatchObject({
      registration_records: true,
      package_manifests: true,
      version_history: true,
      compatibility_reports: true,
      dependency_graphs: true,
      certification_evidence: true,
      replay_evidence: true,
      security_evidence: true,
      governance_decisions: true,
      lifecycle_records: true,
      immutable: true,
      replayable: true,
    });
    expect(result.readiness.production_deployment_eligible).toBe(true);
  });

  it.each(conditionalFailures)("degrades to conditional operation for %s", (failure) => {
    const result = runSkillRegistry({ scenario: failure });
    const validation = validateSkillRegistry(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_OPERATIONAL");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runSkillRegistry({ scenario: failure });
    const validation = validateSkillRegistry(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("marks explicit operational gate failure as not operational", () => {
    const result = runSkillRegistry({ scenario: "SKILL_REGISTRY_OPERATIONAL_GATE_FAILED" });

    expect(result.readiness.decision).toBe("NOT_OPERATIONAL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(validateSkillRegistry(result).valid).toBe(false);
  });

  it("records observations and follow-up states as conditional without synthetic failures", () => {
    const observed = runSkillRegistry({ scenario: "OPERATIONAL_WITH_OBSERVATIONS" });
    const followup = runSkillRegistry({ scenario: "CONDITIONAL_FOLLOWUP" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_OPERATIONAL");
    expect(followup.readiness.failures).toEqual([]);
  });
});
