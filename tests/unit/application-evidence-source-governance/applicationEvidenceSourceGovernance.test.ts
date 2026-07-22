import { describe, expect, it } from "vitest";
import {
  getApplicationEvidenceSourceGovernanceBundle,
  replayApplicationEvidenceSourceGovernance,
  runApplicationEvidenceSourceGovernance,
  validateApplicationEvidenceSourceGovernance,
} from "@/services/application-evidence-source-governance";
import type { ApplicationEvidenceScenario } from "@/types/application-evidence-source-governance";

describe("Program 4 P4.7 Data, Evidence and Source Governance", () => {
  it("publishes evidence doctrine while preserving CCI as the canonical evidence owner", () => {
    const bundle = getApplicationEvidenceSourceGovernanceBundle();

    expect(bundle.doctrine.version).toBe("application-evidence-source-governance/v4.7");
    expect(bundle.doctrine.owns_application_evidence_indexes).toBe(true);
    expect(bundle.doctrine.owns_application_evidence_references).toBe(true);
    expect(bundle.doctrine.owns_provenance_views).toBe(true);
    expect(bundle.doctrine.owns_source_governance).toBe(true);
    expect(bundle.doctrine.owns_canonical_evidence_storage).toBe(false);
    expect(bundle.doctrine.owns_immutable_evidence_records).toBe(false);
    expect(bundle.doctrine.owns_evidence_lineage).toBe(false);
    expect(bundle.doctrine.owns_replay_evidence).toBe(false);
    expect(bundle.doctrine.owns_forensic_records).toBe(false);
    expect(bundle.doctrine.owns_integrity_verification).toBe(false);
    expect(bundle.doctrine.becomes_evidence_system_of_record).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic application evidence indexes and projections over CCI evidence", () => {
    const first = runApplicationEvidenceSourceGovernance();
    const second = runApplicationEvidenceSourceGovernance();

    expect(first.application_interface_registry_ref).toBe("application-integration-framework/v4.6");
    expect(first.boundary.cci_canonical_owner).toBe(true);
    expect(first.boundary.p4_owns_indexes_only).toBe(true);
    expect(first.evidence_index.operational).toBe(true);
    expect(first.evidence_index.deterministic).toBe(true);
    expect(first.evidence_index.duplicates_evidence).toBe(false);
    expect(first.evidence_views.every((view) => view.projection_only)).toBe(true);
    expect(first.certification.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationEvidenceSourceGovernance(first).valid).toBe(true);
    expect(replayApplicationEvidenceSourceGovernance(first)).toBe(true);
  });

  it("enforces source governance, provenance, discovery, governance synchronization, and qualification evidence", () => {
    const result = runApplicationEvidenceSourceGovernance();

    expect(result.reference_catalog.references_validated).toBe(true);
    expect(result.reference_catalog.broken_references_prevented).toBe(true);
    expect(result.source_registry.registered).toBe(true);
    expect(result.source_governance.unauthorized_sources_rejected).toBe(true);
    expect(result.provenance_view.complete).toBe(true);
    expect(result.provenance_view.deterministic).toBe(true);
    expect(result.discovery.deterministic).toBe(true);
    expect(result.discovery.search_validated).toBe(true);
    expect(result.governance_integration.governance_synchronized).toBe(true);
    expect(result.governance_integration.ownership_preserved).toBe(true);
    expect(result.qualification.phase_ready).toBe(true);
  });

  it.each([
    "P4_2_REGISTRY_INVALID",
    "P4_3_CAPABILITY_MAP_INVALID",
    "P4_5_CERTIFICATION_INVALID",
    "P4_6_INTERFACE_REGISTRY_INVALID",
    "CCI_CANONICAL_EVIDENCE_SERVICES_INVALID",
    "CCI_EVIDENCE_REGISTRY_INVALID",
    "CCI_EVIDENCE_LINEAGE_INVALID",
    "CCI_REPLAY_EVIDENCE_INVALID",
    "CCI_INTEGRITY_SERVICES_INVALID",
    "EVIDENCE_BOUNDARY_NOT_DEFINED",
    "CANONICAL_EVIDENCE_STORED_BY_P4",
    "EVIDENCE_LINEAGE_MODIFIED",
    "FORENSIC_RECORD_ALTERED",
    "REPLAY_EVIDENCE_REWRITTEN",
    "INTEGRITY_RECORD_REPLACED",
    "IMMUTABLE_EVIDENCE_DUPLICATED",
    "P4_BECAME_EVIDENCE_SYSTEM_OF_RECORD",
    "EVIDENCE_INDEX_NOT_OPERATIONAL",
    "EVIDENCE_INDEX_NON_DETERMINISTIC",
    "EVIDENCE_REFERENCE_INVALID",
    "BROKEN_REFERENCE_ALLOWED",
    "REFERENCE_LINEAGE_NOT_PRESERVED",
    "SOURCE_NOT_REGISTERED",
    "SOURCE_OWNERSHIP_UNVERIFIED",
    "SOURCE_GOVERNANCE_NOT_ENFORCED",
    "UNAUTHORIZED_SOURCE_ACCEPTED",
    "SOURCE_LIFECYCLE_NOT_ENFORCED",
    "PROVENANCE_INCOMPLETE",
    "PROVENANCE_NON_DETERMINISTIC",
    "EVIDENCE_VIEW_DUPLICATES_RECORDS",
    "EVIDENCE_VIEW_NOT_SYNCHRONIZED",
    "DISCOVERY_NON_DETERMINISTIC",
    "SEARCH_VALIDATION_FAILED",
    "GOVERNANCE_NOT_SYNCHRONIZED_WITH_CCI",
    "OWNERSHIP_BOUNDARY_NOT_PRESERVED",
    "QUALIFICATION_REPORT_MISSING",
    "VALIDATION_EVIDENCE_MISSING",
  ] as const)("fails evidence governance certification for %s", (scenario: ApplicationEvidenceScenario) => {
    const result = runApplicationEvidenceSourceGovernance({ scenario });
    const validation = validateApplicationEvidenceSourceGovernance(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  }, 300000);

  it("supports pruned certification outcomes", () => {
    const result = runApplicationEvidenceSourceGovernance({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
