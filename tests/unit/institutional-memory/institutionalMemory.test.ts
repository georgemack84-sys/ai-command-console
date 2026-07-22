import { describe, expect, it } from "vitest";

import { getInstitutionalMemoryBundle, replayInstitutionalMemory, runInstitutionalMemory, validateInstitutionalMemory } from "@/services/institutional-memory";
import type { InstitutionalMemoryFailure } from "@/types/institutional-memory";

const conditionalFailures = ["KNOWLEDGE_CAPTURE_MISSING", "LESSON_CAPTURE_MISSING", "KNOWLEDGE_VALIDATION_MISSING", "KNOWLEDGE_APPROVAL_MISSING", "KNOWLEDGE_CLASSIFICATION_MISSING", "KNOWLEDGE_PUBLICATION_MISSING", "KNOWLEDGE_RETIREMENT_MISSING", "MEMORY_REPOSITORY_MISSING", "KNOWLEDGE_GRAPH_MISSING", "PATTERN_CATALOG_MISSING", "KNOWLEDGE_LINEAGE_MISSING", "KNOWLEDGE_VALIDATION_ENGINE_MISSING", "EVIDENCE_VERIFICATION_MISSING", "DUPLICATE_DETECTION_MISSING", "CONFLICT_ANALYSIS_MISSING", "CONFIDENCE_EVALUATION_MISSING", "GOVERNANCE_APPROVAL_MISSING", "AUTHORITY_VERIFICATION_MISSING", "LEARNING_ENGINE_MISSING", "KNOWLEDGE_SEARCH_MISSING", "KNOWLEDGE_GOVERNANCE_MISSING", "LIFECYCLE_APPROVAL_MISSING", "VERSIONING_MISSING", "ACCESS_CONTROL_MISSING", "KNOWLEDGE_REPORTS_MISSING", "KNOWLEDGE_EVIDENCE_MISSING", "INSTITUTIONAL_MEMORY_APIS_MISSING"] as const satisfies readonly InstitutionalMemoryFailure[];
const failClosedFailures = ["MC_1_MISSION_MANAGEMENT_INVALID", "MC_2_SCENARIO_PLANNING_INVALID", "MC_3_DECISION_SUPPORT_INVALID", "MC_4_PORTFOLIO_MANAGEMENT_INVALID", "MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", "MC_6_DIGITAL_TWIN_INVALID", "MC_7_SIMULATION_INVALID", "MC_8_RISK_ASSESSMENT_INVALID", "MC_9_RECOMMENDATION_INTELLIGENCE_INVALID", "MC_10_OPERATOR_DASHBOARD_INVALID", "CAF_MEMORY_ENGINE_INVALID", "CAF_PLANNING_ENGINE_INVALID", "REPOSITORY_NOT_AUTHORITATIVE", "GRAPH_NODE_EVIDENCE_MISSING", "PATTERNS_NOT_EVIDENCE_BACKED", "LINEAGE_NOT_REPRODUCIBLE", "LEARNING_OUTPUTS_NOT_ADVISORY", "SEARCH_NON_DETERMINISTIC", "KNOWLEDGE_WITHOUT_EVIDENCE_PUBLISHED", "KNOWLEDGE_EVIDENCE_MUTATED", "HISTORICAL_EVIDENCE_MUTATED", "OPERATIONAL_DECISION_CREATED", "EXECUTION_INITIATED", "AUTONOMOUS_LEARNING_ATTEMPTED", "GOVERNANCE_BYPASSED", "TRACEABILITY_INCOMPLETE"] as const satisfies readonly InstitutionalMemoryFailure[];

describe("Institutional Memory MC-11", () => {
  it("publishes the MC-11 institutional memory doctrine", () => {
    const bundle = getInstitutionalMemoryBundle();

    expect(bundle.doctrine).toMatchObject({ version: "institutional-memory/mc-11", owns_organizational_knowledge_capture: true, owns_institutional_memory_repository: true, owns_knowledge_graph_and_pattern_catalog: true, owns_knowledge_lineage_validation_search_governance: true, transforms_evidence_into_durable_knowledge: true, advisory_only: true, immutable_history_required: true, no_autonomous_learning: true, qualification_gate: "Institutional Memory Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("INSTITUTIONAL_MEMORY_QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and anchored to MC, CCI, and CAF memory dependencies", () => {
    const first = runInstitutionalMemory({ seed: "deterministic" });
    const second = runInstitutionalMemory({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8", "mission-recommendation-intelligence/mc-9", "operator-dashboard/mc-10", "memory-engine/w2.9", "planning-engine/w2.8", "cci-evidence", "cci-replay", "cci-immutable-event-history", "caf-memory-engine", "caf-planning-engine"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateInstitutionalMemory(first).valid).toBe(true);
    expect(replayInstitutionalMemory()).toBe(true);
  });

  it("captures and stores approved organizational knowledge", () => {
    const result = runInstitutionalMemory();

    expect(result.capture).toMatchObject({ lesson_capture: true, knowledge_validation: true, knowledge_approval: true, knowledge_classification: true, knowledge_publication: true, knowledge_retirement: true, validated_operational_learning: true });
    expect(result.repository).toMatchObject({ lessons_learned: true, operational_practices: true, mission_outcomes: true, decision_outcomes: true, failure_analysis: true, recovery_procedures: true, governance_decisions: true, operational_policies: true, organizational_experience: true, authoritative_repository: true });
  });

  it("builds an evidence-backed knowledge graph and pattern catalog", () => {
    const result = runInstitutionalMemory();

    expect(result.graph.relationships).toEqual(["MISSION", "DECISION", "EVIDENCE", "RISK", "RECOMMENDATION", "OUTCOME", "LESSON", "PATTERN", "KNOWLEDGE_ASSET"]);
    expect(result.graph).toMatchObject({ mission_to_knowledge_asset_path: true, evidence_backed_nodes: true, governed_relationships: true, enterprise_relationships: true });
    expect(result.patterns.categories).toEqual(["OPERATIONAL", "DECISION", "RISK", "RECOVERY", "ESCALATION", "MISSION", "RESOURCE", "GOVERNANCE", "SIMULATION", "ORGANIZATIONAL"]);
    expect(result.patterns).toMatchObject({ recurring_behaviors: true, reusable_patterns: true, evidence_backed_patterns: true, pattern_analysis_reports: true });
  });

  it("preserves complete lineage and validates knowledge before publication", () => {
    const result = runInstitutionalMemory();

    expect(result.lineage).toMatchObject({ source_mission: true, evidence_references: true, replay_references: true, decision_package_references: true, simulation_references: true, validation_history: true, approval_history: true, retirement_history: true, reproducible_from_cci_event_history: true });
    expect(result.validation).toMatchObject({ evidence_verification: true, duplicate_detection: true, conflict_analysis: true, confidence_evaluation: true, governance_approval: true, constitution_compliance: true, authority_verification: true, prevents_unsupported_entries: true });
  });

  it("produces advisory learning guidance and deterministic governed search", () => {
    const result = runInstitutionalMemory();

    expect(result.learning).toMatchObject({ best_practices: true, operational_guidelines: true, failure_prevention_guidance: true, recovery_guidance: true, mission_templates: true, operational_checklists: true, risk_mitigation_practices: true, decision_heuristics: true, advisory_only: true });
    expect(result.search).toMatchObject({ semantic_search: true, evidence_search: true, mission_search: true, pattern_search: true, relationship_navigation: true, timeline_search: true, similarity_search: true, governance_search: true, deterministic_retrieval: true });
  });

  it("governs lifecycle, reports, evidence, and APIs without autonomous learning", () => {
    const result = runInstitutionalMemory();

    expect(result.governance).toMatchObject({ versioning: true, approval: true, publication: true, deprecation: true, retirement: true, supersession: true, audit: true, access_control: true, governed_lifecycle: true });
    expect(result.reports).toMatchObject({ organizational_learning_reports: true, best_practice_catalog: true, validation_reports: true, pattern_analysis_reports: true, audit_reports: true, reproducible_reports: true });
    expect(result.evidence).toMatchObject({ knowledge_identifier: true, source_mission: true, evidence_references: true, replay_references: true, decision_references: true, validation_evidence: true, approval_evidence: true, version_history: true, confidence_assessment: true, constitutional_compliance_status: true, lineage_references: true, immutable: true });
    expect(result.apis).toMatchObject({ capture_api: true, repository_api: true, graph_api: true, pattern_api: true, lineage_api: true, validation_api: true, learning_api: true, search_api: true, governance_api: true, evidence_api: true, stable: true });
    expect(result.readiness).toMatchObject({ advisory_only: true, no_operational_decisions: true, no_execution: true, immutable_history_preserved: true, evidence_first: true, governance_enforced: true, deterministic_provenance: true, no_autonomous_learning: true });
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runInstitutionalMemory({ scenario: failure });
    const validation = validateInstitutionalMemory(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("CONDITIONALLY_QUALIFIED");
  });

  it.each(failClosedFailures)("fails closed for %s", (failure) => {
    const result = runInstitutionalMemory({ scenario: failure });
    const validation = validateInstitutionalMemory(result);

    expect(result.readiness.decision).toBe("FAIL_CLOSED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
    expect(validation.decision).toBe("FAIL_CLOSED");
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runInstitutionalMemory({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runInstitutionalMemory({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runInstitutionalMemory({ scenario: "INSTITUTIONAL_MEMORY_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(followup.readiness.failures).toEqual([]);
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(notQualified.readiness.phase_ready).toBe(false);
    expect(validateInstitutionalMemory(notQualified).valid).toBe(false);
  });
});
