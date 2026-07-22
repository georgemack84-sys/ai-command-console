import { describe, expect, it } from "vitest";
import { getPublisherOsBundle, replayPublisherOs, runPublisherOs, validatePublisherOs } from "@/services/publisher-os";
import type { PublisherScenario } from "@/types/publisher-os";

describe("Program 4 P4.14 Publisher OS", () => {
  it("publishes Publisher OS doctrine without owning governance, evidence, replay, identity, tenant, or enforcement infrastructure", () => {
    const bundle = getPublisherOsBundle();

    expect(bundle.doctrine.version).toBe("publisher-os/v4.14");
    expect(bundle.doctrine.owns_publication_management).toBe(true);
    expect(bundle.doctrine.owns_document_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_publication_workflows).toBe(true);
    expect(bundle.doctrine.owns_publication_rendering).toBe(true);
    expect(bundle.doctrine.owns_publication_distribution).toBe(true);
    expect(bundle.doctrine.owns_publication_templates).toBe(true);
    expect(bundle.doctrine.owns_constitutional_governance).toBe(false);
    expect(bundle.doctrine.owns_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_replay_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_identity_infrastructure).toBe(false);
    expect(bundle.doctrine.owns_tenant_management).toBe(false);
    expect(bundle.doctrine.owns_authority_enforcement).toBe(false);
    expect(bundle.doctrine.owns_policy_enforcement).toBe(false);
    expect(bundle.doctrine.owns_safety_enforcement).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("builds deterministic publication registry, lifecycle, governance, lineage, evidence, rendering, distribution, and search", () => {
    const first = runPublisherOs();
    const second = runPublisherOs();

    expect(first.pbg_ref).toBe("policy-business-governance/v4.13");
    expect(first.foundation.application_name).toBe("Publisher OS");
    expect(first.registry.operational).toBe(true);
    expect(first.lifecycle.statuses).toEqual(["DRAFT", "UNDER_REVIEW", "APPROVED", "PUBLISHED", "SUPERSEDED", "ARCHIVED"]);
    expect(first.lifecycle.approval.decision).toBe("APPROVED");
    expect(first.governance.integrated).toBe(true);
    expect(first.governance.enforcement_owned).toBe(false);
    expect(first.lineage.deterministic).toBe(true);
    expect(first.evidence.references_canonical_cci_evidence).toBe(true);
    expect(first.evidence.owns_evidence).toBe(false);
    expect(first.rendering.rendered_artifacts).toEqual(["artifact:html", "artifact:markdown", "artifact:pdf", "artifact:json", "artifact:xml"]);
    expect(first.distribution.operational).toBe(true);
    expect(first.search.functional).toBe(true);
    expect(first.search.consumes_cci_search).toBe(true);
    expect(first.observability.visible).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validatePublisherOs(first).valid).toBe(true);
    expect(replayPublisherOs(first)).toBe(true);
  });

  it("certifies Publisher OS readiness for ecosystem publication", () => {
    const result = runPublisherOs();

    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.phase_ready).toBe(true);
    expect(result.certification.architecture_implemented).toBe(true);
    expect(result.certification.registry_operational).toBe(true);
    expect(result.certification.authoring_operational).toBe(true);
    expect(result.certification.lifecycle_managed).toBe(true);
    expect(result.certification.governance_integrated).toBe(true);
    expect(result.certification.lineage_deterministic).toBe(true);
    expect(result.certification.evidence_canonical).toBe(true);
    expect(result.certification.rendering_reproducible).toBe(true);
    expect(result.certification.distribution_operational).toBe(true);
    expect(result.certification.search_functional).toBe(true);
    expect(result.certification.observability_visible).toBe(true);
    expect(result.certification.readiness_confirmed).toBe(true);
    expect(result.certification.no_out_of_scope_ownership).toBe(true);
  });

  it.each([
    "P4_13_PBG_INVALID",
    "P4_11_MISSION_CONTROL_INVALID",
    "PROGRAM_2_CCI_SERVICES_INVALID",
    "PROGRAM_3_CAF_GOVERNANCE_INVALID",
    "PUBLISHER_APPLICATION_MISSING",
    "PUBLISHER_ARCHITECTURE_MISSING",
    "PUBLISHER_CONTRACTS_MISSING",
    "PUBLICATION_MODEL_MISSING",
    "PUBLICATION_REGISTRY_MISSING",
    "PUBLICATION_CATALOG_MISSING",
    "PUBLICATION_DISCOVERY_MISSING",
    "AUTHORING_ENGINE_MISSING",
    "TEMPLATE_LIBRARY_MISSING",
    "COLLABORATIVE_AUTHORING_MISSING",
    "PUBLICATION_LIFECYCLE_NON_DETERMINISTIC",
    "PUBLICATION_APPROVAL_MISSING",
    "PUBLICATION_GOVERNANCE_INVALID",
    "CAF_GATES_NOT_BOUND",
    "VERSION_LINEAGE_INCOMPLETE",
    "REVISION_HISTORY_MISSING",
    "EVIDENCE_BINDING_MISSING",
    "CANONICAL_EVIDENCE_REFS_MISSING",
    "PROVENANCE_TRACEABILITY_INCOMPLETE",
    "RENDERING_ENGINE_MISSING",
    "RENDERING_NON_DETERMINISTIC",
    "RENDERED_ARTIFACTS_MISSING",
    "DISTRIBUTION_SERVICE_MISSING",
    "RELEASE_CHANNELS_MISSING",
    "TENANT_DELIVERY_MISSING",
    "SEARCH_SERVICES_MISSING",
    "CCI_SEARCH_NOT_CONSUMED",
    "OBSERVABILITY_DASHBOARD_MISSING",
    "OPERATIONAL_DIAGNOSTICS_MISSING",
    "READINESS_REPORT_MISSING",
    "CONSTITUTIONAL_COMPLIANCE_INVALID",
    "LINEAGE_INTEGRITY_INVALID",
    "REPLAY_COMPATIBILITY_INVALID",
    "CONSTITUTIONAL_GOVERNANCE_OWNERSHIP_ATTEMPTED",
    "EVIDENCE_STORAGE_ATTEMPTED",
    "REPLAY_INFRASTRUCTURE_ATTEMPTED",
    "IDENTITY_INFRASTRUCTURE_ATTEMPTED",
    "TENANT_MANAGEMENT_ATTEMPTED",
    "AUTHORITY_ENFORCEMENT_ATTEMPTED",
    "POLICY_ENFORCEMENT_ATTEMPTED",
    "SAFETY_ENFORCEMENT_ATTEMPTED",
  ] as const)("fails Publisher OS certification for %s", (scenario: PublisherScenario) => {
    const result = runPublisherOs({ scenario });
    const validation = validatePublisherOs(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runPublisherOs({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
