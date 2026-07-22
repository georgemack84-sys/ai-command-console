import { describe, expect, it } from "vitest";
import {
  REPLAY_DASHBOARD_SECTIONS,
  REPLAY_EXPLANATION_TYPES,
  computeReplayAnalyticsRecordHash,
  computeReplayExplanationHash,
  generateReplayAnalyticsExplainability,
  getReplayAnalyticsExplainabilityFoundation,
} from "@/services/decision-replay-analytics-explainability";

describe("Mission Control Phase 9.10.9 Replay Analytics & Explainability", () => {
  it("publishes the replay analytics and explainability foundation", () => {
    const foundation = getReplayAnalyticsExplainabilityFoundation();

    expect(foundation.analytics_engine_version).toBe("decision-replay-analytics-explainability/v1");
    expect(foundation.explanation_types).toEqual(REPLAY_EXPLANATION_TYPES);
    expect(foundation.dashboard_sections).toEqual(REPLAY_DASHBOARD_SECTIONS);
    expect(foundation.result.certification_ready).toBe(true);
  });

  it("calculates deterministic replay success, duration, and divergence analytics", () => {
    const result = generateReplayAnalyticsExplainability();

    expect(result.analytics_record.replay_success_rate.successful_replays).toBe(1);
    expect(result.analytics_record.replay_success_rate.replay_match_percentage).toBe(100);
    expect(result.analytics_record.replay_duration.replay_execution_ms).toBeGreaterThan(0);
    expect(result.analytics_record.divergence_frequency.divergence_count).toBe(1);
    expect(result.analytics_record.divergence_frequency.divergence_severity).toBe("NONE");
  });

  it("calculates governance, operator, reconstruction, audit, and integrity analytics", () => {
    const result = generateReplayAnalyticsExplainability();

    expect(result.analytics_record.governance_statistics.governance_validation_success).toBe(true);
    expect(result.analytics_record.operator_statistics.approval_frequency).toBe(1);
    expect(result.analytics_record.reconstruction_statistics.reconstruction_coverage).toBe(100);
    expect(result.analytics_record.audit_statistics.completed_audit_sections).toBe(12);
    expect(result.analytics_record.integrity_statistics.integrity_verification_success).toBe(true);
  });

  it("generates every required evidence-backed explanation", () => {
    const result = generateReplayAnalyticsExplainability();

    expect(result.explanations.map((explanation) => explanation.explanation_type)).toEqual(REPLAY_EXPLANATION_TYPES);
    expect(result.explanations.every((explanation) => explanation.supporting_evidence_refs.length > 0)).toBe(true);
    expect(result.explanations.every((explanation) => explanation.replay_refs.length > 0)).toBe(true);
    expect(result.explanations.every((explanation) => explanation.governance_refs.length > 0)).toBe(true);
    expect(result.explanations.every((explanation) => explanation.integrity_refs.length > 0)).toBe(true);
  });

  it("calculates replay confidence from evidence completeness", () => {
    const result = generateReplayAnalyticsExplainability();

    expect(result.explanations.every((explanation) => explanation.confidence_level === "VERY_HIGH")).toBe(true);
    expect(result.validation.confidence_calculated).toBe(true);
  });

  it("builds a complete operator-visible dashboard model", () => {
    const result = generateReplayAnalyticsExplainability();

    expect(result.dashboard.dashboard_sections).toEqual(REPLAY_DASHBOARD_SECTIONS);
    expect(result.dashboard.metric_refs).toEqual([result.analytics_record.analytics_id]);
    expect(result.dashboard.explanation_refs).toEqual(result.analytics_record.explanation_refs);
    expect(result.validation.dashboard_complete).toBe(true);
  });

  it("stores analytics, explanations, and dashboard snapshots in an append-only metrics ledger", () => {
    const result = generateReplayAnalyticsExplainability();
    const entry = result.metrics_ledger[0];

    expect(entry?.append_only).toBe(true);
    expect(entry?.deleted).toBe(false);
    expect(entry?.analytics_record_hash).toBe(result.analytics_record.integrity_hash);
    expect(entry?.dashboard_hash).toBe(result.dashboard.integrity_hash);
    expect(entry?.explanation_hashes).toEqual(result.explanations.map((explanation) => explanation.integrity_hash));
  });

  it("is deterministic and reproduces analytics and explanation hashes", () => {
    const first = generateReplayAnalyticsExplainability();
    const second = generateReplayAnalyticsExplainability();

    expect(second).toEqual(first);
    expect(computeReplayAnalyticsRecordHash(first.analytics_record)).toBe(first.analytics_record.integrity_hash);
    expect(first.explanations.every((explanation) => computeReplayExplanationHash(explanation) === explanation.integrity_hash)).toBe(true);
  });

  it.each([
    ["METRIC_TAMPER", "METRIC_REPRODUCTION_FAILURE"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["MISSING_GOVERNANCE_REFS", "GOVERNANCE_REFERENCES_MISSING"],
    ["MISSING_INTEGRITY_REFS", "INTEGRITY_REFERENCES_MISSING"],
    ["MISSING_EXPLANATION", "EXPLANATION_UNSUPPORTED_BY_EVIDENCE"],
    ["INCOMPLETE_DASHBOARD", "DASHBOARD_INCOMPLETE"],
    ["CONFIDENCE_INCOMPLETE", "CONFIDENCE_CALCULATION_INCOMPLETE"],
    ["UNSUPPORTED_METRIC_VERSION", "UNSUPPORTED_METRIC_VERSION"],
    ["CROSS_TENANT", "TENANT_BOUNDARY_VIOLATION"],
    ["UNKNOWN_ANALYTICS_STATE", "UNKNOWN_ANALYTICS_STATE"],
    ["READ_ONLY_VIOLATION", "READ_ONLY_VIOLATION"],
    ["LEDGER_HASH_MISMATCH", "LEDGER_INTEGRITY_FAILURE"],
    ["LEDGER_LINEAGE_GAP", "LEDGER_EVIDENCE_INCOMPLETE"],
  ] as const)("fails closed for %s", (scenario, failure) => {
    const result = generateReplayAnalyticsExplainability({ scenario });

    expect(result.validation.failures).toContain(failure);
    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.certification_ready).toBe(false);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_replay_evidence).toBe(false);
  });
});
