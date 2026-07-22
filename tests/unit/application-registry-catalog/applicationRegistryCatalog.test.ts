import { describe, expect, it } from "vitest";
import {
  getApplicationRegistryCatalogBundle,
  replayApplicationRegistryCatalog,
  runApplicationRegistryCatalog,
  validateApplicationRegistryCatalog,
} from "@/services/application-registry-catalog";
import type { ApplicationRegistryScenario } from "@/types/application-registry-catalog";

describe("Program 4 P4.2 Application Registry and Catalog", () => {
  it("publishes registry doctrine without deployment, execution, certification, or runtime governance authority", () => {
    const bundle = getApplicationRegistryCatalogBundle();

    expect(bundle.doctrine.version).toBe("application-registry-catalog/v4.2");
    expect(bundle.doctrine.owns_application_registry).toBe(true);
    expect(bundle.doctrine.owns_application_metadata).toBe(true);
    expect(bundle.doctrine.owns_application_discovery).toBe(true);
    expect(bundle.doctrine.owns_application_lineage).toBe(true);
    expect(bundle.doctrine.owns_catalog_governance).toBe(true);
    expect(bundle.doctrine.authoritative_identity_registry).toBe(true);
    expect(bundle.doctrine.deploys_applications).toBe(false);
    expect(bundle.doctrine.executes_applications).toBe(false);
    expect(bundle.doctrine.certifies_applications).toBe(false);
    expect(bundle.doctrine.governs_runtime_behavior).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("operates as the deterministic authoritative application registry and catalog", () => {
    const first = runApplicationRegistryCatalog();
    const second = runApplicationRegistryCatalog();

    expect(first.application_foundation_ref).toBe("application-constitutional-foundation/v4.1");
    expect(first.registry.authoritative).toBe(true);
    expect(first.registry.records).toHaveLength(1);
    expect(first.registry.records[0]?.application_id).toBe("civitas.app.ops.command-console");
    expect(first.registry.records[0]?.immutable_identity).toBe(true);
    expect(first.catalog.published).toBe(true);
    expect(first.discovery_index.deterministic_ordering).toBe(true);
    expect(first.discovery_index.duplicate_free).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationRegistryCatalog(first).valid).toBe(true);
    expect(replayApplicationRegistryCatalog(first)).toBe(true);
  });

  it("enforces metadata governance, P4.1 ownership resolution, append-only lineage, and audit evidence", () => {
    const result = runApplicationRegistryCatalog();

    expect(result.metadata_repository.metadata_validated).toBe(true);
    expect(result.metadata_repository.ownership_metadata_resolved).toBe(true);
    expect(result.governance.ownership_refs_resolve_to_p4_1).toBe(true);
    expect(result.governance.aliases_permanently_resolvable).toBe(true);
    expect(result.governance.duplicate_registrations_rejected).toBe(true);
    expect(result.lineage.append_only).toBe(true);
    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.immutable).toBe(true);
    expect(result.audit_evidence.complete).toBe(true);
    expect(result.audit_evidence.immutable).toBe(true);
    expect(result.certification.phase_ready).toBe(true);
  });

  it.each([
    "P4_1_FOUNDATION_INVALID",
    "CCI_REGISTRY_SERVICES_UNAVAILABLE",
    "CCI_IDENTITY_SERVICES_UNAVAILABLE",
    "CCI_STORAGE_SERVICES_UNAVAILABLE",
    "CCI_EVIDENCE_SERVICES_UNAVAILABLE",
    "CCI_AUDIT_SERVICES_UNAVAILABLE",
    "APPLICATION_NOT_REGISTERED_BEFORE_PUBLICATION",
    "APPLICATION_IDENTITY_MUTATED",
    "HISTORICAL_ALIAS_UNRESOLVABLE",
    "METADATA_UNVALIDATED",
    "UNAUTHORIZED_METADATA_CHANGE_ALLOWED",
    "LINEAGE_NOT_APPEND_ONLY",
    "LINEAGE_INCOMPLETE",
    "OWNERSHIP_REFERENCE_UNRESOLVED",
    "DISCOVERY_DUPLICATES_RETURNED",
    "DISCOVERY_NON_DETERMINISTIC",
    "INVALID_REGISTRATION_ACCEPTED",
    "AUDIT_EVIDENCE_MISSING",
    "AUDIT_EVIDENCE_MUTABLE",
    "DUPLICATE_REGISTRATION_ALLOWED",
    "CATALOG_PUBLICATION_UNGOVERNED",
    "DEPLOYMENT_ATTEMPTED",
    "RUNTIME_EXECUTION_ATTEMPTED",
    "PLATFORM_CERTIFICATION_ATTEMPTED",
    "RUNTIME_GOVERNANCE_ATTEMPTED",
  ] as const)("fails registry catalog certification for %s", (scenario: ApplicationRegistryScenario) => {
    const result = runApplicationRegistryCatalog({ scenario });
    const validation = validateApplicationRegistryCatalog(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runApplicationRegistryCatalog({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
