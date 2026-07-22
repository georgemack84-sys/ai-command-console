import { describe, expect, it } from "vitest";
import {
  analyzeReadinessGaps,
  buildReadinessGapObservabilitySurface,
  getReadinessGapAnalysisBundle,
  listImprovementPriorities,
  listReadinessDependencies,
  listReadinessGapLedger,
  listReadinessGaps,
  validateReadinessGapAnalysis,
} from "@/services/readiness-gap-analysis-engine";
import type { ReadinessGapFailure, ReadinessGapScenario } from "@/types/readiness-gap-analysis-engine";

describe("readiness gap analysis engine", () => {
  it("publishes the deterministic advisory-only readiness bundle", () => {
    const bundle = getReadinessGapAnalysisBundle();

    expect(bundle.doctrine.engine_version).toBe("readiness-gap-analysis-engine/v8ALT.11.6");
    expect(bundle.doctrine.final_state).toBe("READINESS_GAP_ANALYSIS_ENGINE_READY");
    expect(bundle.repository.final_state).toBe("READINESS_GAP_ANALYSIS_COMPLETE");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.advisory_only).toBe(true);
    expect(bundle.repository.advancement_authorized).toBe(false);
    expect(bundle.repository.production_certification_authorized).toBe(false);
    expect(bundle.repository.corrective_action_authorized).toBe(false);
    expect(bundle.repository.execution_behavior_change_authorized).toBe(false);
  });

  it("builds readiness findings, dependencies, priorities, and ledger", () => {
    const repository = analyzeReadinessGaps();

    expect(repository.gaps.map((gap) => gap.category)).toEqual(expect.arrayContaining(["MISSING_REQUIREMENT", "WEAK_DOMAIN", "CERTIFICATION_GAP", "GOVERNANCE_GAP", "CONSTITUTIONAL_GAP", "REPLAY_GAP", "ARCHITECTURAL_GAP"]));
    expect(repository.dependencies).toHaveLength(8);
    expect(repository.priorities).toHaveLength(repository.gaps.length);
    expect(repository.ledger).toHaveLength(1);
    expect(repository.record.readiness_score).toBe(48);
    expect(repository.record.readiness_state).toBe("NOT_READY");
    expect(repository.record.advancement_eligibility).toBe("ADVISORY_BLOCKED");
    expect(repository.record.certification_readiness).toBe("BLOCKED_SIGNAL");
    expect(repository.failures).toEqual([]);
  });

  it("uses the canonical domain model for runtime dependencies", () => {
    const repository = analyzeReadinessGaps();
    const dependencyDomains = repository.dependencies.map((entry) => entry.domain);

    expect(repository.history.domain_improvements).toHaveLength(10);
    expect(dependencyDomains).toContain("EXECUTION_INTELLIGENCE");
    expect(dependencyDomains).toContain("RESILIENCE");
    expect(dependencyDomains).toContain("VISIBILITY");
    expect(dependencyDomains).not.toContain("RUNTIME_ASSURANCE");
    expect(repository.report.readiness_explanation).toContain("runtime dependencies are represented through execution, resilience, and visibility");
  });

  it("keeps readiness analysis deterministic and exposes slices", () => {
    const first = analyzeReadinessGaps();
    const second = analyzeReadinessGaps();

    expect(second.integrity_hash).toBe(first.integrity_hash);
    expect(second.report.integrity_hash).toBe(first.report.integrity_hash);
    expect(listReadinessGaps()).toHaveLength(7);
    expect(listReadinessDependencies()).toHaveLength(8);
    expect(listImprovementPriorities()).toHaveLength(7);
    expect(listReadinessGapLedger()).toHaveLength(1);
  });

  it.each([
    ["MISSING_REQUIREMENTS_UNDETECTED", "MISSING_REQUIREMENTS_NOT_DETECTED"],
    ["INCONSISTENT_ARCHITECTURAL_GAPS", "ARCHITECTURAL_GAPS_INCONSISTENT"],
    ["WEAK_DOMAINS_MISCLASSIFIED", "WEAK_DOMAINS_INCORRECTLY_CLASSIFIED"],
    ["INCOMPLETE_DEPENDENCY_ANALYSIS", "DEPENDENCY_ANALYSIS_INCOMPLETE"],
    ["READINESS_REPLAY_MISMATCH", "READINESS_REPLAY_MISMATCHED"],
    ["GOVERNANCE_GAPS_MISSED", "GOVERNANCE_GAPS_MISSED"],
    ["CONSTITUTIONAL_GAPS_MISSED", "CONSTITUTIONAL_GAPS_MISSED"],
    ["REPLAY_DEFICIENCIES_UNDETECTED", "REPLAY_DEFICIENCIES_UNDETECTED"],
    ["CERTIFICATION_BLOCKERS_OMITTED", "CERTIFICATION_BLOCKERS_OMITTED"],
    ["INTEGRITY_VERIFICATION_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["HIDDEN_EVALUATION_LOGIC", "HIDDEN_EVALUATION_LOGIC_DETECTED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_BEHAVIOR_COMPROMISED"],
  ] satisfies [ReadinessGapScenario, ReadinessGapFailure][])("invalidates %s", (scenario, failure) => {
    const repository = analyzeReadinessGaps({ scenario });
    const validation = validateReadinessGapAnalysis(repository);

    expect(repository.final_state).toBe("READINESS_GAP_ANALYSIS_FAILED");
    expect(repository.failures).toContain(failure);
    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
    expect(repository.advancement_authorized).toBe(false);
    expect(repository.production_certification_authorized).toBe(false);
    expect(repository.corrective_action_authorized).toBe(false);
  });

  it("reports failure-specific validation gates", () => {
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "MISSING_REQUIREMENTS_UNDETECTED" })).missing_requirements_detected).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "INCONSISTENT_ARCHITECTURAL_GAPS" })).architectural_gaps_consistent).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "WEAK_DOMAINS_MISCLASSIFIED" })).weak_domains_correctly_classified).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "INCOMPLETE_DEPENDENCY_ANALYSIS" })).dependency_analysis_complete).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "READINESS_REPLAY_MISMATCH" })).readiness_replay_verified).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "GOVERNANCE_GAPS_MISSED" })).governance_gaps_detected).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "CONSTITUTIONAL_GAPS_MISSED" })).constitutional_gaps_detected).toBe(false);
    expect(validateReadinessGapAnalysis(analyzeReadinessGaps({ scenario: "TENANT_ISOLATION_VIOLATION" })).tenant_isolated).toBe(false);
  });

  it("publishes observability without action authority", () => {
    const surface = buildReadinessGapObservabilitySurface(analyzeReadinessGaps({ scenario: "INCOMPLETE_DEPENDENCY_ANALYSIS" }));

    expect(surface.final_state).toBe("READINESS_GAP_ANALYSIS_FAILED");
    expect(surface.gap_count).toBe(7);
    expect(surface.dependency_count).toBe(6);
    expect(surface.priority_count).toBe(7);
    expect(surface.ledger_count).toBe(1);
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.advisory_only).toBe(true);
    expect(surface.advancement_authorized).toBe(false);
    expect(surface.execution_behavior_change_authorized).toBe(false);
  });
});
