import { describe, expect, it } from "vitest";
import { getTrustIdentityDomainsBoundariesBundle, replayTrustIdentityDomainsBoundaries, runTrustIdentityDomainsBoundaries, validateTrustIdentityDomainsBoundaries } from "@/services/trust-identity-domains-boundaries";
import type { TrustIdentityDomainBoundaryScenario } from "@/types/trust-identity-domains-boundaries";

describe("Program 5 P5.2 Trust Identity, Domains & Boundaries", () => {
  it("publishes identity, domain, boundary, isolation, and registry doctrine without later trust capabilities", () => {
    const bundle = getTrustIdentityDomainsBoundariesBundle();

    expect(bundle.doctrine.version).toBe("trust-identity-domains-boundaries/v5.2");
    expect(bundle.doctrine.owns_trust_identities).toBe(true);
    expect(bundle.doctrine.owns_trust_domains).toBe(true);
    expect(bundle.doctrine.owns_trust_boundaries).toBe(true);
    expect(bundle.doctrine.owns_tenant_trust_isolation).toBe(true);
    expect(bundle.doctrine.owns_trust_registries).toBe(true);
    expect(bundle.doctrine.implements_trust_scoring).toBe(false);
    expect(bundle.doctrine.implements_trust_evaluation).toBe(false);
    expect(bundle.doctrine.issues_credentials).toBe(false);
    expect(bundle.doctrine.executes_federation).toBe(false);
    expect(bundle.doctrine.authorizes_execution).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic distinct registries and preserves TrustDomain subset TenantBoundary", () => {
    const first = runTrustIdentityDomainsBoundaries();
    const second = runTrustIdentityDomainsBoundaries();
    const identity = first.trust_registry.identities[0];
    const domain = first.trust_domain_registry.domains[0];
    const boundary = first.trust_boundary_registry.boundaries[0];

    expect(first.phase_identifier).toBe("TrustIdentityDomainsBoundaries");
    expect(first.trust_constitution_ref).toBe("trust-constitutional-foundation/v5.0");
    expect(first.trust_architecture_ref).toBe("trust-architecture-alignment-foundation/v5.1");
    expect(first.trust_registry.registry_kind).toBe("TRUST_REGISTRY");
    expect(first.trust_domain_registry.registry_kind).toBe("TRUST_DOMAIN_REGISTRY");
    expect(first.trust_boundary_registry.registry_kind).toBe("TRUST_BOUNDARY_REGISTRY");
    expect(identity?.trusted_by_registration).toBe(false);
    expect(identity?.lifecycle_status).toBe("ACTIVE");
    expect(identity?.registration_status).toBe("ACCEPT");
    expect(domain?.tenant_boundary_ids).toEqual([domain?.tenant_id]);
    expect(domain?.trust_boundary_id).toBe(boundary?.trust_boundary_id);
    expect(boundary?.tenant_boundary_ids).toEqual([boundary?.tenant_id]);
    expect(first.resolution.path).toEqual(["TrustIdentity", "TrustDomain", "TrustBoundary", "TenantBoundary"]);
    expect(first.resolution.trust_domain_subset_tenant_boundary).toBe(true);
    expect(first.tenant_isolation.all_tenant_refs_equal).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustIdentityDomainsBoundaries(first).valid).toBe(true);
    expect(replayTrustIdentityDomainsBoundaries(first)).toBe(true);
  });

  it("qualifies the registry foundation against the P5.2 gate", () => {
    const result = runTrustIdentityDomainsBoundaries();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.trust_identity_uniqueness).toBe(true);
    expect(result.certification.trust_identity_determinism).toBe(true);
    expect(result.certification.trust_domain_containment).toBe(true);
    expect(result.certification.tenant_trust_isolation).toBe(true);
    expect(result.certification.domain_hierarchy_validity).toBe(true);
    expect(result.certification.trust_boundary_completeness).toBe(true);
    expect(result.certification.registry_separation).toBe(true);
    expect(result.certification.registry_integrity).toBe(true);
    expect(result.certification.namespace_conflict_handling).toBe(true);
    expect(result.certification.lifecycle_correctness).toBe(true);
    expect(result.certification.decision_status_separation).toBe(true);
    expect(result.certification.governance_authority_enforcement).toBe(true);
    expect(result.certification.evidence_completeness).toBe(true);
    expect(result.certification.deterministic_replay).toBe(true);
    expect(result.certification.cross_tenant_leakage_prevention).toBe(true);
    expect(result.certification.fail_closed_resolution).toBe(true);
  });

  it.each([
    "P5_0_TRUST_CONSTITUTION_INVALID",
    "P5_1_TRUST_ARCHITECTURE_INVALID",
    "TRUST_REGISTRY_MISSING",
    "TRUST_DOMAIN_REGISTRY_MISSING",
    "TRUST_BOUNDARY_REGISTRY_MISSING",
    "TRUST_IDENTITY_MISSING",
    "TRUST_IDENTITY_NOT_DETERMINISTIC",
    "TRUST_IDENTITY_NOT_UNIQUE",
    "TRUST_IDENTITY_AMBIGUOUS_TENANT",
    "TRUST_IDENTITY_NOT_DOMAIN_RESOLVABLE",
    "TRUST_IDENTITY_LIFECYCLE_INVALID",
    "REGISTRATION_OUTCOME_STORED_AS_LIFECYCLE",
    "REVOKED_IDENTITY_CAN_INITIATE_RELATIONSHIP",
    "IDENTITY_SILENTLY_TRUSTED",
    "TRUST_DOMAIN_MISSING",
    "DOMAIN_TENANT_CONTAINMENT_INVALID",
    "DOMAIN_SPANS_MULTIPLE_TENANTS",
    "DOMAIN_PARENT_TENANT_MISMATCH",
    "DOMAIN_BOUNDARY_MISSING",
    "DOMAIN_HIERARCHY_EXPANDS_SCOPE",
    "SUSPENDED_DOMAIN_ALLOWS_NEW_RELATIONSHIP",
    "TRUST_BOUNDARY_MISSING",
    "BOUNDARY_TENANT_AMBIGUOUS",
    "BOUNDARY_CONFLICT_SILENTLY_IGNORED",
    "BOUNDARY_RULES_INCOMPLETE",
    "TENANT_ISOLATION_INVALID",
    "CROSS_TENANT_MEMBERSHIP_ALLOWED",
    "CROSS_TENANT_DISCOVERY_LEAKAGE",
    "TRUST_PROPAGATION_IMPLICIT",
    "FOREIGN_EVIDENCE_AUTHORITATIVE",
    "DELEGATION_BYPASSES_ISOLATION",
    "FEDERATION_MERGES_DOMAINS",
    "REGISTRY_SEPARATION_INVALID",
    "REGISTRY_INTEGRITY_INVALID",
    "REGISTRY_HISTORY_REWRITABLE",
    "REGISTRY_MUTATION_WITHOUT_EVIDENCE",
    "NAMESPACE_CONFLICT_UNRESOLVED",
    "CONFLICTS_DO_NOT_FAIL_CLOSED",
    "CONTAINMENT_VALIDATION_NONDETERMINISTIC",
    "REPLAY_DIVERGENCE",
    "SECURITY_MODEL_MISSING",
    "OBSERVABILITY_MODEL_MISSING",
    "EVIDENCE_MODEL_INCOMPLETE",
  ] as const)("fails qualification for %s", (scenario: TrustIdentityDomainBoundaryScenario) => {
    const result = runTrustIdentityDomainsBoundaries({ scenario });
    const validation = validateTrustIdentityDomainsBoundaries(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("never downgrades TrustDomain subset TenantBoundary violations to a conditional outcome", () => {
    const result = runTrustIdentityDomainsBoundaries({ scenario: "DOMAIN_TENANT_CONTAINMENT_INVALID" });

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.outcome).not.toBe("CONDITIONAL_PASS");
    expect(result.resolution.trust_domain_subset_tenant_boundary).toBe(false);
  });
});
