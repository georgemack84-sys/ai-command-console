import { describe, expect, it } from "vitest";
import {
  analyzeMissionExperience,
  buildPatternAnalysisObservabilitySurface,
  getPatternDiscoveryExperienceAnalysisEngine,
  listExperienceCorrelations,
  listOperationalPatterns,
  listPatternAnalysisAudits,
  listPatternTrends,
  validatePatternAnalysis,
} from "@/services/pattern-discovery-experience-analysis";
import type { PatternAnalysisFailure, PatternAnalysisScenario } from "@/types/pattern-discovery-experience-analysis";

describe("pattern discovery experience analysis engine", () => {
  it("publishes the deterministic analysis engine bundle", () => {
    const bundle = getPatternDiscoveryExperienceAnalysisEngine();

    expect(bundle.doctrine.engine_version).toBe("pattern-discovery-experience-analysis/v8ALT.9.3");
    expect(bundle.doctrine.final_state).toBe("PATTERN_DISCOVERY_ANALYSIS_READY");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.repository.analysis_only).toBe(true);
    expect(bundle.repository.template_generation_authorized).toBe(false);
    expect(bundle.repository.runtime_influence_authorized).toBe(false);
    expect(bundle.repository.planning_modification_authorized).toBe(false);
    expect(bundle.repository.historical_truth_mutable).toBe(false);
  });

  it("derives certified patterns, correlations, and trends from captured mission knowledge", () => {
    const repository = analyzeMissionExperience();

    expect(repository.final_state).toBe("PATTERN_ANALYSIS_COMPLETE");
    expect(repository.patterns.length).toBeGreaterThan(0);
    expect(repository.correlations.length).toBe(repository.patterns.length);
    expect(repository.trends.length).toBe(repository.patterns.length);
    expect(repository.patterns.every((pattern) => pattern.classification_state === "CERTIFIED")).toBe(true);
    expect(repository.patterns.every((pattern) => pattern.evidence_chain.length > 0)).toBe(true);
    expect(repository.patterns.every((pattern) => pattern.replay_references.length > 0)).toBe(true);
    expect(repository.patterns.every((pattern) => pattern.lineage_references.length > 0)).toBe(true);
  });

  it("lists repository projections without adding authority", () => {
    expect(listOperationalPatterns().length).toBeGreaterThan(0);
    expect(listExperienceCorrelations().length).toBeGreaterThan(0);
    expect(listPatternTrends().length).toBeGreaterThan(0);
    expect(listPatternAnalysisAudits().length).toBe(0);
  });

  it("keeps analysis immutable, tenant-isolated, and non-intervening", () => {
    const repository = analyzeMissionExperience();

    expect(repository.patterns.every((pattern) => pattern.analysis_only)).toBe(true);
    expect(repository.patterns.every((pattern) => !pattern.template_generation_authorized)).toBe(true);
    expect(repository.patterns.every((pattern) => !pattern.runtime_influence_authorized)).toBe(true);
    expect(repository.patterns.every((pattern) => !pattern.planning_modification_authorized)).toBe(true);
    expect(repository.patterns.every((pattern) => !pattern.historical_truth_mutable)).toBe(true);
    expect(repository.patterns.every((pattern) => pattern.tenant_id === "tenant:alpha")).toBe(true);
  });

  it.each([
    ["INVALID_CAPTURE_PACKAGE", "INVALID_CAPTURE_PACKAGE"],
    ["INCOMPLETE_EVIDENCE", "INCOMPLETE_EVIDENCE_DETECTED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_FAILURE_DETECTED"],
    ["ORPHANED_LINEAGE", "ORPHANED_LINEAGE_DETECTED"],
    ["GOVERNANCE_VIOLATION", "GOVERNANCE_VIOLATION_DETECTED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION_DETECTED"],
    ["UNSTABLE_ANALYTICAL_RESULT", "UNSTABLE_ANALYTICAL_RESULT_DETECTED"],
    ["NONDETERMINISTIC_DISCOVERY", "NONDETERMINISTIC_DISCOVERY_DETECTED"],
    ["DUPLICATE_CERTIFIED_PATTERN", "DUPLICATE_CERTIFIED_PATTERN_DETECTED"],
    ["CROSS_TENANT_CORRELATION_ATTEMPT", "CROSS_TENANT_CORRELATION_DETECTED"],
    ["HISTORICAL_REWRITE_ATTEMPT", "HISTORICAL_REWRITE_DETECTED"],
    ["TEMPLATE_GENERATION_ATTEMPTED", "TEMPLATE_GENERATION_ATTEMPTED"],
    ["RUNTIME_INFLUENCE_ATTEMPTED", "RUNTIME_INFLUENCE_ATTEMPTED"],
    ["PLANNING_MODIFICATION_ATTEMPTED", "PLANNING_MODIFICATION_ATTEMPTED"],
  ] satisfies [PatternAnalysisScenario, PatternAnalysisFailure][])("fails closed and audits %s", (scenario, failure) => {
    const repository = analyzeMissionExperience({ scenario });
    const validation = validatePatternAnalysis(repository);

    expect(repository.final_state).toBe("PATTERN_ANALYSIS_REJECTED");
    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
    expect(repository.audits.some((record) => record.rejection_reason === failure)).toBe(true);
    expect(repository.audits.every((record) => record.immutable && record.append_only)).toBe(true);
  });

  it("publishes pattern analysis observability", () => {
    const surface = buildPatternAnalysisObservabilitySurface();

    expect(surface.final_state).toBe("PATTERN_ANALYSIS_COMPLETE");
    expect(surface.pattern_count).toBeGreaterThan(0);
    expect(surface.correlation_count).toBe(surface.pattern_count);
    expect(surface.trend_count).toBe(surface.pattern_count);
    expect(surface.audit_count).toBe(0);
    expect(surface.runtime_influence_authorized).toBe(false);
    expect(surface.integrity_hash).toBeTruthy();
  });
});
