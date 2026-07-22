import { describe, expect, it } from "vitest";

import { getWaveFivePersonalKnowledgeBundle, replayWaveFivePersonalKnowledge, runWaveFivePersonalKnowledge, validateWaveFivePersonalKnowledge } from "@/services/wave-five-personal-knowledge";
import type { WaveFivePersonalKnowledgeFailure } from "@/types/wave-five-personal-knowledge";

const conditionalFailures = ["KNOWLEDGE_REGISTRY_MISSING", "KNOWLEDGE_METADATA_INVALID", "KNOWLEDGE_CLASSIFICATION_MISSING", "KNOWLEDGE_GRAPH_MISSING", "SEMANTIC_LINKS_MISSING", "RETRIEVAL_ENGINE_MISSING", "CONFIDENCE_AWARE_RETRIEVAL_MISSING", "QUERY_PLANNING_MISSING", "RELIABILITY_SCORING_MISSING", "EVIDENCE_FRESHNESS_MISSING", "TRUST_INDICATORS_MISSING", "RELIABILITY_HISTORY_MISSING", "REVIEW_QUEUE_MISSING", "CONTEXT_SYNC_MISSING", "EVIDENCE_LEDGER_MISSING"] as const satisfies readonly WaveFivePersonalKnowledgeFailure[];
const notQualifiedFailures = ["W5_UNIFIED_CONTEXT_INVALID", "KNOWLEDGE_OBJECTS_UNREGISTERED", "KNOWLEDGE_IDENTITY_NONDETERMINISTIC", "KNOWLEDGE_LINEAGE_INCOMPLETE", "GRAPH_RELATIONSHIPS_INVALID", "GRAPH_TRAVERSAL_NONDETERMINISTIC", "GRAPH_INTEGRITY_INVALID", "CONTEXT_REFERENCES_MISSING", "RETRIEVAL_NONDETERMINISTIC", "RETRIEVAL_NOT_EXPLAINABLE", "PROVENANCE_AWARE_RETRIEVAL_MISSING", "RELIABILITY_NOT_CONTINUOUS", "CONFLICT_DETECTION_MISSING", "LOW_CONFIDENCE_NOT_QUEUED", "HUMAN_REVIEW_MISSING", "REVIEW_DECISIONS_NOT_RECORDED", "REVIEW_LINEAGE_MUTABLE", "REVIEW_REPLAY_DIVERGED", "CONTEXT_SYNC_INVALID", "COMPLETE_PROVENANCE_MISSING", "REPLAY_RETRIEVAL_DIVERGED", "REPLAY_REVIEW_DIVERGED"] as const satisfies readonly WaveFivePersonalKnowledgeFailure[];

describe("Wave 5.3 Personal Knowledge", () => {
  it("publishes the personal knowledge doctrine", () => {
    const bundle = getWaveFivePersonalKnowledgeBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-personal-knowledge/w5.3", knowledge_above_context: true, complete_provenance_required: true, deterministic_retrieval_required: true, reliability_review_required: true, unified_context_synchronization_required: true, replay_required: true, qualification_gate: "W5.3 Personal Knowledge Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the unified personal context platform", () => {
    const first = runWaveFivePersonalKnowledge({ seed: "deterministic" });
    const second = runWaveFivePersonalKnowledge({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-unified-personal-context/w5.2", "wave-five-application-platform/w5.1", "wave-five-application-portfolio-foundation/w5.0"]);
    expect(first.enables).toEqual(["w5.4-personal-intelligence", "w5.5-recommendations-decision-support", "w5.6-automation-workflow-intelligence", "w5.7-adaptive-experiences"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFivePersonalKnowledge(first).valid).toBe(true);
    expect(replayWaveFivePersonalKnowledge()).toBe(true);
  });

  it("registers every knowledge object with complete lineage", () => {
    const result = runWaveFivePersonalKnowledge();

    expect(result.registry).toMatchObject({ knowledge_identity: true, knowledge_types: true, knowledge_metadata: true, knowledge_ownership: true, knowledge_lifecycle: true, knowledge_versioning: true, knowledge_lineage: true, knowledge_classification: true, every_object_registered: true, identities_deterministic: true, metadata_validated: true, lineage_complete: true });
    expect(runWaveFivePersonalKnowledge({ scenario: "KNOWLEDGE_OBJECTS_UNREGISTERED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "KNOWLEDGE_LINEAGE_INCOMPLETE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("validates the semantic knowledge graph and context references", () => {
    const result = runWaveFivePersonalKnowledge();

    expect(result.graph).toMatchObject({ entity_relationships: true, semantic_links: true, temporal_relationships: true, causal_relationships: true, behavioral_relationships: true, preference_relationships: true, goal_relationships: true, context_references: true, graph_traversal: true, dependency_discovery: true, relationship_validation: true, semantic_expansion: true, graph_integrity_verified: true, traversal_deterministic: true });
    expect(runWaveFivePersonalKnowledge({ scenario: "GRAPH_RELATIONSHIPS_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "CONTEXT_REFERENCES_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("provides deterministic, explainable, provenance-aware retrieval", () => {
    const result = runWaveFivePersonalKnowledge();

    expect(result.retrieval).toMatchObject({ knowledge_search: true, semantic_retrieval: true, context_aware_retrieval: true, relevance_ranking: true, multi_hop_traversal: true, query_planning: true, knowledge_assembly: true, result_explanation: true, deterministic_ranking: true, provenance_aware: true, source_filtering: true, confidence_aware: true, traversal_optimized: true });
    expect(runWaveFivePersonalKnowledge({ scenario: "RETRIEVAL_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "RETRIEVAL_NOT_EXPLAINABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "PROVENANCE_AWARE_RETRIEVAL_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("continuously evaluates reliability and routes low-confidence knowledge to review", () => {
    const result = runWaveFivePersonalKnowledge();

    expect(result.reliability).toMatchObject({ reliability_scoring: true, source_consistency: true, evidence_freshness: true, conflict_detection: true, confidence_aggregation: true, trust_indicators: true, verification_status: true, reliability_history: true, continuous_evaluation: true, conflicts_detected_automatically: true, health_metrics: true });
    expect(result.review).toMatchObject({ review_queue: true, human_review: true, verification_workflow: true, approval_workflow: true, rejection_workflow: true, merge_workflow: true, conflict_resolution: true, review_evidence: true, priority_ordering: true, reviewer_assignment: true, decision_recording: true, audit_lineage: true, replay_support: true, low_confidence_queued: true, immutable_lineage: true });
    expect(runWaveFivePersonalKnowledge({ scenario: "RELIABILITY_NOT_CONTINUOUS" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "LOW_CONFIDENCE_NOT_QUEUED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "REVIEW_LINEAGE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("preserves provenance, synchronizes with unified context, and replays retrieval and review", () => {
    const result = runWaveFivePersonalKnowledge();

    expect(result.evidence_sync).toMatchObject({ context_synchronization: true, unified_context_references: true, complete_provenance: true, originating_context_lineage: true, originating_evidence_lineage: true, review_evidence_ledger: true, retrieval_replay: true, review_replay: true, identical_retrieval_outcomes: true, identical_review_outcomes: true, synchronized_with_unified_context: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, upstream_ready: true, every_knowledge_object_registered: true, graph_relationships_validated: true, retrieval_deterministic_explainable: true, provenance_complete: true, reliability_continuous: true, conflicts_detected: true, human_review_operational: true, review_lineage_immutable: true, unified_context_sync_validated: true, replay_identical_retrieval_and_review: true });
    expect(runWaveFivePersonalKnowledge({ scenario: "CONTEXT_SYNC_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "COMPLETE_PROVENANCE_MISSING" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFivePersonalKnowledge({ scenario: "REPLAY_RETRIEVAL_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFivePersonalKnowledge({ scenario: failure });
    const validation = validateWaveFivePersonalKnowledge(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFivePersonalKnowledge({ scenario: failure });
    const validation = validateWaveFivePersonalKnowledge(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFivePersonalKnowledge({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFivePersonalKnowledge({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFivePersonalKnowledge({ scenario: "PERSONAL_KNOWLEDGE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFivePersonalKnowledge(notQualified).valid).toBe(false);
  });
});
