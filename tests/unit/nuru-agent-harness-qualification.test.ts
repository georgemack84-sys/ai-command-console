import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: mocks.create, update: mocks.update } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));

import { NuruAgentRuntime } from "@/src/server/services/nuru-agent-runtime";

const tools = [{ name: "submit_discovery", resource: "knowledge" as const, action: "DISCOVER" as const, description: "Propose a discovery candidate" }];
const agent = { agentId: "nuru.discovery.v1" as const, agentType: "DISCOVERY", model: "test", modelVersion: "v1", promptVersion: "v1", policyVersion: "v1", allowedTools: ["submit_discovery"] };
const request = { objective: "Qualify the constrained agent harness", context: { itemId: "candidate-1" }, tokenBudget: 100, timeBudgetMs: 1_000, correlationId: "harness-correlation" };

describe("NRQ-12 agent harness qualification", () => {
  beforeEach(() => { mocks.create.mockReset(); mocks.update.mockReset(); mocks.audit.mockReset(); });

  it("exposes only declared tools and records a validated terminal result", async () => {
    const invoke = vi.fn(async () => ({ id: "candidate-1", status: "CANDIDATE" }));
    const runtime = new NuruAgentRuntime([agent], tools, undefined, { invoke });
    const result = await runtime.run(agent.agentId, request, async (context) => {
      expect(context.allowedTools.map((tool) => tool.name)).toEqual(["submit_discovery"]);
      await context.invokeTool("submit_discovery", { title: "candidate" });
      return { disposition: "candidate-only" };
    });
    expect(result).toMatchObject({ status: "success", result: { disposition: "candidate-only" } });
    expect(invoke).toHaveBeenCalledOnce();
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "AGENT_RESULT_RECEIVED", decision: "SUCCESS" }));
  });

  it("fails safely when an operation dependency is unavailable and preserves the failure audit", async () => {
    const runtime = new NuruAgentRuntime([agent], tools);
    const result = await runtime.run(agent.agentId, request, async () => { throw new Error("Embedding service unavailable."); });
    expect(result).toMatchObject({ status: "failure", error: "Embedding service unavailable." });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "failure" }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "AGENT_RESULT_RECEIVED", decision: "FAILURE", reason: "Embedding service unavailable." }));
  });

  it("fails closed when identity configuration names a tool that the harness does not expose", async () => {
    const runtime = new NuruAgentRuntime([{ ...agent, allowedTools: ["submit_discovery", "archive_canonical"] }], tools);
    const result = await runtime.run(agent.agentId, request, async () => ({ unreachable: true }));
    expect(result).toMatchObject({ status: "failure", error: "Agent declares unavailable tools: archive_canonical." });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ decision: "FAILURE", reason: expect.stringContaining("archive_canonical") }));
  });

  it("cannot invoke an undeclared canonical-mutation tool even when its operation requests one", async () => {
    const invoke = vi.fn();
    const runtime = new NuruAgentRuntime([agent], tools, undefined, { invoke });
    const result = await runtime.run(agent.agentId, request, async (context) => context.invokeTool("archive_canonical", { id: "canonical-1" }));
    expect(result.status).toBe("failure");
    expect(result.error).toMatch(/not declared/i);
    expect(invoke).not.toHaveBeenCalled();
  });
});
