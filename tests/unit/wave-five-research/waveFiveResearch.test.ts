import { describe, expect, it } from "vitest";

import { getWaveFiveResearchBundle, replayWaveFiveResearch, runWaveFiveResearch, validateWaveFiveResearch } from "@/services/wave-five-research";
import type { WaveFiveResearchFailure } from "@/types/wave-five-research";

const conditionalFailures = ["RESEARCH_REGISTRY_MISSING", "RESEARCH_METADATA_INVALID", "RESEARCH_RELATIONSHIPS_INVALID", "RESEARCH_VERSION_HISTORY_INCOMPLETE", "SOURCE_GOVERNANCE_MISSING", "SOURCES_UNCLASSIFIED", "DUPLICATES_UNRESOLVED", "SOURCE_GOVERNANCE_NONOPERATIONAL", "EVIDENCE_COLLECTION_MISSING", "EVIDENCE_VALIDATION_INCOMPLETE", "EVIDENCE_STORAGE_MISSING", "EVIDENCE_MATRIX_MISSING", "COVERAGE_NOT_MEASURABLE", "CITATION_MANAGER_MISSING", "BIBLIOGRAPHY_GENERATION_MISSING", "REFERENCES_NOT_REUSABLE", "RESEARCH_NOTEBOOK_MISSING", "NOTES_NOT_VERSIONED", "ANNOTATIONS_UNLINKED", "NOTEBOOK_NOT_SEARCHABLE", "SYNTHESIS_ENGINE_MISSING", "SYNTHESIS_CONFIDENCE_MISSING", "COLLABORATION_MISSING", "REVIEWS_NOT_TRACKED", "SEARCH_RETRIEVAL_MISSING", "SEARCH_RESULTS_NOT_EXPLAINABLE", "RETRIEVAL_PERFORMANCE_INVALID", "RESEARCH_GOVERNANCE_MISSING"] as const satisfies readonly WaveFiveResearchFailure[];
const notQualifiedFailures = ["W5_FINANCE_INVALID", "W5_HEALTH_INVALID", "EVIDENCE_PROVENANCE_MISSING", "CLAIMS_UNMAPPED", "SUPPORTING_EVIDENCE_UNLINKED", "CITATIONS_INVALID", "SYNTHESIS_NONDETERMINISTIC", "SYNTHESIS_NOT_EVIDENCE_BACKED", "UNSUPPORTED_AUTHORITATIVE_CONCLUSION", "COLLABORATION_HISTORY_MUTABLE", "SEARCH_NONDETERMINISTIC", "POLICIES_NOT_ENFORCED", "AUDIT_INCOMPLETE", "COMPLIANCE_INVALID", "PROVENANCE_LINEAGE_INCOMPLETE", "REPLAY_DIVERGED", "RESEARCH_DECISION_AUTHORITY_BYPASS", "HEALTH_DIAGNOSIS_RESEARCH_OUTPUT", "FINANCIAL_ACTION_RESEARCH_OUTPUT", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveResearchFailure[];

describe("Wave 5.9 Research", () => {
  it("publishes the research doctrine", () => {
    const bundle = getWaveFiveResearchBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-research/w5.9", research_is_evidence_based: true, provenance_required: true, deterministic_synthesis_required: true, research_does_not_make_decisions: true, explainability_required: true, unsupported_authority_prohibited: true, qualification_gate: "W5.9 Research Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Health and Finance integrations", () => {
    const first = runWaveFiveResearch({ seed: "deterministic" });
    const second = runWaveFiveResearch({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-health/w5.8", "wave-five-finance/w5.7", "wave-five-tasks-commitments/w5.5", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2"]);
    expect(first.provides).toEqual(["research-registry", "source-governance-service", "evidence-repository", "evidence-matrix", "citation-manager", "research-notebook", "synthesis-engine", "research-collaboration", "research-search-engine", "research-governance"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveResearch(first).valid).toBe(true);
    expect(replayWaveFiveResearch()).toBe(true);
  });

  it("operates research registry, source governance, and evidence collection", () => {
    const result = runWaveFiveResearch();

    expect(result.registry).toMatchObject({ research_project_registry: true, research_topics: true, research_collections: true, research_categories: true, research_metadata: true, research_status: true, research_ownership: true, research_relationships: true, research_tags: true, research_versioning: true, operational: true, metadata_validated: true, relationships_operational: true, version_history_complete: true });
    expect(result.source_governance).toMatchObject({ source_registry: true, source_classification: true, source_trust_ratings: true, source_metadata: true, source_validation: true, source_freshness: true, source_version_tracking: true, duplicate_detection: true, sources_classified: true, duplicates_resolved: true, operational: true });
    expect(result.evidence).toMatchObject({ evidence_collection: true, evidence_normalization: true, evidence_metadata: true, evidence_provenance: true, evidence_validation: true, evidence_linking: true, evidence_storage: true, evidence_refresh: true, stored: true, provenance_preserved: true, validation_complete: true, lineage_complete: true });
    expect(runWaveFiveResearch({ scenario: "EVIDENCE_PROVENANCE_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("maps claims through evidence matrices and validated citations", () => {
    const result = runWaveFiveResearch();

    expect(result.matrix).toMatchObject({ claim_registry: true, supporting_evidence: true, contradictory_evidence: true, evidence_weighting: true, evidence_confidence: true, evidence_coverage: true, gap_analysis: true, evidence_relationships: true, claims_mapped: true, supporting_evidence_linked: true, coverage_measurable: true });
    expect(result.citation_notebook).toMatchObject({ citation_registry: true, citation_formatting: true, reference_library: true, citation_relationships: true, duplicate_detection: true, bibliography_generation: true, citation_validation: true, persistent_citation_ids: true, research_notes: true, observations: true, annotations: true, highlights: true, bookmarks: true, idea_capture: true, notebook_organization: true, notebook_versioning: true, cross_references: true, citations_validated: true, references_reusable: true, notes_versioned: true, annotations_linked: true, notebook_searchable: true });
    expect(runWaveFiveResearch({ scenario: "CLAIMS_UNMAPPED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveResearch({ scenario: "CITATIONS_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("generates deterministic advisory synthesis without decision authority", () => {
    const result = runWaveFiveResearch();

    expect(result.synthesis).toMatchObject({ finding_extraction: true, theme_identification: true, cross_source_comparison: true, conflict_resolution: true, summary_generation: true, research_narratives: true, insight_generation: true, confidence_scoring: true, recommendation_drafting: true, reproducible: true, evidence_linked: true, confidence_calculated: true, explainable: true, advisory_only: true, no_authoritative_unsupported_conclusions: true, no_decision_authority: true, no_health_diagnosis: true, no_financial_action: true });
    expect(runWaveFiveResearch({ scenario: "SYNTHESIS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveResearch({ scenario: "UNSUPPORTED_AUTHORITATIVE_CONCLUSION" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveResearch({ scenario: "RESEARCH_DECISION_AUTHORITY_BYPASS" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveResearch({ scenario: "HEALTH_DIAGNOSIS_RESEARCH_OUTPUT" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveResearch({ scenario: "FINANCIAL_ACTION_RESEARCH_OUTPUT" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("governs collaboration, search, compliance, and readiness", () => {
    const result = runWaveFiveResearch();

    expect(result.collaboration_search_governance).toMatchObject({ shared_research: true, review_workflow: true, comment_threads: true, research_assignments: true, approval_workflow: true, merge_support: true, conflict_detection: true, review_history: true, semantic_search: true, keyword_search: true, topic_search: true, citation_search: true, evidence_search: true, notebook_search: true, similarity_search: true, saved_searches: true, research_policies: true, evidence_requirements: true, citation_policies: true, retention_rules: true, access_controls: true, audit_trail: true, research_certification: true, compliance_monitoring: true, collaboration_operational: true, reviews_tracked: true, history_immutable: true, search_deterministic: true, results_explainable: true, policies_enforced: true, audit_complete: true, compliance_validated: true, tenant_isolation: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, research_registry_operational: true, evidence_matrix_claims_linked: true, citations_validated_reusable: true, notebook_versioned_structured: true, synthesis_deterministic_evidence_backed: true, provenance_lineage_preserved: true, governance_policies_enforced: true, integrations_validated: true, conclusions_explainable: true, advisory_outputs_only: true, replay_reproducible: true });
    expect(runWaveFiveResearch({ scenario: "SEARCH_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveResearch({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveResearch({ scenario: failure });
    const validation = validateWaveFiveResearch(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveResearch({ scenario: failure });
    const validation = validateWaveFiveResearch(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveResearch({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveResearch({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveResearch({ scenario: "RESEARCH_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveResearch(notQualified).valid).toBe(false);
  });
});
