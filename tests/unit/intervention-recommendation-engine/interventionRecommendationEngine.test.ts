import { describe, expect, it } from "vitest";
import {
  buildInterventionRecommendationDashboardSurface,
  buildInterventionRecommendationPackage,
  computeInterventionEvidenceHash,
  computeInterventionMetadataHash,
  computeInterventionRecommendationHash,
  getInterventionRecommendationFramework,
} from "@/services/intervention-recommendation-engine";
import type {
  InterventionRecommendationCategory,
  InterventionRecommendationFailureReason,
  InterventionRecommendationScenario,
} from "@/types/intervention-recommendation-engine";

describe("Mission Control Phase 8E.D Intervention Recommendation Engine", () => {
  it("publishes advisory-only intervention doctrine, states, categories, and priorities", () => {
    const framework = getInterventionRecommendationFramework();

    expect(framework.doctrine.engine_version).toBe("intervention-recommendation-engine/v8E.D");
    expect(framework.doctrine.principles).toContain("advisory-only-recommendations");
    expect(framework.doctrine.principles).toContain("no-execution-authority");
    expect(framework.doctrine.principles).toContain("operator-supremacy");
    expect(framework.doctrine.states).toContain("PUBLISHED");
    expect(framework.doctrine.categories).toEqual(["INTERVENTION", "PAUSE", "ROLLBACK", "CONFIDENCE"]);
    expect(framework.doctrine.priorities).toEqual(["LOW", "NORMAL", "HIGH", "URGENT", "IMMEDIATE"]);
  });

  it("builds a stable baseline recommendation without executing intervention authority", () => {
    const pkg = buildInterventionRecommendationPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.engine_version).toBe("intervention-recommendation-engine/v8E.D");
    expect(pkg.recommendation_state).toBe("PUBLISHED");
    expect(pkg.recommendation.recommendation_category).toBe("INTERVENTION");
    expect(pkg.recommendation.recommendation_type).toBe("OPERATOR_REVIEW");
    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.validation.ready_for_publication).toBe(true);
    expect(pkg.advisory_only).toBe(true);
    expect(pkg.execution_performed).toBe(false);
    expect(pkg.rollback_performed).toBe(false);
    expect(pkg.pause_performed).toBe(false);
    expect(pkg.authority_granted).toBe(false);
    expect(pkg.governance_bypassed).toBe(false);
    expect(pkg.hidden_logic_used).toBe(false);
    expect(pkg.recommendation.operator_required).toBe(true);
  });

  it("produces deterministic hashes, evidence, and replay reconstruction", () => {
    const first = buildInterventionRecommendationPackage();
    const second = buildInterventionRecommendationPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeInterventionRecommendationHash(first.recommendation)).toBe(first.recommendation.integrity_hash);
    expect(computeInterventionEvidenceHash(first.recommendation_evidence)).toBe(first.recommendation_evidence.integrity_hash);
    expect(computeInterventionMetadataHash(first.recommendation_metadata)).toBe(first.recommendation_metadata.integrity_hash);
    expect(first.replay.reconstructed_pipeline).toEqual(["Runtime Alert Received", "Evidence Collection", "Impact Analysis", "Authority Validation", "Recommendation Generation", "Governance Validation", "Evidence Packaging", "Recommendation Published"]);
    expect(first.replay.validation_state).toBe("PASS");
  });

  it.each([
    ["MINOR_EXECUTION_DRIFT", "INTERVENTION", "OPERATOR_REVIEW"],
    ["POLICY_INCONSISTENCY", "INTERVENTION", "GOVERNANCE_REVIEW"],
    ["EVIDENCE_UNCERTAINTY", "INTERVENTION", "EVIDENCE_REVIEW"],
    ["CONFIDENCE_DEGRADATION", "CONFIDENCE", "COLLECT_ADDITIONAL_EVIDENCE"],
    ["RECOMMENDATION_INSTABILITY", "CONFIDENCE", "REGENERATE_RECOMMENDATION"],
    ["GOVERNANCE_UNCERTAINTY", "CONFIDENCE", "REVALIDATE_GOVERNANCE"],
    ["EXECUTION_INSTABILITY", "PAUSE", "TEMPORARY_EXECUTION_PAUSE"],
    ["CHECKPOINT_FAILURE", "PAUSE", "CHECKPOINT_PAUSE"],
    ["DEPENDENCY_FAILURE", "PAUSE", "DEPENDENCY_PAUSE"],
    ["CRITICAL_EXECUTION_DRIFT", "ROLLBACK", "CHECKPOINT_ROLLBACK"],
    ["SEVERE_WORKFLOW_CORRUPTION", "ROLLBACK", "WORKFLOW_ROLLBACK"],
    ["UNRECOVERABLE_DEGRADATION", "ROLLBACK", "RECOVERY_RECOMMENDATION"],
  ] as readonly [InterventionRecommendationScenario, InterventionRecommendationCategory, string][])("recommends %s as %s/%s without autonomous action", (scenario, category, type) => {
    const pkg = buildInterventionRecommendationPackage({ scenario });

    expect(pkg.recommendation.recommendation_category).toBe(category);
    expect(pkg.recommendation.recommendation_type).toBe(type);
    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.validation.ready_for_publication).toBe(true);
    expect(pkg.recommendation.operator_required).toBe(true);
    expect(pkg.execution_performed).toBe(false);
    expect(pkg.rollback_performed).toBe(false);
    expect(pkg.pause_performed).toBe(false);
  });

  it.each([
    ["NONDETERMINISTIC_RECOMMENDATION", "RECOMMENDATION_NONDETERMINISTIC"],
    ["MISSING_SUPPORTING_EVIDENCE", "SUPPORTING_EVIDENCE_MISSING"],
    ["GOVERNANCE_REVIEW_INCOMPLETE", "GOVERNANCE_REVIEW_INCOMPLETE"],
    ["EVIDENCE_REVIEW_INCOMPLETE", "EVIDENCE_REVIEW_OMITS_OBSERVATIONS"],
    ["UNSAFE_PAUSE", "PAUSE_RECOMMENDATION_UNSAFE"],
    ["ROLLBACK_BOUNDARY_VIOLATION", "ROLLBACK_BOUNDARY_VIOLATION"],
    ["CONFIDENCE_RESTORATION_UNJUSTIFIED", "CONFIDENCE_RESTORATION_UNJUSTIFIED"],
    ["POLICY_REFERENCES_MISSING", "POLICY_REFERENCES_MISSING"],
    ["CONSTITUTIONAL_REFERENCES_MISSING", "CONSTITUTIONAL_REFERENCES_MISSING"],
    ["AUTHORITY_UNDEFINED", "AUTHORITY_REQUIREMENTS_UNDEFINED"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_MISMATCH"],
    ["LINEAGE_INCOMPLETE", "LINEAGE_INCOMPLETE"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["HIDDEN_LOGIC", "HIDDEN_RECOMMENDATION_LOGIC"],
    ["AUTONOMOUS_INTERVENTION", "AUTONOMOUS_INTERVENTION_ATTEMPTED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_OR_OPERATOR_BYPASS"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [InterventionRecommendationScenario, InterventionRecommendationFailureReason][])("rejects unsafe scenario %s", (scenario, reason) => {
    const pkg = buildInterventionRecommendationPackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(reason);
    expect(pkg.validation.ready_for_publication).toBe(false);
    expect(pkg.replay.validation_state).toBe("FAIL");
    expect(pkg.execution_performed).toBe(false);
    expect(pkg.rollback_performed).toBe(false);
    expect(pkg.pause_performed).toBe(false);
    expect(pkg.authority_granted).toBe(false);
  });

  it("projects dashboard status for integrity failures", () => {
    const dashboard = buildInterventionRecommendationDashboardSurface(buildInterventionRecommendationPackage({ scenario: "HASH_MISMATCH" }));

    expect(dashboard.validation_state).toBe("FAIL");
    expect(dashboard.failures).toContain("INTEGRITY_HASH_MISMATCH");
    expect(dashboard.integrity_status).toBe("INVALID");
  });
});
