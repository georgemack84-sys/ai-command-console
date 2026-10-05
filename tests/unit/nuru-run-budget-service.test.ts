import { describe, expect, it } from "vitest";
import { NuruRunBudgetLedger, NuruRunBudgetService, workflowRunBudgets } from "@/src/server/services/nuru-run-budget-service";

describe("Nuru run budgets", () => {
  it("assigns smaller limits to the fast path than conflict analysis", () => {
    expect(workflowRunBudgets.FAST_PATH.maxAgents).toBe(2);
    expect(workflowRunBudgets.CONFLICT_PATH.maxModelCalls).toBe(12);
    expect(NuruRunBudgetService.forTemplate("STANDARD_PATH").budget.maxTokens).toBe(20_000);
  });
  it("fails closed when a budget dimension would be exceeded", () => {
    const ledger = new NuruRunBudgetLedger({ maxAgents: 2, maxModelCalls: 2, maxTokens: 6_000, maxToolCalls: 6, maxDurationMs: 1_000 });
    ledger.reserve({ agents: 2, modelCalls: 2, tokens: 6_000, toolCalls: 6 });
    expect(() => ledger.reserve({ modelCalls: 1 })).toThrow(/model calls/);
  });
});
