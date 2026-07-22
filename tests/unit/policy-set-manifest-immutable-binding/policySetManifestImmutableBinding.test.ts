import { describe, expect, it } from "vitest";

import {
  getPolicySetManifestImmutableBindingContract,
  replayPolicySetManifestImmutableBinding,
  runPolicySetManifestImmutableBinding,
  validatePolicySetManifestImmutableBinding,
} from "../../../services/policy-set-manifest-immutable-binding";
import type { PolicyManifestScenario } from "../../../types/policy-set-manifest-immutable-binding";

describe("policy set manifest immutable binding", () => {
  it("generates deterministic production-ready policy manifests", () => {
    const first = runPolicySetManifestImmutableBinding();
    const second = runPolicySetManifestImmutableBinding();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.production_ready).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validatePolicySetManifestImmutableBinding(first).valid).toBe(true);
    expect(replayPolicySetManifestImmutableBinding(first)).toBe(true);
  });

  it("publishes the immutable binding doctrine", () => {
    const bundle = getPolicySetManifestImmutableBindingContract();

    expect(bundle.doctrine.one_manifest_per_cycle).toBe(true);
    expect(bundle.doctrine.manifests_immutable).toBe(true);
    expect(bundle.doctrine.policy_versions_immutable).toBe(true);
    expect(bundle.doctrine.governance_approval_required).toBe(true);
    expect(bundle.doctrine.constitutional_approval_required).toBe(true);
    expect(bundle.doctrine.replay_uses_original_manifest).toBe(true);
  });

  it("enforces required coverage, dependencies, compatibility, and approvals", () => {
    const result = runPolicySetManifestImmutableBinding();

    expect(result.policy_registry.complete).toBe(true);
    expect(result.required_policy_matrix.complete).toBe(true);
    expect(result.manifest.completeness_report.complete).toBe(true);
    expect(result.dependency_resolution.missing_dependencies).toHaveLength(0);
    expect(result.dependency_resolution.cycles).toHaveLength(0);
    expect(result.compatibility_report.compatible).toBe(true);
    expect(result.governance_validation.governance_approved).toBe(true);
    expect(result.governance_validation.constitutional_approved).toBe(true);
  });

  it("binds one recommendation cycle to one immutable manifest snapshot", () => {
    const result = runPolicySetManifestImmutableBinding();

    expect(result.binding.recommendation_cycle_id).toBe(result.manifest.recommendation_cycle_id);
    expect(result.binding.manifest_id).toBe(result.manifest.manifest_id);
    expect(result.binding.manifest_integrity_hash).toBe(result.manifest.integrity_hash);
    expect(result.binding.immutable).toBe(true);
    expect(result.binding.rebound).toBe(false);
    expect(result.binding.policy_versions).toHaveLength(result.manifest.included_policies.length);
  });

  it("certifies replay as byte-identical against the original manifest", () => {
    const result = runPolicySetManifestImmutableBinding();

    expect(result.replay_validation.manifest_restored).toBe(true);
    expect(result.replay_validation.versions_restored).toBe(true);
    expect(result.replay_validation.dependencies_restored).toBe(true);
    expect(result.replay_validation.approvals_restored).toBe(true);
    expect(result.replay_validation.byte_identical).toBe(true);
    expect(result.replay_validation.hash_reproducible).toBe(true);
  });

  it("runs the phase 12.2 certification matrix", () => {
    const result = runPolicySetManifestImmutableBinding();

    expect(result.certification.tests).toHaveLength(29);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
    expect(result.certification.deliverables).toContain("PolicySetManifestArtifact");
    expect(result.certification.deliverables).toContain("Phase 12.2 Certification Suite");
  });

  it("fails closed for manifest, binding, governance, replay, and lifecycle violations", () => {
    const scenarios: readonly PolicyManifestScenario[] = [
      "MANDATORY_POLICY_MISSING",
      "DUPLICATE_POLICY_DETECTED",
      "DEPENDENCY_RESOLUTION_FAILURE",
      "COMPATIBILITY_CONFLICT",
      "VERSION_MISMATCH",
      "IMMUTABLE_BINDING_VIOLATION",
      "EXPIRED_POLICY_REFERENCED",
      "REVOKED_POLICY_REFERENCED",
      "GOVERNANCE_APPROVAL_MISSING",
      "CONSTITUTIONAL_APPROVAL_MISSING",
      "POLICY_SUBSTITUTION_ATTEMPT",
      "REPLAY_RECONSTRUCTION_FAILURE",
      "BYTE_REPLAY_MISMATCH",
      "UNAUTHORIZED_CROSS_TENANT_POLICY_REUSE",
      "OBSERVABILITY_METRICS_MISSING",
    ];

    for (const scenario of scenarios) {
      const result = runPolicySetManifestImmutableBinding({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.production_ready).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validatePolicySetManifestImmutableBinding(result).valid).toBe(false);
    }
  });
});
