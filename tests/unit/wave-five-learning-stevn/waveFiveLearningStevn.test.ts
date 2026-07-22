import { describe, expect, it } from "vitest";

import { getWaveFiveLearningStevnBundle, replayWaveFiveLearningStevn, runWaveFiveLearningStevn, validateWaveFiveLearningStevn } from "@/services/wave-five-learning-stevn";
import type { WaveFiveLearningStevnFailure } from "@/types/wave-five-learning-stevn";

const conditionalFailures = ["LEARNING_FOUNDATION_MISSING", "LEARNING_VOCABULARY_UNAPPROVED", "LEARNING_GOVERNANCE_UNAPPROVED", "LEARNING_REGISTRY_MISSING", "LEARNING_RELATIONSHIPS_INVALID", "LEARNING_METADATA_INCOMPLETE", "CURRICULUM_BUILDER_MISSING", "CURRICULUM_DEPENDENCIES_INVALID", "ASSESSMENTS_MISSING", "COMPETENCIES_NOT_MEASURABLE", "ASSESSMENT_EVIDENCE_INCOMPLETE", "STUDY_PLANNER_MISSING", "CALENDAR_INTEGRATION_INVALID", "PROGRESS_TRACKING_MISSING", "PROGRESS_TIMELINE_INVALID", "PROGRESS_EVIDENCE_INCOMPLETE", "KNOWLEDGE_INTEGRATION_MISSING", "MISSION_PROJECT_LEARNING_MISSING", "COMPETENCY_MAPPING_INVALID", "MISSION_RECOMMENDATIONS_NOT_EXPLAINABLE", "STEVN_INTEGRATION_MISSING", "RECOMMENDATIONS_MISSING", "RECOMMENDATION_EVIDENCE_INCOMPLETE", "LEARNING_ANALYTICS_MISSING", "LEARNING_METRICS_INVALID", "ANALYTICS_EVIDENCE_NOT_TRACEABLE", "LEARNING_QUALIFICATION_MISSING"] as const satisfies readonly WaveFiveLearningStevnFailure[];
const notQualifiedFailures = ["STEVN_APPLICATION_INVALID", "LEARNING_LIFECYCLE_INVALID", "LEARNING_REPLAY_DIVERGED", "LEARNING_PATHS_NONDETERMINISTIC", "ASSESSMENTS_NONREPRODUCIBLE", "STUDY_PLANS_NONDETERMINISTIC", "PROGRESS_INACCURATE", "RESEARCH_SYNC_INVALID", "LEARNING_GRAPH_INVALID", "MISSION_LINKAGE_INVALID", "STEVN_SYNC_INVALID", "DUPLICATE_STEVN_IDENTITY_CREATED", "DUPLICATE_LEARNER_PROFILE_CREATED", "INDEPENDENT_CURRICULUM_SYSTEM_CREATED", "ALTERNATIVE_LEARNING_AUTHORITY_CREATED", "RECOMMENDATIONS_NOT_EXPLAINABLE", "RECOMMENDATIONS_NOT_ADVISORY", "EVIDENCE_LINEAGE_INCOMPLETE", "LEARNING_EVIDENCE_MUTABLE", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveLearningStevnFailure[];

describe("Wave 5.11 Learning and STEVN", () => {
  it("publishes the Learning and STEVN doctrine", () => {
    const bundle = getWaveFiveLearningStevnBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-learning-stevn/w5.11", stevn_remains_authoritative: true, no_duplicate_learning_identity: true, no_parallel_curriculum_authority: true, recommendations_advisory_only: true, immutable_learning_evidence_required: true, replay_required: true, qualification_gate: "W5.11 Learning and STEVN Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes STEVN without replacing it", () => {
    const first = runWaveFiveLearningStevn({ seed: "deterministic" });
    const second = runWaveFiveLearningStevn({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["stevn-application/v4.17", "wave-five-research/w5.9", "wave-five-tasks-commitments/w5.5", "wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2"]);
    expect(first.provides).toEqual(["learning-registry", "curriculum-builder", "assessments", "study-planner", "stevn-integration", "learning-recommendations", "learning-analytics", "learning-qualification"]);
    expect(first.learner_profile_id).toBe("learner-profile:stevn:authoritative");
    expect(first.stevn_integration.stevn_application_ref).toBe("stevn-application/v4.17");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveLearningStevn(first).valid).toBe(true);
    expect(replayWaveFiveLearningStevn()).toBe(true);
  });

  it("qualifies the learning foundation, registry, and curriculum builder", () => {
    const result = runWaveFiveLearningStevn();

    expect(result.foundation).toMatchObject({ learning_architecture: true, learning_vocabulary: true, learning_lifecycle: true, learning_policies: true, learning_apis: true, learning_contracts: true, learning_governance: true, learning_event_model: true, vocabulary_approved: true, architecture_complete: true, lifecycle_validated: true, governance_approved: true });
    expect(result.registry_curriculum).toMatchObject({ learning_registry: true, course_registry: true, subject_registry: true, skill_registry: true, competency_registry: true, learning_metadata: true, learning_relationships: true, learning_classification: true, curriculum_builder: true, learning_paths: true, course_sequencing: true, prerequisites: true, milestones: true, competency_mapping: true, completion_rules: true, registry_operational: true, relationships_validated: true, replay_verified: true, dependencies_validated: true, learning_paths_deterministic: true });
    expect(runWaveFiveLearningStevn({ scenario: "LEARNING_REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "LEARNING_PATHS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("qualifies reproducible assessments and deterministic study planning", () => {
    const result = runWaveFiveLearningStevn();

    expect(result.assessment_study).toMatchObject({ assessment_registry: true, quiz_framework: true, exam_framework: true, practice_exercises: true, rubrics: true, competency_evaluation: true, assessment_evidence: true, feedback: true, study_planning: true, study_sessions: true, time_allocation: true, priority_planning: true, adaptive_scheduling: true, review_planning: true, study_calendar_integration: true, reminder_generation: true, assessments_reproducible: true, competencies_measurable: true, evidence_complete: true, schedules_generated: true, calendar_integration_validated: true, study_plans_deterministic: true });
    expect(runWaveFiveLearningStevn({ scenario: "ASSESSMENTS_NONREPRODUCIBLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "STUDY_PLANS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("links progress, knowledge, research, missions, and projects", () => {
    const result = runWaveFiveLearningStevn();

    expect(result.progress_knowledge_mission).toMatchObject({ progress_tracking: true, completion_tracking: true, competency_progress: true, milestone_tracking: true, learning_history: true, evidence_timeline: true, achievement_tracking: true, progress_metrics: true, knowledge_references: true, research_links: true, notes_integration: true, flashcards: true, knowledge_review: true, learning_graph: true, evidence_links: true, knowledge_synchronization: true, mission_learning: true, project_learning_plans: true, required_competencies: true, training_assignments: true, certification_preparation: true, learning_objectives: true, learning_recommendations: true, mission_readiness: true, progress_accurate: true, research_synchronized: true, graph_validated: true, mission_linkage_operational: true });
    expect(runWaveFiveLearningStevn({ scenario: "PROGRESS_INACCURATE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "RESEARCH_SYNC_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "MISSION_LINKAGE_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("binds to authoritative STEVN and rejects duplicate learning authorities", () => {
    const result = runWaveFiveLearningStevn();

    expect(result.stevn_integration).toMatchObject({ stevn_remains_authoritative: true, stevn_integration_apis: true, learning_synchronization: true, curriculum_synchronization: true, assessment_synchronization: true, progress_synchronization: true, competency_synchronization: true, learning_event_integration: true, evidence_synchronization: true, no_new_stevn_identity: true, no_duplicate_learner_profile: true, no_independent_curriculum_system: true, no_alternative_learning_authority: true, evidence_preserved: true, replay_validated: true });
    expect(result.readiness.no_duplicate_identities_created).toBe(true);
    expect(runWaveFiveLearningStevn({ scenario: "STEVN_SYNC_INVALID" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "DUPLICATE_STEVN_IDENTITY_CREATED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "DUPLICATE_LEARNER_PROFILE_CREATED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "INDEPENDENT_CURRICULUM_SYSTEM_CREATED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "ALTERNATIVE_LEARNING_AUTHORITY_CREATED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("qualifies advisory recommendations, analytics, evidence, and readiness", () => {
    const result = runWaveFiveLearningStevn();

    expect(result.recommendations_analytics_qualification).toMatchObject({ learning_recommendations: true, study_recommendations: true, course_recommendations: true, gap_analysis: true, competency_suggestions: true, review_suggestions: true, readiness_evaluation: true, learning_forecasts: true, learning_dashboard: true, progress_analytics: true, completion_trends: true, competency_trends: true, study_efficiency: true, learning_heatmaps: true, time_analysis: true, performance_reports: true, learning_qualification_report: true, qualification_evidence: true, readiness_assessment: true, qualification_decision: true, recommendations_explainable: true, advisory_only: true, evidence_lineage_complete: true, immutable_evidence: true, tenant_isolation: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, stevn_ready: true, foundation_ready: true, registry_curriculum_ready: true, assessment_study_ready: true, progress_knowledge_mission_ready: true, stevn_integration_ready: true, recommendations_analytics_qualification_ready: true, learning_replay_verified: true, stevn_integration_operational: true, evidence_lineage_complete: true, recommendations_advisory_only: true });
    expect(runWaveFiveLearningStevn({ scenario: "RECOMMENDATIONS_NOT_EXPLAINABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "RECOMMENDATIONS_NOT_ADVISORY" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "LEARNING_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveLearningStevn({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveLearningStevn({ scenario: failure });
    const validation = validateWaveFiveLearningStevn(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveLearningStevn({ scenario: failure });
    const validation = validateWaveFiveLearningStevn(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveLearningStevn({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveLearningStevn({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveLearningStevn({ scenario: "LEARNING_STEVN_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveLearningStevn(notQualified).valid).toBe(false);
  });
});
