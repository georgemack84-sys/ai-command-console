import { describe, expect, it } from "vitest";
import {
  OUTCOME_NORMALIZATION_CHECKS,
  SUPPORTED_OUTCOME_SOURCES,
  computeCanonicalOutcomeHash,
  getOutcomeNormalizationAdapterFoundation,
  replayOutcomeNormalizationAdapter,
  runOutcomeNormalizationAdapter,
} from "@/services/outcome-normalization-adapter";
import type { OutcomeNormalizationAdapterInput, OutcomeNormalizationFailure } from "@/types/outcome-normalization-adapter";

describe("Mission Control Phase 10.2.1 Outcome Normalization Adapter", () => {
  it("publishes the outcome normalization adapter foundation", () => {
    const foundation = getOutcomeNormalizationAdapterFoundation();

    expect(foundation.outcome_normalization_adapter_version).toBe("outcome-normalization-adapter/v1");
    expect(foundation.checks).toEqual(OUTCOME_NORMALIZATION_CHECKS);
    expect(foundation.supported_sources).toEqual(SUPPORTED_OUTCOME_SOURCES);
    expect(foundation.api_surface.normalize_outcome).toBe("POST /normalization/outcomes");
    expect(foundation.result.validation.validation_outcome).toBe("PASS");
  });

  it("produces the canonical outcome schema deterministically", () => {
    const result = runOutcomeNormalizationAdapter();

    expect(result.canonical_outcome.normalized_outcome_id).toBeTruthy();
    expect(result.canonical_outcome.source_outcome_id).toBeTruthy();
    expect(result.canonical_outcome.normalization_version).toBe("10.2.1");
    expect(computeCanonicalOutcomeHash(result.canonical_outcome)).toBe(result.canonical_outcome.integrity_hash);
    expect(replayOutcomeNormalizationAdapter(result)).toBe(true);
  });

  it("performs field translation only without inference, prediction, or source mutation", () => {
    const result = runOutcomeNormalizationAdapter();

    expect(result.field_translation_only).toBe(true);
    expect(result.interprets_meaning).toBe(false);
    expect(result.infers_values).toBe(false);
    expect(result.predicts_values).toBe(false);
    expect(result.modifies_source).toBe(false);
    expect(result.source_intake.original_payload_preserved).toBe(true);
  });

  it.each([
    "MISSION_CONTROL_OUTCOMES",
    "OPERATOR_WORKFLOW_RESULTS",
    "GOVERNANCE_RESULTS",
    "ROLLBACK_REPORTS",
    "CERTIFICATION_RESULTS",
    "REPLAY_OBSERVATIONS",
    "EVIDENCE_REGISTRIES",
    "FUTURE_CERTIFIED_SUBSYSTEM_OUTCOMES",
  ] as const)("normalizes supported source %s", (scenario) => {
    const result = runOutcomeNormalizationAdapter({ scenario });

    expect(result.source_intake.source_system).toBe(scenario);
    expect(result.validation.validation_outcome).toBe("PASS");
  });

  it("version-controls all normalization rules and trace metadata", () => {
    const result = runOutcomeNormalizationAdapter();

    expect(result.normalization_rules.length).toBeGreaterThan(0);
    expect(result.normalization_rules.every((rule) => rule.rule_version === "10.2.1")).toBe(true);
    expect(result.metadata.applied_rule_ids).toEqual(result.normalization_rules.map((rule) => rule.rule_id));
    expect(result.metadata.field_traces.length).toBeGreaterThan(0);
  });

  it("preserves evidence and replay lineage in the canonical outcome", () => {
    const result = runOutcomeNormalizationAdapter();

    expect(result.canonical_outcome.evidence_refs.length).toBeGreaterThan(0);
    expect(result.canonical_outcome.replay_refs.length).toBeGreaterThan(0);
    expect(result.audit_report.evidence_lineage_preserved).toBe(true);
    expect(result.audit_report.replay_lineage_preserved).toBe(true);
  });

  it("exposes deterministic normalization APIs without persistence requirements", () => {
    const result = runOutcomeNormalizationAdapter();

    expect(result.api_surface.normalize_outcome).toBe("POST /normalization/outcomes");
    expect(result.api_surface.validate_outcome).toBe("POST /normalization/validate");
    expect(result.api_surface.retrieve_rule_version).toBe("GET /normalization/rules/{version}");
    expect(result.api_surface.list_supported_schemas).toBe("GET /normalization/schemas");
    expect(result.api_surface.persistence_required).toBe(false);
  });

  it("publishes advisory-only normalization metrics", () => {
    const result = runOutcomeNormalizationAdapter();

    expect(result.metrics.outcomes_normalized).toBe(1);
    expect(result.metrics.rule_version_usage).toEqual(["10.2.1"]);
    expect(result.metrics.replay_consistency).toBe(1);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it.each([
    ["UNSUPPORTED_SOURCE", "UNSUPPORTED_SOURCE_REJECTED"],
    ["UNKNOWN_SCHEMA", "UNKNOWN_SCHEMA_FAILED_CLOSED"],
    ["UNSUPPORTED_FIELD", "UNSUPPORTED_FIELDS_REJECTED"],
    ["MISSING_IDENTIFIER", "MISSING_IDENTIFIERS_REJECTED"],
    ["INVALID_TIMESTAMP", "INVALID_TIMESTAMPS_REJECTED"],
    ["DUPLICATE_CANONICAL_ID", "DUPLICATE_CANONICAL_IDENTIFIER_REJECTED"],
    ["MALFORMED_REFERENCE", "MALFORMED_REFERENCES_REJECTED"],
    ["INVALID_ENUMERATION", "INVALID_ENUMERATIONS_REJECTED"],
    ["TENANT_MISMATCH", "TENANT_MISMATCH_REJECTED"],
    ["UNSUPPORTED_VERSION", "UNSUPPORTED_NORMALIZATION_VERSION_REJECTED"],
    ["AMBIGUOUS_MAPPING", "AMBIGUOUS_MAPPING_REJECTED"],
    ["NONDETERMINISTIC_RULE", "RULE_EXECUTION_NONDETERMINISTIC"],
    ["SOURCE_MUTATION", "SOURCE_RECORD_MUTATED"],
    ["LINEAGE_LOST", "EVIDENCE_OR_REPLAY_LINEAGE_LOST"],
    ["REPLAY_MISMATCH", "REPLAY_RECONSTRUCTION_DIFFERED"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_NOT_REPRODUCIBLE"],
    ["FAIL_OPEN", "FAIL_OPEN_NORMALIZATION_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeNormalizationAdapterInput["scenario"]>, OutcomeNormalizationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeNormalizationAdapter({ scenario });

    expect(result.validation.validation_outcome).toBe("FAIL");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.modifies_source).toBe(false);
  });

  it("fails closed when the role lacks normalization visibility", () => {
    const result = runOutcomeNormalizationAdapter({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_outcome).toBe("FAIL");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects normalization adapter tampering during replay", () => {
    const result = runOutcomeNormalizationAdapter();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeNormalizationAdapter(tampered)).toBe(false);
  });
});
