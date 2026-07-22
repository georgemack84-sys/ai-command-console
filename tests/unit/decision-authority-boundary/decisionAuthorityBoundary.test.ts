import { describe, expect, it } from "vitest";
import { classifyDecision } from "@/services/decision-classification";
import {
  DECISION_AUTHORITY_HIERARCHY,
  DECISION_AUTHORITY_MATRIX,
  buildDecisionAuthorityObservability,
  createAuthorityBoundaryRecord,
  enforceAdvisoryOnly,
  evaluateAuthorityEscalation,
  getDecisionAuthorityBoundaryFramework,
  replayAuthorityDecision,
  resolveApprovalRequirements,
  validateAuthorityBoundary,
} from "@/services/decision-authority-boundary";
import type { DecisionAuthorityFailure, DecisionAuthorityInput, DecisionAuthorityLevel } from "@/types/decision-authority-boundary";

describe("Mission Control Phase 9.1.5 Authority Boundary Framework", () => {
  it("publishes immutable authority hierarchy, matrix, baseline record, validation, and replay", () => {
    const framework = getDecisionAuthorityBoundaryFramework();

    expect(framework.hierarchy).toEqual(["CONSTITUTION", "GOVERNANCE", "OPERATOR", "MISSION_CONFIGURATION", "DECISION_ORCHESTRATION", "RECOMMENDATION"]);
    expect(framework.matrix).toHaveLength(7);
    expect(framework.record.authority_level).toBe("ADVISORY");
    expect(framework.record.advisory_only).toBe(true);
    expect(framework.record.execution_authorized).toBe(false);
    expect(framework.validation.validation_status).toBe("VALID");
    expect(framework.replay.replay_valid).toBe(true);
  });

  it("defines permitted and prohibited authority domains", () => {
    const orchestration = DECISION_AUTHORITY_MATRIX.find((entry) => entry.domain === "DECISION_ORCHESTRATION")!;
    const constitution = DECISION_AUTHORITY_MATRIX.find((entry) => entry.domain === "CONSTITUTION")!;

    expect(orchestration.permitted).toContain("recommend");
    expect(orchestration.prohibited).toContain("execute actions");
    expect(orchestration.prohibited).toContain("self-approve");
    expect(constitution.precedence).toBeLessThan(orchestration.precedence);
    expect(DECISION_AUTHORITY_HIERARCHY[0]).toBe("CONSTITUTION");
  });

  it.each([
    ["ADVISORY", []],
    ["OPERATOR_APPROVAL_REQUIRED", ["OPERATOR"]],
    ["GOVERNANCE_APPROVAL_REQUIRED", ["OPERATOR", "GOVERNANCE"]],
    ["CONSTITUTIONAL_REVIEW_REQUIRED", ["OPERATOR", "GOVERNANCE", "CONSTITUTION"]],
    ["CERTIFICATION_REQUIRED", ["OPERATOR", "GOVERNANCE", "CONSTITUTION", "CERTIFICATION"]],
  ] satisfies [DecisionAuthorityLevel, readonly string[]][])("resolves deterministic approval chain for %s", (level, chain) => {
    expect(resolveApprovalRequirements(level)).toEqual(chain);
    expect(evaluateAuthorityEscalation({ authority_level: level }).escalation_path).toEqual(chain);
  });

  it("assigns authority levels by decision category", () => {
    const advisory = createAuthorityBoundaryRecord({ classification: classifyDecision({ category: "RECOMMENDATION_SELECTION" }) });
    const governance = createAuthorityBoundaryRecord({ classification: classifyDecision({ category: "RISK_RESPONSE" }) });
    const constitutional = createAuthorityBoundaryRecord({ classification: classifyDecision({ category: "POLICY_CONFLICT" }) });
    const certification = createAuthorityBoundaryRecord({ classification: classifyDecision({ category: "CERTIFICATION_DECISION" }) });

    expect(advisory.authority_level).toBe("ADVISORY");
    expect(governance.approval_chain).toEqual(["OPERATOR", "GOVERNANCE"]);
    expect(constitutional.approval_chain).toEqual(["OPERATOR", "GOVERNANCE", "CONSTITUTION"]);
    expect(certification.approval_chain).toEqual(["OPERATOR", "GOVERNANCE", "CONSTITUTION", "CERTIFICATION"]);
  });

  it("validates complete approval evidence for higher authority records", () => {
    const record = createAuthorityBoundaryRecord({ classification: classifyDecision({ category: "CERTIFICATION_DECISION" }) });
    const valid = validateAuthorityBoundary(record, {
      operator_approval_present: true,
      governance_approval_present: true,
      constitutional_review_complete: true,
      certification_approval_present: true,
    });
    const missing = validateAuthorityBoundary(record, { scenario: "MISSING_APPROVAL" });

    expect(valid.checks.approval_chain_valid).toBe(true);
    expect(missing.validation_status).toBe("FAILED_CLOSED");
    expect(missing.failures).toContain("OPERATOR_APPROVAL_MISSING");
    expect(missing.failures).toContain("CERTIFICATION_APPROVAL_MISSING");
  });

  it("enforces advisory-only operation boundaries", () => {
    expect(enforceAdvisoryOnly({ advisory_only: true, execution_authorized: false, requested_operations: ["classify", "recommend", "explain"] })).toEqual([]);
    expect(enforceAdvisoryOnly({ advisory_only: true, execution_authorized: false, requested_operations: ["execute deployment"] })).toContain("UNAUTHORIZED_EXECUTION");
    expect(validateAuthorityBoundary(createAuthorityBoundaryRecord({ scenario: "EXECUTION_REQUEST" }), { scenario: "EXECUTION_REQUEST" }).failures).toContain("UNAUTHORIZED_EXECUTION");
  });

  it.each([
    ["EXECUTION_REQUEST", "UNAUTHORIZED_EXECUTION"],
    ["PRIVILEGE_ESCALATION", "PRIVILEGE_ESCALATION"],
    ["SELF_APPROVAL", "SELF_AUTHORIZATION"],
    ["SELF_CERTIFICATION", "SELF_CERTIFICATION"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS"],
    ["CONSTITUTIONAL_BYPASS", "CONSTITUTIONAL_BYPASS"],
    ["OPERATOR_IMPERSONATION", "OPERATOR_IMPERSONATION"],
    ["TENANT_LEAK", "TENANT_AUTHORITY_LEAK"],
    ["HIDDEN_EXECUTION", "HIDDEN_EXECUTION_PATH"],
    ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISSING"],
  ] satisfies [DecisionAuthorityInput["scenario"], DecisionAuthorityFailure][])("fails closed for %s", (scenario, failure) => {
    const classification = classifyDecision();
    const record = createAuthorityBoundaryRecord({ classification, scenario });
    const validation = validateAuthorityBoundary(record, { classification, scenario });

    expect(validation.validation_status).toBe("FAILED_CLOSED");
    expect(validation.failures).toContain(failure);
    expect(record.execution_authorized).toBe(false);
    expect(record.self_approval_authorized).toBe(false);
  });

  it("replays authority decisions deterministically and detects tampering", () => {
    const record = createAuthorityBoundaryRecord();
    const replay = replayAuthorityDecision(record);
    const tampered = { ...record, integrity_hash: "tampered" };

    expect(replay.reconstructed_authority_level).toBe(record.authority_level);
    expect(replay.reconstructed_approval_chain).toEqual(record.approval_chain);
    expect(replay.reconstructed_hash).toBe(record.integrity_hash);
    expect(replayAuthorityDecision(tampered).failures).toContain("INTEGRITY_HASH_MISMATCH");
    expect(validateAuthorityBoundary(tampered).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("reports authority observability metrics", () => {
    const valid = createAuthorityBoundaryRecord();
    const execution = createAuthorityBoundaryRecord({ scenario: "EXECUTION_REQUEST" });
    const constitutional = createAuthorityBoundaryRecord({ scenario: "CONSTITUTIONAL_BYPASS" });
    const validations = [
      validateAuthorityBoundary(valid),
      validateAuthorityBoundary(execution, { scenario: "EXECUTION_REQUEST" }),
      validateAuthorityBoundary(constitutional, { scenario: "CONSTITUTIONAL_BYPASS" }),
    ];
    const metrics = buildDecisionAuthorityObservability([valid, execution, constitutional], validations);

    expect(metrics.authority_validation_requests).toBe(3);
    expect(metrics.advisory_only_violations).toBe(1);
    expect(metrics.unauthorized_execution_attempts).toBe(1);
    expect(metrics.constitutional_rejections).toBe(1);
    expect(metrics.escalation_frequency).toBeGreaterThan(0);
  });
});
