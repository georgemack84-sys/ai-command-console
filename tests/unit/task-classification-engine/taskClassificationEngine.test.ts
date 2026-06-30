import { describe, expect, it } from "vitest";
import {
  buildTaskClassificationPackage,
  buildTaskClassificationVisibilitySurface,
  classifyDelegationTask,
  computeTaskClassificationDecisionHash,
  getTaskClassificationDecisionMatrix,
  getTaskClassificationFramework,
  getTaskClassificationRuleLibrary,
} from "@/services/task-classification-engine";
import type { TaskClassificationFailureReason, TaskClassificationScenario, TaskExecutionCategory } from "@/types/task-classification-engine";

describe("Mission Control Phase 8D.2 Task Classification Engine", () => {
  it("publishes deterministic doctrine, rule library, and decision matrix", () => {
    const framework = getTaskClassificationFramework();
    const rules = getTaskClassificationRuleLibrary();
    const matrix = getTaskClassificationDecisionMatrix();

    expect(framework.doctrine.engine_version).toBe("task-classification-engine/v8D.2");
    expect(framework.doctrine.principles).toContain("single-owner");
    expect(framework.doctrine.categories).toEqual(["OPERATOR", "AGENT", "EXTERNAL", "DEFERRED", "BLOCKED"]);
    expect(rules).toHaveLength(5);
    expect(rules.every((rule) => rule.immutable && rule.replay_compatible)).toBe(true);
    expect(new Set(matrix.map((entry) => entry.classification))).toEqual(new Set(["OPERATOR", "AGENT", "EXTERNAL", "DEFERRED", "BLOCKED"]));
  });

  it("classifies the baseline delegation as an agent task", () => {
    const pkg = buildTaskClassificationPackage();

    expect(pkg.classification.classification).toBe("AGENT");
    expect(pkg.classification.execution_owner_type).toBe("AUTONOMY_ENGINE");
    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.validation.ready_for_authority_validation_engine).toBe(true);
    expect(pkg.classification.confidence.level).toBe("HIGH");
  });

  it.each([
    ["OPERATOR_REQUIRED", "OPERATOR"],
    ["EXTERNAL_REQUIRED", "EXTERNAL"],
    ["DEPENDENCY_INCOMPLETE", "DEFERRED"],
    ["AUTHORITY_FAILURE", "BLOCKED"],
    ["POLICY_CONFLICT", "BLOCKED"],
    ["CONSTITUTIONAL_VIOLATION", "BLOCKED"],
  ] as readonly [TaskClassificationScenario, TaskExecutionCategory][])("classifies %s as %s", (scenario, category) => {
    const pkg = buildTaskClassificationPackage({ scenario });

    expect(pkg.classification.classification).toBe(category);
    expect(pkg.classification.matched_rule_ids).toHaveLength(1);
    expect(pkg.classification.explanation).toContain(category);
    if (category === "DEFERRED" || category === "BLOCKED") {
      expect(pkg.validation.ready_for_authority_validation_engine).toBe(false);
    }
  });

  it("records replayable immutable classification evidence", () => {
    const pkg = buildTaskClassificationPackage();
    const again = buildTaskClassificationPackage();

    expect(pkg.classification.integrity_hash).toBe(computeTaskClassificationDecisionHash(pkg.classification));
    expect(pkg.immutable_evidence_refs).toContain(pkg.classification.evidence.evidence_hash);
    expect(pkg.replay.reconstructed_classification).toBe(pkg.classification.classification);
    expect(pkg.replay.reconstructed_rule_ids).toEqual(pkg.classification.matched_rule_ids);
    expect(again.package_hash).toBe(pkg.package_hash);
  });

  it("requires governance review for low confidence classifications", () => {
    const pkg = buildTaskClassificationPackage({ scenario: "LOW_CONFIDENCE" });

    expect(pkg.classification.confidence.level).toBe("LOW");
    expect(pkg.classification.governance_outcome.review_required).toBe(true);
    expect(pkg.validation.validation_state).toBe("PASS");
  });

  it.each([
    ["UNCERTIFIED_AGENT", "UNCERTIFIED_AGENT"],
    ["AMBIGUOUS_CLASSIFICATION", "AMBIGUOUS_CLASSIFICATION"],
    ["MULTIPLE_OWNERS", "MULTIPLE_EXECUTION_OWNERS"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY"],
    ["CROSS_TENANT_ROUTING", "CROSS_TENANT_ROUTING"],
    ["NONDETERMINISTIC_DECISION", "NONDETERMINISTIC_DECISION"],
    ["INCOMPLETE_DEPENDENCY_ANALYSIS", "INCOMPLETE_DEPENDENCY_ANALYSIS"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [TaskClassificationScenario, TaskClassificationFailureReason][])("rejects %s", (scenario, reason) => {
    const pkg = buildTaskClassificationPackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.replay.validation_state).toBe("FAIL");
  });

  it("keeps blocked tasks non-executable while preserving governance evidence", () => {
    const pkg = buildTaskClassificationPackage({ scenario: "AUTHORITY_FAILURE" });

    expect(pkg.classification.classification).toBe("BLOCKED");
    expect(pkg.classification.classification_state).toBe("BLOCKED");
    expect(pkg.classification.execution_owner_id).toBe("blocked:governance");
    expect(pkg.classification.governance_outcome.alerts.length).toBeGreaterThan(0);
    expect(pkg.classification.replay_reference).toBeTruthy();
  });

  it("exposes classification visibility", () => {
    const pkg = buildTaskClassificationPackage({ scenario: "DEPENDENCY_INCOMPLETE" });
    const surface = buildTaskClassificationVisibilitySurface(pkg);
    const directDecision = classifyDelegationTask();

    expect(surface.classification).toBe("DEFERRED");
    expect(surface.classification_state).toBe("DEFERRED");
    expect(surface.integrity_status).toBe("VALID");
    expect(directDecision.classification).toBe("AGENT");
  });
});
