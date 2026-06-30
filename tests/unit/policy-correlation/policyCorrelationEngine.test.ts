import { describe, expect, it } from "vitest";
import { buildPolicyAnalysisRecord } from "@/services/policy-analysis";
import {
  buildDefaultPolicyCorrelationHistoricalRecords,
  buildPolicyCorrelationDoctrine,
  buildPolicyCorrelationObservabilitySurface,
  buildPolicyCorrelationRecord,
  buildPolicyCorrelationSourceRegistry,
  classifyPolicyInfluence,
  collectPolicyCorrelationHistoricalRecords,
  computePolicyCorrelationHash,
  generatePolicyCorrelations,
  matchPolicyCorrelationEvidence,
  normalizePolicyCorrelationRecords,
  orderPolicyCorrelationRecords,
  replayPolicyCorrelation,
  resolvePolicyCorrelationIdentity,
  runPolicyCorrelationEngine,
  transitionPolicyCorrelationState,
  validatePolicyCorrelationRecord,
} from "@/services/policy-correlation";
import type { PolicyCorrelationHistoricalRecord, PolicyCorrelationRecord } from "@/types/policy-correlation";

function policy(overrides = {}) {
  return buildPolicyAnalysisRecord({ analysis_state: "VALIDATED", ...overrides });
}

function firstCorrelation(overrides: Partial<PolicyCorrelationRecord> = {}) {
  return { ...generatePolicyCorrelations(policy())[0]!, ...overrides };
}

function firstHistorical(overrides: Partial<PolicyCorrelationHistoricalRecord> = {}) {
  return { ...buildDefaultPolicyCorrelationHistoricalRecords(policy())[0]!, ...overrides };
}

describe("Mission Control Phase 7B.2 Policy Correlation Engine", () => {
  it("defines no-assumption policy correlation doctrine", () => {
    const doctrine = buildPolicyCorrelationDoctrine();
    expect(doctrine.principles).toContain("no-assumption-influence");
    expect(doctrine.principles).toContain("evidence-required");
    expect(doctrine.prohibited_behaviors).toContain("unsupported semantic influence");
    expect(doctrine.supported_correlation_types).toContain("CASCADING");
  });

  it("registers approved historical sources and rejects unknown ledgers", () => {
    const registry = buildPolicyCorrelationSourceRegistry();
    expect(registry.map((source) => source.source_ledger)).toContain("TRUTH_LEDGER");
    expect(registry).toHaveLength(8);
    expect(validatePolicyCorrelationRecord(firstCorrelation({ source_ledger: "UNKNOWN" as never }), { policy_analysis: policy() }).failures.some((failure) => failure.reason === "UNKNOWN_LEDGER_SOURCE")).toBe(true);
  });

  it("accepts valid PolicyAnalysis and blocks invalid states", () => {
    expect(resolvePolicyCorrelationIdentity(policy()).validation_state).toBe("PASS");
    expect(resolvePolicyCorrelationIdentity(policy({ analysis_state: "CREATED" })).failures.some((failure) => failure.reason === "POLICY_ANALYSIS_STATE_BLOCKED")).toBe(true);
    expect(resolvePolicyCorrelationIdentity(policy({ analysis_hash: "tampered" })).failures.some((failure) => failure.reason === "POLICY_ANALYSIS_INVALID")).toBe(true);
  });

  it("resolves required identity and policy version", () => {
    expect(resolvePolicyCorrelationIdentity(policy({ policy_id: "" })).failures.some((failure) => failure.reason === "POLICY_IDENTITY_MISSING")).toBe(true);
    expect(resolvePolicyCorrelationIdentity(policy({ policy_version: "" })).failures.some((failure) => failure.reason === "POLICY_VERSION_MISSING")).toBe(true);
  });

  it("collects tenant-scoped historical records deterministically", () => {
    const p = policy();
    const records = [...buildDefaultPolicyCorrelationHistoricalRecords(p), firstHistorical({ tenant_id: "tenant_beta" })];
    const collected = collectPolicyCorrelationHistoricalRecords(p, records);
    expect(collected.every((record) => record.tenant_id === p.tenant_id)).toBe(true);
    expect(collected).toHaveLength(8);
  });

  it("normalizes and orders historical records reproducibly", () => {
    const records = buildDefaultPolicyCorrelationHistoricalRecords(policy());
    const normalized = normalizePolicyCorrelationRecords(records);
    const ordered = orderPolicyCorrelationRecords([...normalized].reverse());
    expect(normalized[0]!.record_hash).toBe(normalizePolicyCorrelationRecords(records)[0]!.record_hash);
    expect(ordered.map((record) => record.ledger_sequence)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
  });

  it("detects evidence-supported and unsupported influence", () => {
    expect(matchPolicyCorrelationEvidence(firstHistorical())).toBe(true);
    expect(matchPolicyCorrelationEvidence(firstHistorical({ evidence_refs: [] }))).toBe(false);
    expect(classifyPolicyInfluence(firstHistorical({ evidence_refs: [] }))).toBe("UNSUPPORTED");
  });

  it("classifies direct, indirect, cascading, historical, and conditional influence", () => {
    const correlations = generatePolicyCorrelations(policy());
    expect(correlations.map((record) => record.correlation_type)).toEqual(expect.arrayContaining(["DIRECT", "INDIRECT", "CASCADING", "HISTORICAL", "CONDITIONAL"]));
  });

  it("generates canonical relationships for registered historical targets", () => {
    const relationshipTypes = generatePolicyCorrelations(policy()).map((record) => record.relationship_type);
    expect(relationshipTypes).toEqual(expect.arrayContaining([
      "POLICY_TO_RECOMMENDATION",
      "POLICY_TO_DECISION",
      "POLICY_TO_RUNTIME",
      "POLICY_TO_VIOLATION",
      "POLICY_TO_AUTHORITY",
      "POLICY_TO_MISSION",
      "POLICY_TO_CERTIFICATION",
      "POLICY_TO_REPLAY",
    ]));
  });

  it("rejects unsupported relationship and correlation types", () => {
    expect(validatePolicyCorrelationRecord(firstCorrelation({ relationship_type: "UNKNOWN" as never }), { policy_analysis: policy() }).failures.some((failure) => failure.reason === "INVALID_RELATIONSHIP_TYPE")).toBe(true);
    expect(validatePolicyCorrelationRecord(firstCorrelation({ correlation_type: "UNKNOWN" as never }), { policy_analysis: policy() }).failures.some((failure) => failure.reason === "INVALID_CORRELATION_TYPE")).toBe(true);
  });

  it("requires evidence, lineage, source, target, and replay references", () => {
    const p = policy();
    const correlation = generatePolicyCorrelations(p)[0]!;
    expect(validatePolicyCorrelationRecord({ ...correlation, evidence_refs: [] }, { policy_analysis: p }).failures.some((failure) => failure.reason === "EVIDENCE_MISSING")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, lineage_refs: ["broken_lineage"] }, { policy_analysis: p }).failures.some((failure) => failure.reason === "LINEAGE_BREAK_DETECTED")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, source_record_refs: [] }, { policy_analysis: p }).failures.some((failure) => failure.reason === "SOURCE_RECORDS_MISSING")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, target_record_refs: [] }, { policy_analysis: p }).failures.some((failure) => failure.reason === "TARGET_RECORDS_MISSING")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, replay_refs: { ...correlation.replay_refs, ledger_snapshot_refs: [] } }, { policy_analysis: p }).failures.some((failure) => failure.reason === "REPLAY_REFS_MISSING")).toBe(true);
  });

  it("detects tenant, version, future influence, and consistency failures", () => {
    const p = policy();
    const correlation = generatePolicyCorrelations(p)[0]!;
    expect(validatePolicyCorrelationRecord({ ...correlation, tenant_id: "tenant_beta" }, { policy_analysis: p }).failures.some((failure) => failure.reason === "TENANT_MISMATCH")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, policy_version: "v9" }, { policy_analysis: p }).failures.some((failure) => failure.reason === "POLICY_VERSION_MISMATCH")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, influence_path: ["future_policy_001", "decision_dec_099"] }, { policy_analysis: p }).failures.some((failure) => failure.reason === "FUTURE_POLICY_INFLUENCE")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, correlation_state: "INCONSISTENT" }, { policy_analysis: p }).failures.some((failure) => failure.reason === "CROSS_LEDGER_INCONSISTENCY")).toBe(true);
  });

  it("detects authority expansion and enforcement attempts", () => {
    const p = policy();
    expect(validatePolicyCorrelationRecord(firstCorrelation({ runtime_context: { summary: "execute_authorized", refs: ["execute_authorized"] } }), { policy_analysis: p }).failures.some((failure) => failure.reason === "AUTHORITY_BOUNDARY_VIOLATION")).toBe(true);
    expect(validatePolicyCorrelationRecord(firstCorrelation({ authority_context: { summary: "execute policy", refs: ["authority_execute"] } }), { policy_analysis: p }).failures.some((failure) => failure.reason === "ENFORCEMENT_ATTEMPT_DETECTED")).toBe(true);
  });

  it("runs the correlation engine with cross-ledger consistency", () => {
    const result = runPolicyCorrelationEngine(policy());
    expect(result.validation.validation_state).toBe("PASS");
    expect(result.correlations).toHaveLength(8);
    expect(result.ordered_record_ids[0]).toBe("hist_policy_rec_194");
  });

  it("fails closed when historical records are missing", () => {
    const result = runPolicyCorrelationEngine(policy(), []);
    expect(result.validation.validation_state).toBe("FAIL");
    expect(result.validation.failures.some((failure) => failure.reason === "HISTORICAL_RECORDS_MISSING")).toBe(true);
  });

  it("replays generated correlations deterministically", () => {
    const p = policy();
    const correlation = generatePolicyCorrelations(p)[0]!;
    const replay = replayPolicyCorrelation(correlation, p);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.reconstructed_hash).toBe(correlation.correlation_hash);
  });

  it("detects correlation hash tampering and identifier mutation", () => {
    const p = policy();
    const correlation = generatePolicyCorrelations(p)[0]!;
    expect(computePolicyCorrelationHash(correlation)).toBe(correlation.correlation_hash);
    expect(validatePolicyCorrelationRecord({ ...correlation, correlation_hash: "tampered" }, { policy_analysis: p }).failures.some((failure) => failure.reason === "REPLAY_HASH_MISMATCH")).toBe(true);
    expect(validatePolicyCorrelationRecord({ ...correlation, policy_correlation_id: "pc_mutated" }, { policy_analysis: p, original_record: correlation }).failures.some((failure) => failure.reason === "IDENTIFIER_MUTATION")).toBe(true);
  });

  it("validates state transitions and blocks invalid transitions", () => {
    const p = policy();
    const correlation = generatePolicyCorrelations(p)[0]!;
    expect(transitionPolicyCorrelationState(correlation, "ARCHIVED", p).validation_state).toBe("PASS");
    expect(transitionPolicyCorrelationState(correlation, "SOURCE_VALIDATED", p).failures.some((failure) => failure.reason === "INVALID_STATE_TRANSITION")).toBe(true);
  });

  it("builds operator explanations and observability", () => {
    const surface = buildPolicyCorrelationObservabilitySurface(policy());
    expect(surface.policy_analyzed).toBe("policy_runtime_network_access");
    expect(surface.consistency_status).toBe("CONSISTENT");
    expect(surface.replay_ready).toBe(true);
    expect(surface.explanations[0]!.steps.some((step) => step.includes("Evidence records"))).toBe(true);
  });

  it("can build a correlation from a single historical record", () => {
    const p = policy();
    const records = buildDefaultPolicyCorrelationHistoricalRecords(p);
    const correlation = buildPolicyCorrelationRecord(p, records[0]!, records);
    expect(validatePolicyCorrelationRecord(correlation, { policy_analysis: p }).validation_state).toBe("PASS");
  });
});
