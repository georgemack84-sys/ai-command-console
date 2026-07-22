import { describe, expect, it } from "vitest";

import { getWaveFiveUnifiedPersonalContextBundle, replayWaveFiveUnifiedPersonalContext, runWaveFiveUnifiedPersonalContext, validateWaveFiveUnifiedPersonalContext } from "@/services/wave-five-unified-personal-context";
import type { WaveFiveUnifiedPersonalContextFailure } from "@/types/wave-five-unified-personal-context";

const conditionalFailures = ["CONTEXT_REGISTRY_MISSING", "CONTEXT_METADATA_INVALID", "CONTEXT_VERSION_LINEAGE_INCOMPLETE", "CONTEXT_OWNERSHIP_MISSING", "CONTEXT_GRAPH_MISSING", "RELATIONSHIP_GOVERNANCE_MISSING", "TIMELINE_MISSING", "TIMELINE_EVIDENCE_MISSING", "SOURCE_REGISTRY_MISSING", "SOURCE_TRUST_MISSING", "SOURCE_POLICIES_MISSING", "RESOLUTION_RULES_MISSING", "SOURCE_PRIORITY_MISSING", "CONFIDENCE_EVALUATION_MISSING", "RESOLUTION_EVIDENCE_MISSING", "API_CONTRACTS_UNVERSIONED", "OBSERVABILITY_MISSING", "SECURITY_CONTROLS_MISSING"] as const satisfies readonly WaveFiveUnifiedPersonalContextFailure[];
const notQualifiedFailures = ["W5_APPLICATION_PLATFORM_INVALID", "CONTEXT_IDENTITIES_NONDETERMINISTIC", "GRAPH_RELATIONSHIPS_NONDETERMINISTIC", "GRAPH_INTEGRITY_INVALID", "GRAPH_TRAVERSAL_NONDETERMINISTIC", "TIMELINE_MUTABLE", "HISTORICAL_RECONSTRUCTION_FAILED", "CONTEXT_REPLAY_DIVERGED", "SOURCES_UNCERTIFIED", "SOURCE_LINEAGE_INCOMPLETE", "SOURCE_GOVERNANCE_NONDETERMINISTIC", "CONFLICTS_UNRESOLVED", "RESOLUTION_NONDETERMINISTIC", "CONTEXT_APIS_UNSTABLE", "AUTHORIZATION_NOT_ENFORCED", "TENANT_ISOLATION_BREACH", "SDK_NOT_QUALIFIED", "IDENTITY_BINDING_MISSING", "EXPLAINABILITY_MISSING", "EVIDENCE_LINEAGE_INCOMPLETE", "TRUST_INTEGRATION_MISSING", "AUTHORITATIVE_PERSONALIZATION_NOT_DECLARED"] as const satisfies readonly WaveFiveUnifiedPersonalContextFailure[];

describe("Wave 5.2 Unified Personal Context", () => {
  it("publishes the unified personal context doctrine", () => {
    const bundle = getWaveFiveUnifiedPersonalContextBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-unified-personal-context/w5.2", single_source_of_context: true, source_provenance_required: true, time_aware_context_required: true, deterministic_resolution_required: true, tenant_isolation_required: true, explainability_required: true, qualification_gate: "W5.2 Unified Personal Context Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the Wave 5 application platform", () => {
    const first = runWaveFiveUnifiedPersonalContext({ seed: "deterministic" });
    const second = runWaveFiveUnifiedPersonalContext({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-application-platform/w5.1", "wave-five-application-portfolio-foundation/w5.0"]);
    expect(first.enables).toEqual(["personalized-application-experiences", "cross-application-personalization", "intelligent-recommendations", "user-preferences", "activity-history", "personal-knowledge", "adaptive-workflows", "context-aware-search", "context-aware-notifications", "digital-personal-assistants"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveUnifiedPersonalContext(first).valid).toBe(true);
    expect(replayWaveFiveUnifiedPersonalContext()).toBe(true);
  });

  it("registers authoritative context with deterministic identities and complete version lineage", () => {
    const result = runWaveFiveUnifiedPersonalContext();

    expect(result.registry).toMatchObject({ context_identity_model: true, context_registry: true, context_classification: true, context_metadata: true, context_ownership: true, context_versioning: true, context_lifecycle: true, context_evidence_references: true, deterministic_identities: true, authoritative: true, metadata_validated: true, version_lineage_complete: true });
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "CONTEXT_IDENTITIES_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("validates deterministic graph relationships and immutable time-aware history", () => {
    const result = runWaveFiveUnifiedPersonalContext();

    expect(result.graph).toMatchObject({ context_nodes: true, context_relationships: true, identity_relationships: true, preference_relationships: true, behavioral_relationships: true, organizational_relationships: true, device_relationships: true, graph_traversal: true, relationship_governance: true, relationships_deterministic: true, graph_integrity_validated: true, traversal_deterministic: true });
    expect(result.timeline).toMatchObject({ context_events: true, timeline_entries: true, temporal_versioning: true, historical_reconstruction: true, context_snapshots: true, replay_support: true, time_navigation: true, timeline_evidence: true, immutable: true, reconstruction_verified: true, replay_deterministic: true });
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "GRAPH_TRAVERSAL_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "TIMELINE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("governs sources and resolves conflicts into a single authoritative context value", () => {
    const result = runWaveFiveUnifiedPersonalContext();

    expect(result.source_governance).toMatchObject({ source_registry: true, source_authority: true, source_trust: true, source_priority: true, source_certification: true, source_validation: true, source_health: true, source_policies: true, sources_certified: true, lineage_complete: true, governance_deterministic: true });
    expect(result.resolution).toMatchObject({ resolution_rules: true, conflict_detection: true, authority_resolution: true, source_prioritization: true, confidence_evaluation: true, context_composition: true, resolution_evidence: true, resolution_replay: true, single_authoritative_value: true, deterministic: true, conflicts_resolved_consistently: true, replay_validated: true });
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "SOURCES_UNCERTIFIED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "CONFLICTS_UNRESOLVED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "RESOLUTION_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("exposes governed APIs and preserves tenant isolation", () => {
    const result = runWaveFiveUnifiedPersonalContext();

    expect(result.apis).toMatchObject({ context_query_apis: true, graph_apis: true, timeline_apis: true, search_apis: true, subscription_apis: true, authorization_enforcement: true, tenant_isolation: true, sdk_contracts: true, stable: true, sdk_qualified: true, integration_contracts_versioned: true });
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "AUTHORIZATION_NOT_ENFORCED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "SDK_NOT_QUALIFIED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("keeps every context fact identity-bound, explainable, replayable, and trust integrated", () => {
    const result = runWaveFiveUnifiedPersonalContext();

    expect(result.evidence_trust).toMatchObject({ identity_bound: true, source_governed: true, tenant_isolated: true, time_aware: true, replayable: true, explainable: true, constitutionally_governed: true, evidence_packages: true, lineage: true, source_references: true, resolution_history: true, trust_integration: true, observability: true, security_controls: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, every_context_item_registered: true, graph_relationships_deterministic: true, historical_timeline_immutable: true, source_governance_operational: true, conflicts_resolve_deterministically: true, governed_api_access: true, evidence_lineage_complete: true, replay_identical_context_state: true, tenant_isolation_verified: true, trust_integration_operational: true, sdks_qualified: true, authoritative_personalization_platform: true });
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "IDENTITY_BINDING_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "EXPLAINABILITY_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveUnifiedPersonalContext({ scenario: "TRUST_INTEGRATION_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveUnifiedPersonalContext({ scenario: failure });
    const validation = validateWaveFiveUnifiedPersonalContext(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveUnifiedPersonalContext({ scenario: failure });
    const validation = validateWaveFiveUnifiedPersonalContext(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveUnifiedPersonalContext({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveUnifiedPersonalContext({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveUnifiedPersonalContext({ scenario: "UNIFIED_CONTEXT_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveUnifiedPersonalContext(notQualified).valid).toBe(false);
  });
});
