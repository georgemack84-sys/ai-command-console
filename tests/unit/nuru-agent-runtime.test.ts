import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: vi.fn(), update: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));

import { NuruAgentRuntime } from "@/src/server/services/nuru-agent-runtime";

const tools = [{ name: "search_knowledge", resource: "knowledge" as const, action: "SEARCH" as const, description: "Search candidates" }];
const agents = [{ agentId: "nuru.discovery.v1" as const, agentType: "DISCOVERY", model: "test", modelVersion: "v1", promptVersion: "v1", policyVersion: "v1", allowedTools: ["search_knowledge"] }];

describe("Nuru Agent Runtime", () => {
  it("runs an agent with a bounded, permission-checked execution context", async () => {
    const runtime = new NuruAgentRuntime(agents, tools);
    const result = await runtime.run("nuru.discovery.v1", { objective: "Find architecture candidates", context: { itemId: "K-1" }, tokenBudget: 1000, timeBudgetMs: 1000, correlationId: "corr-1" }, async (context) => ({ tools: context.allowedTools.map((tool) => tool.name) }));
    expect(result).toMatchObject({ status: "success", result: { tools: ["search_knowledge"] }, modelRoute: { tier: "FAST" } });
  });

  it("fails closed for unknown agents", async () => {
    const runtime = new NuruAgentRuntime(agents, tools);
    expect((await runtime.run("nuru.unknown.v1", { objective: "Do work", context: {}, tokenBudget: 1, timeBudgetMs: 1, correlationId: "corr-2" }, async () => "nope")).status).toBe("failure");
  });

  it("rejects malformed agent output before it is recorded as a successful run", async () => {
    const runtime = new NuruAgentRuntime(agents, tools);
    const result = await runtime.run("nuru.discovery.v1", { objective: "Find architecture candidates", context: {}, tokenBudget: 100, timeBudgetMs: 1_000, correlationId: "corr-3" }, async () => ({ confidence: "high" }), z.object({ confidence: z.number().min(0).max(1) }));
    expect(result.status).toBe("invalid_output");
  });
});
