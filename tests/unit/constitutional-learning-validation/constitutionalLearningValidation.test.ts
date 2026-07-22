import { describe, expect, it } from "vitest";
import {
  buildConstitutionalLearningObservabilitySurface,
  getConstitutionalLearningValidationEngine,
  listConstitutionalLearningExplanations,
  listConstitutionalLearningLedger,
  listConstitutionalLearningRecords,
  listConstitutionalLearningRejections,
  validateConstitutionalLearning,
  validateConstitutionalLearningRepository,
} from "@/services/constitutional-learning-validation";
import type { ConstitutionalLearningDomain, ConstitutionalLearningFailure, ConstitutionalLearningScenario } from "@/types/constitutional-learning-validation";

const domains: readonly ConstitutionalLearningDomain[] = ["LEARNING_BOUNDARY", "APPROVED_TEMPLATE", "APPROVED_HEURISTIC", "OPERATOR_APPROVAL", "GOVERNANCE_APPROVAL", "KNOWLEDGE_PROVENANCE", "CONFIDENCE_ADJUSTMENT", "OPTIMIZATION_SAFETY"];

describe("constitutional learning validation", () => {
  it("publishes the deterministic validation-only bundle", () => {
    const bundle = getConstitutionalLearningValidationEngine();

    expect(bundle.doctrine.engine_version).toBe("constitutional-learning-validation/v8ALT.10.8");
    expect(bundle.doctrine.final_state).toBe("CONSTITUTIONAL_LEARNING_VALIDATION_READY");
    expect(bundle.doctrine.validation_domains).toEqual(domains);
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.validation_only).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.learning_activation_authorized).toBe(false);
    expect(bundle.repository.model_update_authorized).toBe(false);
    expect(bundle.repository.heuristic_deployment_authorized).toBe(false);
    expect(bundle.repository.policy_modification_authorized).toBe(false);
    expect(bundle.repository.constitutional_modification_authorized).toBe(false);
    expect(bundle.repository.authority_change_authorized).toBe(false);
  });

  it("validates baseline learning proposals for governance review eligibility", () => {
    const repository = validateConstitutionalLearning();
    const record = repository.records[0];

    expect(repository.final_state).toBe("CONSTITUTIONAL_LEARNING_VALIDATION_COMPLETE");
    expect(record.overall_validation_status).toBe("APPROVED_FOR_REVIEW");
    expect(record.boundary_status).toBe("PASS");
    expect(record.template_status).toBe("PASS");
    expect(record.heuristic_status).toBe("PASS");
    expect(record.operator_approval_status).toBe("PASS");
    expect(record.governance_approval_status).toBe("PASS");
    expect(record.provenance_status).toBe("PASS");
    expect(record.confidence_status).toBe("PASS");
    expect(record.optimization_status).toBe("PASS");
    expect(repository.rejections).toEqual([]);
  });

  it("lists records, rejections, explanations, and ledger entries", () => {
    expect(listConstitutionalLearningRecords().length).toBe(1);
    expect(listConstitutionalLearningRejections()).toEqual([]);
    expect(listConstitutionalLearningExplanations().length).toBe(1);
    expect(listConstitutionalLearningLedger().length).toBe(1);
  });

  it("keeps validation deterministic and ledger entries immutable", () => {
    const first = validateConstitutionalLearning();
    const second = validateConstitutionalLearning();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.records[0].integrity_hash).toBe(first.records[0].integrity_hash);
    expect(first.ledger.every((item) => item.immutable && item.append_only)).toBe(true);
  });

  it("keeps pending approvals non-failing and ineligible for activation", () => {
    const repository = validateConstitutionalLearning({ scenario: "PENDING_APPROVALS" });
    const validation = validateConstitutionalLearningRepository(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_LEARNING_VALIDATION_COMPLETE");
    expect(repository.records[0].overall_validation_status).toBe("PENDING");
    expect(repository.records[0].operator_approval_status).toBe("PENDING");
    expect(repository.records[0].governance_approval_status).toBe("PENDING");
    expect(validation.valid).toBe(true);
    expect(repository.records[0].learning_activation_authorized).toBe(false);
  });

  it("provides complete explainability for baseline decisions", () => {
    const explanation = validateConstitutionalLearning().explanations[0];

    expect(explanation.complete).toBe(true);
    expect(explanation.deterministic).toBe(true);
    expect(explanation.replayable).toBe(true);
    expect(explanation.constitutional_rules_evaluated.length).toBeGreaterThan(0);
    expect(explanation.learning_boundaries_assessed.length).toBeGreaterThan(0);
    expect(explanation.supporting_evidence.length).toBeGreaterThan(0);
    expect(explanation.governance_references.length).toBeGreaterThan(0);
    expect(explanation.operator_approval_references.length).toBeGreaterThan(0);
    expect(explanation.confidence_calculations.length).toBeGreaterThan(0);
  });

  it("never authorizes learning activation or mutation", () => {
    const repository = validateConstitutionalLearning({ scenario: "UNAUTHORIZED_HEURISTICS", artifactType: "HEURISTIC" });
    const record = repository.records[0];

    expect(record.validation_only).toBe(true);
    expect(record.learning_activation_authorized).toBe(false);
    expect(record.model_update_authorized).toBe(false);
    expect(record.heuristic_deployment_authorized).toBe(false);
    expect(record.policy_modification_authorized).toBe(false);
    expect(record.constitutional_modification_authorized).toBe(false);
    expect(record.authority_change_authorized).toBe(false);
    expect(record.execution_behavior_change_authorized).toBe(false);
  });

  it.each([
    ["POLICY_MUTATION", "POLICY_MUTATION_DETECTED"],
    ["CONSTITUTIONAL_MUTATION", "CONSTITUTIONAL_MUTATION_DETECTED"],
    ["AUTHORITY_CHANGES", "AUTHORITY_CHANGE_DETECTED"],
    ["UNAUTHORIZED_HEURISTICS", "UNAUTHORIZED_HEURISTIC_DETECTED"],
    ["HIDDEN_MODEL_UPDATES", "HIDDEN_MODEL_UPDATE_DETECTED"],
    ["SELF_MODIFYING_BEHAVIOR", "SELF_MODIFYING_BEHAVIOR_DETECTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_DETECTED"],
    ["OPERATOR_APPROVAL_BYPASS", "OPERATOR_APPROVAL_BYPASS_DETECTED"],
    ["PROVENANCE_CORRUPTION", "PROVENANCE_CORRUPTION_DETECTED"],
    ["REPLAY_INCONSISTENCY", "LEARNING_REPLAY_INCONSISTENCY_DETECTED"],
    ["NONDETERMINISTIC_VALIDATION", "NONDETERMINISTIC_LEARNING_VALIDATION_DETECTED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "LEARNING_INTEGRITY_VERIFICATION_FAILED"],
    ["TENANT_ISOLATION_VIOLATION", "LEARNING_TENANT_ISOLATION_VIOLATION"],
    ["MISSING_CONSTITUTIONAL_EVIDENCE", "CONSTITUTIONAL_EVIDENCE_MISSING"],
    ["INCOMPLETE_VALIDATION_LINEAGE", "LEARNING_VALIDATION_LINEAGE_INCOMPLETE"],
  ] satisfies [ConstitutionalLearningScenario, ConstitutionalLearningFailure][])("fails closed and rejects %s", (scenario, failure) => {
    const repository = validateConstitutionalLearning({ scenario });
    const validation = validateConstitutionalLearningRepository(repository);

    expect(repository.final_state).toBe("CONSTITUTIONAL_LEARNING_VALIDATION_FAIL_CLOSED");
    expect(repository.failures).toContain(failure);
    expect(repository.rejections.some((item) => item.failure === failure && item.fail_closed)).toBe(true);
    expect(repository.records[0].overall_validation_status === "REJECTED" || repository.records[0].overall_validation_status === "BLOCKED").toBe(true);
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed_ready).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.learning_activation_authorized).toBe(false);
  });

  it("validates failure-specific controls", () => {
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "NONDETERMINISTIC_VALIDATION" })).deterministic_validation).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "REPLAY_INCONSISTENCY" })).replay_identical).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "MISSING_CONSTITUTIONAL_EVIDENCE" })).evidence_complete).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "INCOMPLETE_VALIDATION_LINEAGE" })).lineage_complete).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "INTEGRITY_VERIFICATION_FAILURE" })).integrity_verified).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "GOVERNANCE_BYPASS" })).governance_compliant).toBe(false);
    expect(validateConstitutionalLearningRepository(validateConstitutionalLearning({ scenario: "OPERATOR_APPROVAL_BYPASS" })).operator_authorized).toBe(false);
  });

  it("publishes an observability surface for governance and operator dashboards", () => {
    const surface = buildConstitutionalLearningObservabilitySurface(validateConstitutionalLearning({ scenario: "POLICY_MUTATION" }));

    expect(surface.final_state).toBe("CONSTITUTIONAL_LEARNING_VALIDATION_FAIL_CLOSED");
    expect(surface.record_count).toBe(1);
    expect(surface.rejection_count).toBe(1);
    expect(surface.explanation_count).toBe(1);
    expect(surface.ledger_count).toBe(1);
    expect(surface.validation_state).toBe("BLOCKED");
    expect(surface.validation_only).toBe(true);
    expect(surface.learning_activation_authorized).toBe(false);
    expect(surface.model_update_authorized).toBe(false);
  });
});
