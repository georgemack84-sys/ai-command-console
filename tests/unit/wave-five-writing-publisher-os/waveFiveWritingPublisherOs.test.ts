import { describe, expect, it } from "vitest";

import { getWaveFiveWritingPublisherBundle, replayWaveFiveWritingPublisher, runWaveFiveWritingPublisher, validateWaveFiveWritingPublisher } from "@/services/wave-five-writing-publisher-os";
import type { WaveFiveWritingPublisherFailure } from "@/types/wave-five-writing-publisher-os";

const conditionalFailures = ["WRITING_WORKSPACE_MISSING", "STRUCTURED_AUTHORING_MISSING", "TEMPLATE_SUPPORT_MISSING", "AUTHOR_DASHBOARD_MISSING", "EDITORIAL_WORKFLOW_MISSING", "REVIEW_EVIDENCE_MISSING", "PUBLICATION_REGISTRY_MISSING", "PUBLICATION_METADATA_INVALID", "PUBLICATION_RELATIONSHIPS_INVALID", "PUBLICATION_REGISTRY_UNVERSIONED", "PUBLISHER_OS_MISSING", "RENDERING_PIPELINE_MISSING", "EXPORT_SERVICES_MISSING", "DISTRIBUTION_PLANNING_MISSING", "DISTRIBUTION_PLANS_INVALID", "DISTRIBUTION_HISTORY_MISSING", "AI_WRITING_GOVERNANCE_MISSING", "DOCUMENT_VERSIONING_MISSING", "DIFF_ENGINE_MISSING", "ASSET_MANAGEMENT_MISSING", "ASSET_RELATIONSHIPS_INVALID", "CITATION_EVIDENCE_MISSING", "PUBLISHING_GOVERNANCE_MISSING"] as const satisfies readonly WaveFiveWritingPublisherFailure[];
const notQualifiedFailures = ["W5_RESEARCH_INVALID", "EDITORIAL_WORKFLOW_NONDETERMINISTIC", "APPROVAL_ROUTING_MISSING", "PUBLISHING_AUTOMATION_UNGOVERNED", "AI_CONTRIBUTION_UNTRACKED", "AI_PUBLISHED_INDEPENDENTLY", "HUMAN_APPROVAL_MISSING", "VERSION_HISTORY_MUTABLE", "VERSION_REPLAY_DIVERGED", "ASSET_LINEAGE_INCOMPLETE", "CITATIONS_INVALID", "PUBLICATION_PROVENANCE_INCOMPLETE", "PUBLISHING_PERMISSION_BYPASS", "SENSITIVE_CONTENT_RESTRICTIONS_MISSING", "PUBLICATION_AUDIT_INCOMPLETE", "PUBLICATION_EVIDENCE_MUTABLE", "PUBLICATION_REPLAY_DIVERGED", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveWritingPublisherFailure[];

describe("Wave 5.10 Writing and Publisher OS", () => {
  it("publishes the Writing and Publisher OS doctrine", () => {
    const bundle = getWaveFiveWritingPublisherBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-writing-publisher-os/w5.10", human_publication_authority_required: true, ai_independent_publication_prohibited: true, provenance_authorship_lineage_required: true, deterministic_editorial_workflow_required: true, publication_evidence_required: true, replay_required: true, qualification_gate: "W5.10 Writing and Publisher OS Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Research", () => {
    const first = runWaveFiveWritingPublisher({ seed: "deterministic" });
    const second = runWaveFiveWritingPublisher({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-research/w5.9", "wave-five-health/w5.8", "wave-five-tasks-commitments/w5.5", "wave-five-personal-knowledge/w5.3", "wave-five-application-platform/w5.1"]);
    expect(first.provides).toEqual(["writing-workspace-apis", "editorial-apis", "publication-apis", "distribution-apis", "publishing-events", "version-history", "citation-records", "publication-evidence"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveWritingPublisher(first).valid).toBe(true);
    expect(replayWaveFiveWritingPublisher()).toBe(true);
  });

  it("operates writing workspace, deterministic editorial workflow, and publication registry", () => {
    const result = runWaveFiveWritingPublisher();

    expect(result.workspace).toMatchObject({ rich_text_editor: true, markdown_editor: true, structured_document_editor: true, specification_editor: true, notebook_editor: true, research_writing: true, book_authoring: true, technical_documentation: true, policy_writing: true, mission_documentation: true, ai_writing_assistance: true, citation_support: true, version_comparison: true, autosave: true, templates: true, operational: true });
    expect(result.editorial.states).toEqual(["Draft", "In Review", "Revision Required", "Approved", "Scheduled", "Published", "Archived"]);
    expect(result.editorial).toMatchObject({ draft_lifecycle: true, review_workflow: true, approval_routing: true, publishing_approvals: true, editorial_governance: true, review_evidence: true, deterministic: true, evidence_preserved: true });
    expect(result.registry).toMatchObject({ publications: true, articles: true, books: true, specifications: true, policies: true, procedures: true, reports: true, blogs: true, research_papers: true, documentation: true, authors: true, contributors: true, versioning: true, review_history: true, approval_history: true, operational: true, metadata_validated: true });
    expect(runWaveFiveWritingPublisher({ scenario: "EDITORIAL_WORKFLOW_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("qualifies Publisher OS and distribution planning", () => {
    const result = runWaveFiveWritingPublisher();

    expect(result.publisher_os).toMatchObject({ publication_scheduling: true, release_planning: true, publication_automation: true, template_engine: true, metadata_management: true, asset_management: true, publication_packaging: true, rendering_pipeline: true, export_services: true, publishing_governance: true, html: true, markdown: true, pdf: true, docx: true, epub: true, json: true, static_websites: true, governed_automation: true });
    expect(result.distribution).toMatchObject({ distribution_plans: true, publication_schedules: true, audience_targeting: true, channel_planning: true, release_calendars: true, publishing_campaigns: true, distribution_dependencies: true, notification_planning: true, internal_knowledge_base: true, mission_control: true, documentation_portal: true, publisher_website: true, apis: true, pdf_exports: true, books: true, external_websites: true, validated: true, history_preserved: true });
    expect(runWaveFiveWritingPublisher({ scenario: "PUBLISHING_AUTOMATION_UNGOVERNED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("tracks AI contributions and immutable document version history", () => {
    const result = runWaveFiveWritingPublisher();

    expect(result.ai_version_assets).toMatchObject({ draft_generation: true, rewrite_assistance: true, summarization: true, style_improvement: true, translation: true, outline_generation: true, research_synthesis: true, citation_suggestions: true, grammar_assistance: true, consistency_validation: true, human_approval_required: true, ai_contribution_tracked: true, ai_never_independently_publishes: true, version_graph: true, revision_history: true, difference_engine: true, merge_support: true, publication_lineage: true, asset_registry: true, asset_library: true, asset_relationships: true, immutable_history: true, replayable_versions: true });
    expect(runWaveFiveWritingPublisher({ scenario: "AI_PUBLISHED_INDEPENDENTLY" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveWritingPublisher({ scenario: "HUMAN_APPROVAL_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveWritingPublisher({ scenario: "VERSION_HISTORY_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("enforces citation, evidence, provenance, governance, and replay", () => {
    const result = runWaveFiveWritingPublisher();

    expect(result.evidence_governance).toMatchObject({ citation_registry: true, source_linking: true, evidence_references: true, bibliography_generation: true, citation_validation: true, provenance_tracking: true, publishing_permissions: true, editorial_authority: true, approval_policies: true, classification_rules: true, sensitive_content_restrictions: true, publication_audits: true, distribution_governance: true, authorship_preserved: true, approval_evidence_preserved: true, publication_evidence_immutable: true, deterministic_evidence: true, tenant_isolation: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, writing_workspace_operational: true, ai_assistance_governed: true, editorial_workflow_deterministic: true, publication_registry_operational: true, publisher_os_functional: true, distribution_planning_validated: true, publication_lineage_immutable: true, version_history_replayable: true, citation_evidence_complete: true, human_approval_enforced: true, publishing_governance_validated: true, deterministic_publication_evidence: true, replay_identical_publication_history: true });
    expect(runWaveFiveWritingPublisher({ scenario: "CITATIONS_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveWritingPublisher({ scenario: "PUBLICATION_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveWritingPublisher({ scenario: "PUBLICATION_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveWritingPublisher({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveWritingPublisher({ scenario: failure });
    const validation = validateWaveFiveWritingPublisher(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveWritingPublisher({ scenario: failure });
    const validation = validateWaveFiveWritingPublisher(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveWritingPublisher({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveWritingPublisher({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveWritingPublisher({ scenario: "WRITING_PUBLISHER_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveWritingPublisher(notQualified).valid).toBe(false);
  });
});
