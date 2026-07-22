import { describe, expect, it } from "vitest";
import {
  CONFIDENCE_CATEGORIES,
  PRIORITY_QUEUE_TYPES,
  RISK_CATEGORIES,
  URGENCY_LEVELS,
  computePriorityQueueItemHash,
  getPriorityRiskDashboardFoundation,
  replayPriorityRiskDashboard,
  runPriorityRiskDashboard,
} from "@/services/decision-priority-risk-dashboard";
import type { PriorityRiskDashboardFailure, PriorityRiskDashboardInput } from "@/types/decision-priority-risk-dashboard";

describe("Mission Control Phase 9.11.5 Priority Queue & Risk Dashboard", () => {
  it("publishes the priority queue and risk dashboard foundation", () => {
    const foundation = getPriorityRiskDashboardFoundation();

    expect(foundation.dashboard_version).toBe("decision-priority-risk-dashboard/v1");
    expect(foundation.queue_types).toEqual(PRIORITY_QUEUE_TYPES);
    expect(foundation.risk_categories).toEqual(RISK_CATEGORIES);
    expect(foundation.confidence_categories).toEqual(CONFIDENCE_CATEGORIES);
    expect(foundation.urgency_levels).toEqual(URGENCY_LEVELS);
    expect(foundation.result.validation.validation_status).toBe("VALID");
  });

  it("renders deterministic priority queue items and queue records", () => {
    const result = runPriorityRiskDashboard();

    expect(result.queue_items).toHaveLength(7);
    expect(result.queue_items.map((item) => item.queue_position)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(result.queue_items.every((item) => computePriorityQueueItemHash(item) === item.integrity_hash)).toBe(true);
    expect(result.priority_queues.map((queue) => queue.queue_type)).toEqual(PRIORITY_QUEUE_TYPES);
  });

  it("shows mission-critical decisions and governance priority adjustments", () => {
    const result = runPriorityRiskDashboard();

    expect(result.mission_critical_queue.decision_refs).toContain("decision_escalated_authority");
    expect(result.queue_items.some((item) => item.governance_weight >= 80)).toBe(true);
    expect(result.validation.mission_critical_visible).toBe(true);
    expect(result.validation.governance_adjustments_visible).toBe(true);
  });

  it("builds risk, confidence, urgency, and analytics dashboards", () => {
    const result = runPriorityRiskDashboard();

    expect(result.risk_dashboard.overall_risk).toBe("CRITICAL");
    expect(result.risk_dashboard.risk_distribution.CRITICAL).toBeGreaterThan(0);
    expect(result.confidence_dashboard.evidence_quality).toBe("COMPLETE");
    expect(result.confidence_dashboard.confidence_lineage.length).toBeGreaterThan(0);
    expect(result.urgency_visualization.urgency_levels.IMMEDIATE).toContain("decision_escalated_authority");
    expect(result.queue_analytics.queue_metrics.queue_depth).toBe(7);
    expect(result.queue_analytics.governance_metrics.certification_blockers).toBe(1);
  });

  it("preserves replayability and advisory-only boundaries", () => {
    const first = runPriorityRiskDashboard();
    const second = runPriorityRiskDashboard();

    expect(second).toEqual(first);
    expect(replayPriorityRiskDashboard(first)).toBe(true);
    expect(first.advisory_only).toBe(true);
    expect(first.mutates_priority_or_risk).toBe(false);
    expect(first.execution_authority_granted).toBe(false);
  });

  it("validates ordering, risk, confidence, urgency, replay, certification, tenant, and integrity", () => {
    const result = runPriorityRiskDashboard();

    expect(result.validation.priority_order_valid).toBe(true);
    expect(result.validation.risk_exposure_valid).toBe(true);
    expect(result.validation.confidence_lineage_valid).toBe(true);
    expect(result.validation.urgency_indicators_valid).toBe(true);
    expect(result.validation.replay_refs_present).toBe(true);
    expect(result.validation.certification_blockers_visible).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.integrity_verified).toBe(true);
  });

  it.each([
    ["ORDER_MISMATCH", "PRIORITY_ORDER_MISMATCH"],
    ["OMIT_MISSION_CRITICAL", "MISSION_CRITICAL_DECISIONS_OMITTED"],
    ["BAD_RISK", "RISK_EXPOSURE_INACCURATE"],
    ["BAD_CONFIDENCE", "CONFIDENCE_SOURCE_MISMATCH"],
    ["BAD_URGENCY", "URGENCY_INDICATORS_INCORRECT"],
    ["BAD_ANALYTICS", "QUEUE_ANALYTICS_INCONSISTENT"],
    ["HIDE_GOVERNANCE_ADJUSTMENTS", "GOVERNANCE_PRIORITY_ADJUSTMENTS_HIDDEN"],
    ["MISSING_REPLAY_REFS", "REPLAY_REFERENCES_MISSING"],
    ["HIDE_CERTIFICATION_BLOCKERS", "CERTIFICATION_BLOCKERS_HIDDEN"],
    ["NONDETERMINISTIC_ORDER", "DASHBOARD_ORDER_NONDETERMINISTIC"],
    ["CROSS_TENANT", "CROSS_TENANT_QUEUE_VISIBLE"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
    ["REPLAY_RECONSTRUCTION_FAILURE", "DASHBOARD_REPLAY_RECONSTRUCTION_FAILED"],
    ["EXECUTION_AUTHORITY", "EXECUTION_AUTHORITY_GRANTED"],
  ] as readonly [NonNullable<PriorityRiskDashboardInput["scenario"]>, PriorityRiskDashboardFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runPriorityRiskDashboard({ scenario });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_priority_or_risk).toBe(false);
  });

  it("fails closed when the role lacks priority dashboard visibility", () => {
    const result = runPriorityRiskDashboard({ role: "ADMINISTRATOR" });

    expect(result.validation.validation_status).toBe("BLOCKED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects replay tampering", () => {
    const result = runPriorityRiskDashboard();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPriorityRiskDashboard(tampered)).toBe(false);
  });
});
