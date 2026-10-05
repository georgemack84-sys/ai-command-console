import { describe, expect, it, vi } from "vitest";
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruAgentRun: { create: vi.fn(), update: vi.fn() }, nuruContextAssessment: { create: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
import { NuruContextAgent } from "@/src/server/services/nuru-context-agent";

describe("Nuru Context Agent", () => {
  it("creates a schema-validated architecture context assessment", async () => {
    const result = await NuruContextAgent.assess({ candidateId: "candidate-1", title: "Boundary", content: "Nuru V1 keeps Archive and Search as services rather than agents. Curator coordinates the agents.", sourceOrigin: "Owner brief", correlationId: "corr-context" });
    expect(result).toMatchObject({ status: "success", result: { project: "Nuru", artifactType: "Architecture Decision", topic: "Agent / Service Boundary", scope: "Nuru V1", relatedComponents: expect.arrayContaining(["Curator"]), confidence: 0.96 } });
  });
});
