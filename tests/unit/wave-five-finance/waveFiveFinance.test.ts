import { describe, expect, it } from "vitest";

import { getWaveFiveFinanceBundle, replayWaveFiveFinance, runWaveFiveFinance, validateWaveFiveFinance } from "@/services/wave-five-finance";
import type { WaveFiveFinanceFailure } from "@/types/wave-five-finance";

const conditionalFailures = ["FINANCIAL_REGISTRY_MISSING", "FINANCIAL_REGISTRY_RELATIONSHIPS_INVALID", "FINANCIAL_REGISTRY_VERSIONING_MISSING", "BUDGET_ENGINE_MISSING", "BUDGET_VARIANCE_INVALID", "BUDGET_EVIDENCE_INCOMPLETE", "CASH_FLOW_ENGINE_MISSING", "CASH_HISTORY_LINEAGE_INCOMPLETE", "CASH_FORECAST_INPUTS_INVALID", "FORECAST_ENGINE_MISSING", "SCENARIO_EVIDENCE_INCOMPLETE", "FORECAST_CONFIDENCE_MISSING", "FINANCIAL_ANALYTICS_MISSING", "RECOMMENDATIONS_NOT_EVIDENCE_BACKED", "FINANCIAL_KPIS_INVALID", "FINANCIAL_DASHBOARD_MISSING", "DASHBOARD_UPDATES_INVALID", "EVIDENCE_NAVIGATION_MISSING", "FINANCIAL_GOVERNANCE_MISSING", "RECOMMENDATIONS_UNCLASSIFIED", "ADVISORY_LABELS_MISSING", "FINANCIAL_APIS_MISSING", "API_CONTRACTS_UNSTABLE", "API_VERSIONING_MISSING", "INTEGRATION_VALIDATION_MISSING"] as const satisfies readonly WaveFiveFinanceFailure[];
const notQualifiedFailures = ["W5_TASKS_COMMITMENTS_INVALID", "BUDGETS_NONDETERMINISTIC", "CASH_FLOW_NONDETERMINISTIC", "FORECAST_NONREPRODUCIBLE", "ANALYTICS_NONDETERMINISTIC", "POLICY_ENFORCEMENT_MISSING", "AUTHORITY_VALIDATION_MISSING", "FINANCIAL_EVIDENCE_MUTABLE", "CALCULATION_EVIDENCE_INCOMPLETE", "REPLAY_DIVERGED", "ADVISORY_ONLY_VIOLATED", "UNCERTIFIED_FINANCIAL_ACTION_EXECUTABLE", "FINANCIAL_AUTHORITY_BYPASS", "TENANT_ISOLATION_BREACH"] as const satisfies readonly WaveFiveFinanceFailure[];

describe("Wave 5.7 Finance", () => {
  it("publishes the finance doctrine", () => {
    const bundle = getWaveFiveFinanceBundle();

    expect(bundle.doctrine).toMatchObject({ version: "wave-five-finance/w5.7", financial_outputs_advisory_only: true, certified_financial_action_required_for_execution: true, deterministic_financial_evidence_required: true, authority_policy_safety_trust_required: true, no_automatic_financial_execution: true, qualification_gate: "W5.7 Finance Qualification Gate" });
    expect(bundle.result.readiness.decision).toBe("QUALIFIED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("is deterministic and consumes the Wave 5 execution stack", () => {
    const first = runWaveFiveFinance({ seed: "deterministic" });
    const second = runWaveFiveFinance({ seed: "deterministic" });

    expect(first.upstream_refs).toEqual(["wave-five-tasks-commitments/w5.5", "wave-five-calendar-time/w5.4", "wave-five-personal-knowledge/w5.3", "wave-five-unified-personal-context/w5.2", "wave-five-application-platform/w5.1"]);
    expect(first.provides).toEqual(["financial-registry", "budget-engine", "cash-flow-engine", "forecast-engine", "financial-analytics-engine", "financial-dashboard", "financial-governance-service", "financial-apis", "financial-reports", "financial-evidence-packages"]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateWaveFiveFinance(first).valid).toBe(true);
    expect(replayWaveFiveFinance()).toBe(true);
  });

  it("operates canonical financial registry, budget, and cash-flow engines", () => {
    const result = runWaveFiveFinance();

    expect(result.registry).toMatchObject({ financial_accounts: true, budget_categories: true, cost_centers: true, income_sources: true, expense_sources: true, financial_assets: true, financial_liabilities: true, financial_goals: true, financial_metadata: true, operational: true, versioning_supported: true, relationships_validated: true });
    expect(result.budget).toMatchObject({ budget_creation: true, budget_allocation: true, budget_tracking: true, budget_variance: true, budget_rules: true, budget_evidence: true, deterministic: true, variance_validated: true, evidence_complete: true });
    expect(result.cash_flow).toMatchObject({ income_tracking: true, expense_tracking: true, recurring_transactions: true, cash_flow_timeline: true, liquidity_analysis: true, cash_position: true, cash_forecast: true, cash_evidence: true, deterministic: true, historical_lineage_complete: true, forecast_inputs_validated: true });
    expect(runWaveFiveFinance({ scenario: "BUDGETS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveFinance({ scenario: "CASH_FLOW_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("qualifies reproducible forecasts and evidence-backed analytics", () => {
    const result = runWaveFiveFinance();

    expect(result.forecast).toMatchObject({ revenue_forecasting: true, expense_forecasting: true, cash_forecasting: true, budget_forecasting: true, scenario_modeling: true, sensitivity_analysis: true, forecast_confidence: true, forecast_evidence: true, reproducible: true, scenario_evidence_complete: true, confidence_recorded: true });
    expect(result.analytics).toMatchObject({ spending_analysis: true, income_analysis: true, budget_utilization: true, trend_detection: true, cost_optimization: true, savings_opportunities: true, goal_progress: true, financial_kpis: true, deterministic: true, recommendations_evidence_backed: true, kpis_validated: true });
    expect(runWaveFiveFinance({ scenario: "FORECAST_NONREPRODUCIBLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveFinance({ scenario: "ANALYTICS_NONDETERMINISTIC" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("provides dashboard visibility and governed advisory-only financial outputs", () => {
    const result = runWaveFiveFinance();

    expect(result.dashboard).toMatchObject({ financial_overview: true, budget_dashboard: true, cash_flow_dashboard: true, forecast_dashboard: true, goal_dashboard: true, alerts: true, financial_timeline: true, evidence_navigation: true, operational: true, realtime_updates_validated: true });
    expect(result.governance).toMatchObject({ financial_policies: true, authority_validation: true, approval_requirements: true, risk_classification: true, recommendation_classification: true, advisory_labels: true, financial_audit: true, governance_evidence: true, policy_enforcement_operational: true, recommendations_classified: true, advisory_only_guarantee: true, certified_action_required_for_execution: true, no_uncertified_execution_path: true });
    expect(runWaveFiveFinance({ scenario: "ADVISORY_ONLY_VIOLATED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveFinance({ scenario: "UNCERTIFIED_FINANCIAL_ACTION_EXECUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveFinance({ scenario: "FINANCIAL_AUTHORITY_BYPASS" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it("publishes APIs and immutable replayable financial evidence", () => {
    const result = runWaveFiveFinance();

    expect(result.apis_evidence).toMatchObject({ registry_apis: true, budget_apis: true, cash_flow_apis: true, forecast_apis: true, dashboard_apis: true, analytics_apis: true, evidence_apis: true, integration_contracts: true, contracts_stable: true, versioning_supported: true, integration_validated: true, source_data: true, assumptions: true, calculation_lineage: true, forecast_methodology: true, confidence_assessment: true, recommendation_rationale: true, immutable_evidence: true, replay_validated: true, tenant_isolation: true });
    expect(result.readiness).toMatchObject({ phase_ready: true, financial_registry_operational: true, budget_engine_validated: true, cash_flow_engine_operational: true, forecast_engine_deterministic: true, financial_analytics_complete: true, financial_dashboard_operational: true, governance_policies_enforced: true, financial_apis_published: true, financial_evidence_immutable: true, advisory_only_verified: true, certified_action_required: true, deterministic_replay_validated: true });
    expect(runWaveFiveFinance({ scenario: "FINANCIAL_EVIDENCE_MUTABLE" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveFinance({ scenario: "REPLAY_DIVERGED" }).readiness.decision).toBe("NOT_QUALIFIED");
    expect(runWaveFiveFinance({ scenario: "TENANT_ISOLATION_BREACH" }).readiness.decision).toBe("NOT_QUALIFIED");
  });

  it.each(conditionalFailures)("degrades to conditional qualification for %s", (failure) => {
    const result = runWaveFiveFinance({ scenario: failure });
    const validation = validateWaveFiveFinance(result);

    expect(result.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it.each(notQualifiedFailures)("does not qualify for constitutional failure %s", (failure) => {
    const result = runWaveFiveFinance({ scenario: failure });
    const validation = validateWaveFiveFinance(result);

    expect(result.readiness.decision).toBe("NOT_QUALIFIED");
    expect(result.readiness.failures).toContain(failure);
    expect(result.readiness.phase_ready).toBe(false);
    expect(validation.valid).toBe(false);
  });

  it("distinguishes observation, follow-up, and failed qualification outcomes", () => {
    const observed = runWaveFiveFinance({ scenario: "QUALIFIED_WITH_OBSERVATIONS" });
    const followup = runWaveFiveFinance({ scenario: "CONDITIONAL_FOLLOWUP" });
    const notQualified = runWaveFiveFinance({ scenario: "FINANCE_QUALIFICATION_FAILED" });

    expect(observed.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(observed.readiness.failures).toEqual([]);
    expect(followup.readiness.decision).toBe("CONDITIONALLY_QUALIFIED");
    expect(notQualified.readiness.decision).toBe("NOT_QUALIFIED");
    expect(validateWaveFiveFinance(notQualified).valid).toBe(false);
  });
});
