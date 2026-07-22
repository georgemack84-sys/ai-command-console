import { describe, expect, it } from "vitest";
import {
  getDeploymentOrchestrationPromotionGovernanceBundle,
  replayDeploymentOrchestrationPromotionGovernance,
  runDeploymentOrchestrationPromotionGovernance,
  validateDeploymentOrchestrationPromotionGovernance,
} from "@/services/deployment-orchestration-promotion-governance";
import type { DeploymentGovernanceFailure } from "@/types/deployment-orchestration-promotion-governance";

describe("Mission Control Phase 15.4 Deployment Orchestration & Promotion Governance", () => {
  it("publishes deployment governance doctrine", () => {
    const bundle = getDeploymentOrchestrationPromotionGovernanceBundle();

    expect(bundle.doctrine.version).toBe("deployment-orchestration-promotion-governance/v15.4");
    expect(bundle.doctrine.upstream_phase).toBe("production-environment-qualification/v15.3");
    expect(bundle.doctrine.lifecycle).toEqual(["RELEASE_REGISTERED", "ARTIFACT_VERIFIED", "ENVIRONMENT_QUALIFIED", "DEPLOYMENT_APPROVED", "CANARY_DEPLOYED", "PRODUCTION_VALIDATION", "PRODUCTION_ACTIVE", "ROLLED_BACK"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines advisory-only deployment governance and identity", () => {
    const result = runDeploymentOrchestrationPromotionGovernance();

    expect(result.contract.mission_control_authority).toBe("ASSESSMENT_ONLY");
    expect(result.contract.deployment_execution_externalized).toBe(true);
    expect(result.identity.deterministic).toBe(true);
    expect(result.identity.deployment_id.length).toBeGreaterThan(0);
    expect(result.orchestrator.performs_deployment_execution).toBe(false);
    expect(result.orchestrator.mutates_infrastructure).toBe(false);
  });

  it("evaluates promotion gates, state machine, and approvals", () => {
    const result = runDeploymentOrchestrationPromotionGovernance();

    expect(result.promotion_gate.decision).toBe("PROMOTION_APPROVED");
    expect(result.promotion_gate.certified_artifact).toBe(true);
    expect(result.promotion_gate.environment_qualified).toBe(true);
    expect(result.promotion_gate.deterministic).toBe(true);
    expect(result.state_machine.states).toHaveLength(8);
    expect(result.state_machine.transitions_immutable).toBe(true);
    expect(result.approval_workflow.approval_state).toBe("APPROVED");
    expect(result.approval_workflow.authority_verified).toBe(true);
  });

  it("preserves lineage, ledger, rollback, replay, security, and observability", () => {
    const result = runDeploymentOrchestrationPromotionGovernance();

    expect(result.lineage.artifact_lineage_refs.length).toBeGreaterThan(0);
    expect(result.lineage.rollback_lineage_refs.length).toBeGreaterThan(0);
    expect(result.ledger).toHaveLength(6);
    expect(result.ledger.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.tenant_isolated)).toBe(true);
    expect(result.rollback.preserves_history).toBe(true);
    expect(result.replay_explainability.deterministic).toBe(true);
    expect(result.security_authority.unauthorized_promotion_blocked).toBe(true);
    expect(result.observability.dashboard_complete).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runDeploymentOrchestrationPromotionGovernance();
    const second = runDeploymentOrchestrationPromotionGovernance();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateDeploymentOrchestrationPromotionGovernance(first).valid).toBe(true);
    expect(replayDeploymentOrchestrationPromotionGovernance(first)).toBe(true);
  });

  it("executes the complete Phase 15.4 certification matrix", () => {
    const result = runDeploymentOrchestrationPromotionGovernance();

    expect(result.certification_tests).toHaveLength(25);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Deployment Governance Contract valid",
      "Deployment identity deterministic",
      "Promotion lifecycle deterministic",
      "Deployment State Machine complete",
      "State transitions immutable",
      "Promotion Gate Engine deterministic",
      "Certified artifacts required for promotion",
      "Environment qualification enforced",
      "Failed qualification blocks promotion",
      "Approval Workflow deterministic",
      "Operator authorization validated",
      "Governance approval enforced where required",
      "Mission Control advisory-only boundary enforced",
      "Deployment execution authority externalized",
      "Unauthorized promotion blocked",
      "Deployment lineage complete",
      "Rollback lineage preserved",
      "Deployment Ledger immutable",
      "Replay deterministic",
      "Explainability reproducible",
      "Security policy enforcement verified",
      "Tenant isolation preserved",
      "Observability complete",
      "Audit evidence immutable",
      "Fail-closed behavior enforced",
    ]);
  });

  it("supports conditional pass for non-constitutional deployment warnings", () => {
    const result = runDeploymentOrchestrationPromotionGovernance({ scenario: "NON_CONSTITUTIONAL_DEPLOYMENT_WARNING" });
    const validation = validateDeploymentOrchestrationPromotionGovernance(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "DEPLOYMENT_GOVERNANCE_CONTRACT_INVALID",
    "DEPLOYMENT_IDENTITY_NON_DETERMINISTIC",
    "PROMOTION_LIFECYCLE_NON_DETERMINISTIC",
    "STATE_MACHINE_INCOMPLETE",
    "STATE_TRANSITIONS_MUTABLE",
    "PROMOTION_GATE_NON_DETERMINISTIC",
    "CERTIFIED_ARTIFACT_NOT_REQUIRED",
    "ENVIRONMENT_QUALIFICATION_NOT_ENFORCED",
    "FAILED_QUALIFICATION_ALLOWED_PROMOTION",
    "APPROVAL_WORKFLOW_NON_DETERMINISTIC",
    "OPERATOR_AUTHORIZATION_INVALID",
    "GOVERNANCE_APPROVAL_NOT_ENFORCED",
    "ADVISORY_BOUNDARY_BREACH",
    "DEPLOYMENT_EXECUTION_NOT_EXTERNALIZED",
    "UNAUTHORIZED_PROMOTION_NOT_BLOCKED",
    "DEPLOYMENT_LINEAGE_INCOMPLETE",
    "ROLLBACK_LINEAGE_LOST",
    "DEPLOYMENT_LEDGER_MUTABLE",
    "REPLAY_NON_DETERMINISTIC",
    "EXPLAINABILITY_NOT_REPRODUCIBLE",
    "SECURITY_POLICY_NOT_ENFORCED",
    "TENANT_ISOLATION_NOT_PRESERVED",
    "OBSERVABILITY_INCOMPLETE",
    "AUDIT_EVIDENCE_MUTABLE",
    "FAIL_CLOSED_NOT_ENFORCED",
  ] as const)("fails certification for %s", (scenario: DeploymentGovernanceFailure) => {
    const result = runDeploymentOrchestrationPromotionGovernance({ scenario });
    const validation = validateDeploymentOrchestrationPromotionGovernance(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested deployment state tampering", () => {
    const result = runDeploymentOrchestrationPromotionGovernance();
    const tampered = {
      ...result,
      state_machine: {
        ...result.state_machine,
        current_state: "ROLLED_BACK" as const,
      },
    };

    expect(validateDeploymentOrchestrationPromotionGovernance(tampered).valid).toBe(false);
  });
});
