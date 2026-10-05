import { describe, expect, it, vi } from "vitest";
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: vi.fn(), update: vi.fn() }, nuruDiscoveryCandidate: { create: vi.fn(async () => ({ id: "candidate-1" })) } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
import { NuruDiscoveryAgent } from "@/src/server/services/nuru-discovery-agent";

describe("Nuru Discovery Agent", () => {
  it("submits a candidate rather than a canonical archive mutation", async () => {
    const result = await NuruDiscoveryAgent.discover({ title: "Service boundary", content: "Keep Archive and Search as deterministic services rather than agents.", source: { sourceType: "HUMAN_INPUT", origin: "Owner brief", authority: "OWNER" }, correlationId: "corr-discovery" });
    expect(result).toMatchObject({ status: "success", result: { id: "candidate-1", status: "CANDIDATE", initialType: "Architecture Decision" } });
  });
});
