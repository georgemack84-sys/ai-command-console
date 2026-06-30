import { describe, expect, it } from "vitest";
import {
  analyzeComplianceTrend,
  analyzeScoreMovement,
  buildComplianceTrendContract,
  buildComplianceTrendDoctrine,
  buildComplianceTrendObservabilitySurface,
  buildComplianceTrendRecord,
  calculateComplianceVelocity,
  calculateStabilityIndex,
  collectComplianceHistory,
  compareComplianceHistory,
  computeComplianceTrendHash,
  constructTrendBaseline,
  detectFailurePattern,
  replayComplianceTrend,
  selectTrendWindow,
  trackCorrectiveAction,
  validateComplianceTrendRecord,
} from "@/services/compliance-trend";

describe("Mission Control Phase 7D.3 Compliance Trend Analysis", () => {
  it("defines trend engine, historical analyzer, failure detector, corrective tracker, and trend ledger", () => {
    const doctrine = buildComplianceTrendDoctrine();
    const contract = buildComplianceTrendContract();
    const record = analyzeComplianceTrend();
    expect(doctrine.contract_version).toBe("COMPLIANCE-TREND-V1");
    expect(doctrine.pipeline_stages).toContain("history_collection");
    expect(doctrine.pipeline_stages).toContain("trend_ledger_recording");
    expect(contract.supported_windows).toContain("MISSION_WINDOW");
    expect(record.failure_pattern.failure_pattern_id).toBeTruthy();
    expect(record.corrective_effectiveness.corrective_action_id).toBeTruthy();
    expect(record.trend_ledger_record.trend_ledger_id).toBeTruthy();
  });

  it("collects compliance history and marks missing history insufficient", () => {
    expect(collectComplianceHistory({ scenario: "IMPROVING" }).length).toBeGreaterThan(1);
    const missing = buildComplianceTrendRecord({ source_evaluation_refs: [] });
    expect(validateComplianceTrendRecord(missing).validation_state).toBe("INSUFFICIENT_HISTORY");
  });

  it("selects deterministic windows and constructs deterministic baselines", () => {
    const history = collectComplianceHistory({ scenario: "STABLE" });
    expect(selectTrendWindow("MISSION_WINDOW").window_selection_hash).toBe(selectTrendWindow("MISSION_WINDOW").window_selection_hash);
    expect(constructTrendBaseline(history).baseline_hash).toBe(constructTrendBaseline(history).baseline_hash);
  });

  it("reproduces score movement and detects score movement mismatches", () => {
    const record = analyzeComplianceTrend({ scenario: "IMPROVING" });
    expect(analyzeScoreMovement(record.replay_snapshot.source_evaluations, record.replay_snapshot.baseline).score_movement_hash).toBe(record.score_movement.score_movement_hash);
    expect(validateComplianceTrendRecord(buildComplianceTrendRecord({ score_movement: { ...record.score_movement, score_delta: 999 } })).errors.some((error) => error.reason === "SCORE_MOVEMENT_MISMATCH")).toBe(true);
  });

  it("detects improving compliance and blocks false improvement from insufficient history", () => {
    const improving = analyzeComplianceTrend({ scenario: "IMPROVING" });
    expect(improving.trend_direction).toBe("IMPROVING");
    expect(improving.score_movement.score_delta).toBeGreaterThan(0);
    expect(analyzeComplianceTrend({ scenario: "INSUFFICIENT_HISTORY" }).trend_direction).toBe("INSUFFICIENT_HISTORY");
  });

  it("detects degradation, worsening scores, authority drift, and policy erosion", () => {
    const degrading = analyzeComplianceTrend({ scenario: "DEGRADING" });
    expect(degrading.trend_direction).toBe("DEGRADING");
    expect(degrading.score_movement.score_delta).toBeLessThan(0);
    expect(degrading.risk_indicator.risk_drivers).toContain("degrading scores");
    expect(analyzeComplianceTrend({ scenario: "RECURRING_AUTHORITY_FAILURE" }).risk_indicator.risk_drivers).toContain("authority drift");
    expect(analyzeComplianceTrend({ scenario: "RECURRING_POLICY_FAILURE" }).risk_indicator.risk_drivers).toContain("policy erosion");
  });

  it("detects increasing violations and recurring failure classes", () => {
    expect(analyzeComplianceTrend({ scenario: "RECURRING_POLICY_FAILURE" }).failure_pattern.pattern_type).toBe("REPEATED_POLICY_FAILURE");
    expect(analyzeComplianceTrend({ scenario: "RECURRING_CONSTITUTIONAL_VIOLATION" }).failure_pattern.pattern_type).toBe("REPEATED_CONSTITUTIONAL_VIOLATION");
    expect(analyzeComplianceTrend({ scenario: "RECURRING_AUTHORITY_FAILURE" }).failure_pattern.pattern_type).toBe("REPEATED_AUTHORITY_FAILURE");
    const operational = analyzeComplianceTrend({ scenario: "RECURRING_OPERATIONAL_FAILURE" });
    expect(operational.failure_pattern.pattern_type).toBe("REPEATED_OPERATIONAL_FAILURE");
    expect(operational.violation_pattern.recurring_failure_detected).toBe(true);
  });

  it("tracks corrective action categories and effectiveness", () => {
    expect(analyzeComplianceTrend({ scenario: "EFFECTIVE_CORRECTION" }).corrective_effectiveness.corrective_effectiveness).toBe("EFFECTIVE");
    expect(analyzeComplianceTrend({ scenario: "EFFECTIVE_CORRECTION" }).corrective_effectiveness.corrective_action_type).toBe("GOVERNANCE_CORRECTION");
    expect(analyzeComplianceTrend({ scenario: "DEGRADING" }).corrective_effectiveness.corrective_action_type).toBe("POLICY_UPDATE");
    expect(analyzeComplianceTrend({ scenario: "REGRESSIVE_CORRECTION" }).corrective_effectiveness.corrective_action_type).toBe("AUTHORITY_ADJUSTMENT");
    expect(analyzeComplianceTrend({ scenario: "INEFFECTIVE_CORRECTION" }).corrective_effectiveness.corrective_effectiveness).toBe("INEFFECTIVE");
    expect(analyzeComplianceTrend({ scenario: "REGRESSIVE_CORRECTION" }).corrective_effectiveness.corrective_effectiveness).toBe("REGRESSIVE");
  });

  it("reproduces corrective effectiveness, velocity, stability, and historical comparison", () => {
    const record = analyzeComplianceTrend({ scenario: "IMPROVING" });
    expect(trackCorrectiveAction(record.replay_snapshot.source_evaluations, "IMPROVING").corrective_action_hash).toBe(record.corrective_effectiveness.corrective_action_hash);
    expect(calculateComplianceVelocity(record.score_movement, record.violation_pattern, record.trend_window).velocity_hash).toBe(record.compliance_velocity.velocity_hash);
    expect(calculateStabilityIndex(record.score_movement, record.violation_pattern, record.corrective_effectiveness).stability_hash).toBe(record.stability_index.stability_hash);
    expect(compareComplianceHistory(record.score_movement, record.replay_snapshot.baseline, record.trend_window).comparison_hash).toBe(record.historical_comparison.comparison_hash);
  });

  it("detects velocity, stability, comparison, and risk mismatches", () => {
    const record = analyzeComplianceTrend();
    expect(validateComplianceTrendRecord(buildComplianceTrendRecord({ compliance_velocity: { ...record.compliance_velocity, velocity_rate: 999 } })).errors.some((error) => error.reason === "VELOCITY_MISMATCH")).toBe(true);
    expect(validateComplianceTrendRecord(buildComplianceTrendRecord({ stability_index: { ...record.stability_index, stability_index: 0 } })).errors.some((error) => error.reason === "STABILITY_MISMATCH")).toBe(true);
    expect(validateComplianceTrendRecord(buildComplianceTrendRecord({ historical_comparison: { ...record.historical_comparison, historical_delta: 999 } })).errors.some((error) => error.reason === "HISTORICAL_COMPARISON_MISMATCH")).toBe(true);
    expect(validateComplianceTrendRecord(buildComplianceTrendRecord({ risk_indicator: { ...record.risk_indicator, risk_indicator: "CRITICAL" } })).errors.some((error) => error.reason === "RISK_INDICATOR_MISMATCH")).toBe(true);
  });

  it("generates risk indicators and writes trend ledger records", () => {
    const record = analyzeComplianceTrend({ scenario: "RECURRING_CONSTITUTIONAL_VIOLATION" });
    expect(record.risk_indicator.risk_indicator).toBe("CRITICAL");
    expect(record.risk_indicator.escalation_required).toBe(true);
    expect(record.trend_ledger_record.truth_ledger_reference).toBe(record.truth_ledger_reference);
    const failed = analyzeComplianceTrend({ scenario: "LEDGER_WRITE_FAILURE" });
    expect(validateComplianceTrendRecord(failed).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("creates replay snapshots, reconstructs trends, and detects replay mismatch", () => {
    const record = analyzeComplianceTrend();
    expect(record.replay_snapshot.replay_hash).toBeTruthy();
    expect(replayComplianceTrend(record).replay_state).toBe("REPRODUCED");
    expect(replayComplianceTrend(buildComplianceTrendRecord({ trend_hash: "tampered" })).replay_state).toBe("MISMATCH");
    expect(validateComplianceTrendRecord(analyzeComplianceTrend({ scenario: "REPLAY_MISMATCH" })).validation_state).toBe("REPLAY_MISMATCH");
  });

  it("preserves tenant isolation and blocks cross-tenant trend data", () => {
    expect(validateComplianceTrendRecord(analyzeComplianceTrend()).checks.tenant_isolation_valid).toBe(true);
    const leaked = analyzeComplianceTrend({ scenario: "CROSS_TENANT_HISTORY" });
    expect(validateComplianceTrendRecord(leaked).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("prohibits hidden state and exposes operator trend visibility", () => {
    const record = analyzeComplianceTrend({ scenario: "IMPROVING" });
    expect(validateComplianceTrendRecord({ ...record, hidden_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    const surface = buildComplianceTrendObservabilitySurface(record);
    expect(surface.trend_direction).toBe("IMPROVING");
    expect(surface.improving_areas).toContain("score movement");
    expect(surface.replay_state).toBe("REPRODUCED");
  });

  it("generates deterministic trend hashes and detects recurring failures directly", () => {
    const record = analyzeComplianceTrend({ scenario: "RECURRING_POLICY_FAILURE" });
    expect(computeComplianceTrendHash(record)).toBe(record.trend_hash);
    expect(detectFailurePattern(record.replay_snapshot.source_evaluations).pattern_type).toBe("REPEATED_POLICY_FAILURE");
  });
});
