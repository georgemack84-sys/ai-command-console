import { describe, expect, it } from "vitest";

import { getWaveFiveAuroraBundle, replayWaveFiveAurora, runWaveFiveAurora, validateWaveFiveAurora } from "@/services/wave-five-aurora";
import type { WaveFiveAuroraFailure } from "@/types/wave-five-aurora";

const conditionalFailures = ["CONVERSATION_INTERFACE_MISSING", "VOICE_READY_ARCHITECTURE_MISSING", "COMMAND_PARSING_MISSING", "MULTITURN_CONTINUITY_INVALID", "SESSION_AWARENESS_MISSING", "ACCESSIBILITY_SUPPORT_MISSING", "BRIEFING_ENGINE_MISSING", "BRIEFING_EVIDENCE_MISSING", "BRIEFING_PRIORITIZATION_INVALID", "ACTION_SUGGESTIONS_UNGOVERNED", "CONTEXT_ASSEMBLY_MISSING", "CONTEXT_FRESHNESS_INVALID", "PERMISSION_FILTERING_MISSING", "INTENT_RESOLUTION_MISSING", "ACTION_ROUTER_MISSING", "EXECUTION_MONITORING_MISSING", "FAILURE_HANDLING_MISSING", "EXPLANATION_ENGINE_MISSING", "POLICY_EXPLANATIONS_MISSING", "RESTRICTION_EXPLANATIONS_MISSING", "ACTION_LINEAGE_MISSING", "CONFIDENCE_PRESENTATION_MISSING", "CONVERSATIONAL_MEMORY_MISSING", "GUIDED_WORKFLOWS_MISSING", "RECOMMENDATION_EVIDENCE_MISSING"] as const satisfies readonly WaveFiveAuroraFailure[];
const notQualifiedFailures = ["AURORA_APPLICATION_INVALID", "W5_LEARNING_STEVN_INVALID", "UNAUTHORIZED_CONTEXT_ASSEMBLED", "SOURCE_GOVERNANCE_BYPASSED", "TENANT_CONTEXT_LEAK", "INTENT_ROUTING_NONDETERMINISTIC", "DIRECT_BUSINESS_LOGIC_EXECUTED", "GOVERNED_API_ROUTING_BYPASSED", "EXPLANATIONS_NOT_EVIDENCE_BACKED", "GOVERNANCE_VALIDATION_MISSING", "CONSTITUTIONAL_GOVERNANCE_BYPASSED", "AUTHORIZATION_VALIDATION_MISSING", "DIRECT_PRIVILEGE_ESCALATION", "UNRESTRICTED_SUPERUSER_AUTHORITY", "EVIDENCE_NOT_ATTACHED", "EVIDENCE_VISIBILITY_UNAUTHORIZED", "PRIVACY_DISCLOSURE_UNAUTHORIZED", "MEMORY_POLICY_BYPASSED", "RECOMMENDATIONS_NOT_ADVISORY", "AURORA_REPLAY_DIVERGED"] as const satisfies readonly WaveFiveAuroraFailure[];

describe("Wave 5.12 Aurora Conversational Orchestration", () => {
  it("publishes the Aurora orchestration doctrine", () => {
    const bundle = getWaveFiveAuroraBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-aurora/w5.12", aurora_remains_orchestrator: true, business_logic_delegated_to_applications: true, governed_api_routing_required: true, evidence_backed_explanations_required: true, least_privilege_required: true, unrestricted_superuser_prohibited: true, replay_required: true, qualification_gate: "W5.12 Aurora Conversational Orchestration Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes Program 4 Aurora plus Wave 5 learning", () => {
    const first = runWaveFiveAurora({ seed: "deterministic" });
    const second = runWaveFiveAurora({ seed: "deterministic" });

    expect(first.aurora_application_ref).toBe("aurora/v4.15");
    expect(first.upstream_refs).toEqual(["aurora/v4.15", "wave-five-learning-stevn/w5.11", "wave-five-writing-publisher-os/w5.10", "wave-five-research/w5.9", "wave-five-health/w5.8", "wave-five-finance/w5.7", "wave-five-tasks-commitments/w5.5", "wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2", "wave-five-application-platform/w5.1"]);
    expect(first.provides).toEqual(["conversation-service", "briefing-engine", "context-assembly", "intent-resolution", "action-router", "explanation-engine", "recommendation-orchestration", "conversation-sessions"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveAurora(first).valid).toBe(true);
    expect(replayWaveFiveAurora()).toBe(true);
  });

  it("operates the conversational interface and briefing engine", () => {
    const result = runWaveFiveAurora();

    expect(result.conversation).toMatchObject({ natural_language: true, voice_ready_architecture: true, structured_command_parsing: true, multi_turn_conversations: true, conversation_continuity: true, clarification_workflows: true, session_awareness: true, accessibility_support: true, conversation_service: true, session_manager: true, conversation_registry: true, operational: true, deterministic: true });
    expect(result.briefing).toMatchObject({ daily_briefings: true, mission_summaries: true, task_summaries: true, calendar_briefings: true, health_summaries: true, financial_summaries: true, project_updates: true, research_digests: true, learning_progress: true, cross_domain_summaries: true, prioritization: true, evidence_backed_summaries: true, context_aware_sequencing: true, recommendation_generation: true, action_suggestions: true, governed_suggestions: true, operational: true });
  });

  it("assembles only authorized deterministic context", () => {
    const result = runWaveFiveAurora();

    expect(result.context_assembly.sources).toEqual(["unified-personal-context", "personal-knowledge", "calendar-time", "tasks-commitments", "finance", "health", "research", "learning-stevn", "mission-control"]);
    expect(result.context_assembly).toMatchObject({ context_aggregation: true, cross_application_retrieval: true, identity_aware_context: true, time_context: true, mission_context: true, preference_context: true, permission_filtering: true, source_governance: true, context_validation: true, freshness_evaluation: true, unauthorized_context_blocked: true, tenant_isolation: true, deterministic: true });
    expect(runWaveFiveAurora({ scenario: "UNAUTHORIZED_CONTEXT_ASSEMBLED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "TENANT_CONTEXT_LEAK" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("routes actions through governed application APIs without direct business logic", () => {
    const result = runWaveFiveAurora();

    expect(result.action_routing).toMatchObject({ intent_resolution: true, questions: true, commands: true, requests: true, planning: true, analysis: true, summaries: true, search: true, recommendations: true, workflows: true, follow_up_conversations: true, service_discovery: true, capability_selection: true, request_transformation: true, authorization_validation: true, governance_enforcement: true, governed_application_apis_only: true, no_direct_business_logic: true, execution_monitoring: true, result_aggregation: true, failure_handling: true, retry_coordination: true, deterministic_routing: true });
    expect(runWaveFiveAurora({ scenario: "INTENT_ROUTING_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "DIRECT_BUSINESS_LOGIC_EXECUTED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "GOVERNED_API_ROUTING_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("explains actions with evidence, policy, restriction, lineage, and confidence", () => {
    const result = runWaveFiveAurora();

    expect(result.explanation).toMatchObject({ decision_explanations: true, evidence_references: true, policy_explanations: true, restriction_explanations: true, context_summaries: true, confidence_presentation: true, action_lineage: true, recommendation_rationale: true, governance_trace: true, human_readable_narratives: true, every_significant_action_explained: true, evidence_backed: true });
    expect(runWaveFiveAurora({ scenario: "EXPLANATIONS_NOT_EVIDENCE_BACKED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("enforces governance, authorization, least privilege, evidence visibility, and privacy", () => {
    const result = runWaveFiveAurora();

    expect(result.governance_security).toMatchObject({ constitutional_governance_enforced: true, mission_lifecycle_contract: true, policy_engine: true, safety_gate: true, evidence_services: true, replay_services: true, certification_services: true, cata_trust_framework: true, identity_validation: true, permissions_validation: true, delegated_authority_validation: true, tenant_boundary_validation: true, policy_restrictions: true, least_privilege: true, no_direct_privilege_escalation: true, no_unrestricted_superuser: true, evidence_visibility_authorized: true, privacy_preserved: true });
    expect(runWaveFiveAurora({ scenario: "CONSTITUTIONAL_GOVERNANCE_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "DIRECT_PRIVILEGE_ESCALATION" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "UNRESTRICTED_SUPERUSER_AUTHORITY" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "EVIDENCE_NOT_ATTACHED" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("governs conversational memory, guided workflows, and advisory recommendations", () => {
    const result = runWaveFiveAurora();

    expect(result.memory_workflows).toMatchObject({ conversation_state: true, active_objectives: true, clarification_history: true, referenced_entities: true, pending_actions: true, governed_by_context_policies: true, planning_workflows: true, writing_workflows: true, research_workflows: true, scheduling_workflows: true, review_workflows: true, learning_workflows: true, project_management_workflows: true, mission_execution_workflows: true, recommendations_advisory_only: true, recommendation_evidence: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, aurora_application_ready: true, learning_stevn_ready: true, conversational_interface_operational: true, briefing_engine_operational: true, context_assembly_authorization_aware: true, governed_api_routing_only: true, every_response_explainable: true, evidence_attached_to_routed_actions: true, constitutional_governance_enforced: true, tenant_isolation_preserved: true, replay_reproduces_orchestration: true, orchestration_only: true, never_unrestricted_superuser: true });
    expect(runWaveFiveAurora({ scenario: "MEMORY_POLICY_BYPASSED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveAurora({ scenario: "RECOMMENDATIONS_NOT_ADVISORY" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveAurora({ scenario: failure });
    const validation = validateWaveFiveAurora(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveAurora({ scenario: failure });
    const validation = validateWaveFiveAurora(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveAurora({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveAurora({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveAurora({ scenario: "AURORA_ORCHESTRATION_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveAurora(notQualified).valid).toBe(false);
  });
});
