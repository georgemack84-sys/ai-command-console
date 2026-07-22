import { describe, expect, it } from "vitest";
import {
  establishPatternMemoryRegistry,
  getPatternMemoryRegistry,
  replayPatternMemoryRegistry,
} from "@/services/pattern-memory-registry";
import type {
  PatternCategory,
  PatternMemoryFailure,
  PatternMemoryScenario,
  PatternSimilarityDimension,
} from "@/types/pattern-memory-registry";

describe("Mission Control Phase 10.13D Pattern Memory Registry", () => {
  const categories: readonly PatternCategory[] = [
    "OUTCOME_PATTERN",
    "FAILURE_PATTERN",
    "SUCCESS_PATTERN",
    "GOVERNANCE_PATTERN",
    "OPERATOR_PATTERN",
    "SIMULATION_PATTERN",
    "STRATEGY_PATTERN",
    "CONFIDENCE_PATTERN",
    "RISK_PATTERN",
    "CERTIFICATION_PATTERN",
  ];

  const dimensions: readonly PatternSimilarityDimension[] = [
    "OUTCOME_SIMILARITY",
    "STRATEGY_SIMILARITY",
    "EVIDENCE_SIMILARITY",
    "GOVERNANCE_SIMILARITY",
    "OPERATOR_SIMILARITY",
    "CONFIDENCE_SIMILARITY",
    "RISK_SIMILARITY",
    "SIMULATION_SIMILARITY",
    "CERTIFICATION_SIMILARITY",
  ];

  it("publishes the authoritative pattern memory registry contract", () => {
    const registry = getPatternMemoryRegistry();

    expect(registry.pattern_memory_registry_version).toBe("pattern-memory-registry/v1");
    expect(registry.supported_categories).toEqual(categories);
    expect(registry.supported_similarity_dimensions).toEqual(dimensions);
    expect(registry.api_surface.establish_registry).toBe("POST /pattern-memory-registry/establish");
    expect(registry.api_surface.retrieve_contract).toBe("GET /pattern-memory-registry/contract");
    expect(registry.api_surface.unauthorized_modification_supported).toBe(false);
    expect(registry.api_surface.unauthorized_reuse_supported).toBe(false);
    expect(registry.api_surface.overwrite_supported).toBe(false);
    expect(registry.api_surface.predictive_truth_supported).toBe(false);
    expect(registry.api_surface.execution_logic_supported).toBe(false);
    expect(registry.result.registry_identifier).toBe("PatternMemoryRegistry");
    expect(registry.result.status).toBe("AUTHORITATIVE");
  });

  it("establishes deterministic patterns, versions, similarity, replay, and integrity", () => {
    const first = establishPatternMemoryRegistry();
    const second = establishPatternMemoryRegistry();

    expect(first.pattern_records.map((record) => record.integrity_hash)).toEqual(second.pattern_records.map((record) => record.integrity_hash));
    expect(first.similarity_catalog.map((relation) => relation.integrity_hash)).toEqual(second.similarity_catalog.map((relation) => relation.integrity_hash));
    expect(first.version_history.map((version) => version.integrity_hash)).toEqual(second.version_history.map((version) => version.integrity_hash));
    expect(first.pattern_ledger.map((entry) => entry.integrity_hash)).toEqual(second.pattern_ledger.map((entry) => entry.integrity_hash));
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(replayPatternMemoryRegistry(first)).toBe(true);
  });

  it("qualifies and registers every supported pattern category", () => {
    const result = establishPatternMemoryRegistry();

    expect(result.qualification_report.qualified).toBe(true);
    expect(result.pattern_records).toHaveLength(10);
    expect(result.pattern_records.map((record) => record.pattern_type)).toEqual(categories);
    expect(result.pattern_records.every((record) => record.pattern_id.startsWith("pmr_"))).toBe(true);
    expect(result.pattern_records.every((record) => record.lifecycle_state === "ACTIVE")).toBe(true);
    expect(result.pattern_records.every((record) => record.evidence_refs.length > 0)).toBe(true);
    expect(result.pattern_records.every((record) => record.governance_refs.length > 0)).toBe(true);
    expect(result.pattern_records.every((record) => record.replay_refs.length > 0)).toBe(true);
  });

  it("maintains deterministic explainable similarity catalog", () => {
    const result = establishPatternMemoryRegistry();

    expect(result.similarity_catalog).toHaveLength(9);
    expect(result.similarity_catalog.every((relation) => relation.dimensions.length === 9)).toBe(true);
    expect(result.similarity_catalog.every((relation) => relation.deterministic_scoring)).toBe(true);
    expect(result.similarity_catalog.every((relation) => relation.replayable_calculation)).toBe(true);
    expect(result.similarity_catalog.every((relation) => relation.explanation.includes("compared with"))).toBe(true);
  });

  it("preserves immutable version history", () => {
    const result = establishPatternMemoryRegistry();

    expect(result.version_history).toHaveLength(10);
    expect(result.version_history.every((version) => version.version === "v1")).toBe(true);
    expect(result.version_history.every((version) => version.immutable)).toBe(true);
    expect(result.version_history.every((version) => version.lineage_preserved)).toBe(true);
    expect(result.immutable_history).toBe(true);
  });

  it("records append-only immutable pattern ledger events", () => {
    const result = establishPatternMemoryRegistry();

    expect(result.pattern_ledger).toHaveLength(90);
    expect(result.pattern_ledger.every((entry) => entry.append_only)).toBe(true);
    expect(result.pattern_ledger.every((entry) => entry.immutable)).toBe(true);
    expect(result.pattern_ledger.every((entry) => entry.replayable)).toBe(true);
    expect(result.pattern_ledger.every((entry) => entry.tenant_isolated)).toBe(true);
    expect(result.pattern_ledger.every((entry) => entry.cryptographically_verified)).toBe(true);
  });

  it("enforces historical-knowledge boundaries and governed reuse", () => {
    const result = establishPatternMemoryRegistry();

    expect(result.contract.authoritative_pattern_registry).toBe(true);
    expect(result.contract.predictive_truth_supported).toBe(false);
    expect(result.contract.execution_logic_supported).toBe(false);
    expect(result.contract.overwrite_supported).toBe(false);
    expect(result.predictive_truth_supported).toBe(false);
    expect(result.execution_logic_supported).toBe(false);
    expect(result.reuse_governed).toBe(true);
  });

  it("publishes observability metrics", () => {
    const metrics = establishPatternMemoryRegistry().metrics;

    expect(metrics.registered_patterns).toBe(10);
    expect(metrics.qualification_success_rate).toBe(1);
    expect(metrics.qualification_failures).toBe(0);
    expect(metrics.similarity_calculations).toBe(9);
    expect(metrics.pattern_reuse_frequency).toBe(10);
    expect(metrics.replay_success).toBe(1);
    expect(metrics.governance_approval_rate).toBe(1);
    expect(metrics.version_growth).toBe(10);
    expect(metrics.integrity_failures).toBe(0);
    expect(metrics.tenant_isolation_violations).toBe(0);
  });

  it.each([
    ["INDEX_UNAVAILABLE", "INDEX_UNAVAILABLE"],
    ["UNQUALIFIED_PATTERN", "UNQUALIFIED_PATTERN_REGISTERED"],
    ["VERSION_OVERWRITE", "HISTORICAL_VERSION_OVERWRITTEN"],
    ["MISSING_REPLAY", "REPLAY_REFERENCES_MISSING"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_LINEAGE_INCOMPLETE"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_VALIDATION_BYPASSED"],
    ["NONDETERMINISTIC_SIMILARITY", "NONDETERMINISTIC_SIMILARITY"],
    ["TENANT_BREACH", "TENANT_ISOLATION_VIOLATED"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["IGNORED_CERTIFICATION", "CERTIFICATION_DEPENDENCY_IGNORED"],
    ["INSUFFICIENT_RECURRENCE", "INSUFFICIENT_RECURRENCE"],
    ["LOW_CONFIDENCE", "CONFIDENCE_THRESHOLD_FAILED"],
    ["UNAUTHORIZED_REUSE", "UNAUTHORIZED_REUSE"],
  ] as const)("rejects registration for %s", (scenario: PatternMemoryScenario, failure: PatternMemoryFailure) => {
    const result = establishPatternMemoryRegistry({ scenario });

    expect(result.status).toBe("REJECTED");
    expect(result.failures).toContain(failure);
    expect(result.metrics.registered_patterns).toBe(0);
    expect(replayPatternMemoryRegistry(result)).toBe(true);
  });

  it("keeps unqualified patterns out of active lifecycle", () => {
    const result = establishPatternMemoryRegistry({ scenario: "LOW_CONFIDENCE" });

    expect(result.qualification_report.qualified).toBe(false);
    expect(result.pattern_records.every((record) => record.lifecycle_state === "CANDIDATE")).toBe(true);
    expect(result.reuse_governed).toBe(true);
  });

  it("detects nested pattern tampering", () => {
    const result = establishPatternMemoryRegistry();
    const tampered = {
      ...result,
      pattern_records: [
        {
          ...result.pattern_records[0],
          tenant_id: "tenant-other",
        },
        ...result.pattern_records.slice(1),
      ],
    };

    expect(replayPatternMemoryRegistry(tampered)).toBe(false);
  });
});
