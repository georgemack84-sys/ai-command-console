import { z } from "zod";
import type { WorkflowTemplateId } from "@/src/server/services/nuru-workflow-template-service";

export const runBudgetSchema = z.object({ maxAgents: z.number().int().positive(), maxModelCalls: z.number().int().positive(), maxTokens: z.number().int().positive(), maxToolCalls: z.number().int().nonnegative(), maxDurationMs: z.number().int().positive() });
export type RunBudget = z.infer<typeof runBudgetSchema>;
export type RunBudgetUsage = { agents: number; modelCalls: number; tokens: number; toolCalls: number; elapsedMs: number };

export const workflowRunBudgets: Record<WorkflowTemplateId, RunBudget> = {
  FAST_PATH: { maxAgents: 2, maxModelCalls: 4, maxTokens: 8_000, maxToolCalls: 12, maxDurationMs: 25_000 },
  STANDARD_PATH: { maxAgents: 4, maxModelCalls: 8, maxTokens: 20_000, maxToolCalls: 36, maxDurationMs: 45_000 },
  CONFLICT_PATH: { maxAgents: 4, maxModelCalls: 12, maxTokens: 28_000, maxToolCalls: 48, maxDurationMs: 60_000 },
  HIGH_AUTHORITY_PATH: { maxAgents: 4, maxModelCalls: 10, maxTokens: 24_000, maxToolCalls: 40, maxDurationMs: 50_000 },
};

/** Per-curation ledger. It only denies excess work; it never enlarges a budget. */
export class NuruRunBudgetLedger {
  private readonly startedAt = Date.now();
  private usage = { agents: 0, modelCalls: 0, tokens: 0, toolCalls: 0 };
  constructor(readonly budget: RunBudget) { runBudgetSchema.parse(budget); }
  reserve(input: { agents?: number; modelCalls?: number; tokens?: number; toolCalls?: number }) {
    const next = { agents: this.usage.agents + (input.agents ?? 0), modelCalls: this.usage.modelCalls + (input.modelCalls ?? 0), tokens: this.usage.tokens + (input.tokens ?? 0), toolCalls: this.usage.toolCalls + (input.toolCalls ?? 0) };
    if (Date.now() - this.startedAt > this.budget.maxDurationMs) throw new Error("Nuru run budget exceeded: duration.");
    if (next.agents > this.budget.maxAgents) throw new Error("Nuru run budget exceeded: agents.");
    if (next.modelCalls > this.budget.maxModelCalls) throw new Error("Nuru run budget exceeded: model calls.");
    if (next.tokens > this.budget.maxTokens) throw new Error("Nuru run budget exceeded: tokens.");
    if (next.toolCalls > this.budget.maxToolCalls) throw new Error("Nuru run budget exceeded: tool calls.");
    this.usage = next;
  }
  snapshot(): RunBudgetUsage { return { ...this.usage, elapsedMs: Date.now() - this.startedAt }; }
}

export const NuruRunBudgetService = { forTemplate(template: WorkflowTemplateId) { return new NuruRunBudgetLedger(workflowRunBudgets[template]); } };
