import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), update: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruCurationQueue: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.update, findMany: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
import { classifyCurationLane, NuruCurationQueueService } from "@/src/server/services/nuru-curation-queue-service";

describe("Nuru curation queue", () => {
  it("classifies queue lanes without granting authority", () => {
    expect(classifyCurationLane({ confidence: 0.98, evidenceQuality: "STRONG", sourceAuthority: "OWNER", conflictDetected: false })).toBe("AUTO_ACCEPT_ELIGIBLE");
    expect(classifyCurationLane({ confidence: 0.98, evidenceQuality: "STRONG", sourceAuthority: "OWNER", conflictDetected: true })).toBe("CONFLICT_REVIEW");
  });

  it("enforces finite-state queue transitions", async () => {
    mocks.findUnique.mockResolvedValue({ id: "queue-1", candidateId: "D-114", status: "DISCOVERED" }); mocks.update.mockResolvedValue({ id: "queue-1", status: "TRIAGED" });
    await expect(NuruCurationQueueService.transition({ queueId: "queue-1", status: "TRIAGED", reason: "Candidate source was triaged.", actor: "nuru.curator.v1", correlationId: "queue-corr" })).resolves.toMatchObject({ status: "TRIAGED" });
    mocks.findUnique.mockResolvedValue({ id: "queue-1", candidateId: "D-114", status: "DISCOVERED" });
    await expect(NuruCurationQueueService.transition({ queueId: "queue-1", status: "ARCHIVED", reason: "Invalid shortcut.", actor: "nuru.curator.v1", correlationId: "queue-corr" })).rejects.toThrow("Invalid curation queue transition");
  });
});
