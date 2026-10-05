import { describe, expect, it, vi } from "vitest";
import { NuruToolRegistry, nuruToolDefinitions } from "@/src/server/services/nuru-tool-registry";

const invocation = { agentId: "nuru.discovery.v1", runId: "run-1", correlationId: "corr-1", objective: "Find relevant architecture knowledge." };

function dependencies() {
  return {
    search: { search: vi.fn().mockResolvedValue([{ id: "K-1", title: "Architecture" }]) }, archive: { retrieve: vi.fn(), history: vi.fn() }, metadata: vi.fn(), embeddings: { similar: vi.fn() },
    records: { submitContext: vi.fn(), submitConnections: vi.fn(), submitQuality: vi.fn(), relationshipHistory: vi.fn() }, audit: { record: vi.fn().mockResolvedValue({ id: "audit-1" }) },
    authorize: vi.fn().mockReturnValue({ allowed: true, reason: "test" }), now: vi.fn().mockReturnValue(1_000),
  };
}

describe("Nuru Tool Registry", () => {
  it("validates, permission-checks, rate-limits, and audits controlled tools", async () => {
    const services = dependencies(); const definition = nuruToolDefinitions.find((tool) => tool.name === "search_knowledge"); if (!definition) throw new Error("Missing search tool.");
    const registry = new NuruToolRegistry(services, [{ ...definition, rateLimit: { maxInvocations: 1, windowMs: 60_000 } }]);
    await expect(registry.invoke("search_knowledge", { query: "agent architecture", limit: 5 }, invocation)).resolves.toEqual([{ id: "K-1", title: "Architecture" }]);
    expect(services.authorize).toHaveBeenCalledWith(expect.objectContaining({ subject: "nuru.discovery.v1", action: "SEARCH" }));
    expect(services.audit.record).toHaveBeenCalledWith(expect.objectContaining({ operation: "TOOL_INVOKED", agentRunId: "run-1", resourceId: "search_knowledge" }));
    await expect(registry.invoke("search_knowledge", { query: "again" }, invocation)).rejects.toThrow("rate limit");
  });

  it("fails before execution when an agent is denied or input is invalid", async () => {
    const services = dependencies(); services.authorize.mockReturnValue({ allowed: false, reason: "not granted" }); const definition = nuruToolDefinitions.find((tool) => tool.name === "search_knowledge"); if (!definition) throw new Error("Missing search tool.");
    const registry = new NuruToolRegistry(services, [definition]);
    await expect(registry.invoke("search_knowledge", { query: "valid" }, invocation)).rejects.toThrow("permission denied"); expect(services.search.search).not.toHaveBeenCalled();
    services.authorize.mockReturnValue({ allowed: true, reason: "granted" });
    await expect(registry.invoke("search_knowledge", { limit: 0 }, invocation)).rejects.toThrow(); expect(services.search.search).not.toHaveBeenCalled();
  });
});
