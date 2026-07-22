import { describe, expect, it } from "vitest";

import { getTrustRegistryDomainsBundle, replayTrustRegistryDomains, runTrustRegistryDomains, validateTrustRegistryDomains } from "@/services/trust-registry-domains";
import type { TrustRegistryDomainsFailure } from "@/types/trust-registry-domains";

const conditionalFailures = ["TRUST_REGISTRY_MISSING", "TRUST_IDENTITY_RECORDS_MISSING", "IMMUTABLE_TRUST_IDS_MISSING", "REGISTRY_VERSIONING_MISSING", "REGISTRY_LIFECYCLE_MISSING", "TRUST_DISCOVERY_MISSING", "REGISTRY_QUERIES_MISSING", "REGISTRY_VALIDATION_MISSING", "DOMAIN_REGISTRY_MISSING", "DOMAIN_IDENTITY_MISSING", "DOMAIN_OWNERSHIP_MISSING", "DOMAIN_HIERARCHY_MISSING", "DOMAIN_MEMBERSHIP_MISSING", "DOMAIN_CLASSIFICATION_MISSING", "DOMAIN_LIFECYCLE_MISSING", "RELATIONSHIP_ENGINE_MISSING", "RELATIONSHIPS_NOT_VERSIONED", "RELATIONSHIPS_NOT_REPLAYABLE", "RELATIONSHIP_GRAPH_INVALID", "AUTHORITY_RELATIONSHIPS_INVALID", "DOMAIN_BOUNDARY_MANAGER_MISSING", "BOUNDARY_DEFINITIONS_MISSING", "BOUNDARY_VALIDATION_MISSING", "DOMAIN_POLICY_SERVICE_MISSING", "DOMAIN_POLICIES_MISSING", "POLICY_INHERITANCE_NON_DETERMINISTIC", "ADMISSION_POLICIES_MISSING", "CERTIFICATION_POLICIES_MISSING", "METADATA_SERVICE_MISSING", "METADATA_REGISTRY_MISSING", "METADATA_HISTORY_MUTABLE", "PROVENANCE_MISSING", "MODIFICATION_HISTORY_MISSING", "DOMAIN_GOVERNANCE_MISSING", "GOVERNANCE_APPROVAL_WORKFLOW_MISSING", "GOVERNANCE_AUDIT_MISSING", "REGISTRY_EVIDENCE_MISSING"] as const satisfies readonly TrustRegistryDomainsFailure[];
const failClosedFailures = ["STAGE_1_TRUST_FOUNDATION_INVALID", "STAGE_2_CONSTITUTIONAL_GATE_INVALID", "CAF_IDENTITY_SERVICES_INVALID", "CCI_IDENTITY_INFRASTRUCTURE_INVALID", "CCI_REGISTRY_SERVICES_INVALID", "CCI_EVIDENCE_FRAMEWORK_INVALID", "CCI_REPLAY_FRAMEWORK_INVALID", "DOMAIN_ISOLATION_INVALID", "CROSS_DOMAIN_ACCESS_ALLOWED", "BOUNDARY_ENFORCEMENT_NOT_FAIL_CLOSED", "DOMAIN_AUTHORITY_INVALID", "OWNERSHIP_NOT_ENFORCED", "EVIDENCE_NOT_SIGNED", "EVIDENCE_NOT_REPLAYABLE", "REGISTRY_REPLAY_NON_DETERMINISTIC", "REGISTRY_STATE_NOT_RECONSTRUCTABLE"] as const satisfies readonly TrustRegistryDomainsFailure[];

describe("Stage 3 Trust Registry & Domains", () => {
  it("publishes the Stage 3 registry and domain doctrine", () => {
    const bundle = getTrustRegistryDomainsBundle();

    expect(bundle.doctrine).toMatchObject({ version: "trust-registry-domains/stage-3", authoritative_trust_registry: true, canonical_domain_model: true, immutable_identities_required: true, domain_isolation_required: true, cross_domain_access_fail_closed: true, replay_reconstructable_registry: true, qualification_gate: "Stage 3 Trust Registry & Domains Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("TRUST_REGISTRY_DOMAINS_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Stage 1 plus Stage 2", () => {
    const first = runTrustRegistryDomains({ seed: "deterministic" });
    const second = runTrustRegistryDomains({ seed: "deterministic" });

    expect(first.upstream_refs).toContain("trust-foundation-stage-one/stage-1");
    expect(first.upstream_refs).toContain("trust-constitutional-compliance-gate/stage-2");
    expect(first.provides).toContain("trust-evaluation-engine");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateTrustRegistryDomains(first).valid).toBe(true);
    expect(replayTrustRegistryDomains()).toBe(true);
  });

  it("registers immutable trust identities with canonical standings", () => {
    const result = runTrustRegistryDomains();

    expect(result.registry.entity_types).toEqual(["EVALUATION", "POLICY", "CERTIFICATION", "EVIDENCE", "MONITORING", "FEDERATION", "DOMAIN", "IDENTITY"]);
    expect(result.registry.standings).toEqual(["ACTIVE", "PENDING", "SUSPENDED", "REVOKED", "ARCHIVED"]);
    expect(result.registry).toMatchObject({ identity_records: true, immutable_trust_ids: true, registry_versioning: true, registry_lifecycle: true, trust_discovery: true, registry_queries: true, registry_validation: true, registry_evidence: true });
  });

  it("maintains independently governed immutable trust domains", () => {
    const result = runTrustRegistryDomains();

    expect(result.domains).toMatchObject({ domain_identity: true, domain_ownership: true, domain_hierarchy: true, domain_membership: true, domain_classification: true, domain_lifecycle: true, domain_discovery: true, independently_governed_boundaries: true, immutable_domain_records: true });
  });

  it("models deterministic versioned and replayable relationships", () => {
    const result = runTrustRegistryDomains();

    expect(result.relationships.relationship_kinds).toEqual(["PARENT", "CHILD", "DEPENDENCY", "DELEGATION", "AUTHORITY", "CERTIFICATION", "FEDERATION"]);
    expect(result.relationships).toMatchObject({ parent_relationships: true, child_relationships: true, dependency_relationships: true, delegation_relationships: true, authority_relationships: true, certification_relationships: true, federation_relationships: true, immutable: true, versioned: true, replayable: true });
  });

  it("enforces domain boundaries fail closed", () => {
    const result = runTrustRegistryDomains();

    expect(result.boundaries).toMatchObject({ boundary_definitions: true, boundary_validation: true, isolation_rules: true, cross_domain_validation: true, boundary_evidence: true, boundary_enforcement: true, fail_closed: true, explicit_constitutional_authorization_required: true, tenant_isolation: true });
    expect(runTrustRegistryDomains({ scenario: "CROSS_DOMAIN_ACCESS_ALLOWED" }).readiness.decision).toBe("FAIL_CLOSED");
  });

  it("qualifies policies, metadata, governance, and evidence ledger", () => {
    const result = runTrustRegistryDomains();

    expect(result.policies).toMatchObject({ domain_policies: true, domain_restrictions: true, admission_policies: true, evaluation_policies: true, monitoring_policies: true, certification_policies: true, recovery_policies: true, deterministic_inheritance: true, traceable_inheritance: true });
    expect(result.metadata).toMatchObject({ metadata_registry: true, tags: true, labels: true, classification: true, attributes: true, provenance: true, creation_history: true, modification_history: true, immutable_version_history: true });
    expect(result.governance).toMatchObject({ domain_owners: true, domain_administrators: true, governance_rules: true, domain_authority: true, approval_workflow: true, governance_audit: true, governance_evidence: true, ownership_enforced: true, authority_verified: true });
    expect(result.evidence).toMatchObject({ trust_registration: true, domain_registration: true, identity_creation: true, relationship_creation: true, boundary_validation: true, policy_assignment: true, governance_decisions: true, metadata_updates: true, lifecycle_changes: true, signed: true, timestamped: true, replayable: true });
  });

  it("reconstructs registry state through replay", () => {
    const result = runTrustRegistryDomains();

    expect(result.readiness).toMatchObject({ immutable_identities: true, domain_isolation_enforced: true, cross_domain_fail_closed: true, ownership_governed: true, registry_state_reconstructable: true, qualification_ready: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runTrustRegistryDomains({ scenario: failure });
    const validation = validateTrustRegistryDomains(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runTrustRegistryDomains({ scenario: failure });
    const validation = validateTrustRegistryDomains(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runTrustRegistryDomains({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runTrustRegistryDomains({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runTrustRegistryDomains({ scenario: "TRUST_REGISTRY_DOMAINS_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateTrustRegistryDomains(notQualified).valid).toBe(false);
  });
});
