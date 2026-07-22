import { describe, expect, it } from "vitest";
import {
  getProductionReadinessFoundationBundle,
  replayProductionReadinessFoundation,
  runProductionReadinessFoundation,
  validateProductionReadinessFoundation,
} from "@/services/production-readiness-foundation";
import type { ProductionReadinessFailure } from "@/types/production-readiness-foundation";

describe("Mission Control Phase 15.1 Production Readiness Foundation", () => {
  it("publishes production readiness doctrine", () => {
    const bundle = getProductionReadinessFoundationBundle();

    expect(bundle.doctrine.version).toBe("production-readiness-foundation/v15.1");
    expect(bundle.doctrine.upstream_phase).toBe("phase14-certification-gate/v14.12");
    expect(bundle.doctrine.lifecycle).toEqual(["REGISTERED", "PREPARING", "EVIDENCE_COLLECTION", "QUALIFICATION_REVIEW", "READY_FOR_PROMOTION", "PROMOTION_APPROVED", "DEPLOYMENT_PENDING", "DEPLOYED", "MONITORING", "SUPERSEDED", "ROLLED_BACK", "ARCHIVED"]);
    expect(bundle.doctrine.promotion_path).toEqual(["SYNTHETIC", "QUALIFICATION", "PRE_PRODUCTION", "PRODUCTION"]);
    expect(bundle.doctrine.required_evidence).toHaveLength(10);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines the production readiness constitutional contract", () => {
    const result = runProductionReadinessFoundation();

    expect(result.contract.production_qualification_required).toBe(true);
    expect(result.contract.governance_immutable).toBe(true);
    expect(result.contract.replay_required).toBe(true);
    expect(result.contract.rollback_required).toBe(true);
    expect(result.contract.fail_closed).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
    expect(result.contract.deployment_authority_implies_execution_authority).toBe(false);
  });

  it("qualifies lifecycle, scope, and release identity", () => {
    const result = runProductionReadinessFoundation();

    expect(result.lifecycle.states).toHaveLength(12);
    expect(result.lifecycle.deterministic_transitions).toBe(true);
    expect(result.lifecycle.skipped_states_allowed).toBe(false);
    expect(result.scope_registry.production_environments).toEqual(["SYNTHETIC", "QUALIFICATION", "PRE_PRODUCTION", "PRODUCTION"]);
    expect(result.scope_registry.immutable_after_approval).toBe(true);
    expect(result.release_record.release_lineage.length).toBeGreaterThan(0);
    expect(result.release_record.certification_refs).toEqual([result.phase14_certification_ref]);
    expect(result.release_record.rollback_plan_ref).toBe(result.rollback.rollback_plan_id);
  });

  it("enforces promotion rules and authority hierarchy", () => {
    const result = runProductionReadinessFoundation();

    expect(result.promotion_rules.no_skipped_environments).toBe(true);
    expect(result.promotion_rules.evidence_completion_required).toBe(true);
    expect(result.promotion_rules.successful_certification_required).toBe(true);
    expect(result.promotion_rules.governance_approval_required).toBe(true);
    expect(result.promotion_rules.rollback_readiness_required).toBe(true);
    expect(result.authority_model.governance_approves_policy).toBe(true);
    expect(result.authority_model.operators_approve_operational_promotion).toBe(true);
    expect(result.authority_model.mission_control_recommends_only).toBe(true);
    expect(result.authority_model.assessment_system_authorizes_deployment).toBe(false);
  });

  it("requires evidence, certification inheritance, rollback, and boundary governance", () => {
    const result = runProductionReadinessFoundation();

    expect(result.evidence_registry.required_evidence).toHaveLength(10);
    expect(result.evidence_registry.evidence_refs).toHaveLength(10);
    expect(result.evidence_registry.missing_evidence_blocks_promotion).toBe(true);
    expect(result.certification_inheritance.synthetic_certification_ref).toBe(result.phase14_certification_ref);
    expect(result.certification_inheritance.invalid_inheritance_blocked).toBe(true);
    expect(result.rollback.rollback_validated_before_promotion).toBe(true);
    expect(result.rollback.replayable).toBe(true);
    expect(result.boundary_governance.execution_authority_protected).toBe(true);
    expect(result.boundary_governance.production_effect_boundaries_enforced).toBe(true);
  });

  it("produces a complete readiness report", () => {
    const result = runProductionReadinessFoundation();

    expect(result.readiness_report.lifecycle_valid).toBe(true);
    expect(result.readiness_report.promotion_rules_valid).toBe(true);
    expect(result.readiness_report.authority_hierarchy_valid).toBe(true);
    expect(result.readiness_report.rollback_ready).toBe(true);
    expect(result.readiness_report.evidence_complete).toBe(true);
    expect(result.readiness_report.boundary_enforced).toBe(true);
    expect(result.readiness_report.replay_reproducible).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runProductionReadinessFoundation();
    const second = runProductionReadinessFoundation();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProductionReadinessFoundation(first).valid).toBe(true);
    expect(replayProductionReadinessFoundation(first)).toBe(true);
  });

  it("executes the complete Phase 15.1 certification matrix", () => {
    const result = runProductionReadinessFoundation();

    expect(result.certification_tests).toHaveLength(24);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Production Readiness Contract approved",
      "Deployment lifecycle deterministic",
      "Production Scope Registry complete",
      "Release identities immutable",
      "Environment promotion rules enforced",
      "Promotion authority explicit",
      "Governance approval required",
      "Mission Control advisory-only boundary preserved",
      "Production-effect boundaries enforced",
      "Required evidence defined",
      "Missing evidence blocks promotion",
      "Certification inheritance deterministic",
      "Invalid inheritance blocked",
      "Rollback mandatory before promotion",
      "Rollback replay reproducible",
      "Release lineage preserved",
      "Promotion replay deterministic",
      "Audit trail immutable",
      "Fail-closed behavior enforced",
      "Synthetic certification required before promotion",
      "Qualification replay reproducible",
      "Constitutional authority hierarchy preserved",
      "Production governance deterministic",
      "Phase 15.1 foundation ready for subsequent production qualification phases",
    ]);
  });

  it("supports conditional pass for non-constitutional readiness warnings", () => {
    const result = runProductionReadinessFoundation({ scenario: "NON_CONSTITUTIONAL_READINESS_WARNING" });
    const validation = validateProductionReadinessFoundation(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "PRODUCTION_CONTRACT_NOT_APPROVED",
    "LIFECYCLE_NON_DETERMINISTIC",
    "SCOPE_REGISTRY_INCOMPLETE",
    "RELEASE_IDENTITIES_MUTABLE",
    "PROMOTION_RULES_NOT_ENFORCED",
    "PROMOTION_AUTHORITY_AMBIGUOUS",
    "GOVERNANCE_APPROVAL_NOT_REQUIRED",
    "ADVISORY_BOUNDARY_BREACH",
    "PRODUCTION_EFFECT_BOUNDARY_NOT_ENFORCED",
    "REQUIRED_EVIDENCE_UNDEFINED",
    "MISSING_EVIDENCE_ALLOWED_PROMOTION",
    "CERTIFICATION_INHERITANCE_NON_DETERMINISTIC",
    "INVALID_INHERITANCE_NOT_BLOCKED",
    "ROLLBACK_NOT_MANDATORY",
    "ROLLBACK_REPLAY_NOT_REPRODUCIBLE",
    "RELEASE_LINEAGE_LOST",
    "PROMOTION_REPLAY_NON_DETERMINISTIC",
    "AUDIT_TRAIL_MUTABLE",
    "FAIL_CLOSED_NOT_ENFORCED",
    "SYNTHETIC_CERTIFICATION_NOT_REQUIRED",
    "QUALIFICATION_REPLAY_NOT_REPRODUCIBLE",
    "AUTHORITY_HIERARCHY_BREACH",
    "PRODUCTION_GOVERNANCE_NON_DETERMINISTIC",
    "FOUNDATION_NOT_READY",
  ] as const)("fails certification for %s", (scenario: ProductionReadinessFailure) => {
    const result = runProductionReadinessFoundation({ scenario });
    const validation = validateProductionReadinessFoundation(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested release identity tampering", () => {
    const result = runProductionReadinessFoundation();
    const tampered = {
      ...result,
      release_record: {
        ...result.release_record,
        release_version: "15.1.1",
      },
    };

    expect(validateProductionReadinessFoundation(tampered).valid).toBe(false);
  });
});
