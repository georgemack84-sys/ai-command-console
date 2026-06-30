import { describe, expect, it } from "vitest";
import {
  buildDefaultRawEvents,
  buildViolationPatternDoctrine,
  buildViolationPatternObservabilitySurface,
  buildViolationPatternRecord,
  calculatePatternStrength,
  computeViolationPatternHash,
  detectViolationPatterns,
  generateViolationPatternId,
  normalizePatternInputs,
  replayViolationPattern,
  resolveComparisonWindow,
  resolveViolationPatternWindow,
  transitionViolationPatternState,
  validateViolationPatternRecord,
} from "@/services/violation-patterns";
import type { ViolationPatternRecord, ViolationPatternType } from "@/types/violation-patterns";

function valid(overrides: Partial<ViolationPatternRecord> = {}) {
  return buildViolationPatternRecord(overrides);
}

describe("Mission Control Phase 7C.2 Violation Pattern Detection", () => {
  it("defines advisory-only violation pattern doctrine and catalog", () => {
    const doctrine = buildViolationPatternDoctrine();
    expect(doctrine.principles).toContain("deterministic");
    expect(doctrine.principles).toContain("fail-closed");
    expect(doctrine.prohibited_behaviors).toContain("policy enforcement");
    expect(doctrine.allowed_pattern_types).toContain("POLICY_DRIFT");
    expect(doctrine.allowed_trend_directions).toContain("INCREASING");
    expect(doctrine.allowed_pattern_strengths).toContain("SEVERE");
  });

  it("normalizes, deduplicates, and tenant-scopes detection inputs", () => {
    const normalized = normalizePatternInputs([
      { source_record_id: "dup", tenant_id: "tenant_alpha", mission_id: "mission_query_layer", event_type: "POLICY_VIOLATION", event_timestamp: "2026-06-01T00:00:00.000Z", evidence_refs: ["e1"], lineage_refs: ["l1"], replay_refs: ["r1"] },
      { source_record_id: "dup", tenant_id: "tenant_alpha", mission_id: "mission_query_layer", event_type: "POLICY_VIOLATION", event_timestamp: "2026-06-01T00:00:00.000Z", evidence_refs: ["e1"], lineage_refs: ["l1"], replay_refs: ["r1"] },
    ]);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].tenant_id).toBe("tenant_alpha");
    expect(normalized[0].source_hash).toBeTruthy();
  });

  it("resolves deterministic current and comparison windows", () => {
    const current = resolveViolationPatternWindow("30_DAY_ROLLING", "2026-06-25T00:00:00.000Z");
    const comparison = resolveComparisonWindow(current);
    expect(current.start).toBe("2026-05-26T00:00:00.000Z");
    expect(comparison.end).toBe(current.start);
  });

  it("detects all required pattern families", () => {
    const result = detectViolationPatterns();
    const detected = result.patterns.map((pattern) => pattern.pattern_type);
    const required: ViolationPatternType[] = [
      "RECURRING_POLICY_VIOLATION",
      "RECURRING_CONTROL_VIOLATION",
      "RECURRING_TENANT_RULE_VIOLATION",
      "RECURRING_AUTHORITY_SCOPE_VIOLATION",
      "POLICY_DRIFT",
      "AUTHORITY_DRIFT",
      "ESCALATION_TREND",
      "EXCEPTION_RECURRENCE",
      "OVERRIDE_RECURRENCE",
      "UNRESOLVED_GOVERNANCE_EVENT_RECURRENCE",
      "RISING_CONTAINMENT_EVENT_PATTERN",
      "POLICY_CONFLICT_RECURRENCE",
      "OPERATOR_INTERVENTION_RECURRENCE",
      "CERTIFICATION_FAILURE_RECURRENCE",
      "REPLAY_MISMATCH_RECURRENCE",
      "LINEAGE_BREAK_RECURRENCE",
      "EVIDENCE_GAP_RECURRENCE",
    ];
    for (const patternType of required) expect(detected).toContain(patternType);
  }, 30000);

  it("misses recurring violations when threshold is not met", () => {
    const result = detectViolationPatterns({ events: buildDefaultRawEvents().filter((event) => event.event_type !== "POLICY_VIOLATION").concat([
      { event_type: "POLICY_VIOLATION", event_timestamp: "2026-06-01T00:00:00.000Z", policy_ref: "POLICY-LOW" },
      { event_type: "POLICY_VIOLATION", event_timestamp: "2026-06-02T00:00:00.000Z", policy_ref: "POLICY-LOW" },
    ]) });
    expect(result.patterns.some((pattern) => pattern.pattern_type === "RECURRING_POLICY_VIOLATION" && pattern.related_policy_refs.includes("POLICY-LOW"))).toBe(false);
  });

  it("calculates deterministic frequencies, baselines, trend, strength, and confidence", () => {
    const pattern = detectViolationPatterns().patterns.find((item) => item.pattern_type === "RECURRING_POLICY_VIOLATION")!;
    expect(pattern.frequency).toBe(4);
    expect(pattern.baseline_frequency).toBe(1);
    expect(pattern.frequency_delta).toBe(3);
    expect(pattern.trend_direction).toBe("INCREASING");
    expect(pattern.pattern_strength).toBe(calculatePatternStrength(pattern.frequency, pattern.baseline_frequency, pattern.trend_direction, 2));
    expect(pattern.confidence_score).toBeGreaterThan(0.8);
    expect(pattern.confidence_basis.supporting_evidence_count).toBeGreaterThan(0);
  });

  it("builds and validates a complete pattern record", () => {
    const record = valid();
    const result = validateViolationPatternRecord(record);
    expect(record.contract_version).toBe("VIOLATION-PATTERN-CONTRACT-V1");
    expect(result.validation_state).toBe("VALID");
    expect(result.errors).toEqual([]);
  });

  it("generates deterministic tenant-bound identities and hashes", () => {
    expect(generateViolationPatternId("tenant_alpha", "mission_query_layer", "POLICY_DRIFT", ["POLICY-P-208"])).toBe(generateViolationPatternId("tenant_alpha", "mission_query_layer", "POLICY_DRIFT", ["POLICY-P-208"]));
    expect(computeViolationPatternHash(valid())).toBe(valid().pattern_hash);
  }, 30000);

  it("rejects missing required fields and invalid schema values", () => {
    expect(validateViolationPatternRecord(valid({ violation_pattern_id: "" })).errors.some((error) => error.reason === "PATTERN_ID_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ contract_version: "bad" as never })).errors.some((error) => error.reason === "UNSUPPORTED_SCHEMA_VERSION")).toBe(true);
    expect(validateViolationPatternRecord(valid({ pattern_type: "UNKNOWN" as never })).errors.some((error) => error.reason === "INVALID_PATTERN_TYPE")).toBe(true);
    expect(validateViolationPatternRecord(valid({ trend_direction: "SIDEWAYS" as never })).errors.some((error) => error.reason === "INVALID_TREND_DIRECTION")).toBe(true);
    expect(validateViolationPatternRecord(valid({ pattern_strength: "CRITICAL" as never })).errors.some((error) => error.reason === "INVALID_PATTERN_STRENGTH")).toBe(true);
  });

  it("fails closed for confidence, evidence, lineage, replay, models, explanation, and hidden state", () => {
    expect(validateViolationPatternRecord(valid({ confidence_score: undefined as never })).errors.some((error) => error.reason === "CONFIDENCE_SCORE_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ confidence_score: 1.4 })).errors.some((error) => error.reason === "CONFIDENCE_OUT_OF_RANGE")).toBe(true);
    expect(validateViolationPatternRecord(valid({ confidence_basis: { ...valid().confidence_basis, replay_status: undefined as never } })).errors.some((error) => error.reason === "CONFIDENCE_BASIS_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ evidence_refs: [] })).errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ lineage_refs: [] })).validation_state).toBe("LINEAGE_REFERENCE_MISSING");
    expect(validateViolationPatternRecord(valid({ replay_refs: [] })).validation_state).toBe("REPLAY_REFERENCE_MISSING");
    expect(validateViolationPatternRecord(valid({ detection_model_version: "" as never })).errors.some((error) => error.reason === "DETECTION_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ confidence_model_version: "" as never })).errors.some((error) => error.reason === "CONFIDENCE_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateViolationPatternRecord(valid({ explanation: "unsupported" })).errors.some((error) => error.reason === "EXPLANATION_MISSING")).toBe(true);
    expect(validateViolationPatternRecord({ ...valid(), hidden_detection_state: "secret" } as never).errors.some((error) => error.reason === "HIDDEN_DETECTION_STATE")).toBe(true);
  }, 30000);

  it("enforces tenant isolation and identity immutability", () => {
    const record = valid();
    expect(validateViolationPatternRecord(valid({ evidence_refs: ["evidence_tenant_beta_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(validateViolationPatternRecord({ ...record, violation_pattern_id: "VPAT-MUTATED" }, { original_record: record }).errors.some((error) => error.reason === "IDENTITY_MUTATION")).toBe(true);
    expect(validateViolationPatternRecord({ ...record, tenant_id: "tenant_beta" }, { original_record: record }).errors.some((error) => error.reason === "IDENTITY_MUTATION")).toBe(true);
  });

  it("validates lifecycle transitions and blocks invalid transitions", () => {
    expect(transitionViolationPatternState(valid(), "LINKED_TO_RISK").validation_state).toBe("VALID");
    expect(transitionViolationPatternState(valid({ pattern_state: "ARCHIVED" }), "DETECTED").errors.some((error) => error.reason === "INVALID_STATE_TRANSITION")).toBe(true);
    expect(validateViolationPatternRecord(valid({ pattern_state: "ACTIVE" as never })).validation_state).toBe("INVALID_STATE");
  });

  it("replays pattern records deterministically and detects tampering", () => {
    const record = valid();
    expect(replayViolationPattern(record).validation_state).toBe("PASS");
    expect(validateViolationPatternRecord({ ...record, pattern_hash: "tampered" }).errors.some((error) => error.reason === "PATTERN_HASH_MISMATCH")).toBe(true);
  });

  it("builds complete operator observability", () => {
    const surface = buildViolationPatternObservabilitySurface(valid());
    expect(surface.pattern_type).toBe("RECURRING_POLICY_VIOLATION");
    expect(surface.model_versions.detection_model_version).toBe("VIOLATION-PATTERN-DETECTOR-V1");
    expect(surface.evidence_refs.length).toBeGreaterThan(0);
    expect(surface.validation_failures).toEqual([]);
  });
});
