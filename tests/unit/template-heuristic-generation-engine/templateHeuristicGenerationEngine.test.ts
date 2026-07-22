import { describe, expect, it } from "vitest";
import {
  buildTemplateHeuristicGenerationObservabilitySurface,
  generateTemplateHeuristicKnowledge,
  getTemplateHeuristicGenerationEngine,
  listCandidateKnowledgeArtifacts,
  listExecutionHeuristics,
  listPlanningTemplates,
  listTemplateHeuristicAuditRecords,
  validateTemplateHeuristicGeneration,
} from "@/services/template-heuristic-generation-engine";
import type { TemplateHeuristicGenerationFailure, TemplateHeuristicGenerationScenario } from "@/types/template-heuristic-generation-engine";

describe("template heuristic generation engine", () => {
  it("publishes the deterministic generation engine bundle", () => {
    const bundle = getTemplateHeuristicGenerationEngine();

    expect(bundle.doctrine.engine_version).toBe("template-heuristic-generation-engine/v8ALT.9.4");
    expect(bundle.doctrine.final_state).toBe("TEMPLATE_HEURISTIC_GENERATION_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.activation_authorized).toBe(false);
    expect(bundle.repository.runtime_modification_authorized).toBe(false);
    expect(bundle.repository.planning_modification_authorized).toBe(false);
    expect(bundle.repository.self_approval_authorized).toBe(false);
  });

  it("generates inactive candidate knowledge artifacts from certified patterns", () => {
    const repository = generateTemplateHeuristicKnowledge();

    expect(repository.final_state).toBe("CANDIDATE_KNOWLEDGE_GENERATED");
    expect(repository.artifacts.length).toBeGreaterThan(0);
    expect(repository.artifacts.every((artifact) => artifact.lifecycle_state === "READY_FOR_VALIDATION")).toBe(true);
    expect(repository.artifacts.every((artifact) => artifact.activation_state === "INACTIVE")).toBe(true);
    expect(repository.artifacts.every((artifact) => artifact.evidence_chain.length > 0)).toBe(true);
    expect(repository.artifacts.every((artifact) => artifact.lineage_reference.length > 0)).toBe(true);
    expect(repository.artifacts.every((artifact) => artifact.replay_reference.length > 0)).toBe(true);
  });

  it("lists artifacts, templates, heuristics, and audit records", () => {
    expect(listCandidateKnowledgeArtifacts().length).toBeGreaterThan(0);
    expect(listPlanningTemplates().length).toBeGreaterThan(0);
    expect(listExecutionHeuristics().length).toBeGreaterThan(0);
    expect(listTemplateHeuristicAuditRecords().length).toBe(0);
  });

  it("keeps generated knowledge advisory-only and non-activating", () => {
    const repository = generateTemplateHeuristicKnowledge();

    expect(repository.artifacts.every((artifact) => artifact.advisory_only)).toBe(true);
    expect(repository.artifacts.every((artifact) => !artifact.activation_authorized)).toBe(true);
    expect(repository.artifacts.every((artifact) => !artifact.runtime_modification_authorized)).toBe(true);
    expect(repository.artifacts.every((artifact) => !artifact.planning_modification_authorized)).toBe(true);
    expect(repository.artifacts.every((artifact) => !artifact.governance_modification_authorized)).toBe(true);
    expect(repository.artifacts.every((artifact) => !artifact.self_approval_authorized)).toBe(true);
    expect(repository.artifacts.every((artifact) => !artifact.historical_truth_mutable)).toBe(true);
    expect(repository.artifacts.every((artifact) => artifact.tenant_id === "tenant:alpha")).toBe(true);
  });

  it("is deterministic for identical validated pattern repositories", () => {
    const first = generateTemplateHeuristicKnowledge();
    const second = generateTemplateHeuristicKnowledge();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.artifacts.map((artifact) => artifact.artifact_id)).toEqual(first.artifacts.map((artifact) => artifact.artifact_id));
    expect(second.artifacts.map((artifact) => artifact.deterministic_signature)).toEqual(first.artifacts.map((artifact) => artifact.deterministic_signature));
  });

  it.each([
    ["INVALID_PATTERN_REPOSITORY", "INVALID_PATTERN_REPOSITORY"],
    ["NON_CERTIFIED_PATTERN", "NON_CERTIFIED_PATTERN_REJECTED"],
    ["UNSTABLE_PATTERN", "UNSTABLE_PATTERN_REJECTED"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["AUTHORITY_CONFLICT", "AUTHORITY_CONFLICT_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["DUPLICATE_DETERMINISTIC_ARTIFACT", "DUPLICATE_DETERMINISTIC_ARTIFACT_DETECTED"],
    ["AMBIGUOUS_TEMPLATE_GENERATION", "AMBIGUOUS_TEMPLATE_GENERATION_REJECTED"],
    ["CROSS_TENANT_LEARNING_ATTEMPT", "CROSS_TENANT_LEARNING_DETECTED"],
    ["ACTIVATION_ATTEMPTED", "ACTIVATION_ATTEMPTED"],
    ["RUNTIME_MODIFICATION_ATTEMPTED", "RUNTIME_MODIFICATION_ATTEMPTED"],
    ["PLANNING_MODIFICATION_ATTEMPTED", "PLANNING_MODIFICATION_ATTEMPTED"],
    ["GOVERNANCE_MODIFICATION_ATTEMPTED", "GOVERNANCE_MODIFICATION_ATTEMPTED"],
    ["HISTORICAL_OVERWRITE_ATTEMPTED", "HISTORICAL_OVERWRITE_ATTEMPTED"],
    ["SELF_APPROVAL_ATTEMPTED", "SELF_APPROVAL_ATTEMPTED"],
  ] satisfies [TemplateHeuristicGenerationScenario, TemplateHeuristicGenerationFailure][])("fails closed and audits %s", (scenario, failure) => {
    const repository = generateTemplateHeuristicKnowledge({ scenario });
    const validation = validateTemplateHeuristicGeneration(repository);

    expect(repository.final_state).toBe("CANDIDATE_KNOWLEDGE_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.audit_records.some((record) => record.rejection_reason === failure)).toBe(true);
    expect(repository.audit_records.every((record) => record.immutable && record.append_only)).toBe(true);
  });

  it("publishes generation observability", () => {
    const surface = buildTemplateHeuristicGenerationObservabilitySurface();

    expect(surface.final_state).toBe("CANDIDATE_KNOWLEDGE_GENERATED");
    expect(surface.artifact_count).toBeGreaterThan(0);
    expect(surface.template_count).toBeGreaterThan(0);
    expect(surface.heuristic_count).toBeGreaterThan(0);
    expect(surface.ready_for_validation_count).toBe(surface.artifact_count);
    expect(surface.activation_authorized).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
